# E. Modali movimento — Dettaglio utensile → Conferma prelievo/deposito → Crea ordine

> Audit UX/UI del flusso modale principale dell'app (quello che l'operatore usa decine di volte al giorno). Il flusso è composto da **una modale a due step** (`MovementModal.jsx`: step "Dettaglio" e step "Operazione") e da **una seconda modale separata** (`OrderModal.jsx`) montata da `App.jsx`.
> Sessione: produzione Vercel, desktop 1440×900 tema chiaro, mobile 390×844 @2x.

## Screenshot analizzati

| File | Contenuto |
|---|---|
| `09-modale-dettaglio-utensile.png` | Step 1 — Dettaglio utensile (desktop) |
| `10-modale-prelievo-quantita.png` | Step 2 — Conferma prelievo con stepper (desktop) |
| `11-modale-crea-ordine.png` | Modale Crea ordine (desktop) |
| `56-mobile-modale-dettaglio.png` | Step 1 mobile |
| `57-mobile-modale-prelievo.png` | Step 2 mobile |
| Confronto: `20-commesse-nuova-modale.png`, `24-nuovo-utensile-modale.png`, `28-impostazioni-utente.png`, `34-header-scanner-camera-modale.png`, `16-movimento-multiplo-picker.png` | Le altre 5 modali dell'app, per misurare la coerenza |

Codice esaminato: `src/features/inventory/MovementModal.jsx`, `src/features/inventory/OrderModal.jsx`, `src/components/ui/dialog.jsx`, `src/components/ui/button.jsx`, `src/index.css`, `src/App.jsx` (righe 173-179, 383-400), `src/store/useMovementStore.js`, più i `<DialogContent>` di `CommesseView.jsx`, `AddToolModal.jsx`, `AddToolToMultiModal.jsx`, `UserSettingsModal.jsx`, `Header.jsx`, `HistoryView.jsx`, `OperatorsView.jsx`.

---

## 1. Anatomia rilevata (misure dagli screenshot e dal codice)

### 1.1 Le tre modali del flusso

| | Dettaglio (09/56) | Conferma prelievo (10/57) | Crea ordine (11) |
|---|---|---|---|
| **Larghezza** | `max-w-3xl` **+ `!max-w-3xl`** (768px) | idem (stessa modale) | `max-w-md` (448px) |
| **Raggio** | `28 / 36 / 40px` | idem | `28 / 36px` |
| **Padding** | `p-4 sm:p-6 md:p-8` sull'intero contenuto | idem | `p-0` + sezioni `p-4 sm:p-6` |
| **Header** | overline arancione + titolo `app-h2` (nessuna icona, nessun `border-b`) | overline **rosa** + titolo (stesso layout, cambia solo il colore) | icona 40px + overline + titolo, **fascia arancione piena** `bg-accent-orange/10` con `border-b` |
| **Decorazione** | glow blur ciano in alto a destra (`MovementModal.jsx:124-126`) | glow blur **rosa** (stesso div, colore per `opType`) | nessun glow, fascia tinta |
| **Pulsante X** | glass `rounded-full`, `p-2.5 sm:p-3` + icona 18/20 → **38px mobile / 44px desktop**, nessun `aria-label` | idem | `Button variant=glass size=icon` forzato a `w-9 h-9 sm:w-10` → **36/40px**, nessun `aria-label` |
| **Body** | giacenza + griglia 3 col. + **bottoni azione dentro l'area scroll** | stepper + preset + select commessa + footer, tutto dentro l'area scroll | box "utensile selezionato" + 2 campi |
| **Footer** | DEPOSITA / PRELEVA pieni in griglia 2 col. + "CREA ORDINE" link testuale | INDIETRO (glass) + CONFERMA PRELIEVO (`flex-1`) senza fascia | fascia grigia `bg-black/5 border-t` con solo INVIA ORDINE full-width |
| **Titolo accessibile** | `DialogTitle sr-only` = "Dettaglio Utensile" (`:121`) | **ancora "Dettaglio Utensile"** (non cambia allo step 2) | "Crea Ordine" |
| **z-index** | `z-[1001]` | idem | `z-[2501]` |

