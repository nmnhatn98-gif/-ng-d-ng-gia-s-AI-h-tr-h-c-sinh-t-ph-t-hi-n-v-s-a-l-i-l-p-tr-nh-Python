import React, { useState, useEffect } from "react";
import { Lesson, UserProfile, Submission, QuizQuestion } from "../types";
import { auth } from "../firebase";
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowLeft, 
  Clock, 
  Award, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  BookOpen, 
  Share2,
  RefreshCw,
  ShieldCheck
} from "lucide-react";

interface QuizModuleProps {
  lesson: Lesson;
  currentUser: UserProfile;
  onSubmitWork: (submission: Partial<Submission>) => Promise<void>;
  onBack: () => void;
}

interface ServerQuizResult {
  score: number;
  correctCount: number;
  totalCount: number;
  reviewAllowed: boolean;
  review?: Array<{
    questionId: string;
    questionIndex: number;
    isCorrect: boolean;
    studentAnswer: number;
    correctIndex?: number;
    explanation?: string;
  }>;
  message?: string;
}

export const QuizModule: React.FC<QuizModuleProps> = ({
  lesson,
  currentUser,
  onSubmitWork,
  onBack,
}) => {
  const questions: QuizQuestion[] = lesson.questions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(() => {
    try {
      const draft = localStorage.getItem(`lms_draft_${currentUser.uid}_${lesson.id}`);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch {}
    return {};
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [serverResult, setServerResult] = useState<ServerQuizResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Timer State
  const initialSeconds = (lesson.durationMinutes || 20) * 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => {
      const updated = {
        ...prev,
        [currentIdx]: optionIndex,
      };
      try {
        localStorage.setItem(`lms_draft_${currentUser.uid}_${lesson.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const currentQuestion = questions[currentIdx];

  // Chấm bài hoàn toàn tại máy chủ (Server-side grading - Bảo vệ đáp án)
  const handleFinalSubmit = async () => {
    setIsSaving(true);
    setSubmitError(null);

    const timeSpent = initialSeconds - timeLeft;

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/lessons/${lesson.id}/submit-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          answers: selectedAnswers,
          timeSpentSeconds: timeSpent,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Lỗi máy chủ chấm bài (${res.status})`);
      }

      const resData = await res.json();
      const srvResult: ServerQuizResult = {
        score: resData.score,
        correctCount: resData.correctCount,
        totalCount: resData.totalCount,
        reviewAllowed: resData.reviewAllowed ?? true,
        review: resData.review,
        message: resData.message,
      };
      setServerResult(srvResult);

      // Cập nhật lên cấp cao hơn (App state)
      await onSubmitWork(resData.submission || {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        studentId: currentUser.uid,
        studentName: currentUser.displayName,
        studentEmail: currentUser.email,
        moduleType: "quiz",
        content: {
          quizAnswers: selectedAnswers,
          passedCount: resData.correctCount,
          totalCount: resData.totalCount,
        },
        score: resData.score,
        maxScore: 10,
        status: "graded",
      });

      setIsSubmitted(true);
      setShowConfirmModal(false);
      try {
        localStorage.removeItem(`lms_draft_${currentUser.uid}_${lesson.id}`);
      } catch {}
    } catch (e: any) {
      console.error("Lỗi nộp bài trắc nghiệm:", e);
      setSubmitError(e.message || "Không thể kết nối máy chủ chấm điểm. Dữ liệu bài làm đã được giữ nguyên, vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setServerResult(null);
    setSubmitError(null);
    setCurrentIdx(0);
    setTimeLeft(initialSeconds);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách bài học</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Level Badge */}
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {lesson.level === "elementary"
              ? "Tiểu học"
              : lesson.level === "middle"
              ? "THCS"
              : lesson.level === "high"
              ? "THPT"
              : "Robotics"}
          </span>

          {/* Timer Clock */}
          {!isSubmitted && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-black border transition-colors ${
                timeLeft < 180
                  ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-blue-600 tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Bài Thi Trắc Nghiệm Tương Tác</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
          {lesson.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          {lesson.description || "Hãy đọc kỹ câu hỏi và chọn phương án chính xác nhất."}
        </p>
      </div>

      {/* Questions not ready guard */}
      {questions.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">Đề thi chưa có câu hỏi</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Giáo viên có thể sử dụng tính năng &quot;Tạo Trắc Nghiệm&quot; trong mục Giáo viên để sinh câu hỏi bằng AI hoặc tạo thủ công.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
          >
            Quay lại
          </button>
        </div>
      ) : !isSubmitted ? (
        /* QUIZ TAKING INTERFACE */
        <div className="space-y-6">
          {/* Progress Bar & Question Palette */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">
                Tiến độ: <strong className="text-blue-600">{answeredCount}</strong> / {questions.length} câu
              </span>
              <span className="font-mono text-slate-400">
                {Math.round((answeredCount / questions.length) * 100)}%
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              ></div>
            </div>

            {/* Questions Jump Palette */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {questions.map((_, idx) => {
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center ${
                      isCurrent
                        ? "bg-slate-900 text-white ring-2 ring-blue-500 shadow-xs"
                        : isAnswered
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Box */}
          {currentQuestion && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-black text-xs rounded-xl">
                  Câu hỏi {currentIdx + 1} / {questions.length}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Chọn 1 đáp án đúng nhất
                </span>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                {currentQuestion.question}
              </div>

              {/* 4 Options */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt, oIdx) => {
                  const isChosen = selectedAnswers[currentIdx] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(oIdx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                        isChosen
                          ? "bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500"
                          : "bg-slate-50/60 hover:bg-slate-100/80 border-slate-200 text-slate-800"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                          isChosen
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600 border border-slate-300"
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 flex-1">
                        {opt}
                      </span>
                      {isChosen && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next & Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu Trước</span>
                </button>

                <div className="flex items-center gap-2">
                  {currentIdx < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Câu Tiếp Theo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Nộp Bài Thi</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Submit Floating trigger if last question reached */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Nộp bài ngay ({answeredCount}/{questions.length} câu đã chọn)</span>
            </button>
          </div>
        </div>
      ) : (
        /* RESULTS & EXPLANATION REVIEW SCREEN */
        <div className="space-y-6">
          {/* Result Banner Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-white flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/20 mb-4">
              <Award className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Kết Quả Bài Làm Của Em
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Đã ghi nhận bài thi vào hệ thống học tập và bảng vàng thành tích.
            </p>

            {submitError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSaving}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shrink-0 cursor-pointer"
                >
                  {isSaving ? "Đang thử lại..." : "Thử lại ngay"}
                </button>
              </div>
            )}

            <div className="my-6 inline-flex items-center gap-6 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <div className="text-3xl font-black text-blue-600 font-mono">
                  {serverResult?.score ?? 0}
                  <span className="text-sm text-slate-400 font-normal"> / 10 điểm</span>
                </div>
                <div className="text-[11px] font-bold text-slate-500 mt-0.5">Điểm máy chủ chấm</div>
              </div>

              <div className="w-px h-10 bg-slate-200"></div>

              <div>
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {serverResult?.correctCount ?? 0} / {serverResult?.totalCount ?? questions.length}
                </div>
                <div className="text-[11px] font-bold text-slate-500 mt-0.5">Số câu chính xác</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRestart}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm Lại Bài Thi</span>
              </button>
              <button
                onClick={onBack}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Về Trang Bài Học</span>
              </button>
            </div>
          </div>

          {/* Detailed Question Review List (Chỉ hiển thị khi máy chủ cho phép) */}
          {serverResult?.reviewAllowed && serverResult?.review ? (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Phân tích chi tiết từng câu hỏi & Lời giải thích từ máy chủ</span>
              </h3>

              {questions.map((q, idx) => {
                const qRev = serverResult.review?.find((r) => r.questionId === (q.id || `q${idx + 1}`) || r.questionIndex === idx);
                const isCorrect = qRev ? qRev.isCorrect : false;
                const studentChoice = qRev ? qRev.studentAnswer : selectedAnswers[idx];
                const correctIdx = qRev ? qRev.correctIndex : undefined;
                const explanation = qRev?.explanation || "";

                return (
                  <div
                    key={q.id || idx}
                    className={`bg-white p-5 rounded-2xl border transition-all space-y-3 ${
                      isCorrect ? "border-emerald-200" : "border-red-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                            isCorrect
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 whitespace-pre-wrap">
                          {q.question}
                        </p>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                          isCorrect
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Đúng (+{(10 / questions.length).toFixed(1)}đ)
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Chưa đúng
                          </>
                        )}
                      </span>
                    </div>

                    {/* 4 Options with indicators */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                      {q.options.map((opt, oIdx) => {
                        const isStudent = studentChoice === oIdx;
                        const isAnswer = correctIdx === oIdx;

                        let style = "bg-slate-50 text-slate-600 border-slate-200";
                        if (isAnswer) {
                          style = "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold";
                        } else if (isStudent && !isAnswer) {
                          style = "bg-red-50 text-red-900 border-red-300 font-semibold";
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`text-xs p-2.5 rounded-xl border flex items-center gap-2 ${style}`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md text-[10px] font-mono font-black flex items-center justify-center shrink-0 ${
                                isAnswer
                                  ? "bg-emerald-600 text-white"
                                  : isStudent
                                  ? "bg-red-600 text-white"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="truncate">{opt}</span>
                            {isAnswer && (
                              <span className="text-[10px] text-emerald-700 font-bold ml-auto shrink-0">
                                Đáp án đúng
                              </span>
                            )}
                            {isStudent && !isAnswer && (
                              <span className="text-[10px] text-red-600 font-bold ml-auto shrink-0">
                                Em chọn
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pedagogical Explanation Box */}
                    {explanation && (
                      <div className="pl-8 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-slate-600 leading-relaxed">
                          <strong className="text-slate-800">Giải thích chi tiết: </strong>
                          {explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-3xl text-center space-y-2 max-w-xl mx-auto">
              <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">Đáp Án Được Bảo Mật Tự Động</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống máy chủ đã ghi nhận và chấm điểm an toàn bài thi của em. Để đảm bảo tính trung thực học đường, đáp án và lời giải chi tiết sẽ được công bố sau khi kết thúc đợt kiểm tra quy định.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM SUBMISSION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-slate-900 text-base">Xác Nhận Nộp Bài Thi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Em đã hoàn thành <strong className="text-blue-600">{answeredCount}</strong> / {questions.length} câu hỏi.
              {answeredCount < questions.length && (
                <span className="block text-red-500 font-bold mt-1">
                  ⚠️ Còn {questions.length - answeredCount} câu chưa được chọn đáp án!
                </span>
              )}
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                {isSaving ? "Đang lưu..." : "Xác Nhận Nộp Bài"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
