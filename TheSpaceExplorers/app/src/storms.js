// ================= BAO MAT TROI + BAO CAT NGAU NHIEN (storms.js, noi sau health.js khi dong goi) =================
// Moi lan Dat lai / Chay lai, vi tri (thoi diem) cua 1 con bao hat Mat Troi va 1 con bao cat duoc chon ngau nhien.
// Khi co bao: canh bao truoc, rover dung lai, phi hanh gia tru trong rover cho het bao. Thoi gian tru tinh thanh so sol
// tron nen lich lai xe sau bao giu nguyen. Trong luc tru van tieu oxy va nhien lieu, va nhan them lieu buc xa.
// Khong sua code cu: boc buildMission, buildEvents, updateDash, phaseLabel, drawMini, V3D.frame; tu chen giao dien.
// Nguon:
//  - Bao 20/5/2024 (cap X12): RAD tren Curiosity do 8.100 µGy, binh thuong ~700 µGy/ngay (NASA, 6/2024).
//  - Quy trinh tru bao cua Artemis II: 2 nguong (chu y / tru an), dung nuoc, thuc pham, do du tru lam ham tru (NASA).
//  - Gioi han NASA-STD-3001: 250 mSv moi su kien hat Mat Troi, 600 mSv ca su nghiep.
//  - Trieu chung cap tinh som (<1 Gy): buon non, non, chan an, met moi (Int. J. Radiat. Biol. 2020).
//  - Bui sao Hoa ~3 µm co silica, perchlorate (CU Boulder 2025); gio bao cat yeu vi khi quyen loang (NASA).
// GIA DINH MO PHONG: kich ban bao cuc manh (x25 su kien 2024), thoi gian canh bao, dang tang/giam cua lieu,
// he so che chan cua ham tru trong rover (0,5), thoi gian bao cat 1–3 sol. Lieu µGy coi xap xi µSv.

const STM = { on: true, seed: 0, raw: null, list: [], shown: new Set(), tm: 0, key: "", prevT: 0 };
const STM_SH = 0.5;                       // he so che chan ham tru trong rover (gia dinh)
const STM_CAU = 2, STM_SHL = 5;           // nguong Chu y / Tru an: toc do lieu moi truong gap 2 / 5 lan muc nen
const STM_SCN = {
  x12: { name: "Bùng phát Mặt Trời cấp X12", sub: "giống sự kiện thật 20/5/2024", out: 8.1, tau: 5, real: true },
  big: { name: "Bão hạt Mặt Trời cực mạnh", sub: "giả định mô phỏng, mạnh gấp 25 lần sự kiện 2024", out: 202, tau: 6, real: false },
};
const STM_TXT = {
  solar: {
    icon: "☀", col: "#ff4d3d", name: "Bão bức xạ Mặt Trời",
    why: "Mặt Trời phóng ra hạt proton năng lượng cao. Sao Hỏa không có từ trường toàn cầu, khí quyển lại mỏng nên hạt xuống tới bề mặt.",
    risk: ["Liều bức xạ tăng vọt trong vài giờ, cao nhất khi đang ở ngoài trời", "Liều lớn gây hội chứng bức xạ cấp: buồn nôn, nôn, mệt mỏi, chán ăn", "Cộng dồn vào liều cả sự nghiệp, tăng nguy cơ ung thư về lâu dài"],
    warn: ["Kết thúc EVA ngay, cả hai phi hành gia quay về rover", "Lái tới chỗ trú gần nhất; có vách đá thì đỗ sát vách để địa hình che một phía", "Dựng hầm trú: xếp bình nước, thực phẩm, đồ dự trữ dọc vách mỏng nhất của cabin", "Bật liều kế cá nhân, báo trung tâm điều khiển và đội y tế"],
    during: ["Ngồi giữa hầm trú, chỉ rời ra khi thật cần và thật nhanh", "Không EVA cho tới khi tốc độ liều về dưới ngưỡng Chú ý", "Ghi liều kế mỗi giờ, giữ liên lạc với đội y tế", "Uống đủ nước, nghỉ ngơi, hạn chế gắng sức"],
    watch: ["Buồn nôn, nôn", "Mệt mỏi, chán ăn", "Tiêu chảy", "Đỏ da (chỉ khi liều rất lớn)"],
    med: "Bộ y tế có thuốc chống nôn (ondansetron), dùng theo chỉ định của bác sĩ phi hành đoàn.",
    after: ["Chỉ ra ngoài khi tốc độ liều về dưới ngưỡng Chú ý", "Ghi tổng liều vào hồ sơ, so với 250 mSv mỗi sự kiện và 600 mSv cả sự nghiệp", "Theo dõi triệu chứng trong 72 giờ sau bão", "Liều gần giới hạn hoặc có triệu chứng: đề nghị quay về A (nút SOS)"],
  },
  dust: {
    icon: "🌪", col: "#d98a2b", name: "Bão cát khu vực",
    why: "Gió cuốn bụi mịn che kín bầu trời trong nhiều sol. Khí quyển rất loãng nên gió không đủ mạnh để lật xe; nguy hiểm chính là bụi và tầm nhìn.",
    risk: ["Bụi mịn cỡ 3 µm có silica, perchlorate lọt vào cabin: kích ứng phổi, mắt, họng", "Tầm nhìn giảm mạnh: dễ lạc đường, va vào đá nếu tiếp tục lái", "Bụi bám làm kẹt khớp bộ đồ, giảm độ kín, mờ kính mũ", "Thiếu nắng nên ban ngày lạnh hơn"],
    warn: ["Kết thúc EVA, mọi người vào rover", "Tìm chỗ đỗ bằng phẳng, ghi lại vị trí", "Đóng kín khóa khí, kiểm tra gioăng cửa và bộ lọc"],
    during: ["Không EVA; nếu bắt buộc ra ngoài: đi theo cặp, có dây nối, đèn và định vị", "Bật lọc không khí cabin, theo dõi bụi trong cabin", "Uống đủ nước, rửa mắt bằng nước sạch nếu cay mắt", "Giữ ấm cabin, kiểm tra nhiên liệu cho sưởi"],
    watch: ["Ho, khó thở", "Đau rát họng", "Cay mắt, chảy nước mắt", "Hắt hơi, nghẹt mũi"],
    med: "Triệu chứng hô hấp kéo dài thì đeo mặt nạ lọc trong cabin và báo bác sĩ phi hành đoàn.",
    after: ["Làm sạch bộ đồ và rover trong khóa khí trước khi vào cabin", "Kiểm tra gioăng bộ đồ, kính mũ, khớp nối", "Kiểm tra camera, cảm biến, thay bộ lọc không khí", "Ghi triệu chứng hô hấp vào sổ y tế"],
  },
};

