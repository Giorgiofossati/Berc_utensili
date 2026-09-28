import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Inbox, ArrowUp, ArrowDown, CheckCircle2, XCircle, Clock, 
  User, Briefcase, Cpu, AlertTriangle, RefreshCw, Send, Plus, 
  MessageSquare, ChevronRight, Check, X, ShieldAlert, Layers
} from 'lucide-react';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { PageTemplate, PageHeader, PageToolbar, PageContent, ResetFiltersButton } from '@/components/layout/PageTemplate';
import { StateBlock } from '@/components/common/StateBlock';
import { StatTile } from '@/components/ui/stat-tile';
import { IconButton } from '@/components/ui/icon-button';
import { useRichiesteStore } from '../../store/useRichiesteStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useCommesseStore } from '../../store/useCommesseStore';
import { useMacchineStore } from '../../store/useMacchineStore';
import { useAuthStore } from '../../store/useAuthStore';
import { buildDesc, ToolIcon } from '../../lib/toolUtils';
import { cn } from '@/lib/utils';
import AddToolToMultiModal from '../inventory/AddToolToMultiModal';

export default function RichiesteView({ setView, showToastNotification }) {
  const currentUser = useAuthStore(state => state.currentUser);
  const isAdmin = currentUser?.ruolo === 'Admin';

  const richieste = useRichiesteStore(state => state.richieste);
  const isLoading = useRichiesteStore(state => state.isLoading);
  const fetchRichieste = useRichiesteStore(state => state.fetchRichieste);
  const evadiRichiesta = useRichiesteStore(state => state.evadiRichiesta);
  const rifiutaRichiesta = useRichiesteStore(state => state.rifiutaRichiesta);
  const creaRichiesta = useRichiesteStore(state => state.creaRichiesta);

  const tools = useInventoryStore(state => state.tools);
  const commesse = useCommesseStore(state => state.commesse);
  const macchine = useMacchineStore(state => state.macchine);

  const [activeTab, setActiveTab] = useState('in_attesa'); // 'in_attesa' | 'approvata' | 'rifiutata' | 'tutte'
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Dialog Rifiuto
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Dialog Nuova Richiesta (per Operatore)
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [newRequestTipo, setNewRequestTipo] = useState('prelievo');
  const [newRequestCommessaId, setNewRequestCommessaId] = useState('');
  const [newRequestMacchinaId, setNewRequestMacchinaId] = useState('');
  const [newRequestNote, setNewRequestNote] = useState('');
  const [newRequestItems, setNewRequestItems] = useState([]);
  const [showToolPicker, setShowToolPicker] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  useEffect(() => {
    fetchRichieste();
  }, [fetchRichieste]);

  // Se l'operatore seleziona una commessa, precompila automaticamente la macchina associata!
  const handleCommessaChange = (commessaId) => {
    setNewRequestCommessaId(commessaId);
    if (!commessaId) return;
    const selectedComm = commesse.find(c => c.id === commessaId);
    if (selectedComm && selectedComm.macchina_id) {
      setNewRequestMacchinaId(selectedComm.macchina_id);
    }
  };

  // Mappa live tools per scorte attuali
  const toolsMap = useMemo(() => {
    const map = new Map();
    tools.forEach(t => map.set(t.id, t));
    return map;
  }, [tools]);

  // Conteggi KPI
  const stats = useMemo(() => {
    let pending = 0;
    let pendingPrelievi = 0;
    let pendingDepositi = 0;
    let evase = 0;

    richieste.forEach(r => {
      // Se operatore, considera solo le proprie
      if (!isAdmin && r.operatore_id && currentUser?.id && r.operatore_id !== currentUser.id) {
        return;
      }

      if (r.stato === 'in_attesa') {
        pending++;
        if (r.tipo === 'prelievo') pendingPrelievi++;
        else pendingDepositi++;
      } else if (r.stato === 'approvata') {
        evase++;
      }
    });

    return { pending, pendingPrelievi, pendingDepositi, evase };
  }, [richieste, isAdmin, currentUser]);

  // Filtro richieste visibili
  const filteredRichieste = useMemo(() => {
    return richieste.filter(r => {
      // Se operatore semplice, mostra solo le proprie richieste
      if (!isAdmin && r.operatore_id && currentUser?.id && r.operatore_id !== currentUser.id) {
        return false;
      }

      if (activeTab !== 'tutte' && r.stato !== activeTab) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const opMatch = r.operatore_nome?.toLowerCase().includes(q);
        const commMatch = r.commessa?.codice?.toLowerCase().includes(q);
        const machMatch = r.macchina?.nome?.toLowerCase().includes(q) || r.macchina?.codice?.toLowerCase().includes(q);
        const noteMatch = r.note?.toLowerCase().includes(q);
        const vociMatch = (r.voci || []).some(v => {
          const t = toolsMap.get(v.tool_id) || v.tool;
          return t?.Tipologia?.toLowerCase().includes(q) || t?.Codice?.toLowerCase().includes(q);
        });

        if (!opMatch && !commMatch && !machMatch && !noteMatch && !vociMatch) {
          return false;
        }
      }

      return true;
    });
  }, [richieste, isAdmin, currentUser, activeTab, searchQuery, toolsMap]);

  // Azione: Approva ed Evadi
  const handleApprove = async (richiesta) => {
    setProcessingId(richiesta.id);
    try {
      await evadiRichiesta(richiesta.id, { adminUser: currentUser });
      if (showToastNotification) {
        showToastNotification(
          `Richiesta di ${richiesta.tipo} per ${richiesta.operatore_nome} approvata ed evasa con successo.`,
          'success'
        );
      }
    } catch (err) {
      console.error(err);
      if (showToastNotification) {
        showToastNotification(err.message || 'Errore durante l\'evasione della richiesta', 'error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Azione: Rifiuta
  const handleRejectConfirm = async () => {
    if (!rejectingItem) return;
    setIsRejecting(true);
    try {
      await rifiutaRichiesta(rejectingItem.id, {
        adminUser: currentUser,
        motivo: rejectReason.trim() || 'Richiesta non approvata dall\'amministratore'
      });
      if (showToastNotification) {
        showToastNotification(`Richiesta respinta con successo.`, 'warning');
      }
      setRejectingItem(null);
      setRejectReason('');
    } catch (err) {
      if (showToastNotification) {
        showToastNotification(err.message || 'Errore nel respingere la richiesta', 'error');
      }
    } finally {
      setIsRejecting(false);
    }
  };

  // Creazione nuova richiesta da parte dell'operatore
  const handleCreateRequestSubmit = async (e) => {
    e.preventDefault();
    if (newRequestItems.length === 0) {
      if (showToastNotification) showToastNotification('Seleziona almeno un utensile per la richiesta.', 'warning');
      return;
    }

    setIsSubmittingNew(true);
    try {
      await creaRichiesta({
        tipo: newRequestTipo,
        operatoreId: currentUser?.id,
        operatoreNome: currentUser ? `${currentUser.nome} ${currentUser.cognome || ''}`.trim() : 'Operatore',
        commessaId: newRequestCommessaId || null,
        macchinaId: newRequestMacchinaId || null,
        note: newRequestNote.trim(),
        items: newRequestItems
      });

      if (showToastNotification) {
        showToastNotification('Richiesta inviata con successo all\'Amministratore!', 'success');
      }
      setIsNewRequestOpen(false);
      setNewRequestItems([]);
      setNewRequestNote('');
      setNewRequestCommessaId('');
      setNewRequestMacchinaId('');
    } catch (err) {
      if (showToastNotification) showToastNotification(err.message || 'Errore invio richiesta', 'error');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <PageTemplate>
      <PageHeader
        title={isAdmin ? "Richieste Deposito / Prelievo" : "Le mie Richieste"}
        breadcrumb="Magazzino"
        showBack={true}
        onBack={() => setView('home')}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          label: 'Cerca tra le richieste',
          placeholder: 'Cerca per operatore, commessa, macchina, utensile…'
        }}
        action={
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <button
                type="button"
                onClick={() => setIsNewRequestOpen(true)}
                className="action-btn action-btn-primary px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs tracking-wider shrink-0 cursor-pointer shadow-sm"
              >
                <Plus size={16} />
                <span>Nuova Richiesta</span>
              </button>
            )}
            <IconButton
              icon={<RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />}
              label="Ricarica richieste"
              onClick={fetchRichieste}
              variant="glass"
            />
          </div>
        }
      />

      {/* KPI TILES BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shrink-0">
        <StatTile
          label="In Attesa"
          value={stats.pending}
          subtext={stats.pending > 0 ? "Richiede attenzione" : "Nessuna in coda"}
          tone={stats.pending > 0 ? "orange" : "default"}
          icon={<Clock size={16} />}
        />
        <StatTile
          label="Prelievi in Coda"
          value={stats.pendingPrelievi}
          subtext="Richieste di scarico"
          tone="rose"
          icon={<ArrowUp size={16} />}
        />
        <StatTile
          label="Depositi in Coda"
          value={stats.pendingDepositi}
          subtext="Richieste di carico"
          tone="emerald"
          icon={<ArrowDown size={16} />}
        />
        <StatTile
          label="Evase Totali"
          value={stats.evase}
          subtext="Storico completate"
          tone="blue"
          icon={<CheckCircle2 size={16} />}
        />
      </div>

      <PageToolbar>
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
          <button
            type="button"
            onClick={() => setActiveTab('in_attesa')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
              activeTab === 'in_attesa'
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs"
                : "glass-button text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <Clock size={13} />
            <span>In Attesa ({stats.pending})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approvata')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
              activeTab === 'approvata'
                ? "bg-emerald-500/15 text-accent-emerald border border-emerald-500/30 shadow-xs"
                : "glass-button text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <CheckCircle2 size={13} />
            <span>Evase / Approvate</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rifiutata')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
              activeTab === 'rifiutata'
                ? "bg-rose-500/15 text-accent-rose border border-rose-500/30 shadow-xs"
                : "glass-button text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <XCircle size={13} />
            <span>Rifiutate</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tutte')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              activeTab === 'tutte'
                ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30 shadow-xs"
                : "glass-button text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Tutte ({richieste.length})
          </button>
        </div>

        {searchQuery && (
          <ResetFiltersButton
            onClick={() => setSearchQuery('')}
            label="Resetta ricerca"
          />
        )}
      </PageToolbar>

      <PageContent className="flex-1 min-h-0 flex flex-col p-2 sm:p-4 md:p-6 pb-24 overflow-y-auto">
        {filteredRichieste.length === 0 ? (
          <StateBlock
            type="empty"
            title="Nessuna richiesta trovata"
            message={searchQuery ? "Nessuna richiesta corrisponde ai criteri di ricerca." : "Non ci sono richieste in questa sezione."}
            action={
              !isAdmin ? (
                <button
                  type="button"
                  onClick={() => setIsNewRequestOpen(true)}
                  className="action-btn action-btn-primary px-4 py-2 rounded-xl text-xs font-bold mt-2"
                >
                  Crea Nuova Richiesta
                </button>
              ) : null
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredRichieste.map(req => {
              const isPrelievo = req.tipo === 'prelievo';
              const isPending = req.stato === 'in_attesa';
              const isApproved = req.stato === 'approvata';
              const isRejected = req.stato === 'rifiutata';
              const isCurrentProcessing = processingId === req.id;

              return (
                <div
                  key={req.id}
                  className={cn(
                    "glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3 border transition-all",
                    isPending
                      ? "border-amber-300/80 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm"
                      : isApproved
                      ? "border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/10 dark:bg-emerald-950/10"
                      : "border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 opacity-80"
                  )}
                >
                  {/* Top Bar: Tipo + Operatore + Stato + Data */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Badge Tipo */}
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-black tracking-wider flex items-center gap-1 border",
                        isPrelievo
                          ? "bg-rose-500/10 text-accent-rose border-rose-500/30"
                          : "bg-emerald-500/10 text-accent-emerald border-emerald-500/30"
                      )}>
                        {isPrelievo ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                        <span>{isPrelievo ? 'PRELIEVO' : 'DEPOSITO'}</span>
                      </span>

                      {/* Operatore Richiedente */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <User size={13} className="text-slate-400" />
                        <span>{req.operatore_nome}</span>
                      </div>

                      {/* Commessa & Macchina (se presenti) */}
                      {req.commessa && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200/60 dark:border-sky-800/60 text-xs font-bold text-sky-700 dark:text-sky-300">
                          <Briefcase size={13} />
                          <span>{req.commessa.codice}</span>
                        </div>
                      )}

                      {req.macchina && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <Cpu size={13} className="text-accent-blue" />
                          <span>{req.macchina.nome}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Badge Stato */}
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-extrabold tracking-wider border",
                        isPending
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : isApproved
                          ? "bg-emerald-500/15 text-accent-emerald border-emerald-500/30"
                          : "bg-rose-500/15 text-accent-rose border-rose-500/30"
                      )}>
                        {isPending ? 'In Attesa' : isApproved ? 'Evasa / Approvata' : 'Rifiutata'}
                      </span>

                      {/* Data / Ora */}
                      <span className="text-xs text-slate-400 font-medium">
                        {req.created_at ? new Date(req.created_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Note Operatore (se presenti) */}
                  {req.note && (
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <MessageSquare size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-slate-900 dark:text-white">Nota operatore: </strong>
                        <span>{req.note}</span>
                      </div>
                    </div>
                  )}

                  {/* Note Risoluzione Rifiuto */}
                  {req.note_risoluzione && isRejected && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Motivazione rifiuto: </strong>
                        <span>{req.note_risoluzione}</span>
                      </div>
                    </div>
                  )}

                  {/* Elenco Voci Utensili Richiesti */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 px-0.5">
                      Articoli Richiesti ({req.voci?.length || 0})
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(req.voci || []).map((voce, idx) => {
                        const liveTool = toolsMap.get(voce.tool_id) || voce.tool;
                        const curStock = Number(liveTool?.['Quantità'] || 0);
                        const isUnderStock = isPrelievo && curStock < voce.quantita;

                        return (
                          <div
                            key={voce.id || idx}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center shrink-0">
                                <ToolIcon tool={liveTool} size={18} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                  {liveTool ? buildDesc(liveTool) : 'Utensile'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {liveTool?.Codice && (
                                    <span className="app-caption text-[11px] font-mono font-bold text-slate-500">
                                      {liveTool.Codice}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-slate-400">
                                    Giacenza magazzino: <strong className={curStock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}>{curStock} pz</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="app-overline block text-slate-400">Richiesti</span>
                              <span className={cn(
                                "app-qty-sm font-black",
                                isUnderStock ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                              )}>
                                {voce.quantita} PZ
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Azioni per Amministratore */}
                  {isAdmin && isPending && (
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingItem(req);
                          setRejectReason('');
                        }}
                        disabled={isCurrentProcessing}
                        className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-rose-500/10 hover:border-rose-500/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Rifiuta
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(req)}
                        disabled={isCurrentProcessing}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] disabled:opacity-50",
                          isPrelievo ? "action-btn-scarica" : "action-btn-carica"
                        )}
                      >
                        <Check size={16} />
                        <span>{isCurrentProcessing ? 'Evasione in corso...' : (isPrelievo ? 'Approva & Consegna' : 'Approva & Ritira')}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageContent>

      {/* DIALOG RIFIUTO RICHIESTA */}
      <Dialog open={!!rejectingItem} onOpenChange={() => setRejectingItem(null)}>
        <DialogContent className="sm:max-w-md p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-3 text-rose-600 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Rifiuta Richiesta
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3">
            Stai per respingere la richiesta di <strong>{rejectingItem?.operatore_nome}</strong> per{' '}
            <strong>{rejectingItem?.tipo === 'prelievo' ? 'il prelievo' : 'il deposito'}</strong>.
            Inserisci una breve motivazione per l'operatore:
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Es. Utensile attualmente in riaffilatura; selezionare diametro alternativo..."
            className="glass-input w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs dark:text-white text-slate-900 outline-none focus:border-rose-500 transition-all mb-4 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectingItem(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={isRejecting}
              onClick={handleRejectConfirm}
              className="action-btn action-btn-scarica px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider cursor-pointer disabled:opacity-50"
            >
              {isRejecting ? 'Rifiuto in corso...' : 'Conferma Rifiuto'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG NUOVA RICHIESTA PER OPERATORE */}
      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90dvh] flex flex-col">
          <ModalHeader
            icon={<Send size={20} className="text-sky-600 dark:text-sky-400" />}
            title="Invia Richiesta all'Amministratore"
            description="Compila la richiesta di prelievo o deposito utensili"
            onClose={() => setIsNewRequestOpen(false)}
          />

          <form onSubmit={handleCreateRequestSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ModalBody className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-4">
              {/* Tipo Richiesta */}
              <div>
                <label className="block text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Tipo di Operazione
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRequestTipo('prelievo')}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-black tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all",
                      newRequestTipo === 'prelievo'
                        ? "bg-rose-500/15 text-accent-rose border-rose-500 shadow-xs"
                        : "glass-button text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <ArrowUp size={16} />
                    <span>Richiedi Prelievo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRequestTipo('deposito')}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-black tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all",
                      newRequestTipo === 'deposito'
                        ? "bg-emerald-500/15 text-accent-emerald border-emerald-500 shadow-xs"
                        : "glass-button text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <ArrowDown size={16} />
                    <span>Richiedi Deposito</span>
                  </button>
                </div>
              </div>

              {/* Commessa & Macchina (con autocompletamento macchina da commessa!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Commessa di Riferimento
                  </label>
                  <select
                    value={newRequestCommessaId}
                    onChange={(e) => handleCommessaChange(e.target.value)}
                    className="glass-input w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-medium dark:text-white text-slate-900 outline-none focus:border-sky-500 transition-all dark:bg-slate-900 bg-white"
                  >
                    <option value="">Nessuna (Lavorazione generale)</option>
                    {commesse.filter(c => c.stato === 'Attiva').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.codice} {c.ubicazione ? `(${c.ubicazione})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Macchina CNC Destinazione
                  </label>
                  <select
                    value={newRequestMacchinaId}
                    onChange={(e) => setNewRequestMacchinaId(e.target.value)}
                    className="glass-input w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-medium dark:text-white text-slate-900 outline-none focus:border-sky-500 transition-all dark:bg-slate-900 bg-white"
                  >
                    <option value="">Seleziona macchina (opzionale)</option>
                    {macchine.filter(m => m.is_active).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nome} ({m.codice || m.reparto})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Articoli da Aggiungere */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300">
                    Articoli nella Richiesta ({newRequestItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowToolPicker(true)}
                    className="px-2.5 py-1 rounded-lg border border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Aggiungi Utensile</span>
                  </button>
                </div>

                {newRequestItems.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center justify-center gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Nessun utensile aggiunto. Clicca su "Aggiungi Utensile" per consultare il catalogo.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowToolPicker(true)}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-200 dark:border-sky-800 cursor-pointer"
                    >
                      Scegli dal Catalogo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {newRequestItems.map((item, idx) => (
                      <div
                        key={item.tool.id || idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ToolIcon tool={item.tool} size={16} />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {buildDesc(item.tool)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {item.tool.Codice || 'N/A'} • Disponibili: {item.tool['Quantità'] || 0} pz
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setNewRequestItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                            }}
                            className="w-14 text-center py-1 px-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setNewRequestItems(prev => prev.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                            title="Rimuovi"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Note Aggiuntive */}
              <div>
                <label className="block text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Note Operative per l'Amministratore
                </label>
                <textarea
                  rows={2}
                  value={newRequestNote}
                  onChange={(e) => setNewRequestNote(e.target.value)}
                  placeholder="Es. Da ritirare alle 14:00 per piazzamento commessa DMU..."
                  className="glass-input w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-medium dark:text-white text-slate-900 outline-none focus:border-sky-500 transition-all resize-none"
                />
              </div>
            </ModalBody>

            <ModalFooter className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsNewRequestOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmittingNew || newRequestItems.length === 0}
                className="action-btn action-btn-primary px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmittingNew ? 'Invio in corso...' : 'Invia Richiesta'}
              </button>
            </ModalFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODALE SELEZIONE UTENSILE DA CATALOGO */}
      {showToolPicker && (
        <AddToolToMultiModal
          onClose={() => setShowToolPicker(false)}
          onSelectTool={(tool) => {
            setNewRequestItems(prev => {
              const exists = prev.find(it => it.tool.id === tool.id);
              if (exists) {
                return prev.map(it => it.tool.id === tool.id ? { ...it, quantity: it.quantity + 1 } : it);
              }
              return [...prev, { tool, quantity: 1 }];
            });
            setShowToolPicker(false);
          }}
          initialQuery=""
        />
      )}
    </PageTemplate>
  );
}
