import { CurriculumTopic } from "../types";

/**
 * Gợi ý nội dung chương trình Tin học chuẩn GDPT 2018 từ Khối 1 đến Khối 12.
 * Mỗi khối lớp có ĐÚNG 1 - 2 nội dung trọng tâm theo chuẩn chương trình của Bộ GD&ĐT.
 */
export const GRADE_CURRICULUM_TOPICS: CurriculumTopic[] = [
  // =================== CẤP TIỂU HỌC (KHỐI 1 - 5) ===================
  // --- KHỐI 1 ---
  {
    id: "curr-grade-1-topic-1",
    gradeNumber: 1,
    orderIndex: 1,
    title: "Làm quen với máy tính & Thao tác chuột máy tính",
    gdptCode: "Chủ đề A: Máy tính và em (Làm quen)",
    description: "Nhận biết các bộ phận chính của máy tính để bàn và máy tính xách tay (màn hình, thân máy, bàn phím, chuột). Thực hành cầm chuột đúng cách, rê chuột, nhấp chuột và kéo thả qua trò chơi tương tác.",
    outcomes: [
      "Chỉ đúng tên và chức năng của thân máy, màn hình, bàn phím, chuột máy tính.",
      "Cầm chuột bằng tay phải, đặt ngón trỏ lên nút trái, ngón giữa lên nút phải.",
      "Thực hiện thành thạo thao tác nhấp chuột trái, nhấp đúp và kéo thả đối tượng trên màn hình.",
      "Ngồi đúng tư thế khi sử dụng máy tính để bảo vệ mắt và cột sống."
    ],
    keywords: ["Bộ phận máy tính", "Chuột máy tính", "Nhấp chuột", "Tư thế ngồi đúng"],
    recommendedLab: "general",
    labActionText: "Khám phá phòng máy tính"
  },
  {
    id: "curr-grade-1-topic-2",
    gradeNumber: 1,
    orderIndex: 2,
    title: "Nhận biết thông tin dạng hình ảnh, âm thanh & Giữ gìn thiết bị an toàn",
    gdptCode: "Chủ đề E: Ứng dụng tin học & Đạo đức số",
    description: "Khám phá thế giới thông tin xung quanh em qua hình ảnh, âm thanh và chuyển động. Rèn luyện ý thức giữ gìn thiết bị học tập, không chạm tay vào dây điện hoặc nguồn điện.",
    outcomes: [
      "Phân biệt được thông tin dạng văn bản, hình ảnh và âm thanh trong đời sống.",
      "Biết bật/tắt máy tính đúng quy trình an toàn dưới sự hướng dẫn của thầy cô/cha mẹ.",
      "Tuân thủ quy tắc an toàn điện trong phòng thực hành Tin học."
    ],
    keywords: ["Thông tin số", "Hình ảnh", "Âm thanh", "An toàn thiết bị"],
    recommendedLab: "general",
    labActionText: "Xem quy tắc an toàn số"
  },

  // --- KHỐI 2 ---
  {
    id: "curr-grade-2-topic-1",
    gradeNumber: 2,
    orderIndex: 1,
    title: "Làm quen với bàn phím máy tính & Rèn luyện kỹ năng gõ phím",
    gdptCode: "Chủ đề A: Máy tính và em (Bàn phím)",
    description: "Khám phá cấu tạo bàn phím: Hàng phím cơ sở với hai phím mốc có gờ nổi F và J, hàng phím trên, hàng phím dưới, phím cách (Space) và phím Enter. Rèn luyện tư thế đặt ngón tay chuẩn.",
    outcomes: [
      "Xác định được hàng phím cơ sở và đặt hai ngón trỏ vào đúng phím mốc F và J.",
      "Biết chức năng của phím cách (Spacebar), phím Enter và phím xóa lùi (Backspace).",
      "Gõ được các chữ cái và chữ số đơn giản theo đúng ngón tay quy định."
    ],
    keywords: ["Hàng phím cơ sở", "Phím mốc F & J", "Phím Enter", "Gõ 10 ngón cơ bản"],
    recommendedLab: "general",
    labActionText: "Luyện tập gõ phím"
  },
  {
    id: "curr-grade-2-topic-2",
    gradeNumber: 2,
    orderIndex: 2,
    title: "Tư duy phân loại thông tin & Làm quen với công việc giải quyết vấn đề",
    gdptCode: "Chủ đề D: Giải quyết vấn đề với sự trợ giúp của máy tính",
    description: "Học sinh học cách quan sát, so sánh và phân loại các đối tượng theo thuộc tính (màu sắc, hình dạng, công dụng); bước đầu hình thành tư duy sắp xếp có trật tự và thực hiện công việc theo các bước tuần tự.",
    outcomes: [
      "Phân loại được các đồ vật, tệp dữ liệu quen thuộc theo nhóm đặc điểm chung.",
      "Nêu được các bước tuần tự để thực hiện một hoạt động thường ngày (như đánh răng, rửa tay).",
      "Nhận ra lợi ích của việc sắp xếp đồ dùng và dữ liệu ngăn nắp."
    ],
    keywords: ["Phân loại", "Tư duy tuần tự", "Sắp xếp thông tin", "Giải quyết vấn đề"],
    recommendedLab: "general",
    labActionText: "Khám phá bài tập tư duy"
  },

  // --- KHỐI 3 ---
  {
    id: "curr-grade-3-topic-1",
    gradeNumber: 3,
    orderIndex: 1,
    title: "Thông tin và xử lý thông tin - Tạo bức vẽ đầu tiên với phần mềm đồ họa",
    gdptCode: "Chủ đề A & E: Máy tính và em & Ứng dụng tin học (GDPT 2018)",
    description: "Tìm hiểu thông tin thu nhận từ các giác quan và cách bộ não/máy tính xử lý thông tin đưa ra quyết định. Sử dụng phần mềm đồ họa Paint để vẽ hình mẫu, tô màu và lưu sản phẩm tranh vẽ sáng tạo vào máy tính.",
    outcomes: [
      "Nêu được ví dụ về thông tin thu nhận và quyết định xử lý tương ứng trong thực tế.",
      "Sử dụng thành thạo các công cụ hình vẽ (đường thẳng, hình chữ nhật, hình tròn) và cọ vẽ.",
      "Chọn bảng màu, tô màu kín cho hình vẽ và lưu tệp hình ảnh vào thư mục máy tính."
    ],
    keywords: ["Xử lý thông tin", "Đồ họa máy tính", "Vẽ tranh số", "Lưu trữ tệp vẽ"],
    recommendedLab: "general",
    labActionText: "Mở không gian sáng tạo"
  },
  {
    id: "curr-grade-3-topic-2",
    gradeNumber: 3,
    orderIndex: 2,
    title: "Bảo vệ thông tin cá nhân & Văn hóa sử dụng máy tính an toàn",
    gdptCode: "Chủ đề B: Mạng máy tính và Internet & Bảo vệ dữ liệu",
    description: "Nhận biết tầm quan trọng của việc giữ bí mật thông tin riêng tư (họ tên, ngày sinh, trường lớp, số điện thoại, mật khẩu). Rèn luyện kỹ năng tìm kiếm sự hỗ trợ từ người lớn khi gặp thông tin lạ trên mạng.",
    outcomes: [
      "Liệt kê được các thông tin cá nhân cần bảo vệ bí mật, không tùy tiện cung cấp cho người lạ.",
      "Biết tạo mật khẩu học tập đơn giản nhưng khó đoán đối với người ngoài.",
      "Biết báo ngay cho thầy cô hoặc cha mẹ khi gặp thông tin lạ hoặc tin nhắn đáng ngờ."
    ],
    keywords: ["Bảo mật cá nhân", "Mật khẩu an toàn", "Văn hóa ứng xử mạng", "Trợ giúp số"],
    recommendedLab: "general",
    labActionText: "Tìm hiểu an toàn số"
  },

  // --- KHỐI 4 ---
  {
    id: "curr-grade-4-topic-1",
    gradeNumber: 4,
    orderIndex: 1,
    title: "Lập trình trực quan Scratch: Nhân vật, Sân khấu & Khối lệnh Chuyển động",
    gdptCode: "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính (Scratch cơ bản)",
    description: "Làm quen với giao diện lập trình trực quan Scratch. Thêm nhân vật, trang phục, chọn hình nền sân khấu và ghép các khối lệnh Sự kiện (Khi nhấn cờ xanh), Chuyển động (Di chuyển, Xoay, Bật lại khi chạm cạnh) để tạo hoạt cảnh nhân vật.",
    outcomes: [
      "Thêm nhân vật mới từ thư viện hoặc tải lên, thay đổi hình nền sân khấu phù hợp.",
      "Ghép nối đúng khối lệnh Sự kiện 'Khi bấm cờ xanh' với khối lệnh Chuyển động.",
      "Điều khiển nhân vật di chuyển, đổi hướng và nói lời chào 'Xin chào các bạn!'."
    ],
    keywords: ["Lập trình Scratch", "Khối lệnh trực quan", "Nhân vật & Sân khấu", "Chuyển động"],
    recommendedLab: "scratch",
    labActionText: "Mở môi trường Scratch"
  },
  {
    id: "curr-grade-4-topic-2",
    gradeNumber: 4,
    orderIndex: 2,
    title: "Tìm kiếm thông tin trên Internet & Soạn thảo văn bản tiếng Việt có dấu",
    gdptCode: "Chủ đề B & E: Mạng máy tính & Ứng dụng soạn thảo văn bản",
    description: "Sử dụng trình duyệt web tra cứu thông tin học tập an toàn. Khởi động phần mềm gõ tiếng Việt (Unikey/EVKey) với kiểu gõ Telex hoặc Vni, soạn thảo và định dạng văn bản (phông chữ, cỡ chữ, màu chữ, căn lề).",
    outcomes: [
      "Nhập địa chỉ trang web giáo dục an toàn và tìm kiếm thông tin bằng từ khóa phù hợp.",
      "Gõ thành thạo văn bản tiếng Việt có dấu theo kiểu gõ Telex hoặc Vni.",
      "Định dạng đoạn văn bản: Chọn phông chữ, in đậm, in nghiêng, chỉnh màu sắc và căn đều hai lề."
    ],
    keywords: ["Tìm kiếm thông tin", "Trình duyệt web", "Soạn thảo văn bản", "Gõ Telex/Vni"],
    recommendedLab: "general",
    labActionText: "Thực hành soạn thảo"
  },

  // --- KHỐI 5 ---
  {
    id: "curr-grade-5-topic-1",
    gradeNumber: 5,
    orderIndex: 1,
    title: "Lập trình Scratch sáng tạo: Vòng lặp, Cảm biến va chạm & Biến số tính điểm",
    gdptCode: "Chủ đề F: Lập trình trực quan sáng tạo (Trò chơi tương tác)",
    description: "Ứng dụng khối lệnh Vòng lặp liên tục (forever), Cấu trúc điều kiện (if... then), Cảm biến va chạm (touching...) và tạo Biến số (Score) để xây dựng trò chơi hứng đồ vật hoặc câu chuyện hoạt hình tương tác.",
    outcomes: [
      "Sử dụng vòng lặp liên tục để tạo hành động tự động cho nhân vật (chim bay, bóng nảy).",
      "Sử dụng cảm biến phát hiện va chạm giữa hai nhân vật để kích hoạt âm thanh hoặc điểm thưởng.",
      "Tạo và tăng giá trị của biến số Điểm (Score) khi nhân vật hoàn thành thử thách.",
      "Chạy thử, phát hiện lỗi và hoàn thiện sản phẩm trò chơi tương tác."
    ],
    keywords: ["Vòng lặp forever", "Điều kiện if-then", "Cảm biến va chạm", "Biến số điểm"],
    recommendedLab: "scratch",
    labActionText: "Mở Dự án Scratch Sáng Tạo"
  },
  {
    id: "curr-grade-5-topic-2",
    gradeNumber: 5,
    orderIndex: 2,
    title: "Tổ chức tệp, thư mục khoa học & Đạo đức, bản quyền trong môi trường số",
    gdptCode: "Chủ đề C & D: Tổ chức lưu trữ & Đạo đức, pháp luật số",
    description: "Học cách tạo cây thư mục lưu trữ bài học ngăn nắp, sao chép, đổi tên và xóa tệp đúng cách. Hiểu khái niệm bản quyền nội dung, tôn trọng tác quyền của tác giả và ứng xử văn minh khi tham gia môi trường số.",
    outcomes: [
      "Xây dựng được cấu trúc cây thư mục môn học hợp lý trên máy tính (VD: ThuMuc_Lop5/TinHoc).",
      "Thực hiện thành thạo thao tác đổi tên, sao chép (Copy/Paste) và di chuyển tệp tin.",
      "Hiểu rõ việc cần xin phép hoặc ghi nguồn tác giả khi sử dụng hình ảnh, bài viết trên mạng."
    ],
    keywords: ["Cây thư mục", "Quản lý tệp tin", "Bản quyền nội dung", "Văn hóa mạng"],
    recommendedLab: "general",
    labActionText: "Thực hành quản lý tệp"
  },

  // =================== CẤP THCS (KHỐI 6 - 9) ===================
  // --- KHỐI 6 ---
  {
    id: "curr-grade-6-topic-1",
    gradeNumber: 6,
    orderIndex: 1,
    title: "Khái niệm thuật toán & Mô tả thuật toán bằng sơ đồ khối",
    gdptCode: "Chủ đề F: Thuật toán & Giải quyết vấn đề (Tin học 6 GDPT 2018)",
    description: "Tìm hiểu định nghĩa thuật toán: Tính dừng, tính xác định, tính đúng đắn và tính khả thi. Biểu diễn thuật toán giải bài toán bằng hai phương pháp: Liệt kê các bước bằng ngôn ngữ tự nhiên và vẽ Sơ đồ khối (Flowchart).",
    outcomes: [
      "Phát biểu được khái niệm thuật toán và xác định rõ Đầu vào (Input) và Đầu ra (Output) của bài toán.",
      "Sử dụng đúng các quy ước hình học trong sơ đồ khối: Khối Elip (Bắt đầu/Kết thúc), Hình chữ nhật (Xử lý), Hình bình hành (Nhập/Xuất), Hình thoi (Điều kiện rẽ nhánh).",
      "Vẽ được sơ đồ khối cho bài toán tìm số lớn nhất trong hai số, tính chu vi diện tích hình chữ nhật."
    ],
    keywords: ["Thuật toán", "Sơ đồ khối", "Input & Output", "Cấu trúc tuần tự & rẽ nhánh"],
    recommendedLab: "general",
    labActionText: "Thực hành vẽ sơ đồ khối"
  },
  {
    id: "curr-grade-6-topic-2",
    gradeNumber: 6,
    orderIndex: 2,
    title: "Mạng máy tính, Internet & Tìm kiếm thông tin khoa học với toán tử",
    gdptCode: "Chủ đề B: Mạng máy tính và Internet (Tin học 6 GDPT 2018)",
    description: "Khám phá cấu trúc mạng máy tính: Thiết bị đầu cuối, thiết bị kết nối (Switch, Router, Modem) và môi trường truyền dẫn (dây cáp, sóng vô tuyến Wi-Fi). Kỹ thuật tra cứu thông tin học tập chính xác bằng các toán tử tìm kiếm nâng cao.",
    outcomes: [
      "Trình bày được các thành phần chính của mạng máy tính và phân biệt mạng có dây với mạng không dây.",
      "Hiểu cách thức Internet kết nối toàn cầu và vai trò của dịch vụ Web (WWW).",
      "Sử dụng dấu ngoặc kép \"...\" để tìm chính xác cụm từ, dấu trừ - để loại trừ từ khóa không mong muốn."
    ],
    keywords: ["Mạng máy tính", "Bộ định tuyến Router", "Dịch vụ Internet", "Tìm kiếm nâng cao"],
    recommendedLab: "general",
    labActionText: "Tìm hiểu cấu trúc mạng"
  },

  // --- KHỐI 7 ---
  {
    id: "curr-grade-7-topic-1",
    gradeNumber: 7,
    orderIndex: 1,
    title: "Phần mềm bảng tính điện tử & Xử lý dữ liệu với hàm SUM, AVERAGE, IF",
    gdptCode: "Chủ đề E: Ứng dụng tin học - Bảng tính điện tử (Tin học 7 GDPT 2018)",
    description: "Làm việc với bảng tính: Hàng, cột, ô tính, địa chỉ ô tương đối và tuyệt đối. Nhập số liệu, áp dụng định dạng tiền tệ/phần trăm, sử dụng các hàm tính toán cơ bản (SUM, AVERAGE, MIN, MAX, COUNT, IF) và tạo biểu đồ trực quan hóa dữ liệu.",
    outcomes: [
      "Nhập và căn chỉnh dữ liệu bảng tính chuẩn xác (văn bản căn trái, số căn phải).",
      "Sử dụng công thức toán học và hàm SUM, AVERAGE, MIN, MAX để tính toán tự động.",
      "Vận dụng hàm IF để xếp loại kết quả (Đạt/Chưa đạt hoặc Khá/Giỏi) theo điểm số.",
      "Vẽ biểu đồ cột hoặc biểu đồ tròn trực quan hóa số liệu bảng thống kê."
    ],
    keywords: ["Bảng tính", "Địa chỉ ô tính", "Hàm SUM & AVERAGE", "Hàm điều kiện IF", "Biểu đồ số liệu"],
    recommendedLab: "general",
    labActionText: "Thực hành bảng tính số"
  },
  {
    id: "curr-grade-7-topic-2",
    gradeNumber: 7,
    orderIndex: 2,
    title: "Khởi đầu Lập trình Python: Cú pháp cơ bản, biến & Nhập xuất Stdin/Stdout",
    gdptCode: "Chủ đề F: Thuật toán và Lập trình Python (Tin học 7 GDPT 2018)",
    description: "Làm quen với môi trường lập trình Python. Khai báo biến, các kiểu dữ liệu số nguyên (int), số thực (float), chuỗi ký tự (str). Thực hiện nhập dữ liệu từ bàn phím bằng hàm input(), ép kiểu số int(input()) và in kết quả ra màn hình với hàm print().",
    outcomes: [
      "Viết chương trình Python in lời chào và thông tin bản thân bằng hàm print().",
      "Nhập dữ liệu từ bàn phím bằng input() và ép kiểu sang số nguyên int() hoặc số thực float().",
      "Thực hiện các phép toán số học: cộng (+), trừ (-), nhân (*), chia (/), chia lấy nguyên (//), chia lấy dư (%).",
      "Viết chương trình tính chu vi, diện tích hình chữ nhật hoặc tính tiền mua hàng đơn giản."
    ],
    keywords: ["Python cơ bản", "Hàm print() & input()", "Biến & Kiểu dữ liệu", "Phép toán số học"],
    recommendedLab: "python",
    labActionText: "Vào Lập Trình Python Khối 7 →"
  },

  // --- KHỐI 8 ---
  {
    id: "curr-grade-8-topic-1",
    gradeNumber: 8,
    orderIndex: 1,
    title: "Lập trình Python: Cấu trúc điều khiển rẽ nhánh (if - else) & Vòng lặp (for / while)",
    gdptCode: "Chủ đề F: Lập trình cấu trúc điều khiển (Tin học 8 GDPT 2018)",
    description: "Vận dụng câu lệnh rẽ nhánh if - elif - else để xử lý các bài toán điều kiện logic. Sử dụng vòng lặp với số lần biết trước for i in range(start, stop, step) và vòng lặp có điều kiện lặp while để tính tổng, đếm số và kiểm tra tính chất số học.",
    outcomes: [
      "Sử dụng các toán tử so sánh (==, !=, >, <, >=, <=) và toán tử logic (and, or, not).",
      "Viết chương trình rẽ nhánh kiểm tra số chẵn lẻ, tìm số lớn nhất trong 3 số, tính tiền điện theo bậc thang.",
      "Sử dụng vòng lặp for với hàm range() để tính tổng dãy số từ 1 đến N, tính tích giai thừa N!.",
      "Sử dụng vòng lặp while để giải quyết bài toán lặp với điều kiện dừng chính xác."
    ],
    keywords: ["Rẽ nhánh if-elif-else", "Toán tử logic", "Vòng lặp for & range()", "Vòng lặp while"],
    recommendedLab: "python",
    labActionText: "Vào Lập Trình Python Khối 8 →"
  },
  {
    id: "curr-grade-8-topic-2",
    gradeNumber: 8,
    orderIndex: 2,
    title: "Thiết kế trang thông tin web cơ bản với mã nguồn HTML5 & Định dạng CSS",
    gdptCode: "Chủ đề E: Ứng dụng tin học - Xây dựng trang thông tin web (Tin học 8 GDPT 2018)",
    description: "Tìm hiểu ngôn ngữ đánh dấu siêu văn bản HTML5. Nắm vững cấu trúc khung chuẩn HTML5 (doctype, html, head, body) và các thẻ nội dung: tiêu đề h1-h6, đoạn văn p, danh sách ul/ol, hình ảnh img, liên kết a và bảng table. Áp dụng CSS để phối màu và làm đẹp trang web.",
    outcomes: [
      "Hiểu cấu trúc khung chuẩn rỗng HTML5 và chức năng của phần tử head và body.",
      "Sử dụng thành thạo các thẻ văn bản, tạo liên kết trang và chèn ảnh minh họa rõ nét.",
      "Viết mã CSS định dạng màu nền, màu chữ, kích thước phông và đường viền trang cá nhân.",
      "Xem trước trực tiếp (Live Preview) trang web và kiểm tra khả năng hiển thị."
    ],
    keywords: ["HTML5", "Khung chuẩn HTML", "Thẻ tiêu đề & đoạn văn", "CSS định dạng", "Trang web cá nhân"],
    recommendedLab: "html",
    labActionText: "Vào Web Studio HTML Khối 8 →"
  },

  // --- KHỐI 9 ---
  {
    id: "curr-grade-9-topic-1",
    gradeNumber: 9,
    orderIndex: 1,
    title: "Lập trình Python nâng cao: Danh sách (List), Xử lý Xâu ký tự & Xây dựng Hàm (def)",
    gdptCode: "Chủ đề F: Giải quyết bài toán với cấu trúc dữ liệu mảng & hàm (Tin học 9 GDPT 2018)",
    description: "Làm việc với cấu trúc dữ liệu mảng danh sách (List): Khởi tạo, duyệt mảng, thêm phần tử với .append(), tìm giá trị lớn nhất/nhỏ nhất và tính tổng. Thao tác trên chuỗi ký tự (cắt lát xâu, đếm từ). Định nghĩa hàm con (def) để tái sử dụng mã nguồn và module hóa chương trình.",
    outcomes: [
      "Khai báo, nhập dữ liệu mảng danh sách số từ bàn phím bằng map(int, input().split()).",
      "Duyệt qua danh sách bằng vòng lặp for, tìm phần tử lớn nhất và vị trí xuất hiện.",
      "Xử lý chuỗi ký tự: Chuẩn hóa xâu, chuyển chữ hoa/chữ thường và kiểm tra xâu đối xứng.",
      "Khai báo hàm với từ khóa def, truyền tham số đầu vào và trả về kết quả bằng lệnh return."
    ],
    keywords: ["Danh sách List", "Xử lý xâu String", "Hàm def", "Tham số & Return", "Mô đun hóa"],
    recommendedLab: "python",
    labActionText: "Vào Lập Trình Python Khối 9 →"
  },
  {
    id: "curr-grade-9-topic-2",
    gradeNumber: 9,
    orderIndex: 2,
    title: "Tin học & Xã hội số: Ứng dụng Trí tuệ nhân tạo (AI), An ninh mạng & Định hướng nghề STEM",
    gdptCode: "Chủ đề D: Đạo đức, pháp luật và văn hóa trong môi trường số (Tin học 9 GDPT 2018)",
    description: "Nhận biết tác động của công nghệ số và Trí tuệ nhân tạo (AI) đối với đời sống, học tập và sản xuất. Hiểu các nguy cơ mất an toàn thông tin (mã độc, lừa đảo trực tuyến), biện pháp phòng ngừa và tìm hiểu các ngành nghề trong kỷ nguyên công nghệ 4.0.",
    outcomes: [
      "Nêu được ví dụ thực tế về ứng dụng của AI (nhận diện giọng nói, xe tự lái, trợ lý ảo).",
      "Nhận diện được các hình thức lừa đảo qua mạng và biết cách tự bảo vệ dữ liệu cá nhân.",
      "Hiểu rõ Luật An ninh mạng và trách nhiệm của công dân khi chia sẻ thông tin trên mạng xã hội.",
      "Xác định được các ngành nghề STEM và công nghệ thông tin phù hợp với sở thích cá nhân."
    ],
    keywords: ["Trí tuệ nhân tạo AI", "An ninh mạng", "Phòng chống mã độc", "Định hướng nghề STEM"],
    recommendedLab: "general",
    labActionText: "Khám phá chuyên đề số"
  },

  // =================== CẤP THPT (KHỐI 10 - 12) ===================
  // --- KHỐI 10 ---
  {
    id: "curr-grade-10-topic-1",
    gradeNumber: 10,
    orderIndex: 1,
    title: "Lập trình Python thực hành: Cú pháp, Biến, Cấu trúc rẽ nhánh & Vòng lặp",
    gdptCode: "Chủ đề F: Lập trình với Python (Tin học 10 GDPT 2018 - Định hướng CS & ICT)",
    description: "Chương trình Tin học 10 chuẩn GDPT 2018: Làm chủ cú pháp ngôn ngữ lập trình bậc cao Python. Biến, hằng, các kiểu dữ liệu int, float, bool, str; toán tử số học và logic; cấu trúc rẽ nhánh if - elif - else lồng nhau; vòng lặp for i in range() và vòng lặp có điều kiện while.",
    outcomes: [
      "Hiểu cơ chế thực thi của thông dịch viên Python, quy tắc đặt tên biến và kiểu dữ liệu động.",
      "Viết chương trình xử lý rẽ nhánh phức tạp: Giải phương trình bậc nhất, giải phương trình bậc hai, phân loại hình học tam giác.",
      "Vận dụng vòng lặp for và while giải quyết các bài toán số học: Kiểm tra số nguyên tố, phân tích thừa số nguyên tố, tìm UCLN theo thuật toán Euclid.",
      "Kiểm thử chương trình với nhiều bộ dữ liệu thử (Testcases) tự động."
    ],
    keywords: ["Python 10 GDPT 2018", "Biến & Kiểu dữ liệu", "Rẽ nhánh if-elif-else", "Vòng lặp for & while", "Thuật toán Euclid"],
    recommendedLab: "python",
    labActionText: "Vào Lập Trình Python 10 →"
  },
  {
    id: "curr-grade-10-topic-2",
    gradeNumber: 10,
    orderIndex: 2,
    title: "Cấu trúc dữ liệu Danh sách (List), Xâu ký tự, Hàm & Thuật toán Sắp xếp/Tìm kiếm",
    gdptCode: "Chủ đề F: Cấu trúc dữ liệu & Thuật toán giải bài toán (Tin học 10 GDPT 2018)",
    description: "Nghiên cứu sâu cấu trúc dữ liệu mảng danh sách list một chiều và hai chiều; các phương thức append(), insert(), pop(), remove(), sort(); kỹ thuật cắt lát xâu slice [start:stop:step]; xây dựng hàm def có giá trị trả về; cài đặt thuật toán Tìm kiếm tuần tự và Thuật toán sắp xếp chọn (Selection Sort).",
    outcomes: [
      "Thao tác thuần thục trên danh sách: Tìm giá trị lớn nhất, đếm phần tử thỏa mãn điều kiện, xóa phần tử trùng lặp.",
      "Xử lý xâu ký tự nâng cao: Chuẩn hóa họ tên tiếng Việt, trích xuất từ, kiểm tra xâu Palindrome đối xứng.",
      "Tổ chức chương trình theo hướng cấu trúc bằng các hàm con (def), phân tách nhiệm vụ rõ ràng.",
      "Cài đặt và chạy thử nghiệm thuật toán Sắp xếp chọn (Selection Sort) hoặc Sắp xếp chèn (Insertion Sort)."
    ],
    keywords: ["Danh sách List", "Xử lý xâu String", "Hàm def có tham số", "Thuật toán Sắp xếp chọn", "Tìm kiếm tuần tự"],
    recommendedLab: "python",
    labActionText: "Vào Thực Hành Thuật Toán Python 10 →"
  },

  // --- KHỐI 11 ---
  {
    id: "curr-grade-11-topic-1",
    gradeNumber: 11,
    orderIndex: 1,
    title: "Thuật toán nâng cao, Cấu trúc dữ liệu & Kỹ thuật tối ưu hóa giải thuật (Python / C++)",
    gdptCode: "Chuyên đề Tin học 11: Định hướng Khoa học máy tính CS (Tin học 11 GDPT 2018)",
    description: "Phân tích độ phức tạp thời gian và không gian của thuật toán bằng ký hiệu tiệm cận Big-O: O(1), O(log N), O(N), O(N log N). Cài đặt thuật toán Tìm kiếm nhị phân (Binary Search), thuật toán sắp xếp nhanh (Quick Sort) hoặc Merge Sort; kỹ thuật chia để trị và đệ quy.",
    outcomes: [
      "Đánh giá được độ phức tạp thời gian của đoạn mã nguồn và lựa chọn giải thuật tối ưu khi dữ liệu N lớn.",
      "Cài đặt chính xác thuật toán Tìm kiếm nhị phân (Binary Search) trên mảng đã sắp xếp với thời gian O(log N).",
      "Hiểu cơ chế hoạt động của ngăn xếp lời gọi hàm trong giải thuật đệ quy (tính giai thừa, tháp Hà Nội).",
      "Tự tin giải quyết các bài toán thi học sinh giỏi và thử thách lập trình trên nền tảng chấm tự động."
    ],
    keywords: ["Độ phức tạp Big-O", "Tìm kiếm nhị phân", "Sắp xếp tối ưu O(N log N)", "Giải thuật đệ quy", "Python / C++"],
    recommendedLab: "python",
    labActionText: "Vào Lập Trình Thuật Toán Khối 11 →"
  },
  {
    id: "curr-grade-11-topic-2",
    gradeNumber: 11,
    orderIndex: 2,
    title: "Hệ Cơ sở dữ liệu quan hệ (RDBMS), Ngôn ngữ truy vấn SQL & Thiết kế bảng dữ liệu",
    gdptCode: "Chủ đề F: Hệ quản trị cơ sở dữ liệu quan hệ (Tin học 11 GDPT 2018 - Định hướng Ứng dụng ICT)",
    description: "Tìm hiểu kiến trúc hệ cơ sở dữ liệu: Khái niệm bảng (Table), bản ghi (Record), trường (Field), khóa chính (Primary Key) và khóa ngoại (Foreign Key). Viết câu lệnh SQL cơ bản để truy vấn, lọc, thêm mới, cập nhật và liên kết dữ liệu giữa các bảng.",
    outcomes: [
      "Xác định được các thực thể, thuộc tính và thiết kế bảng dữ liệu chuẩn hóa cho bài toán quản lý trường học.",
      "Viết câu lệnh truy vấn SQL: SELECT ... FROM ... WHERE ... ORDER BY ...",
      "Sử dụng các mệnh đề kết nối bảng JOIN để trích xuất thông tin từ nhiều bảng liên quan.",
      "Hiểu các nguyên tắc đảm bảo toàn vẹn dữ liệu và an toàn thông tin trong hệ cơ sở dữ liệu."
    ],
    keywords: ["Cơ sở dữ liệu RDBMS", "Khóa chính & Khóa ngoại", "Ngôn ngữ SQL", "Truy vấn dữ liệu", "Quản lý trường học"],
    recommendedLab: "general",
    labActionText: "Thực hành thiết kế CSDL"
  },

  // --- KHỐI 12 ---
  {
    id: "curr-grade-12-topic-1",
    gradeNumber: 12,
    orderIndex: 1,
    title: "Phát triển ứng dụng Web đa nền tảng với HTML5, CSS3 hiện đại & JavaScript tương tác",
    gdptCode: "Chuyên đề Tin học 12: Kỹ thuật phát triển ứng dụng Web (Tin học 12 GDPT 2018)",
    description: "Xây dựng ứng dụng web hoàn chỉnh: Tổ chức mã nguồn HTML5 chuẩn ngữ nghĩa (semantic tags: header, nav, main, section, footer), thiết kế giao diện responsive với CSS Flexbox/Grid tương thích mọi kích thước màn hình và lập trình JavaScript điều khiển DOM, xử lý sự kiện tương tác người dùng.",
    outcomes: [
      "Sử dụng khung chuẩn HTML5 và các thẻ ngữ nghĩa để xây dựng cấu trúc trang web chuẩn công nghiệp.",
      "Áp dụng CSS Flexbox và Grid để tạo layout đáp ứng (Responsive Web Design) hiển thị tốt trên máy tính và điện thoại.",
      "Lập trình JavaScript lắng nghe sự kiện (Click, Submit, Input) và cập nhật nội dung giao diện động mà không cần tải lại trang.",
      "Xuất bản và chia sẻ sản phẩm trang web thực tế."
    ],
    keywords: ["HTML5 Semantic", "CSS Flexbox & Grid", "Responsive Design", "JavaScript DOM", "Ứng dụng Web"],
    recommendedLab: "html",
    labActionText: "Vào Web Studio HTML5 Khối 12 →"
  },
  {
    id: "curr-grade-12-topic-2",
    gradeNumber: 12,
    orderIndex: 2,
    title: "Nhập môn Trí tuệ nhân tạo (AI), Học máy & Dự án Khoa học kỹ thuật STEM liên môn",
    gdptCode: "Chuyên đề Tin học 12: Trí tuệ nhân tạo & Khoa học dữ liệu (Tin học 12 GDPT 2018)",
    description: "Khám phá các khái niệm nền tảng của Trí tuệ nhân tạo (AI) và Học máy (Machine Learning): Phân loại dữ liệu, xử lý ngôn ngữ tự nhiên và thị giác máy tính. Triển khai dự án STEM liên môn ứng dụng AI hoặc lập trình IoT giải quyết các bài toán thiết thực trong cuộc sống.",
    outcomes: [
      "Giải thích được quy trình hoạt động cơ bản của mô hình học máy (Thu thập dữ liệu -> Huấn luyện mô hình -> Đánh giá độ chính xác -> Ứng dụng dự đoán).",
      "Vận dụng các công cụ AI và API hiện đại để giải quyết bài toán phân loại hình ảnh hoặc nhận diện văn bản.",
      "Xây dựng kế hoạch và hoàn thành báo cáo dự án sáng tạo STEM có tích hợp công nghệ số.",
      "Nâng cao nhận thức về đạo đức AI, tính công bằng và trách nhiệm xã hội khi phát triển công nghệ."
    ],
    keywords: ["Trí tuệ nhân tạo AI", "Học máy Machine Learning", "Xử lý dữ liệu", "Dự án STEM liên môn"],
    recommendedLab: "python",
    labActionText: "Khám phá dự án AI & STEM"
  }
];