// ---------- ngau nhien co hat giong: cung hat giong thi cung vi tri bao ----------
function stmRng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
function stmReroll() {
  STM.seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0; const r = stmRng(STM.seed);
  const u1 = .10 + .35 * r(), u2 = Math.min(.88, u1 + .22 + .3 * r()), solarFirst = r() < .5;
  STM.raw = [
    { kind: "solar", u: solarFirst ? u1 : u2, scn: r() < .65 ? "x12" : "big", lead: 1 + 2 * r() },
    { kind: "dust", u: solarFirst ? u2 : u1, sols: 1 + Math.floor(3 * r()), lead: 3 + 3 * r() },
  ].sort((a, b) => a.u - b.u);
  STM.shown.clear();
}
stmReroll();

// ---------- lieu them do bao hat (mSv/gio, ngoai troi): tang trong 1 gio roi giam theo ham mu ----------
const stmAmp = S => STM_SCN[S.scn].out / (.5 + STM_SCN[S.scn].tau);
const stmExtra = (S, tau) => S.kind !== "solar" || tau < 0 ? 0 : stmAmp(S) * (tau < 1 ? tau : Math.exp(-(tau - 1) / STM_SCN[S.scn].tau));

// chen 1 khoang tru bao vao chuoi keyframe cua hanh trinh
function stmInsert(M, S) {
  const kf = M.kf; if (S.t <= M.t0 + 1e-6 || S.t >= M.tEnd - 1e-6) return false;
  const s = stateAt(M, S.t), a = lowerIdx(kf, S.t), c = s.cell, base = doseRate(c);
  if (S.kind === "solar") {                               // tru den khi lieu moi truong ve duoi nguong Chu y, lam tron len so sol
    const A = stmAmp(S), tc = 1 + STM_SCN[S.scn].tau * Math.log(Math.max(1, A / ((STM_CAU - 1) * base)));
    S.D = Math.max(1, Math.ceil(tc / SOL_H)) * SOL_H; S.peakX = (base + A) / base;
  } else S.D = S.sols * SOL_H;
  const p0 = { t: S.t, pos: s.pos, d: s.d, o2: s.o2, fuel: s.fuel, dose: s.dose, ph: kf[a + 1] ? kf[a + 1].ph : "drive" };
  const add = [p0]; let t = S.t, o2 = s.o2, fuel = s.fuel, dose = s.dose, dIn = 0, dOut = 0, fail = null;
  const filt = S.kind === "dust" ? .1 : 0;                 // kW them cho loc khong khi khi bao cat (gia dinh)
  while (t < S.t + S.D - 1e-7) {
    const tau = t - S.t, dt = Math.min(tau < 3 ? .25 : .5, S.t + S.D - t), mid = tau + dt / 2;
    const ex = stmExtra(S, mid), P = MDL.pRest + filt + MDL.kHeatRest * Math.max(0, MDL.tHeat - tExt(t + dt / 2, c));
    const dO2 = cfg.crew * (MDL.o2Rest + MDL.o2Leak) * dt, dF = P * dt / MDL.eFuel;
    let x = 1; if (o2 - dO2 < 0) x = Math.min(x, o2 / dO2); if (fuel - dF < 0) x = Math.min(x, fuel / dF);
    t += dt * x; o2 = Math.max(0, o2 - dO2 * x); fuel = Math.max(0, fuel - dF * x);
    dose += (base + ex * STM_SH) * dt * x; dIn += ex * STM_SH * dt * x; dOut += ex * dt * x;
    add.push({ t, pos: s.pos, d: s.d, o2, fuel, dose, ph: "storm" });
    if (x < 1) { fail = { type: o2 <= 1e-9 ? "o2" : "fuel", t, pos: s.pos, d: s.d }; break }
  }
  S.c = c; S.d = s.d; S.pos = s.pos; S.dIn = dIn; S.dOut = dOut; S.base = base;
  const head = kf.slice(0, a + 1), tail = kf.slice(a + 1);
  if (kf[a] && kf[a].t >= S.t - 1e-9) add.shift();                 // tranh trung keyframe neu bao roi dung keyframe
  if (fail) { M.kf = head.concat(add); M.fail = fail; S.cut = true }
  else {
    const dO2 = s.o2 - o2, dF = s.fuel - fuel, dD = dose - s.dose, out = [];
    for (const k of tail) { const q = { ...k, t: k.t + S.D, o2: k.o2 - dO2, fuel: k.fuel - dF, dose: k.dose + dD };
      if (q.o2 <= 0 || q.fuel <= 0) {                     // het oxy / nhien lieu som hon do phai tru bao
        const pv = out.length ? out.at(-1) : add.at(-1), f = q.o2 <= 0 ? pv.o2 / (pv.o2 - q.o2) : pv.fuel / (pv.fuel - q.fuel), L = (x, y) => x + (y - x) * f;
        const e = { ...q, t: L(pv.t, q.t), pos: L(pv.pos, q.pos), d: L(pv.d, q.d), o2: Math.max(0, L(pv.o2, q.o2)), fuel: Math.max(0, L(pv.fuel, q.fuel)), dose: L(pv.dose, q.dose) };
        out.push(e); M.fail = { type: q.o2 <= 0 ? "o2" : "fuel", t: e.t, pos: e.pos, d: e.d }; break }
      out.push(q) }
    if (M.fail && !out.some(q => q.t === M.fail.t)) M.fail = { ...M.fail, t: M.fail.t + S.D };
    M.kf = head.concat(add, out);
  }
  const shift = add.length, nk = M.nodeKf;
  for (let k = 0; k < nk.length; k++) if (nk[k] > a) nk[k] = nk[k] + shift < M.kf.length ? nk[k] + shift : -1;
  M.tEnd = M.kf.at(-1).t; M.done = !M.fail;
  return true;
}

