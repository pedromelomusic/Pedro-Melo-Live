// Only public artwork reading and optional UI. All storage/auth/network simulated.
import assert from 'node:assert/strict';import fs from 'node:fs';import {build} from 'esbuild';
fs.mkdirSync('work/photography',{recursive:true});
const state=globalThis.__artQA={authenticated:false,exists:true,object:null,keys:[],bindings:[]};
const data=`export const admin=async()=>globalThis.__artQA.authenticated;export const sameOrigin=()=>true;export const json=(v,s=200)=>Response.json(v,{status:s});export const db=()=>({prepare(sql){if(sql!=='SELECT id FROM songs WHERE id=?')throw Error('Unexpected SQL');return {bind(id){globalThis.__artQA.bindings.push(id);return this},async first(){return globalThis.__artQA.exists?{id:'home'}:null}}}});`;
const env=`export const env={BUCKET:{async get(key){globalThis.__artQA.keys.push(key);return globalThis.__artQA.object;},async put(key,bytes,options){globalThis.__artQA.object={body:bytes,size:bytes.length,httpMetadata:options.httpMetadata,httpEtag:'"new"'}},async delete(){globalThis.__artQA.object=null},list(){throw Error('Unexpected listing')}}};`;
const plugins=[{name:'isolated',setup(b){b.onResolve({filter:/^\.\.\/\.\.\/data$/},()=>({path:'data',namespace:'mock'}));b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path==='data'?data:env,loader:'js'}));}}];
for(const name of ['public-project-photo','project-photo'])await build({entryPoints:[`app/api/${name}/route.ts`],outfile:`work/photography/${name}.mjs`,bundle:true,platform:'node',format:'esm',plugins});
const api=await import('../work/photography/public-project-photo.mjs'),admin=await import('../work/photography/project-photo.mjs');
assert.deepEqual(Object.keys(api),['GET']);
const req=(id,etag)=>new Request('https://example.test/api/public-project-photo'+id,{headers:etag?{'If-None-Match':etag}:{}});
for(const id of ['', '?slot=', '?slot=../backup', '?slot=%2Fsecret','?slot=a%00b','?slot='+ 'a'.repeat(151),'?slot=a&slot=b'])assert.equal((await api.GET(req(id))).status,400);
assert.equal(state.keys.length,0);assert.equal((await api.GET(req('?slot=unknown'))).status,400);
let r=await api.GET(req('?slot=home'));assert.equal(r.status,404);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(await r.text(),'');
state.object={body:new Uint8Array([1,2,3]),size:3,httpMetadata:{contentType:'image/png'},httpEtag:'"v1"'};
r=await api.GET(req('?slot=home'));assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(r.headers.get('cache-control'),'public, max-age=0, must-revalidate');assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[1,2,3]);assert.equal(state.keys.at(-1),'project-photography/v1/home');
assert.equal((await api.GET(req('?slot=home','W/"v1"'))).status,304);state.object.httpEtag='"v2"';assert.equal((await api.GET(req('?slot=home','"v1"'))).status,200);
state.object.httpMetadata.contentType='text/html';assert.equal((await api.GET(req('?slot=home'))).status,404);state.object=null;assert.equal((await api.GET(req('?slot=home','"v2"'))).status,404);
for(const method of ['GET','PUT','DELETE'])assert.equal((await admin[method](new Request('https://example.test/api/project-photo?slot=home',{method}))).status,403);

console.log('PASS photography: slot validation, GET only, missing image, ETag replacement/removal, content type, unauthenticated writes denied.');

state.authenticated=true;
const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
const put=(body,type='image/png')=>admin.PUT(new Request('https://example.test/api/project-photo?slot=home',{method:'PUT',headers:{'content-type':type},body}));
assert.equal((await put(png)).status,200);assert.equal((await api.GET(req('?slot=home'))).status,200);
assert.equal((await put(png,'image/jpeg')).status,400);assert.equal((await put(new Uint8Array(1024*1024+1))).status,413);
assert.equal((await admin.DELETE(req('?slot=home'))).status,200);assert.equal((await api.GET(req('?slot=home'))).status,404);
const {Window}=await import('../work/discovery-dom/node_modules/happy-dom/lib/index.js');const window=new Window({url:'https://example.test'});for(const k of ['window','document','navigator','HTMLElement','Event'])Object.defineProperty(globalThis,k,{value:k==='window'?window:window[k],configurable:true});
await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {ProjectPhoto} from './app/project-photo';export const root=createRoot(document.getElementById('root'));root.render(<><ProjectPhoto slot="home" alt="Pedro"/><ProjectPhoto slot="giants" alt="Giants"/></>);`,resolveDir:process.cwd(),loader:'tsx'},outfile:'work/photography/dom.mjs',bundle:true,format:'esm',jsx:'automatic'});
document.body.innerHTML='<div id="root"></div>';const {root}=await import('../work/photography/dom.mjs');const tick=()=>new Promise(r=>setTimeout(r,30));await tick();const [present,missing]=document.querySelectorAll('img');assert(present.hidden);present.dispatchEvent(new window.Event('load'));missing.dispatchEvent(new window.Event('error'));await tick();assert(!present.hidden);assert(!document.contains(missing));assert(!document.body.textContent.includes('404'));root.unmount();await window.happyDOM.abort();
console.log('PASS photography: authenticated upload/delete, wrong format and >1 MB denied; optional DOM image revealed on load and removed on absence.');
