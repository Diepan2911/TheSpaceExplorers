import math, os, sys, urllib.request

DATA = "data"
REGION = dict(lat_n=30.0, lat_s=8.0, lon_w=212.0, lon_e=240.0)
PDS3 = "https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x"
PDS4 = "https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived"
FILES = {
    "megdr16":  [f"{PDS3}/meg016/megt90n000eb.img", f"{PDS3}/meg016/megt90n000eb.lbl"],
    "megdr128": [f"{PDS4}/meg128/megt44n180hb.img", f"{PDS4}/meg128/megt44n180hb.xml"],
    "tes_ti":   ["https://se.psi.edu/inertia/nmap2003.bin"],
}
BLEND = "https://planetarymaps.usgs.gov/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif"
R = 3396190.0

def fetch(url):
    os.makedirs(DATA, exist_ok=True)
    dst = os.path.join(DATA, url.rsplit("/", 1)[1])
    if os.path.exists(dst):
        print("da co", dst); return dst
    print("tai", url)
    def hook(n, bs, total):
        if total > 0: print(f"\r  {min(n * bs, total) / 1e6:6.1f} / {total / 1e6:.1f} MB", end="")
    urllib.request.urlretrieve(url, dst + ".part", hook); os.replace(dst + ".part", dst); print()
    return dst

def cut_blend200():
    """Chi doc dung cua so Olympus Mons tu GeoTIFF 11 GB (HTTP range request qua GDAL /vsicurl/)."""
    import rasterio
    from rasterio.windows import from_bounds
    m = math.pi * R / 180.0                                         # met / do
    lon = lambda e: (e + 180) % 360 - 180                           # file dung kinh do -180..180
    left, right = lon(REGION["lon_w"]) * m, lon(REGION["lon_e"]) * m
    bottom, top = REGION["lat_s"] * m, REGION["lat_n"] * m
    os.makedirs(DATA, exist_ok=True)
    dst = os.path.join(DATA, "olympus_blend200.tif")
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif"):
        with rasterio.open("/vsicurl/" + BLEND) as src:
            win = from_bounds(left, bottom, right, top, src.transform)
            arr = src.read(1, window=win)
            prof = src.profile.copy()
            prof.update(width=arr.shape[1], height=arr.shape[0], transform=src.window_transform(win),
                        compress="deflate", tiled=True, blockxsize=256, blockysize=256)
    with rasterio.open(dst, "w", **prof) as out:
        out.write(arr, 1)
    print(f"da ghi {dst}: {arr.shape}, {os.path.getsize(dst) / 1e6:.1f} MB")
    # Lenh tuong duong bang GDAL CLI:
    #   gdal_translate -projwin {left} {top} {right} {bottom} /vsicurl/{BLEND} data/olympus_blend200.tif
