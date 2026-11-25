import { describe, expect, it } from 'vitest';
import { CHARACTER_ARCHETYPES } from '../../data/characters';
import { MUSIBAH_EVENT_CARDS, TAKDIR_EVENT_CARDS } from '../../data/eventCards';
import { LAW_PROPOSALS } from '../../data/laws';
import { CORRUPTION_ROUTE_TILES, PERIMETER_TILES } from '../../data/tiles';
import { calculatePropertySellValue } from '../../components/RentCrisisModal';
import { BoardTile, MacroEconomy } from '../../types/game';

describe('game data integrity', () => {
  it('has 28 perimeter tiles with sequential IDs 0..27', () => {
    expect(PERIMETER_TILES).toHaveLength(28);
    expect(PERIMETER_TILES.map(t => t.id)).toEqual(Array.from({ length: 28 }, (_, i) => i));
  });

  it('has corruption route tiles with unique IDs', () => {
    const ids = CORRUPTION_ROUTE_TILES.map(t => t.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has 5 distinct character archetypes', () => {
    expect(CHARACTER_ARCHETYPES).toHaveLength(5);
    const ids = CHARACTER_ARCHETYPES.map(c => c.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('has valid dice ranges on all musibah and takdir event cards', () => {
    const allEvents = [...MUSIBAH_EVENT_CARDS, ...TAKDIR_EVENT_CARDS];
    expect(allEvents.length).toBeGreaterThan(0);
    for (const card of allEvents) {
      expect(card.diceRange[0]).toBeGreaterThanOrEqual(1);
      expect(card.diceRange[1]).toBeLessThanOrEqual(6);
      expect(card.diceRange[0]).toBeLessThanOrEqual(card.diceRange[1]);
    }
  });

  it('has unique law proposal IDs', () => {
    const ids = LAW_PROPOSALS.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('calculatePropertySellValue', () => {
  const baseMacro: MacroEconomy = {
    inflationRate: 10,
    biRate: 6.25,
    usdIdrRate: 16250,
    trend: 'RISING',
    monthIndex: 1,
    weekIndex: 1,
    year: 2026
  };

  it('calculates 80% emergency liquidation value adjusted for inflation and upgrades', () => {
    const tile: BoardTile = {
      id: 1,
      name: 'Warung Kopi',
      shortName: 'Warkop',
      zone: 'PULAU_JAWA',
      actionType: 'PROPERTY',
      price: 10_000_000,
      upgradeCost: 5_000_000,
      level: 2,
      description: 'Test tile'
    };
    // inflationFactor = 1.1; base = 11M, upgrade = 1 * 5M * 1.1 = 5.5M; total = 16.5M; 80% = 13.2M
    expect(calculatePropertySellValue(tile, baseMacro)).toBe(13_200_000);
  });

  it('enforces minimum liquidation floor of Rp 100.000', () => {
    const cheapTile: BoardTile = {
      id: 2,
      name: 'Lapak Kecil',
      shortName: 'Lapak',
      zone: 'PULAU_JAWA',
      actionType: 'PROPERTY',
      price: 50_000,
      level: 0,
      description: 'Cheap tile'
    };
    expect(calculatePropertySellValue(cheapTile, baseMacro)).toBe(100_000);
  });
});
