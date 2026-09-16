import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useCommesseStore = create((set, get) => ({
  commesse: [],
  isLoading: false,
  error: null,

  setCommesse: (commesseOrCallback) => set((state) => ({
    commesse: typeof commesseOrCallback === 'function' ? commesseOrCallback(state.commesse) : commesseOrCallback
  })),

  fetchCommesse: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('commesse')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Errore durante il recupero delle commesse:', error);
        set({ error: error.message, isLoading: false });
        return { success: false, error };
      }

      set({ commesse: data || [], isLoading: false, error: null });
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('Eccezione durante il recupero delle commesse:', err);
      set({ error: err.message, isLoading: false });
      return { success: false, error: err };
    }
  },

  createCommessa: async ({ codice, descrizione, ubicazione, stato = 'Attiva' }) => {
    const trimmedCodice = (codice || '').trim().toUpperCase();
    if (!trimmedCodice) {
      return { success: false, error: new Error('Il codice commessa è obbligatorio.') };
    }

    const newRecord = {
      codice: trimmedCodice,
      descrizione: (descrizione || '').trim() || null,
      ubicazione: (ubicazione || '').trim() || null,
      stato: stato === 'Chiusa' ? 'Chiusa' : 'Attiva'
    };

    try {
      const { data, error } = await supabase
        .from('commesse')
        .insert([newRecord])
        .select()
        .single();

      if (error) {
        console.error('Errore durante la creazione della commessa:', error);
        return { success: false, error };
      }

      // Aggiornamento immediato dello store locale
      const currentCommesse = get().commesse;
      set({ commesse: [data, ...currentCommesse] });

      return { success: true, data };
    } catch (err) {
      console.error('Eccezione durante la creazione della commessa:', err);
      return { success: false, error: err };
    }
  },

  updateCommessa: async (id, { codice, descrizione, ubicazione, stato }) => {
    const trimmedCodice = (codice || '').trim().toUpperCase();
    if (!trimmedCodice) {
      return { success: false, error: new Error('Il codice commessa è obbligatorio.') };
    }

    const updatedRecord = {
      codice: trimmedCodice,
      descrizione: (descrizione || '').trim() || null,
      ubicazione: (ubicazione || '').trim() || null,
      stato: stato === 'Chiusa' ? 'Chiusa' : 'Attiva'
    };

    try {
      const { data, error } = await supabase
        .from('commesse')
        .update(updatedRecord)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Errore durante l\'aggiornamento della commessa:', error);
        return { success: false, error };
      }

      set((state) => ({
        commesse: state.commesse.map((c) => (c.id === id ? data : c))
      }));

      return { success: true, data };
    } catch (err) {
      console.error('Eccezione durante l\'aggiornamento della commessa:', err);
      return { success: false, error: err };
    }
  },

  toggleStatoCommessa: async (id, currentStato) => {
    const nextStato = currentStato === 'Attiva' ? 'Chiusa' : 'Attiva';

    try {
      const { data, error } = await supabase
        .from('commesse')
        .update({ stato: nextStato })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Errore durante il cambio stato della commessa:', error);
        return { success: false, error };
      }

      set((state) => ({
        commesse: state.commesse.map((c) => (c.id === id ? data : c))
      }));

      return { success: true, data };
    } catch (err) {
      console.error('Eccezione durante il cambio stato della commessa:', err);
      return { success: false, error: err };
    }
  },

  deleteCommessa: async (id) => {
    try {
      const { error } = await supabase
        .from('commesse')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Errore durante l\'eliminazione della commessa:', error);
        return { success: false, error };
      }

      set((state) => ({
        commesse: state.commesse.filter((c) => c.id !== id)
      }));

      return { success: true };
    } catch (err) {
      console.error('Eccezione durante l\'eliminazione della commessa:', err);
      return { success: false, error: err };
    }
  }
}));
