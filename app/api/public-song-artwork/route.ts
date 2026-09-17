import {env} from 'cloudflare:workers';
import {db} from '../../data';
import {artworkKey} from '../../artwork';
const empty=(status:number)=>new Response(null,{status,headers:{'Cache-Control':'no-store'}});
// Public image only. Management GET/PUT/DELETE remain in the authenticated route.
export async function GET(r:Request){
  const params=new URL(r.url).searchParams,id=params.get('id');
  if(params.getAll('id').length!==1||!id||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,149}$/.test(id))return empty(400);
  try{
    if(!await db().prepare('SELECT id FROM songs WHERE id=?').bind(id).first())return empty(404);
    const object=await (env.BUCKET as R2Bucket).get(artworkKey(id));
    if(!object)return empty(404);
    const type=object.httpMetadata?.contentType;
    if(!type||!['image/jpeg','image/png','image/webp'].includes(type)||object.size>1024*1024)return empty(404);
    // The stable key can be replaced/deleted: revalidate on every reuse, never immutable.
    const headers={'Content-Type':type,'Cache-Control':'public, max-age=0, must-revalidate','ETag':object.httpEtag,'X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'};
    if(r.headers.get('if-none-match')?.split(',').map(v=>v.trim().replace(/^W\//,'')).some(v=>v==='*'||v===object.httpEtag))return new Response(null,{status:304,headers});
    return new Response(object.body,{headers});
  }catch{return empty(503);}
}
