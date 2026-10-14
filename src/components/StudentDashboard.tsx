import React, { useState } from "react";
import { Lesson, Submission, UserProfile, GradeLevel, ClassItem } from "../types";
import { 
  Code2, 
  FileCode, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Calendar,
  AlertCircle,
  RefreshCw,
  Sparkles,
  School,
  Key,
  Users,
  Check,
  Loader2,
  X
} from "lucide-react";
import { 
  extractGradeNumber, 
  getCurriculumTopicsForGrade 
} from "../data/curriculumData";
import { auth } from "../firebase";

interface StudentDashboardProps {
  lessons: Lesson[];
  submissions: Submission[];
  currentUser: UserProfile;
  classes?: ClassItem[];
  selectedLevel?: GradeLevel | "all";
  onSelectLesson: (lesson: Lesson) => void;
  onOpenHtmlLab?: () => void;
  onOpenPythonLab?: () => void;
  onUpdateCurrentUser?: (updatedUser: UserProfile) => void;
  onRefreshData?: () => Promise<void> | void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  lessons,
  submissions,
  currentUser,
  classes = [],
  selectedLevel,
  onSelectLesson,
  onOpenHtmlLab,
  onOpenPythonLab,
  onUpdateCurrentUser,
  onRefreshData,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  // Trích xuất số khối của học sinh từ classGrade/hồ sơ đã xác thực
  const studentRegisteredGrade = extractGradeNumber(currentUser.classGrade, currentUser.gradeLevel);
  const activeCurriculumTopics = getCurriculumTopicsForGrade(studentRegisteredGrade);

  // Bộ lọc danh sách bài tập: "need_work" (Bài cần làm) | "submitted" (Đã nộp) | "graded" (Đã có nhận xét)
  const [activeFilter, setActiveFilter] = useState<"need_work" | "submitted" | "graded">("need_work");

  // Thu gọn / mở rộng học liệu tham khảo
  const [isCurriculumExpanded, setIsCurriculumExpanded] = useState(false);

  // Join Class states
  const [isJoinClassModalOpen, setIsJoinClassModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinStep, setJoinStep] = useState<"input" | "confirm" | "success">("input");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [verifiedClass, setVerifiedClass] = useState<any | null>(null);
  const [joinSuccessMsg, setJoinSuccessMsg] = useState<string | null>(null);

  // Lớp học hiện tại của học sinh
  const studentClass = classes.find(
    (c) => c.status !== "deleted" && (c.id === currentUser.classId || c.name === currentUser.classGrade)
  );

  const handleOpenJoinModal = () => {
    setJoinCodeInput("");
    setJoinStep("input");
    setJoinError(null);
    setVerifiedClass(null);
    setJoinSuccessMsg(null);
    setIsJoinClassModalOpen(true);
  };

