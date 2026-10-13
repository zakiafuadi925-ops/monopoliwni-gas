import React, { useState, useMemo } from 'react';
import { Player } from '../types/game';
import { LAW_PROPOSALS, LawProposal } from '../data/laws';
import { Crown, Scale, Check, X, Users, Handshake, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { PoliticalInfluenceGauge, getPoliticalCloutInfo } from './VitalIndicators';

interface ParliamentModalProps {
  player: Player;
  players: Player[];
  onPassLaw: (proposal: LawProposal, coalitionPartner?: Player) => void;
  onClose: () => void;
}

export const ParliamentModal: React.FC<ParliamentModalProps> = ({
  player,
  players,
  onPassLaw,
  onClose
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'COALITION' | 'REGULAR'>('ALL');

  // Candidate allies (alive players other than the initiator)
  const candidatePartners = useMemo(() => {
    return players.filter(p => p.id !== player.id && !p.isBankrupt);
  }, [players, player.id]);

  const partnerPlayer = useMemo(() => {
    return candidatePartners.find(p => p.id === selectedPartnerId) || null;
  }, [candidatePartners, selectedPartnerId]);

  // Combined Political Influence
  const totalInfluence = player.politicalInfluence + (partnerPlayer ? partnerPlayer.politicalInfluence : 0);

  // Diplomatic dialogue response from partner
  const partnerDialogue = useMemo(() => {
    if (!partnerPlayer) return null;
    if (partnerPlayer.politicalInfluence >= 35) {
      return `Fraksi ${partnerPlayer.name}: "Kami menyambut baik koalisi ini! Mari kita ketuk palu dan tertibkan lawan-lawan kita di luar koalisi!"`;
    }
    return `Fraksi ${partnerPlayer.name}: "Modal politik kami terbatas (${partnerPlayer.politicalInfluence} Poin), tapi suara kami siap bergabung demi kepentingan bersama!"`;
  }, [partnerPlayer]);

  const filteredProposals = useMemo(() => {
    if (activeTab === 'COALITION') {
      return LAW_PROPOSALS.filter(p => p.isCoalitionOnly);
    }
    if (activeTab === 'REGULAR') {
      return LAW_PROPOSALS.filter(p => !p.isCoalitionOnly);
    }
    return LAW_PROPOSALS;
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-5 py-3.5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-slate-950" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wide">
                GEDUNG DPR RI SENAYAN: SIDANG PARIPURNA
              </h3>
              <span className="text-[11px] font-medium text-amber-950 block">
                Fraksi & Lobi Kebijakan Publik Konoha · Fitur Koalisi Politik
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-700/40 text-slate-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Initiator & Coalition Status Banner */}
        <div className="p-3.5 sm:p-4 bg-slate-950/90 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Ketua Fraksi Pengusul:</span>
              <div className="font-bold text-sm text-white flex items-center gap-1.5 mt-0.5">
                <span className="text-base">{player.avatar}</span>
                <span>{player.name} ({player.title})</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wide">
                Modal Sendiri: {player.politicalInfluence} Poin · {getPoliticalCloutInfo(player.politicalInfluence).tierTitle}
              </span>
            </div>

            {/* Total Combined Quorum Gauge */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between gap-3 sm:min-w-[210px]">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase">
                  {partnerPlayer ? '👑 KUORUM KOALISI GABUNGAN' : 'KUORUM PARLEMEN ANDA'}
                </span>
                <div className="text-base sm:text-lg font-black text-amber-300 font-mono flex items-center gap-1">
                  <span>{totalInfluence}</span>
                  <span className="text-xs text-slate-400 font-normal">Poin Pengaruh</span>
                </div>
              </div>
              {partnerPlayer ? (
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Handshake className="w-5 h-5 animate-pulse" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                  <Scale className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>

          {/* Political Coalition Ally Selector */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Handshake className="w-4 h-4 text-amber-400" />
                Bentuk Koalisi Politik Parlemen:
              </span>
              {partnerPlayer && (
                <button
                  onClick={() => setSelectedPartnerId(null)}
                  className="text-[10px] text-rose-400 hover:text-rose-300 underline font-mono cursor-pointer"
                >
                  Batalkan Koalisi (Solo)
                </button>
              )}
            </div>

            {candidatePartners.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                Tidak ada anggota dewan lain yang masih aktif untuk diajak berkoalisi.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {candidatePartners.map(candidate => {
                  const isSelected = selectedPartnerId === candidate.id;
                  const combined = player.politicalInfluence + candidate.politicalInfluence;

                  return (
                    <button
                      key={candidate.id}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedPartnerId(isSelected ? null : candidate.id);
                      }}
                      className={`
                        p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer
                        ${isSelected
                          ? 'border-amber-400 bg-amber-950/40 shadow-md ring-1 ring-amber-400'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{candidate.avatar}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                            <span>{candidate.name}</span>
                            {candidate.isAi && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                AI
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Modal: {candidate.politicalInfluence} Poin
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[11px] font-mono font-bold block ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                          {isSelected ? '✓ BERKOALISI' : `+${candidate.politicalInfluence}`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          Total: {combined}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Partner Statement */}
            {partnerDialogue && (
              <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-600/30 text-[11px] text-amber-200/90 italic flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{partnerDialogue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-4 pt-3 flex gap-2 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'ALL'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua RUU ({LAW_PROPOSALS.length})
          </button>
          <button
            onClick={() => setActiveTab('COALITION')}
            className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COALITION'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Handshake className="w-3.5 h-3.5 text-amber-400" />
            <span>RUU Koalisi Khusus</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
              2
            </span>
          </button>
          <button
            onClick={() => setActiveTab('REGULAR')}
            className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'REGULAR'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            RUU Reguler (5)
          </button>
        </div>

        {/* Proposals List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {filteredProposals.map(proposal => {
            const isCoalitionAct = !!proposal.isCoalitionOnly;
            const meetsQuorum = totalInfluence >= proposal.requiredInfluence;
            const canPass = isCoalitionAct 
              ? (partnerPlayer !== null && meetsQuorum)
              : meetsQuorum;

            return (
              <div
                key={proposal.id}
                className={`
                  p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3
                  ${isCoalitionAct
                    ? canPass
                      ? 'border-amber-400 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 ring-1 ring-amber-400 shadow-lg'
                      : 'border-amber-900/50 bg-slate-950/60 opacity-80'
                    : canPass
                      ? 'border-amber-500/50 bg-slate-900 hover:border-amber-400'
                      : 'border-slate-800 bg-slate-950/40 opacity-70'
                  }
                `}
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl">{proposal.icon}</span>
                    <h4 className="font-bold text-xs sm:text-sm text-white">
                      {proposal.title}
                    </h4>
                    {isCoalitionAct && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Handshake className="w-3 h-3" />
                        RUU KOALISI 2 FRAKSI
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {proposal.description}
                  </p>

                  <p className="text-[11px] text-amber-400/80 italic font-mono">
                    {proposal.fluff}
                  </p>
                </div>

                <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-300 block">
                      Kuorum: {proposal.requiredInfluence} Poin
                    </span>
                    <span className={`text-[10px] font-mono block ${meetsQuorum ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Tersedia: {totalInfluence} Poin {meetsQuorum ? '✓ Cukup' : `(-${proposal.requiredInfluence - totalInfluence})`}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (canPass) {
                        soundManager.playCash();
                        onPassLaw(proposal, partnerPlayer || undefined);
                      }
                    }}
                    disabled={!canPass}
                    className={`
                      min-h-[38px] py-2 px-3.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md
                      ${canPass
                        ? isCoalitionAct
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 cursor-pointer shadow-amber-950/60 active:scale-95'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer active:scale-95'
                        : isCoalitionAct && !partnerPlayer
                          ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }
                    `}
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isCoalitionAct && !partnerPlayer 
                        ? 'Pilih Mitra Koalisi' 
                        : isCoalitionAct
                          ? 'Sahkan UU Koalisi'
                          : 'Sahkan RUU'
                      }
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="hidden sm:inline">
            Sidang Paripurna DPR RI Konoha · Keputusan RUU bersifat mengikat dan langsung berlaku.
          </span>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer ml-auto"
          >
            Tutup Sidang Paripurna
          </button>
        </div>
      </div>
    </div>
  );
};

