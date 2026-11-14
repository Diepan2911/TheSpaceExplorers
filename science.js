// ================= KHOA HOC & MARSWALK (science.js, noi vao cuoi app.js khi dong goi) =================
// Them tab "Khoa hoc": (1) cac diem dung khoa hoc tu dong dat doc tuyen toi uu theo don vi dia chat USGS,
// (2) lap ke hoach Marswalk (EVA di bo) quanh moi diem dung: vung toi duoc trong mot ca EVA, diem lo da,
//     tuyen di/ve rover. Khong sua code cu: tu chen giao dien, boc them drawMini, tu theo doi tuyen thay doi.

// ---------- muc tieu khoa hoc theo don vi dia chat ----------
const SCI_UNIT = {
  Aa:   { t: "Vành aureole: nguồn gốc các thùy gờ–rãnh khổng lồ", q: "Aureole hình thành do sạt lở khổng lồ từ sườn núi, do khối sườn núi trượt dần ra ngoài, hay có băng tham gia?", m: "Chụp cấu trúc gờ–rãnh, đo hướng gờ, lấy mẫu vụn đá để xem nguồn gốc (dung nham sườn núi hay vật liệu khác).", tool: "Camera đa phổ · radar xuyên đất · búa địa chất" },
  lAa:  { t: "Vạt chân núi trẻ: vật liệu sạt từ sườn", q: "Vật liệu vạt chân núi trẻ có cùng nguồn với aureole không, và hoạt động gần đây đến mức nào?", m: "So sánh thành phần và độ phong hóa với mẫu ở vành aureole.", tool: "Phổ kế tia X cầm tay · camera đa phổ" },
  Ave:  { t: "Sườn khiên Olympus Mons: lịch sử dòng dung nham", q: "Các dòng dung nham thùy trên sườn núi phun trào trong bao lâu và thay đổi thành phần ra sao?", m: "Lấy mẫu bazan ở nhiều độ cao, đo độ dày dòng chảy, tìm ống dung nham.", tool: "Khoan lõi ngắn · phổ kế tia X · từ kế" },
  lAv:  { t: "Dung nham trẻ: mốc định tuổi", q: "Tuổi tuyệt đối của dung nham Amazon muộn là bao nhiêu (để hiệu chỉnh cách định tuổi bằng mật độ hố va chạm)?", m: "Lấy mẫu bazan tươi, ít phong hóa, mang về Trái Đất định tuổi phóng xạ.", tool: "Bộ lấy mẫu mang về · camera đa phổ" },
  lAvf: { t: "Cánh đồng núi lửa nhỏ: miệng phun phụ", q: "Các miệng phun nhỏ có cùng nguồn magma với Olympus Mons không?", m: "Lấy mẫu quanh miệng phun, đo hình dạng nón.", tool: "Phổ kế tia X · camera" },
  AHtu: { t: "Đồng bằng chuyển tiếp: trầm tích và gió", q: "Bề mặt đồng bằng do trầm tích, tro núi lửa hay dung nham bị phủ?", m: "Đào rãnh nông, quan sát phân lớp, tìm dấu vết gió (yardang).", tool: "Xẻng · camera hiển vi · radar xuyên đất" },
  AHv:  { t: "Đồng bằng dung nham Tharsis", q: "Dòng dung nham đồng bằng đến từ Olympus Mons hay từ các núi lửa Tharsis khác?", m: "So thành phần với mẫu sườn Olympus Mons.", tool: "Phổ kế tia X" },
  Hv:   { t: "Dung nham cổ (Hesperia)", q: "Dung nham cổ ghi lại môi trường Sao Hỏa sớm hơn thế nào (phong hóa, nước)?", m: "Tìm khoáng biến đổi do nước trên bề mặt đá cổ.", tool: "Phổ kế hồng ngoại · camera hiển vi" },
};
const SCI_SCARP = { t: "Vách chân núi: mặt cắt địa tầng lộ ra", q: "Vách dốc bao quanh Olympus Mons lộ các lớp dung nham nào, và vì sao núi có vách dốc đứng như vậy?", m: "Chụp và đo mặt cắt từ chân vách, lấy mẫu từng lớp có thể tiếp cận an toàn.", tool: "Camera tele · máy đo khoảng cách laser · búa địa chất" };
const SCI_TOP = { t: "Hõm chảo đỉnh: các đợt sụt của buồng magma", q: "Các hõm sụt lồng nhau trên đỉnh ghi lại bao nhiêu đợt rút magma, cách nhau bao lâu?", m: "Quan sát thành hõm chảo từ mép, đo độ cao từng bậc sụt, lấy mẫu dung nham đỉnh.", tool: "Camera tele · khoan lõi ngắn · máy đo trọng lực" };

