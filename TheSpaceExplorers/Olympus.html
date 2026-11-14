<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Olympus Mons 3D – Dataset</title>
<style>
html,body{margin:0;height:100%;background:#120c09;color:#f3ebe3;font:14px system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden}
#gl{position:fixed;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none}
.box{position:fixed;background:rgba(22,15,11,.78);border:1px solid rgba(255,236,220,.16);border-radius:10px;padding:10px 12px}
#top{left:12px;top:12px;max-width:min(430px,calc(100% - 24px))}
.k{display:inline-block;width:16px;height:0;border-top:3px solid;margin-right:6px;vertical-align:3px}
#top h1{margin:0 0 8px;font-size:17px}
.seg{display:flex;flex-wrap:wrap;gap:4px}
.seg button{font:600 13px inherit;font-family:inherit;border:0;border-radius:6px;padding:6px 11px;background:rgba(255,255,255,.1);color:#f3ebe3;cursor:pointer}
.seg button[aria-pressed="true"]{background:#e0662d;color:#fff}
#leg{left:12px;bottom:12px;max-width:min(420px,calc(100% - 24px));font-size:12.5px}
#leg .bar{height:10px;border-radius:3px;margin:4px 0 2px}#leg .tk{display:flex;justify-content:space-between;color:#d4c6b8}
#leg .u{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px 10px}#leg i{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:6px;vertical-align:-1px}
#info{right:12px;bottom:12px;font:12.5px ui-monospace,Menlo,monospace;min-width:230px;color:#d4c6b8}
#src{right:12px;top:12px;font-size:11.5px;color:#d4c6b8;max-width:300px}
label{font-size:12.5px;color:#d4c6b8}
</style></head><body>
<canvas id="gl"></canvas>
<div class="box" id="top"><h1>Olympus Mons · 3D</h1>
  <div class="seg" id="layers"><button data-l="img" aria-pressed="true">Ảnh Mars Trek</button><button data-l="elev" aria-pressed="false">Độ cao MOLA</button><button data-l="slope" aria-pressed="false">Độ dốc</button><button data-l="geo" aria-pressed="false">Địa chất USGS</button></div>
  <div class="seg" id="pick" style="margin-top:8px"><button data-p="" aria-pressed="true">Xem</button><button data-p="A" aria-pressed="false">Đặt A</button><button data-p="B" aria-pressed="false">Đặt B</button><button id="play" aria-pressed="false">▶ Chạy rover</button></div>
  <label style="display:block;margin-top:8px">Dốc tối đa cho tuyến tối ưu <input type="range" id="smax" min="4" max="30" step="1" value="12"> <span id="smaxo">12°</span></label>
  <div id="res" style="margin-top:8px;font-size:12.5px;line-height:1.5"></div>
  <label style="display:block;margin-top:8px">Phóng đại độ cao <input type="range" id="ve" min="1" max="8" step="0.5" value="3"> <span id="veo">3×</span></label>
</div>
<div class="box" id="src">Dữ liệu: NASA MGS MOLA MEGDR 16 px/° (NASA PDS) · ảnh nền NASA JPL Mars Trek (Viking) · USGS SIM 3292 (Tanaka và cộng sự, 2014). Vùng 8–30°N, 212–240°E.</div>
<div class="box" id="leg"></div>
<div class="box" id="info">Di chuột lên địa hình</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
const H = __H__, W = __W__, PPD = 16, LATN = 30, LONW = 212, N = H * W, RM = 3396190;
const Z = new Int16Array(Uint8Array.from(atob("__Z__"), c => c.charCodeAt(0)).buffer);
const GEO_DATA = __GEO__, GU = GEO_DATA.units, GEO = new Uint8Array(N);
{ let o = 0; for (const t of GEO_DATA.rle.split(",")) { if (!t) continue; const n = parseInt(t.slice(1), 16); GEO.fill(+t[0], o, o + n); o += n } }
const IMG = new Image(); IMG.src = "__IMG__";
// do doc tinh tu MOLA (sai phan trung tam)
const DY = RM * Math.PI / 180 / PPD, SL = new Float32Array(N);
for (let i = 0; i < H; i++) { const dx = DY * Math.cos((LATN - (i + .5) / PPD) * Math.PI / 180);
  for (let j = 0; j < W; j++) { const z = (a, b) => Z[Math.min(H - 1, Math.max(0, a)) * W + Math.min(W - 1, Math.max(0, b))];
    SL[i * W + j] = Math.atan(Math.hypot((z(i, j + 1) - z(i, j - 1)) / (2 * dx), (z(i + 1, j) - z(i - 1, j)) / (2 * DY))) * 180 / Math.PI } }
let zmin = 1e9, zmax = -1e9; for (const v of Z) { zmin = Math.min(zmin, v); zmax = Math.max(zmax, v) }
const ramp = (t, st) => { t = Math.max(0, Math.min(1, t)); for (let k = 1; k < st.length; k++) if (t <= st[k][0]) { const a = st[k - 1], b = st[k], u = (t - a[0]) / (b[0] - a[0]); return [1, 2, 3].map(c => a[c] + (b[c] - a[c]) * u) } return st[st.length - 1].slice(1) };
const ELEV = [[0, 43, 58, 103], [.2, 70, 110, 150], [.4, 140, 150, 130], [.6, 200, 170, 110], [.8, 225, 130, 80], [1, 250, 240, 220]];
const SLOPE = [[0, 250, 240, 220], [.25, 246, 176, 143], [.5, 235, 104, 52], [1, 122, 43, 14]];
const hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
let layer = "img";

// ---------- three.js ----------
const cv = document.getElementById("gl"), ren = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
ren.setPixelRatio(Math.min(2, devicePixelRatio));
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x120c09);
const cam = new THREE.PerspectiveCamera(45, 1, 1, 20000);
scene.add(new THREE.AmbientLight(0xffffff, .55)); const sun = new THREE.DirectionalLight(0xffffff, .75); sun.position.set(-1, 1.2, -.6); scene.add(sun);
const KM = DY / 1000, KX = KM * Math.cos(19 * Math.PI / 180), geom = new THREE.PlaneGeometry(W * KX, H * KM, W - 1, H - 1); geom.rotateX(-Math.PI / 2);
const tex = document.createElement("canvas"); tex.width = W * 2; tex.height = H * 2;
const ttex = new THREE.CanvasTexture(tex); ttex.anisotropy = 4;
const mesh = new THREE.Mesh(geom, new THREE.MeshLambertMaterial({ map: ttex })); scene.add(mesh);
function setHeights(ve) { const p = geom.attributes.position; for (let n = 0; n < N; n++) p.setY(n, Z[n] / 1000 * ve); p.needsUpdate = true; geom.computeVertexNormals() }
function paint() {
  const c = tex.getContext("2d");
  if (layer === "img") { if (IMG.complete && IMG.naturalWidth) c.drawImage(IMG, 0, 0, tex.width, tex.height); else { c.fillStyle = "#a8735e"; c.fillRect(0, 0, tex.width, tex.height) } }
  else { const im = c.createImageData(W, H), d = im.data;
    for (let n = 0; n < N; n++) { const rgb = layer === "elev" ? ramp((Z[n] - zmin) / (zmax - zmin), ELEV) : layer === "slope" ? ramp(SL[n] / 20, SLOPE) : hex(GU[GEO[n]].color);
      d[4 * n] = rgb[0]; d[4 * n + 1] = rgb[1]; d[4 * n + 2] = rgb[2]; d[4 * n + 3] = 255 }
    const o = document.createElement("canvas"); o.width = W; o.height = H; o.getContext("2d").putImageData(im, 0, 0);
    c.imageSmoothingEnabled = layer !== "geo"; c.drawImage(o, 0, 0, tex.width, tex.height) }
  ttex.needsUpdate = true; legend(); need = true;
}
IMG.onload = () => { if (layer === "img") paint() };
function legend() {
  const el = document.getElementById("leg"), grad = st => `linear-gradient(90deg,${st.map(s => `rgb(${s.slice(1).join(",")}) ${s[0] * 100}%`).join(",")})`;
  if (layer === "img") el.innerHTML = "<b>Ảnh nền NASA Mars Trek</b><br>Ảnh ghép màu Viking, đã đăng ký vào lưới MOLA (~2,6 km/px)";
  else if (layer === "elev") el.innerHTML = `<b>Độ cao MOLA (km)</b><div class="bar" style="background:${grad(ELEV)}"></div><div class="tk"><span>${(zmin / 1000).toFixed(1)}</span><span>${(zmax / 1000).toFixed(1)}</span></div>`;
  else if (layer === "slope") el.innerHTML = `<b>Độ dốc (°), tính từ MOLA</b><div class="bar" style="background:${grad(SLOPE)}"></div><div class="tk"><span>0</span><span>10</span><span>≥ 20</span></div>`;
  else el.innerHTML = `<b>Đơn vị địa chất USGS SIM 3292</b><div class="u">${GU.map(u => `<span><i style="background:${u.color}"></i>${u.code} · ${u.vi.split(" (")[0]}</span>`).join("")}</div>`;
}
// ---------- dieu khien camera ----------
let yaw = .6, pitch = .75, dist = 1700, tgt = new THREE.Vector3(0, 0, 0), need = true;
function place() { cam.position.set(tgt.x + dist * Math.cos(pitch) * Math.sin(yaw), tgt.y + dist * Math.sin(pitch), tgt.z + dist * Math.cos(pitch) * Math.cos(yaw)); cam.lookAt(tgt); need = true }
let drag = null;
cv.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, b: e.button }; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing" });
cv.addEventListener("pointerup", () => { drag = null; cv.style.cursor = "grab" });
cv.addEventListener("pointermove", e => { if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    if (drag.b === 2 || e.shiftKey) { const s = dist / 900; tgt.x -= (dx * Math.cos(yaw) + dy * Math.sin(yaw)) * s; tgt.z -= (-dx * Math.sin(yaw) + dy * Math.cos(yaw)) * s }
    else { yaw -= dx * .006; pitch = Math.max(.12, Math.min(1.5, pitch + dy * .005)) } place() } else hover(e) });
cv.addEventListener("contextmenu", e => e.preventDefault());
cv.addEventListener("wheel", e => { e.preventDefault(); dist = Math.max(80, Math.min(4000, dist * Math.exp(e.deltaY * .001))); place() }, { passive: false });
const ray = new THREE.Raycaster(), mv = new THREE.Vector2();
function hover(e) { const r = cv.getBoundingClientRect(); mv.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(mv, cam); const h = ray.intersectObject(mesh)[0], el = document.getElementById("info");
  if (!h) { el.textContent = "Di chuột lên địa hình"; return }
  const j = Math.round(h.point.x / KX + (W - 1) / 2), i = Math.round(h.point.z / KM + (H - 1) / 2); if (i < 0 || j < 0 || i >= H || j >= W) return; const n = i * W + j, u = GU[GEO[n]];
  el.innerHTML = `${(LATN - (i + .5) / PPD).toFixed(2)}°N  ${(LONW + (j + .5) / PPD).toFixed(2)}°E<br>Độ cao: ${(Z[n] / 1000).toFixed(2)} km<br>Độ dốc: ${SL[n].toFixed(1)}°<br>Địa chất: ${u.code} · ${u.vi}` }
// ---------- tim duong A* (8 huong) ----------
// ngan nhat: chi phi = quang duong 3D; toi uu: cam o doc > smax, phat theo do doc va do cao leo
const DXr = Array.from({ length: H }, (_, i) => DY * Math.cos((LATN - (i + .5) / PPD) * Math.PI / 180));
function astar(src, dst, opt, smax) {
  const g = new Float64Array(N).fill(Infinity), par = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const hk = [], hv = [], push = (k, v) => { hk.push(k); hv.push(v); let c = hk.length - 1; while (c) { const p = (c - 1) >> 1; if (hk[p] <= hk[c]) break; [hk[p], hk[c]] = [hk[c], hk[p]]; [hv[p], hv[c]] = [hv[c], hv[p]]; c = p } };
  const pop = () => { const v = hv[0], lk = hk.pop(), lv = hv.pop(); if (hk.length) { hk[0] = lk; hv[0] = lv; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c;
    if (l < hk.length && hk[l] < hk[m]) m = l; if (r < hk.length && hk[r] < hk[m]) m = r; if (m === c) break; [hk[m], hk[c]] = [hk[c], hk[m]]; [hv[m], hv[c]] = [hv[c], hv[m]]; c = m } } return v };
  const bi = Math.floor(dst / W), bj = dst % W, minDx = Math.min(...DXr), heur = n => Math.hypot((Math.floor(n / W) - bi) * DY, (n % W - bj) * minDx);
  g[src] = 0; push(heur(src), src);
  while (hk.length) { const u = pop(); if (done[u]) continue; done[u] = 1; if (u === dst) break; const i = Math.floor(u / W), j = u % W;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= H || b >= W) continue;
      const v = a * W + b; if (done[v]) continue; const dz = Z[v] - Z[u], d3 = Math.hypot(DXr[i] * dj, DY * di, dz);
      let c = d3; if (opt) { if (SL[v] > smax) continue; c = d3 * (1 + 3 * (SL[v] / smax) ** 2) + 20 * Math.max(dz, 0) }
      if (g[u] + c < g[v]) { g[v] = g[u] + c; par[v] = u; push(g[v] + heur(v), v) } } }
  if (!done[dst]) return null; const p = []; for (let n = dst; n >= 0; n = par[n]) p.push(n); return p.reverse();
}
function stats(p) { let L = 0, up = 0, sm = 0; const dist = [0];
  for (let k = 1; k < p.length; k++) { const a = p[k - 1], b = p[k], i = Math.floor(a / W), dz = Z[b] - Z[a];
    L += Math.hypot(DXr[i] * (b % W - a % W), DY * (Math.floor(b / W) - i), dz); up += Math.max(dz, 0); sm = Math.max(sm, SL[b]); dist.push(L) }
  return { L: L / 1000, up, sm, dist } }
