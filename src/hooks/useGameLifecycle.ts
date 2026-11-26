import React from 'react';
import {
  BoardTile,
  BreakingNewsEvent,
  DilemmaCard,
  GameLogItem,
  GameMode,
  Player,
} from '../types/game';
import { PERIMETER_TILES, CORRUPTION_ROUTE_TILES } from '../data/tiles';
import { CHARACTER_ARCHETYPES } from '../data/characters';
import { TradeOffer, applyTradeOffer } from '../engine/trade';
import { soundManager } from '../utils/sound';
import { GameAction } from '../context/GameContext';
import { DrawCardEventState, RentCrisisState } from '../components/GameModals';
import { DiceRollAnimationState, PsychologistNoticeState } from './useBoardMovement';
import { MonthNoticeState } from './usePoliticsAndTurn';

export interface EliminationNoticeState {
  player: Player;
  cause: string;
  remainingCount: number;
}

interface UseGameLifecycleParams {
  players: Player[];
  perimeterTiles: BoardTile[];
  gameMode: GameMode;
  moveTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  dispatch: React.Dispatch<GameAction>;
  resetPersistenceForNewGame: () => void;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setPerimeterTiles: React.Dispatch<React.SetStateAction<BoardTile[]>>;
  setCorruptionTiles: React.Dispatch<React.SetStateAction<BoardTile[]>>;
  setActivePlayerIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsSetupOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  setGameOverReason: React.Dispatch<React.SetStateAction<string>>;
  setHasRolled: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRolling: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMoving: React.Dispatch<React.SetStateAction<boolean>>;
  setLastRoll: React.Dispatch<React.SetStateAction<{ d1: number; d2: number; total: number } | null>>;
  setDiceRollAnimation: React.Dispatch<React.SetStateAction<DiceRollAnimationState | null>>;
  setShowTradeModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEliminationNotice: React.Dispatch<React.SetStateAction<EliminationNoticeState | null>>;
  setPsychologistNotice: React.Dispatch<React.SetStateAction<PsychologistNoticeState | null>>;
  setMonthNotice: React.Dispatch<React.SetStateAction<MonthNoticeState | null>>;
  setRentCrisis: React.Dispatch<React.SetStateAction<RentCrisisState | null>>;
  setActiveDilemmaCard: React.Dispatch<React.SetStateAction<DilemmaCard | null>>;
  setActiveDrawCardEvent: React.Dispatch<React.SetStateAction<DrawCardEventState | null>>;
  setShowCorruptionGate: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCorruptionAudit: React.Dispatch<React.SetStateAction<boolean>>;
  setShowKpkBribe: React.Dispatch<React.SetStateAction<boolean>>;
  setShowParliament: React.Dispatch<React.SetStateAction<boolean>>;
  setShowLogsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setIsStatsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedTile: React.Dispatch<React.SetStateAction<BoardTile | null>>;
  setCurrentNews: React.Dispatch<React.SetStateAction<BreakingNewsEvent | null>>;
  addLog: (message: string, type?: GameLogItem['type'], playerId?: string) => void;
}

