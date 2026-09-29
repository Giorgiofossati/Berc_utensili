import React, { useMemo, useState } from 'react';
import { 
  GitFork, Layers, ShieldAlert, Tag, Filter,
  ArrowRight, Info, CheckCircle2, AlertTriangle, AlertCircle
} from 'lucide-react';
import SankeyChart from '@/components/charts/SankeyChart';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { cn } from '@/lib/utils';

// Palette semantica ufficiale Bercella (DIVIETO ASSOLUTO DI INDIGO)
const TIPOLOGIA_COLORS = {
  'fresa': '#0ea5e9',         // sky
  'punta': '#06b6d4',         // cyan
  'maschio': '#f97316',       // orange/amber
  'pettine': '#10b981',       // emerald
  'spaccamaschio': '#ec4899', // pink
  'inserto': '#8b5cf6',       // purple
  'svasatore': '#eab308',     // yellow
  'alesatore': '#14b8a6',     // teal
  'lama': '#6366f1',          // replaced with slate/teal
  'altro': '#64748b'          // slate
};

const STATO_COLORS = {
  'regolare': '#10b981', // emerald
  'critico': '#f97316',  // orange
  'esaurito': '#f43f5e'  // rose
};

const FASCIA_COLORS = {
  'economico': '#0ea5e9', // sky
  'medio': '#8b5cf6',     // purple
  'alto': '#f97316'       // orange
};

const FORMA_PALETTE = [
  '#0ea5e9', '#06b6d4', '#10b981', '#f97316', 
  '#ec4899', '#8b5cf6', '#14b8a6', '#eab308', '#64748b'
];

