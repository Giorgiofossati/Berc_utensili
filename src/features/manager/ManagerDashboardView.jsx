import React, { useMemo } from 'react';
import { 
  Euro, Package, AlertTriangle, ArrowUpRight, 
  BarChart3, Activity, Briefcase, 
  Cpu, Calendar, ShieldCheck, RefreshCw
} from 'lucide-react';
import { PageTemplate, PageHeader, PageToolbar, PageContent } from '@/components/layout/PageTemplate';
import { StatTile, CollapsibleStatGrid } from '@/components/ui/stat-tile';
import { IconButton } from '@/components/ui/icon-button';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useCommesseStore } from '../../store/useCommesseStore';
import { useMacchineStore } from '../../store/useMacchineStore';
import { formatItalianCurrency, formatItalianNumber } from '@/lib/utils';
import CostSankeyCard from './components/CostSankeyCard';

export default function ManagerDashboardView({ setView }) {
  const tools = useInventoryStore(state => state.tools);
  const fetchTools = useInventoryStore(state => state.fetchTools);
  const commesse = useCommesseStore(state => state.commesse);
  const macchine = useMacchineStore(state => state.macchine);

  // Calcoli KPI Economici e di Magazzino
  const kpi = useMemo(() => {
    let totalStockPieces = 0;
    let zeroStockCount = 0;
    let lowStockCount = 0;
    let estimatedTotalValue = 0;

    const categoryMap = new Map();

    tools.forEach(t => {
      const q = Number(t['Quantità']) || 0;
      totalStockPieces += q;

      // Stima costo: usa Prezzo / prezzo_acquisto se presente o valore medio stimato per tipologia
      const unitPrice = Number(t.Prezzo ?? t.prezzo_acquisto) || (
        t.Tipologia?.toLowerCase().includes('fresa') ? 45.00 :
        t.Tipologia?.toLowerCase().includes('punta') ? 28.50 :
        t.Tipologia?.toLowerCase().includes('maschio') ? 34.00 : 18.00
      );

      estimatedTotalValue += q * unitPrice;

      if (q === 0) zeroStockCount++;
      else if (q <= 2) lowStockCount++;

      const cat = t.Tipologia || 'Altro';
      const prevCat = categoryMap.get(cat) || { count: 0, pieces: 0, val: 0 };
      categoryMap.set(cat, {
        count: prevCat.count + 1,
        pieces: prevCat.pieces + q,
        val: prevCat.val + (q * unitPrice)
      });
    });

    const activeCommesseCount = commesse.filter(c => c.stato === 'Attiva').length;
    const activeMachinesCount = macchine.filter(m => m.is_active).length;

    // Ordinamento categorie per valore economico
    const topCategories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 6);

    return {
      totalStockPieces,
      totalToolsCount: tools.length,
      zeroStockCount,
      lowStockCount,
      estimatedTotalValue,
      activeCommesseCount,
      activeMachinesCount,
      topCategories
    };
  }, [tools, commesse, macchine]);

  // Formattazione valuta standard Bercella (spazio migliaia, virgola decimali)
  const formatCurrency = (value) => formatItalianCurrency(value, 2);

  return (
    <PageTemplate>
      <PageHeader
        title="Dashboard direzionale"
        breadcrumb="Manager"
        showBack={true}
        onBack={() => setView('home')}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView('manager_costs')}
              className="px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold text-xs hover:bg-sky-100 transition-colors cursor-pointer"
            >
              Analisi costi →
            </button>
            <IconButton
              icon={<RefreshCw size={15} />}
              label="Ricarica indicatori"
              onClick={fetchTools}
              variant="glass"
            />
          </div>
        }
      />

      <PageContent className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 pb-24 overflow-y-auto gap-6">
        {/* ROW 1: KPI TILES */}
        <CollapsibleStatGrid
          title="Indicatori magazzino e produzione"
          count={4}
          gridClassName="grid-cols-2 lg:grid-cols-4"
        >
          <StatTile
            label="Valore magazzino"
            value={formatCurrency(kpi.estimatedTotalValue)}
            subtext={`Asset giacente totale (${formatItalianNumber(kpi.totalStockPieces)} pz)`}
            accent="emerald"
            icon={<Euro size={16} />}
          />
          <StatTile
            label="Referenze totali"
            value={formatItalianNumber(kpi.totalToolsCount)}
            subtext="Catalogo utensili CNC"
            accent="blue"
            delta={{ direction: 'flat', text: "SKU" }}
            icon={<Package size={16} />}
          />
          <StatTile
            label="Criticità sottoscorta"
            value={formatItalianNumber(kpi.zeroStockCount)}
            subtext={`${formatItalianNumber(kpi.lowStockCount)} critici sotto scorta`}
            accent="rose"
            delta={{ direction: 'down', text: "a 0 pz" }}
            icon={<AlertTriangle size={16} />}
          />
          <StatTile
            label="Produzione attiva"
            value={formatItalianNumber(kpi.activeCommesseCount)}
            subtext={`${formatItalianNumber(kpi.activeMachinesCount)} CNC operativi`}
            accent="orange"
            delta={{ direction: 'up', text: "commesse" }}
            icon={<Cpu size={16} />}
          />
        </CollapsibleStatGrid>

        {/* ROW 2: DIAGRAMMA SANKEY DEI FLUSSI (SPAZIO MASSIMIZZATO A PIENA LARGHEZZA) */}
        <CostSankeyCard
          tools={tools}
          onSelectCategory={() => setView('manager_costs')}
        />

        {/* ROW 3: DETTAGLIO CLASSIFICA CATEGORIE & NAVIGAZIONE ANALITICA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-sky-600 dark:text-sky-400" />
                  <h3 className="app-h3 text-slate-900 dark:text-slate-100">
                    Ripartizione valore economico per tipologia
                  </h3>
                </div>
                <span className="app-caption text-slate-400">Top 6 categorie</span>
              </div>

              <div className="flex flex-col gap-4 flex-1 justify-around">
                {kpi.topCategories.map((cat, idx) => {
                  const percent = kpi.estimatedTotalValue > 0 ? (cat.val / kpi.estimatedTotalValue) * 100 : 0;
                  return (
                    <div key={cat.name} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span>{cat.name}</span>
                          <span className="text-slate-400 font-normal">({formatItalianNumber(cat.pieces)} pz)</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(cat.val)}
                          </span>
                          <span className="text-slate-400 text-xs">
                            ({formatItalianNumber(percent, 1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(2, percent))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
              <span>Totale catalogato: {formatItalianNumber(kpi.totalStockPieces)} pz</span>
              <button
                type="button"
                onClick={() => setView('manager_costs')}
                className="font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Dettaglio completo costi →
              </button>
            </div>
          </div>

          {/* Quick Actions & Links Manager */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity size={18} className="text-emerald-500" />
                <h3 className="app-h3 text-slate-900 dark:text-slate-100">
                  Navigazione analitica
                </h3>
              </div>
              <p className="app-body text-slate-500 dark:text-slate-400 mb-6">
                Consulta i dettagli analitici dei costi e il consumo di utensili per commessa.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setView('manager_costs')}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-accent-emerald flex items-center justify-center">
                      <Euro size={18} />
                    </div>
                    <div>
                      <h4 className="app-h3 text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                        Analisi economica / costi
                      </h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Spesa stimata, usura e scorte</p>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => setView('manager_commesse')}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-accent-blue flex items-center justify-center">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <h4 className="app-h3 text-slate-800 dark:text-slate-200 group-hover:text-sky-600 transition-colors">
                        Analisi per commessa
                      </h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Consumi utensili per centro CNC</p>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => setView('history')}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-accent-orange flex items-center justify-center">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="app-h3 text-slate-800 dark:text-slate-200 group-hover:text-amber-600 transition-colors">
                        Storico movimentazioni
                      </h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Registro audit transazioni</p>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/60 flex items-center gap-3 text-sm text-sky-800 dark:text-sky-300">
              <ShieldCheck size={20} className="shrink-0" />
              <span>Dati aggiornati in tempo reale dal magazzino centrale CNC.</span>
            </div>
          </div>
        </div>
      </PageContent>
    </PageTemplate>
  );
}
