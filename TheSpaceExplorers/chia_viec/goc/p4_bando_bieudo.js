// ---------- trang thai ----------
const sites = META.sites;
const cell = (lat, lon) => { const i = Math.round((META.lat_n - lat) * PPD - .5), j = Math.round((lon - META.lon_w) * PPD - .5);
  return Math.min(H - 1, Math.max(0, i)) * W + Math.min(W - 1, Math.max(0, j)) };
RAMPS.surf = { f: rampFn([[0, "#5c3121"], [.12, "#7b4229"], [.3, "#985534"], [.55, "#ad693f"], [.8, "#c18559"], [1, "#d1a072"]]), lo: -4, hi: 21, unit: "Màu bề mặt mô phỏng theo độ cao (km)" };
const st = { layer: "img", pick: "", A: cell(META.A.lat, META.A.lon), B: cell(META.B.lat, META.B.lon),
  res: {}, profHover: -1, t: 0, playing: false, speed: 2, mode: "fwd", who: 0, M: null, Mf: null, ev: [], tSOS: null, retPath: null, sosMsg: null, hr: 70 };
const $ = id => document.getElementById(id);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------- ban do nho ----------
const off = document.createElement("canvas"); off.width = W; off.height = H;
const hatch = document.createElement("canvas"); hatch.width = W; hatch.height = H;
let baseVer = 0;
function paintRaster() {
  const ctx = off.getContext("2d"), img = ctx.createImageData(W, H), d = img.data, r = RAMPS[st.layer];
  for (let n = 0; n < N; n++) {
    let v, rgb, sh = HS[n];
    if (st.layer === "surf") { v = (Z[n] / 1000 - r.lo) / (r.hi - r.lo); const k = (.5 + .75 * sh) * (1 - .22 * Math.min(1, SLOPE[n] / 12)); rgb = r.f(v).map(x => x * k) }
    else if (st.layer === "elev") { v = (Z[n] / 1000 - r.lo) / (r.hi - r.lo); rgb = r.f(v); const k = .5 + .75 * sh; rgb = rgb.map(x => x * k) }
    else if (st.layer === "slope") { rgb = r.f(SLOPE[n] / r.hi); const k = .88 + .2 * sh; rgb = rgb.map(x => x * k) }
    else if (st.layer === "temp") { rgb = r.f((TN[n] - r.lo) / (r.hi - r.lo)); const k = .9 + .16 * sh; rgb = rgb.map(x => x * k) }
    else if (st.layer === "geo") { const k = .62 + .5 * sh; rgb = GEO_RGB[GEO[n]].map(x => x * k) }
    else if (st.layer === "img") { const g = 120 + 80 * sh; rgb = [g * 1.1, g * .8, g * .7] }
    else { const q = SITE[n] >> 0; const g = 150 + 90 * sh;
      if (q > 1) { rgb = r.f((q - 1) / 254); rgb = rgb.map(x => x * (.85 + .2 * sh)) } else rgb = [g, g, g] }
    d[4 * n] = rgb[0]; d[4 * n + 1] = rgb[1]; d[4 * n + 2] = rgb[2]; d[4 * n + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  if (st.layer === "img" && vikReady()) { ctx.imageSmoothingEnabled = true; ctx.drawImage(VIK_IMG, 0, 0, W, H) }
  const hc = hatch.getContext("2d"), hi = hc.createImageData(W, H), maxs = +$("maxs").value;
  for (let n = 0; n < N; n++) hi.data[4 * n + 3] = SLOPE[n] > maxs ? 255 : 0;
  hc.putImageData(hi, 0, 0);
  baseVer++; drawLegend();
}
const cv = $("mini"), box = $("minibox"), base = document.createElement("canvas"); let baseKey = "";
box.style.setProperty("--ar", (W * Math.cos(LAT[H >> 1] * Math.PI / 180) / H).toFixed(4));
function buildBase(cw, ch, dpr) {
  base.width = cw; base.height = ch; const ctx = base.getContext("2d");
  ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, cw, ch);
  const t = document.createElement("canvas"); t.width = cw; t.height = ch; const tc = t.getContext("2d");
  tc.imageSmoothingEnabled = false; tc.drawImage(hatch, 0, 0, cw, ch); tc.globalCompositeOperation = "source-in";
  tc.strokeStyle = "rgba(20,24,28,.6)"; tc.lineWidth = .8 * dpr; tc.beginPath();
  for (let x = -ch; x < cw; x += 3.5 * dpr) { tc.moveTo(x, ch); tc.lineTo(x + ch, 0) } tc.stroke();
  ctx.drawImage(t, 0, 0);
  if (st.layer === "geo") drawGeoOverlay(ctx, cw / W, ch / H, false);
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath() }
function drawMini() {
  const dpr = window.devicePixelRatio || 1, cw = Math.round(box.clientWidth * dpr), ch = Math.round(box.clientHeight * dpr);
  if (!cw || !ch) return;
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch }
  const key = `${cw}x${ch}|${baseVer}`; if (key !== baseKey) { buildBase(cw, ch, dpr); baseKey = key }
  const ctx = cv.getContext("2d"), sx = cw / W, sy = ch / H, u = dpr;
  ctx.drawImage(base, 0, 0);
  const P = n => [((n % W) + .5) * sx, (Math.floor(n / W) + .5) * sy];
  const line = (pts, color, w, dash, alpha = 1) => { if (!pts || pts.length < 2) return;
    ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.globalAlpha = alpha;
    ctx.setLineDash([]); ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = (w + 2) * u; ctx.beginPath();
    pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    ctx.setLineDash(dash ? dash.map(v => v * u) : []); ctx.strokeStyle = color; ctx.lineWidth = w * u; ctx.beginPath();
    pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1 };
  const s = st.M ? stateAt(st.M, st.t) : null, here = s ? [s.gj * sx, s.gi * sy] : null;
  const split = (path, pos) => { const pts = path.map(P), k = Math.floor(pos); return [pts.slice(0, k + 1).concat([here]), [here].concat(pts.slice(k + 1))] };
  line(st.res.shortest?.path?.map(P), ROUTE.short, 1.4, [3, 2]);
  const opt = st.res.optimal?.path;
  if (opt) {
    if (st.mode === "fwd" && s && st.t > st.M.t0) { const [done, rest] = split(opt, s.pos); line(rest, ROUTE.opt, 1.8, null, .6); line(done, ROUTE.opt, 2.3) }
    else if (st.mode === "return") line(opt.map(P), ROUTE.opt, 1.6, null, .4);
    else line(opt.map(P), ROUTE.opt, 1.9);
  }
  if (st.mode === "return" && st.retPath && s) { const [done, rest] = split(st.retPath, s.pos); line(rest, ROUTE.ret, 1.8, [4, 2.5]); line(done, ROUTE.ret, 2.3) }
  sites.forEach(q => { const [x, y] = P(cell(q.lat, q.lon)); ctx.lineWidth = 1 * u; ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.arc(x, y, 3.5 * u, 0, 7); ctx.stroke() });
  ctx.font = `700 ${10 * u}px ${css("--f-body")}`;
  for (const [k, n] of [["A", st.A], ["B", st.B]]) { const [x, y] = P(n);
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#15191d"; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.arc(x, y, 3.6 * u, 0, 7); ctx.fill(); ctx.stroke();
    const w = ctx.measureText(k).width; ctx.fillStyle = "rgba(22,15,11,.8)"; ctx.fillRect(x + 5 * u, y - 6 * u, w + 5 * u, 12 * u); ctx.fillStyle = "#fff"; ctx.fillText(k, x + 7.5 * u, y + 3.5 * u) }
  if (st.mode === "fwd" && st.M?.pnr) { const [x, y] = P(st.M.path[st.M.pnr.k]), r = 4 * u;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = "#fff"; ctx.fillRect(-r / 1.4, -r / 1.4, r * 1.41, r * 1.41);
    ctx.strokeStyle = "#d03b3b"; ctx.lineWidth = 1.6 * u; ctx.strokeRect(-r / 1.4, -r / 1.4, r * 1.41, r * 1.41); ctx.restore() }
  if (st.profHover >= 0) { const [x, y] = P(st.profHover); ctx.fillStyle = "#fff"; ctx.strokeStyle = "#15191d"; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.arc(x, y, 3 * u, 0, 7); ctx.fill(); ctx.stroke() }
  const ci = V3D.camInfo();
  if (ci && V3D.mode === "overview") { const a = ci.w2g(ci.x, ci.z), b = ci.w2g(ci.tx, ci.tz), ax = a[1] * sx, ay = a[0] * sy, bx = b[1] * sx, by = b[0] * sy;
    ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.2 * u; ctx.setLineDash([2 * u, 2 * u]); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bx, by, 2.4 * u, 0, 7); ctx.fill() }
  if (s) { ctx.fillStyle = ROUTE.rover; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.arc(here[0], here[1], 4.2 * u, 0, 7); ctx.fill(); ctx.stroke() }
}
function drawLegend() {
  const isGeo = st.layer === "geo", isImg = st.layer === "img"; $("ramp").hidden = isGeo || isImg; $("geoleg").hidden = !(isGeo || isImg);
  if (isImg) { $("geoleg").innerHTML = `<span class="st">Ảnh nền Mars Trek (ảnh ghép màu Viking), đăng ký vào lưới MOLA: ${fmtN(VIK_REF.px_per_deg_x, 1)} px/° ≈ ${fmtN(59.27 / VIK_REF.px_per_deg_x, 1)} km/px, tương quan với địa hình MOLA ${fmtN(VIK_REF.corr, 2)}.</span>`; return }
  if (isGeo) { $("geoleg").innerHTML = GU.map(u => `<span title="${u.vi}"><i style="background:${u.color}"></i><b>${u.code}</b>${u.vi.split(" (")[0]}</span>`).join("")
      + `<span class="st"><i></i>Cấu trúc: vách, rãnh sụt, dòng dung nham (USGS)</span>`; return }
  const r = RAMPS[st.layer], stops = [];
  for (let k = 0; k <= 10; k++) { const c = r.f(k / 10); stops.push(`rgb(${c.map(Math.round).join(",")}) ${k * 10}%`) }
  $("rampbar").style.background = `linear-gradient(90deg, ${stops.join(",")})`;
  const tk = st.layer === "elev" || st.layer === "surf" ? [-4, 0, 5, 10, 15, 21] : st.layer === "slope" ? [0, 5, 10, 15, "20+"] : st.layer === "temp" ? [-25, -10, 0, 10, 25] : ["0", "0,5", "1"];
  $("ramptk").innerHTML = tk.map(v => `<span>${v}</span>`).join("");
  $("ramplab").textContent = r.unit;
}

