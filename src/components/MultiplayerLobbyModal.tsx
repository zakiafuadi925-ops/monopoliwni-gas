import React, { useEffect, useState } from 'react';
import { Copy, Check, Globe, LogOut, Play, Users, X } from 'lucide-react';
import { CHARACTER_ARCHETYPES } from '../data/characters';
import {
  createInitialCorruptionHistory,
  INITIAL_MACRO_HISTORY,
  INITIAL_MACRO_STATE
} from '../context/GameContext';
import { CORRUPTION_ROUTE_TILES, PERIMETER_TILES } from '../data/tiles';
import { LUXURY_BOARD_TILES } from '../data/luxuryProperties';
import { GameMode } from '../types/game';
import {
  buildOnlinePlayers,
  createOnlineRoom,
  joinOnlineRoom,
  leaveOnlineRoom,
  OnlineRoom,
  startOnlineRoom,
  subscribeToOnlineRoom
} from '../engine/multiplayer';
import { SavedGameSnapshot } from '../engine/persistence';
import { soundManager } from '../utils/sound';

interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  clientId: string;
  onClose: () => void;
  onEnterOnlineGame: (payload: {
    roomCode: string;
    stateVersion: number;
    snapshot: SavedGameSnapshot;
  }) => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  isOpen,
  clientId,
  onClose,
  onEnterOnlineGame
}) => {
  const [playerName, setPlayerName] = useState<string>('Pemain Online');
  const [archetypeId, setArchetypeId] = useState<string>(CHARACTER_ARCHETYPES[0].id);
  const [gameMode, setGameMode] = useState<GameMode>('SURVIVAL');
  const [joinCode, setJoinCode] = useState<string>('');
  const [room, setRoom] = useState<OnlineRoom | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !room?.code) return;
    const unsubscribe = subscribeToOnlineRoom(room.code, {
      onRoomUpdated: updated => setRoom(updated),
      onGameStarted: payload => {
        soundManager.playVictory();
        onEnterOnlineGame({
          roomCode: payload.room.code,
          stateVersion: payload.stateVersion,
          snapshot: payload.gameState
        });
      }
    });
    return unsubscribe;
  }, [isOpen, room?.code, onEnterOnlineGame]);

  if (!isOpen) return null;

  const isHost = room?.hostClientId === clientId;

  const handleCreateRoom = async () => {
    setBusy(true);
    setErrorMsg(null);
    const res = await createOnlineRoom({
      hostClientId: clientId,
      hostName: playerName,
      archetypeId,
      gameMode
    });
    setBusy(false);
    if (res.error || !res.room) {
      setErrorMsg(res.error || 'Gagal membuat room');
      return;
    }
    setRoom(res.room);
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setErrorMsg('Masukkan kode room 6 karakter.');
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    const res = await joinOnlineRoom(joinCode, {
      clientId,
      name: playerName,
      archetypeId
    });
    setBusy(false);
    if (res.error || !res.room) {
      setErrorMsg(res.error || 'Gagal bergabung ke room');
      return;
    }
    setRoom(res.room);
  };

  const handleStartMatch = async () => {
    if (!room) return;
    setBusy(true);
    setErrorMsg(null);

    const players = buildOnlinePlayers(room.participants);
    const snapshot: SavedGameSnapshot = {
      version: 1,
      savedAt: new Date().toISOString(),
      gameMode: room.gameMode,
      players,
      activePlayerIndex: 0,
      perimeterTiles: PERIMETER_TILES.map(t => ({ ...t, ownerId: null, level: 1 })),
      corruptionTiles: CORRUPTION_ROUTE_TILES.map(t => ({ ...t, ownerId: null, level: 1 })),
      luxuryTiles: LUXURY_BOARD_TILES.map(t => ({ ...t, ownerId: null, level: 1 })),
      macro: INITIAL_MACRO_STATE,
      macroHistory: INITIAL_MACRO_HISTORY,
      corruptionHistory: createInitialCorruptionHistory(players),
      activeLaws: [],
      cycleRound: 1,
      logs: [
        {
          id: `online_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          message: `🌐 Room Online ${room.code} dimulai dengan ${players.length} pemain!`,
          type: 'SYSTEM'
        }
      ]
    };

    const res = await startOnlineRoom(room.code, clientId, snapshot);
    setBusy(false);
    if (res.error || !res.room) {
      setErrorMsg(res.error || 'Gagal memulai pertandingan');
      return;
    }

    soundManager.playVictory();
    onEnterOnlineGame({
      roomCode: res.room.code,
      stateVersion: res.room.stateVersion,
      snapshot
    });
  };

  const handleLeave = async () => {
    if (room) {
      await leaveOnlineRoom(room.code, clientId);
      setRoom(null);
    }
    onClose();
  };

  const handleCopyCode = () => {
    if (!room) return;
    void navigator.clipboard?.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-sky-500/70 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-base font-black text-white">Lobby Multiplayer Online</h2>
              <p className="text-[11px] text-slate-400">Main bareng lintas tab/perangkat via Room Code</p>
            </div>
          </div>
          <button
            onClick={() => void handleLeave()}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs">
              {errorMsg}
            </div>
          )}

          {!room ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nama Anda</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    maxLength={20}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Karakter</label>
                  <select
                    value={archetypeId}
                    onChange={e => setArchetypeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                  >
                    {CHARACTER_ARCHETYPES.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.avatar} {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2.5">
                <span className="text-xs font-bold text-sky-300 block">Buat Room Baru (Sebagai Host)</span>
                <div className="flex gap-2">
                  {(['SURVIVAL', 'FAST'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setGameMode(mode)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                        gameMode === mode
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      {mode === 'FAST' ? 'Mode Cepat (15 Putaran)' : 'Survival Klasik'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => void handleCreateRoom()}
                  disabled={busy}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {busy ? 'Memproses...' : 'Buat Room & Dapatkan Kode'}
                </button>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                <span className="text-xs font-bold text-emerald-300 block">Atau Gabung ke Room Teman</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: WNI842"
                    maxLength={6}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono tracking-widest uppercase text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={() => void handleJoinRoom()}
                    disabled={busy}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Gabung
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-sky-500/40 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Kode Room Anda</span>
                  <span className="text-2xl font-mono font-black tracking-widest text-sky-300">{room.code}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Pemain di Lobby ({room.participants.length}/4)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">{room.gameMode}</span>
                </div>
                <div className="space-y-1.5">
                  {room.participants.map(p => {
                    const arch = CHARACTER_ARCHETYPES.find(a => a.id === p.archetypeId);
                    return (
                      <div
                        key={p.clientId}
                        className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-white flex items-center gap-2">
                          <span>{arch?.avatar ?? '👤'}</span>
                          <span>{p.name}</span>
                          {p.clientId === clientId && (
                            <span className="text-[10px] text-sky-400 font-semibold">(Anda)</span>
                          )}
                        </span>
                        {p.isHost && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                            HOST
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => void handleLeave()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
                {isHost ? (
                  <button
                    onClick={() => void handleStartMatch()}
                    disabled={busy || room.participants.length < 2}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {room.participants.length < 2 ? 'Menunggu Pemain Lain (Min. 2)' : 'Mulai Pertarungan Online'}
                    </span>
                  </button>
                ) : (
                  <div className="flex-1 py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-center text-slate-400">
                    Menunggu Host memulai permainan...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
