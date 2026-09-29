#!/usr/bin/env python3
"""
Script di estrapolazione prezzi da file Excel ordini + Report Ducati.
Incrocia i dati storici di acquisto reali con la tabella inventario Utensili_B1.
"""

import openpyxl
import json
import re
import os

EXCEL_PATH = '/Users/gio/.gemini/antigravity/brain/dab1d4dc-9c31-4b5b-abb5-6d3197f07dd4/.user_uploaded/media_1790714629620.xlsx'
INVENTORY_PATH = 'scripts/all_inventory_tools.json'
REPORT_DUCATI_PATH = 'docs/Analisi_Frese/Report_Frese_Ducati.md'

ORDER_SHEETS = [
    ('Inserimento ordini 2026', 1, 2, 10, 8, 5, 2026),
    ('Inserimento ordini 2025', 1, 2, 10, 8, 5, 2025),
    ('Inserimento ordini 2024 (2)', 1, 2, 8, 6, 3, 2024),
    ('Inserimento ordini 2024', 1, 2, 8, 6, 3, 2024),
    ('Inserimento ordini 2023 (2)', 1, 2, 8, 6, 3, 2023),
    ('Inserimento ordini 2023', 1, 2, 8, 6, 3, 2023),
    ('richieste offerte (2)', 2, 1, 5, None, 4, 2023),
    ('richieste offerte', 2, 1, 5, None, 4, 2023)
]

def parse_price(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val) if val > 0 else None
    s = str(val).strip()
    if not s or s in ['#N/A', '0', '0.0', 'attesa quotazione']:
        return None
    
    # Sconto es. '43,66 € sconto 30%' oppure '180,32 sconto 27%'
    disc_match = re.search(r'([0-9]+[.,]?[0-9]*)\s*€?\s*sconto\s*([0-9]+)%', s, re.I)
    if disc_match:
        base = float(disc_match.group(1).replace(',', '.'))
        disc = float(disc_match.group(2))
        return round(base * (1.0 - disc / 100.0), 2)
        
    num_match = re.search(r'([0-9]+[.,][0-9]{2,})|([0-9]+)', s)
    if num_match:
        cand = num_match.group(0).replace(',', '.')
        try:
            val_f = float(cand)
            return val_f if val_f > 0 else None
        except ValueError:
            return None
    return None

def normalize_code(c):
    if not c:
        return ''
    return str(c).strip().upper().replace(' ', '').replace('\xa0', '')

def clean_alphanumeric(s):
    if not s:
        return ''
    return re.sub(r'[^A-Z0-9]', '', str(s).upper())