// ---------- tinh tuyen ----------
function params() { return { maxs: +$("maxs").value, ws: +$("ws").value, wc: +$("wc").value, wl: +$("wl").value, wg: +$("wg").value } }
function useOf(path) { if (!path || path.length < 2) return null;
  const m = buildMission(path, { t: 0, o2: 1e9, fuel: 1e9, dose: 0 }, "fwd"), e = m.kf.at(-1);
  return { sol: (e.t - m.t0) / SOL_H, o2: 1e9 - e.o2, fuel: 1e9 - e.fuel, dose: e.dose } }
let lastMs = 0;
function recompute() {
  const p = params(), t0 = performance.now();
  st.res.shortest = astar(st.A, st.B, "shortest", p);
  st.res.optimal = astar(st.A, st.B, "optimal", p);
  lastMs = performance.now() - t0;
  st.res.mS = st.res.shortest.path && metrics(st.res.shortest.path, p.maxs);
  st.res.mO = st.res.optimal.path && metrics(st.res.optimal.path, p.maxs);
  renderMetrics(); rebuildMission(false); drawProfile(); drawGeoBand(); V3D.routesChanged(); refreshAll();
}
function renderMetrics() {
  const p = params(), fmt = fmtN, mS = st.res.mS, mO = st.res.mO;
  const uS = useOf(st.res.shortest?.path), uO = useOf(st.res.optimal?.path);
  const rows = [["Chiều dài (km)", m => fmt(m.L, 1)], ["Tổng leo (m)", m => fmt(m.climb, 0)], ["Dốc lớn nhất (°)", m => fmt(m.smax, 1)],
    ["Dốc trung bình (°)", m => fmt(m.smean, 2)], [`Ô dốc > ${fmt(p.maxs, 1)}°`, m => m.over], ["T trưa thấp nhất (°C)", m => fmt(m.tmin, 1)], ["Km qua vạt aureole (Aa, lAa)", m => fmt(m.gkm[1] + m.gkm[7], 0)]];
  const rrows = [["Thời gian (sol)", u => fmt(u.sol, 1)], ["Oxy dùng (kg)", u => fmt(u.o2, 1)], ["Nhiên liệu dùng (kg)", u => fmt(u.fuel, 0)]];
  $("met").innerHTML = rows.map(([lab, f]) => `<tr><td>${lab}</td><td>${mS ? f(mS) : "–"}</td><td class="o">${mO ? f(mO) : "–"}</td></tr>`).join("")
    + rrows.map(([lab, f]) => `<tr><td>${lab}</td><td>${uS ? f(uS) : "–"}</td><td class="o">${uO ? f(uO) : "–"}</td></tr>`).join("")
    + `<tr><td>Ô đã duyệt (A*)</td><td>${st.res.shortest.expanded.toLocaleString("vi-VN")}</td><td class="o">${st.res.optimal.expanded.toLocaleString("vi-VN")}</td></tr>`
    + `<tr><td>Thời gian tính</td><td colspan="2">${fmt(lastMs, 0)} ms</td></tr>`;
  const msg = $("msg");
  if (!mO) { msg.hidden = false; msg.textContent = `Không có đường đi mà mọi ô đều dốc dưới ${fmt(p.maxs, 1)}°. Tăng ngưỡng dốc hoặc chọn điểm khác.` }
  else msg.hidden = true;
}

