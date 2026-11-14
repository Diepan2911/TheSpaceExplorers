// HOAT ANH KHOA HOC (sci_anim.js, sau layout.js)
// Khi Rover toi mot diem trong tab "Khoa hoc", Rover dung vai giay va mot phi hanh gia xuong xe lam nhiem vu
// Tai diem do: dao ranh lay mau dat, khoan loi, do pho, quet radar xuyen dat, chup anh toan canh, go bua lay mau.
// Hoat anh chi minh hoa: Thoi gian lam viec KHONG cong vao hanh trinh (lap ca EVA o muc Marswalk).

// viec lam tai moi diem, lay theo muc "Viec can lam" + "Dung cu" cua tung don vi dia chat trong science.js
const SA_TASK = { Aa: ["radar", "dig"], lAa: ["spectro", "dig"], Ave: ["drill", "spectro"], lAv: ["hammer"], lAvf: ["dig", "spectro"],
  AHtu: ["dig", "radar"], AHv: ["spectro"], Hv: ["spectro", "camera"], scarp: ["camera", "hammer"], top: ["camera", "drill"] };
const SA_NAME = { dig: "Đào rãnh nông, lấy mẫu đất", drill: "Khoan lõi ngắn lấy mẫu đá", spectro: "Đo thành phần đá bằng phổ kế cầm tay",
  radar: "Quét radar xuyên đất", camera: "Chụp ảnh toàn cảnh, đo mặt cắt", hammer: "Gõ búa lấy mẫu đá mang về" };
const SA_TOOL = { dig: "xẻng, túi đựng mẫu", drill: "máy khoan lõi", spectro: "phổ kế tia X cầm tay", radar: "radar xuyên đất", camera: "camera toàn cảnh", hammer: "búa địa chất, hộp mẫu" };
const SA = { on: true, dur: 15, ti: -1, realign: 0, gnd: 0, ter: null, scene: null, rv: null, kit: null, M: null, stops: [], seen: new Set(), hold: null, prevT: 0, act: -1, ta: 0, view: "", txt: "" };
const G_MARS = 3.71;            // Gia toc trong truong sao Hoa (m/s²)
const saTasks = s => SA_TASK[s.sci === SCI_SCARP ? "scarp" : s.sci === SCI_TOP ? "top" : s.unit] || ["spectro"];
function saStops(M) {           // Diem dung khoa hoc + Thoi diem Rover toi
  if (!M || st.mode !== "fwd" || M.path !== st.res.optimal?.path) return [];
  return sciStops(M.path, st.res.mO).map(s => ({ ...s, tasks: saTasks(s), t: M.nodeKf[s.k] >= 0 ? M.kf[M.nodeKf[s.k]].t : Infinity }));
}

// Lay canh 3D o lan ve dau tien 
if (typeof THREE !== "undefined") {
  const umw = THREE.Object3D.prototype.updateMatrixWorld;
  THREE.Object3D.prototype.updateMatrixWorld = function (force) {
    if (this.isScene) SA.scene = this;
    else if (this.isCamera && SA.scene) { SA.cam = this; THREE.Object3D.prototype.updateMatrixWorld = umw }   // Camera chinh duoc cap nhat ngay sau canh
    return umw.call(this, force) };
}
function saFind() {
  if (SA.rv || !SA.scene) return SA.rv;
  const MS = V3D.ROVER_X / 1000, root = SA.scene.children.find(o => o.isGroup && o.children[0] && Math.abs(o.children[0].scale.x - MS) < 1e-6);
  if (!root) return null;
  const model = root.children[0], crew = model.children[0].children.filter(o => o.isGroup).slice(-2);   // 2 phi hanh gia ngoi tren xe
  SA.kit = saBuild(model); SA.rv = { model, crew }; return SA.rv;
}

