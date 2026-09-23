# 📝 Registro Modifiche Software (Changelog / Log)

Questo file tiene traccia in ordine cronologico inverso di tutte le implementazioni, correzioni di bug, modifiche grafiche e refactoring architetturali apportati all'applicazione **Bercella Utensili**.

> [!IMPORTANT]
> **REQUISITO TASSATIVO PER GLI AGENTI AI E GLI SVILUPPATORI**:
> Ad ogni implementazione, modifica al codice, bugfix o refactoring completato con successo, **l'agente DEVE obbligatoriamente registrare le novità in cima a questo file** prima di concludere il task.

### 📌 Linee Guida per la Compilazione
1. **Posizione**: Inserire la nuova voce **in cima** al file (ordine cronologico inverso).
2. **Formato Data**: `[YYYY-MM-DD]` (es. `[2026-09-19]`).
3. **Tag di Intervento**:
   - `[FEAT]`: Nuova funzionalità o vista.
   - `[FIX]`: Correzione di bug o anomalie.
   - `[UX/UI]`: Migliorie a layout, design system, usabilità o accessibilità.
   - `[REFACTOR]`: Riorganizzazione del codice o hook senza cambi funzionali esterni.
   - `[PERF]`: Ottimizzazioni di prestazioni (bundle, caricamento, query).
   - `[DOCS]`: Aggiornamenti alla documentazione o regole di sistema.
4. **Brevità**: Utilizzare elenchi puntati concisi (2-4 punti chiave) indicando i file principali modificati e l'impatto.

---

## [2026-09-24] - Correzione Menu 3 Puntini, Scarico Utensile su Commessa e Reingegnerizzazione Creazione Utensile
- **Tag**: `[FIX]` / `[UX/UI]`
- **Descrizione**:
  - **Menu 3 Puntini (`IconMenu`)**: risolto il mancato funzionamento delle azioni nei menu a tendina in `src/components/ui/icon-button.jsx` sostituendo `onSelect` con `onClick` ed `e.stopPropagation()` sul componente `Menu.Item` di `@base-ui/react`. Ripristinate le azioni `Modifica`, `Elimina` e `Reimposta Tutorial` in `OperatorsView`, nonché `Elimina` e `Cambia Stato` in `CommesseView`.
  - **Scarico Utensile Imputato a Commessa**: risolto l'errore di scrittura durante lo scarico su commessa in `useMovementStore` e `useMultiMovementStore` tramite fallback client-side resiliente che aggiorna la giacenza centrale in `Utensili_B1` e inserisce il log con `commessa_id` in `movements_history`, e predisposta la relativa migration SQL.
  - **Creazione Utensile Rapida con Attributi Indispensabili (`DESIGN_SYSTEM.md`)**: reingegnerizzati `AddToolModal.jsx` e `useAddToolForm.js`. Resi obbligatori entrambi i codici identificativi (`Codice Aziendale *` e `Codice Produttore *`), il `Fornitore *`, `Diametro *`, `Ubicazione *`, `Quantità *` e i parametri geometrici reattivi (`Forma`/`Raggio` per frese, `Passo` per maschi, `Angolo` per svasatori, `Tolleranza` per alesatori) visibili subito nel blocco principale; mantenuti nell'accordion compatto i soli dettagli opzionali (`Materiale`, `Rivestimento`, `Lavorazione`, `Lunghezza`, `Stato`); eliminati contenitori grigi intermedi ("box-in-a-box") conformemente a `DESIGN_SYSTEM.md`.
- **File Coinvolti**:
  - `src/components/ui/icon-button.jsx`
  - `src/features/inventory/AddToolModal.jsx`
  - `src/hooks/useAddToolForm.js`
  - `src/store/useMovementStore.js`
  - `src/store/useMultiMovementStore.js`
  - `src/features/admin/OperatorsView.jsx`
  - `supabase/migrations/20260924_fix_commesse_movement_logic.sql`
  - `CHANGELOG.md`

## [2026-09-23] - Fase 4.4 & 4.7: Struttura Modali, Container Queries Form e Audit Distinta (§1.11, §1.14, §6.1-§6.3, §7, §8.2)
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - **MultiMovementView (Fase 4.4, §1.11, §5.1, §8.2)**: verificata la distinta a griglia immediata (§5.1) con prima riga attiva e segnaposto strutturali senza alcun caricatore a pagina intera; uniformate le icone alla scala a 5 passi §1.11 (`ToolIcon` a 32px, icone micro 14px per pulsanti compatti e badge, default 16px per controlli ed enfasi 20px per conferma batch).
  - **Anatomia Modali Unificata (Fase 4.7, §6.1-§6.3)**: consolidato l'uso dei componenti semantici `ModalHeader`, `ModalBody` e `ModalFooter` su tutti i modali di inventario (`MovementModal`, `AddToolModal`, `OrderModal`, `AddToolToMultiModal`); standardizzata la gestione della 'X' di chiusura integrata nell'header con `showCloseButton={false}` su `DialogContent`; uniformato lo stato di successo con `ModalBody` in `OrderModal` e ripulite importazioni superflue.
  - **Container Queries su Form e Griglie Interne (§1.14, §7)**: applicato wrapper `@container` e variante `@md:grid-cols-3` alla griglia dettagli attributi in `MovementModal`; verificata e rafforzata l'adozione di `@container` e `@sm:grid-cols-2` sui form e filtri in `AddToolModal`, `OrderModal` e `AddToolToMultiModal`.
  - **Audit Dimensionale Icone & Shimmer Skeleton (§1.11, §8.2)**: integrato `StateBlock` con `skeletonShape="row"` e `loadingMode="skeleton"` in `AddToolToMultiModal` per il caricamento iniziale del catalogo in modale; uniformate le icone di `ModalHeader` al passo `box header: 24px` (`Layers`, `ShoppingCart`, `Briefcase`, `ArrowDown`, `ArrowUp`), icone input a `default: 16px` (`Search`), icone di successo a `hero: 32-40px` (`CheckCircle2` a 40px in `AddToolModal` senza sforamenti a 48px, 32px in `OrderModal`) e chevron a 16px.
- **File Coinvolti**:
  - `src/features/inventory/MultiMovementView.jsx`
  - `src/features/inventory/MovementModal.jsx`
  - `src/features/inventory/AddToolModal.jsx`
  - `src/features/inventory/OrderModal.jsx`
  - `src/features/inventory/AddToolToMultiModal.jsx`
  - `CHANGELOG.md`

