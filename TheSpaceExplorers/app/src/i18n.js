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
  // Tham so tuyen
  ["Tham số tuyến", "Route parameters"], ["Ngưỡng dốc cấm đi", "No-go slope limit"], ["Trọng số độ dốc", "Slope weight"], ["Trọng số lạnh", "Cold weight"],
  ["Trọng số leo dốc", "Climb weight"], ["Trọng số địa chất", "Geology weight"], ["Mùa (Ls)", "Season (Ls)"],
  ["Ở 3,7 km mỗi ô, độ dốc bị làm mượt; ngưỡng 12° ở đây tương ứng vách rất dốc ngoài thực tế. Trọng số địa chất làm tuyến tránh các đơn vị địa chất gồ ghề theo bản đồ USGS SIM 3292 (hệ số = độ nhám MOLA trung vị của đơn vị).",
   "At 3.7 km per cell slopes are smoothed; a 12° limit here corresponds to very steep cliffs in reality. The geology weight steers the route away from rough geologic units in USGS SIM 3292 (factor = median MOLA roughness of the unit)."],
  ["Kết quả", "Results"], ["Chỉ số", "Metric"], ["Chiều dài (km)", "Length (km)"], ["Tổng leo (m)", "Total climb (m)"], ["Dốc lớn nhất (°)", "Max slope (°)"],
  ["Dốc trung bình (°)", "Mean slope (°)"], ["Ô dốc >", "Cells steeper than"], ["T trưa thấp nhất (°C)", "Min noon T (°C)"], ["Km qua vạt aureole (Aa, lAa)", "Km across aureole (Aa, lAa)"],
  ["Thời gian (sol)", "Time (sol)"], ["Oxy dùng (kg)", "Oxygen used (kg)"], ["Nhiên liệu dùng (kg)", "Fuel used (kg)"], ["Ô đã duyệt (A*)", "Cells expanded (A*)"], ["Thời gian tính", "Compute time"],
  ["Không có đường đi mà mọi ô đều dốc dưới", "No path exists with every cell below"], ["Tăng ngưỡng dốc hoặc chọn điểm khác.", "Raise the slope limit or pick another point."],
  ["Vùng hạ cánh tốt nhất", "Best landing sites"],
  ["Elip 20×10 km nằm trọn trong vùng: cao < −1 km, dốc < 2°, độ nhám < 60 m. Nhấn để dùng làm điểm A.", "20×10 km ellipse fully inside the zone: elevation < −1 km, slope < 2°, roughness < 60 m. Click to use as point A."],
  ["Dữ liệu", "Data"],
  ["Độ cao MOLA MEGDR 16 px/° (Mars Global Surveyor, NASA PDS). Độ dốc (Horn 3×3) và áp suất (p = 610·e", "Elevation: MOLA MEGDR 16 px/° (Mars Global Surveyor, NASA PDS). Slope (Horn 3×3) and pressure (p = 610·e"],
  ["Pa) tính từ đó. Nhiệt độ giữa trưa là mô hình cân bằng bức xạ, hiệu chỉnh theo số đo MEDA ở Jezero.", "Pa) are derived from it. Noon temperature is a radiative-balance model calibrated to MEDA measurements at Jezero."],
  ["Địa chất: bản đồ địa chất toàn cầu USGS SIM 3292 (Tanaka và cộng sự, 2014, tỉ lệ 1:20 triệu), raster hóa lên cùng lưới. Ở tỉ lệ này ranh giới đơn vị chỉ chính xác cỡ vài chục km.", "Geology: USGS SIM 3292 global geologic map (Tanaka et al., 2014, 1:20M scale), rasterized onto the same grid. At this scale unit boundaries are accurate to a few tens of km."],
  ["Trong khung 3D, độ cao được phóng đại để dễ thấy hình núi, còn rover được phóng to khoảng 450 lần vì mỗi ô dữ liệu rộng 3,7 km. Các số liệu trên bảng vẫn là giá trị thật.", "In the 3D view elevation is exaggerated to show the volcano's shape, and the rover is scaled up about 450× because each data cell is 3.7 km wide. Numbers in the panels are true values."],
  ["địa chất USGS SIM 3292", "USGS SIM 3292 geology"], ["lưới", "grid"], ["km/ô", "km/cell"],
  // Rover
  ["Cấu hình rover & phi hành đoàn", "Rover & crew configuration"], ["Số phi hành gia", "Crew size"], ["1 người", "1 person"], ["2 người", "2 people"],
  ["Khối lượng rover có tải", "Loaded rover mass"], ["Oxy mang theo", "Oxygen carried"], ["Tốc độ tối đa", "Max speed"], ["Giờ lái mỗi sol", "Driving hours per sol"],
  ["Mỗi sol lái từ 08:00 giờ địa phương, hết giờ thì dựng lều nghỉ. Tốc độ giảm khi dốc tăng; nhiên liệu dùng cho lăn bánh, leo dốc, sưởi và thiết bị.", "Each sol driving starts at 08:00 local time; when the hours run out the crew pitches the tent. Speed drops with slope; fuel powers driving, climbing, heating and equipment."],
  ["Mô hình hành trình", "Traverse model"], ["Ước tính để lập kế hoạch, không phải số đo. Tốc độ = v", "Planning estimates, not measurements. Speed = v"],
  ["/(1 + 0,15·dốc). Năng lượng lăn bánh = m·g·(0,12·quãng đường + độ cao leo)/0,75, thu hồi 25% khi xuống dốc, g = 3,721 m/s². Pin nhiên liệu methane–oxy cho khoảng 1,39 kWh mỗi kg.", "/(1 + 0.15·slope). Driving energy = m·g·(0.12·distance + climb)/0.75, 25% recovered downhill, g = 3.721 m/s². The methane–oxygen fuel cell yields about 1.39 kWh per kg."],
  ["Oxy thở 30 g/giờ/người khi nghỉ, 40 g/giờ khi lái và tăng theo độ dốc, cộng rò rỉ bộ đồ 3 g/giờ. Lượng cần để quay về tính trên chính tuyến đã đi theo chiều ngược lại, dự trữ thêm 10%.", "Breathing oxygen 30 g/h/person at rest, 40 g/h when driving, rising with slope, plus 3 g/h suit leakage. The amount needed to return is computed on the same route in reverse, with a 10% reserve."],
  ["Y tế là mô phỏng minh họa: nhịp tim, nhịp thở tăng theo dốc, giờ lái và khi thiếu oxy; thân nhiệt giảm khi nhiên liệu sưởi gần cạn. Bức xạ 0,64 mSv/ngày theo thiết bị RAD trên Curiosity, tăng tới khoảng 45% ở đỉnh núi; so với giới hạn 600 mSv của NASA.", "Health is an illustrative simulation: heart and breathing rates rise with slope, driving hours and low oxygen; body temperature drops when heating fuel runs low. Radiation 0.64 mSv/day from Curiosity's RAD, up to about 45% higher at the summit; compared with NASA's 600 mSv limit."],
  // Y te
  ["Y tế phi hành gia", "Crew health"], ["Chọn phi hành gia", "Select astronaut"], ["PHG-1 · chỉ huy", "AST-1 · commander"], ["PHG-2 · kỹ sư", "AST-2 · engineer"], ["PHG-1", "AST-1"], ["PHG-2", "AST-2"],
  ["Nhịp tim · ECG", "Heart rate · ECG"], ["Điện tâm đồ mô phỏng", "Simulated ECG"], ["bão hòa oxy máu", "blood oxygen saturation"], ["Thân nhiệt", "Body temperature"],
  ["Bức xạ tích lũy", "Cumulative radiation"], ["So với giới hạn cả sự nghiệp 600 mSv của NASA", "Compared with NASA's 600 mSv career limit"],
  ["Mệt mỏi · giờ lái trong sol", "Fatigue · driving hours this sol"], ["Nhật ký cảnh báo", "Alert log"],
  ["Chưa có cảnh báo. Các chỉ số trong ngưỡng an toàn.", "No alerts. All readings within safe limits."],
  ["Bình thường", "Normal"], ["Ổn định", "Stable"], ["Theo dõi", "Monitor"], ["Nguy cấp", "Critical"], ["Trong giới hạn", "Within limits"], ["Vượt mức", "Over limit"],
  ["Tỉnh táo", "Alert"], ["Hơi mệt", "Slightly tired"], ["Cần nghỉ", "Needs rest"], ["Hạ thân nhiệt", "Hypothermia"], ["Rất cao", "Very high"], ["Rất thấp", "Very low"], ["Thấp", "Low"], ["Cao", "High"],
  ["lần/phút", "/min"], ["nhịp thở", "breathing"], ["ngoài trời", "outside"], ["nghiêng", "tilt"],
  // Bieu do
  ["Ngân sách oxy & nhiên liệu dọc tuyến đi B", "Oxygen & fuel budget along the route to B"], ["Ngân sách oxy & nhiên liệu dọc đường về A", "Oxygen & fuel budget along the return to A"],
  ["Ngân sách oxy và nhiên liệu", "Oxygen and fuel budget"], ["Oxy còn lại", "Oxygen left"], ["Nhiên liệu còn lại", "Fuel left"], ["Cần để quay về A", "Needed to return to A"],
  ["Phần trăm oxy và nhiên liệu theo quãng đường", "Oxygen and fuel percentage by distance"], ["Mặt cắt độ cao dọc hai tuyến", "Elevation profile along both routes"], ["Mặt cắt độ cao", "Elevation profile"],
  ["quãng đường (km)", "distance (km)"], ["độ cao (km)", "elevation (km)"], ["Chưa có tuyến tối ưu.", "No optimal route yet."], ["Chưa có tuyến", "No route yet"],
  ["Địa chất dọc tuyến tối ưu", "Geology along the optimal route"], ["Các đơn vị địa chất mà tuyến tối ưu đi qua theo quãng đường", "Geologic units crossed by the optimal route, by distance"],
  ["Đơn vị", "Unit"], ["% tuyến", "% of route"], ["Rover không tới được điểm này.", "The rover cannot reach this point."], ["✕ hết", "✕ out of"], ["nhám", "roughness"],
  // Trang thai, Su kien
  ["Sẵn sàng", "Ready"], ["Đang lái", "Driving"], ["Đang nghỉ", "Resting"], ["Đang ngủ nghỉ", "Sleeping"], ["Nghỉ đêm trong lều", "Overnight in the tent"], ["Nghỉ trong lều", "In the tent"],
  ["Đỗ", "Parked"], ["Đang ở A", "At A"], ["Đã đến B", "Arrived at B"], ["Đã về A", "Back at A"], ["Đang quay về A", "Returning to A"], ["Quay về · đang nghỉ", "Returning · resting"],
  ["Đang quay về, đủ tài nguyên", "Returning, resources sufficient"], ["Rover đã dừng vì hết", "The rover has stopped: out of"], ["Rover đã dừng", "Rover stopped"],
  [", không thể tự quay về. Đặt lại hành trình hoặc tăng lượng mang theo.", ", it cannot return on its own. Reset the traverse or carry more."],
  ["Rover đang ở A, chưa cần quay về.", "The rover is at A; no need to return."], ["Không tìm được đường về A với ngưỡng dốc", "No return path to A with slope limit"], ["Tăng ngưỡng dốc rồi thử lại.", "Raise the slope limit and try again."],
  ["Kích hoạt quay về A khẩn cấp ở km", "Emergency return to A triggered at km"], ["Đường về dài", "Return path length"], ["Đường về", "Return path"], ["mất", "takes"],
  ["Liều bức xạ cả chuyến", "Total radiation dose"], ["Liều bức xạ tích lũy đạt", "Cumulative radiation dose reached"], ["giới hạn cả sự nghiệp 600 mSv", "of the 600 mSv career limit"],
  ["Xuất phát từ A", "Departing from A"], ["đi B theo tuyến tối ưu dài", "to B along the optimal route of"], ["vùng hạ cánh", "landing site"], ["điểm đã chọn", "selected point"],
  ["Về đến A an toàn. Còn", "Safely back at A. Remaining"], ["Đến B sau", "Reached B after"], ["Đến B. Còn", "Reached B. Remaining"], ["Còn", "Remaining"],
  ["Hết oxy ở km", "Out of oxygen at km"], ["Nhiệm vụ thất bại: cần mang thêm oxy hoặc chọn đích gần hơn.", "Mission failed: carry more oxygen or choose a closer target."],
  ["Hết nhiên liệu ở km", "Out of fuel at km"], ["rover dừng, mất sưởi. Oxy còn", "rover stops, heating lost. Oxygen left"], ["đủ chờ cứu hộ khoảng", "enough to await rescue for about"],
  ["Không đủ", "Not enough"], ["để về A: rover sẽ dừng sau", "to reach A: the rover will stop after"], ["còn cách A", "still"], ["Cần đội cứu hộ.", "from A. Rescue team needed."],
  ["Đang quay về A:", "Returning to A:"], ["khoảng", "about"], ["Đủ tài nguyên, về đến nơi còn", "Resources sufficient; on arrival remaining"],
  ["Qua điểm không thể quay về ở km", "Passed the point of no return at km"], ["từ đây", "from here"], ["không đủ để quay lại A.", "is not enough to return to A."],
  ["nhịp tim", "heart rate"], ["khi leo dốc", "while climbing"], ["sau", "after"], ["giờ lái", "hours of driving"], ["Giảm tốc và nghỉ 15 phút.", "Slow down and rest 15 minutes."],
  ["– thiếu oxy. Chuyển sang bình dự phòng, giảm gắng sức.", "– hypoxia. Switch to the backup tank, reduce exertion."],
  ["Oxy còn 25%", "Oxygen at 25%"], ["Oxy còn 10%", "Oxygen at 10%"], ["Nhiên liệu còn 25%", "Fuel at 25%"], ["Nhiên liệu còn 10%", "Fuel at 10%"], ["đủ thở thêm khoảng", "enough to breathe for about"],
  ["Đêm lạnh", "Cold night"], ["tăng sưởi pin và bộ đồ, kiểm tra găng tay và ủng.", "increase battery and suit heating, check gloves and boots."],
  ["lái thêm", "drive"], ["thì dựng lều", "more, then pitch the tent"], ["nghỉ đến 08:00 sol", "rest until 08:00 sol"], ["về A", "to A"], ["đến B", "at B"],
  ["Không tải được thư viện 3D (three.js). Kiểm tra kết nối mạng rồi tải lại trang. Các bảng số liệu và bản đồ nhỏ vẫn dùng được.", "Could not load the 3D library (three.js). Check the network and reload. Panels and the minimap still work."],
  ["Trình duyệt này không bật được WebGL nên không vẽ được 3D. Các bảng số liệu và bản đồ nhỏ vẫn dùng được.", "This browser cannot enable WebGL, so 3D is unavailable. Panels and the minimap still work."],
  // Chu giai lop
  ["Màu bề mặt mô phỏng theo độ cao (km)", "Simulated surface color by elevation (km)"], ["Độ cao (km, so với areoid)", "Elevation (km, above areoid)"], ["Độ dốc (°)", "Slope (°)"],
  ["Nhiệt độ bề mặt giữa trưa (°C, mô hình)", "Noon surface temperature (°C, model)"], ["Điểm phù hợp hạ cánh (trung bình trong elip)", "Landing suitability (mean within ellipse)"],
  ["Ảnh nền Mars Trek (ảnh ghép màu Viking), đăng ký vào lưới MOLA:", "Mars Trek basemap (Viking color mosaic), registered to the MOLA grid:"], ["tương quan với địa hình MOLA", "correlation with MOLA terrain"],
  ["Cấu trúc: vách, rãnh sụt, dòng dung nham (USGS)", "Structures: scarps, grabens, lava flows (USGS)"],
  ["T trưa", "noon T"], ["dốc", "slope"], ["cao", "elev"],
  // Don vi dia chat
  ["Đồng bằng chuyển tiếp (Amazon–Hesperia)", "Transition plains (Amazonian–Hesperian)"], ["Vạt chân núi – vành aureole (Amazon)", "Apron – aureole (Amazonian)"],
  ["Dung nham trẻ (Amazon muộn)", "Young lava (Late Amazonian)"], ["Đồng bằng dung nham (Amazon–Hesperia)", "Lava plains (Amazonian–Hesperian)"],
  ["Thân núi lửa Olympus Mons (Amazon)", "Olympus Mons edifice (Amazonian)"], ["Cánh đồng núi lửa nhỏ (Amazon muộn)", "Small volcanic field (Late Amazonian)"],
  ["Dung nham cổ (Hesperia)", "Old lava (Hesperian)"], ["Vạt chân núi trẻ (Amazon muộn)", "Young apron (Late Amazonian)"],
  ["Đồng bằng chuyển tiếp", "Transition plains"], ["Vạt chân núi – vành aureole", "Apron – aureole"], ["Dung nham trẻ", "Young lava"], ["Đồng bằng dung nham", "Lava plains"],
  ["Thân núi lửa Olympus Mons", "Olympus Mons edifice"], ["Cánh đồng núi lửa nhỏ", "Small volcanic field"], ["Dung nham cổ", "Old lava"], ["Vạt chân núi trẻ", "Young apron"],
  // Khoa hoc
  ["Mục tiêu khoa học", "Science objectives"],
  ["Điểm dừng được đặt tự động dọc tuyến tối ưu: mỗi đơn vị địa chất USGS mà tuyến đi qua một điểm, thêm vách dốc nhất và đích B. Nhấn để xem mục tiêu và lập kế hoạch Marswalk.", "Stops are placed automatically along the optimal route: one per USGS geologic unit crossed, plus the steepest scarp and target B. Click to see objectives and plan a Marswalk."],
  ["Vành aureole: nguồn gốc các thùy gờ–rãnh khổng lồ", "Aureole: origin of the giant ridged–grooved lobes"],
  ["Aureole hình thành do sạt lở khổng lồ từ sườn núi, do khối sườn núi trượt dần ra ngoài, hay có băng tham gia?", "Did the aureole form from giant landslides off the flanks, from slow outward spreading of the edifice, or with help from ice?"],
  ["Chụp cấu trúc gờ–rãnh, đo hướng gờ, lấy mẫu vụn đá để xem nguồn gốc (dung nham sườn núi hay vật liệu khác).", "Image the ridge–groove structure, measure ridge orientation, sample rock debris to trace its origin (flank lava or other material)."],
  ["Camera đa phổ · radar xuyên đất · búa địa chất", "Multispectral camera · ground-penetrating radar · rock hammer"],
  ["Vạt chân núi trẻ: vật liệu sạt từ sườn", "Young apron: material shed from the flanks"],
  ["Vật liệu vạt chân núi trẻ có cùng nguồn với aureole không, và hoạt động gần đây đến mức nào?", "Does the young apron share a source with the aureole, and how recently was it active?"],
  ["So sánh thành phần và độ phong hóa với mẫu ở vành aureole.", "Compare composition and weathering with aureole samples."], ["Phổ kế tia X cầm tay · camera đa phổ", "Handheld X-ray spectrometer · multispectral camera"],
  ["Sườn khiên Olympus Mons: lịch sử dòng dung nham", "Olympus Mons shield flank: lava-flow history"],
  ["Các dòng dung nham thùy trên sườn núi phun trào trong bao lâu và thay đổi thành phần ra sao?", "Over what span did the lobate flank flows erupt, and how did their composition change?"],
  ["Lấy mẫu bazan ở nhiều độ cao, đo độ dày dòng chảy, tìm ống dung nham.", "Sample basalt at several elevations, measure flow thickness, look for lava tubes."], ["Khoan lõi ngắn · phổ kế tia X · từ kế", "Short core drill · X-ray spectrometer · magnetometer"],
  ["Dung nham trẻ: mốc định tuổi", "Young lava: an age benchmark"],
  ["Tuổi tuyệt đối của dung nham Amazon muộn là bao nhiêu (để hiệu chỉnh cách định tuổi bằng mật độ hố va chạm)?", "What is the absolute age of Late Amazonian lava (to calibrate crater-count dating)?"],
  ["Lấy mẫu bazan tươi, ít phong hóa, mang về Trái Đất định tuổi phóng xạ.", "Collect fresh, little-weathered basalt for radiometric dating on Earth."], ["Bộ lấy mẫu mang về · camera đa phổ", "Sample-return kit · multispectral camera"],
  ["Cánh đồng núi lửa nhỏ: miệng phun phụ", "Small volcanic field: secondary vents"], ["Các miệng phun nhỏ có cùng nguồn magma với Olympus Mons không?", "Do the small vents share a magma source with Olympus Mons?"],
  ["Lấy mẫu quanh miệng phun, đo hình dạng nón.", "Sample around the vents, measure cone shapes."], ["Phổ kế tia X · camera", "X-ray spectrometer · camera"],
  ["Đồng bằng chuyển tiếp: trầm tích và gió", "Transition plains: sediments and wind"], ["Bề mặt đồng bằng do trầm tích, tro núi lửa hay dung nham bị phủ?", "Is the plains surface sediment, volcanic ash or buried lava?"],
  ["Đào rãnh nông, quan sát phân lớp, tìm dấu vết gió (yardang).", "Dig a shallow trench, observe layering, look for wind features (yardangs)."], ["Xẻng · camera hiển vi · radar xuyên đất", "Shovel · microscopic imager · ground-penetrating radar"],
  ["Đồng bằng dung nham Tharsis", "Tharsis lava plains"], ["Dòng dung nham đồng bằng đến từ Olympus Mons hay từ các núi lửa Tharsis khác?", "Did the plains lava come from Olympus Mons or from other Tharsis volcanoes?"],
  ["So thành phần với mẫu sườn Olympus Mons.", "Compare composition with Olympus Mons flank samples."], ["Phổ kế tia X", "X-ray spectrometer"],
  ["Dung nham cổ ghi lại môi trường Sao Hỏa sớm hơn thế nào (phong hóa, nước)?", "What does old lava record about early Mars (weathering, water)?"],
  ["Tìm khoáng biến đổi do nước trên bề mặt đá cổ.", "Look for water-altered minerals on old rock surfaces."], ["Phổ kế hồng ngoại · camera hiển vi", "Infrared spectrometer · microscopic imager"],
  ["Vách chân núi: mặt cắt địa tầng lộ ra", "Basal scarp: exposed stratigraphic section"],
  ["Vách dốc bao quanh Olympus Mons lộ các lớp dung nham nào, và vì sao núi có vách dốc đứng như vậy?", "Which lava layers does the scarp around Olympus Mons expose, and why does the volcano have such a steep cliff?"],
  ["Chụp và đo mặt cắt từ chân vách, lấy mẫu từng lớp có thể tiếp cận an toàn.", "Image and measure the section from the scarp foot; sample each layer that can be reached safely."],
  ["Camera tele · máy đo khoảng cách laser · búa địa chất", "Telephoto camera · laser rangefinder · rock hammer"],
  ["Hõm chảo đỉnh: các đợt sụt của buồng magma", "Summit caldera: collapses of the magma chamber"],
  ["Các hõm sụt lồng nhau trên đỉnh ghi lại bao nhiêu đợt rút magma, cách nhau bao lâu?", "How many magma-withdrawal episodes do the nested summit pits record, and how far apart?"],
  ["Quan sát thành hõm chảo từ mép, đo độ cao từng bậc sụt, lấy mẫu dung nham đỉnh.", "Observe the caldera walls from the rim, measure each collapse step, sample summit lava."],
  ["Camera tele · khoan lõi ngắn · máy đo trọng lực", "Telephoto camera · short core drill · gravimeter"],
  ["Câu hỏi khoa học:", "Science question:"], ["Việc cần làm:", "Tasks:"], ["Dụng cụ:", "Tools:"], ["Môi trường tại điểm:", "Local environment:"],
  ["nhiệt độ giữa trưa", "noon temperature"], ["(mô hình)", "(model)"], ["áp suất", "pressure"], ["liều bức xạ", "radiation dose"], ["mSv/ngày", "mSv/day"],
  ["Thời gian một ca EVA", "EVA duration"], ["Thời gian làm việc tại điểm", "Work time at site"], ["Dốc tối đa khi đi bộ", "Max walking slope"],
  ["Bản đồ Marswalk quanh điểm dừng", "Marswalk map around the stop"], ["Rover (điểm dừng)", "Rover (stop)"], ["Biên vùng tới được", "Reachable boundary"],
  ["Điểm lộ đá dự kiến", "Expected outcrop"], ["cách rover", "from rover"], ["Làm việc", "Work"], ["Về rover", "Back to rover"], ["Đi", "Out"], ["Về", "Back"],
  ["Diện tích tới được trong một ca", "Reachable area per EVA"], ["Oxy bộ đồ (2 người, ~0,04 kg/giờ/người khi đi bộ)", "Suit oxygen (2 people, ~0.04 kg/h/person walking)"], ["kg cho ca này", "kg for this EVA"],
  ["Dự trữ", "Reserve"], ["Không đi được", "Not walkable"],
  ["Quanh rover toàn dốc hơn", "Everything around the rover is steeper than"], ["hoặc không đủ thời gian. Tăng dốc tối đa hoặc thời gian EVA.", "or there is not enough time. Raise the max slope or EVA time."],
  ["Hai phi hành gia đi cùng nhau, rover đỗ tại điểm dừng. Vùng tới được: đi + làm việc + về ≤ thời gian EVA trừ 20% dự trữ. Điểm lộ đá = ô dốc nhất trong vùng (nơi đá gốc dễ lộ), ưu tiên thêm điểm xa rover. Tốc độ đi bộ theo hàm Tobler, giảm một nửa vì bộ đồ EVA (giả định).",
   "Two astronauts walk together; the rover parks at the stop. Reachable: out + work + back ≤ EVA time minus a 20% reserve. Outcrop = steepest reachable cell (bedrock likely exposed), with a bonus for distance from the rover. Walking speed follows Tobler's function, halved for the EVA suit (assumption)."],
  ["Giới hạn:", "Limitation:"],
  ["lưới cục bộ ~460 m/ô được nội suy từ MOLA 3,7 km, nên không thấy được tảng đá. Khi có DEM CTX (~20 m) hoặc HiRISE (~1 m) từ Mars Trek cho điểm dừng, thay vào hàm", "the ~460 m local grid is interpolated from 3.7 km MOLA, so boulders are not visible. With a CTX (~20 m) or HiRISE (~1 m) DEM from Mars Trek for the stop, replace function"],
  ["để có bản đồ chướng ngại thật.", "to get a real obstacle map."],
  ["Chưa có tuyến tối ưu.", "No optimal route yet."],
  // Hoat anh khoa hoc (sci_anim.js)
  ["Đào rãnh nông, lấy mẫu đất", "Digging a shallow trench for a soil sample"], ["Khoan lõi ngắn lấy mẫu đá", "Drilling a short rock core"],
  ["Đo thành phần đá bằng phổ kế cầm tay", "Measuring rock composition with a handheld spectrometer"], ["Quét radar xuyên đất", "Ground-penetrating radar survey"],
  ["Chụp ảnh toàn cảnh, đo mặt cắt", "Panorama imaging and section measurement"], ["Gõ búa lấy mẫu đá mang về", "Hammering off a rock sample to return"],
  ["Hoạt ảnh tại điểm dừng", "Animations at science stops"], ["Rover dừng lại làm nhiệm vụ khi tới điểm khoa học", "Rover stops to work at each science stop"],
  ["Nhấn một điểm để đưa rover tới đó và xem phi hành gia làm nhiệm vụ. Hoạt ảnh chỉ minh họa: thời gian làm việc tại điểm không cộng vào hành trình (lập ca EVA ở mục Marswalk).",
   "Click a stop to move the rover there and watch the astronaut work. Animations are illustrative only: work time at the stop is not added to the traverse (plan EVA shifts under Marswalk)."],
  ["Chưa có hành trình theo tuyến tối ưu.", "No traverse along the optimal route yet."], ["rover không tới được", "not reached by the rover"],
  ["Điểm khoa học", "Science stop"], ["xẻng, túi đựng mẫu", "shovel, sample bag"], ["máy khoan lõi", "core drill"], ["phổ kế tia X cầm tay", "handheld X-ray spectrometer"],
  ["camera toàn cảnh", "panoramic camera"], ["búa địa chất, hộp mẫu", "rock hammer, sample box"], ["Đang khảo sát", "Surveying"], ["điểm dừng", "stops"],
  // Canh bao suc khoe theo vung (health.js)
  ["Vùng bức xạ cao", "High-radiation zone"], ["Vùng đêm cực lạnh", "Extreme night-cold zone"], ["Vùng dốc, xóc mạnh", "Steep, rough zone"], ["Vùng nhiều bụi mịn", "Fine-dust zone"],
  ["Ở độ cao lớn khí quyển mỏng, chắn được ít tia vũ trụ hơn nên liều bức xạ cao hơn ít nhất 30% so với hố Gale.", "At high altitude the thin atmosphere blocks fewer cosmic rays, so the dose is at least 30% above Gale Crater."],
  ["Tăng nguy cơ ung thư về lâu dài", "Higher long-term cancer risk"], ["Ảnh hưởng hệ thần kinh trung ương: giảm tập trung, phản xạ chậm", "Central nervous system effects: reduced focus, slower reactions"],
  ["Tích lũy lâu gây hại tim mạch, đục thủy tinh thể", "Long accumulation harms the heart and blood vessels, causes cataracts"],
  ["Đi qua nhanh, tránh dựng trại qua đêm trong vùng nếu còn lựa chọn", "Cross quickly; avoid camping overnight in the zone if possible"], ["Hạn chế EVA, rút ngắn mỗi ca ra ngoài", "Limit EVAs and shorten each one"],
  ["Ngủ ở chỗ có bồn nước và bình nhiên liệu bao quanh để che chắn", "Sleep surrounded by water and fuel tanks for shielding"], ["Xem liều kế mỗi giờ, so với giới hạn cả sự nghiệp 600 mSv", "Check the dosimeter hourly against the 600 mSv career limit"],
  ["Ban đêm xuống dưới −75 °C theo mô hình nhiệt độ của app.", "Nights drop below −75 °C in the app's temperature model."],
  ["Hạ thân nhiệt nếu sưởi bộ đồ hoặc lều trục trặc", "Hypothermia if suit or tent heating fails"], ["Tê cóng ngón tay, ngón chân khi chạm đá lạnh lâu", "Frostbite of fingers and toes after long contact with cold rock"],
  ["Tim đập nhanh để giữ ấm, pin và thiết bị yếu đi", "Faster heart rate to stay warm; batteries and equipment weaken"],
  ["Chỉ EVA quanh giữa trưa, xong trước khi mặt trời lặn", "EVA only around midday and finish before sunset"], ["Bật sưởi găng tay và ủng, tránh quỳ hoặc tì tay lên đá lâu", "Turn on glove and boot heaters; avoid kneeling or leaning on rock for long"],
  ["Giữ đủ nhiên liệu cho sưởi đêm, kiểm tra lều trước khi ngủ", "Keep enough fuel for night heating; check the tent before sleeping"], ["Đo thân nhiệt trước khi ngủ; dưới 35,5 °C thì làm ấm ngay", "Measure body temperature before sleep; rewarm at once below 35.5 °C"],
  ["Độ dốc từ 6° trở lên trên lưới 3,7 km; ngoài thực tế từng đoạn ngắn còn dốc hơn.", "Slope of 6° or more on the 3.7 km grid; short stretches are steeper in reality."],
  ["Rung xóc kéo dài gây đau lưng, đau cổ, mỏi cơ", "Prolonged jolting causes back and neck pain and muscle fatigue"], ["Say xe: buồn nôn, chóng mặt", "Motion sickness: nausea, dizziness"],
  ["Chấn thương nếu xe trượt hoặc lật, ngã khi đi bộ trên dốc", "Injury if the rover slides or rolls, or from falls when walking on slopes"],
  ["Giảm tốc, thắt dây an toàn, cố định đồ đạc trong cabin", "Slow down, fasten seat belts, secure loose items in the cabin"], ["Nghỉ 10 phút sau mỗi giờ lái, đổi người lái", "Rest 10 minutes every driving hour and swap drivers"],
  ["Không EVA trên đoạn dốc; nếu bắt buộc thì đi theo cặp, có dây nối", "No EVA on steep stretches; if unavoidable, go in pairs on a tether"], ["Qua dốc xong: kiểm tra chấn thương và độ kín bộ đồ", "After the slope: check for injuries and suit seal"],
  ["Vật liệu vụn bị gió bào mòn (vành aureole, đồng bằng trầm tích) nên nhiều bụi mịn.", "Wind-eroded loose material (aureole, sedimentary plains) carries a lot of fine dust."],
  ["Hít bụi mịn cỡ 3 µm có silica: kích ứng phổi, lâu dài có thể xơ phổi", "Inhaling ~3 µm silica-bearing dust irritates the lungs and may cause long-term fibrosis"],
  ["Perchlorate trong bụi cản tuyến giáp hấp thu i-ốt", "Perchlorate in the dust blocks thyroid iodine uptake"], ["Cay mắt, hắt hơi, rát họng như phi hành gia Apollo 17", "Watery eyes, sneezing, sore throat as on Apollo 17"],
  ["Phủi và hút bụi bộ đồ trước khi vào cabin", "Brush and vacuum the suit before entering the cabin"], ["Bật lọc không khí cabin, kiểm tra gioăng cửa", "Run the cabin air filter and check door seals"],
  ["Rửa mắt, đeo khẩu trang trong cabin nếu thấy bụi", "Rinse eyes and wear a mask in the cabin if dust is present"], ["Tránh EVA quanh giữa trưa và đầu chiều, lúc nhiều lốc bụi nhất", "Avoid EVAs around midday and early afternoon, when dust devils peak"],
  ["Nguy cơ vừa", "Moderate risk"], ["Nguy cơ cao", "High risk"], ["Cảnh báo sức khỏe theo vùng", "Health warnings by zone"], ["Rover đang ở vùng an toàn.", "The rover is in a safe zone."],
  ["Vùng tiếp theo:", "Next zone:"], ["Vấn đề sức khỏe", "Health problems"], ["Cách xử lí", "What to do"], ["Các vùng trên tuyến", "Zones on the route"],
  ["Tuyến hiện tại không qua vùng nguy cơ nào.", "The current route crosses no risk zone."], ["vùng nguy cơ", "risk zones"], ["An toàn", "Safe"], ["Xem cách xử lí", "See what to do"],
  ["Đã qua:", "Passed:"], ["Xử lí:", "Action:"], ["liều cao gấp", "dose"], ["lần hố Gale", "× Gale Crater"], ["đêm lạnh nhất", "coldest night"],
  ["dốc nhất", "steepest"], ["ở trong vùng", "inside the zone for"], ["nhận thêm", "extra"], ["Kiểm tra chấn thương và độ kín bộ đồ.", "Check for injuries and suit seal."],
  ["Làm sạch bộ đồ và lọc không khí cabin.", "Clean suits and filter the cabin air."], ["Ghi lại liều và thân nhiệt vào sổ y tế.", "Log dose and body temperature in the medical record."],
  // Giao dien (ui.js)
  ["☰ Thông tin", "☰ Details"], ["Thông tin chi tiết", "Details"], ["Thu gọn ▲", "Collapse ▲"], ["Thu gọn", "Collapse"], ["Hiển thị", "Display"], ["Phóng đại độ cao", "Height exaggeration"],
  ["Bảng sức khỏe", "Health panel"], ["Tốc độ", "Speed"], ["Đưa rover về đầu hành trình", "Move the rover back to the start"], ["Số giờ mô phỏng trôi qua mỗi giây", "Simulated hours per second"],
  ["Khẩn cấp: rover quay ngay về điểm A", "Emergency: the rover returns to A now"], ["Mở bảng nhiệm vụ, tuyến, rover, khoa học, biểu đồ", "Open mission, route, rover, science and chart panels"], ["Đổi góc camera 3D", "Change the 3D camera view"], ["còn", "remaining"], ["Y tế ◂", "Health ◂"], ["Phím cách", "Space bar"],
  // Don vi thoi gian (cuoi cung, ngan nhat)
  ["giờ", "h"], ["phút", "min"], ["người", "person"],
];

