"""Dang ky (georeference) anh chup man hinh NASA Mars Trek vao luoi MOLA, roi cat dung vung cua app.

Anh chup man hinh khong co toa do -> mo hinh equirectangular 4 tham so:
    lon = lon0 + x / sx ,  lat = lat0 - y / sy
Toi uu de do lon gradient cua anh tuong quan cao nhat voi do doc MOLA (Nelder-Mead, khoi dau tu 1 luoi tim kiem).

  pip install numpy scipy pillow
  python trek/register.py --img trek/viking_screenshot.png --dem data/megt90n000eb.img \
         --guess 187.4,45.8,21.9          # lon0(°E), lat0(°N), px/do uoc luong (tu 2 diem moc biet toa do)
Dau ra: trek/georef.json, trek/viking_olympus_32ppd.jpg (vung 8-30°N, 212-240°E, 32 px/do)
Neu tai GeoTIFF tu tab Downloads cua Mars Trek thi KHONG can buoc nay: anh da co toa do."""
import argparse, json, os
import numpy as np
from PIL import Image
from scipy import ndimage, optimize

ap = argparse.ArgumentParser()
ap.add_argument("--img", required=True); ap.add_argument("--dem", required=True, help="MOLA MEGDR 16 px/do: .img (PDS) hoac .npy")
ap.add_argument("--guess", default="187.4,45.8,21.9"); ap.add_argument("--out", default="trek")
ap.add_argument("--lat_n", type=float, default=30.0); ap.add_argument("--lon_w", type=float, default=212.0)
ap.add_argument("--H", type=int, default=352); ap.add_argument("--W", type=int, default=448); ap.add_argument("--k", type=int, default=2)
a = ap.parse_args()

im = np.asarray(Image.open(a.img).convert("RGB")).astype(np.float32)
gimg = ndimage.gaussian_gradient_magnitude(im.mean(2), 1.5)
G = np.load(a.dem, mmap_mode="r") if a.dem.endswith(".npy") else np.memmap(a.dem, dtype=">i2", mode="r", shape=(2880, 5760))
PPD = 16; lo0g, la0g, s0 = map(float, a.guess.split(","))
la1, la0 = la0g + 1, la0g - im.shape[0] / s0 - 1                      # vung MOLA phu anh (them le 1 do)
lo0, lo1 = lo0g - 1, lo0g + im.shape[1] / s0 + 1
i0, i1 = int((90 - la1) * PPD), int((90 - la0) * PPD); j0, j1 = int(lo0 * PPD), int(lo1 * PPD)
Z = np.asarray(G[i0:i1, j0:j1], dtype=np.float32)
LAT, LON = np.meshgrid(90 - (np.arange(i0, i1) + .5) / PPD, (np.arange(j0, j1) + .5) / PPD, indexing="ij")
gz = np.log1p(ndimage.gaussian_gradient_magnitude(Z, 1.0) / 50)

def score(p):
    lon0, lat0, sx, sy = p
    x = (LON - lon0) * sx; y = (lat0 - LAT) * sy
    ok = (x > 2) & (x < im.shape[1] - 3) & (y > 2) & (y < im.shape[0] - 3)
    if ok.sum() < 20000: return 1.0
    v = ndimage.map_coordinates(gimg, [y[ok], x[ok]], order=1)
    return -np.corrcoef(np.log1p(v), gz[ok])[0, 1]

p0 = np.array([lo0g, la0g, s0, s0]); best = (score(p0), p0)
for dlo in np.arange(-1.5, 1.6, .5):
    for dla in np.arange(-1.5, 1.6, .5):
        for ds in (-1, 0, 1):
            p = p0 + [dlo, dla, ds, ds]; s = score(p)
            if s < best[0]: best = (s, p)
r = optimize.minimize(score, best[1], method="Nelder-Mead", options=dict(xatol=1e-3, fatol=1e-5, maxiter=800))
lon0, lat0, sx, sy = r.x
print(f"lon0={lon0:.4f}°E lat0={lat0:.4f}°N  sx={sx:.3f} sy={sy:.3f} px/do  tuong quan={-r.fun:.3f}")
os.makedirs(a.out, exist_ok=True)
json.dump(dict(lon0_E=lon0, lat0_N=lat0, px_per_deg_x=sx, px_per_deg_y=sy, corr=-r.fun), open(os.path.join(a.out, "georef.json"), "w"), indent=1)

# cat anh theo luoi app (k lan do phan giai 16 px/do)
K = a.k; ii = np.arange(a.H * K); jj = np.arange(a.W * K)
LA, LO = np.meshgrid(a.lat_n - (ii + .5) / (PPD * K), a.lon_w + (jj + .5) / (PPD * K), indexing="ij")
x = (LO - lon0) * sx; y = (lat0 - LA) * sy
crop = np.stack([ndimage.map_coordinates(im[..., c], [y, x], order=1) for c in range(3)], -1)
Image.fromarray(np.clip(crop, 0, 255).astype(np.uint8)).save(os.path.join(a.out, "viking_olympus_32ppd.jpg"), quality=85, optimize=True, progressive=True)
print("->", os.path.join(a.out, "viking_olympus_32ppd.jpg"))
