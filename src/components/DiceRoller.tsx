import React, { useState } from 'react';
import { Dices, RotateCcw } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface DiceRollerProps {
  onRoll: (dice1: number, dice2: number, total: number) => void;
  isRolling: boolean;
  disabled: boolean;
  lastRoll: { d1: number; d2: number; total: number } | null;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  onRoll,
  isRolling,
  disabled,
  lastRoll
}) => {
  const [animating, setAnimating] = useState(false);
  const [displayD1, setDisplayD1] = useState(lastRoll?.d1 || 3);
  const [displayD2, setDisplayD2] = useState(lastRoll?.d2 || 4);

  const handleRollClick = () => {
    if (disabled || isRolling || animating) return;

    soundManager.playDiceRoll();
    setAnimating(true);

    let counter = 0;
    const interval = setInterval(() => {
      setDisplayD1(Math.floor(Math.random() * 6) + 1);
      setDisplayD2(Math.floor(Math.random() * 6) + 1);
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        const finalD1 = Math.floor(Math.random() * 6) + 1;
        const finalD2 = Math.floor(Math.random() * 6) + 1;
        setDisplayD1(finalD1);
        setDisplayD2(finalD2);
        setAnimating(false);
        onRoll(finalD1, finalD2, finalD1 + finalD2);
      }
    }, 50);
  };

  // Dice dot renderer
  const renderDiceFace = (val: number) => {
    const dotsMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };
    const activeDots = dotsMap[val] || [4];

    return (
      <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-10 h-10 p-1.5 bg-slate-100 rounded-xl shadow-inner border border-slate-300">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {activeDots.includes(i) && (
              <div className="w-2 h-2 rounded-full bg-slate-900" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-md">
      {/* Dice Faces */}
      <div className={`flex items-center gap-2 transition-transform duration-200 ${animating ? 'scale-110 rotate-6' : ''}`}>
        {renderDiceFace(displayD1)}
        {renderDiceFace(displayD2)}
      </div>

      <div className="flex flex-col">
        <button
          onClick={handleRollClick}
          disabled={disabled || isRolling || animating}
          className={`
            min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md
            ${disabled || isRolling || animating
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40 cursor-pointer active:scale-95'
            }
          `}
        >
          <Dices className={`w-4 h-4 ${animating ? 'animate-spin' : ''}`} />
          <span>{animating ? 'Mengocok...' : 'Kocok Dadu'}</span>
        </button>

        {lastRoll && (
          <span className="text-[10px] text-slate-400 font-mono mt-1 text-center">
            Hasil: {lastRoll.d1} + {lastRoll.d2} = <strong className="text-amber-300">{lastRoll.total}</strong>
            {lastRoll.d1 === lastRoll.d2 && ' (Dadu Kembar!)'}
          </span>
        )}
      </div>
    </div>
  );
};
