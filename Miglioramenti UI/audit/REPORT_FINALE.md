# REPORT FINALE — Audit UI/UX Berc_utensili

**Data**: 2026-09-18 · **App**: https://berc-utensili.vercel.app/ · **Utente di test**: Dario Leonardi (Admin)
**Base**: 56 screenshot (41 desktop + 15 mobile) (desktop 1440×900 chiaro/scuro, mobile 390×844) catalogati in [`../index.md`](../index.md) + 13 report di dettaglio in questa cartella (A–M).
**Metodo**: esplorazione completa del flusso in Chrome con verifica dei cambi di stato; analisi parallela per schermata; lettura del codice sorgente per risalire alla causa. Il design system (`DESIGN_SYSTEM.md`) era esso stesso oggetto di audit.

---

## 0. Sintesi esecutiva

L'app funziona e ha una buona base di componenti (glass panel, badge, bottoni azione, TanStack table), ma **ogni vista è stata costruita come un'isola**. La prova quantitativa (report M):

| Metrica | Valore rilevato |
|---|---|
| Viste di primo livello | 7 (Home, Scanner, Movimento Multiplo, Commesse, Storico, Operatori, Login) |
| Anatomie di header diverse | **7 su 7** (Home nessun titolo; Scanner titolo centrato e 3 nomi; Multi icona+titolo+3 controlli in riga; ecc.) |
| Stili di "torna indietro" | **5** (icona 44px a sx, icona arancione 36-40px flottante, "← Home" a dx, "← Indietro" a dx, nessuno) |
| `max-w` diversi per il contenitore di vista | **6** (672 / 896 / 1152 / 1280 / 1600 / nessuno) → il bordo sinistro del contenuto oscilla di 103px tra una vista e l'altra |
| Raggi del pannello principale | 5 (16 / 20 / 24 / 32 / 36 px) |
| Altezze dei controlli di toolbar | 8 (da 30 a 62 px) — il DS dichiara 44px touch-first |
| Varianti di header modale | 5 · Varianti di footer modale: 4-5 · Larghezze modali: 448 / 768 / 1152 px senza scala |
| Segmented control diversi | 4 (Storico, Commesse, Scanner, Multi) con 3 lessici (CARICO/SCARICO · DEPOSITA/PRELEVA · PRELIEVO/DEPOSITO) |
| Toast / notifiche | 3 implementazioni (globale, Operatori, Commesse-fallback) |
| Scala z-index | ~20 valori arbitrari (10 → 9999) |

**Diagnosi in una frase**: `DESIGN_SYSTEM.md` è un ottimo catalogo di *atomi* (colori, raggi, badge, bottoni) e descrive al millimetro l'header dei *modali*, ma **non contiene una sola regola su come si compone una pagina** (header, back, toolbar, larghezza, scroll), né una specifica per la tabella riusata ovunque, né una gestione dello stato tra viste. Gli sviluppatori (umani e agent) hanno quindi reinventato queste parti ad ogni schermata.

---

## 1. Cause radice (lacune del design system)

Le ~250 osservazioni dei 13 report si riconducono a **8 lacune** del DS. Ogni lacuna è la causa di problemi ricorrenti in più schermate.

### R1 — Non esiste un Page Template né un componente `PageHeader`
- **Effetto**: 7 header diversi, 5 back diversi, Home senza titolo, Scanner con 3 titoli ("DEPOSITO RAPIDO", "PRELIEVO RAPIDO", "OPTICAL SCANNER · Riconoscimento laser"), Storico con 3 nomi (menu "Storico Log", titolo "STORICO MOVIMENTI", overline "TRACCIAMENTO LOG"), overline di 5 colori, breadcrumb della Home con stile unico e presente solo dal 2° livello, header di Operatori che scrolla via.
- **Report**: B1, B14 · C1-C3 · F3 · G3, G5, G13 · H1-H2 · I6-I7 · J3 · M (tutto).

### R2 — Nessuna scala per i contenitori di vista, le altezze dei controlli e gli z-index
- **Effetto**: 6 larghezze, jitter orizzontale a ogni cambio vista; nello Scanner ricerca 896px / card 751px / tabella 1088px nella stessa schermata; controlli 30-62px con il DS che dice 44 in §1 e "36-44" in §7.7 (ambiguità sfruttata ovunque); z-index `z-[1001]`, `z-[2501]`, `z-[3001]`, `z-[9999]` che "funzionano per caso"; FAB "?" sopra le modali e sopra il CONFERMA su mobile.
- **Report**: B10, B13, B14 · C4, C10 · E7, E17 · G6, G15 · H16, H25 · I12 · J4 · L1, L3 · M4-M5, M10-M12.

