# Regole e Contesto Progetto: Bercella Utensili (gemini.md)

Questo file serve come "memoria" e linea guida per l'assistente AI (Gemini) che lavora su questo progetto. Contiene le caratteristiche principali, le funzionalità richieste e le lezioni imparate durante lo sviluppo per evitare errori ripetuti.

## 🎯 Panoramica del Progetto
**Berc_utensili** è un'applicazione web (React + Vite, TailwindCSS) per la gestione avanzata del magazzino utensili CNC. L'obiettivo è fornire una dashboard pulita, intuitiva e orientata all'azione per operatori e amministratori.

### Workflow Operativo Magazzino
**CASO 1: Prelievo (Scarico)**
1. **Ricerca Utensile:** L'operatore cerca l'utensile verificandone presenza, quantità e ubicazione.
2. **Scarico:** Se l'utensile è presente nella quantità richiesta, si procede allo scarico. *(Nota: se la quantità scende a 0, l'utensile rimane visibile in griglia con quantità 0).*
3. **Gestione Ordini (Da Implementare):** Se l'utensile non è presente o la quantità è insufficiente, si procede alla creazione di un ordine.

**CASO 2: Deposito (Carico/Nuovo Articolo)**
1. **Consegna:** L'utensile viene consegnato e deve essere inserito a magazzino.
2. **Ricerca Utensile:** Verifica dell'esistenza a sistema.
3. **Deposito:** Se già presente, si procede al carico (aggiornamento quantità).
4. **Nuovo Articolo (Da Implementare):** Se non presente, deve essere creato un nuovo articolo compilando tutti i campi nel database.

### Caratteristiche Principali (Stack e Design)
- **Tecnologie:** React, Vite, TailwindCSS, Supabase (per database e autenticazione), Framer Motion (per animazioni).
- **Design System ("Industrial Professional Look"):** 
  - Colori primari: Blu/Ciano (`#0ea5e9` o `#06b6d4`).
  - Colori secondari: Arancione (`#f97316` o `#ea580c`) per alert/reset.
  - Colori funzionali: Verde (Carico), Rosso (Scarico).
  - Stile generale: Premium, minimale, leggero Glassmorphism.
  - **NON USARE** il colore `indigo` (è stato rimosso per un look più industriale).
- **UX/UI Core:** Navigazione a cascata, caroselli per macro-categorie, griglie compatte senza scroll orizzontale, design fully responsive.

## 🚀 Funzionalità e Roadmap
### Funzionalità Implementate
- Ricerca manuale tramite Barcode con filtro parziale real-time.
- Toggle tra visualizzazione a Carosello e Filtri a tendina.
- Navigazione a livelli (Tipologia -> Forma -> Diametro -> Lista Utensili a griglia compatta).
- Filtri dinamici: se una colonna ha tutti valori `null` per la classe selezionata, il filtro viene nascosto.
- Navbar con informazioni utente e data; bottoni azione in linea.
- **Gestione Utenti e Privilegi (Completata):** Sistema di Login screen. Gli Operatori eseguono operazioni base; gli Admin hanno accesso completo (es. aggiunta nuovi utensili).
- **Operazioni Bulk (Selezione Multipla):** Modalità di selezione che permette di selezionare più utensili contemporaneamente per effettuare movimenti di carico o scarico di massa tramite un Drawer dedicato.
- **Ottimizzazione Griglia e Layout Responsivo (Completata):** Nascondimento colonne non essenziali su mobile per evitare lo scroll orizzontale ed espansione a griglie di 6 colonne su schermi molto grandi.

### Richieste Attuali / Future
- **Dettaglio Utensile Modal Avanzato:** Ottimizzare o espandere il modale di dettaglio (che attualmente gestisce il movimento) per visualizzare comodamente tutte le info non presenti in griglia.
- **Gestione Ordini:** Se un utensile non è presente o la quantità è insufficiente, creare il flusso per l'ordine automatico.
- **Dark Mode Toggle:** Implementazione di un toggle globale per tema chiaro/scuro in alto a destra.

## 🧠 Cosa ho imparato e Regole da Seguire (Errori da evitare)