// ---------- chon diem dung doc tuyen toi uu ----------
function sciStops(path, mO) {
  if (!path || !mO) return [];
  const out = [], segs = geoSegments(path, mO.dist), used = new Set();
  // 1 diem moi don vi dia chat (doan dai nhat, it nhat 10 km), dat o giua doan
  segs.slice().sort((a, b) => (b.b - b.a) - (a.b - a.a)).forEach(g => {
    const code = GU[g.u].code; if (used.has(code) || g.b - g.a < 10 || !SCI_UNIT[code]) return; used.add(code);
    const k = Math.round((g.k0 + g.k1) / 2); out.push({ k, n: path[k], km: mO.dist[k] / 1000, sci: SCI_UNIT[code], unit: code });
  });
  // vach chan nui: o doc nhat tren tuyen (neu du doc)
  let ks = 0; for (let k = 1; k < path.length; k++) if (SLOPE[path[k]] > SLOPE[path[ks]]) ks = k;
  if (SLOPE[path[ks]] > 4 && !out.some(s => Math.abs(s.km - mO.dist[ks] / 1000) < 15))
    out.push({ k: ks, n: path[ks], km: mO.dist[ks] / 1000, sci: SCI_SCARP, unit: GU[GEO[path[ks]]].code });
  // dinh / dich B
  const kb = path.length - 1; out.push({ k: kb, n: path[kb], km: mO.dist[kb] / 1000, sci: SCI_TOP, unit: GU[GEO[path[kb]]].code });
  return out.sort((a, b) => a.km - b.km).slice(0, 6);
}

