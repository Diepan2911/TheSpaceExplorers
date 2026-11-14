// LOGO DAI HOC BACH KHOA TP.HCM TREN ROVER (logo.js, sau ui.js)
// Dan logo ke ben la co Viet Nam o hai ben than xe. Anh lay tu app/logo_bk.png, build_app.py 
// Giu nguyen code cu: Dung lai Rover ma sci_anim.js da tim thay trong canh 3D (SA.rv)

const LOGO_BK = "__LOGO_BK__";
(function logoBK() {
  if (typeof THREE === "undefined" || !LOGO_BK.startsWith("data:")) return;
  const img = new Image(); img.src = LOGO_BK;
  (function wait() {
    if (!SA.rv || !img.complete) return setTimeout(wait, 300);          // Doi tim thay Rover va tai xong anh
    const tex = new THREE.Texture(img); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4; tex.needsUpdate = true;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: .55, transparent: true, alphaTest: .05 }), body = SA.rv.model.children[0];   // nen trong suot
    for (const s of [-1, 1]) {                                            // co 0,3 x 0,2 m o x = 0,85; logo 0,2 x 0,2 m cung do cao, ngay phia sau co
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.2, .2), mat);
      m.position.set(.52, 1.04, s * 1.008); m.rotation.y = s > 0 ? 0 : Math.PI; body.add(m) }
    V3D.poke();
  })();
})();
