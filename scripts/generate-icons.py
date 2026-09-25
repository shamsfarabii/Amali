"""Draws the app logo (eight-point star with a crescent) and writes every icon asset.

Usage: python3 scripts/generate-icons.py assets   (needs Pillow)
"""
import math, sys
from PIL import Image, ImageDraw, ImageChops

SS = 4
LAPIS_TOP = (0x33, 0x58, 0xB8)
LAPIS_BOT = (0x1A, 0x2F, 0x72)
WHITE = (0xFF, 0xFF, 0xFF)
GOLD = (0xE9, 0xC4, 0x7C)

def star_pts(cx, cy, R, rot=22.5):
    r = R * math.cos(math.radians(45)) / math.cos(math.radians(22.5))
    pts = []
    for i in range(16):
        a = math.radians(rot + i * 22.5)
        rad = R if i % 2 == 0 else r
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    return pts

def gradient(size):
    img = Image.new('RGB', (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(LAPIS_TOP, LAPIS_BOT))
    return img

def mark_mask(size, scale, with_gold=True):
    S = size * SS
    c = S / 2
    R = S * scale
    white = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(white)
    # Khatam outline: an eight-point star drawn as a band.
    d.polygon(star_pts(c, c, R, 0), fill=255)
    band = R * 0.11
    Ri = R - band / math.sin(math.radians(67.5)) * 1.0
    d.polygon(star_pts(c, c, Ri, 0), fill=0)
    # Crescent: a disc minus an offset disc.
    gold = Image.new('L', (S, S), 0)
    g = ImageDraw.Draw(gold)
    cr = R * 0.40
    ox = c - R * 0.01
    g.ellipse([ox - cr, c - cr, ox + cr, c + cr], fill=255)
    cr2 = cr * 0.82
    ox2 = ox + cr * 0.36
    oy2 = c - cr * 0.16
    g.ellipse([ox2 - cr2, oy2 - cr2, ox2 + cr2, oy2 + cr2], fill=0)
    if not with_gold:
        gold = Image.new('L', (S, S), 0)
    return white, gold

def down(img, size):
    return img.resize((size, size), Image.LANCZOS)

def compose(bg, size, scale, fg=WHITE, gold=GOLD):
    S = size * SS
    base = bg.resize((S, S)) if bg is not None else Image.new('RGBA', (S, S), (0, 0, 0, 0))
    base = base.convert('RGBA')
    w, g = mark_mask(size, scale)
    base.paste(Image.new('RGBA', (S, S), fg + (255,)), (0, 0), w)
    base.paste(Image.new('RGBA', (S, S), gold + (255,)), (0, 0), g)
    return down(base, size)

def rounded(img, radius_frac):
    S = img.size[0] * SS
    m = Image.new('L', (S, S), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, S - 1, S - 1], radius=S * radius_frac, fill=255)
    m = m.resize(img.size, Image.LANCZOS)
    out = img.copy()
    out.putalpha(m)
    return out

out = sys.argv[1]
bg = gradient(512)
compose(bg, 1024, 0.34).convert('RGB').save(f'{out}/icon.png')
bg.save(f'{out}/android-icon-background.png')
compose(None, 512, 0.25).save(f'{out}/android-icon-foreground.png')
# Monochrome: white mark only, no gold
S = 432 * SS
w, g = mark_mask(432, 0.25 * 512 / 432 * 432 / 512 * 1.0)
mono = Image.new('RGBA', (S, S), (0, 0, 0, 0))
mono.paste(Image.new('RGBA', (S, S), (255, 255, 255, 255)), (0, 0), ImageChops.add(w, g))
down(mono, 432).save(f'{out}/android-icon-monochrome.png')
# Splash: rounded badge on transparent
badge = rounded(compose(bg, 1024, 0.34), 0.225)
badge.save(f'{out}/splash-icon.png')
rounded(compose(bg, 48, 0.36), 0.225).save(f'{out}/favicon.png')
rounded(compose(bg, 512, 0.34), 0.225).save(f'{out}/logo.png')
