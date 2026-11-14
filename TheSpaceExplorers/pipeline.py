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
    # EDL / chon site (gia tri tham khao kieu MSL/M2020, chinh theo kich ban cua nhom)
    edl_max_elev_m=-1000.0,     # o cao hon -> khi quyen qua mong de ham toc
    site_max_slope_deg=2.0,     # o thang regional (km); local can HiRISE
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
    route_max_slope_deg=12.0,   # o thang ~3.7 km/px; vach dung Olympus Mons vuot nguong nay
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
    rough = np.sqrt(np.maximum(ndimage.uniform_filter(resid**2, 5, mode="nearest"), 0))
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
    s_temp = np.clip((T + 30) / 40.0, 0, 1)                             # am hon = it nang luong suoi
    score = (0.35 * s_slope + 0.25 * s_rough + 0.25 * s_elev + 0.15 * s_temp) * ok
    # elip: TOAN BO o trong elip phai dat -> minimum filter; diem = trung binh trong elip
    ry = max(1, int(round(P["ellipse_km"][1] * 1000 / dy / 2)))
    rx = max(1, int(round(P["ellipse_km"][0] * 1000 / float(dx_row.mean()) / 2)))
    yy, xx = np.mgrid[-ry:ry + 1, -rx:rx + 1]
    fp = (xx / max(rx, 1e-9)) ** 2 + (yy / max(ry, 1e-9)) ** 2 <= 1.0
    all_ok = ndimage.minimum_filter(ok.astype(np.uint8), footprint=fp, mode="constant", cval=0).astype(bool)
    ell_score = ndimage.correlate(score, fp / fp.sum(), mode="constant") * all_ok
    # chon top-N, cach nhau >= 150 km
    sites, sc = [], ell_score.copy()
    min_sep_px = int(150e3 / dy)
    for _ in range(top_n):
        idx = np.unravel_index(np.argmax(sc), sc.shape)
        if sc[idx] <= 0: break
        sites.append(dict(i=int(idx[0]), j=int(idx[1]), lat=round(float(lats[idx[0]]), 3), lon=round(float(lons[idx[1]]), 3),
                          score=round(float(sc[idx]), 3), elev_m=round(float(Z[idx])), slope_deg=round(float(slope[idx]), 2),
                          rough_m=round(float(rough[idx]), 1), T_noon_C=round(float(T[idx]), 1)))
        i, j = idx
        sc[max(0, i - min_sep_px):i + min_sep_px + 1, max(0, j - min_sep_px):j + min_sep_px + 1] = 0
    return score, ell_score, ok, sites


# tim đường đi ngắn nhất từ A đến B
NB = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]

