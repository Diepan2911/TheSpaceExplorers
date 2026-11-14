// ================= CANH BAO SUC KHOE THEO VUNG (health.js, noi sau sci_anim.js khi dong goi) =================
// Tinh cac vung tren tuyen co the anh huong suc khoe phi hanh gia tu du lieu cua tung o (do cao -> ap suat -> buc xa,
// nhiet do dem, do doc, don vi dia chat), canh bao khi rover di vao va neu cach xu li.
// Khong sua code cu: boc them buildEvents, updateDash, drawMini; tu chen the vao tab Y te.
// Nguon: lieu buc xa tang khi ap suat (be day khi quyen) giam theo RAD tren Curiosity; gioi han ca su nghiep 600 mSv (NASA);
// bui sao Hoa ~3 µm co silica va perchlorate (cuc ki giap); "sot co kho mat trang" cua phi hanh gia Apollo 17.

const HZ_TYPE = {
  rad: { name: "Vùng bức xạ cao", col: "#b84de0", test: n => doseRate(n) / MDL.dose0 >= 1.3,
    why: "Ở độ cao lớn khí quyển mỏng, chắn được ít tia vũ trụ hơn nên liều bức xạ cao hơn ít nhất 30% so với hố Gale.",
    risk: ["Tăng nguy cơ ung thư về lâu dài", "Ảnh hưởng hệ thần kinh trung ương: giảm tập trung, phản xạ chậm", "Tích lũy lâu gây hại tim mạch, đục thủy tinh thể"],
    act: ["Đi qua nhanh, tránh dựng trại qua đêm trong vùng nếu còn lựa chọn", "Hạn chế EVA, rút ngắn mỗi ca ra ngoài", "Ngủ ở chỗ có bồn nước và bình nhiên liệu bao quanh để che chắn", "Xem liều kế mỗi giờ, so với giới hạn cả sự nghiệp 600 mSv"] },
  cold: { name: "Vùng đêm cực lạnh", col: "#3f9cff", test: n => TN[n] - 80 <= -75,
    why: "Ban đêm xuống dưới −75 °C theo mô hình nhiệt độ của app.",
    risk: ["Hạ thân nhiệt nếu sưởi bộ đồ hoặc lều trục trặc", "Tê cóng ngón tay, ngón chân khi chạm đá lạnh lâu", "Tim đập nhanh để giữ ấm, pin và thiết bị yếu đi"],
    act: ["Chỉ EVA quanh giữa trưa, xong trước khi mặt trời lặn", "Bật sưởi găng tay và ủng, tránh quỳ hoặc tì tay lên đá lâu", "Giữ đủ nhiên liệu cho sưởi đêm, kiểm tra lều trước khi ngủ", "Đo thân nhiệt trước khi ngủ; dưới 35,5 °C thì làm ấm ngay"] },
  slope: { name: "Vùng dốc, xóc mạnh", col: "#ff7a2f", test: n => SLOPE[n] >= 6,
    why: "Độ dốc từ 6° trở lên trên lưới 3,7 km; ngoài thực tế từng đoạn ngắn còn dốc hơn.",
    risk: ["Rung xóc kéo dài gây đau lưng, đau cổ, mỏi cơ", "Say xe: buồn nôn, chóng mặt", "Chấn thương nếu xe trượt hoặc lật, ngã khi đi bộ trên dốc"],
    act: ["Giảm tốc, thắt dây an toàn, cố định đồ đạc trong cabin", "Nghỉ 10 phút sau mỗi giờ lái, đổi người lái", "Không EVA trên đoạn dốc; nếu bắt buộc thì đi theo cặp, có dây nối", "Qua dốc xong: kiểm tra chấn thương và độ kín bộ đồ"] },
  dust: { name: "Vùng nhiều bụi mịn", col: "#d9a12e", test: n => GU[GEO[n]].code === "Aa" || GU[GEO[n]].code === "AHtu",
    why: "Vật liệu vụn bị gió bào mòn (vành aureole, đồng bằng trầm tích) nên nhiều bụi mịn.",
    risk: ["Hít bụi mịn cỡ 3 µm có silica: kích ứng phổi, lâu dài có thể xơ phổi", "Perchlorate trong bụi cản tuyến giáp hấp thu i-ốt", "Cay mắt, hắt hơi, rát họng như phi hành gia Apollo 17"],
    act: ["Phủi và hút bụi bộ đồ trước khi vào cabin", "Bật lọc không khí cabin, kiểm tra gioăng cửa", "Rửa mắt, đeo khẩu trang trong cabin nếu thấy bụi", "Tránh EVA quanh giữa trưa và đầu chiều, lúc nhiều lốc bụi nhất"] },
};

