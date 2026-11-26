import React from 'react';
import { BoardTile, GameLogItem, MacroEconomy, Player } from '../types/game';
import { formatRupiah } from '../utils/format';
import { soundManager } from '../utils/sound';
import { RentCrisisState } from '../components/GameModals';
import { RentTransferData } from '../components/ManualRentPaymentModal';

interface UsePropertyAndRentParams {
  activePlayer: Player | null;
  players: Player[];
  perimeterTiles: BoardTile[];
  macro: MacroEconomy;
  rentCrisis: RentCrisisState | null;
  manualRentData: RentTransferData | null;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setPerimeterTiles: React.Dispatch<React.SetStateAction<BoardTile[]>>;
  setRentCrisis: React.Dispatch<React.SetStateAction<RentCrisisState | null>>;
  setManualRentData: React.Dispatch<React.SetStateAction<RentTransferData | null>>;
  addLog: (message: string, type?: GameLogItem['type'], playerId?: string) => void;
  checkStressThreshold: (player: Player) => boolean;
  onPlayerBankruptcy: (player: Player, cause: string) => void;
}

export function usePropertyAndRent({
  activePlayer,
  players,
  perimeterTiles,
  macro,
  rentCrisis,
  manualRentData,
  setPlayers,
  setPerimeterTiles,
  setRentCrisis,
  setManualRentData,
  addLog,
  checkStressThreshold,
  onPlayerBankruptcy,
}: UsePropertyAndRentParams) {
  const handleSellPropertyForRent = (tileId: number, sellValue: number) => {
    if (!rentCrisis) return;
    const soldTile = perimeterTiles.find(t => t.id === tileId);
    setPerimeterTiles(prev =>
      prev.map(t => (t.id === tileId ? { ...t, ownerId: null, level: 1 } : t))
    );
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === rentCrisis.payer.id) {
          const updated: Player = {
            ...p,
            cash: p.cash + sellValue,
            ownedProperties: p.ownedProperties.filter(id => id !== tileId),
          };
          setRentCrisis(prevCrisis => (prevCrisis ? { ...prevCrisis, payer: updated } : null));
          return updated;
        }
        return p;
      })
    );
    const purpose = rentCrisis.title ? rentCrisis.title : 'utang sewa';
    addLog(
      `${rentCrisis.payer.name} menjual aset ${soldTile?.certificateTitle || soldTile?.name || 'Surat Tanah'} seharga ${formatRupiah(sellValue)} untuk melunasi ${purpose}.`,
      'CASH',
      rentCrisis.payer.id
    );
  };

  const handleSellAllPropertiesForRent = (sales: { tileId: number; sellValue: number }[]) => {
    if (!rentCrisis) return;
    const soldIds = sales.map(s => s.tileId);
    const totalEarned = sales.reduce((a, b) => a + b.sellValue, 0);
    setPerimeterTiles(prev =>
      prev.map(t => (soldIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t))
    );
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === rentCrisis.payer.id) {
          const updated: Player = {
            ...p,
            cash: p.cash + totalEarned,
            ownedProperties: p.ownedProperties.filter(id => !soldIds.includes(id)),
          };
          setRentCrisis(prevCrisis => (prevCrisis ? { ...prevCrisis, payer: updated } : null));
          return updated;
        }
        return p;
      })
    );
    const purpose = rentCrisis.title ? rentCrisis.title : 'utang sewa';
    addLog(
      `${rentCrisis.payer.name} melikuidasi seluruh asetnya (+${formatRupiah(totalEarned)}) untuk melunasi ${purpose}.`,
      'DANGER',
      rentCrisis.payer.id
    );
  };

  const handlePayRentFromCrisis = () => {
    if (!rentCrisis) return;
    const { payer, owner, rentCost, tile, onPaySuccess, amountDue } = rentCrisis;

    if (onPaySuccess) {
      const currentPayer = players.find(p => p.id === payer.id) || payer;
      onPaySuccess(currentPayer);
      setRentCrisis(null);
      return;
    }

    const cost = amountDue ?? rentCost ?? 0;
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === payer.id) {
          const updated: Player = {
            ...p,
            cash: p.cash - cost,
            stress: Math.min(100, p.stress + 10),
            stats: { ...p.stats, totalRentPaid: p.stats.totalRentPaid + (rentCost || cost) },
          };
          checkStressThreshold(updated);
          return updated;
        }
        if (owner && p.id === owner.id) {
          return {
            ...p,
            cash: p.cash + cost,
            stats: { ...p.stats, totalRentEarned: p.stats.totalRentEarned + cost },
          };
        }
        return p;
      })
    );
    if (owner && tile) {
      addLog(
        `${payer.name} melunasi sewa ${formatRupiah(cost)} kepada ${owner.name} untuk ${tile.name}!`,
        'CASH',
        payer.id
      );
    } else {
      addLog(
        `${payer.name} melunasi kewajiban pembayaran ${formatRupiah(cost)}!`,
        'CASH',
        payer.id
      );
    }
    setRentCrisis(null);
  };

  const handleBankruptcyFromRentCrisis = () => {
    if (!rentCrisis) return;
    const { payer, owner, rentCost, amountDue, causeDesc } = rentCrisis;
    const cost = amountDue ?? rentCost ?? 0;
    const remainingPaid = payer.cash;
    if (owner && remainingPaid > 0) {
      setPlayers(prev =>
        prev.map(p => {
          if (p.id === owner.id) {
            return {
              ...p,
              cash: p.cash + remainingPaid,
              stats: { ...p.stats, totalRentEarned: p.stats.totalRentEarned + remainingPaid },
            };
          }
          return p;
        })
      );
    }
    const reason = causeDesc
      ? `Tidak mampu melunasi ${causeDesc} (${formatRupiah(cost)})`
      : owner
        ? `Tidak mampu membayar sewa ${formatRupiah(cost)} kepada ${owner.name}`
        : `Tidak mampu melunasi kewajiban ${formatRupiah(cost)}`;
    onPlayerBankruptcy(payer, reason);
    setRentCrisis(null);
  };

  const handleUseSpecialCardForRent = (cardId: string) => {
    if (!rentCrisis) return;
    const { payer, owner, title } = rentCrisis;
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === payer.id) {
          return {
            ...p,
            specialCards: p.specialCards?.filter(c => c.id !== cardId),
          };
        }
        return p;
      })
    );
    addLog(
      `${payer.name} mengaktifkan Kartu Sakti Ordal! Bebas dari tagihan ${title || (owner ? `sewa milik ${owner.name}` : 'kewajiban')}.`,
      'POLITIC',
      payer.id
    );
    setRentCrisis(null);
  };

  const handleConfirmManualRentPayment = () => {
    if (!manualRentData) return;
    const { payer, owner, tile, rentCost } = manualRentData;

    setPlayers(prev =>
      prev.map(p => {
        if (p.id === payer.id) {
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
      `💸 ${payer.name} melunasi sewa ${formatRupiah(rentCost)} kepada ${owner.name} untuk properti ${tile.name}!`,
      'CASH',
      payer.id
    );
    setManualRentData(null);
  };

  const handleUseSpecialCardForManualRent = (cardId: string) => {
    if (!manualRentData) return;
    const { payer, owner, tile } = manualRentData;
    setPlayers(prev =>
      prev.map(p => {
        if (p.id === payer.id) {
          return {
            ...p,
            specialCards: p.specialCards?.filter(c => c.id !== cardId),
          };
        }
        return p;
      })
    );
    addLog(
      `🛡️ ${payer.name} mengaktifkan Kartu Ordal Sakti! Bebas 100% dari tagihan sewa properti ${tile.name} milik ${owner.name}!`,
      'POLITIC',
      payer.id
    );
    setManualRentData(null);
  };

  const handleBuyProperty = () => {
    if (!activePlayer || activePlayer.isBankrupt) return;
    const currentTile = perimeterTiles.find(t => t.id === activePlayer.position);
    if (!currentTile || currentTile.actionType !== 'PROPERTY' || currentTile.ownerId) return;

    const inflationFactor = 1 + macro.inflationRate / 100;
    const cost = Math.round((currentTile.price || 0) * inflationFactor);

    if (activePlayer.cash < cost) return;

    soundManager.playCash();

    setPlayers(prev =>
      prev.map(p =>
        p.id === activePlayer.id
          ? {
              ...p,
              cash: p.cash - cost,
              ownedProperties: [...p.ownedProperties, currentTile.id],
            }
          : p
      )
    );

    setPerimeterTiles(prev =>
      prev.map(t =>
        t.id === currentTile.id
          ? {
              ...t,
              ownerId: activePlayer.id,
              level: 1,
            }
          : t
      )
    );

    addLog(
      `${activePlayer.name} membeli Surat Tanah ${currentTile.certificateTitle || currentTile.name} seharga ${formatRupiah(cost)}!`,
      'CASH',
      activePlayer.id
    );
  };

  const handleUpgradeProperty = () => {
    if (!activePlayer || activePlayer.isBankrupt) return;
    const currentTile = perimeterTiles.find(t => t.id === activePlayer.position);
    if (!currentTile || currentTile.ownerId !== activePlayer.id) return;

    const currentLevel = currentTile.level || 1;
    if (currentLevel >= 3) return;

    const inflationFactor = 1 + macro.inflationRate / 100;
    let upgradeDiscount = 0;
    if (activePlayer.konohaBuffs?.some(b => b.type === 'INTEREST_RATE_CUT')) {
      upgradeDiscount = Math.max(upgradeDiscount, 0.3);
    }
    if (activePlayer.konohaBuffs?.some(b => b.type === 'INFLATION_REDUCTION')) {
      upgradeDiscount = Math.max(upgradeDiscount, 0.2);
    }
    const baseUpgrade = (currentTile.upgradeCost || 0) * inflationFactor;
    const upgradeCost = Math.round(baseUpgrade * (1 - upgradeDiscount));

    if (activePlayer.cash < upgradeCost) return;

    soundManager.playCash();

    setPlayers(prev =>
      prev.map(p =>
        p.id === activePlayer.id
          ? {
              ...p,
              cash: p.cash - upgradeCost,
            }
          : p
      )
    );

    setPerimeterTiles(prev =>
      prev.map(t =>
        t.id === currentTile.id
          ? {
              ...t,
              level: currentLevel + 1,
            }
          : t
      )
    );

    const discountNote =
      upgradeDiscount > 0 ? ` (Diskon Takdir Konoha ${(upgradeDiscount * 100).toFixed(0)}%)` : '';
    addLog(
      `${activePlayer.name} meningkatkan cabang usaha ${currentTile.name} ke Tingkat ${currentLevel + 1}${discountNote}!`,
      'CASH',
      activePlayer.id
    );
  };

  return {
    handleSellPropertyForRent,
    handleSellAllPropertiesForRent,
    handlePayRentFromCrisis,
    handleBankruptcyFromRentCrisis,
    handleUseSpecialCardForRent,
    handleConfirmManualRentPayment,
    handleUseSpecialCardForManualRent,
    handleBuyProperty,
    handleUpgradeProperty,
  };
}
