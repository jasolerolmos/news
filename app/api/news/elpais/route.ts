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
    
    // Si hay una sección, usamos el RSS de la sección, si no, el RSS de la portada
    const targetUrl = section 
        ? `https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/${encodeURIComponent(section)}/portada` 
        : 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada';

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            },
            timeout: 15000
        });

        // Parsear el XML del RSS feed
        const dom = new JSDOM(response.data, { contentType: "text/xml" });
        const document = dom.window.document;
        const newsList: NewsItem[] = [];
        const seenTitles = new Set<string>();

        const items = document.querySelectorAll('item');

        items.forEach((item) => {
            const title = item.querySelector('title')?.textContent?.trim() || '';
            let url = item.querySelector('link')?.textContent?.trim() || '';
            
            // Extraer hasta 2 categorías del feed o calcularla por la URL
            const categoryNodes = item.querySelectorAll('category');
            let category = '';
            if (categoryNodes.length > 0) {
                const cats = Array.from(categoryNodes)
                    .slice(0, 2)
                    .map(c => {
                        const txt = c.textContent?.trim() || '';
                        return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
                    });
                category = cats.join(' - ');
            }
            
            if (!category) {
                category = getCategoryFromUrl(url);
            }

            // Normalizar URL
            if (url && !url.startsWith('http')) {
                url = `https://elpais.com${url.startsWith('/') ? url : '/' + url}`;
            }

            if (title && title.length > 5 && url && !seenTitles.has(title)) {
                newsList.push({
                    title,
                    url,
                    category,
                    source: 'ELPAIS'
                });
                seenTitles.add(title);
            }
        });

        return NextResponse.json(newsList);
    } catch (error) {
        console.error('Error fetching El País RSS:', error);
        return NextResponse.json([], { status: 500 });
    }
}