/**
 * Trích xuất số khối lớp (1 - 12) từ classGrade (VD: "Lớp 7A1" -> 7, "Khối 10" -> 10)
 * Nếu không phát hiện được thì fallback theo cấp học.
 */
export const extractGradeNumber = (classGrade?: string, fallbackLevel?: string): number => {
  if (classGrade) {
    // Check for numbers 1 to 12
    const match = classGrade.match(/\b(1[0-2]|[1-9])\b/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  if (fallbackLevel === "elementary") return 4;
  if (fallbackLevel === "high") return 10;
  return 7;
};

/**
 * Lấy đúng 1 - 2 nội dung theo số khối (1 - 12)
 */
export const getCurriculumTopicsForGrade = (gradeNum: number): CurriculumTopic[] => {
  const topics = GRADE_CURRICULUM_TOPICS.filter((t) => t.gradeNumber === gradeNum);
  // Guarantee exactly 1 to 2 topics as requested by user
  return topics.slice(0, 2);
};

/**
 * Danh sách cấp học tương ứng với khối
 */
export const getGradeCategory = (gradeNum: number): { name: string; level: "elementary" | "middle" | "high" } => {
  if (gradeNum >= 1 && gradeNum <= 5) {
    return { name: "Tiểu học", level: "elementary" };
  }
  if (gradeNum >= 6 && gradeNum <= 9) {
    return { name: "THCS", level: "middle" };
  }
  return { name: "THPT", level: "high" };
};
