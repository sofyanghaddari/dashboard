#!/usr/bin/env python3
"""Lokale MarkItDown server voor het dashboard.

Start:
    pip install markitdown
    python markitdown_server.py

De dashboard PWA stuurt bestanden via POST /convert en krijgt Markdown terug.
Ondersteunde formaten: alles wat Microsoft MarkItDown aankan — Excel, Word,
PowerPoint, PDF, HTML, CSV, JSON, XML, afbeeldingen, audio, zip, ...

Druk op Ctrl+C om te stoppen.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import tempfile
import os
import sys

PORT = 8765

try:
    from markitdown import MarkItDown
except ImportError:
    print("MarkItDown niet gevonden. Installeer eerst: pip install markitdown")
    sys.exit(1)

_md = MarkItDown(enable_plugins=False)


class Handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == '/ping':
            body = b'{"status":"ok"}'
            self._cors()
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(body))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path != '/convert':
            self.send_error(404)
            return

        length   = int(self.headers.get('Content-Length', 0))
        filename = self.headers.get('X-Filename', 'document.bin')
        data     = self.rfile.read(length)

        ext = os.path.splitext(filename)[1] or '.bin'
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(data)
                tmp_path = tmp.name

            result   = _md.convert(tmp_path)
            markdown = result.text_content or ''

            body = json.dumps({'markdown': markdown}).encode('utf-8')
            self._cors()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', len(body))
            self.end_headers()
            self.wfile.write(body)

        except Exception as exc:
            body = json.dumps({'error': str(exc)}).encode('utf-8')
            self._cors_err()
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(body))
            self.end_headers()
            self.wfile.write(body)

        finally:
            if tmp_path:
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

    # ── CORS helpers ──────────────────────────────────────────────────────

    def _cors(self):
        self.send_response(200)
        self._cors_headers()

    def _cors_err(self):
        self.send_response(500)
        self._cors_headers()

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Filename')

    def log_message(self, fmt, *args):
        print(f'[MarkItDown] {fmt % args}')


if __name__ == '__main__':
    server = HTTPServer(('localhost', PORT), Handler)
    print(f'MarkItDown server → http://localhost:{PORT}')
    print('Druk Ctrl+C om te stoppen.\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nGestopt.')
