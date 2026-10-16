import React from 'react';
import { ShieldAlert, Radio, AlertOctagon, Zap } from 'lucide-react';
import { Player } from '../types/game';

interface CorruptionRadarScanProps {
  player?: Player | null;
  suspicionLevel?: number;
  variant?: 'board-panel' | 'modal' | 'banner' | 'compact';
  currentTileId?: number;
  className?: string;
  showTelemetry?: boolean;
}

/**
 * Calculates rotation sweep duration (in seconds) based on KPK suspicion level (0-100).
 * Lower suspicion = slower, calm rotation (~5.5s)
 * Higher suspicion = faster, frantic emergency rotation (~0.75s)
 */
export const calculateRadarSweepDuration = (suspicion: number): number => {
  const clamped = Math.max(0, Math.min(100, suspicion));
  // Non-linear acceleration: starts at 5.5s and rapidly drops towards 0.75s at 100%
  const duration = 5.5 - Math.pow(clamped / 100, 1.15) * 4.75;
  return Number(Math.max(0.65, duration).toFixed(2));
};

export const getRadarThreatInfo = (suspicion: number) => {
  if (suspicion >= 80) {
    return {
      code: 'SIAGA 1 · CRITICAL',
      label: 'TARGET OTT BUST AKTIF',
      color: 'rose',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500',
      bgColor: 'bg-rose-950/80',
      glowColor: 'rgba(244, 63, 94, 0.7)',
      lineColor: '#f43f5e',
      sweepGradient: 'conic-gradient(from 0deg, rgba(244, 63, 94, 0.75) 0deg, rgba(244, 63, 94, 0.35) 35deg, rgba(244, 63, 94, 0.08) 65deg, transparent 70deg)',
      interceptorDistance: '0.4 KM (MENGEPUNG)',
      advice: 'HINDARI DADU RENDAH! TIM OTT KPK SUDAH DI LOKASI!'
    };
  }
  if (suspicion >= 55) {
    return {
      code: 'SIAGA 2 · HIGH ALERT',
      label: 'PENYADAPAN TELEPON AKTIF',
      color: 'orange',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500',
      bgColor: 'bg-orange-950/70',
      glowColor: 'rgba(249, 115, 22, 0.6)',
      lineColor: '#f97316',
      sweepGradient: 'conic-gradient(from 0deg, rgba(249, 115, 22, 0.65) 0deg, rgba(249, 115, 22, 0.28) 35deg, rgba(249, 115, 22, 0.05) 60deg, transparent 65deg)',
      interceptorDistance: '1.8 KM (MENDEKAT)',
      advice: 'Sinyal terdeteksi! Dadu 1-4 akan memicu OTT!'
    };
  }
  if (suspicion >= 30) {
    return {
      code: 'SIAGA 3 · ELEVATED',
      label: 'SURVEILANS SIBER & REKENING',
      color: 'amber',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500',
      bgColor: 'bg-amber-950/60',
      glowColor: 'rgba(245, 158, 11, 0.5)',
      lineColor: '#f59e0b',
      sweepGradient: 'conic-gradient(from 0deg, rgba(245, 158, 11, 0.55) 0deg, rgba(245, 158, 11, 0.2) 30deg, rgba(245, 158, 11, 0.04) 55deg, transparent 60deg)',
      interceptorDistance: '4.5 KM (PATROLI)',
      advice: 'Transaksi mencurigakan tercatat di sistem audit PPATK.'
    };
  }
  return {
    code: 'SIAGA 4 · ROUTINE',
    label: 'PATROLI RUTIN INTELIJEN',
    color: 'emerald',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/70',
    bgColor: 'bg-emerald-950/40',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    lineColor: '#10b981',
    sweepGradient: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.45) 0deg, rgba(16, 185, 129, 0.15) 30deg, rgba(16, 185, 129, 0.02) 50deg, transparent 55deg)',
    interceptorDistance: '8.2 KM (JARAK AMAN)',
    advice: 'Pengawasan BPK minimal, laju penyisiran stabil.'
  };
};

