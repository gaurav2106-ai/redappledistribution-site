#!/usr/bin/env python3
"""Pre-render the shop: one small static HTML per route.

Usage:  python3 tools/build_shop.py [shop_dir]      (default: shop-next)

Reads  <shop_dir>/data.js  (PRODUCTS, PICKS, ALIASES)  and writes
  <shop_dir>/<route>/index.html   for catalog, product, brand and info routes.
Every page: own title, meta description, self canonical, one h1, product text/links in the raw HTML,
JSON-LD (Product has NO price), noindex on private routes. Behaviour comes from app.js (loaded by every page).
No external deps. Plain hyphens only in copy.
"""
import json, os, re, shutil, sys
from urllib.parse import quote, unquote
from html import escape as _esc

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOP = os.path.join(ROOT, sys.argv[1] if len(sys.argv) > 1 else 'shop-next')
SITE = 'https://redappledistribution.com'
HB = 'Check brand'
BUDGET = 15000  # bytes of product cards per page, keeps every file under 30 KB

CATS = {'vapes': 'Vapes', 'flower': 'Flower', 'hydroxys': 'Hydroxy', 'pre-rolls': 'Pre-Rolls', 'edibles': 'Edibles',
        'kratom': 'Kratom', 'shrooms': 'Shrooms', 'smoke-accessories': 'Smoke Accessories'}
TITLES = {'vapes': 'Vapes', 'flower': 'Flower', 'hydroxys': 'Hydroxys', 'pre-rolls': 'Pre-Rolls', 'edibles': 'Edibles',
          'kratom': 'Kratom', 'shrooms': 'Shrooms', 'smoke-accessories': 'Smoke Accessories', 'all': 'All products',
          'new': 'New arrivals', 'trending': 'Trending'}
LEAD = {
    'all': 'Every product we carry, from the brands shop owners already know. Build your list, then request a quote.',
    'new': 'The latest additions to the line. Add what fits your shelves and request a quote.',
    'trending': 'What is moving across our retailers right now.',
    'vapes': 'High-turn disposables from the brands your customers ask for by name.',
    'flower': 'Cured flower with the bag appeal that closes the sale in-store.',
    'hydroxys': 'Heavy-hitting lines with the potency your regulars chase.',
    'pre-rolls': 'Hand-rolled and machine-packed, in strains that keep cases moving.',
    'edibles': 'Hemp-derived and lab-tested, compliant for licensed retail.',
    'kratom': 'Kratom products for licensed retail. Request a quote for bulk pricing.',
    'shrooms': 'Mushroom products for licensed retail. Request a quote for bulk pricing.',
    'smoke-accessories': 'The add-on sales that sit beside the register. Request a quote for bulk pricing.',
}
EM = {'all': ('The full', 'catalog.'), 'new': ('New', 'arrivals.'), 'trending': ('What is', 'moving.')}


def e(t):
    return _esc(str(t), quote=True)


def clean(t):
    return re.sub(r'[\u2013\u2014]', '-', str(t or ''))


def enc(s):  # same safe set as encodeURIComponent
    return quote(s, safe="-_.!~*'()")


# ---------------------------------------------------------------- data
def load():
    t = open(os.path.join(SHOP, 'data.js'), encoding='utf-8').read()
    P = json.loads(re.search(r'window\.PRODUCTS=(\[.*?\]);', t, re.S).group(1))
    K = json.loads(re.search(r'window\.PICKS=(\{.*?\});', t, re.S).group(1))
    A = json.loads(re.search(r'window\.ALIASES=(\{.*?\});', t, re.S).group(1))
    return P, K, A


P, PICKS, ALIASES = load()
BYID = {p['id']: p for p in P}


def bd(p):
    return '' if p['b'] == HB else p['b']


def strip_name(p):
    n = p.get('dn') or ''
    if n:
        return clean(n)
    n = clean(p['n'])
    n = re.sub(r'^' + re.escape(p['b']) + r'[\s-]*', '', n, flags=re.I) or n
    return n


def alt_of(p):
    return (bd(p) + ' ' if bd(p) else '') + strip_name(p)


def dk(n):
    m = re.search(r'(\d+(?:\.\d+)?)\s*k\s*puffs?', n, re.I) or re.search(r'\b(\d+(?:\.\d+)?)\s*k\b', n, re.I)
    return float(m.group(1)) if m else 0


def dsize(n):
    m = re.search(r'(\d+(?:\.\d+)?)\s*(ml|gm|g|mg)\b', n, re.I)
    if not m:
        return ''
    u = m.group(2).lower()
    return m.group(1) + ('g' if u == 'gm' else u)


def dlist(a):
    return ''.join(a) if len(a) < 2 else ', '.join(a[:-1]) + ' and ' + a[-1]


def fl_list(p):
    seen, out = set(), []
    for f in p.get('f') or []:
        n = str(f).strip()
        if n and n.lower() not in seen:
            seen.add(n.lower())
            out.append(n)
    return out


def prod_desc(p):
    fl = fl_list(p)
    f = list(p.get('df') or [])
    if p.get('ppb', 0) > 0:
        f.append('%s pieces per box' % p['ppb'])
    if fl:
        f.append('%d %s to choose from' % (len(fl), 'flavor' if len(fl) == 1 else 'flavors'))
    s = strip_name(p) + (' from ' + bd(p) if bd(p) else '') + ', in our ' + p['c'] + ' range.'
    if f:
        s += ' Details: ' + dlist(f) + '.'
    if p.get('nt'):
        s += ' ' + ' '.join(clean(x) + '.' for x in p['nt'])
    return s + ' Wholesale for US retailers, 21+ only. Get a quote for bulk terms.'


def brand_desc(b, lst):
    cs = []
    for x in lst:
        if x['c'] not in cs:
            cs.append(x['c'])
    mk = max([dk(x['n']) for x in lst] + [0])
    fl = len({y.lower() for x in lst for y in (x.get('f') or [])})
    bits = []
    if mk:
        bits.append('puff counts up to %dK' % mk)
    if fl:
        bits.append('%d %s listed' % (fl, 'flavor' if fl == 1 else 'flavors'))
    n = len(lst)
    return '%s: %d %s in %s%s. Wholesale for US retailers, 21+ only; get a quote for bulk terms.' % (
        clean(b), n, 'product' if n == 1 else 'products', dlist(cs), (', with ' + dlist(bits)) if bits else '')


def slug_of(p):
    for k, v in CATS.items():
        if v == p['c']:
            return k


def items_for(slug):
    if slug == 'all':
        return P
    if slug in ('new', 'trending'):
        return [BYID[i] for i in PICKS.get(slug, []) if i in BYID]
    return [p for p in P if slug_of(p) == slug]


def img_src(p):
    return '/shop/' + p['i'] if p.get('i') else ''


def art_picks(items, n=3):
    """up to n products with photos, different brands first"""
    out, seen = [], set()
    for p in items:
        if p.get('i') and p['b'] not in seen:
            out.append(p)
            seen.add(p['b'])
        if len(out) == n:
            return out
    for p in items:
        if p.get('i') and p not in out:
            out.append(p)
        if len(out) == n:
            break
    return out


# ---------------------------------------------------------------- shared chrome
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600&family=DM+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">')

ARR = '<svg class="arr" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

AGE = '''<div class="age" id="age" hidden role="dialog" aria-modal="true" aria-labelledby="age-title">
<div class="age__card"><img src="/assets/red-apple-logo.svg" alt="Red Apple Distribution" width="236" height="100">
<p class="age__big" id="age-title">Are you 21 or older?</p>
<p class="age__txt">Wholesale only, sold to licensed retailers. Please confirm your age to continue.</p>
<div class="age__btns"><button class="btn btn--red" id="age-yes" type="button">Yes, I am 21+</button><button class="btn btn--line" id="age-no" type="button">No</button></div>
<p class="age__deny" id="age-deny" hidden>Sorry, you must be 21 or older to visit this website.</p></div></div>'''

