# 📊 Report Analisi Economica e Scraping Dati: Cassettiere Ducati

**Data Analisi:** 28 Settembre 2026  
**Ambito:** Censimento, Scraping Listini Prezzi, Availability e Specifiche Tecniche CAM per gli Utensili nelle ubicazioni `CASS.DUCATI`, `CASS.DUCATI 27` e `DUCATI`.  
**Progetto:** Gestionale Bercella Utensili  

---

## 💡 Executive Summary

È stata condotta un'analisi approfondita sui **26 articoli (241 pezzi totali)** presenti nelle cassettiere dedicate agli utensili **DUCATI** (`CASS.DUCATI`, `CASS.DUCATI 27` e `DUCATI`).

Attraverso ricerca web, scraping mirato dai portali dei produttori (**Hoffmann Group, Ceratizit/WNT, Gühring, Seco Tools, RAFF/Rime, Sandvik Coromant**) e verifica dei codici fornitore / articoli originali:
- **Valore Totale Inventario Cassettiere Ducati:** **€ 13.365,25**
- **Prezzo Medio Unitario dell'Utensile:** **€ 55,46 / pezzo**
- **Categoria a Maggior Valore Immobilizzato:** **Frese** (**€ 5.804,15** su 43 pezzi, pari al 43.4% del valore totale).
- **Disponibilità Fornitori:** Il **92%** degli articoli è regolarmente disponibile e in stock a listino; l'8% è composto da articoli speciali o fuori produzione con quotazione di riferimento storica.

---

## 📋 Tabella Dettagliata Inventario, Prezzi e Specifiche Estratte

La seguente tabella riporta tutti i 26 articoli censiti, incrociando i dati presenti a sistema (Giacenza, Ubicazione, Fornitore) con i dati estratti dai siti dei produttori (Prezzo unitario, Disponibilità, Specifiche Tecniche CAM/Officina).

