'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Article {
    title: string;
    body: string;
    url: string;
}

export default function ArticlePage() {
    const searchParams = useSearchParams();
    const url = searchParams.get('url');

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!url) {
            setError(true);
            setLoading(false);
            return;
        }

        async function fetchArticle() {
            try {
                setLoading(true);
                const response = await fetch(`/api/article?url=${encodeURIComponent(url)}`);

                if (!response.ok) {
                    setError(true);
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setArticle(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching article:', err);
                setError(true);
                setLoading(false);
            }
        }

        fetchArticle();
    }, [url]);

    if (loading) {
        return (
            <div className="container">
                <div className="loading">📰 Cargando artículo...</div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="container">
                <div className="error">
                    ⚠️ No se pudo cargar el artículo.
                </div>
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <Link href="/" style={{ color: 'var(--accent-elpais)', textDecoration: 'underline' }}>
                        Volver a inicio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/" style={{
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 600
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a noticias
                    </Link>
                </div>

                <article style={{
                    background: 'var(--card-bg)',
                    padding: '3rem',
                    borderRadius: '1rem',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <h1 style={{
                        fontFamily: 'Merriweather, Georgia, serif',
                        fontSize: '2rem',
                        fontWeight: 700,
                        lineHeight: 1.3,
                        marginBottom: '1.5rem',
                        color: 'var(--text-primary)'
                    }}>
                        {article.title}
                    </h1>

                    {article.body ? (
                        <div style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.8,
                            color: 'var(--text-primary)',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {article.body}
                        </div>
                    ) : (
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                El contenido completo está disponible en la fuente original
                            </p>
                            <a
                                href={url || ''}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-block',
                                    padding: '0.75rem 1.5rem',
                                    background: 'var(--text-primary)',
                                    color: 'white',
                                    borderRadius: '0.5rem',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Leer en sitio original →
                            </a>
                        </div>
                    )}

                    <div style={{
                        marginTop: '2rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid var(--border-color)',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <a
                            href={url || ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: 'var(--accent-elpais)',
                                textDecoration: 'none',
                                wordBreak: 'break-all'
                            }}
                        >
                            Fuente original →
                        </a>
                    </div>
                </article>
            </div>
        </div>
    );
}