// Dung mo hinh (don vi: met, cung he toa do voi Rover; +x = huong xe chay)
function saBuild(model) {
  const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .75 }, o));
  const glow = (c, op) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });
  const m = { suit: mat(0xf3f0ea), grey: mat(0x8c877f), visor: mat(0xd9a03a, { metalness: .9, roughness: .15 }), metal: mat(0xa9a49c, { metalness: .6, roughness: .35 }),
    dark: mat(0x2c3036), orange: mat(0xe0662d), soil: mat(0x8f4f2c, { roughness: 1 }), pit: mat(0x3b1e10, { roughness: 1 }), rock: mat(0x6b4835, { roughness: 1, flatShading: true }),
    lens: mat(0x222222, { emissive: 0xffffff, emissiveIntensity: 0 }), beam: glow(0x7fe0ff, .5), ring: glow(0x9fe8ff, .8) };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d), cyl = (r1, r2, h) => new THREE.CylinderGeometry(r1, r2, h, 12), ball = r => new THREE.SphereGeometry(r, 14, 10);
  const add = (g, mt, x, y, z, p) => { const o = new THREE.Mesh(g, mt); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o };
  const grp = (x, y, z, p) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g };
  const tool = {}, T = (ks, o) => { [].concat(ks).forEach(k => (tool[k] = tool[k] || []).push(o)); return o };
  const kit = grp(2.4, 0, 2.0, model); kit.visible = false;    // Truoc-ben phai Rover: Camera bam rover nhin thay ro
  // Phi hanh gia di bo (mat huong +x, tay phai o phia +z)
  const ast = grp(0, 0, 0, kit), up = grp(0, .85, 0, ast);
  const legs = [-1, 1].map(s => { const l = grp(0, .85, s * .12, ast); add(box(.17, .8, .17), m.suit, 0, -.4, 0, l); add(box(.26, .12, .18), m.grey, .05, -.8, 0, l); return l });
  add(box(.34, .62, .48), m.suit, 0, .33, 0, up); add(box(.24, .56, .44), m.suit, -.29, .38, 0, up);
  add(ball(.18), m.suit, 0, .84, 0, up); add(ball(.14), m.visor, .07, .85, 0, up);
  const arms = [-1, 1].map(s => { const a = grp(0, .58, s * .3, up); add(box(.13, .58, .13), m.suit, 0, -.29, 0, a); return a });
  const hand = grp(0, -.58, 0, arms[1]);
  // Xeng + Ho dao + Dong dat
  const sh = T("dig", grp(0, 0, 0, hand)); add(cyl(.022, .022, 1), m.metal, 0, -.5, 0, sh); add(box(.04, .26, .2), m.metal, 0, -1.1, 0, sh);
  const pit = T("dig", add(new THREE.CircleGeometry(.36, 20), m.pit, 1.25, .015, 0, kit)); pit.rotation.x = -Math.PI / 2; pit.castShadow = false;
  const mound = T("dig", add(new THREE.SphereGeometry(.32, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.soil, 1.35, 0, 1.15, kit));
  // Gian khoan 3 chan
  const rig = T("drill", grp(1.25, 0, 0, kit));
  for (let q = 0; q < 3; q++) { const a = q * 2.094, l = add(cyl(.02, .02, 1.45), m.metal, Math.cos(a) * .28, .66, Math.sin(a) * .28, rig); l.rotation.set(-Math.sin(a) * .4, 0, Math.cos(a) * .4) }
  add(box(.22, .2, .22), m.orange, 0, 1.38, 0, rig);
  const bit = add(cyl(.05, .05, .9), m.dark, 0, .95, 0, rig);
  // Tang da, pho ke cam tay, tia do
  T(["spectro", "hammer"], add(new THREE.DodecahedronGeometry(.24), m.rock, .95, .14, 0, kit));
  const xrf = T("spectro", grp(0, 0, 0, hand)); add(box(.1, .2, .08), m.dark, 0, -.1, 0, xrf); add(box(.07, .05, .07), m.orange, 0, -.22, 0, xrf);
  const ray = T("spectro", add(cyl(.012, .05, 1), m.beam, 0, 0, 0, kit)); ray.castShadow = false;
  // Bua dia chat + Hop dung mau
  const ham = T("hammer", grp(0, 0, 0, hand)); add(cyl(.016, .016, .5), m.grey, 0, -.25, 0, ham); add(box(.16, .07, .07), m.metal, 0, -.5, 0, ham);
  T("hammer", add(box(.3, .2, .22), m.orange, .3, .1, -.6, kit));
  // Xe truot radar + Song radar
  const sled = T("radar", add(box(.55, .12, .36), m.dark, 0, .06, 0, kit)); add(box(.5, .02, .3), m.orange, 0, .07, 0, sled);
  const rings = []; for (let q = 0; q < 4; q++) { const r = T("radar", add(new THREE.TorusGeometry(.3, .018, 6, 32), m.ring.clone(), 0, .03, 0, kit));
    r.rotation.x = Math.PI / 2; r.castShadow = false; r.userData.age = 9; rings.push(r) }
  // Camera toan canh tren chan may
  const tri = T("camera", grp(1.1, 0, 0, kit));
  for (let q = 0; q < 3; q++) { const a = q * 2.094, l = add(cyl(.015, .015, 1.3), m.metal, Math.cos(a) * .2, .6, Math.sin(a) * .2, tri); l.rotation.set(-Math.sin(a) * .32, 0, Math.cos(a) * .32) }
  const head = grp(0, 1.25, 0, tri); add(box(.18, .14, .14), m.dark, 0, 0, 0, head); add(cyl(.05, .05, .12), m.lens, .13, 0, 0, head).rotation.z = Math.PI / 2;
  const fan = add(new THREE.CircleGeometry(4, 16, -.3, .6), m.beam.clone(), 0, 0, 0, head); fan.rotation.x = -Math.PI / 2; fan.castShadow = false; fan.material.opacity = .25;
  // Vun dat / Manh da bay ra
  const bits = []; for (let q = 0; q < 16; q++) { const b = add(box(.07, .06, .07), m.soil, 0, 0, 0, kit); b.visible = false; bits.push({ o: b, v: new THREE.Vector3(), life: 9 }) }
  return { kit, ast, up, legs, arms, hand, tool, pit, mound, bit, ray, sled, rings, head, bits, m, pw: 0, rt: 0 };
}

