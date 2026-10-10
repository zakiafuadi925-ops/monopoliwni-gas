import React from 'react';
import { BreakingNewsEvent } from '../types/game';
import { Radio, AlertOctagon, X, ArrowRight } from 'lucide-react';

interface BreakingNewsBannerProps {
  currentNews: BreakingNewsEvent | null;
  onDismiss: () => void;
}

export const BreakingNewsBanner: React.FC<BreakingNewsBannerProps> = ({
  currentNews,
  onDismiss
}) => {
  if (!currentNews) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Urgent TV News Header */}
        <div className="bg-rose-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 animate-pulse text-yellow-300" />
            <span className="font-extrabold tracking-wider text-sm uppercase">
              WARTA KILAT NASIONAL
            </span>
          </div>
          <span className="text-[11px] font-mono bg-rose-900/70 px-2 py-0.5 rounded text-rose-200">
            SIARAN LANGSUNG
          </span>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl shrink-0">
              <AlertOctagon className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-rose-200 leading-snug">
                {currentNews.headline}
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {currentNews.detail}
              </p>
            </div>
          </div>

          {/* Impact Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold block mb-1">
              Dampak Bagi Seluruh Pemain:
            </span>
            <p className="text-xs font-medium text-slate-200">
              {currentNews.impactSummary}
            </p>
          </div>

          {/* Action button */}
          <button
            onClick={onDismiss}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2"
          >
            <span>Lanjutkan Permainan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
