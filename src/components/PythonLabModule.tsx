import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import {
  UserProfile,
  ChatMessage,
  Submission,
  Lesson,
  DebugSession,
  DebugRunItem,
  AiHintItem,
  StudentReflection,
} from "../types";
import { executeCodeHybrid, PYTHON_RUNTIME_COMPATIBILITY_INFO } from "../lib/pythonRunner";
import { UgotPracticePanel } from "./UgotPracticePanel";
import { StudentSelfExplanationForm } from "./StudentSelfExplanationForm";
import {
  Play,
  RotateCcw,
  Check,
  Send,
  Sparkles,
  Terminal,
  Code2,
  Bot,
  FileCode,
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Layers,
  Calendar,
  Sliders,
  History,
  Info,
  Maximize2,
  Minimize2,
  Cpu,
  RefreshCw,
  FolderOpen,
  PenLine,
  Loader2,
  CheckCheck,
  GitCommit,
  FileEdit,
  ExternalLink,
} from "lucide-react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface PythonLabModuleProps {
  currentUser: UserProfile;
  initialLesson?: Lesson | null;
  availableLessons?: Lesson[];
  submissions?: Submission[];
  onBack?: () => void;
  onSubmitWork?: (submissionData: Partial<Submission>) => Promise<void>;
  onSelectLesson?: (lesson: Lesson | null) => void;
}

// Built-in starter reference templates for curriculum
const REFERENCE_PYTHON_TOPICS = [
  {
    id: "ref_input_output",
    title: "1. Nhập xuất cơ bản & f-string",
    category: "Cơ bản",
    code: `# Nhập tên và lớp từ bàn phím\nten = input("Nhập họ tên của bạn: ")\nlop = input("Nhập lớp học của bạn: ")\n\nprint("-" * 35)\nprint(f"Xin chào {ten} đến với CodeHiểu!")\nprint(f"Chúc bạn học tập thật tốt tại {lop}.")\nprint("-" * 35)\n`,
    sampleInput: "Nguyễn Văn An\nLớp 10A1",
    description: "Làm quen với các hàm cơ bản print(), input() và định dạng chuỗi f-string.",
  },
  {
    id: "ref_math_ops",
    title: "2. Phép toán số học (GDPT 2018)",
    category: "Số học",
    code: `# Nhập vào 2 số nguyên a và b cách nhau bởi dấu cách\na, b = map(int, input("Nhập 2 số a và b: ").split())\n\nprint(f"Tổng a + b: {a + b}")\nprint(f"Hiệu a - b: {a - b}")\nprint(f"Tích a * b: {a * b}")\nprint(f"Thương nguyên a // b: {a // b}")\nprint(f"Số dư a % b: {a % b}")\nprint(f"Lũy thừa a ** b: {a ** b}")\n`,
    sampleInput: "15 4",
    description: "Thực hành các phép toán cộng, trừ, nhân, chia nguyên, chia dư và lũy thừa.",
  },
  {
    id: "ref_if_else",
    title: "3. Cấu trúc rẽ nhánh if - elif - else",
    category: "Điều khiển",
    code: `# Xếp loại học lực theo điểm số\ndiem = float(input("Nhập điểm môn Tin học (0 - 10): "))\n\nif diem < 0 or diem > 10:\n    print("Điểm không hợp lệ!")\nelif diem >= 8.0:\n    print(f"Điểm {diem}: Xếp loại GIỎI / XUẤT SẮC 🌟")\nelif diem >= 6.5:\n    print(f"Điểm {diem}: Xếp loại KHÁ 👍")\nelif diem >= 5.0:\n    print(f"Điểm {diem}: Xếp loại TRUNG BÌNH 🎯")\nelse:\n    print(f"Điểm {diem}: Cần cố gắng ôn tập thêm 💡")\n`,
    sampleInput: "8.5",
    description: "Cấu trúc rẽ nhánh nhiều trường hợp bằng lệnh if-elif-else.",
  },
  {
    id: "ref_for_loop",
    title: "4. Vòng lặp for & hàm range()",
    category: "Vòng lặp",
    code: `# Tính tổng từ 1 đến N và in bảng cửu chương N\nn = int(input("Nhập số nguyên N: "))\n\ntong = 0\nfor i in range(1, n + 1):\n    tong += i\n\nprint(f"Tổng các số từ 1 đến {n} là: {tong}")\n\nprint(f"--- BẢNG NHÂN {n} ---")\nfor i in range(1, 11):\n    print(f"{n} x {i:2d} = {n * i:2d}")\n`,
    sampleInput: "7",
    description: "Lặp với số lần biết trước bằng for và hàm range(start, stop, step).",
  },
  {
    id: "ref_while_gcd",
    title: "5. Vòng lặp while & Thuật toán Euclid",
    category: "Thuật toán",
    code: `# Tìm Ước chung lớn nhất (UCLN) của 2 số a, b\na, b = map(int, input("Nhập 2 số nguyên a b: ").split())\norig_a, orig_b = a, b\n\nwhile b != 0:\n    r = a % b\n    a = b\n    b = r\n\nucln = a\nbcnn = (orig_a * orig_b) // ucln\nprint(f"UCLN({orig_a}, {orig_b}) = {ucln}")\nprint(f"BCNN({orig_a}, {orig_b}) = {bcnn}")\n`,
    sampleInput: "24 36",
    description: "Vòng lặp while kiểm tra điều kiện lặp cho các thuật toán cổ điển.",
  },
  {
    id: "ref_list_stats",
    title: "6. Kiểu Danh sách (List) & Thống kê",
    category: "Dữ liệu",
    code: `# Xử lý danh sách số nguyên\nnumbers = list(map(int, input("Nhập các số cách nhau bởi dấu cách: ").split()))\n\nprint(f"Danh sách: {numbers}")\nprint(f"Số lượng phần tử: {len(numbers)}")\nprint(f"Giá trị lớn nhất (Max): {max(numbers)}")\nprint(f"Giá trị nhỏ nhất (Min): {min(numbers)}")\nprint(f"Tổng các số: {sum(numbers)}")\nprint(f"Trung bình cộng: {sum(numbers) / len(numbers):.2f}")\n`,
    sampleInput: "12 45 7 89 23 45 10",
    description: "Các thao tác với mảng/danh sách: len(), max(), min(), sum(), sorted().",
  },
];

