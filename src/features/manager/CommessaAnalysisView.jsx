import React, { useMemo, useState, useEffect } from 'react';
import { 
  Briefcase, Cpu, ArrowUp, ArrowDown, Package, Layers, 
  Search, RefreshCw, ChevronRight, Activity, Calendar
} from 'lucide-react';
import { PageTemplate, PageHeader, PageToolbar, PageContent, ResetFiltersButton } from '@/components/layout/PageTemplate';
import { StatTile } from '@/components/ui/stat-tile';
import { IconButton } from '@/components/ui/icon-button';
import { useCommesseStore } from '../../store/useCommesseStore';
import { useMacchineStore } from '../../store/useMacchineStore';
import { supabase } from '../../lib/supabase';
import { cn } from '@/lib/utils';

export default function CommessaAnalysisView({ setView }) {
  const commesse = useCommesseStore(state => state.commesse);
  const fetchCommesse = useCommesseStore(state => state.fetchCommesse);
  const macchine = useMacchineStore(state => state.macchine);
  const fetchMacchine = useMacchineStore(state => state.fetchMacchine);

  const [movements, setMovements] = useState([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCommesse();
    fetchMacchine();

    const loadMovements = async () => {
      setIsLoadingMovements(true);
      try {
        const { data, error } = await supabase
          .from('movements_history')
          .select('*, Utensili_B1(Tipologia, Codice, Diametro), commesse(codice, descrizione)')
          .not('commessa_id', 'is', null)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setMovements(data);
        }
      } catch (err) {
        console.warn('Errore fetch movements commessa:', err);
      } finally {
        setIsLoadingMovements(false);
      }
    };

    loadMovements();
  }, [fetchCommesse, fetchMacchine]);

  // Aggregazione consumi per commessa
  const commesseStats = useMemo(() => {
    const map = new Map();

    commesse.forEach(c => {
      map.set(c.id, {
        commessa: c,
        prelieviPezzi: 0,
        depositiPezzi: 0,
        movimentiCount: 0,
        utensiliUsati: new Set()
      });
    });

    movements.forEach(m => {
      if (!m.commessa_id) return;
      const stat = map.get(m.commessa_id);
      if (stat) {
        stat.movimentiCount++;
        const q = Number(m.quantita) || 1;
        if (m.tipo_operazione === 'scarico') stat.prelieviPezzi += q;
        else stat.depositiPezzi += q;
        if (m.tool_id) stat.utensiliUsati.add(m.tool_id);
      }
    });

    return Array.from(map.values());
  }, [commesse, movements]);

  // Macchine map
  const macchineMap = useMemo(() => {
    const map = new Map();
    macchine.forEach(m => map.set(m.id, m));
    return map;
  }, [macchine]);

  const filteredStats = useMemo(() => {
    return commesseStats.filter(({ commessa }) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return commessa.codice?.toLowerCase().includes(q) ||
        commessa.descrizione?.toLowerCase().includes(q) ||
        commessa.ubicazione?.toLowerCase().includes(q);
    });
  }, [commesseStats, searchQuery]);

  return (
    <PageTemplate>
      <PageHeader
        title="Analisi per Commessa & Centri di Lavoro"
        breadcrumb="Manager"
        showBack={true}
        onBack={() => setView('manager_dashboard')}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          label: 'Cerca commesse per analisi',
          placeholder: 'Cerca codice commessa, descrizione o ubicazione…'
        }}
        action={
          <div className="flex items-center gap-2">
            <IconButton
              icon={<RefreshCw size={15} className={isLoadingMovements ? "animate-spin" : ""} />}
              label="Ricarica"
              onClick={() => { fetchCommesse(); fetchMacchine(); }}
              variant="glass"
            />
          </div>
        }
      />

      <PageContent className="flex-1 min-h-0 flex flex-col p-2 sm:p-4 md:p-6 pb-24 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredStats.map(({ commessa, prelieviPezzi, depositiPezzi, movimentiCount, utensiliUsati }) => {
            const defaultMacchina = commessa.macchina_id ? macchineMap.get(commessa.macchina_id) : null;
            return (
              <div
                key={commessa.id}
                className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                          {commessa.codice}
                        </h3>
                        <span className="text-xs text-slate-400 truncate">
                          {commessa.descrizione || 'Lavorazione generica'}
                        </span>
                      </div>
                    </div>

                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 border",
                      commessa.stato === 'Attiva'
                        ? "bg-emerald-500/10 text-accent-emerald border-emerald-500/30"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700"
                    )}>
                      {commessa.stato || 'Attiva'}
                    </span>
                  </div>

                  {/* Macchina CNC Associata */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs mb-3">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <Cpu size={14} className="text-accent-blue" />
                      Centro CNC:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {defaultMacchina ? defaultMacchina.nome : (commessa.ubicazione || 'Non assegnata')}
                    </span>
                  </div>

                  {/* Indicatori Prelievi e Depositi */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col">
                      <span className="text-xs font-bold text-accent-rose flex items-center gap-1">
                        <ArrowUp size={11} /> Prelievi
                      </span>
                      <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                        {prelieviPezzi} PZ
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col">
                      <span className="text-xs font-bold text-accent-emerald flex items-center gap-1">
                        <ArrowDown size={11} /> Depositi
                      </span>
                      <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {depositiPezzi} PZ
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Referenze distinte: <strong>{utensiliUsati.size}</strong></span>
                  <span>Movimenti: <strong>{movimentiCount}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </PageContent>
    </PageTemplate>
  );
}
