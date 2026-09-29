import { create } from 'zustand';
import { registerSW } from 'virtual:pwa-register';

export const usePwaStore = create((set, get) => ({
  needRefresh: false,
  offlineReady: false,
  isCheckingUpdate: false,
  isUpdating: false,
  lastCheckMessage: null,
  promptDismissed: false,
  updateFunction: null,
  registration: null,

  // Installazione PWA (Desktop & Mobile)
  deferredInstallPrompt: null,
  canInstall: false,
  isStandalone: false,
  isIOS: false,
  showIOSInstallGuide: false,
  installDismissed: typeof window !== 'undefined' ? Boolean(localStorage.getItem('berc_pwa_install_dismissed')) : false,

  initPwa: () => {
    // Inizializza rilevamento installazione PWA (Desktop & Mobile)
    get().initInstallPrompt();

    // Evita doppie registrazioni se già inizializzato
    if (get().updateFunction) return;

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('[PWA] Nuova versione pronta per l\'installazione');
          set({ needRefresh: true, promptDismissed: false });
        },
        onOfflineReady() {
          console.log('[PWA] Applicazione memorizzata per uso offline');
          set({ offlineReady: true });
        },
        onRegisteredSW(swScriptUrl, registration) {
          console.log('[PWA] Service Worker registrato:', swScriptUrl);
          set({ registration });

          if (registration) {
            // Controllo aggiornamenti quando l'app torna visibile (sblocco schermo o switch tab)
            const handleVisibility = () => {
              if (document.visibilityState === 'visible' && navigator.onLine) {
                registration.update().catch(err => {
                  console.debug('[PWA] Controllo aggiornamento in background fallito:', err);
                });
              }
            };

            document.addEventListener('visibilitychange', handleVisibility);
            window.addEventListener('focus', handleVisibility);

            // Controllo periodico ogni 15 minuti
            const intervalId = setInterval(() => {
              if (navigator.onLine) {
                registration.update().catch(err => {
                  console.debug('[PWA] Controllo periodico fallito:', err);
                });
              }
            }, 15 * 60 * 1000);

            // Pulizia all'unload
            window.addEventListener('beforeunload', () => {
              document.removeEventListener('visibilitychange', handleVisibility);
              window.removeEventListener('focus', handleVisibility);
              clearInterval(intervalId);
            });
          }
        },
        onRegisterError(error) {
          console.error('[PWA] Errore di registrazione del Service Worker:', error);
        },
      });

      set({ updateFunction: () => updateSW(true) });
    }
  },

  updateApp: async () => {
    const { updateFunction } = get();
    set({ isUpdating: true });
    if (updateFunction) {
      try {
        await updateFunction();
      } catch (err) {
        console.error('[PWA] Aggiornamento fallito, fallback reload:', err);
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  },

  checkForUpdate: async () => {
    const { registration, needRefresh } = get();
    if (needRefresh) return;

    set({ isCheckingUpdate: true, lastCheckMessage: null });
    try {
      if (registration) {
        await registration.update();
        // Breve attesa per permettere al browser di rilevare un eventuale worker in attesa
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const updatedNeedRefresh = get().needRefresh;
      if (!updatedNeedRefresh) {
        set({
          isCheckingUpdate: false,
          lastCheckMessage: "L'applicazione è già aggiornata all'ultima versione."
        });
      } else {
        set({ isCheckingUpdate: false });
      }
    } catch (err) {
      console.error('[PWA] Controllo aggiornamenti fallito:', err);
      set({
        isCheckingUpdate: false,
        lastCheckMessage: 'Impossibile verificare gli aggiornamenti al momento.'
      });
    }
  },

  dismissPrompt: () => {
    set({ promptDismissed: true });
  },

  reopenPrompt: () => {
    set({ promptDismissed: false });
  },

  initInstallPrompt: () => {
    if (typeof window === 'undefined') return;

    // Rileva se l'app è già installata / in esecuzione standalone (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    set({ isStandalone });

    if (isStandalone) {
      set({ canInstall: false });
      return;
    }

    // Rilevamento ambiente iOS (Safari non usa beforeinstallprompt ma richiede la guida manuale)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      set({ canInstall: true, isIOS: true });
    }

    // Listener standard per Chromium (Desktop Chrome/Edge, Android, Samsung Internet)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt intercettato con successo');
      set({ deferredInstallPrompt: e, canInstall: true });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Quando l'utente completa l'installazione
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] Applicazione installata con successo');
      set({ canInstall: false, isStandalone: true, deferredInstallPrompt: null });
    });
  },

  triggerInstall: async () => {
    const { deferredInstallPrompt, isIOS } = get();

    if (isIOS) {
      set({ showIOSInstallGuide: true });
      return { isIOS: true };
    }

    if (!deferredInstallPrompt) {
      // Fallback informativo per browser desktop/mobile non Chromium
      return { fallback: true };
    }

    try {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] Installazione accettata dall\'utente');
        set({ canInstall: false, deferredInstallPrompt: null });
        return { success: true };
      }
      console.log('[PWA] Installazione rifiutata dall\'utente');
      return { success: false, dismissed: true };
    } catch (err) {
      console.error('[PWA] Errore durante triggerInstall:', err);
      return { error: err };
    }
  },

  dismissInstall: () => {
    try {
      localStorage.setItem('berc_pwa_install_dismissed', 'true');
    } catch {
      // ignore storage access errors
    }
    set({ installDismissed: true });
  },

  setShowIOSInstallGuide: (show) => {
    set({ showIOSInstallGuide: show });
  },
}));
