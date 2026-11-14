"""Chu nhom chay file nay (hoac bam dup CHAY_APP.bat / CHAY_APP.command):
  1. ghep 5 phan app.js trong app/src/parts/ thanh app/src/app.js
  2. so tung file go tay voi ban goc trong chia_viec/goc/ (bao dong/cot sai)
  3. dong goi app/olympus_navigator_3d.html va mo bang trinh duyet"""
import os, sys, subprocess, unicodedata, webbrowser
os.chdir(os.path.dirname(os.path.abspath(__file__)))
PARTS = ["p1_dulieu_vatly.js", "p2_3d_dia_hinh.js", "p3_3d_rover_camera.js", "p4_bando_bieudo.js", "p5_dieukhien_sukien.js"]
GOC = "chia_viec/goc"
rd = lambda p: open(p, encoding="utf-8").read()

co = [p for p in PARTS if os.path.exists(f"app/src/parts/{p}")]
CHIA = bool(co)                      # co file trong parts/ -> che do 5 phan; khong co -> 1 nguoi go nguyen app/src/app.js
if CHIA:
    if len(co) < len(PARTS): sys.exit("Thieu phan: " + ", ".join(p for p in PARTS if p not in co) + "  -> chep vao app/src/parts/")
    js = "".join((t if t.endswith("\n") else t + "\n") for t in (rd(f"app/src/parts/{p}") for p in PARTS))
    open("app/src/app.js", "w", encoding="utf-8").write(unicodedata.normalize("NFC", js))

# kiem tra: tung phan app.js + cac file go tay khac
pairs = [(f"{GOC}/{p}", f"app/src/parts/{p}") for p in PARTS] if CHIA else []
pairs += [(f"{GOC}/{g}", g.replace("__", "/")) for g in sorted(os.listdir(GOC)) if g not in PARTS and not (CHIA and g == "app__src__app.js")]
sai = 0
for goc, go in pairs:
    r = subprocess.run([sys.executable, "chia_viec/kiem_tra_go.py", goc, go], capture_output=True, text=True, encoding="utf-8")
    ok = "KHOP 100%" in r.stdout
    print(("  OK   " if ok else "  SAI  ") + go)
    if not ok: sai += 1; print(r.stdout[-3000:] + r.stderr[-500:])
if sai:
    print(f"\n{sai} file con loi go. Sua theo dong/cot o tren roi chay lai.")
    if input("Van dong goi thu? (y/N) ").strip().lower() != "y": sys.exit(1)

r = subprocess.run([sys.executable, "app/build_app.py"])
if r.returncode: sys.exit("Dong goi loi - xem thong bao o tren")
webbrowser.open("file://" + os.path.abspath("app/olympus_navigator_3d.html"))
print("Da mo app. Neu khung 3D trong/den: bam F12 > Console de xem loi.")
