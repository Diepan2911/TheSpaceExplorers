// ---------- ECG ----------
const ecg = $("ecg"); let ecgX = 0, ecgPh = 0, ecgY = null;
const wave = p => { const g = (c, w, a) => a * Math.exp(-(((p - c) / w) ** 2)); return g(.12, .028, .13) - g(.27, .008, .14) + g(.30, .011, 1) - g(.336, .01, .28) + g(.56, .05, .3) };
function drawECG(dt, hr, staticOnly) {
  const dpr = window.devicePixelRatio || 1, w = Math.round(ecg.clientWidth * dpr), h = Math.round(ecg.clientHeight * dpr);
  if (!w || !h) return; const ctx = ecg.getContext("2d");
  if (ecg.width !== w || ecg.height !== h) { ecg.width = w; ecg.height = h; ecgX = 0; ecgY = null }
  const col = css("--accent"), bg = css("--panel"), y0 = h * .66, amp = h * .58;
  ctx.lineWidth = 1.7 * dpr; ctx.strokeStyle = col; ctx.lineJoin = "round"; ctx.lineCap = "round";
  if (staticOnly) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); ctx.beginPath(); const secs = 3.2;
    for (let x = 0; x <= w; x += dpr) { const tt = x / w * secs, p = (tt * hr / 60) % 1, y = y0 - wave(p) * amp; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.stroke(); return }
  const adv = w / 3.2 * dt, n = Math.max(1, Math.ceil(adv / (2 * dpr)));
  for (let k = 0; k < n; k++) { const x0 = ecgX, x1 = ecgX + adv / n; ecgPh = (ecgPh + hr / 60 * dt / n) % 1; const y1 = y0 - wave(ecgPh) * amp;
    ctx.fillStyle = bg; ctx.fillRect(x1, 0, 14 * dpr, h);
    if (ecgY !== null) { ctx.beginPath(); ctx.moveTo(x0, ecgY); ctx.lineTo(x1, y1); ctx.stroke() }
    ecgX = x1; ecgY = y1; if (ecgX >= w) { ecgX = 0; ecgY = null } }
}