def astar(Z, slope, T, dy, dx_row, src, dst, mode="optimal"):
    H, W = Z.shape
    min_dx = float(dx_row.min())
    heur = lambda i, j: math.hypot((i - dst[0]) * dy, (j - dst[1]) * min_dx)
    g = np.full((H, W), np.inf); g[src] = 0.0
    parent = -np.ones((H, W), np.int64); closed = np.zeros((H, W), bool)
    pq = [(heur(*src), src)]
    while pq:
        _, u = heapq.heappop(pq)
        if closed[u]: continue
        closed[u] = True
        if u == dst: break
        ui, uj = u
        for di, dj in NB:
            vi, vj = ui + di, uj + dj
            if not (0 <= vi < H and 0 <= vj < W) or closed[vi, vj]: continue
            hd = math.hypot(dx_row[ui] * dj, dy * di)
            dz = Z[vi, vj] - Z[ui, uj]
            d3 = math.hypot(hd, dz)
            if mode == "shortest":
                c = d3
            else:
                s = slope[vi, vj]
                if s > P["route_max_slope_deg"]: continue
                cold = min(max((P["T_comfort_C"] - T[vi, vj]) / 40.0, 0.0), 1.0)
                c = d3 * (1 + P["w_slope"] * (s / P["route_max_slope_deg"]) ** 2) * (1 + P["w_cold"] * cold) \
                    + P["w_climb"] * max(dz, 0.0) * 10
            ng = g[ui, uj] + c
            if ng < g[vi, vj]:
                g[vi, vj] = ng; parent[vi, vj] = ui * W + uj
                heapq.heappush(pq, (ng + heur(vi, vj), (vi, vj)))
    if not closed[dst]:
        return None, int(closed.sum())
    path, n = [dst], dst
    while n != src:
        p = parent[n]; n = (int(p // W), int(p % W)); path.append(n)
    return path[::-1], int(closed.sum())

def route_metrics(path, Z, slope, T, dy, dx_row):
    L = climb = desc = 0.0
    for (i, j), (ni, nj) in zip(path, path[1:]):
        hd = math.hypot(dx_row[i] * (nj - j), dy * (ni - i)); dz = Z[ni, nj] - Z[i, j]
        L += math.hypot(hd, dz); climb += max(dz, 0); desc += max(-dz, 0)
    s = np.array([slope[p] for p in path]); t = np.array([T[p] for p in path])
    return dict(length_km=round(L / 1000, 1), climb_m=round(climb), descent_m=round(desc),
                max_slope_deg=round(float(s.max()), 2), mean_slope_deg=round(float(s.mean()), 2),
                cells_over_limit=int((s > P["route_max_slope_deg"]).sum()),
                min_T_noon_C=round(float(t.min()), 1), n_cells=len(path))

# XUAT QUA WEB
def export_web(out, Z, slope, T, site_ok, ell_score, lats, lons, ppd, dy, dx_row):
    """Nhi phan little-endian, xep lien tiep: Z int16 (m) | slope uint8 (0.2 deg) | T int8 (0.5 C) | site uint8 (0..255)."""
    H, W = Z.shape
    z16 = np.clip(np.round(Z), -32768, 32767).astype("<i2")
    s8 = np.clip(np.round(slope * 5), 0, 255).astype(np.uint8)
    t8 = np.clip(np.round(T * 2), -128, 127).astype(np.int8)
    q8 = np.clip(np.round(ell_score / max(ell_score.max(), 1e-9) * 254) + site_ok, 0, 255).astype(np.uint8)
    blob = z16.tobytes() + s8.tobytes() + t8.tobytes() + q8.tobytes()
    open(os.path.join(out, "web_grid.bin"), "wb").write(blob)
    meta = dict(H=H, W=W, ppd=ppd, lat_n=float(lats[0] + 0.5 / ppd), lon_w=float(lons[0] - 0.5 / ppd),
                dy_m=dy, dx_m=[round(float(v), 2) for v in dx_row],
                layout=["Z:int16 m", "slope:uint8 x0.2 deg", "T_noon:int8 x0.5 C", "site:uint8 score*254 (+1 if cell ok)"],
                params=P)
    json.dump(meta, open(os.path.join(out, "web_grid.json"), "w"))
    return len(blob)

# main
def to_px(lat, lon, lats, lons):
    return int(np.argmin(np.abs(lats - lat))), int(np.argmin(np.abs(lons - lon)))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default="megdr16", choices=["megdr16", "megdr128", "blend200", "npy"])
    ap.add_argument("--file", required=True)
    ap.add_argument("--step", type=int, default=1, help="gop khoi NxN de giam do phan giai (vd 4 voi 128ppd)")
    ap.add_argument("--out", default="out")
    ap.add_argument("--goal", default="Olympus Mons caldera (dinh)")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    Z, lats, lons, ppd = load_dem(args.source, args.file, args.step)
    slope, aspect, rough, dy, dx_row = terrain_layers(Z, lats, ppd)
    LAT2D = np.repeat(lats[:, None], Z.shape[1], axis=1)
    T, sol = noon_temperature(LAT2D, slope, aspect, Z)
    pres = atmosphere(Z)
    score, ell_score, site_ok, sites = site_selection(Z, slope, rough, T, lats, lons, dy, dx_row, ppd)

    # ROUTE: tu site tot nhat -> muc tieu
    B = to_px(*LANDMARKS[args.goal], lats, lons)
    # A = site (trong top-N) gan muc tieu nhat -> kich ban "ha canh roi di toi muc tieu"
    near = min(sites, key=lambda s_: math.hypot((s_["i"] - B[0]) * dy, (s_["j"] - B[1]) * float(dx_row.mean())))
    A = (near["i"], near["j"])
    # dinh nui: chon o cao nhat trong ban kinh 15 km quanh toa do caldera de chac la tren vanh
    r = max(1, int(15e3 / dy)); sub = Z[B[0] - r:B[0] + r + 1, B[1] - r:B[1] + r + 1]
    k = np.unravel_index(np.argmax(sub), sub.shape); B = (B[0] - r + int(k[0]), B[1] - r + int(k[1]))
    routes = {}
    for mode in ["shortest", "optimal"]:
        path, nexp = astar(Z, slope, T, dy, dx_row, A, B, mode)
        routes[mode] = dict(expanded=nexp, path=path,
                            metrics=route_metrics(path, Z, slope, T, dy, dx_row) if path else None)

    summary = dict(
        source=args.source, ppd=ppd, grid=list(Z.shape), pixel_km=round(dy / 1000, 3), region=REGION,
        terrain=dict(elev_min=round(float(Z.min())), elev_max=round(float(Z.max())),
                     slope_p50=round(float(np.percentile(slope, 50)), 2), slope_p95=round(float(np.percentile(slope, 95)), 2),
                     slope_max=round(float(slope.max()), 2), pressure_min_pa=round(float(pres.min()), 1),
                     pressure_max_pa=round(float(pres.max()), 1),
                     T_noon_min_C=round(float(T.min()), 1), T_noon_max_C=round(float(T.max()), 1),
                     pct_route_blocked=round(float((slope > P["route_max_slope_deg"]).mean() * 100), 2),
                     pct_site_ok=round(float(site_ok.mean() * 100), 2)),
        solar=dict(Ls=P["Ls_deg"], flux_Wm2=round(sol["S"], 1), decl_deg=round(sol["decl"], 2), K_cal=round(sol["K"], 3)),
        sites=sites,
        route=dict(A=dict(site_rank=sites.index(near) + 1, lat=float(lats[A[0]]), lon=float(lons[A[1]]), elev_m=float(Z[A])),
                   B=dict(name=args.goal, lat=float(lats[B[0]]), lon=float(lons[B[1]]), elev_m=float(Z[B])),
                   **{m: dict(expanded=v["expanded"], metrics=v["metrics"]) for m, v in routes.items()}),
        params=P)
    nbytes = export_web(args.out, Z, slope, T, site_ok.astype(np.uint8), ell_score, lats, lons, ppd, dy, dx_row)
    np.savez_compressed(os.path.join(args.out, "layers.npz"), Z=Z, slope=slope, aspect=aspect, rough=rough,
                        T_noon=T, pressure=pres, site_score=score, ellipse_score=ell_score, site_ok=site_ok,
                        lats=lats, lons=lons,
                        **{f"path_{m}": np.array(v["path"]) for m, v in routes.items() if v["path"]})
    json.dump(summary, open(os.path.join(args.out, "summary.json"), "w"), indent=2, ensure_ascii=False)
    print(json.dumps({k: v for k, v in summary.items() if k != "params"}, indent=2, ensure_ascii=False))
    print(f"web_grid.bin: {nbytes/1024:.0f} KB")

if __name__ == "__main__":
    main()

