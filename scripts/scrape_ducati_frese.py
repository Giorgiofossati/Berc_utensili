#!/usr/bin/env python3
"""
Script di scraping e analisi prezzi/specifiche tecniche per utensili
nelle ubicazioni CASS.DUCATI, CASS.DUCATI27 e DUCATI.
Progetto: Bercella Utensili
"""

import json
import urllib.request
import re
import os

# Configurazione header per scraping
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def fetch_hoffmann_data(article_code):
    """
    Recupera prezzo, titolo e specifiche tecniche da Hoffmann Group.
    """
    url = f"https://www.hoffmann-group.com/IT/it/hoi/p/{article_code.replace(' ', '-')}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8')
            prices = re.findall(r'([0-9]+[.,][0-9]{2})\s*€|€\s*([0-9]+[.,][0-9]{2})', html)
            price = prices[0][0] or prices[0][1] if prices else None
            
            # Estrarre righe tabella specifiche
            tech_matches = re.findall(r'<tr[^>]*>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>\s*</tr>', html, re.DOTALL)
            specs = {}
            for td1, td2 in tech_matches:
                clean1 = re.sub(r'<[^>]+>', '', td1).replace('&nbsp;', ' ').strip()
                clean2 = re.sub(r'<[^>]+>', '', td2).replace('&nbsp;', ' ').strip()
                if clean1 and clean2:
                    specs[clean1] = clean2
            return {'price': price, 'specs': specs, 'url': url, 'status': 'OK'}
    except Exception as e:
        return {'price': None, 'specs': {}, 'url': url, 'status': str(e)}

if __name__ == '__main__':
    print("Script Analisi Frese Ducati pronto.")
