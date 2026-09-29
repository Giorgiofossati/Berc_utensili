import React, { useMemo, useState } from 'react';
import { 
  DollarSign, ArrowUpRight, TrendingUp, Layers, Filter, 
  Search, RefreshCw, BarChart2, PieChart, ShieldAlert
} from 'lucide-react';
import { PageTemplate, PageHeader, PageToolbar, PageContent, ResetFiltersButton } from '@/components/layout/PageTemplate';
import { StatTile, CollapsibleStatGrid } from '@/components/ui/stat-tile';
import { IconButton } from '@/components/ui/icon-button';
import { useInventoryStore } from '../../store/useInventoryStore';
import { buildDesc, ToolIcon } from '../../lib/toolUtils';
import { cn } from '@/lib/utils';

export default function CostAnalysisView({ setView }) {
  const tools = useInventoryStore(state => state.tools);
  const fetchTools = useInventoryStore(state => state.fetchTools);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TUTTE');

  // Calcolo costi e valori
  const { toolsWithCosts, categories, totalValue, avgCost } = useMemo(() => {
    const catSet = new Set();

    const list = tools.map(t => {
      const q = Number(t['Quantità']) || 0;
      const unitPrice = Number(t.prezzo_acquisto) || (
        t.Tipologia?.toLowerCase().includes('fresa') ? 45.00 :
        t.Tipologia?.toLowerCase().includes('punta') ? 28.50 :
        t.Tipologia?.toLowerCase().includes('maschio') ? 34.00 : 18.00
      );
      const rowVal = q * unitPrice;

      if (t.Tipologia) catSet.add(t.Tipologia);

      return {
        ...t,
        unitPrice,
        rowValue: rowVal
      };
    });

    const calculatedTotal = list.reduce((sum, item) => sum + item.rowValue, 0);
    const avg = list.length > 0 ? calculatedTotal / list.length : 0;

    return {
      toolsWithCosts: list,
      categories: Array.from(catSet).sort(),
      totalValue: calculatedTotal,
      avgCost: avg
    };
  }, [tools]);

  const filteredTools = useMemo(() => {
    return toolsWithCosts.filter(t => {
      const matchCat = categoryFilter === 'TUTTE' || t.Tipologia === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQ = !q || 
        t.Tipologia?.toLowerCase().includes(q) ||
        t.Forma?.toLowerCase().includes(q) ||
        t.Codice?.toLowerCase().includes(q) ||
        String(t.Diametro || '').toLowerCase().includes(q);

      return matchCat && matchQ;
    }).sort((a, b) => b.rowValue - a.rowValue);
  }, [toolsWithCosts, categoryFilter, searchQuery]);

  return (
    <PageTemplate>
      <PageHeader
        title="Analisi Economica & Costi Utensili"
        breadcrumb="Manager"
        showBack={true}
        onBack={() => setView('manager_dashboard')}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          label: 'Cerca utensili per analisi costi',
          placeholder: 'Cerca tipologia, codice, diametro…'
        }}
        action={
          <div className="flex items-center gap-2">
            <IconButton
              icon={<RefreshCw size={15} />}
              label="Ricarica"
              onClick={fetchTools}
              variant="glass"
            />
          </div>
        }
      />

      {/* KPI TILES COSTI */}
      <div className="px-3 sm:px-4 md:px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shrink-0">
        <CollapsibleStatGrid
          title="Riepilogo Costi"
          count={3}
          gridClassName="grid-cols-1 sm:grid-cols-3"
        >
          <StatTile
            label="Valore Totale Scorte"
            value={`€ ${totalValue.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`}
            subtext="Valore stimato complessivo"
            tone="emerald"
            icon={<DollarSign size={16} />}
          />
          <StatTile
            label="Costo Medio Referenza"
            value={`€ ${(avgCost).toFixed(2)}`}
            subtext="Valore medio per articolo SKU"
            tone="blue"
            icon={<TrendingUp size={16} />}
          />
          <StatTile
            label="Articoli a Valore Alto (>€200)"
            value={toolsWithCosts.filter(t => t.rowValue > 200).length}
            subtext="Asset ad alto impatto"
            tone="orange"
            icon={<Layers size={16} />}
          />
        </CollapsibleStatGrid>
      </div>

      <PageToolbar>
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('TUTTE')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              categoryFilter === 'TUTTE'
                ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30 shadow-xs"
                : "glass-button text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Tutte ({tools.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                categoryFilter === cat
                  ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30 shadow-xs"
                  : "glass-button text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {(searchQuery || categoryFilter !== 'TUTTE') && (
          <ResetFiltersButton
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('TUTTE');
            }}
            label="Resetta filtri"
          />
        )}
      </PageToolbar>

      <PageContent className="flex-1 min-h-0 flex flex-col p-2 sm:p-4 md:p-6 pb-24 overflow-y-auto">
        <div className="glass-panel rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500">
              Dettaglio Valore per Articolo ({filteredTools.length})
            </span>
            <span className="text-xs text-slate-400">
              Ordinato per valore complessivo decrescente
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto">
            {filteredTools.slice(0, 100).map((tool, idx) => {
              const qty = Number(tool['Quantità']) || 0;
              return (
                <div
                  key={tool.id || idx}
                  className="p-3 sm:p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <ToolIcon tool={tool} size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {buildDesc(tool)}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        {tool.Codice && (
                          <span className="app-caption font-mono font-bold text-slate-600 dark:text-slate-400">
                            {tool.Codice}
                          </span>
                        )}
                        <span>•</span>
                        <span>Prezzo unitario: € {tool.unitPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 text-right">
                    <div>
                      <span className="app-overline block text-slate-400">Giacenza</span>
                      <span className={`text-xs font-extrabold ${qty > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-500'}`}>
                        {qty} pz
                      </span>
                    </div>

                    <div className="min-w-[90px]">
                      <span className="app-overline block text-slate-400">Valore Totale</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        € {tool.rowValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PageContent>
    </PageTemplate>
  );
}
