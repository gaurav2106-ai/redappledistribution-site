#!/usr/bin/env python3
"""Add a Content-Security-Policy <meta> to every HTML page (GitHub Pages cannot send headers).
Inline classic scripts are allowed by SHA-256 hash, so a script injected into a page will not run.
Usage: python3 tools/add_csp.py   (run after tools/build_shop.py; build_shop calls it for you)"""
import base64, hashlib, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCRIPT = re.compile(r'<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>', re.S | re.I)
META = re.compile(r'<meta http-equiv="Content-Security-Policy"[^>]*>\s*', re.I)

def policy(hashes):
    h = ' '.join("'sha256-%s'" % x for x in sorted(hashes))
    return '; '.join([
        "default-src 'self'",
        "script-src 'self' %s https://cdn.onesignal.com https://*.onesignal.com" % h,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.onesignal.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https:",
        "connect-src 'self' https://qdqioorsppkinjjyvata.supabase.co https://formspree.io https://*.onesignal.com",
        "frame-src https://*.onesignal.com",
        "worker-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://formspree.io",
    ])

def process(p):
    t = p.read_text(encoding='utf-8')
    t = META.sub('', t)
    hashes = set()
    for m in SCRIPT.finditer(t):
        a = m.group('attrs')
        if 'src=' in a.lower():
            continue
        ty = re.search(r'type="([^"]*)"', a, re.I)
        if ty and ty.group(1).lower() not in ('text/javascript', 'module'):
            continue
        hashes.add(base64.b64encode(hashlib.sha256(m.group('body').encode('utf-8')).digest()).decode())
    meta = '<meta http-equiv="Content-Security-Policy" content="%s">' % policy(hashes)
    if '<head>' in t:
        t = t.replace('<head>', '<head>' + meta, 1)
    else:
        t = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + meta, t, 1)
    p.write_text(t, encoding='utf-8')

def main():
    n = 0
    for p in ROOT.rglob('*.html'):
        if '.git' in p.parts or 'node_modules' in p.parts or 'docs' in p.parts:
            continue
        process(p); n += 1
    print('csp: %d pages' % n)

if __name__ == '__main__':
    sys.exit(main())
