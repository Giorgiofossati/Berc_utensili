# Task List — Interfaccia Utensili Bercella

## 🔴 Bug / Problemi Attuali

### 1. Ricerca Barcode non funziona correttamente
- [x] Reimposta le spaziature tra elementi che si sovrappongono nella sezione scanner
- [x] Quando digito il codice manualmente si deve aggiornare la schermata entrando in **modalità ricerca manuale** dove vedo una lista compatta che si aggiorna **in tempo reale** digitando il codice. Attualmente funziona solo premendo Enter e apre direttamente il modale movimento senza mostrare risultati intermedi.
- [x] La lista in tempo reale deve mostrare tutti gli utensili il cui codice corrisponde ai caratteri inseriti (filtro parziale)

---

## 🟡 Funzionalità Mancanti (da UI_UX_Roadmap.md)

### 2. Toggle Carousel ↔ Filtri a Tendina
- [x] Aggiungere un **pulsante/icona di toggle** visibile nell'area centrale per passare dalla modalità **Carousel** alla modalità **Filtri a Tendina** e viceversa
- [x] In modalità filtri a tendina: mostrare un elenco a **griglia compatta** con card orizzontali sottili che mostrano gli utensili filtrati
- [x] Se gli utensili filtrati sono troppi, mostrare una **barra di scorrimento laterale** ben visibile e cliccabile

### 3. Livello 2 — Selezione DIAMETRO (mancante)
- [x] Dopo Tipologia (L0) → Forma (L1), aggiungere un **Livello 2** che mostra una **lista compatta** dei DIAMETRI disponibili (filtrati dai livelli precedenti)
- [x] I diametri devono essere presentati come lista compatta, non come card del carousel

### 4. Livello 3 — Lista Utensili a Griglia (mancante)
- [x] Dopo la selezione del diametro, mostrare una **lista compatta a griglia** degli utensili corrispondenti
- [x] Ogni riga deve mostrare i seguenti dettagli tecnici:
  1. **Descrizione aggregata** (Tipologia + Forma + Diametro + Passo + Tolleranza + Materiale + Rivestimento + Sistema di Misura)
  2. **Ubicazione**
  3. **Stato**
  4. **Quantità**
  5. **Codice**
  6. **Serial Number**
- [x] In alto nel Livello 3: aggiungere **menu a tendina** per filtrare le categorie rimanenti:
  - Lunghezza, Materiale, Tolleranza, Passo, Angolo, Rivestimento, Stato, Fornitore, Lavorazione, Sistema di Misura

### 5. Filtri Dinamici (mancante)
- [x] I filtri visibili devono aggiornarsi **dinamicamente**: se per gli elementi di una classe selezionata una colonna è `null` (tutti i valori sono null), quel filtro **non deve essere mostrato**

---

## 🟢 Funzionalità Già Implementate (da verificare e raffinare)

### ✅ Header (Info Bar)
- [x] Pulsante UTENTE a sinistra con menu collassabile
- [x] Data attuale in formato GG/MM/AAAA a destra
- [x] Stile Glassmorphism

### ✅ Carousel Component (Livello 0 e 1)
- [x] Carousel di card orizzontali con navigazione Dx/Sx
- [x] Card centrale in focus con 2 card laterali visibili
- [x] Click su card → navigazione al livello successivo
- [x] FRESA come prima categoria
- [x] Animazioni con Framer Motion (spring transitions)
- [x] Frecce e drag per lo scorrimento
- [x] Pulsante "indietro" per tornare al livello precedente

### ✅ Footer (Quick Actions)
- [x] Pulsante CARICO (Verde) a sinistra
- [x] Pulsante BARCODE/SCANNER (Cyan) al centro
- [x] Pulsante SCARICO (Rosso) a destra

### ✅ Altro
- [x] Modale per movimento Carico/Scarico
- [x] Storico movimenti
- [x] Toast notifications
- [x] Premium design con Glassmorphism

