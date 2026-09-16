// Focused regression for the two Stage QA feedback issues. Synthetic transport.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {Window} from '../work/discovery-dom/node_modules/happy-dom/lib/index.js';
fs.mkdirSync('work/stage',{recursive:true});
const window=new Window({url:'https://example.test/admin/palco'});
for(const key of ['window','document','navigator','HTMLElement','Event','MouseEvent','localStorage'])Object.defineProperty(globalThis,key,{value:key==='window'?window:window[key],configurable:true});
let offline=true,release;
const state={session:{id:'event',revision:1,name:'Test',archived:false},activeSessionId:'event',settings:{requestsOpen:true},now:{song:'Fix You',artist:'Coldplay'},songs:[],ranking:[],requests:[]};
globalThis.fetch=async(_url,init)=>{if(offline)throw Error('offline');if(init?.method==='POST'){await new Promise(r=>release=r);return {ok:true,json:async()=>({ok:true})};}return {ok:true,json:async()=>state};};
await build({stdin:{contents:"import React from 'react';import {createRoot} from 'react-dom/client';import Stage from './app/admin/palco/stage';import {AdminLanguage} from './app/admin/language';export const root=createRoot(document.getElementById('root'));root.render(<AdminLanguage><Stage/></AdminLanguage>);",resolveDir:process.cwd(),loader:'tsx'},outfile:'work/stage/feedback.mjs',bundle:true,format:'esm',jsx:'automatic'});
document.body.innerHTML='<div id="root"></div>';const {root}=await import('../work/stage/feedback.mjs');const tick=()=>new Promise(r=>setTimeout(r,30));await tick();await tick();
const text=()=>document.body.textContent;const button=s=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes(s));
assert(text().includes('Ligação indisponível'));assert(!text().includes('A carregar'));assert(button('Tentar novamente'));
offline=false;button('Tentar novamente').click();await tick();assert(!text().includes('Ligação indisponível'));assert(!button('Tentar novamente'));
const before=document.querySelector('.stage-feedback').children.length;button('Pedidos abertos').click();await tick();assert(text().includes('A guardar'));assert.equal(document.querySelector('.stage-feedback').children.length,before);assert(!text().includes('Estado por confirmar'));assert(!button('Atualizar'));assert(button('Pedidos abertos').disabled);release();await tick();assert(text().includes('Guardado.'));
root.unmount();await window.happyDOM.abort();console.log('PASS: initial error excludes loading, retry clears error, saving keeps feedback structure and LIVE text stable, no refresh button while saving, controls disabled. Layout measured separately in browser.');
