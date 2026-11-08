import { NextResponse } from 'next/server';
import axios from 'axios';
import { JSDOM } from 'jsdom';

interface NewsItem {
    title: string;
    url: string;
    category: string;
    source: string;
}

// Map Xataka URL sections to clean category names
const CATEGORY_MAP: Record<string, string> = {
    'robotica-e-ia': 'IA',
    'empresas-y-economia': 'Economía',
    'ecologia-y-naturaleza': 'Ecología',
    'movilidad': 'Movilidad',
    'energia': 'Energía',
    'ciencia': 'Ciencia',
    'medicina-y-salud': 'Salud',
    'xataka-movil': 'Móviles',
    'ordenadores': 'Ordenadores',
    'videojuegos': 'Videojuegos',
    'cine-y-tv': 'Entretenimiento',
    'seguridad': 'Seguridad',
    'espacio': 'Espacio',
    'internet': 'Internet',
    'magnet': 'Curiosidades',
    'aspiradora-robotica': 'Robótica',
    'gadgets': 'Gadgets',
    'smarthome': 'Smart Home',
    'tablets': 'Tablets',
    'fotografía': 'Fotografía',
};

function getCategoryFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const segments = urlObj.pathname.split('/').filter(s => s && s.length > 1);
        if (segments.length > 0) {
            const slug = segments[0];
            return CATEGORY_MAP[slug] || (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '));
        }
    } catch (e) {
        // ignore
    }
    return 'Tecnología';
}

export async function GET(request: Request) {
    const targetUrl = 'https://www.xataka.com/index.xml';

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            },
            timeout: 15000
        });

        const dom = new JSDOM(response.data, { contentType: 'text/xml' });
        const document = dom.window.document;
        const newsList: NewsItem[] = [];
        const seenTitles = new Set<string>();

        const items = document.querySelectorAll('item');

        items.forEach((item) => {
            const title = item.querySelector('title')?.textContent?.trim() || '';
            let url = item.querySelector('link')?.textContent?.trim() || '';

            // Strip UTM tracking params from URL
            try {
                const parsed = new URL(url);
                url = parsed.origin + parsed.pathname;
            } catch (e) {
                url = url.split('?')[0];
            }

            if (title && title.length > 5 && url && !seenTitles.has(title)) {
                newsList.push({
                    title,
                    url,
                    category: getCategoryFromUrl(url),
                    source: 'XATAKA'
                });
                seenTitles.add(title);
            }
        });

        return NextResponse.json(newsList);
    } catch (error) {
        console.error('Error fetching Xataka RSS:', error);
        return NextResponse.json([], { status: 500 });
    }
}
