import { describe, expect, it } from 'vitest';
import { applySeasonalEvent, SEASONAL_EVENTS } from '../seasonalEvents';
import { MacroEconomy, Player } from '../../types/game';

const makePlayer = (id: string, overrides: Partial<Player> = {}): Player => ({
  id,
  name: `Pemain ${id}`,
  archetypeId: 'bambang_umr',
  isAi: false,
  position: 0,
  cash: 50_000_000,
  stress: 20,
  politicalInfluence: 30,
  ownedProperties: [],
  inJail: false,
  jailTurnsLeft: 0,
  isInCorruptionRoute: false,
  kpkSuspicionLevel: 10,
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
  },
  ...overrides
});

const baseMacro: MacroEconomy = {
  inflationRate: 5.0,
  biRate: 6.0,
  usdIdrRate: 16000,
  trend: 'STABLE',
  monthIndex: 1,
  weekIndex: 1,
  year: 2026
};

describe('seasonalEvents', () => {
  it('returns null event for months without seasonal events', () => {
    const players = [makePlayer('p1')];
    const result = applySeasonalEvent(2, players, baseMacro);
    expect(result.event).toBeNull();
    expect(result.nextPlayers).toEqual(players);
    expect(result.logMessage).toBeNull();
  });

  it('applies April THR & Mudik bonus and bumps inflation by +0.6%', () => {
    const players = [makePlayer('p1', { cash: 20_000_000, stress: 25 }), makePlayer('p2', { isBankrupt: true })];
    const result = applySeasonalEvent(4, players, baseMacro);

    expect(result.event?.id).toBe(SEASONAL_EVENTS[4].id);
    expect(result.nextPlayers[0].cash).toBe(30_000_000);
    expect(result.nextPlayers[0].stress).toBe(20);
    expect(result.nextPlayers[1].cash).toBe(50_000_000); // Bankrupt player untouched
    expect(result.nextMacro.inflationRate).toBe(5.6);
  });

  it('applies December year-end APBN bonus for >= 3 properties and cost for < 3 properties', () => {
    const rich = makePlayer('rich', { cash: 40_000_000, ownedProperties: [1, 2, 3] });
    const small = makePlayer('small', { cash: 10_000_000, stress: 10, ownedProperties: [5] });

    const result = applySeasonalEvent(12, [rich, small], baseMacro);
    expect(result.nextPlayers[0].cash).toBe(55_000_000);
    expect(result.nextPlayers[1].cash).toBe(6_000_000);
    expect(result.nextPlayers[1].stress).toBe(18);
  });
});
