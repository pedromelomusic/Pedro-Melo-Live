"use client";
import {useAdmin} from './language';

import { useEffect, useRef, useState } from 'react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
export function SessionsPanel({ s, select, act, busy }: any) { const t = useAdmin(); const [name, N] = useState(''), [date, D] = useState(''); return <section><h2>{t("Concertos e sess\u00F5es / Shows & sessions")}</h2><label htmlFor="session">{t("Concerto no painel / Show in dashboard")}</label><NativeSelect id="session" value={s.session.id} disabled={busy} onChange={e => select(e.target.value)}>{s.sessions.map((v: any) => <NativeSelectOption key={v.id} value={v.id}>{v.name}{v.date ? ' · ' + v.date : ''}{v.id === s.activeSessionId ? t(" \u00B7 AO VIVO / LIVE") : ''}{v.archived ? t(" \u00B7 Arquivado / Archived") : ''}</NativeSelectOption>)}</NativeSelect><p className="session-badge">{s.session.id === s.activeSessionId ? t("Este \u00E9 o concerto vis\u00EDvel ao p\u00FAblico. / This show is visible to the audience.") : t("Est\u00E1s a preparar ou consultar este concerto. O p\u00FAblico n\u00E3o muda at\u00E9 o ativares. / You are preparing or reviewing this show. The audience only changes when you activate it.")}</p><div className="row"><button disabled={busy || !!s.session.archived || s.session.id === s.activeSessionId} onClick={() => act({ action: 'session_activate', expectedActiveId: s.activeSessionId })}>{t("Ativar para o p\u00FAblico / Make live")}</button><button disabled={busy} onClick={() => { if (!s.session.archived && s.session.id === s.activeSessionId && !confirm(t("Encerrar o concerto atual e pausar pedidos? / End the live show and pause requests?")))
    return; act({ action: 'session_archive', archived: !s.session.archived }); }}>{s.session.archived ? t("Reabrir / Reopen") : t("Encerrar e arquivar / End & archive")}</button></div><form onSubmit={async (e) => { e.preventDefault(); const result = await act({ action: 'session_create', name, date }); if (result) {
    N('');
    D('');
    select(result.sessionId);
} }}><h3>{t("Preparar novo concerto / Prepare a new show")}</h3><label>{t("Nome / Name")}<input required maxLength={100} value={name} onChange={e => N(e.target.value)} placeholder={t("Concerto de sexta-feira", "Friday show")}/></label><label>{t("Data (opcional) / Date (optional)")}<input type="date" value={date} onChange={e => D(e.target.value)}/></label><button disabled={busy}>{t("Criar concerto / Create show")}</button></form></section>; }
export function SetlistPanel({ s, act, busy, change }: any) { const t = useAdmin(); const list = s.songs.filter((v: any) => v.inSetlist).sort((a: any, b: any) => a.position - b.position || a.id.localeCompare(b.id)); const [draft, D] = useState<any>(null); const ids = draft?.ids || list.map((v: any) => v.id); const move = (i: number, delta: number) => { const next = [...ids]; [next[i], next[i + delta]] = [next[i + delta], next[i]]; D({ ids: next, revision: draft?.revision ?? s.session.revision }); }; return <section><h2>{t("Alinhamento / Setlist")}</h2><p className="hint">{t("A ordem \u00E9 privada. Adicionar ao alinhamento n\u00E3o bloqueia pedidos; reservar bloqueia. / The order is private. Adding a song does not block requests; reserving does.")}</p>{!ids.length ? <p>{t("Ainda sem alinhamento. Adiciona can\u00E7\u00F5es a partir do repert\u00F3rio ou ranking. / Add songs from the repertoire or ranking.")}</p> : <ol className="setlist">{ids.map((id: string, i: number) => { const song = s.songs.find((v: any) => v.id === id); return song ? <li key={id}><span className="set-number">{i + 1}</span><div><strong>{song.title}</strong><p>{song.artist} · {t(({available:"Disponível / Available",reserved:"Reservada / Reserved",playing:"A tocar / Playing",played:"Tocada / Played",hidden:"Fora da lista / Hidden"} as any)[song.status]||song.status)}</p><div className="row"><button aria-label={t('Subir ', 'Move up ') + song.title} disabled={busy || s.session.archived || i === 0} onClick={() => move(i, -1)}>↑</button><button aria-label={t('Descer ', 'Move down ') + song.title} disabled={busy || s.session.archived || i === ids.length - 1} onClick={() => move(i, 1)}>↓</button><button disabled={busy || s.session.archived || !!draft} onClick={() => act({ action: 'setlist_remove', id })}>{t("Retirar / Remove")}</button><button disabled={busy || s.session.archived || s.activeSessionId !== s.session.id || song.status === 'playing' || !!draft} onClick={() => change(song, 'playing')}>{t("Tocar / Play")}</button></div></div></li> : null; })}</ol>}{draft && <div><button disabled={busy || s.session.archived} onClick={async () => { if (await act({ action: 'setlist_order', ids: draft.ids, sessionRevision: draft.revision }))
    D(null); }}>{t("Guardar ordem / Save order")}</button><button onClick={() => D(null)}>{t("Descartar ordem / Discard order")}</button></div>}</section>; }
