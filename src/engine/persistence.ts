import {
  ActiveLaw,
  BoardTile,
  GameLogItem,
  GameMode,
  MacroEconomy,
  MacroHistoryPoint,
  Player,
  PlayerCorruptionHistoryPoint
} from '../types/game';

const AUTOSAVE_STORAGE_KEY = 'monopoli_wni_autosave_v1';
const SNAPSHOT_VERSION = 1;

export interface SavedGameSnapshot {
  version: number;
  savedAt: string;
  gameMode?: GameMode;
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

export type NewGameSnapshotInput = Omit<SavedGameSnapshot, 'version' | 'savedAt'>;

/**
 * Persist current game state snapshot to localStorage. Silently ignores storage errors.
 */
export function saveGameSnapshot(input: NewGameSnapshotInput): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const payload: SavedGameSnapshot = {
      version: SNAPSHOT_VERSION,
      savedAt: new Date().toISOString(),
      ...input
    };
    window.localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load previously saved game snapshot from localStorage if valid.
 */
export function loadGameSnapshot(): SavedGameSnapshot | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SavedGameSnapshot>;
    if (
      parsed.version !== SNAPSHOT_VERSION ||
      !Array.isArray(parsed.players) ||
      parsed.players.length === 0 ||
      !Array.isArray(parsed.perimeterTiles) ||
      !parsed.macro
    ) {
      return null;
    }

    return parsed as SavedGameSnapshot;
  } catch {
    return null;
  }
}

/**
 * Remove saved game snapshot from localStorage.
 */
export function clearGameSnapshot(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
