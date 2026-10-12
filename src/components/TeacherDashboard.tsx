import React, { useState, useMemo } from "react";
import { 
  Lesson, 
  Submission, 
  ClassItem, 
  RubricCriteria, 
  GradeLevel, 
  UserProfile, 
  TeacherDebugEvaluation 
} from "../types";
import { 
  LayoutDashboard,
  School,
  FileText,
  CheckSquare,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  UserCheck,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Clock,
  Sparkles,
  Bot,
  Terminal,
  LogOut,
  AlertCircle,
  Menu,
  X,
  ExternalLink,
  Code2,
  HelpCircle,
  Save,
  ShieldCheck,
  HardDrive,
  Cpu
} from "lucide-react";
import { ExamCreationSystem } from "./ExamCreationSystem";
import { StudentAccountManager } from "./StudentAccountManager";
import { CreateClassModal } from "./CreateClassModal";
import { CreateAssignmentModal } from "./CreateAssignmentModal";
import { TeacherUgotManager } from "./TeacherUgotManager";
import { getStoredStudents } from "../data/studentService";
import { auth } from "../firebase";

interface TeacherDashboardProps {
  lessons: Lesson[];
  submissions: Submission[];
  classes: ClassItem[];
  currentUser?: UserProfile;
  onAddLesson: (newLesson: Partial<Lesson>) => Promise<void>;
  onDeleteLesson: (lessonId: string) => Promise<void>;
  onGradeSubmission: (submissionId: string, rubric: RubricCriteria, score: number, feedback: string) => Promise<void>;
  onAddClass?: (newClass: ClassItem) => Promise<void> | void;
  onDeleteClass?: (classId: string) => Promise<void> | void;
  onSwitchToStudent?: () => void;
  onLogout?: () => void;
  onOpenLogin?: (role?: "student" | "teacher") => void;
  onOpenPythonLab?: () => void;
  onOpenHtmlLab?: () => void;
}