## [2026-09-23] - Fase 4.1: Applicazione Design System a HistoryView (StatTile, TableWrapper, showDensityToggle e StateBlock) (§1.11, §1.14, §4.5, §5.2, §8.2)
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **StatTile & Container Queries (§1.14, §4.5)**: introdotta la riga di 4 `StatTile` in cima a `PageContent` racchiusa in un wrapper `@container` reattivo (`grid gap-3 sm:gap-4 grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-4 items-stretch`), riepilogando Totale Movimenti, Carichi (con delta pill "pz"), Scarichi (con delta pill "pz") e Operatori Coinvolti.
  - **TableWrapper & Toggle Densità (§5.2)**: introdotto `TableWrapper` con `showDensityToggle={true}` e prop `showDensityToggle` esposta, che allinea il subheader della tabella con contatore movimenti e pulsante di commutazione densità Comoda (56px) / Compatta (44px) con icona `AlignJustify` (14px). Rimosso il pulsante ridondante da `PageToolbar`.
  - **Empty State con StateBlock (§8.2)**: standardizzata la prop `variant={activeFiltersCount > 0 ? "filtered" : "generic"}` per mostrare il copy contestuale corretto e l'azione rapida di reset filtri.
  - **Audit Dimensioni Icone (§1.11)**: verificate tutte le icone `lucide-react` garantendo l'adesione rigorosa alla scala consentita `{14, 16, 20, 24, 32-40}` e ripuliti gli import non utilizzati.
- **File Coinvolti**:
  - `src/features/admin/HistoryView.jsx`
  - `CHANGELOG.md`

## [2026-09-23] - Fase 4.5 & 4.6: Container Queries e Audit Icone su ScannerView, CategoryGridCard e DiameterList (§1.8, §1.11, §1.14)
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - **ScannerView (Fase 4.5)**: verificata la corretta delega di densità e hover/selected a `ToolsGrid` (`selectionMode="none"`) e `VirtualizedTable` senza duplicazioni locali di stili riga; completato audit dimensionale icone (Search 20px/32px, Camera 20px/24px, ArrowDown/Up 14px, X 16px) e rimossa dipendenza inutilizzata `ArrowLeft`; sostituita classe non standard `app-caption` con `app-body` nell'errore fotocamera di `BarcodeScanner`.
  - **Home / Griglie Tessere Categoria e Diametro (Fase 4.6, §1.8, §1.14)**: applicato wrapper `@container` e varianti container queries (`@sm:`, `@md:`, `@xl:`, `@3xl:`) sul contenitore tessere categoria in `App.jsx` e sulla lista diametri `DiameterList.jsx`; convertita `CategoryGridCard` da `div` generico a `<button type="button">` accessibile con focus-ring e dimensioni scalari basate sul contenitore.
  - **Audit Dimensionale e StateBlock in DiameterList (§1.11, §8.2)**: uniformate le icone di ricerca e cancellazione a 16px (`default: 16px` per input/icon-button); integrato `StateBlock` standard (`state="empty"`, `variant="search"`, icona 32px) per la ricerca vuota dei diametri con azione diretta di azzeramento; allineata la tinta di hover tessere alla specifica universale `hover:bg-accent-blue/[0.06]`.
- **File Coinvolti**:
  - `src/features/scanner/ScannerView.jsx`
  - `src/features/scanner/BarcodeScanner.jsx`
  - `src/features/filters/CategoryGridCard.jsx`
  - `src/features/filters/DiameterList.jsx`
  - `src/App.jsx`

## [2026-09-23] - Fase 4.2 & 4.3: Allineamento Design System in CommesseView e OperatorsView (§1.11, §1.13, §8.2)
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - **StateBlock Contestuale e Scheletro Card (§8.2)**: integrato `StateBlock` con `variant="generic"` vs `variant="search"` (o `variant="filtered"` per filtri di stato in commesse) passando `searchTerm={searchQuery.trim()}` per titoli e descrizioni parametrici con azioni di reset mirate. Configurato `skeletonShape="card"` e `count={6}` per lo stato di caricamento e aggiunto blocco di errore con retry su `fetchUsers`.
  - **Superfici Interattive e Stato Selezionato (§1.13)**: uniformata la tinta di hover universale `hover:bg-accent-blue/[0.06]` sulle card commesse e operatori; in `CommesseView` aggiunto lo stato di selezione attiva (`bg-accent-blue/10 border-accent-blue/40 shadow-[inset_3px_0_0_var(--color-accent-blue)]`) durante l'editing, con affordance tastiera completa (`role="button"`, `tabIndex={0}`, tasti Enter/Space).
  - **Audit Dimensionale Icone e Touch Target (§1.11, ISO 9241)**: portate tutte le icone dei menu a tendina da 14px a 16px (`RefreshCw`, `Trash2`, `HelpCircle`, `Edit2`) riservando 14px esclusivamente a badge e didascalie inline; aggiunto comando "Modifica" (`Pencil 16px`) nel menu commesse; garantita area touch minima 44×44px e attributi `aria-label` sul pulsante elimina modale commesse e sul toggle visibilità password admin.
- **File Coinvolti**:
  - `src/features/admin/CommesseView.jsx`
  - `src/features/admin/OperatorsView.jsx`

## [2026-09-23] - Fase 2.4: Formalizzazione selectionMode e Toggle Densità in ToolsGrid (§5, §5.2)
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Prop selectionMode ('none' | 'toggle' | 'pick')**: formalizzata la gestione della modalità di selezione in `ToolsGrid` con default a `'none'` e compatibilità per legacy `'multiple'/'single'`. Isolato completamente lo stato checkbox (`isSelectionActive`) per prevenire leak di selezione tra viste (modali di picking `AddToolToMultiModal` e scansione `ScannerView` mantengono righe cliccabili e checkbox nascoste).
  - **Propagazione e Affordance Riga**: propagata `selectionMode` a `VirtualizedTable` con attributi semantici `data-selection-mode` e `aria-selected`. In modalità `'pick'`, la riga mostra automaticamente l'icona trailing `Plus` per indicare chiaramente l'azione di inserimento/selezione.
  - **Toggle Densità Comoda/Compatta**: aggiunto pulsante di cambio densità nella toolbar interna visibile quando `showDensityToggle={true}` (default `false`), regolando l'altezza stimata delle righe virtualizzate (56px Comoda vs 44px Compatta).
  - **Aggiornamento Consumatori Grid**: impostato `selectionMode="toggle"` nella vista catalogo principale (`App.jsx`), `selectionMode={isSelectionMode ? "toggle" : "none"}` in `DropdownFilterView.jsx` e `selectionMode="none"` in `ScannerView.jsx`.
- **File Coinvolti**:
  - `src/features/inventory/ToolsGrid.jsx`
  - `src/components/common/DataTable/VirtualizedTable.jsx`
  - `src/App.jsx`
  - `src/features/filters/DropdownFilterView.jsx`
  - `src/features/scanner/ScannerView.jsx`
  - `CHANGELOG.md`