// ---------- bang dieu khien ----------
const clockT = t => clock({ h: localH(t), sol: Math.floor((t + 1e-6) / SOL_H) + 1 });
const setChip = (id, s, txt) => { const e = $(id); e.dataset.s = s; e.textContent = txt };
const lvl = f => f <= 0 ? ["crit", "Hết"] : f < .2 ? ["crit", "Nguy cấp"] : f < .4 ? ["warn", "Thấp"] : ["good", "Đủ"];
let evShown = -1, scrubbing = false;
function phaseLabel(s) {
  if (!st.M) return ["", "Chưa có tuyến"];
  if (s.ph === "end") return st.M.fail ? ["crit", st.M.fail.type === "o2" ? "Hết oxy" : "Hết nhiên liệu"] : ["good", st.mode === "return" ? "Đã về A" : "Đã đến B"];
  if (st.mode === "return") return ["warn", s.ph === "rest" ? "Quay về · đang nghỉ" : "Đang quay về A"];
  if (st.t <= st.M.t0 + 1e-9 && !st.playing) return ["", "Sẵn sàng"];
  return s.ph === "rest" ? ["rest", "Đang nghỉ"] : ["drive", st.playing ? "Đang lái" : "Tạm dừng"];
}
function updateDash(s) {
  const M = st.M;
  const [ps, pt] = phaseLabel(s); const pill = $("pill"); pill.textContent = pt; if (ps) pill.dataset.s = ps; else delete pill.dataset.s;
  if (!M) { $("banner").hidden = true; return }
  const dkm = s.d / 1000;
  $("hTime").innerHTML = `<b>SOL ${s.sol}</b> · ${clock(s).split("· ")[1]}`;
  $("hPhase").textContent = s.ph === "rest" ? (s.h >= 6 && s.h < 18 ? "Nghỉ trong lều" : "Nghỉ đêm trong lều") : s.ph === "end" ? (M.fail ? "Rover đã dừng" : st.mode === "return" ? "Đã về A" : "Đã đến B") : st.mode === "return" ? "Quay về A" : st.playing ? "Đang lái" : "Đỗ";
  $("hSpd").textContent = fmtN(st.playing ? s.speed : 0, 1); $("hSlope").textContent = `dốc ${fmtN(s.slope, 1)}° · nghiêng ${fmtN(Math.abs(s.ang * 180 / Math.PI), 1)}°`;
  $("hElev").textContent = `cao ${fmtN(s.z / 1000, 2)} km · ${fmtN(PRES[s.cell])} Pa`; $("hTemp").textContent = `ngoài trời ${fmtN(s.text)} °C`;
  $("hDist").textContent = fmtN(dkm); $("hTot").textContent = fmtN(M.totalKm);
  const end = stateAt(M, M.tEnd);
  $("hEta").textContent = M.fail ? `dừng ở km ${fmtN(M.fail.d / 1000)}` : `${st.mode === "return" ? "về A" : "đến B"} ${clock(end)}`;
  // tai nguyen
  const o2f = s.o2 / cfg.o2, ff = s.fuel / cfg.fuel, rest = s.ph !== "drive";
  const o2r = rest ? cfg.crew * (MDL.o2Rest + MDL.o2Leak) : (s.seg ? s.seg.o2h : 0);
  const P = (rest ? MDL.pRest + MDL.kHeatRest * Math.max(0, MDL.tHeat - s.text) : MDL.pDrive + MDL.kHeatDrive * Math.max(0, MDL.tHeat - s.text));
  const fr = (rest || !s.seg ? P : s.seg.e / s.seg.dh + P) / MDL.eFuel;
  $("o2Val").innerHTML = `${fmtN(s.o2, 1)}<small>kg</small>`; $("o2Bar").style.width = clamp(o2f * 100, 0, 100) + "%";
  const lo = lvl(o2f); $("o2Bar").dataset.s = lo[0]; setChip("o2Chip", lo[0], lo[1]);
  $("o2Meta").textContent = `${fmtN(o2f * 100)}% · dùng ${fmtN(o2r * 1000)} g/giờ · đủ ~${fmtN(o2r ? s.o2 / o2r : 0)} giờ`;
  $("fuVal").innerHTML = `${fmtN(s.fuel)}<small>kg</small>`; $("fuBar").style.width = clamp(ff * 100, 0, 100) + "%";
  const lf = lvl(ff); $("fuBar").dataset.s = lf[0]; setChip("fuChip", lf[0], lf[1]);
  $("fuMeta").textContent = `${fmtN(ff * 100)}% · ≈ ${fmtN(s.fuel * MDL.eFuel)} kWh · dùng ${fmtN(fr, 1)} kg/giờ`;
  const showNeed = s.d > 1 && s.ph !== "end";
  $("o2Need").style.left = clamp(s.needO2 / cfg.o2 * 100, 0, 100) + "%"; $("fuNeed").style.left = clamp(s.needFuel / cfg.fuel * 100, 0, 100) + "%";
  $("o2Need").hidden = $("fuNeed").hidden = !showNeed;
  if (st.mode === "return") $("kvRet").textContent = M.fail ? "Không đủ để về đến A" : "Đang quay về, đủ tài nguyên";
  else if (s.d < 1) $("kvRet").textContent = "Đang ở A";
  else { const okO = s.o2 >= s.needO2, okF = s.fuel >= s.needFuel;
    $("kvRet").textContent = okO && okF ? `Đủ (cần ${fmtN(s.needO2, 1)} kg O₂, ${fmtN(s.needFuel)} kg nhiên liệu)` : `Không đủ ${!okO && !okF ? "oxy và nhiên liệu" : !okO ? "oxy" : "nhiên liệu"}` }
  $("kvPnr").textContent = st.mode === "return" ? "–" : M.pnr ? `km ${fmtN(M.pnr.d / 1000)} · ${clockT(M.pnr.t)}` : "Không có, luôn đủ quay về";
  $("kvEtaL").textContent = st.mode === "return" ? "Dự kiến về A" : "Dự kiến đến B";
  $("kvEta").textContent = M.fail ? `Không tới được: hết ${M.fail.type === "o2" ? "oxy" : "nhiên liệu"} ở km ${fmtN(M.fail.d / 1000)}` : `${clock(end)} · ${fmtN((M.tEnd - M.t0) / SOL_H, 1)} sol`;
  $("kvArrL").textContent = st.mode === "return" ? "Còn lại khi về A" : "Còn lại khi đến B";
  $("kvArr").textContent = M.fail ? "–" : `O₂ ${fmtN(end.o2, 1)} kg (${fmtN(end.o2 / cfg.o2 * 100)}%) · nhiên liệu ${fmtN(end.fuel)} kg (${fmtN(end.fuel / cfg.fuel * 100)}%)`;
  // y te
  const v = vitals(s, st.who); st.hr = v.hr; if (reduceMotion) drawECG(0, v.hr, true);
  $("hrVal").innerHTML = `${fmtN(v.hr)}<small>lần/phút</small>`; $("spVal").innerHTML = `${fmtN(v.sp)}<small>%</small>`;
  $("btVal").innerHTML = `${fmtN(v.bt, 1)}<small>°C</small>`; $("rrVal").textContent = `nhịp thở ${fmtN(v.rr)} lần/phút`;
  const hrS = v.hr > 115 ? ["crit", "Rất cao"] : v.hr > 100 ? ["warn", "Cao"] : ["good", "Bình thường"];
  const spS = v.sp < 90 ? ["crit", "Rất thấp"] : v.sp < 95 ? ["warn", "Thấp"] : ["good", "Bình thường"];
  const btS = v.bt < 35.5 ? ["crit", "Hạ thân nhiệt"] : v.bt > 37.6 ? ["warn", "Cao"] : ["good", "Bình thường"];
  setChip("hrChip", ...hrS); setChip("spChip", ...spS); setChip("btChip", ...btS);
  const worst = [hrS, spS, btS].some(x => x[0] === "crit") ? ["crit", "Nguy cấp"] : [hrS, spS, btS].some(x => x[0] === "warn") ? ["warn", "Theo dõi"] : ["good", "Ổn định"];
  setChip("medPill", ...worst);
  const dp = s.dose / MDL.doseLimit * 100;
  $("radVal").innerHTML = `${fmtN(s.dose, 2)}<small>mSv</small>`; $("radBar").style.width = clamp(dp, 0, 100) + "%";
  $("radMeta").textContent = `${fmtN(s.rate * 1000, 1)} µSv/giờ tại đây · ${fmtN(dp, 2)}% giới hạn 600 mSv`;
  setChip("radChip", ...(dp < 10 ? ["good", "Trong giới hạn"] : dp < 50 ? ["warn", "Theo dõi"] : ["crit", "Vượt mức"]));
  const fat = s.todayH / cfg.driveH;
  $("fatVal").innerHTML = `${fmtN(s.todayH, 1)}<small>/ ${fmtN(cfg.driveH, 1)} giờ</small>`; $("fatBar").style.width = clamp(fat * 100, 0, 100) + "%";
  $("fatBar").dataset.s = s.ph === "drive" && fat > .9 ? "warn" : "";
  setChip("fatChip", ...(s.ph === "rest" ? ["info", "Đang ngủ nghỉ"] : fat < .6 ? ["good", "Tỉnh táo"] : fat < .9 ? ["warn", "Hơi mệt"] : ["warn", "Cần nghỉ"]));
  $("fatMeta").textContent = s.ph === "rest" ? `nghỉ đến 08:00 sol ${s.sol + 1}` : `lái thêm ${fmtN(Math.max(0, cfg.driveH - s.todayH), 1)} giờ thì dựng lều`;
  // nhat ky
  const shown = st.ev.filter(e => e.t <= st.t + 1e-6);
  if (shown.length !== evShown) { evShown = shown.length;
    $("events").innerHTML = shown.length ? shown.slice().reverse().map(e => `<li data-l="${e.l}"><time>${clockT(e.t)}</time><span>${e.m}</span></li>`).join("")
      : `<li class="empty">Chưa có cảnh báo. Các chỉ số trong ngưỡng an toàn.</li>` }
  // thanh thoi gian + thong bao
  const span = M.tEnd - M.t0; if (!scrubbing) $("scrub").value = span ? Math.round((st.t - M.t0) / span * 1000) : 0;
  $("tl0").textContent = `Sol ${Math.floor(M.t0 / SOL_H) + 1}`; $("tl1").textContent = `Sol ${end.sol}`;
  const bn = $("banner"); let b = null; const last = st.ev.length ? st.ev.at(-1).m : "";
  if (s.ph === "end") b = M.fail ? { s: "crit", m: last }
    : st.mode === "return" ? { s: "good", m: `${last} Đường về ${fmtN(M.totalKm)} km mất ${fmtN((M.tEnd - M.t0) / SOL_H, 1)} sol. Liều bức xạ cả chuyến ${fmtN(end.dose, 1)} mSv.` }
    : { s: "good", m: `Đến B sau ${fmtN((M.tEnd - M.t0) / SOL_H, 1)} sol. ${last.replace(/^Đến B\. /, "")} Liều bức xạ cả chuyến ${fmtN(end.dose, 1)} mSv.` };
  else if (st.sosMsg) b = st.sosMsg;
  if (b) { bn.hidden = false; bn.dataset.s = b.s; bn.textContent = b.m } else bn.hidden = true;
}
function setPlayBtn() {
  const b = $("play"), M = st.M, atEnd = M && st.t >= M.tEnd - 1e-6;
  b.disabled = !M;
  b.querySelector("span").textContent = st.playing ? "Tạm dừng" : atEnd ? "Chạy lại" : (M && st.t > M.t0 + 1e-6) ? "Tiếp tục" : "Bắt đầu";
  b.querySelector("svg").innerHTML = st.playing ? '<path d="M2 1h3v10H2zM7 1h3v10H7z"/>' : '<path d="M2 1l9 5-9 5z"/>';
  $("sos").disabled = !M || st.mode === "return" || (M.fail && atEnd);
}
function refreshAll() { const s = st.M ? stateAt(st.M, st.t) : null; updateDash(s || {}); updateTrek(); drawMini(); updateProfMarker(); updateBudgetCursor(); setPlayBtn(); V3D.poke() }

