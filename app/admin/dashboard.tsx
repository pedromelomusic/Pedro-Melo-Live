"use client";
import {RepertoireTable} from "./repertoire-table";
import {UsagePanel} from "./usage-panel";
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {ContentPanel} from './content-panel';
import {TipsPanel} from './tips-panel';
import {RestorePanel} from './restore-panel';
import {useAdmin} from './language';

import { useEffect, useRef, useState } from 'react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Checkbox } from '@/components/ui/checkbox';
import { defaultLinks, Song } from '../catalog';
import { ExportPanel } from './export-panel';
import { EventPanel, OperationsPanel } from './operations-panels';
import { SessionsPanel, SetlistPanel, ImportPanel, RequestsPanel } from './session-panels';
const stateNames: Record<string, string> = { available: 'Disponível / Available', reserved: 'Reservada / Reserved', playing: 'A tocar / Playing', played: 'Tocada / Played', hidden: 'Fora da lista / Hidden' };
const blank = { title: '', artist: '', lyrics: '', lyricsApproved: false };
export default function Dashboard() {
    const t = useAdmin(); const [area,Area]=useState("live");
    const [s, S] = useState<any>(null), [message, M] = useState(''), [busy, B] = useState(false), [edit, E] = useState<any>(null), [search, Q] = useState(''), [linksDraft, LD] = useState<any>(null), [selected, Selected] = useState('');
    const selectedRef = useRef('');
    async function refresh(id = selectedRef.current) { try {
        const r = await fetch('/api/manage' + (id ? '?sessionId=' + encodeURIComponent(id) : ''));
        if (!r.ok)
            throw Error();
        const next = await r.json();
        if (selectedRef.current === id)
            S(next);
    }
    catch {
        if (selectedRef.current === id)
            M(t("Liga\u00E7\u00E3o indispon\u00EDvel. / Connection unavailable."));
    } }
    useEffect(() => { refresh(); const timer = setInterval(() => refresh(), 5000); return () => clearInterval(timer); }, [selected]);
    function select(id: string) { selectedRef.current = id; Selected(id); S(null); E(null); M(''); }
    async function act(body: any) { B(true); try {
        const r = await fetch('/api/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: s.session.id, sessionRevision: s.session.revision, ...body }) });
        const result: any = await r.json();
        if (!r.ok) {
            M(result.message || ({ conflict: t("Os dados mudaram noutro dispositivo. Recarrega ou descarta a edi\u00E7\u00E3o antes de guardar. / Data changed on another device. Reload or discard before saving."), not_active: t("Ativa este concerto antes de come\u00E7ar a tocar. / Make this show live before playing."), archived: t("Este concerto est\u00E1 arquivado. / This show is archived."), duplicate_song: t("Esta can\u00E7\u00E3o j\u00E1 est\u00E1 no repert\u00F3rio. / This song already exists.") } as any)[result.error] || t("N\u00E3o foi guardado. Tenta novamente. / Not saved. Please retry."));
            await refresh();
            return null;
        }
        M(t("Guardado / Saved"));
        await refresh();
        return result;
    }
    catch {
        M(t("N\u00E3o foi guardado. Tenta novamente. / Not saved. Please retry."));
        return null;
    }
    finally {
        B(false);
    } }
    function change(song: any, status: string) { return act({ action: 'song_state', id: song.id, status }); }
    function download(data: any, name: string) { const u = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u); }
    return <main className="admin"><a href="/">← Pedro Melo Live</a><h1>{t("O teu palco","Your stage")}</h1><a className="textlink" href="/admin/palco">{t("Modo Palco →","Stage Mode →")}</a><a className="textlink" href="/admin/gestao">{t("Gestão avançada →","Advanced management →")}</a><p className="current-event">{s?.session?.name}</p><p role="status">{message}</p>{!s?<p>{t("A carregar…","Loading…")}</p>:<Tabs value={area} onValueChange={Area}><TabsList className="admin-tabs" aria-label={t("Áreas do painel","Dashboard areas")}><TabsTrigger value="live">{t("No palco","On stage")}</TabsTrigger><TabsTrigger value="events">{t("Eventos","Events")}</TabsTrigger><TabsTrigger value="catalog">{t("Repertório","Catalogue")}</TabsTrigger><TabsTrigger value="tips">{t("Tips","Tips")}</TabsTrigger><TabsTrigger value="content">{t("Conteúdos","Content")}</TabsTrigger><TabsTrigger value="data">{t("Dados e ligações","Data & connections")}</TabsTrigger></TabsList><TabsContent value="live" forceMount className="admin-panel"><section><h2>{s.session.name} · {t("Agora a tocar", "Now Playing")}</h2><p>{s.now.song || t("Entre can\u00E7\u00F5es / Between songs")} {s.now.artist}</p><button disabled={busy || s.session.archived || !s.now.song} onClick={() => act({ action: 'break' })}>{t("Terminar / Intervalo \u00B7 Finish / Break")}</button>{s.activeSessionId === s.session.id && <a href="/letra">{t("Ver letra p\u00FAblica / View public lyrics \u2192")}</a>}</section>
<section><h2>{t("Ranking deste concerto / Show ranking")}</h2><p className="hint">{t("Contagem por can\u00E7\u00E3o em todos os pedidos deste concerto, incluindo os j\u00E1 fechados. / Counts every request for each song in this show, including closed requests.")}</p>{!s.ranking.length ? <p>{t("Ainda sem pedidos / No requests yet")}</p> : <ol className="ranking">{s.ranking.map((r: any) => { const song = s.songs.find((v: any) => v.id === r.songId); return <li key={r.key}><div><strong>{r.title}</strong><p>{r.artist} · {r.pending}{t("pendentes / pending")}</p></div><b>{r.total}</b><small>{r.organic} {t("pedidos","requests")} + {r.extraVotes} {t("votos por tips","tip votes")}</small>{song && <button disabled={busy || s.session.archived || song.inSetlist} onClick={() => act({ action: 'setlist_add', id: song.id })}>{t("+ Alinhamento / Setlist")}</button>}</li>; })}</ol>}</section>
<SetlistPanel key={'setlist-' + s.session.id} s={s} act={act} change={change} busy={busy}/>
<RequestsPanel key={'requests-' + s.session.id} s={s} act={act} busy={busy} change={change} message={M}/></TabsContent><TabsContent value="events" forceMount className="admin-panel"><SessionsPanel s={s} select={select} act={act} busy={busy}/>
<EventPanel key={s.session.id} s={s} act={act} busy={busy}/></TabsContent><TabsContent value="catalog" forceMount className="admin-panel"><section><h2>{t("Repert\u00F3rio deste concerto / Show repertoire")}</h2><p className="hint">{t("Estados e alinhamento pertencem a este concerto. T\u00EDtulo, artista e letra s\u00E3o partilhados pelo repert\u00F3rio geral. / States and setlist belong to this show. Title, artist and lyrics are shared across the catalogue.")}</p><div className="row"><button disabled={s.session.archived || busy} onClick={() => E({ ...blank })}>{t("Adicionar can\u00E7\u00E3o / Add song")}</button><button disabled={s.session.archived || busy} onClick={() => act({ action: 'session_sync' })}>{t("Trazer novas do repert\u00F3rio geral / Add missing catalogue songs")}</button><button onClick={() => download(s.songs, 'pedro-melo-repertoire-' + s.session.id + '.json')}>{t("Exportar repert\u00F3rio / Export repertoire")}</button></div><label htmlFor="search">{t("Procurar t\u00EDtulo ou artista / Search title or artist")}<input id="search" value={search} onChange={e => Q(e.target.value)}/></label>
        {edit && <form className="editor" onSubmit={async (e) => { e.preventDefault(); if (await act({ action: 'song_save', song: edit }))
            E(null); }}><h3>{edit.id ? t("Editar can\u00E7\u00E3o / Edit song") : t("Nova can\u00E7\u00E3o / New song")}</h3><label>{t("T\u00EDtulo / Title")}<input required maxLength={140} value={edit.title} onChange={e => E({ ...edit, title: e.target.value })}/></label><label>{t("Artista / Artist")}<input required maxLength={140} value={edit.artist} onChange={e => E({ ...edit, artist: e.target.value })}/></label><label htmlFor="lyrics">{t("Letra / Lyrics")}</label><textarea id="lyrics" rows={10} maxLength={30000} value={edit.lyrics} onChange={e => E({ ...edit, lyrics: e.target.value })}/><label className="checkline" htmlFor="lyricsApproved"><Checkbox id="lyricsApproved" checked={!!edit.lyricsApproved} onCheckedChange={v => E({ ...edit, lyricsApproved: v === true })}/><span>{t("Tenho autoriza\u00E7\u00E3o para mostrar esta letra ao p\u00FAblico. / I have permission to display these lyrics publicly.")}</span></label><button disabled={busy || s.session.archived}>{t("Guardar can\u00E7\u00E3o / Save song")}</button><button type="button" onClick={() => E(null)}>{t("Cancelar / Cancel")}</button></form>}
        <RepertoireTable key={s.session.id} s={s} search={search} busy={busy} edit={E} act={act} change={change}/></section>
<ImportPanel key={'import-' + s.session.id} s={s} act={act} busy={busy}/></TabsContent><TabsContent value="tips" forceMount className="admin-panel"><TipsPanel s={s} act={act} busy={busy}/></TabsContent><TabsContent value="content" forceMount className="admin-panel"><ContentPanel s={s} act={act} busy={busy}/>
<section><h2>Links</h2><button onClick={() => LD(Object.fromEntries(Object.keys(defaultLinks).map(k => [k, s.settings[k] || ''])))}>{t("Editar links / Edit links")}</button>{linksDraft && <form onSubmit={async (e) => { e.preventDefault(); if (await act({ action: 'links', links: linksDraft }))
            LD(null); }}>{Object.keys(defaultLinks).map(key => <label key={key}>{key}<input type="url" value={linksDraft[key]} onChange={e => LD({ ...linksDraft, [key]: e.target.value })} placeholder="https://"/></label>)}<button disabled={busy}>{t("Guardar links / Save links")}</button><button type="button" onClick={() => LD(null)}>{t("Cancelar / Cancel")}</button></form>}</section></TabsContent><TabsContent value="data" forceMount className="admin-panel"><UsagePanel/><RestorePanel/>
<ExportPanel sessionId={s.session.id}/>
<OperationsPanel s={s} act={act} busy={busy}/>
<section><h2>{t("Dados deste concerto / Show data")}</h2><p>Exporta antes de apagar. Só os pedidos de {s.session.name}{t("ser\u00E3o eliminados. Repert\u00F3rio e outros concertos s\u00E3o mantidos. / Export first. Only requests for this show will be deleted.")}</p><button disabled={busy || s.session.archived} onClick={() => { if (window.confirm(t("Apagar definitivamente todos os pedidos deste concerto? / Permanently delete all requests for this show?")))
            act({ action: 'clear' }); }}>{t("Apagar pedidos deste concerto / Delete show requests")}</button></section></TabsContent></Tabs>}</main>;
}
