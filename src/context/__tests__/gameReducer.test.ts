import { describe, expect, it } from 'vitest';
import {
  createDefaultPlayers,
  createInitialGameState,
  gameReducer
} from '../GameContext';

describe('gameReducer', () => {
  it('initializes a new game with clean tiles and resets round/laws', () => {
    const initial = createInitialGameState();
    const customPlayers = createDefaultPlayers().slice(0, 2);

    const dirty = {
      ...initial,
      isSetupOpen: false,
      isGameOver: true,
      gameOverReason: 'Old game',
      cycleRound: 12,
      perimeterTiles: initial.perimeterTiles.map((t, i) =>
        i === 1 ? { ...t, ownerId: 'player_1', level: 3 } : t
      )
    };

    const next = gameReducer(dirty, { type: 'INIT_GAME', players: customPlayers });
    expect(next.isSetupOpen).toBe(false);
    expect(next.isGameOver).toBe(false);
    expect(next.gameOverReason).toBe('');
    expect(next.cycleRound).toBe(1);
    expect(next.players).toHaveLength(2);
    expect(next.perimeterTiles[1].ownerId).toBeNull();
    expect(next.perimeterTiles[1].level).toBe(1);
  });

  it('supports functional updaters on players and cycleRound', () => {
    const initial = createInitialGameState();
    const afterRound = gameReducer(initial, {
      type: 'SET_CYCLE_ROUND',
      payload: prev => prev + 1
    });
    expect(afterRound.cycleRound).toBe(2);

    const afterCash = gameReducer(afterRound, {
      type: 'SET_PLAYERS',
      payload: prev => prev.map(p => (p.id === 'player_1' ? { ...p, cash: p.cash + 5_000_000 } : p))
    });
    expect(afterCash.players[0].cash).toBe(initial.players[0].cash + 5_000_000);
  });

  it('resumes a saved snapshot cleanly', () => {
    const initial = createInitialGameState();
    const snapshot = {
      version: 1,
      savedAt: '2026-11-25T12:00:00.000Z',
      players: initial.players,
      activePlayerIndex: 1,
      perimeterTiles: initial.perimeterTiles,
      corruptionTiles: initial.corruptionTiles,
      luxuryTiles: initial.luxuryTiles,
      macro: { ...initial.macro, inflationRate: 8.4 },
      macroHistory: initial.macroHistory,
      corruptionHistory: initial.corruptionHistory,
      activeLaws: [],
      cycleRound: 9,
      logs: []
    };

    const resumed = gameReducer(initial, { type: 'RESUME_GAME', snapshot });
    expect(resumed.isSetupOpen).toBe(false);
    expect(resumed.activePlayerIndex).toBe(1);
    expect(resumed.cycleRound).toBe(9);
    expect(resumed.macro.inflationRate).toBe(8.4);
  });
});
