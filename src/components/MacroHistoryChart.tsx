import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  LineChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { MacroEconomy, MacroHistoryPoint } from '../types/game';
import { formatPercent, formatRupiah } from '../utils/format';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Activity,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface MacroHistoryChartProps {
  macro: MacroEconomy;
  history: MacroHistoryPoint[];
  currentRound?: number;
}

export const MacroHistoryChart: React.FC<MacroHistoryChartProps> = ({
  macro,
  history,
  currentRound = 1
}) => {
  const [activeMetric, setActiveMetric] = useState<'BOTH' | 'INFLATION' | 'USD'>('BOTH');
  const [showTable, setShowTable] = useState<boolean>(false);

  // If history has fewer than 2 items, construct baseline history points leading up to current
  const chartData = React.useMemo(() => {
    if (history && history.length >= 2) {
      return history;
    }
    // Fallback baseline data if history is minimal
    const base: MacroHistoryPoint[] = [
      {
        round: 0,
        label: 'Q3 \'25',
        fullPeriod: 'Q3 2025 (Historis Pra-Game)',
        inflationRate: 4.2,
        usdIdrRate: 15950,
        biRate: 6.0,
        trend: 'STABLE',
        note: 'Stabilitas Moneter Awal'
      },
      {
        round: 0,
        label: 'Q4 \'25',
        fullPeriod: 'Q4 2025 (Historis Pra-Game)',
        inflationRate: 4.8,
        usdIdrRate: 16180,
        biRate: 6.0,
        trend: 'RISING',
        note: 'Peningkatan Konsumsi Domestik'
      },
      {
        round: currentRound,
        label: `P${currentRound}`,
        fullPeriod: `Putaran ${currentRound} · Tahun ${macro.year} (Aktif)`,
        inflationRate: macro.inflationRate,
        usdIdrRate: macro.usdIdrRate,
        biRate: macro.biRate,
        trend: macro.trend,
        note: 'Posisi Terkini Permainan'
      }
    ];
    return base;
  }, [history, currentRound, macro]);

  // Calculations for changes
  const initialPoint = chartData[0];
  const latestPoint = chartData[chartData.length - 1];

  const inflationChange = Number((macro.inflationRate - initialPoint.inflationRate).toFixed(1));
  const usdChange = macro.usdIdrRate - initialPoint.usdIdrRate;

  // Custom Dark Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: MacroHistoryPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs text-slate-200 min-w-[210px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {dataPoint.fullPeriod || `Putaran ${dataPoint.round}`}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                dataPoint.trend === 'CRISIS'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : dataPoint.trend === 'VOLATILE'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : dataPoint.trend === 'RISING'
                  ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {dataPoint.trend}
            </span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-sans">
                <Percent className="w-3 h-3 text-amber-400" /> Laju Inflasi:
              </span>
              <span className="font-bold text-sm">
                {formatPercent(dataPoint.inflationRate)}
              </span>
            </div>

            <div className="flex items-center justify-between text-cyan-400">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-sans">
                <DollarSign className="w-3 h-3 text-cyan-400" /> Kurs USD/IDR:
              </span>
              <span className="font-bold text-sm">
                {formatRupiah(dataPoint.usdIdrRate)}
              </span>
            </div>

            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-sans">
                <Activity className="w-3 h-3 text-emerald-400" /> BI-Rate Acuan:
              </span>
              <span className="font-semibold text-xs">
                {formatPercent(dataPoint.biRate)}
              </span>
            </div>
          </div>

          {dataPoint.note && (
            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-sans italic">
              📌 {dataPoint.note}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Indicator Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">
            Observatorium Tren Makroekonomi
          </h4>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {chartData.length} Titik Data Terdata
        </span>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Inflation Card */}
        <div className={`p-3 rounded-xl border transition-all ${
          macro.trend === 'CRISIS'
            ? 'bg-rose-950/40 border-rose-600/70 shadow-lg shadow-rose-950/50'
            : macro.trend === 'VOLATILE'
            ? 'bg-amber-950/40 border-amber-600/60'
            : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Percent className="w-3 h-3 text-amber-400" /> Laju Inflasi
            </span>
            <span className={`text-[10px] font-mono flex items-center gap-0.5 ${
              inflationChange > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {inflationChange > 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {inflationChange > 0 ? `+${inflationChange}%` : `${inflationChange}%`}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-amber-400">
              {formatPercent(macro.inflationRate)}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
              macro.inflationRate > 10
                ? 'bg-rose-900/80 text-rose-300'
                : macro.inflationRate > 7
                ? 'bg-amber-900/80 text-amber-300'
                : 'bg-emerald-950 text-emerald-400'
            }`}>
              {macro.inflationRate > 10 ? 'Krisis' : macro.inflationRate > 7 ? 'Waspada' : 'Stabil'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Pengali harga tanah: {((1 + macro.inflationRate / 100)).toFixed(2)}x
          </span>
        </div>

        {/* USD/IDR Card */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-cyan-400" /> Kurs USD / IDR
            </span>
            <span className={`text-[10px] font-mono flex items-center gap-0.5 ${
              usdChange > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {usdChange > 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {usdChange > 0 ? `+Rp ${usdChange}` : `Rp ${usdChange}`}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-cyan-400">
              {formatRupiah(macro.usdIdrRate)}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              BI: {formatPercent(macro.biRate)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Depresiasi Rupiah mempengaruhi denda import
          </span>
        </div>
      </div>

      {/* Visual Metric Filter Tabs */}
      <div className="flex items-center justify-between bg-slate-950/60 p-1 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1 w-full">
          <button
            type="button"
            onClick={() => setActiveMetric('BOTH')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeMetric === 'BOTH'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Dual-Axis (Semua)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('INFLATION')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeMetric === 'INFLATION'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Percent className="w-3 h-3 text-amber-400" />
            <span>Inflasi (% YoY)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('USD')}
            className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeMetric === 'USD'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <DollarSign className="w-3 h-3 text-cyan-400" />
            <span>Kurs USD/IDR</span>
          </button>
        </div>
      </div>

      {/* Recharts Data Visualization Canvas */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-inner relative overflow-hidden">
        {/* Subtle background grid pattern */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-bold text-slate-300">
            {activeMetric === 'BOTH' && 'Grafik Korelasi Inflasi & Nilai Tukar USD'}
            {activeMetric === 'INFLATION' && 'Tren Historis Inflasi Domestik (%)'}
            {activeMetric === 'USD' && 'Fluktuasi Nilai Tukar Rupiah terhadap Dolar AS'}
          </span>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            {(activeMetric === 'BOTH' || activeMetric === 'INFLATION') && (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                Inflasi (%)
              </span>
            )}
            {(activeMetric === 'BOTH' || activeMetric === 'USD') && (
              <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
                USD/IDR (Rp)
              </span>
            )}
          </div>
        </div>

        {/* Chart Rendering */}
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorInflation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#334155' }}
              />

              {/* Left Y Axis for Inflation */}
              {(activeMetric === 'BOTH' || activeMetric === 'INFLATION') && (
                <YAxis
                  yAxisId="left"
                  stroke="#f59e0b"
                  domain={[(dataMin: number) => Math.max(0, Math.floor(dataMin - 1)), (dataMax: number) => Math.ceil(dataMax + 1.5)]}
                  tick={{ fill: '#fbbf24', fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(val: number) => `${val}%`}
                  tickLine={{ stroke: '#f59e0b' }}
                />
              )}

              {/* Right Y Axis for USD/IDR */}
              {(activeMetric === 'BOTH' || activeMetric === 'USD') && (
                <YAxis
                  yAxisId={activeMetric === 'USD' ? 'left' : 'right'}
                  orientation={activeMetric === 'USD' ? 'left' : 'right'}
                  stroke="#06b6d4"
                  domain={[(dataMin: number) => Math.floor((dataMin - 200) / 100) * 100, (dataMax: number) => Math.ceil((dataMax + 200) / 100) * 100]}
                  tick={{ fill: '#22d3ee', fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(val: number) => `${(val / 1000).toFixed(1)}k`}
                  tickLine={{ stroke: '#06b6d4' }}
                />
              )}

              <Tooltip content={<CustomTooltip />} />

              {/* Crisis Reference Line at 10% inflation */}
              {(activeMetric === 'BOTH' || activeMetric === 'INFLATION') && (
                <ReferenceLine
                  yAxisId="left"
                  y={10}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Ambang Krisis (10%)',
                    fill: '#f87171',
                    fontSize: 9,
                    position: 'insideTopLeft'
                  }}
                />
              )}

              {/* USD Alert threshold reference line */}
              {(activeMetric === 'BOTH' || activeMetric === 'USD') && (
                <ReferenceLine
                  yAxisId={activeMetric === 'USD' ? 'left' : 'right'}
                  y={17000}
                  stroke="#0ea5e9"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: 'Rp 17.000',
                    fill: '#38bdf8',
                    fontSize: 9,
                    position: 'insideTopRight'
                  }}
                />
              )}

              {/* Inflation Area & Line */}
              {(activeMetric === 'BOTH' || activeMetric === 'INFLATION') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="inflationRate"
                  name="Laju Inflasi (%)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorInflation)"
                  dot={{ r: 3, fill: '#f59e0b', stroke: '#78350f', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}

              {/* USD/IDR Area & Line */}
              {(activeMetric === 'BOTH' || activeMetric === 'USD') && (
                <Area
                  yAxisId={activeMetric === 'USD' ? 'left' : 'right'}
                  type="monotone"
                  dataKey="usdIdrRate"
                  name="Kurs USD/IDR (Rp)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorUsd)"
                  dot={{ r: 3, fill: '#06b6d4', stroke: '#164e63', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Economic Mechanics Guide & History Table Toggle */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Mekanisme Dampak Makro terhadap Permainan</span>
          </span>
          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer font-medium"
          >
            {showTable ? 'Tutup Tabel Data' : 'Buka Tabel Angka'}
          </button>
        </div>

        <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
          <li>
            <strong className="text-slate-300">Laju Inflasi:</strong> Menaikkan harga beli Surat Tanah dan tarif sewa secara proporsional. Bila inflasi &gt;10%, pasar masuk fase <strong className="text-rose-400">CRISIS</strong> dengan denda tinggi.
          </li>
          <li>
            <strong className="text-slate-300">Kurs USD/IDR:</strong> Melemahnya Rupiah meningkatkan beban pengadaan proyek, denda musibah impor, serta memicu kenaikan inflasi berikutnya.
          </li>
          <li>
            <strong className="text-slate-300">BI-Rate:</strong> Mengatur bunga tabungan dan acuan biaya modal ekspansi konglomerasi.
          </li>
        </ul>

        {/* Collapsible History Table */}
        {showTable && (
          <div className="pt-2 border-t border-slate-800 space-y-1.5 animate-in fade-in duration-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Catatan Historis Lengkap Putaran
            </span>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
              {chartData.slice().reverse().map((pt, idx) => (
                <div
                  key={`${pt.round}-${idx}`}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">{pt.label}</span>
                    <span className="text-slate-500 text-[10px] font-sans truncate max-w-[140px]">
                      {pt.note || pt.fullPeriod}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-amber-400 font-bold">
                      {formatPercent(pt.inflationRate)}
                    </span>
                    <span className="text-cyan-400">
                      {formatRupiah(pt.usdIdrRate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
