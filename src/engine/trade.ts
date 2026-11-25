import { BoardTile, MacroEconomy, Player } from '../types/game';
import { calculatePropertySellValue } from './economy';

export interface TradeOffer {
  proposerId: string;
  targetId: string;
  offeredTileIds: number[];
  requestedTileIds: number[];
  offeredCash: number;
  requestedCash: number;
}

export interface TradeValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a trade offer is well-formed and both parties own the offered/requested assets.
 */
export function validateTradeOffer(
  offer: TradeOffer,
  proposer: Player,
  target: Player,
  perimeterTiles: BoardTile[]
): TradeValidationResult {
  if (proposer.id === target.id) {
    return { valid: false, error: 'Tidak bisa bernegosiasi dengan diri sendiri.' };
  }
  if (proposer.isBankrupt || target.isBankrupt) {
    return { valid: false, error: 'Pemain yang sudah bangkrut tidak dapat bertransaksi.' };
  }
  if (offer.offeredCash < 0 || offer.requestedCash < 0) {
    return { valid: false, error: 'Nominal kas tidak boleh negatif.' };
  }
  if (offer.offeredCash > proposer.cash) {
    return { valid: false, error: 'Kas yang Anda tawarkan melebihi saldo Anda.' };
  }
  if (offer.requestedCash > target.cash) {
    return { valid: false, error: `Kas yang diminta melebihi saldo ${target.name}.` };
  }

  const hasAnyAsset =
    offer.offeredTileIds.length > 0 ||
    offer.requestedTileIds.length > 0 ||
    offer.offeredCash > 0 ||
    offer.requestedCash > 0;
  if (!hasAnyAsset) {
    return { valid: false, error: 'Pilih minimal satu properti atau nominal kas untuk ditukar.' };
  }

  for (const id of offer.offeredTileIds) {
    const tile = perimeterTiles.find(t => t.id === id);
    if (!tile || tile.ownerId !== proposer.id) {
      return { valid: false, error: 'Ada properti yang ditawarkan bukan milik Anda.' };
    }
  }
  for (const id of offer.requestedTileIds) {
    const tile = perimeterTiles.find(t => t.id === id);
    if (!tile || tile.ownerId !== target.id) {
      return { valid: false, error: `Ada properti yang diminta bukan milik ${target.name}.` };
    }
  }

  return { valid: true };
}

function estimateTileTradeValue(tile: BoardTile, macro: MacroEconomy): number {
  // Base liquidation value is 80% of market; divide by 0.8 to approximate fair market value
  return Math.round(calculatePropertySellValue(tile, macro) / 0.8);
}

export interface AiTradeEvaluation {
  accepted: boolean;
  reason: string;
}

/**
 * Evaluate whether an AI target player accepts a trade offer based on fair value and AI personality.
 */
export function evaluateAiTradeOffer(
  offer: TradeOffer,
  aiTarget: Player,
  perimeterTiles: BoardTile[],
  macro: MacroEconomy
): AiTradeEvaluation {
  const incomingPropValue = offer.offeredTileIds.reduce((sum, id) => {
    const tile = perimeterTiles.find(t => t.id === id);
    return sum + (tile ? estimateTileTradeValue(tile, macro) : 0);
  }, 0);

  const outgoingPropValue = offer.requestedTileIds.reduce((sum, id) => {
    const tile = perimeterTiles.find(t => t.id === id);
    return sum + (tile ? estimateTileTradeValue(tile, macro) : 0);
  }, 0);

  const totalIncoming = offer.offeredCash + incomingPropValue;
  const totalOutgoing = offer.requestedCash + outgoingPropValue;

  if (totalOutgoing === 0 && totalIncoming > 0) {
    return { accepted: true, reason: `${aiTarget.name} senang menerima hibah aset/kas!` };
  }

  const requiredRatio =
    aiTarget.aiDifficulty === 'AGRESIF'
      ? 1.1
      : aiTarget.aiDifficulty === 'KORUPTOR'
        ? 1.05
        : 0.95;

  if (totalIncoming >= totalOutgoing * requiredRatio) {
    return {
      accepted: true,
      reason: `${aiTarget.name} menyetujui kesepakatan karena nilai tukarnya dianggap menguntungkan.`
    };
  }

  return {
    accepted: false,
    reason: `${aiTarget.name} menolak tawaran karena nilai aset yang diterima masih di bawah ekspektasi pasar.`
  };
}

/**
 * Apply a validated & accepted trade offer immutably to players and perimeterTiles.
 */
export function applyTradeOffer(
  offer: TradeOffer,
  players: Player[],
  perimeterTiles: BoardTile[]
): { players: Player[]; perimeterTiles: BoardTile[] } {
  const offeredSet = new Set(offer.offeredTileIds);
  const requestedSet = new Set(offer.requestedTileIds);

  const nextTiles = perimeterTiles.map(tile => {
    if (offeredSet.has(tile.id)) {
      return { ...tile, ownerId: offer.targetId };
    }
    if (requestedSet.has(tile.id)) {
      return { ...tile, ownerId: offer.proposerId };
    }
    return tile;
  });

  const nextPlayers = players.map(p => {
    if (p.id === offer.proposerId) {
      const remaining = p.ownedProperties.filter(id => !offeredSet.has(id));
      return {
        ...p,
        cash: p.cash - offer.offeredCash + offer.requestedCash,
        ownedProperties: [...remaining, ...offer.requestedTileIds]
      };
    }
    if (p.id === offer.targetId) {
      const remaining = p.ownedProperties.filter(id => !requestedSet.has(id));
      return {
        ...p,
        cash: p.cash + offer.offeredCash - offer.requestedCash,
        ownedProperties: [...remaining, ...offer.offeredTileIds]
      };
    }
    return p;
  });

  return { players: nextPlayers, perimeterTiles: nextTiles };
}