// ---------- tim cac vung tren hanh trinh ----------
function hzZones(M) {
  if (!M) return [];
  const p = M.path, n = p.length, cum = [0];
  for (let k = 1; k < n; k++) cum[k] = cum[k - 1] + M.segs[k - 1].len / 1000;            // km doc tuyen
  const at = k => M.nodeKf[k] >= 0 ? M.kf[M.nodeKf[k]] : null, out = [];
  for (const type in HZ_TYPE) {
    const T = HZ_TYPE[type]; let k0 = -1, gap = 0;
    const close = k1 => { if (cum[k1] - cum[k0] >= 8) {                                  // bo vung ngan hon 8 km
        const a = at(k0), b = at(k1), cells = p.slice(k0, k1 + 1), z = { type, k0, k1, km0: cum[k0], km1: cum[k1], t0: a ? a.t : Infinity, t1: b ? b.t : Infinity };
        z.val = type === "rad" ? Math.max(...cells.map(c => doseRate(c) / MDL.dose0)) : type === "cold" ? Math.min(...cells.map(c => TN[c] - 80))
          : type === "slope" ? Math.max(...cells.map(c => SLOPE[c])) : z.km1 - z.km0;
        z.dose = a && b ? b.dose - a.dose : null; z.h = a && b ? b.t - a.t : null;
        z.lvl = type === "rad" ? (z.val >= 1.4 ? "crit" : "warn") : type === "cold" ? (z.val <= -80 ? "crit" : "warn")
          : type === "slope" ? (z.val >= 10 ? "crit" : "warn") : (z.val >= 40 ? "crit" : "warn");
        out.push(z) } };
    for (let k = 0; k < n; k++) {
      if (T.test(p[k])) { if (k0 < 0) k0 = k; gap = 0 }
      else if (k0 >= 0 && ++gap > 2) { close(k - gap); k0 = -1; gap = 0 } }                // noi hai doan cach nhau <= 2 o
    if (k0 >= 0) close(n - 1 - gap);
  }
  return out.sort((a, b) => a.km0 - b.km0);
}
const hzLvlName = { warn: "Nguy cơ vừa", crit: "Nguy cơ cao" };
function hzFact(z) {                                         // so lieu tinh duoc cho tung vung
  const f = z.type === "rad" ? `liều cao gấp ${fmtN(z.val, 2)} lần hố Gale` : z.type === "cold" ? `đêm lạnh nhất ${fmtN(z.val)} °C`
    : z.type === "slope" ? `dốc nhất ${fmtN(z.val, 1)}°` : `dài ${fmtN(z.val)} km`;
  return f + (z.h !== null ? ` · ở trong vùng ${fmtN(z.h, 1)} giờ` : "") + (z.type === "rad" && z.dose !== null ? ` · nhận thêm ${fmtN(z.dose, 2)} mSv` : "");
}

// ---------- nhat ky ----------
const hzEvents0 = buildEvents;
buildEvents = function (M, label) {
  const ev = hzEvents0(M, label); M.hz = hzZones(M);
  for (const z of M.hz) { const T = HZ_TYPE[z.type]; if (!isFinite(z.t0)) continue;
    ev.push({ t: z.t0, l: z.lvl, m: `${T.name} (km ${fmtN(z.km0)}–${fmtN(z.km1)}): ${T.risk[0]}. Xử lí: ${T.act[0]}.` });
    if (isFinite(z.t1) && z.t1 > z.t0) ev.push({ t: z.t1, l: "info", m: `Đã qua: ${T.name}. ${z.type === "slope" ? "Kiểm tra chấn thương và độ kín bộ đồ." : z.type === "dust" ? "Làm sạch bộ đồ và lọc không khí cabin." : "Ghi lại liều và thân nhiệt vào sổ y tế."}` }) }
  return ev.sort((a, b) => a.t - b.t);
};

