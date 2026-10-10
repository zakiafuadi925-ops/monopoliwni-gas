import React from 'react';
import { Player, BoardTile, MacroEconomy } from '../types/game';
import { formatRupiah, formatRupiahShort } from '../utils/format';
import { DiceRoller } from './DiceRoller';
import { 
  Building2, 
  ArrowRight, 
  AlertCircle, 
  ShieldAlert, 
  Sparkles, 
  Key, 
  TrendingUp,
  HeartCrack,
  Coins
} from 'lucide-react';

interface PlayerHUDProps {
  player: Player;
  currentTile: BoardTile;
  hasRolled: boolean;
  isRolling: boolean;
  lastRoll: { d1: number; d2: number; total: number } | null;
  macro: MacroEconomy;
  onRoll: (d1: number, d2: number, total: number) => void;
  onBuyProperty: () => void;
  onUpgradeProperty: () => void;
  onEndTurn: () => void;
  onPayJailBribe: () => void;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({
  player,
  currentTile,
  hasRolled,
  isRolling,
  lastRoll,
  macro,
  onRoll,
  onBuyProperty,
  onUpgradeProperty,
  onEndTurn,
  onPayJailBribe
}) => {
  const inflationFactor = 1 + (macro.inflationRate / 100);
  const adjustedPrice = currentTile.price ? Math.round(currentTile.price * inflationFactor) : 0;
  const adjustedUpgrade = currentTile.upgradeCost ? Math.round(currentTile.upgradeCost * inflationFactor) : 0;

  const canBuy = hasRolled && 
    currentTile.actionType === 'PROPERTY' && 
    !currentTile.ownerId && 
    player.cash >= adjustedPrice;

  const canUpgrade = hasRolled && 
    currentTile.actionType === 'PROPERTY' && 
    currentTile.ownerId === player.id && 
    (currentTile.level || 1) < 3 && 
    player.cash >= adjustedUpgrade;

  const isStressCritical = player.stress >= 80;

  return (
    <div className="bg-slate-900/95 border-2 border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md">
      {/* Top Row: Player Info & Status Bars */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
        {/* Profile */}
        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-lg border-2 shrink-0"
            style={{ 
              borderColor: player.color, 
              backgroundColor: `${player.color}25` 
            }}
          >
            {player.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base text-white tracking-wide">
                {player.name}
              </h3>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${player.color}30`, color: player.color }}
              >
                {player.title}
              </span>
              {player.inJail && (
                <span className="text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  Di Lapas ({player.jailTurnsLeft} giliran)
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {formatRupiah(player.cash)}
              </span>
              <span className="text-[11px] text-slate-400">
                Kas Tunai
              </span>
            </div>
          </div>
        </div>

        {/* Meters: Stress, Political Influence, KPK Radar */}
        <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 text-xs pt-1 sm:pt-0">
          {/* Stress Meter */}
          <div 
            title="Jika mencapai 100%, pemain wajib membayar Rp 10.000.000 ke psikiater untuk menurunkan stres 20%. Jika kehabisan uang, langsung bangkrut!"
            className="bg-slate-950/60 border border-slate-800 sm:border-0 rounded-lg p-1.5 sm:p-0 sm:w-28 cursor-help"
          >
            <div className="flex justify-between text-[10px] sm:text-[11px] mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <HeartCrack className={`w-3.5 h-3.5 ${isStressCritical ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Stres</span>
              </span>
              <span className={`font-mono font-bold ${isStressCritical ? 'text-rose-400' : 'text-slate-200'}`}>
                {player.stress}%
              </span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className={`h-full transition-all duration-300 ${
                  player.stress >= 80 ? 'bg-rose-500' : player.stress > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, player.stress)}%` }}
              />
            </div>
            {isStressCritical && (
              <span className="text-[9px] text-rose-400 block mt-0.5 leading-none font-bold">
                Psikolog Rp 10 Jt!
              </span>
            )}
          </div>

          {/* Political Influence */}
          <div className="bg-slate-950/60 border border-slate-800 sm:border-0 rounded-lg p-1.5 sm:p-0 sm:w-28">
            <div className="flex justify-between text-[10px] sm:text-[11px] mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Politik</span>
              </span>
              <span className="font-mono font-bold text-amber-300">
                {player.politicalInfluence}
              </span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                style={{ width: `${Math.min(100, player.politicalInfluence)}%` }}
              />
            </div>
          </div>

          {/* Radar KPK */}
          <div className="bg-slate-950/60 border border-slate-800 sm:border-0 rounded-lg p-1.5 sm:p-0 sm:w-24">
            <div className="flex justify-between text-[10px] sm:text-[11px] mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">KPK</span>
              </span>
              <span className="font-mono font-bold text-rose-300">
                {player.kpkSuspicionLevel}%
              </span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-rose-600 transition-all duration-300"
                style={{ width: `${Math.min(100, player.kpkSuspicionLevel)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Dice Roller */}
        <div className="flex items-center gap-2 flex-wrap">
          <DiceRoller 
            onRoll={onRoll}
            isRolling={isRolling}
            disabled={hasRolled || player.inJail}
            lastRoll={lastRoll}
          />

          {player.inJail && (
            <button
              onClick={onPayJailBribe}
              className="min-h-[44px] py-2.5 px-3 bg-rose-900/60 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-300" />
              <span>Suap Sipir Rp 20 Jt</span>
            </button>
          )}

          {/* Kartu Khusus Badge if any */}
          {player.specialCards && player.specialCards.length > 0 && (
            <div 
              title={player.specialCards.map(c => `${c.title}: ${c.effectText}`).join(' | ')}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/60 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-help"
            >
              <span>🎟️</span>
              <span className="hidden sm:inline">Kartu Khusus:</span>
              <span className="font-mono bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black text-[10px]">
                {player.specialCards.length}
              </span>
            </div>
          )}
        </div>

        {/* Property Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1 sm:pt-0">
          {canBuy && (
            <button
              onClick={onBuyProperty}
              className="min-h-[44px] flex-1 sm:flex-initial py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Beli Aset ({formatRupiahShort(adjustedPrice)})</span>
            </button>
          )}

          {canUpgrade && (
            <button
              onClick={onUpgradeProperty}
              className="min-h-[44px] flex-1 sm:flex-initial py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Upgrade Usaha ({formatRupiahShort(adjustedUpgrade)})</span>
            </button>
          )}

          {/* End Turn */}
          <button
            onClick={onEndTurn}
            disabled={!hasRolled && !player.inJail}
            className={`
              min-h-[44px] flex-1 sm:flex-initial py-2.5 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md
              ${hasRolled || player.inJail
                ? 'bg-slate-100 hover:bg-white text-slate-900 cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }
            `}
          >
            <span>Akhiri Giliran</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
