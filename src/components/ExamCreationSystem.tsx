import React, { useState, useRef } from "react";
import { 
  Upload, 
  UploadCloud, 
  Edit3, 
  Gamepad2, 
  CheckSquare, 
  Landmark, 
  ChevronUp, 
  ChevronDown, 
  Megaphone, 
  FileText, 
  FileSpreadsheet, 
  Headphones, 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  ArrowLeft, 
  Eye, 
  Clock, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Download, 
  RotateCw,
  Sliders,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { QuizQuestion, GradeLevel, Lesson, ClassItem } from "../types";

interface ExamCreationSystemProps {
  isOpen: boolean;
  onClose: () => void;
  classes?: ClassItem[];
  onSaveExam: (lessonData: Partial<Lesson>) => Promise<void>;
  initialGradeLevel?: GradeLevel;
}

// Sample Templates for download & quick preview
const SAMPLE_TEMPLATES = {
  pdf: {
    title: "Đề mẫu Azota PDF (Chuẩn trắc nghiệm 4 lựa chọn)",
    filename: "de_mau_azota_chuan.pdf",
    content: `ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ TIN HỌC (GDPT 2018)
Thời gian làm bài: 45 phút

Câu 1: Trong ngôn ngữ lập trình Python, cú pháp nào sau đây dùng để xuất dữ liệu ra màn hình chuẩn?
A. console.log()
B. System.out.println()
C. print()
D. printf()
Đáp án: C
Giải thích: print() là hàm xuất chuẩn tích hợp sẵn trong Python.

Câu 2: Khối lệnh điều khiển rẽ nhánh nào sau đây là cú pháp đúng trong Python?
A. if condition then:
B. if condition:
C. if (condition) {}
D. if: condition
Đáp án: B
Giải thích: Cú pháp chuẩn của Python là "if điều_kiện:" kết thúc bằng dấu hai chấm và thụt lề khối lệnh.

Câu 3: Đâu là thiết bị vào (Input device) của máy tính?
A. Màn hình máy tính
B. Loa âm thanh
C. Bàn phím và Chuột
D. Máy in nhiệt
Đáp án: C
Giải thích: Bàn phím và chuột giúp người dùng nhập dữ liệu và chỉ lệnh vào máy tính.

Câu 4: Cấu trúc lặp với số lần biết trước trong Python thường sử dụng từ khóa nào?
A. while
B. loop
C. for ... in range(...)
D. repeat until
Đáp án: C
Giải thích: Vòng lặp "for i in range(n)" duyệt qua dãy số biết trước số lần lặp.`,
  },
  docx: {
    title: "Đề mẫu Azota Docx (Chuẩn câu hỏi & bảng đáp án)",
    filename: "de_mau_azota_word.docx",
    content: `TRƯỜNG PHỔ THÔNG NĂNG KHIẾU STEM
BỘ MÔN TIN HỌC - CÔNG NGHỆ
---
ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC SỐ

Câu 1: Biến nhớ trong chương trình dùng để làm gì?
A. Trang trí giao diện phần mềm
B. Lưu trữ giá trị dữ liệu có thể thay đổi trong khi chương trình chạy
C. Kết nối máy tính với mạng Internet
D. Tắt máy tính tự động
Đáp án: B

Câu 2: Kiểu dữ liệu nào sau đây lưu trữ các số nguyên như -5, 0, 100 trong Python?
A. float
B. str
C. int
D. bool
Đáp án: C

Câu 3: Giá trị của biểu thức 17 // 5 trong Python là:
A. 3.4
B. 3
C. 2
D. 12
Đáp án: B
Giải thích: Toán tử // là phép chia lấy phần nguyên (17 // 5 = 3).

Câu 4: Thuật toán sắp xếp nổi bọt (Bubble Sort) hoạt động dựa trên nguyên lý nào?
A. Chia đôi mảng liên tiếp
B. So sánh và đổi chỗ hai phần tử liền kề nếu chúng sai thứ tự
C. Chọn phần tử ngẫu nhiên
D. Tìm kiếm phần tử lớn nhất đưa về đầu
Đáp án: B`,
  },
  excel: {
    title: "Bảng đáp án đề Offline Excel (Chấm trắc nghiệm quét phiếu)",
    filename: "bang_dap_an_offline_mau.xlsx",
    content: `Mã đề: 101
Câu | Đáp án | Điểm
1   | A      | 0.25
2   | C      | 0.25
3   | B      | 0.25
4   | D      | 0.25
5   | B      | 0.25
6   | A      | 0.25
7   | C      | 0.25
8   | D      | 0.25`,
  },
  latex: {
    title: "File Latex mẫu (.tex) chuẩn đề thi Quốc Gia",
    filename: "de_thi_latex_mau.tex",
    content: `\\documentclass{article}
\\usepackage[utf8]{vietnam}
\\usepackage{amsmath}
\\begin{document}
\\title{ĐỀ THI TIN HỌC TRẺ}
\\author{Ban Khảo Thí}
\\maketitle

\\begin{enumerate}
\\item Đoạn mã sau in ra giá trị gì?
\\begin{verbatim}
s = 0
for i in range(1, 6):
    s += i
print(s)
\\end{verbatim}
\\begin{enumerate}[A.]
\\item 10
\\item 15 (Đáp án đúng)
\\item 20
\\item 25
\\end{enumerate}
\\end{enumerate}
\\end{document}`,
  },
  zip: {
    title: "Gói đề thi Latex (.zip) kèm hình ảnh minh họa",
    filename: "de_latex_kem_anh.zip",
    content: `Gói nén ZIP bao gồm:
- main.tex (Mã nguồn đề thi)
- images/so_do_khoi.png (Hình sơ đồ thuật toán)
- images/mach_arduino.png (Hình bo mạch cảm biến)
- dapan.txt (Bảng đáp án mã đề)`,
  },
  english: {
    title: "File đề Tiếng Anh mẫu (.docx) Cambridge / AP Computer Science",
    filename: "sample_english_cs_exam.docx",
    content: `INTERNATIONAL COMPUTER SCIENCE ASSESSMENT
Grade: 8-10 | Duration: 45 Minutes

Question 1: What is the time complexity of binary search on a sorted array?
A. O(n)
B. O(log n)
C. O(n^2)
D. O(1)
Answer: B
Explanation: Binary search divides the search interval in half with each step.

Question 2: Which keyword is used to define a function in Python?
A. func
B. function
C. def
D. define
Answer: C
Explanation: In Python, "def" is used to declare a function.

Question 3: What does HTML stand for?
A. HyperText Markup Language
B. HighText Machine Language
C. HyperTool Multi Language
D. Home Tool Markup Language
Answer: A`,
  },
};

export const ExamCreationSystem: React.FC<ExamCreationSystemProps> = ({
  isOpen,
  onClose,
  classes = [],
  onSaveExam,
  initialGradeLevel = "middle",
}) => {
  // Main view modes: "hub" (Screenshot layout) | "editor" (Live exam editor) | "paste" | "matrix" | "interactive" | "competency"
  const [viewMode, setViewMode] = useState<"hub" | "editor" | "paste" | "matrix" | "interactive" | "competency">("hub");

  // Hub right-panel accordion
  const [isOnlineSectionOpen, setIsOnlineSectionOpen] = useState(true);

  // File upload & OCR states
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingProgress, setParsingProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template preview modal
  const [selectedTemplate, setSelectedTemplate] = useState<{
    key: string;
    title: string;
    filename: string;
    content: string;
  } | null>(null);

  // Exam Meta Information
  const [examTitle, setExamTitle] = useState("Đề Kiểm Tra Đánh Giá Năng Lực STEM");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(initialGradeLevel);
  const [targetClass, setTargetClass] = useState<string>(classes[0]?.name || "Tất cả các lớp");
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [showExplanationAfterSubmit, setShowExplanationAfterSubmit] = useState<boolean>(true);

  // Questions State
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: "q-init-1",
      question: "Trong Python, hàm nào sau đây dùng để xuất dữ liệu ra màn hình?",
      options: ["console.log()", "print()", "write()", "System.out()"],
      correctIndex: 1,
      explanation: "Hàm print() là hàm xuất chuẩn trong Python.",
      level: "nhan_biet",
      points: 1.0,
    },
    {
      id: "q-init-2",
      question: "Biểu thức 14 % 4 trong lập trình cho kết quả là bao nhiêu?",
      options: ["3.5", "3", "2", "0"],
      correctIndex: 2,
      explanation: "Toán tử % chia lấy phần dư: 14 chia 4 được 3 dư 2.",
      level: "thong_hieu",
      points: 1.0,
    },
    {
      id: "q-init-3",
      question: "Đoạn mã `for i in range(1, 5): print(i, end=' ')` in ra dãy số nào?",
      options: ["1 2 3 4 5", "1 2 3 4", "0 1 2 3 4", "1 5"],
      correctIndex: 1,
      explanation: "range(1, 5) sinh các số nguyên từ 1 đến 4 (cận trên không lấy).",
      level: "van_dung",
      points: 1.0,
    },
  ]);

  // Editor single question form
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Paste Text Form State
  const [pasteRawText, setPasteRawText] = useState(
    `Câu 1: Đâu là kiểu dữ liệu số thực trong Python?
A. int
B. float
C. str
D. bool
Đáp án: B
Giải thích: float là kiểu dữ liệu số thực có dấu phẩy động.

Câu 2: Vòng lặp while thực hiện khối lệnh khi nào?
A. Luôn thực hiện ít nhất 1 lần
B. Khi điều kiện kiểm tra còn đúng (True)
C. Khi điều kiện kiểm tra là sai (False)
D. Lặp vô hạn không dừng
Đáp án: B`
  );

  // Matrix Generator State
  const [matrixSubject, setMatrixSubject] = useState("Tin học 8 (Python)");
  const [matrixTopics, setMatrixTopics] = useState([
    { topic: "Chủ đề 1: Biến, Kiểu dữ liệu & Phép toán", nhanBiet: 2, thongHieu: 2, vanDung: 1, vanDungCao: 0 },
    { topic: "Chủ đề 2: Cấu trúc rẽ nhánh if - else", nhanBiet: 1, thongHieu: 2, vanDung: 1, vanDungCao: 1 },
    { topic: "Chủ đề 3: Cấu trúc lặp for và while", nhanBiet: 1, thongHieu: 1, vanDung: 2, vanDungCao: 1 },
  ]);

  // Feedback notifications
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [supportMessageOpen, setSupportMessageOpen] = useState(false);

  if (!isOpen) return null;

  // 1. FILE UPLOAD HANDLERS
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    setIsParsing(true);
    setParsingProgress(`Đang tải lên & số hóa: ${file.name}...`);

    try {
      const isImage = file.type.startsWith("image/");
      
      if (isImage) {
        setParsingProgress("Đang quét OCR & nhận diện chữ viết bằng Gemini Vision AI...");
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result as string;
          try {
            const res = await fetch("/api/gemini/parse-exam-file", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageBase64: base64Data,
                mimeType: file.type || "image/png",
                fileName: file.name,
              }),
            });
            const data = await res.json();
            if (data.questions && data.questions.length > 0) {
              setQuestions(data.questions);
              if (data.examTitle) setExamTitle(data.examTitle);
              setViewMode("editor");
            } else {
              alert("Không trích xuất được câu hỏi từ ảnh. Chuyển sang chế độ tự soạn!");
              setViewMode("paste");
            }
          } catch (err) {
            console.error(err);
            setViewMode("paste");
          } finally {
            setIsParsing(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Text / Docx / PDF text reader
        setParsingProgress("Đang phân tích cấu trúc câu hỏi, phương án và bảng đáp án...");
        const reader = new FileReader();
        reader.onload = async () => {
          const textContent = (reader.result as string) || "";
          try {
            const res = await fetch("/api/gemini/parse-exam-file", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                textContent: textContent.slice(0, 15000),
                fileName: file.name,
              }),
            });
            const data = await res.json();
            if (data.questions && data.questions.length > 0) {
              setQuestions(data.questions);
              if (data.examTitle) setExamTitle(data.examTitle);
              setViewMode("editor");
            } else {
              // Fallback to paste
              setPasteRawText(textContent.slice(0, 5000));
              setViewMode("paste");
            }
          } catch (err) {
            console.error(err);
            setViewMode("paste");
          } finally {
            setIsParsing(false);
          }
        };
        reader.readAsText(file);
      }
    } catch (e: any) {
      alert(`Lỗi đọc file: ${e.message}`);
      setIsParsing(false);
    }
  };

  // 2. PARSE PASTED TEXT
  const handleParsePastedText = () => {
    setIsParsing(true);
    setParsingProgress("Đang tự động bóc tách Câu hỏi, Phương án A-B-C-D và Đáp án đúng...");
    setTimeout(() => {
      const lines = pasteRawText.split(/\r?\n/);
      const parsedList: QuizQuestion[] = [];
      let currentQ: Partial<QuizQuestion> | null = null;

      const pushCurrent = () => {
        if (currentQ && currentQ.question) {
          parsedList.push({
            id: `q-paste-${Date.now()}-${parsedList.length + 1}`,
            question: currentQ.question.trim(),
            options: currentQ.options && currentQ.options.length >= 2 ? currentQ.options : ["A", "B", "C", "D"],
            correctIndex: currentQ.correctIndex !== undefined ? currentQ.correctIndex : 0,
            explanation: currentQ.explanation || "Đáp án chuẩn theo đề bài.",
            level: currentQ.level || "thong_hieu",
            points: 1.0,
          });
        }
        currentQ = null;
      };

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (/^(Câu\s*\d+|Bài\s*\d+|Question\s*\d+|Q\d+)\s*[:.]/i.test(line)) {
          pushCurrent();
          currentQ = {
            question: line,
            options: [],
            correctIndex: 0,
            explanation: "",
          };
          continue;
        }

        if (/^[A-D]\s*[:.]\s*(.*)$/i.test(line) && currentQ) {
          const match = line.match(/^[A-D]\s*[:.]\s*(.*)$/i);
          if (match) currentQ.options?.push(match[1].trim());
          continue;
        }

        if (/^(Đáp án|Đáp án đúng|Answer|Key)\s*[:.]\s*([A-D])/i.test(line) && currentQ) {
          const match = line.match(/^(Đáp án|Đáp án đúng|Answer|Key)\s*[:.]\s*([A-D])/i);
          if (match) {
            const letter = match[2].toUpperCase();
            const mapIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
            if (mapIdx[letter] !== undefined) currentQ.correctIndex = mapIdx[letter];
          }
          continue;
        }

        if (/^(Giải thích|Explanation)\s*[:.]\s*(.*)$/i.test(line) && currentQ) {
          const match = line.match(/^(Giải thích|Explanation)\s*[:.]\s*(.*)$/i);
          if (match) currentQ.explanation = match[2].trim();
          continue;
        }

        if (currentQ) {
          if (!currentQ.options || currentQ.options.length === 0) {
            currentQ.question += " " + line;
          } else {
            currentQ.explanation = (currentQ.explanation ? currentQ.explanation + " " : "") + line;
          }
        }
      }
      pushCurrent();

      setIsParsing(false);
      if (parsedList.length > 0) {
        setQuestions(parsedList);
        setViewMode("editor");
      } else {
        alert("Không nhận diện được định dạng câu hỏi. Vui lòng kiểm tra lại cấu trúc: Câu 1: ... A. ... B. ... Đáp án: ...");
      }
    }, 400);
  };

  // 3. GENERATE FROM MATRIX
  const handleGenerateFromMatrix = async () => {
    setIsParsing(true);
    setParsingProgress("Hệ thống đang sinh ngẫu nhiên đề thi theo ma trận phân bổ các mức độ...");
    try {
      const res = await fetch("/api/gemini/generate-matrix-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: matrixSubject,
          grade: gradeLevel,
          title: `Đề thi Ma trận: ${matrixSubject}`,
          duration: durationMinutes,
          matrix: matrixTopics,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        if (data.examTitle) setExamTitle(data.examTitle);
        setViewMode("editor");
      } else {
        alert("Không thể sinh đề từ ma trận, vui lòng thử lại!");
      }
    } catch (err: any) {
      alert("Lỗi kết nối tạo ma trận: " + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  // 4. LOAD SAMPLE TEMPLATE DIRECTLY
  const handleUseSampleTemplate = (tplKey: keyof typeof SAMPLE_TEMPLATES) => {
    const tpl = SAMPLE_TEMPLATES[tplKey];
    setPasteRawText(tpl.content);
    setExamTitle(tpl.title);
    setSelectedTemplate(null);
    setViewMode("paste");
  };

  // 5. SAVE & PUBLISH EXAM
  const handleSaveAndPublish = async () => {
    if (questions.length === 0) {
      alert("Đề thi cần có ít nhất 1 câu hỏi!");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveExam({
        title: examTitle.trim() || "Đề kiểm tra trực tuyến",
        description: `Đề thi trắc nghiệm gồm ${questions.length} câu hỏi. Thời gian làm bài: ${durationMinutes} phút.`,
        level: gradeLevel,
        moduleType: "quiz",
        questions: questions,
        durationMinutes: durationMinutes,
        targetClasses: targetClass === "Tất cả các lớp" ? classes.map((c) => c.name) : [targetClass],
        purpose: "Kiểm tra đánh giá định kỳ trực tuyến",
        submissionType: "quiz",
        maxScore: 10,
        createdAt: new Date().toISOString(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      alert("Lỗi lưu đề thi: " + (err?.message || "Lỗi không xác định"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[94vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in relative">
        {/* TOP BAR / HEADER */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            {viewMode !== "hub" && (
              <button
                type="button"
                onClick={() => setViewMode("hub")}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-bold"
                title="Quay lại Hub Tạo đề"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Tạo đề mới</span>
                {viewMode === "editor" && (
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                    Bộ soạn thảo ({questions.length} câu)
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Hệ thống số hóa đề thi thông minh, hỗ trợ nhận dạng File & Ảnh chụp đề kiểm tra Tin học
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "editor" && (
              <button
                type="button"
                onClick={handleSaveAndPublish}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{isSaving ? "Đang xuất bản..." : "Lưu & Xuất bản đề thi"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LOADING OVERLAY WHEN OCR / PARSING */}
        {isParsing && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 border-2 border-blue-200 text-blue-600 flex items-center justify-center mb-4 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-black text-slate-900 text-base mb-1">Đang phân tích đề thi</h3>
            <p className="text-xs text-slate-500 max-w-md mb-4">{parsingProgress}</p>
            <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* SAVE SUCCESS BANNER */}
        {saveSuccess && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
            <Check className="w-4 h-4" />
            <span>Xuất bản đề thi thành công! Học sinh đã có thể làm bài.</span>
          </div>
        )}

        {/* BODY CONTENT BASED ON VIEW MODE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* ========================================================================= */}
          {/* VIEW MODE 1: THE HUB (EXACT SCREENSHOT LAYOUT) */}
          {/* ========================================================================= */}
          {viewMode === "hub" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: FILE DROPZONE & TEMPLATES (7 COLS) */}
              <div className="lg:col-span-7 space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl bg-white p-8 sm:p-12 text-center transition-all cursor-pointer relative shadow-xs group ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/60 scale-[0.99]"
                      : "border-slate-200 hover:border-blue-400 hover:shadow-md"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.xlsx,.azt,.tex,.zip,.png,.jpg,.jpeg,.txt"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* Big Navy Cloud Upload Icon */}
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-50 text-[#1e2e5c] flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shadow-inner">
                    <UploadCloud className="w-12 h-12 stroke-[1.75]" />
                  </div>

                  {/* Primary Heading */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
                    Chọn File hoặc kéo thả File vào đây
                  </h3>

                  {/* Formats */}
                  <p className="text-xs sm:text-sm text-slate-500 mb-2">
                    Hỗ trợ các định dạng .pdf, .docx, .xlsx, .azt, .tex, .zip, Ảnh
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-500 mb-1 max-w-lg mx-auto leading-relaxed">
                    Có thể Upload File <strong className="text-slate-800">Bài tập</strong> ,{" "}
                    <strong className="text-slate-800">Đề thi</strong> Hoặc{" "}
                    <strong className="text-slate-800">Bảng đáp án</strong> để chấm offline.{" "}
                    <span className="text-blue-600 font-semibold hover:underline">Tìm hiểu thêm</span>
                  </p>

                  <p className="text-[11px] text-slate-400 mb-6">File ảnh chỉ hỗ trợ số hoá</p>

                  {/* Links Row */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-xs text-blue-600 font-semibold"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate({ key: "pdf", ...SAMPLE_TEMPLATES.pdf })}
                      className="hover:underline hover:text-blue-800 cursor-pointer"
                    >
                      Đề mẫu Azota Pdf
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate({ key: "docx", ...SAMPLE_TEMPLATES.docx })}
                      className="hover:underline hover:text-blue-800 cursor-pointer"
                    >
                      Đề mẫu Azota Docx
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate({ key: "excel", ...SAMPLE_TEMPLATES.excel })}
                      className="hover:underline hover:text-blue-800 cursor-pointer"
                    >
                      File Excel bảng đáp án đề Offline
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate({ key: "latex", ...SAMPLE_TEMPLATES.latex })}
                      className="hover:underline hover:text-blue-800 cursor-pointer"
                    >
                      File Latex mẫu (.tex)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate({ key: "zip", ...SAMPLE_TEMPLATES.zip })}
                      className="hover:underline hover:text-blue-800 cursor-pointer"
                    >
                      File Latex mẫu (.zip)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate({ key: "english", ...SAMPLE_TEMPLATES.english })}
                      className="hover:underline hover:text-blue-800 cursor-pointer"
                    >
                      File đề Tiếng Anh mẫu (.docx)
                    </button>
                  </div>
                </div>

                {/* Announcement Banner */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center justify-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                  <Megaphone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Azota</strong> đã hỗ trợ nhận dạng đề từ file ảnh (ảnh chụp đề hoặc viết tay)
                  </span>
                </div>
              </div>

              {/* RIGHT COLUMN: "ONLINE" CREATION OPTIONS (5 COLS) */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Accordion Header */}
                <div
                  onClick={() => setIsOnlineSectionOpen(!isOnlineSectionOpen)}
                  className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Online</h3>
                  <button type="button" className="text-slate-400">
                    {isOnlineSectionOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* 4 Options List */}
                {isOnlineSectionOpen && (
                  <div className="p-3.5 sm:p-4 space-y-3">
                    {/* Option 1: Tự soạn Đề thi / Bài tập */}
                    <div
                      onClick={() => setViewMode("paste")}
                      className="p-4 rounded-2xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer flex items-start gap-3.5 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-2xs">
                        <Edit3 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">
                          Tự soạn Đề thi / Bài tập
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Sử dụng trình soạn thảo của Azota để tạo Bài tập/Đề thi. Chỉnh sửa từ các mẫu có sẵn hoặc Copy & Paste từ các nguồn khác nhau.{" "}
                          <span className="text-blue-600 font-medium">Tìm hiểu thêm</span>
                        </p>
                      </div>
                    </div>

                    {/* Option 2: Tạo đề thi tương tác (Mới) */}
                    <div
                      onClick={() => setViewMode("interactive")}
                      className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer flex items-start gap-3.5 group relative"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                            Tạo đề thi tương tác
                          </h4>
                          <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs">
                            Mới
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Tạo đề thi, trò chơi học tập cho học sinh làm trực tiếp trên màn hình với các hoạt động sinh động giúp trải nghiệm học tập thú vị hơn
                        </p>
                      </div>
                    </div>

                    {/* Option 3: Tạo đề thi đánh giá năng lực */}
                    <div
                      onClick={() => setViewMode("competency")}
                      className="p-4 rounded-2xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all cursor-pointer flex items-start gap-3.5 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-2xs">
                        <CheckSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                          Tạo đề thi đánh giá năng lực
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Tạo ra nhiều bộ đề đánh giá năng lực từ bản thiết kế mẫu có sẵn của Azota. Giúp tối ưu hóa quy trình xây dựng đề thi.{" "}
                          <span className="text-blue-600 font-medium">Tìm hiểu thêm</span>
                        </p>
                      </div>
                    </div>

                    {/* Option 4: Tạo đề từ Ma trận đề */}
                    <div
                      onClick={() => setViewMode("matrix")}
                      className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-start gap-3.5 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                          Tạo đề từ Ma trận đề
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Azota sẽ sinh ngẫu nhiên đề mới từ các chuyên đề, số lượng câu trong mỗi chuyên đề, các mức độ khó để mà...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW MODE 2: LIVE EXAM EDITOR (CÁC CÂU HỎI ĐÃ TRÍCH XUẤT) */}
          {/* ========================================================================= */}
          {viewMode === "editor" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Questions List (8 Cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-base text-slate-900">Danh Sách Câu Hỏi Trắc Nghiệm</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tổng cộng {questions.length} câu • Điểm tối đa: {questions.reduce((acc, q) => acc + (q.points || 1), 0)}đ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newQ: QuizQuestion = {
                        id: `q-custom-${Date.now()}`,
                        question: "Câu hỏi mới...",
                        options: ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
                        correctIndex: 0,
                        explanation: "Giải thích đáp án đúng.",
                        level: "nhan_biet",
                        points: 1.0,
                      };
                      setQuestions([...questions, newQ]);
                      setEditingIndex(questions.length);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu hỏi</span>
                  </button>
                </div>

                {/* Questions Accordion / List */}
                <div className="space-y-4">
                  {questions.map((q, qIdx) => {
                    const isEditing = editingIndex === qIdx;
                    return (
                      <div
                        key={q.id || qIdx}
                        className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                              {qIdx + 1}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                              {q.level === "nhan_biet"
                                ? "Nhận biết"
                                : q.level === "thong_hieu"
                                ? "Thông hiểu"
                                : q.level === "van_dung"
                                ? "Vận dụng"
                                : "Vận dụng cao"}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">({q.points || 1} điểm)</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingIndex(isEditing ? null : qIdx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 text-xs font-semibold"
                            >
                              {isEditing ? "Đóng sửa" : "Chỉnh sửa"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQuestions(questions.filter((_, idx) => idx !== qIdx));
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Xóa câu này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question Text */}
                        {isEditing ? (
                          <textarea
                            value={q.question}
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[qIdx].question = e.target.value;
                              setQuestions(updated);
                            }}
                            className="w-full text-sm font-semibold p-3 border border-blue-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                        ) : (
                          <div className="font-bold text-slate-800 text-sm mb-3.5 leading-relaxed">{q.question}</div>
                        )}

                        {/* Options A, B, C, D */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.correctIndex === optIdx;
                            return (
                              <div
                                key={optIdx}
                                onClick={() => {
                                  if (isEditing) {
                                    const updated = [...questions];
                                    updated[qIdx].correctIndex = optIdx;
                                    setQuestions(updated);
                                  }
                                }}
                                className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 transition-all ${
                                  isCorrect
                                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold"
                                    : "bg-slate-50/60 border-slate-200 text-slate-700"
                                } ${isEditing ? "cursor-pointer hover:border-emerald-400" : ""}`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isCorrect ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </span>

                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const updated = [...questions];
                                      updated[qIdx].options[optIdx] = e.target.value;
                                      setQuestions(updated);
                                    }}
                                    className="w-full bg-white px-2 py-1 border border-slate-200 rounded-lg text-xs"
                                  />
                                ) : (
                                  <span className="flex-1">{opt}</span>
                                )}

                                {isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-auto" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                            <strong>💡 Lời giải / Hướng dẫn:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Settings & Publish (4 Cols) */}
              <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Cài Đặt Đề Thi</span>
                </h3>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tên Đề Thi</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cấp Học / Khối Lớp</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="elementary">Tiểu học (Lớp 1-5)</option>
                    <option value="middle">THCS (Lớp 6-9)</option>
                    <option value="high">THPT (Lớp 10-12)</option>
                    <option value="robotics">CLB Robotics & STEM</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Giao Cho Lớp Học</label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Tất cả các lớp">Tất cả các lớp</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Thời Gian Làm Bài (phút)</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[15, 30, 45, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          durationMinutes === mins
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {mins}p
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Đảo trật tự câu hỏi</span>
                    <input
                      type="checkbox"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Đảo trật tự phương án</span>
                    <input
                      type="checkbox"
                      checked={shuffleOptions}
                      onChange={(e) => setShuffleOptions(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Hiện lời giải sau khi nộp</span>
                    <input
                      type="checkbox"
                      checked={showExplanationAfterSubmit}
                      onChange={(e) => setShowExplanationAfterSubmit(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAndPublish}
                  disabled={isSaving}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? "Đang xuất bản..." : "Lưu & Xuất Bản Ngay"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW MODE 3: TỰ SOẠN ĐỀ THI / SMART COPY-PASTE */}
          {/* ========================================================================= */}
          {viewMode === "paste" && (
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-orange-600" />
                  <span>Trình Soạn Thảo Đề Thi Thông Minh</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Copy & Paste trực tiếp đề kiểm tra từ Microsoft Word, Google Docs hoặc sách giáo khoa. Hệ thống sẽ tự động bóc tách thành các câu trắc nghiệm.
                </p>
              </div>

              {/* Sample format hint */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Định dạng mẫu được hỗ trợ tốt nhất:</span>
                </div>
                <p className="font-mono text-[11px] text-amber-800 bg-white/80 p-2.5 rounded-xl border border-amber-200/60 mt-1">
                  Câu 1: Nội dung câu hỏi...<br />
                  A. Phương án 1<br />
                  B. Phương án 2<br />
                  C. Phương án 3<br />
                  D. Phương án 4<br />
                  Đáp án: B (hoặc Đáp án đúng: B)<br />
                  Giải thích: Lời giải thích...
                </p>
              </div>

              <textarea
                value={pasteRawText}
                onChange={(e) => setPasteRawText(e.target.value)}
                rows={12}
                placeholder="Dán toàn bộ nội dung đề thi vào đây..."
                className="w-full text-xs font-mono p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
              />

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode("hub")}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Hủy & Quay lại
                </button>

                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ Nhận diện & Tách câu hỏi tự động</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW MODE 4: TẠO ĐỀ TỪ MA TRẬN ĐỀ GDPT 2018 */}
          {/* ========================================================================= */}
          {viewMode === "matrix" && (
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-emerald-600" />
                  <span>Thiết Kế Ma Trận Đề Thi GDPT 2018</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Xác định phân bổ tỷ lệ các mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) cho từng chuyên đề trọng tâm.
                </p>
              </div>

              {/* Subject selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Môn học & Khối lớp</label>
                  <select
                    value={matrixSubject}
                    onChange={(e) => setMatrixSubject(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Tin học 6 (GDPT 2018)">Tin học 6 (Thông tin & Mạng máy tính)</option>
                    <option value="Tin học 7 (GDPT 2018)">Tin học 7 (Bảng tính & Phần mềm)</option>
                    <option value="Tin học 8 (Python)">Tin học 8 (Lập trình Python cơ bản)</option>
                    <option value="Tin học 9 (GDPT 2018)">Tin học 9 (Đa phương tiện & Robotics)</option>
                    <option value="Tin học 10 (Python nâng cao)">Tin học 10 (Thuật toán & Xâu mảng)</option>
                    <option value="Tin học 11 (C++ & Cấu trúc dữ liệu)">Tin học 11 (C++ Chuyên Tin)</option>
                    <option value="CLB Robotics Arduino">CLB Robotics (Cảm biến & Vi điều khiển)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Thời gian làm bài</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value={15}>Kiểm tra thường xuyên 15 phút (8-10 câu)</option>
                    <option value={45}>Kiểm tra giữa kỳ 45 phút (15-20 câu)</option>
                    <option value={90}>Kiểm tra cuối kỳ 90 phút (30-40 câu)</option>
                  </select>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Chuyên đề / Nội dung kiến thức</th>
                      <th className="p-3 text-center text-blue-700">Nhận biết</th>
                      <th className="p-3 text-center text-emerald-700">Thông hiểu</th>
                      <th className="p-3 text-center text-amber-700">Vận dụng</th>
                      <th className="p-3 text-center text-red-700">Vận dụng cao</th>
                      <th className="p-3 text-right">Tổng câu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {matrixTopics.map((row, idx) => {
                      const totalRow = row.nhanBiet + row.thongHieu + row.vanDung + row.vanDungCao;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-3 font-medium text-slate-900">
                            <input
                              type="text"
                              value={row.topic}
                              onChange={(e) => {
                                const updated = [...matrixTopics];
                                updated[idx].topic = e.target.value;
                                setMatrixTopics(updated);
                              }}
                              className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none font-semibold text-xs"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={row.nhanBiet}
                              onChange={(e) => {
                                const updated = [...matrixTopics];
                                updated[idx].nhanBiet = Number(e.target.value) || 0;
                                setMatrixTopics(updated);
                              }}
                              className="w-12 text-center p-1 border border-slate-200 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={row.thongHieu}
                              onChange={(e) => {
                                const updated = [...matrixTopics];
                                updated[idx].thongHieu = Number(e.target.value) || 0;
                                setMatrixTopics(updated);
                              }}
                              className="w-12 text-center p-1 border border-slate-200 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={row.vanDung}
                              onChange={(e) => {
                                const updated = [...matrixTopics];
                                updated[idx].vanDung = Number(e.target.value) || 0;
                                setMatrixTopics(updated);
                              }}
                              className="w-12 text-center p-1 border border-slate-200 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={row.vanDungCao}
                              onChange={(e) => {
                                const updated = [...matrixTopics];
                                updated[idx].vanDungCao = Number(e.target.value) || 0;
                                setMatrixTopics(updated);
                              }}
                              className="w-12 text-center p-1 border border-slate-200 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="p-3 text-right font-black text-slate-900">{totalRow} câu</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode("hub")}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Quay lại
                </button>

                <button
                  type="button"
                  onClick={handleGenerateFromMatrix}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>🎲 Sinh đề ngẫu nhiên theo ma trận</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW MODE 5: ĐỀ THI TƯƠNG TÁC / ĐÁNH GIÁ NĂNG LỰC */}
          {/* ========================================================================= */}
          {(viewMode === "interactive" || viewMode === "competency") && (
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-center">
              <div
                className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center ${
                  viewMode === "interactive" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                }`}
              >
                {viewMode === "interactive" ? <Gamepad2 className="w-8 h-8" /> : <CheckSquare className="w-8 h-8" />}
              </div>

              <div>
                <h3 className="font-black text-xl text-slate-900">
                  {viewMode === "interactive" ? "Tạo Đề Thi Tương Tác & Game Hóa" : "Tạo Đề Thi Đánh Giá Năng Lực Chuẩn Sư Phạm"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                  {viewMode === "interactive"
                    ? "Tạo không gian thi đua với âm thanh, đếm ngược thời gian và hiệu ứng gamification tăng hứng thú học tập cho học sinh."
                    : "Đo lường năng lực số hóa, tư duy giải thuật và kỹ năng giải quyết vấn đề thực tế theo khung chương trình GDPT 2018."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
                <div
                  onClick={() => {
                    setExamTitle(viewMode === "interactive" ? "Đấu Trường Trí Tuệ Python" : "Đánh Giá Năng Lực Lập Trình");
                    setViewMode("editor");
                  }}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all"
                >
                  <div className="font-bold text-slate-800 text-xs mb-1">Mẫu 1: Bộ Câu Hỏi Có Sẵn</div>
                  <div className="text-[11px] text-slate-400">Tải bộ câu hỏi mẫu vào trình biên tập để tinh chỉnh nhanh.</div>
                </div>

                <div
                  onClick={() => setViewMode("matrix")}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer transition-all"
                >
                  <div className="font-bold text-slate-800 text-xs mb-1">Mẫu 2: Phân Tầng Theo Ma Trận</div>
                  <div className="text-[11px] text-slate-400">Tự động cấu trúc 4 mức độ nhận thức theo chủ đề.</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode("hub")}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
              >
                Quay lại màn hình chính
              </button>
            </div>
          )}
        </div>

        {/* FLOATING SUPPORT BADGE (EXACT AS SCREENSHOT BOTTOM RIGHT) */}
        <div className="absolute bottom-5 right-6 z-20">
          {supportMessageOpen ? (
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-200 max-w-xs text-xs space-y-2 mb-2 animate-fade-in text-left">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-blue-600" />
                  <span>Trợ giúp tạo đề Azota</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSupportMessageOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Thầy/cô cần hướng dẫn định dạng file hoặc gặp khó khăn khi nhận dạng đề ảnh chụp? Liên hệ đội ngũ khảo thí hoặc xem tài liệu mẫu.
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setSupportMessageOpen(!supportMessageOpen)}
            className="w-12 h-12 rounded-full bg-[#0088cc] hover:bg-[#0077b5] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 group relative cursor-pointer"
            title="Trung tâm hỗ trợ khảo thí"
          >
            <Headphones className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </button>
        </div>

        {/* MODAL PREVIEW SAMPLE TEMPLATES */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-sm">{selectedTemplate.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-2xl font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-200/80 mb-4">
                {selectedTemplate.content}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([selectedTemplate.content], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = selectedTemplate.filename;
                    a.click();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file mẫu ({selectedTemplate.filename})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseSampleTemplate(selectedTemplate.key as any)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Sử dụng mẫu này ngay</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
