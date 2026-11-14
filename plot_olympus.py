
import json, math, sys
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, LightSource, TwoSlopeNorm

OUT = sys.argv[1] if len(sys.argv) > 1 else "out16"
d = np.load(f"{OUT}/layers.npz"); S = json.load(open(f"{OUT}/summary.json"))
Z, SL, T, Q, lats, lons = d["Z"], d["slope"], d["T_noon"], d["ellipse_score"], d["lats"], d["lons"]
ppd = S["ppd"]; Pm = S["params"]
ext = [lons[0] - 0.5 / ppd, lons[-1] + 0.5 / ppd, lats[-1] - 0.5 / ppd, lats[0] + 0.5 / ppd]
ASP = 1 / math.cos(math.radians(lats.mean()))

SURF, INK, INK2, GRID = "#fcfcfb", "#0b0b0b", "#52514e", "#e4e3df"
C_OPT, C_SHORT = "#2a78d6", "#eb6834"
seq_or = LinearSegmentedColormap.from_list("o", ["#fde6d9", "#f6b08f", "#eb6834", "#b8461c", "#7a2b0e"])
seq_bl = LinearSegmentedColormap.from_list("b", ["#f0efec", "#b7d3f6", "#6da7ec", "#2a78d6", "#184f95", "#0d366b"])
div = LinearSegmentedColormap.from_list("d", ["#184f95", "#6da7ec", "#f0efec", "#f6b08f", "#b8461c"])
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "text.color": INK, "axes.labelcolor": INK2,
                     "xtick.color": INK2, "ytick.color": INK2, "axes.edgecolor": GRID,
                     "figure.facecolor": SURF, "axes.facecolor": SURF})

def ll(p): return lons[p[:, 1]], lats[p[:, 0]]
def deco(ax, title):
    ax.set_aspect(ASP); ax.tick_params(length=0)
    ax.set_xlabel("Kinh độ (°E)"); ax.set_ylabel("Vĩ độ (°N)")
    ax.set_title(title, loc="left", fontsize=11.5, fontweight="bold")

def cbar(fig, im, ax, label, **kw):
    cb = fig.colorbar(im, ax=ax, fraction=0.04, pad=0.02, **kw); cb.set_label(label); cb.outline.set_visible(False)

fig = plt.figure(figsize=(17, 15.5))
gs = fig.add_gridspec(2, 4, height_ratios=[1, 1, 0.62], hspace=0.28, wspace=0.12)
hs = LightSource(azdeg=315, altdeg=35).hillshade(Z, vert_exag=4, dx=3500, dy=3700)

ax = fig.add_subplot(gs[0, 0])
ax.imshow(hs, cmap="gray", extent=ext, vmin=0, vmax=1.15)
im = ax.imshow(Z / 1000, cmap="cividis", alpha=0.45, extent=ext)
ax.contour(lons, lats[::-1], (Z / 1000)[::-1], levels=np.arange(-2, 22, 4), colors=INK2, linewidths=0.45, alpha=0.7)
paths(ax); cbar(fig, im, ax, "Độ cao (km, so với areoid)"); deco(ax, "Địa hình MOLA · đồng mức 4 km")

ax = fig.add_subplot(gs[0, 1])
im = ax.imshow(SL, cmap=seq_or, vmin=0, vmax=20, extent=ext)
blk = (SL > Pm["route_max_slope_deg"]).astype(float)
ax.contourf(lons, lats[::-1], blk[::-1], levels=[0.5, 1.5], colors="none", hatches=["////"], zorder=3)
ax.contour(lons, lats[::-1], blk[::-1], levels=[0.5], colors=INK, linewidths=0.7, zorder=3)
paths(ax); cbar(fig, im, ax, "Độ dốc (°)", extend="max")
deco(ax, f"Độ dốc · gạch chéo = cấm đi (> {Pm['route_max_slope_deg']:.0f}°)")

ax = fig.add_subplot(gs[1, 0])
lim = float(np.abs(T).max())
im = ax.imshow(T, cmap=div, norm=TwoSlopeNorm(vcenter=0, vmin=-lim, vmax=lim), extent=ext)
paths(ax); cbar(fig, im, ax, "Nhiệt độ bề mặt giữa trưa (°C, mô hình)")
deco(ax, f"Nhiệt độ  · Ls = {Pm['Ls_deg']:.0f}°")

ax = fig.add_subplot(gs[1, 1])
ax.imshow(hs, cmap="gray", extent=ext, vmin=0, vmax=1.3, alpha=0.55)
Qm = np.ma.masked_where(Q <= 0, Q)
im = ax.imshow(Qm, cmap=seq_bl, vmin=0, vmax=1, extent=ext, alpha=0.95)
for n, s in enumerate(S["sites"], 1):
    ax.scatter([s["lon"]], [s["lat"]], s=150, facecolors="none", edgecolors=INK, linewidths=1.6, zorder=6)
    ax.annotate(f"#{n}", (s["lon"], s["lat"]), xytext=(6, 6), textcoords="offset points", fontsize=9.5, fontweight="bold",
                zorder=7, bbox=dict(boxstyle="round,pad=0.15", fc=SURF, ec="none", alpha=0.85))
