import urllib.request
import re

url = "https://elpais.com/"
req = urllib.request.Request(
    url, 
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        print(f"Total HTML length: {len(html)}")
        
        # Look for article tags
        articles = re.findall(r'<article[^>]*>.*?</article>', html, re.IGNORECASE | re.DOTALL)
        print(f"Found {len(articles)} <article> tags")
        
        if not articles:
            # Let's find h2 tags
            h2_tags = re.findall(r'(<h2[^>]*>.*?</h2>)', html, re.IGNORECASE | re.DOTALL)
            print(f"Found {len(h2_tags)} <h2> tags. First few:")
            for h2 in h2_tags[:5]:
                print(h2)
                
            # Let's look for standard card divs
            cards = re.findall(r'(<div class="c"[^>]*>.*?</div>)', html, re.IGNORECASE | re.DOTALL)
            print(f"Found {len(cards)} <div class=\"c\"> tags.")
            
except Exception as e:
    print(f"Error: {e}")
