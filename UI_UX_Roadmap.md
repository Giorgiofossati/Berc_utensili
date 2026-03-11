# ROADMAP UI/UX: Magazzino Utensili Bercella

L'obiettivo è trasformare l'applicazione in una dashboard più pulita, focalizzata sulle azioni rapide e una navigazione intuitiva "a cascata" per la ricerca degli utensili.

## 🎨 Nuova Architettura Visiva

### 1. Header (Info Bar)
- **Sinistra**: Pulsante/Menu "UTENTE" (Collassabile per gestione account e impostazioni).
- **Destra**: Visualizzazione **DATA ATTUALE** in formato `GG/MM/AAAA`.
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

### 3. Footer (Quick Actions)
- **Pulsante CARICA (Verde)**: Grande, a sinistra.
- **Pulsante BARCODE (Centrale/Cyan)**: Icona scanner prominente.
- **Pulsante SCARICA (Rosso)**: Grande, a destra.

---

## ✅ Feature Tracker

- [ ] **Nuova Struttura Root**: Layout orizzontale/verticale fedele allo sketch.
- [ ] **Carousel Component**: Implementazione del selettore a scorrimento.
- [ ] **Cascading Filter Logic**: Stato React per navigare tra i livelli di scelta.
- [ ] **Quick Action Bar**: Footer fisso con i 3 macro-pulsanti.
- [ ] **User Dropdown**: Menu a scomparsa per le impostazioni.
- [ ] **Premium Refinement**: Blur, gradienti sottili e micro-interazioni.
