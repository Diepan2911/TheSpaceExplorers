"""Dong goi ket qua pipeline thanh 1 file HTML tu chua: python web/build_web.py out16 web/index.html"""
import base64, json, sys
import numpy as np

out_dir = sys.argv[1] if len(sys.argv) > 1 else "out16"
dst = sys.argv[2] if len(sys.argv) > 2 else "web/index.html"
L = np.load(f"{out_dir}/layers.npz"); S = json.load(open(f"{out_dir}/summary.json"))
Z, ell, ok, lats, lons = L["Z"], L["ellipse_score"], L["site_ok"], L["lats"], L["lons"]
ppd = S["ppd"]; H, W = Z.shape

z16 = np.clip(np.round(Z), -32768, 32767).astype("<i2")
site = np.clip(np.round(ell / max(ell.max(), 1e-9) * 254) + ok.astype(np.uint8), 0, 255).astype(np.uint8)
blob = z16.tobytes() + site.tobytes()

meta = dict(H=H, W=W, ppd=ppd,
            lat_n=float(lats[0] + 0.5 / ppd), lon_w=float(lons[0] - 0.5 / ppd),
            lat_n0=S["region"]["lat_n"], lat_s=S["region"]["lat_s"], lon_w0=S["region"]["lon_w"], lon_e=S["region"]["lon_e"],
            params={k: v for k, v in S["params"].items()}, sites=S["sites"],
            A=S["route"]["A"], B=S["route"]["B"])
html = open("web/template.html", encoding="utf-8").read()
html = html.replace("__META__", json.dumps(meta, ensure_ascii=False)).replace("__DATA__", base64.b64encode(blob).decode())
open(dst, "w", encoding="utf-8").write(html)
print(f"{dst}: {len(html) / 1e6:.2f} MB, grid {H}x{W}")
