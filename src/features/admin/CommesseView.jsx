import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderKanban, Plus, Search, RefreshCw, MapPin, 
  Calendar, CheckCircle2, AlertCircle, AlertTriangle, 
  X, ArrowLeft, Pencil, Trash2, MoreVertical
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCommesseStore } from '../../store/useCommesseStore';

export default function CommesseView({ setView, showToastNotification }) {
  const commesse = useCommesseStore(state => state.commesse);
  const isLoading = useCommesseStore(state => state.isLoading);
  const fetchCommesse = useCommesseStore(state => state.fetchCommesse);
  const createCommessa = useCommesseStore(state => state.createCommessa);
  const updateCommessa = useCommesseStore(state => state.updateCommessa);
  const toggleStatoCommessa = useCommesseStore(state => state.toggleStatoCommessa);
  const deleteCommessa = useCommesseStore(state => state.deleteCommessa);

  // Filtri e ricerca
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TUTTE'); // 'TUTTE' | 'Attiva' | 'Chiusa'

  // Stato modale creazione / modifica
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCommessa, setEditingCommessa] = useState(null); // null = creazione, oggetto = modifica
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    codice: '',
    descrizione: '',
    ubicazione: '',
    stato: 'Attiva'
  });
  const [formErrors, setFormErrors] = useState({});

  // Stato toggle rapido e cancellazione
  const [togglingId, setTogglingId] = useState(null);
  const [deletingCommessa, setDeletingCommessa] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Toast locale di fallback se showToastNotification non è fornito
  const [localToast, setLocalToast] = useState(null);

  const notify = useCallback((msg, type = 'success') => {
    if (showToastNotification) {
      showToastNotification(msg, type);
    } else {
      setLocalToast({ message: msg, type });
      setTimeout(() => setLocalToast(null), 4000);
    }
  }, [showToastNotification]);

  // Caricamento iniziale
  useEffect(() => {
    fetchCommesse();
  }, [fetchCommesse]);

  // Gestione Form
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

  // Toggle rapido stato
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

  // Conferma eliminazione
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

  // Filtraggio live
  const filteredCommesse = useMemo(() => {
    return commesse.filter(c => {
      // Filtro stato
      if (statusFilter !== 'TUTTE' && c.stato !== statusFilter) {
        return false;
      }
      // Filtro testo
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const codeMatch = (c.codice || '').toLowerCase().includes(q);
      const descMatch = (c.descrizione || '').toLowerCase().includes(q);
      const ubiMatch = (c.ubicazione || '').toLowerCase().includes(q);
      return codeMatch || descMatch || ubiMatch;
    });
  }, [commesse, statusFilter, searchQuery]);

  // Metriche
  const stats = useMemo(() => {
    const total = commesse.length;
    const attive = commesse.filter(c => c.stato === 'Attiva').length;
    const chiuse = commesse.filter(c => c.stato === 'Chiusa').length;
    return { total, attive, chiuse };
  }, [commesse]);

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
      {/* Header fisso della schermata */}
      <div className="shrink-0 px-2 sm:px-4 md:px-6 pt-1 pb-3 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {setView && (
              <button 
                type="button"
                onClick={() => setView('home')} 
                className="glass-button p-2.5 rounded-2xl text-accent-blue hover:scale-105 active:scale-95 transition-all shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                title="Torna all'inventario"
                aria-label="Indietro"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="app-overline text-accent-orange">Gestione Centri di Costo</span>
                <span className="text-[10px] font-mono font-bold bg-slate-900/5 dark:bg-white/10 px-2 py-0.5 rounded-full dark:text-slate-300 text-slate-600">
                  {stats.total} totali
                </span>
              </div>
              <h1 className="app-h1 text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="text-accent-blue shrink-0 hidden sm:inline-block" size={24} />
                Commesse
              </h1>
            </div>
          </div>

          {/* Azioni Principali Top Bar */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => fetchCommesse()}
              disabled={isLoading}
              className="glass-button min-h-[44px] min-w-[44px] p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-accent-blue transition-all shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-50"
              title="Ricarica elenco commesse"
              aria-label="Ricarica commesse"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="action-btn action-btn-primary min-h-[44px] px-4 py-2.5 rounded-[16px] flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-initial cursor-pointer"
            >
              <Plus size={18} className="shrink-0" />
              <span className="text-xs sm:text-sm font-black tracking-wider whitespace-nowrap">NUOVA COMMESSA</span>
            </button>
          </div>
        </div>

        {/* Barra di Ricerca e Filtri di Stato */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 pt-1">
          {/* Campo Cerca */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Cerca per codice, descrizione, ubicazione..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-2xl py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Cancella ricerca"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Selettore Filtro Stato */}
          <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/60 dark:border-white/5 shrink-0 self-start md:self-auto w-full md:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('TUTTE')}
              className={`flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
                statusFilter === 'TUTTE'
                  ? 'bg-white dark:bg-slate-800 text-accent-blue shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tutte ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Attiva')}
              className={`flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[38px] flex items-center justify-center gap-1.5 ${
                statusFilter === 'Attiva'
                  ? 'bg-white dark:bg-slate-800 text-accent-emerald shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-accent-emerald shrink-0" />
              Attive ({stats.attive})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Chiusa')}
              className={`flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[38px] flex items-center justify-center gap-1.5 ${
                statusFilter === 'Chiusa'
                  ? 'bg-white dark:bg-slate-800 text-slate-500 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              Chiuse ({stats.chiuse})
            </button>
          </div>
        </div>
      </div>

      {/* Contenitore Dati Scrollabile App-Like */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 sm:px-4 md:px-6 p-2 pb-24 sm:pb-12">
        {isLoading && commesse.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
            <p className="app-body text-slate-500 dark:text-slate-400 font-bold">
              Caricamento commesse in corso...
            </p>
          </div>
        ) : filteredCommesse.length === 0 ? (
          <div className="glass-panel p-8 sm:p-12 rounded-[28px] text-center flex flex-col items-center justify-center my-6 max-w-lg mx-auto border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-3 text-accent-blue">
              <FolderKanban size={28} />
            </div>
            <h3 className="app-h2 text-slate-900 dark:text-white mb-1">
              {searchQuery || statusFilter !== 'TUTTE' ? 'Nessuna commessa trovata' : 'Nessuna commessa registrata'}
            </h3>
            <p className="app-body text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-5 max-w-sm">
              {searchQuery || statusFilter !== 'TUTTE'
                ? 'Prova a modificare i termini di ricerca o i filtri di stato.'
                : 'Inizia creando la prima commessa di produzione per associare prelievi e giacenze.'}
            </p>
            {searchQuery || statusFilter !== 'TUTTE' ? (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setStatusFilter('TUTTE'); }}
                className="glass-button px-4 py-2.5 rounded-xl text-accent-orange font-bold text-xs cursor-pointer"
              >
                Resetta Filtri
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="action-btn action-btn-primary px-5 py-2.5 rounded-xl font-black text-xs cursor-pointer flex items-center gap-2"
              >
                <Plus size={16} />
                <span>CREA LA PRIMA COMMESSA</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
            {filteredCommesse.map((item) => {
              const isAttiva = item.stato === 'Attiva';
              const isToggling = togglingId === item.id;
              const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : null;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenEdit(item)}
                  className="glass-panel p-4 sm:p-5 rounded-[24px] border border-slate-200/60 dark:border-white/10 flex flex-col justify-between transition-all duration-200 hover:border-accent-blue/40 shadow-xs hover:shadow-md relative overflow-hidden group shrink-0 cursor-pointer"
                >
                  {/* Sezione Superiore: Codice + Badge Toggle Stato */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0 border border-accent-blue/20 text-accent-blue">
                          <FolderKanban size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="app-caption text-slate-400 uppercase tracking-widest leading-none">
                            Codice Commessa
                          </span>
                          <span className="app-body font-black text-accent-blue truncate mt-0.5" title={item.codice}>
                            {item.codice}
                          </span>
                        </div>
                      </div>

                      {/* Azioni Kebab e Badge Stato */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`badge ${isAttiva ? 'badge-emerald' : 'badge-slate'} inline-flex items-center gap-1.5 shrink-0 min-h-[38px]`}
                          title={`Stato attuale: ${item.stato || 'Attiva'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isAttiva ? 'bg-accent-emerald animate-pulse' : 'bg-slate-400'}`} />
                          <span className="app-caption uppercase tracking-wider">{item.stato || 'Attiva'}</span>
                        </span>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === item.id ? null : item.id);
                            }}
                            className="glass-button min-h-[38px] min-w-[38px] p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                            aria-label="Opzioni commessa"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openMenuId === item.id && (
                            <div className="absolute right-0 top-full mt-2 w-48 glass-panel p-2 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-lg z-10 flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStato(item);
                                  setOpenMenuId(null);
                                }}
                                disabled={isToggling}
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left app-caption text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                <RefreshCw size={15} className={isToggling ? 'animate-spin' : ''} />
                                {isAttiva ? 'Imposta Chiusa' : 'Imposta Attiva'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingCommessa(item);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left app-caption text-accent-rose hover:bg-accent-rose/10 transition-colors cursor-pointer"
                              >
                                <Trash2 size={15} />
                                Elimina
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Corpo della card: Descrizione */}
                    <div className="my-2">
                      <h3 className="app-h3 text-slate-900 dark:text-white leading-snug line-clamp-2" title={item.descrizione || ''}>
                        {item.descrizione || <span className="text-slate-400 dark:text-slate-600 italic font-normal">Nessuna descrizione inserita</span>}
                      </h3>
                    </div>
                  </div>

                  {/* Sezione Inferiore: Ubicazione e Data */}
                  <div className="pt-3 mt-3 border-t border-slate-200/50 dark:border-white/5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 min-w-0 flex-1">
                        <MapPin size={14} className="text-accent-orange shrink-0" />
                        <span className="app-caption truncate" title={item.ubicazione || 'Non specificata'}>
                          {item.ubicazione || 'Ubicazione non definita'}
                        </span>
                      </div>

                      {formattedDate && (
                        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 shrink-0">
                          <Calendar size={13} className="shrink-0" />
                          <span className="app-caption">{formattedDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog di Creazione / Modifica Commessa */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent 
          showCloseButton={false} 
          className="glass-panel w-[95vw] sm:w-full sm:max-w-2xl md:max-w-3xl overflow-hidden p-0 rounded-[28px] sm:rounded-[36px] z-[1001] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border dark:border-white/10 border-slate-900/10 shadow-2xl flex flex-col focus:outline-none"
        >
          <DialogTitle className="sr-only">
            {editingCommessa ? `Modifica Commessa ${editingCommessa.codice}` : 'Nuova Commessa'}
          </DialogTitle>

          {/* Header del Modale con allineamento standard */}
          <div className="flex items-center justify-between p-5 sm:p-7 shrink-0 border-b dark:border-white/10 border-slate-900/10 gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-[18px] bg-accent-blue/10 flex items-center justify-center shrink-0 border border-accent-blue/20 text-accent-blue shadow-xs">
                {editingCommessa ? <Pencil size={22} /> : <FolderKanban size={22} />}
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-3 flex-wrap min-w-0 mb-1">
                  <h2 className="app-h2 text-slate-900 dark:text-white leading-tight">
                    {editingCommessa ? 'Modifica Commessa' : 'Nuova Commessa'}
                  </h2>
                  {editingCommessa && (
                    <span className="app-caption px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold border border-slate-200 dark:border-slate-700">
                      {editingCommessa.codice}
                    </span>
                  )}
                  {editingCommessa && (
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      editingCommessa.stato === 'Attiva'
                        ? 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30'
                        : 'bg-slate-500/15 text-slate-500 border border-slate-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${editingCommessa.stato === 'Attiva' ? 'bg-accent-emerald animate-pulse' : 'bg-slate-400'}`} />
                      {editingCommessa.stato || 'Attiva'}
                    </span>
                  )}
                </div>
                <p className="app-body text-slate-500 dark:text-slate-400 text-sm">
                  {editingCommessa 
                    ? 'Aggiorna i parametri e lo stato della commessa.' 
                    : 'Registra una nuova commessa di produzione.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
              className="glass-button min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl flex items-center justify-center hover:rotate-90 transition-transform shrink-0 cursor-pointer disabled:opacity-50"
              title="Chiudi modale"
              aria-label="Chiudi modale"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body con padding e spacing ergonomici */}
          <form id="commessa-form" onSubmit={handleSubmit} className="flex flex-col p-6 sm:p-8 gap-5 sm:gap-6 overflow-y-auto custom-scrollbar max-h-[70dvh]">
            {formErrors.submit && (
              <div className="p-3.5 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs font-bold flex items-center gap-2.5">
                <AlertCircle size={18} className="shrink-0" />
                <span>{formErrors.submit}</span>
              </div>
            )}

            {/* Griglia a 2 Colonne su Desktop: Codice ed Ubicazione */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {/* Campo Codice Commessa */}
              <div className="flex flex-col gap-2">
                <label htmlFor="commessa-codice" className="app-overline text-slate-700 dark:text-slate-200 ml-1">
                  Codice Commessa *
                </label>
                <input
                  id="commessa-codice"
                  type="text"
                  name="codice"
                  required
                  placeholder="es. COM-2026-001"
                  value={formData.codice}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 transition-all min-h-[48px]"
                />
                {formErrors.codice && (
                  <span className="text-xs font-bold text-accent-rose px-1 flex items-center gap-1">
                    <AlertCircle size={13} className="shrink-0" />
                    {formErrors.codice}
                  </span>
                )}
              </div>

              {/* Campo Ubicazione */}
              <div className="flex flex-col gap-2">
                <label htmlFor="commessa-ubicazione" className="app-overline text-slate-700 dark:text-slate-200 ml-1">
                  Ubicazione / Reparto
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="commessa-ubicazione"
                    type="text"
                    name="ubicazione"
                    placeholder="es. Reparto CNC 1"
                    value={formData.ubicazione}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 transition-all font-medium min-h-[48px]"
                  />
                </div>
              </div>
            </div>

            {/* Campo Descrizione / Progetto */}
            <div className="flex flex-col gap-2">
              <label htmlFor="commessa-descrizione" className="app-overline text-slate-700 dark:text-slate-200 ml-1">
                Descrizione Lavorazione
              </label>
              <textarea
                id="commessa-descrizione"
                name="descrizione"
                rows={3}
                placeholder="Dettagli della lavorazione..."
                value={formData.descrizione}
                onChange={handleInputChange}
                className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 transition-all resize-none font-medium leading-relaxed min-h-[80px]"
              />
            </div>

            {/* Campo Stato Operativo */}
            <div className="flex flex-col gap-2">
              <label className="app-overline text-slate-700 dark:text-slate-200 ml-1">
                Stato Commessa
              </label>
              <div className="flex items-center bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, stato: 'Attiva' }))}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all min-h-[40px] cursor-pointer ${
                    formData.stato === 'Attiva'
                      ? 'bg-white dark:bg-slate-800 text-accent-emerald shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.stato === 'Attiva' ? 'bg-accent-emerald animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  ATTIVA
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, stato: 'Chiusa' }))}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all min-h-[40px] cursor-pointer ${
                    formData.stato === 'Chiusa'
                      ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.stato === 'Chiusa' ? 'bg-slate-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  CHIUSA
                </button>
              </div>
            </div>
          </form>

          {/* Footer del Modale con spaziatura generosa */}
          <div className="p-4 sm:p-6 px-6 sm:px-8 border-t dark:border-white/10 border-slate-900/10 flex items-center justify-between gap-3 sm:gap-4 shrink-0 bg-slate-50/70 dark:bg-slate-900/50 backdrop-blur-md">
            <div>
              {editingCommessa && (
                <button
                  type="button"
                  onClick={() => {
                    const commessaToDelete = editingCommessa;
                    handleCloseDialog();
                    setDeletingCommessa(commessaToDelete);
                  }}
                  disabled={isSubmitting}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-accent-rose hover:bg-accent-rose/10 transition-colors flex items-center justify-center disabled:opacity-50 cursor-pointer"
                  title="Elimina commessa"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                form="commessa-form"
                disabled={isSubmitting || !formData.codice.trim()}
                className="action-btn action-btn-primary px-6 sm:px-8 py-2.5 rounded-xl text-sm font-black tracking-wider min-h-[44px] flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>SALVATAGGIO</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>SALVA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog di Conferma Eliminazione Commessa */}
      <Dialog 
        open={!!deletingCommessa} 
        onOpenChange={(open) => { 
          if (!open && !isDeleting) setDeletingCommessa(null); 
        }}
      >
        <DialogContent 
          showCloseButton={false} 
          className="glass-panel w-[94vw] sm:w-full sm:max-w-lg md:max-w-lg overflow-hidden p-0 rounded-[28px] sm:rounded-[36px] z-[1002] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border dark:border-white/10 border-slate-900/10 shadow-2xl flex flex-col focus:outline-none"
        >
          <DialogTitle className="sr-only">Conferma Eliminazione Commessa</DialogTitle>

          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 px-6 sm:px-8 shrink-0 border-b dark:border-white/10 border-slate-900/10">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-[16px] bg-accent-rose/10 flex items-center justify-center shrink-0 border border-accent-rose/20 text-accent-rose shadow-xs">
                <Trash2 size={20} />
              </div>
              <div className="min-w-0">
                <p className="app-overline text-accent-rose leading-tight">Azione Distruttiva</p>
                <h2 className="app-h2 text-slate-900 dark:text-white leading-tight">Elimina Commessa</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDeletingCommessa(null)}
              disabled={isDeleting}
              className="glass-button min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl flex items-center justify-center hover:rotate-90 transition-transform shrink-0 cursor-pointer disabled:opacity-50"
              title="Chiudi modale"
              aria-label="Chiudi modale"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 flex flex-col gap-4 text-sm text-slate-600 dark:text-slate-300">
            <p className="app-body leading-relaxed text-sm">
              Sei sicuro di voler eliminare definitivamente la commessa <strong className="font-mono text-accent-blue font-black bg-accent-blue/10 px-2 py-0.5 rounded-md border border-accent-blue/20">{deletingCommessa?.codice}</strong>?
            </p>
            {deletingCommessa?.descrizione && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-100 dark:bg-white/5 p-3.5 rounded-xl border border-slate-200/50 dark:border-white/5 leading-relaxed">
                "{deletingCommessa.descrizione}"
              </p>
            )}
            <div className="p-3.5 rounded-xl bg-accent-orange/10 border border-accent-orange/20 text-accent-orange text-xs flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">
                I movimenti storici registrati rimarranno archiviati per integrità dei log, ma il collegamento diretto alla commessa verrà rimosso.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 sm:p-6 px-6 sm:px-8 border-t dark:border-white/10 border-slate-900/10 flex items-center justify-end gap-3 shrink-0 bg-slate-50/70 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => setDeletingCommessa(null)}
              disabled={isDeleting}
              className="glass-button px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 min-h-[44px] cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="action-btn action-btn-scarica px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-wider min-h-[44px] flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ELIMINAZIONE...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>ELIMINA DEFINITIVAMENTE</span>
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast locale di fallback */}
      <AnimatePresence>
        {localToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[9999] max-w-sm safe-toast-top"
          >
            <div className={`p-4 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-xl ${
              localToast.type === 'error'
                ? 'bg-rose-950/90 border-accent-rose text-white'
                : 'bg-slate-900/90 border-accent-emerald text-white'
            }`}>
              {localToast.type === 'error' ? (
                <AlertCircle size={20} className="text-accent-rose shrink-0" />
              ) : (
                <CheckCircle2 size={20} className="text-accent-emerald shrink-0" />
              )}
              <span className="text-xs font-bold">{localToast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
