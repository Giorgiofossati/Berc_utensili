import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, LayoutGrid, List, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useFilterStore } from '../../store/useFilterStore';

export default function UserSettingsModal({ isOpen, onClose }) {
  const currentUser = useAuthStore(state => state.currentUser);
  const [defaultView, setDefaultView] = useState('grid');

  useEffect(() => {
    if (currentUser) {
      const savedView = localStorage.getItem(`berc_viewMode_${currentUser.id}`);
      if (savedView) {
        setDefaultView(savedView);
      } else if (currentUser.ruolo === 'Admin') {
        setDefaultView('dropdown');
      } else {
        setDefaultView('grid');
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
      <DialogContent 
        showCloseButton={false}
        className="sm:max-w-md w-[94vw] glass-panel border border-slate-200/80 dark:border-white/10 dark:bg-slate-950/95 bg-white/95 backdrop-blur-2xl rounded-[28px] p-5 sm:p-6 shadow-2xl flex flex-col gap-6"
      >
        <div className="flex items-center justify-between gap-3 w-full pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Settings size={20} />
            </div>
            <DialogTitle className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Impostazioni Utente
            </DialogTitle>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="app-h3 text-slate-800 dark:text-slate-200 mb-1">Vista Principale</h3>
            <p className="app-body text-slate-500 dark:text-slate-400 mb-3">
              Scegli con quale schermata avviare l'applicazione. L'impostazione sarà memorizzata per il tuo profilo e applicata subito.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDefaultView('grid')}
                className={`flex flex-col items-center justify-center p-4 rounded-[16px] border-2 transition-all ${
                  defaultView === 'grid' 
                    ? 'border-accent-blue bg-accent-blue/5 text-accent-blue' 
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-500'
                }`}
              >
                <LayoutGrid size={24} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider">Griglia</span>
              </button>
              
              <button
                onClick={() => setDefaultView('dropdown')}
                className={`flex flex-col items-center justify-center p-4 rounded-[16px] border-2 transition-all ${
                  defaultView === 'dropdown' 
                    ? 'border-accent-blue bg-accent-blue/5 text-accent-blue' 
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-500'
                }`}
              >
                <List size={24} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider">Elenco</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className="action-btn action-btn-primary py-2.5 px-6 rounded-[14px] text-sm font-black tracking-wider"
          >
            SALVA IMPOSTAZIONI
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
