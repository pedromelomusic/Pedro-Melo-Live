export type DiscoverySong = {
  id: string; title: string; artist: string; status?: string;
  genre?: string; decade?: number | null; language?: string; requestCount?: number;
};
export type DiscoveryFilters = {artist: string; genre: string; decade: string; language: string};
export const EMPTY_FILTERS: DiscoveryFilters = {artist: '', genre: '', decade: '', language: ''};
export const PAGE_SIZE = 12;
export const normalizeSongText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
export function indexSongs(songs: DiscoverySong[]) {
  return songs.filter(s => !s.status || s.status === 'available').map(song => ({
    song, search: normalizeSongText(song.artist + ' ' + song.title),
    artist: normalizeSongText(song.artist), genre: normalizeSongText(song.genre || ''),
    decade: song.decade == null ? '' : String(song.decade), language: normalizeSongText(song.language || ''),
  })).sort((a, b) => a.song.artist.localeCompare(b.song.artist, 'pt', {sensitivity: 'base'}) || a.song.title.localeCompare(b.song.title, 'pt', {sensitivity: 'base'}) || a.song.id.localeCompare(b.song.id));
}
export type SongIndex = ReturnType<typeof indexSongs>;
export function discoveryOptions(index: SongIndex, field: keyof DiscoveryFilters) {
  const options = new Map<string, string>();
  for (const row of index) if (row[field] && !options.has(row[field])) options.set(row[field], String(row.song[field]));
  return [...options].sort((a, b) => a[1].localeCompare(b[1], 'pt', {numeric: true, sensitivity: 'base'}));
}
export function discoverSongs(index: SongIndex, query: string, filters: DiscoveryFilters, popular = false) {
  const needle = normalizeSongText(query);
  const rows = index.filter(row => row.search.includes(needle) &&
    Object.entries(filters).every(([field, value]) => !value || row[field as keyof DiscoveryFilters] === value) &&
    (!popular || (row.song.requestCount || 0) > 0));
  if (popular) rows.sort((a, b) => (b.song.requestCount || 0) - (a.song.requestCount || 0));
  return rows.map(row => row.song);
}
export function surpriseSong(songs: DiscoverySong[], previousId = '', random = Math.random) {
  const available = songs.filter(s => !s.status || s.status === 'available');
  const alternatives = available.filter(s => s.id !== previousId);
  const pool = alternatives.length ? alternatives : available;
  return pool.length ? pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] : undefined;
}
