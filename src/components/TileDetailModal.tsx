import React from 'react';
import { BoardTile, Player, MacroEconomy } from '../types/game';
import { formatRupiah, formatRupiahShort } from '../utils/format';
import { Building2, X, AlertTriangle, ShieldCheck, Coins } from 'lucide-react';

interface TileDetailModalProps {
  tile: BoardTile | null;
  players: Player[];
  macro: MacroEconomy;
  onClose: () => void;
}

export const TileDetailModal: React.FC<TileDetailModalProps> = ({
  tile,
  players,
  macro,
  onClose
}) => {
  if (!tile) return null;

  const inflationFactor = 1 + (macro.inflationRate / 100);
  const adjPrice = tile.price ? Math.round(tile.price * inflationFactor) : null;
  const level = tile.level || 1;
  const levelMultiplier = 1 + (level * 0.75);
  const adjRent = tile.rent ? Math.round(tile.rent * inflationFactor * levelMultiplier) : null;
  const owner = tile.ownerId ? players.find(p => p.id === tile.ownerId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl p-5 text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                Petak #{tile.id}
              </span>
              {tile.island && tile.island !== 'SPECIAL' && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {tile.islandName || tile.island}
                </span>
              )}
              {tile.actionType === 'PROPERTY' && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Surat Tanah
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-1">
              {tile.certificateTitle || tile.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Satire Lore */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          {tile.description}
        </p>

        {/* Property Financial Data */}
        {tile.actionType === 'PROPERTY' && (
          <div className="space-y-2 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status Kepemilikan:</span>
              {owner ? (
                <div className="flex items-center gap-1.5 font-bold" style={{ color: owner.color }}>
                  <span>{owner.avatar}</span>
                  <span>{owner.name} (Tingkat {level})</span>
                </div>
              ) : (
                <span className="text-emerald-400 font-bold">Tersedia untuk Dibeli</span>
              )}
            </div>

            {adjPrice && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Harga Beli (Terkoreksi Inflasi):</span>
                <span className="font-mono font-bold text-white">{formatRupiah(adjPrice)}</span>
              </div>
            )}

            {adjRent && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Biaya Sewa Saat Ini:</span>
                <span className="font-mono font-bold text-emerald-400">+{formatRupiah(adjRent)} / Singgah</span>
              </div>
            )}

            {tile.upgradeCost && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Biaya Upgrade Tingkat Usaha:</span>
                <span className="font-mono text-slate-300">{formatRupiah(Math.round(tile.upgradeCost * inflationFactor))}</span>
              </div>
            )}
          </div>
        )}

        {/* Corruption Note */}
        {tile.isCorruptionRoute && (
          <div className="bg-rose-950/40 border border-rose-800/80 p-3 rounded-xl text-xs text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>
              Petak khusus Rute Korupsi. Memberikan keuntungan kilat namun meningkatkan ancaman pemeriksaan BPK dan operasi tangkap tangan (OTT) KPK!
            </span>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Tutup Rincian
        </button>
      </div>
    </div>
  );
};
