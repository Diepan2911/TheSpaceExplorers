"""
Xuat model 3D vung Olympus Mons tu ket qua pipeline (DEM MOLA that).

  python export_3d.py out16 model3d            # luoi day du 352x448
  python export_3d.py out16 model3d --step 2   # nhe hon 4 lan

Dau ra (thu muc model3d/):
  olympus_terrain.obj/.mtl  - luoi dia hinh, 1 don vi = 1 km, Z = do cao that (khong phong dai), UV san
  olympus_texture.png       - anh mau do cao + hillshade cho luoi tren
  olympus_heightmap16.png   - heightmap 16-bit (0 = min, 65535 = max) cho Displace modifier / Unity / Unreal
  olympus_routes.obj        - 2 tuyen (toi uu, ngan nhat) dang polyline, dat cao hon mat dat 0.3 km
  olympus_terrain.glb       - cung luoi cho web (Three.js / Babylon / <model-viewer>), Y huong len
  model_info.json           - he toa do, ti le, cach doi lat/lon -> x/y
He toa do: goc (0,0) = tam vung; +X = Dong, +Y = Bac, +Z = len (Blender Z-up).
"""
import argparse, json, math, os, struct
import numpy as np
from PIL import Image
from scipy import ndimage

R_KM = 3396.19
ap = argparse.ArgumentParser()
ap.add_argument("out_dir"); ap.add_argument("dst"); ap.add_argument("--step", type=int, default=1)
ap.add_argument("--tex-scale", type=int, default=4)
a = ap.parse_args()
os.makedirs(a.dst, exist_ok=True)

L = np.load(os.path.join(a.out_dir, "layers.npz"))
Z, lats, lons = L["Z"][::a.step, ::a.step], L["lats"][::a.step], L["lons"][::a.step]
H, W = Z.shape
lat0, lon0 = float(lats.mean()), float(lons.mean())
km_deg = R_KM * math.pi / 180

def xy(lat, lon):
    return (lon - lon0) * km_deg * np.cos(np.radians(lat)), (lat - lat0) * km_deg

LA, LO = np.meshgrid(lats, lons, indexing="ij")
X, Y = xy(LA, LO)
ZK = Z / 1000.0
U = (np.arange(W) + 0.5) / W
V = 1 - (np.arange(H) + 0.5) / H
UU, VV = np.meshgrid(U, V)

stops = np.array([[0, 43, 58, 103], [.18, 75, 93, 132], [.35, 124, 133, 144], [.55, 180, 167, 122], [.8, 217, 196, 107], [1, 244, 232, 163]], float)
Zfull = L["Z"]; s = a.tex_scale
Zt = ndimage.zoom(Zfull, s, order=3)
t = np.clip((Zt / 1000 + 4) / 25, 0, 1)
rgb = np.stack([np.interp(t, stops[:, 0], stops[:, k]) for k in (1, 2, 3)], -1)
dy_m = km_deg * 1000 / (16 * s)
gy, gx = np.gradient(Zt, dy_m)
gx = gx / np.cos(np.radians(np.repeat(ndimage.zoom(L["lats"], s, order=1)[:, None], Zt.shape[1], 1)))
slope = np.arctan(np.hypot(gx, gy) * 4); aspect = np.arctan2(-gx, gy)
az, alt = math.radians(315), math.radians(40)
hs = np.clip(np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect), 0, 1)
img = np.clip(rgb * (0.45 + 0.8 * hs[..., None]), 0, 255).astype(np.uint8)
Image.fromarray(img).save(os.path.join(a.dst, "olympus_texture.png"))

zmin, zmax = float(Zfull.min()), float(Zfull.max())
hm = np.round((Zfull - zmin) / (zmax - zmin) * 65535).astype(np.uint16)
Image.fromarray(hm, mode="I;16").save(os.path.join(a.dst, "olympus_heightmap16.png"))

idx = np.arange(H * W).reshape(H, W) + 1
q00, q01, q10, q11 = idx[:-1, :-1], idx[:-1, 1:], idx[1:, :-1], idx[1:, 1:]
tris = np.concatenate([np.stack([q00, q10, q11], -1).reshape(-1, 3), np.stack([q00, q11, q01], -1).reshape(-1, 3)])
with open(os.path.join(a.dst, "olympus_terrain.mtl"), "w") as f:
    f.write("newmtl mars\nKd 1 1 1\nKs 0 0 0\nmap_Kd olympus_texture.png\n")
