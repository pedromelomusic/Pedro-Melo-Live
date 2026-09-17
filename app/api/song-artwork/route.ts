import {env} from 'cloudflare:workers';
import {admin,db,json,sameOrigin} from '../../data';
import {artworkKey,artworkType} from '../../artwork';
async function song(r:Request){const id=new URL(r.url).searchParams.get('id');return id&&id.length<=150&&await db().prepare('SELECT id FROM songs WHERE id=?').bind(id).first()?id:null;}
export async function GET(r:Request){if(!await admin())return json({error:'forbidden'},403);try{const id=await song(r);if(!id)return json({error:'missing'},404);const object=await (env.BUCKET as R2Bucket).get(artworkKey(id));if(!object)return json({error:'missing'},404);return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch{return json({error:'unavailable'},503);}}
export async function PUT(r:Request){
  if(!sameOrigin(r)||!await admin())return json({error:'forbidden'},403);
  try{const id=await song(r);if(!id)return json({error:'missing'},404);
    const reader=r.body?.getReader();if(!reader)return json({error:'invalid'},400);
    const chunks:Uint8Array[]=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1024*1024){await reader.cancel();return json({error:'size'},413);}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
    const type=artworkType(bytes);if(!type||type!==r.headers.get('content-type'))return json({error:'format'},400);
    await (env.BUCKET as R2Bucket).put(artworkKey(id),bytes,{httpMetadata:{contentType:type}});return json({ok:true});
  }catch{return json({error:'unavailable'},503);}
}
export async function DELETE(r:Request){if(!sameOrigin(r)||!await admin())return json({error:'forbidden'},403);try{const id=await song(r);if(!id)return json({error:'missing'},404);await (env.BUCKET as R2Bucket).delete(artworkKey(id));return json({ok:true});}catch{return json({error:'unavailable'},503);}}
