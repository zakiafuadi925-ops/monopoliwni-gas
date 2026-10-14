import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardTile, Player, MacroEconomy, IslandType } from '../types/game';
import { formatRupiahShort } from '../utils/format';
import { 
  Building2, 
  HelpCircle, 
  AlertTriangle, 
  Landmark, 
  ShieldAlert, 
  Zap, 
  Skull,
  Coins,
  Crown,
  LayoutGrid,
  ListOrdered,
  ChevronRight,
  Sparkles,
  MapPin,
  Compass,
  FileText
} from 'lucide-react';
import { DiceRollOverlay } from './DiceRollOverlay';
import { PlayerToken } from './PlayerToken';

interface BoardProps {
  perimeterTiles: BoardTile[];
  corruptionTiles: BoardTile[];
  players: Player[];
  activePlayerIndex: number;
  macro: MacroEconomy;
  onTileClick: (tile: BoardTile) => void;
  selectedTile: BoardTile | null;
  bannerImage: string;
  crestImage: string;
  diceRollAnimation?: {
    player: Player;
    d1: number;
    d2: number;
    total: number;
  } | null;
  onRollAnimationComplete?: () => void;
  isMoving?: boolean;
}

// Map each tile ID 0..27 to grid row (0..7) and col (0..7)
function getPerimeterGridPos(tileId: number): { row: number; col: number } {
  if (tileId >= 0 && tileId <= 7) {
    // Bottom row: 0 is col 0, 7 is col 7. row 7
    return { row: 7, col: tileId };
  } else if (tileId >= 8 && tileId <= 13) {
    // Right column: 8 is row 6, 13 is row 1. col 7
    return { row: 7 - (tileId - 7), col: 7 };
  } else if (tileId >= 14 && tileId <= 21) {
    // Top row: 14 is col 7, 21 is col 0. row 0
    return { row: 0, col: 7 - (tileId - 14) };
  } else if (tileId >= 22 && tileId <= 27) {
    // Left column: 22 is row 1, 27 is row 6. col 0
    return { row: tileId - 21, col: 0 };
  }
  return { row: 7, col: 0 };
}

