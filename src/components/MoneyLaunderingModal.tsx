import React, { useState, useEffect } from 'react';
import { Player, BoardTile, MacroEconomy } from '../types/game';
import { LUXURY_LAUNDER_PROPERTIES, LuxuryLaunderProperty } from '../data/luxuryProperties';
import { formatRupiah, formatRupiahShort } from '../utils/format';
import { soundManager } from '../utils/sound';
import { 
  Building2, 
  ShieldAlert, 
  Sparkles, 
  AlertTriangle, 
  Check, 
  X, 
  ArrowRight, 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  Briefcase,
  HeartCrack,
  Info
} from 'lucide-react';
import { KPKRadarGauge } from './VitalIndicators';

interface MoneyLaunderingModalProps {
  player: Player;
  players: Player[];
  perimeterTiles: BoardTile[];
  luxuryTiles: BoardTile[];
  macro: MacroEconomy;
  onLaunderBuyLuxury: (property: LuxuryLaunderProperty) => void;
  onLaunderBuyPerimeter: (tile: BoardTile, discountedCost: number, kpkRisk: number) => void;
  onSkipLaundering: () => void;
}

export const MoneyLaunderingModal: React.FC<MoneyLaunderingModalProps> = ({
  player,
  players,
  perimeterTiles,
  luxuryTiles,
  macro,
  onLaunderBuyLuxury,
  onLaunderBuyPerimeter,
  onSkipLaundering
}) => {
  const [activeTab, setActiveTab] = useState<'LUXURY_ESTATES' | 'PERIMETER_PROPERTIES'>('LUXURY_ESTATES');
  const [selectedLuxuryId, setSelectedLuxuryId] = useState<number | null>(LUXURY_LAUNDER_PROPERTIES[0].id);
  const [selectedPerimeterId, setSelectedPerimeterId] = useState<number | null>(null);

  const inflationFactor = 1 + (macro.inflationRate / 100);

  // Available unowned perimeter properties
  const unownedPerimeterTiles = perimeterTiles.filter(
    t => t.actionType === 'PROPERTY' && !t.ownerId
  );

  const selectedLuxury = LUXURY_LAUNDER_PROPERTIES.find(p => p.id === selectedLuxuryId) || null;
  const luxuryTileOwner = (luxuryId: number) => {
    const tile = luxuryTiles.find(t => t.id === luxuryId);
    if (!tile?.ownerId) return null;
    return players.find(p => p.id === tile.ownerId) || null;
  };

  const selectedPerimeterTile = perimeterTiles.find(t => t.id === selectedPerimeterId) || null;
  const perimeterDiscountedCost = selectedPerimeterTile 
    ? Math.round((selectedPerimeterTile.price || 0) * inflationFactor * 0.6) // 40% tax cut
    : 0;

  // AI Automatic Money Laundering Decision
  useEffect(() => {
    if (player.isAi) {
      const timer = setTimeout(() => {
        // If AI has lots of corrupt cash and unowned luxury property exists
        const unownedLuxury = LUXURY_LAUNDER_PROPERTIES.filter(p => !luxuryTileOwner(p.id));
        const affordable = unownedLuxury.filter(p => player.cash >= p.launderPrice * 1.35);

        if (affordable.length > 0) {
          onLaunderBuyLuxury(affordable[0]);
        } else {
          onSkipLaundering();
        }
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [player.isAi, player.cash]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 px-5 py-3.5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-slate-950/40 border border-emerald-300/40 text-amber-300">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base uppercase tracking-wider text-white flex items-center gap-2">
                <span>PENCUCIAN UANG HASIL KORUPSI</span>
                <span className="px-2 py-0.2 rounded-full bg-slate-950/50 text-[10px] font-mono text-emerald-200 border border-emerald-400/40">
                  TAX HAVEN
                </span>
              </h3>
              <span className="text-[11px] font-medium text-emerald-100 block">
                Beli Properti Mewah Samaran · Potongan Pajak Hingga 45% · Risiko Radar KPK
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onSkipLaundering();
            }}
            className="p-1 rounded-lg hover:bg-slate-900/40 text-emerald-100 hover:text-white transition-colors cursor-pointer"
            title="Tutup & Lewati"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Status & Warning Strip */}
        <div className="p-3.5 sm:p-4 bg-slate-950/95 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Pelaku Cuci Uang:</span>
              <div className="font-extrabold text-sm text-white flex items-center gap-1.5 mt-0.5">
                <span className="text-base">{player.avatar}</span>
                <span>{player.name} ({player.title})</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-400 block mt-0.5">
                Kas Tunai Siap Cuci: {formatRupiah(player.cash)}
              </span>
            </div>

            {/* KPK Radar Status Mini Gauge */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between gap-3 sm:min-w-[220px]">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase">
                  RADAR INTELIJEN KPK
                </span>
                <div className="text-base sm:text-lg font-black text-rose-400 font-mono">
                  {player.kpkSuspicionLevel}%
                </div>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Tactical Warning Cue */}
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-600/30 flex items-start gap-2 text-xs text-amber-200/90 leading-snug">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 font-bold">Dilema Cuci Uang:</strong> Membeli aset properti mewah menyamarkan uang haram menjadi dividen sah berharga murah (-40% diskon pajak). Namun, 
              <span className="text-rose-300 font-bold"> Radar KPK akan melonjak drastis</span> tepat sebelum Anda memasuki <strong>Petak #103 Sidak KPK</strong> di giliran berikutnya!
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="px-4 pt-3 flex gap-2 border-b border-slate-800 shrink-0 bg-slate-900">
          <button
            onClick={() => setActiveTab('LUXURY_ESTATES')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'LUXURY_ESTATES'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aset Mewah Samaran Khusus ({LUXURY_LAUNDER_PROPERTIES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PERIMETER_PROPERTIES')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PERIMETER_PROPERTIES'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Sertifikat Kota Bebas Pajak ({unownedPerimeterTiles.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'LUXURY_ESTATES' ? (
            <div className="space-y-3">
              {LUXURY_LAUNDER_PROPERTIES.map(prop => {
                const isSelected = selectedLuxuryId === prop.id;
                const owner = luxuryTileOwner(prop.id);
                const isOwned = owner !== null;
                const isAffordable = player.cash >= prop.launderPrice;

                return (
                  <div
                    key={prop.id}
                    onClick={() => {
                      if (!isOwned) {
                        soundManager.playClick();
                        setSelectedLuxuryId(prop.id);
                      }
                    }}
                    className={`
                      p-3.5 sm:p-4 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer
                      ${isOwned
                        ? 'border-slate-800 bg-slate-950/40 opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'border-emerald-400 bg-emerald-950/40 shadow-lg ring-1 ring-emerald-400'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl sm:text-3xl shrink-0 p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                        {prop.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                            {prop.name}
                          </span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Diskon {prop.taxDiscountPercent}%
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{prop.location}</span>
                        </span>

                        <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
                          {prop.description}
                        </p>

                        <div className="mt-1 text-[10px] text-amber-300 font-mono italic">
                          Trik Cuci Uang: {prop.launderingMethod}
                        </div>
                      </div>
                    </div>

                    {/* Financial Specs & Buy Action */}
                    <div className="sm:text-right shrink-0 flex flex-col justify-between gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div>
                        <span className="text-[10px] line-through text-slate-500 font-mono block">
                          Normal: {formatRupiah(prop.normalPrice)}
                        </span>
                        <div className="text-sm sm:text-base font-black text-emerald-300 font-mono">
                          {formatRupiah(prop.launderPrice)}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 block font-bold">
                          +{formatRupiah(prop.baseRent)} / putaran
                        </span>
                      </div>

                      <div className="flex items-center sm:justify-end gap-2 text-[10px] font-mono">
                        <span className="px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-600/60 font-bold">
                          🚨 Radar KPK +{prop.kpkRiskIncrease}%
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-sky-950/80 text-sky-300 border border-sky-600/60 font-bold">
                          🧠 Stres -{prop.stressRelief}%
                        </span>
                      </div>

                      {isOwned ? (
                        <span className="text-[10px] text-amber-400 font-bold font-mono">
                          Dimiliki oleh: {owner?.name}
                        </span>
                      ) : !isAffordable ? (
                        <span className="text-[10px] text-rose-400 font-mono">
                          Kas tunai tidak cukup
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {unownedPerimeterTiles.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800">
                  <p className="text-xs">
                    Semua sertifikat tanah di perimeter telah dimiliki oleh pemain lain. Silakan pilih tab Aset Mewah Samaran!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {unownedPerimeterTiles.map(tile => {
                    const isSelected = selectedPerimeterId === tile.id;
                    const normalPrice = Math.round((tile.price || 0) * inflationFactor);
                    const discountedPrice = Math.round(normalPrice * 0.6); // 40% discount
                    const isAffordable = player.cash >= discountedPrice;

                    return (
                      <div
                        key={tile.id}
                        onClick={() => {
                          soundManager.playClick();
                          setSelectedPerimeterId(tile.id);
                        }}
                        className={`
                          p-3 rounded-xl border-2 transition-all flex flex-col justify-between gap-2 cursor-pointer
                          ${isSelected
                            ? 'border-emerald-400 bg-emerald-950/40 ring-1 ring-emerald-400 shadow-md'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                          }
                        `}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white truncate">
                              {tile.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                              -40% Pajak
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {tile.islandName || 'Kota'} · Sewa {formatRupiah(tile.rent || 0)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                          <div>
                            <span className="text-[9px] line-through text-slate-500 font-mono block">
                              {formatRupiah(normalPrice)}
                            </span>
                            <span className="text-xs font-black text-emerald-300 font-mono">
                              {formatRupiah(discountedPrice)}
                            </span>
                          </div>

                          <span className="text-[9px] text-rose-300 font-mono font-bold bg-rose-950/60 px-1 py-0.5 rounded border border-rose-800">
                            Radar +30%
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

        {/* Modal Footer Controls */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onSkipLaundering();
            }}
            className="min-h-[44px] py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700 cursor-pointer"
          >
            Lewati (Hindari Risiko KPK)
          </button>

          {activeTab === 'LUXURY_ESTATES' ? (
            <button
              onClick={() => {
                if (selectedLuxury && player.cash >= selectedLuxury.launderPrice) {
                  soundManager.playCash();
                  onLaunderBuyLuxury(selectedLuxury);
                }
              }}
              disabled={!selectedLuxury || player.cash < selectedLuxury.launderPrice || luxuryTileOwner(selectedLuxury.id) !== null}
              className={`
                min-h-[44px] py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer
                ${selectedLuxury && player.cash >= selectedLuxury.launderPrice && luxuryTileOwner(selectedLuxury.id) === null
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/50'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }
              `}
            >
              <Briefcase className="w-4 h-4" />
              <span>Cuci Uang & Beli Aset Mewah ({selectedLuxury ? formatRupiahShort(selectedLuxury.launderPrice) : 'Pilih'})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (selectedPerimeterTile && player.cash >= perimeterDiscountedCost) {
                  soundManager.playCash();
                  onLaunderBuyPerimeter(selectedPerimeterTile, perimeterDiscountedCost, 30);
                }
              }}
              disabled={!selectedPerimeterTile || player.cash < perimeterDiscountedCost}
              className={`
                min-h-[44px] py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer
                ${selectedPerimeterTile && player.cash >= perimeterDiscountedCost
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/50'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }
              `}
            >
              <Building2 className="w-4 h-4" />
              <span>Cuci Uang ke Sertifikat ({selectedPerimeterTile ? formatRupiahShort(perimeterDiscountedCost) : 'Pilih'})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