// ---------- hanh trinh ----------
function aLabel() { const k = sites.findIndex(q => cell(q.lat, q.lon) === st.A); return k >= 0 ? `vùng hạ cánh #${k + 1}` : "điểm đã chọn" }
function prepProfile(M) { const n = M.path.length; M.cum = new Float64Array(n); M.zs = new Float64Array(n);
  for (let k = 0; k < n; k++) { M.zs[k] = Z[M.path[k]]; M.cum[k] = k ? M.cum[k - 1] + M.segs[k - 1].len / 1000 : 0 } }
function rebuildMission(keepT) {
  const path = st.res.optimal?.path;
  st.mode = "fwd"; st.retPath = null; st.tSOS = null; st.sosMsg = null;
  if (!path || path.length < 2) { st.M = st.Mf = null; st.playing = false; st.ev = []; setPlayBtn(); drawBudget(); V3D.missionChanged(); refreshAll(); return }
  st.Mf = st.M = buildMission(path, { t: 0, o2: cfg.o2, fuel: cfg.fuel, dose: 0 }, "fwd"); prepProfile(st.M);
  st.ev = buildEvents(st.M, `Xuất phát từ A (${aLabel()}) đi B theo tuyến tối ưu dài ${fmtN(st.M.totalKm)} km.`);
  st.t = keepT ? Math.min(st.t, st.M.tEnd) : 0; if (!keepT) st.playing = false;
  evShown = -1; setPlayBtn(); drawBudget(); V3D.missionChanged(); refreshAll();
}
function emergency() {
  if (!st.M || st.mode === "return") return;
  const s = stateAt(st.M, st.t);
  if (st.M.fail && st.t >= st.M.tEnd - 1e-6) { st.sosMsg = { s: "crit", m: "Rover đã dừng vì hết " + (st.M.fail.type === "o2" ? "oxy" : "nhiên liệu") + ", không thể tự quay về. Đặt lại hành trình hoặc tăng lượng mang theo." }; refreshAll(); return }
  if (s.d < 1) { st.sosMsg = { s: "info", m: "Rover đang ở A, chưa cần quay về." }; refreshAll(); return }
  const k = clamp(Math.round(s.pos), 0, st.M.path.length - 1), from = st.M.path[k];
  const r = astar(from, st.A, "optimal", params());
  if (!r.path) { st.sosMsg = { s: "crit", m: `Không tìm được đường về A với ngưỡng dốc ${fmtN(params().maxs, 1)}°. Tăng ngưỡng dốc rồi thử lại.` }; refreshAll(); return }
  const fwdEv = st.ev.filter(e => e.t <= st.t);
  st.tSOS = st.t; st.retPath = r.path; st.mode = "return";
  st.M = buildMission(r.path, { t: st.t, o2: s.o2, fuel: s.fuel, dose: s.dose }, "return"); prepProfile(st.M);
  const ev2 = buildEvents(st.M, `Kích hoạt quay về A khẩn cấp ở km ${fmtN(s.d / 1000)}. Đường về dài ${fmtN(st.M.totalKm)} km.`); ev2[0].l = "warn";
  st.ev = fwdEv.concat(ev2); evShown = -1;
  const e = st.M.kf.at(-1);
  st.sosMsg = st.M.fail
    ? { s: "crit", m: `Không đủ ${st.M.fail.type === "o2" ? "oxy" : "nhiên liệu"} để về A: rover sẽ dừng sau ${fmtN(st.M.fail.d / 1000)} km, còn cách A ${fmtN(st.M.totalKm - st.M.fail.d / 1000)} km. Cần đội cứu hộ.` }
    : { s: "warn", m: `Đang quay về A: ${fmtN(st.M.totalKm)} km, khoảng ${fmtN((e.t - st.tSOS) / SOL_H, 1)} sol. Đủ tài nguyên, về đến nơi còn ${fmtN(e.o2, 1)} kg oxy và ${fmtN(e.fuel)} kg nhiên liệu.` };
  st.playing = true; setPlayBtn(); drawBudget(); drawProfile(); V3D.missionChanged(); refreshAll();
}