const stmBuild0 = buildMission;
buildMission = function (path, init, mode) {
  const M = stmBuild0(path, init, mode); M.storms = [];
  if (!STM.on || !STM.raw || init.o2 > 1e8 || !M.kf.length) return M;          // lan tinh so lieu tuyen (oxy vo han): khong co bao
  if (mode !== "return") { const T = M.tEnd - M.t0; let sh = 0;            // thoi diem tuyet doi: cong don thoi gian tru cua cac bao truoc
    for (const R of STM.raw) { const S = { ...R, id: R.kind, t: M.t0 + R.u * T + sh };
      if (M.fail && S.t >= M.tEnd - 1e-6) break;
      if (stmInsert(M, S)) { S.tw = Math.max(M.t0, S.t - S.lead); M.storms.push(S); sh += S.D }
      if (S.cut) break } }
  else for (const S0 of ((st.Mf && st.Mf.storms) || [])) {                    // quay ve: bao nao chua toi van xay ra
    if (S0.t <= init.t + 1e-6) continue; const S = { ...S0 };
    if (stmInsert(M, S)) { S.tw = Math.max(M.t0, S.t - S.lead); M.storms.push(S) }
    if (S.cut) break }
  // tinh lai diem khong the quay ve (lich da dich vi tru bao)
  if (mode !== "return" && M.storms.length) { M.pnr = null;
    for (let k = 1; k < M.path.length; k++) { const q = M.nodeKf[k]; if (q < 0) break;
      if (M.kf[q].o2 < M.need.o2[k] || M.kf[q].fuel < M.need.fuel[k]) {
        M.pnr = { k, d: M.kf[q].d, t: M.kf[q].t, why: M.kf[q].o2 < M.need.o2[k] ? "oxy" : "nhiên liệu" }; break } } }
  return M;
};

