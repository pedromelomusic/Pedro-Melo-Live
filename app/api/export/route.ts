import { admin, db, json, sessionById } from '../../data';
// Native downloads stream bounded pages from D1; no accumulated browser Blob.
export async function GET(r: Request) {
    if (!await admin())
        return json({ error: 'forbidden' }, 403);
    const u = new URL(r.url), scope = u.searchParams.get('sessionId') || 'all', kind = u.searchParams.get('kind') || 'requests';
    if (!['requests', 'backup'].includes(kind) || (scope !== 'all' && !await sessionById(scope)))
        return json({ error: 'invalid' }, 400);
    const snapshot = Date.now(), d = db(), where = 'created<?' + (scope === 'all' ? '' : ' AND session_id=?'), params = scope === 'all' ? [snapshot] : [snapshot, scope];
    const total = await d.prepare('SELECT COUNT(*) AS n FROM requests WHERE ' + where).bind(...params).first<{
        n: number;
    }>();
    const encoder = new TextEncoder();
    let cancelled = false;
    async function* rows(table: string, columns: string, filter: string, values: any[]) { let cursor = 0; while (!cancelled) {
        const result = await d.prepare('SELECT rowid AS _cursor,' + columns + ' FROM ' + table + ' WHERE rowid>? AND ' + filter + ' ORDER BY rowid LIMIT 1000').bind(cursor, ...values).all<any>();
        if (!result.results.length)
            break;
        for (const row of result.results) {
            cursor = row._cursor;
            delete row._cursor;
            yield row;
        }
    } }
    async function* output() {
        yield '{"version":"0.6","snapshot":' + snapshot + ',"scope":' + JSON.stringify(scope) + ',';
        let count = 0;
        if (kind === 'backup') {
            for (const [table, columns] of [['songs', '*'], ['sessions', '*'], ['session_songs', '*'], ['metrics', '*']] as const) {
                yield JSON.stringify(table) + ':[';
                let first = true;
                for await (const row of rows(table, columns, '1=1', [])) {
                    yield (first ? '' : ',') + JSON.stringify(row);
                    first = false;
                }
                yield '],';
            }
            yield '"settings":' + JSON.stringify((await d.prepare("SELECT key,value FROM settings WHERE key IN ('links','active_session')").all()).results) + ',';
        }
        yield '"requests":[';
        for await (const row of rows('requests', 'id,song,song_id AS songId,session_id AS sessionId,name,created,status', where, params)) {
            yield (count ? ',' : '') + JSON.stringify(row);
            count++;
        }
        if (count !== total?.n)
            throw Error('Data changed during export. Retry.');
        yield '],"count":' + count + ',"complete":true}';
    }
    const iterator = output();
    const stream = new ReadableStream({ async pull(controller) { try {
            const next = await iterator.next();
            if (next.done)
                controller.close();
            else
                controller.enqueue(encoder.encode(next.value));
        }
        catch (e) {
            controller.error(e);
        } }, async cancel() { cancelled = true; await iterator.return(undefined); } });
    return new Response(stream, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="pedro-melo-' + kind + '-' + (scope === 'all' ? 'all' : scope.replace(/[^a-zA-Z0-9-]/g, '')) + '-' + snapshot + '.json"', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