(function i18n() {
  if (typeof document === "undefined") return;
  const pairs = I18N_DICT.slice().sort((a, b) => b[0].length - a[0].length), map = new Map(pairs);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const RX = new RegExp("(?<![\\p{L}])(?:" + pairs.map(p => esc(p[0])).join("|") + ")(?![\\p{L}])", "gu");
  // So kieu Viet (1.234,5) -> kieu Anh (1,234.5)
  const num = s => s.replace(/(\d),(\d)/g, "$1\u0002$2").replace(/(\d)\.(?=\d{3}(?!\d))/g, "$1,").replace(/\u0002/g, ".");
  const tr = s => num(s.replace(RX, m => map.get(m) ?? m));
  let lang = "vi"; try { lang = localStorage.getItem("omn-lang") === "en" ? "en" : "vi" } catch (e) {}
  const TXT = new WeakMap(), ATT = new WeakMap(), ATTRS = ["aria-label", "title"];
  const VI = /[À-ÖØ-öø-ỹđĐ]|\d[.,]\d/;          // Chu viet hoac so co dau phan cach
  function doText(n) {
    const rec = TXT.get(n), v = n.nodeValue;
    const src = rec && v === rec.out ? rec.src : v;          // Khac ban da dich -> App ghi noi dung moi
    if (!rec && !VI.test(src) && !map.has(src.trim())) return;   // Cac chu khong dau nhu "Xem", "Nhanh"
    const out = lang === "en" ? tr(src) : src; TXT.set(n, { src, out }); if (v !== out) n.nodeValue = out;
  }
  function doAttrs(el) {
    for (const a of ATTRS) { if (!el.hasAttribute(a)) continue;
      let r = ATT.get(el); if (!r) ATT.set(el, r = {}); const v = el.getAttribute(a), rec = r[a];
      const src = rec && v === rec.out ? rec.src : v; if (!rec && !VI.test(src) && !map.has(src.trim())) continue;
      const out = lang === "en" ? tr(src) : src; r[a] = { src, out }; if (v !== out) el.setAttribute(a, out) }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 || root.tagName === "SCRIPT" || root.tagName === "STYLE") return;
    doAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (n.nodeType === 3) { const p = n.parentNode; if (p && (p.tagName === "SCRIPT" || p.tagName === "STYLE")) continue; doText(n) } else doAttrs(n) }
  }
  const mo = new MutationObserver(list => { for (const m of list) {
    if (m.type === "characterData") doText(m.target);
    else if (m.type === "attributes") doAttrs(m.target);
    else m.addedNodes.forEach(walk) } });
  // Nut chuyen ngon ngu
  const css = document.createElement("style");
  css.textContent = `.langsw{display:inline-flex;gap:2px;padding:3px;border-radius:999px;background:#15110f;border:1px solid #3a2d26}
.langsw button{font:700 12.5px var(--f-body);letter-spacing:.04em;border:0;border-radius:999px;padding:6px 11px;background:transparent;color:#d4c6b8;cursor:pointer;min-width:38px}
.langsw button[aria-pressed="true"]{background:#e0662d;color:#fff}
.langsw button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}`;
  document.head.appendChild(css);
  const sw = document.createElement("div"); sw.className = "langsw"; sw.setAttribute("role", "group"); sw.setAttribute("aria-label", "Ngôn ngữ / Language");
  sw.innerHTML = `<button data-lang="vi" lang="vi">VI</button><button data-lang="en" lang="en">EN</button>`;
  document.querySelector(".topbar").appendChild(sw);
  function apply() {
    document.documentElement.lang = lang;
    sw.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
    walk(document.body);
    try { localStorage.setItem("omn-lang", lang) } catch (e) {}
  }
  sw.querySelectorAll("button").forEach(b => b.onclick = () => { if (lang === b.dataset.lang) return; lang = b.dataset.lang; apply() });
  apply();
  mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  window.i18nTr = tr;   // De kiem tra
})();

  