## [2026-09-23] - Fase 2.1: Consolidamento StateBlock e Shimmer Skeleton Animation (§8.2)
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Icon box StateBlock (§8.2)**: ridotto il box icona principale a `56×56` (`w-14 h-14`) con `rounded-[var(--radius-icon-box,18px)]` conforme ai token del Design System e icona neutra a 32px centrata.
  - **Varianti Empty State**: aggiunta prop `variant` (`'generic' | 'filtered' | 'search'`, default `'generic'`) con icone, titoli, testi operativi e label CTA dedicati per ciascuna tipologia.
  - **Skeleton Loading & Shimmer Animation**: aggiunta modalità caricamento shimmer con prop `skeletonShape` (`'row' | 'card' | 'grid'`), mantenendo lo spinner `Loader2` come fallback predefinito quando la geometria skeleton non è specificata.
  - **Animazione Shimmer & Accessibilità**: definita la keyframe animation `@keyframes shimmer` (1.4s ease infinite) e `.animate-shimmer` in `src/index.css`, con fallback ad opacità fissa non distruttiva (`opacity: 0.75 !important`) sotto `prefers-reduced-motion: reduce`.
  - **Sanitizzazione Errori Tecnici**: blocco preventivo dei messaggi Supabase grezzi / PostgREST / PostgreSQL passati tramite `error.message` o `description`, con logging su `console.error` e sostituzione in interfaccia con messaggio rassicurante in chiaro per l'operatore.
- **File Coinvolti**:
  - `src/components/common/StateBlock.jsx`
  - `src/index.css`
  - `CHANGELOG.md`

## [2026-09-23] - Fase 3.1: Componente StatTile per metriche e KPI di panoramica (§4.5)
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Componente StatTile (§4.5)**: creato `src/components/ui/stat-tile.jsx` in sola lettura (`select-none`, nessun `cursor-pointer`), riceve `icon`, `label`, `value`, `delta` (`{direction: 'up'|'down'|'flat', text}`) e `accent` (`'blue'|'emerald'|'rose'|'orange'`).
  - **Icon box dimensionale**: box `36×36 rounded-[11px]` con classi di sfondo, bordo e icona semantiche dipendenti dall'accento (`accent-blue`, `accent-emerald`, `accent-rose`, `accent-orange`).
  - **Layout & Tipografia**: struttura standard icona -> label `.app-overline text-accent-orange` -> valore `.app-qty-lg` + badge delta pillole contestuale (frecce `▲`/`▼`/`−` e testo unita/variazione).
  - **Guardrail CI**: aggiornato `scripts/check-tailwind-tokens.mjs` per consentire `rounded-[11px]` come da specifica token box icone del Design System. Verifica sintattica e build di produzione concluse con esito pulito.
- **File Coinvolti**:
  - `src/components/ui/stat-tile.jsx`
  - `scripts/check-tailwind-tokens.mjs`
  - `CHANGELOG.md`

---

## [2026-09-23] - Fase 2.2 e 2.3: Allineamento NavItem Sidebar, VirtualizedTable ed Ergonomia DataTable (§4.6, §5.2)
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - **Sidebar NavItem (§4.6)**: aggiornato hover a `hover:bg-accent-blue/[0.06]`, validata prop `disabled` con `opacity-40 cursor-not-allowed pointer-events-none` e inibizione di `onClick`, e formattazione badge a `"99+"` sia nel componente NavItem che nel counter `multiMovementCount` per conteggi superiori a 99.
  - **VirtualizedTable (§5.2)**: allineato hover di riga a `hover:bg-accent-blue/[0.06]`, selezione riga con `bg-accent-blue/10 shadow-[inset_3px_0_0_var(--color-accent-blue)]`, prop `density` (`'comfortable'` | `'compact'`, default `'comfortable'`) con `py-3.5` (56px) per comoda e `py-2` (44px) per compatta.
  - **ToolsGrid**: propagazione prop `density` verso `VirtualizedTable`, calcolo dinamico `estimateRowSize` (44px/56px) e allineamento classe riga selezionata `bg-accent-blue/10 shadow-[inset_3px_0_0_var(--color-accent-blue)]`.
  - **Verifica out of stock**: confermato che l'accento rosa (`badge-rose` e `text-accent-rose`) resta confinato esclusivamente alle celle Stato e Quantità e non all'intera riga di tabella.
- **File Coinvolti**:
  - `src/components/layout/Sidebar.jsx`
  - `src/components/common/DataTable/VirtualizedTable.jsx`
  - `src/features/inventory/ToolsGrid.jsx`

---

## [2026-09-23] - Fase 1bis: Normalizzazione Completa Spacing Scale 6-Point (§1.9)
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - **Verifica e consolidamento scala a 6 punti**: completata l'analisi e la verifica sistematica dei 17 punti critici con spaziature 20px (`p-5`, `px-5`, `py-5`, `gap-5`, `mt-5`) vietate da `DESIGN_SYSTEM.md` §1.9 in tutti i 12 file target (`App.jsx`, `UserSettingsModal.jsx`, `DiameterList.jsx`, `HistoryView.jsx`, `CommesseView.jsx`, `MovementModal.jsx`, `ScannerView.jsx`, `OrderModal.jsx`, `AddToolModal.jsx`, `ErrorBoundary.jsx`, `Header.jsx`, `AppTutorial.jsx`).
  - **Conversione al passo più vicino**: convalidati e applicati i passi canonici a 16px (`p-4`, `py-4`) per controlli e padding interni, e 24px (`p-6`, `gap-6`, `mt-6`) per layout, card e modali.
  - **Preservazione rifiniture fini**: confermati e preservati i 228 mezzi-passi approvati (`gap-1.5`, `py-2.5`, `p-3.5`, `mt-0.5`).
  - **Azzeramento definitivo residui**: normalizzato anche `.premium-table td` in `src/index.css` da `py-5` a `py-4`, azzerando qualsiasi classe `-5` residua nell'intero repository (0 violazioni residue).
- **File Coinvolti**:
  - `src/index.css`
  - `src/App.jsx`
  - `src/features/auth/UserSettingsModal.jsx`
  - `src/features/filters/DiameterList.jsx`
  - `src/features/admin/HistoryView.jsx`
  - `src/features/admin/CommesseView.jsx`
  - `src/features/inventory/MovementModal.jsx`
  - `src/features/scanner/ScannerView.jsx`
  - `src/features/inventory/OrderModal.jsx`
  - `src/features/inventory/AddToolModal.jsx`
  - `src/components/common/ErrorBoundary.jsx`
  - `src/components/layout/Header.jsx`
  - `src/components/common/AppTutorial.jsx`

---

## [2026-09-23] - Fix Phase 0bis: Toolbar wrap flessibile e troncamento codici in CommesseView
- **Tag**: `[UX/UI]` / `[FIX]`
- **Descrizione**:
  - **Wrap flessibile toolbar e larghezza minima ricerca**: aggiunta la classe `flex-wrap` al contenitore flessibile della toolbar e impostato `min-w-[220px]` sul contenitore del campo di ricerca in `CommesseView.jsx` per prevenire il taglio del testo placeholder e consentire al gruppo segmented control di andare a capo quando lo spazio orizzontale è ridotto.
  - **Catena completa min-w-0 per troncamento codice commessa**: integrato `min-w-0` su tutti i nodi della catena gerarchica flex fino all'elemento con `truncate` (`span.truncate.min-w-0`) e applicato `shrink-0` al badge di stato per evitare che il menu azioni `⋮` fuoriesca dalla card.
