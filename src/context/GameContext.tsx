import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { CORRUPTION_ROUTE_TILES, PERIMETER_TILES } from '../data/tiles';
import { LUXURY_BOARD_TILES } from '../data/luxuryProperties';
import { SavedGameSnapshot } from '../engine/persistence';
import {
  ActiveLaw,
  BoardTile,
  GameLogItem,
  MacroEconomy,
  MacroHistoryPoint,
  Player,
  PlayerCorruptionHistoryPoint
} from '../types/game';

export const INITIAL_MACRO_STATE: MacroEconomy = {
  inflationRate: 5.2,
  biRate: 6.25,
  usdIdrRate: 16350,
  trend: 'STABLE',
  monthIndex: 1,
  weekIndex: 1,
  year: 2026,
  activeKonohaBuffs: []
};

export const INITIAL_MACRO_HISTORY: MacroHistoryPoint[] = [
  {
    round: 0,
    label: "Q3 '25",
    fullPeriod: 'Kuartal 3 2025 (Historis Pra-Game)',
    inflationRate: 4.2,
    usdIdrRate: 15950,
    biRate: 6.0,
    trend: 'STABLE',
    note: 'Stabilitas Moneter Awal'
  },
  {
    round: 0,
    label: "Q4 '25",
    fullPeriod: 'Kuartal 4 2025 (Historis Pra-Game)',
    inflationRate: 4.8,
    usdIdrRate: 16180,
    biRate: 6.0,
    trend: 'RISING',
    note: 'Peningkatan Belanja Konsumsi'
  },
  {
    round: 1,
    label: 'P1',
    fullPeriod: 'Putaran 1 · Jan 2026 (W1)',
    inflationRate: 5.2,
    usdIdrRate: 16350,
    biRate: 6.25,
    trend: 'STABLE',
    note: 'Awal Permainan'
  }
];

export const createInitialCorruptionHistory = (
  playersList: Player[]
): PlayerCorruptionHistoryPoint[] => [
  {
    round: 0,
    label: 'P0',
    fullPeriod: 'Pra-Game (Siklus Awal APBD)',
    playersData: playersList.map(p => ({
      playerId: p.id,
      playerName: p.name,
      playerColor: p.color,
      playerAvatar: p.avatar,
      kpkSuspicionLevel: 10,
      totalCorruptionGains: 0,
      cash: p.cash
    }))
  },
  {
    round: 1,
    label: 'P1',
    fullPeriod: 'Putaran 1 · Awal Tahun Anggaran 2026',
    playersData: playersList.map(p => ({
      playerId: p.id,
      playerName: p.name,
      playerColor: p.color,
      playerAvatar: p.avatar,
      kpkSuspicionLevel: p.kpkSuspicionLevel,
      totalCorruptionGains: p.stats.totalCorruptionGains,
      cash: p.cash,
      isInCorruptionRoute: p.isInCorruptionRoute,
      inJail: p.inJail
    }))
  }
];

