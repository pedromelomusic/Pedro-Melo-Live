"use client";
import {useEffect,useRef,useState} from 'react';
import {useAdmin} from '../language';
import {stageFetch,stageLists,StageSong} from './model';
export default function Stage(){
  const t=useAdmin(),[state,S]=useState<any>(null),[ready,R]=useState(false),[readError,RE]=useState(false),[busy,B]=useState(false),[message,M]=useState(''),[query,Q]=useState(''),[limit,L]=useState(12);
  const lock=useRef(false),reading=useRef(false),generation=useRef(0),mounted=useRef(true);
  async function refresh(){
    if(reading.current)return;
    reading.current=true;const version=generation.current;
    try{const data=await stageFetch();if(mounted.current&&version===generation.current){S(data);R(true);RE(false);}}
    catch{if(mounted.current&&version===generation.current){R(false);RE(true);}}
    finally{reading.current=false;}
  }
  useEffect(()=>{mounted.current=true;void refresh();const timer=setInterval(()=>{if(!lock.current)void refresh();},5000);return()=>{mounted.current=false;generation.current++;clearInterval(timer);};},[]);
  const active=!!state?.activeSessionId&&state.activeSessionId===state.session.id&&!state.session.archived;
  async function act(command:object){
    if(lock.current||!ready||!active)return;
    lock.current=true;generation.current++;B(true);R(false);M('');
    try{
      await stageFetch({sessionId:state.session.id,sessionRevision:state.session.revision,...command});
      M(t('Guardado.','Saved.'));
    }catch(error){M(error instanceof Error&&error.message==='conflict'?t('Os dados mudaram. Confere o estado atualizado antes de tentar novamente.','Data changed. Check the refreshed state before trying again.'):t('Não foi possível confirmar a ação. Confere o estado atualizado antes de repetir.','The action could not be confirmed. Check the refreshed state before repeating.'));}
    finally{
      // Invalidate any older poll; a fresh read must enable controls again.
      try{const data=await stageFetch();if(mounted.current){S(data);R(true);RE(false);}}
      catch{if(mounted.current){R(false);RE(true);}}
      lock.current=false;if(mounted.current)B(false);
    }
  }
  const {setlist,next,repertoire}=stageLists(state?.songs||[]),disabled=busy||!ready||!active;
  const normalize=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const visible=repertoire.filter(s=>normalize(s.title+' '+s.artist).includes(normalize(query)));
  const play=(song:StageSong)=>act({action:'song_state',id:song.id,status:'playing'});
  const row=(song:StageSong)=><li key={song.id}><div><strong>{song.title}</strong><small>{song.artist}</small></div><button disabled={disabled||!['available','reserved'].includes(song.status)} aria-label={t('Tocar ','Play ')+song.title} onClick={()=>play(song)}>{song.status==='playing'?t('A tocar','Playing'):song.status==='played'?t('Tocada','Played'):song.status==='hidden'?t('Oculta','Hidden'):t('Tocar','Play')}</button></li>;
  return <main className="admin stage"><header><h1>{t('Modo Palco','Stage Mode')}</h1><a href="/admin">{t('Gestão completa →','Full management →')}</a></header>
    <div className="stage-feedback"><p role="status" aria-live="polite">{busy?t('A guardar…','Saving…'):readError?t('Ligação indisponível. Atualiza antes de agir.','Connection unavailable. Refresh before taking action.'):message}</p>
    {readError&&!busy&&<button onClick={()=>void refresh()}>{t('Tentar novamente','Try again')}</button>}</div>
    {!state?(!readError&&<p>{t('A carregar o concerto…','Loading the show…')}</p>):<>
      <section className="stage-controls"><h2>{active?state.session.name:t('Sem evento ativo','No active event')}</h2><p>{active?'LIVE':t('Ativa um evento na gestão completa.','Activate an event in full management.')}{readError&&!busy&&' · '+t('Estado por confirmar','State unconfirmed')}</p>
        <button className="stage-toggle" disabled={disabled} aria-pressed={!!state.settings.requestsOpen} onClick={()=>act({action:'pause',open:!state.settings.requestsOpen})}>{state.settings.requestsOpen?t('Pedidos abertos · Pausar','Requests open · Pause'):t('Pedidos pausados · Abrir','Requests paused · Open')}</button>
      </section>
      <section className="stage-now"><h2>{t('Agora a tocar','Now Playing')}</h2><strong>{active?(state.now.song||t('Intervalo','Break')):t('Sem música ao vivo','No live song')}</strong><p>{active&&state.now.artist}</p><div className="stage-actions"><button disabled={disabled||!state.now.song} onClick={()=>act({action:'break'})}>{t('Terminar / Intervalo','Finish / Break')}</button><button disabled={disabled||!next} onClick={()=>next&&play(next)}>{t('Próxima →','Next →')}{next&&<small>{next.title} — {next.artist}</small>}</button></div><p className="fine">{t('Tocar outra música termina a atual e fecha os seus pedidos, como na gestão completa.','Playing another song finishes the current one and closes its requests, as in full management.')}</p></section>
      {active&&<><div className="stage-columns"><section><h2>{t('Top 5 pedidos','Top 5 requests')}</h2><p className="fine">{t('Ranking do evento: pedidos + votos por tips, incluindo pedidos fechados.','Event ranking: requests + tip votes, including closed requests.')}</p><ol className="stage-list">{state.ranking.slice(0,5).map((r:any)=><li key={r.key}><div><strong>{r.title}</strong><small>{r.artist} · {r.total} {t('votos','votes')} · {r.pending} {t('pendentes','pending')}</small></div></li>)}</ol>{!state.ranking.length&&<p>{t('Ainda sem pedidos.','No requests yet.')}</p>}</section>
      <section><h2>{t('Pedidos recentes','Recent requests')}</h2><ul className="stage-list">{state.requests.slice(0,5).map((r:any)=><li key={r.id}><div><strong>{r.song}</strong><small>{r.name||t('Anónimo','Anonymous')} · {r.status==='played'?t('Fechado','Closed'):t('Pendente','Pending')}</small></div></li>)}</ul>{!state.requests.length&&<p>{t('Ainda sem pedidos.','No requests yet.')}</p>}</section></div>
      <section><h2>{t('Alinhamento','Setlist')}</h2>{!setlist.length?<p>{t('Sem alinhamento. Escolhe no repertório abaixo.','No setlist. Choose from the repertoire below.')}</p>:<ol className="stage-list">{setlist.slice(0,limit).map(row)}</ol>}{setlist.length>limit&&<button onClick={()=>L(limit+12)}>{t('Mais alinhamento','More setlist')}</button>}</section>
      <section><h2>{t('Repertório disponível','Available repertoire')}</h2><label htmlFor="stage-search">{t('Procurar música ou artista','Search song or artist')}</label><input id="stage-search" type="search" value={query} onChange={e=>{Q(e.target.value);L(12);}}/><ul className="stage-list">{visible.slice(0,limit).map(row)}</ul>{!visible.length&&<p>{t('Sem músicas correspondentes.','No matching songs.')}</p>}{visible.length>limit&&<button onClick={()=>L(limit+12)}>{t('Ver mais','Show more')}</button>}</section></>}
    </>}
  </main>;
}
