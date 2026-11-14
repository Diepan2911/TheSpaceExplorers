// CHUYEN DOI NGON NGU VIET - ANH (i18n.js, sau science.js)
// Khi chon EN thi thay tung cum tu theo tu dien (cum dai thay truoc), khi chon VI thi tra lai ban goc.
const I18N_DICT = [ 
  // thanh ngang, tab, nut
  ["Rover có người lái trên địa hình độ cao MOLA thật của NASA", "Crewed rover on real NASA MOLA elevation terrain"],
  ["Góc nhìn", "View"], ["Toàn cảnh", "Overview"], ["Bám rover", "Follow rover"], ["Buồng lái", "Cockpit"],
  ["Lớp tô màu địa hình", "Terrain color layer"], ["Địa hình", "Terrain"], ["Ảnh thật", "Real image"], ["Mô phỏng", "Simulated"],
  ["Độ cao", "Elevation"], ["Độ dốc", "Slope"], ["Nhiệt độ", "Temperature"], ["Địa chất", "Geology"], ["Hạ cánh", "Landing"],
  ["Phóng đại cao", "Vertical exaggeration"], ["Panel trái", "Left panel"], ["Panel phải", "Right panel"],
  ["Nhiệm vụ, tuyến và rover", "Mission, route and rover"], ["Nhiệm vụ", "Mission"], ["Tuyến", "Route"], ["Khoa học", "Science"],
  ["Y tế và biểu đồ", "Health and charts"], ["Y tế", "Health"], ["Biểu đồ", "Charts"],
  ["Điều khiển mô phỏng", "Simulation controls"], ["Bắt đầu", "Start"], ["Tạm dừng", "Pause"], ["Tiếp tục", "Resume"], ["Chạy lại", "Replay"],
  ["Đặt lại", "Reset"], ["Tốc độ mô phỏng", "Simulation speed"], ["Chậm", "Slow"], ["Vừa", "Medium"], ["Nhanh", "Fast"],
  ["15 phút mô phỏng mỗi giây", "15 simulated minutes per second"], ["2 giờ mô phỏng mỗi giây", "2 simulated hours per second"], ["12 giờ mô phỏng mỗi giây", "12 simulated hours per second"],
  ["Khẩn cấp: quay về A", "Emergency: return to A"], ["SOS · về A", "SOS · to A"], ["Thời điểm trong hành trình", "Time in the traverse"],
  ["Bản đồ nhỏ. Nhấn để đặt điểm hoặc đưa camera tới đó.", "Minimap. Click to set a point or move the camera there."], ["Bản đồ nhỏ", "Minimap"], ["↑ Bắc", "↑ North"],
  ["Nhấn lên địa hình hoặc bản đồ nhỏ để", "Click the terrain or minimap to"], ["Xem", "View"], ["Đặt A", "Set A"], ["Đặt B", "Set B"],
  ["Khung nhìn 3D", "3D view"], ["Địa hình Olympus Mons 3D với rover. Kéo để xoay, cuộn để thu phóng.", "3D Olympus Mons terrain with rover. Drag to rotate, scroll to zoom."],
  ["Chú giải", "Legend"], ["Tối ưu", "Optimal"], ["Ngắn nhất", "Shortest"], ["Quay về A", "Return to A"], ["Dốc vượt ngưỡng", "Slope over limit"],
  ["Kéo để xoay · cuộn hoặc chụm để thu phóng · chuột phải để kéo", "Drag to rotate · scroll or pinch to zoom · right-drag to pan"],
  ["Di chuột lên địa hình để xem độ cao, độ dốc, nhiệt độ", "Hover the terrain to see elevation, slope, temperature"],
  ["Rover phóng to", "Rover scaled"], ["độ cao phóng đại", "vertical exaggeration"], ["độ cao", "elevation"],
  // Tai nguyen
  ["Tài nguyên", "Resources"], ["Oxy thở (O₂)", "Breathing oxygen (O₂)"], ["Nhiên liệu CH₄/O₂", "CH₄/O₂ fuel"],
  ["Vạch đen: lượng cần để quay về A", "Black mark: amount needed to return to A"],
  ["Vạch đen trên thanh là lượng cần để quay về A từ vị trí hiện tại. Khi thanh màu ngắn hơn vạch, rover đã qua điểm không thể quay về.", "The black mark is the amount needed to return to A from the current position. When the colored bar is shorter than the mark, the rover has passed the point of no return."],
  ["Điểm không thể quay về (PNR)", "Point of no return (PNR)"], ["Dự kiến đến B", "ETA at B"], ["Dự kiến về A", "ETA at A"],
  ["Còn lại khi đến B", "Remaining at B"], ["Còn lại khi về A", "Remaining at A"],
  ["Không có, luôn đủ quay về", "None, return always possible"], ["Không đủ để về đến A", "Not enough to reach A"],
  ["Đủ", "Enough"], ["Không đủ", "Not enough"], ["oxy và nhiên liệu", "oxygen and fuel"], ["nhiên liệu", "fuel"], ["oxy", "oxygen"], ["cần", "need"],
  ["Hết oxy", "Out of oxygen"], ["Hết nhiên liệu", "Out of fuel"], ["Không tới được: hết", "Cannot reach: out of"], ["dừng ở km", "stops at km"],
  ["đủ ~", "enough for ~"], ["dùng", "using"], ["tại đây", "here"], ["giới hạn", "limit"],
  