### 1.2 Le altre modali dell'app (per confronto)

| Modale | Larghezza | Raggio | Header | X | Footer |
|---|---|---|---|---|---|
| Nuova commessa (20) | `sm:max-w-2xl md:max-w-3xl` | 28/36 | icona 48px + titolo + **sottotitolo** (nessun overline) | 44px `rounded-2xl` | fascia: "Annulla" testo + SALVA blu a destra |
| Aggiungi articolo (24) | `max-w-4xl lg:5xl xl:6xl` **+ `!max-w-6xl`** | 28/36/40 | icona + overline + titolo | 40/48px `rounded-full` | fascia: solo SALVA ARTICOLO verde a destra |
| Impostazioni utente (28) | `sm:max-w-md` | 28 | icona 40px + **titolo `text-sm`** in riga (no overline, no `app-h2`) | **32px** `rounded-xl` ghost | solo SALVA IMPOSTAZIONI a destra, senza fascia |
| Scanner header (34) | `sm:max-w-md max-w-[460px]` | 28 | icona + titolo + badge LIVE + sottotitolo | **32px** | "Chiudi" pill a destra + hint mono a sinistra |
| Picker distinta (16) | `max-w-6xl xl:7xl h-[88dvh]` | 24/32 | icona + overline + titolo | 38px `rounded-full` | nessuno |
| Storico (dialog interno) | `max-w-md` | **`rounded-2xl` (16px)** | — | X di default shadcn | — |

**Risultato:** 8 modali, **6 anatomie di header diverse**, **5 pattern di footer**, **4 dimensioni di X** (32/36-40/38-44/44), **6 larghezze** di cui 3 fuori da qualunque scala (`!max-w-3xl`, `!max-w-6xl`, `max-w-[460px]`), **4 raggi** (16/24-32/28/28-36-40). Il design system prescrive `rounded-[32px]`: nessuna modale lo usa.

---

## 2. Tabella dei problemi

