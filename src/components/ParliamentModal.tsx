import React from 'react';
import { Player } from '../types/game';
import { LAW_PROPOSALS, LawProposal } from '../data/laws';
import { Crown, Scale, Check, X, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface ParliamentModalProps {
  player: Player;
  onPassLaw: (proposal: LawProposal) => void;
  onClose: () => void;
}

export const ParliamentModal: React.FC<ParliamentModalProps> = ({
  player,
  onPassLaw,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-xl w-full bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-amber-600 text-slate-950 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-slate-950" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wide">
                GEDUNG DPR RI SENAYAN: SIDANG PARIPURNA
              </h3>
              <span className="text-[11px] font-medium text-amber-950 block">
                Fraksi & Lobi Kebijakan Publik Konoha
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-700/50 text-slate-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Political Power Banner */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Anggota Dewan Pengusul:</span>
            <div className="font-bold text-sm text-white flex items-center gap-1.5 mt-0.5">
              <span>{player.avatar}</span>
              <span>{player.name} ({player.title})</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Modal Politik Tersedia:</span>
            <div className="text-lg font-mono font-extrabold text-amber-400">
              {player.politicalInfluence} / 100
            </div>
          </div>
        </div>

        {/* Proposals List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          <p className="text-xs text-slate-300">
            Gunakan Modal Politik untuk mengesahkan RUU yang menguntungkan dinasti atau bisnis Anda! Setiap RUU membutuhkan kuorum modal politik:
          </p>

          <div className="space-y-2.5">
            {LAW_PROPOSALS.map(proposal => {
              const canAfford = player.politicalInfluence >= proposal.requiredInfluence;

              return (
                <div
                  key={proposal.id}
                  className={`
                    p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3
                    ${canAfford
                      ? 'border-amber-500/50 bg-amber-950/20 hover:border-amber-400'
                      : 'border-slate-800 bg-slate-950/40 opacity-70'
                    }
                  `}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{proposal.icon}</span>
                      <h4 className="font-bold text-xs sm:text-sm text-white">
                        {proposal.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">
                      {proposal.description}
                    </p>
                    <p className="text-[11px] text-amber-400/80 italic font-mono">
                      {proposal.fluff}
                    </p>
                  </div>

                  <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                    <span className="text-[11px] font-mono font-bold text-amber-300">
                      Butuh {proposal.requiredInfluence} Poin
                    </span>

                    <button
                      onClick={() => {
                        if (canAfford) {
                          soundManager.playCash();
                          onPassLaw(proposal);
                        }
                      }}
                      disabled={!canAfford}
                      className={`
                        py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
                        ${canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-md'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }
                      `}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Sahkan RUU</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Tutup Sidang Paripurna
          </button>
        </div>
      </div>
    </div>
  );
};