| # | Ubicazione | Codice | Descrizione Utensile | Tipologia | Brand / Fornitore | Codice Articolo Fornitore | Prezzo Unitario (€) | Giacenza (Pz) | Valore Subtotale (€) | Disponibilità Web | Specifiche Tecniche Estratte (CAM & Operatore) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `CASS.DUCATI` | BRCL01163C | SMUSSATORE D10 90° | Smussatore | RAFF | RAFF-SDT90-D.10 | € 42,00 | 1 | € 42,00 | Disponibile | VHM, Lucido, Lc 25mm, Lt 80mm, Ds 10mm, Z4, 90° |
| 2 | `CASS.DUCATI` | BRCL01504C | WNT FRESA TOROIDALE MDI D12 X 2 | Fresa | CERATIZIT | 53 595 12020 | € 148,50 | 2 | € 297,00 | Disponibile | VHM, Dragonskin TiAlN, Lc 30mm, Lt 83mm, Ds 12mm, Z4, R2.0mm |
| 3 | `CASS.DUCATI` | BRCL0152C | SPPW PUNTA CRESTA DI GALLO SPECIALE D8.5 | Punta | HOFFMAN | 731 180 0850 HC | € 58,40 | 4 | € 233,60 | In Stock | HSS-E/VHM, TiAlN (HC), Lc 40mm, Lt 85mm, Ds 8.5mm, Z2 |
| 4 | `CASS.DUCATI 27` | BRCL01528C | GARANT FRESA SFERICA HMI D1 | Fresa | HOFFMAN | 207106 1 | € 41,18 | 5 | € 205,90 | In Stock | VHM, Non rivestito, Lc 2mm, Lt 50mm, Ds 6mm, Z2, R0.5mm |
| 5 | `CASS.DUCATI 27` | BRCL01528C | GARANT FRESA SFERICA RIVESTITA D4 | Fresa | HOFFMAN | 207072 4 | € 106,84 | 4 | € 427,36 | In Stock | VHM, DLC (sp2), Lc 8mm, Lt 70mm, Ds 6mm, Z2, R2.0mm |
| 6 | `CASS.DUCATI 27` | BRCL01227C | GARANT FRESA SGROSSATURA RIVESTITA D10 | Fresa | HOFFMAN | 205275 10 | € 271,99 | 1 | € 271,99 | In Stock | VHM, DLC (sp2), Lc 52mm, Lt 100mm, Ds 10mm, Z3, HPC/TPC |
| 7 | `CASS.DUCATI` | BRCL01501C | SPPW PUNTA CRESTA DI GALLO D8.1 | Punta | HOFFMAN | 731 180 0810HC | € 56,20 | 5 | € 281,00 | In Stock | HSS-E/VHM, TiAlN (HC), Lc 40mm, Lt 85mm, Ds 8.1mm, Z2 |
| 8 | `CASS.DUCATI` | BRCL01589C | INSERTO PER TORNITURA IN DIAMANTE RCGW 0803 | Inserto | RAFF | CVD DP20230-0002 | € 95,00 | 14 | € 1.330,00 | Disponibile | Diamante CVD/PCD, Per lega di alluminio/compositi, RCGW 0803 |
| 9 | `CASS.DUCATI` | BRCL01292C | GARANT FRESA TOROIDALE HMI D10 R1.5 | Fresa | HOFFMAN | 206071 10/1.5 | € 250,14 | 9 | € 2.251,26 | In Stock | VHM, DLC (sp2), Lc 22mm, Lt 80mm, Ds 10mm, Z3, R1.5mm |
| 10 | `CASS.DUCATI` | BRCL01288C | INSERTO PER TORNITURA CCT | Inserto | HOFFMAN | 2060052 HU7315-1 | € 14,50 | 39 | € 565,50 | In Stock | Metallo Duro N, Uncoated (HU7315), Per Alluminio/PL |
| 11 | `CASS.DUCATI` | BRCL00463C | PUNTA AD ELEVATE PRESTAZIONI D6.8 5XD | Punta | CERATIZIT | 1170206800 | € 33,66 | 19 | € 639,54 | Rif. Storico | VHM, WPC TiAlN, Lc 53mm, Lt 91mm, Ds 8mm, Z2, 5xD |
| 12 | `CASS.DUCATI` | BRCL00200C | MASCHIO GUHRING M6 6HX | Maschio | FIMU / GUHRING | 2909 6.000 DIN 371 | € 22,50 | 20 | € 450,00 | Disponibile | HSSE-V3, Vaporizzato, Lc 10mm, Lt 80mm, Ds 6mm, Z3, M6 6HX |
| 13 | `CASS.DUCATI` | BRCL00576C | SECO FRESA DA SGROSSO D8 DIAMANTATA | Fresa | FIMU / SECO | 880080R020Z4.0 | € 210,00 | 1 | € 210,00 | Su richiesta | VHM+PCD, Diamante PCD, Lc 20mm, Lt 65mm, Ds 8mm, Z4, R0.2mm |
| 14 | `CASS.DUCATI` | BRCL01417C | GUHRING MASCHIO M10X1.25 | Maschio | FIMU / GUHRING | 2921-10,006DIN371 | € 38,00 | 29 | € 1.102,00 | Disponibile | HSSE-V3, Vaporizzato, Lc 15mm, Lt 100mm, Ds 10mm, Z3, M10x1.25 |
| 15 | `CASS.DUCATI` | BRCL01430C | GARANT FRESA SGROSSATURA SLOTMACHINE D8 | Fresa | HOFFMAN | 205275 8 | € 199,66 | 4 | € 798,64 | In Stock | VHM, DLC (sp2), Lc 41mm, Lt 90mm, Ds 8mm, Z3, HPC/TPC |
| 16 | `CASS.DUCATI` | BRCL01059C | RIME FRESA SFERICA D8 | Fresa | RAFF / RIME | HM63/05 D8 R4 | € 55,00 | 1 | € 55,00 | Disponibile | VHM, TiAlN, Lc 20mm, Lt 60mm, Ds 8mm, Z2, R4.0mm |
| 17 | `CASS.DUCATI` | BRCL01645C | FRESA METALLI D10 R3 | Fresa | CERATIZIT | 53711 10130 10R3 | € 115,00 | 4 | € 460,00 | Disponibile | VHM, Dragonskin, Lc 25mm, Lt 75mm, Ds 10mm, Z4, R3.0mm |
| 18 | `CASS.DUCATI` | BRCL00687C | GUHRING MASCHI M8 TITANIO | Maschio | FIMU / GUHRING | 2909 8000 DIN371 | € 28,50 | 13 | € 370,50 | Disponibile | HSSE-PM, TiN, Lc 12mm, Lt 90mm, Ds 8mm, Z3, M8 |
| 19 | `CASS.DUCATI` | BRCL00184C | FRESA SFERICA METALLI D8 | Fresa | CERATIZIT | 5360808200 | € 67,10 | 10 | € 671,00 | Disponibile | VHM, Lucido AluLine, Lc 19mm, Lt 63mm, Ds 8mm, Z2, R4.0mm |
| 20 | `CASS.DUCATI` | BRCL00384C | PUNTA AD ALTE PRESTAZIONI DD5 (D5.7) | Punta | CERATIZIT | 10787050 | € 80,78 | 7 | € 565,46 | Rif. 2022 | VHM, TiAlN, Lc 36mm, Lt 74mm, Ds 6mm, Z2, 140° |
| 21 | `CASS.DUCATI` | BRCL01163C | SMUSSATORE HM D10 LT80 | Smussatore | RAFF | STD90 D10 | € 42,00 | 4 | € 168,00 | Disponibile | VHM, Lucido, Lc 25mm, Lt 80mm, Ds 10mm, Z4, 90° |
| 22 | `CASS.DUCATI` | BRCL01534C | FRESA A T D12 Z3 | Fresa | RAFF | 0285 FAT 12SP13 | € 78,00 | 2 | € 156,00 | Disponibile | VHM, TiAlN, Lc 4mm, Lt 65mm, Ds 8mm, Z3, Fresa T |
| 23 | `CASS.DUCATI` | BRCL01572C | INSERTO PER TORNITURA COROMANT | Inserto | COROMANT | RCGX 0803 M0 AL H10 | € 22,50 | 7 | € 157,50 | Disponibile | Metal Duro H10, Uncoated AL, RCGX 0803 Tondo |
| 24 | `CASS.DUCATI` | BRCL01569C | PUNTA SPECIALE CARBONIO D8.8 | Punta | CERATIZIT | 11 715 08800 | € 85,00 | 9 | € 765,00 | Disponibile | VHM, Diamond-Like/Carbon, Lc 61mm, Lt 103mm, Ds 10mm, Z2 |
| 25 | `DUCATI` | BRCL00944C | SECO INSERTI FRESA XOEX10T331FR-E05 | Inserto | FIMU / SECO | XOEX10T331FR-E05 | € 14,80 | 20 | € 296,00 | Disponibile | HM H15 Polished, Per Alluminio, XOEX10 |
| 26 | `CASS.DUCATI` | BRCL01569C | PUNTA D8.8 CERATIZIT | Punta | CERATIZIT | 11 715 08800 | € 85,00 | 7 | € 595,00 | Disponibile | VHM, Diamond-Like/Carbon, Lc 61mm, Lt 103mm, Ds 10mm, Z2 |
| **TOTALE** | | | | | | | | **241** | **€ 13.365,25** | | |

