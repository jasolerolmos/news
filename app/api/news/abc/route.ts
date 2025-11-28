import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

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
        const response = await axios.get('https://www.abc.es', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const newsList: NewsItem[] = [];
        const seenTitles = new Set<string>();

        $('article').each((_, article) => {
            const $article = $(article);

            // Find headline
            let headline = null;
            for (const tag of ['h1', 'h2', 'h3', 'h4']) {
                const found = $article.find(tag).first();
                if (found.length > 0) {
                    headline = found;
                    break;
                }
            }

            if (headline) {
                const title = headline.text().trim();
                const linkElement = $article.find('a').first();
                let url = linkElement.attr('href') || '';

                // Make URL absolute
                if (url && !url.startsWith('http')) {
                    url = `https://www.abc.es${url.startsWith('/') ? url : '/' + url}`;
                }

                // Filter valid titles
                if (title && title.length > 10 && url && !seenTitles.has(title)) {
                    const category = getCategoryFromUrl(url);
                    newsList.push({
                        title,
                        url,
                        category,
                        source: 'ABC'
                    });
                    seenTitles.add(title);
                }
            }
        });

        return NextResponse.json(newsList);
    } catch (error) {
        console.error('Error fetching ABC news:', error);
        return NextResponse.json([], { status: 500 });
    }
}
