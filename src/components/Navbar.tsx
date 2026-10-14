import React, { useState } from "react";
import { UserProfile, GradeLevel, UserRole, Submission } from "../types";
import { 
  Code2, 
  BookOpen, 
  Trophy, 
  LogIn, 
  LogOut, 
  ChevronDown, 
  ShieldCheck, 
  User, 
  FileCode,
  Bell,
  CheckCircle2,
  Award,
  Clock,
  Sparkles,
  GraduationCap,
  Cpu,
  LayoutDashboard,
  Menu,
  X,
  Info
} from "lucide-react";

interface NavbarProps {
  currentUser: UserProfile;
  onRoleChange: (role: "teacher" | "student") => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedLevel: GradeLevel | "all";
  setSelectedLevel: (level: GradeLevel | "all") => void;
  onOpenLogin?: (role?: UserRole) => void;
  onLogout?: () => void;
  submissions?: Submission[];
  onSelectLessonById?: (lessonId: string) => void;
  onOpenAbout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  activeTab,
  setActiveTab,
  selectedLevel,
  setSelectedLevel,
  onOpenLogin,
  onLogout,
  submissions = [],
  onSelectLessonById,
  onOpenAbout,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isPracticeMenuOpen, setIsPracticeMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [readSubmissions, setReadSubmissions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`lms_read_notifications_${currentUser.uid}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Calculate graded submissions for student
  const studentGradedSubmissions = (submissions || []).filter((s) => {
    if (s.status !== "graded") return false;
    const matchId = s.studentId === currentUser.uid;
    const matchEmail = currentUser.email && s.studentEmail && s.studentEmail.toLowerCase() === currentUser.email.toLowerCase();
    const matchName = currentUser.displayName && s.studentName && s.studentName.toLowerCase() === currentUser.displayName.toLowerCase();
    const matchCode = currentUser.studentCode && s.studentId === currentUser.studentCode;
    return matchId || matchEmail || matchName || matchCode;
  }).sort((a, b) => new Date(b.gradedAt || b.submittedAt).getTime() - new Date(a.gradedAt || a.submittedAt).getTime());

  const unreadCount = studentGradedSubmissions.filter((s) => !readSubmissions.includes(s.id)).length;

  const handleToggleNotifications = () => {
    setIsNotificationOpen((prev) => {
      const next = !prev;
      if (next && unreadCount > 0) {
        const allIds = studentGradedSubmissions.map((s) => s.id);
        setReadSubmissions(allIds);
        try {
          localStorage.setItem(`lms_read_notifications_${currentUser.uid}`, JSON.stringify(allIds));
        } catch {}
      }
      return next;
    });
  };

  const handleMarkAllRead = () => {
    const allIds = studentGradedSubmissions.map((s) => s.id);
    setReadSubmissions(allIds);
    try {
      localStorage.setItem(`lms_read_notifications_${currentUser.uid}`, JSON.stringify(allIds));
    } catch {}
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Hamburger & Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Drawer Hamburger Button (< 768px) */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Mở menu điều hướng"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo & Tên ứng dụng */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => setActiveTab(currentUser.role === "teacher" ? "teacher-admin" : "lessons")}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-900 tracking-tight leading-none">
                  CodeHiểu
                </span>
                <span className="hidden sm:inline text-[11px] text-blue-600 font-medium tracking-tight mt-0.5 leading-none">
                  Học Python cùng gia sư AI
                </span>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Navigation Tabs (hidden on mobile < 768px) */}
          {currentUser.role === "student" ? (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {/* 1. Việc học của em */}
              <button
                type="button"
                onClick={() => setActiveTab("lessons")}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "lessons"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Việc học của em</span>
              </button>

              {/* 2. Phòng thực hành (Gộp Python & HTML/CSS) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPracticeMenuOpen((prev) => !prev)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "python-lab" || activeTab === "html-lab" || activeTab === "ugot-lab"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Code2 className="w-4 h-4 text-emerald-600" />
                  <span>Phòng thực hành</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isPracticeMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsPracticeMenuOpen(false)}
                    />
                    <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 animate-fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPracticeMenuOpen(false);
                          setActiveTab("python-lab");
                        }}
                        className={`w-full px-3 py-2.5 text-left text-xs flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px] ${
                          activeTab === "python-lab" ? "text-blue-600 font-semibold bg-blue-50/50" : "text-slate-700"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Code2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">Python 3</div>
                          <div className="text-[11px] text-slate-500">Chạy thử và gỡ lỗi code</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPracticeMenuOpen(false);
                          setActiveTab("ugot-lab");
                        }}
                        className={`w-full px-3 py-2.5 text-left text-xs flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px] ${
                          activeTab === "ugot-lab" ? "text-indigo-600 font-semibold bg-indigo-50/50" : "text-slate-700"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">Robot UGOT</div>
                          <div className="text-[11px] text-slate-500">Cầu nối WSS Windows Laptop</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPracticeMenuOpen(false);
                          setActiveTab("html-lab");
                        }}
                        className={`w-full px-3 py-2.5 text-left text-xs flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px] ${
                          activeTab === "html-lab" ? "text-blue-600 font-semibold bg-blue-50/50" : "text-slate-700"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">HTML/CSS</div>
                          <div className="text-[11px] text-slate-500">Thiết kế web và xem trước</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 3. Kết quả */}
              <button
                type="button"
                onClick={() => setActiveTab("results")}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "results" || activeTab === "leaderboard"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span>Kết quả</span>
              </button>
            </nav>
          ) : (
            /* Teacher view preserved */
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab("lessons")}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "lessons"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Xem học sinh</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("python-lab")}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "python-lab"
                    ? "bg-emerald-50 text-emerald-800 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Code2 className="w-4 h-4 text-emerald-600" />
                <span>Python</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("html-lab")}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "html-lab"
                    ? "bg-orange-50 text-orange-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <FileCode className="w-4 h-4 text-orange-500" />
                <span>HTML</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("teacher-admin")}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === "teacher-admin"
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span>Quản trị & Chấm điểm</span>
              </button>
            </nav>
          )}

          {/* Right Controls: Thông báo & Tài khoản */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Giới thiệu ứng dụng CodeHiểu */}
            {onOpenAbout && (
              <button
                type="button"
                onClick={onOpenAbout}
                className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer hidden sm:flex items-center gap-1.5 text-xs font-semibold"
                title="Giới thiệu CodeHiểu: Học Python cùng gia sư AI"
              >
                <Info className="w-4 h-4 text-blue-600" />
                <span className="hidden lg:inline text-slate-700">Giới thiệu</span>
              </button>
            )}

            {/* Student Notifications Bell */}
            {currentUser.role === "student" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer"
                  title="Thông báo kết quả chấm bài của bạn"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {isNotificationOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsNotificationOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-40 animate-fade-in divide-y divide-slate-100 max-h-[30rem] flex flex-col">
                      <div className="px-4 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-blue-50 text-blue-600">
                            <Bell className="w-4 h-4" />
                          </span>
                          <div>
                            <h3 className="text-xs font-bold text-slate-900">
                              Thông Báo Chấm Điểm
                            </h3>
                            <p className="text-[10px] text-slate-500">
                              {studentGradedSubmissions.length} bài đã được giáo viên chấm
                            </p>
                          </div>
                        </div>

                        {studentGradedSubmissions.length > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                          >
                            Đã đọc tất cả
                          </button>
                        )}
                      </div>

                      <div className="overflow-y-auto p-2 space-y-2 flex-1">
                        {studentGradedSubmissions.length === 0 ? (
                          <div className="py-8 text-center px-4 space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-xs font-bold text-slate-700">Chưa có bài nào được chấm điểm</p>
                            <p className="text-[11px] text-slate-400">
                              Khi giáo viên chấm xong bài tập của bạn, thông báo và lời phê sẽ xuất hiện tại đây.
                            </p>
                          </div>
                        ) : (
                          studentGradedSubmissions.map((sub) => {
                            const isNew = !readSubmissions.includes(sub.id);
                            return (
                              <div
                                key={sub.id}
                                className={`p-3 rounded-xl border transition-all text-xs space-y-1.5 ${
                                  isNew
                                    ? "bg-blue-50/70 border-blue-200 shadow-2xs"
                                    : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5 line-clamp-1">
                                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>{sub.lessonTitle}</span>
                                  </div>
                                  <span className="shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    {sub.score} / {sub.maxScore} đ
                                  </span>
                                </div>
                                {sub.teacherFeedback && (
                                  <p className="text-slate-600 text-[11px] line-clamp-2">
                                    {sub.teacherFeedback}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Profile Menu Trigger */}
            {currentUser.uid === "guest-explorer" ? (
              <button
                type="button"
                onClick={() => onOpenLogin?.("student")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100 border border-slate-200 transition-all text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {currentUser.displayName.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-semibold text-slate-800 leading-tight flex items-center gap-1">
                      <span>{currentUser.displayName}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {currentUser.classGrade || (currentUser.role === "teacher" ? "Giáo viên" : "Học sinh")}
                    </div>
                  </div>
                </button>

                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40 animate-fade-in divide-y divide-slate-100">
                      <div className="px-4 py-2.5">
                        <div className="text-xs font-bold text-slate-900">{currentUser.displayName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                        {currentUser.classGrade && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {currentUser.classGrade}
                          </div>
                        )}
                      </div>

                      <div className="p-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            if (onLogout) {
                              onLogout();
                            } else {
                              onOpenLogin?.();
                            }
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subheader Grade Filter ONLY for Teacher preview */}
        {activeTab === "lessons" && currentUser.role === "teacher" && (
          <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar border-t border-slate-100 text-xs">
            <span className="text-xs font-medium text-slate-400 whitespace-nowrap mr-1">Bộ lọc cấp học:</span>
            {[
              { id: "all", label: "Tất cả cấp học", icon: BookOpen },
              { id: "elementary", label: "Tiểu học", icon: Sparkles },
              { id: "middle", label: "THCS", icon: Code2 },
              { id: "high", label: "THPT", icon: GraduationCap },
              { id: "robotics", label: "Robotics & STEM", icon: Cpu },
            ].map((lvl) => {
              const Icon = lvl.icon;
              const isSelected = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevel(lvl.id as GradeLevel | "all")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-sky-400" : "text-slate-500"}`} />
                  <span>{lvl.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Drawer (phone screens < 768px) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white text-slate-900 flex flex-col h-full z-10 shadow-2xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-900 leading-none">CodeHiểu</span>
                  <span className="text-[10px] text-blue-600 font-medium leading-none mt-0.5">Học Python cùng gia sư AI</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="py-4 space-y-1.5 flex-1">
              {currentUser.role === "student" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("lessons");
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                      activeTab === "lessons"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span>Việc học của em</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("python-lab");
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer text-left ${
                      activeTab === "python-lab"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Code2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900">Phòng thực hành Python 3</div>
                      <div className="text-[11px] text-slate-500">Chạy thử và gỡ lỗi code</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("ugot-lab");
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer text-left ${
                      activeTab === "ugot-lab"
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Cpu className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900">Robot UGOT Laptop</div>
                      <div className="text-[11px] text-slate-500">Cầu nối WSS Windows Laptop</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("html-lab");
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer text-left ${
                      activeTab === "html-lab"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <FileCode className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900">Phòng thực hành HTML/CSS</div>
                      <div className="text-[11px] text-slate-500">Thiết kế web và xem trước</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("results");
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                      activeTab === "results" || activeTab === "leaderboard"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Kết quả học tập</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("teacher-admin");
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                      activeTab === "teacher-admin"
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5 text-emerald-600" />
                    <span>Quản trị & Chấm điểm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("lessons");
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                      activeTab === "lessons"
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span>Xem học sinh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("python-lab");
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Code2 className="w-5 h-5 text-emerald-600" />
                    <span>Python Lab</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("html-lab");
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <FileCode className="w-5 h-5 text-amber-600" />
                    <span>HTML Lab</span>
                  </button>
                </>
              )}

              {onOpenAbout && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenAbout();
                  }}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 text-blue-700 bg-blue-50/70 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Info className="w-5 h-5 text-blue-600" />
                  <span>Giới thiệu CodeHiểu</span>
                </button>
              )}
            </nav>

            {/* Bottom Account & Actions in Drawer */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2.5 px-2">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {currentUser.displayName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">{currentUser.displayName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{currentUser.classGrade || currentUser.role}</div>
                </div>
              </div>
              {currentUser.uid !== "guest-explorer" ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onLogout?.();
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Đăng xuất</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onOpenLogin?.("student");
                  }}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
