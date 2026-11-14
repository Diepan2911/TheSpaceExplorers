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
