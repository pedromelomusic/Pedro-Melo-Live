import {env} from 'cloudflare:workers';
import {admin,json,sameOrigin} from '../../data';
import {artworkType} from '../../artwork';
import {photoKey,photoSlot} from '../../photography';
export async function GET(r:Request){if(!await admin())return json({error:'forbidden'},403);try{const id=photoSlot(r);if(!id)return json({error:'missing'},404);const object=await (env.BUCKET as R2Bucket).get(photoKey(id));if(!object)return json({error:'missing'},404);return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch{return json({error:'unavailable'},503);}}
export async function PUT(r:Request){
  if(!sameOrigin(r)||!await admin())return json({error:'forbidden'},403);
  try{const id=photoSlot(r);if(!id)return json({error:'missing'},404);
    const reader=r.body?.getReader();if(!reader)return json({error:'invalid'},400);
    const chunks:Uint8Array[]=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1024*1024){await reader.cancel();return json({error:'size'},413);}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
    const type=artworkType(bytes);if(!type||type!==r.headers.get('content-type'))return json({error:'format'},400);
    await (env.BUCKET as R2Bucket).put(photoKey(id),bytes,{httpMetadata:{contentType:type}});return json({ok:true});
  }catch{return json({error:'unavailable'},503);}
}
export async function DELETE(r:Request){if(!sameOrigin(r)||!await admin())return json({error:'forbidden'},403);try{const id=photoSlot(r);if(!id)return json({error:'missing'},404);await (env.BUCKET as R2Bucket).delete(photoKey(id));return json({ok:true});}catch{return json({error:'unavailable'},503);}}