export default function CostSankeyCard({
  tools = [],
  onSelectCategory,
  selectedCategory,
  className
}) {
  const [splitMode, setSplitMode] = useState('forma'); // 'forma' | 'stato' | 'fascia'

  // Formattatore valuta
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true
    }).format(val);
  };

  // Costruzione della struttura Dati per il diagramma Sankey
  const { sankeyData, summaryStats } = useMemo(() => {
    if (!tools || tools.length === 0) {
      return {
        sankeyData: { nodes: [], links: [] },
        summaryStats: { totalVal: 0, topCategory: null, riskVal: 0 }
      };
    }

    let totalVal = 0;
    let totalPieces = 0;
    let riskVal = 0;

    const tipologiaMap = new Map();
    const destinationMap = new Map();
    const linksMap = new Map(); // key: `${tipoId}___${destId}`

    // 1. Processa gli utensili e calcola il valore di ciascuno
    tools.forEach(t => {
      const q = Number(t['Quantità']) || 0;
      const unitPrice = Number(t.Prezzo ?? t.prezzo_acquisto) || (
        t.Tipologia?.toLowerCase().includes('fresa') ? 45.00 :
        t.Tipologia?.toLowerCase().includes('punta') ? 28.50 :
        t.Tipologia?.toLowerCase().includes('maschio') ? 34.00 : 18.00
      );
      const rowVal = q * unitPrice;
      totalVal += rowVal;
      totalPieces += q;

      if (q <= 2) {
        riskVal += rowVal;
      }

      const tipo = t.Tipologia ? t.Tipologia.trim() : 'Altro';
      const prevTipo = tipologiaMap.get(tipo) || { val: 0, pieces: 0, count: 0 };
      tipologiaMap.set(tipo, {
        val: prevTipo.val + rowVal,
        pieces: prevTipo.pieces + q,
        count: prevTipo.count + 1
      });

      // Calcola destinazione in base alla modalità scelta
      let destLabel = 'Standard';
      let destKey = 'standard';
      let destColor = '#64748b';

      if (splitMode === 'forma') {
        destLabel = t.Forma && t.Forma.trim() !== '' ? t.Forma.trim() : 'Non specificata';
        destKey = destLabel.toLowerCase();
      } else if (splitMode === 'stato') {
        if (q === 0) {
          destLabel = 'Esaurito (0 pz)';
          destKey = 'esaurito';
          destColor = STATO_COLORS.esaurito;
        } else if (q <= 2) {
          destLabel = 'Sottoscorta (1-2 pz)';
          destKey = 'critico';
          destColor = STATO_COLORS.critico;
        } else {
          destLabel = 'Disponibile (>2 pz)';
          destKey = 'regolare';
          destColor = STATO_COLORS.regolare;
        }
      } else if (splitMode === 'fascia') {
        if (unitPrice < 30) {
          destLabel = 'Base (< €30)';
          destKey = 'economico';
          destColor = FASCIA_COLORS.economico;
        } else if (unitPrice <= 70) {
          destLabel = 'Media (€30 - €70)';
          destKey = 'medio';
          destColor = FASCIA_COLORS.medio;
        } else {
          destLabel = 'Premium (> €70)';
          destKey = 'alto';
          destColor = FASCIA_COLORS.alto;
        }
      }

      const prevDest = destinationMap.get(destLabel) || { val: 0, pieces: 0, key: destKey, color: destColor };
      destinationMap.set(destLabel, {
        ...prevDest,
        val: prevDest.val + rowVal,
        pieces: prevDest.pieces + q
      });

      // Accumula link Tipologia -> Destinazione
      const linkKey = `${tipo}___${destLabel}`;
      const prevLinkVal = linksMap.get(linkKey) || { val: 0, pieces: 0 };
      linksMap.set(linkKey, {
        val: prevLinkVal.val + rowVal,
        pieces: prevLinkVal.pieces + q
      });
    });

    // 2. Costruzione dei nodi
    const nodes = [];

    // Colonna 0: Nodo radice (Totale Magazzino)
    const rootNodeId = 'root_total';
    nodes.push({
      id: rootNodeId,
      label: 'Asset Magazzino',
      column: 0,
      value: totalVal,
      color: '#0ea5e9',
      subtext: `${totalPieces} pz totali a magazzino`
    });

    // Colonna 1: Macro Tipologie
    const sortedTipologie = Array.from(tipologiaMap.entries())
      .map(([tipo, data]) => ({ tipo, ...data }))
      .sort((a, b) => b.val - a.val);

    sortedTipologie.forEach(({ tipo, val, pieces, count }) => {
      const tipoLower = tipo.toLowerCase();
      let color = TIPOLOGIA_COLORS.altro;
      for (const [key, c] of Object.entries(TIPOLOGIA_COLORS)) {
        if (tipoLower.includes(key)) {
          color = c;
          break;
        }
      }

      nodes.push({
        id: `tipo_${tipo}`,
        label: tipo,
        column: 1,
        value: val,
        color,
        subtext: `${pieces} pezzi • ${count} referenze`
      });
    });

    // Colonna 2: Destinazioni (Forma / Stato / Fascia)
    const sortedDestinations = Array.from(destinationMap.entries())
      .map(([label, data]) => ({ label, ...data }))
      .sort((a, b) => b.val - a.val);

    sortedDestinations.forEach(({ label, val, pieces, color }, idx) => {
      let nodeColor = color;
      if (splitMode === 'forma') {
        nodeColor = FORMA_PALETTE[idx % FORMA_PALETTE.length];
      }

      nodes.push({
        id: `dest_${label}`,
        label,
        column: 2,
        value: val,
        color: nodeColor,
        subtext: `${pieces} pezzi fisici`
      });
    });

    // 3. Costruzione dei link
    const links = [];

    // Links Col 0 -> Col 1 (Radice -> Tipologie)
    sortedTipologie.forEach(({ tipo, val, pieces }) => {
      links.push({
        source: rootNodeId,
        target: `tipo_${tipo}`,
        value: val,
        subtext: `${pieces} pz • ${totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : 0}% dell'asset`
      });
    });

    // Links Col 1 -> Col 2 (Tipologia -> Destinazione)
    linksMap.forEach(({ val, pieces }, linkKey) => {
      if (val <= 0) return;
      const [tipo, destLabel] = linkKey.split('___');
      const tipoVal = tipologiaMap.get(tipo)?.val || 1;

      links.push({
        source: `tipo_${tipo}`,
        target: `dest_${destLabel}`,
        value: val,
        subtext: `${pieces} pz • ${((val / tipoVal) * 100).toFixed(1)}% di ${tipo}`
      });
    });

    const topCategory = sortedTipologie[0] || null;

    return {
      sankeyData: { nodes, links },
      summaryStats: {
        totalVal,
        topCategory,
        riskVal,
        categoriesCount: sortedTipologie.length
      }
    };
  }, [tools, splitMode]);

  const handleNodeClick = (node) => {
    if (node.column === 1 && onSelectCategory) {
      const catName = node.label;
      onSelectCategory(catName);
    }
  };

  const splitOptions = [
    { value: 'forma', label: 'Geometria / Forma', icon: <Tag size={14} /> },
    { value: 'stato', label: 'Stato Giacenze', icon: <ShieldAlert size={14} /> },
    { value: 'fascia', label: 'Fascia di Prezzo', icon: <Layers size={14} /> }
  ];

  return (
    <div className={cn("glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4", className)}>
      {/* HEADER CARD CON CONTROLLI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <GitFork size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="app-h3 text-slate-900 dark:text-slate-100">
                Flusso del valore per tipologia utensile
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                Sankey
              </span>
              {selectedCategory && selectedCategory !== 'TUTTE' && (
                <span className="px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/30 text-xs font-bold">
                  Filtro attivo: {selectedCategory}
                </span>
              )}
            </div>
            <p className="app-caption text-slate-400 mt-0.5">
              Ripartizione dal capitale totale alle famiglie utensili e alle relative specifiche
            </p>
          </div>
        </div>

        {/* CONTROLLO MODALITÀ SUDDIVISIONE */}
        <div className="flex items-center gap-2 shrink-0">
          <SegmentedControl
            value={splitMode}
            onValueChange={setSplitMode}
            options={splitOptions}
            ariaLabel="Raggruppamento Sankey"
            className="text-xs"
          />
        </div>
      </div>

      {/* DIAGRAMMA SANKEY */}
      <div className="w-full relative min-h-[380px] flex flex-col justify-center">
        <SankeyChart
          data={sankeyData}
          height={380}
          formatValue={formatCurrency}
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* FOOTER STATISTICHE E GUIDA INTERATTIVA */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
          {summaryStats.topCategory && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Prima categoria:</span>
              <span className="font-extrabold text-sky-600 dark:text-sky-400">
                {summaryStats.topCategory.tipo} ({formatCurrency(summaryStats.topCategory.val)})
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 hidden md:flex">
            <span className="font-bold text-slate-700 dark:text-slate-300">Capitale a rischio scorta:</span>
            <span className={cn(
              "font-mono font-extrabold",
              summaryStats.riskVal > 0 ? "text-rose-500" : "text-emerald-500"
            )}>
              {formatCurrency(summaryStats.riskVal)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Info size={14} className="text-accent-blue" />
          <span>Passa sopra a nodi e flussi per dettagli o clicca su una tipologia per filtrare.</span>
        </div>
      </div>
    </div>
  );
}
