import React, { useState } from 'react';
import { AlertTriangle, Check, Trash2 } from 'lucide-react';
import { ChoiceChip, ChoiceChipGroup } from '@/components/ui/choice-chip';
import { GuidedStep } from '@/components/ui/guided-step';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { cn } from '@/lib/utils';
import { useProduzioneStore } from '@/store/useProduzioneStore';
import { GuidedFooter } from './GuidedFooter';

const chiave = (r) => `${r.id_utensile}|${r.n_riaffilature}`;

// Rientro di una spedizione dal fornitore, in due passi (nota di Giorgio sul prototipo):
// 1. "Sono tutti riutilizzabili?" — i contatori degli scarti restano nascosti finché non si risponde "No".
// 2. "Dove li metti?" — proposto il posto di sempre (cassetto della commessa o scaffale dell'articolo).
// `precompilato` (da "Correggi il rientro") riporta gli scarti della registrazione precedente.
export function RientroGuidato({ spedizione, precompilato, onChiudi, notify }) {
  const rientraSpedizione = useProduzioneStore(s => s.rientraSpedizione);
  const annullaOperazione = useProduzioneStore(s => s.annullaOperazione);
  const isSubmitting = useProduzioneStore(s => s.isSubmitting);

  const righe = spedizione.righe;
  const scartiIniziali = Object.fromEntries(righe.map(r => [r.id_posizione, Math.min(r.quantita, precompilato?.[chiave(r)] ?? 0)]));
  const conScartiIniziali = Object.values(scartiIniziali).some(n => n > 0);

  const [passo, setPasso] = useState(conScartiIniziali ? 'scarti' : 'domanda');
  const [scarti, setScarti] = useState(scartiIniziali);
  const [dest, setDest] = useState(() => Object.fromEntries(righe.map(r => [
    r.id_posizione, r.id_commessa && r.commessa_attiva ? 'cassetto' : 'magazzino'
  ])));
  const [errore, setErrore] = useState(null);
  const [idOperazione, setIdOperazione] = useState(null);

  const totale = righe.reduce((a, r) => a + r.quantita, 0);
  const buttati = righe.reduce((a, r) => a + (scarti[r.id_posizione] || 0), 0);
  const buoni = totale - buttati;
  const nomeSpedizione = spedizione.ddt ? `DDT ${spedizione.ddt}` : 'la spedizione';

  const conferma = async () => {
    setErrore(null);
    const payload = righe.map(r => ({
      id_posizione: r.id_posizione,
      scartati: scarti[r.id_posizione] || 0,
      destinazione: dest[r.id_posizione] === 'cassetto'
        ? { luogo: 'cassetto', id_commessa: r.id_commessa }
        : { luogo: 'magazzino', id_commessa: null }
    }));
    const res = await rientraSpedizione(spedizione.id, payload, { idOperazione: idOperazione ?? undefined });
    if (!res.success) {
      setIdOperazione(res.error.isNetwork ? res.idOperazione : null);
      setErrore(res.error.message);
      return;
    }
    onChiudi();
    notify?.({
      type: 'success',
      message: `Rientrata ${nomeSpedizione}: ${res.data.buoni} riposti${res.data.scartati ? `, ${res.data.scartati} buttati` : ''}.`,
      onUndo: async () => {
        const undo = await annullaOperazione(res.idOperazione);
        notify?.(undo.success ? 'Rientro annullato: la spedizione è di nuovo in viaggio.' : undo.error.message, undo.success ? 'success' : 'error');
      }
    });
  };

  return (
    <div className="border-t border-border">
      <div className="p-4 sm:p-5 flex flex-col gap-5">
        {passo === 'domanda' && (
          <GuidedStep number={1} title={`Apri il pacco e guarda i ${totale} pezzi: sono tutti riutilizzabili?`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPasso('posto')}
                className="min-h-14 px-4 rounded-[var(--radius-card,16px)] border-[1.5px] border-accent-emerald/50 bg-accent-emerald/[0.08] hover:bg-accent-emerald/[0.14] text-foreground font-extrabold flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
              >
                <Check size={18} className="text-accent-emerald" /> Sì, sono tutti buoni
              </button>
              <button
                type="button"
                onClick={() => setPasso('scarti')}
                className="min-h-14 px-4 rounded-[var(--radius-card,16px)] border-[1.5px] border-accent-rose/50 bg-accent-rose/[0.06] hover:bg-accent-rose/[0.12] text-foreground font-extrabold flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
              >
                <Trash2 size={18} className="text-accent-rose" /> No, qualcuno è da buttare
              </button>
            </div>
          </GuidedStep>
        )}

        {passo === 'scarti' && (
          <GuidedStep number={1} title="Quanti ne butti?" hint="tocca + sui pezzi rovinati">
            <ul className="flex flex-col">
              {righe.map(r => {
                const n = scarti[r.id_posizione] || 0;
                return (
                  <li key={r.id_posizione} className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-t border-border/60 first:border-t-0">
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="app-h3 truncate">{r.descrizione}</span>
                      <span className="app-body text-muted-foreground">
                        {r.quantita} pz · <span className="text-accent-emerald font-bold">{r.quantita - n} buoni</span>
                        {n > 0 && <span className="text-accent-rose font-bold"> · {n} da buttare</span>}
                      </span>
                    </div>
                    <QuantityStepper
                      value={n}
                      min={0}
                      max={r.quantita}
                      label="Da buttare"
                      onChange={(v) => setScarti(s => ({ ...s, [r.id_posizione]: v }))}
                      className="max-sm:justify-between"
                    />
                  </li>
                );
              })}
            </ul>
          </GuidedStep>
        )}

        {passo === 'posto' && (
          <GuidedStep number={2} title="Dove li metti?" hint="già proposto il posto di sempre">
            {buoni === 0 ? (
              <p className="app-body text-muted-foreground">Nessun pezzo da riporre: sono tutti da buttare.</p>
            ) : (
              <ul className="flex flex-col">
                {righe.filter(r => r.quantita - (scarti[r.id_posizione] || 0) > 0).map(r => {
                  const sani = r.quantita - (scarti[r.id_posizione] || 0);
                  const prossima = (r.n_riaffilature ?? 0) + 1;
                  const ultima = prossima >= (r.max_riaffilature ?? 3);
                  const puoCassetto = r.id_commessa && r.commessa_attiva;
                  return (
                    <li key={r.id_posizione} className="py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 border-t border-border/60 first:border-t-0">
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className="app-h3 truncate">{r.descrizione} <span className="text-accent-emerald">· {sani} buoni</span></span>
                        <span className={cn('app-body', ultima ? 'text-accent-orange font-semibold' : 'text-muted-foreground')}>
                          {prossima}ª riaffilatura{ultima ? ' · la prossima volta va buttato' : ''}
                          {r.codice_commessa ? ` · era della commessa ${r.codice_commessa}` : ''}
                        </span>
                      </div>
                      <ChoiceChipGroup label={`Dove mettere ${r.descrizione}`} className="shrink-0">
                        {puoCassetto && (
                          <ChoiceChip selected={dest[r.id_posizione] === 'cassetto'} onClick={() => setDest(d => ({ ...d, [r.id_posizione]: 'cassetto' }))}>
                            Cassetto {r.codice_commessa}
                          </ChoiceChip>
                        )}
                        <ChoiceChip selected={dest[r.id_posizione] === 'magazzino'} onClick={() => setDest(d => ({ ...d, [r.id_posizione]: 'magazzino' }))}>
                          {r.ubicazione_abituale || 'Magazzino'}
                        </ChoiceChip>
                      </ChoiceChipGroup>
                    </li>
                  );
                })}
              </ul>
            )}
          </GuidedStep>
        )}

        {errore && (
          <p role="alert" className="app-body text-accent-rose flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-px" /> {errore}
          </p>
        )}
      </div>

      {passo !== 'domanda' && (
        <GuidedFooter
          onBack={() => setPasso(passo === 'posto' && buttati > 0 ? 'scarti' : 'domanda')}
          onConfirm={passo === 'scarti' ? () => setPasso('posto') : conferma}
          confirmLabel={passo === 'scarti' ? 'Avanti' : (idOperazione ? 'Riprova' : `Conferma rientro · ${buoni} pz`)}
          tone="carica"
          disabled={isSubmitting}
          isSubmitting={isSubmitting}
          riepilogo={`${buoni} buoni${buttati ? ` · ${buttati} da buttare` : ''}`}
        />
      )}
    </div>
  );
}
