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
        // Exclude common generic paths
        const segments = urlObj.pathname.split('/').filter(s => s && s.length > 2 && s !== 'projekte' && s !== 'artikel' && s !== 'suche');
        
        if (segments.length > 0) {
            let rawCat = segments[0].replace(/-/g, ' ');
            let cat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();
            
            // Subcategory check:
            // Must have length < 25 and not contain numbers to differentiate subcategories (like "landkreis-muenchen")
            // from article slugs (which are long and typically contain numbers/hashes).
            if (segments.length > 1 && 
                !segments[1].includes('.') && 
                segments[1].length > 2 && 
                segments[1].length < 25 && 
                !/\d/.test(segments[1])) {
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
    const targetUrl = 'https://www.sueddeutsche.de/';

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
        
        // Remove style, script, and noscript tags to avoid getting CSS text in textContent
        document.querySelectorAll('style, script, noscript').forEach(el => el.remove());

        const newsList: NewsItem[] = [];
        const seenTitles = new Set<string>();

        const articles = document.querySelectorAll('article');

        articles.forEach((article) => {
            const a = article.querySelector('a');
            const h = article.querySelector('h1, h2, h3, h4, h5, h6, [data-teaser-role="title"], .sz-teaser__title, [class*="title"], [class*="headline"]');
            
            let title = h ? h.textContent?.trim() : (a ? a.textContent?.trim() : '');
            let url = a ? a.getAttribute('href') : '';

            if (title && url) {
                // Clean spaces and newlines
                title = title.replace(/\s+/g, ' ');

                // Prepend overline/label if present and not already part of the title
                const label = article.querySelector('[class*="label"], [class*="overline"], [data-teaser-role="overline"]');
                const labelText = label ? label.textContent?.trim().replace(/\s+/g, ' ') : '';
                if (labelText && !title.startsWith(labelText)) {
                    title = `${labelText}:${title}`;
                }

                // Ensure absolute URL
                if (!url.startsWith('http')) {
                    url = `https://www.sueddeutsche.de${url.startsWith('/') ? url : '/' + url}`;
                }

                // Filter valid articles
                if (title.length > 10 && !seenTitles.has(title)) {
                    const category = getCategoryFromUrl(url);
                    newsList.push({
                        title,
                        url,
                        category,
                        source: 'SZ'
                    });
                    seenTitles.add(title);
                }
            }
        });

        return NextResponse.json(newsList);
    } catch (error) {
        console.error('Error fetching Süddeutsche Zeitung HTML:', error);
        return NextResponse.json([], { status: 500 });
    }
}
