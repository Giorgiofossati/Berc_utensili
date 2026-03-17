# ROADMAP UI/UX: Magazzino Utensili Bercella

L'obiettivo è trasformare l'applicazione in una dashboard più pulita, focalizzata sulle azioni rapide e una navigazione intuitiva "a cascata" per la ricerca degli utensili.

**Interfaccia responsive**
  -Tutti gli elementi devono adattarsi ai diversi schermi (Responsive Design)
  -Se necessario crea un layout apposito per mobile
  - Se gli elementi non stanno nello schermata crea una barra di scorrimento laterale ben visibile e cliccabile per scorrere la lista.


## 🎨 Nuova Architettura Visiva

### Gestione Colori (Look Industriale Professionale)
- **Primary / Accent**: Blu / Ciano (es. `#0ea5e9` o `#06b6d4`) per gli elementi principali, card attive, bordi, focus e selezioni. Lo stile non deve usare più il viola (indigo).
- **Secondary / Action / Highlight**: Arancio (es. `#f97316` o `#ea580c`) per pulsanti di reset, alert o badge secondari per spezzare il monocromatismo.
- Restano invariati: i background e i colori base di struttura (Slate/Black) e i semafori funzionali logistici (Verde carico, Rosso scarico).

### 1. Header (Info Bar)
- **Sinistra**: Pulsante/Menu "UTENTE" (Collassabile per gestione account e impostazioni). Aggiornato con padding ridotti per salvare spazio verticale.
- **Destra**: Visualizzazione **DATA ATTUALE** in formato `GG/MM/AAAA`. Layout compatto.
- **Stile**: Minimalista, Glassmorphism leggero.

### 2. Area Centrale (Navigazione a Cascata)
- **2 modalità** Carosello (modalità di default) o filtri a tendina, ci deve essere un pulsante che permette di passare da una modalità all'altra e cambia la visualizzazione.
- **Carosello di Card**: Invece di una griglia statica, usiamo grandi card orizzontali, tra cui scorrere Dx e Sx, focusa sulla card centrale e 2 card a Dx e Sx sempre visibili. Quando clicco su una card si apre un'altra schermata con le card di livello successivo.
Aggiorna sempre in modo dinamico i filtri visibli se per gli elementi di una classe selezionata una colonna è "null" non mostrare quel filtro.
- **Logica a livelli**:
  - **Livello 0**: (carosello) Scegli "TIPOLOGIA" (Fresa, Punta, Maschio, etc.).
  - **Livello 1**: (carosello) Scegli "FORMA" (Torica, Cilindrica, etc., filtrata dal Livello 0).
  - **Livello 2**: (Lista compatta) Scegli "DIAMETRO" (Elenco dei diametri disponibili, filtrata dal Livello 1).
  - **Livello 3**: (Lista Compatta a Griglia) Elenco Utensili corrispondenti ai filtri (dettagli tecnici di lato sulla riga).
    -I dettagli principali da mostrare sono:
      1- Descrizione aggregata (Tipologia+forma+diametro+Passo+Tolleranza+materiale+rivestimento+Sistema di misura)
      2-Ubicazione
      3-stato
      4-Quantità
      5-codice
      6-serialnumber
    -in questo livello 3, in alto devono comparire dei menu a tendina con cui filtrare le categorie rimanenti (Lunghezza, materiale, tolleranza, passo, angolo, Rivestimento, stato, fornitore, lavorazione, sistema di misura)
- **Animazioni**: Transizioni fluide tra i livelli (Framer Motion).

 - **filtri a tendina**: Quando da carosello cambio a filtri tendina premendo l'icona devo visualizzare un elenco a griglia compatto che mostra gli utensili corrispondenti ai filtri che si selezionano, **Stile** stile della griglia card orizzontali sottili compatte che mostrano tutti gli elementi filtrati, se sono troppi crea una barra di scorrimento laterale ben visibile e cliccabile per scorrere la lista.

### 3. Inline Action Buttons (Ex Footer)
- I pulsanti di azione (Carico/Scarico/Scanner) sono stati centralizzati e spostati in modalità "Inline" sopra la sezione del carosello/filtri per evitare l'overlapping e recuperare spazio.
- **Pulsante CARICA (Verde)**
- **Pulsante BARCODE (Centrale/Cyan)**
- **Pulsante SCARICA (Rosso)**

---

## ✅ Feature Tracker

- [x] **Nuova Struttura Root**: Layout orizzontale/verticale fedele allo sketch.
- [x] **Carousel Component**: Implementazione del selettore a scorrimento.
- [x] **Cascading Filter Logic**: Stato React per navigare tra i livelli di scelta.
- [x] **Quick Action Bar**: Footer fisso con i 3 macro-pulsanti.
- [x] **User Dropdown**: Menu a scomparsa per le impostazioni.
- [x] **Premium Refinement**: Blur, gradienti sottili e micro-interazioni.
- [x] **Industrial Look**: Palette Blu/Ciano e Arancio implementata con successo.
