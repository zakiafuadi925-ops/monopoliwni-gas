import React, { useState, useEffect } from 'react';
import { Player } from '../types/game';
import { ShieldAlert, ArrowRight, Dices, AlertOctagon, Scale, Landmark, Lock, Gavel } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { formatRupiah } from '../utils/format';
import { CorruptionRadarScan } from './CorruptionRadarScan';

interface CorruptionGateModalProps {
  player: Player;
  onEnterCorruptionRoute: () => void;
  onStayOnNormalPath: () => void;
  crestImage: string;
}

export const CorruptionGateModal: React.FC<CorruptionGateModalProps> = ({
  player,
  onEnterCorruptionRoute,
  onStayOnNormalPath,
  crestImage
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="relative h-24 bg-slate-950 flex items-center justify-center border-b border-amber-500/40 overflow-hidden">
          <img
            src={crestImage}
            alt="Rute Korupsi"
            className="w-20 h-20 object-contain opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center">
            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest font-bold">
              PORTAL JALUR TIKUS ORDAL
            </span>
            <h3 className="text-lg font-extrabold text-white mt-1">
              Masuk Rute Korupsi & Proyek Siluman?
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Anda tiba di gerbang jalur pintas APBD. Mengambil proyek fiktif memberi puluhan juta rupiah dan diskon aset 40%, namun memicu radar penyisiran KPK yang berputar semakin kencang!
            </p>
          </div>

          {/* Embedded Tactical Radar Scan Display */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">STATUS RADAR PENYADAPAN:</span>
              <span className={`font-bold ${player.kpkSuspicionLevel > 50 ? 'text-rose-400' : 'text-amber-400'}`}>
                {player.kpkSuspicionLevel}% SUSPICION
              </span>
            </div>
            <CorruptionRadarScan 
              player={player} 
              variant="modal" 
              className="py-2"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-[11px] text-rose-200 space-y-1">
            <span className="font-bold flex items-center gap-1 text-rose-300">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              PERINGATAN HUKUMAN BERAT OTT KPK:
            </span>
            <p className="leading-snug text-slate-300 text-[10px]">
              Jika tertangkap di petak #103: Sita 80% kas, penyitaan aset properti, vonis 4 putaran Lapas Sukamiskin, dan drop 50 poin hak politik!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                soundManager.playClick();
                onStayOnNormalPath();
              }}
              className="min-h-[44px] py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors border border-slate-700 flex items-center justify-center cursor-pointer active:scale-95"
            >
              Jalur Rakyat (Aman)
            </button>

            <button
              onClick={() => {
                soundManager.playSirenOTT();
                onEnterCorruptionRoute();
              }}
              className="min-h-[44px] py-2.5 px-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Masuk Jalur Ordal!</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CorruptionAuditModalProps {
  player: Player;
  onAuditResolve: (caught: boolean) => void;
}