// ---------- mat cat ----------
const svg = $("prof"), tip = $("tip"); let profScale = null;
function drawProfile() {
  const w = svg.clientWidth || 320, h = 220, m = { l: 40, r: 12, t: 10, b: 40 };
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const series = [["shortest", st.res.mS, "--short", "5 3", 2], ["optimal", st.res.mO, "--accent", "", 2.4]].filter(s => s[1]);
  if (!series.length) { svg.innerHTML = ""; profScale = null; return }
  const xmax = Math.max(...series.map(s => s[1].dist.at(-1) / 1000));
  let zmin = Infinity, zmax = -Infinity;
  series.forEach(([k]) => st.res[k].path.forEach(n => { zmin = Math.min(zmin, Z[n]); zmax = Math.max(zmax, Z[n]) }));
  zmin = Math.floor(zmin / 5000) * 5; zmax = Math.ceil(zmax / 5000) * 5; if (zmax === zmin) zmax += 5;
  const step = niceStep(xmax), xend = Math.ceil(xmax / step) * step;
  const X = v => m.l + v / xend * (w - m.l - m.r), Y = v => h - m.b - (v - zmin) / (zmax - zmin) * (h - m.t - m.b);
  let s = "";
  for (let v = zmin; v <= zmax; v += 5) s += `<line x1="${m.l}" x2="${w - m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--rule)"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)" font-family="var(--f-mono)">${v}</text>`;
  for (let v = 0; v <= xend + 1e-9; v += step) s += `<text x="${X(v)}" y="${h - 22}" text-anchor="middle" font-size="11" fill="var(--ink-3)" font-family="var(--f-mono)">${v}</text>`;
  s += `<text x="${(m.l + w - m.r) / 2}" y="${h - 4}" text-anchor="middle" font-size="11" fill="var(--ink-3)">quãng đường (km)</text>`;
  s += `<text x="${m.l + 4}" y="${m.t + 10}" font-size="11" fill="var(--ink-3)">độ cao (km)</text>`;
  series.forEach(([k, mm, col, dash, lw]) => { const pts = st.res[k].path.map((n, q) => `${X(mm.dist[q] / 1000).toFixed(1)},${Y(Z[n] / 1000).toFixed(1)}`).join(" ");
    s += `<polyline points="${pts}" fill="none" stroke="var(${col})" stroke-width="${lw}" stroke-dasharray="${dash}" stroke-linejoin="round" stroke-linecap="round"/>` });
  if (st.mode === "fwd" && st.M?.pnr) { const x = X(st.M.pnr.d / 1000);
    s += `<line x1="${x}" x2="${x}" y1="${m.t + 14}" y2="${h - m.b}" stroke="var(--crit)" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${x}" y="${m.t + 24}" dx="-4" text-anchor="end" font-size="11" font-weight="600" fill="var(--crit-ink)">PNR</text>` }
  s += `<line id="xh" y1="${m.t}" y2="${h - m.b}" stroke="var(--ink-3)" stroke-width="1" visibility="hidden"/><circle id="dotO" r="4" fill="var(--panel)" stroke="var(--accent)" stroke-width="2" visibility="hidden"/><circle id="dotS" r="4" fill="var(--panel)" stroke="var(--short)" stroke-width="2" visibility="hidden"/>`;
  s += `<circle id="rovDot" r="6" fill="${ROUTE.rover}" stroke="var(--panel)" stroke-width="2.5" visibility="hidden"/>`;
  s += `<rect x="${m.l}" y="${m.t}" width="${w - m.l - m.r}" height="${h - m.t - m.b}" fill="transparent" id="hit"/>`;
  svg.innerHTML = s; profScale = { X, Y };
  const hit = svg.querySelector("#hit"), xh = svg.querySelector("#xh");
  const near = (mm, km) => { let q = 0; while (q < mm.dist.length - 1 && mm.dist[q + 1] / 1000 < km) q++; return q };
  hit.onpointermove = ev => {
    const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * (w / r.width);
    const km = (x - m.l) / (w - m.l - m.r) * xend; if (km < 0) return;
    xh.setAttribute("x1", x); xh.setAttribute("x2", x); xh.setAttribute("visibility", "visible");
    let html = `<b>${km.toFixed(0)} km</b>`;
    [["optimal", st.res.mO, "dotO", "Tối ưu"], ["shortest", st.res.mS, "dotS", "Ngắn nhất"]].forEach(([k, mm, id, lab]) => {
      const dot = svg.querySelector("#" + id); if (!mm || km > mm.dist.at(-1) / 1000) { dot && dot.setAttribute("visibility", "hidden"); return }
      const q = near(mm, km), n = st.res[k].path[q];
      dot.setAttribute("cx", X(mm.dist[q] / 1000)); dot.setAttribute("cy", Y(Z[n] / 1000)); dot.setAttribute("visibility", "visible");
      html += `<br>${lab}: ${(Z[n] / 1000).toFixed(2)} km · dốc ${SLOPE[n].toFixed(1)}°`;
      if (k === "optimal") st.profHover = n });
    tip.innerHTML = html; tip.hidden = false;
    const pr = svg.parentElement.getBoundingClientRect(), tw = tip.offsetWidth;
    let left = ev.clientX - pr.left + 12; if (left + tw > pr.width - 8) left = ev.clientX - pr.left - tw - 12;
    tip.style.left = Math.max(4, left) + "px"; tip.style.top = (svg.offsetTop + 8) + "px"; drawMini(); V3D.poke() };
  hit.onpointerleave = () => { tip.hidden = true; xh.setAttribute("visibility", "hidden");
    svg.querySelectorAll("#dotO,#dotS").forEach(c => c.setAttribute("visibility", "hidden")); st.profHover = -1; drawMini(); V3D.poke() };
  updateProfMarker();
}
function updateProfMarker() {
  const dot = svg.querySelector("#rovDot"); if (!dot) return;
  if (!profScale || !st.M || st.mode !== "fwd") { dot.setAttribute("visibility", "hidden"); return }
  const s = stateAt(st.M, st.t);
  dot.setAttribute("cx", profScale.X(s.d / 1000)); dot.setAttribute("cy", profScale.Y(s.z / 1000)); dot.setAttribute("visibility", "visible");
}
function niceStep(x) { const r = x / 5, p = 10 ** Math.floor(Math.log10(r)), f = r / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p }

