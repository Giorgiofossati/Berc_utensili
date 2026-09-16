# Regole e Contesto Progetto: Bercella Utensili (gemini.md)

Questo file serve come linea guida e memoria di sistema per gli agenti AI su questo progetto.
Contiene le regole architetturali, i requisiti di sistema, le lezioni apprese e il protocollo di audit obbligatorio.

## 🎯 Panoramica del Progetto
**Berc_utensili** è una web app (React + Vite, TailwindCSS, Supabase) per la gestione del magazzino utensili CNC Bercella.
Offre tracciamento in tempo reale, prelievo guidato, carico/scarico rapido e prevenzione fermi macchina.

### Workflow Operativo Magazzino
- **Prelievo (Scarico)**: Ricerca utensile -> Verifica giacenza e ubicazione -> Scarico quantità. (Se giacenza = 0, l'utensile resta visibile con 0 pz).
- **Deposito (Carico)**: Consegna -> Ricerca esistenza a sistema -> Carico quantità. Se assente -> Creazione nuovo articolo (Admin).

### Documenti di Riferimento Ufficiali
- [`SYSTEM_AUDIT_RULES.md`](./SYSTEM_AUDIT_RULES.md): **Protocollo Scientifico e Matrice di Self-Audit UX/UI** (HCI, Fitts, Hick, Miller, Gestalt, ISO 9241, WCAG 2.1 AA).
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md): Token cromatici, classi semantiche `.app-*`, raggi di curvatura e layout.
- [`CHANGELOG.md`](./CHANGELOG.md): **Registro Modifiche Software (Log Obbligatorio)**: Tracciamento sintetico di ogni implementazione, bugfix o refactor.

---

## 📝 Regola Tassativa: Tracciamento Modifiche nel Log (`CHANGELOG.md`)

> **OBBLIGO PER TUTTI GLI AGENTI E LE SESSIONI DI SVILUPPO**:  
> Ad ogni implementazione, modifica al codice, bugfix o refactoring completato con successo, **l'agente DEVE obbligatoriamente registrare le novità nel file [`CHANGELOG.md`](./CHANGELOG.md)** prima di concludere il task.

### Come compilare il log (sintetico ed essenziale):
- **Posizione**: Inserire la nuova voce **in cima** al file (ordine cronologico inverso).
- **Contenuto essenziale**:
  - Data: `[YYYY-MM-DD]` e Titolo sintetico dell'intervento.
  - Tag: `[FEAT]`, `[FIX]`, `[UX/UI]`, `[REFACTOR]`, `[PERF]`, o `[DOCS]`.
  - Descrizione breve (2-4 punti concisi: motivazione o comportamento implementato).
  - Elenco dei file principali creati o modificati.
- **Brevità**: Evitare spiegazioni verbose o prolisse; il log deve restare pulito, schematico e consultabile a colpo d'occhio.

---

## 🔬 Protocollo Scientifico di Usabilità & Self-Audit Obbligatorio (HCI, ISO 9241, WCAG)

> **PRINCIPIO FONDAMENTALE**: La progettazione di UX/UI in questo gestionale industriale è una disciplina ingegneristica basata su modelli matematici, ergonomia cognitiva e standard ISO. Non è "gusto soggettivo".  
> Prima di confermare qualsiasi modifica al codice, **ogni agente AI DEVE porsi due domande**:
>
> 1. *"La cosa che sto realizzando o modificando infrange queste regole o leggi ergonomiche?"*  
> 2. *"Se sì, come la miglioro immediatamente per portarla allo standard ottimale?"*

### Matrice Rapida di Self-Audit per gli Agenti:
1. **Legge di Fitts & Ergonomia Touch**:
   - *Audit*: Target con area interattiva < 44×44px o azioni frequenti lontane dalla mano?
   - *Risoluzione*: Forzare `min-h-[44px] min-w-[44px]` (o `p-2.5 sm:p-3`), raggruppare i comandi vicino al punto di tocco.