export const CorruptionRadarScan: React.FC<CorruptionRadarScanProps> = ({
  player,
  suspicionLevel,
  variant = 'board-panel',
  currentTileId,
  className = '',
  showTelemetry = true
}) => {
  const actualSuspicion = suspicionLevel ?? player?.kpkSuspicionLevel ?? 20;
  const sweepDuration = calculateRadarSweepDuration(actualSuspicion);
  const rpm = Math.round(60 / sweepDuration);
  const threat = getRadarThreatInfo(actualSuspicion);
  const isHighDanger = actualSuspicion >= 60;

  // Banner variant: horizontal high-tech strip displayed when active player is inside the corruption route
  if (variant === 'banner') {
    return (
      <div 
        className={`w-full relative overflow-hidden rounded-xl border px-3 py-2 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md transition-all ${threat.borderColor} ${threat.bgColor} ${className}`}
        style={{
          boxShadow: `0 0 20px ${threat.glowColor}`
        }}
      >
        {/* Background glowing sweep line subtle accent */}
        <div className="flex items-center gap-2.5">
          {/* Mini Rotating Radar Scope */}
          <div className="relative w-9 h-9 rounded-full border border-slate-700 bg-slate-950/90 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
            {/* Grid concentric rings */}
            <div className="absolute inset-1 rounded-full border border-slate-700/60" />
            <div className="absolute inset-2.5 rounded-full border border-slate-800" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700/50 -translate-y-1/2" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700/50 -translate-x-1/2" />

            {/* Rotating Sweep Beam */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: threat.sweepGradient,
                animation: `radar-sweep ${sweepDuration}s linear infinite`,
                transformOrigin: 'center center'
              }}
            >
              {/* Leading beam line */}
              <div 
                className="absolute top-0 left-1/2 w-0.5 h-1/2 -translate-x-1/2"
                style={{
                  backgroundColor: threat.lineColor,
                  boxShadow: `0 0 6px ${threat.lineColor}`
                }}
              />
            </div>

            {/* Center target dot */}
            <div 
              className="relative z-10 w-1.5 h-1.5 rounded-full animate-ping"
              style={{ backgroundColor: threat.lineColor }}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-mono font-black uppercase tracking-wider ${threat.textColor}`}>
                {threat.code}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/80 border border-slate-800 text-slate-300 font-mono">
                {actualSuspicion}% KPK
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                · {rpm} RPM ({sweepDuration}s/putaran)
              </span>
            </div>
            <p className="text-[11px] font-bold text-white truncate flex items-center gap-1">
              <Radio className={`w-3 h-3 ${isHighDanger ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
              <span>RADAR PENYADAPAN SIBER KPK AKTIF DI RUTE KORUPSI!</span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
          <span className="text-[10px] font-mono font-bold text-slate-300">
            ARMADA PENYIDIK: <span className={threat.textColor}>{threat.interceptorDistance}</span>
          </span>
          <span className="text-[9px] text-slate-400 font-sans">
            {isHighDanger ? 'Hukuman Berat Menanti Jika Tertangkap!' : 'Waspada Sidak BPK & OTT'}
          </span>
        </div>
      </div>
    );
  }

  // Modal variant: focused tactical radar display inside Corruption modals (Gate & Audit)
  if (variant === 'modal') {
    return (
      <div className={`relative flex flex-col items-center justify-center p-3 bg-slate-950/90 rounded-2xl border ${threat.borderColor} shadow-2xl overflow-hidden ${className}`}>
        {/* Radar Circular Bezel */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 border-slate-700 bg-slate-950 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center">
          
          {/* Radial Grid Lines (Azimuth) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-full h-px bg-slate-600" />
            <div className="h-full w-px bg-slate-600 absolute" />
            <div className="w-full h-px bg-slate-700 absolute rotate-45" />
            <div className="w-full h-px bg-slate-700 absolute -rotate-45" />
          </div>

          {/* Concentric Range Rings */}
          <div className="absolute inset-4 rounded-full border border-slate-700/70 border-dashed pointer-events-none" />
          <div className="absolute inset-10 rounded-full border border-slate-700/80 pointer-events-none" />
          <div className="absolute inset-16 sm:inset-20 rounded-full border border-slate-800 pointer-events-none" />
          <div className="absolute inset-24 sm:inset-28 rounded-full border border-slate-800/60 pointer-events-none" />

          {/* Compass labels */}
          <span className="absolute top-1 text-[8px] font-mono font-bold text-slate-500">000° UTARA</span>
          <span className="absolute bottom-1 text-[8px] font-mono font-bold text-slate-500">180° SELATAN</span>
          <span className="absolute left-1 text-[8px] font-mono font-bold text-slate-500">270°</span>
          <span className="absolute right-1 text-[8px] font-mono font-bold text-slate-500">090°</span>

          {/* Range Labels */}
          <span className="absolute top-8 right-12 text-[7px] font-mono text-slate-500">15 KM</span>
          <span className="absolute top-14 right-16 text-[7px] font-mono text-slate-500">5 KM</span>

          {/* THE ROTATING RADAR SWEEP LINE (Core Requested Effect) */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: threat.sweepGradient,
              animation: `radar-sweep ${sweepDuration}s linear infinite`,
              transformOrigin: 'center center'
            }}
          >
            {/* The sharp leading ray line with high-glow phosphor drop shadow */}
            <div
              className="absolute top-0 left-1/2 w-[2px] h-1/2 -translate-x-1/2"
              style={{
                backgroundColor: threat.lineColor,
                boxShadow: `0 0 10px ${threat.lineColor}, 0 0 20px ${threat.lineColor}`
              }}
            />
          </div>

          {/* Player Position Blip */}
          <div className="absolute top-[42%] left-[54%] z-20 flex flex-col items-center pointer-events-none">
            <span 
              className="w-3 h-3 rounded-full animate-ping opacity-75"
              style={{ backgroundColor: threat.lineColor }}
            />
            <span 
              className="w-2.5 h-2.5 rounded-full -mt-2.5 border border-white"
              style={{ backgroundColor: threat.lineColor }}
            />
            <span className="text-[8px] font-mono font-bold text-white bg-slate-900/90 px-1 rounded border border-slate-700 mt-0.5 shadow">
              {player ? player.name.split(' ')[0] : 'TARGET'}
            </span>
          </div>

          {/* KPK Interceptor Blips (Closing In) */}
          <div 
            className="absolute z-10 flex items-center gap-1 pointer-events-none transition-all duration-1000"
            style={{
              top: actualSuspicion > 60 ? '38%' : '20%',
              left: actualSuspicion > 60 ? '46%' : '25%'
            }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border border-rose-300" />
            </span>
            <span className="text-[7px] font-mono font-extrabold text-rose-300 bg-black/80 px-1 py-0.2 rounded border border-rose-800">
              KPK UNIT #{actualSuspicion > 60 ? '01 (OTT)' : '04'}
            </span>
          </div>

          {/* Center Hub */}
          <div className="relative z-10 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]" />
        </div>

        {/* Tactical Telemetry Readout */}
        <div className="w-full mt-3 grid grid-cols-2 gap-2 text-left">
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2">
            <span className="text-[9px] font-mono text-slate-400 block uppercase">KECEPATAN RADAR</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-sm font-mono font-extrabold ${threat.textColor}`}>
                {rpm} RPM
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({sweepDuration}s/putaran)
              </span>
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              {actualSuspicion >= 60 ? '⚡ Mempercepat (Radar Tinggi)' : '🔄 Kecepatan Normal'}
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2">
            <span className="text-[9px] font-mono text-slate-400 block uppercase">STATUS PENYADAPAN</span>
            <div className={`text-xs font-bold font-mono mt-0.5 ${threat.textColor} truncate`}>
              {threat.code}
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              Jarak: {threat.interceptorDistance}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Embedded board-panel variant: Renders directly around the Rute Korupsi tiles in Board.tsx
  return (
    <div 
      className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 ${threat.borderColor} ${threat.bgColor} ${className}`}
      style={{
        boxShadow: isHighDanger ? `0 0 25px ${threat.glowColor}` : 'none'
      }}
    >
      {/* Background Decorative Radar Grid & Sweeper Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 sm:opacity-40">
        {/* Full-width Radar Grid SVG */}
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`radar-grid-${actualSuspicion}`} width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-600/40" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#radar-grid-${actualSuspicion})`} />
        </svg>

        {/* Ambient Center Radar Circle & Sweeper Line */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-slate-600/50 flex items-center justify-center">
          <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-full border border-slate-600/30 border-dashed" />
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-slate-700/50" />
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-slate-800" />
          
          {/* ROTATING RADAR SWEEP LINE */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: threat.sweepGradient,
              animation: `radar-sweep ${sweepDuration}s linear infinite`,
              transformOrigin: 'center center'
            }}
          >
            {/* The sharp ray edge */}
            <div 
              className="absolute top-0 left-1/2 w-0.5 h-1/2 -translate-x-1/2"
              style={{
                backgroundColor: threat.lineColor,
                boxShadow: `0 0 8px ${threat.lineColor}`
              }}
            />
          </div>
        </div>
      </div>

      {/* Header telemetry bar */}
      <div className="relative z-10 flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Mini live rotating icon */}
          <div className="relative w-4 h-4 rounded-full border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: threat.sweepGradient,
                animation: `radar-sweep ${sweepDuration}s linear infinite`,
                transformOrigin: 'center center'
              }}
            />
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: threat.lineColor }} />
          </div>

          <span className="text-[9px] sm:text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1 truncate">
            <span>RUTE KORUPSI (JALUR TIKUS)</span>
            <span className="text-slate-500">·</span>
            <span className={`font-mono text-[8px] sm:text-[10px] ${threat.textColor}`}>
              RADAR KPK {actualSuspicion}%
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[8px] sm:text-[9px] font-mono">
            <Zap className={`w-2.5 h-2.5 ${threat.textColor} ${isHighDanger ? 'animate-pulse' : ''}`} />
            <span className={threat.textColor}>{rpm} RPM</span>
            <span className="text-slate-400 hidden xs:inline">({sweepDuration}s/rot)</span>
          </div>

          <span className={`text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${threat.bgColor} border ${threat.borderColor} ${threat.textColor}`}>
            {threat.code.split(' · ')[0]}
          </span>
        </div>
      </div>

      {/* High Danger Strobe Banner when suspicion is high */}
      {isHighDanger && (
        <div className="relative z-10 bg-rose-950/90 border-b border-rose-600/80 px-2 py-1 flex items-center justify-between gap-1 text-[8px] sm:text-[10px] text-rose-200 font-mono">
          <div className="flex items-center gap-1 animate-pulse">
            <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="font-bold">PERINGATAN: RADAR PENYISIRAN KPK MEMPERCEPAT!</span>
          </div>
          <span className="text-rose-400 font-extrabold hidden sm:inline">
            HUKUMAN OTT: SITA 80% KAS & 4 PUTARAN PENJARA!
          </span>
        </div>
      )}
    </div>
  );
};
