import { db, json, sameOrigin, sessionById } from '../../data';
import { limit, metricQuery } from '../../operations';
const allowed = ['view:/projetos/pedro','view:/projetos/giants','view:/projetos/pete','view:/apoio','view:/', 'view:/projetos', 'view:/aulas', 'view:/letra', 'view:/comunidade', 'qr_open', 'click:spotify', 'click:instagram', 'click:youtube', 'click:twitch', 'click:whatsapp', 'click:pedro', 'click:pete', 'click:giants', 'click:crowdfunding'];
export async function POST(r: Request) { if (!sameOrigin(r))
    return json({ error: 'origin' }, 403); try {
    const raw = await r.text();
    if (raw.length > 500)
        return json({ error: 'size' }, 413);
    const b = JSON.parse(raw);
    if (typeof b.sessionId !== 'string' || b.sessionId.length > 80 || !allowed.includes(b.event))
        return json({ error: 'invalid' }, 400);
    if (!await sessionById(b.sessionId))
        return json({ error: 'missing' }, 404);
    if (!await limit(r, 'metrics', 60))
        return json({ error: 'rate' }, 429);
    await metricQuery(b.sessionId, b.event).run();
    return json({ ok: true });
}
catch {
    return json({ error: 'unavailable' }, 503);
} }
