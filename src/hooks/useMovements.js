import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useMovements({ tools, setTools, fetchTools, currentUser, showToastNotification }) {
  const [opType, setOpType] = useState('scarico');
  const [modalQty, setModalQty] = useState(1);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);

  const handleMovement = useCallback(async (selectedToolsIds, onSuccess) => {
    const change = parseInt(modalQty);
    const targets = isBulkMode ? tools.filter(t => selectedToolsIds.includes(t.id)) : [selectedTool];
    
    if (opType === 'scarico') {
      const insufficient = targets.filter(t => (t['Quantità'] || 0) < change);
      if (insufficient.length > 0) return alert(`Quantità insufficiente per: ${insufficient.map(t => t.Tipologia).join(', ')}`);
    }

    // --- OPTIMISTIC UPDATE ---
    const previousTools = [...tools];
    setTools(prev => prev.map(t => {
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
  }, [modalQty, selectedTool, opType, showToastNotification, isBulkMode, tools, fetchTools, currentUser, setTools]);

  return { opType, setOpType, modalQty, setModalQty, isBulkMode, setIsBulkMode, selectedTool, setSelectedTool, handleMovement };
}
