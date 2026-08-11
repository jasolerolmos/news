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
        articles = re.findall(r'(<article[^>]*>.*?</article>)', html, re.IGNORECASE | re.DOTALL)
        
        for i, article in enumerate(articles[:3]):
            print(f"--- Article {i} ---")
            
            # Find h tags
            h_tags = re.findall(r'(<h[1-6][^>]*>.*?</h[1-6]>)', article, re.IGNORECASE | re.DOTALL)
            print("Headers:", h_tags)
            
            # Find links
            a_tags = re.findall(r'<a[^>]+href="([^"]+)"[^>]*>.*?</a>', article, re.IGNORECASE | re.DOTALL)
            print("Links:", a_tags)
            
except Exception as e:
    print(f"Error: {e}")