// Syntax Cheatsheet categories
const SYNTAX_CHEATSHEET = [
  {
    category: "1. Nhập / Xuất dữ liệu",
    items: [
      {
        title: "In ra màn hình (print)",
        code: `print("Xin chào học sinh!")\nprint("Giá trị a =", a)\nprint(f"Kết quả: {x + y}")  # f-string`,
        note: "Dùng f-string f\"{biến}\" để chèn giá trị trực tiếp vào chuỗi.",
      },
      {
        title: "Nhập dữ liệu (input)",
        code: `# Nhập chuỗi:\nten = input("Nhập tên: ")\n# Nhập số nguyên:\nn = int(input("Nhập số n: "))\n# Nhập số thực:\nx = float(input("Nhập số thực x: "))\n# Nhập nhiều số trên 1 dòng:\na, b = map(int, input().split())`,
        note: "Lệnh input() luôn trả về chuỗi str, cần dùng int() hoặc float() để ép kiểu.",
      },
    ],
  },
  {
    category: "2. Cấu trúc rẽ nhánh",
    items: [
      {
        title: "Lệnh if - elif - else",
        code: `if a > b:\n    print("a lớn hơn b")\nelif a == b:\n    print("a bằng b")\nelse:\n    print("a nhỏ hơn b")`,
        note: "Sau if, elif, else bắt buộc có dấu hai chấm : và khối lệnh phải thụt lề 4 dấu cách.",
      },
      {
        title: "Điều kiện kết hợp (and, or, not)",
        code: `if (x >= 0) and (x <= 100):\n    print("x trong khoảng [0, 100]")\nif a % 2 == 0 or b % 2 == 0:\n    print("Có ít nhất 1 số chẵn")`,
        note: "Dùng từ khóa tiếng Anh: and (và), or (hoặc), not (phủ định).",
      },
    ],
  },
  {
    category: "3. Cấu trúc lặp",
    items: [
      {
        title: "Vòng lặp for với range()",
        code: `# Từ 0 đến 4 (5 lần lặp):\nfor i in range(5):\n    print(i)\n\n# Từ 1 đến N (bước nhảy 1):\nfor i in range(1, n + 1):\n    print(i)\n\n# Từ 10 lùi về 1 (bước nhảy -1):\nfor i in range(10, 0, -1):\n    print(i)`,
        note: "range(start, stop) sẽ dừng lại trước giá trị stop (không bao gồm stop).",
      },
      {
        title: "Vòng lặp while",
        code: `i = 1\nwhile i <= 10:\n    print(i)\n    i += 1  # Bắt buộc tăng biến đếm để tránh lặp vô hạn`,
        note: "Hãy đảm bảo điều kiện lặp sẽ trở thành False tại một thời điểm.",
      },
    ],
  },
  {
    category: "4. Danh sách (List)",
    items: [
      {
        title: "Khai báo & Thao tác mảng",
        code: `arr = [1, 2, 3, 4, 5]\narr.append(10)      # Thêm phần tử vào cuối\nprint(len(arr))     # Độ dài mảng\nprint(arr[0])       # Phần tử đầu tiên (vị trí 0)\nprint(arr[-1])      # Phần tử cuối cùng`,
        note: "Chỉ số trong Python bắt đầu từ 0.",
      },
    ],
  },
  {
    category: "5. Các lỗi cú pháp thường gặp & Khắc phục",
    items: [
      {
        title: "IndentationError (Lỗi thụt lề)",
        code: `# SAI:\nif a > 0:\nprint("a dương")\n\n# ĐÚNG:\nif a > 0:\n    print("a dương")`,
        note: "Khối lệnh bên dưới : phải thụt vào trong bằng 4 dấu cách hoặc 1 phím Tab.",
      },
      {
        title: "SyntaxError: invalid syntax",
        code: `# Thường do thiếu dấu hai chấm : ở cuối câu lệnh if/for/while\n# Hoặc thiếu dấu đóng ngoặc đơn ()`,
        note: "Đếm số ngoặc mở và đóng, kiểm tra dấu hai chấm ở cuối dòng định nghĩa.",
      },
      {
        title: "NameError: name '...' is not defined",
        code: `# Do gọi biến trước khi gán giá trị, hoặc viết sai chính tả chữ hoa/thường`,
        note: "Python phân biệt chữ hoa và thường (tong khác Tong).",
      },
      {
        title: "ZeroDivisionError: division by zero",
        code: `# Chia cho số 0:\nif b != 0:\n    thuong = a / b\nelse:\n    print("Mẫu số phải khác 0")`,
        note: "Luôn kiểm tra mẫu số khác 0 trước phép chia.",
      },
    ],
  },
];

