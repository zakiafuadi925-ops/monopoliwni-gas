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
  DilemmaCard 
} from './types/game';
import { PERIMETER_TILES, CORRUPTION_ROUTE_TILES } from './data/tiles';
import { DILEMMA_CARDS } from './data/cards';
import { CHARACTER_ARCHETYPES } from './data/characters';
import { BREAKING_NEWS_TEMPLATES, LawProposal } from './data/laws';
import { formatRupiah, formatRupiahShort } from './utils/format';
import { soundManager } from './utils/sound';

// Components
import { Board } from './components/Board';
import { MacroIndicator } from './components/MacroIndicator';
import { PlayerHUD } from './components/PlayerHUD';
import { CardModal } from './components/CardModal';
import { CorruptionGateModal, CorruptionAuditModal, KPKBribeModal } from './components/CorruptionModal';
import { ParliamentModal } from './components/ParliamentModal';
import { BreakingNewsBanner } from './components/BreakingNewsBanner';
import { PlayerStatsDrawer } from './components/PlayerStatsDrawer';
import { SetupGameModal } from './components/SetupGameModal';
import { GameOverModal } from './components/GameOverModal';
import { TileDetailModal } from './components/TileDetailModal';
import { DrawCardModal } from './components/DrawCardModal';
import { MUSIBAH_EVENT_CARDS, TAKDIR_EVENT_CARDS } from './data/eventCards';
import { EventOutcomeCard } from './types/game';

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
  Skull
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
    cash: 6_000_000,
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
    stats: { totalRentEarned: 0, totalRentPaid: 0, totalCorruptionGains: 0, cardsDrawn: 0, timesInJail: 0 }
  },
  {
    id: 'player_2',
    name: 'Pemain 2 (Ordal)',
    archetypeId: 'pak_joko_asn',
    isAi: true,
    position: 0,
    cash: 8_500_000,
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
    stats: { totalRentEarned: 0, totalRentPaid: 0, totalCorruptionGains: 0, cardsDrawn: 0, timesInJail: 0 }
  },
  {
    id: 'player_3',
    name: 'Pemain 3 (Caleg)',
    archetypeId: 'daud_politisi',
    isAi: true,
    position: 0,
    cash: 10_000_000,
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
  const [lastRoll, setLastRoll] = useState<{ d1: number; d2: number; total: number } | null>(null);

  // Board & Economy
  const [perimeterTiles, setPerimeterTiles] = useState<BoardTile[]>(PERIMETER_TILES);
  const [corruptionTiles, setCorruptionTiles] = useState<BoardTile[]>(CORRUPTION_ROUTE_TILES);
  const [macro, setMacro] = useState<MacroEconomy>({
    inflationRate: 5.2,
    biRate: 6.25,
    usdIdrRate: 16350,
    trend: 'STABLE',
    monthIndex: 1,
    weekIndex: 1,
    year: 2026
  });
  const [activeLaws, setActiveLaws] = useState<ActiveLaw[]>([]);
  const [cycleRound, setCycleRound] = useState<number>(1);

  // Modals & Panels
  const [selectedTile, setSelectedTile] = useState<BoardTile | null>(null);
  const [activeDilemmaCard, setActiveDilemmaCard] = useState<DilemmaCard | null>(null);
  const [showCorruptionGate, setShowCorruptionGate] = useState<boolean>(false);
  const [showCorruptionAudit, setShowCorruptionAudit] = useState<boolean>(false);
  const [showKpkBribe, setShowKpkBribe] = useState<boolean>(false);
  const [showMusibahModal, setShowMusibahModal] = useState<boolean>(false);
  const [musibahConfiscatedTile, setMusibahConfiscatedTile] = useState<BoardTile | null>(null);
  const [musibahFine, setMusibahFine] = useState<number>(0);
  const [showTakdirModal, setShowTakdirModal] = useState<boolean>(false);
  const [takdirOutcome, setTakdirOutcome] = useState<TakdirOutcome | null>(null);
  const [showParliament, setShowParliament] = useState<boolean>(false);
  const [currentNews, setCurrentNews] = useState<BreakingNewsEvent | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

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

  // Logs
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
    setLogs(prev => [...prev.slice(-40), newLog]);
  };

  const activePlayer = players[activePlayerIndex] || null;
  const alivePlayers = players.filter(p => !p.isBankrupt);
  const aliveCount = alivePlayers.length;

  // Initialize game from Setup Modal (Survival Mode)
  const handleStartGame = (configuredPlayers: Player[]) => {
    setPlayers(configuredPlayers);
    setCycleRound(1);
    setMacro({
      inflationRate: 5.2,
      biRate: 6.25,
      usdIdrRate: 16350,
      trend: 'STABLE',
      monthIndex: 1,
      weekIndex: 1,
      year: 2026
    });
    setActivePlayerIndex(0);
    setHasRolled(false);
    setLastRoll(null);
    setIsGameOver(false);
    setIsSetupOpen(false);
    setLogs([]);

    addLog(`Pertarungan Survival WNI dimulai dengan ${configuredPlayers.length} pemain! Kemenangan sejati adalah siapa yang mampu bertahan hidup paling lama!`, 'SYSTEM');
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
      const psychologistFee = 1_000_000;
      if (player.cash >= psychologistFee) {
        const updatedCash = player.cash - psychologistFee;
        const updatedStress = Math.max(0, player.stress - 20); // Drops 20% to 80%

        setPlayers(prev => prev.map(p => p.id === player.id ? {
          ...p,
          cash: updatedCash,
          stress: updatedStress
        } : p));

        soundManager.playCash();
        addLog(`🧠 KONSULTASI PSIKOLOG: Stres ${player.name} mencapai 100%! Membayar Rp 1.000.000 ke psikiater, stres turun 20% menjadi ${updatedStress}%.`, 'INFO', player.id);
        
        setPsychologistNotice({
          player: { ...player, cash: updatedCash, stress: updatedStress },
          fee: psychologistFee,
          oldStress: player.stress,
          newStress: updatedStress
        });
        return true;
      } else {
        // Cannot afford psychologist -> Bankrupt & eliminated!
        handlePlayerBankruptcy(player, 'Stres mencapai 100% dan saldo kas tidak mencukupi untuk membayar biaya psikolog Rp 1.000.000');
        return false;
      }
    }
    return true;
  };

  // Roll Dice Logic
  const handleRollDice = (d1: number, d2: number, total: number) => {
    if (!activePlayer || activePlayer.isBankrupt || hasRolled || isRolling) return;

    setIsRolling(true);
    setLastRoll({ d1, d2, total });

    setTimeout(() => {
      setIsRolling(false);
      setHasRolled(true);

      // Handle movement
      executePlayerMove(activePlayer, total);
    }, 400);
  };

  // Movement Engine
  const executePlayerMove = (player: Player, totalSteps: number) => {
    let currentPos = player.position;
    let newPos = currentPos;
    let passedStart = false;

    // Check if player is currently in Corruption Route
    if (player.isInCorruptionRoute) {
      if (currentPos === 100) {
        newPos = 101;
      } else if (currentPos === 101) {
        newPos = 102;
      } else {
        // Exit corruption route to DPR Senayan (Tile 21)
        newPos = 21;
        player.isInCorruptionRoute = false;
        addLog(`${player.name} keluar dari Rute Korupsi menuju Gedung DPR Senayan!`, 'POLITIC', player.id);
      }
    } else {
      // Normal perimeter movement (28 tiles loop)
      const rawPos = currentPos + totalSteps;
      if (rawPos >= 28) {
        passedStart = true;
        newPos = rawPos % 28;
      } else {
        newPos = rawPos;
      }
    }

    // Update player position
    setPlayers(prev => prev.map(p => {
      if (p.id !== player.id) return p;
      const updated = { ...p, position: newPos };
      return updated;
    }));

    // Pass START Salary reward
    if (passedStart && !player.isInCorruptionRoute) {
      const inflationFactor = 1 + (macro.inflationRate / 100);
      const baseSalary = 4_500_000;
      const bonusPct = (CHARACTER_ARCHETYPES.find(a => a.id === player.archetypeId)?.salaryBonusPercent || 0) / 100;
      const totalSalary = Math.round(baseSalary * inflationFactor * (1 + bonusPct));

      soundManager.playCash();
      setPlayers(prev => prev.map(p => {
        if (p.id !== player.id) return p;
        return {
          ...p,
          cash: p.cash + totalSalary,
          stress: Math.max(0, p.stress - 10)
        };
      }));

      addLog(`${player.name} melewati START! Gajian UMR cair ${formatRupiah(totalSalary)} dan Stres turun 10%.`, 'CASH', player.id);
    }

    // Handle Landing Tile Action
    setTimeout(() => {
      resolveLandingTile(player, newPos);
    }, 200);
  };

  // Resolve Landing Tile Event
  const resolveLandingTile = (player: Player, tileId: number) => {
    if (player.isBankrupt) return;

    const tile = [...perimeterTiles, ...corruptionTiles].find(t => t.id === tileId);
    if (!tile) return;

    addLog(`${player.name} mendarat di petak #${tile.id}: ${tile.name}.`, 'INFO', player.id);

    // CORRUPTION ROUTE TILE HANDLING
    if (tile.isCorruptionRoute) {
      if (tile.id === 100) {
        // Pengadaan Fiktif
        soundManager.playCash();
        setPlayers(prev => prev.map(p => p.id === player.id ? {
          ...p,
          cash: p.cash + 6_000_000,
          kpkSuspicionLevel: Math.min(100, p.kpkSuspicionLevel + 25),
          stats: { ...p.stats, totalCorruptionGains: p.stats.totalCorruptionGains + 6_000_000 }
        } : p));
        addLog(`${player.name} mengeksekusi Pengadaan Fiktif APBD! Mengantongi Rp 6 Jt tapi Radar KPK +25%.`, 'DANGER', player.id);
      } else if (tile.id === 101) {
        // Kuota Impor
        soundManager.playCash();
        setPlayers(prev => prev.map(p => p.id === player.id ? {
          ...p,
          cash: p.cash + 4_500_000,
          politicalInfluence: Math.min(100, p.politicalInfluence + 20),
          stats: { ...p.stats, totalCorruptionGains: p.stats.totalCorruptionGains + 4_500_000 }
        } : p));
        addLog(`${player.name} mendapat jatah Kuota Impor Pangan! Dapat Rp 4,5 Jt dan +20 Modal Politik.`, 'POLITIC', player.id);
      } else if (tile.id === 102) {
        // Sidak BPK & Radar OTT
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
            const rentCost = Math.round((tile.rent || 0) * inflationFactor * levelMultiplier * rentBonus);

            soundManager.playBuzzer();

            // Check if player has enough money to pay rent
            if (player.cash < rentCost) {
              const remainingPaid = player.cash;
              setPlayers(prev => prev.map(p => {
                if (p.id === owner.id) {
                  return { ...p, cash: p.cash + remainingPaid, stats: { ...p.stats, totalRentEarned: p.stats.totalRentEarned + remainingPaid } };
                }
                return p;
              }));
              handlePlayerBankruptcy(player, `Tidak mampu membayar sewa ${formatRupiah(rentCost)} kepada ${owner.name}`);
              return;
            }

            // Normal rent payment
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

        const adjustedBill = Math.round(billAmount * inflationFactor);
        soundManager.playBuzzer();

        // Check if player can afford the bill
        if (player.cash < adjustedBill) {
          handlePlayerBankruptcy(player, `Tidak sanggup melunasi tagihan/denda ${tile.name} sebesar ${formatRupiah(adjustedBill)}`);
          return;
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
          if (player.cash < 300_000) {
            handlePlayerBankruptcy(player, 'Tidak sanggup membayar calo administrasi di Dukcapil');
            return;
          }
          setPlayers(prev => prev.map(p => {
            if (p.id === player.id) {
              const updated = {
                ...p,
                cash: p.cash - 300_000,
                stress: Math.min(100, p.stress + 15)
              };
              checkStressThreshold(updated);
              return updated;
            }
            return p;
          }));
          addLog(`Blangko e-KTP habis! ${player.name} terpaksa bayar calo Rp 300.000 dan stres naik +15%.`, 'INFO', player.id);
        }
        break;
      }

      case 'EVENT_MUSIBAH': {
        soundManager.playSirenOTT();
        // Check if player owns Surat Tanah
        const ownedTiles = perimeterTiles.filter(t => player.ownedProperties.includes(t.id));
        if (ownedTiles.length > 0) {
          // The state seizes one Surat Tanah!
          const chosenTile = ownedTiles[Math.floor(Math.random() * ownedTiles.length)];
          
          // Clear ownership of the confiscated tile
          setPerimeterTiles(prev => prev.map(t => t.id === chosenTile.id ? { ...t, ownerId: null, level: 1 } : t));
          
          setPlayers(prev => prev.map(p => {
            if (p.id === player.id) {
              const updated = {
                ...p,
                ownedProperties: p.ownedProperties.filter(id => id !== chosenTile.id),
                stress: Math.min(100, p.stress + 20)
              };
              checkStressThreshold(updated);
              return updated;
            }
            return p;
          }));

          setMusibahConfiscatedTile(chosenTile);
          setMusibahFine(0);
          setShowMusibahModal(true);

          addLog(`🚨 RAMPASAN NEGARA! Satgas & PSN resmi mencabut dan menyita Surat Tanah ${chosenTile.certificateTitle || chosenTile.name} milik ${player.name}! Stres +20%.`, 'DANGER', player.id);
        } else {
          // Player has no Surat Tanah: pay emergency fine
          const inflationFactor = 1 + (macro.inflationRate / 100);
          const fineAmount = Math.round(1_500_000 * inflationFactor);
          
          if (player.cash < fineAmount) {
            handlePlayerBankruptcy(player, `Tidak sanggup melunasi retribusi musibah & denda darurat negara sebesar ${formatRupiah(fineAmount)}`);
            return;
          }

          setPlayers(prev => prev.map(p => {
            if (p.id === player.id) {
              const updated = {
                ...p,
                cash: p.cash - fineAmount,
                stress: Math.min(100, p.stress + 15)
              };
              checkStressThreshold(updated);
              return updated;
            }
            return p;
          }));

          setMusibahConfiscatedTile(null);
          setMusibahFine(fineAmount);
          setShowMusibahModal(true);

          addLog(`⚠️ EVENT MUSIBAH! ${player.name} tidak memiliki Surat Tanah. Kena denda retribusi bencana ${formatRupiah(fineAmount)}! Stres +15%.`, 'DANGER', player.id);
        }
        break;
      }

      case 'EVENT_TAKDIR': {
        soundManager.playCash();
        const outcomes: TakdirOutcome[] = [
          {
            id: 'ganti_untung_tol',
            title: 'Ganti Untung Proyek Jalan Tol Trans-Pulau',
            headline: 'PEMBEBASAN LAHAN JALAN TOL!',
            description: player.ownedProperties.length > 0
              ? `Lahan Surat Tanah milik ${player.name} dilintasi jalan tol nasional! Negara membayarkan ganti untung kompensasi berlipat!`
              : `Pemerintah menyalurkan stimulus pemerataan ekonomi daerah kepada ${player.name}!`,
            cashBonus: player.ownedProperties.length > 0 ? Math.max(3_500_000, player.ownedProperties.length * 1_500_000) : 2_000_000,
            stressReduction: 15,
            politicalBonus: 10
          },
          {
            id: 'warisan_sultan',
            title: 'Warisan Sultan & Tanah Adat Keraton',
            headline: 'DURIAN RUNTUH WARISAN SULTAN!',
            description: `Ditemukan dokumen silsilah keraton kuno yang sah! ${player.name} berhak atas hibah bagi hasil tanah ulayat keluarga besar.`,
            cashBonus: 3_000_000,
            stressReduction: 20,
            politicalBonus: 5
          },
          {
            id: 'pemekaran_dob',
            title: 'Pemekaran Daerah Otonom Baru (DOB)',
            headline: 'HOKI PEMEKARAN DAERAH OTONOM BARU!',
            description: `Daerah domisili ${player.name} resmi dimekarkan menjadi provinsi baru! Mendapat alokasi dana stimulus dan pengaruh politik.`,
            cashBonus: 2_500_000,
            stressReduction: 10,
            politicalBonus: 20
          },
          {
            id: 'investor_konglomerat',
            title: 'Suntikan Kemitraan CSR Konglomerat',
            headline: 'DANA KEMITRAAN KONGLOMERAT!',
            description: `Taipan konglomerat nasional terkesan dengan ketahanan ${player.name} dan mengucurkan dana kemitraan bergulir!`,
            cashBonus: 2_500_000,
            stressReduction: 25,
            politicalBonus: 15
          }
        ];

        const chosen = outcomes[Math.floor(Math.random() * outcomes.length)];

        setPlayers(prev => prev.map(p => {
          if (p.id === player.id) {
            return {
              ...p,
              cash: p.cash + chosen.cashBonus,
              stress: Math.max(0, p.stress - chosen.stressReduction),
              politicalInfluence: Math.min(100, p.politicalInfluence + chosen.politicalBonus)
            };
          }
          return p;
        }));

        setTakdirOutcome(chosen);
        setShowTakdirModal(true);

        addLog(`🎲 EVENT TAKDIR! ${player.name} mendapatkan: ${chosen.title} (+${formatRupiah(chosen.cashBonus)}, Stres -${chosen.stressReduction}%)!`, 'CASH', player.id);
        break;
      }

      case 'BANSOS_LUCK': {
        soundManager.playCash();
        setPlayers(prev => prev.map(p => p.id === player.id ? {
          ...p,
          cash: p.cash + 1_500_000,
          stress: Math.max(0, p.stress - 10)
        } : p));
        addLog(`Rezeki nomplok! ${player.name} dapat Bansos Beras senilai Rp 1,5 Jt dan Stres reda.`, 'CASH', player.id);
        break;
      }

      case 'PRISON_SUKAMISKIN': {
        addLog(`${player.name} mengunjungi Lapas Sukamiskin untuk membesuk rekan sejawat di ruang VIP.`, 'INFO', player.id);
        break;
      }
    }
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
    const upgradeCost = Math.round((currentTile.upgradeCost || 0) * inflationFactor);

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

    addLog(`${activePlayer.name} meningkatkan cabang usaha ${currentTile.name} ke Tingkat ${currentLevel + 1}!`, 'CASH', activePlayer.id);
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
      if (activePlayer.cash <= 0) {
        handlePlayerBankruptcy(activePlayer, 'Konsekuensi Finansial Kartu Dilema Konoha');
      } else {
        checkStressThreshold(activePlayer);
      }

      setPlayers([...players]);
    }

    setActiveDilemmaCard(null);
  };

  // Corruption Audit Resolve (BPK & KPK)
  const handleCorruptionAuditResolve = (caught: boolean) => {
    setShowCorruptionAudit(false);
    if (!activePlayer || activePlayer.isBankrupt) return;

    if (caught) {
      soundManager.playSirenOTT();

      // Rule: Tertangkap oleh KPK tanpa bisa memberi uang suap (Rp 2 Jt) -> Langsung Tersingkir!
      const bribeRequired = 2_000_000;
      if (activePlayer.cash < bribeRequired) {
        handlePlayerBankruptcy(activePlayer, 'Tertangkap OTT KPK tanpa sanggup membayar uang suap Rp 2.000.000');
        return;
      }

      // If AI, automatically pays the bribe to survive
      if (activePlayer.isAi) {
        soundManager.playCash();
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
          ...p,
          cash: p.cash - bribeRequired,
          kpkSuspicionLevel: 10,
          isInCorruptionRoute: false,
          position: 21 // safely arrives at Senayan
        } : p));
        addLog(`${activePlayer.name} menyuap oknum penyidik KPK sebesar Rp 2.000.000! Selamat dari vonis penjara dan lolos ke DPR Senayan.`, 'CASH', activePlayer.id);
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
    }
  };

  // Pay KPK Bribe Handler
  const handlePayKpkBribe = () => {
    setShowKpkBribe(false);
    if (!activePlayer || activePlayer.isBankrupt) return;
    const bribeAmount = 2_000_000;
    if (activePlayer.cash < bribeAmount) {
      handlePlayerBankruptcy(activePlayer, 'Tertangkap OTT KPK tanpa memiliki uang suap Rp 2.000.000');
      return;
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

    addLog(`${activePlayer.name} membayar uang suap Rp 2.000.000 ke oknum penyidik! Bebas dari OTT KPK dan tiba di DPR Senayan.`, 'CASH', activePlayer.id);
  };

  // Refuse KPK Bribe Handler
  const handleRefuseKpkBribe = () => {
    setShowKpkBribe(false);
    if (!activePlayer || activePlayer.isBankrupt) return;

    if (activePlayer.cash < 2_000_000) {
      handlePlayerBankruptcy(activePlayer, 'Tertangkap OTT KPK tanpa sanggup membayar uang suap Rp 2.000.000');
      return;
    }

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
    const bribeAmount = 2_000_000;
    if (activePlayer.cash < bribeAmount) return;

    soundManager.playCash();
    setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
      ...p,
      cash: p.cash - bribeAmount,
      inJail: false,
      jailTurnsLeft: 0,
      stress: Math.max(0, p.stress - 15)
    } : p));

    addLog(`${activePlayer.name} menyuap sipir Lapas sebesar Rp 2 Jt! Mendapat remisi kilat dan langsung bebas.`, 'CASH', activePlayer.id);
  };

  // Pass Public Law in DPR Senayan
  const handlePassLaw = (proposal: LawProposal) => {
    if (!activePlayer || activePlayer.isBankrupt || activePlayer.politicalInfluence < proposal.requiredInfluence) return;

    soundManager.playCash();

    // Deduct political influence
    setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
      ...p,
      politicalInfluence: p.politicalInfluence - proposal.requiredInfluence
    } : p));

    // Execute instant effect if applicable
    if (proposal.effectType === 'BANSOS_ORDAL') {
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
        ...p,
        cash: p.cash + 4_500_000
      } : p));
      addLog(`${activePlayer.name} mencairkan Dana Aspirasi Dapil sebesar Rp 4,5 Jt!`, 'CASH', activePlayer.id);
    } else if (proposal.effectType === 'LUXURY_TAX') {
      // Collect 15% cash from other players who have > 8 Jt
      let totalCollected = 0;
      setPlayers(prev => prev.map(p => {
        if (p.id !== activePlayer.id && !p.isBankrupt && p.cash > 8_000_000) {
          const tax = Math.round(p.cash * 0.15);
          totalCollected += tax;
          return { ...p, cash: p.cash - tax };
        }
        return p;
      }));

      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? {
        ...p,
        cash: p.cash + totalCollected
      } : p));

      addLog(`UU Pajak Barang Mewah diberlakukan! ${activePlayer.name} memungut ${formatRupiah(totalCollected)} dari pemain lawan!`, 'POLITIC', activePlayer.id);
    }

    const newLaw: ActiveLaw = {
      id: `${proposal.id}_${Date.now()}`,
      name: proposal.title,
      shortDesc: proposal.description,
      passedByPlayerId: activePlayer.id,
      effect: proposal.effectType as ActiveLaw['effect'],
      durationTurns: 4
    };

    setActiveLaws(prev => [...prev, newLaw]);
    setShowParliament(false);
    addLog(`PARIPURNA MENGETUK PALU: ${activePlayer.name} berhasil mengesahkan "${proposal.title}"!`, 'POLITIC', activePlayer.id);
  };

  // End Turn Engine
  const handleEndTurn = () => {
    if (!activePlayer) return;

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

    setMacro(prev => {
      let nextMonth = prev.monthIndex;
      let nextYear = prev.year;

      if (isNewMonth) {
        nextMonth = (prev.monthIndex % 12) + 1;
        if (nextMonth === 1) nextYear = prev.year + 1;
      }

      let newInflation = prev.inflationRate;
      let newBi = prev.biRate;
      let newUsd = prev.usdIdrRate;
      let newTrend = prev.trend;

      // Only fluctuate inflation when an entire month passes (every 8 rounds)
      if (isNewMonth) {
        const inflationDelta = Number((Math.random() * 1.6 - 0.7).toFixed(1));
        newInflation = Math.max(2.5, Math.min(18.0, Number((prev.inflationRate + inflationDelta).toFixed(1))));
        
        const biDelta = Number((Math.random() * 0.5 - 0.2).toFixed(2));
        newBi = Math.max(4.5, Math.min(10.0, Number((prev.biRate + biDelta).toFixed(2))));

        const usdDelta = Math.round(Math.random() * 300 - 100);
        newUsd = Math.max(15200, Math.min(18000, prev.usdIdrRate + usdDelta));

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

      return {
        ...prev,
        weekIndex: weekNumber,
        monthIndex: nextMonth,
        year: nextYear,
        inflationRate: newInflation,
        biRate: newBi,
        usdIdrRate: newUsd,
        trend: newTrend
      };
    });

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
        setMacro(m => ({ ...m, inflationRate: Number((m.inflationRate + 2.0).toFixed(1)), trend: 'VOLATILE' }));
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

    // AI Turn Execution with clear pacing so human player can observe
    const aiTimer = setTimeout(() => {
      if (!hasRolled && !activePlayer.inJail) {
        // Roll dice
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        handleRollDice(d1, d2, d1 + d2);
      } else if (hasRolled) {
        // AI Decides Property Purchase
        const curTile = perimeterTiles.find(t => t.id === activePlayer.position);
        if (curTile && curTile.actionType === 'PROPERTY' && !curTile.ownerId) {
          const inflationFactor = 1 + (macro.inflationRate / 100);
          const cost = Math.round((curTile.price || 0) * inflationFactor);
          if (activePlayer.cash > cost * 1.3) {
            handleBuyProperty();
          }
        }

        // End turn after thinking delay so human can follow
        setTimeout(() => {
          handleEndTurn();
        }, 1100);
      } else if (activePlayer.inJail) {
        if (activePlayer.cash >= 2_000_000) {
          handlePayJailBribe();
        }
        setTimeout(() => {
          handleEndTurn();
        }, 900);
      }
    }, 1200);

    return () => clearTimeout(aiTimer);
  }, [activePlayerIndex, hasRolled, isSetupOpen, isGameOver, activePlayer]);

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
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [showCorruptionGate, activePlayer]);

  // Handle AI Auto-Dismiss for Musibah and Takdir Modals
  useEffect(() => {
    if (activePlayer?.isAi) {
      if (showMusibahModal) {
        const timer = setTimeout(() => setShowMusibahModal(false), 2400);
        return () => clearTimeout(timer);
      }
      if (showTakdirModal) {
        const timer = setTimeout(() => setShowTakdirModal(false), 2400);
        return () => clearTimeout(timer);
      }
    }
  }, [showMusibahModal, showTakdirModal, activePlayer]);

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
            title={isSoundMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
            className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
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
                  Membayar <strong className="text-amber-300 font-mono">Rp 1.000.000</strong> ke psikiater. Tingkat stres berhasil diredakan 20% menjadi <strong className="text-emerald-300 font-mono">{psychologistNotice.newStress}%</strong>.
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
            />
          </div>

          {/* Right Sidebar: Active HUD & Quick Leaderboard */}
          <div className="lg:col-span-4 space-y-4">
            {activePlayer && !activePlayer.isBankrupt && (
              <PlayerHUD
                player={activePlayer}
                currentTile={currentLandingTile}
                hasRolled={hasRolled}
                isRolling={isRolling}
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
                  return (
                    <div
                      key={p.id}
                      className={`
                        p-2 rounded-xl border flex items-center justify-between text-xs transition-all
                        ${p.isBankrupt ? 'bg-rose-950/20 border-rose-900/50 opacity-60' : isCurrent ? 'bg-slate-800/80 border-amber-400/80 ring-1 ring-amber-400/30' : 'bg-slate-950/60 border-slate-800/80'}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{p.avatar}</span>
                        <div>
                          <div className="flex items-center gap-1 font-bold text-white">
                            <span>{p.name}</span>
                            {p.isBankrupt ? (
                              <span className="text-[9px] bg-rose-950 text-rose-400 px-1 py-0.2 rounded font-mono font-bold">
                                GUGUR
                              </span>
                            ) : p.inJail ? (
                              <span className="text-[9px] text-rose-400 font-mono">(Lapas)</span>
                            ) : null}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {p.isBankrupt ? 'Telah Tereliminasi' : `Stres ${p.stress}% · Politik ${p.politicalInfluence}`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
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
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Kabar Terkini Putaran:
              </span>
              <div className="text-slate-300 italic text-[11px] leading-relaxed line-clamp-3">
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
                  const d1 = Math.floor(Math.random() * 6) + 1;
                  const d2 = Math.floor(Math.random() * 6) + 1;
                  handleRollDice(d1, d2, d1 + d2);
                }}
                disabled={isRolling}
                className="min-h-[44px] flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span>{isRolling ? 'Mengocok...' : 'Kocok Dadu'}</span>
              </button>
            ) : hasRolled ? (
              <>
                {currentLandingTile.actionType === 'PROPERTY' && !currentLandingTile.ownerId && activePlayer.cash >= Math.round((currentLandingTile.price || 0) * (1 + macro.inflationRate / 100)) && (
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
                  className="min-h-[44px] flex-1 py-2 px-3 bg-white text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                >
                  <span>Akhiri</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : activePlayer.inJail ? (
              <button
                onClick={handlePayJailBribe}
                className="min-h-[44px] flex-1 py-2 px-3 bg-rose-900 border border-rose-700 text-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
              >
                <span>Suap Sipir Rp 2 Jt</span>
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
          bribeAmount={2_000_000}
          onPayBribe={handlePayKpkBribe}
          onRefuseBribe={handleRefuseKpkBribe}
        />
      )}

      {/* 4c. Event Musibah & Rampasan Negara Modal */}
      {showMusibahModal && activePlayer && (
        <MusibahModal
          player={activePlayer}
          confiscatedTile={musibahConfiscatedTile}
          calamityFine={musibahFine}
          hasSuratTanah={musibahConfiscatedTile !== null}
          onConfirm={() => setShowMusibahModal(false)}
        />
      )}

      {/* 4d. Event Takdir Nusantara Modal */}
      {showTakdirModal && activePlayer && takdirOutcome && (
        <TakdirModal
          player={activePlayer}
          outcome={takdirOutcome}
          onConfirm={() => setShowTakdirModal(false)}
        />
      )}

      {/* 5. DPR Senayan Parliament Modal */}
      {showParliament && activePlayer && (
        <ParliamentModal
          player={activePlayer}
          onPassLaw={handlePassLaw}
          onClose={() => setShowParliament(false)}
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
        tiles={[...perimeterTiles, ...corruptionTiles]}
        macro={macro}
        logs={logs}
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        activePlayerId={activePlayer?.id || 'player_1'}
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

      {/* 9. Game Over & Victory Podium */}
      {isGameOver && (
        <GameOverModal
          players={players}
          tiles={[...perimeterTiles, ...corruptionTiles]}
          macro={macro}
          onRestart={() => setIsSetupOpen(true)}
          reason={gameOverReason}
        />
      )}
    </div>
  );
}
