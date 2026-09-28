import React, { useEffect, useState } from 'react';
import { Pencil, RefreshCw, RotateCcw, Send, Undo2 } from 'lucide-react';
import { PageTemplate, PageHeader, PageContent } from '@/components/layout/PageTemplate';
import { IconButton, IconMenu } from '@/components/ui/icon-button';
import { StateBlock } from '@/components/common/StateBlock';
import { cn } from '@/lib/utils';
import { useProduzioneStore } from '@/store/useProduzioneStore';
import { useAuthStore } from '@/store/useAuthStore';
import { RientroGuidato } from './RientroGuidato';
import { etaBreve, formatDataBreve, giorniDa, puo } from './lifecycleSelectors';

const chiave = (r) => `${r.id_utensile}|${r.n_riaffilature}`;

// Vista "Riaffilature": cestello rosso → spedizione (DDT facoltativo) → rientro guidato.
export default function RiaffilatureView({ setView, showToastNotification: notify }) {
  const { cestello, spedizioni, isLoading, error, loadedAt } = useProduzioneStore(s => s.riaffilature);
  const fetchRiaffilature = useProduzioneStore(s => s.fetchRiaffilature);
  const spedisciCestello = useProduzioneStore(s => s.spedisciCestello);
  const annullaOperazione = useProduzioneStore(s => s.annullaOperazione);
  const aggiornaDdt = useProduzioneStore(s => s.aggiornaDdt);
  const initRealtime = useProduzioneStore(s => s.initRealtime);
  const isSubmitting = useProduzioneStore(s => s.isSubmitting);
  const utente = useAuthStore(s => s.currentUser);
  const puoGestire = puo(utente, 'can_manage_riaffilature');

  const [ddt, setDdt] = useState('');
  const [aperta, setAperta] = useState(null);
  const [precompilato, setPrecompilato] = useState(null);
  const [ddtInModifica, setDdtInModifica] = useState(null);
  const [erroreCestello, setErroreCestello] = useState(null);

  useEffect(() => {
    fetchRiaffilature();
    initRealtime();
  }, [fetchRiaffilature, initRealtime]);

  const pezziCestello = cestello.reduce((a, c) => a + c.quantita, 0);
  const inViaggio = spedizioni.filter(s => s.stato === 'in_viaggio');
  const rientrate = spedizioni.filter(s => s.stato === 'rientrata');

  const spedisci = async () => {
    setErroreCestello(null);
    const res = await spedisciCestello({ ddt: ddt.trim() || null });
    if (!res.success) { setErroreCestello(res.error.message); return; }
    setDdt('');
    notify?.({
      type: 'success',
      message: `Cestello spedito: ${res.data.pezzi} pezzi${ddt.trim() ? ` con DDT ${ddt.trim()}` : ''}.`,
      onUndo: async () => {
        const undo = await annullaOperazione(res.idOperazione);
        notify?.(undo.success ? 'Spedizione annullata: i pezzi sono di nuovo nel cestello.' : undo.error.message, undo.success ? 'success' : 'error');
      }
    });
  };

  const annullaRientro = async (sped, riapri) => {
    const undo = await annullaOperazione(sped.id_operazione_rientro);
    if (!undo.success) { notify?.(undo.error.message, 'error'); return; }
    if (riapri) {
      setPrecompilato(Object.fromEntries(sped.righe.map(r => [chiave(r), r.scartati || 0])));
      setAperta(sped.id);
      notify?.('Rientro riaperto: correggi e conferma di nuovo.', 'success');
    } else {
      notify?.('Rientro annullato: la spedizione è di nuovo in viaggio.', 'success');
    }
  };

  const salvaDdt = async (sped) => {
    const res = await aggiornaDdt(sped.id, ddtInModifica.valore.trim() || null);
    if (!res.success) { notify?.(res.error.message, 'error'); return; }
    setDdtInModifica(null);
  };

  const stato = error ? 'error' : (!loadedAt && isLoading) ? 'loading' : 'success';

  return (
    <PageTemplate>
      <PageHeader
        title="Riaffilature"
        breadcrumb="Magazzino"
        showBack
        onBack={() => setView?.('home')}
        action={
          <IconButton
            icon={<RefreshCw size={16} className={isLoading ? 'animate-spin text-accent-blue' : ''} />}
            onClick={() => fetchRiaffilature()}
            disabled={isLoading}
            aria-label="Aggiorna"
            title="Aggiorna"
            variant="outline"
            className="glass-button border-slate-900/10 dark:border-white/10"
          />
        }
      />

      <PageContent className="p-2 pb-24">
        <StateBlock state={stato} loadingMode="skeleton" skeletonShape="row" title={stato === 'error' ? 'Non riesco a caricare le riaffilature' : undefined} error={error?.message} onRetry={() => fetchRiaffilature()}>
          {!puoGestire && (
            <p className="mb-3 px-4 py-3 rounded-[var(--radius-card,16px)] border border-border app-body text-muted-foreground">
              Puoi consultare cestello e spedizioni. Spedire e registrare i rientri spetta a chi gestisce le riaffilature.
            </p>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-4 items-start">

            {/* ---------------- Cestello rosso ---------------- */}
            <section aria-label="Cestello rosso" className="glass-panel rounded-[var(--radius-panel,24px)] overflow-hidden flex flex-col">
              <header className="px-4 sm:px-6 py-4 border-b border-border flex flex-col gap-0.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-[var(--radius-tag,6px)] bg-accent-rose" aria-hidden="true" />
                  <h2 className="app-h2">Cestello rosso</h2>
                  <span className="ml-auto app-qty-sm text-foreground">{pezziCestello}</span>
                </div>
                <p className="app-body text-muted-foreground">Si riempie quando smonti un utensile "Consumato".</p>
              </header>

              {cestello.length === 0 ? (
                <p className="px-6 py-10 text-center app-body text-muted-foreground">Cestello vuoto.</p>
              ) : (
                <ul>
                  {cestello.map(c => (
                    <li key={c.id_posizione} className="px-4 sm:px-6 py-3 border-t border-border/60 first:border-t-0 flex items-center gap-3">
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className="app-h3 truncate">{c.descrizione}</span>
                        <span className="app-body text-muted-foreground truncate">
                          {c.nome_macchina_origine ? `da ${c.nome_macchina_origine} · ` : ''}{etaBreve(c.entrata_il)}
                          {c.codice_commessa ? ` · ${c.codice_commessa}` : ''}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground shrink-0">{(c.n_riaffilature ?? 0) + 1}ª</span>
                      <span className="w-7 text-right app-qty-sm shrink-0">{c.quantita}</span>
                    </li>
                  ))}
                </ul>
              )}

              {cestello.length > 0 && puoGestire && (
                <footer className="px-4 sm:px-6 py-4 border-t border-border bg-muted/50 flex flex-col gap-2">
                  <div className="flex flex-col gap-3">
                    <label className="flex-1 flex flex-col gap-1.5">
                      <span className="app-label text-muted-foreground">N° DDT <span className="normal-case font-medium tracking-normal">(facoltativo, anche dopo)</span></span>
                      <input
                        value={ddt}
                        onChange={(e) => setDdt(e.target.value)}
                        placeholder="es. 1452"
                        inputMode="numeric"
                        className="h-12 px-3.5 rounded-[var(--radius-control,12px)] border border-border bg-background text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={spedisci}
                      disabled={isSubmitting}
                      className="action-btn-primary min-h-12 px-5 rounded-[var(--radius-control,12px)] text-sm font-black uppercase tracking-wider whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                      <Send size={16} /> Spedisci cestello
                    </button>
                  </div>
                  {erroreCestello && <p role="alert" className="app-body text-accent-rose">{erroreCestello}</p>}
                </footer>
              )}
            </section>

            {/* ---------------- Dal fornitore ---------------- */}
            <section aria-label="Dal fornitore" className="flex flex-col gap-3">
              <header className="px-1 flex flex-col gap-0.5">
                <h2 className="app-h2">Dal fornitore</h2>
                <p className="app-body text-muted-foreground">Quando arriva un pacco, aprilo qui: ti guido in due passi.</p>
              </header>

              {inViaggio.length === 0 && rientrate.length === 0 && (
                <p className="glass-panel rounded-[var(--radius-panel,24px)] px-6 py-10 text-center app-body text-muted-foreground">Nessuna spedizione in corso.</p>
              )}

              {inViaggio.map(s => {
                const giorni = giorniDa(s.data_invio);
                const isAperta = aperta === s.id;
                const editing = ddtInModifica?.id === s.id;
                return (
                  <article key={s.id} className={cn('glass-panel rounded-[var(--radius-panel,24px)] overflow-hidden', isAperta && 'ring-[1.5px] ring-accent-orange/50')}>
                    <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className="app-h3">{s.ddt ? `DDT ${s.ddt}` : 'Spedizione senza DDT'} · {formatDataBreve(s.data_invio)}</span>
                        <span className="app-body text-muted-foreground">{s.pezzi} pezzi · fuori da {giorni} giorn{giorni === 1 ? 'o' : 'i'}</span>
                        {editing ? (
                          <span className="mt-1.5 flex items-center gap-2">
                            <input
                              autoFocus
                              value={ddtInModifica.valore}
                              onChange={(e) => setDdtInModifica({ id: s.id, valore: e.target.value })}
                              onKeyDown={(e) => { if (e.key === 'Enter') salvaDdt(s); if (e.key === 'Escape') setDdtInModifica(null); }}
                              placeholder="N° DDT"
                              aria-label="Numero DDT"
                              className="h-11 w-32 px-3 rounded-[var(--radius-control,12px)] border border-border bg-background text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                            />
                            <button type="button" onClick={() => salvaDdt(s)} className="min-h-11 px-3 rounded-[var(--radius-control,12px)] text-sm font-bold text-accent-blue hover:bg-accent-blue/[0.06] cursor-pointer">Salva</button>
                          </span>
                        ) : puoGestire && (
                          <button type="button" onClick={() => setDdtInModifica({ id: s.id, valore: s.ddt || '' })} className="self-start min-h-11 -ml-1 px-1 text-sm font-bold text-accent-blue hover:underline cursor-pointer flex items-center gap-1.5">
                            <Pencil size={14} /> {s.ddt ? 'Modifica DDT' : 'Aggiungi DDT'}
                          </button>
                        )}
                      </div>
                      {isAperta ? (
                        <button type="button" onClick={() => { setAperta(null); setPrecompilato(null); }} className="glass-button min-h-11 px-4 rounded-[var(--radius-control,12px)] text-sm font-bold text-muted-foreground cursor-pointer">Chiudi</button>
                      ) : puoGestire ? (
                        <button
                          type="button"
                          onClick={() => { setAperta(s.id); setPrecompilato(null); }}
                          className="min-h-12 px-5 rounded-[var(--radius-control,12px)] border-[1.5px] border-accent-orange/60 bg-accent-orange/[0.08] hover:bg-accent-orange/[0.14] text-sm font-black uppercase tracking-wider text-foreground whitespace-nowrap cursor-pointer"
                        >
                          È arrivata
                        </button>
                      ) : (
                        <span className="badge badge-blue self-start sm:self-center">In viaggio</span>
                      )}
                    </div>
                    {isAperta && (
                      <RientroGuidato
                        key={`${s.id}-${precompilato ? 'corr' : 'nuovo'}`}
                        spedizione={s}
                        precompilato={precompilato}
                        onChiudi={() => { setAperta(null); setPrecompilato(null); }}
                        notify={notify}
                      />
                    )}
                  </article>
                );
              })}

              {rientrate.map(s => (
                <article key={s.id} className="glass-panel rounded-[var(--radius-panel,24px)] px-4 sm:px-5 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="app-h3">{s.ddt ? `DDT ${s.ddt}` : 'Spedizione senza DDT'} · {formatDataBreve(s.data_invio)}</span>
                    <span className="app-body text-muted-foreground">
                      Rientrata {formatDataBreve(s.data_rientro)} · {s.righe.reduce((a, r) => a + r.quantita, 0)} riposti
                      {s.righe.some(r => r.scartati) ? ` · ${s.righe.reduce((a, r) => a + (r.scartati || 0), 0)} buttati` : ''}
                    </span>
                  </div>
                  <span className="badge badge-emerald shrink-0">Rientrata</span>
                  {puoGestire && s.id_operazione_rientro && (
                    <IconMenu
                      ariaLabel={`Altre azioni su ${s.ddt ? `DDT ${s.ddt}` : 'spedizione'}`}
                      items={[
                        { label: 'Correggi il rientro', icon: <RotateCcw size={16} />, onClick: () => annullaRientro(s, true) },
                        { type: 'separator' },
                        { label: 'Annulla il rientro', icon: <Undo2 size={16} />, destructive: true, onClick: () => annullaRientro(s, false) }
                      ]}
                    />
                  )}
                </article>
              ))}
            </section>
          </div>
        </StateBlock>
      </PageContent>
    </PageTemplate>
  );
}
