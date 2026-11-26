import React from 'react';
import {
  ActiveLaw,
  BoardTile,
  BreakingNewsEvent,
  DilemmaCard,
  GameLogItem,
  GameMode,
  MacroEconomy,
  MacroHistoryPoint,
  Player,
  PlayerCorruptionHistoryPoint,
} from '../types/game';
import { BREAKING_NEWS_TEMPLATES, LawProposal } from '../data/laws';
import { MONTH_NAMES } from '../constants/gameAssets';
import { FAST_MODE_MAX_ROUNDS, advanceMacroCycle, findNetWorthWinner } from '../engine/economy';
import { computeCoalitionDeduction, findWealthiestRivalTarget } from '../engine/politics';
import { applySeasonalEvent, SeasonalEvent } from '../engine/seasonalEvents';
import { buildNarratorContext, fetchDynamicBreakingNews } from '../engine/narrator';
import { formatRupiah } from '../utils/format';
import { soundManager } from '../utils/sound';
import { DrawCardEventState, RentCrisisState } from '../components/GameModals';
import { RentTransferData } from '../components/ManualRentPaymentModal';

export interface MonthNoticeState {
  monthName: string;
  monthIndex: number;
  year: number;
  round: number;
  seasonalEvent?: SeasonalEvent;
}

interface UsePoliticsAndTurnParams {
  activePlayer: Player | null;
  activePlayerIndex: number;
  players: Player[];
  perimeterTiles: BoardTile[];
  macro: MacroEconomy;
  activeLaws: ActiveLaw[];
  cycleRound: number;
  gameMode: GameMode;
  isRolling: boolean;
  isMoving: boolean;
  rentCrisis: RentCrisisState | null;
  activeDrawCardEvent: DrawCardEventState | null;
  activeDrawCardEventRef: React.MutableRefObject<DrawCardEventState | null>;
  activeDilemmaCard: DilemmaCard | null;
  showCorruptionGate: boolean;
  showCorruptionAudit: boolean;
  showKpkBribe: boolean;
  showParliament: boolean;
  showMoneyLaundering: boolean;
  manualRentData: RentTransferData | null;
  aiEndTurnTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setPerimeterTiles: React.Dispatch<React.SetStateAction<BoardTile[]>>;
  setActiveLaws: React.Dispatch<React.SetStateAction<ActiveLaw[]>>;
  setShowParliament: React.Dispatch<React.SetStateAction<boolean>>;
  setCycleRound: React.Dispatch<React.SetStateAction<number>>;
  setMacro: React.Dispatch<React.SetStateAction<MacroEconomy>>;
  setMacroHistory: React.Dispatch<React.SetStateAction<MacroHistoryPoint[]>>;
  setCorruptionHistory: React.Dispatch<React.SetStateAction<PlayerCorruptionHistoryPoint[]>>;
  setMonthNotice: React.Dispatch<React.SetStateAction<MonthNoticeState | null>>;
  setCurrentNews: React.Dispatch<React.SetStateAction<BreakingNewsEvent | null>>;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  setGameOverReason: React.Dispatch<React.SetStateAction<string>>;
  setActivePlayerIndex: React.Dispatch<React.SetStateAction<number>>;
  setHasRolled: React.Dispatch<React.SetStateAction<boolean>>;
  setLastRoll: React.Dispatch<React.SetStateAction<{ d1: number; d2: number; total: number } | null>>;
  addLog: (message: string, type?: GameLogItem['type'], playerId?: string) => void;
  checkStressThreshold: (player: Player) => boolean;
}

