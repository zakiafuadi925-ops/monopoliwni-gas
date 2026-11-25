import { describe, expect, it } from 'vitest';
import { LAW_PROPOSALS } from '../../data/laws';
import { BoardTile, MacroEconomy, Player } from '../../types/game';
import {
  chooseAiDilemmaOption,
  chooseAiParliamentProposal,
  shouldAiBuyProperty,
  shouldAiEnterCorruptionRoute,
  shouldAiPayJailBribe
} from '../ai';
import { computeCoalitionDeduction, findWealthiestRivalTarget } from '../politics';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Bot 1',
    archetypeId: 'daud_politisi',
    isAi: true,
    position: 0,
    cash: 50_000_000,
    stress: 20,
    politicalInfluence: 35,
    ownedProperties: [],
    inJail: false,
    jailTurnsLeft: 0,
    isInCorruptionRoute: false,
    kpkSuspicionLevel: 10,
    isBankrupt: false,
    color: '#f59e0b',
    avatar: '🏛️',
    title: 'Politisi',
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

const macro: MacroEconomy = {
  inflationRate: 10,
  biRate: 6.25,
  usdIdrRate: 16250,
  trend: 'RISING',
  monthIndex: 1,
  weekIndex: 1,
  year: 2026
};

describe('AI decision engine', () => {
  it('buys unowned property only when cash exceeds 1.35x inflation-adjusted price', () => {
    const tile: BoardTile = {
      id: 1,
      name: 'Kopi',
      shortName: 'Kopi',
      zone: 'PULAU_JAWA',
      actionType: 'PROPERTY',
      price: 10_000_000,
      ownerId: null,
      description: 'Test'
    };
    // cost = 11M, threshold = 14.85M
    expect(shouldAiBuyProperty(makePlayer({ cash: 20_000_000 }), tile, macro)).toBe(true);
    expect(shouldAiBuyProperty(makePlayer({ cash: 14_000_000 }), tile, macro)).toBe(false);
    expect(shouldAiBuyProperty(makePlayer({ cash: 50_000_000 }), { ...tile, ownerId: 'p2' }, macro)).toBe(false);
  });

  it('pays jail bail only when in jail with enough cash and high stress', () => {
    expect(shouldAiPayJailBribe(makePlayer({ inJail: true, cash: 25_000_000, stress: 40 }))).toBe(true);
    expect(shouldAiPayJailBribe(makePlayer({ inJail: true, cash: 25_000_000, stress: 20 }))).toBe(false);
    expect(shouldAiPayJailBribe(makePlayer({ inJail: false, cash: 25_000_000, stress: 40 }))).toBe(false);
  });

  it('selects dilemma option B when stress > 60', () => {
    expect(chooseAiDilemmaOption(makePlayer({ stress: 65 }))).toBe('optionB');
    expect(chooseAiDilemmaOption(makePlayer({ stress: 40 }))).toBe('optionA');
  });

  it('prioritizes coalition confiscation bill when combined influence >= 75', () => {
    const active = makePlayer({ id: 'p1', politicalInfluence: 40 });
    const ally = makePlayer({ id: 'p2', politicalInfluence: 40 });
    const decision = chooseAiParliamentProposal(active, [active, ally], LAW_PROPOSALS);
    expect(decision?.proposal.id).toBe('uu_penyitaan_aset');
    expect(decision?.coalitionPartner?.id).toBe('p2');
  });

  it('falls back to solo bill when coalition influence is insufficient', () => {
    const active = makePlayer({ id: 'p1', politicalInfluence: 40 });
    const weakAlly = makePlayer({ id: 'p2', politicalInfluence: 10 });
    const decision = chooseAiParliamentProposal(active, [active, weakAlly], LAW_PROPOSALS);
    expect(decision?.proposal.isCoalitionOnly).toBeFalsy();
    expect(decision?.coalitionPartner).toBeUndefined();
  });

  it('adapts property buying and corruption route decisions by AI difficulty', () => {
    const tile: BoardTile = {
      id: 1,
      name: 'Kopi',
      shortName: 'Kopi',
      zone: 'PULAU_JAWA',
      actionType: 'PROPERTY',
      price: 10_000_000,
      ownerId: null,
      description: 'Test'
    };
    // 13M cash is enough for AGRESIF (11M * 1.15 = 12.65M) but not SANTAI (11M * 1.55 = 17.05M)
    expect(shouldAiBuyProperty(makePlayer({ cash: 13_000_000, aiDifficulty: 'AGRESIF' }), tile, macro)).toBe(true);
    expect(shouldAiBuyProperty(makePlayer({ cash: 13_000_000, aiDifficulty: 'SANTAI' }), tile, macro)).toBe(false);

    expect(shouldAiEnterCorruptionRoute(makePlayer({ aiDifficulty: 'SANTAI', kpkSuspicionLevel: 10 }))).toBe(false);
    expect(shouldAiEnterCorruptionRoute(makePlayer({ aiDifficulty: 'KORUPTOR', kpkSuspicionLevel: 55 }))).toBe(true);
    expect(shouldAiEnterCorruptionRoute(makePlayer({ aiDifficulty: 'AGRESIF', kpkSuspicionLevel: 30, cash: 50_000_000 }))).toBe(true);
  });
});

describe('politics engine', () => {
  it('splits coalition influence deduction and caps partner deduction', () => {
    const active = makePlayer({ politicalInfluence: 60 });
    const partner = makePlayer({ politicalInfluence: 20 });
    // required = 75 -> ceil(75/2) = 38, partner needs 37 but only has 20 -> deductB=20, deductA=55
    expect(computeCoalitionDeduction(active, partner, 75)).toEqual({
      deductA: 55,
      deductB: 20
    });
  });

  it('targets wealthiest rival and their highest-value property', () => {
    const r1 = makePlayer({ id: 'r1', cash: 10_000_000 });
    const r2 = makePlayer({ id: 'r2', cash: 30_000_000 });
    const tiles: BoardTile[] = [
      { id: 1, name: 'Murah', shortName: 'M', zone: 'PULAU_JAWA', actionType: 'PROPERTY', price: 5_000_000, ownerId: 'r2', description: '' },
      { id: 2, name: 'Mahal', shortName: 'MH', zone: 'PULAU_JAWA', actionType: 'PROPERTY', price: 25_000_000, ownerId: 'r2', description: '' }
    ];
    const target = findWealthiestRivalTarget([r1, r2], tiles);
    expect(target?.primeRival.id).toBe('r2');
    expect(target?.seizedTile?.id).toBe(2);
  });
});
