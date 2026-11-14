# Mars Site Navigator – Olympus Mons (NASA Space Apps 2026)

Toàn bộ mã nguồn dùng để tạo app **Olympus Mons Navigator 3D**. Chạy đủ các bước bên dưới sẽ ra
`app/olympus_navigator_3d.html` **giống từng byte** với bản đang chạy trên link artifact.

## Cấu trúc

```
pipeline.py            Xử lý MOLA: cắt vùng, độ dốc (Horn 3x3), độ nhám, áp suất, nhiệt độ giữa trưa (mô hình bức xạ),
                       chấm điểm vùng hạ cánh, A* tuyến ngắn nhất / tối ưu  -> out16/
download_data.py       Tải MOLA MEGDR (NASA PDS), HRSC-MOLA blend (USGS), TES (tùy chọn)
plot_olympus.py        Vẽ bản đồ tổng hợp PNG
api.py                 API FastAPI (tùy chọn) khi lưới quá lớn để chạy A* trong trình duyệt
export_3d.py, blender_scene.py, blender_pano.py   Xuất mô hình 3D / cảnh Blender
web/                   App 2D bản đầu (build_web.py + template.html)

geo/rasterize_geo.py   B1 địa chất: raster hóa bản đồ USGS SIM 3292 lên lưới 16 px/độ
geo/build_geo_data.py  B2 địa chất: gộp 8 đơn vị, hệ số khó đi từ độ nhám MOLA, cấu trúc, nhãn -> geo/geo_embed.json

trek/register.py       Đăng ký ảnh chụp màn hình NASA Mars Trek vào lưới MOLA và cắt đúng vùng
                       -> trek/georef.json, trek/viking_olympus_32ppd.jpg

app/src/index.template.html   Khung giao diện app 3D
app/src/style.css             Giao diện
app/src/app.js                Toàn bộ logic app (≈1 500 dòng, xem mục "Đọc app.js")
app/src/science.js            Tab Khoa học: điểm dừng khoa học dọc tuyến + lập kế hoạch Marswalk (EVA đi bộ)
app/src/sci_anim.js           Hoạt ảnh phi hành gia làm nhiệm vụ tại điểm khoa học (đào đất, khoan, đo phổ...)
app/src/health.js             Cảnh báo sức khỏe theo vùng địa hình (bức xạ, lạnh, dốc, bụi) và cách xử lí
app/src/logo.js               Logo Bách Khoa TP.HCM kế bên lá cờ trên thân rover (ảnh app/logo_bk.png)
app/src/ui.js                 Giao diện gọn: 3D toàn màn hình, thanh trạng thái trên cùng, bảng thu ra thu vào, nút Bắt đầu
app/src/i18n.js               Nút chuyển ngôn ngữ VI/EN (từ điển cụm từ, tự dịch nội dung trên trang)
app/build_app.py              Đóng gói src + dữ liệu -> 1 file HTML tự chứa
app/olympus_navigator_3d.html Bản đã đóng gói (mở trực tiếp bằng trình duyệt)

tools/update_app_data.py      Chỉ thay dữ liệu địa chất / ảnh nền trong file HTML có sẵn
out16/                        Kết quả pipeline đã chạy sẵn (lưới 352x448, ~3,7 km/ô)
```

## Chạy lại từ đầu

```bash
pip install -r requirements.txt pyshp shapely pillow

# 1. Địa hình MOLA (NASA PDS, 66 MB) -> out16/
python download_data.py megdr16
python pipeline.py --source megdr16 --file data/megt90n000eb.img --out out16

# 2. Địa chất USGS SIM 3292: tải "Database ZIP" ở https://pubs.usgs.gov/sim/3292, giải nén
python geo/rasterize_geo.py  --shp <đường dẫn>/SIM3292_Shapefiles --out geo
python geo/build_geo_data.py --shp <đường dẫn>/SIM3292_Shapefiles --layers out16/layers.npz --geo geo

# 3. Ảnh nền Mars Trek (ảnh chụp màn hình vùng Olympus Mons, chế độ bản đồ phẳng)
python trek/register.py --img trek/viking_screenshot.png --dem data/megt90n000eb.img --out trek

# 4. Đóng gói app
python app/build_app.py --out16 out16 --geo geo/geo_embed.json \
       --img trek/viking_olympus_32ppd.jpg --georef trek/georef.json --dst app/olympus_navigator_3d.html
```

Bước 2 và 3 đã có kết quả sẵn trong `geo/` và `trek/`, nên muốn sửa giao diện/logic chỉ cần sửa `app/src/` rồi chạy bước 4.
Nếu tải GeoTIFF từ tab Downloads của Mars Trek (ảnh có sẵn tọa độ) thì bỏ bước 3, chỉ cần cắt ảnh theo vùng 8–30°N, 212–240°E.

## Đọc app.js (theo thứ tự trong file)

| Phần | Nội dung |
|---|---|
| giải mã dữ liệu | đọc lưới độ cao MOLA (int16) + điểm hạ cánh từ base64 |
| địa chất USGS | giải RLE thành đơn vị mỗi ô, hệ số khó đi `GF`, vẽ cấu trúc/nhãn, `geoSegments` (đoạn tuyến theo đơn vị) |
| độ dốc + hướng | Horn 3×3 (giống pipeline.py), áp suất p = 610·e^(−z/11,1 km) |
| nhiệt độ giữa trưa | cân bằng bức xạ theo mùa Ls, hiệu chỉnh theo số đo MEDA ở Jezero |
| `astar` | A* 8 hướng; chi phí tối ưu = quãng 3D × (1 + w_dốc·(s/s_max)²) × (1 + w_lạnh·lạnh) × (1 + w_địa chất·hệ số) + w_leo·độ cao leo |
| mô hình hành trình | tốc độ theo dốc, năng lượng lăn bánh/leo dốc, oxy, nhiên liệu, bức xạ (RAD Curiosity), điểm không thể quay về |
| `V3D` | khung 3D three.js: địa hình, bầu trời ngày/đêm, tuyến, rover + phi hành gia, nhãn, camera |
| bản đồ nhỏ, chú giải, bảng kết quả, mặt cắt, ngân sách, địa chất dọc tuyến | giao diện 2D |

## Tab Khoa học (science.js)

- **Điểm dừng khoa học**: đặt tự động dọc tuyến tối ưu, mỗi đơn vị địa chất USGS một điểm + vách dốc nhất + đích B;
  mỗi điểm có câu hỏi khoa học, việc cần làm, dụng cụ, môi trường (nhiệt độ, áp suất, bức xạ).
- **Marswalk**: lưới cục bộ ±15 km, ~460 m/ô (nội suy từ MOLA), tốc độ đi bộ theo hàm Tobler × 0,5 (bộ đồ EVA, giả định),
  Dijkstra thời gian đi và về rover; vùng tới được = đi + làm việc + về ≤ thời gian EVA − 20% dự trữ; điểm lộ đá = ô dốc nhất.
  Thay `zBil` bằng DEM CTX/HiRISE để thấy chướng ngại thật.

## Nguồn dữ liệu

- NASA MGS MOLA MEGDR 16 px/độ (NASA PDS Geosciences Node) – độ cao.
- Tanaka K.L. và cộng sự (2014), *Geologic map of Mars*, USGS SIM 3292, doi:10.3133/sim3292 – địa chất (phạm vi công cộng).
- NASA JPL Mars Trek – ảnh nền vùng Olympus Mons (ảnh ghép màu Viking) và tọa độ tâm Olympus Mons theo danh mục tên gọi USGS.
- Thư viện 3D: three.js r128 (tải từ cdnjs khi mở app).
