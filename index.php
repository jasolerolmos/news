<?php
// index.php - Unified News Aggregator

// Function to get category from URL
function getCategoryFromUrl($url) {
    $path = parse_url($url, PHP_URL_PATH);
    $segments = explode('/', trim($path, '/'));
    if (!empty($segments) && !empty($segments[0])) {
        return strtoupper($segments[0]);
    }
    return 'GENERAL';
}

// Function to fetch ABC news
function fetchABCNews() {
    $url = "https://www.abc.es";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    
    $html = curl_exec($ch);
    if (curl_errno($ch)) {
        curl_close($ch);
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
        foreach (['h1', 'h2', 'h3', 'h4'] as $tag) {
            $nodes = $article->getElementsByTagName($tag);
            if ($nodes->length > 0) {
                $headlineNode = $nodes->item(0);
                break;
            }
        }

        if ($headlineNode) {
            $title = trim($headlineNode->textContent);
            $linkNode = $article->getElementsByTagName('a')->item(0);
            $url = $linkNode ? $linkNode->getAttribute('href') : '';
            
            if ($url && strpos($url, 'http') !== 0) {
                $url = "https://www.abc.es" . ltrim($url, '/');
            }

            if (!empty($title) && strlen($title) > 10 && !in_array($title, $seenTitles)) {
                $category = getCategoryFromUrl($url);
                $newsList[] = [
                    'title' => $title,
                    'url' => $url,
                    'category' => $category,
                    'source' => 'ABC'
                ];
                $seenTitles[] = $title;
            }
        }
    }
    return $newsList;
}

// Function to fetch El País news
function fetchElPaisNews() {
    $url = "https://elpais.com/";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    
    $html = curl_exec($ch);
    if (curl_errno($ch)) {
        curl_close($ch);
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
        foreach (['h1', 'h2', 'h3', 'h4'] as $tag) {
            $nodes = $article->getElementsByTagName($tag);
            if ($nodes->length > 0) {
                $headlineNode = $nodes->item(0);
                break;
            }
        }

        if ($headlineNode) {
            $title = trim($headlineNode->textContent);
            $linkNode = $article->getElementsByTagName('a')->item(0);
            $url = $linkNode ? $linkNode->getAttribute('href') : '';
            
            if ($url && strpos($url, 'http') !== 0) {
                $url = "https://elpais.com" . (strpos($url, '/') === 0 ? $url : '/' . $url);
            }

            if (!empty($title) && strlen($title) > 10 && !in_array($title, $seenTitles)) {
                $category = getCategoryFromUrl($url);
                $newsList[] = [
                    'title' => $title,
                    'url' => $url,
                    'category' => $category,
                    'source' => 'ELPAIS'
                ];
                $seenTitles[] = $title;
            }
        }
    }
    return $newsList;
}

