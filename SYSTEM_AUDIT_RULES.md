# Protocollo Scientifico di UX/UI & Sistema di Self-Audit
## Standard Ingegneristici, Leggi Psicofisiche e Regole di Validazione per Agenti AI

> **Finalità del Documento**: La progettazione dell'esperienza utente (UX) e dell'interfaccia (UI) in un ambiente gestionale/industriale come **Bercella Utensili** non è una questione di gusto decorativo soggettivo, ma una disciplina scientifica e ingegneristica con oltre 70 anni di storia (HCI, ergonomia cognitiva, psicologia della percezione, Human Factors Engineering).  
> Questo documento definisce il **framework teorico e la matrice operativa di Self-Audit** che ogni agente AI (e sviluppatore) ha l'obbligo di applicare prima di confermare qualsiasi modifica al codice o nuova funzionalità.

---

## 1. Il Principio Fondamentale di Self-Audit per gli Agenti

Prima di considerare conclusa qualsiasi implementazione, ogni agente AI deve porsi sistematicamente due domande:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  1. "La cosa che sto realizzando o modificando infrange qualcuna di queste leggi o standard?"    │
│  2. "Se sì, come la miglioro immediatamente per conformarla al massimo standard ingegneristico?" │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Se la risposta alla prima domanda evidenzia anche una sola criticità (es. touch target troppo piccolo, sovraccarico cognitivo, ritardo di feedback, assenza di affordance), l'agente **non deve rilasciare la modifica**, ma applicare subito la contromisura prescritta.

---

## 2. Le Leggi Matematiche ed Empiriche della UX/UI

### 2.1 Legge di Fitts (1954) — Modello Matematico del Movimento Umano
$$T = a + b \cdot \log_2\left(1 + \frac{D}{W}\right)$$

- **Significato matematico**: Il tempo $T$ necessario per raggiungere un bersaglio (pulsante, input, icona) cresce logaritmicamente con la distanza $D$ dal punto di partenza e decresce all'aumentare dell'area/larghezza $W$ del bersaglio.
- **Implicazioni ergonomiche**:
  1. **Touch Target Minimo**: Su tablet/smartphone o touchscreen d'officina, l'area interattiva minima per le dita (spesso con guanti) deve essere di almeno **44×44px** (o `min-h-[44px]` / `p-3`).
  2. **Bordi dello Schermo ($W \to \infty$)**: Gli elementi ancorati ai bordi del viewport (es. navbar superiore fissa, bottom navigation bar, pulsanti laterali) hanno un indice di difficoltà ridotto perché il cursore o il dito è fermato naturalmente dal perimetro dello schermo.
  3. **Raggruppamento Spaziale**: Le azioni frequenti o correlate devono risiedere a distanza $D$ minima dal punto di interazione precedente (es. frecce incremento quantità affiancate al valore, non distanti 500px).

---

### 2.2 Legge di Hick-Hyman (1952) — Tempo di Decisione Logaritmico
$$T = b \cdot \log_2(n + 1)$$

- **Significato matematico**: Il tempo di reazione mentale $T$ necessario per compiere una scelta aumenta in proporzione al logaritmo del numero $n$ di alternative visibili contemporaneamente.
- **Implicazioni ergonomiche**:
  1. **Riduzione della Complessità Istantanea**: Evitare schermate con troppe opzioni arbitrarie concorrenti.
  2. **Flussi a Step & Navigazione a Cascata**: Strutturare le operazioni complesse in gerarchie chiare (es. Tipologia $\to$ Forma $\to$ Diametro $\to$ Tabella Utensili) o sequenze a passaggi progressivi (Wizard/Modali a fasi).
  3. **Filtri Dinamici Intelligenti**: Se una proprietà ha valore nullo o non è applicabile al contesto attuale, deve essere nascosta per non incrementare $n$ inutilmente.

---

### 2.3 Legge di Miller (1956) & Teoria del Chunking — Limiti della Memoria di Lavoro
$$\text{Capacità} \approx 7 \pm 2 \quad (\text{e studi contemporanei di Cowan indicano } 4 \pm 1)$$

