import {maintenance} from '../../operations';
import {live,json,reportError} from '../../data';
export async function GET(r:Request){try{try{await maintenance()}catch(e){reportError('Automatic maintenance',e)}const id=new URL(r.url).searchParams.get('event');if(id&&id.length>80)return json({error:'invalid'},400);return json(await live(id))}catch(e){reportError('GET /api/live',e);return json({error:'unavailable'},503)}}
