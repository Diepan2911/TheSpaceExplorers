"""So file go tay voi file goc, chi ra tung dong sai va ky tu sai (ke ca dau tieng Viet khac ma Unicode).
   python kiem_tra_go.py goc/app.js go_tay/app.js"""
import sys, unicodedata, difflib
goc, go = (open(p, encoding="utf-8").read().splitlines() for p in sys.argv[1:3])
loi = 0
for tag, a1, a2, b1, b2 in difflib.SequenceMatcher(None, goc, go, autojunk=False).get_opcodes():
    if tag == "equal": continue
    for k in range(max(a2 - a1, b2 - b1)):
        x = goc[a1 + k] if a1 + k < a2 else "<thieu dong>"
        y = go[b1 + k] if b1 + k < b2 else "<thua dong>"
        if unicodedata.normalize("NFC", y) == unicodedata.normalize("NFC", x) and x != y: y += "   <- giong chu nhung khac ma Unicode (bo go dang NFD)"
        col = next((i for i, (c, d) in enumerate(zip(x, y)) if c != d), min(len(x), len(y)))
        print(f"dong goc {a1 + k + 1} / dong go {b1 + k + 1}, cot {col + 1}:\n  goc: {x}\n  go : {y}\n       {' ' * col}^")
        loi += 1
        if loi >= 30: sys.exit("... dung o 30 loi dau, sua roi chay lai")
print("KHOP 100%" if loi == 0 else f"{loi} dong khac")
