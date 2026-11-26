import { useEffect, useRef, useState } from 'react';
import {
  ActiveLaw,
  BoardTile,
  GameLogItem,
  GameMode,
  MacroEconomy,
  MacroHistoryPoint,
  Player,
  PlayerCorruptionHistoryPoint,
} from '../types/game';
import {
  clearGameSnapshot,
  loadGameSnapshot,
  saveGameSnapshot,
  SavedGameSnapshot,
} from '../engine/persistence';
import { saveGameToCloud } from '../engine/cloudApi';
import {
  getOrCreateClientId,
  leaveOnlineRoom,
  subscribeToOnlineRoom,
  syncOnlineRoomState,
} from '../engine/multiplayer';
import { soundManager } from '../utils/sound';
import { GameAction } from '../context/GameContext';

interface UsePersistenceAndMultiplayerParams {
  isSetupOpen: boolean;
  isGameOver: boolean;
  isRolling: boolean;
  isMoving: boolean;
  gameMode: GameMode;
  players: Player[];
  activePlayerIndex: number;
  perimeterTiles: BoardTile[];
  corruptionTiles: BoardTile[];
  luxuryTiles: BoardTile[];
  macro: MacroEconomy;
  macroHistory: MacroHistoryPoint[];
  corruptionHistory: PlayerCorruptionHistoryPoint[];
  activeLaws: ActiveLaw[];
  cycleRound: number;
  logs: GameLogItem[];
  dispatch: React.Dispatch<GameAction>;
  onResetTurnUi: () => void;
  onCloseOnlineLobby: () => void;
  addLog: (message: string, type?: GameLogItem['type'], playerId?: string) => void;
}

export function usePersistenceAndMultiplayer({
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
  onResetTurnUi,
  onCloseOnlineLobby,
  addLog,
}: UsePersistenceAndMultiplayerParams) {
  const [savedSnapshot, setSavedSnapshot] = useState<SavedGameSnapshot | null>(() => loadGameSnapshot());
  const [cloudSaveId, setCloudSaveId] = useState<string | null>(null);
  const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [clientId] = useState<string>(() => getOrCreateClientId());
  const [onlineRoomCode, setOnlineRoomCode] = useState<string | null>(null);
  const lastRemoteVersionRef = useRef<number>(0);
  const isApplyingRemoteSyncRef = useRef<boolean>(false);

  // Auto-save active game state to localStorage
  useEffect(() => {
    if (isSetupOpen) return;
    if (isGameOver) {
      clearGameSnapshot();
      setSavedSnapshot(null);
      return;
    }
    if (isRolling || isMoving) return;

    saveGameSnapshot({
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
    });
  }, [
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
  ]);

  // Subscribe event realtime dari room multiplayer online
  useEffect(() => {
    if (!onlineRoomCode) return;
    return subscribeToOnlineRoom(onlineRoomCode, {
      onStateSync: payload => {
        if (payload.senderClientId === clientId) return;
        if (payload.stateVersion <= lastRemoteVersionRef.current) return;
        lastRemoteVersionRef.current = payload.stateVersion;
        isApplyingRemoteSyncRef.current = true;
        dispatch({ type: 'RESUME_GAME', snapshot: payload.gameState });
      },
    });
  }, [onlineRoomCode, clientId, dispatch]);

  // Sinkronkan state permainan ke room multiplayer online (debounced)
  useEffect(() => {
    if (!onlineRoomCode || isSetupOpen || isRolling || isMoving) return;
    if (isApplyingRemoteSyncRef.current) {
      isApplyingRemoteSyncRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void syncOnlineRoomState(onlineRoomCode, clientId, {
        version: 1,
        savedAt: new Date().toISOString(),
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
      }).then(version => {
        if (typeof version === 'number' && version > lastRemoteVersionRef.current) {
          lastRemoteVersionRef.current = version;
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [
    onlineRoomCode,
    clientId,
    isSetupOpen,
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
  ]);

  const handleResumeSavedGame = () => {
    if (!savedSnapshot) return;
    dispatch({ type: 'RESUME_GAME', snapshot: savedSnapshot });
    onResetTurnUi();
    soundManager.playVictory();
  };

  const handleResumeCloudGame = (snapshot: SavedGameSnapshot, id: string) => {
    setCloudSaveId(id);
    setOnlineRoomCode(null);
    dispatch({ type: 'RESUME_GAME', snapshot });
    onResetTurnUi();
    soundManager.playVictory();
  };

  const handleEnterOnlineGame = (payload: {
    roomCode: string;
    stateVersion: number;
    snapshot: SavedGameSnapshot;
  }) => {
    lastRemoteVersionRef.current = payload.stateVersion;
    isApplyingRemoteSyncRef.current = true;
    setOnlineRoomCode(payload.roomCode);
    onCloseOnlineLobby();
    dispatch({ type: 'RESUME_GAME', snapshot: payload.snapshot });
    onResetTurnUi();
  };

  const handleLeaveOnlineRoom = async () => {
    if (onlineRoomCode) {
      await leaveOnlineRoom(onlineRoomCode, clientId);
      setOnlineRoomCode(null);
    }
  };

  const handleSaveToCloud = async () => {
    if (cloudSaveStatus === 'saving') return;
    setCloudSaveStatus('saving');
    const activeNames = players
      .filter(p => !p.isBankrupt)
      .slice(0, 2)
      .map(p => p.name.split(' ')[0])
      .join(' vs ');
    const title = `${activeNames || 'Sesi'} (Putaran #${cycleRound})`;
    const saved = await saveGameToCloud(
      {
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
      },
      title,
      cloudSaveId
    );

    if (saved) {
      setCloudSaveId(saved.id);
      setCloudSaveStatus('saved');
      addLog(`☁️ Sesi berhasil disimpan ke Cloud Database (${saved.title}).`, 'SYSTEM');
      setTimeout(() => setCloudSaveStatus('idle'), 2500);
    } else {
      setCloudSaveStatus('error');
      addLog('⚠️ Gagal menyimpan ke Cloud (pastikan `npm run server` aktif). Simpanan lokal tetap aman.', 'SYSTEM');
      setTimeout(() => setCloudSaveStatus('idle'), 2500);
    }
  };

  const resetPersistenceForNewGame = () => {
    clearGameSnapshot();
    setSavedSnapshot(null);
    setCloudSaveId(null);
    setCloudSaveStatus('idle');
    setOnlineRoomCode(null);
  };

  return {
    savedSnapshot,
    cloudSaveStatus,
    clientId,
    onlineRoomCode,
    handleResumeSavedGame,
    handleResumeCloudGame,
    handleEnterOnlineGame,
    handleLeaveOnlineRoom,
    handleSaveToCloud,
    resetPersistenceForNewGame,
  };
}
