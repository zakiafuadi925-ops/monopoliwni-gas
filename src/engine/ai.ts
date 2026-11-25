import { LawProposal } from '../data/laws';
import { AiDifficulty, BoardTile, MacroEconomy, Player } from '../types/game';

const BUY_BUFFER_BY_DIFFICULTY: Record<AiDifficulty, number> = {
  SANTAI: 1.55,
  AGRESIF: 1.15,
  KORUPTOR: 1.4
};

/**
 * Decide whether an AI player should buy an unowned property, factoring in AI personality/difficulty.
 */
export function shouldAiBuyProperty(
  player: Player,
  tile: BoardTile,
  macro: MacroEconomy
): boolean {
  if (tile.actionType !== 'PROPERTY' || tile.ownerId) return false;
  const inflationFactor = 1 + (macro.inflationRate / 100);
  const cost = Math.round((tile.price || 0) * inflationFactor);
  const buffer = player.aiDifficulty ? BUY_BUFFER_BY_DIFFICULTY[player.aiDifficulty] : 1.35;
  return player.cash > cost * buffer;
}

/**
 * Decide whether an AI player in Sukamiskin prison should pay bail.
 */
export function shouldAiPayJailBribe(player: Player): boolean {
  const minCash = player.aiDifficulty === 'AGRESIF' ? 15_000_000 : 20_000_000;
  return player.inJail && player.cash >= minCash && player.stress > 30;
}

/**
 * Decide whether an AI player enters the Corruption Route based on difficulty and KPK suspicion.
 */
export function shouldAiEnterCorruptionRoute(player: Player): boolean {
  switch (player.aiDifficulty) {
    case 'SANTAI':
      return false;
    case 'KORUPTOR':
      return player.kpkSuspicionLevel < 65;
    case 'AGRESIF':
      return player.kpkSuspicionLevel < 45 && player.cash < 80_000_000;
    default:
      return player.archetypeId === 'daud_politisi' || player.kpkSuspicionLevel < 40;
  }
}

/**
 * Choose Dilemma Card option for an AI player based on current stress level.
 */
export function chooseAiDilemmaOption(player: Player): 'optionA' | 'optionB' {
  return player.stress > 60 ? 'optionB' : 'optionA';
}

export interface AiParliamentDecision {
  proposal: LawProposal;
  coalitionPartner?: Player;
}

/**
 * Select the best Parliament bill (coalition or solo) an AI player can pass with current influence.
 */
export function chooseAiParliamentProposal(
  activePlayer: Player,
  allPlayers: Player[],
  proposals: LawProposal[]
): AiParliamentDecision | null {
  const candidateAllies = allPlayers.filter(p => p.id !== activePlayer.id && !p.isBankrupt);
  const bestAlly = candidateAllies.length > 0
    ? candidateAllies.reduce((prev, curr) =>
        curr.politicalInfluence > prev.politicalInfluence ? curr : prev
      )
    : undefined;

  const combinedInfluence = activePlayer.politicalInfluence + (bestAlly ? bestAlly.politicalInfluence : 0);

  if (bestAlly && combinedInfluence >= 75) {
    const confiscateProp = proposals.find(p => p.id === 'uu_penyitaan_aset');
    if (confiscateProp) {
      return { proposal: confiscateProp, coalitionPartner: bestAlly };
    }
  } else if (bestAlly && combinedInfluence >= 65) {
    const progTaxProp = proposals.find(p => p.id === 'uu_pajak_progresif_drastis');
    if (progTaxProp) {
      return { proposal: progTaxProp, coalitionPartner: bestAlly };
    }
  }

  const affordableSolo = proposals.filter(
    p => !p.isCoalitionOnly && activePlayer.politicalInfluence >= p.requiredInfluence
  );
  if (affordableSolo.length > 0) {
    if (activePlayer.aiDifficulty === 'KORUPTOR' || activePlayer.kpkSuspicionLevel >= 40) {
      const antiKpk = affordableSolo.find(p => p.effectType === 'ANTI_KPK');
      if (antiKpk) return { proposal: antiKpk };
    }
    return { proposal: affordableSolo[0] };
  }

  return null;
}