export const PythonLabModule: React.FC<PythonLabModuleProps> = ({
  currentUser,
  initialLesson = null,
  availableLessons = [],
  submissions = [],
  onBack,
  onSubmitWork,
  onSelectLesson,
}) => {
  // Current active lesson state: null means free practice ("Thực hành Python")
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(initialLesson || null);

  // Helper to get storage draft key
  const getDraftKey = (lessonId?: string | null) => {
    return `lms_draft_${currentUser.uid}_${lessonId || "free_python"}`;
  };

  // Initial code resolution: Draft -> Lesson starter code -> Free code
  const resolveInitialCode = (targetLesson: Lesson | null): string => {
    const draftKey = getDraftKey(targetLesson?.id);
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved !== null && saved.length > 0) return saved;
    } catch (e) {}

    if (targetLesson) {
      return (
        targetLesson.starterCode ||
        `# Bài tập: ${targetLesson.title}\n# Yêu cầu: ${targetLesson.description || "Thực hiện chương trình theo đề bài."}\n\n`
      );
    }

    return `# Thực hành Python 3\n# Nhập mã nguồn của bạn vào đây\n# Nhấn nút "Chạy" (hoặc phím Ctrl + Enter) để thực thi\n\nprint("Xin chào! Bắt đầu gõ code Python tại đây.")\n`;
  };

  const resolveInitialStdin = (targetLesson: Lesson | null): string => {
    if (targetLesson && targetLesson.testcases && targetLesson.testcases.length > 0) {
      return targetLesson.testcases[0].input || "";
    }
    return "";
  };

  // Editor states
  const [code, setCode] = useState<string>(() => resolveInitialCode(currentLesson));
  const [stdinInput, setStdinInput] = useState<string>(() => resolveInitialStdin(currentLesson));
  const [isCodeDirty, setIsCodeDirty] = useState<boolean>(false);
  const editorRef = useRef<any>(null);

  // Runtime environment: "browser" (In-browser Pyodide/Skulpt) vs "ugot" (Robot UGOT relay)
  const [activeEnvironment, setActiveEnvironment] = useState<"browser" | "ugot">("browser");

  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [execTime, setExecTime] = useState<number | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  // Bottom pane tab: "output" | "stdin" | "diary" | "explanation"
  const [bottomTab, setBottomTab] = useState<"output" | "stdin" | "diary" | "explanation">("output");

  // Resizable bottom pane height ratio: 0.38 (default 38% height)
  const [bottomPaneRatio, setBottomPaneRatio] = useState<number>(0.38);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Problem description accordion: Expanded by default for assigned lessons, collapsed for free practice
  const [isProblemExpanded, setIsProblemExpanded] = useState<boolean>(Boolean(currentLesson));

  // Lesson selector modal
  const [isLessonCatalogOpen, setIsLessonCatalogOpen] = useState<boolean>(false);

  // Cheatsheet slide-over panel
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState<boolean>(false);

  // Self-Explanation full-screen modal
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState<boolean>(false);

  // Server draft persistence status
  const [serverSaveStatus, setServerSaveStatus] = useState<"idle" | "unsaved" | "saving" | "saved" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Session & starter code references
  const starterCodeRef = useRef<string>(currentLesson?.starterCode || code);
  const sessionStartTimeRef = useRef<string>(new Date().toISOString());

  // Submit status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);
  const [missingExplanationNotice, setMissingExplanationNotice] = useState<string[] | null>(null);
  const [codeCopiedNotice, setCodeCopiedNotice] = useState<boolean>(false);
  const [cheatsheetCopiedIdx, setCheatsheetCopiedIdx] = useState<number | null>(null);
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);

  // Check if current lesson already has submission
  const existingSubmission = currentLesson
    ? submissions.find((s) => s.lessonId === currentLesson.id && (s.studentId === currentUser.uid || s.studentEmail === currentUser.email))
    : null;

  // Mobile Lab active tab: "problem" | "code" | "output" | "explanation" | "ai"
  const [mobileTab, setMobileTab] = useState<"problem" | "code" | "output" | "explanation" | "ai">("code");

  // AI Assistant states
  const [isAiOpen, setIsAiOpen] = useState<boolean>(true);
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3>(1);
  const [aiInput, setAiInput] = useState<string>("");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>(() => [
    {
      id: "ai-welcome",
      role: "assistant",
      content: currentLesson
        ? `Chào em! Thầy/cô trợ lý AI đã sẵn sàng hỗ trợ em thực hiện bài **${currentLesson.title}**. Nếu gặp lỗi cú pháp hay chưa biết cách viết logic, em cứ bấm gửi câu hỏi nhé!`
        : `Chào em! Thầy/cô trợ lý AI đã sẵn sàng đồng hành cùng em trong khu **Thực hành Python**. Em hãy chọn cấp độ gợi ý (Mức 1, 2, 3) và đặt câu hỏi khi cần hướng dẫn tư duy nhé!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const aiBottomRef = useRef<HTMLDivElement>(null);

  // Debug runs log for the diary
  const [debugRuns, setDebugRuns] = useState<DebugRunItem[]>([]);

  // Self-Explanation state (GDPT 2018 4-question metacognition model)
  const [reflection, setReflection] = useState<StudentReflection>({
    mode: "error_and_fixed",
    errorEncountered: "",
    errorReason: "",
    howFixed: "",
    verifiedWith: "",
    selectedBeforeRunId: undefined,
    selectedAfterRunId: undefined,
  });

  // Persistent server draft saving
  const saveDraftToServer = async (manual = false) => {
    const studentId = currentUser.uid;
    const lessonId = currentLesson?.id || "free";
    if (!studentId) return;

    setServerSaveStatus("saving");
    setSaveErrorMessage(null);
    try {
      const payload = {
        studentId,
        lessonId,
        code,
        stdin: stdinInput,
        reflection,
        debugRuns,
      };

      // 1. Save to server API endpoint
      let serverSaved = false;
      try {
        const res = await fetch("/api/drafts/python", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          serverSaved = true;
        }
      } catch (e) {
        console.warn("Server draft endpoint notice:", e);
      }

      // 2. Direct Firestore save
      let firestoreSaved = false;
      try {
        const draftKey = `${studentId}_${lessonId}`;
        await setDoc(doc(db, "drafts", draftKey), {
          ...payload,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        firestoreSaved = true;
      } catch (e) {
        console.warn("Firestore draft save notice:", e);
      }

      // 3. Fallback cache in localStorage
      try {
        const draftKey = getDraftKey(currentLesson?.id);
        localStorage.setItem(draftKey, code);
        localStorage.setItem(`${draftKey}_reflection`, JSON.stringify(reflection));
        localStorage.setItem(`${draftKey}_stdin`, stdinInput);
      } catch (e) {}

      if (serverSaved || firestoreSaved) {
        setServerSaveStatus("saved");
        setIsCodeDirty(false);
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastSavedTime(now);
      } else {
        throw new Error("Không thể kết nối máy chủ lưu dữ liệu. Bản nháp đang được lưu an toàn trên thiết bị.");
      }
    } catch (err: any) {
      console.error("Draft save error:", err);
      setServerSaveStatus("error");
      setSaveErrorMessage(err.message || "Lỗi lưu bản nháp.");
    }
  };

  // Debounced auto-save effect
  const autoSaveTimeoutRef = useRef<any>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    if (isInitialLoadRef.current) {
      return;
    }
    setServerSaveStatus("unsaved");
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDraftToServer(false);
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [code, stdinInput, reflection]);

  // Load draft from Server API and Firestore on mount or when switching lesson
  useEffect(() => {
    let isCancelled = false;
    const lessonId = currentLesson?.id || "free";
    const studentId = currentUser.uid;

    async function loadLatestDraft() {
      if (!studentId) return;
      try {
        // 1. Try server endpoint
        const res = await fetch(`/api/drafts/python?studentId=${encodeURIComponent(studentId)}&lessonId=${encodeURIComponent(lessonId)}`);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled && json.draft) {
            if (json.draft.code) setCode(json.draft.code);
            if (json.draft.stdin !== undefined) setStdinInput(json.draft.stdin);
            if (json.draft.reflection) setReflection(json.draft.reflection);
            if (Array.isArray(json.draft.debugRuns) && json.draft.debugRuns.length > 0) {
              setDebugRuns(json.draft.debugRuns);
            }
            setServerSaveStatus("saved");
            setLastSavedTime(new Date(json.draft.updatedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
            setTimeout(() => { isInitialLoadRef.current = false; }, 300);
            return;
          }
        }
      } catch (e) {
        console.warn("Server draft load notice:", e);
      }

      // 2. Direct Firestore fallback
      try {
        const draftKey = `${studentId}_${lessonId}`;
        const snap = await getDoc(doc(db, "drafts", draftKey));
        if (!isCancelled && snap.exists()) {
          const draft = snap.data();
          if (draft.code) setCode(draft.code);
          if (draft.stdin !== undefined) setStdinInput(draft.stdin);
          if (draft.reflection) setReflection(draft.reflection);
          if (Array.isArray(draft.debugRuns)) setDebugRuns(draft.debugRuns);
          setServerSaveStatus("saved");
          setLastSavedTime(new Date(draft.updatedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          setTimeout(() => { isInitialLoadRef.current = false; }, 300);
          return;
        }
      } catch (e) {}

      // 3. Fallback to localStorage
      try {
        const draftKey = getDraftKey(currentLesson?.id);
        const savedCode = localStorage.getItem(draftKey);
        const savedRef = localStorage.getItem(`${draftKey}_reflection`);
        if (savedCode) setCode(savedCode);
        if (savedRef) setReflection(JSON.parse(savedRef));
      } catch (e) {}

      setTimeout(() => { isInitialLoadRef.current = false; }, 300);
    }

    loadLatestDraft();
    return () => {
      isCancelled = true;
    };
  }, [currentLesson?.id, currentUser.uid]);

  // Switch lesson with automatic draft save to prevent code loss
  const handleSwitchToLesson = (newLesson: Lesson | null) => {
    // 1. Auto save draft for current lesson before switching
    saveDraftToServer(true);

    // 2. Set new lesson
    setCurrentLesson(newLesson);
    starterCodeRef.current = newLesson?.starterCode || "";
    sessionStartTimeRef.current = new Date().toISOString();
    if (onSelectLesson) onSelectLesson(newLesson);

    // 3. Load draft or starter code for new lesson
    const nextCode = resolveInitialCode(newLesson);
    const nextStdin = resolveInitialStdin(newLesson);
    setCode(nextCode);
    setStdinInput(nextStdin);
    setIsCodeDirty(false);
    setConsoleOutput("");
    setIsError(false);
    setSubmitSuccessMsg(null);
    setIsProblemExpanded(Boolean(newLesson));

    // Reset reflection
    setReflection({
      mode: "error_and_fixed",
      errorEncountered: "",
      errorReason: "",
      howFixed: "",
      verifiedWith: "",
      selectedBeforeRunId: undefined,
      selectedAfterRunId: undefined,
    });

    // Reset AI greeting for new problem
    setAiMessages([
      {
        id: `ai-greet-${Date.now()}`,
        role: "assistant",
        content: newLesson
          ? `Đã chuyển sang bài **${newLesson.title}**. Em hãy đọc kỹ đề bài, bắt đầu viết chương trình và ghi lại quá trình tự giải thích nhé!`
          : `Đã chuyển sang chế độ **Thực hành Python tự do**. Em có thể tự do viết mã lệnh, tra cứu sổ tay cú pháp hoặc tự rút kinh nghiệm.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setIsLessonCatalogOpen(false);
  };

  // Save draft explicitly
  const handleSaveDraft = () => {
    saveDraftToServer(true);
  };

  // Run Code
  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setConsoleOutput("");
    setIsError(false);
    setBottomTab("output");
    setMobileTab("output");

    const startTime = Date.now();
    try {
      const res = await executeCodeHybrid({
        language: "python",
        code,
        stdin: stdinInput,
      });
      const elapsed = Date.now() - startTime;
      setExecTime(elapsed);

      if (res.error) {
        setIsError(true);
        setConsoleOutput(res.error);
        setDebugRuns((prev) => [
          ...prev,
          {
            id: `run-${Date.now()}-${prev.length + 1}`,
            timestamp: new Date().toLocaleTimeString(),
            code,
            stdin: stdinInput,
            output: "",
            error: res.error,
            timeMs: elapsed,
            passed: false,
          },
        ]);
      } else {
        setIsError(false);
        setConsoleOutput(res.output || "(Chương trình đã thực thi thành công nhưng không in ra kết quả)");
        setDebugRuns((prev) => [
          ...prev,
          {
            id: `run-${Date.now()}-${prev.length + 1}`,
            timestamp: new Date().toLocaleTimeString(),
            code,
            stdin: stdinInput,
            output: res.output || "",
            timeMs: elapsed,
            passed: true,
          },
        ]);
      }
    } catch (err: any) {
      setIsError(true);
      setConsoleOutput(err?.message || "Lỗi thực thi chương trình.");
    } finally {
      setIsRunning(false);
    }
  };

  // Stop Execution
  const handleStopCode = () => {
    setIsRunning(false);
    setConsoleOutput((prev) => prev + "\n\n⏹️ [Đã dừng thực thi theo yêu cầu của người dùng]");
  };

  // Submit Work (Only for assigned lesson)
  const handleSubmitAssignment = async () => {
    if (!currentLesson) return;
    if (!onSubmitWork) return;

    // Requirement 5: Check if teacher required self-explanation
    if (currentLesson.requireSelfExplanation) {
      const missingFields: string[] = [];
      if (!reflection.errorEncountered?.trim()) {
        missingFields.push("1. Em phát hiện lỗi hoặc vấn đề gì?");
      }
      if (!reflection.errorReason?.trim()) {
        missingFields.push("2. Theo em, nguyên nhân là gì?");
      }
      if (!reflection.howFixed?.trim()) {
        missingFields.push("3. Em đã sửa như thế nào?");
      }
      if (!reflection.verifiedWith?.trim()) {
        missingFields.push("4. Em đã kiểm tra lại bằng dữ liệu nào và kết quả ra sao?");
      }

      if (missingFields.length > 0) {
        // Keep code and draft intact & persist to server
        handleSaveDraft();
        setMissingExplanationNotice(missingFields);
        setBottomTab("explanation");
        setMobileTab("explanation");
        setIsExplanationModalOpen(true);
        return;
      }
    }

    setSubmitErrorMsg(null);
    setMissingExplanationNotice(null);
    setIsSubmitting(true);
    try {
      // Auto-save draft first
      handleSaveDraft();

      const finalReflection: StudentReflection = {
        mode: reflection.mode || "error_and_fixed",
        errorEncountered: (reflection.errorEncountered || "").trim(),
        errorReason: (reflection.errorReason || "").trim(),
        howFixed: (reflection.howFixed || "").trim(),
        verifiedWith: (reflection.verifiedWith || "").trim(),
        selectedBeforeRunId: reflection.selectedBeforeRunId || undefined,
        selectedAfterRunId: reflection.selectedAfterRunId || undefined,
        updatedAt: new Date().toISOString(),
      };

      await onSubmitWork({
        id: existingSubmission?.id || `sub-${Date.now()}`,
        lessonId: currentLesson.id,
        lessonTitle: currentLesson.title,
        studentId: currentUser.uid,
        studentName: currentUser.displayName,
        studentEmail: currentUser.email,
        moduleType: "coding",
        content: {
          code,
          language: "python",
          stdin: stdinInput,
          consoleOutput,
          debugSession: {
            sessionId: `session-${Date.now()}`,
            studentId: currentUser.uid,
            studentName: currentUser.displayName,
            studentCode: currentUser.studentCode,
            lessonId: currentLesson.id,
            lessonTitle: currentLesson.title,
            startedAt: sessionStartTimeRef.current || new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            initialCode: starterCodeRef.current || currentLesson.starterCode || "",
            finalCode: code,
            runs: debugRuns,
            hints: [],
            reflection: finalReflection,
          },
        },
        status: "submitted",
        score: null,
        maxScore: currentLesson.maxScore ?? 10,
        submittedAt: new Date().toISOString(),
      });

      setSubmitSuccessMsg(`🎉 Đã nộp bài và lời giải thích thành công! Thầy cô sẽ xem minh chứng và phản hồi kết quả cho em.`);
    } catch (err: any) {
      alert("Lỗi khi nộp bài: " + (err.message || "Vui lòng kiểm tra lại kết nối mạng!"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ask AI Tutor
  const handleSendAi = async (customPrompt?: string) => {
    const textToSend = customPrompt || aiInput.trim();
    if (!textToSend || isAiThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setAiInput("");
    setIsAiThinking(true);

    setTimeout(() => {
      aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const problemContext = currentLesson
        ? `Đề bài: ${currentLesson.title}\nYêu cầu: ${currentLesson.description || ""}`
        : "Chế độ thực hành tự do Python 3";

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          codeContext: code,
          language: "python",
          consoleOutput: consoleOutput || undefined,
          stdin: stdinInput || undefined,
          hintLevel,
          studentId: currentUser.uid,
          allowFallback: true,
          history: aiMessages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Phản hồi máy chủ không hợp lệ.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Lỗi máy chủ (${res.status})`);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.text || "Thầy/cô đang sẵn sàng giải đáp, em hãy thử hỏi cụ thể hơn nhé!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setAiMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ ${err.message || "Kết nối Gia sư AI tạm thời gián đoạn. Bạn hãy thử kiểm tra lại cú pháp hoặc thử lại sau vài giây!"}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setAiMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiThinking(false);
      setTimeout(() => {
        aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
  };

  // Resize split pane divider
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const container = document.getElementById("python-workspace-container");
    if (!container) return;
    const containerHeight = container.getBoundingClientRect().height;
    const startRatio = bottomPaneRatio;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newRatio = Math.max(0.2, Math.min(0.75, startRatio - deltaY / containerHeight));
      setBottomPaneRatio(newRatio);
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (editorRef.current) {
        editorRef.current.layout();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. TOP HEADER (Super Compact & Clean) */}
      <header className="h-12 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between gap-2 shrink-0 z-20">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>
          )}

          {/* Current Problem Name */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-[260px] md:max-w-[340px]">
              {currentLesson ? currentLesson.title : "Thực hành Python"}
            </h1>
            {!currentLesson ? (
              <span className="hidden md:inline text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-sm">
                Tự do
              </span>
            ) : (
              <span className="hidden md:inline text-[10px] text-blue-400 bg-blue-950/80 border border-blue-800/60 px-1.5 py-0.5 rounded-sm">
                Bài tập được giao
              </span>
            )}
          </div>

          {/* Lesson Catalog Button */}
          <button
            type="button"
            onClick={() => setIsLessonCatalogOpen(true)}
            className="h-8 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-700/60"
            title="Đổi bài tập hoặc chuyển sang thực hành tự do"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Chọn bài</span>
          </button>
        </div>

        {/* Center: Main Primary Actions (Run, Stop, Save, Submit) */}
        <div className="flex items-center gap-1.5">
          {/* Run / Stop Button */}
          {!isRunning ? (
            <button
              type="button"
              onClick={handleRunCode}
              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Chạy chương trình (Ctrl + Enter)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Chạy</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopCode}
              className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs animate-pulse"
              title="Dừng chạy chương trình"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Dừng</span>
            </button>
          )}

          {/* Self-Explanation Quick Button */}
          <button
            type="button"
            onClick={() => {
              setBottomTab("explanation");
              setMobileTab("explanation");
            }}
            className="h-8 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Mở biểu mẫu Tự giải thích quá trình sửa lỗi"
          >
            <PenLine className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Viết giải thích</span>
            <span className="sm:hidden">Giải thích</span>
          </button>

          {/* Save Draft on Server */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={serverSaveStatus === "saving"}
            className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer border ${
              serverSaveStatus === "saved"
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-700 hover:bg-emerald-900/60"
                : serverSaveStatus === "saving"
                ? "bg-blue-950/60 text-blue-300 border-blue-700"
                : serverSaveStatus === "error"
                ? "bg-rose-950/60 text-rose-300 border-rose-700 hover:bg-rose-900/60"
                : isCodeDirty
                ? "bg-slate-800 text-amber-300 border-amber-600/40 hover:bg-slate-700"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
            }`}
            title="Lưu bản nháp mã nguồn và lời giải thích lên máy chủ"
          >
            {serverSaveStatus === "saved" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Đã lưu máy chủ</span>
                <span className="md:hidden">Đã lưu</span>
              </>
            ) : serverSaveStatus === "saving" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span className="hidden md:inline">Đang lưu...</span>
              </>
            ) : serverSaveStatus === "error" ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline">Lưu lỗi (Thử lại)</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Lưu nháp</span>
              </>
            )}
          </button>

          {/* Submit Button (ONLY SHOWN FOR ASSIGNED LESSONS as per Requirement 2) */}
          {currentLesson && onSubmitWork && (
            <button
              type="button"
              onClick={handleSubmitAssignment}
              disabled={isSubmitting}
              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="Nộp bài và lời giải thích cho giáo viên"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Nộp bài</span>
            </button>
          )}

          {/* Cheatsheet Toggle */}
          <button
            type="button"
            onClick={() => setIsCheatsheetOpen(true)}
            className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer border border-slate-700"
            title="Mở Sổ tay cú pháp Python"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Sổ tay cú pháp</span>
          </button>
        </div>

        {/* Right: AI Tutor Toggle & Environment */}
        <div className="flex items-center gap-1.5">
          {/* UGOT Robot practice mode toggle */}
          <button
            type="button"
            onClick={() => setActiveEnvironment(activeEnvironment === "browser" ? "ugot" : "browser")}
            className={`h-8 px-2 rounded-lg text-xs font-medium transition-colors hidden md:flex items-center gap-1 cursor-pointer border ${
              activeEnvironment === "ugot"
                ? "bg-purple-950 text-purple-300 border-purple-700"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title="Chuyển chế độ Robot UGOT / Python Web"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>UGOT</span>
          </button>

          {/* AI Tutor Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setIsAiOpen(!isAiOpen);
              if (mobileTab === "ai") setMobileTab("code");
            }}
            className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
              isAiOpen
                ? "bg-blue-600 text-white border-blue-500 shadow-xs"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
            }`}
            title="Bật/Tắt Gia sư AI"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gia sư AI</span>
          </button>
        </div>
      </header>

      {/* MOBILE TAB BAR (<768px: [Đề bài] [Mã nguồn] [Kết quả] [Tự giải thích] [Gia sư AI]) */}
      <div className="md:hidden h-10 bg-slate-950 border-b border-slate-800 grid grid-cols-5 px-1.5 gap-1 shrink-0 z-10 text-xs font-medium">
        <button
          type="button"
          onClick={() => setMobileTab("problem")}
          className={`py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
            mobileTab === "problem"
              ? "bg-slate-800 text-white font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Đề</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("code")}
          className={`py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
            mobileTab === "code"
              ? "bg-slate-800 text-white font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Mã</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setBottomTab("output");
            setMobileTab("output");
          }}
          className={`py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer relative ${
            mobileTab === "output" && bottomTab === "output"
              ? "bg-slate-800 text-white font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Kết quả</span>
          {isError && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-2 right-2" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setBottomTab("explanation");
            setMobileTab("explanation");
          }}
          className={`py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer relative ${
            mobileTab === "explanation" || bottomTab === "explanation"
              ? "bg-amber-600/30 text-amber-300 font-semibold border border-amber-500/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <PenLine className="w-3.5 h-3.5" />
          <span>Giải thích</span>
          {reflection.errorEncountered && reflection.howFixed && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-2 right-1.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("ai")}
          className={`py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
            mobileTab === "ai"
              ? "bg-blue-600 text-white font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Gia sư</span>
        </button>
      </div>

      {/* Submission Success Alert */}
      {submitSuccessMsg && (
        <div className="bg-emerald-950 border-b border-emerald-800 px-4 py-2 text-xs text-emerald-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{submitSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div
        id="python-workspace-container"
        className="flex-1 min-h-0 w-full flex flex-col md:flex-row overflow-hidden relative"
      >
        {/* LEFT COLUMN: Code Area & Results (Full width or split with AI on desktop) */}
        <div
          className={`flex-1 min-h-0 flex flex-col bg-slate-900 border-r border-slate-800 overflow-hidden ${
            mobileTab === "ai" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* A. COLLAPSIBLE PROBLEM DESCRIPTION STRIP */}
          {currentLesson && (
            <div className={`border-b border-slate-800 bg-slate-950/80 transition-all ${
              mobileTab === "problem" ? "block" : "hidden md:block"
            }`}>
              <div
                onClick={() => setIsProblemExpanded(!isProblemExpanded)}
                className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    Đề bài:
                  </span>
                  <span className="text-xs text-slate-200 font-medium truncate">
                    {currentLesson.title}
                  </span>
                  {currentLesson.dueDate && (
                    <span className="hidden sm:inline text-[11px] text-slate-400">
                      (Hạn: {new Date(currentLesson.dueDate).toLocaleDateString("vi-VN")})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-md"
                  aria-label="Thu gọn đề bài"
                >
                  {isProblemExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded Problem Details */}
              {isProblemExpanded && (
                <div className="px-3 pb-3 pt-1 text-xs text-slate-300 max-h-48 overflow-y-auto space-y-2 border-t border-slate-800/60 bg-slate-950/40">
                  <div className="leading-relaxed whitespace-pre-line text-slate-300">
                    {currentLesson.description || "Thực hiện chương trình Python theo yêu cầu của bài tập."}
                  </div>

                  {currentLesson.testcases && currentLesson.testcases.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Ví dụ mẫu:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="bg-slate-900 p-2 rounded-md border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase font-sans">Đầu vào mẫu:</span>
                          <span className="text-emerald-300 whitespace-pre">{currentLesson.testcases[0].input || "(Trống)"}</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-md border border-slate-800">
                          <span className="text-slate-400 block text-[10px] uppercase font-sans">Đầu ra mong đợi:</span>
                          <span className="text-blue-300 whitespace-pre">{currentLesson.testcases[0].expectedOutput}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* B. CODE EDITOR AREA */}
          <div
            className={`min-h-0 w-full relative ${
              mobileTab === "problem" || mobileTab === "output" || mobileTab === "explanation" ? "hidden md:flex flex-col" : "flex flex-col"
            }`}
            style={{
              height: window.innerWidth >= 768 ? `${(1 - bottomPaneRatio) * 100}%` : "100%",
            }}
          >
            {/* Editor Toolbar Strip */}
            <div className="h-7 bg-slate-950/70 border-b border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-300">main.py</span>
                {isCodeDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Chưa lưu" />}
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-slate-500">Ctrl + Enter: Chạy</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    alert("Đã sao chép mã nguồn vào clipboard!");
                  }}
                  className="hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Sao chép toàn bộ mã"
                >
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">Sao chép</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor Component */}
            <div className="flex-1 min-h-0 w-full bg-slate-900">
              <Editor
                height="100%"
                language="python"
                theme="vs-dark"
                value={code}
                onChange={(val) => {
                  setCode(val || "");
                  setIsCodeDirty(true);
                }}
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.addCommand(2048 | 3, () => {
                    handleRunCode();
                  });
                }}
                options={{
                  fontSize: 14,
                  lineNumbers: "on",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: "on",
                  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
                  renderWhitespace: "selection",
                  smoothScrolling: true,
                }}
              />
            </div>
          </div>

          {/* C. RESIZABLE DIVIDER (Desktop only) */}
          <div
            onMouseDown={handleMouseDownResize}
            className="hidden md:flex h-2 bg-slate-950 hover:bg-blue-600/60 active:bg-blue-600 cursor-row-resize items-center justify-center shrink-0 border-y border-slate-800 transition-colors z-10"
            title="Kéo để điều chỉnh chiều cao giữa trình soạn thảo và bảng kết quả"
          >
            <div className="w-8 h-0.5 bg-slate-600 rounded-full" />
          </div>

          {/* D. BOTTOM CONSOLE / RESULTS AREA */}
          <div
            className={`min-h-0 w-full bg-slate-950 flex flex-col ${
              mobileTab === "output" || mobileTab === "explanation" ? "flex flex-1" : mobileTab === "problem" || mobileTab === "code" ? "hidden md:flex" : "hidden md:flex"
            }`}
            style={{
              height: window.innerWidth >= 768 ? `${bottomPaneRatio * 100}%` : "100%",
            }}
          >
            {/* Bottom Tabs Bar */}
            <div className="h-9 bg-slate-950 border-b border-slate-800 px-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setBottomTab("output")}
                  className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    bottomTab === "output"
                      ? "bg-slate-900 text-white border-t-2 border-blue-500"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Kết quả</span>
                  {execTime !== null && (
                    <span className="text-[10px] text-slate-500 font-mono">({execTime}ms)</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setBottomTab("stdin")}
                  className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    bottomTab === "stdin"
                      ? "bg-slate-900 text-white border-t-2 border-blue-500"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Dữ liệu vào (input)</span>
                  {stdinInput && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setBottomTab("diary")}
                  className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    bottomTab === "diary"
                      ? "bg-slate-900 text-white border-t-2 border-blue-500"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Nhật ký ({debugRuns.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBottomTab("explanation")}
                  className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    bottomTab === "explanation"
                      ? "bg-slate-900 text-white border-t-2 border-amber-500"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tự giải thích</span>
                  {reflection.errorEncountered && reflection.howFixed ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Đã có nội dung giải thích" />
                  ) : (
                    <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/80 px-1 rounded-sm">
                      Cần viết
                    </span>
                  )}
                </button>
              </div>

              {/* Right controls for console */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBottomTab("explanation");
                    setMobileTab("explanation");
                  }}
                  className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                  title="Mở biểu mẫu tự giải thích quá trình sửa lỗi"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Viết giải thích</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExplanationModalOpen(true)}
                  className="text-[11px] text-amber-300 hover:text-white px-2 py-1 rounded-md hover:bg-slate-800 cursor-pointer flex items-center gap-1 border border-amber-500/30"
                  title="Phóng to biểu mẫu tự giải thích toàn màn hình"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Phóng to</span>
                </button>

                {consoleOutput && bottomTab === "output" && (
                  <button
                    type="button"
                    onClick={() => setConsoleOutput("")}
                    className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded-md hover:bg-slate-850 cursor-pointer"
                  >
                    Xóa kết quả
                  </button>
                )}
                {/* Ratio presets */}
                <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-500">
                  <button
                    type="button"
                    onClick={() => setBottomPaneRatio(0.25)}
                    className="hover:text-slate-300 px-1"
                    title="Thu nhỏ bảng kết quả"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBottomPaneRatio(0.4)}
                    className="hover:text-slate-300 px-1"
                    title="Mặc định bảng kết quả"
                  >
                    40%
                  </button>
                  <button
                    type="button"
                    onClick={() => setBottomPaneRatio(0.6)}
                    className="hover:text-slate-300 px-1"
                    title="Mở rộng bảng kết quả"
                  >
                    60%
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Content Area */}
            <div className="flex-1 min-h-0 bg-slate-900 p-3 overflow-y-auto font-mono text-xs select-text">
              {/* Tab 1: Output */}
              {bottomTab === "output" && (
                <div className="h-full">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-slate-400 pt-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Đang thực thi chương trình Python...</span>
                    </div>
                  ) : consoleOutput ? (
                    <div
                      className={`whitespace-pre-wrap leading-relaxed ${
                        isError ? "text-rose-400" : "text-emerald-300"
                      }`}
                    >
                      {consoleOutput}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic pt-2">
                      Nhấn nút "Chạy" hoặc tổ hợp phím [Ctrl + Enter] để thực thi mã nguồn. Kết quả chương trình sẽ xuất hiện tại đây.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Standard Input (stdin) */}
              {bottomTab === "stdin" && (
                <div className="h-full flex flex-col">
                  <label className="text-[11px] text-slate-400 font-sans mb-1 block">
                    Dữ liệu nhập chuẩn cho các lệnh <code className="text-blue-300">input()</code> (mỗi lần input tương ứng một dòng):
                  </label>
                  <textarea
                    value={stdinInput}
                    onChange={(e) => setStdinInput(e.target.value)}
                    placeholder="Ví dụ:&#10;15 4&#10;Học sinh Nguyễn Văn An"
                    className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono text-xs placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              )}

              {/* Tab 3: Debug History */}
              {bottomTab === "diary" && (
                <div className="h-full space-y-3 font-sans text-xs">
                  {debugRuns.length === 0 ? (
                    <p className="text-slate-500 italic">
                      Chưa có lượt chạy nào trong phiên này. Mỗi lần bạn nhấn "Chạy", nhật ký sẽ tự động lưu lại mã nguồn và lỗi tương ứng để giúp bạn tự rút kinh nghiệm.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {debugRuns.slice(-8).reverse().map((run, idx) => (
                        <div
                          key={run.id || idx}
                          className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-start justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-300">
                                Lần {debugRuns.length - idx} ({run.timestamp})
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-sm ${
                                  run.passed
                                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                    : "bg-rose-950 text-rose-400 border border-rose-800"
                                }`}
                              >
                                {run.passed ? "Thành công" : "Có lỗi"}
                              </span>
                            </div>
                            {run.error ? (
                              <p className="font-mono text-[11px] text-rose-400 mt-1 line-clamp-2">
                                {run.error}
                              </p>
                            ) : (
                              <p className="font-mono text-[11px] text-slate-400 mt-1 line-clamp-1">
                                {run.output ? run.output.slice(0, 100) : "Thành công"}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Bạn có muốn hoàn tác mã nguồn về lần chạy này?")) {
                                setCode(run.code);
                              }
                            }}
                            className="text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer shrink-0"
                          >
                            Khôi phục mã
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Self-Explanation Form */}
              {bottomTab === "explanation" && (
                <div className="h-full">
                  <StudentSelfExplanationForm
                    reflection={reflection}
                    onChangeReflection={setReflection}
                    debugRuns={debugRuns}
                    serverSaveStatus={serverSaveStatus}
                    lastSavedTime={lastSavedTime}
                    saveErrorMessage={saveErrorMessage}
                    onSaveManual={() => saveDraftToServer(true)}
                    onSubmitAssignment={handleSubmitAssignment}
                    canSubmit={Boolean(currentLesson && onSubmitWork)}
                    isSubmitting={isSubmitting}
                    isModal={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI TUTOR PANEL (Desktop fixed 380px or mobile sheet) */}
        <div
          className={`${
            mobileTab === "ai"
              ? "flex flex-1"
              : isAiOpen
              ? "hidden md:flex w-full md:w-[380px] lg:w-[400px]"
              : "hidden"
          } flex-col bg-slate-950 border-l border-slate-800 shrink-0 z-10 overflow-hidden`}
        >
          {/* AI Header */}
          <div className="h-10 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-white">Gia sư AI CodeHiểu</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAiOpen(false);
                if (mobileTab === "ai") setMobileTab("code");
              }}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md"
              title="Đóng bảng AI"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* AI Hint Level Selector (Requirement 4: 3 Levels) */}
          <div className="p-2.5 bg-slate-900/60 border-b border-slate-800 shrink-0">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              Cấp độ hướng dẫn Socratic:
            </span>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setHintLevel(1)}
                className={`py-1.5 px-2 rounded-md font-medium transition-colors text-center cursor-pointer ${
                  hintLevel === 1
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Mức 1: Đặt câu hỏi dẫn dắt học sinh tự quan sát"
              >
                Mức 1 (Gợi mở)
              </button>
              <button
                type="button"
                onClick={() => setHintLevel(2)}
                className={`py-1.5 px-2 rounded-md font-medium transition-colors text-center cursor-pointer ${
                  hintLevel === 2
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Mức 2: Chỉ rõ vị trí và giải thích nguyên nhân lỗi"
              >
                Mức 2 (Vị trí lỗi)
              </button>
              <button
                type="button"
                onClick={() => setHintLevel(3)}
                className={`py-1.5 px-2 rounded-md font-medium transition-colors text-center cursor-pointer ${
                  hintLevel === 3
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Mức 3: Giải thích nguyên lý & ví dụ tương tự"
              >
                Mức 3 (Ví dụ mẫu)
              </button>
            </div>
          </div>

          {/* Quick Guidance Prompts */}
          {isError && (
            <div className="p-2 bg-rose-950/40 border-b border-rose-900/50 shrink-0 flex items-center justify-between">
              <span className="text-[11px] text-rose-300 truncate">
                Chương trình vừa gặp lỗi khi chạy.
              </span>
              <button
                type="button"
                onClick={() => handleSendAi(`Em đang gặp lỗi trong chương trình. Nhờ thầy/cô hướng dẫn theo Mức ${hintLevel}!`)}
                className="text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-900/80 px-2 py-0.5 rounded-md cursor-pointer shrink-0"
              >
                Nhờ AI phân tích lỗi →
              </button>
            </div>
          )}

          {/* Chat Messages Log */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 select-text">
            {aiMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none prose-invert"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isAiThinking && (
              <div className="flex items-center gap-2 text-xs text-blue-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Gia sư AI đang đọc mã nguồn và phân tích gợi ý...</span>
              </div>
            )}
            <div ref={aiBottomRef} />
          </div>

          {/* Chat Input Box (Fixed at bottom, keyboard safe) */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAi();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Hỏi gia sư AI về lỗi hoặc thuật toán..."
                disabled={isAiThinking}
                className="flex-1 h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!aiInput.trim() || isAiThinking}
                className="h-9 w-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer disabled:opacity-40 shrink-0"
                title="Gửi câu hỏi"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. LESSON CATALOG MODAL (Choose from Teacher Assignments or Free Practice) */}
      {isLessonCatalogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">Danh mục bài thực hành Python</h2>
                <p className="text-xs text-slate-400">Chọn bài được giao hoặc chuyển sang thực hành tự do</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLessonCatalogOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
              {/* Option 1: Free Practice */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Chế độ tự do
                </span>
                <div
                  onClick={() => handleSwitchToLesson(null)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    currentLesson === null
                      ? "bg-blue-950/50 border-blue-600 text-white"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div>
                    <h3 className="text-xs font-semibold">Thực hành Python tự do</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Khung soạn thảo tự do, không ràng buộc đề bài hay nộp bài.
                    </p>
                  </div>
                  {currentLesson === null && <Check className="w-4 h-4 text-blue-400" />}
                </div>
              </div>

              {/* Option 2: Teacher Assigned Lessons */}
              {availableLessons.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Bài tập giáo viên giao ({availableLessons.length})
                  </span>
                  <div className="space-y-2">
                    {availableLessons.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => handleSwitchToLesson(l)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          currentLesson?.id === l.id
                            ? "bg-blue-950/50 border-blue-600 text-white"
                            : "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <h3 className="text-xs font-semibold truncate">{l.title}</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {l.description || "Bài tập lập trình Python"}
                          </p>
                        </div>
                        {currentLesson?.id === l.id && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Option 3: Reference Curriculum Topics */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Chủ đề mẫu GDPT 2018 tham khảo
                </span>
                <div className="space-y-2">
                  {REFERENCE_PYTHON_TOPICS.map((ref) => (
                    <div
                      key={ref.id}
                      onClick={() => {
                        const tempLesson: Lesson = {
                          id: ref.id,
                          title: ref.title,
                          description: ref.description,
                          starterCode: ref.code,
                          level: "middle",
                          moduleType: "coding",
                          durationMinutes: 45,
                          createdAt: new Date().toISOString(),
                        };
                        handleSwitchToLesson(tempLesson);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        currentLesson?.id === ref.id
                          ? "bg-blue-950/50 border-blue-600 text-white"
                          : "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-blue-400 block">{ref.category}</span>
                        <h4 className="text-xs font-semibold truncate">{ref.title}</h4>
                      </div>
                      {currentLesson?.id === ref.id && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SYNTAX CHEATSHEET SLIDE-OVER (Requirement 2) */}
      {isCheatsheetOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col p-4 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Sổ tay cú pháp Python 3</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCheatsheetOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 select-text">
              {SYNTAX_CHEATSHEET.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    {cat.category}
                  </h3>
                  <div className="space-y-2">
                    {cat.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="bg-slate-950 p-2.5 rounded-xl border border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.code);
                              alert("Đã sao chép đoạn mã!");
                            }}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Chép</span>
                          </button>
                        </div>
                        <pre className="font-mono text-[11px] bg-slate-900 p-2 rounded-md text-emerald-300 overflow-x-auto whitespace-pre">
                          {item.code}
                        </pre>
                        {item.note && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal italic">
                            💡 {item.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. SELF-EXPLANATION EXPANDED MODAL (For distraction-free full writing) */}
      {isExplanationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <StudentSelfExplanationForm
                reflection={reflection}
                onChangeReflection={setReflection}
                debugRuns={debugRuns}
                serverSaveStatus={serverSaveStatus}
                lastSavedTime={lastSavedTime}
                saveErrorMessage={saveErrorMessage}
                onSaveManual={() => saveDraftToServer(true)}
                onSubmitAssignment={handleSubmitAssignment}
                canSubmit={Boolean(currentLesson && onSubmitWork)}
                isSubmitting={isSubmitting}
                isModal={true}
                onCloseModal={() => setIsExplanationModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
