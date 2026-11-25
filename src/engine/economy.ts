import { ActiveLaw, BoardTile, MacroEconomy, Player } from '../types/game';

export const FAST_MODE_MAX_ROUNDS = 15;

/**
 * Calculate a player's total net worth (cash + inflation-adjusted property values & upgrades).
 */
export function calculatePlayerNetWorth(
  player: Player,
  tiles: BoardTile[],
  macro: MacroEconomy
): number {
  const inflationFactor = 1 + (macro.inflationRate / 100);
  let propValuation = 0;
  for (const tileId of player.ownedProperties) {
    const tile = tiles.find(t => t.id === tileId);
    if (tile && tile.price) {
      const base = tile.price * inflationFactor;
      const upgradeBase = (tile.upgradeCost || 0) * (tile.level ? tile.level - 1 : 0);
      propValuation += base + upgradeBase;
    }
  }
  return Math.round(player.cash + propValuation);
}

/**
 * Find the richest surviving player by net worth (used for Fast Mode end-of-round-limit victory).
 */
export function findNetWorthWinner(
  players: Player[],
  tiles: BoardTile[],
  macro: MacroEconomy
): { winner: Player; netWorth: number } | null {
  const alive = players.filter(p => !p.isBankrupt);
  const pool = alive.length > 0 ? alive : players;
  if (pool.length === 0) return null;

  let bestPlayer = pool[0];
  let bestWorth = calculatePlayerNetWorth(bestPlayer, tiles, macro);
  for (let i = 1; i < pool.length; i++) {
    const worth = calculatePlayerNetWorth(pool[i], tiles, macro);
    if (worth > bestWorth) {
      bestWorth = worth;
      bestPlayer = pool[i];
    }
  }
  return { winner: bestPlayer, netWorth: bestWorth };
}

/**
 * Calculate emergency 80% liquidation sell value of a property adjusted for inflation and upgrades.
 */
export function calculatePropertySellValue(tile: BoardTile, macro: MacroEconomy): number {
  const inflationFactor = 1 + (macro.inflationRate / 100);
  const basePrice = (tile.price || 0) * inflationFactor;
  const upgradePrice = tile.level && tile.level > 1
    ? (tile.level - 1) * (tile.upgradeCost || 0) * inflationFactor
    : 0;
  const totalValue = basePrice + upgradePrice;
  return Math.max(100_000, Math.round(totalValue * 0.8));
}

export interface RentCalculationResult {
  rentCost: number;
  combinedRentMultiplier: number;
}

/**
 * Calculate rent owed when landing on another player's property, factoring in inflation,
 * building level, active UMKM subsidy laws, and Konoha inflation boom buffs.
 */
export function calculatePropertyRent(
  tile: BoardTile,
  owner: Player,
  macro: MacroEconomy,
  activeLaws: ActiveLaw[]
): RentCalculationResult {
  const inflationFactor = 1 + (macro.inflationRate / 100);
  const levelMultiplier = 1 + ((tile.level || 1) * 0.75);

  const hasUmkmSubsidy = activeLaws.some(
    l => l.effect === 'UMKM_SUBSIDY' && l.passedByPlayerId === owner.id
  );
  const rentBonus = hasUmkmSubsidy ? 1.35 : 1;
  const hasKonohaBoom = owner.konohaBuffs?.some(b => b.type === 'INFLATION_BOOM');
  const konohaRentMultiplier = hasKonohaBoom ? 1.25 : 1;
  const combinedRentMultiplier = rentBonus * konohaRentMultiplier;
  const rentCost = Math.round((tile.rent || 0) * inflationFactor * levelMultiplier * combinedRentMultiplier);

  return { rentCost, combinedRentMultiplier };
}

export interface LiquidationResult {
  survived: boolean;
  finalCash: number;
  cashRaised: number;
  soldPropertyIds: number[];
  soldPropertyTitles: string[];
}

/**
 * Sequentially liquidate owned properties until initialCash + cashRaised >= amountDue or all properties are sold.
 */
export function liquidatePropertiesForDebt(
  ownedTiles: BoardTile[],
  initialCash: number,
  amountDue: number,
  macro: MacroEconomy
): LiquidationResult {
  let currentCash = initialCash;
  const soldPropertyIds: number[] = [];
  const soldPropertyTitles: string[] = [];

  for (const prop of ownedTiles) {
    if (currentCash >= amountDue) break;
    const sellVal = calculatePropertySellValue(prop, macro);
    currentCash += sellVal;
    soldPropertyIds.push(prop.id);
    soldPropertyTitles.push(prop.name);
  }

  return {
    survived: currentCash >= amountDue,
    finalCash: currentCash,
    cashRaised: currentCash - initialCash,
    soldPropertyIds,
    soldPropertyTitles
  };
}

/**
 * Determine macroeconomic trend label from inflation rate and recent delta.
 */
export function computeMacroTrend(
  inflationRate: number,
  inflationDelta: number
): MacroEconomy['trend'] {
  if (inflationRate > 10.0) return 'CRISIS';
  if (inflationRate > 7.0) return 'VOLATILE';
  if (inflationDelta > 0.4) return 'RISING';
  return 'STABLE';
}

export interface MacroCycleStep {
  nextMacro: MacroEconomy;
  weekNumber: number;
  isNewMonth: boolean;
}

/**
 * Advance fiscal calendar (1 week = 2 rounds, 1 month = 8 rounds) and optionally fluctuate macro indicators on new month.
 */
export function advanceMacroCycle(
  prevMacro: MacroEconomy,
  nextRound: number,
  rng: () => number = Math.random
): MacroCycleStep {
  const weekNumber = (Math.floor((nextRound - 1) / 2) % 4) + 1;
  const isNewMonth = (nextRound - 1) % 8 === 0 && nextRound > 1;

  let nextMonth = prevMacro.monthIndex;
  let nextYear = prevMacro.year;

  if (isNewMonth) {
    nextMonth = (prevMacro.monthIndex % 12) + 1;
    if (nextMonth === 1) nextYear = prevMacro.year + 1;
  }

  let newInflation = prevMacro.inflationRate;
  let newBi = prevMacro.biRate;
  let newUsd = prevMacro.usdIdrRate;
  let newTrend = prevMacro.trend;

  if (isNewMonth) {
    const inflationDelta = Number((rng() * 1.6 - 0.7).toFixed(1));
    newInflation = Math.max(2.5, Math.min(18.0, Number((prevMacro.inflationRate + inflationDelta).toFixed(1))));

    const biDelta = Number((rng() * 0.5 - 0.2).toFixed(2));
    newBi = Math.max(4.5, Math.min(10.0, Number((prevMacro.biRate + biDelta).toFixed(2))));

    const usdDelta = Math.round(rng() * 300 - 100);
    newUsd = Math.max(15200, Math.min(18000, prevMacro.usdIdrRate + usdDelta));

    newTrend = computeMacroTrend(newInflation, inflationDelta);
  }

  return {
    weekNumber,
    isNewMonth,
    nextMacro: {
      ...prevMacro,
      weekIndex: weekNumber,
      monthIndex: nextMonth,
      year: nextYear,
      inflationRate: newInflation,
      biRate: newBi,
      usdIdrRate: newUsd,
      trend: newTrend
    }
  };
}
