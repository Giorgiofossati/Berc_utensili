import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
                  <span className="text-xs font-bold uppercase tracking-wider">Griglia</span>
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
                  <span className="text-xs font-bold uppercase tracking-wider">Elenco</span>
                </button>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            onClick={handleSave}
            className="action-btn action-btn-primary py-2.5 px-6 rounded-xl text-sm font-black tracking-wider"
          >
            SALVA IMPOSTAZIONI
          </button>
        </ModalFooter>
      </DialogContent>
    </Dialog>
  );
}