// Chuyen dong
const saKey = (u, P) => { for (let q = 1; q < P.length; q++) if (u <= P[q][0]) { const [a0, v0] = P[q - 1], [a1, v1] = P[q], w = (u - a0) / (a1 - a0 || 1); return v0 + (v1 - v0) * w * w * (3 - 2 * w) } return P[P.length - 1][1] };
const rnd = a => (Math.random() * 2 - 1) * a, V3 = (x, y, z) => new THREE.Vector3(x, y, z), _p = typeof THREE !== "undefined" ? V3() : null;
function saPose(K, x, z, ry, lean, aR, aL) { K.ast.position.set(x, 0, z); K.ast.rotation.y = ry; K.up.rotation.set(0, 0, -lean);
  K.arms[1].rotation.set(0, 0, aR); K.arms[0].rotation.set(0, 0, aL); K.legs.forEach(l => l.rotation.set(0, 0, 0)) }
function saAt(K, o, x, y, z) { o.updateWorldMatrix(true, false); _p.set(x, y, z); o.localToWorld(_p); return K.kit.worldToLocal(_p) }   // Diem cua vat, doi sang toa do bo dung cu
function saGround(K) {         // Dat bo dung cu sat mat dia hinh that (do bang tia chieu xuong luoi dia hinh)
  const ter = SA.ter || (SA.ter = SA.scene.children.find(o => o.isMesh && o.geometry.attributes.position.count > 50000)); if (!ter) return;
  K.kit.position.y = 0; const o = saAt(K, K.kit, .6, 0, 0); K.kit.localToWorld(o);
  const hit = new THREE.Raycaster(V3(o.x, o.y + 60, o.z), V3(0, -1, 0)).intersectObject(ter)[0];
  if (hit) K.kit.position.y = K.kit.parent.worldToLocal(hit.point.clone()).y;
}
function saSpawn(K, p, v, mt) { const b = K.bits.find(b => b.life > 2.5) || K.bits[0];
  b.o.position.copy(p); b.v.copy(v); b.life = 0; b.o.material = mt; b.o.visible = true; b.o.scale.setScalar(.6 + Math.random() * .8) }
