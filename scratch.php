<?php
$url = 'https://www.abc.es/espana/madrid/abci-ayuso-carga-contra-sanchez-202302011234_noticia.html'; // Let's fetch one we know exists or find one
$html = file_get_contents('https://www.abc.es/sociedad/aemet-avisa-espana-sobre-tiempo-hara-dia-20260811083846-nt.html');
$dom = new DOMDocument();
@$dom->loadHTML($html);
$xpath = new DOMXPath($dom);
$scriptNodes = $xpath->query('//script[@id="evo-swg-markup"]');
if ($scriptNodes->length > 0) {
    $json = $scriptNodes->item(0)->textContent;
    $data = json_decode($json, true);
    $body = $data['articleBody'] ?? '';
    echo substr($body, 0, 500) . "\n\n-----\n\n";
    echo substr($body, -1000);
} else {
    echo "No schema found";
}
