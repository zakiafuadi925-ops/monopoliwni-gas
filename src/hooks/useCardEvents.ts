import React from 'react';
import {
  ActiveLaw,
  BoardTile,
  BreakingNewsEvent,
  DilemmaCard,
  EventOutcomeCard,
  GameLogItem,
  KonohaMacroBuff,
  MacroEconomy,
  MacroHistoryPoint,
  Player,
  SpecialCardItem,
} from '../types/game';
import { calculatePropertySellValue } from '../engine/economy';
import { formatRupiah } from '../utils/format';
import { DrawCardEventState, RentCrisisState } from '../components/GameModals';

interface UseCardEventsParams {
  activePlayer: Player | null;
  activePlayerIndex: number;
  players: Player[];
  perimeterTiles: BoardTile[];
  macro: MacroEconomy;
  activeLaws: ActiveLaw[];
  cycleRound: number;
  activeDilemmaCard: DilemmaCard | null;
  activeDrawCardEvent: DrawCardEventState | null;
  activeDrawCardEventRef: React.MutableRefObject<DrawCardEventState | null>;
  aiEndTurnTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setPerimeterTiles: React.Dispatch<React.SetStateAction<BoardTile[]>>;
  setMacro: React.Dispatch<React.SetStateAction<MacroEconomy>>;
  setMacroHistory: React.Dispatch<React.SetStateAction<MacroHistoryPoint[]>>;
  setCurrentNews: React.Dispatch<React.SetStateAction<BreakingNewsEvent | null>>;
  setActiveDilemmaCard: React.Dispatch<React.SetStateAction<DilemmaCard | null>>;
  setActiveDrawCardEvent: React.Dispatch<React.SetStateAction<DrawCardEventState | null>>;
  setRentCrisis: React.Dispatch<React.SetStateAction<RentCrisisState | null>>;
  addLog: (message: string, type?: GameLogItem['type'], playerId?: string) => void;
  checkStressThreshold: (player: Player) => boolean;
  onPlayerBankruptcy: (player: Player, cause: string) => void;
  onEndTurn: () => void;
}

