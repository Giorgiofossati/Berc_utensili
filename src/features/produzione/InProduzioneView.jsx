import React, { useEffect, useMemo, useState } from 'react';
import { Archive, Cpu, FolderKanban, RefreshCw, PlusCircle, ArrowRightLeft } from 'lucide-react';
import { PageTemplate, PageHeader, PageContent } from '@/components/layout/PageTemplate';
import { IconButton } from '@/components/ui/icon-button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ChoiceChip, ChoiceChipGroup } from '@/components/ui/choice-chip';
import { StateBlock } from '@/components/common/StateBlock';
import { cn } from '@/lib/utils';
import { useProduzioneStore } from '@/store/useProduzioneStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useMovementStore } from '@/store/useMovementStore';
import { SmontaDialog } from './SmontaDialog';
import { AvanzamentoPezziDialog } from './AvanzamentoPezziDialog';
import { ETICHETTE_STATO, etaBreve, etichettaCiclo, raggruppaInProduzione, calcolaUsuraFresa } from './lifecycleSelectors';

const BADGE_STATO = { nuovo: 'badge-emerald', usato: 'badge-slate', riaffilato: 'badge-blue' };

// Vista "In produzione": cosa c'è montato sulle macchine e cosa aspetta nei cassetti commessa.
// Una sola vista con "Raggruppa per Macchina / Commessa" (prototipo approvato 2026-09-24).
export default function InProduzioneView({ setView, showToastNotification }) {
  const { righe, isLoading, error, loadedAt } = useProduzioneStore(s => s.inProduzione);
  const fetchInProduzione = useProduzioneStore(s => s.fetchInProduzione);
  const initRealtime = useProduzioneStore(s => s.initRealtime);
  const tools = useInventoryStore(s => s.tools);
  const openToolDetail = useMovementStore(s => s.openToolDetail);
  const setOpType = useMovementStore(s => s.setOpType);
  const setContestoPrelievo = useProduzioneStore(s => s.setContestoPrelievo);
  const ereditaUtensileBordo = useProduzioneStore(s => s.ereditaUtensileBordo);

  const [modo, setModo] = useState('macchina');
  const [gruppoScelto, setGruppoScelto] = useState(null);
  const [query, setQuery] = useState('');
  const [daSmontare, setDaSmontare] = useState(null);
  const [avanzamentoTarget, setAvanzamentoTarget] = useState(null);
  const [ereditandoId, setEreditandoId] = useState(null);

  useEffect(() => {
    fetchInProduzione();
    initRealtime();
  }, [fetchInProduzione, initRealtime]);

  const filtrate = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return righe;
    return righe.filter(r => [r.descrizione, r.codice, r.nome_macchina, r.codice_commessa, r.descrizione_commessa]
      .some(v => (v || '').toLowerCase().includes(q)));
  }, [righe, query]);

  const gruppi = useMemo(() => raggruppaInProduzione(filtrate, modo), [filtrate, modo]);
  const gruppo = gruppi.find(g => g.chiave === gruppoScelto) || gruppi[0] || null;

  const cambiaModo = (m) => { setModo(m); setGruppoScelto(null); };
  const opzioniModo = [
    { value: 'macchina', label: 'Macchina', icon: <Cpu size={16} /> },
    { value: 'commessa', label: 'Commessa', icon: <FolderKanban size={16} /> }
  ];

  // PRELEVA dal cassetto: si apre il modale utensile già sul prelievo guidato.
  const prelevaDalCassetto = (r) => {
    const t = tools.find(x => x.id === r.id_utensile) || { id: r.id_utensile, Codice: r.codice, 'Descrizione Originale': r.descrizione };
    setContestoPrelievo({ idUtensile: r.id_utensile, idCommessa: r.id_commessa, codiceCommessa: r.codice_commessa, descrizioneCommessa: r.descrizione_commessa });
    openToolDetail(t);
    setOpType('scarico');
  };

  const stato = error ? 'error' : (!loadedAt && isLoading) ? 'loading' : righe.length === 0 ? 'empty' : 'success';

  return (
    <PageTemplate>
      <PageHeader
        title="In produzione"
        breadcrumb="Magazzino"
        showBack
        onBack={() => setView?.('home')}
        search={{ value: query, onChange: setQuery, placeholder: 'Cerca utensile, macchina, commessa…', label: 'Cerca in produzione' }}
        action={
          <div className="flex items-center gap-2">
            <SegmentedControl
              className="max-md:hidden"
              value={modo}
              onValueChange={cambiaModo}
              ariaLabel="Raggruppa per"
              options={opzioniModo}
            />
            <IconButton
              icon={<RefreshCw size={16} className={isLoading ? 'animate-spin text-accent-blue' : ''} />}
              onClick={() => fetchInProduzione()}
              disabled={isLoading}
              aria-label="Aggiorna"
              title="Aggiorna"
              variant="outline"
              className="glass-button border-slate-900/10 dark:border-white/10"
            />
          </div>
        }
      />

      <PageContent className="p-2 pb-24">
        <StateBlock
          state={stato}
          loadingMode="skeleton"
          skeletonShape="row"
          title={stato === 'error' ? 'Non riesco a caricare la produzione' : stato === 'empty' ? 'Nessun utensile in produzione' : undefined}
          description={stato === 'empty' ? 'Quando prelevi un utensile verso una macchina, lo trovi qui.' : undefined}
          error={error?.message}
          onRetry={fetchInProduzione}
        >
          {gruppi.length === 0 ? (
            <StateBlock state="empty" variant="search" searchTerm={query} onAction={() => setQuery('')} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] gap-4 items-start">
              {/* Gruppi: colonna su desktop, chip su smartphone */}
              <nav aria-label={modo === 'macchina' ? 'Macchine' : 'Commesse'} className="max-md:hidden flex flex-col gap-2">
                {gruppi.map(g => {
                  const attivo = g.chiave === gruppo?.chiave;
                  return (
                    <button
                      key={g.chiave}
                      type="button"
                      onClick={() => setGruppoScelto(g.chiave)}
                      aria-current={attivo ? 'true' : undefined}
                      className={cn(
                        'min-h-16 px-4 py-3 rounded-[var(--radius-card,16px)] border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50',
                        attivo ? 'border-[1.5px] border-accent-blue bg-accent-blue/10' : 'border-border hover:bg-accent-blue/[0.06]'
                      )}
                    >
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span className="app-h3 truncate">{g.titolo}</span>
                        <span className="app-body text-muted-foreground truncate">{g.sottotitolo}</span>
                      </span>
                      <span className="app-qty-sm text-foreground">{g.totale}</span>
                    </button>
                  );
                })}
              </nav>
              {/* Smartphone: "Raggruppa per" a tutta larghezza con le etichette, poi i gruppi come chip */}
              <div className="md:hidden flex flex-col gap-3">
                <SegmentedControl
                  className="w-full [&>*]:flex-1"
                  value={modo}
                  onValueChange={cambiaModo}
                  ariaLabel="Raggruppa per"
                  options={opzioniModo}
                />
                <ChoiceChipGroup label={modo === 'macchina' ? 'Macchina' : 'Commessa'}>
                  {gruppi.map(g => (
                    <ChoiceChip key={g.chiave} selected={g.chiave === gruppo?.chiave} onClick={() => setGruppoScelto(g.chiave)}>
                      {g.titolo} <span className="text-muted-foreground tabular-nums">{g.totale}</span>
                    </ChoiceChip>
                  ))}
                </ChoiceChipGroup>
              </div>

              {gruppo && (
                <section className="glass-panel rounded-[var(--radius-panel,24px)] overflow-hidden" aria-label={gruppo.titolo}>
                  <header className="px-4 sm:px-6 py-4 border-b border-border flex flex-col gap-0.5">
                    <h2 className="app-h2">{gruppo.titolo}</h2>
                    <p className="app-body text-muted-foreground">
                      {gruppo.totale} pezz{gruppo.totale === 1 ? 'o' : 'i'} · raggruppati per {modo === 'macchina' ? 'commessa' : 'macchina'}
                    </p>
                  </header>
                  {gruppo.sezioni.map(sezione => (
                    <div key={sezione.chiave}>
                      <div className="px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-3 flex-wrap border-b border-border/40">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          {sezione.isCassetto && <Archive size={14} className="text-muted-foreground" />}
                          <span className="app-label text-foreground font-bold">{sezione.titolo}</span>
                          {sezione.dettaglio && <span className="app-body text-muted-foreground text-xs">{sezione.dettaglio}</span>}
                        </div>

                        {sezione.tracciaCicloVita && (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="badge badge-blue text-[11px] py-1 px-2.5 flex items-center gap-1 font-bold">
                              🎯 {sezione.pezziCompletati} / {sezione.targetPezziLotto || '—'} pz
                            </span>
                            <button
                              type="button"
                              onClick={() => setAvanzamentoTarget(sezione)}
                              className="action-btn action-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                              title="Registra avanzamento pezzi fine turno per questa lavorazione"
                            >
                              <PlusCircle size={14} />
                              <span>+ Pezzi Oggi</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <ul>
                        {sezione.righe.map(r => {
                          const ciclo = etichettaCiclo(r);
                          const inCassetto = r.luogo === 'cassetto';
                          const usura = calcolaUsuraFresa(r);
                          const attivaLavorazioneSuMacchina = modo === 'macchina'
                            ? gruppo.sezioni.find(s => s.idCommessa && !s.isCassetto)
                            : null;
                          const puoEreditare = !inCassetto && attivaLavorazioneSuMacchina && (!r.id_commessa || r.id_commessa !== attivaLavorazioneSuMacchina.idCommessa);

                          return (
                            <li key={r.id_posizione} className="px-4 sm:px-6 py-3 border-t border-border/60 flex items-center gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <span className="app-h3 truncate">{r.descrizione}</span>
                                <span className="app-caption text-muted-foreground truncate">
                                  {r.codice} · {inCassetto ? 'nel cassetto' : 'montato'} {etaBreve(r.entrata_il)}
                                </span>
                                <span className="flex items-center gap-2 sm:hidden mt-1 flex-wrap">
                                  <span className={cn('badge', BADGE_STATO[r.stato])}>{ETICHETTE_STATO[r.stato]}</span>
                                  {ciclo && <span className={cn('text-xs font-bold', ciclo.ultima ? 'text-accent-orange' : 'text-muted-foreground')}>{ciclo.testo}</span>}
                                  {usura && (
                                    <span 
                                      className={cn(
                                        "badge py-0.5 px-2 flex items-center gap-1 font-bold",
                                        usura.colore === 'emerald' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                                        usura.colore === 'amber' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                                        'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                                      )}
                                    >
                                      <span className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        usura.colore === 'emerald' ? 'bg-emerald-500' :
                                        usura.colore === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                                      )} />
                                      <span>{usura.testo}</span>
                                    </span>
                                  )}
                                </span>
                              </div>
                              <span className="max-sm:hidden flex items-center gap-2 shrink-0">
                                {usura && (
                                  <span 
                                    className={cn(
                                      "badge py-0.5 px-2 flex items-center gap-1 font-bold",
                                      usura.colore === 'emerald' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                                      usura.colore === 'amber' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                                      'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                                    )}
                                    title={usura.livello === 'critico' ? 'Usura elevata (>90%): consigliata sostituzione' : `Pezzi: ${usura.testo}`}
                                  >
                                    <span className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      usura.colore === 'emerald' ? 'bg-emerald-500' :
                                      usura.colore === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                                    )} />
                                    <span>{usura.testo}</span>
                                  </span>
                                )}
                                {ciclo && <span className={cn('text-xs font-bold', ciclo.ultima ? 'text-accent-orange' : 'text-muted-foreground')}>{ciclo.testo}</span>}
                                <span className={cn('badge', BADGE_STATO[r.stato])}>{ETICHETTE_STATO[r.stato]}</span>
                              </span>
                              <span className="w-8 text-right app-qty-sm shrink-0">{r.quantita}</span>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                {puoEreditare && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setEreditandoId(r.id_posizione);
                                      const res = await ereditaUtensileBordo({
                                        idPosizione: r.id_posizione,
                                        nuovaCommessaId: attivaLavorazioneSuMacchina.idCommessa
                                      });
                                      setEreditandoId(null);
                                      if (res.success) {
                                        showToastNotification?.(`Utensile collegato a ${attivaLavorazioneSuMacchina.titolo}`, 'success');
                                      } else {
                                        showToastNotification?.(res.error?.message || 'Errore assegnazione', 'error');
                                      }
                                    }}
                                    disabled={ereditandoId === r.id_posizione}
                                    className="min-h-11 px-3 rounded-[var(--radius-control,12px)] border border-accent-blue/40 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue text-xs font-bold tracking-wide shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                                    title={`Assegna questo utensile a ${attivaLavorazioneSuMacchina.titolo}`}
                                  >
                                    <ArrowRightLeft size={13} />
                                    <span className="hidden sm:inline">Eredita</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => (inCassetto ? prelevaDalCassetto(r) : setDaSmontare(r))}
                                  className={cn(
                                    'min-h-11 min-w-24 px-4 rounded-[var(--radius-control,12px)] border text-xs font-black tracking-wider shrink-0 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50',
                                    inCassetto
                                      ? 'border-accent-rose/50 bg-accent-rose/[0.07] text-accent-rose hover:bg-accent-rose/[0.13]'
                                      : 'border-accent-blue/45 bg-accent-blue/[0.08] text-accent-blue hover:bg-accent-blue/[0.14]'
                                  )}
                                >
                                  {inCassetto ? 'Preleva' : 'Smonta'}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}
        </StateBlock>
      </PageContent>

      {daSmontare && <SmontaDialog riga={daSmontare} onClose={() => setDaSmontare(null)} notify={showToastNotification} />}

      {avanzamentoTarget && (
        <AvanzamentoPezziDialog
          lavorazione={avanzamentoTarget}
          onClose={() => setAvanzamentoTarget(null)}
          notify={showToastNotification}
        />
      )}
    </PageTemplate>
  );
}
