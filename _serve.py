import http.server, os, re, socketserver
os.chdir(r'D:\灵犀浏览器\users\467461855\projects\11649694727078122\workspace\resume-site')

class H(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404); return None
        size = os.fstat(f.fileno()).st_size
        rng = self.headers.get('Range')
        ctype = self.guess_type(path)
        if rng:
            m = re.match(r'bytes=(\d*)-(\d*)', rng)
            start = int(m.group(1) or 0)
            end = int(m.group(2) or size - 1)
            end = min(end, size - 1)
            f.seek(start)
            self.send_response(206)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            self.send_header('Content-Length', str(end - start + 1))
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()
            return _RangeFile(f, end - start + 1)
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(size))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        return f

class _RangeFile:
    def __init__(self, f, n): self.f, self.n = f, n
    def read(self, n=-1): return self.f.read(self.n if n < 0 else min(n, self.n))

class Srv(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

Srv(('0.0.0.0', 8766), H).serve_forever()