export const CorruptionAuditModal: React.FC<CorruptionAuditModalProps> = ({
  player,
  onAuditResolve
}) => {
  const [rolling, setRolling] = useState(false);
  const [rolledNumber, setRolledNumber] = useState<number | null>(null);

  // Auto-roll dice for AI players so turn does not stall
  useEffect(() => {
    if (player.isAi && !rolling && rolledNumber === null) {
      const timer = setTimeout(() => {
        handleTestFate();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [player.isAi, rolling, rolledNumber]);

  const handleTestFate = () => {
    soundManager.playDiceRoll();
    setRolling(true);

    let counter = 0;
    const interval = setInterval(() => {
      setRolledNumber(Math.floor(Math.random() * 6) + 1);
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setRolledNumber(finalDice);
        setRolling(false);

        // Player is caught if dice is 1-3, OR if their kpkSuspicionLevel > 50 and dice is 1-4
        const caughtThreshold = player.kpkSuspicionLevel > 50 ? 4 : 3;
        const caught = finalDice <= caughtThreshold;

        setTimeout(() => {
          if (caught) {
            soundManager.playSirenOTT();
          } else {
            soundManager.playCash();
          }
          onAuditResolve(caught);
        }, 1200);
      }
    }, 70);
  };

  const isHighRisk = player.kpkSuspicionLevel > 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/92 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600 rounded-2xl shadow-2xl p-5 text-slate-100 text-center space-y-3.5 max-h-[92vh] overflow-y-auto">
        <div className="inline-flex p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-full mx-auto">
          <ShieldAlert className="w-7 h-7 text-rose-500 animate-pulse" />
        </div>

        <div>
          <span className="text-[11px] font-mono text-rose-400 uppercase tracking-widest font-black">
            SIDAK BPK & RADAR OPERASI KPK (#103)!
          </span>
          <h3 className="text-xl font-extrabold text-white mt-0.5">
            Penyadapan & Pertaruhan OTT
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Penyidik KPK telah melacak koordinat transaksi Anda. Garis radar berputar sesuai tingkat kecurigaan!
          </p>
        </div>

        {/* Tactical Radar Scope with Dynamic Rotating Sweep Line */}
        <div className="py-1">
          <CorruptionRadarScan player={player} variant="modal" />
        </div>

        {/* Dice Odds and Severe Punishment Warning */}
        <div className="p-3 rounded-xl bg-slate-950 border border-rose-900/60 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between font-mono text-[11px] pb-1 border-b border-slate-800">
            <span className="text-slate-400">AMBANG BATAS OTT KPK:</span>
            <span className="text-rose-400 font-bold">
              {isHighRisk ? 'DADU 1 - 4 (RADAR > 50%)' : 'DADU 1 - 3 (NORMAL)'}
            </span>
          </div>

          <div className="space-y-1 text-[11px] leading-snug">
            <div className="flex items-start gap-1.5 text-emerald-300">
              <span className="font-mono font-bold text-emerald-400">✓ LOLOS:</span>
              <span>Dadu {isHighRisk ? '5 - 6' : '4 - 6'} — Tembus ke Gedung DPR Senayan (+20 Politik, Bebas dari Jalur Tikus).</span>
            </div>
            <div className="flex items-start gap-1.5 text-rose-300">
              <span className="font-mono font-bold text-rose-400">✗ TERTANGKAP:</span>
              <span>Dadu {isHighRisk ? '1 - 4' : '1 - 3'} — HUKUMAN BERAT: Sita 80% Kas, Sita 2 Aset Properti, Vonis 4 Putaran Lapas Sukamiskin, & -50 Hak Politik!</span>
            </div>
          </div>
        </div>

        {/* Dice Result Display */}
        {rolledNumber && (
          <div className="py-1">
            <span className="text-3xl font-extrabold font-mono text-white bg-slate-950 px-6 py-2 rounded-xl border border-rose-600 inline-block shadow-inner">
              🎲 {rolledNumber}
            </span>
          </div>
        )}

        <button
          onClick={handleTestFate}
          disabled={rolling}
          className={`
            w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg
            ${rolling 
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 cursor-pointer active:scale-95'
            }
          `}
        >
          <Dices className={`w-4 h-4 ${rolling ? 'animate-spin' : ''}`} />
          <span>{rolling ? 'Menyisir Bukti Audit BPK...' : 'Kocok Dadu Sidak KPK!'}</span>
        </button>
      </div>
    </div>
  );
};

interface KPKBribeModalProps {
  player: Player;
  bribeAmount: number;
  onPayBribe: () => void;
  onRefuseBribe: () => void;
}

export const KPKBribeModal: React.FC<KPKBribeModalProps> = ({
  player,
  bribeAmount,
  onPayBribe,
  onRefuseBribe
}) => {
  const canAfford = player.cash >= bribeAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-rose-600 rounded-2xl shadow-2xl p-5 text-slate-100 text-center space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="inline-flex p-3 bg-rose-500/10 border border-rose-500/40 rounded-full mx-auto">
          <ShieldAlert className="w-10 h-10 text-rose-500 animate-bounce" />
        </div>

        <div>
          <span className="text-[11px] font-mono text-rose-400 uppercase tracking-widest font-black block">
            🚨 OPERASI TANGKAP TANGAN (OTT KPK) TERKONFIRMASI!
          </span>
          <h3 className="text-xl font-black text-white mt-1">
            Vonis Tipikor Menanti: {player.name}
          </h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Penyidik KPK dan jaksa Tipikor telah menyegel brankas rahasia Anda. Oknum penyidik menawarkan uang damai pengamanan berkas perkara, atau pasrah dieksekusi hukuman berat!
          </p>
        </div>

        {/* Severe Penalties Breakdown Card */}
        <div className="bg-rose-950/40 border-2 border-rose-700/80 rounded-xl p-3.5 text-left space-y-2">
          <div className="flex items-center gap-2 pb-1.5 border-b border-rose-800/80">
            <Gavel className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-mono font-black text-rose-200 uppercase tracking-wide">
              HUKUMAN BERAT JIKA MENOLAK / TANPA SUAP:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-start gap-1.5 text-slate-200">
              <Landmark className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Sita 80% Saldo Kas Tunai</strong> untuk pemulihan kerugian negara (asset recovery).</span>
            </div>
            <div className="flex items-start gap-1.5 text-slate-200">
              <Scale className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Penyitaan hingga 2 Aset Properti</strong> termahal Anda kembali menjadi milik negara.</span>
            </div>
            <div className="flex items-start gap-1.5 text-slate-200">
              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Vonis 4 Putaran Lapas Sukamiskin</strong> (kehilangan giliran & hak dividen).</span>
            </div>
            <div className="flex items-start gap-1.5 text-slate-200">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Pencabutan 50 Poin Hak Politik</strong> & Stres melonjak ke <strong>100%</strong>.</span>
            </div>
          </div>
        </div>

        {/* Cash Balance Display */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs flex justify-between items-center">
          <span className="text-slate-400">Saldo Kas Tunai Saat Ini:</span>
          <span className="font-mono font-extrabold text-emerald-400 text-sm">
            {formatRupiah(player.cash)}
          </span>
        </div>

        {canAfford ? (
          <div className="space-y-2.5 pt-1">
            <button
              onClick={onPayBribe}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Bayar Uang Damai {formatRupiah(bribeAmount)} (-30 Politik, Lolos Bui)</span>
            </button>

            <button
              onClick={onRefuseBribe}
              className="w-full py-2.5 px-4 bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-bold text-xs rounded-xl transition-colors border border-rose-800 cursor-pointer"
            >
              Tolak Menyuap & Terima Eksekusi Hukuman Berat KPK
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 text-left">
              Saldo kas Anda ({formatRupiah(player.cash)}) tidak mencukupi untuk membayar uang damai {formatRupiah(bribeAmount)}. Anda dapat melikuidasi tanah atau pasrah menjalani vonis berat Tipikor!
            </div>
            <button
              onClick={onPayBribe}
              className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              Jual Aset Tanah untuk Bayar Suap {formatRupiah(bribeAmount)}
            </button>
            <button
              onClick={onRefuseBribe}
              className="w-full py-3 px-4 bg-rose-700 hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-rose-950/60 cursor-pointer active:scale-95"
            >
              Pasrah Dieksekusi: Sita 80% Kas, Sita Properti, & Vonis 4 Putaran Lapas!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
