import React, { useState } from "react";
import { Lesson, Submission, ClassItem, RubricCriteria, GradeLevel, UserProfile } from "../types";
import { 
  Home,
  FileText,
  Folder,
  Layers,
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Plus, 
  Sliders, 
  Search, 
  Filter, 
  Code2, 
  Sparkles, 
  Cpu, 
  HelpCircle,
  ExternalLink,
  Award,
  Trash2,
  Edit,
  Save,
  Wand2,
  FileQuestion,
  Eye,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  HardDrive,
  School,
  Laptop,
  Calendar,
  MapPin,
  FolderPlus,
  Landmark,
  BookMarked,
  Settings,
  Bell,
  Headphones,
  ChevronDown,
  ArrowLeft,
  LogOut,
  GraduationCap,
  Paperclip,
  FileCode
} from "lucide-react";
import { QuizCreatorModal } from "./QuizCreatorModal";
import { ExamCreationSystem } from "./ExamCreationSystem";
import { StudentAccountManager } from "./StudentAccountManager";
import { CreateClassModal } from "./CreateClassModal";
import { CreateAssignmentModal } from "./CreateAssignmentModal";
import { getStoredStudents } from "../data/studentService";

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
  onOpenLogin,
  onOpenPythonLab,
  onOpenHtmlLab,
}) => {
  const [activeTab, setActiveTab] = useState<"home" | "submissions" | "lessons" | "classes" | "students">("home");
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "submitted" | "graded">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAiAssistantModal, setShowAiAssistantModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Class Management State
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [classFilter, setClassFilter] = useState<"all" | GradeLevel>("all");
  const [classSearchQuery, setClassSearchQuery] = useState("");

  // Add Lesson / Assignment Modal
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [isQuizCreatorOpen, setIsQuizCreatorOpen] = useState(false);
  const [lessonGradeFilter, setLessonGradeFilter] = useState<"all" | GradeLevel>("all");
  const [lessonSearchQuery, setLessonSearchQuery] = useState("");
  const [previewQuizLesson, setPreviewQuizLesson] = useState<Lesson | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLevel, setNewLevel] = useState<GradeLevel>("middle");
  const [newModuleType, setNewModuleType] = useState<"scratch" | "quiz" | "coding" | "robotics" | "html">("coding");
  const [newLanguage, setNewLanguage] = useState<"python" | "cpp">("python");
  const [newStarterCode, setNewStarterCode] = useState("n = int(input())\n# Viết mã tại đây\n");
  const [newHtmlStarter, setNewHtmlStarter] = useState("<h1>Xin chào!</h1>\n<p>Trang web đầu tiên của em.</p>");
  const [newCssStarter, setNewCssStarter] = useState("body { font-family: sans-serif; padding: 20px; }");
  const [newJsStarter, setNewJsStarter] = useState("console.log('Trang web đã tải!');");
  const [newScratchId, setNewScratchId] = useState("10128407");
  const [newTestInput, setNewTestInput] = useState("5");
  const [newTestOutput, setNewTestOutput] = useState("10");

  // Grading Modal State
  const [gradingSub, setGradingSub] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(10);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [rubricIdea, setRubricIdea] = useState<number>(8);
  const [rubricTechnique, setRubricTechnique] = useState<number>(8);
  const [rubricPresentation, setRubricPresentation] = useState<number>(8);

  // Filter Submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchStatus = submissionFilter === "all" || sub.status === submissionFilter;
    const matchSearch =
      sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = submissions.filter((s) => s.status === "submitted").length;
  const gradedCount = submissions.filter((s) => s.status === "graded").length;

  const handleOpenGrading = (sub: Submission) => {
    setGradingSub(sub);
    setGradeScore(sub.score || 8);
    setGradeFeedback(sub.teacherFeedback || "");
    if (sub.rubric) {
      setRubricIdea(sub.rubric.idea);
      setRubricTechnique(sub.rubric.technique);
      setRubricPresentation(sub.rubric.presentation);
    } else {
      setRubricIdea(8);
      setRubricTechnique(8);
      setRubricPresentation(8);
    }
  };

  const handleSaveQuickGrade = async () => {
    if (!gradingSub) return;
    const isRobotics = gradingSub.moduleType === "robotics";
    const totalScore = isRobotics ? rubricIdea + rubricTechnique + rubricPresentation : gradeScore;

    await onGradeSubmission(
      gradingSub.id,
      {
        idea: rubricIdea,
        technique: rubricTechnique,
        presentation: rubricPresentation,
        feedback: gradeFeedback,
      },
      totalScore,
      gradeFeedback
    );
    setGradingSub(null);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    await onAddLesson({
      title: newTitle,
      description: newDescription,
      level: newLevel,
      moduleType: newModuleType,
      language: newModuleType === "coding" ? newLanguage : newModuleType === "html" ? "html" : undefined,
      starterCode: newModuleType === "coding" ? newStarterCode : undefined,
      htmlStarter: newModuleType === "html" ? newHtmlStarter : undefined,
      cssStarter: newModuleType === "html" ? newCssStarter : undefined,
      jsStarter: newModuleType === "html" ? newJsStarter : undefined,
      scratchProjectId: newModuleType === "scratch" ? newScratchId : undefined,
      testcases:
        newModuleType === "coding"
          ? [
              { id: 1, input: newTestInput, expectedOutput: newTestOutput },
            ]
          : undefined,
      durationMinutes: 45,
    });

    setIsAddLessonModalOpen(false);
    setNewTitle("");
    setNewDescription("");
  };

  return (
    <div className="min-h-screen bg-[#f3f5fa] flex flex-row font-sans relative">
      {/* EDU-TECH LEFT SIDEBAR */}
      <aside className="w-16 md:w-20 bg-[#0b132b] text-white flex flex-col items-center py-5 shrink-0 z-30 sticky top-0 h-screen select-none border-r border-slate-800/80 shadow-sm">
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab("home")}
          className="mb-6 cursor-pointer group"
          title="EduSTEM Hub - Về Màn hình chính"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 group-hover:scale-105 flex items-center justify-center shadow-md shadow-blue-900/30 transition-transform relative">
            <Code2 className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-300 ring-2 ring-[#0b132b]" />
          </div>
        </div>

        {/* Vertical Navigation Icons */}
        <nav className="flex-1 w-full flex flex-col items-center gap-2 px-2">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === "home"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title="Màn hình chính"
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("submissions")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative ${
              activeTab === "submissions"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title="Bài tập & Chấm điểm"
          >
            <FileText className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lessons")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === "lessons"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title="Đề thi & Ngân hàng bài học"
          >
            <Folder className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("classes")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === "classes"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title="Quản lý lớp học & Phòng máy"
          >
            <School className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === "students"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title="Quản lý học sinh & Cloud Drive"
          >
            <Users className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lessons")}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Kho bài giảng STEM"
          >
            <BookOpen className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIsQuizCreatorOpen(true)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Hệ Thống Tạo Đề Thi (Azota / OCR / Ma Trận)"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
          </button>

          {/* Dedicated Python Free Coding Lab */}
          {onOpenPythonLab && (
            <button
              type="button"
              onClick={onOpenPythonLab}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all group relative mt-1 shadow-sm"
              title="Khu Lập Trình Python Tự Do (Python 3.10 Sandbox)"
            >
              <Code2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
            </button>
          )}

          {/* Dedicated HTML/CSS/JS Web Lab */}
          {onOpenHtmlLab && (
            <button
              type="button"
              onClick={onOpenHtmlLab}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 border border-orange-500/30 transition-all group relative mt-0.5 shadow-sm"
              title="Khu Viết Mã Nguồn HTML Tự Do (Web Studio)"
            >
              <FileCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400" />
            </button>
          )}
        </nav>

        {/* Bottom controls */}
        <div className="w-full flex flex-col items-center gap-2 px-2 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Hướng dẫn & Trợ giúp"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Cài đặt hệ thống"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR */}
        <header className="h-16 px-6 sm:px-8 bg-[#f3f5fa] border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-extrabold border border-blue-100">
              <span>CỔNG GIÁO VIÊN</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900">
              {activeTab === "home" && "Bàn Làm Việc Tổng Quan"}
              {activeTab === "submissions" && "Quản lý bài tập & Chấm điểm"}
              {activeTab === "lessons" && "Đề thi & Kho bài học"}
              {activeTab === "classes" && "Quản lý lớp học & Phòng máy"}
              {activeTab === "students" && "Quản lý học sinh & Google Drive"}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Access: Lập trình Python tự do */}
            {onOpenPythonLab && (
              <button
                type="button"
                onClick={onOpenPythonLab}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold shadow-2xs transition-colors"
                title="Mở khu thực hành Python tự do (Python 3.10 Sandbox)"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lập trình Python</span>
              </button>
            )}

            {/* Quick Access: Viết mã HTML tự do */}
            {onOpenHtmlLab && (
              <button
                type="button"
                onClick={onOpenHtmlLab}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-800 border border-orange-300 hover:bg-orange-100 text-xs font-bold shadow-2xs transition-colors"
                title="Mở khu thực hành viết mã HTML/CSS/JS tự do (Web Studio)"
              >
                <FileCode className="w-3.5 h-3.5 text-orange-600" />
                <span>Viết mã HTML</span>
              </button>
            )}

            {/* Quick Switch to Student View */}
            {onSwitchToStudent && (
              <button
                type="button"
                onClick={onSwitchToStudent}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
                title="Chuyển sang giao diện người học"
              >
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>Góc nhìn Học sinh</span>
              </button>
            )}

            {/* AI Assistant Teacher Suite Button */}
            <button
              type="button"
              onClick={() => setShowAiAssistantModal(true)}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Trợ lý AI K12</span>
            </button>

            {/* Academic badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold">
              <School className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tin học & STEM K12</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition-colors relative"
                title="Thông báo"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#f3f5fa]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-fade-in text-xs">
                  <div className="font-bold text-slate-900 mb-2 pb-2 border-b border-slate-100 flex justify-between items-center">
                    <span>Thông Báo Mới</span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">{pendingCount} chờ chấm</span>
                  </div>
                  {pendingCount > 0 ? (
                    <div
                      onClick={() => {
                        setActiveTab("submissions");
                        setShowNotifications(false);
                      }}
                      className="p-2 bg-amber-50/60 rounded-xl cursor-pointer hover:bg-amber-100/60 transition-colors"
                    >
                      <p className="font-semibold text-slate-800">Có {pendingCount} bài nộp cần chấm</p>
                      <span className="text-[10px] text-amber-700 font-bold">Nhấn để mở danh sách bài nộp →</span>
                    </div>
                  ) : (
                    <p className="text-slate-500 py-3 text-center">Không có thông báo mới</p>
                  )}
                </div>
              )}
            </div>

            {/* Teacher Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 pl-2 py-1 rounded-2xl hover:bg-white/80 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-xs overflow-hidden">
                  {(currentUser?.avatar || currentUser?.photoURL) ? (
                    <img src={currentUser.avatar || currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    "NM"
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-black text-slate-900 leading-tight">
                    {currentUser?.displayName || "Thầy Nguyễn Minh Nhật"}
                  </div>
                  <div className="text-[10px] text-blue-600 font-bold">
                    Giáo viên Tin học
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in text-xs">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="font-bold text-slate-900">{currentUser?.displayName || "Thầy Nguyễn Minh Nhật"}</div>
                    <div className="text-[11px] text-slate-400 truncate">{currentUser?.email || "nmnhat.n98@gmail.com"}</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                      Tài khoản Giáo viên K12
                    </div>
                  </div>

                  {onSwitchToStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onSwitchToStudent();
                      }}
                      className="w-full px-4 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span>Xem giao diện Học sinh</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Cài đặt hệ thống</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* DYNAMIC VIEW CONTENT */}
        <div className="flex-1 pb-16">
          {/* VIEW: HOME DASHBOARD */}
          {activeTab === "home" && (
            <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-7 animate-fade-in">
              {/* Deep Ocean Slate Banner Card */}
              <div className="bg-gradient-to-r from-[#0d1b3e] via-[#14295e] to-[#1e3a8a] rounded-3xl p-6 sm:p-8 text-white shadow-sm border border-blue-900/40 relative overflow-hidden">
                <div className="absolute -right-12 -bottom-16 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute right-12 top-0 w-44 h-44 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-200 text-xs font-bold mb-3 border border-white/10">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Hệ Thống Quản Trị Khảo Thí & Dạy Học K12</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2 flex items-center gap-2">
                        <span>Xin chào, {currentUser?.displayName || "Thầy Nguyễn Minh Nhật"}</span>
                        <span className="text-2xl">👋</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-blue-100/90 font-medium leading-relaxed">
                        Hỗ trợ soạn bài tập lập trình Scratch/Python/Web, tạo đề trắc nghiệm AI và theo dõi kết quả học tập học sinh chuẩn GDPT 2018.
                      </p>
                    </div>

                    {/* Banner Quick Stats Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-black/20 p-3 rounded-2xl border border-white/10 shrink-0">
                      <div className="text-center px-3 py-1.5">
                        <div className="text-lg font-black text-amber-300">{pendingCount}</div>
                        <div className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Chờ chấm</div>
                      </div>
                      <div className="text-center px-3 py-1.5 border-l border-white/10">
                        <div className="text-lg font-black text-white">{lessons.length}</div>
                        <div className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Bài học</div>
                      </div>
                      <div className="text-center px-3 py-1.5 border-l border-white/10">
                        <div className="text-lg font-black text-cyan-300">{classes.length}</div>
                        <div className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Lớp học</div>
                      </div>
                      <div className="text-center px-3 py-1.5 border-l border-white/10">
                        <div className="text-lg font-black text-emerald-300">{submissions.length}</div>
                        <div className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Bài nộp</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1: Nghiệp vụ Dạy học & Khảo thí */}
              <section>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <span>Nghiệp vụ Dạy học & Khảo thí</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">Quản lý lớp, đề thi và tiến độ học tập</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {/* Card: Bài tập & Chấm điểm */}
                  <div
                    onClick={() => setActiveTab("submissions")}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                      Bài tập & Chấm điểm
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      {pendingCount > 0 ? `${pendingCount} bài chờ chấm` : `${submissions.length} bài nộp`}
                    </div>
                  </div>

                  {/* Card: Đề thi & Ngân hàng bài */}
                  <div
                    onClick={() => setActiveTab("lessons")}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Folder className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                      Đề thi & Bài học
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      {lessons.length} đề thi & bài tập
                    </div>
                  </div>

                  {/* Card: Quản lý lớp & Phòng máy */}
                  <div
                    onClick={() => setActiveTab("classes")}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all">
                      <School className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-teal-600 transition-colors">
                      Quản lý Lớp học
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      {classes.length} lớp & phân hệ khối
                    </div>
                  </div>

                  {/* Card: Danh bạ Học sinh & Cloud */}
                  <div
                    onClick={() => setActiveTab("students")}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">
                      Danh bạ Học sinh
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      Tài khoản & Google Drive
                    </div>
                  </div>
                </div>
              </section>

              {/* DEDICATED SECTION: KHU VỰC LẬP TRÌNH PYTHON & VIẾT MÃ NGUỒN HTML TỰ DO */}
              <section className="bg-gradient-to-b from-white to-slate-50/50 p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-1.5 border border-emerald-200/80">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Phòng Thực Hành Số • Tự Do Không Cần Đề Bài</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span>Khu Vực Lập Trình Python & Viết Mã Nguồn HTML Tự Do</span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium max-w-md sm:text-right">
                    Giáo viên có thể trực tiếp soạn code mẫu, thử nghiệm giải thuật GDPT 2018, thiết kế giao diện web và kiểm tra bài làm mà không cần gán vào đề thi.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Card 1: Python Studio */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/60 transition-all">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                          <Code2 className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-700/60">
                          Python 3.10 Sandbox
                        </span>
                      </div>

                      <h4 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                        Khu Lập Trình Python (Python Studio)
                      </h4>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        Không gian thực hành Python tự do cho Giáo viên & Học sinh: Viết code, chạy thử nghiệm tức thì với input/output Stdin, kiểm thử thuật toán Tin học GDPT 2018 và trợ giảng AI thông minh.
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">✓</span> Chạy code trực tiếp ~50ms
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">✓</span> Hỗ trợ Stdin tự do
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">✓</span> 9 mẫu code GDPT 2018
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">✓</span> Gia sư AI sửa lỗi tức thì
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-2 relative z-10">
                      <button
                        type="button"
                        onClick={onOpenPythonLab}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        <Code2 className="w-4 h-4" />
                        <span>Vào Lập Trình Python Ngay</span>
                        <span className="text-sm">→</span>
                      </button>
                    </div>

                    <div className="absolute -bottom-6 -right-6 text-emerald-500/5 pointer-events-none group-hover:text-emerald-500/10 transition-colors">
                      <Code2 className="w-44 h-44" />
                    </div>
                  </div>

                  {/* Card 2: HTML / Web Studio */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 rounded-2xl p-6 text-white border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between group hover:border-orange-500/60 transition-all">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                          <FileCode className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-950/90 text-orange-300 border border-orange-700/60">
                          Khung HTML5 Chuẩn Trống
                        </span>
                      </div>

                      <h4 className="text-lg font-black text-white group-hover:text-orange-300 transition-colors">
                        Khu Viết Mã Nguồn HTML (Web Studio)
                      </h4>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        Mặc định là khung chuẩn HTML5 rỗng. Tự do thiết kế cấu trúc web, phối màu CSS3, thêm tương tác JavaScript và xem trước trực tiếp trang web chạy thật trên màn hình PC hoặc Mobile.
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="text-orange-400 font-bold">✓</span> Mặc định HTML5 rỗng chuẩn
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-orange-400 font-bold">✓</span> Xem trước Live Preview
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-orange-400 font-bold">✓</span> Thao tác HTML, CSS, JS tách biệt
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-orange-400 font-bold">✓</span> Tải file hoàn chỉnh về máy
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-2 relative z-10">
                      <button
                        type="button"
                        onClick={onOpenHtmlLab}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-orange-600 hover:bg-orange-500 active:scale-[0.99] text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 cursor-pointer"
                      >
                        <FileCode className="w-4 h-4" />
                        <span>Vào Viết Mã HTML Ngay</span>
                        <span className="text-sm">→</span>
                      </button>
                    </div>

                    <div className="absolute -bottom-6 -right-6 text-orange-500/5 pointer-events-none group-hover:text-orange-500/10 transition-colors">
                      <FileCode className="w-44 h-44" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Bộ công cụ Soạn giảng & Trợ lý số */}
              <section>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <span>Bộ công cụ Soạn giảng & Trợ lý số</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">Trí tuệ nhân tạo & Phòng thực hành số</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {/* Card: Sinh đề trắc nghiệm AI */}
                  <div
                    onClick={() => setIsQuizCreatorOpen(true)}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition-all">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-amber-600 transition-colors">
                      Hệ Thống Tạo Đề Thi
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      Nhận dạng file, ảnh OCR & Ma trận
                    </div>
                  </div>

                  {/* Card: Phòng Lab Lập trình */}
                  <div
                    onClick={onOpenPythonLab || (() => setActiveTab("lessons"))}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all">
                      <Laptop className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-purple-600 transition-colors">
                      Phòng Lab Lập trình
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      Python, Web HTML, Scratch
                    </div>
                  </div>

                  {/* Card: Khóa học GDPT 2018 */}
                  <div
                    onClick={() => setActiveTab("lessons")}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-cyan-600 transition-colors">
                      Khóa học GDPT 2018
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      Chương trình Tin học chuẩn
                    </div>
                  </div>

                  {/* Card: Google Sheets & Drive */}
                  <div
                    onClick={() => setActiveTab("students")}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-rose-600 group-hover:text-white transition-all">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-rose-600 transition-colors">
                      Đồng bộ Cloud Drive
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      Google Drive & Sheets
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Thao tác Nhanh */}
              <section>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                    Thao tác Nhanh
                  </h3>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {/* Card: Tạo lớp học */}
                  <div
                    onClick={() => setIsCreateClassOpen(true)}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all">
                      <FolderPlus className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-teal-700 transition-colors">
                      Tạo lớp học mới
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      Phân hệ cấp học & khối
                    </div>
                  </div>

                  {/* Card: Tạo bài tập mới */}
                  <div
                    onClick={() => setIsCreateAssignmentOpen(true)}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors">
                      Tạo bài tập mới
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      Đính kèm file & Hạn nộp
                    </div>
                  </div>

                  {/* Card: Tạo trắc nghiệm AI */}
                  <div
                    onClick={() => setIsQuizCreatorOpen(true)}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors">
                      Tạo đề mới (Azota)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      Nhập file, ảnh OCR & Ma trận
                    </div>
                  </div>

                  {/* Card: Chấm điểm nhanh */}
                  <div
                    onClick={() => setActiveTab("submissions")}
                    className="bg-white rounded-2xl sm:rounded-3xl p-6 shadow-2xs border border-slate-200/80 hover:shadow-md hover:-translate-y-0.5 transition-all text-center flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition-all">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-slate-800 group-hover:text-amber-700 transition-colors">
                      Chấm điểm theo Rubric
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-medium">
                      Tiêu chí & Nhận xét
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* SUBVIEWS: SUBMISSIONS, LESSONS, CLASSES, STUDENTS */}
          {activeTab !== "home" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
              {/* Breadcrumb Navigation & Subview Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("home")}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← Về Màn hình chính</span>
                </button>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveTab("submissions")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "submissions"
                        ? "bg-[#1a2154] text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Bài tập & Chấm điểm ({submissions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("lessons")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "lessons"
                        ? "bg-[#1a2154] text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Đề thi & Bài học ({lessons.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("classes")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "classes"
                        ? "bg-[#1a2154] text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Quản lý lớp ({classes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("students")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "students"
                        ? "bg-[#1a2154] text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Quản lý học sinh & Drive
                  </button>

                  {/* Dedicated Lab Shortcuts */}
                  {onOpenPythonLab && (
                    <button
                      type="button"
                      onClick={onOpenPythonLab}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 flex items-center gap-1.5 transition-colors border border-emerald-300"
                      title="Mở khu thực hành Python tự do"
                    >
                      <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Lab Python</span>
                    </button>
                  )}

                  {onOpenHtmlLab && (
                    <button
                      type="button"
                      onClick={onOpenHtmlLab}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-orange-800 bg-orange-50 hover:bg-orange-100/80 flex items-center gap-1.5 transition-colors border border-orange-300"
                      title="Mở khu thực hành HTML Web tự do"
                    >
                      <FileCode className="w-3.5 h-3.5 text-orange-600" />
                      <span>Lab HTML</span>
                    </button>
                  )}
                </div>
              </div>

              {/* TAB 1: SUBMISSIONS & GRADING */}
      {activeTab === "submissions" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm tên học sinh, bài học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <div className="flex items-center gap-1.5">
                {(["all", "submitted", "graded"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSubmissionFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      submissionFilter === filter
                        ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {filter === "all" && "Tất cả bài"}
                    {filter === "submitted" && `Chờ chấm (${pendingCount})`}
                    {filter === "graded" && `Đã chấm (${gradedCount})`}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsCreateAssignmentOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all ml-auto sm:ml-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo bài tập mới</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Học sinh</th>
                    <th className="py-3 px-4">Bài học / Dự án</th>
                    <th className="py-3 px-4">Phân loại</th>
                    <th className="py-3 px-4">Trạng thái & Điểm</th>
                    <th className="py-3 px-4">Ngày nộp</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Không tìm thấy bài nộp nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {sub.studentName}
                          <div className="text-[10px] text-slate-400 font-normal">{sub.studentEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-700">
                          {sub.lessonTitle}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.moduleType === "robotics"
                              ? "bg-emerald-100 text-emerald-800"
                              : sub.moduleType === "coding"
                              ? "bg-indigo-100 text-indigo-800"
                              : sub.moduleType === "scratch"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-sky-100 text-sky-800"
                          }`}>
                            {sub.moduleType.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${sub.status === "graded" ? "bg-emerald-500" : "bg-amber-500"}`} />
                            <span className="font-bold text-slate-900">
                              {sub.status === "graded" ? `${sub.score}/${sub.maxScore}đ` : "Chờ chấm"}
                            </span>
                          </div>
                          {sub.rubric && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Ý tưởng: {sub.rubric.idea} • Kỹ thuật: {sub.rubric.technique} • Trình bày: {sub.rubric.presentation}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(sub.submittedAt).toLocaleDateString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenGrading(sub)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors border border-blue-200"
                          >
                            {sub.moduleType === "robotics" ? "Chấm Rubric" : "Chấm điểm / Sửa"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LESSON & ASSIGNMENT MANAGEMENT */}
      {activeTab === "lessons" && (() => {
        const filteredLessons = lessons.filter((lesson) => {
          const matchesGrade = lessonGradeFilter === "all" || lesson.level === lessonGradeFilter;
          const matchesSearch =
            !lessonSearchQuery ||
            lesson.title.toLowerCase().includes(lessonSearchQuery.toLowerCase()) ||
            lesson.description.toLowerCase().includes(lessonSearchQuery.toLowerCase()) ||
            (lesson.subject && lesson.subject.toLowerCase().includes(lessonSearchQuery.toLowerCase())) ||
            (lesson.gradeName && lesson.gradeName.toLowerCase().includes(lessonSearchQuery.toLowerCase()));
          return matchesGrade && matchesSearch;
        });

        return (
          <div className="space-y-5">
            {/* Header Controls Bar */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Ngân Hàng Đề Thi & Bài Tập</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                    {filteredLessons.length} bài
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý đề bài, bài tập về nhà, đề kiểm tra và bài thực hành phòng máy
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsCreateAssignmentOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo bài tập mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsQuizCreatorOpen(true)}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-indigo-200 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sinh đề AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddLessonModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Lab Lập trình</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm theo tên bài, môn học, khối..."
                  value={lessonSearchQuery}
                  onChange={(e) => setLessonSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {(["all", "elementary", "middle", "high", "robotics"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLessonGradeFilter(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      lessonGradeFilter === lvl
                        ? "bg-blue-50 text-blue-700 border border-blue-200 font-bold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {lvl === "all" && "Tất cả"}
                    {lvl === "elementary" && "Tiểu Học"}
                    {lvl === "middle" && "THCS"}
                    {lvl === "high" && "THPT"}
                    {lvl === "robotics" && "Robotics"}
                  </button>
                ))}
              </div>
            </div>

            {/* Lessons Grid */}
            {filteredLessons.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-600 text-sm">Chưa tìm thấy bài tập nào phù hợp</p>
                <p className="text-xs text-slate-400 mt-1">Bấm "Tạo bài tập mới" để soạn bài và giao cho học sinh.</p>
                <button
                  type="button"
                  onClick={() => setIsCreateAssignmentOpen(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo bài tập mới ngay</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            lesson.level === "elementary"
                              ? "bg-amber-100 text-amber-800"
                              : lesson.level === "middle"
                              ? "bg-indigo-100 text-indigo-800"
                              : lesson.level === "high"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {lesson.level === "elementary" ? "Tiểu Học" : lesson.level === "middle" ? "THCS" : lesson.level === "high" ? "THPT" : "Robotics"}
                          </span>
                          {lesson.gradeName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {lesson.gradeName}
                            </span>
                          )}
                          {lesson.subject && (
                            <span className="text-[10px] font-semibold text-slate-500">
                              • {lesson.subject}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">{lesson.durationMinutes || 45} phút</span>
                      </div>

                      {lesson.purpose && (
                        <div className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mb-2">
                          {lesson.purpose}
                        </div>
                      )}

                      <h3 className="font-bold text-sm text-slate-900 mb-1.5 leading-snug line-clamp-2">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {lesson.description}
                      </p>

                      {/* Attachments & Target Classes Tags */}
                      {((lesson.attachments && lesson.attachments.length > 0) || (lesson.targetClasses && lesson.targetClasses.length > 0) || lesson.dueDate) && (
                        <div className="mb-3 space-y-1 text-[11px] text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                          {lesson.dueDate && (
                            <div className="flex items-center gap-1.5 text-amber-700">
                              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="font-semibold">Hạn:</span>
                              <span>{new Date(lesson.dueDate).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          )}
                          {lesson.attachments && lesson.attachments.length > 0 && (
                            <div className="flex items-center gap-1.5 text-indigo-700">
                              <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{lesson.attachments.length} tệp đính kèm ({lesson.attachments[0].name})</span>
                            </div>
                          )}
                          {lesson.targetClasses && lesson.targetClasses.length > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <span className="font-semibold">Lớp:</span>
                              <span className="text-slate-600">{lesson.targetClasses.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                        <div>Loại hình: <strong className="text-slate-800">{lesson.moduleType}</strong></div>
                        {lesson.moduleType === "quiz" && (
                          <div className="flex items-center justify-between pt-0.5">
                            <span>Số câu hỏi: <strong className="text-blue-600">{lesson.questions?.length || 0} câu</strong></span>
                            {lesson.questions && lesson.questions.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setPreviewQuizLesson(lesson)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> Xem câu hỏi
                              </button>
                            )}
                          </div>
                        )}
                        {lesson.testcases && (
                          <div>Số lượng test case: <strong className="text-slate-800">{lesson.testcases.length} tests</strong></div>
                        )}
                        {lesson.scratchProjectId && (
                          <div>Scratch Project ID: <code className="text-blue-600">{lesson.scratchProjectId}</code></div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                      <span className="text-[11px] text-slate-400">
                        {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      <button
                        onClick={() => onDeleteLesson(lesson.id)}
                        title="Xóa bài học"
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 3: CLASSES */}
      {activeTab === "classes" && (
        <div className="space-y-6">
          {/* Header Bar with Create Class Button */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Quản Lý Lớp Học & Phân Công Giảng Dạy
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  {classes.length} Lớp
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tổ chức danh sách lớp theo khối học (Tiểu học, THCS, THPT, Robotics), quản lý sĩ số và phân công giáo viên phụ trách.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateClassOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>+ Tạo Lớp Học Mới</span>
            </button>
          </div>

          {/* Quick Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Lớp Đang Mở</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{classes.length} Lớp</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Sẵn sàng nhận học sinh đăng ký</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Sĩ Số Dự Kiến</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {classes.reduce((sum, c) => sum + (Number(c.studentCount) || 0), 0)} Học sinh
              </div>
              <div className="text-[10px] text-indigo-500 mt-0.5">Quy mô đào tạo toàn hệ thống</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phân Bổ Cấp Học</div>
              <div className="text-xs font-bold text-slate-800 mt-1.5 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                  {classes.filter((c) => c.gradeLevel === "elementary").length} Tiểu học
                </span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                  {classes.filter((c) => c.gradeLevel === "middle").length} THCS
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  {classes.filter((c) => c.gradeLevel === "high").length} THPT
                </span>
              </div>
            </div>
          </div>

          {/* Search and Grade Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setClassFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  classFilter === "all"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tất cả ({classes.length})
              </button>
              <button
                type="button"
                onClick={() => setClassFilter("elementary")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  classFilter === "elementary"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Tiểu học ({classes.filter((c) => c.gradeLevel === "elementary").length})
              </button>
              <button
                type="button"
                onClick={() => setClassFilter("middle")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  classFilter === "middle"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                THCS ({classes.filter((c) => c.gradeLevel === "middle").length})
              </button>
              <button
                type="button"
                onClick={() => setClassFilter("high")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  classFilter === "high"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                THPT ({classes.filter((c) => c.gradeLevel === "high").length})
              </button>
              <button
                type="button"
                onClick={() => setClassFilter("robotics")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  classFilter === "robotics"
                    ? "bg-purple-600 text-white shadow-2xs"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                }`}
              >
                Robotics ({classes.filter((c) => c.gradeLevel === "robotics").length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={classSearchQuery}
                onChange={(e) => setClassSearchQuery(e.target.value)}
                placeholder="Tìm lớp, giáo viên, phòng lab..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Classes Cards Grid */}
          {(() => {
            const filteredClasses = classes.filter((cls) => {
              if (classFilter !== "all" && cls.gradeLevel !== classFilter) return false;
              if (classSearchQuery.trim()) {
                const q = classSearchQuery.toLowerCase().trim();
                return (
                  cls.name.toLowerCase().includes(q) ||
                  cls.teacherName.toLowerCase().includes(q) ||
                  cls.description.toLowerCase().includes(q) ||
                  (cls.room && cls.room.toLowerCase().includes(q))
                );
              }
              return true;
            });

            if (filteredClasses.length === 0) {
              return (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <FolderPlus className="w-7 h-7" />
                  </div>
                  <h3 className="font-black text-base text-slate-900 mb-1">
                    {classes.length === 0 ? "Chưa có lớp học nào trên hệ thống" : "Không tìm thấy lớp học phù hợp"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    {classes.length === 0
                      ? "Hệ thống đang trống. Bấm '+ Tạo Lớp Mới Ngay' để bắt đầu khởi tạo lớp học cho học sinh."
                      : "Chưa có lớp học nào thuộc bộ lọc này hoặc từ khóa tìm kiếm không khớp."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateClassOpen(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo Lớp Mới Ngay</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredClasses.map((cls) => {
                  const isElementary = cls.gradeLevel === "elementary";
                  const isMiddle = cls.gradeLevel === "middle";
                  const isHigh = cls.gradeLevel === "high";

                  return (
                    <div
                      key={cls.id}
                      className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top badges & delete button */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                isElementary
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isMiddle
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : isHigh
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                              }`}
                            >
                              {isElementary
                                ? "Tiểu học"
                                : isMiddle
                                ? "THCS"
                                : isHigh
                                ? "THPT"
                                : "Robotics"}
                            </span>

                            {cls.schoolYear && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                <span>{cls.schoolYear}</span>
                              </span>
                            )}
                          </div>

                          {onDeleteClass && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Bạn có chắc chắn muốn xóa lớp "${cls.name}" khỏi danh sách quản trị?`
                                  )
                                ) {
                                  onDeleteClass(cls.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                              title="Xóa lớp học"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Class Name */}
                        <h3 className="font-black text-base text-slate-900 mb-1.5 leading-snug group-hover:text-emerald-700 transition-colors">
                          {cls.name}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                          {cls.description}
                        </p>

                        {/* Meta properties */}
                        <div className="space-y-1.5 py-3 border-t border-slate-100 text-xs">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400">Sĩ số dự kiến:</span>
                            <span className="font-bold text-slate-800">{cls.studentCount} Học sinh</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400">Phụ trách:</span>
                            <strong className="text-slate-900 font-semibold">{cls.teacherName}</strong>
                          </div>
                          {cls.room && (
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="text-slate-400">Địa điểm / Lab:</span>
                              <span className="text-slate-700 font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {cls.room}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("students")}
                          className="w-full text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 py-2 px-3 rounded-xl border border-blue-200 transition-colors text-center flex items-center justify-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Quản lý học sinh lớp này →</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 4: STUDENT ACCOUNTS & GOOGLE SHEETS */}
      {activeTab === "students" && (
        <StudentAccountManager classes={classes} />
      )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: GRADING SUBMISSION */}
      {gradingSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Chấm Bài: {gradingSub.studentName}
                </h3>
                <p className="text-xs text-slate-500">{gradingSub.lessonTitle}</p>
              </div>
              <button
                onClick={() => setGradingSub(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content Preview */}
            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono max-h-40 overflow-y-auto">
              {gradingSub.content.code && (
                <div>
                  <div className="text-slate-400 mb-1 font-sans font-bold">Mã nguồn nộp ({gradingSub.content.language}):</div>
                  <pre className="text-slate-800 whitespace-pre-wrap">{gradingSub.content.code}</pre>
                </div>
              )}
              {gradingSub.content.videoUrl && (
                <div className="font-sans mb-1">
                  <span className="text-slate-500">Video sản phẩm: </span>
                  <a href={gradingSub.content.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    {gradingSub.content.videoUrl}
                  </a>
                </div>
              )}
              {gradingSub.content.projectDescription && (
                <div className="font-sans text-slate-700 mt-1">
                  {gradingSub.content.projectDescription}
                </div>
              )}
            </div>

            {/* Robotics Rubric vs Standard Score */}
            {gradingSub.moduleType === "robotics" ? (
              <div className="space-y-4 mb-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>1. Ý tưởng (0 - 10đ):</span>
                    <span className="text-amber-600">{rubricIdea}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={rubricIdea}
                    onChange={(e) => setRubricIdea(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>2. Kỹ thuật (0 - 10đ):</span>
                    <span className="text-sky-600">{rubricTechnique}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={rubricTechnique}
                    onChange={(e) => setRubricTechnique(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>3. Trình bày (0 - 10đ):</span>
                    <span className="text-emerald-600">{rubricPresentation}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={rubricPresentation}
                    onChange={(e) => setRubricPresentation(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div className="p-2.5 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-bold">
                  <span>Tổng điểm Rubric:</span>
                  <span className="text-amber-400 font-black text-sm">
                    {rubricIdea + rubricTechnique + rubricPresentation} / 30 điểm
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm số (Thang 10):
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lời phê và nhận xét của giáo viên:
              </label>
              <textarea
                rows={3}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Nhận xét ưu điểm và hướng dẫn cải thiện..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setGradingSub(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                onClick={handleSaveQuickGrade}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Lưu Đánh Giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD LESSON / EXAM QUESTION */}
      {isAddLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-black text-base text-slate-900">
                Thêm Bài Học / Ngân Hàng Đề Thi Mới
              </h3>
              <button
                onClick={() => setIsAddLessonModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề bài học / đề thi: *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Lập trình C++: Tìm ước chung lớn nhất"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cấp học:</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as GradeLevel)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="elementary">Tiểu học</option>
                    <option value="middle">THCS</option>
                    <option value="high">THPT</option>
                    <option value="robotics">Robotics & STEM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hình thức module:</label>
                  <select
                    value={newModuleType}
                    onChange={(e) => setNewModuleType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="coding">Lập trình Monaco (Testcases)</option>
                    <option value="html">Lập trình Web (HTML/CSS/JS Lab)</option>
                    <option value="scratch">Dự án nhúng Scratch</option>
                    <option value="quiz">Trắc nghiệm máy tính</option>
                    <option value="robotics">Dự án Robotics & Rubric</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả và yêu cầu đề bài:</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Nêu rõ yêu cầu đầu vào, đầu ra hoặc hướng dẫn thực hành..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Module specific inputs */}
              {newModuleType === "coding" && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-4">
                    <label className="font-bold text-slate-700">Ngôn ngữ mặc định:</label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={newLanguage === "python"}
                        onChange={() => setNewLanguage("python")}
                      />
                      <span>Python</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={newLanguage === "cpp"}
                        onChange={() => setNewLanguage("cpp")}
                      />
                      <span>C++</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Test Case Input mẫu:</label>
                      <input
                        type="text"
                        value={newTestInput}
                        onChange={(e) => setNewTestInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Output kỳ vọng:</label>
                      <input
                        type="text"
                        value={newTestOutput}
                        onChange={(e) => setNewTestOutput(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {newModuleType === "html" && (
                <div className="space-y-3 p-3 bg-orange-50/60 rounded-2xl border border-orange-200">
                  <div className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                    <span>🌐 Khởi tạo mã nguồn dự án Web HTML/CSS/JS:</span>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mã nguồn HTML ban đầu:</label>
                    <textarea
                      rows={3}
                      value={newHtmlStarter}
                      onChange={(e) => setNewHtmlStarter(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                      placeholder="<h1>Tiêu đề</h1>"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mã CSS ban đầu:</label>
                      <textarea
                        rows={3}
                        value={newCssStarter}
                        onChange={(e) => setNewCssStarter(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                        placeholder="body { margin: 0; }"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mã JavaScript ban đầu:</label>
                      <textarea
                        rows={3}
                        value={newJsStarter}
                        onChange={(e) => setNewJsStarter(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                        placeholder="console.log('Xin chào!');"
                      />
                    </div>
                  </div>
                </div>
              )}

              {newModuleType === "scratch" && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block font-bold text-slate-700 mb-1">Mã Scratch Project ID (embed):</label>
                  <input
                    type="text"
                    value={newScratchId}
                    onChange={(e) => setNewScratchId(e.target.value)}
                    placeholder="10128407"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              )}

              {newModuleType === "quiz" && (
                <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/80 rounded-2xl border border-indigo-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-indigo-950">
                      Hệ Thống Biên Soạn Trắc Nghiệm Đa Cấp Học
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 max-w-sm mx-auto">
                      Sử dụng công cụ chuyên biệt để sinh tự động bộ câu hỏi bằng Gemini AI hoặc soạn thảo thủ công từng câu chuẩn sư phạm.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddLessonModalOpen(false);
                      setIsQuizCreatorOpen(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Mở Trình Tạo Trắc Nghiệm AI & Thủ Công</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddLessonModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  Lưu Bài Học Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HỆ THỐNG TẠO ĐỀ THI TOÀN DIỆN (AZOTA STYLE / FILE UPLOAD / OCR / MA TRẬN / TỰ SOẠN) */}
      <ExamCreationSystem
        isOpen={isQuizCreatorOpen}
        onClose={() => setIsQuizCreatorOpen(false)}
        classes={classes}
        onSaveExam={onAddLesson}
        initialGradeLevel="middle"
      />

      {/* PREVIEW QUIZ QUESTIONS MODAL */}
      {previewQuizLesson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-blue-600" />
                  <span>Bộ Câu Hỏi Trắc Nghiệm: {previewQuizLesson.title}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Tổng số: {previewQuizLesson.questions?.length || 0} câu hỏi
                </p>
              </div>
              <button
                onClick={() => setPreviewQuizLesson(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(!previewQuizLesson.questions || previewQuizLesson.questions.length === 0) ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Bài học này chưa có câu hỏi trắc nghiệm chi tiết.
                </div>
              ) : (
                previewQuizLesson.questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-slate-900 whitespace-pre-wrap">
                        {q.question}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`text-xs p-2 rounded-xl flex items-center gap-2 border ${
                            q.correctIndex === oIdx
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-md text-[10px] font-mono font-black flex items-center justify-center shrink-0 ${
                              q.correctIndex === oIdx
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="truncate">{opt}</span>
                          {q.correctIndex === oIdx && (
                            <span className="text-[10px] text-emerald-600 font-bold ml-auto">Đúng</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="pl-8 text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-slate-100">
                        <strong className="text-slate-700">Giải thích: </strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setPreviewQuizLesson(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: CREATE ASSIGNMENT */}
      <CreateAssignmentModal
        isOpen={isCreateAssignmentOpen}
        onClose={() => setIsCreateAssignmentOpen(false)}
        onSaveAssignment={onAddLesson}
        classes={classes}
        initialGrade="Khối 10"
        initialSubject="Tin học"
      />

      {/* MODAL: CREATE NEW CLASS */}
      <CreateClassModal
        isOpen={isCreateClassOpen}
        onClose={() => setIsCreateClassOpen(false)}
        currentUser={currentUser}
        onSaveClass={(newClass) => {
          if (onAddClass) {
            onAddClass(newClass);
          }
        }}
      />

      {/* FLOATING TEACHER SUPPORT BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setShowSupportModal(true)}
          className="bg-slate-900/95 hover:bg-slate-900 text-white rounded-full p-2.5 pr-4 shadow-lg shadow-slate-900/20 border border-slate-700/80 backdrop-blur-md flex items-center gap-2 group transition-all hover:scale-105 cursor-pointer"
          title="Hỗ trợ & Tài liệu Giáo viên"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-wide text-slate-200 group-hover:text-white">Hỗ trợ giáo viên</span>
        </button>
      </div>

      {/* MODAL: TRỢ LÝ AI GIÁO VIÊN */}
      {showAiAssistantModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    Trợ Lý AI Giáo Viên K12
                  </h3>
                  <p className="text-[11px] text-slate-500">Bộ công cụ hỗ trợ soạn giảng và khảo thí thông minh</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiAssistantModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 rounded-2xl p-4 text-white mb-4 shadow-sm">
              <div className="text-[11px] font-bold text-white/80">Trạng thái mô hình AI</div>
              <div className="text-xl font-black mt-0.5">Gemini 2.5 Pro Giáo Dục</div>
              <div className="text-[11px] text-white/80 mt-1">Đã tích hợp chuẩn GDPT 2018 môn Tin học (Tiểu học, THCS, THPT)</div>
            </div>

            <div className="space-y-2.5 mb-5 text-xs">
              <div
                onClick={() => {
                  setShowAiAssistantModal(false);
                  setIsQuizCreatorOpen(true);
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-700">Tự động sinh Đề trắc nghiệm</div>
                    <div className="text-[11px] text-slate-500">Soạn 4 mức độ nhận biết, thông hiểu, vận dụng theo chủ đề</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">Mở →</span>
              </div>

              <div
                onClick={() => {
                  setShowAiAssistantModal(false);
                  setIsAddLessonModalOpen(true);
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-indigo-700">Soạn bài thực hành Lập trình</div>
                    <div className="text-[11px] text-slate-500">Mẫu starter code Python, Scratch, HTML5 và testcases</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">Mở →</span>
              </div>

              <div
                onClick={() => {
                  setShowAiAssistantModal(false);
                  setActiveTab("submissions");
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-teal-700">Chấm bài theo Barem Rubric</div>
                    <div className="text-[11px] text-slate-500">Đánh giá tiêu chí ý tưởng, kỹ thuật lập trình và phản hồi</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-teal-600 group-hover:translate-x-0.5 transition-transform">Mở →</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAiAssistantModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUPPORT & HELP */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  Trung Tâm Hỗ Trợ Giáo Viên
                </h3>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-5 text-xs text-slate-600">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="font-bold text-slate-800">Hướng dẫn nhanh cho giáo viên:</div>
                <p>• <strong>Tạo lớp mới:</strong> Vào mục <em>Quản lý lớp</em> hoặc <em>Tiện ích</em> để mở lớp và phân công khối học.</p>
                <p>• <strong>Soạn bài tập & đề thi:</strong> Dùng <em>Ngân hàng câu hỏi</em> để sinh đề AI hoặc tự nhập trắc nghiệm.</p>
                <p>• <strong>Chấm điểm:</strong> Vào mục <em>Bài tập</em> để chấm bài nộp với Rubric điểm tự động.</p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-blue-900">
                <div className="font-bold text-blue-950 mb-0.5">Giáo viên phụ trách hệ thống:</div>
                <div>Thầy Nguyễn Minh Nhật</div>
                <div className="text-[11px] text-blue-700 mt-0.5">Email hỗ trợ: nmnhat.n98@gmail.com</div>
              </div>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* MODAL: SYSTEM SETTINGS */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  Cài Đặt Hệ Thống & Trường Học
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 mb-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên giáo viên hiển thị:</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.displayName || "Thầy Nguyễn Minh Nhật"}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cơ sở giáo dục / Trường học:</label>
                <input
                  type="text"
                  defaultValue="Trường K12 & CLB Robotics STEM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Năm học:</label>
                <input
                  type="text"
                  defaultValue="2024 - 2025"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-700">
                <span>Chế độ chấm điểm tự động AI</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                  Bật
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
