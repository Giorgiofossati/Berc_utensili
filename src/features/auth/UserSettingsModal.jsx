import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { LayoutGrid, List, Settings, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useFilterStore } from '../../store/useFilterStore';
import { usePwaStore } from '../../store/usePwaStore';

export default function UserSettingsModal({ isOpen, onClose }) {
  const currentUser = useAuthStore(state => state.currentUser);
  const [defaultView, setDefaultView] = useState('dropdown');

  const needRefresh = usePwaStore(state => state.needRefresh);
  const isUpdating = usePwaStore(state => state.isUpdating);
  const isCheckingUpdate = usePwaStore(state => state.isCheckingUpdate);
  const lastCheckMessage = usePwaStore(state => state.lastCheckMessage);
  const updateApp = usePwaStore(state => state.updateApp);
  const checkForUpdate = usePwaStore(state => state.checkForUpdate);

  useEffect(() => {
    if (currentUser) {
      const savedView = localStorage.getItem(`berc_viewMode_${currentUser.id}`);
      if (savedView) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDefaultView(savedView);
      } else {
        setDefaultView('dropdown');
      }
    }
  }, [currentUser]);

  const handleSave = () => {
    if (currentUser) {
      localStorage.setItem(`berc_viewMode_${currentUser.id}`, defaultView);
      useFilterStore.getState().setViewMode(defaultView);
    }
    onClose();
  };

  if (!currentUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md" className="p-0 gap-0 overflow-hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border dark:border-white/10 border-slate-900/10 shadow-2xl focus:outline-none">
        <ModalHeader 
          icon={<Settings size={20} className="text-accent-blue" />}
          title="Impostazioni Utente"
          subtitle="Scegli con quale schermata avviare l'applicazione."
          className="bg-accent-blue/5"
        />

        <ModalBody>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="app-h3 text-slate-800 dark:text-slate-200 mb-2">Vista Principale</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDefaultView('grid')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    defaultView === 'grid' 
                      ? 'border-accent-blue bg-accent-blue/5 text-accent-blue' 
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-500'
                  }`}
                >
                  <LayoutGrid size={24} className="mb-2" />
                  <span className="text-xs font-bold tracking-wider">Griglia</span>
                </button>
                
                <button
                  onClick={() => setDefaultView('dropdown')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    defaultView === 'dropdown' 
                      ? 'border-accent-blue bg-accent-blue/5 text-accent-blue' 
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-500'
                  }`}
                >
                  <List size={24} className="mb-2" />
                  <span className="text-xs font-bold tracking-wider">Elenco</span>
                </button>
              </div>
            </div>

            {/* Sezione Versione e Aggiornamenti PWA */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="app-h3 text-slate-800 dark:text-slate-200">Aggiornamenti & Versione</h3>
                  <p className="app-body text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Verifica disponibilità di nuove versioni o forza l'aggiornamento dell'applicazione.
                  </p>
                </div>
                {needRefresh && (
                  <span className="badge badge-emerald text-[11px] font-bold">
                    Nuova versione pronta
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {needRefresh ? (
                  <button
                    type="button"
                    onClick={updateApp}
                    disabled={isUpdating}
                    className="action-btn action-btn-primary py-2.5 px-4 rounded-xl text-xs font-black tracking-wider flex items-center justify-center gap-2 flex-1 shadow-sm cursor-pointer"
                  >
                    <RefreshCw size={14} className={isUpdating ? 'animate-spin' : ''} />
                    <span>{isUpdating ? 'Aggiornamento in corso…' : 'Aggiorna ora alla nuova versione'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={checkForUpdate}
                    disabled={isCheckingUpdate}
                    className="glass-button py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-2 flex-1 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <RefreshCw size={14} className={isCheckingUpdate ? 'animate-spin text-accent-blue' : ''} />
                    <span>{isCheckingUpdate ? 'Controllo in corso…' : 'Controlla aggiornamenti ora'}</span>
                  </button>
                )}
              </div>

              {lastCheckMessage && !needRefresh && (
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 size={13} />
                  <span>{lastCheckMessage}</span>
                </p>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            onClick={handleSave}
            className="action-btn action-btn-primary py-2.5 px-6 rounded-xl text-sm font-black tracking-wider"
          >
            Salva Impostazioni
          </button>
        </ModalFooter>
      </DialogContent>
    </Dialog>
  );
}
