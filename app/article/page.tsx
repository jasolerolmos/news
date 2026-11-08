'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Article { title: string; body: string; url: string }

function extractKeywords(title: string): string {
  const stop = new Set(['el','la','los','las','un','una','unos','unas','que','pero','ante','bajo','con','contra','desde','durante','entre','hasta','para','por','según','sobre','tras','del','sus','son','esta','este','estos','estas']);
  return title.toLowerCase().replace(/[.,:;¡!¿?"'()[\]{}]/g, '').split(/\s+/).filter(word => word.length > 3 && !stop.has(word)).sort((a, b) => b.length - a.length).slice(0, 2).join(' ');
}

function ArticleContent() {
  const params = useSearchParams();
  const router = useRouter();
  const url = params.get('url');
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setArticle(null); setError(''); setLoading(true);
      if (!url) { setError('Falta la dirección de la noticia.'); setLoading(false); return; }
      try {
        const response = await fetch(`/api/article?url=${encodeURIComponent(url)}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el artículo.');
        if (!controller.signal.aborted) setArticle(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'No se pudo cargar el artículo.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [url]);

  return <main className="news-shell" style={{ maxWidth: '860px' }}>
    <Link className="news-item-action" href="/">← Volver a la portada</Link>
    {loading ? <p className="news-loading" role="status">Cargando artículo…</p> : error || !article ? <div className="news-alert" role="alert">{error || 'No se pudo cargar el artículo.'}</div> : <article style={{ marginTop: '2rem', borderTop: '1px solid var(--ink)', paddingTop: '2rem' }}>
      <p className="news-eyebrow">Lectura · Fuente externa</p>
      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', lineHeight: 1.15 }}>{article.title || 'Artículo sin título'}</h1>
      <p style={{ color: 'var(--muted)', margin: '1rem 0 1.75rem' }}>El texto disponible puede estar incompleto. Consulta siempre la publicación original.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.7rem', marginBottom: '2rem' }}>
        <a className="news-button" href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>Abrir fuente original ↗</a>
        <button type="button" className="news-button secondary" onClick={() => router.push(`/?search=${encodeURIComponent(extractKeywords(article.title))}`)}>Buscar noticias relacionadas</button>
      </div>
      {article.body ? <div style={{ borderTop: '1px solid var(--line)', paddingTop: '2rem', whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', fontSize: '1.12rem', lineHeight: 1.85, overflowWrap: 'anywhere' }}>{article.body}</div> : <p className="news-alert">No se ha encontrado texto legible. Puedes consultar la fuente original.</p>}
    </article>}
  </main>;
}

export default function ArticlePage() {
  return <Suspense fallback={<main className="news-shell"><p className="news-loading">Cargando artículo…</p></main>}><ArticleContent /></Suspense>;
}
