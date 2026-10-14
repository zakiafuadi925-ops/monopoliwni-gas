/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Player, 
  BoardTile, 
  MacroEconomy, 
  ActiveLaw, 
  BreakingNewsEvent, 
  GameLogItem, 
  DilemmaCard,
  MacroHistoryPoint,
  KonohaMacroBuff
} from './types/game';
import { PERIMETER_TILES, CORRUPTION_ROUTE_TILES } from './data/tiles';
import { DILEMMA_CARDS } from './data/cards';
import { CHARACTER_ARCHETYPES } from './data/characters';
import { BREAKING_NEWS_TEMPLATES, LAW_PROPOSALS, LawProposal } from './data/laws';
import { formatRupiah, formatRupiahShort } from './utils/format';
import { soundManager } from './utils/sound';

const INITIAL_MACRO_HISTORY: MacroHistoryPoint[] = [
  {
    round: 0,
    label: "Q3 '25",
    fullPeriod: "Kuartal 3 2025 (Historis Pra-Game)",
    inflationRate: 4.2,
    usdIdrRate: 15950,
    biRate: 6.0,
    trend: 'STABLE',
    note: 'Stabilitas Moneter Awal'
  },
  {
    round: 0,
    label: "Q4 '25",
    fullPeriod: "Kuartal 4 2025 (Historis Pra-Game)",
    inflationRate: 4.8,
    usdIdrRate: 16180,
    biRate: 6.0,
    trend: 'RISING',
    note: 'Peningkatan Belanja Konsumsi'
  },
  {
    round: 1,
    label: 'P1',
    fullPeriod: 'Putaran 1 · Jan 2026 (W1)',
    inflationRate: 5.2,
    usdIdrRate: 16350,
    biRate: 6.25,
    trend: 'STABLE',
    note: 'Awal Permainan'
  }
];

// Components
import { Board } from './components/Board';
import { MacroIndicator } from './components/MacroIndicator';
import { PlayerHUD } from './components/PlayerHUD';
import { CardModal } from './components/CardModal';
import { CorruptionGateModal, CorruptionAuditModal, KPKBribeModal } from './components/CorruptionModal';
import { ParliamentModal } from './components/ParliamentModal';
import { DrasticLawBanner } from './components/DrasticLawBanner';
import { BreakingNewsBanner } from './components/BreakingNewsBanner';
import { PlayerStatsDrawer } from './components/PlayerStatsDrawer';
import { SetupGameModal } from './components/SetupGameModal';
import { GameOverModal } from './components/GameOverModal';
import { TileDetailModal } from './components/TileDetailModal';
import { DrawCardModal } from './components/DrawCardModal';
import { GameLogsModal } from './components/GameLogsModal';
import { KPKRadarPingEffect } from './components/VitalIndicators';
import { RentCrisisModal, calculatePropertySellValue } from './components/RentCrisisModal';
import { ManualRentPaymentModal, RentTransferData } from './components/ManualRentPaymentModal';
import { MoneyLaunderingModal } from './components/MoneyLaunderingModal';
import { MUSIBAH_EVENT_CARDS, TAKDIR_EVENT_CARDS } from './data/eventCards';
import { LUXURY_BOARD_TILES, LuxuryLaunderProperty } from './data/luxuryProperties';
import { EventOutcomeCard, SpecialCardItem } from './types/game';

// Icons
import { 
  BarChart3, 
  Volume2, 
  VolumeX, 
  Info, 
  RotateCcw, 
  Scale, 
  AlertTriangle,
  Landmark,
  Building2,
  ArrowRight,
  ShieldCheck,
  HeartCrack,
  Skull,
  History
} from 'lucide-react';

// Image assets generated
const BANNER_IMAGE = '/src/assets/images/wni_monopoly_banner_1791594690701.jpg';
const CREST_IMAGE = '/src/assets/images/rute_korupsi_crest_1791594702879.jpg';
const CARD_IMAGE = '/src/assets/images/dilema_konoha_card_1791594714825.jpg';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const createDefaultPlayers = (): Player[] => [
  {
    id: 'player_1',
    name: 'Pemain 1',
    archetypeId: 'bambang_umr',
    isAi: false,
    position: 0,
    cash: 60_000_000,
    stress: 10,
    politicalInfluence: 5,
    ownedProperties: [],
    inJail: false,
    jailTurnsLeft: 0,
    isInCorruptionRoute: false,
    kpkSuspicionLevel: 10,
    isBankrupt: false,
    color: '#0284c7',
    avatar: '🛵',
    title: 'Buruh Pabrik & Ojol Pejuang Nafkah',
    specialCards: [],
    konohaBuffs: [],
    stats: { totalRentEarned: 0, totalRentPaid: 0, totalCorruptionGains: 0, cardsDrawn: 0, timesInJail: 0 }
  },
  {
    id: 'player_2',
    name: 'Pemain 2 (Ordal)',
    archetypeId: 'pak_joko_asn',
    isAi: true,
    position: 0,
    cash: 85_000_000,
    stress: 5,
    politicalInfluence: 15,
    ownedProperties: [],
    inJail: false,
    jailTurnsLeft: 0,
    isInCorruptionRoute: false,
    kpkSuspicionLevel: 10,
    isBankrupt: false,
    color: '#16a34a',
    avatar: '👔',
    title: 'PNS Golongan III/a Santuy',
    specialCards: [],
    konohaBuffs: [],
    stats: { totalRentEarned: 0, totalRentPaid: 0, totalCorruptionGains: 0, cardsDrawn: 0, timesInJail: 0 }
  },
  {
    id: 'player_3',
    name: 'Pemain 3 (Caleg)',
    archetypeId: 'daud_politisi',
    isAi: true,
    position: 0,
    cash: 100_000_000,
    stress: 15,
    politicalInfluence: 35,
    ownedProperties: [],
    inJail: false,
    jailTurnsLeft: 0,
    isInCorruptionRoute: false,
    kpkSuspicionLevel: 10,
    isBankrupt: false,
    color: '#f59e0b',
    avatar: '🏛️',
    title: 'Caleg Muda Berdasi & Aktivis Timses',
    specialCards: [],
    konohaBuffs: [],
    stats: { totalRentEarned: 0, totalRentPaid: 0, totalCorruptionGains: 0, cardsDrawn: 0, timesInJail: 0 }
  }
];

