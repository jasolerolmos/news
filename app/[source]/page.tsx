'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface NewsItem {
    title: string;
    url: string;
    category: string;
    source: string;
}

export default function SourcePage() {
    const params = useParams();
    const source = typeof params.source === 'string' ? params.source : '';

    const [allNews, setAllNews] = useState<NewsItem[]>([]);
    const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    
    const [loading, setLoading] = useState(true);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!source) return;

        async function fetchInitialNews() {
            try {
                setLoading(true);
                // Validamos que el source sea abc, elpais o ideal
                if (source !== 'abc' && source !== 'elpais' && source !== 'ideal') {
                    throw new Error('Fuente no válida');
                }

                const res = await fetch(`/api/news/${source}`);
                const data = await res.json();

                setAllNews(data);
                setFilteredNews(data);

                // Extract unique categories
                const uniqueCategories = Array.from(
                    new Set(data.map((item: NewsItem) => item.category))
                ).sort();
                setCategories(uniqueCategories as string[]);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching news:', err);
                setError(true);
                setLoading(false);
            }
        }

        fetchInitialNews();
    }, [source]);

    useEffect(() => {
        if (allNews.length === 0) return;

        if (activeCategory === 'all') {
            setFilteredNews(allNews);
        } else {
            // Filtrado dinámico 100% coherente con lo extraído de la portada
            setFilteredNews(allNews.filter(news => news.category === activeCategory));
        }
    }, [activeCategory, allNews]);

    if (loading) {
        return (
            <div className="container">
                <div className="loading">📰 Cargando noticias de {source.toUpperCase()}...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="error">⚠️ No se pudieron cargar las noticias de este periódico. Verifica que la URL sea correcta (/abc, /elpais o /ideal).</div>
            </div>
        );
    }

    return (
        <div className="container">
            <header>
                <h1>{source === 'abc' ? 'ABC' : source === 'ideal' ? 'Ideal' : 'El País'}</h1>
                <p className="subtitle">Todas las noticias de {source === 'abc' ? 'ABC' : source === 'ideal' ? 'Ideal' : 'El País'}</p>
                <div className="stats">📰 {filteredNews.length} noticias mostradas</div>
            </header>

            <div className="source-layout">
                {/* Left Sidebar */}
                <aside className="sidebar-menu">
                    <h3 className="sidebar-title">Secciones</h3>
                    <button 
                        className={`sidebar-item ${activeCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('all')}
                    >
                        Todas las noticias
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`sidebar-item ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat.toLowerCase()}
                        </button>
                    ))}
                </aside>

                {/* Main Content Area */}
                <main className="main-content">
                    {isCategoryLoading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                            <p>📰 Cargando noticias de la sección {activeCategory.toLowerCase()}...</p>
                        </div>
                    ) : filteredNews.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                            <p>No se encontraron noticias en esta sección.</p>
                        </div>
                    ) : (
                        <div className="news-table-container">
                            <table className="news-table">
                                <thead>
                                    <tr>
                                        <th>Titular</th>
                                        <th>Sección</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredNews.map((item, index) => (
                                        <tr key={index}>
                                            <td className="title-cell">{item.title}</td>
                                            <td className="category-cell">
                                                <Link href={`/category/${item.category.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                                                    <span className="category-tag" style={{ margin: 0, cursor: 'pointer', color: source === 'abc' ? 'var(--accent-abc)' : source === 'ideal' ? 'var(--accent-ideal)' : 'var(--accent-elpais)' }}>
                                                        {item.category}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="action-cell">
                                                <Link 
                                                    href={`/article?url=${encodeURIComponent(item.url)}`}
                                                    className="btn-read-more"
                                                >
                                                    Leer más
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
