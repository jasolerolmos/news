export interface NewsItem { title: string; url: string; category: string; source: string }
export const SOURCES = [
  { id: 'abc', code: 'ABC', label: 'ABC', experimental: false },
  { id: 'elpais', code: 'ELPAIS', label: 'El País', experimental: false },
  { id: 'ideal', code: 'IDEAL', label: 'Ideal', experimental: false },
  { id: 'granadahoy', code: 'GRANADAHOY', label: 'Granada Hoy', experimental: false },
  { id: 'xataka', code: 'XATAKA', label: 'Xataka', experimental: false },
  { id: 'faz', code: 'FAZ', label: 'FAZ', experimental: true },
  { id: 'sueddeutsche', code: 'SZ', label: 'Süddeutsche', experimental: true },
] as const;
export type SourceId = typeof SOURCES[number]['id'];
export interface CacheEntry { items: NewsItem[]; fetchedAt: number }
export interface NewsView {
  selected: SourceId[];
  loaded: SourceId[];
  source: string;
  category: string;
  search: string;
  scrollY: number;
}
export interface NewsSession extends NewsView {
  version: 1;
  cache: Partial<Record<SourceId, CacheEntry>>;
}
export const CACHE_TTL = 30 * 60 * 1000;
const STORAGE_KEY = 'news:session:v1';
let memory: NewsSession | null = null;
let storageFailed = false;
const pending = new Map<SourceId, Promise<'updated' | 'empty' | 'failed'>>();
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isSourceId = (value: unknown): value is SourceId => SOURCES.some(source => source.id === value);
const sourceIds = (value: unknown): SourceId[] => Array.isArray(value) ? Array.from(new Set(value.filter(isSourceId))) : [];

export function defaultSession(): NewsSession {
  return { version: 1, cache: {}, selected: ['abc', 'elpais'], loaded: [], source: 'all', category: 'all', search: '', scrollY: 0 };
}

function isNewsItem(value: unknown): value is NewsItem {
  if (!isObject(value) || typeof value.title !== 'string' || typeof value.url !== 'string' || typeof value.category !== 'string' || typeof value.source !== 'string') return false;
  try { return ['https:', 'http:'].includes(new URL(value.url).protocol); } catch { return false; }
}

export function decodeSession(raw: string): NewsSession {
  const value: unknown = JSON.parse(raw);
  if (!isObject(value) || value.version !== 1) throw new Error('Invalid session');
  const result = defaultSession();
  result.selected = sourceIds(value.selected);
  result.loaded = sourceIds(value.loaded);
  result.source = typeof value.source === 'string' && (value.source === 'all' || SOURCES.some(source => source.code === value.source)) ? value.source : 'all';
  result.category = typeof value.category === 'string' ? value.category : 'all';
  result.search = typeof value.search === 'string' ? value.search : '';
  result.scrollY = typeof value.scrollY === 'number' && Number.isFinite(value.scrollY) && value.scrollY >= 0 ? value.scrollY : 0;
  if (isObject(value.cache)) {
    for (const { id, code } of SOURCES) {
      const entry = value.cache[id];
      if (isObject(entry) && typeof entry.fetchedAt === 'number' && Number.isFinite(entry.fetchedAt) && entry.fetchedAt > 0 && Array.isArray(entry.items) && entry.items.length <= 2000 && entry.items.every(isNewsItem) && entry.items.every(item => item.source === code)) {
        result.cache[id] = { fetchedAt: entry.fetchedAt, items: entry.items };
      }
    }
  }
  return result;
}

export function getSession(): NewsSession {
  if (memory) return memory;
  memory = defaultSession();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { memory = decodeSession(raw); }
      catch { window.sessionStorage.removeItem(STORAGE_KEY); }
    }
  } catch { storageFailed = true; }
  return memory;
}

function persist() {
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory)); storageFailed = false; }
  catch { storageFailed = true; }
}

export function saveView(view: NewsView) {
  memory = { ...getSession(), ...view };
  persist();
}
export function hasStorageError() { return storageFailed; }
export function isFresh(entry: CacheEntry | undefined, now = Date.now()) {
  return !!entry && now >= entry.fetchedAt && now - entry.fetchedAt < CACHE_TTL;
}

// A shared promise per source avoids duplicate requests during remounts or
// React Strict Mode. Requests may finish and populate the cache after leaving.
async function fetchSource(id: SourceId, fetcher: typeof fetch): Promise<'updated' | 'empty' | 'failed'> {
  const existing = pending.get(id);
  if (existing) return existing;
  const task = (async (): Promise<'updated' | 'empty' | 'failed'> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetcher(`/api/news/${id}`, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: unknown = await response.json();
      const code = SOURCES.find(source => source.id === id)!.code;
      if (!Array.isArray(data) || data.length > 2000 || !data.every(isNewsItem) || !data.every(item => item.source === code)) throw new Error('Invalid news response');
      const old = getSession();
      // An unexpectedly empty scrape must not erase previously useful data.
      if (data.length === 0 && old.cache[id]?.items.length) return 'empty';
      memory = { ...old, cache: { ...old.cache, [id]: { items: data, fetchedAt: Date.now() } } };
      persist();
      return data.length ? 'updated' : 'empty';
    } catch { return 'failed'; }
    finally { clearTimeout(timeout); }
  })();
  pending.set(id, task);
  try { return await task; } finally { pending.delete(id); }
}

export async function loadSources(ids: SourceId[], force = false, fetcher: typeof fetch = fetch) {
  const unique = sourceIds(ids);
  const results = await Promise.all(unique.map(async id => {
    if (!force && isFresh(getSession().cache[id])) return { id, status: 'cached' as const };
    return { id, status: await fetchSource(id, fetcher) };
  }));
  return {
    cache: { ...getSession().cache },
    failed: results.filter(result => result.status === 'failed').map(result => result.id),
    empty: results.filter(result => result.status === 'empty' || getSession().cache[result.id]?.items.length === 0).map(result => result.id),
  };
}
