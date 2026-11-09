import requests
from bs4 import BeautifulSoup
import json

# URL de ejemplo de una noticia de El País
URL = "https://elpais.com/espana/2025-11-28/el-psoe-reivindica-que-expulso-a-abalos-hace-20-meses-pero-admite-la-dureza-del-golpe-el-segundo-secretario-de-organizacion-en-la-carcel.html"

def extract_elpais_article(url):
    print(f"Descargando artículo de: {url}\n")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"Error al descargar: {e}")
        return
    
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Buscar el elemento <article>
    article = soup.find('article')
    
    if not article:
        print("❌ No se encontró elemento <article>")
        return
    
    print("✅ Elemento <article> encontrado\n")
    print(f"{'='*80}")
    print("EXPLORANDO ESTRUCTURA DEL ARTÍCULO")
    print(f"{'='*80}\n")
    
    # 1. Buscar título
    headline = None
    for tag in ['h1', 'h2']:
        h = article.find(tag)
        if h:
            headline = h.get_text(strip=True)
            print(f"📰 TITULAR ({tag}): {headline}\n")
            break
    
    # 2. Buscar subtítulo/descripción
    description = None
    # Común en El País: <h2 class="a_st">
    subtitle = article.find('h2', class_=lambda x: x and 'a_st' in x if x else False)
    if subtitle:
        description = subtitle.get_text(strip=True)
        print(f"📝 SUBTÍTULO: {description}\n")
    
    # 3. Buscar autor y fecha
    author = article.find(class_=lambda x: x and 'author' in x.lower() if x else False)
    if author:
        print(f"✍️ AUTOR: {author.get_text(strip=True)}\n")
    
    date = article.find('time')
    if date:
        print(f"📅 FECHA: {date.get_text(strip=True)}\n")
    
    # 4. Buscar cuerpo del artículo
    # El País suele usar divs con clases específicas para el contenido
    body_container = article.find('div', class_=lambda x: x and ('article-body' in x or 'a_c' in x) if x else False)
    
    if not body_container:
        # Buscar todos los párrafos dentro del article
        paragraphs = article.find_all('p')
        print(f"📄 CUERPO DEL ARTÍCULO ({len(paragraphs)} párrafos encontrados):\n")
        print("-" * 80)
        for i, p in enumerate(paragraphs[:5], 1):  # Mostrar solo los primeros 5
            text = p.get_text(strip=True)
            if len(text) > 50:  # Filtrar párrafos muy cortos
                print(f"{i}. {text}\n")
    else:
        paragraphs = body_container.find_all('p')
        print(f"📄 CUERPO DEL ARTÍCULO ({len(paragraphs)} párrafos encontrados):\n")
        print("-" * 80)
        for i, p in enumerate(paragraphs[:5], 1):
            text = p.get_text(strip=True)
            if text:
                print(f"{i}. {text}\n")
    
    # 5. Buscar si hay JSON-LD con metadatos
    print(f"\n{'='*80}")
    print("BUSCANDO METADATOS JSON-LD")
    print(f"{'='*80}\n")
    
    json_ld_scripts = soup.find_all('script', type='application/ld+json')
    if json_ld_scripts:
        print(f"✅ Encontrados {len(json_ld_scripts)} scripts JSON-LD\n")
        for i, script in enumerate(json_ld_scripts, 1):
            try:
                data = json.loads(script.string)
                print(f"--- JSON-LD #{i} ---")
                if isinstance(data, dict):
                    if '@type' in data:
                        print(f"Tipo: {data.get('@type')}")
                    if data.get('@type') == 'NewsArticle':
                        print(f"Headline: {data.get('headline', 'N/A')}")
                        print(f"Description: {data.get('description', 'N/A')}")
                        print(f"Author: {data.get('author', 'N/A')}")
                        print(f"DatePublished: {data.get('datePublished', 'N/A')}")
                print()
            except:
                print(f"Error parseando JSON-LD #{i}\n")
    else:
        print("❌ No se encontraron scripts JSON-LD")
    
    print(f"\n{'='*80}")
    print("RESUMEN DE CAMPOS EXTRAÍDOS")
    print(f"{'='*80}\n")
    
    result = {
        'headline': headline,
        'description': description,
        'url': url
    }
    
    for key, value in result.items():
        print(f"{key}: {value[:100] if value and len(value) > 100 else value}")

if __name__ == "__main__":
    extract_elpais_article(URL)
