import React from 'react';
import { Player, BoardTile, MacroEconomy } from '../types/game';
import { formatRupiah, formatRupiahShort } from '../utils/format';
import {
  Building2,
  ArrowRight,
  Key,
  BarChart3,
  Lock,
  Dices,
  TrendingUp,
} from 'lucide-react';

interface MobileActionDockProps {
  activePlayer: Player;
  currentLandingTile: BoardTile;
  macro: MacroEconomy;
  hasRolled: boolean;
  isRolling: boolean;
  isMoving: boolean;
  isOnlineTurnLocked: boolean;
  onRoll: (d1: number, d2: number, total: number) => void;
  onBuyProperty: () => void;
  onUpgradeProperty?: () => void;
  onEndTurn: () => void;
  onPayJailBribe: () => void;
  onOpenStats: () => void;
}

export const MobileActionDock: React.FC<MobileActionDockProps> = ({
  activePlayer,
  currentLandingTile,
  macro,
  hasRolled,
  isRolling,
  isMoving,
  isOnlineTurnLocked,
  onRoll,
  onBuyProperty,
  onUpgradeProperty,
  onEndTurn,
  onPayJailBribe,
  onOpenStats,
}) => {
  const isBusy = isRolling || isMoving;
  const inflationFactor = 1 + macro.inflationRate / 100;
  const adjustedPrice = currentLandingTile.price
    ? Math.round(currentLandingTile.price * inflationFactor)
    : 0;
  const adjustedUpgrade = currentLandingTile.upgradeCost
    ? Math.round(currentLandingTile.upgradeCost * inflationFactor)
    : 0;

  const canBuy =
    hasRolled &&
    !isBusy &&
    !isOnlineTurnLocked &&
    currentLandingTile.actionType === 'PROPERTY' &&
    !currentLandingTile.ownerId &&
    activePlayer.cash >= adjustedPrice;

  const canUpgrade =
    Boolean(onUpgradeProperty) &&
    hasRolled &&
    !isBusy &&
    !isOnlineTurnLocked &&
    currentLandingTile.actionType === 'PROPERTY' &&
    currentLandingTile.ownerId === activePlayer.id &&
    (currentLandingTile.level || 1) < 3 &&
    activePlayer.cash >= adjustedUpgrade;

  const canEndTurn = hasRolled && !isBusy && !isOnlineTurnLocked;
  const canRoll = !hasRolled && !isBusy && !isOnlineTurnLocked && !activePlayer.inJail;
  const canPayJail =
    !hasRolled && !isBusy && !isOnlineTurnLocked && activePlayer.inJail;

  const handleMobileRoll = () => {
    if (!canRoll) return;
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    onRoll(d1, d2, d1 + d2);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/97 backdrop-blur-md border-t border-slate-700/70 shadow-2xl pb-[env(safe-area-inset-bottom)]">
      {/* Player badge + quick vitals row */}
      <div className="flex items-center gap-1.5 px-3 pt-2 pb-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: activePlayer.color }}
        />
        <span className="text-xs font-semibold text-slate-200 truncate max-w-[96px]">
          {activePlayer.name}
        </span>
        <div className="flex items-center gap-1 text-[9px] font-mono shrink-0">
          <span
            className={`px-1 py-0.5 rounded ${
              activePlayer.stress >= 80
                ? 'bg-rose-950 text-rose-300'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            Stres {activePlayer.stress}%
          </span>
          <span
            className={`px-1 py-0.5 rounded ${
              activePlayer.kpkSuspicionLevel >= 60
                ? 'bg-amber-950 text-amber-300'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            KPK {activePlayer.kpkSuspicionLevel}%
          </span>
        </div>
        <span className="flex-1 text-right text-xs text-amber-400 font-bold tabular-nums">
          {formatRupiah(activePlayer.cash)}
        </span>
        <button
          onClick={onOpenStats}
          className="p-1 text-slate-400 hover:text-amber-400 transition-colors shrink-0"
          title="Statistik"
          aria-label="Statistik"
        >
          <BarChart3 size={15} />
        </button>
      </div>

      {/* Locked overlay message */}
      {isOnlineTurnLocked && (
        <div className="flex items-center justify-center gap-2 py-2.5 text-xs text-indigo-300">
          <Lock size={13} /> Menunggu giliran pemain lain…
        </div>
      )}

      {/* Action buttons row */}
      {!isOnlineTurnLocked && (
        <div className="flex items-center gap-2 px-3 pb-2.5">
          {/* Roll dice */}
          {!hasRolled && !activePlayer.inJail && (
            <button
              onClick={handleMobileRoll}
              disabled={!canRoll}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 text-sm font-black shadow-lg transition-all active:scale-95"
            >
              <Dices size={17} /> {isRolling ? 'Mengocok…' : isMoving ? 'Melangkah…' : 'Kocok Dadu'}
            </button>
          )}

          {/* Pay jail bribe */}
          {canPayJail && (
            <button
              onClick={onPayJailBribe}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors active:scale-95"
            >
              <Key size={16} /> Suap Penjara
            </button>
          )}

          {/* Buy property */}
          {canBuy && (
            <button
              onClick={onBuyProperty}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors active:scale-95"
            >
              <Building2 size={15} /> Beli ({formatRupiahShort(adjustedPrice)})
            </button>
          )}

          {/* Upgrade property */}
          {canUpgrade && onUpgradeProperty && (
            <button
              onClick={onUpgradeProperty}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold transition-colors active:scale-95"
            >
              <TrendingUp size={15} /> Upgrade ({formatRupiahShort(adjustedUpgrade)})
            </button>
          )}

          {/* End turn */}
          {canEndTurn && (
            <button
              onClick={onEndTurn}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-colors active:scale-95"
            >
              <ArrowRight size={15} /> Akhiri
            </button>
          )}

          {/* Waiting state */}
          {!canRoll && !canPayJail && !canBuy && !canUpgrade && !canEndTurn && (
            <div className="flex-1 flex items-center justify-center py-2.5 text-xs text-slate-500">
              {isBusy ? 'Memproses…' : 'Menunggu aksi…'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
