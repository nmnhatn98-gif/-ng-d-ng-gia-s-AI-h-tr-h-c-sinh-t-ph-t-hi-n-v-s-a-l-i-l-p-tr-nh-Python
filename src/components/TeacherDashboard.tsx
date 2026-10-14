import React, { useState, useMemo, useEffect } from "react";
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
  Cpu,
  Loader2,
  Users,
  PenLine,
  Key
} from "lucide-react";
import { ExamCreationSystem } from "./ExamCreationSystem";
import { StudentAccountManager } from "./StudentAccountManager";
import { CreateClassModal } from "./CreateClassModal";
import { CreateAssignmentModal } from "./CreateAssignmentModal";
import { TeacherUgotManager } from "./TeacherUgotManager";
import { getStoredStudents, subscribeStudentsUpdate } from "../data/studentService";
import { auth } from "../firebase";

interface TeacherDashboardProps {
  lessons: Lesson[];
  submissions: Submission[];
  classes: ClassItem[];
  currentUser?: UserProfile;
  onAddLesson: (newLesson: Partial<Lesson>) => Promise<void>;
  onUpdateLesson?: (lessonId: string, updates: Partial<Lesson>) => Promise<void> | void;
  onDeleteLesson: (lessonId: string) => Promise<void>;
  onGradeSubmission: (submissionId: string, rubric: RubricCriteria, score: number, feedback: string) => Promise<void>;
  onAddClass?: (newClass: ClassItem) => Promise<void> | void;
  onUpdateClass?: (classId: string, updates: Partial<ClassItem>) => Promise<void> | void;
  onDeleteClass?: (classId: string) => Promise<void> | void;
  onRestoreClass?: (classId: string) => Promise<void> | void;
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
  onUpdateLesson,
  onDeleteLesson,
  onGradeSubmission,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onRestoreClass,
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
  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState(false);

  // Classes States
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const [viewingClassDetail, setViewingClassDetail] = useState<ClassItem | null>(null);
  const [classViewTab, setClassViewTab] = useState<"active" | "deleted">("active");
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [isDeletingClass, setIsDeletingClass] = useState<boolean>(false);
  const [deleteClassError, setDeleteClassError] = useState<string | null>(null);
  const [accountCreatorClassId, setAccountCreatorClassId] = useState<string | null>(null);
  const [isRestoringClassId, setIsRestoringClassId] = useState<string | null>(null);

  // Reports States
  const [reportAssignmentFilter, setReportAssignmentFilter] = useState<string>("all");
  const [reportDateRange, setReportDateRange] = useState<"all" | "7d" | "30d">("all");

  // Backup & Restore State
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  // Copy status helper
  const [copiedCode, setCopiedCode] = useState(false);

  // Real students count from storage with live subscription
  const [storedStudents, setStoredStudents] = useState<UserProfile[]>(() => getStoredStudents());
  useEffect(() => {
    const unsub = subscribeStudentsUpdate((updated) => {
      setStoredStudents(updated);
    });
    return () => unsub();
  }, []);

  const activeClasses = useMemo(() => {
    return classes.filter((c) => c.status !== "deleted");
  }, [classes]);

  const deletedClasses = useMemo(() => {
    return classes.filter((c) => c.status === "deleted");
  }, [classes]);

  const handleConfirmDeleteClass = async () => {
    if (!classToDelete || !onDeleteClass) return;
    setIsDeletingClass(true);
    setDeleteClassError(null);
    try {
      await onDeleteClass(classToDelete.id);
      if (viewingClassDetail?.id === classToDelete.id) {
        setViewingClassDetail(null);
      }
      setClassToDelete(null);
    } catch (err: any) {
      console.error("Delete class error:", err);
      setDeleteClassError(err?.message || "Không thể xóa lớp học trên máy chủ.");
    } finally {
      setIsDeletingClass(false);
    }
  };

