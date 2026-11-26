import React from 'react';
import {
  ActiveLaw,
  BoardTile,
  DilemmaCard,
  GameLogItem,
  MacroEconomy,
  Player,
} from '../types/game';
import { DILEMMA_CARDS } from '../data/cards';
import { CHARACTER_ARCHETYPES } from '../data/characters';
import { MUSIBAH_EVENT_CARDS, TAKDIR_EVENT_CARDS } from '../data/eventCards';
import {
  calculatePropertyRent,
  calculatePropertySellValue,
  liquidatePropertiesForDebt,
} from '../engine/economy';
import { formatRupiah } from '../utils/format';
import { soundManager } from '../utils/sound';
import { DrawCardEventState, RentCrisisState } from '../components/GameModals';
import { RentTransferData } from '../components/ManualRentPaymentModal';

export interface PsychologistNoticeState {
  player: Player;
  fee: number;
  oldStress: number;
  newStress: number;
}

export interface DiceRollAnimationState {
  player: Player;
  d1: number;
  d2: number;
  total: number;
}

interface UseBoardMovementParams {
  activePlayer: Player | null;
  players: Player[];
  perimeterTiles: BoardTile[];
  corruptionTiles: BoardTile[];
  luxuryTiles: BoardTile[];
  macro: MacroEconomy;
  activeLaws: ActiveLaw[];
  hasRolled: boolean;
  isRolling: boolean;
  isMoving: boolean;
  rentCrisis: RentCrisisState | null;
  diceRollAnimation: DiceRollAnimationState | null;
  moveTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  activeDrawCardEventRef: React.MutableRefObject<DrawCardEventState | null>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setPerimeterTiles: React.Dispatch<React.SetStateAction<BoardTile[]>>;
  setIsRolling: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMoving: React.Dispatch<React.SetStateAction<boolean>>;
  setHasRolled: React.Dispatch<React.SetStateAction<boolean>>;
  setLastRoll: React.Dispatch<React.SetStateAction<{ d1: number; d2: number; total: number } | null>>;
  setDiceRollAnimation: React.Dispatch<React.SetStateAction<DiceRollAnimationState | null>>;
  setPsychologistNotice: React.Dispatch<React.SetStateAction<PsychologistNoticeState | null>>;
  setRentCrisis: React.Dispatch<React.SetStateAction<RentCrisisState | null>>;
  setManualRentData: React.Dispatch<React.SetStateAction<RentTransferData | null>>;
  setActiveDilemmaCard: React.Dispatch<React.SetStateAction<DilemmaCard | null>>;
  setShowCorruptionGate: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCorruptionAudit: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMoneyLaundering: React.Dispatch<React.SetStateAction<boolean>>;
  setShowParliament: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveDrawCardEvent: React.Dispatch<React.SetStateAction<DrawCardEventState | null>>;
  addLog: (message: string, type?: GameLogItem['type'], playerId?: string) => void;
  onPlayerBankruptcy: (player: Player, cause: string) => void;
}

