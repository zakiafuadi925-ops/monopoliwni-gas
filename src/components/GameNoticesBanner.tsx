import React from 'react';
import { Player } from '../types/game';
import { SeasonalEvent } from '../engine/seasonalEvents';
import { formatRupiah } from '../utils/format';
import { X, Skull, AlertTriangle, CalendarDays, Wifi } from 'lucide-react';

export interface EliminationNotice {
  player: Player;
  cause: string;
  remainingCount: number;
}

export interface PsychologistNotice {
  player: Player;
  fee: number;
  oldStress: number;
  newStress: number;
}

export interface MonthNotice {
  monthName: string;
  monthIndex: number;
  year: number;
  round: number;
  seasonalEvent?: SeasonalEvent;
}

interface GameNoticesBannerProps {
  eliminationNotice: EliminationNotice | null;
  onDismissElimination: () => void;
  psychologistNotice: PsychologistNotice | null;
  onDismissPsychologist: () => void;
  monthNotice: MonthNotice | null;
  onDismissMonth: () => void;
  onlineRoomCode: string | null;
  activePlayer: Player | null;
  clientId: string | null;
  isGameOver: boolean;
}

export const GameNoticesBanner: React.FC<GameNoticesBannerProps> = ({
  eliminationNotice,
  onDismissElimination,
  psychologistNotice,
  onDismissPsychologist,
  monthNotice,
  onDismissMonth,
  onlineRoomCode,
  activePlayer,
  clientId,
  isGameOver,
}) => {
  const isOtherPlayerTurn =
    Boolean(onlineRoomCode) &&
    activePlayer != null &&
    clientId != null &&
    activePlayer.id !== clientId;

  return (
    <div className="space-y-2">
      {/* Pemain Dieliminasi */}
      {eliminationNotice && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/70 border border-red-700/60 text-red-200 text-xs sm:text-sm shadow-lg">
          <Skull size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-red-100">{eliminationNotice.player.name}</span>{' '}
            <span>dieliminasi ({eliminationNotice.cause}).</span>{' '}
            <span className="text-red-300/80">Sisa {eliminationNotice.remainingCount} pemain aktif.</span>
          </div>
          <button
            onClick={onDismissElimination}
            className="flex-shrink-0 p-0.5 text-red-400 hover:text-red-200 transition-colors"
            aria-label="Tutup"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Psikolog / Stres */}
      {psychologistNotice && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-950/70 border border-purple-700/60 text-purple-200 text-xs sm:text-sm shadow-lg">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-purple-400" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-purple-100">{psychologistNotice.player.name}</span>{' '}
            <span>konsultasi psikolog (biaya {formatRupiah(psychologistNotice.fee)}).</span>{' '}
            <span className="text-purple-300/90">
              Stres turun: {psychologistNotice.oldStress}% → {psychologistNotice.newStress}%
            </span>
          </div>
          <button
            onClick={onDismissPsychologist}
            className="flex-shrink-0 p-0.5 text-purple-400 hover:text-purple-200 transition-colors"
            aria-label="Tutup"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Pergantian Bulan */}
      {monthNotice && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-teal-950/70 border border-teal-700/60 text-teal-200 text-xs sm:text-sm shadow-lg">
          <CalendarDays size={16} className="mt-0.5 flex-shrink-0 text-teal-400" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-teal-100">
              {monthNotice.monthName} {monthNotice.year}
            </span>{' '}
            <span className="text-teal-300/80">(Putaran #{monthNotice.round})</span>
            {monthNotice.seasonalEvent && (
              <span className="block sm:inline sm:ml-2 text-amber-300 font-medium">
                • {monthNotice.seasonalEvent.title}: {monthNotice.seasonalEvent.description}
              </span>
            )}
          </div>
          <button
            onClick={onDismissMonth}
            className="flex-shrink-0 p-0.5 text-teal-400 hover:text-teal-200 transition-colors"
            aria-label="Tutup"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Giliran Pemain Online Lain */}
      {isOtherPlayerTurn && !isGameOver && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-950/70 border border-indigo-700/60 text-indigo-200 text-xs sm:text-sm shadow animate-pulse">
          <Wifi size={16} className="flex-shrink-0 text-indigo-400" />
          <span>
            Menunggu giliran{' '}
            <span className="font-semibold text-indigo-100">
              {activePlayer?.name ?? 'pemain lain'}
            </span>
            …
          </span>
        </div>
      )}
    </div>
  );
};
