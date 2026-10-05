// src/components/common/ShiftReminderBanner.jsx
// Banner in-app paracadute visivo per promemoria pezzi fine turno (HANDOFF Decisione 4)
import React, { useState, useEffect } from 'react';
import { Bell, Clock, ChevronRight, X } from 'lucide-react';
import {
  getCurrentShiftReminderInfo,
  wasPiecesSubmittedToday,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  checkAndTriggerShiftNotification
} from '@/lib/notifications';
import { useCommesseStore } from '@/store/useCommesseStore';
import { useMacchineStore } from '@/store/useMacchineStore';

export function ShiftReminderBanner({ setView }) {
  const commesse = useCommesseStore(s => s.commesse);
  const macchine = useMacchineStore(s => s.macchine);
  const [dismissed, setDismissed] = useState(false);
  const [permission, setPermission] = useState(getNotificationPermission());

  const info = getCurrentShiftReminderInfo();

  // Filtra lavorazioni attive con ciclo vita attivo per cui non sono stati registrati pezzi oggi
  const lavorazioniInAttesa = commesse.filter(c => {
    if (c.stato !== 'Attiva' || !c.traccia_ciclo_vita) return false;
    return !wasPiecesSubmittedToday(c.id);
  });

  // Arricchisci con nome macchina
  const lavorazioniConMacchina = lavorazioniInAttesa.map(c => {
    const macch = macchine.find(m => m.id === c.macchina_id);
    return {
      ...c,
      nome_macchina: macch?.nome || null
    };
  });

  // Trigger periodico per notifica Web
  useEffect(() => {
    if (lavorazioniConMacchina.length > 0) {
      checkAndTriggerShiftNotification(lavorazioniConMacchina, setView);
    }
    const interval = setInterval(() => {
      if (lavorazioniConMacchina.length > 0) {
        checkAndTriggerShiftNotification(lavorazioniConMacchina, setView);
      }
    }, 60000); // Controlla ogni minuto
    return () => clearInterval(interval);
  }, [lavorazioniConMacchina, setView]);

  if (dismissed || !info.isInReminderWindow || lavorazioniInAttesa.length === 0) {
    return null;
  }

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const machineSummary = [...new Set(lavorazioniConMacchina.map(c => c.nome_macchina || c.codice))].filter(Boolean).join(', ');

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-b border-amber-500/30 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-slate-800 dark:text-slate-200 text-xs sm:text-sm animate-in fade-in duration-300 z-30 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-accent-orange/20 border border-accent-orange/40 flex items-center justify-center shrink-0 text-accent-orange">
          <Clock size={16} className="animate-pulse" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="app-overline text-accent-orange">
              Fine Turno ({info.shiftLabel || 'Produzione'})
            </span>
            {machineSummary && (
              <span className="badge badge-orange py-0 px-1.5 hidden sm:inline-block">
                {machineSummary}
              </span>
            )}
          </div>
          <p className="truncate text-slate-600 dark:text-slate-300 text-xs">
            Pezzi prodotti oggi non ancora registrati per <strong className="text-slate-900 dark:text-white">{machineSummary || 'le lavorazioni attive'}</strong>.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isNotificationSupported() && permission === 'default' && (
          <button
            type="button"
            onClick={handleRequestPermission}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-background text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Ricevi avvisi di fine turno sul desktop"
          >
            <Bell size={13} className="text-accent-blue" />
            <span>Abilita avvisi</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setView('produzione')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-orange text-white font-bold text-xs hover:bg-accent-orange/90 shadow-xs transition-all cursor-pointer"
        >
          <span>Inserisci Pezzi</span>
          <ChevronRight size={14} />
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Ignora avviso per ora"
          title="Ignora avviso"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
