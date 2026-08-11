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
            let cat = segments[0].charAt(0).toUpperCase() + segments[0].slice(1).toLowerCase();
            // Si hay subcategoría y no es un archivo .html u otros sufijos raros
            if (segments.length > 1 && !segments[1].includes('.') && segments[1].length > 2) {
                cat += ' - ' + segments[1].charAt(0).toUpperCase() + segments[1].slice(1).toLowerCase();
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
    
    // Si hay una sección, construimos la URL de la sección, si no, la portada
    const targetUrl = section ? `https://www.ideal.es/${encodeURIComponent(section)}/` : 'https://www.ideal.es/';

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            },
            timeout: 15000
        });

        const dom = new JSDOM(response.data);
        const document = dom.window.document;
        const newsList: NewsItem[] = [];
        const seenTitles = new Set<string>();

        const articles = document.querySelectorAll('article');

        articles.forEach((article) => {
            // Find headline
            let headline = null;
            for (const tag of ['h1', 'h2', 'h3', 'h4']) {
                const found = article.querySelector(tag);
                if (found) {
                    headline = found;
                    break;
                }
            }

            if (headline) {
                const title = headline.textContent?.trim() || '';
                const linkElement = article.querySelector('a');
                let url = linkElement?.getAttribute('href') || '';

                // Make URL absolute
                if (url && !url.startsWith('http')) {
                    url = `https://www.ideal.es${url.startsWith('/') ? url : '/' + url}`;
                }

                // Filter valid titles
                if (title && title.length > 10 && url && !seenTitles.has(title)) {
                    const category = getCategoryFromUrl(url);
                    newsList.push({
                        title,
                        url,
                        category,
                        source: 'IDEAL'
                    });
                    seenTitles.add(title);
                }
            }
        });

        return NextResponse.json(newsList);
    } catch (error) {
        console.error('Error fetching IDEAL news:', error);
        return NextResponse.json([], { status: 500 });
    }
}
