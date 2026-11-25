import { describe, expect, it, vi } from 'vitest';
import {
  checkBackendHealth,
  fetchGlobalLeaderboard,
  listCloudSaves,
  saveGameToCloud,
  submitLeaderboardScore
} from '../cloudApi';
import { NewGameSnapshotInput } from '../persistence';

const sampleSnapshot: NewGameSnapshotInput = {
  gameMode: 'FAST',
  players: [],
  activePlayerIndex: 0,
  perimeterTiles: [],
  corruptionTiles: [],
  luxuryTiles: [],
  macro: {
    inflationRate: 5,
    biRate: 6,
    usdIdrRate: 16000,
    trend: 'STABLE',
    monthIndex: 1,
    weekIndex: 1,
    year: 2026
  },
  macroHistory: [],
  corruptionHistory: [],
  activeLaws: [],
  cycleRound: 3,
  logs: []
};

describe('cloudApi', () => {
  it('handles backend health check online and offline gracefully', async () => {
    const okFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, database: { mode: 'mongodb', dbName: 'monopoli_wni' } })
    }) as unknown as typeof fetch;

    const online = await checkBackendHealth({ baseUrl: 'http://localhost:3001', fetchFn: okFetch });
    expect(online).toEqual({ online: true, mode: 'mongodb', dbName: 'monopoli_wni' });

    const failFetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    const offline = await checkBackendHealth({ baseUrl: 'http://localhost:3001', fetchFn: failFetch });
    expect(offline).toEqual({ online: false });
  });

  it('creates and lists cloud saves via POST and GET', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'save_1', title: 'Sesi Uji', ...sampleSnapshot } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'save_1', title: 'Sesi Uji', ...sampleSnapshot }] })
      }) as unknown as typeof fetch;

    const created = await saveGameToCloud(sampleSnapshot, 'Sesi Uji', null, {
      baseUrl: 'http://localhost:3001',
      fetchFn: mockFetch
    });
    expect(created?.id).toBe('save_1');

    const list = await listCloudSaves(5, { baseUrl: 'http://localhost:3001', fetchFn: mockFetch });
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Sesi Uji');
  });

  it('submits and fetches global leaderboard entries', async () => {
    const entry = {
      id: 'lb_1',
      winnerName: 'Kevin Sultan',
      archetypeId: 'kevin_sultan',
      netWorth: 250_000_000,
      cash: 100_000_000,
      cycleRound: 15,
      gameMode: 'FAST' as const,
      reason: 'Mode Cepat selesai',
      createdAt: new Date().toISOString()
    };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: entry }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [entry] }) }) as unknown as typeof fetch;

    const saved = await submitLeaderboardScore(
      {
        winnerName: 'Kevin Sultan',
        archetypeId: 'kevin_sultan',
        netWorth: 250_000_000,
        cash: 100_000_000,
        cycleRound: 15,
        gameMode: 'FAST',
        reason: 'Mode Cepat selesai'
      },
      { baseUrl: 'http://localhost:3001', fetchFn: mockFetch }
    );
    expect(saved?.id).toBe('lb_1');

    const lb = await fetchGlobalLeaderboard('FAST', 5, {
      baseUrl: 'http://localhost:3001',
      fetchFn: mockFetch
    });
    expect(lb.online).toBe(true);
    expect(lb.entries[0].winnerName).toBe('Kevin Sultan');
  });
});
