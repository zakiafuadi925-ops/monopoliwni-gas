import React from 'react';
import { BoardTile, GameLogItem, MacroEconomy, Player } from '../types/game';
import { LuxuryLaunderProperty } from '../data/luxuryProperties';
import { calculatePropertySellValue } from '../engine/economy';
import { formatRupiah } from '../utils/format';
import { soundManager } from '../utils/sound';
import { RentCrisisState } from '../components/GameModals';

interface UseCorruptionAndJailParams {
  activePlayer: Player | null;
  perimeterTiles: BoardTile[];
  macro: MacroEconomy;
  aiEndTurnTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setPerimeterTiles: React.Dispatch<React.SetStateAction<BoardTile[]>>;
  setLuxuryTiles: React.Dispatch<React.SetStateAction<BoardTile[]>>;
  setShowCorruptionAudit: React.Dispatch<React.SetStateAction<boolean>>;
  setShowKpkBribe: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMoneyLaundering: React.Dispatch<React.SetStateAction<boolean>>;
  setRentCrisis: React.Dispatch<React.SetStateAction<RentCrisisState | null>>;
  addLog: (message: string, type?: GameLogItem['type'], playerId?: string) => void;
  checkStressThreshold: (player: Player) => boolean;
  onEndTurn: () => void;
}

