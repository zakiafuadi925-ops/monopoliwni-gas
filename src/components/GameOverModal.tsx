import React, { useEffect } from 'react';
import { Player, BoardTile, MacroEconomy } from '../types/game';
import { formatRupiah } from '../utils/format';
import { Trophy, RotateCcw, Crown, HeartCrack, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/sound';

interface GameOverModalProps {
  players: Player[];
  tiles: BoardTile[];
  macro: MacroEconomy;
  onRestart: () => void;
  onQuickRestart?: () => void;
  reason: string;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  players,
  tiles,
  macro,
  onRestart,
  onQuickRestart,
  reason
}) => {
  const inflationFactor = 1 + (macro.inflationRate / 100);

  const calculateNetWorth = (p: Player) => {
    let propValuation = 0;
    p.ownedProperties.forEach(tileId => {
      const tile = tiles.find(t => t.id === tileId);
      if (tile && tile.price) {
        const base = tile.price * inflationFactor;
        const upgradeBase = (tile.upgradeCost || 0) * (tile.level ? tile.level - 1 : 0);
        propValuation += base + upgradeBase;
      }
    });
    return Math.round(p.cash + propValuation);
  };

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isBankrupt && !b.isBankrupt) return 1;
    if (!a.isBankrupt && b.isBankrupt) return -1;
    return calculateNetWorth(b) - calculateNetWorth(a);
  });

  const winner = sortedPlayers[0] || players[0];

  useEffect(() => {
    soundManager.playVictory();
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden text-slate-100 text-center p-6 space-y-5">
        <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/30 rounded-full mx-auto">
          <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
        </div>

        <div>
          <span className="text-xs font-mono uppercase font-bold text-amber-400 tracking-widest block">
            PERTARUNGAN SELESAI · SURVIVAL KONOHA
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            KEMENANGAN SEJATI!
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
            {reason}
          </p>
        </div>

        {/* Winner Highlight */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-2 border-amber-500/70 rounded-2xl p-4">
          <Crown className="w-6 h-6 text-amber-400 mx-auto mb-1" />
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
            Sang Penyintas Terkuat (The Ultimate Survivor):
          </span>
          <h3 className="text-xl font-extrabold text-white mt-1 flex items-center justify-center gap-2">
            <span>{winner?.avatar || '👑'}</span>
            <span>{winner?.name || 'Pemenang'}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {winner?.title || 'Penyintas Tangguh'}
          </p>
          <div className="text-lg font-mono font-black text-emerald-400 mt-2">
            Kekayaan Akhir: {formatRupiah(winner ? calculateNetWorth(winner) : 0)}
          </div>
        </div>

        {/* Final Standings Table */}
        <div className="space-y-2 text-left">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Papan Klasemen Akhir:
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-slate-500 w-4">
                    #{idx + 1}
                  </span>
                  <span>{p.avatar}</span>
                  <div>
                    <span className="font-bold text-white block">
                      {p.name} {p.isBankrupt && '(Bangkrut)'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Stres: {p.stress}% · Politik: {p.politicalInfluence} · Radar KPK: {p.kpkSuspicionLevel}%
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400">
                    {formatRupiah(calculateNetWorth(p))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons: Main Babak Baru & Quick Restart */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {onQuickRestart && (
            <button
              onClick={onQuickRestart}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Main Lagi Cepat</span>
            </button>
          )}
          <button
            onClick={onRestart}
            className={`py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${!onQuickRestart ? 'w-full' : ''}`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Babak Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
