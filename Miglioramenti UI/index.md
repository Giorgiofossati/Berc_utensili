# Miglioramenti UI — Index per gli agent di audit

> **Scopo**: catalogo delle schermate dell'app **Berc_utensili** (https://berc-utensili.vercel.app/) con screenshot, flusso operativo osservato e mandato di analisi per gli agent paralleli.
> Ogni agent prende in carico **una schermata logica** (con tutti i suoi stati: desktop chiaro, dark, mobile), produce un report in `audit/NN-nome.md`. Il report finale unificato è `audit/REPORT_FINALE.md`.
> Regole e contesto di progetto: [`../CLAUDE.md`](../CLAUDE.md) · Design system sotto esame: [`../DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) · Protocollo UX: [`../SYSTEM_AUDIT_RULES.md`](../SYSTEM_AUDIT_RULES.md).

## Sessione di rilevazione
- **Data**: 2026-09-18
- **Ambiente**: produzione Vercel. Esplorazione e verifica dei cambi di stato in Chrome (viewport 1720×929). Screenshot catturati in Chrome headless con la stessa sessione: **desktop 1440×900** (tema chiaro, serie `01–35`; tema scuro, serie `40–46`) e **mobile 390×844 @2x** (serie `50–64`).
- **Utente**: Dario Leonardi (ruolo Admin → vede anche "Gestione Operatori"; vista iniziale = Elenco).
- **Non eseguito volutamente**: conferma di prelievi/depositi/ordini, salvataggio commesse/operatori/utensili (avrebbero modificato dati reali di produzione). Il flusso è stato percorso fino al pulsante di conferma incluso (stato disabled/enabled verificato).

## Mandato per gli agent (leggere prima di analizzare)
Obiettivo: **audit UI/UX professionale**, non verifica di conformità al design system. Il design system (`DESIGN_SYSTEM.md`) è **esso stesso sotto esame**: cerchiamo dove è lacunoso, ambiguo o non applicato e come ciò ha generato incoerenze in sviluppo ("ogni schermata pensata da sola e non come parte di un flusso").

Per la propria schermata riportare:
1. **Anatomia della pagina**: posizione/dimensione di titolo, overline, breadcrumb, pulsante back, azioni primarie, contenitore principale (larghezza max, padding, raggio), barra di ricerca locale. Confrontare con le schermate "vicine" elencate nel catalogo (usare gli screenshot degli altri gruppi come riferimento).
2. **Incoerenze cross-schermata**: contenitori con larghezze diverse, titoli in posizioni diverse, bottoni con stile/raggio/altezza diversi per la stessa azione, densità tipografica diversa, header che cambia comportamento, due pulsanti per la stessa cosa.
3. **Problemi di flusso**: la schermata sa da dove arriva l'utente e dove va? Back/Annulla/Indietro/Home coerenti? Stati loading/empty/error/success? Stato che "trapela" tra viste?
4. **Ergonomia** (Fitts/Hick/Gestalt/Nielsen/WCAG): target < 44px, contrasto, gerarchia, affordance ingannevoli, sovraccarico.
5. **Lacune del design system** che spiegano il problema (es. manca un template di pagina, manca una regola su breadcrumb/back, manca una scala per i contenitori di vista, manca un componente "PageHeader").
6. **Soluzione proposta**: concreta, con riferimento a file `src/...` e alla regola/componente da aggiungere a `DESIGN_SYSTEM.md`.

**Formato report** (`audit/NN-nome.md`): titolo · screenshot analizzati · tabella `Problema | Gravità (Alta/Media/Bassa) | Evidenza (file screenshot) | Causa (lacuna DS o codice) | Soluzione` · sezione "Regole mancanti nel design system" · sezione "Quick wins".

## Catalogo schermate (tutti i file in `screenshots/`)

### A. Autenticazione
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 01 | Login — lista operatori | `01-login-operatori.png` | Card presentazione + card login con ricerca e lista utenti (ruolo a destra). Footer "Accesso rapido operatore — SENZA PIN". |
| 02 | Login — password | `02-login-password.png` | Click su utente → avatar iniziali + "CAMBIA" + campo "Inserisci password admin" + ACCEDI. |
| 50 | Login mobile | `50-mobile-login.png` | Solo card login, la card presentazione scompare. |

### B. Layout globale (sidebar, header, ricerca, tema, impostazioni)
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 03 | Home — vista Elenco (default Admin) | `03-home-lista-default.png` | Sidebar fissa 288px: brand, Azioni rapide (DEPOSITA verde, PRELEVA rosso, +NUOVO UTENSILE outline), Menu navigazione, card utente con ingranaggio + tema, LOGOUT. Header = solo barra ricerca centrata + toggle vista a destra (nessun titolo pagina). |
| 35 | Ricerca globale attiva | `35-header-ricerca-globale.png` | Digitando "D16" → chip `"D16"` tra i filtri + compaiono **due** pulsanti "Reset" e "Cancella"; il toggle "Seleziona" sparisce. |
| 34 | Scanner fotocamera da header | `34-header-scanner-camera-modale.png` | Modale "Scanner barcode · LIVE" con viewfinder; senza permesso camera mostra stato errore "Accesso fotocamera necessario" + Riprova. |
| 28 | Impostazioni utente | `28-impostazioni-utente.png` | Modale piccola: scelta vista principale Griglia/Elenco + "Salva impostazioni". Header modale diverso dagli altri (icona+titolo in riga, testo piccolo). |
| 40 | Home Elenco — dark | `40-dark-home-lista.png` | Toggle tema dalla card utente. |
| 51 | Home Elenco — mobile | `51-mobile-home-lista.png` | Header con hamburger; 13 combobox filtro su 7 righe prima della tabella. |
| 52 | Sidebar mobile (drawer) | `52-mobile-sidebar.png` | Drawer da sinistra con overlay; chiusura con X o click overlay. |

### C. Inventario — navigazione a cascata (vista Griglia)
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 05 | Griglia tipologie | `05-home-griglia-categorie.png` | 6 card immagine (FRESA, ALESATORE, INSERTO, LAMATORE, MASCHIO, PUNTA). Nessun titolo/breadcrumb. Le card sono `div` cliccabili, non `button`. |
| 06 | Griglia forme (dopo FRESA) | `06-home-griglia-forma.png` | Compare barra "FILTRO CORRENTE · FRESA" con back + "RESETTA TUTTO" a destra: breadcrumb esiste solo dal 2° livello. |
| 07 | Lista diametri (dopo CANDELA) | `07-home-diametri.png` | Card "LIVELLO 2 · SELEZIONA DIAMETRO · 52 misure" con ricerca locale, griglia 7 col. di tessere D-valore + badge pz, hint in basso. |
| 08 | Tabella filtrata (dopo D10) | `08-home-tabella-filtrata.png` | Breadcrumb "FRESA / CANDELA / D10"; filtri secondari (Materiale…Ubicazione) + "Seleziona"; tabella "24 utensili trovati"; icona tondo a sinistra della riga (non è un checkbox). Tabella full-width, mentre in vista Elenco è più stretta. |
| 41 | Griglia tipologie — dark | `41-dark-home-griglia.png` | |
| 53 | Griglia — mobile | `53-mobile-home-griglia.png` | 2 colonne. |
| 54 | Diametri — mobile | `54-mobile-home-diametri.png` | 2 colonne, header card compresso. |
| 55 | Tabella filtrata — mobile | `55-mobile-home-tabella-filtrata.png` | |

### D. Inventario — vista Elenco (TanStack table, filtri dropdown, selezione)
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 03 | Elenco default | `03-home-lista-default.png` | 13 combobox filtro su 2 righe + "Seleziona"; "1000 utensili trovati". |
| 12 | Dropdown filtro aperto | `12-home-filtro-dropdown-aperto.png` | Listbox base-ui con aspetto quasi nativo (bianco, senza stile coerente con i chip). |
| 13 | Selezione multipla attiva | `13-home-selezione-multipla.png` | Click su "Seleziona" → compaiono i veri checkbox a sinistra (l'icona tonda resta, doppio cerchio); barra flottante in basso "N SELEZIONATI · APRI IN MOVIMENTO MULTIPLO · X". Cliccare l'icona tonda senza modalità Seleziona non fa nulla. |
| 35 | Ricerca globale | `35-header-ricerca-globale.png` | Vedi B. |
| 40 | Elenco — dark | `40-dark-home-lista.png` | |

### E. Modali movimento (dettaglio → quantità → ordine)
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 09 | Dettaglio utensile | `09-modale-dettaglio-utensile.png` | Click riga (vista griglia) → modale "DETTAGLIO UTENSILE" con giacenza, griglia attributi 3 col., bottoni DEPOSITA/PRELEVA affiancati + link "CREA ORDINE". |
| 10 | Conferma prelievo | `10-modale-prelievo-quantita.png` | Stepper −/1/+ con "MAX (1 PZ)"; "+" bloccato a giacenza max (verificato); select commessa; INDIETRO + CONFERMA PRELIEVO. Header modale cambia sfondo (sfumatura rosa). |
| 11 | Crea ordine | `11-modale-crea-ordine.png` | Modale più stretta, con icona carrello nell'header, campo quantità, note, "INVIA ORDINE" arancione. Nessun "Indietro" verso il dettaglio: il flusso si interrompe. |
| 56 | Dettaglio — mobile | `56-mobile-modale-dettaglio.png` | Titolo troncato "FRESA · CANDELA · D10 · BURZ…". |
| 57 | Prelievo — mobile | `57-mobile-modale-prelievo.png` | |

### F. Movimento Multiplo
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 14 | Arrivo con toast | `14-movimento-multiplo-toast.png` | Da barra selezione → vista con toast "NOTIFICA SISTEMA · N articoli trasferiti" in alto a destra; badge contatore sulla voce di menu. |
| 15 | Distinta compilata | `15-movimento-multiplo-distinta.png` | Header: icona + overline "DISTINTA OPERATIVA" + titolo "MOVIMENTO MULTIPLO" + select commessa + toggle PRELIEVO/DEPOSITO + "AGGIUNGI UTENSILE". Tabella righe con stepper quantità e cestino; riga "+ Aggiungi riga N". Footer riepilogo + ANNULLA + CONFERMA. |
| 16 | Picker catalogo | `16-movimento-multiplo-picker.png` | Modale larghissima "SELEZIONA UTENSILE PER LA DISTINTA": ricerca + tabella; "1000 UTENSILI TROVATI" ripetuto due volte. |
| 17 | Distinta vuota | `17-movimento-multiplo-vuoto.png` | Righe placeholder "[ In attesa di selezione ]", CONFERMA disabilitato. |
| 45 | Dark | `45-dark-movimento-multiplo.png` | |
| 60 | Mobile | `60-mobile-movimento-multiplo.png` | Layout degradato: intestazioni tabella e placeholder impilati verticalmente, footer conferma su fondo. |

### G. Scanner / Deposito e Prelievo rapido
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 29 | Deposito rapido | `29-scanner-deposito-rapido.png` | Da sidebar DEPOSITA. Titolo **centrato** con overline verde, back arrow flottante a sinistra, segmented DETTAGLIO/DEPOSITA/PRELEVA, seconda barra di ricerca (duplica quella dell'header) + bottone camera; card empty state con "ricerche rapide". |
| 30 | Lista live | `30-scanner-lista-live.png` | Digitando "BRCL01" → tabella "34 utensili trovati" con checkbox sempre visibili (a differenza della home). Tabella più larga della barra di ricerca. |
| 31 | Prelievo rapido | `31-scanner-prelievo-rapido.png` | Toggle → titolo/colore rosso. Click riga = spunta checkbox (in home apre il dettaglio). |
| 32 | Camera inline | `32-scanner-camera-inline.png` | Viewfinder inline sopra la lista (in header è invece una modale). |
| 33 | Modalità Dettaglio | `33-scanner-dettaglio-tab.png` | Titolo diventa "OPTICAL SCANNER · Riconoscimento laser" (terzo titolo per la stessa vista). |
| 42 | Dark | `42-dark-scanner.png` | |
| 58 | Mobile | `58-mobile-scanner.png` | |
| 59 | Mobile lista | `59-mobile-scanner-lista.png` | |

### H. Commesse
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 18 | Lista commesse | `18-commesse.png` | Header: back arrow + icona + titolo "COMMESSE" + badge totali + refresh + "NUOVA COMMESSA". Ricerca + segmented Tutte/Attive/Chiuse. Card commessa. Unica vista con URL proprio (`/commesse`). |
| 19 | Menu contestuale | `19-commesse-menu-contestuale.png` | ⋮ → "Imposta Chiusa", "Elimina". |
| 20 | Nuova commessa | `20-commesse-nuova-modale.png` | Modale con titolo+sottotitolo, 2 col., stato ATTIVA/CHIUSA segmented, Annulla + SALVA (disabled finché vuoto). |
| 43 | Dark | `43-dark-commesse.png` | |
| 61 | Mobile | `61-mobile-commesse.png` | |

### I. Storico movimenti
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 21 | Storico | `21-storico-movimenti.png` | Header: overline "TRACCIAMENTO LOG" + titolo + a destra "Aggiorna" e "← Home" (qui il back si chiama Home ed è a destra). Ricerca + select + segmented TUTTI/CARICHI/SCARICHI + select. Tabella con badge flusso e ±qty; totali "+4 pz / −3 pz". Contenitore con bordo arrotondato grande che occupa tutta l'altezza. |
| 44 | Dark | `44-dark-storico.png` | |
| 62 | Mobile | `62-mobile-storico.png` | |

### J. Gestione operatori (solo Admin)
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 22 | Operatori | `22-gestione-operatori.png` | Header: overline "AMMINISTRAZIONE" + titolo + a destra "← Indietro" (terza variante di back). Layout 2 colonne: lista card operatori (icone occhio/matita/cestino 14px) + pannello "NUOVO OPERATORE". Utente corrente evidenziato arancione con tag "TU". |
| 23 | Modifica profilo | `23-gestione-operatori-modifica.png` | Matita → il pannello destro diventa "MODIFICA PROFILO" con campo password; ANNULLA + SALVA MODIFICHE. |
| 46 | Dark | `46-dark-operatori.png` | |
| 63 | Mobile | `63-mobile-operatori.png` | Il pannello nuovo operatore finisce sotto la lista. |

### K. Nuovo utensile
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 24 | Aggiungi articolo | `24-nuovo-utensile-modale.png` | Modale extra-large: sezioni numerate "1 Informazioni principali", "2 Dati inventario"; accordion "Attributi avanzati +9"; footer "SALVA ARTICOLO" verde. |
| 25 | Attributi avanzati aperti | `25-nuovo-utensile-attributi-avanzati.png` | 9 campi su 3 righe. |
| 64 | Mobile | `64-mobile-nuovo-utensile.png` | |

### L. Tutorial / Guida
| # | Schermata | File | Note flusso verificate |
|---|---|---|---|
| 26 | Step 1/7 | `26-tutorial-step1.png` | Spotlight sulla griglia; card tooltip sopra la griglia; "Salta" + "AVANTI". In Chrome a 1720×929 la card era tagliata sotto il bordo inferiore. |
| 27 | Step 2/7 | `27-tutorial-step2.png` | Spotlight sul toggle vista; card tooltip **taglia fuori dal bordo destro** del viewport a 1720 (a 1440 rientra a filo). Chiudendo il tutorial la vista torna a Elenco. |

## Flusso operativo osservato (sequenza reale)
1. Login già in sessione (localStorage `berc_user`) → Home Elenco.
2. Toggle Griglia → FRESA → CANDELA → D10 → tabella 24 → click riga → Dettaglio → PRELEVA → stepper (+ bloccato al max) → INDIETRO → CREA ORDINE (modale diversa, nessun ritorno) → chiusa.
3. RESETTA TUTTO → Elenco → apertura combobox Tipologia → "Seleziona" → 2 checkbox → barra flottante → APRI IN MOVIMENTO MULTIPLO → toast + badge menu → AGGIUNGI UTENSILE (picker) → DEPOSITO toggle → ANNULLA (distinta svuotata).
4. Commesse → ⋮ menu → NUOVA COMMESSA (SALVA disabled) → Storico → Operatori → matita (Modifica profilo) → ANNULLA.
5. NUOVO UTENSILE → Attributi avanzati → chiuso. Guida & Tutorial step 1→2 → Salta (vista torna a Elenco). Impostazioni utente → chiusa. Tema scuro.
6. DEPOSITA (sidebar) → scanner → digitato BRCL01 → lista live → toggle PRELEVA → click riga = checkbox → camera inline → DETTAGLIO. Header: scanner camera modale; ricerca globale "D16".
7. **Anomalie di stato**: la selezione fatta nello scanner resta attiva tornando in Home (barra "1 selezionati"). Chiudere il tutorial cambia la vista da Griglia a Elenco.

## Report prodotti
| Gruppo | Screenshot principali | Report | Problemi |
|---|---|---|---|
| A Login | 01, 02, 50 | [`audit/A-login.md`](audit/A-login.md) | 17 |
| B Layout globale | 03, 34, 35, 28, 40, 51, 52 | [`audit/B-layout-globale.md`](audit/B-layout-globale.md) | 15 |
| C Cascata griglia | 05, 06, 07, 08, 41, 53, 54, 55 | [`audit/C-inventario-griglia.md`](audit/C-inventario-griglia.md) | 17 |
| D Vista elenco | 03, 12, 13, 35, 40 | [`audit/D-inventario-elenco.md`](audit/D-inventario-elenco.md) | 16 |
| E Modali movimento | 09, 10, 11, 56, 57 | [`audit/E-modali-movimento.md`](audit/E-modali-movimento.md) | 17 |
| F Movimento multiplo | 14, 15, 16, 17, 45, 60 | [`audit/F-movimento-multiplo.md`](audit/F-movimento-multiplo.md) | 17 |
| G Scanner | 29–33, 42, 58, 59 | [`audit/G-scanner.md`](audit/G-scanner.md) | 20 |
| H Commesse | 18, 19, 20, 43, 61 | [`audit/H-commesse.md`](audit/H-commesse.md) | 25 |
| I Storico | 21, 44, 62 | [`audit/I-storico.md`](audit/I-storico.md) | 19 |
| J Operatori | 22, 23, 46, 63 | [`audit/J-operatori.md`](audit/J-operatori.md) | 22 |
| K Nuovo utensile | 24, 25, 64 | [`audit/K-nuovo-utensile.md`](audit/K-nuovo-utensile.md) | 18 |
| L Tutorial | 26, 27 | [`audit/L-tutorial.md`](audit/L-tutorial.md) | 18 |
| M Coerenza cross-schermata | 03, 08, 15, 18, 21, 22, 29 | [`audit/M-coerenza-cross-schermata.md`](audit/M-coerenza-cross-schermata.md) | 17 + tabella comparativa + Page Template |

## Report finale
[`audit/REPORT_FINALE.md`](audit/REPORT_FINALE.md) — sintesi esecutiva, 8 cause radice (lacune del design system), Top 15 problemi trasversali, soluzioni per il DS e il codice, piano in 4 fasi (~8-9 g/p).

## Strumenti di cattura (riusabili per la regressione visiva)
Script CDP `cap.mjs` + `desktop2.json` / `mobile.json` (Chrome headless, sessione iniettata via localStorage, animazioni disabilitate) in [`tools/`](tools/): `cd "Miglioramenti UI/tools" && echo '{"id":"<uuid utente>","nome":"…","cognome":"…","codice_id":"…","ruolo":"Admin","has_completed_tutorial":true}' > user.json && node cap.mjs desktop2.json && node cap.mjs mobile.json` (richiede Google Chrome installato; `user.json` è in `.gitignore`).