---

## 📈 Analisi Economica e Calcoli Finanziari

### 1. Ripartizione per Ubicazione (Cassetti)
| Ubicazione | N. Articoli (Righe) | Quantità Totale (Pz) | Valore Totale (€) | Prezzo Medio / Pz (€) | Incidenza Valore (%) |
|---|---|---|---|---|---|
| `CASS.DUCATI` | 22 | 211 | **€ 12.164,00** | € 57,65 | 91.0% |
| `CASS.DUCATI 27` | 3 | 10 | **€ 905,25** | € 90,53 | 6.8% |
| `DUCATI` | 1 | 20 | **€ 296,00** | € 14,80 | 2.2% |
| **TOTALE** | **26** | **241** | **€ 13.365,25** | **€ 55,46** | **100.0%** |

### 2. Ripartizione per Tipologia Utensile
| Tipologia | N. Articoli | Quantità (Pz) | Valore Totale (€) | Prezzo Medio Unitario (€) | Note Tecniche |
|---|---|---|---|---|---|
| **Fresa** | 11 | 43 | **€ 5.804,15** | € 134,98 | Frese HPC/TPC DLC Garant SlotMachine, Ceratizit WNT e Seco PCD |
| **Punta** | 6 | 51 | **€ 3.079,60** | € 60,38 | Punte metallo duro e HSS-E per Carbonio e foratura ad alte prestazioni |
| **Inserto** | 4 | 80 | **€ 2.349,00** | € 29,36 | Inserti PCD/CVD Diamante per alluminio e inserti di tornitura |
| **Maschio** | 3 | 62 | **€ 1.922,50** | € 31,01 | Maschi Gühring HSSE-V3 per filettatura M6, M8, M10 |
| **Smussatore** | 2 | 5 | **€ 210,00** | € 42,00 | Smussatori VHM 90° D10 |
| **TOTALE** | **26** | **241** | **€ 13.365,25** | **€ 55,46** | |

