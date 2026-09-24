import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, Loader2, PackageCheck, Recycle, Wrench } from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody } from '@/components/ui/dialog';
import { ChoiceChip, ChoiceChipGroup } from '@/components/ui/choice-chip';
import { GuidedStep } from '@/components/ui/guided-step';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { StateBlock } from '@/components/common/StateBlock';
import { cn } from '@/lib/utils';
import { useProduzioneStore } from '@/store/useProduzioneStore';
import { CommessaPicker } from './CommessaPicker';
import { GuidedFooter } from './GuidedFooter';
import {
  CAUSALI_OPERATORE, ETICHETTE_CAUSALE, ETICHETTE_STATO, anteprimaBuono, anteprimaConsumato,
  etaBreve, etichettaCiclo
} from './lifecycleSelectors';

const GENERICO = '__generico__';

// Esiti di "Com'è l'utensile?". Colori: blu = riaffilatura, rosa = scarto, verde = rientro, neutro = sposta.
const ESITI = [
  { id: 'consumato', titolo: 'Consumato', icon: Recycle, tone: 'border-accent-blue/45 bg-accent-blue/[0.07] hover:bg-accent-blue/[0.12]' },
  { id: 'rotto', titolo: 'Rotto / da buttare', icon: Wrench, tone: 'border-accent-rose/45 bg-accent-rose/[0.06] hover:bg-accent-rose/[0.11]' },
  { id: 'buono', titolo: 'Ancora buono', icon: PackageCheck, tone: 'border-accent-emerald/45 bg-accent-emerald/[0.06] hover:bg-accent-emerald/[0.11]' },
  { id: 'sposta', titolo: 'Sposta', icon: ArrowLeftRight, tone: 'border-border bg-black/[0.02] dark:bg-white/[0.03] hover:bg-accent-blue/[0.06]' }
];

