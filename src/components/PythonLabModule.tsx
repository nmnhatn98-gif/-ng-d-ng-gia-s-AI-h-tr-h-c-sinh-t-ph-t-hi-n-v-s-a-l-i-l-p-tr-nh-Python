import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { 
  UserProfile, 
  ChatMessage, 
  Submission, 
  DebugSession, 
  DebugRunItem, 
  AiHintItem, 
  StudentReflection 
} from "../types";
import { executeCodeHybrid, PYTHON_RUNTIME_COMPATIBILITY_INFO } from "../lib/pythonRunner";
import { 
  Play, 
  RotateCcw, 
  Download, 
  Copy, 
  Check, 
  Send, 
  Sparkles, 
  Terminal, 
  Code2, 
  Bot, 
  FileCode, 
  Trash2, 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  HelpCircle,
  Zap,
  Save,
  Info,
  RefreshCw,
  MessageSquare,
  ListChecks,
  History,
  ShieldAlert,
  ArrowRight,
  X
} from "lucide-react";

interface PythonLabModuleProps {
  currentUser: UserProfile;
  onBack?: () => void;
  onSubmitWork?: (submissionData: Partial<Submission>) => Promise<void>;
}

// Built-in starter templates for Python learners
const PYTHON_TEMPLATES: Record<string, {
  name: string;
  category: string;
  description: string;
  code: string;
  sampleInput: string;
}> = {
  hello_world: {
    name: "1. Xin chào & Nhập xuất cơ bản",
    category: "Cơ bản",
    description: "Làm quen hàm print(), input() và định dạng chuỗi f-string.",
    code: `# Nhập tên học sinh từ bàn phím
ten = input("Nhập họ tên của bạn: ")
lop = input("Nhập lớp học của bạn: ")

print("-" * 35)
print(f"Xin chào {ten} đến với STEM Tin Học!")
print(f"Chúc bạn học tập thật tốt tại {lop}.")
print("-" * 35)
`,
    sampleInput: "Nguyễn Văn An\nLớp 10A1",
  },
  arithmetic_gdpt: {
    name: "2. Phép toán số học (GDPT 2018)",
    category: "GDPT 2018",
    description: "Nhập 2 số a, b và tính tổng, hiệu, tích, chia nguyên //, chia dư %.",
    code: `# Nhập vào 2 số nguyên a và b trên cùng 1 dòng
print("Mời nhập 2 số nguyên a và b (cách nhau bởi dấu cách):")
a, b = map(int, input().split())

print(f"Tổng a + b: {a + b}")
print(f"Hiệu a - b: {a - b}")
print(f"Tích a * b: {a * b}")
print(f"Thương nguyên a // b: {a // b}")
print(f"Số dư a % b: {a % b}")
print(f"Lũy thừa a ^ b: {a ** b}")
`,
    sampleInput: "15 4",
  },
  if_else_branches: {
    name: "3. Cấu trúc rẽ nhánh if-elif-else",
    category: "GDPT 2018",
    description: "Kiểm tra số chẵn lẻ và xếp loại học lực học sinh.",
    code: `# Nhập điểm trung bình môn Tin học
diem = float(input("Nhập điểm trung bình môn Tin học (0 - 10): "))

if diem < 0 or diem > 10:
    print("Điểm không hợp lệ!")
elif diem >= 8.0:
    print(f"Điểm {diem}: Xếp loại GIỎI / XUẤT SẮC 🌟")
elif diem >= 6.5:
    print(f"Điểm {diem}: Xếp loại KHÁ 👍")
elif diem >= 5.0:
    print(f"Điểm {diem}: Xếp loại TRUNG BÌNH 🎯")
else:
    print(f"Điểm {diem}: Cần nỗ lực ôn tập thêm 💡")
`,
    sampleInput: "8.5",
  },
  loops_for_range: {
    name: "4. Vòng lặp for & hàm range()",
    category: "GDPT 2018",
    description: "Tính tổng từ 1 đến N và in bảng cửu chương số K.",
    code: `# Nhập số nguyên N
n = int(input("Nhập số N để tính tổng và in bảng nhân: "))

# Tính tổng 1 + 2 + ... + N
tong = 0
for i in range(1, n + 1):
    tong += i

print(f"Tổng các số từ 1 đến {n} là: {tong}")

# In bảng nhân cho N
print(f"--- BẢNG NHÂN {n} ---")
for i in range(1, 11):
    print(f"{n} x {i:2d} = {n * i:2d}")
`,
    sampleInput: "7",
  },
  while_euclid_gcd: {
    name: "5. Vòng lặp while & Thuật toán Euclid",
    category: "Thuật toán",
    description: "Tìm Ước chung lớn nhất (UCLN) và Bội chung nhỏ nhất (BCNN).",
    code: `# Nhập 2 số nguyên dương
a, b = map(int, input("Nhập 2 số nguyên a và b: ").split())
orig_a, orig_b = a, b

# Thuật toán Euclid với vòng lặp while
while b != 0:
    r = a % b
    a = b
    b = r

ucln = a
bcnn = (orig_a * orig_b) // ucln

print(f"UCLN({orig_a}, {orig_b}) = {ucln}")
print(f"BCNN({orig_a}, {orig_b}) = {bcnn}")
`,
    sampleInput: "24 36",
  },
  list_operations: {
    name: "6. Kiểu Danh sách (List) & Thống kê",
    category: "Cấu trúc dữ liệu",
    description: "Khởi tạo danh sách, tìm Max, Min, sắp xếp và tính trung bình.",
    code: `# Nhập danh sách các số nguyên cách nhau bởi dấu cách
print("Nhập các số trong danh sách (cách nhau bởi dấu cách):")
arr = list(map(int, input().split()))

print(f"Danh sách ban đầu: {arr}")
print(f"Số lượng phần tử: {len(arr)}")
print(f"Giá trị lớn nhất (Max): {max(arr)}")
print(f"Giá trị nhỏ nhất (Min): {min(arr)}")
print(f"Tổng các phần tử: {sum(arr)}")
print(f"Trung bình cộng: {sum(arr) / len(arr):.2f}")

# Sắp xếp tăng dần
arr_tang = sorted(arr)
print(f"Danh sách sau khi sắp xếp tăng dần: {arr_tang}")
`,
    sampleInput: "12 45 7 89 23 45 10",
  },
  string_processing: {
    name: "7. Xử lý Xâu ký tự (String)",
    category: "GDPT 2018",
    description: "Đếm từ, chuẩn hóa xâu chữ hoa/thường và kiểm tra xâu đối xứng.",
    code: `# Nhập xâu ký tự
s = input("Nhập vào một câu hoặc xâu ký tự: ").strip()

print(f"Độ dài xâu: {len(s)} ký tự")
print(f"Viết hoa toàn bộ: {s.upper()}")
print(f"Viết thường toàn bộ: {s.lower()}")
print(f"Số lượng từ trong câu: {len(s.split())} từ")

# Kiểm tra xâu đối xứng (bỏ qua khoảng trắng và viết thường)
cleaned = s.lower().replace(" ", "")
if cleaned == cleaned[::-1]:
    print("=> Đây là XÂU ĐỐI XỨNG (Palindrome)!")
else:
    print("=> Không phải xâu đối xứng.")
`,
    sampleInput: "Madam In Eden Im Adam",
  },
  function_def: {
    name: "8. Xây dựng hàm (def) & Số nguyên tố",
    category: "Chương trình con",
    description: "Định nghĩa hàm kiểm tra số nguyên tố và tìm các số nguyên tố nhỏ hơn N.",
    code: `import math

# Hàm kiểm tra số nguyên tố
def la_so_nguyen_to(k):
    if k < 2:
        return False
    for i in range(2, int(math.isqrt(k)) + 1):
        if k % i == 0:
            return False
    return True

# Nhập N và in ra tất cả các số nguyên tố <= N
n = int(input("Nhập số nguyên N: "))
cac_snt = [x for x in range(2, n + 1) if la_so_nguyen_to(x)]

print(f"Các số nguyên tố từ 2 đến {n}:")
print(cac_snt)
print(f"Tổng cộng có {len(cac_snt)} số nguyên tố.")
`,
    sampleInput: "50",
  },
  blank: {
    name: "9. Khung soạn thảo tự do (Trống)",
    category: "Tự do",
    description: "Trang trống để bạn tự do viết chương trình Python theo ý thích.",
    code: `# Viết mã nguồn Python 3 tự do tại đây
# Nhấn nút "Chạy thử (Run)" hoặc tổ hợp Ctrl + Enter để thực thi

print("Xin chào! Bắt đầu gõ code Python của bạn tại đây.")
`,
    sampleInput: "",
  },
};

