import React, { useState } from 'react';
import { Player, BoardTile, MacroEconomy, GameLogItem, MacroHistoryPoint, PlayerCorruptionHistoryPoint } from '../types/game';
import { formatRupiah, formatRupiahShort, formatPercent } from '../utils/format';
import { MacroHistoryChart } from './MacroHistoryChart';
import { 
  StressIndicator, 
  PoliticalInfluenceGauge, 
  KPKRadarGauge,
  KPKRadarPingEffect
} from './VitalIndicators';
import { CorruptionD3AreaChart } from './CorruptionD3AreaChart';
import { 
  BarChart3, 
  Wallet, 
  Building2, 
  HeartCrack, 
  Crown, 
  History, 
  ShieldAlert, 
  TrendingUp,
  X,
  Users,
  LineChart,
  ArrowRight,
  Sparkles,
  Radio
} from 'lucide-react';

interface PlayerStatsDrawerProps {
  players: Player[];
  tiles: BoardTile[];
  macro: MacroEconomy;
  macroHistory?: MacroHistoryPoint[];
  corruptionHistory?: PlayerCorruptionHistoryPoint[];
  currentRound?: number;
  logs: GameLogItem[];
  isOpen: boolean;
  onClose: () => void;
  activePlayerId: string;
  onOpenFullHistory?: () => void;
}

