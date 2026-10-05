import React, { useMemo, useState, useRef, useEffect } from 'react';
import { cn, formatItalianNumber } from '@/lib/utils';

// Geometria etichette: due righe (nome + valore) se il nodo è alto abbastanza,
// altrimenti una riga sola; se collide con l'etichetta precedente viene nascosta
// (i dati restano consultabili nel tooltip al passaggio del mouse).
const LABEL_OFFSET = 10;
const LABEL_LINE_H = 14;
const LABEL_TWO_LINES_MIN_NODE_H = 30;
const LABEL_GAP = 3;
// Sotto questa larghezza (mobile) il grafico entra nello schermo senza scroll orizzontale:
// si toglie la colonna radice (un solo nodo, nessuna informazione in più) e le etichette
// vanno all'interno dell'area del grafico invece che nei margini laterali.
const COMPACT_BREAKPOINT = 640;

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
  formatLabelValue,
  onNodeClick,
  onLinkClick,
  className
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [hoveredLinkId, setHoveredLinkId] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  // Al tocco il primo tap su un nodo mostra il dettaglio, il secondo esegue l'azione
  const [armedNodeId, setArmedNodeId] = useState(null);

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

  const labelValue = formatLabelValue || formatValue;
  const compact = containerWidth < COMPACT_BREAKPOINT;
  const nodeW = compact ? Math.min(nodeWidth, 14) : nodeWidth;

  const chartData = useMemo(() => {
    if (!compact || !data?.nodes?.length) return data;
    const cols = [...new Set(data.nodes.map(n => Number(n.column) || 0))].sort((a, b) => a - b);
    if (cols.length <= 2) return data;
    const dropped = new Set(data.nodes.filter(n => (Number(n.column) || 0) === cols[0]).map(n => n.id));
    return {
      nodes: data.nodes.filter(n => !dropped.has(n.id)),
      links: (data.links || []).filter(l => !dropped.has(l.source) && !dropped.has(l.target))
    };
  }, [data, compact]);

  // Margini laterali calcolati sulla label più lunga della prima/ultima colonna
  // (stima ~7px per carattere a 12px), così i testi esterni non vengono mai tagliati.
  const margin = useMemo(() => {
    if (compact) return { top: 8, right: 0, bottom: 8, left: 0 };
    const nodes = chartData?.nodes || [];
    const cols = nodes.map(n => Number(n.column) || 0);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const estimate = (col) => {
      const longest = nodes
        .filter(n => (Number(n.column) || 0) === col)
        .reduce((max, n) => Math.max(max, String(n.label).length, `${labelValue(n.value)} · 100,0%`.length), 0);
      return Math.min(220, Math.max(110, longest * 7 + LABEL_OFFSET + 8));
    };
    return {
      top: 12,
      right: nodes.length ? estimate(maxCol) : 110,
      bottom: 12,
      left: nodes.length ? estimate(minCol) : 110
    };
  }, [chartData, labelValue, compact]);

  // Calcolo del layout del diagramma Sankey
  const layout = useMemo(() => {
    const data = chartData;
    const nodeWidth = nodeW;
    if (!data || !data.nodes || data.nodes.length === 0) {
      return { nodes: [], links: [], gradients: [], width: containerWidth, height };
    }

    const effectiveWidth = compact ? containerWidth : Math.max(containerWidth, 680);
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

    // 6. Posizionamento etichette con prevenzione delle sovrapposizioni per colonna
    const firstCol = columns[0];
    const lastCol = columns[columns.length - 1];
    columns.forEach(col => {
      const colNodes = Array.from(positionedNodesMap.values())
        .filter(n => (Number(n.column) || 0) === col)
        .sort((a, b) => a.y - b.y);
      let lastBottom = -Infinity;
      colNodes.forEach(n => {
        const isFirst = col === firstCol;
        const isLast = col === lastCol;
        const cy = n.y + n.height / 2;
        const mode = n.height >= LABEL_TWO_LINES_MIN_NODE_H ? 'full' : 'compact';
        const blockH = mode === 'full' ? LABEL_LINE_H * 2 : LABEL_LINE_H;
        const top = cy - blockH / 2;
        const visible = top >= lastBottom + LABEL_GAP;
        if (visible) lastBottom = top + blockH;
        // Desktop: prima colonna a sinistra del nodo, le altre a destra (nei margini).
        // Compatto: tutte dentro l'area, l'ultima colonna a sinistra del proprio nodo.
        const labelLeft = compact ? isLast : isFirst;
        n.label_ = {
          x: labelLeft ? n.x - LABEL_OFFSET + (compact ? 4 : 0) : n.x + nodeWidth + LABEL_OFFSET - (compact ? 4 : 0),
          anchor: labelLeft ? 'end' : 'start',
          cy,
          mode: visible ? mode : 'hidden'
        };
      });
    });

    return {
      nodes: Array.from(positionedNodesMap.values()),
      links: computedLinks,
      gradients,
      width: effectiveWidth,
      height
    };
  }, [chartData, compact, containerWidth, height, margin, nodeW, nodeGap, minNodeHeight]);

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
      className={cn("relative w-full select-none", compact ? "overflow-hidden" : "overflow-x-auto custom-scrollbar", className)}
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
                <stop offset="0%" stopColor={g.fromColor} stopOpacity={0.55} />
                <stop offset="100%" stopColor={g.toColor} stopOpacity={0.55} />
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
                    active ? "opacity-70" : "opacity-10",
                    isHovered && "opacity-100 brightness-110"
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
                    onClick={(e) => {
                      if (!onNodeClick) return;
                      if (e.nativeEvent?.pointerType === 'touch' && armedNodeId !== node.id) {
                        setArmedNodeId(node.id);
                        return;
                      }
                      setArmedNodeId(null);
                      onNodeClick(node);
                    }}
                  />

                  {/* Etichetta: nome + valore · quota, con alone per restare leggibile sopra i nastri */}
                  {node.label_.mode !== 'hidden' && (
                    <text
                      x={node.label_.x}
                      y={node.label_.cy}
                      textAnchor={node.label_.anchor}
                      dominantBaseline="central"
                      paintOrder="stroke"
                      strokeWidth={4}
                      strokeLinejoin="round"
                      className={cn(
                        "text-xs pointer-events-none transition-opacity duration-200 stroke-white dark:stroke-slate-900",
                        active ? "opacity-100" : "opacity-30"
                      )}
                    >
                      <tspan
                        x={node.label_.x}
                        dy={node.label_.mode === 'full' ? -LABEL_LINE_H / 2 : 0}
                        className={cn(
                          "font-bold fill-slate-900 dark:fill-slate-100",
                          isHovered && "fill-sky-600 dark:fill-sky-400"
                        )}
                      >
                        {node.label}
                      </tspan>
                      {/* In compatto, su una riga sola, solo il nome: il valore è nel tooltip */}
                      {(node.label_.mode === 'full' || !compact) && (
                        <tspan
                          x={node.label_.mode === 'full' ? node.label_.x : undefined}
                          dx={node.label_.mode === 'full' ? undefined : 6}
                          dy={node.label_.mode === 'full' ? LABEL_LINE_H : 0}
                          className="font-mono font-semibold tabular-nums fill-slate-500 dark:fill-slate-400"
                        >
                          {labelValue(node.value)}
                          {!compact && node.label_.mode === 'full' && node.column !== 0 && node.totalValue > 0 && (
                            ` · ${formatItalianNumber((node.value / node.totalValue) * 100, 1)}%`
                          )}
                        </tspan>
                      )}
                    </text>
                  )}
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
              left: `${Math.max(0, Math.min(layout.width - 220, tooltip.x + 12))}px`,
              top: `${Math.min(layout.height - 110, Math.max(10, tooltip.y - 45))}px`
            }}
          >
            <div className="glass-panel p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col gap-1 w-[220px] max-w-full">
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
