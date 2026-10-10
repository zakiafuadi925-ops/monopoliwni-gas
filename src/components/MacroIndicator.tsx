import React, { useState } from 'react';
import { MacroEconomy, ActiveLaw } from '../types/game';
import { formatPercent, formatRupiahShort } from '../utils/format';
import { TrendingUp, AlertTriangle, ShieldCheck, Scale, Landmark, ChevronDown, ChevronUp } from 'lucide-react';

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

  const getTrendBadge = () => {
    switch (macro.trend) {
      case 'CRISIS':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3 animate-pulse text-rose-400" />
            <span>Krisis</span>
          </span>
        );
      case 'VOLATILE':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            <span>Gejolak</span>
          </span>
        );
      case 'RISING':
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-yellow-300 bg-yellow-950/50 border border-yellow-800/50 px-2 py-0.5 rounded">
            <span>Inflasi Naik</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded">
            <span>Stabil</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-lg backdrop-blur-md">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-100 tracking-wide truncate">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 mt-2 border-t border-slate-800/80 text-xs">
          {/* Inflasi */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] sm:text-[11px]">Tingkat Inflasi YoY</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-sm sm:text-base font-bold font-mono ${
                macro.inflationRate > 8 ? 'text-rose-400' : macro.inflationRate > 5 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {formatPercent(macro.inflationRate)}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500">
                {macro.inflationRate > 6 ? '↑ Beban Naik' : 'Normal'}
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
    </div>
  );
};
