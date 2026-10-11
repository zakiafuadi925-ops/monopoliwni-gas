import React, { useState } from 'react';
import { Player } from '../types/game';
import { 
  ShieldAlert, 
  HeartCrack, 
  Sparkles, 
  AlertTriangle, 
  Radio, 
  Activity, 
  HelpCircle, 
  X, 
  Landmark, 
  Brain, 
  FileCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { formatRupiah } from '../utils/format';
import { soundManager } from '../utils/sound';

// ==========================================
// 1. RADAR KPK GAUGE & SURVEILLANCE MONITOR
// ==========================================

export interface KPKStatusInfo {
  level: number;
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  diceRisk: string;
  isHighRisk: boolean;
  isCritical: boolean;
}

export const getKPKStatusInfo = (suspicion: number): KPKStatusInfo => {
  if (suspicion >= 75) {
    return {
      level: suspicion,
      label: 'TARGET OTT',
      sublabel: 'Penyelidikan Siaga 1 (OTT Aktif)',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20',
      borderColor: 'border-rose-500/70',
      diceRisk: 'Dadu 1-4 Tertangkap OTT (67% Risiko)',
      isHighRisk: true,
      isCritical: true,
    };
  }
  if (suspicion > 50) {
    return {
      level: suspicion,
      label: 'PENYADAPAN',
      sublabel: 'Surat Sprindik Terbit',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/70',
      diceRisk: 'Dadu 1-4 Tertangkap OTT (67% Risiko)',
      isHighRisk: true,
      isCritical: false,
    };
  }
  if (suspicion >= 25) {
    return {
      level: suspicion,
      label: 'PANTAUAN BPK',
      sublabel: 'Pengumpulan Bahan Keterangan',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/15',
      borderColor: 'border-yellow-500/50',
      diceRisk: 'Dadu 1-3 Tertangkap OTT (50% Risiko)',
      isHighRisk: false,
      isCritical: false,
    };
  }
  return {
    level: suspicion,
    label: 'AMAN',
    sublabel: 'Rekening Bersih dari Pengawasan',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/50',
    diceRisk: 'Dadu 1-3 Tertangkap OTT (50% Risiko)',
    isHighRisk: false,
    isCritical: false,
  };
};

interface KPKRadarProps {
  player: Player;
  variant?: 'hud' | 'card' | 'expanded';
  interactive?: boolean;
}

/**
 * Animated radar-ping rings pulsing with randomized intervals and jitter
 * when kpkSuspicionLevel > 60% to signal active OTT intercept hazard.
 */
export const KPKRadarPingEffect: React.FC<{
  suspicionLevel: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ suspicionLevel, size = 'sm', className = '' }) => {
  if (suspicionLevel <= 60) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 flex items-center justify-center -m-1 ${className}`}>
      {/* Ping Wave 1: Rapid 1.7s cycle */}
      <span 
        className="absolute w-full h-full rounded-full border border-rose-500/90 bg-rose-500/25 animate-radar-ping-jitter-1 shadow-[0_0_8px_rgba(244,63,94,0.6)]" 
      />
      {/* Ping Wave 2: Staggered 2.3s random offset */}
      <span 
        className="absolute w-full h-full rounded-full border border-rose-400/80 bg-rose-500/15 animate-radar-ping-jitter-2 shadow-[0_0_12px_rgba(244,63,94,0.4)]" 
      />
      {/* Ping Wave 3: Hyper frequency if critical (>75%) */}
      {suspicionLevel >= 75 && (
        <span 
          className="absolute w-full h-full rounded-full border border-red-500 bg-red-600/30 animate-radar-ping-jitter-3 shadow-[0_0_16px_rgba(239,68,68,0.8)]" 
        />
      )}
    </div>
  );
};

export const KPKRadarGauge: React.FC<KPKRadarProps> = ({
  player,
  variant = 'hud',
  interactive = true
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const status = getKPKStatusInfo(player.kpkSuspicionLevel);
  const isHighRiskPing = player.kpkSuspicionLevel > 60;

  const handleOpenInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (interactive) {
      soundManager.playClick();
      setShowInfo(true);
    }
  };

  return (
    <>
      <div 
        onClick={handleOpenInfo}
        className={`
          group relative select-none transition-all
          ${variant === 'hud' 
            ? 'w-full min-w-0 flex-1 bg-slate-950/70 border border-slate-800 hover:border-rose-500/60 rounded-xl p-1.5 sm:p-2 cursor-pointer' 
            : variant === 'card'
            ? 'w-full bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-xl p-2.5 cursor-pointer'
            : 'w-full bg-slate-950 border border-slate-800 rounded-2xl p-4'
          }
          ${isHighRiskPing ? 'ring-1 ring-rose-500/70 shadow-[0_0_14px_rgba(244,63,94,0.3)] animate-radar-glitch-subtle' : ''}
          ${status.isCritical ? 'ring-1 ring-rose-500/80 shadow-[0_0_16px_rgba(244,63,94,0.4)]' : ''}
        `}
        title={`Radar Penyadapan KPK: ${player.kpkSuspicionLevel}% (${status.label})${isHighRiskPing ? ' - AWAS OTT AKTIF (>60%)!' : ''}`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-1.5 gap-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            {/* Animated Miniature Radar Scope with Pulsing Radar-Ping */}
            <div className="relative flex items-center justify-center shrink-0">
              {/* Radar Ping Pulse when suspicion is above 60% */}
              {isHighRiskPing && (
                <KPKRadarPingEffect suspicionLevel={player.kpkSuspicionLevel} size="sm" />
              )}

              <div className={`relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border bg-slate-950 overflow-hidden flex items-center justify-center shrink-0 z-10 ${
                isHighRiskPing ? 'border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'border-rose-500/60'
              }`}>
                {/* Radar Rings */}
                <div className="absolute inset-0.5 rounded-full border border-rose-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-[0.5px] bg-rose-500/30" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-[0.5px] bg-rose-500/30" />
                </div>
                
                {/* Rotating Sweep Beam */}
                <div 
                  className={`absolute inset-0 ${isHighRiskPing ? 'animate-radar-sweep-fast' : 'animate-radar-sweep'}`}
                  style={{
                    background: 'conic-gradient(from 0deg at 50% 50%, rgba(244,63,94,0.7) 0deg, rgba(244,63,94,0.1) 45deg, transparent 70deg)'
                  }}
                />

                {/* Blip Target if Suspicious */}
                {player.kpkSuspicionLevel >= 25 && (
                  <div 
                    className={`absolute w-1 h-1 rounded-full ${isHighRiskPing ? 'bg-rose-400 animate-ping' : 'bg-amber-400'} top-1 right-1`} 
                  />
                )}
              </div>
            </div>

            <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 truncate">
              KPK
            </span>
            {isHighRiskPing && (
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <span className={`font-mono text-[11px] sm:text-xs font-black ${status.color}`}>
              {player.kpkSuspicionLevel}%
            </span>
          </div>
        </div>

        {/* Radar Progress Bar with Tier Markers */}
        <div className="relative w-full h-1.5 sm:h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div 
            className={`h-full transition-all duration-500 ${
              status.isCritical 
                ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-400' 
                : player.kpkSuspicionLevel > 50 
                ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                : player.kpkSuspicionLevel >= 25 
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500' 
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(4, player.kpkSuspicionLevel))}%` }}
          />

          {/* 50% Danger Threshold Notch */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-rose-400/80 z-10"
            style={{ left: '50%' }}
            title="Ambang Batas 50%: Risiko Tertangkap OTT bertambah ke Dadu 1-4"
          />
        </div>

        {/* Status Badge & Danger Warning Text */}
        <div className="flex items-center justify-between text-[9px] mt-1">
          <span className={`font-bold font-mono tracking-tight px-1 py-0.2 rounded ${status.bgColor} ${status.color}`}>
            {status.label}
          </span>
          <span className="text-slate-500 text-[8px] sm:text-[9px] font-mono">
            {player.kpkSuspicionLevel > 50 ? 'Dadu 1-4' : 'Dadu 1-3'}
          </span>
        </div>
      </div>

      {/* Detail Popover / Modal when clicked */}
      {showInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowInfo(false)}
        >
          <div 
            className="max-w-md w-full bg-slate-900 border-2 border-rose-500/70 rounded-2xl p-5 shadow-2xl space-y-4 text-slate-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    RADAR PENYADAPAN KPK & BPK
                  </h3>
                  <span className="text-xs text-slate-400">
                    Status Pemain: {player.name} ({player.title})
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Radar Visual Display */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Radar Screen Visual */}
              <div className="relative w-36 h-36 rounded-full border-2 border-rose-500/50 bg-slate-950/90 shadow-[0_0_20px_rgba(244,63,94,0.2)] flex items-center justify-center">
                {/* Full Radar-ping Pulse rings when suspicion > 60% */}
                {isHighRiskPing && (
                  <div className="absolute inset-0 rounded-full overflow-visible pointer-events-none">
                    <span className="absolute -inset-2 rounded-full border-2 border-rose-500/80 bg-rose-500/20 animate-radar-ping-jitter-1" />
                    <span className="absolute -inset-4 rounded-full border border-rose-400/60 bg-rose-500/10 animate-radar-ping-jitter-2" />
                  </div>
                )}

                {/* Concentric rings */}
                <div className="absolute inset-4 rounded-full border border-rose-500/25" />
                <div className="absolute inset-9 rounded-full border border-rose-500/20" />
                <div className="absolute inset-14 rounded-full border border-rose-500/15" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-rose-500/30" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-0.5 bg-rose-500/30" />
                </div>

                {/* Rotating Beam */}
                <div 
                  className={`absolute inset-0 ${status.isCritical ? 'animate-radar-sweep-fast' : 'animate-radar-sweep'}`}
                  style={{
                    background: 'conic-gradient(from 0deg at 50% 50%, rgba(244,63,94,0.6) 0deg, rgba(244,63,94,0.1) 60deg, transparent 90deg)'
                  }}
                />

                {/* Blip dots */}
                <div 
                  className={`absolute w-2.5 h-2.5 rounded-full ${status.isCritical ? 'bg-rose-400 animate-ping' : 'bg-amber-400'} top-8 right-9`}
                />
                {player.kpkSuspicionLevel > 50 && (
                  <div className="absolute w-2 h-2 rounded-full bg-rose-500 animate-ping bottom-9 left-8" />
                )}

                {/* Center Core */}
                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg z-10" />
              </div>

              {/* Status readout */}
              <div className="mt-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className={`font-mono text-2xl font-black ${status.color}`}>
                    {player.kpkSuspicionLevel}%
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.bgColor} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {status.sublabel}
                </p>
              </div>
            </div>

            {/* Rules & Danger Explanation */}
            <div className="space-y-2 text-xs">
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 space-y-1.5">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Konsekuensi Hukum & Operasi Tangkap Tangan:
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Bila mendarat di petak <strong>Sidak BPK / OTT KPK (Petak #102)</strong>:
                </p>
                <div className="bg-slate-900/90 rounded-lg p-2 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Radar ≤ 50%:</span>
                    <span className="text-amber-300">Dadu 1-3 Tertangkap OTT (50%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Radar &gt; 50%:</span>
                    <span className="text-rose-400 font-bold">Dadu 1-4 Tertangkap OTT (67%)</span>
                  </div>
                </div>
                <p className="text-slate-400 text-[11px]">
                  🚨 <strong>Sanksi Tertangkap OTT</strong>: Wajib membayar uang suap <strong>Rp 20.000.000</strong> ke oknum penyidik. Jika kas tidak cukup atau menolak, pemain <strong>didiskualifikasi / bangkrut seketika</strong> dan disita seluruh asetnya ke Sukamiskin!
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1 text-slate-300">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" />
                  Cara Menurunkan Radar Penyadapan:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                  <li>Tolak tawaran proyek kotor atau gratifikasi saat mengambil Kartu Takdir (-15%).</li>
                  <li>Lolos dari Sidak BPK ke DPR Senayan (-20%).</li>
                  <li>Sahkan <strong className="text-amber-300">RUU Pelemahan KPK</strong> di DPR Senayan (Petak #21) untuk memotong risiko penyadapan hingga 50%!</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup Rincian Radar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================
// 2. STRESS METER & MENTAL HEALTH GAUGE
// ==========================================

export interface StressStatusInfo {
  level: number;
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  heartbeatClass: string;
  isWarning: boolean;
  isCritical: boolean;
}

export const getStressStatusInfo = (stress: number): StressStatusInfo => {
  if (stress >= 80) {
    return {
      level: stress,
      label: 'KRITIS',
      sublabel: 'Ambang Batas Psikolog Rp 10 Jt!',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20',
      borderColor: 'border-rose-500/70',
      heartbeatClass: 'animate-heartbeat-fast',
      isWarning: true,
      isCritical: true,
    };
  }
  if (stress >= 60) {
    return {
      level: stress,
      label: 'BURNOUT',
      sublabel: 'Beban Pikiran Berat',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/70',
      heartbeatClass: 'animate-heartbeat',
      isWarning: true,
      isCritical: false,
    };
  }
  if (stress >= 35) {
    return {
      level: stress,
      label: 'TEGANG',
      sublabel: 'Kelelahan Finansial Wajar',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/15',
      borderColor: 'border-yellow-500/50',
      heartbeatClass: '',
      isWarning: false,
      isCritical: false,
    };
  }
  return {
    level: stress,
    label: 'PRIMA',
    sublabel: 'Mental Stabil & Bugar',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/50',
    heartbeatClass: '',
    isWarning: false,
    isCritical: false,
  };
};

interface StressIndicatorProps {
  player: Player;
  variant?: 'hud' | 'card' | 'expanded';
  interactive?: boolean;
}

export const StressIndicator: React.FC<StressIndicatorProps> = ({
  player,
  variant = 'hud',
  interactive = true
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const status = getStressStatusInfo(player.stress);

  const handleOpenInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (interactive) {
      soundManager.playClick();
      setShowInfo(true);
    }
  };

  return (
    <>
      <div
        onClick={handleOpenInfo}
        className={`
          group relative select-none transition-all
          ${variant === 'hud'
            ? 'w-full min-w-0 flex-1 bg-slate-950/70 border border-slate-800 hover:border-rose-500/60 rounded-xl p-1.5 sm:p-2 cursor-pointer'
            : variant === 'card'
            ? 'w-full bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-xl p-2.5 cursor-pointer'
            : 'w-full bg-slate-950 border border-slate-800 rounded-2xl p-4'
          }
          ${status.isCritical ? 'ring-1 ring-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.25)]' : ''}
        `}
        title="Klik untuk melihat Detail Stres Mental & Konsultasi Psikiater"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5 gap-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <HeartCrack 
              className={`w-3.5 h-3.5 shrink-0 ${status.color} ${status.heartbeatClass}`} 
            />
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 truncate">
              Stres
            </span>
          </div>

          <span className={`font-mono text-[11px] sm:text-xs font-black shrink-0 ${status.color}`}>
            {player.stress}%
          </span>
        </div>

        {/* Progress Bar with 80% and 100% Notches */}
        <div className="relative w-full h-1.5 sm:h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div 
            className={`h-full transition-all duration-500 ${
              status.isCritical 
                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 animate-pulse' 
                : player.stress >= 60 
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500' 
                : player.stress >= 35 
                ? 'bg-gradient-to-r from-emerald-500 to-yellow-500' 
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(4, player.stress))}%` }}
          />

          {/* 80% Warning Notch */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-rose-400/70 z-10"
            style={{ left: '80%' }}
            title="Zona Siaga: 80% Stres"
          />
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between text-[9px] mt-1">
          <span className={`font-bold font-mono tracking-tight px-1 py-0.2 rounded ${status.bgColor} ${status.color}`}>
            {status.label}
          </span>
          <span className="text-slate-500 text-[8px] sm:text-[9px] font-mono">
            {status.isCritical ? 'Psikiater!' : 'Maks 100%'}
          </span>
        </div>
      </div>

      {/* Info Popover */}
      {showInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowInfo(false)}
        >
          <div 
            className="max-w-md w-full bg-slate-900 border-2 border-rose-500/70 rounded-2xl p-5 shadow-2xl space-y-4 text-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400">
                  <Brain className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    KESEHATAN MENTAL & TINGKAT STRES
                  </h3>
                  <span className="text-xs text-slate-400">
                    Status Pemain: {player.name}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Heartbeat Gauge Visual */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-rose-500/10 border border-rose-500/30">
                <HeartCrack className={`w-10 h-10 ${status.color} ${status.heartbeatClass}`} />
              </div>
              <div>
                <span className={`text-3xl font-black font-mono ${status.color}`}>
                  {player.stress}%
                </span>
                <span className={`ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full ${status.bgColor} ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {status.sublabel}
              </p>
            </div>

            {/* Rules explanation */}
            <div className="space-y-2 text-xs">
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 space-y-1.5">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Aturan Krisis Stres 100%:
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Jika indikator stres mencapai <strong className="text-rose-400">100%</strong>, pemain mengalami <em>Mental Breakdown</em> dan otomatis menjalani intervensi psikiater:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>Membayar biaya konsultasi psikolog <strong className="text-amber-300 font-mono">Rp 10.000.000</strong>. Stres turun 20% menjadi 80%.</li>
                  <li>🚨 <strong>PERINGATAN GUGUR</strong>: Jika saldo kas tidak cukup membayar Rp 10 Jt, pemain dinyatakan <strong>bangkrut / tereliminasi langsung</strong>!</li>
                </ul>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1 text-slate-300">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Cara Meredakan Stres:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                  <li>Mendarat di petak <strong className="text-emerald-300">Cuti Rekreasi & Healing (Petak #10)</strong> untuk menurunkan 20% stres.</li>
                  <li>Pilih opsi hidup tenang pada Kartu Takdir (tolak pinjol ilegal dan kerja lembur beracun).</li>
                  <li>Lolos dari intaian KPK dan bayar cicilan utang tepat waktu.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup Status Stres
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================
// 3. POLITICAL INFLUENCE & OLIGARCHY GAUGE
// ==========================================

