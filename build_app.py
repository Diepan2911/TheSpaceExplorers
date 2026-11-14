"""Dong goi app 3D thanh 1 file HTML tu chua tu ma nguon (app/src) + du lieu (pipeline, dia chat, anh Mars Trek).

  python app/build_app.py --out16 out16 --geo geo/geo_embed.json \
         --img trek/viking_olympus_32ppd.jpg --georef trek/georef.json --dst app/olympus_navigator_3d.html

  app/src/index.template.html  khung HTML: thanh tren, panel trai/phai, khung 3D, thanh phat
  app/src/style.css            giao dien (sang/toi, man hinh hep)
  app/src/science.js           tab Khoa hoc: diem dung khoa hoc doc tuyen + lap ke hoach Marswalk (EVA di bo)
  app/src/layout.js            nut Mo rong 3D: khung 3D toan man hinh, panel thanh ngan keo ra vao
  app/src/sci_anim.js          hoat anh phi hanh gia lam nhiem vu tai diem khoa hoc
  app/src/i18n.js              nut chuyen ngon ngu VI/EN (dich theo tu dien, khong sua code cu)
  app/src/app.js               toan bo logic: giai ma du lieu, do doc, nhiet do, A*, mo hinh oxy/nhien lieu/y te,
                               khung 3D three.js (dia hinh, rover, phi hanh gia, bau troi), ban do nho, bieu do,
                               lop dia chat, doi chieu Mars Trek
Du lieu chen vao luc dong goi:
  __META__        luoi, tham so mo hinh, vung ha canh, diem A/B   (tu out16/summary.json + layers.npz)
  __TERRAIN_B64__ do cao MOLA int16 + diem ha canh uint8 moi o    (tu out16/layers.npz)
  __GEO_DATA__    ban do dia chat USGS SIM 3292 da raster hoa     (geo/build_geo_data.py)
  __VIKING_JPG__  anh nen Mars Trek da dang ky                     (trek/register.py)
  __VIK_REF__     tham so dang ky anh                              (trek/georef.json)"""
import argparse, base64, json, os
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--out16", default="out16"); ap.add_argument("--geo", default="geo/geo_embed.json")
ap.add_argument("--img", default="trek/viking_olympus_32ppd.jpg"); ap.add_argument("--georef", default="trek/georef.json")
ap.add_argument("--src", default=os.path.join(os.path.dirname(__file__), "src")); ap.add_argument("--dst", default="app/olympus_navigator_3d.html")
a = ap.parse_args()

# ---- du lieu dia hinh tu pipeline (giong web/build_web.py) ----
L = np.load(os.path.join(a.out16, "layers.npz")); S = json.load(open(os.path.join(a.out16, "summary.json")))
Z, ell, ok, lats, lons = L["Z"], L["ellipse_score"], L["site_ok"], L["lats"], L["lons"]
ppd = S["ppd"]; H, W = Z.shape
z16 = np.clip(np.round(Z), -32768, 32767).astype("<i2")
site = np.clip(np.round(ell / max(ell.max(), 1e-9) * 254) + ok.astype(np.uint8), 0, 255).astype(np.uint8)
meta = dict(H=H, W=W, ppd=ppd, lat_n=float(lats[0] + 0.5 / ppd), lon_w=float(lons[0] - 0.5 / ppd),
            lat_n0=S["region"]["lat_n"], lat_s=S["region"]["lat_s"], lon_w0=S["region"]["lon_w"], lon_e=S["region"]["lon_e"],
            params=dict(S["params"]), sites=S["sites"], A=S["route"]["A"], B=S["route"]["B"])
geo = json.load(open(a.geo, encoding="utf8"))
gr = json.load(open(a.georef))

rd = lambda f: open(os.path.join(a.src, f), encoding="utf8").read()
js = (rd("app.js")
      .replace("__META__", json.dumps(meta, ensure_ascii=False), 1)
      .replace("__TERRAIN_B64__", base64.b64encode(z16.tobytes() + site.tobytes()).decode(), 1)
      .replace("__GEO_DATA__", json.dumps(geo, ensure_ascii=False, separators=(",", ":")), 1)
      .replace("__VIKING_JPG__", "data:image/jpeg;base64," + base64.b64encode(open(a.img, "rb").read()).decode(), 1)
      .replace("__VIK_REF__", json.dumps({k: round(v, 4) for k, v in gr.items()}), 1))
for extra in ("science.js", "layout.js", "sci_anim.js", "i18n.js"):                         # phan mo rong: noi sau app.js, cung 1 the <script>
    if os.path.exists(os.path.join(a.src, extra)):
        js = js.rstrip("\n") + "\n\n" + rd(extra)
html = rd("index.template.html").replace("/*@STYLE@*/\n", rd("style.css"), 1).replace("/*@SCRIPT@*/\n", js, 1)
os.makedirs(os.path.dirname(a.dst) or ".", exist_ok=True)
open(a.dst, "w", encoding="utf8").write(html)
print(f"{a.dst}: {len(html) / 1e6:.2f} MB, luoi {H}x{W}, {len(geo['units'])} don vi dia chat")
