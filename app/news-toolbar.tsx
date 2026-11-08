'use client';

import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { SOURCES, isFresh } from './news-session';
import type { CacheEntry, NewsView, SourceId } from './news-session';

type IconName = 'check' | 'search' | 'load' | 'refresh' | 'link' | 'chevron';
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    check: 'm5 12 4 4L19 6',
    search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    load: 'M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5',
    refresh: 'M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 11-1l3 3M4 15l3 3a7 7 0 0 0 11-1',
    link: 'm10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 2 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0',
    chevron: 'm7 10 5 5 5-5',
  };
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

interface Props {
  view: NewsView;
  setView: Dispatch<SetStateAction<NewsView>>;
  cache: Partial<Record<SourceId, CacheEntry>>;
  categories: string[];
  count: number;
  ready: boolean;
  loading: boolean;
  failed: SourceId[];
  empty: SourceId[];
  changed: boolean;
  url: string;
  setUrl: (value: string) => void;
  onSubmitUrl: (event: FormEvent<HTMLFormElement>) => void;
  onLoad: () => void;
  onRefresh: () => void;
}

export default function NewsToolbar({ view, setView, cache, categories, count, ready, loading, failed, empty, changed, url, setUrl, onSubmitUrl, onLoad, onRefresh }: Props) {
  function toggle(id: SourceId) {
    setView(previous => ({ ...previous, selected: previous.selected.includes(id) ? previous.selected.filter(value => value !== id) : SOURCES.filter(source => source.id === id || previous.selected.includes(source.id)).map(source => source.id) }));
  }

  return <section className="news-toolbar-panel" aria-label="Selección, filtros y estado de los medios">
    <div className="news-toolbar-selection">
      <fieldset className="news-outlets" disabled={!ready || loading}>
        <legend>Medios <span>{view.selected.length} seleccionados</span></legend>
        <div className="news-outlet-options">
          {SOURCES.map(source => <button key={source.id} type="button" className="news-outlet-toggle" aria-pressed={view.selected.includes(source.id)} aria-label={`${source.label}${source.experimental ? ' (experimental)' : ''}`} onClick={() => toggle(source.id)}>
            <span className="news-outlet-marker" aria-hidden="true">{view.selected.includes(source.id) && <Icon name="check" />}</span>
            <span>{source.label}</span>{source.experimental && <span className="news-experimental" aria-hidden="true">Exp.</span>}
          </button>)}
        </div>
      </fieldset>
      <div className="news-toolbar-actions">
        <button type="button" className="news-action news-action-primary" disabled={!ready || loading || !view.selected.length} onClick={onLoad}><Icon name="load" />{loading ? 'Cargando…' : 'Cargar selección'}</button>
        <button type="button" className="news-action news-action-secondary" disabled={!ready || loading || !view.loaded.length} title="Forzar la descarga de los medios cargados, sin aplicar la selección pendiente" onClick={onRefresh}><Icon name="refresh" />Actualizar</button>
      </div>
    </div>
    <div className="news-toolbar-filters">
      <div className="news-toolbar-field news-toolbar-search">
        <label htmlFor="news-search">Buscar titulares</label>
        <div className="news-search-control"><Icon name="search" /><input id="news-search" type="search" placeholder="Buscar entre las noticias cargadas" value={view.search} onChange={event => setView(previous => ({ ...previous, search: event.target.value, scrollY: 0 }))} /></div>
      </div>
      <div className="news-toolbar-field"><label htmlFor="source-filter">Medio cargado</label><select id="source-filter" value={view.source} onChange={event => setView(previous => ({ ...previous, source: event.target.value, scrollY: 0 }))}><option value="all">Todos los medios</option>{SOURCES.filter(source => view.loaded.includes(source.id)).map(source => <option key={source.id} value={source.code}>{source.label}</option>)}</select></div>
      <div className="news-toolbar-field"><label htmlFor="category-filter">Categoría</label><select id="category-filter" value={view.category} onChange={event => setView(previous => ({ ...previous, category: event.target.value, scrollY: 0 }))}><option value="all">Todas las categorías</option>{view.category !== 'all' && !categories.includes(view.category) && <option value={view.category}>{view.category} (sin resultados)</option>}{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></div>
      <button type="button" className="news-clear-filters" onClick={() => setView(previous => ({ ...previous, search: '', source: 'all', category: 'all', scrollY: 0 }))}>Limpiar filtros</button>
    </div>
    <div className="news-toolbar-meta">
      <div className="news-toolbar-count" aria-live="polite"><span className={`news-indicator${loading ? ' is-loading' : ''}`} aria-hidden="true" />{!ready ? 'Restaurando sesión…' : <><strong>{count}</strong> noticias<span className="news-meta-separator" aria-hidden="true">·</span>{view.loaded.length} medios cargados{loading && <span> · Actualizando…</span>}</>}</div>
      {ready && changed && <span className="news-selection-pending">Selección pendiente</span>}
      <details className="news-toolbar-url"><summary><Icon name="link" />Leer una URL<Icon name="chevron" /></summary><form onSubmit={onSubmitUrl}><label htmlFor="article-url" className="compact-sr-only">URL de la noticia</label><input id="article-url" className="compact-input" type="url" placeholder="https://…" value={url} onChange={event => setUrl(event.target.value)} required /><button className="news-action news-action-secondary" type="submit">Abrir</button><small>Solo enlaces HTTPS de medios compatibles.</small></form></details>
    </div>
    <details className="news-media-status" open>
      <summary><span>Estado de los medios</span><span className="news-status-ttl">Caché de 30 min</span><Icon name="chevron" /></summary>
      {!ready ? <p className="news-status-placeholder">Restaurando estado…</p> : !view.loaded.length ? <p className="news-status-placeholder">Ningún medio cargado. Selecciona los medios y pulsa Cargar selección.</p> : <ul className="news-status-list">{view.loaded.map(id => {
        const entry = cache[id];
        const error = failed.includes(id);
        const noNewItems = empty.includes(id);
        const expired = !!entry && !isFresh(entry);
        const status = loading ? 'Comprobando…' : error ? (entry ? 'Error · datos guardados' : 'Error de carga') : noNewItems ? (entry?.items.length ? 'Sin datos nuevos' : 'Sin titulares') : expired ? 'Pendiente de actualizar' : entry ? 'Disponible' : 'Sin datos';
        const tone = loading ? 'loading' : error || noNewItems || expired ? 'warning' : entry ? 'ready' : 'idle';
        const outlet = SOURCES.find(source => source.id === id)!;
        return <li key={id} className="news-status-item" data-state={tone}>
          <div className="news-status-name"><span className="news-status-dot" aria-hidden="true" /><strong>{outlet.label}</strong><span className="news-status-quantity">{entry ? entry.items.length : '—'}</span></div>
          <div className="news-status-description"><span>{status}</span>{entry && <time dateTime={new Date(entry.fetchedAt).toISOString()} title={new Date(entry.fetchedAt).toLocaleString('es')}>{new Date(entry.fetchedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</time>}</div>
        </li>;
      })}</ul>}
    </details>
  </section>;
}