  const handleVerifyJoinCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = joinCodeInput.trim().toUpperCase();
    if (!clean) {
      setJoinError("Vui lòng nhập mã lớp học gồm 6 - 8 ký tự do thầy/cô cấp.");
      return;
    }
    setIsVerifying(true);
    setJoinError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/classes/verify-join-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: clean }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.class) {
        setVerifiedClass(data.class);
        setJoinStep("confirm");
      } else {
        setJoinError(data.error || "Mã lớp không hợp lệ hoặc không còn sử dụng được.");
      }
    } catch (err: any) {
      setJoinError("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại mạng Internet.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmJoinClass = async () => {
    const clean = joinCodeInput.trim().toUpperCase();
    if (!clean) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/classes/confirm-join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: clean }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJoinSuccessMsg(data.message || `🎉 Em đã tham gia thành công lớp ${data.class?.name || ""}!`);
        setJoinStep("success");
        if (data.student && onUpdateCurrentUser) {
          onUpdateCurrentUser(data.student);
        }
        if (onRefreshData) {
          await onRefreshData();
        }
      } else {
        setJoinError(data.error || "Không thể tham gia lớp học. Vui lòng thử lại.");
      }
    } catch (err: any) {
      setJoinError("Lỗi lưu trữ dữ liệu lớp: " + (err.message || "Kiểm tra mạng"));
    } finally {
      setIsJoining(false);
    }
  };

  // 1. Phân loại bài nộp của học sinh
  const mySubmissions = submissions.filter((s) => {
    if (s.studentId === currentUser.uid) return true;
    if (currentUser.email && s.studentEmail && s.studentEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (currentUser.displayName && s.studentName && s.studentName.toLowerCase() === currentUser.displayName.toLowerCase()) return true;
    if (currentUser.studentCode && s.studentId === currentUser.studentCode) return true;
    return false;
  });

  // 2. Lọc bài tập được giáo viên giao riêng cho học sinh / lớp của học sinh
  // (Loại trừ các bài học liệu mẫu bắt đầu bằng les-elem-, les-prog-, les-py10-, les-cpp-, les-stem-, les-web-)
  const teacherAssignedLessons = lessons.filter((l) => {
    const isReferenceSample = 
      l.id.startsWith("les-elem-") || 
      l.id.startsWith("les-prog-") || 
      l.id.startsWith("les-py10-") || 
      l.id.startsWith("les-cpp-") || 
      l.id.startsWith("les-stem-") || 
      l.id.startsWith("les-web-") || 
      l.id.startsWith("les-thcs-") || 
      l.id.startsWith("les-thpt-");
    if (isReferenceSample) return false;

    // Kiểm tra lớp áp dụng nếu có chỉ định targetClasses
    if (l.targetClasses && l.targetClasses.length > 0) {
      if (l.targetClasses.includes("all")) return true;
      if (currentUser.classGrade && l.targetClasses.includes(currentUser.classGrade)) return true;
      return false;
    }
    return true;
  });

  // Helper kiểm tra xem học sinh có bản nháp thực sự trong localStorage không
  const hasSavedDraft = (lessonId: string): boolean => {
    try {
      const draft = localStorage.getItem(`lms_draft_${currentUser.uid}_${lessonId}`);
      return !!(draft && draft.trim().length > 0);
    } catch {
      return false;
    }
  };

  // Helper định dạng hạn nộp
  const formatDueDate = (dueStr?: string) => {
    if (!dueStr) return null;
    const d = new Date(dueStr);
    if (isNaN(d.getTime())) return null;
    const isOverdue = d.getTime() < Date.now();
    const formatted = d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return { formatted, isOverdue };
  };

  // 3. Sắp xếp danh sách bài tập:
  // - Ưu tiên bài chưa nộp
  // - Với bài chưa nộp: bài có hạn gần nhất đứng trước
  // - Không tự coi bài không có hạn nộp là quá hạn
  const sortedLessons = [...teacherAssignedLessons].sort((a, b) => {
    const subA = mySubmissions.find((s) => s.lessonId === a.id);
    const subB = mySubmissions.find((s) => s.lessonId === b.id);

    // Chưa nộp đứng trước đã nộp
    if (!subA && subB) return -1;
    if (subA && !subB) return 1;

    // Cả hai đều chưa nộp: so sánh hạn nộp
    if (!subA && !subB) {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    // Cả hai đã nộp: sắp theo thời gian nộp mới nhất
    return new Date(subB!.submittedAt).getTime() - new Date(subA!.submittedAt).getTime();
  });

  // 4. Lọc bài theo tab đang chọn
  const filteredLessons = sortedLessons.filter((lesson) => {
    const submission = mySubmissions.find((s) => s.lessonId === lesson.id);
    if (activeFilter === "need_work") {
      return !submission;
    }
    if (activeFilter === "submitted") {
      return !!submission;
    }
    if (activeFilter === "graded") {
      return submission?.status === "graded";
    }
    return true;
  });

  // Đếm số lượng từ dữ liệu thật
  const needWorkCount = teacherAssignedLessons.filter(
    (l) => !mySubmissions.some((s) => s.lessonId === l.id)
  ).length;
  const submittedCount = mySubmissions.length;
  const gradedCount = mySubmissions.filter((s) => s.status === "graded").length;

  // 5. Phản hồi mới nhất từ giáo viên (vài nhận xét gần nhất)
  const recentFeedbacks = mySubmissions
    .filter((s) => s.status === "graded" && (s.teacherFeedback || typeof s.score === "number"))
    .sort((a, b) => new Date(b.gradedAt || b.submittedAt).getTime() - new Date(a.gradedAt || a.submittedAt).getTime())
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Header: Chào tài khoản & Thẻ Lớp học của tôi */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              <span>CodeHiểu</span>
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Học Python cùng gia sư AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Chào {currentUser.displayName || "em"}!
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Mã học sinh: <strong className="font-mono text-slate-800">{currentUser.studentCode || currentUser.uid}</strong>
            {currentUser.school ? ` · ${currentUser.school}` : ""}
          </p>
        </div>

        {/* LỚP HỌC CỦA TÔI / NÚT THAM GIA LỚP */}
        <div className="flex items-center gap-3">
          {studentClass || (currentUser.classGrade && currentUser.classGrade !== "Khách Trải Nghiệm") ? (
            <div className="bg-white border border-blue-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lớp của em:</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-xs">
                    {studentClass?.name || currentUser.classGrade}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {studentClass?.teacherName ? `GV: ${studentClass.teacherName}` : `Khối ${studentRegisteredGrade}`}
                  {studentClass?.schoolYear ? ` · ${studentClass.schoolYear}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenJoinModal}
                className="ml-1 sm:ml-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                title="Tham gia thêm lớp hoặc đổi lớp bằng mã"
              >
                <Key className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Đổi mã lớp</span>
                <span className="sm:hidden">Đổi mã</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex items-center justify-between gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900">Em chưa vào lớp học nào</div>
                  <p className="text-[11px] text-amber-700 mt-0.5">Nhập mã do thầy cô cấp để nhận bài tập chính khóa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenJoinModal}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Tham gia lớp ngay</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thông báo lỗi tải dữ liệu nếu có */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Bộ lọc số lượng thật: [Bài cần làm] [Đã nộp] [Đã có nhận xét] */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveFilter("need_work")}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] flex items-center gap-2 border cursor-pointer ${
            activeFilter === "need_work"
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span>Bài cần làm</span>
          {isLoading ? (
            <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
          ) : (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeFilter === "need_work" ? "bg-white/20 text-white font-semibold" : "bg-slate-100 text-slate-600"
              }`}
            >
              {needWorkCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("submitted")}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] flex items-center gap-2 border cursor-pointer ${
            activeFilter === "submitted"
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span>Đã nộp</span>
          {isLoading ? (
            <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
          ) : (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeFilter === "submitted" ? "bg-white/20 text-white font-semibold" : "bg-slate-100 text-slate-600"
              }`}
            >
              {submittedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("graded")}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] flex items-center gap-2 border cursor-pointer ${
            activeFilter === "graded"
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span>Đã có nhận xét</span>
          {isLoading ? (
            <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
          ) : (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeFilter === "graded" ? "bg-white/20 text-white font-semibold" : "bg-slate-100 text-slate-600"
              }`}
            >
              {gradedCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. Bố cục 2/3 (Vùng chính) và 1/3 (Vùng phụ) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VÙNG CHÍNH: BÀI CẦN LÀM (Chiếm ~2/3 chiều rộng) */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {activeFilter === "need_work"
                ? "Bài cần làm"
                : activeFilter === "submitted"
                ? "Bài đã nộp"
                : "Bài đã có nhận xét"}
            </h2>
            <span className="text-xs text-slate-500">
              {filteredLessons.length} bài
            </span>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredLessons.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">
                {activeFilter === "need_work"
                  ? "Em chưa có bài tập được giao."
                  : activeFilter === "submitted"
                  ? "Em chưa có bài nộp nào."
                  : "Chưa có bài tập nào có nhận xét từ giáo viên."}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {activeFilter === "need_work"
                  ? "Khi thầy cô giao bài mới cho lớp, bài tập sẽ tự động hiển thị ở đây. Em có thể vào phòng thực hành để tự luyện viết code."
                  : "Kết quả chấm bài và lời nhận xét sẽ xuất hiện sau khi giáo viên hoàn thành đánh giá."}
              </p>

              {activeFilter === "need_work" && (onOpenPythonLab || onOpenHtmlLab) && (
                <div className="mt-5 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPythonLab) onOpenPythonLab();
                      else if (onOpenHtmlLab) onOpenHtmlLab();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors min-h-[44px] cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Mở phòng thực hành</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Danh sách bài tập */}
          {!isLoading && filteredLessons.length > 0 && (
            <div className="space-y-3">
              {filteredLessons.map((lesson) => {
                const submission = mySubmissions.find((s) => s.lessonId === lesson.id);
                const isSubmitted = !!submission;
                const isGraded = submission?.status === "graded";
                const hasDraft = !isSubmitted && hasSavedDraft(lesson.id);
                const dueInfo = formatDueDate(lesson.dueDate);

                // Loại bài / Chủ đề
                const topicOrType =
                  lesson.subject ||
                  (lesson.moduleType === "coding"
                    ? "Lập trình Python"
                    : lesson.moduleType === "quiz"
                    ? "Trắc nghiệm"
                    : lesson.moduleType === "html"
                    ? "Web HTML"
                    : "Thực hành Tin học");

                // Trạng thái bằng chữ
                let statusText = "Chưa làm";
                let statusClass = "text-slate-500";
                if (isGraded) {
                  statusText = `Đã chấm (${submission.score}/${submission.maxScore} đ)`;
                  statusClass = "text-emerald-700 font-semibold";
                } else if (isSubmitted) {
                  statusText = "Đã nộp · Chờ đánh giá";
                  statusClass = "text-blue-700 font-medium";
                } else if (hasDraft) {
                  statusText = "Bản nháp đã lưu";
                  statusClass = "text-amber-700 font-medium";
                }

                // Nút hành động chính
                let actionLabel = "Làm bài";
                let actionClass = "bg-blue-600 hover:bg-blue-700 text-white";
                if (isGraded) {
                  actionLabel = "Xem nhận xét";
                  actionClass = "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50";
                } else if (isSubmitted) {
                  actionLabel = "Xem bài nộp";
                  actionClass = "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50";
                } else if (hasDraft) {
                  actionLabel = "Tiếp tục";
                  actionClass = "bg-amber-600 hover:bg-amber-700 text-white";
                }

                return (
                  <div
                    key={lesson.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Tiêu đề bài tập */}
                      <h3 className="text-base font-semibold text-slate-900 truncate">
                        {lesson.title}
                      </h3>

                      {/* Dòng metadata sạch không bọc pill, ngăn cách bằng dấu chấm giữa */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span>{topicOrType}</span>
                        <span aria-hidden="true">·</span>
                        <span>{lesson.durationMinutes} phút</span>

                        {dueInfo && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className={dueInfo.isOverdue && !isSubmitted ? "text-rose-600 font-semibold" : ""}>
                              {dueInfo.isOverdue && !isSubmitted ? "Quá hạn: " : "Hạn nộp: "}
                              {dueInfo.formatted}
                            </span>
                          </>
                        )}

                        <span aria-hidden="true">·</span>
                        <span className={statusClass}>{statusText}</span>
                      </div>

                      {/* Lời phê ngắn nếu có */}
                      {isGraded && submission.teacherFeedback && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2 line-clamp-2">
                          <span className="font-semibold text-slate-700">Lời phê: </span>
                          {submission.teacherFeedback}
                        </p>
                      )}
                    </div>

                    {/* Nút hành động duy nhất, chiều cao >= 44px */}
                    <div className="sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectLesson(lesson)}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] flex items-center justify-center gap-2 cursor-pointer ${actionClass}`}
                      >
                        <span>{actionLabel}</span>
                        <ArrowRight className="w-4 h-4 opacity-70" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* VÙNG PHỤ: THỰC HÀNH & PHẢN HỒI MỚI (Chiếm ~1/3 chiều rộng) */}
        <aside className="space-y-6">
          {/* 1. THỰC HÀNH — HAI LỐI TẮT NHỎ (NỀN TRẮNG) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Phòng thực hành
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Khu vực thực hành tự do không cần đề bài
              </p>
            </div>

            <div className="space-y-3">
              {/* Thẻ nhỏ Python */}
              {onOpenPythonLab && (
                <div className="border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-colors space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">Python</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Viết, chạy thử và tìm hiểu lỗi trong chương trình.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenPythonLab}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors min-h-[40px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Mở Python</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              )}

              {/* Thẻ nhỏ HTML/CSS */}
              {onOpenHtmlLab && (
                <div className="border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-colors space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">HTML/CSS</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Thiết kế trang web và xem kết quả trực tiếp.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenHtmlLab}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors min-h-[40px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Mở Web Studio</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. PHẢN HỒI MỚI */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Phản hồi mới
            </h2>

            {recentFeedbacks.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Em chưa có phản hồi mới từ giáo viên.
              </p>
            ) : (
              <div className="space-y-3">
                {recentFeedbacks.map((item) => {
                  const relatedLesson = lessons.find((l) => l.id === item.lessonId);
                  return (
                    <div
                      key={item.id}
                      onClick={() => relatedLesson && onSelectLesson(relatedLesson)}
                      className={`p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-colors ${
                        relatedLesson ? "cursor-pointer" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {item.lessonTitle}
                        </span>
                        {typeof item.score === "number" && (
                          <span className="text-xs font-bold text-emerald-700 shrink-0">
                            {item.score}/{item.maxScore} đ
                          </span>
                        )}
                      </div>

                      {item.teacherFeedback ? (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {item.teacherFeedback}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          Đã chấm điểm, không có lời phê thêm.
                        </p>
                      )}

                      {relatedLesson && (
                        <div className="mt-2 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                          <span>Xem bài liên quan</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 4. HỌC LIỆU THAM KHẢO THEO KHỐI (Ở DƯỚI BÀI TẬP, CÓ THỂ THU GỌN) */}
      <section className="mt-10 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Học liệu tham khảo Tin học Khối {studentRegisteredGrade}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chuyên đề trọng tâm GDPT 2018 dùng để tự học và tham khảo kiến thức
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCurriculumExpanded((prev) => !prev)}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>{isCurriculumExpanded ? "Thu gọn" : "Xem chi tiết"}</span>
            {isCurriculumExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isCurriculumExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 animate-fade-in">
            {activeCurriculumTopics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>Chuyên đề {topic.orderIndex}</span>
                  <span>{topic.gdptCode}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  {topic.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {topic.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {topic.recommendedLab === "python" ? "Lập trình Python" : "Web Studio"}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (topic.recommendedLab === "python" && onOpenPythonLab) {
                        onOpenPythonLab();
                      } else if (onOpenHtmlLab) {
                        onOpenHtmlLab();
                      }
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Mở thực hành</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL: THAM GIA LỚP BẰNG MÃ */}
      {isJoinClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tham gia lớp học</h3>
                  <p className="text-xs text-slate-500">Nhập mã tham gia do giáo viên bộ môn cấp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJoinClassModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {joinError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            {/* STEP 1: INPUT CODE */}
            {joinStep === "input" && (
              <form onSubmit={handleVerifyJoinCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mã lớp học (6 - 8 ký tự):
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    maxLength={12}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="VD: PY10A1"
                    className="w-full px-4 py-3 text-center font-mono text-lg font-black tracking-widest bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl uppercase focus:outline-none focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                    Mã lớp không phân biệt chữ hoa hay chữ thường.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsJoinClassModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying || !joinCodeInput.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra mã...</span>
                      </>
                    ) : (
                      <>
                        <span>Tiếp tục</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: CONFIRM CLASS INFORMATION */}
            {joinStep === "confirm" && verifiedClass && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/90 space-y-2.5">
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                    Thông tin lớp học tìm thấy:
                  </div>

                  <div className="text-base font-black text-slate-900 flex items-center gap-2">
                    <School className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>{verifiedClass.name}</span>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1 pt-1 border-t border-blue-200/60">
                    {verifiedClass.teacherName && (
                      <p>• <strong>Giáo viên phụ trách:</strong> {verifiedClass.teacherName}</p>
                    )}
                    {verifiedClass.gradeNumber && (
                      <p>• <strong>Khối lớp:</strong> Khối {verifiedClass.gradeNumber}</p>
                    )}
                    {verifiedClass.schoolYear && (
                      <p>• <strong>Năm học:</strong> {verifiedClass.schoolYear}</p>
                    )}
                    {verifiedClass.description && (
                      <p className="text-[11px] text-slate-500 italic mt-1">{verifiedClass.description}</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Em có xác nhận tham gia vào lớp học này để bắt đầu nhận bài tập và nộp bài làm không?
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isJoining}
                    onClick={() => {
                      setJoinStep("input");
                      setJoinError(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Nhập mã khác
                  </button>
                  <button
                    type="button"
                    disabled={isJoining}
                    onClick={handleConfirmJoinClass}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang lưu lớp học...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Xác nhận tham gia</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS CELEBRATION */}
            {joinStep === "success" && (
              <div className="text-center py-4 space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {joinSuccessMsg || "Đã tham gia lớp thành công!"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Danh sách bài tập và tiến trình học tập của lớp đã sẵn sàng cho em.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsJoinClassModalOpen(false)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Vào học ngay →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
