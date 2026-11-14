import os
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pipeline as pl

OUT = os.environ.get("NAV_OUT", "out16")
L = np.load(os.path.join(OUT, "layers.npz"))
Z, SLOPE, T, PRES, LATS, LONS = L["Z"], L["slope"], L["T_noon"], L["pressure"], L["lats"], L["lons"]
PPD = 1.0 / abs(LATS[1] - LATS[0])
DY = pl.R_MARS * np.radians(1 / PPD)
DX = DY * np.cos(np.radians(LATS))
SUMMARY = __import__("json").load(open(os.path.join(OUT, "summary.json")))

app = FastAPI(title="Mars Site Navigator API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"], allow_headers=["*"])

def parse(s):
    try:
        lat, lon = map(float, s.split(","))
    except ValueError:
        raise HTTPException(400, "dinh dang 'lat,lon'")
    if not (LATS.min() <= lat <= LATS.max() and LONS.min() <= lon <= LONS.max()):
        raise HTTPException(400, f"({lat},{lon}) nam ngoai vung du lieu")
    return pl.to_px(lat, lon, LATS, LONS)

@app.get("/meta")
def meta():
    return dict(grid=list(Z.shape), ppd=PPD, region=SUMMARY["region"], terrain=SUMMARY["terrain"])

@app.get("/sites")
def sites():
    return SUMMARY["sites"]

@app.get("/point")
def point(lat: float, lon: float):
    i, j = parse(f"{lat},{lon}")
    return dict(elev_m=float(Z[i, j]), slope_deg=float(SLOPE[i, j]), T_noon_C=float(T[i, j]), pressure_pa=float(PRES[i, j]))

@app.get("/route")
def route(a: str, b: str, mode: str = "optimal",
          w_slope: float = Query(3.0, ge=0), w_cold: float = Query(1.5, ge=0),
          w_climb: float = Query(2.0, ge=0), max_slope: float = Query(12.0, gt=0)):
    pl.P.update(w_slope=w_slope, w_cold=w_cold, w_climb=w_climb, route_max_slope_deg=max_slope)
    A, B = parse(a), parse(b)
    path, expanded = pl.astar(Z, SLOPE, T, DY, DX, A, B, mode)
    if path is None:
        raise HTTPException(422, "khong co duong di thoa nguong do doc - thu tang max_slope")
    coords = [[round(float(LONS[j]), 4), round(float(LATS[i]), 4), float(Z[i, j])] for i, j in path]
    return dict(type="Feature", geometry=dict(type="LineString", coordinates=coords),
                properties=dict(expanded=expanded, **pl.route_metrics(path, Z, SLOPE, T, DY, DX)))
