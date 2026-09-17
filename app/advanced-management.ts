import {songMetadataSchema,eventMetadataSchema} from './music-metadata';
export type Statement={sql:string;args:any[]};
export function managementPlan(b:any):Statement[]{
  const validId=(v:any)=>typeof v==='string'&&v.length>0&&v.length<=150;
  const revision=(v:any)=>Number.isSafeInteger(v)&&v>=0;
  if(b.action==='metadata'){
    if(!validId(b.id)||!revision(b.revision))throw Error('invalid');
    const m=songMetadataSchema.parse(b.metadata);
    return [{sql:'UPDATE songs SET genre=?,decade=?,language=?,mood=?,recommended=?,revision=revision+1 WHERE id=? AND revision=?',args:[m.genre,m.decade,m.language,m.mood,m.recommended,b.id,b.revision]}];
  }
  if(!validId(b.sessionId)||!revision(b.sessionRevision))throw Error('invalid');
  const params=[b.sessionId,b.sessionRevision];
  if(b.action==='event_metadata'){
    const m=eventMetadataSchema.parse(b.metadata);
    return [{sql:'UPDATE sessions SET venue=?,city=?,featured_title=?,featured_artist=?,featured_url=?,revision=revision+1 WHERE id=? AND revision=? AND archived=0',args:[m.venue,m.city,m.featured_title,m.featured_artist,m.featured_url,...params]}];
  }
  if(b.action==='duplicate'){
    if(!validId(b.newId)||typeof b.name!=='string'||!b.name.trim()||b.name.length>100||typeof b.date!=='string'||(b.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||!Number.isFinite(Date.parse(b.date+'T12:00:00Z'))||new Date(b.date+'T12:00:00Z').toISOString().slice(0,10)!==b.date)))throw Error('invalid');
    return [
      {sql:'INSERT INTO sessions(id,name,date,created,mode,venue,city,featured_title,featured_artist,featured_url,requests_open) SELECT ?,?,?,?,mode,venue,city,featured_title,featured_artist,featured_url,0 FROM sessions WHERE id=? AND revision=?',args:[b.newId,b.name.trim(),b.date,Date.now(),...params]},
      {sql:"INSERT INTO session_songs(session_id,song_id,status,in_setlist,position) SELECT ?,song_id,CASE WHEN status='hidden' THEN 'hidden' WHEN status='reserved' THEN 'reserved' ELSE 'available' END,in_setlist,position FROM session_songs WHERE session_id=? AND EXISTS(SELECT 1 FROM sessions WHERE id=?)",args:[b.newId,b.sessionId,b.newId]},
    ];
  }
  if(!['add','remove','availability'].includes(b.action)||!Array.isArray(b.ids)||!b.ids.length||b.ids.length>40||b.ids.some((id:any)=>!validId(id))||new Set(b.ids).size!==b.ids.length)throw Error('invalid');
  if(b.action==='availability'&&!['available','hidden'].includes(b.status))throw Error('invalid');
  const placeholders=b.ids.map(()=>'?').join(',');
  const guard=`EXISTS(SELECT 1 FROM sessions WHERE id=? AND revision=? AND archived=0) AND NOT EXISTS(SELECT 1 FROM session_songs WHERE session_id=? AND status='playing' AND song_id IN (${placeholders}))`;
  const guardArgs=[...params,b.sessionId,...b.ids];
  let sql='',args:any[]=[];
  if(b.action==='add'){sql=`INSERT OR IGNORE INTO session_songs(session_id,song_id,status,position) SELECT ?,id,'available',rowid FROM songs WHERE id IN (${placeholders}) AND ${guard}`;args=[b.sessionId,...b.ids,...guardArgs];}
  if(b.action==='remove'){sql=`DELETE FROM session_songs WHERE session_id=? AND song_id IN (${placeholders}) AND ${guard}`;args=[b.sessionId,...b.ids,...guardArgs];}
  if(b.action==='availability'){sql=`UPDATE session_songs SET status=? WHERE session_id=? AND song_id IN (${placeholders}) AND ${guard}`;args=[b.status,b.sessionId,...b.ids,...guardArgs];}
  // Keep each statement below D1's 100-bound-parameter limit.
  if(args.length>100)throw Error('batch_size');
  return [{sql,args},{sql:`UPDATE sessions SET revision=revision+1 WHERE id=? AND ${guard}`,args:[b.sessionId,...guardArgs]}];
}
export function filterManagement(songs:any[],filters:Record<string,string>){
  const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return songs.filter(s=>(!filters.q||norm(s.title+' '+s.artist).includes(norm(filters.q)))&&['genre','decade','language','recommended','status'].every(k=>!filters[k]||String(s[k]??'')===filters[k]));
}
