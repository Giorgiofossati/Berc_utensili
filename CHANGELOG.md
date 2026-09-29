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
### [2026-09-30] - Diagramma Sankey: Schermo Intero, Spazio Massimizzato e Standard Numerico Industriale (Virgola e Spazio Migliaia)
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Modalità a Schermo Intero con Tasto Esc (`CostSankeyCard.jsx`)**: Aggiunto pulsante `Schermo intero` (`Maximize2`) nell'header della card che espande il diagramma di flusso a tutto schermo con viewport dinamico (`h-screen w-screen`) e backdrop ad alta trasparenza. Aggiunto pulsante di uscita `Esci da tutto schermo (Esc)` (`Minimize2`) e ascoltatore tastiera `Esc` per uscita rapida.
  - **Riorganizzazione Layout e Massimizzazione Spazio**: Espanso il Sankey a piena larghezza (`w-full`) sia in `CostAnalysisView` che in `ManagerDashboardView`, raddoppiando lo spazio orizzontale per i nastri di flusso. Nella dashboard direzionale, le schede "Top 6 Categorie" e "Navigazione Analitica" sono state riposizionate ordinatamente in una griglia sottostante a 2 colonne bilanciate. Aumentata l'altezza standard del diagramma a 480px (con margini laterali ottimizzati a 115px) per eliminare qualsiasi sovrapposizione testuale.
  - **Standard Numerico Industriale Bercella (`src/lib/utils.js`)**: Create le funzioni di formattazione `formatItalianCurrency` e `formatItalianNumber` che rispettano rigorosamente la convenzione industriale richiesta: virgola per i decimali (es. `14 520,00 €`), spazio come separatore delle migliaia (es. `1 250 pz`), e nessun punto per le migliaia. Applicato a tutti i valori monetari, percentuali (`24,5%`) e quantità fisiche nei nodi, nei nastri, nei tooltip e nelle statistiche di sintesi.
- **File coinvolti**:
  - [`src/lib/utils.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/lib/utils.js)
  - [`src/components/charts/SankeyChart.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/charts/SankeyChart.jsx)
  - [`src/features/manager/components/CostSankeyCard.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/manager/components/CostSankeyCard.jsx)
  - [`src/features/manager/CostAnalysisView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/manager/CostAnalysisView.jsx)
  - [`src/features/manager/ManagerDashboardView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/manager/ManagerDashboardView.jsx)
  - [`CHANGELOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/CHANGELOG.md)

### [2026-09-30] - Tabella Inventario: Rimozione Ingrandimento Riga su Hover per Allineamento Divisori Verticali
- **Tag**: `[UX/UI]` / `[FIX]`
- **Descrizione**:
  - **Eliminazione Shift Visivo Divisori di Colonna**: Rimosso il `hover:scale-[1.008]` in `VirtualizedTable.jsx` che, ingrandendo l'intera riga al passaggio del cursore, provocava lo slittamento orizzontale delle linee verticali divisorie rispetto all'header e alle righe adiacenti.
  - **Evidenziazione Fluida e Statica**: L'effetto hover è ora gestito con una delicata transizione di colore dello sfondo (`transition-colors duration-100 hover:bg-sky-50/70 dark:hover:bg-sky-950/40`), mantenendo la griglia stile Excel perfettamente ferma, allineata e priva di vibrazioni o salti di layout.
- **File coinvolti**:
  - [`src/components/common/DataTable/VirtualizedTable.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/DataTable/VirtualizedTable.jsx)
  - [`CHANGELOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/CHANGELOG.md)

### [2026-09-30] - Diagramma Sankey: Ripartizione Costi e Valore per Tipologie Utensili nell'Area Manager
- **Tag**: `[FEAT]` / `[UX/UI]`
- **Descrizione**:
  - **Componente Sankey SVG Puro e Reattivo (`SankeyChart.jsx`)**: Sviluppato motore grafico Sankey nativo a zero dipendenze esterne, ultra-leggero (~5 kB gzipped), compatibile al 100% con React 19, Tailwind v4 e PWA. Include gradienti cromatici da sorgente a destinazione, nastri Bézier proporzionali, evidenziazione dinamica dei percorsi al passaggio del mouse e tooltip interattivo con dettagli di flusso, quota percentuale e pezzi.
  - **Card Analitica Flussi Utensileria (`CostSankeyCard.jsx`)**: Creata card per l'Area Manager con controllo a segmenti per alternare tre modalità di ripartizione: *Tipologia ➔ Forma/Geometria*, *Tipologia ➔ Stato Giacenze* (Regolare, Sottoscorta, Esaurito), e *Tipologia ➔ Fascia Prezzo*. Include statistiche di sintesi (categoria principale e capitale a rischio) e interattività bidirezionale (il click su una tipologia applica il filtro).
  - **Integrazione in `CostAnalysisView` e `ManagerDashboardView`**: Integrata la visualizzazione Sankey come hero analitico in testa all'Analisi Costi e aggiunta opzione con toggle (*Diagramma Sankey* / *Classifica a barre*) nella Dashboard Direzionale Manager. Conforme al 100% alle linee guida di design Bercella (zero indigo, contrasti WCAG, tipografia conforme).
- **File coinvolti**:
  - [`src/components/charts/SankeyChart.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/charts/SankeyChart.jsx)
  - [`src/features/manager/components/CostSankeyCard.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/manager/components/CostSankeyCard.jsx)
  - [`src/features/manager/CostAnalysisView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/manager/CostAnalysisView.jsx)
  - [`src/features/manager/ManagerDashboardView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/manager/ManagerDashboardView.jsx)
  - [`CHANGELOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/CHANGELOG.md)

### [2026-09-30] - Inventario: Vista Tabella Dati di Default per Tutti e Colonne Ottimizzate con Divisori Excel
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Vista Lista/Tabella di Default per Tutti gli Utenti**: Impostata la vista a elenco/tabella (`dropdown`) come vista iniziale predefinita per qualsiasi account (non solo Admin) in `useFilterStore`, `useAuthStore` e `UserSettingsModal`. Le preferenze personali salvate esplicitamente nelle impostazioni utente continuano a essere rispettate.
  - **Ridistribuzione Ottimale Colonne Tabella Inventario**:
    - Assegnato maggiore spazio alla colonna `Descrizione` (`flex: 3.5`, `minWidth: 200px`), consentendo la lettura completa delle descrizioni lunghe di frese, punte e maschi senza troncature premature. Aggiunto anche il tooltip nativo `title` al testo.
    - Calibrate con `maxWidth` e `minWidth` dedicate le colonne secondarie (`Codice Aziendale` 120-155px, `Codice Fornitore` 135-185px, `Ubicazione` 105-145px, `Stato` 85-105px, `Prezzo Unit.` 90-115px, `Giacenza` 75-90px) per evitare dispersioni di spazio bianco vuoto su schermi grandi.
  - **Divisori Verticali Stile Excel**: Introdotto il supporto e lo stile per sottili divisori verticali di colonna in `VirtualizedTable` (`showDividers={true}`), con celle estese a piena altezza riga (`items-stretch` / `self-stretch`) e colori calibrati per Light e Dark mode (`border-slate-200/50` / `dark:border-slate-800/60`).
- **File coinvolti**:
  - [`src/store/useFilterStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/useFilterStore.js)
  - [`src/store/useAuthStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/useAuthStore.js)
  - [`src/features/auth/UserSettingsModal.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/UserSettingsModal.jsx)
  - [`src/components/common/DataTable/VirtualizedTable.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/DataTable/VirtualizedTable.jsx)
  - [`src/features/inventory/ToolsGrid.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolsGrid.jsx)
  - [`CHANGELOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/CHANGELOG.md)

### [2026-09-30] - Login: Spostamento "Come Funziona?" nel Footer e Visibilità Permanente di Logo e Titolo Officina 4.0
- **Tag**: `[UX/UI]` / `[LAYOUT]`
- **Descrizione**:
  - **Spostamento "Come Funziona?" nel Footer della Card**: Rimosso il pulsante informativo dall'header (dove creava congestione con il marchio) e riposizionato con rilievo ed eleganza nel footer del pannello di login (`Come funziona? Scopri funzionalità e vantaggi ✨`), garantendogli piena visibilità senza togliere spazio al branding.
  - **Visibilità Permanente 100% di Logo e Titoli**: L'header è ora interamente dedicato all'identità istituzionale: il Logo Bercella, il divisore verticale e il blocco *Officina 4.0 - Gestione Utensili CNC* sono sempre tutti visibili contemporaneamente su smartphone, tablet e desktop, senza troncature o classi di nascondimento.
- **File coinvolti**:
  - [`src/features/auth/LoginScreen.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/LoginScreen.jsx)
  - [`CHANGELOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/CHANGELOG.md)

### [2026-09-30] - Login: Raddoppio Finale Logo Hero Bercella e Card Operatore a Riga Singola (Zero Wrapping)
- **Tag**: `[UX/UI]` / `[FIX]`
- **Descrizione**:
  - **Logo Bercella Raddoppiato Ulteriormente**: Portata l'altezza del logo a `h-28 sm:h-36 md:h-44 lg:h-52` (fino a 208px di altezza), rendendolo un vero e proprio hero badge monumentale ed elegante con padding e proporzioni calibrati (`max-w-[220px] sm:max-w-none`).
  - **Nomi e ID Rigorosamente su Riga Singola (Zero Wrapping)**: 
    - Ottimizzata la griglia card a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (al posto delle 4 colonne strette): su mobile ogni riga è ampia e spaziosa, eliminando ogni accavallamento.
    - Applicato `whitespace-nowrap truncate` sia sul Nome Operatore (`text-sm sm:text-base font-bold`) sia sull'ID Badge (`text-xs font-mono`), garantendo che stiano rigorosamente su una sola riga senza andare a capo.
    - Riorganizzato il layout interno della card con `flex items-center justify-between` e badge di sicurezza (`[🔒 Admin]` / `[🔒 Manager]`) allineato a destra.
  - **Sostituzione Z-Index Arbitrari in DropdownFilterView**: Corretti z-index non standard (`z-[90]`, `z-[100]`, `z-[110]`) con i token ufficiali del Design System (`z-[var(--z-drawer)]`, `z-[var(--z-dialog)]`, `z-[var(--z-popover)]`).
- **File coinvolti**:
  - [`src/features/auth/LoginScreen.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/LoginScreen.jsx)
  - [`src/features/filters/DropdownFilterView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/filters/DropdownFilterView.jsx)
  - [`CHANGELOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/CHANGELOG.md)

### [2026-09-30] - Miglioramento Gestione Filtri Inventario Lista
- **Tag**: `[UX/UI]` / `[FEAT]`
- Aggiunto "Ubicazione" alla barra dei filtri fissi.
- Corretta tipografia filtri mobile e desktop: applicato `capitalize` (prima lettera maiuscola per tutti i filtri) e font ridotto a `text-xs` per una UI più pulita ed evitare overflow.
- Spostato il pulsante "Tutti i Filtri" sulla parte sinistra della toolbar desktop.
- Introdotto drawer laterale per filtri su desktop: il pannello ora si apre **sulla sinistra integrandosi a fianco della tabella** (push layout stile e-commerce).

### [2026-09-29] - Supporto Lucchetto e Password per Ruolo Manager (Rocco Bercella) e Allineamento Gestione Utenti
- **Tag**: `[FIX]` / `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Identificazione Ruolo Protetto da Password**: Il login verificava la presenza del lucchetto con `u.ruolo === 'Admin'`, escludendo il ruolo `Manager` (come Rocco Bercella che ha password e accesso alla dashboard economica/costi). Implementata la funzione `requiresPassword(u)` che copre sia `Admin` che `Manager`.
  - **Badge e Lucchetto Dinamici su Card Operatore**: Mostrato badge dedicato con icona lucchetto: `[🔒 Admin]` in ambra industriale per gli amministratori e `[🔒 Manager]` in sky blue per i manager. Gli account `Operatore` mantengono l'accesso immediato a 1-click senza lucchetto.
  - **Form di Autenticazione Password Dinamico**: Il modale di inserimento password ora mostra dinamicamente il ruolo corretto (`Manager` o `Amministratore`), etichetta appropriata (*"Password Manager"* o *"Password Amministratore"*) e placeholder contestuale.
  - **Supporto Password Manager in OperatorsView**: Esteso [`OperatorsView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/OperatorsView.jsx) affinché il campo password sia visibile, validato e salvato correttamente sia per gli Admin sia per i Manager, evitando che la password venga azzerata al salvataggio.