HEADER = '''<header class="nav" id="nav"><div class="wrap nav__in">
<a href="/" class="nav__logo"><img src="/assets/red-apple-logo.svg" alt="Red Apple Distribution" width="123" height="52"></a>
<nav class="nav__links" id="links" aria-label="Main">
<a href="/shop/c/all/">Shop catalog</a><a href="/#how">How it works</a><a href="/shop/brands/">Brands</a><a href="/shop/faq/">FAQ</a><a href="/shop/about/">About</a>
<a href="/shop/account/signin/" class="nav__acct" data-ra-acct>Sign in</a><a href="/shop/account/signup/" class="nav__acct-btn btn btn--line btn--sm" data-ra-acct-cta>Create account</a>
<a href="/shop/quote/" class="btn btn--red btn--sm nav__quote">Get a quote<span class="nav__n" data-nav-n hidden></span></a>
</nav>
<button class="nav__burger" id="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="links"><span></span><span></span></button>
</div></header>'''

FOOTER = '''<footer class="foot"><div class="wrap foot__top">
<div class="foot__brand"><a href="/" class="nav__logo"><img src="/assets/red-apple-logo.svg" alt="Red Apple Distribution" width="170" height="72"></a>
<p>Wholesale supply for smoke shops, vape shops and convenience stores across the United States.</p></div>
<div class="foot__col"><b>Catalog</b><a href="/shop/c/vapes/">Disposable vapes</a><a href="/shop/c/edibles/">Edibles</a><a href="/shop/c/hydroxys/">Hydroxys</a><a href="/shop/c/pre-rolls/">Pre-rolls</a><a href="/shop/c/flower/">Flower</a><a href="/shop/brands/">Brands</a></div>
<div class="foot__col"><b>Company</b><a href="/shop/about/">About us</a><a href="/shop/faq/">FAQ</a><a href="/shop/contact/">Contact</a><a href="/shop/reviews/">Reviews</a><a href="/shop/policy/">Shipping and delivery</a><a href="/shop/returns/">Returns</a><a href="/shop/terms/">Terms</a><a href="/shop/privacy/">Privacy</a><a href="/shop/privacy/" data-ra-cookie-settings>Cookie settings</a></div>
</div><div class="wrap foot__base"><p>&copy; 2026 Red Apple Distribution</p><p>Wholesale only. Sold to licensed retailers, 21+.</p></div></footer>'''

ALERTS = '''<section class="sec sec--d alerts" aria-labelledby="al-h"><div class="wrap alerts__in">
<div><h2 class="h2" id="al-h">New drops and <em>restock</em> alerts</h2><p class="lead">Share your email or WhatsApp number and we will send new drops, trending picks and restock alerts.</p></div>
<form class="sub" data-sub novalidate><label for="sub-in">Email or WhatsApp number</label>
<div class="sub__row"><input id="sub-in" name="contact" type="text" autocomplete="email" inputmode="email" maxlength="120"><button class="btn btn--red" type="submit">Subscribe</button></div>
<input class="rq-hp" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="sub__msg" role="status" aria-live="polite"></p></form></div></section>'''


