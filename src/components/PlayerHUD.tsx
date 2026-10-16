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
import { 
  StressIndicator, 
  PoliticalInfluenceGauge, 
  KPKRadarGauge,
  KPKRadarPingEffect
} from './VitalIndicators';

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
  
  let upgradeDiscount = 0;
  if (player.konohaBuffs?.some(b => b.type === 'INTEREST_RATE_CUT')) {
    upgradeDiscount = Math.max(upgradeDiscount, 0.30);
  }
  if (player.konohaBuffs?.some(b => b.type === 'INFLATION_REDUCTION')) {
    upgradeDiscount = Math.max(upgradeDiscount, 0.20);
  }
  const adjustedUpgrade = currentTile.upgradeCost 
    ? Math.round(currentTile.upgradeCost * inflationFactor * (1 - upgradeDiscount)) 
    : 0;

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
    <div 
      className="bg-slate-900/95 border-2 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md transition-all"
      style={{
        borderColor: `${player.color}80`,
        boxShadow: `0 0 24px ${player.color}25, 0 10px 25px rgba(0,0,0,0.6)`
      }}
    >
      {/* Turn & Position Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800/90">
        <div className="flex items-center gap-2">
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-0.8 rounded-full text-[10px] font-black uppercase text-white shadow-md border"
            style={{ backgroundColor: player.color, borderColor: `${player.color}ee` }}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <span>GILIRAN AKTIF</span>
          </span>
          <span 
            className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full border shadow-sm text-white"
            style={{ backgroundColor: `${player.color}40`, borderColor: player.color }}
          >
            {player.id.startsWith('player_') ? `P${player.id.replace('player_', '')}` : 'P'}
          </span>
          <span className="text-xs font-bold text-slate-200">
            {player.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono bg-slate-950/70 border border-slate-800 px-2 py-0.5 rounded-lg">
          <span className="text-amber-300 font-bold">📍 Petak #{currentTile.id}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300 truncate max-w-[130px] font-medium">{currentTile.shortName || currentTile.name}</span>
        </div>
      </div>

      {/* Profile & Financial Status Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-xl border-2 shrink-0"
            style={{ 
              borderColor: player.color, 
              backgroundColor: `${player.color}25`,
              boxShadow: `0 0 16px ${player.color}35`
            }}
          >
            {player.avatar}
            <span 
              className="absolute -bottom-1 -right-1 text-[8px] font-black font-mono text-white px-1.5 py-0 rounded-full border border-slate-950 shadow-md leading-tight"
              style={{ backgroundColor: player.color }}
            >
              {player.id.startsWith('player_') ? `P${player.id.replace('player_', '')}` : 'P'}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base sm:text-lg text-white tracking-wide truncate">
                {player.name}
              </h3>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
                style={{ backgroundColor: `${player.color}30`, borderColor: `${player.color}60`, color: player.color }}
              >
                {player.title}
              </span>
              {player.kpkSuspicionLevel > 60 && !player.inJail && (
                <div 
                  className="relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/80 text-rose-300 text-[10px] font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)] shrink-0"
                  title={`RISIKO TINGGI OTT KPK! Radar Penyadapan: ${player.kpkSuspicionLevel}%`}
                >
                  <div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0">
                    <KPKRadarPingEffect suspicionLevel={player.kpkSuspicionLevel} size="sm" />
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 relative z-10" />
                  </div>
                  <span className="font-mono font-black text-rose-400">
                    KPK {player.kpkSuspicionLevel}%
                  </span>
                  <span className="text-[9px] font-mono text-rose-300 font-extrabold uppercase animate-pulse">
                    [OTT]
                  </span>
                </div>
              )}
              {player.isInCorruptionRoute && (
                <div 
                  className="relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-500/80 text-amber-300 text-[10px] font-bold shadow-[0_0_12px_rgba(245,158,11,0.5)] shrink-0"
                  title={`Sedang di Jalur Tikus (Rute Korupsi) - Radar KPK: ${player.kpkSuspicionLevel}%`}
                >
                  <div className="relative w-3.5 h-3.5 rounded-full border border-amber-500/70 overflow-hidden shrink-0 flex items-center justify-center bg-slate-950">
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'conic-gradient(from 0deg, rgba(245,158,11,0.85) 0deg, rgba(245,158,11,0.25) 45deg, transparent 65deg)',
                        animation: `radar-sweep ${Math.max(0.65, Number((5.5 - Math.pow(player.kpkSuspicionLevel / 100, 1.15) * 4.75).toFixed(2)))}s linear infinite`,
                        transformOrigin: 'center center'
                      }}
                    />
                    <div className="w-1 h-1 rounded-full bg-amber-400 relative z-10" />
                  </div>
                  <span className="font-mono font-black text-amber-300">
                    RUTE KORUPSI
                  </span>
                </div>
              )}
              {player.inJail && (
                <span className="text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  Di Lapas ({player.jailTurnsLeft}x)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cash Balance Display */}
        <div className="sm:text-right shrink-0 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-xl">
          <span className="text-[10px] text-slate-400 block font-medium">
            Kas Tunai
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-400 font-mono block">
            {formatRupiah(player.cash)}
          </span>
        </div>
      </div>

      {/* Full-Width Vital Indicators: Stres, Politik, KPK Radar */}
      <div className="w-full grid grid-cols-3 gap-2 text-xs border-b border-slate-800/80 pb-3 mb-3">
        <StressIndicator player={player} variant="hud" interactive={true} />
        <PoliticalInfluenceGauge player={player} variant="hud" interactive={true} />
        <KPKRadarGauge player={player} variant="hud" interactive={true} />
      </div>

      {/* Action Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Dice Roller */}
        <div className="flex items-center gap-2 flex-wrap">
          <DiceRoller 
            onRoll={onRoll}
            isRolling={isRolling}
            disabled={hasRolled || player.inJail || player.isAi}
            lastRoll={lastRoll}
          />

          {player.inJail && !player.isAi && (
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

          {/* Konoha Macro Buffs Badge if any */}
          {player.konohaBuffs && player.konohaBuffs.length > 0 && (
            <div 
              title={player.konohaBuffs.map(b => `${b.buffName}: ${b.playerPerkText}`).join(' | ')}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-help"
            >
              <span>🍃</span>
              <span className="hidden sm:inline">Buff Konoha:</span>
              <span className="font-mono bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black text-[10px]">
                {player.konohaBuffs.length}
              </span>
            </div>
          )}
        </div>

        {/* Property Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1 sm:pt-0">
          {canBuy && !player.isAi && (
            <button
              onClick={onBuyProperty}
              className="min-h-[44px] flex-1 sm:flex-initial py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Beli Aset ({formatRupiahShort(adjustedPrice)})</span>
            </button>
          )}

          {canUpgrade && !player.isAi && (
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
            disabled={(!hasRolled && !player.inJail) || player.isAi}
            className={`
              min-h-[44px] flex-1 sm:flex-initial py-2.5 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md
              ${(hasRolled || player.inJail) && !player.isAi
                ? 'bg-slate-100 hover:bg-white text-slate-900 cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
              }
            `}
          >
            <span>{player.isAi ? `Giliran ${player.name}...` : 'Akhiri Giliran'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
