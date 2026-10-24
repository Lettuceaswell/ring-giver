# Natural Earth 10m land (public domain) -> one SVG path in the game's Mercator space.
# Usage: python3 -I tools/coast.py path/to/ne_10m_land.geojson   (writes coast.js; keep PROJ in step with world.js)
# Source: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson
import json, math, sys
import os
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'coast.js')
# projection: must match proj() in world.js
LON0, LAT1, K = -12.0, 63.5, 9.4
def merc(lat): return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
KY = K * 180 / math.pi
def proj(lon, lat): return ((lon - LON0) * K, (merc(LAT1) - merc(lat)) * KY)
BBOX = (-12.5, 35.5, 34.5, 64.0)  # lon0, lat0, lon1, lat1 (a hair past the world's edge)

def clip(ring, bbox):  # Sutherland-Hodgman against a rectangle
    x0, y0, x1, y1 = bbox
    def inside(p, e): return {0: p[0] >= x0, 1: p[0] <= x1, 2: p[1] >= y0, 3: p[1] <= y1}[e]
    def inter(a, b, e):
        if e in (0, 1):
            x = x0 if e == 0 else x1; t = (x - a[0]) / (b[0] - a[0]); return (x, a[1] + t * (b[1] - a[1]))
        y = y0 if e == 2 else y1; t = (y - a[1]) / (b[1] - a[1]); return (a[0] + t * (b[0] - a[0]), y)
    out = ring
    for e in range(4):
        if not out: return []
        inp, out = out, []
        s = inp[-1]
        for p in inp:
            if inside(p, e):
                if not inside(s, e): out.append(inter(s, p, e))
                out.append(p)
            elif inside(s, e): out.append(inter(s, p, e))
            s = p
    return out

def dp(pts, tol):  # Douglas-Peucker on a closed ring (treated open, then closed)
    if len(pts) < 4: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        ax, ay = pts[i]; bx, by = pts[j]; dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy) or 1e-9
        best, bi = 0, -1
        for k in range(i + 1, j):
            px, py = pts[k]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / L if L > 1e-9 else math.hypot(px - ax, py - ay)
            if d > best: best, bi = d, k
        if best > tol: keep[bi] = True; stack += [(i, bi), (bi, j)]
    return [p for p, k in zip(pts, keep) if k]

def area(r): return abs(sum(r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1] for i in range(len(r)))) / 2

d = json.load(open(SRC))
rings = []
for f in d['features']:
    g = f['geometry']; polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        for ring in poly:  # outer and holes alike: with evenodd fill holes (lakes) come free
            xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
            if max(xs) < BBOX[0] or min(xs) > BBOX[2] or max(ys) < BBOX[1] or min(ys) > BBOX[3]: continue
            c = clip([(p[0], p[1]) for p in ring], BBOX)
            if len(c) < 3: continue
            pr = [proj(x, y) for x, y in c]
            s = dp(pr, 0.55)
            if len(s) < 3 or area(s) < 6: continue  # islands smaller than a dot are noise at this scale
            rings.append(s)
parts = []
for r in rings:
    parts.append('M' + ' '.join(f'{x:.1f} {y:.1f}'.replace('.0 ', ' ').replace('.0', '') if False else f'{x:.1f},{y:.1f}' for x, y in r) + 'z')
path = ''.join(parts)
open(OUT, 'w').write(f"// The coast of the north-west seas: Natural Earth 10m land (public domain), clipped {BBOX}, Mercator per proj() in world.js, simplified. Built by coast.py.\nconst COAST_PATH = '{path}';\n")
print('rings', len(rings), 'points', sum(len(r) for r in rings), 'bytes', len(path))
xs = [x for r in rings for x, _ in r]; ys = [y for r in rings for _, y in r]
print('extent x', round(min(xs)), round(max(xs)), 'y', round(min(ys)), round(max(ys)))
