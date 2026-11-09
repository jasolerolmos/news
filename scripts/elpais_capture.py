#!/usr/bin/env python3
"""Fetch one El Pais HTML document with validated direct HTTPS or Chromium fallback."""
from http.client import HTTPException, HTTPResponse
import ipaddress
import json
import os
import select
import socket
import socketserver
import ssl
import sys
import tempfile
import threading
import time
from urllib.parse import urldefrag, urljoin, urlsplit
import zlib

MAX_HTML = 2 * 1024 * 1024
ALLOWED_DOCUMENT_HOSTS = {'elpais.com', 'www.elpais.com'}
BROWSER_UA = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
)


def valid_document_url(url):
    try:
        parsed = urlsplit(url)
        return (parsed.scheme == 'https' and parsed.hostname in ALLOWED_DOCUMENT_HOSTS
                and parsed.port in (None, 443) and not parsed.username and not parsed.password)
    except ValueError:
        return False


def connect_public(host, port, timeout=8):
    """Resolve once and connect to the validated IPv4, never resolving it twice."""
    if port != 443 or not host or len(host) > 253:
        raise OSError('invalid destination')
    addresses = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
    if not addresses:
        raise OSError('no address')
    # Fail closed on any non-public result, even when DNS mixes public/private IPs.
    for entry in addresses:
        address = ipaddress.ip_address(entry[4][0])
        if not address.is_global or address.is_multicast or address.is_unspecified:
            raise OSError('non-public destination')
    last_error = None
    for entry in addresses:
        try:
            return socket.create_connection(entry[4], timeout=timeout)
        except OSError as error:
            last_error = error
    raise last_error or OSError('connection failed')


class ProxyHandler(socketserver.StreamRequestHandler):
    def handle(self):
        self.connection.settimeout(8)
        try:
            line = self.rfile.readline(4097)
            if len(line) > 4096:
                return
            parts = line.decode('ascii').strip().split()
            if len(parts) != 3 or parts[0] != 'CONNECT':
                self.wfile.write(b'HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n')
                return
            authority = parts[1]
            host, separator, port = authority.rpartition(':')
            if not separator or not port.isdigit() or not host or '[' in host or ']' in host:
                return
            # Headers are bounded to avoid unbounded buffering by the proxy.
            total = 0
            while True:
                header = self.rfile.readline(4097)
                total += len(header)
                if not header or total > 16384 or len(header) > 4096:
                    return
                if header in (b'\r\n', b'\n'):
                    break
            upstream = connect_public(host, int(port))
            with upstream:
                self.wfile.write(b'HTTP/1.1 200 Connection Established\r\n\r\n')
                self.wfile.flush()
                upstream.setblocking(False)
                self.connection.setblocking(False)
                sockets = [self.connection, upstream]
                while True:
                    ready, _, exceptional = select.select(sockets, [], sockets, 15)
                    if exceptional or not ready:
                        return
                    for source in ready:
                        data = source.recv(65536)
                        if not data:
                            return
                        target = upstream if source is self.connection else self.connection
                        target.setblocking(True)
                        target.settimeout(8)
                        target.sendall(data)
                        target.setblocking(False)
        except (OSError, UnicodeError, ValueError):
            try:
                self.wfile.write(b'HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n')
            except OSError:
                pass


class ProxyServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def decompress_bounded(raw, encoding):
    encoding = (encoding or '').strip().lower()
    if not encoding or encoding == 'identity':
        return raw if len(raw) <= MAX_HTML else None
    if encoding == 'gzip':
        decompressor = zlib.decompressobj(16 + zlib.MAX_WBITS)
    elif encoding == 'deflate':
        decompressor = zlib.decompressobj()
    else:
        return None
    out = decompressor.decompress(raw, MAX_HTML + 1)
    if decompressor.unconsumed_tail:
        return None
    tail = decompressor.flush()
    if len(out) + len(tail) > MAX_HTML:
        return None
    return out + tail


def has_article_text(html):
    from bs4 import BeautifulSoup
    article = BeautifulSoup(html, 'html.parser').find('article')
    return bool(article and any(p.get_text(' ', strip=True) for p in article.find_all('p')))