export function useBoardMovement({
  activePlayer,
  players,
  perimeterTiles,
  corruptionTiles,
  luxuryTiles,
  macro,
  activeLaws,
  hasRolled,
  isRolling,
  isMoving,
  rentCrisis,
  diceRollAnimation,
  moveTimerRef,
  activeDrawCardEventRef,
  setPlayers,
  setPerimeterTiles,
  setIsRolling,
  setIsMoving,
  setHasRolled,
  setLastRoll,
  setDiceRollAnimation,
  setPsychologistNotice,
  setRentCrisis,
  setManualRentData,
  setActiveDilemmaCard,
  setShowCorruptionGate,
  setShowCorruptionAudit,
  setShowMoneyLaundering,
  setShowParliament,
  setActiveDrawCardEvent,
  addLog,
  onPlayerBankruptcy,
}: UseBoardMovementParams) {
  // Check 100% Stress Threshold & Psychologist Intervention
  const checkStressThreshold = (player: Player): boolean => {
    if (player.isBankrupt) return false;

    if (player.stress >= 100) {
      const psychologistFee = 10_000_000;
      if (player.cash >= psychologistFee) {
        const updatedCash = player.cash - psychologistFee;
        const updatedStress = Math.max(0, player.stress - 20);

        setPlayers(prev =>
          prev.map(p =>
            p.id === player.id
              ? {
                  ...p,
                  cash: updatedCash,
                  stress: updatedStress,
                }
              : p
          )
        );

        soundManager.playCash();
        addLog(
          `🧠 KONSULTASI PSIKOLOG: Stres ${player.name} mencapai 100%! Membayar Rp 10.000.000 ke psikiater, stres turun 20% menjadi ${updatedStress}%.`,
          'INFO',
          player.id
        );

        setPsychologistNotice({
          player: { ...player, cash: updatedCash, stress: updatedStress },
          fee: psychologistFee,
          oldStress: player.stress,
          newStress: updatedStress,
        });
        return true;
      } else {
        const ownedTiles = perimeterTiles.filter(t => t.ownerId === player.id);
        const totalLiquidation = ownedTiles.reduce(
          (sum, t) => sum + calculatePropertySellValue(t, macro),
          0
        );
        if (ownedTiles.length > 0 && player.cash + totalLiquidation >= psychologistFee) {
          if (player.isAi) {
            const { finalCash, cashRaised, soldPropertyIds, soldPropertyTitles } =
              liquidatePropertiesForDebt(ownedTiles, player.cash, psychologistFee, macro);
            setPerimeterTiles(prev =>
              prev.map(t => (soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t))
            );
            addLog(
              `${player.name} (AI) terpaksa menjual aset (${soldPropertyTitles.join(', ')}) seharga ${formatRupiah(cashRaised)} untuk biaya terapi psikiater Rp 10.000.000!`,
              'DANGER',
              player.id
            );
            const updatedStress = Math.max(0, player.stress - 20);
            setPlayers(prev =>
              prev.map(p =>
                p.id === player.id
                  ? {
                      ...p,
                      cash: finalCash - psychologistFee,
                      stress: updatedStress,
                      ownedProperties: p.ownedProperties.filter(
                        id => !soldPropertyIds.includes(id)
                      ),
                    }
                  : p
              )
            );
            setPsychologistNotice({
              player: { ...player, cash: finalCash - psychologistFee, stress: updatedStress },
              fee: psychologistFee,
              oldStress: player.stress,
              newStress: updatedStress,
            });
            return true;
          } else {
            setRentCrisis({
              crisisType: 'PSYCHOLOGIST',
              payer: player,
              amountDue: psychologistFee,
              title: 'Klinik Jiwa Konoha · Terapi Darurat',
              subtitle: 'STRES MAKSIMAL 100% · INTERVENSI PSIKOLOG',
              description:
                'Tingkat stres Anda mencapai batas kritis 100%! Untuk menyelamatkan diri dari serangan panik, Anda wajib menjalani sesi terapi psikiater darurat seharga Rp 10.000.000. Jual aset tanah untuk melunasi biaya ini.',
              causeDesc: 'biaya psikolog darurat Rp 10.000.000',
              recipientName: 'Klinik Jiwa & Konselor Konoha',
              recipientAvatar: '🧠',
              onPaySuccess: updatedPayer => {
                const updatedStress = Math.max(0, updatedPayer.stress - 20);
                setPlayers(prev =>
                  prev.map(p =>
                    p.id === updatedPayer.id
                      ? {
                          ...p,
                          cash: p.cash - psychologistFee,
                          stress: updatedStress,
                        }
                      : p
                  )
                );
                addLog(
                  `🧠 INTERVENSI PSIKOLOG! ${updatedPayer.name} melunasi terapi Rp 10.000.000, stres turun 20% menjadi ${updatedStress}%.`,
                  'INFO',
                  updatedPayer.id
                );
                setPsychologistNotice({
                  player: {
                    ...updatedPayer,
                    cash: updatedPayer.cash - psychologistFee,
                    stress: updatedStress,
                  },
                  fee: psychologistFee,
                  oldStress: 100,
                  newStress: updatedStress,
                });
              },
            });
            return true;
          }
        }

        onPlayerBankruptcy(
          player,
          'Stres mencapai 100% dan seluruh aset tidak mencukupi untuk membayar biaya psikolog Rp 10.000.000'
        );
        return false;
      }
    }
    return true;
  };

  // Resolve Landing Tile Event
  const resolveLandingTile = (player: Player, tileId: number) => {
    if (player.isBankrupt) return;

    const tile = [...perimeterTiles, ...corruptionTiles, ...luxuryTiles].find(
      t => t.id === tileId
    );
    if (!tile) return;

    addLog(`${player.name} mendarat di petak #${tile.id}: ${tile.name}.`, 'INFO', player.id);

    if (tile.isCorruptionRoute) {
      if (tile.id === 100) {
        soundManager.playCash();
        setPlayers(prev =>
          prev.map(p =>
            p.id === player.id
              ? {
                  ...p,
                  cash: p.cash + 60_000_000,
                  kpkSuspicionLevel: Math.min(100, p.kpkSuspicionLevel + 25),
                  stats: {
                    ...p.stats,
                    totalCorruptionGains: p.stats.totalCorruptionGains + 60_000_000,
                  },
                }
              : p
          )
        );
        addLog(
          `${player.name} mengeksekusi Pengadaan Fiktif APBD! Mengantongi Rp 60 Jt tapi Radar KPK +25%.`,
          'DANGER',
          player.id
        );
      } else if (tile.id === 101) {
        soundManager.playCash();
        setPlayers(prev =>
          prev.map(p =>
            p.id === player.id
              ? {
                  ...p,
                  cash: p.cash + 45_000_000,
                  politicalInfluence: Math.min(100, p.politicalInfluence + 20),
                  stats: {
                    ...p.stats,
                    totalCorruptionGains: p.stats.totalCorruptionGains + 45_000_000,
                  },
                }
              : p
          )
        );
        addLog(
          `${player.name} mendapat jatah Kuota Impor Pangan! Dapat Rp 45 Jt dan +20 Modal Politik.`,
          'POLITIC',
          player.id
        );
      } else if (tile.id === 102) {
        setShowMoneyLaundering(true);
      } else if (tile.id === 103) {
        setShowCorruptionAudit(true);
      }
      return;
    }

    switch (tile.actionType) {
      case 'PROPERTY': {
        if (tile.ownerId && tile.ownerId !== player.id) {
          const owner = players.find(p => p.id === tile.ownerId);
          if (owner && !owner.inJail && !owner.isBankrupt) {
            const { rentCost, combinedRentMultiplier } = calculatePropertyRent(
              tile,
              owner,
              macro,
              activeLaws
            );

            soundManager.playBuzzer();

            if (player.cash < rentCost) {
              if (player.isAi) {
                const aiProperties = perimeterTiles.filter(t => t.ownerId === player.id);
                const {
                  survived,
                  finalCash: currentAiCash,
                  soldPropertyIds,
                  soldPropertyTitles,
                } = liquidatePropertiesForDebt(aiProperties, player.cash, rentCost, macro);

                if (survived) {
                  setPerimeterTiles(prev =>
                    prev.map(t =>
                      soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t
                    )
                  );
                  setPlayers(prev =>
                    prev.map(p => {
                      if (p.id === player.id) {
                        const updated: Player = {
                          ...p,
                          cash: currentAiCash - rentCost,
                          ownedProperties: p.ownedProperties.filter(
                            id => !soldPropertyIds.includes(id)
                          ),
                          stress: Math.min(100, p.stress + 10),
                          stats: { ...p.stats, totalRentPaid: p.stats.totalRentPaid + rentCost },
                        };
                        checkStressThreshold(updated);
                        return updated;
                      }
                      if (p.id === owner.id) {
                        return {
                          ...p,
                          cash: p.cash + rentCost,
                          stats: { ...p.stats, totalRentEarned: p.stats.totalRentEarned + rentCost },
                        };
                      }
                      return p;
                    })
                  );
                  addLog(
                    `${player.name} (AI) terpaksa menjual aset (${soldPropertyTitles.join(', ')}) untuk melunasi sewa ${formatRupiah(rentCost)} ke ${owner.name}!`,
                    'DANGER',
                    player.id
                  );
                  return;
                } else {
                  const remainingPaid = currentAiCash;
                  if (remainingPaid > 0) {
                    setPlayers(prev =>
                      prev.map(p => {
                        if (p.id === owner.id) {
                          return {
                            ...p,
                            cash: p.cash + remainingPaid,
                            stats: {
                              ...p.stats,
                              totalRentEarned: p.stats.totalRentEarned + remainingPaid,
                            },
                          };
                        }
                        return p;
                      })
                    );
                  }
                  onPlayerBankruptcy(
                    player,
                    `Tidak mampu membayar sewa ${formatRupiah(rentCost)} kepada ${owner.name}`
                  );
                  return;
                }
              } else {
                setRentCrisis({
                  payer: player,
                  owner,
                  tile,
                  rentCost,
                });
                return;
              }
            }

            if (!player.isAi) {
              setManualRentData({
                payer: player,
                owner,
                tile,
                rentCost,
                multiplier: combinedRentMultiplier,
              });
              return;
            }

            setPlayers(prev =>
              prev.map(p => {
                if (p.id === player.id) {
                  const updated: Player = {
                    ...p,
                    cash: p.cash - rentCost,
                    stress: Math.min(100, p.stress + 10),
                    stats: { ...p.stats, totalRentPaid: p.stats.totalRentPaid + rentCost },
                  };
                  checkStressThreshold(updated);
                  return updated;
                }
                if (p.id === owner.id) {
                  return {
                    ...p,
                    cash: p.cash + rentCost,
                    stats: { ...p.stats, totalRentEarned: p.stats.totalRentEarned + rentCost },
                  };
                }
                return p;
              })
            );

            addLog(
              `${player.name} membayar sewa ${formatRupiah(rentCost)} kepada ${owner.name} untuk ${tile.name}!`,
              'CASH',
              player.id
            );
          }
        }
        break;
      }

      case 'DILEMA_CARD': {
        soundManager.playCardDraw();
        const randomCard = DILEMMA_CARDS[Math.floor(Math.random() * DILEMMA_CARDS.length)];
        setActiveDilemmaCard(randomCard);
        break;
      }

      case 'TAX_BILL': {
        const hasPlatSakti = activeLaws.some(
          l => l.effect === 'FREE_PARKING' && l.passedByPlayerId === player.id
        );
        if (hasPlatSakti) {
          addLog(
            `${player.name} menggunakan Plat Sakti DPR/RF! Kebal dari pungli & denda di ${tile.name}.`,
            'POLITIC',
            player.id
          );
          return;
        }

        const hasKonohaSubsidy = player.konohaBuffs?.some(b => b.type === 'INFLATION_REDUCTION');
        if (hasKonohaSubsidy) {
          addLog(
            `🍃 SUBSIDI PANGAN & ENERGI KONOHA! ${player.name} dibebaskan dari tagihan retribusi ${tile.name}!`,
            'POLITIC',
            player.id
          );
          return;
        }

        const inflationFactor = 1 + macro.inflationRate / 100;
        let billAmount = 500_000;
        if (tile.id === 4) billAmount = 500_000;
        else if (tile.id === 6) billAmount = 150_000;
        else if (tile.id === 8) billAmount = 1_200_000;
        else if (tile.id === 12) billAmount = 900_000;
        else if (tile.id === 13) billAmount = 400_000;
        else if (tile.id === 17) billAmount = 800_000;
        else if (tile.id === 19) billAmount = 1_500_000;
        else if (tile.id === 26) billAmount = 650_000;

        if (player.konohaBuffs?.some(b => b.type === 'RUPIAH_STRENGTHEN')) {
          billAmount = Math.round(billAmount * 0.5);
        }

        const adjustedBill = Math.round(billAmount * inflationFactor);
        soundManager.playBuzzer();

        if (player.cash < adjustedBill) {
          if (player.isAi) {
            const aiOwnedTiles = perimeterTiles.filter(t => t.ownerId === player.id);
            let currentCash = player.cash;
            const soldPropertyIds: number[] = [];
            const soldPropertyTitles: string[] = [];
            for (const prop of aiOwnedTiles) {
              if (currentCash >= adjustedBill) break;
              const sellVal = calculatePropertySellValue(prop, macro);
              currentCash += sellVal;
              soldPropertyIds.push(prop.id);
              soldPropertyTitles.push(prop.name);
            }
            if (currentCash >= adjustedBill) {
              setPerimeterTiles(prev =>
                prev.map(t =>
                  soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t
                )
              );
              addLog(
                `${player.name} (AI) terpaksa menjual aset (${soldPropertyTitles.join(', ')}) untuk membayar tagihan ${tile.name}!`,
                'DANGER',
                player.id
              );
              setPlayers(prev =>
                prev.map(p =>
                  p.id === player.id
                    ? {
                        ...p,
                        cash: currentCash - adjustedBill,
                        ownedProperties: p.ownedProperties.filter(
                          id => !soldPropertyIds.includes(id)
                        ),
                        stress: Math.min(100, p.stress + 10),
                      }
                    : p
                )
              );
              return;
            } else {
              onPlayerBankruptcy(
                player,
                `Tidak sanggup melunasi tagihan/denda ${tile.name} sebesar ${formatRupiah(adjustedBill)}`
              );
              return;
            }
          } else {
            setRentCrisis({
              crisisType: 'TILE_BILL',
              payer: player,
              amountDue: adjustedBill,
              title: tile.name,
              subtitle: 'KRISIS KAS TUNAI · TAGIHAN FASILITAS PUBLIK',
              description: `Anda terkena tagihan/retribusi di ${tile.name} sebesar ${formatRupiah(adjustedBill)}. Saldo kas tidak mencukupi, jual aset properti untuk melunasi tagihan ini.`,
              causeDesc: `tagihan ${tile.name}`,
              recipientName: tile.name,
              recipientAvatar: '🏢',
              onPaySuccess: updatedPayer => {
                setPlayers(prev =>
                  prev.map(p =>
                    p.id === updatedPayer.id
                      ? {
                          ...p,
                          cash: p.cash - adjustedBill,
                          stress: Math.min(100, p.stress + 10),
                        }
                      : p
                  )
                );
                addLog(
                  `${updatedPayer.name} melunasi tagihan di ${tile.name} sebesar ${formatRupiah(adjustedBill)}!`,
                  'CASH',
                  updatedPayer.id
                );
              },
            });
            return;
          }
        }

        setPlayers(prev =>
          prev.map(p => {
            if (p.id === player.id) {
              const updated: Player = {
                ...p,
                cash: p.cash - adjustedBill,
                stress: Math.min(100, p.stress + 10),
              };
              checkStressThreshold(updated);
              return updated;
            }
            return p;
          })
        );

        addLog(
          `${player.name} terkena tagihan/denda di ${tile.name} sebesar ${formatRupiah(adjustedBill)}! Stres +10%.`,
          'DANGER',
          player.id
        );
        break;
      }

      case 'CORRUPTION_GATE': {
        setShowCorruptionGate(true);
        break;
      }

      case 'PARLIAMENT_SENAYAN': {
        soundManager.playCash();
        setShowParliament(true);
        break;
      }

      case 'BIROKRASI_CHECK': {
        if (player.archetypeId === 'pak_joko_asn') {
          addLog(
            `${player.name} (Pak Joko ASN) punya akses orang dalam di Dukcapil! Bebas dari kerumitan birokrasi.`,
            'INFO',
            player.id
          );
        } else {
          soundManager.playBuzzer();
          if (player.cash < 3_000_000) {
            const caloFee = 3_000_000;
            if (player.isAi) {
              const aiOwnedTiles = perimeterTiles.filter(t => t.ownerId === player.id);
              const {
                survived,
                finalCash: currentCash,
                soldPropertyIds,
                soldPropertyTitles,
              } = liquidatePropertiesForDebt(aiOwnedTiles, player.cash, caloFee, macro);
              if (survived) {
                setPerimeterTiles(prev =>
                  prev.map(t =>
                    soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t
                  )
                );
                addLog(
                  `${player.name} (AI) terpaksa menjual aset (${soldPropertyTitles.join(', ')}) untuk bayar calo Dukcapil Rp 3.000.000!`,
                  'DANGER',
                  player.id
                );
                setPlayers(prev =>
                  prev.map(p =>
                    p.id === player.id
                      ? {
                          ...p,
                          cash: currentCash - caloFee,
                          ownedProperties: p.ownedProperties.filter(
                            id => !soldPropertyIds.includes(id)
                          ),
                          stress: Math.min(100, p.stress + 15),
                        }
                      : p
                  )
                );
                return;
              } else {
                onPlayerBankruptcy(
                  player,
                  'Tidak sanggup membayar calo administrasi di Dukcapil Rp 3.000.000'
                );
                return;
              }
            } else {
              setRentCrisis({
                crisisType: 'BIROKRASI',
                payer: player,
                amountDue: caloFee,
                title: 'Kelurahan Dukcapil · Calo Administrasi',
                subtitle: 'KRISIS KAS TUNAI · BIAYA BIROKRASI',
                description:
                  'Blangko e-KTP habis! Anda harus membayar jasa calo darurat Rp 3.000.000. Jual aset tanah untuk melunasi biaya dan melanjutkan perjalanan.',
                causeDesc: 'calo administrasi di Dukcapil Rp 3.000.000',
                recipientName: 'Oknum Calo Dukcapil',
                recipientAvatar: '🏛️',
                onPaySuccess: updatedPayer => {
                  setPlayers(prev =>
                    prev.map(p =>
                      p.id === updatedPayer.id
                        ? {
                            ...p,
                            cash: p.cash - caloFee,
                            stress: Math.min(100, p.stress + 15),
                          }
                        : p
                    )
                  );
                  addLog(
                    `Blangko e-KTP diperoleh! ${updatedPayer.name} melunasi calo Rp 3.000.000 dan stres naik +15%.`,
                    'INFO',
                    updatedPayer.id
                  );
                },
              });
              return;
            }
          }
          setPlayers(prev =>
            prev.map(p => {
              if (p.id === player.id) {
                const updated: Player = {
                  ...p,
                  cash: p.cash - 3_000_000,
                  stress: Math.min(100, p.stress + 15),
                };
                checkStressThreshold(updated);
                return updated;
              }
              return p;
            })
          );
          addLog(
            `Blangko e-KTP habis! ${player.name} terpaksa bayar calo Rp 3.000.000 dan stres naik +15%.`,
            'INFO',
            player.id
          );
        }
        break;
      }

      case 'EVENT_MUSIBAH': {
        soundManager.playSirenOTT();
        const eventData: DrawCardEventState = {
          type: 'MUSIBAH',
          cardsPool: MUSIBAH_EVENT_CARDS,
          targetPlayer: player,
        };
        activeDrawCardEventRef.current = eventData;
        setActiveDrawCardEvent(eventData);
        break;
      }

      case 'EVENT_TAKDIR': {
        soundManager.playCash();
        const eventData: DrawCardEventState = {
          type: 'TAKDIR',
          cardsPool: TAKDIR_EVENT_CARDS,
          targetPlayer: player,
        };
        activeDrawCardEventRef.current = eventData;
        setActiveDrawCardEvent(eventData);
        break;
      }

      case 'BANSOS_LUCK': {
        soundManager.playCash();
        setPlayers(prev =>
          prev.map(p =>
            p.id === player.id
              ? {
                  ...p,
                  cash: p.cash + 15_000_000,
                  stress: Math.max(0, p.stress - 10),
                }
              : p
          )
        );
        addLog(
          `Rezeki nomplok! ${player.name} dapat Bansos Beras & Tunai senilai Rp 15 Jt dan Stres reda.`,
          'CASH',
          player.id
        );
        break;
      }

      case 'PRISON_SUKAMISKIN': {
        addLog(
          `${player.name} mengunjungi Lapas Sukamiskin untuk membesuk rekan sejawat di ruang VIP.`,
          'INFO',
          player.id
        );
        break;
      }
    }
  };

  // Step-by-Step Tactile Movement Engine
  const executePlayerMove = (player: Player, totalSteps: number) => {
    setIsMoving(true);

    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }

    if (player.isInCorruptionRoute) {
      let newPos = player.position;
      let exitRoute = false;
      if (player.position === 100) newPos = 101;
      else if (player.position === 101) newPos = 102;
      else if (player.position === 102) newPos = 103;
      else {
        newPos = 21;
        exitRoute = true;
      }

      soundManager.playPawnStep(1);
      setPlayers(prev =>
        prev.map(p => {
          if (p.id !== player.id) return p;
          return {
            ...p,
            position: newPos,
            isInCorruptionRoute: exitRoute ? false : p.isInCorruptionRoute,
          };
        })
      );

      if (exitRoute) {
        addLog(
          `${player.name} keluar dari Rute Korupsi menuju Gedung DPR Senayan!`,
          'POLITIC',
          player.id
        );
      }

      moveTimerRef.current = setTimeout(() => {
        soundManager.playPawnLand();
        setIsMoving(false);
        setHasRolled(true);
        const freshPlayer =
          players.find(p => p.id === player.id) || {
            ...player,
            position: newPos,
            isInCorruptionRoute: exitRoute ? false : player.isInCorruptionRoute,
          };
        resolveLandingTile(
          {
            ...freshPlayer,
            position: newPos,
            isInCorruptionRoute: exitRoute ? false : freshPlayer.isInCorruptionRoute,
          },
          newPos
        );
      }, 350);
      return;
    }

    let currentStep = 0;
    let currentPos = player.position;
    let passedStartAwarded = false;
    const stepInterval = 210;

    const stepPawn = () => {
      currentStep++;
      const nextPos = (currentPos + 1) % 28;
      currentPos = nextPos;

      soundManager.playPawnStep(currentStep);

      if (nextPos === 0 && !passedStartAwarded) {
        passedStartAwarded = true;
        const inflationFactor = 1 + macro.inflationRate / 100;
        const baseSalary = 45_000_000;
        const bonusPct =
          (CHARACTER_ARCHETYPES.find(a => a.id === player.archetypeId)?.salaryBonusPercent || 0) /
          100;
        const totalSalary = Math.round(baseSalary * inflationFactor * (1 + bonusPct));

        const hasDepositBuff = player.konohaBuffs?.some(b => b.type === 'INTEREST_RATE_HIKE');
        let depositDividends = 0;
        if (hasDepositBuff) {
          depositDividends = Math.min(15_000_000, Math.max(2_000_000, Math.round(player.cash * 0.05)));
        }

        soundManager.playCash();
        setPlayers(prev =>
          prev.map(p => {
            if (p.id !== player.id) return p;
            return {
              ...p,
              position: nextPos,
              cash: p.cash + totalSalary + depositDividends,
              stress: Math.max(0, p.stress - 10),
            };
          })
        );
        if (depositDividends > 0) {
          addLog(
            `${player.name} melewati START! Gajian UMR cair ${formatRupiah(totalSalary)} + 💰 Dividen Deposito Hawkish BI ${formatRupiah(depositDividends)}! Stres turun 10%.`,
            'CASH',
            player.id
          );
        } else {
          addLog(
            `${player.name} melewati START! Gajian UMR cair ${formatRupiah(totalSalary)} dan Stres turun 10%.`,
            'CASH',
            player.id
          );
        }
      } else {
        setPlayers(prev => prev.map(p => (p.id === player.id ? { ...p, position: nextPos } : p)));
      }

      if (currentStep < totalSteps) {
        moveTimerRef.current = setTimeout(stepPawn, stepInterval);
      } else {
        moveTimerRef.current = setTimeout(() => {
          soundManager.playPawnLand();
          setIsMoving(false);
          setHasRolled(true);
          const freshPlayer = players.find(p => p.id === player.id) || {
            ...player,
            position: nextPos,
          };
          resolveLandingTile({ ...freshPlayer, position: nextPos }, nextPos);
        }, 220);
      }
    };

    moveTimerRef.current = setTimeout(stepPawn, 80);
  };

  const handleRollDice = (d1: number, d2: number, total: number) => {
    if (!activePlayer || activePlayer.isBankrupt || hasRolled || isRolling || isMoving || rentCrisis)
      return;

    setIsRolling(true);
    setLastRoll({ d1, d2, total });
    setDiceRollAnimation({
      player: activePlayer,
      d1,
      d2,
      total,
    });
  };

  const handleRollAnimationComplete = () => {
    if (!diceRollAnimation) return;
    const { player, total } = diceRollAnimation;
    setDiceRollAnimation(null);
    setIsRolling(false);
    executePlayerMove(player, total);
  };

  return {
    checkStressThreshold,
    handleRollDice,
    handleRollAnimationComplete,
    executePlayerMove,
    resolveLandingTile,
  };
}
