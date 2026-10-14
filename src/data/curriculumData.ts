import { CurriculumTopic, GradeLevel } from "../types";

export function extractGradeNumber(classGrade?: string, gradeLevel?: GradeLevel): number {
  if (classGrade) {
    const match = classGrade.match(/(?:Khối|Lớp|K|Grade|\s)?\s*(\d{1,2})/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
        return parsed;
      }
    }
  }

  if (gradeLevel === "high") return 10;
  if (gradeLevel === "middle") return 8;
  if (gradeLevel === "elementary") return 4;
  return 10;
}

export const GDPT_CURRICULUM_TOPICS: Record<number, CurriculumTopic[]> = {
  6: [
    { id: "top-6-1", gradeNumber: 6, orderIndex: 1, gdptCode: "Chủ đề A (GDPT 2018)", title: "Chủ đề A: Máy tính và cộng đồng", description: "Thông tin và dữ liệu, thiết bị lưu trữ, mạng máy tính." },
    { id: "top-6-2", gradeNumber: 6, orderIndex: 2, gdptCode: "Chủ đề B (GDPT 2018)", title: "Chủ đề B: Mạng máy tính và Internet", description: "Khái niệm mạng, tìm kiếm và chia sẻ thông tin trên Internet." },
    { id: "top-6-3", gradeNumber: 6, orderIndex: 3, gdptCode: "Chủ đề F (GDPT 2018)", title: "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính", description: "Thuật toán và sơ đồ khối, làm quen với Scratch." }
  ],
  7: [
    { id: "top-7-1", gradeNumber: 7, orderIndex: 1, gdptCode: "Chủ đề A (GDPT 2018)", title: "Chủ đề A: Máy tính và cộng đồng", description: "Thiết bị vào ra, hệ điều hành và phần mềm ứng dụng." },
    { id: "top-7-2", gradeNumber: 7, orderIndex: 2, gdptCode: "Chủ đề E (GDPT 2018)", title: "Chủ đề E: Ứng dụng tin học", description: "Bảng tính điện tử (Excel/Sheets), xử lý dữ liệu và vẽ biểu đồ." }
  ],
  8: [
    { id: "top-8-1", gradeNumber: 8, orderIndex: 1, gdptCode: "Chủ đề A (GDPT 2018)", title: "Chủ đề A: Máy tính và cộng đồng", description: "Lịch sử phát triển của máy tính, thông tin trong môi trường số." },
    { id: "top-8-2", gradeNumber: 8, orderIndex: 2, gdptCode: "Chủ đề F (GDPT 2018)", title: "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính", description: "Lập trình trực quan hoặc làm quen với Python cơ bản." }
  ],
  9: [
    { id: "top-9-1", gradeNumber: 9, orderIndex: 1, gdptCode: "Chủ đề A (GDPT 2018)", title: "Chủ đề A: Máy tính và cộng đồng", description: "Hệ thống thông tin quản lý, đạo đức và văn hóa số." },
    { id: "top-9-2", gradeNumber: 9, orderIndex: 2, gdptCode: "Chủ đề F (GDPT 2018)", title: "Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính", description: "Lập trình thuật toán, cấu trúc lặp và rẽ nhánh." }
  ],
  10: [
    { id: "top-10-1", gradeNumber: 10, orderIndex: 1, gdptCode: "Chủ đề 1 (GDPT 2018)", title: "Chủ đề 1: Làm quen với ngôn ngữ lập trình Python", description: "Cài đặt môi trường, hàm print(), input(), các kiểu dữ liệu int, float, str." },
    { id: "top-10-2", gradeNumber: 10, orderIndex: 2, gdptCode: "Chủ đề 2 (GDPT 2018)", title: "Chủ đề 2: Các cấu trúc điều khiển cơ bản", description: "Cấu trúc rẽ nhánh if - elif - else, vòng lặp for và while." },
    { id: "top-10-3", gradeNumber: 10, orderIndex: 3, gdptCode: "Chủ đề 3 (GDPT 2018)", title: "Chủ đề 3: Kiểu dữ liệu danh sách (List) và xâu ký tự (String)", description: "Duyệt danh sách, các phương thức list, xử lý chuỗi và định dạng f-string." },
    { id: "top-10-4", gradeNumber: 10, orderIndex: 4, gdptCode: "Chủ đề 4 (GDPT 2018)", title: "Chủ đề 4: Chương trình con và Hàm (def)", description: "Định nghĩa hàm, tham số, giá trị trả về return và phạm vi biến." },
    { id: "top-10-5", gradeNumber: 10, orderIndex: 5, gdptCode: "Chủ đề 5 (GDPT 2018)", title: "Chủ đề 5: Dự án thực hành lập trình & Tự giải thích lỗi", description: "Giải quyết bài toán thực tế, tự phân tích lỗi và giải trình giải thuật." }
  ],
  11: [
    { id: "top-11-1", gradeNumber: 11, orderIndex: 1, gdptCode: "Chủ đề 1 (GDPT 2018)", title: "Chủ đề 1: Lập trình nâng cao và Cấu trúc dữ liệu", description: "Mảng hai chiều, từ điển (Dictionary), Tập hợp (Set), đọc ghi tệp." },
    { id: "top-11-2", gradeNumber: 11, orderIndex: 2, gdptCode: "Chủ đề 2 (GDPT 2018)", title: "Chủ đề 2: Cơ sở dữ liệu và SQL cơ bản", description: "Thiết kế CSDL quan hệ, các câu lệnh SELECT, INSERT, UPDATE." }
  ],
  12: [
    { id: "top-12-1", gradeNumber: 12, orderIndex: 1, gdptCode: "Chủ đề 1 (GDPT 2018)", title: "Chủ đề 1: Trí tuệ nhân tạo (AI) và Ứng dụng", description: "Lịch sử AI, học máy, đạo đức sử dụng AI trong học tập và đời sống." },
    { id: "top-12-2", gradeNumber: 12, orderIndex: 2, gdptCode: "Chủ đề 2 (GDPT 2018)", title: "Chủ đề 2: Lập trình Web và Dự án số", description: "HTML/CSS, JavaScript, tương tác API và xây dựng sản phẩm số." }
  ]
};

export function getCurriculumTopicsForGrade(grade: number): CurriculumTopic[] {
  return GDPT_CURRICULUM_TOPICS[grade] || GDPT_CURRICULUM_TOPICS[10] || [];
}
