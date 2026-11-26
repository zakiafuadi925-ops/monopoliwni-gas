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
  onEndTurn,
  onPayJailBribe,
  onOpenStats,
}) => {
  const isBusy = isRolling || isMoving;
  const inflationFactor = 1 + macro.inflationRate / 100;
  const adjustedPrice = currentLandingTile.price
    ? Math.round(currentLandingTile.price * inflationFactor)
    : 0;

  const canBuy =
    hasRolled &&
    !isBusy &&
    !isOnlineTurnLocked &&
    currentLandingTile.actionType === 'PROPERTY' &&
    !currentLandingTile.ownerId &&
    activePlayer.cash >= adjustedPrice;

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
      {/* Player badge row */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: activePlayer.color }}
        />
        <span className="text-xs font-semibold text-slate-200 flex-1 truncate">
          {activePlayer.name}
        </span>
        <span className="text-xs text-amber-400 font-bold tabular-nums">
          {formatRupiah(activePlayer.cash)}
        </span>
        <button
          onClick={onOpenStats}
          className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
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
        <div className="flex items-center gap-2 px-3 pb-3">
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
              <Key size={16} /> Suap Keluar Penjara
            </button>
          )}

          {/* Buy property */}
          {canBuy && (
            <button
              onClick={onBuyProperty}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors active:scale-95"
            >
              <Building2 size={16} /> Beli ({formatRupiahShort(adjustedPrice)})
            </button>
          )}

          {/* End turn */}
          {canEndTurn && (
            <button
              onClick={onEndTurn}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors active:scale-95"
            >
              <ArrowRight size={16} /> Akhiri Giliran
            </button>
          )}

          {/* Waiting state */}
          {!canRoll && !canPayJail && !canBuy && !canEndTurn && (
            <div className="flex-1 flex items-center justify-center py-2.5 text-xs text-slate-500">
              {isBusy ? 'Memproses…' : 'Menunggu aksi…'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
