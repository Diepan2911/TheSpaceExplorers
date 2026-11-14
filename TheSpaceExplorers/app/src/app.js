const META = __META__;
const B64 = "__TERRAIN_B64__";

const GEO_DATA = __GEO_DATA__;
// giai ma du lieu
const raw = Uint8Array.from(atob(B64), c => c.charCodeAt(0));
const H = META.H, W = META.W, N = H * W;
const Z = new Float32Array(N), SITE = new Uint8Array(N);
{ const dv = new DataView(raw.buffer);
 for (let k = 0; k < N; k++) Z[k] = dv.getInt16(2 * k, true);
 SITE.set(raw.subarray(2 * N, 3 * N)); }
const R = 3396.19e3, PPD = META.ppd;
const LAT = new Float64Array(H), LON = new Float64Array(W), DX = new Float64Array(H);
const DY = R * (Math.PI / 180) / PPD;
for (let i = 0; i < H; i++) { LAT[i] = META.lat_n - (i + .5) / PPD; DX[i] = DY * Math.cos(LAT[i] * Math.PI / 180) }
for (let j = 0; j < W; j++) LON[j] = META.lon_w + (j + .5) / PPD;
const MIN_DX = Math.min(...DX);

//dia chat USGS SIM 3292 (grid don vi, he so)
const GU = GEO_DATA.units, GEO = new Uint8Array(N), GF = new Float32Array(GU.map(u => u.f));
{ let o = 0; for (const tk of GEO_DATA.rle.split(",")) { if (!tk) continue; const v = +tk[0], n = parseInt(tk.slice(1), 16); GEO.fill(v, o, o + n); o += n }
 if (o !== N) console.warn("GEO length", o, N) }
