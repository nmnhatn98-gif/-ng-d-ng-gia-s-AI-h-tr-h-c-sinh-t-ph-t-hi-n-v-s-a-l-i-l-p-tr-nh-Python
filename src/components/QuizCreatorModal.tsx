import React, { useState } from "react";
import { QuizQuestion, GradeLevel, Lesson } from "../types";
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  Clock, 
  AlertCircle,
  Wand2,
  ListPlus,
  RefreshCw,
  Check,
  ChevronRight,
  Lightbulb,
  X
} from "lucide-react";

interface QuizCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveQuiz: (lessonData: Partial<Lesson>) => Promise<void>;
  initialGradeLevel?: GradeLevel;
}

export const QuizCreatorModal: React.FC<QuizCreatorModalProps> = ({
  isOpen,
  onClose,
  onSaveQuiz,
  initialGradeLevel = "middle",
}) => {
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  // General Quiz Info
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(initialGradeLevel);
  const [durationMinutes, setDurationMinutes] = useState<number>(20);

  // AI Generator Form State
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState<number>(4);
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [aiSourceText, setAiSourceText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Questions List
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Manual Question Form State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [manualQuestionText, setManualQuestionText] = useState("");
  const [manualOptions, setManualOptions] = useState<string[]>([
    "Lựa chọn A",
    "Lựa chọn B",
    "Lựa chọn C",
    "Lựa chọn D",
  ]);
  const [manualCorrectIndex, setManualCorrectIndex] = useState<number>(0);
  const [manualExplanation, setManualExplanation] = useState("");

  // Quick Topic Suggestions by Level
  const quickTopics: Record<GradeLevel, string[]> = {
    elementary: [
      "Bộ phận máy tính & Thiết bị vào/ra",
      "An toàn thông tin & Văn hóa dùng Internet",
      "Lệnh chuyển động & Âm thanh trong Scratch",
      "Biểu tượng thư mục & Tệp tin",
    ],
    middle: [
      "Cú pháp câu lệnh rẽ nhánh if - else trong Python",
      "Vòng lặp for và while trong lập trình Python",
      "Kiểu dữ liệu số, chuỗi ký tự và biến nhớ",
      "Thuật toán sắp xếp nổi bọt (Bubble Sort) cơ bản",
    ],
    high: [
      "Cấu trúc dữ liệu Mảng và Vector trong C++",
      "Thuật toán Tìm kiếm nhị phân & Độ phức tạp O(log N)",
      "Đệ quy và bài toán Tháp Hà Nội",
      "Kỹ thuật xử lý Xâu ký tự nâng cao",
    ],
    robotics: [
      "Nguyên lý cảm biến khoảng cách siêu âm (Ultrasonic)",
      "Động cơ Servo vs Động cơ DC: Ứng dụng điều khiển góc",
      "Cảm biến dò đường (Line Follower) & Hồng ngoại IR",
      "Cấu trúc chương trình Arduino: setup() và loop()",
    ],
  };

  if (!isOpen) return null;

  // Handle Call AI Endpoint
  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      setAiError("Vui lòng nhập chủ đề câu hỏi hoặc chọn từ gợi ý bên dưới.");
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const response = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          level: gradeLevel,
          count: aiCount,
          difficulty: aiDifficulty,
          sourceText: aiSourceText,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const textSample = await response.text().catch(() => "");
        const isHtml = textSample.trim().startsWith("<") || contentType.includes("text/html");
        throw new Error(
          isHtml
            ? `Máy chủ trả về HTML thay vì JSON (HTTP ${response.status}). Vui lòng kiểm tra backend API.`
            : `Định dạng phản hồi không hợp lệ (${contentType.split(";")[0] || "unknown"}, HTTP ${response.status}).`
        );
      }

      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error("Không thể phân tích dữ liệu JSON phản hồi từ máy chủ.");
      }

      if (!response.ok) {
        throw new Error(data?.error || `Lỗi máy chủ (${response.status})`);
      }

      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions((prev) => [...prev, ...data.questions]);
        setAiSuccessMessage(
          `✨ Gemini AI đã tạo thành công ${data.questions.length} câu hỏi trắc nghiệm! Bạn có thể xem và chỉnh sửa bên dưới.`
        );

        // Auto populate title if blank
        if (!quizTitle.trim()) {
          setQuizTitle(`Bài trắc nghiệm: ${aiTopic}`);
        }
        if (!quizDescription.trim()) {
          setQuizDescription(
            `Đề kiểm tra trắc nghiệm ${data.questions.length} câu về chủ đề "${aiTopic}" dành cho cấp ${
              gradeLevel === "elementary"
                ? "Tiểu học"
                : gradeLevel === "middle"
                ? "THCS"
                : gradeLevel === "high"
                ? "THPT"
                : "Robotics"
            }.`
          );
        }
      } else {
        setAiError(data?.error || "Không thể tạo câu hỏi, vui lòng thử lại.");
      }
    } catch (err: any) {
      setAiError(`Lỗi kết nối: ${err.message || "Vui lòng thử lại"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Add / Update Manual Question
  const handleSaveManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestionText.trim()) return;

    if (editingQuestionId) {
      // Update existing
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestionId
            ? {
                ...q,
                question: manualQuestionText,
                options: [...manualOptions],
                correctIndex: manualCorrectIndex,
                explanation: manualExplanation,
              }
            : q
        )
      );
      setEditingQuestionId(null);
    } else {
      // Add new
      const newQ: QuizQuestion = {
        id: `q-manual-${Date.now()}`,
        question: manualQuestionText,
        options: [...manualOptions],
        correctIndex: manualCorrectIndex,
        explanation: manualExplanation || "Đáp án đúng theo chuẩn kiến thức.",
      };
      setQuestions((prev) => [...prev, newQ]);
    }

    // Reset manual form
    setManualQuestionText("");
    setManualOptions(["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"]);
    setManualCorrectIndex(0);
    setManualExplanation("");
  };

  const handleEditQuestion = (q: QuizQuestion) => {
    setEditingQuestionId(q.id);
    setManualQuestionText(q.question);
    setManualOptions([...q.options]);
    setManualCorrectIndex(q.correctIndex);
    setManualExplanation(q.explanation || "");
    setMode("manual");
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (editingQuestionId === id) {
      setEditingQuestionId(null);
      setManualQuestionText("");
    }
  };

  // Final Save Lesson
  const handleSaveCompleteQuiz = async () => {
    if (!quizTitle.trim()) {
      alert("Vui lòng nhập Tiêu đề đề thi / bài trắc nghiệm!");
      return;
    }
    if (questions.length === 0) {
      alert("Đề thi cần có ít nhất 1 câu hỏi trắc nghiệm!");
      return;
    }

    await onSaveQuiz({
      title: quizTitle.trim(),
      description:
        quizDescription.trim() ||
        `Đề kiểm tra trắc nghiệm ${questions.length} câu hỏi kiến thức Tin học & STEM.`,
      level: gradeLevel,
      moduleType: "quiz",
      durationMinutes: durationMinutes || 20,
      questions: questions,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base sm:text-lg tracking-tight flex items-center gap-2">
                <span>Biên Soạn Trắc Nghiệm - CodeHiểu</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  AI & Thủ công
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Tạo nhanh bộ câu hỏi bằng Gemini AI hoặc soạn thảo từng câu thủ công chuẩn sư phạm.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* General Quiz Information Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Thông tin chung của đề thi</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đề thi / bài kiểm tra trắc nghiệm: *
                </label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra 15 phút: Cú pháp vòng lặp và câu lệnh rẽ nhánh"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dành cho cấp học:
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="elementary">Tiểu học (Lớp 3 - 5)</option>
                  <option value="middle">THCS (Lớp 6 - 9)</option>
                  <option value="high">THPT (Lớp 10 - 12)</option>
                  <option value="robotics">CLB Robotics & STEM</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả / Hướng dẫn làm bài:
                </label>
                <input
                  type="text"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Ví dụ: Học sinh làm bài trong 15 phút, chọn 1 phương án đúng nhất cho mỗi câu hỏi."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Thời gian (phút):</span>
                </label>
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 15)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Mode Switcher: AI Generator vs Manual Creation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. Phương thức tạo câu hỏi</span>
              </h3>
              <div className="text-xs font-bold text-slate-500">
                Hiện có: <span className="text-blue-600 font-black">{questions.length}</span> câu hỏi trong đề
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => setMode("ai")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === "ai"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tạo Tự Động Bằng Trợ Lý AI (Gemini)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === "manual"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ListPlus className="w-3.5 h-3.5 text-blue-500" />
                <span>Soạn Thảo Thủ Công Từng Câu</span>
              </button>
            </div>

            {/* AI GENERATOR PANEL */}
            {mode === "ai" && (
              <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 rounded-2xl border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="font-bold text-xs text-indigo-900">
                      Sinh đề trắc nghiệm chuẩn sư phạm bằng Gemini AI
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Model: Gemini 3.8 Flash</span>
                </div>

                {/* Topic Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chủ đề kiến thức cần kiểm tra: *
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Ví dụ: Vòng lặp For và While trong Python, hoặc Cảm biến siêu âm trong Robotics..."
                    className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  {/* Quick Topics Pills */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-500" /> Gợi ý nhanh:
                    </span>
                    {quickTopics[gradeLevel]?.map((topic, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAiTopic(topic)}
                        className="text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 rounded-lg border border-indigo-200 transition-colors"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count & Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số lượng câu hỏi muốn tạo:
                    </label>
                    <div className="flex items-center gap-2">
                      {[3, 4, 5, 8].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setAiCount(n)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            aiCount === n
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {n} câu
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mức độ nhận thức:
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="easy">Nhận biết & Thông hiểu cơ bản (Dễ)</option>
                      <option value="medium">Thông hiểu & Vận dụng tiêu chuẩn (Trung bình)</option>
                      <option value="hard">Vận dụng cao & Phân tích thuật toán (Nâng cao)</option>
                    </select>
                  </div>
                </div>

                {/* Optional Source Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tài liệu / Giáo trình bổ sung để AI bám sát (tùy chọn):
                  </label>
                  <textarea
                    rows={2}
                    value={aiSourceText}
                    onChange={(e) => setAiSourceText(e.target.value)}
                    placeholder="Dán đoạn văn bản lý thuyết sách giáo khoa, ghi chú bài giảng..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Feedback Alerts */}
                {aiError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}
                {aiSuccessMessage && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{aiSuccessMessage}</span>
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={handleGenerateAI}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>AI đang phân tích kiến thức & tạo câu hỏi...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>AI Tạo Bộ Câu Hỏi Trắc Nghiệm Ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* MANUAL CREATOR PANEL */}
            {mode === "manual" && (
              <form
                onSubmit={handleSaveManualQuestion}
                className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    {editingQuestionId ? "Đang chỉnh sửa câu hỏi" : "Soạn câu hỏi trắc nghiệm mới"}
                  </span>
                  {editingQuestionId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestionId(null);
                        setManualQuestionText("");
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                    >
                      Hủy chế độ sửa
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nội dung câu hỏi: *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={manualQuestionText}
                    onChange={(e) => setManualQuestionText(e.target.value)}
                    placeholder="Nhập câu hỏi (Ví dụ: Trong Python, hàm nào dùng để nhận dữ liệu từ bàn phím?)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                {/* 4 Options with Radio Select for Correct Answer */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Các phương án lựa chọn (Click chọn nút tròn bên cạnh phương án ĐÚNG): *
                  </label>
                  {manualOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                        manualCorrectIndex === idx
                          ? "bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <label className="flex items-center gap-1.5 cursor-pointer pl-1">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={manualCorrectIndex === idx}
                          onChange={() => setManualCorrectIndex(idx)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span
                          className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                            manualCorrectIndex === idx
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const updated = [...manualOptions];
                          updated[idx] = e.target.value;
                          setManualOptions(updated);
                        }}
                        placeholder={`Nội dung lựa chọn ${String.fromCharCode(65 + idx)}`}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800"
                      />
                      {manualCorrectIndex === idx && (
                        <span className="text-[11px] font-bold text-emerald-700 pr-2 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Đáp án Đúng
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lời giải thích / Căn cứ đáp án:
                  </label>
                  <input
                    type="text"
                    value={manualExplanation}
                    onChange={(e) => setManualExplanation(e.target.value)}
                    placeholder="Giải thích vì sao phương án này là đáp án chính xác..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingQuestionId ? "Cập Nhật Câu Hỏi" : "Thêm Vào Danh Sách Đề Thi"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* QUESTIONS LIST & REVIEW SECTION */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Danh sách câu hỏi trong đề thi ({questions.length} câu)</span>
              </h3>
              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Bạn có chắc muốn xóa tất cả câu hỏi trong danh sách này?")) {
                      setQuestions([]);
                    }
                  }}
                  className="text-[11px] text-red-500 hover:text-red-700 font-semibold"
                >
                  Xóa toàn bộ
                </button>
              )}
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Chưa có câu hỏi nào trong đề thi</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hãy bấm nút &quot;AI Tạo Bộ Câu Hỏi&quot; ở trên hoặc tự soạn thảo thủ công từng câu.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, qIndex) => (
                  <div
                    key={q.id || qIndex}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          {qIndex + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 whitespace-pre-wrap">
                            {q.question}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditQuestion(q)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa câu này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa câu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 4 Options Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`text-xs p-2 rounded-xl flex items-center gap-2 border ${
                            q.correctIndex === oIdx
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-md text-[10px] font-mono font-black flex items-center justify-center shrink-0 ${
                              q.correctIndex === oIdx
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="truncate">{opt}</span>
                          {q.correctIndex === oIdx && (
                            <Check className="w-3 h-3 text-emerald-600 ml-auto shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="pl-8 text-[11px] text-slate-500 bg-slate-50/70 p-2 rounded-xl border border-slate-100 flex items-start gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-700">Giải thích:</strong> {q.explanation}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Tổng cộng: <strong className="text-slate-900">{questions.length}</strong> câu hỏi trắc nghiệm
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveCompleteQuiz}
              disabled={questions.length === 0}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu Đề Thi Vào Ngân Hàng Đề</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
