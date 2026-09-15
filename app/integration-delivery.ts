import { db } from './data';
import { integrationConfig } from './operations';
// Disabled by default. An external scheduler or Pedro must explicitly run delivery.
// Receivers must deduplicate X-Event-ID: a timeout can happen after acceptance.
export async function dispatch() {
    const c = integrationConfig();
    if (!c.dispatch)
        return { enabled: false, sent: 0 };
    const d = db(), now = Date.now();
    const rows = (await d.prepare('SELECT * FROM outbox WHERE attempts<8 AND next_attempt<=? AND lease<? ORDER BY created LIMIT 10').bind(now, now).all<any>()).results;
    let sent = 0, failed = 0;
    for (const row of rows) {
        const endpoint = row.destination === 'make' ? c.make : c.discord;
        if (!endpoint)
            continue;
        const lease = Date.now() + 60000;
        const claim = await d.prepare('UPDATE outbox SET lease=? WHERE id=? AND lease<?').bind(lease, row.id, Date.now()).run();
        if (!claim.meta.changes)
            continue;
        try {
            let payload = JSON.parse(row.payload);
            if (row.subscription_id) {
                const subscription = await d.prepare('SELECT id,channel,contact,created,expires,policy FROM subscriptions WHERE id=? AND expires>?').bind(row.subscription_id, Date.now()).first();
                if (!subscription) {
                    await d.prepare('DELETE FROM outbox WHERE id=? AND lease=?').bind(row.id, lease).run();
                    continue;
                }
                if(row.event==='communication_opt_in'&&!await d.prepare('SELECT id FROM contact_challenges WHERE subscription_id=? AND confirmed=1').bind(row.subscription_id).first()){await d.prepare('DELETE FROM outbox WHERE id=?').bind(row.id).run();continue;}
            if(row.event==='verification_requested'&&!await d.prepare('SELECT id FROM contact_challenges WHERE subscription_id=? AND expires>? AND confirmed=0').bind(row.subscription_id,Date.now()).first()){await d.prepare('DELETE FROM outbox WHERE id=?').bind(row.id).run();continue;}
            payload = { ...payload, subscription };
            }
            const body = row.destination === 'discord' ? { content: ('♫ ' + String(payload.song || 'Entre canções') + ' — ' + String(payload.artist || '') + '\n' + String(payload.url || '')).slice(0, 1900), allowed_mentions: { parse: [] } } : { id: row.id, event: row.event, created: row.created, payload };
            const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Event-ID': row.id }, body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(5000) });
            await r.body?.cancel();
            if (!r.ok)
                throw Error('Remote rejection');
            await d.prepare('DELETE FROM outbox WHERE id=? AND lease=?').bind(row.id, lease).run();
            sent++;
        }
        catch {
            await d.prepare('UPDATE outbox SET attempts=attempts+1,next_attempt=?,lease=0 WHERE id=? AND lease=?').bind(Date.now() + Math.min(3600000, 60000 * 2 ** row.attempts), row.id, lease).run();
            failed++;
        }
    }
    return { enabled: true, sent, failed };
}