// ---------- Marswalk: luoi cuc bo noi suy tu MOLA ----------
// Toc do di bo: ham Tobler (1993) v = 6·e^(−3,5·|tanθ + 0,05|) km/h, nhan he so 0,5 cho bo do EVA (gia dinh nhom).
const MW = { f: 8, R: 15, suit: 0.5 };
function zBil(y, x) {       // y, x: toa do o (tam o k nam tai k)
  y = Math.min(H - 1, Math.max(0, y)); x = Math.min(W - 1, Math.max(0, x));
  const i = Math.min(H - 2, Math.floor(y)), j = Math.min(W - 2, Math.floor(x)), v = y - i, u = x - j, a = i * W + j;
  return (Z[a] * (1 - u) + Z[a + 1] * u) * (1 - v) + (Z[a + W] * (1 - u) + Z[a + W + 1] * u) * v;
}
function marswalk(n0, p) {
  const i0 = Math.floor(n0 / W), j0 = n0 % W, f = MW.f, ddy = DY / f, ddx = DX[i0] / f;
  const h = Math.ceil(MW.R * 1000 / ddy), S = 2 * h + 1, M = S * S;
  const z = new Float32Array(M), sl = new Float32Array(M);
  for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) z[a * S + b] = zBil(i0 + (a - h) / f, j0 + (b - h) / f);
  for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) {
    const zz = (r, c) => z[Math.min(S - 1, Math.max(0, r)) * S + Math.min(S - 1, Math.max(0, c))];
    const gx = (zz(a, b + 1) - zz(a, b - 1)) / (2 * ddx), gy = (zz(a + 1, b) - zz(a - 1, b)) / (2 * ddy);
    sl[a * S + b] = Math.atan(Math.hypot(gx, gy)) * 180 / Math.PI }
  const vel = g => 6 * Math.exp(-3.5 * Math.abs(g + 0.05)) * MW.suit;          // km/h, g = dz/d (doc co huong)
  const NB8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  // Dijkstra thoi gian (gio); back = true: thoi gian tu o ve rover (dao chieu canh)
  function dijk(back) {
    const t = new Float64Array(M).fill(Infinity), par = new Int32Array(M).fill(-1), done = new Uint8Array(M), c0 = h * S + h;
    const hq = [], hk = []; const push = (k, v) => { hq.push(v); hk.push(k); let c = hq.length - 1;
      while (c > 0) { const q = (c - 1) >> 1; if (hk[q] <= hk[c]) break; [hk[q], hk[c]] = [hk[c], hk[q]]; [hq[q], hq[c]] = [hq[c], hq[q]]; c = q } };
    const pop = () => { const top = hq[0], lk = hk.pop(), lv = hq.pop(); if (hq.length) { hq[0] = lv; hk[0] = lk; let c = 0;
      for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < hq.length && hk[l] < hk[m]) m = l; if (r < hq.length && hk[r] < hk[m]) m = r;
        if (m === c) break; [hk[m], hk[c]] = [hk[c], hk[m]]; [hq[m], hq[c]] = [hq[c], hq[m]]; c = m } } return top };
    t[c0] = 0; push(0, c0);
    while (hq.length) { const u = pop(); if (done[u]) continue; done[u] = 1; const a = Math.floor(u / S), b = u % S;
      for (const [da, db] of NB8) { const a2 = a + da, b2 = b + db; if (a2 < 0 || b2 < 0 || a2 >= S || b2 >= S) continue;
        const v = a2 * S + b2; if (done[v] || sl[v] > p.smax) continue;
        const d = Math.hypot(da * ddy, db * ddx), dz = back ? z[u] - z[v] : z[v] - z[u];
        const nt = t[u] + d / 1000 / vel(dz / d); if (nt < t[v]) { t[v] = nt; par[v] = u; push(nt, v) } } }
    return { t, par };
  }
  const go = dijk(false), bk = dijk(true), budget = p.eva * (1 - p.reserve) - p.work;
  const ok = new Uint8Array(M); let best = -1, area = 0;
  // diem lo da: uu tien o doc (da goc de lo), cong them chut theo khoang cach de khong chon sat rover
  const sc = c => sl[c] + 0.3 * Math.hypot((Math.floor(c / S) - h) * ddy, (c % S - h) * ddx) / 1000;
  for (let c = 0; c < M; c++) if (go.t[c] + bk.t[c] <= budget) { ok[c] = 1; area++; if (best < 0 || sc(c) > sc(best)) best = c }
  const trace = (par, c) => { const r = []; while (c >= 0) { r.push(c); c = par[c] } return r };
  const out = best >= 0 ? trace(go.par, best).reverse() : [], back = best >= 0 ? trace(bk.par, best) : [];
  const len = pts => { let L = 0; for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], b = pts[k];
    L += Math.hypot((Math.floor(a / S) - Math.floor(b / S)) * ddy, (a % S - b % S) * ddx) } return L / 1000 };
  return { S, h, f, ddx, ddy, z, sl, ok, area: area * ddx * ddy / 1e6, best, out, back, tOut: best >= 0 ? go.t[best] : 0, tBack: best >= 0 ? bk.t[best] : 0,
    kmOut: len(out), kmBack: len(back), budget, i0, j0,
    dist: best >= 0 ? Math.hypot((Math.floor(best / S) - h) * ddy, (best % S - h) * ddx) / 1000 : 0 };
}

