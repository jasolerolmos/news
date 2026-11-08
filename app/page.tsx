'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SOURCES, defaultSession, getSession, saveView, hasStorageError, isFresh, loadSources } from './news-session';
import type { CacheEntry, NewsView, SourceId } from './news-session';

const label = (id: SourceId) => SOURCES.find(source => source.id === id)!.label;

function HomeContent() {
  const router = useRouter();
  const query = useSearchParams().get('search');
  const [view, setView] = useState<NewsView>(defaultSession);
  const [cache, setCache] = useState<Partial<Record<SourceId, CacheEntry>>>({});
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<SourceId[]>([]);
  const [empty, setEmpty] = useState<SourceId[]>([]);
  const [storageWarning, setStorageWarning] = useState(false);
  const [url, setUrl] = useState('');
  const current = useRef(view);
  current.current = view;
  const generation = useRef(0);
  const busy = useRef(false);
  const scrollTarget = useRef<number | null>(null);

  const run = useCallback(async (ids: SourceId[], force = false) => {
    if (busy.current || !ids.length) return;
    busy.current = true;
    const token = ++generation.current;
    setLoading(true);
    setFailed([]);
    setEmpty([]);
    setCache({ ...getSession().cache });
    setView(previous => ({ ...previous, loaded: ids }));
    const result = await loadSources(ids, force);
    if (token !== generation.current) return;
    setCache(result.cache);
    setFailed(result.failed);
    setEmpty(result.empty);
    setStorageWarning(hasStorageError());
    setLoading(false);
    busy.current = false;
  }, []);

  useEffect(() => {
    const restored = getSession();
    const next: NewsView = {
      selected: [...restored.selected], loaded: [...restored.loaded],
      source: query !== null ? 'all' : restored.source,
      category: query !== null ? 'all' : restored.category,
      search: query !== null ? query : restored.search,
      scrollY: query !== null ? 0 : restored.scrollY,
    };
    current.current = next;
    scrollTarget.current = next.scrollY;
    setView(next);
    setCache({ ...restored.cache });
    setReady(true);
    setStorageWarning(hasStorageError());
    // No initial fetch without a previously loaded selection.
    if (next.loaded.some(id => !isFresh(restored.cache[id]))) void run(next.loaded);
    return () => { generation.current += 1; busy.current = false; };
  }, [query, run]);

  useEffect(() => {
    if (!ready) return;
    saveView(view);
    setStorageWarning(hasStorageError());
  }, [view, ready]);

  useEffect(() => {
    if (!ready || scrollTarget.current === null) return;
    const target = scrollTarget.current;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        window.scrollTo({ top: target, behavior: 'instant' as ScrollBehavior });
        scrollTarget.current = null;
      });
    });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [ready]);

  const remember = useCallback(() => {
    saveView({ ...current.current, scrollY: scrollTarget.current ?? window.scrollY });
  }, []);

  useEffect(() => {
    if (!ready) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scroll = () => {
      if (scrollTarget.current !== null) return;
      clearTimeout(timer);
      timer = setTimeout(remember, 150);
    };
    const refreshExpired = () => {
      if (document.visibilityState === 'hidden' || busy.current) return;
      const ids = current.current.loaded;
      if (ids.some(id => !isFresh(getSession().cache[id]))) void run(ids);
    };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('pagehide', remember);
    window.addEventListener('focus', refreshExpired);
    window.addEventListener('pageshow', refreshExpired);
    document.addEventListener('visibilitychange', refreshExpired);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('pagehide', remember);
      window.removeEventListener('focus', refreshExpired);
      window.removeEventListener('pageshow', refreshExpired);
      document.removeEventListener('visibilitychange', refreshExpired);
    };
  }, [ready, remember, run]);

  const items = useMemo(() => view.loaded.flatMap(id => cache[id]?.items || []), [view.loaded, cache]);
  const categories = useMemo(() => Array.from(new Set(items.map(item => item.category))).sort((a, b) => a.localeCompare(b, 'es')), [items]);
  const filtered = useMemo(() => {
    const words = view.search.toLocaleLowerCase('es').trim().split(/\s+/).filter(Boolean);
    return items.filter(item => (view.source === 'all' || item.source === view.source) && (view.category === 'all' || item.category === view.category) && words.every(word => item.title.toLocaleLowerCase('es').includes(word)));
  }, [items, view.source, view.category, view.search]);
  const changed = view.selected.length !== view.loaded.length || view.selected.some(id => !view.loaded.includes(id));
  const stale = view.loaded.filter(id => cache[id]?.items.length && !isFresh(cache[id]));

  function toggle(id: SourceId) {
    setView(previous => ({ ...previous, selected: previous.selected.includes(id) ? previous.selected.filter(value => value !== id) : SOURCES.filter(source => source.id === id || previous.selected.includes(source.id)).map(source => source.id) }));
  }
  function submitUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (url.trim()) { remember(); router.push(`/article?url=${encodeURIComponent(url.trim())}`); }
  }

  return (
    <main className="compact-page">
      <h1 className="compact-sr-only">Noticias</h1>
      <fieldset disabled={!ready || loading} style={{ border: 0, padding: 0, margin: '0 0 1rem', minWidth: 0 }}>
        <legend className="compact-sr-only">Medios que quieres cargar</legend>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '.65rem 1rem' }}>
          {SOURCES.map(source => <label key={source.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', cursor: 'pointer' }}><input type="checkbox" checked={view.selected.includes(source.id)} onChange={() => toggle(source.id)} style={{ accentColor: '#376452' }} />{source.label}{source.experimental && <small style={{ color: '#737d76' }}>(experimental)</small>}</label>)}
          <button type="button" className="compact-button" disabled={!ready || loading || !view.selected.length} onClick={() => { setView(previous => ({ ...previous, source: 'all', category: 'all', scrollY: 0 })); void run([...view.selected]); }}>Cargar</button>
          <button type="button" className="compact-button" disabled={!ready || loading || !view.loaded.length} title="Volver a descargar los medios que se están mostrando" onClick={() => void run([...view.loaded], true)}>Actualizar cargados</button>
        </div>
      </fieldset>
      {ready && changed && <p style={{ fontSize: '.78rem', color: '#606b65', marginBottom: '.85rem' }}>Pulsa Cargar para aplicar la selección de medios.</p>}
      <div className="compact-controls" aria-label="Filtros de noticias">
        <div className="compact-field compact-search"><label htmlFor="news-search">Buscar</label><input id="news-search" className="compact-input" type="search" placeholder="Buscar en los titulares" value={view.search} onChange={event => setView(previous => ({ ...previous, search: event.target.value, scrollY: 0 }))} /></div>
        <div className="compact-field"><label htmlFor="source-filter">Medio cargado</label><select id="source-filter" className="compact-select" value={view.source} onChange={event => setView(previous => ({ ...previous, source: event.target.value, scrollY: 0 }))}><option value="all">Todos</option>{SOURCES.filter(source => view.loaded.includes(source.id)).map(source => <option key={source.id} value={source.code}>{source.label}</option>)}</select></div>
        <div className="compact-field"><label htmlFor="category-filter">Categoría</label><select id="category-filter" className="compact-select" value={view.category} onChange={event => setView(previous => ({ ...previous, category: event.target.value, scrollY: 0 }))}><option value="all">Todas</option>{view.category !== 'all' && !categories.includes(view.category) && <option value={view.category}>{view.category} (sin resultados)</option>}{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></div>
        <button type="button" className="compact-button" onClick={() => setView(previous => ({ ...previous, search: '', source: 'all', category: 'all', scrollY: 0 }))}>Limpiar</button>
      </div>
      <div className="compact-tools">
        <details><summary>Leer una URL</summary><form className="compact-url-form" onSubmit={submitUrl}><label htmlFor="article-url" className="compact-sr-only">URL de la noticia</label><input id="article-url" className="compact-input" type="url" placeholder="https://…" value={url} onChange={event => setUrl(event.target.value)} required /><button className="compact-button" type="submit">Abrir</button></form></details>
        <span className="compact-count" aria-live="polite">{loading ? 'Actualizando… ' : ''}{ready ? `${filtered.length} noticias` : 'Restaurando…'}</span>
      </div>
      {storageWarning && <p className="compact-feedback" role="status">El navegador no permite guardar la sesión. Se conserva en memoria, pero podría perderse al recargar la pestaña.</p>}
      {(failed.length > 0 || empty.length > 0 || stale.length > 0) && <div className="compact-feedback" role="status">{failed.length > 0 && <p>No se pudieron cargar: {failed.map(label).join(', ')}.</p>}{empty.length > 0 && <p>Sin titulares nuevos detectados: {empty.map(label).join(', ')}.</p>}{stale.length > 0 && <p>Se muestran titulares anteriores de {stale.map(label).join(', ')} mientras se intenta actualizarlos.</p>}<button type="button" className="compact-button" disabled={loading} onClick={() => void run([...view.loaded])}>Reintentar</button></div>}
      <section className="compact-grid" aria-label="Titulares" aria-busy={loading}>
        {!ready ? <p className="compact-loading">Restaurando sesión…</p> : !view.loaded.length ? <p className="compact-empty">Selecciona los medios y pulsa Cargar.</p> : filtered.length === 0 ? <p className="compact-empty">{loading ? 'Consultando las fuentes…' : 'No hay noticias con los filtros seleccionados.'}</p> : filtered.map((item, index) => {
          const outlet = SOURCES.find(source => source.code === item.source);
          return <article className="compact-item" key={`${item.source}-${item.url}-${index}`}><div className="compact-meta"><span className="compact-source">{outlet?.label || item.source}</span><span aria-hidden="true">·</span><span>{item.category}</span></div><h2><Link href={`/article?url=${encodeURIComponent(item.url)}`} prefetch={false} onClick={remember}>{item.title}</Link></h2></article>;
        })}
      </section>
      {ready && view.loaded.length > 0 && <details style={{ fontSize: '.75rem', color: '#606b65', marginTop: '1rem' }}><summary>Estado de los medios · caché de 30 min</summary>{view.loaded.map(id => <p key={id}>{label(id)}: {cache[id] ? `cargado a las ${new Date(cache[id]!.fetchedAt).toLocaleTimeString('es')}` : 'sin datos guardados'}</p>)}</details>}
    </main>
  );
}

export default function Home() {
  return <Suspense fallback={<main className="compact-page"><p className="compact-loading">Restaurando sesión…</p></main>}><HomeContent /></Suspense>;
}
