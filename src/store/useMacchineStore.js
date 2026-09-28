import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Macchine predefinite di default (utilizzate come fallback resiliente o initial state)
const DEFAULT_MACCHINE = [
  { id: 'm-001', nome: 'DMU 50 5-Assi', codice: 'CNC-01', reparto: 'Fresatura 5 Assi', descrizione: 'Centro di lavoro 5 assi simultanei DMG Mori', is_active: true, ordine: 1 },
  { id: 'm-002', nome: 'Mori Seiki NMV5000', codice: 'CNC-02', reparto: 'Fresatura 5 Assi', descrizione: 'Centro verticale 5 assi alta precisione', is_active: true, ordine: 2 },
  { id: 'm-003', nome: 'Hermle C42 U', codice: 'CNC-03', reparto: 'Fresatura Compositi', descrizione: 'Fresatrice 5 assi dinamica per stampi e leghe', is_active: true, ordine: 3 },
  { id: 'm-004', nome: 'Robodrill D21LiB5', codice: 'CNC-04', reparto: 'Fresatura Veloce', descrizione: 'Centro compatto Fanuc Robodrill', is_active: true, ordine: 4 },
  { id: 'm-005', nome: 'Mazak Integrex i-200', codice: 'CNC-05', reparto: 'Torno-Fresatura', descrizione: 'Centro multi-tasking fresatura e tornitura', is_active: true, ordine: 5 },
];

const STORAGE_KEY = 'berc_macchine_cnc';

const loadStoredMacchine = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Errore lettura cache macchine:', e);
  }
  return DEFAULT_MACCHINE;
};

const saveStoredMacchine = (macchine) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(macchine));
  } catch (e) {
    console.warn('Errore salvataggio cache macchine:', e);
  }
};

let realtimeChannel = null;

export const useMacchineStore = create((set, get) => ({
  macchine: loadStoredMacchine(),
  isLoading: false,
  error: null,

  fetchMacchine: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('macchine_cnc')
        .select('*')
        .order('ordine', { ascending: true })
        .order('nome', { ascending: true });

      if (error) {
        // Fallback resiliente: tabella non ancora creata o errore di rete
        console.warn('macchine_cnc table fetch fallback:', error.message);
        const stored = loadStoredMacchine();
        set({ macchine: stored, isLoading: false });
        return;
      }

      if (data && data.length > 0) {
        saveStoredMacchine(data);
        set({ macchine: data, isLoading: false });
      } else {
        const stored = loadStoredMacchine();
        set({ macchine: stored, isLoading: false });
      }
    } catch (err) {
      console.error('Errore fetch macchine:', err);
      const stored = loadStoredMacchine();
      set({ macchine: stored, isLoading: false, error: err.message });
    }
  },

  createMacchina: async (macchinaData) => {
    set({ isLoading: true, error: null });
    const newRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}`,
      nome: macchinaData.nome.trim(),
      codice: macchinaData.codice ? macchinaData.codice.trim().toUpperCase() : '',
      reparto: macchinaData.reparto ? macchinaData.reparto.trim() : 'Generale',
      descrizione: macchinaData.descrizione ? macchinaData.descrizione.trim() : '',
      ordine: Number(macchinaData.ordine) || 0,
      is_active: macchinaData.is_active !== undefined ? macchinaData.is_active : true,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('macchine_cnc')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;

      const created = data || newRecord;
      const updated = [...get().macchine, created];
      saveStoredMacchine(updated);
      set({ macchine: updated, isLoading: false });
      return { success: true, data: created };
    } catch (err) {
      console.warn('createMacchina DB fallback:', err);
      const updated = [...get().macchine, newRecord];
      saveStoredMacchine(updated);
      set({ macchine: updated, isLoading: false });
      return { success: true, data: newRecord };
    }
  },

  updateMacchina: async (id, patch) => {
    set({ isLoading: true, error: null });
    const current = get().macchine;
    const existing = current.find(m => m.id === id);
    if (!existing) {
      set({ isLoading: false });
      return { success: false, error: 'Macchina non trovata' };
    }

    const updatedItem = { ...existing, ...patch };

    try {
      const { data, error } = await supabase
        .from('macchine_cnc')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const saved = data || updatedItem;
      const updated = current.map(m => m.id === id ? saved : m);
      saveStoredMacchine(updated);
      set({ macchine: updated, isLoading: false });
      return { success: true, data: saved };
    } catch (err) {
      console.warn('updateMacchina DB fallback:', err);
      const updated = current.map(m => m.id === id ? updatedItem : m);
      saveStoredMacchine(updated);
      set({ macchine: updated, isLoading: false });
      return { success: true, data: updatedItem };
    }
  },

  toggleStatoMacchina: async (id) => {
    const macchina = get().macchine.find(m => m.id === id);
    if (!macchina) return;
    return get().updateMacchina(id, { is_active: !macchina.is_active });
  },

  deleteMacchina: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await supabase.from('macchine_cnc').delete().eq('id', id);
    } catch (e) {
      console.warn('deleteMacchina DB fallback:', e);
    }
    const updated = get().macchine.filter(m => m.id !== id);
    saveStoredMacchine(updated);
    set({ macchine: updated, isLoading: false });
    return { success: true };
  },

  initRealtime: () => {
    if (realtimeChannel) return;
    try {
      realtimeChannel = supabase
        .channel('realtime:macchine_cnc')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'macchine_cnc' },
          () => {
            get().fetchMacchine();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime channel error macchine:', e);
    }
  },

  cleanupRealtime: () => {
    if (realtimeChannel) {
      try {
        supabase.removeChannel(realtimeChannel);
      } catch (e) {
        console.warn('cleanup realtime macchine error:', e);
      }
      realtimeChannel = null;
    }
  }
}));