### R3 — `ToolsGrid`/DataTable e toolbar filtri senza varianti dichiarate + stato globale che trapela
- **Effetto**: la stessa tabella è montata in 4 contesti con larghezza, checkbox e semantica del click diversi, governati da `isSelectionMode` in `useFilterStore` che **non viene mai azzerato al cambio vista**. Conseguenze verificate: checkbox fantasma nello Scanner e nel picker, click riga che spunta invece di aprire, **picker del Movimento Multiplo che non aggiunge nulla** se si arriva dalla selezione multipla, barra "N selezionati" che riappare in Home; contatore "1000 utensili trovati" duplicato; "Reset" rosa + "Cancella" arancione affiancati con significati diversi; 13 combobox filtro a pari peso (Hick) con listbox non stilizzato; 7 righe di filtri prima dei dati su mobile.
- **Report**: B3, B12 · C9, C12, C16 · D1-D8, D14 · F1, F7-F8 · G1, G4 · I2, I13 · M6-M7.

### R4 — Modali: scala di larghezze e anatomia solo "in prosa", nessun pattern wizard
- **Effetto**: `dialog.jsx` è lo shadcn di fabbrica senza prop `size` né `ModalHeader/Body/Footer`; ogni file usa `!max-w-3xl`, `!max-w-6xl`, `max-w-[460px]`; 5 header e 4-5 footer diversi; Dettaglio → Prelievo → **Crea ordine interrompe il flusso** (768 → 448px, nessun "Indietro", contesto perso); X in 4 dimensioni; Esc/click fuori scartano i dati senza conferma; Nuovo utensile a 1152px con sezioni numerate che non sono un wizard.
- **Report**: B9 · E1-E2, E6-E8, E11, E15 · H13-H14 · J22 · K5-K7, K15.

### R5 — Form: §5.E ha tre righe (niente griglia, gruppi, obbligatorietà, errori, placeholder, primitive)
- **Effetto**: `ui/input.jsx` e `ui/select.jsx` non conformi al DS e quindi riscritti a mano (5 volte solo in OperatorsView); label a 9px `app-overline`; Nuovo utensile con **12 asterischi ma 3 campi validati**, 9 "obbligatori" nascosti in un accordion, errori via `alert()`, campo Barcode senza scanner; Commesse con validazione che è codice morto (SALVA disabled senza spiegazione); password con placeholder "••••••••" che sembra precompilata; select nativo (Movimento) vs base-ui (filtri).
- **Report**: A10-A11 · E10, E13 · H12, H22 · J8-J12, J20 · K1-K4, K10-K13, K17.

### R6 — Colore: nessuna tabella di coppie testo/sfondo ammesse, semantica sovraccarica
- **Effetto**: ACCEDI bianco su blu 2.77:1 (nella stessa app il primario ha testo scuro altrove); overline `slate-400` 2.6:1; "1000 UTENSILI TROVATI" arancione = falso alert; arancione usato insieme per ubicazione, alert, "TU", Admin, overline, reset; verde "Salva articolo" = semantica Carico; "USATO" rosso = semantica esaurito mentre la QTY accanto è verde; icona ALESATORE **viola** (divieto DS); hover `text-white` in tema chiaro; contenitori dark che si fondono con lo sfondo.
- **Report**: A1-A2, A13 · B11 · C9, C15 · D9-D11, D16 · F15 · G17 · J6, J15 · K8.

### R7 — Nessuna regola sulla persistenza dello stato e sugli effetti collaterali tra viste
- **Effetto**: **il focus sulla ricerca globale (o ⌘K) azzera la cascata FRESA→CANDELA→D10 e teleporta a Home/Elenco** da qualsiasi vista senza avviso; chiudere il tutorial cambia la vista da Griglia a Elenco (`completeTutorial` → `setCurrentUser` ri-applica il default del ruolo); `batchOpType` del Movimento Multiplo persiste (rischio movimento inverso); filtri dello Storico persi a ogni rientro; DEPOSITA/PRELEVA in sidebar e segmented nella vista cambiano lo stesso stato senza feedback; `/commesse` unica route con `pushState` manuale che rompe il back del browser (e manca il rewrite SPA in `vercel.json`).
- **Report**: B2 · C7 · F5, F16 · G2, G12-G13 · H2, H23 · I4, I19 · L2.

