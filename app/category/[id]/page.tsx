'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface NewsItem {
    title: string;
    url: string;
    category: string;
    source: string;
}

export default function CategoryPage({ params }: { params: { id: string } }) {
    const categoryId = params.id.toLowerCase();
    
    const [allNews, setAllNews] = useState<NewsItem[]>([]);
    const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sourceFilter, setSourceFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchNews() {
            try {
                setLoading(true);
                const [abcRes, elpaisRes] = await Promise.all([
                    fetch(`/api/news/abc?section=${categoryId}`),
                    fetch(`/api/news/elpais?section=${categoryId}`)
                ]);

                const abcData = await abcRes.json();
                const elpaisData = await elpaisRes.json();

                const combined = [...abcData, ...elpaisData];
                setAllNews(combined);
                setFilteredNews(combined);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching news for category:', err);
                setError(true);
                setLoading(false);
            }
        }

        fetchNews();
    }, [categoryId]);

    useEffect(() => {
        let filtered = allNews;

        // Apply source filter
        if (sourceFilter !== 'all') {
            filtered = filtered.filter(item => item.source === sourceFilter);
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredNews(filtered);
    }, [sourceFilter, searchTerm, allNews]);

    if (loading) {
        return (
            <div className="container">
                <div className="loading">📰 Cargando noticias de {categoryId}...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="error">⚠️ No se pudieron cargar las noticias de esta sección.</div>
            </div>
        );
    }

    return (
        <div className="container">
            <header>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
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
                        Volver a portada
                    </Link>
                </div>
                <h1>Sección: <span style={{ textTransform: 'capitalize' }}>{categoryId}</span></h1>
                <p className="subtitle">Noticias directas desde las secciones de ABC y El País</p>
                <div className="stats">📰 {filteredNews.length} noticias encontradas</div>
            </header>

            {/* Search Box */}
            <div className="search-container">
                <div className="search-box">
                    <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar en esta sección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="off"
                    />
                    {searchTerm && (
                        <button
                            className="clear-search visible"
                            onClick={() => setSearchTerm('')}
                            title="Limpiar búsqueda"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-container">
                <div className="filter-section">
                    <span className="filter-section-label">Fuente:</span>
                    <button
                        className={`filter-btn ${sourceFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setSourceFilter('all')}
                    >
                        Todas
                    </button>
                    <button
                        className={`filter-btn ${sourceFilter === 'ABC' ? 'active' : ''}`}
                        onClick={() => setSourceFilter('ABC')}
                    >
                        ABC
                    </button>
                    <button
                        className={`filter-btn ${sourceFilter === 'ELPAIS' ? 'active' : ''}`}
                        onClick={() => setSourceFilter('ELPAIS')}
                    >
                        El País
                    </button>
                </div>
            </div>

            {/* News Grid */}
            <div className="news-grid">
                {filteredNews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                        <p>No se encontraron noticias en esta sección con los filtros actuales.</p>
                    </div>
                ) : (
                    filteredNews.map((item, index) => (
                        <article
                            key={`${item.source}-${index}`}
                            className="news-card"
                            data-source={item.source}
                        >
                            <div className="card-content">
                                <span className={`source-badge ${item.source.toLowerCase()}`}>
                                    {item.source === 'ABC' ? 'ABC' : 'EL PAÍS'}
                                </span>
                                <h2 className="news-title" style={{ marginTop: '1.5rem' }}>
                                    <Link href={`/article?url=${encodeURIComponent(item.url)}`} className="news-link">
                                        {item.title}
                                    </Link>
                                </h2>
                            </div>
                            <div className="card-footer">
                                <span className="read-more">
                                    Leer más
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
}