export const PythonLabModule: React.FC<PythonLabModuleProps> = ({
  currentUser,
  onBack,
  onSubmitWork,
}) => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("arithmetic_gdpt");
  const [code, setCode] = useState<string>(PYTHON_TEMPLATES.arithmetic_gdpt.code);
  const [stdinInput, setStdinInput] = useState<string>(PYTHON_TEMPLATES.arithmetic_gdpt.sampleInput);
  
  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [execTime, setExecTime] = useState<number | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"output" | "stdin" | "diary" | "cheatsheet">("output");
  const [mobileLabTab, setMobileLabTab] = useState<"code" | "output" | "ai" | "diary">("code");
  const [showCompatModal, setShowCompatModal] = useState<boolean>(false);

  // Editor settings
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");
  const [fontSize, setFontSize] = useState<number>(14);

  // Copy / Download state
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);

  // Student Reflection state (Phần học sinh trả lời để hoàn thiện chu trình sửa lỗi)
  const [reflection, setReflection] = useState<StudentReflection>({
    errorEncountered: "",
    errorReason: "",
    howFixed: "",
  });

  // Practice Debugging Session state (Lưu nhật ký bền vững)
  const [debugSession, setDebugSession] = useState<DebugSession>(() => ({
    sessionId: `py-sess-${Date.now()}`,
    studentId: currentUser.uid,
    studentCode: currentUser.studentCode,
    studentName: currentUser.displayName,
    lessonId: "python-sandbox-practice",
    lessonTitle: `Thực hành Python: ${PYTHON_TEMPLATES.arithmetic_gdpt.name}`,
    startedAt: new Date().toISOString(),
    initialCode: PYTHON_TEMPLATES.arithmetic_gdpt.code,
    finalCode: PYTHON_TEMPLATES.arithmetic_gdpt.code,
    runs: [],
    hints: [],
    reflection: {
      errorEncountered: "",
      errorReason: "",
      howFixed: "",
    },
    saveStatus: "idle",
  }));

  // AI Assistant state (3 Hint Levels: 1=Socratic, 2=Vị trí & Nguyên nhân, 3=Nguyên lý & Ví dụ)
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3>(1);
  const [isAiOpen, setIsAiOpen] = useState<boolean>(true);
  const [aiInput, setAiInput] = useState<string>("");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiErrorState, setAiErrorState] = useState<{ message: string; retryCountdown?: number; lastPrompt?: string } | null>(null);

  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-py",
      role: "assistant",
      content: `Xin chào **${currentUser.displayName}**! 👋 
Mình là **Gia sư AI Lập trình Python**.

Hệ thống hỗ trợ hướng dẫn sửa lỗi theo **3 Mức độ sư phạm**:
- 🔍 **Mức 1 (Định hướng)**: Đặt câu hỏi Socratic giúp bạn tự nhận ra lỗi.
- 📍 **Mức 2 (Vị trí & Nguyên nhân)**: Chỉ ra dòng lệnh và nguyên nhân gây lỗi.
- 💡 **Mức 3 (Nguyên lý & Ví dụ)**: Giải thích lý thuyết và ví dụ tương tự.

👉 *Gia sư sẽ không giải hộ toàn bộ bài để giúp bạn tự phát triển tư duy lập trình!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const aiBottomRef = useRef<HTMLDivElement>(null);

  // Switch template
  const handleSelectTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    const tmpl = PYTHON_TEMPLATES[key];
    if (tmpl) {
      setCode(tmpl.code);
      setStdinInput(tmpl.sampleInput);
      setConsoleOutput("");
      setExecTime(null);
      setIsError(false);
      // Reset or update debug session for new problem
      setDebugSession({
        sessionId: `py-sess-${Date.now()}`,
        studentId: currentUser.uid,
        studentCode: currentUser.studentCode,
        studentName: currentUser.displayName,
        lessonId: `python-session-${key}`,
        lessonTitle: `Thực hành Python: ${tmpl.name}`,
        startedAt: new Date().toISOString(),
        initialCode: tmpl.code,
        finalCode: tmpl.code,
        runs: [],
        hints: [],
        reflection: {
          errorEncountered: "",
          errorReason: "",
          howFixed: "",
        },
        saveStatus: "idle",
      });
      setReflection({
        errorEncountered: "",
        errorReason: "",
        howFixed: "",
      });
    }
  };

  // Run Code
  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveBottomTab("output");
    setConsoleOutput("⏳ Đang chuẩn bị môi trường & thực thi mã nguồn Python...");
    setIsError(false);

    try {
      const result = await executeCodeHybrid({
        language: "python",
        code,
        stdin: stdinInput,
      });

      setExecTime(result.time);

      let runErrorText: string | undefined = undefined;
      let runOutputText = result.output || "";

      if (result.error) {
        setIsError(true);
        runErrorText = result.error;
        setConsoleOutput(`❌ LỖI BIÊN DỊCH / THỰC THI (Execution Error):\n${result.error}\n\n${result.output || ""}`);
      } else {
        const out = result.output !== undefined ? result.output : "";
        if (out.trim() === "") {
          setConsoleOutput(`ℹ️ (Chương trình đã chạy hoàn tất trong ${result.time}ms nhưng không in ra kết quả nào với lệnh print)`);
        } else {
          setConsoleOutput(out);
        }
      }

      // Record this run into Practice Debugging Session Log
      const runItem: DebugRunItem = {
        id: `run-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        code,
        stdin: stdinInput,
        output: runOutputText,
        error: runErrorText,
        timeMs: result.time,
        passed: !result.error,
      };

      setDebugSession((prev) => ({
        ...prev,
        runs: [runItem, ...prev.runs],
        finalCode: code,
      }));
    } catch (err: any) {
      setIsError(true);
      setConsoleOutput(`❌ Lỗi thực thi mã nguồn: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Copy code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .py file
  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `python_stem_${Date.now()}.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Client-side Pedagogical Hint Generator for Instant Offline Suggestions
  const generatePedagogicalFallbackResponseClient = (params: {
    codeContext?: string;
    consoleOutput?: string;
    hintLevel?: number;
  }): string => {
    const err = (params.consoleOutput || "").toLowerCase();
    const level = Number(params.hintLevel) || 1;

    if (err.includes("indentationerror") || err.includes("thụt lề") || err.includes("thụt đầu dòng")) {
      if (level === 1) {
        return `💡 **Gợi ý Mức 1 (Định hướng Socratic):**\nTrình biên dịch đang báo lỗi thụt đầu dòng (IndentationError). Em hãy quan sát kỹ: Sau những dòng lệnh nào trong Python (như sau dấu hai chấm \`:\`), các câu lệnh tiếp theo bắt buộc phải thụt vào trong? Các dòng lệnh cùng cấp đã thụt lề bằng nhau chưa?`;
      }
      if (level === 2) {
        return `💡 **Gợi ý Mức 2 (Vị trí & Nguyên nhân):**\nLỗi xảy ra ngay sau một cấu trúc có dấu hai chấm \`:\` (như \`if\`, \`for\`, \`while\` hoặc \`def\`).\n👉 **Nguyên nhân:** Dòng lệnh bên dưới chưa thụt vào, hoặc em đang gõ lẫn lộn phím Space (dấu cách) và phím Tab. Hãy rà soát lại các dòng thụt lề ở khối lệnh gần nhất.`;
      }
      return `💡 **Gợi ý Mức 3 (Nguyên lý & Ví dụ tương tự):**\nTrong Python, thụt lề (Indentation) dùng để xác định phạm vi khối lệnh thay vì dùng cặp ngoặc nhọn \`{}\`.\n\nVí dụ đúng chuẩn:\n\`\`\`python\nif diem >= 5:\n    print("Đạt")    # Thụt vào 4 dấu cách\nelse:\n    print("Chưa đạt")\n\`\`\`\nEm hãy áp dụng quy tắc này vào bài đang làm nhé!`;
    }

    if (err.includes("syntaxerror") || err.includes("cú pháp")) {
      if (level === 1) {
        return `💡 **Gợi ý Mức 1 (Định hướng Socratic):**\nChương trình gặp lỗi cú pháp (SyntaxError). Em hãy kiểm tra xem mình có quên ký tự đặc biệt nào ở cuối câu lệnh rẽ nhánh/vòng lặp (như dấu hai chấm \`:\`), hoặc thiếu dấu đóng ngoặc \`()\` ở các lệnh \`print\`, \`input\` không?`;
      }
      if (level === 2) {
        return `💡 **Gợi ý Mức 2 (Vị trí & Nguyên nhân):**\nLỗi cú pháp thường tập trung ở:\n1. **Dấu hai chấm \`:\`**: Em kiểm tra cuối dòng \`def\`, \`if\`, \`elif\`, \`else\`, \`for\`, \`while\` đã có dấu hai chấm chưa?\n2. **Đóng ngoặc đơn \`()\`**: Đếm số lượng ngoặc mở và đóng trong câu lệnh có khớp nhau không?`;
      }
      return `💡 **Gợi ý Mức 3 (Nguyên lý & Ví dụ tương tự):**\nPython yêu cầu mọi câu lệnh định nghĩa khối phải kết thúc bằng dấu hai chấm \`:\`.\n\nVí dụ minh họa:\n\`\`\`python\nfor i in range(1, 10):  # Bắt buộc có dấu hai chấm ở cuối\n    print(i)\n\`\`\`\nHãy so sánh với cú pháp dòng lệnh của em để tự sửa lại nhé.`;
    }

    if (err.includes("nameerror")) {
      if (level === 1) {
        return `💡 **Gợi ý Mức 1 (Định hướng Socratic):**\nThông báo \`NameError\` nghĩa là Python không nhận diện được tên biến hoặc tên hàm. Em thử kiểm tra xem tên đó đã được tạo ra trước khi sử dụng chưa, và có viết sai chính tả chữ hoa/thường không?`;
      }
      return `💡 **Gợi ý Mức 2 (Vị trí & Nguyên nhân):**\nLỗi NameError xuất hiện khi biến chưa được gán giá trị ở các dòng phía trên, hoặc tên biến bị gõ sai (Python phân biệt chữ hoa/thường, ví dụ \`tong\` khác \`Tong\`). Hãy kiểm tra lại tên biến trong lệnh đang tính toán.`;
    }

    if (level === 1) {
      return `💡 **Gợi ý Mức 1 (Định hướng Socratic):**\nEm hãy quan sát kết quả chạy ở màn hình và mục đích của bài toán:\n1. Đầu vào cần nhập dữ liệu dạng gì?\n2. Kết quả máy tính đang in ra có đúng với ví dụ mẫu không, hay xuất hiện dòng báo lỗi nào?`;
    } else if (level === 2) {
      return `💡 **Gợi ý Mức 2 (Vị trí & Nguyên nhân):**\nEm hãy kiểm tra thứ tự thực hiện các bước trong chương trình:\n- Bước 1: Nhập dữ liệu và ép kiểu.\n- Bước 2: Vòng lặp hoặc điều kiện tính toán.\n- Bước 3: In kết quả ra màn hình với \`print()\`. Dòng nào đang thực hiện chưa đúng ý định của em?`;
    }
    return `💡 **Gợi ý Mức 3 (Nguyên lý & Ví dụ tương tự):**\nVí dụ cấu trúc chuẩn nhập và tính toán lặp:\n\`\`\`python\ntong = 0\nfor x in [1, 2, 3, 4]:\n    tong += x\nprint("Tổng là:", tong)\n\`\`\`\nEm hãy vận dụng cấu trúc tương tự để hoàn thiện bài của mình nhé!`;
  };

  // Instant Fallback Hint (Không gọi Gemini thêm lần nào, trả kết quả tức thì)
  const handleInstantFallbackHint = (targetLevel?: 1 | 2 | 3) => {
    const lvl = targetLevel !== undefined ? targetLevel : hintLevel;
    const fallbackText = generatePedagogicalFallbackResponseClient({
      codeContext: code,
      consoleOutput,
      hintLevel: lvl,
    });

    const assistantMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: `⚠️ **[Gợi ý có sẵn — không phải phản hồi AI]**\n\n${fallbackText}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiMessages((prev) => [...prev, assistantMsg]);
    setAiErrorState(null);

    const hintItem: AiHintItem = {
      id: `hint-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      level: lvl,
      prompt: aiErrorState?.lastPrompt || `Xem gợi ý có sẵn Mức ${lvl}`,
      response: fallbackText,
      source: "fallback",
    };

    setDebugSession((prev) => ({
      ...prev,
      hints: [hintItem, ...prev.hints],
    }));

    setTimeout(() => {
      aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Save practice work (Bỏ việc tự gán 10/10 và graded; lưu ở trạng thái submitted với score: null; không tạo bài trùng khi thử lại)
  const handleSavePractice = async () => {
    if (!onSubmitWork) return;
    setIsSaving(true);
    setSaveError(null);

    const sessionToSave: DebugSession = {
      ...debugSession,
      finalCode: code,
      finishedAt: new Date().toISOString(),
      reflection,
      saveStatus: "saving",
    };

    const subIdToUse = activeSubmissionId || `sub-py-${Date.now()}`;
    try {
      await onSubmitWork({
        id: subIdToUse,
        lessonId: `python-session-${selectedTemplateKey}`,
        lessonTitle: `Thực hành Python: ${PYTHON_TEMPLATES[selectedTemplateKey]?.name || "Mã tự do"}`,
        studentId: currentUser.uid,
        studentName: currentUser.displayName,
        studentEmail: currentUser.email,
        moduleType: "coding",
        content: {
          language: "python",
          code,
          stdin: stdinInput,
          consoleOutput,
          templateKey: selectedTemplateKey,
          debugSession: sessionToSave,
        },
        // Bắt đầu bằng trạng thái submitted, điểm số null (chờ giáo viên duyệt và chấm điểm)
        score: null,
        maxScore: 10,
        status: "submitted",
      });

      setActiveSubmissionId(subIdToUse);
      setSaveSuccess(true);
      setDebugSession({ ...sessionToSave, saveStatus: "saved" });
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e: any) {
      console.error("Save practice error:", e);
      setSaveError(e?.message || "Lỗi lưu bài nộp. Dữ liệu chưa được đồng bộ.");
      setDebugSession({ ...sessionToSave, saveStatus: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Send message to AI Tutor (supports 3 hint levels & graceful error handling)
  const handleSendAi = async (customPrompt?: string, targetLevel?: 1 | 2 | 3, forceFallback: boolean = false) => {
    const lvl = targetLevel !== undefined ? targetLevel : hintLevel;
    const text = customPrompt || aiInput.trim();
    if (!text || isAiThinking) return;

    // Ensure AI drawer is open
    setIsAiOpen(true);
    setAiErrorState(null);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: `[Mức ${lvl}] ${text}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setAiInput("");
    setIsAiThinking(true);

    setTimeout(() => {
      aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          hintLevel: lvl,
          history: aiMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          codeContext: code,
          stdin: stdinInput,
          language: "python",
          consoleOutput: consoleOutput ? consoleOutput.slice(0, 1500) : undefined,
          studentId: currentUser.uid,
          allowFallback: forceFallback, // Only use fallback if forced or agreed
        }),
      });

      if (!res.ok) {
        // Inspect HTTP status codes
        if (res.status === 429) {
          const errData = await res.json().catch(() => ({}));
          const retryAfter = errData.retryAfter || 15;
          setAiErrorState({
            message: `⚠️ Tần suất yêu cầu quá nhanh. Vui lòng đợi ${retryAfter} giây trước khi gửi tiếp.`,
            retryCountdown: retryAfter,
            lastPrompt: text,
          });
          return;
        }

        if (res.status === 503 || res.status === 504) {
          setAiErrorState({
            message: "⚠️ Dịch vụ Gia sư AI đang quá tải hoặc gián đoạn kết nối. Bạn có thể nhấn 'Thử lại' hoặc 'Xem gợi ý có sẵn'.",
            lastPrompt: text,
          });
          return;
        }

        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi máy chủ (${res.status})`);
      }

      const data = await res.json();
      const isFallback = Boolean(data.isFallback || data.source === "fallback");
      const replyContent = isFallback
        ? `⚠️ **[Gợi ý có sẵn — không phải phản hồi AI]**\n\n${data.text}`
        : data.text || "Gia sư đã xem qua mã nguồn nhưng chưa có phản hồi phù hợp.";

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setAiMessages((prev) => [...prev, assistantMsg]);

      // Record received hint into debugSession
      const hintItem: AiHintItem = {
        id: `hint-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        level: lvl,
        prompt: text,
        response: data.text,
        source: isFallback ? "fallback" : "ai",
      };

      setDebugSession((prev) => ({
        ...prev,
        hints: [hintItem, ...prev.hints],
      }));
    } catch (err: any) {
      setAiErrorState({
        message: `⚠️ Lỗi kết nối AI: ${err?.message || "Không thể kết nối đến máy chủ"}.`,
        lastPrompt: text,
      });
    } finally {
      setIsAiThinking(false);
      setTimeout(() => {
        aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-10">
        {/* Left side: Back + Title & Template Selector */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all border border-slate-700/60 cursor-pointer"
              title="Quay lại danh sách khóa học"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-xs">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-tight">Khu Lập Trình Python 3</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
                  Sandbox Tự Do
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Thực hành gõ code, chạy thử input/output & có Gia sư AI đồng hành
              </p>
            </div>
          </div>

          {/* Template Selector Dropdown */}
          <div className="hidden md:flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-800">
            <span className="text-[11px] font-bold text-slate-400">Mẫu code:</span>
            <select
              value={selectedTemplateKey}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="bg-slate-800 text-xs font-semibold text-amber-300 border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500 transition-colors"
            >
              {Object.entries(PYTHON_TEMPLATES).map(([key, item]) => (
                <option key={key} value={key} className="bg-slate-900 text-slate-200">
                  [{item.category}] {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side: Actions (Run, Reset, Copy, Download, AI) */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
            className="hidden sm:inline-flex items-center min-h-[36px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === "vs-dark" ? "🌙 Tối" : "☀️ Sáng"}
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            title="Sao chép toàn bộ mã nguồn"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download File */}
          <button
            onClick={handleDownloadCode}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            title="Tải file .py về máy tính"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Reset Code */}
          <button
            onClick={() => handleSelectTemplate(selectedTemplateKey)}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            title="Khôi phục lại mã ban đầu của mẫu này"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Save to Practice Diary (if callback provided) */}
          {onSubmitWork && (
            <button
              onClick={handleSavePractice}
              disabled={isSaving}
              className={`hidden lg:inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                saveSuccess
                  ? "bg-emerald-900/60 text-emerald-300 border-emerald-700"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
              title="Lưu bài thực hành vào hồ sơ học sinh"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Đã lưu!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isSaving ? "Đang lưu..." : "Lưu vào nhật ký"}</span>
                </>
              )}
            </button>
          )}

          {/* RUN CODE BUTTON (Desktop / Tablet) */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="hidden md:flex min-h-[36px] px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all items-center gap-1.5 shadow-md shadow-emerald-600/30 disabled:opacity-50"
            title="Chạy thử code Python (Ctrl + Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? "Đang chạy..." : "Chạy thử (Run)"}</span>
          </button>

          {/* Toggle AI Sidebar */}
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isAiOpen
                ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                : "bg-slate-800 text-indigo-300 border-indigo-800 hover:bg-slate-700"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gia Sư AI</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Navigation Bar (< 768px) */}
      <div className="md:hidden flex items-center bg-slate-900 border-b border-slate-800 shrink-0 px-2 py-1 gap-1">
        <button
          type="button"
          onClick={() => setMobileLabTab("code")}
          className={`flex-1 min-h-[44px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mobileLabTab === "code" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Mã</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileLabTab("output")}
          className={`flex-1 min-h-[44px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mobileLabTab === "output" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Kết quả</span>
          {consoleOutput.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        </button>
        <button
          type="button"
          onClick={() => setMobileLabTab("ai")}
          className={`flex-1 min-h-[44px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mobileLabTab === "ai" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Gia sư</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileLabTab("diary")}
          className={`flex-1 min-h-[44px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mobileLabTab === "diary" ? "bg-amber-600 text-white shadow-xs" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật ký</span>
        </button>
      </div>

      {/* Main Workspace (Split into Editor/Bottom Panel on left, and AI Sidebar on right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Editor + Bottom Panels */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Template Selector Bar */}
          <div className="md:hidden bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Mẫu:</span>
            <select
              value={selectedTemplateKey}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="flex-1 bg-slate-800 text-xs font-semibold text-amber-300 border border-slate-700 rounded-md px-2 py-1"
            >
              {Object.entries(PYTHON_TEMPLATES).map(([key, item]) => (
                <option key={key} value={key}>
                  [{item.category}] {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative min-h-[220px]">
            <Editor
              height="100%"
              language="python"
              theme={theme}
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                fontSize: fontSize,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace",
                lineNumbers: "on",
                suggestOnTriggerCharacters: true,
                renderLineHighlight: "all",
              }}
            />
          </div>

          {/* Bottom Panel (Output, Input stdin, Cheatsheet) */}
          <div className="h-64 border-t border-slate-800 bg-slate-900 flex flex-col shrink-0">
            {/* Tab Header */}
            <div className="h-9 px-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveBottomTab("output")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeBottomTab === "output"
                      ? "bg-slate-800 text-white border border-slate-700/80"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terminal Kết Quả (Stdout)</span>
                  {execTime !== null && (
                    <span className="text-[10px] text-slate-400 font-normal">({execTime}ms)</span>
                  )}
                </button>

                <button
                  onClick={() => setActiveBottomTab("stdin")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeBottomTab === "stdin"
                      ? "bg-slate-800 text-white border border-slate-700/80"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dữ Liệu Đầu Vào (Stdin)</span>
                  {stdinInput.trim() !== "" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </button>

                <button
                  onClick={() => setActiveBottomTab("diary")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeBottomTab === "diary"
                      ? "bg-slate-800 text-white border border-slate-700/80"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nhật Ký Sửa Lỗi & Tự Giải Thích</span>
                  {(debugSession.runs.length > 0 || debugSession.hints.length > 0) && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-900/80 text-indigo-300 font-bold">
                      {debugSession.runs.length} lần chạy • {debugSession.hints.length} gợi ý
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveBottomTab("cheatsheet")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeBottomTab === "cheatsheet"
                      ? "bg-slate-800 text-white border border-slate-700/80"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span>Sổ Tay Cú Pháp Nhanh</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompatModal(true)}
                  className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60"
                  title="Xem thông tin môi trường & giới hạn tương thích Python"
                >
                  <Info className="w-3 h-3 text-amber-400" />
                  <span>Giới hạn bộ chạy</span>
                </button>

                {activeBottomTab === "output" && (
                  <button
                    onClick={() => setConsoleOutput("")}
                    className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                    title="Xóa nội dung màn hình kết quả"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs">
              {activeBottomTab === "output" && (
                <div>
                  {consoleOutput === "" ? (
                    <div className="text-slate-500 italic py-4 flex flex-col items-center justify-center gap-2">
                      <Terminal className="w-6 h-6 opacity-40" />
                      <span>Chưa có kết quả thực thi. Nhấn nút <strong>"Chạy thử (Run)"</strong> ở góc trên để chạy chương trình.</span>
                    </div>
                  ) : (
                    <div>
                      <pre className={`whitespace-pre-wrap ${isError ? "text-rose-400" : "text-emerald-300"}`}>
                        {consoleOutput}
                      </pre>
                      {isError && (
                        <div className="mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-700/60 flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 text-indigo-200 text-xs font-sans">
                            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Mã nguồn phát hiện lỗi. Bạn muốn Gia sư AI hỗ trợ tìm nguyên nhân theo mức độ nào?</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-sans">
                            <button
                              type="button"
                              onClick={() => {
                                setHintLevel(1);
                                handleSendAi("Mã nguồn của em bị lỗi khi chạy. Hãy đặt câu hỏi giúp em tự phát hiện nguyên nhân nhé!", 1);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 text-xs font-semibold border border-indigo-700"
                            >
                              🔍 Mức 1: Câu hỏi
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setHintLevel(2);
                                handleSendAi("Chương trình của em gặp lỗi. Xin hãy chỉ ra dòng lệnh và nguyên nhân gây lỗi!", 2);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-200 text-xs font-semibold border border-amber-700"
                            >
                              📍 Mức 2: Vị trí lỗi
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setHintLevel(3);
                                handleSendAi("Hãy giải thích nguyên lý và cho em một ví dụ tương tự khác nhé!", 3);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold border border-emerald-700"
                            >
                              💡 Mức 3: Giải thích & Ví dụ
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeBottomTab === "stdin" && (
                <div className="h-full flex flex-col gap-2">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Nhập dữ liệu giả lập cho các lệnh <code>input()</code> (mỗi dòng tương ứng 1 lần input):</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setStdinInput("15 4")}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] rounded text-slate-300"
                      >
                        Mẫu: "15 4"
                      </button>
                      <button
                        onClick={() => setStdinInput("5\n1 2 3 4 5")}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] rounded text-slate-300"
                      >
                        Mẫu mảng N=5
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={stdinInput}
                    onChange={(e) => setStdinInput(e.target.value)}
                    placeholder="Nhập dữ liệu vào đây (ví dụ: 10 20 hoặc họ tên)..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-xs resize-none"
                  />
                </div>
              )}

              {/* Diary & Student Reflection Tab */}
              {activeBottomTab === "diary" && (
                <div className="font-sans space-y-4 text-xs">
                  {/* Student Reflection Section */}
                  <div className="p-3.5 bg-slate-900/80 border border-indigo-800/60 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        <h4 className="font-bold text-white text-sm">Phần học sinh tự giải thích quá trình sửa lỗi</h4>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        (Bắt buộc để giáo viên đánh giá bài làm)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-300 mb-1">
                          1. Em gặp lỗi gì?
                        </label>
                        <textarea
                          value={reflection.errorEncountered}
                          onChange={(e) => setReflection({ ...reflection, errorEncountered: e.target.value })}
                          placeholder="Ví dụ: Lỗi SyntaxError ở dòng 5 thiếu dấu hai chấm, hoặc vòng lặp while bị lặp vô hạn..."
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-sky-300 mb-1">
                          2. Vì sao xảy ra lỗi?
                        </label>
                        <textarea
                          value={reflection.errorReason}
                          onChange={(e) => setReflection({ ...reflection, errorReason: e.target.value })}
                          placeholder="Ví dụ: Do em quên cú pháp câu lệnh if phải có dấu ':', hoặc biến chạy i chưa được tăng giá trị..."
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-emerald-300 mb-1">
                          3. Em đã sửa như thế nào?
                        </label>
                        <textarea
                          value={reflection.howFixed}
                          onChange={(e) => setReflection({ ...reflection, howFixed: e.target.value })}
                          placeholder="Ví dụ: Em đã thêm dấu ':' vào cuối dòng 5 và thụt lề 4 dấu cách cho khối lệnh bên trong..."
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>Trạng thái phiên: <strong>{debugSession.runs.length}</strong> lần chạy thử | <strong>{debugSession.hints.length}</strong> lần nhận gợi ý AI</span>
                      {onSubmitWork && (
                        <button
                          type="button"
                          onClick={handleSavePractice}
                          disabled={isSaving}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? "Đang lưu..." : "Lưu vào hồ sơ bài nộp"}</span>
                        </button>
                      )}
                    </div>

                    {saveSuccess && (
                      <div className="p-2 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>✅ Đã lưu bài nộp và phiên sửa lỗi thành công! Bài đang ở trạng thái <strong>"submitted"</strong> (Chờ giáo viên chấm điểm).</span>
                      </div>
                    )}

                    {saveError && (
                      <div className="p-2 bg-rose-950/80 border border-rose-700 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{saveError}</span>
                      </div>
                    )}
                  </div>

                  {/* Run History List */}
                  <div>
                    <h5 className="font-bold text-slate-300 mb-2 flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      <span>Lịch sử các lần chạy thử trong phiên ({debugSession.runs.length})</span>
                    </h5>
                    {debugSession.runs.length === 0 ? (
                      <div className="text-slate-500 italic p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                        Chưa có lần chạy nào. Nhấn "Chạy thử (Run)" để bắt đầu ghi nhận tiến trình.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {debugSession.runs.map((r, i) => (
                          <div key={r.id || i} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-300">Lần {debugSession.runs.length - i}</span>
                                <span className="text-[10px] text-slate-500">{r.timestamp}</span>
                                {r.passed ? (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">Thành công ({r.timeMs}ms)</span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-950 text-rose-400 border border-rose-800">Có lỗi</span>
                                )}
                              </div>
                              <pre className="text-[11px] text-slate-400 truncate font-mono">
                                {r.error ? r.error.split("\n")[0] : r.output.slice(0, 100) || "(Không in kết quả)"}
                              </pre>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCode(r.code);
                              }}
                              className="px-2 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 shrink-0"
                              title="Tải lại mã nguồn ở lần chạy này"
                            >
                              Khôi phục mã
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeBottomTab === "cheatsheet" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-slate-300 font-sans">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono">
                    <div className="font-bold text-amber-400 mb-1 font-sans">Nhập / Xuất dữ liệu</div>
                    <code className="block text-[11px] text-slate-300">print("Xin chào", x)</code>
                    <code className="block text-[11px] text-slate-300">x = input() # dạng xâu str</code>
                    <code className="block text-[11px] text-slate-300">a = int(input()) # số nguyên</code>
                    <code className="block text-[11px] text-slate-300">a, b = map(int, input().split())</code>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono">
                    <div className="font-bold text-sky-400 mb-1 font-sans">Rẽ nhánh & Vòng lặp</div>
                    <code className="block text-[11px] text-slate-300">if a &gt; 0: ... elif: ... else:</code>
                    <code className="block text-[11px] text-slate-300">for i in range(n): ...</code>
                    <code className="block text-[11px] text-slate-300">for i in range(1, n + 1, 2):</code>
                    <code className="block text-[11px] text-slate-300">while dieu_kien: ...</code>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono">
                    <div className="font-bold text-emerald-400 mb-1 font-sans">Danh sách & Hàm</div>
                    <code className="block text-[11px] text-slate-300">a = [1, 2, 3]; a.append(4)</code>
                    <code className="block text-[11px] text-slate-300">len(a), max(a), min(a), sum(a)</code>
                    <code className="block text-[11px] text-slate-300">def tinh_tong(x, y): return x + y</code>
                    <code className="block text-[11px] text-slate-300">s[::-1] # đảo ngược xâu</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: AI Tutor */}
        {isAiOpen && (
          <aside className="w-80 md:w-96 border-l border-slate-800 bg-slate-900/95 flex flex-col shrink-0 z-10">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">Gia Sư AI Python</h3>
                  <p className="text-[10px] text-indigo-300">Hỗ trợ tự sửa lỗi theo 3 mức độ</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setAiMessages([
                      {
                        id: Date.now().toString(),
                        role: "assistant",
                        content: `Hội thoại đã được làm mới. Bạn cần Gia sư AI hỗ trợ gì về mã nguồn Python này?`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      }
                    ]);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-md text-[11px] hover:bg-slate-800 transition-colors"
                  title="Làm mới cuộc trò chuyện"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsAiOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md text-xs hover:bg-slate-800 transition-colors"
                  title="Đóng bảng Gia sư AI"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 3-Level Hint Selector Controls */}
            <div className="p-2 border-b border-slate-800 bg-slate-950/70">
              <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Chọn mức độ trợ giúp sư phạm:</span>
                <span className="text-indigo-400 font-semibold">Mức {hintLevel}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setHintLevel(1)}
                  className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all border ${
                    hintLevel === 1
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                  }`}
                  title="Mức 1: Đặt câu hỏi Socratic giúp học sinh tự nhận ra lỗi"
                >
                  🔍 Mức 1: Câu hỏi
                </button>
                <button
                  type="button"
                  onClick={() => setHintLevel(2)}
                  className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all border ${
                    hintLevel === 2
                      ? "bg-amber-600 text-white border-amber-500 shadow-sm"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                  }`}
                  title="Mức 2: Chỉ ra vị trí dòng lệnh và nguyên nhân gây lỗi"
                >
                  📍 Mức 2: Vị trí lỗi
                </button>
                <button
                  type="button"
                  onClick={() => setHintLevel(3)}
                  className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all border ${
                    hintLevel === 3
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                  }`}
                  title="Mức 3: Giải thích nguyên lý và cho ví dụ tương tự"
                >
                  💡 Mức 3: Ví dụ
                </button>
              </div>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="p-2 border-b border-slate-800 bg-slate-950/40 flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSendAi(`Hãy hướng dẫn mình tìm lỗi trong đoạn mã này theo Hướng dẫn Mức ${hintLevel}.`, hintLevel)}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 transition-colors"
              >
                🐛 Tìm lỗi (Mức {hintLevel})
              </button>
              <button
                onClick={() => handleSendAi("Hãy giải thích ý nghĩa các khối lệnh trong mã nguồn này giúp mình một cách ngắn gọn, dễ hiểu.", 3)}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-sky-950/80 text-sky-300 border border-sky-800 hover:bg-sky-900 transition-colors"
              >
                📖 Giải thích code
              </button>
              <button
                onClick={() => handleSendAi("Gợi ý cách tối ưu thuật toán hoặc cách viết ngắn gọn chuẩn Python hơn mà không làm mất tính dễ đọc.", hintLevel)}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors"
              >
                ⚡ Tối ưu code
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-3 leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-xs"
                        : "bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-xs shadow-md"
                    }`}
                  >
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <span className="text-[9px] opacity-50 mt-1.5 block text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-indigo-400 text-xs p-2 bg-slate-800/60 rounded-xl w-fit border border-slate-700/60 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Gia sư AI đang phân tích mã nguồn theo Mức {hintLevel}...</span>
                </div>
              )}

              {/* Error & Retry Banner */}
              {aiErrorState && (
                <div className="p-3 bg-rose-950/80 border border-rose-700/80 rounded-xl text-rose-200 text-xs space-y-2">
                  <p className="font-semibold">{aiErrorState.message}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendAi(aiErrorState.lastPrompt, hintLevel)}
                      className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded font-bold text-[11px] flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Thử lại</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInstantFallbackHint(hintLevel)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-bold text-[11px] border border-amber-600/50"
                    >
                      💡 Xem gợi ý có sẵn
                    </button>
                  </div>
                </div>
              )}

              <div ref={aiBottomRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-800 bg-slate-900">
              <div className="flex items-center gap-1.5 bg-slate-950 rounded-xl border border-slate-800 p-1.5 focus-within:border-indigo-500 transition-colors">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAi();
                    }
                  }}
                  placeholder={`Hỏi Gia sư AI (Đang áp dụng Mức ${hintLevel})...`}
                  className="flex-1 bg-transparent px-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSendAi()}
                  disabled={!aiInput.trim() || isAiThinking}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Compatibility Notice Modal */}
      {showCompatModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Giới Hạn & Tương Thích Môi Trường Python</h3>
              </div>
              <button
                onClick={() => setShowCompatModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-white mb-1">Bộ máy thực thi:</div>
                <div className="text-emerald-400 font-mono">{PYTHON_RUNTIME_COMPATIBILITY_INFO.engineName} ({PYTHON_RUNTIME_COMPATIBILITY_INFO.version})</div>
              </div>

              <div>
                <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tính năng hỗ trợ đầy đủ:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                  {PYTHON_RUNTIME_COMPATIBILITY_INFO.supportedFeatures.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-bold text-rose-400 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Các tính năng & thư viện chưa hỗ trợ:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
                  {PYTHON_RUNTIME_COMPATIBILITY_INFO.unsupportedFeatures.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 bg-amber-950/40 border border-amber-700/60 rounded-xl text-amber-200">
                <strong>Giới hạn an toàn:</strong> Thời gian chạy tối đa {PYTHON_RUNTIME_COMPATIBILITY_INFO.limits.maxExecutionTimeMs / 1000}s (ngăn chặn vòng lặp vô hạn làm đơ máy), giới hạn đầu ra {PYTHON_RUNTIME_COMPATIBILITY_INFO.limits.maxOutputChars.toLocaleString()} ký tự.
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCompatModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

