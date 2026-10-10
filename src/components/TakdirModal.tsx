import React from 'react';
import { Player } from '../types/game';
import { formatRupiah } from '../utils/format';
import { Sparkles, Coins, Gift, TrendingUp, HeartHandshake } from 'lucide-react';

export interface TakdirOutcome {
  id: string;
  title: string;
  headline: string;
  description: string;
  cashBonus: number;
  stressReduction: number;
  politicalBonus: number;
}

interface TakdirModalProps {
  player: Player;
  outcome: TakdirOutcome;
  onConfirm: () => void;
}

export const TakdirModal: React.FC<TakdirModalProps> = ({
  player,
  outcome,
  onConfirm
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-100 space-y-4">
        {/* Header Alert */}
        <div className="flex items-center gap-3 border-b border-amber-950/80 pb-3">
          <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-500/80 text-amber-400 shrink-0 animate-bounce">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" />
              HAL TAK TERDUGA · EVENT TAKDIR NUSANTARA
            </span>
            <h3 className="text-base sm:text-xl font-black text-white leading-tight">
              {outcome.headline}
            </h3>
          </div>
        </div>

        {/* Narrative Context */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <h4 className="text-xs sm:text-sm font-extrabold text-amber-300">
            {outcome.title}
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {outcome.description}
          </p>
        </div>

        {/* Rewards Box */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-emerald-950/30 to-amber-950/40 border border-amber-500/50 space-y-2.5">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            KEBERUNTUNGAN TAKDIR UNTUK {player.name.toUpperCase()}:
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {outcome.cashBonus > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-900/60 flex items-center justify-between">
                <span className="text-slate-400">Kas Tambahan:</span>
                <span className="font-mono font-black text-emerald-400">
                  +{formatRupiah(outcome.cashBonus)}
                </span>
              </div>
            )}

            {outcome.stressReduction > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-sky-900/60 flex items-center justify-between">
                <span className="text-slate-400">Kewarasan/Stres:</span>
                <span className="font-mono font-black text-sky-400">
                  -{outcome.stressReduction}%
                </span>
              </div>
            )}

            {outcome.politicalBonus > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-purple-900/60 flex items-center justify-between col-span-2">
                <span className="text-slate-400">Pengaruh Politik:</span>
                <span className="font-mono font-black text-purple-400">
                  +{outcome.politicalBonus} Poin
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onConfirm}
          className="w-full min-h-[46px] py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 text-xs sm:text-sm font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Syukuri & Ambil Berkah Takdir</span>
        </button>
      </div>
    </div>
  );
};
