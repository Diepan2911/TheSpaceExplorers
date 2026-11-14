// ================= GIAO DIEN GON (ui.js, noi sau health.js khi dong goi; thay cho layout.js) =================
// Khung 3D luon toan man hinh. Thanh trang thai tren cung: nut chay/tam dung, toc do, thanh thoi gian, trang thai, goc nhin,
// so lieu hanh trinh; nut "Thong tin" mo ngan keo chua cac tab (nhiem vu, tuyen, rover, khoa hoc, bieu do, hien thi).
// Ban do nho o goc trai tren, bang suc khoe o ben phai, ca hai thu ra thu vao duoc. Luc mo trang chi co nut Bat dau o giua.
// Khong sua code cu: chi chuyen cac khoi HTML co san (giu nguyen id) sang cho moi va them CSS.
(function ui() {
  if (typeof document === "undefined") return;
  const css = document.createElement("style");
  css.textContent = `
body.ui2{display:block;padding:0;overflow:hidden;height:100vh;height:100dvh;--rp:min(380px,calc(100vw - 20px));
  --m1:#e0662d;--m1h:#c9561f;--m2:#f5c518;--m3:#7a5a48;--m4:#f0a020;--m5:#e8502a;--mt:#1a1006}   /* tong nong: cam, vang, nau, vang cam, do cam; chu toi */
/* nen den am cho toan app (che do toi, doi mau nhan tu xanh sang cam); :root:root de thang style.css nam sau */
:root:root[data-theme="dark"]{--bg:#070504;--panel:#14100d;--chip:#231a14;--rule:#3a2b20;--ink:#f6eee6;--ink-2:#d2c3b4;--ink-3:#a8968a;--accent:#f08a24;--on-accent:#1a0f06;
  --mark:#f6eee6;--halo:#070504;--warn-bg:#3a2510;--warn-ink:#ffc46b;--s-bg-info:#3a2210;--s-ink-info:#ffb36b;--glass:rgba(14,9,6,.8);--vp-bg:#0d0907;color-scheme:dark}
.card.prof,.card.budget{--accent:var(--r-opt)} .card thead th.o{color:var(--r-opt)}   /* bieu do: duong toi uu / oxy giu mau xanh nhu tuyen tren 3D */
body.ui2.rp-closed{--rp:30px}
body.ui2 .mid{display:block}
body.ui2 .side.l,body.ui2 .ctlbar,body.ui2 #rtabs{display:none!important}
body.ui2 .vp{position:fixed;inset:0;z-index:0;border-radius:0;height:auto!important;min-height:0!important}
body.ui2 .topbar{position:fixed;z-index:40;left:0;right:0;top:0;display:grid;gap:6px;background:var(--panel);border-bottom:1px solid var(--rule);
  padding:8px max(12px,env(safe-area-inset-right,0px)) 8px max(12px,env(safe-area-inset-left,0px));box-shadow:0 4px 18px rgba(0,0,0,.18)}
.tbr{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;min-width:0}
.tbr .brand{margin-right:2px;min-width:0} .tbr .brand h1{font-size:18px;white-space:nowrap} .tbr .brand p{display:none}
.tbr .timeline{flex:1 1 200px;min-width:160px} .tbr #sos .lg{display:none} .tbr #sos .sm{display:inline}
@media (max-width:1400px){.tbr .brand{display:none}}
.tbr .tinfo[aria-expanded="true"]{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.tbr2{flex-wrap:nowrap} body.ui2 .hud{position:static;pointer-events:auto;max-width:none;flex:1 1 0;min-width:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 18px;padding:5px 12px;border-radius:8px}
body.ui2 .hud>div{display:flex;gap:6px;align-items:baseline} body.ui2 .hud .opt{display:flex!important}
body.ui2 .hud .sahud{border:0;margin:0;padding:0;max-width:none} body.ui2 .hud .sahud i{display:inline-block;width:80px;margin:0 0 0 8px;vertical-align:middle}
#play{font:700 15px var(--f-body);padding:9px 18px;min-width:150px;border-radius:9px;border:0;color:#fff;gap:8px;letter-spacing:.02em}
#play svg{width:14px;height:14px}
#play[data-state="off"]{background:var(--m1)} #play[data-state="off"]:hover{background:var(--m1h)}
#play[data-state="on"]{background:var(--m2);color:var(--mt);animation:ppulse 1.6s infinite} #play[data-state="on"]:hover{background:#e0b010}
@keyframes ppulse{0%{box-shadow:0 0 0 0 rgba(245,197,24,.7)}70%{box-shadow:0 0 0 10px rgba(245,197,24,0)}100%{box-shadow:0 0 0 0 rgba(245,197,24,0)}}
.drawer{position:fixed;z-index:35;left:0;right:0;top:var(--tb,64px);max-height:min(62vh,640px);display:grid;grid-template-rows:auto minmax(0,1fr);
  background:var(--bg);border-bottom:1px solid var(--rule);box-shadow:0 14px 30px rgba(0,0,0,.3)}
.dhead{display:flex;gap:10px;align-items:center;padding:8px 12px} .dhead .tabs{position:static;flex:1}
.dbody{overflow:auto;padding:0 12px 12px;overscroll-behavior:contain}
.drawer .pane{grid-template-columns:repeat(auto-fill,minmax(330px,1fr));align-items:start}
body.ui2 .mini{left:10px;right:auto;top:calc(var(--tb,64px) + 10px);width:240px}
.mtog{display:flex;width:100%;justify-content:space-between;align-items:center;background:transparent;border:0;color:var(--glass-ink);
  font:600 11.5px var(--f-body);letter-spacing:.06em;text-transform:uppercase;padding:4px 6px;cursor:pointer}
.mini.closed .mapbox,.mini.closed .cap,.mini.closed .pk{display:none} .mini.closed .ar{display:inline-block;transform:rotate(-90deg)} .mini .cap span:first-child{visibility:hidden}
body.ui2 .side.r{position:fixed;z-index:30;right:10px;top:calc(var(--tb,64px) + 10px);bottom:10px;width:var(--rp);overflow-y:auto;background:var(--bg);
  border:1px solid var(--rule);border-radius:12px;padding:0 10px 10px;box-shadow:0 10px 30px rgba(0,0,0,.3);display:grid;align-content:start;gap:10px}
.phead{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;background:var(--bg);padding:10px 2px 6px;
  font:600 13px var(--f-display);letter-spacing:.05em;text-transform:uppercase}
.ptog{border:1px solid var(--rule);background:var(--panel);color:var(--ink);border-radius:6px;padding:3px 10px;cursor:pointer;font-size:14px}
.rtab{display:none;position:fixed;z-index:30;right:0;top:50%;transform:translateY(-50%);writing-mode:vertical-rl;padding:14px 7px;border-radius:9px 0 0 9px;
  border:1px solid var(--rule);background:var(--panel);color:var(--ink);font:600 12.5px var(--f-body);cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.25)}
body.ui2.rp-closed .side.r{display:none} body.ui2.rp-closed .rtab{display:block}
body.ui2 .readout{right:calc(var(--rp) + 20px)} body.ui2 .banner{right:calc(var(--rp) + 20px)}
body.prestart .topbar,body.prestart .drawer,body.prestart .side.r,body.prestart .rtab,body.prestart .mini,body.prestart .legend3,
body.prestart .readout,body.prestart .banner,body.prestart .hztoast{display:none!important}
.startov{position:fixed;inset:0;z-index:80;display:grid;place-items:center;background:radial-gradient(circle at 50% 50%,rgba(10,6,4,.1),rgba(10,6,4,.55))}
.startbtn{display:inline-flex;align-items:center;gap:14px;font:700 28px var(--f-display);letter-spacing:.08em;text-transform:uppercase;padding:22px 54px;
  border-radius:999px;border:0;background:#e0662d;color:#fff;cursor:pointer;box-shadow:0 12px 40px rgba(0,0,0,.45);transition:transform .15s}
.startbtn svg{width:24px;height:24px;fill:currentColor} .startbtn:hover{background:#c9561f;transform:scale(1.04)}
/* ---- mau sac: moi chuc nang mot mau, nut sang de nguoi moi nhin la biet ---- */
.tbr .btn,.tbr .seg button,.rtab,.mtog,.dhead .tabs button{transition:filter .15s,transform .1s}
.tbr .btn:hover,.rtab:hover{filter:brightness(1.1)} .tbr .btn:active{transform:translateY(1px)}
.cbtn{color:#fff!important;border:0!important;background-image:linear-gradient(rgba(255,255,255,.2),rgba(255,255,255,0))!important;box-shadow:0 2px 6px rgba(0,0,0,.2)}
#reset.cbtn{background-color:var(--m3)} #sos.cbtn{background-color:#c62828} #sos.cbtn:hover{background-color:#a61f1f}
.tbr .tinfo.cbtn{background-color:var(--m5)} .tbr .tinfo.cbtn[aria-expanded="true"]{background-color:#b83d1f;box-shadow:inset 0 2px 5px rgba(0,0,0,.35)}
#sos .sm::before{content:"⚠ "}
#play[data-state],#startBtn{background-image:linear-gradient(rgba(255,255,255,.2),rgba(255,255,255,0))}
.grp{display:inline-flex;align-items:center;gap:6px} .grp .gl{font:700 10.5px var(--f-body);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);white-space:nowrap}
.grp .seg button{font-weight:600} .grp .seg button:not([aria-pressed="true"]):hover{background:var(--panel)}
#speed button[aria-pressed="true"]{background:var(--m4);color:var(--mt);box-shadow:none} #view button[aria-pressed="true"]{background:var(--m1);color:#fff;box-shadow:none}
.mtog{background:#b5541c;color:#fff;border-radius:5px;margin-bottom:4px}
.rtab{background:#e03131;color:#fff;border-color:#e03131} .phead{border-bottom:3px solid #e03131;margin-bottom:2px} .phead>span::before{content:"✚ ";color:#ff5a4a}
.dhead .tabs button{display:inline-flex;align-items:center;justify-content:center;gap:7px}
.dhead .tabs button::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--tc)}
.dhead .tabs button[aria-selected="true"]{background:var(--tc);color:var(--tt);box-shadow:none} .dhead .tabs button[aria-selected="true"]::before{background:var(--tt)}
.tbr .timeline input{accent-color:var(--m1)} body.ui2 .hud .sahud{color:#ffb68a}
#drClose{background:var(--m3);color:#fff;border:0}
@media (max-width:760px){.tbr2{flex-wrap:wrap} body.ui2 .hud{flex-basis:100%} .grp .gl{display:none} .tbr .brand{display:none} #play{min-width:0;padding:8px 14px} .tbr .timeline{order:9;flex-basis:100%}
  body.ui2 .mini{width:150px} body.ui2 .side.r{left:10px;width:auto} .drawer .pane{grid-template-columns:minmax(0,1fr)}
  body.ui2 .hud{font-size:11px;gap:2px 10px} body.ui2 .hud .opt{display:none!important} .startbtn{font-size:22px;padding:18px 40px}}
@media (prefers-reduced-motion:reduce){#play[data-state="on"]{animation:none}}`;
  document.head.appendChild(css);

  const B = document.body, el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e };
  B.classList.add("ui2", "prestart"); document.documentElement.dataset.theme = "dark";   // nen den
  const tb = document.querySelector(".topbar"), foot = document.querySelector(".ctlbar"), R = document.querySelector(".side.r");

  // 1) thanh trang thai tren cung: hang 1 dieu khien, hang 2 so lieu hanh trinh (o thong tin cu)
  const r1 = el("div", "tbr"), r2 = el("div", "tbr tbr2");
  const info = el("button", "btn tinfo", "☰ Thông tin"); info.setAttribute("aria-expanded", "false");
  const grp = (lab, node) => { const g = el("div", "grp", `<span class="gl">${lab}</span>`); g.appendChild(node); return g };   // nhom co nhan
  document.querySelector('#view button[data-v="follow"]').textContent = "Rover";
  const reset = $("reset"), sos = $("sos"), speed = $("speed"), view = $("view");      // lay truoc khi chuyen cho
  r1.append(tb.querySelector(".brand"), $("play"), reset, grp("Tốc độ", speed), foot.querySelector(".timeline"), $("pill"), sos, info);
  r2.append($("hud"), grp("Góc nhìn", view));
  [reset, sos, info].forEach(b => b.classList.add("cbtn"));
  [[reset, "Đưa rover về đầu hành trình"], [speed, "Số giờ mô phỏng trôi qua mỗi giây"], [sos, "Khẩn cấp: rover quay ngay về điểm A"],
   [info, "Mở bảng nhiệm vụ, tuyến, rover, khoa học, biểu đồ"], [view, "Đổi góc camera 3D"]].forEach(([n, t]) => n.title = t);
  const old = [...tb.children];                      // cac nhom cu con lai: lop dia hinh, phong dai cao
  tb.append(r1, r2);
  $("play").title = "Phím cách";

  // 2) ngan keo "Thong tin": cac tab chi tiet
  const dr = el("div", "drawer", `<div class="dhead"><div class="tabs" role="tablist" id="dtabs" aria-label="Thông tin chi tiết"></div>
    <button class="btn" id="drClose">Thu gọn ▲</button></div><div class="dbody" id="dbody"></div>`);
  dr.hidden = true; B.appendChild(dr);
  const disp = el("div", "pane", `<section class="card"><h2>Lớp tô màu địa hình</h2></section><section class="card"><h2>Phóng đại độ cao</h2></section>`);
  disp.dataset.pane = "disp"; disp.setAttribute("role", "tabpanel");
  disp.children[0].appendChild($("layers")); disp.children[1].appendChild(tb.querySelector(".tg.ve") || old.find(o => o.classList.contains("ve")));
  old.forEach(o => { if (o.parentNode === tb) o.remove() });
  const TABC = { mis: ["#e0662d", "#fff"], route: ["#f0a020", "#1a1006"], rover: ["#c2410c", "#fff"], sci: ["#e8502a", "#fff"], chart: ["#f5c518", "#1a1006"], disp: ["#7a5a48", "#fff"] };   // mau nen, mau chu tung tab
  const names = { mis: "Nhiệm vụ", route: "Tuyến", rover: "Rover", sci: "Khoa học", chart: "Biểu đồ", disp: "Hiển thị" };
  [...document.querySelectorAll('[data-of="ltabs"]'), document.querySelector('[data-pane="chart"]'), disp].forEach((p, i) => {
    p.dataset.of = "dtabs"; p.hidden = i > 0; $("dbody").appendChild(p);
    const b = el("button", "", names[p.dataset.pane] || p.dataset.pane); b.setAttribute("role", "tab"); b.dataset.t = p.dataset.pane;
    const [tc, tt] = TABC[p.dataset.pane] || TABC.mis; b.style.setProperty("--tc", tc); b.style.setProperty("--tt", tt);
    b.setAttribute("aria-selected", i === 0); $("dtabs").appendChild(b) });
  bindTabs("dtabs");
  $("dtabs").querySelector('[data-t="sci"]')?.addEventListener("click", () => setTimeout(() => window.sciDraw && sciDraw(), 0));
  const setDr = open => { dr.hidden = !open; info.setAttribute("aria-expanded", open);
    const t = $("dtabs").querySelector('[aria-selected="true"]')?.dataset.t;
    if (open && t === "chart") { drawProfile(); drawBudget(); drawGeoBand() }
    if (open && t === "sci" && window.sciDraw) setTimeout(sciDraw, 0) };
  info.onclick = () => setDr(dr.hidden); $("drClose").onclick = () => setDr(false);

  // 3) bang suc khoe ben phai, thu gon thanh tab o mep phai
  R.insertBefore(el("div", "phead", `<span>Bảng sức khỏe</span><button class="ptog" id="rpTog" title="Thu gọn">▸</button>`), R.firstChild);
  const rtab = el("button", "rtab", "Y tế ◂"); B.appendChild(rtab);
  const setRp = open => { B.classList.toggle("rp-closed", !open); if (open) { ecg.width = 0; refreshAll() } V3D.poke() };
  $("rpTog").onclick = () => setRp(false); rtab.onclick = () => setRp(true);
  document.addEventListener("open-med", () => setRp(true));

  // 4) ban do nho goc trai tren, thu gon duoc
  const mw = $("miniwrap"), mh = el("button", "mtog", `<span>Bản đồ nhỏ</span><span class="ar">▾</span>`); mh.setAttribute("aria-expanded", "true");
  mw.insertBefore(mh, mw.firstChild);
  mh.onclick = () => { const open = mw.classList.toggle("closed") === false; mh.setAttribute("aria-expanded", open); if (open) setTimeout(drawMini, 0) };
  $("legend3").open = false;

  // 5) nut chay/tam dung doi mau theo trang thai; phim cach de chay/dung, Esc dong ngan keo
  const setPlayBtn0 = setPlayBtn;
  setPlayBtn = function () { setPlayBtn0(); $("play").dataset.state = st.playing ? "on" : "off" };
  setPlayBtn();
  document.addEventListener("keydown", e => { if (B.classList.contains("prestart")) return;
    if (e.code === "Space" && !/INPUT|TEXTAREA|BUTTON|SELECT/.test(e.target.tagName)) { e.preventDefault(); $("play").click() }
    if (e.key === "Escape" && !dr.hidden) setDr(false) });

  // 6) chieu cao thanh tren cung -> bien CSS --tb de dat cac bang ben duoi
  const tbH = () => document.documentElement.style.setProperty("--tb", tb.offsetHeight + "px");
  new ResizeObserver(tbH).observe(tb); tbH();
  setTimeout(() => { const sw = document.querySelector(".langsw"); if (sw) r1.appendChild(sw) }, 0);   // nut VI/EN (i18n.js) vao hang 1
  if (window.innerWidth < 900) setRp(false);

  // 7) man hinh dau: chi co nut Bat dau o giua
  const so = el("div", "startov", `<button class="startbtn" id="startBtn"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z"/></svg>Bắt đầu</button>`);
  B.appendChild(so);
  $("startBtn").onclick = () => { B.classList.remove("prestart"); so.remove();
    setTimeout(() => { tbH(); drawMini(); ecg.width = 0; refreshAll(); V3D.poke(); if (st.M && !st.playing) $("play").click() }, 30) };
})();
