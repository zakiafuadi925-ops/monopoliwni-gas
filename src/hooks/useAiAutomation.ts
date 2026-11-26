import React, { useEffect } from 'react';
import {
  BoardTile,
  DilemmaCard,
  GameLogItem,
  MacroEconomy,
  Player,
} from '../types/game';
import { LAW_PROPOSALS, LawProposal } from '../data/laws';
import {
  chooseAiDilemmaOption,
  chooseAiParliamentProposal,
  shouldAiBuyProperty,
  shouldAiEnterCorruptionRoute,
  shouldAiPayJailBribe,
} from '../engine/ai';
import { DrawCardEventState, RentCrisisState } from '../components/GameModals';
import { RentTransferData } from '../components/ManualRentPaymentModal';

interface UseAiAutomationParams {
  isSetupOpen: boolean;
  isGameOver: boolean;
  activePlayer: Player | null;
  activePlayerIndex: number;
  players: Player[];
  perimeterTiles: BoardTile[];
  corruptionTiles: BoardTile[];
  luxuryTiles: BoardTile[];
  macro: MacroEconomy;
  hasRolled: boolean;
  isRolling: boolean;
  isMoving: boolean;
  activeDrawCardEvent: DrawCardEventState | null;
  activeDrawCardEventRef: React.MutableRefObject<DrawCardEventState | null>;
  activeDilemmaCard: DilemmaCard | null;
  showCorruptionGate: boolean;
  showCorruptionAudit: boolean;
  showMoneyLaundering: boolean;
  showKpkBribe: boolean;
  showParliament: boolean;
  manualRentData: RentTransferData | null;
  rentCrisis: RentCrisisState | null;
  aiEndTurnTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  pace: (ms: number) => number;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setShowParliament: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCorruptionGate: React.Dispatch<React.SetStateAction<boolean>>;
  addLog: (message: string, type?: GameLogItem['type'], playerId?: string) => void;
  onRollDice: (d1: number, d2: number, total: number) => void;
  onBuyProperty: () => void;
  onPayJailBribe: () => void;
  onChooseCardOption: (optionKey: 'optionA' | 'optionB') => void;
  onPassLaw: (proposal: LawProposal, coalitionPartner?: Player) => void;
  onEndTurn: () => void;
}

export function useAiAutomation({
  isSetupOpen,
  isGameOver,
  activePlayer,
  activePlayerIndex,
  players,
  perimeterTiles,
  corruptionTiles,
  luxuryTiles,
  macro,
  hasRolled,
  isRolling,
  isMoving,
  activeDrawCardEvent,
  activeDrawCardEventRef,
  activeDilemmaCard,
  showCorruptionGate,
  showCorruptionAudit,
  showMoneyLaundering,
  showKpkBribe,
  showParliament,
  manualRentData,
  rentCrisis,
  aiEndTurnTimerRef,
  pace,
  setPlayers,
  setShowParliament,
  setShowCorruptionGate,
  addLog,
  onRollDice,
  onBuyProperty,
  onPayJailBribe,
  onChooseCardOption,
  onPassLaw,
  onEndTurn,
}: UseAiAutomationParams) {
  const isTurnBlocked = Boolean(
    isRolling ||
      isMoving ||
      activeDrawCardEvent ||
      activeDrawCardEventRef.current ||
      activeDilemmaCard ||
      showCorruptionGate ||
      showCorruptionAudit ||
      showMoneyLaundering ||
      showKpkBribe ||
      showParliament ||
      manualRentData ||
      rentCrisis
  );

  // Bot AI Automation effect
  useEffect(() => {
    if (isSetupOpen || isGameOver || !activePlayer || !activePlayer.isAi || activePlayer.isBankrupt)
      return;
    if (isTurnBlocked) return;

    const aiTimer = setTimeout(() => {
      if (!hasRolled && !activePlayer.inJail) {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        onRollDice(d1, d2, d1 + d2);
      } else if (hasRolled) {
        const allTiles = [...perimeterTiles, ...corruptionTiles, ...luxuryTiles];
        const curTile = allTiles.find(t => t.id === activePlayer.position);

        if (curTile && shouldAiBuyProperty(activePlayer, curTile, macro)) {
          onBuyProperty();
        }

        if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
        aiEndTurnTimerRef.current = setTimeout(() => {
          onEndTurn();
        }, pace(1100));
      } else if (activePlayer.inJail) {
        if (shouldAiPayJailBribe(activePlayer)) {
          onPayJailBribe();
        }
        if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
        aiEndTurnTimerRef.current = setTimeout(() => {
          onEndTurn();
        }, pace(1000));
      }
    }, pace(1100));

    return () => {
      clearTimeout(aiTimer);
      if (aiEndTurnTimerRef.current) {
        clearTimeout(aiEndTurnTimerRef.current);
      }
    };
  }, [
    activePlayerIndex,
    hasRolled,
    isSetupOpen,
    isGameOver,
    activePlayer,
    isTurnBlocked,
  ]);

  // AI Turn Conclusion Watchdog
  useEffect(() => {
    if (!activePlayer || !activePlayer.isAi || activePlayer.isBankrupt || !hasRolled) return;
    if (isTurnBlocked) return;

    const watchdogTimer = setTimeout(() => {
      onEndTurn();
    }, pace(2400));

    return () => clearTimeout(watchdogTimer);
  }, [activePlayerIndex, hasRolled, isTurnBlocked, activePlayer]);

  // Handle AI Dilemma Card Auto-Select
  useEffect(() => {
    if (activeDilemmaCard && activePlayer?.isAi) {
      const timer = setTimeout(() => {
        onChooseCardOption(chooseAiDilemmaOption(activePlayer));
      }, pace(1400));
      return () => clearTimeout(timer);
    }
  }, [activeDilemmaCard, activePlayer]);

  // Handle AI Parliament & Coalition Bill Auto-Passing
  useEffect(() => {
    if (showParliament && activePlayer?.isAi) {
      const timer = setTimeout(() => {
        const decision = chooseAiParliamentProposal(activePlayer, players, LAW_PROPOSALS);
        if (decision) {
          onPassLaw(decision.proposal, decision.coalitionPartner);
          setTimeout(() => onEndTurn(), pace(1400));
          return;
        }

        setShowParliament(false);
        addLog(
          `${activePlayer.name} (AI) meninggalkan Sidang Paripurna tanpa mengesahkan RUU karena modal politik belum mencukupi.`,
          'INFO',
          activePlayer.id
        );
        setTimeout(() => onEndTurn(), pace(1200));
      }, pace(1600));

      return () => clearTimeout(timer);
    }
  }, [showParliament, activePlayer, players]);

  // Handle AI Corruption Gate Auto-Select
  useEffect(() => {
    if (showCorruptionGate && activePlayer?.isAi) {
      const timer = setTimeout(() => {
        if (shouldAiEnterCorruptionRoute(activePlayer)) {
          setPlayers(prev =>
            prev.map(p =>
              p.id === activePlayer.id
                ? {
                    ...p,
                    isInCorruptionRoute: true,
                    position: 100,
                  }
                : p
            )
          );
          addLog(
            `${activePlayer.name} memutuskan masuk Rute Korupsi!`,
            'DANGER',
            activePlayer.id
          );
        } else {
          addLog(`${activePlayer.name} memilih jalur aman rakyat jelata.`, 'INFO', activePlayer.id);
        }
        setShowCorruptionGate(false);
        setTimeout(() => {
          onEndTurn();
        }, pace(1100));
      }, pace(1100));
      return () => clearTimeout(timer);
    }
  }, [showCorruptionGate, activePlayer]);
}
