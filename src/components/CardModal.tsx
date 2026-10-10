import React from 'react';
import { DilemmaCard, Player } from '../types/game';
import { HelpCircle, AlertCircle, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface CardModalProps {
  card: DilemmaCard | null;
  activePlayer: Player;
  onChooseOption: (optionKey: 'optionA' | 'optionB') => void;
  cardImage: string;
}

export const CardModal: React.FC<CardModalProps> = ({
  card,
  activePlayer,
  onChooseOption,
  cardImage
}) => {
  if (!card) return null;

  const handleSelect = (key: 'optionA' | 'optionB') => {
    soundManager.playClick();
    onChooseOption(key);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Draw card pill */}
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono">
          <span className="text-amber-400 font-bold flex items-center gap-1.5">
            <span>🎴</span> KARTU DILEMA DI TARIK DARI DECK
          </span>
          <span className="text-slate-300 font-bold">
            Giliran: {activePlayer.name}
          </span>
        </div>

        {/* Card Header with Thematic Illustration */}
        <div className="relative h-36 bg-slate-950 overflow-hidden border-b border-amber-500/30">
          <img
            src={cardImage}
            alt="Kartu Dilema Konoha"
            className="w-full h-full object-cover opacity-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex items-end p-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  {card.category}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  Ditarik oleh {activePlayer.name}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white leading-tight">
                {card.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Narrative Description */}
        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800 italic">
            "{card.description}"
          </p>

          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold block">
            Tentukan Pilihan Moral & Finansial:
          </span>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option A */}
            <button
              onClick={() => handleSelect('optionA')}
              className="p-3.5 rounded-xl border-2 border-amber-500/60 bg-amber-950/30 hover:bg-amber-900/40 hover:border-amber-400 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-amber-300 uppercase">
                    Opsi A
                  </span>
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h4 className="font-bold text-xs text-white group-hover:text-amber-200">
                  {card.optionA.text}
                </h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                  {card.optionA.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-amber-500/20 text-[10px] font-mono text-amber-300 font-semibold">
                {card.optionA.effectText}
              </div>
            </button>

            {/* Option B */}
            {card.optionB && (
              <button
                onClick={() => handleSelect('optionB')}
                className="p-3.5 rounded-xl border-2 border-sky-500/60 bg-sky-950/30 hover:bg-sky-900/40 hover:border-sky-400 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-sky-300 uppercase">
                      Opsi B
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <h4 className="font-bold text-xs text-white group-hover:text-sky-200">
                    {card.optionB.text}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    {card.optionB.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-sky-500/20 text-[10px] font-mono text-sky-300 font-semibold">
                  {card.optionB.effectText}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