2. **Legge di Hick & Miller (Carico Cognitivo & Chunking)**:
   - *Audit*: Troppe opzioni contemporanee (> 5-7), form monolitici o codici lunghi non segmentati?
   - *Risoluzione*: Suddividere i codici in blocchi discreti (*chunking*), nascondere colonne secondarie su mobile, filtrare proprietà con tutti valori nulli, strutturare flussi guidati.
3. **Principi della Gestalt (Regione Comune, Simmetria & Continuità)**:
   - *Audit*: Elementi correlati slegati, liste flex disallineate o card affiancate con altezze e padding disuguali?
   - *Risoluzione*: Raggruppare in card delimitate (`.glass-panel`), unificare con `<ToolsGrid hideExtraFilters={true} />` (TanStack Table v8), forzare `items-stretch` e `h-full` su card affiancate.
4. **Legge di Jakob & Affordance (Don Norman)**:
   - *Audit*: Pattern insoliti, bottoni che sembrano etichette o violazione della palette semantica?
   - *Risoluzione*: Rispettare i modelli consolidati. Palette funzionale fissa: Verde=Carico (`.action-btn-carica`), Rosso=Scarico (`.action-btn-scarica`), Ciano=Conferma (`.action-btn-primary`), Arancione=Alert/Ordini (`.action-btn-order`). **DIVIETO ASSOLUTO del colore `indigo`**.
5. **Euristiche di Nielsen & ISO 9241 (Prevenzione Errori & Feedback)**:
   - *Audit*: L'operatore può prelevare più pezzi di quelli a magazzino o il sistema non dà feedback visivo immediato (< 100ms)?
   - *Risoluzione*: Blocco preventivo del tasto (`disabled={qty > stock}`), messaggi di alert live, spinner e testi di caricamento inequivocabili.
6. **WCAG 2.1 AA & Tipografia Semantica**:
   - *Audit*: Font monospace (`.app-caption`) usato per istruzioni operative causando troncature? Contrasti < 4.5:1? Classi non standard come `text-5xl`?
   - *Risoluzione*: Usare `.app-caption` solo per codici/SKU/timestamp; usare `.app-body` per spiegazioni; contrasto minimo 4.5:1; font solo `Inter`.
7. **Layout App-Like (Single Screen 100vh) & Mobile Safe-Zones**:
   - *Audit*: Scroll orizzontale su mobile o elementi tagliati dall'overflow?
   - *Risoluzione*: Root a `100vh/100dvh` con `overflow-hidden`; scroll solo nei contenitori interni (`overflow-y-auto`) con safe-padding `p-2 pb-24` per non tagliare ring e ombreggiature.

---

## 🧠 Regole di UX/UI e Design (Errori da Evitare)

