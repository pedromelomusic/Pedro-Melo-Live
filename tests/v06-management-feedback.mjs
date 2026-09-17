// Focused E corrections only: real React, simulated network/DOM, no remote data.
import assert from 'node:assert/strict';import fs from 'node:fs';import {build} from 'esbuild';
import {Window} from '../work/discovery-dom/node_modules/happy-dom/lib/index.js';
const window=new Window({url:'https://example.test/admin/gestao'});
for(const key of ['window','document','navigator','HTMLElement','Event','MouseEvent','localStorage'])Object.defineProperty(globalThis,key,{value:key==='window'?window:window[key],configurable:true});
const state={catalog:[{id:'s',title:'Canção',artist:'Pedro',revision:0}],session:{id:'e',name:'Concerto',revision:0,archived:0},sessions:[{id:'e',name:'Concerto'}],eventSongs:[{id:'s',status:'available'}]};
let confirmations=[],accept=false,postRelease,getRelease,holdGet=false,artStatus=404;
globalThis.confirm=s=>{confirmations.push(s);return accept;};
globalThis.fetch=async(url,init)=>{if(String(url).startsWith('/api/song-artwork')){if(init?.method==='DELETE'){artStatus=404;return {ok:true,json:async()=>({ok:true})};}return {ok:artStatus===200,status:artStatus};}if(init?.method==='POST'){await new Promise(r=>postRelease=r);return {ok:true,json:async()=>({ok:true})};}if(holdGet)await new Promise(r=>getRelease=r);return {ok:true,json:async()=>state};};
fs.mkdirSync('work/management',{recursive:true});
await build({stdin:{contents:"import React from 'react';import {createRoot} from 'react-dom/client';import Management from './app/admin/gestao/management';import {AdminLanguage} from './app/admin/language';export const root=createRoot(document.getElementById('root'));root.render(<AdminLanguage><Management/></AdminLanguage>);",resolveDir:process.cwd(),loader:'tsx'},outfile:'work/management/feedback.mjs',bundle:true,format:'esm',jsx:'automatic'});
document.body.innerHTML='<div id="root"></div>';const {root}=await import('../work/management/feedback.mjs');const tick=()=>new Promise(r=>setTimeout(r,30));await tick();await tick();
const button=t=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===t);assert(b,t);return b;};const click=async t=>{button(t).click();await tick();};const text=()=>document.body.textContent;
await click('Selecionar esta página');
for(const [label,operation] of [['Adicionar ao evento','Adicionar ao evento'],['Remover do evento','Remover do evento'],['Disponibilizar pedidos','Disponibilizar pedidos'],['Ocultar dos pedidos','Indisponibilizar pedidos']]){await click(label);assert(confirmations.at(-1).startsWith(operation+' — 1'));}
const feedback=document.querySelector('.management-feedback'),refresh=button('Atualizar'),structure=feedback.innerHTML.replace(/>[^<]*</g,'><');
accept=true;await click('Ocultar dos pedidos');assert(text().includes('A guardar'));assert(refresh.disabled);assert.equal(feedback.innerHTML.replace(/ disabled=""/g,'').replace(/>[^<]*</g,'><'),structure);
holdGet=true;postRelease();await tick();assert(text().includes('A guardar'));assert.equal(button('Atualizar'),refresh);assert(refresh.disabled);assert.equal(document.querySelector('.management-feedback'),feedback);
getRelease();holdGet=false;await tick();assert(!refresh.disabled);assert.equal(button('Atualizar'),refresh);
holdGet=true;await click('Atualizar');assert(text().includes('A atualizar'));assert(refresh.disabled);getRelease();holdGet=false;await tick();
await click('Metadados / capa');assert(text().includes('Sem capa.'));assert(!document.querySelector('.artwork-preview img'));assert(!document.querySelector('a[href^="/api/song-artwork"]'));assert(button('Remover capa').disabled);assert(!text().includes('404'));await click('Fechar');
artStatus=200;await click('Metadados / capa');assert(document.querySelector('a[href^="/api/song-artwork"]'));assert(!button('Remover capa').disabled);assert.equal(document.querySelector('.artwork-preview img').getAttribute('width'),'64');assert.equal(document.querySelector('.artwork-preview img').getAttribute('alt'),'');await click('Remover capa');assert(text().includes('Sem capa.'));assert(!document.querySelector('.artwork-preview img'));assert(!document.querySelector('a[href^="/api/song-artwork"]'));await click('Fechar');
await click('PT → EN');await click('Select this page');accept=false;
for(const [label,operation] of [['Add to event','Add to event'],['Remove from event','Remove from event'],['Make requestable','Make available for requests'],['Hide from requests','Make unavailable for requests']]){await click(label);assert(confirmations.at(-1).startsWith(operation+' — 1'));}
artStatus=404;await click('Metadata / artwork');assert(text().includes('No artwork.'));assert(!document.querySelector('a[href^="/api/song-artwork"]'));await click('Close');
artStatus=503;await click('Metadata / artwork');assert(text().includes('Could not check artwork.'));assert(!document.querySelector('a[href^="/api/song-artwork"]'));artStatus=404;await click('Check again');assert(text().includes('No artwork.'));
const css=fs.readFileSync('app/globals.css','utf8');assert(css.includes('.management-feedback{display:flex;align-items:center;gap:12px;height:104px}'));assert(css.includes('height:78px;margin:0;overflow:auto'));
root.unmount();await window.happyDOM.abort();console.log('PASS: stable feedback/refresh DOM during save and reload; four explicit PT/EN confirmations; absent/present/error/retry artwork UI. Fixed CSS space verified, not browser pixel measurements.');
