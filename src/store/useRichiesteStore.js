import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useInventoryStore } from './useInventoryStore';

const STORAGE_KEY = 'berc_richieste_movimento';

const loadStoredRichieste = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Errore lettura cache richieste:', e);
  }
  return [];
};

const saveStoredRichieste = (richieste) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(richieste));
  } catch (e) {
    console.warn('Errore salvataggio cache richieste:', e);
  }
};

let realtimeChannel = null;

export const useRichiesteStore = create((set, get) => ({
  richieste: loadStoredRichieste(),
  isLoading: false,
  error: null,

  getPendingCount: () => {
    return get().richieste.filter(r => r.stato === 'in_attesa').length;
  },

  fetchRichieste: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Tenta query Supabase completa con join
      const { data, error } = await supabase
        .from('richieste_movimento')
        .select(`
          *,
          richieste_movimento_voci (
            id,
            tool_id,
            quantita,
            "Utensili_B1" (*)
          ),
          commesse (
            id,
            codice,
            descrizione,
            ubicazione
          ),
          macchine_cnc (
            id,
            nome,
            codice,
            reparto
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('richieste_movimento DB fetch fallback:', error.message);
        const stored = loadStoredRichieste();
        set({ richieste: stored, isLoading: false });
        return;
      }

      if (data) {
        // Normalizza struttura voci
        const normalized = data.map(r => ({
          ...r,
          voci: (r.richieste_movimento_voci || []).map(v => ({
            id: v.id,
            tool_id: v.tool_id,
            quantita: v.quantita,
            tool: v['Utensili_B1'] || null
          })),
          commessa: r.commesse || null,
          macchina: r.macchine_cnc || null
        }));

        saveStoredRichieste(normalized);
        set({ richieste: normalized, isLoading: false });
      } else {
        const stored = loadStoredRichieste();
        set({ richieste: stored, isLoading: false });
      }
    } catch (err) {
      console.error('Errore caricamento richieste:', err);
      const stored = loadStoredRichieste();
      set({ richieste: stored, isLoading: false, error: err.message });
    }
  },

  creaRichiesta: async ({
    tipo = 'prelievo',
    operatoreId,
    operatoreNome,
    commessaId = null,
    macchinaId = null,
    note = '',
    items = [] // array di { tool, quantity }
  }) => {
    set({ isLoading: true, error: null });

    if (!items || items.length === 0) {
      set({ isLoading: false });
      throw new Error('Nessun articolo selezionato per la richiesta.');
    }

    const newRequestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const requestRecord = {
      id: newRequestId,
      tipo,
      stato: 'in_attesa',
      operatore_id: operatoreId || null,
      operatore_nome: operatoreNome || 'Operatore',
      commessa_id: commessaId || null,
      macchina_id: macchinaId || null,
      note: note ? note.trim() : null,
      note_risoluzione: null,
      gestito_da: null,
      evasa_il: null,
      created_at: nowIso
    };

    const vociRecords = items.map(item => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      richiesta_id: newRequestId,
      tool_id: item.tool ? item.tool.id : item.tool_id,
      quantita: Number(item.quantity || item.quantita) || 1,
      tool: item.tool || null,
      created_at: nowIso
    }));

    const completeLocalItem = {
      ...requestRecord,
      voci: vociRecords
    };

    try {
      // Inserimento remoto DB
      const { error: reqErr } = await supabase
        .from('richieste_movimento')
        .insert([requestRecord]);

      if (!reqErr) {
        const dbVoci = vociRecords.map(item => ({
          id: item.id,
          richiesta_id: item.richiesta_id,
          tool_id: item.tool_id,
          quantita: item.quantita
        }));
        await supabase.from('richieste_movimento_voci').insert(dbVoci);
      }
    } catch (err) {
      console.warn('creaRichiesta DB fallback locale:', err);
    }

    // Salva sempre nello stato locale & cache
    const current = get().richieste;
    const updated = [completeLocalItem, ...current];
    saveStoredRichieste(updated);
    set({ richieste: updated, isLoading: false });

    return completeLocalItem;
  },

  evadiRichiesta: async (richiestaId, { adminUser, noteRisoluzione = '' }) => {
    set({ isLoading: true, error: null });
    const current = get().richieste;
    const targetReq = current.find(r => r.id === richiestaId);

    if (!targetReq) {
      set({ isLoading: false });
      throw new Error('Richiesta non trovata');
    }

    if (targetReq.stato !== 'in_attesa') {
      set({ isLoading: false });
      throw new Error(`La richiesta è già in stato ${targetReq.stato}`);
    }

    const adminName = adminUser ? `${adminUser.nome} ${adminUser.cognome || ''}`.trim() : 'Admin';
    const adminId = adminUser ? adminUser.id : null;

    // 1. Prova prima l'RPC atomica Supabase
    let rpcDone = false;
    try {
      const { error: rpcErr } = await supabase.rpc('evadi_richiesta_movimento', {
        p_richiesta_id: richiestaId,
        p_admin_id: adminId,
        p_admin_nome: adminName,
        p_note_risoluzione: noteRisoluzione || null
      });

      if (!rpcErr) {
        rpcDone = true;
      } else {
        console.warn('RPC evadi_richiesta_movimento failed, executing fallback:', rpcErr);
      }
    } catch (e) {
      console.warn('RPC invocation failed:', e);
    }

    // 2. Fallback resiliente client-side se l'RPC non è ancora definita
    if (!rpcDone) {
      const inventoryState = useInventoryStore.getState();
      const { tools, fetchTools } = inventoryState;

      for (const voce of targetReq.voci || []) {
        const liveTool = tools.find(t => t.id === voce.tool_id) || voce.tool;
        const curStock = Number(liveTool?.['Quantità'] || 0);
        const changeQty = Number(voce.quantita) || 1;

        if (targetReq.tipo === 'prelievo' && curStock < changeQty) {
          throw new Error(`Giacenza insufficiente per ${liveTool?.Tipologia || 'utensile'} (disponibili ${curStock} pz)`);
        }

        const newQty = targetReq.tipo === 'prelievo' 
          ? Math.max(0, curStock - changeQty) 
          : curStock + changeQty;

        // Aggiorna tabella Utensili_B1
        try {
          await supabase
            .from('Utensili_B1')
            .update({ 'Quantità': newQty })
            .eq('id', voce.tool_id);
        } catch (e) {
          console.warn('Utensili_B1 update error:', e);
        }

        // Registra storico movimenti con macchina, commessa e operatore destinatario!
        try {
          await supabase.from('movements_history').insert({
            tool_id: voce.tool_id,
            tipo_operazione: targetReq.tipo === 'prelievo' ? 'scarico' : 'carico',
            quantita: changeQty,
            operatore: adminName,
            operatore_destinatario: targetReq.operatore_nome,
            commessa_id: targetReq.commessa_id || null,
            macchina_id: targetReq.macchina_id || null,
            richiesta_id: targetReq.id,
            created_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn('movements_history insert fallback:', e);
        }
      }

      // Aggiorna stato della richiesta
      try {
        await supabase
          .from('richieste_movimento')
          .update({
            stato: 'approvata',
            gestito_da: adminId,
            note_risoluzione: noteRisoluzione || null,
            evasa_il: new Date().toISOString()
          })
          .eq('id', richiestaId);
      } catch (e) {
        console.warn('richieste_movimento update fallback:', e);
      }

      fetchTools(); // ricarica inventario
    }

    // Aggiorna stato locale
    const updated = current.map(r => {
      if (r.id === richiestaId) {
        return {
          ...r,
          stato: 'approvata',
          gestito_da: adminId,
          note_risoluzione: noteRisoluzione || null,
          evasa_il: new Date().toISOString()
        };
      }
      return r;
    });

    saveStoredRichieste(updated);
    set({ richieste: updated, isLoading: false });
    useInventoryStore.getState().fetchTools();

    return { success: true };
  },

  rifiutaRichiesta: async (richiestaId, { adminUser, motivo = '' }) => {
    set({ isLoading: true, error: null });
    const current = get().richieste;
    const adminName = adminUser ? `${adminUser.nome} ${adminUser.cognome || ''}`.trim() : 'Admin';
    const adminId = adminUser ? adminUser.id : null;

    try {
      await supabase.rpc('rifiuta_richiesta_movimento', {
        p_richiesta_id: richiestaId,
        p_admin_id: adminId,
        p_admin_nome: adminName,
        p_motivo: motivo || 'Richiesta respinta dall\'amministratore'
      });
    } catch (e) {
      console.warn('RPC rifiuta fallback:', e);
      try {
        await supabase
          .from('richieste_movimento')
          .update({
            stato: 'rifiutata',
            gestito_da: adminId,
            note_risoluzione: motivo || 'Richiesta respinta dall\'amministratore',
            evasa_il: new Date().toISOString()
          })
          .eq('id', richiestaId);
      } catch (err) {
        console.warn('rifiuta DB fallback:', err);
      }
    }

    const updated = current.map(r => {
      if (r.id === richiestaId) {
        return {
          ...r,
          stato: 'rifiutata',
          gestito_da: adminId,
          note_risoluzione: motivo || 'Richiesta respinta dall\'amministratore',
          evasa_il: new Date().toISOString()
        };
      }
      return r;
    });

    saveStoredRichieste(updated);
    set({ richieste: updated, isLoading: false });
    return { success: true };
  },

  initRealtime: () => {
    if (realtimeChannel) return;
    try {
      realtimeChannel = supabase
        .channel('realtime:richieste_movimento')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'richieste_movimento' },
          () => {
            get().fetchRichieste();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime channel error richieste:', e);
    }
  },

  cleanupRealtime: () => {
    if (realtimeChannel) {
      try {
        supabase.removeChannel(realtimeChannel);
      } catch (e) {
        console.warn('cleanup realtime richieste error:', e);
      }
      realtimeChannel = null;
    }
  }
}));
