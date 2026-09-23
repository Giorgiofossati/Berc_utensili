import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { 
  getCachedCatalog, 
  saveCatalogToCache, 
  updateToolInCache, 
  addToolToCache, 
  removeToolFromCache 
} from '../lib/catalogCache';
import { generateSearchIndex } from '../lib/searchUtils';

/**
 * Arricchisce un array di utensili aggiungendo _searchIndex pre-calcolato
 */
function enrichToolsWithIndex(toolsList) {
  if (!Array.isArray(toolsList)) return [];
  return toolsList.map(t => {
    if (t._searchIndex) return t;
    return {
      ...t,
      _searchIndex: generateSearchIndex(t)
    };
  });
}

/**
 * Fallback resiliente: scarica tutti i record a blocchi di 1000 righe
 * per superare il limite nativo PostgREST se la funzione RPC non è ancora definita.
 */
async function fetchAllToolsInChunks() {
  const PAGE_SIZE = 1000;
  let allData = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('Utensili_B1')
      .select('*')
      .order('Tipologia', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (data && data.length > 0) {
      allData = allData.concat(data);
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        from += PAGE_SIZE;
      }
    } else {
      hasMore = false;
    }
  }
  return allData;
}

let realtimeChannel = null;

export const useInventoryStore = create((set, get) => ({
  tools: [],
  isLoading: true,
  isSyncing: false,
  lastSyncTime: null,

  setTools: (toolsOrCallback) => set((state) => {
    const resolved = typeof toolsOrCallback === 'function' ? toolsOrCallback(state.tools) : toolsOrCallback;
    const enriched = enrichToolsWithIndex(resolved);
    return { tools: enriched };
  }),

  /**
   * Sincronizzazione Catalogo ad alte prestazioni:
   * 1. Legge all'istante dalla cache IndexedDB locale (render immediato < 5ms).
   * 2. In background prova la chiamata veloce RPC `get_tools_catalog()`.
   * 3. Se la RPC fallisce, fallback su Range Batching automatico.
   * 4. Aggiorna lo store e persiste la nuova cache locale.
   */
  fetchTools: async (forceNetwork = false) => {
    // Fase 1: Cache locale (Offline-first)
    if (!forceNetwork && get().tools.length === 0) {
      try {
        const cached = await getCachedCatalog();
        if (cached && cached.tools && cached.tools.length > 0) {
          const enrichedCached = enrichToolsWithIndex(cached.tools);
          set({ 
            tools: enrichedCached, 
            isLoading: false, 
            lastSyncTime: cached.lastUpdated 
          });
        }
      } catch (cacheErr) {
        console.warn('Lettura cache iniziale non riuscita:', cacheErr);
      }
    }

    set({ isSyncing: true });

    // Fase 2: Sincronizzazione con Supabase
    try {
      let rawTools = null;

      // Prova prima la stored procedure compressa ad alta velocità
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_tools_catalog');
      
      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        rawTools = rpcData;
      } else {
        // Fallback automatico a blocchi di 1000 righe
        rawTools = await fetchAllToolsInChunks();
      }

      if (rawTools && Array.isArray(rawTools)) {
        const enriched = enrichToolsWithIndex(rawTools);
        set({ 
          tools: enriched, 
          isLoading: false, 
          isSyncing: false,
          lastSyncTime: Date.now() 
        });

        // Salva in IndexedDB in background
        saveCatalogToCache(enriched);
      } else {
        set({ isLoading: false, isSyncing: false });
      }
    } catch (err) {
      console.error('Errore sincronizzazione catalogo:', err);
      // Se fallisce ma avevamo la cache locale, rimaniamo usabili
      set({ isLoading: false, isSyncing: false });
    }
  },

  /**
   * Canale Supabase Realtime per ricezione microeventi da altri dispositivi/utenti
   */
  initRealtime: () => {
    if (realtimeChannel) return;

    realtimeChannel = supabase
      .channel('realtime:Utensili_B1')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Utensili_B1' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          const currentTools = get().tools;

          if (eventType === 'UPDATE' && newRecord) {
            // Aggiorna l'utensile mantenendo le proprietà calcolate
            const existing = currentTools.find(t => t.id === newRecord.id);
            const merged = existing ? { ...existing, ...newRecord } : newRecord;
            const enriched = { ...merged, _searchIndex: generateSearchIndex(merged) };

            set({
              tools: currentTools.map(t => t.id === newRecord.id ? enriched : t)
            });
            updateToolInCache(newRecord.id, enriched);
          } else if (eventType === 'INSERT' && newRecord) {
            // Inserisci nuovo articolo
            const enriched = { ...newRecord, _searchIndex: generateSearchIndex(newRecord) };
            if (!currentTools.some(t => t.id === newRecord.id)) {
              set({ tools: [enriched, ...currentTools] });
              addToolToCache(enriched);
            }
          } else if (eventType === 'DELETE' && oldRecord) {
            // Rimuovi articolo cancellato
            set({
              tools: currentTools.filter(t => t.id !== oldRecord.id)
            });
            removeToolFromCache(oldRecord.id);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Canale Realtime connesso e attivo
        }
      });
  },

  cleanupRealtime: () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  }
}));