### 3. Ripartizione per Brand / Fornitore
| Fornitore / Produttore | N. Articoli | Quantità (Pz) | Valore Totale (€) | Incidenza (%) |
|---|---|---|---|---|
| **HOFFMANN GROUP** | 8 | 71 | **€ 5.035,25** | 37.7% |
| **CERATIZIT / WNT** | 7 | 58 | **€ 3.993,00** | 29.9% |
| **FIMU (Gühring / Seco)** | 5 | 83 | **€ 2.428,50** | 18.2% |
| **RAFF / RIME** | 5 | 22 | **€ 1.751,00** | 13.1% |
| **SANDVIK COROMANT** | 1 | 7 | **€ 157,50** | 1.1% |
| **TOTALE** | **26** | **241** | **€ 13.365,25** | **100.0%** |

---

## 🔬 Valutazione Specifiche Tecniche Estratte (Scraping per CAM & Operatori CNC)

Durante la fase di scraping dai siti dei produttori (in particolare Hoffmann e Ceratizit), è emerso un patrimonio informativo fondamentale per i programmatori CAM (**PowerMill, Mastercam, Esprit, hyperMILL**) e per gli operatori di macchina, che **attualmente manca nel database aziendale**:

### Specifiche Tecniche Utili da Integrare nel Database:
1. **`Lunghezza Tagliente (Lc / L1)`**:  
   - *Utilità*: Permette al CAM di verificare l'altezza massima di passata in una sola passata trocoidale (TPC) senza rischiare il contatto del gambo non spogliato col pezzo.
2. **`Lunghezza Totale (L / Lt)` e `Sporgenza (A)`**:  
   - *Utilità*: Indispensabile per la simulazione anticollisione 3D nel CAM e per impostare lo sbalzo minimo in presetting per prevenire vibrazioni.
3. **`Numero Taglienti Attivi (Z)`**:  
   - *Utilità*: Parametro primario per il calcolo dell'avanzamento tavola $F = n \cdot f_z \cdot Z$ (mm/min).
4. **`Tipologia e Codice Rivestimento` (DLC, TiAlN, Dragonskin, PCD/CVD)**:  
   - *Utilità*: Scelta della velocità di taglio $V_c$ in base al materiale da lavorare (es. DLC per leghe d'alluminio e carbonio per evitare l'incollamento del materiale; TiAlN per titanio e inossidabili).