// ---------- vong lap ----------
let lastFrame = performance.now(), lastDash = 0, lastMap = 0;
function frame(now) {
  const dt = Math.min(.1, Math.max(0, (now - lastFrame) / 1000)); lastFrame = now;
  if (st.playing && st.M) { const s0 = stateAt(st.M, st.t);
    st.t = Math.min(st.M.tEnd, st.t + dt * (s0.ph === "rest" ? Math.max(st.speed * 4, 8) : st.speed));
    if (st.t >= st.M.tEnd - 1e-9) { st.playing = false; setPlayBtn(); refreshAll() } }
  const s = st.M ? stateAt(st.M, st.t) : null;
  V3D.frame(s, dt, now, st.speed);
  if (s && st.playing) {
    if (now - lastDash > 100) { updateDash(s); updateTrek(); lastDash = now }
    if (now - lastMap > 90) { drawMini(); updateProfMarker(); updateBudgetCursor(); lastMap = now } }
  else if (V3D.mode === "overview" && now - lastMap > 120) { drawMini(); lastMap = now }
  if (!reduceMotion) drawECG(dt, st.hr || 70, false);
  requestAnimationFrame(frame);
}

// ---------- danh sach site ----------
function renderSites() {
  $("sites").innerHTML = sites.map((q, k) => `<li><button data-k="${k}" aria-current="${cell(q.lat, q.lon) === st.A}">
    <span class="n">#${k + 1}</span><span>${q.lat.toFixed(2)}°N, ${q.lon.toFixed(2)}°E<br><span class="c">${(q.elev_m / 1000).toFixed(2)} km · dốc ${q.slope_deg.toFixed(2)}° · ${q.T_noon_C.toFixed(1)} °C</span></span>
    <span class="sc">${q.score.toFixed(2)}</span></button></li>`).join("");
  $("sites").querySelectorAll("button").forEach(b => b.onclick = () => { const q = sites[+b.dataset.k]; st.A = cell(q.lat, q.lon); renderSites(); recompute() });
}

