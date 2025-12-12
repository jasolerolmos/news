<?php
// news_list.php

function getCategoryFromUrl($url) {
    $path = parse_url($url, PHP_URL_PATH);
    $segments = explode('/', trim($path, '/'));
    if (!empty($segments) && !empty($segments[0])) {
        return strtoupper($segments[0]);
    }
    return 'GENERAL';
}

function fetchNews() {
    $url = "https://www.abc.es";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    
    $html = curl_exec($ch);
    
    if (curl_errno($ch)) {
        return [];
    }
    curl_close($ch);

    $dom = new DOMDocument();
    @$dom->loadHTML($html);
    
    $articles = $dom->getElementsByTagName('article');
    $newsList = [];
    $seenTitles = [];

    foreach ($articles as $article) {
        $headlineNode = null;
        // Buscar encabezados h1-h4
        foreach (['h1', 'h2', 'h3', 'h4'] as $tag) {
            $nodes = $article->getElementsByTagName($tag);
            if ($nodes->length > 0) {
                $headlineNode = $nodes->item(0);
                break;
            }
        }

        if ($headlineNode) {
            $title = trim($headlineNode->textContent);
            
            // Buscar enlace
            $linkNode = $article->getElementsByTagName('a')->item(0);
            $url = $linkNode ? $linkNode->getAttribute('href') : '';
            
            // Asegurar URL absoluta
            if ($url && strpos($url, 'http') !== 0) {
                $url = "https://www.abc.es" . ltrim($url, '/');
            }

            if (!empty($title) && strlen($title) > 10 && !in_array($title, $seenTitles)) {
                $category = getCategoryFromUrl($url);
                $newsList[] = [
                    'title' => $title,
                    'url' => $url,
                    'category' => $category
                ];
                $seenTitles[] = $title;
            }
        }
    }
    return $newsList;
}

$news = fetchNews();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ABC News Explorer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #f9fafb;
            --card-bg: #ffffff;
            --text-primary: #111827;
            --text-secondary: #4b5563;
            --accent-color: #2563eb;
            --accent-hover: #1d4ed8;
            --border-color: #e5e7eb;
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-primary);
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }

        header {
            margin-bottom: 3rem;
            text-align: center;
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 800;
            letter-spacing: -0.025em;
            margin-bottom: 1rem;
            background: linear-gradient(to right, #111827, #4b5563);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            color: var(--text-secondary);
            font-size: 1.1rem;
        }

        /* Filter Bar */
        .filter-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: center;
            margin-bottom: 2.5rem;
            padding: 0.5rem;
            background: var(--card-bg);
            border-radius: 1rem;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-sm);
        }

        .filter-btn {
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            border: 1px solid transparent;
            background: transparent;
            color: var(--text-secondary);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .filter-btn:hover {
            background-color: var(--bg-color);
            color: var(--text-primary);
        }

        .filter-btn.active {
            background-color: var(--text-primary);
            color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* News Grid */
        .news-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
        }

        .news-card {
            background: var(--card-bg);
            border-radius: 1rem;
            overflow: hidden;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-sm);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            position: relative;
            height: 100%;
        }

        .news-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-lg);
            border-color: var(--accent-color);
        }

        .card-content {
            padding: 1.5rem;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .source-badge {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: rgba(0, 0, 0, 0.75);
            color: white;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 0.35rem 0.75rem;
            border-radius: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            backdrop-filter: blur(10px);
        }

        .category-tag {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--accent-color);
            margin-bottom: 0.75rem;
        }

        .news-title {
            font-family: 'Merriweather', serif;
            font-size: 1.25rem;
            font-weight: 700;
            line-height: 1.4;
            color: var(--text-primary);
            margin-bottom: 1rem;
            flex-grow: 1;
        }

        .news-link {
            text-decoration: none;
            color: inherit;
        }

        .news-link:after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        }

        .card-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border-color);
            background-color: #fcfcfc;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .read-more {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--accent-color);
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .read-more svg {
            width: 16px;
            height: 16px;
            transition: transform 0.2s ease;
        }

        .news-card:hover .read-more svg {
            transform: translateX(4px);
        }

        /* Loading State */
        .loading {
            text-align: center;
            padding: 4rem;
            color: var(--text-secondary);
        }

        @media (max-width: 640px) {
            .container {
                padding: 1rem;
            }
            h1 {
                font-size: 2rem;
            }
            .news-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>ABC News Explorer</h1>
            <p class="subtitle">Últimas noticias extraídas en tiempo real</p>
        </header>

        <div id="filter-container" class="filter-container">
            <button class="filter-btn active" data-category="all">Todas</button>
            <!-- Categories will be injected here by JS -->
        </div>

        <div class="news-grid" id="news-grid">
            <?php if (empty($news)): ?>
                <div class="loading">
                    <p>No se pudieron cargar las noticias. Verifica tu conexión o intenta más tarde.</p>
                </div>
            <?php else: ?>
                <?php foreach ($news as $item): ?>
                    <article class="news-card" data-category="<?php echo htmlspecialchars($item['category']); ?>">
                        <div class="card-content">
                            <span class="source-badge">ABC</span>
                            <span class="category-tag"><?php echo htmlspecialchars($item['category']); ?></span>
                            <h2 class="news-title">
                                <a href="<?php echo htmlspecialchars($item['url']); ?>" class="news-link" target="_blank">
                                    <?php echo htmlspecialchars($item['title']); ?>
                                </a>
                            </h2>
                        </div>
                        <div class="card-footer">
                            <span class="read-more">
                                Leer noticia
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </span>
                        </div>
                    </article>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const grid = document.getElementById('news-grid');
            const cards = grid.querySelectorAll('.news-card');
            const filterContainer = document.getElementById('filter-container');
            
            // 1. Extract unique categories
            const categories = new Set();
            cards.forEach(card => {
                const cat = card.getAttribute('data-category');
                if (cat) categories.add(cat);
            });

            // 2. Create filter buttons
            Array.from(categories).sort().forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.textContent = cat;
                btn.setAttribute('data-category', cat);
                filterContainer.appendChild(btn);
            });

            // 3. Filter logic
            const buttons = filterContainer.querySelectorAll('.filter-btn');
            
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active state
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const targetCat = btn.getAttribute('data-category');

                    // Filter cards with animation
                    cards.forEach(card => {
                        if (targetCat === 'all' || card.getAttribute('data-category') === targetCat) {
                            card.style.display = 'flex';
                            setTimeout(() => {
                                card.style.opacity = '1';
                                card.style.transform = 'translateY(0)';
                            }, 50);
                        } else {
                            card.style.opacity = '0';
                            card.style.transform = 'translateY(10px)';
                            setTimeout(() => {
                                card.style.display = 'none';
                            }, 300);
                        }
                    });
                });
            });
        });
    </script>
</body>
</html>
