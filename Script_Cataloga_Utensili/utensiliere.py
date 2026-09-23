import pandas as pd
import re
import math
import os
import argparse
import json

CORREZIONI_FILE = 'correzioni_salvate.json'

def carica_correzioni():
    if os.path.exists(CORREZIONI_FILE):
        try:
            with open(CORREZIONI_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def salva_correzioni(correzioni):
    with open(CORREZIONI_FILE, 'w', encoding='utf-8') as f:
        json.dump(correzioni, f, indent=4)

def pulisci_stringa(s):
    if pd.isna(s): return ""
    return str(s).strip().upper()

def estrai_tipologia(descrizione):
    d = descrizione
    if "TASTATORE" in d: return "Tastatore"
    if "SVASATORE" in d: return "Svasatore"
    if "SMUSSATORE" in d or "SMUSATORE" in d: return "Smussatore"
    if "LAMATORE" in d: return "Lamatore"
    if "ALESATORE" in d: return "Alesatore"
    
    if "SPACCAMASCHIO" in d or "SPACCAMASCHI" in d: return "Spaccamaschio"
    if "MASCHIO" in d or "MASCHI" in d or "MASCIO" in d: return "Maschio"
    if "TRACCIATORE" in d: return "Tracciatore"
    if "PUNTA" in d or "PUNTE" in d or "PUNTINE" in d or "CRESTA DI GALLO" in d: return "Punta"
    
    if "INSERTO" in d or "INSERTI" in d:
        pos_inserto = max(d.find("INSERTI"), d.find("INSERTO"))
        pos_fresa = d.find("FRESA")
        if pos_fresa == -1 or pos_inserto < pos_fresa:
            return "Inserto"
            
    # Fix typos
    if re.search(r'\b(FRESA|FRESE|FREA|FESA|FREESA|FERSA|WNTFRESA|MICROFRESA|KARNASCH|KARNASH)\b', d): return "Fresa"
    if re.search(r'\b(PETTINE|PRTTINR)\b', d): return "Pettine"
    
    if re.search(r'\bM\d+', d) and ("HSSE" in d or "PM" in d or re.search(r'\b[4567]H[XC]?\b', d)):
        return "Maschio"
    
    if "POLLEDRO" in d: return "Lamatore"
    if "BARENO" in d: return "Alesatore"
    
    return ""

def estrai_forma(descrizione, tipologia, diametro_num, raggio_num):
    d = descrizione
    if tipologia == "Fresa" or tipologia == "Pettine":
        if "PETTINE" in d or "PRTTINR" in d: return "Pettine"
        if "DISCO" in d: return "Disco"
        if "KARNASCH" in d: return "Karnasch"
        if "INSERTI" in d or "INSERTO" in d: return "Inserti"
        
        if diametro_num is not None and raggio_num is not None:
            if math.isclose(diametro_num, raggio_num * 2, rel_tol=1e-5): return "Sferica"
            else: return "Torica"
        
        if "SFERICA" in d: return "Sferica"
        if "TORICA" in d: return "Torica"
        
        return "Candela"
        
    return ""

def estrai_misure(descrizione, misura_csv, tipologia):
    d = descrizione
    m_csv = str(misura_csv).strip().upper() if not pd.isna(misura_csv) else ""
    
    diametro_str = None
    diametro_num = None
    passo = None
    angolo_str = None
    
    match_angolo = re.search(r'\b(\d+(?:[\.,]\d+)?)°', d)
    if match_angolo:
        angolo_str = match_angolo.group(1).replace(',', '.') + "°"
    
    match_metrico = re.search(r'\b([DM])\s*(\d+(?:[\.,]\d+)?)\b', d)
    match_imp = re.search(r'\b(\d+/\d+)\b', d)
    
    if match_metrico:
        lettera = match_metrico.group(1)
        valore_str = match_metrico.group(2).replace(',', '.')
        diametro_str = f"{lettera}{valore_str}"
        try: diametro_num = float(valore_str)
        except: pass
    elif match_imp:
        diametro_str = match_imp.group(1)
        parts = diametro_str.split('/')
        if len(parts) == 2:
            try: diametro_num = float(parts[0]) / float(parts[1]) * 25.4
            except: pass
    else:
        if m_csv and m_csv != "NAN":
            m_match = re.search(r'\b([DM]?)\s*(\d+(?:[\.,]\d+)?)\b', m_csv)
            if m_match:
                lettera = m_match.group(1) if m_match.group(1) else "D" if tipologia in ["Fresa", "Punta", "Alesatore", "Lamatore"] else "M" if tipologia == "Maschio" else ""
                valore_str = m_match.group(2).replace(',', '.')
                diametro_str = f"{lettera}{valore_str}"
                try: diametro_num = float(valore_str)
                except: pass
            else:
                fraz = re.search(r'\b(\d+/\d+)\b', m_csv)
                if fraz: diametro_str = fraz.group(1)
                else: diametro_str = m_csv

    match_passo = re.search(r'(?:X|P\.|P\b|PITCH)\s*(\d+(?:[\.,]\d+)?)', d)
    if match_passo:
         passo_val = match_passo.group(1).replace(',', '.')
         try: passo = float(passo_val)
         except: pass
         
    tolleranza = None
    match_tol = re.search(r'\b(H\d+|[4567]H[XC]?)\b', d)
    if match_tol:
        tol = match_tol.group(1)
        if tol != diametro_str:
            tolleranza = tol
            
    raggio_num = None
    match_raggio = re.search(r'\bR\s*(\d+(?:[\.,]\d+)?)\b', d)
    if match_raggio:
        try: raggio_num = float(match_raggio.group(1).replace(',', '.'))
        except: pass
    else:
        if tipologia == "Fresa" and diametro_num is not None:
             if "SFERICA" in d: raggio_num = diametro_num / 2.0
             
    # Rimosso il blocco che forzava a 'no' in caso di discrepanza stretta con misura_csv
    # E' meglio fidarsi della Regex sulla descrizione, e al limite validarlo
    
    return diametro_str, diametro_num, raggio_num, tolleranza, passo, angolo_str

def estrai_sistema_misura(diametro_str, tipologia):
    if not diametro_str: return ""
    if "/" in diametro_str: return "Americano"
    if "EG" in str(tipologia).upper() or "EG" in str(diametro_str).upper(): return "EG"
    if "M" in diametro_str or "D" in diametro_str: return "Metrico"
    return ""

def estrai_rotazione(descrizione):
    if "SX" in descrizione: return "Sx"
    return "Dx"

def estrai_lavorazione(tipologia, descrizione):
    t = tipologia.upper() if tipologia else ""
    if "FRESA" in t: return "Fresatura"
    if "PUNTA" in t: return "Foratura"
    if "MASCHIO" in t or "PETTINE" in t or "SPACCAMASCHIO" in t: return "Filettatura"
    if "TASTATORE" in t: return "Tastatura"
    if "LAMATORE" in t: return "Lamatura"
    if "TORNITURA" in descrizione: return "Tornitura"
    return ""

def estrai_materiale_rivestimento(descrizione):
    rivestimento = ""
    if "DIAMANT" in descrizione or "PCD" in descrizione: rivestimento = "Diamante"
    elif "NUDA" in descrizione: rivestimento = "Nuda"
    elif re.search(r'\b(K\d+|KP\d+)\b', descrizione):
        m = re.search(r'\b(K\d+|KP\d+)\b', descrizione)
        rivestimento = m.group(1)
    
    materiale = ""
    if "METALLO DURO" in descrizione or "MDI" in descrizione or "VHM" in descrizione:
        materiale = "METALLO DURO"
    elif "HSSE" in descrizione: materiale = "HSSE"
    elif "HSS" in descrizione: materiale = "HSS"
    elif "ALLUMINIO" in descrizione: materiale = "ALLUMINIO"
    elif "CARBONIO" in descrizione: materiale = "CARBONIO"
    elif "KEVLAR" in descrizione: materiale = "KEVLAR"
    elif "VETRO" in descrizione: materiale = "VETRO"
        
    return materiale, rivestimento

def crea_check(descrizione_orig, tipologia, forma, diametro_str, raggio, tolleranza, passo, angolo, materiale, rivestimento):
    parole_orig = set(re.findall(r'\b[A-Za-z0-9_]+\b', descrizione_orig))
    comp_str = f"{tipologia} {forma} {diametro_str} R{raggio} {tolleranza} {passo} {angolo} {materiale} {rivestimento}".upper()
    parole_comp = set(re.findall(r'\b[A-Za-z0-9_]+\b', comp_str))
    
    extra = parole_orig - parole_comp
    extra_filtrato = [p for p in extra if not re.match(r'^([MDH]\d+|\d+[\.,]?\d*|[A-Z]{1,2}\d+)$', p)]
    return " ".join(extra_filtrato)

def processa_riga(row, dizionario_correzioni):
    desc_orig = pulisci_stringa(row.get('Descrizione', ''))
    if not desc_orig: return None, False, "Descrizione vuota"
    
    # 1. Controlla prima nel dizionario delle correzioni manuali
    if desc_orig in dizionario_correzioni:
        corr = dizionario_correzioni[desc_orig]
        
        # Se era stata eliminata dall'utente in passato, saltiamo in toto
        if corr.get('ELIMINATA'):
            return None, False, "Eliminazione memorizzata"
            
        riga = corr.copy()
        riga['Codice'] = pulisci_stringa(row.get('PN BRC', ''))
        riga['Serial Number'] = pulisci_stringa(row.get('Serial Number', ''))
        q_val = row.get('Quantità', '')
        if not pd.isna(q_val) and q_val != "":
            try: riga['Quantità'] = int(float(q_val))
            except: riga['Quantità'] = q_val
        else:
            riga['Quantità'] = None
            
        riga['Ubicazione'] = pulisci_stringa(row.get('Ubicazione', ''))
        riga['Stato'] = pulisci_stringa(row.get('Stato', ''))
        riga['Fornitore'] = pulisci_stringa(row.get('Fornitore', ''))
        return riga, True, ""
        
    # 2. Se non c'è, procedi con estrazione normale
    tipologia = estrai_tipologia(desc_orig)
    diametro_str, diametro_num, raggio_num, tolleranza, passo, angolo_str = estrai_misure(desc_orig, row.get('Misura', ''), tipologia)
    forma = estrai_forma(desc_orig, tipologia, diametro_num, raggio_num)
    materiale, rivestimento = estrai_materiale_rivestimento(desc_orig)
    stato = pulisci_stringa(row.get('Stato', ''))
    ubicazione = pulisci_stringa(row.get('Ubicazione', ''))
    codice = pulisci_stringa(row.get('PN BRC', ''))
    serial = pulisci_stringa(row.get('Serial Number', ''))
    fornitore = pulisci_stringa(row.get('Fornitore', ''))
    
    q_val = row.get('Quantità', '')
    if pd.isna(q_val) or q_val == "": quantita = None
    else:
        try: quantita = int(float(q_val))
        except: quantita = q_val
            
    lavorazione = estrai_lavorazione(tipologia, desc_orig)
    sistema_misura = estrai_sistema_misura(diametro_str, desc_orig)
    alias = desc_orig
    rotazione = estrai_rotazione(desc_orig)
    
    check_val = crea_check(desc_orig, tipologia, forma, diametro_str, raggio_num, tolleranza, passo, angolo_str, materiale, rivestimento)
    
    riga = {
        'Descrizione Originale': desc_orig,
        'Tipologia': tipologia,
        'Forma': forma,
        'Diametro': diametro_str,
        'Diametro Nominale': diametro_num,
        'Raggio': raggio_num,
        'Passo': passo,
        'Tolleranza': tolleranza,
        'Lunghezza': None,
        'Angolo': angolo_str,
        'Rotazione': rotazione,
        'Materiale': materiale,
        'Rivestimento': rivestimento,
        'Stato': stato,
        'Ubicazione': ubicazione,
        'Codice': codice,
        'Serial Number': serial,
        'Fornitore': fornitore,
        'Quantità': quantita,
        'Lavorazione': lavorazione,
        'Sistema di misura': sistema_misura,
        'Alias': alias,
        'Check': check_val
    }
    
    is_valido = True
    motivo_scarto = []
    
    if not tipologia:
        is_valido = False
        motivo_scarto.append("Manca Tipologia")
    if not diametro_str:
        if tipologia not in ["Inserto", "Tastatore", "Tracciatore"]:
            is_valido = False
            motivo_scarto.append("Manca Diametro")
        
    return riga, is_valido, " ".join(motivo_scarto)

def revisione_interattiva(righe_scartate, dizionario_correzioni):
    print("\n" + "="*50)
    print(f"🛠️  MODALITÀ REVISIONE INTERATTIVA ({len(righe_scartate)} elementi)")
    print("="*50)
    
    righe_salvate = []
    nuove_correzioni = 0
    
    for i, item in enumerate(righe_scartate):
        r = item['riga']
        motivo = item['motivo']
        print(f"\n[{i+1}/{len(righe_scartate)}] ⚠️  MOTIVO SCARTO: {motivo}")
        print(f"📌 Descrizione: {r['Descrizione Originale']}")
        if r['Check']:
            print(f"🔍 Parole extra trovate: {r['Check']}")
            
        print(f"   Valori correnti: Tipologia=[{r['Tipologia']}], Diametro=[{r['Diametro']}], Forma=[{r['Forma']}]")
        
        azione = input("Premi Invio per correggere, 's' per saltare (rimane da verificare), 'e' per eliminare riga, 'q' per uscire: ").strip().lower()
        if azione == 'q':
            print("Uscita anticipata. Salvataggio in corso...")
            # Aggiungiamo i restanti alle righe salvate per lasciarli in da verificare
            for rest in righe_scartate[i:]:
                if not rest.get('eliminata', False):
                    righe_salvate.append(rest['riga'])
            break
        elif azione == 's':
            righe_salvate.append(r)
            continue
        elif azione == 'e':
            print("❌ Riga eliminata definitivamente (non verrà salvata da nessuna parte).")
            # Segniamo che è eliminata
            item['eliminata'] = True
            # Non la aggiungiamo a righe_salvate, quindi sparisce!
            
            # Vuoi memorizzare l'eliminazione per le future occorrenze?
            salva_regola = input("Vuoi ricordare l'ELIMINAZIONE per future descrizioni identiche? (s/n): ").strip().lower()
            if salva_regola == 's' or salva_regola == '':
                # Salviamo un record speciale nel dizionario
                r_eliminata = r.copy()
                r_eliminata['ELIMINATA'] = True
                dizionario_correzioni[r['Descrizione Originale']] = r_eliminata
                nuove_correzioni += 1
            continue
            
        # Correzione manuale
        nuova_tipologia = input(f"Nuova Tipologia [{r['Tipologia']}]: ").strip()
        if nuova_tipologia: r['Tipologia'] = nuova_tipologia.capitalize()
        
        nuovo_diametro = input(f"Nuovo Diametro (es. D10, M6) [{r['Diametro']}]: ").strip()
        if nuovo_diametro: 
            r['Diametro'] = nuovo_diametro.upper()
            try: 
                r['Diametro Nominale'] = float(re.sub(r'[A-Za-z]', '', nuovo_diametro).replace(',','.'))
            except: pass
            
        nuova_forma = input(f"Nuova Forma [{r['Forma']}]: ").strip()
        if nuova_forma: r['Forma'] = nuova_forma.capitalize()
            
        r['Check'] = "" 
        
        # Vuoi salvare questa regola per il futuro?
        salva_regola = input("Vuoi ricordare queste modifiche per future descrizioni identiche? (s/n): ").strip().lower()
        if salva_regola == 's' or salva_regola == '':
            dizionario_correzioni[r['Descrizione Originale']] = r.copy()
            nuove_correzioni += 1
            
        item['is_valido'] = True
        righe_salvate.append(r)
        
    if nuove_correzioni > 0:
        salva_correzioni(dizionario_correzioni)
        print(f"\n✅ {nuove_correzioni} nuove regole apprese e salvate in {CORREZIONI_FILE}!")
        
    return righe_salvate

def main():
    parser = argparse.ArgumentParser(description="Script di catalogazione utensili CNC")
    parser.add_argument("-i", "--input", default="inventario CNC 2026 versione online.xlsx - Inv Gennaio 26-NON UTILIZZARE.csv", help="File CSV di input")
    parser.add_argument("--interactive", action="store_true", help="Avvia la modalità di revisione interattiva per i record scartati")
    parser.add_argument("--sql", action="store_true", help="Genera anche lo script SQL per aggiornare le giacenze senza duplicati")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Errore: File '{args.input}' non trovato.")
        return

    try: 
        df = pd.read_csv(args.input)
        if 'Descrizione' not in df.columns:
            df = pd.read_csv(args.input, header=1)
    except Exception as e:
        print(f"Errore caricamento: {e}")
        return

    dizionario_correzioni = carica_correzioni()

    righe_rifinite = []
    righe_scartate = []
    
    print(f"Avvio elaborazione di {len(df)} righe...")
    
    for idx, row in df.iterrows():
        riga, is_valido, motivo = processa_riga(row, dizionario_correzioni)
        if not riga: continue
            
        if is_valido: 
            righe_rifinite.append(riga)
        else: 
            righe_scartate.append({'riga': riga, 'motivo': motivo})
            
    print(f"Elaborazione completata! Validi: {len(righe_rifinite)} | Da verificare: {len(righe_scartate)}")
    
    if args.interactive and len(righe_scartate) > 0:
        righe_post_revisione = revisione_interattiva(righe_scartate, dizionario_correzioni)
        
        scarti_finali = []
        for r in righe_post_revisione:
            if r['Tipologia'] and r['Diametro']:
                righe_rifinite.append(r)
            else:
                if r['Tipologia'] in ["Inserto", "Tastatore", "Tracciatore"] and r['Tipologia']:
                    righe_rifinite.append(r)
                else:
                    r['Motivo Verifica'] = "Dati ancora mancanti dopo revisione"
                    scarti_finali.append(r)
    else:
        scarti_finali = [x['riga'] for x in righe_scartate]
        for s, x in zip(scarti_finali, righe_scartate):
            s['Motivo Verifica'] = x['motivo']
            
    df_pronti = pd.DataFrame(righe_rifinite)
    df_scarti = pd.DataFrame(scarti_finali)
    
    # Cast Quantità to Int64 to avoid .0 float formatting (Supabase bigint error)
    if 'Quantità' in df_pronti.columns:
        df_pronti['Quantità'] = pd.to_numeric(df_pronti['Quantità'], errors='coerce').astype('Int64')
    if 'Quantità' in df_scarti.columns:
        df_scarti['Quantità'] = pd.to_numeric(df_scarti['Quantità'], errors='coerce').astype('Int64')
        
    # Pulizia colonne
    if 'Motivo Verifica' in df_pronti.columns:
        df_pronti = df_pronti.drop(columns=['Motivo Verifica'])
    
    
    df_pronti.to_csv('Dati_Rifiniti.csv', index=False)
    df_scarti.to_csv('Da_Verificare.csv', index=False)
    
    if args.sql:
        with open('aggiornamento_magazzino.sql', 'w', encoding='utf-8') as f:
            f.write("-- Script generato per aggiornare le giacenze senza duplicare i record\n")
            f.write("BEGIN;\n\n")
            
            for riga in righe_rifinite:
                codice = str(riga.get('Codice', '')).strip()
                desc_orig = str(riga.get('Descrizione Originale', '')).replace("'", "''").strip()
                
                usa_codice = True
                if not codice or codice.lower() == 'nan' or codice == '-':
                    usa_codice = False
                    
                if not usa_codice and not desc_orig:
                    continue
                    
                q_val = riga.get('Quantità')
                if q_val is None or str(q_val).lower() == 'nan' or str(q_val) == '<NA>':
                    quantita = "NULL"
                else:
                    try:
                        quantita = int(float(q_val))
                    except:
                        quantita = "NULL"
                    
                def get_val(col):
                    val = riga.get(col)
                    if val is None or str(val).lower() == 'nan':
                        return "NULL"
                    return f"'{str(val).replace(chr(39), chr(39)+chr(39))}'"
                    
                tipologia = get_val('Tipologia')
                forma = get_val('Forma')
                diametro = get_val('Diametro')
                
                if usa_codice:
                    where_clause = f"\"Codice\" = '{codice}'"
                else:
                    where_clause = f"\"Alias\" = '{desc_orig}' OR \"Descrizione Originale\" = '{desc_orig}'"
                    
                sql = f'UPDATE public."Utensili_B1" SET "Quantità" = {quantita}, "Tipologia" = {tipologia}, "Forma" = {forma}, "Diametro" = {diametro} WHERE {where_clause};\n'
                f.write(sql)
                
            f.write("\nCOMMIT;\n")
        print("✅ aggiornamento_magazzino.sql: Script SQL generato!")

    
    print(f"\nSalvataggio completato!")
    print(f"✅ Dati_Rifiniti.csv: {len(df_pronti)} righe")
    print(f"⚠️  Da_Verificare.csv: {len(df_scarti)} righe")

if __name__ == "__main__":
    main()
