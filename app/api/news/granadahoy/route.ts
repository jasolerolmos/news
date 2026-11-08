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
        const segments = urlObj.pathname.split('/').filter(s => s && s.length > 2);
        
        if (segments.length > 0) {
            // Reemplazar guiones por espacios para mejor legibilidad
            let rawCat = segments[0].replace(/-/g, ' ');
            let cat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();
            
            // Si hay subcategoría y no es un archivo .html u otros sufijos raros
            if (segments.length > 1 && !segments[1].includes('.') && segments[1].length > 2) {
                let rawSub = segments[1].replace(/-/g, ' ');
                cat += ' - ' + rawSub.charAt(0).toUpperCase() + rawSub.slice(1).toLowerCase();
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
    
    // Si hay una sección, la añadimos a la URL, si no, la portada
    const targetUrl = section ? `https://www.granadahoy.com/${encodeURIComponent(section)}/` : 'https://www.granadahoy.com/';

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 15000
        });

        const dom = new JSDOM(response.data);
        const document = dom.window.document;
        const newsList: NewsItem[] = [];
        const seenTitles = new Set<string>();

        const articles = document.querySelectorAll('article');

        articles.forEach((article) => {
            const headlineMeta = article.querySelector('meta[itemprop="headline"]') || article.querySelector('meta[itemprop="name"]');
            const urlMeta = article.querySelector('meta[itemprop="url"]');
            
            const title = headlineMeta ? headlineMeta.getAttribute('content')?.trim() : '';
            let url = urlMeta ? urlMeta.getAttribute('content')?.trim() : '';

            if (title && url) {
                // Asegurar URL absoluta
                if (!url.startsWith('http')) {
                    url = `https://www.granadahoy.com${url.startsWith('/') ? url : '/' + url}`;
                }

                // Filtrar duplicados y títulos válidos
                if (title.length > 10 && !seenTitles.has(title)) {
                    const category = getCategoryFromUrl(url);
                    newsList.push({
                        title,
                        url,
                        category,
                        source: 'GRANADAHOY'
                    });
                    seenTitles.add(title);
                }
            }
        });

        return NextResponse.json(newsList);
    } catch (error) {
        console.error('Error fetching Granada Hoy news:', error);
        return NextResponse.json([], { status: 500 });
    }
}
