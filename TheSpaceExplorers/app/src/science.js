// KHOA HOC & MARSWALK (science.js, noi vao cuoi app.js)
// Them tab "Khoa hoc": (1) cac diem dung khoa hoc doc tuyen toi uu theo don vi dia chat USGS,
// (2) lap ke hoach Marswalk (EVA di bo) quanh moi diem dung: Vung toi duoc trong mot ca EVA, 
// Tuyen di/ve Rover. Giu nguyen code: Tu chen giao dien, boc them drawnMini, tu theo doi tuyen thay doi.

// Muc tieu khoa hoc theo don vi dia chat
const SCI_UNIT = {
  Aa:   { t: "Vành aureole: nguồn gốc các thùy gờ–rãnh khổng lồ", q: "Aureole hình thành do sạt lở khổng lồ từ sườn núi, do khối sườn núi trượt dần ra ngoài, hay có băng tham gia?", m: "Chụp cấu trúc gờ–rãnh, đo hướng gờ, lấy mẫu vụn đá để xem nguồn gốc (dung nham sườn núi hay vật liệu khác).", tool: "Camera đa phổ · radar xuyên đất · búa địa chất" },
  lAa:  { t: "Vạt chân núi trẻ: vật liệu sạt từ sườn", q: "Vật liệu vạt chân núi trẻ có cùng nguồn với aureole không, và hoạt động gần đây đến mức nào?", m: "So sánh thành phần và độ phong hóa với mẫu ở vành aureole.", tool: "Phổ kế tia X cầm tay · camera đa phổ" },
  Ave:  { t: "Sườn khiên Olympus Mons: lịch sử dòng dung nham", q: "Các dòng dung nham thùy trên sườn núi phun trào trong bao lâu và thay đổi thành phần ra sao?", m: "Lấy mẫu bazan ở nhiều độ cao, đo độ dày dòng chảy, tìm ống dung nham.", tool: "Khoan lõi ngắn · phổ kế tia X · từ kế" },
  lAv:  { t: "Dung nham trẻ: mốc định tuổi", q: "Tuổi tuyệt đối của dung nham Amazon muộn là bao nhiêu (để hiệu chỉnh cách định tuổi bằng mật độ hố va chạm)?", m: "Lấy mẫu bazan tươi, ít phong hóa, mang về Trái Đất định tuổi phóng xạ.", tool: "Bộ lấy mẫu mang về · camera đa phổ" },
  lAvf: { t: "Cánh đồng núi lửa nhỏ: miệng phun phụ", q: "Các miệng phun nhỏ có cùng nguồn magma với Olympus Mons không?", m: "Lấy mẫu quanh miệng phun, đo hình dạng nón.", tool: "Phổ kế tia X · camera" },
  AHtu: { t: "Đồng bằng chuyển tiếp: trầm tích và gió", q: "Bề mặt đồng bằng do trầm tích, tro núi lửa hay dung nham bị phủ?", m: "Đào rãnh nông, quan sát phân lớp, tìm dấu vết gió (yardang).", tool: "Xẻng · camera hiển vi · radar xuyên đất" },
  AHv:  { t: "Đồng bằng dung nham Tharsis", q: "Dòng dung nham đồng bằng đến từ Olympus Mons hay từ các núi lửa Tharsis khác?", m: "So thành phần với mẫu sườn Olympus Mons.", tool: "Phổ kế tia X" },
  Hv:   { t: "Dung nham cổ (Hesperia)", q: "Dung nham cổ ghi lại môi trường Sao Hỏa sớm hơn thế nào (phong hóa, nước)?", m: "Tìm khoáng biến đổi do nước trên bề mặt đá cổ.", tool: "Phổ kế hồng ngoại · camera hiển vi" },
};
const SCI_SCARP = { t: "Vách chân núi: mặt cắt địa tầng lộ ra", q: "Vách dốc bao quanh Olympus Mons lộ các lớp dung nham nào, và vì sao núi có vách dốc đứng như vậy?", m: "Chụp và đo mặt cắt từ chân vách, lấy mẫu từng lớp có thể tiếp cận an toàn.", tool: "Camera tele · máy đo khoảng cách laser · búa địa chất" };
const SCI_TOP = { t: "Hõm chảo đỉnh: các đợt sụt của buồng magma", q: "Các hõm sụt lồng nhau trên đỉnh ghi lại bao nhiêu đợt rút magma, cách nhau bao lâu?", m: "Quan sát thành hõm chảo từ mép, đo độ cao từng bậc sụt, lấy mẫu dung nham đỉnh.", tool: "Camera tele · khoan lõi ngắn · máy đo trọng lực" };