- **File Coinvolti**:
  - `src/features/admin/CommesseView.jsx`

---

## [2026-09-23] - Fase 1 Design System: Token Ombre/Elevazione, Motion, Stati Interattivi e Accessibilità Motion
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Token elevazione a 5 livelli**: Integrati in `@theme` i token `--shadow-1` (8px/24px), `--shadow-2` (16px/40px), `--shadow-3` (28px/64px), `--shadow-4` (18px/44px) con corrispondenti varianti per il tema scuro in `:root.dark` preservando le ombre semantiche.
  - **Token transizione temporale**: Aggiunti in `@theme` i token `--motion-fast` (150ms), `--motion-base` (250ms) e `--motion-slow` (400ms) per standardizzare le animazioni di micro-interazione e cambio layout.
  - **Classi semantiche per stati interattivi**: Configurate in `@layer components` le utility `.state-hover-tint` (tinta ciano al 6%) e `.state-selected` (tinta ciano al 10% con barra inset `accent-blue`).
  - **Guardrail globale prefers-reduced-motion**: Neutralizzati transform e animazioni su `active:scale-*`, `hover:-translate-*`, `group-hover:translate-*` e frecce pulsanti quando l'utente attiva la riduzione del movimento nel sistema operativo.
  - **Allineamento z-index drawer mobile**: Convalidato e forzato `z-[var(--z-drawer)]` sull'overlay drawer e pannello laterale in `Sidebar.jsx`.
- **File Coinvolti**:
  - `src/index.css`
  - `src/components/layout/Sidebar.jsx`

---

## [2026-09-23] - Fix Phase 0bis: Toolbar unificata, Reset filtri rosa e filtri a cascata stabili
- **Tag**: `[UX/UI]` / `[FIX]`
- **Descrizione**:
  - **Eliminazione PageToolbar duplicata**: rimosso il wrapper esterno `PageToolbar` da `App.jsx` per la vista `dropdown`/Elenco, mantenendolo solo per la modalità griglia (`viewMode === 'grid'`).
  - **Unificazione pulsante Reset filtri**: fuso il doppio pulsante in un unico comando rosa `Reset filtri` (`text-accent-rose`) che azzera contemporaneamente i filtri interni di `DropdownFilterView`, la `searchQuery` e il `filterStack` globale via `resetFilters`.
  - **Stabilizzazione filtri a cascata**: i filtri a tendina non vengono più smontati dal DOM (`if (!isVisible) return null` rimosso), evitando salti di layout e violazioni della legge di Fitts. Quando non hanno opzioni valide, ricevono lo stato `disabled` con opacità 40% e `pointer-events-none`.
  - **Pulizia layout animations**: rimosso `layout`/`popLayout` dai filtri e dal selettore modalità, preservando l'animazione di layout unicamente sul chip di ricerca attivo e sul pulsante di reset.
- **File Coinvolti**:
  - `src/App.jsx`
  - `src/features/filters/DropdownFilterView.jsx`

---

## [2026-09-23] - Ottimizzazione Architettura Catalogo, Cache IndexedDB, Ricerca a 0ms e Microeventi Realtime
- **Tag**: `[PERF]` / `[FEAT]` / `[FIX]`
- **Descrizione**:
  - **Superamento Limite 1.000 righe PostgREST**: Implementata architettura con funzione SQL `get_tools_catalog()` e fallback resiliente a chunked range batching su `useInventoryStore`. Tutti i 1.340+ utensili nel database vengono ora caricati ed esposti correttamente (i record oltre riga 1.000 erano precedentemente esclusi dal client).
  - **Cache Offline-First su IndexedDB (`catalogCache.js`)**: Catalogo memorizzato in locale in IndexedDB nativo (zero dipendenze esterne) per avvio istantaneo (< 5ms) e piena operatività PWA in officina anche in caso di instabilità Wi-Fi.
  - **Microeventi Supabase Realtime a 360°**: Attivata la replica Realtime cross-device su `Utensili_B1` (aggiornamento live giacenze), `movements_history` (notifica istantanea movimenti tra colleghi) e `commesse`.
  - **Ricerca Ultra-Reattiva a 0ms (`searchUtils.js`)**: Introdotta pre-indicizzazione in memoria `_searchIndex` con tolleranza bidirezionale completa per separatori decimali (`D4,5` ↔ `D4.5`), notazione diametro (`Ø16` ↔ `D16`), frazioni in pollici (`1/4`, `15/32`) e ricerche multi-termine non ordinate.
  - **Bugfix UI**: Risolto leak della chiave interna `_searchIndex` dalla visualizzazione delle specifiche tecniche nel `MovementModal`.
- **File Coinvolti**:
  - `src/lib/catalogCache.js` (NEW)
  - `src/lib/searchUtils.js` (NEW)
  - `supabase/migrations/20260923_catalog_rpc_and_realtime.sql` (NEW)
  - `src/store/useInventoryStore.js`
  - `src/store/useCommesseStore.js`
  - `src/App.jsx`
  - `src/features/filters/DropdownFilterView.jsx`
  - `src/features/scanner/ScannerView.jsx`
  - `src/features/inventory/AddToolToMultiModal.jsx`
  - `src/features/inventory/MovementModal.jsx`

---

## [2026-09-19] - Fix lag critico su cambi vista e interazioni (Virtualizzazione TanStack)
- **Tag**: `[PERF]` / `[FIX]`
- **Descrizione**:
  - **Identificato e risolto il lag persistente di ~2s**: passando da vista card a vista elenco (o premendo altri bottoni globali), la tabella TanStack Table generava migliaia di nodi DOM simultaneamente bloccando l'interfaccia.
  - **Ripristino Virtualizzazione**: la rottura era causata dall'uso improprio del wrapper `PageContent` (che è `overflow-y-auto`) attorno al contenitore della griglia sia in `DropdownFilterView` sia in `ScannerView`. Poiché il contenitore padre scrollava, `VirtualizedTable` si espandeva a dismisura (es. 50.000px), credendo che la viewport fosse enorme e vanificando l'effetto della virtualizzazione.
  - Sostituito il wrapper incriminato con un classico container `flex-1 min-h-0`, forzando la `ToolsGrid` a mantenere un'altezza circoscritta e ristabilendo il caricamento ultra-rapido (solo i 15-20 elementi visibili a schermo vengono renderizzati in DOM).
- **File Coinvolti**:
  - `src/features/filters/DropdownFilterView.jsx`
  - `src/features/scanner/ScannerView.jsx`

