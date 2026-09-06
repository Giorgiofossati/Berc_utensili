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

  setOpType: (type) => set({ opType: type }),
  setModalQty: (qty) => set({ modalQty: qty }),
  setIsBulkMode: (mode) => set({ isBulkMode: mode }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),

  handleMovement: async (showToastNotification, onSuccess) => {
    const state = get();
    const { opType, modalQty, isBulkMode, selectedTool } = state;
    
    const inventoryState = useInventoryStore.getState();
    const { tools, setTools, fetchTools } = inventoryState;
    
    const authState = useAuthStore.getState();
    const { currentUser } = authState;

    const filterState = useFilterStore.getState();
    const { selectedToolsIds } = filterState;

    const change = parseInt(modalQty, 10);
    if (isNaN(change) || change <= 0) {
      alert('Inserire una quantità valida maggiore di zero.');
      return;
    }

    const targets = isBulkMode 
      ? tools.filter(t => selectedToolsIds.includes(t.id)) 
      : (selectedTool ? [selectedTool] : []);

    if (targets.length === 0) {
      alert('Nessun articolo valido selezionato.');
      return;
    }
    
    if (opType === 'scarico') {
      const insufficient = targets.filter(t => (t['Quantità'] || 0) < change);
      if (insufficient.length > 0) return alert(`Quantità insufficiente per: ${insufficient.map(t => t.Tipologia).join(', ')}`);
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
      const { error: rpcErr } = await supabase.rpc('handle_bulk_movement', {
        p_tool_ids: targets.map(t => t.id),
        p_op_type: opType,
        p_change: change,
        p_operator: currentUser ? `${currentUser.nome} ${currentUser.cognome}` : 'Admin'
      });

      if (rpcErr) throw rpcErr;

      showToastNotification(`MAGAZZINO AGGIORNATO: ${opType.toUpperCase()} (${targets.length} articoli)`);
      if (onSuccess) onSuccess();
    } catch (err) { 
      console.error(err);
      // ROLLBACK on error
      setTools(previousTools);
      alert('Errore durante l\'aggiornamento: ' + (err.message || err));
    } finally { 
      fetchTools(); // Final sync
    }
  }
}));