- **File coinvolti**:
  - [`src/features/auth/LoginScreen.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/LoginScreen.jsx)
  - [`src/features/admin/OperatorsView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/OperatorsView.jsx)
  - [`CHANGELOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/CHANGELOG.md)

### [2026-09-29] - Refinement Login: Micro-Stepper Fisso e Tutto Visibile (No Scroll), Rimozione B1 e Pulizia Subtitle
- **Tag**: `[UX/UI]` / `[FIX]`
- **Descrizione**:
  - **Micro-Stepper Fisso e Sempre Visibile (No Scroll)**: Eliminato lo scroll orizzontale su mobile. Il micro-stepper è ora rigidamente fisso su una griglia a 3 colonne (`grid-cols-3`), garantendo che tutte e 3 le fasi (`1. Identificati`, `2. Sfoglia catalogo`, `3. Preleva, Deposita o Gestisci`) siano sempre visibili al 100% su qualsiasi dispositivo e risoluzione senza richiedere alcuno scorrimento o gesto touch.
  - **Eliminazione Completa Telemetria B1**: Rimosso totalmente il chip `Sincronizzato B1` / `TERMINALE OFFICINA` sia da desktop che da mobile per alleggerire l'header e dare massimo respiro visivo al logo Hero.
  - **Pulizia Subtitle Operatore**: Rimossa completamente la scritta/pulsante "scopri di più" sotto *Identificazione Operatore*, mantenendo unicamente il sottotitolo operativo pulito e privo di distrazioni.
- **File coinvolti**:
  - [`src/features/auth/LoginScreen.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/LoginScreen.jsx)
  - [`CHANGELOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/CHANGELOG.md)

### [2026-09-29] - Risoluzione Sparizione Tutorial su Mobile, Stacking Context e Spotlight Intelligente
- **Tag**: `[FIX]` / `[UX/UI]`
- **Descrizione**:
  - **Stacking Context Globale (Fix Sparizione sotto Drawer)**: Spostato `<AppTutorial />` al livello radice di `App.jsx`, liberandolo dalla trappola di isolamento (`div.isolate`) che faceva finire la card e la guida dietro al drawer della sidebar mobile e al suo backdrop (`z-drawer`).
  - **Soppressione Backdrop Conflittuale Mobile**: Disattivato il backdrop oscurante di default della sidebar mobile quando il tutorial è attivo (`!isTutorialOpen`), affidando il focus interamente alla maschera spotlight SVG di `AppTutorial` ed evitando che tocchi accidentali chiudano la barra laterale facendo sparire l'elemento evidenziato.
  - **Rilevamento Bersagli Visibili (`querySelectorAll`)**: Refattorizzato `updateTargetRect` in `AppTutorial.jsx` per scansionare tutti i nodi e ignorare elementi con `display: none` o `0x0px`. Questo ha ripristinato l'evidenziazione di `data-tour="search-tools"` sul pulsante lente mobile e di `data-tour="view-mode-toggle"` sul toggle visibile su mobile (`md:hidden`).
  - **Posizionamento Adattivo Card su Schermi Touch**: Implementato `getMobileCardPosition` con inversione automatica in alto (`top: env(safe-area-inset-top)`) quando il bersaglio si trova nella metà inferiore (es. Storico, Guida e Profilo utente), prevenendo sovrapposizioni e coperture visive. Aggiunto scroll dolce automatico (`scrollIntoView`) per portare in vista voci della barra laterale fuori schermo.
- **File coinvolti**:
  - [`src/App.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/App.jsx)
  - [`src/components/common/AppTutorial.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/AppTutorial.jsx)
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)
  - [`src/components/layout/PageTemplate.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/PageTemplate.jsx)
  - [`src/store/useTutorialStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/useTutorialStore.js)
  - [`CHANGELOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/CHANGELOG.md)

### [2026-09-29] - Raddoppio Logo Hero Bercella, Aggiornamento Micro-Stepper (Catalogo/Gestisci) con Navigazione Mobile e Callout Curiosità Info
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Logo Bercella Raddoppiato**: Incrementata l'altezza del logo orizzontale a `h-16 sm:h-20 md:h-24 lg:h-28` (almeno il doppio rispetto a prima), esaltando l'identità del brand e rendendolo l'elemento visivo dominante dell'header su ogni risoluzione.
  - **Aggiornamento Copy Micro-Stepper**: Modificati i passaggi in `1. Identificati` → `2. Sfoglia catalogo` → `3. Preleva, Deposita o Gestisci`.
  - **Micro-Stepper Scrollabile con Barra di Navigazione Mobile**: Reso il container dello stepper scorrevole orizzontalmente con snap touch (`snap-x touch-pan-x`) su schermi compatti, con barra di avanzamento visiva dedicata a 3 segmenti e indicatore guidato per la consultazione dei passaggi.
  - **Inviti alla Lettura della Guida ("Come funziona? • Scopri vantaggi")**: Sostituito il pulsante anonimo con un elemento informativo cliccabile nell'header (`Come funziona? Funzionalità & Vantaggi ✨`), integrato un pulsante-teaser contestuale sotto il sottotitolo operativo (*"Nuovo dell'officina? Clicca qui per scoprire funzionalità e vantaggi"*) e un link di approfondimento nel footer.
- **File coinvolti**:
  - [`src/features/auth/LoginScreen.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/LoginScreen.jsx)
  - [`CHANGELOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/CHANGELOG.md)

### [2026-09-29] - Ottimizzazione Cognitiva Login, Micro-Stepper Operativo, Telemetria Macchina e Installazione PWA 1-Click
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Sottotitolo Operativo Diretto**: Aggiunto sotto *Identificazione Operatore* il copy chiaro e immediato *"Tocca il tuo profilo per registrare prelievi, depositi o verificare la disponibilità delle frese a magazzino."* per orientare istantaneamente qualsiasi operatore.
  - **Micro-Stepper di Flusso in 3 Fasi**: Implementato percorso visivo (`1. Identificati` → `2. Cerca o Barcode` → `3. Preleva o Deposita`) sopra la lista operatori per spiegare graficamente la sequenza d'azione senza caricare la mente dell'utente.
  - **Telemetria Macchina B1**: Inserito nell'header il chip di stato live `● Sincronizzato B1 • TERMINALE OFFICINA` (con versione compatta `● B1` su mobile) per dare rassicurazione immediata sulla sincronizzazione in tempo reale.
  - **Modale Guida & Valore Sistema (Radix Dialog)**: Implementato il modale di approfondimento attivabile dal tasto info che espone fedelmente i 5 cardini di valore approvati (*Inventario intelligente, Zero fermi Macchina, Gestione scorte, Gestione Rapida, Gestione costi*).
  - **Installazione WebApp PWA a 1-Click (Desktop & Mobile)**: Esteso [`usePwaStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/usePwaStore.js) con intercettazione nativa di `beforeinstallprompt` (Chromium desktop/Android) e supporto guidato per iOS Safari con modale in 2 passaggi, abilitando l'installazione PWA con un singolo tap dall'header del login.
- **File coinvolti**:
  - [`src/features/auth/LoginScreen.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/LoginScreen.jsx)
  - [`src/store/usePwaStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/usePwaStore.js)
  - [`src/index.css`](file:///Users/gio/Documents/CODING/Berc_utensili/src/index.css)
  - [`public/logo-bercella_orizzontale_white.png`](file:///Users/gio/Documents/CODING/Berc_utensili/public/logo-bercella_orizzontale_white.png)

### [2026-09-29] - Inserimento Massivo Prezzi d'Acquisto da Storico Ordini Excel & Visualizzazione Frontend
- **Tag**: `[FEAT]` / `[FIX]` / `[PERF]`
- **Descrizione**:
  - **Parsing ed Estrapolazione da Ordini Storici (2023-2026)**: Analizzati tutti i fogli dell'archivio ordini aziendale Excel (`Inserimento ordini 2026`, `2025`, `2024`, `2023`, `richieste offerte`, `Codici Utensili`), estraendo oltre 1.280 prezzi d'acquisto unitari effettivi confermati (`prezzo cad.`) al netto di IVA.
  - **Incrocio & Valorizzazione Inventario (`Utensili_B1`)**: Elaborato matching intelligente incrociando `Codice` BRCL (sia formato breve che esteso `BRCL0004...`), matricole/codici fornitore (`Serial Number`) e i 26 prezzi certificati dal Report Ducati del 28/09.
  - **Aggiornamento Database Supabase**: Valorizzati con successo **217 utensili reali** con prezzo effettivo (copertura 100% per `CASS.DUCATI`, `CASS.DUCATI 27`, `DUCATI`, `CASS.OPERCOLI CHIAVI`, oltre il 74% su `IR27` e `OPERCOLI`, e decine di articoli in tutto il magazzino). Valore totale inventario prezzato: **€ 105.919,42**.
  - **Fix Visualizzazione Localhost & Invalidazione Cache Offline**: 
    - Rilevato che la stored procedure Postgres `get_tools_catalog()` escludeva la colonna `"Prezzo"`: corretto [`useInventoryStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/useInventoryStore.js) con verifica selettiva e fallback con `.select('*')` completo.
    - Incrementato `DB_VERSION = 2` in [`catalogCache.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/lib/catalogCache.js) con invalidazione automatica della vecchia cache IndexedDB locale priva del prezzo.
    - Aggiunta colonna visibile `Prezzo Unit.` in [`ToolsGrid.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolsGrid.jsx) (su desktop/tablet) e badge con stato tagliente/prezzo in [`ToolDetailDrawer.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolDetailDrawer.jsx).
- **File coinvolti**:
  - [`scripts/match_excel_prices.py`](file:///Users/gio/Documents/CODING/Berc_utensili/scripts/match_excel_prices.py)
  - [`scripts/update_all_inventory_prices.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/scripts/update_all_inventory_prices.sql)
  - [`src/lib/catalogCache.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/lib/catalogCache.js)
  - [`src/store/useInventoryStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/useInventoryStore.js)
  - [`src/features/inventory/ToolsGrid.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolsGrid.jsx)
  - [`src/features/inventory/ToolDetailDrawer.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolDetailDrawer.jsx)
  - [`src/features/manager/CostAnalysisView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/manager/CostAnalysisView.jsx)
  - [`src/features/manager/ManagerDashboardView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/manager/ManagerDashboardView.jsx)

