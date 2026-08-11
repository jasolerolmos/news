'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NewsItem {
    title: string;
    url: string;
    category: string;
    source: string;
}

export default function Home() {
    const [allNews, setAllNews] = useState<NewsItem[]>([]);
    const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [sourceFilter, setSourceFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const router = useRouter();

    const [categories, setCategories] = useState<string[]>([]);

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (urlInput.trim()) {
            let cleanUrl = urlInput.trim();
            try {
                const parsedUrl = new URL(cleanUrl);
                cleanUrl = parsedUrl.origin + parsedUrl.pathname;
            } catch (err) {
                cleanUrl = cleanUrl.split('?')[0].split('#')[0];
            }
            router.push(`/article?url=${encodeURIComponent(cleanUrl)}`);
        }
    };

    useEffect(() => {
        async function fetchNews() {
            try {
                setLoading(true);
                const [abcRes, elpaisRes, idealRes] = await Promise.all([
                    fetch('/api/news/abc'),
                    fetch('/api/news/elpais'),
                    fetch('/api/news/ideal')
                ]);

                const abcData = await abcRes.json();
                const elpaisData = await elpaisRes.json();
                const idealData = await idealRes.json();

                const combined = [...abcData, ...elpaisData, ...idealData];
                setAllNews(combined);
                setFilteredNews(combined);

                // Extract unique categories
                const uniqueCategories = Array.from(
                    new Set(combined.map((item: NewsItem) => item.category))
                ).sort();
                setCategories(uniqueCategories as string[]);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching news:', err);
                setError(true);
                setLoading(false);
            }
        }

        fetchNews();
    }, []);

    useEffect(() => {
        let filtered = allNews;

        // Apply source filter
        if (sourceFilter !== 'all') {
            filtered = filtered.filter(item => item.source === sourceFilter);
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(item => item.category === categoryFilter);
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredNews(filtered);
    }, [sourceFilter, categoryFilter, searchTerm, allNews]);

    if (loading) {
        return (
            <div className="container">
                <div className="loading">📰 Cargando noticias...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="error">⚠️ No se pudieron cargar las noticias. Verifica tu conexión o intenta más tarde.</div>
            </div>
        );
    }

    // Calcular el "Top" de categorías (las 6 con más noticias)
    const categoryCounts = allNews.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    // Ordenar categorías por cantidad de noticias (de mayor a menor)
    const sortedCategories = [...categories].sort((a, b) => categoryCounts[b] - categoryCounts[a]);
    
    const topCategories = sortedCategories.slice(0, 6);
    const otherCategories = sortedCategories.slice(6);
    
    return (
        <div className="container" style={{ paddingTop: '1rem' }}>

            {/* Search Box */}
            <div className="search-container">
                <div className="search-box">
                    <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar noticias por título..."
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

            {/* Custom URL Input */}
            <div className="search-container" style={{ marginTop: '1rem' }}>
                <form className="url-form" onSubmit={handleUrlSubmit}>
                    <div className="search-box">
                        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <input
                            type="url"
                            className="search-input"
                            placeholder="Pegar URL de una noticia para leer..."
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            autoComplete="off"
                            required
                        />
                    </div>
                    <button type="submit" className="filter-btn active url-btn">
                        Leer noticia
                    </button>
                </form>
            </div>

            {/* Filter Toggle and Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="stats" style={{ margin: 0 }}>📰 {filteredNews.length} noticias</span>
                <button 
                    className="mobile-filter-toggle"
                    style={{ width: 'auto', marginBottom: 0 }}
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ transform: isFiltersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {isFiltersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
                </button>
            </div>

            {/* Filter Bar */}
            <div className={`filter-container-wrapper ${isFiltersOpen ? 'open' : ''}`}>
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
                    <button
                        className={`filter-btn ${sourceFilter === 'IDEAL' ? 'active' : ''}`}
                        onClick={() => setSourceFilter('IDEAL')}
                    >
                        Ideal
                    </button>
                </div>
                <div className="filter-divider"></div>
                <div className="filter-section">
                    <span className="filter-section-label">Top Categorías:</span>
                    <button
                        className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setCategoryFilter('all')}
                    >
                        Todas
                    </button>
                    {topCategories.map((cat) => (
                        <button
                            key={cat}
                            className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                            onClick={() => setCategoryFilter(cat)}
                        >
                            {cat.toLowerCase()}
                        </button>
                    ))}
                    
                    {otherCategories.length > 0 && (
                        <div style={{ position: 'relative', marginLeft: '0.5rem' }}>
                            <button
                                className={`filter-btn ${otherCategories.includes(categoryFilter) ? 'active' : ''}`}
                                style={{ paddingRight: '2.5rem', display: 'flex', alignItems: 'center' }}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                {otherCategories.includes(categoryFilter) ? categoryFilter.toLowerCase() : "Otras..."}
                                <svg style={{ position: 'absolute', right: '1rem', transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {isDropdownOpen && (
                                <div className="custom-dropdown">
                                    {otherCategories.map(cat => (
                                        <button
                                            key={cat}
                                            className={`dropdown-item ${categoryFilter === cat ? 'active' : ''}`}
                                            onClick={() => {
                                                setCategoryFilter(cat);
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            {cat.toLowerCase()} <span className="dropdown-count">({categoryCounts[cat]})</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </div>

            {/* News Grid */}
            <div className="news-grid">
                {filteredNews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                        <p>No se encontraron noticias con los filtros seleccionados.</p>
                    </div>
                ) : (
                    filteredNews.map((item, index) => (
                        <article
                            key={`${item.source}-${index}`}
                            className="news-card"
                            data-source={item.source}
                            data-category={item.category}
                        >
                            <div className="card-content">
                                <span className={`source-badge ${item.source.toLowerCase()}`}>
                                    {item.source === 'ABC' ? 'ABC' : item.source === 'IDEAL' ? 'IDEAL' : 'EL PAÍS'}
                                </span>
                                <Link href={`/category/${item.category.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                                    <span className="category-tag" style={{ cursor: 'pointer' }}>{item.category}</span>
                                </Link>
                                <h2 className="news-title">
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