// ---------- su kien ----------
const press = (sel, b) => document.querySelectorAll(sel).forEach(x => x.setAttribute("aria-pressed", x === b));
document.querySelectorAll("#layers button").forEach(b => b.onclick = () => {
  st.layer = b.dataset.l; press("#layers button", b); paintRaster(); V3D.terrainDirty(); drawMini() });
document.querySelectorAll("#pick button").forEach(b => b.onclick = () => { st.pick = b.dataset.p; press("#pick button", b); V3D.setPick() });
document.querySelectorAll("#view button").forEach(b => b.onclick = () => { press("#view button", b); V3D.setView(b.dataset.v); drawMini() });
function pickCell(n) { if (!st.pick) return; st[st.pick] = n; renderSites(); recompute() }
const toCell = ev => { const r = cv.getBoundingClientRect(); const j = Math.floor((ev.clientX - r.left) / r.width * W), i = Math.floor((ev.clientY - r.top) / r.height * H);
  return (i < 0 || j < 0 || i >= H || j >= W) ? -1 : i * W + j };
cv.addEventListener("click", ev => { const n = toCell(ev); if (n < 0) return; if (st.pick) pickCell(n); else { V3D.focusCell(n); drawMini() } });
const bindOut = (id, f) => { const o = $(id + "_o"), u = () => o.textContent = f(+$(id).value); u(); $(id).addEventListener("input", u) };
bindOut("maxs", v => v.toFixed(1) + "°"); bindOut("ws", v => v.toFixed(1)); bindOut("wc", v => v.toFixed(1)); bindOut("wl", v => v.toFixed(1)); bindOut("wg", v => v.toFixed(1)); bindOut("ls", v => v + "°");
["ws", "wc", "wl", "wg"].forEach(id => $(id).addEventListener("change", recompute));
$("maxs").addEventListener("change", () => { paintRaster(); V3D.terrainDirty(); recompute() });
$("ls").addEventListener("change", () => { computeTemp(+$("ls").value); paintRaster(); V3D.terrainDirty(); recompute() });
const scaleNote = () => $("scaleNote").textContent = `Rover phóng to ×${V3D.ROVER_X || 450} · độ cao phóng đại ×${fmtN(+$("ve").value, 1).replace(/,0$/, "")}`;
bindOut("ve", v => fmtN(v, 1).replace(/,0$/, "") + "×");
$("ve").addEventListener("change", () => { V3D.setVE(+$("ve").value); scaleNote() });
// cau hinh rover
const CFG = [["cMass", "mass", v => fmtN(v) + " kg"], ["cO2", "o2", v => fmtN(v) + " kg"], ["cFuel", "fuel", v => fmtN(v) + " kg"], ["cV", "vmax", v => fmtN(v, 1) + " km/h"], ["cD", "driveH", v => fmtN(v, 1) + " giờ"]];
CFG.forEach(([id, key, f]) => { bindOut(id, f); $(id).addEventListener("change", () => { cfg[key] = +$(id).value; renderMetrics(); rebuildMission(true) }) });
document.querySelectorAll("#crew button").forEach(b => b.onclick = () => {
  cfg.crew = +b.dataset.c; press("#crew button", b);
  const p2 = document.querySelector('#who button[data-w="1"]'); p2.disabled = cfg.crew < 2;
  if (cfg.crew < 2 && st.who === 1) { st.who = 0; document.querySelectorAll("#who button").forEach(x => x.setAttribute("aria-pressed", x.dataset.w === "0")) }
  renderMetrics(); rebuildMission(true) });
