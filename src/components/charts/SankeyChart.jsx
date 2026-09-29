import React, { useMemo, useState, useRef, useEffect } from 'react';
import { cn, formatItalianNumber } from '@/lib/utils';

/**
 * SankeyChart — Componente SVG puro reattivo per diagrammi di flusso Sankey.
 * Conforme al 100% al Design System Bercella (zero dipendenze esterne, divieto di indigo, dark mode, responsive).
 */
export default function SankeyChart({
  data,
  height = 460,
  nodeWidth = 20,
  nodeGap = 10,
  minNodeHeight = 10,
  formatValue = (v) => `${v}`,
  onNodeClick,
  onLinkClick,
  className
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [hoveredLinkId, setHoveredLinkId] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // Monitora la larghezza del contenitore tramite ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const margin = useMemo(() => ({
    top: 20,
    right: 115, // Spazio calibrato per le label a destra
    bottom: 20,
    left: 115   // Spazio calibrato per le label a sinistra
  }), []);

  // Calcolo del layout del diagramma Sankey
  const layout = useMemo(() => {
    if (!data || !data.nodes || data.nodes.length === 0) {
      return { nodes: [], links: [], gradients: [], width: containerWidth, height };
    }

    const effectiveWidth = Math.max(containerWidth, 680);
    const innerW = effectiveWidth - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // 1. Raggruppa i nodi per colonna
    const colMap = new Map();
    data.nodes.forEach(n => {
      const col = Number(n.column) || 0;
      if (!colMap.has(col)) colMap.set(col, []);
      colMap.get(col).push({ ...n });
    });

    const columns = Array.from(colMap.keys()).sort((a, b) => a - b);
    const numCols = columns.length;
    if (numCols <= 1) {
      return { nodes: [], links: [], gradients: [], width: effectiveWidth, height };
    }

    // 2. Calcola le coordinate X per ogni colonna
    const colXMap = new Map();
    columns.forEach((col, idx) => {
      const x = margin.left + idx * ((innerW - nodeWidth) / (numCols - 1));
      colXMap.set(col, x);
    });

    // 3. Calcola altezza e posizione Y dei nodi in ogni colonna
    const positionedNodesMap = new Map();

    columns.forEach(col => {
      const colNodes = colMap.get(col);
      // Ordina i nodi per valore decrescente
      colNodes.sort((a, b) => (b.value || 0) - (a.value || 0));

      const totalVal = colNodes.reduce((sum, n) => sum + (Number(n.value) || 0), 0);
      const gapCount = Math.max(0, colNodes.length - 1);
      const availableH = Math.max(20, innerH - gapCount * nodeGap);

      // Assegna altezze proporzionali garantendo minNodeHeight
      const rawHeights = colNodes.map(n => {
        const val = Number(n.value) || 0;
        if (totalVal <= 0) return minNodeHeight;
        return (val / totalVal) * availableH;
      });

      // Applica altezza minima e normalizza
      const finalHeights = rawHeights.map(h => Math.max(minNodeHeight, h));
      const totalAllocatedH = finalHeights.reduce((sum, h) => sum + h, 0);
      const scaleFactor = totalAllocatedH > 0 && totalAllocatedH > availableH ? availableH / totalAllocatedH : 1;

      let currentY = margin.top + (innerH - (finalHeights.reduce((sum, h) => sum + h * scaleFactor, 0) + gapCount * nodeGap)) / 2;
      currentY = Math.max(margin.top, currentY);

      colNodes.forEach((n, idx) => {
        const h = Math.max(6, finalHeights[idx] * scaleFactor);
        const nodeObj = {
          ...n,
          x: colXMap.get(col),
          y: currentY,
          width: nodeWidth,
          height: h,
          totalValue: totalVal,
          sourceOffsetY: 0,
          targetOffsetY: 0,
        };
        positionedNodesMap.set(n.id, nodeObj);
        currentY += h + nodeGap;
      });
    });

    // 4. Prepara e calcola i link (nastri di flusso)
    const nodeOutLinks = new Map();
    const nodeInLinks = new Map();

    const preparedLinks = (data.links || []).map((l, idx) => ({
      ...l,
      id: l.id || `link-${l.source}-${l.target}-${idx}`,
      value: Number(l.value) || 0
    }));

    preparedLinks.forEach(l => {
      if (!nodeOutLinks.has(l.source)) nodeOutLinks.set(l.source, []);
      nodeOutLinks.get(l.source).push(l);

      if (!nodeInLinks.has(l.target)) nodeInLinks.set(l.target, []);
      nodeInLinks.get(l.target).push(l);
    });

    // Ordina i link uscenti in base alla coordinata Y del target (evita incroci)
    nodeOutLinks.forEach((links) => {
      links.sort((a, b) => {
        const tgtA = positionedNodesMap.get(a.target);
        const tgtB = positionedNodesMap.get(b.target);
        return (tgtA?.y || 0) - (tgtB?.y || 0);
      });
    });

    // Ordina i link entranti in base alla coordinata Y della sorgente
    nodeInLinks.forEach((links) => {
      links.sort((a, b) => {
        const srcA = positionedNodesMap.get(a.source);
        const srcB = positionedNodesMap.get(b.source);
        return (srcA?.y || 0) - (srcB?.y || 0);
      });
    });

    // 5. Costruzione della geometria SVG dei nastri
    const computedLinks = [];
    const gradients = [];

    preparedLinks.forEach(link => {
      const srcNode = positionedNodesMap.get(link.source);
      const tgtNode = positionedNodesMap.get(link.target);
      if (!srcNode || !tgtNode) return;

      const srcVal = srcNode.value || 1;
      const tgtVal = tgtNode.value || 1;

      const srcThickness = Math.max(1, (link.value / srcVal) * srcNode.height);
      const tgtThickness = Math.max(1, (link.value / tgtVal) * tgtNode.height);

      const x0 = srcNode.x + nodeWidth;
      const y0Top = srcNode.y + srcNode.sourceOffsetY;
      const y0Bot = y0Top + srcThickness;
      srcNode.sourceOffsetY += srcThickness;

      const x1 = tgtNode.x;
      const y1Top = tgtNode.y + tgtNode.targetOffsetY;
      const y1Bot = y1Top + tgtThickness;
      tgtNode.targetOffsetY += tgtThickness;

      const xMid = (x0 + x1) / 2;

      // Percorso Bézier curvilineo chiuso
      const pathData = `
        M ${x0},${y0Top}
        C ${xMid},${y0Top} ${xMid},${y1Top} ${x1},${y1Top}
        L ${x1},${y1Bot}
        C ${xMid},${y1Bot} ${xMid},${y0Bot} ${x0},${y0Bot}
        Z
      `;

      const gradId = `sankey-grad-${link.source.replace(/[^a-zA-Z0-9]/g, '_')}-${link.target.replace(/[^a-zA-Z0-9]/g, '_')}`;
      gradients.push({
        id: gradId,
        fromColor: srcNode.color || '#0ea5e9',
        toColor: tgtNode.color || '#06b6d4'
      });

      computedLinks.push({
        ...link,
        pathData,
        gradId,
        sourceNode: srcNode,
        targetNode: tgtNode,
        thickness: (srcThickness + tgtThickness) / 2
      });
    });

    return {
      nodes: Array.from(positionedNodesMap.values()),
      links: computedLinks,
      gradients,
      width: effectiveWidth,
      height
    };
  }, [data, containerWidth, height, margin, nodeWidth, nodeGap, minNodeHeight]);

  // Gestione dell'interazione hover per evidenziare percorsi correlati
  const isElementHighlighted = (type, elem) => {
    if (!hoveredNodeId && !hoveredLinkId) return true;
    if (hoveredLinkId) {
      if (type === 'link') return elem.id === hoveredLinkId;
      if (type === 'node') {
        const link = layout.links.find(l => l.id === hoveredLinkId);
        return link && (link.source === elem.id || link.target === elem.id);
      }
    }
    if (hoveredNodeId) {
      if (type === 'node') return elem.id === hoveredNodeId;
      if (type === 'link') return elem.source === hoveredNodeId || elem.target === hoveredNodeId;
    }
    return true;
  };

  const handleMouseMove = (e, tooltipData) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltip({ ...tooltipData, x, y });
  };

  const handleMouseLeave = () => {
    setHoveredNodeId(null);
    setHoveredLinkId(null);
    setTooltip(null);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-x-auto custom-scrollbar select-none", className)}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ minWidth: layout.width, height: layout.height }} className="relative">
        <svg
          width={layout.width}
          height={layout.height}
          className="overflow-visible block"
        >
          {/* DEFINIZIONE GRADIENTI SVG */}
          <defs>
            {layout.gradients.map(g => (
              <linearGradient key={g.id} id={g.id} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={g.fromColor} stopOpacity={0.65} />
                <stop offset="100%" stopColor={g.toColor} stopOpacity={0.65} />
              </linearGradient>
            ))}
          </defs>

          {/* NASTRI DI FLUSSO (LINKS) */}
          <g className="sankey-links">
            {layout.links.map(link => {
              const active = isElementHighlighted('link', link);
              const isHovered = hoveredLinkId === link.id;

              return (
                <path
                  key={link.id}
                  d={link.pathData}
                  fill={`url(#${link.gradId})`}
                  className={cn(
                    "transition-all duration-200 cursor-pointer",
                    active ? "opacity-75" : "opacity-15",
                    isHovered && "opacity-95 filter drop-shadow-md brightness-110"
                  )}
                  onMouseEnter={() => setHoveredLinkId(link.id)}
                  onMouseMove={(e) => handleMouseMove(e, {
                    type: 'link',
                    title: `${link.sourceNode.label} → ${link.targetNode.label}`,
                    value: link.value,
                    subtext: link.subtext,
                    sourceTotal: link.sourceNode.value,
                    percentOfSource: link.sourceNode.value > 0 ? (link.value / link.sourceNode.value) * 100 : 0,
                    percentOfTotal: link.sourceNode.totalValue > 0 ? (link.value / link.sourceNode.totalValue) * 100 : 0
                  })}
                  onMouseLeave={() => {
                    setHoveredLinkId(null);
                    setTooltip(null);
                  }}
                  onClick={() => onLinkClick && onLinkClick(link)}
                />
              );
            })}
          </g>

          {/* NODI E LABELS */}
          <g className="sankey-nodes">
            {layout.nodes.map(node => {
              const active = isElementHighlighted('node', node);
              const isHovered = hoveredNodeId === node.id;
              const isFirstCol = node.column === 0;
              const isLastCol = node.column === Math.max(...layout.nodes.map(n => n.column));

              return (
                <g key={node.id} className="cursor-pointer group">
                  {/* Rettangolo nodo */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    rx={4}
                    fill={node.color || '#0ea5e9'}
                    className={cn(
                      "transition-all duration-200 stroke-1 stroke-white/40 dark:stroke-slate-900/60",
                      active ? "opacity-100" : "opacity-25",
                      isHovered && "filter brightness-125 stroke-2 stroke-white dark:stroke-slate-100 drop-shadow-lg"
                    )}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseMove={(e) => handleMouseMove(e, {
                      type: 'node',
                      title: node.label,
                      value: node.value,
                      subtext: node.subtext,
                      percentOfTotal: node.totalValue > 0 ? (node.value / node.totalValue) * 100 : 0
                    })}
                    onMouseLeave={() => {
                      setHoveredNodeId(null);
                      setTooltip(null);
                    }}
                    onClick={() => onNodeClick && onNodeClick(node)}
                  />

                  {/* Etichetta testuale */}
                  <text
                    x={isFirstCol ? node.x - 10 : isLastCol ? node.x + node.width + 10 : node.x + node.width + 8}
                    y={node.y + Math.min(14, node.height / 2 + 4)}
                    textAnchor={isFirstCol ? 'end' : 'start'}
                    className={cn(
                      "text-xs font-bold fill-slate-800 dark:fill-slate-200 pointer-events-none transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-40",
                      isHovered && "fill-sky-600 dark:fill-sky-400 font-extrabold"
                    )}
                  >
                    {node.label}
                  </text>

                  {/* Valore economico o quantità */}
                  <text
                    x={isFirstCol ? node.x - 10 : isLastCol ? node.x + node.width + 10 : node.x + node.width + 8}
                    y={node.y + Math.min(26, node.height / 2 + 16)}
                    textAnchor={isFirstCol ? 'end' : 'start'}
                    className={cn(
                      "text-xs font-mono font-bold fill-slate-500 dark:fill-slate-400 pointer-events-none transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-30"
                    )}
                  >
                    {formatValue(node.value)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* TOOLTIP INTERATTIVO AD ALTA DEFINIZIONE */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none transition-all duration-75"
            style={{
              left: `${Math.min(layout.width - 240, Math.max(10, tooltip.x + 12))}px`,
              top: `${Math.min(layout.height - 110, Math.max(10, tooltip.y - 45))}px`
            }}
          >
            <div className="glass-panel p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col gap-1 min-w-[200px]">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="text-xs font-black tracking-wide text-slate-900 dark:text-white truncate">
                  {tooltip.title}
                </span>
                {tooltip.percentOfTotal !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs font-mono font-bold text-sky-600 dark:text-sky-400 shrink-0">
                    {formatItalianNumber(tooltip.percentOfTotal, 1)}%
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Valore flusso:
                </span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                  {formatValue(tooltip.value)}
                </span>
              </div>

              {tooltip.percentOfSource !== undefined && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Quota su origine:</span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                    {formatItalianNumber(tooltip.percentOfSource, 1)}%
                  </span>
                </div>
              )}

              {tooltip.subtext && (
                <div className="text-xs text-slate-400 mt-0.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  {tooltip.subtext}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
