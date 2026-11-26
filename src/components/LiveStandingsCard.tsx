import React from 'react';
import { Player, GameLogItem } from '../types/game';
import { formatRupiahShort } from '../utils/format';
import { BarChart3, History, Trophy, Skull } from 'lucide-react';

interface LiveStandingsCardProps {
  players: Player[];
  activePlayerIndex: number;
  aliveCount: number;
  logs: GameLogItem[];
  onOpenStats: () => void;
  onOpenLogs: () => void;
}

export const LiveStandingsCard: React.FC<LiveStandingsCardProps> = ({
  players,
  activePlayerIndex,
  aliveCount,
  logs,
  onOpenStats,
  onOpenLogs,
}) => {
  // Sort: alive first by cash desc, bankrupt last
  const sorted = [...players].sort((a, b) => {
    if (a.isBankrupt !== b.isBankrupt) return a.isBankrupt ? 1 : -1;
    return b.cash - a.cash;
  });

  const recentLogs = logs.slice(-4).reverse();

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Trophy size={13} className="text-amber-400" />
          <span>Klasemen Live</span>
          <span className="text-slate-500 font-normal">· {aliveCount} aktif</span>
        </div>
        <button
          onClick={onOpenStats}
          className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
        >
          <BarChart3 size={11} /> Detail
        </button>
      </div>

      {/* Standings list */}
      <ul className="divide-y divide-slate-700/30">
        {sorted.map((p, rank) => {
          const isActive = players[activePlayerIndex]?.id === p.id;
          return (
            <li
              key={p.id}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                isActive
                  ? 'bg-amber-500/10 border-l-2 border-amber-400'
                  : 'hover:bg-slate-700/30'
              } ${p.isBankrupt ? 'opacity-50' : ''}`}
            >
              <span
                className={`w-4 text-center font-bold ${
                  rank === 0 ? 'text-amber-400' : rank === 1 ? 'text-slate-300' : rank === 2 ? 'text-amber-700' : 'text-slate-500'
                }`}
              >
                {p.isBankrupt ? <Skull size={10} className="text-red-500 mx-auto" /> : `#${rank + 1}`}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className={`flex-1 truncate font-medium ${isActive ? 'text-amber-200' : 'text-slate-200'}`}>
                {p.name}
              </span>
              <span className="text-slate-400 tabular-nums">{formatRupiahShort(p.cash)}</span>
            </li>
          );
        })}
      </ul>

      {/* Activity ticker */}
      {recentLogs.length > 0 && (
        <div className="border-t border-slate-700/50">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              Aktivitas Terkini
            </span>
            <button
              onClick={onOpenLogs}
              className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <History size={10} /> Semua Log
            </button>
          </div>
          <ul className="pb-2 space-y-0.5 px-3">
            {recentLogs.map((log, i) => (
              <li key={i} className="text-[10px] text-slate-400 truncate leading-relaxed">
                <span className="text-slate-600 mr-1">{log.timestamp}</span>
                {log.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
