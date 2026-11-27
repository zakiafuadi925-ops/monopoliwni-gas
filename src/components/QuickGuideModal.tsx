import React from 'react';
import {
  AlertTriangle,
  Building2,
  HelpCircle,
  Landmark,
  ShieldAlert,
  Trophy,
  X
} from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      icon: Building2,
      color: 'text-sky-400',
      title: '1. Properti & Sewa Inflasi Dinamis',
      body: 'Beli dan upgrade properti di 5 pulau Nusantara. Harga sewa dan nilai jual aset otomatis mengikuti tingkat Inflasi makroekonomi serta RUU yang berlaku.'
    },
    {
      icon: AlertTriangle,
      color: 'text-rose-400',
      title: '2. Stres 100% & Krisis Kas',
      body: 'Jika Stres mencapai 100%, Anda wajib membayar terapi psikiater Rp 10 Juta. Jika kas kurang untuk membayar sewa atau denda, Anda bisa menjual aset properti secara darurat (80% nilai pasar) atau dinyatakan bangkrut.'
    },
    {
      icon: ShieldAlert,
      color: 'text-amber-400',
      title: '3. Rute Korupsi & Radar KPK',
      body: 'Masuk Rute Korupsi memberi uang proyek besar, tetapi menaikkan Radar KPK. Jika kena OTT saat audit, siapkan uang suap atau Kartu Ordal Sakti agar tidak masuk Lapas Sukamiskin atau tereliminasi!'
    },
    {
      icon: Landmark,
      color: 'text-emerald-400',
      title: '4. Parlemen Senayan & Koalisi',
      body: 'Kumpulkan Pengaruh Politik untuk meloloskan RUU reguler maupun RUU Koalisi bersama rekan fraksi—mulai dari subsidi UMKM hingga pajak progresif & sita aset rival.'
    },
    {
      icon: Trophy,
      color: 'text-purple-400',
      title: '5. Kondisi Kemenangan',
      body: 'Di Mode Survival Penuh, pemenang adalah penyintas terakhir. Di Mode Cepat (15 Putaran), pemenang adalah penyintas dengan total kekayaan bersih (kas + nilai properti) tertinggi saat Putaran #15 berakhir.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
              Panduan Singkat Monopoli WNI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
            aria-label="Tutup panduan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-3 overflow-y-auto">
          {sections.map(sec => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.title}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                  <Icon className={`w-4 h-4 ${sec.color}`} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100">{sec.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{sec.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition-colors"
          >
            Siap Bermain!
          </button>
        </div>
      </div>
    </div>
  );
};
