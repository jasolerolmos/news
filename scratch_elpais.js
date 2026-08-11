const axios = require('axios');
const { JSDOM } = require('jsdom');

async function checkElPais() {
    try {
        const response = await axios.get('https://elpais.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });

        const dom = new JSDOM(response.data);
        const document = dom.window.document;

        const articles = document.querySelectorAll('article');
        console.log(`Found ${articles.length} <article> tags.`);

        if (articles.length === 0) {
            // Find what they are using instead
            const headers = document.querySelectorAll('h2');
            console.log(`Found ${headers.length} <h2> tags. Let's look at the first few:`);
            for (let i = 0; i < Math.min(5, headers.length); i++) {
                console.log(`H2: ${headers[i].textContent.trim()}`);
                const parent = headers[i].parentElement;
                console.log(`  Parent tag: ${parent.tagName}, class: ${parent.className}`);
                const link = headers[i].querySelector('a') || parent.querySelector('a');
                console.log(`  Link: ${link ? link.href : 'None'}`);
            }
        } else {
            // Check the first article
            const article = articles[0];
            console.log("First article HTML snippet:");
            console.log(article.outerHTML.substring(0, 300) + '...');
        }
    } catch (e) {
        console.error(e.message);
    }
}

checkElPais();
