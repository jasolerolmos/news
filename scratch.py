import urllib.request
from bs4 import BeautifulSoup
import re

req = urllib.request.Request('https://www.abc.es/espana/abci-sanchez-viaja-marriuecos-crisis-202302011234_noticia.html', headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
except Exception as e:
    req = urllib.request.Request('https://www.abc.es/', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    links = re.findall(r'href="(https://www.abc.es/.*?\.html)"', html)
    url = links[0]
    html = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})).read().decode('utf-8')

soup = BeautifulSoup(html, 'html.parser')
scripts = soup.find_all('script')
for s in scripts:
    if s.get('id') == 'evo-swg-markup':
        print("Found evo-swg-markup")
        print(s.string[:500])
        print("-------")
        print(s.string[-1000:])
        break
else:
    print("No evo-swg-markup found")
    # print body paragraphs
    ps = soup.find_all('p')
    for p in ps:
        if len(p.text) > 100:
            print(p.text[:100])