// Chon diem dung doc tuyen toi uu
function sciStops(path, mO) {
  if (!path || !mO) return [];
  const out = [], segs = geoSegments(path, mO.dist), used = new Set();
  // 1 diem moi don vi dia chat (doan dai nhat, it nhat 10 km), dat o giua doan
  segs.slice().sort((a, b) => (b.b - b.a) - (a.b - a.a)).forEach(g => {
    const code = GU[g.u].code; if (used.has(code) || g.b - g.a < 10 || !SCI_UNIT[code]) return; used.add(code);
    const k = Math.round((g.k0 + g.k1) / 2); out.push({ k, n: path[k], km: mO.dist[k] / 1000, sci: SCI_UNIT[code], unit: code });
  });
  // Vach chan nui: o doc nhat tren tuyen (neu di doc)
  let ks = 0; for (let k = 1; k < path.length; k++) if (SLOPE[path[k]] > SLOPE[path[ks]]) ks = k;
  if (SLOPE[path[ks]] > 4 && !out.some(s => Math.abs(s.km - mO.dist[ks] / 1000) < 15))
    out.push({ k: ks, n: path[ks], km: mO.dist[ks] / 1000, sci: SCI_SCARP, unit: GU[GEO[path[ks]]].code });
  // Dinh / Dich B
  const kb = path.length - 1; out.push({ k: kb, n: path[kb], km: mO.dist[kb] / 1000, sci: SCI_TOP, unit: GU[GEO[path[kb]]].code });
  return out.sort((a, b) => a.km - b.km).slice(0, 6);
}

// Marswalk: Luoi cuc bo noi suy tu Mola
// Toc do di bo: Ham Tobler (1993) v = 6·e^(−3,5·|tanθ + 0,05|) km/h, nhan he so 0,5 cho bo do EVA (gia dinh nhom).
const MW = { f: 8, R: 15, suit: 0.5 };
function zBil(y, x) {       // y, x: Toa do o (tam o k nam tai k)
  y = Math.min(H - 1, Math.max(0, y)); x = Math.min(W - 1, Math.max(0, x));
  const i = Math.min(H - 2, Math.floor(y)), j = Math.min(W - 2, Math.floor(x)), v = y - i, u = x - j, a = i * W + j;
  return (Z[a] * (1 - u) + Z[a + 1] * u) * (1 - v) + (Z[a + W] * (1 - u) + Z[a + W + 1] * u) * v;
}
function marswalk(n0, p) {
  const i0 = Math.floor(n0 / W), j0 = n0 % W, f = MW.f, ddy = DY / f, ddx = DX[i0] / f;
  const h = Math.ceil(MW.R * 1000 / ddy), S = 2 * h + 1, M = S * S;
  const z = new Float32Array(M), sl = new Float32Array(M);
  for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) z[a * S + b] = zBil(i0 + (a - h) / f, j0 + (b - h) / f);
  for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) {
    const zz = (r, c) => z[Math.min(S - 1, Math.max(0, r)) * S + Math.min(S - 1, Math.max(0, c))];
    const gx = (zz(a, b + 1) - zz(a, b - 1)) / (2 * ddx), gy = (zz(a + 1, b) - zz(a - 1, b)) / (2 * ddy);
    sl[a * S + b] = Math.atan(Math.hypot(gx, gy)) * 180 / Math.PI }
  const vel = g => 6 * Math.exp(-3.5 * Math.abs(g + 0.05)) * MW.suit;          // km/h, g = dz/d (doc co huong)
  const NB8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