def main():
    print("=== Elaborazione Listini Ordini Excel & Inventario Bercella ===")
    
    with open(INVENTORY_PATH, 'r', encoding='utf-8') as f:
        inventory = json.load(f)
        
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    
    orders_by_code = {}
    all_orders = []
    
    for sname, c_code, c_desc, c_price, c_date, c_supp, default_year in ORDER_SHEETS:
        ws = wb[sname]
        for r in range(2, ws.max_row + 1):
            raw_p = ws.cell(r, c_price).value if c_price else None
            price = parse_price(raw_p)
            if not price:
                continue
            code_raw = ws.cell(r, c_code).value if c_code else None
            desc_raw = ws.cell(r, c_desc).value if c_desc else None
            date_raw = ws.cell(r, c_date).value if c_date else None
            
            code_norm = normalize_code(code_raw)
            desc_str = str(desc_raw or '').strip()
            date_str = str(date_raw or '')
            
            entry = {
                'sheet': sname,
                'year': default_year,
                'date': date_str,
                'price': price,
                'code': code_norm,
                'desc': desc_str
            }
            all_orders.append(entry)
            if code_norm:
                orders_by_code.setdefault(code_norm, []).append(entry)
                
    print(f"Ordini con prezzo estratti dall'Excel: {len(all_orders)}")
    print(f"Codici ordine univoci: {len(orders_by_code)}")

    # Carica report prezzi Ducati di ieri
    yesterday_prices = {}
    if os.path.exists(REPORT_DUCATI_PATH):
        with open(REPORT_DUCATI_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                m = re.search(r'\|\s*(\d+)\s*\|\s*`([^`]+)`\s*\|\s*([A-Za-z0-9_-]+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*€\s*([0-9]+[.,][0-9]{2})', line)
                if m:
                    c = normalize_code(m.group(3))
                    sn = clean_alphanumeric(m.group(7))
                    p = float(m.group(8).replace(',', '.'))
                    yesterday_prices[(c, sn)] = (p, 'Report Ducati 28/09')
                    if c not in yesterday_prices:
                        yesterday_prices[c] = (p, 'Report Ducati 28/09')
        print(f"Prezzi caricati da Report Ducati: {len(yesterday_prices)}")

    # Carica anche i prezzi estratti live da Hoffmann per le cassette target
    hoffmann_live = {}
    if os.path.exists('scripts/verified_prices.json'):
        with open('scripts/verified_prices.json') as f:
            v_items = json.load(f)
            for v in v_items:
                hoffmann_live[v['id']] = (v['price'], f"Hoffmann Group B2B ({v['url']})")

    # Match su ciascun utensile dell'inventario
    matched_tools = []
    
    for t in inventory:
        t_id = t['id']
        t_cod = normalize_code(t.get('Codice'))
        t_sn = clean_alphanumeric(t.get('Serial Number'))
        t_desc = t.get('Descrizione Originale', '')
        t_ubi = t.get('Ubicazione', '')
        
        price = None
        source = None

        # Priorità 1: Se l'articolo ha un ordine d'acquisto effettivo nell'Excel
        if t_cod and t_cod in orders_by_code:
            # Prendi l'ordine più recente (anno più alto, data più recente)
            cands = sorted(orders_by_code[t_cod], key=lambda x: (x['year'], x['date']), reverse=True)
            price = cands[0]['price']
            source = f"Ordine {cands[0]['year']} ({cands[0]['sheet']})"
            
        # Priorità 2: Prezzo verificato da Report Ducati di ieri (per cassette Ducati)
        if not price:
            if (t_cod, t_sn) in yesterday_prices:
                price, source = yesterday_prices[(t_cod, t_sn)]
            elif t_cod and t_cod in yesterday_prices:
                price, source = yesterday_prices[t_cod]
                
        # Priorità 3: Hoffmann Live Scrape (se presente)
        if not price and t_id in hoffmann_live:
            price, source = hoffmann_live[t_id]
            
        # Priorità 4: Serial number matching accurato negli ordini Excel
        if not price and t_sn and len(t_sn) >= 6:
            # Cerca se il serial number o part number compare nella descrizione dell'ordine
            for o in all_orders:
                o_desc_clean = clean_alphanumeric(o['desc'])
                if t_sn in o_desc_clean:
                    price = o['price']
                    source = f"Ordine {o['year']} (Match SN '{t.get('Serial Number')}')"
                    break

        if price:
            matched_tools.append({
                'id': t_id,
                'codice': t.get('Codice'),
                'serial_number': t.get('Serial Number'),
                'descrizione': t_desc,
                'ubicazione': t_ubi,
                'fornitore': t.get('Fornitore'),
                'price': price,
                'source': source
            })

    print(f"\n==========================================")
    print(f"RISULTATO TOTALE:")
    print(f"Utensili inventario valorizzati con prezzo reale: {len(matched_tools)} su {len(inventory)}")
    print(f"==========================================")
    
    # Salva in json
    with open('scripts/all_matched_prices.json', 'w', encoding='utf-8') as f:
        json.dump(matched_tools, f, indent=2, ensure_ascii=False)
        
    # Genera SQL per Supabase
    sql_path = 'scripts/update_all_inventory_prices.sql'
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("-- ==================================================================\n")
        f.write("-- AGGIORNAMENTO PREZZI EFFETTIVI DA STORICO ORDINI ACQUISTO BERCELLA\n")
        f.write(f"-- Totale utensili aggiornati: {len(matched_tools)}\n")
        f.write("-- Prezzi al netto di IVA (imponibile d'acquisto unitario)\n")
        f.write("-- ==================================================================\n\n")
        for m in matched_tools:
            f.write(f"-- [{m['ubicazione']}] {m['codice'] or 'SENZA-CODICE'} | SN: {m['serial_number'] or 'N/A'} | {m['descrizione']}\n")
            f.write(f"-- Fonte: {m['source']}\n")
            f.write(f"UPDATE \"Utensili_B1\" SET \"Prezzo\" = {m['price']:.2f} WHERE id = '{m['id']}';\n\n")
            
    print(f"Comando SQL scritto in: {sql_path}")

if __name__ == '__main__':
    main()
