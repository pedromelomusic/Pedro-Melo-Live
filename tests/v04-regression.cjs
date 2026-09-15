// Run only against the local preview with its simulated owner sign-in.
// npm install --no-save playwright; node tests/v04-regression.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:process.env.TEST_BROWSER||'msedge',headless:true});
 const page=await browser.newPage();const base='http://localhost:5173';let original=null;const created=[];
 const get=path=>page.request.get(base+path).then(async r=>({status:r.status(),...await r.json()}));
 const post=body=>page.evaluate(async body=>{const r=await fetch('/api/manage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,...await r.json()}},body);
 const state=id=>get('/api/manage?sessionId='+id);
 const command=async(id,body)=>post({sessionId:id,sessionRevision:(await state(id)).session.revision,...body});
 try{
  await page.goto(base+'/');assert.equal((await get('/api/export-jobs')).status,403);
  original=(await get('/api/live')).session?.id||null;
  await page.goto(base+'/signin-with-chatgpt?return_to=/admin');await page.locator('#session').waitFor();
  for(const mode of ['concert','busking']){const v=await post({action:'session_create',name:'QA v04 regression '+mode,date:'',mode});assert.equal(v.status,200);created.push(v.sessionId)}
  const [a,b]=created;const ids=(await state(a)).songs.slice(0,2).map(s=>s.id);assert.equal(ids.length,2);
  for(const id of ids)assert.equal((await command(a,{action:'setlist_add',id})).status,200);
  assert.equal((await command(b,{action:'song_state',id:ids[0],status:'reserved'})).status,200);
  const source=await state(a);assert.equal((await command(b,{action:'setlist_copy',sourceId:a,sourceRevision:source.session.revision,strategy:'replace'})).status,200);
  const target=await state(b);assert.deepEqual(target.songs.filter(s=>s.inSetlist).map(s=>s.id),ids);assert.equal(target.songs.find(s=>s.id===ids[0]).status,'reserved');
  assert.equal((await command(b,{action:'setlist_copy',sourceId:a,sourceRevision:-1,strategy:'replace'})).status,409);
  assert.equal((await command(a,{action:'session_activate',expectedActiveId:original})).status,200);
  assert.equal((await get('/api/live?event='+b)).settings.requestsOpen,false);
  await page.goto(base+'/?event='+a);await page.getByRole('link',{name:'Projetos',exact:true}).click();assert(page.url().includes('event='+a));
  await page.goto(base+'/admin');await page.locator('#session').waitFor();
  const exportCommand=body=>page.evaluate(async body=>{const r=await fetch('/api/export-jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,...await r.json()}},body);
  const job=await exportCommand({action:'start',scope:a});assert.equal(job.status,200);assert.equal((await exportCommand({action:'advance',id:job.id})).state,'ready');
  const file=await get('/api/export-jobs?id='+job.id+'&download=1');assert.equal(file.complete,true);assert.deepEqual(file.requests,[]);
  assert.equal((await get('/api/contacts-export')).status,200); // JSON array accepted by object spread.
  console.log('PASS v0.4 local regression: auth, modes, copied order, preserved states, conflicts, QR navigation and R2 export.');
 }finally{
  // Return the local stage to its previous owner-selected event even after an assertion fails.
  if(original){const s=await state(original);if(s.session)await post({action:'session_activate',sessionId:original,sessionRevision:s.session.revision,expectedActiveId:s.activeSessionId})}
  for(const id of created)await command(id,{action:'session_archive',archived:true});
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