export const Board: React.FC<BoardProps> = ({
  perimeterTiles,
  corruptionTiles,
  players,
  activePlayerIndex,
  macro,
  onTileClick,
  selectedTile,
  bannerImage,
  crestImage,
  diceRollAnimation,
  onRollAnimationComplete,
  isMoving = false
}) => {
  const [boardViewMode, setBoardViewMode] = useState<'GRID' | 'ISLANDS' | 'TRACK'>('GRID');
  const activePlayer = players[activePlayerIndex] || null;

  // Inflation-adjusted rent & price calculation
  const getAdjustedValues = (tile: BoardTile) => {
    const inflationFactor = 1 + (macro.inflationRate / 100);
    const adjPrice = tile.price ? Math.round(tile.price * inflationFactor) : 0;
    const levelMultiplier = tile.level ? 1 + (tile.level * 0.75) : 1;
    const adjRent = tile.rent ? Math.round(tile.rent * inflationFactor * levelMultiplier) : 0;
    return { adjPrice, adjRent };
  };

  // Find players on a tile
  const getPlayersOnTile = (tileId: number) => {
    return players.filter(p => !p.isBankrupt && p.position === tileId);
  };

  const getTileZoneColor = (tile: BoardTile) => {
    switch (tile.zone) {
      case 'START':
        return 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300';
      case 'PULAU_JAWA':
        return 'border-emerald-500/70 bg-emerald-950/30 text-emerald-200';
      case 'PULAU_SUMATRA':
        return 'border-amber-500/70 bg-amber-950/30 text-amber-200';
      case 'PULAU_KALIMANTAN':
        return 'border-teal-500/70 bg-teal-950/30 text-teal-200';
      case 'PULAU_SULAWESI':
        return 'border-sky-500/70 bg-sky-950/30 text-sky-200';
      case 'PULAU_PAPUA':
        return 'border-rose-500/70 bg-rose-950/30 text-rose-200';
      case 'EVENT_MUSIBAH':
        return 'border-rose-600 bg-rose-950/70 text-rose-200 ring-1 ring-rose-500/60 shadow-rose-950/50';
      case 'EVENT_TAKDIR':
        return 'border-yellow-400 bg-yellow-950/60 text-yellow-200 ring-1 ring-yellow-400/60';
      case 'SPECIAL_CORNER':
        return 'border-purple-500/80 bg-purple-950/40 text-purple-200';
      case 'KORUPSI_ROUTE':
        return 'border-amber-400/90 bg-amber-950/60 text-amber-300';
      default:
        if (tile.actionType === 'CORRUPTION_GATE') {
          return 'border-amber-500 bg-amber-950/70 text-amber-200 ring-2 ring-amber-500/80 shadow-lg shadow-amber-950/60';
        }
        return 'border-slate-700 bg-slate-900 text-slate-200';
    }
  };

  const getIslandBadgeStyle = (island?: IslandType) => {
    switch (island) {
      case 'JAWA':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'SUMATRA':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'KALIMANTAN':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'SULAWESI':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'PAPUA':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const renderTileIcon = (tile: BoardTile, className = "w-3.5 h-3.5") => {
    switch (tile.actionType) {
      case 'START_SALARY':
        return <Coins className={`${className} text-emerald-400`} />;
      case 'PROPERTY':
        return <Building2 className={`${className} text-amber-300 opacity-90`} />;
      case 'EVENT_MUSIBAH':
        return <ShieldAlert className={`${className} text-rose-400 animate-pulse`} />;
      case 'EVENT_TAKDIR':
        return <Sparkles className={`${className} text-yellow-300 animate-bounce`} />;
      case 'DILEMA_CARD':
        return <HelpCircle className={`${className} text-yellow-400 animate-pulse`} />;
      case 'TAX_BILL':
        return <Zap className={`${className} text-rose-400`} />;
      case 'BIROKRASI_CHECK':
        return <Landmark className={`${className} text-purple-400`} />;
      case 'PRISON_SUKAMISKIN':
        return <Skull className={`${className} text-rose-400`} />;
      case 'PARLIAMENT_SENAYAN':
        return <Crown className={`${className} text-amber-400`} />;
      case 'CORRUPTION_GATE':
        return <AlertTriangle className={`${className} text-amber-400 animate-bounce`} />;
      case 'CORRUPTION_PROJECT':
        return <Coins className={`${className} text-amber-300`} />;
      case 'CORRUPTION_AUDIT':
        return <ShieldAlert className={`${className} text-rose-400 animate-pulse`} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full max-w-[1020px] mx-auto select-none space-y-2">
      {/* Mobile-Friendly View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Tampilan Papan:</span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setBoardViewMode('GRID')}
            className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              boardViewMode === 'GRID'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Papan Monopoli</span>
          </button>

          <button
            onClick={() => setBoardViewMode('ISLANDS')}
            className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              boardViewMode === 'ISLANDS'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>5 Baris Pulau</span>
          </button>

          <button
            onClick={() => setBoardViewMode('TRACK')}
            className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              boardViewMode === 'TRACK'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Lintasan Petak</span>
          </button>
        </div>
      </div>

      {/* Board View Container with Interactive Overlay Support */}
      <div className="relative w-full">
        {/* VIEW MODE 1: CLASSIC 8x8 GRID (Fluidly Scaled on Mobile) */}
        {boardViewMode === 'GRID' && (
        <div 
          className="grid grid-cols-8 grid-rows-8 gap-0.5 sm:gap-1.5 p-1 sm:p-2.5 md:p-3 bg-slate-950 border-2 border-slate-800 rounded-2xl shadow-2xl overflow-hidden aspect-square w-full"
        >
          {/* Render 28 Perimeter Tiles */}
          {perimeterTiles.map(tile => {
            const { row, col } = getPerimeterGridPos(tile.id);
            const isCorner = tile.id === 0 || tile.id === 7 || tile.id === 14 || tile.id === 21;
            const playersOnThisTile = getPlayersOnTile(tile.id);
            const { adjPrice, adjRent } = getAdjustedValues(tile);
            const isSelected = selectedTile?.id === tile.id;
            const owner = tile.ownerId ? players.find(p => p.id === tile.ownerId) : null;
            const isCurrentActivePlayerHere = activePlayer ? activePlayer.position === tile.id : false;

            return (
              <div
                key={tile.id}
                onClick={() => onTileClick(tile)}
                style={{
                  gridRow: row + 1,
                  gridColumn: col + 1,
                  ...(isCurrentActivePlayerHere && activePlayer ? {
                    borderColor: activePlayer.color,
                    boxShadow: `0 0 18px ${activePlayer.color}80, inset 0 0 14px ${activePlayer.color}25`
                  } : {})
                }}
                className={`
                  relative flex flex-col justify-between p-0.5 sm:p-1.5 rounded sm:rounded-lg border cursor-pointer transition-all duration-150 overflow-hidden
                  ${getTileZoneColor(tile)}
                  ${isSelected ? 'ring-2 ring-amber-400 shadow-lg scale-[1.03] z-20' : 'hover:border-slate-500'}
                  ${isCurrentActivePlayerHere ? 'ring-2 ring-white shadow-xl z-20 scale-[1.02] bg-slate-900/95' : ''}
                `}
              >
                {/* Active Player Standing Marker Banner */}
                {isCurrentActivePlayerHere && activePlayer && (
                  <div 
                    className="absolute top-0 inset-x-0 py-0.5 text-center text-[7px] sm:text-[8px] font-black tracking-wider uppercase text-white shadow-md z-30 flex items-center justify-center gap-1 animate-pulse"
                    style={{ backgroundColor: activePlayer.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                    <span className="truncate">📍 {activePlayer.name}</span>
                  </div>
                )}

                {/* Tile Header: Island badge, number, owner indicator & level */}
                <div className={`flex items-center justify-between gap-0.5 w-full ${isCurrentActivePlayerHere ? 'mt-3 sm:mt-3.5' : ''}`}>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[7px] sm:text-[9px] md:text-xs font-mono font-bold opacity-75">
                      #{tile.id}
                    </span>
                    {tile.island && tile.island !== 'SPECIAL' && (
                      <span className={`text-[6px] sm:text-[7px] font-extrabold uppercase px-0.5 sm:px-1 py-0 rounded border hidden xs:inline-block sm:inline-block ${getIslandBadgeStyle(tile.island)}`}>
                        {tile.island}
                      </span>
                    )}
                  </div>

                  {owner && (
                    <div 
                      className="flex items-center px-0.5 sm:px-1 py-0 rounded text-[7px] sm:text-[9px] font-bold shadow-sm"
                      style={{ backgroundColor: owner.color, color: '#fff' }}
                      title={`Surat Tanah Milik: ${owner.name}`}
                    >
                      <span>L{tile.level || 1}</span>
                    </div>
                  )}

                  <div className="shrink-0">
                    {renderTileIcon(tile, "w-2.5 h-2.5 sm:w-3.5 sm:h-3.5")}
                  </div>
                </div>

                {/* Tile Name */}
                <div className="my-auto text-center px-0.5">
                  <p className={`font-semibold text-slate-100 leading-tight line-clamp-1 sm:line-clamp-2 ${isCorner ? 'text-[8px] sm:text-[11px] md:text-xs font-extrabold text-amber-200' : 'text-[8px] sm:text-[10px] md:text-[11px]'}`}>
                    {tile.shortName}
                  </p>
                  {tile.subtext && !isCorner && (
                    <span className="text-[7px] sm:text-[9px] md:text-10px text-slate-400 font-mono hidden xs:block sm:block mt-0.5 truncate">
                      {tile.ownerId ? `${formatRupiahShort(adjRent)}` : tile.price ? formatRupiahShort(adjPrice) : tile.subtext}
                    </span>
                  )}
                </div>

                {/* Pawns Container */}
                <div className="flex items-center justify-center flex-wrap gap-1 min-h-[22px] sm:min-h-[26px] mt-0.5">
                  {playersOnThisTile.map(p => (
                    <PlayerToken
                      key={p.id}
                      player={p}
                      isActive={activePlayer?.id === p.id}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Center Arena: Grid rows 2-7, cols 2-7 (interior 6x6) */}
          <div 
            className="relative flex flex-col justify-between p-1.5 sm:p-3 md:p-4 bg-slate-900/60 border border-slate-800/80 rounded-lg sm:rounded-xl overflow-hidden backdrop-blur-sm"
            style={{
              gridRow: '2 / 8',
              gridColumn: '2 / 8',
            }}
          >
            {/* Top of Center: Banner Art + Satire Header */}
            <div className="relative rounded-lg sm:rounded-xl overflow-hidden border border-slate-800 shadow-md">
              <img 
                src={bannerImage} 
                alt="Monopoli WNI Simulator Satire" 
                className="w-full h-12 sm:h-20 md:h-28 object-cover opacity-85"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-1.5 sm:p-2.5">
                <span className="text-[8px] sm:text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Edisi Realita Sosial Konoha 2026
                </span>
                <h2 className="text-[10px] sm:text-sm md:text-base font-extrabold text-white leading-tight truncate">
                  MONOPOLI WNI: SURVIVAL & RUTE KORUPSI
                </h2>
              </div>
            </div>

            {/* Middle of Center: THE CORRUPTION ROUTE (Jalur Korupsi & Nepotisme) */}
            <div className="my-1 sm:my-2 p-1.5 sm:p-2.5 bg-gradient-to-r from-amber-950/50 via-rose-950/40 to-amber-950/50 border sm:border-2 border-dashed border-amber-500/60 rounded-lg sm:rounded-xl">
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
                  <span className="text-[9px] sm:text-xs font-bold text-amber-300 uppercase tracking-wide">
                    RUTE KORUPSI (JALUR TIKUS)
                  </span>
                </div>
                <span className="text-[8px] sm:text-[10px] text-rose-300 font-mono font-medium hidden xs:inline">
                  Risiko OTT KPK!
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                {corruptionTiles.map(cTile => {
                  const playersHere = getPlayersOnTile(cTile.id);
                  const isSelected = selectedTile?.id === cTile.id;

                  const getTileStyle = () => {
                    if (cTile.id === 103) {
                      return 'border-rose-600 bg-rose-950/60 text-rose-200';
                    }
                    if (cTile.id === 102) {
                      return 'border-emerald-500/80 bg-emerald-950/50 text-emerald-200';
                    }
                    return 'border-amber-500/70 bg-amber-950/40 text-amber-200';
                  };

                  return (
                    <div
                      key={cTile.id}
                      onClick={() => onTileClick(cTile)}
                      className={`
                        p-1 sm:p-2 rounded sm:rounded-lg border text-center cursor-pointer transition-all flex flex-col justify-between
                        ${isSelected ? 'ring-2 ring-rose-400 scale-105' : 'hover:border-amber-400'}
                        ${getTileStyle()}
                      `}
                    >
                      <div>
                        <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 block font-bold">
                          #{cTile.id}
                        </span>
                        <p className="text-[8px] sm:text-[11px] font-bold line-clamp-1 mt-0.5">
                          {cTile.shortName}
                        </p>
                      </div>

                      <div className="text-[7px] sm:text-[9px] text-slate-300 font-mono mt-0.5 truncate">
                        {cTile.subtext}
                      </div>

                      {/* Pawns in corruption route */}
                      <div className="flex items-center justify-center gap-0.5 min-h-[16px] sm:min-h-[20px] mt-0.5">
                        {playersHere.map(p => (
                          <PlayerToken
                            key={p.id}
                            player={p}
                            isActive={activePlayer?.id === p.id}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom of Center: Active Player Status & Selection Cue */}
            {activePlayer ? (
              <div 
                className="bg-slate-950/95 border-2 rounded-lg sm:rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-xl backdrop-blur-md transition-all"
                style={{ 
                  borderColor: `${activePlayer.color}bb`,
                  boxShadow: `0 0 18px ${activePlayer.color}35, inset 0 0 12px ${activePlayer.color}15`
                }}
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div 
                    className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center text-sm sm:text-lg shadow-md shrink-0"
                    style={{ borderColor: activePlayer.color, backgroundColor: `${activePlayer.color}25` }}
                  >
                    {activePlayer.avatar}
                    <span 
                      className="absolute -bottom-1 -right-1 text-[7px] font-black font-mono text-white px-1 py-0 rounded-full border border-slate-950 shadow-sm leading-tight"
                      style={{ backgroundColor: activePlayer.color }}
                    >
                      {activePlayer.id.startsWith('player_') ? `P${activePlayer.id.replace('player_', '')}` : 'P'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span 
                        className="px-1.5 py-0.2 rounded-full text-[7px] sm:text-[8px] font-black uppercase text-white shadow-sm flex items-center gap-1 animate-pulse"
                        style={{ backgroundColor: activePlayer.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                        <span>GILIRAN AKTIF</span>
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                        {activePlayer.name}
                      </span>
                      {activePlayer.isAi && (
                        <span className="text-[8px] font-mono bg-slate-800 text-slate-400 px-1 py-0.2 rounded">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-300 mt-0.5 truncate">
                      <span className="text-amber-300 font-bold">{activePlayer.title}</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-mono font-bold">{formatRupiahShort(activePlayer.cash)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[8px] sm:text-[9px] font-mono uppercase text-slate-400 block font-bold">
                    {isMoving ? 'Melangkah...' : 'Lokasi Petak'}
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    <span className={`text-xs sm:text-sm font-black font-mono ${isMoving ? 'text-amber-400 animate-pulse' : 'text-amber-300'}`}>
                      #{activePlayer.position}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 max-w-[80px] sm:max-w-[110px] truncate hidden xs:inline">
                      ({perimeterTiles.find(t => t.id === activePlayer.position)?.shortName || corruptionTiles.find(t => t.id === activePlayer.position)?.shortName || 'Papan'})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg sm:rounded-xl p-2 text-xs text-slate-400 text-center">
                <span>Menyiapkan Pemain...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: 5 BARIS PULAU BESAR NUSANTARA */}
      {boardViewMode === 'ISLANDS' && (
        <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                5 Baris Pulau Besar & Surat Tanah Kota
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Setiap baris mewakili 5 pulau besar Nusantara (20 kota perwakilan). Surat Tanah dapat dibeli dan bisa dirampas oleh negara dalam Event Musibah!
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 shrink-0">
              20 Kota · 5 Pulau
            </span>
          </div>

          {/* 5 Island Rows */}
          {[
            { id: 'JAWA', name: 'Pulau Jawa', icon: '🌴', desc: 'Pusat Keuangan & Megapolitan', badgeColor: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300' },
            { id: 'SUMATRA', name: 'Pulau Sumatra', icon: '🐅', desc: 'Komoditas Sawit & Jalur Malaka', badgeColor: 'border-amber-500/50 bg-amber-950/30 text-amber-300' },
            { id: 'KALIMANTAN', name: 'Pulau Kalimantan', icon: '🦧', desc: 'Sentra Energi, Tambang & IKN Nusantara', badgeColor: 'border-teal-500/50 bg-teal-950/30 text-teal-300' },
            { id: 'SULAWESI', name: 'Pulau Sulawesi', icon: '🦅', desc: 'Maritim Timur & Smelter Nikel Dunia', badgeColor: 'border-sky-500/50 bg-sky-950/30 text-sky-300' },
            { id: 'PAPUA', name: 'Pulau Papua', icon: '🦜', desc: 'Tambang Emas Grasberg & Food Estate', badgeColor: 'border-rose-500/50 bg-rose-950/30 text-rose-300' },
          ].map((islandObj, rowIdx) => {
            const islandTiles = perimeterTiles.filter(t => t.island === islandObj.id);

            return (
              <div key={islandObj.id} className="p-3 rounded-xl border border-slate-800/90 bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">{islandObj.icon}</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">
                        Baris #{rowIdx + 1}: {islandObj.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        {islandObj.desc}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${islandObj.badgeColor}`}>
                      {islandTiles.length} Kota
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Beli Surat Tanah
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {islandTiles.map(tile => {
                    const playersOnThisTile = getPlayersOnTile(tile.id);
                    const { adjPrice, adjRent } = getAdjustedValues(tile);
                    const owner = tile.ownerId ? players.find(p => p.id === tile.ownerId) : null;
                    const isCurrentPlayerHere = activePlayer?.position === tile.id;

                    return (
                      <div
                        key={tile.id}
                        onClick={() => onTileClick(tile)}
                        className={`
                          p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[96px]
                          ${getTileZoneColor(tile)}
                          ${isCurrentPlayerHere ? 'ring-2 ring-amber-400 bg-slate-900 shadow-md scale-[1.02]' : 'hover:border-slate-400'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-slate-400">
                            #{tile.id}
                          </span>
                          <div className="flex items-center gap-1">
                            {owner ? (
                              <span 
                                className="text-[9px] font-bold px-1 rounded shadow-sm"
                                style={{ backgroundColor: owner.color, color: '#fff' }}
                                title={`Milik: ${owner.name}`}
                              >
                                L{tile.level || 1}
                              </span>
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>
                        </div>

                        <div className="my-1">
                          <span className="text-xs font-bold text-white block truncate">
                            {tile.cityName || tile.shortName}
                          </span>
                          <span className="text-[10px] text-slate-300 block font-mono">
                            {owner ? `Sewa: ${formatRupiahShort(adjRent)}` : `Beli: ${formatRupiahShort(adjPrice)}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[9px]">
                          <span className={owner ? 'text-amber-300 font-semibold truncate' : 'text-emerald-400 font-medium'}>
                            {owner ? owner.name : '📜 Beli SHM'}
                          </span>

                          <div className="flex items-center -space-x-1">
                            {playersOnThisTile.map(p => (
                              <PlayerToken
                                key={p.id}
                                player={p}
                                isActive={activePlayer?.id === p.id}
                                size="xs"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Baris Khusus: Event Musibah & Event Takdir */}
          <div className="p-3 rounded-xl border border-rose-900/40 bg-gradient-to-r from-rose-950/30 via-slate-900/60 to-yellow-950/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <h4 className="text-xs sm:text-sm font-black text-white">
                  Baris Hal Tak Terduga: Event Musibah & Takdir (Masing-masing 2 Petak)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-rose-300">
                Penyitaan Lahan & Hoki
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {perimeterTiles.filter(t => t.actionType === 'EVENT_MUSIBAH' || t.actionType === 'EVENT_TAKDIR').map(tile => {
                const playersOnThisTile = getPlayersOnTile(tile.id);
                const isCurrentPlayerHere = activePlayer?.position === tile.id;

                return (
                  <div
                    key={tile.id}
                    onClick={() => onTileClick(tile)}
                    className={`
                      p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[96px]
                      ${getTileZoneColor(tile)}
                      ${isCurrentPlayerHere ? 'ring-2 ring-white scale-[1.02] shadow-lg' : 'hover:border-slate-300'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold opacity-80">
                        #{tile.id}
                      </span>
                      {renderTileIcon(tile, "w-4 h-4")}
                    </div>

                    <div className="my-1">
                      <span className="text-xs font-extrabold text-white block line-clamp-1">
                        {tile.shortName}
                      </span>
                      <span className="text-[10px] text-slate-300 block line-clamp-1">
                        {tile.subtext}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[9px]">
                      <span className="font-bold uppercase tracking-wider opacity-90">
                        {tile.actionType === 'EVENT_MUSIBAH' ? 'Rampasan Negara' : 'Rezeki Nasib'}
                      </span>
                      <div className="flex items-center -space-x-1">
                        {playersOnThisTile.map(p => (
                          <PlayerToken
                            key={p.id}
                            player={p}
                            isActive={activePlayer?.id === p.id}
                            size="xs"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: TRACK VIEW (Optimized for Mobile Touch Scrolling) */}
      {boardViewMode === 'TRACK' && (
        <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
              Lintasan Sirkular Petak (Putaran Monopoli)
            </span>
            <span className="text-[11px] text-slate-400">
              Ketuk petak untuk rincian & transaksi
            </span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {perimeterTiles.map(tile => {
              const playersOnThisTile = getPlayersOnTile(tile.id);
              const { adjPrice, adjRent } = getAdjustedValues(tile);
              const owner = tile.ownerId ? players.find(p => p.id === tile.ownerId) : null;
              const isCurrentPlayerHere = activePlayer?.position === tile.id;

              return (
                <div
                  key={tile.id}
                  onClick={() => onTileClick(tile)}
                  className={`
                    p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3
                    ${getTileZoneColor(tile)}
                    ${isCurrentPlayerHere ? 'ring-2 ring-amber-400 bg-slate-900 shadow-lg' : 'hover:border-slate-500'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-slate-300 shrink-0">
                      #{tile.id}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {tile.name}
                        </span>
                        {renderTileIcon(tile, "w-4 h-4")}
                        {isCurrentPlayerHere && (
                          <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                            Posisi Anda
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{tile.subtext}</span>
                        {owner && (
                          <span className="text-amber-300 font-semibold">
                            · Pemilik: {owner.name} (Sewa: {formatRupiahShort(adjRent)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Players on this tile */}
                    <div className="flex items-center -space-x-1">
                      {playersOnThisTile.map(p => (
                        <PlayerToken
                          key={p.id}
                          player={p}
                          isActive={activePlayer?.id === p.id}
                          size="md"
                        />
                      ))}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Special Corruption Route in Track View */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wide block mb-2">
              Jalur Tikus Ordal (Rute Korupsi Tengah)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {corruptionTiles.map(cTile => {
                const playersHere = getPlayersOnTile(cTile.id);
                return (
                  <div
                    key={cTile.id}
                    onClick={() => onTileClick(cTile)}
                    className="p-3 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-200 cursor-pointer hover:border-rose-500 transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-rose-300 font-bold block">
                        Jalur #{cTile.id}
                      </span>
                      <span className="text-xs font-bold text-white block">
                        {cTile.name}
                      </span>
                      <span className="text-[10px] text-slate-300 block">
                        {cTile.subtext}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {playersHere.map(p => (
                        <PlayerToken
                          key={p.id}
                          player={p}
                          isActive={activePlayer?.id === p.id}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Visual Animation Overlay when Dice are Rolled */}
      {diceRollAnimation && onRollAnimationComplete && (
        <DiceRollOverlay
          player={diceRollAnimation.player}
          dice1={diceRollAnimation.d1}
          dice2={diceRollAnimation.d2}
          total={diceRollAnimation.total}
          onComplete={onRollAnimationComplete}
        />
      )}
      </div>
    </div>
  );
};
