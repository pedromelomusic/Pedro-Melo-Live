// Synthetic context for the real Home; transport never contacts the server.
import {createContext,useContext,useState} from 'react';
import type {ReactNode} from 'react';
import {songs as catalog} from './v06-discovery-site';
const songs=catalog.map((song,i)=>i===499?{...song,title:'Uma canção com um título muito comprido para uma noite inesquecível',artist:'Um artista com um nome muito comprido e a sua banda de convidados'}:song);
// HTTP preview lacks randomUUID; this test-only fallback never reaches the API.
if(typeof window!=='undefined' && !window.crypto.randomUUID) Object.defineProperty(window.crypto,'randomUUID',{value:()=>`00000000-0000-4000-8000-${String(Math.floor(Math.random()*1e12)).padStart(12,'0')}`});
const Context=createContext<any>(null);
export const attempts:any[]=[];
export function Site({children}:{children:ReactNode;active:string}){
  const [,R]=useState(0);
  const [lang,L]=useState('pt'),[scenario,S]=useState('open'),[response,E]=useState('success');
  window.fetch=(async (_url:any,init:any)=>{
    attempts.push(JSON.parse(init.body));R(n=>n+1);
    if(response==='timeout')return new Promise(()=>{});
    if(response==='network')throw Error('network');
    if(response==='delayed')await new Promise(r=>setTimeout(r,20));
    return {ok:response!=='server',status:response==='server'?503:200,json:async()=>response==='ambiguous'?{}:response==='server'?{error:'unavailable'}:{ok:true}};
  }) as any;
  const live={session:scenario==='none'?null:{id:'event',name:'Concerto de setembro',venue:'43 São Marcos',city:'Braga',date:'2026-09-19',isActive:true,mode:'concert',featuredOriginal:scenario==='no-featured'?null:{title:'Sina',artist:'Pedro Melo',url:'https://example.test/sina'}},songs,settings:{requestsOpen:scenario!=='paused'&&scenario!=='none'},now:{}};
  return <Context.Provider value={{live,loaded:true,online:true,lang,t:(pt:string,en:string)=>lang==='pt'?pt:en,href:(p:string)=>p+'?event=event',links:{instagram:'https://instagram.com/example',spotify:'https://open.spotify.com/example',youtube:'https://youtube.com/example'}}}><button onClick={()=>L(lang==='pt'?'en':'pt')}>PT / EN</button><label>QA event<select id="qa-event" value={scenario} onChange={e=>S(e.target.value)}>{['open','paused','none','no-featured'].map(v=><option key={v}>{v}</option>)}</select></label><label>QA response<select id="qa-response" value={response} onChange={e=>E(e.target.value)}>{['success','server','network','ambiguous','timeout','delayed'].map(v=><option key={v}>{v}</option>)}</select></label><output id="qa-attempts">{attempts.map(a=>a.id).join(',')}</output><main>{children}</main></Context.Provider>;
}
export const useSite=()=>useContext(Context);
