/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  Player,
  BoardTile,
  BreakingNewsEvent,
  GameLogItem,
  DilemmaCard,
  GameMode,
  EventOutcomeCard,
  PlayerCorruptionHistoryPoint
} from './types/game';
import { PERIMETER_TILES, CORRUPTION_ROUTE_TILES } from './data/tiles';
import { CHARACTER_ARCHETYPES } from './data/characters';
import { SeasonalEvent } from './engine/seasonalEvents';
import { formatRupiahShort } from './utils/format';
import { soundManager } from './utils/sound';
import { GameProvider, useGame } from './context/GameContext';
import { BANNER_IMAGE, CREST_IMAGE, MONTH_NAMES } from './constants/gameAssets';
import { usePersistenceAndMultiplayer } from './hooks/usePersistenceAndMultiplayer';
import { useBoardMovement } from './hooks/useBoardMovement';
import { usePropertyAndRent } from './hooks/usePropertyAndRent';
import { useCardEvents } from './hooks/useCardEvents';
import { useCorruptionAndJail } from './hooks/useCorruptionAndJail';
import { usePoliticsAndTurn } from './hooks/usePoliticsAndTurn';
import { useAiAutomation } from './hooks/useAiAutomation';

// Components
import { Board } from './components/Board';
import { MacroIndicator } from './components/MacroIndicator';
import { CorruptionD3AreaChart } from './components/CorruptionD3AreaChart';
import { PlayerHUD } from './components/PlayerHUD';
import { DrasticLawBanner } from './components/DrasticLawBanner';
import { GameHeader } from './components/GameHeader';
import { GameNoticesBanner } from './components/GameNoticesBanner';
import { LiveStandingsCard } from './components/LiveStandingsCard';
import { MobileActionDock } from './components/MobileActionDock';
import { GameModals, DrawCardEventState, RentCrisisState } from './components/GameModals';
import { RentTransferData } from './components/ManualRentPaymentModal';

// Engine & Data
import { TradeOffer, applyTradeOffer } from './engine/trade';
import { LUXURY_BOARD_TILES } from './data/luxuryProperties';

