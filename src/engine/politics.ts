import { BoardTile, Player } from '../types/game';

export interface CoalitionDeduction {
  deductA: number;
  deductB: number;
}

/**
 * Split political influence cost between coalition initiator and partner,
 * capping partner deduction at their available influence.
 */
export function computeCoalitionDeduction(
  activePlayer: Player,
  coalitionPartner: Player,
  requiredInfluence: number
): CoalitionDeduction {
  let deductA = Math.min(activePlayer.politicalInfluence, Math.ceil(requiredInfluence / 2));
  let deductB = requiredInfluence - deductA;
  if (coalitionPartner.politicalInfluence < deductB) {
    deductB = coalitionPartner.politicalInfluence;
    deductA = requiredInfluence - deductB;
  }
  return { deductA, deductB };
}

export interface ConfiscationTarget {
  primeRival: Player;
  seizedTile: BoardTile | null;
}

/**
 * Identify the wealthiest non-coalition rival and their highest-value land deed for confiscation.
 */
export function findWealthiestRivalTarget(
  nonCoalitionRivals: Player[],
  perimeterTiles: BoardTile[]
): ConfiscationTarget | null {
  let primeRival: Player | null = null;
  let maxWealth = -1;

  for (const rival of nonCoalitionRivals) {
    const rivalTiles = perimeterTiles.filter(t => t.ownerId === rival.id);
    const wealth = rival.cash + rivalTiles.reduce((sum, t) => sum + (t.price || 0), 0);
    if (wealth > maxWealth) {
      maxWealth = wealth;
      primeRival = rival;
    }
  }

  if (!primeRival) return null;

  const rivalTiles = perimeterTiles.filter(t => t.ownerId === primeRival.id);
  const seizedTile = rivalTiles.length > 0
    ? rivalTiles.reduce((prev, curr) => ((curr.price || 0) > (prev.price || 0) ? curr : prev))
    : null;

  return { primeRival, seizedTile };
}