export const createDefaultPlayers = (): Player[] => [
  {
    id: 'player_1',
    name: 'Pemain 1',
    archetypeId: 'bambang_umr',
    isAi: false,
    position: 0,
    cash: 60_000_000,
    stress: 10,
    politicalInfluence: 5,
    ownedProperties: [],
    inJail: false,
    jailTurnsLeft: 0,
    isInCorruptionRoute: false,
    kpkSuspicionLevel: 10,
    isBankrupt: false,
    color: '#0284c7',
    avatar: '🛵',
    title: 'Buruh Pabrik & Ojol Pejuang Nafkah',
    specialCards: [],
    konohaBuffs: [],
    stats: {
      totalRentEarned: 0,
      totalRentPaid: 0,
      totalCorruptionGains: 0,
      cardsDrawn: 0,
      timesInJail: 0
    }
  },
  {
    id: 'player_2',
    name: 'Pemain 2 (Ordal)',
    archetypeId: 'pak_joko_asn',
    isAi: true,
    position: 0,
    cash: 85_000_000,
    stress: 5,
    politicalInfluence: 15,
    ownedProperties: [],
    inJail: false,
    jailTurnsLeft: 0,
    isInCorruptionRoute: false,
    kpkSuspicionLevel: 10,
    isBankrupt: false,
    color: '#16a34a',
    avatar: '👔',
    title: 'PNS Golongan III/a Santuy',
    specialCards: [],
    konohaBuffs: [],
    stats: {
      totalRentEarned: 0,
      totalRentPaid: 0,
      totalCorruptionGains: 0,
      cardsDrawn: 0,
      timesInJail: 0
    }
  },
  {
    id: 'player_3',
    name: 'Pemain 3 (Caleg)',
    archetypeId: 'daud_politisi',
    isAi: true,
    position: 0,
    cash: 100_000_000,
    stress: 15,
    politicalInfluence: 35,
    ownedProperties: [],
    inJail: false,
    jailTurnsLeft: 0,
    isInCorruptionRoute: false,
    kpkSuspicionLevel: 10,
    isBankrupt: false,
    color: '#f59e0b',
    avatar: '🏛️',
    title: 'Caleg Muda Berdasi & Aktivis Timses',
    specialCards: [],
    konohaBuffs: [],
    stats: {
      totalRentEarned: 0,
      totalRentPaid: 0,
      totalCorruptionGains: 0,
      cardsDrawn: 0,
      timesInJail: 0
    }
  }
];

export interface GameState {
  isSetupOpen: boolean;
  isGameOver: boolean;
  gameOverReason: string;
  players: Player[];
  activePlayerIndex: number;
  perimeterTiles: BoardTile[];
  corruptionTiles: BoardTile[];
  luxuryTiles: BoardTile[];
  macro: MacroEconomy;
  macroHistory: MacroHistoryPoint[];
  corruptionHistory: PlayerCorruptionHistoryPoint[];
  activeLaws: ActiveLaw[];
  cycleRound: number;
  logs: GameLogItem[];
}

export function createInitialGameState(): GameState {
  const defaultPlayers = createDefaultPlayers();
  return {
    isSetupOpen: true,
    isGameOver: false,
    gameOverReason: '',
    players: defaultPlayers,
    activePlayerIndex: 0,
    perimeterTiles: PERIMETER_TILES,
    corruptionTiles: CORRUPTION_ROUTE_TILES,
    luxuryTiles: LUXURY_BOARD_TILES,
    macro: INITIAL_MACRO_STATE,
    macroHistory: INITIAL_MACRO_HISTORY,
    corruptionHistory: createInitialCorruptionHistory(defaultPlayers),
    activeLaws: [],
    cycleRound: 1,
    logs: []
  };
}

type Updater<T> = React.SetStateAction<T>;

function applyUpdater<T>(current: T, updater: Updater<T>): T {
  return typeof updater === 'function' ? (updater as (prev: T) => T)(current) : updater;
}

