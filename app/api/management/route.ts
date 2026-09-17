import {admin,db,provision,json,sameOrigin,sessionById,activeId} from '../../data';
import {managementPlan} from '../../advanced-management';
export async function GET(r:Request){
  if(!await admin())return json({error:'forbidden'},403);
  try{await provision();const d=db(),activeSessionId=await activeId(),id=new URL(r.url).searchParams.get('sessionId')||activeSessionId||'session-initial';
    const [catalog,session,eventSongs,sessions]=await Promise.all([d.prepare('SELECT id,title,artist,revision FROM songs ORDER BY artist COLLATE NOCASE,title COLLATE NOCASE,id').all(),sessionById(id),d.prepare('SELECT song_id AS id,status,in_setlist AS inSetlist,position FROM session_songs WHERE session_id=?').bind(id).all(),d.prepare('SELECT id,name,archived FROM sessions ORDER BY created DESC,id').all()]);
    if(!session)return json({error:'missing'},404);
    return json({activeSessionId,catalog:catalog.results,session,eventSongs:eventSongs.results,sessions:sessions.results});
  }catch{return json({error:'unavailable'},503);}
}
export async function POST(r:Request){
  if(!sameOrigin(r)||!await admin())return json({error:'forbidden'},403);
  try{
    const raw=await r.text();if(raw.length>12000)return json({error:'size'},413);
    const b=JSON.parse(raw);if(!b||typeof b!=='object')return json({error:'invalid'},400);
    if(['metadata','event_metadata','duplicate'].includes(b.action))return json({error:'concert_safe_disabled',message:'Indisponível temporariamente em Concert Safe. / Temporarily unavailable in Concert Safe.'},409);
    const plan=managementPlan(b),d=db();
    if(['add','remove','availability'].includes(b.action)){
      const table=b.action==='add'?'songs':'session_songs',col=b.action==='add'?'id':'song_id';
      const row=await d.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${col} IN (${b.ids.map(()=>'?').join(',')})`+(b.action==='add'?'':' AND session_id=?')).bind(...b.ids,...(b.action==='add'?[]:[b.sessionId])).first<any>();
      if(row.n!==b.ids.length)return json({error:'conflict'},409);
    }
    const results=await d.batch(plan.map(s=>d.prepare(s.sql).bind(...s.args)));
    const changed=results.at(-1)?.meta.changes;
    return changed?json({ok:true}):json({error:'conflict'},409);
  }catch(e){return json({error:e instanceof SyntaxError||e instanceof Error&&['invalid','batch_size'].includes(e.message)||e&&typeof e==='object'&&'issues'in e?'invalid':'unavailable'},e instanceof SyntaxError||e instanceof Error&&['invalid','batch_size'].includes(e.message)||e&&typeof e==='object'&&'issues'in e?400:503);}
}