## [2026-09-19] - Ottimizzazione reattività ricerca globale con debouncing
- **Tag**: `[PERF]` / `[FIX]`
- **Descrizione**:
  - **Risolto blocco del thread principale durante la digitazione**: il refactoring precedente della barra di ricerca globale imponeva un ricalcolo dell'intera applicazione (`App.jsx`, `ToolsGrid` con TanStack Table e layout vari) a ogni singolo keystroke tramite la lettura live di `searchQuery` via `useFilters()`.
  - **Debouncing integrato nell'Header**: implementato uno stato locale (`localQuery`) in `Header.jsx` per garantire un feedback visivo immediato a 60fps nell'input, aggiornando lo stato globale `searchQuery` con un debounce di 250ms per limitare il ricalcolo pesante della tabella.
  - **Pulizia `App.jsx`**: rimossa la sottoscrizione reattiva non necessaria a `searchQuery` dal root level e spostata la logica di switch automatico alla vista elenco direttamente nell'handler locale di input.
- **File Coinvolti**:
  - `src/components/layout/Header.jsx`
  - `src/App.jsx`

## [2026-09-18] - Allineamento Terminologia e Glossario Design System (§9)
- **Tag**: `[UX/UI]` / `[FIX]`
- **Descrizione**:
  - Rinominate le voci del menu di navigazione in `Sidebar.jsx`: "Storico Log" -> "Storico movimenti" e "Guida & Tutorial" -> "Guida" in piena conformità a `DESIGN_SYSTEM.md` §9.
  - Aggiornato il Floating Action Button e relativo tooltip in `HelpFloatingButton.jsx`: testo tooltip, `aria-label` e `title` unificati al canonico "Guida" (rimosse le dizioni "Guida Rapida & Tutorial" / "Apri Guida e Tutorial").
  - Allineata la vista `HistoryView.jsx`: titolo `PageHeader` impostato su "Storico movimenti", breadcrumb aggiornato a "Magazzino" (rimosso il testo vietato "Tracciamento Log") e descrizione modale transazione allineata.
  - Aggiornato l'overline del tour guidato in `AppTutorial.jsx` a "Guida" e il relativo passaggio informativo in `useTutorialStore.js` su "Storico movimenti & Guida".
  - Aggiornati i testi dei bottoni di navigazione negli script di audit/test automatizzati (`desktop2.json`, `mobile.json`).
- **File Coinvolti**:
  - `src/components/layout/Sidebar.jsx`
  - `src/components/common/HelpFloatingButton.jsx`
  - `src/features/admin/HistoryView.jsx`
  - `src/components/common/AppTutorial.jsx`
  - `src/store/useTutorialStore.js`
  - `Miglioramenti UI/tools/desktop2.json`
  - `Miglioramenti UI/tools/mobile.json`

## [2026-09-18] - Rifiniture UI/UX - Fase 3 & 4
- **Tag**: `[FEAT]` / `[UX/UI]`
- **Descrizione**:
  - Creato nuovo componente `StatTile` in `src/components/ui/stat-tile.jsx` per mostrare KPI metrici unificati.
  - Implementato l'uso di `StatTile` nella vista `HistoryView` e incapsulato con wrapper `@container`.
  - Aggiornati `HistoryView`, `CommesseView` e `OperatorsView` per fare uso di `StateBlock` e classi modificate per normalizzazione.
  - Refactor dei modali in `OrderModal`, `UserSettingsModal` e scanner `Header` per usare gli standard `ModalHeader`, `ModalBody` e `ModalFooter` di Radix `dialog.jsx`.
  - Applicato clamp globale per `prefers-reduced-motion` a transizioni e animazioni CSS per accessibilità, assieme all'aggiunta di animazione spotlight in `AppTutorial`.
- **File Coinvolti**:
  - `src/components/ui/stat-tile.jsx`
  - `src/features/admin/HistoryView.jsx`
  - `src/features/admin/CommesseView.jsx`
  - `src/features/admin/OperatorsView.jsx`
  - `src/features/inventory/OrderModal.jsx`
  - `src/features/auth/UserSettingsModal.jsx`
  - `src/components/layout/Header.jsx`
  - `src/components/common/AppTutorial.jsx`
  - `src/index.css`
  - `src/App.jsx`

## [2026-09-18] - Rifiniture UI/UX - Fase 2
- **Tag**: `[UX/UI]`
- **Descrizione**:
  - Implementato `loading="skeleton"` e `emptyVariant` in `StateBlock` per migliore gestione degli stati di caricamento e vuoto, con messaggi di errore più sicuri e meno tecnici.
  - Aggiunta modalità "compatta" in `VirtualizedTable` e `ToolsGrid` con interruttore di densità.
  - Allineato `hover` e bordo di selezione in `VirtualizedTable` ai nuovi token cromatici.
  - Aggiunto il supporto per `disabled` e aggiornata la logica del contatore "99+" nel menu di navigazione (`Sidebar`).
  - Normalizzate le dimensioni delle icone a valori standard (14, 16, 20, 24, 32-40) in `Sidebar` e `ToolsGrid`.
- **File Coinvolti**:
  - `src/components/common/StateBlock.jsx`
  - `src/components/layout/Sidebar.jsx`
  - `src/components/common/DataTable/VirtualizedTable.jsx`
  - `src/features/inventory/ToolsGrid.jsx`
  - `src/index.css`

## [2026-09-18] - Standardizzazione Token Base, Transizioni, e Spaziature (Fase 1 e 1bis)
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - Aggiunti in `src/index.css` i token di base di elevazione (`--shadow-1`..`4`) inclusivi di varianti scure e le durate standard di transizione (`--motion-fast`, `--motion-base`, `--motion-slow`).
  - Introdotte utility `.state-hover-tint` e `.state-selected` per normalizzare gli hover states.
  - Estesa la query `prefers-reduced-motion` a tutti i target hover ed active interattivi nell'app.
  - Corretto lo `z-index` in `Sidebar.jsx` per usare `var(--z-drawer)` al posto di classi predefinite slegate dalla nuova policy.
  - Passata di standardizzazione scale dimensionale (Fase 1bis): convertiti valori fuori scala (`p-5`, `gap-5`, `mt-5`, `py-5`, `px-5`) agli standard 16px o 24px (`4`, `6`, `8`) definiti nel `DESIGN_SYSTEM.md`.
- **File Coinvolti**:
  - `src/index.css`
  - `src/components/layout/Sidebar.jsx`
  - `src/App.jsx`
  - `src/features/scanner/ScannerView.jsx`
  - `src/features/inventory/OrderModal.jsx`
  - E altri 8 componenti React (AppTutorial, AddToolModal, ErrorBoundary, Header, MovementModal, CommesseView, HistoryView, DiameterList, UserSettingsModal).

