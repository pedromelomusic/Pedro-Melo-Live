import { env } from 'cloudflare:workers';
import { db } from './data';
const partSize = 5 * 1024 * 1024;
function bucket() { const b = (env as any).BUCKET as R2Bucket; if (!b)
    throw Error('Export storage unavailable'); return b; }
const objectKey = (id: string) => 'exports/' + id + '/complete.json';
export async function startExport(scope: string) { const d = db(), now = Date.now(); const pending = await d.prepare("SELECT COUNT(*) AS n FROM export_jobs WHERE state='pending' AND expires>?").bind(now).first<{
    n: number;
}>(); if ((pending?.n || 0) >= 3)
    throw Error('Finish or cancel another export first'); const filter = 'created<?' + (scope === 'all' ? '' : ' AND session_id=?'), p = scope === 'all' ? [now] : [now, scope]; const stats = await d.prepare('SELECT COUNT(*) AS n,COALESCE(MAX(rowid),0) AS upperRow FROM requests WHERE ' + filter).bind(...p).first<any>(); const id = crypto.randomUUID(), upload = await bucket().createMultipartUpload(objectKey(id), { httpMetadata: { contentType: 'application/json', contentDisposition: 'attachment; filename="pedro-melo-requests-' + id + '.json"' } }); try {
    await d.prepare('INSERT INTO export_jobs(id,scope,snapshot,total,upper_row,upload_id,expires) VALUES (?,?,?,?,?,?,?)').bind(id, scope, now, stats.n, stats.upperRow, upload.uploadId, now + 86400000).run();
}
catch (e) {
    await upload.abort();
    throw e;
} return id; }
export async function exportStatus(id: string) { return db().prepare('SELECT id,scope,snapshot,total,count,state,expires,error FROM export_jobs WHERE id=? AND expires>?').bind(id, Date.now()).first<any>(); }
export async function advanceExport(id: string) {
    const d = db(), b = bucket(), now = Date.now(), lease = now + 120000;
    const claim = await d.prepare("UPDATE export_jobs SET lease=? WHERE id=? AND state='pending' AND lease<? AND expires>?").bind(lease, id, now, now).run();
    if (!claim.meta.changes)
        return;
    const job = await d.prepare('SELECT * FROM export_jobs WHERE id=?').bind(id).first<any>();
    if (!job)
        return;
    const upload = b.resumeMultipartUpload(objectKey(id), job.upload_id);
    try {
        if (await b.head(objectKey(id))) {
            await d.prepare("UPDATE export_jobs SET state='ready',count=total,lease=0 WHERE id=? AND lease=? AND state='pending'").bind(id, lease).run();
            return;
        }
        const encoder = new TextEncoder();
        const previous = job.buffer_key ? await b.get(job.buffer_key) : null;
        if (job.buffer_key && !previous)
            throw Error('Temporary part missing');
        let content = previous ? new Uint8Array(await previous.arrayBuffer()) : encoder.encode(job.count ? '' : '{"version":"0.4","snapshot":' + job.snapshot + ',"scope":' + JSON.stringify(job.scope) + ',"requests":[');
        const append = (text: string) => { const bytes = encoder.encode(text), merged = new Uint8Array(content.length + bytes.length); merged.set(content); merged.set(bytes, content.length); content = merged; };
        let cursor = job.cursor, count = job.count, finished = false;
        const parts: R2UploadedPart[] = JSON.parse(job.parts);
        for (let page = 0; page < 4; page++) {
            const filter = 'rowid>? AND rowid<=? AND created<?' + (job.scope === 'all' ? '' : ' AND session_id=?'), p = job.scope === 'all' ? [cursor, job.upper_row, job.snapshot] : [cursor, job.upper_row, job.snapshot, job.scope];
            const rows = (await d.prepare('SELECT rowid AS _cursor,id,song,song_id AS songId,session_id AS sessionId,name,created,status FROM requests WHERE ' + filter + ' ORDER BY rowid LIMIT 1000').bind(...p).all<any>()).results;
            let text = '';
            for (const row of rows) {
                cursor = row._cursor;
                delete row._cursor;
                text += (count ? ',' : '') + JSON.stringify(row);
                count++;
            }
            append(text);
            if (rows.length < 1000) {
                finished = true;
                break;
            }
            if (content.length >= partSize)
                break;
        }
        if (finished) {
            if (count !== job.total)
                throw Error('Requests changed during export. Start again.');
            append('],"count":' + count + ',"complete":true}');
            while (content.length > partSize) {
                parts.push(await upload.uploadPart(parts.length + 1, content.slice(0, partSize)));
                content = content.slice(partSize);
            }
            parts.push(await upload.uploadPart(parts.length + 1, content));
            await upload.complete(parts);
            await d.prepare("UPDATE export_jobs SET state='ready',count=?,cursor=?,lease=0 WHERE id=? AND lease=? AND state='pending'").bind(count, cursor, id, lease).run();
        }
        else {
            let bufferKey = '';
            if (content.length >= partSize) {
                parts.push(await upload.uploadPart(parts.length + 1, content.slice(0, partSize)));
                content = content.slice(partSize);
            }
            if (content.length) {
                bufferKey = 'exports/' + id + '/buffer-' + lease;
                await b.put(bufferKey, content);
            }
            await d.prepare("UPDATE export_jobs SET count=?,cursor=?,parts=?,buffer_key=?,lease=0 WHERE id=? AND lease=? AND state='pending'").bind(count, cursor, JSON.stringify(parts), bufferKey, id, lease).run();
        }
        if (job.buffer_key)
            await b.delete(job.buffer_key);
    }
    catch (error) {
        console.error('Export job failed', error instanceof Error ? error.message : 'unknown');
        await d.prepare("UPDATE export_jobs SET state='failed',error='Export incomplete; start again.',lease=0 WHERE id=? AND lease=? AND state='pending'").bind(id, lease).run();
        try {
            await upload.abort();
        }
        catch { }
    }
}
export async function downloadExport(id: string) { const job = await exportStatus(id); if (!job || job.state !== 'ready')
    return null; const obj = await bucket().get(objectKey(id)); if (!obj)
    return null; return new Response(obj.body, { headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="pedro-melo-requests-' + id + '.json"', 'Cache-Control': 'no-store', 'Content-Length': String(obj.size) } }); }
export async function cleanupExports() { const d = db(), b = bucket(); const jobs = (await d.prepare('SELECT id,upload_id FROM export_jobs WHERE expires<=? LIMIT 5').bind(Date.now()).all<any>()).results; for (const job of jobs) {
    try {
        await b.resumeMultipartUpload(objectKey(job.id), job.upload_id).abort();
    }
    catch { }
    const objects = await b.list({ prefix: 'exports/' + job.id + '/', limit: 100 });
    if (objects.objects.length)
        await b.delete(objects.objects.map(o => o.key));
    if (!objects.truncated)
        await d.prepare('DELETE FROM export_jobs WHERE id=?').bind(job.id).run();
} }
