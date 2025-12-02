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
        const segments = urlObj.pathname.split('/').filter(s => s);
        if (segments.length > 0 && segments[0]) {
            return segments[0].toUpperCase();
        }
    } catch (e) {
        // ignore
    }
    return 'GENERAL';
}

export async function GET() {
    try {
        const response = await axios.get('https://elpais.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
                    url = `https://elpais.com${url.startsWith('/') ? url : '/' + url}`;
                }

                // Filter valid titles
                if (title && title.length > 10 && url && !seenTitles.has(title)) {
                    const category = getCategoryFromUrl(url);
                    newsList.push({
                        title,
                        url,
                        category,
                        source: 'ELPAIS'
                    });
                    seenTitles.add(title);
                }
            }
        });

        return NextResponse.json(newsList);
    } catch (error) {
        console.error('Error fetching El País news:', error);
        return NextResponse.json([], { status: 500 });
    }
}
