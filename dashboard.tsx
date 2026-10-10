import {PLAN_FILE,PLAN_METADATA,renderWorkPlanPdf} from './plan-pdf.js?v=20261011-plan-pdf';
'use client';
import {useEffect,useState,createElement as rainElement} from 'react';
import {Cloud,Sun,CloudSun,CloudRain,CloudLightning,Snowflake,Droplets} from 'lucide-react';
function isSwissNight(date=new Date()){const hour=Number(date.toLocaleTimeString('en-GB',{timeZone:'Europe/Zurich',hour:'2-digit',hourCycle:'h23'}));return hour>=18||hour<7;}
function renderNightWeather(code,size){
 const h=rainElement,cloudy=code!==1;
 return h('svg',{xmlns:'http://www.w3.org/2000/svg',width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.4,strokeLinecap:'round',strokeLinejoin:'round',className:cloudy?'lucide lucide-cloud lucide-cloud-moon':'lucide lucide-moon','aria-hidden':true},
 cloudy?h('path',{d:'M20.9 13.2A9 9 0 1 1 10.8 3.1a7 7 0 0 0 10.1 10.1Z',transform:'translate(7 -1) scale(.65)'}):h('path',{d:'M20.9 13.2A9 9 0 1 1 10.8 3.1a7 7 0 0 0 10.1 10.1Z'}),
 cloudy?h('path',{d:'M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z'}):null,...[[3,4,1.2,0],[20,3,1.05,-.9],[22,18,1.2,-1.8]].map(([x,y,size,delay],i)=>h('path',{key:'star-'+i,className:'weather-star',d:'M0 -1 .23 -.23 1 0 .23 .23 0 1 -.23 .23 -1 0 -.23 -.23Z',transform:'translate('+x+' '+y+') scale('+size+')',fill:'currentColor',stroke:'none',style:{animationDelay:delay+'s'}})));
}
function renderTravelVan(active){
 const h=rainElement;
 const wheel=(position)=>h('span',{className:'travel-van-wheel '+position},h('svg',{viewBox:'0 0 24 24',fill:'none'},h('circle',{cx:12,cy:12,r:10,fill:'#46474a',stroke:'#bfc1c3',strokeWidth:2}),...[0,60,120,180,240,300].map(angle=>h('path',{key:angle,d:'M12 4V9',stroke:'#d8dadd',strokeWidth:2,strokeLinecap:'round',transform:'rotate('+angle+' 12 12)'})),h('circle',{cx:12,cy:12,r:3,fill:'#25262a'})));
 return h('div',{className:'travel-van-runner',key:active?'van-driving':'van-parked','aria-hidden':true},h('div',{className:'travel-van-body'},h('img',{src:'./furgone-animato.png',alt:'',width:150,height:100}),wheel('rear'),wheel('front')));
}
function renderBrandDate(now){if(!now)return 'Benvenuti';const h=rainElement;return [h('span',{className:'date-weekday',key:'weekday'},now.toLocaleDateString('it-CH',{weekday:'long',timeZone:'Europe/Zurich'})),', ',h('span',{className:'date-rest',key:'rest'},now.toLocaleDateString('it-CH',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Zurich'}))];}
function WeatherIcon({code,size=90,current=false}:{code:number,size?:number,current?:boolean}){const c=Number(code)%100;if(current&&isSwissNight()&&[1,2,3,26].includes(c))return renderNightWeather(c,size);const Icon=c===1?Sun:[2,3,26].includes(c)?CloudSun:[6,9,14,17,20,29,32,33].includes(c)?CloudRain:[12,13,23,24,25,36,37,38,39,40,41,42].includes(c)?CloudLightning:[7,8,10,11,15,16,18,19,21,22,30,31,34].includes(c)?Snowflake:Cloud;return <Icon size={size} strokeWidth={1.4}/>;}
const fmtTime=(value:any)=>new Date(value).toLocaleTimeString('it-CH',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Zurich'});
function isSwissMapTime(date=new Date()){const time=date.toLocaleTimeString("en-GB",{timeZone:"Europe/Zurich",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});return time>="08:00"&&time<"11:30";}
function renderTodayRain(hourly,now){
 const day=(now||new Date()).toLocaleDateString('sv-SE',{timeZone:'Europe/Zurich'});
 const slots=(hourly||[]).filter(h=>new Date(h.start).toLocaleDateString('sv-SE',{timeZone:'Europe/Zurich'})===day).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
 const h=rainElement;
 if(!slots.length)return h('div',{className:'today-rain'},h('div',{className:'today-rain-title'},'PIOGGIA PREVISTA PER OGGI'),h('div',{className:'today-rain-window'},'Dati orari non disponibili'));
 const groups=[];slots.filter(s=>s.amount>=0.1).forEach(s=>{const last=groups[groups.length-1];if(last&&last.end===s.start)last.end=s.end;else groups.push({...s});});
 const clock=v=>new Date(v).toLocaleTimeString('it-CH',{timeZone:'Europe/Zurich',hour:'2-digit',minute:'2-digit'});
 const windowText=groups.length?groups.map(g=>clock(g.start)+'–'+clock(g.end)).join(' · '):'Nessuna precipitazione prevista';
 const peak=Math.max(1,...slots.map(s=>Number(s.amount)||0));
 return h('div',{className:'today-rain'},h('div',{className:'today-rain-heading'},h('span',{className:'today-rain-title'},'PIOGGIA PREVISTA PER OGGI'),h('span',null,'mm/ora')),h('div',{className:'today-rain-window'},windowText),
 h('div',{className:'today-rain-chart',role:'img','aria-label':'Precipitazioni orarie di oggi. '+windowText},...slots.map((s,i)=>h('div',{className:'today-rain-slot',key:s.start,title:clock(s.start)+' · '+s.amount+' mm'},h('span',{className:'today-rain-bar',style:{height:s.amount>0?Math.max(3,Number(s.amount)/peak*35)+'px':'2px',background:s.amount>0?'#48afe0':'#edf0f2'}})))),
 h('div',{className:'today-rain-axis'},...['00','02','04','06','08','10','12','14','16','18','20','22','24'].map(t=>h('span',{key:t},t))));
}

function renderWorkPlan(now){
 const day=(now||new Date()).toLocaleDateString('sv-SE',{timeZone:'Europe/Zurich'});
 const period=String(PLAN_METADATA.year)+'-'+String(PLAN_METADATA.month).padStart(2,'0');
 const current=day.slice(0,7)===period?Number(day.slice(-2)):0;
 const h=rainElement;
 return h('svg',{className:'work-plan',viewBox:'0 0 1672 941',role:'img','aria-label':'Piano dei turni '+PLAN_METADATA.title+'. Aggiornato al '+PLAN_METADATA.updated+(current?'. Giorno '+current+' evidenziato':''),preserveAspectRatio:'xMidYMid meet'},
 h('defs',null,h('linearGradient',{id:'plan-title-gradient',x1:'0%',y1:'0%',x2:'100%',y2:'0%'},h('stop',{offset:'0%',stopColor:'#f09600'}),h('stop',{offset:'100%',stopColor:'#de3c20'}))),
 h('text',{transform:'translate(145 751) rotate(-90)',fontSize:88,fontWeight:800,fontFamily:'Arial, sans-serif',textLength:680,lengthAdjust:'spacingAndGlyphs',fill:'url(#plan-title-gradient)'},PLAN_METADATA.title),
 h('text',{transform:'translate(195 460) rotate(-90)',fontSize:34,fontWeight:700,fontFamily:'Arial, sans-serif',fill:'#454545'},'AGGIORNATO AL '+PLAN_METADATA.updated),
 h('foreignObject',{x:263,y:6,width:1400,height:922},
 h('div',{xmlns:'http://www.w3.org/1999/xhtml',className:'plan-pdf-surface','data-status':'loading'},
 h('canvas',{ref:renderWorkPlanPdf,'aria-label':'Tabella del piano '+PLAN_METADATA.title}),
 h('span',{className:'plan-pdf-loading'},'Caricamento del piano…'),
 h('a',{className:'plan-pdf-error',href:PLAN_FILE.url,target:'_blank',rel:'noreferrer'},'Apri il piano PDF'))),
 current?h('rect',{className:'plan-today-highlight',x:263+(156.02-17)/1056*1400+(current-1)*(29.52/1056*1400),y:6+922/695,width:29.52/1056*1400,height:(746.856-54)/695*922,fill:'#f09600',fillOpacity:0.22,stroke:'#e86b00',strokeOpacity:0.7,strokeWidth:1.5,pointerEvents:'none'}):null);
}

function isPhoneDisplay(){return window.matchMedia("(pointer: coarse) and (max-width: 600px), (pointer: coarse) and (max-height: 600px)").matches;}
function renderPhoneHomeIcon(){
 const h=rainElement;
 return h('svg',{className:'phone-home-icon',width:36,height:36,viewBox:'0 0 64 64','aria-hidden':true,focusable:'false',style:{display:'block',margin:'0 auto'}},
 h('path',{d:'M8 29 32 9 56 29V54a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3Z',fill:'none',stroke:'#fff',strokeWidth:3,strokeLinecap:'round',strokeLinejoin:'round'}),
 h('svg',{x:20,y:25,width:24,height:24,viewBox:'0 0 120 121',overflow:'hidden'},h('path',{className:'home-unilabs-symbol',d:"M42,1 52,1 52,2 55,4 55,32 56,32 57,35 61,36 61,35 63,35 64,32 65,32 65,5 66,5 66,3 67,3 68,1 78,1 78,16 79,16 79,15 80,15 80,14 81,14 81,13 82,13 82,12 83,12 88,6 91,6 91,7 95,10 95,12 96,12 96,18 95,18 95,19 94,19 94,20 93,20 93,21 92,21 92,22 91,22 91,23 90,23 90,24 89,24 89,25 88,25 88,26 87,26 87,27 86,27 86,28 85,28 85,29 84,29 84,30 83,30 83,31 77,36 77,38 76,38 77,43 78,43 78,44 83,44 83,43 85,43 85,42 86,42 86,41 87,41 87,40 88,40 88,39 89,39 89,38 90,38 90,37 91,37 91,36 92,36 92,35 93,35 93,34 94,34 94,33 95,33 95,32 96,32 96,31 97,31 102,25 109,25 109,26 111,26 111,27 115,30 115,32 114,32 114,33 113,33 113,34 112,34 112,35 111,35 111,36 105,41 105,43 120,43 120,51 119,51 119,53 118,53 117,55 115,55 115,56 87,56 87,57 85,58 85,63 86,63 87,65 114,65 114,66 117,66 117,67 119,68 119,70 120,70 120,78 104,78 104,79 105,79 105,80 106,80 106,81 107,81 107,82 108,82 108,83 109,83 109,84 115,89 115,91 114,91 110,96 105,97 105,96 102,96 102,95 101,95 101,94 100,94 100,93 99,93 99,92 98,92 98,91 97,91 97,90 96,90 96,89 95,89 95,88 94,88 94,87 93,87 93,86 92,86 92,85 91,85 91,84 90,84 85,78 83,78 83,77 78,77 77,80 76,80 77,85 78,85 78,86 79,86 79,87 80,87 80,88 81,88 81,89 82,89 82,90 83,90 83,91 84,91 84,92 85,92 85,93 86,93 86,94 87,94 87,95 88,95 88,96 89,96 89,97 90,97 90,98 96,103 96,109 95,109 95,111 94,111 91,115 88,115 88,114 87,114 87,113 86,113 86,112 85,112 85,111 84,111 84,110 78,105 78,120 77,120 68,120 68,119 66,118 66,116 65,116 65,89 64,89 63,86 59,85 59,86 57,86 56,89 55,89 55,117 54,117 52,120 42,120 42,105 41,105 41,106 40,106 40,107 39,107 39,108 38,108 38,109 37,109 32,115 29,115 29,114 25,111 25,109 24,109 24,104 25,104 25,102 26,102 26,101 27,101 27,100 28,100 28,99 29,99 29,98 30,98 30,97 31,97 31,96 32,96 32,95 33,95 33,94 34,94 34,93 35,93 35,92 36,92 36,91 37,91 37,90 43,85 43,83 44,83 44,79 43,79 42,77 37,77 37,78 35,78 35,79 34,79 34,80 33,80 33,81 32,81 32,82 31,82 31,83 30,83 30,84 29,84 29,85 28,85 28,86 27,86 27,87 26,87 26,88 25,88 25,89 24,89 24,90 23,90 18,96 15,96 15,97 14,97 14,96 9,95 9,94 5,91 5,89 6,89 6,88 7,88 7,87 8,87 8,86 9,86 9,85 10,85 10,84 11,84 16,78 0,78 0,70 1,70 1,68 2,68 3,66 6,66 6,65 33,65 33,64 35,63 35,58 34,58 33,56 5,56 5,55 3,55 3,54 1,53 1,51 0,51 0,43 16,43 16,42 15,42 15,41 14,41 14,40 13,40 13,39 12,39 12,38 11,38 11,37 5,32 5,30 6,30 9,26 11,26 11,25 18,25 18,26 19,26 19,27 20,27 20,28 21,28 21,29 22,29 22,30 23,30 23,31 24,31 24,32 25,32 25,33 26,33 26,34 27,34 27,35 28,35 28,36 29,36 29,37 30,37 35,43 37,43 37,44 42,44 42,43 44,42 44,38 43,38 43,36 42,36 42,35 41,35 41,34 40,34 40,33 39,33 39,32 38,32 38,31 37,31 37,30 36,30 36,29 35,29 35,28 34,28 34,27 33,27 33,26 32,26 32,25 31,25 31,24 25,19 25,17 24,17 24,12 26,11 26,9 27,9 29,6 32,6 32,7 33,7 33,8 34,8 34,9 35,9 35,10 36,10 36,11 42,16Z M55,46 54,46 54,47 53,47 53,48 52,48 52,49 46,54 46,67 47,67 47,68 48,68 48,69 49,69 54,75 67,75 67,73 68,73 68,72 69,72 69,71 75,66 75,65 74,65 74,56 75,56 75,55 74,55 74,54 73,54 73,53 72,53 72,52 71,52 66,46Z",fill:'#fff',fillRule:'evenodd',opacity:1})));
}
function renderPhoneNavigation(page,setPage){return rainElement('nav',{className:'phone-navigation','aria-label':'Navigazione mobile'},rainElement('button',{type:'button','aria-label':page===1?'Homepage':'Piano di lavoro',onClick:()=>{setPage(page===1?0:1);window.scrollTo(0,0);}},page===1?renderPhoneHomeIcon():'Piano di lavoro'));}

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
   <header><div><div className="date">{renderBrandDate(now)}</div></div><time className="header-clock">{now?fmtTime(now):'—'}</time><img className="logo" src="./unilabs-logo.png" alt="Unilabs"/></header>
   <div className="content"><article className="weather card"><div className="weather-heading"><div className="section-label">METEO LOCALE</div><h1>Manno</h1></div><div className="weather-now"><span className="temperature">{w?Math.round(w.current.temperature)+'°':'—'}</span><span className="weather-icon">{w&&<WeatherIcon code={w.current.iconV2??w.current.icon} size={120} current/>}</span></div><p className="weather-note">{w?'Temperatura attuale':staleWeather?'Meteo temporaneamente non disponibile':'Caricamento del meteo…'}</p>
    {w&&<><div className="today"><div><span>Minima</span><strong>{w.forecast[0].temperatureMin}°</strong></div><div><span>Massima</span><strong>{w.forecast[0].temperatureMax}°</strong></div><div><span>Pioggia</span><strong>{w.forecast[0].precipitation} <small>mm</small></strong></div></div></>}
    {renderTodayRain(week?.hourly,now)}
    <div className="week-heading">PROSSIMI 5 GIORNI</div><div className="week-columns"><span>Giorno</span><span>Min / max °C</span><span className="rain-column"><Droplets size={19}/> Precipitazioni (mm)<small>Fascia oraria</small></span></div><div className="week-list">{week?week.days.filter((d:any)=>d.dayDate>(now||new Date()).toLocaleDateString('sv-SE',{timeZone:'Europe/Zurich'})).slice(0,5).map((d:any)=><div className="week-row" key={d.dayDate}><div className="week-day"><span>{new Date(d.dayDate+'T12:00:00').toLocaleDateString('it-CH',{weekday:'short'})}</span><span className="week-day-number">{Number(d.dayDate.slice(-2))}</span></div><WeatherIcon code={d.iconDay} size={30}/><div className="week-temperatures">{d.temperatureMin}° <strong>{d.temperatureMax}°</strong></div><div className={"week-rain "+(d.precipitation===0?"dry":"")}><strong>{Number.isFinite(d.precipitation)?d.precipitation.toLocaleString("it-CH",{maximumFractionDigits:1})+" mm":"—"}</strong>{d.precipitation>0&&<span className="rain-hours">{rainWindow(d.dayDate)==="Nessuna prevista"?"Orario non disponibile":rainWindow(d.dayDate)}</span>}</div></div>):<p className="empty">{data.weekError?'Previsioni non disponibili':'Caricamento…'}</p>}</div>
    
    <div className="source"><a href="https://www.meteosvizzera.admin.ch/previsioni-locali/manno/6928.html" target="_blank" rel="noreferrer">Fonte: MeteoSvizzera</a>{staleWeather&&<span className="warning">{w?'Ultimi dati ricevuti · aggiornamento in attesa':'Connessione alla fonte in attesa'}</span>}</div>
   </article><div className="right-column"><article className="news card"><div className="news-header"><div><div className="section-label">ULTIME NOTIZIE DAL TICINO</div></div><img className="tio-logo" src="./tio-logo.png" alt="Ticinonline"/></div><div className="news-list">{n?n.items.slice(0,3).map((item:any,i:number)=><a className="news-item" key={item.link} href={item.link} target="_blank" rel="noreferrer">{item.image&&<img className="news-photo" src={item.image} alt="" onError={e=>{e.currentTarget.style.visibility='hidden';}}/>}<div className="news-copy"><div className="news-meta">{item.category||'Attualità'}{item.date&&!isNaN(Date.parse(item.date))?' · '+fmtTime(item.date):''}</div><h3>{item.title}</h3>{item.description&&<p className="news-description">{item.description}</p>}</div></a>):<div className="empty">{staleNews?'Notizie temporaneamente non disponibili':'Caricamento delle ultime notizie…'}</div>}</div><div className="source"><a href="https://www.tio.ch/ticino" target="_blank" rel="noreferrer">Fonte: tio.ch</a><span>{staleNews?'Aggiornamento in attesa':n?'Aggiornato alle '+fmtTime(n.updatedAt):''}</span></div></article><article className="traffic card"><div className="traffic-header"><div><div className="section-label">VIABILITÀ IN TICINO</div></div></div><div className="traffic-list">{traffic?.items?.length?[...traffic.items].sort((a:any,b:any)=>(Date.parse(b.changedAt)||0)-(Date.parse(a.changedAt)||0)).slice(0,2).map((item:any)=><div className="traffic-item" key={item.id}><p>{item.changedAt&&!isNaN(Date.parse(item.changedAt))&&<time dateTime={item.changedAt} title="Ultimo aggiornamento della segnalazione" style={{fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmtTime(item.changedAt)} · </time>}{item.location&&item.text.startsWith(item.location)?<><strong className="traffic-location">{item.location}</strong>{item.text.slice(item.location.length)}</>:item.text}</p></div>):<p className="traffic-empty">{staleTraffic?'Informazioni sul traffico temporaneamente non disponibili':traffic?'Nessuna segnalazione attiva in Ticino':'Caricamento delle informazioni sul traffico…'}</p>}</div><div className="source"><a href="https://viasuisse.ch/it/home-2/" target="_blank" rel="noreferrer">Fonte: Viasuisse</a><span>{staleTraffic?'Aggiornamento in attesa':traffic?'Aggiornato alle '+fmtTime(traffic.updatedAt):''}</span></div></article></div></div>
   <footer><small className="creator-copyright">© SimDev3D</small><span>Unilabs Ticino · Centro Galleria 3, Via Cantonale 4, 6928 Manno</span><div className="page-dots"><i className="selected"/><i/><i/><i/></div></footer><div className="progress" key={page===0?'dashboard':'hidden'}/>
  </section>
  <section className={'plan screen '+(page===1?'active':'')} aria-hidden={page!==1}>{renderWorkPlan(now)}<div className="progress" key={page===1?"plan":"plan-hidden"}/></section>
  <section className={'plan van-screen screen '+(page===2?'active':'')} aria-hidden={page!==2}><img src="./furgone-autunno.png" alt="Servizio Esterno Unilabs in autunno"/><div className="progress" style={{animationDuration:"7s"}} key={page===2?"autumn":"autumn-hidden"}/>{renderTravelVan(page===2)}</section>
  <section className={'dashboard swiss-map-screen screen '+(page===3?'active':'')} aria-hidden={page!==3}>
   <header><div><div className="date">{renderBrandDate(now)}</div></div><time className="header-clock">{now?fmtTime(now):'—'}</time><img className="logo" src="./unilabs-logo.png" alt="Unilabs"/></header>
   <article className="swiss-map-card card"><div className="map-heading"><div><div className="section-label">METEO IN SVIZZERA</div><h2>Le previsioni di oggi</h2></div><div className="map-legend">Temperature minime / massime · °C</div></div>
   <svg className="national-map" viewBox="0 0 1400 760" role="img" aria-label="Previsioni meteo nelle principali città della Svizzera">
    <svg x="160" y="20" width="1080" height="720" viewBox="3 3 2042 1359" overflow="hidden"><image href="./switzerland-relief-new.png" width="2048" height="1365"/></svg>
    {data.swissWeather?.cities?.map((city:any)=>{const day=(now||new Date()).toLocaleDateString('sv-SE',{timeZone:'Europe/Zurich'});const forecast=city.forecasts.find((f:any)=>f.date_iso===day);if(!forecast)return null;const positions:Record<string,number[]>={'100300':[360,770],'120100':[100,1030],'195000':[710,970],'300400':[730,530],'400100':[780,210],'600300':[1095,590],'690000':[1335,1185],'700000':[1565,650],'800100':[1185,360],'900000':[1440,310]};const position=positions[String(city.location_id)];if(!position)return null;const x=160+(position[0]-3)*1080/2042;const y=20+(position[1]-3)*720/1359;return <g key={city.location_id} transform={'translate('+x+','+y+')'} className="map-city"><circle r="4" fill="#de4d18"/><rect x="-74" y="-92" width="148" height="84" rx="25" fill="white" stroke="#e6ded8"/><text textAnchor="middle" y="-67" className="map-city-name">{city.location_name}</text><g className="map-weather-icon" transform="translate(-60,-54)"><WeatherIcon code={forecast.weather_symbol_id} size={38}/></g><text y="-29" className="map-city-temp" textAnchor="middle"><tspan x="9" fill="#7a858e" fontWeight="400">{forecast.temp_low}°</tspan><tspan x="49" fill="#27313b">{forecast.temp_high}°</tspan></text></g>;})}
   </svg>
   {!data.swissWeather&&<p className="map-unavailable">Previsioni temporaneamente non disponibili</p>}
   <div className="source"><a href="https://www.meteosvizzera.admin.ch/#tab=forecast-map" target="_blank" rel="noreferrer">Fonte: MeteoSvizzera</a><span>{data.swissWeatherError||failed?'Aggiornamento in attesa':data.swissWeather?'Aggiornato alle '+fmtTime(data.swissWeather.updatedAt):''}</span></div></article>
   <footer><small className="creator-copyright">© SimDev3D</small><span>Unilabs Ticino · Centro Galleria 3, Via Cantonale 4, 6928 Manno</span><div className="page-dots"><i/><i/><i/><i className="selected"/></div></footer><div className="progress" style={{animationDuration:'10s'}} key={page===3?'swiss-map':'swiss-map-hidden'}/>
  </section>
  <button className={'fullscreen '+(controls?'show':'')} onFocus={()=>setControls(true)} onClick={()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.();}}>Schermo intero</button>
 </main>;
}

import {createRoot} from "react-dom/client";
createRoot(document.getElementById("root")!).render(<Home/>);