### 🎨 Regole di UX/UI e Design
1. **Mai reinserire il colore "indigo"**: Il cliente ha richiesto specificamente un restyling verso il blu/ciano e arancione. Evitare l'utilizzo di `indigo` in nuove classi Tailwind.
2. **Attenzione allo scroll orizzontale e Layout Responsivo (Mobile vs Desktop)**: Le tabelle/griglie devono essere sempre visibili senza scroll orizzontale. 
   - **Su Mobile:** Le colonne accessorie (Ubicazione, Stato, Codice, Fornitore) devono essere nascoste via CSS (es. `hidden md:flex`) mostrando solo le info vitali (Icona, Descrizione, Quantità) per evitare sbordamenti. Tutti i dettagli secondari sono sempre consultabili cliccando la riga (Modale Dettaglio).
   - **Su Desktop/XL:** Sfruttare tutto lo spazio orizzontale disponibile espandendo i container (es. `max-w-7xl` o `max-w-[1600px]`) e incrementando le colonne delle griglie dinamicamente (es. `lg:grid-cols-5`, `xl:grid-cols-6`), evitando di sprecare spazio bianco laterale.
3. **Proporzioni, Spaziature e Safe Zones (Ottimizzazione UI):** Il design deve massimizzare lo spazio dedicato ai contenuti utili, mantenendo il focus visivo al centro della schermata senza sprechi.
   - **Contenitori proporzionati:** Evitare riquadri o padding eccessivamente grandi attorno a elementi piccoli (es. icone o immagini). L'immagine e il testo principale devono dominare il contenitore in modo bilanciato ed essere chiaramente leggibili, evitando "scatole vuote" che tolgono spazio al resto degli elementi.
   - **Prevenzione Sovrapposizioni (Safe Area):** Gli elementi fissi (come i bottoni flottanti in basso o header sticky) non devono **mai** coprire i contenuti. Prevedere sempre un margine o `padding-bottom` abbondante (es. `pb-28`) nei contenitori scrollabili per far scorrere la lista oltre i bottoni.
   - **Layout Puliti:** Utilizzare strutture CSS robuste (`flex`, `grid` con i relativi `gap`) per distanziare gli elementi in modo omogeneo, evitando `absolute` posizionati manualmente se non per scopi precisi.