def head(title, desc, path, robots=None, ld=None, image=None, typ='website'):
    url = SITE + path
    img = image or SITE + '/assets/og-logo.png'
    h = ['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
         '<title>%s</title>' % e(title), '<meta name="description" content="%s">' % e(desc),
         '<link rel="canonical" href="%s">' % e(url)]
    if robots:
        h.append('<meta name="robots" content="%s">' % robots)
    h.append('<meta name="theme-color" content="#790B13"><meta property="og:type" content="%s"><meta property="og:site_name" content="Red Apple Distribution">' % typ)
    h.append('<meta property="og:title" content="%s"><meta property="og:description" content="%s"><meta property="og:url" content="%s"><meta property="og:image" content="%s">' % (e(title), e(desc), e(url), e(img)))
    h.append('<meta name="twitter:card" content="summary_large_image">')
    h.append('<link rel="icon" href="/assets/red-apple-mark.svg"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/apple-touch-icon.png">')
    h.append(FONTS)
    h.append('<script>document.documentElement.className+=" js"</script>')
    h.append('<link rel="stylesheet" href="/shop/app.css"><link rel="stylesheet" href="/consent.css">')
    h.append('<script src="/shop/config.js"></script>')
    for obj in ld or []:
        h.append('<script type="application/ld+json">%s</script>' % json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/'))
    h.append('</head>')
    return ''.join(h)


def page(path, title, desc, main, data=True, flavors=False, robots=None, ld=None, image=None, typ='website', extra_main_attrs=''):
    scripts = ['/shop/data.js'] if data else []
    if flavors:
        scripts.append('/shop/flavors.js')
    scripts += ['/shop/reviews.js', '/consent.js', '/shop/app.js']
    s = ''.join('<script src="%s" defer></script>' % x for x in scripts)
    return (head(title, desc, path, robots, ld, image, typ) + '<body class="shop"><a class="skip" href="#main">Skip to content</a>' + AGE + HEADER +
            main + FOOTER + s + '</body></html>')


def write(path, html):
    parts = [unquote(x) for x in path.split('/') if x][1:]  # drop the leading 'shop'; brand folders use the raw name
    d = os.path.join(SHOP, *parts)
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
    return len(html.encode('utf-8'))


# ---------------------------------------------------------------- components
def card(p):
    src = img_src(p)
    im = ('<img src="%s" alt="%s" loading="lazy" decoding="async">' % (e(src), e(alt_of(p)))) if src else \
        '<img class="is-mark" src="/assets/red-apple-mark.svg" alt="" loading="lazy" decoding="async">'
    if fl_list(p):
        add = '<a class="pc__add" href="/shop/p/%d/#buy">Choose flavor</a>' % p['id']
    else:
        add = '<button class="pc__add" type="button" data-act="card-add" data-id="%d">Add to quote</button>' % p['id']
    return ('<li class="pc"><a class="pc__a" href="/shop/p/%d/"><span class="pc__art">%s</span><span class="pc__b">%s</span><span class="pc__n">%s</span></a>%s</li>'
            % (p['id'], im, e(bd(p)), e(strip_name(p)), add))


def cards(items, budget=BUDGET):
    out, used = [], 0
    for p in items:
        c = card(p)
        if used + len(c.encode()) > budget:
            break
        out.append(c)
        used += len(c.encode())
    return ''.join(out)


def crumbs(*parts):
    li = ['<li><a href="/">Home</a></li>']
    for i, (name, href) in enumerate(parts):
        if href and i < len(parts) - 1:
            li.append('<li><a href="%s">%s</a></li>' % (href, e(name)))
        else:
            li.append('<li aria-current="page">%s</li>' % e(name))
    return '<nav class="crumbs" aria-label="Breadcrumb"><ol>%s</ol></nav>' % ''.join(li)


def crumb_ld(parts):
    items = [{'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'}]
    for i, (name, href) in enumerate(parts):
        it = {'@type': 'ListItem', 'position': i + 2, 'name': name}
        if href:
            it['item'] = SITE + href
        items.append(it)
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': items}


def art_html(prods, big_mark=False):
    if prods:
        imgs = ''.join('<img class="a a%d" src="%s" alt="%s" data-depth="%d">' % (i + 1, e(img_src(p)), e(alt_of(p)), (i + 1) * 12) for i, p in enumerate(prods))
    elif big_mark:
        imgs = '<img class="a a1 is-mark" src="/assets/red-apple-mark.svg" alt="" data-depth="14">'
    else:
        imgs = ''
    return '<div class="phead__art" aria-hidden="false">%s</div>' % imgs if imgs else ''


def phead(crumb_html, eyebrow, h1_html, lead, art='', extra=''):
    return ('<section class="phead sec--b%s"><div class="phead__panel" aria-hidden="true"></div><div class="wrap phead__in"><div class="phead__copy">%s'
            '<p class="eyebrow">%s</p><h1 class="phead__h">%s</h1>%s%s</div></div>%s</section>'
            % (' phead--art' if art else '', crumb_html, e(eyebrow), h1_html, ('<p class="lead">%s</p>' % e(lead)) if lead else '', extra, art))


def faq_item(q, a, i, pre='f'):
    return ('<div class="faq__item%s" data-faq><h3><button class="faq__q" type="button" id="%s-q%d" aria-expanded="%s" aria-controls="%s-a%d"><span>%s</span><i class="faq__ic" aria-hidden="true"></i></button></h3>'
            '<div class="faq__a" id="%s-a%d" role="region" aria-labelledby="%s-q%d"><div><p>%s</p></div></div></div>'
            % (' is-open' if i == 0 and pre != 'f' else '', pre, i, 'true' if i == 0 and pre != 'f' else 'false', pre, i, e(q), pre, i, pre, i, e(a)))


FAQS = [
    ('Is Red Apple Distribution an American brand?', 'Yes, we focus on the American market and are a US-based brand.', 'about'),
    ('Do you ship overseas?', 'Our products are only targeted at the United States. We are not open to other countries for the time being.', 'shipping'),
    ('Do you offer replacements or credit for product issues?', 'We do not offer replacements. If your order arrives damaged or you receive a duplicate product, we will issue a credit after we verify the issue with the shipping partner and the vendor. Otherwise, no credit is issued.', 'returns'),
    ('What shipping method do you use for delivery?', 'We ship with FedEx and UPS.', 'shipping'),
    ('What is the minimum order?', 'Bulk quotes start at 10 boxes, as we are a wholesaler. Under 10 boxes? Send the request anyway and our team will tell you what is possible.', 'ordering'),
    ('How do I get wholesale pricing?', 'Add products to your quote list, share your details, and send the request. Our team connects with you with bulk pricing.', 'ordering'),
    ('Where can I see the price?', 'Pricing is given per quote, based on your products, quantity and state. Request a quote and our team will connect with you.', 'ordering'),
    ('Who can request a quote?', 'Quotes are for retail businesses, and everyone must be 21 or older.', 'ordering'),
    ('Do I pay on the website?', 'There is no payment on the website. Our team arranges everything with you directly.', 'ordering'),
    ('Can you source a product that is not listed?', 'Yes. Ask our team through the contact page.', 'ordering'),
    ('Do I need an account?', 'No. Accounts are optional. You can browse and request quotes as a guest. An account saves your quote list and your quote history.', 'account'),
]


# ---------------------------------------------------------------- pages
def build_cat(slug):
    items = items_for(slug)
    title = TITLES[slug]
    brands = {p['b'] for p in items if p['b'] != HB}
    path = '/shop/c/%s/' % slug
    cr = [('Shop', '/shop/c/all/'), (title, path)] if slug != 'all' else [('Shop', path)]
    pre, em = EM.get(slug, ('Wholesale', title + '.'))
    h1 = '%s <em>%s</em>' % (pre, em)
    art = art_html(art_picks(items), big_mark=True)
    ph = phead(crumbs(*cr), 'Wholesale catalog', h1, LEAD[slug], art)
    cat_block = ''
    if slug == 'all':
        tiles = []
        for k, v in CATS.items():
            ap = art_picks([p for p in P if p['c'] == v], 1)
            cnt = len([p for p in P if p['c'] == v])
            im = ('<img class="cat__art" src="%s" alt="" loading="lazy" decoding="async">' % e(img_src(ap[0]))) if ap else '<img class="cat__art is-mark" src="/assets/red-apple-mark.svg" alt="" loading="lazy">'
            tiles.append('<li><a class="cat" href="/shop/c/%s/">%s<span class="cat__t"><span class="cat__n">%s</span><span class="cat__c">%d products</span></span><span class="cat__go" aria-hidden="true">%s</span></a></li>' % (k, im, e(TITLES[k]), cnt, ARR))
        cat_block = '<section class="sec sec--d cats" aria-labelledby="cats-h"><div class="wrap"><h2 class="h2" id="cats-h">Shop by <em>category</em></h2><ul class="cats__grid">%s</ul></div></section>' % ''.join(tiles)
    puff = any(dk(p['n']) for p in items)
    tools = ('<form class="tools" id="tools" role="search" aria-label="Filter products" onsubmit="return false">'
             '<div class="tf tf--q"><label for="f-q">Search</label><input id="f-q" type="search" name="q" autocomplete="off" placeholder="Product or brand"></div>'
             '<div class="tf"><label for="f-b">Brand</label><select id="f-b" name="brand"><option value="">All brands</option></select></div>'
             + ('<div class="tf"><label for="f-p">Puff count</label><select id="f-p" name="puff"><option value="">Any</option><option value="10">10K and up</option><option value="20">20K and up</option><option value="30">30K and up</option></select></div>' if puff else '') +
             '<div class="tf"><label for="f-s">Sort</label><select id="f-s" name="sort"><option value="">Featured</option><option value="az">Name A to Z</option><option value="brand">Brand A to Z</option>' + ('<option value="puff">Puff count, high to low</option>' if puff else '') + '</select></div>'
             + ('<label class="tf tf--chk" for="f-n"><input id="f-n" type="checkbox" name="newonly"><span>New only</span></label>' if slug not in ('new',) else '') +
             '<p class="tools__n" id="count" role="status" aria-live="polite">%d products</p></form>' % len(items))
    qa = ''.join(faq_item(q % title.lower() if '%s' in q else q, a, i, 'c') for i, (q, a) in enumerate([
        ('How do I get wholesale pricing?', 'Add products to your quote list, then tap Get a quote and share your details. Our team will contact you with bulk pricing.'),
        ('Where can I see the price?', 'Pricing is given per quote, based on your products, quantity and state. Request a quote and our team will connect with you.'),
        ('Which brands do you carry?', 'Use the brand filter above, or open the Brands page for the full list.')]))
    grid = ('<section class="sec sec--i catalog" aria-label="Products"><div class="wrap">%s<ul class="pgrid" id="grid" data-static="%d">%s</ul>'
            '<p class="more"><button class="btn btn--ink" type="button" data-act="load-more" hidden>Load more products</button></p></div></section>' % (tools, len(items), cards(items)))
    faq = '<section class="sec sec--b faqs" aria-labelledby="cf-h"><div class="wrap faq__in"><div class="faq__copy"><h2 class="h2" id="cf-h">%s, <em>answered</em></h2></div><div class="faq__list">%s</div></div></section>' % (e(title), qa)
    main = '<main id="main" data-page="cat" data-slug="%s">%s%s%s%s%s</main>' % (slug, ph, cat_block, grid, faq, ALERTS)
    names = [p for p in items][:30]
    ld = [crumb_ld(cr)]
    t = {'all': 'Wholesale Catalog, All Products', 'new': 'New Arrivals, Wholesale', 'trending': 'Trending Wholesale Products'}.get(slug, 'Wholesale %s for Smoke Shops' % title)
    desc = ('Wholesale %s for US smoke shops: %d products from %d brands. Request a quote for bulk pricing. Retailers 21+ only.' % (title.lower() if slug not in ('all', 'new', 'trending') else 'products', len(items), len(brands)))
    if slug == 'all':
        desc = 'The full Red Apple Distribution wholesale catalog: %d products from %d brands for US smoke shops. Request a quote for bulk pricing.' % (len(items), len(brands))
    elif slug in ('new', 'trending'):
        desc = '%s at Red Apple Distribution: %d wholesale products for US retailers. Request a quote for bulk pricing.' % ('New arrivals' if slug == 'new' else 'Trending products', len(items))
    return write(path, page(path, t + ' | Red Apple Distribution', desc, main, ld=ld))


def build_product(p):
    path = '/shop/p/%d/' % p['id']
    sl = slug_of(p)
    cr = [('Shop', '/shop/c/all/'), (TITLES.get(sl, p['c']), '/shop/c/%s/' % sl), (strip_name(p), path)]
    name = strip_name(p)
    full = (bd(p) + ' ' if bd(p) else '') + name
    fl = fl_list(p)
    src = img_src(p)
    im = ('<img id="main-img" src="%s" alt="%s" fetchpriority="high">' % (e(src), e(alt_of(p)))) if src else '<img id="main-img" class="is-mark" src="/assets/red-apple-mark.svg" alt="">'
    brand = ('<p class="pdp__brand"><a href="/shop/brand/%s/">%s</a></p>' % (e(enc(p['b'])), e(p['b']))) if bd(p) else ''
    desc = prod_desc(p)
    rel = [x for x in P if x['c'] == p['c'] and x['b'] != p['b']]
    rel = sorted(rel, key=lambda x: ((x['id'] * 7 + p['id']) % 97))[:4]
    safe_n = re.sub(r'\s+', ' ', re.sub(r'\(?\s*texas\s+compl\w+\s*\)?\.?', '', re.sub(r'\s*-?\s*pre[\s-]*priced?\s*-?\s*\$?\s*\d+(?:\.\d+)?', '', clean(p['n']), flags=re.I), flags=re.I)).strip()
    dl = '<dl class="spec"><div><dt>Full product name</dt><dd>%s</dd></div><div><dt>Category</dt><dd><a href="/shop/c/%s/">%s</a></dd></div>' % (e(safe_n), sl, e(TITLES.get(sl, p['c'])))
    if bd(p):
        dl += '<div><dt>Brand</dt><dd><a href="/shop/brand/%s/">%s</a></dd></div>' % (e(enc(p['b'])), e(p['b']))
    if p.get('ppb', 0) > 0:
        dl += '<div><dt>Pack</dt><dd>%s pieces per box</dd></div>' % p['ppb']
    if p.get('bpc', 0) > 0:
        dl += '<div><dt>Case</dt><dd>%s boxes per case</dd></div>' % p['bpc']
    dl += '<div><dt>Shipping</dt><dd>We ship with FedEx and UPS. Orders go to US addresses only.</dd></div></dl>'
    flv = ''
    if fl:
        flv = '<details class="flv"><summary>%d flavors listed</summary><ul>%s</ul></details>' % (len(fl), ''.join('<li>%s</li>' % e(clean(f)) for f in fl))
    main = ('<main id="main" data-page="prod" data-id="%d">'
            '<section class="sec sec--b pdp-top"><div class="wrap">%s<div class="pdp"><div class="pdp__stage"><div class="pdp__img" id="stage">%s</div><ul class="pdp__th" id="thumbs" aria-label="Product images"></ul></div>'
            '<div class="pdp__info">%s<h1 class="pdp__h">%s</h1><p class="pdp__desc">%s</p>'
            '<div id="buy" class="buy"><a class="btn btn--red" href="/shop/quote/">Get a quote</a></div></div></div></div></section>'
            '<section class="sec sec--i pdp-more"><div class="wrap pdp-more__in"><div><h2 class="h2">Product <em>details</em></h2>%s</div><div>%s</div></div></section>'
            '<section class="sec sec--b related" aria-labelledby="rel-h"><div class="wrap"><h2 class="h2" id="rel-h">More <em>%s</em></h2><ul class="pgrid pgrid--on-b" id="related">%s</ul></div></section>'
            '%s</main>') % (p['id'], crumbs(*cr), im, brand, e(name), e(desc), dl, flv, e(TITLES.get(sl, p['c']).lower()), ''.join(card(x) for x in rel), ALERTS)
    ld = [crumb_ld(cr)]
    prod = {'@context': 'https://schema.org', '@type': 'Product', 'name': full, 'description': desc, 'category': p['c'], 'sku': str(p['id']), 'url': SITE + path}
    if bd(p):
        prod['brand'] = {'@type': 'Brand', 'name': p['b']}
    prod['image'] = [SITE + src] if src else [SITE + '/assets/og-logo.png']
    ld.append(prod)
    title = full
    if len(title) > 52:
        title = title[:51].rstrip() + '...'
    return write(path, page(path, title + ' Wholesale | Red Apple Distribution', desc, main, flavors=True, ld=ld, image=(SITE + src) if src else None, typ='product'))


def build_brands():
    bs = {}
    for p in P:
        if p['b'] != HB:
            bs.setdefault(p['b'], []).append(p)
    names = sorted(bs, key=lambda n: n.lower())
    rows = ''.join('<li><a href="/shop/brand/%s/"><b>%s</b><i>%d</i></a></li>' % (e(enc(n)), e(n), len(bs[n])) for n in names)
    cr = [('Brands', '/shop/brands/')]
    art = art_html(art_picks(P, 3), True)
    ph = phead(crumbs(*cr), 'Brands we carry', 'Every <em>brand</em>', '%d brands across vapes, hydroxys, edibles, pre-rolls and more. Open one to see its products.' % len(names), art)
    main = '<main id="main" data-page="brands">%s<section class="sec sec--i" aria-label="Brand list"><div class="wrap"><ul class="blist" id="blist">%s</ul></div></section>%s</main>' % (ph, rows, ALERTS)
    path = '/shop/brands/'
    return write(path, page(path, 'Brands We Carry | Red Apple Distribution', 'All %d wholesale brands at Red Apple Distribution, including Geek Bar, Raz, Lost Mary and Muha Meds. Request a quote for bulk pricing.' % len(names), main, ld=[crumb_ld(cr)]))


def build_brand(b):
    lst = [p for p in P if p['b'] == b]
    path = '/shop/brand/%s/' % enc(b)
    cr = [('Brands', '/shop/brands/'), (b, path)]
    art = art_html(art_picks(lst), True)
    ph = phead(crumbs(*cr), 'Brand', '<em>%s</em>' % e(b), brand_desc(b, lst), art)
    main = ('<main id="main" data-page="brand" data-brand="%s">%s<section class="sec sec--i" aria-label="Products"><div class="wrap"><ul class="pgrid" id="grid" data-static="%d">%s</ul>'
            '<p class="more"><button class="btn btn--ink" type="button" data-act="load-more" hidden>Load more products</button></p></div></section>%s</main>') % (e(b), ph, len(lst), cards(lst), ALERTS)
    return write(path, page(path, '%s Wholesale | Red Apple Distribution' % clean(b), brand_desc(b, lst), main, ld=[crumb_ld(cr)], image=(SITE + img_src(art_picks(lst, 1)[0])) if art_picks(lst, 1) else None))


def steps_block():
    return ('<section class="sec sec--b steps" aria-labelledby="st-h"><div class="wrap"><h2 class="h2" id="st-h">How a quote <em>works</em></h2><ol class="how__grid">'
            '<li class="step"><span class="step__n" aria-hidden="true">1</span><h3>Browse and add</h3><p>Pick the products and quantities you need and add them to your quote list.</p></li>'
            '<li class="step"><span class="step__n" aria-hidden="true">2</span><h3>Request your quote</h3><p>Share your shop name, email and WhatsApp or phone number. There is nothing to pay on the website.</p></li>'
            '<li class="step"><span class="step__n" aria-hidden="true">3</span><h3>We connect with you</h3><p>Our team contacts you with bulk pricing and next steps.</p></li></ol></div></section>')


def cta_block(h='Ready to stock your <em>shelves?</em>'):
    return ('<section class="sec sec--d cta"><div class="wrap cta__in"><h2 class="h2">%s</h2><div class="cta__b"><a class="btn btn--red" href="/shop/c/all/">Shop the catalog</a><a class="btn btn--line" href="/shop/quote/">Get a quote</a></div></div></section>' % h)


def build_about():
    path = '/shop/about/'
    cr = [('About', path)]
    ph = phead(crumbs(*cr), 'About us', 'Wholesale, made <em>easy.</em>', 'Red Apple Distribution is a wholesale supplier for smoke shops, vape shops, convenience stores and other retailers across the United States.', art_html(art_picks([BYID[i] for i in PICKS['trending'] if i in BYID], 3)))
    why = [('Quality', 'Genuine products only, sourced from trusted brands. What you order is what you stock.'),
           ('Variety', 'One supplier for many categories. Browse all brands or jump straight to new arrivals and trending products.'),
           ('Service', 'A real person follows up on every quote request by WhatsApp, phone or email, whichever you prefer.'),
           ('Consistency', 'Reliable supply and clear communication, so you can keep your shelves stocked with confidence.')]
    main = ('<main id="main" data-page="about">%s'
            '<section class="sec sec--i"><div class="wrap two"><div><h2 class="h2">Who we <em>are</em></h2></div><div class="prose">'
            '<p>Red Apple Distribution supplies retailers with the products their customers ask for. Our catalog covers wholesale vapes, flower, hydroxy products, edibles, pre-rolls, kratom, shrooms and smoke accessories, all from brands shop owners already know and trust.</p>'
            '<p>We built Red Apple Distribution around one idea: buying wholesale should be simple. Browse the catalog, build your list, and request a quote. Our team follows up personally with bulk pricing for your shop.</p></div></div></section>'
            '<section class="sec sec--b"><div class="wrap two"><div><h2 class="h2">Our <em>goal</em></h2></div><div class="prose">'
            '<p>Our goal is to give retailers genuine products, honest bulk pricing and service they can count on. Every product we carry is authentic. We do not deal in dupes, duplicates or lookalikes, because your customers and your reputation depend on it.</p>'
            '<p>We ship across the United States with FedEx and UPS, so wherever your shop is, we can supply it. Have a question before you order? <a href="/shop/contact/">Contact our team</a> and we will help.</p></div></div></section>'
            '<section class="sec sec--i"><div class="wrap"><h2 class="h2">Why retailers <em>choose us</em></h2><dl class="why">%s</dl></div></section>'
            '%s'
            '<section class="sec sec--i"><div class="wrap two"><div><h2 class="h2">Brands we <em>carry</em></h2></div><div class="prose"><p>Retailers come to us for the names their customers search for. Popular brands include Geek Bar, Viva La Hemp, RAZ, Lost Mary, Fogger, Psyched Blue, 7 OHMZ and Mellow Fellow.</p><p><a class="btn btn--ink" href="/shop/brands/">View all brands</a></p></div></div></section>'
            '<section class="sec sec--d"><div class="wrap"><p class="fine">Red Apple Distribution is a wholesale business. This website is for adults 21 and older who buy for a retail business. Product availability and legality vary by state, and buyers are responsible for following the laws that apply where they sell.</p></div></section>'
            '%s</main>') % (ph, ''.join('<div><dt>%s</dt><dd>%s</dd></div>' % (a, b) for a, b in why), steps_block(), cta_block())
    return write(path, page(path, 'About Red Apple Distribution | US Wholesale Supplier', 'Red Apple Distribution is a US wholesale supplier for smoke shops, vape shops and convenience stores. Genuine products, honest bulk pricing and a real person on every quote.', main, data=False, ld=[crumb_ld(cr)]))


def contact_card(label, val, href):
    return '<div><dt>%s</dt><dd><a href="%s">%s</a></dd></div>' % (label, href, val)


def build_contact():
    path = '/shop/contact/'
    cr = [('Contact', path)]
    ph = phead(crumbs(*cr), 'Contact', 'Talk to a <em>rep.</em>', 'Questions about a quote, a product or your account? Share your details and our team will get back to you. Looking for prices? Request a quote and we will connect with you.')
    form = ('<form class="rq-card form" data-form="contact" novalidate><h2 class="rq-h2">Send us a message</h2>'
            '<div class="rq-row2"><div class="rq-f"><label for="c-name">Your name <span aria-hidden="true">*</span></label><input class="rq-in" id="c-name" name="contact" autocomplete="name" required></div>'
            '<div class="rq-f"><label for="c-shop">Shop name</label><input class="rq-in" id="c-shop" name="shop" autocomplete="organization"></div></div>'
            '<div class="rq-row2"><div class="rq-f"><label for="c-email">Email <span aria-hidden="true">*</span></label><input class="rq-in" id="c-email" name="email" type="email" autocomplete="email" required></div>'
            '<div class="rq-f"><label for="c-wa">WhatsApp or mobile number <span aria-hidden="true">*</span></label><input class="rq-in" id="c-wa" name="whatsapp" type="tel" autocomplete="tel" inputmode="tel" required></div></div>'
            '<div class="rq-f"><label for="c-msg">Message <span aria-hidden="true">*</span></label><textarea class="rq-ta" id="c-msg" name="message" rows="5" required></textarea></div>'
            '<input class="rq-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input class="rq-hp" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">'
            '<p class="rq-err" data-err role="alert"></p><button class="btn btn--red" type="submit">Send message</button>'
            '<p class="rq-ok" data-ok hidden role="status">Thank you. Your message is on its way to our team. We reply during business hours.</p></form>')
    main = ('<main id="main" data-page="contact">%s<section class="sec sec--i"><div class="wrap contact"><div><dl class="reach">%s%s%s<div><dt>Business hours</dt><dd>8:30 AM to 9:30 PM US time</dd></div></dl></div>%s</div></section>%s</main>'
            % (ph, contact_card('Email', 'sales@redappledistro.com', 'mailto:sales@redappledistro.com'), contact_card('Phone', '(347) 937-9103', 'tel:+13479379103'),
               contact_card('WhatsApp', '+1 (502) 616-3671', 'https://wa.me/15026163671'), form, cta_block('Browse first, <em>quote</em> later')))
    return write(path, page(path, 'Contact Red Apple Distribution', 'Contact the Red Apple Distribution sales team by email, phone or WhatsApp. Business hours 8:30 AM to 9:30 PM US time.', main, data=False, ld=[crumb_ld(cr)]))


def build_faq():
    path = '/shop/faq/'
    cr = [('FAQ', path)]
    ph = phead(crumbs(*cr), 'FAQ', 'Questions, <em>answered.</em>', 'Short answers about quotes, shipping and credit.')
    chips = [('all', 'All'), ('ordering', 'Ordering'), ('shipping', 'Shipping'), ('returns', 'Returns and guarantee'), ('account', 'Account'), ('about', 'About us')]
    chip_html = ''.join('<button class="fchip" type="button" data-cat="%s" aria-pressed="%s">%s</button>' % (k, 'true' if k == 'all' else 'false', v) for k, v in chips)
    items = ''.join(faq_item(q, a, i, 'f').replace('data-faq>', 'data-faq data-cat="%s">' % c, 1) for i, (q, a, c) in enumerate(FAQS))
    main = ('<main id="main" data-page="faq">%s<section class="sec sec--i faqs faqs--i"><div class="wrap faq__in"><div class="faq__copy"><div class="fchips" role="group" aria-label="Filter questions">%s</div>'
            '<p class="lead">Still have a question?</p><p><a class="btn btn--ink" href="/shop/contact/">Contact us</a></p></div><div class="faq__list" id="faq-list">%s</div></div></section>%s</main>' % (ph, chip_html, items, cta_block()))
    ld = [crumb_ld(cr), {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a, c in FAQS]}]
    return write(path, page(path, 'FAQ | Red Apple Distribution', 'Answers about wholesale quotes, the 10 box minimum, shipping with FedEx and UPS, and credits for damaged product at Red Apple Distribution.', main, data=False, ld=ld))


