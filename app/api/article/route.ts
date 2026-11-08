import { NextResponse } from 'next/server';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Agent } from 'node:https';
import { lookup } from 'node:dns';

export const runtime = 'nodejs';

// Exact hostnames only: do not accept arbitrary subdomains or ports.
const allowedHosts = new Set([
  'abc.es', 'www.abc.es', 'elpais.com', 'www.elpais.com',
  'ideal.es', 'www.ideal.es', 'granadahoy.com', 'www.granadahoy.com',
  'xataka.com', 'www.xataka.com', 'faz.net', 'www.faz.net',
  'sueddeutsche.de', 'www.sueddeutsche.de',
]);

function isPublicIPv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b, c] = parts;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}

// Resolve and validate the exact address used by the connection. IPv6-only
// hosts fail closed; proxies and automatic redirects are disabled below.
const httpsAgent = new Agent({
  lookup(hostname, _options, callback) {
    lookup(hostname, { family: 4 }, (error, address, family) => {
      if (error) return callback(error, '', 4);
      if (!isPublicIPv4(address)) return callback(new Error('Destination address is not public'), '', 4);
      callback(null, address, family);
    });
  },
});

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('url');
  if (!raw || raw.length > 4096) {
    return NextResponse.json({ error: 'Se requiere una URL válida.' }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(raw);
    if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname) || url.port || url.username || url.password) {
      throw new Error('URL not permitted');
    }
    url.hash = '';
  } catch {
    return NextResponse.json({ error: 'Solo se admiten enlaces HTTPS de los medios compatibles.' }, { status: 400 });
  }

  try {
    const response = await axios.get<string>(url.toString(), {
      httpsAgent,
      family: 4,
      proxy: false,
      maxRedirects: 0,
      maxContentLength: 2 * 1024 * 1024,
      timeout: 10000,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    });
    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    if (!contentType.startsWith('text/html') && !contentType.startsWith('application/xhtml+xml')) {
      return NextResponse.json({ error: 'El recurso no es una página HTML.' }, { status: 502 });
    }
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    const title = document.querySelector('h1')?.textContent?.trim() || document.querySelector('title')?.textContent?.trim() || '';
    let body = '';
    for (const selector of ['article p', '.article-body p', '.story-body p', 'main p', '.content p']) {
      const paragraphs = document.querySelectorAll(selector);
      if (!paragraphs.length) continue;
      const texts: string[] = [];
      paragraphs.forEach(p => {
        const text = (p.textContent || '').replace(/\s{2,}/g, ' ').trim();
        const lower = text.toLowerCase();
        if (text.length <= 20 || (/Escuchar?\s+(el|este)\s+art[ií]culo/i.test(text) && text.length < 100)) return;
        if (text.length < 150 && ['exclusivo para suscriptores', 'disfruta de acceso ilimitado', '¿ya tienes una suscripción', 'inicia sesión'].some(phrase => lower.includes(phrase))) return;
        const linkLength = Array.from(p.querySelectorAll('a')).reduce((sum, link) => sum + (link.textContent?.trim().length || 0), 0);
        if (linkLength / text.length > 0.7) return;
        texts.push(text);
      });
      body = texts.join('\n\n');
      if (body.length > 100) break;
    }
    dom.window.close();
    return NextResponse.json({ title, body, url: url.toString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error fetching article:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'No se pudo obtener el artículo. El sitio puede requerir una redirección o bloquear el acceso.' }, { status: 502 });
  }
}
