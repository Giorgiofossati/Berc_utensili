import React, { useMemo, useState, useEffect } from 'react';
import { 
  GitFork, Layers, ShieldAlert, Tag,
  Maximize2, Minimize2, Info, X
} from 'lucide-react';
import SankeyChart from '@/components/charts/SankeyChart';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { cn, formatItalianNumber, formatItalianCurrency } from '@/lib/utils';

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
  'lama': '#0284c7',          // deep sky
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

const GROUP_COLOR = '#64748b'; // slate: nodo aggregato "Altre ..."

// Oltre questa soglia i nodi diventano troppo sottili per essere letti:
// le voci minori confluiscono in un nodo aggregato (dettaglio nel tooltip).
const GROUP_MIN_SHARE = 0.025;
const GROUP_MAX_ITEMS = 7;

// Importi in tooltip e footer con decimali; etichette del grafico arrotondate all'euro
const formatCurrency = (val) => formatItalianCurrency(val, 2);
const formatCurrencyRounded = (val) => formatItalianCurrency(val, 0);

/**
 * Divide voci ordinate per valore decrescente in voci visibili + coda aggregata.
 * Restituisce { kept, rest } dove rest è [] se non serve aggregare.
 */
function splitTail(sortedItems, totalVal) {
  if (sortedItems.length <= 2) return { kept: sortedItems, rest: [] };
  const kept = [];
  const rest = [];
  sortedItems.forEach((item) => {
    const share = totalVal > 0 ? item.val / totalVal : 0;
    if (kept.length < GROUP_MAX_ITEMS && share >= GROUP_MIN_SHARE) kept.push(item);
    else rest.push(item);
  });
  // Aggregare una sola voce non ha senso: la si mostra così com'è
  if (rest.length === 1) return { kept: [...kept, rest[0]], rest: [] };
  return { kept, rest };
}

function describeGroup(items, nameKey, noun) {
  const names = items.map(i => i[nameKey]);
  const shown = names.slice(0, 4).join(', ');
  return `${items.length} ${noun}: ${shown}${names.length > 4 ? ', …' : ''}`;
}

