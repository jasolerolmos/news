import urllib.request
import re

url = "https://elpais.com/"
req = urllib.request.Request(
    url, 
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'identity',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    }
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