export function useGameLifecycle({
  players,
  perimeterTiles,
  gameMode,
  moveTimerRef,
  dispatch,
  resetPersistenceForNewGame,
  setPlayers,
  setPerimeterTiles,
  setCorruptionTiles,
  setActivePlayerIndex,
  setIsSetupOpen,
  setIsGameOver,
  setGameOverReason,
  setHasRolled,
  setIsRolling,
  setIsMoving,
  setLastRoll,
  setDiceRollAnimation,
  setShowTradeModal,
  setEliminationNotice,
  setPsychologistNotice,
  setMonthNotice,
  setRentCrisis,
  setActiveDilemmaCard,
  setActiveDrawCardEvent,
  setShowCorruptionGate,
  setShowCorruptionAudit,
  setShowKpkBribe,
  setShowParliament,
  setShowLogsModal,
  setIsStatsOpen,
  setSelectedTile,
  setCurrentNews,
  addLog,
}: UseGameLifecycleParams) {
  const clearTurnAndOverlayState = (includeNews: boolean) => {
    setHasRolled(false);
    setIsRolling(false);
    setIsMoving(false);
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    setLastRoll(null);
    setDiceRollAnimation(null);
    setEliminationNotice(null);
    setPsychologistNotice(null);
    setMonthNotice(null);
    setRentCrisis(null);
    setActiveDilemmaCard(null);
    setActiveDrawCardEvent(null);
    setShowCorruptionGate(false);
    setShowCorruptionAudit(false);
    setShowKpkBribe(false);
    setShowParliament(false);
    setShowLogsModal(false);
    setIsStatsOpen(false);
    setSelectedTile(null);
    if (includeNews) {
      setCurrentNews(null);
    }
  };

  // Eksekusi negosiasi barter properti antar pemain
  const handleExecuteTrade = (offer: TradeOffer) => {
    const { players: nextPlayers, perimeterTiles: nextTiles } = applyTradeOffer(
      offer,
      players,
      perimeterTiles
    );
    setPlayers(() => nextPlayers);
    setPerimeterTiles(() => nextTiles);
    const proposer = players.find(p => p.id === offer.proposerId);
    const target = players.find(p => p.id === offer.targetId);
    addLog(
      `💼 DEAL BARTER! ${proposer?.name ?? 'Pemain'} & ${target?.name ?? 'Pemain'} menyelesaikan kesepakatan properti.`,
      'CASH',
      offer.proposerId
    );
    setShowTradeModal(false);
    soundManager.playVictory();
  };

  // Initialize game from Setup Modal (Survival or Fast Mode)
  const handleStartGame = (configuredPlayers: Player[], selectedMode: GameMode = gameMode) => {
    resetPersistenceForNewGame();
    dispatch({ type: 'INIT_GAME', players: configuredPlayers, gameMode: selectedMode });
    clearTurnAndOverlayState(true);

    soundManager.playVictory();
    addLog(
      selectedMode === 'FAST'
        ? `Mode Cepat (15 Putaran) dimulai dengan ${configuredPlayers.length} pemain! Kekayaan bersih tertinggi di akhir Putaran #15 menang!`
        : `Pertarungan Survival WNI dimulai dengan ${configuredPlayers.length} pemain! Kemenangan sejati adalah siapa yang mampu bertahan hidup paling lama!`,
      'SYSTEM'
    );
  };

  // Handler to start a new round / reset game via Setup Modal
  const handleRestartNewRound = () => {
    setIsGameOver(false);
    setGameOverReason('');
    setPerimeterTiles(PERIMETER_TILES.map(t => ({ ...t, ownerId: null, level: 1 })));
    setCorruptionTiles(CORRUPTION_ROUTE_TILES.map(t => ({ ...t })));
    clearTurnAndOverlayState(false);
    setIsSetupOpen(true);
  };

  // Quick restart with the same players reinitialized to archetype starting stats
  const handleQuickRestart = () => {
    setIsGameOver(false);
    setGameOverReason('');

    const reinitializedPlayers: Player[] = players.map((p, idx) => {
      const arch =
        CHARACTER_ARCHETYPES.find(a => a.id === p.archetypeId) ||
        CHARACTER_ARCHETYPES[idx % CHARACTER_ARCHETYPES.length];
      return {
        ...p,
        position: 0,
        cash: arch.startingCash,
        stress: arch.startingStress,
        politicalInfluence: arch.startingInfluence,
        ownedProperties: [],
        inJail: false,
        jailTurnsLeft: 0,
        isInCorruptionRoute: false,
        kpkSuspicionLevel: 10,
        isBankrupt: false,
        specialCards: [],
        konohaBuffs: [],
        stats: {
          totalRentEarned: 0,
          totalRentPaid: 0,
          totalCorruptionGains: 0,
          cardsDrawn: 0,
          timesInJail: 0,
        },
      };
    });

    handleStartGame(reinitializedPlayers);
  };

  // Bankruptcy & Elimination Handler
  const handlePlayerBankruptcy = (player: Player, cause: string) => {
    soundManager.playBuzzer();

    setPlayers(prev =>
      prev.map(p => {
        if (p.id !== player.id) return p;
        return {
          ...p,
          isBankrupt: true,
          cash: 0,
          ownedProperties: [],
        };
      })
    );

    setPerimeterTiles(prev =>
      prev.map(t => (player.ownedProperties.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t))
    );

    addLog(
      `🚨 KEBANGKRUTAN TOTAL! ${player.name} gugur akibat: ${cause}. Seluruh aset disita & dilelang kembali ke pasar!`,
      'DANGER',
      player.id
    );

    setTimeout(() => {
      setPlayers(currentPlayers => {
        const remaining = currentPlayers.filter(p => !p.isBankrupt);
        setEliminationNotice({
          player,
          cause,
          remainingCount: remaining.length,
        });

        if (remaining.length <= 1) {
          const survivor = remaining[0] || player;
          setIsGameOver(true);
          setGameOverReason(
            `Kemenangan Sejati! ${survivor.name} adalah satu-satunya penyintas yang berhasil bertahan hidup paling lama saat seluruh lawan tersingkir!`
          );
        } else {
          setActivePlayerIndex(currentIdx => {
            if (currentPlayers[currentIdx]?.isBankrupt) {
              let nextAlive = (currentIdx + 1) % currentPlayers.length;
              let count = 0;
              while (currentPlayers[nextAlive]?.isBankrupt && count < currentPlayers.length) {
                nextAlive = (nextAlive + 1) % currentPlayers.length;
                count++;
              }
              setHasRolled(false);
              setLastRoll(null);
              return nextAlive;
            }
            return currentIdx;
          });
        }
        return currentPlayers;
      });
    }, 400);
  };

  return {
    handleExecuteTrade,
    handleStartGame,
    handleRestartNewRound,
    handleQuickRestart,
    handlePlayerBankruptcy,
  };
}