export default function App() {
  // Game Setup & Status
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(true);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverReason, setGameOverReason] = useState<string>('');

  // Players & Turns
  const [players, setPlayers] = useState<Player[]>(createDefaultPlayers);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [lastRoll, setLastRoll] = useState<{ d1: number; d2: number; total: number } | null>(null);
  const [diceRollAnimation, setDiceRollAnimation] = useState<{
    player: Player;
    d1: number;
    d2: number;
    total: number;
  } | null>(null);

  // Board & Economy
  const [perimeterTiles, setPerimeterTiles] = useState<BoardTile[]>(PERIMETER_TILES);
  const [corruptionTiles, setCorruptionTiles] = useState<BoardTile[]>(CORRUPTION_ROUTE_TILES);
  const [luxuryTiles, setLuxuryTiles] = useState<BoardTile[]>(LUXURY_BOARD_TILES);
  const [macro, setMacro] = useState<MacroEconomy>({
    inflationRate: 5.2,
    biRate: 6.25,
    usdIdrRate: 16350,
    trend: 'STABLE',
    monthIndex: 1,
    weekIndex: 1,
    year: 2026,
    activeKonohaBuffs: []
  });
  const [macroHistory, setMacroHistory] = useState<MacroHistoryPoint[]>(INITIAL_MACRO_HISTORY);
  const [activeLaws, setActiveLaws] = useState<ActiveLaw[]>([]);
  const [cycleRound, setCycleRound] = useState<number>(1);

  // Modals & Panels
  const [selectedTile, setSelectedTile] = useState<BoardTile | null>(null);
  const [activeDilemmaCard, setActiveDilemmaCard] = useState<DilemmaCard | null>(null);
  const [showCorruptionGate, setShowCorruptionGate] = useState<boolean>(false);
  const [showCorruptionAudit, setShowCorruptionAudit] = useState<boolean>(false);
  const [showMoneyLaundering, setShowMoneyLaundering] = useState<boolean>(false);
  const [showKpkBribe, setShowKpkBribe] = useState<boolean>(false);
  const [activeDrawCardEvent, setActiveDrawCardEvent] = useState<{
    type: 'MUSIBAH' | 'TAKDIR';
    cardsPool: EventOutcomeCard[];
    targetPlayer: Player;
  } | null>(null);
  const activeDrawCardEventRef = useRef<{
    type: 'MUSIBAH' | 'TAKDIR';
    cardsPool: EventOutcomeCard[];
    targetPlayer: Player;
  } | null>(null);
  const aiEndTurnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showParliament, setShowParliament] = useState<boolean>(false);
  const [currentNews, setCurrentNews] = useState<BreakingNewsEvent | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Rent / Financial Debt Crisis & Asset Liquidation State
  const [rentCrisis, setRentCrisis] = useState<{
    crisisType?: 'RENT' | 'EVENT_LOSS' | 'TILE_BILL' | 'BIROKRASI' | 'PSYCHOLOGIST' | 'KPK_BRIBE' | 'DEBT';
    payer: Player;
    owner?: Player;
    tile?: BoardTile;
    rentCost?: number;
    amountDue?: number;
    title?: string;
    subtitle?: string;
    description?: string;
    recipientName?: string;
    recipientAvatar?: string;
    recipientColor?: string;
    causeDesc?: string;
    onPaySuccess?: (updatedPayer: Player) => void;
  } | null>(null);

  // Manual Rent Payment Animation Modal State
  const [manualRentData, setManualRentData] = useState<RentTransferData | null>(null);

  // Survival Notifications
  const [psychologistNotice, setPsychologistNotice] = useState<{
    player: Player;
    fee: number;
    oldStress: number;
    newStress: number;
  } | null>(null);
  const [eliminationNotice, setEliminationNotice] = useState<{
    player: Player;
    cause: string;
    remainingCount: number;
  } | null>(null);
  const [monthNotice, setMonthNotice] = useState<{
    monthName: string;
    monthIndex: number;
    year: number;
    round: number;
  } | null>(null);

  // Logs - Full scrollable history
  const [logs, setLogs] = useState<GameLogItem[]>([]);

  const addLog = (message: string, type: GameLogItem['type'] = 'INFO', playerId?: string) => {
    const p = players.find(x => x.id === playerId);
    const newLog: GameLogItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      playerId,
      playerName: p?.name,
      playerColor: p?.color,
      message,
      type
    };
    setLogs(prev => [...prev.slice(-1000), newLog]);
  };

  const activePlayer = players[activePlayerIndex] || null;
  const alivePlayers = players.filter(p => !p.isBankrupt);
  const aliveCount = alivePlayers.length;

  // Synchronize Macroeconomic Ambient Audio Engine with Trend and Inflation
  useEffect(() => {
    soundManager.setMacroeconomicState(macro.trend, macro.inflationRate);
  }, [macro.trend, macro.inflationRate]);

  // Audio Context unlock on first user gesture
  useEffect(() => {
    const handleFirstGesture = () => {
      soundManager.unlockAudio();
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // Initialize game from Setup Modal (Survival Mode)
  const handleStartGame = (configuredPlayers: Player[]) => {
    // Reset properties and tiles to clean unowned initial state
    setPerimeterTiles(PERIMETER_TILES.map(t => ({ ...t, ownerId: null, level: 1 })));
    setCorruptionTiles(CORRUPTION_ROUTE_TILES.map(t => ({ ...t })));

    setPlayers(configuredPlayers);
    setCycleRound(1);
    setMacro({
      inflationRate: 5.2,
      biRate: 6.25,
      usdIdrRate: 16350,
      trend: 'STABLE',
      monthIndex: 1,
      weekIndex: 1,
      year: 2026,
      activeKonohaBuffs: []
    });
    setMacroHistory(INITIAL_MACRO_HISTORY);
    setActivePlayerIndex(0);
    setHasRolled(false);
    setIsRolling(false);
    setIsMoving(false);
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    setLastRoll(null);
    setDiceRollAnimation(null);
    setIsGameOver(false);
    setGameOverReason('');
    setIsSetupOpen(false);
    setLogs([]);

    // Clear all lingering notices, alerts, and modal states
    setEliminationNotice(null);
    setPsychologistNotice(null);
    setMonthNotice(null);
    setRentCrisis(null);
    setActiveDilemmaCard(null);
    setActiveDrawCardEvent(null);
    setShowCorruptionGate(false);
    setShowCorruptionAudit(false);
    setShowKpkBribe(false);
    setShowParliament(false);
    setShowLogsModal(false);
    setIsStatsOpen(false);
    setSelectedTile(null);
    setActiveLaws([]);
    setCurrentNews(null);

    soundManager.playVictory();
    addLog(`Pertarungan Survival WNI dimulai dengan ${configuredPlayers.length} pemain! Kemenangan sejati adalah siapa yang mampu bertahan hidup paling lama!`, 'SYSTEM');
  };

  // Handler to start a new round / reset game via Setup Modal
  const handleRestartNewRound = () => {
    setIsGameOver(false);
    setGameOverReason('');
    setIsRolling(false);
    setIsMoving(false);
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    setDiceRollAnimation(null);
    setHasRolled(false);
    setLastRoll(null);
    setPerimeterTiles(PERIMETER_TILES.map(t => ({ ...t, ownerId: null, level: 1 })));
    setCorruptionTiles(CORRUPTION_ROUTE_TILES.map(t => ({ ...t })));

    // Clear all lingering notices and overlays
    setEliminationNotice(null);
    setPsychologistNotice(null);
    setMonthNotice(null);
    setRentCrisis(null);
    setActiveDilemmaCard(null);
    setActiveDrawCardEvent(null);
    setShowCorruptionGate(false);
    setShowCorruptionAudit(false);
    setShowKpkBribe(false);
    setShowParliament(false);
    setShowLogsModal(false);
    setIsStatsOpen(false);
    setSelectedTile(null);

    // Open setup modal
    setIsSetupOpen(true);
  };

  // Quick restart with the same players reinitialized to archetype starting stats
  const handleQuickRestart = () => {
    setIsGameOver(false);
    setGameOverReason('');

    const reinitializedPlayers: Player[] = players.map((p, idx) => {
      const arch = CHARACTER_ARCHETYPES.find(a => a.id === p.archetypeId) || CHARACTER_ARCHETYPES[idx % CHARACTER_ARCHETYPES.length];
      return {
        ...p,
        position: 0,
        cash: arch.startingCash,
        stress: arch.startingStress,
        politicalInfluence: arch.startingInfluence,
        ownedProperties: [],
        inJail: false,
        jailTurnsLeft: 0,
        isInCorruptionRoute: false,
        kpkSuspicionLevel: 10,
        isBankrupt: false,
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
    });

    handleStartGame(reinitializedPlayers);
  };

  // Bankruptcy & Elimination Handler
  const handlePlayerBankruptcy = (player: Player, cause: string) => {
    soundManager.playBuzzer();

    setPlayers(prev => prev.map(p => {
      if (p.id !== player.id) return p;
      return {
        ...p,
        isBankrupt: true,
        cash: 0,
        ownedProperties: []
      };
    }));

    // Release all properties back to the open market
    setPerimeterTiles(prev => prev.map(t => player.ownedProperties.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t));

    addLog(`🚨 KEBANGKRUTAN TOTAL! ${player.name} gugur akibat: ${cause}. Seluruh aset disita & dilelang kembali ke pasar!`, 'DANGER', player.id);

    // Calculate survivors and show elimination banner
    setTimeout(() => {
      setPlayers(currentPlayers => {
        const remaining = currentPlayers.filter(p => !p.isBankrupt);
        setEliminationNotice({
          player,
          cause,
          remainingCount: remaining.length
        });

        if (remaining.length <= 1) {
          const survivor = remaining[0] || player;
          setIsGameOver(true);
          setGameOverReason(`Kemenangan Sejati! ${survivor.name} adalah satu-satunya penyintas yang berhasil bertahan hidup paling lama saat seluruh lawan tersingkir!`);
        } else {
          // If the bankrupt player was currently active, pass turn to next alive player
          setActivePlayerIndex(currentIdx => {
            if (currentPlayers[currentIdx]?.isBankrupt) {
              let nextAlive = (currentIdx + 1) % currentPlayers.length;
              let count = 0;
              while (currentPlayers[nextAlive]?.isBankrupt && count < currentPlayers.length) {
                nextAlive = (nextAlive + 1) % currentPlayers.length;
                count++;
              }
              setHasRolled(false);
              setLastRoll(null);
              return nextAlive;
            }
            return currentIdx;
          });
        }
        return currentPlayers;
      });
    }, 400);
  };

  // Check 100% Stress Threshold & Psychologist Intervention
  const checkStressThreshold = (player: Player): boolean => {
    if (player.isBankrupt) return false;

    if (player.stress >= 100) {
      const psychologistFee = 10_000_000;
      if (player.cash >= psychologistFee) {
        const updatedCash = player.cash - psychologistFee;
        const updatedStress = Math.max(0, player.stress - 20); // Drops 20% to 80%

        setPlayers(prev => prev.map(p => p.id === player.id ? {
          ...p,
          cash: updatedCash,
          stress: updatedStress
        } : p));

        soundManager.playCash();
        addLog(`🧠 KONSULTASI PSIKOLOG: Stres ${player.name} mencapai 100%! Membayar Rp 10.000.000 ke psikiater, stres turun 20% menjadi ${updatedStress}%.`, 'INFO', player.id);
        
        setPsychologistNotice({
          player: { ...player, cash: updatedCash, stress: updatedStress },
          fee: psychologistFee,
          oldStress: player.stress,
          newStress: updatedStress
        });
        return true;
      } else {
        // Cannot afford psychologist from cash alone!
        // Check if player has property assets to liquidate
        const ownedTiles = perimeterTiles.filter(t => t.ownerId === player.id);
        const totalLiquidation = ownedTiles.reduce((sum, t) => sum + calculatePropertySellValue(t, macro), 0);
        if (ownedTiles.length > 0 && player.cash + totalLiquidation >= psychologistFee) {
          if (player.isAi) {
            let currentCash = player.cash;
            const soldPropertyIds: number[] = [];
            const soldPropertyTitles: string[] = [];
            for (const prop of ownedTiles) {
              if (currentCash >= psychologistFee) break;
              const sellVal = calculatePropertySellValue(prop, macro);
              currentCash += sellVal;
              soldPropertyIds.push(prop.id);
              soldPropertyTitles.push(prop.name);
            }
            setPerimeterTiles(prev => prev.map(t => soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t));
            addLog(`${player.name} (AI) terpaksa menjual aset (${soldPropertyTitles.join(', ')}) seharga ${formatRupiah(currentCash - player.cash)} untuk biaya terapi psikiater Rp 10.000.000!`, 'DANGER', player.id);
            const updatedStress = Math.max(0, player.stress - 20);
            setPlayers(prev => prev.map(p => p.id === player.id ? {
              ...p,
              cash: currentCash - psychologistFee,
              stress: updatedStress,
              ownedProperties: p.ownedProperties.filter(id => !soldPropertyIds.includes(id))
            } : p));
            setPsychologistNotice({
              player: { ...player, cash: currentCash - psychologistFee, stress: updatedStress },
              fee: psychologistFee,
              oldStress: player.stress,
              newStress: updatedStress
            });
            return true;
          } else {
            // Human player: open crisis modal to liquidate property for psychologist fee!
            setRentCrisis({
              crisisType: 'PSYCHOLOGIST',
              payer: player,
              amountDue: psychologistFee,
              title: 'Klinik Jiwa Konoha · Terapi Darurat',
              subtitle: 'STRES MAKSIMAL 100% · INTERVENSI PSIKOLOG',
              description: `Tingkat stres Anda mencapai batas kritis 100%! Untuk menyelamatkan diri dari serangan panik, Anda wajib menjalani sesi terapi psikiater darurat seharga Rp 10.000.000. Jual aset tanah untuk melunasi biaya ini.`,
              causeDesc: 'biaya psikolog darurat Rp 10.000.000',
              recipientName: 'Klinik Jiwa & Konselor Konoha',
              recipientAvatar: '🧠',
              onPaySuccess: (updatedPayer) => {
                const updatedStress = Math.max(0, updatedPayer.stress - 20);
                setPlayers(prev => prev.map(p => p.id === updatedPayer.id ? {
                  ...p,
                  cash: p.cash - psychologistFee,
                  stress: updatedStress
                } : p));
                addLog(`🧠 INTERVENSI PSIKOLOG! ${updatedPayer.name} melunasi terapi Rp 10.000.000, stres turun 20% menjadi ${updatedStress}%.`, 'INFO', updatedPayer.id);
                setPsychologistNotice({
                  player: { ...updatedPayer, cash: updatedPayer.cash - psychologistFee, stress: updatedStress },
                  fee: psychologistFee,
                  oldStress: 100,
                  newStress: updatedStress
                });
              }
            });
            return true;
          }
        }

        // Cannot afford even with all assets sold -> Bankrupt & eliminated!
        handlePlayerBankruptcy(player, 'Stres mencapai 100% dan seluruh aset tidak mencukupi untuk membayar biaya psikolog Rp 10.000.000');
        return false;
      }
    }
    return true;
  };

  // Roll Dice Logic & Visual Animation Engine
  const handleRollDice = (d1: number, d2: number, total: number) => {
    if (!activePlayer || activePlayer.isBankrupt || hasRolled || isRolling || isMoving || rentCrisis) return;

    setIsRolling(true);
    setLastRoll({ d1, d2, total });
    setDiceRollAnimation({
      player: activePlayer,
      d1,
      d2,
      total
    });
  };

  const handleRollAnimationComplete = () => {
    if (!diceRollAnimation) return;
    const { player, total } = diceRollAnimation;
    setDiceRollAnimation(null);
    setIsRolling(false);

    // Handle pawn movement step-by-step across the board
    executePlayerMove(player, total);
  };

  // Step-by-Step Tactile Movement Engine
  const executePlayerMove = (player: Player, totalSteps: number) => {
    setIsMoving(true);

    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }

    // Check if player is currently in Corruption Route
    if (player.isInCorruptionRoute) {
      let newPos = player.position;
      let exitRoute = false;
      if (player.position === 100) {
        newPos = 101;
      } else if (player.position === 101) {
        newPos = 102;
      } else if (player.position === 102) {
        newPos = 103;
      } else {
        newPos = 21;
        exitRoute = true;
      }

      soundManager.playPawnStep(1);
      setPlayers(prev => prev.map(p => {
        if (p.id !== player.id) return p;
        return {
          ...p,
          position: newPos,
          isInCorruptionRoute: exitRoute ? false : p.isInCorruptionRoute
        };
      }));

      if (exitRoute) {
        addLog(`${player.name} keluar dari Rute Korupsi menuju Gedung DPR Senayan!`, 'POLITIC', player.id);
      }

      moveTimerRef.current = setTimeout(() => {
        soundManager.playPawnLand();
        setIsMoving(false);
        setHasRolled(true);
        const freshPlayer = players.find(p => p.id === player.id) || { ...player, position: newPos, isInCorruptionRoute: exitRoute ? false : player.isInCorruptionRoute };
        resolveLandingTile({ ...freshPlayer, position: newPos, isInCorruptionRoute: exitRoute ? false : freshPlayer.isInCorruptionRoute }, newPos);
      }, 350);
      return;
    }

    // Normal perimeter movement (28 tiles loop: 0 -> 27)
    let currentStep = 0;
    let currentPos = player.position;
    let passedStartAwarded = false;

    const stepInterval = 210; // ms per tile hop

    const stepPawn = () => {
      currentStep++;
      const nextPos = (currentPos + 1) % 28;
      currentPos = nextPos;

      // Play ascending pleasant tactile hop sound
      soundManager.playPawnStep(currentStep);

      // Check passing or landing on START (Tile 0)
      if (nextPos === 0 && !passedStartAwarded) {
        passedStartAwarded = true;
        const inflationFactor = 1 + (macro.inflationRate / 100);
        const baseSalary = 45_000_000;
        const bonusPct = (CHARACTER_ARCHETYPES.find(a => a.id === player.archetypeId)?.salaryBonusPercent || 0) / 100;
        const totalSalary = Math.round(baseSalary * inflationFactor * (1 + bonusPct));

        // Check if player has INTEREST_RATE_HIKE Konoha buff ("Dividen Deposito Hawkish Konoha")
        const hasDepositBuff = player.konohaBuffs?.some(b => b.type === 'INTEREST_RATE_HIKE');
        let depositDividends = 0;
        if (hasDepositBuff) {
          depositDividends = Math.min(15_000_000, Math.max(2_000_000, Math.round(player.cash * 0.05)));
        }

        soundManager.playCash();
        setPlayers(prev => prev.map(p => {
          if (p.id !== player.id) return p;
          return {
            ...p,
            position: nextPos,
            cash: p.cash + totalSalary + depositDividends,
            stress: Math.max(0, p.stress - 10)
          };
        }));
        if (depositDividends > 0) {
          addLog(`${player.name} melewati START! Gajian UMR cair ${formatRupiah(totalSalary)} + 💰 Dividen Deposito Hawkish BI ${formatRupiah(depositDividends)}! Stres turun 10%.`, 'CASH', player.id);
        } else {
          addLog(`${player.name} melewati START! Gajian UMR cair ${formatRupiah(totalSalary)} dan Stres turun 10%.`, 'CASH', player.id);
        }
      } else {
        setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, position: nextPos } : p));
      }

      if (currentStep < totalSteps) {
        moveTimerRef.current = setTimeout(stepPawn, stepInterval);
      } else {
        // Final landing on destination tile
        moveTimerRef.current = setTimeout(() => {
          soundManager.playPawnLand();
          setIsMoving(false);
          setHasRolled(true);
          const freshPlayer = players.find(p => p.id === player.id) || { ...player, position: nextPos };
          resolveLandingTile({ ...freshPlayer, position: nextPos }, nextPos);
        }, 220);
      }
    };

    moveTimerRef.current = setTimeout(stepPawn, 80);
  };

  // Resolve Landing Tile Event
  const resolveLandingTile = (player: Player, tileId: number) => {
    if (player.isBankrupt) return;

    const tile = [...perimeterTiles, ...corruptionTiles, ...luxuryTiles].find(t => t.id === tileId);
    if (!tile) return;

    addLog(`${player.name} mendarat di petak #${tile.id}: ${tile.name}.`, 'INFO', player.id);

    // CORRUPTION ROUTE TILE HANDLING
    if (tile.isCorruptionRoute) {
      if (tile.id === 100) {
        // Pengadaan Fiktif
        soundManager.playCash();
        setPlayers(prev => prev.map(p => p.id === player.id ? {
          ...p,
          cash: p.cash + 60_000_000,
          kpkSuspicionLevel: Math.min(100, p.kpkSuspicionLevel + 25),
          stats: { ...p.stats, totalCorruptionGains: p.stats.totalCorruptionGains + 60_000_000 }
        } : p));
        addLog(`${player.name} mengeksekusi Pengadaan Fiktif APBD! Mengantongi Rp 60 Jt tapi Radar KPK +25%.`, 'DANGER', player.id);
      } else if (tile.id === 101) {
        // Kuota Impor
        soundManager.playCash();
        setPlayers(prev => prev.map(p => p.id === player.id ? {
          ...p,
          cash: p.cash + 45_000_000,
          politicalInfluence: Math.min(100, p.politicalInfluence + 20),
          stats: { ...p.stats, totalCorruptionGains: p.stats.totalCorruptionGains + 45_000_000 }
        } : p));
        addLog(`${player.name} mendapat jatah Kuota Impor Pangan! Dapat Rp 45 Jt dan +20 Modal Politik.`, 'POLITIC', player.id);
      } else if (tile.id === 102) {
        // Cuci Uang & Properti Mewah Samaran
        setShowMoneyLaundering(true);
      } else if (tile.id === 103) {
        // Sidak BPK & Radar OTT KPK
        setShowCorruptionAudit(true);
      }
      return;
    }

    // PERIMETER ACTIONS
    switch (tile.actionType) {
      case 'PROPERTY': {
        if (tile.ownerId && tile.ownerId !== player.id) {
          // Pay Rent to Owner
          const owner = players.find(p => p.id === tile.ownerId);
          if (owner && !owner.inJail && !owner.isBankrupt) {
            const inflationFactor = 1 + (macro.inflationRate / 100);
            const levelMultiplier = 1 + ((tile.level || 1) * 0.75);
            
            // Check if owner has UMKM Subsidy Law active
            const hasUmkmSubsidy = activeLaws.some(l => l.effect === 'UMKM_SUBSIDY' && l.passedByPlayerId === owner.id);
            const rentBonus = hasUmkmSubsidy ? 1.35 : 1;
            const hasKonohaBoom = owner.konohaBuffs?.some(b => b.type === 'INFLATION_BOOM');
            const konohaRentMultiplier = hasKonohaBoom ? 1.25 : 1;
            const combinedRentMultiplier = rentBonus * konohaRentMultiplier;
            const rentCost = Math.round((tile.rent || 0) * inflationFactor * levelMultiplier * combinedRentMultiplier);

            soundManager.playBuzzer();

            // Check if player has enough money to pay rent
            if (player.cash < rentCost) {
              if (player.isAi) {
                // AI automatic liquidation logic: sell properties until cash >= rentCost or exhausted
                const aiProperties = perimeterTiles.filter(t => t.ownerId === player.id);
                let currentAiCash = player.cash;
                const soldPropertyIds: number[] = [];
                const soldPropertyTitles: string[] = [];

                for (const prop of aiProperties) {
                  if (currentAiCash >= rentCost) break;
                  const sellVal = calculatePropertySellValue(prop, macro);
                  currentAiCash += sellVal;
                  soldPropertyIds.push(prop.id);
                  soldPropertyTitles.push(prop.name);
                }

                if (currentAiCash >= rentCost) {
                  // AI survived by selling properties!
                  setPerimeterTiles(prev => prev.map(t => soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t));
                  setPlayers(prev => prev.map(p => {
                    if (p.id === player.id) {
                      const updated = {
                        ...p,
                        cash: currentAiCash - rentCost,
                        ownedProperties: p.ownedProperties.filter(id => !soldPropertyIds.includes(id)),
                        stress: Math.min(100, p.stress + 10),
                        stats: { ...p.stats, totalRentPaid: p.stats.totalRentPaid + rentCost }
                      };
                      checkStressThreshold(updated);
                      return updated;
                    }
                    if (p.id === owner.id) {
                      return {
                        ...p,
                        cash: p.cash + rentCost,
                        stats: { ...p.stats, totalRentEarned: p.stats.totalRentEarned + rentCost }
                      };
                    }
                    return p;
                  }));
                  addLog(`${player.name} (AI) terpaksa menjual aset (${soldPropertyTitles.join(', ')}) untuk melunasi sewa ${formatRupiah(rentCost)} ke ${owner.name}!`, 'DANGER', player.id);
                  return;
                } else {
                  // AI cannot pay even with all properties sold
                  const remainingPaid = currentAiCash;
                  if (remainingPaid > 0) {
                    setPlayers(prev => prev.map(p => {
                      if (p.id === owner.id) {
                        return { ...p, cash: p.cash + remainingPaid, stats: { ...p.stats, totalRentEarned: p.stats.totalRentEarned + remainingPaid } };
                      }
                      return p;
                    }));
                  }
                  handlePlayerBankruptcy(player, `Tidak mampu membayar sewa ${formatRupiah(rentCost)} kepada ${owner.name}`);
                  return;
                }
              } else {
                // Human player: open RentCrisisModal to offer asset liquidation choices!
                setRentCrisis({
                  payer: player,
                  owner,
                  tile,
                  rentCost
                });
                return;
              }
            }

            // If payer is Human player, trigger Manual Rent Payment Animation Modal!
            if (!player.isAi) {
              setManualRentData({
                payer: player,
                owner,
                tile,
                rentCost,
                multiplier: combinedRentMultiplier
              });
              return;
            }

            // Normal rent payment for AI player
            setPlayers(prev => prev.map(p => {
              if (p.id === player.id) {
                const updated = {
                  ...p,
                  cash: p.cash - rentCost,
                  stress: Math.min(100, p.stress + 10),
                  stats: { ...p.stats, totalRentPaid: p.stats.totalRentPaid + rentCost }
                };
                checkStressThreshold(updated);
                return updated;
              }
              if (p.id === owner.id) {
                return {
                  ...p,
                  cash: p.cash + rentCost,
                  stats: { ...p.stats, totalRentEarned: p.stats.totalRentEarned + rentCost }
                };
              }
              return p;
            }));

            addLog(`${player.name} membayar sewa ${formatRupiah(rentCost)} kepada ${owner.name} untuk ${tile.name}!`, 'CASH', player.id);
          }
        }
        break;
      }

      case 'DILEMA_CARD': {
        // Draw Random Dilemma Card
        soundManager.playCardDraw();
        const randomCard = DILEMMA_CARDS[Math.floor(Math.random() * DILEMMA_CARDS.length)];
        setActiveDilemmaCard(randomCard);
        break;
      }

      case 'TAX_BILL': {
        // Check if player has UU Bebas Pungli / Plat Sakti
        const hasPlatSakti = activeLaws.some(l => l.effect === 'FREE_PARKING' && l.passedByPlayerId === player.id);
        if (hasPlatSakti) {
          addLog(`${player.name} menggunakan Plat Sakti DPR/RF! Kebal dari pungli & denda di ${tile.name}.`, 'POLITIC', player.id);
          return;
        }

        // Check if player has Takdir Konoha INFLATION_REDUCTION (Operasi Pasar SPHP & Subsidi Energi)
        const hasKonohaSubsidy = player.konohaBuffs?.some(b => b.type === 'INFLATION_REDUCTION');
        if (hasKonohaSubsidy) {
          addLog(`🍃 SUBSIDI PANGAN & ENERGI KONOHA! ${player.name} dibebaskan dari tagihan retribusi ${tile.name}!`, 'POLITIC', player.id);
          return;
        }

        const inflationFactor = 1 + (macro.inflationRate / 100);
        let billAmount = 500_000;
        if (tile.id === 4) billAmount = 500_000; // Razia
        else if (tile.id === 6) billAmount = 150_000; // Parkir
        else if (tile.id === 8) billAmount = 1_200_000; // Listrik
        else if (tile.id === 12) billAmount = 900_000; // Pinjol
        else if (tile.id === 13) billAmount = 400_000; // COD
        else if (tile.id === 17) billAmount = 800_000; // Tapera
        else if (tile.id === 19) billAmount = 1_500_000; // Bea Cukai
        else if (tile.id === 26) billAmount = 650_000; // Ormas

        // Check if player has RUPIAH_STRENGTHEN discount
        if (player.konohaBuffs?.some(b => b.type === 'RUPIAH_STRENGTHEN')) {
          billAmount = Math.round(billAmount * 0.5);
        }

        const adjustedBill = Math.round(billAmount * inflationFactor);
        soundManager.playBuzzer();

        // Check if player can afford the bill
        if (player.cash < adjustedBill) {
          if (player.isAi) {
            const aiOwnedTiles = perimeterTiles.filter(t => t.ownerId === player.id);
            let currentCash = player.cash;
            const soldPropertyIds: number[] = [];
            const soldPropertyTitles: string[] = [];
            for (const prop of aiOwnedTiles) {
              if (currentCash >= adjustedBill) break;
              const sellVal = calculatePropertySellValue(prop, macro);
              currentCash += sellVal;
              soldPropertyIds.push(prop.id);
              soldPropertyTitles.push(prop.name);
            }
            if (currentCash >= adjustedBill) {
              setPerimeterTiles(prev => prev.map(t => soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t));
              addLog(`${player.name} (AI) terpaksa menjual aset (${soldPropertyTitles.join(', ')}) untuk membayar tagihan ${tile.name}!`, 'DANGER', player.id);
              setPlayers(prev => prev.map(p => p.id === player.id ? {
                ...p,
                cash: currentCash - adjustedBill,
                ownedProperties: p.ownedProperties.filter(id => !soldPropertyIds.includes(id)),
                stress: Math.min(100, p.stress + 10)
              } : p));
              return;
            } else {
              handlePlayerBankruptcy(player, `Tidak sanggup melunasi tagihan/denda ${tile.name} sebesar ${formatRupiah(adjustedBill)}`);
              return;
            }
          } else {
            // Human player: open crisis modal to liquidate property
            setRentCrisis({
              crisisType: 'TILE_BILL',
              payer: player,
              amountDue: adjustedBill,
              title: tile.name,
              subtitle: 'KRISIS KAS TUNAI · TAGIHAN FASILITAS PUBLIK',
              description: `Anda terkena tagihan/retribusi di ${tile.name} sebesar ${formatRupiah(adjustedBill)}. Saldo kas tidak mencukupi, jual aset properti untuk melunasi tagihan ini.`,
              causeDesc: `tagihan ${tile.name}`,
              recipientName: tile.name,
              recipientAvatar: '🏢',
              onPaySuccess: (updatedPayer) => {
                setPlayers(prev => prev.map(p => p.id === updatedPayer.id ? {
                  ...p,
                  cash: p.cash - adjustedBill,
                  stress: Math.min(100, p.stress + 10)
                } : p));
                addLog(`${updatedPayer.name} melunasi tagihan di ${tile.name} sebesar ${formatRupiah(adjustedBill)}!`, 'CASH', updatedPayer.id);
              }
            });
            return;
          }
        }

        setPlayers(prev => prev.map(p => {
          if (p.id === player.id) {
            const updated = {
              ...p,
              cash: p.cash - adjustedBill,
              stress: Math.min(100, p.stress + 10)
            };
            checkStressThreshold(updated);
            return updated;
          }
          return p;
        }));

        addLog(`${player.name} terkena tagihan/denda di ${tile.name} sebesar ${formatRupiah(adjustedBill)}! Stres +10%.`, 'DANGER', player.id);
        break;
      }

      case 'CORRUPTION_GATE': {
        // Portal to Corruption Route
        setShowCorruptionGate(true);
        break;
      }

      case 'PARLIAMENT_SENAYAN': {
        // Gedung DPR RI Senayan
        soundManager.playCash();
        setShowParliament(true);
        break;
      }

      case 'BIROKRASI_CHECK': {
        // Kelurahan Dukcapil
        if (player.archetypeId === 'pak_joko_asn') {
          addLog(`${player.name} (Pak Joko ASN) punya akses orang dalam di Dukcapil! Bebas dari kerumitan birokrasi.`, 'INFO', player.id);
        } else {
          soundManager.playBuzzer();
          if (player.cash < 3_000_000) {
            const caloFee = 3_000_000;
            if (player.isAi) {
              const aiOwnedTiles = perimeterTiles.filter(t => t.ownerId === player.id);
              let currentCash = player.cash;
              const soldPropertyIds: number[] = [];
              const soldPropertyTitles: string[] = [];
              for (const prop of aiOwnedTiles) {
                if (currentCash >= caloFee) break;
                const sellVal = calculatePropertySellValue(prop, macro);
                currentCash += sellVal;
                soldPropertyIds.push(prop.id);
                soldPropertyTitles.push(prop.name);
              }
              if (currentCash >= caloFee) {
                setPerimeterTiles(prev => prev.map(t => soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t));
                addLog(`${player.name} (AI) terpaksa menjual aset (${soldPropertyTitles.join(', ')}) untuk bayar calo Dukcapil Rp 3.000.000!`, 'DANGER', player.id);
                setPlayers(prev => prev.map(p => p.id === player.id ? {
                  ...p,
                  cash: currentCash - caloFee,
                  ownedProperties: p.ownedProperties.filter(id => !soldPropertyIds.includes(id)),
                  stress: Math.min(100, p.stress + 15)
                } : p));
                return;
              } else {
                handlePlayerBankruptcy(player, 'Tidak sanggup membayar calo administrasi di Dukcapil Rp 3.000.000');
                return;
              }
            } else {
              setRentCrisis({
                crisisType: 'BIROKRASI',
                payer: player,
                amountDue: caloFee,
                title: 'Kelurahan Dukcapil · Calo Administrasi',
                subtitle: 'KRISIS KAS TUNAI · BIAYA BIROKRASI',
                description: `Blangko e-KTP habis! Anda harus membayar jasa calo darurat Rp 3.000.000. Jual aset tanah untuk melunasi biaya dan melanjutkan perjalanan.`,
                causeDesc: 'calo administrasi di Dukcapil Rp 3.000.000',
                recipientName: 'Oknum Calo Dukcapil',
                recipientAvatar: '🏛️',
                onPaySuccess: (updatedPayer) => {
                  setPlayers(prev => prev.map(p => p.id === updatedPayer.id ? {
                    ...p,
                    cash: p.cash - caloFee,
                    stress: Math.min(100, p.stress + 15)
                  } : p));
                  addLog(`Blangko e-KTP diperoleh! ${updatedPayer.name} melunasi calo Rp 3.000.000 dan stres naik +15%.`, 'INFO', updatedPayer.id);
                }
              });
              return;
            }
          }
          setPlayers(prev => prev.map(p => {
            if (p.id === player.id) {
              const updated = {
                ...p,
                cash: p.cash - 3_000_000,
                stress: Math.min(100, p.stress + 15)
              };
              checkStressThreshold(updated);
              return updated;
            }
            return p;
          }));
          addLog(`Blangko e-KTP habis! ${player.name} terpaksa bayar calo Rp 3.000.000 dan stres naik +15%.`, 'INFO', player.id);
        }
        break;
      }

      case 'EVENT_MUSIBAH': {
        soundManager.playSirenOTT();
        const eventData = {
          type: 'MUSIBAH' as const,
          cardsPool: MUSIBAH_EVENT_CARDS,
          targetPlayer: player
        };
        activeDrawCardEventRef.current = eventData;
        setActiveDrawCardEvent(eventData);
        break;
      }

      case 'EVENT_TAKDIR': {
        soundManager.playCash();
        const eventData = {
          type: 'TAKDIR' as const,
          cardsPool: TAKDIR_EVENT_CARDS,
          targetPlayer: player
        };
        activeDrawCardEventRef.current = eventData;
        setActiveDrawCardEvent(eventData);
        break;
      }

      case 'BANSOS_LUCK': {
        soundManager.playCash();
        setPlayers(prev => prev.map(p => p.id === player.id ? {
          ...p,
          cash: p.cash + 15_000_000,
          stress: Math.max(0, p.stress - 10)
        } : p));
        addLog(`Rezeki nomplok! ${player.name} dapat Bansos Beras & Tunai senilai Rp 15 Jt dan Stres reda.`, 'CASH', player.id);
        break;
      }

      case 'PRISON_SUKAMISKIN': {
        addLog(`${player.name} mengunjungi Lapas Sukamiskin untuk membesuk rekan sejawat di ruang VIP.`, 'INFO', player.id);
        break;
      }
    }
  };

  // Rent Crisis Handlers for Asset Liquidation
  const handleSellPropertyForRent = (tileId: number, sellValue: number) => {
    if (!rentCrisis) return;
    const soldTile = perimeterTiles.find(t => t.id === tileId);
    setPerimeterTiles(prev => prev.map(t => t.id === tileId ? { ...t, ownerId: null, level: 1 } : t));
    setPlayers(prev => prev.map(p => {
      if (p.id === rentCrisis.payer.id) {
        const updated = {
          ...p,
          cash: p.cash + sellValue,
          ownedProperties: p.ownedProperties.filter(id => id !== tileId)
        };
        setRentCrisis(prevCrisis => prevCrisis ? { ...prevCrisis, payer: updated } : null);
        return updated;
      }
      return p;
    }));
    const purpose = rentCrisis.title ? rentCrisis.title : 'utang sewa';
    addLog(`${rentCrisis.payer.name} menjual aset ${soldTile?.certificateTitle || soldTile?.name || 'Surat Tanah'} seharga ${formatRupiah(sellValue)} untuk melunasi ${purpose}.`, 'CASH', rentCrisis.payer.id);
  };

  const handleSellAllPropertiesForRent = (sales: { tileId: number; sellValue: number }[]) => {
    if (!rentCrisis) return;
    const soldIds = sales.map(s => s.tileId);
    const totalEarned = sales.reduce((a, b) => a + b.sellValue, 0);
    setPerimeterTiles(prev => prev.map(t => soldIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t));
    setPlayers(prev => prev.map(p => {
      if (p.id === rentCrisis.payer.id) {
        const updated = {
          ...p,
          cash: p.cash + totalEarned,
          ownedProperties: p.ownedProperties.filter(id => !soldIds.includes(id))
        };
        setRentCrisis(prevCrisis => prevCrisis ? { ...prevCrisis, payer: updated } : null);
        return updated;
      }
      return p;
    }));
    const purpose = rentCrisis.title ? rentCrisis.title : 'utang sewa';
    addLog(`${rentCrisis.payer.name} melikuidasi seluruh asetnya (+${formatRupiah(totalEarned)}) untuk melunasi ${purpose}.`, 'DANGER', rentCrisis.payer.id);
  };

  const handlePayRentFromCrisis = () => {
    if (!rentCrisis) return;
    const { payer, owner, rentCost, tile, onPaySuccess, amountDue } = rentCrisis;

    if (onPaySuccess) {
      const currentPayer = players.find(p => p.id === payer.id) || payer;
      onPaySuccess(currentPayer);
      setRentCrisis(null);
      return;
    }

    const cost = amountDue ?? rentCost ?? 0;
    setPlayers(prev => prev.map(p => {
      if (p.id === payer.id) {
        const updated = {
          ...p,
          cash: p.cash - cost,
          stress: Math.min(100, p.stress + 10),
          stats: { ...p.stats, totalRentPaid: p.stats.totalRentPaid + (rentCost || cost) }
        };
        checkStressThreshold(updated);
        return updated;
      }
      if (owner && p.id === owner.id) {
        return {
          ...p,
          cash: p.cash + cost,
          stats: { ...p.stats, totalRentEarned: p.stats.totalRentEarned + cost }
        };
      }
      return p;
    }));
    if (owner && tile) {
      addLog(`${payer.name} melunasi sewa ${formatRupiah(cost)} kepada ${owner.name} untuk ${tile.name}!`, 'CASH', payer.id);
    } else {
      addLog(`${payer.name} melunasi kewajiban pembayaran ${formatRupiah(cost)}!`, 'CASH', payer.id);
    }
    setRentCrisis(null);
  };

  const handleBankruptcyFromRentCrisis = () => {
    if (!rentCrisis) return;
    const { payer, owner, rentCost, amountDue, causeDesc } = rentCrisis;
    const cost = amountDue ?? rentCost ?? 0;
    const remainingPaid = payer.cash;
    if (owner && remainingPaid > 0) {
      setPlayers(prev => prev.map(p => {
        if (p.id === owner.id) {
          return { ...p, cash: p.cash + remainingPaid, stats: { ...p.stats, totalRentEarned: p.stats.totalRentEarned + remainingPaid } };
        }
        return p;
      }));
    }
    const reason = causeDesc 
      ? `Tidak mampu melunasi ${causeDesc} (${formatRupiah(cost)})`
      : (owner ? `Tidak mampu membayar sewa ${formatRupiah(cost)} kepada ${owner.name}` : `Tidak mampu melunasi kewajiban ${formatRupiah(cost)}`);
    handlePlayerBankruptcy(payer, reason);
    setRentCrisis(null);
  };

  const handleUseSpecialCardForRent = (cardId: string) => {
    if (!rentCrisis) return;
    const { payer, owner, title } = rentCrisis;
    setPlayers(prev => prev.map(p => {
      if (p.id === payer.id) {
        return {
          ...p,
          specialCards: p.specialCards?.filter(c => c.id !== cardId)
        };
      }
      return p;
    }));
    addLog(`${payer.name} mengaktifkan Kartu Sakti Ordal! Bebas dari tagihan ${title || (owner ? `sewa milik ${owner.name}` : 'kewajiban')}.`, 'POLITIC', payer.id);
    setRentCrisis(null);
  };

  // Confirm Manual Rent Payment after Animation Finishes
  const handleConfirmManualRentPayment = () => {
    if (!manualRentData) return;
    const { payer, owner, tile, rentCost } = manualRentData;

    setPlayers(prev => prev.map(p => {
      if (p.id === payer.id) {
        const updated = {
          ...p,
          cash: p.cash - rentCost,
          stress: Math.min(100, p.stress + 10),
          stats: { ...p.stats, totalRentPaid: p.stats.totalRentPaid + rentCost }
        };
        checkStressThreshold(updated);
        return updated;
      }
      if (p.id === owner.id) {
        return {
          ...p,
          cash: p.cash + rentCost,
          stats: { ...p.stats, totalRentEarned: p.stats.totalRentEarned + rentCost }
        };
      }
      return p;
    }));

    addLog(`💸 ${payer.name} melunasi sewa ${formatRupiah(rentCost)} kepada ${owner.name} untuk properti ${tile.name}!`, 'CASH', payer.id);
    setManualRentData(null);
  };

  const handleUseSpecialCardForManualRent = (cardId: string) => {
    if (!manualRentData) return;
    const { payer, owner, tile } = manualRentData;
    setPlayers(prev => prev.map(p => {
      if (p.id === payer.id) {
        return {
          ...p,
          specialCards: p.specialCards?.filter(c => c.id !== cardId)
        };
      }
      return p;
    }));
    addLog(`🛡️ ${payer.name} mengaktifkan Kartu Ordal Sakti! Bebas 100% dari tagihan sewa properti ${tile.name} milik ${owner.name}!`, 'POLITIC', payer.id);
    setManualRentData(null);
  };

  // Buy Property
  const handleBuyProperty = () => {
    if (!activePlayer || activePlayer.isBankrupt) return;
    const currentTile = perimeterTiles.find(t => t.id === activePlayer.position);
    if (!currentTile || currentTile.actionType !== 'PROPERTY' || currentTile.ownerId) return;

    const inflationFactor = 1 + (macro.inflationRate / 100);
    const cost = Math.round((currentTile.price || 0) * inflationFactor);

    if (activePlayer.cash < cost) return;

    soundManager.playCash();

    // Deduct cash and assign owner
    setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
      ...p,
      cash: p.cash - cost,
      ownedProperties: [...p.ownedProperties, currentTile.id]
    } : p));

    setPerimeterTiles(prev => prev.map(t => t.id === currentTile.id ? {
      ...t,
      ownerId: activePlayer.id,
      level: 1
    } : t));

    addLog(`${activePlayer.name} membeli Surat Tanah ${currentTile.certificateTitle || currentTile.name} seharga ${formatRupiah(cost)}!`, 'CASH', activePlayer.id);
  };

  // Upgrade Property
  const handleUpgradeProperty = () => {
    if (!activePlayer || activePlayer.isBankrupt) return;
    const currentTile = perimeterTiles.find(t => t.id === activePlayer.position);
    if (!currentTile || currentTile.ownerId !== activePlayer.id) return;

    const currentLevel = currentTile.level || 1;
    if (currentLevel >= 3) return;

    const inflationFactor = 1 + (macro.inflationRate / 100);
    let upgradeDiscount = 0;
    if (activePlayer.konohaBuffs?.some(b => b.type === 'INTEREST_RATE_CUT')) {
      upgradeDiscount = Math.max(upgradeDiscount, 0.30); // 30% discount
    }
    if (activePlayer.konohaBuffs?.some(b => b.type === 'INFLATION_REDUCTION')) {
      upgradeDiscount = Math.max(upgradeDiscount, 0.20); // 20% discount
    }
    const baseUpgrade = (currentTile.upgradeCost || 0) * inflationFactor;
    const upgradeCost = Math.round(baseUpgrade * (1 - upgradeDiscount));

    if (activePlayer.cash < upgradeCost) return;

    soundManager.playCash();

    setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
      ...p,
      cash: p.cash - upgradeCost
    } : p));

    setPerimeterTiles(prev => prev.map(t => t.id === currentTile.id ? {
      ...t,
      level: currentLevel + 1
    } : t));

    const discountNote = upgradeDiscount > 0 ? ` (Diskon Takdir Konoha ${(upgradeDiscount * 100).toFixed(0)}%)` : '';
    addLog(`${activePlayer.name} meningkatkan cabang usaha ${currentTile.name} ke Tingkat ${currentLevel + 1}${discountNote}!`, 'CASH', activePlayer.id);
  };

  // Resolve Dilemma Card
  const handleChooseCardOption = (optionKey: 'optionA' | 'optionB') => {
    if (!activeDilemmaCard || !activePlayer || activePlayer.isBankrupt) return;

    const chosenOption = activeDilemmaCard[optionKey];
    if (chosenOption) {
      const stateContext = {
        players,
        activePlayerIndex,
        macro,
        tiles: perimeterTiles,
        activeLaws,
        round: cycleRound,
        maxRounds: 999,
        addLog,
        triggerBreakingNews: (news: BreakingNewsEvent) => setCurrentNews(news)
      };

      chosenOption.apply(activePlayer, stateContext);

      // Check bankruptcy or stress threshold after card choice
      if (activePlayer.cash < 0) {
        const deficit = Math.abs(activePlayer.cash);
        const ownedTiles = perimeterTiles.filter(t => t.ownerId === activePlayer.id);
        const totalLiquidation = ownedTiles.reduce((sum, t) => sum + calculatePropertySellValue(t, macro), 0);
        
        if (activePlayer.isAi) {
          if (totalLiquidation >= deficit) {
            let currentCash = activePlayer.cash;
            const soldPropertyIds: number[] = [];
            const soldPropertyTitles: string[] = [];
            for (const prop of ownedTiles) {
              if (currentCash >= 0) break;
              const sellVal = calculatePropertySellValue(prop, macro);
              currentCash += sellVal;
              soldPropertyIds.push(prop.id);
              soldPropertyTitles.push(prop.name);
            }
            setPerimeterTiles(prev => prev.map(t => soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t));
            addLog(`${activePlayer.name} (AI) menjual aset (${soldPropertyTitles.join(', ')}) seharga ${formatRupiah(currentCash - activePlayer.cash)} untuk memulihkan saldo akibat Dilema!`, 'DANGER', activePlayer.id);
            setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
              ...p,
              cash: currentCash,
              ownedProperties: p.ownedProperties.filter(id => !soldPropertyIds.includes(id))
            } : p));
          } else {
            handlePlayerBankruptcy(activePlayer, 'Konsekuensi Finansial Kartu Dilema Konoha');
          }
        } else {
          // Human player: open crisis modal to liquidate property for deficit!
          setRentCrisis({
            crisisType: 'DEBT',
            payer: { ...activePlayer, cash: 0 },
            amountDue: deficit,
            title: activeDilemmaCard?.title || 'Dilema Konoha',
            subtitle: 'KRISIS KAS TUNAI · KONSEKUENSI DILEMA',
            description: `Pilihan Dilema Konoha membebani kas sebesar ${formatRupiah(deficit)}. Saldo kas Anda minus! Jual aset tanah untuk melunasi utang ini.`,
            causeDesc: 'konsekuensi finansial kartu Dilema',
            recipientName: 'Kas Negara & Risiko Kebijakan',
            recipientAvatar: '⚖️',
            onPaySuccess: (updatedPayer) => {
              setPlayers(prev => prev.map(p => p.id === updatedPayer.id ? {
                ...p,
                cash: p.cash - deficit
              } : p));
              addLog(`✅ ${updatedPayer.name} melunasi kewajiban akibat Dilema Konoha sebesar ${formatRupiah(deficit)}!`, 'CASH', updatedPayer.id);
            }
          });
        }
      } else {
        checkStressThreshold(activePlayer);
      }

      setPlayers([...players]);
    }

    setActiveDilemmaCard(null);

    // End turn for AI player after dilemma choice resolves
    if (activePlayer?.isAi) {
      setTimeout(() => {
        handleEndTurn();
      }, 1200);
    }
  };

  // Handle outcome from 3D DrawCardModal (Musibah / Takdir with 3-tier dice roll)
  const handleConfirmDrawCardOutcome = (outcome: {
    card: EventOutcomeCard;
    diceValue: number;
    confiscatedTile: BoardTile | null;
    usedSpecialCardId?: string;
  }) => {
    const targetId = activeDrawCardEvent?.targetPlayer?.id || activeDrawCardEventRef.current?.targetPlayer?.id || activePlayer?.id;
    const target = players.find(p => p.id === targetId) || activeDrawCardEvent?.targetPlayer || activeDrawCardEventRef.current?.targetPlayer || activePlayer;
    if (!target) return;
    const { card, confiscatedTile, usedSpecialCardId } = outcome;

    // Confiscate land deed if state seized it
    if (confiscatedTile) {
      setPerimeterTiles(prev => prev.map(t => t.id === confiscatedTile.id ? { ...t, ownerId: null, level: 1 } : t));
      addLog(`🚨 SITA NEGARA! Surat Tanah ${confiscatedTile.certificateTitle || confiscatedTile.name} milik ${target.name} resmi dicabut & disita oleh Satgas BPN!`, 'DANGER', target.id);
    }

    if (usedSpecialCardId) {
      addLog(`🛡️ KARTU SAKTI AKTIF! ${target.name} menggunakan kartu proteksi ordal sehingga selamat dari penyitaan tanah!`, 'POLITIC', target.id);
    }

    // Cash adjustment (taking inflation into account for penalties)
    let netCashChange = 0;
    if (card.cashChange < 0) {
      if (confiscatedTile) {
        netCashChange = 0; // Land deed was surrendered in lieu of cash penalty
      } else {
        const inflationFactor = 1 + (macro.inflationRate / 100);
        netCashChange = Math.round(card.cashChange * inflationFactor);
      }
    } else {
      netCashChange = card.cashChange;
    }

    const specialReward = card.specialRewardCard;

    // Check if player has sufficient cash for penalties
    if (netCashChange < 0) {
      const penalty = Math.abs(netCashChange);
      if (target.cash < penalty) {
        if (target.isAi) {
          const aiOwnedTiles = perimeterTiles.filter(t => t.ownerId === target.id);
          let currentCash = target.cash;
          const soldPropertyIds: number[] = [];
          const soldPropertyTitles: string[] = [];
          for (const prop of aiOwnedTiles) {
            if (currentCash >= penalty) break;
            const sellVal = calculatePropertySellValue(prop, macro);
            currentCash += sellVal;
            soldPropertyIds.push(prop.id);
            soldPropertyTitles.push(prop.name);
          }

          if (currentCash >= penalty) {
            setPerimeterTiles(prev => prev.map(t => soldPropertyIds.includes(t.id) ? { ...t, ownerId: null, level: 1 } : t));
            addLog(`${target.name} (AI) terpaksa menjual aset (${soldPropertyTitles.join(', ')}) seharga ${formatRupiah(currentCash - target.cash)} untuk melunasi kerugian ${card.title}!`, 'DANGER', target.id);

            setPlayers(prev => prev.map(p => {
              if (p.id === target.id) {
                let updatedProps = p.ownedProperties.filter(id => !soldPropertyIds.includes(id));
                if (confiscatedTile) updatedProps = updatedProps.filter(id => id !== confiscatedTile.id);
                let updatedSpecialCards = [...(p.specialCards || [])];
                if (usedSpecialCardId) {
                  const idx = updatedSpecialCards.findIndex(c => c.id === usedSpecialCardId);
                  if (idx !== -1) updatedSpecialCards.splice(idx, 1);
                }
                if (specialReward) {
                  updatedSpecialCards.push({
                    ...specialReward,
                    id: `${specialReward.id}_${Date.now()}`
                  });
                }
                const updatedPlayer: Player = {
                  ...p,
                  cash: currentCash - penalty,
                  stress: Math.min(100, Math.max(0, p.stress + card.stressChange)),
                  politicalInfluence: Math.min(100, Math.max(0, p.politicalInfluence + (card.politicalChange || 0))),
                  ownedProperties: updatedProps,
                  specialCards: updatedSpecialCards,
                  stats: { ...p.stats, cardsDrawn: p.stats.cardsDrawn + 1 }
                };
                checkStressThreshold(updatedPlayer);
                return updatedPlayer;
              }
              return p;
            }));
            activeDrawCardEventRef.current = null;
            setActiveDrawCardEvent(null);
            if (target.isAi) {
              if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
              aiEndTurnTimerRef.current = setTimeout(() => {
                handleEndTurn();
              }, 1400);
            }
            return;
          } else {
            handlePlayerBankruptcy(target, `Bangkrut tidak sanggup membayar kerugian ${card.title} (${formatRupiah(penalty)})`);
            activeDrawCardEventRef.current = null;
            setActiveDrawCardEvent(null);
            if (target.isAi) {
              if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
              aiEndTurnTimerRef.current = setTimeout(() => {
                handleEndTurn();
              }, 1400);
            }
            return;
          }
        } else {
          // Human player: open financial crisis modal to allow property liquidation!
          setRentCrisis({
            crisisType: 'EVENT_LOSS',
            payer: target,
            amountDue: penalty,
            title: card.title,
            subtitle: 'KRISIS KAS TUNAI · PEMBAYARAN KERUGIAN PERISTIWA',
            description: `${card.description} Kerugian sebesar ${formatRupiah(penalty)} wajib dilunasi! Kas tunai Anda tidak mencukupi, silakan jual aset tanah Anda untuk menutup kerugian ini.`,
            causeDesc: `kerugian ${card.title}`,
            recipientName: card.categoryBadge || 'Kas Darurat & Derek Tol',
            recipientAvatar: card.icon || '🚗',
            onPaySuccess: (updatedPayer) => {
              setPlayers(prev => prev.map(p => {
                if (p.id === updatedPayer.id) {
                  let updatedProps = p.ownedProperties;
                  if (confiscatedTile) {
                    updatedProps = updatedProps.filter(id => id !== confiscatedTile.id);
                  }
                  let updatedSpecialCards = [...(p.specialCards || [])];
                  if (usedSpecialCardId) {
                    const idx = updatedSpecialCards.findIndex(c => c.id === usedSpecialCardId);
                    if (idx !== -1) updatedSpecialCards.splice(idx, 1);
                  }
                  if (specialReward) {
                    updatedSpecialCards.push({
                      ...specialReward,
                      id: `${specialReward.id}_${Date.now()}`
                    });
                  }
                  const finalCash = p.cash - penalty;
                  const finalStress = Math.min(100, Math.max(0, p.stress + card.stressChange));
                  const finalPol = Math.min(100, Math.max(0, p.politicalInfluence + (card.politicalChange || 0)));
                  const finalPlayer: Player = {
                    ...p,
                    cash: finalCash,
                    stress: finalStress,
                    politicalInfluence: finalPol,
                    ownedProperties: updatedProps,
                    specialCards: updatedSpecialCards,
                    stats: { ...p.stats, cardsDrawn: p.stats.cardsDrawn + 1 }
                  };
                  checkStressThreshold(finalPlayer);
                  return finalPlayer;
                }
                return p;
              }));
              addLog(`✅ ${updatedPayer.name} berhasil melunasi kerugian ${card.title} sebesar ${formatRupiah(penalty)}!`, 'CASH', updatedPayer.id);
            }
          });
          activeDrawCardEventRef.current = null;
          setActiveDrawCardEvent(null);
          return;
        }
      }
    }

    // Apply Kartu Takdir Konoha Permanent Macroeconomic Buff
    let konohaBuffInstance: KonohaMacroBuff | null = null;
    if (card.isKonohaCard && card.konohaBuffConfig) {
      const cfg = card.konohaBuffConfig;
      let newInflation = Number((macro.inflationRate + cfg.inflationDelta).toFixed(1));
      newInflation = Math.max(2.0, Math.min(22.0, newInflation));

      let newBiRate = Number((macro.biRate + cfg.biRateDelta).toFixed(2));
      newBiRate = Math.max(3.0, Math.min(12.0, newBiRate));

      let newUsd = macro.usdIdrRate + (cfg.usdIdrDelta || 0);
      newUsd = Math.max(14000, Math.min(19000, newUsd));

      let newTrend = macro.trend;
      if (newInflation > 10.0) newTrend = 'CRISIS';
      else if (newInflation > 7.0) newTrend = 'VOLATILE';
      else if (cfg.inflationDelta > 0.5) newTrend = 'RISING';
      else newTrend = 'STABLE';

      konohaBuffInstance = {
        id: `buff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        cardId: card.id,
        cardTitle: card.title,
        cardIcon: card.icon,
        drawnByPlayerId: target.id,
        drawnByPlayerName: target.name,
        drawnByPlayerColor: target.color,
        type: cfg.type,
        inflationDelta: cfg.inflationDelta,
        biRateDelta: cfg.biRateDelta,
        usdIdrDelta: cfg.usdIdrDelta,
        buffName: cfg.buffName,
        buffEffectDesc: cfg.buffEffectDesc,
        playerPerkText: cfg.playerPerkText,
        timestamp: `Putaran #${cycleRound}`
      };

      setMacro(prev => ({
        ...prev,
        inflationRate: newInflation,
        biRate: newBiRate,
        usdIdrRate: newUsd,
        trend: newTrend,
        activeKonohaBuffs: [...(prev.activeKonohaBuffs || []), konohaBuffInstance!]
      }));

      setMacroHistory(prev => [
        ...prev,
        {
          round: cycleRound,
          label: `P${cycleRound}🍃`,
          fullPeriod: `Putaran ${cycleRound} · Takdir Konoha (${cfg.buffName})`,
          inflationRate: newInflation,
          usdIdrRate: newUsd,
          biRate: newBiRate,
          trend: newTrend,
          note: `🍃 Takdir Konoha: ${cfg.buffName}`
        }
      ]);

      const infChangeStr = cfg.inflationDelta > 0 ? `+${cfg.inflationDelta}%` : `${cfg.inflationDelta}%`;
      const biChangeStr = cfg.biRateDelta > 0 ? `+${cfg.biRateDelta}%` : `${cfg.biRateDelta}%`;

      addLog(
        `🍃 TAKDIR KONOHA DIAKTIFKAN: ${target.name} menarik '${card.title}'! Buff makroekonomi permanen diterapkan: Inflasi ${infChangeStr} (kini ${newInflation}%), BI-Rate ${biChangeStr} (kini ${newBiRate}%). Perk: ${cfg.playerPerkText}`,
        'POLITIC',
        target.id
      );
    }

    setPlayers(prev => prev.map(p => {
      if (p.id === target.id) {
        let updatedProps = p.ownedProperties;
        if (confiscatedTile) {
          updatedProps = updatedProps.filter(id => id !== confiscatedTile.id);
        }

        let updatedSpecialCards = [...(p.specialCards || [])];
        if (usedSpecialCardId) {
          const idx = updatedSpecialCards.findIndex(c => c.id === usedSpecialCardId);
          if (idx !== -1) updatedSpecialCards.splice(idx, 1);
        }
        if (specialReward) {
          const newCardInstance: SpecialCardItem = {
            ...specialReward,
            id: `${specialReward.id}_${Date.now()}`
          };
          updatedSpecialCards.push(newCardInstance);
        }

        let updatedKonohaBuffs = [...(p.konohaBuffs || [])];
        if (konohaBuffInstance) {
          updatedKonohaBuffs.push(konohaBuffInstance);
        }

        const newCash = p.cash + netCashChange;
        const newStress = Math.min(100, Math.max(0, p.stress + card.stressChange));
        const newPol = Math.min(100, Math.max(0, p.politicalInfluence + (card.politicalChange || 0)));

        const updatedPlayer: Player = {
          ...p,
          cash: newCash,
          stress: newStress,
          politicalInfluence: newPol,
          ownedProperties: updatedProps,
          specialCards: updatedSpecialCards,
          konohaBuffs: updatedKonohaBuffs,
          stats: { ...p.stats, cardsDrawn: p.stats.cardsDrawn + 1 }
        };

        checkStressThreshold(updatedPlayer);

        return updatedPlayer;
      }
      return p;
    }));

    if (specialReward) {
      addLog(`🎁 KARTU SAKTI DIPEROLEH! ${target.name} menerima item berharga: ${specialReward.title}!`, 'POLITIC', target.id);
    }

    const tierDesc = outcome.diceValue <= 2 
      ? '🎲 DADU [1-2] TIER BERAT / REZEKI AKBAR' 
      : outcome.diceValue <= 4 
        ? '🎲 DADU [3-4] TIER SEDANG' 
        : '🎲 DADU [5-6] TIER RINGAN';
    const logType = card.eventType === 'MUSIBAH' ? 'DANGER' : 'CASH';
    addLog(`${tierDesc} • ${card.title}: ${card.headline} (${target.name})`, logType, target.id);

    activeDrawCardEventRef.current = null;
    setActiveDrawCardEvent(null);

    // End turn cleanly for AI players after card effects conclude
    if (target.isAi) {
      if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
      aiEndTurnTimerRef.current = setTimeout(() => {
        handleEndTurn();
      }, 1400);
    }
  };

  // Corruption Audit Resolve (BPK & KPK)
  const handleCorruptionAuditResolve = (caught: boolean) => {
    setShowCorruptionAudit(false);
    if (!activePlayer || activePlayer.isBankrupt) return;

    if (caught) {
      soundManager.playSirenOTT();

      // KPK OTT Encounter
      const bribeRequired = 20_000_000;
      if (activePlayer.isAi) {
        if (activePlayer.cash >= bribeRequired) {
          soundManager.playCash();
          setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
            ...p,
            cash: p.cash - bribeRequired,
            kpkSuspicionLevel: 10,
            isInCorruptionRoute: false,
            position: 21 // safely arrives at Senayan
          } : p));
          addLog(`${activePlayer.name} menyuap oknum penyidik KPK sebesar Rp 20.000.000! Selamat dari vonis penjara dan lolos ke DPR Senayan.`, 'CASH', activePlayer.id);
        } else {
          // AI sent to jail
          setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
            ...p,
            cash: Math.round(p.cash * 0.5),
            stress: Math.min(100, p.stress + 50),
            inJail: true,
            jailTurnsLeft: 2,
            isInCorruptionRoute: false,
            position: 14,
            kpkSuspicionLevel: 10,
            stats: { ...p.stats, timesInJail: p.stats.timesInJail + 1 }
          } : p));
          addLog(`${activePlayer.name} (AI) tertangkap OTT KPK & saldo tidak cukup suap! Dijebloskan ke Lapas Sukamiskin.`, 'DANGER', activePlayer.id);
        }

        if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
        aiEndTurnTimerRef.current = setTimeout(() => {
          handleEndTurn();
        }, 1400);
      } else {
        // Human player gets the prompt to pay bribe or refuse
        setShowKpkBribe(true);
      }
    } else {
      soundManager.playVictory();
      // Escaped successfully!
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
        ...p,
        isInCorruptionRoute: false,
        position: 21, // Sent to DPR Senayan safely
        politicalInfluence: Math.min(100, p.politicalInfluence + 20),
        kpkSuspicionLevel: Math.max(0, p.kpkSuspicionLevel - 20)
      } : p));

      addLog(`LOLOS CUCI UANG! ${activePlayer.name} berhasil mengamankan aset korupsi dan melenggang ke Gedung DPR Senayan!`, 'POLITIC', activePlayer.id);

      if (activePlayer.isAi) {
        if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
        aiEndTurnTimerRef.current = setTimeout(() => {
          handleEndTurn();
        }, 1400);
      }
    }
  };

  // Pay KPK Bribe Handler
  const handlePayKpkBribe = () => {
    setShowKpkBribe(false);
    if (!activePlayer || activePlayer.isBankrupt) return;
    const bribeAmount = 20_000_000;
    if (activePlayer.cash < bribeAmount) {
      // Offer crisis modal to sell properties if they want to pay the bribe
      const ownedTiles = perimeterTiles.filter(t => t.ownerId === activePlayer.id);
      const totalLiquidation = ownedTiles.reduce((sum, t) => sum + calculatePropertySellValue(t, macro), 0);
      if (activePlayer.cash + totalLiquidation >= bribeAmount) {
        setRentCrisis({
          crisisType: 'KPK_BRIBE',
          payer: activePlayer,
          amountDue: bribeAmount,
          title: 'OTT KPK · Uang Pengamanan Perkara',
          subtitle: 'KRISIS KAS TUNAI · SUAP OKNUM PENYIDIK',
          description: `Untuk menghindari vonis penjara Lapas Sukamiskin, Anda harus membayar uang suap Rp 20.000.000. Jual aset tanah Anda untuk melunasi uang damai ini.`,
          causeDesc: 'suap OTT KPK Rp 20.000.000',
          recipientName: 'Oknum Penyidik KPK',
          recipientAvatar: '🚨',
          onPaySuccess: (updatedPayer) => {
            soundManager.playCash();
            setPlayers(prev => prev.map(p => p.id === updatedPayer.id ? {
              ...p,
              cash: p.cash - bribeAmount,
              isInCorruptionRoute: false,
              position: 21,
              kpkSuspicionLevel: 10,
              stress: Math.max(0, p.stress - 10)
            } : p));
            addLog(`${updatedPayer.name} membayar uang damai Rp 20.000.000 ke oknum penyidik! Bebas dari OTT KPK dan tiba di DPR Senayan.`, 'CASH', updatedPayer.id);
          }
        });
        return;
      } else {
        // Cannot afford bribe even with properties -> send to jail instead of unfair elimination
        handleRefuseKpkBribe();
        return;
      }
    }

    soundManager.playCash();
    setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
      ...p,
      cash: p.cash - bribeAmount,
      isInCorruptionRoute: false,
      position: 21, // Sent to DPR Senayan safely
      kpkSuspicionLevel: 10,
      stress: Math.max(0, p.stress - 10)
    } : p));

    addLog(`${activePlayer.name} membayar uang suap Rp 20.000.000 ke oknum penyidik! Bebas dari OTT KPK dan tiba di DPR Senayan.`, 'CASH', activePlayer.id);
  };

  // Refuse KPK Bribe Handler
  const handleRefuseKpkBribe = () => {
    setShowKpkBribe(false);
    if (!activePlayer || activePlayer.isBankrupt) return;

    // Refused bribe: sent to Lapas Sukamiskin, 50% cash seized, 2 turns locked
    setPlayers(prev => prev.map(p => {
      if (p.id === activePlayer.id) {
        const updated = {
          ...p,
          cash: Math.round(p.cash * 0.5),
          stress: Math.min(100, p.stress + 50),
          inJail: true,
          jailTurnsLeft: 2,
          isInCorruptionRoute: false,
          position: 14,
          kpkSuspicionLevel: 10,
          stats: { ...p.stats, timesInJail: p.stats.timesInJail + 1 }
        };
        checkStressThreshold(updated);
        return updated;
      }
      return p;
    }));

    addLog(`${activePlayer.name} menolak menyuap oknum KPK! Diseret ke Lapas Sukamiskin dan disita 50% kekayaan tunai.`, 'DANGER', activePlayer.id);
  };

  // Pay Jail Bribe
  const handlePayJailBribe = () => {
    if (!activePlayer || !activePlayer.inJail || activePlayer.isBankrupt) return;
    const bribeAmount = 20_000_000;
    if (activePlayer.cash < bribeAmount) return;

    soundManager.playCash();
    setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
      ...p,
      cash: p.cash - bribeAmount,
      inJail: false,
      jailTurnsLeft: 0,
      stress: Math.max(0, p.stress - 15)
    } : p));

    addLog(`${activePlayer.name} menyuap sipir Lapas sebesar Rp 20 Jt! Mendapat remisi kilat dan langsung bebas.`, 'CASH', activePlayer.id);
  };

  // Money Laundering Handlers in Corruption Route
  const handleLaunderBuyLuxury = (property: LuxuryLaunderProperty) => {
    setShowMoneyLaundering(false);
    if (!activePlayer || activePlayer.isBankrupt) return;

    if (activePlayer.cash < property.launderPrice) {
      addLog(`${activePlayer.name} gagal membeli aset ${property.shortName} karena saldo tunai tidak mencukupi.`, 'DANGER', activePlayer.id);
      return;
    }

    soundManager.playCash();
    setPlayers(prev => prev.map(p => {
      if (p.id === activePlayer.id) {
        const updated = {
          ...p,
          cash: p.cash - property.launderPrice,
          ownedProperties: [...p.ownedProperties, property.id],
          kpkSuspicionLevel: Math.min(100, p.kpkSuspicionLevel + property.kpkRiskIncrease),
          stress: Math.max(0, p.stress - property.stressRelief),
          stats: {
            ...p.stats,
            totalCorruptionGains: p.stats.totalCorruptionGains + (property.normalPrice - property.launderPrice)
          }
        };
        checkStressThreshold(updated);
        return updated;
      }
      return p;
    }));

    setLuxuryTiles(prev => prev.map(t => t.id === property.id ? { ...t, ownerId: activePlayer.id, level: 1 } : t));

    addLog(`💎 PENCUCIAN UANG BERHASIL! ${activePlayer.name} membeli "${property.name}" dengan potongan pajak spesial seharga ${formatRupiah(property.launderPrice)} (${property.taxSavingsText})! Radar KPK naik drastis +${property.kpkRiskIncrease}%.`, 'CASH', activePlayer.id);

    if (activePlayer.isAi) {
      if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
      aiEndTurnTimerRef.current = setTimeout(() => {
        handleEndTurn();
      }, 1400);
    }
  };

  const handleLaunderBuyPerimeter = (tile: BoardTile, discountedCost: number, kpkRisk: number) => {
    setShowMoneyLaundering(false);
    if (!activePlayer || activePlayer.isBankrupt) return;

    if (activePlayer.cash < discountedCost) {
      addLog(`${activePlayer.name} gagal membeli aset ${tile.name} karena saldo tidak mencukupi.`, 'DANGER', activePlayer.id);
      return;
    }

    soundManager.playCash();
    setPlayers(prev => prev.map(p => {
      if (p.id === activePlayer.id) {
        const updated = {
          ...p,
          cash: p.cash - discountedCost,
          ownedProperties: [...p.ownedProperties, tile.id],
          kpkSuspicionLevel: Math.min(100, p.kpkSuspicionLevel + kpkRisk)
        };
        return updated;
      }
      return p;
    }));

    setPerimeterTiles(prev => prev.map(t => t.id === tile.id ? { ...t, ownerId: activePlayer.id, level: 1 } : t));

    addLog(`🏢 PENCUCIAN UANG ASET PUBLIK: ${activePlayer.name} memborong ${tile.certificateTitle || tile.name} dengan diskon pajak 40% seharga ${formatRupiah(discountedCost)}! Radar deteksi KPK bertambah +${kpkRisk}%.`, 'CASH', activePlayer.id);

    if (activePlayer.isAi) {
      if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
      aiEndTurnTimerRef.current = setTimeout(() => {
        handleEndTurn();
      }, 1400);
    }
  };

  const handleSkipLaundering = () => {
    setShowMoneyLaundering(false);
    if (activePlayer) {
      addLog(`${activePlayer.name} memilih tidak mencuci uang di petak ini demi menghindari risiko radar deteksi KPK.`, 'INFO', activePlayer.id);
    }

    if (activePlayer?.isAi) {
      if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
      aiEndTurnTimerRef.current = setTimeout(() => {
        handleEndTurn();
      }, 1200);
    }
  };

  // Parliamentary Debate Veto Handler
  const handleVetoLaw = (proposal: LawProposal, vetoingPlayer: Player, usedSpecialCardId?: string) => {
    soundManager.playGavel();
    soundManager.playBuzzer();

    setPlayers(prev => prev.map(p => {
      if (p.id === vetoingPlayer.id) {
        let updatedCards = p.specialCards || [];
        if (usedSpecialCardId) {
          const idx = updatedCards.findIndex(c => c.id === usedSpecialCardId);
          if (idx !== -1) {
            updatedCards = updatedCards.filter((_, i) => i !== idx);
          }
        }
        return {
          ...p,
          politicalInfluence: Math.min(100, p.politicalInfluence + 15),
          specialCards: updatedCards
        };
      }
      if (activePlayer && p.id === activePlayer.id) {
        return {
          ...p,
          politicalInfluence: Math.max(0, p.politicalInfluence - 10)
        };
      }
      return p;
    }));

    addLog(`🚨 INTERUPSI PARLEMEN BERHASIL! Fraksi ${vetoingPlayer.name} berhasil membatalkan pengesahan RUU "${proposal.title}" melalui perdebatan sidang! (${activePlayer?.name} -10 Modal Politik, ${vetoingPlayer.name} +15 Modal Politik).`, 'POLITIC', vetoingPlayer.id);
    setShowParliament(false);

    if (activePlayer?.isAi) {
      if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
      aiEndTurnTimerRef.current = setTimeout(() => {
        handleEndTurn();
      }, 1400);
    }
  };

  // Pass Public Law in DPR Senayan (Solo or Coalition)
  const handlePassLaw = (proposal: LawProposal, coalitionPartner?: Player) => {
    if (!activePlayer || activePlayer.isBankrupt) return;

    const totalInfluence = activePlayer.politicalInfluence + (coalitionPartner ? coalitionPartner.politicalInfluence : 0);
    if (totalInfluence < proposal.requiredInfluence) return;

    soundManager.playCash();

    // Deduct political influence
    if (coalitionPartner) {
      let deductA = Math.min(activePlayer.politicalInfluence, Math.ceil(proposal.requiredInfluence / 2));
      let deductB = proposal.requiredInfluence - deductA;
      if (coalitionPartner.politicalInfluence < deductB) {
        deductB = coalitionPartner.politicalInfluence;
        deductA = proposal.requiredInfluence - deductB;
      }

      setPlayers(prev => prev.map(p => {
        if (p.id === activePlayer.id) {
          return { ...p, politicalInfluence: Math.max(0, p.politicalInfluence - deductA) };
        }
        if (p.id === coalitionPartner.id) {
          return { ...p, politicalInfluence: Math.max(0, p.politicalInfluence - deductB) };
        }
        return p;
      }));

      addLog(`🤝 KOALISI PARLEMEN TERBENTUK: ${activePlayer.name} (-${deductA} Poin) & ${coalitionPartner.name} (-${deductB} Poin) menggabungkan kuorum mengesahkan "${proposal.title}"!`, 'POLITIC', activePlayer.id);
    } else {
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
        ...p,
        politicalInfluence: p.politicalInfluence - proposal.requiredInfluence
      } : p));
    }

    // 1. PROGRESSIVE_TAX_DRASTIC: Drastic 25% Progressive Wealth Tax on all non-coalition rivals
    if (proposal.effectType === 'PROGRESSIVE_TAX_DRASTIC') {
      let totalTaxCollected = 0;
      const breakdownLogs: string[] = [];
      const nonCoalitionIds = players
        .filter(p => p.id !== activePlayer.id && p.id !== coalitionPartner?.id && !p.isBankrupt)
        .map(p => p.id);

      setPlayers(prev => {
        // Collect 25% from rivals
        const updated = prev.map(p => {
          if (nonCoalitionIds.includes(p.id) && p.cash >= 1_000_000) {
            const tax = Math.round(p.cash * 0.25);
            totalTaxCollected += tax;
            breakdownLogs.push(`${p.name} (-${formatRupiah(tax)})`);
            const updatedP = {
              ...p,
              cash: p.cash - tax,
              stress: Math.min(100, p.stress + 20)
            };
            checkStressThreshold(updatedP);
            return updatedP;
          }
          return p;
        });

        // Split tax collection between coalition partners (50:50) or give 100% to activePlayer
        const shareA = coalitionPartner ? Math.ceil(totalTaxCollected / 2) : totalTaxCollected;
        const shareB = coalitionPartner ? Math.floor(totalTaxCollected / 2) : 0;

        return updated.map(p => {
          if (p.id === activePlayer.id) {
            return { ...p, cash: p.cash + shareA };
          }
          if (coalitionPartner && p.id === coalitionPartner.id) {
            return { ...p, cash: p.cash + shareB };
          }
          return p;
        });
      });

      if (totalTaxCollected > 0) {
        addLog(`⚖️ PAJAK PROGRESIF DRASTIS BERLAKU: Total ${formatRupiah(totalTaxCollected)} disita dari rival (${breakdownLogs.join(', ')}). ${coalitionPartner ? `Masing-masing anggota koalisi mengantongi ${formatRupiah(Math.ceil(totalTaxCollected / 2))}!` : `Disetor ke kas ${activePlayer.name}!`}`, 'POLITIC', activePlayer.id);
      } else {
        addLog(`UU Pajak Progresif diberlakukan! Tidak ada rival di luar koalisi dengan saldo tunai mencukupi.`, 'INFO', activePlayer.id);
      }
    } 
    // 2. ASSET_CONFISCATION_ACT: Confiscate best land deed from wealthiest non-coalition rival + Rp 25.000.000 fine
    else if (proposal.effectType === 'ASSET_CONFISCATION_ACT') {
      const nonCoalitionRivals = players.filter(p => p.id !== activePlayer.id && p.id !== coalitionPartner?.id && !p.isBankrupt);
      
      // Find the wealthiest rival with properties or cash
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

      if (primeRival) {
        // Seize 1 highest-value land deed
        const rivalTiles = perimeterTiles.filter(t => t.ownerId === primeRival.id);
        let seizedTile: BoardTile | null = null;
        if (rivalTiles.length > 0) {
          seizedTile = rivalTiles.reduce((prev, curr) => ((curr.price || 0) > (prev.price || 0)) ? curr : prev);
          setPerimeterTiles(prev => prev.map(t => t.id === seizedTile!.id ? { ...t, ownerId: null, level: 1 } : t));
          addLog(`🚨 SITA ASET NEGARA: Sertifikat Tanah ${seizedTile.certificateTitle || seizedTile.name} milik ${primeRival.name} resmi dicabut & disita oleh Satgas Koalisi Parlemen!`, 'DANGER', primeRival.id);
        }

        // Penalty fine Rp 25.000.000
        const fineAmount = Math.min(primeRival.cash, 25_000_000);
        const shareA = coalitionPartner ? Math.ceil(fineAmount / 2) : fineAmount;
        const shareB = coalitionPartner ? Math.floor(fineAmount / 2) : 0;

        setPlayers(prev => prev.map(p => {
          if (p.id === primeRival!.id) {
            let updatedProps = p.ownedProperties;
            if (seizedTile) {
              updatedProps = updatedProps.filter(id => id !== seizedTile!.id);
            }
            const updatedP = {
              ...p,
              cash: Math.max(0, p.cash - fineAmount),
              stress: Math.min(100, p.stress + 30),
              ownedProperties: updatedProps
            };
            checkStressThreshold(updatedP);
            return updatedP;
          }
          if (p.id === activePlayer.id) {
            return { ...p, cash: p.cash + shareA };
          }
          if (coalitionPartner && p.id === coalitionPartner.id) {
            return { ...p, cash: p.cash + shareB };
          }
          return p;
        }));

        addLog(`🏛️ UU PENYITAAN ASET DISAHKAN: Koalisi ${activePlayer.name} & ${coalitionPartner?.name || 'Fraksi'} berhasil melucuti aset dan mendenda ${primeRival.name} sebesar ${formatRupiah(fineAmount)}!`, 'POLITIC', activePlayer.id);
      } else {
        addLog(`Tidak ada pemain rival di luar koalisi yang dapat disita asetnya.`, 'INFO', activePlayer.id);
      }
    }
    // 3. BANSOS_ORDAL
    else if (proposal.effectType === 'BANSOS_ORDAL') {
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
        ...p,
        cash: p.cash + 45_000_000
      } : p));
      addLog(`${activePlayer.name} mencairkan Dana Aspirasi Dapil sebesar Rp 45 Jt!`, 'CASH', activePlayer.id);
    } 
    // 4. LUXURY_TAX
    else if (proposal.effectType === 'LUXURY_TAX') {
      let totalCollected = 0;
      const breakdownLogs: string[] = [];

      setPlayers(prev => {
        const updated = prev.map(p => {
          if (p.id !== activePlayer.id && p.id !== coalitionPartner?.id && !p.isBankrupt && p.cash >= 50_000_000) {
            const tax = Math.round(p.cash * 0.15);
            totalCollected += tax;
            breakdownLogs.push(`${p.name} (-${formatRupiah(tax)})`);
            return { ...p, cash: p.cash - tax };
          }
          return p;
        });

        const shareA = coalitionPartner ? Math.ceil(totalCollected / 2) : totalCollected;
        const shareB = coalitionPartner ? Math.floor(totalCollected / 2) : 0;

        return updated.map(p => {
          if (p.id === activePlayer.id) {
            return { ...p, cash: p.cash + shareA };
          }
          if (coalitionPartner && p.id === coalitionPartner.id) {
            return { ...p, cash: p.cash + shareB };
          }
          return p;
        });
      });

      if (totalCollected > 0) {
        addLog(`UU Pajak Barang Mewah diberlakukan! ${activePlayer.name} memungut total ${formatRupiah(totalCollected)} dari lawan: ${breakdownLogs.join(', ')}!`, 'POLITIC', activePlayer.id);
      } else {
        addLog(`UU Pajak Barang Mewah diberlakukan! Tidak ada pemain lawan dengan saldo tunai di atas ambang batas (>= Rp 50 Jt).`, 'INFO', activePlayer.id);
      }
    }

    const newLaw: ActiveLaw = {
      id: `${proposal.id}_${Date.now()}`,
      name: proposal.title,
      shortDesc: proposal.description,
      passedByPlayerId: activePlayer.id,
      coalitionPartnerId: coalitionPartner?.id,
      effect: proposal.effectType as ActiveLaw['effect'],
      durationTurns: 4
    };

    setActiveLaws(prev => [...prev, newLaw]);
    setShowParliament(false);
    addLog(`PARIPURNA MENGETUK PALU: ${activePlayer.name}${coalitionPartner ? ` bersama ${coalitionPartner.name}` : ''} berhasil mengesahkan "${proposal.title}"!`, 'POLITIC', activePlayer.id);

    if (activePlayer.isAi) {
      if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
      aiEndTurnTimerRef.current = setTimeout(() => {
        handleEndTurn();
      }, 1400);
    }
  };

  // End Turn Engine
  const handleEndTurn = () => {
    if (
      !activePlayer || 
      isRolling || 
      isMoving || 
      rentCrisis || 
      activeDrawCardEvent || 
      activeDrawCardEventRef.current ||
      activeDilemmaCard || 
      showCorruptionGate || 
      showCorruptionAudit || 
      showKpkBribe || 
      showParliament || 
      showMoneyLaundering ||
      manualRentData
    ) return;

    // Check stress on active player before turn concludes
    checkStressThreshold(activePlayer);

    // Decrement jail turns if still in jail
    if (activePlayer.inJail && !activePlayer.isBankrupt) {
      if (activePlayer.jailTurnsLeft <= 1) {
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
          ...p,
          inJail: false,
          jailTurnsLeft: 0
        } : p));
        addLog(`${activePlayer.name} telah menyelesaikan masa tahanan di Lapas Sukamiskin. Bebas!`, 'INFO', activePlayer.id);
      } else {
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
          ...p,
          jailTurnsLeft: p.jailTurnsLeft - 1
        } : p));
      }
    }

    // Check if only 1 survivor remains
    const currentAlive = players.filter(p => !p.isBankrupt);
    if (currentAlive.length <= 1 && players.length > 1) {
      const winner = currentAlive[0] || activePlayer;
      setIsGameOver(true);
      setGameOverReason(`Kemenangan Sejati! ${winner.name} berhasil bertahan hidup paling lama dan menjadi penyintas tunggal di Konoha!`);
      return;
    }

    // Find next player who is NOT bankrupt
    let nextIdx = (activePlayerIndex + 1) % players.length;
    let attempts = 0;
    while (players[nextIdx]?.isBankrupt && attempts < players.length) {
      nextIdx = (nextIdx + 1) % players.length;
      attempts++;
    }

    // If turn has wrapped around the table (full round cycle of all players):
    if (nextIdx <= activePlayerIndex) {
      advanceCycle();
    }

    setActivePlayerIndex(nextIdx);
    setHasRolled(false);
    setLastRoll(null);
  };

  // Advance Round Cycle:
  // 1 Round (Putaran) = all alive players have taken 1 turn.
  // 1 Month = 4 Weeks (Minggu).
  // Each Week takes 2 full rounds (so 1 Month = 8 full rounds!).
  const advanceCycle = () => {
    const nextRound = cycleRound + 1;
    setCycleRound(nextRound);

    // Calculate current week (1-4) and whether a new month has arrived:
    // Week progresses every 2 rounds: round 1-2 = w1, round 3-4 = w2, round 5-6 = w3, round 7-8 = w4
    const weekNumber = (((Math.floor((nextRound - 1) / 2)) % 4) + 1);
    const isNewMonth = (nextRound - 1) % 8 === 0 && nextRound > 1;

    let nextMonth = macro.monthIndex;
    let nextYear = macro.year;

    if (isNewMonth) {
      nextMonth = (macro.monthIndex % 12) + 1;
      if (nextMonth === 1) nextYear = macro.year + 1;
    }

    let newInflation = macro.inflationRate;
    let newBi = macro.biRate;
    let newUsd = macro.usdIdrRate;
    let newTrend = macro.trend;

    // Only fluctuate inflation when an entire month passes (every 8 rounds)
    if (isNewMonth) {
      const inflationDelta = Number((Math.random() * 1.6 - 0.7).toFixed(1));
      newInflation = Math.max(2.5, Math.min(18.0, Number((macro.inflationRate + inflationDelta).toFixed(1))));
      
      const biDelta = Number((Math.random() * 0.5 - 0.2).toFixed(2));
      newBi = Math.max(4.5, Math.min(10.0, Number((macro.biRate + biDelta).toFixed(2))));

      const usdDelta = Math.round(Math.random() * 300 - 100);
      newUsd = Math.max(15200, Math.min(18000, macro.usdIdrRate + usdDelta));

      if (newInflation > 10.0) newTrend = 'CRISIS';
      else if (newInflation > 7.0) newTrend = 'VOLATILE';
      else if (inflationDelta > 0.4) newTrend = 'RISING';
      else newTrend = 'STABLE';

      setMonthNotice({
        monthName: MONTH_NAMES[nextMonth - 1],
        monthIndex: nextMonth,
        year: nextYear,
        round: nextRound
      });
      soundManager.playCash();
      addLog(`🗓️ PERGANTIAN BULAN: Memasuki Bulan ${MONTH_NAMES[nextMonth - 1]} ${nextYear} (Putaran #${nextRound})! Laporan inflasi: ${newInflation}%, BI-Rate: ${newBi}%.`, 'SYSTEM');
    }

    setMacro({
      weekIndex: weekNumber,
      monthIndex: nextMonth,
      year: nextYear,
      inflationRate: newInflation,
      biRate: newBi,
      usdIdrRate: newUsd,
      trend: newTrend
    });

    setMacroHistory(prev => [
      ...prev,
      {
        round: nextRound,
        label: `P${nextRound}`,
        fullPeriod: `Putaran ${nextRound} · ${MONTH_NAMES[nextMonth - 1]} (W${weekNumber})`,
        inflationRate: newInflation,
        usdIdrRate: newUsd,
        biRate: newBi,
        trend: newTrend,
        note: isNewMonth ? `Bulan ${MONTH_NAMES[nextMonth - 1]}` : undefined
      }
    ]);

    // Check if Active Laws expire
    setActiveLaws(prev => prev.map(l => ({ ...l, durationTurns: l.durationTurns - 1 })).filter(l => l.durationTurns > 0));

    // Occasional Breaking News (25% chance per full round cycle)
    if (Math.random() > 0.75) {
      const randomNews = BREAKING_NEWS_TEMPLATES[Math.floor(Math.random() * BREAKING_NEWS_TEMPLATES.length)];
      soundManager.playSirenOTT();
      setCurrentNews(randomNews);
      addLog(`SIARAN PERS: ${randomNews.headline}`, 'DANGER');

      // Apply News Impact
      if (randomNews.impactType === 'INFLATION') {
        const bumped = Number((newInflation + 2.0).toFixed(1));
        const bumpedTrend = bumped > 10.0 ? 'CRISIS' : 'VOLATILE';
        setMacro(m => ({ ...m, inflationRate: bumped, trend: bumpedTrend }));
        setMacroHistory(prev => [
          ...prev,
          {
            round: nextRound,
            label: `P${nextRound}*`,
            fullPeriod: `Putaran ${nextRound} (Berita Inflasi)`,
            inflationRate: bumped,
            usdIdrRate: newUsd + 150,
            biRate: newBi,
            trend: bumpedTrend,
            note: 'Dampak Breaking News Moneter'
          }
        ]);
      } else if (randomNews.impactType === 'CORRUPTION_CRACKDOWN') {
        setPlayers(plist => plist.map(p => ({ ...p, kpkSuspicionLevel: Math.min(100, p.kpkSuspicionLevel + 20) })));
      } else if (randomNews.impactType === 'SUBSIDY_CUT') {
        setPlayers(plist => plist.map(p => {
          const updated = { ...p, stress: Math.min(100, p.stress + 15) };
          checkStressThreshold(updated);
          return updated;
        }));
      }
    }

    addLog(`Siklus Putaran #${nextRound} dimulai (Minggu ${weekNumber}/4).`, 'SYSTEM');
  };

  // Bot AI Automation effect
  useEffect(() => {
    if (isSetupOpen || isGameOver || !activePlayer || !activePlayer.isAi || activePlayer.isBankrupt) return;

    // Do not proceed with automatic turn if an animation, modal, or crisis is active
    if (
      isRolling || 
      isMoving || 
      activeDrawCardEvent || 
      activeDrawCardEventRef.current ||
      activeDilemmaCard || 
      showCorruptionGate || 
      showCorruptionAudit || 
      showMoneyLaundering ||
      showKpkBribe || 
      showParliament || 
      manualRentData || 
      rentCrisis
    ) {
      return;
    }

    // AI Turn Execution with clear pacing so human player can observe
    const aiTimer = setTimeout(() => {
      if (!hasRolled && !activePlayer.inJail) {
        // Roll dice
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        handleRollDice(d1, d2, d1 + d2);
      } else if (hasRolled) {
        // Pawn has finished moving and all modals/events are clear
        const allTiles = [...perimeterTiles, ...corruptionTiles, ...luxuryTiles];
        const curTile = allTiles.find(t => t.id === activePlayer.position);

        // AI Decides Property Purchase if landing on unowned perimeter property
        if (curTile && curTile.actionType === 'PROPERTY' && !curTile.ownerId) {
          const inflationFactor = 1 + (macro.inflationRate / 100);
          const cost = Math.round((curTile.price || 0) * inflationFactor);
          if (activePlayer.cash > cost * 1.35) {
            handleBuyProperty();
          }
        }

        // Conclude AI turn after a brief delay for human readability
        if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
        aiEndTurnTimerRef.current = setTimeout(() => {
          handleEndTurn();
        }, 1100);
      } else if (activePlayer.inJail) {
        if (activePlayer.cash >= 20_000_000 && activePlayer.stress > 30) {
          handlePayJailBribe();
        }
        if (aiEndTurnTimerRef.current) clearTimeout(aiEndTurnTimerRef.current);
        aiEndTurnTimerRef.current = setTimeout(() => {
          handleEndTurn();
        }, 1000);
      }
    }, 1100);

    return () => {
      clearTimeout(aiTimer);
      if (aiEndTurnTimerRef.current) {
        clearTimeout(aiEndTurnTimerRef.current);
      }
    };
  }, [
    activePlayerIndex, 
    hasRolled, 
    isSetupOpen, 
    isGameOver, 
    activePlayer,
    isRolling,
    isMoving,
    activeDrawCardEvent,
    activeDilemmaCard,
    showCorruptionGate,
    showCorruptionAudit,
    showMoneyLaundering,
    showKpkBribe,
    showParliament,
    manualRentData,
    rentCrisis
  ]);

  // AI Turn Conclusion Watchdog:
  // If an AI player has rolled, is not moving, and no interactive modals/crises are active,
  // this watchdog ensures the turn concludes even if other timers were disrupted by re-renders.
  useEffect(() => {
    if (!activePlayer || !activePlayer.isAi || activePlayer.isBankrupt || !hasRolled) return;

    if (
      isRolling || 
      isMoving || 
      activeDrawCardEvent || 
      activeDrawCardEventRef.current || 
      activeDilemmaCard || 
      showCorruptionGate || 
      showCorruptionAudit || 
      showMoneyLaundering || 
      showKpkBribe || 
      showParliament || 
      manualRentData || 
      rentCrisis
    ) {
      return;
    }

    const watchdogTimer = setTimeout(() => {
      handleEndTurn();
    }, 2400);

    return () => clearTimeout(watchdogTimer);
  }, [
    activePlayerIndex,
    hasRolled,
    isRolling,
    isMoving,
    activeDrawCardEvent,
    activeDilemmaCard,
    showCorruptionGate,
    showCorruptionAudit,
    showMoneyLaundering,
    showKpkBribe,
    showParliament,
    manualRentData,
    rentCrisis,
    activePlayer
  ]);

  // Handle AI Dilemma Card Auto-Select
  useEffect(() => {
    if (activeDilemmaCard && activePlayer?.isAi) {
      const timer = setTimeout(() => {
        // Bot selects option A or B based on cash vs stress
        const choice = activePlayer.stress > 60 ? 'optionB' : 'optionA';
        handleChooseCardOption(choice);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [activeDilemmaCard, activePlayer]);

  // Handle AI Parliament & Coalition Bill Auto-Passing
  useEffect(() => {
    if (showParliament && activePlayer?.isAi) {
      const timer = setTimeout(() => {
        // AI looks for a coalition partner with highest influence
        const candidateAllies = players.filter(p => p.id !== activePlayer.id && !p.isBankrupt);
        const bestAlly = candidateAllies.length > 0 
          ? candidateAllies.reduce((prev, curr) => curr.politicalInfluence > prev.politicalInfluence ? curr : prev)
          : undefined;

        const combinedInfluence = activePlayer.politicalInfluence + (bestAlly ? bestAlly.politicalInfluence : 0);

        // Priority 1: Check Coalition Bills if partner available
        if (bestAlly && combinedInfluence >= 75) {
          const confiscateProp = LAW_PROPOSALS.find(p => p.id === 'uu_penyitaan_aset');
          if (confiscateProp) {
            handlePassLaw(confiscateProp, bestAlly);
            setTimeout(() => handleEndTurn(), 1400);
            return;
          }
        } else if (bestAlly && combinedInfluence >= 65) {
          const progTaxProp = LAW_PROPOSALS.find(p => p.id === 'uu_pajak_progresif_drastis');
          if (progTaxProp) {
            handlePassLaw(progTaxProp, bestAlly);
            setTimeout(() => handleEndTurn(), 1400);
            return;
          }
        }

        // Priority 2: Check Solo Bills
        const affordableSolo = LAW_PROPOSALS.filter(p => !p.isCoalitionOnly && activePlayer.politicalInfluence >= p.requiredInfluence);
        if (affordableSolo.length > 0) {
          handlePassLaw(affordableSolo[0]);
          setTimeout(() => handleEndTurn(), 1400);
          return;
        }

        // Insufficient political capital: close parliament
        setShowParliament(false);
        addLog(`${activePlayer.name} (AI) meninggalkan Sidang Paripurna tanpa mengesahkan RUU karena modal politik belum mencukupi.`, 'INFO', activePlayer.id);
        setTimeout(() => handleEndTurn(), 1200);
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, [showParliament, activePlayer, players]);

  // Handle AI Corruption Gate Auto-Select
  useEffect(() => {
    if (showCorruptionGate && activePlayer?.isAi) {
      const timer = setTimeout(() => {
        // Greedy AI or Caleg takes corruption
        if (activePlayer.archetypeId === 'daud_politisi' || activePlayer.kpkSuspicionLevel < 40) {
          setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
            ...p,
            isInCorruptionRoute: true,
            position: 100
          } : p));
          addLog(`${activePlayer.name} memutuskan masuk Rute Korupsi!`, 'DANGER', activePlayer.id);
        } else {
          addLog(`${activePlayer.name} memilih jalur aman rakyat jelata.`, 'INFO', activePlayer.id);
        }
        setShowCorruptionGate(false);
        setTimeout(() => {
          handleEndTurn();
        }, 1100);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [showCorruptionGate, activePlayer]);

  // Auto-dismiss survival notices
  useEffect(() => {
    if (eliminationNotice) {
      const t = setTimeout(() => setEliminationNotice(null), 6000);
      return () => clearTimeout(t);
    }
  }, [eliminationNotice]);

  useEffect(() => {
    if (psychologistNotice) {
      const t = setTimeout(() => setPsychologistNotice(null), 5000);
      return () => clearTimeout(t);
    }
  }, [psychologistNotice]);

  useEffect(() => {
    if (monthNotice) {
      const t = setTimeout(() => setMonthNotice(null), 5000);
      return () => clearTimeout(t);
    }
  }, [monthNotice]);

  const currentLandingTile = activePlayer 
    ? [...perimeterTiles, ...corruptionTiles].find(t => t.id === activePlayer.position) || perimeterTiles[0]
    : perimeterTiles[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-3 sm:gap-8 px-3 sm:px-8 py-2.5 sm:py-3.5 border-b border-slate-800/80 bg-slate-950/90 sticky top-0 z-40 backdrop-blur-md">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs sm:text-sm shadow">
            Rp
          </div>
          <span className="text-sm sm:text-lg font-black tracking-tight text-white">
            MONOPOLI WNI
          </span>
        </div>

        {/* Zone 2: Clean single-line navigation / status */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button 
            onClick={() => setIsStatsOpen(true)}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Peringkat & Net Worth</span>
          </button>
          <div className="text-slate-400 whitespace-nowrap shrink-0">
            Tahun {macro.year} · Bulan {macro.monthIndex} ({MONTH_NAMES[(macro.monthIndex - 1) % 12]}) · Mgg {macro.weekIndex}/4
          </div>
          <div className="text-emerald-400 font-bold whitespace-nowrap shrink-0 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{aliveCount}/{players.length} Penyintas Hidup</span>
          </div>
        </nav>

        {/* Zone 3: Primary action & controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const enabled = soundManager.toggle();
              setIsSoundMuted(!enabled);
            }}
            title={isSoundMuted ? 'Nyalakan Audio & Ambien Makro' : `Audio & Ambien Aktif: ${soundManager.getAmbientDescription()}`}
            className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              isSoundMuted 
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' 
                : 'bg-slate-900/90 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
            }`}
          >
            {isSoundMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            )}
            <span className="text-[11px] font-mono hidden sm:inline font-bold">
              {isSoundMuted ? 'Bisu' : 'Ambien On'}
            </span>
          </button>

          <button
            onClick={handleRestartNewRound}
            title="Mulai Babak Baru / Reset Permainan"
            className="min-h-[40px] py-2 px-3 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Babak Baru</span>
          </button>

          <button
            onClick={() => setShowLogsModal(true)}
            className="min-h-[40px] py-2 px-3 sm:px-3.5 text-xs font-bold text-amber-300 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 rounded-xl transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            title="Buka Catatan Riwayat Sejarah & Logbook Nasional"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Riwayat Logbook</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setIsStatsOpen(true)}
            className="min-h-[40px] py-2 px-3 sm:px-3.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Statistik Pemain</span>
            <span className="sm:hidden">Statistik</span>
          </button>
        </div>
      </header>

      {/* Persistent Drastic Coalition Law Banner at Top of Screen */}
      <DrasticLawBanner activeLaws={activeLaws} players={players} />

      {/* Main Game Arena */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 space-y-4 pb-24 lg:pb-6">
        {/* Dynamic Survival Notification Toasts */}
        {eliminationNotice && (
          <div className="bg-rose-950/90 border-2 border-rose-600 rounded-xl p-3 sm:p-4 text-white shadow-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5">
              <Skull className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[11px] font-mono text-rose-300 font-bold uppercase tracking-wide block">
                  🚨 ELIMINASI PEMAIN · SURVIVAL BERLANJUT
                </span>
                <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  {eliminationNotice.player.name} telah gugur dari persaingan Konoha!
                </p>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  Alasan: {eliminationNotice.cause}. Tersisa <strong className="text-amber-300 font-mono">{eliminationNotice.remainingCount}</strong> penyintas yang masih bertahan hidup!
                </p>
              </div>
            </div>
            <button
              onClick={() => setEliminationNotice(null)}
              className="text-rose-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {psychologistNotice && (
          <div className="bg-sky-950/90 border-2 border-sky-500 rounded-xl p-3 sm:p-4 text-white shadow-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5">
              <HeartCrack className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-mono text-sky-300 font-bold uppercase tracking-wide block">
                  🧠 KONSULTASI PSIKOLOG DARURAT (-20% STRES)
                </span>
                <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  Stres {psychologistNotice.player.name} mencapai 100%!
                </p>
                <p className="text-xs text-sky-200/90 mt-0.5">
                  Membayar <strong className="text-amber-300 font-mono">Rp 10.000.000</strong> ke psikiater. Tingkat stres berhasil diredakan 20% menjadi <strong className="text-emerald-300 font-mono">{psychologistNotice.newStress}%</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPsychologistNotice(null)}
              className="text-sky-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {monthNotice && (
          <div className="bg-amber-950/90 border-2 border-amber-500 rounded-xl p-3 sm:p-4 text-white shadow-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5">
              <Landmark className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-mono text-amber-300 font-bold uppercase tracking-wide block">
                  🗓️ MEMASUKI BULAN BARU (PUTARAN #{monthNotice.round})
                </span>
                <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  Bulan {monthNotice.monthName} {monthNotice.year}
                </p>
                <p className="text-xs text-amber-200/90 mt-0.5">
                  Kondisi makroekonomi, tren inflasi, suku bunga BI, dan kurs Rupiah telah disesuaikan. Siapa yang mampu bertahan paling lama?
                </p>
              </div>
            </div>
            <button
              onClick={() => setMonthNotice(null)}
              className="text-amber-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Macroeconomic Dashboard Strip */}
        <MacroIndicator 
          macro={macro} 
          activeLaws={activeLaws} 
          cycleRound={cycleRound}
          aliveCount={aliveCount}
          totalPlayers={players.length}
        />

        {/* Board & HUD Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Monopoly Board Viewport */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center">
            <Board 
              perimeterTiles={perimeterTiles}
              corruptionTiles={corruptionTiles}
              players={players}
              activePlayerIndex={activePlayerIndex}
              macro={macro}
              onTileClick={(tile) => setSelectedTile(tile)}
              selectedTile={selectedTile}
              bannerImage={BANNER_IMAGE}
              crestImage={CREST_IMAGE}
              diceRollAnimation={diceRollAnimation}
              onRollAnimationComplete={handleRollAnimationComplete}
              isMoving={isMoving}
            />
          </div>

          {/* Right Sidebar: Active HUD & Quick Leaderboard */}
          <div className="lg:col-span-4 space-y-4">
            {activePlayer && !activePlayer.isBankrupt && (
              <PlayerHUD
                player={activePlayer}
                currentTile={currentLandingTile}
                hasRolled={hasRolled}
                isRolling={isRolling || isMoving || !!rentCrisis}
                lastRoll={lastRoll}
                macro={macro}
                onRoll={handleRollDice}
                onBuyProperty={handleBuyProperty}
                onUpgradeProperty={handleUpgradeProperty}
                onEndTurn={handleEndTurn}
                onPayJailBribe={handlePayJailBribe}
              />
            )}

            {/* Quick Live Standings Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  Status Penyintas ({aliveCount}/{players.length} Bertahan)
                </span>
                <button
                  onClick={() => setIsStatsOpen(true)}
                  className="text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  Detail →
                </button>
              </div>

              <div className="space-y-2">
                {players.map((p, idx) => {
                  const isCurrent = idx === activePlayerIndex;
                  const playerTag = p.id.startsWith('player_') ? `P${p.id.replace('player_', '')}` : `P${idx + 1}`;
                  return (
                    <div
                      key={p.id}
                      style={isCurrent && !p.isBankrupt ? {
                        borderColor: p.color,
                        boxShadow: `0 0 16px ${p.color}35`,
                      } : {}}
                      className={`
                        p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all
                        ${p.isBankrupt ? 'bg-rose-950/20 border-rose-900/50 opacity-60' : isCurrent ? 'bg-slate-800/90 ring-1 ring-white/60' : 'bg-slate-950/60 border-slate-800/80'}
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="relative w-8 h-8 rounded-xl border flex items-center justify-center text-base shrink-0 shadow-sm"
                          style={{ borderColor: p.color, backgroundColor: `${p.color}25` }}
                        >
                          {p.avatar}
                          {isCurrent && !p.isBankrupt && (
                            <span 
                              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white animate-ping"
                              style={{ backgroundColor: p.color }}
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span 
                              className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded border text-white shrink-0"
                              style={{ backgroundColor: `${p.color}50`, borderColor: p.color }}
                              title={`Kode Pemain: ${playerTag}`}
                            >
                              {playerTag}
                            </span>
                            <span className="font-extrabold text-white truncate">{p.name}</span>
                            {isCurrent && !p.isBankrupt && (
                              <span 
                                className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full text-white animate-pulse flex items-center gap-1 shrink-0"
                                style={{ backgroundColor: p.color }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                <span>GILIRAN</span>
                              </span>
                            )}
                            {p.isBankrupt ? (
                              <span className="text-[9px] bg-rose-950 text-rose-400 px-1 py-0.2 rounded font-mono font-bold">
                                GUGUR
                              </span>
                            ) : p.inJail ? (
                              <span className="text-[9px] text-rose-400 font-mono">(Lapas)</span>
                            ) : null}
                          </div>
                          {p.isBankrupt ? (
                            <span className="text-[10px] text-slate-500">Telah Tereliminasi</span>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[9px] font-mono mt-0.5">
                              <span className={p.stress >= 80 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                                Stres {p.stress}%
                              </span>
                              <span className="text-slate-600">·</span>
                              <span className="text-amber-400 font-bold">
                                Pol {p.politicalInfluence}
                              </span>
                              <span className="text-slate-600">·</span>
                              <span className={`relative inline-flex items-center gap-1 ${p.kpkSuspicionLevel > 60 ? 'text-rose-400 font-extrabold' : p.kpkSuspicionLevel > 50 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                                {p.kpkSuspicionLevel > 60 && (
                                  <span className="relative flex items-center justify-center w-2.5 h-2.5">
                                    <KPKRadarPingEffect suspicionLevel={p.kpkSuspicionLevel} size="sm" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping absolute" />
                                    <span className="w-1 h-1 rounded-full bg-rose-400 relative z-10" />
                                  </span>
                                )}
                                <span>KPK {p.kpkSuspicionLevel}%</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono font-bold block ${p.isBankrupt ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>
                          {formatRupiahShort(p.cash)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {p.ownedProperties.length} Aset
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Activity Ticker */}
            <div 
              onClick={() => setShowLogsModal(true)}
              className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-3 text-xs transition-all cursor-pointer group shadow-sm"
              title="Klik untuk membuka Arsip Sejarah & Logbook Nasional Lengkap"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 transition-colors">
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kabar Terkini Putaran:</span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 underline underline-offset-2">
                  <span>Lihat Semua ({logs.length})</span>
                </span>
              </div>
              <div className="text-slate-300 italic text-[11px] leading-relaxed line-clamp-3 group-hover:text-white transition-colors">
                {logs.length > 0 ? logs[logs.length - 1].message : 'Menunggu kocokan dadu pertama...'}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Mobile Thumb Dock (Fixed Bottom Action Bar for Mobile Touch) */}
      {activePlayer && !activePlayer.isBankrupt && !isSetupOpen && !isGameOver && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 border-t border-slate-800 p-2.5 backdrop-blur-md shadow-2xl flex items-center justify-between gap-2.5">
          {/* Left: Active Player Quick Info */}
          <div 
            onClick={() => setIsStatsOpen(true)}
            className="flex items-center gap-2 cursor-pointer shrink-0"
          >
            <div 
              className="w-9 h-9 rounded-xl border flex items-center justify-center text-sm shadow"
              style={{ borderColor: activePlayer.color, backgroundColor: `${activePlayer.color}20` }}
            >
              {activePlayer.avatar}
            </div>
            <div>
              <span className="text-xs font-bold text-white block leading-tight truncate max-w-[85px]">
                {activePlayer.name}
              </span>
              <span className="text-[11px] font-mono font-extrabold text-emerald-400">
                {formatRupiahShort(activePlayer.cash)}
              </span>
            </div>
          </div>

          {/* Center: Action Buttons */}
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            {!hasRolled && !activePlayer.inJail ? (
              <button
                onClick={() => {
                  if (activePlayer.isAi) return;
                  const d1 = Math.floor(Math.random() * 6) + 1;
                  const d2 = Math.floor(Math.random() * 6) + 1;
                  handleRollDice(d1, d2, d1 + d2);
                }}
                disabled={isRolling || isMoving || activePlayer.isAi}
                className="min-h-[44px] flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{activePlayer.isAi ? `🤖 Giliran ${activePlayer.name}...` : isRolling ? 'Mengocok...' : isMoving ? 'Melangkah...' : 'Kocok Dadu'}</span>
              </button>
            ) : hasRolled ? (
              <>
                {currentLandingTile.actionType === 'PROPERTY' && !currentLandingTile.ownerId && activePlayer.cash >= Math.round((currentLandingTile.price || 0) * (1 + macro.inflationRate / 100)) && !activePlayer.isAi && (
                  <button
                    onClick={handleBuyProperty}
                    className="min-h-[44px] py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Beli Surat Tanah ({formatRupiahShort(Math.round((currentLandingTile.price || 0) * (1 + macro.inflationRate / 100)))})</span>
                  </button>
                )}

                <button
                  onClick={handleEndTurn}
                  disabled={activePlayer.isAi}
                  className="min-h-[44px] flex-1 py-2 px-3 bg-white text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>{activePlayer.isAi ? `Giliran ${activePlayer.name}...` : 'Akhiri'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : activePlayer.inJail && !activePlayer.isAi ? (
              <button
                onClick={handlePayJailBribe}
                className="min-h-[44px] flex-1 py-2 px-3 bg-rose-900 border border-rose-700 text-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
              >
                <span>Suap Sipir Rp 20 Jt</span>
              </button>
            ) : null}

            {/* Quick Stats Trigger */}
            <button
              onClick={() => setIsStatsOpen(true)}
              className="min-h-[44px] min-w-[44px] p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center text-amber-400 transition-colors"
              title="Buka Statistik Pemain"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Pre-Game Setup Modal */}
      {isSetupOpen && (
        <SetupGameModal 
          onStartGame={handleStartGame} 
          bannerImage={BANNER_IMAGE} 
          onClose={players.length > 0 && !isGameOver ? () => setIsSetupOpen(false) : undefined}
        />
      )}

      {/* 2. Dilemma & Opportunity Card Modal */}
      {activeDilemmaCard && activePlayer && (
        <CardModal
          card={activeDilemmaCard}
          activePlayer={activePlayer}
          onChooseOption={handleChooseCardOption}
          cardImage={CARD_IMAGE}
        />
      )}

      {/* 3. Corruption Route Entrance Gate Modal */}
      {showCorruptionGate && activePlayer && (
        <CorruptionGateModal
          player={activePlayer}
          onEnterCorruptionRoute={() => {
            setShowCorruptionGate(false);
            setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
              ...p,
              isInCorruptionRoute: true,
              position: 100
            } : p));
            addLog(`${activePlayer.name} nekat masuk Rute Korupsi! Berada di Petak #100 Pengadaan Fiktif.`, 'DANGER', activePlayer.id);
          }}
          onStayOnNormalPath={() => {
            setShowCorruptionGate(false);
            addLog(`${activePlayer.name} memilih tetap di jalur aman rakyat biasa.`, 'INFO', activePlayer.id);
          }}
          crestImage={CREST_IMAGE}
        />
      )}

      {/* 4. Corruption BPK & KPK Audit Modal */}
      {showCorruptionAudit && activePlayer && (
        <CorruptionAuditModal
          player={activePlayer}
          onAuditResolve={handleCorruptionAuditResolve}
        />
      )}

      {/* 4b. KPK Bribe Decision Modal */}
      {showKpkBribe && activePlayer && (
        <KPKBribeModal
          player={activePlayer}
          bribeAmount={20_000_000}
          onPayBribe={handlePayKpkBribe}
          onRefuseBribe={handleRefuseKpkBribe}
        />
      )}

      {/* 4c. Event Musibah & Takdir 3D Draw Card & 3-Tier Dice Outcome Modal */}
      {activeDrawCardEvent && (
        <DrawCardModal
          player={activeDrawCardEvent.targetPlayer}
          eventType={activeDrawCardEvent.type}
          cardsPool={activeDrawCardEvent.cardsPool}
          ownedTiles={perimeterTiles.filter(t => activeDrawCardEvent.targetPlayer.ownedProperties.includes(t.id))}
          onConfirmOutcome={handleConfirmDrawCardOutcome}
        />
      )}

      {/* 5. DPR Senayan Parliament Modal */}
      {showParliament && activePlayer && (
        <ParliamentModal
          player={activePlayer}
          players={players}
          onPassLaw={handlePassLaw}
          onVetoLaw={handleVetoLaw}
          onClose={() => setShowParliament(false)}
        />
      )}

      {/* 5b. Money Laundering & Luxury Real Estate in Corruption Route Modal */}
      {showMoneyLaundering && activePlayer && (
        <MoneyLaunderingModal
          player={activePlayer}
          players={players}
          perimeterTiles={perimeterTiles}
          luxuryTiles={luxuryTiles}
          macro={macro}
          onLaunderBuyLuxury={handleLaunderBuyLuxury}
          onLaunderBuyPerimeter={handleLaunderBuyPerimeter}
          onSkipLaundering={handleSkipLaundering}
        />
      )}

      {/* 6. Breaking News Banner Alert */}
      {currentNews && (
        <BreakingNewsBanner
          currentNews={currentNews}
          onDismiss={() => setCurrentNews(null)}
        />
      )}

      {/* 7. Player Statistics & Transparency Drawer */}
      <PlayerStatsDrawer
        players={players}
        tiles={[...perimeterTiles, ...corruptionTiles, ...luxuryTiles]}
        macro={macro}
        macroHistory={macroHistory}
        currentRound={cycleRound}
        logs={logs}
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        activePlayerId={activePlayer?.id || 'player_1'}
        onOpenFullHistory={() => {
          setIsStatsOpen(false);
          setShowLogsModal(true);
        }}
      />

      {/* 8. Tile Detail Inspector Modal */}
      {selectedTile && (
        <TileDetailModal
          tile={selectedTile}
          players={players}
          macro={macro}
          onClose={() => setSelectedTile(null)}
        />
      )}

      {/* 9. Full History Logbook & National Archives Modal */}
      <GameLogsModal
        logs={logs}
        players={players}
        macro={macro}
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
      />

      {/* 10. Game Over & Victory Podium */}
      {isGameOver && (
        <GameOverModal
          players={players}
          tiles={[...perimeterTiles, ...corruptionTiles, ...luxuryTiles]}
          macro={macro}
          onRestart={handleRestartNewRound}
          onQuickRestart={handleQuickRestart}
          reason={gameOverReason}
        />
      )}

      {/* 11. Rent & Financial Crisis Property Liquidation Modal */}
      {rentCrisis && (
        <RentCrisisModal
          isOpen={true}
          payer={rentCrisis.payer}
          owner={rentCrisis.owner}
          tile={rentCrisis.tile}
          rentCost={rentCrisis.rentCost}
          crisisType={rentCrisis.crisisType}
          amountDue={rentCrisis.amountDue}
          title={rentCrisis.title}
          subtitle={rentCrisis.subtitle}
          description={rentCrisis.description}
          recipientName={rentCrisis.recipientName}
          recipientAvatar={rentCrisis.recipientAvatar}
          recipientColor={rentCrisis.recipientColor}
          causeDesc={rentCrisis.causeDesc}
          perimeterTiles={[...perimeterTiles, ...luxuryTiles]}
          macro={macro}
          onSellProperty={handleSellPropertyForRent}
          onSellAllProperties={handleSellAllPropertiesForRent}
          onPayRent={handlePayRentFromCrisis}
          onDeclareBankruptcy={handleBankruptcyFromRentCrisis}
          onUseSpecialCard={handleUseSpecialCardForRent}
        />
      )}

      {/* 12. Manual Rent Payment Interactive & Animated Modal */}
      {manualRentData && (
        <ManualRentPaymentModal
          data={manualRentData}
          onConfirmPayment={handleConfirmManualRentPayment}
          onUseSpecialCard={handleUseSpecialCardForManualRent}
        />
      )}
    </div>
  );
}