### R8 — Nessun glossario/registro naming, nessuna spec per toast, FAB, overlay, empty/error state
- **Effetto**: 3 lessici per carico/scarico; "Annulla" che svuota la distinta; "Guida" con 5 nomi; "?" che in Operatori resetta il tutorial senza conferma; toast "NOTIFICA SISTEMA" (etichetta da log) che copre la ricerca; **errore Supabase invisibile** in Commesse e Storico (si vede l'empty state "crea la prima commessa" → rischio duplicati); falso empty state durante il loading; tooltip del tutorial fuori viewport; "Imposta chiusa" senza undo pur avendo il toast `onUndo`.
- **Report**: A3 · E16 · F11-F12 · G3, G8-G10 · H3, H8, H17-H18, H24 · I5, I7 · J5, J17 · K14 · L (tutto).

---

## 2. Problemi trasversali prioritari (Top 15)

Ordinati per impatto operativo in officina × frequenza tra le schermate. Colonna "Dove" = report di dettaglio con file:riga.

| # | Problema | Gravità | Causa | Dove | Soluzione |
|---|---|---|---|---|---|
| 1 | Modalità Seleziona globale non azzerata → checkbox fantasma, click riga sbagliato, **picker Movimento Multiplo non aggiunge** | Alta | R3 | D1, F1, G1 | Reset `isSelectionMode`/`selectedToolsIds` in `setCurrentView`; prop `selectionMode="none|toggle|pick"` su `ToolsGrid`; barra selezione montata solo in `browse` |
| 2 | Ricerca globale distrugge lo stato al focus e teleporta fuori dalla vista | Alta | R7 | B2, C7, G2, I4 | Nessun side-effect su focus; ricerca globale = ricerca in tutto il magazzino con risultati in overlay, oppure disabilitata/placeholder diverso nelle viste che hanno una ricerca locale |
| 3 | 7 header di pagina diversi, 5 back diversi, Home senza titolo, Scanner con 3 titoli | Alta | R1 | M, B1, C1, G3, H1, I6, J3 | `PageTemplate` + `PageHeader` (spec in M §5): back 44px sempre a sinistra, overline arancione, `app-h1` fisso, azioni a destra con una sola primaria, breadcrumb sotto il titolo |
| 4 | Contenitori con 6 larghezze e 8 altezze di controllo; target touch 26-38px ovunque | Alta | R2 | M4-M5, B10, C10, G15, I12, J4 | Scala: pagina 1280 (variante `wide` 1600), controlli h44 touch / h36 desktop, raggi 24 vista · 16 controlli · 32 modali; DS §7.7 corretto a "44px senza eccezioni per icon-only" |
| 5 | Flusso Dettaglio → Prelievo → Crea ordine interrotto (nessun Indietro, larghezza 768→448) | Alta | R4 | E1-E2 | Ordine come step 3 dello stesso `MovementModal` (stessa larghezza, footer INDIETRO+INVIA) |
| 6 | Mobile rotto: Movimento Multiplo (tabella collassata), Operatori (badge sovrapposti, form fuori viewport), Storico (scroll orizzontale, FLUSSO/QTY fuori), Home (7 righe di filtri prima dei dati) | Alta | R2, R3 | F2, J1-J2, I1, B12, D8 | Regola tabella→card sotto `md`; filtri in drawer/sheet su mobile; form CRUD in Dialog su mobile |
| 7 | Nuovo utensile: obbligatorietà falsa (12 * / 3 validati), errori via `alert()`, 9 campi obbligatori nascosti in accordion, barcode senza scanner | Alta | R5 | K1-K4 | Validazione unica (hook) con errori inline + apertura automatica dell'accordion; accordion solo per campi opzionali; campo Codice per primo con bottone camera |
| 8 | Errore di rete invisibile (Commesse/Storico mostrano empty state; loading mostra "0 movimenti") | Alta | R8 | H3, I5 | Regola DS "4 stati obbligatori": loading / empty / error / success con componenti standard |
| 9 | Contrasti WCAG falliti su testi funzionali (ACCEDI 2.77:1, overline 2.6:1, label 9px opacità 60%) | Alta | R6 | A1-A2, B11, E9, J12, K13 | Tabella coppie testo/sfondo nel DS; label form min 11-12px; `.action-btn-primary` con testo scuro ovunque |
| 10 | Stesso controllo con 3-4 rese: segmented (4 stili), toggle carico/scarico (3), "Aggiorna" (3), "Annulla" (3), X modale (4) | Media | R1, R4, R8 | H15, G10, I8, I16, E7-E8 | Componenti `SegmentedControl`, `IconButton`, `DialogCloseButton`; glossario: carico/scarico = DEPOSITA/PRELEVA ovunque |
| 11 | Effetti collaterali nascosti: tutorial cambia vista, `batchOpType` persiste, "Annulla" = svuota distinta, "?" = reset tutorial, "Imposta chiusa" senza conferma/undo | Media | R7, R8 | L2, F5, F11, J5, H8 | Overlay non modificano lo stato ospite; azioni distruttive → conferma o toast con Undo; nomi = azione reale |
| 12 | Card categoria e card commessa sono `div onClick` (no tastiera/focus), icon-button senza `aria-label` | Media | R5 | C5, H9, G19, J4 | Regola DS: elementi interattivi = `button`/`role=button` + `tabIndex` + `aria-label` |
| 13 | Rumore cromatico per riga (5-6 accenti), badge STATO tutto rosso tranne NUOVO, icona viola | Media | R6 | D10-D11, C9 | Mappa stato→colore esplicita; icone tipologia monocrome (accent-blue) o palette ridotta; rimuovere viola |
| 14 | Toast: 3 implementazioni, copre la ricerca, "NOTIFICA SISTEMA", un solo slot | Media | R8 | F12, J17, H24 | Un solo `Toast` globale con `role=status`, coda, posizione fuori dalle zone attive, copy umano |
| 15 | Login: "SENZA PIN" incomprensibile, lista che taglia l'Admin, sessione senza scadenza su tablet condiviso | Media | R8, A | A3, A5, A12 | Etichetta per riga ("Accesso diretto" / "Richiede password"), lista a altezza automatica, TTL sessione |

---

## 3. Problemi per schermata (sintesi; dettaglio nei report A–M)

| Schermata | Report | Problemi | Top 3 |
|---|---|---|---|
| Login | [A](A-login.md) | 17 | ACCEDI 2.77:1 · testi di stato sotto WCAG · flusso "SENZA PIN" opaco, target 28px |
| Layout globale | [B](B-layout-globale.md) | 15 | manca App Shell/PageHeader · ricerca globale distruttiva + 4 "cancella" · target 28-36px, mobile 13 filtri |
| Inventario griglia | [C](C-inventario-griglia.md) | 17 | livello 1 senza titolo, header che cambia struttura · ricerca globale azzera la cascata · card `div` non accessibili |
| Inventario elenco | [D](D-inventario-elenco.md) | 16 | Seleziona che trapela · una tabella 4 comportamenti · 13 combobox piatti + listbox non stilizzato |
| Modali movimento | [E](E-modali-movimento.md) | 17 | Crea ordine interrompe il flusso · 768→448px e anatomia diversa tra step · titolo troncato mobile, label 8-9px |
| Movimento multiplo | [F](F-movimento-multiplo.md) | 17 | picker non aggiunge (leak) · mobile illeggibile · header/footer inventati, Annulla=svuota, conferma senza dialog |
| Scanner | [G](G-scanner.md) | 20 | stato che trapela · 2 ricerche + 2 camere con comportamenti opposti · 3 titoli, header centrato, 3 larghezze |
| Commesse | [H](H-commesse.md) | 25 | 5ª variante di header + back che rompe il browser · errore fetch invisibile · card lontana dal prototipo, `badge-slate` inesistente |
| Storico | [I](I-storico.md) | 19 | scroll orizzontale mobile · select "ALL" senza etichetta · timestamp troncato, falso empty state al loading |
| Operatori | [J](J-operatori.md) | 22 | mobile rotto · form inline vs modali altrove · header non persistente, icon-button 30px senza aria-label |
| Nuovo utensile | [K](K-nuovo-utensile.md) | 18 | obbligatorietà falsa · errori invisibili/alert() · barcode senza scanner, 1152px, Salva verde senza Annulla |
| Tutorial | [L](L-tutorial.md) | 18 | card/spotlight fuori viewport · chiusura cambia vista · FAB sopra modali e CONFERMA |
| Coerenza cross-schermata | [M](M-coerenza-cross-schermata.md) | 17 + tabella comparativa | nessun Page Template · nessuna scala larghezze/altezze/back · DataTable e toolbar senza varianti |

---

## 4. Soluzioni: cosa aggiungere al design system e al codice

### 4.1 Nuove sezioni per `DESIGN_SYSTEM.md`
| Sezione | Contenuto minimo | Chiude |
|---|---|---|
| **§5.G Page Template & PageHeader** | anatomia obbligatoria header(64) → toolbar(44) → contenuto(scroll interno) → footer sticky(72); back 44px sempre a sinistra; overline `text-accent-orange`; un solo `app-h1` fisso per vista, stato in badge; breadcrumb sotto il titolo, cliccabile; una sola primaria a destra; icona nel titolo **oppure** nelle card, non entrambe. Spec completa in M §5. | R1 |
| **§4 Scale mancanti** | larghezza pagina 1280 (+`wide` 1600); altezze controlli 44 touch / 36 desktop; raggi 24 vista · 16 controlli · 32 modali · 24 popover; **scala z-index** (`--z-sticky 10, --z-fab 30, --z-drawer 40, --z-dialog 50, --z-dialog-2 60, --z-toast 70, --z-tour 80`); touch 44px senza eccezioni per icon-only | R2 |
| **§5.C DataTable rivista** | prop `selectionMode: none\|toggle\|pick`, `onRowClick` semantico, `rowTrailing`, `showCount`, larghezza ereditata dal PageTemplate; regola tabella→card sotto `md`; colonna select dedicata; sort di default visibile | R3 |
| **§5.G Toolbar filtri** | ordine ricerca → filtri primari (cascata, evidenziati) → secondari (in "Altri filtri") → segmented → azione batch; `FilterChip` unico; su mobile drawer/sheet; ricerca locale ha sempre la X | R3 |
| **§5.D Modali riscritta come componente** | `Dialog size="sm\|md\|lg\|xl"` (448/640/768/1024), `ModalHeader/Body/Footer` obbligatori, footer = [secondaria outline] + [primaria], wizard multi-step con INDIETRO nella stessa modale, `DialogCloseButton` 44px, dismiss con conferma se dirty | R4 |
| **§5.E Form** | griglia 1/2/4 colonne, gruppi con titolo `.app-h3`, label `.app-label` ≥12px, asterisco = validato, errori inline + `aria-invalid` + focus + apertura gruppo, placeholder = esempio di formato, campo barcode con scanner, primitive `Input/Select` allineate ai token | R5 |
| **§2 Coppie colore** | tabella "testo su chiaro / su scuro / solo sfondo" per ogni accent; overline di pagina = solo arancione; arancione = alert/ordini, non ubicazione né ruolo; verde/rosso solo per carico/scarico; mappa stato utensile → colore | R6 |
| **§8 Stato e navigazione** | overlay/tour/ricerca non modificano lo stato della vista ospite; reset esplicito degli stati di modalità al cambio vista; `history.back()` per il back; azioni distruttive → conferma o Undo; 4 stati obbligatori (loading/empty/error/success) | R7, R8 |
| **§9 Glossario & pattern di feedback** | registro nomi (Deposita/Preleva, Storico movimenti, Guida, Dettaglio utensile, Distinta); un solo Toast globale con spec; un solo FAB per schermo che si nasconde con overlay; coach-mark con collision padding | R8 |

### 4.2 Nuovi componenti (`src/components/`)
`layout/PageTemplate.jsx` (`PageHeader`, `PageToolbar`, `PageContent`, `PageFooter`) · `ui/segmented-control.jsx` · `ui/icon-button.jsx` (44px, `aria-label` obbligatorio) · `ui/filter-chip.jsx` · `ui/quantity-stepper.jsx` · `ui/dialog.jsx` esteso con `size` e `ModalHeader/Body/Footer` · `ui/input.jsx`/`select.jsx` allineati ai token · `common/Toast` unico · `common/StateBlock` (loading/empty/error).

### 4.3 Correzioni di codice puntuali (bug, non stile)
- `useNavigationStore.setCurrentView` → azzera `isSelectionMode`, `selectedToolsIds`; `App.jsx:168` idem dopo il trasferimento (D1, F1, G1).
- `Header.jsx:26-44` → rimuovere `resetFilters()`/`setViewMode`/`setCurrentView('home')` dall'`onFocus` (B2, C7).
- `useAuthStore.completeTutorial` → patch del solo flag, non `setCurrentUser` (L2).
- `useMultiMovementStore` → reset `batchOpType` dopo `onSuccess` (F5).
- `CommesseView` → leggere `error` dallo store; `badge-slate` da definire in `index.css` (H3, H4).
- `HistoryView` → `loading` esposto da `fetchHistory`; `SelectValue` con render dei label; colonna data ≥150px; `limit`/periodo di default (I2, I3, I5, I10).
- `useAddToolForm` → validazione coerente con gli asterischi, errori inline, apertura accordion (K1-K3).
- `AppTutorial` → Popover base-ui con `collisionPadding` + ResizeObserver (L1).
- `vercel.json` → `rewrites` verso `index.html` per `/commesse` (H23).
- `toolUtils.jsx:29` → rimuovere `purple` (C9, D11). `LoginScreen.jsx:314` → testo scuro sul primario (A1).

---

## 5. Piano di intervento

### Fase 0 — Quick wins (1-2 giorni, nessun redesign)
1. Reset stato selezione al cambio vista + prop `selectable` su `ToolsGrid` (chiude #1).
2. Rimuovere i side-effect dell'`onFocus` della ricerca globale (chiude #2).
3. `completeTutorial` senza `setCurrentUser`; reset `batchOpType` (chiude parte di #11).
4. Errore/loading in Commesse e Storico; `badge-slate`; timestamp 150px; label select Storico (chiude #8, I2-I3).
5. Contrasti: `.action-btn-primary` testo scuro, overline `slate-500`, label form ≥11px (chiude parte di #9).
6. `aria-label` su tutti gli icon-button; `button` al posto di `div onClick` nelle card (chiude #12).
7. Rimuovere il viola; mappa stato→colore per il badge STATO (chiude #13).
8. `vercel.json` rewrites; `history.back()` nel back di Commesse.

### Fase 1 — Fondazioni (1 giorno)
`PageTemplate`/`PageHeader`/`PageToolbar`/`PageFooter`, scale (larghezza, altezze, raggi, z-index) in `index.css`, `Dialog size` + `ModalHeader/Body/Footer`, `SegmentedControl`, `IconButton`, `FilterChip`, `Toast` unico, `StateBlock`. Aggiornare `DESIGN_SYSTEM.md` con le sezioni §4.1 e correggere §7.7 (44px).

### Fase 2 — Migrazione viste (ordine da M §6, ~3 giorni)
Storico (S) → Operatori (S, form in Dialog) → Commesse (S) → Movimento Multiplo (M, mobile card) → Picker (S) → Scanner (M: titolo fisso "Scanner" + badge modalità, una sola ricerca, camera come componente unico) → Home (L: `PageHeader title="Inventario"` con breadcrumb dal livello 0, filtri primari/secondari, tabella con `selectionMode`).

### Fase 3 — Flussi e form (2 giorni)
`MovementModal` a 3 step con Ordine integrato; `AddToolModal` a 768px, Codice+scanner per primo, validazione inline, "Salva e aggiungi un altro"; Login con etichette per riga e TTL sessione; Tutorial su Popover.

### Fase 4 — Regressione visiva
Ripetere le catture (script `cap.mjs` riusabile: 1440/1720/390, chiaro/scuro) e verificare: bordo sinistro identico in tutte le viste, un solo back, controlli 44/36, nessun `text-[Npx]` fuori scala (aggiungere una regola ESLint/Stylelint che vieta classi arbitrarie di dimensione).

**Effort totale stimato**: ~8-9 giorni/persona. Le Fasi 0 e 1 da sole eliminano i bug funzionali (leak di stato, picker rotto, errori invisibili) e rendono visibile la coerenza fin dalla prima vista migrata.

---

## 6. Nota metodologica
- Le conferme di prelievo/deposito/ordine e i salvataggi non sono stati eseguiti (dati di produzione); i comportamenti post-conferma sono dedotti dal codice e marcati come tali nei report.
- Il login (serie 01/02/50) non ha screenshot dark; tutorial mobile/dark valutati solo da codice.
- Le misure in px sono stimate dagli screenshot a 1440×900 e verificate nel codice dove indicato.
