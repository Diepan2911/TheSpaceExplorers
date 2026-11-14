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
    tau0=0.3, dust_H_m=11100.0, # tau(z) = tau0*exp(-(z - z_ref)/H)
    T_noon_ref_C=0.0,           # MEDA tai Jezero (18.4N, cung vi do voi Olympus Mons!)
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
# LOP DIA HINH
def terrain_layers(Z, lats, ppd):
    dy = R_MARS * math.radians(1 / ppd)
    dx = dy * np.cos(np.radians(lats))[:, None]
    Pd = np.pad(Z, 1, mode="edge")
    a, b, c = Pd[:-2, :-2], Pd[:-2, 1:-1], Pd[:-2, 2:]
    d, f = Pd[1:-1, :-2], Pd[1:-1, 2:]
    g, h, k = Pd[2:, :-2], Pd[2:, 1:-1], Pd[2:, 2:]
    dzdx = ((c + 2 * f + k) - (a + 2 * d + g)) / (8 * dx)      # +x = Dong
    dzdy = ((g + 2 * h + k) - (a + 2 * b + c)) / (8 * dy)      # +y = Nam
    slope = np.degrees(np.arctan(np.hypot(dzdx, dzdy)))
    aspect = (np.degrees(np.arctan2(-dzdx, dzdy)) + 360) % 360  # huong mat doc quay ve, 0=Bac
    resid = Z - ndimage.uniform_filter(Z, 3, mode="nearest")
    rough = np.sqrt(np.maximum(ndimage.uniform_filter(resid**2, 3, mode="nearest"), 0))
    return slope, aspect, rough, dy, dx[:, 0]

# KHI QUYEN & NHIET
def atmosphere(Z):
    return P["p0_pa"] * np.exp(-Z / P["p_H_m"])

def solar_geometry(Ls):
    e, a_au, ls_peri = 0.0934, 1.5237, 251.0
    r = a_au * (1 - e**2) / (1 + e * math.cos(math.radians(Ls - ls_peri)))
    S = 1361.0 / r**2
    decl = math.degrees(math.asin(math.sin(math.radians(25.19)) * math.sin(math.radians(Ls))))
    return S, decl, r

def noon_flux(lat, slope, aspect, Z, S, decl):
    zen = np.radians(np.abs(lat - decl)); mu0 = np.maximum(np.cos(zen), 0.05)
    sun_az = np.where(lat >= decl, 180.0, 0.0)
    cos_i = np.clip(np.cos(np.radians(slope)) * mu0 +
                    np.sin(np.radians(slope)) * np.sin(zen) * np.cos(np.radians(sun_az - aspect)), 0, None)
    tau = P["tau0"] * np.exp(-(Z - P["ref_elev_m"]) / P["dust_H_m"])
    direct = cos_i * np.exp(-tau / mu0)
    diffuse = 0.5 * mu0 * (1 - np.exp(-tau / mu0)) * np.cos(np.radians(slope / 2)) ** 2
    ir_back = (1 - np.exp(-0.5 * tau)) * 5.670e-8 * 210.0**4      # buc xa nguoc cua khi quyen bui
    return (1 - P["albedo"]) * S * (direct + diffuse) + ir_back

def noon_temperature(LAT2D, slope, aspect, Z):
    S, decl, _ = solar_geometry(P["Ls_deg"])
    q = noon_flux(LAT2D, slope, aspect, Z, S, decl)
    q_ref = noon_flux(np.array(P["ref_lat"]), np.array(0.0), np.array(0.0), np.array(P["ref_elev_m"]), S, decl)
    T_eq = (q / (P["emissivity"] * 5.670e-8)) ** 0.25
    T_ref = (q_ref / (P["emissivity"] * 5.670e-8)) ** 0.25
    K = (P["T_noon_ref_C"] + 273.15) / float(T_ref)          # hieu chinh theo MEDA
    return T_eq * K - 273.15, dict(S=S, decl=decl, K=K)

# CHON SITE
def site_selection(Z, slope, rough, T, lats, lons, dy, dx_row, ppd, top_n=5):
    ok = (Z <= P["edl_max_elev_m"]) & (slope <= P["site_max_slope_deg"]) & (rough <= P["site_max_rough_m"])
    # diem lien tuc 0..1 (cang cao cang tot)
    s_slope = 1 - np.clip(slope / P["site_max_slope_deg"], 0, 1)
    s_rough = 1 - np.clip(rough / P["site_max_rough_m"], 0, 1)
    s_elev = np.clip((P["edl_max_elev_m"] - Z) / 3000.0, 0, 1)          # thap hon = nhieu khi de ham toc
    s_temp = np.clip((T + 20) / 30.0, 0, 1)                             # am hon = it nang luong suoi
    score = (0.45 * s_slope + 0.20 * s_rough + 0.20 * s_elev + 0.15 * s_temp) * ok
    # elip: TOAN BO o trong elip phai dat -> minimum filter; diem = trung binh trong elip
    ry = max(1, int(round(P["ellipse_km"][1] * 1000 / dy / 2)))
    rx = max(1, int(round(P["ellipse_km"][0] * 1000 / float(dx_row.mean()) / 2)))
    yy, xx = np.mgrid[-ry:ry + 1, -rx:rx + 1]
    fp = (xx / max(rx, 1e-9)) ** 2 + (yy / max(ry, 1e-9)) ** 2 <= 1.0
    all_ok = ndimage.minimum_filter(ok.astype(np.uint8), footprint=fp, mode="constant", cval=0).astype(bool)
    ell_score = ndimage.correlate(score, fp / fp.sum(), mode="constant") * all_ok
    # chon top-N, cach nhau >= 100 km
    sites, sc = [], ell_score.copy()
    min_sep_px = int(100e3 / dy)
    for _ in range(top_n):
        idx = np.unravel_index(np.argmax(sc), sc.shape)
        if sc[idx] <= 0: break
        sites.append(dict(i=int(idx[0]), j=int(idx[1]), lat=round(float(lats[idx[0]]), 3), lon=round(float(lons[idx[1]]), 3),
                          score=round(float(sc[idx]), 3), elev_m=round(float(Z[idx])), slope_deg=round(float(slope[idx]), 2),
                          rough_m=round(float(rough[idx]), 1), T_noon_C=round(float(T[idx]), 1)))
        i, j = idx
        sc[max(0, i - min_sep_px):i + min_sep_px + 1, max(0, j - min_sep_px):j + min_sep_px + 1] = 0
    return score, ell_score, ok, sites
