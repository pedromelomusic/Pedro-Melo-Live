import { env } from 'cloudflare:workers';
import { advanceExport } from '../../export-jobs';
import { db, json } from '../../data';
import { hash, maintenance } from '../../operations';
import { dispatch } from '../../integration-delivery';
export async function POST(r: Request) { const secret = (env as any).MAINTENANCE_SECRET; if (typeof secret !== 'string' || secret.length < 32)
    return json({ error: 'not_configured' }, 503); if (await hash(r.headers.get('authorization') || '') !== await hash('Bearer ' + secret))
    return json({ error: 'forbidden' }, 403); await maintenance(); const pending = await db().prepare("SELECT id FROM export_jobs WHERE state='pending' AND expires>? ORDER BY snapshot LIMIT 1").bind(Date.now()).first<{
    id: string;
}>(); if (pending)
    await advanceExport(pending.id); return json({ ok: true, ...await dispatch() }); }
