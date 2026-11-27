import React, { useState } from 'react';
import {
  ActiveLaw,
  BoardTile,
  GameLogItem,
  MacroEconomy,
  Player,
  PlayerCorruptionHistoryPoint,
} from '../types/game';
import { BANNER_IMAGE, CREST_IMAGE } from '../constants/gameAssets';
import { DiceRollAnimationState } from '../hooks/useBoardMovement';
import { Board } from './Board';
import { PlayerHUD } from './PlayerHUD';
import { MacroIndicator } from './MacroIndicator';
import { CorruptionD3AreaChart } from './CorruptionD3AreaChart';
import { LiveStandingsCard } from './LiveStandingsCard';
import { Map, User, Trophy, TrendingUp, MapPin } from 'lucide-react';

type MobileTab = 'BOARD' | 'HUD' | 'STANDINGS' | 'ECONOMY';

interface MobileGameWorkspaceProps {
  players: Player[];
  activePlayer: Player | null;
  activePlayerIndex: number;
  aliveCount: number;
  perimeterTiles: BoardTile[];
  corruptionTiles: BoardTile[];
  currentLandingTile: BoardTile;
  selectedTile: BoardTile | null;
  macro: MacroEconomy;
  activeLaws: ActiveLaw[];
  cycleRound: number;
  corruptionHistory: PlayerCorruptionHistoryPoint[];
  logs: GameLogItem[];
  hasRolled: boolean;
  isRolling: boolean;
  isMoving: boolean;
  hasRentCrisis: boolean;
  lastRoll: { d1: number; d2: number; total: number } | null;
  diceRollAnimation: DiceRollAnimationState | null;
  onSelectTile: (tile: BoardTile) => void;
  onRollAnimationComplete: () => void;
  onRollDice: (d1: number, d2: number, total: number) => void;
  onBuyProperty: () => void;
  onUpgradeProperty: () => void;
  onEndTurn: () => void;
  onPayJailBribe: () => void;
  onOpenStats: () => void;
  onOpenLogs: () => void;
}

const TREND_LABEL: Record<MacroEconomy['trend'], { text: string; cls: string }> = {
  STABLE: { text: 'Stabil', cls: 'text-emerald-300 bg-emerald-950/70 border-emerald-700/60' },
  RISING: { text: 'Naik', cls: 'text-yellow-300 bg-yellow-950/70 border-yellow-700/60' },
  VOLATILE: { text: 'Gejolak', cls: 'text-amber-300 bg-amber-950/70 border-amber-700/60' },
  CRISIS: { text: 'Krisis', cls: 'text-rose-300 bg-rose-950/80 border-rose-600/80 animate-pulse' },
};

export const MobileGameWorkspace: React.FC<MobileGameWorkspaceProps> = ({
  players,
  activePlayer,
  activePlayerIndex,
  aliveCount,
  perimeterTiles,
  corruptionTiles,
  currentLandingTile,
  selectedTile,
  macro,
  activeLaws,
  cycleRound,
  corruptionHistory,
  logs,
  hasRolled,
  isRolling,
  isMoving,
  hasRentCrisis,
  lastRoll,
  diceRollAnimation,
  onSelectTile,
  onRollAnimationComplete,
  onRollDice,
  onBuyProperty,
  onUpgradeProperty,
  onEndTurn,
  onPayJailBribe,
  onOpenStats,
  onOpenLogs,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('BOARD');
  const trend = TREND_LABEL[macro.trend];

  const tabs: Array<{ id: MobileTab; label: string; icon: React.ReactNode }> = [
    { id: 'BOARD', label: 'Papan', icon: <Map className="w-3.5 h-3.5" /> },
    { id: 'HUD', label: 'Giliran', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'STANDINGS', label: 'Klasemen', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'ECONOMY', label: 'Ekonomi', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="lg:hidden flex flex-col gap-2">
      {/* Compact 1-line Macro Ticker */}
      <button
        type="button"
        onClick={() => setActiveTab('ECONOMY')}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-300 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span>
            Inflasi <strong className="text-amber-300">{macro.inflationRate.toFixed(1)}%</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span>
            BI <strong className="text-sky-300">{macro.biRate.toFixed(2)}%</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span>
            USD <strong className="text-emerald-300">{macro.usdIdrRate.toLocaleString('id-ID')}</strong>
          </span>
        </div>
        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase shrink-0 ${trend.cls}`}>
          {trend.text}
        </span>
      </button>

      {/* 4-Tab Mobile App Bar */}
      <div
        role="tablist"
        aria-label="Navigasi Tampilan Mobile"
        className="grid grid-cols-4 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl"
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[36px] px-1.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Area (Single-Screen App Experience) */}
      {activeTab === 'BOARD' && (
        <div className="space-y-2">
          {activePlayer && (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-mono font-bold text-amber-300 shrink-0">
                  #{currentLandingTile.id}
                </span>
                <span className="text-slate-200 font-semibold truncate">
                  {currentLandingTile.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('HUD')}
                className="text-[10px] font-bold text-sky-400 hover:text-sky-300 shrink-0"
              >
                Detail →
              </button>
            </div>
          )}

          <div className="isolate relative z-0">
            <Board
              perimeterTiles={perimeterTiles}
              corruptionTiles={corruptionTiles}
              players={players}
              activePlayerIndex={activePlayerIndex}
              macro={macro}
              onTileClick={onSelectTile}
              selectedTile={selectedTile}
              bannerImage={BANNER_IMAGE}
              crestImage={CREST_IMAGE}
              diceRollAnimation={diceRollAnimation}
              onRollAnimationComplete={onRollAnimationComplete}
              isMoving={isMoving}
            />
          </div>
        </div>
      )}

      {activeTab === 'HUD' && activePlayer && !activePlayer.isBankrupt && (
        <PlayerHUD
          player={activePlayer}
          currentTile={currentLandingTile}
          hasRolled={hasRolled}
          isRolling={isRolling || isMoving || hasRentCrisis}
          lastRoll={lastRoll}
          macro={macro}
          onRoll={onRollDice}
          onBuyProperty={onBuyProperty}
          onUpgradeProperty={onUpgradeProperty}
          onEndTurn={onEndTurn}
          onPayJailBribe={onPayJailBribe}
        />
      )}

      {activeTab === 'STANDINGS' && (
        <LiveStandingsCard
          players={players}
          activePlayerIndex={activePlayerIndex}
          aliveCount={aliveCount}
          logs={logs}
          onOpenStats={onOpenStats}
          onOpenLogs={onOpenLogs}
        />
      )}

      {activeTab === 'ECONOMY' && (
        <div className="space-y-3">
          <MacroIndicator
            macro={macro}
            activeLaws={activeLaws}
            cycleRound={cycleRound}
            aliveCount={aliveCount}
            totalPlayers={players.length}
          />
          <CorruptionD3AreaChart
            players={players}
            history={corruptionHistory}
            currentRound={cycleRound}
          />
        </div>
      )}
    </div>
  );
};
