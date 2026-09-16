export type StageSong={id:string;title:string;artist:string;status:string;inSetlist:boolean;position:number};
export function stageLists(songs:StageSong[]){
  const setlist=songs.filter(s=>s.inSetlist).sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
  const playable=(s:StageSong)=>s.status==='available'||s.status==='reserved';
  const current=setlist.findIndex(s=>s.status==='playing');
  return {setlist,next:setlist.slice(current+1).find(playable),repertoire:songs.filter(playable)};
}
export async function stageFetch(body?:unknown){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),10000);
  try{
    const response=await fetch('/api/manage',body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal}:{signal:controller.signal,cache:'no-store'});
    const data:any=await response.json();
    if(!response.ok)throw new Error(data?.error||'unavailable');
    if(body?data?.ok!==true:!data?.session||!data?.now||!data?.settings||!Array.isArray(data.songs)||!Array.isArray(data.ranking)||!Array.isArray(data.requests))throw new Error('ambiguous');
    return data;
  }finally{clearTimeout(timer);}
}