// Fetch both sources
$abcNews = fetchABCNews();
$elpaisNews = fetchElPaisNews();
$allNews = array_merge($abcNews, $elpaisNews);
$totalNews = count($allNews);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agregador de Noticias</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #f9fafb;
            --card-bg: #ffffff;
            --text-primary: #111827;
            --text-secondary: #4b5563;
            --accent-abc: #000000;
            --accent-elpais: #1976d2;
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

        h1 {
            font-size: 2.75rem;
            font-weight: 900;
            letter-spacing: -0.025em;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #111827, #1976d2);
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
            color: var(--text-secondary);
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border-color);
        }

        /* Search Box */
        .search-container {
            max-width: 600px;
            margin: 0 auto 2rem;
        }

        .search-box {
            position: relative;
            width: 100%;
        }

        .search-input {
            width: 100%;
            padding: 1rem 1rem 1rem 3rem;
            border: 2px solid var(--border-color);
            border-radius: 1rem;
            font-size: 1rem;
            font-family: inherit;
            background: var(--card-bg);
            transition: all 0.2s ease;
            outline: none;
            box-shadow: var(--shadow-sm);
        }

        .search-input:focus {
            border-color: var(--text-primary);
            box-shadow: var(--shadow-md);
        }

        .search-input::placeholder {
            color: var(--text-secondary);
            opacity: 0.6;
        }

        .search-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            pointer-events: none;
        }

        .clear-search {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0.5rem;
            display: none;
            border-radius: 50%;
            transition: all 0.2s ease;
        }

        .clear-search:hover {
            background: var(--bg-color);
            color: var(--text-primary);
        }

        .clear-search.visible {
            display: block;
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

        .filter-section {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: center;
        }

        .filter-section-label {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            padding: 0 0.5rem;
        }

        .filter-divider {
            width: 1px;
            height: 30px;
            background: var(--border-color);
            margin: 0 0.5rem;
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
            border-color: var(--text-primary);
        }

        .filter-btn.active {
            background: var(--text-primary);
            color: white;
            border-color: transparent;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
        }

        .news-card[data-source="ABC"]:hover {
            border-color: var(--accent-abc);
        }

        .news-card[data-source="ELPAIS"]:hover {
            border-color: var(--accent-elpais);
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
            color: white;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 0.35rem 0.75rem;
            border-radius: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            backdrop-filter: blur(10px);
        }

        .source-badge.abc {
            background: rgba(0, 0, 0, 0.85);
        }

        .source-badge.elpais {
            background: rgba(25, 118, 210, 0.9);
        }

        .category-tag {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.75rem;
            width: fit-content;
        }

        .news-card[data-source="ABC"] .category-tag {
            color: var(--accent-abc);
        }

        .news-card[data-source="ELPAIS"] .category-tag {
            color: var(--accent-elpais);
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
        }

        .read-more {
            font-size: 0.875rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.35rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .news-card[data-source="ABC"] .read-more {
            color: var(--accent-abc);
        }

        .news-card[data-source="ELPAIS"] .read-more {
            color: var(--accent-elpais);
        }

        .read-more svg {
            width: 18px;
            height: 18px;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .news-card:hover .read-more svg {
            transform: translateX(6px);
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
                flex-direction: column;
            }
            .filter-divider {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Agregador de Noticias</h1>
            <p class="subtitle">ABC y El País en un solo lugar</p>
            <div class="stats">📰 <?php echo $totalNews; ?> noticias encontradas</div>
        </header>

        <!-- Search Box -->
        <div class="search-container">
            <div class="search-box">
                <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                    type="text" 
                    id="search-input" 
                    class="search-input" 
                    placeholder="Buscar noticias por título..."
                    autocomplete="off"
                >
                <button id="clear-search" class="clear-search" title="Limpiar búsqueda">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <div id="filter-container" class="filter-container">
            <div class="filter-section">
                <span class="filter-section-label">Fuente:</span>
                <button class="filter-btn active" data-filter-type="source" data-filter-value="all">Todas</button>
                <button class="filter-btn" data-filter-type="source" data-filter-value="ABC">ABC</button>
                <button class="filter-btn" data-filter-type="source" data-filter-value="ELPAIS">El País</button>
            </div>
            <div class="filter-divider"></div>
            <div class="filter-section">
                <span class="filter-section-label">Categoría:</span>
                <button class="filter-btn active" data-filter-type="category" data-filter-value="all">Todas</button>
                <!-- Categories will be injected here by JS -->
            </div>
        </div>

        <div class="news-grid" id="news-grid">
            <?php if (empty($allNews)): ?>
                <div style="text-align: center; padding: 4rem; color: var(--text-secondary);">
                    <p>⚠️ No se pudieron cargar las noticias. Verifica tu conexión o intenta más tarde.</p>
                </div>
            <?php else: ?>
                <?php foreach ($allNews as $item): ?>
                    <?php
                        $articleUrl = $item['source'] === 'ABC' 
                            ? 'article.php?url=' . urlencode($item['url'])
                            : 'article_elpais.php?url=' . urlencode($item['url']);
                    ?>
                    <article class="news-card" 
                             data-source="<?php echo htmlspecialchars($item['source']); ?>"
                             data-category="<?php echo htmlspecialchars($item['category']); ?>">
                        <div class="card-content">
                            <span class="source-badge <?php echo strtolower($item['source']); ?>">
                                <?php echo $item['source'] === 'ABC' ? 'ABC' : 'EL PAÍS'; ?>
                            </span>
                            <span class="category-tag"><?php echo htmlspecialchars($item['category']); ?></span>
                            <h2 class="news-title">
                                <a href="<?php echo $articleUrl; ?>" class="news-link">
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
            const searchInput = document.getElementById('search-input');
            const clearSearchBtn = document.getElementById('clear-search');
            
            let currentSourceFilter = 'all';
            let currentCategoryFilter = 'all';
            let currentSearchTerm = '';

            // Extract unique categories
            const categories = new Set();
            cards.forEach(card => {
                const cat = card.getAttribute('data-category');
                if (cat) categories.add(cat);
            });

            // Create category filter buttons
            const categorySection = filterContainer.querySelector('.filter-section:last-child');
            Array.from(categories).sort().forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.textContent = cat.toLowerCase();
                btn.setAttribute('data-filter-type', 'category');
                btn.setAttribute('data-filter-value', cat);
                categorySection.appendChild(btn);
            });

            // Filter buttons logic
            const filterButtons = filterContainer.querySelectorAll('.filter-btn');
            
            filterButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const filterType = btn.getAttribute('data-filter-type');
                    const filterValue = btn.getAttribute('data-filter-value');

                    // Update active state for this filter type
                    filterContainer.querySelectorAll(`[data-filter-type="${filterType}"]`)
                        .forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Update current filters
                    if (filterType === 'source') {
                        currentSourceFilter = filterValue;
                    } else if (filterType === 'category') {
                        currentCategoryFilter = filterValue;
                    }

                    applyFilters();
                });
            });

            // Search functionality
            searchInput.addEventListener('input', (e) => {
                currentSearchTerm = e.target.value.toLowerCase().trim();
                
                // Show/hide clear button
                if (currentSearchTerm.length > 0) {
                    clearSearchBtn.classList.add('visible');
                } else {
                    clearSearchBtn.classList.remove('visible');
                }
                
                applyFilters();
            });

            // Clear search button
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                currentSearchTerm = '';
                clearSearchBtn.classList.remove('visible');
                searchInput.focus();
                applyFilters();
            });

            function applyFilters() {
                let visibleCount = 0;
                
                cards.forEach(card => {
                    const cardSource = card.getAttribute('data-source');
                    const cardCategory = card.getAttribute('data-category');
                    const cardTitle = card.querySelector('.news-title').textContent.toLowerCase();

                    const sourceMatch = currentSourceFilter === 'all' || cardSource === currentSourceFilter;
                    const categoryMatch = currentCategoryFilter === 'all' || cardCategory === currentCategoryFilter;
                    const searchMatch = currentSearchTerm === '' || cardTitle.includes(currentSearchTerm);

                    if (sourceMatch && categoryMatch && searchMatch) {
                        card.style.display = 'flex';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                        visibleCount++;
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });

                // Update stats with visible count
                updateStats(visibleCount);
            }

            function updateStats(count) {
                const statsElement = document.querySelector('.stats');
                if (statsElement) {
                    statsElement.textContent = `📰 ${count} noticias mostradas`;
                }
            }
        });
    </script>
</body>
</html>