const GEO_RGB = GU.map(u => [1, 3, 5].map(k => parseInt(u.color.slice(k, k + 2), 16)));
const VIK_IMG = new Image(); VIK_IMG.src = "__VIKING_JPG__";
const VIK_REF = __VIK_REF__;
VIK_IMG.onload = () => { if (st.layer === "img") {paintRaster(); V3D.terrainDirty(); drawMini() } };
const vikReady = () => VIK_IMG.complete && VIK_IMG.naturalWidth > 0;
const STRUCT_NAME = ["vách xói mòn", "trục rãnh sụt (graben)", "dòng dung nham thùy", "vành hõm chảo", "gờ yardang", "trục lòng dẫn", "gờ"];
function drawGeoOverlay(ctx, sx, sy, labels) {
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const pass of [0, 1]) for (const s of GEO_DATA.struct) {
    ctx.beginPath(); for (let k = 1; k < s.length; k += 2) { const x = s[k] * sx, y = s[k + 1] * sy; k === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
    ctx.strokeStyle = pass ? (s[0] === 3 ? "#ffffff" : "rgba(21,25,29,.9)") : "rgba(255,255,255,.45)";
    ctx.lineWidth = (pass ? 1.1 : 2.6) * Math.max(1, sx / 2.2); ctx.stroke() }
   if (labels) {
    const fs = Math.round(7.5 * sx); ctx.font = `700 ${fs}px 'IBM Plex Mono', ui-monospace, monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const [k, i, j] of GEO_DATA.labels) { const x = (j + .5) * sx, y = (i + .5) * sy, t = GU[k].code, w = ctx.measureText(t).width + fs * .7;
      ctx.fillStyle = "rgba(22,15,11,.78)"; ctx.fillRect(x - w / 2, y - fs * .72, w, fs * 1.44); ctx.fillStyle = "#ffffff"; ctx.fillText(t, x, y + fs * .05) } }
  ctx.restore();
}
//cac doan cua tuyen theo dvi dia chat
function geoSegments(path, dist) {
  const out = []; if (!path || path.length < 2) return out;
  let u = GEO[path[0]], a = 0, k0 = 0;
  for (let k = 1; k <= path.length; k++) {
    const v = k < path.length ? GEO[path[k]] : -1;
    if (v !== u) { const b = dist[Math.min(k, path.length - 1)] / 1000; out.push({ u, a, b, k0, k1: Math.min(k, path.length - 1) }); u = v; a = b; k0 = k }
  }
  return out;
}

//do doc, huong
const SLOPE = new Float32Array(N), ASPECT = new Float32Array(N), PRES = new Float32Array(N);
{ const z = (i, j) => Z[Math.min(H - 1, Math.max(0, i)) * W + Math.min(W - 1, Math.max(0, j))];
  for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
    const a = z(i-1,j-1), b = z(i-1,j), c = z(i-1,j+1), d = z(i,j-1), f = z(i,j+1), g = z(i+1,j-1), h = z(i+1,j), k = z(i+1,j+1);
    const dzdx = ((c + 2*f + k) - (a + 2*d + g)) / (8 * DX[i]);
    const dzdy = ((g + 2*h + k) - (a + 2*b + c)) / (8 * DY);
    const n = i * W + j;
    SLOPE[n] = Math.atan(Math.hypot(dzdx, dzdy)) * 180 / Math.PI;
    ASPECT[n] = ((Math.atan2(-dzdx, dzdy) * 180 / Math.PI) + 360) % 360;
    PRES[n] = 610 * Math.exp(-Z[n] / 11100);
  } }

//nhiet do giua trua
const TN = new Float32Array(N);
function solar(Ls) {
  const e = .0934, a = 1.5237, r = a * (1 - e*e) / (1 + e * Math.cos((Ls - 251) * Math.PI / 180));
  return { S: 1361 / (r*r), decl: Math.asin(Math.sin(25.19 * Math.PI / 180) * Math.sin(Ls * Math.PI / 180)) * 180 / Math.PI };
}
function flux(lat, sl, asp, z, S, decl) {
  const P = META.params, zen = Math.abs(lat - decl) * Math.PI / 180, mu0 = Math.max(Math.cos(zen), .05);
  const sunAz = lat >= decl ? 180 : 0, s = sl * Math.PI / 180;
  const cosi = Math.max(0, Math.cos(s) * mu0 + Math.sin(s) * Math.sin(zen) * Math.cos((sunAz - asp) * Math.PI / 180));
  const tau = P.tau0 * Math.exp(-(z - P.ref_elev_m) / P.dust_H_m);
  const direct = cosi * Math.exp(-tau / mu0);
  const diffuse = .5 * mu0 * (1 - Math.exp(-tau / mu0)) * Math.cos(s / 2) ** 2;
  const ir = (1 - Math.exp(-.5 * tau)) * 5.670e-8 * 210 ** 4;
  return (1 - P.albedo) * S * (direct + diffuse) + ir;
}
function computeTemp(Ls) {
  const P = META.params, { S, decl } = solar(Ls), sig = P.emissivity * 5.670e-8;
  const Tref = (flux(P.ref_lat, 0, 0, P.ref_elev_m, S, decl) / sig) ** .25;
  const K = (P.T_noon_ref_C + 273.15) / Tref;
  for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) { const n = i*W + j;
    TN[n] = (flux(LAT[i], SLOPE[n], ASPECT[n], Z[n], S, decl) / sig) ** .25 * K - 273.15 }
}

//A*
const NB = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
function astar(src, dst, mode, p) {
  const g = new Float64Array(N).fill(Infinity), par = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const hq = [], hk = [];               // binary heap: keys + nodes
  const push = (k, v) => { hq.push(v); hk.push(k); let c = hq.length - 1;
       while (c > 0) { const pr = (c - 1) >> 1; if (hk[pr] <= hk[c]) break;
      [hk[pr], hk[c]] = [hk[c], hk[pr]]; [hq[pr], hq[c]] = [hq[c], hq[pr]]; c = pr } };
  const pop = () => { const top = hq[0], lk = hk.pop(), lv = hq.pop();
    if (hq.length) { hq[0] = lv; hk[0] = lk; let c = 0;
      for (;;) { const l = 2*c + 1, r = l + 1; let m = c;
        if (l < hq.length && hk[l] < hk[m]) m = l; if (r < hq.length && hk[r] < hk[m]) m = r;
        if (m === c) break; [hk[m], hk[c]] = [hk[c], hk[m]]; [hq[m], hq[c]] = [hq[c], hq[m]]; c = m } }
    return top };
  const di0 = Math.floor(dst / W), dj0 = dst % W;
  const heur = n => Math.hypot((Math.floor(n / W) - di0) * DY, (n % W - dj0) * MIN_DX);
  g[src] = 0; push(heur(src), src); let expanded = 0;
  while (hq.length) {
    const u = pop(); if (closed[u]) continue; closed[u] = 1; expanded++;
    if (u === dst) break;
    const ui = Math.floor(u / W), uj = u % W;
    for (const [di, dj] of NB) {
      const vi = ui + di, vj = uj + dj; if (vi < 0 || vi >= H || vj < 0 || vj >= W) continue;
      const v = vi * W + vj; if (closed[v]) continue;
      const hd = Math.hypot(DX[ui] * dj, DY * di), dz = Z[v] - Z[u], d3 = Math.hypot(hd, dz);
      let c;
      if (mode === "shortest") c = d3;
      else { const s = SLOPE[v]; if (s > p.maxs) continue;
        const cold = Math.min(Math.max((META.params.T_comfort_C - TN[v]) / 40, 0), 1);
        c = d3 * (1 + p.ws * (s / p.maxs) ** 2) * (1 + p.wc * cold) * (1 + p.wg * GF[GEO[v]]) + p.wl * Math.max(dz, 0) * 10 }
      const ng = g[u] + c; if (ng < g[v]) { g[v] = ng; par[v] = u; push(ng + heur(v), v) }
    }
  }
 if (!closed[dst]) return { path: null, expanded };
  const path = [dst]; let n = dst; while (n !== src) { n = par[n]; path.push(n) }
  return { path: path.reverse(), expanded };
}
function metrics(path, maxs) {
  let L = 0, climb = 0, smax = 0, ssum = 0, tmin = Infinity, over = 0; const dist = [0], gkm = new Float64Array(GU.length);
  for (let k = 0; k < path.length; k++) { const n = path[k];
    smax = Math.max(smax, SLOPE[n]); ssum += SLOPE[n]; tmin = Math.min(tmin, TN[n]); if (SLOPE[n] > maxs) over++;
    if (k) { const m = path[k-1], i = Math.floor(m / W), di = Math.floor(n / W) - i, dj = n % W - m % W;
      const hd = Math.hypot(DX[i] * dj, DY * di), dz = Z[n] - Z[m], dl = Math.hypot(hd, dz); L += dl; climb += Math.max(dz, 0); dist.push(L); gkm[GEO[n]] += dl / 1000 } }
  return { L: L / 1000, climb, smax, smean: ssum / path.length, tmin, over, dist, gkm };
}

//color
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function rampFn(stops) { // stops: [[t, "#hex"], ...]
  const s = stops.map(([t, h]) => [t, parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]);
  return t => { t = Math.min(1, Math.max(0, t)); let k = 1; while (k < s.length - 1 && s[k][0] < t) k++;
    const a = s[k-1], b = s[k], u = (t - a[0]) / (b[0] - a[0] || 1);
    return [a[1] + (b[1]-a[1])*u, a[2] + (b[2]-a[2])*u, a[3] + (b[3]-a[3])*u] };
}
const RAMPS = {
  elev:  { f: rampFn([[0,"#2b3a67"],[.18,"#4b5d84"],[.35,"#7c8590"],[.55,"#b4a77a"],[.8,"#d9c46b"],[1,"#f4e8a3"]]), lo: -4, hi: 21, unit: "Độ cao (km, so với areoid)" },
  slope: { f: rampFn([[0,"#fdf1ea"],[.2,"#f6b08f"],[.45,"#eb6834"],[.75,"#b8461c"],[1,"#5e210a"]]), lo: 0, hi: 20, unit: "Độ dốc (°)" },
  temp:  { f: rampFn([[0,"#184f95"],[.3,"#6da7ec"],[.5,"#ecebe7"],[.7,"#f6b08f"],[1,"#a83d16"]]), lo: -25, hi: 25, unit: "Nhiệt độ bề mặt giữa trưa (°C, mô hình)" },
  site:  { f: rampFn([[0,"#d7e6f8"],[.4,"#86b6ef"],[.7,"#2a78d6"],[1,"#0d366b"]]), lo: 0, hi: 1, unit: "Điểm phù hợp hạ cánh (trung bình trong elip)" },
};
// hillshade
const HS = new Float32Array(N);
{ const az = 315 * Math.PI / 180, alt = 35 * Math.PI / 180, ve = 4;
  for (let n = 0; n < N; n++) { const s = Math.atan(Math.tan(SLOPE[n] * Math.PI / 180) * ve), a = ASPECT[n] * Math.PI / 180;
    HS[n] = Math.max(0, Math.sin(alt) * Math.cos(s) + Math.cos(alt) * Math.sin(s) * Math.cos(az - a)) } }


//mo hinh hanh trinh: oxy, nhien lieu, buc xa,...
const GM = 3.721, SOL_H = 24.66;           // gia toc trong truong Sao Hoa (m/s2), do dai 1 sol (gio Trai Dat)
const MDL = {
  crr: 0.12, eta: 0.75, regen: 0.25,       // he so lan tren regolith, hieu suat truyen dong, thu hoi khi xuong doc
  eFuel: 1.39,                             // kWh dien / kg nhien lieu CH4+O2 (pin nhien lieu ~50%)
  pDrive: 0.45, pRest: 0.25,               // tai nen (kW): may tinh, lien lac, he thong song
  kHeatDrive: 0.010, kHeatRest: 0.006, tHeat: 15, // suoi (kW moi do duoi tHeat °C); ban dem trong leu nen it hon
  o2Rest: 0.030, o2Drive: 0.040, o2Slope: 0.0025, o2Leak: 0.003, // kg O2 / gio / nguoi
  dose0: 0.64 / 24,                        // mSv/gio o Gale (-4,4 km), RAD tren Curiosity
  pGale: 610 * Math.exp(4400 / 11100),
  doseLimit: 600, vSlope: 0.15, startH: 8, reserve: 1.1,
};
const cfg = { crew: 2, mass: 1400, o2: 45, fuel: 400, vmax: 10, driveH: 6 };

const localH = t => { let tm = t % SOL_H; if (SOL_H - tm < 1e-6) tm = 0; return (MDL.startH + tm / SOL_H * 24) % 24 };
const sunElev = h => h >= 6 && h <= 18 ? Math.sin(Math.PI * (h - 6) / 12) : -Math.sin(Math.PI * (((h - 18 + 24) % 24) / 12));
const dayF = h => Math.max(0, sunElev(h));
const tExt = (t, c) => TN[c] - 80 * (1 - dayF(localH(t)));
const doseRate = c => MDL.dose0 * (1 + .5 * (1 - Math.min(1, PRES[c] / MDL.pGale)));   // mSv/gio
const speedAt = s => cfg.vmax / (1 + MDL.vSlope * s);                                     // km/h
const tractionKWh = (hd, dz) => { const mg = cfg.mass * GM;
  return Math.max(0, (mg * MDL.crr * hd + mg * Math.max(dz, 0)) / MDL.eta - MDL.regen * mg * Math.max(-dz, 0)) / 3.6e6 };

function makeSegs(path) {
  const segs = [];
  for (let k = 0; k + 1 < path.length; k++) {
    const u = path[k], v = path[k + 1], i = Math.floor(u / W), di = Math.floor(v / W) - i, dj = v % W - u % W;
    const hd = Math.hypot(DX[i] * dj, DY * di), dz = Z[v] - Z[u], len = Math.hypot(hd, dz), s = SLOPE[v], vk = speedAt(s);
    segs.push({ u, v, hd, dz, len, s, vk, dh: len / 1000 / vk, e: tractionKWh(hd, dz), ang: Math.atan2(dz, hd),
      o2h: cfg.crew * (MDL.o2Drive + MDL.o2Slope * s + MDL.o2Leak) });
  }
  return segs;
}

// Luong can de di nguoc tu nut k ve nut 0 (co du tru 10%)
function returnNeeds(path, segs, avgPd, avgPr) {
const n = path.length, o2 = new Float64Array(n), fuel = new Float64Array(n);
  let drv = 0, tr = 0, o2d = 0;
  for (let k = 1; k < n; k++) {
    const g = segs[k - 1], sR = SLOPE[g.u], dhR = g.len / 1000 / speedAt(sR);
    drv += dhR; tr += tractionKWh(g.hd, -g.dz); o2d += cfg.crew * (MDL.o2Drive + MDL.o2Slope * sR + MDL.o2Leak) * dhR;
    const restH = Math.max(0, Math.ceil(drv / cfg.driveH - 1e-9) - 1) * (SOL_H - cfg.driveH);
    o2[k] = (o2d + restH * cfg.crew * (MDL.o2Rest + MDL.o2Leak)) * MDL.reserve;
    fuel[k] = (tr + drv * avgPd + restH * avgPr) / MDL.eFuel * MDL.reserve;
  }
  return { o2, fuel };
}

function buildMission(path, init, mode) {
  const segs = makeSegs(path), n = path.length, kf = [], nodeKf = new Int32Array(n).fill(-1);
  let t = init.t, o2 = init.o2, fuel = init.fuel, dose = init.dose, d = 0, pos = 0, fail = null;
  let eD = 0, hD = 0, eR = 0, hR = 0;
  kf.push({ t, pos, d, o2, fuel, dose, ph: "drive" }); nodeKf[0] = 0;
  const step = (dt, dO2, dF, dDose, ph, dPos, dDist) => {
    let x = 1;
    if (dO2 > 0 && o2 - dO2 < 0) x = Math.min(x, o2 / dO2);
    if (dF > 0 && fuel - dF < 0) x = Math.min(x, fuel / dF);
    t += dt * x; o2 = Math.max(0, o2 - dO2 * x); fuel = Math.max(0, fuel - dF * x); dose += dDose * x; pos += dPos * x; d += dDist * x;
    kf.push({ t, pos, d, o2, fuel, dose, ph });
    if (x < 1) { fail = { type: o2 <= 1e-9 ? "o2" : "fuel", t, pos, d }; return false }
    return true };
outer: for (let k = 0; k < segs.length; k++) {
    const g = segs[k]; let f = 1;
    while (f > 1e-9) {
      let tm = t % SOL_H; if (SOL_H - tm < 1e-6) tm = 0;
      if (tm >= cfg.driveH - 1e-7) {                      
        const tEnd = t - tm + SOL_H, c = f < .5 ? g.v : g.u;
        while (t < tEnd - 1e-7) { const dt = Math.min(1, tEnd - t);
          const P = MDL.pRest + MDL.kHeatRest * Math.max(0, MDL.tHeat - tExt(t + dt / 2, c)); eR += P * dt; hR += dt;
          if (!step(dt, cfg.crew * (MDL.o2Rest + MDL.o2Leak) * dt, P * dt / MDL.eFuel, doseRate(c) * dt, "rest", 0, 0)) break outer }
        continue }
      const take = Math.min(g.dh * f, cfg.driveH - tm), fr = take / g.dh;
      const P = MDL.pDrive + MDL.kHeatDrive * Math.max(0, MDL.tHeat - tExt(t + take / 2, g.v)); eD += P * take; hD += take;
      if (!step(take, g.o2h * take, (g.e * fr + P * take) / MDL.eFuel, doseRate(g.v) * take, "drive", fr, g.len * fr)) break outer;
      f -= fr;
      if (f <= 1e-9) { pos = k + 1; kf[kf.length - 1].pos = pos; nodeKf[k + 1] = kf.length - 1 }
    }
  }
 const avgPd = hD ? eD / hD : MDL.pDrive + .3, avgPr = hR ? eR / hR : MDL.pRest + .4;
  const M = { path, segs, kf, nodeKf, fail, mode, t0: init.t, init, tEnd: kf.at(-1).t, done: !fail,
    totalKm: segs.reduce((a, g) => a + g.len, 0) / 1000, avgPd, avgPr, pnr: null };
  // nhu cau quay ve + diem khong the quay ve
  if (mode === "return") {
    const rp = path.slice().reverse(), rn = returnNeeds(rp, makeSegs(rp), avgPd, avgPr);
    M.need = { o2: new Float64Array(n), fuel: new Float64Array(n) };
    for (let k = 0; k < n; k++) { M.need.o2[k] = rn.o2[n - 1 - k]; M.need.fuel[k] = rn.fuel[n - 1 - k] }
  } else {
    M.need = returnNeeds(path, segs, avgPd, avgPr);
    for (let k = 1; k < n; k++) { const q = nodeKf[k]; if (q < 0) break;
      if (kf[q].o2 < M.need.o2[k] || kf[q].fuel < M.need.fuel[k]) {
        M.pnr = { k, d: kf[q].d, t: kf[q].t, why: kf[q].o2 < M.need.o2[k] ? "oxy" : "nhiên liệu" }; break } }
  }
  return M;
}

function lowerIdx(arr, t) { let lo = 0, hi = arr.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m].t <= t) lo = m; else hi = m - 1 } return lo }

function stateAt(M, t) {
  const kf = M.kf; t = Math.min(Math.max(t, M.t0), M.tEnd);
  const a = lowerIdx(kf, t), b = Math.min(a + 1, kf.length - 1), A = kf[a], B = kf[b];
  const u = B.t > A.t ? (t - A.t) / (B.t - A.t) : 0, L = (x, y) => x + (y - x) * u;
  const pos = L(A.pos, B.pos), nseg = M.segs.length;
  const k = Math.min(Math.floor(pos), Math.max(0, nseg - 1)), fr = nseg ? Math.min(1, pos - k) : 0, g = M.segs[k];
  const cu = g ? g.u : M.path[0], cv = g ? g.v : M.path[0];
  const c = fr < .5 ? cu : cv;
  const ph = t >= M.tEnd - 1e-9 ? "end" : B.ph;
  const iu = Math.floor(cu / W), ju = cu % W, iv = Math.floor(cv / W), jv = cv % W;
  let tm = t % SOL_H; if (SOL_H - tm < 1e-6) tm = 0;
  const nk = Math.min(M.path.length - 1, Math.floor(pos)), nk2 = Math.min(M.path.length - 1, nk + 1), w = pos - nk;
  return { t, pos, d: L(A.d, B.d), o2: L(A.o2, B.o2), fuel: L(A.fuel, B.fuel), dose: L(A.dose, B.dose), ph, cell: c, seg: g,
    gi: iu + (iv - iu) * fr + .5, gj: ju + (jv - ju) * fr + .5, z: Z[cu] + (Z[cv] - Z[cu]) * fr,
    slope: g ? g.s : SLOPE[c], ang: g ? g.ang : 0, speed: ph === "drive" ? (g ? g.vk : 0) : 0,
    todayH: ph === "drive" ? Math.min(tm, cfg.driveH) : (tm < cfg.driveH ? tm : cfg.driveH),
    h: localH(t), sol: Math.floor((t + 1e-6) / SOL_H) + 1, text: tExt(t, c), rate: doseRate(c),
    needO2: M.need.o2[nk] + (M.need.o2[nk2] - M.need.o2[nk]) * w, needFuel: M.need.fuel[nk] + (M.need.fuel[nk2] - M.need.fuel[nk]) * w };
}

// sinh hieu mo phong (tat dinh theo thoi gian de tua lai van ra cung ket qua)
function vitals(s, who) {
  const base = who ? 66 : 71, sd = who ? 3.7 : 1.3, T = s.t;
  const nz = c => Math.sin(T * 2.3 + sd + c) * .55 + Math.sin(T * 5.9 + sd * 2.1 + c) * .3 + Math.sin(T * 13.1 + sd * 3.3 + c) * .15;
  const o2f = cfg.o2 > 0 ? s.o2 / cfg.o2 : 0, hyp = o2f < .08 ? (.08 - o2f) / .08 : 0;
  let hr, rr, bt, sp;
  if (s.ph === "drive") { hr = base + 2.4 * s.slope + 1.1 * s.todayH + 4 * nz(0); rr = 14 + .35 * s.slope + .8 * nz(1); bt = 36.8 + .025 * s.slope + .06 * nz(2) }
  else { hr = base - 12 + 2 * nz(0); rr = 12 + .5 * nz(1); bt = 36.5 + .05 * nz(2) }
  hr += 30 * hyp; rr += 10 * hyp; sp = 98 + .4 * nz(3) - 12 * hyp;
  const ff = cfg.fuel > 0 ? s.fuel / cfg.fuel : 0, cold = ff < .05 ? (.05 - ff) / .05 : 0;   // can nhien lieu -> giam suoi
  bt -= 1.3 * cold; hr += 8 * cold;
  return { hr, rr, bt, sp };
}

const fmtN = (v, d = 0) => { let r = Math.round(v * 10 ** d) / 10 ** d; if (r === 0) r = 0; return r.toLocaleString("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d }) };
const clock = s => { const h = s.h, hh = Math.floor(h), mm = Math.floor((h - hh) * 60); return `Sol ${s.sol} · ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}` };

function buildEvents(M, startLabel) {
  const ev = [], crewN = cfg.crew, flag = {};
  const s0 = stateAt(M, M.t0);
  ev.push({ t: M.t0, l: "info", m: startLabel });
  let lastDose = s0.dose, coldDone = false;
  for (let t = M.t0; t <= M.tEnd + 1e-9; t += .1) {
    const s = stateAt(M, Math.min(t, M.tEnd)), o2f = s.o2 / cfg.o2, ff = s.fuel / cfg.fuel;
    for (let w = 0; w < crewN; w++) { const v = vitals(s, w), who = w ? "PHG-2" : "PHG-1";
      if (!flag["hr" + w] && v.hr > 108) { flag["hr" + w] = 1;
        ev.push({ t: s.t, l: "warn", m: `${who}: nhịp tim ${fmtN(v.hr)} lần/phút khi leo dốc ${fmtN(s.slope, 1)}° sau ${fmtN(s.todayH, 1)} giờ lái. Giảm tốc và nghỉ 15 phút.` }) }
      else if (flag["hr" + w] && v.hr < 98) flag["hr" + w] = 0;
if (!flag["sp" + w] && v.sp < 94) { flag["sp" + w] = 1; ev.push({ t: s.t, l: "crit", m: `${who}: SpO₂ ${fmtN(v.sp)}% – thiếu oxy. Chuyển sang bình dự phòng, giảm gắng sức.` }) } }
    for (const [key, f, lim, lv, txt] of [["o25", o2f, .25, "warn", "Oxy còn 25%"], ["o10", o2f, .10, "crit", "Oxy còn 10%"],
      ["f25", ff, .25, "warn", "Nhiên liệu còn 25%"], ["f10", ff, .10, "crit", "Nhiên liệu còn 10%"]])
      if (!flag[key] && f < lim) { flag[key] = 1;
        const hrs = key[0] === "o" ? s.o2 / (cfg.crew * (MDL.o2Rest + MDL.o2Leak + .005)) : null;
        ev.push({ t: s.t, l: lv, m: `${txt} (${fmtN(key[0] === "o" ? s.o2 : s.fuel, 1)} kg)` + (hrs ? `, đủ thở thêm khoảng ${fmtN(hrs)} giờ.` : ".") }) }
    for (const lim of [5, 10, 20, 50, 100]) if (lastDose < lim && s.dose >= lim)
      ev.push({ t: s.t, l: "info", m: `Liều bức xạ tích lũy đạt ${lim} mSv (${fmtN(lim / MDL.doseLimit * 100, 1)}% giới hạn cả sự nghiệp 600 mSv).` });
    lastDose = s.dose;
    if (!coldDone && s.text < -70) { coldDone = true; ev.push({ t: s.t, l: "info", m: `Đêm lạnh ${fmtN(s.text)} °C: tăng sưởi pin và bộ đồ, kiểm tra găng tay và ủng.` }) }
    if (M.pnr && !flag.pnr && s.d >= M.pnr.d - 1) { flag.pnr = 1;
      ev.push({ t: s.t, l: "warn", m: `Qua điểm không thể quay về ở km ${fmtN(M.pnr.d / 1000)}: từ đây ${M.pnr.why} không đủ để quay lại A.` }) }
  }
 const e = stateAt(M, M.tEnd);
  if (M.fail) ev.push({ t: M.tEnd, l: "crit", m: M.fail.type === "o2"
      ? `Hết oxy ở km ${fmtN(M.fail.d / 1000)}. Nhiệm vụ thất bại: cần mang thêm oxy hoặc chọn đích gần hơn.`
      : `Hết nhiên liệu ở km ${fmtN(M.fail.d / 1000)}: rover dừng, mất sưởi. Oxy còn ${fmtN(e.o2, 1)} kg, đủ chờ cứu hộ khoảng ${fmtN(e.o2 / (cfg.crew * (MDL.o2Rest + MDL.o2Leak)))} giờ.` });
  else ev.push({ t: M.tEnd, l: "good", m: M.mode === "return" ? `Về đến A an toàn. Còn ${fmtN(e.o2, 1)} kg oxy và ${fmtN(e.fuel)} kg nhiên liệu.`
      : `Đến B. Còn ${fmtN(e.o2, 1)} kg oxy (${fmtN(e.o2 / cfg.o2 * 100)}%) và ${fmtN(e.fuel)} kg nhiên liệu (${fmtN(e.fuel / cfg.fuel * 100)}%).` });
  return ev.sort((a, b) => a.t - b.t);
}

// KHUNG 3D (three.js r128) 
const ROUTE = { opt: "#2f86e8", short: "#e8642a", ret: "#d8344a", rover: "#e0662d" };
const V3D = (() => {
  const api = { ok: false, need: true, mode: "follow" };
  const noop = () => {};
 if (typeof THREE === "undefined") {
    ["frame", "routesChanged", "missionChanged", "terrainDirty", "setVE", "setView", "poke", "setPick", "profHover", "focusCell"].forEach(k => api[k] = noop);
    api.camInfo = () => null;
    api.init = () => { const m = $("v3msg"); m.hidden = false; m.textContent = "Không tải được thư viện 3D (three.js). Kiểm tra kết nối mạng rồi tải lại trang. Các bảng số liệu và bản đồ nhỏ vẫn dùng được."; return false };
    return api;
  }
  const V = THREE.Vector3;
  const ROVER_X = 450, MS = ROVER_X / 1000, RL = 4.2 * MS;   // Rover phong to x450: 1 m mo hinh = 0,45 km the gioi
  const DYk = DY / 1000;
  let VE = 3;
  const lin = h => new THREE.Color(h).convertSRGBToLinear();
  const latOf = gi => META.lat_n - gi / PPD;
  const cosAt = gi => Math.cos(latOf(gi) * Math.PI / 180);
  const g2w = (gi, gj) => [(gj - W / 2) * DYk * cosAt(gi), (gi - H / 2) * DYk];
  const w2g = (x, z) => { const gi = z / DYk + H / 2; return [gi, x / (DYk * cosAt(gi)) + W / 2] };
  const cellXZ = n => g2w(Math.floor(n / W) + .5, n % W + .5);
  const inGrid = (x, z) => { const g = w2g(x, z); return g[0] >= .5 && g[0] <= H - .5 && g[1] >= .5 && g[1] <= W - .5 };
function heightAt(x, z) {            // khop dung voi tam giac cua luoi dia hinh
    const g = w2g(x, z); let fi = g[0] - .5, fj = g[1] - .5;
    fi = Math.min(H - 1.0001, Math.max(0, fi)); fj = Math.min(W - 1.0001, Math.max(0, fj));
    const i = fi | 0, j = fj | 0, u = fj - j, v = fi - i, a = i * W + j;
    const za = Z[a], zb = Z[a + 1], zc = Z[a + W], zd = Z[a + W + 1];
    const h = u + v <= 1 ? za + (zb - za) * u + (zc - za) * v : zd + (zc - zd) * (1 - u) + (zb - zd) * (1 - v);
    return h / 1000 * VE;
  }
  const angD = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d };

  let renderer, scene, cam, terrain, terrainMat, skirt, tex, texCv, skyMat, sky, stars, starMat, sun, hemi, fog;
  let lineOpt = null, lineShort = null, lineRet = null, rv = null, rocks = null, envTex = null;
  let vpW = 1, vpH = 1, snapRover = true, snapCam = true, realign = false, lastHover = -2, framed = false;
  const SPR = [], ENV = [], dust = [], mk = { sites: [], geo: [] };
  const sunDir = new V(0, 1, 0);

  //dia hinh
  const uDetail = { value: RL * .1 }, uFade = { value: new THREE.Vector2(RL * 9, RL * 40) };
  function detailShader(sh) {
    sh.uniforms.uDetail = uDetail; sh.uniforms.uFade = uFade;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
varying vec3 vWP; uniform float uDetail; uniform vec2 uFade;
float hh(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  return mix(mix(hh(i), hh(i + vec2(1., 0.)), u.x), mix(hh(i + vec2(0., 1.)), hh(i + vec2(1., 1.)), u.x), u.y); }`)
      .replace("#include <map_fragment>", `#include <map_fragment>
{ float dd = distance(vWP, cameraPosition), kk = 1. - smoothstep(uFade.x, uFade.y, dd);
  if (kk > 0.) { vec2 q = vWP.xz / uDetail;
    float nn = vn(q) * .55 + vn(q * 2.63 + 7.1) * .3 + vn(q * 7.1 + 3.3) * .15;
    diffuseColor.rgb *= mix(1., .72 + .52 * nn, kk); } }`);
  }
