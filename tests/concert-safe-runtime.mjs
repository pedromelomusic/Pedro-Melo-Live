// Full built Workers + real local workerd D1/R2. No remote bindings or outbound traffic.
// Usage: node tests/concert-safe-runtime.mjs <detached-full-v06-checkout>
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {Miniflare,Log,LogLevel} from 'miniflare';
import {runDOM} from './concert-safe-dom.mjs';
const base='2bd5e0894370aa87c31aa46e3ed8d4f6cf77691f';
const root=process.cwd(),full=path.resolve(process.argv[2]||'work/concert-safe/full');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:full,encoding:'utf8'}).trim(),base);
assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:full,encoding:'utf8'}).trim(),'');
const directory=fs.mkdtempSync(path.join(root,'work/concert-safe/run-'));
const errors=[];class CaptureLog extends Log{error(e){errors.push(String(e));super.error(e);}}
const bindings={ADMIN_EMAIL:'concert-safe@example.test',MAKE_WEBHOOK_URL:'https://hook.eu1.make.com/local-fixture-never-dispatched',COMMUNICATION_CHANNELS:'email',INTEGRATIONS_ENABLED:'false'};
function options(checkout){const server=path.join(checkout,'dist/server');const files=fs.readdirSync(server,{recursive:true}).filter(f=>f.endsWith('.js'));
 return {modulesRoot:server,modules:['index.js',...files.filter(f=>f!=='index.js')].map(f=>({type:'ESModule',path:path.join(server,f)})),cf:false,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'concert-safe-local'},d1Persist:path.join(directory,'d1'),r2Buckets:['BUCKET'],r2Persist:path.join(directory,'r2'),bindings,assets:{directory:path.join(checkout,'dist/client'),binding:'ASSETS',routerConfig:{has_user_worker:true,invoke_user_worker_ahead_of_assets:true}},log:new CaptureLog(LogLevel.ERROR),outboundService:()=>{throw Error('Outbound traffic forbidden in Concert Safe QA');}};
}
let mf=new Miniflare(options(root)),d,bucket;
const report={base,persistence:directory,checks:[],pragma:{},transition:{}};
const pass=s=>{report.checks.push(s);console.log('PASS:',s);};
const sql=async(q,...args)=>d.prepare(q).bind(...args).all();
const one=async(q,...args)=>d.prepare(q).bind(...args).first();
const adminHeaders={'oai-authenticated-user-id':'local-qa','oai-authenticated-user-email':bindings.ADMIN_EMAIL};
let calls=0;
async function request(url,{method='GET',body,auth=false,status=200,headers={},raw=false}={}){
 calls++;const r=await mf.dispatchFetch('http://localhost'+url,{method,headers:{Origin:'http://localhost',...(auth?adminHeaders:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body===undefined?{}:{body:raw?body:JSON.stringify(body)})});
 const text=await r.text();assert.equal(r.status,status,url+' '+text.slice(0,400));assert(!/no such column/i.test(text),url);return r.headers.get('content-type')?.includes('application/json')?JSON.parse(text):text;
}
async function command(b,endpoint='/api/manage',status=200){const current=await request('/api/manage',{auth:true});return request(endpoint,{auth:true,method:'POST',body:{sessionId:current.session.id,sessionRevision:current.session.revision,...b},status});}
const songColumns=['genre','decade','language','mood','recommended'],sessionColumns=['venue','city','featured_title','featured_artist','featured_url'];
async function pragma(present){for(const [table,columns] of [['songs',songColumns],['sessions',sessionColumns]]){const info=(await sql(`PRAGMA table_info(${table})`)).results;for(const c of columns)assert.equal(info.some(r=>r.name===c),present,table+'.'+c);report.pragma[(present?'after:':'before:')+table]=info.map(r=>r.name);}}
async function migrate(filename){const contents=fs.readFileSync(filename,'utf8');const statements=JSON.parse(execFileSync('python',['-c',`import sys,sqlite3,json
buf='';out=[]
for ch in sys.stdin.read():
 buf+=ch
 if ch==';' and sqlite3.complete_statement(buf): out.append(buf);buf=''
assert not buf.strip(),buf
print(json.dumps(out))`],{input:contents,encoding:'utf8'}));for(const statement of statements)await d.prepare(statement).run();}
const image=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
async function objects(){const list=await bucket.list();const result={};for(const o of list.objects){const v=await bucket.get(o.key);result[o.key]=createHash('sha256').update(Buffer.from(await v.arrayBuffer())).digest('hex');}return result;}
async function snapshot(){const out={};for(const table of ['songs','sessions','session_songs','requests','metrics','tips','settings','subscriptions','contact_challenges'])out[table]=(await sql(`SELECT * FROM ${table} ORDER BY rowid`)).results;return out;}
try{
 d=await mf.getD1Database('DB');bucket=await mf.getR2Bucket('BUCKET');
 assert.equal((await one("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='songs'")).n,0);
 const migrations=fs.readdirSync('drizzle').filter(f=>/^000[0-6]_.*\.sql$/.test(f)).sort();assert.equal(migrations.length,7);
 for(const f of migrations)await migrate(path.join(root,'drizzle',f));await pragma(false);pass('clean real D1: only migrations 0000–0006, all ten columns absent');
 await sql("INSERT INTO settings(key,value) VALUES ('catalog_v02_initialized','true'),('sessions_v03_initialized','true'),('active_session','\"concert\"')");
 await sql("INSERT INTO sessions(id,name,date,created,mode) VALUES ('concert','Concert Safe QA','2026-09-18',?,'concert'),('second','Other event','',?,'busking')",Date.now(),Date.now());
 for(let i=0;i<500;i++){await sql('INSERT INTO songs(id,title,artist,lyrics,lyrics_approved) VALUES (?,?,?,?,?)','song-'+i,i===0?'Fix You':i===1?'Coração':i===2?'Uma canção de título muito comprido para confirmar a apresentação em resultados móveis':'Song '+String(i).padStart(3,'0'),i===0?'Coldplay':i===1?'João':'Artist '+i%30,i===0?'Local synthetic lyrics':'',i===0?1:0);}
 await sql("INSERT INTO session_songs(session_id,song_id,status,in_setlist,position) SELECT 'concert',id,'available',CASE WHEN rowid<=20 THEN 1 ELSE 0 END,rowid FROM songs");
 await sql("INSERT INTO session_songs(session_id,song_id,status,position) SELECT 'second',id,'available',rowid FROM songs LIMIT 5");
 await sql("INSERT INTO settings(key,value) VALUES ('site_content',?)",JSON.stringify({payments:{enabled:true,paidVotes:true,paypal:'https://paypal.me/local-qa-never-open',revolut:'',mbway:''}}));
 let live=await request('/api/live');assert.equal(live.songs.length,500);assert.equal(live.session.featuredOriginal,null);assert.equal(live.session.venue,'');assert(live.settings.requestsOpen);pass('live event and 500-song catalogue with neutral event context');
 for(const url of ['/','/projetos','/projetos/pedro','/projetos/giants','/projetos/pete','/aulas','/comunidade','/apoio','/letra'])assert((await request(url)).includes('<html'),url);
 for(const url of ['/admin','/admin/palco','/admin/gestao'])assert((await request(url,{auth:true})).includes('<html'),url);pass('built public/admin/stage/management routes render over real D1');
 for(const url of ['/api/manage','/api/management','/api/backup','/api/export','/api/export-jobs','/api/restore','/api/usage','/api/song-artwork?id=song-0','/api/project-photo?slot=home'])await request(url,{status:403});
 for(const url of ['/api/manage','/api/management','/api/restore','/api/export-jobs'])await request(url,{method:'POST',body:{},status:403});
 for(const url of ['/api/song-artwork?id=song-0','/api/project-photo?slot=home'])for(const method of ['PUT','DELETE'])await request(url,{method,body:method==='PUT'?image:undefined,raw:true,status:403});pass('unauthenticated administrative reads/writes refused');
 await command({action:'pause',open:false});live=await request('/api/live');assert(!live.settings.requestsOpen);
 await request('/api/requests',{method:'POST',body:{id:randomUUID(),songId:'song-0',sessionId:'concert',name:'QA'},status:409});
 await command({action:'pause',open:true});
 const req={id:randomUUID(),songId:'song-0',sessionId:'concert',name:'Synthetic QA'};
 await Promise.all([request('/api/requests',{method:'POST',body:req}),request('/api/requests',{method:'POST',body:req})]);assert.equal((await one('SELECT count(*) AS n FROM requests WHERE id=?',req.id)).n,1);assert.equal((await one("SELECT count FROM metrics WHERE event='request' AND session_id='concert'")).count,1);pass('paused request refused; concurrent identical submission persists one request/metric');
 await command({action:'song_state',id:'song-0',status:'playing'});live=await request('/api/live');assert.equal(live.now.song,'Fix You');assert.equal(live.now.lyrics,'Local synthetic lyrics');
 await command({action:'break'});assert.equal((await request('/api/live')).now.song,'');assert.equal((await one('SELECT status FROM requests WHERE id=?',req.id)).status,'played');
 await command({action:'song_state',id:'song-0',status:'available'});await command({action:'setlist_add',id:'song-25'});await command({action:'setlist_remove',id:'song-25'});
 const ranking=await request('/api/manage',{auth:true});assert(ranking.ranking.some(r=>r.title==='Fix You'));assert(ranking.requests.some(r=>r.id===req.id));pass('Stage: pause/open, play/lyrics, finish/break, setlist, rankings/recent');
 await sql("UPDATE settings SET value='null' WHERE key='active_session'");live=await request('/api/live');assert.equal(live.session,null);assert.equal(live.songs.length,0);await sql("UPDATE settings SET value='\"concert\"' WHERE key='active_session'");pass('no active session returns coherent empty live state');
 let management=await request('/api/management',{auth:true});assert.equal(management.catalog.length,500);
 await command({action:'availability',ids:['song-10','song-11'],status:'hidden'},'/api/management');assert(!(await request('/api/live')).songs.some(s=>s.id==='song-10'));
 await command({action:'remove',ids:['song-10','song-11']},'/api/management');await command({action:'add',ids:['song-10','song-11']},'/api/management');
 await command({action:'availability',ids:['song-10','song-11'],status:'available'},'/api/management');
 let song=(await request('/api/manage',{auth:true})).songs.find(s=>s.id==='song-3');await command({action:'song_save',song:{...song,title:'Edited locally',lyrics:'QA lyrics',lyricsApproved:true}});
 for(const action of ['metadata','event_metadata','duplicate'])await command({action,ids:['song-0'],metadata:{genre:'folk'}},'/api/management',409);
 for(const text of ['title,artist,genre\nX,Y,','title,artist,decade\nX,Y,1990',JSON.stringify([{title:'X',artist:'Y',mood:''}]),JSON.stringify([{title:'X',artist:'Y',recommended:0}]),JSON.stringify([{title:'X',artist:'Y',language:'pt'}])]){const r=await command({action:'import_preview',text},'/api/manage',400);assert.match(r.message,/Concert Safe/);}
 const basic='title,artist,lyrics\nImported local,QA,Synthetic';assert.equal((await command({action:'import_preview',text:basic})).newSongs,1);await command({action:'import_commit',text:basic});assert.equal((await one('SELECT count(*) AS n FROM songs')).n,501);pass('management/catalogue, bulk availability/add/remove, basic editing/import, metadata/duplicate rejection');
 const create=await command({action:'session_create',name:'Prepared locally',date:'2026-09-19',mode:'concert'});const target=await request('/api/manage?sessionId='+create.sessionId,{auth:true});const source=await request('/api/manage',{auth:true});await request('/api/manage',{auth:true,method:'POST',body:{action:'setlist_copy',sessionId:target.session.id,sessionRevision:target.session.revision,sourceId:source.session.id,sourceRevision:source.session.revision,strategy:'append'}});pass('basic event creation and copying repertoire remain available');
 const tipId=randomUUID();await request('/api/tips',{method:'POST',body:{id:tipId,provider:'paypal',cents:500,sessionId:'concert',requestId:req.id}});await command({action:'tip_confirm',id:tipId,revision:0,checked:true,cents:500,reference:'local-synthetic-payment'});
 const sub=await request('/api/subscriptions',{method:'POST',body:{channel:'email',contact:'synthetic@example.test',language:'pt',consent:true,policy:'music-updates-v1',sessionId:'concert'}});assert(sub.verificationPending);
 const queued=await one("SELECT payload FROM outbox WHERE event='verification_requested'");const token=new URL(JSON.parse(queued.payload).verificationUrl).hash.slice('#token='.length);await request('/api/verify',{method:'POST',body:{token}});
 for(const event of ['view:/','click:spotify','click:instagram','click:youtube','click:projects','click:project:pedro','click:lessons','click:community','click:support'])await request('/api/metrics',{method:'POST',body:{sessionId:'concert',event}});
 const stats=await request('/api/manage',{auth:true});assert.equal(stats.operations.analytics.contacts.confirmed,1);assert.equal(stats.operations.analytics.tips.confirmed,1);assert(stats.operations.metrics.some(r=>r.event==='click:spotify'&&r.count===1));pass('synthetic tips/confirmation, contact registration/verification, aggregate tracking and analytics');
 for(const [adminUrl,publicUrl] of [['/api/song-artwork?id=song-0','/api/public-song-artwork?id=song-0'],...['home','pedro','giants','pete'].map(s=>['/api/project-photo?slot='+s,'/api/public-project-photo?slot='+s])]){
 await request(publicUrl,{status:404});await request(adminUrl,{method:'PUT',auth:true,body:image,raw:true,headers:{'Content-Type':'image/png'}});await request(publicUrl);await request(adminUrl,{method:'DELETE',auth:true});await request(publicUrl,{status:404});await request(adminUrl,{method:'PUT',auth:true,body:image,raw:true,headers:{'Content-Type':'image/png'}});
 }await request('/api/public-song-artwork?id=song-499',{status:404});pass('local R2: optional artwork + four photo slots PUT/read/delete/absent; associations preserved');
 for(const scope of ['all','concert']){const e=await request('/api/export?kind=requests&sessionId='+scope,{auth:true});assert(e.complete);assert(e.requests.some(r=>r.id===req.id));}
 assert((await request('/api/export?kind=backup',{auth:true})).complete);const backup=await request('/api/backup',{auth:true});assert(backup.complete);assert.equal(backup.songs.length,501);assert(!('genre' in backup.songs[0]));
 const job=await request('/api/export-jobs',{auth:true,method:'POST',body:{action:'start',scope:'concert'}});let jobState;for(let i=0;i<10;i++){jobState=await request('/api/export-jobs',{auth:true,method:'POST',body:{action:'advance',id:job.id}});if(jobState.state==='ready')break;}assert.equal(jobState.state,'ready');await request('/api/export-jobs?id='+job.id+'&download=1',{auth:true});
 const beforeRestore={jobs:(await sql('SELECT * FROM restore_jobs')).results,objects:await objects(),revision:await one('SELECT revision FROM database_revision WHERE id=1')};
 for(const url of ['/api/restore?action=preview','/api/restore'])await request(url,{auth:true,method:'POST',body:backup,status:409});await request('/api/restore?id=fake',{auth:true,status:409});assert.deepEqual({jobs:(await sql('SELECT * FROM restore_jobs')).results,objects:await objects(),revision:await one('SELECT revision FROM database_revision WHERE id=1')},beforeRestore);pass('exports/global+event+R2 job, backup; restore rejects before any D1/R2 change');
 await runDOM({directory,request,command,dispatch:(url,options)=>mf.dispatchFetch(url,options),sql});pass('real Home/Stage/Management DOM connected to built Worker + real D1 (PT/EN)');
 await pragma(false);
 const before=await snapshot(),beforeObjects=await objects();fs.writeFileSync(path.join(directory,'before-transition.json'),JSON.stringify({data:before,objects:beforeObjects},null,2));
 await migrate(path.join(full,'drizzle/0007_music_context.sql'));await pragma(true);
 const after=await snapshot();for(const table of Object.keys(before)){const projected=after[table].map(row=>Object.fromEntries(Object.keys(before[table][0]||row).map(k=>[k,row[k]])));assert.deepEqual(projected,before[table],table+' preserved');}assert.deepEqual(await objects(),beforeObjects);
 await mf.dispose();mf=new Miniflare(options(full));d=await mf.getD1Database('DB');bucket=await mf.getR2Bucket('BUCKET');
 live=await request('/api/live');assert.equal(live.session.id,'concert');assert.equal((await request('/api/management',{auth:true})).catalog.length,501);await request('/api/manage',{auth:true});
 for(const url of ['/','/admin/palco','/admin/gestao'])await request(url,{auth:url.startsWith('/admin')});
 const fullSnapshot=await snapshot();for(const table of Object.keys(before)){const projected=fullSnapshot[table].map(row=>Object.fromEntries(Object.keys(before[table][0]||row).map(k=>[k,row[k]])));assert.deepEqual(projected,before[table],table+' unchanged after full Worker starts');}assert.deepEqual(await objects(),beforeObjects);
 for(const url of ['/api/public-song-artwork?id=song-0',...['home','pedro','giants','pete'].map(s=>'/api/public-project-photo?slot='+s)])await request(url);
 await command({action:'metadata',id:'song-0',revision:(await one("SELECT revision FROM songs WHERE id='song-0'")).revision,metadata:{genre:'Folk',decade:1990,language:'en',mood:'Warm',recommended:1}},'/api/management');
 await command({action:'event_metadata',metadata:{venue:'Local rehearsal',city:'Braga',featured_title:'Original QA',featured_artist:'Pedro Melo',featured_url:'https://example.test/music'}},'/api/management');await command({action:'song_state',id:'song-0',status:'available'});live=await request('/api/live');assert.equal(live.session.featuredOriginal.title,'Original QA');assert.equal(live.songs.find(s=>s.id==='song-0').genre,'Folk');
 report.transition={migrationExecutions:1,preservedCounts:Object.fromEntries(Object.entries(before).map(([k,v])=>[k,v.length])),r2ObjectsPreserved:Object.keys(beforeObjects).length,fullWorker:base};pass('same D1: 0007 once, rows/IDs/relationships/R2 hashes preserved; full v0.6 boots and edits new metadata');
 assert.equal(errors.filter(e=>/no such column/i.test(e)).length,0);assert.deepEqual(errors,[]);report.httpCalls=calls;report.errors=errors;fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2));console.log('REPORT',path.join(directory,'report.json'));
}finally{await mf.dispose();}
