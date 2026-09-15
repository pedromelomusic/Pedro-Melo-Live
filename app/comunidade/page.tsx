"use client";
import { useEffect, useState } from 'react';
import { Site, useSite, Socials } from '../site';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
export default function Page() { return <Site active="/comunidade"><Community /></Site>; }
function Community() { const { t, lang, live } = useSite(); const [config, C] = useState<any>(null), [channel, H] = useState(''), [contact, V] = useState(''), [consent, O] = useState(false), [message, M] = useState(''), [busy, B] = useState(false), [withdraw, W] = useState(''), [token, T] = useState(''); useEffect(() => { const fragment = new URLSearchParams(location.hash.slice(1)).get('withdraw'); if (fragment)
    T(fragment); fetch('/api/subscriptions').then(r => r.ok ? r.json() : Promise.reject()).then((v: any) => { C(v); H(v.channels[0] || ''); }).catch(() => M(t('Não foi possível carregar. Tenta novamente.', 'Could not load. Please retry.'))); }, []); async function send(action: string) { B(true); M(''); try {
    const r = await fetch('/api/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action === 'withdraw' ? { action, token } : { channel, contact, consent, policy: config.policy, language: lang, sessionId: live?.session?.id }) });
    const v: any = await r.json();
    if (!r.ok)
        throw Error();
    if (action === 'withdraw') {
        M(t('Consentimento retirado. O contacto foi removido deste site.', 'Consent withdrawn. Your contact was removed from this site.'));
        T('');
        history.replaceState(null, '', location.pathname + location.search);
    }
    else {
        W(location.origin + '/comunidade#withdraw=' + v.withdrawToken);
        O(false);
        V('');
        M(t('Preferência guardada. Aguarda a mensagem de confirmação e guarda o teu link privado abaixo.', 'Preference saved. Wait for the verification message and keep your private link below.'));
    }
}
catch {
    M(t('Não foi possível guardar. Verifica o contacto e tenta novamente.', 'Could not save. Check your contact and retry.'));
}
finally {
    B(false);
} } return <section className="subpage community"><p className="eyebrow">{t('DEPOIS DO CONCERTO', 'AFTER THE SHOW')}</p><h1>{t('A próxima nota.', 'The next note.')}<br /><em>{t('Mais perto.', 'A little closer.')}</em></h1><p className="lead">{t('Novas músicas, concertos e aulas. Tu escolhes se queres receber notícias.', 'New music, shows and lessons. You choose whether to hear from me.')}</p>{token ? <div className="contact-card"><h2>{t('Retirar consentimento', 'Withdraw consent')}</h2><p className="fine">{t('Remove o teu contacto deste site e cancela os envios ainda na fila. As ligações externas recebem o pedido de remoção quando a integração executar.', 'Removes your contact from this site and cancels queued sends. Connected services receive the removal request when the integration runs.')}</p><button className="primary" disabled={busy} onClick={() => send('withdraw')}>{t('Retirar o meu consentimento', 'Withdraw my consent')}</button></div> : config?.channels.length && !withdraw ? <form className="contact-card" onSubmit={e => { e.preventDefault(); send('subscribe'); }}><label htmlFor="channel">{t('Canal', 'Channel')}</label><NativeSelect id="channel" value={channel} onChange={e => { H(e.target.value); O(false); }}>{config.channels.map((v: string) => <NativeSelectOption key={v} value={v}>{v}</NativeSelectOption>)}</NativeSelect><label htmlFor="contact">{channel === 'whatsapp' ? t('Número com indicativo (+351…)', 'Number with country code (+351…)') : channel === 'instagram' ? 'Instagram @' : 'Email'}</label><input id="contact" required type={channel === 'email' ? 'email' : 'text'} maxLength={254} value={contact} onChange={e => V(e.target.value)}/><label className="checkline" htmlFor="communications"><Checkbox id="communications" checked={consent} onCheckedChange={v => O(v === true)}/><span>{config.text[lang]}</span></label><p className="fine">{t('Opcional e independente de pedir músicas. O contacto expira neste site ao fim de 180 dias.', 'Optional and independent of song requests. Your contact expires on this site after 180 days.')}</p><button className="primary" disabled={busy || !consent || !live?.session}>{t('Guardar preferência', 'Save preference')}</button></form> : !withdraw && config ? <p>{t('As novidades por mensagem estão a ser preparadas. Entretanto, encontra-me nas redes abaixo.', 'Message updates are being prepared. Meanwhile, find me on the channels below.')}</p> : null}<p role="status">{message}</p>{withdraw && <div className="contact-card"><strong>{t('O teu link privado para retirar consentimento', 'Your private withdrawal link')}</strong><a className="event-url" href={withdraw}>{withdraw}</a><p className="fine">{t('Guarda este link e não o partilhes.', 'Keep this link and do not share it.')}</p></div>}<Socials /></section>; }