let A = cellOf(23.84, 223.03), B = cellOf(18.16, 226.16), pickMode = "", routes = {}, lines = [];
function cellOf(lat, lon) { return Math.round((LATN - lat) * PPD - .5) * W + Math.round((lon - LONW) * PPD - .5) }
const xyz = (n, lift = .4) => new THREE.Vector3(((n % W) - (W - 1) / 2) * KX, Z[n] / 1000 * +ve.value + lift, (Math.floor(n / W) - (H - 1) / 2) * KM);
const mkA = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })), mkB = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffde00 }));
scene.add(mkA, mkB);
function solve() {
  const smax = +document.getElementById("smax").value, t0 = performance.now();
  routes = { short: astar(A, B, false, smax), opt: astar(A, B, true, smax) }; const ms = performance.now() - t0;
  const rs = routes.short && stats(routes.short), ro = routes.opt && stats(routes.opt); routes.so = rs; routes.oo = ro;
  document.getElementById("res").innerHTML =
    `<span class="k" style="border-color:#e8642a"></span><b>Ngắn nhất</b>: ${rs ? `${rs.L.toFixed(1)} km · leo ${(rs.up / 1000).toFixed(1)} km · dốc max ${rs.sm.toFixed(1)}°` : "không có"}<br>` +
    `<span class="k" style="border-color:#2f86e8"></span><b>Tối ưu</b>: ${ro ? `${ro.L.toFixed(1)} km · leo ${(ro.up / 1000).toFixed(1)} km · dốc max ${ro.sm.toFixed(1)}°` : `không có đường dốc dưới ${smax}°`}<br>` +
    `<span style="color:#d4c6b8">A* ${ms.toFixed(0)} ms · rover chạy theo tuyến tối ưu</span>`;
  t = 0; drawRoutes();
}
function drawRoutes() {
  for (const l of lines) { scene.remove(l); l.geometry.dispose() } lines = [];
  for (const [k, col] of [["short", 0xe8642a], ["opt", 0x2f86e8]]) { const p = routes[k]; if (!p) continue;
    const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(p.map(n => xyz(n, k === "opt" ? 1.2 : .8))), new THREE.LineBasicMaterial({ color: col, linewidth: 2 }));
    scene.add(ln); lines.push(ln) }
  mkA.position.copy(xyz(A, 4)); mkB.position.copy(xyz(B, 4)); moveRover(); need = true;
}
// ---------- rover (khoi hop + 4 banh, phong to de nhin thay) ----------
const rover = new THREE.Group();
{ const body = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 6), new THREE.MeshLambertMaterial({ color: 0xe0662d })); body.position.y = 4; rover.add(body);
  const wg = new THREE.CylinderGeometry(1.8, 1.8, 1.4, 12), wm = new THREE.MeshLambertMaterial({ color: 0x222222 });
  for (const [x, z] of [[-3.5, -3.6], [3.5, -3.6], [-3.5, 3.6], [3.5, 3.6]]) { const w = new THREE.Mesh(wg, wm); w.rotation.x = Math.PI / 2; w.position.set(x, 1.8, z); rover.add(w) } }
