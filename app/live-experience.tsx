"use client";
import {useEffect, useRef} from 'react';
import {useSite} from './site';
export type FeaturedOriginal = {title:string; artist:string; url:string};
export type ReceivedRequest = {id:string; sessionId:string; title:string; artist:string; featuredOriginal:FeaturedOriginal|null};
export function safeMusicUrl(value:unknown) {
  if (typeof value !== 'string' || !value) return null;
  try {const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password ? url.href : null;} catch {return null;}
}
export function SocialChannels() {
  const {links,t,track}=useSite();
  const channels=[['instagram','Instagram'],['spotify','Spotify'],['youtube','YouTube'],['twitch','Twitch'],['discord','Discord'],['whatsapp','WhatsApp']];
  const available=channels.filter(([key])=>safeMusicUrl(links[key]) && !(key==='whatsapp' && links[key]==='https://wa.me/pedromelomusic'));
  if (!available.length) return null;
  return <div className="live-social-links" role="group" aria-label={t('Segue a música','Follow the music')}>{available.map(([key,label])=><a key={key} onClick={()=>track("click:"+key)} href={safeMusicUrl(links[key])!} target="_blank" rel="noopener noreferrer">{label}<span className="sr-only">{t(' (abre noutro separador)',' (opens in a new tab)')}</span> ↗</a>)}</div>;
}
export function EventContext() {
  const {live,loaded,online,t,lang,links,track}=useSite(), event=live?.session;
  let date='';
  if (/^\d{4}-\d{2}-\d{2}$/.test(event?.date||'')) {
    const parsed=new Date(event.date+'T12:00:00Z');
    if (!Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0,10)===event.date) date=new Intl.DateTimeFormat(lang==='pt'?'pt-PT':'en',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(parsed);
  }
  const status=!loaded?t('A ligar ao evento…','Connecting to the event…'):!online?t('A restabelecer ligação…','Reconnecting…'):live?.eventMissing?t('Evento não encontrado','Event not found'):!event?t('Entre concertos','Between shows'):event.archived?t('Este evento já terminou','This event has ended'):!event.isActive?t('Este evento ainda não está ao vivo','This event is not live yet'):live.settings.requestsOpen?t('AO VIVO · Pedidos abertos','LIVE · Requests open'):t('AO VIVO · Pedidos em pausa','LIVE · Requests paused');
  return <section className="live-context" aria-label={t('O evento','The event')}>
    <p className="live-context-status" role="status">{status}</p>
    {event && <><strong>{event.name}</strong>{event.venue&&<span>{event.venue}</span>}{(event.city||date)&&<span>{[event.city,date].filter(Boolean).join(' · ')}</span>}<small>{event.mode==='busking'?t('Música na rua','Street music'):event.mode==='twitch'?t('Transmissão na Twitch','Twitch stream'):t('Concerto','Concert')}</small></>}
    {!event&&loaded&&online&&!live?.eventMissing&&<p>{t('Entretanto, descobre a minha música e fica por perto.','Meanwhile, discover my music and stay in touch.')}</p>}
    {event?.mode==='twitch'&&safeMusicUrl(links.twitch)&&<a onClick={()=>track("click:twitch")} href={safeMusicUrl(links.twitch)!} target="_blank" rel="noopener noreferrer">{t('Abrir a transmissão na Twitch','Open the Twitch stream')} ↗</a>}
  </section>;
}
export function RequestReceipt({request}:{request:ReceivedRequest}) {
  const {t,href,track}=useSite(), heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus();},[request.id]);
  const featured=request.featuredOriginal;
  return <section className="request-receipt" aria-labelledby="request-received">
    <h2 id="request-received" ref={heading} tabIndex={-1}>{t('Pedido recebido','Request received')}</h2>
    <p className="received-song"><strong>{request.title}</strong><span>{request.artist}</span></p>
    <p>{t('O teu pedido está confirmado. Vou tentar encaixá-lo no concerto; não é uma garantia de que seja tocado.','Your request is confirmed. I’ll try to fit it into the show; this does not guarantee it will be played.')}</p>
    <div className="receipt-option"><h3>{t('Apoiar','Support')}</h3><p>{t('Pedir músicas é gratuito. Uma tip é opcional e não é necessária para o pedido ser aceite.','Song requests are free. A tip is optional and is not needed for your request to be accepted.')}</p><a className="live-action" onClick={()=>track('click:support')} href={'/apoio?event='+encodeURIComponent(request.sessionId)+'&request='+encodeURIComponent(request.id)}>{t('Deixar uma tip','Leave a tip')}</a></div>
    {featured?.title&&featured.artist&&safeMusicUrl(featured.url)&&<div className="receipt-option featured-original"><h3>{t('Enquanto esperas…','While you wait…')}</h3><p>{t('Conhece uma música minha','Discover a song of mine')}</p><strong>{featured.title}</strong><span>{featured.artist}</span><a className="live-action" onClick={()=>track("click:featured-original")} href={safeMusicUrl(featured.url)!} target="_blank" rel="noopener noreferrer">{t('Ouvir a música','Listen to the song')} ↗<span className="sr-only">{t(' (abre noutro separador)',' (opens in a new tab)')}</span></a></div>}
  </section>;
}