with open(os.path.join(a.dst, "olympus_terrain.obj"), "w") as f:
    f.write("# Olympus Mons - MOLA MEGDR (NASA PDS). 1 unit = 1 km, Z = elevation above areoid (km), no exaggeration\n")
    f.write("mtllib olympus_terrain.mtl\no OlympusMons\n")
    np.savetxt(f, np.column_stack([X.ravel(), Y.ravel(), ZK.ravel()]), fmt="v %.3f %.3f %.4f")
    np.savetxt(f, np.column_stack([UU.ravel(), VV.ravel()]), fmt="vt %.5f %.5f")
    f.write("usemtl mars\ns 1\n")
    np.savetxt(f, np.column_stack([tris[:, 0], tris[:, 0], tris[:, 1], tris[:, 1], tris[:, 2], tris[:, 2]]), fmt="f %d/%d %d/%d %d/%d")

lats_f, lons_f = L["lats"], L["lons"]
with open(os.path.join(a.dst, "olympus_routes.obj"), "w") as f:
    off = 1
    for name in ["optimal", "shortest"]:
        k = f"path_{name}"
        if k not in L: continue
        p = L[k]; la, lo = lats_f[p[:, 0]], lons_f[p[:, 1]]
        x, y = xy(la, lo); z = Zfull[p[:, 0], p[:, 1]] / 1000 + 0.3
        f.write(f"o route_{name}\n")
        np.savetxt(f, np.column_stack([x, y, z]), fmt="v %.3f %.3f %.4f")
        f.write("l " + " ".join(str(off + i) for i in range(len(p))) + "\n"); off += len(p)

pos = np.column_stack([X.ravel(), ZK.ravel(), -Y.ravel()]).astype("<f4")
uv = np.column_stack([UU.ravel(), 1 - VV.ravel()]).astype("<f4")
ind = (tris[:, [0, 2, 1]] - 1).astype("<u4").ravel()   
png = open(os.path.join(a.dst, "olympus_texture.png"), "rb").read()
def pad4(b, c=b"\0"): return b + c * ((4 - len(b) % 4) % 4)
chunks = [pos.tobytes(), uv.tobytes(), ind.tobytes(), png]
views, binb, o = [], b"", 0
for c in chunks:
    c4 = pad4(c); views.append(dict(buffer=0, byteOffset=o, byteLength=len(c))); binb += c4; o += len(c4)
gl = dict(asset=dict(version="2.0", generator="mars-site-navigator"),
          scene=0, scenes=[dict(nodes=[0])], nodes=[dict(mesh=0, name="OlympusMons")],
          meshes=[dict(name="terrain", primitives=[dict(attributes=dict(POSITION=0, TEXCOORD_0=1), indices=2, material=0)])],
          materials=[dict(name="mars", pbrMetallicRoughness=dict(baseColorTexture=dict(index=0), metallicFactor=0, roughnessFactor=1))],
          textures=[dict(source=0)], images=[dict(bufferView=3, mimeType="image/png")],
          accessors=[dict(bufferView=0, componentType=5126, count=len(pos), type="VEC3", min=pos.min(0).tolist(), max=pos.max(0).tolist()),
                     dict(bufferView=1, componentType=5126, count=len(uv), type="VEC2"),
                     dict(bufferView=2, componentType=5125, count=len(ind), type="SCALAR")],
          bufferViews=[dict(v, **({"target": 34962} if i < 2 else {"target": 34963} if i == 2 else {})) for i, v in enumerate(views)],
          buffers=[dict(byteLength=len(binb))])
js = pad4(json.dumps(gl, separators=(",", ":")).encode(), b" ")
glb = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binb)) + struct.pack("<II", len(js), 0x4E4F534A) + js \
      + struct.pack("<II", len(binb), 0x004E4942) + binb
open(os.path.join(a.dst, "olympus_terrain.glb"), "wb").write(glb)

info = dict(source="MOLA MEGDR (MGS), NASA PDS Geosciences", grid=[H, W], step=a.step,
            center_lat=lat0, center_lon_E=lon0, units="km", up="+Z (OBJ) / +Y (GLB)",
            x_km="(lon - center_lon) * 59.274 * cos(lat)", y_km="(lat - center_lat) * 59.274",
            elev_km=[zmin / 1000, zmax / 1000], heightmap16="z_m = zmin + v/65535*(zmax - zmin)",
            extent_km=dict(x=[float(X.min()), float(X.max())], y=[float(Y.min()), float(Y.max())]),
            vertices=int(H * W), triangles=int(len(tris)))
json.dump(info, open(os.path.join(a.dst, "model_info.json"), "w"), indent=2)
print(json.dumps(info, indent=2))
for fn in sorted(os.listdir(a.dst)): print(f"{fn:28s} {os.path.getsize(os.path.join(a.dst, fn)) / 1e6:6.1f} MB")
