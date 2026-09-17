"use client";
import {AnalyticsPanel} from './analytics-panel';
import {useAdmin} from './language';

import { useMemo, useState } from 'react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { qrcodegen } from '@/vendor/qrcodegen';
const names: Record<string, string> = { concert: 'Concerto / Concert', busking: 'Rua / Busking', twitch: 'Twitch' };
export function EventPanel({ s, act, busy }: any) {
    const t = useAdmin();
    const [source, S] = useState(''), [strategy, T] = useState('append'), [copied, C] = useState(false);
    const qr = useMemo(() => qrcodegen.QrCode.encodeText(s.operations.eventUrl, qrcodegen.QrCode.Ecc.MEDIUM), [s.operations.eventUrl]), size = qr.size + 8;
    const path: string[] = [];
    for (let y = 0; y < qr.size; y++)
        for (let x = 0; x < qr.size; x++)
            if (qr.getModule(x, y))
                path.push(`M${x + 4},${y + 4}h1v1h-1z`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="white"/><path d="${path.join(' ')}" fill="black"/></svg>`;
    function download() { const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); const a = document.createElement('a'); a.href = url; a.download = 'pedro-melo-qr-' + s.session.id + '.svg'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    const selected = s.sessions.find((v: any) => v.id === source);
    return <section id="event-tools"><p className="eyebrow">{t("UM PALCO, V\u00C1RIOS FORMATOS / ONE STAGE, MANY FORMATS")}</p><h2>{t("Modo e QR do evento / Event mode & QR")}</h2><label htmlFor="event-mode">{t("Onde vais tocar? / Where are you playing?")}</label><NativeSelect id="event-mode" value={s.session.mode} disabled={busy || s.session.archived} onChange={e => act({ action: 'session_mode', mode: e.target.value })}>{Object.entries(names).map(([id, name]) => <NativeSelectOption key={id} value={id}>{t(name)}</NativeSelectOption>)}</NativeSelect><div className="event-grid"><div className="qr-card"><svg role="img" aria-label={t("QR deste evento / Event QR")} viewBox={`0 0 ${size} ${size}`}><rect width="100%" height="100%" fill="white"/><path d={path.join(' ')} fill="black"/></svg><strong>{s.session.name}</strong><span>{t(names[s.session.mode])}</span></div><div><h3>{t("Um convite para este momento.","An invitation to this moment.")}</h3><p className="hint">{t("Este QR pertence sempre a este evento. Depois de terminar, deixa de aceitar pedidos. / This QR always belongs to this event. Requests close when it ends.")}</p><a className="event-url" href={s.operations.eventUrl}>{s.operations.eventUrl}</a><div className="row"><button onClick={download}>{t("Guardar QR / Save QR")}</button><button onClick={async () => {
            try {
                await navigator.clipboard.writeText(s.operations.eventUrl);
                C(true);
            }
            catch {
                C(false);
            }
        }}>{copied ? t("Copiado / Copied") : t("Copiar link / Copy link")}</button></div><p className="hint">{t("O link aponta para o site publicado. As novidades locais s\u00F3 aparecem depois de publicar a nova vers\u00E3o. / This link opens the published site. Local changes need a new release.")}</p></div></div><details><summary>{t("Copiar alinhamento de outra sess\u00E3o / Copy another setlist")}</summary><p className="hint">{t("Copia apenas as can\u00E7\u00F5es e a ordem. Os pedidos e estados deste evento s\u00E3o preservados. / Copies songs and order only. This event\u2019s requests and song states are preserved.")}</p><label htmlFor="copy-source">{t("Sess\u00E3o de origem / Source session")}</label><NativeSelect id="copy-source" value={source} onChange={e => S(e.target.value)}><NativeSelectOption value="">{t("Escolher sess\u00E3o / Choose session")}</NativeSelectOption>{s.sessions.filter((v: any) => v.id !== s.session.id).map((v: any) => <NativeSelectOption key={v.id} value={v.id}>{v.name}</NativeSelectOption>)}</NativeSelect><label htmlFor="copy-strategy">{t("Como copiar / How to copy")}</label><NativeSelect id="copy-strategy" value={strategy} onChange={e => T(e.target.value)}><NativeSelectOption value="append">{t("Acrescentar can\u00E7\u00F5es em falta / Append missing songs")}</NativeSelectOption><NativeSelectOption value="replace">{t("Substituir a ordem do alinhamento / Replace setlist order")}</NativeSelectOption></NativeSelect><button disabled={!selected || busy || s.session.archived} onClick={() => {
            if (strategy === 'replace' && !confirm(t("Substituir o alinhamento deste evento? / Replace this event\u2019s setlist?")))
                return;
            act({ action: 'setlist_copy', sourceId: source, sourceRevision: selected.revision, strategy });
        }}>{t("Copiar alinhamento / Copy setlist")}</button></details></section>;
}
export function OperationsPanel({ s, act, busy }: any) {
    const t = useAdmin();
    const o = s.operations;
    return <><AnalyticsPanel s={s}/><section id="operations"><h2>{t("Dados e liga\u00E7\u00F5es / Data & connections")}</h2><h3>{t("Reten\u00E7\u00E3o autom\u00E1tica / Automatic retention")}</h3><p>{t('Pedidos','Requests')}: {o.retention.requests} {t('dias','days')} · {t('Métricas','Metrics')}: {o.retention.metrics} {t('dias','days')} · {t('Consentimentos','Consents')}: {o.retention.subscriptions} {t('dias','days')}.</p><p className="hint">{t("A limpeza ocorre com as visitas ao site, no m\u00E1ximo uma vez por hora, em lotes. O agendamento externo permite limpar mesmo sem visitas. Repert\u00F3rio e alinhamentos s\u00E3o mantidos. / Cleanup runs on site traffic, at most hourly, in batches. External scheduling also works without visits. Catalogue and setlists are kept.")}</p><p className="hint">{t("Última limpeza", "Last cleanup")}: {o.lastCleanup ? new Date(o.lastCleanup).toLocaleString() : t("A aguardar / Pending")}</p><div className="row"><a className="download-button" href="/api/backup">{t("Exportar arquivo musical / Export music archive")}</a><button disabled={busy} onClick={() => act({ action: 'maintenance' })}>{t("Executar limpeza / Run cleanup")}</button></div><p className="hint">{t("O arquivo inclui repert\u00F3rio, letras, sess\u00F5es, alinhamentos, pedidos, m\u00E9tricas e links. Contactos e credenciais ficam separados. / The archive includes catalogue, lyrics, sessions, setlists, requests, metrics and links. Contacts and credentials are separate.")}</p><a className="download-button" href="/api/contacts-export">{t("Exportar consentimentos e contactos / Export consent & contacts")}</a><h3>{t("Integra\u00E7\u00F5es opcionais / Optional integrations")}</h3><div className="integration-grid"><article><strong>Make</strong><p>{o.integrations.make ? t("Configurado / Configured") : t("Por configurar / Not configured")}</p><small>{t("Consentimentos \u2192 automa\u00E7\u00F5es / Consent \u2192 automations")}</small></article><article><strong>Discord</strong><p>{o.integrations.discord ? t("Configurado / Configured") : t("Por configurar / Not configured")}</p><small>{t("Agora a tocar / Now playing")}</small></article><article><strong>WhatsApp · ManyChat</strong><p>Via Make</p><small>{t("Requer conta e configura\u00E7\u00E3o no fornecedor. / Requires a provider account and setup.")}</small></article></div><p className="hint">{t("Envio","Delivery")}: {o.integrations.enabled ? t("ativado / enabled") : t("desativado / disabled")}. {t("Canais com consentimento","Consent channels")}: {o.integrations.channels.join(', ') || t("nenhum / none")}{t(". Os pedidos de m\u00FAsicas nunca inscrevem pessoas em comunica\u00E7\u00F5es. / Song requests never subscribe anyone to communications.")}</p>{o.integrations.queue.map((q: any) => <p key={q.destination}>{q.destination}: {q.pending} {t("em fila", "queued")} · {q.failed || 0} {t("para rever", "need review")}</p>)}<button disabled={busy || !o.integrations.enabled} onClick={() => {
            if (confirm(t("Enviar agora as notifica\u00E7\u00F5es pendentes aos servi\u00E7os configurados? / Send queued notifications to configured services now?")))
                act({ action: 'dispatch' });
        }}>{t("Enviar fila / Send queue")}</button></section></>;
}
