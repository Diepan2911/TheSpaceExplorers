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
