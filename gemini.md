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
- Navbar con informazioni utente e data; bottoni azione in linea (Carico, Scanner, Scarico).

### Richieste Attuali / Future
- **Gestione Utenti e Privilegi:** Operatori (solo operazioni base, no password per accedere) vs Admin (accesso completo con password).
- **Dettaglio Utensile Modal:** Cliccando un utensile nella griglia si apre un modale di dettaglio (invece di andare diretti al carico/scarico), con i tasti per procedere al movimento.
- **Ottimizzazione Griglia:** Nascondere pulsanti grandi in fase di scroll; mostrare solo colonne essenziali (`Descrizione`, `Ubicazione`, `Quantità`, `Stato`, `Codice`) per evitare scroll orizzontale. Tutte le altre info tecniche vanno nel Modale Dettaglio.
- **Dark Mode Toggle:** Implementazione di un toggle globale per tema chiaro/scuro in alto a destra.

## 🧠 Cosa ho imparato e Regole da Seguire (Errori da evitare)

### 🎨 Regole di UX/UI e Design
1. **Mai reinserire il colore "indigo"**: Il cliente ha richiesto specificamente un restyling verso il blu/ciano e arancione. Evitare l'utilizzo di `indigo` in nuove classi Tailwind.
2. **Attenzione allo scroll orizzontale**: Le tabelle/griglie devono essere sempre visibili senza scroll orizzontale. Se ci sono troppe informazioni, le colonne accessorie vanno nascoste e inserite nel "Dettaglio Utensile Modal".
3. **Proporzioni, Spaziature e Safe Zones (Ottimizzazione UI):** Il design deve massimizzare lo spazio dedicato ai contenuti utili, mantenendo il focus visivo al centro della schermata senza sprechi.
   - **Contenitori proporzionati:** Evitare riquadri o padding eccessivamente grandi attorno a elementi piccoli (es. icone o immagini). L'immagine e il testo principale devono dominare il contenitore in modo bilanciato ed essere chiaramente leggibili, evitando "scatole vuote" che tolgono spazio al resto degli elementi.
   - **Prevenzione Sovrapposizioni (Safe Area):** Gli elementi fissi (come i bottoni flottanti in basso o header sticky) non devono **mai** coprire i contenuti. Prevedere sempre un margine o `padding-bottom` abbondante (es. `pb-28`) nei contenitori scrollabili per far scorrere la lista oltre i bottoni.
   - **Layout Puliti:** Utilizzare strutture CSS robuste (`flex`, `grid` con i relativi `gap`) per distanziare gli elementi in modo omogeneo, evitando `absolute` posizionati manualmente se non per scopi precisi.
4. **Layout UX e Bottoni Flottanti**: I bottoni macro (Deposita/Preleva) possono coprire la lista su schermi piccoli. Assicurarsi di implementare logiche a scomparsa durante lo scroll con ricomparsa dopo inattività (es. 15s).
5. **Dettaglio vs Azione**: Non dare per scontato che un click su un utensile significhi "Movimento immediato". Il flusso corretto è: `Click su Riga -> Apri Modale Dettagli -> Visiona info -> Scegli Carico/Scarico -> Conferma Transazione`.
6. **Ricerca Barcode**: Non forzare l'utente a premere "Enter" per vedere i risultati. La ricerca deve filtrare la lista compatta in tempo reale digitando i caratteri (modalità ricerca manuale).
7. **Filtri dinamici**: Ricordarsi sempre che i filtri a tendina (nel Livello 3) devono essere dinamici e reagire ai dati. Non mostrare filtri che per le categorie selezionate risulterebbero completamente vuoti (tutti `null`).
8. **Prevenzione del Blocco dello Scroll (Scroll Lock Prevention)**: Non bloccare mai l'altezza dei contenitori delle viste principali (evitare `h-full` o `h-screen` su div interni dinamici) e non usare `overflow-hidden` sul tag `<main>` o altri contenitori generali. Se il contenuto (come griglie di card o liste) supera l'altezza del viewport, la pagina deve poter scorrere naturalmente sfruttando lo scrollbar globale del contenitore radice. Non accoppiare mai altezze fisse e `overflow-hidden` su contenitori con dati dinamici che potrebbero crescere in futuro.
9. **Prevenzione del Taglio dei Contorni (Active Outlines & Rings Safe-Zone)**: Nei contenitori scrollabili con `overflow-y-auto`, i contorni di focus/selezione (come i bordi `ring` arancioni) e le ombreggiature esterne (`box-shadow`) degli elementi estremi (il primo e l'ultimo della lista) vengono tagliati dal perimetro del contenitore di overflow. 
   - Aggiungere sempre un padding interno al contenitore scrollabile (es. `p-2 pb-6` o `px-2 pb-6`) per garantire zone sicure dove i contorni e le ombreggiature possano essere renderizzati interamente senza essere tranciati dal clip dell'overflow.
   - Forzare `shrink-0` (o `flex-shrink-0`) sulle righe o schede della lista per evitare che il browser ne alteri l'altezza per farli rientrare nel viewport, causando sovrapposizioni.
   - Evitare la doppia nidificazione di contenitori `.glass-panel` (es. card glass dentro una dashboard glass) poiché ombre multiple e sfocature sovrapposte riducono le performance e creano spiacevoli collisioni grafiche.



### 💾 Regole di Sviluppo e Backend
1. **Database Supabase**: Quando si creano o modificano query, ricordare che ci interfacciamo con la tabella `Utensili_B1` (per la giacenza degli utensili) e `movements_history` (per i log dei movimenti), oltre alla futura tabella `utenti`.

---
*Nota per l'AI: Aggiorna questo file man mano che impari nuove preferenze dell'utente, risolvi bug complessi o definisci nuovi standard di progetto.*
