import {createContext,useContext,useState} from 'react';
import type {ReactNode} from 'react';
const Context=createContext<any>(null);
export const songs=Array.from({length:500},(_,i)=>({id:String(i),title:i===0?'Fix You':i===1?'Coração':'Canção '+i,artist:i===0?'Coldplay':i===1?'João':'Artista '+(i%50),status:'available',genre:i%3?'Folk':'Rock',decade:i%2?1990:2000,language:i%2?'pt':'en',requestCount:i%7}));
export function Site({children}:{children:ReactNode;active:string}){
  const [lang,L]=useState('pt'),[scenario,S]=useState('normal'),[requests,R]=useState(0);
  const [error,E]=useState('');
  // Test-only boundary: the real Home submit handler runs, but never sends data.
  window.fetch=(async (_url:any,init:any)=>{if(init?.method==='POST')R(n=>n+1);return {ok:!error,status:error?409:200,json:async()=>error?{error}:{ok:true}};}) as any;
  const selectedSongs=scenario==='empty'?[]:scenario==='single'?songs.slice(0,1):scenario==='legacy'?songs.map(({id,title,artist,status})=>({id,title,artist,status})):scenario==='removed'?songs.slice(20):songs;
  const value={lang,t:(a:string,b:string)=>lang==='pt'?a:b,loaded:scenario!=='loading',online:!['offline','loading'].includes(scenario),live:{songs:selectedSongs,session:{id:'synthetic',isActive:true,name:'QA',mode:'concert'},settings:{requestsOpen:scenario!=='paused'},now:{}},href:(s:string)=>s,links:{}};
  return <Context.Provider value={value}><div style={{padding:8}}><button onClick={()=>L(lang==='pt'?'en':'pt')}>PT / EN</button><label>QA scenario<select value={scenario} onChange={e=>S(e.target.value)}>{['normal','empty','single','legacy','removed','loading','offline','paused'].map(s=><option key={s}>{s}</option>)}</select></label><label>QA response<select value={error} onChange={e=>E(e.target.value)}><option value="">success</option>{['paused','session_changed','unavailable_song','rate'].map(s=><option key={s}>{s}</option>)}</select></label><output>POSTs: {requests}</output></div><main>{children}</main></Context.Provider>;
}
export const useSite=()=>useContext(Context);
export const Socials=()=>null;