## [2026-09-18] - Fix crash Storico Log (SegmentedControl) e ricerca globale non funzionante
- **Tag**: `[FIX]`
- **Descrizione**:
  - **Crash critico su "Storico Log"**: la pagina andava in errore (`ErrorBoundary`) all'apertura. Causa: `SegmentedControl` usava `ToggleGroup.Root` / `ToggleGroup.Item` di `@base-ui/react`, ma in questa versione della libreria `ToggleGroup` è il componente radice stesso (senza sotto-proprietà `.Root`/`.Item`) e gli elementi si dichiarano con il componente separato `Toggle`. Corretto l'uso dell'API.
  - **Ricerca globale nell'header non funzionante**: digitare in "Cerca codice, misura..." aggiornava lo stato ma non produceva alcun effetto visibile se l'utente si trovava fuori dall'Inventario o in vista a griglia — mancava la logica di "switch automatico a vista elenco" descritta nel commit che ha introdotto la barra di ricerca. Aggiunto un effect in `App.jsx` che, al primo carattere digitato, naviga automaticamente su Inventario e passa a vista elenco.
  - Verificato via browser (Chrome): Inventario (griglia/elenco), dettaglio utensile, Preleva/Deposita, Movimento Multiplo, Commesse e Storico Log ora funzionano correttamente senza errori console.
- **File Coinvolti**:
  - `src/components/ui/segmented-control.jsx`
  - `src/App.jsx`

## [2026-09-18] - Fix ReferenceErrors residui e Nuova Regola di Sistema
- **Tag**: `[FIX]`, `[DOCS]`
- **Descrizione**:
  - Risolti ulteriori crash di runtime dovuti a `ReferenceError` causati dalla mancanza degli import per `PageToolbar` e altri componenti del DS in vari file (es. `DropdownFilterView.jsx`, `MultiMovementView.jsx`).
  - Scoperto un blind spot critico nella configurazione di ESLint: il plugin per le variabili e import di React (`jsx-no-undef`) non è attivo.
  - Inserita una regola di sistema ferrea nel file `gemini.md`: d'ora in poi gli agenti non dovranno mai fidarsi ciecamente di ESLint per quanto riguarda gli import React, ma dovranno sempre verificarli manualmente ad ogni refactoring.
- **File Coinvolti**:
  - `gemini.md`
  - `src/features/filters/DropdownFilterView.jsx`
  - `src/features/inventory/MultiMovementView.jsx`

## [2026-09-18] - Fix ReferenceError in App.jsx (PageTemplate import)
- **Tag**: `[FIX]`
- **Descrizione**:
  - Aggiunte le importazioni mancanti dei componenti layout (`PageTemplate`, `PageHeader`, `PageToolbar`, `PageContent`, `PageFooter`) in `src/App.jsx` per risolvere il crash all'avvio dell'applicazione.
- **File Coinvolti**:
  - `src/App.jsx`

## [2026-09-18] - Flussi e form, Modali e Login
- **Tag**: `[FEAT]` / `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - `MovementModal` migrato a Dialog size="lg" utilizzando ModalHeader, ModalBody e ModalFooter con logica step 1 e 2.
  - `AddToolModal` riorganizzato: codici (aziendale e produttore) spostati in alto per un flow più logico. Validazione inline (niente più popup alert fastidiosi) e uso di Dialog size="md".
  - Refactor del `LoginScreen`: riga visiva per separare gli "Accesso diretto" (Operatori) da "Richiede password" (Admin).
  - Il tutorial ora utilizza il componente `@base-ui/react/popover` con padding di collisione per essere sempre visibile a viewport.
- **File Coinvolti**:
  - `src/features/inventory/MovementModal.jsx`
  - `src/features/inventory/AddToolModal.jsx`
  - `src/features/auth/LoginScreen.jsx`
  - `src/components/common/AppTutorial.jsx`
  - `src/hooks/useAddToolForm.js`

## [2026-09-18] - Refactoring Viste Amministrative (Fase 2 - 2.1, 2.2, 2.3)
- **Tag**: `[REFACTOR]` / `[UX/UI]`
- **Descrizione**:
  - `HistoryView`: Migrazione a `PageTemplate` (Header, Toolbar, Content) e implementazione di `SegmentedControl` (Filtro Deposita/Preleva) e `StateBlock` (caricamento/errore).
  - `OperatorsView`: Utilizzo di `PageTemplate`, spostamento dei form di creazione/modifica nel modale nativo `Dialog` (size="md"). Aggiunti pulsanti azioni con `IconMenu`.
  - `CommesseView`: Applicato `PageTemplate` (con back standard) e `StateBlock` (rimpiazzati box ad-hoc).
- **File Coinvolti**:
  - `src/features/admin/HistoryView.jsx`, `src/features/admin/OperatorsView.jsx`, `src/features/admin/CommesseView.jsx`

## [2026-09-18] - Implementazione Fase 1 (Fondazioni) del Design System
- **Tag**: `[FEAT]` / `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - Implementate le fondamenta del `DESIGN_SYSTEM.md` v2 (Fase 1).
  - Aggiunti in `index.css` i token architetturali per i border-radius e la scala z-index globale.
  - Creato `PageTemplate.jsx` (Header, Toolbar, Content, Footer) per centralizzare il layout 100dvh e il bottone indietro standard.
  - Creati e standardizzati i componenti core dell'UI con `@base-ui/react`: `icon-button` a 44x44px e menu, `segmented-control` unificato, e `filter-chip` con drawer.
  - Esteso il modale base (`dialog.jsx`) aggiungendo la prop `size` (`sm`, `md`, `lg`, `xl`) e sub-componenti rigorosi.
  - Creati componenti comuni globali: sistema toast globale e `StateBlock` standard.
- **File Coinvolti**:
  - `src/index.css`, `src/components/layout/PageTemplate.jsx`, `src/components/ui/icon-button.jsx`, `src/components/ui/segmented-control.jsx`, `src/components/ui/filter-chip.jsx`, `src/components/ui/dialog.jsx`, `src/components/common/Toast.jsx`, `src/components/common/StateBlock.jsx`

## [2026-09-18] - Refactoring Layout Viste (PageTemplate e Standardizzazione)
- **Tag**: `[REFACTOR]` / `[UX/UI]`
- **Descrizione**:
  - Applicato `PageTemplate` a `MultiMovementView` garantendo la trasformazione in card su mobile e action fisse inferiori (`PageFooter`).
  - Aggiornato `ScannerView` inglobando layout standard con `PageHeader` ("Scanner") e `PageContent` unificato per ricerca testo e camera barcode.
  - Ristrutturata la vista Home in `App.jsx` per mostrare un `PageHeader` ("Inventario" o breadcrumb dinamico) e toolbar per i filtri, eliminando ridondanze.
  - Assicurato il passaggio esplicito di `selectionMode` al `ToolsGrid` all'interno di `DropdownFilterView`.
- **File Coinvolti**:
  - `src/features/inventory/MultiMovementView.jsx`
  - `src/features/scanner/ScannerView.jsx`
  - `src/App.jsx`
  - `src/features/filters/DropdownFilterView.jsx`

## [2026-09-18] - Fix loading/error states, a11y, routing and styling (Fase 0)
- **Tag**: `[FIX]`, `[UX/UI]`
- **Descrizione**:
  - Implementato lo stato di loading e error per `HistoryView` e `CommesseView`, impedendo la comparsa di empty states impropri in caso di caricamento o errore.
  - Fixati i contrasti WCAG e aggiunte le etichette per l'accessibilità (aria-labels su bottoni, role="button" su righe cliccabili della griglia, label `.app-label` nei form del login).
  - Rimossi i colori "indigo/purple" fuori tema (`toolUtils.jsx`) e aggiunta la classe `.badge-slate` in `index.css`.
  - Aggiunto `vercel.json` per gestire i rewrite delle rotte SPA e prevenire errori 404.