// ---------- trang thai bao tai thoi diem t ----------
function stmNow(M, t) {
  if (!M || !M.storms) return null;
  for (const S of M.storms) {
    if (t >= S.tw - 1e-9 && t < S.t) return { S, ph: "warn", left: S.t - t };
    if (t >= S.t && t < S.t + S.D - 1e-9) { const tau = t - S.t, ex = stmExtra(S, tau), env = (S.base + ex) / S.base;
      const done = M.kf[lowerIdx(M.kf, t)], f = S.D ? tau / S.D : 0;
      return { S, ph: "in", tau, left: S.t + S.D - t, env, ex, dIn: S.kind === "solar" ? stmDoseTo(S, tau) * STM_SH : 0, dOut: S.kind === "solar" ? stmDoseTo(S, tau) : 0, f, k: done } }
    if (t >= S.t + S.D - 1e-9 && t < S.t + S.D + 72) return { S, ph: "after", since: t - S.t - S.D };
  }
  return null;
}
function stmDoseTo(S, tau) { const A = stmAmp(S), T = STM_SCN[S.scn].tau;           // tich phan lieu them ngoai troi tu luc bat dau
  return tau <= 1 ? A * tau * tau / 2 : A * (.5 + T * (1 - Math.exp(-(tau - 1) / T))) }