def fetch_direct(url, timeout=8, max_redirects=3):
    current = urldefrag(url)[0]
    tls_context = ssl.create_default_context()
    for _ in range(max_redirects + 1):
        if not valid_document_url(current):
            return None
        parsed = urlsplit(current)
        raw_sock = connect_public(parsed.hostname, 443, timeout=timeout)
        with raw_sock:
            with tls_context.wrap_socket(raw_sock, server_hostname=parsed.hostname) as tls_sock:
                tls_sock.settimeout(timeout)
                target = parsed.path or '/'
                if parsed.query:
                    target = f'{target}?{parsed.query}'
                if any(ch in target for ch in ('\r', '\n', ' ')):
                    return None
                request = (
                    f'GET {target} HTTP/1.1\r\n'
                    f'Host: {parsed.hostname}\r\n'
                    f'User-Agent: {BROWSER_UA}\r\n'
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8\r\n'
                    'Accept-Language: es-ES,es;q=0.9,en;q=0.8\r\n'
                    'Accept-Encoding: gzip, deflate\r\n'
                    'Connection: close\r\n\r\n'
                )
                tls_sock.sendall(request.encode('ascii'))
                response = HTTPResponse(tls_sock)
                response.begin()
                if response.status in (301, 302, 303, 307, 308):
                    location = response.getheader('Location')
                    if not location:
                        return None
                    current = urldefrag(urljoin(current, location))[0]
                    continue
                if response.status != 200:
                    return None
                content_type = (response.getheader('Content-Type') or '').lower()
                if not content_type.startswith(('text/html', 'application/xhtml+xml')):
                    return None
                declared = response.getheader('Content-Length')
                if declared and int(declared) > MAX_HTML:
                    return None
                raw = response.read(MAX_HTML + 1)
                if len(raw) > MAX_HTML:
                    return None
                body = decompress_bounded(raw, response.getheader('Content-Encoding'))
                if body is None:
                    return None
                html = body.decode('utf-8', errors='replace')
                if has_article_text(html):
                    return {'html': html, 'url': current}
                return None
    return None


def capture(url, timeout=18):
    if not valid_document_url(url):
        raise ValueError('URL de El Pais no permitida')
    try:
        direct = fetch_direct(url, timeout=min(8, timeout))
        if direct is not None:
            return direct
    except (OSError, ssl.SSLError, HTTPException, ValueError, zlib.error):
        pass
    # Lazy imports keep validation and proxy checks independently testable.
    from playwright.sync_api import Error as PlaywrightError, sync_playwright

    captured = None
    deadline = time.monotonic() + timeout
    with ProxyServer(('127.0.0.1', 0), ProxyHandler) as proxy:
        thread = threading.Thread(target=proxy.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory(prefix='elpais-browser-') as profile:
                with sync_playwright() as playwright:
                    executable = os.environ.get('CHROMIUM_PATH') or None
                    context = playwright.chromium.launch_persistent_context(
                        user_data_dir=profile, headless=True, executable_path=executable,
                        user_agent=BROWSER_UA, locale='es-ES',
                        service_workers='block',
                        proxy={'server': f'http://127.0.0.1:{proxy.server_address[1]}', 'bypass': '<-loopback>'},
                        args=[
                            '--disable-blink-features=AutomationControlled',
                            '--disable-quic',
                            '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
                        ],
                    )
                    try:
                        page = context.pages[0] if context.pages else context.new_page()

                        def filter_request(route):
                            request = route.request
                            if request.is_navigation_request() and request.frame == page.main_frame and not valid_document_url(request.url):
                                route.abort()
                            elif urlsplit(request.url).scheme not in ('http', 'https'):
                                route.abort()
                            else:
                                route.continue_()

                        context.route('**/*', filter_request)

                        def on_response(response):
                            nonlocal captured
                            if captured is not None or response.status != 200:
                                return
                            if response.request.resource_type != 'document' or not valid_document_url(response.url):
                                return
                            if response.request.frame != page.main_frame:
                                return
                            try:
                                declared = response.headers.get('content-length')
                                if declared and int(declared) > MAX_HTML:
                                    return
                                raw = response.body()
                                if len(raw) > MAX_HTML:
                                    return
                                html = raw.decode('utf-8', errors='replace')
                                if has_article_text(html):
                                    captured = {'html': html, 'url': response.url}
                            except (PlaywrightError, ValueError):
                                return

                        page.on('response', on_response)
                        try:
                            page.goto(url, wait_until='domcontentloaded', timeout=min(12000, timeout * 1000))
                        except PlaywrightError:
                            pass
                        while captured is None and not page.is_closed() and time.monotonic() < deadline:
                            page.wait_for_timeout(250)
                    finally:
                        context.close()
        finally:
            proxy.shutdown()
            thread.join(timeout=3)
    if captured is None:
        raise RuntimeError('El Pais no devolvio un articulo accesible o agoto el tiempo de espera')
    return captured


def main():
    if len(sys.argv) != 2:
        raise ValueError('Se requiere una URL')
    result = capture(sys.argv[1])
    print(json.dumps(result, ensure_ascii=True))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'Error de captura: {type(error).__name__}', file=sys.stderr)
        sys.exit(1)
