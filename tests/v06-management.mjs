// Pure validation/filter tests + export the actual SQL plans for SQLite in-memory tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
fs.mkdirSync('work/management',{recursive:true});
await build({entryPoints:['app/advanced-management.ts'],outfile:'work/management/model.mjs',bundle:true,format:'esm',platform:'node'});
const {managementPlan:plan,filterManagement:filter}=await import('../work/management/model.mjs');
const songs=Array.from({length:500},(_,i)=>({id:'s'+i,title:i===0?'Coração':'Song '+i,artist:i===0?'João Melo':'Artist '+i,genre:i%2?'rock':'',decade:i%2?1990:null,language:i%2?'en':'',recommended:i%2,status:i%2?'hidden':'available'}));
assert.equal(filter(songs,{q:'JOAO'})[0].title,'Coração');assert.equal(filter(songs,{q:'coracao'}).length,1);assert.equal(filter(songs,{q:'song'}).length,499);
for(const filters of [{genre:'rock'},{decade:'1990'},{language:'en'},{recommended:'1'},{status:'hidden'}])assert.equal(filter(songs,filters).length,250);
assert.equal(filter(songs,{genre:'rock',status:'available'}).length,0);assert.equal(filter(songs,{}).length,500);
const start=performance.now();for(let i=0;i<1000;i++)filter(songs,{q:'song',genre:'rock'});console.log('500 songs × 1000 searches:',Math.round(performance.now()-start),'ms');
const base={sessionId:'e',sessionRevision:0};
for(const b of [{action:'add',ids:[]},{action:'add',ids:['s1','s1']},{action:'add',ids:Array.from({length:41},(_,i)=>'s'+i)},{action:'availability',ids:['s1'],status:'playing'},{action:'event_metadata',metadata:{featured_title:'Incomplete'}},{action:'metadata',id:'s0',revision:0,metadata:{decade:1995}},{action:'duplicate',newId:'copy',name:'x',date:'2026-02-30'},{action:'duplicate',newId:'copy',name:'x',date:'2026-99-99'}])assert.throws(()=>plan({...base,...b}));
for(const action of ['add','remove','availability'])for(const statement of plan({...base,action,status:'hidden',ids:songs.slice(0,40).map(s=>s.id)}))assert(statement.args.length<=100);
const cases={
 add:{action:'add',ids:['s0','s1']},hide:{action:'availability',sessionRevision:1,ids:['s0','s1'],status:'hidden'},stale:{action:'remove',ids:['s0','s1']},remove:{action:'remove',sessionRevision:2,ids:['s1']},playing:{action:'availability',sessionRevision:3,ids:['s0'],status:'hidden'},archived:{action:'add',sessionRevision:3,ids:['s2']},
 metadata:{action:'metadata',id:'s1',revision:0,metadata:{genre:'folk',decade:1990,language:'pt',recommended:1}},
 event:{action:'event_metadata',sessionRevision:3,metadata:{venue:'Sala',city:'Braga',featured_title:'Sina',featured_artist:'Pedro',featured_url:'https://example.test/sina'}},
 duplicate:{action:'duplicate',sessionRevision:4,newId:'copy',name:'Next',date:'2026-09-20'},duplicateStale:{action:'duplicate',sessionRevision:0,newId:'stale-copy',name:'Next',date:''}
};
fs.writeFileSync('work/management/plans.json',JSON.stringify(Object.fromEntries(Object.entries(cases).map(([k,b])=>[k,plan({...base,...b})]))));
console.log('PASS: 500-song search/accents/filters, legacy metadata, invalid commands and bounded batches.');
