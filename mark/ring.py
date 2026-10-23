"""Sea King mark: the silver arm ring, drawn from the brand's reference photo
(modern-viking-brand/approvals/portal/ref/danish-twist-bracelet.png).

An open cuff: a thick rope of two strands twisted together, one broad and smooth,
one thin twisted wire, tapering into rounded terminals. Box 240 x 240 like the H.
Weights follow the H's golden series: thin strand 6.4, ticks at the next step down.

Writes SVG at three cuts (size rule from round 12): full (ticks on the wire),
small (no ticks, below 48 px), tiny (plain band, below 24 px).
"""
import math, sys, os

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
PHI = (1 + 5 ** 0.5) / 2
CX = CY = 120.0
R = 80.0            # centreline radius
W = 27.0            # broad band width at full (the H's post weight)
THIN = 6.4          # the H's thin weight (kept for the small cut)
STRAND = 9.0        # wire strand width: about 0.3 of the pitch, the cuff's 3:1
TICK = 1.5          # wire ridge weight
GAP = 34.0          # half-angle of the opening, degrees, centred at the bottom
TURNS = 13          # twists visible around the ring (counted on the photo)
TAPER = 28.0        # degrees over which each terminal narrows
TIP = 0.62          # terminal width as a fraction of W

A0, A1 = 90 + GAP, 90 - GAP + 360     # start and end angle, degrees (y down, 90 = bottom)
SPAN = A1 - A0

OAT, IRON, CHAR = '#E8DFCC', '#5A5F63', '#2B2E33'


def pt(a_deg, r):
    a = math.radians(a_deg)
    return CX + r * math.cos(a), CY + r * math.sin(a)


def width_at(a):
    """band width with a taper into each terminal: TIP + (1-TIP) * t^0.65, as build.py"""
    d = min(a - A0, A1 - a)
    if d >= TAPER:
        return W
    t = d / TAPER
    return W * (TIP + (1 - TIP) * t ** 0.65)


def band_path(steps=240):
    outer, inner = [], []
    for i in range(steps + 1):
        a = A0 + SPAN * i / steps
        w = width_at(a) / 2
        outer.append(pt(a, R + w)); inner.append(pt(a, R - w))
    # round the terminals with a half circle of the tip width
    def cap(a, sign):
        w = width_at(a) / 2
        x, y = pt(a, R)
        return f'A{w:.2f},{w:.2f} 0 0 {1 if sign > 0 else 0} '
    d = 'M' + ' L'.join(f'{x:.2f},{y:.2f}' for x, y in outer)
    ex, ey = inner[-1]; d += ' ' + cap(A1, 1) + f'{ex:.2f},{ey:.2f}'
    d += ' L' + ' L'.join(f'{x:.2f},{y:.2f}' for x, y in reversed(inner))
    sx, sy = outer[0]; d += ' ' + cap(A0, 1) + f'{sx:.2f},{sy:.2f} Z'
    return d


def strand_paths():
    """the thin wire strand: a helix seen side on. Each visible half turn runs from the
    inner edge to the outer edge across the band; the hidden half goes behind."""
    pitch = SPAN / TURNS
    paths = []
    for k in range(TURNS):
        a_start = A0 + pitch * k + pitch * 0.05
        a_end = a_start + pitch * 0.72
        if a_end > A1 - 2: break
        pts = []
        n = 36
        for i in range(n + 1):
            t = i / n
            a = a_start + (a_end - a_start) * t
            # asin curvature: fast at the edges, slow across the middle, like a helix side-on
            s = math.sin((t - 0.5) * math.pi)       # -1..1
            w = width_at(a) / 2 + 4.0
            pts.append(pt(a, R - w * s))
        paths.append(pts)
    return paths


def ticks_for(pts):
    """short bars across the wire strand, the twisted-wire ridges"""
    out = []
    n = len(pts)
    for i in range(2, n - 2, 3):
        (x0, y0), (x1, y1) = pts[i - 1], pts[i + 1]
        dx, dy = x1 - x0, y1 - y0
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        cx, cy = pts[i]
        h = STRAND * 0.5
        out.append((cx - nx * h, cy - ny * h, cx + nx * h, cy + ny * h))
    return out


def svg(cut, body=OAT, wire=IRON, tick=OAT, bg=None, size=240, scale=1.0):
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="{size}" height="{size}">']
    if bg:
        parts.append(f'<rect width="240" height="240" fill="{bg}"/>')
    if scale != 1.0:
        parts.append(f'<g transform="translate(120 120) scale({scale}) translate(-120 -120)">')
    parts.append(f'<clipPath id="band"><path d="{band_path()}"/></clipPath>')
    parts.append(f'<path d="{band_path()}" fill="{body}"/>')
    if cut in ('full', 'small'):
        thin = STRAND if cut == 'full' else THIN * PHI ** 0.5   # the small cut: thin weight, one half step up
        parts.append('<g clip-path="url(#band)">')
        for pts in strand_paths():
            d = 'M' + ' L'.join(f'{x:.2f},{y:.2f}' for x, y in pts)
            parts.append(f'<path d="{d}" fill="none" stroke="{wire}" stroke-width="{thin:.2f}" stroke-linecap="round"/>')
            if cut == 'full':
                for x0, y0, x1, y1 in ticks_for(pts):
                    parts.append(f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" stroke="{tick}" stroke-width="{TICK:.2f}" stroke-linecap="round"/>')
        parts.append('</g>')
    if scale != 1.0:
        parts.append('</g>')
    parts.append('</svg>')
    return '\n'.join(parts)


os.makedirs(OUT, exist_ok=True)
open(f'{OUT}/ring-full.svg', 'w').write(svg('full'))
open(f'{OUT}/ring-small.svg', 'w').write(svg('small'))
open(f'{OUT}/ring-tiny.svg', 'w').write(svg('tiny'))
open(f'{OUT}/ring-rev.svg', 'w').write(svg('full', body='#3B3330', wire='#CDC3AE', tick='#3B3330'))   # ink on oat
# app icons: oat ring on fjord charcoal, the ring set a little smaller inside the box
def icon(cut, size):
    return svg(cut, bg=CHAR, size=size, scale=0.84)
open(f'{OUT}/icon-512.svg', 'w').write(icon('full', 512))
open(f'{OUT}/icon-192.svg', 'w').write(icon('full', 192))
open(f'{OUT}/icon.svg', 'w').write(icon('small', 64))
print('ok', TURNS, 'turns, span', SPAN)
