<?php
// news_list_elpais.php

function getCategoryFromUrl($url) {
    $path = parse_url($url, PHP_URL_PATH);
    $segments = explode('/', trim($path, '/'));
    if (!empty($segments) && !empty($segments[0])) {
        return strtoupper($segments[0]);
    }
    return 'GENERAL';
}

function fetchElPaisNews() {
    $url = "https://elpais.com/";
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
                $url = "https://elpais.com" . (strpos($url, '/') === 0 ? $url : '/' . $url);
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

$news = fetchElPaisNews();
$totalNews = count($news);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>El País News Explorer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #f9fafb;
            --card-bg: #ffffff;
            --text-primary: #111827;
            --text-secondary: #4b5563;
            --accent-color: #1976d2;
            --accent-hover: #1565c0;
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
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }

        header {
            margin-bottom: 3rem;
            text-align: center;
        }

        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        h1 {
            font-size: 2.75rem;
            font-weight: 900;
            letter-spacing: -0.025em;
            background: linear-gradient(135deg, #1976d2, #0d47a1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            color: var(--text-secondary);
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }

        .stats {
            display: inline-block;
            background: var(--card-bg);
            padding: 0.5rem 1.5rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--accent-color);
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border-color);
        }

        /* Filter Bar */
        .filter-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            justify-content: center;
            margin-bottom: 2.5rem;
            padding: 1rem;
            background: var(--card-bg);
            border-radius: 1rem;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-md);
        }

        .filter-btn {
            padding: 0.6rem 1.25rem;
            border-radius: 9999px;
            border: 1px solid var(--border-color);
            background: transparent;
            color: var(--text-secondary);
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: capitalize;
        }

        .filter-btn:hover {
            background-color: var(--bg-color);
            color: var(--text-primary);
            border-color: var(--accent-color);
        }

        .filter-btn.active {
            background: linear-gradient(135deg, #1976d2, #0d47a1);
            color: white;
            border-color: transparent;
            box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
        }

        /* News Grid */
        .news-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.75rem;
        }

        .news-card {
            background: var(--card-bg);
            border-radius: 1rem;
            overflow: hidden;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-sm);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            position: relative;
            height: 100%;
        }

        .news-card:hover {
            transform: translateY(-6px);
            box-shadow: var(--shadow-lg);
            border-color: var(--accent-color);
        }

        .card-content {
            padding: 1.75rem;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .source-badge {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: rgba(25, 118, 210, 0.9);
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
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: white;
            background: linear-gradient(135deg, #1976d2, #0d47a1);
            padding: 0.35rem 0.85rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
            width: fit-content;
            box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
        }

        .news-title {
            font-family: 'Merriweather', serif;
            font-size: 1.2rem;
            font-weight: 700;
            line-height: 1.45;
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
            padding: 1.25rem 1.75rem;
            border-top: 1px solid var(--border-color);
            background: linear-gradient(to bottom, #fcfcfc, #fafafa);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .read-more {
            font-size: 0.875rem;
            font-weight: 700;
            color: var(--accent-color);
            display: flex;
            align-items: center;
            gap: 0.35rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .read-more svg {
            width: 18px;
            height: 18px;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .news-card:hover .read-more svg {
            transform: translateX(6px);
        }

        /* Loading State */
        .loading {
            text-align: center;
            padding: 4rem;
            color: var(--text-secondary);
        }

        /* Smooth transitions */
        .news-card {
            opacity: 1;
            transform: translateY(0);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            h1 {
                font-size: 2.25rem;
            }
            .news-grid {
                grid-template-columns: 1fr;
                gap: 1.25rem;
            }
            .filter-container {
                padding: 0.75rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo-container">
                <h1>El País Explorer</h1>
            </div>
            <p class="subtitle">Noticias extraídas en tiempo real</p>
            <div class="stats">📰 <?php echo $totalNews; ?> noticias encontradas</div>
        </header>

        <div id="filter-container" class="filter-container">
            <button class="filter-btn active" data-category="all">Todas</button>
            <!-- Categories will be injected here by JS -->
        </div>

        <div class="news-grid" id="news-grid">
            <?php if (empty($news)): ?>
                <div class="loading">
                    <p>⚠️ No se pudieron cargar las noticias. Verifica tu conexión o intenta más tarde.</p>
                </div>
            <?php else: ?>
                <?php foreach ($news as $item): ?>
                    <article class="news-card" data-category="<?php echo htmlspecialchars($item['category']); ?>">
                        <div class="card-content">
                            <span class="source-badge">EL PAÍS</span>
                            <span class="category-tag"><?php echo htmlspecialchars($item['category']); ?></span>
                            <h2 class="news-title">
                                <a href="article_elpais.php?url=<?php echo urlencode($item['url']); ?>" class="news-link">
                                    <?php echo htmlspecialchars($item['title']); ?>
                                </a>
                            </h2>
                        </div>
                        <div class="card-footer">
                            <span class="read-more">
                                Leer más
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
            
            // Extract unique categories
            const categories = new Set();
            cards.forEach(card => {
                const cat = card.getAttribute('data-category');
                if (cat) categories.add(cat);
            });

            // Create filter buttons
            Array.from(categories).sort().forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.textContent = cat.toLowerCase();
                btn.setAttribute('data-category', cat);
                filterContainer.appendChild(btn);
            });

            // Filter logic
            const buttons = filterContainer.querySelectorAll('.filter-btn');
            
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active state
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const targetCat = btn.getAttribute('data-category');

                    // Filter cards with smooth animation
                    cards.forEach(card => {
                        if (targetCat === 'all' || card.getAttribute('data-category') === targetCat) {
                            card.style.display = 'flex';
                            setTimeout(() => {
                                card.style.opacity = '1';
                                card.style.transform = 'translateY(0)';
                            }, 50);
                        } else {
                            card.style.opacity = '0';
                            card.style.transform = 'translateY(20px)';
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
