import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Client, Invoice, Project } from '../../types';
import { DollarSign, BarChart3, TrendingUp, Users } from 'lucide-react';

interface ClientBilledD3ChartProps {
  clients: Client[];
  invoices: Invoice[];
  projects?: Project[];
  onSelectClient?: (client: Client) => void;
}

interface ChartDatum {
  client: Client;
  name: string;
  company: string;
  totalBilled: number;
  invoiceCount: number;
  projectCount: number;
  status: string;
}

export const ClientBilledD3Chart: React.FC<ClientBilledD3ChartProps> = ({
  clients,
  invoices,
  projects = [],
  onSelectClient,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredData, setHoveredData] = useState<{
    datum: ChartDatum;
    x: number;
    y: number;
  } | null>(null);

  // Compute billing per client
  const chartData: ChartDatum[] = useMemo(() => {
    const safeClients = Array.isArray(clients) ? clients : [];
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const safeProjects = Array.isArray(projects) ? projects : [];

    return safeClients
      .map((c) => {
        const clientInvoices = safeInvoices.filter((inv) => inv && inv.clientId === c.id);
        const invoiceTotal = clientInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        // If there are recorded invoices, use that sum; otherwise fall back to client.totalBilled
        const totalBilled = invoiceTotal > 0 ? invoiceTotal : (c.totalBilled || 0);
        const clientProjects = safeProjects.filter((p) => p && p.clientId === c.id);

        return {
          client: c,
          name: c.name || 'Unnamed Client',
          company: c.company || 'Private Account',
          totalBilled,
          invoiceCount: clientInvoices.length,
          projectCount: clientProjects.length,
          status: c.status || 'Active',
        };
      })
      .sort((a, b) => b.totalBilled - a.totalBilled); // Highest billed first
  }, [clients, invoices, projects]);

  const totalBilledAll = useMemo(
    () => chartData.reduce((acc, d) => acc + d.totalBilled, 0),
    [chartData]
  );
  const avgBilled = useMemo(
    () => (chartData.length > 0 ? Math.round(totalBilledAll / chartData.length) : 0),
    [chartData, totalBilledAll]
  );
  const topClient = chartData[0] || null;

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || chartData.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 700;
    const height = Math.max(260, Math.min(320, 240 + chartData.length * 4));

    const margin = { top: 28, right: 30, bottom: 48, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto; overflow: visible;');

    // Defs for gradients and glow filters
    const defs = svg.append('defs');

    // Linear gradient for bars
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'd3-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#4338CA'); // Indigo 700
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#06B6D4'); // Cyan 500

    // Hover gradient
    const hoverGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-bar-gradient-hover')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    hoverGradient.append('stop').attr('offset', '0%').attr('stop-color', '#6366F1'); // Indigo 500
    hoverGradient.append('stop').attr('offset', '100%').attr('stop-color', '#38BDF8'); // Sky 400

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(chartData.map((d) => d.name))
      .range([0, innerWidth])
      .padding(0.32);

    const maxBilled = d3.max(chartData, (d) => d.totalBilled) || 10000;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxBilled * 1.15])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal gridlines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.05)')
      .attr('stroke-dasharray', '3 3');

    g.select('.grid .domain').remove();

    // X Axis
    const xAxis = d3.axisBottom(xScale);
    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', 'rgba(255, 255, 255, 0.1)');
    xAxisGroup
      .selectAll('text')
      .attr('fill', '#9CA3AF')
      .attr('font-size', '11px')
      .attr('font-family', 'inherit')
      .attr('dy', '12px')
      .text((d) => {
        const str = String(d);
        return str.length > 12 ? str.substring(0, 10) + '…' : str;
      });

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => {
        const val = Number(d);
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val}`;
      });

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').remove();
    yAxisGroup
      .selectAll('text')
      .attr('fill', '#6B7280')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');
    yAxisGroup.selectAll('.tick line').attr('stroke', 'rgba(255, 255, 255, 0.08)');

    // Bars
    const barGroups = g
      .selectAll('.bar-group')
      .data(chartData)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .style('cursor', 'pointer');

    barGroups
      .append('rect')
      .attr('class', 'd3-bar')
      .attr('x', (d) => xScale(d.name) || 0)
      .attr('y', (d) => yScale(d.totalBilled))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => Math.max(0, innerHeight - yScale(d.totalBilled)))
      .attr('fill', 'url(#d3-bar-gradient)')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('stroke', 'rgba(6, 182, 212, 0.3)')
      .attr('stroke-width', 1)
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .attr('fill', 'url(#d3-bar-gradient-hover)')
          .attr('stroke', 'rgba(56, 189, 248, 0.8)')
          .attr('stroke-width', 1.5);

        const [mouseX, mouseY] = d3.pointer(event, container);
        setHoveredData({ datum: d, x: mouseX, y: mouseY });
      })
      .on('mousemove', function (event, d) {
        const [mouseX, mouseY] = d3.pointer(event, container);
        setHoveredData({ datum: d, x: mouseX, y: mouseY });
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('fill', 'url(#d3-bar-gradient)')
          .attr('stroke', 'rgba(6, 182, 212, 0.3)')
          .attr('stroke-width', 1);
        setHoveredData(null);
      })
      .on('click', (_event, d) => {
        if (onSelectClient) {
          onSelectClient(d.client);
        }
      });

    // Value labels above bars
    barGroups
      .append('text')
      .attr('x', (d) => (xScale(d.name) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d) => Math.max(14, yScale(d.totalBilled) - 8))
      .attr('text-anchor', 'middle')
      .attr('fill', '#E0E7FF')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('font-family', 'monospace')
      .text((d) => `$${d.totalBilled.toLocaleString()}`);

  }, [chartData, onSelectClient]);

  if (chartData.length === 0) {
    return (
      <div className="aura-card p-6 rounded-2xl border border-white/5 text-center text-gray-400 text-xs">
        <BarChart3 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="font-semibold text-white">No Client Billing Data Available</p>
        <p className="text-gray-500 mt-1">
          Add client profiles and issue invoices to visualize billing distribution across accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="aura-card p-5 rounded-2xl border border-white/5 space-y-4 relative">
      {/* Chart Header & Top Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-display font-extrabold text-white tracking-tight">
              Total Billed Amount per Client
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              D3 Engine
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Visual breakdown of cumulative invoiced revenue by client organization.
          </p>
        </div>

        {/* Quick KPI Strip */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-[#080B14] border border-white/5">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Total Invoiced</span>
            <span className="font-mono font-bold text-emerald-400 text-xs">
              ${totalBilledAll.toLocaleString()}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#080B14] border border-white/5">
            <span className="text-[10px] text-gray-400 block uppercase font-medium">Avg / Client</span>
            <span className="font-mono font-bold text-cyan-300 text-xs">
              ${avgBilled.toLocaleString()}
            </span>
          </div>
          {topClient && (
            <div className="hidden md:block px-3 py-1.5 rounded-xl bg-[#080B14] border border-white/5">
              <span className="text-[10px] text-gray-400 block uppercase font-medium">Top Account</span>
              <span className="font-semibold text-white text-xs truncate max-w-[120px] block">
                {topClient.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* D3 Bar Chart Canvas Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden min-h-[260px]">
        <svg ref={svgRef} className="w-full" />

        {/* Interactive Floating Tooltip */}
        {hoveredData && (
          <div
            className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3 bg-[#080B14]/95 backdrop-blur-md border border-cyan-500/40 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[180px]"
            style={{
              left: `${hoveredData.x}px`,
              top: `${hoveredData.y}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="font-bold text-white text-xs">{hoveredData.datum.name}</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border uppercase ${
                  hoveredData.datum.status === 'Active'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {hoveredData.datum.status}
              </span>
            </div>
            <p className="text-[10px] text-gray-400">{hoveredData.datum.company}</p>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-gray-400 text-[10px]">Total Invoiced:</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">
                ${hoveredData.datum.totalBilled.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Recorded Invoices:</span>
              <span className="text-white font-medium">{hoveredData.datum.invoiceCount}</span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Linked Projects:</span>
              <span className="text-white font-medium">{hoveredData.datum.projectCount}</span>
            </div>
            <p className="text-[9px] text-cyan-400/80 pt-0.5 text-center">
              Click bar to view full client profile
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
