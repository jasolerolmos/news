import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

URL = "https://elpais.com/"

def get_category_from_url(url):
    """Extrae la categoría basada en el primer segmento de la ruta de la URL."""
    try:
        path = urlparse(url).path
        segments = path.strip('/').split('/')
        if segments and segments[0]:
            return segments[0].upper()
    except:
        pass
    return "GENERAL"

def get_elpais_news():
    print(f"Descargando portada de {URL}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        response = requests.get(URL, headers=headers, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"Error al descargar la página: {e}")
        return

    soup = BeautifulSoup(response.text, "html.parser")
    
    # Primero vamos a explorar la estructura
    print(f"\n{'='*80}")
    print("EXPLORANDO ESTRUCTURA HTML")
    print(f"{'='*80}\n")
    
    # Buscar artículos por diferentes criterios comunes
    articles = soup.find_all('article')
    print(f"Artículos encontrados con <article>: {len(articles)}")
    
    # Buscar por clases comunes
    news_items = soup.find_all(class_=lambda x: x and 'article' in x.lower() if x else False)
    print(f"Elementos con 'article' en clase: {len(news_items)}")
    
    # Mostrar algunos ejemplos de estructura
    if articles:
        print("\n--- Ejemplo de estructura <article> ---")
        first = articles[0]
        print(f"Clases: {first.get('class', [])}")
        headline = first.find(['h1', 'h2', 'h3', 'h4'])
        if headline:
            print(f"Titular encontrado: {headline.get_text(strip=True)[:100]}")
        link = first.find('a', href=True)
        if link:
            print(f"Enlace: {link['href'][:100]}")
    
    news_list = []
    seen_titles = set()
    
    # Intentar extraer noticias
    for article in articles:
        # Buscar titular
        headline_tag = article.find(['h1', 'h2', 'h3', 'h4'])
        
        if headline_tag:
            title = headline_tag.get_text(strip=True)
            
            # Buscar enlace
            link_tag = article.find('a', href=True)
            if link_tag:
                url = link_tag['href']
                
                # Asegurar URL absoluta
                if not url.startswith('http'):
                    url = urljoin(URL, url)
                
                # Filtrar titulares válidos
                if title and len(title) > 10 and title not in seen_titles:
                    category = get_category_from_url(url)
                    news_list.append({
                        'title': title,
                        'url': url,
                        'category': category
                    })
                    seen_titles.add(title)
            
    return news_list

def display_news(news_list):
    if not news_list:
        print("\nNo se encontraron noticias.")
        return

    print(f"\n{'='*80}")
    print(f"NOTICIAS ENCONTRADAS EN ELPAIS.COM ({len(news_list)})")
    print(f"{'='*80}\n")
    
    for i, news in enumerate(news_list, 1):
        print(f"{i}. [{news['category']}] {news['title']}")
        print(f"   {news['url']}")
        print("-" * 80)

if __name__ == "__main__":
    news = get_elpais_news()
    if news:
        display_news(news)