type MainNavTab = "overview" | "classes" | "assignments" | "grading" | "reports" | "ugot-bridge" | "settings";

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  lessons,
  submissions,
  classes,
  currentUser,
  onAddLesson,
  onDeleteLesson,
  onGradeSubmission,
  onAddClass,
  onDeleteClass,
  onSwitchToStudent,
  onLogout,
  onOpenPythonLab,
  onOpenHtmlLab,
}) => {
  // Navigation State
  const [activeNav, setActiveNav] = useState<MainNavTab>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Class Filter (Persists across tabs)
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  // Submissions & Grading States
  const [gradingFilter, setGradingFilter] = useState<"submitted" | "graded" | "all">("submitted");
  const [gradingSearch, setGradingSearch] = useState("");
  const [gradingAssignmentFilter, setGradingAssignmentFilter] = useState<string>("all");
  const [selectedSubForDetail, setSelectedSubForDetail] = useState<Submission | null>(null);
  const [detailTab, setDetailTab] = useState<"work" | "process" | "evaluation">("evaluation");

  // Python Evaluation Criteria States (4 Criteria: 0 - 2.5 pts each)
  const [evalErrorId, setEvalErrorId] = useState<number>(2.5);
  const [evalReason, setEvalReason] = useState<number>(2.5);
  const [evalFix, setEvalFix] = useState<number>(2.5);
  const [evalApply, setEvalApply] = useState<number>(2.5);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [saveGradingStatus, setSaveGradingStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveGradingError, setSaveGradingError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Robotics / Non-Python Rubric
  const [rubricIdea, setRubricIdea] = useState<number>(8);
  const [rubricTechnique, setRubricTechnique] = useState<number>(8);
  const [rubricPresentation, setRubricPresentation] = useState<number>(8);
  const [customScore, setCustomScore] = useState<number>(10);

  // Assignments States
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<string>("all");
  const [isUnifiedCreateAssignmentOpen, setIsUnifiedCreateAssignmentOpen] = useState(false);
  const [isExamSystemOpen, setIsExamSystemOpen] = useState(false);

  // Classes States
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const [viewingClassDetail, setViewingClassDetail] = useState<ClassItem | null>(null);

  // Reports States
  const [reportAssignmentFilter, setReportAssignmentFilter] = useState<string>("all");
  const [reportDateRange, setReportDateRange] = useState<"all" | "7d" | "30d">("all");

  // Backup & Restore State
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  // Copy status helper
  const [copiedCode, setCopiedCode] = useState(false);

  // Real students count from storage
  const storedStudents = useMemo(() => getStoredStudents(), []);

  // Filter Submissions based on Class, Assignment, Status, Search
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Status Filter
      if (gradingFilter !== "all" && sub.status !== gradingFilter) return false;

      // 2. Class Filter
      if (selectedClassId !== "all") {
        const studentObj = storedStudents.find((st) => st.uid === sub.studentId);
        const matchClass = studentObj?.classGrade === selectedClassId;
        const matchTarget = (classes.find((c) => c.name === selectedClassId)?.id === sub.lessonId);
        if (!matchClass && !matchTarget) return false;
      }

      // 3. Assignment Filter
      if (gradingAssignmentFilter !== "all" && sub.lessonId !== gradingAssignmentFilter) return false;

      // 4. Student Search
      if (gradingSearch.trim()) {
        const q = gradingSearch.toLowerCase();
        const matchName = (sub.studentName || "").toLowerCase().includes(q);
        const matchCode = (sub.content?.debugSession?.studentCode || sub.studentId || "").toLowerCase().includes(q);
        const matchTitle = (sub.lessonTitle || "").toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchTitle) return false;
      }

      return true;
    });
  }, [submissions, gradingFilter, selectedClassId, gradingAssignmentFilter, gradingSearch, storedStudents, classes]);

  // Counts
  const pendingCount = useMemo(() => submissions.filter((s) => s.status === "submitted").length, [submissions]);
  const gradedCount = useMemo(() => submissions.filter((s) => s.status === "graded").length, [submissions]);
  const managedClassesCount = classes.length;
  const totalStudentsCount = storedStudents.length;

  // Open Grading Detail for a Submission
  const handleOpenGradingDetail = (sub: Submission) => {
    setSelectedSubForDetail(sub);
    setSaveGradingStatus("idle");
    setSaveGradingError(null);
    setHasUnsavedChanges(false);

    if (sub.evaluation) {
      setEvalErrorId(sub.evaluation.errorIdentification ?? 2.5);
      setEvalReason(sub.evaluation.reasonExplanation ?? 2.5);
      setEvalFix(sub.evaluation.correctFix ?? 2.5);
      setEvalApply(sub.evaluation.application ?? 2.5);
      setGradeFeedback(sub.evaluation.feedback || sub.teacherFeedback || "");
    } else {
      setEvalErrorId(2.5);
      setEvalReason(2.0);
      setEvalFix(2.5);
      setEvalApply(2.0);
      setGradeFeedback(sub.teacherFeedback || "");
    }

    if (sub.rubric) {
      setRubricIdea(sub.rubric.idea);
      setRubricTechnique(sub.rubric.technique);
      setRubricPresentation(sub.rubric.presentation);
    } else {
      setRubricIdea(8);
      setRubricTechnique(8);
      setRubricPresentation(8);
    }

    setCustomScore(typeof sub.score === "number" ? sub.score : 10);
    setDetailTab("evaluation");
  };

  // Close Grading Detail
  const handleCloseGradingDetail = () => {
    if (hasUnsavedChanges && saveGradingStatus !== "success") {
      const confirmLeave = window.confirm("Bạn có thay đổi điểm hoặc nhận xét chưa lưu. Bạn có chắc muốn đóng?");
      if (!confirmLeave) return;
    }
    setSelectedSubForDetail(null);
    setHasUnsavedChanges(false);
  };

  // Calculate Total Score for Python 4 Criteria
  const calculatedPythonScore = useMemo(() => {
    return Number((evalErrorId + evalReason + evalFix + evalApply).toFixed(1));
  }, [evalErrorId, evalReason, evalFix, evalApply]);

  // Save Grade Execution
  const handleSaveEvaluation = async () => {
    if (!selectedSubForDetail) return;
    setSaveGradingStatus("saving");
    setSaveGradingError(null);

    const isPython = Boolean(selectedSubForDetail.content?.debugSession || selectedSubForDetail.moduleType === "coding");
    const isRobotics = selectedSubForDetail.moduleType === "robotics";
    const totalScore = isPython 
      ? calculatedPythonScore 
      : (isRobotics ? rubricIdea + rubricTechnique + rubricPresentation : customScore);

    const evaluationData: TeacherDebugEvaluation = {
      errorIdentification: evalErrorId,
      reasonExplanation: evalReason,
      correctFix: evalFix,
      application: evalApply,
      totalScore: calculatedPythonScore,
      feedback: gradeFeedback,
      approvedByTeacher: true,
      gradedAt: new Date().toISOString(),
    };

    try {
      const token = await auth.currentUser?.getIdToken();
      // 1. Save to Backend with Auth
      const srvRes = await fetch(`/api/submissions/${selectedSubForDetail.id}/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          score: totalScore,
          rubric: {
            idea: rubricIdea,
            technique: rubricTechnique,
            presentation: rubricPresentation,
            feedback: gradeFeedback,
          },
          evaluation: isPython ? evaluationData : undefined,
          teacherFeedback: gradeFeedback,
        }),
      });

      if (!srvRes.ok) {
        const errJson = await srvRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Máy chủ từ chối chấm bài (${srvRes.status})`);
      }

      // 2. Update state via prop
      await onGradeSubmission(
        selectedSubForDetail.id,
        {
          idea: rubricIdea,
          technique: rubricTechnique,
          presentation: rubricPresentation,
          feedback: gradeFeedback,
        },
        totalScore,
        gradeFeedback
      );

      // Update local detailed sub state
      setSelectedSubForDetail({
        ...selectedSubForDetail,
        score: totalScore,
        status: "graded",
        teacherFeedback: gradeFeedback,
        evaluation: isPython ? evaluationData : undefined,
        gradedAt: new Date().toISOString(),
      });

      setSaveGradingStatus("success");
      setHasUnsavedChanges(false);
      setTimeout(() => {
        setSaveGradingStatus("idle");
      }, 3500);
    } catch (err: any) {
      console.error("Evaluation save error:", err);
      setSaveGradingStatus("error");
      setSaveGradingError(err.message || "Lỗi lưu đánh giá. Vui lòng bấm thử lại.");
    }
  };

  // Export Anonymized Evidence CSV (UTF-8 with BOM)
  const handleExportEvidenceCsv = () => {
    const pythonSubs = submissions.filter((s) => s.moduleType === "coding" || s.content?.debugSession);
    const targetSubs = pythonSubs.length > 0 ? pythonSubs : submissions;

    const headers = [
      "Mã học sinh",
      "Bài tập",
      "Thời gian bắt đầu",
      "Thời gian hoàn thành",
      "Số lần chạy thử",
      "Số gợi ý AI đã nhận",
      "Tiêu chí 1: Xác định lỗi (2.5đ)",
      "Tiêu chí 2: Giải thích nguyên nhân (2.5đ)",
      "Tiêu chí 3: Sửa đúng (2.5đ)",
      "Tiêu chí 4: Vận dụng (2.5đ)",
      "Tổng điểm (10đ)",
      "Đánh giá của giáo viên",
      "Trạng thái chấm",
      "Nội dung học sinh: Em gặp lỗi gì",
      "Nội dung học sinh: Vì sao lỗi",
      "Nội dung học sinh: Đã sửa thế nào",
      "Mã ban đầu",
      "Mã cuối cùng"
    ];

    const rows = targetSubs.map((sub) => {
      const sess = sub.content?.debugSession;
      const evalObj = sub.evaluation;
      const studentCode = sess?.studentCode || sub.studentId || "HS-ANON";
      const lessonTitle = (sub.lessonTitle || "").replace(/"/g, '""');
      const start = sess?.startedAt || sub.submittedAt;
      const finish = sess?.finishedAt || sub.submittedAt;
      const runCount = sess?.runs ? sess.runs.length : 0;
      const hintCount = sess?.hints ? sess.hints.length : 0;
      const c1 = evalObj?.errorIdentification ?? "";
      const c2 = evalObj?.reasonExplanation ?? "";
      const c3 = evalObj?.correctFix ?? "";
      const c4 = evalObj?.application ?? "";
      const totalScore = sub.status === "graded" && typeof sub.score === "number" ? sub.score : "Chờ chấm";
      const feedback = (sub.teacherFeedback || evalObj?.feedback || "").replace(/"/g, '""');
      const status = sub.status === "graded" ? "Đã chấm" : "Chờ chấm";
      const refWhat = (sess?.reflection?.errorEncountered || "").replace(/"/g, '""');
      const refWhy = (sess?.reflection?.errorReason || "").replace(/"/g, '""');
      const refHow = (sess?.reflection?.howFixed || "").replace(/"/g, '""');
      const initCode = (sess?.initialCode || "").replace(/"/g, '""');
      const finalCode = (sess?.finalCode || sub.content?.code || "").replace(/"/g, '""');

      return [
        `"${studentCode}"`,
        `"${lessonTitle}"`,
        `"${start}"`,
        `"${finish}"`,
        runCount,
        hintCount,
        c1,
        c2,
        c3,
        c4,
        totalScore,
        `"${feedback}"`,
        `"${status}"`,
        `"${refWhat}"`,
        `"${refWhy}"`,
        `"${refHow}"`,
        `"${initCode}"`,
        `"${finalCode}"`
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nhat_ky_sua_loi_python_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Backup System Data
  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/system/backup", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Máy chủ từ chối sao lưu hoặc không có quyền.");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lms_stem_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Lỗi sao lưu: " + e.message);
    } finally {
      setBackupLoading(false);
    }
  };

  // Restore System Data
  const handleRestoreFromFile = async (file: File) => {
    setRestoreStatus("Đang đọc file và xác minh cấu trúc...");
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/system/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ backupData }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Máy chủ từ chối khôi phục");
      }
      const result = await res.json();
      setRestoreStatus(`✅ ${result.message || "Khôi phục dữ liệu hoàn tất!"}`);
      setTimeout(() => {
        setRestoreConfirmOpen(false);
        setRestoreStatus(null);
        window.location.reload();
      }, 2000);
    } catch (e: any) {
      setRestoreStatus("❌ Lỗi: " + e.message);
    }
  };

  // Page title mapping
  const pageTitleMap: Record<MainNavTab, { title: string; subtitle: string }> = {
    overview: {
      title: "Tổng quan dạy học",
      subtitle: "Theo dõi tiến độ làm bài và các bài tập cần đánh giá hôm nay",
    },
    classes: {
      title: "Quản lý lớp học",
      subtitle: "Danh sách học sinh, sĩ số và nội dung phân phối cho từng lớp",
    },
    assignments: {
      title: "Bài tập & Đề kiểm tra",
      subtitle: "Soạn bài thực hành Python, đề thi trắc nghiệm và ma trận đề",
    },
    grading: {
      title: "Chấm bài & Theo dõi sửa lỗi Python",
      subtitle: "Đánh giá 4 tiêu chí sư phạm và kiểm tra chu trình tự sửa lỗi của học sinh",
    },
    reports: {
      title: "Báo cáo năng lực học tập",
      subtitle: "Thống kê số lần chạy thử, lượt nhận gợi ý và xuất dữ liệu minh chứng",
    },
    settings: {
      title: "Cài đặt & Dữ liệu",
      subtitle: "Quản lý kết nối đám mây, sao lưu và an toàn hệ thống",
    },
  };

  return (
    <div className="flex h-full min-h-0 flex-1 bg-slate-100 text-slate-800 font-sans antialiased overflow-hidden">
      {/* ============================================================== */}
      {/* 1. SIDEBAR (DESKTOP & COLLAPSED) */}
      {/* ============================================================== */}
      <aside 
        className={`hidden lg:flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-200 z-30 shrink-0 ${
          sidebarCollapsed ? "w-18" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                AI
              </div>
              <div className="truncate">
                <div className="font-bold text-white text-sm tracking-tight leading-none">LMS Tin Học</div>
                <div className="text-[11px] text-slate-400 mt-1">Gia Sư Python AI</div>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm">
              AI
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs"
            title={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {[
            { id: "overview" as MainNavTab, label: "Tổng quan", icon: LayoutDashboard },
            { id: "classes" as MainNavTab, label: "Lớp học", icon: School },
            { id: "assignments" as MainNavTab, label: "Bài tập", icon: FileText },
            { 
              id: "grading" as MainNavTab, 
              label: "Chấm bài", 
              icon: CheckSquare,
              badge: pendingCount > 0 ? pendingCount : undefined 
            },
            { id: "ugot-bridge" as MainNavTab, label: "Robot UGOT", icon: Cpu },
            { id: "reports" as MainNavTab, label: "Báo cáo", icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (selectedSubForDetail) {
                    handleCloseGradingDetail();
                  }
                  setActiveNav(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                    isActive ? "bg-white text-blue-700" : "bg-amber-500 text-slate-950"
                  }`}>
                    {item.badge}
                  </span>
                )}
                {sidebarCollapsed && item.badge !== undefined && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-2 right-2" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Settings & Data */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (selectedSubForDetail) handleCloseGradingDetail();
              setActiveNav("settings");
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
              activeNav === "settings"
                ? "bg-slate-800 text-white font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
            title="Cài đặt & Dữ liệu"
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Cài đặt & dữ liệu</span>}
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE DRAWER OVERLAY */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-slate-900 text-slate-100 flex flex-col h-full z-10 shadow-2xl">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
              <span className="font-bold text-white text-base">Menu Giáo Viên</span>
              <button 
                type="button" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
              {[
                { id: "overview" as MainNavTab, label: "Tổng quan", icon: LayoutDashboard },
                { id: "classes" as MainNavTab, label: "Lớp học", icon: School },
                { id: "assignments" as MainNavTab, label: "Bài tập", icon: FileText },
                { id: "grading" as MainNavTab, label: "Chấm bài", icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : undefined },
                { id: "ugot-bridge" as MainNavTab, label: "Robot UGOT", icon: Cpu },
                { id: "reports" as MainNavTab, label: "Báo cáo", icon: BarChart3 },
                { id: "settings" as MainNavTab, label: "Cài đặt & dữ liệu", icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (selectedSubForDetail) handleCloseGradingDetail();
                      setActiveNav(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-left ${
                      isActive ? "bg-blue-600 text-white font-semibold" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500 text-slate-950 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MAIN CONTENT AREA */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
          {/* Left: Mobile trigger & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">
                {pageTitleMap[activeNav].title}
              </h1>
              <p className="hidden sm:block text-xs text-slate-500 truncate">
                {pageTitleMap[activeNav].subtitle}
              </p>
            </div>
          </div>

          {/* Right: Class Selector & Teacher Account */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Global Class Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Lớp:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer pr-2"
              >
                <option value="all">Tất cả lớp được phân công</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Practice shortcut */}
            {onOpenPythonLab && (
              <button
                type="button"
                onClick={onOpenPythonLab}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200"
                title="Mở phòng thực hành Python"
              >
                <Code2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Phòng Python</span>
              </button>
            )}

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                {currentUser?.displayName?.charAt(0) || "G"}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.displayName || "Giáo viên"}
                </div>
                <div className="text-[10px] text-slate-500">Giáo viên phụ trách</div>
              </div>
              {onSwitchToStudent && (
                <button
                  type="button"
                  onClick={onSwitchToStudent}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors text-xs"
                  title="Chuyển sang giao diện học sinh"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors text-xs"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* TAB BODY (Scrollable viewport, no horizontal page scroll) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* ============================================================== */}
            {/* VIEW 1: TỔNG QUAN (OVERVIEW) */}
            {/* ============================================================== */}
            {activeNav === "overview" && (
              <div className="space-y-6">
                {/* 3 Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lớp quản lý</div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{managedClassesCount}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Lớp được phân công</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <School className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Học sinh</div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalStudentsCount}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Đã đăng ký tài khoản</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <UserCheck className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bài chờ chấm</div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{pendingCount}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Cần giáo viên duyệt</div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Recent Pending Submissions Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">Bài chờ chấm gần nhất</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Ưu tiên đánh giá quá trình học sinh tự sửa lỗi Python</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGradingFilter("submitted");
                        setActiveNav("grading");
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Xem tất cả bài nộp</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {submissions.filter((s) => s.status === "submitted").length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      Không có bài tập nào đang chờ chấm! Tất cả học sinh đã được đánh giá.
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card View (< 768px) */}
                      <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
                        {submissions
                          .filter((s) => s.status === "submitted")
                          .slice(0, 5)
                          .map((sub) => (
                            <div key={sub.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">{sub.studentName}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    {sub.content?.debugSession?.studentCode || sub.studentId}
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                                  {sub.moduleType === "coding" ? "Python" : sub.moduleType}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                                {sub.lessonTitle}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{" "}
                                {new Date(sub.submittedAt).toLocaleDateString()}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveNav("grading");
                                  handleOpenGradingDetail(sub);
                                }}
                                className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center transition-colors shadow-xs"
                              >
                                Chấm bài
                              </button>
                            </div>
                          ))}
                      </div>

                      {/* Desktop / Tablet Table View (>= 768px) */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="py-3 px-4">Học sinh</th>
                              <th className="py-3 px-4">Bài tập</th>
                              <th className="py-3 px-4">Thời gian nộp</th>
                              <th className="py-3 px-4">Loại bài</th>
                              <th className="py-3 px-4 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {submissions
                              .filter((s) => s.status === "submitted")
                              .slice(0, 5)
                              .map((sub) => (
                                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-slate-900">{sub.studentName}</div>
                                    <div className="text-[11px] text-slate-400 font-mono">
                                      {sub.content?.debugSession?.studentCode || sub.studentId}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-800 font-medium">
                                    {sub.lessonTitle}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-500 text-xs">
                                    {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{" "}
                                    {new Date(sub.submittedAt).toLocaleDateString()}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                                      {sub.moduleType === "coding" ? "Python" : sub.moduleType}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveNav("grading");
                                        handleOpenGradingDetail(sub);
                                      }}
                                      className="min-h-[36px] px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
                                    >
                                      Chấm bài
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                {/* Upcoming Assignments Quick Overview */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">Bài tập đang triển khai</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Theo dõi thời hạn và số lượng bài đã thu</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveNav("assignments")}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Quản lý bài tập</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lessons.slice(0, 3).map((les) => {
                      const countSub = submissions.filter((s) => s.lessonId === les.id).length;
                      return (
                        <div key={les.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                              {les.moduleType === "coding" ? "Python" : les.subject || "Tin học"}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {countSub} bài nộp
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm line-clamp-1">{les.title}</div>
                          <div className="text-xs text-slate-500 line-clamp-2">{les.description || "Nội dung bài tập thực hành."}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 2: LỚP HỌC (CLASSES) */}
            {/* ============================================================== */}
            {activeNav === "classes" && (
              <div className="space-y-5">
                {/* Class Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm lớp học hoặc học sinh..."
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateClassOpen(true)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm lớp mới</span>
                    </button>
                  </div>
                </div>

                {/* Class Detail View (When a single class is focused) */}
                {viewingClassDetail ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setViewingClassDetail(null)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                          title="Quay lại danh sách lớp"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <h2 className="text-base font-bold text-slate-900">{viewingClassDetail.name}</h2>
                          <p className="text-xs text-slate-500">{viewingClassDetail.description || "Lớp học Tin học & STEM"}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClassId(viewingClassDetail.name);
                          setActiveNav("grading");
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold"
                      >
                        Chấm bài lớp này →
                      </button>
                    </div>

                    {/* Students in this Class */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 mb-3">Danh sách học sinh trong lớp</h3>
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase">
                            <tr>
                              <th className="py-2.5 px-3">Mã học sinh</th>
                              <th className="py-2.5 px-3">Họ và tên</th>
                              <th className="py-2.5 px-3">Email</th>
                              <th className="py-2.5 px-3">Bài đã nộp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {storedStudents
                              .filter((s) => s.classGrade === viewingClassDetail.name || s.classGrade === viewingClassDetail.id)
                              .map((st) => {
                                const subsCount = submissions.filter((sub) => sub.studentId === st.uid).length;
                                return (
                                  <tr key={st.uid} className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{st.studentCode || st.uid}</td>
                                    <td className="py-2.5 px-3 font-medium text-slate-900">{st.displayName}</td>
                                    <td className="py-2.5 px-3 text-slate-500 text-xs">{st.email}</td>
                                    <td className="py-2.5 px-3 text-slate-700">{subsCount} bài</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Class Grid List */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes
                      .filter((c) => !classSearch.trim() || c.name.toLowerCase().includes(classSearch.toLowerCase()))
                      .map((cls) => {
                        const classStudents = storedStudents.filter(
                          (st) => st.classGrade === cls.name || st.classGrade === cls.id
                        );
                        return (
                          <div
                            key={cls.id}
                            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all space-y-3 cursor-pointer"
                            onClick={() => setViewingClassDetail(cls)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">
                                {cls.gradeNumber ? `Khối ${cls.gradeNumber}` : "Lớp học"}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">{classStudents.length} học sinh</span>
                            </div>

                            <div>
                              <h3 className="font-bold text-slate-900 text-base">{cls.name}</h3>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cls.description || "Chưa có mô tả."}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                              <span>Xem chi tiết học sinh</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 3: BÀI TẬP (ASSIGNMENTS) */}
            {/* ============================================================== */}
            {activeNav === "assignments" && (
              <div className="space-y-5">
                {/* Unified Toolbar with ONE primary create button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <div className="relative min-w-[200px]">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm bài tập..."
                        value={assignmentSearch}
                        onChange={(e) => setAssignmentSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <select
                      value={assignmentTypeFilter}
                      onChange={(e) => setAssignmentTypeFilter(e.target.value)}
                      className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
                    >
                      <option value="all">Tất cả loại bài</option>
                      <option value="coding">Lập trình Python</option>
                      <option value="quiz">Trắc nghiệm & Ma trận</option>
                      <option value="robotics">STEM & Robotics</option>
                    </select>
                  </div>

                  {/* Single Main Action Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsUnifiedCreateAssignmentOpen(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tạo bài tập</span>
                    </button>
                  </div>
                </div>

                {/* Assignments Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">Tên bài tập</th>
                          <th className="py-3 px-4">Loại bài</th>
                          <th className="py-3 px-4">Cấp học</th>
                          <th className="py-3 px-4">Hạn nộp</th>
                          <th className="py-3 px-4">Tình trạng nộp</th>
                          <th className="py-3 px-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lessons
                          .filter((les) => {
                            if (assignmentSearch.trim() && !les.title.toLowerCase().includes(assignmentSearch.toLowerCase())) {
                              return false;
                            }
                            if (assignmentTypeFilter !== "all" && les.moduleType !== assignmentTypeFilter) {
                              return false;
                            }
                            return true;
                          })
                          .map((les) => {
                            const subCount = submissions.filter((s) => s.lessonId === les.id).length;
                            return (
                              <tr key={les.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  {les.title}
                                  <div className="text-[11px] text-slate-400 font-normal line-clamp-1">{les.description}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                                    {les.moduleType === "coding" ? "Python" : les.moduleType === "quiz" ? "Trắc nghiệm" : les.moduleType}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 font-medium">
                                  {les.level === "high" ? "THPT" : les.level === "middle" ? "THCS" : "Tiểu học"}
                                </td>
                                <td className="py-3.5 px-4 text-slate-500 text-xs">
                                  {les.dueDate ? new Date(les.dueDate).toLocaleDateString() : "Không giới hạn"}
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-slate-700">
                                  {subCount} bài nộp
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGradingAssignmentFilter(les.id);
                                      setActiveNav("grading");
                                    }}
                                    className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors mr-2"
                                  >
                                    Xem bài
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm(`Bạn có chắc muốn xóa bài "${les.title}"?`)) {
                                        await onDeleteLesson(les.id);
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    title="Xóa bài tập"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 4: CHẤM BÀI — ƯU TIÊN CAO NHẤT (GRADING) */}
            {/* ============================================================== */}
            {activeNav === "grading" && (
              <div className="space-y-5">
                {/* Detailed Evaluation Screen (When a submission is opened) */}
                {selectedSubForDetail ? (
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5">
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleCloseGradingDetail}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Quay lại</span>
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                              {selectedSubForDetail.studentName}
                            </h2>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                              {selectedSubForDetail.content?.debugSession?.studentCode || selectedSubForDetail.studentId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {selectedSubForDetail.lessonTitle} • Nộp lúc {new Date(selectedSubForDetail.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-xl border ${
                          selectedSubForDetail.status === "graded"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {selectedSubForDetail.status === "graded" ? `Đã chấm (${selectedSubForDetail.score}đ)` : "Chờ chấm"}
                        </span>
                      </div>
                    </div>

                    {/* 3 Detail Tabs (Python Practice) */}
                    <div className="flex items-center gap-2 border-b border-slate-200">
                      {[
                        { id: "evaluation", label: "Đánh giá & Chấm điểm" },
                        { id: "process", label: "Quá trình sửa lỗi & Nhật ký" },
                        { id: "work", label: "Mã nguồn cuối cùng" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setDetailTab(tab.id as any)}
                          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                            detailTab === tab.id
                              ? "border-blue-600 text-blue-600"
                              : "border-transparent text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* TAB CONTENT A: EVALUATION (4 Tiêu chí sư phạm) */}
                    {detailTab === "evaluation" && (
                      <div className="space-y-6 pt-2">
                        {selectedSubForDetail.content?.debugSession || selectedSubForDetail.moduleType === "coding" ? (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left 2 Cols: 4 Evaluation Criteria */}
                            <div className="lg:col-span-2 space-y-4">
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                                <h3 className="font-bold text-slate-900 text-sm mb-1">
                                  Đánh giá theo 4 tiêu chí sư phạm (Mỗi tiêu chí tối đa 2.5 điểm)
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">
                                  Tách biệt giữa việc chạy đúng cú pháp và mức độ thực sự hiểu lỗi, tự sửa của học sinh.
                                </p>

                                <div className="space-y-4">
                                  {/* Tiêu chí 1 */}
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/70">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                                      <span>1. Xác định lỗi</span>
                                      <span className="text-blue-600 font-black">{evalErrorId} / 2.5 đ</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      Học sinh nhận diện đúng vị trí dòng lệnh và phân loại lỗi gặp phải.
                                    </p>
                                    <input
                                      type="range"
                                      min="0"
                                      max="2.5"
                                      step="0.25"
                                      value={evalErrorId}
                                      onChange={(e) => {
                                        setEvalErrorId(Number(e.target.value));
                                        setHasUnsavedChanges(true);
                                      }}
                                      className="w-full mt-2 accent-blue-600"
                                    />
                                  </div>

                                  {/* Tiêu chí 2 */}
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/70">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                                      <span>2. Giải thích nguyên nhân</span>
                                      <span className="text-blue-600 font-black">{evalReason} / 2.5 đ</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      Hiểu rõ bản chất vì sao máy tính báo lỗi (thụt lề, kiểu dữ liệu, cú pháp).
                                    </p>
                                    <input
                                      type="range"
                                      min="0"
                                      max="2.5"
                                      step="0.25"
                                      value={evalReason}
                                      onChange={(e) => {
                                        setEvalReason(Number(e.target.value));
                                        setHasUnsavedChanges(true);
                                      }}
                                      className="w-full mt-2 accent-blue-600"
                                    />
                                  </div>

                                  {/* Tiêu chí 3 */}
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/70">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                                      <span>3. Tự sửa đúng</span>
                                      <span className="text-blue-600 font-black">{evalFix} / 2.5 đ</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      Chủ động tự gõ code sửa lại, không phụ thuộc vào việc chép nguyên giải pháp.
                                    </p>
                                    <input
                                      type="range"
                                      min="0"
                                      max="2.5"
                                      step="0.25"
                                      value={evalFix}
                                      onChange={(e) => {
                                        setEvalFix(Number(e.target.value));
                                        setHasUnsavedChanges(true);
                                      }}
                                      className="w-full mt-2 accent-blue-600"
                                    />
                                  </div>

                                  {/* Tiêu chí 4 */}
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/70">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                                      <span>4. Vận dụng & Liên hệ</span>
                                      <span className="text-blue-600 font-black">{evalApply} / 2.5 đ</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      Khả năng giải thích giải thuật tương tự hoặc áp dụng cho bài toán kế tiếp.
                                    </p>
                                    <input
                                      type="range"
                                      min="0"
                                      max="2.5"
                                      step="0.25"
                                      value={evalApply}
                                      onChange={(e) => {
                                        setEvalApply(Number(e.target.value));
                                        setHasUnsavedChanges(true);
                                      }}
                                      className="w-full mt-2 accent-blue-600"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Teacher Feedback Textarea */}
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  Nhận xét sư phạm của giáo viên:
                                </label>
                                <textarea
                                  rows={4}
                                  value={gradeFeedback}
                                  onChange={(e) => {
                                    setGradeFeedback(e.target.value);
                                    setHasUnsavedChanges(true);
                                  }}
                                  placeholder="Nhập lời khen ngợi, định hướng hoặc lưu ý về tư duy lập trình cho học sinh..."
                                  className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            {/* Right 1 Col: Score Summary & Save Action */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 h-fit">
                              <div className="text-center pb-4 border-b border-slate-200">
                                <div className="text-xs font-semibold text-slate-500">TỔNG ĐIỂM ĐÁNH GIÁ</div>
                                <div className="text-4xl font-black text-blue-600 mt-1">
                                  {calculatedPythonScore} <span className="text-sm font-normal text-slate-400">/ 10</span>
                                </div>
                              </div>

                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between text-slate-600">
                                  <span>Số lần chạy thử:</span>
                                  <span className="font-bold text-slate-900">
                                    {selectedSubForDetail.content?.debugSession?.runs?.length || 0} lần
                                  </span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                  <span>Gợi ý AI đã nhận:</span>
                                  <span className="font-bold text-slate-900">
                                    {selectedSubForDetail.content?.debugSession?.hints?.length || 0} gợi ý
                                  </span>
                                </div>
                              </div>

                              {saveGradingError && (
                                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                                  {saveGradingError}
                                </div>
                              )}

                              {saveGradingStatus === "success" && (
                                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center">
                                  ✓ Đã lưu kết quả thành công!
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={handleSaveEvaluation}
                                disabled={saveGradingStatus === "saving"}
                                className={`w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-sm ${
                                  saveGradingStatus === "saving"
                                    ? "bg-slate-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }`}
                              >
                                {saveGradingStatus === "saving" ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Đang lưu...</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    <span>Lưu đánh giá</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Non-Python assignment grading */
                          <div className="space-y-4 max-w-xl">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Điểm số (Thang 10):</label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                value={customScore}
                                onChange={(e) => setCustomScore(Number(e.target.value))}
                                className="w-32 p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Nhận xét:</label>
                              <textarea
                                rows={4}
                                value={gradeFeedback}
                                onChange={(e) => setGradeFeedback(e.target.value)}
                                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleSaveEvaluation}
                              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm"
                            >
                              Lưu kết quả
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB CONTENT B: PROCESS & DEBUG DIARY */}
                    {detailTab === "process" && (
                      <div className="space-y-6 pt-2">
                        {/* Student Self-Reflection Answers */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                          <h3 className="font-bold text-slate-900 text-sm">
                            Phần tự giải thích của học sinh (3 câu hỏi tự nhận thức lỗi):
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <span className="text-[11px] font-bold text-slate-500 uppercase">1. Em gặp lỗi gì?</span>
                              <p className="text-xs text-slate-800 mt-1 font-medium whitespace-pre-wrap">
                                {selectedSubForDetail.content?.debugSession?.reflection?.errorEncountered || "(Chưa điền)"}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <span className="text-[11px] font-bold text-slate-500 uppercase">2. Vì sao xảy ra lỗi?</span>
                              <p className="text-xs text-slate-800 mt-1 font-medium whitespace-pre-wrap">
                                {selectedSubForDetail.content?.debugSession?.reflection?.errorReason || "(Chưa điền)"}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                              <span className="text-[11px] font-bold text-slate-500 uppercase">3. Em đã sửa như thế nào?</span>
                              <p className="text-xs text-slate-800 mt-1 font-medium whitespace-pre-wrap">
                                {selectedSubForDetail.content?.debugSession?.reflection?.howFixed || "(Chưa điền)"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Code Evolution: Initial Code vs Final Code */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                              <span>Mã nguồn ban đầu:</span>
                            </div>
                            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono max-h-64 overflow-y-auto">
                              {selectedSubForDetail.content?.debugSession?.initialCode || "// Không có dữ liệu ban đầu"}
                            </pre>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                              <span>Mã nguồn sau khi sửa:</span>
                            </div>
                            <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-xs font-mono max-h-64 overflow-y-auto">
                              {selectedSubForDetail.content?.debugSession?.finalCode || selectedSubForDetail.content?.code || "// Không có code"}
                            </pre>
                          </div>
                        </div>

                        {/* AI Hints Received */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">
                            Gợi ý đã nhận ({selectedSubForDetail.content?.debugSession?.hints?.length || 0})
                          </h4>
                          {selectedSubForDetail.content?.debugSession?.hints?.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Học sinh không yêu cầu gợi ý nào trong phiên làm bài này.</p>
                          ) : (
                            <div className="space-y-2">
                              {selectedSubForDetail.content?.debugSession?.hints?.map((hint) => (
                                <div key={hint.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                                    <span className="font-bold text-blue-700">Mức {hint.level}</span>
                                    <span className="font-semibold">
                                      {hint.source === "ai" ? "🤖 Gia sư AI" : "💡 Gợi ý có sẵn"} • {hint.timestamp}
                                    </span>
                                  </div>
                                  <div className="text-slate-800 whitespace-pre-wrap">{hint.response}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Execution Run Logs */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">
                            Nhật ký các lần chạy thử ({selectedSubForDetail.content?.debugSession?.runs?.length || 0})
                          </h4>
                          {selectedSubForDetail.content?.debugSession?.runs?.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Chưa ghi nhận lần chạy thử nào.</p>
                          ) : (
                            <div className="space-y-2">
                              {selectedSubForDetail.content?.debugSession?.runs?.map((run, idx) => (
                                <div key={run.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                                    <span className="font-bold text-slate-700">Lần chạy #{idx + 1} ({run.timeMs || 0}ms)</span>
                                    <span className={run.error ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                                      {run.error ? "❌ Có lỗi" : "✓ Thành công"} • {run.timestamp}
                                    </span>
                                  </div>
                                  {run.stdin && (
                                    <div className="text-slate-500 font-mono text-[11px]">Stdin: {run.stdin}</div>
                                  )}
                                  <pre className="p-2 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto max-h-32">
                                    {run.error || run.output || "(Không có đầu ra)"}
                                  </pre>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB CONTENT C: FINAL WORK */}
                    {detailTab === "work" && (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Mã nguồn Python gửi nộp:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const c = selectedSubForDetail.content?.code || selectedSubForDetail.content?.debugSession?.finalCode || "";
                              navigator.clipboard.writeText(c);
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 font-semibold"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedCode ? "Đã copy" : "Copy code"}</span>
                          </button>
                        </div>

                        <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs sm:text-sm font-mono overflow-x-auto max-h-96">
                          {selectedSubForDetail.content?.code || selectedSubForDetail.content?.debugSession?.finalCode || "# Không có mã nguồn"}
                        </pre>

                        {selectedSubForDetail.content?.stdin && (
                          <div>
                            <span className="text-xs font-bold text-slate-700">Dữ liệu đầu vào tiêu chuẩn (Stdin):</span>
                            <pre className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono mt-1">
                              {selectedSubForDetail.content.stdin}
                            </pre>
                          </div>
                        )}

                        <div>
                          <span className="text-xs font-bold text-slate-700">Kết quả chạy cuối cùng:</span>
                          <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono mt-1 overflow-x-auto">
                            {selectedSubForDetail.content?.consoleOutput || "(Không có kết quả)"}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Submissions Main List */
                  <div className="space-y-4">
                    {/* Filters & Search Toolbar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 flex-1">
                        {/* Status Toggle Buttons */}
                        <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setGradingFilter("submitted")}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              gradingFilter === "submitted"
                                ? "bg-white text-blue-700 shadow-xs font-bold"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Chờ chấm ({pendingCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setGradingFilter("graded")}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              gradingFilter === "graded"
                                ? "bg-white text-blue-700 shadow-xs font-bold"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Đã chấm ({gradedCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setGradingFilter("all")}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              gradingFilter === "all"
                                ? "bg-white text-blue-700 shadow-xs font-bold"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Tất cả ({submissions.length})
                          </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[200px]">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Tìm tên hoặc mã học sinh..."
                            value={gradingSearch}
                            onChange={(e) => setGradingSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Export CSV Button */}
                      <button
                        type="button"
                        onClick={handleExportEvidenceCsv}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200/80 transition-colors"
                        title="Xuất file CSV minh chứng đánh giá"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Xuất CSV</span>
                      </button>
                    </div>

                    {/* Submissions List Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                      {filteredSubmissions.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-sm">
                          Không tìm thấy bài nộp nào phù hợp với bộ lọc hiện tại.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                              <tr>
                                <th className="py-3 px-4">Học sinh</th>
                                <th className="py-3 px-4">Bài tập</th>
                                <th className="py-3 px-4">Thời gian nộp</th>
                                <th className="py-3 px-4">Trạng thái</th>
                                <th className="py-3 px-4">Điểm</th>
                                <th className="py-3 px-4 text-right">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredSubmissions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-slate-900">{sub.studentName}</div>
                                    <div className="text-[11px] text-slate-400 font-mono">
                                      {sub.content?.debugSession?.studentCode || sub.studentId}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 font-medium text-slate-800">
                                    {sub.lessonTitle}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-500 text-xs">
                                    {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{" "}
                                    {new Date(sub.submittedAt).toLocaleDateString()}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      sub.status === "graded"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                        : "bg-amber-50 text-amber-700 border border-amber-200/60"
                                    }`}>
                                      {sub.status === "graded" ? "Đã chấm" : "Chờ chấm"}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900">
                                    {sub.status === "graded" && typeof sub.score === "number" ? `${sub.score} đ` : "—"}
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenGradingDetail(sub)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        sub.status === "submitted"
                                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                      }`}
                                    >
                                      Xem bài
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 5: BÁO CÁO (REPORTS) */}
            {/* ============================================================== */}
            {activeNav === "reports" && (
              <div className="space-y-6">
                {/* Reports Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={reportAssignmentFilter}
                      onChange={(e) => setReportAssignmentFilter(e.target.value)}
                      className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
                    >
                      <option value="all">Tất cả bài tập</option>
                      {lessons.map((les) => (
                        <option key={les.id} value={les.id}>{les.title}</option>
                      ))}
                    </select>

                    <select
                      value={reportDateRange}
                      onChange={(e) => setReportDateRange(e.target.value as any)}
                      className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
                    >
                      <option value="all">Toàn thời gian</option>
                      <option value="7d">7 ngày gần đây</option>
                      <option value="30d">30 ngày gần đây</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportEvidenceCsv}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất CSV Minh Chứng</span>
                  </button>
                </div>

                {/* Calculated Metrics for Reports */}
                {(() => {
                  const targetSubs = submissions.filter((s) => {
                    if (reportAssignmentFilter !== "all" && s.lessonId !== reportAssignmentFilter) return false;
                    return true;
                  });

                  const gradedOnly = targetSubs.filter((s) => s.status === "graded" && typeof s.score === "number");
                  const avgScore = gradedOnly.length > 0
                    ? (gradedOnly.reduce((sum, s) => sum + (s.score as number), 0) / gradedOnly.length).toFixed(1)
                    : "—";

                  const totalRuns = targetSubs.reduce((acc, curr) => acc + (curr.content?.debugSession?.runs?.length || 0), 0);
                  const totalHints = targetSubs.reduce((acc, curr) => acc + (curr.content?.debugSession?.hints?.length || 0), 0);

                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="text-xs text-slate-500 font-semibold uppercase">Đã nộp</div>
                          <div className="text-2xl font-black text-slate-900 mt-1">{targetSubs.length}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Tổng số lượt bài</div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="text-xs text-slate-500 font-semibold uppercase">Đã chấm</div>
                          <div className="text-2xl font-black text-emerald-600 mt-1">{gradedOnly.length}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Đã duyệt điểm</div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="text-xs text-slate-500 font-semibold uppercase">Điểm trung bình</div>
                          <div className="text-2xl font-black text-blue-600 mt-1">{avgScore}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {gradedOnly.length > 0 ? `Tính trên ${gradedOnly.length} bài đã chấm` : "Chưa có bài chấm"}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="text-xs text-slate-500 font-semibold uppercase">Lượt chạy & gợi ý</div>
                          <div className="text-2xl font-black text-slate-800 mt-1">{totalRuns} / {totalHints}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Số lần chạy / lượt AI</div>
                        </div>
                      </div>

                      {/* Evidence List */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
                          Danh sách minh chứng chi tiết (Dữ liệu thực tế mã hóa theo mã học sinh)
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                              <tr>
                                <th className="p-3">Mã học sinh</th>
                                <th className="p-3">Bài tập</th>
                                <th className="p-3">Lần chạy thử</th>
                                <th className="p-3">Lượt gợi ý</th>
                                <th className="p-3">Điểm</th>
                                <th className="p-3">Đánh giá giáo viên</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {targetSubs.map((sub) => (
                                <tr key={sub.id} className="hover:bg-slate-50">
                                  <td className="p-3 font-mono font-bold text-slate-800">
                                    {sub.content?.debugSession?.studentCode || sub.studentId}
                                  </td>
                                  <td className="p-3 text-slate-800 font-medium">{sub.lessonTitle}</td>
                                  <td className="p-3 text-slate-600 font-semibold">{sub.content?.debugSession?.runs?.length || 0} lần</td>
                                  <td className="p-3 text-slate-600 font-semibold">{sub.content?.debugSession?.hints?.length || 0} lượt</td>
                                  <td className="p-3 font-bold text-slate-900">
                                    {sub.status === "graded" && typeof sub.score === "number" ? `${sub.score}đ` : "Chờ chấm"}
                                  </td>
                                  <td className="p-3 text-slate-600 italic">
                                    {sub.teacherFeedback || sub.evaluation?.feedback || "(Chưa có nhận xét)"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 6: CÀI ĐẶT & DỮ LIỆU (SETTINGS & SYSTEM) */}
            {/* ============================================================== */}
            {activeNav === "settings" && (
              <div className="space-y-6 max-w-4xl">
                {/* Cloud & Backup System Card */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Sao lưu & Khôi phục dữ liệu</h2>
                      <p className="text-xs text-slate-500">Bảo vệ dữ liệu học sinh, bài nộp và tiến trình học tập</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                      <div className="font-bold text-sm text-slate-800">Tải bản sao lưu hệ thống</div>
                      <p className="text-xs text-slate-500">
                        Xuất toàn bộ bài nộp và hồ sơ học sinh ra file JSON an toàn (mật khẩu đã được loại bỏ).
                      </p>
                      <button
                        type="button"
                        onClick={handleDownloadBackup}
                        disabled={backupLoading}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>{backupLoading ? "Đang tạo..." : "Tải file sao lưu (.json)"}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                      <div className="font-bold text-sm text-slate-800">Khôi phục dữ liệu</div>
                      <p className="text-xs text-slate-500">
                        Khôi phục danh sách học sinh và bài tập từ file JSON sao lưu trước đó.
                      </p>
                      <button
                        type="button"
                        onClick={() => setRestoreConfirmOpen(true)}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Chọn file khôi phục</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account & Teacher Permissions Card */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Tài khoản & Phân quyền quản trị</h2>
                      <p className="text-xs text-slate-500">Cơ chế bảo mật theo Firebase Auth và Identity Toolkit</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 pt-2">
                    <p>• <strong>Tài khoản giáo viên hiện tại:</strong> {currentUser?.email || "Chưa xác thực"}</p>
                    <p>• <strong>Cơ chế xác thực:</strong> Token Bearer Firebase ID Token được xác minh tại máy chủ.</p>
                    <p>• <strong>Danh sách giáo viên ủy quyền:</strong> Được cấu hình trong danh sách quản trị viên đáng tin cậy.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW: QUẢN LÝ ROBOT UGOT & CẦU NỐI LAPTOP */}
            {/* ============================================================== */}
            {activeNav === "ugot-bridge" && currentUser && (
              <TeacherUgotManager currentUser={currentUser} />
            )}

          </div>
        </main>
      </div>

      {/* ============================================================== */}
      {/* 4. MODALS (TẬP TRUNG TẠO BÀI TẬP & HỆ THỐNG ĐỀ THI) */}
      {/* ============================================================== */}

      {/* Unified Assignment Creator Dialog */}
      {isUnifiedCreateAssignmentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Chọn hình thức tạo bài tập</h3>
              <button
                type="button"
                onClick={() => setIsUnifiedCreateAssignmentOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Chọn một trong các hình thức bên dưới để thiết kế bài học phù hợp với mục tiêu dạy học:
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsUnifiedCreateAssignmentOpen(false);
                  setIsExamSystemOpen(true);
                }}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                  📝
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">Số hóa đề thi thông minh (File / Ảnh / OCR / Ma trận)</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Hỗ trợ tải tệp Word/PDF/Ảnh, nhận dạng câu hỏi tự động hoặc thiết kế ma trận nhận thức.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsUnifiedCreateAssignmentOpen(false);
                  onAddLesson({
                    title: "Thực hành Python: Tự phát hiện và sửa lỗi cú pháp",
                    description: "Học sinh chạy thử, nhận gợi ý AI theo 3 mức và tự sửa lỗi.",
                    level: "middle",
                    moduleType: "coding",
                    language: "python",
                    starterCode: `# Viết chương trình tính tổng các số từ 1 đến n\nn = int(input())\ntong = 0\nfor i in range(1, n + 1):\n    tong += i\nprint(tong)`,
                  });
                }}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  🐍
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">Bài tập thực hành Python với Gia sư AI</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Tạo bài lập trình Python có sẵn code khởi tạo, bộ chạy in-browser và chu trình phản hồi lỗi.
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam & Quiz Creation System Modal */}
      <ExamCreationSystem
        isOpen={isExamSystemOpen}
        onClose={() => setIsExamSystemOpen(false)}
        classes={classes}
        onSaveExam={onAddLesson}
        initialGradeLevel="middle"
      />

      {/* Class Creation Modal */}
      <CreateClassModal
        isOpen={isCreateClassOpen}
        onClose={() => setIsCreateClassOpen(false)}
        onSaveClass={async (newCls) => {
          if (onAddClass) await onAddClass(newCls);
        }}
      />

      {/* System Restore Confirmation Modal */}
      {restoreConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Xác nhận khôi phục hệ thống</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ⚠️ <strong>Cảnh báo phạm vi ảnh hưởng:</strong> Việc khôi phục dữ liệu sẽ cập nhật danh sách tài khoản học sinh và bài tập. Dữ liệu hiện tại sẽ được đồng bộ theo tệp sao lưu.
            </p>
            {restoreStatus && (
              <div className="p-3 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800">
                {restoreStatus}
              </div>
            )}
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleRestoreFromFile(file);
              }}
              className="text-xs w-full file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRestoreConfirmOpen(false);
                  setRestoreStatus(null);
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
