import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Building2, Check, Handshake, X } from 'lucide-react';
import { BoardTile, MacroEconomy, Player } from '../types/game';
import { formatRupiah, formatRupiahShort } from '../utils/format';
import {
  evaluateAiTradeOffer,
  TradeOffer,
  validateTradeOffer
} from '../engine/trade';
import { soundManager } from '../utils/sound';

interface TradeModalProps {
  isOpen: boolean;
  proposer: Player;
  players: Player[];
  perimeterTiles: BoardTile[];
  macro: MacroEconomy;
  onExecuteTrade: (offer: TradeOffer) => void;
  onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  proposer,
  players,
  perimeterTiles,
  macro,
  onExecuteTrade,
  onClose
}) => {
  const candidateTargets = useMemo(
    () => players.filter(p => p.id !== proposer.id && !p.isBankrupt),
    [players, proposer.id]
  );

  const [targetId, setTargetId] = useState<string>(candidateTargets[0]?.id || '');
  const [offeredTileIds, setOfferedTileIds] = useState<number[]>([]);
  const [requestedTileIds, setRequestedTileIds] = useState<number[]>([]);
  const [offeredCash, setOfferedCash] = useState<number>(0);
  const [requestedCash, setRequestedCash] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'info'; message: string } | null>(null);
  const [pendingHumanApproval, setPendingHumanApproval] = useState<TradeOffer | null>(null);

  if (!isOpen) return null;

  const target = candidateTargets.find(p => p.id === targetId) || candidateTargets[0];
  const proposerTiles = perimeterTiles.filter(t => t.ownerId === proposer.id);
  const targetTiles = target ? perimeterTiles.filter(t => t.ownerId === target.id) : [];

  const toggleTile = (id: number, list: number[], setter: (v: number[]) => void) => {
    setFeedback(null);
    setter(list.includes(id) ? list.filter(item => item !== id) : [...list, id]);
  };

  const handleSubmitOffer = () => {
    if (!target) return;
    const offer: TradeOffer = {
      proposerId: proposer.id,
      targetId: target.id,
      offeredTileIds,
      requestedTileIds,
      offeredCash,
      requestedCash
    };

    const validation = validateTradeOffer(offer, proposer, target, perimeterTiles);
    if (!validation.valid) {
      soundManager.playBuzzer();
      setFeedback({ type: 'error', message: validation.error || 'Tawaran tidak valid.' });
      return;
    }

    if (target.isAi) {
      const evaluation = evaluateAiTradeOffer(offer, target, perimeterTiles, macro);
      if (evaluation.accepted) {
        soundManager.playCash();
        onExecuteTrade(offer);
      } else {
        soundManager.playBuzzer();
        setFeedback({ type: 'error', message: evaluation.reason });
      }
      return;
    }

    setPendingHumanApproval(offer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-black text-white">
              Negosiasi & Barter Properti
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
            aria-label="Tutup negosiasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {candidateTargets.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">
            Tidak ada lawan aktif yang tersedia untuk bernegosiasi.
          </div>
        ) : pendingHumanApproval && target ? (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Handshake className="w-4 h-4" />
                <span>Konfirmasi {target.avatar} {target.name}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>{proposer.name}</strong> menawarkan{' '}
                <strong>{pendingHumanApproval.offeredTileIds.length} properti</strong> + kas{' '}
                <strong>{formatRupiah(pendingHumanApproval.offeredCash)}</strong> untuk ditukar dengan{' '}
                <strong>{pendingHumanApproval.requestedTileIds.length} properti</strong> + kas{' '}
                <strong>{formatRupiah(pendingHumanApproval.requestedCash)}</strong> milik Anda.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPendingHumanApproval(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Tolak / Ubah
              </button>
              <button
                onClick={() => {
                  soundManager.playCash();
                  onExecuteTrade(pendingHumanApproval);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Setujui Barter</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Pilih Lawan Negosiasi:
                </label>
                <div className="flex flex-wrap gap-2">
                  {candidateTargets.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setTargetId(p.id);
                        setRequestedTileIds([]);
                        setRequestedCash(0);
                        setFeedback(null);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                        target?.id === p.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span>{p.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({formatRupiahShort(p.cash)})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Proposer Offer */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">
                      Yang Anda Tawarkan ({proposer.avatar})
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Kas: {formatRupiahShort(proposer.cash)}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {proposerTiles.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">Belum punya properti.</p>
                    ) : (
                      proposerTiles.map(tile => (
                        <button
                          key={tile.id}
                          onClick={() => toggleTile(tile.id, offeredTileIds, setOfferedTileIds)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer ${
                            offeredTileIds.includes(tile.id)
                              ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{tile.name}</span>
                          </span>
                          <span className="text-[10px] font-mono shrink-0">
                            {formatRupiahShort(tile.price || 0)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Tambah Kas (Rp):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={proposer.cash}
                      step={1_000_000}
                      value={offeredCash}
                      onChange={e => setOfferedCash(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Target Request */}
                {target && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">
                        Yang Anda Minta ({target.avatar})
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Kas: {formatRupiahShort(target.cash)}
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {targetTiles.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic">Lawan belum punya properti.</p>
                      ) : (
                        targetTiles.map(tile => (
                          <button
                            key={tile.id}
                            onClick={() => toggleTile(tile.id, requestedTileIds, setRequestedTileIds)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer ${
                              requestedTileIds.includes(tile.id)
                                ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Building2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{tile.name}</span>
                            </span>
                            <span className="text-[10px] font-mono shrink-0">
                              {formatRupiahShort(tile.price || 0)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Minta Kas (Rp):
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={target.cash}
                        step={1_000_000}
                        value={requestedCash}
                        onChange={e => setRequestedCash(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {feedback && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs">
                  {feedback.message}
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitOffer}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Handshake className="w-4 h-4" />
                <span>{target?.isAi ? 'Ajukan ke Bot AI' : 'Kirim Tawaran'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