export const PlayerStatsDrawer: React.FC<PlayerStatsDrawerProps> = ({
  players,
  tiles,
  macro,
  macroHistory = [],
  corruptionHistory = [],
  currentRound = 1,
  logs,
  isOpen,
  onClose,
  activePlayerId,
  onOpenFullHistory
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(activePlayerId);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MACRO' | 'CORRUPTION' | 'PROPERTIES' | 'LOGS'>('OVERVIEW');

  if (!isOpen) return null;

  const inflationFactor = 1 + (macro.inflationRate / 100);

  // Calculate Net Worth for a player
  const calculateNetWorth = (p: Player) => {
    let propValuation = 0;
    p.ownedProperties.forEach(tileId => {
      const tile = tiles.find(t => t.id === tileId);
      if (tile && tile.price) {
        const base = tile.price * inflationFactor;
        const upgradeBase = (tile.upgradeCost || 0) * (tile.level ? tile.level - 1 : 0);
        propValuation += base + upgradeBase;
      }
    });
    return Math.round(p.cash + propValuation);
  };

  // Sort players by Net Worth for leaderboard
  const sortedPlayers = [...players].sort((a, b) => calculateNetWorth(b) - calculateNetWorth(a));
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || players[0];

  const ownedTileObjects = tiles.filter(t => selectedPlayer.ownedProperties.includes(t.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-white tracking-wide">
              Statistik & Transparansi Pemain
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Peringkat</span>
          </button>
          <button
            onClick={() => setActiveTab('MACRO')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 relative cursor-pointer ${
              activeTab === 'MACRO'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Makro</span>
            {macro.trend === 'CRISIS' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1.5 right-1.5" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('CORRUPTION')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 relative cursor-pointer ${
              activeTab === 'CORRUPTION'
                ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                : 'text-rose-400/90 hover:text-rose-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>KPK D3</span>
          </button>
          <button
            onClick={() => setActiveTab('PROPERTIES')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'PROPERTIES'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Aset</span>
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'LOGS'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Log</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Leaderboard Podium */}
              <div>
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider block mb-2">
                  Peringkat Kekayaan Bersih (Net Worth)
                </span>
                <div className="space-y-2.5">
                  {sortedPlayers.map((p, rank) => {
                    const netWorth = calculateNetWorth(p);
                    const isSelected = p.id === selectedPlayerId;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlayerId(p.id)}
                        className={`
                          p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between
                          ${isSelected 
                            ? 'border-amber-400 bg-amber-950/30 shadow-md ring-1 ring-amber-400/50' 
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold font-mono
                            ${rank === 0 ? 'bg-amber-500 text-slate-950' : rank === 1 ? 'bg-slate-300 text-slate-900' : 'bg-slate-800 text-slate-400'}
                          `}>
                            {rank + 1}
                          </span>

                          <div 
                            className="relative w-8 h-8 rounded-xl flex items-center justify-center text-base border shrink-0"
                            style={{ borderColor: p.color, backgroundColor: `${p.color}20` }}
                          >
                            {p.avatar}
                            {p.id === activePlayerId && (
                              <span 
                                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white animate-ping"
                                style={{ backgroundColor: p.color }}
                              />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span 
                                className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded border text-white"
                                style={{ backgroundColor: `${p.color}50`, borderColor: p.color }}
                              >
                                {p.id.startsWith('player_') ? `P${p.id.replace('player_', '')}` : 'P'}
                              </span>
                              <span className="font-bold text-sm text-white">
                                {p.name}
                              </span>
                              {p.id === activePlayerId && (
                                <span 
                                  className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full text-white animate-pulse flex items-center gap-1"
                                  style={{ backgroundColor: p.color }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  <span>GILIRAN</span>
                                </span>
                              )}
                              {p.isAi && (
                                <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">
                                  AI
                                </span>
                              )}
                              {p.inJail && (
                                <span className="text-[9px] bg-rose-900 text-rose-300 px-1 py-0.2 rounded font-bold">
                                  Lapas
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {p.title}
                            </span>

                            {/* Mini Vitals Badges in Leaderboard */}
                            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                              <span 
                                title={`Tingkat Stres: ${p.stress}%`}
                                className={`px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5 ${
                                  p.stress >= 80 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-900 text-slate-400'
                                }`}
                              >
                                <HeartCrack className="w-2.5 h-2.5" />
                                {p.stress}%
                              </span>

                              <span 
                                title={`Modal Politik: ${p.politicalInfluence}/100`}
                                className="px-1.5 py-0.2 rounded font-mono font-bold bg-slate-900 text-amber-400 flex items-center gap-0.5"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                {p.politicalInfluence}
                              </span>

                              <span 
                                title={`Radar Pengawasan KPK: ${p.kpkSuspicionLevel}%${p.kpkSuspicionLevel > 60 ? ' - RISIKO TINGGI OTT!' : ''}`}
                                className={`relative px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1 ${
                                  p.kpkSuspicionLevel > 60 
                                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]' 
                                    : p.kpkSuspicionLevel > 50 
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                                    : 'bg-slate-900 text-slate-400'
                                }`}
                              >
                                <span className="relative flex items-center justify-center">
                                  {p.kpkSuspicionLevel > 60 && (
                                    <KPKRadarPingEffect suspicionLevel={p.kpkSuspicionLevel} size="sm" />
                                  )}
                                  <ShieldAlert className={`w-2.5 h-2.5 relative z-10 ${p.kpkSuspicionLevel > 60 ? 'text-rose-400' : ''}`} />
                                </span>
                                <span>{p.kpkSuspicionLevel}%</span>
                                {p.kpkSuspicionLevel > 60 && (
                                  <span className="text-[8px] bg-rose-600 text-white px-0.5 rounded font-black tracking-tighter">
                                    OTT
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold font-mono text-emerald-400 block">
                            {formatRupiah(netWorth)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Kas: {formatRupiahShort(p.cash)} · {p.ownedProperties.length} Aset
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Metrics of Selected Player */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedPlayer.avatar}</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">
                        Detail Status & Indikator Vital: {selectedPlayer.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">
                          {selectedPlayer.title}
                        </span>
                        {selectedPlayer.kpkSuspicionLevel > 60 && (
                          <div 
                            className="relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/90 border border-rose-500 text-rose-300 text-[10px] font-bold shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                            title={`RISIKO OTT TINGGI! Penyadapan KPK di ${selectedPlayer.kpkSuspicionLevel}%`}
                          >
                            <span className="relative flex items-center justify-center w-3 h-3">
                              <KPKRadarPingEffect suspicionLevel={selectedPlayer.kpkSuspicionLevel} size="sm" />
                              <ShieldAlert className="w-3 h-3 text-rose-400 relative z-10" />
                            </span>
                            <span className="font-mono text-rose-400 font-black">
                              RADAR KPK {selectedPlayer.kpkSuspicionLevel}%
                            </span>
                            <span className="text-[9px] bg-rose-600 text-white px-1 rounded uppercase tracking-wider font-extrabold animate-pulse">
                              SIAGA OTT
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Kas Tunai Liquid</span>
                    <span className="text-base font-extrabold font-mono text-emerald-400">
                      {formatRupiah(selectedPlayer.cash)}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Valuasi Properti</span>
                    <span className="text-base font-extrabold font-mono text-amber-400">
                      {formatRupiah(calculateNetWorth(selectedPlayer) - selectedPlayer.cash)}
                    </span>
                  </div>
                </div>

                {/* The 3 Vital Gauges: Stress, Political Clout, KPK Radar */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Indikator Mental, Kekuasaan & Hukum:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <StressIndicator player={selectedPlayer} variant="card" interactive={true} />
                    <PoliticalInfluenceGauge player={selectedPlayer} variant="card" interactive={true} />
                    <KPKRadarGauge player={selectedPlayer} variant="card" interactive={true} />
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Pendapatan Sewa Diterima:</span>
                    <span className="font-mono text-emerald-400">{formatRupiah(selectedPlayer.stats.totalRentEarned)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Biaya Sewa Dibayar:</span>
                    <span className="font-mono text-rose-400">{formatRupiah(selectedPlayer.stats.totalRentPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pernah Masuk Penjara Lapas:</span>
                    <span className="font-mono text-amber-400">{selectedPlayer.stats.timesInJail} kali</span>
                  </div>
                </div>
              </div>

              {/* Macro Economic Quick Card Banner */}
              <div 
                onClick={() => setActiveTab('MACRO')}
                className="p-3 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border border-slate-800 hover:border-amber-500/50 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Observatorium Tren Makroekonomi</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        macro.trend === 'CRISIS' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {macro.trend}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Inflasi: <span className="text-amber-400 font-bold">{formatPercent(macro.inflationRate)}</span> · USD: <span className="text-cyan-400 font-bold">{formatRupiah(macro.usdIdrRate)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Lihat Grafik</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'MACRO' && (
            <div className="space-y-4">
              <MacroHistoryChart
                macro={macro}
                history={macroHistory}
                currentRound={currentRound}
              />
            </div>
          )}

          {activeTab === 'PROPERTIES' && (
            <div className="space-y-4">
              {/* Kartu Khusus Section */}
              {selectedPlayer.specialCards && selectedPlayer.specialCards.length > 0 && (
                <div className="p-3 bg-amber-950/30 border border-amber-500/50 rounded-xl space-y-2">
                  <span className="text-xs uppercase font-black text-amber-400 tracking-wider flex items-center gap-1.5">
                    <span>🎟️</span>
                    <span>Koleksi Kartu Khusus ({selectedPlayer.specialCards.length} Kartu)</span>
                  </span>
                  <div className="space-y-1.5">
                    {selectedPlayer.specialCards.map(sc => (
                      <div key={sc.id} className="p-2 bg-slate-950 border border-amber-900/60 rounded-lg flex items-start gap-2 text-xs">
                        <span className="text-lg">{sc.icon}</span>
                        <div>
                          <strong className="text-white block">{sc.title}</strong>
                          <span className="text-[10px] text-amber-300 font-medium">{sc.effectText}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buff Takdir Konoha Section */}
              {selectedPlayer.konohaBuffs && selectedPlayer.konohaBuffs.length > 0 && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/60 rounded-xl space-y-2">
                  <span className="text-xs uppercase font-black text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <span>🍃</span>
                    <span>Hak Istimewa Takdir Konoha ({selectedPlayer.konohaBuffs.length} Buff Permanen)</span>
                  </span>
                  <div className="space-y-1.5">
                    {selectedPlayer.konohaBuffs.map(buff => (
                      <div key={buff.id} className="p-2.5 bg-slate-950 border border-emerald-900/60 rounded-lg space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">{buff.cardIcon}</span>
                            <strong className="text-white">{buff.buffName}</strong>
                          </div>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                            {buff.inflationDelta !== 0 ? `Inflasi ${buff.inflationDelta > 0 ? `+${buff.inflationDelta}%` : `${buff.inflationDelta}%`}` : `BI ${buff.biRateDelta > 0 ? `+${buff.biRateDelta}%` : `${buff.biRateDelta}%`}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300">
                          {buff.buffEffectDesc}
                        </p>
                        <div className="text-[10px] text-amber-300 font-semibold bg-amber-950/30 p-1 rounded border border-amber-900/40">
                          👑 Perk: {buff.playerPerkText}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                  Koleksi Surat Tanah (SHM) Milik {selectedPlayer.name} ({ownedTileObjects.length} Dokumen)
                </span>
                <span className="text-[10px] text-slate-400">
                  Dapat dirampas negara di Petak Musibah
                </span>
              </div>

              {ownedTileObjects.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800">
                  <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">
                    Belum memiliki Surat Tanah. Beli Surat Tanah kota saat mendarat di petak perwakilan!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ownedTileObjects.map(tile => {
                    const levelMultiplier = tile.level ? 1 + (tile.level * 0.75) : 1;
                    const curRent = Math.round((tile.rent || 0) * inflationFactor * levelMultiplier);

                    return (
                      <div
                        key={tile.id}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">
                              {tile.certificateTitle || tile.name}
                            </span>
                            {tile.island && tile.island !== 'SPECIAL' && (
                              <span className="text-[9px] bg-slate-800 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-slate-700">
                                {tile.islandName || tile.island}
                              </span>
                            )}
                            {tile.id >= 200 && (
                              <span className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/60 flex items-center gap-1 shadow-sm">
                                <span>💎</span>
                                <span>Aset Mewah Cuci Uang</span>
                              </span>
                            )}
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/40">
                              Tingkat {tile.level || 1}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5 line-clamp-1">
                            {tile.description}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-400 block">
                            +{formatRupiahShort(curRent)} / Singgah
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Pendapatan Sewa
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'CORRUPTION' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div>
                  <span className="text-xs uppercase font-extrabold text-rose-400 tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Visualisasi D3.js: Radar KPK & Cuan Korupsi</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Grafik Area Interaktif Dinamis Antar-Pemain
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  Putaran #{currentRound}
                </span>
              </div>

              <CorruptionD3AreaChart
                players={players}
                history={corruptionHistory}
                currentRound={currentRound}
                height={300}
              />
            </div>
          )}

          {activeTab === 'LOGS' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider block">
                  Catatan Berita & Aktivitas ({logs.length})
                </span>
                {onOpenFullHistory && (
                  <button
                    onClick={onOpenFullHistory}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <History className="w-3 h-3" />
                    <span>Buka Jendela Penuh</span>
                  </button>
                )}
              </div>

              {onOpenFullHistory && (
                <button
                  onClick={onOpenFullHistory}
                  className="w-full py-2 px-3 bg-gradient-to-r from-amber-500/15 to-amber-600/15 hover:from-amber-500/25 hover:to-amber-600/25 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Buka Logbook Sejarah Lengkap & Arsip Nasional</span>
                </button>
              )}

              {logs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Belum ada catatan aktivitas.
                </p>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {logs.slice().reverse().map(log => {
                    const getTypeBadge = () => {
                      switch (log.type) {
                        case 'CASH':
                          return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
                        case 'DANGER':
                          return 'text-rose-400 bg-rose-950/60 border-rose-800';
                        case 'POLITIC':
                          return 'text-amber-400 bg-amber-950/60 border-amber-800';
                        case 'STRESS':
                          return 'text-fuchsia-400 bg-fuchsia-950/60 border-fuchsia-800';
                        default:
                          return 'text-slate-400 bg-slate-900 border-slate-800';
                      }
                    };

                    return (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs flex items-start gap-2.5"
                      >
                        <span className="text-[10px] font-mono text-slate-500 shrink-0 pt-0.5">
                          {log.timestamp}
                        </span>
                        <div className="flex-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border mr-1.5 uppercase ${getTypeBadge()}`}>
                            {log.type}
                          </span>
                          <span className="text-slate-200">
                            {log.message}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