export interface PoliticalCloutInfo {
  score: number;
  tierTitle: string;
  badgeColor: string;
  bgColor: string;
  canSponsorAny: boolean;
}

export const getPoliticalCloutInfo = (influence: number): PoliticalCloutInfo => {
  if (influence >= 70) {
    return {
      score: influence,
      tierTitle: 'OLIGARKI PARLEMEN',
      badgeColor: 'text-amber-300',
      bgColor: 'bg-amber-500/25',
      canSponsorAny: true,
    };
  }
  if (influence >= 40) {
    return {
      score: influence,
      tierTitle: 'ANGGOTA DEWAN',
      badgeColor: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      canSponsorAny: true,
    };
  }
  if (influence >= 20) {
    return {
      score: influence,
      tierTitle: 'TOKOH ORMAS',
      badgeColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/15',
      canSponsorAny: true,
    };
  }
  return {
    score: influence,
    tierTitle: 'WARGA SIPIL',
    badgeColor: 'text-slate-400',
    bgColor: 'bg-slate-800',
    canSponsorAny: false,
  };
};

interface PoliticalInfluenceProps {
  player: Player;
  variant?: 'hud' | 'card' | 'expanded';
  interactive?: boolean;
}

export const PoliticalInfluenceGauge: React.FC<PoliticalInfluenceProps> = ({
  player,
  variant = 'hud',
  interactive = true
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const clout = getPoliticalCloutInfo(player.politicalInfluence);

  const handleOpenInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (interactive) {
      soundManager.playClick();
      setShowInfo(true);
    }
  };

  return (
    <>
      <div
        onClick={handleOpenInfo}
        className={`
          group relative select-none transition-all
          ${variant === 'hud'
            ? 'w-full min-w-0 flex-1 bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 rounded-xl p-1.5 sm:p-2 cursor-pointer'
            : variant === 'card'
            ? 'w-full bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-xl p-2.5 cursor-pointer'
            : 'w-full bg-slate-950 border border-slate-800 rounded-2xl p-4'
          }
        `}
        title="Klik untuk melihat Hak Mengesahkan RUU di DPR Senayan"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5 gap-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 truncate">
              Politik
            </span>
          </div>

          <div className="flex items-baseline gap-0.5 shrink-0">
            <span className="font-mono text-[11px] sm:text-xs font-black text-amber-300">
              {player.politicalInfluence}
            </span>
            <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono">
              /100
            </span>
          </div>
        </div>

        {/* Progress Bar with Legislative Quorum Markers */}
        <div className="relative w-full h-1.5 sm:h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(4, player.politicalInfluence))}%` }}
          />

          {/* Quorum Markers: 20 (Bansos), 35 (Anti-KPK) */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-300/60 z-10"
            style={{ left: '20%' }}
            title="Kuorum 20 Poin: RUU Bansos / Subsidi UMKM"
          />
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
            style={{ left: '35%' }}
            title="Kuorum 35 Poin: RUU Pelemahan KPK"
          />
        </div>

        {/* Clout Tier Badge */}
        <div className="flex items-center justify-between text-[9px] mt-1">
          <span className={`font-bold font-mono tracking-tight px-1 py-0.2 rounded ${clout.bgColor} ${clout.badgeColor}`}>
            {clout.tierTitle}
          </span>
          <span className="text-slate-500 text-[8px] sm:text-[9px] font-mono">
            {player.politicalInfluence >= 35 ? 'Anti-KPK ✓' : player.politicalInfluence >= 20 ? 'Subsidi ✓' : 'Sipil'}
          </span>
        </div>
      </div>

      {/* Detail Popover */}
      {showInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowInfo(false)}
        >
          <div 
            className="max-w-md w-full bg-slate-900 border-2 border-amber-500/70 rounded-2xl p-5 shadow-2xl space-y-4 text-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    MODAL POLITIK & PENGARUH DEWAN
                  </h3>
                  <span className="text-xs text-slate-400">
                    Status Pemain: {player.name}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Clout Tier */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-2">
              <span className={`text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full ${clout.bgColor} ${clout.badgeColor}`}>
                {clout.tierTitle}
              </span>
              <div>
                <span className="text-3xl font-black font-mono text-amber-400">
                  {player.politicalInfluence}
                </span>
                <span className="text-sm font-mono text-slate-500"> / 100</span>
              </div>
              <p className="text-xs text-slate-300">
                Modal politik digunakan untuk mengesahkan Undang-Undang saat mendarat di <strong>DPR Senayan (Petak #21)</strong>.
              </p>
            </div>

            {/* RUU Quorum Capability */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-amber-300 block">
                Hak Pengesahan RUU Berdasarkan Modal Saat Ini:
              </span>

              <div className="space-y-1.5">
                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${player.politicalInfluence >= 35 ? 'bg-amber-950/30 border-amber-500/50 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  <div className="flex items-center gap-2">
                    {player.politicalInfluence >= 35 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">RUU Pelemahan Wewenang Penyadapan KPK</div>
                      <div className="text-[10px] text-slate-400">Pangkas resiko OTT sebesar 50%</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs">35 Poin</span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${player.politicalInfluence >= 30 ? 'bg-amber-950/30 border-amber-500/50 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  <div className="flex items-center gap-2">
                    {player.politicalInfluence >= 30 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">UU Pajak Progresif Barang Mewah</div>
                      <div className="text-[10px] text-slate-400">Pajaki lawan yang punya &gt;3 aset</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs">30 Poin</span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between ${player.politicalInfluence >= 20 ? 'bg-amber-950/30 border-amber-500/50 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  <div className="flex items-center gap-2">
                    {player.politicalInfluence >= 20 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">UU Subsidi Usaha Mikro & UMKM</div>
                      <div className="text-[10px] text-slate-400">Diskon 50% upgrade properti</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs">20 Poin</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup Rincian Politik
            </button>
          </div>
        </div>
      )}
    </>
  );
};
