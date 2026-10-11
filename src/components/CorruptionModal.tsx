import React, { useState } from 'react';
import { Player } from '../types/game';
import { ShieldAlert, AlertTriangle, ArrowRight, Dices, Skull } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { formatRupiah } from '../utils/format';
import { KPKRadarGauge } from './VitalIndicators';

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
      <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="relative h-28 bg-slate-950 flex items-center justify-center border-b border-amber-500/40 overflow-hidden">
          <img
            src={crestImage}
            alt="Rute Korupsi"
            className="w-24 h-24 object-contain opacity-80"
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
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Anda tiba di gerbang jalur pintas anggaran. Melewati rute ini memberikan keuntungan ratusan persen dan modal politik instan, namun ada risiko digrebek OTT KPK dan diseret ke Lapas Sukamiskin!
            </p>
          </div>

          <div className="space-y-2">
            <KPKRadarGauge player={player} variant="card" interactive={false} />
            <p className="text-slate-300 text-xs text-center">
              Radar KPK Anda: <strong className="text-rose-400 font-mono">{player.kpkSuspicionLevel}%</strong>. Semakin tinggi radar, semakin besar peluang tertangkap penyidik BPK & OTT KPK!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600 rounded-2xl shadow-2xl p-5 text-slate-100 text-center space-y-4">
        <div className="inline-flex p-3 bg-rose-500/10 border border-rose-500/30 rounded-full mx-auto">
          <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>

        <div>
          <span className="text-[11px] font-mono text-rose-400 uppercase tracking-widest font-bold">
            SIDAK BPK & RADAR OTT KPK!
          </span>
          <h3 className="text-xl font-extrabold text-white mt-1">
            Uji Nasib Penyadapan & Rekening Gendut
          </h3>
          <div className="mt-3">
            <KPKRadarGauge player={player} variant="card" interactive={false} />
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Penyidik BPK & KPK sedang menyita berkas pengadaan di kantor! Kocok dadu keberuntungan:
            <br />
            {player.kpkSuspicionLevel > 50 ? (
              <>
                <strong className="text-amber-300">Angka 5 - 6</strong>: Lolos pemeriksaan dan tembus ke Senayan!
                <br />
                <strong className="text-rose-400">Angka 1 - 4 (Radar &gt; 50%)</strong>: TERTANGKAP OTT KPK! Wajib suap Rp 20 Jt atau gugur tereliminasi!
              </>
            ) : (
              <>
                <strong className="text-amber-300">Angka 4 - 6</strong>: Lolos pemeriksaan dan tembus ke Senayan!
                <br />
                <strong className="text-rose-400">Angka 1 - 3</strong>: TERTANGKAP OTT KPK! Wajib suap Rp 20 Jt atau gugur tereliminasi!
              </>
            )}
          </p>
        </div>

        {/* Dice Result Display */}
        {rolledNumber && (
          <div className="py-2">
            <span className="text-3xl font-extrabold font-mono text-white bg-slate-950 px-5 py-2 rounded-xl border border-slate-800 inline-block shadow-inner">
              {rolledNumber}
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
          <span>{rolling ? 'Memeriksa Berkas BPK...' : 'Kocok Dadu Sidak KPK!'}</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600 rounded-2xl shadow-2xl p-5 text-slate-100 text-center space-y-4">
        <div className="inline-flex p-3 bg-rose-500/10 border border-rose-500/30 rounded-full mx-auto">
          <ShieldAlert className="w-10 h-10 text-rose-500 animate-bounce" />
        </div>

        <div>
          <span className="text-[11px] font-mono text-rose-400 uppercase tracking-widest font-bold">
            TERTANGKAP OPERASI TANGKAP TANGAN (OTT KPK)!
          </span>
          <h3 className="text-xl font-extrabold text-white mt-1">
            {canAfford ? 'Tawaran Uang Suap Oknum Penyidik' : 'Tertangkap Tanpa Uang Suap!'}
          </h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {canAfford ? (
              <>
                Penyidik KPK menemukan brankas rahasia milik <strong>{player.name}</strong>! 
                Namun oknum penyidik berbisik: <em>"Bisa diamankan jika ada pelicin sebesar {formatRupiah(bribeAmount)}..."</em>
              </>
            ) : (
              <>
                Penyidik KPK menyergap <strong>{player.name}</strong>! 
                Biaya uang suap yang diminta sebesar {formatRupiah(bribeAmount)}, namun saldo kas Anda hanya <strong>{formatRupiah(player.cash)}</strong>!
                <br />
                <span className="text-rose-400 font-bold block mt-1">
                  Tanpa uang suap, Anda divonis seumur hidup dan langsung TERELIMINASI dari permainan!
                </span>
              </>
            )}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs flex justify-between items-center">
          <span className="text-slate-400">Saldo Kas Anda:</span>
          <span className="font-mono font-bold text-emerald-400">
            {formatRupiah(player.cash)}
          </span>
        </div>

        {canAfford ? (
          <div className="space-y-2 pt-1">
            <button
              onClick={onPayBribe}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Bayar Uang Suap {formatRupiah(bribeAmount)} (Selamat dari Penjara)</span>
            </button>

            <button
              onClick={onRefuseBribe}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors border border-slate-700 cursor-pointer"
            >
              Tolak Menyuap & Pasrah Masuk Lapas Sukamiskin (-50% Kas)
            </button>
          </div>
        ) : (
          <div className="pt-2">
            <button
              onClick={onRefuseBribe}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-rose-950/60 cursor-pointer active:scale-95"
            >
              Pasrah Tereliminasi (Gugur dari Survival WNI)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