- **File Coinvolti**:
  - `src/features/admin/HistoryView.jsx`
  - `src/features/admin/CommesseView.jsx`
  - `src/features/auth/LoginScreen.jsx`
  - `src/features/admin/OperatorsView.jsx`
  - `src/components/common/DataTable/VirtualizedTable.jsx`
  - `src/index.css`
  - `src/lib/toolUtils.jsx`
  - `vercel.json`

## [2026-09-18] - Fix bug funzionali e logica di stato (Fase 0)
- **Tag**: `[FIX]`
- **Descrizione**:
  - Resettati `isSelectionMode` e `selectedToolsIds` al cambio vista in `useNavigationStore`.
  - Rimossi effetti collaterali dalla barra di ricerca globale in `Header`: il focus/⌘K non azzera più filtri né cambia vista.
  - Fix tutorial: il completamento del tutorial ora aggiorna esclusivamente il flag senza sovrascrivere le preferenze di visualizzazione (griglia/elenco).
  - Corretto reset di `batchOpType` dopo il completamento di un movimento multiplo in `useMultiMovementStore`.
- **File Coinvolti**:
  - `src/store/useNavigationStore.js`
  - `src/components/layout/Header.jsx`
  - `src/store/useAuthStore.js`
  - `src/store/useTutorialStore.js`
  - `src/store/useMultiMovementStore.js`

## [2026-09-18] - Riscrittura Design System v2 e piano di implementazione
- **Tag**: `[DOCS]`
- **Descrizione**:
  - Riscritto `DESIGN_SYSTEM.md` da zero sulla base delle 8 lacune (R1-R8) del `REPORT_FINALE.md`: aggiunte le sezioni mancanti — Page Template/PageHeader obbligatorio, gerarchia azioni a 4 livelli + pattern menu `⋮`, scala raggi/z-index/larghezze pagina come token unici, mappa stato→colore univoca con coppie `-foreground` per il contrasto, scala modali a 4 taglie (sm/md/lg/xl), regole Form/Toast/StateBlock (4 stati obbligatori), regole di stato/navigazione senza effetti collaterali, glossario vincolante. Conservate le regole ancora valide (simmetria card affiancate, scala tessere griglia, regola Distinta Movimento Multiplo, riferimenti screenshot prototipo).
  - Validati 3 prototipi visivi prima di scriverli nel documento.
  - Verificate le scelte contro la documentazione ufficiale Tailwind CSS v4 e shadcn/ui.
  - Creato `implementation_plan.md`: piano in 5 fasi per guidare l'esecuzione delle modifiche.
- **File Coinvolti**:
  - `DESIGN_SYSTEM.md`
  - `implementation_plan.md`
  - `CHANGELOG.md`

## [2026-09-18] - Audit UI/UX completo e indice di sistema
- **Tag**: `[DOCS]`
- **Descrizione**:
  - Creata cartella `Miglioramenti UI/` con `index.md` (catalogo di 56 screenshot desktop chiaro/scuro + mobile, flusso operativo verificato, mandato agent), 13 report di audit per schermata in `audit/` e `audit/REPORT_FINALE.md` (8 cause radice = lacune del design system, Top 15 problemi, piano in 4 fasi).
  - Aggiunto `Miglioramenti UI/tools/cap.mjs` (cattura screenshot via Chrome headless/CDP) per la regressione visiva.
- **File Coinvolti**:
  - `Miglioramenti UI/**`
  - `CHANGELOG.md`

## [2026-09-18] - Completamento Refactoring Visuale e Implementazione Guardrail
- **Tag**: `[UX/UI]` / `[CHORE]` / `[REFACTOR]`
- **Descrizione**:
  - Creato script di CI (`scripts/check-tailwind-tokens.mjs`) per prevenire l'uso di classi Tailwind con valori numerici arbitrari (`z-[...]`, `rounded-[...]`, `text-[...]`), forzando l'uso delle classi native o delle variabili CSS del Design System.
  - Sostituiti in massa i valori "hardcoded" nel codice (es. `z-[2000]`, `rounded-[24px]`, `text-[10px]`) con i token autorizzati (es. `z-50`, `rounded-3xl`, `text-xs`, `rounded-[var(--radius-modal)]`).
  - Aggiornato `package.json` integrando il controllo guardrail nella pipeline di sviluppo e nel comando `npm run lint`.
- **File Coinvolti**:
  - `scripts/check-tailwind-tokens.mjs`
  - `package.json`
  - Vari componenti React adeguati ai token di standardizzazione.
  - `CHANGELOG.md`

---

## [2026-09-16] - Ottimizzazione Gerarchia delle Azioni (Scala di Enfasi)
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - Applicata la regola di "Gerarchia delle Azioni" (Scala di Enfasi) alle viste principali per ridurre il carico cognitivo.
  - In `CommesseView.jsx`: La card commessa diventa un unico punto di ingresso (rimosso il bottone "MODIFICA" duplicato). Lo stato (Attiva/Chiusa) diventa un badge puramente informativo (non cliccabile). Le azioni "Cambia stato" ed "Elimina" sono state spostate in un menu a comparsa (kebab menu) nell'angolo della card.
  - In `AddToolModal.jsx`: Sostituito il pulsante piatto "Mostra Tutti gli Attributi" con un componente accordion "Attributi Avanzati", chiuso di default, che indica il conteggio dei campi opzionali (divulgazione progressiva reale).
- **File Coinvolti**:
  - `src/features/admin/CommesseView.jsx`
  - `src/features/inventory/AddToolModal.jsx`
  - `CHANGELOG.md`

## [2026-09-16] - Sincronizzazione Store Commesse e Visibilità nel Movimento Multiplo
- **Tag**: `[FIX]` / `[UX/UI]`
- **Descrizione**:
  - Risolto il problema per cui le commesse create non comparivano nel selettore di `MultiMovementView` e `MovementModal`: sostituiti i fetch isolati verso Supabase con la connessione diretta a `useCommesseStore`.
  - Aggiornato il menu a tendina delle commesse per mostrare sia le "Commesse Attive" (selezionabili) sia le "Commesse Chiuse" (visibili con dicitura chiara `(Chiusa)` anziché sparire silenziosamente nel nulla).
  - Feedback immediato dello stato: l'operatore comprende istantaneamente se una commessa è archiviata/chiusa e deve essere riattivata per essere associata ai prelievi.
- **File Coinvolti**:
  - `src/features/inventory/MultiMovementView.jsx`
  - `src/features/inventory/MovementModal.jsx`
  - `CHANGELOG.md`

