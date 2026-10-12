import React, { useState } from "react";
import { UserProfile, GradeLevel, UserRole, Submission } from "../types";
import { 
  GraduationCap, 
  Code2, 
  Cpu, 
  BookOpen, 
  Trophy, 
  UserCheck, 
  Sparkles, 
  LayoutDashboard, 
  LogIn, 
  LogOut, 
  ChevronDown, 
  ShieldCheck, 
  User, 
  FileCode,
  Bell,
  CheckCircle2,
  Award,
  MessageSquare,
  Clock,
  ExternalLink
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
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
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
        // Mark all as read when user opens the notifications tray
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
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("lessons")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">STEM Tin Học</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                  LMS K12
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Hệ thống Dạy & Học Đa Cấp học tích hợp AI</p>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab("lessons")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "lessons"
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Khóa học</span>
            </button>

            {/* Dedicated Python Programming & Sandbox Lab */}
            <button
              onClick={() => setActiveTab("python-lab")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "python-lab"
                  ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-300 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Mở khu lập trình Python tự do (chạy code, input stdin, gia sư AI không cần vào bài tập)"
            >
              <Code2 className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Lập trình Python</span>
              <span className="sm:hidden">Python</span>
            </button>

            {/* Dedicated HTML Source Code & Web Lab Button */}
            <button
              onClick={() => setActiveTab("html-lab")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "html-lab"
                  ? "bg-orange-50 text-orange-700 font-semibold border border-orange-200 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Mở khu thực hành viết mã HTML/CSS/JS với xem trước trực tiếp không cần bài tập"
            >
              <FileCode className="w-4 h-4 text-orange-500" />
              <span className="hidden sm:inline">Viết mã HTML</span>
              <span className="sm:hidden">HTML</span>
            </button>

            {currentUser.role === "student" && (
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === "leaderboard"
                    ? "bg-amber-50 text-amber-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Bảng thành tích</span>
                <span className="sm:hidden">BXH</span>
              </button>
            )}

            {currentUser.role === "teacher" && (
              <button
                onClick={() => setActiveTab("teacher-admin")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === "teacher-admin"
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Quản trị & Chấm điểm</span>
                <span className="sm:hidden">Quản trị</span>
              </button>
            )}
          </nav>

          {/* Right Controls: Dedicated Portal Switch & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Portal Switcher Button */}
            {currentUser.uid !== "guest-explorer" && (
              <button
                onClick={() => onOpenLogin?.(currentUser.role === "teacher" ? "student" : "teacher")}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border ${
                  currentUser.role === "teacher"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                }`}
                title="Nhấn để đổi cổng đăng nhập"
              >
                {currentUser.role === "teacher" ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cổng Giáo Viên</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cổng Học Sinh</span>
                  </>
                )}
              </button>
            )}

            {/* Student Graded Notifications Bell Icon */}
            {currentUser.role === "student" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-all border border-slate-200"
                  title="Thông báo kết quả chấm bài của bạn"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
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
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-40 animate-fade-in divide-y divide-slate-100 max-h-[32rem] flex flex-col">
                      {/* Header */}
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
                            className="text-[11px] text-blue-600 hover:underline font-medium"
                          >
                            Đã đọc tất cả
                          </button>
                        )}
                      </div>

                      {/* Notification List */}
                      <div className="overflow-y-auto p-2 space-y-2 flex-1">
                        {studentGradedSubmissions.length === 0 ? (
                          <div className="py-8 text-center px-4 space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-xs font-bold text-slate-700">Chưa có bài nào được chấm điểm</p>
                            <p className="text-[11px] text-slate-400">
                              Khi giáo viên hoàn tất chấm điểm bài tập hoặc dự án của bạn, thông báo và lời phê sẽ lập tức xuất hiện tại đây.
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
                                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    {sub.score} / {sub.maxScore} đ
                                  </span>
                                </div>

                                {/* Teacher Feedback if present */}
                                {sub.teacherFeedback ? (
                                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                                    <div className="flex items-center gap-1 font-bold text-indigo-700 text-[10px]">
                                      <MessageSquare className="w-3 h-3 text-indigo-500" />
                                      <span>Lời phê của Giáo viên:</span>
                                    </div>
                                    <p className="italic text-slate-600 pl-4">{sub.teacherFeedback}</p>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-500">Giáo viên đã chấm bài đạt yêu cầu.</p>
                                )}

                                {/* Rubric breakdown if available */}
                                {sub.rubric && (
                                  <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-500">
                                    <span>Ý tưởng: <strong>{sub.rubric.idea}/10</strong></span>
                                    <span>•</span>
                                    <span>Kỹ thuật: <strong>{sub.rubric.technique}/10</strong></span>
                                    <span>•</span>
                                    <span>Trình bày: <strong>{sub.rubric.presentation}/10</strong></span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{sub.gradedAt ? new Date(sub.gradedAt).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "Vừa xong"}</span>
                                  </div>
                                  {onSelectLessonById && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsNotificationOpen(false);
                                        onSelectLessonById(sub.lessonId);
                                      }}
                                      className="text-blue-600 hover:underline font-bold flex items-center gap-0.5"
                                    >
                                      <span>Xem bài</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-4 pt-2 text-center text-[10px] text-slate-400">
                        Thông báo được đồng bộ tự động theo thời gian thực
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Guest Login button OR Profile Dropdown Trigger */}
            {currentUser.uid === "guest-explorer" ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenLogin?.("student")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập / Đăng Ký</span>
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Trở về trang Đăng ký / Đăng nhập chính"
                  >
                    Về Trang Đăng Nhập
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-2xl hover:bg-slate-100 border border-slate-200 transition-all text-left"
              >
                <div
                  className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs ${
                    currentUser.role === "teacher"
                      ? "bg-gradient-to-tr from-emerald-600 to-teal-500"
                      : "bg-gradient-to-tr from-blue-600 to-indigo-500"
                  }`}
                >
                  {currentUser.displayName.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                    <span>{currentUser.displayName}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        currentUser.role === "teacher" ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                    ></span>
                    <span>{currentUser.role === "teacher" ? "Giáo viên Quản trị" : "Học sinh STEM"}</span>
                  </div>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-40 animate-fade-in divide-y divide-slate-100">
                    {/* Header info */}
                    <div className="px-4 py-3 bg-slate-50/50">
                      <div className="text-xs font-bold text-slate-900">{currentUser.displayName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                      {currentUser.classGrade && (
                        <div className="text-[10px] font-medium text-slate-400 mt-1">
                          {currentUser.classGrade}
                        </div>
                      )}
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                        {currentUser.role === "teacher" ? "👨‍🏫 Cán bộ Giáo viên" : "👨‍🎓 Học viên K12"}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-1.5 space-y-1">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onOpenLogin?.("student");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors text-left"
                      >
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-bold">Đăng nhập Cổng Học Sinh</div>
                          <div className="text-[10px] text-slate-400">Chọn lớp, làm bài & nộp dự án</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onOpenLogin?.("teacher");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors text-left"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="font-bold">Đăng nhập Cổng Giáo Viên</div>
                          <div className="text-[10px] text-slate-400">Quản trị đề thi, chấm Rubric & bài học</div>
                        </div>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          if (onLogout) {
                            onLogout();
                          } else {
                            onOpenLogin?.();
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Đăng xuất tài khoản</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Subheader Grade Level Filter (Visible on Lessons view) */}
        {activeTab === "lessons" && (
          <div className="flex items-center justify-between py-2 overflow-x-auto no-scrollbar border-t border-slate-100">
            {currentUser.role === "student" ? (
              <div className="flex items-center justify-between w-full text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Cấp học của bạn:</span>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {currentUser.gradeLevel === "elementary" && (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Khối Tiểu Học (Lớp 1 - 5)</span>
                      </>
                    )}
                    {currentUser.gradeLevel === "high" && (
                      <>
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        <span>Khối THPT (Lớp 10 Python & C++)</span>
                      </>
                    )}
                    {currentUser.gradeLevel === "robotics" && (
                      <>
                        <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Khối Robotics & STEM</span>
                      </>
                    )}
                    {(currentUser.gradeLevel === "middle" || !currentUser.gradeLevel) && (
                      <>
                        <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Khối THCS (Lớp 6 - 9)</span>
                      </>
                    )}
                    {currentUser.classGrade && (
                      <span className="text-slate-400 font-medium border-l border-blue-200 pl-1.5 ml-0.5">
                        {currentUser.classGrade}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 hidden md:flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Chế độ học sinh: Đang hiển thị bài học và tài liệu mẫu theo đúng cấp học</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 whitespace-nowrap mr-1">Cấp học:</span>
                {[
                  { id: "all", label: "Tất cả cấp học", icon: BookOpen },
                  { id: "elementary", label: "Tiểu học (Scratch & Máy tính)", icon: Sparkles },
                  { id: "middle", label: "THCS (Python căn bản)", icon: Code2 },
                  { id: "high", label: "THPT (Python 10 & C++)", icon: GraduationCap },
                  { id: "robotics", label: "Robotics & Dự án STEM", icon: Cpu },
                ].map((lvl) => {
                  const Icon = lvl.icon;
                  const isSelected = selectedLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      onClick={() => setSelectedLevel(lvl.id as GradeLevel | "all")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
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
        )}
      </div>
    </header>
  );
};