export type GameAction =
  | { type: 'INIT_GAME'; players: Player[] }
  | { type: 'RESUME_GAME'; snapshot: SavedGameSnapshot }
  | { type: 'SET_IS_SETUP_OPEN'; payload: Updater<boolean> }
  | { type: 'SET_IS_GAME_OVER'; payload: Updater<boolean> }
  | { type: 'SET_GAME_OVER_REASON'; payload: Updater<string> }
  | { type: 'SET_PLAYERS'; payload: Updater<Player[]> }
  | { type: 'SET_ACTIVE_PLAYER_INDEX'; payload: Updater<number> }
  | { type: 'SET_PERIMETER_TILES'; payload: Updater<BoardTile[]> }
  | { type: 'SET_CORRUPTION_TILES'; payload: Updater<BoardTile[]> }
  | { type: 'SET_LUXURY_TILES'; payload: Updater<BoardTile[]> }
  | { type: 'SET_MACRO'; payload: Updater<MacroEconomy> }
  | { type: 'SET_MACRO_HISTORY'; payload: Updater<MacroHistoryPoint[]> }
  | { type: 'SET_CORRUPTION_HISTORY'; payload: Updater<PlayerCorruptionHistoryPoint[]> }
  | { type: 'SET_ACTIVE_LAWS'; payload: Updater<ActiveLaw[]> }
  | { type: 'SET_CYCLE_ROUND'; payload: Updater<number> }
  | { type: 'SET_LOGS'; payload: Updater<GameLogItem[]> };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME':
      return {
        ...state,
        isSetupOpen: false,
        isGameOver: false,
        gameOverReason: '',
        players: action.players,
        activePlayerIndex: 0,
        perimeterTiles: PERIMETER_TILES.map(t => ({ ...t, ownerId: null, level: 1 })),
        corruptionTiles: CORRUPTION_ROUTE_TILES.map(t => ({ ...t })),
        luxuryTiles: LUXURY_BOARD_TILES,
        macro: INITIAL_MACRO_STATE,
        macroHistory: INITIAL_MACRO_HISTORY,
        corruptionHistory: createInitialCorruptionHistory(action.players),
        activeLaws: [],
        cycleRound: 1,
        logs: []
      };
    case 'RESUME_GAME':
      return {
        ...state,
        isSetupOpen: false,
        isGameOver: false,
        gameOverReason: '',
        players: action.snapshot.players,
        activePlayerIndex: action.snapshot.activePlayerIndex,
        perimeterTiles: action.snapshot.perimeterTiles,
        corruptionTiles: action.snapshot.corruptionTiles,
        luxuryTiles: action.snapshot.luxuryTiles,
        macro: action.snapshot.macro,
        macroHistory: action.snapshot.macroHistory,
        corruptionHistory: action.snapshot.corruptionHistory,
        activeLaws: action.snapshot.activeLaws,
        cycleRound: action.snapshot.cycleRound,
        logs: action.snapshot.logs
      };
    case 'SET_IS_SETUP_OPEN':
      return { ...state, isSetupOpen: applyUpdater(state.isSetupOpen, action.payload) };
    case 'SET_IS_GAME_OVER':
      return { ...state, isGameOver: applyUpdater(state.isGameOver, action.payload) };
    case 'SET_GAME_OVER_REASON':
      return { ...state, gameOverReason: applyUpdater(state.gameOverReason, action.payload) };
    case 'SET_PLAYERS':
      return { ...state, players: applyUpdater(state.players, action.payload) };
    case 'SET_ACTIVE_PLAYER_INDEX':
      return { ...state, activePlayerIndex: applyUpdater(state.activePlayerIndex, action.payload) };
    case 'SET_PERIMETER_TILES':
      return { ...state, perimeterTiles: applyUpdater(state.perimeterTiles, action.payload) };
    case 'SET_CORRUPTION_TILES':
      return { ...state, corruptionTiles: applyUpdater(state.corruptionTiles, action.payload) };
    case 'SET_LUXURY_TILES':
      return { ...state, luxuryTiles: applyUpdater(state.luxuryTiles, action.payload) };
    case 'SET_MACRO':
      return { ...state, macro: applyUpdater(state.macro, action.payload) };
    case 'SET_MACRO_HISTORY':
      return { ...state, macroHistory: applyUpdater(state.macroHistory, action.payload) };
    case 'SET_CORRUPTION_HISTORY':
      return { ...state, corruptionHistory: applyUpdater(state.corruptionHistory, action.payload) };
    case 'SET_ACTIVE_LAWS':
      return { ...state, activeLaws: applyUpdater(state.activeLaws, action.payload) };
    case 'SET_CYCLE_ROUND':
      return { ...state, cycleRound: applyUpdater(state.cycleRound, action.payload) };
    case 'SET_LOGS':
      return { ...state, logs: applyUpdater(state.logs, action.payload) };
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  setIsSetupOpen: (val: Updater<boolean>) => void;
  setIsGameOver: (val: Updater<boolean>) => void;
  setGameOverReason: (val: Updater<string>) => void;
  setPlayers: (val: Updater<Player[]>) => void;
  setActivePlayerIndex: (val: Updater<number>) => void;
  setPerimeterTiles: (val: Updater<BoardTile[]>) => void;
  setCorruptionTiles: (val: Updater<BoardTile[]>) => void;
  setLuxuryTiles: (val: Updater<BoardTile[]>) => void;
  setMacro: (val: Updater<MacroEconomy>) => void;
  setMacroHistory: (val: Updater<MacroHistoryPoint[]>) => void;
  setCorruptionHistory: (val: Updater<PlayerCorruptionHistoryPoint[]>) => void;
  setActiveLaws: (val: Updater<ActiveLaw[]>) => void;
  setCycleRound: (val: Updater<number>) => void;
  setLogs: (val: Updater<GameLogItem[]>) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);

  const setIsSetupOpen = useCallback((payload: Updater<boolean>) => dispatch({ type: 'SET_IS_SETUP_OPEN', payload }), []);
  const setIsGameOver = useCallback((payload: Updater<boolean>) => dispatch({ type: 'SET_IS_GAME_OVER', payload }), []);
  const setGameOverReason = useCallback((payload: Updater<string>) => dispatch({ type: 'SET_GAME_OVER_REASON', payload }), []);
  const setPlayers = useCallback((payload: Updater<Player[]>) => dispatch({ type: 'SET_PLAYERS', payload }), []);
  const setActivePlayerIndex = useCallback((payload: Updater<number>) => dispatch({ type: 'SET_ACTIVE_PLAYER_INDEX', payload }), []);
  const setPerimeterTiles = useCallback((payload: Updater<BoardTile[]>) => dispatch({ type: 'SET_PERIMETER_TILES', payload }), []);
  const setCorruptionTiles = useCallback((payload: Updater<BoardTile[]>) => dispatch({ type: 'SET_CORRUPTION_TILES', payload }), []);
  const setLuxuryTiles = useCallback((payload: Updater<BoardTile[]>) => dispatch({ type: 'SET_LUXURY_TILES', payload }), []);
  const setMacro = useCallback((payload: Updater<MacroEconomy>) => dispatch({ type: 'SET_MACRO', payload }), []);
  const setMacroHistory = useCallback((payload: Updater<MacroHistoryPoint[]>) => dispatch({ type: 'SET_MACRO_HISTORY', payload }), []);
  const setCorruptionHistory = useCallback((payload: Updater<PlayerCorruptionHistoryPoint[]>) => dispatch({ type: 'SET_CORRUPTION_HISTORY', payload }), []);
  const setActiveLaws = useCallback((payload: Updater<ActiveLaw[]>) => dispatch({ type: 'SET_ACTIVE_LAWS', payload }), []);
  const setCycleRound = useCallback((payload: Updater<number>) => dispatch({ type: 'SET_CYCLE_ROUND', payload }), []);
  const setLogs = useCallback((payload: Updater<GameLogItem[]>) => dispatch({ type: 'SET_LOGS', payload }), []);

  const value = useMemo<GameContextValue>(() => ({
    state,
    dispatch,
    setIsSetupOpen,
    setIsGameOver,
    setGameOverReason,
    setPlayers,
    setActivePlayerIndex,
    setPerimeterTiles,
    setCorruptionTiles,
    setLuxuryTiles,
    setMacro,
    setMacroHistory,
    setCorruptionHistory,
    setActiveLaws,
    setCycleRound,
    setLogs
  }), [
    state,
    setIsSetupOpen,
    setIsGameOver,
    setGameOverReason,
    setPlayers,
    setActivePlayerIndex,
    setPerimeterTiles,
    setCorruptionTiles,
    setLuxuryTiles,
    setMacro,
    setMacroHistory,
    setCorruptionHistory,
    setActiveLaws,
    setCycleRound,
    setLogs
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used inside a GameProvider');
  }
  return ctx;
}
