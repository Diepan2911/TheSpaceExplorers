"""Thay du lieu dia chat va anh nen Mars Trek ben trong app 3D (1 file HTML tu chua) sau khi chay lai
geo/build_geo_data.py hoac trek/register.py - vi du khi dung goi du lieu USGS chinh thuc hoac GeoTIFF Mars Trek.

  python tools/update_app_data.py app/olympus_navigator_3d.html \
         --geo geo/geo_embed.json --img trek/viking_olympus_32ppd.jpg --georef trek/georef.json"""
import argparse, base64, json, re

ap = argparse.ArgumentParser()
ap.add_argument("html"); ap.add_argument("--geo"); ap.add_argument("--img"); ap.add_argument("--georef"); ap.add_argument("--out")
a = ap.parse_args()
h = open(a.html, encoding="utf8").read()

def sub_once(pattern, repl):
    global h
    h, n = re.subn(pattern, lambda m: repl, h, count=1, flags=re.S)
    assert n == 1, "khong tim thay: " + pattern[:60]


if a.img:
    sub_once(r'VIK_IMG\.src = "data:image/[a-z]+;base64,[^"]*";', 'VIK_IMG.src = "data:image/jpeg;base64,' + base64.b64encode(open(a.img, "rb").read()).decode() + '";')
if a.georef:
    gr = json.load(open(a.georef))
    sub_once(r"const VIK_REF = \{.*?\};", "const VIK_REF = " + json.dumps({k: round(v, 4) for k, v in gr.items()}) + ";")
open(a.out or a.html, "w", encoding="utf8").write(h)
print("ok ->", a.out or a.html)
