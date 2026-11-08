import { NextResponse } from 'next/server';
import axios from 'axios';
import { JSDOM } from 'jsdom';

interface NewsItem {
    title: string;
    url: string;
    category: string;
    source: string;
}

function getCategoryFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        // Filtramos segmentos numéricos (año, mes, día, id)
        const segments = urlObj.pathname.split('/').filter(s => s && s.length > 2 && !/^\d+$/.test(s));
        
        if (segments.length > 0) {
            let cat = segments[0].replace(/-/g, ' ');
            cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
            
            // Subcategoría opcional si existe
            if (segments.length > 1 && !segments[1].includes('.') && segments[1].length > 2 && !/^\d+$/.test(segments[1])) {
                let sub = segments[1].replace(/-/g, ' ');
                cat += ' - ' + sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
            }
            return cat;
        }
    } catch (e) {
        // ignore
    }
    return 'General';
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    
    const targetUrl = section 
        ? `https://www.diariodemallorca.es/${encodeURIComponent(section)}/` 
        : 'https://www.diariodemallorca.es/';

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            },
            timeout: 15000
        });

        const dom = new JSDOM(response.data);
        const document = dom.window.document;
        const newsList: NewsItem[] = [];
        const seenTitles = new Set<string>();

        const articles = document.querySelectorAll('article');

        articles.forEach((article) => {
            let headline = null;
            for (const tag of ['h1', 'h2', 'h3', 'h4']) {
                const found = article.querySelector(tag);
                if (found) {
                    headline = found;
                    break;
                }
            }

            if (headline) {
                const title = headline.textContent?.trim().replace(/\s+/g, ' ') || '';
                const linkElement = article.querySelector('a[href]');
                let url = linkElement?.getAttribute('href') || '';

                if (url && !url.startsWith('http')) {
                    url = `https://www.diariodemallorca.es${url.startsWith('/') ? url : '/' + url}`;
                }

                // Descartar suscripciones y urls vacías
                if (url.includes('micuenta.diariodemallorca.es') || url.includes('/tp/suscripcion')) {
                    return;
                }

                if (title && title.length > 8 && url && !seenTitles.has(title)) {
                    newsList.push({
                        title,
                        url,
                        category: getCategoryFromUrl(url),
                        source: 'DIARIODEMALLORCA'
                    });
                    seenTitles.add(title);
                }
            }
        });

        return NextResponse.json(newsList);
    } catch (error) {
        console.error('Error fetching Diario de Mallorca news:', error);
        return NextResponse.json([], { status: 500 });
    }
}
