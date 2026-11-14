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