document.querySelectorAll("#who button").forEach(b => b.onclick = () => { st.who = +b.dataset.w; press("#who button", b); refreshAll() });
// tab panel
function bindTabs(id) { const bar = $(id);
  bar.querySelectorAll("button").forEach(b => b.onclick = () => {
    bar.querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", x === b));
    document.querySelectorAll(`[data-of="${id}"]`).forEach(p => p.hidden = p.dataset.pane !== b.dataset.t);
    if (b.dataset.t === "chart") { drawProfile(); drawBudget(); drawGeoBand() }
    if (b.dataset.t === "src") { trekKey = ""; updateTrek() }
    if (b.dataset.t === "med") { ecg.width = 0; refreshAll() } }) }
bindTabs("ltabs"); bindTabs("rtabs");
// dieu khien phat
$("play").onclick = () => { if (!st.M) return;
  if (!st.playing && st.t >= st.M.tEnd - 1e-6) { if (st.mode === "return") st.t = st.M.t0; else st.t = 0 }
  if (st.mode === "fwd") st.sosMsg = null;
  st.playing = !st.playing; setPlayBtn(); refreshAll() };
$("reset").onclick = () => { st.playing = false; if (st.mode === "return") { rebuildMission(false); drawProfile() } else { st.t = 0; st.sosMsg = null; refreshAll() } };
$("sos").onclick = emergency;
document.querySelectorAll("#speed button").forEach(b => b.onclick = () => { st.speed = +b.dataset.v; press("#speed button", b) });
$("scrub").addEventListener("pointerdown", () => scrubbing = true);
window.addEventListener("pointerup", () => scrubbing = false); window.addEventListener("pointercancel", () => scrubbing = false);
$("scrub").addEventListener("input", () => { if (!st.M) return; if (st.mode === "fwd") st.sosMsg = null; st.t = st.M.t0 + (+$("scrub").value / 1000) * (st.M.tEnd - st.M.t0); refreshAll() });
let lastW = 0;
new ResizeObserver(() => { const w = Math.round(document.body.clientWidth); drawMini(); if (w === lastW) return; lastW = w; drawProfile(); drawBudget(); drawGeoBand() }).observe(document.body);
new ResizeObserver(() => drawMini()).observe(box);
const retheme = () => { ecgY = null; ecg.width = 0; drawProfile(); drawBudget(); drawGeoBand(); refreshAll() };
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);
new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

if (window.matchMedia("(max-width: 760px)").matches) $("legend3").open = false;
$("prov").textContent = `MOLA MEGDR · ${PPD} px/° ≈ ${(DY / 1000).toFixed(1)} km/ô · lưới ${H}×${W} · ${META.lat_s}–${META.lat_n0}°N, ${META.lon_w0}–${META.lon_e}°E · địa chất USGS SIM 3292`;
computeTemp(0); paintRaster(); renderSites(); renderIAU();
document.querySelectorAll("#layers button").forEach(b => b.setAttribute("aria-pressed", b.dataset.l === st.layer));
V3D.init(pickCell);
recompute(); scaleNote(); V3D.setView("follow");
requestAnimationFrame(frame);
