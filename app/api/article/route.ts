import { NextResponse } from 'next/server';
import axios from 'axios';
import { JSDOM } from 'jsdom';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
                    const text = p.textContent?.trim() || '';
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