1. **Divieto Assoluto del Colore `indigo`**: Sostituito ovunque da ciano/blu (`#0ea5e9`, `#06b6d4`) e arancione industriale (`#f97316`).
2. **Mobile First & Zero Scroll Orizzontale**: Nascondere colonne accessorie su mobile (`hidden md:flex`) mostrando solo Icona, Descrizione e Quantità. Su schermi grandi espandere dinamicamente (`max-w-7xl`, `lg:grid-cols-5`, `xl:grid-cols-6`).
3. **Proporzioni e Safe Zones**: Evitare padding sproporzionati intorno a icone piccole. Riservare sempre `padding-bottom` (es. `pb-28`) nei contenitori scrollabili per non finire sotto bottoni flottanti.
4. **Comportamento Bottoni Flottanti**: Se i pulsanti macro (Carico/Scarico) coprono la lista su mobile, nasconderli durante lo scroll e ripristinarli dopo 15s di inattività.
5. **Dettaglio vs Azione**: Click su riga apre il Modale Dettagli con tutte le info; da lì l'utente seleziona Carico o Scarico e conferma la transazione.
6. **Ricerca Barcode Live**: Il filtro sul catalogo si aggiorna in tempo reale durante la digitazione, senza costringere a premere "Invio".
7. **Filtri Dinamici Reattivi**: Nascondere i filtri a tendina le cui proprietà risultano interamente `null` per la classe/categoria selezionata.
8. **Layout App-Like (100vh/100dvh)**: L'intera applicazione è bloccata a schermo intero (`overflow-hidden`). Lo scroll appartiene solo a contenitori dedicati (`flex-1 min-h-0 overflow-y-auto`).
9. **Prevenzione Taglio Bordi (Clip Outlines & Rings)**: Aggiungere safe padding (`p-2 pb-6`) su contenitori scrollabili per non tagliare ring di focus e ombre. Usare `shrink-0` sulle card riga. Vietata la doppia nidificazione di `.glass-panel`.
10. **Modali e Dialog (shadcn/ui Radix)**: Usare sempre `Dialog` nativi Radix/shadcn anziché overlay custom basati su framer-motion (evita bug di focus-trap, z-index e scroll-lock).
11. **Nessuno Scroll Interno nei Modali di Dettaglio**: L'intero contenuto del modale deve essere visibile a colpo d'occhio (`overflow-hidden`, `max-h-[95vh]`, padding calibrati `p-6`).
12. **Transizioni Dark Mode Leggere**: Limitare le animazioni CSS di cambio tema a `background-color`, `border-color` e `color`. Vietate transizioni lente su `backdrop-blur` e ombre.
13. **Classi Tipografiche Semantiche (`src/index.css`)**: Usare solo `.app-overline`, `.app-h1`, `.app-h2`, `.app-h3`, `.app-body`, `.app-caption`, `.app-qty-sm`, `.app-qty-lg`.
14. **Tabelle Mobile-First**: Testi estesi con `min-w-0 flex-1 truncate` e colonna quantità calibrata (`w-12 sm:w-16` / `min-w-[48px]`).
15. **Precaricamento Immagini Statiche**: Precaricare le icone utensili (`preloadToolImages()`) al boot in `App.jsx`. Nessun lazy-loading sulle icone catalogo.
16. **Tabelle e Viste Unificate con TanStack Table**: Tutte le liste utensili (inclusa `ScannerView`) devono riutilizzare `<ToolsGrid hideExtraFilters={true} />`. Vietate liste flex manuali con colonne disallineate.
17. **Allineamento Header Modali**: Impostare sempre `showCloseButton={false}` su `DialogContent`. La 'X' deve risiedere nella barra flex dell'Header, allineata orizzontalmente con icona e titolo.
18. **Divieto di `.app-caption` per Frasi Operative**: `.app-caption` (`font-mono`) è solo per codici e timestamp. Istruzioni e descrizioni usano `.app-body` senza `truncate` arbitrari.
19. **Divieto di Box Annidati ("Box in a Box")**: Struttura fissa: Header (Icona+Titolo+X) -> Body (Hero/Content proporzionato) -> Footer (Metadati a sx, bottoni a dx).
20. **Divieto di Testi Sparsi Fuori Contesto**: Istruzioni operative collocate esclusivamente nell'Header, nessun testo duplicante o badge fluttuante sul mirino video.
21. **Barra di Ricerca Globale Permanente**: Posizionata permanentemente in `Header.jsx`. Al focus attiva `dropdownView`, resetta filtri parziali e filtra la tabella in tempo reale.
22. **Schermate a Distinta (Zero Empty-State Passivi)**: In `MultiMovementView` renderizzare subito la tabella con testata e righe segnaposto fisse. Prima riga attiva e cliccabile con `+`.
23. **Modali di Ricerca a Schermo Esteso**: Per selezionare utensili da aggiungere a distinte/ordini, usare modali estesi (`max-w-6xl`/`7xl`, `h-[88dvh]`) con `<ToolsGrid hideExtraFilters={true} />`.
24. **Scala Dimensionale Standard dei Modali & Divieto Troncature**:
    - Rispettare i 4 Tier dimensionali: Tier 1 Alert (`sm:max-w-md`), Tier 2 Form Operativi/Commesse (`sm:max-w-2xl md:max-w-3xl`), Tier 3 Dettaglio Tecnico (`sm:max-w-3xl md:max-w-4xl`), Tier 4 Catalogo Fullscreen (`sm:max-w-6xl md:max-w-7xl`).
    - Mai troncare titoli operativi dei modali con `truncate` (es. mai generare "MODIFICA COMME..."). Separare l'azione dal codice e mostrare il codice in un badge mono dedicato.
    - I pulsanti di azione primaria non devono mai andare a capo su due righe (`whitespace-nowrap font-black tracking-wider`). In `DialogContent`, consentire alle classi `max-w-*` personalizzate di applicarsi senza essere scavalcate da default rigidi.

