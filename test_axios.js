const axios = require('axios');
const { JSDOM } = require('jsdom');

async function test() {
    try {
        const response = await axios.get('https://elpais.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            },
            timeout: 15000
        });
        
        console.log("Success! Data length:", response.data.length);
        const dom = new JSDOM(response.data);
        const articles = dom.window.document.querySelectorAll('article');
        console.log(`Found ${articles.length} articles.`);
        
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Status:", e.response.status);
        }
    }
}
test();