| # | Problema | Gravità | Evidenza | Causa (lacuna DS o codice) | Soluzione |
|---|---|---|---|---|---|
| E1 | **"CREA ORDINE" interrompe il flusso**: chiude la modale dettaglio e apre una modale indipendente senza "Indietro". Chiudendo l'ordine (X, Escape, click fuori) l'operatore si ritrova sulla tabella e deve ricercare la riga. Per compensare la perdita di contesto la modale ordine ripete il nome utensile in un box grigio ("box in a box", vietato da DS 5.D.5). | **Alta** | 09 → 11; su 11 manca qualunque back; il box "UTENSILE SELEZIONATO" è la prova della perdita di contesto | Codice: `MovementModal.jsx:185` `setShowMoveModal(false); onOpenOrder()`; `App.jsx:390-398` monta `OrderModal` come sibling, non come step. DS: la sezione 5.D non ha alcuna regola su **wizard multi-step / sotto-flussi** (chi possiede lo stato, come si torna indietro). | Trasformare "Crea ordine" in un **terzo step della stessa `MovementModal`** (`opType='ordine'`), con header/titolo coerenti, INDIETRO che torna al dettaglio, larghezza invariata. In alternativa minima: `OrderModal` riceve `onBack` e al close riapre il dettaglio (`setShowMoveModal(true)` con `opType=null`). Aggiungere al DS la regola "Wizard & sotto-flussi" (§3.3). |
| E2 | **Salto di larghezza 768 → 448px e cambio completo di anatomia tra step consecutivi** dello stesso flusso (dettaglio → ordine): l'utente percepisce di essere finito in un'altra applicazione. Anche dettaglio → prelievo cambia altezza (≈720 → 500px) e la modale si ricentra con un salto. | **Alta** | 09 vs 11 (larghezza); 09 vs 10 (altezza, stesso `max-w`) | DS: la scala Tier 1-4 esiste ma (a) non è imposta da `dialog.jsx` (nessuna prop `size`, solo un check `className.includes("max-w-")`, `dialog.jsx:53`), (b) `MovementModal.jsx:120` usa `!max-w-3xl` che non corrisponde a nessun tier (Tier 3 = `sm:max-w-3xl md:max-w-4xl`), (c) `OrderModal.jsx:66` usa `max-w-md` = Tier 1 "Alert" per un form. DS non dice che **gli step di uno stesso flusso devono condividere tier e altezza minima**. | `DialogContent size="s\|m\|l\|xl"` che applica la classe del tier; vietare `!max-w-*` e `max-w-[Npx]` (lint/grep in checklist). Regola: step dello stesso wizard = stesso `size` + `min-h` comune (o `motion` sull'altezza). |
| E3 | **Titolo troncato su mobile** "FRESA · CANDELA · D10 · BURZ…": l'ultimo token (fornitore) è proprio quello che distingue le 24 righe FRESA·CANDELA·D10 tra loro. Stesso troncamento sui valori della griglia ("FRESA DIAMANTATA …"): la modale di dettaglio, il cui scopo è mostrare i dati completi, li nasconde. | **Alta** | 56, 57 (titolo); 56 prima tessera (valore) | Codice: `MovementModal.jsx:134` `app-h2 … truncate`; `:111` `truncate` sui valori. DS 5.D.1 vieta esplicitamente la troncatura ma **non offre il meccanismo alternativo** (line-clamp, wrapping, badge codice) e non è verificato in checklist. | Titolo: `line-clamp-2` + `break-words`, oppure titolo = tipologia·forma·diametro e fornitore/codice in badge mono (come già prescritto dal DS). Valori griglia: `break-words`, mai `truncate`; su mobile `grid-cols-1` per i campi lunghi (`Descrizione originale`). Aggiungere al DS la "politica di overflow testi" (§3.10). |
| E4 | **Stepper "+" bloccato al massimo ma ancora visibile e inerte** (`opacity-30`, nessun messaggio); il "−" a quantità 1 resta invece pienamente attivo ma non fa nulla (`Math.max(1, …)`). Con giacenza 1 l'unico preset visibile è la pill "MAX (1 PZ)" già selezionata e riempita di rosa: si legge come un badge di avviso, non come un bottone. Tre affordance ambigue nella stessa riga. | **Media** | 10, 57 (il "+" grigio chiaro a destra, il "−" bianco pieno a sinistra, pill rosa) | Codice: `MovementModal.jsx:224` (nessun `disabled` sul −), `:253-259` (+ dimmed senza helper), `:278` filtro preset restituisce array vuoto con stock=1, `:290-301` pill MAX selected = fill rosa identico a un badge `badge-rose`. DS: **nessuna specifica del componente Stepper/QuantityInput** (stati min/max, feedback, preset). | Stati simmetrici: entrambi i bottoni `disabled` con lo stesso aspetto + `aria-disabled`; helper text sotto l'input quando si è al limite ("Giacenza massima raggiunta"); i preset diventano chip-toggle (outline → fill) con `min-h-[36px]`; con stock=1 non mostrare preset. Definire nel DS il componente `QuantityStepper` (§3.8). |
| E5 | **Bottoni di azione dentro l'area scrollabile** (step 1 e 2): su telefoni bassi o con barra Safari, DEPOSITA/PRELEVA e CONFERMA finiscono sotto la piega e vanno cercati scrollando; le altre modali (20, 24, 11) hanno invece un footer fisso. | **Media** | 56 (modale alta 690pt su 844 di viewport, senza barra browser); codice | Codice: `MovementModal.jsx:147` (`overflow-y-auto`) contiene sia griglia sia bottoni (`:168-196`, `:387-406`). DS: 5.D descrive l'header ma **non impone la struttura header / body scroll / footer fisso**. | Estrarre i bottoni in un `<ModalFooter>` `shrink-0` fuori dallo scroll, con `padding-bottom: env(safe-area-inset-bottom)`. Regola DS §3.2. |
| E6 | **Header senza fascia né separatore** nelle modali movimento, con glow colorato che cambia per step (ciano / rosa / verde) mentre l'ordine usa una fascia arancione piena: **due tecniche diverse per "colorare semanticamente" una modale**, entrambe non previste dal DS. Il glow è decorativo (DS §1: "zero elementi decorativi fini a se stessi"). | **Media** | 09 (glow ciano), 10 (glow rosa), 11 (fascia arancione), 20/24 (nessuna delle due) | Codice: `MovementModal.jsx:124-126` glow inline-style; `OrderModal.jsx:81` `bg-accent-orange/10`. DS: nessuna regola su tinta/semantica colore dell'header modale. | Una sola tecnica: colore semantico su overline + icona-box + bottone primario; header sempre con `border-b`; eliminare glow e fascia. DS §3.5. |
| E7 | **Pulsante X: 4 dimensioni e 3 forme** nell'app; nel flusso movimento 38px su mobile (< 44) e 36/40px nell'ordine; nessun `aria-label`; hover `text-white` su `bg-rose-500/20` in tema chiaro = icona quasi invisibile. | **Media** | 09/56 (X tondo grande), 11 (X tondo piccolo), 28/34 (X 32px quadrato), 20 (X 44px `rounded-2xl`) | Codice: `MovementModal.jsx:143`, `OrderModal.jsx:91`, `UserSettingsModal.jsx:50`, `Header.jsx:168`. DS 5.D.3 prescrive 44px `rounded-2xl` ma è prosa: **non esiste un componente `ModalCloseButton`**, ogni file lo ricostruisce. | Componente unico `DialogCloseButton` (44×44, `rounded-2xl`, glass, `aria-label="Chiudi"`, hover neutro) esportato da `dialog.jsx` e usato ovunque; rimuovere `showCloseButton` di default = true. |
| E8 | **Footer: 5 pattern diversi** per la stessa coppia "azione secondaria + primaria": INDIETRO glass + CONFERMA `flex-1` (10); solo INVIA full-width in fascia (11); "Annulla" testo + SALVA a destra in fascia (20); solo SALVA a destra (24, 28). Etichette diverse per lo stesso concetto (Indietro / Annulla / Chiudi / X). | **Media** | 10, 11, 20, 24, 28 | DS: la scala di enfasi (§6) dice *quale peso* ma **non dove stanno i bottoni, come si chiamano e se il footer ha una fascia**. Nessun componente `DialogFooter` di progetto (quello shadcn in `dialog.jsx:94` non è usato). | `ModalFooter` con slot `secondary` (sinistra, glass/testo) e `primary` (destra, fill); su mobile impilati full-width; lessico fisso: "Indietro" = torna allo step precedente, "Annulla" = chiude senza salvare, X = come Annulla. DS §3.4. |
| E9 | **Label della griglia attributi a 8-9px con opacità 60 %** (arancione su grigio chiaro): contrasto stimato < 3:1, illeggibile in officina; hover che schiarisce le tessere suggerisce che siano cliccabili (non lo sono). | **Media** | 09, 56 (label "DESCRIZIONE ORIGINALE" ecc.) | Codice: `MovementModal.jsx:108` `text-[8px] md:text-[9px] … opacity-60 … group-hover:opacity-100`; `:107` `hover:bg-white/[0.08]`. DS §3 vieta classi arbitrarie ma non ha un **componente Label/Value ("KeyValueTile")** e ammette 9px come minimo (`app-overline`), già al limite. | Usare `app-overline` senza opacità (o `text-slate-500` pieno), valore `app-h3`; rimuovere hover; minimo assoluto 10px per testo informativo. DS §3.9. |
| E10 | **Due controlli diversi per lo stesso dato "quantità"** in step consecutivi: stepper −/+ grande nel prelievo, campo numerico nudo nell'ordine. Nell'ordine il campo non ha né min visuale né validazione live: l'errore compare solo dopo il click (mentre in Commesse il SALVA è disabilitato finché il form non è valido). | **Media** | 10 vs 11; 20 (SALVA disabled) | Codice: `OrderModal.jsx:114-122` (`Input type=number`), `:19-23` validazione post-submit; nessun `disabled` su INVIA (`:143` solo `isLoading`). DS: nessuna regola su **strategia di validazione** (disable vs errore inline) né sul controllo quantità. | Riutilizzare `QuantityStepper` anche nell'ordine (senza max); INVIA disabilitato finché qty < 1; regola DS: "primario disabilitato finché il form non è valido, errore inline solo per errori server". |
| E11 | **Escape / click fuori chiudono la modale in qualunque step** e azzerano quantità, commessa e note senza conferma (base-ui default `dismissible`). Nella modale ordine si perdono le note digitate. | **Media** | Verificato da codice (`Dialog onOpenChange` → chiusura, `MovementModal.jsx:119`, `OrderModal.jsx:65`; reset in `useMovementStore.js:20-23`) | DS: nessuna **politica di dismiss** (quando è lecito chiudere con click fuori). | Step con dati inseriti (qty ≠ 1, commessa scelta, note non vuote): click fuori ignorato o conferma "Annullare l'operazione?"; Escape torna allo step precedente invece di chiudere. DS §3.11. |
| E12 | **Titolo accessibile statico**: `DialogTitle sr-only` resta "Dettaglio Utensile" anche nello step "Conferma prelievo"; il titolo visivo è un `<h3>` nella movimento e un `<h2>` nell'ordine. Screen reader e focus iniziale non comunicano il cambio di step. | **Bassa** | Codice `MovementModal.jsx:121,134`; `OrderModal.jsx:67,88` | DS: nessuna indicazione sul collegamento fra titolo visivo e `DialogTitle` / livello heading nei modali. | `DialogTitle` = titolo visivo (non `sr-only`) con overline separato in `DialogDescription`; aggiornare per step e spostare il focus sull'header al cambio step. |
| E13 | **Select commessa nativo** (`<select>` + `optgroup`) mentre tutti i filtri dell'app usano il Combobox base-ui (screenshot 12): due look di dropdown. Il link "Resetta" a 10px appare solo dopo la scelta (target ≈ 14px). | **Bassa** | 10, 57 vs 12 | Codice: `MovementModal.jsx:343-380`, `:333-340`. DS 5.E non nomina il componente Select ufficiale. | Un solo componente Select nel DS (base-ui Select stilizzato); "Resetta" come icona X dentro il campo (regola già presente per gli input di ricerca, DS 5.E). |
| E14 | **"CREA ORDINE" come link testuale** arancione senza bordo sotto due bottoni giganti (≈80px) con icona sopra il testo: peso visivo corretto secondo DS §6 ma il target è un'area vuota 40px non delimitata; su desktop l'operatore non capisce che è un bottone finché non ci passa sopra. | **Bassa** | 09, 56 | Codice `MovementModal.jsx:185`. DS §6 definisce "Terziaria = solo testo" senza minimo di area né stile hover/focus visibile. | Terziaria con `min-h-[44px]`, sottolineatura o bordo tratteggiato leggero al focus/hover; icona + testo con `gap-2`. |
| E15 | **Bottoni primari assemblati a mano ogni volta**: DEPOSITA/PRELEVA usano `.action-btn` (raggio 18/22px) ma lo sovrascrivono con `rounded-xl sm:rounded-2xl`; CONFERMA non usa `.action-btn` (tracking/padding diversi); INVIA usa `.action-btn` + override. `button.jsx` è lo shadcn di default con altezze 24-36px, inutilizzabile in officina, quindi nessuno lo usa. | **Bassa** | 09, 10, 11 (tre raggi e tre altezze per bottoni "primari") | Codice `MovementModal.jsx:171,176,398`; `OrderModal.jsx:144`; `button.jsx:23-35`. DS: classi `.action-btn-*` in CSS ma **nessun componente Button con size** touch-first. | Estendere `button.jsx` con `size: sm(36) / md(44) / lg(52)` e `variant: carica / scarica / order / primary / secondary / tertiary`; vietare `.action-btn` inline. |
| E16 | Micro-copy: "1 PEZZI" (giacenza) e "1 pezzi" (successo ordine); overline "Riassortimento" nella modale ordine vs "Crea Ordine" del link: la parola cambia tra trigger e destinazione. | **Bassa** | 09, 56, 11 | Codice `MovementModal.jsx:158`, `OrderModal.jsx:75,87`. DS: nessun glossario azioni. | Plurale condizionale; overline "Crea Ordine" o etichetta link "Riassortimento", una sola parola. Glossario in DS. |
| E17 | Scala z-index arbitraria (`z-[1001]`, `z-[1100]`, `z-[2501]`, `z-[3001]`, `z-50` di default) per gestire modali sovrapposte: funziona per caso. | **Bassa** | codice `MovementModal.jsx:120`, `OrderModal.jsx:66`, `AddToolToMultiModal.jsx:58`, `OperatorsView.jsx:647` | DS: nessuna scala z-index. | Token `--z-modal`, `--z-modal-nested`, `--z-toast`; un solo livello per dialog, nested tramite lo stesso portale. |

---

## 3. Regole mancanti nel design system

La sezione 5.D descrive in prosa un header "millimetrico" e una scala Tier 1-4, ma nessuna delle due è **incarnata in un componente**: `dialog.jsx` è lo shadcn di default (header/footer non usati, X `absolute top-2 right-2` con `size-7`), quindi ogni file riscrive la modale da zero e diverge. Le regole da aggiungere:

### 3.1 Scala larghezze S / M / L / XL come prop, non come prosa
```jsx
<DialogContent size="m">   // s=max-w-md (448) · m=max-w-2xl md:3xl (672-768) · l=max-w-4xl (896) · xl=max-w-6xl xl:7xl h-[88dvh]
```
- La prop applica anche raggio (`rounded-[28px] sm:rounded-[32px]`), `w-[94vw] sm:w-full`, `max-h-[92dvh]`, padding 0 (il padding vive nelle sezioni).
- **Vietato** `!max-w-*`, `max-w-[Npx]`, raggio custom; da verificare con grep in checklist §7.
- Mappa obbligatoria: Alert/conferma = S · Form 3-6 campi (Commessa, Ordine, Impostazioni, Scanner) = S o M · Dettaglio/Movimento = M · Anagrafica utensile = L · Picker tabellari = XL.

### 3.2 Anatomia obbligatoria a 3 zone (componenti, non classi)
```
<DialogContent size>
  <ModalHeader icon overline title subtitle badge onClose />   // shrink-0, border-b, padding p-4 sm:p-6
  <ModalBody>…</ModalBody>                                     // flex-1 min-h-0 overflow-y-auto, padding p-4 sm:p-6
  <ModalFooter secondary primary />                            // shrink-0, border-t, safe-area bottom, MAI dentro lo scroll
</DialogContent>
```
- Header: icona-box 44px sempre presente (identifica il dominio: utensile, commessa, ordine), overline **obbligatorio**, titolo `app-h2` = `DialogTitle` (non `sr-only`), sottotitolo opzionale, X 44px `rounded-2xl` a destra.
- Body: unico contenitore che scrolla. Nessun `p-*` sul `DialogContent`.
- Footer: sempre presente se esiste un'azione primaria; su mobile bottoni impilati full-width, primario in basso.

### 3.3 Wizard & sotto-flussi
- Una sequenza dettaglio → operazione → ordine è **un solo `Dialog` con step**; non si monta una seconda modale per un'azione lanciata da dentro la prima.
- Ogni step dopo il primo ha **"Indietro"** a sinistra nel footer, che torna allo step precedente conservando lo stato; X chiude tutto.
- Stesso `size` per tutti gli step; altezza stabile (`min-h` comune o animazione dell'altezza) per evitare il ricentraggio.
- L'header cambia solo overline/colore semantico e sottotitolo, mai posizione/anatomia.
- Escape = Indietro se esiste uno step precedente, altrimenti chiude.
- `DialogTitle` aggiornato per step, focus spostato sull'header.

### 3.4 Footer: posizioni e lessico
| Slot | Posizione | Stile | Etichetta |
|---|---|---|---|
| Secondaria | sinistra | glass / testo | **"Indietro"** (step precedente) oppure **"Annulla"** (chiude senza salvare); mai entrambi |
| Primaria | destra, `flex-1` su mobile | fill semantico (`carica` / `scarica` / `order` / `primary`) | verbo + oggetto ("Conferma prelievo", "Salva commessa", "Invia ordine") |
- Una sola primaria per footer (già DS §6). Se lo step 1 ha due primarie complementari (Deposita/Preleva) esse stanno nel footer, non nel body.
- Fascia di sfondo del footer: decidere una volta (consiglio: `bg-slate-50/60 dark:bg-white/[0.03] border-t`) e applicarla sempre o mai.

### 3.5 Colore semantico delle modali
- Il colore dell'operazione (verde carico, rosa scarico, arancio ordine, ciano neutro) si esprime **solo** su: overline, icona-box dell'header, bottone primario, badge di stato.
- Vietati glow/blur decorativi (`MovementModal.jsx:124`) e fasce colorate su header/footer.

### 3.6 Pulsante di chiusura: componente unico
`DialogCloseButton` esportato da `dialog.jsx`: 44×44, `rounded-2xl`, glass, icona 20px, `aria-label="Chiudi"`, hover neutro (mai `text-white` in tema chiaro). `showCloseButton` di shadcn → default `false` e deprecato.

### 3.7 Politica di dismiss
- Click sul backdrop chiude solo se lo step è "pulito" (nessun dato inserito). Con dati inseriti: ignorare il click o chiedere conferma.
- Escape segue §3.3.
- Chiusura dopo successo: o toast + chiusura immediata, o stato di successo inline con bottone "Chiudi" — non auto-close a timer (`OrderModal.jsx:48-53`) che cambia layout senza controllo dell'utente.

### 3.8 Componente `QuantityStepper`
- Bottoni −/+ 48px (56 su tablet), input 14-16px min per evitare zoom iOS, `tabular-nums`.
- Stati: `disabled` **simmetrico** su − (a min) e + (a max), stesso aspetto (outline dimmed, `aria-disabled`, `title`), helper text sotto ("Massimo N pz disponibili").
- Preset: chip toggle ≥36px, outline → fill quando selezionati; nascosti se meno di 2 opzioni utili.
- Lo stesso componente serve in Movimento, Ordine e Movimento Multiplo.

### 3.9 Coppie label/valore (`KeyValueTile`)
- Label: `app-overline` a opacità piena (`text-slate-500` o accent), **mai sotto 10px**, mai `opacity-*`.
- Valore: `app-h3`, `break-words`, mai `truncate`.
- Nessun hover su tessere non interattive.
- Ordine dei campi definito da una lista fissa (non dall'ordine delle chiavi JSON).

### 3.10 Politica di overflow dei testi
- Titoli modali: `line-clamp-2 break-words`, mai `truncate`.
- Identificativi lunghi (codici, fornitori) → badge mono separato (già DS 5.D.1), così il titolo resta corto per costruzione.
- Valori tecnici: wrap. `truncate` ammesso solo nelle righe di tabella con `title` attr.

### 3.11 Componente `Button` touch-first
Sostituire le size shadcn (24-36px) con `sm=36 · md=44 · lg=52` e le varianti `carica · scarica · order · primary · secondary(outline) · tertiary(text) · icon`. Le classi `.action-btn-*` in `index.css` diventano l'implementazione interna, non un'API da usare nei file.

### 3.12 Token z-index
`--z-overlay: 50 · --z-modal: 60 · --z-modal-nested: 70 · --z-toast: 80`. Vietati valori numerici inline.

### 3.13 Glossario azioni
Una parola per concetto: **Deposita / Preleva / Crea ordine / Conferma / Indietro / Annulla / Salva**. Overline e titolo di destinazione ripetono la parola del trigger ("Crea ordine" → overline "Crea ordine", non "Riassortimento").

---

## 4. Quick wins (≤ 1 h ciascuno, senza refactor)

1. **Ripristino flusso ordine**: in `App.jsx:396` `onClose={() => { setShowOrderModal(false); setOpType(null); setShowMoveModal(true); }}` e aggiungere in `OrderModal` un bottone "Indietro" glass a sinistra nel footer che chiama lo stesso handler. Rimuovere il box "Utensile selezionato" (`OrderModal.jsx:104-109`) mettendo il nome utensile come sottotitolo dell'header.
2. **Stessa larghezza**: `OrderModal.jsx:66` `max-w-md` → `max-w-3xl` (o portare entrambe a `sm:max-w-2xl md:max-w-3xl`); togliere `!max-w-3xl` da `MovementModal.jsx:120`.
3. **Titolo mobile**: `MovementModal.jsx:134` `truncate` → `line-clamp-2 break-words`; `:111` `truncate` → `break-words`.
4. **Stepper**: aggiungere `disabled={currentQtyNum <= 1}` al "−" (`:222`) con le stesse classi del "+"; sotto l'input, quando `currentQtyNum >= minAvailableStock && opType==='scarico'`, mostrare `<p className="app-caption">Giacenza massima raggiunta</p>`.
5. **Footer fuori dallo scroll**: spostare i blocchi `:168-196` e `:387-406` dopo il `</div>` di `:410` in un contenitore `shrink-0 pt-3 border-t`.
6. **X uniforme**: in `MovementModal.jsx:143` e `OrderModal.jsx:91` usare la classe già presente in `CommesseView.jsx:522` (`glass-button min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl`) + `aria-label="Chiudi"`; rimuovere `hover:text-white hover:bg-rose-500/20`.
7. **Label griglia**: `:108` → `app-overline text-slate-500 dark:text-slate-400 mb-1` (rimuovere `text-[8px]`, `opacity-60`, `group-hover`); `:107` rimuovere `hover:bg-white/[0.08] group`.
8. **Glow e fascia**: eliminare `:124-126`; in `OrderModal.jsx:81` sostituire `bg-accent-orange/10` con niente (icona-box già arancione).
9. **DialogTitle dinamico**: `:121` → `{isDetailsStep ? 'Dettaglio utensile' : opType==='carico' ? 'Conferma deposito' : 'Conferma prelievo'}`.
10. **INVIA ORDINE disabilitato** finché `!(parseInt(qty) > 0)` (`OrderModal.jsx:143`), rimuovendo l'errore post-click per quel caso.
11. **Plurale**: `:158` `{n === 1 ? 'Pezzo' : 'Pezzi'}`; `OrderModal.jsx:75` idem.
12. **Checklist §7 del DS**: aggiungere le voci "nessun `!max-w-` / `max-w-[Npx]` / `truncate` su titoli / `text-[8px]`" verificabili con `grep`.

---

## 5. Sintesi

Il flusso Dettaglio → Prelievo funziona meccanicamente ma è **tre modali disegnate in tre momenti diversi**: larghezza 768 → 768 → 448px, header senza icona → header con fascia arancione, footer INDIETRO+CONFERMA → solo INVIA, X da 44 a 36px. La causa radice è che `DESIGN_SYSTEM.md` §5.D descrive header e tier a parole mentre `dialog.jsx` resta lo shadcn di fabbrica: senza `ModalHeader/Body/Footer`, `size` e `DialogCloseButton` come componenti, ogni file ricostruisce la modale a mano e la regola "wizard con Indietro" non esiste, per cui "Crea ordine" è stato implementato come modale orfana che spezza il percorso dell'operatore.
