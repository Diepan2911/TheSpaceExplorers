(function wideLayout() {
  if (typeof document === "undefined") return;
  const css = document.createElement("style");
  css.textContent = `
.wbtn{font:600 12.5px var(--f-body);border:1px solid var(--rule);background:var(--panel);color:var(--ink);border-radius:7px;padding:6px 11px;cursor:pointer;white-space:nowrap}
.wbtn:hover{border-color:var(--accent)}
body.wide .mid{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important}
body.wide .vp{grid-column:1!important;grid-row:1!important;border-radius:10px}
body.wide .side{position:fixed;z-index:30;top:64px;bottom:76px;width:min(360px,92vw);overflow-y:auto;background:var(--bg);
  padding:10px;border:1px solid var(--rule);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:transform .22s ease;grid-column:auto!important;grid-row:auto!important}
body.wide .side.l{left:10px;transform:translateX(calc(-100% - 20px))} body.wide .side.r{right:10px;transform:translateX(calc(100% + 20px))}
body.wide .side.open{transform:none}
.dtog{display:none;position:fixed;z-index:31;top:50%;transform:translateY(-50%);writing-mode:vertical-rl;font:600 12px var(--f-body);letter-spacing:.04em;
  padding:12px 6px;border:1px solid var(--glass-rule);background:var(--glass);color:var(--glass-ink);cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
body.wide .dtog{display:block} .dtog.l{left:0;border-radius:0 8px 8px 0} .dtog.r{right:0;border-radius:8px 0 0 8px}
body.wide .dtog[aria-expanded="true"]{background:var(--accent);color:var(--on-accent)}
@media (max-width:760px){body.wide .side{top:56px;bottom:70px}}
@media (prefers-reduced-motion:reduce){body.wide .side{transition:none}}`;
  document.head.appendChild(css);

  const btn = document.createElement("button"); btn.className = "wbtn"; btn.id = "wideBtn"; btn.setAttribute("aria-pressed", "false");
  document.querySelector(".topbar").appendChild(btn);
  const L = document.querySelector(".side.l"), Rp = document.querySelector(".side.r");
  const mk = (cls, label, panel) => { const b = document.createElement("button"); b.className = "dtog " + cls; b.textContent = label;
    b.setAttribute("aria-expanded", "false"); b.onclick = () => toggle(panel, b); document.body.appendChild(b); return b };
  const tl = mk("l", "Nhiệm vụ · Tuyến · Khoa học", L), trr = mk("r", "Y tế và biểu đồ", Rp);

  function toggle(panel, b, force) {
    const open = force ?? !panel.classList.contains("open"); panel.classList.toggle("open", open); b.setAttribute("aria-expanded", open);
    if (open && panel === Rp) { drawProfile(); drawBudget(); drawGeoBand() }
    if (open && panel === L && typeof sciDraw === "function") setTimeout(sciDraw, 0);
  }
  function setWide(on) {
    document.body.classList.toggle("wide", on); btn.setAttribute("aria-pressed", on);
    btn.textContent = on ? "⤡ Thu nhỏ" : "⤢ Mở rộng 3D";
    toggle(L, tl, false); toggle(Rp, trr, false);
    setTimeout(() => { drawMini(); V3D.poke() }, 50);
  }
  btn.onclick = () => {
    const on = !document.body.classList.contains("wide"); setWide(on);
    try {   
      if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
      if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (e) {}
  };
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && document.body.classList.contains("wide")) setWide(false) });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && document.body.classList.contains("wide")) { toggle(L, tl, false); toggle(Rp, trr, false) } });
  setWide(false);
})();