export function usePoliticsAndTurn({
  activePlayer,
  activePlayerIndex,
  players,
  perimeterTiles,
  macro,
  activeLaws,
  cycleRound,
  gameMode,
  isRolling,
  isMoving,
  rentCrisis,
  activeDrawCardEvent,
  activeDrawCardEventRef,
  activeDilemmaCard,
  showCorruptionGate,
  showCorruptionAudit,
  showKpkBribe,
  showParliament,
  showMoneyLaundering,
  manualRentData,
  aiEndTurnTimerRef,
  setPlayers,
  setPerimeterTiles,
  setActiveLaws,
  setShowParliament,
  setCycleRound,
  setMacro,
  setMacroHistory,
  setCorruptionHistory,
  setMonthNotice,
  setCurrentNews,
  setIsGameOver,
  setGameOverReason,
  setActivePlayerIndex,
  setHasRolled,
  setLastRoll,
  addLog,
  checkStressThreshold,
}: UsePoliticsAndTurnParams) {
  const advanceCycle = () => {
    const nextRound = cycleRound + 1;
    setCycleRound(nextRound);

    const { nextMacro, weekNumber, isNewMonth } = advanceMacroCycle(macro, nextRound);
    const {
      monthIndex: nextMonth,
      year: nextYear,
      inflationRate: newInflation,
      biRate: newBi,
      usdIdrRate: newUsd,
      trend: newTrend,
    } = nextMacro;

    let effectiveMacro = nextMacro;
    let effectivePlayers = players;

    if (isNewMonth) {
      const seasonal = applySeasonalEvent(nextMonth, players, nextMacro);
      if (seasonal.event) {
        effectivePlayers = seasonal.nextPlayers;
        effectiveMacro = seasonal.nextMacro;
        setPlayers(() => effectivePlayers);
        if (seasonal.logMessage) {
          addLog(seasonal.logMessage, 'SYSTEM');
        }
      }
      setMonthNotice({
        monthName: MONTH_NAMES[nextMonth - 1],
        monthIndex: nextMonth,
        year: nextYear,
        round: nextRound,
        seasonalEvent: seasonal.event ?? undefined,
      });
      soundManager.playCash();
      addLog(
        `🗓️ PERGANTIAN BULAN: Memasuki Bulan ${MONTH_NAMES[nextMonth - 1]} ${nextYear} (Putaran #${nextRound})! Laporan inflasi: ${effectiveMacro.inflationRate}%, BI-Rate: ${effectiveMacro.biRate}%.`,
        'SYSTEM'
      );
    }

    setMacro(effectiveMacro);

    setMacroHistory(prev => [
      ...prev,
      {
        round: nextRound,
        label: `P${nextRound}`,
        fullPeriod: `Putaran ${nextRound} · ${MONTH_NAMES[nextMonth - 1]} (W${weekNumber})`,
        inflationRate: newInflation,
        usdIdrRate: newUsd,
        biRate: newBi,
        trend: newTrend,
        note: isNewMonth ? `Bulan ${MONTH_NAMES[nextMonth - 1]}` : undefined,
      },
    ]);

    setCorruptionHistory(prev => [
      ...prev,
      {
        round: nextRound,
        label: `P${nextRound}`,
        fullPeriod: `Putaran ${nextRound} · ${MONTH_NAMES[nextMonth - 1]} (W${weekNumber})`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        playersData: players.map(p => ({
          playerId: p.id,
          playerName: p.name,
          playerColor: p.color,
          playerAvatar: p.avatar,
          kpkSuspicionLevel: p.kpkSuspicionLevel,
          totalCorruptionGains: p.stats.totalCorruptionGains,
          cash: p.cash,
          isInCorruptionRoute: p.isInCorruptionRoute,
          inJail: p.inJail,
        })),
      },
    ]);

    setActiveLaws(prev =>
      prev.map(l => ({ ...l, durationTurns: l.durationTurns - 1 })).filter(l => l.durationTurns > 0)
    );

    if (Math.random() > 0.75) {
      const narratorCtx = buildNarratorContext(effectiveMacro, effectivePlayers, activeLaws, nextRound);
      void fetchDynamicBreakingNews(narratorCtx, BREAKING_NEWS_TEMPLATES).then(({ news, source }) => {
        soundManager.playSirenOTT();
        setCurrentNews(news);
        addLog(
          `${source === 'AI' ? '🤖 SIARAN PERS AI' : 'SIARAN PERS'}: ${news.headline}`,
          'DANGER'
        );

        if (news.impactType === 'INFLATION') {
          const bumped = Number((effectiveMacro.inflationRate + 2.0).toFixed(1));
          const bumpedTrend = bumped > 10.0 ? 'CRISIS' : 'VOLATILE';
          setMacro(m => ({ ...m, inflationRate: bumped, trend: bumpedTrend }));
          setMacroHistory(prev => [
            ...prev,
            {
              round: nextRound,
              label: `P${nextRound}*`,
              fullPeriod: `Putaran ${nextRound} (Berita Inflasi)`,
              inflationRate: bumped,
              usdIdrRate: newUsd + 150,
              biRate: newBi,
              trend: bumpedTrend,
              note: 'Dampak Breaking News Moneter',
            },
          ]);
        } else if (news.impactType === 'CORRUPTION_CRACKDOWN') {
          setPlayers(plist =>
            plist.map(p => ({ ...p, kpkSuspicionLevel: Math.min(100, p.kpkSuspicionLevel + 20) }))
          );
        } else if (news.impactType === 'SUBSIDY_CUT') {
          setPlayers(plist =>
            plist.map(p => {
              const updated = { ...p, stress: Math.min(100, p.stress + 15) };
              checkStressThreshold(updated);
              return updated;
            })
          );
        }
      });
    }

    addLog(`Siklus Putaran #${nextRound} dimulai (Minggu ${weekNumber}/4).`, 'SYSTEM');

    if (gameMode === 'FAST' && nextRound > FAST_MODE_MAX_ROUNDS) {
      const result = findNetWorthWinner(effectivePlayers, perimeterTiles, effectiveMacro);
      if (result) {
        setIsGameOver(true);
        setGameOverReason(
          `Mode Cepat (${FAST_MODE_MAX_ROUNDS} Putaran) selesai! ${result.winner.name} keluar sebagai juara dengan total kekayaan bersih ${formatRupiah(result.netWorth)}!`
        );
      }
    }
  };

  const handleEndTurn = () => {
    if (
      !activePlayer ||
      isRolling ||
      isMoving ||
      rentCrisis ||
      activeDrawCardEvent ||
      activeDrawCardEventRef.current ||
      activeDilemmaCard ||
      showCorruptionGate ||
      showCorruptionAudit ||
      showKpkBribe ||
      showParliament ||
      showMoneyLaundering ||
      manualRentData
    ) {
      return;
    }

    checkStressThreshold(activePlayer);

    if (activePlayer.inJail && !activePlayer.isBankrupt) {
      if (activePlayer.jailTurnsLeft <= 1) {
        setPlayers(prev =>
          prev.map(p =>
            p.id === activePlayer.id
              ? {
                  ...p,
                  inJail: false,
                  jailTurnsLeft: 0,
                }
              : p
          )
        );
        addLog(
          `${activePlayer.name} telah menyelesaikan masa tahanan di Lapas Sukamiskin. Bebas!`,
          'INFO',
          activePlayer.id
        );
      } else {
        setPlayers(prev =>
          prev.map(p =>
            p.id === activePlayer.id
              ? {
                  ...p,
                  jailTurnsLeft: p.jailTurnsLeft - 1,
                }
              : p
          )
        );
      }
    }

    const currentAlive = players.filter(p => !p.isBankrupt);
    if (currentAlive.length <= 1 && players.length > 1) {
      const winner = currentAlive[0] || activePlayer;
      setIsGameOver(true);
      setGameOverReason(
        `Kemenangan Sejati! ${winner.name} berhasil bertahan hidup paling lama dan menjadi penyintas tunggal di Konoha!`
      );
      return;
    }

    let nextIdx = (activePlayerIndex + 1) % players.length;
    let attempts = 0;
    while (players[nextIdx]?.isBankrupt && attempts < players.length) {
      nextIdx = (nextIdx + 1) % players.length;
      attempts++;
    }

    if (nextIdx <= activePlayerIndex) {
      advanceCycle();
    }

    setActivePlayerIndex(nextIdx);
    setHasRolled(false);
    setLastRoll(null);
  };

  const handleVetoLaw = (
    proposal: LawProposal,
    vetoingPlayer: Player,
    usedSpecialCardId?: string
  ) => {
    soundManager.playGavel();
    soundManager.playBuzzer();

    setPlayers(prev =>
      prev.map(p => {
        if (p.id === vetoingPlayer.id) {
          let updatedCards = p.specialCards || [];
          if (usedSpecialCardId) {
            const idx = updatedCards.findIndex(c => c.id === usedSpecialCardId);
            if (idx !== -1) {
              updatedCards = updatedCards.filter((_, i) => i !== idx);
            }
          }
          return {
            ...p,
            politicalInfluence: Math.min(100, p.politicalInfluence + 15),
            specialCards: updatedCards,
          };
        }
        if (activePlayer && p.id === activePlayer.id) {
          return {
            ...p,
            politicalInfluence: Math.max(0, p.politicalInfluence - 10),
          };
        }
        return p;
      })
    );

    addLog(
      `🚨 INTERUPSI PARLEMEN BERHASIL! Fraksi ${vetoingPlayer.name} berhasil membatalkan pengesahan RUU "${proposal.title}" melalui perdebatan sidang! (${activePlayer?.name} -10 Modal Politik, ${vetoingPlayer.name} +15 Modal Politik).`,
      'POLITIC',
      vetoingPlayer.id
    );
    setShowParliament(false);

    if (activePlayer?.isAi) {
      if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
      aiEndTurnTimerRef.current = setTimeout(() => {
        handleEndTurn();
      }, 1400);
    }
  };

  const handlePassLaw = (proposal: LawProposal, coalitionPartner?: Player) => {
    if (!activePlayer || activePlayer.isBankrupt) return;

    const totalInfluence =
      activePlayer.politicalInfluence +
      (coalitionPartner ? coalitionPartner.politicalInfluence : 0);
    if (totalInfluence < proposal.requiredInfluence) return;

    soundManager.playCash();

    if (coalitionPartner) {
      const { deductA, deductB } = computeCoalitionDeduction(
        activePlayer,
        coalitionPartner,
        proposal.requiredInfluence
      );

      setPlayers(prev =>
        prev.map(p => {
          if (p.id === activePlayer.id) {
            return { ...p, politicalInfluence: Math.max(0, p.politicalInfluence - deductA) };
          }
          if (p.id === coalitionPartner.id) {
            return { ...p, politicalInfluence: Math.max(0, p.politicalInfluence - deductB) };
          }
          return p;
        })
      );

      addLog(
        `🤝 KOALISI PARLEMEN TERBENTUK: ${activePlayer.name} (-${deductA} Poin) & ${coalitionPartner.name} (-${deductB} Poin) menggabungkan kuorum mengesahkan "${proposal.title}"!`,
        'POLITIC',
        activePlayer.id
      );
    } else {
      setPlayers(prev =>
        prev.map(p =>
          p.id === activePlayer.id
            ? {
                ...p,
                politicalInfluence: p.politicalInfluence - proposal.requiredInfluence,
              }
            : p
        )
      );
    }

    if (proposal.effectType === 'PROGRESSIVE_TAX_DRASTIC') {
      let totalTaxCollected = 0;
      const breakdownLogs: string[] = [];
      const nonCoalitionIds = players
        .filter(p => p.id !== activePlayer.id && p.id !== coalitionPartner?.id && !p.isBankrupt)
        .map(p => p.id);

      setPlayers(prev => {
        const updated = prev.map(p => {
          if (nonCoalitionIds.includes(p.id) && p.cash >= 1_000_000) {
            const tax = Math.round(p.cash * 0.25);
            totalTaxCollected += tax;
            breakdownLogs.push(`${p.name} (-${formatRupiah(tax)})`);
            const updatedP: Player = {
              ...p,
              cash: p.cash - tax,
              stress: Math.min(100, p.stress + 20),
            };
            checkStressThreshold(updatedP);
            return updatedP;
          }
          return p;
        });

        const shareA = coalitionPartner ? Math.ceil(totalTaxCollected / 2) : totalTaxCollected;
        const shareB = coalitionPartner ? Math.floor(totalTaxCollected / 2) : 0;

        return updated.map(p => {
          if (p.id === activePlayer.id) {
            return { ...p, cash: p.cash + shareA };
          }
          if (coalitionPartner && p.id === coalitionPartner.id) {
            return { ...p, cash: p.cash + shareB };
          }
          return p;
        });
      });

      if (totalTaxCollected > 0) {
        addLog(
          `⚖️ PAJAK PROGRESIF DRASTIS BERLAKU: Total ${formatRupiah(totalTaxCollected)} disita dari rival (${breakdownLogs.join(', ')}). ${coalitionPartner ? `Masing-masing anggota koalisi mengantongi ${formatRupiah(Math.ceil(totalTaxCollected / 2))}!` : `Disetor ke kas ${activePlayer.name}!`}`,
          'POLITIC',
          activePlayer.id
        );
      } else {
        addLog(
          'UU Pajak Progresif diberlakukan! Tidak ada rival di luar koalisi dengan saldo tunai mencukupi.',
          'INFO',
          activePlayer.id
        );
      }
    } else if (proposal.effectType === 'ASSET_CONFISCATION_ACT') {
      const nonCoalitionRivals = players.filter(
        p => p.id !== activePlayer.id && p.id !== coalitionPartner?.id && !p.isBankrupt
      );
      const target = findWealthiestRivalTarget(nonCoalitionRivals, perimeterTiles);

      if (target) {
        const { primeRival, seizedTile } = target;
        if (seizedTile) {
          setPerimeterTiles(prev =>
            prev.map(t => (t.id === seizedTile.id ? { ...t, ownerId: null, level: 1 } : t))
          );
          addLog(
            `🚨 SITA ASET NEGARA: Sertifikat Tanah ${seizedTile.certificateTitle || seizedTile.name} milik ${primeRival.name} resmi dicabut & disita oleh Satgas Koalisi Parlemen!`,
            'DANGER',
            primeRival.id
          );
        }

        const fineAmount = Math.min(primeRival.cash, 25_000_000);
        const shareA = coalitionPartner ? Math.ceil(fineAmount / 2) : fineAmount;
        const shareB = coalitionPartner ? Math.floor(fineAmount / 2) : 0;

        setPlayers(prev =>
          prev.map(p => {
            if (p.id === primeRival.id) {
              let updatedProps = p.ownedProperties;
              if (seizedTile) {
                updatedProps = updatedProps.filter(id => id !== seizedTile.id);
              }
              const updatedP: Player = {
                ...p,
                cash: Math.max(0, p.cash - fineAmount),
                stress: Math.min(100, p.stress + 30),
                ownedProperties: updatedProps,
              };
              checkStressThreshold(updatedP);
              return updatedP;
            }
            if (p.id === activePlayer.id) {
              return { ...p, cash: p.cash + shareA };
            }
            if (coalitionPartner && p.id === coalitionPartner.id) {
              return { ...p, cash: p.cash + shareB };
            }
            return p;
          })
        );

        addLog(
          `🏛️ UU PENYITAAN ASET DISAHKAN: Koalisi ${activePlayer.name} & ${coalitionPartner?.name || 'Fraksi'} berhasil melucuti aset dan mendenda ${primeRival.name} sebesar ${formatRupiah(fineAmount)}!`,
          'POLITIC',
          activePlayer.id
        );
      } else {
        addLog(
          'Tidak ada pemain rival di luar koalisi yang dapat disita asetnya.',
          'INFO',
          activePlayer.id
        );
      }
    } else if (proposal.effectType === 'BANSOS_ORDAL') {
      setPlayers(prev =>
        prev.map(p =>
          p.id === activePlayer.id
            ? {
                ...p,
                cash: p.cash + 45_000_000,
              }
            : p
        )
      );
      addLog(
        `${activePlayer.name} mencairkan Dana Aspirasi Dapil sebesar Rp 45 Jt!`,
        'CASH',
        activePlayer.id
      );
    } else if (proposal.effectType === 'LUXURY_TAX') {
      let totalCollected = 0;
      const breakdownLogs: string[] = [];

      setPlayers(prev => {
        const updated = prev.map(p => {
          if (
            p.id !== activePlayer.id &&
            p.id !== coalitionPartner?.id &&
            !p.isBankrupt &&
            p.cash >= 50_000_000
          ) {
            const tax = Math.round(p.cash * 0.15);
            totalCollected += tax;
            breakdownLogs.push(`${p.name} (-${formatRupiah(tax)})`);
            return { ...p, cash: p.cash - tax };
          }
          return p;
        });

        const shareA = coalitionPartner ? Math.ceil(totalCollected / 2) : totalCollected;
        const shareB = coalitionPartner ? Math.floor(totalCollected / 2) : 0;

        return updated.map(p => {
          if (p.id === activePlayer.id) {
            return { ...p, cash: p.cash + shareA };
          }
          if (coalitionPartner && p.id === coalitionPartner.id) {
            return { ...p, cash: p.cash + shareB };
          }
          return p;
        });
      });

      if (totalCollected > 0) {
        addLog(
          `UU Pajak Barang Mewah diberlakukan! ${activePlayer.name} memungut total ${formatRupiah(totalCollected)} dari lawan: ${breakdownLogs.join(', ')}!`,
          'POLITIC',
          activePlayer.id
        );
      } else {
        addLog(
          'UU Pajak Barang Mewah diberlakukan! Tidak ada pemain lawan dengan saldo tunai di atas ambang batas (>= Rp 50 Jt).',
          'INFO',
          activePlayer.id
        );
      }
    }

    const newLaw: ActiveLaw = {
      id: `${proposal.id}_${Date.now()}`,
      name: proposal.title,
      shortDesc: proposal.description,
      passedByPlayerId: activePlayer.id,
      coalitionPartnerId: coalitionPartner?.id,
      effect: proposal.effectType as ActiveLaw['effect'],
      durationTurns: 4,
    };

    setActiveLaws(prev => [...prev, newLaw]);
    setShowParliament(false);
    addLog(
      `PARIPURNA MENGETUK PALU: ${activePlayer.name}${coalitionPartner ? ` bersama ${coalitionPartner.name}` : ''} berhasil mengesahkan "${proposal.title}"!`,
      'POLITIC',
      activePlayer.id
    );

    if (activePlayer.isAi) {
      if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
      aiEndTurnTimerRef.current = setTimeout(() => {
        handleEndTurn();
      }, 1400);
    }
  };

  return {
    handleVetoLaw,
    handlePassLaw,
    handleEndTurn,
    advanceCycle,
  };
}
