import {cleanupRestores} from './backups';
import { cleanupExports } from './export-jobs';
import { env } from 'cloudflare:workers';
import { db, json, sessionById } from './data';
export const modes = ['concert', 'busking', 'twitch'];
export const retention = { requests: 90, metrics: 365, subscriptions: 180, outbox: 7 };
export const consentPolicy = 'music-updates-v1';
export const consentText = { pt: 'Quero receber novidades de Pedro Melo sobre concertos, música e aulas neste canal. Posso retirar o consentimento a qualquer momento através do meu link privado.', en: 'I want to receive Pedro Melo updates about shows, music and lessons on this channel. I can withdraw consent at any time using my private link.' };
export function eventUrl(id: string) { return 'https://pedro-melo-live.peteontheradio.chatgpt.site/?event=' + encodeURIComponent(id); }
export async function hash(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(n => n.toString(16).padStart(2, '0')).join(''); }
export function metricQuery(sessionId: string, event: string) { return db().prepare('INSERT INTO metrics(day,session_id,event,count) VALUES (?,?,?,1) ON CONFLICT(day,session_id,event) DO UPDATE SET count=count+1').bind(new Date().toISOString().slice(0, 10), sessionId, event); }
export async function limit(r: Request, kind: string, max: number) { const now = Date.now(), window = Math.floor(now / 60000), key = await hash(kind + ':' + (r.headers.get('cf-connecting-ip') || 'local') + ':' + window); const row = await db().prepare('INSERT INTO rate_buckets(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key, now + 120000).first<{
    count: number;
}>(); return !!row && row.count <= max; }
// At most one worker wins the hourly lease. Work is bounded and resumes next hour.
export async function maintenance(force = false) {
    const d = db(), now = Date.now();
    await d.prepare("INSERT OR IGNORE INTO settings(key,value) VALUES ('maintenance_last','0')").run();
    const claim = await d.prepare("UPDATE settings SET value=? WHERE key='maintenance_last' AND CAST(value AS INTEGER)<?").bind(String(now), now - (force ? 1000 : 3600000)).run();
    if (!claim.meta.changes)
        return;
    const day = 86400000;
    await d.batch([
        d.prepare("DELETE FROM requests WHERE id IN (SELECT id FROM requests WHERE created<? AND NOT EXISTS(SELECT 1 FROM export_jobs WHERE state='pending' AND expires>?) ORDER BY created LIMIT 5000)").bind(now - retention.requests * day, now),
        d.prepare('DELETE FROM metrics WHERE rowid IN (SELECT rowid FROM metrics WHERE day<? LIMIT 5000)').bind(new Date(now - retention.metrics * day).toISOString().slice(0, 10)),
        d.prepare('DELETE FROM outbox WHERE id IN (SELECT id FROM outbox WHERE subscription_id IN (SELECT id FROM subscriptions WHERE expires<=?) OR created<? LIMIT 5000)').bind(now, now - retention.outbox * day),
        d.prepare('DELETE FROM subscriptions WHERE id IN (SELECT id FROM subscriptions WHERE expires<=? LIMIT 5000)').bind(now),
        d.prepare('DELETE FROM rate_buckets WHERE key IN (SELECT key FROM rate_buckets WHERE expires<? LIMIT 5000)').bind(now),
        d.prepare("INSERT INTO settings(key,value) VALUES ('maintenance_completed',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(now))
    ]);
    await cleanupExports(); await cleanupRestores(); await d.prepare("DELETE FROM contact_challenges WHERE id IN (SELECT id FROM contact_challenges WHERE (expires<? AND confirmed=0) OR NOT EXISTS(SELECT 1 FROM subscriptions WHERE subscriptions.id=contact_challenges.subscription_id) LIMIT 5000)").bind(now).run();
}
export function integrationConfig() { const e = env as any; const make = safeEndpoint(e.MAKE_WEBHOOK_URL, 'make'), discord = safeEndpoint(e.DISCORD_WEBHOOK_URL, 'discord'); const channels = make ? (String(e.COMMUNICATION_CHANNELS || '').split(',').filter((v: string) => ['email', 'whatsapp', 'instagram'].includes(v))) : []; return { make, discord, channels: [...new Set(channels)] as string[], dispatch: e.INTEGRATIONS_ENABLED === 'true' }; }
function safeEndpoint(raw: unknown, kind: string) { try {
    if (typeof raw !== 'string' || !raw)
        return null;
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.port || u.username || u.password || u.hash)
        return null;
    if (kind === 'make' && !/^hook\.[a-z0-9-]+\.make\.com$/.test(u.hostname))
        return null;
    if (kind === 'discord' && !(u.hostname === 'discord.com' && /^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(u.pathname)))
        return null;
    return u.href;
}
catch {
    return null;
} }
export function enqueueQueries(event: string, payload: any, id: string, subscriptionId: string | null = null) { const c = integrationConfig(), out: D1PreparedStatement[] = []; for (const destination of ['make', 'discord'] as const) {
    if (!c[destination] || (destination === 'discord' && event !== 'now_playing'))
        continue;
    out.push(db().prepare('INSERT OR IGNORE INTO outbox(id,destination,event,payload,subscription_id,created) VALUES (?,?,?,?,?,?)').bind(destination + ':' + id, destination, event, JSON.stringify(payload), subscriptionId, Date.now()));
} return out; }
export async function operationsState(sessionId: string) { const d = db(), c = integrationConfig(); const [metrics, queue, last] = await Promise.all([d.prepare('SELECT event,SUM(count) AS count FROM metrics WHERE session_id=? GROUP BY event ORDER BY event').bind(sessionId).all(), d.prepare('SELECT destination,COUNT(*) AS pending,SUM(CASE WHEN attempts>=8 THEN 1 ELSE 0 END) AS failed FROM outbox GROUP BY destination').all(), d.prepare("SELECT value FROM settings WHERE key='maintenance_completed'").first<{
        value: string;
    }>()]); return { eventUrl: eventUrl(sessionId), metrics: metrics.results, retention, lastCleanup: last ? Number(last.value) : null, integrations: { make: !!c.make, discord: !!c.discord, channels: c.channels, enabled: c.dispatch, queue: queue.results } }; }
