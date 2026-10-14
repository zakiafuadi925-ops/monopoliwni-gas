import React, { useState } from 'react';
import { CHARACTER_ARCHETYPES } from '../data/characters';
import { Player, CharacterArchetype } from '../types/game';
import { Users, Bot, User, Play, Sparkles, Check } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface SetupGameModalProps {
  onStartGame: (players: Player[]) => void;
  bannerImage: string;
  onClose?: () => void;
}

interface PlayerConfig {
  name: string;
  isAi: boolean;
  archetypeId: string;
}

export const SetupGameModal: React.FC<SetupGameModalProps> = ({
  onStartGame,
  bannerImage,
  onClose
}) => {
  const [numPlayers, setNumPlayers] = useState<number>(3);

  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>([
    { name: 'Pemain 1', isAi: false, archetypeId: 'bambang_umr' },
    { name: 'Pemain 2 (Ordal)', isAi: true, archetypeId: 'pak_joko_asn' },
    { name: 'Pemain 3 (Caleg)', isAi: true, archetypeId: 'daud_politisi' },
    { name: 'Pemain 4 (Sultan)', isAi: true, archetypeId: 'kevin_sultan' },
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

    onStartGame(finalizedPlayers);
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

            <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-2.5 flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-amber-300 block mb-0.5">
                  Aturan Eliminasi & Survival:
                </span>
                <p className="text-[10px] text-slate-300 leading-snug">
                  • Kalah saat kehabisan uang kas (Rp 0).<br />
                  • Tertangkap KPK tanpa uang suap Rp 2 Jt langsung gugur!<br />
                  • Stres 100% wajib bayar psikolog Rp 1 Jt (-20% stres).
                </p>
              </div>
              <span className="text-[10px] text-amber-400 font-bold block mt-1 font-mono">
                Pemenang: Penyintas Terakhir yang Bertahan Hidup!
              </span>
            </div>
          </div>

          {/* Players Roster Customization */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide block">
              Pengaturan Karakter & Fraksi Pemain:
            </span>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {playerConfigs.slice(0, numPlayers).map((pCfg, idx) => {
                const currentArch = CHARACTER_ARCHETYPES.find(a => a.id === pCfg.archetypeId)!;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
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
                          className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-bold text-white text-xs w-full sm:w-36 focus:outline-none focus:border-amber-400 min-h-[36px]"
                          placeholder={`Pemain ${idx + 1}`}
                        />
                        <span className="text-[10px] text-slate-400 block truncate">
                          {currentArch.trait}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Human vs Bot Toggle */}
                      <button
                        onClick={() => updateConfig(idx, { isAi: !pCfg.isAi })}
                        className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                          pCfg.isAi
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {pCfg.isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        <span>{pCfg.isAi ? 'Bot AI' : 'Manusia'}</span>
                      </button>

                      {/* Archetype Selector */}
                      <select
                        value={pCfg.archetypeId}
                        onChange={e => updateConfig(idx, { archetypeId: e.target.value })}
                        className="min-h-[44px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 flex-1 sm:flex-initial"
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

          {/* Start Button */}
          <button
            onClick={handleLaunch}
            className="w-full min-h-[48px] py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl transition-all shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Mulai Pertarungan Monopoli WNI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