function buildTerrain() {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), uv = new Float32Array(N * 2);
    for (let i = 0; i < H; i++) { const c = DYk * Math.cos(LAT[i] * Math.PI / 180), z = (i + .5 - H / 2) * DYk;
      for (let j = 0; j < W; j++) { const n = i * W + j; pos[3 * n] = (j + .5 - W / 2) * c; pos[3 * n + 2] = z; uv[2 * n] = (j + .5) / W; uv[2 * n + 1] = 1 - (i + .5) / H } }
    const idx = new Uint32Array((H - 1) * (W - 1) * 6); let q = 0;
    for (let i = 0; i < H - 1; i++) for (let j = 0; j < W - 1; j++) {
      const a = i * W + j, b = a + 1, c = a + W, d = c + 1;
      idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    texCv = document.createElement("canvas"); texCv.width = W * 4; texCv.height = H * 4;
    tex = new THREE.CanvasTexture(texCv); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    terrainMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
    terrainMat.onBeforeCompile = detailShader;
    terrain = new THREE.Mesh(geo, terrainMat); terrain.receiveShadow = true; scene.add(terrain);
    skirt = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: lin("#2b1a11"), side: THREE.DoubleSide }));
    scene.add(skirt);
    setHeights(); paintTex();
  }
  function setHeights() {
    const g = terrain.geometry, p = g.attributes.position;
    for (let n = 0; n < N; n++) p.array[3 * n + 1] = Z[n] / 1000 * VE;
    p.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
    const ring = []; for (let j = 0; j < W; j++) ring.push(j); for (let i = 1; i < H; i++) ring.push(i * W + W - 1);
    for (let j = W - 2; j >= 0; j--) ring.push((H - 1) * W + j); for (let i = H - 2; i >= 0; i--) ring.push(i * W);
    const P = p.array, base = -6 * VE - 2, arr = new Float32Array((ring.length - 1) * 18);
    for (let k = 0; k + 1 < ring.length; k++) { const a = 3 * ring[k], b = 3 * ring[k + 1];
      arr.set([P[a], P[a + 1], P[a + 2], P[a], base, P[a + 2], P[b], P[b + 1], P[b + 2], P[b], P[b + 1], P[b + 2], P[a], base, P[a + 2], P[b], base, P[b + 2]], 18 * k) }
    skirt.geometry.dispose(); const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(arr, 3)); skirt.geometry = sg;
  }
  const off3 = document.createElement("canvas"); off3.width = W; off3.height = H;
  function paintTex() {
    const ctx = off3.getContext("2d"), img = ctx.createImageData(W, H), d = img.data, r = RAMPS[st.layer];
    for (let n = 0; n < N; n++) { let rgb;
      if (st.layer === "surf") { const k = 1 - .22 * Math.min(1, SLOPE[n] / 12); rgb = r.f((Z[n] / 1000 - r.lo) / (r.hi - r.lo)).map(x => x * k) }
      else if (st.layer === "elev") rgb = r.f((Z[n] / 1000 - r.lo) / (r.hi - r.lo));
      else if (st.layer === "slope") rgb = r.f(SLOPE[n] / r.hi);
      else if (st.layer === "temp") rgb = r.f((TN[n] - r.lo) / (r.hi - r.lo));
      else if (st.layer === "geo") { const k = .72 + .36 * HS[n]; rgb = GEO_RGB[GEO[n]].map(x => x * k) }
      else if (st.layer === "img") rgb = [176, 124, 104];
      else { const q = SITE[n]; rgb = q > 1 ? r.f((q - 1) / 254) : [190, 181, 171] }
      d[4 * n] = rgb[0]; d[4 * n + 1] = rgb[1]; d[4 * n + 2] = rgb[2]; d[4 * n + 3] = 255 }
    ctx.putImageData(img, 0, 0);
    const t = texCv.getContext("2d"), TW = texCv.width, TH = texCv.height;
    t.imageSmoothingEnabled = true; t.drawImage(off3, 0, 0, TW, TH);
    if (st.layer === "img" && vikReady()) t.drawImage(VIK_IMG, 0, 0, TW, TH);
    const m = document.createElement("canvas"); m.width = TW; m.height = TH; const mc = m.getContext("2d");
    mc.imageSmoothingEnabled = false; mc.drawImage(hatch, 0, 0, TW, TH); mc.globalCompositeOperation = "source-in";
    mc.strokeStyle = "rgba(30,14,6,.5)"; mc.lineWidth = 1.5; mc.beginPath();
    for (let x = -TH; x < TW; x += 6) { mc.moveTo(x, TH); mc.lineTo(x + TH, 0) } mc.stroke();
    t.drawImage(m, 0, 0);
    t.strokeStyle = "rgba(255,255,255,.1)"; t.lineWidth = 1.3; t.beginPath();
    for (let la = 10; la < META.lat_n; la += 2) { const y = (META.lat_n - la) * PPD * 4; t.moveTo(0, y); t.lineTo(TW, y) }
    for (let lo = 214; lo < META.lon_e; lo += 2) { const x = (lo - META.lon_w) * PPD * 4; t.moveTo(x, 0); t.lineTo(x, TH) }
    t.stroke(); if (st.layer === "geo") drawGeoOverlay(t, 4, 4, true); tex.needsUpdate = true; api.need = true;
  }

  // Bau troi, sao, anh sang
  const C = { zd: lin("#c4a07f"), hd: lin("#e4c9a6"), zn: lin("#03050b"), hn: lin("#111a2c"), bl: lin("#86aedb"),
    sunW: lin("#fff1dc"), sunD: lin("#ffb27a"), hsD: lin("#f1dcc4"), hsN: lin("#7a8fc0"), hgD: lin("#6e4a33"), hgN: lin("#2a2018") };
  const skyU = { uSun: { value: new V(0, 1, 0) }, uDay: { value: 1 }, uDusk: { value: 0 },
    cZD: { value: C.zd }, cHD: { value: C.hd }, cZN: { value: C.zn }, cHN: { value: C.hn }, cBl: { value: C.bl } };
  function buildSky() {
    skyMat = new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, toneMapped: false,
      vertexShader: "varying vec3 vD; void main() { vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }",
      fragmentShader: `uniform vec3 uSun, cZD, cHD, cZN, cHN, cBl; uniform float uDay, uDusk; varying vec3 vD;
void main() { vec3 d = normalize(vD); float h = max(d.y, 0.);
  vec3 col = mix(mix(cHN, cHD, uDay), mix(cZN, cZD, uDay), pow(h, .5));
  float sd = max(dot(d, uSun), 0.);
  col += cBl * uDusk * (pow(sd, 5.) * .85 + pow(sd, 40.) * .5);
  col += vec3(1., .94, .82) * (pow(sd, 1500.) * 5. + pow(sd, 70.) * .22 * uDay) * step(-.05, uSun.y);
  gl_FragColor = vec4(col, 1.);
  #include <encodings_fragment>
}` });
    sky = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
    const n = 1500, sp = new Float32Array(n * 3), sz = new Float32Array(n); let sd = 11;
    const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647;
    for (let k = 0; k < n; k++) { const u = rnd(), a = rnd() * Math.PI * 2, y = .03 + .97 * u, r = Math.sqrt(1 - y * y);
      sp.set([r * Math.cos(a) * 9, y * 9, r * Math.sin(a) * 9], 3 * k); sz[k] = 1 + 1.8 * rnd() ** 3 }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(sp, 3)); g.setAttribute("aS", new THREE.BufferAttribute(sz, 1));
    starMat = new THREE.ShaderMaterial({ uniforms: { uOp: { value: 0 }, uPR: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      vertexShader: "attribute float aS; uniform float uPR; varying float vS; void main() { vS = aS; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; gl_PointSize = aS * uPR * 1.4; }",
      fragmentShader: "uniform float uOp; varying float vS; void main() { float a = smoothstep(.5, .12, length(gl_PointCoord - .5)) * uOp * (.35 + .3 * vS); gl_FragColor = vec4(vec3(1.), a); }" });
    stars = new THREE.Points(g, starMat); stars.frustumCulled = false; stars.renderOrder = -9; scene.add(stars);
  }
  function buildLights() {
    sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = RL * .006;
    const c = sun.shadow.camera; c.left = -RL * 3.2; c.right = RL * 3.2; c.top = RL * 3.2; c.bottom = -RL * 3.2; c.near = RL * .5; c.far = RL * 50;
    scene.add(sun, sun.target);
    hemi = new THREE.HemisphereLight(0xffffff, 0x332211, .6); scene.add(hemi);
  }
  const fogDay = [227, 198, 163], fogNight = [17, 26, 44], fogBlue = [143, 169, 201];
  let dayL = 1;
  function updateSky(s) {
    const h = s ? s.h : 10, lat = s ? latOf(s.gi) : 20, decl = solar(+$("ls").value).decl;
    const hA = (h - 12) * 15 * Math.PI / 180, ph = lat * Math.PI / 180, de = decl * Math.PI / 180;
    const E = -Math.cos(de) * Math.sin(hA), No = Math.cos(ph) * Math.sin(de) - Math.sin(ph) * Math.cos(de) * Math.cos(hA);
    const U = Math.sin(ph) * Math.sin(de) + Math.cos(ph) * Math.cos(de) * Math.cos(hA);
    sunDir.set(E, U, -No).normalize();
    const L = clamp((U + .06) / .32, 0, 1), dusk = Math.exp(-(((U - .04) / .13) ** 2)); dayL = L;
    skyU.uSun.value.copy(sunDir); skyU.uDay.value = L; skyU.uDusk.value = dusk;
    starMat.uniforms.uOp.value = clamp(1 - L * 1.8, 0, 1);
    sun.intensity = 1.3 * clamp((U + .02) / .2, 0, 1); sun.color.copy(C.sunW).lerp(C.sunD, dusk * .65);
    hemi.intensity = api.mode === "overview" ? .8 + .1 * L : .34 + .38 * L; hemi.color.copy(C.hsN).lerp(C.hsD, L); hemi.groundColor.copy(C.hgN).lerp(C.hgD, L);
    const f = fogNight.map((v, k) => (v + (fogDay[k] - v) * L) * (1 - dusk * .3) + fogBlue[k] * dusk * .3);
    fog.color.setRGB(f[0] / 255, f[1] / 255, f[2] / 255);
    for (const m of ENV) m.envMapIntensity = m.userData.envI * (.2 + .8 * L);
    const tg = rv && rv.root.visible ? rv.root.position : ctl.tgt;
    sun.target.position.copy(tg); sun.position.copy(tg).addScaledVector(sunDir, RL * 22);
  }

  // Duong tuyen rong theo pixel
  const LVS = `uniform vec2 uRes; uniform float uW; attribute vec3 aPrev; attribute vec3 aNext; attribute float aSide; attribute float aDist;
varying float vDist; varying float vSide;
vec2 sn(vec2 v) { float l = length(v); return l > 1e-6 ? v / l : vec2(1., 0.); }
void main() { vDist = aDist; vSide = aSide;
  mat4 m = projectionMatrix * modelViewMatrix;
  vec4 c = m * vec4(position, 1.), p = m * vec4(aPrev, 1.), n = m * vec4(aNext, 1.);
  vec2 cs = c.xy / max(c.w, 1e-5) * uRes, ps = p.xy / max(p.w, 1e-5) * uRes, ns = n.xy / max(n.w, 1e-5) * uRes;
  vec2 d1 = cs - ps, d2 = ns - cs;
  if (p.w <= 0. || length(d1) < 1e-4) d1 = d2;
  if (n.w <= 0. || length(d2) < 1e-4) d2 = d1;
  vec2 dir = sn(sn(d1) + sn(d2)), nr = vec2(-dir.y, dir.x);
  c.xy += nr * aSide * uW * 2. / uRes * c.w;
  gl_Position = c; }`;
  const LFS = `uniform vec3 uColA, uColB, uHalo; uniform float uProg, uDash, uGap, uAlphaB, uHaloA; varying float vDist; varying float vSide;
void main() { if (uDash > 0. && mod(vDist, uDash + uGap) > uDash) discard;
  bool dn = vDist <= uProg; vec3 col = dn ? uColA : uColB; float a = dn ? 1. : uAlphaB;
  float e = abs(vSide), hb = smoothstep(.52, .68, e);
  col = mix(col, uHalo, hb); a = mix(a, a * uHaloA, hb) * (1. - smoothstep(.84, 1., e));
  gl_FragColor = vec4(col, a);
  #include <encodings_fragment>
}`;
  function makeLine(P, D, o) {
    const n = P.length; if (n < 2) return null;
    const pos = new Float32Array(n * 6), prv = new Float32Array(n * 6), nxt = new Float32Array(n * 6), side = new Float32Array(n * 2), dist = new Float32Array(n * 2);
    for (let k = 0; k < n; k++) { const a = P[k], b = P[Math.max(0, k - 1)], c = P[Math.min(n - 1, k + 1)];
      for (let s = 0; s < 2; s++) { const v = 2 * k + s; pos.set(a, 3 * v); prv.set(b, 3 * v); nxt.set(c, 3 * v); side[v] = s ? 1 : -1; dist[v] = D[k] } }
    const idx = new Uint32Array((n - 1) * 6);
    for (let k = 0; k < n - 1; k++) { const a = 2 * k; idx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], 6 * k) }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aPrev", new THREE.BufferAttribute(prv, 3));
    g.setAttribute("aNext", new THREE.BufferAttribute(nxt, 3)); g.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
    g.setAttribute("aDist", new THREE.BufferAttribute(dist, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    const u = { uRes: { value: new THREE.Vector2(vpW, vpH) }, uW: { value: o.w }, uColA: { value: lin(o.a) }, uColB: { value: lin(o.b || o.a) },
      uHalo: { value: lin(o.halo || "#ffffff") }, uProg: { value: -1 }, uDash: { value: o.dash || 0 }, uGap: { value: o.gap || 0 },
      uAlphaB: { value: o.alphaB ?? 1 }, uHaloA: { value: o.haloA ?? .85 } };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: LVS, fragmentShader: LFS, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh); return mesh;
  }
  const kill = l => { if (l) { scene.remove(l); l.geometry.dispose(); l.material.dispose() } return null };
  const cr = (a, b, c, d, t) => { const t2 = t * t, t3 = t2 * t; return .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3) };
  function curveAt(xz, pos) {
    const n = xz.length; if (n === 1) return xz[0].slice();
    const k = Math.min(n - 2, Math.max(0, Math.floor(pos))), t = Math.min(1, Math.max(0, pos - k));
    const a = xz[Math.max(0, k - 1)], b = xz[k], c = xz[k + 1], d = xz[Math.min(n - 1, k + 2)];
    return [cr(a[0], b[0], c[0], d[0], t), cr(a[1], b[1], c[1], d[1], t)];
  }
  function drape(path, cum, lift, per = 6) {
    const xz = path.map(cellXZ), P = [], D = [];
    for (let k = 0; k < path.length - 1; k++) for (let s = 0; s < per; s++) { const t = s / per, p = curveAt(xz, k + t);
      P.push([p[0], heightAt(p[0], p[1]) + lift, p[1]]); D.push(cum[k] + (cum[k + 1] - cum[k]) * t) }
    const e = xz[xz.length - 1]; P.push([e[0], heightAt(e[0], e[1]) + lift, e[1]]); D.push(cum[cum.length - 1]);
    return [P, D];
  }
  const lift = () => .1 + .03 * VE;
  function rebuildLines() {
    lineOpt = kill(lineOpt); lineShort = kill(lineShort);
    if (st.res.shortest?.path && st.res.mS) { const [P, D] = drape(st.res.shortest.path, Array.from(st.res.mS.dist, v => v / 1000), lift());
      lineShort = makeLine(P, D, { w: 3.6, a: ROUTE.short, dash: 7, gap: 5, haloA: .7 }) }
    if (st.res.optimal?.path && st.res.mO) { const [P, D] = drape(st.res.optimal.path, Array.from(st.res.mO.dist, v => v / 1000), lift());
      lineOpt = makeLine(P, D, { w: 4.6, a: ROUTE.opt, alphaB: .6 }) }
  }
  function rebuildRet() {
    lineRet = kill(lineRet);
    if (st.mode === "return" && st.retPath && st.M?.cum) { const [P, D] = drape(st.retPath, st.M.cum, lift() * 1.15);
      lineRet = makeLine(P, D, { w: 4.6, a: ROUTE.ret, alphaB: .7, dash: 5, gap: 3 }) }
  }

  // Diem danh dau (sprite giu nguyen kich thuoc tren man hinh)
  const FONT = "'IBM Plex Sans', system-ui, sans-serif";
  const meas = document.createElement("canvas").getContext("2d");
  const rrect = (x, a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath() };
  function cvTex(w, h, draw) { const k = 2, c = document.createElement("canvas"); c.width = w * k; c.height = h * k; const x = c.getContext("2d"); x.scale(k, k); draw(x, w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t }
  function scaleSpr(s) { const k = 2 / (vpH * cam.projectionMatrix.elements[5]); s.scale.set(s.userData.px[0] * k, s.userData.px[1] * k, 1) }
  function spr(w, h, draw, cx = .5, cy = .5, order = 20) {
    const m = new THREE.SpriteMaterial({ map: cvTex(w, h, draw), depthTest: false, depthWrite: false, sizeAttenuation: false, transparent: true, toneMapped: false, fog: false });
    const s = new THREE.Sprite(m); s.center.set(cx, cy); s.renderOrder = order; s.userData.px = [w, h]; s.userData.draw = draw;
    SPR.push(s); scaleSpr(s); scene.add(s); return s;
  }
  function label(txt, o = {}) {
    const font = `${o.weight || 600} ${o.size || 12}px ${FONT}`; meas.font = font;
    const w = Math.ceil(meas.measureText(txt).width) + 12, h = (o.size || 12) + 9;
    return spr(w, h, (x) => { x.font = font; x.fillStyle = o.bg || "rgba(22,15,11,.8)"; rrect(x, 0, 0, w, h, 5); x.fill();
      x.fillStyle = o.fg || "#ffffff"; x.textBaseline = "middle"; x.fillText(txt, 6, h / 2 + .5) }, -(o.gap ?? 9) / w, o.cy ?? .5, 22);
  }
  const dot = (r, fill, ring, rw = 2.2) => spr(2 * r + 4, 2 * r + 4, (x, w) => { x.beginPath(); x.arc(w / 2, w / 2, r, 0, 7); x.fillStyle = fill; x.fill(); x.lineWidth = rw; x.strokeStyle = ring; x.stroke() });
  function buildMarkers() {
    mk.A = dot(6, "#ffffff", "#15191d"); mk.Al = label("A", { size: 13, weight: 700 });
    mk.B = dot(6, "#ffffff", "#15191d"); mk.Bl = label("B · đỉnh", { size: 13, weight: 700 });
    sites.forEach((q, k) => mk.sites.push([spr(18, 18, (x) => { x.beginPath(); x.arc(9, 9, 6.5, 0, 7); x.lineWidth = 3.4; x.strokeStyle = "rgba(20,12,8,.75)"; x.stroke(); x.lineWidth = 1.8; x.strokeStyle = "#ffffff"; x.stroke() }),
      label("#" + (k + 1), { size: 11, cy: -.1 })]));
    mk.pnr = spr(20, 20, (x) => { x.save(); x.translate(10, 10); x.rotate(Math.PI / 4); x.fillStyle = "#ffffff"; x.fillRect(-5.5, -5.5, 11, 11); x.lineWidth = 2.6; x.strokeStyle = "#d03b3b"; x.strokeRect(-5.5, -5.5, 11, 11); x.restore() });
    mk.pnrl = label("PNR", { size: 11, fg: "#ffd2cf" });
    mk.beacon = spr(30, 30, (x) => { x.beginPath(); x.arc(15, 15, 11, 0, 7); x.lineWidth = 3; x.strokeStyle = ROUTE.rover; x.stroke(); x.beginPath(); x.arc(15, 15, 4.5, 0, 7); x.fillStyle = ROUTE.rover; x.fill(); x.lineWidth = 1.5; x.strokeStyle = "#fff"; x.stroke() });
    mk.beaconl = label("ROVER", { size: 11, fg: "#ffd9c4" });
    mk.hover = dot(5, "#ffffff", "#15191d", 2);
  }
  const putSpr = (s, x, y, z, vis = true) => { s.position.set(x, y, z); s.visible = s.userData.vis = vis };
  function putCell(s, n, up = 0, vis = true) { const p = cellXZ(n); putSpr(s, p[0], heightAt(p[0], p[1]) + up, p[1], vis) }
  function placeMarkers() {
    putCell(mk.A, st.A, .3); putCell(mk.Al, st.A, .3); putCell(mk.B, st.B, .3); putCell(mk.Bl, st.B, .3);
    sites.forEach((q, k) => { const n = cell(q.lat, q.lon), on = n !== st.A && n !== st.B; putCell(mk.sites[k][0], n, .2, on); putCell(mk.sites[k][1], n, .2, on) });
    placePNR();
  }
  // Nhan doan tuyen theo don vi dia chat (kieu ban do lo trinh co chu thich cua NASA)
  function placeGeoLabels() {
    for (const s of mk.geo) { scene.remove(s); SPR.splice(SPR.indexOf(s), 1); s.material.map.dispose(); s.material.dispose() }
    mk.geo = [];
    if (st.layer !== "geo" || !st.res.optimal?.path || !st.res.mO) { api.need = true; return }
    const path = st.res.optimal.path, segs = geoSegments(path, st.res.mO.dist), Lk = st.res.mO.L;
    for (const g of segs) { if (g.b - g.a < Math.max(18, Lk * .06)) continue;
      const mid = path[Math.round((g.k0 + g.k1) / 2)], s = label(`${GU[g.u].code} · km ${fmtN(g.a)}–${fmtN(g.b)}`, { size: 11, cy: -.15 });
      putCell(s, mid, .4); mk.geo.push(s) }
    api.need = true;
  }
  function placePNR() { const on = st.mode === "fwd" && !!st.M?.pnr;
    if (on) { const n = st.M.path[st.M.pnr.k]; putCell(mk.pnr, n, .3); putCell(mk.pnrl, n, .3) } else { mk.pnr.visible = mk.pnrl.visible = mk.pnr.userData.vis = mk.pnrl.userData.vis = false } }

  // Rover + Phi hanh gia
  function makeEnv() {
    const c = document.createElement("canvas"); c.width = 256; c.height = 128; const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, "#ad8766"); g.addColorStop(.47, "#ead3b6"); g.addColorStop(.53, "#94643f"); g.addColorStop(1, "#3a2213");
    x.fillStyle = g; x.fillRect(0, 0, 256, 128);
    const sg = x.createRadialGradient(70, 30, 0, 70, 30, 24); sg.addColorStop(0, "rgba(255,250,236,1)"); sg.addColorStop(1, "rgba(255,240,210,0)"); x.fillStyle = sg; x.fillRect(30, 0, 80, 64);
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding;
    const pm = new THREE.PMREMGenerator(renderer); envTex = pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose();
  }
  function mat(hex, o = {}, envI = 0) {
    const m = new THREE.MeshStandardMaterial(Object.assign({ color: lin(hex), roughness: .62, metalness: .05 }, o));
    if (envI > 0 && envTex) { m.envMap = envTex; m.envMapIntensity = envI; m.userData.envI = envI; ENV.push(m) }
    if (o.emissive !== undefined) m.emissive = lin(o.emissive);
    return m;
  }
  const UPV = new V(0, 1, 0), XV = new V(1, 0, 0);
  function mesh(geo, m, x, y, z, parent) { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = o.receiveShadow = true; parent.add(o); return o }
  function beam(p1, p2, t, m, parent) { const a = new V(...p1), b = new V(...p2), d = b.clone().sub(a), L = d.length();
    const o = mesh(new THREE.BoxGeometry(L, t, t), m, 0, 0, 0, parent); o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(XV, d.normalize()); return o }
  const capC = {};
  function capsule(r, len) { const key = r.toFixed(3) + "|" + len.toFixed(3);
    if (!capC[key]) { const pts = [], s = 8;
      for (let k = 0; k <= s; k++) { const a = -Math.PI / 2 + k / s * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r + 1e-4, Math.sin(a) * r - len / 2)) }
      for (let k = 0; k <= s; k++) { const a = k / s * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r + 1e-4, Math.sin(a) * r + len / 2)) }
      capC[key] = new THREE.LatheGeometry(pts, 16) }
    return capC[key] }
  function limb(p1, p2, r, m, parent) { const a = new V(...p1), b = new V(...p2), d = b.clone().sub(a), L = d.length();
    const o = mesh(capsule(r, L), m, 0, 0, 0, parent); o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(UPV, d.normalize()); return o }
  function merge(geos) {
    let n = 0; const parts = geos.map(g => { const q = g.index ? g.toNonIndexed() : g; n += q.attributes.position.count; return q });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
    for (const q of parts) { pos.set(q.attributes.position.array, o * 3); nor.set(q.attributes.normal.array, o * 3); o += q.attributes.position.count }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); return g;
  }
  function flagTex() { return cvTex(60, 40, (x) => { x.fillStyle = "#da251d"; x.fillRect(0, 0, 60, 40); x.fillStyle = "#ffde00"; x.beginPath();
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 5.2 : 13, a = -Math.PI / 2 + k * Math.PI / 5; x.lineTo(30 + Math.cos(a) * r, 21 + Math.sin(a) * r) } x.closePath(); x.fill() }) }
  function textTex(txt) { return cvTex(256, 32, (x) => { x.font = "600 21px 'IBM Plex Mono', ui-monospace, monospace"; x.fillStyle = "#5d5852"; x.textBaseline = "middle"; x.textAlign = "center"; x.fillText(txt, 128, 17) }) }
  function solarTex() { return cvTex(128, 96, (x) => { x.fillStyle = "#16294a"; x.fillRect(0, 0, 128, 96); x.strokeStyle = "#5d7fb4"; x.lineWidth = 1;
    for (let i = 0; i <= 128; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 96); x.stroke() } for (let j = 0; j <= 96; j += 12) { x.beginPath(); x.moveTo(0, j); x.lineTo(128, j); x.stroke() }
    x.strokeStyle = "#c9cfd8"; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 125, 93) }) }
  function wheel(x, z, Mt, parent) {
    const g = new THREE.Group(); g.position.set(x, .42, z); parent.add(g);
    const spin = new THREE.Group(); g.add(spin); const sg = Math.sign(z);
    const tire = new THREE.CylinderGeometry(.42, .42, .3, 30); tire.rotateX(Math.PI / 2); mesh(tire, Mt.tire, 0, 0, 0, spin);
    const tr = []; for (let k = 0; k < 18; k++) { const b = new THREE.BoxGeometry(.07, .05, .31); b.translate(0, .43, 0); b.rotateZ(k * Math.PI / 9); tr.push(b) }
    mesh(merge(tr), Mt.tread, 0, 0, 0, spin);
    const rim = new THREE.CylinderGeometry(.29, .29, .31, 24); rim.rotateX(Math.PI / 2); mesh(rim, Mt.rim, 0, 0, 0, spin);
    const sp = []; for (let k = 0; k < 5; k++) { const b = new THREE.BoxGeometry(.045, .27, .03); b.translate(0, .13, sg * .16); b.rotateZ(k * Math.PI * 2 / 5); sp.push(b) }
    mesh(merge(sp), Mt.metal, 0, 0, 0, spin);
    const hub = new THREE.CylinderGeometry(.085, .085, .37, 14); hub.rotateX(Math.PI / 2); mesh(hub, Mt.dark, 0, 0, 0, spin);
    return spin;
  }
  function astronaut(z0, driver, Mt) {
    const g = new THREE.Group(), sg = Math.sign(z0) || 1, P = (x, y, dz) => [x, y, z0 + dz];
    mesh(new THREE.BoxGeometry(.25, .62, .5), Mt.suit, -.62, 1.98, z0, g).rotation.z = .12;
    mesh(new THREE.BoxGeometry(.05, .5, .4), Mt.suitG, -.765, 1.97, z0, g).rotation.z = .12;
    limb(P(-.3, 1.66, 0), P(-.4, 2.08, 0), .215, Mt.suit, g);
    mesh(new THREE.BoxGeometry(.1, .13, .25), Mt.suitG, -.16, 1.97, z0, g).rotation.z = .1;
    const ring = mesh(new THREE.TorusGeometry(.145, .03, 8, 24), Mt.suitG, -.39, 2.21, z0, g); ring.rotation.x = Math.PI / 2;
    const head = new THREE.Group(); head.position.set(-.37, 2.22, z0); g.add(head);
    mesh(new THREE.SphereGeometry(.19, 28, 20), Mt.helmet, .02, .16, 0, head);
    mesh(new THREE.SphereGeometry(.197, 28, 16, Math.PI - .95, 1.9, .9, 1.08), Mt.visor, .02, .16, 0, head);
    mesh(new THREE.BoxGeometry(.06, .05, .05), Mt.suitG, .05, .31, .15, head); mesh(new THREE.BoxGeometry(.06, .05, .05), Mt.suitG, .05, .31, -.15, head);
    const sho = P(-.37, 2.06, .27 * sg), shi = P(-.37, 2.06, -.27 * sg);
    let elo, hdo, eli, hdi;
    if (driver) { elo = P(.02, 1.86, .32 * sg); hdo = P(.62, 1.95, .06 * sg); eli = P(0, 1.84, -.31 * sg); hdi = P(.42, 1.75, -.15 * sg) }
    else { elo = P(-.02, 1.82, .32 * sg); hdo = P(.33, 1.74, .15 * sg); eli = P(-.02, 1.82, -.31 * sg); hdi = P(.33, 1.74, -.13 * sg) }
    limb(sho, elo, .08, Mt.suit, g); limb(elo, hdo, .07, Mt.suit, g); mesh(new THREE.SphereGeometry(.075, 14, 10), Mt.suitG, ...hdo, g);
    limb(shi, eli, .08, Mt.suit, g); limb(eli, hdi, .07, Mt.suit, g); mesh(new THREE.SphereGeometry(.075, 14, 10), Mt.suitG, ...hdi, g);
    for (const s of [-1, 1]) {
      const hip = P(-.2, 1.6, .11 * s), knee = P(.32, 1.74, .13 * s), ank = P(.55, 1.18, .13 * s);
      limb(hip, knee, .1, Mt.suit, g); limb(knee, ank, .088, Mt.suit, g); mesh(new THREE.BoxGeometry(.31, .13, .16), Mt.boot, .62, 1.12, z0 + .13 * s, g) }
    const fl = mesh(new THREE.PlaneGeometry(.13, .087), Mt.flag, 0, 0, 0, g);
    fl.position.set((sho[0] + elo[0]) / 2, (sho[1] + elo[1]) / 2 + .01, z0 + sg * .385); fl.rotation.y = sg > 0 ? 0 : Math.PI; fl.castShadow = false;
    return { g, head };
  }
  function buildRover() {
    makeEnv();
    const Mt = {
      white: mat("#eeebe5", { roughness: .42, metalness: .08 }, .5), stripe: mat("#e0662d", { roughness: .5 }), dark: mat("#2b323a", { roughness: .7 }),
      metal: mat("#a29e97", { roughness: .35, metalness: .6 }, .6), tire: mat("#272523", { roughness: .95 }), tread: mat("#1b1a19", { roughness: .95 }),
      rim: mat("#bab6af", { roughness: .35, metalness: .55 }, .55), glass: mat("#0e141a", { roughness: .08, metalness: .3 }, 1),
      tankW: mat("#eef1f4", { roughness: .32 }, .5), tankB: mat("#2a78d6", { roughness: .45 }), tankC: mat("#f2ebe0", { roughness: .4 }, .4), tankO: mat("#e0662d", { roughness: .5 }),
      suit: mat("#f4f2ed", { roughness: .8 }, .25), suitG: mat("#8f8b85", { roughness: .8 }), helmet: mat("#f9f8f5", { roughness: .26, metalness: .1 }, .6),
      visor: mat("#e2a63c", { roughness: .12, metalness: 1 }, 1.5), boot: mat("#78736c", { roughness: .85 }), seat: mat("#34404d", { roughness: .75 }),
      lamp: mat("#fff6dc", { roughness: .3, emissive: "#ffe6a8", emissiveIntensity: .3 }), tail: mat("#ff3b30", { roughness: .4, emissive: "#ff2a1a", emissiveIntensity: .6 }),
      screen: mat("#0d2230", { roughness: .3, emissive: "#58d0ff", emissiveIntensity: .7 }), tent: mat("#d8cbb6", { roughness: .95 }), door: mat("#8b7b64", { roughness: .9, emissive: "#ffc46b", emissiveIntensity: 0 }),
      decal: new THREE.MeshStandardMaterial({ map: textTex("OLYMPUS-1"), transparent: true, roughness: .6 }),
      flag: new THREE.MeshStandardMaterial({ map: flagTex(), roughness: .7, side: THREE.DoubleSide }),
      solar: [mat("#3a4048", { roughness: .5 }), mat("#3a4048", { roughness: .5 }), new THREE.MeshStandardMaterial({ map: solarTex(), roughness: .25, metalness: .4 }), mat("#2a3038", { roughness: .6 }), mat("#3a4048", { roughness: .5 }), mat("#3a4048", { roughness: .5 })],
    };
    const root = new THREE.Group(); scene.add(root);
    const model = new THREE.Group(); model.scale.setScalar(MS); root.add(model);
    const body = new THREE.Group(); model.add(body);
    // than xe
    const sh = new THREE.Shape(); sh.moveTo(-1.85, .95); sh.lineTo(-1.85, 1.3); sh.quadraticCurveTo(-1.85, 1.4, -1.75, 1.4); sh.lineTo(1.35, 1.4);
    sh.lineTo(1.9, 1.22); sh.lineTo(1.9, 1.04); sh.quadraticCurveTo(1.9, .95, 1.8, .95); sh.lineTo(-1.85, .95);
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 1.9, bevelEnabled: true, bevelThickness: .05, bevelSize: .04, bevelSegments: 3, curveSegments: 6 }); bg.translate(0, 0, -.95);
    mesh(bg, Mt.white, 0, 0, 0, body);
    mesh(new THREE.BoxGeometry(3.28, .08, 2.04), Mt.stripe, -.2, 1.19, 0, body);
    mesh(new THREE.BoxGeometry(3.4, .06, 1.72), Mt.dark, 0, .93, 0, body);
    mesh(new THREE.BoxGeometry(.6, .025, 1.66), Mt.dark, .55, 1.447, 0, body);
    for (const s of [-1, 1]) {
      const dcl = mesh(new THREE.PlaneGeometry(1.25, .156), Mt.decal, -.35, 1.07, s * 1.008, body); dcl.rotation.y = s > 0 ? 0 : Math.PI; dcl.castShadow = false;
      const fg = mesh(new THREE.PlaneGeometry(.3, .2), Mt.flag, .85, 1.04, s * 1.008, body); fg.rotation.y = s > 0 ? 0 : Math.PI; fg.castShadow = false;
      mesh(new THREE.BoxGeometry(.06, .1, .24), Mt.lamp, 1.955, 1.13, s * .62, body);
      mesh(new THREE.BoxGeometry(.04, .07, .18), Mt.tail, -1.9, 1.2, s * .7, body);
    }
    // Ghe, bang dieu khien, can lai
    for (const z of [-.45, .45]) { mesh(new THREE.BoxGeometry(.6, .08, .52), Mt.seat, -.25, 1.5, z, body);
      mesh(new THREE.BoxGeometry(.08, .78, .52), Mt.seat, -.84, 1.95, z, body).rotation.z = .12 }
    mesh(new THREE.BoxGeometry(.4, .3, 1.5), Mt.dark, .97, 1.55, 0, body);
    for (const z of [-.45, .45]) { const sc = mesh(new THREE.PlaneGeometry(.32, .2), Mt.screen, .765, 1.62, z, body); sc.rotation.y = -Math.PI / 2; sc.rotation.x = 0 }
    mesh(new THREE.BoxGeometry(.1, .24, .1), Mt.dark, .69, 1.56, .51, body); limb([.68, 1.68, .51], [.64, 1.9, .51], .018, Mt.dark, body); mesh(new THREE.SphereGeometry(.035, 12, 8), Mt.stripe, .64, 1.92, .51, body);
    // khung, mai pin mat troi
    for (const x of [-1.0, 1.22]) for (const z of [-.9, .9]) limb([x, 1.4, z], [x, 2.76, z], .035, Mt.metal, body);
    beam([-1.0, 2.76, -.9], [1.22, 2.76, -.9], .06, Mt.metal, body); beam([-1.0, 2.76, .9], [1.22, 2.76, .9], .06, Mt.metal, body);
    mesh(new THREE.BoxGeometry(2.4, .05, 1.96), Mt.solar, .11, 2.81, 0, body);
    // Binh CH4 (hai ben) va binh O2 (giua) o san sau
    for (const z of [-.72, .72]) { mesh(capsule(.21, .55), Mt.tankC, -1.42, 1.88, z, body);
      const b = new THREE.CylinderGeometry(.216, .216, .08, 22); mesh(b, Mt.tankO, -1.42, 1.98, z, body) }
    for (const y of [1.6, 1.95]) { const t = mesh(capsule(.17, .66), Mt.tankW, -1.42, y, 0, body); t.rotation.x = Math.PI / 2;
      for (const z of [-.24, .24]) { const b = new THREE.CylinderGeometry(.176, .176, .07, 20); b.rotateX(Math.PI / 2); mesh(b, Mt.tankB, -1.42, y, z, body) } }
    // Cot camera, dia anten, anten roi
    limb([1.5, 1.4, .72], [1.5, 2.95, .72], .045, Mt.metal, body);
    mesh(new THREE.BoxGeometry(.2, .16, .34), Mt.white, 1.52, 3.03, .72, body);
    for (const z of [.64, .8]) { const l = new THREE.CylinderGeometry(.045, .045, .06, 16); l.rotateZ(Math.PI / 2); mesh(l, Mt.glass, 1.635, 3.03, z, body) }
    const dish = new THREE.Group(); dish.position.set(-.55, 2.86, -.5); dish.rotation.z = .55; dish.rotation.x = -.3; body.add(dish);
    const dp = []; for (let k = 0; k <= 10; k++) { const r = k / 10 * .36; dp.push(new THREE.Vector2(r + 1e-4, r * r * .9)) }
    mesh(new THREE.LatheGeometry(dp, 24), new THREE.MeshStandardMaterial({ color: lin("#efede8"), roughness: .4, side: THREE.DoubleSide }), 0, 0, 0, dish);
    limb([0, 0, 0], [0, .24, 0], .012, Mt.metal, dish); mesh(new THREE.SphereGeometry(.03, 10, 8), Mt.metal, 0, .25, 0, dish);
    limb([-1.75, 1.4, -.88], [-1.75, 3.45, -.88], .012, Mt.metal, body); mesh(new THREE.SphereGeometry(.035, 10, 8), Mt.stripe, -1.75, 3.47, -.88, body);
    // He treo rocker-bogie va 6 banh
    const spins = [];
    for (const s of [-1, 1]) { const z = s * 1.06, P = (x, y) => [x, y, z];
      beam(P(.1, .92), P(.95, .98), .085, Mt.metal, model); beam(P(.95, .98), P(1.5, .42), .085, Mt.metal, model);
      beam(P(.1, .92), P(-.85, .7), .085, Mt.metal, model); beam(P(-.85, .7), P(-.2, .42), .08, Mt.metal, model); beam(P(-.85, .7), P(-1.5, .42), .08, Mt.metal, model);
      for (const x of [.1, -.85]) { const c = new THREE.CylinderGeometry(.075, .075, .16, 14); c.rotateX(Math.PI / 2); mesh(c, Mt.dark, x, x > 0 ? .92 : .7, z, model) }
      for (const x of [1.5, -.2, -1.5]) spins.push(wheel(x, s * 1.25, Mt, model));
    }
    const a1 = astronaut(.45, true, Mt), a2 = astronaut(-.45, false, Mt); body.add(a1.g, a2.g);
    // Leu nghi dem
    const tent = new THREE.Group(); tent.position.set(-4.4, 0, -3.4); model.add(tent);
    const dome = mesh(new THREE.SphereGeometry(1.5, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), Mt.tent, 0, 0, 0, tent); dome.scale.y = .8;
    mesh(new THREE.TorusGeometry(1.5, .035, 6, 40), Mt.metal, 0, .02, 0, tent).rotation.x = Math.PI / 2;
    const door = mesh(new THREE.CircleGeometry(.55, 20, 0, Math.PI), Mt.door, 0, 0, 1.47, tent); door.castShadow = false;
    const tLight = new THREE.PointLight(0xffc77a, 0, RL * 2.8, 1); tLight.position.set(0, .9, 1.9); tent.add(tLight);
    // Den pha
    const spot = new THREE.SpotLight(0xfff1d6, 0, RL * 10, .6, .55, 1); spot.position.set(1.95, 1.1, 0); spot.target.position.set(9, -.6, 0); model.add(spot, spot.target);
    rv = { root, model, body, spins, a1, a2, tent, door, tLight, spot, Mt, fwd: new V(1, 0, 0), up: new V(0, 1, 0), spin: 0 };
    root.traverse(o => { if (o.isMesh && o.material === Mt.decal) o.castShadow = false });
  }

  // Da vun quanh Rover
  const ROCKN = 900;
  function buildRocks() {
    const g = new THREE.DodecahedronGeometry(1, 0);
    rocks = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), ROCKN);
    rocks.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ROCKN * 3), 3);
    rocks.castShadow = rocks.receiveShadow = true; rocks.count = 0; rocks.frustumCulled = false; scene.add(rocks);
  }
  const hash2 = (i, j, s) => { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s + 1, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 };
  const rockBase = lin("#7c4325");
  let rockKey = "";
  function placeRocks(cx, cz, samp, k0) {
    const c = RL * .42, Rr = RL * 13, i0 = Math.floor((cz - Rr) / c), i1 = Math.floor((cz + Rr) / c), j0 = Math.floor((cx - Rr) / c), j1 = Math.floor((cx + Rr) / c);
    const key = `${i0},${j0},${VE},${st.mode},${k0 >> 2}`; if (key === rockKey) return; rockKey = key;
    const seg = []; for (let k = Math.max(0, k0 - 54); k < Math.min(samp.length - 1, k0 + 54); k++) seg.push(k);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new V(), p = new V(), col = new THREE.Color();
    let n = 0;
    outer: for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      if (hash2(i, j, 0) > .2) continue;
      const x = (j + hash2(i, j, 2)) * c, z = (i + hash2(i, j, 3)) * c;
      if ((x - cx) ** 2 + (z - cz) ** 2 > Rr * Rr || !inGrid(x, z)) continue;
      let dmin = 1e9;
      for (const k of seg) { const a = samp[k], b = samp[k + 1], vx = b[0] - a[0], vz = b[1] - a[1], L = vx * vx + vz * vz;
        const t = L > 0 ? Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / L)) : 0, dx = a[0] + vx * t - x, dz = a[1] + vz * t - z;
        const d = dx * dx + dz * dz; if (d < dmin) dmin = d }
      if (dmin < (RL * .75) ** 2) continue;
      const s = RL * (.022 + .12 * hash2(i, j, 4) ** 2.4);
      p.set(x, heightAt(x, z) - s * .22, z); e.set(hash2(i, j, 5) * 6.28, hash2(i, j, 6) * 6.28, hash2(i, j, 7) * 6.28); q.setFromEuler(e);
      sc.set(s * (.8 + .5 * hash2(i, j, 8)), s * (.45 + .3 * hash2(i, j, 9)), s * (.8 + .4 * hash2(i, j, 10)));
      m4.compose(p, q, sc); rocks.setMatrixAt(n, m4);
      col.copy(rockBase).multiplyScalar(.7 + .6 * hash2(i, j, 11)); rocks.setColorAt(n, col);
      if (++n >= ROCKN) break outer;
    }
    rocks.count = n; rocks.instanceMatrix.needsUpdate = true; rocks.instanceColor.needsUpdate = true;
  }

  // Bui sau banh xe
  function buildDust() {
    const t = cvTex(32, 32, (x) => { const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, "rgba(212,158,116,.95)"); g.addColorStop(1, "rgba(212,158,116,0)"); x.fillStyle = g; x.fillRect(0, 0, 32, 32) });
    for (let k = 0; k < 56; k++) { const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0 });
      const s = new THREE.Sprite(m); s.visible = false; scene.add(s); dust.push({ s, life: 0, max: 1, v: new V() }) }
  }
  let dustAcc = 0;
  const _w = new V();
  function updateDust(dt, driving, rate) {
    let alive = false;
    if (driving && api.mode !== "overview") { dustAcc += dt * (10 + 14 * Math.min(1, rate)); while (dustAcc > 1) { dustAcc--;
      const d = dust.find(p => p.life >= p.max) || dust[0];
      _w.set(-1.5 - Math.random() * .2, .12, (Math.random() < .5 ? -1 : 1) * 1.25); rv.model.localToWorld(_w);
      d.s.position.copy(_w); d.v.copy(rv.fwd).multiplyScalar(-RL * (.25 + .3 * Math.random())).addScaledVector(rv.up, RL * (.12 + .18 * Math.random()));
      d.life = 0; d.max = .9 + .7 * Math.random(); d.s.visible = true } }
    for (const d of dust) { if (d.life >= d.max) { d.s.visible = false; continue } alive = true;
      d.life += dt; const u = Math.min(1, d.life / d.max); d.s.position.addScaledVector(d.v, dt); d.v.multiplyScalar(1 - dt * 1.2);
      const sz = RL * (.12 + .45 * u); d.s.scale.set(sz, sz, 1); d.s.material.opacity = .42 * (1 - u) * (1 - u * .3) }
    return alive;
  }

  // Camera tu viet: Xoay, thu phong, keo
  const ctl = { tgt: new V(), gTgt: new V(), r: 8, gR: 8, th: 0, gTh: 0, ph: 1.1, gPh: 1.1, yaw: 0, gYaw: 0, pitch: -.16, gPitch: -.16, last: -1e9 };
  const R_LIM = { overview: [12, 4200], follow: [RL * 1.3, RL * 70] };
  function frameOverview() {
    const cells = [st.A, st.B].concat(st.res.optimal?.path || []);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const n of cells) { const p = cellXZ(n); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]) }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ext = Math.max(x1 - x0, z1 - z0, 200);
    ctl.gTgt.set(cx, heightAt(cx, cz) * .6, cz); ctl.gR = clamp(ext * 1.3 / Math.min(1, cam.aspect), 260, 3000); ctl.gPh = .9; ctl.gTh = -.45;
  }
  function setView(m) {
    api.mode = m; rocks.visible = m !== "overview";
    fog.density = m === "overview" ? .00016 : .0021;
    mk.beacon.visible = mk.beaconl.visible = m === "overview";
    if (m === "overview") frameOverview();
    else if (m === "follow") { ctl.gR = RL * 2.7; ctl.gPh = 1.3; ctl.gTh = Math.atan2(-rv.fwd.x, -rv.fwd.z) + .55; ctl.last = -1e9 }
    else { ctl.gYaw = 0; ctl.gPitch = -.16 }
    $("gl").classList.toggle("picking", !!st.pick && m !== "cockpit");
    api.need = true;
  }
  function zoomBy(k) { if (api.mode === "cockpit") return; const L = R_LIM[api.mode]; ctl.gR = clamp(ctl.gR * k, L[0], L[1]); api.need = true }
  function rotateBy(dx, dy) {
    if (api.mode === "cockpit") { ctl.gYaw = clamp(ctl.gYaw - dx * .004, -1.9, 1.9); ctl.gPitch = clamp(ctl.gPitch - dy * .004, -.7, .5) }
    else { ctl.gTh -= dx * .0055; ctl.gPh = clamp(ctl.gPh - dy * .0045, .06, api.mode === "follow" ? 1.5 : 1.42) }
    api.need = true;
  }
  function panBy(dx, dy) {
    if (api.mode !== "overview") return rotateBy(dx, dy);
    const s = ctl.gR * .0016, c = Math.cos(ctl.gTh), sn = Math.sin(ctl.gTh);
    ctl.gTgt.x += -dx * s * c - dy * s * sn; ctl.gTgt.z += dx * s * sn - dy * s * c;
    const g = w2g(ctl.gTgt.x, ctl.gTgt.z); if (g[0] < 0 || g[0] > H || g[1] < 0 || g[1] > W) { ctl.gTgt.x -= -dx * s * c - dy * s * sn; ctl.gTgt.z -= dx * s * sn - dy * s * c }
    ctl.gTgt.y = heightAt(ctl.gTgt.x, ctl.gTgt.z) * .6; api.need = true;
  }
  const _e = new V(), _d = new V(), _qY = new THREE.Quaternion();
  function updateCam(dt) {
    const k = 1 - Math.exp(-dt * 6.5), kt = 1 - Math.exp(-dt * (api.mode === "overview" ? 4.5 : 14));
    if (api.mode !== "overview" && rv.root.visible) {
      ctl.gTgt.copy(rv.root.position).addScaledVector(rv.up, RL * .45);
      if (api.mode === "follow" && st.playing && performance.now() - ctl.last > 2600) ctl.gTh += angD(Math.atan2(-rv.fwd.x, -rv.fwd.z) + .55, ctl.gTh) * Math.min(1, dt * .9);
    }
    const before = cam.position.clone();
    ctl.tgt.lerp(ctl.gTgt, kt); ctl.r += (ctl.gR - ctl.r) * k; ctl.th += angD(ctl.gTh, ctl.th) * k; ctl.ph += (ctl.gPh - ctl.ph) * k;
    ctl.yaw += (ctl.gYaw - ctl.yaw) * k; ctl.pitch += (ctl.gPitch - ctl.pitch) * k;
    if (api.mode === "cockpit" && rv.root.visible) {
      _e.set(-.2, 2.42, .45); rv.model.localToWorld(_e); cam.position.copy(_e);
      _d.set(Math.cos(ctl.pitch) * Math.cos(ctl.yaw), Math.sin(ctl.pitch), -Math.cos(ctl.pitch) * Math.sin(ctl.yaw)).applyQuaternion(rv.root.quaternion);
      cam.up.copy(rv.up); cam.lookAt(_e.addScaledVector(_d, RL * 4)); cam.near = .004; cam.far = 4500;
    } else {
      const sp = Math.sin(ctl.ph);
      cam.position.set(ctl.tgt.x + ctl.r * sp * Math.sin(ctl.th), ctl.tgt.y + ctl.r * Math.cos(ctl.ph), ctl.tgt.z + ctl.r * sp * Math.cos(ctl.th));
      const gh = heightAt(cam.position.x, cam.position.z) + (api.mode === "follow" ? RL * .3 : 1.5); if (cam.position.y < gh) cam.position.y = gh;
      cam.up.set(0, 1, 0); cam.lookAt(ctl.tgt);
      cam.near = clamp(ctl.r * .004, .01, 6); cam.far = clamp(ctl.r * 12 + 3500, 3500, 40000);
    }
    cam.updateProjectionMatrix();
    return before.distanceToSquared(cam.position) > (ctl.r * 1e-5) ** 2 || Math.abs(ctl.gR - ctl.r) > ctl.r * 1e-4;
  }
  function pick(cx, cy) {
    const r = $("gl").getBoundingClientRect(), ndc = new THREE.Vector2((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, cam); const o = ray.ray.origin, d = ray.ray.direction;
    const hit = t => { const x = o.x + d.x * t, z = o.z + d.z * t; return inGrid(x, z) && o.y + d.y * t <= heightAt(x, z) };
    let t = 0, prev = 0, step = Math.max(.01, ctl.r * .0015);
    for (let k = 0; k < 7000 && t < 30000; k++) {
      if (hit(t)) { let a = prev, b = t; for (let q = 0; q < 26; q++) { const m = (a + b) / 2; if (hit(m)) b = m; else a = m }
        const g = w2g(o.x + d.x * b, o.z + d.z * b); return clamp(Math.floor(g[0]), 0, H - 1) * W + clamp(Math.floor(g[1]), 0, W - 1) }
      if (o.y + d.y * t < -10 * VE && d.y < 0) break;
      prev = t; t += step; step *= 1.0028;
    }
    return -1;
  }
  function bindControls(cv3) {
    const ptr = new Map(); let moved = 0, pinch = 0, lastHov = 0;
    const pd = () => { const a = [...ptr.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) };
    cv3.addEventListener("pointerdown", e => { cv3.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button });
      moved = 0; ctl.last = performance.now(); if (ptr.size === 2) pinch = pd() });
    cv3.addEventListener("pointermove", e => {
      const p = ptr.get(e.pointerId);
      if (!p) { const now = performance.now(); if (now - lastHov > 70) { lastHov = now; const n = pick(e.clientX, e.clientY); if (n >= 0) readout(n) } return }
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      if (ptr.size === 2) { const d = pd(); if (pinch > 0 && d > 0) zoomBy(pinch / d); pinch = d; panBy(dx / 2, dy / 2) }
      else if (p.b === 2 || e.shiftKey) panBy(dx, dy); else rotateBy(dx, dy);
      ctl.last = performance.now() });
    const up = e => { const p = ptr.get(e.pointerId); ptr.delete(e.pointerId); if (ptr.size < 2) pinch = 0;
      if (p && e.type === "pointerup" && moved < 6 && ptr.size === 0) { const n = pick(e.clientX, e.clientY); if (n >= 0) { readout(n); if (st.pick && api.mode !== "cockpit") onPickCell(n) } } };
    cv3.addEventListener("pointerup", up); cv3.addEventListener("pointercancel", up);
    cv3.addEventListener("wheel", e => { e.preventDefault(); zoomBy(Math.exp(e.deltaY * .0012)); ctl.last = performance.now() }, { passive: false });
    cv3.addEventListener("contextmenu", e => e.preventDefault());
    cv3.addEventListener("keydown", e => { const k = e.key, m = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[k];
      if (m) { rotateBy(...m); e.preventDefault() } else if (k === "+" || k === "=") zoomBy(.85); else if (k === "-") zoomBy(1.18); ctl.last = performance.now() });
  }
  function readout(n) { const i = Math.floor(n / W), j = n % W;
    $("readout").textContent = `${LAT[i].toFixed(2)}°N ${LON[j].toFixed(2)}°E · cao ${(Z[n] / 1000).toFixed(2)} km · dốc ${SLOPE[n].toFixed(1)}° · T trưa ${TN[n].toFixed(1)} °C · ${PRES[n].toFixed(0)} Pa · ${GU[GEO[n]].code} ${GU[GEO[n]].vi}` }

             
