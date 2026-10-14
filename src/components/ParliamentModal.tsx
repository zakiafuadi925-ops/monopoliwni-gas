import React, { useState, useMemo, useEffect } from 'react';
import { Player, SpecialCardItem } from '../types/game';
import { LAW_PROPOSALS, LawProposal } from '../data/laws';
import { 
  Crown, 
  Scale, 
  Check, 
  X, 
  Users, 
  Handshake, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Flame, 
  ShieldAlert, 
  Dices, 
  ArrowLeft,
  Sparkles,
  Gavel
} from 'lucide-react';
import { soundManager } from '../utils/sound';
import { PoliticalInfluenceGauge, getPoliticalCloutInfo } from './VitalIndicators';

export interface ParliamentModalProps {
  player: Player;
  players: Player[];
  onPassLaw: (proposal: LawProposal, coalitionPartner?: Player) => void;
  onVetoLaw?: (proposal: LawProposal, vetoingPlayer: Player, usedSpecialCardId?: string) => void;
  onClose: () => void;
}

export const ParliamentModal: React.FC<ParliamentModalProps> = ({
  player,
  players,
  onPassLaw,
  onVetoLaw,
  onClose
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'COALITION' | 'REGULAR'>('ALL');

  // Debate State
  const [activeDebateProposal, setActiveDebateProposal] = useState<LawProposal | null>(null);
  const [debateStage, setDebateStage] = useState<'SELECTING' | 'DEBATE_ACTIVE' | 'VETOED' | 'PASSED'>('SELECTING');
  const [debateMessage, setDebateMessage] = useState<string | null>(null);
  const [isRollingDebate, setIsRollingDebate] = useState<boolean>(false);
  const [debateDice, setDebateDice] = useState<number | null>(null);

  // Candidate allies (alive players other than the initiator)
  const candidatePartners = useMemo(() => {
    return players.filter(p => p.id !== player.id && !p.isBankrupt);
  }, [players, player.id]);

  const partnerPlayer = useMemo(() => {
    return candidatePartners.find(p => p.id === selectedPartnerId) || null;
  }, [candidatePartners, selectedPartnerId]);

  // Combined Political Influence
  const totalInfluence = player.politicalInfluence + (partnerPlayer ? partnerPlayer.politicalInfluence : 0);

  // Rival factions (not initiator and not partner)
  const rivalFactions = useMemo(() => {
    return players.filter(p => p.id !== player.id && p.id !== partnerPlayer?.id && !p.isBankrupt);
  }, [players, player.id, partnerPlayer]);

  // Human player in the game (if any)
  const humanPlayer = useMemo(() => {
    return players.find(p => !p.isAi) || null;
  }, [players]);

  const isHumanInitiator = !player.isAi;
  const isHumanRival = humanPlayer && humanPlayer.id !== player.id && humanPlayer.id !== partnerPlayer?.id;

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

  // Start Parliamentary Debate for a proposed Law
  const handleInitiateDebate = (proposal: LawProposal) => {
    soundManager.playGavel();
    setActiveDebateProposal(proposal);
    setDebateStage('DEBATE_ACTIVE');
    setDebateMessage(null);
    setDebateDice(null);

    // If initiator is human, check if an AI rival will challenge
    if (isHumanInitiator) {
      // Find eligible AI rivals with special cards or high clout
      const challengingAi = rivalFactions.find(
        r => r.isAi && ((r.specialCards && r.specialCards.length > 0) || r.politicalInfluence >= 45)
      );

      if (challengingAi && Math.random() < 0.45) {
        setTimeout(() => {
          soundManager.playBuzzer();
          const usedCard = challengingAi.specialCards && challengingAi.specialCards.length > 0
            ? challengingAi.specialCards[0]
            : undefined;

          setDebateMessage(
            `🗣️ INTERUPSI AI! Fraksi ${challengingAi.name} berdiri dan mengajukan hak veto${
              usedCard ? ` menggunakan Kartu Sakti "${usedCard.title}"` : ' dengan modal politik fraksi'
            }! RUU dibatalkan!`
          );
          setDebateStage('VETOED');

          setTimeout(() => {
            if (onVetoLaw) {
              onVetoLaw(proposal, challengingAi, usedCard?.id);
            }
          }, 2400);
        }, 1200);
      }
    }
  };

  // Veto Law using Special Card
  const handleVetoWithCard = (vetoingPlayer: Player, card: SpecialCardItem) => {
    if (!activeDebateProposal) return;
    soundManager.playGavel();
    soundManager.playBuzzer();
    setDebateStage('VETOED');
    setDebateMessage(
      `🛡️ INTERUPSI DITERIMA! Fraksi ${vetoingPlayer.name} mengaktifkan Kartu Sakti "${card.title}" untuk MEMBATALKAN pengesahan RUU "${activeDebateProposal.title}"!`
    );

    setTimeout(() => {
      if (onVetoLaw) {
        onVetoLaw(activeDebateProposal, vetoingPlayer, card.id);
      }
    }, 2200);
  };

  // Veto Law through Parliamentary Debate Argument (Dice Roll)
  const handleDebateArgumentRoll = (vetoingPlayer: Player) => {
    if (!activeDebateProposal || isRollingDebate) return;
    setIsRollingDebate(true);
    soundManager.playDiceRoll();

    let rollCount = 0;
    const interval = setInterval(() => {
      rollCount++;
      const tempRoll = Math.floor(Math.random() * 6) + 1;
      setDebateDice(tempRoll);

      if (rollCount > 8) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDebateDice(finalRoll);
        setIsRollingDebate(false);

        // Success if roll >= 3
        if (finalRoll >= 3) {
          soundManager.playGavel();
          soundManager.playBuzzer();
          setDebateStage('VETOED');
          setDebateMessage(
            `⚖️ ARGUMEN DEBAT MENANG (Dadu: ${finalRoll})! Fraksi ${vetoingPlayer.name} berhasil mematahkan kuorum dan membatalkan RUU "${activeDebateProposal.title}"!`
          );

          setTimeout(() => {
            if (onVetoLaw) {
              onVetoLaw(activeDebateProposal, vetoingPlayer);
            }
          }, 2200);
        } else {
          soundManager.playBuzzer();
          setDebateMessage(
            `❌ INTERUPSI GAGAL (Dadu: ${finalRoll} < 3)! Pimpinan sidang menolak interupsi karena argumen kurang kuat. Sidang paripurna berlanjut!`
          );
        }
      }
    }, 80);
  };

  // Confirm Final Enactment of Law
  const handleConfirmPassLaw = () => {
    if (!activeDebateProposal) return;
    soundManager.playGavel();
    setDebateStage('PASSED');
    setDebateMessage(`🔨 KETUK PALU 3X! RUU "${activeDebateProposal.title}" RESMI DIUNDANGKAN!`);

    setTimeout(() => {
      onPassLaw(activeDebateProposal, partnerPlayer || undefined);
    }, 1200);
  };

  // Back to Proposal List from Debate
  const handleBackToProposals = () => {
    setActiveDebateProposal(null);
    setDebateStage('SELECTING');
    setDebateMessage(null);
    setDebateDice(null);
  };

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
                Fraksi & Lobi Kebijakan Publik Konoha · Debat Parlemen & Koalisi
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-700/40 text-slate-950 transition-colors cursor-pointer"
            title="Tutup Sidang"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ---------------- DEBATE PARLIAMENT STAGE ---------------- */}
        {debateStage !== 'SELECTING' && activeDebateProposal ? (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            {/* Debate Podium Banner */}
            <div className="bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 border border-amber-500/50 rounded-2xl p-4 sm:p-5 text-center space-y-3 relative overflow-hidden shadow-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>FORUM DEBAT & UJI INTERUPSI RUU</span>
              </div>

              <div>
                <span className="text-3xl block mb-1">{activeDebateProposal.icon}</span>
                <h4 className="text-lg sm:text-xl font-black text-white">
                  {activeDebateProposal.title}
                </h4>
                <p className="text-xs text-slate-300 max-w-lg mx-auto mt-1 leading-relaxed">
                  {activeDebateProposal.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-medium">
                  <span className="text-slate-400">Pengusul: </span>
                  <strong className="text-amber-300">{player.name}</strong>
                  {partnerPlayer && (
                    <span className="text-emerald-400"> & {partnerPlayer.name} (Koalisi)</span>
                  )}
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-mono font-bold text-amber-400">
                  Kuorum Diperlukan: {activeDebateProposal.requiredInfluence} Poin
                </div>
              </div>

              {debateMessage && (
                <div className={`p-3 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                  debateStage === 'VETOED'
                    ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                    : debateStage === 'PASSED'
                      ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                      : 'bg-amber-950/80 border-amber-600 text-amber-200'
                }`}>
                  {debateMessage}
                </div>
              )}
            </div>

            {/* Opposition Factions & Veto Interupsi Controls */}
            {debateStage === 'DEBATE_ACTIVE' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    Hak Interupsi Fraksi Oposisi & Kartu Sakti:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {rivalFactions.length} Fraksi Oposisi
                  </span>
                </div>

                {/* If Human Player is a Rival Faction */}
                {isHumanRival && humanPlayer && (
                  <div className="p-4 rounded-xl border-2 border-rose-500/60 bg-gradient-to-r from-rose-950/30 via-slate-900 to-rose-950/20 space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs sm:text-sm">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Anda adalah Fraksi Oposisi ({humanPlayer.name})!</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      RUU ini akan langsung merugikan Anda atau memberi kekuasaan mutlak pada pengusul. Anda dapat menggunakan Kartu Sakti Ordal untuk membatalkan RUU 100%, atau mengadu argumen interupsi lewat lemparan dadu kuorum!
                    </p>

                    {/* Special Cards Veto Options */}
                    {(humanPlayer.specialCards || []).length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide block">
                          Gunakan Kartu Sakti untuk Membatalkan RUU (Veto Mutlak 100%):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {humanPlayer.specialCards!.map(card => (
                            <button
                              key={card.id}
                              onClick={() => handleVetoWithCard(humanPlayer, card)}
                              className="p-2.5 rounded-xl border border-amber-500/60 bg-amber-950/50 hover:bg-amber-900/60 text-amber-100 text-left transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                            >
                              <span className="text-xl">{card.icon || '🛡️'}</span>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-white block truncate">
                                  {card.title}
                                </span>
                                <span className="text-[10px] text-amber-300 block truncate">
                                  Batalkan RUU ini seketika!
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Anda tidak memiliki Kartu Sakti. Gunakan opsi adu argumen fraksi di bawah:
                      </p>
                    )}

                    {/* Dice Argument Veto Button */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleDebateArgumentRoll(humanPlayer)}
                        disabled={isRollingDebate}
                        className={`
                          py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md
                          ${isRollingDebate
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-95 shadow-rose-950/60'
                          }
                        `}
                      >
                        <Dices className={`w-4 h-4 ${isRollingDebate ? 'animate-spin' : ''}`} />
                        <span>Adu Argumen Interupsi (Dadu 3-6 Sukses)</span>
                      </button>

                      <button
                        onClick={handleConfirmPassLaw}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Biarkan RUU Disahkan (Setuju)</span>
                      </button>
                    </div>

                    {debateDice && (
                      <div className="text-center pt-1">
                        <span className="text-xs font-mono text-slate-300">
                          Hasil Dadu Argumen: <strong className="text-white text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{debateDice}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* If Human Player is the Initiator */}
                {isHumanInitiator && (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                    <p className="text-xs text-slate-300">
                      RUU telah dibacakan di podium. Tidak ada interupsi yang membatalkan pengesahan ini. Anda dapat mengetuk palu untuk memberlakukan undang-undang secara mengikat ke seluruh pemain!
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <button
                        onClick={handleConfirmPassLaw}
                        className="w-full sm:w-auto flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Check className="w-5 h-5" />
                        <span>KETUK PALU RESMI: SAHKAN UNDANG-UNDANG INI!</span>
                      </button>

                      <button
                        onClick={handleBackToProposals}
                        className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Pilih RUU Lain</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ---------------- NORMAL PROPOSALS & COALITION SELECTION ---------------- */
          <>
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
                            handleInitiateDebate(proposal);
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
                        <Flame className="w-4 h-4" />
                        <span>
                          {isCoalitionAct && !partnerPlayer 
                            ? 'Pilih Mitra Koalisi' 
                            : 'Gelar Debat & Sahkan'
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
                Sidang Paripurna DPR RI Konoha · Fitur Debat Parlemen & Interupsi Fraksi Aktif.
              </span>
              <button
                onClick={onClose}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer ml-auto"
              >
                Tutup Sidang Paripurna
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
