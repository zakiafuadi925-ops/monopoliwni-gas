import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '../types/game';
import { formatRupiahShort } from '../utils/format';

interface PlayerTokenProps {
  player: Player;
  isActive?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const PlayerToken: React.FC<PlayerTokenProps> = ({
  player,
  isActive = false,
  size = 'sm',
  showTooltip = true,
}) => {
  // Extract clean short player identifier: P1, P2, P3, or initials
  const playerTag = player.id.startsWith('player_')
    ? `P${player.id.replace('player_', '')}`
    : player.name.slice(0, 2).toUpperCase();

  // Dimension tokens based on size with enhanced clarity
  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-xs sm:text-sm',
    md: 'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-sm sm:text-base',
    lg: 'w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-base sm:text-xl',
  }[size];

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Active Turn Floating Beacon Arrow (Above Pawn) */}
      {isActive && size !== 'xs' && (
        <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-40 animate-bounce">
          <span 
            className="px-1.5 py-0.2 rounded-full text-[7px] sm:text-[8px] font-black tracking-wider uppercase text-white shadow-[0_2px_8px_rgba(0,0,0,0.8)] border border-white/60 whitespace-nowrap flex items-center gap-1"
            style={{ backgroundColor: player.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>GILIRAN</span>
          </span>
          <div 
            className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4px] shadow-sm -mt-0.5"
            style={{ borderTopColor: player.color }}
          />
        </div>
      )}

      <motion.div
        layoutId={`player-token-${player.id}`}
        layout="position"
        transition={{
          type: 'spring',
          stiffness: 340,
          damping: 24,
          mass: 0.75,
        }}
        initial={false}
        animate={{
          scale: isActive ? 1.15 : 1,
          y: isActive ? -4 : 0,
        }}
        whileHover={{
          scale: 1.35,
          zIndex: 50,
          transition: { duration: 0.15 },
        }}
        whileTap={{
          scale: 0.95,
        }}
        className={`relative group rounded-full flex items-center justify-center font-bold select-none cursor-pointer transition-all ${sizeClasses} ${
          isActive ? 'z-20 ring-2 ring-white/90 ring-offset-1 ring-offset-slate-950' : 'z-10'
        }`}
        style={{
          backgroundColor: '#0f172a',
          borderColor: player.color,
          borderWidth: size === 'xs' ? '1.5px' : '2.5px',
          borderStyle: 'solid',
          boxShadow: isActive
            ? `0 0 16px ${player.color}, 0 0 6px #ffffff, 0 4px 10px rgba(0,0,0,0.8)`
            : `0 0 8px ${player.color}90, 0 2px 4px rgba(0,0,0,0.6)`,
        }}
      >
        {/* 3D Gloss / Shine Overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-white/40 pointer-events-none" />

        {/* Active Player Dual Pulsing Rings */}
        {isActive && (
          <>
            <span
              className="absolute -inset-1.5 rounded-full animate-ping opacity-60 pointer-events-none"
              style={{ backgroundColor: player.color }}
            />
            <span
              className="absolute -inset-0.5 rounded-full animate-pulse border-2 pointer-events-none"
              style={{ borderColor: player.color }}
            />
          </>
        )}

        {/* Pawn Avatar */}
        <span className="relative z-10 drop-shadow-sm leading-none flex items-center justify-center">
          {player.avatar}
        </span>

        {/* Always-Visible Player Tag Badge (e.g., P1, P2) */}
        <span 
          className="absolute -bottom-1 -right-1 text-[7px] sm:text-[8px] font-black font-mono text-white px-1 py-0 rounded-full border border-slate-950 shadow-md leading-tight pointer-events-none z-20"
          style={{ backgroundColor: player.color }}
          title={`Pemain: ${player.name} (${playerTag})`}
        >
          {playerTag}
        </span>

        {/* Jail Indicator Badge */}
        {player.inJail && (
          <span 
            className="absolute -top-1.5 -left-1.5 text-[7px] bg-rose-950 text-rose-300 border border-rose-500 rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold shadow-md z-20"
            title={`Di Sel Lapas (${player.jailTurnsLeft} giliran tersisa)`}
          >
            🔒
          </span>
        )}

        {/* High KPK Danger Flash Indicator */}
        {player.kpkSuspicionLevel > 60 && !player.inJail && (
          <span 
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white animate-ping z-20"
            title={`Radar KPK Tinggi: ${player.kpkSuspicionLevel}%`}
          />
        )}

        {/* Hover / Active Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 transform group-hover:translate-y-0 translate-y-1 z-50 whitespace-nowrap">
            <div
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-2xl flex flex-col items-center gap-0.5 backdrop-blur-md border border-white/30"
              style={{ backgroundColor: `${player.color}ee` }}
            >
              <div className="flex items-center gap-1">
                <span>{player.avatar}</span>
                <span className="font-extrabold">{player.name}</span>
                <span className="bg-black/40 px-1 rounded text-[8px] font-mono">[{playerTag}]</span>
                {isActive && <span className="bg-white/30 px-1 rounded text-[8px]">Giliran</span>}
              </div>
              <div className="flex items-center gap-2 text-[9px] text-white/90 font-mono">
                <span>Kas: {formatRupiahShort(player.cash)}</span>
                <span>·</span>
                <span>Stres: {player.stress}%</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
