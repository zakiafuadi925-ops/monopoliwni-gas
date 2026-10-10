export type IslandType = 'JAWA' | 'SUMATRA' | 'KALIMANTAN' | 'SULAWESI' | 'PAPUA' | 'SPECIAL';

export type ZoneType = 
  | 'START' 
  | 'PULAU_JAWA'
  | 'PULAU_SUMATRA'
  | 'PULAU_KALIMANTAN'
  | 'PULAU_SULAWESI'
  | 'PULAU_PAPUA'
  | 'EVENT_MUSIBAH'
  | 'EVENT_TAKDIR'
  | 'TANGGAL_MUDA' 
  | 'TANGGAL_TUA' 
  | 'BIROKRASI' 
  | 'HOKI_POLITIK' 
  | 'KORUPSI_ROUTE'
  | 'SPECIAL_CORNER';

export type TileActionType = 
  | 'START_SALARY'
  | 'PROPERTY'
  | 'EVENT_MUSIBAH'
  | 'EVENT_TAKDIR'
  | 'DILEMA_CARD'
  | 'TAX_BILL'
  | 'BIROKRASI_CHECK'
  | 'PRISON_SUKAMISKIN'
  | 'PARLIAMENT_SENAYAN'
  | 'CORRUPTION_GATE'
  | 'CORRUPTION_PROJECT'
  | 'CORRUPTION_AUDIT'
  | 'BANSOS_LUCK';

export type SpecialCardType = 'ORDAL_SAKTI' | 'KEBAL_SITA' | 'AMNESTI_PAJAK';

export interface SpecialCardItem {
  id: string;
  type: SpecialCardType;
  title: string;
  icon: string;
  description: string;
  effectText: string;
}

export type EventTier = 'BERAT' | 'SEDANG' | 'RINGAN';

export interface EventOutcomeCard {
  id: string;
  eventType: 'MUSIBAH' | 'TAKDIR';
  tier: EventTier;
  diceRange: [number, number]; // [1, 2], [3, 4], or [5, 6]
  diceRangeText: string;
  title: string;
  headline: string;
  categoryBadge: string;
  description: string;
  cashChange: number; // Negatif untuk denda musibah, positif untuk berkah takdir
  stressChange: number; // Positif untuk stres naik, negatif untuk stres reda
  politicalChange?: number;
  kpkChange?: number;
  confiscatesLandDeed?: boolean;
  specialRewardCard?: SpecialCardItem;
  icon: string;
}

export interface BoardTile {
  id: number;
  name: string;
  shortName: string;
  zone: ZoneType;
  actionType: TileActionType;
  island?: IslandType;
  islandName?: string;
  cityName?: string;
  certificateTitle?: string; // e.g. 'Surat Tanah SHM Kota Surabaya'
  billAmount?: number;
  price?: number; // Base purchase price in IDR
  rent?: number;  // Base rent in IDR
  upgradeCost?: number;
  ownerId?: string | null;
  level?: number; // 0: Tanah/Rintisan, 1: Usaha Kecil, 2: Ruko/Cabang, 3: Konglomerasi
  description: string;
  subtext?: string;
  isCorruptionRoute?: boolean;
}

export interface CharacterArchetype {
  id: string;
  name: string;
  title: string;
  avatar: string;
  color: string;
  bgLight: string;
  description: string;
  trait: string;
  startingCash: number;
  startingStress: number;
  startingInfluence: number;
  salaryBonusPercent: number;
  stressResistance: number; // Percentage stress multiplier (e.g., 0.8 = 20% less stress)
  kpkRiskMultiplier: number;
}

export interface Player {
  id: string;
  name: string;
  archetypeId: string;
  isAi: boolean;
  position: number; // 0 - 27 for perimeter, or 100-102 for corruption route
  cash: number;
  stress: number; // 0 to 100 (%)
  politicalInfluence: number; // 0 to 100
  ownedProperties: number[]; // Tile IDs
  inJail: boolean;
  jailTurnsLeft: number;
  isInCorruptionRoute: boolean;
  kpkSuspicionLevel: number; // 0 to 100 (%)
  isBankrupt: boolean;
  color: string;
  avatar: string;
  title: string;
  specialCards?: SpecialCardItem[];
  stats: {
    totalRentEarned: number;
    totalRentPaid: number;
    totalCorruptionGains: number;
    cardsDrawn: number;
    timesInJail: number;
  };
}

export interface MacroEconomy {
  inflationRate: number; // e.g. 5.5 (%)
  biRate: number;        // e.g. 6.25 (%)
  usdIdrRate: number;    // e.g. 16250 (IDR per USD)
  trend: 'STABLE' | 'RISING' | 'VOLATILE' | 'CRISIS';
  monthIndex: number;    // 1 to 12 (Fiscal Year)
  weekIndex: number;     // 1 to 4 (Weeks per Month)
  year: number;          // 2026
}

export interface DilemmaCard {
  id: string;
  title: string;
  category: 'VIRAL' | 'KEBIJAKAN' | 'MUSIBAH' | 'OPORTUNITAS' | 'NEPOTISME';
  description: string;
  image?: string;
  optionA: {
    text: string;
    description: string;
    effectText: string;
    apply: (player: Player, state: GameContext) => { summary: string };
  };
  optionB?: {
    text: string;
    description: string;
    effectText: string;
    apply: (player: Player, state: GameContext) => { summary: string };
  };
}

export interface ActiveLaw {
  id: string;
  name: string;
  shortDesc: string;
  passedByPlayerId: string;
  effect: 'ANTI_KPK' | 'LUXURY_TAX' | 'UMKM_SUBSIDY' | 'FREE_PARKING';
  durationTurns: number;
}

export interface BreakingNewsEvent {
  id: string;
  headline: string;
  detail: string;
  impactType: 'INFLATION' | 'TAX' | 'CORRUPTION_CRACKDOWN' | 'SUBSIDY_CUT';
  impactSummary: string;
}

export interface GameLogItem {
  id: string;
  timestamp: string;
  playerId?: string;
  playerName?: string;
  playerColor?: string;
  message: string;
  type: 'INFO' | 'CASH' | 'STRESS' | 'DANGER' | 'POLITIC' | 'SYSTEM';
}

export interface GameContext {
  players: Player[];
  activePlayerIndex: number;
  macro: MacroEconomy;
  tiles: BoardTile[];
  activeLaws: ActiveLaw[];
  round: number;
  maxRounds: number;
  addLog: (message: string, type?: GameLogItem['type'], playerId?: string) => void;
  triggerBreakingNews: (news: BreakingNewsEvent) => void;
}
