<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Artículo ABC</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #f9fafb;
            --card-bg: #ffffff;
            --text-primary: #111827;
            --text-secondary: #4b5563;
            --text-body: #374151;
            --accent: #000000;
            --border: #e5e7eb;
            --accent-color: #2563eb;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-primary);
            line-height: 1.5;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px 20px;
        }
        
        .container {
            width: 100%;
            max-width: 800px;
        }
        
        /* Back Button */
        .back-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: var(--card-bg);
            color: var(--text-secondary);
            text-decoration: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 24px;
            border: 1px solid var(--border);
            transition: all 0.2s ease;
        }

        .back-button:hover {
            background: var(--bg-color);
            border-color: var(--text-secondary);
            color: var(--text-primary);
        }

        .back-button svg {
            width: 16px;
            height: 16px;
        }

        /* Article Content */
        .article-container {
            background: var(--card-bg);
            border-radius: 20px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid var(--border);
            animation: fadeIn 0.5s ease-out;
        }

        .article-header {
            padding: 40px 40px 20px 40px;
            border-bottom: 1px solid var(--border);
        }

        .category-tag {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--accent-color);
            margin-bottom: 16px;
        }

        h1.headline {
            font-family: 'Inter', sans-serif;
            font-weight: 800;
            font-size: 32px;
            line-height: 1.2;
            color: var(--text-primary);
            margin-bottom: 16px;
            letter-spacing: -0.02em;
        }

        .description {
            font-family: 'Inter', sans-serif;
            font-size: 18px;
            line-height: 1.6;
            color: var(--text-secondary);
            font-weight: 400;
        }

        .article-body {
            padding: 40px;
            font-family: 'Merriweather', serif;
            font-size: 18px;
            line-height: 1.8;
            color: var(--text-body);
        }
        
        .article-body p {
            margin-bottom: 24px;
        }

        .article-body p:last-child {
            margin-bottom: 0;
        }

        /* Utilities */
        .error-message {
            background-color: #fef2f2;
            color: #991b1b;
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: center;
            font-size: 14px;
            border: 1px solid #fecaca;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile */
        @media (max-width: 640px) {
            .article-header, .article-body {
                padding: 24px;
            }
            h1.headline {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="news_list.php" class="back-button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al listado
        </a>

<?php
if (!isset($_GET['url']) || empty($_GET['url'])) {
    echo '<div class="error-message">No se proporcionó una URL válida.</div>';
    exit;
}

$url = $_GET['url'];

if (strpos($url, 'abc.es') === false) {
    echo '<div class="error-message">Por favor, introduce una URL válida de abc.es</div>';
} else {
    try {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $html = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("No se pudo cargar el artículo (Error $httpCode)");
        }
        
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        @$dom->loadHTML($html);
        libxml_clear_errors();
        
        $xpath = new DOMXPath($dom);
        $scriptNodes = $xpath->query('//script[@id="evo-swg-markup"]');
        
        if ($scriptNodes->length === 0) {
            throw new Exception("No se encontró contenido extraíble en esta página.");
        }
        
        $jsonContent = $scriptNodes->item(0)->textContent;
        $data = json_decode($jsonContent, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Error al procesar el contenido del artículo.");
        }
        
        $headline = $data['headline'] ?? '';
        $description = $data['description'] ?? '';
        $articleBody = $data['articleBody'] ?? '';
        
        // Extraer categoría de la URL
        function getCategoryFromUrl($url) {
            $path = parse_url($url, PHP_URL_PATH);
            $segments = explode('/', trim($path, '/'));
            if (!empty($segments) && !empty($segments[0])) {
                return strtoupper($segments[0]);
            }
            return 'GENERAL';
        }
        
        $category = getCategoryFromUrl($url);
        
        echo '<div class="article-container">';
        
        // Header Section
        echo '<div class="article-header">';
        echo '<span class="category-tag">' . htmlspecialchars($category) . '</span>';
        if ($headline) {
            echo '<h1 class="headline">' . htmlspecialchars($headline) . '</h1>';
        }
        if ($description) {
            echo '<div class="description">' . htmlspecialchars($description) . '</div>';
        }
        echo '</div>';
        
        // Body Section
        echo '<div class="article-body">';
        if ($articleBody) {
            $formattedBody = nl2br(htmlspecialchars($articleBody));
            echo $formattedBody;
        }
        echo '</div>';
        
        echo '</div>'; // End article-container
        
    } catch (Exception $e) {
        echo '<div class="error-message">' . htmlspecialchars($e->getMessage()) . '</div>';
    }
}
?>
    </div>
</body>
</html>
