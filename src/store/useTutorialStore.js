import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const TUTORIAL_STEPS = [
  {
    id: 'catalog-categories',
    target: '[data-tour="catalog-categories"]',
    title: 'Catalogo & Tipologie Utensili',
    content: 'Seleziona la famiglia di utensili (Frese, Punte, Maschi, Inserti...) per accedere ai diametri e alle schede tecniche in magazzino.',
    placement: 'bottom'
  },
  {
    id: 'view-mode-toggle',
    target: '[data-tour="view-mode-toggle"]',
    title: 'Cambio Vista: Griglia o Elenco',
    content: 'Passa dalla vista a icone alla tabella compatta con filtri dinamici a cascata per diametri, forme e materiali. Prova subito a cambiare vista qui sotto!',
    placement: 'bottom',
    interactive: true
  },
  {
    id: 'search-tools',
    target: '[data-tour="search-tools"]',
    title: 'Ricerca Rapida & Scorciatoie',
    content: 'Trova qualsiasi utensile digitando codice, nome o diametro. Puoi usare anche la scorciatoia da tastiera ⌘K.',
    placement: 'right'
  },
  {
    id: 'quick-actions',
    target: '[data-tour="quick-actions"]',
    title: 'Azioni Rapide: Deposita & Preleva',
    content: 'Registra i movimenti di magazzino in un tocco: PRELEVA per scaricare l\'utensile per la macchina CNC, DEPOSITA per caricarlo.',
    placement: 'right'
  },
  {
    id: 'menu-history',
    target: '[data-tour="menu-history"]',
    title: 'Storico Movimenti & Supporto',
    content: 'Controlla tutti i log delle operazioni effettuate con data e operatore. Da qui puoi anche riavviare questo tutorial in qualsiasi momento.',
    placement: 'top'
  },
  {
    id: 'user-profile',
    target: '[data-tour="user-profile"]',
    title: 'Profilo Utente & Privilegi',
    content: 'Verifica il tuo account e ruolo attivo (Operatore o Admin). Il pallino verde indica che sei autenticato e operativo nel sistema.',
    placement: 'top'
  },
  {
    id: 'user-logout',
    target: '[data-tour="user-logout"]',
    title: 'Fine Turno & Logout',
    content: 'A fine turno, usa questo tasto per disconnetterti in sicurezza e lasciare il gestionale pronto per il login del collega successivo.',
    placement: 'top'
  }
];

export const useTutorialStore = create((set, get) => ({
  isOpen: false,
  currentStep: 0,
  steps: TUTORIAL_STEPS,

  startTutorial: () => set({ isOpen: true, currentStep: 0 }),
  
  closeTutorial: () => set({ isOpen: false }),

  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      set({ isOpen: false });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  goToStep: (index) => {
    const { steps } = get();
    if (index >= 0 && index < steps.length) {
      set({ currentStep: index });
    }
  },

  completeTutorial: async (currentUser, setCurrentUser) => {
    set({ isOpen: false });
    if (!currentUser) return;

    // 1. Salva localmente subito per massima reattività
    try {
      localStorage.setItem(`berc_tutorial_completed_${currentUser.id}`, 'true');
    } catch (e) {
      console.warn('Impossibile salvare flag tutorial in localStorage:', e);
    }

    // 2. Aggiorna lo stato auth locale
    if (setCurrentUser) {
      setCurrentUser({
        ...currentUser,
        has_completed_tutorial: true
      });
    }

    // 3. Persisti su database Supabase (tabella utenti)
    try {
      const { error } = await supabase
        .from('utenti')
        .update({ has_completed_tutorial: true })
        .eq('id', currentUser.id);

      if (error) {
        // Se la colonna non esiste ancora nel DB Supabase, non blocchiamo l'app
        console.warn('Nota Supabase has_completed_tutorial (potrebbe richiedere esecuzione script SQL):', error.message);
      }
    } catch (err) {
      console.warn('Errore aggiornamento flag tutorial su Supabase:', err);
    }
  }
}));
