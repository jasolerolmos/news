import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

URL = "https://www.abc.es"

def get_category_from_url(url):
    """Extrae la categoría basada en el primer segmento de la ruta de la URL."""
    try:
        path = urlparse(url).path
        # Eliminar barras iniciales y finales y dividir
        segments = path.strip('/').split('/')
        if segments and segments[0]:
            # Si el primer segmento es 'abc', 'vocento', etc., quizás queramos el segundo
            # Pero en ABC.es suele ser: /deportes/..., /espana/..., /internacional/...
            return segments[0].upper()
    except:
        pass
    return "GENERAL"

def get_abc_news():
    print(f"Descargando portada de {URL}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(URL, headers=headers, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"Error al descargar la página: {e}")
        return

    soup = BeautifulSoup(response.text, "html.parser")
    
    # ABC.es suele usar etiquetas <article> para las noticias
    articles = soup.find_all('article')
    
    news_list = []
    
    print(f"Analizando {len(articles)} artículos encontrados...")
    
    for article in articles:
        # Intentar encontrar el titular. Suele estar en h1, h2, h3 o dentro de un enlace
        headline_tag = article.find(['h1', 'h2', 'h3', 'h4'])
        
        if headline_tag:
            title = headline_tag.get_text(strip=True)
            
            # Buscar el enlace
            link_tag = article.find('a', href=True)
            if link_tag:
                url = link_tag['href']
                # Asegurar URL absoluta
                if not url.startswith('http'):
                    url = urljoin(URL, url)
                
                # Filtrar titulares vacíos o muy cortos
                if title and len(title) > 5:
                    category = get_category_from_url(url)
                    news_list.append({
                        'title': title,
                        'url': url,
                        'category': category
                    })
    
    # Eliminar duplicados preservando orden
    seen = set()
    unique_news = []
    for news in news_list:
        if news['title'] not in seen:
            unique_news.append(news)
            seen.add(news['title'])
            
    return unique_news

def display_news(news_list):
    if not news_list:
        print("No se encontraron noticias.")
        return

    print(f"\n{'='*80}")
    print(f"NOTICIAS ENCONTRADAS EN ABC.ES ({len(news_list)})")
    print(f"{'='*80}\n")
    
    for i, news in enumerate(news_list, 1):
        print(f"{i}. [{news['category']}] {news['title']}")
        print(f"   {news['url']}")
        print("-" * 40)

if __name__ == "__main__":
    news = get_abc_news()
    if news:
        display_news(news)
