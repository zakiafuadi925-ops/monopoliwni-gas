import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MacroEconomy, ActiveLaw } from '../types/game';
import { formatPercent, formatRupiahShort } from '../utils/format';
import { TrendingUp, AlertTriangle, ShieldCheck, Scale, Landmark, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';

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
              className="hidden md:flex items-center gap-1 text-[10px] font-mono font-bold text-rose-300 bg-rose-950/80 border border-rose-600/80 px-2 py-0.5 rounded-full animate-pulse shadow-sm"
              title="Ambien Audio: Sirene Polisi OTT Konstan"
            >
              <Volume2 className="w-2.5 h-2.5 text-rose-400" />
              <span>Sirene OTT</span>
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
    </motion.div>
  );
};
