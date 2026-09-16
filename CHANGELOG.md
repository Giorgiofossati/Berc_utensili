# 📝 Registro Modifiche Software (Changelog / Log)

Questo file tiene traccia in ordine cronologico inverso di tutte le implementazioni, correzioni di bug, modifiche grafiche e refactoring architetturali apportati all'applicazione **Bercella Utensili**.

---

> [!IMPORTANT]
> **REQUISITO TASSATIVO PER GLI AGENTI AI E GLI SVILUPPATORI**:
> Al termine di ogni sessione di sviluppo o implementazione conclusa con successo, **è obbligatorio aggiungere una nuova voce in cima a questo file**, riassumendo in modo sintetico e puntuale le novità introdotte.

### 📌 Linee Guida per la Compilazione
1. **Posizione**: Aggiungere il nuovo blocco sempre sotto la riga divisoria successiva, in cima alla cronologia.
2. **Formato Data**: `[YYYY-MM-DD]` (es. `[2026-09-16]`).
3. **Tag di Intervento**:
   - `[FEAT]`: Nuova funzionalità o vista.
   - `[FIX]`: Correzione di bug o anomalie.
   - `[UX/UI]`: Migliorie a layout, design system, usabilità o accessibilità.
   - `[REFACTOR]`: Riorganizzazione del codice o hook senza cambi funzionali esterni.
   - `[PERF]`: Ottimizzazioni di prestazioni (bundle, caricamento, query).
   - `[DOCS]`: Aggiornamenti alla documentazione o regole di sistema.
4. **Brevità**: Utilizzare elenchi puntati concisi (2-4 punti chiave) indicando i file principali modificati e l'impatto.

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
