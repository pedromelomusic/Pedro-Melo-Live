import { db, json, sameOrigin, sessionById } from '../../data';
import { consentPolicy, consentText, integrationConfig, hash, limit, retention, metricQuery, enqueueQueries } from '../../operations';
export async function GET() { return json({ channels: integrationConfig().channels, policy: consentPolicy, text: consentText, days: retention.subscriptions }); }
export async function POST(r: Request) {
    if (!sameOrigin(r))
        return json({ error: 'origin' }, 403);
    try {
        const raw = await r.text();
        if (raw.length > 2000)
            return json({ error: 'size' }, 413);
        let b: any;
        try {
            b = JSON.parse(raw);
        }
        catch {
            return json({ error: 'invalid' }, 400);
        }
        if (!b || !await limit(r, 'subscription', 5))
            return json({ error: 'rate' }, 429);
        const d = db();
        if (b.action === 'withdraw') {
            if (typeof b.token !== 'string' || !/^[a-f0-9]{64}$/.test(b.token))
                return json({ error: 'invalid' }, 400);
            const token = await hash(b.token);
            const previous = await d.prepare("SELECT channel,contact FROM subscriptions WHERE token_hash=?").bind(token).first<{
                channel: string; contact: string;
            }>();
            if (previous) {
                const matches=(await d.prepare('SELECT id FROM subscriptions WHERE channel=? AND contact=?').bind(previous.channel,previous.contact).all<{id:string}>()).results;
                await d.batch([
                    d.prepare('DELETE FROM outbox WHERE subscription_id IN(SELECT id FROM subscriptions WHERE channel=? AND contact=?)').bind(previous.channel,previous.contact),
                    d.prepare('DELETE FROM contact_challenges WHERE subscription_id IN (SELECT id FROM subscriptions WHERE channel=? AND contact=?)').bind(previous.channel,previous.contact),
                    d.prepare('DELETE FROM subscriptions WHERE channel=? AND contact=?').bind(previous.channel,previous.contact),
                    ...matches.flatMap(row=>enqueueQueries('communication_opt_out',{subscriptionId:row.id},'withdraw:'+row.id))
                ]);
            }
            return json({ ok: true });
        }
        if (b.website)
            return json({ error: 'invalid' }, 400);
        if (b.consent !== true || b.policy !== consentPolicy || !integrationConfig().channels.includes(b.channel) || typeof b.contact !== 'string' || b.contact.length > 254 || !['pt', 'en'].includes(b.language))
            return json({ error: 'invalid' }, 400);
        const contact = b.channel==='whatsapp'?b.contact.trim():b.contact.trim().toLowerCase();
        const valid = b.channel === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) : b.channel === 'whatsapp' ? /^\+[1-9]\d{7,14}$/.test(contact) : /^@?[A-Za-z0-9_.]{1,30}$/.test(contact);
        if (!valid)
            return json({ error: 'contact' }, 400);
        if (typeof b.sessionId !== 'string' || !await sessionById(b.sessionId))
            return json({ error: 'missing_session' }, 400);
        const verification=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-',''); const id = crypto.randomUUID(), token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', ''), now = Date.now();
        await d.batch([d.prepare('INSERT INTO subscriptions(id,channel,contact,session_id,created,expires,policy,token_hash) VALUES (?,?,?,?,?,?,?,?)').bind(id, b.channel, contact, b.sessionId, now, now + retention.subscriptions * 86400000, consentPolicy + ':' + b.language, await hash(token)), metricQuery(b.sessionId, 'consent:' + b.channel), db().prepare('INSERT INTO contact_challenges(id,subscription_id,token_hash,expires) VALUES (?,?,?,?)').bind(id,id,await hash(verification),now+86400000), ...enqueueQueries('verification_requested', {id,channel:b.channel,language:b.language,verificationUrl:'https://pedro-melo-live.peteontheradio.chatgpt.site/confirmar#token='+verification},'verification:'+id,id)]);
        return json({ ok: true, withdrawToken: token, verificationPending:true });
    }
    catch {
        return json({ error: 'unavailable' }, 503);
    }
}
