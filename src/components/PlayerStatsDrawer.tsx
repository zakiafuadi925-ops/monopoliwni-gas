import React, { useState } from 'react';
import { Player, BoardTile, MacroEconomy, GameLogItem } from '../types/game';
import { formatRupiah, formatRupiahShort } from '../utils/format';
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
  Users
} from 'lucide-react';

interface PlayerStatsDrawerProps {
  players: Player[];
  tiles: BoardTile[];
  macro: MacroEconomy;
  logs: GameLogItem[];
  isOpen: boolean;
  onClose: () => void;
  activePlayerId: string;
}

export const PlayerStatsDrawer: React.FC<PlayerStatsDrawerProps> = ({
  players,
  tiles,
  macro,
  logs,
  isOpen,
  onClose,
  activePlayerId
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(activePlayerId);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROPERTIES' | 'LOGS'>('OVERVIEW');

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
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Peringkat & Ringkasan</span>
          </button>
          <button
            onClick={() => setActiveTab('PROPERTIES')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'PROPERTIES'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Portofolio Aset</span>
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'LOGS'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Kejadian</span>
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
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-base border"
                            style={{ borderColor: p.color, backgroundColor: `${p.color}20` }}
                          >
                            {p.avatar}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-white">
                                {p.name}
                              </span>
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
                        Detail Status: {selectedPlayer.name}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {selectedPlayer.title}
                      </span>
                    </div>
                  </div>
                </div>

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

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-400 text-[11px]">Stres Mental</span>
                      <span className="font-mono font-bold text-rose-400">{selectedPlayer.stress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500"
                        style={{ width: `${selectedPlayer.stress}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-400 text-[11px]">Modal Politik</span>
                      <span className="font-mono font-bold text-amber-400">{selectedPlayer.politicalInfluence}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500"
                        style={{ width: `${selectedPlayer.politicalInfluence}%` }}
                      />
                    </div>
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

          {activeTab === 'LOGS' && (
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-amber-400 tracking-wider block mb-1">
                Catatan Berita & Aktivitas Permainan
              </span>

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
