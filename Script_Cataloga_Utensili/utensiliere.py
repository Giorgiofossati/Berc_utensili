import pandas as pd
import re
import math

def pulisci_stringa(s):
    if pd.isna(s): return ""
    return str(s).strip().upper()

def estrai_tipologia(descrizione):
    d = descrizione
    if "TASTATORE" in d: return "Tastatore"
    if "SVASATORE" in d: return "Svasatore"
    if "SMUSSATORE" in d: return "Smussatore"
    if "LAMATORE" in d: return "Lamatore"
    if "ALESATORE" in d: return "Alesatore"
    
    # Maschi e simili
    if "SPACCAMASCHIO" in d or "SPACCAMASCHI" in d: return "Spaccamaschio"
    if "MASCHIO" in d: return "Maschio"
    
    if "TRACCIATORE" in d: return "Tracciatore"
    if "PUNTA" in d: return "Punta"
    
    # Regola crest di gallo = spesso è Punta o Fresa, di solito Punta speciale
    if "CRESTA DI GALLO" in d: return "Punta"
    
    if "INSERTO" in d or "INSERTI" in d:
        pos_inserto = max(d.find("INSERTI"), d.find("INSERTO"))
        pos_fresa = d.find("FRESA")
        if pos_fresa == -1 or pos_inserto < pos_fresa:
            return "Inserto"
            
    if "FRESA" in d: return "Fresa"
    
    # Implicit typologies
    if "PETTINE" in d: return "Fresa"
    if "POLLEDRO" in d: return "Lamatore"
    if "BARENO" in d: return "Alesatore"
    
    return ""

def estrai_forma(descrizione, tipologia, diametro_num, raggio_num):
    d = descrizione
    if tipologia == "Fresa":
        if "PETTINE" in d: return "Pettine"
        if "DISCO" in d: return "Disco"
        if "KARNASCH" in d: return "Karnasch"
        if "INSERTI" in d or "INSERTO" in d: return "Inserti"
        
        if diametro_num is not None and raggio_num is not None:
            if math.isclose(diametro_num, raggio_num * 2, rel_tol=1e-5): return "Sferica"
            else: return "Torica"
        
        if "SFERICA" in d: return "Sferica"
        if "TORICA" in d: return "Torica"
        
        if "R" not in d and "D" not in d:
            return "Candela"
            
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
    
    # Estrazioni D/M
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
        # Fallback for Inserts or components that might just state "H15", "WPR20" but we specifically want typical measure from Measure col
        if m_csv and m_csv != "NAN":
            m_match = re.search(r'\b([DM]?)\s*(\d+(?:[\.,]\d+)?)\b', m_csv)
            if m_match:
                lettera = m_match.group(1) if m_match.group(1) else "D" if tipologia in ["Fresa", "Punta", "Alesatore", "Lamatore"] else "M" if tipologia == "Maschio" else ""
                valore_str = m_match.group(2).replace(',', '.')
                diametro_str = f"{lettera}{valore_str}"
                try: diametro_num = float(valore_str)
                except: pass
            else:
                # If the measure column literally is just the string (e.g. "1/4-28 UNF")
                fraz = re.search(r'\b(\d+/\d+)\b', m_csv)
                if fraz: diametro_str = fraz.group(1)
                else: diametro_str = m_csv

    # Passo
    match_passo = re.search(r'(?:X|P\.|P\b|PITCH)\s*(\d+(?:[\.,]\d+)?)', d)
    if match_passo:
         passo_val = match_passo.group(1).replace(',', '.')
         try: passo = float(passo_val)
         except: pass
         
    # Tolleranza
    tolleranza = None
    match_tol = re.search(r'\b(H\d+|[4567]H[XC]?)\b', d)
    if match_tol:
        tol = match_tol.group(1)
        if tol != diametro_str:
            tolleranza = tol
            
    # Raggio
    raggio_num = None
    match_raggio = re.search(r'\bR\s*(\d+(?:[\.,]\d+)?)\b', d)
    if match_raggio:
        try: raggio_num = float(match_raggio.group(1).replace(',', '.'))
        except: pass
    else:
        if tipologia == "Fresa" and diametro_num is not None:
             if "SFERICA" in d: raggio_num = diametro_num / 2.0
             
    # Strict validation with CSV Measure to avoid "no" when unnecessary
    if m_csv and m_csv != "NAN" and diametro_str:
        # Pulisci
        m_csv_pulita = re.sub(r'[A-Za-z\s]', '', m_csv).replace(',', '.')
        d_str_pulito = re.sub(r'[A-Za-z\s]', '', diametro_str).replace(',', '.')
        
        # If there's actually numbers to compare
        if m_csv_pulita and d_str_pulito:
            if m_csv_pulita != d_str_pulito:
                 if not (d_str_pulito in m_csv_pulita or m_csv_pulita in d_str_pulito):
                     diametro_str = "no"

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
    
    materiale = ""
    if "METALLO DURO" in descrizione or "MDI" in descrizione or "VHM" in descrizione:
        materiale = "METALLO DURO"
    elif "HSSE" in descrizione:
        materiale = "HSSE"
    elif "HSS" in descrizione:
        if "HSSE" not in descrizione: materiale = "HSS"
    elif "ALLUMINIO" in descrizione:
        materiale = "ALLUMINIO"
    elif "CARBONIO" in descrizione:
        materiale = "CARBONIO"
    elif "KEVLAR" in descrizione:
        materiale = "KEVLAR"
    elif "VETRO" in descrizione:
        materiale = "VETRO"
        
    return materiale, rivestimento

