"""Fetch official-source weather and RSI RSS for GitHub Pages."""
import json, os, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
OUTPUT = Path(__file__).resolve().parent / 'data.json'
old = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {}
now = datetime.now(timezone.utc).isoformat()
def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent':'Unilabs-Manno-TV/1.0'})
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.read()
result = dict(old)
try:
    d = json.loads(fetch('https://app-prod-ws.meteoswiss-app.ch/v1/plzDetail?plz=692800'))
    assert isinstance(d['currentWeather']['temperature'], (int, float))
    result['weather'] = {'current':d['currentWeather'], 'forecast':d['forecast'][:4], 'updatedAt':now}
    result['weatherError'] = False
except Exception as exc:
    print('Meteo source unavailable:',type(exc).__name__)
    result['weatherError'] = True
try:
    root = ET.fromstring(fetch('https://www.rsi.ch/info/?f=rss'))
    items = [{'title':i.findtext('title',''), 'link':i.findtext('link',''), 'date':i.findtext('pubDate',''), 'category':i.findtext('category','')} for i in root.findall('./channel/item')]
    items = [i for i in items if i['title'] and i['link'].startswith('https://www.rsi.ch/')][:4]
    assert items
    result['news'] = {'items':items, 'updatedAt':now}
    result['newsError'] = False
except Exception as exc:
    print('RSI source unavailable:',type(exc).__name__)
    result['newsError'] = True
OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2))
if not result.get('news') or not result.get('weather'):
    raise SystemExit('Initial data incomplete; retry the workflow.')
print('Updated weather and',len(result['news']['items']),'headlines.')