### 6. Layout e Responsive Design
- [x] Assicurarsi che tutti gli elementi si adattino ai diversi schermi (Responsive Design).
- [x] Creare una barra di scorrimento laterale ben visibile e cliccabile per scorrere la lista se gli elementi non stanno nella schermata.

### 7. Gestione Colori (Look Industriale Professionale)
- [x] Rimuovere l'utilizzo del colore `indigo` dal CSS globale e dai componenti (es. `accent-indigo`).
- [x] Creare e utilizzare un nuovo `accent-blue` o focalizzarsi su `accent-cyan` per bottoni, selezioni e highlight primari.
- [x] Aggiungere `accent-orange` per contrasti e comandi secondari di reset/avviso.
- [x] Aggiornare in `App.jsx` e `index.css` ogni riferimento ai vecchi colori per completare il restyle.

---

## 🔵 Funzionalità Future (Sessione di Domani)

### 8. Utenti e Privilegi
- [x] Creare la tabella `utenti` su Supabase (Nome, Cognome, Codice ID, Ruolo, Password).
- [x] Implementare la selezione utente con ricerca per nome o ID nella UI.
- [x] Gestione permessi:
  - **Operatore**: Solo filtri e operazioni di carico/scarica (senza password).
- [x] Admin: Tutti i privilegi + accesso protetto da password (carica/scarica).
### 9. UX: Dettaglio Utensile Modal (Prima dei movimenti)
- [x] Quando si clicca un utensile riga dalla griglia, aprire un Modal di **Dettaglio Utensile** invece che passare direttamente all'operazione.
- [x] Il modale non deve avere preselezionata "Operazione: Scarico". Deve mostrare un riepilogo pulito di tutte le informazioni utili dell'utensile (es. Ubicazione, Materiale e ogni campo non `null` nel DB per quell'oggetto).
- [x] Rimuovere temporaneamente il selettore di quantità dalla prima schermata. Sostituirlo con due pulsanti dedicati: **"Carico"** e **"Scarico"**.
- [x] Cliccando "Carico" o "Scarico", l'UI si "riformatta" (o passa allo step 2) mostrando il selettore di Quantità e il tasto di **Conferma Transazione**.
- [x] Confermare l'operazione aggiorna la giacenza in `Utensili_B1` e salva il log nella `movements_history`.

- [x] **Risoluzione Sovrapposizione Pulsanti Action**: Invece di nascondere i pulsanti al bottom dello schermo, spostarli direttamente nell'header ai lati del titolo, rimuovendo definitivamente il pannello bottom e qualsiasi sovrapposizione visiva.
- [x] **Risoluzione Scrolling Orizzontale Griglia**: Attualmente la griglia mostra troppe colonne orizzontali (Materiale, Passo, Tolleranza, ecc.). Per risolvere:
  - [x] Ridurre le colonne visibili nella griglia alle sole fondamentali: `Descrizione`, `Ubicazione`, `Quantità`, `Stato` e `Codice`.
  - [x] Nascondere del tutto le colonne tecniche accessorie dalla tabella principale.
  - [x] Sfruttare il neonato **"Dettaglio Utensile Modal"** (cliccando sulla riga) come unico punto per visionare tutte le specifiche tecniche avanzate. In questo modo la tabella diventa responsiva, non richiede scroll orizzontale e l'interfaccia resta modernissima e pulita.

- [x] Tracciare l'utente nei movimenti di magazzino.

### 10. Gestione Ordini (Workflow Caso 1)
- [ ] Pianificare e implementare una funzione per gestire gli ordini quando un utensile ha quantità insufficiente o nulla.
- [ ] Predisporre eventuale tabella Supabase `ordini` se necessaria, o definire il formato delle richieste.

### 11. Creazione Nuovo Articolo (Workflow Caso 2)
- [ ] Implementare un modale (`AddToolModal`) per aggiungere un nuovo articolo non presente a magazzino.
- [ ] Creare il form con tutti i campi del database `Utensili_B1` richiesti.
- [ ] Collegare l'azione al pulsante "Nuovi Utensili" attualmente disconnesso nell'Header.