import importlib.util
import socket
import unittest
from pathlib import Path
from unittest import mock

spec = importlib.util.spec_from_file_location('elpais_capture', Path(__file__).resolve().parents[1] / 'scripts' / 'elpais_capture.py')
capture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(capture)


def answer(ip):
    return (socket.AF_INET, socket.SOCK_STREAM, 6, '', (ip, 443))


class CaptureSafetyTests(unittest.TestCase):
    def test_only_exact_https_document_hosts(self):
        for url in ['https://elpais.com/news', 'https://www.elpais.com/news']:
            self.assertTrue(capture.valid_document_url(url))
        for url in ['http://elpais.com/a', 'https://elpais.com:8443/a', 'https://elpais.com.evil.example/a',
                    'https://user@elpais.com/a', 'https://localhost/a', 'file:///etc/passwd',
                    'https://elpais.com:bad/a']:
            self.assertFalse(capture.valid_document_url(url), url)

    def test_rejects_internal_and_mixed_dns(self):
        for ip in ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.2', '224.0.0.1']:
            with self.subTest(ip=ip), mock.patch.object(capture.socket, 'getaddrinfo', return_value=[answer('8.8.8.8'), answer(ip)]), mock.patch.object(capture.socket, 'create_connection') as conn:
                with self.assertRaises(OSError):
                    capture.connect_public('example.test', 443)
                conn.assert_not_called()

    def test_public_address_is_pinned_after_single_resolution(self):
        with mock.patch.object(capture.socket, 'getaddrinfo', return_value=[answer('8.8.8.8')]) as resolver, mock.patch.object(capture.socket, 'create_connection') as conn:
            capture.connect_public('example.test', 443)
            resolver.assert_called_once()
            conn.assert_called_once_with(('8.8.8.8', 443), timeout=8)

    def test_rejects_non_tls_port_before_dns(self):
        with mock.patch.object(capture.socket, 'getaddrinfo') as resolver:
            with self.assertRaises(OSError):
                capture.connect_public('example.test', 80)
            resolver.assert_not_called()

    def test_capturing_rejects_invalid_url_before_browser_initialization(self):
        with self.assertRaises(ValueError):
            capture.capture('http://127.0.0.1/')

    def test_decompress_bounded_enforces_max_html(self):
        import gzip
        small = gzip.compress(b'<article><p>Hola</p></article>')
        self.assertEqual(capture.decompress_bounded(small, 'gzip'), b'<article><p>Hola</p></article>')
        oversized = gzip.compress(b'x' * (capture.MAX_HTML + 10))
        self.assertIsNone(capture.decompress_bounded(oversized, 'gzip'))


if __name__ == '__main__':
    unittest.main()
