import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Player, PlayerCorruptionHistoryPoint } from '../types/game';
import { formatRupiah, formatRupiahShort } from '../utils/format';
import { ShieldAlert, TrendingUp, DollarSign, Activity, Maximize2, Minimize2, Users, Radio, Info } from 'lucide-react';

export type ChartMetricMode = 'SUSPICION' | 'GAINS' | 'BOTH';

interface CorruptionD3AreaChartProps {
  players: Player[];
  history: PlayerCorruptionHistoryPoint[];
  currentRound: number;
  initialMetric?: ChartMetricMode;
  height?: number;
  compact?: boolean;
}

export const CorruptionD3AreaChart: React.FC<CorruptionD3AreaChartProps> = ({
  players,
  history,
  currentRound,
  initialMetric = 'SUSPICION',
  height = 240,
  compact = false
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [metricMode, setMetricMode] = useState<ChartMetricMode>(initialMetric);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [hoveredRoundIndex, setHoveredRoundIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(360);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Resize listener for fluid responsive D3 rendering
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Construct chart dataset: Ensure at least 3 points for smooth area rendering even early in the game
  const chartData = useMemo(() => {
    if (history && history.length >= 2) {
      return history;
    }

    // Baseline historical trajectory leading up to current round
    const basePoint0: PlayerCorruptionHistoryPoint = {
      round: 0,
      label: 'Start',
      fullPeriod: 'Pra-Permainan (Titik Nol)',
      playersData: players.map(p => ({
        playerId: p.id,
        playerName: p.name,
        playerColor: p.color,
        playerAvatar: p.avatar,
        kpkSuspicionLevel: 10,
        totalCorruptionGains: 0
      }))
    };

    const basePoint1: PlayerCorruptionHistoryPoint = {
      round: Math.max(1, currentRound - 1),
      label: `P${Math.max(1, currentRound - 1)}`,
      fullPeriod: `Putaran ${Math.max(1, currentRound - 1)} (Awal)`,
      playersData: players.map(p => ({
        playerId: p.id,
        playerName: p.name,
        playerColor: p.color,
        playerAvatar: p.avatar,
        kpkSuspicionLevel: Math.max(10, Math.round(p.kpkSuspicionLevel * 0.7)),
        totalCorruptionGains: Math.round(p.stats.totalCorruptionGains * 0.5)
      }))
    };

    const currentPoint: PlayerCorruptionHistoryPoint = {
      round: currentRound,
      label: `P${currentRound}`,
      fullPeriod: `Putaran ${currentRound} (Terkini)`,
      playersData: players.map(p => ({
        playerId: p.id,
        playerName: p.name,
        playerColor: p.color,
        playerAvatar: p.avatar,
        kpkSuspicionLevel: p.kpkSuspicionLevel,
        totalCorruptionGains: p.stats.totalCorruptionGains,
        isInCorruptionRoute: p.isInCorruptionRoute,
        inJail: p.inJail
      }))
    };

    return [basePoint0, basePoint1, currentPoint];
  }, [history, players, currentRound]);

  // Main D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current || chartData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean slate for pure D3 pipeline

    const chartHeight = isExpanded ? 360 : height;
    const margin = {
      top: 18,
      right: metricMode === 'BOTH' ? 44 : 20,
      bottom: 28,
      left: metricMode === 'GAINS' ? 48 : 34
    };

    const innerWidth = Math.max(50, containerWidth - margin.left - margin.right);
    const innerHeight = Math.max(50, chartHeight - margin.top - margin.bottom);

    // Create defs for linear gradients
    const defs = svg.append('defs');

    // Filter players to display
    const activePlayersToRender = selectedPlayerId 
      ? players.filter(p => p.id === selectedPlayerId)
      : players;

    // Linear gradients for area fills per player
    activePlayersToRender.forEach(p => {
      const gradId = `area-gradient-${p.id}-${metricMode}`;
      const grad = defs.append('linearGradient')
        .attr('id', gradId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', p.color)
        .attr('stop-opacity', 0.45);

      grad.append('stop')
        .attr('offset', '80%')
        .attr('stop-color', p.color)
        .attr('stop-opacity', 0.08);

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', p.color)
        .attr('stop-opacity', 0.0);
    });

    // Main Chart Group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: Rounds
    const xScale = d3.scalePoint<number>()
      .domain(chartData.map((_, i) => i))
      .range([0, innerWidth])
      .padding(0.08);

    // Y Scale depending on mode
    let ySuspicionScale = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Max gains across all points and players
    const maxGainsFound = d3.max(chartData, d => 
      d3.max(d.playersData, p => p.totalCorruptionGains)
    ) || 60_000_000;

    const yGainsScale = d3.scaleLinear()
      .domain([0, Math.max(60_000_000, maxGainsFound * 1.15)])
      .range([innerHeight, 0]);

    // Background horizontal grid lines
    const gridTicks = [25, 50, 75, 100];
    const gridGroup = g.append('g').attr('class', 'grid-lines');

    gridTicks.forEach(tickVal => {
      const yPos = metricMode === 'GAINS'
        ? (yGainsScale.domain()[1] * tickVal / 100)
        : tickVal;
      const computedY = metricMode === 'GAINS' ? yGainsScale(yPos) : ySuspicionScale(yPos);

      gridGroup.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', computedY)
        .attr('y2', computedY)
        .attr('stroke', '#334155')
        .attr('stroke-opacity', tickVal === 50 || tickVal === 75 ? 0.35 : 0.18)
        .attr('stroke-dasharray', tickVal === 50 || tickVal === 75 ? '4,3' : '2,2');
    });

    // Reference Hazard Lines if Suspicion is shown
    if (metricMode === 'SUSPICION' || metricMode === 'BOTH') {
      // 50% Sidak threshold line
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', ySuspicionScale(50))
        .attr('y2', ySuspicionScale(50))
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4 3')
        .attr('opacity', 0.6);

      g.append('text')
        .attr('x', innerWidth - 4)
        .attr('y', ySuspicionScale(50) - 3)
        .attr('text-anchor', 'end')
        .attr('fill', '#f59e0b')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .attr('opacity', 0.75)
        .text('AMBANG SIDAK (50%)');

      // 75% Critical OTT hazard line
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', ySuspicionScale(75))
        .attr('y2', ySuspicionScale(75))
        .attr('stroke', '#f43f5e')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 2')
        .attr('opacity', 0.7);

      g.append('text')
        .attr('x', innerWidth - 4)
        .attr('y', ySuspicionScale(75) - 3)
        .attr('text-anchor', 'end')
        .attr('fill', '#f43f5e')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('opacity', 0.85)
        .text('BAHAYA OTT (75%)');
    }

    // Render Area & Line Series for each player
    activePlayersToRender.forEach(player => {
      // Metric value extractor
      const getValue = (historyItem: PlayerCorruptionHistoryPoint): number => {
        const pData = historyItem.playersData.find(pd => pd.playerId === player.id);
        if (!pData) return 0;
        return metricMode === 'GAINS' ? pData.totalCorruptionGains : pData.kpkSuspicionLevel;
      };

      const yScale = metricMode === 'GAINS' ? yGainsScale : ySuspicionScale;

      // Area generator
      const areaGen = d3.area<PlayerCorruptionHistoryPoint>()
        .x((_, i) => xScale(i) ?? 0)
        .y0(innerHeight)
        .y1(d => yScale(getValue(d)))
        .curve(d3.curveMonotoneX);

      // Line generator for sharp boundary stroke
      const lineGen = d3.line<PlayerCorruptionHistoryPoint>()
        .x((_, i) => xScale(i) ?? 0)
        .y(d => yScale(getValue(d)))
        .curve(d3.curveMonotoneX);

      // Render Area Path
      g.append('path')
        .datum(chartData)
        .attr('class', `area-series-${player.id}`)
        .attr('fill', `url(#area-gradient-${player.id}-${metricMode})`)
        .attr('d', areaGen);

      // Render Stroke Line
      g.append('path')
        .datum(chartData)
        .attr('class', `line-series-${player.id}`)
        .attr('fill', 'none')
        .attr('stroke', player.color)
        .attr('stroke-width', selectedPlayerId === player.id ? 2.5 : 1.8)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .style('filter', `drop-shadow(0 0 4px ${player.color}70)`)
        .attr('d', lineGen);

      // Data Points (Circles)
      chartData.forEach((d, i) => {
        const cx = xScale(i) ?? 0;
        const cy = yScale(getValue(d));
        const isHovered = hoveredRoundIndex === i;

        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', isHovered ? 4.5 : 2.5)
          .attr('fill', isHovered ? '#ffffff' : player.color)
          .attr('stroke', player.color)
          .attr('stroke-width', isHovered ? 2 : 1)
          .style('transition', 'r 0.2s ease');
      });
    });

    // Render Dual Metric Secondary Line if 'BOTH' is selected (shows gains as dashed neon overlay)
    if (metricMode === 'BOTH') {
      activePlayersToRender.forEach(player => {
        const dualLineGen = d3.line<PlayerCorruptionHistoryPoint>()
          .x((_, i) => xScale(i) ?? 0)
          .y(d => {
            const pData = d.playersData.find(pd => pd.playerId === player.id);
            return yGainsScale(pData?.totalCorruptionGains ?? 0);
          })
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(chartData)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', selectedPlayerId && selectedPlayerId !== player.id ? 0.2 : 0.75)
          .attr('d', dualLineGen);
      });
    }

    // X-Axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((_, i) => chartData[i]?.label || `P${i}`);

    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#475569');
    xAxisGroup.selectAll('.tick line').attr('stroke', '#475569');
    xAxisGroup.selectAll('.tick text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    // Y-Axis Left
    const yAxisLeft = metricMode === 'GAINS'
      ? d3.axisLeft(yGainsScale).ticks(4).tickFormat(d => `${Number(d) / 1_000_000}M`)
      : d3.axisLeft(ySuspicionScale).ticks(4).tickFormat(d => `${d}%`);

    const yAxisGroup = g.append('g')
      .call(yAxisLeft);

    yAxisGroup.select('.domain').attr('stroke', '#475569');
    yAxisGroup.selectAll('.tick line').attr('stroke', '#334155');
    yAxisGroup.selectAll('.tick text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace');

    // Y-Axis Right (if BOTH mode)
    if (metricMode === 'BOTH') {
      const yAxisRight = d3.axisRight(yGainsScale)
        .ticks(4)
        .tickFormat(d => `${Number(d) / 1_000_000}M`);

      const yRightGroup = g.append('g')
        .attr('transform', `translate(${innerWidth},0)`)
        .call(yAxisRight);

      yRightGroup.select('.domain').attr('stroke', '#475569');
      yRightGroup.selectAll('.tick line').attr('stroke', '#334155');
      yRightGroup.selectAll('.tick text')
        .attr('fill', '#38bdf8')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace');
    }

    // Vertical hover crosshair cursor line
    if (hoveredRoundIndex !== null) {
      const hoverX = xScale(hoveredRoundIndex) ?? 0;
      g.append('line')
        .attr('x1', hoverX)
        .attr('x2', hoverX)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.85);
    }

    // Transparent Interactive Overlay to track mouse pointer across rounds
    const overlay = g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    overlay.on('mousemove', (event) => {
      const [mouseX] = d3.pointer(event);
      // Find closest round index
      let closestIdx = 0;
      let minDistance = Infinity;

      chartData.forEach((_, i) => {
        const posX = xScale(i) ?? 0;
        const dist = Math.abs(mouseX - posX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      });

      setHoveredRoundIndex(closestIdx);
    });

    overlay.on('mouseleave', () => {
      setHoveredRoundIndex(null);
    });

  }, [chartData, metricMode, selectedPlayerId, hoveredRoundIndex, containerWidth, isExpanded, height, players]);

  // Active or Hovered details
  const activeDetailPoint = hoveredRoundIndex !== null 
    ? chartData[hoveredRoundIndex] 
    : chartData[chartData.length - 1];

  // Top Corrupt and Highest Suspicion leader
  const highestSuspicionPlayer = useMemo(() => {
    return [...players].sort((a, b) => b.kpkSuspicionLevel - a.kpkSuspicionLevel)[0];
  }, [players]);

  const topGainsPlayer = useMemo(() => {
    return [...players].sort((a, b) => b.stats.totalCorruptionGains - a.stats.totalCorruptionGains)[0];
  }, [players]);

  return (
    <div 
      ref={containerRef}
      className="w-full bg-slate-950/95 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md overflow-hidden text-slate-100 transition-all duration-300"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-5 h-5 rounded-full border border-amber-500/70 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, rgba(245, 158, 11, 0.7) 0deg, transparent 60deg)',
                animation: 'radar-sweep 2.5s linear infinite',
                transformOrigin: 'center center'
              }}
            />
            <Radio className="w-3 h-3 text-amber-400 relative z-10" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide truncate flex items-center gap-1.5">
              <span>TREN INTELIJEN KPK & GAINS</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                D3.js
              </span>
            </h4>
            <span className="text-[9px] text-slate-400 font-mono block">
              Analisis Risiko Sadap & Akumulasi Hasil Korupsi
            </span>
          </div>
        </div>

        {/* Expand / Minimize toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={isExpanded ? 'Kecilkan Chart' : 'Perbesar Chart D3'}
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Metric Mode Switcher Tabs */}
      <div className="flex items-center justify-between gap-1 mb-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[10px] font-mono font-bold">
        <button
          onClick={() => setMetricMode('SUSPICION')}
          className={`flex-1 py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
            metricMode === 'SUSPICION'
              ? 'bg-rose-950 text-rose-300 border border-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          <span className="truncate">Radar KPK (%)</span>
        </button>

        <button
          onClick={() => setMetricMode('GAINS')}
          className={`flex-1 py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
            metricMode === 'GAINS'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-3 h-3 text-emerald-400" />
          <span className="truncate">Cuan Korupsi</span>
        </button>

        <button
          onClick={() => setMetricMode('BOTH')}
          className={`py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
            metricMode === 'BOTH'
              ? 'bg-sky-950 text-sky-300 border border-sky-600 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Tampilkan Radar KPK dan Cuan Korupsi bersamaan"
        >
          <Activity className="w-3 h-3 text-sky-400" />
          <span>Dual</span>
        </button>
      </div>

      {/* Player Filters / Focus Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-1.5 no-scrollbar text-[9px] font-mono">
        <button
          onClick={() => setSelectedPlayerId(null)}
          className={`px-2 py-0.5 rounded-md border shrink-0 transition-all cursor-pointer ${
            selectedPlayerId === null
              ? 'bg-slate-800 text-white border-amber-400 font-bold shadow'
              : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
          }`}
        >
          Semua Pemain ({players.length})
        </button>

        {players.map((p, idx) => {
          const isSelected = selectedPlayerId === p.id;
          const playerTag = p.id.startsWith('player_') ? `P${p.id.replace('player_', '')}` : `P${idx + 1}`;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(isSelected ? null : p.id)}
              className="px-1.5 py-0.5 rounded-md border shrink-0 flex items-center gap-1 transition-all cursor-pointer"
              style={{
                borderColor: isSelected ? p.color : `${p.color}40`,
                backgroundColor: isSelected ? `${p.color}30` : 'transparent',
                color: isSelected ? '#ffffff' : p.color
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="font-bold">{playerTag}</span>
              <span className="truncate max-w-[50px]">{p.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* D3 SVG Canvas Area */}
      <div className="relative w-full rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-inner">
        <svg
          ref={svgRef}
          width="100%"
          height={isExpanded ? 360 : height}
          className="block"
        />

        {/* Legend Overlay at Top Right of Canvas */}
        <div className="absolute top-1 right-2 pointer-events-none flex items-center gap-2 text-[8px] font-mono">
          {metricMode === 'BOTH' ? (
            <>
              <span className="text-slate-300 flex items-center gap-1">
                <span className="w-2 h-0.5 bg-slate-200" /> Area: Radar KPK %
              </span>
              <span className="text-sky-400 flex items-center gap-1">
                <span className="w-2 h-0.5 border-t border-sky-400 border-dashed" /> Garis: Cuan Rp
              </span>
            </>
          ) : metricMode === 'SUSPICION' ? (
            <span className="text-rose-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500/50 border border-rose-400" /> Radar Penyadapan
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500/50 border border-emerald-400" /> Akumulasi Kas Korupsi
            </span>
          )}
        </div>
      </div>

      {/* Interactive Tooltip & Live Point Details Bar */}
      {activeDetailPoint && (
        <div className="mt-2 p-2 bg-slate-900/95 border border-slate-800 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[10px] font-mono">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-400" />
              <span>{activeDetailPoint.fullPeriod}</span>
            </span>
            <span className="text-slate-400">
              {hoveredRoundIndex !== null ? '📍 Titik Disorot' : '⚡ Posisi Terkini'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {activeDetailPoint.playersData
              .filter(pData => !selectedPlayerId || pData.playerId === selectedPlayerId)
              .map(pData => (
                <div 
                  key={pData.playerId} 
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: pData.playerColor }} 
                    />
                    <span className="font-extrabold text-white truncate max-w-[80px]">
                      {pData.playerName.split(' ')[0]}
                    </span>
                    {pData.kpkSuspicionLevel >= 75 && (
                      <span className="text-[8px] font-mono px-1 rounded bg-rose-950 text-rose-400 border border-rose-800 font-black shrink-0">
                        OTT!
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className={`text-[10px] font-bold ${pData.kpkSuspicionLevel > 50 ? 'text-rose-400' : 'text-slate-300'}`}>
                      KPK {pData.kpkSuspicionLevel}%
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {formatRupiahShort(pData.totalCorruptionGains)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick Summary Highlights Footer */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-1.5 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-slate-400 block text-[9px] uppercase font-mono">Radar KPK Tertinggi</span>
            <span className="font-bold text-white truncate block">
              {highestSuspicionPlayer.name.split(' ')[0]}
            </span>
          </div>
          <span className={`font-mono font-black text-xs ${highestSuspicionPlayer.kpkSuspicionLevel > 50 ? 'text-rose-400' : 'text-slate-300'}`}>
            {highestSuspicionPlayer.kpkSuspicionLevel}%
          </span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-1.5 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-slate-400 block text-[9px] uppercase font-mono">Top Cuan Ordal</span>
            <span className="font-bold text-white truncate block">
              {topGainsPlayer.name.split(' ')[0]}
            </span>
          </div>
          <span className="font-mono font-black text-xs text-emerald-400">
            {formatRupiahShort(topGainsPlayer.stats.totalCorruptionGains)}
          </span>
        </div>
      </div>
    </div>
  );
};
