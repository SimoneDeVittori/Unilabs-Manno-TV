"""Fetch official-source weather and RSI RSS for GitHub Pages."""
import json, os, re, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
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
    items = [{'title':i.findtext('title',''), 'link':i.findtext('link',''), 'date':i.findtext('pubDate',''), 'category':i.findtext('category',''), 'image':(i.find('{http://search.yahoo.com/mrss/}thumbnail').get('url','') if i.find('{http://search.yahoo.com/mrss/}thumbnail') is not None else '')} for i in root.findall('./channel/item')]
    items = [i for i in items if i['title'] and i['link'].startswith('https://www.rsi.ch/')][:2]
    assert items
    result['news'] = {'items':items, 'updatedAt':now}
    result['newsError'] = False
except Exception as exc:
    print('RSI source unavailable:',type(exc).__name__)
    result['newsError'] = True

# Canton boundary from swisstopo; filter locally because the public feed also returns events outside the requested map bounds.
def inside_ring(lon, lat, ring):
    inside = False
    j = len(ring)-1
    for i in range(len(ring)):
        x1,y1 = ring[i][:2]; x2,y2 = ring[j][:2]
        if (y1>lat)!=(y2>lat) and lon<(x2-x1)*(lat-y1)/(y2-y1)+x1:
            inside = not inside
        j=i
    return inside

def in_ticino(lon, lat, geometry):
    if not (8.37 <= lon <= 9.18 and 45.82 <= lat <= 46.64):
        return False
    polygons = geometry['coordinates'] if geometry['type']=='MultiPolygon' else [geometry['coordinates']]
    return any(inside_ring(lon,lat,p[0]) and not any(inside_ring(lon,lat,h) for h in p[1:]) for p in polygons)

def traffic_time(value):
    try:
        return datetime.strptime(value,'%d.%m.%Y %H:%M:%S').replace(tzinfo=ZoneInfo('Europe/Zurich'))
    except (ValueError, TypeError):
        return None

try:
    events = json.loads(fetch('https://trafficmapsrgssr.trafficintelligence.ch/api/event/GetEventsTrafficApi/45.8,8.35,46.65,9.25/11,12,13,14,21,31,32,90/3/10/2'))
    assert isinstance(events.get('Entity'),list) and not events.get('Errors')
    geometry = json.loads((OUTPUT.parent/'ticino.geojson').read_text())['geometry']
    filtered=[]
    current=datetime.now(timezone.utc)
    for e in events['Entity']:
        if not in_ticino(float(e['Pos']['Lng']),float(e['Pos']['Lat']),geometry): continue
        category=int(e['Cat'])
        if category not in (11,12,13,14,21,31,32): continue
        info=e.get('Dic') or {}
        start,stop=traffic_time(info.get('TimeStart')),traffic_time(info.get('TimeStop'))
        if (start and start>current) or (stop and stop<current): continue
        text=' '.join([e.get('Name',''),info.get('Description') or '']).strip()
        if not text: continue
        road=re.match(r'^(A\d+|H\d+|\d+)\b', info.get('RoadNo') or e.get('Name',''))
        updated=traffic_time(info.get('LastUpdated'))
        priority={12:0,13:1,14:2,11:3,21:4,31:5,32:6}[category]
        filtered.append({'id':e['Id'],'text':text,'road':road.group(1) if road else 'TI','category':category,'changedAt':updated.isoformat() if updated else None,'priority':priority})
    filtered.sort(key=lambda e:(e['priority'],-(datetime.fromisoformat(e['changedAt']).timestamp() if e['changedAt'] else 0)))
    seen=set();items=[]
    for e in filtered:
        event_key=e['id'].split('_TIC-')[0]
        if event_key in seen: continue
        seen.add(event_key);items.append(e)
    result['traffic']={'items':items[:12],'total':len(items),'updatedAt':now,'source':'Viasuisse via RSI'}
    result['trafficError']=False
except Exception as exc:
    print('Viasuisse source unavailable:',type(exc).__name__)
    result['trafficError']=True

OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2))
if not result.get('news') or not result.get('weather'):
    raise SystemExit('Initial data incomplete; retry the workflow.')
print('Updated weather and',len(result['news']['items']),'headlines.')
