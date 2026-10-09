"""Fetch official-source weather and RSI RSS for GitHub Pages."""
import json, os, re, html, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from email.utils import parsedate_to_datetime
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
    from weather_week import get_week
    result['week'] = get_week(old.get('week'))
    result['weekError'] = False
except Exception as exc:
    print('MeteoSwiss weekly source unavailable:',type(exc).__name__)
    result['weekError'] = True
try:
    d = json.loads(fetch('https://app-prod-ws.meteoswiss-app.ch/v1/plzDetail?plz=692800'))
    assert isinstance(d['currentWeather']['temperature'], (int, float))
    result['weather'] = {'current':d['currentWeather'], 'forecast':d['forecast'][:4], 'updatedAt':now}
    result['weatherError'] = False
except Exception as exc:
    print('Meteo source unavailable:',type(exc).__name__)
    result['weatherError'] = True
# The RSI regional feed also contains Grisons and Insubria: require an explicit Ticino reference.
TICINO_TERMS = r"\b(?:ticino|ticines[ei]|lugano|luganese|bellinzona|bellinzonese|locarno|locarnese|mendrisio|mendrisiotto|chiasso|massagno|manno|ascona|losone|minusio|muralto|biasca|airolo|quinto|faido|leventina|riviera|blenio|acquarossa|serravalle|vallemaggia|maggia|lavizzara|cevio|bignasco|bosco gurin|centovalli|onsernone|verzasca|tenero|gordola|cugnasco|gerra|gambarogno|magadino|viganello|breganzona|pregassona|paradiso|canobbio|porza|comano|cureglia|cadempino|lamone|gravesano|bedano|torricella|taverne|capriasca|tesserete|savosa|vezia|agano|bioggio|cademario|novaggio|malcantone|alto malcantone|caslano|magliaso|pura|ponte tresa|tresa|monteceneri|mezzovico|rivera|sant'antonino|cadenazzo|arbedo|castione|lumino|stabio|vacallo|balerna|novazzano|coldrerio|morbio|breggia|riva san vitale|capolago|brusino|melano|maroggia|bissone|arogno|rovio|ceresio)\b"
if result.get('news',{}).get('scope') != 'ticino': result.pop('news',None)
def plain(value):
    return ' '.join(html.unescape(re.sub(r'<[^>]+>',' ',value or '')).split())
try:
    root = ET.fromstring(fetch('https://www.rsi.ch/info/ticino-grigioni-e-insubria/?f=rss'))
    items=[]
    for i in root.findall('./channel/item'):
        title=plain(i.findtext('title',''));description=plain(i.findtext('description',''))
        if not re.search(TICINO_TERMS,title+' '+description,re.I): continue
        link=i.findtext('link','')
        if not title or not link.startswith('https://www.rsi.ch/'): continue
        thumbnail=i.find('{http://search.yahoo.com/mrss/}thumbnail')
        items.append({'title':title,'description':description,'link':link,'date':i.findtext('pubDate',''),'category':'Ticino','image':thumbnail.get('url','') if thumbnail is not None else ''})
    items.sort(key=lambda i:parsedate_to_datetime(i['date']).timestamp(),reverse=True)
    assert items
    result['news'] = {'items':items[:2], 'updatedAt':now,'scope':'ticino'}
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
    filtered.sort(key=lambda e:(-(datetime.fromisoformat(e['changedAt']).timestamp() if e['changedAt'] else 0),e['priority']))
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