### [2026-09-29] - Integrazione Logo Ufficiale Orizzontale Bercella (Hero Size & Dark Mode Invertita) & Refactoring Login
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Generazione Versione Dark Mode Invertita del Logo**: Generato il nuovo asset ad alta risoluzione [`public/logo-bercella_orizzontale_white.png`](file:///Users/gio/Documents/CODING/Berc_utensili/public/logo-bercella_orizzontale_white.png) tramite elaborazione della palette PNG e canale `tRNS`. Il wordmark `"BERCELLA"` e l'emblema circolare sono in bianco pieno `#ffffff`, il ritaglio della lettera `"B"` è trasparente (lasciando intravedere la tonalità scura sottostante) e l'ala d'ombra è sfumata in tonalità slate.
  - **Hero Branding Dimensionale**: Il logo è stato ingrandito considerevolmente (`h-9 sm:h-12 md:h-14 lg:h-16`) passando da elemento secondario a fulcro distintivo dell'identità visiva della pagina di login, con resa fluida e responsive per smartphone, tablet e monitor touch d'officina.
  - **Switch Automatico Light/Dark Mode**: Utilizzo nativo di `dark:hidden` e `hidden dark:block` per mostrare il logo blu navy originale su sfondi chiari e la versione bianca invertita su sfondi scuri, senza cornici o box artificiali.
  - **Rimozione Effetto Glass sul Pannello di Login**: Sostituito `glass-panel` con una superficie opaca solida (`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl`), eliminando l'effetto smerigliato/trasparente per una resa più nitida, pulita e conforme agli standard industriali di visibilità.
  - **Campi Input & Card Solidi**: Sostituita la classe `glass-input` sui campi di ricerca e password con input solidi a contrasto calibrato (`bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700`), e aggiornate le card operatore con background opaco pulito.
  - **Eliminazione Fuga Monospace (`Geist Mono`)**: Rimossa la classe `.app-caption` (`font-mono`) dai testi operativi (la frase di legenda `"= richiede password"` e la dicitura `"Amministratore"`), ripristinando il corretto impiego semantico di `font-sans` (`Geist`) e riservando il font monospace esclusivamente a codici ID e quantità.
  - **Ereditarietà Tipografica nei Form Controls**: Aggiunta la regola `font-family: inherit` a `button, input, optgroup, select, textarea` in `@layer base` e specificato `font-sans` su tutte le classi utility semantiche (`.app-overline`, `.app-h1`, `.app-h2`, `.app-h3`, `.app-body`, `.app-label`) in [`src/index.css`](file:///Users/gio/Documents/CODING/Berc_utensili/src/index.css).
  - **Ergonomia Card Operatore Touchscreen**: Aumentata l'altezza minima delle card operatore da 68px a 72px (`min-h-[72px]`), ottimizzando i target di tocco per guanti da lavoro e touch monitor d'officina.
  - **Header & Gerarchia Visiva**: Titolo applicazione scalato da `app-h3` a testo semibold/black proporzionato al logo, e overline/heading card normalizzati a `"Accesso Sistema"` / `"Identificazione Operatore"`.
- **File coinvolti**:
  - [`public/logo-bercella_orizzontale_white.png`](file:///Users/gio/Documents/CODING/Berc_utensili/public/logo-bercella_orizzontale_white.png) *(nuovo asset generato)*
  - [`src/features/auth/LoginScreen.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/LoginScreen.jsx)
  - [`src/features/inventory/ToolDetailDrawer.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolDetailDrawer.jsx)
  - [`src/index.css`](file:///Users/gio/Documents/CODING/Berc_utensili/src/index.css)

### [2026-09-29] - Sincronizzazione Prezzi Industriali B2B & Script di Estrazione Listini Hoffmann
- **Tag**: `[FEAT]` / `[PERF]`
- **Descrizione**:
  - **Aggiunta Campo Prezzo Unitario Netto**: Predisposta la colonna `"Prezzo"` (tipo `NUMERIC(10, 2)`) su Supabase per la tabella `Utensili_B1` a valore netto d'acquisto (IVA esclusa).
  - **Script Sincronizzazione Locale Zero-Token**: Realizzato [`scripts/sync_tool_prices.py`](file:///Users/gio/Documents/CODING/Berc_utensili/scripts/sync_tool_prices.py) ad altissima efficienza e verifica rigorosa su Hoffmann Group B2B. Nessun dato inventato o presunto: i codici non verificati al 100% restano non valorizzati (`NULL`).
  - **Generazione Comandi SQL Atomici**: Creato [`scripts/update_prices.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/scripts/update_prices.sql) con i comandi `UPDATE` pronti all'esecuzione per le cassette richieste (DUCATI, CASS.IR27, CASS.JANUS, CASS.OPERCOLI, CASS.SPARKWING).
- **File coinvolti**:
  - [`scripts/sync_tool_prices.py`](file:///Users/gio/Documents/CODING/Berc_utensili/scripts/sync_tool_prices.py) *(nuovo script)*
  - [`scripts/update_prices.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/scripts/update_prices.sql) *(nuovo file comandi)*

### [2026-09-29] - Upgrade Algoritmico Scanner: Motore ZXing-C++ WebAssembly (WASM) 100% Offline
- **Tag**: `[PERF]` / `[FEAT]`
- **Descrizione**:
  - **Sostituzione Motore Algoritmico**: Rimpiazzato il decodificatore software legacy JS (ZXing 2008) con **ZXing-C++20 compilato in WebAssembly (WASM)** con istruzioni SIMD tramite `barcode-detector` e `zxing-wasm`.
  - **Funzionalità Algoritmiche Industriali per Officina**:
    - *Binarizzazione Adattiva Locale (`LocalAverage`)*: elimina i fallimenti da riflessi speculari (glare di luci su superfici metalliche lucide o oliate).
    - *Tolleranza Totale alla Rotazione (`tryRotate: true`)*: scansione istantanea a qualsiasi angolazione (0°, 90°, 180°, 270° o diagonale/inclinata).
    - *Supporto Marcature Laser e Codici Invertiti (`tryInvert: true`)*: decodifica affidabile di codici chiari incisi a laser su metallo scuro o satinato.
    - *Super-campionamento Sub-pixel (`tryHarder: true`)*: decodifica di codici a barre densi, sbiaditi o danneggiati.
  - **Architettura 100% Offline per PWA**: Binario `.wasm` (1 MB uncomp., ~450 kB gzip) servito localmente tramite chunk statico Vite e inserito nel precache del Service Worker PWA (`workbox`), senza alcuna dipendenza da CDN esterne.
- **File coinvolti**:
  - [`src/features/scanner/setupBarcodeDetector.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/scanner/setupBarcodeDetector.js) *(nuovo modulo)*
  - [`src/features/scanner/BarcodeScanner.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/scanner/BarcodeScanner.jsx)
  - `package.json` (`barcode-detector`, `zxing-wasm`)

### [2026-09-29] - Gerarchia Visiva a Livelli di Luminanza (Surface Stacking) & Risoluzione Anti-Pattern "Box-in-a-Box"
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - **Architettura di Luminanza a Due Livelli (Surface Stacking)**: Risolto l'effetto "scatole cinesi piatte" in Dark Mode. Il contenitore principale (Level 1) è ora elevato e più chiaro (`bg-white dark:bg-slate-800/90 border-slate-750`), mentre i riquadri di dettaglio interni (Level 2) sono incassati e più scuri (`bg-slate-50 dark:bg-slate-950/85 border-slate-800 shadow-inner`), creando contrasto volumetrico immediato a colpo d'occhio.
  - **Semplificazione e De-Cluttering Richieste (Cards & Dettaglio)**: In `RichiesteView.jsx`, eliminata la moltiplicazione disordinata di micro-riquadri adiacenti. Accorpati "Chi ha chiesto", "Commessa" e "Macchina" in una striscia di contesto coerente con avatar, pillole semantiche e icone dedicate. Nel modale di dettaglio, raggruppati in Master Containers tematici.
  - **Gerarchia nei Dettagli Utensile (`ToolDetailDrawer.jsx`)**: Applicata la medesima gerarchia di superfici nelle schede tecniche: container di sezione elevati e celle parametriche incassate; risalto cromatico prioritario per l'Ubicazione a Magazzino in badge ambra industriale ad alta visibilità.
- **File coinvolti**:
  - [`src/features/admin/RichiesteView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/RichiesteView.jsx)
  - [`src/features/inventory/ToolDetailDrawer.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolDetailDrawer.jsx)

### [2026-09-29] - Redesign Schermata ErrorBoundary: Da Cerchio Monolitico a Riquadro Card Responsive
- **Tag**: `[UX/UI]`
- **Descrizione**:
  - **Superamento Layout Circolare Anomalo**: Rimosso il vecchio vincolo `sm:rounded-full` che trasformava la finestra di ripristino in un cerchio/ovale sgradevole su schermi desktop e tablet.
  - **Riquadro Card Responsive Standard**: Convertito il contenitore in una card ergonomica (`w-full max-w-lg sm:max-w-xl rounded-2xl sm:rounded-3xl .glass-panel`), con gerarchia visiva calibrata, icona di avviso in badge dedicato e bottoni di azione affiancati su desktop (`sm:flex-row min-h-[44px]`).
  - **Accordion Dettagli Tecnici Pulito**: Console tecnica richiudibile con contrasto elevato, font mono e pulsante di copia rapida dell'errore negli appunti.
- **File coinvolti**:
  - [`src/components/common/ErrorBoundary.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/ErrorBoundary.jsx)

### [2026-09-29] - Fix Invio Richieste Operatore: Risoluzione Crash ErrorBoundary, Race Condition Realtime e Feedback Unambiguo
- **Tag**: `[FIX]` / `[UX/UI]`
- **Descrizione**:
  - **Risoluzione Crash ErrorBoundary su Richieste Senza Commessa/Macchina/Note**: Eliminati tutti i percorsi critici non sicuri con optional chaining in `RichiesteView.jsx` (es. `(r.note || '').toLowerCase().includes(q)`, `resolveCommessa`, `resolveMacchina`), che scatenavano `TypeError: Cannot read properties of undefined (reading 'includes')` causando la schermata di ripristino React ErrorBoundary.
  - **Prevenzione Race Condition Realtime**: Introdotto debounce di 350ms sugli eventi Realtime per sincronizzare gli inserimenti a due fasi (`richieste_movimento` e `richieste_movimento_voci`). In `fetchRichieste`, preservate le voci presenti nello store locale se i dettagli remoti non sono ancora stati consolidati dal backend durante la finestra di scrittura.
  - **Feedback Operativo Chiaro e Reassuring**: Aggiunto stato di caricamento esplicito (`isExecuting`, spinner e testo "Invio richiesta...") che disabilita il pulsante per prevenire doppi click. Notifica toast inequivocabile ("RICHIESTA REGISTRATA CON SUCCESSO [...] in attesa di approvazione dell'Amministratore").
  - **Resilienza Componenti e Modali**: Supportata la prop `onSelectTool` e aggiunto `isOpen` in `AddToolToMultiModal`; reso `ToolIcon` polimorfico (accetta sia `type` testuale che oggetto `tool`).
- **File coinvolti**:
  - [`src/store/useRichiesteStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/useRichiesteStore.js)
  - [`src/store/useMultiMovementStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/useMultiMovementStore.js)
  - [`src/features/admin/RichiesteView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/RichiesteView.jsx)
  - [`src/features/inventory/ToolDetailDrawer.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolDetailDrawer.jsx)
  - [`src/features/inventory/AddToolToMultiModal.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/AddToolToMultiModal.jsx)
  - [`src/lib/toolUtils.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/lib/toolUtils.jsx)

### [2026-09-29] - Potenziamento Scanner Barcode: Accelerazione Hardware, Torcia, Zoom 2x e Feedback Istantaneo
- **Tag**: `[FEAT]` / `[PERF]` / `[UX/UI]`
- **Descrizione**:
  - **Accelerazione Hardware e Risoluzione HD**: Attivato `useBarCodeDetectorIfSupported: true` per decodifica nativa ultra-rapida (15-30ms) tramite GPU/sistema operativo, impostati vincoli video a 1080p ideale (`width: 1920, height: 1080`) con autofocus continuo e frequenza a 12 fps per evitare colli di bottiglia e surriscaldamento CPU sui dispositivi mobili.
  - **Area di Scansione Panoramica (`qrbox`)**: Riconfigurata l'area di scansione (fino al 90% della larghezza / 480px) in formato panoramico 2.5:1 per inquadrare interamente codici 1D lunghi (Code 128 / Code 39) senza tagli laterali accidentali.
  - **Comandi Hardware Rapidi (Torcia & Zoom)**: Aggiunti controlli touch accessibili (`min-h-[44px] min-w-[44px]`) sul mirino:
    - *Torcia (Flash)*: toggle istantaneo per illuminare cassettiere e scaffalature in officina.
    - *Zoom Rapido (1x / 2x)*: toggle per ingrandire etichette e codici piccoli rimanendo alla distanza di fuoco ideale (20cm) senza incorrere in sfocature macro.
  - **Feedback Multimediale e Guida Operativa**:
    - *Bip Sonoro Istantaneo*: generato con Web Audio API sintetico (880Hz/1760Hz), funzionante 100% offline senza caricamenti multimediali.
    - *Flash Visivo e Aptico*: vibrazione aptica combinata a mirino verde smeraldo neon e badge con codice scansionato.
    - *Guida Ergonomica a Schermo*: pillola informativa con distanza ideale (15–25 cm) e suggerimento antisfocatura.
  - **Chiusura Rapida**: Integrato pulsante di chiusura `onClose` sul mirino sia in `ScannerView` sia in `GlobalSearch`.
- **File coinvolti**:
  - [`src/features/scanner/BarcodeScanner.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/scanner/BarcodeScanner.jsx)
  - [`src/features/scanner/ScannerView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/scanner/ScannerView.jsx)
  - [`src/components/layout/GlobalSearch.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/GlobalSearch.jsx)

### [2026-09-29] - Schede Statistiche/KPI Collassabili su Mobile (Default Chiuse) e Compatte su Desktop
- **Tag**: `[UX/UI]` / `[PERF]`
- **Descrizione**:
  - **Mobile First & Spazio Verticale Salvaguardato**: Su schermi mobile (< 768px), le card con le statistiche sono ora raggruppate nel nuovo componente `CollapsibleStatGrid`, impostato con **chiusura predefinita** (`defaultOpenMobile = false`). Viene mostrata solo una barra trigger minimale (`min-h-[40px]`) con contatore e freccia per aprire/chiudere al tocco, liberando il 100% dell'area verticale per liste, filtri e tabelle.
  - **Desktop Meno Invasivo e Altamente Compatto**: Ridisegnato `StatTile`: ridotti i padding (`p-2.5 sm:p-3`), il box icona (`w-7 h-7 sm:w-8 sm:h-8` con icone da 16px), la spaziatura verticale (`mt-1 sm:mt-1.5`) e la tipografia del valore numerico (`text-lg sm:text-xl font-black font-mono` al posto del sovradimensionato `app-qty-lg`), evitando che le statistiche occupino spazio sproporzionato rispetto ai contenuti operativi.
  - **Unificazione su Tutte le Viste con Statistiche**:
    - `HistoryView` (Movimenti di Magazzino): 4 KPI (Totale, Carichi, Scarichi, Operatori) integrati in `CollapsibleStatGrid`.
    - `RichiesteView` (Gestione Richieste): 4 KPI (In Attesa, Prelievi, Depositi, Evase) unificati in `CollapsibleStatGrid`.
    - `CostAnalysisView` (Analisi Costi): 3 KPI (Valore Scorte, Costo Medio, Alto Valore) racchiusi in `CollapsibleStatGrid`.
    - `ManagerDashboardView` (Dashboard Direzione): sostituiti i 4 pannelli hero giganti con `StatTile` compatti in `CollapsibleStatGrid`.
  - **Pulizia Codice**: Rimosso import inutilizzato di `StatTile` in `CommessaAnalysisView`.
- **File coinvolti**:
  - [`src/components/ui/collapsible-stat-grid.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/ui/collapsible-stat-grid.jsx) *(nuovo componente)*
  - [`src/components/ui/stat-tile.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/ui/stat-tile.jsx)
  - [`src/features/admin/HistoryView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/HistoryView.jsx)
  - [`src/features/admin/RichiesteView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/RichiesteView.jsx)
  - [`src/features/manager/CostAnalysisView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/manager/CostAnalysisView.jsx)
  - [`src/features/manager/ManagerDashboardView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/manager/ManagerDashboardView.jsx)
  - [`src/features/manager/CommessaAnalysisView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/manager/CommessaAnalysisView.jsx)

---

## [2026-09-29] - Ottimizzazione Dashboard Manager: Tipografia, Formattazione e Spaziature
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - Sostituite classi CSS custom maiuscole (es. font-extrabold) con i token tipografici semantici previsti dal sistema (`.app-h3`, `.app-body`, `.app-caption`).
  - Rimossi gli stili testuali maiuscoli in `ManagerDashboardView`, `CostAnalysisView` e `CommessaAnalysisView`.
  - Sistemata la formattazione numerica per adottare univocamente lo standard italiano (`new Intl.NumberFormat('it-IT')`), rimuovendo i vecchi arrotondamenti (`.toFixed(2)`) che inserivano erroneamente punti per i decimali.
  - Incrementati e standardizzati padding e spaziature nei pannelli di dashboard per rispettare le regole di ergonomia touch.
- **File Coinvolti**:
  - `src/features/manager/ManagerDashboardView.jsx`
  - `src/features/manager/CostAnalysisView.jsx`
  - `src/features/manager/CommessaAnalysisView.jsx`
  - `CHANGELOG.md`


### [2026-09-29] - Riprogettazione Pagina Richieste (TanStack Table Fullscreen, 4 Info Chiave & Mobile First)
- **Tag**: `[FEAT]` / `[UX/UI]`
- **Descrizione**:
  - **4 Informazioni Chiave a Colpo d'Occhio**: Ristrutturata la presentazione di ciascuna richiesta per evidenziare immediatamente:
    1. *Chi ha chiesto*: Operatore con avatar, nome in evidenza e note operative visibili.
    2. *Per quale Commessa*: Codice commessa in badge, descrizione e cassetto/ubicazione dedicata alla commessa.
    3. *Su quale Macchina*: Centro di lavoro CNC, codice e reparto assegnato.
    4. *Cosa ha chiesto + Ubicazione Magazzino*: Icona utensile, codice, quantità richiesta, disponibilità live e pillola dedicata in risalto con l'**Ubicazione fisica a magazzino** (`📍 Ubicazione: [Scaffale/Cassetto]`).
  - **Mobile First & Zero Scroll Orizzontale**:
    - Su schermi mobile (< 768px), la pagina commuta automaticamente a **Schede Card Responsive**, eliminando l'inutilizzabilità della tabella orizzontale e garantendo lettura fluida e target touch ampi (min 44px).
    - KPI Bar salvaspazio: creata una barra compatta 4-colonne per mobile (~44px di altezza), risparmiando oltre 160px di spazio verticale che soffocava la visualizzazione su smartphone.
  - **Tabella TanStack Table Fullscreen nel suo Container**:
    - Su desktop e tablet, la tabella TanStack Table v8 si estende ora a pieno schermo dentro il proprio container (`p-0 w-full h-full flex flex-col`), eliminando doppie cornici e padding ridondanti.
    - Sticky header sincronizzato e scorrimento confinato all'interno del contenitore dati.
  - **Dual Mode & Switcher Sempre Accessibile**: `SegmentedControl` accessibile sia su desktop sia su smartphone (con icone compatte) per alternare liberamente tra Tabella e Schede in qualunque momento.
  - **Modale Dettaglio Completo & Ricerca Estesa**: Apertura modale con scheda esaustiva al tocco e ricerca globale estesa alle ubicazioni fisiche degli articoli e delle commesse.
- **File coinvolti**:
  - [`src/features/admin/RichiesteView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/RichiesteView.jsx)

---

### [2026-09-29] - Notifica e Ricarica Istantanea Nuova Versione PWA (One-Click Update)
- **Tag**: `[FEAT]` / `[UX/UI]` / `[PERF]`
- **Descrizione**:
  - **PWA Prompt Mode**: Configurato `registerType: 'prompt'` in `vite.config.js` per intercettare i nuovi deploy e permettere l'aggiornamento controllato via `SKIP_WAITING` del Service Worker.
  - **Store Reattivo PWA (`usePwaStore`)**: Centralizzata la gestione del ciclo di vita PWA (`virtual:pwa-register`), inclusi i trigger di verifica immediata al ritorno in primo piano (`visibilitychange`, `focus`) e polling periodico ogni 15 minuti.
  - **Banner Flottante Aggiornamento (`PwaUpdatePrompt`)**: Implementata una notifica floating non intrusiva con pulsante "Aggiorna ora" a 1 click (disponibile sia nella schermata principale sia in `LoginScreen`).
  - **Pulsante Manuale & Badge in Sidebar/Impostazioni**: Aggiunto badge reattivo pulsante sul tasto Impostazioni della Sidebar e integrata la sezione "Aggiornamenti & Versione" in `UserSettingsModal` con verifica manuale della release.
- **File coinvolti**:
  - [`vite.config.js`](file:///Users/gio/Documents/CODING/Berc_utensili/vite.config.js)
  - [`src/store/usePwaStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/usePwaStore.js)
  - [`src/components/common/PwaUpdatePrompt.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/PwaUpdatePrompt.jsx)
  - [`src/main.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/main.jsx)
  - [`src/App.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/App.jsx)
  - [`src/features/auth/LoginScreen.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/LoginScreen.jsx)
  - [`src/features/auth/UserSettingsModal.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/UserSettingsModal.jsx)
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)

---

### [2026-09-29] - Fix Notch/Dynamic Island PWA iPhone 15, Blocco Viewport Desktop e Pulizia Codice
- **Tag**: `[FIX]` / `[UX/UI]`
- **Descrizione**:
  - **Safe Area Top & Menu Mobile**: In `PageHeader` implementato `pt-[env(safe-area-inset-top,0px)]` e altezza dinamica `h-[calc(4rem+env(safe-area-inset-top,0px))]`, posizionando il pulsante hamburger (44×44px) perfettamente al di sotto della Dynamic Island/notch di iPhone 15 in modalità PWA standalone, risolvendo l'impossibilità di cliccare il menu.
  - **Drawer & Mobile Safe Areas**: Applicate le safe-zone (`env(safe-area-inset-*)`) all'header/footer della Sidebar mobile e al `ToolDetailDrawer` per evitare sovrapposizioni con l'Home Indicator e il notch.
  - **Blocco Viewport Desktop & Niente Zoom Involontario**: Rafforzate le regole in `src/index.css` per `html`, `body` e `#root` con `position: fixed; inset: 0; touch-action: manipulation; -webkit-text-size-adjust: 100%`, bloccando l'applicazione alla dimensione esatta della finestra desktop senza panning o rimbalzi.
  - **Prevenzione Auto-Zoom Safari/iOS**: Adeguati i campi di input (`GlobalSearch`, `LoginScreen`) a `text-base md:text-sm` (16px su mobile) per impedire a Safari di zoomare forzatamente l'interfaccia quando si interagisce con la ricerca o il form.
  - **Pulizia Codice & Refactor Sidebar**: Rimosso l'hack invasivo di misurazione DOM con clone a `left: -9999px` e `MutationObserver` in `Sidebar.jsx`, sostituito da una larghezza stabile `w-60` (240px) che previene reflow e distorsioni di layout; rimosso l'uso non valido di `justify-center-safe` in `App.jsx`.
- **File coinvolti**:
  - [`src/components/layout/PageTemplate.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/PageTemplate.jsx)
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)
  - [`src/index.css`](file:///Users/gio/Documents/CODING/Berc_utensili/src/index.css)
  - [`src/App.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/App.jsx)
  - [`src/components/layout/GlobalSearch.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/GlobalSearch.jsx)
  - [`src/features/auth/LoginScreen.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/LoginScreen.jsx)
  - [`src/features/inventory/ToolDetailDrawer.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolDetailDrawer.jsx)

---

### [2026-09-29] - Hardening SQL e Schema Database per Ruoli, Macchine CNC e Richieste
- **Tag**: `[FEAT]` / `[PERF]`
- **Descrizione**:
  - Verificato e perfezionato il file di migrazione [`supabase/migrations/20260928_roles_machines_requests.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/migrations/20260928_roles_machines_requests.sql) tramite Supabase MCP e Advisors (`security`, `performance`).
  - **Deadlock Prevention**: In `evadi_richiesta_movimento` aggiunto il blocco preventivo deterministico e ordinato su `Utensili_B1` (`ORDER BY id FOR UPDATE`) per eliminare il rischio di deadlock concorrenti tra operatori e admin.
  - **Security Advisor**: Aggiunto `SET search_path = public, pg_temp` a tutte le stored procedure `SECURITY DEFINER` e patch di hardening per le funzioni RPC esistenti.
  - **Performance Advisor**: Sostituite le doppie policy RLS permissive su `macchine_cnc` e `richieste_movimento` con regole granulari non sovrapposte; aggiunti indici covering su tutte le foreign key (`movements_history(tool_id)`, `commesse(macchina_id)`, `richieste_movimento`, `ordini(tool_id)`).
  - **Design System Guardrail**: Risolte le violazioni dei token Tailwind per `text-[10px]` sostituendole con i token semantici `app-overline` e `text-xs`.
- **File coinvolti**:
  - [`supabase/migrations/20260928_roles_machines_requests.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/migrations/20260928_roles_machines_requests.sql)
  - [`supabase/MIGRATIONS_LOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/MIGRATIONS_LOG.md)
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)
  - [`src/features/admin/CommesseView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/CommesseView.jsx)
  - [`src/features/admin/MachinesView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/MachinesView.jsx)

---

### [2026-09-29] - Fix Anello di Focus sulla Riga dopo Chiusura Drawer con Esc
- **Tag**: `[FIX]`
- **Descrizione**:
  - Aprendo una riga col mouse e chiudendo il drawer con Esc, il focus resta sulla riga e l'input da tastiera attivava `:focus-visible`, mostrando il bordo di focus.
  - Ora la riga attivata col puntatore viene marcata (`data-pointer-focus`) e l'anello è nascosto; il marcatore si toglie con qualsiasi tasto diverso da Esc o quando il focus va altrove, quindi la navigazione da tastiera mostra ancora l'anello.
- **File coinvolti**:
  - [`src/components/common/DataTable/VirtualizedTable.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/DataTable/VirtualizedTable.jsx)

---

### [2026-09-29] - Sidebar Compatta: Larghezza Minima che Contiene le Scritte
- **Tag**: `[UX/UI]`
- **Descrizione**:
  - La larghezza della sidebar espansa (hover e bloccata) non è più fissa: viene misurata su un clone fuori schermo a `max-content`, quindi è esattamente la minima che contiene l'etichetta più lunga del ruolo corrente senza troncarla (es. Operatore ~251px per "Richiesta Deposito/Prelievo").
  - Ricalcolata al cambio delle voci (ruolo, badge) e al caricamento dei font; il nome utente nel footer è escluso dalla misura (`data-fit-ignore`) e può troncarsi.
  - Alzati i `max-width` dei testi (etichette, bottoni rapidi, brand) per non limitare la misura.
- **File coinvolti**:
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)

---

### [2026-09-29] - Fix Soglia Apertura Sidebar: Apertura Solo su Contatto Diretto
- **Tag**: `[FIX]` / `[UX/UI]`
- **Descrizione**:
  - Rimosso il cuscinetto invisibile di approccio (`-right-4 w-4`) che sporgeva oltre il bordo destro della sidebar collassata, causando aperture indesiderate quando l'utente scorreva la lista vicino al bordo sinistro.
  - Ora la sidebar si apre **solo** quando il puntatore entra fisicamente nell'area dei 68px della barra ad icone. Il buffer di tolleranza perimetrale (24px) resta attivo solo **dopo** l'espansione, per evitare chiusure accidentali.
- **File coinvolti**:
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)

---

### [2026-09-29] - Fix Sidebar che Finiva Sotto l'Header Sticky della Tabella TanStack
- **Tag**: `[FIX]`
- **Descrizione**:
  - La sidebar auto-collassabile, quando espansa su hover, finiva sotto la barra intestazione sticky della tabella TanStack (`z-50`) poiché il suo z-index era inferiore (`z-40`).
  - Risolto aggiungendo `isolate` (CSS `isolation: isolate`) al contenitore principale dell'app in `App.jsx`. Questo crea un nuovo stacking context che confina il `z-50` dell'header tabella all'interno della colonna contenuto, impedendogli di competere con il livello z della sidebar.
- **File coinvolti**:
  - [`src/App.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/App.jsx)

---

### [2026-09-28] - Sidebar Desktop Auto-Collassabile con Animazione Rallentata & Soglia Chiusura Ampliata
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - **Rallentamento Fluido e Morbido delle Animazioni**: Calibrata la durata della transizione di apertura/chiusura da 300ms a 500ms (`duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`) per una decelerazione ancora più vellutata e rilassante. Sincronizzati i testi delle voci, bottoni rapidi e profilo utente a `duration-[350ms]`.
  - **Aumento Threshold Temporale e Spaziale di Chiusura**: Esteso il timeout di grazia da 220ms a 450ms prima di avviare la chiusura all'uscita dal menu. Aggiunto inoltre un buffer invisibile di tolleranza perimetrale di 24px (`-right-6 w-6`) oltre il bordo destro, impedendo chiusure premature o repentine durante lo scorrimento del puntatore.
- **File coinvolti**:
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)

---

### [2026-09-28] - Nuova Favicon e Icona WebApp con Brand "B" Bercella e Fresa CNC Orizzontale
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Identità Visiva Ufficiale con "B" e Fresa CNC Orizzontale**: Vettorizzato il marchio ufficiale Bercella rimuovendo la scritta ed estraendo la sola iconica "B" aerodinamica (con ala posteriore e feritoie orizzontali). Integrata direttamente sotto di essa una fresa a candela CNC (endmill) orizzontale rifinita con gambo conico/Weldon marcato "BERC", 4 eliche elicoidali in ciano elettrico e taglienti frontali.
  - **Pacchetto Completo Favicon & PWA**: Generata la suite completa ad alta risoluzione: `public/favicon.svg` (vettoriale reattivo), `public/favicon.ico` (multi-risoluzione 16/32/48px), `public/icons/apple-touch-icon.png` (180x180), `icon-192x192.png`, `pwa-192x192.png`, `icon-512x512.png` e `pwa-512x512.png` compatibili con i criteri "maskable" di Android/iOS.
  - **Integrazione App & Rimozione Vite SVG**: Sostituito il default `vite.svg` in `index.html` e `vite.config.js`; aggiornati gli header di `Sidebar.jsx` e `LoginScreen.jsx` per mostrare il nuovo logo ufficiale integrato al posto delle icone generiche.
- **File coinvolti**:
  - [`public/favicon.svg`](file:///Users/gio/Documents/CODING/Berc_utensili/public/favicon.svg)
  - [`public/favicon.ico`](file:///Users/gio/Documents/CODING/Berc_utensili/public/favicon.ico)
  - [`public/icons/apple-touch-icon.png`](file:///Users/gio/Documents/CODING/Berc_utensili/public/icons/apple-touch-icon.png)
  - [`public/icons/pwa-192x192.png`](file:///Users/gio/Documents/CODING/Berc_utensili/public/icons/pwa-192x192.png)
  - [`public/icons/pwa-512x512.png`](file:///Users/gio/Documents/CODING/Berc_utensili/public/icons/pwa-512x512.png)
  - [`index.html`](file:///Users/gio/Documents/CODING/Berc_utensili/index.html)
  - [`vite.config.js`](file:///Users/gio/Documents/CODING/Berc_utensili/vite.config.js)
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)
  - [`src/features/auth/LoginScreen.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/auth/LoginScreen.jsx)

### [2026-09-28] - Sidebar Desktop Auto-Collassabile con Animazione Dolce & Fluida (Hover/Approach)
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Auto-Espansione & Chiusura su Hover (Zero Layout Shift)**: Implementato il collasso automatico su desktop: la sidebar parte compatta ad icone (68px). Quando l'operatore si avvicina al bordo sinistro / passa sopra il menu, si apre fluidamente a 272px in overlay con ombra morbida (`shadow-2xl`) senza causare sfarfallii o scatti sul contenuto dell'app. Quando il puntatore si allontana oltre i suoi confini, dopo una finestra di grazia (220ms contro chiusure accidentali), il menu si richiude dolcemente.
  - **Animazione Dolce e Continua (Cubic-Bezier Easing & Zero DOM Remount)**: Eliminato lo switch netto tra JSX collassato ed espanso; unificata la struttura dei componenti `NavItem`, azioni rapide (Deposita/Preleva/Nuovo) e profilo utente con transizioni progressive di opacità, larghezza e traslazione `cubic-bezier(0.16, 1, 0.3, 1)`.
  - **Tasto Pin & Accessibilità Completa**: Aggiunto pulsante di blocco/sblocco ("Fissa menu aperto" / "Auto-collassa") nell'header con persistenza in `localStorage`. Integrazione accessibilità tastiera (`focus-within` automatico) e compatibilità con il tutorial guidato quando richiede i target della sidebar.
- **File coinvolti**:
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)
  - [`src/store/useNavigationStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/useNavigationStore.js)

---

### [2026-09-28] - Miglioramento Contrasto Hover Righe Tabella & Floating Lens a Frame Contenuto
- **Tag**: `[UX/UI]` / `[FIX]`
- **Descrizione**:
  - **Differenziazione Cromatica Hover vs Header Colonne**: Sostituito il precedente sfondo hover scuro (`slate-800/95`) — che si confondeva con la barra fissa dei nomi colonna — con una sfumatura pulita azzurro/ciano (`hover:bg-sky-50/80 dark:hover:bg-sky-900/35`), rimozione totale del bordo perimetrale e rimozione dell'ombra asimmetrica inferiore per un look perfettamente simmetrico, pulito e continuo.
  - **Animazione Floating Lens a Frame Contenuto (Zero Scroll Orizzontale)**: Conservato l'effetto di sollevamento e ingrandimento fluido GPU (`hover:scale-[1.008]`, `transform-gpu`) mantenendo la tabella rigorosamente racchiusa nel suo frame al 100% con `overflow-x-hidden`.
  - **Eliminazione Dot di Selezione nel Menu Sidebar**: Rimossi i puntini circolari per gli elementi attivi in [`Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx), valorizzando il solo riquadro perimetrale.
- **File coinvolti**:
  - [`src/components/common/DataTable/VirtualizedTable.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/DataTable/VirtualizedTable.jsx)
  - [`src/features/inventory/ToolsGrid.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolsGrid.jsx)
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)
  - [`src/App.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/App.jsx)

---

### [2026-09-28] - Revisione Completa Tutorial & Guida Interattiva (Layout, Workflow e Anti-Collisione)
- **Tag**: `[UX/UI]` / `[FEAT]` / `[REFACTOR]`
- **Descrizione**:
  - **Motore di Posizionamento Anti-Collisione & Spotlight Dinamico**: Riscritto completamente il motore di coordinate di `AppTutorial.jsx`. La card si adatta dinamicamente alle dimensioni reali via `ResizeObserver` e al viewport, prevenendo troncature e sovrapposizioni su tutti gli schermi (Desktop 1920/1440, Tablet e Mobile con layout bottom sheet dedicato).
  - **Copertura Completa dei Flussi Operativi (8 Step Guidati)**: Aggiornato `useTutorialStore.js` per illustrare l'intero ecosistema dell'applicazione: 1. Catalogo & Tipologie, 2. Ricerca Rapida & Barcode, 3. Vista Schede o Tabella Dati, 4. Operazioni Rapide (Deposita/Preleva), 5. Movimento Multiplo a Distinta, 6. Commesse, Produzione & Richieste, 7. Storico Movimenti & Audit Log, 8. Guida & Profilo.
  - **Integrazione Anchors `data-tour`**: Introdotti selettori dedicati in `Sidebar.jsx`, `PageHeader`, `ViewModeToggle` e tabelle per agganciare con precisione millimetrica tutti i componenti chiave.
  - **Preservazione dello Stato Utente**: Corretto il bug per cui il completamento o la chiusura del tutorial resettava la vista o i filtri dell'utente; salvataggio e ripristino sicuro di `currentView` e `viewMode`.
- **File coinvolti**:
  - [`src/components/common/AppTutorial.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/AppTutorial.jsx)
  - [`src/store/useTutorialStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/useTutorialStore.js)
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)
  - [`src/components/common/HelpFloatingButton.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/HelpFloatingButton.jsx)
  - [`src/App.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/App.jsx)

---

### [2026-09-28] Refactoring Architetturale Commesse e Macchine
**[UX/UI] [REFACTOR]**
- **Nuovo Layout Dashboard Operativa per Commesse**: Convertita `CommesseView.jsx` in layout a Card Grid (Master) con un Right Drawer laterale ridimensionabile (Detail) per visualizzare gli utensili impegnati.
- **Nuovo Layout Dashboard Operativa per Macchine**: Riscritto interamente `MachinesView.jsx` in modo da condividere lo stesso identico pattern Card Grid + Right Drawer, facilitando il monitoraggio degli utensili in macchina.
- **Rimozione Admin Guard Rigidi**: Rimosso il redirect per gli operatori semplici su Macchine in `App.jsx`, così che tutti gli utenti possano ispezionare gli utensili a bordo macchina. (Le modifiche strutturali restano circoscritte ai soli Admin tramite condizioni UI).
- **File Modificati**: `src/features/admin/CommesseView.jsx`, `src/features/admin/MachinesView.jsx`, `src/App.jsx`.

### [2026-09-28] - Drawer Dettaglio Utensile Ridimensionabile con Maniglia Grip e Default +80px
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Larghezza di Default Incrementata**: Portata la larghezza standard del drawer laterale da 420px a 500px (+80px), offrendo maggiore respiro a titoli, specifiche e griglie tecniche.
  - **Maniglia di Ridimensionamento Ergonomica (Drag Handle)**: Integrata sul bordo sinistro una maniglia a pillola visibile con micro-indicatori touch (`cursor: ew-resize`), che permette il trascinamento fluido della larghezza (range 380px - 1000px).
  - **Persistenza e Ripristino Rapido**: La larghezza personalizzata viene salvata automaticamente in `localStorage` (`berc_tool_detail_drawer_width`); con un doppio click sulla maniglia la larghezza si ripristina istantaneamente al default di 500px.
- **File coinvolti**:
  - [`src/features/inventory/ToolDetailDrawer.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolDetailDrawer.jsx)

---

### [2026-09-28] - Effetto Lente Dinamica Hardware-Accelerated su Righe Tabella
- **Tag**: `[UX/UI]` / `[PERF]`
- **Descrizione**:
  - **Animazione "Floating Lens" a 0ms CPU Overhead**: Implementata una transizione fluida GPU-accelerated (`transform: scale(1.01)`, `transform-gpu`, curve `ease-out 150ms`) che solleva e ingrandisce morbidamente l'intera riga al passaggio del mouse.
  - **Stacking Context & Ombreggiatura Morbida**: Assegnato `hover:z-20`, `hover:shadow-lg` e sfumatura di sfondo (`hover:bg-white dark:hover:bg-slate-800/95`), creando un effetto lente continuo e sfumato durante lo scorrimento del puntatore tra le righe senza layout reflow.
  - **Supporto Accessibilità `prefers-reduced-motion`**: Inserito `hover:scale` nelle media query di riduzione movimento per preservare il comfort visivo degli utenti sensibili alle animazioni.
- **File coinvolti**:
  - [`src/components/common/DataTable/VirtualizedTable.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/DataTable/VirtualizedTable.jsx)
  - [`src/index.css`](file:///Users/gio/Documents/CODING/Berc_utensili/src/index.css)

---

### [2026-09-28] - Spacing Inventario, Respiro Layout e Conformità Contrasti WCAG (Light/Dark)
- **Tag**: `[UX/UI]` / `[PERF]`
- **Descrizione**:
  - **Respiro e Spaziatura Barra Filtri**: Aumentata l'altezza della barra filtri (`h-[50px]`, `py-2`) e dei trigger chip (`h-8 px-3 rounded-lg`, `gap-2.5`), eliminando il senso di schiacciamento visivo tra l'AppBar superiore e la tabella.
  - **Miglioramento Contrasti WCAG 2.1 AA/AAA**: Corretti i rapporti di contrasto colore su entrambi i temi:
    - *Intestazioni Tabella*: Sostituito `text-slate-500` con `text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]` (da 3.7:1 ❌ a 6.2:1 / 8.5:1 ✅).
    - *Giacenza / Quantità*: Ottimizzato verde in tema chiaro da `emerald-600` (3.8:1 ❌) a `emerald-700` (5.2:1 ✅) e `text-slate-500` per stock a 0.
    - *Etichette e Filtri*: Elevato contrasto label "Filtri:" e proprietà su `text-slate-600 dark:text-slate-300` e chip attive bordate ad alta visibilità.
    - *Badge Ubicazione e Stato*: Aumentato il contrasto testo/sfondo per Magazzino (`sky-800`), Macchine (`amber-900`), Nuovo (`emerald-800`) e Usato (`rose-800`).
  - **Preservazione Compattezza Righe**: Mantenuta l'altezza compatta delle righe virtualizzate (44px) per garantire la massima densità informativa richiesta per l'officina.
- **File coinvolti**:
  - [`src/features/filters/DropdownFilterView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/filters/DropdownFilterView.jsx)
  - [`src/features/inventory/ToolsGrid.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolsGrid.jsx)
  - [`src/components/common/DataTable/VirtualizedTable.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/DataTable/VirtualizedTable.jsx)

---

### [2026-09-28] Refactor Tipografico e Pulizia Maiuscole
- **[UX/UI] Migrazione Font**: Sostituito globalmente il font `Inter` con `Geist` (e `Geist Mono`), allineando il progetto alle ultime direttive di design. Aggiornati `index.html`, variabili CSS e documentazione (DESIGN_SYSTEM.md, gemini.md).
- **[UX/UI] Rimozione Maiuscole (Uppercase)**: Eliminato l'uso eccessivo di testi in maiuscolo e rimossa globalmente la classe utility `uppercase` da tutti i componenti React e CSS, migliorando l'estetica e la leggibilità generale dell'app.
- **[REFACTOR] Notifiche**: Convertite le stringhe dei messaggi di notifica (successo/errore) in minuscolo/Title Case per una UX più morbida, mantenendo le formattazioni native solo per codici macchina e SKU.

## [2026-09-28] - Ottimizzazione Filtri Inventario: Barra Intelligente con Filtri Primari e Menu "+ Altri Filtri"
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - **Risoluzione Sbordamento Orizzontale**: implementata l'architettura a filtri primari (`Tipologia`, `Forma`, `Diametro`, `Stato`) sempre visibili sulla barra a 1 riga, eliminando l'overflow forzato di 14 tendine contemporanee.
  - **Menu Intelligente "+ Altri Filtri"**: raggruppati tutti i filtri tecnici secondari (*Materiale, Tolleranza, Passo, Fornitore, Ubicazione, ecc.*) all'interno di un menu accessibile (`Menu` Base UI); quando un filtro secondario viene aggiunto o valorizzato, appare dinamicamente sulla barra con chip attiva e tasto di rimozione rapida `[x]`.
  - **Layout Mobile Ergonomico**: su dispositivi mobili (< md), i filtri si aprono in un pannello a griglia 2 colonne con touch target ergonomici `>= 44px` (WCAG 2.1 AA) e pulsante di reset rapido, evitando qualsiasi scroll orizzontale.
  - **Viewport Collision Guard**: introdotto `collisionPadding={8}` in `SelectContent` (`select.jsx`) per garantire che i popover delle tendine non varchino mai i bordi visibili dello schermo.
- **File coinvolti**:
  - [`src/features/filters/DropdownFilterView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/filters/DropdownFilterView.jsx)
  - [`src/components/ui/select.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/ui/select.jsx)

---

## [2026-09-28] - Audit Tipografico Globale, Allineamento Token e Pulizia Codice Obsoleto
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - **Allineamento Token Font e Pulizia Geist**: rimossa la dipendenza e le variabili CSS obsolete di Geist sans in `index.html` e `src/index.css`, garantendo Inter (`--font-inter`, `--font-sans`) con spettro completo pesi (400-900) e Geist Mono (`--font-mono`) per i codici tabulari.
  - **Rafforzamento Utility Semantiche**: sincronizzate le classi `.app-overline` (fissato colore arancione industriale `#f97316`), `.app-qty-sm` e `.app-qty-lg` (vincolati rigidamente a `font-mono tabular-nums`) e allineato il componente base `ui/label.jsx` alla scala semantica `.app-label`.
  - **Sostituzione Font Arbitrari e Correzione Form Labels**: convertite tutte le label di form che usavano impropriamente `.app-overline` (9px) in `.app-label` (11-12px) in `CommesseView`, `OperatorsView`, `OrderModal` e `VirtualizedTable`.
  - **Rimozione Sovrascritture Obsolete e Fix Contrasti**: eliminato l'uso di `app-caption font-sans` e dimensioni inline ridondanti su `.app-qty-sm` in `InProduzioneView`, `RiaffilatureView` e `ToolsGrid`; corretto il contrasto testo su Blu Tecnico in `App.jsx` (`text-slate-950`); rimosso `uppercase` improprio sui dati dinamici in `CategoryGridCard.jsx`; conformato il target touch a 44px in `HelpFloatingButton.jsx`.
- **File coinvolti**:
  - [`index.html`](file:///Users/gio/Documents/CODING/Berc_utensili/index.html)
  - [`src/index.css`](file:///Users/gio/Documents/CODING/Berc_utensili/src/index.css)
  - [`src/components/ui/label.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/ui/label.jsx)
  - [`src/components/common/DataTable/VirtualizedTable.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/DataTable/VirtualizedTable.jsx)
  - [`src/components/common/ErrorBoundary.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/ErrorBoundary.jsx)
  - [`src/components/common/AppTutorial.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/AppTutorial.jsx)
  - [`src/components/common/HelpFloatingButton.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/HelpFloatingButton.jsx)
  - [`src/components/layout/PageTemplate.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/PageTemplate.jsx)
  - [`src/features/inventory/ToolsGrid.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolsGrid.jsx)
  - [`src/features/inventory/ToolDetailDrawer.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolDetailDrawer.jsx)
  - [`src/features/inventory/OrderModal.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/OrderModal.jsx)
  - [`src/features/inventory/MultiMovementView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/MultiMovementView.jsx)
  - [`src/features/scanner/ScannerView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/scanner/ScannerView.jsx)
  - [`src/features/admin/CommesseView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/CommesseView.jsx)
  - [`src/features/admin/OperatorsView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/OperatorsView.jsx)
  - [`src/features/admin/HistoryView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/HistoryView.jsx)
  - [`src/features/produzione/InProduzioneView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/produzione/InProduzioneView.jsx)
  - [`src/features/produzione/RiaffilatureView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/produzione/RiaffilatureView.jsx)
  - [`src/features/filters/CategoryGridCard.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/filters/CategoryGridCard.jsx)
  - [`src/App.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/App.jsx)

## [2026-09-28] - Sostituzione Modale Dettagli con Drawer Laterale Stitch (ToolDetailDrawer)
- **Tag**: `[UX/UI]` / `[FEAT]` / `[REFACTOR]`
- **Descrizione**:
  - **Sostituzione Modale con Drawer Laterale**: scaricato e implementato il prototipo Stitch *"Inventario — Dettaglio Utensile (Drawer Laterale)"*. Il vecchio dialog centrale che copriva l'intero schermo è stato sostituito da un pannello a scorrimento laterale destro (`ToolDetailDrawer`), con backdrop traslucido che mantiene la tabella sottostante completamente visibile senza ridimensionarla o comprimerne le colonne.
  - **Evidenziazione e Selezione Riga Persistente**: all'apertura del drawer, la riga dell'utensile selezionato nella tabella inventario sottostante rimane evidenziata in modo nitido (`bg-sky-50`, bordo sinistro `border-l-sky-500`, icona e testo ad alto contrasto, e badge `1 riga selezionata` nel footer) per tutta la durata dell'apertura del drawer, deselezionandosi automaticamente solo alla chiusura dello stesso.
  - **Fedeltà al Design System Industriale**: integrate schede strutturate conformi al prototipo: *"Specifiche Tecniche"* (diametro nominale `Ø`, tolleranza foro `ISO H7`, materiale costruttivo, attacco/codolo), *"Ubicazione & Giacenza"* (badge stock, pin ubicazione fisica, giacenza disponibile ad alto contrasto `Geist Mono` e stato tagliente), e azioni rapide dedicate (*Preleva*, *Deposita*, *Stampa Etichetta Barcode / QR*).
  - **Integrazione Flussi Operativi e Resilienza**: il drawer gestisce sia la visualizzazione dettagliata sia la transizione fluida verso i flussi guidati di prelievo/deposito (`PrelievoGuidato`/`DepositoGuidato`) con pulsante indietro dedicato, mantenendo la compatibilità a ritroso (`MovementModal` re-export).
- **File coinvolti**:
  - [`src/features/inventory/ToolDetailDrawer.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolDetailDrawer.jsx)
  - [`src/features/inventory/MovementModal.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/MovementModal.jsx)
  - [`src/App.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/App.jsx)
  - [`.stitch/metadata.json`](file:///Users/gio/Documents/CODING/Berc_utensili/.stitch/metadata.json)

## [2026-09-28] - Semplificazione Causali Scarto Operatore a Usura e Collisione & Audit Colonne DB
- **Tag**: `[UX/UI]` / `[REFACTOR]` / `[SQL]`
- **Descrizione**:
  - **Semplificazione Causali Operatore**: ristretto il motivo di rottura nello smontaggio a sole due scelte immediate per l'operatore d'officina: `usura` (fisiologica / fine vita naturale) e `collisione` (evitabile / urto in macchina). Rimosse opzioni dispersive, textarea e campi note secondari, consentendo la registrazione dello scarto con un solo tap (Legge di Hick e Fitts).
  - **Allineamento Regole Backend**: aggiornato il vincolo di validazione della RPC `smonta` in PostgreSQL e il mock DB per consentire solo `usura` e `collisione` da parte dell'operatore, mantenendo al contempo le causali automatiche di sistema (`usura_limite_riaffilature` e `scarto_fornitore`).
  - **Verifica Live Colonne Supabase**: interrogato `information_schema.columns` sul database live tramite Supabase MCP, confermando la corrispondenza esatta delle colonne per tutte le tabelle (`Utensili_B1`, `ordini`, `commesse`, `movements_history`, `utenti`, `giacenze_commesse`).
- **File coinvolti**:
  - [`src/features/produzione/lifecycleSelectors.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/produzione/lifecycleSelectors.js)
  - [`src/features/produzione/SmontaDialog.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/produzione/SmontaDialog.jsx)
  - [`src/mocks/lifecycle/mockDb.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/mocks/lifecycle/mockDb.js)
  - [`supabase/migrations/20260924_lifecycle_2_rpc_base.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/migrations/20260924_lifecycle_2_rpc_base.sql)
  - [`supabase/tests/lifecycle_fase2.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/tests/lifecycle_fase2.sql)

## [2026-09-28] - Miglioramento Leggibilità Descrizione & Unificazione Token Pillole
- **Tag**: `[UX/UI]` / `[REFACTOR]`
- **Descrizione**:
  - **Aumento Leggibilità Descrizione**: aumentata la dimensione del font della descrizione dell'utensile da `text-xs` a `text-sm sm:text-base font-bold` per garantire massima visibilità a colpo d'occhio e da distanza su terminali d'officina.
  - **Rimozione Sottotitolo Ridondante Descrizione**: eliminata la seconda riga sotto il nome dell'utensile contenente il fallback hardcoded `"Standard DIN"` / materiale, centrandone verticalmente il titolo con l'icona ed eliminando testo fittizio.
  - **Unificazione Globale Token Pillole**: standardizzati altezza (`26px`), padding (`px-2.5 py-1`), raggio di curvatura (`rounded-md`, 8px), font-size (`text-xs`), font-weight (`font-semibold`) e bordatura su tutte le colonne con pillole (*Codice Aziendale*, *Codice Fornitore*, *Ubicazione*, *Stato*), mantenendo inalterata la semantica dei colori (slate per codici, sky/amber per ubicazione, emerald/rose per stato).
- **File coinvolti**:
  - [`src/features/inventory/ToolsGrid.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolsGrid.jsx)

## [2026-09-28] - Chiusura Definitiva Backend Ciclo di Vita (Migration 1-4 & Test SQL)
- **Tag**: `[FIX]` / `[REFACTOR]` / `[DOCS]`
- **Descrizione**:
  - **Risoluzione di tutti i punti aperti della revisione backend** ([`docs/REVIEW_BACKEND_LIFECYCLE.md`](file:///Users/gio/Documents/CODING/Berc_utensili/docs/REVIEW_BACKEND_LIFECYCLE.md)): corretti i nomi colonna (`quantita_richiesta` su ordini), impostati i vincoli CHECK bidirezionali su `posizioni_utensile` (`id_macchina` e `id_spedizione`) e rimosso l'indice unico parziale su `movements_history` (sostituito con indice non-unico su `id_operazione` per consentire prelievi e spedizioni multi-riga dello stesso utensile, contratto v1.2).
  - **Risolto `ON CONFLICT` in `handle_multi_movement`**: rimossi i `COALESCE` nelle clausole `ON CONFLICT` di carico e spostamento, allineandoli all'indice unico di `posizioni_utensile` per preservare il corretto funzionamento delle movimentazioni di magazzino dell'app esistente.
  - **Normalizzazione RPC Riaffilature**: standardizzata la sintassi `RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '...', DETAIL = '...'` in tutte le funzioni, allineata la lettura e scrittura degli scarti del fornitore a `'scarto_fornitore'`, spostato `ORDER BY` all'interno di `jsonb_agg` in `get_riaffilature` e aggiunto il campo `id_operazione_rientro` per consentire correzione e annullo delle spedizioni rientrate (proposta D3).
  - **Integrità Dati & Sicurezza Transazionale**: implementato blocco preventivo del doppio annullo in `annulla_operazione` (`gia_annullata`) per evitare duplicazione stock, filtro per operatore in `ultimo_uso_operatore`, causale obbligatoria su smontaggio `'rotto'`, `luogo_da = NULL` su `deposita`, e aggiornati gli script di test SQL (`lifecycle_fase2.sql`, `lifecycle_fase3.sql`, `verifica_migrazione.sql`).
- **File coinvolti**:
  - [`supabase/migrations/20260924_lifecycle_1_schema_e_migrazione.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/migrations/20260924_lifecycle_1_schema_e_migrazione.sql)
  - [`supabase/migrations/20260924_lifecycle_2_rpc_base.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/migrations/20260924_lifecycle_2_rpc_base.sql)
  - [`supabase/migrations/20260924_lifecycle_3_riaffilature.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/migrations/20260924_lifecycle_3_riaffilature.sql)
  - [`supabase/migrations/20260924_lifecycle_4_dashboard_realtime_legacy.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/migrations/20260924_lifecycle_4_dashboard_realtime_legacy.sql)
  - [`supabase/tests/lifecycle_fase2.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/tests/lifecycle_fase2.sql), [`supabase/tests/lifecycle_fase3.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/tests/lifecycle_fase3.sql), [`supabase/tests/verifica_migrazione.sql`](file:///Users/gio/Documents/CODING/Berc_utensili/supabase/tests/verifica_migrazione.sql)
  - [`docs/REVIEW_BACKEND_LIFECYCLE.md`](file:///Users/gio/Documents/CODING/Berc_utensili/docs/REVIEW_BACKEND_LIFECYCLE.md), [`SUPABASE_SCHEMA.md`](file:///Users/gio/Documents/CODING/Berc_utensili/SUPABASE_SCHEMA.md)

## [2026-09-28] - Implementazione Design System "Utensili V2" (Stitch) & Pulizia Architetturale
- **Tag**: `[UX/UI]` / `[FEAT]` / `[PERF]` / `[REFACTOR]`
- **Descrizione**:
  - **Sidebar Collassabile Ad Icone**: Transizione fluida desktop (`w-64 lg:w-72` espansa ↔ `w-[68px]` compatta) con toggle a doppie frecce (`ChevronsLeft`/`ChevronsRight`), persistenza locale (`sidebar_collapsed`), pulsanti di azione rapida semantici (Deposita `emerald-600`, Preleva `rose-600`, Nuovo Utensile `sky`), avatar utente e tooltip di navigazione. Risolto bug di render sul pulsante di collasso desktop.
  - **Lista TanStack a Tutto Schermo & Piena Integrazione**: Rimossi i vincoli artificiali `max-w-7xl` e `max-w-[1600px]`, eliminato il container a card flottante con bordi arrotondati (`rounded-2xl border shadow-sm`) e rimosso il padding perimetrale (`p-2 sm:p-3 md:p-4`). La tabella TanStack ora è integrata al 100% con la testata filtri e il footer, a filo con i bordi della finestra, eliminando lo schema "box-in-a-box" e massimizzando l'altezza visibile (16 righe simultanee in viewport). Eliminata la colonna ridondante `Lavorazione` e azzerato il bottom spacer.
  - **Barra Filtri Parametrici Single-Row**: Toolbar filtri orizzontale compatta ad altezza fissa `h-11` con scorrimento fluido, chip parametrici con label e valore evidenziato, e pulsante rapido di reset (*Azzera filtri*).
  - **Estensione Design ad Altre Viste**: Applicato il layout a tutta larghezza e il design system con precision card e header a filo anche a *Movimento Multiplo* ([`MultiMovementView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/MultiMovementView.jsx)), *In produzione* ([`InProduzioneView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/produzione/InProduzioneView.jsx)), *Riaffilature* ([`RiaffilatureView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/produzione/RiaffilatureView.jsx)), *Commesse* ([`CommesseView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/CommesseView.jsx)), *Storico movimenti* ([`HistoryView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/HistoryView.jsx)) e *Gestione Operatori* ([`OperatorsView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/admin/OperatorsView.jsx)).
  - **Audit Visivo Headless & Pulizia Codice**: Eseguito audit visivo tramite `chrome-devtools` headless MCP confrontando screenshot live e mockup Stitch, rimossi script temporanei e pulito l'ambiente (0 errori linter e token guardrail, build Vite verificata).
- **File coinvolti**:
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)
  - [`src/features/inventory/ToolsGrid.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolsGrid.jsx)
  - [`src/features/filters/DropdownFilterView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/filters/DropdownFilterView.jsx)
  - [`src/features/inventory/MultiMovementView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/MultiMovementView.jsx)
  - [`src/components/common/DataTable/VirtualizedTable.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/DataTable/VirtualizedTable.jsx)
  - [`src/components/layout/PageTemplate.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/PageTemplate.jsx)
  - [`src/components/layout/GlobalSearch.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/GlobalSearch.jsx)
  - [`src/App.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/App.jsx)
  - [`eslint.config.js`](file:///Users/gio/Documents/CODING/Berc_utensili/eslint.config.js)
  - [`CHANGELOG.md`](file:///Users/gio/Documents/CODING/Berc_utensili/CHANGELOG.md)
- **Tag**: `[UX/UI]` / `[FEAT]`
- **Descrizione**:
  - Implementata la nuova Sidebar collassabile con switch bidirezionale (`w-64 lg:w-72` espansa ↔ `w-[68px]` compatta ad sole icone) e persistenza in `useNavigationStore` (`sidebar_collapsed`), pulsanti rapidi con colori semantici industriali (Deposita `emerald-600`, Preleva `rose-600`, Nuovo Utensile `sky`), badge profilo operatore e indicatori di navigazione attivi.
  - Ridisegnata la testata `PageHeader` e l'Omnibox di ricerca globale (`GlobalSearch`): chip breadcrumb con icona Database, barra di ricerca stile terminale CNC con chip rapidi (`D6`, `Alesatori`), scorciatoia `⌘K` e pulsante dedicato per scanner barcode rapido.
  - Aggiornata la barra filtri parametrici (`DropdownFilterView`) con pulsanti compatti `h-7`, badge con label/valore evidenziato e pulsante di reset rapido.
  - Trasformata la tabella TanStack (`ToolsGrid` & `VirtualizedTable`) con design precision: icon-box differenziate per stato utensile, badge codice mono, badge ubicazione/macchina con icona factory, pill disponibilità NUOVO/USATO, conteggio giacenza ad alto contrasto e footer con stato catalogo.
- **File coinvolti**:
  - [`src/components/layout/Sidebar.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/Sidebar.jsx)
  - [`src/components/layout/GlobalSearch.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/GlobalSearch.jsx)
  - [`src/components/layout/PageTemplate.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/layout/PageTemplate.jsx)
  - [`src/features/filters/DropdownFilterView.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/filters/DropdownFilterView.jsx)
  - [`src/features/inventory/ToolsGrid.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/features/inventory/ToolsGrid.jsx)
  - [`src/components/common/DataTable/VirtualizedTable.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/components/common/DataTable/VirtualizedTable.jsx)
  - [`src/store/useNavigationStore.js`](file:///Users/gio/Documents/CODING/Berc_utensili/src/store/useNavigationStore.js)
  - [`src/App.jsx`](file:///Users/gio/Documents/CODING/Berc_utensili/src/App.jsx), [`src/index.css`](file:///Users/gio/Documents/CODING/Berc_utensili/src/index.css), [`index.html`](file:///Users/gio/Documents/CODING/Berc_utensili/index.html)

## [2026-09-27] - Ottimizzazione Design System (DESIGN_SYSTEM.md) per LLM
- **Tag**: `[UX/UI]` / `[PERF]` / `[DOCS]`
- **Descrizione**:
  - Ottimizzato e riscritto direttamente [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) ispirandosi alla struttura compatta e priva di sprechi di token del Design V2 di Stitch (`Tool Crib Precision`).
  - Ridotto il peso del file da 75,3 KB (~20.000 token) a 21,9 KB (~5.500 token) con un risparmio del 71% di contesto, eliminando memorie storiche, dissertazioni discorsive e verbali di audit.
  - Mantenuto al 100% l'intero patrimonio normativo: regole Fitts 44px, scale semantiche `.app-*`, z-index, palette contrasti WCAG, 4 tier di modali, TanStack virtualizzato, layout app-like 100dvh e checklist pre-commit.
  - Lasciati invariati i file Stitch (`.stitch/DESIGN.md`, `.stitch/metadata.json`, asset cloud) e rimosso qualsiasi file addizionale.
- **File coinvolti**:
  - [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (ottimizzato e compattato)
  - [`gemini.md`](./gemini.md), [`CHANGELOG.md`](./CHANGELOG.md)

## [2026-09-27] - Creazione Investor & Commercial Pitch Deck (HTML + PDF)
- **Tag**: `[FEAT]` / `[DOCS]`
- **Descrizione**:
  - Creato Investor & Commercial Pitch Deck professionale in formato widescreen 16:9 / A4 landscape per la presentazione dell'app a clienti industriali e investitori.
  - Inclusi grafici vettoriali (ROI cumulativo su 12 mesi, matrice posizionamento competitivo 2x2, breakdown costi fermo macchina) e screenshot reali dell'applicazione (catalogo, modale dettaglio, distinta movimento multiplo, storico audit).
  - Generata la versione PDF multipagina ad alta risoluzione (`presentation/investor_deck.pdf`) con impaginazione tipografica perfetta (8 slide, 1 slide per pagina).
- **File Coinvolti**:
  - [`presentation/deck.html`](file:///Users/gio/Documents/CODING/Berc_utensili/presentation/deck.html)
  - [`presentation/investor_deck.pdf`](file:///Users/gio/Documents/CODING/Berc_utensili/presentation/investor_deck.pdf)
  - `presentation/assets/*`

## [2026-09-24] - Installazione Stitch Skills e configurazione Stitch MCP Server
- **Tag**: `[FEAT]` / `[DOCS]`
- **Descrizione**:
  - Clonata e integrata la libreria di skill `google-labs-code/stitch-skills` per Google Stitch (16 skill divise in 3 plugin: `stitch-build`, `stitch-design`, `stitch-utilities`).
  - Rese disponibili le skill a livello globale e locale sia per Gemini/Antigravity (`~/.gemini/config/plugins/`, `.agents/plugins/`) che per Claude Code / Claude Desktop (`~/.claude/skills/`, `.claude/skills/`).
  - Configurato il server MCP Stitch nativo di Google (`https://stitch.googleapis.com/mcp` con header `X-Goog-Api-Key`) in `~/.gemini/config/mcp_config.json`, `claude_desktop_config.json`, `~/.claude/mcp.json` e `.claude/mcp.json`.
  - Rimossi i file temporanei e i bundle proxy di terze parti non necessari (`~/.stitch-mcp`).
- **File Coinvolti**:
  - `~/.gemini/config/plugins/stitch-*`, `~/.claude/skills/*`, `.agents/plugins/*`, `.claude/skills/*`, `~/.gemini/config/mcp_config.json`, `claude_desktop_config.json`, `~/.claude/mcp.json`, `.claude/mcp.json`

## [2026-09-24] - Correzioni backend Ciclo di Vita dopo la revisione (Gemini)
- **Tag**: `[FIX]`
- **Descrizione**:
  - Vincoli e aggiornamenti su `posizioni_utensile` (A4, A9); rimosso l'indice unico su `movements_history.id_operazione` (A5, contratto v1.2).
  - Nomi colonne, controlli permessi, filtri dashboard e scostamenti dal contratto come da `docs/REVIEW_BACKEND_LIFECYCLE.md` (A1-A3, B1-B8, C1-C10).
- **File Coinvolti**:
  - `supabase/migrations/20260924_lifecycle_{1,2,3,4}_*.sql`, `supabase/tests/lifecycle_fase{2,3,4}.sql`

## [2026-09-24] - Vista "In produzione" con Smonta guidato e revisione del backend
- **Tag**: `[FEAT]` / `[UX/UI]` / `[DOCS]`
- **Descrizione**:
  - **In produzione** (voce di menu, visibile solo con i flussi nuovi attivi): cosa è montato su ogni macchina e cosa aspetta nei cassetti commessa, con "Raggruppa per Macchina / Commessa", ricerca e contatore riaffilature ("2ª riaff. · ultima" in arancione).
  - **Smonta**: "Com'è l'utensile?" → Consumato (cestello, o scarto automatico se al limite, annunciato prima), Rotto (motivo in un tocco, nota per "Altro"), Ancora buono (torna nel cassetto della commessa come usato), Sposta (macchina + commessa, preselezionata quella attuale). Toast con Annulla.
  - **PRELEVA dal cassetto** apre il prelievo guidato già sulla commessa e sul cassetto giusti (contesto di apertura).
  - Verificato a 1280×800 e 375×650; su smartphone "Raggruppa per" passa nel contenuto a tutta larghezza.
  - **Revisione del backend di Gemini** (`docs/REVIEW_BACKEND_LIFECYCLE.md`): 9 errori bloccanti, 8 gravi, 10 scostamenti; contratto v1.2 (tolto l'indice unico su `movements_history`); risposta a D2. `CHANGELOG.md` ripristinato dopo la sovrascrittura.
- **File Coinvolti**:
  - `src/features/produzione/{InProduzioneView,SmontaDialog}.jsx`, `src/features/produzione/PrelievoGuidato.jsx`
  - `src/store/useProduzioneStore.js`, `src/components/layout/Sidebar.jsx`, `src/App.jsx`, `src/features/inventory/MovementModal.jsx`
  - `docs/REVIEW_BACKEND_LIFECYCLE.md`, `docs/CONTRACT_LIFECYCLE.md`, `DESIGN_SYSTEM.md`, `CHANGELOG.md`

## [2026-09-24] - Backend Ciclo di Vita, fasi 1-4 (Gemini) — ⚠️ in revisione, non applicare
- **Tag**: `[FEAT]`
- **Descrizione**:
  - Migration `20260924_lifecycle_1..4`: schema `posizioni_utensile`, macchine, spedizioni, colonne prezzi/permessi, migrazione da `giacenze_commesse`, trigger su `"Quantità"`, RPC di lettura/scrittura, riaffilature, dashboard, realtime e riscrittura delle RPC legacy.
  - Test SQL in `supabase/tests/lifecycle_fase{2,3,4}.sql`; domanda D2 nel contratto (trigger vs scritture client).
  - **Revisione di Claude (2026-09-24)**: trovati errori bloccanti prima dell'applicazione — vedi `docs/REVIEW_BACKEND_LIFECYCLE.md`.
- **File Coinvolti**:
  - `supabase/migrations/20260924_lifecycle_{1_schema_e_migrazione,2_rpc_base,3_riaffilature,4_dashboard_realtime_legacy}.sql`
  - `supabase/tests/lifecycle_fase{2,3,4}.sql`, `SUPABASE_SCHEMA.md`, `docs/CONTRACT_LIFECYCLE.md`

## [2026-09-24] - Prelievo e Deposito guidati (Ciclo di Vita, fase 2 frontend)
- **Tag**: `[FEAT]` / `[UX/UI]`
- **Descrizione**:
  - **Prelievo guidato**: nel modale utensile, PRELEVA porta a tre domande (macchina → commessa → pezzo) con riquadro "Prendi da → Porta a". Preseleziona l'ultima macchina dell'operatore e la commessa solo se usata entro 72h; parte dal cassetto della commessa se ha pezzi, consiglia Usato → Riaffilato → Nuovo; suggerisce i pezzi fermi da giorni su altre macchine.
  - **Deposito guidato**: DEPOSITA chiede se i pezzi sono per una commessa (proposta dall'ordine aperto) e mostra subito il cassetto o lo scaffale di destinazione.
  - Nessuna conferma extra: Toast con **Annulla**; errori in linguaggio umano; riprova sicura con lo stesso id operazione. Stessa modale e stessa dimensione del passo Dettaglio (§6.1).
  - Nuovi componenti del design system (§4.7-4.8): `ChoiceChip`, `GuidedStep`, `QuantityStepper`, `DirectionStrip`, `GuidedFooter`. Verificati a 1280×800 chiaro/scuro e 375×650.
  - Attivi solo con la simulazione (sviluppo) o con `VITE_LIFECYCLE_UI=true`: in produzione resta il flusso attuale finché il backend non è pronto. Movimento multiplo e bulk invariati.
- **File Coinvolti**:
  - `src/features/produzione/{PrelievoGuidato,DepositoGuidato,CommessaPicker,DirectionStrip,StatoPicker,GuidedFooter}.jsx`
  - `src/components/ui/{choice-chip,guided-step,quantity-stepper}.jsx`
  - `src/features/inventory/MovementModal.jsx`, `src/App.jsx`
  - `src/lib/lifecycleApi.js`, `src/mocks/lifecycle/mockDb.js`
  - `DESIGN_SYSTEM.md`, `CHANGELOG.md`

## [2026-09-24] - Fase 1 frontend Ciclo di Vita: simulazione RPC, store produzione e storico con nuovi movimenti
- **Tag**: `[FEAT]`
- **Descrizione**:
  - Simulazione in memoria di tutte le RPC del contratto (`docs/CONTRACT_LIFECYCLE.md` v1.1): idempotenza, codici di errore, limite riaffilature, annullo; 17 scenari verificati. In sviluppo è la sorgente predefinita, in produzione Supabase (`VITE_LIFECYCLE_SOURCE` per forzare).
  - Client unico `lifecycleApi` (errori tradotti per l'operatore, `id_operazione` per i tentativi ripetuti) e `useProduzioneStore` con letture, scritture, annullo e realtime.
  - Funzioni pure di presentazione (stato consigliato, sorgente cassetto/magazzino, raggruppamento per macchina/commessa, anteprime "Consumato"/"Ancora buono").
  - Storico movimenti (D1): nuovi tipi di movimento con etichetta, colore e segno corretti; filtro Deposita/Preleva per direzione.
- **File Coinvolti**:
  - `src/mocks/lifecycle/mockDb.js`
  - `src/lib/lifecycleApi.js`, `src/lib/movementTypes.js`
  - `src/store/useProduzioneStore.js`
  - `src/features/produzione/lifecycleSelectors.js`
  - `src/features/admin/HistoryView.jsx`
  - `docs/CONTRACT_LIFECYCLE.md`, `CHANGELOG.md`

## [2026-09-24] - Contratto dati Ciclo di Vita Utensili e divisione lavoro frontend/backend
- **Tag**: `[DOCS]`
- **Descrizione**:
  - Nuovo contratto vincolante tra backend (Gemini) e frontend (Claude): modello unico `posizioni_utensile` (magazzino, cassetto commessa, macchina, cestello, fornitore × nuovo/usato/riaffilato), contatore riaffilature, spedizioni con DDT, RPC idempotenti con codici di errore, compatibilità con `"Quantità"` e le RPC esistenti.
  - Prompt operativo per Gemini, una fase per sessione, con perimetro file e scenari di test obbligatori.
  - `HANDOFF_LIFECYCLE.md` marcato come superato per schema e RPC.
- **File Coinvolti**:
  - `docs/CONTRACT_LIFECYCLE.md`
  - `docs/PROMPT_GEMINI_LIFECYCLE.md`
  - `HANDOFF_LIFECYCLE.md`
  - `CHANGELOG.md`

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
