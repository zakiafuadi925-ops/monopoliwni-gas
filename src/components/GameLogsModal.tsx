import React, { useState, useMemo } from 'react';
import { GameLogItem, Player, MacroEconomy } from '../types/game';
import { 
  History, 
  Search, 
  Filter, 
  TrendingUp, 
  AlertTriangle, 
  Landmark, 
  HeartCrack, 
  Info, 
  Coins, 
  Copy, 
  Check, 
  X, 
  ArrowUpDown,
  Calendar,
  Layers
} from 'lucide-react';

interface GameLogsModalProps {
  logs: GameLogItem[];
  players: Player[];
  macro: MacroEconomy;
  isOpen: boolean;
  onClose: () => void;
}

type FilterCategory = 'ALL' | 'CASH' | 'DANGER' | 'POLITIC' | 'STRESS' | 'INFO';

export const GameLogsModal: React.FC<GameLogsModalProps> = ({
  logs,
  players,
  macro,
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [copied, setCopied] = useState<boolean>(false);

  // Filtered and sorted logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        // Category filter
        if (selectedCategory !== 'ALL' && log.type !== selectedCategory) {
          return false;
        }

        // Player filter
        if (selectedPlayerId !== 'ALL' && log.playerId !== selectedPlayerId) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchMsg = log.message.toLowerCase().includes(q);
          const matchPlayer = (log.playerName || '').toLowerCase().includes(q);
          const matchTime = log.timestamp.toLowerCase().includes(q);
          if (!matchMsg && !matchPlayer && !matchTime) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'NEWEST') return 0; // Already logged in order, we slice & reverse when rendering
        return 0;
      });
  }, [logs, selectedCategory, selectedPlayerId, searchQuery, sortOrder]);

  const displayList = useMemo(() => {
    if (sortOrder === 'NEWEST') {
      return [...filteredLogs].reverse();
    }
    return filteredLogs;
  }, [filteredLogs, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const economic = logs.filter(l => l.type === 'CASH').length;
    const danger = logs.filter(l => l.type === 'DANGER').length;
    const politic = logs.filter(l => l.type === 'POLITIC').length;
    const stress = logs.filter(l => l.type === 'STRESS').length;
    return { total, economic, danger, politic, stress };
  }, [logs]);

  if (!isOpen) return null;

  const handleCopyLogs = () => {
    const textToCopy = displayList
      .map(l => `[${l.timestamp}] [${l.type}] ${l.playerName ? `(${l.playerName}) ` : ''}${l.message}`)
      .join('\n');
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeStyle = (type: GameLogItem['type']) => {
    switch (type) {
      case 'CASH':
        return {
          icon: <Coins className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'EKONOMI',
          border: 'border-emerald-800/80 bg-emerald-950/70 text-emerald-300'
        };
      case 'DANGER':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'MUSIBAH/KRISIS',
          border: 'border-rose-800/80 bg-rose-950/70 text-rose-300'
        };
      case 'POLITIC':
        return {
          icon: <Landmark className="w-3.5 h-3.5 text-amber-400" />,
          label: 'POLITIK & UU',
          border: 'border-amber-800/80 bg-amber-950/70 text-amber-300'
        };
      case 'STRESS':
        return {
          icon: <HeartCrack className="w-3.5 h-3.5 text-fuchsia-400" />,
          label: 'MENTAL/STRES',
          border: 'border-fuchsia-800/80 bg-fuchsia-950/70 text-fuchsia-300'
        };
      default:
        return {
          icon: <Info className="w-3.5 h-3.5 text-slate-400" />,
          label: 'INFO GAME',
          border: 'border-slate-800 bg-slate-900 text-slate-400'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[90vh] bg-slate-900 border-2 border-slate-700/80 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-amber-400 tracking-wide">
                  ARSIP SEJARAH & LOGBOOK NASIONAL KONOHA
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {logs.length} Catatan
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Rekam jejak pergeseran ekonomi, regulasi, dan nasib seluruh warga Konoha.</span>
                <span className="hidden sm:inline font-mono text-amber-300">
                  • Inflasi: {macro.inflationRate}% | BI-Rate: {macro.biRate}%
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 transition-colors cursor-pointer"
              title="Salin seluruh catatan ke clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Tersalin!' : 'Salin Log'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-3 overflow-x-auto text-xs shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" /> Statistik:
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5">
              <Coins className="w-3 h-3 text-emerald-400" />
              <span>{stats.economic} Transaksi Ekonomi</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px] font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>{stats.danger} Musibah & Sita</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] font-medium flex items-center gap-1.5">
              <Landmark className="w-3 h-3 text-amber-400" />
              <span>{stats.politic} Peristiwa Politik</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-fuchsia-950/40 border border-fuchsia-800/60 text-fuchsia-300 text-[11px] font-medium flex items-center gap-1.5">
              <HeartCrack className="w-3 h-3 text-fuchsia-400" />
              <span>{stats.stress} Tekanan Mental</span>
            </span>
          </div>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between shrink-0">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci: 'Surat Tanah', 'Macet', 'KPK', 'Inflasi', nama pemain..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Player and Sort Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">Semua Pemain</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.avatar} {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors cursor-pointer shrink-0"
              title="Ubah urutan waktu"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>{sortOrder === 'NEWEST' ? 'Terbaru di Atas' : 'Terlama di Atas'}</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-3 sm:px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {[
            { id: 'ALL' as FilterCategory, label: 'Semua Kategori', icon: <Filter className="w-3 h-3" /> },
            { id: 'CASH' as FilterCategory, label: 'Ekonomi & Finansial', icon: <Coins className="w-3 h-3" /> },
            { id: 'DANGER' as FilterCategory, label: 'Musibah & Sita Aset', icon: <AlertTriangle className="w-3 h-3" /> },
            { id: 'POLITIC' as FilterCategory, label: 'Politik & DPR', icon: <Landmark className="w-3 h-3" /> },
            { id: 'STRESS' as FilterCategory, label: 'Kesehatan Mental', icon: <HeartCrack className="w-3 h-3" /> },
            { id: 'INFO' as FilterCategory, label: 'Pergerakan & Info', icon: <Info className="w-3 h-3" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Timeline List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-2.5 custom-scrollbar bg-slate-950/40">
          {displayList.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
              <p className="text-sm font-bold text-slate-400">Tidak ada catatan yang cocok dengan filter.</p>
              <p className="text-xs text-slate-600 mt-1">Coba bersihkan pencarian atau pilih kategori lain.</p>
              {(searchQuery || selectedCategory !== 'ALL' || selectedPlayerId !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedPlayerId('ALL');
                  }}
                  className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
          ) : (
            displayList.map(log => {
              const badge = getBadgeStyle(log.type);
              const player = players.find(p => p.id === log.playerId);

              return (
                <div
                  key={log.id}
                  className="p-3 sm:p-3.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all flex items-start gap-3 text-xs group hover:border-slate-700"
                >
                  {/* Timestamp and Category Badge */}
                  <div className="flex flex-col items-start gap-1 shrink-0 pt-0.5 w-24 sm:w-28">
                    <span className="font-mono text-[10px] text-slate-500 tracking-tight flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      {log.timestamp}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 ${badge.border}`}>
                      {badge.icon}
                      <span className="truncate">{badge.label}</span>
                    </span>
                  </div>

                  {/* Player Tag & Content */}
                  <div className="flex-1 min-w-0">
                    {log.playerName && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span 
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: log.playerColor || '#f59e0b' }}
                        />
                        <span 
                          className="text-[11px] font-bold"
                          style={{ color: log.playerColor || '#f59e0b' }}
                        >
                          {player?.avatar || '👤'} {log.playerName}
                        </span>
                      </div>
                    )}
                    <p className="text-slate-200 text-xs leading-relaxed break-words font-medium">
                      {log.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Menampilkan {displayList.length} dari {logs.length} total rekaman sejarah</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer text-xs"
          >
            Tutup Logbook
          </button>
        </div>

      </div>
    </div>
  );
};