const stmHM = h => { const m = Math.max(0, Math.round(h * 60)); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}` };
const stmName = S => S.kind === "solar" ? STM_SCN[S.scn].name : STM_TXT.dust.name;

// ---------- nhat ky ----------
const stmEvents0 = buildEvents;
buildEvents = function (M, label) {
  const ev = stmEvents0(M, label);
  for (const S of M.storms || []) { const T = STM_TXT[S.kind];
    if (S.kind === "solar") {
      ev.push({ t: S.tw, l: "crit", m: `${T.icon} ${STM_SCN[S.scn].name} (${STM_SCN[S.scn].sub}): hạt năng lượng tới sau ${fmtN(S.t - S.tw, 1)} giờ. ${T.warn[0]}.` });
      ev.push({ t: S.t, l: "crit", m: `${T.icon} Bão hạt tới ở km ${fmtN(S.d / 1000)}, liều môi trường cao nhất gấp ${fmtN(S.peakX)} lần mức nền. Ngưỡng trú ẩn: dừng rover, dựng hầm trú, không EVA.` });
      const big = S.dIn >= 125;
      ev.push({ t: S.t + S.D, l: big ? "warn" : "good", m: `${T.icon} Bão bức xạ đã qua sau ${fmtN(S.D / SOL_H)} sol trú. Liều nhận thêm ${fmtN(S.dIn, 1)} mSv trong hầm trú (nếu ở ngoài trời: ${fmtN(S.dOut, 1)} mSv), giới hạn 250 mSv mỗi sự kiện. `
        + (big ? "Liều đã quá nửa giới hạn: theo dõi triệu chứng 72 giờ, cân nhắc quay về A." : "Theo dõi buồn nôn, mệt mỏi trong 72 giờ rồi tiếp tục nhiệm vụ.") });
    } else {
      ev.push({ t: S.tw, l: "warn", m: `${T.icon} Ảnh quỹ đạo thấy bão cát đang tới, còn khoảng ${fmtN(S.t - S.tw, 1)} giờ. ${T.warn[0]}, ${T.warn[2].toLowerCase()}.` });
      ev.push({ t: S.t, l: "warn", m: `${T.icon} Bão cát bao trùm km ${fmtN(S.d / 1000)}: tầm nhìn rất kém, dừng rover, trú trong cabin khoảng ${fmtN(S.sols)} sol. Bật lọc không khí, không EVA.` });
      ev.push({ t: S.t + S.D, l: "good", m: `${T.icon} Bão cát đã tan. ${T.after[0]}; kiểm tra gioăng bộ đồ và bộ lọc rồi tiếp tục.` });
    }
    if (S.cut) ev.push({ t: S.t + S.D, l: "crit", m: `Trú bão quá lâu làm cạn ${M.fail && M.fail.type === "o2" ? "oxy" : "nhiên liệu"}: cần mang thêm dự trữ cho các ngày phải trú bão.` });
  }
  return ev.sort((a, b) => a.t - b.t);
};

// ---------- the trong tab Y te ----------
function stmRender(s) {
  const el = $("stmBody"); if (!el) return; const M = st.M, n = stmNow(M, st.t), li = a => a.map(x => `<li>${x}</li>`).join("");
  const key = n ? `${n.S.id}|${n.ph}|${Math.round((n.left ?? n.since) * 4)}` : `none|${(M && M.storms || []).map(S => st.t >= S.t + S.D).join()}|${STM.on}|${STM.seed}`;
  if (key === STM.key) return; STM.key = key;
  const pill = $("stmPill");
  if (!n) {
    const past = (M && M.storms || []).filter(S => st.t >= S.t + S.D);
    el.innerHTML = `<p class="hint">${STM.on ? "Chưa có cảnh báo bão. Trung tâm điều khiển theo dõi Mặt Trời và ảnh quỹ đạo liên tục; bão có thể tới bất cứ lúc nào." : "Bão ngẫu nhiên đang tắt."}</p>`
      + (past.length ? `<h3>Bão đã qua</h3><ul>${past.map(S => `<li>${STM_TXT[S.kind].icon} ${stmName(S)} · km ${fmtN(S.d / 1000)}${S.kind === "solar" ? ` · nhận thêm ${fmtN(S.dIn, 1)} mSv` : ` · trú ${fmtN(S.sols)} sol`}</li>`).join("")}</ul>` : "");
    pill.textContent = "Không có bão"; pill.dataset.s = "good"; return }
  const S = n.S, T = STM_TXT[S.kind];
  let h = `<div class="hzz" style="--c:${T.col}"><div class="hzt"><b>${T.icon} ${stmName(S)}</b><span class="chip" data-s="${n.ph === "after" ? "good" : S.kind === "solar" ? "crit" : "warn"}">${n.ph === "warn" ? "Cảnh báo sớm" : n.ph === "in" ? "Đang trú bão" : "Sau bão"}</span></div>`
    + (S.kind === "solar" ? `<p class="hint">${STM_SCN[S.scn].sub}</p>` : "") + `<p class="hint">${T.why}</p>`;
  if (n.ph === "warn") {
    h += `<div class="stmbig"><span>${S.kind === "solar" ? "Hạt năng lượng tới sau" : "Bão cát tới sau"}</span><b>${stmHM(n.left)}</b></div>
      <h3>Việc cần làm ngay</h3><ol>${li(T.warn)}</ol><h3>Vấn đề sức khỏe</h3><ul>${li(T.risk)}</ul>`;
    pill.textContent = "Cảnh báo bão"; pill.dataset.s = "warn";
  } else if (n.ph === "in") {
    if (S.kind === "solar") {
      const lv = n.env >= STM_SHL ? ["crit", "Trú ẩn"] : n.env >= STM_CAU ? ["warn", "Chú ý"] : ["good", "Dưới ngưỡng"];
      h += `<div class="stmgrid"><div><span>Liều môi trường</span><b>×${fmtN(n.env, n.env < 10 ? 1 : 0)}</b><small>so với mức nền · <span class="chip" data-s="${lv[0]}">${lv[1]}</span></small></div>
        <div><span>Bão còn</span><b>${stmHM(n.left)}</b><small>trú ${fmtN(S.D / SOL_H)} sol</small></div></div>
        <div class="stmrow"><span>Liều bão trong hầm trú</span><b>${fmtN(n.dIn, 2)} mSv</b></div>
        <div class="bar"><i style="width:${clamp(n.dIn / 250 * 100, 0, 100)}%" data-s="${n.dIn >= 125 ? "crit" : n.dIn >= 50 ? "warn" : "good"}"></i></div>
        <p class="hint">giới hạn 250 mSv mỗi sự kiện · nếu ở ngoài trời sẽ nhận ${fmtN(n.dOut, 2)} mSv · hầm trú che chắn khoảng ${fmtN(STM_SH * 100)}% (giả định)</p>
        <p class="hint">Ngưỡng Chú ý: gấp ${STM_CAU} lần nền · Ngưỡng Trú ẩn: gấp ${STM_SHL} lần nền</p>`;
    } else h += `<div class="stmgrid"><div><span>Tầm nhìn</span><b>Rất kém</b><small>dừng lái, không EVA</small></div><div><span>Bão còn</span><b>${stmHM(n.left)}</b><small>trú ${fmtN(S.sols)} sol</small></div></div>`;
    h += `<h3>Trong lúc trú bão</h3><ol>${li(T.during)}</ol><h3>Theo dõi triệu chứng</h3><ul>${li(T.watch)}</ul><p class="hint">💊 ${T.med}</p>`;
    pill.textContent = S.kind === "solar" ? "Trú bão bức xạ" : "Trú bão cát"; pill.dataset.s = S.kind === "solar" ? "crit" : "warn";
  } else {
    h += `<p class="hint">Bão đã qua ${fmtN(n.since, 1)} giờ.${S.kind === "solar" ? ` Liều nhận thêm ${fmtN(S.dIn, 1)} mSv (ngoài trời sẽ là ${fmtN(S.dOut, 1)} mSv).` : ""}</p>
      <h3>Sau bão</h3><ol>${li(T.after)}</ol><h3>Tiếp tục theo dõi (72 giờ)</h3><ul>${li(T.watch)}</ul>`;
    pill.textContent = "Theo dõi sau bão"; pill.dataset.s = S.kind === "solar" && S.dIn >= 125 ? "warn" : "good";
  }
  el.innerHTML = h + `</div>`;
}

// thong bao noi khi vua toi moc canh bao / bat dau / ket thuc bao
function stmToast(s) {
  const M = st.M; if (!M || !M.storms) return;
  for (const S of M.storms) for (const [tag, t] of [["w", S.tw], ["i", S.t], ["e", S.t + S.D]]) {
    const id = `${S.id}${tag}${Math.round(S.t * 10)}`;
    if (t > st.t + 1e-6) { STM.shown.delete(id); continue }
    if (STM.shown.has(id)) continue; STM.shown.add(id);
    if (!st.playing || st.t - t > 6) continue;                // chi bao khi dang chay va vua moi qua moc
    const T = STM_TXT[S.kind], ts = $("stmToast");
    ts.style.setProperty("--c", tag === "e" ? "#3fbf6f" : T.col);
    ts.querySelector("b").textContent = tag === "w" ? `${T.icon} Cảnh báo: ${stmName(S)} sắp tới (${stmHM(S.t - S.tw)})` : tag === "i" ? `${T.icon} ${stmName(S)}: trú bão ngay` : `${T.icon} ${T.name} đã qua`;
    ts.querySelector("span").textContent = tag === "w" ? T.warn.slice(0, 2).join(". ") + "." : tag === "i" ? T.during.slice(0, 2).join(". ") + "." : T.after.slice(0, 2).join(". ") + ".";
    ts.hidden = false; clearTimeout(STM.tm); STM.tm = setTimeout(() => ts.hidden = true, 15000);
    const hz = $("hzToast"); ts.style.top = hz && !hz.hidden ? `${hz.getBoundingClientRect().bottom + 8}px` : "";
  }
}

const stmDash0 = updateDash;
updateDash = function (s) { stmDash0(s); if (!st.M) return; const x = stateAt(st.M, st.t);
  if (x.ph === "storm") { const n = stmNow(st.M, st.t); $("hPhase").textContent = n && n.S.kind === "dust" ? "Trú bão cát trong rover" : "Trú bão bức xạ trong rover" }
  stmRender(x); stmToast(x); stmTicks() };
const stmPhase0 = phaseLabel;
phaseLabel = function (s) { if (st.M && s && s.ph === "storm") { const n = stmNow(st.M, st.t);
    return [n && n.S.kind === "dust" ? "warn" : "crit", n && n.S.kind === "dust" ? "Trú bão cát" : "Trú bão bức xạ"] }
  return stmPhase0(s) };

// vach bao tren thanh thoi gian
function stmTicks() {
  const box = $("stmTicks"), inp = $("scrub"), M = st.M; if (!box || !inp) return;
  const k = M ? `${M.t0}|${M.tEnd}|${(M.storms || []).map(S => S.t).join()}|${inp.offsetWidth}` : "";
  if (k === box.dataset.k) return; box.dataset.k = k;
  box.style.left = inp.offsetLeft + "px"; box.style.width = inp.offsetWidth + "px"; box.style.top = (inp.offsetTop + inp.offsetHeight - 3) + "px";
  const span = M ? M.tEnd - M.t0 : 0;
  box.innerHTML = !span ? "" : (M.storms || []).map(S => `<i style="left:${(S.t - M.t0) / span * 100}%;width:${S.D / span * 100}%;--c:${STM_TXT[S.kind].col}" title="${stmName(S)}"></i>`).join("");
}

// danh dau vi tri bao tren ban do nho
const stmMini0 = drawMini;
drawMini = function () { stmMini0(); const M = st.M; if (!M || !M.storms || !M.storms.length) return;
  const ctx = cv.getContext("2d"), sx = cv.width / W, sy = cv.height / H, u = window.devicePixelRatio || 1;
  ctx.save();
  for (const S of M.storms) { if (st.t < S.tw) continue;                                 // chua canh bao thi chua biet
    const x = (S.c % W + .5) * sx, y = (Math.floor(S.c / W) + .5) * sy, T = STM_TXT[S.kind];
    ctx.globalAlpha = .9; ctx.fillStyle = T.col; ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.arc(x, y, 7 * u, 0, 7); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1; ctx.font = `${10 * u}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.fillText(S.kind === "solar" ? "☀" : "≋", x, y + .5 * u) }
  ctx.restore() };

