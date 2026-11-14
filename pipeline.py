"""
Mars Site Navigator - pipeline vung Olympus Mons (regional)
===========================================================
Hai muc tieu:
  (1) SITE  : cham diem kha nang ha canh (EDL) tung o, tim cac vung ha canh tot nhat
  (2) ROUTE : A* tu diem ha canh (A) den muc tieu (B) voi ham chi phi da tieu chi

Dau vao ho tro (chon bang --source):
  megdr16   : MOLA MEGDR 16 px/do  (megt90n000eb.img, 66 MB, ~3.7 km/px)   <- mac dinh
  megdr128  : MOLA MEGDR 128 px/do (megt44n180hb.img, tile 44N-0N/180-270E, ~463 m/px)
  blend200  : HRSC-MOLA Blend DEM 200 m (GeoTIFF da cat bang download_data.py)
  npy       : mang numpy global 16 px/do da luu san

Cach chay:
  python pipeline.py --source megdr16 --file data/megt90n000eb.img
  python pipeline.py --source megdr128 --file data/megt44n180hb.img --step 4
  python pipeline.py --source blend200 --file data/olympus_blend200.tif --step 8
Dau ra (thu muc out/):
  layers.npz        - tat ca lop raster (Z, slope, roughness, pressure, T_noon, site_score, ...)
  summary.json      - so lieu tong hop, top site, ket qua route
  web_grid.bin/.json- luoi nen gon cho trinh duyet (A* chay o client)
"""
import argparse, heapq, json, math, os
import numpy as np
from scipy import ndimage

R_MARS = 3396.19e3  # m

# cau hinh vung
REGION = dict(lat_n=30.0, lat_s=8.0, lon_w=212.0, lon_e=240.0)   # do,kinh do Dong
LANDMARKS = {
    "Olympus Mons caldera (dinh)": (18.40, 226.00),
    "Amazonis Planitia":            (22.00, 214.50),
    "Chan vach Tay (scarp W)":      (18.60, 221.50),
}

# tham so mo hinh
P = dict(
    # EDL (gia tri tham khao kieu MSL/M2020)
    edl_max_elev_m=-1500.0,     # o cao hon -> khi quyen qua mong de ham toc
    site_max_slope_deg=3.0,     # o thang regional (km); local can HiRISE
    site_max_rough_m=60.0,      # do nham (std phan du DEM trong cua so 5x5)
    ellipse_km=(20.0, 10.0),    # elip ha canh (dai x rong)
    # nhiet
    Ls_deg=0.0, albedo=0.25, emissivity=0.95,
    tau0=0.5, dust_H_m=11100.0, # tau(z) = tau0*exp(-(z - z_ref)/H)
    T_noon_ref_C=5.0,           # MEDA tai Jezero (18.4N, cung vi do voi Olympus Mons!)
    ref_lat=18.44, ref_elev_m=-2568.0,
    # khi quyen
    p0_pa=610.0, p_H_m=11100.0,
    # route
    route_max_slope_deg=15.0,   # o thang ~3.7 km/px; vach dung Olympus Mons vuot nguong nay
    w_slope=3.0, w_cold=1.5, w_climb=2.0, T_comfort_C=-10.0,
)
# DOC DU LIEU
def load_dem(source, path, step=1):
    """Tra ve (Z [m], lats [deg, tam pixel], lons [deg E], ppd hieu dung)."""
    if source in ("megdr16", "npy"):
        ppd, lat_top, lon_left = 16, 90.0, 0.0
        if source == "npy":
            full = np.load(path, mmap_mode="r")
        else:
            full = np.memmap(path, dtype=">i2", mode="r", shape=(2880, 5760))
    elif source == "megdr128":
        ppd, lat_top, lon_left = 128, 44.0, 180.0       # tile megt44n180hb
        full = np.memmap(path, dtype=">i2", mode="r", shape=(44 * 128, 90 * 128))
    elif source == "blend200":
        import rasterio                                   # pip install rasterio
        with rasterio.open(path) as ds:
            full = ds.read(1).astype(np.float32)
            t = ds.transform
            # GeoTIFF dung met tren cau R=3396190; doi sang do
            deg_per_px = abs(t.a) / (math.pi * R_MARS / 180.0)
            ppd = 1.0 / deg_per_px
            lon_left = t.c / (math.pi * R_MARS / 180.0) % 360
            lat_top = t.f / (math.pi * R_MARS / 180.0)
    else:
        raise ValueError(source)

    i0 = int(round((lat_top - REGION["lat_n"]) * ppd)); i1 = int(round((lat_top - REGION["lat_s"]) * ppd))
    j0 = int(round((REGION["lon_w"] - lon_left) * ppd)); j1 = int(round((REGION["lon_e"] - lon_left) * ppd))
    i0, j0 = max(i0, 0), max(j0, 0)
    Z = np.asarray(full[i0:i1, j0:j1], dtype=np.float64)
    ppd0 = ppd
    if step > 1:   # giam do phan giai bang trung binh khoi (giu dung do cao trung binh)
        h, w = (Z.shape[0] // step) * step, (Z.shape[1] // step) * step
        Z = Z[:h, :w].reshape(h // step, step, w // step, step).mean(axis=(1, 3))
        ppd = ppd0 / step
    lats = lat_top - (i0 + (np.arange(Z.shape[0]) + 0.5) * step) / ppd0
    lons = lon_left + (j0 + (np.arange(Z.shape[1]) + 0.5) * step) / ppd0
    return Z, lats, lons, ppd