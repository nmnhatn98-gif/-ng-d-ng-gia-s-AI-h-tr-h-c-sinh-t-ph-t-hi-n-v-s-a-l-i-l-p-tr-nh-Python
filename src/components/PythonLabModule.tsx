import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { UserProfile, ChatMessage, Submission } from "../types";
import { executeCodeHybrid } from "../lib/pythonRunner";
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
  Save
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
  const [activeBottomTab, setActiveBottomTab] = useState<"output" | "stdin" | "cheatsheet">("output");

  // Editor settings
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");
  const [fontSize, setFontSize] = useState<number>(14);

  // Copy / Download state
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // AI Assistant state
  const [isAiOpen, setIsAiOpen] = useState<boolean>(true);
  const [aiInput, setAiInput] = useState<string>("");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-py",
      role: "assistant",
      content: `Xin chào **${currentUser.displayName}**! 👋 
Mình là **Gia sư AI Lập trình Python**. 

Đây là **Sân chơi Python tự do**: bạn có thể nhập lệnh, chạy thử tính toán số học, làm bài Tin học 10 GDPT 2018, hoặc thử nghiệm các giải thuật mới bất cứ lúc nào mà không cần vào bài tập cụ thể.

👉 Nếu có lỗi cú pháp hoặc muốn gợi ý thuật toán, hãy nhắn cho mình ngay nhé!`,
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

      if (result.error) {
        setIsError(true);
        setConsoleOutput(`❌ LỖI BIÊN DỊCH / THỰC THI (Execution Error):\n${result.error}\n\n${result.output || ""}`);
      } else {
        const out = result.output !== undefined ? result.output : "";
        if (out.trim() === "") {
          setConsoleOutput(`ℹ️ (Chương trình đã chạy hoàn tất trong ${result.time}ms nhưng không in ra kết quả nào với lệnh print)`);
        } else {
          setConsoleOutput(out);
        }
      }
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

  // Save practice work
  const handleSavePractice = async () => {
    if (!onSubmitWork) return;
    setIsSaving(true);
    try {
      await onSubmitWork({
        lessonId: "python-sandbox-practice",
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
        },
        score: 10,
        maxScore: 10,
        status: "graded",
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Send message to AI
  const handleSendAi = async (customPrompt?: string) => {
    const text = customPrompt || aiInput.trim();
    if (!text || isAiThinking) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
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
          history: aiMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          codeContext: code,
          language: "python",
          consoleOutput: consoleOutput ? consoleOutput.slice(0, 500) : undefined,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text || "Mình chưa thể phản hồi lúc này, bạn thử hỏi lại nhé.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setAiMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setAiMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ Không thể kết nối tới Gia sư AI. Vui lòng kiểm tra lại kết nối mạng.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiThinking(false);
      setTimeout(() => {
        aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-950 text-slate-100 font-sans select-none">
      {/* Top Navbar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-10">
        {/* Left side: Back + Title & Template Selector */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all border border-slate-700/60"
              title="Quay lại danh sách khóa học"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-tight">Khu Lập Trình Python 3</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
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
            className="hidden sm:inline-flex items-center px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === "vs-dark" ? "🌙 Tối" : "☀️ Sáng"}
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            title="Sao chép toàn bộ mã nguồn"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download File */}
          <button
            onClick={handleDownloadCode}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            title="Tải file .py về máy tính"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Reset Code */}
          <button
            onClick={() => handleSelectTemplate(selectedTemplateKey)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            title="Khôi phục lại mã ban đầu của mẫu này"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Save to Practice Diary (if callback provided) */}
          {onSubmitWork && (
            <button
              onClick={handleSavePractice}
              disabled={isSaving}
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
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

          {/* RUN CODE BUTTON */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 disabled:opacity-50"
            title="Chạy thử code Python (Ctrl + Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? "Đang chạy..." : "Chạy thử (Run)"}</span>
          </button>

          {/* Toggle AI Sidebar */}
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
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
                    <pre className={`whitespace-pre-wrap ${isError ? "text-rose-400" : "text-emerald-300"}`}>
                      {consoleOutput}
                    </pre>
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

              {activeBottomTab === "cheatsheet" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-slate-300">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="font-bold text-amber-400 mb-1">Nhập / Xuất dữ liệu</div>
                    <code className="block text-[11px] text-slate-300">print("Xin chào", x)</code>
                    <code className="block text-[11px] text-slate-300">x = input() # dạng xâu str</code>
                    <code className="block text-[11px] text-slate-300">a = int(input()) # số nguyên</code>
                    <code className="block text-[11px] text-slate-300">a, b = map(int, input().split())</code>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="font-bold text-sky-400 mb-1">Rẽ nhánh & Vòng lặp</div>
                    <code className="block text-[11px] text-slate-300">if a &gt; 0: ... elif: ... else:</code>
                    <code className="block text-[11px] text-slate-300">for i in range(n): ...</code>
                    <code className="block text-[11px] text-slate-300">for i in range(1, n + 1, 2):</code>
                    <code className="block text-[11px] text-slate-300">while dieu_kien: ...</code>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="font-bold text-emerald-400 mb-1">Danh sách & Hàm</div>
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
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">Gia Sư AI Python</h3>
                  <p className="text-[10px] text-indigo-300">Hướng dẫn cú pháp & giải thuật</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md text-xs"
              >
                ✕
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="p-2 border-b border-slate-800 bg-slate-950/40 flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSendAi("Hãy giải thích ý nghĩa từng dòng mã nguồn Python này giúp mình một cách ngắn gọn, dễ hiểu.")}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 transition-colors"
              >
                💡 Giải thích code
              </button>
              <button
                onClick={() => handleSendAi("Kiểm tra xem mã nguồn này có lỗi cú pháp hoặc logic nào không và hướng dẫn cách khắc phục?")}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-colors"
              >
                🐛 Tìm lỗi giúp mình
              </button>
              <button
                onClick={() => handleSendAi("Gợi ý cách tối ưu thuật toán hoặc cách viết ngắn gọn chuẩn Python (Pythonic) hơn.")}
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
                  <span>Gia sư AI đang phân tích mã nguồn...</span>
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
                  placeholder="Hỏi Gia sư AI về bài tập, cú pháp..."
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
    </div>
  );
};
