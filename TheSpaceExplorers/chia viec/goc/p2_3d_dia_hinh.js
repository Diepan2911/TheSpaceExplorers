// ================= KHUNG 3D (three.js r128) =================
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
  const ROVER_X = 450, MS = ROVER_X / 1000, RL = 4.2 * MS;   // rover phong to x450: 1 m mo hinh = 0,45 km the gioi
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

  // ---------- dia hinh ----------
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

  // ---------- bau troi, sao, anh sang ----------
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

  // ---------- duong tuyen rong theo pixel ----------
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

  // ---------- diem danh dau (sprite giu nguyen kich thuoc tren man hinh) ----------
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
  // nhan doan tuyen theo don vi dia chat (kieu ban do lo trinh co chu thich cua NASA)
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

