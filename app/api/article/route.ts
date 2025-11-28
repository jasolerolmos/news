import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

        const $ = cheerio.load(response.data);

        // Extract article content (this is a generic approach)
        const title = $('h1').first().text().trim() || $('title').first().text().trim();

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
            const paragraphs = $(selector);
            if (paragraphs.length > 0) {
                body = paragraphs
                    .map((_, el) => $(el).text().trim())
                    .get()
                    .filter(p => p.length > 20)
                    .join('\n\n');
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
