const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

async function fetchArticle() {
    const url = 'https://www.abc.es/sociedad/crimen-mocejon-pueblo-conmocionado-asesinato-mateo-jovenes-20240819125010-nt.html'; // Or any other article
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
    });
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    const bodySelectors = [
        'article p',
        '.article-body p',
        '.story-body p',
        'main p',
        '.content p',
        '.voc-p'
    ];
    let body = '';
    for (const selector of bodySelectors) {
        const paragraphs = document.querySelectorAll(selector);
        if (paragraphs.length > 0) {
            const texts = [];
            paragraphs.forEach((p) => {
                const text = p.textContent.trim() || '';
                if (text.length > 20) {
                    texts.push(text);
                }
            });
            body = texts.join('\n\n');
            if (body.length > 100) break;
        }
    }
    console.log(body.substring(0, 500));
    console.log("-------");
    console.log(body.substring(body.length - 1000));
}
fetchArticle();