cbar(fig, im, ax, "Điểm phù hợp hạ cánh (trung bình trong elip)")
deco(ax, f"Chọn site · elip {Pm['ellipse_km'][0]:.0f}×{Pm['ellipse_km'][1]:.0f} km, cao < {Pm['edl_max_elev_m']/1000:.0f} km, dốc < {Pm['site_max_slope_deg']:.0f}°")


ax = fig.add_subplot(gs[2, 0])
R = 3396.19
for k, c, ls, lab in [("shortest", C_SHORT, (0, (4, 2)), "Ngắn nhất 3D"), ("optimal", C_OPT, "-", "Tối ưu (đa tiêu chí)")]:
    p = d[f"path_{k}"]; dist = [0.0]
    for (i, j), (ni, nj) in zip(p, p[1:]):
        dist.append(dist[-1] + math.hypot(R * math.radians(1 / ppd) * math.cos(math.radians(lats[i])) * (nj - j),
                                          R * math.radians(1 / ppd) * (ni - i)))
    ax.plot(dist, Z[p[:, 0], p[:, 1]] / 1000, color=c, lw=2.2 if k == "optimal" else 1.8, ls=ls, label=lab)
ax.grid(axis="y", color=GRID, lw=0.8); ax.set_axisbelow(True)
for s_ in ["top", "right", "left"]: ax.spines[s_].set_visible(False)
ax.tick_params(length=0); ax.set_xlabel("Quãng đường (km)"); ax.set_ylabel("Độ cao (km)")
ax.legend(loc="lower right", frameon=False)
ax.set_title("Mặt cắt độ cao: site → caldera", loc="left", fontsize=11.5, fontweight="bold")


ax = fig.add_subplot(gs[2, 1]); ax.axis("off")
r_ = S["route"]; ms, mo = r_["shortest"]["metrics"], r_["optimal"]["metrics"]
rows = [("Chiều dài (km)", "length_km", "{:.1f}"), ("Tổng leo (m)", "climb_m", "{:,}"), ("Dốc lớn nhất (°)", "max_slope_deg", "{:.1f}"),
        ("Dốc trung bình (°)", "mean_slope_deg", "{:.2f}"), (f"Ô dốc > {Pm['route_max_slope_deg']:.0f}°", "cells_over_limit", "{}"),
        ("T trưa thấp nhất (°C)", "min_T_noon_C", "{:.1f}")]
ax.text(0.02, 0.97, "Chỉ số tuyến", fontsize=9.5, color=INK2, fontweight="bold", transform=ax.transAxes)
ax.text(0.62, 0.97, "Ngắn nhất", fontsize=9.5, color=C_SHORT, fontweight="bold", ha="right", transform=ax.transAxes)
ax.text(0.84, 0.97, "Tối ưu", fontsize=9.5, color=C_OPT, fontweight="bold", ha="right", transform=ax.transAxes)
for n, (lab, key, fmt) in enumerate(rows):
    y = 0.84 - n * 0.125
    ax.plot([0.02, 0.86], [y + 0.06, y + 0.06], color=GRID, lw=0.8, transform=ax.transAxes)
    ax.text(0.02, y, lab, fontsize=9.5, transform=ax.transAxes, va="center")
    ax.text(0.62, y, fmt.format(ms[key]).replace(",", "."), fontsize=9.5, ha="right", va="center", transform=ax.transAxes)
    ax.text(0.84, y, fmt.format(mo[key]).replace(",", "."), fontsize=9.5, ha="right", va="center", fontweight="bold", transform=ax.transAxes)
ax.set_title("So sánh 2 tuyến", loc="left", fontsize=11.5, fontweight="bold", x=0.02)

fig.suptitle(f"Mars Site Navigator · Olympus Mons (regional, MOLA MEGDR {ppd:g} px/° ≈ {S['pixel_km']:.1f} km/px)",
             x=0.07, ha="left", fontsize=15, fontweight="bold", y=0.995)
fig.text(0.07, 0.975, "Độ cao từ NASA PDS (đo thật). Độ dốc, độ nhám, áp suất tính từ DEM. Nhiệt độ là mô hình bức xạ hiệu chỉnh theo MEDA — không phải số đo.",
         fontsize=10, color=INK2)
fig.savefig(f"{OUT}/olympus_site_navigator.png", dpi=120, bbox_inches="tight")
print("saved")
