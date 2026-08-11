import urllib.request
import re

def test_category(url):
    req = urllib.request.Request(
        url, 
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Upgrade-Insecure-Requests': '1'
        }
    )

    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            articles = re.findall(r'(<article[^>]*>.*?</article>)', html, re.IGNORECASE | re.DOTALL)
            print(f"{url}: Found {len(articles)} <article> tags")
    except Exception as e:
        print(f"Error on {url}: {e}")

test_category("https://elpais.com/internacional/")
test_category("https://www.abc.es/internacional/")
