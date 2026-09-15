import { admin, db, json } from '../../data';
export async function GET() { if (!await admin())
    return json({ error: 'forbidden' }, 403); const now = Date.now(), encoder = new TextEncoder(); let cursor = 0, first = true, done = false; return new Response(new ReadableStream({ async pull(controller) { try {
        if (done) {
            controller.close();
            return;
        }
        const rows = (await db().prepare('SELECT rowid AS cursor,id,channel,contact,session_id AS sessionId,created,expires,policy FROM subscriptions WHERE rowid>? AND created<? AND expires>? ORDER BY rowid LIMIT 1000').bind(cursor, now, now).all<any>()).results;
        let text = first ? '[' : '';
        for (const row of rows) {
            cursor = row.cursor;
            delete row.cursor;
            text += (first ? '' : ',') + JSON.stringify(row);
            first = false;
        }
        if (rows.length < 1000) {
            text += ']';
            done = true;
        }
        controller.enqueue(encoder.encode(text));
    }
    catch (e) {
        controller.error(e);
    } } }), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="pedro-melo-consents-' + now + '.json"', 'Cache-Control': 'no-store' } }); }
