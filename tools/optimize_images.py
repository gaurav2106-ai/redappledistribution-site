#!/usr/bin/env python3
"""Convert shop product PNGs to WebP at display size (target under 80 KB each).
Usage: python3 tools/optimize_images.py <src_assets_p_dir> <dst_assets_p_dir>
Originals are never copied to the destination."""
import sys, os
from PIL import Image

MAX_SIDE = 760
TARGET = 80 * 1024

def convert(src, dst):
    im = Image.open(src).convert('RGBA')
    side = MAX_SIDE
    while True:
        w, h = im.size
        k = min(1.0, side / max(w, h))
        r = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS) if k < 1 else im
        for q in (84, 76, 68, 60, 52):
            r.save(dst, 'WEBP', quality=q, method=6, alpha_quality=90)
            if os.path.getsize(dst) <= TARGET:
                return os.path.getsize(dst)
        side = int(side * 0.85)
        if side < 360:
            return os.path.getsize(dst)

def main(src_dir, dst_dir):
    os.makedirs(dst_dir, exist_ok=True)
    total_in = total_out = n = over = 0
    for f in sorted(os.listdir(src_dir)):
        p = os.path.join(src_dir, f)
        if f.lower().endswith('.png') and os.path.isfile(p):
            d = os.path.join(dst_dir, f[:-4] + '.webp')
            sz = convert(p, d)
            total_in += os.path.getsize(p); total_out += sz; n += 1
            if sz > TARGET: over += 1
    print('converted %d files: %.1f MB -> %.1f MB, %d over 80 KB' % (n, total_in / 1e6, total_out / 1e6, over))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