export function useCardEvents({
  activePlayer,
  activePlayerIndex,
  players,
  perimeterTiles,
  macro,
  activeLaws,
  cycleRound,
  activeDilemmaCard,
  activeDrawCardEvent,
  activeDrawCardEventRef,
  aiEndTurnTimerRef,
  setPlayers,
  setPerimeterTiles,
  setMacro,
  setMacroHistory,
  setCurrentNews,
  setActiveDilemmaCard,
  setActiveDrawCardEvent,
  setRentCrisis,
  addLog,
  checkStressThreshold,
  onPlayerBankruptcy,
  onEndTurn,
}: UseCardEventsParams) {
  const scheduleAiEndTurn = (delayMs: number) => {
    if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
    aiEndTurnTimerRef.current = setTimeout(() => {
      onEndTurn();
    }, delayMs);
  };

  // Resolve Dilemma Card
  const handleChooseCardOption = (optionKey: 'optionA' | 'optionB') => {
    if (!activeDilemmaCard || !activePlayer || activePlayer.isBankrupt) return;

    const chosenOption = activeDilemmaCard[optionKey];
    if (chosenOption) {
      const stateContext = {
        players,
        activePlayerIndex,
        macro,
        tiles: perimeterTiles,
        activeLaws,
        round: cycleRound,
        maxRounds: 999,
        addLog,
        triggerBreakingNews: (news: BreakingNewsEvent) => setCurrentNews(news),
      };

      chosenOption.apply(activePlayer, stateContext);

      if (activePlayer.cash < 0) {
        const deficit = Math.abs(activePlayer.cash);
        const ownedTiles = perimeterTiles.filter(t => t.ownerId === activePlayer.id);
        const totalLiquidation = ownedTiles.reduce(
          (sum, t) => sum + calculatePropertySellValue(t, macro),
          0
        );

        if (activePlayer.isAi) {
          if (totalLiquidation >= deficit) {
            let currentCash = activePlayer.cash;
            const soldPropertyIds: number[] = [];
            const soldPropertyTitles: string[] = [];
            for (const prop of ownedTiles) {
              if (currentCash >= 0) break;
              const sellVal = calculatePropertySellValue(prop, macro);
              currentCash += sellVal;
              soldPropertyIds.push(prop.id);
              soldPropertyTitles.push(prop.name);
            }
            setPerimeterTiles(prev =>
              prev.map(t => (soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t))
            );
            addLog(
              `${activePlayer.name} (AI) menjual aset (${soldPropertyTitles.join(', ')}) seharga ${formatRupiah(currentCash - activePlayer.cash)} untuk memulihkan saldo akibat Dilema!`,
              'DANGER',
              activePlayer.id
            );
            setPlayers(prev =>
              prev.map(p =>
                p.id === activePlayer.id
                  ? {
                      ...p,
                      cash: currentCash,
                      ownedProperties: p.ownedProperties.filter(id => !soldPropertyIds.includes(id)),
                    }
                  : p
              )
            );
          } else {
            onPlayerBankruptcy(activePlayer, 'Konsekuensi Finansial Kartu Dilema Konoha');
          }
        } else {
          setRentCrisis({
            crisisType: 'DEBT',
            payer: { ...activePlayer, cash: 0 },
            amountDue: deficit,
            title: activeDilemmaCard?.title || 'Dilema Konoha',
            subtitle: 'KRISIS KAS TUNAI · KONSEKUENSI DILEMA',
            description: `Pilihan Dilema Konoha membebani kas sebesar ${formatRupiah(deficit)}. Saldo kas Anda minus! Jual aset tanah untuk melunasi utang ini.`,
            causeDesc: 'konsekuensi finansial kartu Dilema',
            recipientName: 'Kas Negara & Risiko Kebijakan',
            recipientAvatar: '⚖️',
            onPaySuccess: updatedPayer => {
              setPlayers(prev =>
                prev.map(p =>
                  p.id === updatedPayer.id
                    ? {
                        ...p,
                        cash: p.cash - deficit,
                      }
                    : p
                )
              );
              addLog(
                `✅ ${updatedPayer.name} melunasi kewajiban akibat Dilema Konoha sebesar ${formatRupiah(deficit)}!`,
                'CASH',
                updatedPayer.id
              );
            },
          });
        }
      } else {
        checkStressThreshold(activePlayer);
      }

      setPlayers([...players]);
    }

    setActiveDilemmaCard(null);

    if (activePlayer?.isAi) {
      setTimeout(() => {
        onEndTurn();
      }, 1200);
    }
  };

  // Handle outcome from 3D DrawCardModal (Musibah / Takdir with 3-tier dice roll)
  const handleConfirmDrawCardOutcome = (outcome: {
    card: EventOutcomeCard;
    diceValue: number;
    confiscatedTile: BoardTile | null;
    usedSpecialCardId?: string;
  }) => {
    const targetId =
      activeDrawCardEvent?.targetPlayer?.id ||
      activeDrawCardEventRef.current?.targetPlayer?.id ||
      activePlayer?.id;
    const target =
      players.find(p => p.id === targetId) ||
      activeDrawCardEvent?.targetPlayer ||
      activeDrawCardEventRef.current?.targetPlayer ||
      activePlayer;
    if (!target) return;
    const { card, confiscatedTile, usedSpecialCardId } = outcome;

    if (confiscatedTile) {
      setPerimeterTiles(prev =>
        prev.map(t => (t.id === confiscatedTile.id ? { ...t, ownerId: null, level: 1 } : t))
      );
      addLog(
        `🚨 SITA NEGARA! Surat Tanah ${confiscatedTile.certificateTitle || confiscatedTile.name} milik ${target.name} resmi dicabut & disita oleh Satgas BPN!`,
        'DANGER',
        target.id
      );
    }

    if (usedSpecialCardId) {
      addLog(
        `🛡️ KARTU SAKTI AKTIF! ${target.name} menggunakan kartu proteksi ordal sehingga selamat dari penyitaan tanah!`,
        'POLITIC',
        target.id
      );
    }

    let netCashChange = 0;
    if (card.cashChange < 0) {
      if (confiscatedTile) {
        netCashChange = 0;
      } else {
        const inflationFactor = 1 + macro.inflationRate / 100;
        netCashChange = Math.round(card.cashChange * inflationFactor);
      }
    } else {
      netCashChange = card.cashChange;
    }

    const specialReward = card.specialRewardCard;

    if (netCashChange < 0) {
      const penalty = Math.abs(netCashChange);
      if (target.cash < penalty) {
        if (target.isAi) {
          const aiOwnedTiles = perimeterTiles.filter(t => t.ownerId === target.id);
          let currentCash = target.cash;
          const soldPropertyIds: number[] = [];
          const soldPropertyTitles: string[] = [];
          for (const prop of aiOwnedTiles) {
            if (currentCash >= penalty) break;
            const sellVal = calculatePropertySellValue(prop, macro);
            currentCash += sellVal;
            soldPropertyIds.push(prop.id);
            soldPropertyTitles.push(prop.name);
          }

          if (currentCash >= penalty) {
            setPerimeterTiles(prev =>
              prev.map(t => (soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t))
            );
            addLog(
              `${target.name} (AI) terpaksa menjual aset (${soldPropertyTitles.join(', ')}) seharga ${formatRupiah(currentCash - target.cash)} untuk melunasi kerugian ${card.title}!`,
              'DANGER',
              target.id
            );

            setPlayers(prev =>
              prev.map(p => {
                if (p.id === target.id) {
                  let updatedProps = p.ownedProperties.filter(id => !soldPropertyIds.includes(id));
                  if (confiscatedTile) updatedProps = updatedProps.filter(id => id !== confiscatedTile.id);
                  const updatedSpecialCards = [...(p.specialCards || [])];
                  if (usedSpecialCardId) {
                    const idx = updatedSpecialCards.findIndex(c => c.id === usedSpecialCardId);
                    if (idx !== -1) updatedSpecialCards.splice(idx, 1);
                  }
                  if (specialReward) {
                    updatedSpecialCards.push({
                      ...specialReward,
                      id: `${specialReward.id}_${Date.now()}`,
                    });
                  }
                  const updatedPlayer: Player = {
                    ...p,
                    cash: currentCash - penalty,
                    stress: Math.min(100, Math.max(0, p.stress + card.stressChange)),
                    politicalInfluence: Math.min(
                      100,
                      Math.max(0, p.politicalInfluence + (card.politicalChange || 0))
                    ),
                    ownedProperties: updatedProps,
                    specialCards: updatedSpecialCards,
                    stats: { ...p.stats, cardsDrawn: p.stats.cardsDrawn + 1 },
                  };
                  checkStressThreshold(updatedPlayer);
                  return updatedPlayer;
                }
                return p;
              })
            );
            activeDrawCardEventRef.current = null;
            setActiveDrawCardEvent(null);
            if (target.isAi) scheduleAiEndTurn(1400);
            return;
          } else {
            onPlayerBankruptcy(
              target,
              `Bangkrut tidak sanggup membayar kerugian ${card.title} (${formatRupiah(penalty)})`
            );
            activeDrawCardEventRef.current = null;
            setActiveDrawCardEvent(null);
            if (target.isAi) scheduleAiEndTurn(1400);
            return;
          }
        } else {
          setRentCrisis({
            crisisType: 'EVENT_LOSS',
            payer: target,
            amountDue: penalty,
            title: card.title,
            subtitle: 'KRISIS KAS TUNAI · PEMBAYARAN KERUGIAN PERISTIWA',
            description: `${card.description} Kerugian sebesar ${formatRupiah(penalty)} wajib dilunasi! Kas tunai Anda tidak mencukupi, silakan jual aset tanah Anda untuk menutup kerugian ini.`,
            causeDesc: `kerugian ${card.title}`,
            recipientName: card.categoryBadge || 'Kas Darurat & Derek Tol',
            recipientAvatar: card.icon || '🚗',
            onPaySuccess: updatedPayer => {
              setPlayers(prev =>
                prev.map(p => {
                  if (p.id === updatedPayer.id) {
                    let updatedProps = p.ownedProperties;
                    if (confiscatedTile) {
                      updatedProps = updatedProps.filter(id => id !== confiscatedTile.id);
                    }
                    const updatedSpecialCards = [...(p.specialCards || [])];
                    if (usedSpecialCardId) {
                      const idx = updatedSpecialCards.findIndex(c => c.id === usedSpecialCardId);
                      if (idx !== -1) updatedSpecialCards.splice(idx, 1);
                    }
                    if (specialReward) {
                      updatedSpecialCards.push({
                        ...specialReward,
                        id: `${specialReward.id}_${Date.now()}`,
                      });
                    }
                    const finalPlayer: Player = {
                      ...p,
                      cash: p.cash - penalty,
                      stress: Math.min(100, Math.max(0, p.stress + card.stressChange)),
                      politicalInfluence: Math.min(
                        100,
                        Math.max(0, p.politicalInfluence + (card.politicalChange || 0))
                      ),
                      ownedProperties: updatedProps,
                      specialCards: updatedSpecialCards,
                      stats: { ...p.stats, cardsDrawn: p.stats.cardsDrawn + 1 },
                    };
                    checkStressThreshold(finalPlayer);
                    return finalPlayer;
                  }
                  return p;
                })
              );
              addLog(
                `✅ ${updatedPayer.name} berhasil melunasi kerugian ${card.title} sebesar ${formatRupiah(penalty)}!`,
                'CASH',
                updatedPayer.id
              );
            },
          });
          activeDrawCardEventRef.current = null;
          setActiveDrawCardEvent(null);
          return;
        }
      }
    }

    // Apply Kartu Takdir Konoha Permanent Macroeconomic Buff
    let konohaBuffInstance: KonohaMacroBuff | null = null;
    if (card.isKonohaCard && card.konohaBuffConfig) {
      const cfg = card.konohaBuffConfig;
      let newInflation = Number((macro.inflationRate + cfg.inflationDelta).toFixed(1));
      newInflation = Math.max(2.0, Math.min(22.0, newInflation));

      let newBiRate = Number((macro.biRate + cfg.biRateDelta).toFixed(2));
      newBiRate = Math.max(3.0, Math.min(12.0, newBiRate));

      let newUsd = macro.usdIdrRate + (cfg.usdIdrDelta || 0);
      newUsd = Math.max(14000, Math.min(19000, newUsd));

      let newTrend = macro.trend;
      if (newInflation > 10.0) newTrend = 'CRISIS';
      else if (newInflation > 7.0) newTrend = 'VOLATILE';
      else if (cfg.inflationDelta > 0.5) newTrend = 'RISING';
      else newTrend = 'STABLE';

      konohaBuffInstance = {
        id: `buff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        cardId: card.id,
        cardTitle: card.title,
        cardIcon: card.icon,
        drawnByPlayerId: target.id,
        drawnByPlayerName: target.name,
        drawnByPlayerColor: target.color,
        type: cfg.type,
        inflationDelta: cfg.inflationDelta,
        biRateDelta: cfg.biRateDelta,
        usdIdrDelta: cfg.usdIdrDelta,
        buffName: cfg.buffName,
        buffEffectDesc: cfg.buffEffectDesc,
        playerPerkText: cfg.playerPerkText,
        timestamp: `Putaran #${cycleRound}`,
      };

      setMacro(prev => ({
        ...prev,
        inflationRate: newInflation,
        biRate: newBiRate,
        usdIdrRate: newUsd,
        trend: newTrend,
        activeKonohaBuffs: [...(prev.activeKonohaBuffs || []), konohaBuffInstance!],
      }));

      setMacroHistory(prev => [
        ...prev,
        {
          round: cycleRound,
          label: `P${cycleRound}🍃`,
          fullPeriod: `Putaran ${cycleRound} · Takdir Konoha (${cfg.buffName})`,
          inflationRate: newInflation,
          usdIdrRate: newUsd,
          biRate: newBiRate,
          trend: newTrend,
          note: `🍃 Takdir Konoha: ${cfg.buffName}`,
        },
      ]);

      const infChangeStr =
        cfg.inflationDelta > 0 ? `+${cfg.inflationDelta}%` : `${cfg.inflationDelta}%`;
      const biChangeStr = cfg.biRateDelta > 0 ? `+${cfg.biRateDelta}%` : `${cfg.biRateDelta}%`;

      addLog(
        `🍃 TAKDIR KONOHA DIAKTIFKAN: ${target.name} menarik '${card.title}'! Buff makroekonomi permanen diterapkan: Inflasi ${infChangeStr} (kini ${newInflation}%), BI-Rate ${biChangeStr} (kini ${newBiRate}%). Perk: ${cfg.playerPerkText}`,
        'POLITIC',
        target.id
      );
    }

    setPlayers(prev =>
      prev.map(p => {
        if (p.id === target.id) {
          let updatedProps = p.ownedProperties;
          if (confiscatedTile) {
            updatedProps = updatedProps.filter(id => id !== confiscatedTile.id);
          }

          const updatedSpecialCards = [...(p.specialCards || [])];
          if (usedSpecialCardId) {
            const idx = updatedSpecialCards.findIndex(c => c.id === usedSpecialCardId);
            if (idx !== -1) updatedSpecialCards.splice(idx, 1);
          }
          if (specialReward) {
            const newCardInstance: SpecialCardItem = {
              ...specialReward,
              id: `${specialReward.id}_${Date.now()}`,
            };
            updatedSpecialCards.push(newCardInstance);
          }

          const updatedKonohaBuffs = [...(p.konohaBuffs || [])];
          if (konohaBuffInstance) {
            updatedKonohaBuffs.push(konohaBuffInstance);
          }

          const updatedPlayer: Player = {
            ...p,
            cash: p.cash + netCashChange,
            stress: Math.min(100, Math.max(0, p.stress + card.stressChange)),
            politicalInfluence: Math.min(
              100,
              Math.max(0, p.politicalInfluence + (card.politicalChange || 0))
            ),
            ownedProperties: updatedProps,
            specialCards: updatedSpecialCards,
            konohaBuffs: updatedKonohaBuffs,
            stats: { ...p.stats, cardsDrawn: p.stats.cardsDrawn + 1 },
          };

          checkStressThreshold(updatedPlayer);
          return updatedPlayer;
        }
        return p;
      })
    );

    if (specialReward) {
      addLog(
        `🎁 KARTU SAKTI DIPEROLEH! ${target.name} menerima item berharga: ${specialReward.title}!`,
        'POLITIC',
        target.id
      );
    }

    const tierDesc =
      outcome.diceValue <= 2
        ? '🎲 DADU [1-2] TIER BERAT / REZEKI AKBAR'
        : outcome.diceValue <= 4
          ? '🎲 DADU [3-4] TIER SEDANG'
          : '🎲 DADU [5-6] TIER RINGAN';
    const logType = card.eventType === 'MUSIBAH' ? 'DANGER' : 'CASH';
    addLog(`${tierDesc} • ${card.title}: ${card.headline} (${target.name})`, logType, target.id);

    activeDrawCardEventRef.current = null;
    setActiveDrawCardEvent(null);

    if (target.isAi) {
      scheduleAiEndTurn(1400);
    }
  };

  return {
    handleChooseCardOption,
    handleConfirmDrawCardOutcome,
  };
}
