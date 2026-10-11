import React from 'react';
import { Player, BoardTile, MacroEconomy } from '../types/game';
import { formatRupiah } from '../utils/format';
import { soundManager } from '../utils/sound';
import { 
  AlertTriangle, 
  Building2, 
  Coins, 
  CheckCircle2, 
  Skull, 
  TrendingDown, 
  Zap,
  ArrowRight
} from 'lucide-react';

export type FinancialCrisisType = 
  | 'RENT' 
  | 'EVENT_LOSS' 
  | 'TILE_BILL' 
  | 'BIROKRASI' 
  | 'PSYCHOLOGIST' 
  | 'KPK_BRIBE' 
  | 'DEBT';

export interface RentCrisisModalProps {
  isOpen: boolean;
  payer: Player;
  owner?: Player;
  tile?: BoardTile;
  rentCost?: number;
  crisisType?: FinancialCrisisType;
  amountDue?: number;
  title?: string;
  subtitle?: string;
  description?: string;
  recipientName?: string;
  recipientAvatar?: string;
  recipientColor?: string;
  causeDesc?: string;
  perimeterTiles: BoardTile[];
  macro: MacroEconomy;
  onSellProperty: (tileId: number, sellValue: number) => void;
  onSellAllProperties: (sales: { tileId: number; sellValue: number }[]) => void;
  onPayRent: () => void;
  onDeclareBankruptcy: () => void;
  onUseSpecialCard?: (cardId: string) => void;
}

export function calculatePropertySellValue(tile: BoardTile, macro: MacroEconomy): number {
  const inflationFactor = 1 + (macro.inflationRate / 100);
  const basePrice = (tile.price || 0) * inflationFactor;
  const upgradePrice = tile.level && tile.level > 1 
    ? (tile.level - 1) * (tile.upgradeCost || 0) * inflationFactor 
    : 0;
  const totalValue = basePrice + upgradePrice;
  // 80% liquidation emergency recovery value
  return Math.max(100_000, Math.round(totalValue * 0.8));
}

