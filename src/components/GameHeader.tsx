import React, { useState } from 'react';
import { MacroEconomy, GameMode } from '../types/game';
import { FAST_MODE_MAX_ROUNDS } from '../engine/economy';
import {
  BarChart3,
  Globe,
  LogOut,
  HelpCircle,
  ArrowLeftRight,
  Cloud,
  Zap,
  Volume2,
  VolumeX,
  RotateCcw,
  History,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';

interface GameHeaderProps {
  macro: MacroEconomy;
  monthName: string;
  aliveCount: number;
  totalPlayers: number;
  gameMode: GameMode;
  cycleRound: number;
  onlineRoomCode: string | null;
  isSetupOpen: boolean;
  isGameOver: boolean;
  canTrade: boolean;
  cloudSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  gameSpeed: 1 | 2 | 4;
  isSoundMuted: boolean;
  ambientDescription: string;
  logsCount: number;
  onOpenStats: () => void;
  onOpenOnlineLobby: () => void;
  onLeaveOnlineRoom: () => void;
  onOpenGuide: () => void;
  onOpenTrade: () => void;
  onSaveToCloud: () => void;
  onCycleSpeed: () => void;
  onToggleSound: () => void;
  onRestartNewRound: () => void;
  onOpenLogs: () => void;
}

const cloudLabel: Record<string, string> = {
  idle: 'Simpan',
  saving: 'Menyimpan…',
  saved: 'Tersimpan ✓',
  error: 'Gagal!',
};

const cloudColor: Record<string, string> = {
  idle: 'text-slate-400 hover:text-amber-400',
  saving: 'text-amber-400 animate-pulse',
  saved: 'text-green-400',
  error: 'text-red-400',
};

export const GameHeader: React.FC<GameHeaderProps> = ({
  macro,
  monthName,
  aliveCount,
  totalPlayers,
  gameMode,
  cycleRound,
  onlineRoomCode,
  isSetupOpen,
  isGameOver,
  canTrade,
  cloudSaveStatus,
  gameSpeed,
  isSoundMuted,
  ambientDescription,
  logsCount,
  onOpenStats,
  onOpenOnlineLobby,
  onLeaveOnlineRoom,
  onOpenGuide,
  onOpenTrade,
  onSaveToCloud,
  onCycleSpeed,
  onToggleSound,
  onRestartNewRound,
  onOpenLogs,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const maxRounds = gameMode === 'FAST' ? FAST_MODE_MAX_ROUNDS : '∞';
  const speedLabel = gameSpeed === 1 ? '1×' : gameSpeed === 2 ? '2×' : '4×';

  const inflationHigh = macro.inflationRate >= 8;
  const inflationMed = macro.inflationRate >= 5;

  return (
    <header className="relative bg-slate-900/95 backdrop-blur border-b border-slate-700/60 shadow-lg">
      {/* Desktop header row */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2">
        {/* Left: Branding + round info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-sm font-bold text-amber-400 tracking-tight whitespace-nowrap">
              🏛 Monopoli WNI
            </span>
            {!isSetupOpen && !isGameOver && (
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                Putaran&nbsp;
                <span className="text-amber-300 font-semibold">{cycleRound}</span>
                {typeof maxRounds === 'number' && (
                  <span className="text-slate-500">/{maxRounds}</span>
                )}{' '}
                · {monthName} · {aliveCount}/{totalPlayers} pemain
              </span>
            )}
            {isGameOver && (
              <span className="text-[10px] text-red-400 font-semibold">PERMAINAN SELESAI</span>
            )}
          </div>

          {/* Mode badge */}
          <span
            className={`hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
              gameMode === 'FAST'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
            }`}
          >
            {gameMode === 'FAST' ? 'Cepat' : 'Survival'}
          </span>

          {/* Online badge */}
          {onlineRoomCode && (
            <span className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
              Online #{onlineRoomCode}
            </span>
          )}
        </div>

        {/* Right: Desktop action bar */}
        <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
          <HeaderBtn onClick={onOpenStats} title="Statistik Pemain">
            <BarChart3 size={15} /> Statistik
          </HeaderBtn>

          {onlineRoomCode ? (
            <HeaderBtn onClick={onLeaveOnlineRoom} title="Keluar dari Room Online" variant="danger">
              <LogOut size={15} /> Keluar Room
            </HeaderBtn>
          ) : (
            <HeaderBtn onClick={onOpenOnlineLobby} title="Multiplayer Online">
              <Globe size={15} /> Online
            </HeaderBtn>
          )}

          {canTrade && !isSetupOpen && !isGameOver && (
            <HeaderBtn onClick={onOpenTrade} title="Perdagangan antar pemain">
              <ArrowLeftRight size={15} /> Dagang
            </HeaderBtn>
          )}

          <HeaderBtn onClick={onOpenGuide} title="Panduan Singkat">
            <HelpCircle size={15} /> Panduan
          </HeaderBtn>

          <HeaderBtn
            onClick={onSaveToCloud}
            title={`Simpan ke cloud (${ambientDescription})`}
            className={cloudColor[cloudSaveStatus]}
          >
            <Cloud size={15} /> {cloudLabel[cloudSaveStatus]}
          </HeaderBtn>

          <HeaderBtn onClick={onCycleSpeed} title="Ubah kecepatan permainan">
            <Zap size={15} /> {speedLabel}
          </HeaderBtn>

          <HeaderBtn onClick={onToggleSound} title={isSoundMuted ? 'Aktifkan suara' : 'Bisukan suara'}>
            {isSoundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </HeaderBtn>

          {isGameOver && (
            <HeaderBtn onClick={onRestartNewRound} title="Mulai putaran baru" variant="primary">
              <RotateCcw size={15} /> Putaran Baru
            </HeaderBtn>
          )}

          <HeaderBtn onClick={onOpenLogs} title={`Log permainan (${logsCount} entri)`}>
            <History size={15} /> Log
          </HeaderBtn>

          {/* Macro inflation micro-indicator */}
          <div
            className="flex items-center gap-1 ml-1 px-2 py-1 rounded bg-slate-800/70 border border-slate-700/40"
            title={`Inflasi ${macro.inflationRate.toFixed(1)}% · BI Rate ${macro.biRate.toFixed(2)}%`}
          >
            <ShieldCheck size={13} className={inflationHigh ? 'text-red-400' : inflationMed ? 'text-amber-400' : 'text-green-400'} />
            <span className="text-[10px] text-slate-300 tabular-nums">{macro.inflationRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Mobile compact bar */}
        <div className="flex lg:hidden items-center gap-1 flex-shrink-0">
          {onlineRoomCode && (
            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-purple-500/20 text-purple-300">
              #{onlineRoomCode}
            </span>
          )}
          <button
            onClick={onOpenStats}
            className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            title="Statistik"
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            title={isSoundMuted ? 'Aktifkan suara' : 'Bisukan'}
          >
            {isSoundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile collapsible drawer menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-700/60 bg-slate-900/98 px-3 py-2 grid grid-cols-3 gap-2">
          <DrawerBtn onClick={() => { onOpenStats(); setMobileMenuOpen(false); }}>
            <BarChart3 size={14} /> Statistik
          </DrawerBtn>

          {onlineRoomCode ? (
            <DrawerBtn onClick={() => { onLeaveOnlineRoom(); setMobileMenuOpen(false); }} variant="danger">
              <LogOut size={14} /> Keluar Room
            </DrawerBtn>
          ) : (
            <DrawerBtn onClick={() => { onOpenOnlineLobby(); setMobileMenuOpen(false); }}>
              <Globe size={14} /> Online
            </DrawerBtn>
          )}

          {canTrade && !isSetupOpen && !isGameOver && (
            <DrawerBtn onClick={() => { onOpenTrade(); setMobileMenuOpen(false); }}>
              <ArrowLeftRight size={14} /> Dagang
            </DrawerBtn>
          )}

          <DrawerBtn onClick={() => { onOpenGuide(); setMobileMenuOpen(false); }}>
            <HelpCircle size={14} /> Panduan
          </DrawerBtn>

          <DrawerBtn onClick={() => { onSaveToCloud(); setMobileMenuOpen(false); }}>
            <Cloud size={14} /> {cloudLabel[cloudSaveStatus]}
          </DrawerBtn>

          <DrawerBtn onClick={() => { onCycleSpeed(); }}>
            <Zap size={14} /> Kec. {speedLabel}
          </DrawerBtn>

          <DrawerBtn onClick={() => { onOpenLogs(); setMobileMenuOpen(false); }}>
            <History size={14} /> Log ({logsCount})
          </DrawerBtn>

          {isGameOver && (
            <DrawerBtn onClick={() => { onRestartNewRound(); setMobileMenuOpen(false); }} variant="primary">
              <RotateCcw size={14} /> Putaran Baru
            </DrawerBtn>
          )}
        </div>
      )}
    </header>
  );
};

/* ───── Reusable small sub-components ───── */

interface BtnProps {
  onClick: () => void;
  title?: string;
  className?: string;
  variant?: 'default' | 'primary' | 'danger';
  children: React.ReactNode;
}

const HeaderBtn: React.FC<BtnProps> = ({ onClick, title, className = '', variant = 'default', children }) => {
  const base =
    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap';
  const variants = {
    default: 'text-slate-300 hover:text-amber-400 hover:bg-slate-800',
    primary: 'text-green-300 hover:text-green-200 hover:bg-green-900/40',
    danger: 'text-red-400 hover:text-red-300 hover:bg-red-900/30',
  };
  return (
    <button onClick={onClick} title={title} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const DrawerBtn: React.FC<BtnProps> = ({ onClick, variant = 'default', children }) => {
  const variants = {
    default: 'text-slate-300 bg-slate-800 hover:bg-slate-700',
    primary: 'text-green-300 bg-green-900/40 hover:bg-green-900/60',
    danger: 'text-red-400 bg-red-900/20 hover:bg-red-900/40',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 justify-center px-2 py-1.5 rounded text-xs font-medium transition-colors ${variants[variant]}`}
    >
      {children}
    </button>
  );
};
