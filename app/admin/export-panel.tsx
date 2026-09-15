"use client";
import {useAdmin} from './language';

import { useEffect, useRef, useState } from 'react';
export function ExportPanel({ sessionId }: any) {
    const t = useAdmin();
    const [jobs, J] = useState<any[]>([]), [busy, B] = useState(false), [error, E] = useState('');
    const alive = useRef(true);
    async function command(body: any) {
        const r = await fetch('/api/export-jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok)
            throw Error();
        return r.json();
    }
    async function refresh() {
        const r = await fetch('/api/export-jobs');
        if (!r.ok)
            throw Error();
        const v: any = await r.json();
        if (alive.current)
            J(v.jobs);
        return v.jobs;
    }
    useEffect(() => {
        alive.current = true;
        let timer: ReturnType<typeof setTimeout>;
        async function poll() {
            try {
                const list = await refresh();
                const pending = list.find((v: any) => v.state === 'pending');
                if (pending) {
                    await command({ action: 'advance', id: pending.id });
                    await refresh();
                }
            }
            catch {
                if (alive.current)
                    E(t("N\u00E3o foi poss\u00EDvel atualizar. A tentar novamente. / Could not update. Retrying."));
            }
            finally {
                if (alive.current)
                    timer = setTimeout(poll, 2000);
            }
        }
        poll();
        return () => { alive.current = false; clearTimeout(timer); };
    }, []);
    async function start(scope: string) {
        B(true);
        E('');
        try {
            await command({ action: 'start', scope });
            await refresh();
        }
        catch {
            E(t("N\u00E3o foi poss\u00EDvel iniciar. Termina ou cancela as exporta\u00E7\u00F5es pendentes e tenta novamente. / Could not start. Finish or cancel pending exports and retry."));
        }
        finally {
            B(false);
        }
    }
    return <section id="exports"><h2>{t("Exporta\u00E7\u00F5es de grande volume / Large exports")}</h2><p className="hint">{t("O servidor prepara o ficheiro por lotes e guarda-o durante 24 horas. Mant\u00E9m este painel aberto para avan\u00E7ar; com agendamento externo, continua mesmo fechado. Podes voltar mais tarde e descarregar. / The server builds and stores the file for 24 hours. Keep this panel open to advance; with external scheduling it also runs while closed. Return later to download.")}</p><div className="row"><button disabled={busy} onClick={() => start(sessionId)}>{t("Preparar este evento / Prepare this event")}</button><button disabled={busy} onClick={() => start('all')}>{t("Preparar todos os pedidos / Prepare all requests")}</button></div><p role="status">{error}</p><ul>{jobs.map(job => <li key={job.id}><strong>{job.scope === 'all' ? t("Todos os eventos / All events") : job.scope === sessionId ? t("Este evento / This event") : t("Outro evento / Another event")}</strong><p>{job.count}{t("/")}{job.total} · {({ pending: t("A preparar / Preparing"), ready: t("Pronto / Ready"), failed: t("Falhou \u2014 volta a iniciar / Failed \u2014 start again"), cancelled: t("Cancelado / Cancelled") } as any)[job.state]}</p>{job.state === 'ready' && <a className="download-button" href={'/api/export-jobs?id=' + job.id + '&download=1'}>{t("Descarregar JSON / Download JSON")}</a>}{job.state === 'pending' && <button onClick={async () => {
                    try {
                        await command({ action: 'cancel', id: job.id });
                        await refresh();
                    }
                    catch {
                        E(t("N\u00E3o foi poss\u00EDvel cancelar / Could not cancel"));
                    }
                }}>{t("Cancelar / Cancel")}</button>}</li>)}</ul></section>;
}
