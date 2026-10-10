import React from 'react';
import { Player, BoardTile } from '../types/game';
import { formatRupiah } from '../utils/format';
import { AlertTriangle, ShieldAlert, FileText, Ban, Skull } from 'lucide-react';

interface MusibahModalProps {
  player: Player;
  confiscatedTile: BoardTile | null;
  calamityFine: number;
  hasSuratTanah: boolean;
  onConfirm: () => void;
}

export const MusibahModal: React.FC<MusibahModalProps> = ({
  player,
  confiscatedTile,
  calamityFine,
  hasSuratTanah,
  onConfirm
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-rose-600 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-100 space-y-4">
        {/* Header Alert */}
        <div className="flex items-center gap-3 border-b border-rose-950/80 pb-3">
          <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-600/80 text-rose-400 shrink-0 animate-pulse">
            <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              HAL TAK TERDUGA · EVENT MUSIBAH NASIONAL
            </span>
            <h3 className="text-base sm:text-xl font-black text-white leading-tight">
              PENERTIBAN & RAMPASAN NEGARA!
            </h3>
          </div>
        </div>

        {/* Narrative Context */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-3 sm:p-3.5 rounded-xl border border-slate-800">
          Ketetapan darurat pemerintah telah diberlakukan! Satgas Penertiban Lahan dan instrumen Proyek Strategis Nasional (PSN) mengeksekusi penertiban aset demi kepentingan negara tanpa toleransi.
        </p>

        {/* Primary Impact Outcome */}
        {hasSuratTanah && confiscatedTile ? (
          <div className="p-3.5 sm:p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-300 font-bold flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-400" />
                SURAT TANAH RESMI DIRAMPAS OLEH NEGARA:
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900/80 text-rose-200 border border-rose-700">
                Dicabut & Disita
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-rose-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    {confiscatedTile.certificateTitle || confiscatedTile.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Lokasi: {confiscatedTile.cityName || confiscatedTile.shortName} ({confiscatedTile.islandName})
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-[10px] font-bold text-rose-400 block uppercase">
                  Status
                </span>
                <span className="text-xs font-mono font-black text-rose-500">
                  DILELANG NEGARA
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-rose-950">
              <span>Korban Perampasan: <strong className="text-white">{player.name}</strong></span>
              <span className="text-rose-400 font-bold">Stres Naik +20%</span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-amber-400" />
                Tidak Memiliki Surat Tanah untuk Dirampas!
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Karena <strong className="text-white">{player.name}</strong> belum memiliki Surat Tanah apapun, negara membebankan Pajak Penanggulangan Bencana & Retribusi Darurat.
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-amber-900/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Denda Musibah Negara:</span>
              <span className="text-sm font-mono font-black text-rose-400">
                -{formatRupiah(calamityFine)}
              </span>
            </div>
            <div className="text-[11px] text-amber-400 font-medium">
              *Jika kas tidak mencukupi untuk melunasi denda, pemain dinyatakan bangkrut.
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onConfirm}
          className="w-full min-h-[46px] py-2.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Terima Keputusan Negara & Lanjutkan</span>
        </button>
      </div>
    </div>
  );
};