export function useCorruptionAndJail({
  activePlayer,
  perimeterTiles,
  macro,
  aiEndTurnTimerRef,
  setPlayers,
  setPerimeterTiles,
  setLuxuryTiles,
  setShowCorruptionAudit,
  setShowKpkBribe,
  setShowMoneyLaundering,
  setRentCrisis,
  addLog,
  checkStressThreshold,
  onEndTurn,
}: UseCorruptionAndJailParams) {
  const scheduleAiEndTurn = (delayMs: number) => {
    if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
    aiEndTurnTimerRef.current = setTimeout(() => {
      onEndTurn();
    }, delayMs);
  };

  // Refuse KPK Bribe Handler (FULL SEVERE PUNISHMENT)
  const handleRefuseKpkBribe = () => {
    setShowKpkBribe(false);
    if (!activePlayer || activePlayer.isBankrupt) return;

    soundManager.playSirenOTT();

    const playerProps = perimeterTiles
      .filter(t => t.ownerId === activePlayer.id)
      .sort((a, b) => (b.price || 0) - (a.price || 0));
    const seizedProps = playerProps.slice(0, 2);
    const seizedIds = seizedProps.map(t => t.id);

    if (seizedIds.length > 0) {
      setPerimeterTiles(prev =>
        prev.map(t => (seizedIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t))
      );
    }

    setPlayers(prev =>
      prev.map(p => {
        if (p.id === activePlayer.id) {
          const updated: Player = {
            ...p,
            cash: Math.max(0, Math.round(p.cash * 0.2)),
            ownedProperties: p.ownedProperties.filter(id => !seizedIds.includes(id)),
            stress: 100,
            politicalInfluence: Math.max(0, p.politicalInfluence - 50),
            inJail: true,
            jailTurnsLeft: 4,
            isInCorruptionRoute: false,
            position: 14,
            kpkSuspicionLevel: 40,
            stats: { ...p.stats, timesInJail: p.stats.timesInJail + 1 },
          };
          checkStressThreshold(updated);
          return updated;
        }
        return p;
      })
    );

    const seizedDesc =
      seizedProps.length > 0
        ? `Aset properti tanah disita negara: ${seizedProps.map(p => p.name).join(', ')}`
        : 'Tidak ada sertifikat tanah yang dapat disita';

    addLog(
      `VONIS TIPIKOR OTT KPK: ${activePlayer.name} dijatuhi vonis maksimal! HUKUMAN BERAT: Sita 80% uang kas tunai, ${seizedDesc}, vonis 4 putaran di Lapas Sukamiskin, pencabutan 50 poin hak politik, dan stres melonjak ke 100%!`,
      'DANGER',
      activePlayer.id
    );
  };

  // Corruption Audit Resolve (BPK & KPK)
  const handleCorruptionAuditResolve = (caught: boolean) => {
    setShowCorruptionAudit(false);
    if (!activePlayer || activePlayer.isBankrupt) return;

    if (caught) {
      soundManager.playSirenOTT();

      const bribeRequired = 65_000_000;
      if (activePlayer.isAi) {
        if (activePlayer.cash >= bribeRequired) {
          soundManager.playCash();
          setPlayers(prev =>
            prev.map(p =>
              p.id === activePlayer.id
                ? {
                    ...p,
                    cash: p.cash - bribeRequired,
                    politicalInfluence: Math.max(0, p.politicalInfluence - 30),
                    kpkSuspicionLevel: 30,
                    stress: Math.min(100, p.stress + 20),
                    isInCorruptionRoute: false,
                    position: 21,
                  }
                : p
            )
          );
          addLog(
            `${activePlayer.name} (AI) membayar uang damai penanganan perkara Tipikor Rp 65.000.000! Pengaruh politik terpangkas -30 dan stres naik.`,
            'CASH',
            activePlayer.id
          );
        } else {
          const aiProps = perimeterTiles
            .filter(t => t.ownerId === activePlayer.id)
            .sort((a, b) => (b.price || 0) - (a.price || 0));
          const seizedProps = aiProps.slice(0, 2);
          const seizedIds = seizedProps.map(t => t.id);

          if (seizedIds.length > 0) {
            setPerimeterTiles(prev =>
              prev.map(t => (seizedIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t))
            );
          }

          setPlayers(prev =>
            prev.map(p => {
              if (p.id !== activePlayer.id) return p;
              const updated: Player = {
                ...p,
                cash: Math.max(0, Math.round(p.cash * 0.2)),
                ownedProperties: p.ownedProperties.filter(id => !seizedIds.includes(id)),
                stress: 100,
                politicalInfluence: Math.max(0, p.politicalInfluence - 50),
                inJail: true,
                jailTurnsLeft: 4,
                isInCorruptionRoute: false,
                position: 14,
                kpkSuspicionLevel: 40,
                stats: { ...p.stats, timesInJail: p.stats.timesInJail + 1 },
              };
              checkStressThreshold(updated);
              return updated;
            })
          );

          const seizedNames = seizedProps.map(p => p.name).join(', ') || 'tidak ada aset tanah';
          addLog(
            `EKSEKUSI OTT KPK BERAT! ${activePlayer.name} (AI) terbukti korupsi! HUKUMAN BERAT: 80% kas disita negara, aset disita (${seizedNames}), divonis 4 putaran Lapas Sukamiskin, hak politik -50, & stres 100%!`,
            'DANGER',
            activePlayer.id
          );
        }

        scheduleAiEndTurn(1400);
      } else {
        setShowKpkBribe(true);
      }
    } else {
      soundManager.playVictory();
      setPlayers(prev =>
        prev.map(p =>
          p.id === activePlayer.id
            ? {
                ...p,
                isInCorruptionRoute: false,
                position: 21,
                politicalInfluence: Math.min(100, p.politicalInfluence + 20),
                kpkSuspicionLevel: Math.max(0, p.kpkSuspicionLevel - 20),
              }
            : p
        )
      );

      addLog(
        `LOLOS CUCI UANG! ${activePlayer.name} berhasil mengamankan aset korupsi dan melenggang ke Gedung DPR Senayan!`,
        'POLITIC',
        activePlayer.id
      );

      if (activePlayer.isAi) {
        scheduleAiEndTurn(1400);
      }
    }
  };

  // Pay KPK Bribe Handler
  const handlePayKpkBribe = () => {
    setShowKpkBribe(false);
    if (!activePlayer || activePlayer.isBankrupt) return;
    const bribeAmount = 65_000_000;
    if (activePlayer.cash < bribeAmount) {
      const ownedTiles = perimeterTiles.filter(t => t.ownerId === activePlayer.id);
      const totalLiquidation = ownedTiles.reduce(
        (sum, t) => sum + calculatePropertySellValue(t, macro),
        0
      );
      if (activePlayer.cash + totalLiquidation >= bribeAmount) {
        setRentCrisis({
          crisisType: 'KPK_BRIBE',
          payer: activePlayer,
          amountDue: bribeAmount,
          title: 'OTT KPK · Uang Pengamanan Perkara Tipikor',
          subtitle: 'KRISIS KAS TUNAI · SUAP OKNUM PENYIDIK',
          description:
            'Untuk menghindari hukuman berat (sita 80% kas, sita aset, dan 4 putaran penjara Sukamiskin), Anda harus membayar uang damai Rp 65.000.000. Jual aset tanah Anda untuk melunasi biaya ini.',
          causeDesc: 'suap OTT KPK Rp 65.000.000',
          recipientName: 'Oknum Penyidik KPK',
          recipientAvatar: '🚨',
          onPaySuccess: updatedPayer => {
            soundManager.playCash();
            setPlayers(prev =>
              prev.map(p =>
                p.id === updatedPayer.id
                  ? {
                      ...p,
                      cash: p.cash - bribeAmount,
                      politicalInfluence: Math.max(0, p.politicalInfluence - 30),
                      stress: Math.min(100, p.stress + 20),
                      isInCorruptionRoute: false,
                      position: 21,
                      kpkSuspicionLevel: 30,
                    }
                  : p
              )
            );
            addLog(
              `${updatedPayer.name} membayar uang damai Rp 65.000.000 ke oknum penyidik! Bebas dari Lapas Sukamiskin, hak politik -30, & lolos ke DPR Senayan.`,
              'CASH',
              updatedPayer.id
            );
          },
        });
        return;
      } else {
        handleRefuseKpkBribe();
        return;
      }
    }

    soundManager.playCash();
    setPlayers(prev =>
      prev.map(p =>
        p.id === activePlayer.id
          ? {
              ...p,
              cash: p.cash - bribeAmount,
              politicalInfluence: Math.max(0, p.politicalInfluence - 30),
              stress: Math.min(100, p.stress + 20),
              isInCorruptionRoute: false,
              position: 21,
              kpkSuspicionLevel: 30,
            }
          : p
      )
    );

    addLog(
      `${activePlayer.name} membayar uang suap damai Rp 65.000.000 ke oknum penyidik! Bebas dari Lapas Sukamiskin, hak politik -30, dan tiba di DPR Senayan.`,
      'CASH',
      activePlayer.id
    );
  };

  // Pay Jail Bribe
  const handlePayJailBribe = () => {
    if (!activePlayer || !activePlayer.inJail || activePlayer.isBankrupt) return;
    const bribeAmount = 20_000_000;
    if (activePlayer.cash < bribeAmount) return;

    soundManager.playCash();
    setPlayers(prev =>
      prev.map(p =>
        p.id === activePlayer.id
          ? {
              ...p,
              cash: p.cash - bribeAmount,
              inJail: false,
              jailTurnsLeft: 0,
              stress: Math.max(0, p.stress - 15),
            }
          : p
      )
    );

    addLog(
      `${activePlayer.name} menyuap sipir Lapas sebesar Rp 20 Jt! Mendapat remisi kilat dan langsung bebas.`,
      'CASH',
      activePlayer.id
    );
  };

  // Money Laundering Handlers in Corruption Route
  const handleLaunderBuyLuxury = (property: LuxuryLaunderProperty) => {
    setShowMoneyLaundering(false);
    if (!activePlayer || activePlayer.isBankrupt) return;

    if (activePlayer.cash < property.launderPrice) {
      addLog(
        `${activePlayer.name} gagal membeli aset ${property.shortName} karena saldo tunai tidak mencukupi.`,
        'DANGER',
        activePlayer.id
      );
      return;
    }

    soundManager.playCash();
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === activePlayer.id) {
          const updated: Player = {
            ...p,
            cash: p.cash - property.launderPrice,
            ownedProperties: [...p.ownedProperties.filter(id => id !== property.id), property.id],
            kpkSuspicionLevel: Math.min(100, p.kpkSuspicionLevel + property.kpkRiskIncrease),
            stress: Math.max(0, p.stress - property.stressRelief),
            stats: {
              ...p.stats,
              totalCorruptionGains:
                p.stats.totalCorruptionGains + (property.normalPrice - property.launderPrice),
            },
          };
          checkStressThreshold(updated);
          return updated;
        }
        return p;
      })
    );

    setPerimeterTiles(prev =>
      prev.map(t => (t.id === property.id ? { ...t, ownerId: activePlayer.id, level: 1 } : t))
    );
    setLuxuryTiles(prev =>
      prev.map(t => (t.id === property.id ? { ...t, ownerId: activePlayer.id, level: 1 } : t))
    );

    addLog(
      `💎 PENCUCIAN UANG BERHASIL! ${activePlayer.name} memborong Petak #${property.tileNumber || property.id} "${property.name}" dengan potongan pajak 40% seharga ${formatRupiah(property.launderPrice)}! Aset resmi terdaftar di peta dan radar KPK naik +${property.kpkRiskIncrease}%.`,
      'CASH',
      activePlayer.id
    );

    if (activePlayer.isAi) {
      scheduleAiEndTurn(1400);
    }
  };

  const handleLaunderBuyPerimeter = (tile: BoardTile, discountedCost: number, kpkRisk: number) => {
    setShowMoneyLaundering(false);
    if (!activePlayer || activePlayer.isBankrupt) return;

    if (activePlayer.cash < discountedCost) {
      addLog(
        `${activePlayer.name} gagal membeli aset ${tile.name} karena saldo tidak mencukupi.`,
        'DANGER',
        activePlayer.id
      );
      return;
    }

    soundManager.playCash();
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === activePlayer.id) {
          return {
            ...p,
            cash: p.cash - discountedCost,
            ownedProperties: [...p.ownedProperties.filter(id => id !== tile.id), tile.id],
            kpkSuspicionLevel: Math.min(100, p.kpkSuspicionLevel + kpkRisk),
          };
        }
        return p;
      })
    );

    setPerimeterTiles(prev =>
      prev.map(t => (t.id === tile.id ? { ...t, ownerId: activePlayer.id, level: 1 } : t))
    );
    setLuxuryTiles(prev =>
      prev.map(t => (t.id === tile.id ? { ...t, ownerId: activePlayer.id, level: 1 } : t))
    );

    addLog(
      `🏢 PENCUCIAN UANG ASET PETA: ${activePlayer.name} memborong Petak #${tile.id} ${tile.certificateTitle || tile.name} dengan diskon pajak 40% seharga ${formatRupiah(discountedCost)}! Radar deteksi KPK bertambah +${kpkRisk}%.`,
      'CASH',
      activePlayer.id
    );

    if (activePlayer.isAi) {
      scheduleAiEndTurn(1400);
    }
  };

  const handleSkipLaundering = () => {
    setShowMoneyLaundering(false);
    if (activePlayer) {
      addLog(
        `${activePlayer.name} memilih tidak mencuci uang di petak ini demi menghindari risiko radar deteksi KPK.`,
        'INFO',
        activePlayer.id
      );
    }

    if (activePlayer?.isAi) {
      scheduleAiEndTurn(1200);
    }
  };

  return {
    handleCorruptionAuditResolve,
    handlePayKpkBribe,
    handleRefuseKpkBribe,
    handlePayJailBribe,
    handleLaunderBuyLuxury,
    handleLaunderBuyPerimeter,
    handleSkipLaundering,
  };
}
