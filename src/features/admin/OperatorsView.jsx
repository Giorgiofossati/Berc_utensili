import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Shield, User, Check, RefreshCw, AlertTriangle, Eye, EyeOff, HelpCircle, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { PageTemplate, PageHeader, PageContent } from '@/components/layout/PageTemplate';
import { IconButton, IconMenu } from '@/components/ui/icon-button';
import { StateBlock } from '@/components/common/StateBlock';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useTutorialStore } from '../../store/useTutorialStore';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const withTimeout = (promise, timeoutMs = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout di risposta dal database (5s)")), timeoutMs)
    )
  ]);
};

const OperatorsView = memo(({ setView }) => {
  const currentUser = useAuthStore(state => state.currentUser);
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);

  useEffect(() => {
    if (currentUser && currentUser.ruolo !== 'Admin') {
      setView('home');
    }
  }, [currentUser, setView]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    codice_id: '',
    ruolo: 'Operatore',
    password: ''
  });
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      let fetchPromise = supabase
        .from('utenti')
        .select('id, nome, cognome, codice_id, ruolo, has_completed_tutorial')
        .order('nome', { ascending: true });
      
      let { data, error } = await withTimeout(fetchPromise);
      if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('has_completed_tutorial'))) {
        const fallbackRes = await withTimeout(
          supabase.from('utenti').select('id, nome, cognome, codice_id, ruolo').order('nome', { ascending: true })
        );
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Errore caricamento utenti:', err);
      setFetchError(err.message || 'Errore nel caricamento degli operatori');
      showToast('Errore nel caricamento degli operatori', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(u => 
      `${u.nome} ${u.cognome}`.toLowerCase().includes(query) ||
      (u.codice_id && String(u.codice_id).toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleRoleChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      ruolo: val,
      password: val === 'Admin' ? prev.password : ''
    }));
    setFormErrors(prev => ({ ...prev, ruolo: null, password: null }));
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      nome: '',
      cognome: '',
      codice_id: '',
      ruolo: 'Operatore',
      password: ''
    });
    setFormErrors({});
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome || '',
      cognome: user.cognome || '',
      codice_id: user.codice_id || '',
      ruolo: user.ruolo || 'Operatore',
      password: ''
    });
    setFormErrors({});
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nome.trim()) errors.nome = 'Il nome è obbligatorio';
    if (!formData.cognome.trim()) errors.cognome = 'Il cognome è obbligatorio';
    if (!formData.codice_id.trim()) errors.codice_id = "L'ID codice è obbligatorio";
    
    const duplicate = users.find(u => 
      u.codice_id?.trim().toLowerCase() === formData.codice_id.trim().toLowerCase() && 
      (!editingUser || u.id !== editingUser.id)
    );
    if (duplicate) {
      errors.codice_id = "Questo ID codice è già assegnato a un altro operatore";
    }

    if (formData.ruolo === 'Admin' && !editingUser && !formData.password.trim()) {
      errors.password = 'La password è obbligatoria per il ruolo Admin';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      const payload = {
        nome: formData.nome.trim(),
        cognome: formData.cognome.trim(),
        codice_id: formData.codice_id.trim(),
        ruolo: formData.ruolo
      };

      if (formData.ruolo === 'Admin') {
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        } else if (!editingUser) {
          throw new Error('La password è obbligatoria per il ruolo Admin');
        }
      } else {
        payload.password = null;
      }

      let response;
      if (editingUser) {
        if (editingUser.ruolo === 'Admin' && editingUser.id !== currentUser.id) {
          throw new Error("Non sei autorizzato a modificare l'account di un altro amministratore");
        }
        
        const updatePromise = supabase
          .from('utenti')
          .update(payload)
          .eq('id', editingUser.id)
          .select();
        
        response = await withTimeout(updatePromise);
      } else {
        const newUserData = {
          id: generateUUID(),
          ...payload,
          has_completed_tutorial: false
        };
        
        let insertPromise = supabase
          .from('utenti')
          .insert([newUserData])
          .select();
        
        response = await withTimeout(insertPromise);
        if (response.error && (response.error.message?.includes('has_completed_tutorial') || response.error.code === 'PGRST204')) {
          const fallbackData = { id: newUserData.id, ...payload };
          response = await withTimeout(
            supabase.from('utenti').insert([fallbackData]).select()
          );
        }
      }

      const { data, error } = response;
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Salvataggio fallito: permesso negato (RLS) o record non trovato");
      }

      showToast(editingUser ? `Operatore ${payload.nome} aggiornato con successo!` : `Operatore ${payload.nome} creato con successo!`);
      
      if (editingUser && editingUser.id === currentUser.id) {
        if (payload.ruolo === 'Operatore') {
          setCurrentUser(null);
          return;
        } else {
          setCurrentUser(prev => ({
            ...prev,
            ...payload
          }));
        }
      }

      setIsDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Errore nel salvataggio dell'operatore:", err);
      showToast(err.message || "Errore durante il salvataggio dei dati", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    
    if (deletingUser.ruolo === 'Admin' && deletingUser.id !== currentUser.id) {
      showToast("Non sei autorizzato a eliminare l'account di un altro amministratore", "error");
      setDeletingUser(null);
      return;
    }

    setActionLoading(true);
    try {
      const deletePromise = supabase
        .from('utenti')
        .delete()
        .eq('id', deletingUser.id)
        .select();
      
      const { data, error } = await withTimeout(deletePromise);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Permesso negato (RLS) o operatore non trovato nel database");
      }

      showToast(`Operatore ${deletingUser.nome} rimosso dal sistema`);
      
      if (deletingUser.id === currentUser.id) {
        setCurrentUser(null);
        return;
      }

      fetchUsers();
    } catch (err) {
      console.error("Errore nell'eliminazione:", err);
      showToast(err.message || "Impossibile eliminare l'operatore", "error");
    } finally {
      setDeletingUser(null);
      setActionLoading(false);
    }
  };

  const handleResetTutorial = async (user) => {
    try {
      localStorage.removeItem(`berc_tutorial_completed_${user.id}`);
      const { error } = await supabase
        .from('utenti')
        .update({ has_completed_tutorial: false })
        .eq('id', user.id);
      
      if (error && !error.message?.includes('has_completed_tutorial')) {
        console.warn('Errore reset tutorial:', error);
      }

      if (currentUser && user.id === currentUser.id) {
        setCurrentUser({ ...currentUser, has_completed_tutorial: false });
        showToast('Tutorial riattivato! Avvio in corso...');
        setTimeout(() => {
          useTutorialStore.getState().startTutorial();
        }, 400);
      } else {
        showToast(`Tutorial riattivato per ${user.nome}! Al prossimo login visualizzerà la guida.`);
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Errore durante il reset del tutorial', 'error');
    }
  };

  if (!currentUser || currentUser.ruolo !== 'Admin') {
    return null;
  }

  return (
    <PageTemplate>
      <PageHeader
        title="Gestione Operatori"
        breadcrumb="Amministrazione"
        showBack={true}
        onBack={() => setView('home')}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Cerca operatore per nome o ID…',
          label: 'Cerca negli operatori',
        }}
        action={
          <div className="flex gap-2">
            <IconButton
              icon={<RefreshCw size={16} className={loading ? "animate-spin text-accent-blue" : ""} />}
              onClick={fetchUsers}
              disabled={loading}
              aria-label="Aggiorna operatori"
              title="Aggiorna"
              variant="outline"
              className="glass-button border-slate-900/10 dark:border-white/10"
            />
            <button 
              onClick={handleOpenCreate}
              className="action-btn action-btn-primary px-4 py-2 rounded-xl font-black text-xs sm:text-sm tracking-wider flex items-center gap-2"
            >
              <UserPlus size={16} /> <span className="hidden sm:inline">Nuovo Operatore</span>
            </button>
          </div>
        }
      />


      <PageContent>
        {loading ? (
          <StateBlock state="loading" skeletonShape="card" count={6} title="Caricamento operatori in corso..." />
        ) : fetchError && users.length === 0 ? (
          <StateBlock 
            state="error" 
            title="Errore nel caricamento degli operatori" 
            description={fetchError} 
            action={
              <button 
                type="button"
                onClick={fetchUsers} 
                className="action-btn action-btn-primary px-6 py-2 rounded-xl text-sm font-black"
              >
                Riprova
              </button>
            }
          />
        ) : filteredUsers.length === 0 ? (
          <StateBlock 
            state="empty" 
            variant={searchQuery.trim() ? 'search' : 'generic'}
            searchTerm={searchQuery.trim()}
            title={searchQuery.trim() ? undefined : 'Nessun operatore registrato'}
            description={searchQuery.trim() ? undefined : 'Aggiungi un nuovo operatore per iniziare ad assegnare attività e tracciare le operazioni.'}
            action={
              searchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="glass-button px-4 py-2 rounded-xl font-bold text-sm text-accent-orange"
                >
                  Resetta Ricerca
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleOpenCreate}
                  className="action-btn action-btn-primary px-6 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  <span>NUOVO OPERATORE</span>
                </button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredUsers.map(u => {
              const isSelf = u.id === currentUser.id;
              const initials = `${u.nome?.[0] || ''}${u.cognome?.[0] || ''}`.toUpperCase();
              
              const menuItems = [
                {
                  label: 'Reimposta Tutorial',
                  icon: <HelpCircle size={16} />,
                  onClick: () => handleResetTutorial(u)
                }
              ];

              if (u.ruolo !== 'Admin' || isSelf) {
                menuItems.push({
                  label: 'Modifica',
                  icon: <Edit2 size={16} />,
                  onClick: () => handleEditClick(u)
                });
                menuItems.push({
                  label: 'Elimina',
                  icon: <Trash2 size={16} />,
                  destructive: true,
                  onClick: () => setDeletingUser(u)
                });
              }

              return (
                <div 
                  key={u.id}
                  className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${
                    isSelf 
                      ? 'ring-2 ring-accent-orange/40 bg-accent-orange/[0.03] dark:bg-accent-orange/[0.01] border-accent-orange/30 hover:bg-accent-blue/[0.06]' 
                      : 'glass-panel hover:border-accent-blue/30 hover:bg-accent-blue/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold tracking-tight text-sm shrink-0 shadow-sm ${
                      u.ruolo === 'Admin' 
                        ? 'bg-accent-orange/20 text-accent-orange' 
                        : 'bg-accent-blue/20 text-accent-blue'
                    }`}>
                      {initials || <User size={16} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-bold dark:text-white text-slate-900 uppercase tracking-tight text-sm truncate min-w-0">
                          {u.nome} {u.cognome}
                        </h4>
                        {isSelf && (
                          <span className="text-xs font-black uppercase tracking-wider bg-accent-orange/10 text-accent-orange px-2 py-0.5 rounded border border-accent-orange/20 shrink-0">
                            Tu
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs dark:text-slate-400 text-slate-600 font-medium">
                        <span className="font-mono tracking-wider bg-muted/50 px-2 py-0.5 rounded-md">ID: {u.codice_id}</span>
                        <span className="flex items-center gap-1">
                          {u.ruolo === 'Admin' ? (
                            <>
                              <Shield size={14} className="text-accent-orange" />
                              <span className="text-accent-orange font-bold uppercase tracking-wider">Admin</span>
                            </>
                          ) : (
                            <>
                              <User size={14} className="text-accent-blue" />
                              <span className="text-accent-blue font-bold uppercase tracking-wider">Operatore</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    <IconMenu items={menuItems} ariaLabel="Opzioni operatore" variant="ghost" />
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
            icon={<UserPlus size={24} />}
            title={editingUser ? "Modifica Operatore" : "Nuovo Operatore"} 
            subtitle={editingUser ? "Modifica i dati del profilo." : "Aggiungi un nuovo operatore al sistema."}
          />
          <ModalBody>
            <form id="operator-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="app-overline text-slate-600 dark:text-slate-300">Nome *</label>
                  <input 
                    type="text" 
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    className={`glass-input w-full border ${formErrors.nome ? 'border-accent-rose' : 'dark:border-white/10 border-slate-900/10'} rounded-xl py-2.5 px-3 text-sm`}
                  />
                  {formErrors.nome && <span className="text-accent-rose text-xs font-bold">{formErrors.nome}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="app-overline text-slate-600 dark:text-slate-300">Cognome *</label>
                  <input 
                    type="text" 
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleInputChange}
                    className={`glass-input w-full border ${formErrors.cognome ? 'border-accent-rose' : 'dark:border-white/10 border-slate-900/10'} rounded-xl py-2.5 px-3 text-sm`}
                  />
                  {formErrors.cognome && <span className="text-accent-rose text-xs font-bold">{formErrors.cognome}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="app-overline text-slate-600 dark:text-slate-300">Codice ID / Barcode *</label>
                <input 
                  type="text" 
                  name="codice_id"
                  value={formData.codice_id}
                  onChange={handleInputChange}
                  className={`glass-input w-full border ${formErrors.codice_id ? 'border-accent-rose' : 'dark:border-white/10 border-slate-900/10'} rounded-xl py-2.5 px-3 font-mono text-sm`}
                />
                {formErrors.codice_id && <span className="text-accent-rose text-xs font-bold">{formErrors.codice_id}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="app-overline text-slate-600 dark:text-slate-300">Ruolo Operativo *</label>
                <select 
                  value={formData.ruolo}
                  onChange={handleRoleChange}
                  className="glass-input w-full border dark:border-white/10 border-slate-900/10 rounded-xl py-2.5 px-3 text-sm"
                >
                  <option value="Operatore">Operatore (Solo Prelievo/Deposito)</option>
                  <option value="Admin">Admin (Accesso Completo + Gestione)</option>
                </select>
              </div>

              <AnimatePresence>
                {formData.ruolo === 'Admin' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-1.5 overflow-hidden"
                  >
                    <label className="app-overline text-slate-600 dark:text-slate-300 mt-2">Password Admin *</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`glass-input w-full border ${formErrors.password ? 'border-accent-rose' : 'dark:border-white/10 border-slate-900/10'} rounded-xl py-2.5 pl-3 pr-10 font-mono text-sm`}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {formErrors.password && <span className="text-accent-rose text-xs font-bold">{formErrors.password}</span>}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </ModalBody>
          <ModalFooter>
            <button 
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Annulla
            </button>
            <button 
              type="submit" 
              form="operator-form"
              disabled={actionLoading}
              className="action-btn action-btn-primary px-6 py-2 rounded-xl text-sm font-black flex items-center justify-center gap-2"
            >
              {actionLoading ? "Salvataggio..." : "Salva"}
            </button>
          </ModalFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent size="md">
          <ModalHeader 
            icon={<AlertTriangle size={24} className="text-accent-rose" />}
            title="Conferma Eliminazione" 
          />
          <ModalBody>
            <p className="app-body">
              Stai per eliminare definitivamente l'operatore <strong className="text-foreground">{deletingUser?.nome} {deletingUser?.cognome}</strong> (ID: {deletingUser?.codice_id}).
            </p>
            {deletingUser?.id === currentUser?.id && (
              <div className="mt-4 p-3 bg-accent-orange/10 border border-accent-orange/20 rounded-xl flex items-start gap-2">
                <AlertTriangle size={16} className="text-accent-orange mt-0.5 shrink-0" />
                <p className="text-xs text-accent-orange font-bold">
                  Attenzione: Stai eliminando il tuo account. Verrai disconnesso immediatamente.
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <button 
              onClick={() => setDeletingUser(null)}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Annulla
            </button>
            <button 
              onClick={confirmDelete}
              disabled={actionLoading}
              className="action-btn action-btn-scarica px-6 py-2 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
            >
              {actionLoading ? "Eliminazione..." : "Sì, Elimina"}
            </button>
          </ModalFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9 }} 
            className="fixed left-4 right-4 md:left-auto md:right-12 z-50 pointer-events-auto top-4"
          >
            <div className={`glass-panel p-4 rounded-2xl border-l-[6px] bg-background/90 backdrop-blur-xl ${
              toast.type === 'error' ? 'border-accent-rose' : 'border-accent-blue'
            } flex items-center gap-4 shadow-xl`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                toast.type === 'error' ? 'bg-accent-rose/20 text-accent-rose' : 'bg-accent-blue/20 text-accent-blue'
              }`}>
                <Check size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">{toast.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </PageTemplate>
  );
});

export default OperatorsView;
