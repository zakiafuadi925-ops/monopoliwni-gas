import { describe, expect, it, vi } from 'vitest';
import {
  buildNarratorContext,
  fetchDynamicBreakingNews,
  isValidBreakingNewsEvent
} from '../narrator';
import { BREAKING_NEWS_TEMPLATES } from '../../data/laws';
import { MacroEconomy, Player } from '../../types/game';

const baseMacro: MacroEconomy = {
  inflationRate: 6.5,
  biRate: 6.25,
  usdIdrRate: 16200,
  trend: 'RISING',
  monthIndex: 4,
  weekIndex: 2,
  year: 2026
};

const activePlayer: Player = {
  id: 'p1',
  name: 'Bambang',
  archetypeId: 'bambang_umr',
  isAi: false,
  position: 3,
  cash: 45_000_000,
  stress: 35,
  politicalInfluence: 20,
  ownedProperties: [1],
  inJail: false,
  jailTurnsLeft: 0,
  isInCorruptionRoute: false,
  kpkSuspicionLevel: 15,
  isBankrupt: false,
  color: '#f59e0b',
  avatar: '🛵',
  title: 'Warga',
  specialCards: [],
  konohaBuffs: [],
  stats: {
    totalRentEarned: 0,
    totalRentPaid: 0,
    totalCorruptionGains: 0,
    cardsDrawn: 0,
    timesInJail: 0
  }
};

describe('narrator', () => {
  it('builds compact context excluding bankrupt players', () => {
    const bankrupt = { ...activePlayer, id: 'p2', name: 'Sultan Bangkrut', isBankrupt: true };
    const ctx = buildNarratorContext(baseMacro, [activePlayer, bankrupt], [], 7);

    expect(ctx.round).toBe(7);
    expect(ctx.playersSummary).toHaveLength(1);
    expect(ctx.playersSummary[0].name).toBe('Bambang');
  });

  it('validates BreakingNewsEvent payloads strictly', () => {
    expect(
      isValidBreakingNewsEvent({
        id: 'ai_1',
        headline: 'BREAKING NEWS: Tarif PPN Naik',
        detail: 'Harga barang ikut naik.',
        impactType: 'INFLATION',
        impactSummary: 'Inflasi +2%'
      })
    ).toBe(true);

    expect(isValidBreakingNewsEvent({ headline: 'Tanpa ID', impactType: 'UNKNOWN' })).toBe(false);
  });

  it('returns AI news when proxy responds with valid JSON', async () => {
    const aiPayload = {
      id: 'ai_99',
      headline: 'BREAKING NEWS: Kurs Menembus Rp 17.000!',
      detail: 'Pasar uang bergejolak menjelang rapat dewan gubernur.',
      impactType: 'INFLATION',
      impactSummary: 'Inflasi +2.0% akibat pelemahan kurs.'
    };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => aiPayload
    }) as unknown as typeof fetch;

    const ctx = buildNarratorContext(baseMacro, [activePlayer], [], 5);
    const result = await fetchDynamicBreakingNews(ctx, BREAKING_NEWS_TEMPLATES, {
      proxyUrl: 'http://localhost:3001',
      fetchFn: mockFetch
    });

    expect(result.source).toBe('AI');
    expect(result.news).toEqual(aiPayload);
  });

  it('falls back to static template when proxy is unreachable', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch;
    const ctx = buildNarratorContext(baseMacro, [activePlayer], [], 5);

    const result = await fetchDynamicBreakingNews(ctx, BREAKING_NEWS_TEMPLATES, {
      fetchFn: mockFetch,
      randomFn: () => 0
    });

    expect(result.source).toBe('TEMPLATE');
    expect(result.news.id).toBe(BREAKING_NEWS_TEMPLATES[0].id);
  });
});
