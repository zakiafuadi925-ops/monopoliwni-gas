import React, { useEffect, useState } from 'react';
import { CHARACTER_ARCHETYPES } from '../data/characters';
import { AiDifficulty, GameMode, Player } from '../types/game';
import { Users, Bot, User, Play, Sparkles, Check, RotateCcw, Zap, Cloud, Trash2, Globe } from 'lucide-react';
import { soundManager } from '../utils/sound';
import { SavedGameSnapshot } from '../engine/persistence';
import {
  checkBackendHealth,
  CloudSaveRecord,
  deleteCloudSave,
  listCloudSaves
} from '../engine/cloudApi';

interface SetupGameModalProps {
  onStartGame: (players: Player[], gameMode: GameMode) => void;
  bannerImage: string;
  onClose?: () => void;
  savedSnapshot?: SavedGameSnapshot | null;
  onResumeSavedGame?: () => void;
  onResumeCloudGame?: (snapshot: SavedGameSnapshot, cloudId: string) => void;
  onOpenOnlineLobby?: () => void;
}

interface PlayerConfig {
  name: string;
  isAi: boolean;
  archetypeId: string;
  aiDifficulty: AiDifficulty;
}

export const SetupGameModal: React.FC<SetupGameModalProps> = ({
  onStartGame,
  bannerImage,
  onClose,
  savedSnapshot,
  onResumeSavedGame,
  onResumeCloudGame,
  onOpenOnlineLobby
}) => {
  const [numPlayers, setNumPlayers] = useState<number>(3);
  const [gameMode, setGameMode] = useState<GameMode>('SURVIVAL');
  const [cloudOnline, setCloudOnline] = useState<boolean>(false);
  const [cloudMode, setCloudMode] = useState<'mongodb' | 'memory' | undefined>(undefined);
  const [cloudSaves, setCloudSaves] = useState<CloudSaveRecord[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const health = await checkBackendHealth();
      if (!active) return;
      setCloudOnline(health.online);
      setCloudMode(health.mode);
      if (health.online) {
        const saves = await listCloudSaves(4);
        if (active) setCloudSaves(saves);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleDeleteCloudSave = async (id: string) => {
    const ok = await deleteCloudSave(id);
    if (ok) {
      setCloudSaves(prev => prev.filter(item => item.id !== id));
    }
  };

  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>([
    { name: 'Pemain 1', isAi: false, archetypeId: 'bambang_umr', aiDifficulty: 'SANTAI' },
    { name: 'Pemain 2 (Ordal)', isAi: true, archetypeId: 'pak_joko_asn', aiDifficulty: 'SANTAI' },
    { name: 'Pemain 3 (Caleg)', isAi: true, archetypeId: 'daud_politisi', aiDifficulty: 'KORUPTOR' },
    { name: 'Pemain 4 (Sultan)', isAi: true, archetypeId: 'kevin_sultan', aiDifficulty: 'AGRESIF' },
  ]);

  const updateConfig = (idx: number, patch: Partial<PlayerConfig>) => {
    setPlayerConfigs(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const handleLaunch = () => {
    soundManager.playVictory();

    const finalizedPlayers: Player[] = playerConfigs.slice(0, numPlayers).map((cfg, idx) => {
      const arch = CHARACTER_ARCHETYPES.find(a => a.id === cfg.archetypeId) || CHARACTER_ARCHETYPES[idx % CHARACTER_ARCHETYPES.length];
      return {
        id: `player_${idx + 1}`,
        name: cfg.name.trim() || `Pemain ${idx + 1}`,
        archetypeId: arch.id,
        isAi: cfg.isAi,
        aiDifficulty: cfg.isAi ? cfg.aiDifficulty : undefined,
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
        color: arch.color,
        avatar: arch.avatar,
        title: arch.title,
        stats: {
          totalRentEarned: 0,
          totalRentPaid: 0,
          totalCorruptionGains: 0,
          cardsDrawn: 0,
          timesInJail: 0
        }
      };
    });

    onStartGame(finalizedPlayers, gameMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative max-w-2xl w-full bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto max-h-[95vh] flex flex-col">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            title="Tutup / Kembali ke permainan"
          >
            ✕
          </button>
        )}
        {/* Banner */}
        <div className="relative h-28 sm:h-36 bg-slate-950 overflow-hidden border-b border-amber-500/40 shrink-0">
          <img
            src={bannerImage}
            alt="Monopoli WNI Simulator"
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-end p-3 sm:p-4">
            <span className="text-[10px] sm:text-[11px] uppercase font-bold text-amber-400 tracking-wider">
              Mode Multiplayer & Persaingan Politik
            </span>
            <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
              MONOPOLI WNI: SURVIVAL & RUTE KORUPSI
            </h1>
          </div>
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Controls: Player Count & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-950/60 p-3 sm:p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                Jumlah Pemain (2 - 4):
              </label>
              <div className="flex gap-2">
                {[2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setNumPlayers(num)}
                    className={`min-h-[44px] flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      numPlayers === num
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {num} Pemain
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-2.5 flex flex-col justify-between gap-2">
              <div>
                <span className="text-[11px] uppercase font-bold text-amber-300 flex items-center gap-1 mb-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Mode Permainan:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGameMode('SURVIVAL')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      gameMode === 'SURVIVAL'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    Survival Penuh
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameMode('FAST')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      gameMode === 'FAST'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    Mode Cepat (15P)
                  </button>
                </div>
              </div>
              <span className="text-[10px] text-amber-300/90 font-medium block leading-snug">
                {gameMode === 'FAST'
                  ? 'Batas 15 Putaran: Pemenang ditentukan dari total kekayaan bersih tertinggi (kas + aset) di akhir Putaran #15!'
                  : 'Survival Penuh: Kalah saat bangkrut; pemenang adalah penyintas terakhir yang bertahan hidup.'}
              </span>
            </div>
          </div>

          {/* Players Roster Customization */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide block">
              Pengaturan Karakter & Fraksi Pemain:
            </span>

            <div className="space-y-2.5">
              {playerConfigs.slice(0, numPlayers).map((pCfg, idx) => {
                const currentArch = CHARACTER_ARCHETYPES.find(a => a.id === pCfg.archetypeId)!;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2.5 text-xs min-w-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 shadow shrink-0"
                        style={{ borderColor: currentArch.color, backgroundColor: `${currentArch.color}20` }}
                      >
                        {currentArch.avatar}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <input
                          type="text"
                          value={pCfg.name}
                          onChange={e => updateConfig(idx, { name: e.target.value })}
                          className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-bold text-white text-xs w-full focus:outline-none focus:border-amber-400 min-h-[36px]"
                          placeholder={`Pemain ${idx + 1}`}
                        />
                        <span className="text-[10px] text-slate-400 block truncate">
                          {currentArch.trait}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      {/* Human vs Bot Toggle */}
                      <button
                        onClick={() => updateConfig(idx, { isAi: !pCfg.isAi })}
                        className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                          pCfg.isAi
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {pCfg.isAi ? <Bot className="w-4 h-4 shrink-0" /> : <User className="w-4 h-4 shrink-0" />}
                        <span>{pCfg.isAi ? 'Bot AI' : 'Manusia'}</span>
                      </button>

                      {pCfg.isAi && (
                        <select
                          value={pCfg.aiDifficulty}
                          onChange={e => updateConfig(idx, { aiDifficulty: e.target.value as AiDifficulty })}
                          title="Kepribadian & Tingkat Kesulitan Bot AI"
                          className="min-h-[40px] bg-slate-900 border border-purple-800/70 rounded-lg px-2 py-1.5 text-xs text-purple-200 focus:outline-none focus:border-amber-400 shrink-0"
                        >
                          <option value="SANTAI">AI: Santai</option>
                          <option value="AGRESIF">AI: Agresif</option>
                          <option value="KORUPTOR">AI: Koruptor</option>
                        </select>
                      )}

                      {/* Archetype Selector */}
                      <select
                        value={pCfg.archetypeId}
                        onChange={e => updateConfig(idx, { archetypeId: e.target.value })}
                        className="min-h-[40px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 flex-1 min-w-[180px] max-w-full"
                      >
                        {CHARACTER_ARCHETYPES.map(arch => (
                          <option key={arch.id} value={arch.id}>
                            {arch.name} ({arch.title})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resume Saved Game */}
          {savedSnapshot && onResumeSavedGame && (
            <button
              onClick={() => {
                soundManager.playVictory();
                onResumeSavedGame();
              }}
              className="w-full min-h-[48px] py-3 px-4 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/60 text-emerald-200 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Lanjutkan Sesi Terakhir (Putaran #{savedSnapshot.cycleRound})</span>
              </span>
              <span className="text-[11px] font-normal text-emerald-300/80 shrink-0">
                {savedSnapshot.players.filter(p => !p.isBankrupt).length} Pemain Aktif
              </span>
            </button>
          )}

          {/* Cloud Saves (MongoDB / Backend API) */}
          {onResumeCloudGame && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Cloud className={`w-4 h-4 ${cloudOnline ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span>Simpanan Cloud ({cloudOnline ? (cloudMode === 'mongodb' ? 'MongoDB' : 'Server Memory') : 'Offline'})</span>
                </span>
                {cloudOnline && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold">
                    Terhubung
                  </span>
                )}
              </div>

              {cloudOnline && cloudSaves.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {cloudSaves.map(save => (
                    <div
                      key={save.id}
                      className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
                    >
                      <button
                        onClick={() => {
                          soundManager.playVictory();
                          onResumeCloudGame(save, save.id);
                        }}
                        className="flex-1 text-left hover:text-sky-300 transition-colors cursor-pointer truncate"
                      >
                        <span className="font-bold text-slate-100">{save.title}</span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          P#{save.cycleRound} · {save.gameMode ?? 'SURVIVAL'}
                        </span>
                      </button>
                      <button
                        onClick={() => void handleDeleteCloudSave(save.id)}
                        title="Hapus simpanan cloud"
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  {cloudOnline
                    ? 'Belum ada sesi tersimpan di database. Gunakan tombol "Simpan Cloud" saat bermain.'
                    : 'Server backend belum dijalankan (npm run server). Simpanan lokal tetap aktif otomatis.'}
                </p>
              )}
            </div>
          )}

          {/* Start Button */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleLaunch}
              className="flex-1 min-h-[48px] py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl transition-all shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Mulai Pertarungan Lokal</span>
            </button>
            {onOpenOnlineLobby && (
              <button
                onClick={onOpenOnlineLobby}
                className="min-h-[48px] py-3.5 px-5 bg-sky-600 hover:bg-sky-500 text-white font-black text-sm rounded-xl transition-all shadow-xl shadow-sky-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Globe className="w-5 h-5" />
                <span>Main Online</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