// ---------- hieu ung tren man hinh 3D + toc do phat khi tru bao ----------
const stmFrame0 = V3D.frame;
V3D.frame = function (s, dt, now, rate) {
  if (st.M && st.playing && s) {                                       // dieu chinh toc do phat quanh con bao
    const n = stmNow(st.M, STM.prevT), d = st.t - STM.prevT;
    if (n && d > 0 && d < 200 * dt + 1e-6) {
      if (n.ph === "warn") st.t = Math.min(st.t, STM.prevT + dt * Math.max(.2, (n.S.t - n.S.tw) / 12), n.S.t);   // dem nguoc ~12 giay de kip doc
      else if (n.ph === "in") st.t = Math.min(st.M.tEnd, STM.prevT + dt * (n.S.kind === "solar" ? Math.max(st.speed, 2) : Math.max(st.speed * 1.5, 3)));   // tru bao: ~12–25 giay moi bao
      s = stateAt(st.M, st.t) } }
  STM.prevT = st.t;
  stmFrame0(s, dt, now, rate); STM.prevT = st.t; stmFx(dt) };
function stmFx(dt) {
  const fx = $("stmFx"); if (!fx) return; const n = st.M ? stmNow(st.M, st.t) : null, inS = n && n.ph === "in";
  const kind = inS ? n.S.kind : "", g = fx.querySelector("canvas");
  if (fx.dataset.k !== kind) { fx.dataset.k = kind; fx.hidden = !kind }
  if (kind !== "solar") return;
  const w = innerWidth, h = innerHeight; if (g.width !== w || g.height !== h) { g.width = w; g.height = h }
  const ctx = g.getContext("2d"); ctx.clearRect(0, 0, w, h);
  const N = Math.round(clamp(8 * Math.log10(n.env), 0, 40) * (st.playing ? 1 : .5));          // so dom "tuyet" theo toc do lieu
  ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1;
  for (let i = 0; i < N; i++) { const x = Math.random() * w, y = Math.random() * h;
    if (Math.random() < .3) { const a = Math.random() * 6.3, L = 4 + Math.random() * 14; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke() }
    else ctx.fillRect(x, y, 1.5 + Math.random() * 1.5, 1.5 + Math.random() * 1.5) }
}

