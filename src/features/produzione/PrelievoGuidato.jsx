import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Loader2, ShoppingCart } from 'lucide-react';
import { ModalBody } from '@/components/ui/dialog';
import { ChoiceChip, ChoiceChipGroup } from '@/components/ui/choice-chip';
import { GuidedStep } from '@/components/ui/guided-step';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { StateBlock } from '@/components/common/StateBlock';
import { cn } from '@/lib/utils';
import { useProduzioneStore } from '@/store/useProduzioneStore';
import { CommessaPicker } from './CommessaPicker';
import { DirectionStrip } from './DirectionStrip';
import { GuidedFooter } from './GuidedFooter';
import { StatoPicker } from './StatoPicker';
import {
  ETICHETTE_STATO, commessaPreselezionata, contaPerStato, etaBreve, etichettaSorgente,
  haCassetto, macchinaPreselezionata, sorgentePredefinita, statoConsigliato
} from './lifecycleSelectors';

const GENERICO = '__generico__';
const MACCHINE_IN_EVIDENZA = 3;

// Secondo passo del modale utensile quando l'operatore sceglie PRELEVA.
// Tre domande guidate (macchina, commessa, pezzo) e un riquadro "Prendi da → Porta a" sempre aggiornato.
export function PrelievoGuidato({ tool, onBack, onDone, onOpenOrder, notify }) {
  const { opzioni, isLoading, error } = useProduzioneStore(s => s.prelievo);
  const loadOpzioniPrelievo = useProduzioneStore(s => s.loadOpzioniPrelievo);
  const preleva = useProduzioneStore(s => s.preleva);
  const annullaOperazione = useProduzioneStore(s => s.annullaOperazione);
  const isSubmitting = useProduzioneStore(s => s.isSubmitting);
  const contesto = useProduzioneStore(s => s.contestoPrelievo);
  const setContestoPrelievo = useProduzioneStore(s => s.setContestoPrelievo);
  const ctx = contesto?.idUtensile === tool.id ? contesto : null;

  // undefined = l'operatore non ha ancora toccato la scelta: vale la preselezione calcolata dalle opzioni.
  const [macchinaScelta, setIdMacchina] = useState();
  const [commessaToccata, setCommessa] = useState();
  const [codiceCercato, setCodiceCercato] = useState(null);
  const [tutteLeMacchine, setTutteLeMacchine] = useState(false);
  const [daMacchina, setDaMacchina] = useState(null);
  const [usaMagazzino, setUsaMagazzino] = useState(false);
  const [statoScelto, setStatoScelto] = useState(null);
  const [quantita, setQuantita] = useState(1);
  const [erroreInvio, setErroreInvio] = useState(null);
  const [idOperazione, setIdOperazione] = useState(null);

  useEffect(() => {
    loadOpzioniPrelievo(tool.id);
  }, [tool.id, loadOpzioniPrelievo]);

  // Preselezioni: macchina = ultima usata dall'operatore, commessa = più recente su quella macchina se "fresca".
  const pronto = opzioni?.utensile?.id === tool.id;
  const idMacchina = macchinaScelta !== undefined ? macchinaScelta : (pronto ? macchinaPreselezionata(opzioni) : null);
  const commessa = commessaToccata !== undefined
    ? commessaToccata
    : ctx?.idCommessa
      ? ctx.idCommessa
      : (pronto && idMacchina ? (commessaPreselezionata(opzioni, idMacchina) ?? undefined) : undefined);

  const macchine = opzioni?.macchine ?? [];
  const macchina = macchine.find(m => m.id === idMacchina) || null;
  const recentiSuMacchina = (idMacchina && opzioni?.commesse_per_macchina?.[idMacchina]) || [];
  const idCommessa = commessa === GENERICO ? null : (commessa ?? null);
  const commessaScelta = commessa !== undefined;
  const disponibilita = opzioni?.disponibilita ?? [];

  const sorgente = daMacchina
    ? { luogo: 'macchina', id_posizione: daMacchina.id_posizione }
    : usaMagazzino ? { luogo: 'magazzino', id_commessa: null } : sorgentePredefinita(disponibilita, idCommessa);
  const conteggi = daMacchina
    ? { nuovo: 0, usato: 0, riaffilato: 0, [daMacchina.stato]: daMacchina.quantita }
    : contaPerStato(disponibilita, sorgente);
  const consigliato = statoConsigliato(conteggi);
  const stato = statoScelto && conteggi[statoScelto] > 0 ? statoScelto : consigliato;
  const massimo = stato ? conteggi[stato] : 0;
  const qty = Math.min(Math.max(1, quantita), Math.max(1, massimo));
  const totaleDisponibile = disponibilita.reduce((a, d) => a + d.quantita, 0) + (opzioni?.altrove_in_macchina?.length ?? 0);

  const from = daMacchina
    ? { titolo: daMacchina.nome_macchina, dettaglio: `fermo da ${etaBreve(daMacchina.entrata_il).replace(' fa', '')}` }
    : etichettaSorgente(disponibilita, sorgente, opzioni?.utensile?.ubicazione);
  const nomeCommessa = commessa === GENERICO
    ? 'generico macchina'
    : idCommessa
      ? (recentiSuMacchina.find(c => c.id === idCommessa)?.codice ?? codiceCercato ?? (ctx?.idCommessa === idCommessa ? ctx.codiceCommessa : null) ?? 'commessa scelta')
      : null;

  const puoConfermare = !!macchina && commessaScelta && !!stato && qty >= 1 && qty <= massimo && !isSubmitting;

  const riepilogo = stato && macchina
    ? `${qty} × ${ETICHETTE_STATO[stato]} · da ${from.titolo} → ${macchina.nome} · ${nomeCommessa ?? '?'}`
    : null;

  const resetPerNuovaDestinazione = () => {
    setDaMacchina(null);
    setUsaMagazzino(false);
    setStatoScelto(null);
    setQuantita(1);
    setErroreInvio(null);
    setIdOperazione(null);
  };

  const scegliMacchina = (id) => {
    setIdMacchina(id);
    setCommessa(undefined);
    setCodiceCercato(null);
    resetPerNuovaDestinazione();
  };

  const scegliCommessa = (id, item) => {
    setCommessa(id);
    setCodiceCercato(item?.codice ?? null);
    resetPerNuovaDestinazione();
  };

  const conferma = async () => {
    if (!puoConfermare) return;
    setErroreInvio(null);
    const res = await preleva({
      idUtensile: tool.id,
      da: daMacchina ? { id_posizione: daMacchina.id_posizione } : { luogo: sorgente.luogo, id_commessa: sorgente.id_commessa },
      stato,
      idMacchina: macchina.id,
      idCommessa,
      quantita: qty
    }, { idOperazione: idOperazione ?? undefined, descrizione: riepilogo });

    if (res.success) {
      setContestoPrelievo(null);
      onDone?.();
      notify?.({
        type: 'success',
        message: `Prelevato: ${riepilogo}`,
        onUndo: async () => {
          const undo = await annullaOperazione(res.idOperazione);
          notify?.(undo.success ? 'Prelievo annullato: i pezzi sono tornati al loro posto.' : undo.error.message, undo.success ? 'success' : 'error');
        }
      });
      return;
    }
    // Errore di rete: si riprova con lo stesso id, così il prelievo non viene registrato due volte.
    setIdOperazione(res.error.isNetwork ? res.idOperazione : null);
    setErroreInvio(res.error.message);
    if (['GIACENZA_INSUFFICIENTE', 'POSIZIONE_NON_TROVATA'].includes(res.error.codice)) loadOpzioniPrelievo(tool.id);
  };

  // Invio conferma quando il fuoco non è su un campo o un bottone (desktop).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter' || e.target.closest?.('button, input, textarea, select, a')) return;
      e.preventDefault();
      conferma();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // ---- stati di caricamento / errore / niente da prelevare ----
  if (!pronto) {
    return (
      <>
        <ModalBody>
          {error
            ? <StateBlock state="error" title="Non riesco a caricare le opzioni di prelievo" error={error.message} onRetry={() => loadOpzioniPrelievo(tool.id)} />
            : <StateBlock state="loading" skeletonShape="row" count={4} title="Preparo il prelievo…" />}
        </ModalBody>
        <GuidedFooter onBack={onBack} />
      </>
    );
  }

  if (totaleDisponibile === 0) {
    return (
      <>
        <ModalBody>
          <StateBlock
            state="empty"
            title="Nessun pezzo da prelevare"
            description="Non ce n'è in magazzino né nei cassetti commessa. Puoi ordinarlo."
            action={onOpenOrder ? 'Crea ordine' : undefined}
            onAction={onOpenOrder}
          />
        </ModalBody>
        <GuidedFooter onBack={onBack} />
      </>
    );
  }

  const inEvidenza = tutteLeMacchine ? macchine : macchine.slice(0, MACCHINE_IN_EVIDENZA);
  const macchineVisibili = macchina && !inEvidenza.some(m => m.id === macchina.id) ? [...inEvidenza, macchina] : inEvidenza;
  const suggerimento = !daMacchina && opzioni.altrove_in_macchina?.find(a => a.id_macchina !== idMacchina);
  const commessaVecchia = idMacchina && !commessaScelta && recentiSuMacchina.length > 0;

  return (
    <>
      <ModalBody className="flex flex-col gap-6">
        <DirectionStrip
          from={{ label: 'Prendi da', ...from }}
          to={{
            label: 'Porta a',
            titolo: macchina ? macchina.nome : 'Scegli la macchina',
            dettaglio: commessaScelta ? `commessa ${nomeCommessa}` : 'commessa da scegliere'
          }}
          pending={!macchina || !commessaScelta}
        />

        {isLoading && (
          <p className="app-body text-muted-foreground flex items-center gap-2" role="status">
            <Loader2 size={14} className="animate-spin" /> Aggiorno le disponibilità…
          </p>
        )}

        <GuidedStep number={1} done={!!macchina} title="Su quale macchina va?" hint={macchine[0]?.ultimo_uso_operatore ? 'le ultime che hai usato' : null}>
          {macchine.length === 0 ? (
            <p className="app-body text-accent-rose">Nessuna macchina configurata: chiedi a un responsabile di aggiungerle.</p>
          ) : (
            <ChoiceChipGroup label="Macchina">
              {macchineVisibili.map(m => (
                <ChoiceChip key={m.id} selected={m.id === idMacchina} onClick={() => scegliMacchina(m.id)}>
                  {m.nome}
                </ChoiceChip>
              ))}
              {!tutteLeMacchine && macchine.length > MACCHINE_IN_EVIDENZA && (
                <ChoiceChip variant="action" onClick={() => setTutteLeMacchine(true)}>
                  Altra… ({macchine.length - MACCHINE_IN_EVIDENZA})
                </ChoiceChip>
              )}
            </ChoiceChipGroup>
          )}
        </GuidedStep>

        <GuidedStep
          number={2}
          done={commessaScelta}
          title="Per quale commessa?"
          hint={macchina && recentiSuMacchina.length > 0 ? `ultime lavorate su ${macchina.nome}` : null}
          className={cn(!macchina && 'opacity-50 pointer-events-none')}
        >
          <CommessaPicker
            label="Commessa"
            value={commessa}
            onChange={scegliCommessa}
            noneOption={{ id: GENERICO, label: 'Generico macchina' }}
            items={[
              ...(ctx?.idCommessa && !recentiSuMacchina.some(c => c.id === ctx.idCommessa)
                ? [{ id: ctx.idCommessa, codice: ctx.codiceCommessa, descrizione: ctx.descrizioneCommessa, meta: 'dal cassetto', metaTone: 'fresh' }]
                : []),
              ...recentiSuMacchina.map(c => ({
                id: c.id, codice: c.codice, descrizione: c.descrizione,
                meta: etaBreve(c.ultimo_uso), metaTone: c.fresca ? 'fresh' : 'old'
              }))
            ]}
          />
          {commessaVecchia && (
            <p className="mt-2.5 app-body text-accent-orange flex items-start gap-2">
              <Clock size={16} className="shrink-0 mt-px" />
              L&apos;ultima commessa su questa macchina è di oltre 3 giorni fa: scegli tu quella giusta.
            </p>
          )}
        </GuidedStep>

        <GuidedStep
          number={3}
          done={!!stato && commessaScelta}
          title="Quale pezzo prendi?"
          hint={daMacchina ? `dalla ${daMacchina.nome_macchina}` : haCassetto(disponibilita, idCommessa) && !usaMagazzino ? `nel cassetto ${nomeCommessa}` : 'in magazzino generale'}
          className={cn(!commessaScelta && 'opacity-50 pointer-events-none')}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {daMacchina ? (
              <p className="flex-1 app-body">
                {daMacchina.quantita} × {ETICHETTE_STATO[daMacchina.stato]} fermo su {daMacchina.nome_macchina}
                {daMacchina.codice_commessa ? ` (commessa ${daMacchina.codice_commessa})` : ''}.
              </p>
            ) : (
              <StatoPicker className="flex-1" value={stato} onChange={(s) => { setStatoScelto(s); setQuantita(1); }} conteggi={conteggi} consigliato={consigliato} />
            )}
            <QuantityStepper value={qty} onChange={setQuantita} max={Math.max(1, massimo)} className="max-sm:justify-between" />
          </div>

          {!stato && !daMacchina && (
            <p className="mt-2.5 app-body text-accent-orange flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-px" />
              {sorgente.luogo === 'cassetto' ? 'Il cassetto di questa commessa è vuoto.' : 'In magazzino generale non ce n’è.'}
            </p>
          )}

          <div className="mt-1 flex flex-col items-start">
            {!daMacchina && haCassetto(disponibilita, idCommessa) && (
              <button
                type="button"
                onClick={() => { setUsaMagazzino(v => !v); setStatoScelto(null); setQuantita(1); }}
                className="min-h-11 px-1 text-sm font-bold text-accent-blue hover:underline cursor-pointer"
              >
                {usaMagazzino ? '← Torna al cassetto della commessa' : 'Nel cassetto non c’è quello che serve? Prendi dal magazzino generale'}
              </button>
            )}
            {daMacchina && (
              <button type="button" onClick={() => setDaMacchina(null)} className="min-h-11 px-1 text-sm font-bold text-accent-blue hover:underline cursor-pointer">
                ← Prendi invece dal magazzino
              </button>
            )}
          </div>

          {suggerimento && commessaScelta && (
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 rounded-[var(--radius-card,16px)] border border-accent-blue/25 bg-accent-blue/[0.05]">
              <span className="flex-1 app-body">
                Su <strong>{suggerimento.nome_macchina}</strong> c&apos;è {suggerimento.quantita} pezzo {ETICHETTE_STATO[suggerimento.stato].toLowerCase()} fermo da {etaBreve(suggerimento.entrata_il).replace(' fa', '')}.
              </span>
              <ChoiceChip variant="action" onClick={() => { setDaMacchina(suggerimento); setQuantita(1); }} className="border-solid border-accent-blue/40 text-accent-blue">
                Prendi da lì
              </ChoiceChip>
            </div>
          )}
        </GuidedStep>
      </ModalBody>

      <GuidedFooter
        onBack={onBack}
        onConfirm={conferma}
        confirmLabel={idOperazione ? 'Riprova prelievo' : 'Conferma prelievo'}
        tone="scarica"
        disabled={!puoConfermare}
        isSubmitting={isSubmitting}
        riepilogo={riepilogo}
        errore={erroreInvio}
      >
        {massimo === 0 && onOpenOrder && (
          <button type="button" onClick={onOpenOrder} className="min-h-12 px-4 rounded-[var(--radius-control,12px)] text-sm font-black uppercase tracking-wider text-accent-orange hover:bg-accent-orange/10 cursor-pointer flex items-center gap-2 shrink-0">
            <ShoppingCart size={16} /> Crea ordine
          </button>
        )}
      </GuidedFooter>
    </>
  );
}
