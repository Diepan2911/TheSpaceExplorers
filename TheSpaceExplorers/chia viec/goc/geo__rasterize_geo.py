"""Buoc 1 - Cat ban do dia chat USGS SIM 3292 (Tanaka et al. 2014) theo luoi 16 px/do cua vung Olympus Mons
va raster hoa thanh ma don vi dia chat cho tung o.

  pip install pyshp pillow numpy
  python geo/rasterize_geo.py --shp <thu muc SIM3292_Shapefiles> --out geo/

Lay du lieu: https://pubs.usgs.gov/sim/3292  (Database ZIP) -> thu muc SIM3292_Shapefiles
Dau ra: geo_units.npy (ma 1..n moi o), geo_units.json (ten don vi)."""
import argparse, json, os
import numpy as np, shapefile
from PIL import Image, ImageDraw
from collections import Counter

ap = argparse.ArgumentParser()
ap.add_argument("--shp", required=True, help="thu muc chua SIM3292_Global_Geology.shp")
ap.add_argument("--out", default="geo")
ap.add_argument("--lat_n", type=float, default=30.0); ap.add_argument("--lon_w", type=float, default=212.0)
ap.add_argument("--H", type=int, default=352); ap.add_argument("--W", type=int, default=448); ap.add_argument("--ppd", type=int, default=16)
a = ap.parse_args()
H, W, PPD, LATN, LONW = a.H, a.W, a.ppd, a.lat_n, a.lon_w
LONE, LATS = LONW + W / PPD, LATN - H / PPD

sf = shapefile.Reader(os.path.join(a.shp, "SIM3292_Global_Geology"))
SS = 4                                   # sieu lay mau 4x4 de bien muot, sau do lay mode
img = Image.new("I", (W * SS, H * SS), 0); dr = ImageDraw.Draw(img)
units, desc, recs = [], {}, []
for sr in sf.iterShapeRecords():
    r = sr.record.as_dict(); s = sr.shape
    if not s.points: continue
    xs = [p[0] for p in s.points]; ys = [p[1] for p in s.points]
    cand = [off for off in (0, 360, -360)                # shapefile dung kinh do -180..180
            if max(xs) + off >= LONW and min(xs) + off <= LONE and max(ys) >= LATS and min(ys) <= LATN]
    if not cand: continue
    u = r["Unit"]; desc[u] = r.get("UnitDesc", "")
    if u not in units: units.append(u)
    recs.append((units.index(u) + 1, s, cand, r.get("SphArea_km", 0)))
recs.sort(key=lambda t: -t[3])                         # da giac lon ve truoc, nho ve sau (dao/lo de len)
for code, s, cand, _ in recs:
    parts = list(s.parts) + [len(s.points)]
    for off in cand:
        for p0, p1 in zip(parts[:-1], parts[1:]):
            pts = [((x + off - LONW) * PPD * SS, (LATN - y) * PPD * SS) for x, y in s.points[p0:p1]]
            if len(pts) > 2: dr.polygon(pts, fill=code)
blk = np.array(img).reshape(H, SS, W, SS).transpose(0, 2, 1, 3).reshape(H, W, SS * SS)
out = np.apply_along_axis(lambda v: np.bincount(v).argmax(), 2, blk).astype(np.uint8)
cnt = Counter(out.ravel().tolist())
print("don vi:", [(units[k - 1] if k else "NONE", v) for k, v in cnt.most_common()])
os.makedirs(a.out, exist_ok=True)
np.save(os.path.join(a.out, "geo_units.npy"), out)
json.dump({"units": units, "desc": desc}, open(os.path.join(a.out, "geo_units.json"), "w"), ensure_ascii=False, indent=1)
