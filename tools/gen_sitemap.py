#!/usr/bin/env python3
"""Build sitemap.xml for redappledistribution.com from shop/data.js (local, read-only on everything else).

Run from anywhere:  python3 tools/gen_sitemap.py          (writes sitemap.xml)
                    python3 tools/gen_sitemap.py --check   (validate only, no write)

URL sets: landing, category routes, brands index, one page per brand, one page per product,
info pages. Private routes (signin, signup, account, admin, quote, quote-summary, review) are never listed.
Safety net: any URL whose static file carries a robots noindex meta tag aborts the run.

lastmod rule: git last-commit date (YYYY-MM-DD) of the source file for that URL. Catalog pages
(categories, brands, brand, product) also depend on shop/data.js, so they use the newer of the two.
If a file has uncommitted changes the working-tree date (mtime) is used, which is the 'changed today' case.
"""
import json, os, re, subprocess, sys, datetime
from urllib.parse import quote
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://redappledistribution.com'
CATS = ['all', 'new', 'trending', 'vapes', 'flower', 'hydroxys', 'edibles', 'pre-rolls', 'kratom', 'shrooms', 'smoke-accessories']
INFO = ['about', 'contact', 'faq', 'policy', 'terms', 'privacy', 'returns', 'reviews']
EXCLUDED = {'signin', 'signup', 'account', 'admin', 'quote', 'quote-summary', 'review', 'order'}
NO_BRAND = {'Check brand', ''}  # placeholder value in data.js, not a real brand
MAX_URLS = 50000


def git(*a):
    return subprocess.run(['git', '-C', ROOT] + list(a), capture_output=True, text=True).stdout.strip()


_dirty = set(l[3:].strip().strip('"') for l in git('status', '--porcelain').splitlines())


def last_date(rel):
    """Commit date of rel, or file mtime date if it has uncommitted changes, or None if missing."""
    p = os.path.join(ROOT, rel)
    if not os.path.exists(p):
        return None
    if rel in _dirty:
        return datetime.date.fromtimestamp(os.path.getmtime(p)).isoformat()
    d = git('log', '-1', '--format=%cs', '--', rel)
    return d or datetime.date.fromtimestamp(os.path.getmtime(p)).isoformat()


def newest(*rels):
    ds = [d for d in (last_date(r) for r in rels) if d]
    return max(ds) if ds else None


def enc(s):  # same safe set as JavaScript encodeURIComponent, so URLs match the shop router
    return quote(s, safe="-_.!~*'()")


def load_products():
    t = open(os.path.join(ROOT, 'shop', 'data.js'), encoding='utf-8').read()
    m = re.search(r'window\.PRODUCTS=(\[.*?\]);', t, re.S)
    return json.loads(m.group(1))


def product_file(pid):
    for base in ('shop/p', 'shop-next/p'):
        rel = '%s/%s/index.html' % (base, pid)
        if os.path.exists(os.path.join(ROOT, rel)):
            return rel
    return None


def build():
    prods = load_products()
    data = 'shop/data.js'
    rows = []  # (type, loc, lastmod)
    rows.append(('landing', SITE + '/', newest('index.html')))
    for c in CATS:
        rows.append(('category', '%s/shop/c/%s/' % (SITE, c), newest('shop/c/%s/index.html' % c, data)))
    rows.append(('brands-index', SITE + '/shop/brands/', newest('shop/brands/index.html', data)))
    brands = sorted({p['b'] for p in prods if p.get('b') not in NO_BRAND}, key=str.lower)
    for b in brands:
        rows.append(('brand', '%s/shop/brand/%s/' % (SITE, enc(b)), newest(data)))
    for p in sorted(prods, key=lambda x: x['id']):
        pf = product_file(p['id'])
        rows.append(('product', '%s/shop/p/%s/' % (SITE, p['id']), newest(data, pf) if pf else newest(data)))
    for i in INFO:
        rows.append(('info', '%s/shop/%s/' % (SITE, i), newest('shop/%s/index.html' % i)))
    return rows


def validate(rows):
    locs = [r[1] for r in rows]
    assert len(locs) == len(set(locs)), 'duplicate URLs'
    assert len(locs) < MAX_URLS, 'too many URLs for one sitemap'
    for t, loc, lm in rows:
        assert lm and re.match(r'^\d{4}-\d{2}-\d{2}$', lm), 'missing lastmod for ' + loc
        path = loc[len(SITE):]
        segs = [s for s in path.split('/') if s]
        assert not (set(segs) & EXCLUDED), 'private route listed: ' + loc
        if len(segs) >= 2 and segs[0] == 'shop':
            f = os.path.join(ROOT, *segs, 'index.html')
            if os.path.exists(f):
                html = open(f, encoding='utf-8', errors='replace').read()
                if re.search(r'name="robots"\s+content="[^"]*noindex', html, re.I):
                    raise SystemExit('noindex page listed in sitemap: ' + loc)


def render(rows):
    out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for t, loc, lm in rows:
        out.append('  <url><loc>%s</loc><lastmod>%s</lastmod></url>' % (escape(loc), lm))
    out.append('</urlset>')
    return '\n'.join(out) + '\n'


if __name__ == '__main__':
    rows = build()
    validate(rows)
    doc = render(rows)
    import xml.dom.minidom
    xml.dom.minidom.parseString(doc.encode('utf-8'))  # well-formedness check
    counts = {}
    for t, _, _ in rows:
        counts[t] = counts.get(t, 0) + 1
    if '--check' not in sys.argv:
        open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(doc)
    print('urls: %d  %s' % (len(rows), counts))