// "Smonta dalla macchina": una domanda, un tocco. Solo "Rotto" (motivo) e "Sposta" (destinazione) chiedono un passo in più.
export function SmontaDialog({ riga, onClose, notify }) {
  const smonta = useProduzioneStore(s => s.smonta);
  const annullaOperazione = useProduzioneStore(s => s.annullaOperazione);
  const isSubmitting = useProduzioneStore(s => s.isSubmitting);
  const opzioniState = useProduzioneStore(s => s.prelievo);
  const loadOpzioniPrelievo = useProduzioneStore(s => s.loadOpzioniPrelievo);

  const [passo, setPasso] = useState('esito');
  const [quantita, setQuantita] = useState(1);
  const [notaAltro, setNotaAltro] = useState('');
  const [altroAperto, setAltroAperto] = useState(false);
  const [destMacchina, setDestMacchina] = useState();
  const [destCommessa, setDestCommessa] = useState();
  const [errore, setErrore] = useState(null);
  const [idOperazione, setIdOperazione] = useState(null);

  const consumato = anteprimaConsumato(riga);
  const ciclo = etichettaCiclo(riga);
  const hint = {
    consumato: consumato.testo,
    rotto: 'Scarto: ti chiedo solo il motivo',
    buono: anteprimaBuono(riga),
    sposta: 'Su un’altra macchina o commessa'
  };

  const invia = async (esito, extra = {}) => {
    setErrore(null);
    const res = await smonta(
      { idPosizione: riga.id_posizione, quantita, esito, ...extra },
      { idOperazione: idOperazione ?? undefined }
    );
    if (!res.success) {
      setIdOperazione(res.error.isNetwork ? res.idOperazione : null);
      setErrore(res.error.message);
      return;
    }
    const d = res.data || {};
    const quanti = quantita > 1 ? `${quantita} pezzi` : riga.descrizione;
    let testo;
    if (d.esito_effettivo === 'rotto') {
      testo = `Scartato: ${quanti} · ${ETICHETTE_CAUSALE[d.causale_effettiva] ?? 'scarto'}`;
    } else if (esito === 'consumato') {
      testo = `Nel cestello rosso: ${quanti}`;
    } else if (esito === 'buono') {
      testo = d.destinazione?.luogo === 'cassetto'
        ? `Rientrato nel cassetto ${d.destinazione.codice_commessa ?? ''} come usato: ${quanti}`.replace('  ', ' ')
        : `Rientrato in magazzino come usato: ${quanti}`;
    } else {
      testo = `Spostato su ${d.destinazione?.nome_macchina ?? 'altra macchina'}: ${quanti}`;
    }
    onClose();
    notify?.({
      type: 'success',
      message: testo,
      onUndo: async () => {
        const undo = await annullaOperazione(res.idOperazione);
        notify?.(undo.success ? 'Annullato: il pezzo è tornato in macchina.' : undo.error.message, undo.success ? 'success' : 'error');
      }
    });
  };

  const scegliEsito = (id) => {
    if (id === 'consumato' || id === 'buono') return invia(id);
    if (id === 'sposta') loadOpzioniPrelievo(riga.id_utensile);
    setPasso(id);
  };

  // Sposta: macchine e commesse recenti arrivano da get_opzioni_prelievo (stesse chip del prelievo).
  const opzioni = opzioniState.opzioni?.utensile?.id === riga.id_utensile ? opzioniState.opzioni : null;
  const macchine = (opzioni?.macchine ?? []).filter(m => m.id !== riga.id_macchina);
  const recenti = (destMacchina && opzioni?.commesse_per_macchina?.[destMacchina]) || [];
  // Chi sposta un pezzo di solito gli lascia la sua commessa (o "generico macchina"): è la preselezione.
  const commessaDest = destCommessa !== undefined ? destCommessa : (destMacchina ? (riga.id_commessa || GENERICO) : undefined);
  const puoSpostare = !!destMacchina && commessaDest !== undefined && !isSubmitting;

  const confermaPasso = passo === 'sposta'
    ? (puoSpostare ? () => invia('sposta', { destMacchina, destCommessa: commessaDest === GENERICO ? null : commessaDest }) : null)
    : (passo === 'rotto' && altroAperto && !isSubmitting ? () => invia('rotto', { causale: 'altro', nota: notaAltro.trim() || null }) : null);

  // Invio conferma il passo aperto quando il fuoco non è su un campo o un bottone (desktop).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter' || !confermaPasso || e.target.closest?.('button, input, textarea, select, a')) return;
      e.preventDefault();
      confermaPasso();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent size="lg" className="p-0 gap-0">
        <ModalHeader
          icon={<Wrench size={24} />}
          overline="Smonta dalla macchina"
          title={riga.descrizione}
          subtitle={`${ETICHETTE_STATO[riga.stato]}${ciclo ? ` (${ciclo.testo})` : ''} · ${riga.nome_macchina} · ${riga.codice_commessa ? `commessa ${riga.codice_commessa}` : 'generico macchina'} · montato ${etaBreve(riga.entrata_il)}`}
        />

        {passo === 'esito' && (
          <>
            <ModalBody className="flex flex-col gap-6">
              {riga.quantita > 1 && (
                <GuidedStep number={1} done title={`Quanti ne smonti? (su ${riga.quantita})`}>
                  <QuantityStepper value={quantita} onChange={setQuantita} max={riga.quantita} className="max-sm:justify-between" />
                </GuidedStep>
              )}
              <GuidedStep number={riga.quantita > 1 ? 2 : 1} title="Com'è l'utensile?">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ESITI.map(e => {
                    const Icon = e.icon;
                    const avviso = e.id === 'consumato' && consumato.finisceNegliScarti;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => scegliEsito(e.id)}
                        disabled={isSubmitting}
                        className={cn(
                          'min-h-24 p-4 rounded-[var(--radius-panel,24px)] border-[1.5px] text-left flex gap-3 items-start transition-colors cursor-pointer outline-none',
                          'focus-visible:ring-2 focus-visible:ring-accent-blue/50 disabled:opacity-40 disabled:cursor-not-allowed',
                          e.tone
                        )}
                      >
                        <Icon size={20} className="shrink-0 mt-0.5 text-foreground" />
                        <span className="flex flex-col gap-1 min-w-0">
                          <span className="text-base font-black text-foreground">{e.titolo}</span>
                          <span className={cn('app-body', avviso ? 'text-accent-orange font-semibold' : 'text-muted-foreground')}>{hint[e.id]}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </GuidedStep>
              {isSubmitting && (
                <p className="app-body text-muted-foreground flex items-center gap-2" role="status">
                  <Loader2 size={14} className="animate-spin" /> Registro…
                </p>
              )}
              {errore && (
                <p role="alert" className="app-body text-accent-rose flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-px" /> {errore}
                </p>
              )}
            </ModalBody>
          </>
        )}

        {passo === 'rotto' && (
          <>
            <ModalBody className="flex flex-col gap-4">
              <GuidedStep number="!" title="Perché si è rotto?" hint="un tocco e hai finito">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CAUSALI_OPERATORE.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => (c.id === 'altro' ? setAltroAperto(true) : invia('rotto', { causale: c.id }))}
                      className={cn(
                        'min-h-15 px-4 py-2.5 rounded-[var(--radius-card,16px)] border text-left flex flex-col justify-center gap-0.5 transition-colors cursor-pointer outline-none',
                        'focus-visible:ring-2 focus-visible:ring-accent-blue/50 disabled:opacity-40',
                        c.id === 'altro' && altroAperto ? 'border-[1.5px] border-accent-blue bg-accent-blue/10' : 'border-border hover:bg-accent-blue/[0.06]'
                      )}
                    >
                      <span className="text-sm font-bold text-foreground">{c.label}</span>
                      <span className="text-xs font-medium text-muted-foreground">{c.hint}</span>
                    </button>
                  ))}
                </div>
                {altroAperto && (
                  <div className="mt-3 flex flex-col gap-2">
                    <label htmlFor="nota-scarto" className="app-label text-muted-foreground">Nota (facoltativa)</label>
                    <textarea
                      id="nota-scarto"
                      rows={2}
                      value={notaAltro}
                      onChange={(e) => setNotaAltro(e.target.value)}
                      placeholder="es. tagliente scheggiato al primo pezzo"
                      className="w-full rounded-[var(--radius-control,12px)] border border-border bg-transparent px-3 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                    />
                  </div>
                )}
              </GuidedStep>
              {errore && (
                <p role="alert" className="app-body text-accent-rose flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-px" /> {errore}
                </p>
              )}
            </ModalBody>
            <GuidedFooter
              onBack={() => { setPasso('esito'); setAltroAperto(false); setErrore(null); }}
              onConfirm={altroAperto ? confermaPasso : null}
              confirmLabel="Conferma scarto"
              tone="scarica"
              disabled={isSubmitting}
              isSubmitting={isSubmitting}
            />
          </>
        )}

        {passo === 'sposta' && (
          <>
            <ModalBody className="flex flex-col gap-6">
              {!opzioni ? (
                opzioniState.error
                  ? <StateBlock state="error" title="Non riesco a caricare le macchine" error={opzioniState.error.message} onRetry={() => loadOpzioniPrelievo(riga.id_utensile)} />
                  : <StateBlock state="loading" skeletonShape="row" count={3} title="Carico le macchine…" />
              ) : (
                <>
                  <GuidedStep number={1} done={!!destMacchina} title="Su quale macchina lo sposti?">
                    <ChoiceChipGroup label="Macchina di destinazione">
                      {macchine.map(m => (
                        <ChoiceChip key={m.id} selected={m.id === destMacchina} onClick={() => { setDestMacchina(m.id); setDestCommessa(undefined); }}>
                          {m.nome}
                        </ChoiceChip>
                      ))}
                    </ChoiceChipGroup>
                  </GuidedStep>
                  <GuidedStep
                    number={2}
                    done={commessaDest !== undefined}
                    title="Per quale commessa?"
                    className={cn(!destMacchina && 'opacity-50 pointer-events-none')}
                  >
                    <CommessaPicker
                      label="Commessa di destinazione"
                      value={commessaDest ?? undefined}
                      onChange={(id) => setDestCommessa(id)}
                      noneOption={{ id: GENERICO, label: 'Generico macchina' }}
                      items={[
                        ...(riga.id_commessa && !recenti.some(c => c.id === riga.id_commessa)
                          ? [{ id: riga.id_commessa, codice: riga.codice_commessa, descrizione: riga.descrizione_commessa, meta: 'attuale' }]
                          : []),
                        ...recenti.map(c => ({ id: c.id, codice: c.codice, descrizione: c.descrizione, meta: etaBreve(c.ultimo_uso), metaTone: c.fresca ? 'fresh' : 'old' }))
                      ]}
                    />
                  </GuidedStep>
                </>
              )}
            </ModalBody>
            <GuidedFooter
              onBack={() => { setPasso('esito'); setErrore(null); }}
              onConfirm={confermaPasso ?? (() => {})}
              confirmLabel="Conferma spostamento"
              tone="carica"
              disabled={!puoSpostare}
              isSubmitting={isSubmitting}
              errore={errore}
              riepilogo={destMacchina ? `${quantita} × → ${macchine.find(m => m.id === destMacchina)?.nome ?? ''}` : null}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