- **Significato psicologico**: La memoria di lavoro a breve termine dell'essere umano può trattenere ed elaborare simultaneamente solo un numero limitatissimo di informazioni non relazionate.
- **Implicazioni ergonomiche**:
  1. **Chunking delle Informazioni**: Codici seriali, SKU, matricole, codici utensile e numeri lunghi devono essere suddivisi visivamente in blocchi discreti leggibili (es. `F-TR-D12` anziché `FTRD12998371`).
  2. **Scaglione Colonne Tabelle**: In tabelle dense da consultazione rapida, evidenziare al massimo 3-4 informazioni cardine per riga (Icona, Descrizione, Codice, QTY), delegando gli attributi secondari al dettaglio su richiesta.
  3. **Zero Memorizzazione Tra Viste**: L'operatore non deve mai ricordare a memoria un codice letto in una schermata precedente per digitarlo in quella successiva; i dati devono viaggiare con il contesto.

---

### 2.4 Principi della Gestalt (Psicologia della Percezione Visiva)
Il cervello umano organizza automaticamente i segnali ottici in schemi unificati secondo precise regole percettive:
- **Prossimità**: Elementi vicini tra loro nello spazio sono istintivamente percepiti come parte dello stesso gruppo logico (es. etichetta posizionata a 4px dal rispettivo input e a 24px dall'input successivo).
- **Somiglianza (Invarianza)**: Elementi visivamente identici per colore, forma, raggio o tipografia condividono lo stesso scopo o comportamento (es. tutti i bottoni verdi `.action-btn-carica` effettuano depositi; tutti i bottoni ciano confermano).
- **Regione Comune (Enclosure)**: Gli elementi racchiusi all'interno dello stesso bordo, superficie o card delimitata (es. `.glass-panel`) vengono elaborati istantaneamente come appartenenti alla medesima unità semantica.
- **Chiusura & Continuità**: Le liste e tabelle devono presentare allineamenti coerenti per permettere all'occhio di scorrere lungo traiettorie lineari naturali senza sobbalzi o deviazioni.

---

### 2.5 Legge di Jakob (Jakob Nielsen, NN/g) — Interiorizzazione dei Modelli Mentali
> *"Gli utenti trascorrono la maggior parte del loro tempo su altre piattaforme e applicazioni; pertanto, si aspettano che il vostro sistema funzioni esattamente nello stesso modo in cui funzionano tutti gli altri."*

- **Implicazioni ergonomiche**:
  1. **Zero reinventazione della ruota**: Non inventare pattern di navigazione bizzarri o gesture esotiche.
  2. **Convenzioni consolidate**: 
     - La lente d'ingrandimento indica la ricerca istantanea.
     - La 'X' in alto a destra chiude il modale o resetta il campo.
     - I controlli numerici a incremento usano `-` a sinistra e `+` a destra.
     - L'icona dell'utente indica profilo/ruolo; l'icona ingranaggio indica impostazioni/amministrazione.
  3. **Rompere le convenzioni causa un aumento esponenziale dell'attrito cognitivo e del tasso di errore d'officina.**

---

## 3. Standard Internazionali & Normative Ufficiali

### 3.1 Serie ISO 9241 (Ergonomics of Human-System Interaction)
- **ISO 9241-11 (Definizione Scientifica di Usabilità)**:
  L'usabilità non è estetica, ma è definita da tre pilastri quantitativi misurabili:
  1. **Efficacia (Effectiveness)**: Grado di accuratezza e completezza con cui gli operatori raggiungono il loro scopo (es. l'utensile cercato viene trovato e scaricato correttamente senza errori di giacenza).
  2. **Efficienza (Efficiency)**: Quantità di risorse impiegate per completare l'obiettivo (tempo in secondi, numero di tap/click, carico mentale ed esitazioni).
  3. **Soddisfazione (Satisfaction)**: Comfort operativo, assenza di frustrazione e accettabilità soggettiva nell'uso quotidiano continuativo.
- **ISO 9241-210 (Human-Centred Design Process)**: Obbligo di progettare intorno alle reali condizioni fisiche e cognitive dell'operatore (rumore d'officina, fretta, illuminazione variabile, polvere o guanti da lavoro).

### 3.2 WCAG 2.1 AA / ISO/IEC 40500 (Web Content Accessibility Guidelines)
- **Contrasto Cromatico Minimo Rigoroso**:
  - Testo standard (< 18pt o < 14pt grassetto): **rapporto di contrasto minimo 4.5:1** rispetto allo sfondo.
  - Testo grande o elementi grafici interattivi/bordi di focus: **rapporto di contrasto minimo 3:1**.
- **Navigabilità da Tastiera Completa**:
  - Ogni azione eseguibile con mouse o touch deve essere accessibile da tastiera (`Tab`, `Enter`, `Escape`, `Frecce`).
  - L'indicatore di focus visivo (`focus-visible:ring-2`) non deve mai essere rimosso con `outline: none` senza un sostituto ad alto contrasto.
- **Target Size (Success Criterion 2.5.5 / 2.5.8)**: Target minimi di tocco di almeno 24×24px assoluti e 44×44px raccomandati per ergonomia touch di grado industriale.

---

## 4. Le Euristiche di Valutazione (Nielsen, Norman, Shneiderman)

### 4.1 Visibilità dello Stato del Sistema
- Il sistema deve sempre comunicare all'utente cosa sta accadendo attraverso un feedback chiaro, immediato (< 100ms per feedback visivo, indicatori di stato durante fetch o transazioni Supabase).
- Se un'operazione è in corso: stato `loading`, pulsante disabilitato con spinner, testo che spiega l'elaborazione (es. "Salvataggio in corso...").

### 4.2 Prevenzione Proattiva degli Errori
- È mille volte superiore prevenire l'errore a monte che mostrare un messaggio di errore a posteriori.
- *Esempi pratici Bercella*:
  - Disabilitare o bloccare preventivamente il pulsante di scarico se la quantità digitata supera la giacenza disponibile a magazzino (`quantity > stock`).
  - Forzare input esclusivamente numerici (`type="number"` o filtri su stringhe) per giacenze e quote.
  - Chiedere conferma esplicita per azioni distruttive irreversibili (eliminazione utente, reset inventario).

### 4.3 Riconoscimento Anziché Richiamo (Recognition over Recall)
- Ridurre al minimo il carico cognitivo: l'operatore deve riconoscere visivamente le informazioni attraverso icone di forma, miniature di utensili e descrizioni esplicite, senza dover ricordare a memoria codici geometrici astratti.

### 4.4 Affordance e Signifiers (Don Norman)
- Un elemento interattivo deve dichiarare la propria funzionalità attraverso la sua forma:
  - Un pulsante deve apparire cliccabile/toccabile (elevazione, contorno, cambio stato hover/active).
  - Un campo modificabile deve avere lo stile input standard con cursore visibile e placeholder esplicito.
  - I testi statici non devono simulare pulsanti; i pulsanti non devono sembrare semplici etichette.

---

## 5. Metriche Quantitative di Usabilità

Nel valutare o collaudare un flusso software, la qualità è misurata oggettivamente attraverso:

| Metrica | Formula / Unità di Misura | Cosa Rileva nel Gestionale Bercella |
| :--- | :--- | :--- |
| **Task Success Rate (TSR)** | $\frac{\text{Operazioni completate con successo}}{\text{Totale tentativi}} \times 100$ | Misura l'efficacia: l'operatore riesce a prelevare o depositare l'utensile senza chiedere aiuto? |
| **Time on Task (ToT)** | Durata temporale (secondi) dall'apertura al completamento | Misura l'efficienza: quanti secondi perde l'operatore al terminale prima di tornare alla macchina CNC? |
| **Error Rate** | Numero di errori o tap a vuoto (*rage clicks*) per operazione | Identifica elementi ambigui, etichette fuorvianti o ritardi di risposta dell'interfaccia. |
| **System Usability Scale (SUS)** | Punteggio standardizzato psicometrico da 0 a 100 | Valutazione complessiva dell'usabilità percepita (obiettivo target > 80: eccellenza). |
| **Eye-Tracking / Scanning Patterns** | Analisi fissazioni visive (F-Pattern in lettura, Z-Pattern in dashboard) | Verifica che gli elementi decisionali vitali (Giacenza, Codice, Azioni) siano posti nei punti caldi di fissazione. |

---

## 6. L'Aesthetic-Usability Effect nel Contesto Industriale Bercella
*(Kurosu & Kashimura 1995; Tractinsky 1997)*

La pulizia estetica, la simmetria geometrica e l'armonia visiva non sono vanità decorativa:
- Gli utenti percepiscono istintivamente un'interfaccia elegante, ordinata e rifinita come **più semplice da utilizzare, più sicura e più affidabile**.
- In un'officina meccanica CNC, un layout trascurato o disallineato genera sfiducia, percezione di instabilità del software e frettolosità nell'inserimento dati.
- **Convenzioni cromatiche industriali**:
  - Il **Verde Smeraldo** (`#10b981`) per il Carico/Deposito non è una scelta casuale: si conforma al modello mentale universale "aggiunta, via libera, incremento sicuro".
  - Il **Rosso Cremisi / Rosa Rubino** (`#f43f5e`) per lo Scarico/Prelievo segnala cautela, decrescita delle scorte e potenziale esaurimento.
  - L'**Arancione Industriale** (`#f97316`) è riservato ad alert, scorte sotto soglia e ordini fornitori.
  - Il **Ciano Tecnico** (`#0ea5e9`) guida il focus operativo neutrale e la navigazione attiva.

---

## 7. MATRICE OPERATIVA DI SELF-AUDIT PER GLI AGENTI AI

Ogni volta che analizzi, crei o modifichi una schermata, un componente o una funzione, esegui questo audit punto per punto:

---

### Audit 1: Ergonomia Tattile & Aree di Selezione (Legge di Fitts & WCAG)
* **❓ DOMANDA DI CONTROLLO:**
  > *"La modifica che sto realizzando include elementi interattivi, icone o pulsanti con area di tocco inferiore a 44×44px o disposti in posizioni scomode da raggiungere su tablet/touchscreen?"*
* **🛠️ SE SÌ, COME MIGLIORARLA:**
  - Estendi l'area di tocco con padding o dimensioni esplicite: usa `min-h-[44px] min-w-[44px]`, oppure `p-2.5 sm:p-3 flex items-center justify-center`.
  - Se l'icona è piccola (es. 18px), inseriscila dentro un contenitore interattivo che mantenga la dimensione minima di sicurezza di 44px.
  - Disponi le azioni primarie e frequenti (es. bottoni di conferma transazione, tasti numerici `+` / `-`) lungo il flusso naturale della mano o in posizioni sticky facili da toccare.

---

### Audit 2: Carico Cognitivo & Complessità della Scelta (Legge di Hick & Miller)
* **❓ DOMANDA DI CONTROLLO:**
  > *"Sto mostrando troppe opzioni simultanee, campi non necessari o tabelle con troppi elementi orizzontali senza gerarchia, costringendo l'operatore a leggere o memorizzare troppi dati?"*
* **🛠️ SE SÌ, COME MIGLIORARLA:**
  - Applica il **Chunking**: raggruppa i dati correlati in sezioni distinte o card con chiara etichetta overline (`.app-overline`).
  - Nascondi o collassa le informazioni secondarie: su mobile, mostra solo i campi vitali (Icona, Descrizione, Quantità) e delega dettagli accessori al modale.
  - Elimina le opzioni non pertinenti: se una colonna o un filtro contiene solo valori nulli per la selezione corrente, rimuovilo dall'interfaccia (`Filtri dinamici`).
  - Se un form ha più di 6-7 campi correlati, suddividilo in step logici o gruppi visivi distinti.

---

### Audit 3: Raggruppamento Visivo, Allineamenti & Contorni (Principi della Gestalt)
* **❓ DOMANDA DI CONTROLLO:**
  > *"Ci sono elementi semanticamente correlati che visivamente appaiono slegati, oppure elementi indipendenti che si confondono? Ci sono disallineamenti, liste flex con larghezze arbitrarie, card affiancate di altezze diverse o modali compressi/sproporzionati con titoli tagliati?"*
* **🛠️ SE SÌ, COME MIGLIORARLA:**
  - **Regione Comune & Card**: Raggruppa i contenuti legati tra loro dentro contenitori con perimetro definito (`.glass-panel rounded-[20px] p-4`).
  - **Scala Dimensionale Modali (4 Tiers)**: Assegna a ciascun popup la larghezza appropriata alla densità informativa:
    1. *Tier 1 (Alert/Conferme)*: `sm:max-w-md` (~448px), padding `p-6 sm:p-8`.
    2. *Tier 2 (Form Operativi/Commesse)*: `sm:max-w-2xl md:max-w-3xl` (~672-768px), 2 colonne per input compatti, padding `p-6 sm:p-8`.
    3. *Tier 3 (Dettaglio Tecnico/Movimenti)*: `sm:max-w-3xl md:max-w-4xl` (~768-896px).
    4. *Tier 4 (Cataloghi/Distinte Fullscreen)*: `sm:max-w-6xl md:max-w-7xl h-[88dvh]`.
  - **Prevenzione Troncature Titoli & Text Wrapping**: Mai usare `truncate` su frasi o titoli di modali ("MODIFICA COMME..."). Separare l'azione dal codice (es. badge mono dedicato). I pulsanti primari non devono mai andare a capo su due righe (`whitespace-nowrap font-black tracking-wider`).
  - **Regola Split Cards**: Nelle card affiancate (es. Login), usa sempre `items-stretch` sul genitore e `h-full flex flex-col justify-between` sui figli, assicurando identico raggio (`rounded-[32px]`) e allineamento millimetrico di header e footer.
  - **Unificazione Tabelle**: Non usare mai liste flex manuali `justify-between` con colonne galleggianti. Usa sempre la griglia ufficiale unificata `<ToolsGrid hideExtraFilters={true} />` (TanStack Table v8) con colonne a larghezza bloccata e virtualizzazione.

---

### Audit 4: Prevenzione Errori & Feedback di Stato (Nielsen & ISO 9241-11)
* **❓ DOMANDA DI CONTROLLO:**
  > *"L'operatore può compiere un'azione errata o distruttiva senza che il sistema lo blocchi o lo avverta preventivamente? L'interfaccia rimane inerte dopo un clic senza indicare che l'operazione è in corso?"*
* **🛠️ SE SÌ, COME MIGLIORARLA:**
  - **Blocco Preventivo**: Disabilita il pulsante di scarico (`disabled={quantity > stock || quantity <= 0}`) e mostra un avviso visivo in tempo reale con badge arancione o rosso.
  - **Feedback Istantaneo**: Aggiungi stati di caricamento immediati con spinner, opacità ridotta (`opacity-70 pointer-events-none`) e testi di stato inequivocabili.
  - **Conferma Distruttiva**: Richiedi un modale di sicurezza o un doppio passaggio esplicito prima di cancellare record o reimpostare inventari.

---

### Audit 5: Convenzioni Mentali & Affordance (Legge di Jakob & Don Norman)
* **❓ DOMANDA DI CONTROLLO:**
  > *"Ho introdotto un'interazione insolita, un pulsante che non sembra cliccabile, o ho invertito i colori convenzionali (es. usare il rosso per confermare o il ciano per un'azione distruttiva)?"*
* **🛠️ SE SÌ, COME MIGLIORARLA:**
  - Conformati rigorosamente al Design System ufficiale:
    - **Verde Smeraldo** (`.action-btn-carica`): solo ed esclusivamente per Carico / Deposito / Incremento.
    - **Rosso / Rosa** (`.action-btn-scarica`): solo ed esclusivamente per Scarico / Prelievo / Decremento.
    - **Ciano Primario** (`.action-btn-primary`): per conferme, login, salvataggi e focus standard.
    - **Arancione** (`.action-btn-order`): per alert scorte, ordini fornitore e reset filtri.
  - Non usare mai il colore `indigo` (vietato da standard).
  - Assicurati che ogni elemento cliccabile risponda con `cursor-pointer`, transizione fluida e reazione attiva (`active:scale-[0.98]`).

---

### Audit 6: Tipografia Semantica & Contrasto Visivo (WCAG 2.1 AA)
* **❓ DOMANDA DI CONTROLLO:**
  > *"Ho usato font monospace (`.app-caption`) per intere frasi di istruzione, provocando troncature sgradevoli? Ho inventato classi di testo non standard come `text-5xl` o `text-[13px]`? Il contrasto del testo sullo sfondo è insufficiente?"*
* **🛠️ SE SÌ, COME MIGLIORARLA:**
  - Rispetta la separazione tipografica del Design System:
    - `.app-caption` (`font-mono`): **solo per codici brevi, SKU, serial number e timestamp**. MAI per frasi o descrizioni operative.
    - `.app-body`: per tutti i testi di spiegazione, istruzioni, etichette e sottotitoli.
    - `.app-h1` / `.app-h2` / `.app-h3`: per i titoli gerarchici.
    - `.app-qty-sm` / `.app-qty-lg`: per quantità e numeri tabulari.
  - Verifica i contrasti: nessun testo chiaro grigio su sfondo bianco, né testo scuro su fondo scuro. Tutti i colori devono superare il rapporto 4.5:1.

---

### Audit 7: Robustezza Tecnica, Layout App-Like & Mobile Safe-Zones
* **❓ DOMANDA DI CONTROLLO:**
  > *"L'interfaccia genera barre di scorrimento orizzontali non volute su smartphone? I bottoni flottanti coprono i contenuti scrollabili? I contorni di focus (`ring`) o le ombreggiature esterne vengono tagliati dall'overflow?"*
* **🛠️ SE SÌ, COME MIGLIORARLA:**
  - Mantieni il layout a schermo bloccato (`100vh`/`100dvh` con `overflow-hidden` a livello radice). Lo scroll appartiene solo a contenitori dedicati (`flex-1 min-h-0 overflow-y-auto`).
  - Aggiungi sempre padding interno sicuro (`p-2 pb-24` o `pb-32`) sui contenitori scrollabili per impedire sovrapposizioni con bottoni fissi o clip dei bordi (`ring`).
  - Utilizza le classi `env(safe-area-inset-*)` (`.app-container`) per tutelare notch e barre gesture su dispositivi mobili.

---

## 8. Sintesi della Checklist Rapida di Pre-Consegna

Prima di completare il prompt o fare commit del codice, esegui questa verifica mentale rapida:

- [ ] **Fitts**: I touch target sono generosi ($\ge 44\text{px}$) e ben raggiungibili?
- [ ] **Hick & Miller**: Il numero di opzioni è essenziale e le info complesse sono raggruppate in blocchi (*chunks*)?
- [ ] **Gestalt**: Le card correlate sono visivamente unite e le card affiancate sono perfettamente simmetriche in altezza e padding?
- [ ] **Jakob & Norman**: I bottoni hanno affordance chiara e rispettano la palette funzionale (Verde=Carico, Rosso=Scarico, Ciano=Conferma, Arancione=Alert)?
- [ ] **Nielsen (Error Prevention)**: Il sistema impedisce preventivamente quantità negative o scarichi superiori alla giacenza reale?
- [ ] **Nielsen (Visibility)**: Ogni azione asincrona (Supabase, fetch, salvataggio) fornisce feedback visivo immediato?
- [ ] **WCAG**: I contrasti testo/superficie superano 4.5:1 e il focus da tastiera è preservato?
- [ ] **Tipografia**: Usate esclusivamente le classi `.app-*` (`.app-caption` solo per codici/timestamp)?
- [ ] **Mobile Responsive**: Zero scroll orizzontale su schermi piccoli e safe-zone protette da sovrapposizioni?