function saAnim(K, type, tau, dt) {
  for (const k in K.tool) K.tool[k].forEach(o => o.visible = false); (K.tool[type] || []).forEach(o => o.visible = true);
  const cyc = P => (tau % P) / P;
  if (type === "dig") { const w = cyc(2.4), aR = saKey(w, [[0, .9], [.35, 1.05], [.6, 1.5], [.75, 1.45], [1, .9]]);
    saPose(K, -.05, 0, 0, saKey(w, [[0, .2], [.35, .38], [.6, .1], [.75, .12], [1, .2]]), aR, aR - .15);
    K.up.rotation.y = saKey(w, [[0, 0], [.6, 0], [.72, -.7], [.85, -.7], [1, 0]]);
    if (K.pw < .72 && w >= .72) { const tip = saAt(K, K.hand, 0, -1.2, 0); for (let q = 0; q < 4; q++) saSpawn(K, tip.clone(), V3(rnd(.2), .4 + Math.random() * .4, .3 + Math.random() * .3), K.m.soil) }
    const g = Math.min(1, tau / 4); K.pit.scale.setScalar(.3 + .7 * g); K.mound.scale.set(.4 + .6 * g, .2 + .8 * g, .4 + .6 * g);
    K.pw = w;
  } else if (type === "drill") { const w = cyc(4);
    saPose(K, .2, -.45, -.4, .15, .95, .3);
    K.bit.rotation.y += dt * 25; K.bit.position.y = saKey(w, [[0, .95], [.8, .4], [.9, .4], [1, .95]]);
    if (w < .8 && Math.random() < dt * 12) saSpawn(K, V3(1.25 + rnd(.1), .05, rnd(.1)), V3(rnd(.6), .5 + Math.random() * .5, rnd(.6)), K.m.soil);
  } else if (type === "spectro") { const w = cyc(2.5);
    saPose(K, .05, 0, 0, .42, saKey(w, [[0, 1.15], [.5, 1.25], [1, 1.15]]), .3);
    const a = saAt(K, K.hand, 0, -.25, 0), b = V3(.95, .3, 0), d = b.clone().sub(a), L = d.length();
    K.ray.position.copy(a).addScaledVector(d, .5); K.ray.quaternion.setFromUnitVectors(V3(0, -1, 0), d.normalize()); K.ray.scale.set(1, L, 1);
    K.ray.material.opacity = w < .75 ? .25 + .35 * Math.abs(Math.sin(tau * 9)) : 0;
  } else if (type === "radar") { const f = tau * .5, R = 1.1;                // Di vong tron, keo xe truot radar phia sau
    saPose(K, 1.5 + R * Math.cos(f), R * Math.sin(f), -f - Math.PI / 2, .08, .5, .1);
    K.legs[0].rotation.z = Math.sin(tau * 6) * .35; K.legs[1].rotation.z = -Math.sin(tau * 6) * .35;
    const fs = f - .75; K.sled.position.set(1.5 + R * Math.cos(fs), .06, R * Math.sin(fs)); K.sled.rotation.y = -fs - Math.PI / 2;
    K.rt += dt; if (K.rt > .45) { K.rt = 0; const r = K.rings.reduce((a, b) => b.userData.age > a.userData.age ? b : a); r.userData.age = 0; r.position.set(K.sled.position.x, .03, K.sled.position.z) }
    K.rings.forEach(r => { r.userData.age += dt; const u = r.userData.age / 1.6; r.visible = u < 1; r.scale.setScalar(1 + u * 4); r.material.opacity = .8 * (1 - u) });
  } else if (type === "camera") {
    saPose(K, .1, -.6, -.3, .05, .45, .2); K.head.rotation.y = tau * .9;
    K.m.lens.emissiveIntensity = (tau * .9) % 2.094 < .1 ? 3 : 0;             // Chop flash 3 lan moi vong
  } else if (type === "hammer") { const w = cyc(1.3);
    saPose(K, .1, 0, 0, saKey(w, [[0, .35], [.45, .1], [.7, .5], [1, .35]]), saKey(w, [[0, 1.1], [.45, 2.6], [.7, .9], [1, 1.1]]), .5);
    if (K.pw < .68 && w >= .68) for (let q = 0; q < 4; q++) saSpawn(K, V3(.9, .4, 0), V3(rnd(.8), 1 + Math.random(), rnd(.8)), K.m.rock);
    K.pw = w;
  }
  for (const b of K.bits) { if (b.life > 2.5) { b.o.visible = false; continue } b.life += dt;   // Roi theo trong luc sao Hoa
    if (b.o.position.y > .03 || b.v.y > 0) { b.v.y -= G_MARS * dt; b.o.position.addScaledVector(b.v, dt); b.o.rotation.x += dt * 6 } else b.o.position.y = .03 }
}


