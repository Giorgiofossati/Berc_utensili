import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useInventoryStore } from './useInventoryStore';
import { useAuthStore } from './useAuthStore';

export const useMultiMovementStore = create((set, get) => ({
  items: [],
  batchOpType: 'scarico', // 'scarico' | 'carico'
  isExecuting: false,
  selectedCommessaId: null,

  setBatchOpType: (type) => set({ batchOpType: type }),
  setSelectedCommessaId: (id) => set({ selectedCommessaId: id }),

  addItem: (tool, qty = 1) => {
    if (!tool || !tool.id) return;
    const addQty = Math.max(1, parseInt(qty, 10) || 1);
    
    set((state) => {
      const existingIndex = state.items.findIndex(item => item.tool.id === tool.id);
      if (existingIndex >= 0) {
        const nextItems = [...state.items];
        const currentItem = nextItems[existingIndex];
        nextItems[existingIndex] = {
          ...currentItem,
          // Preserva le proprietà aggiornate dell'utensile e incrementa la quantità
          tool: { ...currentItem.tool, ...tool },
          quantity: currentItem.quantity + addQty
        };
        return { items: nextItems };
      }
      return {
        items: [...state.items, { tool, quantity: addQty }]
      };
    });
  },

  removeItem: (toolId) => {
    set((state) => ({
      items: state.items.filter(item => item.tool.id !== toolId)
    }));
  },

  updateQuantity: (toolId, qty) => {
    const validQty = Math.max(1, parseInt(qty, 10) || 1);
    set((state) => ({
      items: state.items.map(item => {
        if (item.tool.id === toolId) {
          return { ...item, quantity: validQty };
        }
        return item;
      })
    }));
  },

  clearItems: () => set({ items: [], selectedCommessaId: null, batchOpType: 'scarico' }),

  executeMultiMovement: async (arg1, arg2, arg3) => {
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
    const { items, batchOpType, isExecuting } = state;
    if (isExecuting) return;

    if (!items || items.length === 0) {
      if (showToastNotification) {
        showToastNotification('La distinta è vuota. Aggiungi almeno un articolo prima di procedere.', 'warning');
      }
      return;
    }

    const inventoryState = useInventoryStore.getState();
    const { tools, setTools, fetchTools } = inventoryState;

    const authState = useAuthStore.getState();
    const { currentUser } = authState;
    const operatorName = currentUser ? `${currentUser.nome} ${currentUser.cognome}`.trim() : 'Operatore';

    // 1. Controllo di validità quantità
    for (const item of items) {
      if (isNaN(item.quantity) || item.quantity <= 0) {
        if (showToastNotification) {
          showToastNotification(`Quantità non valida per ${item.tool.Tipologia || item.tool.Codice || 'un articolo'}.`, 'warning');
        }
        return;
      }
    }

    // 2. Controllo giacenze in caso di scarico (prelievo)
    if (batchOpType === 'scarico') {
      const insufficient = items.filter(item => {
        // Cerca la giacenza aggiornata da useInventoryStore
        const liveTool = tools.find(t => t.id === item.tool.id) || item.tool;
        const available = liveTool['Quantità'] || 0;
        return available < item.quantity;
      });

      if (insufficient.length > 0) {
        const itemNames = insufficient.map(i => `${i.tool.Tipologia || i.tool.Codice || 'Articolo'} (Disp: ${i.tool.Quantità || 0}, Rich: ${i.quantity})`).join(', ');
        if (showToastNotification) {
          showToastNotification(`Giacenza insufficiente per: ${itemNames}`, 'error');
        }
        return;
      }
    }

    set({ isExecuting: true });

    // 3. OPTIMISTIC UPDATE
    const previousTools = [...tools];
    const itemMap = new Map(items.map(i => [i.tool.id, i.quantity]));

    setTools(tools.map(t => {
      if (itemMap.has(t.id)) {
        const change = itemMap.get(t.id);
        const curQty = t['Quantità'] || 0;
        return {
          ...t,
          'Quantità': batchOpType === 'carico' ? curQty + change : Math.max(0, curQty - change)
        };
      }
      return t;
    }));

    const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);

    // 4. CHIAMATA A SUPABASE (Con fallback resiliente)
    try {
      const payload = items.map(item => ({
        tool_id: item.tool.id,
        quantity: item.quantity,
        op_type: item.opType || batchOpType,
        commessa_id: item.commessa_id || targetCommessaId || null
      }));

      const { error: rpcErr } = await supabase.rpc('handle_multi_movement', {
        p_items: payload,
        p_operator: operatorName,
        p_commessa_id: targetCommessaId || null
      });

      if (rpcErr) {
        // Se la stored procedure non è ancora stata creata in Supabase, esegui fallback client-side sicuro
        const isRpcMissing = rpcErr.message?.includes('function') || rpcErr.code === 'PGRST202';
        if (isRpcMissing) {
          console.warn('handle_multi_movement RPC non presente sul database, esecuzione fallback...');
          for (const item of items) {
            const liveTool = tools.find(t => t.id === item.tool.id) || item.tool;
            const cur = liveTool['Quantità'] || 0;
            const newQty = batchOpType === 'carico' ? cur + item.quantity : cur - item.quantity;

            const { error: updateErr } = await supabase
              .from('Utensili_B1')
              .update({ 'Quantità': newQty })
              .eq('id', item.tool.id);

            if (updateErr) throw updateErr;

            await supabase
              .from('movements_history')
              .insert({
                tool_id: item.tool.id,
                tipo_operazione: item.opType || batchOpType,
                quantita: item.quantity,
                operatore: operatorName,
                commessa_id: item.commessa_id || targetCommessaId || null,
                created_at: new Date().toISOString()
              });
          }
        } else {
          throw rpcErr;
        }
      }

      const actionLabel = batchOpType === 'carico' ? 'DEPOSITO' : 'PRELIEVO';
      if (showToastNotification) {
        showToastNotification(
          `MOVIMENTO COMPLETATO: ${actionLabel} di ${totalPieces} pz (${items.length} articol${items.length === 1 ? 'o' : 'i'})`,
          'success'
        );
      }

      set({ items: [], selectedCommessaId: null, batchOpType: 'scarico' });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Errore durante executeMultiMovement:', err);
      // Rollback stato inventario su errore
      setTools(previousTools);
      if (showToastNotification) {
        showToastNotification('Errore durante il movimento multiplo: ' + (err.message || err), 'error');
      }
    } finally {
      set({ isExecuting: false });
      fetchTools(); // Sincronizzazione finale dei dati dal DB
    }
  }
}));
