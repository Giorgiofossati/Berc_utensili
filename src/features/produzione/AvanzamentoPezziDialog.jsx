// src/features/produzione/AvanzamentoPezziDialog.jsx
// Modal Dialog per la registrazione rapida avanzamento pezzi fine turno (HANDOFF Decisione 3)
import React, { useState } from 'react';
import { PlusCircle, Cpu, FolderKanban, Check, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/dialog';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { useProduzioneStore } from '@/store/useProduzioneStore';
import { markPiecesSubmittedToday } from '@/lib/notifications';
import { cn } from '@/lib/utils';

export function AvanzamentoPezziDialog({ lavorazione, onClose, notify }) {
  const registraAvanzamentoLavorazione = useProduzioneStore(s => s.registraAvanzamentoLavorazione);
  const isSubmitting = useProduzioneStore(s => s.isSubmitting);
  const [quantita, setQuantita] = useState(4); // Default tipico di turno CNC (es. 4 pz)
  const [error, setError] = useState(null);

  if (!lavorazione) return null;

  const currentPezzi = lavorazione.pezziCompletati ?? lavorazione.pezzi_completati ?? 0;
  const targetPezzi = lavorazione.targetPezziLotto ?? lavorazione.target_pezzi_lotto;
  const nuovoTotale = currentPezzi + quantita;
  const pct = targetPezzi ? Math.min(100, Math.round((nuovoTotale / targetPezzi) * 100)) : null;

  const RAPIDI = [1, 2, 4, 8, 10];

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (quantita <= 0) return;
    setError(null);

    const idCommessa = lavorazione.idCommessa || lavorazione.id_commessa || lavorazione.id;
    const res = await registraAvanzamentoLavorazione({
      idCommessa,
      pezziAggiunti: quantita
    });

    if (res.success) {
      markPiecesSubmittedToday(idCommessa);
      notify?.({
        type: 'success',
        message: `Registrati +${quantita} pz su ${lavorazione.titolo || lavorazione.nomeLavorazione || lavorazione.codiceCommessa || 'lavorazione'}.`
      });
      onClose();
    } else {
      setError(res.error?.message || 'Errore durante la registrazione dei pezzi');
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open && !isSubmitting) onClose(); }}>
      <DialogContent size="md">
        <ModalHeader
          icon={<PlusCircle size={24} className="text-accent-blue" />}
          title="Avanzamento Fine Turno"
          overline="Produzione CNC"
        />
        <ModalBody>
          <form id="avanzamento-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span className="font-bold">{error}</span>
              </div>
            )}

            {/* Scheda Lavorazione Target */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderKanban size={16} className="text-accent-blue shrink-0" />
                  <span className="font-bold text-sm text-foreground truncate">
                    {lavorazione.nomeLavorazione || lavorazione.titolo || 'Lavorazione'}
                  </span>
                </div>
                {lavorazione.codiceCommessa && (
                  <span className="font-mono text-xs text-muted-foreground shrink-0 bg-background px-2 py-0.5 rounded border border-border">
                    {lavorazione.codiceCommessa}
                  </span>
                )}
              </div>

              {lavorazione.nomeMacchina && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Cpu size={13} className="text-accent-orange" />
                  <span>Macchina: <strong className="text-foreground">{lavorazione.nomeMacchina}</strong></span>
                </div>
              )}

              {/* Barra progresso target lotto */}
              {targetPezzi && (
                <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Progresso lotto:</span>
                    <span className="text-foreground">
                      {currentPezzi} <span className="text-accent-blue">+{quantita}</span> / {targetPezzi} pz ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="bg-slate-400 dark:bg-slate-600 h-full transition-all"
                      style={{ width: `${Math.min(100, Math.round((currentPezzi / targetPezzi) * 100))}%` }}
                    />
                    <div 
                      className="bg-accent-blue h-full transition-all"
                      style={{ width: `${Math.min(100 - Math.min(100, Math.round((currentPezzi / targetPezzi) * 100)), Math.round((quantita / targetPezzi) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Selezione Rapida (Fitts Law) */}
            <div className="flex flex-col gap-2">
              <label className="app-label text-foreground">
                Pezzi finiti usciti oggi dalla macchina:
              </label>
              
              <div className="grid grid-cols-5 gap-2">
                {RAPIDI.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setQuantita(val)}
                    className={cn(
                      "py-2.5 rounded-xl font-mono text-sm font-bold border transition-all cursor-pointer flex items-center justify-center",
                      quantita === val
                        ? "border-accent-blue bg-accent-blue/15 text-accent-blue shadow-xs"
                        : "border-border hover:bg-accent-blue/[0.06] text-foreground"
                    )}
                  >
                    +{val}
                  </button>
                ))}
              </div>

              {/* Stepper di precisione */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
                <span className="text-xs text-muted-foreground">Oppure specifica quantità:</span>
                <QuantityStepper
                  value={quantita}
                  onChange={setQuantita}
                  min={1}
                  max={500}
                />
              </div>
            </div>

            <p className="app-caption text-muted-foreground text-center">
              💡 Tutti gli utensili montati su questa lavorazione riceveranno automaticamente +{quantita} pz nel loro contatore di usura.
            </p>
          </form>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Annulla
          </button>
          <button
            type="submit"
            form="avanzamento-form"
            disabled={isSubmitting || quantita <= 0}
            className="action-btn action-btn-primary px-6 py-2 rounded-xl text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={16} />
            <span>{isSubmitting ? 'Registrazione...' : `Registra +${quantita} Pezzi`}</span>
          </button>
        </ModalFooter>
      </DialogContent>
    </Dialog>
  );
}