CONTACT_LINE = 'sales@redappledistro.com, (347) 937-9103 or WhatsApp +1 (502) 616-3671. Business hours are 8:30 AM to 9:30 PM US time.'
DOCS = {
    'policy': ('Shipping and delivery', 'Shipping and Delivery | Red Apple Distribution', 'Shipping and delivery at Red Apple Distribution: FedEx and UPS to US addresses, 10 box wholesale minimum and credits for damaged product.', [
        ('Carriers', ['We ship with FedEx and UPS. Orders go to US addresses only.']),
        ('Minimum order', ['Bulk quotes start at 10 boxes, as we are a wholesaler. Under 10 boxes? Send the request anyway and our team will tell you what is possible.']),
        ('Credits', ['We do not offer replacements. If your order arrives damaged or you receive a duplicate product, we will issue a credit after we verify the issue with the shipping partner and the vendor. Otherwise, no credit is issued.']),
        ('Contact us', ['Questions about shipping? Reach our team at ' + CONTACT_LINE])]),
    'terms': ('Terms of sale', 'Terms of Sale | Red Apple Distribution', 'Terms of sale for Red Apple Distribution: wholesale only, quote-only website, 21+ buyers and licensed US retailers.', [
        ('Who can buy', ['Red Apple Distribution sells wholesale only, to licensed retailers in the United States. This website is for adults 21 and older who are buying for a retail business. By using it you confirm that you are 21 or older and that you are requesting a quote for a retail business.']),
        ('Quotes, not online orders', ['This website is quote-only. Nothing is charged on this website, and sending a quote request is not a purchase. Our team contacts you with bulk pricing and next steps.', 'Bulk quotes start at 10 boxes. Under 10 boxes? Send the request anyway and our team will tell you what is possible.']),
        ('Pricing', ['Pricing is provided per quote and depends on the products, the quantity and your state.']),
        ('Shipping', ['We ship with FedEx and UPS to US addresses only. See Shipping and delivery for details.']),
        ('Damaged or duplicate product', ['We do not offer replacements. If your order arrives damaged or you receive a duplicate product, we will issue a credit after we verify the issue with the shipping partner and the vendor. Otherwise, no credit is issued. See Returns and credits.']),
        ('Local laws', ['Availability, legality and labeling rules differ by state and locality. The buyer is responsible for knowing and following all laws that apply where they sell.']),
        ('Contact us', ['Questions about these terms? Reach our team at ' + CONTACT_LINE])]),
    'returns': ('Returns and credits', 'Returns and Credits | Red Apple Distribution', 'Returns and credits at Red Apple Distribution: no replacements, credit for damaged or duplicate product after verification.', [
        ('No replacements', ['We do not offer replacements.']),
        ('Damaged or duplicate product', ['If your order arrives damaged or you receive a duplicate product, we will issue a credit after we verify the issue with the shipping partner and the vendor. Otherwise, no credit is issued.']),
        ('Report a problem', ['Contact our team and tell us what happened, with your quote reference number if you have it: ' + CONTACT_LINE, 'See also <a href="/shop/policy/">Shipping and delivery</a>.']),
        ]),
    'privacy': ('Privacy policy', 'Privacy Policy | Red Apple Distribution', 'How Red Apple Distribution collects, uses and protects the details you share in quote requests, messages, reviews and optional accounts.', [
        ('What we collect', ['We only collect what you type into our forms: your name, shop name, email, phone or WhatsApp number, state and the list of products you want quoted, plus any notes, messages or review text you choose to add. If you create an optional account, see Optional accounts below.']),
        ('How we use it', ['We use this information only to respond to your quote request or message. If you sign up for updates, we use your email or WhatsApp number to send the new drops and restock alerts you asked for. Reviews are shown on the site only after we approve them, with the name and shop you gave.']),
        ('How forms are delivered', ['Our forms, including account sign-ups, send your submission to our team by email through the FormSubmit email service. This means your submission passes through FormSubmit on its way to us, and FormSubmit has its own privacy practices.']),
        ('Optional accounts', ['Accounts are optional. You can browse and request quotes without one. If you create an account we keep what you enter on the sign-up form (name, shop name, email, phone, WhatsApp number, state, what you are looking for and your preferred payment method), your saved quote list and the quote requests you send while signed in. The payment method is a preference only. We never ask for card or bank numbers on this website.',
                              'Account data is stored with our account provider, Supabase, so you can sign in from any device. Your password is handled by the provider and we do not see it. Our team can see your account details, reviews new accounts, and gets an email with your sign-up details. To correct or delete your account, contact us: ' + CONTACT_LINE]),
        ('We do not sell your data', ['We do not sell your information.']),
        ('Your browser', ['To make the site work, your browser keeps your 21+ confirmation and your quote list on your own device. If you sign in to an account, it also keeps your sign-in there until you sign out.']),
        ('Cookies and notifications', ['Essential: the site stores a small amount of data in your browser (local storage and one first-party cookie) to remember that you confirmed you are 21 or older, to keep your quote list, to keep you signed in if you have an account, and to remember your cookie choice (cookie name ra_consent, kept for 180 days). The site cannot work without these.',
                                       'Optional: analytics and notifications are off unless you allow them. We do not run any analytics tools today, and we do not set optional cookies before you choose. If you allow notifications, we may send you web alerts about new drops, restocks and trending picks on that device. Alerts are delivered through OneSignal, a third-party notification provider, which receives a device token and the topic of what you viewed (for example the last product category) so we can send relevant alerts, but no name, email or other personal details from us. Its script loads only after you allow notifications. Your browser asks for its own permission only after you tap Enable alerts, and we never send alerts without that.',
                                       'Withdraw any time: open <a href="/shop/privacy/" data-ra-cookie-settings>Cookie settings</a> (also in the footer of every page) and switch an option off. Turning notifications off removes the alert registration from your device.']),
        ('Contact us', ['Questions about your information? Reach our team at ' + CONTACT_LINE])]),
}