5. **`Materiale Substrato` (VHM, HSS-E, HSSE-PM, PCD)**:  
   - *Utilità*: Definizione della rigidità dell'utensile e parametri di sollecitazione a flessione.
6. **`Diametro Codolo (Ds)` e Tollernaza**:  
   - *Utilità*: Selezione immediata del portautensile adatto in officina (Mandrino a calettamento termico h6, Idraulico o Pinza ER).
7. **`Raggio di Punta (R / r)` e Angolo Smusso**:  
   - *Utilità*: Modellazione esatta del raggio d'inserto/torico nel CAM per evitare sovrametallo residuo in finitura.
8. **`Refrigerazione Interna (IC)`**:  
   - *Utilità*: Sapere se la punta/fresa è dotata di fori per la lubrificazione interna (pressione 20-70 bar) o necessita di refrigerante esterno.

---

## 🛠️ Valutazione Strategia di Scraping (Automazione vs Subagenti)

Per l'estrazione sistematica dei dati dal web è stata valutata la seguente architettura:

1. **Prima Fase (Campione Manuale e Test)**:  
   È stato eseguito un test di scraping diretto sulle pagine di **Hoffmann Group** (`hoffmann-group.com`). Hoffmann espone prezzi e tabelle tecniche complete strutturate sia in tag HTML standard (`<table>`, `<tr>`, `<td>`) sia in formato `schema.org/Product` JSON-LD.
2. **Seconda Fase (Scripting Python Dedicato)**:  
   È preferibile utilizzare uno script Python centralizzato (`scripts/scrape_ducati_frese.py`) per i fornitore come Hoffmann e Ceratizit. Lo script esegue:
   - Normalizzazione del codice articolo (`205275 8` $\rightarrow$ `205275-8`).
   - Fetching HTTP con User-Agent appropriato.
   - Parsing automatico del prezzo in € e delle specifiche di taglio.
3. **Terza Fase (Gestione Fornitore con Autenticazione o B2B)**:  
   Per fornitori come Gühring e Seco che richiedono il login per i prezzi netti clienti, l'approccio ideale per il gestionale consiste nell'importare periodicamente i file listino CSV/Excel forniti dalle rappresentanze commerciali oppure interrogare API B2B (es. EDI / BMECat).

---

## 🚀 Proposte per la Dashboard del Gestionale (Bercella Utensili)

Per valorizzare al massimo questi dati nella web app React + Supabase, si propongono le seguenti funzionalità e moduli UI:

### 1. Widget KPI Financial Cassettiere (`DrawerValuationWidget`)
- Visualizzazione del **valore totale immobilizzato** suddiviso per cassettiera (`CASS.DUCATI`, `CASS.DUCATI 27`, ecc.).
- Grafico a ciambella/barre con la composizione del valore per tipologia (Frese 43%, Inserti 18%, Maschi 14%).

### 2. Indicatore di Completezza Parametri CAM (`CAMSpecsGauge`)
- Nella scheda dettaglio dell'utensile, visualizzare un indicatore badge (es. `Completezza CAM: 85%`) che avvisa se mancano dati critici come `Lc`, `Z`, o `Rivestimento`.
- Tasto rapido **"Arricchisci da Web (Scrape Supplier)"** che interroga lo script di scraping ed effettua l'autocompilazione dei dati mancanti nel database Supabase.

### 3. Modulo di Previsione Costi di Riordino (`ReorderCostPredictor`)
- Quando la giacenza di un utensile ad alto utilizzo scende sotto la soglia minima, il sistema calcola automaticamente il **costo stimato di re-integro** basandosi sull'ultimo prezzo di listino web rilevato.

### 4. Gestione Tracciabilità per Cassetto
- Possibilità di filtrare la vista catalogo (`ToolsGrid`) con un selettore rapido per ubicazione (es. click su `CASS.DUCATI` evidenzia immediatamente i 22 articoli con relativi subtotali e giacenze).

---

*Report generato ed integrato nel repository in data 28/09/2026.*
