import { NextResponse } from 'next/server';
import axios from 'axios';
import { JSDOM } from 'jsdom';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Clean URL: remove tracking parameters and fragments
    try {
        const parsedUrl = new URL(url);
        url = parsedUrl.origin + parsedUrl.pathname;
    } catch (e) {
        url = url.split('?')[0].split('#')[0];
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
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

        // Extract article content (this is a generic approach)
        const h1 = document.querySelector('h1');
        const titleTag = document.querySelector('title');
        const title = h1?.textContent?.trim() || titleTag?.textContent?.trim() || '';

        // Try to find article body
        let body = '';
        const bodySelectors = [
            'article p',
            '.article-body p',
            '.story-body p',
            'main p',
            '.content p'
        ];

        for (const selector of bodySelectors) {
            const paragraphs = document.querySelectorAll(selector);
            if (paragraphs.length > 0) {
                const texts: string[] = [];
                paragraphs.forEach((p) => {
                    let text = p.textContent?.trim() || '';
                    
                    // Filter out "Escucha el artículo" paragraphs
                    if (/Escuchar?\s+(el|este)\s+art[ií]culo/i.test(text) && text.length < 100) {
                        return;
                    }

                    // Filter out paragraphs that are mostly links (e.g. related news at the end of ABC articles)
                    const links = p.querySelectorAll('a');
                    let totalLinkTextLength = 0;
                    links.forEach(link => {
                        totalLinkTextLength += (link.textContent?.trim() || '').length;
                    });
                    
                    if (text.length > 0 && (totalLinkTextLength / text.length) > 0.7) {
                        return;
                    }

                    // Remove JS truncation artifacts "..." or "…"
                    text = text.replace(/\s*(\.\.\.|…)\s*/g, ' ');
                    
                    // Clean up extra spaces
                    text = text.replace(/\s{2,}/g, ' ').trim();

                    if (text.length > 20) {
                        texts.push(text);
                    }
                });
                body = texts.join('\n\n');
                if (body.length > 100) break;
            }
        }

        return NextResponse.json({
            title,
            body,
            url
        });
    } catch (error) {
        console.error('Error fetching article:', error);
        return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
    }
}