def slugify(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def build_doc(key):
    h1, title, desc, secs = DOCS[key]
    path = '/shop/%s/' % key
    cr = [(h1, path)]
    w = h1.split(' ')
    h1h = (e(' '.join(w[:-1])) + ' <em>' + e(w[-1]) + '</em>') if len(w) > 1 else '<em>%s</em>' % e(h1)
    ph = phead(crumbs(*cr), 'Last updated November 17, 2026', h1h, '')
    toc = ''.join('<li><a href="#%s">%s</a></li>' % (slugify(t), e(t)) for t, _ in secs)
    body = ''.join('<section id="%s"><h2>%s</h2>%s</section>' % (slugify(t), e(t), ''.join('<p>%s</p>' % (x if '<a' in x else e(x)) for x in ps)) for t, ps in secs)
    main = '<main id="main" data-page="%s">%s<section class="sec sec--i"><div class="wrap doc"><nav class="doc__toc" aria-label="On this page"><p class="doc__tt">On this page</p><ol>%s</ol></nav><div class="doc__body prose">%s</div></div></section></main>' % (key, ph, toc, body)
    return write(path, page(path, title, desc, main, data=False, ld=[crumb_ld(cr)]))


def acct_main(key, h1, eyebrow, root=True, extra=''):
    inner = '<div data-acct-root><noscript><p>Please turn on JavaScript to use accounts. You can still <a href="/shop/quote/">request a quote</a> as a guest.</p></noscript></div>' if root else extra
    return ('<main id="main" data-page="%s"><section class="sec sec--b acct"><div class="wrap"><p class="eyebrow">%s</p><h1 class="rq-h1 phead__h">%s</h1>%s</div></section></main>' % (key, eyebrow, h1, inner))


def build_private():
    sizes = {}
    NOI = 'noindex,nofollow'
    sizes['signin'] = write('/shop/account/signin/', page('/shop/account/signin/', 'Sign In | Red Apple Distribution', 'Sign in to your Red Apple Distribution retailer account.', acct_main('signin', 'Sign in', 'Retailer account'), robots=NOI))
    sizes['signup'] = write('/shop/account/signup/', page('/shop/account/signup/', 'Create a Retailer Account | Red Apple Distribution', 'Create an optional retailer account to save your quote list and quote history.', acct_main('signup', 'Create your account', 'Retailer account'), robots=NOI))
    sizes['account'] = write('/shop/account/', page('/shop/account/', 'Your Account | Red Apple Distribution', 'Your Red Apple Distribution account.', acct_main('account', 'Your account', 'Retailer account'), robots=NOI))
    sizes['admin'] = write('/shop/admin/', page('/shop/admin/', 'Admin | Red Apple Distribution', 'Admin.', acct_main('admin', 'Retailer accounts', 'Team'), robots=NOI))
    qs = '<main id="main" data-page="qsum"><div data-qs-root><noscript><p class="qs-nojs">Please turn on JavaScript to see your quote summary.</p></noscript></div></main>'
    sizes['qsum'] = write('/shop/quote-summary/', page('/shop/quote-summary/', 'Your Quote Summary | Red Apple Distribution', 'Your quote summary.', qs, robots=NOI))
    return sizes


def build_quote():
    path = '/shop/quote/'
    states = ''
    ph = phead(crumbs(('Get a quote', path)), 'Get a quote', 'Tell us what <em>you need</em>', 'Bulk pricing depends on the products, the quantity and your state. Send us your list and your contact details and our team will connect with you with your price. Nothing is charged on this website.')
    lst = ('<section class="qlist" aria-labelledby="ql-h"><h2 class="rq-h2 on-i" id="ql-h">Your list</h2><div data-qlist aria-live="polite"></div>'
           '<div class="rq-min" data-qmin><div class="rq-min-top"><span class="rq-min-n"><b data-f="q-count">0</b> of 10 boxes</span></div><div class="rq-bar"><i data-f="q-bar"></i></div>'
           '<p class="rq-min-msg" data-f="q-minmsg"></p></div><div data-past hidden></div></section>')
    fields = ('<div class="rq-row2"><div class="rq-f"><label for="q-shop">Business name <span aria-hidden="true">*</span></label><input class="rq-in" id="q-shop" name="shop" autocomplete="organization" required></div>'
              '<div class="rq-f"><label for="q-name">Your name <span aria-hidden="true">*</span></label><input class="rq-in" id="q-name" name="contact" autocomplete="name" required></div></div>'
              '<div class="rq-row2"><div class="rq-f"><label for="q-email">Email <span aria-hidden="true">*</span></label><input class="rq-in" id="q-email" name="email" type="email" autocomplete="email" required></div>'
              '<div class="rq-f"><label for="q-wa">WhatsApp or mobile number <span aria-hidden="true">*</span></label><input class="rq-in" id="q-wa" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" required></div></div>'
              '<div class="rq-row2"><div class="rq-f"><label for="q-state">Your state <span aria-hidden="true">*</span></label><select class="rq-sel" id="q-state" name="state" autocomplete="address-level1" required><option value="">Select your state</option></select></div>'
              '<div class="rq-f"><label for="q-best">Best way to reach you</label><select class="rq-sel" id="q-best" name="best"><option>WhatsApp</option><option>Phone call</option><option>Email</option></select></div></div>'
              '<div class="rq-f"><label for="q-notes">Notes <small>optional</small></label><textarea class="rq-ta" id="q-notes" name="notes" rows="4" placeholder="Flavors, brands, target quantity, or questions"></textarea></div>'
              '<label class="rq-check" for="q-age"><input id="q-age" type="checkbox" name="age"><span>I am 21 or older and I am requesting this quote for a retail business.</span></label>'
              '<input class="rq-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input class="rq-hp" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">'
              '<p class="rq-err" data-err role="alert"></p><button class="btn btn--red" type="submit">Request my quote</button>'
              '<p class="rq-note">We ship with FedEx and UPS to US addresses only. By sending this you agree that our team may contact you about your quote.</p>')
    form = ('<form class="rq-card form" data-form="quote" data-view="form" novalidate><h2 class="rq-h2">Your details</h2><p class="rq-acct" data-acct-prompt hidden></p>%s</form>' % fields)
    done = ('<div class="rq-card form qdone" data-view="done" hidden role="status"><p class="rq-pill">Request received</p><h2 class="rq-h2">Thank you, we have your list</h2><p>Your reference is <span class="rq-ref" data-f="q-ref"></span>. Our team will contact you with bulk pricing and next steps.</p>'
            '<p><a class="btn btn--red" href="/shop/c/all/">Keep browsing</a></p></div>')
    main = '<main id="main" data-page="quote">%s<section class="sec sec--i quote"><div class="wrap quote__in">%s<div>%s%s</div></div></section></main>' % (ph, lst, form, done)
    return write(path, page(path, 'Get a Quote | Red Apple Distribution', 'Request wholesale pricing from Red Apple Distribution. Send your list and details and our team will reply with bulk pricing.', main, robots='noindex,follow'))


def build_review():
    path = '/shop/review/'
    ph = phead(crumbs(('Reviews', '/shop/reviews/'), ('Write a review', path)), 'Your feedback', 'Write a <em>review</em>', 'Tell us how we did. Honest feedback helps other shop owners and helps our team improve. It takes about two minutes.')

    def stars(name, label, hint, req=True):
        r = ''.join('<input type="radio" id="r-%s-%d" name="%s" value="%d"><label for="r-%s-%d" title="%d star%s"><span class="sr">%d star%s</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.5 6.2 20.6l1.1-6.5L2.6 9.5l6.5-.9z"/></svg></label>' % (name, i, name, i, name, i, i, '' if i == 1 else 's', i, '' if i == 1 else 's') for i in range(1, 6))
        return '<fieldset class="rv-q"><legend>%s%s <small>%s</small></legend><div class="stars">%s</div></fieldset>' % (label, ' <span aria-hidden="true">*</span>' if req else '', hint, r)
    rec = ''.join('<label class="rv-chip"><input type="radio" name="recommend" value="%s"><span>%s</span></label>' % (v, v) for v in ('Yes', 'Maybe', 'No'))
    form = ('<form class="rq-card form" data-form="review" data-view="form" novalidate><h2 class="rq-h2">About you</h2>'
            '<div class="rq-row2"><div class="rq-f"><label for="v-name">Your name <span aria-hidden="true">*</span></label><input class="rq-in" id="v-name" name="name" autocomplete="name" required></div>'
            '<div class="rq-f"><label for="v-shop">Shop name <span aria-hidden="true">*</span></label><input class="rq-in" id="v-shop" name="shop" autocomplete="organization" required></div></div>'
            '<div class="rq-row2"><div class="rq-f"><label for="v-contact">Email or WhatsApp number <small>private, optional</small></label><input class="rq-in" id="v-contact" name="contact" autocomplete="off"></div>'
            '<div class="rq-f"><label for="v-rep">Name of the representative you dealt with <small>optional</small></label><input class="rq-in" id="v-rep" name="rep" autocomplete="off"></div></div>'
            '<h2 class="rq-h2">Your experience</h2>' + stars('overall', 'Overall experience', 'How was working with Red Apple Distribution?') + stars('rep_rating', 'How our representative handled you', 'Politeness, product knowledge and follow-up')
            + stars('service', 'Quality of service', 'Quote process and communication') + stars('product', 'Product quality and accuracy', 'Genuine products, what you asked for') + stars('delivery', 'Delivery experience', 'Packaging and carrier handling', False) +
            '<fieldset class="rv-q"><legend>Would you recommend us to another shop owner? <small>optional</small></legend><div class="rv-chips">%s</div></fieldset>' % rec +
            '<div class="rq-f"><label for="v-tenure">How long have you worked with us? <small>optional</small></label><select class="rq-sel" id="v-tenure" name="tenure"><option value="">Select</option><option>First time</option><option>Under 6 months</option><option>6 to 12 months</option><option>More than a year</option></select></div>'
            '<div class="rq-f"><label for="v-remark">Your remarks <span aria-hidden="true">*</span></label><textarea class="rq-ta" id="v-remark" name="remark" rows="5" required></textarea></div>'
            '<label class="rq-check" for="v-consent"><input id="v-consent" type="checkbox" name="consent"><span>You may show my name and shop name with my review.</span></label>'
            '<input class="rq-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><input class="rq-hp" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">'
            '<p class="rq-err" data-err role="alert"></p><button class="btn btn--red" type="submit">Submit review</button></form>')
    done = '<div class="rq-card form" data-view="done" hidden role="status"><p class="rq-pill">Thank you</p><h2 class="rq-h2">Review received</h2><p>Reviews are posted only after we verify the order. We appreciate you taking the time.</p><p><a class="btn btn--red" href="/shop/reviews/">See reviews</a></p></div>'
    main = '<main id="main" data-page="review">%s<section class="sec sec--i"><div class="wrap narrow">%s%s</div></section></main>' % (ph, form, done)
    return write(path, page(path, 'Write a Review | Red Apple Distribution', 'Write a review of your experience with Red Apple Distribution.', main, data=False, robots='noindex,follow'))


def build_reviews():
    path = '/shop/reviews/'
    cr = [('Reviews', path)]
    ph = phead(crumbs(*cr), 'Reviews', 'What shop owners <em>say</em>', 'Real feedback from the retailers we work with. Worked with us? We would love to hear how it went.')
    empty = ('<div class="rv-empty"><h2 class="rq-h2 on-i">No reviews yet</h2><p>Reviews are posted only after we verify the order. Worked with us? Tell other shop owners how it went.</p><p><a class="btn btn--ink" href="/shop/review/">Write a review</a></p></div>')
    main = '<main id="main" data-page="reviews">%s<section class="sec sec--i"><div class="wrap"><div id="rv-list" class="rv-list">%s</div><p class="more"><a class="btn btn--ink" href="/shop/review/">Write a review</a></p></div></section></main>' % (ph, empty)
    return write(path, page(path, 'Customer Reviews | Red Apple Distribution', 'Reviews from retailers who buy wholesale from Red Apple Distribution. Only verified reviews are published.', main, data=False, ld=[crumb_ld(cr)]))


def build_404():
    path = '/shop/404/'
    main = ('<main id="main" data-page="nf"><section class="sec sec--b phead nf"><div class="wrap"><p class="eyebrow">Error 404</p><h1 class="phead__h">Page <em>not found</em></h1><p class="lead">That page does not exist, or it has moved. Try the catalog or request a quote.</p>'
            '<p class="nf__b"><a class="btn btn--red" href="/shop/c/all/">Shop the catalog</a><a class="btn btn--line" href="/shop/quote/">Get a quote</a></p></div></section></main>')
    return write(path, page(path, 'Page Not Found | Red Apple Distribution', 'This page could not be found.', main, data=False, robots='noindex,follow'))


def build_alias_stubs():
    """old product ids redirect to the current id"""
    n = 0
    for old, new in ALIASES.items():
        if int(old) in BYID:
            continue
        path = '/shop/p/%s/' % old
        tgt = '/shop/p/%s/' % new
        html = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved | Red Apple Distribution</title><meta name="robots" content="noindex,follow">'
                '<link rel="canonical" href="%s%s"><meta http-equiv="refresh" content="0;url=%s"><script>location.replace("%s")</script></head><body><p><a href="%s">Continue</a></p></body></html>' % (SITE, tgt, tgt, tgt, tgt))
        write(path, html)
        n += 1
    return n