function GameContent() {
  const {
    state: {
      isSetupOpen,
      isGameOver,
      gameOverReason,
      gameMode,
      players,
      activePlayerIndex,
      perimeterTiles,
      corruptionTiles,
      luxuryTiles,
      macro,
      macroHistory,
      corruptionHistory,
      activeLaws,
      cycleRound,
      logs
    },
    dispatch,
    setIsSetupOpen,
    setIsGameOver,
    setGameOverReason,
    setPlayers,
    setActivePlayerIndex,
    setPerimeterTiles,
    setCorruptionTiles,
    setLuxuryTiles,
    setMacro,
    setMacroHistory,
    setCorruptionHistory,
    setActiveLaws,
    setCycleRound,
    setLogs
  } = useGame();

  const [showOnlineLobby, setShowOnlineLobby] = useState<boolean>(false);
  const [showQuickGuide, setShowQuickGuide] = useState<boolean>(false);
  const [showTradeModal, setShowTradeModal] = useState<boolean>(false);
  const [gameSpeed, setGameSpeed] = useState<1 | 2 | 4>(1);
  const pace = (ms: number) => Math.max(120, Math.round(ms / gameSpeed));

  // Ephemeral UI & Turn Animation State
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

  // Helper to record / update D3.js corruption history snapshot
  const _recordCorruptionSnapshot = (targetPlayers: Player[], roundNumber: number) => {
    setCorruptionHistory(prev => {
      const existingIndex = prev.findIndex(p => p.round === roundNumber);
      const newPoint: PlayerCorruptionHistoryPoint = {
        round: roundNumber,
        label: `P${roundNumber}`,
        fullPeriod: `Putaran ${roundNumber} · Siklus Anggaran Aktif`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        playersData: targetPlayers.map(p => ({
          playerId: p.id,
          playerName: p.name,
          playerColor: p.color,
          playerAvatar: p.avatar,
          kpkSuspicionLevel: p.kpkSuspicionLevel,
          totalCorruptionGains: p.stats.totalCorruptionGains,
          cash: p.cash,
          isInCorruptionRoute: p.isInCorruptionRoute,
          inJail: p.inJail
        }))
      };
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = newPoint;
        return copy;
      }
      return [...prev, newPoint];
    });
  };

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
    seasonalEvent?: SeasonalEvent;
  } | null>(null);

  // Logs - Full scrollable history


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

  const {
    savedSnapshot,
    cloudSaveStatus,
    clientId,
    onlineRoomCode,
    handleResumeSavedGame,
    handleResumeCloudGame,
    handleEnterOnlineGame,
    handleLeaveOnlineRoom,
    handleSaveToCloud,
    resetPersistenceForNewGame
  } = usePersistenceAndMultiplayer({
    isSetupOpen,
    isGameOver,
    isRolling,
    isMoving,
    gameMode,
    players,
    activePlayerIndex,
    perimeterTiles,
    corruptionTiles,
    luxuryTiles,
    macro,
    macroHistory,
    corruptionHistory,
    activeLaws,
    cycleRound,
    logs,
    dispatch,
    onResetTurnUi: () => {
      setHasRolled(false);
      setIsRolling(false);
      setIsMoving(false);
      setLastRoll(null);
    },
    onCloseOnlineLobby: () => setShowOnlineLobby(false),
    addLog
  });

  // Eksekusi negosiasi barter properti antar pemain
  const handleExecuteTrade = (offer: TradeOffer) => {
    const { players: nextPlayers, perimeterTiles: nextTiles } = applyTradeOffer(offer, players, perimeterTiles);
    setPlayers(() => nextPlayers);
    setPerimeterTiles(() => nextTiles);
    const proposer = players.find(p => p.id === offer.proposerId);
    const target = players.find(p => p.id === offer.targetId);
    addLog(`💼 DEAL BARTER! ${proposer?.name ?? 'Pemain'} & ${target?.name ?? 'Pemain'} menyelesaikan kesepakatan properti.`, 'CASH', offer.proposerId);
    setShowTradeModal(false);
    soundManager.playVictory();
  };

  // Initialize game from Setup Modal (Survival or Fast Mode)
  const handleStartGame = (configuredPlayers: Player[], selectedMode: GameMode = gameMode) => {
    resetPersistenceForNewGame();
    dispatch({ type: 'INIT_GAME', players: configuredPlayers, gameMode: selectedMode });
    setHasRolled(false);
    setIsRolling(false);
    setIsMoving(false);
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    setLastRoll(null);
    setDiceRollAnimation(null);

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
    setCurrentNews(null);

    soundManager.playVictory();
    addLog(
      selectedMode === 'FAST'
        ? `Mode Cepat (15 Putaran) dimulai dengan ${configuredPlayers.length} pemain! Kekayaan bersih tertinggi di akhir Putaran #15 menang!`
        : `Pertarungan Survival WNI dimulai dengan ${configuredPlayers.length} pemain! Kemenangan sejati adalah siapa yang mampu bertahan hidup paling lama!`,
      'SYSTEM'
    );
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

  const {
    checkStressThreshold,
    handleRollDice,
    handleRollAnimationComplete,
  } = useBoardMovement({
    activePlayer,
    players,
    perimeterTiles,
    corruptionTiles,
    luxuryTiles,
    macro,
    activeLaws,
    hasRolled,
    isRolling,
    isMoving,
    rentCrisis,
    diceRollAnimation,
    moveTimerRef,
    activeDrawCardEventRef,
    setPlayers,
    setPerimeterTiles,
    setIsRolling,
    setIsMoving,
    setHasRolled,
    setLastRoll,
    setDiceRollAnimation,
    setPsychologistNotice,
    setRentCrisis,
    setManualRentData,
    setActiveDilemmaCard,
    setShowCorruptionGate,
    setShowCorruptionAudit,
    setShowMoneyLaundering,
    setShowParliament,
    setActiveDrawCardEvent,
    addLog,
    onPlayerBankruptcy: handlePlayerBankruptcy,
  });

  const {
    handleSellPropertyForRent,
    handleSellAllPropertiesForRent,
    handlePayRentFromCrisis,
    handleBankruptcyFromRentCrisis,
    handleUseSpecialCardForRent,
    handleConfirmManualRentPayment,
    handleUseSpecialCardForManualRent,
    handleBuyProperty,
    handleUpgradeProperty,
  } = usePropertyAndRent({
    activePlayer,
    players,
    perimeterTiles,
    macro,
    rentCrisis,
    manualRentData,
    setPlayers,
    setPerimeterTiles,
    setRentCrisis,
    setManualRentData,
    addLog,
    checkStressThreshold,
    onPlayerBankruptcy: handlePlayerBankruptcy,
  });

  const {
    handleChooseCardOption,
    handleConfirmDrawCardOutcome,
  } = useCardEvents({
    activePlayer,
    activePlayerIndex,
    players,
    perimeterTiles,
    macro,
    activeLaws,
    cycleRound,
    activeDilemmaCard,
    activeDrawCardEvent,
    activeDrawCardEventRef,
    aiEndTurnTimerRef,
    setPlayers,
    setPerimeterTiles,
    setMacro,
    setMacroHistory,
    setCurrentNews,
    setActiveDilemmaCard,
    setActiveDrawCardEvent,
    setRentCrisis,
    addLog,
    checkStressThreshold,
    onPlayerBankruptcy: handlePlayerBankruptcy,
    onEndTurn: () => handleEndTurn(),
  });

  const {
    handleCorruptionAuditResolve,
    handlePayKpkBribe,
    handleRefuseKpkBribe,
    handlePayJailBribe,
    handleLaunderBuyLuxury,
    handleLaunderBuyPerimeter,
    handleSkipLaundering,
  } = useCorruptionAndJail({
    activePlayer,
    perimeterTiles,
    macro,
    aiEndTurnTimerRef,
    setPlayers,
    setPerimeterTiles,
    setLuxuryTiles,
    setShowCorruptionAudit,
    setShowKpkBribe,
    setShowMoneyLaundering,
    setRentCrisis,
    addLog,
    checkStressThreshold,
    onEndTurn: () => handleEndTurn(),
  });

  const {
    handleVetoLaw,
    handlePassLaw,
    handleEndTurn,
  } = usePoliticsAndTurn({
    activePlayer,
    activePlayerIndex,
    players,
    perimeterTiles,
    macro,
    activeLaws,
    cycleRound,
    gameMode,
    isRolling,
    isMoving,
    rentCrisis,
    activeDrawCardEvent,
    activeDrawCardEventRef,
    activeDilemmaCard,
    showCorruptionGate,
    showCorruptionAudit,
    showKpkBribe,
    showParliament,
    showMoneyLaundering,
    manualRentData,
    aiEndTurnTimerRef,
    setPlayers,
    setPerimeterTiles,
    setActiveLaws,
    setShowParliament,
    setCycleRound,
    setMacro,
    setMacroHistory,
    setCorruptionHistory,
    setMonthNotice,
    setCurrentNews,
    setIsGameOver,
    setGameOverReason,
    setActivePlayerIndex,
    setHasRolled,
    setLastRoll,
    addLog,
    checkStressThreshold,
  });

  useAiAutomation({
    isSetupOpen,
    isGameOver,
    activePlayer,
    activePlayerIndex,
    players,
    perimeterTiles,
    corruptionTiles,
    luxuryTiles,
    macro,
    hasRolled,
    isRolling,
    isMoving,
    activeDrawCardEvent,
    activeDrawCardEventRef,
    activeDilemmaCard,
    showCorruptionGate,
    showCorruptionAudit,
    showMoneyLaundering,
    showKpkBribe,
    showParliament,
    manualRentData,
    rentCrisis,
    aiEndTurnTimerRef,
    pace,
    setPlayers,
    setShowParliament,
    setShowCorruptionGate,
    addLog,
    onRollDice: handleRollDice,
    onBuyProperty: handleBuyProperty,
    onPayJailBribe: handlePayJailBribe,
    onChooseCardOption: handleChooseCardOption,
    onPassLaw: handlePassLaw,
    onEndTurn: handleEndTurn,
  });

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      <GameHeader
        macro={macro}
        monthName={MONTH_NAMES[(macro.monthIndex - 1) % 12]}
        aliveCount={aliveCount}
        totalPlayers={players.length}
        gameMode={gameMode}
        cycleRound={cycleRound}
        onlineRoomCode={onlineRoomCode}
        isSetupOpen={isSetupOpen}
        isGameOver={isGameOver}
        canTrade={Boolean(activePlayer && !activePlayer.isBankrupt)}
        cloudSaveStatus={cloudSaveStatus}
        gameSpeed={gameSpeed}
        isSoundMuted={isSoundMuted}
        ambientDescription={soundManager.getAmbientDescription()}
        logsCount={logs.length}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenOnlineLobby={() => setShowOnlineLobby(true)}
        onLeaveOnlineRoom={() => void handleLeaveOnlineRoom()}
        onOpenGuide={() => setShowQuickGuide(true)}
        onOpenTrade={() => setShowTradeModal(true)}
        onSaveToCloud={() => void handleSaveToCloud()}
        onCycleSpeed={() => setGameSpeed(prev => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
        onToggleSound={() => {
          const enabled = soundManager.toggle();
          setIsSoundMuted(!enabled);
        }}
        onRestartNewRound={handleRestartNewRound}
        onOpenLogs={() => setShowLogsModal(true)}
      />

      {/* Persistent Drastic Coalition Law Banner at Top of Screen */}
      <DrasticLawBanner activeLaws={activeLaws} players={players} />

      {/* Main Game Arena */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 space-y-4 pb-24 lg:pb-6">
        <GameNoticesBanner
          eliminationNotice={eliminationNotice}
          onDismissElimination={() => setEliminationNotice(null)}
          psychologistNotice={psychologistNotice}
          onDismissPsychologist={() => setPsychologistNotice(null)}
          monthNotice={monthNotice}
          onDismissMonth={() => setMonthNotice(null)}
          onlineRoomCode={onlineRoomCode}
          activePlayer={activePlayer}
          clientId={clientId}
          isGameOver={isGameOver}
        />

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

            {/* Panel Visualisasi D3.js pada Sidebar: Tren Suspicion KPK & Total Gains Korupsi */}
            <CorruptionD3AreaChart
              players={players}
              history={corruptionHistory}
              currentRound={cycleRound}
            />

            <LiveStandingsCard
              players={players}
              activePlayerIndex={activePlayerIndex}
              aliveCount={aliveCount}
              logs={logs}
              onOpenStats={() => setIsStatsOpen(true)}
              onOpenLogs={() => setShowLogsModal(true)}
            />
          </div>
        </div>
      </main>

      {/* Floating Mobile Thumb Dock (Fixed Bottom Action Bar for Mobile Touch) */}
      {activePlayer && !activePlayer.isBankrupt && !isSetupOpen && !isGameOver && (
        <MobileActionDock
          activePlayer={activePlayer}
          currentLandingTile={currentLandingTile}
          macro={macro}
          hasRolled={hasRolled}
          isRolling={isRolling}
          isMoving={isMoving}
          isOnlineTurnLocked={Boolean(onlineRoomCode && activePlayer.id !== clientId)}
          onRoll={handleRollDice}
          onBuyProperty={handleBuyProperty}
          onEndTurn={handleEndTurn}
          onPayJailBribe={handlePayJailBribe}
          onOpenStats={() => setIsStatsOpen(true)}
        />
      )}

      {/* MODALS */}
      <GameModals
        isSetupOpen={isSetupOpen}
        isGameOver={isGameOver}
        gameOverReason={gameOverReason}
        gameMode={gameMode}
        cycleRound={cycleRound}
        players={players}
        activePlayer={activePlayer}
        perimeterTiles={perimeterTiles}
        corruptionTiles={corruptionTiles}
        luxuryTiles={luxuryTiles}
        macro={macro}
        macroHistory={macroHistory}
        corruptionHistory={corruptionHistory}
        logs={logs}
        savedSnapshot={savedSnapshot}
        clientId={clientId}
        showOnlineLobby={showOnlineLobby}
        showQuickGuide={showQuickGuide}
        showTradeModal={showTradeModal}
        activeDilemmaCard={activeDilemmaCard}
        showCorruptionGate={showCorruptionGate}
        showCorruptionAudit={showCorruptionAudit}
        showKpkBribe={showKpkBribe}
        activeDrawCardEvent={activeDrawCardEvent}
        showParliament={showParliament}
        showMoneyLaundering={showMoneyLaundering}
        currentNews={currentNews}
        isStatsOpen={isStatsOpen}
        selectedTile={selectedTile}
        showLogsModal={showLogsModal}
        rentCrisis={rentCrisis}
        manualRentData={manualRentData}
        onCloseSetup={() => setIsSetupOpen(false)}
        onOpenOnlineLobby={() => setShowOnlineLobby(true)}
        onCloseOnlineLobby={() => setShowOnlineLobby(false)}
        onCloseQuickGuide={() => setShowQuickGuide(false)}
        onCloseTradeModal={() => setShowTradeModal(false)}
        onCloseParliament={() => setShowParliament(false)}
        onDismissNews={() => setCurrentNews(null)}
        onCloseStats={() => setIsStatsOpen(false)}
        onOpenFullHistoryFromStats={() => {
          setIsStatsOpen(false);
          setShowLogsModal(true);
        }}
        onCloseTileDetail={() => setSelectedTile(null)}
        onCloseLogsModal={() => setShowLogsModal(false)}
        onStartGame={handleStartGame}
        onResumeSavedGame={handleResumeSavedGame}
        onResumeCloudGame={handleResumeCloudGame}
        onEnterOnlineGame={handleEnterOnlineGame}
        onExecuteTrade={handleExecuteTrade}
        onChooseCardOption={handleChooseCardOption}
        onEnterCorruptionRoute={() => {
          if (!activePlayer) return;
          setShowCorruptionGate(false);
          setPlayers(prev =>
            prev.map(p =>
              p.id === activePlayer.id
                ? {
                    ...p,
                    isInCorruptionRoute: true,
                    position: 100,
                  }
                : p
            )
          );
          addLog(
            `${activePlayer.name} nekat masuk Rute Korupsi! Berada di Petak #100 Pengadaan Fiktif.`,
            'DANGER',
            activePlayer.id
          );
        }}
        onStayOnNormalPath={() => {
          if (!activePlayer) return;
          setShowCorruptionGate(false);
          addLog(
            `${activePlayer.name} memilih tetap di jalur aman rakyat biasa.`,
            'INFO',
            activePlayer.id
          );
        }}
        onCorruptionAuditResolve={handleCorruptionAuditResolve}
        onPayKpkBribe={handlePayKpkBribe}
        onRefuseKpkBribe={handleRefuseKpkBribe}
        onConfirmDrawCardOutcome={handleConfirmDrawCardOutcome}
        onPassLaw={handlePassLaw}
        onVetoLaw={handleVetoLaw}
        onLaunderBuyLuxury={handleLaunderBuyLuxury}
        onLaunderBuyPerimeter={handleLaunderBuyPerimeter}
        onSkipLaundering={handleSkipLaundering}
        onRestartNewRound={handleRestartNewRound}
        onQuickRestart={handleQuickRestart}
        onSellPropertyForRent={handleSellPropertyForRent}
        onSellAllPropertiesForRent={handleSellAllPropertiesForRent}
        onPayRentFromCrisis={handlePayRentFromCrisis}
        onBankruptcyFromRentCrisis={handleBankruptcyFromRentCrisis}
        onUseSpecialCardForRent={handleUseSpecialCardForRent}
        onConfirmManualRentPayment={handleConfirmManualRentPayment}
        onUseSpecialCardForManualRent={handleUseSpecialCardForManualRent}
      />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