// ---------- the canh bao trong tab Y te + thong bao khi vao vung ----------
const HZ = { key: "", inside: new Set(), tm: 0 };
function hzRender(s) {
  const el = $("hzBody"), M = st.M; if (!el) return;
  const zs = (M && M.hz) || [], km = s ? s.d / 1000 : 0, here = zs.filter(z => km >= z.km0 - 1e-6 && km <= z.km1 + 1e-6), next = zs.find(z => z.km0 > km);
  const key = here.map(z => z.type + z.k0).join() + "|" + (next ? next.type + next.k0 + Math.round(next.km0 - km) : "") + "|" + zs.length;
  if (key !== HZ.key) { HZ.key = key;
    const li = a => a.map(x => `<li>${x}</li>`).join("");
    el.innerHTML = (here.length ? here.map(z => { const T = HZ_TYPE[z.type];
        return `<div class="hzz" style="--c:${T.col}"><div class="hzt"><b>${T.name}</b><span class="chip" data-s="${z.lvl}">${hzLvlName[z.lvl]}</span></div>
          <p class="hint">km ${fmtN(z.km0)}–${fmtN(z.km1)} · còn ${fmtN(z.km1 - km)} km · ${hzFact(z)}</p><p class="hint">${T.why}</p>
          <h3>Vấn đề sức khỏe</h3><ul>${li(T.risk)}</ul><h3>Cách xử lí</h3><ul>${li(T.act)}</ul></div>` }).join("")
      : `<p class="hint">Rover đang ở vùng an toàn.${next ? ` Vùng tiếp theo: <b>${HZ_TYPE[next.type].name}</b> sau ${fmtN(next.km0 - km)} km.` : ""}</p>`)
      + (zs.length ? `<h3>Các vùng trên tuyến</h3><ol class="hzl">${zs.map(z => `<li style="--c:${HZ_TYPE[z.type].col}" data-on="${here.includes(z)}" data-past="${km > z.km1}">
          <i></i><span>${HZ_TYPE[z.type].name}</span><span class="c">km ${fmtN(z.km0)}–${fmtN(z.km1)}</span></li>`).join("")}</ol>` : `<p class="hint">Tuyến hiện tại không qua vùng nguy cơ nào.</p>`);
    $("hzPill").textContent = here.length ? `${here.length} vùng nguy cơ` : "An toàn"; $("hzPill").dataset.s = here.some(z => z.lvl === "crit") ? "crit" : here.length ? "warn" : "good";
  }
  // thong bao noi khi vua vao vung trong luc dang chay
  const now = new Set(here.map(z => z.type + z.k0)), fresh = here.find(z => !HZ.inside.has(z.type + z.k0));
  if (fresh && st.playing) { const T = HZ_TYPE[fresh.type], ts = $("hzToast");
    ts.style.setProperty("--c", T.col); ts.querySelector("b").textContent = `⚠ ${T.name} · km ${fmtN(fresh.km0)}–${fmtN(fresh.km1)}`;
    ts.querySelector("span").textContent = `${T.risk[0]}. Xử lí: ${T.act[0]}.`; ts.hidden = false;
    clearTimeout(HZ.tm); HZ.tm = setTimeout(() => ts.hidden = true, 15000) }              // tu an sau 15 giay
  HZ.inside = now;
}
const hzDash0 = updateDash;
updateDash = function (s) { hzDash0(s); if (st.M) hzRender(stateAt(st.M, st.t)) };
// to mau cac vung tren ban do nho
const hzMini0 = drawMini;
drawMini = function () { hzMini0(); const M = st.M; if (!M || !M.hz || !M.hz.length) return;
  const ctx = cv.getContext("2d"), sx = cv.width / W, sy = cv.height / H, u = window.devicePixelRatio || 1;
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalAlpha = .85;
  for (const z of M.hz) { ctx.strokeStyle = HZ_TYPE[z.type].col; ctx.lineWidth = 6 * u; ctx.beginPath();
    for (let k = z.k0; k <= z.k1; k++) { const c = M.path[k], x = (c % W + .5) * sx, y = (Math.floor(c / W) + .5) * sy; k === z.k0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
    ctx.stroke() }
  ctx.restore() };

(function hzUI() {
  if (typeof document === "undefined") return;
  const css = document.createElement("style");
  css.textContent = `.hzz{border:1px solid var(--rule);border-left:4px solid var(--c);border-radius:8px;padding:8px 10px;margin-bottom:8px}
.hzt{display:flex;justify-content:space-between;align-items:center;gap:6px} .hzt b{font-size:13.5px}
.hzz ul{margin:2px 0 4px;padding-left:18px;font-size:12.5px;color:var(--ink-2)} .hzz h3{margin:6px 0 2px}
.hzl{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:12.5px}
.hzl li{display:grid;grid-template-columns:12px 1fr auto;gap:8px;align-items:center} .hzl i{width:12px;height:12px;border-radius:3px;background:var(--c)}
.hzl li[data-past="true"]{opacity:.5} .hzl li[data-on="true"]{font-weight:600} .hzl .c{font:11.5px var(--f-mono);color:var(--ink-3)}
.hztoast{position:fixed;z-index:60;left:50%;top:calc(var(--tb,64px) + 12px);transform:translateX(-50%);width:min(520px,calc(100vw - 24px));display:grid;gap:3px;
  padding:10px 14px;border-radius:10px;background:var(--panel);color:var(--ink);border:1px solid var(--rule);border-left:6px solid var(--c);box-shadow:0 10px 28px rgba(0,0,0,.35);font-size:13px}
.hztoast b{font-size:14px} .hztoast button{justify-self:start;margin-top:4px}`;
  document.head.appendChild(css);
  const sec = document.createElement("section"); sec.className = "card"; sec.id = "hzCard";
  sec.innerHTML = `<div class="cardh"><h2>Cảnh báo sức khỏe theo vùng</h2><span class="pill" id="hzPill" data-s="good">An toàn</span></div><div id="hzBody"></div>`;
  const pane = document.querySelector('[data-pane="med"]'); pane.insertBefore(sec, pane.firstChild);
  const ts = document.createElement("div"); ts.className = "hztoast"; ts.id = "hzToast"; ts.hidden = true; ts.setAttribute("role", "alert");
  ts.innerHTML = `<b></b><span></span><button class="btn" id="hzMore">Xem cách xử lí</button>`; document.body.appendChild(ts);
  $("hzMore").onclick = () => { ts.hidden = true; document.dispatchEvent(new Event("open-med")); sec.scrollIntoView({ block: "start", behavior: "smooth" }) };
  if (st.M) rebuildMission(true);            // hanh trinh dau tien da dung truoc khi file nay nap: dung lai de co canh bao vung
})();
