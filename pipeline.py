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
