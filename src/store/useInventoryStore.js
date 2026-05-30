import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useInventoryStore = create((set, get) => ({
  tools: [],
  isLoading: true,
  setTools: (toolsOrCallback) => set((state) => ({
    tools: typeof toolsOrCallback === 'function' ? toolsOrCallback(state.tools) : toolsOrCallback
  })),
  fetchTools: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase.from('Utensili_B1').select('*').order('Tipologia', { ascending: true });
    if (!error) {
      set({ tools: data || [], isLoading: false });
    } else {
      set({ isLoading: false });
    }
  }
}));