export default function CostSankeyCard({
  tools = [],
  onSelectCategory,
  selectedCategory,
  className
}) {
  const [splitMode, setSplitMode] = useState('forma'); // 'forma' | 'stato' | 'fascia'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowHeight, setWindowHeight] = useState(() => typeof window !== 'undefined' ? window.innerHeight : 800);

  // Gestione ridimensionamento e tasto Esc per uscire da schermo intero
  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

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
          destLabel = 'Base (< 30,00 €)';
          destKey = 'economico';
          destColor = FASCIA_COLORS.economico;
        } else if (unitPrice <= 70) {
          destLabel = 'Media (30,00 - 70,00 €)';
          destKey = 'medio';
          destColor = FASCIA_COLORS.medio;
        } else {
          destLabel = 'Premium (> 70,00 €)';
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
      label: 'Asset magazzino',
      column: 0,
      value: totalVal,
      color: '#0ea5e9',
      subtext: `${formatItalianNumber(totalPieces)} pz totali a magazzino`
    });

    // Colonna 1: Macro tipologie (le minori confluiscono in "Altre tipologie")
    const sortedTipologie = Array.from(tipologiaMap.entries())
      .map(([tipo, data]) => ({ tipo, ...data }))
      .filter(t => t.val > 0)
      .sort((a, b) => b.val - a.val);

    const tipoSplit = splitTail(sortedTipologie, totalVal);
    const tipoNodeId = new Map(); // tipo -> id nodo (proprio o aggregato)
    const TIPO_GROUP_ID = 'tipo__group';

    tipoSplit.kept.forEach(({ tipo, val, pieces, count }) => {
      const tipoLower = tipo.toLowerCase();
      let color = TIPOLOGIA_COLORS.altro;
      for (const [key, c] of Object.entries(TIPOLOGIA_COLORS)) {
        if (tipoLower.includes(key)) {
          color = c;
          break;
        }
      }

      const id = `tipo_${tipo}`;
      tipoNodeId.set(tipo, id);
      nodes.push({
        id,
        label: tipo,
        column: 1,
        value: val,
        color,
        subtext: `${formatItalianNumber(pieces)} pz • ${formatItalianNumber(count)} referenze`
      });
    });

    if (tipoSplit.rest.length > 0) {
      tipoSplit.rest.forEach(({ tipo }) => tipoNodeId.set(tipo, TIPO_GROUP_ID));
      nodes.push({
        id: TIPO_GROUP_ID,
        label: `Altre tipologie (${tipoSplit.rest.length})`,
        column: 1,
        value: tipoSplit.rest.reduce((sum, t) => sum + t.val, 0),
        color: GROUP_COLOR,
        isGroup: true,
        subtext: describeGroup(tipoSplit.rest, 'tipo', 'tipologie')
      });
    }

    // Colonna 2: Destinazioni (Forma / Stato / Fascia)
    const sortedDestinations = Array.from(destinationMap.entries())
      .map(([label, data]) => ({ label, ...data }))
      .filter(d => d.val > 0)
      .sort((a, b) => b.val - a.val);

    const destSplit = splitMode === 'forma'
      ? splitTail(sortedDestinations, totalVal)
      : { kept: sortedDestinations, rest: [] };
    const destNodeId = new Map();
    const DEST_GROUP_ID = 'dest__group';

    destSplit.kept.forEach(({ label, val, pieces, color }, idx) => {
      const id = `dest_${label}`;
      destNodeId.set(label, id);
      nodes.push({
        id,
        label,
        column: 2,
        value: val,
        color: splitMode === 'forma' ? FORMA_PALETTE[idx % FORMA_PALETTE.length] : color,
        subtext: `${formatItalianNumber(pieces)} pezzi fisici`
      });
    });

    if (destSplit.rest.length > 0) {
      destSplit.rest.forEach(({ label }) => destNodeId.set(label, DEST_GROUP_ID));
      nodes.push({
        id: DEST_GROUP_ID,
        label: `Altre forme (${destSplit.rest.length})`,
        column: 2,
        value: destSplit.rest.reduce((sum, d) => sum + d.val, 0),
        color: GROUP_COLOR,
        isGroup: true,
        subtext: describeGroup(destSplit.rest, 'label', 'forme')
      });
    }

    // 3. Costruzione dei link (accorpati sui nodi aggregati)
    const links = [];
    const nodeLabel = new Map(nodes.map(n => [n.id, n.label]));
    const nodeValue = new Map(nodes.map(n => [n.id, n.value]));

    // Links Col 0 -> Col 1 (Radice -> Tipologie)
    const rootLinks = new Map();
    sortedTipologie.forEach(({ tipo, val, pieces }) => {
      const target = tipoNodeId.get(tipo);
      const prev = rootLinks.get(target) || { val: 0, pieces: 0 };
      rootLinks.set(target, { val: prev.val + val, pieces: prev.pieces + pieces });
    });
    rootLinks.forEach(({ val, pieces }, target) => {
      const pctOfTotal = totalVal > 0 ? (val / totalVal) * 100 : 0;
      links.push({
        source: rootNodeId,
        target,
        value: val,
        subtext: `${formatItalianNumber(pieces)} pz • ${formatItalianNumber(pctOfTotal, 1)}% dell'asset`
      });
    });

    // Links Col 1 -> Col 2 (Tipologia -> Destinazione)
    const midLinks = new Map();
    linksMap.forEach(({ val, pieces }, linkKey) => {
      if (val <= 0) return;
      const [tipo, destLabel] = linkKey.split('___');
      const source = tipoNodeId.get(tipo);
      const target = destNodeId.get(destLabel);
      if (!source || !target) return;
      const key = `${source}___${target}`;
      const prev = midLinks.get(key) || { source, target, val: 0, pieces: 0 };
      midLinks.set(key, { ...prev, val: prev.val + val, pieces: prev.pieces + pieces });
    });
    midLinks.forEach(({ source, target, val, pieces }) => {
      const pctOfSource = (val / (nodeValue.get(source) || 1)) * 100;
      links.push({
        source,
        target,
        value: val,
        subtext: `${formatItalianNumber(pieces)} pz • ${formatItalianNumber(pctOfSource, 1)}% di ${nodeLabel.get(source)}`
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
    if (node.column === 1 && !node.isGroup && onSelectCategory) {
      const catName = node.label;
      onSelectCategory(catName);
    }
  };

  const splitOptions = [
    { value: 'forma', label: 'Geometria / Forma', icon: <Tag size={14} /> },
    { value: 'stato', label: 'Stato Giacenze', icon: <ShieldAlert size={14} /> },
    { value: 'fascia', label: 'Fascia di Prezzo', icon: <Layers size={14} /> }
  ];

  // Calcolo altezza dinamica per la massima visibilità (standard vs fullscreen)
  const chartHeight = isFullscreen ? Math.max(520, windowHeight - 220) : 480;

  const cardContent = (
    <div className={cn(
      "flex flex-col gap-4",
      isFullscreen 
        ? "fixed inset-0 z-50 bg-slate-50/98 dark:bg-slate-950/98 backdrop-blur-2xl p-4 sm:p-6 md:p-8 overflow-hidden h-screen w-screen justify-between"
        : cn("glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm", className)
    )}>
      {/* HEADER CARD CON CONTROLLI E PULSANTE SCHERMO INTERO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <GitFork size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="app-h3 text-slate-900 dark:text-slate-100 truncate">
                Flusso del valore per tipologia utensile
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs font-bold text-sky-600 dark:text-sky-400">
                Sankey
              </span>
              {selectedCategory && selectedCategory !== 'TUTTE' && (
                <span className="px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/30 text-xs font-bold">
                  Filtro attivo: {selectedCategory}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Ripartizione dal capitale totale alle famiglie utensili e alle relative specifiche
            </p>
          </div>
        </div>

        {/* CONTROLLI SULLA DESTRA (SEGMENTED + FULLSCREEN BUTTON) */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-between sm:justify-end">
          <SegmentedControl
            value={splitMode}
            onValueChange={setSplitMode}
            options={splitOptions}
            ariaLabel="Raggruppamento Sankey"
            className="text-xs"
          />

          {isFullscreen ? (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-3.5 py-2 rounded-xl bg-accent-blue text-slate-950 text-xs font-black tracking-wide hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
              title="Esci da tutto schermo (Esc)"
            >
              <Minimize2 size={15} />
              <span>Esci da tutto schermo (Esc)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0"
              title="Visualizza diagramma a schermo intero"
            >
              <Maximize2 size={15} className="text-sky-500" />
              <span>Schermo intero</span>
            </button>
          )}
        </div>
      </div>

      {/* DIAGRAMMA SANKEY (SPAZIO MASSIMIZZATO) */}
      <div className={cn("w-full relative flex flex-col justify-center", isFullscreen ? "flex-1 min-h-0" : "")}>
        <SankeyChart
          data={sankeyData}
          height={chartHeight}
          formatValue={formatCurrency}
          formatLabelValue={formatCurrencyRounded}
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* FOOTER STATISTICHE E GUIDA INTERATTIVA */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 flex-wrap">
          {summaryStats.topCategory && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Prima categoria:</span>
              <span className="font-extrabold text-sky-600 dark:text-sky-400">
                {summaryStats.topCategory.tipo}{' '}
                <span className="font-mono tabular-nums">({formatCurrency(summaryStats.topCategory.val)})</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
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
          <Info size={14} className="text-accent-blue shrink-0" />
          <span>Passa sopra a nodi e flussi per dettagli o clicca su una tipologia per filtrare.</span>
        </div>
      </div>
    </div>
  );

  return cardContent;
}