def build_home_stub():
    """/shop/ forwards to the catalog; also restores clean paths from the 404.html fallback (/shop/?/rest) and legacy #/ links"""
    js = ('(function(){var l=location,s=l.search,h=l.hash,A=%s,t="/shop/c/all/";try{'
          'if(s.charAt(1)==="/"){var r=s.slice(1).split("&").map(function(x){return x.replace(/~and~/g,"&")}).join("?"),i=r.indexOf("?"),p=(i<0?r:r.slice(0,i)).replace(/index\\.html$/,"").replace(/\\/+$/,""),m=/^\\/p\\/(\\d+)$/.exec(p);'
          'if(p==="")t="/shop/c/all/";else if(m&&A[m[1]])t="/shop/p/"+A[m[1]]+"/";else if(p==="/order")t="/shop/quote/";else t="/shop/404/"}'
          'else if(/^#\\/?[a-z]/.test(h)){t="/shop/"+h.replace(/^#\\/?/,"").split("?")[0].replace(/\\/+$/,"")+"/"}'
          'if(t!=="/shop/404/"&&/access_token|error_code/.test(h)&&t.indexOf("/account/")>0)t+=h}catch(e){}l.replace(t)})()') % json.dumps({str(k): v for k, v in ALIASES.items()})
    html = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Shop | Red Apple Distribution</title><meta name="robots" content="noindex,follow">'
            '<link rel="canonical" href="%s/shop/c/all/"><noscript><meta http-equiv="refresh" content="0;url=/shop/c/all/"></noscript><script>%s</script></head>'
            '<body><p><a href="/shop/c/all/">Shop the catalog</a></p></body></html>') % (SITE, js)
    open(os.path.join(SHOP, 'index.html'), 'w', encoding='utf-8').write(html)


