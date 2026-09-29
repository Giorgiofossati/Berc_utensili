import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Plus, RefreshCw, Pencil, Trash2, X, Wrench, AlertTriangle, AlertCircle, MapPin, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { PageTemplate, PageHeader, PageToolbar, PageContent, ResetFiltersButton } from '@/components/layout/PageTemplate';
import { StateBlock } from '@/components/common/StateBlock';
import { IconButton, IconMenu } from '@/components/ui/icon-button';
import { useMacchineStore } from '../../store/useMacchineStore';
import { useProduzioneStore } from '../../store/useProduzioneStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '@/lib/utils';
import { ETICHETTE_STATO } from '../produzione/lifecycleSelectors';

const BADGE_STATO = { nuovo: 'badge-emerald', usato: 'badge-slate', riaffilato: 'badge-blue' };

export default function MachinesView({ setView, showToastNotification }) {
  const currentUser = useAuthStore(state => state.currentUser);
  const isAdmin = currentUser?.ruolo === 'Admin';

  const macchine = useMacchineStore(state => state.macchine);
  const isLoading = useMacchineStore(state => state.isLoading);
  const error = useMacchineStore(state => state.error);
  const fetchMacchine = useMacchineStore(state => state.fetchMacchine);
  const createMacchina = useMacchineStore(state => state.createMacchina);
  const updateMacchina = useMacchineStore(state => state.updateMacchina);
  const deleteMacchina = useMacchineStore(state => state.deleteMacchina);

  const inProduzione = useProduzioneStore(s => s.inProduzione);
  const fetchInProduzione = useProduzioneStore(s => s.fetchInProduzione);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TUTTE');

  // Drawer State
  const [selectedMacchina, setSelectedMacchina] = useState(null);
  const [drawerWidth, setDrawerWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMacchina, setEditingMacchina] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', codice: '', reparto: '', descrizione: '', is_active: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [deletingMacchina, setDeletingMacchina] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localToast, setLocalToast] = useState(null);

  const notify = useCallback((msg, type = 'success') => {
    if (showToastNotification) {
      showToastNotification(msg, type);
    } else {
      setLocalToast({ message: msg, type });
      setTimeout(() => setLocalToast(null), 4000);
    }
  }, [showToastNotification]);

  useEffect(() => {
    fetchMacchine();
    fetchInProduzione();
  }, [fetchMacchine, fetchInProduzione]);

  // Gestione Resize Drawer
  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    setIsResizing(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    const handlePointerMove = (moveEvent) => {
      const maxWidth = Math.min(1000, window.innerWidth - 60);
      const calculatedWidth = window.innerWidth - moveEvent.clientX;
      const clamped = Math.max(400, Math.min(maxWidth, calculatedWidth));
      setDrawerWidth(clamped);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, []);

  const handleOpenCreate = () => {
    setEditingMacchina(null);
    setFormData({ nome: '', codice: '', reparto: '', descrizione: '', is_active: true });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (macchina) => {
    setEditingMacchina(macchina);
    setFormData({
      nome: macchina.nome || '',
      codice: macchina.codice || '',
      reparto: macchina.reparto || '',
      descrizione: macchina.descrizione || '',
      is_active: macchina.is_active !== false
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingMacchina(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nome.trim()) errors.nome = "Nome obbligatorio";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    let result;
    if (editingMacchina) {
      result = await updateMacchina(editingMacchina.id, formData);
    } else {
      result = await createMacchina(formData);
    }
    setIsSubmitting(false);
    if (result.success) {
      notify(`Macchina ${editingMacchina ? 'aggiornata' : 'creata'} con successo`);
      handleCloseDialog();
    } else {
      setFormErrors({ submit: result.error?.message || "Errore durante il salvataggio" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMacchina) return;
    setIsDeleting(true);
    const result = await deleteMacchina(deletingMacchina.id);
    setIsDeleting(false);
    if (result.success) {
      notify("Macchina eliminata", "success");
      if (selectedMacchina && selectedMacchina.id === deletingMacchina.id) {
        setSelectedMacchina(null);
      }
    } else {
      notify(result.error?.message || "Errore", "error");
    }
    setDeletingMacchina(null);
  };

  const handleToggleStato = async (macchina) => {
    const result = await updateMacchina(macchina.id, { is_active: !macchina.is_active });
    if (result.success) {
      notify(`Macchina ${result.data.is_active ? 'attivata' : 'disattivata'}`);
      if (selectedMacchina && selectedMacchina.id === macchina.id) {
        setSelectedMacchina(result.data);
      }
    } else {
      notify(result.error?.message || "Errore", "error");
    }
  };

  const macchineWithStats = useMemo(() => {
    return macchine.map(m => {
      const toolsMounted = (inProduzione.righe || []).filter(r => r.id_macchina === m.id);
      const totalTools = toolsMounted.reduce((sum, r) => sum + r.quantita, 0);
      const uniqueCommesse = new Set(toolsMounted.filter(r => r.id_commessa).map(r => r.id_commessa)).size;
      return { ...m, totalTools, uniqueCommesse, toolsMounted };
    });
  }, [macchine, inProduzione.righe]);

  const filteredMacchine = useMemo(() => {
    return macchineWithStats.filter(m => {
      const matchQuery = (m.nome?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (m.codice?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (m.reparto?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'TUTTE' || 
                         (statusFilter === 'ATTIVE' && m.is_active) ||
                         (statusFilter === 'INATTIVE' && !m.is_active);
      return matchQuery && matchStatus;
    });
  }, [macchineWithStats, searchQuery, statusFilter]);

  const selectedMacchinaStats = useMemo(() => {
    if (!selectedMacchina) return null;
    return macchineWithStats.find(m => m.id === selectedMacchina.id);
  }, [selectedMacchina, macchineWithStats]);

  return (
    <PageTemplate>
      <PageHeader
        title="Gestione Macchine"
        breadcrumb="Magazzino"
        showBack={true}
        onBack={() => setView('home')}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          label: 'Cerca macchine',
          placeholder: 'Nome o codice...'
        }}
        action={
          <div className="flex items-center gap-2">
            <IconButton
              icon={<RefreshCw size={16} className={isLoading ? 'animate-spin text-accent-blue' : ''} />}
              onClick={() => fetchMacchine()}
              disabled={isLoading}
              variant="outline"
              title="Aggiorna macchine"
              className="glass-button border-slate-900/10 dark:border-white/10"
            />
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="action-btn action-btn-primary px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-sm"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nuova Macchina</span>
                <span className="sm:hidden">Nuova</span>
              </button>
            )}
          </div>
        }
      />

      <PageToolbar>
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
            {['TUTTE', 'ATTIVE', 'INATTIVE'].map(filter => {
               const count = filter === 'TUTTE' ? macchineWithStats.length : macchineWithStats.filter(m => filter === 'ATTIVE' ? m.is_active : !m.is_active).length;
               return (
                 <button
                   key={filter}
                   type="button"
                   onClick={() => setStatusFilter(filter)}
                   className={cn(
                     "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                     statusFilter === filter
                       ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30 shadow-xs"
                       : "glass-button text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                   )}
                 >
                   {filter === 'TUTTE' ? 'Tutte' : filter === 'ATTIVE' ? 'Attive' : 'Inattive'} ({count})
                 </button>
               );
            })}
          </div>
        </div>
      </PageToolbar>

      <PageContent className="p-4 sm:p-6 pb-24">
        <StateBlock
          state={isLoading && macchineWithStats.length === 0 ? 'loading' : error ? 'error' : filteredMacchine.length === 0 ? 'empty' : 'success'}
          loadingMode="skeleton"
          skeletonShape="card"
          skeletonCount={6}
          title={error ? 'Impossibile caricare le macchine' : 'Nessuna macchina trovata'}
          description={error || (searchQuery ? 'Modifica i filtri di ricerca' : 'Aggiungi una macchina per iniziare.')}
          error={error}
          onRetry={fetchMacchine}
          emptyAction={
            (searchQuery || statusFilter !== 'TUTTE') ? (
              <ResetFiltersButton onReset={() => { setSearchQuery(''); setStatusFilter('TUTTE'); }} />
            ) : isAdmin ? (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="action-btn action-btn-primary px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider mt-2"
              >
                Crea Macchina
              </button>
            ) : null
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMacchine.map((macchina) => (
              <div
                key={macchina.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMacchina(macchina); }}
                onClick={() => setSelectedMacchina(macchina)}
                className={cn(
                  "text-left glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between border transition-all hover:shadow-md cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
                  macchina.is_active
                    ? "border-slate-200/80 dark:border-slate-800"
                    : "border-slate-200/40 dark:border-slate-800/40 opacity-70 bg-slate-50/50 dark:bg-slate-900/40",
                  selectedMacchina?.id === macchina.id ? "ring-2 ring-accent-blue border-transparent" : ""
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                        macchina.is_active
                          ? "bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                      )}>
                        <Cpu size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-mono text-sm font-black text-slate-900 dark:text-slate-100 truncate tracking-wide">
                          {macchina.nome}
                        </h3>
                        {macchina.codice && (
                          <span className="text-xs text-slate-500 truncate">
                            {macchina.codice}
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="shrink-0 -mr-2" onClick={(e) => e.stopPropagation()}>
                        <IconMenu
                          icon={<Pencil size={15} />}
                          label="Azioni macchina"
                          items={[
                            { label: 'Modifica', icon: <Pencil size={14} />, onClick: () => handleOpenEdit(macchina) },
                            { label: macchina.is_active ? 'Disattiva' : 'Attiva', icon: <CheckCircle2 size={14} className={macchina.is_active ? 'text-slate-500' : 'text-accent-emerald'} />, onClick: () => handleToggleStato(macchina) },
                            { divider: true },
                            { label: 'Elimina', icon: <Trash2 size={14} />, onClick: () => setDeletingMacchina(macchina), danger: true }
                          ]}
                          variant="ghost"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4 mb-2">
                    <div className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-border/50">
                      <span className="app-caption text-muted-foreground">Utensili Montati</span>
                      <span className="app-qty-sm text-foreground mt-0.5">{macchina.totalTools}</span>
                    </div>
                    <div className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-border/50">
                      <span className="app-caption text-muted-foreground">Commesse Attive</span>
                      <span className="app-qty-sm text-foreground mt-0.5">{macchina.uniqueCommesse}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-0">
                    <MapPin size={13} className="shrink-0" />
                    <span className="truncate">{macchina.reparto || 'Nessun reparto'}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0",
                    macchina.is_active 
                      ? "bg-accent-emerald/10 text-accent-emerald" 
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  )}>
                    {macchina.is_active ? 'ATTIVA' : 'INATTIVA'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </StateBlock>
      </PageContent>

      <AnimatePresence>
        {selectedMacchinaStats && (
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedMacchina(null)}
              className="absolute inset-0 bg-slate-950/20 dark:bg-black/40 backdrop-blur-[0.5px] pointer-events-auto cursor-pointer"
            />
            
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ width: `${drawerWidth}px`, maxWidth: 'calc(100vw - 20px)' }}
              className={cn(
                "relative z-50 h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200/90 dark:border-slate-800 flex flex-col pointer-events-auto",
                isResizing && "select-none transition-none"
              )}
            >
              <div 
                onPointerDown={handlePointerDown}
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-accent-blue/50 active:bg-accent-blue transition-colors z-50"
              />
              
              <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="app-h2 font-mono text-xl">{selectedMacchinaStats.nome}</h2>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0",
                      selectedMacchinaStats.is_active ? "bg-accent-emerald/10 text-accent-emerald" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    )}>
                      {selectedMacchinaStats.is_active ? 'ATTIVA' : 'INATTIVA'}
                    </span>
                  </div>
                  {selectedMacchinaStats.descrizione && (
                    <p className="app-body text-muted-foreground truncate mt-1">{selectedMacchinaStats.descrizione}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(selectedMacchinaStats)}
                      className="glass-button w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-foreground"
                    >
                      <Pencil size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedMacchina(null)}
                    className="glass-button w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-foreground bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 custom-scrollbar bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2 mb-6">
                  <Wrench size={18} className="text-accent-blue" />
                  <h3 className="app-h3">Utensili Montati</h3>
                  <span className="ml-auto app-qty-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    {selectedMacchinaStats.totalTools}
                  </span>
                </div>

                {selectedMacchinaStats.toolsMounted.length === 0 ? (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-border rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <Cpu size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="app-body font-bold text-foreground">Nessun utensile montato</p>
                    <p className="text-sm text-muted-foreground mt-1">Gli utensili prelevati verso questa macchina appariranno qui.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedMacchinaStats.toolsMounted.map(tool => (
                      <div key={tool.id_posizione} className="glass-panel p-3 rounded-xl border border-border flex items-center gap-3">
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <span className="app-h3 truncate text-sm">{tool.descrizione}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{tool.codice}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              Commessa: <span className="font-bold">{tool.codice_commessa || 'Generica'}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="app-qty-sm">{tool.quantita}</span>
                          <span className={cn("badge text-xs", BADGE_STATO[tool.stato] || 'badge-slate')}>
                            {ETICHETTE_STATO[tool.stato] || tool.stato}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent size="md">
          <ModalHeader 
            icon={<Cpu size={24} className="text-accent-blue" />}
            title={editingMacchina ? 'Modifica Macchina' : 'Nuova Macchina CNC'}
            overline={editingMacchina ? 'Aggiorna Dati' : 'Creazione'}
          />
          <ModalBody>
            <form id="macchina-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
              {formErrors.submit && (
                <div className="p-3 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span className="font-bold">{formErrors.submit}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="app-label text-foreground">
                    Nome Macchina <span className="text-accent-rose">*</span>
                  </label>
                  <input
                    type="text"
                    name="nome"
                    required
                    placeholder="Es. DMU 50 5-Assi"
                    value={formData.nome}
                    onChange={(e) => { setFormData(p => ({...p, nome: e.target.value})); if (formErrors.nome) setFormErrors(p => ({...p, nome: null})); }}
                    className={`glass-input w-full border rounded-xl py-2.5 px-3 font-bold text-sm ${formErrors.nome ? 'border-accent-rose' : 'dark:border-white/10 border-slate-900/10'}`}
                  />
                  {formErrors.nome && <span className="text-xs font-bold text-accent-rose">{formErrors.nome}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="app-label text-foreground">Codice Identificativo</label>
                  <input
                    type="text"
                    name="codice"
                    placeholder="Es: CNC-01"
                    value={formData.codice}
                    onChange={(e) => setFormData(p => ({...p, codice: e.target.value.toUpperCase()}))}
                    className="glass-input w-full border dark:border-white/10 border-slate-900/10 font-mono rounded-xl py-2.5 px-3 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="app-label text-foreground">Reparto / Area</label>
                  <input
                    type="text"
                    name="reparto"
                    placeholder="Es. Fresatura 5 Assi"
                    value={formData.reparto}
                    onChange={(e) => setFormData(p => ({...p, reparto: e.target.value}))}
                    className="glass-input w-full border dark:border-white/10 border-slate-900/10 rounded-xl py-2.5 px-3 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="app-label text-foreground">Descrizione / Specifiche</label>
                <textarea
                  name="descrizione"
                  rows={2}
                  placeholder="Note, corse assi, mandrino..."
                  value={formData.descrizione}
                  onChange={(e) => setFormData(p => ({...p, descrizione: e.target.value}))}
                  className="glass-input w-full border dark:border-white/10 border-slate-900/10 rounded-xl p-3 text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="macchina-active-toggle"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                  className="w-5 h-5 rounded text-accent-blue focus:ring-accent-blue/50 cursor-pointer accent-accent-blue"
                />
                <label htmlFor="macchina-active-toggle" className="text-sm font-bold text-foreground cursor-pointer select-none">
                  Macchina attualmente attiva e in linea
                </label>
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            {editingMacchina && (
              <button
                type="button"
                onClick={() => {
                  handleCloseDialog();
                  setDeletingMacchina(editingMacchina);
                }}
                disabled={isSubmitting}
                className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-muted-foreground hover:text-accent-rose hover:bg-accent-rose/10 self-start sm:self-auto sm:mr-auto transition-colors"
                title="Elimina macchina"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              form="macchina-form"
              disabled={isSubmitting || !formData.nome.trim()}
              className="action-btn action-btn-primary px-6 py-2 rounded-xl text-sm font-black flex items-center justify-center gap-2"
            >
              {isSubmitting ? "SALVATAGGIO..." : "SALVA"}
            </button>
          </ModalFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingMacchina} onOpenChange={(open) => { if (!open && !isDeleting) setDeletingMacchina(null); }}>
        <DialogContent size="md">
          <ModalHeader 
            icon={<AlertTriangle size={24} className="text-accent-rose" />}
            title="Elimina Macchina"
            overline="Azione Distruttiva"
          />
          <ModalBody>
            <div className="flex flex-col gap-4 text-sm text-muted-foreground">
              <p className="app-body">
                Sei sicuro di voler eliminare la macchina <strong className="font-mono text-accent-blue font-black bg-accent-blue/10 px-2 py-0.5 rounded-md">{deletingMacchina?.nome}</strong>?
              </p>
              <div className="p-3 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span className="font-bold">
                  Lo storico delle lavorazioni e i log dei movimenti non verranno eliminati, ma la macchina non sarà più selezionabile nei nuovi prelievi.
                </span>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setDeletingMacchina(null)}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="action-btn action-btn-scarica px-6 py-2 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
            >
              {isDeleting ? "ELIMINAZIONE..." : "ELIMINA MACCHINA"}
            </button>
          </ModalFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {localToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div className={`p-4 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-xl ${
              localToast.type === 'error'
                ? 'bg-rose-950/90 border-accent-rose text-white'
                : 'bg-background/90 border-accent-emerald text-foreground'
            }`}>
              {localToast.type === 'error' ? <AlertCircle size={20} className="text-accent-rose" /> : <CheckCircle2 size={20} className="text-accent-emerald" />}
              <span className="text-sm font-bold">{localToast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTemplate>
  );
}