---

## 💾 Regole di Sviluppo, Architettura e Backend

1. **Database Supabase**: Interfacciamento su `Utensili_B1` (inventario), `movements_history` (log transazioni) e `utenti` (profili/ruoli).
2. **Stato Globale Isolato (Zustand)**: Store atomici dedicati (`useAuthStore`, `useInventoryStore`, `useFilterStore`, `useMovementStore`, `useMultiMovementStore`). Nessun prop-drilling esteso.
3. **Separation of Concerns (SoC) & Custom Hooks**: Logica di business e validazioni estratte in hook dedicati (es. `useAddToolForm.js`). Componenti JSX come pure viste.
4. **Navigazione Shadcn Sidebar**: Architettura standard basata su `SidebarProvider`. Pannello comprimibile su desktop, drawer nativo su mobile.
5. **Autenticazione e Login Guard**: Verifica sessione centralizzata a livello radice in `App.jsx`. Nessun redirect asincrono improvviso durante l'interazione nei modali.
6. **Ordinamento Multi-Campo (Sorting)**: Ordinamenti gestiti in `useFilterStore` tramite `localeCompare(..., { numeric: true })` per ordinare correttamente stringhe numeriche (es. D2 prima di D10).
7. **Sicurezza Credenziali e Dati**:
   - Nessuna password hardcoded o backdoor di bypass ('1234').
   - Nessuna `select(*)` sulla tabella utenti; escludere sempre le password da query e cache locale (`localStorage`).
   - Variabili d'ambiente via `import.meta.env`; mai committare `.env` o credenziali.
   - Validazione quantità positive (`p_change > 0`) sia client-side sia nelle RPC Supabase.
   - Funzionamento 100% offline per la PWA: nessun asset grafico caricato da CDN esterne non sicure.
8. **Controllo Accessi e Reset di Sessione**:
   - Navigazione gestita in `useNavigationStore`. Al logout: redirect a 'home' e reset filtri catalogo.
   - Defense-in-depth: viste riservate (`OperatorsView`) verificano `ruolo === 'Admin'` sia a livello sidebar che nel corpo del componente e in `App.jsx`.
9. **Architettura Tutorial Interattivo Multi-Vista (`AppTutorial` & `useTutorialStore`)**:
   - Passaggi dichiarativi con `targetView`, `resetFilters`, `viewMode`, `requireSidebar`.
   - Polling resiliente (40ms fino a 1s) per agganciare elementi con animazioni Framer Motion.
10. **Movimenti Multipli a Distinta (`useMultiMovementStore` & `handle_multi_movement`)**:
    - Validazione live: blocco preventivo se quantità <= 0 o scarico > pezzi a magazzino.
    - Esecuzione transazionale atomica via stored procedure PostgreSQL `handle_multi_movement` con blocco `FOR UPDATE`, con fallback trasparente client-side.
11. **Aggiornamento Log Obbligatorio a Chiusura Task**:
    - Prima di considerare terminato un task, aggiornare tassativamente [`CHANGELOG.md`](./CHANGELOG.md) riassumendo in 2-4 punti sintetici cosa è stato modificato e i file principali coinvolti.

---

## 📱 Ottimizzazioni Mobile e Performance PWA

1. **PWA & Safe Areas**: Rispetto categorico di `env(safe-area-inset-*)` per evitare sovrapposizioni con notch e barre di sistema.
2. **Chunking Bundle Vite**: Scorporo librerie pesanti (`@tanstack/*`, `framer-motion`, `@supabase/*`, `lucide-react`) in `manualChunks` in `vite.config.js` per garantire bundle sotto 500 kB e cache veloce nei terminali d'officina.
