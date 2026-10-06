import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface SparklinePoint {
  date: string;
  value: number;
}

interface D3MetricSparklineProps {
  id: string;
  data: SparklinePoint[];
  strokeColor?: string;
  fillColor?: string;
  metricLabel?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  showTrendBadge?: boolean;
}

export const D3MetricSparkline: React.FC<D3MetricSparklineProps> = ({
  id,
  data,
  strokeColor = '#06B6D4', // cyan-500
  fillColor = '#0891B2',
  metricLabel = 'Value',
  valuePrefix = '',
  valueSuffix = '',
  height = 46,
  showTrendBadge = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<SparklinePoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Growth calculation: compare last 7d/30d or start to end
  const firstVal = data[0]?.value ?? 0;
  const lastVal = data[data.length - 1]?.value ?? 0;
  const delta = lastVal - firstVal;
  const percentGrowth = firstVal > 0 ? ((delta / firstVal) * 100).toFixed(1) : delta > 0 ? '+100%' : '0%';
  const isPositive = delta >= 0;

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const containerWidth = containerRef.current.clientWidth || 180;
    const width = containerWidth;
    const margin = { top: 6, right: 6, bottom: 6, left: 6 };
    const innerWidth = Math.max(10, width - margin.left - margin.right);
    const innerHeight = Math.max(10, height - margin.top - margin.bottom);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Unique gradient id
    const gradientId = `sparkline-grad-${id}`;

    // Defs for area gradient
    const defs = svg.append('defs');
    const linearGrad = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    linearGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', fillColor)
      .attr('stop-opacity', 0.28);

    linearGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', fillColor)
      .attr('stop-opacity', 0.0);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(1, data.length - 1)])
      .range([0, innerWidth]);

    const numericValues = data.map((d) => d.value);
    const yMin = numericValues.length > 0 ? Math.min(...numericValues) : 0;
    const yMax = numericValues.length > 0 ? Math.max(...numericValues) : 1;
    // Add small buffer to avoid flat lines touching borders
    const yPadding = (yMax - yMin) * 0.15 || 1;

    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, yMin - yPadding * 0.5), yMax + yPadding])
      .range([innerHeight, 0]);

    // Area generator
    const areaGen = d3
      .area<SparklinePoint>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Line generator
    const lineGen = d3
      .line<SparklinePoint>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw Area
    g.append('path')
      .datum(data)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', areaGen);

    // Draw Line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', lineGen);

    // End point circle with glowing halo
    const lastIndex = data.length - 1;
    const lastX = xScale(lastIndex);
    const lastY = yScale(data[lastIndex]?.value ?? 0);

    // Halo ring
    g.append('circle')
      .attr('cx', lastX)
      .attr('cy', lastY)
      .attr('r', 4.5)
      .attr('fill', strokeColor)
      .attr('fill-opacity', 0.25);

    // Solid inner dot
    g.append('circle')
      .attr('cx', lastX)
      .attr('cy', lastY)
      .attr('r', 2.5)
      .attr('fill', strokeColor);

    // Invisible hover overlay for interactive tracking
    const bisect = d3.bisector((d: SparklinePoint) => d.date).center;

    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const relX = Math.max(0, Math.min(innerWidth, mx - margin.left));
        const index = Math.round(xScale.invert(relX));
        const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
        setHoveredPoint(data[clampedIndex]);
        setHoverX(mx);
      })
      .on('mouseleave', () => {
        setHoveredPoint(null);
        setHoverX(null);
      });
  }, [data, height, strokeColor, fillColor, id]);

  return (
    <div id={`sparkline-container-${id}`} ref={containerRef} className="w-full mt-2 relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">
          30-Day Growth
        </span>
        {showTrendBadge && (
          <span
            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
              isPositive
                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20'
                : 'text-amber-400 bg-amber-950/40 border border-amber-500/20'
            }`}
          >
            {isPositive ? '+' : ''}
            {typeof percentGrowth === 'string' && percentGrowth.includes('%')
              ? percentGrowth
              : `${percentGrowth}%`}
          </span>
        )}
      </div>

      <div className="relative">
        <svg ref={svgRef} className="w-full overflow-visible block" style={{ height }} />

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && hoverX !== null && (
          <div
            className="absolute -top-7 -translate-x-1/2 z-20 pointer-events-none px-2 py-0.5 rounded bg-[#0D1220] border border-cyan-500/40 text-[10px] font-mono text-white shadow-lg whitespace-nowrap"
            style={{ left: Math.max(20, Math.min(160, hoverX)) }}
          >
            <span className="text-gray-400">{hoveredPoint.date}: </span>
            <span className="text-cyan-300 font-bold">
              {valuePrefix}
              {hoveredPoint.value.toLocaleString()}
              {valueSuffix}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
