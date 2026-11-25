"""Refresh the ?v= content hashes on index.html and 404.html for the hand-maintained asset links."""
import hashlib, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
def h(p): return hashlib.md5((root / p).read_bytes()).hexdigest()[:8]
for page in ('index.html', '404.html'):
    f = root / page
    t = f.read_text()
    def sub(m):
        path = m.group(2).lstrip('/')
        return m.group(1) + m.group(2) + '?v=' + h(path) if (root / path).exists() else m.group(0)
    n = re.sub(r'((?:href|src)=")([^"?]+\.(?:css|js))\?v=[0-9a-f]{8}', sub, t)
    n = re.sub(r'((?:href|src)=")([^"?]+\.(?:css|js))\?v=[0-9a-f]{8}', sub, n)
    if n != t: f.write_text(n); print('updated', page)
