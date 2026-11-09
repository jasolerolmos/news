import { NextResponse } from 'next/server';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Agent } from 'node:https';
import { lookup } from 'node:dns';
import { spawn } from 'node:child_process';
import path from 'node:path';

export const runtime = 'nodejs';

// Exact hostnames only: do not accept arbitrary subdomains or ports.
const allowedHosts = new Set([
  'abc.es', 'www.abc.es', 'elpais.com', 'www.elpais.com',
  'ideal.es', 'www.ideal.es', 'granadahoy.com', 'www.granadahoy.com',
  'diariodemallorca.es', 'www.diariodemallorca.es',
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

// Limit browser processes per Node worker; deploy with external rate limits as well.
let currentCapture: { url: string; promise: Promise<{ data: string; url: string }> } | null = null;
async function captureElPais(url: string): Promise<{ data: string; url: string }> {
  if (currentCapture?.url === url) return currentCapture.promise;
  if (currentCapture) throw new Error('BROWSER_BUSY');
  const promise = new Promise<{ data: string; url: string }>((resolve, reject) => {
      const script = path.join(process.cwd(), 'scripts', 'elpais_capture.py');
      const child = spawn(process.env.ELPAIS_PYTHON || 'python3', [script, url], {
        detached: true, stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '', stderr = '', settled = false;
      const kill = () => {
        try { if (child.pid) process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); }
      };
      const finish = (error?: Error, result?: { data: string; url: string }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error); else resolve(result!);
      };
      const timer = setTimeout(() => { kill(); finish(new Error('BROWSER_TIMEOUT')); }, 25000);
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        stdout += chunk;
        if (Buffer.byteLength(stdout, 'utf8') > 8 * 1024 * 1024) {
          kill(); finish(new Error('BROWSER_OUTPUT_TOO_LARGE'));
        }
      });
      child.stderr.on('data', (chunk: Buffer) => { if (stderr.length < 1024) stderr += chunk.toString().slice(0, 1024); });
      child.on('error', () => finish(new Error('BROWSER_UNAVAILABLE')));
      child.on('close', code => {
        if (code !== 0) return finish(new Error('BROWSER_FAILED'));
        try {
          const parsed = JSON.parse(stdout);
          const final = new URL(parsed.url);
          if (typeof parsed.html !== 'string' || Buffer.byteLength(parsed.html, 'utf8') > 2 * 1024 * 1024 ||
              final.protocol !== 'https:' || !['elpais.com', 'www.elpais.com'].includes(final.hostname) ||
              final.port || final.username || final.password) throw new Error('Invalid response');
          finish(undefined, { data: parsed.html, url: final.toString() });
        } catch { finish(new Error('BROWSER_INVALID_RESPONSE')); }
      });
    });
  currentCapture = { url, promise };
  try { return await promise; }
  finally { if (currentCapture?.promise === promise) currentCapture = null; }
}

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
    let html: string;
    let finalUrl = url.toString();
    if (url.hostname === 'elpais.com' || url.hostname === 'www.elpais.com') {
      const captured = await captureElPais(finalUrl);
      html = captured.data;
      finalUrl = captured.url;
    } else {
      const response = await axios.get<string>(url.toString(), {
        httpsAgent,
        family: 4,
        proxy: false,
        maxRedirects: 0,
        maxContentLength: 2 * 1024 * 1024,
        timeout: 10000,
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
      });
      const contentType = String(response.headers['content-type'] || '').toLowerCase();
      if (!contentType.startsWith('text/html') && !contentType.startsWith('application/xhtml+xml')) {
        return NextResponse.json({ error: 'El recurso no es una página HTML.' }, { status: 502 });
      }
      html = response.data;
    }
    const dom = new JSDOM(html);
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
    return NextResponse.json({ title, body, url: finalUrl }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'unknown error';
    console.error('Error fetching article:', code);
    if (code === 'BROWSER_BUSY') return NextResponse.json({ error: 'El lector de El País está ocupado. Inténtalo de nuevo en unos segundos.' }, { status: 503, headers: { 'Retry-After': '5' } });
    if (code === 'BROWSER_TIMEOUT') return NextResponse.json({ error: 'El País no respondió a tiempo. Puedes abrir la fuente original.' }, { status: 504 });
    if (code.startsWith('BROWSER_')) return NextResponse.json({ error: 'No se pudo obtener el artículo de El País. Puede estar bloqueado o el lector no estar disponible.' }, { status: 502 });
    return NextResponse.json({ error: 'No se pudo obtener el artículo. El sitio puede requerir una redirección o bloquear el acceso.' }, { status: 502 });
  }
}
