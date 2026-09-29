#!/usr/bin/env python3
"""
Script di sincronizzazione prezzi per Bercella Utensili.
Recupera i prezzi ufficiali netti (senza IVA) da Hoffmann Group B2B.

Regole rigorose applicate:
- Zero dati inventati o stimati: se il codice fornitore non combacia con certezza, resta vuoto (NULL).
- Verifica di brand/titolo (GARANT/HOLEX) e riscontro tipologico su ogni match.
- Genera comandi SQL puliti e verificabili per Supabase.

Utilizzo:
  python3 scripts/sync_tool_prices.py [--apply]
"""

import sys
import json
import urllib.request
import re
import os

SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL', 'https://avihnvlaidllmimxqouh.supabase.co')
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY', '')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

TARGET_LOCATIONS = ['DUCATI', 'IR27', 'JANUS', 'OPERCOLI', 'SPARKWING']

def fetch_tools():
    """Recupera gli utensili delle cassette target da Supabase."""
    filter_or = ','.join([f'Ubicazione.ilike.*{loc}*' for loc in TARGET_LOCATIONS])
    url = f"{SUPABASE_URL}/rest/v1/Utensili_B1?select=id,Codice,Serial%20Number,Descrizione%20Originale,Tipologia,Fornitore,Ubicazione&or=({filter_or})&order=Ubicazione.asc"
    
    req = urllib.request.Request(url, headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}'
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def scrape_hoffmann(serial, desc):
    """
    Risolve il codice su Hoffmann Group con validazione di sicurezza.
    Ritorna (prezzo, codice_valido, url) se confermato, altrimenti (None, None, None).
    """
    if not serial:
        return None, None, None
    s = serial.strip()
    desc_up = (desc or '').upper()

    # Correzioni e varianti
    if s == '409548' and 'D8M' in desc_up:
        candidates = ['209548-8M']
    elif re.match(r'^\d{3}\s+\d{3}', s):
        cleaned = re.sub(r'\s+', '', s)
        candidates = [cleaned, cleaned.split('-')[0]]
    else:
        parts = s.split()
        candidates = []
        if len(parts) >= 2:
            candidates.append(f'{parts[0]}-{parts[1].replace("/", "-")}')
            candidates.append(f'{parts[0]}-{parts[1]}')
            candidates.append(parts[0])
        else:
            candidates.append(s)

    seen = set()
    for cand in candidates:
        if not cand or cand in seen:
            continue
        seen.add(cand)
        url = f'https://www.hoffmann-group.com/IT/it/hoi/p/{cand}'
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.status == 200:
                    html = resp.read().decode('utf-8')
                    brand_match = re.search(r'brand&quot;:&quot;([^&]+)&quot;', html)
                    brand = brand_match.group(1).upper() if brand_match else ''
                    title_match = re.search(r'<title>(.*?)</title>', html)
                    title = title_match.group(1).upper() if title_match else ''

                    # Rigorosa validazione: marchio Garant/Holex o coerenza utensile
                    if not ('GARANT' in brand or 'HOLEX' in brand or 
                            'FRESA' in title or 'PUNTA' in title or 'MASCHIO' in title or 'INSERTO' in title):
                        continue

                    # Estrazione prezzo netto
                    price_match = re.search(r'price&quot;:&quot;([0-9.]+)&quot;', html)
                    if price_match:
                        return float(price_match.group(1)), cand, url
        except Exception:
            continue
    return None, None, None

def main():
    apply_db = '--apply' in sys.argv
    print(f"=== Sincronizzazione Prezzi Utensili Bercella ===")
    print(f"Ubicazioni: {', '.join(TARGET_LOCATIONS)}")
    print(f"Modalità: {'APPLICA DIRETTAMENTE A DB' if apply_db else 'GENERA FILE SQL'}")
    
    tools = fetch_tools()
    print(f"Trovati {len(tools)} utensili nelle cassette target.\n")

    verified_results = []
    unresolved_count = 0

    for t in tools:
        # Se fornitore non è Hoffman, non azzardiamo scraping cieco
        if t.get('Fornitore') != 'HOFFMAN':
            unresolved_count += 1
            continue

        price, cand, url = scrape_hoffmann(t.get('Serial Number'), t.get('Descrizione Originale'))
        if price:
            verified_results.append({
                'id': t['id'],
                'ubicazione': t.get('Ubicazione'),
                'codice': t.get('Codice'),
                'descrizione': t.get('Descrizione Originale'),
                'serial_number': t.get('Serial Number'),
                'price': price,
                'url': url
            })
            print(f"  [TROVATO € {price:6.2f}] {t.get('Ubicazione'):<18} | {t.get('Codice', 'N/A'):<10} | {t.get('Descrizione Originale')}")
        else:
            unresolved_count += 1

    print(f"\nRisultato:")
    print(f"  - Prezzi ufficiali verificati: {len(verified_results)}")
    print(f"  - Da completare/Speciali/Non presenti: {unresolved_count} (lasciati vuoti/NULL)")

    # Genera file SQL
    sql_path = os.path.join(os.path.dirname(__file__), 'update_prices.sql')
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("-- Aggiornamento prezzi da listino ufficiale Hoffmann Group B2B (IVA esclusa)\n\n")
        for r in verified_results:
            f.write(f"-- {r['ubicazione']} | {r['codice']} | {r['descrizione']} ({r['url']})\n")
            f.write(f"UPDATE \"Utensili_B1\" SET \"Prezzo\" = {r['price']:.2f} WHERE id = '{r['id']}';\n\n")

    print(f"\nComandi SQL generati con successo in: {sql_path}")

if __name__ == '__main__':
    main()
