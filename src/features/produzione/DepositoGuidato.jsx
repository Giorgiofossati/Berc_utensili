import React, { useEffect, useState } from 'react';
import { AlertTriangle, Archive, MapPin } from 'lucide-react';
import { ModalBody } from '@/components/ui/dialog';
import { GuidedStep } from '@/components/ui/guided-step';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { StateBlock } from '@/components/common/StateBlock';
import { useProduzioneStore } from '@/store/useProduzioneStore';
import { CommessaPicker } from './CommessaPicker';
import { StatoPicker } from './StatoPicker';
import { GuidedFooter } from './GuidedFooter';
import { ETICHETTE_STATO } from './lifecycleSelectors';

const SCORTA_COMUNE = '__scorta__';
const STATI_DEPOSITO = ['nuovo', 'usato', 'riaffilato'];

// Secondo passo del modale utensile quando l'operatore sceglie DEPOSITA.
// Chiede per quale commessa sono (→ cassetto dedicato) o se vanno nella scorta comune, e mostra dove metterli.
export function DepositoGuidato({ tool, onBack, onDone, notify }) {
  const { opzioni, error } = useProduzioneStore(s => s.deposito);
  const loadOpzioniDeposito = useProduzioneStore(s => s.loadOpzioniDeposito);
  const deposita = useProduzioneStore(s => s.deposita);
  const annullaOperazione = useProduzioneStore(s => s.annullaOperazione);
  const isSubmitting = useProduzioneStore(s => s.isSubmitting);

  const [commessaToccata, setCommessa] = useState();
  const [commessaCercata, setCommessaCercata] = useState(null);
  const [stato, setStato] = useState('nuovo');
  const [quantitaToccata, setQuantita] = useState();
  const [erroreInvio, setErroreInvio] = useState(null);
  const [idOperazione, setIdOperazione] = useState(null);

  useEffect(() => {
    loadOpzioniDeposito(tool.id);
  }, [tool.id, loadOpzioniDeposito]);

  const pronto = opzioni?.utensile?.id === tool.id;
  const ordine = pronto ? opzioni.ordine_aperto : null;

  // Se c'è un ordine aperto si propongono la sua commessa e la sua quantità, finché l'operatore non sceglie altro.
  const commessa = commessaToccata !== undefined ? commessaToccata : (pronto ? (ordine?.id_commessa || SCORTA_COMUNE) : undefined);
  const quantita = quantitaToccata ?? ordine?.quantita_richiesta ?? 1;

  const commesse = pronto ? opzioni.commesse_attive : [];
  const idCommessa = commessa && commessa !== SCORTA_COMUNE ? commessa : null;
  const scelta = idCommessa
    ? (commesse.find(c => c.id === idCommessa) || (commessaCercata?.id === idCommessa ? { ...commessaCercata, ubicazione_cassetto: commessaCercata.ubicazione, pezzi_nel_cassetto: null } : null))
    : null;

  const destinazione = idCommessa
    ? {
        titolo: `Cassetto ${scelta?.codice ?? ''}`.trim(),
        dettaglio: scelta?.ubicazione_cassetto || null,
        nota: scelta?.pezzi_nel_cassetto != null
          ? (scelta.pezzi_nel_cassetto > 0 ? `riservati a questa commessa · già ${scelta.pezzi_nel_cassetto} pz dentro` : 'riservati a questa commessa · vuoto')
          : 'riservati a questa commessa',
        manca: !scelta?.ubicazione_cassetto
      }
    : {
        titolo: opzioni?.utensile?.ubicazione || 'Magazzino generale',
        dettaglio: null,
        nota: 'scorta comune · ubicazione abituale dell’articolo',
        manca: false
      };

  const ordineCoerente = ordine && (ordine.id_commessa || null) === idCommessa;
  const puoConfermare = commessa !== undefined && quantita >= 1 && !isSubmitting;
  const riepilogo = commessa !== undefined ? `${quantita} × ${ETICHETTE_STATO[stato]} → ${destinazione.titolo}` : null;

  const scegliCommessa = (id, item) => {
    setCommessa(id);
    if (item && !commesse.some(c => c.id === id)) setCommessaCercata(item);
    setErroreInvio(null);
    setIdOperazione(null);
  };

  const conferma = async () => {
    if (!puoConfermare) return;
    setErroreInvio(null);
    const res = await deposita({
      idUtensile: tool.id,
      quantita,
      stato,
      idCommessa,
      idOrdine: ordineCoerente ? ordine.id : null
    }, { idOperazione: idOperazione ?? undefined, descrizione: riepilogo });

    if (res.success) {
      onDone?.();
      notify?.({
        type: 'success',
        message: `Depositato: ${riepilogo}`,
        onUndo: async () => {
          const undo = await annullaOperazione(res.idOperazione);
          notify?.(undo.success ? 'Deposito annullato.' : undo.error.message, undo.success ? 'success' : 'error');
        }
      });
      return;
    }
    setIdOperazione(res.error.isNetwork ? res.idOperazione : null);
    setErroreInvio(res.error.message);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter' || e.target.closest?.('button, input, textarea, select, a')) return;
      e.preventDefault();
      conferma();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (!pronto) {
    return (
      <>
        <ModalBody>
          {error
            ? <StateBlock state="error" title="Non riesco a caricare le opzioni di deposito" error={error.message} onRetry={() => loadOpzioniDeposito(tool.id)} />
            : <StateBlock state="loading" skeletonShape="row" count={3} title="Preparo il deposito…" />}
        </ModalBody>
        <GuidedFooter onBack={onBack} />
      </>
    );
  }

  return (
    <>
      <ModalBody className="flex flex-col gap-6">
        <GuidedStep number={1} done={commessa !== undefined} title="Sono stati comprati per una commessa?">
          <CommessaPicker
            label="Commessa"
            value={commessa}
            onChange={scegliCommessa}
            noneOption={{ id: SCORTA_COMUNE, label: 'No, scorta comune' }}
            nonePosition="start"
            items={commesse.map(c => ({ id: c.id, codice: c.codice, descrizione: c.descrizione }))}
          />
          {ordine?.codice_commessa && (
            <p className="mt-2.5 app-body text-muted-foreground">
              Proposta dall&apos;ordine aperto: questo articolo era stato ordinato per la {ordine.codice_commessa}.
            </p>
          )}
        </GuidedStep>

        <GuidedStep number={2} done={commessa !== undefined} title="Dove li metti?">
          <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-[var(--radius-card,16px)] border border-accent-blue/35 bg-accent-blue/[0.06]">
            <div className="w-11 h-11 rounded-[var(--radius-control,12px)] bg-accent-blue/15 text-accent-blue flex items-center justify-center shrink-0">
              {idCommessa ? <Archive size={20} /> : <MapPin size={20} />}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="app-h3 truncate">
                {destinazione.titolo}{destinazione.dettaglio ? ` · ${destinazione.dettaglio}` : ''}
              </span>
              <span className="app-body text-muted-foreground">{destinazione.nota}</span>
            </div>
          </div>
          {destinazione.manca && (
            <p className="mt-2.5 app-body text-accent-orange flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-px" />
              Questa commessa non ha ancora un cassetto assegnato: impostalo nella sezione Commesse (campo Ubicazione).
            </p>
          )}
        </GuidedStep>

        <GuidedStep number={3} done={quantita >= 1} title="Quanti sono?">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <StatoPicker className="flex-1" value={stato} onChange={setStato} ordine={STATI_DEPOSITO} />
            <QuantityStepper value={quantita} onChange={setQuantita} className="max-sm:justify-between" />
          </div>
          {ordineCoerente && (
            <p className="mt-2.5 app-body text-muted-foreground">
              Dall&apos;ordine ne aspettavi {ordine.quantita_richiesta}
              {quantita >= ordine.quantita_richiesta ? ': l’ordine verrà segnato come completato.' : '.'}
            </p>
          )}
        </GuidedStep>
      </ModalBody>

      <GuidedFooter
        onBack={onBack}
        onConfirm={conferma}
        confirmLabel={idOperazione ? 'Riprova deposito' : 'Conferma deposito'}
        tone="carica"
        disabled={!puoConfermare}
        isSubmitting={isSubmitting}
        riepilogo={riepilogo}
        errore={erroreInvio}
      />
    </>
  );
}
