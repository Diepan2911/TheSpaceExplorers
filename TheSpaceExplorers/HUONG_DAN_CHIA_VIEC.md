# Chia việc gõ code (bản v14 – thông báo nhiệm vụ khoa học nổi ngay tại chỗ làm việc)

| Người | Files phải gõ | Khối lượng |
|---|---|---|
| 1 | `app/src/app.js` | ~123 nghìn ký tự |
| 2 | `app/src/i18n.js`, `download_data.py`, `api.py`, `app/src/logo.js` | ~43 nghìn |
| 3 | `app/src/science.js`, `app/src/index.template.html`, `app/src/health.js` | ~47 nghìn |
| 4 | `app/src/sci_anim.js`, `app/src/style.css`, `pipeline.py` | ~55 nghìn |
| 5 | `app/src/ui.js`, `plot_olympus.py`, `export_3d.py`, `blender_scene.py`, `blender_pano.py`, `geo/rasterize_geo.py`, `geo/build_geo_data.py`, `trek/register.py`, `app/build_app.py`, `tools/update_app_data.py`, `web/build_web.py` | ~50 nghìn |

**Không gõ, giữ nguyên:** app/logo_bk.png (ảnh logo), README.md, HUONG_DAN_CHIA_VIEC.md, requirements.txt, CHAY_APP.bat, CHAY_APP.command, ghep_va_chay.py,
app/olympus_navigator_3d.html, app/src/parts/.gitkeep, geo/geo_embed.json, trek/georef.json, trek/viking_screenshot.png,
trek/viking_olympus_32ppd.jpg, web/template.html, out16/layers.npz, out16/summary.json, out16/web_grid.bin, out16/web_grid.json, chia_viec/

Kiểm tra: `python chia_viec/kiem_tra_go.py chia_viec/goc/<mẫu> <file đã gõ>` tới khi `KHOP 100%`.
Chủ nhóm: chép file vào đúng chỗ, `pip install numpy`, bấm đúp `CHAY_APP.bat`.
