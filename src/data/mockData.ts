import { Lesson, ClassItem, Submission } from "../types";

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: "lesson-py-01",
    title: "Bài 1: Làm quen với Python & Xuất thông báo ra màn hình",
    description: "Học cú pháp print(), các kiểu dữ liệu cơ bản (số nguyên, số thực, chuỗi ký tự) và ghi chú trong Python.",
    level: "high",
    moduleType: "coding",
    language: "python",
    durationMinutes: 45,
    createdAt: "2026-01-01T00:00:00.000Z",
    starterCode: `# Viết câu lệnh in lời chào ra màn hình\nprint("Chào mừng các em đến với lớp lập trình Python!")\n`,
    testcases: [
      {
        id: 1,
        input: "",
        expectedOutput: "Chào mừng các em đến với lớp lập trình Python!",
      },
    ],
  },
  {
    id: "lesson-py-02",
    title: "Bài 2: Biến và Nhập dữ liệu từ bàn phím (input)",
    description: "Khởi tạo biến, gán giá trị, nhập chuỗi với input() và ép kiểu sang số nguyên int() hoặc số thực float().",
    level: "high",
    moduleType: "coding",
    language: "python",
    durationMinutes: 45,
    createdAt: "2026-01-01T00:00:00.000Z",
    starterCode: `# Nhập tên và năm sinh, tính tuổi của học sinh\nten = input("Nhập họ tên: ")\nnam_sinh = int(input("Nhập năm sinh: "))\ntuoi = 2026 - nam_sinh\nprint(f"Chào {ten}, năm nay bạn {tuoi} tuổi.")\n`,
    testcases: [
      {
        id: 1,
        input: "Nguyễn An\n2009",
        expectedOutput: "Chào Nguyễn An, năm nay bạn 17 tuổi.",
      },
    ],
  },
  {
    id: "lesson-py-03",
    title: "Bài 3: Cấu trúc rẽ nhánh if - elif - else",
    description: "Kiểm tra điều kiện số học và logic, điều hướng luồng chương trình trong Tin học 10 GDPT 2018.",
    level: "high",
    moduleType: "coding",
    language: "python",
    durationMinutes: 45,
    createdAt: "2026-01-01T00:00:00.000Z",
    starterCode: `# Kiểm tra điểm trung bình môn Tin học\ndiem = float(input("Nhập điểm môn Tin: "))\nif diem >= 8.0:\n    print("Xếp loại Giỏi")\nelif diem >= 6.5:\n    print("Xếp loại Khá")\nelif diem >= 5.0:\n    print("Xếp loại Đạt")\nelse:\n    print("Cần cố gắng thêm")\n`,
    testcases: [
      {
        id: 1,
        input: "8.5",
        expectedOutput: "Xếp loại Giỏi",
      },
    ],
  },
];

export const INITIAL_CLASSES: ClassItem[] = [];

export const INITIAL_SUBMISSIONS: Submission[] = [];
