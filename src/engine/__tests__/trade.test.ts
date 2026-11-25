import { describe, expect, it } from 'vitest';
import { BoardTile, MacroEconomy, Player } from '../../types/game';
import {
  applyTradeOffer,
  evaluateAiTradeOffer,
  TradeOffer,
  validateTradeOffer
} from '../trade';

const macro: MacroEconomy = {
  inflationRate: 10,
  biRate: 6.25,
  usdIdrRate: 16250,
  trend: 'RISING',
  monthIndex: 1,
  weekIndex: 1,
  year: 2026
};

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: `Player ${id}`,
    archetypeId: 'bambang_umr',
    isAi: id !== 'p1',
    position: 0,
    cash: 50_000_000,
    stress: 10,
    politicalInfluence: 10,
    ownedProperties: [],
    inJail: false,
    jailTurnsLeft: 0,
    isInCorruptionRoute: false,
    kpkSuspicionLevel: 10,
    isBankrupt: false,
    color: '#0284c7',
    avatar: '🛵',
    title: 'Test',
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
  };
}

const sampleTiles: BoardTile[] = [
  {
    id: 1,
    name: 'Warkop',
    shortName: 'Warkop',
    zone: 'PULAU_JAWA',
    actionType: 'PROPERTY',
    price: 10_000_000,
    ownerId: 'p1',
    level: 1,
    description: ''
  },
  {
    id: 2,
    name: 'Ruko',
    shortName: 'Ruko',
    zone: 'PULAU_JAWA',
    actionType: 'PROPERTY',
    price: 10_000_000,
    ownerId: 'p2',
    level: 1,
    description: ''
  }
];

describe('trade engine', () => {
  it('validates ownership and cash limits', () => {
    const p1 = makePlayer('p1', { ownedProperties: [1], cash: 20_000_000 });
    const p2 = makePlayer('p2', { ownedProperties: [2], cash: 30_000_000 });

    const invalidCash: TradeOffer = {
      proposerId: 'p1',
      targetId: 'p2',
      offeredTileIds: [1],
      requestedTileIds: [2],
      offeredCash: 99_000_000,
      requestedCash: 0
    };
    expect(validateTradeOffer(invalidCash, p1, p2, sampleTiles).valid).toBe(false);

    const validOffer: TradeOffer = { ...invalidCash, offeredCash: 5_000_000 };
    expect(validateTradeOffer(validOffer, p1, p2, sampleTiles).valid).toBe(true);
  });

  it('evaluates AI trade offers fairly based on difficulty', () => {
    const aiAggressive = makePlayer('p2', { aiDifficulty: 'AGRESIF', ownedProperties: [2] });
    // tile 2 market value = 10M * 1.1 = 11M; AGRESIF requires >= 12.1M
    const lowOffer: TradeOffer = {
      proposerId: 'p1',
      targetId: 'p2',
      offeredTileIds: [],
      requestedTileIds: [2],
      offeredCash: 11_000_000,
      requestedCash: 0
    };
    expect(evaluateAiTradeOffer(lowOffer, aiAggressive, sampleTiles, macro).accepted).toBe(false);

    const fairOffer: TradeOffer = { ...lowOffer, offeredCash: 13_000_000 };
    expect(evaluateAiTradeOffer(fairOffer, aiAggressive, sampleTiles, macro).accepted).toBe(true);
  });

  it('applies trade offer immutably to players and tiles', () => {
    const p1 = makePlayer('p1', { ownedProperties: [1], cash: 30_000_000 });
    const p2 = makePlayer('p2', { ownedProperties: [2], cash: 20_000_000 });
    const offer: TradeOffer = {
      proposerId: 'p1',
      targetId: 'p2',
      offeredTileIds: [1],
      requestedTileIds: [2],
      offeredCash: 5_000_000,
      requestedCash: 0
    };

    const result = applyTradeOffer(offer, [p1, p2], sampleTiles);
    expect(result.perimeterTiles[0].ownerId).toBe('p2');
    expect(result.perimeterTiles[1].ownerId).toBe('p1');
    expect(result.players[0].cash).toBe(25_000_000);
    expect(result.players[0].ownedProperties).toEqual([2]);
    expect(result.players[1].cash).toBe(25_000_000);
    expect(result.players[1].ownedProperties).toEqual([1]);
  });
});