def crea_check(descrizione_orig, tipologia, forma, diametro_str, raggio, tolleranza, passo, angolo, materiale, rivestimento):
    parole_orig = set(re.findall(r'\b[A-Za-z0-9_]+\b', descrizione_orig))
    comp_str = f"{tipologia} {forma} {diametro_str} R{raggio} {tolleranza} {passo} {angolo} {materiale} {rivestimento}".upper()
    parole_comp = set(re.findall(r'\b[A-Za-z0-9_]+\b', comp_str))
    
    extra = parole_orig - parole_comp
    extra_filtrato = [p for p in extra if not re.match(r'^([MDH]\d+|\d+[\.,]?\d*|[A-Z]{1,2}\d+)$', p)]
    return " ".join(extra_filtrato)

def main():
    file_input = 'Dati per airtable - Foglio1.csv'
    try: df = pd.read_csv(file_input)
    except Exception as e:
        print(f"Errore caricamento: {e}")
        return

    righe_rifinite = []
    righe_scartate = []
    
    for idx, row in df.iterrows():
        desc_orig = pulisci_stringa(row.get('Descrizione', ''))
        if not desc_orig: continue
            
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
        if pd.isna(q_val) or q_val == "":
            quantita = None
        else:
            try:
                quantita = int(float(q_val))
            except:
                quantita = q_val
                
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
            motivo_scarto.append("Manca Tipologia/Sconosciuta")
        if diametro_str == "no" or not diametro_str:
            # We don't always need dim for inserts, but rules request measure
            # Se la parola INSERTO c'è, magari soprassiedi alla misura stretta, ci ha detto l'utente "se c'è discrepanza mettili da verificare"
            # Quindi manteniamo il vincolo
            is_valido = False
            motivo_scarto.append("Manca Diametro o Discrepanza")
            
        riga['Motivo Verifica'] = " ".join(motivo_scarto)
        
        if is_valido: righe_rifinite.append(riga)
        else: righe_scartate.append(riga)
            
    df_pronti = pd.DataFrame(righe_rifinite)
    df_scarti = pd.DataFrame(righe_scartate)
    
    if 'Motivo Verifica' in df_pronti.columns:
         df_pronti = df_pronti.drop(columns=['Motivo Verifica'])
    
    df_pronti.to_csv('Dati rifiniti.csv', index=False)
    df_scarti.to_csv('Da Verificare.csv', index=False)
    print(f"Completato! Rifiniti: {len(df_pronti)} | Da verificare: {len(df_scarti)}")

if __name__ == "__main__":
    main()