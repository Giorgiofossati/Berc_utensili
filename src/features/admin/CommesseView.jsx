import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Plus, RefreshCw, MapPin, Calendar, CheckCircle2, AlertCircle, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { PageTemplate, PageHeader, PageToolbar, PageContent } from '@/components/layout/PageTemplate';
import { StateBlock } from '@/components/common/StateBlock';
import { IconButton, IconMenu } from '@/components/ui/icon-button';
import { useCommesseStore } from '../../store/useCommesseStore';
import { cn } from '@/lib/utils';

export default function CommesseView({ setView, showToastNotification }) {
  const commesse = useCommesseStore(state => state.commesse);
  const isLoading = useCommesseStore(state => state.isLoading);
  const error = useCommesseStore(state => state.error);
  const fetchCommesse = useCommesseStore(state => state.fetchCommesse);
  const createCommessa = useCommesseStore(state => state.createCommessa);
  const updateCommessa = useCommesseStore(state => state.updateCommessa);
  const toggleStatoCommessa = useCommesseStore(state => state.toggleStatoCommessa);
  const deleteCommessa = useCommesseStore(state => state.deleteCommessa);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TUTTE'); 

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCommessa, setEditingCommessa] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    codice: '',
    descrizione: '',
    ubicazione: '',
    stato: 'Attiva'
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
  }, [fetchCommesse]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'codice' ? value.toUpperCase() : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleOpenCreate = () => {
    setEditingCommessa(null);
    setFormData({
      codice: '',
      descrizione: '',
      ubicazione: '',
      stato: 'Attiva'
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (commessa) => {
    setEditingCommessa(commessa);
    setFormData({
      codice: commessa.codice || '',
      descrizione: commessa.descrizione || '',
      ubicazione: commessa.ubicazione || '',
      stato: commessa.stato || 'Attiva'
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingCommessa(null);
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.codice.trim()) {
      errors.codice = 'Il codice commessa è obbligatorio.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    let res;
    if (editingCommessa) {
      res = await updateCommessa(editingCommessa.id, formData);
    } else {
      res = await createCommessa(formData);
    }
    setIsSubmitting(false);

    if (res.success) {
      const actionMsg = editingCommessa ? 'aggiornata' : 'creata';
      notify(`Commessa ${formData.codice.trim().toUpperCase()} ${actionMsg} con successo!`, 'success');
      handleCloseDialog();
    } else {
      const errorMsg = res.error?.message || 'Errore durante il salvataggio della commessa.';
      setFormErrors({ submit: errorMsg });
      notify(errorMsg, 'error');
    }
  };

  const handleToggleStato = async (commessa) => {
    if (togglingId) return;
    setTogglingId(commessa.id);
    const nextStato = commessa.stato === 'Attiva' ? 'Chiusa' : 'Attiva';
    const res = await toggleStatoCommessa(commessa.id, commessa.stato);
    setTogglingId(null);

    if (res.success) {
      notify(`Commessa ${commessa.codice} impostata su "${nextStato}"`, 'success');
    } else {
      notify(res.error?.message || 'Errore durante il cambio di stato', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCommessa) return;
    setIsDeleting(true);
    const codice = deletingCommessa.codice;
    const res = await deleteCommessa(deletingCommessa.id);
    setIsDeleting(false);

    if (res.success) {
      notify(`Commessa ${codice} eliminata con successo!`, 'success');
      setDeletingCommessa(null);
    } else {
      const errorMsg = res.error?.message || 'Errore durante l\'eliminazione della commessa.';
      notify(errorMsg, 'error');
    }
  };

  const filteredCommesse = useMemo(() => {
    return commesse.filter(c => {
      if (statusFilter !== 'TUTTE' && c.stato !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const codeMatch = (c.codice || '').toLowerCase().includes(q);
      const descMatch = (c.descrizione || '').toLowerCase().includes(q);
      const ubiMatch = (c.ubicazione || '').toLowerCase().includes(q);
      return codeMatch || descMatch || ubiMatch;
    });
  }, [commesse, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = commesse.length;
    const attive = commesse.filter(c => c.stato === 'Attiva').length;
    const chiuse = commesse.filter(c => c.stato === 'Chiusa').length;
    return { total, attive, chiuse };
  }, [commesse]);

  return (
    <PageTemplate>
      <PageHeader
        title="Commesse"
        breadcrumb="Magazzino"
        showBack={true}
        onBack={() => {
            if (setView) setView('home');
            else window.history.back();
        }}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Cerca codice, descrizione, ubicazione…',
          label: 'Cerca nelle commesse',
        }}
        action={
          <div className="flex gap-2">
            <IconButton 
              icon={<RefreshCw size={16} className={isLoading ? "animate-spin text-accent-blue" : ""} />}
              onClick={() => fetchCommesse()}
              disabled={isLoading}
              aria-label="Aggiorna commesse"
              title="Aggiorna"
              variant="outline"
              className="glass-button border-slate-900/10 dark:border-white/10"
            />
            <button
              type="button"
              onClick={handleOpenCreate}
              className="action-btn action-btn-primary px-4 py-2 rounded-xl flex items-center justify-center gap-2"
            >
              <Plus size={16} className="shrink-0" />
              <span className="text-xs font-black tracking-wider hidden sm:inline">NUOVA COMMESSA</span>
            </button>
          </div>
        }
      />

      <PageToolbar>
        <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-3 w-full">
          <div className="flex items-center gap-1.5 p-1 rounded-xl glass-panel dark:border-white/10 border-slate-900/10 shrink-0">
            <button
              onClick={() => setStatusFilter('TUTTE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'TUTTE'
                  ? 'bg-slate-200 dark:bg-white/15 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tutte ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('Attiva')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'Attiva'
                  ? 'bg-emerald-500/20 text-accent-emerald border border-emerald-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-accent-emerald'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-accent-emerald" />
              Attive ({stats.attive})
            </button>
            <button
              onClick={() => setStatusFilter('Chiusa')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'Chiusa'
                  ? 'bg-slate-200 dark:bg-white/15 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Chiuse ({stats.chiuse})
            </button>
          </div>
        </div>
      </PageToolbar>

      <PageContent>
        {isLoading && commesse.length === 0 ? (
          <StateBlock state="loading" skeletonShape="card" count={6} title="Caricamento commesse in corso..." />
        ) : error ? (
          <StateBlock 
            state="error" 
            title="Errore di caricamento" 
            description={error}
            action={
              <button 
                type="button"
                onClick={() => fetchCommesse()} 
                className="action-btn action-btn-primary px-6 py-2 rounded-xl text-sm font-black"
              >
                Riprova
              </button>
            }
          />
        ) : filteredCommesse.length === 0 ? (
          <StateBlock 
            state="empty" 
            variant={searchQuery.trim() ? 'search' : (statusFilter !== 'TUTTE' ? 'filtered' : 'generic')}
            searchTerm={searchQuery.trim()}
            title={
              searchQuery.trim()
                ? undefined
                : (statusFilter !== 'TUTTE' 
                    ? `Nessuna commessa ${statusFilter === 'Attiva' ? 'attiva' : 'chiusa'}`
                    : 'Nessuna commessa registrata')
            }
            description={
              searchQuery.trim()
                ? undefined
                : (statusFilter !== 'TUTTE'
                    ? 'Non ci sono commesse con questo stato. Prova a selezionare "Tutte" o a reimpostare i filtri.'
                    : 'Inizia creando la prima commessa di produzione per associare prelievi e giacenze.')
            }
            action={
              searchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="glass-button px-4 py-2 rounded-xl font-bold text-sm text-accent-orange"
                >
                  Resetta Ricerca
                </button>
              ) : statusFilter !== 'TUTTE' ? (
                <button
                  type="button"
                  onClick={() => setStatusFilter('TUTTE')}
                  className="glass-button px-4 py-2 rounded-xl font-bold text-sm text-accent-orange"
                >
                  Mostra Tutte
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="action-btn action-btn-primary px-6 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span>CREA LA PRIMA COMMESSA</span>
                </button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCommesse.map((item) => {
              const isAttiva = item.stato === 'Attiva';
              const isSelected = isDialogOpen && editingCommessa?.id === item.id;
              const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : null;

              const menuItems = [
                {
                  label: 'Modifica',
                  icon: <Pencil size={16} />,
                  onClick: (e) => {
                    e?.stopPropagation?.();
                    handleOpenEdit(item);
                  }
                },
                {
                  label: isAttiva ? 'Imposta Chiusa' : 'Imposta Attiva',
                  icon: <RefreshCw size={16} />,
                  onClick: (e) => {
                    e?.stopPropagation?.();
                    handleToggleStato(item);
                  }
                },
                {
                  label: 'Elimina',
                  icon: <Trash2 size={16} />,
                  destructive: true,
                  onClick: (e) => {
                    e?.stopPropagation?.();
                    setDeletingCommessa(item);
                  }
                }
              ];

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenEdit(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenEdit(item);
                    }
                  }}
                  aria-label={`Dettagli commessa ${item.codice}`}
                  className={cn(
                    "glass-panel p-4 sm:p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between group",
                    isSelected
                      ? "bg-accent-blue/10 border-accent-blue/40 shadow-[inset_3px_0_0_var(--color-accent-blue)]"
                      : "border-transparent dark:border-white/[0.03] hover:bg-accent-blue/[0.06] active:bg-accent-blue/[0.14]"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0 border border-accent-blue/20 text-accent-blue">
                          <FolderKanban size={20} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="app-caption text-muted-foreground uppercase tracking-widest leading-none">
                            Codice Commessa
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 min-w-0">
                            <span className="app-body font-black text-accent-blue truncate min-w-0" title={item.codice}>
                              {item.codice}
                            </span>
                            <span className={`badge ${isAttiva ? 'badge-emerald' : 'badge-slate'} inline-flex items-center gap-1.5 shrink-0`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isAttiva ? 'bg-accent-emerald animate-pulse' : 'bg-slate-400'}`} />
                              <span className="app-caption uppercase tracking-wider">{item.stato || 'Attiva'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center shrink-0">
                        <div onClick={(e) => e.stopPropagation()}>
                          <IconMenu items={menuItems} variant="ghost" ariaLabel="Azioni commessa" />
                        </div>
                      </div>
                    </div>

                    <div className="my-2">
                      <h3 className="app-h3 text-foreground line-clamp-2" title={item.descrizione || ''}>
                        {item.descrizione || <span className="text-muted-foreground italic font-normal">Nessuna descrizione inserita</span>}
                      </h3>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                      <MapPin size={14} className="text-accent-orange shrink-0" />
                      <span className="app-caption truncate" title={item.ubicazione || 'Non specificata'}>
                        {item.ubicazione || 'Ubicazione non definita'}
                      </span>
                    </div>

                    {formattedDate && (
                      <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                        <Calendar size={14} className="shrink-0" />
                        <span className="app-caption">{formattedDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent size="md">
          <ModalHeader 
            icon={editingCommessa ? <Pencil size={24} /> : <FolderKanban size={24} />}
            title={editingCommessa ? 'Modifica Commessa' : 'Nuova Commessa'}
            subtitle={editingCommessa ? 'Aggiorna i parametri e lo stato della commessa.' : 'Registra una nuova commessa di produzione.'}
            badge={editingCommessa && (
              <span className="app-caption px-2 py-0.5 rounded-md bg-muted/50 font-mono font-bold border border-border/50">
                {editingCommessa.codice}
              </span>
            )}
          />
          <ModalBody>
            <form id="commessa-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              {formErrors.submit && (
                <div className="p-3 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs font-bold flex items-center gap-2 rounded-xl">
                  <AlertCircle size={16} />
                  <span>{formErrors.submit}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="app-overline text-slate-700 dark:text-slate-200">Codice Commessa *</label>
                  <input
                    type="text"
                    name="codice"
                    required
                    placeholder="es. COM-2026-001"
                    value={formData.codice}
                    onChange={handleInputChange}
                    className="glass-input w-full border dark:border-white/10 border-slate-900/10 rounded-xl py-2.5 px-3 font-mono font-bold uppercase text-sm"
                  />
                  {formErrors.codice && <span className="text-accent-rose text-xs font-bold">{formErrors.codice}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="app-overline text-slate-700 dark:text-slate-200">Ubicazione / Reparto</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="ubicazione"
                      placeholder="es. Reparto CNC 1"
                      value={formData.ubicazione}
                      onChange={handleInputChange}
                      className="glass-input w-full border dark:border-white/10 border-slate-900/10 rounded-xl py-2.5 pl-9 pr-3 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="app-overline text-slate-700 dark:text-slate-200">Descrizione Lavorazione</label>
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
                <label className="app-overline text-slate-700 dark:text-slate-200">Stato Commessa</label>
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
                    ATTIVA
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
                    CHIUSA
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
              {deletingCommessa?.descrizione && (
                <p className="text-xs italic bg-muted/50 p-3 rounded-xl border border-border/50">
                  "{deletingCommessa.descrizione}"
                </p>
              )}
              <div className="p-3 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span className="font-bold">
                  I movimenti storici registrati rimarranno archiviati per integrità dei log, ma il collegamento diretto alla commessa verrà rimosso.
                </span>
              </div>
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
              {isDeleting ? "ELIMINAZIONE..." : "ELIMINA DEFINITIVAMENTE"}
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
