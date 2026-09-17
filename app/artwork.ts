// Optional object only; no binary or new column in D1. Namespace is separate from backups.
export const artworkKey=(id:string)=>'song-artwork/v1/'+encodeURIComponent(id);
export function artworkType(bytes:Uint8Array){
  if(bytes.length<12||bytes.length>1024*1024)return null;
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
  if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';
  if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
  return null;
}