4. **Layout UX e Bottoni Flottanti**: I bottoni macro (Deposita/Preleva) possono coprire la lista su schermi piccoli. Assicurarsi di implementare logiche a scomparsa durante lo scroll con ricomparsa dopo inattività (es. 15s).
5. **Dettaglio vs Azione**: Non dare per scontato che un click su un utensile significhi "Movimento immediato". Il flusso corretto è: `Click su Riga -> Apri Modale Dettagli -> Visiona info -> Scegli Carico/Scarico -> Conferma Transazione`.
6. **Ricerca Barcode**: Non forzare l'utente a premere "Enter" per vedere i risultati. La ricerca deve filtrare la lista compatta in tempo reale digitando i caratteri (modalità ricerca manuale).
7. **Filtri dinamici**: Ricordarsi sempre che i filtri a tendina (nel Livello 3) devono essere dinamici e reagire ai dati. Non mostrare filtri che per le categorie selezionate risulterebbero completamente vuoti (tutti `null`).
8. **Layout App-Like (Single Screen 100vh)**: L'applicazione utilizza un layout a schermo fisso (App-like). L'altezza globale è bloccata a `100vh` (o `100dvh` per mobile) con `overflow-hidden` sul root. Lo scrolling è delegato esclusivamente ai contenitori interni specifici (come la lista/griglia utensili usando `flex-1 overflow-y-auto`). L'header e gli elementi di controllo principali devono rimanere sempre visibili, ma l'attenzione visiva (e lo spazio) deve essere focalizzata sui dati scrollabili. Su schermi piccoli, l'header si compatta per lasciare massimo spazio vitale alla lista.
9. **Prevenzione del Taglio dei Contorni (Active Outlines & Rings Safe-Zone)**: Nei contenitori scrollabili con `overflow-y-auto`, i contorni di focus/selezione (come i bordi `ring` arancioni) e le ombreggiature esterne (`box-shadow`) degli elementi estremi (il primo e l'ultimo della lista) vengono tagliati dal perimetro del contenitore di overflow. 
   - Aggiungere sempre un padding interno al contenitore scrollabile (es. `p-2 pb-6` o `px-2 pb-6`) per garantire zone sicure dove i contorni e le ombreggiature possano essere renderizzati interamente senza essere tranciati dal clip dell'overflow.
   - Forzare `shrink-0` (o `flex-shrink-0`) sulle righe o schede della lista per evitare che il browser ne alteri l'altezza per farli rientrare nel viewport, causando sovrapposizioni.
   - Evitare la doppia nidificazione di contenitori `.glass-panel` (es. card glass dentro una dashboard glass) poiché ombre multiple e sfocature sovrapposte riducono le performance e creano spiacevoli collisioni grafiche.
10. **Modali e Dialog (shadcn/ui vs custom)**: Per la gestione di modali e overlay (come Dettaglio Utensile o Login), utilizzare sempre i componenti nativi basati su Radix UI (es. `Dialog` di shadcn) al posto di overlay custom basati su `framer-motion` e div a tutto schermo. Questo risolve in modo nativo e robusto i problemi di focus-trap, scroll-lock del body e sovrapposizioni z-index non volute. Lo stile "glass" può essere facilmente applicato sovrascrivendo le classi del `DialogContent`.
11. **Nessuno Scroll Interno nei Modali di Dettaglio**: L'utente preferisce un design in cui **tutto il contenuto del modale sia visibile in un colpo d'occhio senza barre di scorrimento** (impostando `overflow-hidden` anziché `overflow-y-auto`). Per far stare tutto (dettagli, bottoni, testi) in una schermata (`max-h-[95vh]`), è necessario bilanciare accuratamente i padding (es. `p-6` o `p-8` massimo), ridurre il text-size, le icone e l'altezza dei pulsanti di azione. L'obiettivo è un popup denso, pulito e immediatamente fruibile senza scroll.
12. **Ottimizzazione Transizioni Dark Mode**: Le transizioni CSS prolungate (es. `duration-500`) su proprietà complesse come `backdrop-blur`, `box-shadow` e gradienti radiali di background causano gravi cali di frame rate. Limitare le transizioni grafiche per i cambi di tema esclusivamente a `background-color`, `border-color` e `color`.
### 💾 Regole di Sviluppo, Architettura e Backend
1. **Database Supabase**: Quando si creano o modificano query, ricordare che ci interfacciamo con la tabella `Utensili_B1` (per la giacenza degli utensili) e `movements_history` (per i log dei movimenti), oltre alla futura tabella `utenti`.
2. **Gestione dello Stato Globale (Zustand)**: L'app ha abbandonato il *prop-drilling* esteso in favore di **Zustand**. Ogni macro-area ha il suo Store dedicato (`src/store/useAuthStore`, `useInventoryStore`, `useFilterStore`, `useMovementStore`). Usare gli store in modo atomico per evitare re-render non necessari dei componenti figli.
3. **Separation of Concerns (SoC) e Custom Hooks**: Mai inserire massiccia logica di business (validazione campi dinamica, fetch API complessi) all'interno dei componenti UI (come i file `Modal.jsx`). Spostare sempre la logica all'interno di *Custom Hook* dedicati (es. `src/hooks/useAddToolForm.js`), mantenendo i file React come puri componenti visuali (View).
4. **Navigazione ed Espansione Layout (Shadcn Sidebar)**: L'architettura globale del layout è gestita tramite `SidebarProvider` e il set di componenti Sidebar di shadcn/ui. Su desktop agisce da pannello comprimibile, su mobile collassa in un Drawer nativo. Non creare soluzioni di navigazione laterale custom, usare questo standard.
5. **Autenticazione e Redirect (Login Guard)**: Verificare sempre la validità dell'utente (sessione attiva) esclusivamente a livello radice o di routing (`App.jsx` tramite lo store) prima di far scattare logiche figlie. Evitare di condizionare chiamate API o l'apertura di modali a controlli di autenticazione asincroni ritardati che potrebbero causare un fastidioso e improvviso redirect al `LoginScreen` durante l'interazione.
6. **Ordinamento Multi-Campo (Sorting)**: Quando vengono applicati ordinamenti su più colonne (Nome, Quantità, Ubicazione), questi devono essere gestiti nello strato dei dati (`useFilterStore`). Utilizzare metodi "locale-aware" come `localeCompare` con l'opzione `{ numeric: true }` in modo che stringhe contenenti numeri (come le misure dei diametri) vengano ordinate progressivamente (es. 2 prima di 10).

### 📱 Ottimizzazioni per App Mobile
1. **Supporto PWA e Installabilità**: Il progetto è configurato come PWA tramite Vite PWA Plugin. Quando si aggiungono nuove icone o rotte, assicurarsi che le cache di background del Service Worker siano aggiornate. Rispettare in modo categorico l'uso delle classi `env(safe-area-inset-*)` per il padding del container principale, altrimenti su mobile (aperto full-screen o da icona iOS) l'interfaccia si sovrapporrà all'hardware (notch, linea home).

---
*Nota per l'AI: Aggiorna questo file man mano che impari nuove preferenze dell'utente, risolvi bug complessi o definisci nuovi standard di progetto.*
