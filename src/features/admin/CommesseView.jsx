import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Plus, RefreshCw, MapPin, CheckCircle2, AlertCircle, AlertTriangle, Pencil, Trash2, Cpu, Wrench, X } from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { PageTemplate, PageHeader, PageToolbar, PageContent, ResetFiltersButton } from '@/components/layout/PageTemplate';
import { StateBlock } from '@/components/common/StateBlock';
import { IconButton, IconMenu } from '@/components/ui/icon-button';
import { useCommesseStore } from '../../store/useCommesseStore';
import { useMacchineStore } from '../../store/useMacchineStore';
import { useProduzioneStore } from '../../store/useProduzioneStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '@/lib/utils';
import { ETICHETTE_STATO } from '../produzione/lifecycleSelectors';

const BADGE_STATO = { nuovo: 'badge-emerald', usato: 'badge-slate', riaffilato: 'badge-blue' };

export default function CommesseView({ setView, showToastNotification }) {
  const currentUser = useAuthStore(state => state.currentUser);
  const isAdmin = currentUser?.ruolo === 'Admin';

  const commesse = useCommesseStore(state => state.commesse);
  const isLoading = useCommesseStore(state => state.isLoading);
  const error = useCommesseStore(state => state.error);
  const fetchCommesse = useCommesseStore(state => state.fetchCommesse);
  const createCommessa = useCommesseStore(state => state.createCommessa);
  const updateCommessa = useCommesseStore(state => state.updateCommessa);
  const toggleStatoCommessa = useCommesseStore(state => state.toggleStatoCommessa);
  const deleteCommessa = useCommesseStore(state => state.deleteCommessa);

  const macchine = useMacchineStore(state => state.macchine);
  const fetchMacchine = useMacchineStore(state => state.fetchMacchine);
  
  const inProduzione = useProduzioneStore(s => s.inProduzione);
  const fetchInProduzione = useProduzioneStore(s => s.fetchInProduzione);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TUTTE'); 

  // Drawer State
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const [drawerWidth, setDrawerWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCommessa, setEditingCommessa] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    codice: '', descrizione: '', ubicazione: '', macchina_id: '', stato: 'Attiva'
  });
  const [formErrors, setFormErrors] = useState({});
  const [togglingId, setTogglingId] = useState(null);
  const [deletingCommessa, setDeletingCommessa] = useState(null);
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
    fetchCommesse();
    fetchMacchine();
    fetchInProduzione();
  }, [fetchCommesse, fetchMacchine, fetchInProduzione]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'codice' ? value.toUpperCase() : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleOpenCreate = () => {
    setEditingCommessa(null);
    setFormData({ codice: '', descrizione: '', ubicazione: '', macchina_id: '', stato: 'Attiva' });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (commessa) => {
    setEditingCommessa(commessa);
    setFormData({
      codice: commessa.codice || '',
      descrizione: commessa.descrizione || '',
      ubicazione: commessa.ubicazione || '',
      macchina_id: commessa.macchina_id || '',
      stato: commessa.stato || 'Attiva'
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingCommessa(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.codice.trim()) errors.codice = "Codice obbligatorio";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    let result;
    if (editingCommessa) {
      result = await updateCommessa(editingCommessa.id, formData);
    } else {
      result = await createCommessa(formData);
    }
    setIsSubmitting(false);
    if (result.success) {
      notify(`Commessa ${editingCommessa ? 'aggiornata' : 'creata'} con successo`);
      handleCloseDialog();
    } else {
      setFormErrors({ submit: result.error.message || "Errore durante il salvataggio" });
    }
  };

  const handleToggleStato = async (commessa) => {
    setTogglingId(commessa.id);
    const result = await toggleStatoCommessa(commessa.id, commessa.stato);
    if (result.success) {
      notify(`Stato modificato in "${result.data.stato}"`);
      if (selectedCommessa && selectedCommessa.id === commessa.id) {
        setSelectedCommessa(result.data);
      }
    } else {
      notify(result.error.message || "Errore durante il cambio stato", 'error');
    }
    setTogglingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCommessa) return;
    setIsDeleting(true);
    const result = await deleteCommessa(deletingCommessa.id);
    setIsDeleting(false);
    if (result.success) {
      notify("Commessa eliminata", "success");
      if (selectedCommessa && selectedCommessa.id === deletingCommessa.id) {
        setSelectedCommessa(null);
      }
    } else {
      notify(result.error.message || "Errore", "error");
    }
    setDeletingCommessa(null);
  };

  const commesseWithStats = useMemo(() => {
    return commesse.map(c => {
      const toolsForCommessa = (inProduzione.righe || []).filter(r => r.id_commessa === c.id);
      const totalTools = toolsForCommessa.reduce((sum, r) => sum + r.quantita, 0);
      const uniqueMachines = new Set(toolsForCommessa.filter(r => r.luogo === "macchina").map(r => r.id_macchina)).size;
      return { ...c, totalTools, uniqueMachines, toolsMounted: toolsForCommessa };
    });
  }, [commesse, inProduzione.righe]);

  const filteredCommesse = useMemo(() => {
    return commesseWithStats.filter(c => {
      const matchQuery = (c.codice?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (c.descrizione?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'TUTTE' || 
                         (statusFilter === 'ATTIVE' && c.stato === 'Attiva') ||
                         (statusFilter === 'CHIUSE' && c.stato === 'Chiusa');
      return matchQuery && matchStatus;
    });
  }, [commesseWithStats, searchQuery, statusFilter]);

  const selectedCommessaStats = useMemo(() => {
    if (!selectedCommessa) return null;
    return commesseWithStats.find(c => c.id === selectedCommessa.id);
  }, [selectedCommessa, commesseWithStats]);

  return (
    <PageTemplate>
      <PageHeader
        title="Gestione Commesse"
        breadcrumb="Magazzino"
        showBack={true}
        onBack={() => setView('home')}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          label: 'Cerca nelle commesse',
          placeholder: 'Codice o descrizione...'
        }}
        action={
          <div className="flex items-center gap-2">
            <IconButton
              icon={<RefreshCw size={16} className={isLoading ? 'animate-spin text-accent-blue' : ''} />}
              onClick={() => fetchCommesse()}
              disabled={isLoading}
              variant="outline"
              title="Aggiorna commesse"
              className="glass-button border-slate-900/10 dark:border-white/10"
            />
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="action-btn action-btn-primary px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-sm"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nuova Commessa</span>
                <span className="sm:hidden">Nuova</span>
              </button>
            )}
          </div>
        }
      />

      <PageToolbar>
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
            {['TUTTE', 'ATTIVE', 'CHIUSE'].map(filter => {
               const count = filter === 'TUTTE' ? commesseWithStats.length : commesseWithStats.filter(c => filter === 'ATTIVE' ? c.stato === 'Attiva' : c.stato === 'Chiusa').length;
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
                   {filter === 'TUTTE' ? 'Tutte' : filter === 'ATTIVE' ? 'Attive' : 'Chiuse'} ({count})
                 </button>
               );
            })}
          </div>
        </div>
      </PageToolbar>

      <PageContent className="p-4 sm:p-6 pb-24">
        <StateBlock
          state={isLoading && commesseWithStats.length === 0 ? 'loading' : error ? 'error' : filteredCommesse.length === 0 ? 'empty' : 'success'}
          loadingMode="skeleton"
          skeletonShape="card"
          skeletonCount={6}
          title={error ? 'Impossibile caricare le commesse' : 'Nessuna commessa trovata'}
          description={error || (searchQuery ? 'Modifica i filtri di ricerca' : 'Crea la tua prima commessa per iniziare.')}
          error={error}
          onRetry={fetchCommesse}
          emptyAction={
            (searchQuery || statusFilter !== 'TUTTE') ? (
              <ResetFiltersButton onReset={() => { setSearchQuery(''); setStatusFilter('TUTTE'); }} />
            ) : isAdmin ? (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="action-btn action-btn-primary px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider mt-2"
              >
                Crea Commessa
              </button>
            ) : null
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCommesse.map((commessa) => (
              <div
                key={commessa.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCommessa(commessa); }}
                onClick={() => setSelectedCommessa(commessa)}
                className={cn(
                  "text-left glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between border transition-all hover:shadow-md cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
                  commessa.stato === 'Attiva'
                    ? "border-slate-200/80 dark:border-slate-800"
                    : "border-slate-200/40 dark:border-slate-800/40 opacity-70 bg-slate-50/50 dark:bg-slate-900/40",
                  selectedCommessa?.id === commessa.id ? "ring-2 ring-accent-blue border-transparent" : ""
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                        commessa.stato === 'Attiva'
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                      )}>
                        <FolderKanban size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-mono text-sm font-black text-slate-900 dark:text-slate-100 truncate tracking-wide">
                          {commessa.codice}
                        </h3>
                        {commessa.descrizione && (
                          <span className="text-xs text-slate-500 truncate" title={commessa.descrizione}>
                            {commessa.descrizione}
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="shrink-0 -mr-2" onClick={(e) => e.stopPropagation()}>
                        <IconMenu
                          icon={<Pencil size={15} />}
                          label="Azioni commessa"
                          items={[
                            { label: 'Modifica', icon: <Pencil size={14} />, onClick: () => handleOpenEdit(commessa) },
                            { label: commessa.stato === 'Attiva' ? 'Chiudi Commessa' : 'Riapri Commessa', icon: <CheckCircle2 size={14} className={commessa.stato === 'Attiva' ? 'text-slate-500' : 'text-accent-emerald'} />, onClick: () => handleToggleStato(commessa), disabled: togglingId === commessa.id },
                            { divider: true },
                            { label: 'Elimina', icon: <Trash2 size={14} />, onClick: () => setDeletingCommessa(commessa), danger: true }
                          ]}
                          variant="ghost"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4 mb-2">
                    <div className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-border/50">
                      <span className="app-caption text-muted-foreground">Utensili Impegnati</span>
                      <span className="app-qty-sm text-foreground mt-0.5">{commessa.totalTools}</span>
                    </div>
                    <div className="flex flex-col p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-border/50">
                      <span className="app-caption text-muted-foreground">Macchine Attive</span>
                      <span className="app-qty-sm text-foreground mt-0.5">{commessa.uniqueMachines}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-0">
                    <MapPin size={13} className="shrink-0" />
                    <span className="truncate">{commessa.ubicazione || 'Nessuna ubicazione'}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0",
                    commessa.stato === 'Attiva' 
                      ? "bg-accent-emerald/10 text-accent-emerald" 
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  )}>
                    {commessa.stato}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </StateBlock>
      </PageContent>

      <AnimatePresence>
        {selectedCommessaStats && (
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedCommessa(null)}
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
                    <h2 className="app-h2 font-mono text-xl">{selectedCommessaStats.codice}</h2>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0",
                      selectedCommessaStats.stato === 'Attiva' ? "bg-accent-emerald/10 text-accent-emerald" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    )}>
                      {selectedCommessaStats.stato}
                    </span>
                  </div>
                  {selectedCommessaStats.descrizione && (
                    <p className="app-body text-muted-foreground truncate mt-1">{selectedCommessaStats.descrizione}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(selectedCommessaStats)}
                      className="glass-button w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-foreground"
                    >
                      <Pencil size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedCommessa(null)}
                    className="glass-button w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-foreground bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-white dark:bg-slate-900">
                <div className="flex items-center gap-2 mb-6">
                  <Wrench size={18} className="text-accent-blue" />
                  <h3 className="app-h3">Utensili Assegnati</h3>
                  <span className="ml-auto app-qty-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    {selectedCommessaStats.totalTools}
                  </span>
                </div>

                {selectedCommessaStats.toolsMounted.length === 0 ? (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-border rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <FolderKanban size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="app-body font-bold text-foreground">Nessun utensile associato</p>
                    <p className="text-sm text-muted-foreground mt-1">Gli utensili prelevati verso questa commessa appariranno qui.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedCommessaStats.toolsMounted.map(tool => (
                      <div key={tool.id_posizione} className="glass-panel p-3 rounded-xl border border-border flex items-center gap-3">
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <span className="app-h3 truncate text-sm">{tool.descrizione}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{tool.codice}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              {tool.luogo === 'macchina' ? <Cpu size={12} className="text-accent-orange" /> : <FolderKanban size={12} />}
                              {tool.luogo === 'macchina' ? `Su ${tool.nome_macchina}` : 'Nel Cassetto'}
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
            icon={<FolderKanban size={24} className="text-accent-blue" />}
            title={editingCommessa ? 'Modifica Commessa' : 'Nuova Commessa'}
            overline={editingCommessa ? 'Aggiorna Dati' : 'Creazione'}
          />
          <ModalBody>
            <form id="commessa-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
              {formErrors.submit && (
                <div className="p-3 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span className="font-bold">{formErrors.submit}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="app-label text-foreground">
                    Codice Commessa <span className="text-accent-rose">*</span>
                  </label>
                  <input
                    type="text"
                    name="codice"
                    required
                    placeholder="Es: C-2024-001"
                    value={formData.codice}
                    onChange={handleInputChange}
                    className={`glass-input w-full border rounded-xl py-2.5 px-3 font-mono text-sm ${formErrors.codice ? 'border-accent-rose' : 'dark:border-white/10 border-slate-900/10'}`}
                  />
                  {formErrors.codice && <span className="text-xs font-bold text-accent-rose">{formErrors.codice}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="app-label text-foreground">Ubicazione / Cassetto</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="ubicazione"
                      placeholder="Es: Scaffale A2"
                      value={formData.ubicazione}
                      onChange={handleInputChange}
                      className="glass-input w-full border dark:border-white/10 border-slate-900/10 rounded-xl py-2.5 pl-9 pr-3 text-sm"
                    />
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="app-label text-foreground flex items-center gap-1.5">
                    <Cpu size={14} className="text-accent-blue" />
                    <span>Macchina CNC Predefinita</span>
                  </label>
                  <select
                    name="macchina_id"
                    value={formData.macchina_id || ''}
                    onChange={handleInputChange}
                    className="glass-input w-full border dark:border-white/10 border-slate-900/10 rounded-xl py-2.5 px-3 text-sm dark:bg-slate-900 bg-white"
                  >
                    <option value="">Nessuna macchina predefinita</option>
                    {macchine.filter(m => m.is_active).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nome} ({m.codice || m.reparto})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="app-label text-foreground">Descrizione Lavorazione</label>
                <textarea
                  name="descrizione"
                  rows={3}
                  placeholder="Dettagli della lavorazione..."
                  value={formData.descrizione}
                  onChange={handleInputChange}
                  className="glass-input w-full border dark:border-white/10 border-slate-900/10 rounded-xl p-3 text-sm resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="app-label text-foreground">Stato Commessa</label>
                <div className="flex items-center bg-muted/30 border border-border/50 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, stato: 'Attiva' }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      formData.stato === 'Attiva'
                        ? 'bg-background text-accent-emerald shadow-sm'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${formData.stato === 'Attiva' ? 'bg-accent-emerald animate-pulse' : 'bg-slate-400'}`} />
                    Attiva
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, stato: 'Chiusa' }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      formData.stato === 'Chiusa'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${formData.stato === 'Chiusa' ? 'bg-slate-500' : 'bg-slate-400'}`} />
                    Chiusa
                  </button>
                </div>
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            {editingCommessa && (
              <button
                type="button"
                onClick={() => {
                  handleCloseDialog();
                  setDeletingCommessa(editingCommessa);
                }}
                disabled={isSubmitting}
                className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-muted-foreground hover:text-accent-rose hover:bg-accent-rose/10 self-start sm:self-auto sm:mr-auto transition-colors"
                title="Elimina commessa"
                aria-label="Elimina commessa"
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
              form="commessa-form"
              disabled={isSubmitting || !formData.codice.trim()}
              className="action-btn action-btn-primary px-6 py-2 rounded-xl text-sm font-black flex items-center justify-center gap-2"
            >
              {isSubmitting ? "SALVATAGGIO..." : "SALVA"}
            </button>
          </ModalFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingCommessa} onOpenChange={(open) => { if (!open && !isDeleting) setDeletingCommessa(null); }}>
        <DialogContent size="md">
          <ModalHeader 
            icon={<AlertTriangle size={24} className="text-accent-rose" />}
            title="Elimina Commessa"
            overline="Azione Distruttiva"
          />
          <ModalBody>
            <div className="flex flex-col gap-4 text-sm text-muted-foreground">
              <p className="app-body">
                Sei sicuro di voler eliminare definitivamente la commessa <strong className="font-mono text-accent-blue font-black bg-accent-blue/10 px-2 py-0.5 rounded-md">{deletingCommessa?.codice}</strong>?
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setDeletingCommessa(null)}
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
              {isDeleting ? "ELIMINAZIONE..." : "ELIMINA"}
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
