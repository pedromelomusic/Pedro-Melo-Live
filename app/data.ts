import {env} from 'cloudflare:workers';
import {getChatGPTUser} from './chatgpt-auth';
export const defaults:Record<string,any>={spotify:'https://open.spotify.com/artist/5PtQjgcTbbH0ufnHVtVpVW',instagram:'https://instagram.com/pedromelomusic',youtube:'https://youtube.com/c/opedromelo',twitch:'https://twitch.tv/peteontheradio',whatsapp:'https://wa.me/351969535193?text=Ol%C3%A1%20Pedro!%20Gostava%20de%20saber%20mais%20sobre%20as%20aulas%20de%20guitarra.',pedro:'https://open.spotify.com/artist/5PtQjgcTbbH0ufnHVtVpVW',pete:'https://twitch.tv/peteontheradio',giants:'',crowdfunding:'',requestsOpen:true};
export function db(){const d=(env as any).DB as D1Database;if(!d)throw Error('Database unavailable');return d}
export async function live(){const rows=await db().prepare('SELECT key,value FROM settings').all<{key:string,value:string}>();const map=Object.fromEntries(rows.results.map(r=>[r.key,JSON.parse(r.value)]));return {settings:{...defaults,...map.links,requestsOpen:map.requestsOpen??true},now:map.now??{song:'',artist:''}}}
export async function admin(){const user=await getChatGPTUser();const allowed=(env as any).ADMIN_EMAIL?.trim().toLowerCase();return !!(allowed&&user?.email.toLowerCase()===allowed)}
export function json(data:any,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
export function sameOrigin(r:Request){return r.headers.get('origin')===new URL(r.url).origin}
export async function save(key:string,value:any){return db().prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,JSON.stringify(value)).run()}
