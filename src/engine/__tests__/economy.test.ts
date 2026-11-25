import { describe, expect, it } from 'vitest';
import {
  advanceMacroCycle,
  calculatePlayerNetWorth,
  calculatePropertyRent,
  calculatePropertySellValue,
  computeMacroTrend,
  findNetWorthWinner,
  liquidatePropertiesForDebt
} from '../economy';
import { ActiveLaw, BoardTile, MacroEconomy, Player } from '../../types/game';

const baseMacro: MacroEconomy = {
  inflationRate: 10,
  biRate: 6.25,
  usdIdrRate: 16250,
  trend: 'RISING',
  monthIndex: 1,
  weekIndex: 1,
  year: 2026
};

const baseOwner: Player = {
  id: 'owner_1',
  name: 'Owner',
  archetypeId: 'kevin_sultan',
  isAi: false,
  position: 0,
  cash: 100_000_000,
  stress: 10,
  politicalInfluence: 20,
  ownedProperties: [1, 2],
  inJail: false,
  jailTurnsLeft: 0,
  isInCorruptionRoute: false,
  kpkSuspicionLevel: 10,
  isBankrupt: false,
  color: '#6366f1',
  avatar: '💎',
  title: 'Konglo',
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

const sampleTile: BoardTile = {
  id: 1,
  name: 'Ruko Sudirman',
  shortName: 'Sudirman',
  zone: 'PULAU_JAWA',
  actionType: 'PROPERTY',
  price: 10_000_000,
  rent: 2_000_000,
  upgradeCost: 5_000_000,
  level: 2,
  ownerId: 'owner_1',
  description: 'Test'
};

describe('calculatePropertyRent', () => {
  it('computes rent with inflation and property level', () => {
    // base rent 2M * 1.1 (inflation 10%) * (1 + 2 * 0.75 = 2.5) = 5.5M
    const result = calculatePropertyRent(sampleTile, baseOwner, baseMacro, []);
    expect(result.combinedRentMultiplier).toBe(1);
    expect(result.rentCost).toBe(5_500_000);
  });

  it('applies UMKM_SUBSIDY law and INFLATION_BOOM Konoha buff multipliers', () => {
    const laws: ActiveLaw[] = [
      {
        id: 'law_1',
        name: 'RUU UMKM',
        shortDesc: 'Subsidi',
        passedByPlayerId: 'owner_1',
        effect: 'UMKM_SUBSIDY',
        durationTurns: 3
      }
    ];
    const buffedOwner: Player = {
      ...baseOwner,
      konohaBuffs: [
        {
          id: 'buff_1',
          cardId: 'card_1',
          cardTitle: 'Boom',
          cardIcon: '🔥',
          drawnByPlayerId: 'owner_1',
          drawnByPlayerName: 'Owner',
          drawnByPlayerColor: '#fff',
          type: 'INFLATION_BOOM',
          inflationDelta: 2,
          biRateDelta: 0.5,
          buffName: 'Boom',
          buffEffectDesc: 'Rent +25%',
          playerPerkText: '+25%',
          timestamp: '10:00'
        }
      ]
    };

    const result = calculatePropertyRent(sampleTile, buffedOwner, baseMacro, laws);
    expect(result.combinedRentMultiplier).toBeCloseTo(1.35 * 1.25);
    expect(result.rentCost).toBe(Math.round(5_500_000 * 1.35 * 1.25));
  });
});

describe('liquidatePropertiesForDebt', () => {
  it('sells only enough properties to cover the debt', () => {
    const tiles: BoardTile[] = [
      sampleTile,
      { ...sampleTile, id: 2, name: 'Kopi Senja', level: 1, price: 8_000_000 }
    ];
    // sampleTile sell value = (10M*1.1 + 5M*1.1)*0.8 = 13.2M
    const res = liquidatePropertiesForDebt(tiles, 1_000_000, 10_000_000, baseMacro);
    expect(res.survived).toBe(true);
    expect(res.soldPropertyIds).toEqual([1]);
    expect(res.soldPropertyTitles).toEqual(['Ruko Sudirman']);
    expect(res.cashRaised).toBe(calculatePropertySellValue(tiles[0], baseMacro));
    expect(res.finalCash).toBe(14_200_000);
  });

  it('reports survived=false when all assets are insufficient', () => {
    const res = liquidatePropertiesForDebt([sampleTile], 0, 50_000_000, baseMacro);
    expect(res.survived).toBe(false);
    expect(res.soldPropertyIds).toEqual([1]);
  });
});

describe('macro cycle progression', () => {
  it('classifies macro trends accurately', () => {
    expect(computeMacroTrend(10.5, 0.2)).toBe('CRISIS');
    expect(computeMacroTrend(7.5, -0.1)).toBe('VOLATILE');
    expect(computeMacroTrend(5.5, 0.5)).toBe('RISING');
    expect(computeMacroTrend(5.0, 0.1)).toBe('STABLE');
  });

  it('keeps inflation constant mid-month and fluctuates on new month (round 9)', () => {
    const midMonth = advanceMacroCycle(baseMacro, 4, () => 0.9);
    expect(midMonth.isNewMonth).toBe(false);
    expect(midMonth.weekNumber).toBe(2);
    expect(midMonth.nextMacro.inflationRate).toBe(baseMacro.inflationRate);

    const newMonth = advanceMacroCycle(baseMacro, 9, () => 0.5);
    expect(newMonth.isNewMonth).toBe(true);
    expect(newMonth.weekNumber).toBe(1);
    expect(newMonth.nextMacro.monthIndex).toBe(2);
  });
});

describe('net worth and fast mode winner', () => {
  it('calculates net worth including inflation-adjusted property prices and upgrades', () => {
    const p = { ...baseOwner, cash: 20_000_000, ownedProperties: [1] };
    // price=10M * 1.1 = 11M, upgrade=5M * 1 = 5M => 16M + 20M = 36M
    expect(calculatePlayerNetWorth(p, [sampleTile], baseMacro)).toBe(36_000_000);
  });

  it('picks the richest non-bankrupt survivor as winner', () => {
    const p1 = { ...baseOwner, id: 'p1', cash: 80_000_000, ownedProperties: [], isBankrupt: true };
    const p2 = { ...baseOwner, id: 'p2', cash: 30_000_000, ownedProperties: [1] };
    const p3 = { ...baseOwner, id: 'p3', cash: 25_000_000, ownedProperties: [] };

    const result = findNetWorthWinner([p1, p2, p3], [sampleTile], baseMacro);
    expect(result?.winner.id).toBe('p2');
    expect(result?.netWorth).toBe(46_000_000);
  });
});
