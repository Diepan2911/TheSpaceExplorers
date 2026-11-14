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

//Luong can de di nguoc tu nut k ve nut 0 (co du tru 10%)
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