// ---------- dia chat doc tuyen ----------
function drawGeoBand() {
  const sv = $("gband"), gt = $("gtip"), w = sv.clientWidth || 320, h = 58, m = { l: 2, r: 2, t: 4, b: 22 };
  sv.setAttribute("viewBox", `0 0 ${w} ${h}`); gt.hidden = true;
  const mO = st.res.mO, path = st.res.optimal?.path;
  if (!mO || !path) { sv.innerHTML = `<text x="${w / 2}" y="24" text-anchor="middle" font-size="12" fill="var(--ink-3)">Chưa có tuyến tối ưu.</text>`; $("gtab").innerHTML = ""; return }
  const segs = geoSegments(path, mO.dist), L = mO.L, X = v => m.l + v / L * (w - m.l - m.r), bh = h - m.t - m.b;
  let s = "";
  segs.forEach((g, q) => { const x0 = X(g.a) + (q ? 1 : 0), x1 = Math.max(x0 + .8, X(g.b) - (q < segs.length - 1 ? 1 : 0));
    s += `<rect data-q="${q}" x="${x0.toFixed(1)}" y="${m.t}" width="${(x1 - x0).toFixed(1)}" height="${bh}" rx="2" fill="${GU[g.u].color}"/>`;
    if (x1 - x0 > 30) s += `<text x="${((x0 + x1) / 2).toFixed(1)}" y="${m.t + bh / 2 + 4}" text-anchor="middle" font-size="11" font-weight="600" font-family="var(--f-mono)" fill="#ffffff" pointer-events="none">${GU[g.u].code}</text>` });
  const step = niceStep(L);
  for (let v = 0; v <= L + 1e-9; v += step) s += `<text x="${X(v).toFixed(1)}" y="${h - 6}" text-anchor="${v === 0 ? "start" : "middle"}" font-size="11" fill="var(--ink-3)" font-family="var(--f-mono)">${v}</text>`;
  s += `<text x="${w - m.r}" y="${h - 6}" text-anchor="end" font-size="11" fill="var(--ink-3)">km</text>`;
  sv.innerHTML = s;
  sv.querySelectorAll("rect").forEach(r => { const g = segs[+r.dataset.q], u = GU[g.u];
    r.onpointermove = ev => { gt.innerHTML = `<b>${u.code}</b> · ${u.vi}<br>km ${fmtN(g.a, 1)}–${fmtN(g.b, 1)} (${fmtN(g.b - g.a, 1)} km) · nhám ${fmtN(u.rough)} m`; gt.hidden = false;
      const pr = sv.parentElement.getBoundingClientRect(), tw = gt.offsetWidth; let left = ev.clientX - pr.left + 12; if (left + tw > pr.width - 8) left = ev.clientX - pr.left - tw - 12;
      gt.style.left = Math.max(4, left) + "px"; gt.style.top = (sv.offsetTop + 50) + "px"; st.profHover = path[Math.round((g.k0 + g.k1) / 2)]; drawMini(); V3D.poke() };
    r.onpointerleave = () => { gt.hidden = true; st.profHover = -1; drawMini(); V3D.poke() } });
  const rows = GU.map((u, k) => [u, mO.gkm[k]]).filter(r => r[1] > .05).sort((a, b) => b[1] - a[1]);
  $("gtab").innerHTML = rows.map(([u, km]) => `<tr><td><i style="background:${u.color}"></i>${u.code} · ${u.vi.split(" (")[0]}</td><td>${fmtN(km)}</td><td>${fmtN(km / L * 100)}%</td></tr>`).join("");
}

