import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { Lesson, Submission, TestCase, TestResult, UserProfile, ChatMessage } from "../types";
import { executeCodeHybrid, executeTestcasesHybrid } from "../lib/pythonRunner";
import { 
  Play, 
  Send, 
  RotateCcw, 
  Bot, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Terminal, 
  Code2, 
  FileCode, 
  ChevronRight, 
  ChevronLeft,
  Clock,
  Check,
  AlertTriangle,
  Lightbulb,
  Maximize2
} from "lucide-react";

interface CodingModuleProps {
  lesson: Lesson;
  currentUser: UserProfile;
  onBack: () => void;
  onSubmitWork: (submissionData: Partial<Submission>) => Promise<void>;
}

export const CodingModule: React.FC<CodingModuleProps> = ({
  lesson,
  currentUser,
  onBack,
  onSubmitWork,
}) => {
  const [language, setLanguage] = useState<"python" | "cpp">(lesson.language === "cpp" ? "cpp" : "python");
  const [code, setCode] = useState<string>(() => {
    try {
      const draft = localStorage.getItem(`lms_draft_${currentUser.uid}_${lesson.id}`);
      if (draft && draft.trim()) return draft;
    } catch {}
    return lesson.starterCode || "";
  });
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");

  // Persist draft on edit
  const handleCodeChange = (newVal?: string) => {
    const val = newVal ?? "";
    setCode(val);
    try {
      if (val.trim() && val !== (lesson.starterCode || "")) {
        localStorage.setItem(`lms_draft_${currentUser.uid}_${lesson.id}`, val);
      } else {
        localStorage.removeItem(`lms_draft_${currentUser.uid}_${lesson.id}`);
      }
    } catch {}
  };

  // Execution state
  const [activeBottomTab, setActiveBottomTab] = useState<"testcases" | "custom_input" | "console">("testcases");
  const [customStdin, setCustomStdin] = useState<string>("");
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [passedCount, setPassedCount] = useState<number>(0);
  const [hasRunTests, setHasRunTests] = useState<boolean>(false);

  // AI Assistant State
  const [isAiOpen, setIsAiOpen] = useState<boolean>(true);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Xin chào ${currentUser.displayName}! Mình là Trợ lý AI Gia sư Tin học. 

Khi bạn gặp khó khăn trong việc tư duy thuật toán hoặc bị lỗi cú pháp, hãy nhắn cho mình nhé. Mình sẽ **giải thích lỗi và gợi ý hướng đi** chứ không làm hộ toàn bộ bài tập để bạn rèn luyện tư duy tốt nhất! 🚀`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [aiInput, setAiInput] = useState<string>("");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const aiChatBottomRef = useRef<HTMLDivElement>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  const testcases: TestCase[] = lesson.testcases || [
    { id: 1, input: "10", expectedOutput: "30" },
    { id: 2, input: "5", expectedOutput: "6" },
  ];

  // Run Code (Quick Run with customStdin or testcase 1 input)
  const handleRunCode = async (forcedStdin?: string) => {
    setIsRunning(true);
    setActiveBottomTab("console");
    setConsoleOutput("⏳ Đang chuẩn bị môi trường & thực thi mã nguồn...");

    const stdinToUse = forcedStdin !== undefined
      ? forcedStdin
      : (customStdin.trim() !== "" ? customStdin : (testcases.length > 0 ? testcases[0].input : ""));

    try {
      const result = await executeCodeHybrid({
        language,
        code,
        stdin: stdinToUse,
      });

      if (result.error) {
        setConsoleOutput(`❌ Lỗi thực thi / Biên dịch:\n${result.error}\n\n${result.output || ""}`);
      } else {
        const inputNotice = stdinToUse ? `[Đầu vào (Stdin): ${stdinToUse}]` : `[Đầu vào (Stdin): (Trống)]`;
        setConsoleOutput(`🚀 Kết quả chạy thử (Thời gian: ${result.time || 0}ms):\n${inputNotice}\n------------------------------------\n${result.output || "(Chương trình chạy xong thành công, không có ký tự in ra màn hình)"}`);
      }
    } catch (err: any) {
      setConsoleOutput(`❌ Lỗi thực thi mã: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Run with custom Stdin
  const handleRunCustomInput = () => handleRunCode(customStdin);

  // Keyboard shortcut Ctrl + Enter or Cmd + Enter to Run Code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isRunning) {
          handleRunCode();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, language, customStdin, isRunning, testcases]);

  // Run All Testcases
  const handleRunAllTestcases = async () => {
    setIsRunning(true);
    setActiveBottomTab("testcases");
    setHasRunTests(true);

    try {
      const data = await executeTestcasesHybrid({
        language,
        code,
        testcases,
      });

      if (data.results) {
        setTestResults(data.results);
        setPassedCount(data.passedCount || 0);
      }
    } catch (err: any) {
      setActiveBottomTab("console");
      setConsoleOutput(`❌ Lỗi chấm testcases: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Ask AI
  const handleSendAiMessage = async (customPrompt?: string) => {
    const messageToSend = customPrompt || aiInput.trim();
    if (!messageToSend || isAiThinking) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setAiInput("");
    setIsAiThinking(true);

    setTimeout(() => {
      aiChatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          history: aiMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          codeContext: code,
          language,
          testResults: testResults.length > 0 ? testResults : undefined,
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
          content: "⚠️ Không thể kết nối tới Trợ lý AI. Vui lòng kiểm tra lại đường truyền mạng.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiThinking(false);
      setTimeout(() => {
        aiChatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // Submit Solution
  const handleSubmitSolution = async () => {
    setIsSubmitting(true);
    const score = testcases.length > 0 ? (passedCount / testcases.length) * 10 : 10;

    try {
      await onSubmitWork({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        studentId: currentUser.uid,
        studentName: currentUser.displayName,
        studentEmail: currentUser.email,
        moduleType: "coding",
        content: {
          language,
          code,
          passedCount,
          totalCount: testcases.length,
          testResults,
        },
        score: Math.round(score * 10) / 10,
        maxScore: 10,
        status: "graded",
      });
      setSubmittedSuccess(true);
      try {
        localStorage.removeItem(`lms_draft_${currentUser.uid}_${lesson.id}`);
      } catch {}
    } catch (e) {
      console.error("Submit error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Action Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
          >
            ← Thoát
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">{lesson.title}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                {lesson.level === "high" ? "Cấp THPT" : "Cấp THCS"}
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Language, Theme, Run, Submit */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => {
                setLanguage("python");
                if (code.includes("#include")) {
                  setCode("# Viết mã Python tại đây\n");
                }
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                language === "python"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Python 3</span>
            </button>
            <button
              onClick={() => {
                setLanguage("cpp");
                if (code.startsWith("# Nhập")) {
                  setCode("#include <iostream>\nusing namespace std;\n\nint main() {\n    // Code C++ tại đây\n    return 0;\n}\n");
                }
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                language === "cpp"
                  ? "bg-sky-500 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>C++ (GCC)</span>
            </button>
          </div>

          {/* Reset Code */}
          <button
            onClick={() => setCode(lesson.starterCode || "")}
            title="Khôi phục mã nguồn ban đầu"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* RUN CODE BUTTON (CHẠY THỬ CODE) */}
          <button
            onClick={() => handleRunCode()}
            disabled={isRunning}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 disabled:opacity-50"
            title="Chạy thử code ngay lập tức (Phím tắt: Ctrl + Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? "Đang chạy..." : "Chạy thử (Run)"}</span>
          </button>

          {/* RUN ALL TESTCASES BUTTON (CHẤM TEST CASE) */}
          <button
            onClick={handleRunAllTestcases}
            disabled={isRunning}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-700/60 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Chạy kiểm tra tự động tất cả các bộ test case"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">{isRunning ? "Đang chấm..." : "Chấm Test Case"}</span>
            <span className="sm:hidden">Chấm Test</span>
          </button>

          {/* Submit Solution Button */}
          <button
            onClick={handleSubmitSolution}
            disabled={isSubmitting || submittedSuccess}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              submittedSuccess
                ? "bg-blue-600/50 text-blue-200 border border-blue-500/50"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
            }`}
          >
            {submittedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đã nộp bài ({passedCount}/{testcases.length})</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bài</span>
              </>
            )}
          </button>

          {/* Toggle AI Sidebar */}
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              isAiOpen
                ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                : "bg-slate-800 text-indigo-300 border-indigo-800 hover:bg-slate-700"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trợ lý AI</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Editor & Testcases, Right AI Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Code Editor + Test Case Bottom Bar */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
          {/* Editor Header / Sub-bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-slate-200 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === "cpp" ? "solution.cpp" : "main.py"}</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                {language === "cpp" ? "C++ 17 (GCC)" : "Python 3.10"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] font-mono text-slate-300">Ctrl + Enter</kbd> để chạy
              </span>
              <button
                onClick={() => handleRunCode()}
                disabled={isRunning}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-xs shadow-emerald-600/30 disabled:opacity-50"
                title="Chạy thử code ngay lập tức (Phím tắt: Ctrl + Enter)"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Chạy thử code (Run)</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : "python"}
              theme={theme}
              value={code}
              onChange={handleCodeChange}
              options={{
                fontSize: 14,
                fontFamily: "Fira Code, JetBrains Mono, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Bottom Panel: Testcases / Custom Input / Console */}
          <div className="h-64 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0">
            {/* Tab Headers */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveBottomTab("testcases")}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    activeBottomTab === "testcases"
                      ? "bg-slate-800 text-sky-400 border border-slate-700"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bộ Test Case ({testcases.length})</span>
                  {hasRunTests && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      passedCount === testcases.length ? "bg-emerald-950 text-emerald-300 border border-emerald-700" : "bg-rose-950 text-rose-300 border border-rose-700"
                    }`}>
                      {passedCount}/{testcases.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveBottomTab("custom_input")}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    activeBottomTab === "custom_input"
                      ? "bg-slate-800 text-amber-400 border border-slate-700"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Nhập dữ liệu tay (Custom Stdin)</span>
                </button>

                <button
                  onClick={() => setActiveBottomTab("console")}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    activeBottomTab === "console"
                      ? "bg-slate-800 text-slate-200 border border-slate-700"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Console Log</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunCode()}
                  disabled={isRunning}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-xs shadow-emerald-600/30 disabled:opacity-50"
                  title="Chạy thử code (Ctrl + Enter)"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isRunning ? "Đang chạy..." : "Chạy thử (Run)"}</span>
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs">
              {/* TAB 1: TESTCASES */}
              {activeBottomTab === "testcases" && (
                <div className="space-y-2">
                  {testcases.map((tc, idx) => {
                    const result = testResults.find((r) => r.id === tc.id) || testResults[idx];
                    const isPassed = result?.passed;
                    const hasRun = !!result;

                    return (
                      <div
                        key={tc.id}
                        className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          hasRun
                            ? isPassed
                              ? "bg-emerald-950/30 border-emerald-800/60"
                              : "bg-rose-950/30 border-rose-800/60"
                            : "bg-slate-900/60 border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            hasRun
                              ? isPassed ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-sans font-semibold text-slate-200 flex items-center gap-2">
                              <span>Test Case #{idx + 1}</span>
                              {tc.isHidden && (
                                <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800">
                                  Test ẩn
                                </span>
                              )}
                              {hasRun && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isPassed ? "bg-emerald-900/80 text-emerald-300" : "bg-rose-900/80 text-rose-300"
                                }`}>
                                  {isPassed ? "PASSED ✅" : "WRONG ANSWER ❌"}
                                </span>
                              )}
                              {result?.time !== undefined && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3" />
                                  {result.time}ms
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Input: <code className="text-amber-300 bg-slate-950 px-1 rounded">{tc.input.replace(/\n/g, " ")}</code>
                            </div>
                          </div>
                        </div>

                        {/* Expected vs Actual */}
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div className="text-slate-400">
                            Kỳ vọng: <span className="text-emerald-400 font-semibold">{tc.expectedOutput}</span>
                          </div>
                          {hasRun && (
                            <div className="text-slate-400">
                              Thực tế: <span className={isPassed ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                                {result?.error ? `Lỗi: ${result.error.trim().split("\n")[0]}` : (result?.actualOutput?.trim() || "(trống)")}
                              </span>
                            </div>
                          )}
                          {!isPassed && hasRun && (
                            <button
                              onClick={() => {
                                setIsAiOpen(true);
                                handleSendAiMessage(
                                  `Tại sao mã nguồn của mình lại bị sai ở Test Case #${idx + 1}? (Input là "${tc.input}", kết quả kỳ vọng "${tc.expectedOutput}", nhưng máy in ra "${result?.actualOutput?.trim() || result?.error}"). Hãy gợi ý lỗi logic cho mình với!`
                                );
                              }}
                              className="px-2 py-1 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 rounded text-[11px] font-sans font-semibold transition-colors flex items-center gap-1 border border-indigo-700"
                            >
                              <Bot className="w-3 h-3" />
                              <span>Hỏi AI sửa test này</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: CUSTOM STDIN */}
              {activeBottomTab === "custom_input" && (
                <div className="h-full flex flex-col">
                  <label className="text-slate-400 text-[11px] mb-1 font-sans flex items-center justify-between">
                    <span>Nhập dữ liệu đầu vào (stdin) để chạy thử nghiệm tùy ý:</span>
                    <span className="text-slate-500 text-[10px]">Nhấn nút 'Chạy thử' sau khi nhập</span>
                  </label>
                  <textarea
                    value={customStdin}
                    onChange={(e) => setCustomStdin(e.target.value)}
                    placeholder="Ví dụ: 10"
                    className="flex-1 w-full p-2.5 bg-slate-900 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 font-mono text-xs resize-none"
                  />
                </div>
              )}

              {/* TAB 3: CONSOLE OUTPUT */}
              {activeBottomTab === "console" && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[11px] text-slate-400 shrink-0">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      Cửa sổ đầu ra chương trình (Terminal Output)
                    </span>
                    {consoleOutput && (
                      <button
                        onClick={() => setConsoleOutput("")}
                        className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Xóa console
                      </button>
                    )}
                  </div>
                  <pre className="flex-1 overflow-auto font-mono text-xs whitespace-pre-wrap text-slate-200 bg-slate-950/60 p-2.5 rounded-lg border border-slate-900 leading-relaxed">
                    {consoleOutput || "Chưa có dữ liệu. Bấm nút '▶ Chạy thử (Run)' hoặc nhấn 'Ctrl + Enter' để xem kết quả xuất ra màn hình."}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Assistant (Gemini) */}
        {isAiOpen && (
          <div className="w-80 md:w-96 bg-slate-950 flex flex-col shrink-0 border-l border-slate-800">
            {/* AI Header */}
            <div className="p-3 bg-indigo-950/60 border-b border-indigo-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Gia sư AI (Gemini)</h3>
                  <p className="text-[10px] text-indigo-300">Hướng dẫn tư duy • Không giải hộ</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Prompts Chips */}
            <div className="p-2 bg-slate-900/80 border-b border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => handleSendAiMessage("Bạn có thể giải thích lỗi cú pháp hoặc cảnh báo trong mã này giúp mình không?")}
                className="px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap border border-slate-700 flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Giải thích lỗi cú pháp</span>
              </button>
              <button
                onClick={() => handleSendAiMessage("Hãy gợi ý cho mình thuật toán và các bước logic để giải bài này mà không viết hộ code nhé!")}
                className="px-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap border border-slate-700 flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3 text-sky-400" />
                <span>Gợi ý thuật toán</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] p-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-xs"
                        : "bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-xs"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-invert prose-xs max-w-none space-y-1.5 leading-relaxed">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 p-3 bg-slate-900 text-slate-400 rounded-2xl border border-slate-800 text-xs w-fit">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Trợ lý AI đang phân tích mã nguồn...</span>
                </div>
              )}
              <div ref={aiChatBottomRef} />
            </div>

            {/* Chat Input */}
            <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAiMessage();
                  }
                }}
                placeholder="Hỏi AI về cú pháp, gợi ý thuật toán..."
                className="flex-1 px-3 py-2 bg-slate-950 text-slate-100 text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleSendAiMessage()}
                disabled={!aiInput.trim() || isAiThinking}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
