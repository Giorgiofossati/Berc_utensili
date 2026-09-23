/**
 * Gestore Cache Locale IndexedDB per Catalogo Utensili Bercella
 * - Archiviazione asincrona ad alte prestazioni (zero blocchi UI, zero limiti 5MB di localStorage)
 * - Supporto completo Offline-First per PWA in officina
 * - Sincronizzazione selettiva per singoli record a seguito di microeventi Realtime
 */

const DB_NAME = 'bercella_inventory_db';
const DB_VERSION = 1;
const STORE_NAME = 'tools_cache';
const CATALOG_KEY = 'global_catalog';

/**
 * Apre la connessione al database IndexedDB locale
 */
function openDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.warn('Impossibile accedere a IndexedDB:', request.error);
      resolve(null);
    };
  });
}

/**
 * Recupera l'intero catalogo memorizzato nella cache locale
 * @returns {Promise<{ tools: Array, lastUpdated: number } | null>}
 */
export async function getCachedCatalog() {
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(CATALOG_KEY);

      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result.tools)) {
          resolve({
            tools: req.result.tools,
            lastUpdated: req.result.lastUpdated || 0
          });
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Errore lettura da cache IndexedDB:', err);
    return null;
  }
}

/**
 * Salva l'intero catalogo utensili nella cache locale IndexedDB
 * @param {Array} tools
 */
export async function saveCatalogToCache(tools) {
  if (!Array.isArray(tools)) return;
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        key: CATALOG_KEY,
        tools: tools,
        count: tools.length,
        lastUpdated: Date.now()
      });

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Errore salvataggio in cache IndexedDB:', err);
  }
}

/**
 * Aggiorna un singolo utensile nella cache locale (in risposta a microeventi Realtime)
 * @param {string} toolId
 * @param {Object} updatedFields
 */
export async function updateToolInCache(toolId, updatedFields) {
  try {
    const cached = await getCachedCatalog();
    if (!cached || !cached.tools) return;

    let modified = false;
    const newTools = cached.tools.map(tool => {
      if (tool.id === toolId) {
        modified = true;
        return { ...tool, ...updatedFields };
      }
      return tool;
    });

    if (modified) {
      await saveCatalogToCache(newTools);
    }
  } catch (err) {
    console.warn('Errore aggiornamento record in cache IndexedDB:', err);
  }
}

/**
 * Aggiunge un nuovo utensile alla cache locale
 * @param {Object} newTool
 */
export async function addToolToCache(newTool) {
  try {
    const cached = await getCachedCatalog();
    const current = cached?.tools || [];
    // Evita duplicati
    if (current.some(t => t.id === newTool.id)) return;

    const updated = [newTool, ...current];
    await saveCatalogToCache(updated);
  } catch (err) {
    console.warn('Errore inserimento record in cache IndexedDB:', err);
  }
}

/**
 * Rimuove un utensile dalla cache locale
 * @param {string} toolId
 */
export async function removeToolFromCache(toolId) {
  try {
    const cached = await getCachedCatalog();
    if (!cached || !cached.tools) return;

    const updated = cached.tools.filter(t => t.id !== toolId);
    await saveCatalogToCache(updated);
  } catch (err) {
    console.warn('Errore cancellazione record da cache IndexedDB:', err);
  }
}

/**
 * Pulisce la cache locale
 */
export async function clearCatalogCache() {
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(CATALOG_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Errore pulizia cache IndexedDB:', err);
  }
}
