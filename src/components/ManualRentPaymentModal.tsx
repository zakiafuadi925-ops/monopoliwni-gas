import React, { useState, useEffect } from 'react';
import { Player, BoardTile } from '../types/game';
import { formatRupiah } from '../utils/format';
import { soundManager } from '../utils/sound';
import { 
  Building2, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  HandCoins, 
  ShieldCheck, 
  Sparkles,
  Zap,
  TrendingUp,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface RentTransferData {
  payer: Player;
  owner: Player;
  tile: BoardTile;
  rentCost: number;
  multiplier?: number;
  discountApplied?: number;
  isAiAuto?: boolean;
}

interface ManualRentPaymentModalProps {
  data: RentTransferData;
  onConfirmPayment: () => void;
  onUseSpecialCard?: (cardId: string) => void;
}

export const ManualRentPaymentModal: React.FC<ManualRentPaymentModalProps> = ({
  data,
  onConfirmPayment,
  onUseSpecialCard
}) => {
  const { payer, owner, tile, rentCost, multiplier = 1 } = data;
  const [phase, setPhase] = useState<'PROMPT' | 'COUNTING' | 'TRANSFERRING' | 'DONE'>('PROMPT');
  const [transferredAmount, setTransferredAmount] = useState<number>(0);
  const [cashStashFlying, setCashStashFlying] = useState<number[]>([]);
  const [slideOffset, setSlideOffset] = useState<number>(0); // 0 to 100 for swipe-to-pay
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Check special cards available on payer
  const ordalCard = payer.specialCards?.find(c => c.type === 'ORDAL_SAKTI');

  // Trigger manual cash payment sequence
  const executePaymentAnimation = () => {
    if (phase !== 'PROMPT') return;
    setPhase('TRANSFERRING');
    soundManager.playCash();

    // Trigger sequential counting and sound pulses
    const steps = 12;
    const intervalTime = 65; // ~800ms total transfer
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(1, currentStep / steps);
      setTransferredAmount(Math.round(rentCost * currentProgress));
      setCashStashFlying(prev => [...prev.slice(-6), Date.now() + Math.random()]);

      // Sound chirp every 3 steps
      if (currentStep % 3 === 0) {
        soundManager.playPawnStep(currentStep);
      }

      if (currentStep >= steps) {
        clearInterval(interval);
        setPhase('DONE');
        soundManager.playVictory();

        try {
          confetti({
            particleCount: 35,
            spread: 55,
            origin: { y: 0.6 }
          });
        } catch {}

        // Complete callback
        setTimeout(() => {
          onConfirmPayment();
        }, 950);
      }
    }, intervalTime);
  };

  // Drag handler for interactive Swipe-to-Pay button
  const handleSliderMove = (clientX: number, barRect: DOMRect) => {
    const rawOffset = clientX - barRect.left - 24;
    const maxOffset = barRect.width - 48;
    const clamped = Math.max(0, Math.min(maxOffset, rawOffset));
    const percent = Math.round((clamped / maxOffset) * 100);
    setSlideOffset(percent);
    if (percent >= 92 && phase === 'PROMPT') {
      setIsDraggingSlider(false);
      executePaymentAnimation();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative"
        style={{
          borderColor: owner.color || '#f59e0b',
          boxShadow: `0 0 36px ${owner.color}35, 0 20px 40px rgba(0,0,0,0.85)`
        }}
      >
        {/* Animated Flying Banknotes Effect during Transfer */}
        {phase === 'TRANSFERRING' && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {cashStashFlying.map((id, index) => (
              <div 
                key={id}
                className="absolute text-xl animate-bounce"
                style={{
                  top: `${20 + (index * 12)}%`,
                  left: `${30 + (index * 8) + (Math.sin(index) * 15)}%`,
                  transform: `rotate(${Math.sin(index) * 35}deg)`,
                  transition: 'all 0.4s ease-out'
                }}
              >
                💵
              </div>
            ))}
          </div>
        )}

        {/* Modal Header */}
        <div 
          className="p-3.5 sm:p-4 text-white flex items-center justify-between border-b border-slate-800"
          style={{
            background: `linear-gradient(135deg, rgba(15,23,42,0.95), ${owner.color}25, rgba(15,23,42,0.95))`
          }}
        >
          <div className="flex items-center gap-2.5">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md border-2 shrink-0 text-xl"
              style={{ borderColor: owner.color, backgroundColor: `${owner.color}30` }}
            >
              {tile.zone === 'PULAU_JAWA' ? '🏙️' : tile.zone === 'PULAU_SUMATRA' ? '🌴' : tile.zone === 'PULAU_KALIMANTAN' ? '🌳' : tile.zone === 'PULAU_SULAWESI' ? '🌊' : '💎'}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                FAKTUR PEMBAYARAN SEWA PROPERTI
              </span>
              <h2 className="text-sm sm:text-base font-black text-white leading-tight">
                {tile.certificateTitle || tile.name} (Tingkat {tile.level || 1})
              </h2>
            </div>
          </div>

          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold shadow-sm"
            style={{ borderColor: owner.color, backgroundColor: `${owner.color}20`, color: '#f8fafc' }}
          >
            <span>Pemilik:</span>
            <span className="text-base">{owner.avatar}</span>
            <span className="truncate max-w-[80px] sm:max-w-[110px]">{owner.name}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Visual Cash Flow Arena: Payer -> Moving Cash -> Owner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10 gap-2">
              {/* Left: Payer Profile */}
              <div className="flex flex-col items-center text-center w-28 sm:w-32 shrink-0">
                <div 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center text-2xl shadow-lg relative"
                  style={{ borderColor: payer.color, backgroundColor: `${payer.color}25` }}
                >
                  {payer.avatar}
                  <span 
                    className="absolute -bottom-1 -right-1 text-[8px] font-mono font-black text-white px-1.5 py-0 rounded-full border border-slate-950"
                    style={{ backgroundColor: payer.color }}
                  >
                    {payer.id.startsWith('player_') ? `P${payer.id.replace('player_', '')}` : 'P'}
                  </span>
                </div>
                <span className="font-extrabold text-xs sm:text-sm text-white mt-1.5 truncate max-w-full">
                  {payer.name}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Kas: {formatRupiah(payer.cash - (phase === 'DONE' ? rentCost : transferredAmount))}
                </span>
                <span className="text-[9px] text-rose-400 font-mono mt-0.5">
                  - {formatRupiah(phase === 'PROMPT' ? rentCost : transferredAmount)}
                </span>
              </div>

              {/* Middle: Dynamic Cash Transfer Conduit */}
              <div className="flex-1 flex flex-col items-center justify-center px-1">
                {/* Flow Track */}
                <div className="relative w-full flex items-center justify-center my-2">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 transition-all duration-150 ${
                        phase === 'TRANSFERRING' ? 'animate-pulse' : ''
                      }`}
                      style={{ 
                        width: phase === 'PROMPT' 
                          ? `${slideOffset}%` 
                          : `${Math.round((transferredAmount / (rentCost || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                  {/* Floating Cash Icon */}
                  <div 
                    className={`absolute w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-xs shadow-lg transition-transform ${
                      phase === 'TRANSFERRING' ? 'scale-125 animate-bounce' : ''
                    }`}
                  >
                    💸
                  </div>
                </div>

                <span className="text-[10px] font-mono font-extrabold text-amber-300 uppercase tracking-widest mt-1 text-center">
                  {phase === 'PROMPT' && 'Menunggu Pembayaran'}
                  {phase === 'TRANSFERRING' && 'Mengirim Tunai...'}
                  {phase === 'DONE' && '✅ LUNAS DITERIMA'}
                </span>

                <span className="text-xs sm:text-sm font-black font-mono text-emerald-400 mt-0.5">
                  {formatRupiah(phase === 'PROMPT' ? rentCost : transferredAmount)}
                </span>
              </div>

              {/* Right: Owner Profile */}
              <div className="flex flex-col items-center text-center w-28 sm:w-32 shrink-0">
                <div 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center text-2xl shadow-lg relative"
                  style={{ borderColor: owner.color, backgroundColor: `${owner.color}25` }}
                >
                  {owner.avatar}
                  <span 
                    className="absolute -bottom-1 -right-1 text-[8px] font-mono font-black text-white px-1.5 py-0 rounded-full border border-slate-950"
                    style={{ backgroundColor: owner.color }}
                  >
                    {owner.id.startsWith('player_') ? `P${owner.id.replace('player_', '')}` : 'P'}
                  </span>
                </div>
                <span className="font-extrabold text-xs sm:text-sm text-white mt-1.5 truncate max-w-full">
                  {owner.name}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Kas: {formatRupiah(owner.cash + (phase === 'DONE' ? rentCost : transferredAmount))}
                </span>
                <span className="text-[9px] text-emerald-300 font-mono mt-0.5">
                  + {formatRupiah(phase === 'PROMPT' ? rentCost : transferredAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Breakdown Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Rincian Transaksi Sewa:</span>
              </span>
              <span className="font-mono text-slate-300 font-bold">
                Petak #{tile.id} · {tile.shortName || tile.name}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Tarif Sewa Pokok (Tingkat {tile.level || 1}):</span>
              <span className="font-mono text-slate-200">
                {formatRupiah(tile.rent || 0)}
              </span>
            </div>

            {multiplier > 1 && (
              <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                <span>Pengali RUU Subsidi / Kebijakan Monopoli:</span>
                <span className="font-mono">x{multiplier.toFixed(2)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 font-bold">
              <span className="text-white flex items-center gap-1">
                <HandCoins className="w-4 h-4 text-emerald-400" />
                <span>Total Wajib Bayar:</span>
              </span>
              <span className="text-base font-black font-mono text-emerald-400">
                {formatRupiah(rentCost)}
              </span>
            </div>
          </div>

          {/* Optional: Special Card Exemption */}
          {ordalCard && onUseSpecialCard && phase === 'PROMPT' && (
            <div className="bg-amber-950/50 border border-amber-500/70 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-amber-300 block">
                    Gunakan Kartu Ordal Sakti
                  </span>
                  <span className="text-[10px] text-slate-300">
                    Bebaskan biaya sewa ini lewat koneksi orang dalam dewan!
                  </span>
                </div>
              </div>
              <button
                onClick={() => onUseSpecialCard(ordalCard.id)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg transition-colors cursor-pointer shrink-0 shadow"
              >
                Pakai Kartu
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls: Interactive Swipe or One-Click Button */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-2.5">
          {phase === 'PROMPT' ? (
            <div className="space-y-2">
              {/* Interactive Swipe-to-Pay Slider */}
              <div 
                className="relative h-12 bg-slate-900 border-2 border-emerald-500/60 rounded-xl overflow-hidden flex items-center px-1.5 select-none touch-none"
                onMouseMove={(e) => {
                  if (isDraggingSlider) {
                    handleSliderMove(e.clientX, e.currentTarget.getBoundingClientRect());
                  }
                }}
                onMouseLeave={() => {
                  if (isDraggingSlider) {
                    setIsDraggingSlider(false);
                    setSlideOffset(0);
                  }
                }}
                onMouseUp={() => {
                  if (isDraggingSlider) {
                    setIsDraggingSlider(false);
                    if (slideOffset < 92) setSlideOffset(0);
                  }
                }}
                onTouchMove={(e) => {
                  if (isDraggingSlider && e.touches[0]) {
                    handleSliderMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
                  }
                }}
                onTouchEnd={() => {
                  if (isDraggingSlider) {
                    setIsDraggingSlider(false);
                    if (slideOffset < 92) setSlideOffset(0);
                  }
                }}
              >
                {/* Background Guide Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-extrabold text-emerald-400/80 tracking-wider uppercase">
                  Geser ke kanan untuk bayar sewa ➔
                </div>

                {/* Filled Slider Bar */}
                <div 
                  className="absolute inset-y-0 left-0 bg-emerald-600/30 transition-all pointer-events-none"
                  style={{ width: `${slideOffset}%` }}
                />

                {/* Draggable Knob */}
                <button
                  type="button"
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onTouchStart={() => setIsDraggingSlider(true)}
                  style={{ transform: `translateX(${slideOffset * 3.6}px)` }}
                  className="relative z-10 w-10 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing transition-transform"
                >
                  <ArrowRight className="w-5 h-5 text-slate-950" />
                </button>
              </div>

              {/* Or Quick Click Button */}
              <button
                onClick={executePaymentAnimation}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <HandCoins className="w-4 h-4 text-emerald-200" />
                <span>Bayar Tunai Sekarang ({formatRupiah(rentCost)})</span>
              </button>
            </div>
          ) : phase === 'TRANSFERRING' ? (
            <div className="py-3 px-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center justify-center gap-2.5 text-xs font-bold text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Memproses pemindahan saldo antar rekening WNI...</span>
            </div>
          ) : (
            <div className="py-3 px-4 bg-emerald-900/80 border border-emerald-400 rounded-xl flex items-center justify-center gap-2 text-xs font-black text-white shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Transaksi Sewa Selesai & Tercatat di Logbook!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
