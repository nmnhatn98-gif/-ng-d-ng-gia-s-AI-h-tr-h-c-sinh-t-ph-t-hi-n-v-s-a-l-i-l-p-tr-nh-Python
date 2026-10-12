import React, { useState } from "react";
import { Lesson, Submission, UserProfile } from "../types";
import { 
  Sparkles, 
  ExternalLink, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Award,
  Send,
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface ElementaryModuleProps {
  lesson: Lesson;
  currentUser: UserProfile;
  onBack: () => void;
  onSubmitWork: (submissionData: Partial<Submission>) => Promise<void>;
}

export const ElementaryModule: React.FC<ElementaryModuleProps> = ({
  lesson,
  currentUser,
  onBack,
  onSubmitWork,
}) => {
  const [activeTab, setActiveTab] = useState<"scratch" | "quiz">(
    lesson.moduleType === "quiz" ? "quiz" : "scratch"
  );

  // Scratch State
  const [scratchId, setScratchId] = useState(lesson.scratchProjectId || "10128407");
  const [inputProjectId, setInputProjectId] = useState(lesson.scratchProjectId || "10128407");
  const [scratchShareUrl, setScratchShareUrl] = useState("");
  const [scratchSubmitted, setScratchSubmitted] = useState(false);
  const [isSubmittingScratch, setIsSubmittingScratch] = useState(false);

  // Quiz State
  const questions = lesson.questions || [];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // Handle Scratch Submit
  const handleSubmitScratch = async () => {
    if (!scratchShareUrl && !scratchId) return;
    setIsSubmittingScratch(true);
    try {
      await onSubmitWork({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        studentId: currentUser.uid,
        studentName: currentUser.displayName,
        studentEmail: currentUser.email,
        moduleType: "scratch",
        content: {
          videoUrl: scratchShareUrl || `https://scratch.mit.edu/projects/${scratchId}`,
          projectDescription: `Dự án Scratch ID: ${scratchId}. Học sinh đã hoàn thành các bước lập trình nhân vật.`,
        },
        score: 10,
        maxScore: 10,
        status: "submitted",
      });
      setScratchSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingScratch(false);
    }
  };

  // Handle Quiz selection
  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (selectedAnswers[questionIndex] !== undefined) return; // already answered
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
    setShowExplanation((prev) => ({ ...prev, [questionIndex]: true }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  };

  const handleFinishQuiz = async () => {
    setQuizFinished(true);
    setIsSubmittingQuiz(true);
    const score = calculateScore();
    try {
      await onSubmitWork({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        studentId: currentUser.uid,
        studentName: currentUser.displayName,
        studentEmail: currentUser.email,
        moduleType: "quiz",
        content: {
          quizAnswers: Object.values(selectedAnswers),
          passedCount: score,
          totalCount: questions.length,
        },
        score: score * 2.5, // Thang điểm 10 nếu 4 câu
        maxScore: 10,
        status: "graded",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setShowExplanation({});
    setCurrentQuestionIndex(0);
    setQuizFinished(false);
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50 p-6 rounded-3xl border border-amber-200/60 shadow-xs mb-6">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 flex items-center gap-1 transition-colors"
          >
            ← Quay lại danh sách bài học
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
              Cấp Tiểu Học (Lớp 1 - 5)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200">
              {lesson.durationMinutes} phút
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {lesson.title}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {lesson.description}
          </p>
        </div>

        {/* Module Switcher Buttons */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setActiveTab("scratch")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "scratch"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Dự án Scratch</span>
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "quiz"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Trắc nghiệm máy tính</span>
          </button>
        </div>
      </div>

      {/* SCRATCH TAB */}
      {activeTab === "scratch" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Embedded Scratch Player */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="ml-2 text-xs font-mono text-slate-300">
                  Scratch Player (ID: {scratchId})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://scratch.mit.edu/projects/${scratchId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200 underline"
                >
                  <span>Mở trên Scratch.mit.edu</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Iframe Viewport */}
            <div className="relative aspect-[4/3] w-full bg-slate-100">
              <iframe
                src={`https://scratch.mit.edu/projects/${scratchId}/embed`}
                allowTransparency={true}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                className="w-full h-full"
                title="Scratch Project Player"
              ></iframe>
            </div>

            {/* Change Project ID quick bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-600">Đổi mã dự án Scratch khác:</span>
                <input
                  type="text"
                  value={inputProjectId}
                  onChange={(e) => setInputProjectId(e.target.value)}
                  placeholder="Nhập ID (Ví dụ: 10128407)"
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 w-36"
                />
                <button
                  onClick={() => setScratchId(inputProjectId)}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Tải lại</span>
                </button>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span>💡 Bấm Cờ Xanh để bắt đầu, Nút Đỏ để dừng</span>
              </div>
            </div>
          </div>

          {/* Side Instructions & Submission */}
          <div className="space-y-5">
            {/* Guide Card */}
            <div className="bg-amber-50/80 rounded-3xl border border-amber-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-base mb-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Nhiệm vụ của em hôm nay:</span>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-amber-900">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Nhấn vào lá cờ xanh trên khung trò chơi để trải nghiệm điều khiển chú mèo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Sử dụng các khối lệnh <strong>Sự kiện</strong> và <strong>Chuyển động</strong> để lập trình cho mèo tự đuổi theo chuột.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Thêm âm thanh "Meow" mỗi khi mèo chạm trúng chú chuột!</span>
                </li>
              </ul>
            </div>

            {/* Submission Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Nộp kết quả bài làm</span>
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Dán đường link dự án Scratch của em đã chia sẻ để thầy cô chấm điểm và tặng huy hiệu nhé!
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link dự án Scratch hoặc ID:
                  </label>
                  <input
                    type="text"
                    value={scratchShareUrl}
                    onChange={(e) => setScratchShareUrl(e.target.value)}
                    placeholder="Ví dụ: https://scratch.mit.edu/projects/10128407/"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleSubmitScratch}
                  disabled={isSubmittingScratch || scratchSubmitted}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    scratchSubmitted
                      ? "bg-emerald-100 text-emerald-800 cursor-default"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md hover:shadow-blue-500/25"
                  }`}
                >
                  {scratchSubmitted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã nộp thành công! Thầy cô sẽ xem bài</span>
                    </>
                  ) : isSubmittingScratch ? (
                    <span>Đang nộp bài...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Nộp dự án Scratch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ TAB */}
      {activeTab === "quiz" && (
        <div className="max-w-3xl mx-auto">
          {questions.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <p className="text-slate-500">Chưa có câu hỏi trắc nghiệm cho bài học này.</p>
            </div>
          ) : !quizFinished ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              {/* Quiz Progress */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                  Câu hỏi {currentQuestionIndex + 1} / {questions.length}
                </span>
                <div className="text-xs text-slate-500 font-medium">
                  Đã trả lời: {Object.keys(selectedAnswers).length}/{questions.length} câu
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
                <div
                  className="bg-gradient-to-r from-sky-400 to-blue-600 h-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 leading-relaxed">
                {currentQ.question}
              </h2>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                  const isAnswered = selectedAnswers[currentQuestionIndex] !== undefined;
                  const isCorrect = idx === currentQ.correctIndex;

                  let btnStyle = "border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-800";
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold";
                    } else if (isSelected) {
                      btnStyle = "bg-rose-50 border-rose-400 text-rose-900";
                    } else {
                      btnStyle = "opacity-50 border-slate-200 text-slate-600";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(currentQuestionIndex, idx)}
                      className={`w-full p-4 rounded-2xl border-2 text-left text-sm transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Card if answered */}
              {showExplanation[currentQuestionIndex] && (
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 mb-6 animate-fade-in">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-sky-800">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>Giải thích chi tiết:</span>
                  </div>
                  <p>{currentQ.explanation}</p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  ← Câu trước
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Câu tiếp theo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishQuiz}
                    disabled={Object.keys(selectedAnswers).length === 0}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <Award className="w-4 h-4" />
                    <span>Hoàn thành & Xem điểm</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Results Card */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-900 flex items-center justify-center shadow-lg shadow-amber-400/30 mb-4">
                <Award className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Chúc mừng em đã hoàn thành bài trắc nghiệm!
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Em đã trả lời đúng{" "}
                <span className="font-bold text-emerald-600 text-base">
                  {calculateScore()} / {questions.length}
                </span>{" "}
                câu hỏi.
              </p>

              <div className="inline-flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
                <div className="text-left">
                  <div className="text-xs text-slate-500">Điểm tổng kết bài làm:</div>
                  <div className="text-2xl font-black text-slate-900">
                    {(calculateScore() * 2.5).toFixed(1)} / 10 điểm
                  </div>
                </div>
                <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                  {calculateScore() >= 3 ? "Đạt xuất sắc ⭐" : "Cần cố gắng thêm 👍"}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleResetQuiz}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm lại bài thi</span>
                </button>
                <button
                  onClick={onBack}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800"
                >
                  Về danh sách bài học
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