export async function copySetlist(b: any) {
    if (b.action !== 'setlist_copy')
        return null;
    const target = await sessionById(b.sessionId || ''), source = await sessionById(b.sourceId || '');
    if (!target || !source || target.id === source.id || !['append', 'replace'].includes(b.strategy))
        return json({ error: 'invalid' }, 400);
    if (target.archived || target.revision !== b.sessionRevision || source.revision !== b.sourceRevision)
        return json({ error: 'conflict' }, 409);
    const d = db(), guard = 'EXISTS(SELECT 1 FROM sessions WHERE id=? AND revision=?) AND EXISTS(SELECT 1 FROM sessions WHERE id=? AND revision=?)', p = [target.id, target.revision, source.id, source.revision], queries: D1PreparedStatement[] = [];
    // Copy order only. Existing availability, reservations and now-playing are preserved.
    if (b.strategy === 'replace')
        queries.push(d.prepare('UPDATE session_songs SET in_setlist=0 WHERE session_id=? AND ' + guard).bind(target.id, ...p));
    queries.push(d.prepare('INSERT OR IGNORE INTO session_songs(session_id,song_id,status,position) SELECT ?,song_id,\'available\',0 FROM session_songs WHERE session_id=? AND in_setlist=1 AND ' + guard).bind(target.id, source.id, ...p));
    queries.push(d.prepare('WITH ordered AS (SELECT song_id,ROW_NUMBER() OVER(ORDER BY position,song_id) AS n FROM session_songs WHERE session_id=? AND in_setlist=1), base AS MATERIALIZED (SELECT COALESCE(MAX(position),0) AS pos FROM session_songs WHERE session_id=? AND in_setlist=1) UPDATE session_songs SET in_setlist=1,position=(SELECT pos FROM base)+(SELECT n FROM ordered WHERE ordered.song_id=session_songs.song_id) WHERE session_id=? AND in_setlist=0 AND song_id IN(SELECT song_id FROM ordered) AND ' + guard).bind(source.id, target.id, target.id, ...p));
    queries.push(d.prepare('UPDATE sessions SET revision=revision+1 WHERE id=? AND ' + guard).bind(target.id, ...p));
    const result = await d.batch(queries);
    return json(result.at(-1)?.meta.changes ? { ok: true } : { error: 'conflict' }, result.at(-1)?.meta.changes ? 200 : 409);
}
