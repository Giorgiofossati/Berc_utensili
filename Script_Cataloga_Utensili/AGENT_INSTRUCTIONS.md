# Guida per Agenti LLM - Script Cataloga Utensili

Questo file serve come contesto e linea guida per qualsiasi agente AI (LLM) che debba operare, modificare o eseguire analisi all'interno di questa cartella (`Script_Cataloga_Utensili`).

## 1. Scopo della Cartella
Questa cartella contiene gli script e le regole per la pulizia, l'estrazione e la standardizzazione dei dati grezzi provenienti da vecchi file Excel/CSV di magazzino. L'obiettivo è trasformare descrizioni non strutturate (es. "FRESA MDI D10 R1 Z4") in dati tabellari strutturati e tipizzati, pronti per essere importati nel database Supabase dell'app Bercella Utensili.

## 2. Struttura dei File
- `Regole.md`: È il documento di riferimento assoluto per la classificazione. Contiene le mappature tra i termini grezzi e i valori attesi (Tipologia, Forma, Materiale, Rivestimento, ecc.). **Ogni modifica alla logica di estrazione deve prima essere allineata con queste regole.**
- `utensiliere.py`: Lo script Python principale. Prende in input un file CSV grezzo, applica espressioni regolari e regole logiche (basate su `Regole.md`) ed esporta i dati. 
- File CSV in input (es. `inventario CNC 2026...csv` o `Dati per airtable - Foglio1.csv`): Dati grezzi da processare.
- Output generati: Tradizionalmente generava `Dati rifiniti.csv` e `Da Verificare.csv`.

## 3. Logica del Parser (`utensiliere.py`)
Lo script esegue un parsing sequenziale:
1. **Tipologia**: (Fresa, Punta, Maschio, ecc.)
2. **Misure**: Diametro (stringa e float), Raggio, Angolo, Passo, Tolleranza (estratti tramite regex).
3. **Forma**: Calcolata in base alla tipologia e ai rapporti geometrici (es. se Raggio = Diametro/2, allora Fresa Sferica).
4. **Materiale e Rivestimento**: Estratti da keyword specifiche (es. VHM -> Metallo Duro).
5. **Check**: Qualsiasi parola della descrizione originale che non viene "consumata" dal parser viene inserita in un campo "Check" per verifica manuale.

## 4. Regole per le Modifiche (Codice e Regole)
- **Mantieni l'Idempotenza**: Lo script deve produrre lo stesso identico output se eseguito due volte sullo stesso input.
- **Robustezza Regex**: Quando modifichi le espressioni regolari per intercettare nuove casistiche, assicurati di usare i word boundary (`\b`) dove necessario per evitare falsi positivi (es. "M4" vs "M40").
- **Strutturazione**: Qualsiasi nuova colonna aggiunta allo script deve riflettere lo schema del database Supabase target (tabella `Utensili_B1`).

## 5. Workflow Interattivo
La revisione delle anomalie (dati incompleti o non riconosciuti) viene fatta in modo interattivo. L'LLM deve favorire soluzioni che permettano all'operatore di correggere i dati al volo, anziché costringerlo ad aprire e modificare file CSV manualmente. Le giacenze rettificate e i dati validati verranno poi caricati su Supabase.
