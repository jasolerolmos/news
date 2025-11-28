# Agregador de Noticias - ABC & El País

Sistema completo de agregación y visualización de noticias de ABC.es y ElPaís.com.

## 🚀 Inicio Rápido

### Ejecutar servidor PHP:
```bash
cd /Users/jso/gitrepo/news
php -S localhost:8080
```

Luego abrir en el navegador: `http://localhost:8080/index.php`

## 📁 Estructura del Proyecto

### Aplicaciones Web (PHP):
- **index.php** - Agregador unificado con búsqueda y filtros
- **news_list.php** - Listado de noticias ABC
- **news_list_elpais.php** - Listado de noticias El País
- **article.php** - Visualizador de artículos ABC
- **article_elpais.php** - Visualizador de artículos El País

### Scripts Python:
- **list_news.py** - Extractor de noticias ABC
- **list_news_elpais.py** - Extractor de noticias El País
- **extract_elpais_article.py** - Explorador de estructura de artículos

## ✨ Características

### Index Unificado (index.php)
- 📰 ~236 noticias combinadas (ABC + El País)
- 🔍 Búsqueda en tiempo real por título
- 🏷️ Filtro por fuente (ABC / El País / Todas)
- 📂 Filtro por categoría (dinámico)
- 📊 Contador dinámico de resultados
- 🎨 Diseño premium responsive

## 🎯 Uso

### Vía Web:
1. Iniciar servidor: php -S localhost:8080
2. Abrir: http://localhost:8080/index.php
3. Buscar, filtrar y leer noticias

### Vía Python:
```bash
python3 list_news.py          # Noticias ABC
python3 list_news_elpais.py   # Noticias El País
```

## 📊 Estadísticas

| Fuente | Noticias | Categorías |
|--------|----------|------------|
| ABC.es | ~62 | 15+ |
| El País | ~174 | 25+ |
| Total | ~236 | 35+ |
