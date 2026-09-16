import {z} from 'zod';

// Empty values mean "not provided". Never infer metadata for existing songs.
export const songMetadataShape = {
  genre:z.string().trim().max(80).default(''),
  decade:z.number().int().min(1900).max(2100).multipleOf(10).nullable().default(null),
  language:z.string().trim().max(35).regex(/^$|^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).default(''),
  mood:z.string().trim().max(80).default(''),
  recommended:z.number().int().min(0).max(1).default(0),
};
const optionalHttps=z.string().max(2000).refine(value=>{if(!value)return true;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}},'Expected an HTTPS URL without credentials').default('');
export const eventMetadataShape = {
  venue:z.string().trim().max(160).default(''),
  city:z.string().trim().max(100).default(''),
  featured_title:z.string().trim().max(140).default(''),
  featured_artist:z.string().trim().max(140).default(''),
  featured_url:optionalHttps,
};
export const songMetadataSchema=z.object(songMetadataShape);
export const eventMetadataSchema=z.object(eventMetadataShape).superRefine((v,ctx)=>{
  const fields=[v.featured_title,v.featured_artist,v.featured_url];
  if(fields.some(Boolean)&&!fields.every(Boolean))ctx.addIssue({code:'custom',message:'Featured original requires title, artist and URL',path:['featured_title']});
});
export type SongMetadata=z.infer<typeof songMetadataSchema>;
export type EventMetadata=z.infer<typeof eventMetadataSchema>;

// State remains derived from existing flags + active_session; no second state machine.
export function eventLifecycle(event:{id:string;archived:number|boolean}|null,activeId:string|null){
  return !event?'between_shows':event.archived?'archived':event.id===activeId?'live':'upcoming';
}
