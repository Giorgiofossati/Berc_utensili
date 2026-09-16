import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useInventoryStore } from './useInventoryStore';
import { useAuthStore } from './useAuthStore';
import { useFilterStore } from './useFilterStore';

export const useMovementStore = create((set, get) => ({
  opType: 'scarico',
  modalQty: 1,
  isBulkMode: false,
  selectedTool: null,
  showMoveModal: false,
  selectedCommessaId: null,

  setOpType: (type) => set({ opType: type }),
  setModalQty: (qty) => set({ modalQty: qty }),
  setIsBulkMode: (mode) => set({ isBulkMode: mode }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setSelectedCommessaId: (id) => set({ selectedCommessaId: id }),
  setShowMoveModal: (show) => set({
    showMoveModal: show,
    ...(!show ? { isBulkMode: false, selectedCommessaId: null } : {})
  }),
  openToolDetail: (tool) => set({
    selectedTool: tool,
    opType: null,
    modalQty: 1,
    isBulkMode: false,
    selectedCommessaId: null,
    showMoveModal: true
  }),

  executeMovement: async (arg1, arg2, arg3) => {
    let showToastNotification;
    let onSuccess;
    let commessaId = undefined;

    if (typeof arg1 === 'function') {
      showToastNotification = arg1;
      if (typeof arg2 === 'function') {
        onSuccess = arg2;
        commessaId = arg3;
      } else if (typeof arg2 === 'string' || arg2 === null) {
        commessaId = arg2;
        onSuccess = typeof arg3 === 'function' ? arg3 : null;
      }
    } else if (typeof arg1 === 'string' || arg1 === null) {
      commessaId = arg1;
      showToastNotification = typeof arg2 === 'function' ? arg2 : null;
      onSuccess = typeof arg3 === 'function' ? arg3 : null;
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      showToastNotification = arg1.showToastNotification;
      onSuccess = arg1.onSuccess;
      commessaId = arg1.commessaId;
    }

    const state = get();
    const targetCommessaId = commessaId !== undefined ? commessaId : state.selectedCommessaId;
    const { opType, modalQty, isBulkMode, selectedTool } = state;
    
    const inventoryState = useInventoryStore.getState();
    const { tools, setTools, fetchTools } = inventoryState;
    
    const authState = useAuthStore.getState();
    const { currentUser } = authState;

    const filterState = useFilterStore.getState();
    const { selectedToolsIds } = filterState;

    const change = parseInt(modalQty, 10);
    if (isNaN(change) || change <= 0) {
      if (showToastNotification) {
        showToastNotification('Inserire una quantità valida maggiore di zero.', 'warning');
      }
      return;
    }

    const targets = isBulkMode 
      ? tools.filter(t => selectedToolsIds.includes(t.id)) 
      : (selectedTool ? [selectedTool] : []);

    if (targets.length === 0) {
      if (showToastNotification) {
        showToastNotification('Nessun articolo valido selezionato.', 'warning');
      }
      return;
    }
    
    if (opType === 'scarico') {
      const insufficient = targets.filter(t => (t['Quantità'] || 0) < change);
      if (insufficient.length > 0) {
        if (showToastNotification) {
          showToastNotification(`Quantità insufficiente per: ${insufficient.map(t => t.Tipologia).join(', ')}`, 'error');
        }
        return;
      }
    }

    // --- OPTIMISTIC UPDATE ---
    const previousTools = [...tools];
    setTools(tools.map(t => {
      if (targets.some(target => target.id === t.id)) {
        return { ...t, 'Quantità': opType === 'carico' ? (t['Quantità'] || 0) + change : (t['Quantità'] || 0) - change };
      }
      return t;
    }));

    try {
      const operatorName = currentUser ? `${currentUser.nome} ${currentUser.cognome}`.trim() : 'Admin';
      const { error: rpcErr } = await supabase.rpc('handle_bulk_movement', {
        p_tool_ids: targets.map(t => t.id),
        p_op_type: opType,
        p_change: change,
        p_operator: operatorName,
        p_commessa_id: targetCommessaId || null
      });

      if (rpcErr) throw rpcErr;

      set({
        lastMovement: {
          toolIds: targets.map(t => t.id),
          opType,
          change,
          operator: operatorName,
          commessaId: targetCommessaId || null,
          timestamp: Date.now()
        }
      });

      if (showToastNotification) {
        showToastNotification({
          message: `MAGAZZINO AGGIORNATO: ${opType.toUpperCase()} (${targets.length} ${targets.length === 1 ? 'articolo' : 'articoli'})`,
          type: 'success',
          onUndo: () => get().undoLastMovement(showToastNotification)
        });
      }
      if (onSuccess) onSuccess();
    } catch (err) { 
      console.error(err);
      // ROLLBACK on error
      setTools(previousTools);
      if (showToastNotification) {
        showToastNotification('Errore durante l\'aggiornamento: ' + (err.message || err), 'error');
      }
    } finally { 
      fetchTools(); // Final sync
    }
  },

  handleMovement: async (...args) => {
    return get().executeMovement(...args);
  },

  undoLastMovement: async (showToastNotification) => {
    const { lastMovement } = get();
    if (!lastMovement) {
      if (showToastNotification) {
        showToastNotification('Nessuna operazione recente da annullare.', 'warning');
      }
      return;
    }

    const { toolIds, opType, change, operator, commessaId } = lastMovement;
    const reverseOpType = opType === 'carico' ? 'scarico' : 'carico';

    const inventoryState = useInventoryStore.getState();
    const { tools, setTools, fetchTools } = inventoryState;

    // Optimistic reversal
    const previousTools = [...tools];
    setTools(tools.map(t => {
      if (toolIds.includes(t.id)) {
        return { 
          ...t, 
          'Quantità': reverseOpType === 'carico' 
            ? (Number(t['Quantità']) || 0) + change 
            : Math.max(0, (Number(t['Quantità']) || 0) - change) 
        };
      }
      return t;
    }));

    set({ lastMovement: null });

    try {
      const { error: rpcErr } = await supabase.rpc('handle_bulk_movement', {
        p_tool_ids: toolIds,
        p_op_type: reverseOpType,
        p_change: change,
        p_operator: `${operator} (ANNULLO)`,
        p_commessa_id: commessaId || null
      });

      if (rpcErr) throw rpcErr;

      if (showToastNotification) {
        showToastNotification(`Movimento annullato con successo! Ripristinati ${change} pz.`, 'success');
      }
    } catch (err) {
      console.error(err);
      setTools(previousTools);
      if (showToastNotification) {
        showToastNotification('Errore durante l\'annullamento: ' + (err.message || err), 'error');
      }
    } finally {
      fetchTools();
    }
  }
}));
