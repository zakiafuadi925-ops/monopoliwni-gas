import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '../types/game';

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
  // Dimension tokens based on size
  const sizeClasses = {
    xs: 'w-3.5 h-3.5 text-[8px]',
    sm: 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[9px] sm:text-xs',
    md: 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-xs sm:text-sm',
    lg: 'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-sm sm:text-base',
  }[size];

  return (
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
        scale: isActive ? [1, 1.22, 1.15] : 1,
        y: isActive ? [0, -4, 0] : 0,
      }}
      whileHover={{
        scale: 1.35,
        zIndex: 50,
        transition: { duration: 0.15 },
      }}
      whileTap={{
        scale: 0.95,
      }}
      className={`relative group rounded-full flex items-center justify-center font-bold select-none cursor-pointer transition-shadow ${sizeClasses} ${
        isActive ? 'z-20' : 'z-10'
      }`}
      style={{
        backgroundColor: '#0f172a',
        borderColor: player.color,
        borderWidth: size === 'xs' ? '1px' : '2px',
        borderStyle: 'solid',
        boxShadow: isActive
          ? `0 0 12px ${player.color}, 0 4px 8px rgba(0,0,0,0.6)`
          : `0 0 6px ${player.color}70, 0 2px 4px rgba(0,0,0,0.5)`,
      }}
    >
      {/* 3D Gloss / Shine Overlay */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/15 to-white/30 pointer-events-none" />

      {/* Active Player Radial Pulsing Ping */}
      {isActive && (
        <span
          className="absolute -inset-1 rounded-full animate-ping opacity-40 pointer-events-none"
          style={{ backgroundColor: player.color }}
        />
      )}

      {/* Pawn Avatar */}
      <span className="relative z-10 drop-shadow-sm leading-none flex items-center justify-center">
        {player.avatar}
      </span>

      {/* Hover / Active Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 transform group-hover:translate-y-0 translate-y-1 z-50 whitespace-nowrap">
          <div
            className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white shadow-xl flex items-center gap-1 backdrop-blur-md border border-white/20"
            style={{ backgroundColor: `${player.color}dd` }}
          >
            <span>{player.avatar}</span>
            <span>{player.name}</span>
            {isActive && <span className="text-[8px] bg-white/30 px-1 rounded">Giliran</span>}
          </div>
        </div>
      )}
    </motion.div>
  );
};
