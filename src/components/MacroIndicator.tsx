import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MacroEconomy, ActiveLaw } from '../types/game';
import { formatPercent, formatRupiahShort } from '../utils/format';
import { TrendingUp, AlertTriangle, ShieldCheck, Scale, Landmark, ChevronDown, ChevronUp, Volume2, Sparkles, X, Crown } from 'lucide-react';

interface MacroIndicatorProps {
  macro: MacroEconomy;
  activeLaws: ActiveLaw[];
  cycleRound: number;
  aliveCount: number;
  totalPlayers: number;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MacroIndicator: React.FC<MacroIndicatorProps> = ({
  macro,
  activeLaws,
  cycleRound,
  aliveCount,
  totalPlayers,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showBuffsModal, setShowBuffsModal] = useState<boolean>(false);
  const currentMonthName = MONTH_NAMES[(macro.monthIndex - 1) % 12];
  const isCrisis = macro.trend === 'CRISIS';

  const getTrendBadge = () => {
    switch (macro.trend) {
      case 'CRISIS':
        return (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-200 bg-rose-950/90 border-2 border-rose-500/90 px-2.5 py-0.5 rounded shadow-[0_0_12px_rgba(244,63,94,0.65)] animate-crisis-shake">
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce text-rose-400" />
              <span className="animate-glitch-text tracking-wider uppercase font-black">Krisis</span>
            </span>
            <span 
              className="hidden md:flex items-center gap-1 text-[10px] font-mono font-bold text-rose-300 bg-rose-950/80 border border-rose-600/80 px-2 py-0.5 rounded-full shadow-sm"
              title="Ambien Audio: Tensi Krisis Moneter & Denyut Darurat (Sirene bising telah dimatikan)"
            >
              <Volume2 className="w-2.5 h-2.5 text-rose-400" />
              <span>Tensi Krisis</span>
            </span>
          </div>
        );
      case 'VOLATILE':
        return (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>Gejolak</span>
            </span>
            <span 
              className="hidden md:flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full"
              title="Ambien Audio: Ticker Bursa Panik"
            >
              <Volume2 className="w-2.5 h-2.5 text-amber-400" />
              <span>Ticker Bursa</span>
            </span>
          </div>
        );
      case 'RISING':
        return (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-yellow-300 bg-yellow-950/50 border border-yellow-800/50 px-2 py-0.5 rounded">
              <span>Inflasi Naik</span>
            </span>
            <span 
              className="hidden md:flex items-center gap-1 text-[10px] font-mono text-yellow-300 bg-yellow-950/60 border border-yellow-800/60 px-2 py-0.5 rounded-full"
              title="Ambien Audio: Lalu Lintas Padat & Klakson"
            >
              <Volume2 className="w-2.5 h-2.5 text-yellow-400" />
              <span>Lalu Lintas Padat</span>
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded">
              <span>Stabil</span>
            </span>
            <span 
              className="hidden md:flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full"
              title="Ambien Audio: Kerumunan Kota Ramai"
            >
              <Volume2 className="w-2.5 h-2.5 text-emerald-400" />
              <span>Kerumunan Kota</span>
            </span>
          </div>
        );
    }
  };

  return (
    <motion.div
      animate={isCrisis ? {
        x: [0, -1.8, 1.8, -1.2, 1.2, -0.6, 0.6, 0],
        y: [0, 0.8, -0.8, 0.4, -0.4, 0],
      } : { x: 0, y: 0 }}
      transition={isCrisis ? {
        duration: 0.4,
        repeat: Infinity,
        repeatType: 'mirror',
        ease: 'easeInOut',
      } : { duration: 0.2 }}
      className={`relative overflow-hidden rounded-xl p-2.5 sm:p-3 shadow-lg backdrop-blur-md transition-colors border ${
        isCrisis
          ? 'bg-rose-950/40 border-rose-500/90 animate-crisis-glow shadow-[0_0_25px_rgba(225,29,72,0.4)]'
          : 'bg-slate-900/90 border-slate-800'
      }`}
    >
      {/* Scanline overlay effect in Crisis mode */}
      {isCrisis && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25 z-0">
          <div className="w-full h-10 bg-gradient-to-b from-transparent via-rose-500/30 to-transparent animate-scanline" />
        </div>
      )}

      {/* Emergency Crisis Alert Banner */}
      {isCrisis && (
        <div className="relative z-10 mb-2 px-2.5 py-1 rounded bg-rose-950/90 border border-rose-600/80 flex items-center justify-between text-[10px] sm:text-[11px] text-rose-200">
          <div className="flex items-center gap-1.5 font-bold tracking-wider animate-glitch-text text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
            <span>PERINGATAN: STATUS KRISIS MONETER BERLANGSUNG!</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-rose-300 font-mono hidden xs:inline uppercase">
            Beban Inflasi Ekstrem
          </span>
        </div>
      )}

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Landmark className={`w-4 h-4 shrink-0 ${isCrisis ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
          <span className={`text-xs sm:text-sm font-bold tracking-wide truncate ${isCrisis ? 'text-rose-200 animate-glitch-text' : 'text-slate-100'}`}>
            Makroekonomi & Fiskal
          </span>
          <span className="text-[11px] text-slate-300 font-mono">
            Bulan {macro.monthIndex} ({currentMonthName}) · Mgg {macro.weekIndex}/4
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] text-slate-400 hidden xs:block">
            Putaran: <span className="font-semibold text-amber-300 font-mono">#{cycleRound}</span>
          </div>

          <div className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{aliveCount}/{totalPlayers} Hidup</span>
          </div>

          {getTrendBadge()}

          {/* Mobile Collapse Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center sm:hidden"
            title={isExpanded ? 'Sembunyikan Rincian' : 'Tampilkan Rincian'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Grid of indicators */}
      {isExpanded && (
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 mt-2 border-t border-slate-800/80 text-xs">
          {/* Inflasi */}
          <div className={`rounded-lg p-2 flex flex-col justify-between transition-all ${
            isCrisis
              ? 'bg-rose-950/70 border-2 border-rose-500/80 shadow-[0_0_12px_rgba(225,29,72,0.4)] animate-crisis-shake'
              : 'bg-slate-950/60 border border-slate-800'
          }`}>
            <span className={`text-[10px] sm:text-[11px] flex items-center justify-between ${isCrisis ? 'text-rose-300 font-bold' : 'text-slate-400'}`}>
              <span>Tingkat Inflasi YoY</span>
              {isCrisis && <span className="animate-ping w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-sm sm:text-base font-bold font-mono ${
                isCrisis
                  ? 'text-rose-200 animate-glitch-text text-base sm:text-lg'
                  : macro.inflationRate > 8 ? 'text-rose-400' : macro.inflationRate > 5 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {formatPercent(macro.inflationRate)}
              </span>
              <span className={`text-[9px] sm:text-[10px] ${isCrisis ? 'text-rose-300 font-bold' : 'text-slate-500'}`}>
                {isCrisis ? '🚨 Bahaya' : macro.inflationRate > 6 ? '↑ Beban Naik' : 'Normal'}
              </span>
            </div>
          </div>

          {/* BI Rate */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] sm:text-[11px]">BI 7-Day Repo Rate</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-bold font-mono text-cyan-400">
                {formatPercent(macro.biRate)}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500">Acuan Bunga</span>
            </div>
          </div>

          {/* Kurs USD */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] sm:text-[11px]">Kurs USD / IDR</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">
                {formatRupiahShort(macro.usdIdrRate)}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500">/ USD</span>
            </div>
          </div>

          {/* Regulasi Aktif */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] sm:text-[11px] flex items-center gap-1">
              <Scale className="w-3 h-3 text-amber-400" />
              UU Paripurna Aktif
            </span>
            <div className="text-[10px] sm:text-[11px] font-semibold text-amber-300 truncate mt-0.5">
              {activeLaws.length > 0 ? (
                <span title={activeLaws.map(l => l.name).join(', ')}>
                  {activeLaws.length} RUU Aktif
                </span>
              ) : (
                <span className="text-slate-500 font-normal">Belum ada UU</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Konoha Active Macro Buffs Strip */}
      {macro.activeKonohaBuffs && macro.activeKonohaBuffs.length > 0 && isExpanded && (
        <div className="relative z-10 mt-2.5 pt-2 border-t border-emerald-900/60 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🍃</span>
            <span className="text-[10px] sm:text-[11px] font-black text-emerald-400 uppercase tracking-wider">
              Takdir Konoha Aktif ({macro.activeKonohaBuffs.length} Kebijakan):
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {macro.activeKonohaBuffs.map((buff) => (
              <button
                key={buff.id}
                onClick={() => setShowBuffsModal(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-600/80 text-emerald-200 transition-colors shadow-sm cursor-pointer"
                title="Klik untuk melihat rincian kebijakan"
              >
                <span>{buff.cardIcon}</span>
                <span>{buff.buffName}</span>
                <span className="text-emerald-400 font-black">
                  ({buff.inflationDelta !== 0 ? `Inf ${buff.inflationDelta > 0 ? `+${buff.inflationDelta}%` : `${buff.inflationDelta}%`}` : `BI ${buff.biRateDelta > 0 ? `+${buff.biRateDelta}%` : `${buff.biRateDelta}%`}`})
                </span>
              </button>
            ))}

            <button
              onClick={() => setShowBuffsModal(true)}
              className="text-[10px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer ml-1"
            >
              Rincian Kebijakan →
            </button>
          </div>
        </div>
      )}

      {/* Modal Rincian Kebijakan Takdir Konoha */}
      {showBuffsModal && macro.activeKonohaBuffs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-2xl p-4 sm:p-5 text-slate-100 space-y-3.5 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-emerald-900/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍃</span>
                <div>
                  <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider block">
                    KABINET MAKROEKONOMI
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Kebijakan Takdir Konoha Aktif
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowBuffsModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {macro.activeKonohaBuffs.map((buff, i) => (
                <div
                  key={buff.id || i}
                  className="p-3 rounded-xl bg-slate-950 border border-emerald-800/70 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{buff.cardIcon}</span>
                      <div>
                        <strong className="text-white text-xs block">{buff.buffName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ditarik oleh: <span className="font-bold text-amber-300">{buff.drawnByPlayerName}</span> · {buff.timestamp}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 shrink-0">
                      PERMANEN
                    </span>
                  </div>

                  {/* Impact Badges */}
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className={`px-2 py-0.5 rounded ${buff.inflationDelta < 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'} border border-slate-800`}>
                      Inflasi: {buff.inflationDelta > 0 ? `+${buff.inflationDelta}%` : `${buff.inflationDelta}%`}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${buff.biRateDelta < 0 ? 'bg-cyan-950 text-cyan-300' : 'bg-amber-950 text-amber-300'} border border-slate-800`}>
                      BI-Rate: {buff.biRateDelta > 0 ? `+${buff.biRateDelta}%` : `${buff.biRateDelta}%`}
                    </span>
                    {buff.usdIdrDelta && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-slate-800">
                        USD -Rp {Math.abs(buff.usdIdrDelta)}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    🏛️ {buff.buffEffectDesc}
                  </p>

                  <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-950/30 p-1.5 rounded border border-amber-900/40">
                    <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Perk Pemain: {buff.playerPerkText}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowBuffsModal(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
