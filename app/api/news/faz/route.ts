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
        // Filtramos segmentos y omitimos 'aktuell' que es común en FAZ
        const segments = urlObj.pathname.split('/').filter(s => s && s.length > 2 && s !== 'aktuell');
        
        if (segments.length > 0) {
            let rawCat = segments[0].replace(/-/g, ' ');
            let cat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();
            
            // Si hay subcategoría y no contiene punto
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
    const targetUrl = 'https://www.faz.net/rss/aktuell';

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            },
            timeout: 15000
        });

        // Parse XML feed
        const dom = new JSDOM(response.data, { contentType: "text/xml" });
        const document = dom.window.document;
        const newsList: NewsItem[] = [];
        const seenTitles = new Set<string>();

        const items = document.querySelectorAll('item');

        items.forEach((item) => {
            const title = item.querySelector('title')?.textContent?.trim() || '';
            let url = item.querySelector('link')?.textContent?.trim() || '';
            
            if (title && title.length > 5 && url && !seenTitles.has(title)) {
                const category = getCategoryFromUrl(url);
                newsList.push({
                    title,
                    url,
                    category,
                    source: 'FAZ'
                });
                seenTitles.add(title);
            }
        });

        return NextResponse.json(newsList);
    } catch (error) {
        console.error('Error fetching FAZ RSS:', error);
        return NextResponse.json([], { status: 500 });
    }
}
