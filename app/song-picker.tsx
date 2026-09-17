"use client";
import {useMemo, useRef, useState} from 'react';
import {useSite} from './site';
import {SongArtworkThumbnail} from './song-artwork-thumbnail';
import {discoverSongs, discoveryOptions, EMPTY_FILTERS, indexSongs, normalizeSongText, PAGE_SIZE, surpriseSong} from './song-discovery';
import type {DiscoveryFilters, DiscoverySong} from './song-discovery';
export {normalizeSongText} from './song-discovery';

export function SongPicker({songs, value, onChange, disabled, loading = false, offline = false, paused = false}: {
  songs: DiscoverySong[]; value: string; onChange: (id: string) => void; disabled: boolean; loading?: boolean; offline?: boolean; paused?: boolean;
}) {
  const {t, lang} = useSite();
  const [query, setQuery] = useState(''), [filters, setFilters] = useState({...EMPTY_FILTERS});
  const [exploring, setExploring] = useState(false), [browsing, setBrowsing] = useState(false), [popular, setPopular] = useState(false);
  const [page, setPage] = useState(0), [suggestionId, setSuggestionId] = useState('');
  const search = useRef<HTMLInputElement>(null), results = useRef<HTMLDivElement>(null);
  const index = useMemo(() => indexSongs(songs), [songs]);
  const options = useMemo(() => Object.fromEntries((Object.keys(EMPTY_FILTERS) as (keyof DiscoveryFilters)[]).map(field => [field, discoveryOptions(index, field)])) as Record<keyof DiscoveryFilters, [string, string][]>, [index]);
  const filtered = useMemo(() => discoverSongs(index, query, filters, popular), [index, query, filters, popular]);
  const active = !!normalizeSongText(query) || Object.values(filters).some(Boolean) || browsing || popular;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1));
  const visible = active ? filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE) : [];
  const chosen = index.find(row => row.song.id === value)?.song;
  const suggestion = index.find(row => row.song.id === suggestionId)?.song;
  const blocked = disabled || loading || paused;
  const labels: Record<keyof DiscoveryFilters, string> = {artist: t('Artista', 'Artist'), genre: t('Género', 'Genre'), decade: t('Década', 'Decade'), language: t('Idioma', 'Language')};
  function optionLabel(field: keyof DiscoveryFilters, label: string) {
    if (field === 'language') {
      try { return new Intl.DisplayNames([lang === 'pt' ? 'pt-PT' : 'en'], {type: 'language'}).of(label) || label; } catch { return label; }
    }
    return field === 'decade' ? t('Anos ', '') + label + t('', 's') : label;
  }
  function reset() { setQuery(''); setFilters({...EMPTY_FILTERS}); setPopular(false); setBrowsing(false); setPage(0); search.current?.focus(); }
  function suggest() { setSuggestionId(surpriseSong(index.map(row => row.song), suggestionId)?.id || ''); }
  function move(next: number) { setPage(next); results.current?.focus(); }
  return <div className="song-picker discovery" aria-busy={loading}>
    <label htmlFor="song-search">{t('Procurar música ou artista', 'Search for a song or artist')}</label>
    <input ref={search} id="song-search" type="search" value={query} onChange={e => {setQuery(e.target.value); setPage(0); setBrowsing(false);}} placeholder={t('Procurar música ou artista…', 'Search for a song or artist…')} disabled={disabled || loading} aria-controls="song-results"/>
    {offline && <p role="status">{t('Ligação indisponível. A tentar novamente…', 'Connection unavailable. Retrying…')}</p>}
    {loading ? <p role="status">{t('A carregar o repertório…', 'Loading the repertoire…')}</p> : !index.length ? !offline && <p role="status">{t('Sem músicas disponíveis para pedir neste momento.', 'No songs available to request right now.')}</p> : <>
      {paused && <p role="status">{t('Pedidos em pausa. Podes explorar o repertório.', 'Requests are paused. You can explore the repertoire.')}</p>}
      <div className="discovery-actions">
        {Object.values(options).some(items => items.length > 1) && <button type="button" aria-expanded={exploring} aria-controls="discovery-filters" onClick={() => setExploring(!exploring)}>{t('Explorar', 'Explore')}</button>}
        <button type="button" onClick={() => {setBrowsing(true); setPopular(false); setPage(0);}}>{t('Ver músicas', 'Browse songs')}</button>
        {index.some(row => (row.song.requestCount || 0) > 0) && <button type="button" aria-pressed={popular} onClick={() => {setPopular(!popular); setPage(0);}}>{t('Mais pedidas', 'Most requested')}</button>}
        <button type="button" className="discovery-surprise" onClick={suggest} disabled={blocked}>🎲 {t('Surpreende-me', 'Surprise me')}</button>
      </div>
      {exploring && <div className="discovery-filters" id="discovery-filters">{(Object.keys(labels) as (keyof DiscoveryFilters)[]).filter(field => options[field].length > 1 || filters[field]).map(field => <label key={field} htmlFor={'discover-' + field}>{labels[field]}<select id={'discover-' + field} value={filters[field]} onChange={e => {setFilters({...filters, [field]: e.target.value}); setPage(0);}}>
        <option value="">{t('Todos', 'All')}</option>
        {filters[field] && !options[field].some(([key]) => key === filters[field]) && <option value={filters[field]}>{t('Indisponível', 'Unavailable')}</option>}
        {options[field].map(([key, label]) => <option key={key} value={key}>{optionLabel(field, label)}</option>)}
      </select></label>)}</div>}
      {active && <button type="button" className="discovery-clear" onClick={reset}>{t('Limpar pesquisa e filtros', 'Clear search and filters')}</button>}
      {suggestion && <aside className="song-suggestion" aria-label={t('Sugestão de música', 'Song suggestion')}>
        <div aria-live="polite"><p>{t('Que tal esta?', 'How about this one?')}</p><strong>{suggestion.title}</strong><span>{suggestion.artist}</span></div>
        <div className="discovery-actions"><button type="button" disabled={blocked} onClick={() => {onChange(suggestion.id); document.getElementById('name')?.focus();}}>{t('Quero esta', 'Choose this song')}</button><button type="button" onClick={suggest} disabled={blocked || index.length < 2}>{t('Outra 🎲', 'Another 🎲')}</button></div>
      </aside>}
      {popular && <p className="picker-count">{t('Pedidos recebidos neste evento, sem votos de tips.', 'Requests received at this event, excluding tip votes.')}</p>}
      <p className="picker-count" role="status">{active ? (filtered.length ? `${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} / ${filtered.length}` : t('Nenhuma música encontrada. Experimenta outra pesquisa ou limpa os filtros.', 'No songs found. Try another search or clear the filters.')) : t('Pesquisa, explora ou deixa a sorte escolher.', 'Search, explore or let chance choose.')}</p>
      <div id="song-results" ref={results} tabIndex={-1} role="group" aria-label={t('Resultados de músicas', 'Song results')} className={visible.length ? 'song-options' : undefined}>
        {visible.map(song => <button type="button" key={song.id} className={'song-option ' + (song.id === value ? 'chosen' : '')} aria-pressed={song.id === value} disabled={blocked} onClick={() => onChange(song.id)}><SongArtworkThumbnail id={song.id}/><span className="song-option-copy"><strong>{song.title}</strong><small>{song.artist}</small></span><span aria-hidden="true">{song.id === value ? '✓' : '+'}</span></button>)}
      </div>
      {active && filtered.length > PAGE_SIZE && <nav className="discovery-actions" aria-label={t('Páginas de músicas', 'Song pages')}><button type="button" disabled={currentPage === 0} onClick={() => move(currentPage - 1)}>{t('Anterior', 'Previous')}</button><button type="button" disabled={(currentPage + 1) * PAGE_SIZE >= filtered.length} onClick={() => move(currentPage + 1)}>{t('Ver mais', 'Show more')}</button></nav>}
      {chosen && <p className="chosen-song" role="status">{t('A tua escolha:', 'Your choice:')} <strong>{chosen.title} — {chosen.artist}</strong></p>}
    </>}
  </div>;
}
