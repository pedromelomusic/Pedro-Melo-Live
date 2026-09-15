"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { defaultLinks } from './catalog';
const Context = createContext<any>(null);
export function Site({ children, active }: {
    children: React.ReactNode;
    active: string;
}) { const [lang, L] = useState('pt'), [live, S] = useState<any>(null), [online, O] = useState(false), [loaded, D] = useState(false); const eventId = useSearchParams().get('event') || ''; useEffect(() => { L(localStorage.getItem('language') || 'pt'); const event = eventId; let alive = true; const refresh = async () => { try {
    const r = await fetch('/api/live' + (event ? '?event=' + encodeURIComponent(event) : ''));
    if (!r.ok)
        throw Error();
    const next = await r.json();
    if (alive) {
        S(next);
        O(true);
    }
}
catch {
    if (alive)
        O(false);
}
finally {
    if (alive)
        D(true);
} }; refresh(); const id = setInterval(refresh, 5000); return () => { alive = false; clearInterval(id); }; }, [eventId]); useEffect(() => { document.documentElement.lang = lang; }, [lang]); const href = (path: string) => path + (eventId ? '?event=' + encodeURIComponent(eventId) : ''); function track(event: string) { if (live?.session?.id)
    fetch('/api/metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: live.session.id, event }), keepalive: true }).catch(() => { }); } const viewed = useState(() => new Set<string>())[0]; useEffect(() => { if (!live?.session?.id)
    return; const key = live.session.id + active; if (viewed.has(key))
    return; viewed.add(key); track('view:' + active); if (eventId && active === '/')
    track('qr_open'); }, [live?.session?.id, active, eventId]); const t = (a: string, b: string) => lang === 'pt' ? a : b; const links = { ...defaultLinks, ...live?.settings }; const navigation = [['/', 'Ao vivo', 'Live'], ['/projetos', 'Projetos', 'Projects'], ['/aulas', 'Aulas de guitarra', 'Guitar lessons']]; return <Context.Provider value={{ lang, t, live, online, loaded, links, href, track }}><header className="top"><a className="brand" href={href("/")}>PM <span>PEDRO MELO <b>LIVE</b></span></a><button className="language" onClick={() => { const next = lang === 'pt' ? 'en' : 'pt'; L(next); localStorage.setItem('language', next); }} aria-label={t('Mudar idioma', 'Change language')}>{lang === 'pt' ? '● PT / EN' : 'PT / EN ●'}</button><nav aria-label={t('Navegação principal', 'Main navigation')}>{navigation.map(([url, pt, en]) => <a key={url} aria-current={active === url ? 'page' : undefined} href={href(url)}>{t(pt, en)}</a>)}</nav></header><main>{children}</main><footer><span>© {new Date().getFullYear()} Pedro Melo Live</span><a href={href("/apoio")}>{t("Deixar uma tip","Leave a tip")}</a><a href={href("/comunidade")}>{t("Ficar por perto", "Stay in touch")}</a><a href="/admin">{t('Área do artista', 'Artist area')}</a></footer></Context.Provider>; }
export function useSite() { return useContext(Context); }
export function SocialLink({ id, children }: {
    id: string;
    children: React.ReactNode;
}) { const { links, t, track } = useSite(); return links[id] ? <a className="link" href={links[id]} onClick={() => track("click:" + id)}>{children}<span aria-hidden="true">↗</span></a> : <span className="link muted">{children}<small>{t('Em breve', 'Coming soon')}</small></span>; }
export function Socials() { const { t } = useSite(); return <section className="follow"><h2>{t('A música não acaba aqui.', 'The music doesn’t end here.')}</h2><div>{['Spotify', 'Instagram', 'YouTube', 'Twitch'].map(n => <SocialLink key={n} id={n.toLowerCase()}>{n}</SocialLink>)}</div></section>; }
