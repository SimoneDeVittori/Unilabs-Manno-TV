'use client';
import {useEffect,useState,createElement as rainElement} from 'react';
import {Cloud,Sun,CloudSun,CloudRain,CloudLightning,Snowflake,Droplets} from 'lucide-react';
function WeatherIcon({code,size=90}:{code:number,size?:number}){const c=Number(code)%100;const Icon=c===1?Sun:[2,3,26].includes(c)?CloudSun:[6,9,14,17,20,29,32,33].includes(c)?CloudRain:[12,13,23,24,25,36,37,38,39,40,41,42].includes(c)?CloudLightning:[7,8,10,11,15,16,18,19,21,22,30,31,34].includes(c)?Snowflake:Cloud;return <Icon size={size} strokeWidth={1.4}/>;}
const fmtTime=(value:any)=>new Date(value).toLocaleTimeString('it-CH',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Zurich'});
function isSwissMapTime(date=new Date()){const time=date.toLocaleTimeString("en-GB",{timeZone:"Europe/Zurich",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});return time>="08:00"&&time<"11:30";}
function renderTodayRain(hourly,now){
 const day=(now||new Date()).toLocaleDateString('sv-SE',{timeZone:'Europe/Zurich'});
 const slots=(hourly||[]).filter(h=>new Date(h.start).toLocaleDateString('sv-SE',{timeZone:'Europe/Zurich'})===day).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
 const h=rainElement;
 if(!slots.length)return h('div',{className:'today-rain'},h('div',{className:'today-rain-title'},'PIOGGIA OGGI'),h('div',{className:'today-rain-window'},'Dati orari non disponibili'));
 const groups=[];slots.filter(s=>s.amount>=0.1).forEach(s=>{const last=groups[groups.length-1];if(last&&last.end===s.start)last.end=s.end;else groups.push({...s});});
 const clock=v=>new Date(v).toLocaleTimeString('it-CH',{timeZone:'Europe/Zurich',hour:'2-digit',minute:'2-digit'});
 const windowText=groups.length?groups.map(g=>clock(g.start)+'–'+clock(g.end)).join(' · '):'Nessuna precipitazione prevista';
 const peak=Math.max(1,...slots.map(s=>Number(s.amount)||0));
 return h('div',{className:'today-rain'},h('div',{className:'today-rain-heading'},h('span',{className:'today-rain-title'},'PIOGGIA OGGI'),h('span',null,'mm/ora')),h('div',{className:'today-rain-window'},windowText),
 h('div',{className:'today-rain-chart',role:'img','aria-label':'Precipitazioni orarie di oggi. '+windowText},...slots.map((s,i)=>h('div',{className:'today-rain-slot',key:s.start,title:clock(s.start)+' · '+s.amount+' mm'},h('span',{className:'today-rain-bar',style:{height:s.amount>0?Math.max(3,Number(s.amount)/peak*35)+'px':'2px',background:s.amount>0?'#48afe0':'#edf0f2'}})))),
 h('div',{className:'today-rain-axis'},...['00','02','04','06','08','10','12','14','16','18','20','22','24'].map(t=>h('span',{key:t},t))));
}

function isPhoneDisplay(){return window.matchMedia("(pointer: coarse) and (max-width: 600px), (pointer: coarse) and (max-height: 600px)").matches;}
function renderPhoneNavigation(page,setPage){return rainElement('nav',{className:'phone-navigation','aria-label':'Navigazione mobile'},rainElement('button',{type:'button',onClick:()=>{setPage(page===1?0:1);window.scrollTo(0,0);}},page===1?'← Homepage':'Piano di lavoro →'));}
export default function Home(){
 const [phone,setPhone]=useState(()=>isPhoneDisplay());
 const [now,setNow]=useState<Date|null>(null);const [page,setPage]=useState(0);const [data,setData]=useState<any>({});const [failed,setFailed]=useState(false);const [controls,setControls]=useState(false);
 useEffect(()=>{const resize=()=>{document.documentElement.style.setProperty('--tv-scale',String(Math.min(window.innerWidth/1920,window.innerHeight/1080)));const mobile=isPhoneDisplay();setPhone(mobile);if(mobile)setPage(p=>p>1?0:p);};resize();window.addEventListener('resize',resize);setNow(new Date());const clock=setInterval(()=>{setNow(new Date());if(!isSwissMapTime())setPage(p=>p===3?0:p);},1000);let alive=true;async function refresh(){try{const r=await fetch('./data.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();if(alive){setData((old:any)=>({...d,weather:d.weather??old.weather,news:d.news??old.news}));setFailed(false);}}catch{if(alive)setFailed(true);}}refresh();const poll=setInterval(refresh,180000);const visibility=()=>{if(!document.hidden)refresh();};document.addEventListener('visibilitychange',visibility);return()=>{window.removeEventListener('resize',resize);alive=false;clearInterval(clock);clearInterval(poll);document.removeEventListener('visibilitychange',visibility);};},[]);
 useEffect(()=>{if(phone)return;const rotation=setTimeout(()=>setPage(p=>{if(isPhoneDisplay())return p;const next=(p+1)%4;return next===3&&!isSwissMapTime()?0:next;}),page===0?25000:page===2?7000:page===3?10000:20000);return()=>clearTimeout(rotation);},[page,phone]);
 useEffect(()=>{if(!controls)return;const t=setTimeout(()=>setControls(false),3500);return()=>clearTimeout(t);},[controls]);
 const week=data.week;
 const rainWindow=(day:string)=>{
  if(!week?.hourly)return 'Orari non disponibili';
  const slots=week.hourly.filter((h:any)=>new Date(h.start).toLocaleDateString('sv-SE',{timeZone:'Europe/Zurich'})===day&&h.amount>=0.1);
  if(!slots.length)return 'Nessuna prevista';
  const groups:any[]=[];slots.forEach((h:any)=>{const last=groups[groups.length-1];if(last&&last.end===h.start)last.end=h.end;else groups.push({...h});});
  return groups.map(g=>fmtTime(g.start)+'–'+fmtTime(g.end)).join(', ');
 };
 const w=data.weather;const n=data.news;const traffic=data.traffic;const staleTraffic=failed||data.trafficError||(traffic&&Date.now()-new Date(traffic.updatedAt).getTime()>1800000);const staleWeather=failed||data.weatherError||(w&&Date.now()-new Date(w.updatedAt).getTime()>1800000);const staleNews=failed||data.newsError||(n&&Date.now()-new Date(n.updatedAt).getTime()>1800000);
 return <main onPointerMove={()=>setControls(true)}>
  {renderPhoneNavigation(page,setPage)}
  <section className={'dashboard screen '+(page===0?'active':'')} aria-hidden={page!==0}>
   <header><div><div className="date">{now?now.toLocaleDateString('it-CH',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Zurich'}):'Benvenuti'}</div></div><time className="header-clock">{now?fmtTime(now):'—'}</time><img className="logo" src="./unilabs-logo.png" alt="Unilabs"/></header>
   <div className="content"><article className="weather card"><div className="weather-heading"><div className="section-label">METEO LOCALE</div><h1>Manno</h1></div><div className="weather-now"><span className="temperature">{w?Math.round(w.current.temperature)+'°':'—'}</span><span className="weather-icon">{w&&<WeatherIcon code={w.current.iconV2??w.current.icon} size={120}/>}</span></div><p className="weather-note">{w?'Temperatura attuale':staleWeather?'Meteo temporaneamente non disponibile':'Caricamento del meteo…'}</p>
    {w&&<><div className="today"><div><span>Minima</span><strong>{w.forecast[0].temperatureMin}°</strong></div><div><span>Massima</span><strong>{w.forecast[0].temperatureMax}°</strong></div><div><span>Pioggia</span><strong>{w.forecast[0].precipitation} <small>mm</small></strong></div></div></>}
    {renderTodayRain(week?.hourly,now)}
    <div className="week-heading">PROSSIMI 5 GIORNI</div><div className="week-columns"><span>Giorno</span><span>Min / max °C</span><span className="rain-column"><Droplets size={19}/> Precipitazioni (mm)<small>Fascia oraria</small></span></div><div className="week-list">{week?week.days.filter((d:any)=>d.dayDate>(now||new Date()).toLocaleDateString('sv-SE',{timeZone:'Europe/Zurich'})).slice(0,5).map((d:any)=><div className="week-row" key={d.dayDate}><div className="week-day"><span>{new Date(d.dayDate+'T12:00:00').toLocaleDateString('it-CH',{weekday:'short'})}</span><span className="week-day-number">{Number(d.dayDate.slice(-2))}</span></div><WeatherIcon code={d.iconDay} size={30}/><div className="week-temperatures">{d.temperatureMin}° <strong>{d.temperatureMax}°</strong></div><div className={"week-rain "+(d.precipitation===0?"dry":"")}><strong>{Number.isFinite(d.precipitation)?d.precipitation.toLocaleString("it-CH",{maximumFractionDigits:1})+" mm":"—"}</strong>{d.precipitation>0&&<span className="rain-hours">{rainWindow(d.dayDate)==="Nessuna prevista"?"Orario non disponibile":rainWindow(d.dayDate)}</span>}</div></div>):<p className="empty">{data.weekError?'Previsioni non disponibili':'Caricamento…'}</p>}</div>
    
    <div className="source"><a href="https://www.meteosvizzera.admin.ch/previsioni-locali/manno/6928.html" target="_blank" rel="noreferrer">Fonte: MeteoSvizzera</a>{staleWeather&&<span className="warning">{w?'Ultimi dati ricevuti · aggiornamento in attesa':'Connessione alla fonte in attesa'}</span>}</div>
   </article><div className="right-column"><article className="news card"><div className="news-header"><div><div className="section-label">ULTIME NOTIZIE DAL TICINO</div></div><img className="tio-logo" src="./tio-logo.png" alt="Ticinonline"/></div><div className="news-list">{n?n.items.slice(0,3).map((item:any,i:number)=><a className="news-item" key={item.link} href={item.link} target="_blank" rel="noreferrer">{item.image&&<img className="news-photo" src={item.image} alt="" onError={e=>{e.currentTarget.style.visibility='hidden';}}/>}<div className="news-copy"><div className="news-meta">{item.category||'Attualità'}{item.date&&!isNaN(Date.parse(item.date))?' · '+fmtTime(item.date):''}</div><h3>{item.title}</h3>{item.description&&<p className="news-description">{item.description}</p>}</div></a>):<div className="empty">{staleNews?'Notizie temporaneamente non disponibili':'Caricamento delle ultime notizie…'}</div>}</div><div className="source"><a href="https://www.tio.ch/ticino" target="_blank" rel="noreferrer">Fonte: tio.ch</a><span>{staleNews?'Aggiornamento in attesa':n?'Aggiornato alle '+fmtTime(n.updatedAt):''}</span></div></article><article className="traffic card"><div className="traffic-header"><div><div className="section-label">VIABILITÀ IN TICINO</div></div></div><div className="traffic-list">{traffic?.items?.length?[...traffic.items].sort((a:any,b:any)=>(Date.parse(b.changedAt)||0)-(Date.parse(a.changedAt)||0)).slice(0,2).map((item:any)=><div className="traffic-item" key={item.id}><p>{item.changedAt&&!isNaN(Date.parse(item.changedAt))&&<time dateTime={item.changedAt} title="Ultimo aggiornamento della segnalazione" style={{fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmtTime(item.changedAt)} · </time>}{item.location&&item.text.startsWith(item.location)?<><strong className="traffic-location">{item.location}</strong>{item.text.slice(item.location.length)}</>:item.text}</p></div>):<p className="traffic-empty">{staleTraffic?'Informazioni sul traffico temporaneamente non disponibili':traffic?'Nessuna segnalazione attiva in Ticino':'Caricamento delle informazioni sul traffico…'}</p>}</div><div className="source"><a href="https://www.tcs.ch/it/tools/infostrada-situazione-attuale-del-traffico/situazione-attuale-traffico.php" target="_blank" rel="noreferrer">Fonte: TCS · Viasuisse</a><span>{staleTraffic?'Aggiornamento in attesa':traffic?'Aggiornato alle '+fmtTime(traffic.updatedAt):''}</span></div></article></div></div>
   <footer><small className="creator-copyright">© SimDev3D</small><span>Unilabs · Centro Galleria 3, via cantonale 4, 6928 Manno</span><div className="page-dots"><i className="selected"/><i/><i/><i/></div></footer><div className="progress" key={page===0?'dashboard':'hidden'}/>
  </section>
  <section className={'plan screen '+(page===1?'active':'')} aria-hidden={page!==1}><img src="./piano.png" alt="Piano dei turni"/><div className="progress" key={page===1?"plan":"plan-hidden"}/></section>
  <section className={'plan van-screen screen '+(page===2?'active':'')} aria-hidden={page!==2}><img src="./furgone-autunno.png" alt="Servizio Esterno Unilabs in autunno"/><div className="progress" style={{animationDuration:"7s"}} key={page===2?"autumn":"autumn-hidden"}/></section>
  <section className={'dashboard swiss-map-screen screen '+(page===3?'active':'')} aria-hidden={page!==3}>
   <header><div><div className="date">{now?now.toLocaleDateString('it-CH',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Zurich'}):'Benvenuti'}</div></div><time className="header-clock">{now?fmtTime(now):'—'}</time><img className="logo" src="./unilabs-logo.png" alt="Unilabs"/></header>
   <article className="swiss-map-card card"><div className="map-heading"><div><div className="section-label">METEO IN SVIZZERA</div><h2>Le previsioni di oggi</h2></div><div className="map-legend">Temperature minime / massime · °C</div></div>
   <svg className="national-map" viewBox="0 0 1400 760" role="img" aria-label="Previsioni meteo nelle principali città della Svizzera">
    <svg x="160" y="20" width="1080" height="720" viewBox="3 3 2042 1359" overflow="hidden"><image href="./switzerland-relief-new.png" width="2048" height="1365"/></svg>
    {data.swissWeather?.cities?.map((city:any)=>{const day=(now||new Date()).toLocaleDateString('sv-SE',{timeZone:'Europe/Zurich'});const forecast=city.forecasts.find((f:any)=>f.date_iso===day);if(!forecast)return null;const positions:Record<string,number[]>={'100300':[360,770],'120100':[100,1030],'195000':[710,970],'300400':[730,530],'400100':[780,210],'600300':[1095,590],'690000':[1335,1185],'700000':[1565,650],'800100':[1185,360],'900000':[1440,310]};const position=positions[String(city.location_id)];if(!position)return null;const x=160+(position[0]-3)*1080/2042;const y=20+(position[1]-3)*720/1359;return <g key={city.location_id} transform={'translate('+x+','+y+')'} className="map-city"><circle r="4" fill="#de4d18"/><rect x="-74" y="-92" width="148" height="84" rx="25" fill="white" stroke="#e6ded8"/><text textAnchor="middle" y="-67" className="map-city-name">{city.location_name}</text><g className="map-weather-icon" transform="translate(-60,-54)"><WeatherIcon code={forecast.weather_symbol_id} size={38}/></g><text y="-29" className="map-city-temp" textAnchor="middle"><tspan x="9" fill="#7a858e" fontWeight="400">{forecast.temp_low}°</tspan><tspan x="49" fill="#27313b">{forecast.temp_high}°</tspan></text></g>;})}
   </svg>
   {!data.swissWeather&&<p className="map-unavailable">Previsioni temporaneamente non disponibili</p>}
   <div className="source"><a href="https://www.meteosvizzera.admin.ch/#tab=forecast-map" target="_blank" rel="noreferrer">Fonte: MeteoSvizzera</a><span>{data.swissWeatherError||failed?'Aggiornamento in attesa':data.swissWeather?'Aggiornato alle '+fmtTime(data.swissWeather.updatedAt):''}</span></div></article>
   <footer><small className="creator-copyright">© SimDev3D</small><span>Unilabs · Centro Galleria 3, via cantonale 4, 6928 Manno</span><div className="page-dots"><i/><i/><i/><i className="selected"/></div></footer><div className="progress" style={{animationDuration:'10s'}} key={page===3?'swiss-map':'swiss-map-hidden'}/>
  </section>
  <button className={'fullscreen '+(controls?'show':'')} onFocus={()=>setControls(true)} onClick={()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.();}}>Schermo intero</button>
 </main>;
}

import {createRoot} from "react-dom/client";
createRoot(document.getElementById("root")!).render(<Home/>);








