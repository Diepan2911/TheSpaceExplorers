"""Buoc 2 - Tao du lieu dia chat nhung vao app 3D: luoi don vi (RLE), he so kho di theo don vi (tu do nham MOLA),
cau truc (vach, ranh sut, dong dung nham... dang polyline) va vi tri nhan.

  pip install pyshp shapely scipy numpy
  python geo/build_geo_data.py --shp <thu muc SIM3292_Shapefiles> --layers out16/layers.npz --geo geo/
Dau ra: geo/geo_embed.json  -> dua vao app bang tools/update_app_data.py"""
import argparse, json, os
import numpy as np, shapefile
from scipy import ndimage
from shapely.geometry import LineString

ap = argparse.ArgumentParser()
ap.add_argument("--shp", required=True); ap.add_argument("--layers", default="out16/layers.npz"); ap.add_argument("--geo", default="geo")
ap.add_argument("--lat_n", type=float, default=30.0); ap.add_argument("--lon_w", type=float, default=212.0); ap.add_argument("--ppd", type=int, default=16)
a = ap.parse_args()
L = np.load(a.layers); g0 = np.load(os.path.join(a.geo, "geo_units.npy"))
U0 = json.load(open(os.path.join(a.geo, "geo_units.json")))["units"]
H, W = g0.shape; PPD, LATN, LONW = a.ppd, a.lat_n, a.lon_w


ORDER = [  
    ("AHtu", "Amazonian and Hesperian transition undivided unit", "Đồng bằng chuyển tiếp (Amazon–Hesperia)", "#2a78d6"),
    ("Aa", "Amazonian apron unit", "Vạt chân núi – vành aureole (Amazon)", "#eb6834"),
    ("lAv", "Late Amazonian volcanic unit", "Dung nham trẻ (Amazon muộn)", "#1baf7a"),
    ("AHv", "Amazonian and Hesperian volcanic unit", "Đồng bằng dung nham (Amazon–Hesperia)", "#eda100"),
    ("Ave", "Amazonian volcanic edifice unit", "Thân núi lửa Olympus Mons (Amazon)", "#e87ba4"),
    ("lAvf", "Late Amazonian volcanic field unit", "Cánh đồng núi lửa nhỏ (Amazon muộn)", "#008300"),
    ("Hv", "Early + Late Hesperian volcanic units (eHv, lHv)", "Dung nham cổ (Hesperia)", "#6250d6"),
    ("lAa", "Late Amazonian apron unit", "Vạt chân núi trẻ (Amazon muộn)", "#e34948"),
]
codes = [o[0] for o in ORDER]
g = np.full_like(g0, 255)
for k, u in enumerate(U0, 1):
    if not (g0 == k).any(): continue
    uu = "Hv" if u in ("eHv", "lHv") else u
    assert uu in codes, f"don vi {uu} chua co trong ORDER - them vao (toi da 8 mau)"
    g[g0 == k] = codes.index(uu)
assert (g != 255).all()


rough, sl = L["rough"], L["slope"]
stats = []
for k, (c, en, vi, col) in enumerate(ORDER):
    m = g == k
    stats.append(dict(code=c, en=en, vi=vi, color=col, pct=round(float(100 * m.mean()), 1),
                      rough=round(float(np.median(rough[m])), 1), slope=round(float(np.median(sl[m])), 2)))
rmax = max(s["rough"] for s in stats)
for s in stats: s["f"] = round(s["rough"] / rmax, 3); print(s["code"], s["pct"], "%  nham", s["rough"], "m  he so", s["f"])


flat = g.ravel(); runs = []; v = flat[0]; n = 0
for x in flat:
    if x == v: n += 1
    else: runs.append((int(v), n)); v = x; n = 1
runs.append((int(v), n))
rle = "".join(f"{v}{n:x}," for v, n in runs)


labels = []
for k in range(len(ORDER)):
    lab, nc = ndimage.label(g == k)
    if nc == 0: continue
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, nc + 1))
    for ci in np.argsort(-sizes)[:3]:
        if sizes[ci] < 1500: continue
        dt = ndimage.distance_transform_edt(np.pad(lab == ci + 1, 1))[1:-1, 1:-1]
        i, j = np.unravel_index(dt.argmax(), dt.shape); labels.append([k, int(i), int(j)])


sf = shapefile.Reader(os.path.join(a.shp, "SIM3292_Global_Structure"))
TYPES = {"Scarp": 0, "Graben axis": 1, "Lobate flow": 2, "Caldera rim": 3, "Yardangs": 4, "Channel axis": 5, "Ridge": 6}
struct = []
for sr in sf.iterShapeRecords():
    s = sr.shape; t = TYPES.get(sr.record.as_dict()["Interpreta"])
    if t is None or not s.points: continue
    parts = list(s.parts) + [len(s.points)]
    for p0, p1 in zip(parts[:-1], parts[1:]):
        for off in (0, 360, -360):
            pts = [((x + off - LONW) * PPD, (LATN - y) * PPD) for x, y in s.points[p0:p1]]
            if not any(-2 <= x <= W + 2 and -2 <= y <= H + 2 for x, y in pts): continue
            ls = LineString(pts).simplify(0.4)
            struct.append([t] + [round(c, 1) for p in ls.coords for c in p])
out = os.path.join(a.geo, "geo_embed.json")
json.dump(dict(units=stats, rle=rle, labels=labels, struct=struct), open(out, "w"), ensure_ascii=False, separators=(",", ":"))
np.save(os.path.join(a.geo, "geo8.npy"), g)
print("->", out, os.path.getsize(out), "byte;", len(runs), "doan RLE;", len(struct), "cau truc")
