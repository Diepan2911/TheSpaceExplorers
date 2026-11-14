// CANH BAO SUC KHOE THEO VUNG (health.js, sau sci_anim.js)
// Tinh cac vung tren tuyen co the anh huong suc khoe phi hanh gia tu du lieu cua tung o (do cao -> ap suat -> buc xa,
// Nhiet do dem, do doc, don vi dia chat), canh bao khi rover di vao va neu cach xu li.
// Giu nguyen code cu: boc them buildEvents, updateDash, drawMini; tu chen the vao tab Y te.
// Nguon: lieu buc xa tang khi ap suat (be day khi quyen) giam theo RAD tren Curiosity; gioi han ca su nghiep 600 mSv (NASA);
// Bui sao Hoa ~3 µm co silica va perchlorate (cuc ki giap); "sot co kho mat trang" cua phi hanh gia Apollo 17.

const HZ_TYPE = {
  rad: { name: "Vùng bức xạ cao", col: "#b84de0", test: n => doseRate(n) / MDL.dose0 >= 1.3,
    why: "Ở độ cao lớn khí quyển mỏng, chắn được ít tia vũ trụ hơn nên liều bức xạ cao hơn ít nhất 30% so với hố Gale.",
    risk: ["Tăng nguy cơ ung thư về lâu dài", "Ảnh hưởng hệ thần kinh trung ương: giảm tập trung, phản xạ chậm", "Tích lũy lâu gây hại tim mạch, đục thủy tinh thể"],
    act: ["Đi qua nhanh, tránh dựng trại qua đêm trong vùng nếu còn lựa chọn", "Hạn chế EVA, rút ngắn mỗi ca ra ngoài", "Ngủ ở chỗ có bồn nước và bình nhiên liệu bao quanh để che chắn", "Xem liều kế mỗi giờ, so với giới hạn cả sự nghiệp 600 mSv"] },
  cold: { name: "Vùng đêm cực lạnh", col: "#3f9cff", test: n => TN[n] - 80 <= -75,
    why: "Ban đêm xuống dưới −75 °C theo mô hình nhiệt độ của app.",
    risk: ["Hạ thân nhiệt nếu sưởi bộ đồ hoặc lều trục trặc", "Tê cóng ngón tay, ngón chân khi chạm đá lạnh lâu", "Tim đập nhanh để giữ ấm, pin và thiết bị yếu đi"],
    act: ["Chỉ EVA quanh giữa trưa, xong trước khi mặt trời lặn", "Bật sưởi găng tay và ủng, tránh quỳ hoặc tì tay lên đá lâu", "Giữ đủ nhiên liệu cho sưởi đêm, kiểm tra lều trước khi ngủ", "Đo thân nhiệt trước khi ngủ; dưới 35,5 °C thì làm ấm ngay"] },
  slope: { name: "Vùng dốc, xóc mạnh", col: "#ff7a2f", test: n => SLOPE[n] >= 6,
    why: "Độ dốc từ 6° trở lên trên lưới 3,7 km; ngoài thực tế từng đoạn ngắn còn dốc hơn.",
    risk: ["Rung xóc kéo dài gây đau lưng, đau cổ, mỏi cơ", "Say xe: buồn nôn, chóng mặt", "Chấn thương nếu xe trượt hoặc lật, ngã khi đi bộ trên dốc"],
    act: ["Giảm tốc, thắt dây an toàn, cố định đồ đạc trong cabin", "Nghỉ 10 phút sau mỗi giờ lái, đổi người lái", "Không EVA trên đoạn dốc; nếu bắt buộc thì đi theo cặp, có dây nối", "Qua dốc xong: kiểm tra chấn thương và độ kín bộ đồ"] },
  dust: { name: "Vùng nhiều bụi mịn", col: "#d9a12e", test: n => GU[GEO[n]].code === "Aa" || GU[GEO[n]].code === "AHtu",
    why: "Vật liệu vụn bị gió bào mòn (vành aureole, đồng bằng trầm tích) nên nhiều bụi mịn.",
    risk: ["Hít bụi mịn cỡ 3 µm có silica: kích ứng phổi, lâu dài có thể xơ phổi", "Perchlorate trong bụi cản tuyến giáp hấp thu i-ốt", "Cay mắt, hắt hơi, rát họng như phi hành gia Apollo 17"],
    act: ["Phủi và hút bụi bộ đồ trước khi vào cabin", "Bật lọc không khí cabin, kiểm tra gioăng cửa", "Rửa mắt, đeo khẩu trang trong cabin nếu thấy bụi", "Tránh EVA quanh giữa trưa và đầu chiều, lúc nhiều lốc bụi nhất"] },
};

