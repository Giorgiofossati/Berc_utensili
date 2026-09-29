import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowUp, ArrowDown, CheckCircle2, XCircle, Clock, 
  User, Briefcase, Cpu, AlertTriangle, RefreshCw, Send, Plus, 
  MessageSquare, Check, X, ShieldAlert, Layers,
  MapPin, Table as TableIcon, LayoutGrid, Eye
} from 'lucide-react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  createColumnHelper,
  flexRender 
} from '@tanstack/react-table';
import { Dialog, DialogContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/dialog";
import { PageTemplate, PageHeader, PageToolbar, PageContent, ResetFiltersButton } from '@/components/layout/PageTemplate';
import { StateBlock } from '@/components/common/StateBlock';
import { StatTile, CollapsibleStatGrid } from '@/components/ui/stat-tile';
import { IconButton } from '@/components/ui/icon-button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SortIcon } from '@/components/common/DataTable/SortIcon';
import { useRichiesteStore } from '../../store/useRichiesteStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useCommesseStore } from '../../store/useCommesseStore';
import { useMacchineStore } from '../../store/useMacchineStore';
import { useAuthStore } from '../../store/useAuthStore';
import { buildDesc, ToolIcon } from '../../lib/toolUtils';
import { cn } from '@/lib/utils';
import AddToolToMultiModal from '../inventory/AddToolToMultiModal';

const columnHelper = createColumnHelper();

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  } catch {
    return dateStr;
  }
};

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

  // Rilevamento schermo mobile (< 768px) per responsive design ottimizzato
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsMobileScreen(e.matches);
    setIsMobileScreen(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Filtri & visualizzazione
  const [activeTab, setActiveTab] = useState('in_attesa'); // 'in_attesa' | 'approvata' | 'rifiutata' | 'tutte'
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Modalità di visualizzazione scelta dall'utente (se null, usa auto: 'cards' su mobile, 'table' su desktop)
  const [userViewPreference, setUserViewPreference] = useState(() => {
    try {
      return localStorage.getItem('berc_richieste_view_mode') || null;
    } catch {
      return null;
    }
  });

  // Modalità effettiva: su schermi mobile (< 768px) default a 'cards' a meno che l'utente non forzi 'table'
  const effectiveViewMode = useMemo(() => {
    if (userViewPreference) return userViewPreference;
    return isMobileScreen ? 'cards' : 'table';
  }, [userViewPreference, isMobileScreen]);

  const handleViewModeChange = (mode) => {
    setUserViewPreference(mode);
    try {
      localStorage.setItem('berc_richieste_view_mode', mode);
    } catch {
      // Ignora se localStorage non accessibile
    }
  };

  // Sorting state per TanStack Table (default: data più recente prima)
  const [sorting, setSorting] = useState([{ id: 'created_at', desc: true }]);

  // Modale Dettaglio Completo Richiesta
  const [selectedRequest, setSelectedRequest] = useState(null);

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

  // Se l'operatore seleziona una commessa, precompila automaticamente la macchina associata
  const handleCommessaChange = (commessaId) => {
    setNewRequestCommessaId(commessaId);
    if (!commessaId) return;
    const selectedComm = commesse.find(c => c.id === commessaId);
    if (selectedComm && selectedComm.macchina_id) {
      setNewRequestMacchinaId(selectedComm.macchina_id);
    }
  };

  // Mappa live tools per scorte attuali e ubicazioni aggiornate
  const toolsMap = useMemo(() => {
    const map = new Map();
    tools.forEach(t => map.set(t.id, t));
    return map;
  }, [tools]);

  // Risoluzione sicura commessa
  const resolveCommessa = useCallback((req) => {
    if (!req) return null;
    if (req.commessa && typeof req.commessa === 'object' && req.commessa.codice) {
      return req.commessa;
    }
    if (req.commessa_id) {
      return commesse.find(c => c.id === req.commessa_id) || null;
    }
    return null;
  }, [commesse]);

  // Risoluzione sicura macchina
  const resolveMacchina = useCallback((req) => {
    if (!req) return null;
    if (req.macchina && typeof req.macchina === 'object' && req.macchina.nome) {
      return req.macchina;
    }
    if (req.macchina_id) {
      return macchine.find(m => m.id === req.macchina_id) || null;
    }
    return null;
  }, [macchine]);

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

  // Filtro richieste visibili con ricerca estesa (inclusa ubicazione fisica!)
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
        const comm = resolveCommessa(r);
        const mach = resolveMacchina(r);

        const opMatch = (r.operatore_nome || '').toLowerCase().includes(q);
        const commMatch = (comm?.codice || '').toLowerCase().includes(q) || 
                          (comm?.descrizione || '').toLowerCase().includes(q) || 
                          (comm?.ubicazione || '').toLowerCase().includes(q);
        const machMatch = (mach?.nome || '').toLowerCase().includes(q) || 
                          (mach?.codice || '').toLowerCase().includes(q) || 
                          (mach?.reparto || '').toLowerCase().includes(q);
        const noteMatch = (r.note || '').toLowerCase().includes(q);
        const vociMatch = (r.voci || []).some(v => {
          const t = toolsMap.get(v.tool_id) || v.tool;
          return (
            (t?.Tipologia || '').toLowerCase().includes(q) || 
            (t?.Codice || '').toLowerCase().includes(q) ||
            (t?.Ubicazione || '').toLowerCase().includes(q)
          );
        });

        if (!opMatch && !commMatch && !machMatch && !noteMatch && !vociMatch) {
          return false;
        }
      }

      return true;
    });
  }, [richieste, isAdmin, currentUser, activeTab, searchQuery, toolsMap, resolveCommessa, resolveMacchina]);

  // Azione: Approva ed Evadi
  const handleApprove = useCallback(async (richiesta) => {
    setProcessingId(richiesta.id);
    try {
      await evadiRichiesta(richiesta.id, { adminUser: currentUser });
      if (showToastNotification) {
        showToastNotification(
          `Richiesta di ${richiesta.tipo} per ${richiesta.operatore_nome} approvata ed evasa con successo.`,
          'success'
        );
      }
      if (selectedRequest?.id === richiesta.id) {
        setSelectedRequest(prev => prev ? { ...prev, stato: 'approvata' } : null);
      }
    } catch (err) {
      console.error(err);
      if (showToastNotification) {
        showToastNotification(err.message || 'Errore durante l\'evasione della richiesta', 'error');
      }
    } finally {
      setProcessingId(null);
    }
  }, [evadiRichiesta, currentUser, showToastNotification, selectedRequest]);

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
      if (selectedRequest?.id === rejectingItem.id) {
        setSelectedRequest(null);
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

  // Colonne TanStack Table per Richieste
  const columns = useMemo(() => [
    // 1. Stato & Flusso
    columnHelper.accessor('created_at', {
      id: 'created_at',
      header: 'Stato & Flusso',
      size: 135,
      meta: { className: 'shrink-0' },
      sortingFn: (rowA, rowB) => {
        const timeA = new Date(rowA.original.created_at || 0).getTime();
        const timeB = new Date(rowB.original.created_at || 0).getTime();
        return timeA - timeB;
      },
      cell: ({ row }) => {
        const req = row.original;
        const isPrelievo = req.tipo === 'prelievo';
        const isPending = req.stato === 'in_attesa';
        const isApproved = req.stato === 'approvata';

        return (
          <div className="flex flex-col gap-1 justify-center py-2">
            {/* Badge Tipo Operazione */}
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider flex items-center gap-1 border w-fit",
              isPrelievo
                ? "bg-rose-500/10 text-accent-rose border-rose-500/30"
                : "bg-emerald-500/10 text-accent-emerald border-emerald-500/30"
            )}>
              {isPrelievo ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              <span>{isPrelievo ? 'PRELIEVO' : 'DEPOSITO'}</span>
            </span>

            {/* Badge Stato */}
            <span className={cn(
              "px-2 py-0.5 rounded-md text-xs font-extrabold tracking-wider border w-fit",
              isPending
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : isApproved
                ? "bg-emerald-500/15 text-accent-emerald border-emerald-500/30"
                : "bg-rose-500/15 text-accent-rose border-rose-500/30"
            )}>
              {isPending ? 'In Attesa' : isApproved ? 'Evasa' : 'Rifiutata'}
            </span>

            {/* Data e Ora */}
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              {formatDateShort(req.created_at)}
            </span>
          </div>
        );
      }
    }),

    // 2. Chi ha chiesto ? (Operatore)
    columnHelper.accessor('operatore_nome', {
      id: 'operatore',
      header: '1. Richiedente',
      size: 160,
      meta: { className: 'shrink-0' },
      sortingFn: (rowA, rowB) => {
        return (rowA.original.operatore_nome || '').localeCompare(rowB.original.operatore_nome || '');
      },
      cell: ({ row }) => {
        const req = row.original;
        const initial = (req.operatore_nome || 'O').charAt(0).toUpperCase();

        return (
          <div className="flex flex-col gap-1.5 justify-center py-2 pr-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 font-black text-xs flex items-center justify-center shrink-0 border border-sky-500/30">
                {initial}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block truncate">
                  {req.operatore_nome}
                </span>
                <span className="text-xs text-slate-400 font-medium block">
                  Richiedente
                </span>
              </div>
            </div>

            {/* Nota operatore se presente */}
            {req.note && (
              <div className="flex items-start gap-1 p-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 max-w-[190px]">
                <MessageSquare size={12} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2 italic">{req.note}</span>
              </div>
            )}
          </div>
        );
      }
    }),

    // 3. Per quale Commessa ?
    columnHelper.accessor(row => resolveCommessa(row)?.codice || '', {
      id: 'commessa',
      header: '2. Commessa',
      size: 145,
      meta: { className: 'shrink-0' },
      sortingFn: (rowA, rowB) => {
        const commA = resolveCommessa(rowA.original)?.codice || '';
        const commB = resolveCommessa(rowB.original)?.codice || '';
        return commA.localeCompare(commB);
      },
      cell: ({ row }) => {
        const comm = resolveCommessa(row.original);

        if (!comm) {
          return (
            <div className="flex flex-col justify-center py-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 text-xs font-semibold border border-slate-200/50 dark:border-slate-800 w-fit">
                <Briefcase size={12} className="opacity-50" />
                <span>Generale</span>
              </span>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-1 justify-center py-2 pr-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 text-xs font-bold text-sky-700 dark:text-sky-300 w-fit">
              <Briefcase size={12} className="shrink-0 text-sky-600 dark:text-sky-400" />
              <span className="truncate max-w-[110px]" title={comm.codice}>{comm.codice}</span>
            </div>

            {comm.ubicazione ? (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <MapPin size={11} className="shrink-0" />
                <span>Cassetto: {comm.ubicazione}</span>
              </span>
            ) : comm.descrizione ? (
              <span className="text-xs text-slate-400 line-clamp-1" title={comm.descrizione}>
                {comm.descrizione}
              </span>
            ) : null}
          </div>
        );
      }
    }),

    // 4. Su quale macchina ?
    columnHelper.accessor(row => resolveMacchina(row)?.nome || '', {
      id: 'macchina',
      header: '3. Macchina CNC',
      size: 140,
      meta: { className: 'shrink-0' },
      sortingFn: (rowA, rowB) => {
        const machA = resolveMacchina(rowA.original)?.nome || '';
        const machB = resolveMacchina(rowB.original)?.nome || '';
        return machA.localeCompare(machB);
      },
      cell: ({ row }) => {
        const mach = resolveMacchina(row.original);

        if (!mach) {
          return (
            <div className="flex flex-col justify-center py-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 text-xs font-semibold border border-slate-200/50 dark:border-slate-800 w-fit">
                <Cpu size={12} className="opacity-50" />
                <span>Non specificata</span>
              </span>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-1 justify-center py-2 pr-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 w-fit">
              <Cpu size={12} className="shrink-0 text-accent-blue" />
              <span className="truncate max-w-[110px]" title={mach.nome}>{mach.nome}</span>
            </div>

            {(mach.reparto || mach.codice) && (
              <span className="text-xs text-slate-400 font-medium">
                {mach.reparto || mach.codice}
              </span>
            )}
          </div>
        );
      }
    }),

    // 5. Cosa ha chiesto + UBICAZIONE (Colonna principale dinamica ad altezza libera)
    columnHelper.accessor('voci', {
      id: 'voci',
      header: '4. Articoli Richiesti & Ubicazione Magazzino',
      size: 0,
      meta: { isFlex: true },
      enableSorting: false,
      cell: ({ row }) => {
        const req = row.original;
        const isPrelievo = req.tipo === 'prelievo';
        const voci = req.voci || [];

        return (
          <div className="flex flex-col gap-1.5 py-2 pr-2 min-w-[260px]">
            {voci.map((voce, idx) => {
              const liveTool = toolsMap.get(voce.tool_id) || voce.tool;
              const curStock = Number(liveTool?.['Quantità'] || 0);
              const isUnderStock = isPrelievo && curStock < voce.quantita;
              const warehouseLocation = liveTool?.Ubicazione || 'Magazzino Centrale';

              return (
                <div
                  key={voce.id || idx}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2.5 shadow-2xs group-hover:border-accent-blue/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center shrink-0">
                      <ToolIcon type={liveTool?.Tipologia} tool={liveTool} size={16} />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      {/* Descrizione utensile */}
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {liveTool ? buildDesc(liveTool) : 'Utensile'}
                      </span>

                      {/* Riga Dettagli: Codice + UBICAZIONE EVIDENZIATA */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {liveTool?.Codice && (
                          <span className="app-caption text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                            {liveTool.Codice}
                          </span>
                        )}

                        {/* UBICAZIONE FISICA A MAGAZZINO (IN RISALTO!) */}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-bold text-xs shadow-2xs">
                          <MapPin size={11} className="text-amber-500 shrink-0" />
                          <span>Ubicazione: <strong className="font-black text-amber-800 dark:text-amber-200">{warehouseLocation}</strong></span>
                        </span>

                        <span className="text-xs text-slate-400">
                          Giacenza: <strong className={curStock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}>{curStock} pz</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantità Richiesta */}
                  <div className="text-right shrink-0 pl-1.5">
                    <span className="app-overline block text-slate-400 text-xs">Richiesti</span>
                    <span className={cn(
                      "text-xs font-black px-2 py-0.5 rounded-lg border",
                      isUnderStock 
                        ? "bg-rose-500/10 text-rose-600 border-rose-500/30" 
                        : "bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
                    )}>
                      {voce.quantita} PZ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    }),

    // 6. Azioni Operative
    columnHelper.display({
      id: 'azioni',
      header: 'Azioni',
      size: 145,
      meta: { className: 'shrink-0' },
      cell: ({ row }) => {
        const req = row.original;
        const isPending = req.stato === 'in_attesa';
        const isPrelievo = req.tipo === 'prelievo';
        const isCurrentProcessing = processingId === req.id;

        return (
          <div className="flex items-center gap-1.5 justify-end py-2">
            {isAdmin && isPending ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRejectingItem(req);
                    setRejectReason('');
                  }}
                  disabled={isCurrentProcessing}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-rose-500/10 hover:border-rose-500/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
                  title="Rifiuta richiesta"
                >
                  <X size={14} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(req);
                  }}
                  disabled={isCurrentProcessing}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 min-h-[36px]",
                    isPrelievo ? "action-btn-scarica" : "action-btn-carica"
                  )}
                  title={isPrelievo ? "Approva e Consegna" : "Approva e Ritira"}
                >
                  <Check size={14} />
                  <span>{isCurrentProcessing ? '...' : (isPrelievo ? 'Consegna' : 'Ritira')}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRequest(req);
                }}
                className="glass-button px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 hover:text-accent-blue transition-colors cursor-pointer min-h-[36px]"
              >
                <Eye size={14} />
                <span>Dettagli</span>
              </button>
            )}
          </div>
        );
      }
    })
  ], [toolsMap, resolveCommessa, resolveMacchina, isAdmin, processingId, handleApprove]);

  // Configurazione TanStack Table
  const table = useReactTable({
    data: filteredRichieste,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

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
          placeholder: 'Cerca per operatore, commessa, macchina, ubicazione, codice…'
        }}
        action={
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <button
                type="button"
                onClick={() => setIsNewRequestOpen(true)}
                className="action-btn action-btn-primary px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs tracking-wider shrink-0 cursor-pointer shadow-sm min-h-[44px]"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nuova Richiesta</span>
                <span className="sm:hidden">Nuova</span>
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

      {/* KPI TILES BAR: Collassabile su mobile (default chiuso), compatto su desktop */}
      <div className="px-3 sm:px-4 md:px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shrink-0">
        <CollapsibleStatGrid
          title="Stato Richieste"
          count={stats.pending}
          gridClassName="grid-cols-2 lg:grid-cols-4"
        >
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
        </CollapsibleStatGrid>
      </div>

      {/* TOOLBAR CON FILTRI TABS E SWITCHER VISTA */}
      <PageToolbar className="flex items-center justify-between gap-2 flex-wrap py-1.5 px-2.5 sm:px-4">
        {/* Tab Filtri Stato */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('in_attesa')}
            className={cn(
              "px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 min-h-[36px]",
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
              "px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 min-h-[36px]",
              activeTab === 'approvata'
                ? "bg-emerald-500/15 text-accent-emerald border border-emerald-500/30 shadow-xs"
                : "glass-button text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <CheckCircle2 size={13} />
            <span>Evase</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rifiutata')}
            className={cn(
              "px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 min-h-[36px]",
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
              "px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[36px]",
              activeTab === 'tutte'
                ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30 shadow-xs"
                : "glass-button text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            Tutte ({richieste.length})
          </button>
        </div>

        {/* Destra: Switcher Vista (Tabella TanStack / Schede Card) + Reset Ricerca */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {searchQuery && (
            <ResetFiltersButton
              onClick={() => setSearchQuery('')}
              label="Resetta ricerca"
            />
          )}

          <div className="flex items-center">
            <SegmentedControl
              value={effectiveViewMode}
              onValueChange={handleViewModeChange}
              options={[
                { value: 'table', label: 'Tabella', icon: <TableIcon size={14} />, compact: true },
                { value: 'cards', label: 'Schede', icon: <LayoutGrid size={14} />, compact: true }
              ]}
              ariaLabel="Visualizzazione richieste"
            />
          </div>
        </div>
      </PageToolbar>

      {/* CONTENUTO PRINCIPALE A PIENO SCHERMO NEL SUO CONTAINER */}
      <PageContent className={cn(
        "flex-1 min-h-0 flex flex-col custom-scrollbar",
        effectiveViewMode === 'table' ? "p-0 overflow-hidden" : "p-2 sm:p-4 md:p-6 pb-24 overflow-y-auto"
      )}>
        {filteredRichieste.length === 0 ? (
          <div className="p-4 sm:p-8 flex-1 flex flex-col items-center justify-center">
            <StateBlock
              type="empty"
              title="Nessuna richiesta trovata"
              message={searchQuery ? "Nessuna richiesta corrisponde ai criteri di ricerca." : "Non ci sono richieste in questa sezione."}
              action={
                !isAdmin ? (
                  <button
                    type="button"
                    onClick={() => setIsNewRequestOpen(true)}
                    className="action-btn action-btn-primary px-4 py-2 rounded-xl text-xs font-bold mt-2 min-h-[44px]"
                  >
                    Crea Nuova Richiesta
                  </button>
                ) : null
              }
            />
          </div>
        ) : effectiveViewMode === 'table' ? (
          /* =======================================================
             VISTA TABELLARE TANSTACK TABLE (A PIENO SCHERMO SENZA CORNICI RIDONDANTI)
             ======================================================= */
          <div className="flex flex-col flex-1 min-h-0 w-full h-full bg-white dark:bg-slate-900 overflow-hidden">
            {/* Tabella con Header Sticky e Scrollbar Interna */}
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar relative w-full">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 select-none shadow-xs">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => {
                        const canSort = header.column.getCanSort();
                        const isFlex = header.column.columnDef.meta?.isFlex;
                        const colSize = header.getSize();

                        return (
                          <th
                            key={header.id}
                            style={{
                              width: isFlex ? undefined : `${colSize}px`,
                              minWidth: isFlex ? '240px' : `${colSize}px`
                            }}
                            className={cn(
                              "py-3 px-3 font-black transition-colors relative whitespace-nowrap",
                              canSort && "cursor-pointer hover:text-slate-950 dark:hover:text-white"
                            )}
                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </span>
                              {canSort && (
                                <SortIcon column={header.column} size={13} />
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>

                {/* Body Tabella con Righe Alte per Dettagli Puliti */}
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-xs">
                  {table.getRowModel().rows.map(row => {
                    const req = row.original;
                    const isPending = req.stato === 'in_attesa';
                    const isApproved = req.stato === 'approvata';

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedRequest(req)}
                        className={cn(
                          "transition-colors cursor-pointer group",
                          isPending 
                            ? "bg-amber-500/[0.03] hover:bg-amber-500/[0.08]" 
                            : isApproved
                            ? "bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06]"
                            : "hover:bg-slate-500/[0.05]"
                        )}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            className="px-3 py-2.5 align-top"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Spacer inferiore per non finire a ridosso del bordo */}
              <div className="h-10 w-full" />
            </div>
          </div>
        ) : (
          /* =======================================================
             VISTA A SCHEDE CARD (OTTIMIZZATA PER MOBILE & ERGONOMIA TOUCH)
             ======================================================= */
          <div className="flex flex-col gap-3">
            {filteredRichieste.map(req => {
              const isPrelievo = req.tipo === 'prelievo';
              const isPending = req.stato === 'in_attesa';
              const isApproved = req.stato === 'approvata';
              const isRejected = req.stato === 'rifiutata';
              const isCurrentProcessing = processingId === req.id;

              const comm = resolveCommessa(req);
              const mach = resolveMacchina(req);
              const voci = req.voci || [];

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={cn(
                    "rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 border transition-all cursor-pointer group shadow-xs hover:shadow-md",
                    "bg-white dark:bg-slate-800/90",
                    isPending
                      ? "border-amber-400/50 dark:border-amber-500/40 shadow-amber-500/5"
                      : isApproved
                      ? "border-slate-200 dark:border-slate-750"
                      : "border-slate-200 dark:border-slate-750 opacity-90"
                  )}
                >
                  {/* Top Bar: Tipo + Stato + Data/Ora + Pulsante Dettaglio */}
                  <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Badge Tipo Operazione */}
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider flex items-center gap-1 border",
                        isPrelievo
                          ? "bg-rose-500/10 text-accent-rose border-rose-500/30"
                          : "bg-emerald-500/10 text-accent-emerald border-emerald-500/30"
                      )}>
                        {isPrelievo ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                        <span>{isPrelievo ? 'PRELIEVO' : 'DEPOSITO'}</span>
                      </span>

                      {/* Badge Stato */}
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-extrabold tracking-wider border",
                        isPending
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : isApproved
                          ? "bg-emerald-500/15 text-accent-emerald border-emerald-500/30"
                          : "bg-rose-500/15 text-accent-rose border-rose-500/30"
                      )}>
                        {isPending ? 'In Attesa' : isApproved ? 'Evasa' : 'Rifiutata'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 font-medium">
                        {formatDateTime(req.created_at)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(req);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-accent-blue hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                        title="Vedi scheda completa"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>

                  {/* CONTESTO: CHI HA CHIESTO, COMMESSA E MACCHINA (Unificato, SENZA scatole annidate) */}
                  <div className="flex flex-col gap-2 pt-0.5">
                    {/* Richiedente */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-sky-500/15 text-sky-500 dark:text-sky-400 font-black text-xs flex items-center justify-center shrink-0 border border-sky-500/30 shadow-xs">
                          {(req.operatore_nome || 'O').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate block">
                            {req.operatore_nome}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">Richiedente</span>
                        </div>
                      </div>

                      {req.note && (
                        <div className="max-w-[220px] text-right truncate">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950/70 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-slate-800/80" title={req.note}>
                            <MessageSquare size={11} className="shrink-0 text-slate-400" />
                            <span className="truncate">"{req.note}"</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Destinazione: Commessa & Macchina affiancate */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Pillola Commessa */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50/80 dark:bg-slate-950/70 border border-sky-200/80 dark:border-sky-800/60 text-xs text-sky-700 dark:text-sky-300 font-bold shadow-2xs">
                        <Briefcase size={12} className="text-sky-500 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400 font-normal">Commessa:</span>
                        <strong className="font-black text-sky-700 dark:text-sky-300">{comm ? comm.codice : 'Generale'}</strong>
                        {comm?.ubicazione && (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold pl-1.5 border-l border-sky-500/30">
                            Cassetto {comm.ubicazione}
                          </span>
                        )}
                      </div>

                      {/* Pillola Macchina CNC */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 font-medium shadow-2xs">
                        <Cpu size={12} className="text-accent-blue shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400 font-normal">Macchina:</span>
                        <strong className="font-bold text-slate-800 dark:text-slate-200">{mach ? mach.nome : 'Non specificata'}</strong>
                        {mach?.reparto && <span className="text-slate-400 text-xs">({mach.reparto})</span>}
                      </div>
                    </div>
                  </div>

                  {/* LEVEL 2: RIQUADRO ARTICOLI & UBICAZIONE (PIÙ SCURO / INSET IN DARK MODE) */}
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="app-overline text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                        Articoli Richiesti &amp; Ubicazione ({voci.length})
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Magazzino</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {voci.map((voce, idx) => {
                        const liveTool = toolsMap.get(voce.tool_id) || voce.tool;
                        const curStock = Number(liveTool?.['Quantità'] || 0);
                        const isUnderStock = isPrelievo && curStock < voce.quantita;
                        const warehouseLocation = liveTool?.Ubicazione || 'Magazzino Centrale';

                        return (
                          <div
                            key={voce.id || idx}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/85 border border-slate-200/80 dark:border-slate-800/90 flex flex-col gap-2 shadow-inner"
                          >
                            {/* Riga Superiore: Icona + Descrizione Utensile + Quantità */}
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-lg bg-accent-blue/15 border border-accent-blue/30 text-accent-blue flex items-center justify-center shrink-0 shadow-xs">
                                  <ToolIcon type={liveTool?.Tipologia} tool={liveTool} size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                                    {liveTool ? buildDesc(liveTool) : 'Utensile'}
                                  </span>
                                  {liveTool?.Codice && (
                                    <span className="app-caption text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                                      {liveTool.Codice}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Badge Quantità Richiesta */}
                              <div className="text-right shrink-0">
                                <span className="app-overline block text-slate-400 text-xs leading-none mb-0.5">Richiesti</span>
                                <span className={cn(
                                  "text-sm font-black px-2.5 py-1 rounded-xl border block",
                                  isUnderStock 
                                    ? "bg-rose-500/10 text-rose-600 border-rose-500/30" 
                                    : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
                                )}>
                                  {voce.quantita} PZ
                                </span>
                              </div>
                            </div>

                            {/* Riga Inferiore: Ubicazione Magazzino (IN ALTISSIMO RISALTO) + Giacenza */}
                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 flex-wrap">
                              {/* UBICAZIONE FISICA EVIDENZIATA */}
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-black text-xs shadow-xs">
                                <MapPin size={12} className="text-amber-500 shrink-0" />
                                <span>Ubicazione: <strong className="font-black text-amber-900 dark:text-amber-200">{warehouseLocation}</strong></span>
                              </span>

                              <span className="text-xs text-slate-400">
                                Giacenza a magazzino: <strong className={curStock > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-rose-600 font-bold"}>{curStock} pz</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Motivazione rifiuto se respinta */}
                  {req.note_risoluzione && isRejected && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Motivazione rifiuto: </strong>
                        <span>{req.note_risoluzione}</span>
                      </div>
                    </div>
                  )}

                  {/* Footer Azioni per Amministratore */}
                  {isAdmin && isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRejectingItem(req);
                          setRejectReason('');
                        }}
                        disabled={isCurrentProcessing}
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-rose-500/10 hover:border-rose-500/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
                      >
                        Rifiuta
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(req);
                        }}
                        disabled={isCurrentProcessing}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] disabled:opacity-50 min-h-[44px]",
                          isPrelievo ? "action-btn-scarica" : "action-btn-carica"
                        )}
                      >
                        <Check size={16} />
                        <span>{isCurrentProcessing ? 'Evasione...' : (isPrelievo ? 'Approva & Consegna' : 'Approva & Ritira')}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageContent>

      {/* =======================================================
          MODALE SCHEDA DETTAGLIO COMPLETO RICHIESTA
          ======================================================= */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent 
          showCloseButton={false}
          className="sm:max-w-2xl md:max-w-3xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90dvh] flex flex-col"
        >
          {selectedRequest && (() => {
            const req = selectedRequest;
            const isPrelievo = req.tipo === 'prelievo';
            const isPending = req.stato === 'in_attesa';
            const isApproved = req.stato === 'approvata';
            const isRejected = req.stato === 'rifiutata';
            const comm = resolveCommessa(req);
            const mach = resolveMacchina(req);
            const voci = req.voci || [];

            return (
              <>
                <ModalHeader
                  icon={isPrelievo ? <ArrowUp size={20} className="text-rose-500" /> : <ArrowDown size={20} className="text-emerald-500" />}
                  title={`Dettaglio Richiesta #${(req.id || '').slice(-6).toUpperCase()}`}
                  description={`${isPrelievo ? 'Richiesta di Scarico / Prelievo' : 'Richiesta di Carico / Deposito'} creata il ${formatDateTime(req.created_at)}`}
                  onClose={() => setSelectedRequest(null)}
                />

                <ModalBody className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                  {/* Stato generale in evidenza */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-750 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Stato Avanzamento:</span>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-black tracking-wider border",
                        isPending
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : isApproved
                          ? "bg-emerald-500/15 text-accent-emerald border-emerald-500/30"
                          : "bg-rose-500/15 text-accent-rose border-rose-500/30"
                      )}>
                        {isPending ? 'IN ATTESA DI CONFERMA' : isApproved ? 'APPROVATA ED EVASA' : 'RIFIUTATA'}
                      </span>
                    </div>

                    {req.evasa_il && (
                      <span className="text-xs text-slate-400 font-medium">
                        Evasa il: {formatDateTime(req.evasa_il)}
                      </span>
                    )}
                  </div>

                  {/* MASTER CONTAINER LEVEL 1: CONTESTO DELLA RICHIESTA */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800/90 p-4 shadow-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="app-overline text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center gap-1.5 uppercase">
                        <User size={13} className="text-sky-500" />
                        Contesto Operativo: Richiedente, Commessa &amp; Macchina
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* 1. Chi ha chiesto ? */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800/90 shadow-inner flex flex-col gap-1.5">
                        <span className="app-overline text-slate-400 text-xs flex items-center gap-1 uppercase">
                          <User size={11} className="text-sky-500" />
                          <span>1. Richiedente</span>
                        </span>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {req.operatore_nome}
                        </span>
                        {req.note ? (
                          <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                            <strong className="block app-overline text-slate-400">Nota:</strong>
                            <span>{req.note}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Nessuna nota fornita</span>
                        )}
                      </div>

                      {/* 2. Per quale Commessa ? */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800/90 shadow-inner flex flex-col gap-1.5">
                        <span className="app-overline text-slate-400 text-xs flex items-center gap-1 uppercase">
                          <Briefcase size={11} className="text-sky-500" />
                          <span>2. Commessa</span>
                        </span>
                        {comm ? (
                          <>
                            <span className="font-black text-sm text-sky-700 dark:text-sky-300">
                              {comm.codice}
                            </span>
                            {comm.ubicazione ? (
                              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                <MapPin size={11} />
                                <span>Cassetto: {comm.ubicazione}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                {comm.descrizione || 'Commessa di produzione'}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">
                            Lavorazione generale
                          </span>
                        )}
                      </div>

                      {/* 3. Su quale macchina ? */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800/90 shadow-inner flex flex-col gap-1.5">
                        <span className="app-overline text-slate-400 text-xs flex items-center gap-1 uppercase">
                          <Cpu size={11} className="text-accent-blue" />
                          <span>3. Macchina CNC</span>
                        </span>
                        {mach ? (
                          <>
                            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                              {mach.nome}
                            </span>
                            <span className="text-xs text-slate-400">
                              {mach.reparto || mach.codice || 'Centro di Lavoro'}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">
                            Non specificata
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MASTER CONTAINER LEVEL 1: ARTICOLI RICHIESTI & UBICAZIONE */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800/90 p-4 shadow-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="app-overline text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center gap-1.5 uppercase">
                        <Layers size={13} className="text-sky-500" />
                        Articoli Richiesti &amp; Ubicazione a Magazzino ({voci.length})
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {voci.map((voce, idx) => {
                        const liveTool = toolsMap.get(voce.tool_id) || voce.tool;
                        const curStock = Number(liveTool?.['Quantità'] || 0);
                        const isUnderStock = isPrelievo && curStock < voce.quantita;
                        const warehouseLocation = liveTool?.Ubicazione || 'Magazzino Centrale';

                        return (
                          <div
                            key={voce.id || idx}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/85 border border-slate-200/70 dark:border-slate-800/90 shadow-inner flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center shrink-0">
                                <ToolIcon type={liveTool?.Tipologia} tool={liveTool} size={22} />
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                                  {liveTool ? buildDesc(liveTool) : 'Utensile'}
                                </span>
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                  {liveTool?.Codice && (
                                    <span className="app-caption text-xs font-mono font-bold text-slate-500">
                                      {liveTool.Codice}
                                    </span>
                                  )}
                                  {/* UBICAZIONE FISICA EVIDENZIATA */}
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-xs">
                                    <MapPin size={12} className="text-amber-500 shrink-0" />
                                    <span>Ubicazione: <strong className="font-black text-amber-900 dark:text-amber-200">{warehouseLocation}</strong></span>
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    Giacenza magazzino: <strong className={curStock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}>{curStock} pz</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 pl-3">
                              <span className="app-overline block text-slate-400 text-xs">Richiesti</span>
                              <span className={cn(
                                "text-sm font-black px-2.5 py-1 rounded-xl border block",
                                isUnderStock 
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/30" 
                                  : "bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                              )}>
                                {voce.quantita} PZ
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Motivazione di rifiuto se presente */}
                  {req.note_risoluzione && isRejected && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                      <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-rose-900 dark:text-rose-200 block mb-0.5">Motivazione Rifiuto:</strong>
                        <span>{req.note_risoluzione}</span>
                      </div>
                    </div>
                  )}
                </ModalBody>

                <ModalFooter className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer min-h-[44px]"
                  >
                    Chiudi
                  </button>

                  {isAdmin && isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingItem(req);
                          setRejectReason('');
                        }}
                        disabled={processingId === req.id}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-rose-500/10 hover:border-rose-500/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
                      >
                        Rifiuta Richiesta
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(req)}
                        disabled={processingId === req.id}
                        className={cn(
                          "px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98] disabled:opacity-50 min-h-[44px]",
                          isPrelievo ? "action-btn-scarica" : "action-btn-carica"
                        )}
                      >
                        <Check size={16} />
                        <span>{processingId === req.id ? 'Evasione...' : (isPrelievo ? 'Approva & Consegna' : 'Approva & Ritira')}</span>
                      </button>
                    </div>
                  )}
                </ModalFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* =======================================================
          DIALOG RIFIUTO RICHIESTA
          ======================================================= */}
      <Dialog open={!!rejectingItem} onOpenChange={() => setRejectingItem(null)}>
        <DialogContent 
          showCloseButton={false}
          className="sm:max-w-md p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl"
        >
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
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer min-h-[44px]"
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={isRejecting}
              onClick={handleRejectConfirm}
              className="action-btn action-btn-scarica px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {isRejecting ? 'Rifiuto in corso...' : 'Conferma Rifiuto'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* =======================================================
          DIALOG NUOVA RICHIESTA PER OPERATORE
          ======================================================= */}
      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent 
          showCloseButton={false}
          className="sm:max-w-xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90dvh] flex flex-col"
        >
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
                      "py-2.5 px-3 rounded-xl border text-xs font-black tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]",
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
                      "py-2.5 px-3 rounded-xl border text-xs font-black tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]",
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
                    className="glass-input w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-medium dark:text-white text-slate-900 outline-none focus:border-sky-500 transition-all dark:bg-slate-900 bg-white min-h-[44px]"
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
                    className="glass-input w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-medium dark:text-white text-slate-900 outline-none focus:border-sky-500 transition-all dark:bg-slate-900 bg-white min-h-[44px]"
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
                    className="px-2.5 py-1.5 rounded-lg border border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950 text-xs font-bold flex items-center gap-1 cursor-pointer min-h-[36px]"
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
                      className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-200 dark:border-sky-800 cursor-pointer min-h-[44px]"
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
                          <ToolIcon type={item.tool?.Tipologia} tool={item.tool} size={16} />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {buildDesc(item.tool)}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {item.tool.Codice || 'N/A'} • Ubicazione: {item.tool.Ubicazione || 'Magazzino'} • Disp: {item.tool['Quantità'] || 0} pz
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
                            className="w-14 text-center py-1 px-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold min-h-[36px]"
                          />
                          <button
                            type="button"
                            onClick={() => setNewRequestItems(prev => prev.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
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
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer min-h-[44px]"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmittingNew || newRequestItems.length === 0}
                className="action-btn action-btn-primary px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider cursor-pointer shadow-md disabled:opacity-50 min-h-[44px]"
              >
                {isSubmittingNew ? 'Invio in corso...' : 'Invia Richiesta'}
              </button>
            </ModalFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =======================================================
          MODALE SELEZIONE UTENSILE DA CATALOGO
          ======================================================= */}
      {showToolPicker && (
        <AddToolToMultiModal
          isOpen={showToolPicker}
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
