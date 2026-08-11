import urllib.request
from bs4 import BeautifulSoup
import gzip

url = 'https://www.abc.es/'
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate'
})

try:
    response = urllib.request.urlopen(req, timeout=15)
    if response.info().get('Content-Encoding') == 'gzip':
        html = gzip.decompress(response.read()).decode('utf-8')
    else:
        html = response.read().decode('utf-8')
    
    soup = BeautifulSoup(html, 'html.parser')
    articles = soup.find_all('article')
    for i, a in enumerate(articles[:5]):
        print(f"Article {i+1}:")
        print(f"  Headline: {a.find(['h1', 'h2', 'h3', 'h4']).get_text(strip=True) if a.find(['h1', 'h2', 'h3', 'h4']) else 'N/A'}")
        
        # try to find category label
        label = a.find(class_=lambda c: c and ('section' in c.lower() or 'category' in c.lower() or 'label' in c.lower() or 'tag' in c.lower() or 'kicker' in c.lower() or 'seccion' in c.lower()))
        print(f"  Category Label: {label.get_text(strip=True) if label else 'None'}")
        
        link = a.find('a')
        print(f"  URL: {link.get('href') if link else 'None'}")
        print("---")
except Exception as e:
    print(f"Error: {e}")