def main():
    big = []
    sizes = {}
    for s in ['all', 'new', 'trending'] + list(CATS):
        sizes['c/' + s] = build_cat(s)
    for p in P:
        sizes['p/%d' % p['id']] = build_product(p)
    sizes['brands'] = build_brands()
    brands = sorted({p['b'] for p in P if p['b'] != HB})
    for b in brands:
        sizes['brand/' + b] = build_brand(b)
    sizes['about'] = build_about()
    sizes['contact'] = build_contact()
    sizes['faq'] = build_faq()
    for k in DOCS:
        sizes[k] = build_doc(k)
    sizes['quote'] = build_quote()
    sizes['review'] = build_review()
    sizes['reviews'] = build_reviews()
    sizes['404'] = build_404()
    for k, v in build_private().items():
        sizes[k] = v
    na = build_alias_stubs()
    build_home_stub()
    mx = max(sizes.items(), key=lambda kv: kv[1])
    over = [k for k, v in sizes.items() if v > 30000]
    print('pages: %d  (+%d alias redirects)  products: %d  brands: %d' % (len(sizes), na, len(P), len(brands)))
    print('largest: %s %d bytes; over 30 KB: %s' % (mx[0], mx[1], over or 'none'))
    return 1 if over else 0


if __name__ == '__main__':
    sys.exit(main())
