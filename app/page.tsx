'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface NewsItem { title: string; url: string; category: string; source: string }
const SOURCES = [
  { id: 'abc', code: 'ABC', label: 'ABC' },
  { id: 'elpais', code: 'ELPAIS', label: 'El País' },
  { id: 'ideal', code: 'IDEAL', label: 'Ideal' },
  { id: 'granadahoy', code: 'GRANADAHOY', label: 'Granada Hoy' },
  { id: 'xataka', code: 'XATAKA', label: 'Xataka' },
] as const;

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [empty, setEmpty] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [source, setSource] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [url, setUrl] = useState('');

  useEffect(() => { setSearch(searchParams.get('search') || ''); }, [searchParams]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      const results = await Promise.all(SOURCES.map(async (item) => {
        try {
          const response = await fetch(`/api/news/${item.id}`, { signal: controller.signal });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data: unknown = await response.json();
          if (!Array.isArray(data)) throw new Error('Invalid response');
          const valid = data.filter((entry): entry is NewsItem => entry && typeof entry.title === 'string' && typeof entry.url === 'string' && typeof entry.category === 'string' && typeof entry.source === 'string');
          return { label: item.label, data: valid, failed: false };
        } catch {
          return { label: item.label, data: [] as NewsItem[], failed: true };
        }
      }));
      if (controller.signal.aborted) return;
      setItems(results.flatMap(result => result.data));
      setFailed(results.filter(result => result.failed).map(result => result.label));
      setEmpty(results.filter(result => !result.failed && result.data.length === 0).map(result => result.label));
      setLoading(false);
    }
    void load();
    return () => controller.abort();
  }, [revision]);

  const categories = useMemo(() => Array.from(new Set(items.map(item => item.category))).sort((a, b) => a.localeCompare(b, 'es')), [items]);
  const filtered = useMemo(() => {
    const words = search.toLocaleLowerCase('es').trim().split(/\s+/).filter(Boolean);
    return items.filter(item => (source === 'all' || item.source === source) && (category === 'all' || item.category === category) && words.every(word => item.title.toLocaleLowerCase('es').includes(word)));
  }, [items, source, category, search]);

  function submitUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (url.trim()) router.push(`/article?url=${encodeURIComponent(url.trim())}`);
  }
  function resetFilters() { setSearch(''); setSource('all'); setCategory('all'); }

  return (
    <main className="news-shell">
      <div className="news-intro">
        <div><p className="news-eyebrow">Tu lectura diaria · Una sola portada</p><h1>La actualidad,<br />a tu manera.</h1><p>Descubre los titulares de distintos medios, encuentra los temas que te interesan y lee con más perspectiva.</p></div>
        <div className="news-intro-meta"><strong>{loading ? '—' : items.length}</strong> titulares disponibles</div>
      </div>
      <div className="news-toolbar">
        <div className="news-field"><label htmlFor="news-search">Buscar en los titulares</label><input id="news-search" className="news-input" type="search" placeholder="Por ejemplo: ciencia, economía…" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <div className="news-field"><label htmlFor="article-url">Leer una noticia por URL</label><form className="news-url-form" onSubmit={submitUrl}><input id="article-url" className="news-input" type="url" placeholder="https://…" value={url} onChange={event => setUrl(event.target.value)} required /><button className="news-button" type="submit">Abrir noticia →</button></form><small style={{ color: 'var(--muted)' }}>Solo enlaces HTTPS de medios compatibles.</small></div>
      </div>
      <div className="news-filters">
        <div><label htmlFor="source-filter">Medio</label><select id="source-filter" className="news-select" value={source} onChange={event => setSource(event.target.value)}><option value="all">Todos los medios</option>{SOURCES.map(item => <option key={item.id} value={item.code}>{item.label}</option>)}</select></div>
        <div><label htmlFor="category-filter">Categoría</label><select id="category-filter" className="news-select" value={category} onChange={event => setCategory(event.target.value)}><option value="all">Todas las categorías</option>{categories.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
        <button type="button" className="news-button secondary" onClick={resetFilters}>Limpiar filtros</button>
      </div>
      <div className="news-results-head"><h2>Últimos titulares</h2><span aria-live="polite">{loading ? 'Actualizando…' : `${filtered.length} noticias mostradas`}</span></div>
      {!loading && (failed.length > 0 || empty.length > 0) && <div className="news-alert" role="status">{failed.length > 0 && <p>No se pudieron cargar: {failed.join(', ')}.</p>}{empty.length > 0 && <p>Sin titulares detectados: {empty.join(', ')}. El medio puede haber cambiado su página o no tener resultados.</p>}<button type="button" className="news-button secondary" style={{ marginTop: '.6rem' }} onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
      {loading ? <div className="news-loading" role="status">Consultando las fuentes…</div> : <div className="news-list">{filtered.length === 0 ? <div className="news-empty">No hay titulares para mostrar. Prueba otros filtros o vuelve a intentarlo.</div> : filtered.map((item, index) => <article className="news-item" key={`${item.source}-${item.url}-${index}`}><div className="news-item-meta"><span className="news-item-source">{SOURCES.find(s => s.code === item.source)?.label || item.source}</span><span aria-hidden="true">/</span><span>{item.category}</span></div><h3><Link href={`/article?url=${encodeURIComponent(item.url)}`}>{item.title}</Link></h3><Link className="news-item-action" href={`/article?url=${encodeURIComponent(item.url)}`}>Leer noticia →</Link></article>)}</div>}
    </main>
  );
}

export default function Home() {
  return <Suspense fallback={<main className="news-shell"><div className="news-loading">Cargando portada…</div></main>}><HomeContent /></Suspense>;
}