export const RentCrisisModal: React.FC<RentCrisisModalProps> = ({
  isOpen,
  payer,
  owner,
  tile,
  rentCost,
  crisisType = 'RENT',
  amountDue,
  title,
  subtitle,
  description,
  recipientName,
  recipientAvatar,
  recipientColor,
  perimeterTiles,
  macro,
  onSellProperty,
  onSellAllProperties,
  onPayRent,
  onDeclareBankruptcy,
  onUseSpecialCard
}) => {
  if (!isOpen) return null;

  const cost = amountDue ?? rentCost ?? 0;
  const canAfford = payer.cash >= cost;
  const deficit = Math.max(0, cost - payer.cash);

  // Find all properties owned by payer
  const ownedTiles = perimeterTiles.filter(t => t.ownerId === payer.id);

  // Calculate liquidation value for all owned properties
  const propertySales = ownedTiles.map(t => ({
    tile: t,
    sellValue: calculatePropertySellValue(t, macro)
  }));

  const totalLiquidationValue = propertySales.reduce((acc, p) => acc + p.sellValue, 0);
  const totalPotentialFunds = payer.cash + totalLiquidationValue;
  const canSurviveWithLiquidation = totalPotentialFunds >= cost;

  // Check if player has special cards like ORDAL_SAKTI
  const ordalCard = payer.specialCards?.find(c => c.type === 'ORDAL_SAKTI');

  const handleSellOne = (tileId: number, val: number) => {
    soundManager.playCash();
    onSellProperty(tileId, val);
  };

  const handleSellAll = () => {
    soundManager.playCash();
    onSellAllProperties(propertySales.map(p => ({ tileId: p.tile.id, sellValue: p.sellValue })));
  };

  // Header and title details
  const displayTitle = title || (owner ? `Singgah di Surat Tanah Milik ${owner.name}` : 'Krisis Kas Tunai & Denda');
  const displaySubtitle = canAfford 
    ? 'DANA MENCUKUPI' 
    : (subtitle || (owner ? 'KRISIS KAS TUNAI · TAGIHAN SEWA' : 'KRISIS KAS TUNAI · DENDA & KERUGIAN'));
  const targetAvatar = owner?.avatar || recipientAvatar || '🏛️';
  const targetColor = owner?.color || recipientColor || '#f59e0b';
  const targetName = owner?.name || recipientName || 'Kas Negara & Instansi Terkait';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border-2 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          borderColor: canAfford ? '#10b981' : '#f43f5e',
          boxShadow: canAfford 
            ? '0 0 35px rgba(16,185,129,0.3)' 
            : '0 0 40px rgba(244,63,94,0.35)'
        }}
      >
        {/* Header Alert Banner */}
        <div className={`p-4 text-white flex items-center justify-between border-b ${
          canAfford 
            ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-800/80' 
            : 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-800/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border-2 shrink-0 ${
              canAfford 
                ? 'bg-emerald-900/60 border-emerald-500 text-emerald-300' 
                : 'bg-rose-900/60 border-rose-500 text-rose-300 animate-pulse'
            }`}>
              {canAfford ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                canAfford ? 'text-emerald-400' : 'text-rose-400 animate-pulse'
              }`}>
                {displaySubtitle}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {displayTitle}
              </h2>
            </div>
          </div>
          <div 
            className="w-9 h-9 rounded-xl border flex items-center justify-center text-lg shadow shrink-0"
            style={{ borderColor: targetColor, backgroundColor: `${targetColor}20` }}
            title={`Pihak Penagih: ${targetName}`}
          >
            {targetAvatar}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Situation Notice */}
          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            {description ? (
              <p>{description}</p>
            ) : owner && tile ? (
              <p>
                Anda mendarat di <strong className="text-white">Petak #{tile.id} ({tile.name})</strong> yang bersertifikat atas nama <strong style={{ color: owner.color }}>{owner.name}</strong>. Menurut undang-undang properti Konoha, biaya sewa wajib dilunasi!
              </p>
            ) : (
              <p>
                Anda memiliki kewajiban denda / biaya darurat yang harus dilunasi kepada <strong style={{ color: targetColor }}>{targetName}</strong>. Saldo kas tunai tidak mencukupi, jual aset properti untuk melunasi!
              </p>
            )}
          </div>

          {/* Financial Breakdown Table */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                {owner && tile ? `Total Biaya Sewa (${tile.shortName || tile.name} L${tile.level || 1})` : 'Total Kewajiban Tagihan / Denda'}
              </span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                -{formatRupiah(cost)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-850">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                Saldo Kas Tunai Saat Ini
              </span>
              <span className={`font-mono font-bold text-sm ${canAfford ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {formatRupiah(payer.cash)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800">
              <span className="text-slate-300 font-bold">
                {canAfford ? 'Sisa Kas Setelah Pembayaran' : 'Kekurangan Dana Pembayaran'}
              </span>
              <span className={`font-mono font-black text-sm ${
                canAfford ? 'text-emerald-400' : 'text-rose-400 animate-pulse'
              }`}>
                {canAfford ? `+${formatRupiah(payer.cash - cost)}` : `-${formatRupiah(deficit)}`}
              </span>
            </div>
          </div>

          {/* Conditional Guidance Banner */}
          {canAfford ? (
            <div className="bg-emerald-950/60 border border-emerald-600/70 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Kas tunai Anda telah mencukupi! Klik tombol di bawah untuk melunasi pembayaran dan melanjutkan perjalanan dengan selamat.
              </span>
            </div>
          ) : (
            <div className="bg-rose-950/60 border border-rose-600/70 rounded-xl p-3 space-y-1.5 text-xs text-rose-200">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Kas tunai tidak cukup! Likuidasi aset tanah untuk selamat.</span>
              </div>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                Jual surat tanah milik Anda dengan nilai tebus likuidasi darurat <strong className="text-amber-300 font-mono">80% dari harga pasar</strong> guna menambah kas tunai dan melunasi kewajiban ini.
              </p>
            </div>
          )}

          {/* Optional: Special Card ORDAL SAKTI Escape */}
          {ordalCard && onUseSpecialCard && (
            <div className="bg-amber-950/50 border border-amber-500/70 rounded-xl p-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-amber-300 block">
                    Gunakan Kartu Ordal Sakti
                  </span>
                  <span className="text-[10px] text-slate-300">
                    Bebaskan 100% kewajiban tagihan ini lewat jalur orang dalam!
                  </span>
                </div>
              </div>
              <button
                onClick={() => onUseSpecialCard(ordalCard.id)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 shadow"
              >
                Pakai Kartu
              </button>
            </div>
          )}

          {/* Section: Properties Available for Liquidation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Surat Tanah Milik Anda ({ownedTiles.length} Aset)
              </h4>
              {ownedTiles.length > 1 && !canAfford && (
                <button
                  onClick={handleSellAll}
                  className="text-[11px] font-bold text-rose-300 hover:text-white bg-rose-950 hover:bg-rose-900 border border-rose-700 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  title="Jual semua aset sekaligus untuk menambah kas maksimal"
                >
                  Jual Semua Aset (+{formatRupiah(totalLiquidationValue)})
                </button>
              )}
            </div>

            {ownedTiles.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 text-center text-xs text-slate-400">
                <Building2 className="w-6 h-6 text-slate-600 mx-auto mb-1 opacity-50" />
                <span>Anda tidak memiliki Surat Tanah tersisa yang dapat dijual.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {propertySales.map(({ tile: prop, sellValue }) => (
                  <div 
                    key={prop.id}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          #{prop.id}
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          {prop.name}
                        </span>
                        <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          L{prop.level || 1}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Nilai Jual Darurat: <strong className="text-emerald-400 font-mono font-bold">{formatRupiah(sellValue)}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => handleSellOne(prop.id, sellValue)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow transition-all cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <span>Jual</span>
                      <span className="font-mono text-[10px]">+{formatRupiah(sellValue)}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
          {/* Bankruptcy Fallback Button */}
          <button
            onClick={() => {
              soundManager.playBuzzer();
              onDeclareBankruptcy();
            }}
            className="px-3 py-2 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-950/80 rounded-xl border border-rose-900/60 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Menyerah dan nyatakan kebangkrutan"
          >
            <Skull className="w-3.5 h-3.5" />
            <span>Nyatakan Bangkrut</span>
          </button>

          {/* Primary Action Button */}
          {canAfford ? (
            <button
              onClick={() => {
                soundManager.playCash();
                onPayRent();
              }}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
            >
              <span>{owner ? `Bayar Sewa (${formatRupiah(cost)})` : `Lunasi Pembayaran (${formatRupiah(cost)})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">
                {canSurviveWithLiquidation 
                  ? 'Jual aset di atas hingga kas mencukupi' 
                  : 'Total aset tidak cukup melunasi tagihan!'}
              </span>
              <span className="text-xs font-mono font-bold text-rose-400">
                Kurang: {formatRupiah(deficit)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const FinancialCrisisModal = RentCrisisModal;