export function ImportPanel({ s, act, busy }: any) { const t = useAdmin(); const [text, T] = useState(''), [preview, P] = useState<any>(null), [error, E] = useState(''), [loading, L] = useState(false); const generation = useRef(0); async function previewImport() { const current = ++generation.current; L(true); E(''); try {
    const r = await fetch('/api/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'import_preview', text }) });
    const v: any = await r.json();
    if (current !== generation.current)
        return;
    if (!r.ok) {
        E(v.message || t("N\u00E3o foi poss\u00EDvel validar / Could not validate"));
        P(null);
    }
    else
        P({ ...v, revision: s.session.revision });
}
catch {
    E(t("Falha de liga\u00E7\u00E3o / Connection failed"));
}
finally {
    L(false);
} } function update(value: string) { generation.current++; T(value); P(null); E(''); } ; return <section><h2>{t("Importa\u00E7\u00E3o em lote / Bulk import")}</h2><p className="hint">{t("At\u00E9 100 can\u00E7\u00F5es por lote. CSV com cabe\u00E7alho title,artist e letra opcional lyrics, ou uma lista JSON do repert\u00F3rio exportado. Duplicados s\u00E3o ignorados e as letras existentes s\u00E3o preservadas. Letras novas ficam privadas at\u00E9 as autorizar. / Up to 100 songs. CSV with title,artist and optional lyrics, or an exported JSON list. Duplicates are skipped; existing lyrics are preserved. New lyrics stay private until approved.")}</p><label>{t("Escolher ficheiro CSV ou JSON / Choose file")}<input type="file" accept=".csv,.json,text/csv,application/json" disabled={loading || busy || s.session.archived} onChange={async (e) => { const file = e.target.files?.[0]; if (!file)
    return; if (file.size > 500000) {
    E(t("Ficheiro demasiado grande (500 KB) / File too large"));
    return;
} update(await file.text()); }}/></label><label htmlFor="import-text">{t("Ou colar conte\u00FAdo / Or paste content")}</label><textarea id="import-text" rows={6} value={text} disabled={busy || s.session.archived} onChange={e => update(e.target.value)} placeholder={'title,artist\nCanção do Engate,Tiago Bettencourt'}/><button disabled={!text.trim() || loading || busy || s.session.archived} onClick={previewImport}>{loading ? t("A validar\u2026 / Validating\u2026") : t("Pr\u00E9-visualizar importa\u00E7\u00E3o / Preview import")}</button><p role="status">{error}</p>{preview && <div className="import-preview"><p>{preview.newSongs} {t("novas", "new")} · {preview.existingSongs} {t("já existentes", "existing")} · {preview.duplicateRows} {t("repetidas no ficheiro", "repeated in file")}</p><ul>{preview.entries.map((v: any) => <li key={v.id}>{v.title} — {v.artist} <small>{v.existing ? t("J\u00E1 existe / Exists") : t("Nova / New")}</small></li>)}</ul><button disabled={busy || loading || s.session.archived} onClick={async () => { if (await act({ action: 'import_commit', text, sessionRevision: preview.revision })) {
    update('');
} }}>{t("Confirmar importa\u00E7\u00E3o / Confirm import")}</button></div>}</section>; }
export function RequestsPanel({ s, act, busy, change, message }: any) {
    const t = useAdmin();
    const [paged, P] = useState<any>(null), [loading, L] = useState(false);
    const page = paged || { requests: s.requests, ...s.requestPage };
    async function more() { L(true); try {
        const r = await fetch('/api/manage?view=export&sessionId=' + encodeURIComponent(s.session.id) + '&cursor=' + encodeURIComponent(page.nextCursor));
        if (!r.ok)
            throw Error();
        const next: any = await r.json();
        P({ ...next, requests: [...page.requests, ...next.requests] });
    }
    catch {
        message(t("N\u00E3o foi poss\u00EDvel carregar a p\u00E1gina. Tenta novamente. / Could not load page. Retry."));
    }
    finally {
        L(false);
    } }
    return <section><h2>{t("Pedidos deste concerto", "Show requests")} ({s.requestPage.total})</h2><div className="row"><button disabled={busy || s.session.archived} onClick={() => act({ action: 'pause', open: !s.settings.requestsOpen })}>{s.settings.requestsOpen ? t("Pausar / Pause") : t("Abrir / Open")}</button><a className="download-button" href={"/api/export?sessionId=" + encodeURIComponent(s.session.id)}>{t("Exportar este concerto / Export show")}</a><a className="download-button" href="/api/export?sessionId=all">{t("Exportar todos / Export all")}</a></div>{paged && <button onClick={() => P(null)}>{t("Voltar aos mais recentes / Back to latest")}</button>}<ul>{!page.requests.length ? <li>{t("Ainda sem pedidos / No requests yet")}</li> : page.requests.map((r: any) => { const song = s.songs.find((v: any) => v.id === r.songId); return <li key={r.id}><strong>{r.song}</strong><p>{r.name || t("An\u00F3nimo / Anonymous")} · {new Date(r.created).toLocaleString()} · {r.status === "played" ? t("Fechado", "Closed") : t("Pendente", "Pending")}</p>{song && <button disabled={busy || s.session.archived || song.status === 'playing' || song.status === 'reserved'} onClick={() => change(song, 'reserved')}>{t("Reservar / Reserve")}</button>}<button disabled={busy || s.session.archived} onClick={async () => { if (await act({ action: 'status', id: r.id, status: r.status === 'played' ? 'pending' : 'played' }))
        P(null); }}>{r.status === 'played' ? t("Reabrir / Reopen") : t("Fechar pedido / Close request")}</button></li>; })}</ul>{page.nextCursor && <button disabled={loading} onClick={more}>{loading ? t("A carregar\u2026 / Loading\u2026") : t("Mais 100 pedidos / Next 100 requests")}</button>}<p className="hint">{t("Mostrados / Showing")} {page.requests.length}{t("/")}{page.total}{". "}{t("O servidor gera o ficheiro por p\u00E1ginas; acompanha a transfer\u00EAncia no browser. / The server streams the file in pages; follow the download in your browser.")}</p></section>;
}
