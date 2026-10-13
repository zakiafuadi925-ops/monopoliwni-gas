import React, { useState } from 'react';
import { ActiveLaw, Player } from '../types/game';
import { Scale, AlertTriangle, ChevronDown, ChevronUp, Handshake, Landmark, ShieldAlert, Sparkles } from 'lucide-react';

interface DrasticLawBannerProps {
  activeLaws: ActiveLaw[];
  players: Player[];
}

export const DrasticLawBanner: React.FC<DrasticLawBannerProps> = ({
  activeLaws,
  players
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Filter for drastic coalition parliament acts
  const drasticLaws = activeLaws.filter(
    law => law.effect === 'PROGRESSIVE_TAX_DRASTIC' || law.effect === 'ASSET_CONFISCATION_ACT'
  );

  if (drasticLaws.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border-b-2 border-amber-500 shadow-xl text-slate-100 sticky top-[57px] sm:top-[65px] z-30 animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2.5">
          {/* Left: Indicator Badge & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/30 border border-red-500 text-red-200 text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>KEBIJAKAN DRASTIS AKTIF</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-amber-200 truncate">
              <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
              <span>DPR RI Senayan Memberlakukan Hukum Luar Biasa:</span>
            </div>
          </div>

          {/* Right: Toggle Button & Badges count */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-600/60 px-2 py-0.5 rounded-md">
              {drasticLaws.length} Kebijakan Berjalan
            </span>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-amber-500/30 text-amber-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
              title={isCollapsed ? 'Buka detail kebijakan drastis' : 'Sembunyikan detail'}
            >
              {isCollapsed ? (
                <>
                  <span className="text-[10px] hidden sm:inline">Detail</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span className="text-[10px] hidden sm:inline">Tutup</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Law Cards */}
        {!isCollapsed && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 pt-1 border-t border-amber-500/20">
            {drasticLaws.map((law) => {
              const initiator = players.find(p => p.id === law.passedByPlayerId);
              const partner = players.find(p => p.id === law.coalitionPartnerId);
              const isTax = law.effect === 'PROGRESSIVE_TAX_DRASTIC';

              return (
                <div
                  key={law.id}
                  className={`
                    rounded-xl p-2.5 sm:p-3 border transition-all flex flex-col justify-between gap-2 shadow-md
                    ${isTax 
                      ? 'bg-amber-950/60 border-amber-500/50 ring-1 ring-amber-500/20' 
                      : 'bg-rose-950/60 border-rose-500/50 ring-1 ring-rose-500/20'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-xl shrink-0 p-1 rounded-lg bg-slate-950/60 border border-amber-500/30">
                        {isTax ? '⚖️' : '🏛️'}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold text-amber-200 truncate flex items-center gap-1.5">
                          <span>{law.name}</span>
                        </h4>
                        <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-snug">
                          {isTax 
                            ? 'Pajak kekayaan 25% dipungut serentak dari seluruh rival non-koalisi, dibagi ke anggota koalisi & rival stres +20%!' 
                            : 'Mencabut 1 sertifikat tanah terbaik milik rival terkaya ke kas negara + denda Rp 25 Jt & korban stres +30%!'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 whitespace-nowrap">
                        ⏱️ Sisa {law.durationTurns} Putaran
                      </span>
                    </div>
                  </div>

                  {/* Coalition Partners Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Handshake className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-semibold text-amber-300">Koalisi Pengusung:</span>
                      <span className="font-bold text-white flex items-center gap-1">
                        <span>{initiator?.avatar || '👤'} {initiator?.name || 'Fraksi A'}</span>
                        {partner && (
                          <>
                            <span className="text-amber-400">&</span>
                            <span>{partner.avatar || '👤'} {partner.name}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-rose-300 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      <span>Rival Non-Koalisi Terancam</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