(function stmUI() {
  if (typeof document === "undefined") return;
  const css = document.createElement("style");
  css.textContent = `.stmfx{position:fixed;inset:0;z-index:1;pointer-events:none} .stmfx canvas{position:absolute;inset:0;width:100%;height:100%}
.stmfx[data-k="solar"]{box-shadow:inset 0 0 120px rgba(255,40,30,.55);animation:stmPulse 2.4s ease-in-out infinite}
.stmfx[data-k="dust"]{background:radial-gradient(ellipse at 30% 40%,rgba(205,120,50,.35),transparent 60%),radial-gradient(ellipse at 75% 65%,rgba(170,90,40,.4),transparent 55%),rgba(150,85,40,.42);
  background-size:160% 160%,180% 180%,auto;animation:stmDrift 9s linear infinite alternate}
@keyframes stmPulse{50%{box-shadow:inset 0 0 70px rgba(255,40,30,.3)}} @keyframes stmDrift{to{background-position:100% 60%,0% 30%,0 0}}
@media (prefers-reduced-motion:reduce){.stmfx{animation:none!important}}
.stmbig{display:flex;justify-content:space-between;align-items:baseline;margin:6px 0;padding:8px 10px;border-radius:8px;background:color-mix(in srgb,var(--c) 18%,transparent)}
.stmbig b{font:700 24px var(--f-mono)} .stmgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0}
.stmgrid>div{padding:7px 9px;border-radius:8px;background:color-mix(in srgb,var(--c) 14%,transparent);display:grid;gap:2px}
.stmgrid span{font-size:11.5px;color:var(--ink-3)} .stmgrid b{font:700 19px var(--f-mono)} .stmgrid small{font-size:11.5px;color:var(--ink-2)}
.stmrow{display:flex;justify-content:space-between;font-size:12.5px;margin-top:4px} .stmrow b{font-family:var(--f-mono)}
#stmCard .bar{height:7px;border-radius:4px;background:var(--rule);overflow:hidden;margin:3px 0} #stmCard .bar i{display:block;height:100%;background:#3fbf6f}
#stmCard .bar i[data-s="warn"]{background:#f2a33a} #stmCard .bar i[data-s="crit"]{background:#ff4d3d}
#stmCard ol{margin:2px 0 4px;padding-left:20px;font-size:12.5px;color:var(--ink-2)} .stmopt{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px;font-size:12.5px}
.timeline{position:relative} .stmticks{position:absolute;height:5px;pointer-events:none} .stmticks i{position:absolute;top:0;height:5px;min-width:4px;border-radius:2px;background:var(--c)}`;
  document.head.appendChild(css);
  const sec = document.createElement("section"); sec.className = "card"; sec.id = "stmCard";
  sec.innerHTML = `<div class="cardh"><h2>Bão bức xạ và bão cát</h2><span class="pill" id="stmPill" data-s="good">Không có bão</span></div><div id="stmBody"></div>
    <div class="stmopt"><label><input type="checkbox" id="stmOn" checked> Bão ngẫu nhiên</label><button class="btn" id="stmRoll">🎲 Đổi vị trí bão</button></div>`;
  const pane = document.querySelector('[data-pane="med"]'); pane.insertBefore(sec, pane.firstChild);
  const ts = document.createElement("div"); ts.className = "hztoast"; ts.id = "stmToast"; ts.hidden = true; ts.setAttribute("role", "alert");
  ts.innerHTML = `<b></b><span></span><button class="btn" id="stmMore">Xem cách xử lí</button>`; document.body.appendChild(ts);
  $("stmMore").onclick = () => { ts.hidden = true; document.dispatchEvent(new Event("open-med")); sec.scrollIntoView({ block: "start", behavior: "smooth" }) };
  const fx = document.createElement("div"); fx.className = "stmfx"; fx.id = "stmFx"; fx.hidden = true; fx.innerHTML = "<canvas></canvas>";
  const vp = document.querySelector(".vp"); vp && vp.parentNode ? vp.parentNode.insertBefore(fx, vp.nextSibling) : document.body.appendChild(fx);
  const tl = document.querySelector(".timeline"); if (tl) { const tk = document.createElement("div"); tk.className = "stmticks"; tk.id = "stmTicks"; tl.appendChild(tk) }
  const roll = () => { stmReroll(); STM.key = ""; rebuildMission(false) };
  $("stmRoll").onclick = roll;
  $("stmOn").onchange = e => { STM.on = e.target.checked; STM.key = ""; rebuildMission(true) };
  $("reset").addEventListener("click", roll);                                                    // dat lai: bao o vi tri moi
  $("play").addEventListener("click", () => { if (st.M && st.mode === "fwd" && st.t >= st.M.tEnd - 1e-6) roll() }, true);   // chay lai tu dau
  addEventListener("resize", () => { const b = $("stmTicks"); if (b) b.dataset.k = "" });
  if (st.M) rebuildMission(true);
})();
