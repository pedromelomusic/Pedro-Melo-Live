// DOM simulation with the real Home, SongPicker and receipt. No browser/layout claim.
import assert from 'node:assert/strict';
import {Window} from '../work/discovery-dom/node_modules/happy-dom/lib/index.js';
const window=new Window({url:'http://localhost/'});
for(const key of ['window','document','navigator','HTMLElement','HTMLInputElement','Event','MouseEvent','FormData'])Object.defineProperty(globalThis,key,{value:key==='window'?window:window[key],configurable:true});
globalThis.fetch=(...args)=>window.fetch(...args);
document.body.innerHTML='<div id="root"></div>';await import('../work/live-tests/fixture.js');
const tick=(ms=20)=>new Promise(r=>setTimeout(r,ms));await tick();
const select=async(id,value)=>{const e=document.querySelector(id);e.value=value;e.dispatchEvent(new window.Event('change',{bubbles:true}));await tick();};
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
const search=async text=>{const e=document.querySelector('#song-search');Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(e,text);e.dispatchEvent(new window.Event('input',{bubbles:true}));await tick();};
const submit=()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
const choose=async()=>{await search('fix');document.querySelector('.song-option').click();await tick();};
assert.equal(document.querySelectorAll('.song-option').length,0);assert(document.querySelector('.live-context').textContent.includes('Pedidos abertos'));
await choose();
const originalCrypto=globalThis.crypto;
Object.defineProperty(globalThis,'crypto',{value:{randomUUID(){throw new Error('UUID unavailable');}},configurable:true});
submit();await tick();assert(!document.querySelector('.request-receipt'));assert(!button('Pedir uma música ♫').disabled);assert(document.querySelector('.feedback').textContent.includes('Não foi possível confirmar'));
Object.defineProperty(globalThis,'crypto',{value:originalCrypto,configurable:true});
await select('#qa-response','delayed');submit();submit();await tick(5);assert(!document.querySelector('.request-receipt'));assert(button('A enviar…').disabled);await tick(35);
assert(document.querySelector('.request-receipt').textContent.includes('Fix You'));assert(document.querySelector('.featured-original').textContent.includes('Sina'));assert.equal(document.activeElement.id,'request-received');
assert.equal(document.querySelector('#qa-attempts').textContent.split(',').length,1);
assert(document.querySelector('.request-receipt a[href^="/apoio"]').getAttribute('href').includes('request='));
for(const error of ['server','network','ambiguous','timeout']){
  await choose();await select('#qa-response',error);submit();await tick(70);assert(!document.querySelector('.request-receipt'));assert(document.querySelector('.feedback').textContent.includes('Não foi possível confirmar'));
  const ids=document.querySelector('#qa-attempts').textContent.split(',');const previous=ids.at(-1);
  await select('#qa-response','success');submit();await tick();assert(document.querySelector('.request-receipt'));assert.equal(document.querySelector('#qa-attempts').textContent.split(',').at(-1),previous);
}
await select('#qa-event','no-featured');await choose();submit();await tick();assert(document.querySelector('.request-receipt'));assert(!document.querySelector('.featured-original'));
await select('#qa-event','paused');assert(button('Pedidos em pausa').disabled);assert(document.querySelector('.live-context').textContent.includes('pausa'));
button('PT / EN').click();await tick();assert(document.querySelector('.request-receipt').textContent.includes('Request received'));assert(document.querySelector('.request-receipt').textContent.includes('requests are free'));assert(document.querySelector('.live-context').textContent.includes('paused'));
await select('#qa-event','none');assert(!document.querySelector('.request-receipt'));assert(document.querySelector('.live-context').textContent.includes('Between shows'));
console.log('PASS C DOM: 500-song discovery, open/paused/no event, confirmed title, delayed response, synchronous double-submit blocked, failed/ambiguous/timeout never confirmed, safe retry keeps id, featured present/absent, request-linked tips, focus, PT/EN.');
await window.happyDOM.abort();
