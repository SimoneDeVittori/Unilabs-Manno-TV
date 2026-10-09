"""Seven-day Manno forecasts from MeteoSwiss Open Data (CC BY)."""
import csv, io, json, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
BASE='https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-local-forecasting'
PARAMS=['tre200pn','tre200px','jp2000d0','rka150p0','rre150h0']
TZ=ZoneInfo('Europe/Zurich')
def download(url):
    with urllib.request.urlopen(url,timeout=60) as r: return r.read()
def parse_rows(raw,param):
    lines=raw.decode('latin1').splitlines()
    selected=[lines[0]]+[s for s in lines[1:] if s.startswith('692800;2;')]
    return {r['Date']:float(r[param]) for r in csv.DictReader(selected,delimiter=';') if r[param] not in ('','-999')}
def build_week(values, model, now):
    today=now.astimezone(TZ).date(); days=[]
    hourly=[]
    for stamp,amount in sorted(values['rre150h0'].items()):
        end=datetime.strptime(stamp,'%Y%m%d%H%M').replace(tzinfo=timezone.utc)
        # Official timestamps mark the END of the preceding hourly interval.
        hourly.append({'start':(end-timedelta(hours=1)).isoformat(),'end':end.isoformat(),'amount':amount})
    for stamp,maximum in sorted(values['tre200px'].items()):
        day=datetime.strptime(stamp,'%Y%m%d%H%M').date()
        if not today<=day<today+timedelta(days=7): continue
        if any(stamp not in values[p] for p in PARAMS[:-1]): continue
        days.append({'dayDate':day.isoformat(),'temperatureMin':round(values['tre200pn'][stamp]),'temperatureMax':round(maximum),'iconDay':int(values['jp2000d0'][stamp]),'precipitation':values['rka150p0'][stamp]})
    if len(days)!=7 or not hourly: raise ValueError('Incomplete seven-day forecast')
    return {'days':days,'hourly':hourly,'model':model,'updatedAt':now.isoformat()}
def get_week(previous=None):
    now=datetime.now(timezone.utc)
    catalog=json.loads(download(BASE+'/items?limit=100'))
    assets={k:v for item in catalog['features'] for k,v in item.get('assets',{}).items()}
    runs={k.split('.')[2] for k in assets if k.endswith('.tre200px.csv')}
    run=next((r for r in sorted(runs,reverse=True) if all(any(k.split('.')[2]==r and k.endswith('.'+p+'.csv') for k in assets) for p in PARAMS)),None)
    if not run: raise ValueError('No complete forecast run')
    if previous and previous.get('model')==run and previous['days'][0]['dayDate']==now.astimezone(TZ).date().isoformat():
        return dict(previous,updatedAt=now.isoformat())
    def get(p):
        url=next(v['href'] for k,v in assets.items() if k.split('.')[2]==run and k.endswith('.'+p+'.csv'))
        return p,parse_rows(download(url),p)
    with ThreadPoolExecutor(max_workers=5) as pool: values=dict(pool.map(get,PARAMS))
    return build_week(values,run,now)
