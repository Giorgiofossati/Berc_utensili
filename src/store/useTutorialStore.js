import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useNavigationStore } from './useNavigationStore';
import { useFilterStore } from './useFilterStore';
import { useAuthStore } from './useAuthStore';

export const TUTORIAL_STEPS = [
  {
    id: 'catalog-categories',
    target: '[data-tour="catalog-categories"]',
    title: 'Catalogo & Tipologie Utensili',
    content: 'Tocca una tipologia (FRESA, PUNTA, MASCHIO, INSERTO...) per scendere a forma e diametro e consultare le schede tecniche in magazzino.',
    placement: 'bottom',
    targetView: 'home',
    resetFilters: true,
    viewMode: 'grid',
    requireSidebar: false
  },
  {
    id: 'search-tools',
    target: '[data-tour="search-tools"]',
    title: 'Ricerca Rapida & Barcode',
    content: 'Trova all\'istante qualsiasi utensile digitando codice aziendale, matricola o misura (es. D16). Puoi usare la fotocamera per scansionare il codice a barre o la scorciatoia da tastiera (Ctrl/⌘+K).',
    placement: 'bottom',
    targetView: 'home',
    requireSidebar: false
  },
  {
    id: 'view-mode-toggle',
    target: '[data-tour="view-mode-toggle"]',
    title: 'Vista Schede o Tabella con Filtri',
    content: 'Alterna a piacimento tra la vista a schede visive (ideale su touch e tablet) e la tabella dati compatta con filtri dinamici a tendina per ricerche avanzate.',
    placement: 'bottom',
    targetView: 'home',
    requireSidebar: false
  },
  {
    id: 'quick-actions',
    target: '[data-tour="quick-actions"]',
    title: 'Operazioni & Richieste Rapide',
    content: 'Registra i movimenti con un tocco: DEPOSITA carica l\'utensile a magazzino, PRELEVA lo scarica per la macchina CNC o invia una richiesta guidata per il turno.',
    placement: 'right',
    targetView: 'home',
    requireSidebar: true
  },
  {
    id: 'multimovement-nav',
    target: '[data-tour="multimovement-nav"]',
    title: 'Movimento Multiplo a Distinta',
    content: 'Compila una distinta per prelevare o depositare più utensili contemporaneamente, associandoli alla Commessa e Macchina CNC con controllo atomico delle giacenze.',
    placement: 'right',
    targetView: 'home',
    requireSidebar: true
  },
  {
    id: 'commesse-produzione-nav',
    target: '[data-tour="commesse-nav"], [data-tour="produzione-nav"], [data-tour="requests-nav"]',
    title: 'Commesse, Produzione & Richieste',
    content: 'Monitora le commesse aperte, le macchine collegate e lo stato degli utensili attualmente montati a bordo macchina o inviati a riaffilatura.',
    placement: 'right',
    targetView: 'home',
    requireSidebar: true
  },
  {
    id: 'menu-history',
    target: '[data-tour="history-nav"]',
    title: 'Storico Movimenti & Audit Log',
    content: 'Consulta la cronologia completa di ogni carico, scarico e rettifica con data, ora, operatore, causale e variazioni di magazzino in tempo reale.',
    placement: 'right',
    targetView: 'home',
    requireSidebar: true
  },
  {
    id: 'help-and-profile',
    target: '[data-tour="help-nav"], [data-tour="user-profile"]',
    title: 'Guida & Impostazioni Profilo',
    content: 'Dalla voce Guida puoi riavviare questo tutorial in qualsiasi momento. Dal tuo profilo gestisci il tema chiaro/scuro e le preferenze personali.',
    placement: 'right',
    targetView: 'home',
    requireSidebar: true
  }
];

export const useTutorialStore = create((set, get) => ({
  isOpen: false,
  currentStep: 0,
  steps: TUTORIAL_STEPS,
  savedState: null,

  startTutorial: () => {
    const currentView = useNavigationStore.getState().currentView;
    const viewMode = useFilterStore.getState().viewMode;
    const { steps } = get();
    const firstStep = steps[0];

    if (firstStep) {
      if (firstStep.targetView && useNavigationStore.getState().currentView !== firstStep.targetView) {
        useNavigationStore.getState().setCurrentView(firstStep.targetView);
      }
      if (firstStep.resetFilters) {
        useFilterStore.getState().resetFilters();
      }
      if (firstStep.viewMode && useFilterStore.getState().viewMode !== firstStep.viewMode) {
        useFilterStore.getState().setViewMode(firstStep.viewMode);
      }
    }

    // Assicura che la sidebar mobile parta chiusa per lo step iniziale
    useNavigationStore.getState().setMobileSidebarOpen(false);

    set({
      isOpen: true,
      currentStep: 0,
      savedState: { currentView, viewMode }
    });
  },
  
  closeTutorial: () => {
    const { savedState } = get();
    useNavigationStore.getState().setMobileSidebarOpen(false);
    set({ isOpen: false });
    if (savedState?.currentView) {
      useNavigationStore.getState().setCurrentView(savedState.currentView);
    }
  },

  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      get().completeTutorial(useAuthStore.getState().currentUser);
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

  completeTutorial: async (currentUser) => {
    useNavigationStore.getState().setMobileSidebarOpen(false);
    set({ isOpen: false });
    if (!currentUser) return;

    // 1. Aggiorna lo stato auth locale senza resettare altre preferenze (es. viewMode)
    useAuthStore.getState().completeTutorial();

    try {
      localStorage.setItem(`berc_tutorial_completed_${currentUser.id}`, 'true');
    } catch { /* ignore */ }

    // 2. Persisti su database Supabase (tabella utenti)
    try {
      const { error } = await supabase
        .from('utenti')
        .update({ has_completed_tutorial: true })
        .eq('id', currentUser.id);

      if (error) {
        console.warn('Nota Supabase has_completed_tutorial:', error.message);
      }
    } catch (err) {
      console.warn('Errore aggiornamento flag tutorial su Supabase:', err);
    }
  }
}));
