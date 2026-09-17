import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
fs.mkdirSync('work/analytics',{recursive:true});
await build({entryPoints:['app/analytics.ts'],outfile:'work/analytics/model.mjs',bundle:true,platform:'node',format:'esm'});
const {analyticsQueries,metricCounts,mostRequested}=await import('../work/analytics/model.mjs');
assert.deepEqual(metricCounts([{event:'request',count:12}]),{request:12});
assert.equal(mostRequested([{key:'paid',title:'Paid',organic:1,total:500},{key:'organic',title:'Organic',organic:5,total:5}])[0].key,'organic');
assert.equal(mostRequested(Array.from({length:500},(_,i)=>({key:String(i),title:String(i),organic:i}))).length,5);
fs.writeFileSync('work/analytics/queries.json',JSON.stringify(analyticsQueries));
execFileSync('python3',['-c',`
import sqlite3,json
c=sqlite3.connect(':memory:');c.row_factory=sqlite3.Row
c.executescript('CREATE TABLE tips(session_id,state,received_cents,refunded_cents);CREATE TABLE subscriptions(id,session_id,expires);CREATE TABLE contact_challenges(subscription_id,confirmed);CREATE TABLE metrics(day,session_id);')
c.executemany('INSERT INTO tips VALUES (?,?,?,?)',[('a','confirmed',500,100)]*105+[('b','confirmed',999999,0),(None,'confirmed',999999,0),('a','pending',500,0),('a','refunded',500,500)])
c.executemany('INSERT INTO subscriptions VALUES (?,?,?)',[('one','a',200),('two','b',200),('expired','a',1)])
c.executemany('INSERT INTO contact_challenges VALUES (?,?)',[('one',1),('one',1),('two',1),('expired',1)])
c.executemany('INSERT INTO metrics VALUES (?,?)',[('2026-01-01','a'),('2026-02-01','a'),('2020-01-01','b')])
q=json.load(open('work/analytics/queries.json'))
r=dict(c.execute(q['tips'],('a',)).fetchone());assert r==dict(declared=107,pending=1,confirmed=105,netCents=42000),r
r=dict(c.execute(q['contacts'],('a',100)).fetchone());assert r==dict(active=1,confirmed=1),r
assert dict(c.execute(q['period'],('a',)).fetchone())==dict(first='2026-01-01',last='2026-02-01')
assert c.execute(q['tips'],('missing',)).fetchone()['declared']==0
`]);
const mock=`export const useAdmin=()=>((pt,en)=>globalThis.__lang==='en'?en:pt);`;
await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {AnalyticsPanel} from './app/admin/analytics-panel';export const render=(s)=>renderToStaticMarkup(<AnalyticsPanel s={s}/>);`,resolveDir:process.cwd(),loader:'tsx'},outfile:'work/analytics/ui.mjs',external:['react','react-dom/server'],bundle:true,format:'esm',platform:'node',jsx:'automatic',plugins:[{name:'language',setup(b){b.onResolve({filter:/^\.\/language$/},()=>({path:'lang',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:mock}));}}]});
const {render}=await import('../work/analytics/ui.mjs');
for(const lang of ['pt','en']){globalThis.__lang=lang;const html=render({session:{name:'Test event'},operations:{metrics:[],analytics:{}},ranking:[]});assert(html.includes('Test event'));assert(html.includes(lang==='pt'?'Ainda sem pedidos':'No retained requests'));assert(html.includes(lang==='pt'?'não pessoas únicas':'not unique people'));assert(!html.includes('NaN'));}
const state=globalThis.__metrics={events:[]};
await build({entryPoints:['app/api/metrics/route.ts'],outfile:'work/analytics/api.mjs',bundle:true,format:'esm',platform:'node',plugins:[{name:'mock',setup(b){b.onResolve({filter:/^\.\.\/\.\.\/(data|operations)$/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path.endsWith('data')?`export const db=()=>{};export const json=(v,s=200)=>Response.json(v,{status:s});export const sameOrigin=r=>r.headers.get('origin')==='https://example.test';export const sessionById=async id=>id==='a';`:`export const limit=async()=>true;export const metricQuery=(id,event)=>({run:async()=>globalThis.__metrics.events.push({id,event})});`}));}}]});
const {POST}=await import('../work/analytics/api.mjs');const post=(event,origin='https://example.test')=>POST(new Request('https://example.test/api/metrics',{method:'POST',headers:{origin},body:JSON.stringify({sessionId:'a',event})}));
for(const event of ['click:featured-original','click:community','click:project:pedro','click:lessons','click:spotify'])assert.equal((await post(event)).status,200);
for(const event of ['request','consent:email','random'])assert.equal((await post(event)).status,400);
assert.equal((await post('click:spotify','https://other.test')).status,403);
console.log('PASS analytics: real SQLite event isolation, >100 tips, null event excluded, net refunds, distinct verified contacts, expiry, observed dates, top five organic, PT/EN empty panel, public event allowlist and origin protection.');
// Exercise the new post-request/social callbacks without a live network.
const {Window}=await import('../work/discovery-dom/node_modules/happy-dom/lib/index.js');const window=new Window({url:'https://example.test'});for(const k of ['window','document','navigator','HTMLElement','Event','MouseEvent'])Object.defineProperty(globalThis,k,{value:k==='window'?window:window[k],configurable:true});
globalThis.__clicks=[];
await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {RequestReceipt} from './app/live-experience';export const root=createRoot(document.getElementById('root'));root.render(<RequestReceipt request={{id:'r',sessionId:'a',title:'Song',artist:'Artist',featuredOriginal:{title:'Original',artist:'Pedro',url:'https://example.test/listen'}}}/>);`,resolveDir:process.cwd(),loader:'tsx'},outfile:'work/analytics/clicks.mjs',bundle:true,format:'esm',jsx:'automatic',plugins:[{name:'site',setup(b){b.onResolve({filter:/^\.\/site$/},()=>({path:'site',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`export const useSite=()=>({t:(pt,en)=>en,href:p=>p,links:{spotify:'https://example.test/spotify',instagram:'https://example.test/instagram',youtube:'https://example.test/youtube'},track:e=>globalThis.__clicks.push(e)});`}));}}]});
document.body.innerHTML='<div id="root"></div>';const {root}=await import('../work/analytics/clicks.mjs');await new Promise(r=>setTimeout(r,40));
for(const a of document.querySelectorAll('a')){a.addEventListener('click',e=>e.preventDefault());a.click();}
assert.deepEqual(globalThis.__clicks,['click:support','click:featured-original','click:instagram','click:spotify','click:youtube','click:community']);
root.unmount();await window.happyDOM.abort();console.log('PASS analytics: receipt and social CTA clicks each emit exactly one expected event.');