// ---------- giao dien ----------
(function sciUI() {
  if (typeof document === "undefined") return;
  const sciCss = document.createElement("style");
  sciCss.textContent = `.stops{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.stops button{width:100%;text-align:left;display:grid;grid-template-columns:26px 1fr;gap:4px 8px;background:transparent;border:1px solid var(--rule);border-radius:7px;padding:8px 9px;cursor:pointer;color:var(--ink);font:13px var(--f-body)}
.stops button:hover{border-color:var(--accent)} .stops button[aria-current="true"]{border-color:var(--accent);box-shadow:inset 3px 0 0 var(--accent)}
.stops .n{font:700 15px var(--f-display);grid-row:span 2} .stops .t{font-weight:600} .stops .c{font:11.5px var(--f-mono);color:var(--ink-3)}
.sdet p{margin:6px 0 0;font-size:12.5px;color:var(--ink-2)} .sdet b{color:var(--ink)}
#mwMap{width:100%;aspect-ratio:1;display:block;border-radius:8px;background:#222;margin-top:6px}
.mwleg{display:flex;flex-wrap:wrap;gap:3px 12px;font-size:11.5px;color:var(--ink-2);margin-top:6px}
.mwleg i{display:inline-block;width:14px;height:0;border-top:2.5px solid;margin-right:5px;vertical-align:3px}`;
  document.head.appendChild(sciCss);
  const tab = document.createElement("button"); tab.setAttribute("role", "tab"); tab.dataset.t = "sci"; tab.setAttribute("aria-selected", "false"); tab.textContent = "Khoa học";
  $("ltabs").appendChild(tab);
  const pane = document.createElement("div"); pane.className = "pane"; pane.setAttribute("role", "tabpanel"); pane.dataset.pane = "sci"; pane.dataset.of = "ltabs"; pane.hidden = true;
  pane.innerHTML = `
  <section class="card"><h2>Mục tiêu khoa học</h2>
    <p class="hint" style="margin:0 0 8px">Điểm dừng được đặt tự động dọc tuyến tối ưu: mỗi đơn vị địa chất USGS mà tuyến đi qua một điểm, thêm vách dốc nhất và đích B. Nhấn để xem mục tiêu và lập kế hoạch Marswalk.</p>
    <ol class="stops" id="sciStops"></ol><div class="sdet" id="sciDet"></div></section>
  <section class="card"><div class="cardh"><h2>Marswalk</h2><span class="pill" id="mwPill">–</span></div>
    <div class="ctl">
      <label for="mwT">Thời gian một ca EVA <output id="mwT_o"></output><input type="range" id="mwT" min="3" max="8" step="0.5" value="6"></label>
      <label for="mwW">Thời gian làm việc tại điểm <output id="mwW_o"></output><input type="range" id="mwW" min="0.5" max="3" step="0.25" value="1.5"></label>
      <label for="mwS">Dốc tối đa khi đi bộ <output id="mwS_o"></output><input type="range" id="mwS" min="8" max="30" step="1" value="20"></label>
    </div>
    <canvas id="mwMap" aria-label="Bản đồ Marswalk quanh điểm dừng"></canvas>
    <div class="mwleg"><span><i style="border-color:#ffffff"></i>Rover (điểm dừng)</span><span><i style="border-color:#2f86e8"></i>Đi</span><span><i style="border-color:#e8642a;border-top-style:dashed"></i>Về</span><span><i style="border-color:#3fcf3f"></i>Biên vùng tới được</span></div>
    <dl class="kv" id="mwKv"></dl>
    <p class="hint">Hai phi hành gia đi cùng nhau, rover đỗ tại điểm dừng. Vùng tới được: đi + làm việc + về ≤ thời gian EVA trừ 20% dự trữ. Điểm lộ đá = ô dốc nhất trong vùng (nơi đá gốc dễ lộ), ưu tiên thêm điểm xa rover. Tốc độ đi bộ theo hàm Tobler, giảm một nửa vì bộ đồ EVA (giả định).</p>
    <p class="hint"><b>Giới hạn:</b> lưới cục bộ ~460 m/ô được nội suy từ MOLA 3,7 km, nên không thấy được tảng đá. Khi có DEM CTX (~20 m) hoặc HiRISE (~1 m) từ Mars Trek cho điểm dừng, thay vào hàm <code>zBil</code> để có bản đồ chướng ngại thật.</p>
  </section>`;
  $("ltabs").parentElement.appendChild(pane);
  bindTabs("ltabs");
  tab.addEventListener("click", () => setTimeout(sciDraw, 0));

  let stops = [], cur = 0, lastPath = null, mw = null;
  const P = () => ({ eva: +$("mwT").value, work: +$("mwW").value, smax: +$("mwS").value, reserve: 0.2 });
  [["mwT", v => fmtN(v, 1) + " giờ"], ["mwW", v => fmtN(v, 2) + " giờ"], ["mwS", v => v + "°"]].forEach(([id, f]) => {
    const o = $(id + "_o"), u = () => o.textContent = f(+$(id).value); u(); $(id).addEventListener("input", u); $(id).addEventListener("change", () => { runMW(); sciDraw() }) });

  function renderStops() {
    $("sciStops").innerHTML = stops.length ? stops.map((s, q) => { const i = Math.floor(s.n / W), j = s.n % W;
      return `<li><button data-q="${q}" aria-current="${q === cur}"><span class="n">${q + 1}</span><span class="t">${s.sci.t}</span>
        <span class="c">km ${fmtN(s.km)} · ${s.unit} · cao ${fmtN(Z[s.n] / 1000, 1)} km · dốc ${fmtN(SLOPE[s.n], 1)}° · ${LAT[i].toFixed(2)}°N ${LON[j].toFixed(2)}°E</span></button></li>` }).join("")
      : `<li class="hint">Chưa có tuyến tối ưu.</li>`;
    $("sciStops").querySelectorAll("button").forEach(b => b.onclick = () => { cur = +b.dataset.q; renderStops(); runMW(); sciDraw(); V3D.focusCell(stops[cur].n); drawMini() });
    const s = stops[cur];
    $("sciDet").innerHTML = s ? `<p><b>Câu hỏi khoa học:</b> ${s.sci.q}</p><p><b>Việc cần làm:</b> ${s.sci.m}</p><p><b>Dụng cụ:</b> ${s.sci.tool}</p>
      <p><b>Môi trường tại điểm:</b> nhiệt độ giữa trưa ${fmtN(TN[s.n], 1)} °C (mô hình) · áp suất ${fmtN(PRES[s.n])} Pa · liều bức xạ ${fmtN(doseRate(s.n) * 24, 2)} mSv/ngày</p>` : "";
  }
  function runMW() { mw = stops[cur] ? marswalk(stops[cur].n, P()) : null; renderMW() }
  function renderMW() {
    const pill = $("mwPill"), kv = $("mwKv");
    if (!mw) { pill.textContent = "–"; kv.innerHTML = ""; return }
    if (mw.best < 0) { pill.dataset.s = "crit"; pill.textContent = "Không đi được"; kv.innerHTML = `<dt>Kết quả</dt><dd>Quanh rover toàn dốc hơn ${P().smax}° hoặc không đủ thời gian. Tăng dốc tối đa hoặc thời gian EVA.</dd>`; return }
    const tot = mw.tOut + mw.tBack + P().work, res = P().eva - tot;
    pill.dataset.s = res >= P().eva * 0.2 - 1e-6 ? "good" : "warn"; pill.textContent = `Dự trữ ${fmtN(res, 1)} giờ`;
    kv.innerHTML = `<dt>Điểm lộ đá dự kiến</dt><dd>cách rover ${fmtN(mw.dist, 1)} km · dốc ${fmtN(mw.sl[mw.best], 1)}°</dd>
      <dt>Đi</dt><dd>${fmtN(mw.kmOut, 1)} km · ${fmtN(mw.tOut, 2)} giờ</dd>
      <dt>Làm việc</dt><dd>${fmtN(P().work, 2)} giờ</dd>
      <dt>Về rover</dt><dd>${fmtN(mw.kmBack, 1)} km · ${fmtN(mw.tBack, 2)} giờ</dd>
      <dt>Diện tích tới được trong một ca</dt><dd>${fmtN(mw.area)} km²</dd>
      <dt>Oxy bộ đồ (2 người, ~0,04 kg/giờ/người khi đi bộ)</dt><dd>${fmtN(2 * 0.04 * tot, 2)} kg cho ca này</dd>`;
  }
  window.sciDraw = function sciDraw() {
    const c = $("mwMap"); if (!c || !mw || !c.clientWidth) return;
    const dpr = window.devicePixelRatio || 1, px = Math.round(c.clientWidth * dpr); c.width = c.height = px;
    const S = mw.S, ctx = c.getContext("2d"), img = ctx.createImageData(S, S), d = img.data;
    let zmin = Infinity, zmax = -Infinity; for (const v of mw.z) { zmin = Math.min(zmin, v); zmax = Math.max(zmax, v) }
    for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) { const k = a * S + b;
      const gx = (mw.z[a * S + Math.min(S - 1, b + 1)] - mw.z[a * S + Math.max(0, b - 1)]), gy = (mw.z[Math.min(S - 1, a + 1) * S + b] - mw.z[Math.max(0, a - 1) * S + b]);
      const hs = Math.max(0, Math.min(1, .62 + (-gx + gy) / (4 * mw.ddy)));
      const t = (mw.z[k] - zmin) / Math.max(1, zmax - zmin), sl = Math.min(1, mw.sl[k] / 30), ok = mw.ok[k];
      let r = 150 + 60 * t, g = 110 + 40 * t, bl = 90 + 30 * t; r = r * (1 - .35 * sl) + 120 * .35 * sl; g *= 1 - .45 * sl; bl *= 1 - .5 * sl;
      const f = (ok ? 1 : .45) * (.55 + .6 * hs); d[4 * k] = r * f; d[4 * k + 1] = g * f; d[4 * k + 2] = bl * f; d[4 * k + 3] = 255 }
    const off = document.createElement("canvas"); off.width = off.height = S; off.getContext("2d").putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, px, px);
    const sc = px / S, X = k => ((k % S) + .5) * sc, Y = k => (Math.floor(k / S) + .5) * sc;
    ctx.fillStyle = "#3fcf3f"; for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) { const k = a * S + b; if (!mw.ok[k]) continue;
      if (a === 0 || b === 0 || a === S - 1 || b === S - 1 || !mw.ok[k - 1] || !mw.ok[k + 1] || !mw.ok[k - S] || !mw.ok[k + S]) ctx.fillRect(b * sc, a * sc, sc, sc) }
    const line = (pts, col, dash) => { if (pts.length < 2) return; ctx.setLineDash(dash ? [6 * dpr, 4 * dpr] : []); ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 4.5 * dpr; ctx.beginPath(); pts.forEach((k, q) => q ? ctx.lineTo(X(k), Y(k)) : ctx.moveTo(X(k), Y(k))); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 2.5 * dpr; ctx.beginPath(); pts.forEach((k, q) => q ? ctx.lineTo(X(k), Y(k)) : ctx.moveTo(X(k), Y(k))); ctx.stroke(); ctx.setLineDash([]) };
    line(mw.out, "#2f86e8"); line(mw.back, "#e8642a", true);
    const c0 = mw.h * S + mw.h; ctx.fillStyle = "#fff"; ctx.strokeStyle = "#15191d"; ctx.lineWidth = 2 * dpr;
    ctx.beginPath(); ctx.arc(X(c0), Y(c0), 6 * dpr, 0, 7); ctx.fill(); ctx.stroke();
    if (mw.best >= 0) { ctx.save(); ctx.translate(X(mw.best), Y(mw.best)); ctx.rotate(Math.PI / 4); ctx.fillStyle = "#ffde00"; ctx.fillRect(-5 * dpr, -5 * dpr, 10 * dpr, 10 * dpr); ctx.strokeRect(-5 * dpr, -5 * dpr, 10 * dpr, 10 * dpr); ctx.restore() }
    const km5 = 5000 / mw.ddx * sc; ctx.fillStyle = "rgba(22,15,11,.75)"; ctx.fillRect(8 * dpr, px - 30 * dpr, km5 + 16 * dpr, 22 * dpr);
    ctx.fillStyle = "#fff"; ctx.fillRect(16 * dpr, px - 15 * dpr, km5, 3 * dpr); ctx.font = `600 ${11 * dpr}px ${css("--f-body") || "sans-serif"}`; ctx.fillText("5 km", 16 * dpr, px - 18 * dpr);
    ctx.fillStyle = "rgba(22,15,11,.75)"; ctx.fillRect(px - 34 * dpr, 8 * dpr, 26 * dpr, 20 * dpr); ctx.fillStyle = "#fff"; ctx.fillText("↑B", px - 30 * dpr, 22 * dpr);
  };
  // diem dung tren ban do nho
  const drawMini0 = drawMini;
  drawMini = function () { drawMini0();
    if (!stops.length) return; const ctx = cv.getContext("2d"), sx = cv.width / W, sy = cv.height / H, u = window.devicePixelRatio || 1;
    ctx.font = `700 ${9 * u}px ${css("--f-body")}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    stops.forEach((s, q) => { const x = (s.n % W + .5) * sx, y = (Math.floor(s.n / W) + .5) * sy;
      ctx.fillStyle = q === cur ? "#ffde00" : "#ffffff"; ctx.strokeStyle = "#15191d"; ctx.lineWidth = 1.2 * u;
      ctx.beginPath(); ctx.arc(x, y, 5.5 * u, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#15191d"; ctx.fillText(q + 1, x, y + .5 * u) });
    ctx.textAlign = "start"; ctx.textBaseline = "alphabetic" };
  // theo doi tuyen toi uu thay doi (khong can sua recompute)
  (function watch() {
    const p = st.res.optimal?.path || null;
    if (p !== lastPath) { lastPath = p; stops = sciStops(p, st.res.mO); cur = Math.min(cur, Math.max(0, stops.length - 1)); renderStops(); runMW(); sciDraw(); drawMini() }
    setTimeout(watch, 400) })();
  new ResizeObserver(() => sciDraw()).observe($("mwMap"));
})();