  const handleExecuteRestoreClass = async (classId: string) => {
    if (!onRestoreClass) return;
    setIsRestoringClassId(classId);
    try {
      await onRestoreClass(classId);
    } catch (err: any) {
      alert("Lỗi khi khôi phục lớp: " + (err.message || err));
    } finally {
      setIsRestoringClassId(null);
    }
  };

  // Class Invite Code states & handlers
  const [copiedClassId, setCopiedClassId] = useState<string | null>(null);
  const [rotatingClass, setRotatingClass] = useState<ClassItem | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [togglingClassId, setTogglingClassId] = useState<string | null>(null);
  const [generatingClassId, setGeneratingClassId] = useState<string | null>(null);
  const [classCodeToast, setClassCodeToast] = useState<string | null>(null);

  const handleCopyClassCode = (cls: ClassItem) => {
    if (!cls.inviteCode) return;
    navigator.clipboard.writeText(cls.inviteCode);
    setCopiedClassId(cls.id);
    setClassCodeToast(`Đã sao chép mã "${cls.inviteCode}" của lớp ${cls.name}`);
    setTimeout(() => {
      setCopiedClassId(null);
      setClassCodeToast(null);
    }, 2500);
  };

  const handleGenerateClassCode = async (cls: ClassItem) => {
    setGeneratingClassId(cls.id);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/classes/${cls.id}/generate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success && data.inviteCode) {
        if (onUpdateClass) {
          await onUpdateClass(cls.id, { inviteCode: data.inviteCode, allowJoinByCode: true });
        }
        if (viewingClassDetail && viewingClassDetail.id === cls.id) {
          setViewingClassDetail((prev) => prev ? { ...prev, inviteCode: data.inviteCode, allowJoinByCode: true } : null);
        }
        setClassCodeToast(`Đã tạo mã lớp thành công: ${data.inviteCode}`);
        setTimeout(() => setClassCodeToast(null), 3000);
      } else {
        setClassCodeToast(data.error || "Không thể tạo mã lớp");
        setTimeout(() => setClassCodeToast(null), 3500);
      }
    } catch (e: any) {
      setClassCodeToast("Lỗi kết nối: " + e.message);
      setTimeout(() => setClassCodeToast(null), 3500);
    } finally {
      setGeneratingClassId(null);
    }
  };

  const handleConfirmRotateCode = async () => {
    if (!rotatingClass) return;
    setIsRotating(true);
    setRotateError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/classes/${rotatingClass.id}/rotate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success && data.inviteCode) {
        if (onUpdateClass) {
          await onUpdateClass(rotatingClass.id, { inviteCode: data.inviteCode });
        }
        if (viewingClassDetail && viewingClassDetail.id === rotatingClass.id) {
          setViewingClassDetail((prev) => prev ? { ...prev, inviteCode: data.inviteCode } : null);
        }
        setClassCodeToast(`Đã đổi mã lớp thành công: ${data.inviteCode}. Mã cũ đã hết hiệu lực.`);
        setTimeout(() => setClassCodeToast(null), 4000);
        setRotatingClass(null);
      } else {
        setRotateError(data.error || "Không thể đổi mã lớp");
      }
    } catch (e: any) {
      setRotateError("Lỗi kết nối: " + e.message);
    } finally {
      setIsRotating(false);
    }
  };

  const handleToggleJoinByCode = async (cls: ClassItem) => {
    const nextVal = cls.allowJoinByCode === false ? true : false;
    setTogglingClassId(cls.id);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/classes/${cls.id}/toggle-join-by-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ allowJoinByCode: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        if (onUpdateClass) {
          await onUpdateClass(cls.id, { allowJoinByCode: nextVal });
        }
        if (viewingClassDetail && viewingClassDetail.id === cls.id) {
          setViewingClassDetail((prev) => prev ? { ...prev, allowJoinByCode: nextVal } : null);
        }
        setClassCodeToast(nextVal ? "Đã bật cho phép học sinh tham gia bằng mã" : "Đã khóa không cho học sinh mới tham gia bằng mã");
        setTimeout(() => setClassCodeToast(null), 3000);
      }
    } catch (e) {
      console.warn("Toggle join by code error:", e);
    } finally {
      setTogglingClassId(null);
    }
  };

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
    "ugot-bridge": {
      title: "Cầu nối Robot UGOT",
      subtitle: "Phê duyệt quyền chạy robot, giám sát an toàn và quản lý thiết bị phòng Lab",
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
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="font-bold text-white text-sm tracking-tight leading-none">CodeHiểu</div>
                <div className="text-[11px] text-blue-400 font-medium mt-1">Học Python cùng gia sư AI</div>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0" title="CodeHiểu">
              <Code2 className="w-5 h-5" />
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
                {/* Class Toolbar & Tabs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center gap-2">
                    {/* Active vs Deleted tabs */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setClassViewTab("active");
                          setViewingClassDetail(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          classViewTab === "active"
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Lớp đang dạy ({activeClasses.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setClassViewTab("deleted");
                          setViewingClassDetail(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          classViewTab === "deleted"
                            ? "bg-white text-rose-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Lớp đã xóa ({deletedClasses.length})</span>
                      </button>
                    </div>

                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm lớp học..."
                        value={classSearch}
                        onChange={(e) => setClassSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountCreatorClassId(activeClasses[0]?.id || "general")}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Mở bảng tạo tài khoản học sinh"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Tạo tài khoản học sinh</span>
                    </button>

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

                {/* VIEW 2A: CLASS DETAIL VIEW */}
                {viewingClassDetail ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => setViewingClassDetail(null)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs mt-0.5"
                          title="Quay lại danh sách lớp"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base sm:text-lg font-black text-slate-900">{viewingClassDetail.name}</h2>
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                              {viewingClassDetail.gradeNumber ? `Khối ${viewingClassDetail.gradeNumber}` : "Lớp học"}
                            </span>
                            {viewingClassDetail.schoolYear && (
                              <span className="text-xs text-slate-400 font-medium">
                                Năm học: {viewingClassDetail.schoolYear}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {viewingClassDetail.description || "Lớp học Tin học & STEM"}
                            {viewingClassDetail.teacherName ? ` • Giáo viên: ${viewingClassDetail.teacherName}` : ""}
                            {viewingClassDetail.room ? ` • Phòng: ${viewingClassDetail.room}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAccountCreatorClassId(viewingClassDetail.id)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tạo tài khoản học sinh</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClassId(viewingClassDetail.name);
                            setActiveNav("grading");
                          }}
                          className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
                        >
                          Chấm bài lớp này →
                        </button>

                        {currentUser?.role === "teacher" &&
                          (!viewingClassDetail.ownerUid || viewingClassDetail.ownerUid === currentUser.uid) && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteClassError(null);
                                setClassToDelete(viewingClassDetail);
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs transition-colors"
                              title="Xóa lớp học"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </div>

                    {/* MÃ THAM GIA LỚP & CÔNG TẮC CHO PHÉP THAM GIA */}
                    <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                          <Key className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-700">Mã tham gia lớp:</span>
                            {viewingClassDetail.inviteCode ? (
                              <span className="font-mono text-base font-black text-blue-900 bg-white px-3 py-1 rounded-xl border border-blue-300 tracking-wider shadow-2xs">
                                {viewingClassDetail.inviteCode}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Chưa có mã</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              viewingClassDetail.allowJoinByCode !== false
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-slate-100 text-slate-500 border-slate-300"
                            }`}>
                              {viewingClassDetail.allowJoinByCode !== false ? "● Đang mở nhận học sinh" : "○ Đã khóa nhận học sinh"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Cấp mã này cho học sinh để tự tham gia lớp từ trang Học sinh. Khi đổi mã, mã cũ hết hiệu lực và không ảnh hưởng học sinh cũ.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {viewingClassDetail.inviteCode ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCopyClassCode(viewingClassDetail)}
                              className="px-3 py-2 bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              title="Sao chép mã lớp vào bộ nhớ tạm"
                            >
                              {copiedClassId === viewingClassDetail.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Đã sao chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Sao chép mã</span>
                                </>
                              )}
                            </button>

                            {currentUser?.role === "teacher" &&
                              (!viewingClassDetail.ownerUid || viewingClassDetail.ownerUid === currentUser.uid) && (
                                <button
                                  type="button"
                                  onClick={() => setRotatingClass(viewingClassDetail)}
                                  className="px-3 py-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                  title="Đổi mã lớp mới"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Đổi mã</span>
                                </button>
                              )}
                          </>
                        ) : (
                          currentUser?.role === "teacher" &&
                          (!viewingClassDetail.ownerUid || viewingClassDetail.ownerUid === currentUser.uid) && (
                            <button
                              type="button"
                              disabled={generatingClassId === viewingClassDetail.id}
                              onClick={() => handleGenerateClassCode(viewingClassDetail)}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              {generatingClassId === viewingClassDetail.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Key className="w-3.5 h-3.5" />
                              )}
                              <span>Tạo mã lớp</span>
                            </button>
                          )
                        )}

                        {currentUser?.role === "teacher" &&
                          (!viewingClassDetail.ownerUid || viewingClassDetail.ownerUid === currentUser.uid) &&
                          viewingClassDetail.inviteCode && (
                            <button
                              type="button"
                              disabled={togglingClassId === viewingClassDetail.id}
                              onClick={() => handleToggleJoinByCode(viewingClassDetail)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                                viewingClassDetail.allowJoinByCode !== false
                                  ? "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                                  : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                              }`}
                              title="Bật hoặc tắt cho phép học sinh tham gia bằng mã"
                            >
                              <span className={`w-2 h-2 rounded-full ${viewingClassDetail.allowJoinByCode !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
                              <span>{viewingClassDetail.allowJoinByCode !== false ? "Cho phép tham gia: BẬT" : "Cho phép tham gia: TẮT"}</span>
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Students in this Class */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>Danh sách học sinh trong lớp ({storedStudents.filter(
                            (s) => s.classId === viewingClassDetail.id || (!s.classId && s.classGrade === viewingClassDetail.name)
                          ).length} em)</span>
                        </h3>

                        <button
                          type="button"
                          onClick={() => setAccountCreatorClassId(viewingClassDetail.id)}
                          className="text-xs text-blue-600 font-bold hover:underline"
                        >
                          + Thêm học sinh vào lớp này
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase">
                            <tr>
                              <th className="py-2.5 px-3">Mã học sinh</th>
                              <th className="py-2.5 px-3">Họ và tên</th>
                              <th className="py-2.5 px-3">Email đăng nhập</th>
                              <th className="py-2.5 px-3">Bài đã nộp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {storedStudents
                              .filter(
                                (s) =>
                                  s.classId === viewingClassDetail.id ||
                                  (!s.classId && s.classGrade === viewingClassDetail.name)
                              )
                              .map((st) => {
                                const subsCount = submissions.filter((sub) => sub.studentId === st.uid).length;
                                return (
                                  <tr key={st.uid} className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{st.studentCode || st.uid}</td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-900">{st.displayName}</td>
                                    <td className="py-2.5 px-3 text-slate-500 text-xs font-mono">{st.email}</td>
                                    <td className="py-2.5 px-3 text-slate-700">{subsCount} bài</td>
                                  </tr>
                                );
                              })}
                            {storedStudents.filter(
                              (s) =>
                                s.classId === viewingClassDetail.id ||
                                (!s.classId && s.classGrade === viewingClassDetail.name)
                            ).length === 0 && (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-slate-400">
                                  <p className="font-semibold text-xs">Lớp học này chưa có học sinh nào.</p>
                                  <button
                                    type="button"
                                    onClick={() => setAccountCreatorClassId(viewingClassDetail.id)}
                                    className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                                  >
                                    Bấm vào đây để tạo danh sách tài khoản học sinh ngay →
                                  </button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : classViewTab === "deleted" ? (
                  /* VIEW 2B: DELETED CLASSES (TRASH) */
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Mục lưu trữ lớp đã xóa:</strong> Các lớp trong mục này đã được ẩn khỏi danh sách giảng dạy.
                          Học sinh và bài làm vẫn an toàn tuyệt đối và có thể khôi phục lại bất kỳ lúc nào.
                        </span>
                      </div>
                    </div>

                    {deletedClasses.length === 0 ? (
                      <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                        <School className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">Thùng rác trống</p>
                        <p className="text-xs">Chưa có lớp học nào bị chuyển vào mục đã xóa.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deletedClasses
                          .filter(
                            (c) =>
                              !classSearch.trim() ||
                              c.name.toLowerCase().includes(classSearch.toLowerCase())
                          )
                          .map((cls) => {
                            const enrolledCount = storedStudents.filter(
                              (st) => st.classId === cls.id || (!st.classId && st.classGrade === cls.name)
                            ).length;
                            return (
                              <div
                                key={cls.id}
                                className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs space-y-3 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700">
                                      {cls.gradeNumber ? `Khối ${cls.gradeNumber}` : "Lớp đã xóa"}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">
                                      {enrolledCount} học sinh
                                    </span>
                                  </div>

                                  <div className="mt-2.5">
                                    <h3 className="font-bold text-slate-800 text-base leading-snug line-through text-slate-500">
                                      {cls.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                      {cls.description || "Lớp học đã bị xóa."}
                                    </p>
                                    {cls.deletedAt && (
                                      <p className="text-[11px] text-rose-500 font-medium mt-1">
                                        Đã xóa lúc: {new Date(cls.deletedAt).toLocaleDateString("vi-VN")}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    disabled={isRestoringClassId === cls.id}
                                    onClick={() => handleExecuteRestoreClass(cls.id)}
                                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                                  >
                                    {isRestoringClassId === cls.id ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Đang khôi phục...</span>
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Khôi phục lớp học này</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* VIEW 2C: ACTIVE CLASSES GRID */
                  activeClasses.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-3">
                      <School className="w-10 h-10 mx-auto text-blue-400" />
                      <div>
                        <p className="text-base font-bold text-slate-800">Chưa có lớp học nào</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Hãy tạo lớp học đầu tiên bằng tên riêng của bạn (VD: "10A3" hoặc "Tin học chiều thứ Ba").
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCreateClassOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tạo Lớp Học Ngay</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeClasses
                        .filter(
                          (c) =>
                            !classSearch.trim() ||
                            c.name.toLowerCase().includes(classSearch.toLowerCase())
                        )
                        .map((cls) => {
                          const classStudents = storedStudents.filter(
                            (st) => st.classId === cls.id || (!st.classId && st.classGrade === cls.name)
                          );
                          const isOwner =
                            currentUser?.role === "teacher" &&
                            (!cls.ownerUid || cls.ownerUid === currentUser.uid);

                          return (
                            <div
                              key={cls.id}
                              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all space-y-3 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">
                                    {cls.gradeNumber ? `Khối ${cls.gradeNumber}` : "Lớp học"}
                                  </span>
                                  <span className="text-xs text-slate-500 font-medium">
                                    {classStudents.length} học sinh
                                  </span>
                                </div>

                                <div className="mt-2.5">
                                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                                    {cls.name}
                                  </h3>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                    {cls.description || "Chưa có mô tả."}
                                  </p>
                                </div>

                                {/* Class Invite Code Box on Card */}
                                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 space-y-2 mt-2">
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold min-w-0">
                                      <Key className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      <span className="shrink-0">Mã:</span>
                                      {cls.inviteCode ? (
                                        <span className="font-mono font-black text-blue-900 bg-white px-2 py-0.5 rounded-md border border-blue-200 text-xs tracking-wider truncate shadow-2xs">
                                          {cls.inviteCode}
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 italic">Chưa có mã</span>
                                      )}
                                    </div>

                                    {cls.inviteCode ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopyClassCode(cls);
                                        }}
                                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                                        title="Sao chép mã"
                                      >
                                        {copiedClassId === cls.id ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            <span className="text-emerald-700">Đã chép</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Chép</span>
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      isOwner && (
                                        <button
                                          type="button"
                                          disabled={generatingClassId === cls.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleGenerateClassCode(cls);
                                          }}
                                          className="px-2 py-1 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1 cursor-pointer shrink-0"
                                        >
                                          {generatingClassId === cls.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Key className="w-3 h-3" />
                                          )}
                                          <span>Tạo mã</span>
                                        </button>
                                      )
                                    )}
                                  </div>

                                  {isOwner && cls.inviteCode && (
                                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[11px]">
                                      <button
                                        type="button"
                                        disabled={togglingClassId === cls.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleJoinByCode(cls);
                                        }}
                                        className={`flex items-center gap-1 font-semibold cursor-pointer transition-colors ${
                                          cls.allowJoinByCode !== false
                                            ? "text-emerald-700 hover:text-emerald-800"
                                            : "text-slate-400 hover:text-slate-600"
                                        }`}
                                        title="Bấm để bật hoặc tắt cho phép học sinh tham gia bằng mã"
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${cls.allowJoinByCode !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
                                        <span>{cls.allowJoinByCode !== false ? "Nhận mã: BẬT" : "Nhận mã: TẮT"}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRotatingClass(cls);
                                        }}
                                        className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-0.5 cursor-pointer transition-colors"
                                        title="Đổi mã lớp mới"
                                      >
                                        <RefreshCw className="w-2.5 h-2.5" />
                                        <span>Đổi mã</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 3 Action Buttons on each Class Card */}
                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingClassDetail(cls)}
                                  className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                  title="Xem danh sách học sinh của lớp này"
                                >
                                  <Users className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Học sinh ({classStudents.length})</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setAccountCreatorClassId(cls.id)}
                                  className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                  title="Tạo tài khoản học sinh cho lớp này"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Tạo tài khoản</span>
                                </button>

                                {isOwner && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteClassError(null);
                                      setClassToDelete(cls);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs transition-colors"
                                    title="Xóa lớp học (chuyển vào mục Đã xóa)"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )
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
                                  <div className="flex items-center gap-2">
                                    <span>{les.title}</span>
                                    {les.requireSelfExplanation && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                        ✍️ Cần tự giải thích
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="text-[11px] text-slate-400 font-normal line-clamp-1">{les.description}</div>
                                    {les.moduleType === "coding" && (
                                      <button
                                        type="button"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (onUpdateLesson) {
                                            await onUpdateLesson(les.id, { requireSelfExplanation: !les.requireSelfExplanation });
                                          }
                                        }}
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer shrink-0 ${
                                          les.requireSelfExplanation
                                            ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                        }`}
                                        title="Bấm để bật hoặc tắt yêu cầu học sinh tự giải thích khi nộp bài"
                                      >
                                        <PenLine className="w-2.5 h-2.5 text-amber-600" />
                                        <span>{les.requireSelfExplanation ? "Bắt buộc giải thích" : "Không bắt buộc"}</span>
                                      </button>
                                    )}
                                  </div>
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
                        {/* Student Self-Reflection Answers (GDPT 2018 Metacognition 4-questions) */}
                        {(() => {
                          const reflection = selectedSubForDetail.content?.debugSession?.reflection;
                          const hasExplanation = Boolean(
                            reflection &&
                            (reflection.errorEncountered?.trim() ||
                             reflection.errorReason?.trim() ||
                             reflection.howFixed?.trim() ||
                             reflection.verifiedWith?.trim())
                          );

                          if (!hasExplanation) {
                            return (
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-1">
                                <div className="text-sm font-bold text-slate-700">Chưa có lời giải thích</div>
                                <p className="text-xs text-slate-400">
                                  Học sinh chưa hoàn thành phần tự giải thích cho bài nộp này.
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <span>Phần tự giải thích của học sinh (4 câu hỏi tự nhận thức & sửa lỗi):</span>
                                  </h3>
                                  <p className="text-[11px] text-slate-500">
                                    Minh chứng độc lập do học sinh tự trình bày, không bị AI tự động can thiệp.
                                  </p>
                                </div>
                                <div>
                                  {reflection.mode === "correct_first_try" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      🎯 Làm đúng ngay & Giải trình kiểm thử
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      🛠️ Gặp lỗi & Tự sửa lại
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                  <span className="text-[11px] font-bold text-blue-700 uppercase block mb-1">
                                    1. Lỗi / Vấn đề phát hiện:
                                  </span>
                                  <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                                    {reflection.errorEncountered || "(Chưa điền)"}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                  <span className="text-[11px] font-bold text-amber-700 uppercase block mb-1">
                                    2. Nguyên nhân theo em:
                                  </span>
                                  <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                                    {reflection.errorReason || "(Chưa điền)"}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                  <span className="text-[11px] font-bold text-purple-700 uppercase block mb-1">
                                    3. Cách em đã sửa:
                                  </span>
                                  <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                                    {reflection.howFixed || "(Chưa điền)"}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-slate-200">
                                  <span className="text-[11px] font-bold text-emerald-700 uppercase block mb-1">
                                    4. Dữ liệu & kết quả kiểm tra:
                                  </span>
                                  <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                                    {reflection.verifiedWith || "(Chưa điền)"}
                                  </p>
                                </div>
                              </div>

                              {/* Linked Runs if student selected before/after milestones */}
                              {(reflection.selectedBeforeRunId || reflection.selectedAfterRunId) && (
                                <div className="pt-2 border-t border-slate-200/80 text-xs">
                                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase">
                                    Mốc đối chiếu nhật ký chạy mã liên kết:
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                    <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-200">
                                      <span className="font-bold text-rose-800 block">Mốc trước khi sửa:</span>
                                      {(() => {
                                        const bRunId = reflection.selectedBeforeRunId;
                                        const bRun = selectedSubForDetail.content?.debugSession?.runs?.find((r: any) => r.id === bRunId);
                                        if (!bRun) return <span className="text-slate-500 italic">Chưa chọn mốc</span>;
                                        return (
                                          <div className="mt-1 space-y-0.5 font-mono">
                                            <div className="text-slate-700">{bRun.timestamp} • {bRun.passed ? "Thành công" : "Báo lỗi"}</div>
                                            {bRun.error && <div className="text-rose-600 truncate">{bRun.error}</div>}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                    <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-200">
                                      <span className="font-bold text-emerald-800 block">Mốc sau khi sửa:</span>
                                      {(() => {
                                        const aRunId = reflection.selectedAfterRunId;
                                        const aRun = selectedSubForDetail.content?.debugSession?.runs?.find((r: any) => r.id === aRunId);
                                        if (!aRun) return <span className="text-slate-500 italic">Chưa chọn mốc</span>;
                                        return (
                                          <div className="mt-1 space-y-0.5 font-mono">
                                            <div className="text-slate-700">{aRun.timestamp} • {aRun.passed ? "Thành công" : "Báo lỗi"}</div>
                                            {aRun.output && <div className="text-emerald-700 truncate">{aRun.output}</div>}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

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
                  setIsCreateAssignmentModalOpen(true);
                }}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all flex items-start gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  🐍
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">Bài tập thực hành Python (Tùy chọn Yêu cầu Tự giải thích)</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Thiết lập bài lập trình Python, hạn nộp, phân công lớp và cấu hình yêu cầu học sinh tự giải thích khi nộp bài.
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Modal (supports Require Self-Explanation configuration) */}
      <CreateAssignmentModal
        isOpen={isCreateAssignmentModalOpen}
        onClose={() => setIsCreateAssignmentModalOpen(false)}
        onSaveAssignment={onAddLesson}
        classes={classes}
        initialGrade="Khối 10"
        initialSubject="Tin học"
      />

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
        currentUser={currentUser}
        onClose={() => setIsCreateClassOpen(false)}
        onSaveClass={async (newCls) => {
          if (onAddClass) await onAddClass(newCls);
        }}
      />

      {/* Student Account Creator Modal */}
      {accountCreatorClassId && (
        <StudentAccountManager
          classes={classes}
          currentUser={currentUser}
          initialClassId={accountCreatorClassId}
          isOpenModal={true}
          onCloseModal={() => setAccountCreatorClassId(null)}
          onSuccessCreated={() => {
            setStoredStudents(getStoredStudents());
          }}
        />
      )}

      {/* Soft Delete Class Confirmation Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận chuyển lớp vào mục Đã xóa</h3>
                <p className="text-xs text-slate-500">Thao tác này có thể khôi phục lại bất kỳ lúc nào</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-2">
              <div className="text-xs font-bold text-amber-900">
                Lớp học: <span className="text-slate-900 font-extrabold text-sm">{classToDelete.name}</span>
              </div>
              <div className="text-xs text-amber-800">
                Sĩ số hiện tại: <strong>{storedStudents.filter(
                  (s) => s.classId === classToDelete.id || (!s.classId && s.classGrade === classToDelete.name)
                ).length} học sinh</strong>
              </div>
              <div className="text-xs text-amber-900/90 leading-relaxed pt-2 border-t border-amber-200">
                <strong>Phạm vi ảnh hưởng:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-800">
                  <li>Lớp sẽ bị ẩn khỏi danh sách lớp đang dạy và các bộ chọn giao bài tập.</li>
                  <li><strong>KHÔNG xóa</strong> tài khoản đăng nhập của học sinh.</li>
                  <li><strong>KHÔNG xóa</strong> bài nộp, điểm số hay tiến trình học tập.</li>
                  <li>Giáo viên có thể mở thẻ <em>"Lớp đã xóa"</em> để xem và bấm khôi phục bất cứ lúc nào.</li>
                </ul>
              </div>
            </div>

            {deleteClassError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {deleteClassError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingClass}
                onClick={() => {
                  setClassToDelete(null);
                  setDeleteClassError(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeletingClass}
                onClick={handleConfirmDeleteClass}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60"
              >
                {isDeletingClass ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý xóa...</span>
                  </>
                ) : (
                  <span>Xác nhận xóa lớp</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* MODAL: XÁC NHẬN ĐỔI MÃ LỚP */}
      {rotatingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận đổi mã tham gia lớp</h3>
                <p className="text-xs text-slate-500 mt-0.5">Lớp: <strong className="text-slate-800">{rotatingClass.name}</strong></p>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-bold">⚠️ Lưu ý quy tắc an toàn:</p>
              <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-amber-900/90 leading-relaxed">
                <li>Mã cũ <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">{rotatingClass.inviteCode}</strong> sẽ hết hiệu lực ngay lập tức.</li>
                <li>Học sinh hiện có trong lớp <strong className="text-emerald-700">KHÔNG bị ảnh hưởng</strong> và vẫn giữ đầy đủ bài nộp, điểm số.</li>
                <li>Chỉ báo thành công sau khi đã lưu lên máy chủ hoàn tất.</li>
              </ul>
            </div>

            {rotateError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {rotateError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isRotating}
                onClick={() => {
                  setRotatingClass(null);
                  setRotateError(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isRotating}
                onClick={handleConfirmRotateCode}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isRotating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang đổi mã...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Xác nhận đổi mã</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification for Class Code actions */}
      {classCodeToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-slide-up border border-slate-800 max-w-sm">
          <Key className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="flex-1">{classCodeToast}</span>
          <button
            type="button"
            onClick={() => setClassCodeToast(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