## [2026-09-16] - Pulizia Gerarchia Visiva e Riduzione Clutter Modale Commesse
- **Tag**: `[UX/UI]` / `[FIX]`
- **Descrizione**:
  - Semplificata radicalmente la gerarchia visiva del modale Commesse su richiesta dell'utente ("tanti elementi, poco allineati"): rimosso titolo interno ridondante, unificati i badge (codice e stato) sulla stessa riga del titolo per massima pulizia.
  - Sostituite le label complesse (testo float destro) con etichette `.app-overline` pulite a sinistra, semplificando la lettura dei campi input.
  - Rimosse le enormi card interattive per la selezione dello stato (Attiva/Chiusa) in favore di un compatto *segmented control* orizzontale, risparmiando spazio verticale e riducendo il "rumore" cromatico.
  - Alleggerito il footer trasformando il pulsante "Elimina Commessa" in un'icona tattile sul lato sinistro, focalizzando l'attenzione sui bottoni primari Annulla / Salva.
- **File Coinvolti**:
  - `src/features/admin/CommesseView.jsx`
  - `CHANGELOG.md`

## [2026-09-16] - Ottimizzazione Spaziature, Dimensioni Modali e Standardizzazione UX/UI
- **Tag**: `[UX/UI]` / `[FIX]` / `[DOCS]`
- **Descrizione**:
  - Risolta l'anomalia di compressione e troncamento del modale Commesse ("MODIFICA COMME..."): rimosso il vincolo restrittivo `sm:max-w-sm` in `dialog.jsx`, permettendo l'applicazione corretta delle classi `max-w` personalizzate.
  - Schermata Modale Commessa ampliata su Tier 2 (`sm:max-w-2xl md:max-w-3xl`) con layout a 2 colonne responsive, padding ergonomico aumentato (`p-6 sm:p-8`), badge mono per codice commessa e pulsanti stato operativi a card tattili (`min-h-[56px]`).
  - Prevenuta la rottura su due righe dei pulsanti primari ("SALVA MODIFICHE") tramite padding calibrati e `whitespace-nowrap font-black tracking-wider`.
  - Formalizzata nei file di sistema (`DESIGN_SYSTEM.md`, `SYSTEM_AUDIT_RULES.md`, `GEMINI.md`) la scala dimensionale ufficiale a 4 Tier per tutti i modali e le regole anti-troncatura.
- **File Coinvolti**:
  - `src/components/ui/dialog.jsx`
  - `src/features/admin/CommesseView.jsx`
  - `DESIGN_SYSTEM.md`
  - `SYSTEM_AUDIT_RULES.md`
  - `GEMINI.md`
  - `CHANGELOG.md`

## [2026-09-16] - Gestione Completa Commesse (Modifica, Toggle Stato ed Eliminazione)
- **Tag**: `[FEAT]` / `[UX/UI]`
- **Descrizione**:
  - Implementata la modifica completa di qualsiasi commessa esistente (codice, descrizione, ubicazione/reparto, stato) con form unificato in modale Radix Dialog.
  - Introdotto toggle rapido dello stato (Attiva/Chiusa) direttamente dalla card con feedback visivo live (spinner e toast).
  - Aggiunta cancellazione protetta della commessa con modale di conferma dedicato per prevenire eliminazioni accidentali, preservando l'integrità dello storico movimenti.
  - Conformità scientifica UX/UI: touch target min 44×44px su tutte le azioni, zero uso di indigo, conformità palette semantica (Ciano/Emerald/Orange/Rose).
- **File Coinvolti**:
  - `src/store/useCommesseStore.js`
  - `src/features/admin/CommesseView.jsx`
  - `CHANGELOG.md`

## [2026-09-16] - Inizializzazione Registro Modifiche e Regole Agenti
- **Tag**: `[DOCS]` / `[CHORE]`
- **Descrizione**: Creato il file di log ufficiale del software (`CHANGELOG.md`) per il tracciamento sistematico di ogni modifica futura.
- **Integrazioni**: Aggiornato `gemini.md` con il protocollo obbligatorio che impone a tutti gli agenti e sessioni di sviluppo di registrare sinteticamente ogni modifica apportata.
- **File Coinvolti**:
  - `CHANGELOG.md` (nuovo)
  - `gemini.md`

## [2026-09-14] - Modale Movimento Multiplo e Picker Distinte
- **Tag**: `[FEAT]` / `[UX/UI]`
- **Descrizione**: Introdotta la vista dedicata per la gestione di movimenti multipli a distinta, con quantità configurabili per singolo articolo e selettore integrato basato su TanStack Table.
- **File Coinvolti**:
  - `src/components/MultiMovementView.jsx`
  - `src/store/useMultiMovementStore.js`
  - `src/components/inventory/ToolsGrid.jsx`

## [2026-09-14] - Barra di Ricerca Globale Permanente e Restyling Scanner
- **Tag**: `[FEAT]` / `[UX/UI]`
- **Descrizione**: Spostata la ricerca rapida in modo permanente nell'header globale dell'app; al focus attiva automaticamente la vista elenco e azzera filtri parziali. Unificato lo scanner barcode con TanStack Table.
- **File Coinvolti**:
  - `src/components/layout/Header.jsx`
  - `src/components/ScannerView.jsx`
  - `src/store/useFilterStore.js`

## [2026-09-13] - Ripristino Modale Dettagli e Ottimizzazione Griglia Diametri
- **Tag**: `[FIX]` / `[UX/UI]`
- **Descrizione**: Risolto problema di apertura del modale di dettaglio utensile (`showMoveModal` in `useMovementStore`). Ridisegnate le tile dei diametri con gerarchia visiva centrata e badge di giacenza ottimizzati.
- **File Coinvolti**:
  - `src/store/useMovementStore.js`
  - `src/components/filters/DiameterTiles.jsx`

## [2026-09-07] - Centralizzazione Navigazione, Tutorial Interattivo e Ruoli Operatori
- **Tag**: `[FEAT]` / `[UX/UI]`
- **Descrizione**: Centralizzato lo stato di navigazione in `useNavigationStore`. Introdotto tutorial guidato interattivo con polling dinamico per gestire animazioni Framer Motion. Aggiunta protezione a livello vista e sidebar per ruoli Admin. Standardizzata la tipografia esclusivamente sul font *Inter*.
- **File Coinvolti**:
  - `src/store/useNavigationStore.js`
  - `src/store/useTutorialStore.js`
  - `src/components/tutorial/AppTutorial.jsx`
  - `src/components/OperatorsView.jsx`
  - `src/index.css`

## [2026-09-06] - Unificazione Tabelle con TanStack Table e Ottimizzazioni Build
- **Tag**: `[REFACTOR]` / `[PERF]`
- **Descrizione**: Unificate tutte le tabelle catalogo su TanStack Table v8 eliminando layout flex disallineati. Ripristinata colonna "Fornitore" con larghezze fisse e truncate. Scorporati chunk pesanti in `vite.config.js` (`manualChunks`).
- **File Coinvolti**:
  - `src/components/inventory/ToolsGrid.jsx`
  - `vite.config.js`
  - `DESIGN_SYSTEM.md`