scene.add(rover);
let t = 0, playing = false, last = 0;           // t: km da di tren tuyen toi uu
function moveRover() {
  const p = routes.opt, o = routes.oo; rover.visible = !!p; if (!p) return;
  t = Math.min(t, o.L); let k = 1; while (k < p.length - 1 && o.dist[k] / 1000 < t) k++;
  const a = xyz(p[k - 1], 0), b = xyz(p[k], 0), f = Math.min(1, Math.max(0, (t - o.dist[k - 1] / 1000) / Math.max(1e-6, (o.dist[k] - o.dist[k - 1]) / 1000)));
  rover.position.copy(a.lerp(b, f)); rover.rotation.y = Math.atan2(-(b.z - rover.position.z), b.x - rover.position.x);
  if (playing) { tgt.copy(rover.position); place() }
}
document.getElementById("play").onclick = e => { if (!routes.opt) return; if (t >= routes.oo.L) t = 0; playing = !playing; e.target.setAttribute("aria-pressed", playing); e.target.textContent = playing ? "⏸ Dừng" : "▶ Chạy rover"; last = performance.now() };
document.querySelectorAll("#pick button[data-p]").forEach(b => b.onclick = () => { pickMode = b.dataset.p; document.querySelectorAll("#pick button[data-p]").forEach(x => x.setAttribute("aria-pressed", x === b)); cv.style.cursor = pickMode ? "crosshair" : "grab" });
const smaxEl = document.getElementById("smax"); smaxEl.oninput = () => document.getElementById("smaxo").textContent = smaxEl.value + "°"; smaxEl.onchange = solve;
let down = null; cv.addEventListener("pointerdown", e => down = { x: e.clientX, y: e.clientY });
cv.addEventListener("click", e => { if (!pickMode || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
  const n = cellAt(e); if (n < 0) return; if (pickMode === "A") A = n; else B = n; solve() });
function cellAt(e) { const r = cv.getBoundingClientRect(); mv.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(mv, cam); const h = ray.intersectObject(mesh)[0]; if (!h) return -1;
  const j = Math.round(h.point.x / KX + (W - 1) / 2), i = Math.round(h.point.z / KM + (H - 1) / 2); return i < 0 || j < 0 || i >= H || j >= W ? -1 : i * W + j }

function resize() { const w = innerWidth, h = innerHeight; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); need = true }
addEventListener("resize", resize);
document.querySelectorAll("#layers button").forEach(b => b.onclick = () => { layer = b.dataset.l; document.querySelectorAll("#layers button").forEach(x => x.setAttribute("aria-pressed", x === b)); paint() });
const ve = document.getElementById("ve"); ve.oninput = () => { document.getElementById("veo").textContent = ve.value + "×"; setHeights(+ve.value); drawRoutes() };
(function loop() { if (playing) { const now = performance.now(); t += (now - last) / 1000 * 25; last = now;
    if (t >= routes.oo.L) { t = routes.oo.L; playing = false; const pb = document.getElementById("play"); pb.textContent = "▶ Chạy rover"; pb.setAttribute("aria-pressed", false) } moveRover(); need = true }
  if (need) { ren.render(scene, cam); need = false } requestAnimationFrame(loop) })();
setHeights(3); paint(); resize(); place(); solve();
</script></body></html>