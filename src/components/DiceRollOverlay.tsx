import React, { useEffect, useState } from 'react';
import { Player } from '../types/game';
import { soundManager } from '../utils/sound';
import { Sparkles, Dices, FastForward } from 'lucide-react';

interface DiceRollOverlayProps {
  player: Player;
  dice1: number;
  dice2: number;
  total: number;
  onComplete: () => void;
}

// Map face value to dice dots
const renderPips = (value: number) => {
  const dotsMap: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };
  const activeDots = dotsMap[value] || [4];

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full p-2">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {activeDots.includes(i) && (
            <div
              className={`rounded-full transition-transform ${
                value === 1
                  ? 'w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-rose-500 to-rose-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]'
                  : 'w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gradient-to-br from-slate-800 to-slate-950 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Target cube rotations to bring each face forward with natural board tilt
const getTargetRotation = (val: number, dieIndex: number): { x: number; y: number; z: number } => {
  const baseTiltX = 18; // Slight tilt so top and front 3D facets are both visible
  const baseTiltZ = dieIndex === 0 ? -8 : 10; // Natural organic rest tilt

  switch (val) {
    case 1:
      return { x: 0 + baseTiltX, y: 0, z: baseTiltZ };
    case 6:
      return { x: 0 + baseTiltX, y: 180, z: baseTiltZ };
    case 3:
      return { x: 0 + baseTiltX, y: -90, z: baseTiltZ };
    case 4:
      return { x: 0 + baseTiltX, y: 90, z: baseTiltZ };
    case 5:
      return { x: -90 + baseTiltX, y: 0, z: baseTiltZ };
    case 2:
      return { x: 90 + baseTiltX, y: 0, z: baseTiltZ };
    default:
      return { x: baseTiltX, y: 0, z: baseTiltZ };
  }
};

export const DiceRollOverlay: React.FC<DiceRollOverlayProps> = ({
  player,
  dice1,
  dice2,
  total,
  onComplete
}) => {
  const [phase, setPhase] = useState<'ROLLING' | 'LANDED'>('ROLLING');
  const [rollAngles, setRollAngles] = useState({
    d1: { x: 720, y: 1080, z: 360 },
    d2: { x: 1080, y: 720, z: -360 }
  });

  const isDouble = dice1 === dice2;

  // Execute sequence: Roll -> Land -> Complete
  useEffect(() => {
    soundManager.playDiceRoll();

    // Fast rotating frame updates during roll phase
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setRollAngles({
        d1: {
          x: step * 160 + Math.random() * 80,
          y: step * 210 + Math.random() * 90,
          z: step * 110
        },
        d2: {
          x: step * 190 + Math.random() * 90,
          y: step * 140 + Math.random() * 70,
          z: -step * 130
        }
      });
    }, 45);

    // Landing moment at 850ms
    const landTimer = setTimeout(() => {
      clearInterval(interval);
      setPhase('LANDED');
      soundManager.playDiceLand();
    }, 850);

    // Auto-complete at 1450ms
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1450);

    return () => {
      clearInterval(interval);
      clearTimeout(landTimer);
      clearTimeout(completeTimer);
    };
  }, [dice1, dice2, onComplete]);

  // Allow fast forward / skip by clicking
  const handleFastForward = () => {
    if (phase === 'ROLLING') {
      setPhase('LANDED');
      soundManager.playDiceLand();
      setTimeout(onComplete, 400);
    } else {
      onComplete();
    }
  };

  const finalRot1 = getTargetRotation(dice1, 0);
  const finalRot2 = getTargetRotation(dice2, 1);

  const cubeSizeClass = "w-16 h-16 sm:w-20 sm:h-20";
  const halfSizePx = 32; // mobile: 32px, desktop handled smoothly via scale or transform

  return (
    <div
      onClick={handleFastForward}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/85 backdrop-blur-md select-none cursor-pointer transition-all duration-300 animate-in fade-in"
    >
      {/* Background glow effects */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/40 via-transparent to-transparent" 
      />

      {/* Top Banner: Roller identification */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-900/90 border border-slate-700/80 rounded-full shadow-xl mb-4 sm:mb-6 max-w-[90%]">
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base border-2 shadow shrink-0"
          style={{ borderColor: player.color, backgroundColor: `${player.color}25` }}
        >
          <span>{player.avatar}</span>
        </div>
        <div className="truncate">
          <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
            <span>{player.name}</span>
            <span className="text-[10px] text-slate-400 font-normal hidden xs:inline">({player.title})</span>
          </p>
          <p className="text-[10px] sm:text-[11px] text-amber-300 flex items-center gap-1">
            <Dices className={`w-3 h-3 ${phase === 'ROLLING' ? 'animate-spin' : ''}`} />
            <span>{phase === 'ROLLING' ? 'Sedang mengocok dadu...' : 'Dadu telah mendarat!'}</span>
          </p>
        </div>
      </div>

      {/* 3D Dice Stage */}
      <div 
        className="relative z-10 flex items-center justify-center gap-6 sm:gap-10 my-2 sm:my-4"
        style={{ perspective: '1000px' }}
      >
        {/* Die 1 */}
        <div className="relative flex flex-col items-center">
          {/* Die 1 Shadow */}
          <div 
            className={`w-14 sm:w-16 h-3 rounded-full bg-slate-950/80 blur-md transition-all duration-300 ${
              phase === 'ROLLING' ? 'scale-75 opacity-40 translate-y-6' : 'scale-100 opacity-90 translate-y-3'
            }`}
          />

          {/* Die 1 Cube */}
          <div
            className={`relative ${cubeSizeClass} transition-transform ${
              phase === 'LANDED' ? 'duration-500 ease-out' : 'duration-75'
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: phase === 'ROLLING'
                ? `translateY(-20px) rotateX(${rollAngles.d1.x}deg) rotateY(${rollAngles.d1.y}deg) rotateZ(${rollAngles.d1.z}deg)`
                : `translateY(0px) rotateX(${finalRot1.x}deg) rotateY(${finalRot1.y}deg) rotateZ(${finalRot1.z}deg)`
            }}
          >
            {/* Front: Face 1 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `translateZ(${halfSizePx}px)` }}
            >
              {renderPips(1)}
            </div>

            {/* Back: Face 6 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `rotateY(180deg) translateZ(${halfSizePx}px)` }}
            >
              {renderPips(6)}
            </div>

            {/* Right: Face 3 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `rotateY(90deg) translateZ(${halfSizePx}px)` }}
            >
              {renderPips(3)}
            </div>

            {/* Left: Face 4 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `rotateY(-90deg) translateZ(${halfSizePx}px)` }}
            >
              {renderPips(4)}
            </div>

            {/* Top: Face 5 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-150 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `rotateX(90deg) translateZ(${halfSizePx}px)` }}
            >
              {renderPips(5)}
            </div>

            {/* Bottom: Face 2 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `rotateX(-90deg) translateZ(${halfSizePx}px)` }}
            >
              {renderPips(2)}
            </div>
          </div>

          {/* Landing Impact Ring for Die 1 */}
          {phase === 'LANDED' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-amber-400/60 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Die 2 */}
        <div className="relative flex flex-col items-center">
          {/* Die 2 Shadow */}
          <div 
            className={`w-14 sm:w-16 h-3 rounded-full bg-slate-950/80 blur-md transition-all duration-300 ${
              phase === 'ROLLING' ? 'scale-75 opacity-40 translate-y-6' : 'scale-100 opacity-90 translate-y-3'
            }`}
          />

          {/* Die 2 Cube */}
          <div
            className={`relative ${cubeSizeClass} transition-transform ${
              phase === 'LANDED' ? 'duration-500 ease-out' : 'duration-75'
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: phase === 'ROLLING'
                ? `translateY(-24px) rotateX(${rollAngles.d2.x}deg) rotateY(${rollAngles.d2.y}deg) rotateZ(${rollAngles.d2.z}deg)`
                : `translateY(0px) rotateX(${finalRot2.x}deg) rotateY(${finalRot2.y}deg) rotateZ(${finalRot2.z}deg)`
            }}
          >
            {/* Front: Face 1 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `translateZ(${halfSizePx}px)` }}
            >
              {renderPips(1)}
            </div>

            {/* Back: Face 6 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `rotateY(180deg) translateZ(${halfSizePx}px)` }}
            >
              {renderPips(6)}
            </div>

            {/* Right: Face 3 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `rotateY(90deg) translateZ(${halfSizePx}px)` }}
            >
              {renderPips(3)}
            </div>

            {/* Left: Face 4 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `rotateY(-90deg) translateZ(${halfSizePx}px)` }}
            >
              {renderPips(4)}
            </div>

            {/* Top: Face 5 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-150 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `rotateX(90deg) translateZ(${halfSizePx}px)` }}
            >
              {renderPips(5)}
            </div>

            {/* Bottom: Face 2 */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 rounded-xl sm:rounded-2xl border border-slate-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center backface-hidden"
              style={{ transform: `rotateX(-90deg) translateZ(${halfSizePx}px)` }}
            >
              {renderPips(2)}
            </div>
          </div>

          {/* Landing Impact Ring for Die 2 */}
          {phase === 'LANDED' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-amber-400/60 animate-ping pointer-events-none" />
          )}
        </div>
      </div>

      {/* Result Display Banner */}
      <div className="relative z-10 flex flex-col items-center mt-3 sm:mt-5 text-center">
        {phase === 'LANDED' ? (
          <div className="animate-in zoom-in-95 duration-200 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-400/50 px-4 py-2 rounded-2xl shadow-lg backdrop-blur-md">
              <span className="text-sm sm:text-base font-bold text-slate-300">
                {dice1} + {dice2} =
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                {total}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-amber-200 uppercase tracking-wide">
                Langkah
              </span>
            </div>

            {isDouble && (
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-rose-300 bg-rose-950/80 border border-rose-500/70 px-3 py-1 rounded-full shadow-md animate-bounce">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>DADU KEMBAR! (Hoki Melimpah)</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[11px] sm:text-xs text-slate-400 font-medium animate-pulse flex items-center gap-1.5">
            <span>Menggelindingkan dadu di papan...</span>
          </div>
        )}

        {/* Skip hint */}
        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-3 sm:mt-4 hover:text-slate-300 transition-colors">
          <FastForward className="w-3 h-3" />
          <span>Klik di mana saja untuk melewati</span>
        </span>
      </div>
    </div>
  );
};
