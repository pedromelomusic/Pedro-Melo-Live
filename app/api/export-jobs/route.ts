import { admin, db, json, sameOrigin, sessionById } from '../../data';
import { startExport, exportStatus, advanceExport, downloadExport } from '../../export-jobs';
export async function GET(r: Request) { if (!await admin())
    return json({ error: 'forbidden' }, 403); const u = new URL(r.url), id = u.searchParams.get('id'); if (!id)
    return json({ jobs: (await db().prepare('SELECT id,scope,snapshot,total,count,state,expires,error FROM export_jobs WHERE expires>? ORDER BY snapshot DESC LIMIT 20').bind(Date.now()).all()).results }); if (u.searchParams.get('download') === '1')
    return await downloadExport(id) || json({ error: 'not_ready' }, 409); const job = await exportStatus(id); return job ? json(job) : json({ error: 'missing' }, 404); }
export async function POST(r: Request) { if (!sameOrigin(r) || !await admin())
    return json({ error: 'forbidden' }, 403); try {
    const raw = await r.text();
    if (raw.length > 500)
        return json({ error: 'size' }, 413);
    const b = JSON.parse(raw);
    if (b.action === 'start') {
        if (typeof b.scope !== 'string' || (b.scope !== 'all' && !await sessionById(b.scope)))
            return json({ error: 'invalid' }, 400);
        return json({ id: await startExport(b.scope) });
    }
    if (typeof b.id !== 'string' || !await exportStatus(b.id))
        return json({ error: 'missing' }, 404);
    if (b.action === 'advance')
        await advanceExport(b.id);
    else if (b.action === 'cancel')
        await db().prepare("UPDATE export_jobs SET state='cancelled',expires=? WHERE id=? AND state='pending'").bind(Date.now() + 180000, b.id).run();
    else
        return json({ error: 'invalid' }, 400);
    return json(await exportStatus(b.id));
}
catch {
    return json({ error: 'unavailable' }, 503);
} }
