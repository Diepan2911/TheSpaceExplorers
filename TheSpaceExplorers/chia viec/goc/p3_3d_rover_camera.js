  // ---------- rover + phi hanh gia ----------
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
    // ghe, bang dieu khien, can lai
    for (const z of [-.45, .45]) { mesh(new THREE.BoxGeometry(.6, .08, .52), Mt.seat, -.25, 1.5, z, body);
      mesh(new THREE.BoxGeometry(.08, .78, .52), Mt.seat, -.84, 1.95, z, body).rotation.z = .12 }
    mesh(new THREE.BoxGeometry(.4, .3, 1.5), Mt.dark, .97, 1.55, 0, body);
    for (const z of [-.45, .45]) { const sc = mesh(new THREE.PlaneGeometry(.32, .2), Mt.screen, .765, 1.62, z, body); sc.rotation.y = -Math.PI / 2; sc.rotation.x = 0 }
    mesh(new THREE.BoxGeometry(.1, .24, .1), Mt.dark, .69, 1.56, .51, body); limb([.68, 1.68, .51], [.64, 1.9, .51], .018, Mt.dark, body); mesh(new THREE.SphereGeometry(.035, 12, 8), Mt.stripe, .64, 1.92, .51, body);
    // khung, mai pin mat troi
    for (const x of [-1.0, 1.22]) for (const z of [-.9, .9]) limb([x, 1.4, z], [x, 2.76, z], .035, Mt.metal, body);
    beam([-1.0, 2.76, -.9], [1.22, 2.76, -.9], .06, Mt.metal, body); beam([-1.0, 2.76, .9], [1.22, 2.76, .9], .06, Mt.metal, body);
    mesh(new THREE.BoxGeometry(2.4, .05, 1.96), Mt.solar, .11, 2.81, 0, body);
    // binh CH4 (hai ben) va binh O2 (giua) o san sau
    for (const z of [-.72, .72]) { mesh(capsule(.21, .55), Mt.tankC, -1.42, 1.88, z, body);
      const b = new THREE.CylinderGeometry(.216, .216, .08, 22); mesh(b, Mt.tankO, -1.42, 1.98, z, body) }
    for (const y of [1.6, 1.95]) { const t = mesh(capsule(.17, .66), Mt.tankW, -1.42, y, 0, body); t.rotation.x = Math.PI / 2;
      for (const z of [-.24, .24]) { const b = new THREE.CylinderGeometry(.176, .176, .07, 20); b.rotateX(Math.PI / 2); mesh(b, Mt.tankB, -1.42, y, z, body) } }
    // cot camera, dia anten, anten roi
    limb([1.5, 1.4, .72], [1.5, 2.95, .72], .045, Mt.metal, body);
    mesh(new THREE.BoxGeometry(.2, .16, .34), Mt.white, 1.52, 3.03, .72, body);
    for (const z of [.64, .8]) { const l = new THREE.CylinderGeometry(.045, .045, .06, 16); l.rotateZ(Math.PI / 2); mesh(l, Mt.glass, 1.635, 3.03, z, body) }
    const dish = new THREE.Group(); dish.position.set(-.55, 2.86, -.5); dish.rotation.z = .55; dish.rotation.x = -.3; body.add(dish);
    const dp = []; for (let k = 0; k <= 10; k++) { const r = k / 10 * .36; dp.push(new THREE.Vector2(r + 1e-4, r * r * .9)) }
    mesh(new THREE.LatheGeometry(dp, 24), new THREE.MeshStandardMaterial({ color: lin("#efede8"), roughness: .4, side: THREE.DoubleSide }), 0, 0, 0, dish);
    limb([0, 0, 0], [0, .24, 0], .012, Mt.metal, dish); mesh(new THREE.SphereGeometry(.03, 10, 8), Mt.metal, 0, .25, 0, dish);
    limb([-1.75, 1.4, -.88], [-1.75, 3.45, -.88], .012, Mt.metal, body); mesh(new THREE.SphereGeometry(.035, 10, 8), Mt.stripe, -1.75, 3.47, -.88, body);
    // he treo rocker-bogie va 6 banh
    const spins = [];
    for (const s of [-1, 1]) { const z = s * 1.06, P = (x, y) => [x, y, z];
      beam(P(.1, .92), P(.95, .98), .085, Mt.metal, model); beam(P(.95, .98), P(1.5, .42), .085, Mt.metal, model);
      beam(P(.1, .92), P(-.85, .7), .085, Mt.metal, model); beam(P(-.85, .7), P(-.2, .42), .08, Mt.metal, model); beam(P(-.85, .7), P(-1.5, .42), .08, Mt.metal, model);
      for (const x of [.1, -.85]) { const c = new THREE.CylinderGeometry(.075, .075, .16, 14); c.rotateX(Math.PI / 2); mesh(c, Mt.dark, x, x > 0 ? .92 : .7, z, model) }
      for (const x of [1.5, -.2, -1.5]) spins.push(wheel(x, s * 1.25, Mt, model));
    }
    const a1 = astronaut(.45, true, Mt), a2 = astronaut(-.45, false, Mt); body.add(a1.g, a2.g);
    // leu nghi dem
    const tent = new THREE.Group(); tent.position.set(-4.4, 0, -3.4); model.add(tent);
    const dome = mesh(new THREE.SphereGeometry(1.5, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), Mt.tent, 0, 0, 0, tent); dome.scale.y = .8;
    mesh(new THREE.TorusGeometry(1.5, .035, 6, 40), Mt.metal, 0, .02, 0, tent).rotation.x = Math.PI / 2;
    const door = mesh(new THREE.CircleGeometry(.55, 20, 0, Math.PI), Mt.door, 0, 0, 1.47, tent); door.castShadow = false;
    const tLight = new THREE.PointLight(0xffc77a, 0, RL * 2.8, 1); tLight.position.set(0, .9, 1.9); tent.add(tLight);
    // den pha
    const spot = new THREE.SpotLight(0xfff1d6, 0, RL * 10, .6, .55, 1); spot.position.set(1.95, 1.1, 0); spot.target.position.set(9, -.6, 0); model.add(spot, spot.target);
    rv = { root, model, body, spins, a1, a2, tent, door, tLight, spot, Mt, fwd: new V(1, 0, 0), up: new V(0, 1, 0), spin: 0 };
    root.traverse(o => { if (o.isMesh && o.material === Mt.decal) o.castShadow = false });
  }

  // ---------- da vun quanh rover ----------
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

  // ---------- bui sau banh xe ----------
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

  // ---------- camera tu viet: xoay, thu phong, keo ----------
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

  // ---------- cap nhat rover theo trang thai mo phong ----------
  const _f = new V(), _r = new V(), _u = new V(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
  function placeRover(s, dt) {
    const M = st.M; if (!M._xz) { M._xz = M.path.map(cellXZ); M._samp = []; for (let k = 0; k < M.path.length - 1; k++) for (let q = 0; q < 6; q++) M._samp.push(curveAt(M._xz, k + q / 6)); M._samp.push(M._xz[M._xz.length - 1]) }
    const xz = M._xz, n = xz.length, pos = Math.min(n - 1, Math.max(0, s.pos));
    const p = curveAt(xz, pos), a = curveAt(xz, Math.max(0, pos - .15)), b = curveAt(xz, Math.min(n - 1, pos + .15));
    let hx = b[0] - a[0], hz = b[1] - a[1], hl = Math.hypot(hx, hz);
    if (hl < 1e-9) { hx = rv.fwd.x; hz = rv.fwd.z; hl = Math.hypot(hx, hz) || 1 }
    hx /= hl; hz /= hl;
    const rx = -hz, rz = hx, L2 = 1.5 * MS, W2 = 1.25 * MS, hg = (dx, dz) => heightAt(p[0] + dx, p[1] + dz);
    const fl = hg(hx * L2 - rx * W2, hz * L2 - rz * W2), fr = hg(hx * L2 + rx * W2, hz * L2 + rz * W2);
    const bl = hg(-hx * L2 - rx * W2, -hz * L2 - rz * W2), br = hg(-hx * L2 + rx * W2, -hz * L2 + rz * W2);
    _f.set(hx * 2 * L2, (fl + fr - bl - br) / 2, hz * 2 * L2).normalize();
    _r.set(rx * 2 * W2, (fr + br - fl - bl) / 2, rz * 2 * W2).normalize();
    _u.crossVectors(_r, _f).normalize(); _r.crossVectors(_f, _u).normalize();
    _m.makeBasis(_f, _u, _r); _q.setFromRotationMatrix(_m);
    if (snapRover) { rv.root.quaternion.copy(_q); snapRover = false } else rv.root.quaternion.slerp(_q, 1 - Math.exp(-dt * 10));
    rv.root.position.set(p[0], (fl + fr + bl + br) / 4, p[1]);
    rv.fwd.set(1, 0, 0).applyQuaternion(rv.root.quaternion); rv.up.set(0, 1, 0).applyQuaternion(rv.root.quaternion);
    rv.root.updateMatrixWorld(true);
    return Math.round(pos * 6);
  }
  let lastT = -1, lastMode = "";
  function frame(s, dt, now, rate) {
    if (!api.ok) return;
    let anim = false;
    if (s && st.M) {
      rv.root.visible = true;
      const k0 = placeRover(s, dt), driving = st.playing && s.ph === "drive", rest = s.ph === "rest", night = 1 - dayL;
      if (snapCam && api.mode !== "overview") { snapCam = false; setView(api.mode); ctl.gTgt.copy(rv.root.position).addScaledVector(rv.up, RL * .45);
        ctl.tgt.copy(ctl.gTgt); ctl.r = ctl.gR; ctl.th = ctl.gTh; ctl.ph = ctl.gPh; ctl.yaw = ctl.gYaw; ctl.pitch = ctl.gPitch }
      if (realign) { realign = false; if (api.mode === "follow") ctl.gTh = ctl.th + angD(Math.atan2(-rv.fwd.x, -rv.fwd.z) + .55, ctl.th) }
      if (driving) { rv.spin -= Math.min(14, s.speed * rate / (.42 * MS)) * dt; anim = true }
      rv.spins.forEach(g => g.rotation.z = rv.spin);
      rv.body.position.y = driving ? Math.abs(Math.sin(now * .012)) * .028 : 0;
      const nod = driving ? Math.sin(now * .012) * .035 : 0; rv.a1.head.rotation.z = nod; rv.a2.head.rotation.z = -nod * .8;
      rv.a1.g.visible = !rest; rv.a2.g.visible = !rest && cfg.crew === 2; rv.tent.visible = rest;
      rv.Mt.lamp.emissiveIntensity = driving ? .5 + 2.4 * night : .25; rv.spot.intensity = driving && night > .35 ? 2.6 * night : 0;
      rv.Mt.door.emissiveIntensity = rest ? .1 + 1.6 * night : 0; rv.tLight.intensity = rest ? .65 * night : 0;
      const bp = rv.root.position; putSpr(mk.beacon, bp.x, bp.y + RL * .4, bp.z, api.mode === "overview"); putSpr(mk.beaconl, bp.x, bp.y + RL * .4, bp.z, api.mode === "overview");
      if (api.mode !== "overview" && st.M._samp) placeRocks(rv.root.position.x, rv.root.position.z, st.M._samp, k0);

      if (lineOpt) { lineOpt.material.uniforms.uProg.value = st.mode === "fwd" ? s.d / 1000 : -1; lineOpt.material.uniforms.uAlphaB.value = st.mode === "fwd" ? .6 : .32 }
      if (lineRet) lineRet.material.uniforms.uProg.value = s.d / 1000;
      if (st.t !== lastT) { anim = true; lastT = st.t }
      const close = api.mode !== "overview", nr2 = (RL * 3) ** 2;
      for (const m of [mk.A, mk.Al, mk.B, mk.Bl, mk.pnr, mk.pnrl]) m.visible = !!m.userData.vis && !(close && m.position.distanceToSquared(bp) < nr2);
      for (const m of mk.sites.flat()) m.visible = !!m.userData.vis && !close;
      for (const m of mk.geo) m.visible = !!m.userData.vis && !close;
      anim = updateDust(dt, driving, rate) || anim;
    } else { rv.root.visible = false; mk.beacon.visible = mk.beaconl.visible = false; rocks.count = 0 }
    if (st.profHover !== lastHover) { lastHover = st.profHover; if (st.profHover >= 0) putCell(mk.hover, st.profHover, .4); else mk.hover.visible = false; api.need = true }
    updateSky(s);
    const camMoving = updateCam(dt);
    if (api.need || anim || camMoving || st.playing || lastMode !== api.mode) {
      lastMode = api.mode; sky.position.copy(cam.position); stars.position.copy(cam.position);
      renderer.render(scene, cam); api.need = false }
  }
  function resize() {
    const vp = $("vp"), w = Math.max(1, vp.clientWidth), h = Math.max(1, vp.clientHeight);
    vpW = w; vpH = h; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    SPR.forEach(scaleSpr); for (const l of [lineOpt, lineShort, lineRet]) if (l) l.material.uniforms.uRes.value.set(w, h);
    starMat.uniforms.uPR.value = renderer.getPixelRatio(); api.need = true;
  }
  let onPickCell = noop;
  function init(pickCb) {
    onPickCell = pickCb || noop;
    const cv3 = $("gl");
    try { renderer = new THREE.WebGLRenderer({ canvas: cv3, antialias: true, powerPreference: "high-performance" }) }
    catch (e) { const m = $("v3msg"); m.hidden = false; m.textContent = "Trình duyệt này không bật được WebGL nên không vẽ được 3D. Các bảng số liệu và bản đồ nhỏ vẫn dùng được."; return false }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene(); fog = new THREE.FogExp2(0xe3c6a3, .0021); scene.fog = fog;
    cam = new THREE.PerspectiveCamera(50, 1, .05, 5000);
    buildSky(); buildLights(); buildTerrain(); buildRover(); buildRocks(); buildDust(); buildMarkers();
    bindControls(cv3);
    new ResizeObserver(resize).observe($("vp")); resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { SPR.forEach(s => { const old = s.material.map; s.material.map = cvTex(s.userData.px[0], s.userData.px[1], s.userData.draw); old.dispose(); s.material.needsUpdate = true }); api.need = true });
    api.ok = true; return true;
  }
  Object.assign(api, {
    init, frame,
    terrainDirty: () => { if (api.ok) { paintTex(); placeGeoLabels() } },
    setVE: v => { VE = v; if (!api.ok) return; setHeights(); rebuildLines(); rebuildRet(); placeMarkers(); placeGeoLabels(); rockKey = ""; snapRover = true;
      if (api.mode === "overview") frameOverview(); api.need = true },
    routesChanged: () => { if (!api.ok) return; rebuildLines(); placeMarkers(); placeGeoLabels(); if (!framed || api.mode === "overview") { framed = true; if (api.mode === "overview") frameOverview() } api.need = true },
    missionChanged: () => { if (!api.ok) return; rebuildRet(); placePNR(); snapRover = true; realign = st.mode === "return"; rockKey = ""; api.need = true },
    setView: m => { if (api.ok) setView(m) },
    poke: () => { api.need = true },
    setPick: () => { if (api.ok) $("gl").classList.toggle("picking", !!st.pick && api.mode !== "cockpit") },
    profHover: () => { api.need = true },
    focusCell: n => { if (!api.ok) return; if (api.mode !== "overview") { api.mode = "overview"; setView("overview"); document.querySelectorAll("#view button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === "overview")) }
      const p = cellXZ(n); ctl.gTgt.set(p[0], heightAt(p[0], p[1]) * .6, p[1]); ctl.gR = Math.min(ctl.gR, 420); api.need = true },
    camInfo: () => api.ok ? { x: cam.position.x, z: cam.position.z, tx: ctl.tgt.x, tz: ctl.tgt.z, w2g } : null,
    ROVER_X,
  });
  return api;
})();