// ---------- doi chieu Mars Trek ----------
function gcKm(la1, lo1, la2, lo2) { const r = Math.PI / 180, a = Math.sin((la2 - la1) * r / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin((lo2 - lo1) * r / 2) ** 2; return 2 * R / 1000 * Math.asin(Math.sqrt(a)) }
function renderIAU() {
  let zmax = -Infinity, nz = 0; for (let n = 0; n < N; n++) if (Z[n] > zmax) { zmax = Z[n]; nz = n }
  const i = Math.floor(nz / W), j = nz % W, d = gcKm(IAU.lat, IAU.lonE, LAT[i], LON[j]);
  const ci = Math.round((META.lat_n - IAU.lat) * PPD - .5), cj = Math.round((IAU.lonE - META.lon_w) * PPD - .5);
  $("iauChk").innerHTML = `<dt>Tâm Olympus Mons (USGS, qua Mars Trek)</dt><dd>${IAU.lat.toFixed(3)}°N, ${(IAU.lonE - 360).toFixed(3)}° (= ${IAU.lonE.toFixed(3)}°E) · đường kính ${fmtN(IAU.diam, 0)} km</dd>`
    + `<dt>Điểm cao nhất trên MOLA trong app</dt><dd>${LAT[i].toFixed(3)}°N, ${LON[j].toFixed(3)}°E · ${fmtN(zmax / 1000, 2)} km · cách tâm danh mục ${fmtN(d)} km</dd>`
    + `<dt>Độ cao MOLA tại tâm danh mục</dt><dd>${fmtN(Z[ci * W + cj] / 1000, 2)} km (tâm danh mục là tâm hình học của núi, không phải đỉnh)</dd>`;
}
function trekRow(lab, n) { const i = Math.floor(n / W), j = n % W, la = LAT[i], lo = LON[j], le = lo > 180 ? lo - 360 : lo;
  return [lab, `${la.toFixed(3)}, ${le.toFixed(3)}`, `(${lo.toFixed(2)}°E · cao ${fmtN(Z[n] / 1000, 2)} km)`] }
let trekKey = "";
function updateTrek() {
  const s = st.M ? stateAt(st.M, st.t) : null, rows = [trekRow("A", st.A), trekRow("B", st.B)];
  if (s && s.cell >= 0) rows.push(trekRow("Rover", s.cell));
  const key = rows.map(r => r[1]).join("|"); if (key === trekKey) return; trekKey = key;
  $("trek").innerHTML = rows.map(([k, c, x], q) => `<span class="k">${k}</span><span><code>${c}</code><br><span class="hint">${x}</span></span><button class="cbtn" data-c="${c}">Sao chép</button>`).join("");
  $("trek").querySelectorAll("button").forEach(b => b.onclick = () => {
    const msg = $("trekMsg");
    try { navigator.clipboard.writeText(b.dataset.c).then(() => msg.textContent = `Đã sao chép ${b.dataset.c}. Dán vào ô tìm kiếm tọa độ của Mars Trek.`,
      () => msg.textContent = `Trình duyệt chặn sao chép; hãy bôi đen tọa độ ${b.dataset.c} để sao chép.`) }
    catch (e) { msg.textContent = `Trình duyệt chặn sao chép; hãy bôi đen tọa độ ${b.dataset.c} để sao chép.` } });
}

// ---------- ngan sach oxy & nhien lieu ----------
const bud = $("bud"); let budScale = null;
function drawBudget() {
  const w = bud.clientWidth || 320, h = 220, m = { l: 34, r: 62, t: 12, b: 28 };
  bud.setAttribute("viewBox", `0 0 ${w} ${h}`); $("btip").hidden = true;
  $("budT").textContent = st.mode === "return" ? "Ngân sách oxy & nhiên liệu dọc đường về A" : "Ngân sách oxy & nhiên liệu dọc tuyến đi B";
  const M = st.M; if (!M) { bud.innerHTML = `<text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-size="12" fill="var(--ink-3)">Chưa có tuyến tối ưu.</text>`; budScale = null; return }
  const xmax = M.totalKm, step = niceStep(Math.max(xmax, 1)), xend = Math.ceil(xmax / step) * step;
  const X = v => m.l + v / xend * (w - m.l - m.r), Y = p => h - m.b - clamp(p, 0, 100) / 100 * (h - m.t - m.b);
  let s = "";
  for (const v of [0, 25, 50, 75, 100]) s += `<line x1="${m.l}" x2="${w - m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--rule)"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)" font-family="var(--f-mono)">${v}</text>`;
  for (let v = 0; v <= xend + 1e-9; v += step) s += `<text x="${X(v)}" y="${h - 9}" text-anchor="middle" font-size="11" fill="var(--ink-3)" font-family="var(--f-mono)">${v}</text>`;
  s += `<text x="${m.l - 6}" y="${m.t - 2}" text-anchor="end" font-size="11" fill="var(--ink-3)">%</text><text x="${w - m.r}" y="${h - 9}" dx="14" font-size="11" fill="var(--ink-3)">km</text>`;
  const pts = { o2: [], fu: [], no2: [], nfu: [] };
  for (let k = 0; k < M.path.length; k++) { const q = M.nodeKf[k]; const x = X(M.cum[k]);
    pts.no2.push(`${x.toFixed(1)},${Y(M.need.o2[k] / cfg.o2 * 100).toFixed(1)}`); pts.nfu.push(`${x.toFixed(1)},${Y(M.need.fuel[k] / cfg.fuel * 100).toFixed(1)}`);
    if (q >= 0) { pts.o2.push(`${x.toFixed(1)},${Y(M.kf[q].o2 / cfg.o2 * 100).toFixed(1)}`); pts.fu.push(`${x.toFixed(1)},${Y(M.kf[q].fuel / cfg.fuel * 100).toFixed(1)}`) } }
  if (M.fail) { const x = X(M.fail.d / 1000), e = M.kf.at(-1);
    pts.o2.push(`${x.toFixed(1)},${Y(e.o2 / cfg.o2 * 100).toFixed(1)}`); pts.fu.push(`${x.toFixed(1)},${Y(e.fuel / cfg.fuel * 100).toFixed(1)}`) }
  const pl = (p, col, dash, lw) => `<polyline points="${p.join(" ")}" fill="none" stroke="var(${col})" stroke-width="${lw}" ${dash ? `stroke-dasharray="${dash}"` : ""} stroke-linejoin="round" stroke-linecap="round"/>`;
  s += pl(pts.no2, "--accent", "5 4", 1.6) + pl(pts.nfu, "--short", "5 4", 1.6) + pl(pts.o2, "--accent", "", 2.4) + pl(pts.fu, "--short", "", 2.4);
  if (M.pnr) { const x = X(M.pnr.d / 1000);
    s += `<line x1="${x}" x2="${x}" y1="${m.t}" y2="${h - m.b}" stroke="var(--crit)" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${x - 4}" y="${m.t + 10}" text-anchor="end" font-size="11" font-weight="600" fill="var(--crit-ink)">PNR</text>` }
  if (M.fail) { const x = X(M.fail.d / 1000); s += `<text x="${x}" y="${Y(0) - 8}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--crit-ink)">✕ hết ${M.fail.type === "o2" ? "oxy" : "nhiên liệu"}</text>` }
  const e = M.kf.at(-1), lo = Y(e.o2 / cfg.o2 * 100), lf = Y(e.fuel / cfg.fuel * 100), xe = (M.fail ? X(M.fail.d / 1000) : X(M.totalKm)) + 6;
  let yo = lo + 4, yf = lf + 4; if (Math.abs(yo - yf) < 13) { if (yo <= yf) { yo -= 7; yf += 7 } else { yo += 7; yf -= 7 } }
  s += `<text x="${xe}" y="${yo}" font-size="11.5" font-weight="600" fill="var(--ink)">O₂ ${fmtN(e.o2 / cfg.o2 * 100)}%</text>`;
  s += `<text x="${xe}" y="${yf}" font-size="11.5" font-weight="600" fill="var(--ink)">NL ${fmtN(e.fuel / cfg.fuel * 100)}%</text>`;
  s += `<line id="bCur" y1="${m.t}" y2="${h - m.b}" stroke="var(--ink-3)" stroke-width="1"/><circle id="bO" r="4" fill="var(--panel)" stroke="var(--accent)" stroke-width="2"/><circle id="bF" r="4" fill="var(--panel)" stroke="var(--short)" stroke-width="2"/>`;
  s += `<line id="bHx" y1="${m.t}" y2="${h - m.b}" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="2 2" visibility="hidden"/>`;
  s += `<rect id="bHit" x="${m.l}" y="${m.t}" width="${w - m.l - m.r}" height="${h - m.t - m.b}" fill="transparent"/>`;
  bud.innerHTML = s; budScale = { X, Y }; updateBudgetCursor();
  const hit = bud.querySelector("#bHit"), hx = bud.querySelector("#bHx"), btip = $("btip");
  hit.onpointermove = ev => {
    const r = bud.getBoundingClientRect(), x = (ev.clientX - r.left) * (w / r.width);
    const km = clamp((x - m.l) / (w - m.l - m.r) * xend, 0, M.totalKm);
    let lo2 = 0, hi = M.cum.length - 1; while (lo2 < hi) { const mid = (lo2 + hi + 1) >> 1; if (M.cum[mid] <= km) lo2 = mid; else hi = mid - 1 }
    const k = lo2, q = M.nodeKf[k], xx = X(M.cum[k]);
    hx.setAttribute("x1", xx); hx.setAttribute("x2", xx); hx.setAttribute("visibility", "visible");
    const pct = (v, cap) => fmtN(v / cap * 100) + "%";
    btip.innerHTML = `<b>km ${fmtN(M.cum[k])}</b>` + (q >= 0
      ? `<br>Oxy ${fmtN(M.kf[q].o2, 1)} kg (${pct(M.kf[q].o2, cfg.o2)}) · cần ${fmtN(M.need.o2[k], 1)}<br>Nhiên liệu ${fmtN(M.kf[q].fuel)} kg (${pct(M.kf[q].fuel, cfg.fuel)}) · cần ${fmtN(M.need.fuel[k])}<br>${clockT(M.kf[q].t)}`
      : `<br>Rover không tới được điểm này.`);
    btip.hidden = false;
    const pr = bud.parentElement.getBoundingClientRect(), tw = btip.offsetWidth;
    let left = ev.clientX - pr.left + 12; if (left + tw > pr.width - 8) left = ev.clientX - pr.left - tw - 12;
    btip.style.left = Math.max(4, left) + "px"; btip.style.top = (bud.offsetTop + 6) + "px" };
  hit.onpointerleave = () => { btip.hidden = true; hx.setAttribute("visibility", "hidden") };
}
function updateBudgetCursor() {
  if (!budScale || !st.M) return; const s = stateAt(st.M, st.t), x = budScale.X(s.d / 1000);
  const c = bud.querySelector("#bCur"), o = bud.querySelector("#bO"), f = bud.querySelector("#bF"); if (!c) return;
  c.setAttribute("x1", x); c.setAttribute("x2", x);
  o.setAttribute("cx", x); o.setAttribute("cy", budScale.Y(s.o2 / cfg.o2 * 100)); f.setAttribute("cx", x); f.setAttribute("cy", budScale.Y(s.fuel / cfg.fuel * 100));
}

