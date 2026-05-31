import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, UserPlus, Edit2, Trash2, Shield, User, 
  Lock, Check, X, RefreshCw, Key, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [editingUser, setEditingUser] = useState(null); // null means creation mode
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    codice_id: '',
    ruolo: 'Operatore',
    password: ''
  });
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null); // stores user object when confirming delete
  const [toast, setToast] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const fetchPromise = supabase
        .from('utenti')
        .select('*')
        .order('nome', { ascending: true });
      
      const { data, error } = await withTimeout(fetchPromise);
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Errore caricamento utenti:', err);
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

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome || '',
      cognome: user.cognome || '',
      codice_id: user.codice_id || '',
      ruolo: user.ruolo || 'Operatore',
      password: user.password || ''
    });
    setFormErrors({});
    setShowPassword(false);
  };

  const resetForm = () => {
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
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nome.trim()) errors.nome = 'Il nome è obbligatorio';
    if (!formData.cognome.trim()) errors.cognome = 'Il cognome è obbligatorio';
    if (!formData.codice_id.trim()) errors.codice_id = "L'ID codice è obbligatorio";
    
    // Check if ID is unique
    const duplicate = users.find(u => 
      u.codice_id?.trim().toLowerCase() === formData.codice_id.trim().toLowerCase() && 
      (!editingUser || u.id !== editingUser.id)
    );
    if (duplicate) {
      errors.codice_id = "Questo ID codice è già assegnato a un altro operatore";
    }

    if (formData.ruolo === 'Admin' && !formData.password.trim()) {
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
        ruolo: formData.ruolo,
        password: formData.ruolo === 'Admin' ? formData.password.trim() : null
      };

      let response;
      if (editingUser) {
        // Safe check: do not allow modifying other admins
        if (editingUser.ruolo === 'Admin' && editingUser.id !== currentUser.id) {
          throw new Error("Non sei autorizzato a modificare l'account di un altro amministratore");
        }
        
        // Update user
        const updatePromise = supabase
          .from('utenti')
          .update(payload)
          .eq('id', editingUser.id)
          .select();
        
        response = await withTimeout(updatePromise);
      } else {
        // Create user
        const insertPromise = supabase
          .from('utenti')
          .insert([{
            id: generateUUID(),
            ...payload
          }])
          .select();
        
        response = await withTimeout(insertPromise);
      }

      const { data, error } = response;
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Salvataggio fallito: permesso negato (RLS) o record non trovato");
      }

      showToast(editingUser ? `Operatore ${payload.nome} aggiornato con successo!` : `Operatore ${payload.nome} creato con successo!`);
      
      // Se l'utente modificato è quello correntemente loggato, aggiorniamo il suo stato locale
      if (editingUser && editingUser.id === currentUser.id) {
        // Se ha cambiato il proprio ruolo in Operatore, deve essere sloggato o reindirizzato poiché gli operatori non hanno privilegi admin
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

      resetForm();
      fetchUsers();
    } catch (err) {
      console.error("Errore nel salvataggio dell'operatore:", err);
      showToast(err.message || "Errore durante il salvataggio dei dati", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setDeletingUser(user);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    
    // Safe check: do not allow deleting other admins
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
      
      // Se l'admin ha eliminato se stesso, lo slogghiamo
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

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="w-full max-w-7xl flex flex-col items-center gap-6 px-4 md:px-6 pb-20"
    >
      {/* Intestazione */}
      <div className="flex flex-col md:flex-row w-full justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.5em] text-accent-orange uppercase drop-shadow-md mb-2">Amministrazione</p>
          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter dark:text-white text-slate-900">Gestione Operatori</h2>
        </div>
        <button 
          onClick={() => setView('home')} 
          className="glass-panel px-6 py-3.5 rounded-[20px] font-bold text-accent-blue flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} /> Indietro
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
        
        {/* ELENCO OPERATORI */}
        <div className="lg:col-span-2 flex flex-col gap-4 w-full">
          <div className="glass-panel rounded-[32px] p-6 flex flex-col gap-4">
            
            {/* Cerca e Rinfresca */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-slate-400 text-slate-600" size={18} />
                <input 
                  type="text" 
                  placeholder="Cerca operatore per nome o ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full dark:bg-slate-950/30 bg-slate-900/5 border dark:border-white/10 border-slate-900/10 rounded-2xl py-3 pl-11 pr-4 dark:text-white text-slate-900 outline-none focus:border-accent-blue/50 transition-all text-sm font-medium"
                />
              </div>
              <button 
                onClick={fetchUsers} 
                disabled={loading}
                className="glass-button p-3 rounded-2xl dark:text-slate-300 text-slate-700 disabled:opacity-50 hover:rotate-45 transition-transform"
                title="Ricarica lista"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Lista Operatori */}
            <div className="max-h-[65vh] overflow-y-auto p-2 pb-6 custom-scrollbar">
              {loading ? (
                <div className="py-16 text-center flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
                  <p className="dark:text-slate-400 text-slate-600 text-sm font-bold">Caricamento operatori in corso...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-16 text-center dark:bg-white/5 bg-slate-900/5 rounded-3xl p-8 border border-dashed dark:border-white/10 border-slate-900/10">
                  <User className="mx-auto text-slate-400 mb-3" size={36} />
                  <p className="dark:text-slate-300 text-slate-700 font-bold mb-1">Nessun operatore trovato</p>
                  <p className="dark:text-slate-500 text-slate-500 text-xs">Prova a cambiare i filtri o aggiungi un nuovo operatore.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredUsers.map(u => {
                    const isSelf = u.id === currentUser.id;
                    const initials = `${u.nome?.[0] || ''}${u.cognome?.[0] || ''}`.toUpperCase();
                    
                    return (
                      <div 
                        key={u.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all relative overflow-hidden group shrink-0 ${
                          isSelf 
                            ? 'ring-2 ring-accent-orange/40 bg-accent-orange/[0.03] dark:bg-accent-orange/[0.01] border-accent-orange/30' 
                            : 'bg-slate-900/[0.01] dark:bg-white/[0.01] dark:border-white/5 border-slate-900/5 hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold tracking-tight text-xs shrink-0 shadow-sm ${
                            u.ruolo === 'Admin' 
                              ? 'bg-accent-orange/20 text-accent-orange' 
                              : 'bg-accent-blue/20 text-accent-blue'
                          }`}>
                            {initials || <User size={16} />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold dark:text-white text-slate-900 uppercase tracking-tight text-sm truncate">
                                {u.nome} {u.cognome}
                              </h4>
                              {isSelf && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-accent-orange/10 text-accent-orange px-2 py-0.5 rounded border border-accent-orange/20">
                                  Tu
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 mt-0.5 text-[11px] dark:text-slate-400 text-slate-600 font-medium">
                              <span className="font-mono tracking-wider bg-slate-950/20 px-2 py-0.5 rounded">ID: {u.codice_id}</span>
                              <span className="flex items-center gap-1">
                                {u.ruolo === 'Admin' ? (
                                  <>
                                    <Shield size={10} className="text-accent-orange" />
                                    <span className="text-accent-orange font-bold uppercase tracking-wider text-[9px]">Admin</span>
                                  </>
                                ) : (
                                  <>
                                    <User size={10} className="text-accent-blue" />
                                    <span className="text-accent-blue font-bold uppercase tracking-wider text-[9px]">Operatore</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Azioni */}
                        <div className="flex items-center gap-1 shrink-0">
                          {u.ruolo !== 'Admin' || isSelf ? (
                            <>
                              <button 
                                onClick={() => handleEditClick(u)}
                                className="p-2 rounded-lg glass-button text-accent-blue hover:scale-105 active:scale-95 transition-transform"
                                title="Modifica"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(u)}
                                className="p-2 rounded-lg glass-button text-accent-rose hover:scale-105 active:scale-95 transition-transform"
                                title="Elimina"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900/10 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-900/[0.04] dark:border-white/[0.04] shadow-sm select-none">
                              Protetto
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* DETTAGLIO / NUOVO OPERATORE FORM */}
        <div className="w-full">
          <div className="glass-panel rounded-[32px] p-6 flex flex-col gap-6 relative overflow-hidden">
            {editingUser && (
              <div className="absolute top-0 left-0 w-full h-[4px] bg-accent-blue animate-pulse" />
            )}
            
            <div>
              <p className="text-[10px] font-black text-accent-orange uppercase tracking-[0.2em] mb-1">
                {editingUser ? "Modalità Modifica" : "Aggiungi al Database"}
              </p>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white text-slate-900">
                {editingUser ? "Modifica Profilo" : "Nuovo Operatore"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Nome */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black dark:text-slate-300 text-slate-700 uppercase tracking-widest px-1">Nome *</label>
                <input 
                  type="text" 
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Es. Mario"
                  className={`w-full dark:bg-slate-950/20 bg-slate-900/5 border ${formErrors.nome ? 'border-accent-rose' : 'dark:border-white/10 border-slate-900/10'} rounded-2xl py-3.5 px-4 dark:text-white text-slate-900 outline-none focus:border-accent-blue/50 transition-all font-medium`}
                />
                {formErrors.nome && <span className="text-accent-rose text-[10px] font-bold px-1">{formErrors.nome}</span>}
              </div>

              {/* Cognome */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black dark:text-slate-300 text-slate-700 uppercase tracking-widest px-1">Cognome *</label>
                <input 
                  type="text" 
                  name="cognome"
                  value={formData.cognome}
                  onChange={handleInputChange}
                  placeholder="Es. Rossi"
                  className={`w-full dark:bg-slate-950/20 bg-slate-900/5 border ${formErrors.cognome ? 'border-accent-rose' : 'dark:border-white/10 border-slate-900/10'} rounded-2xl py-3.5 px-4 dark:text-white text-slate-900 outline-none focus:border-accent-blue/50 transition-all font-medium`}
                />
                {formErrors.cognome && <span className="text-accent-rose text-[10px] font-bold px-1">{formErrors.cognome}</span>}
              </div>

              {/* Codice ID (Barcode) */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black dark:text-slate-300 text-slate-700 uppercase tracking-widest px-1">Codice ID / Barcode *</label>
                <input 
                  type="text" 
                  name="codice_id"
                  value={formData.codice_id}
                  onChange={handleInputChange}
                  placeholder="Es. 998877"
                  className={`w-full dark:bg-slate-950/20 bg-slate-900/5 border ${formErrors.codice_id ? 'border-accent-rose' : 'dark:border-white/10 border-slate-900/10'} rounded-2xl py-3.5 px-4 dark:text-white text-slate-900 outline-none focus:border-accent-blue/50 transition-all font-medium font-mono`}
                />
                {formErrors.codice_id && <span className="text-accent-rose text-[10px] font-bold px-1">{formErrors.codice_id}</span>}
              </div>

              {/* Ruolo */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black dark:text-slate-300 text-slate-700 uppercase tracking-widest px-1">Ruolo Operativo *</label>
                <div className="relative">
                  <select 
                    value={formData.ruolo}
                    onChange={handleRoleChange}
                    className="w-full dark:bg-slate-950/20 bg-slate-900/5 border dark:border-white/10 border-slate-900/10 rounded-2xl py-3.5 px-4 dark:text-white text-slate-900 outline-none focus:border-accent-blue/50 transition-all font-medium appearance-none"
                  >
                    <option value="Operatore">Operatore (Solo Prelievo/Deposito)</option>
                    <option value="Admin">Admin (Accesso Completo + Gestione)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none dark:text-slate-400 text-slate-600">
                    <Shield size={18} />
                  </div>
                </div>
              </div>

              {/* Password per Admin */}
              <AnimatePresence>
                {formData.ruolo === 'Admin' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden flex flex-col gap-1"
                  >
                    <label className="text-[10px] font-black dark:text-slate-300 text-slate-700 uppercase tracking-widest px-1 mt-2">Password Admin *</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className={`w-full dark:bg-slate-950/20 bg-slate-900/5 border ${formErrors.password ? 'border-accent-rose' : 'dark:border-white/10 border-slate-900/10'} rounded-2xl py-3.5 pl-4 pr-12 dark:text-white text-slate-900 outline-none focus:border-accent-blue/50 transition-all font-mono`}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 dark:text-slate-400 text-slate-600 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {formErrors.password && <span className="text-accent-rose text-[10px] font-bold px-1">{formErrors.password}</span>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottoni di Invio */}
              <div className="flex gap-3 mt-4">
                {editingUser && (
                  <button 
                    type="button" 
                    onClick={resetForm}
                    disabled={actionLoading}
                    className="flex-1 py-4 glass-button font-black rounded-2xl uppercase tracking-[0.1em] text-xs hover:text-accent-rose"
                  >
                    Annulla
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex-2 py-4 bg-accent-blue text-slate-950 font-black rounded-2xl uppercase tracking-[0.1em] text-xs hover:bg-sky-400 transition-all flex justify-center items-center gap-2 shadow-lg shadow-accent-blue/10 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : editingUser ? (
                    <>Salva Modifiche</>
                  ) : (
                    <>
                      <UserPlus size={16} /> Aggiungi
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setDeletingUser(null)} 
              className="absolute inset-0 dark:bg-slate-950/80 bg-slate-50/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="glass-panel w-full max-w-md p-8 rounded-[36px] z-[3001] relative overflow-hidden border-accent-rose/30 shadow-[0_0_50px_rgba(244,63,94,0.1)]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-rose/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent-rose/10 flex items-center justify-center text-accent-rose mb-2">
                  <AlertTriangle size={32} />
                </div>
                
                <div>
                  <p className="text-[9px] font-black text-accent-rose uppercase tracking-[0.3em] mb-1">RIMOZIONE OPERATORE</p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white text-slate-900">Sei sicuro?</h3>
                </div>

                <p className="text-sm dark:text-slate-400 text-slate-600 leading-relaxed">
                  Stai per eliminare definitivamente l'operatore <strong className="dark:text-white text-slate-900">{deletingUser.nome} {deletingUser.cognome}</strong> (ID: {deletingUser.codice_id}) dal database. Questa operazione non può essere annullata.
                </p>

                {deletingUser.id === currentUser.id && (
                  <div className="w-full p-4 bg-accent-orange/10 border border-accent-orange/20 rounded-2xl flex items-start gap-3 text-left">
                    <AlertTriangle size={18} className="text-accent-orange shrink-0 mt-0.5" />
                    <p className="text-xs text-accent-orange font-bold leading-normal">
                      Attenzione: Stai eliminando il tuo stesso account. Verrai disconnesso immediatamente dal sistema.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 w-full mt-4">
                  <button 
                    onClick={() => setDeletingUser(null)} 
                    disabled={actionLoading}
                    className="flex-1 py-4 glass-button font-black rounded-2xl uppercase tracking-[0.1em] text-xs"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={confirmDelete}
                    disabled={actionLoading}
                    className="flex-1 py-4 bg-accent-rose text-white font-black rounded-2xl uppercase tracking-[0.1em] text-xs hover:bg-rose-600 transition-all flex justify-center items-center gap-2"
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Sì, Elimina</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9 }} 
            className="fixed left-4 right-4 md:left-auto md:right-12 z-[9999] pointer-events-auto"
            style={{ top: 'max(16px, env(safe-area-inset-top))' }}
          >
            <div className={`glass-panel p-4 md:p-6 rounded-[24px] border-l-[8px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl ${
              toast.type === 'error' ? 'border-accent-rose' : 'border-accent-blue'
            } flex items-center gap-4 shadow-2xl`}>
              <div className={`w-10 h-10 ${
                toast.type === 'error' ? 'bg-accent-rose/20 text-accent-rose' : 'bg-accent-blue/20 text-accent-blue'
              } rounded-xl flex items-center justify-center`}>
                <Check size={24} />
              </div>
              <div>
                <p className="text-[8px] font-black text-accent-orange uppercase tracking-[0.3em] mb-0.5">Notifica Sistema</p>
                <p className="font-bold text-sm dark:text-white text-slate-900 tracking-wide">{toast.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
});

export default OperatorsView;
