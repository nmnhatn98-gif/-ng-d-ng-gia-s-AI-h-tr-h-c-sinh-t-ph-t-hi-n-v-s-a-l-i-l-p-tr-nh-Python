import React, { useState, useEffect } from "react";
import { UserProfile, GradeLevel, UserRole } from "../types";
import { 
  GraduationCap, 
  ShieldCheck, 
  Code2, 
  LogIn, 
  UserPlus, 
  Lock, 
  User, 
  School, 
  Sparkles, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Compass, 
  BookOpen, 
  Check, 
  ArrowRight,
  Cpu,
  Layers
} from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { registerNewStudent, getStoredStudents, syncStudentsWithCloud, lookupStudentOnline, restoreFromStudentVault } from "../data/studentService";

interface AuthPageProps {
  onSelectUser: (user: UserProfile) => void;
  onExploreAsGuest: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSelectUser,
  onExploreAsGuest,
}) => {
  const [activePortal, setActivePortal] = useState<"student" | "teacher">("student");
  const [studentMode, setStudentMode] = useState<"register" | "login">("register");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Student Registration Form states
  const [studentName, setStudentName] = useState("");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<GradeLevel>("middle");
  const [selectedGradeNumber, setSelectedGradeNumber] = useState<number>(7);
  const [selectedClass, setSelectedClass] = useState<string>("Lớp 7A1");
  const [studentUsername, setStudentUsername] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentConfirmPassword, setStudentConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [studentSchool, setStudentSchool] = useState("Trường THCS Lê Quý Đôn");

  // Student Login states
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [unfoundPrompt, setUnfoundPrompt] = useState<string | null>(null);
  const [isRestoringVault, setIsRestoringVault] = useState(false);
  const [vaultRestoreMsg, setVaultRestoreMsg] = useState<string | null>(null);

  // Teacher Form states
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPin, setTeacherPin] = useState("");

  useEffect(() => {
    syncStudentsWithCloud().catch((err) => {
      console.warn("Cloud student sync notice:", err);
    });
  }, []);

  // Helper tạo gợi ý tài khoản từ Họ tên và Lớp
  const generateSuggestedUsername = (name: string, gradeClass: string) => {
    if (!name.trim()) return "";
    const cleanStr = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim();
    const parts = cleanStr.split(/\s+/).filter(Boolean);
    const lastName = parts[parts.length - 1] || "hs";
    const initials = parts.slice(0, -1).map((p) => p[0]).join("");
    const classTag = gradeClass.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return `${lastName}${initials}${classTag ? "." + classTag : ""}`;
  };

  // Helper danh sách gợi ý lớp
  const getSuggestedClassesForGrade = (grade: number): string[] => {
    if (grade >= 1 && grade <= 5) {
      return [`Lớp ${grade}A`, `Lớp ${grade}B`, `Lớp ${grade}C`];
    }
    if (grade >= 6 && grade <= 9) {
      return [`Lớp ${grade}A1`, `Lớp ${grade}A2`, `Lớp ${grade}B`];
    }
    if (grade === 10) {
      return ["Lớp 10A1 (Python)", "Lớp 10A2", "Lớp 10 Tin"];
    }
    if (grade === 11) {
      return ["Lớp 11 Tin (C++)", "Lớp 11A1", "Lớp 11A2"];
    }
    if (grade === 12) {
      return ["Lớp 12 Chuyên Tin", "Lớp 12A1", "Lớp 12A2"];
    }
    return [`Lớp ${grade}A`];
  };

  // Grade level switch
  const handleGradeLevelChange = (lvl: GradeLevel) => {
    setSelectedGradeLevel(lvl);
    if (lvl === "elementary") {
      setSelectedGradeNumber(4);
      setSelectedClass("Lớp 4A");
      setStudentSchool("Trường Tiểu Học Chu Văn An");
      if (studentName) {
        setStudentUsername(generateSuggestedUsername(studentName, "Lớp 4A"));
      }
    } else if (lvl === "middle") {
      setSelectedGradeNumber(7);
      setSelectedClass("Lớp 7A1");
      setStudentSchool("Trường THCS Lê Quý Đôn");
      if (studentName) {
        setStudentUsername(generateSuggestedUsername(studentName, "Lớp 7A1"));
      }
    } else if (lvl === "high") {
      setSelectedGradeNumber(10);
      setSelectedClass("Lớp 10A1");
      setStudentSchool("Trường THPT Chu Văn An");
      if (studentName) {
        setStudentUsername(generateSuggestedUsername(studentName, "Lớp 10A1"));
      }
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;

      const isTeacherRole =
        gUser.email === "nmnhat.n98@gmail.com" || activePortal === "teacher";

      const newUser: UserProfile = {
        uid: gUser.uid,
        email: gUser.email || "user@gmail.com",
        displayName: gUser.displayName || (isTeacherRole ? "Thầy Cô Giáo" : "Học sinh STEM"),
        role: isTeacherRole ? "teacher" : "student",
        gradeLevel: isTeacherRole ? "high" : selectedGradeLevel,
        classGrade: isTeacherRole ? "Cán bộ Giảng dạy Tin học" : selectedClass || "Lớp 7A1",
        school: isTeacherRole ? "Tổ chuyên môn Tin học & STEM" : studentSchool,
        avatar: gUser.photoURL || undefined,
        isGoogleLinked: true,
        googleEmail: gUser.email || undefined,
      };

      onSelectUser(newUser);
    } catch (err: any) {
      console.warn("Google Sign-In notice:", err);
      setAuthError(
        err.code === "auth/popup-closed-by-user"
          ? "Cửa sổ đăng nhập Google đã đóng trước khi hoàn tất."
          : `Đăng nhập Google: ${err.message || "Vui lòng đăng ký hoặc đăng nhập bên dưới."}`
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Student Register
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = studentName.trim();
    if (!cleanName) {
      setAuthError("Vui lòng nhập Họ và tên của học sinh!");
      return;
    }

    const cleanUsername = studentUsername.trim();
    if (!cleanUsername) {
      setAuthError("Vui lòng nhập Tài khoản (Tên đăng nhập / Mã học sinh)!");
      return;
    }

    if (!studentPassword) {
      setAuthError("Vui lòng nhập Mật khẩu học sinh!");
      return;
    }

    if (studentPassword.length < 3) {
      setAuthError("Mật khẩu phải có độ dài tối thiểu từ 3 ký tự!");
      return;
    }

    if (studentPassword !== studentConfirmPassword) {
      setAuthError("Mật khẩu và Nhập lại mật khẩu không khớp nhau! Vui lòng kiểm tra lại.");
      return;
    }

    const stored = getStoredStudents();
    const lowerUsername = cleanUsername.toLowerCase();
    const isExisted = stored.some(
      (s) =>
        s.studentCode?.toLowerCase() === lowerUsername ||
        s.email?.toLowerCase() === lowerUsername
    );
    if (isExisted) {
      setAuthError(`Tài khoản "${cleanUsername}" đã được đăng ký. Vui lòng chọn tài khoản khác hoặc chuyển sang thẻ Đăng nhập!`);
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    try {
      const finalClass = selectedClass.trim() || `Lớp ${selectedGradeNumber}A`;
      const registered = await registerNewStudent({
        displayName: cleanName,
        classGrade: finalClass,
        gradeLevel: selectedGradeLevel,
        studentCode: cleanUsername,
        school: studentSchool.trim() || (selectedGradeLevel === "elementary" ? "Trường Tiểu Học Chu Văn An" : selectedGradeLevel === "high" ? "Trường THPT Chu Văn An" : "Trường THCS Lê Quý Đôn"),
        email: `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, "")}@hocsinh.lms.vn`,
        password: studentPassword.trim(),
      });

      onSelectUser(registered);
    } catch (err: any) {
      console.error("Student registration error:", err);
      setAuthError("Không thể hoàn tất đăng ký học sinh. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student Login with Multi-layer Lookup (Local Storage -> Server API -> Vault)
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = loginIdentifier.trim();
    if (!query) {
      setAuthError("Vui lòng nhập Tài khoản (Mã học sinh, Tên đăng nhập hoặc Họ tên)!");
      return;
    }

    setAuthError(null);
    setUnfoundPrompt(null);
    setIsSearchingOnline(true);

    try {
      // 1. Kiểm tra trong bộ nhớ máy
      const stored = getStoredStudents();
      const lowerQuery = query.toLowerCase();

      let matched = stored.find(
        (s) =>
          s.studentCode?.toLowerCase() === lowerQuery ||
          s.email?.toLowerCase() === lowerQuery ||
          s.displayName.toLowerCase() === lowerQuery ||
          s.displayName.toLowerCase().replace(/\s+/g, "") === lowerQuery.replace(/\s+/g, "")
      );

      // 2. Nếu chưa có trên máy, tự động tra cứu trực tuyến trên Máy chủ & Két dữ liệu
      if (!matched) {
        const foundOnline = await lookupStudentOnline(query);
        if (foundOnline) {
          matched = foundOnline;
        }
      }

      // 3. Nếu vẫn không thấy, hiển thị thông báo hỗ trợ & cho phép cứu tài khoản
      if (!matched) {
        setAuthError(`Chưa tìm thấy tài khoản "${query}".`);
        setUnfoundPrompt(query);
        setIsSearchingOnline(false);
        return;
      }

      // Kiểm tra mật khẩu
      if (matched.password && loginPassword.trim()) {
        if (matched.password !== loginPassword.trim()) {
          setAuthError("Mật khẩu không chính xác. Vui lòng thử lại!");
          setIsSearchingOnline(false);
          return;
        }
      }

      onSelectUser(matched);
    } catch (err: any) {
      setAuthError("Lỗi trong quá trình đăng nhập: " + err.message);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Cứu nhanh: Tạo ngay tài khoản với tên đang nhập và vào học
  const handleInstantCreateAndLogin = async (nameOrCode: string) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const isCode = nameOrCode.toUpperCase().startsWith("HS-");
      const cleanName = isCode ? `Học sinh ${nameOrCode}` : nameOrCode;
      const cleanCode = isCode ? nameOrCode.toUpperCase() : undefined;

      const registered = await registerNewStudent({
        displayName: cleanName,
        classGrade: selectedClass || "Lớp 7A1",
        gradeLevel: selectedGradeLevel || "middle",
        studentCode: cleanCode,
        password: loginPassword.trim() || "123",
        school: studentSchool || "Trường Phổ Thông",
      });

      onSelectUser(registered);
    } catch (err: any) {
      setAuthError("Không thể tạo nhanh tài khoản: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khôi phục tất cả tài khoản từ Két Máy chủ
  const handleRestoreFromVault = async () => {
    setIsRestoringVault(true);
    setVaultRestoreMsg(null);
    try {
      const restored = await restoreFromStudentVault();
      if (restored && restored.length > 0) {
        setVaultRestoreMsg(`Đã khôi phục thành công ${restored.length} tài khoản học sinh từ máy chủ!`);
        setAuthError(null);
        setUnfoundPrompt(null);
      } else {
        setVaultRestoreMsg("Không có tài khoản nào trong két sao lưu của máy chủ.");
      }
    } catch (err: any) {
      setVaultRestoreMsg("Lỗi khi khôi phục: " + err.message);
    } finally {
      setIsRestoringVault(false);
    }
  };

  // Teacher Login
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() && !teacherEmail.trim()) {
      setAuthError("Vui lòng nhập Họ tên hoặc Email của Giáo viên!");
      return;
    }

    const newTeacher: UserProfile = {
      uid: `tch-custom-${Date.now()}`,
      email: teacherEmail.trim() || `${teacherName.toLowerCase().replace(/\s+/g, "")}@giaovien.edu.vn`,
      displayName: teacherName.trim() || "Thầy Cô Giáo",
      role: "teacher",
      gradeLevel: "high",
      classGrade: "Cán bộ Giảng dạy Tin học",
      school: "Tổ Chuyên Môn Tin học & STEM",
      studentCode: `GV-${Date.now().toString().slice(-4)}`,
      password: teacherPin.trim() || "STEM@2026",
    };

    onSelectUser(newTeacher);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-between text-slate-100 p-4 sm:p-6 md:p-8">
      {/* Top Brand Banner */}
      <header className="max-w-4xl mx-auto w-full text-center pt-2 pb-6">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3 tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CHƯƠNG TRÌNH GDPT 2018 • MÔN TIN HỌC & GIÁO DỤC STEM</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Code2 className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <span>Hệ Thống Quản Lý Học Tập LMS</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          Nền tảng học tập trực tuyến tích hợp lập trình Python, C++, thiết kế Web HTML/CSS, 
          dự án Robotics STEM và chấm điểm Rubric thông minh cho học sinh K-12.
        </p>
      </header>

      {/* Main Authentication Card */}
      <main className="max-w-2xl mx-auto w-full bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto">
        {/* Role Selector Header */}
        <div className="p-3 sm:p-4 bg-slate-100/90 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setActivePortal("student");
                setAuthError(null);
              }}
              className={`py-3 px-3 sm:px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 ${
                activePortal === "student"
                  ? "bg-white text-blue-700 shadow-md shadow-blue-500/10 border border-blue-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activePortal === "student"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-black text-xs sm:text-sm">Cổng Học Sinh</div>
                <div className="text-[10px] text-slate-400 font-normal line-clamp-1">Khối 1 - 12 & Nộp bài</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePortal("teacher");
                setAuthError(null);
              }}
              className={`py-3 px-3 sm:px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 ${
                activePortal === "teacher"
                  ? "bg-white text-emerald-800 shadow-md shadow-emerald-500/10 border border-emerald-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activePortal === "teacher"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-black text-xs sm:text-sm">Cổng Giáo Viên</div>
                <div className="text-[10px] text-slate-400 font-normal line-clamp-1">Quản trị & Chấm thi</div>
              </div>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-5">
          {authError && (
            <div className="p-3 bg-amber-50 text-amber-900 rounded-2xl border border-amber-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="leading-snug">{authError}</span>
            </div>
          )}

          {/* ===================== CỔNG HỌC SINH ===================== */}
          {activePortal === "student" && (
            <div className="space-y-5">
              {/* Tab Switcher: Đăng ký vs Đăng nhập */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setStudentMode("register");
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    studentMode === "register"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Đăng ký học sinh mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentMode("login");
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    studentMode === "login"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập tài khoản</span>
                </button>
              </div>

              {/* FORM ĐĂNG KÝ HỌC SINH MỚI */}
              {studentMode === "register" && (
                <form onSubmit={handleStudentRegister} className="space-y-4">
                  {/* Họ và tên */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên học sinh <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentName(val);
                          if (!studentUsername || studentUsername.startsWith(generateSuggestedUsername(studentName, selectedClass))) {
                            setStudentUsername(generateSuggestedUsername(val, selectedClass));
                          }
                        }}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  {/* Cấp học */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Cấp học theo chương trình:</span>
                      <span className="text-[11px] text-blue-600 font-semibold">
                        {selectedGradeLevel === "elementary" ? "Tiểu học (Lớp 1-5)" : selectedGradeLevel === "middle" ? "THCS (Lớp 6-9)" : "THPT (Lớp 10-12)"}
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleGradeLevelChange("elementary")}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          selectedGradeLevel === "elementary"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        Tiểu học
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGradeLevelChange("middle")}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          selectedGradeLevel === "middle"
                            ? "bg-blue-50 border-blue-500 text-blue-800 shadow-2xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        THCS
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGradeLevelChange("high")}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          selectedGradeLevel === "high"
                            ? "bg-purple-50 border-purple-500 text-purple-800 shadow-2xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        THPT
                      </button>
                    </div>
                  </div>

                  {/* Khối lớp từ 1 - 12 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Khối lớp học:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedGradeLevel === "elementary" &&
                        [1, 2, 3, 4, 5].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setSelectedGradeNumber(g);
                              const newClass = `Lớp ${g}A`;
                              setSelectedClass(newClass);
                              if (studentName) {
                                setStudentUsername(generateSuggestedUsername(studentName, newClass));
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              selectedGradeNumber === g
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            Khối {g}
                          </button>
                        ))}

                      {selectedGradeLevel === "middle" &&
                        [6, 7, 8, 9].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setSelectedGradeNumber(g);
                              const newClass = `Lớp ${g}A1`;
                              setSelectedClass(newClass);
                              if (studentName) {
                                setStudentUsername(generateSuggestedUsername(studentName, newClass));
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              selectedGradeNumber === g
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            Khối {g}
                          </button>
                        ))}

                      {selectedGradeLevel === "high" &&
                        [10, 11, 12].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setSelectedGradeNumber(g);
                              const newClass = g === 10 ? "Lớp 10A1" : g === 11 ? "Lớp 11 Tin" : "Lớp 12 Chuyên Tin";
                              setSelectedClass(newClass);
                              if (studentName) {
                                setStudentUsername(generateSuggestedUsername(studentName, newClass));
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              selectedGradeNumber === g
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            Khối {g}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Lớp học & Trường học */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Lớp học cụ thể:
                      </label>
                      <input
                        type="text"
                        value={selectedClass}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedClass(val);
                          if (studentName) {
                            setStudentUsername(generateSuggestedUsername(studentName, val));
                          }
                        }}
                        placeholder="Ví dụ: Lớp 7A1"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Trường học:
                      </label>
                      <input
                        type="text"
                        value={studentSchool}
                        onChange={(e) => setStudentSchool(e.target.value)}
                        placeholder="Trường THCS Lê Quý Đôn"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Tài khoản (Tên đăng nhập / Mã học sinh) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Tài khoản (Tên đăng nhập / Mã HS) <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-slate-400 font-normal">Dùng để đăng nhập sau này</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={studentUsername}
                        onChange={(e) => setStudentUsername(e.target.value)}
                        placeholder="Ví dụ: an.7a1 hoặc HS-001"
                        className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  {/* Mật khẩu & Nhập lại mật khẩu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          placeholder="Nhập mật khẩu"
                          className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nhập lại mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={studentConfirmPassword}
                          onChange={(e) => setStudentConfirmPassword(e.target.value)}
                          placeholder="Xác nhận mật khẩu"
                          className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Nút Đăng ký */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSubmitting ? "Đang tạo tài khoản..." : "Hoàn Tất Đăng Ký & Vào Học Ngay"}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* FORM ĐĂNG NHẬP HỌC SINH */}
              {studentMode === "login" && (
                <div className="space-y-4">
                  <form onSubmit={handleStudentLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tài khoản / Mã học sinh:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="Nhập tên đăng nhập hoặc mã học sinh (VD: HS-7A1-01)"
                          className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mật khẩu:
                      </label>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Mật khẩu của bạn (Mặc định: 123)"
                          className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSearchingOnline}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isSearchingOnline ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang tra cứu dữ liệu học sinh...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>Đăng Nhập Vào Cổng Học Sinh</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* THÔNG BÁO KHÔI PHỤC TÀI KHOẢN TỪ KÉT MÁY CHỦ */}
                  {vaultRestoreMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{vaultRestoreMsg}</span>
                    </div>
                  )}

                  {/* THẺ HỖ TRỢ CỨU TÀI KHOẢN NẾU CHƯA TÌM THẤY */}
                  {unfoundPrompt && (
                    <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs text-amber-950 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">Không tìm thấy tài khoản "{unfoundPrompt}"?</strong>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            Nếu bạn vừa xóa dữ liệu duyệt web hoặc vừa đăng ký tài khoản trước đó, hãy chọn một trong hai cách dưới đây:
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleInstantCreateAndLogin(unfoundPrompt)}
                          disabled={isSubmitting}
                          className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Vào học ngay với tên này</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRestoreFromVault}
                          disabled={isRestoringVault}
                          className="py-2 px-3 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          {isRestoringVault ? "Đang đồng bộ..." : "Khôi phục từ Máy chủ"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Nút khôi phục tài khoản dự phòng */}
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode("register");
                        setAuthError(null);
                        setUnfoundPrompt(null);
                      }}
                      className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Chưa có tài khoản? Đăng ký ngay</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRestoreFromVault}
                      disabled={isRestoringVault}
                      className="text-slate-500 hover:text-blue-700 hover:underline"
                    >
                      {isRestoringVault ? "Đang tải..." : "🔄 Tải lại từ bộ nhớ máy chủ"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== CỔNG GIÁO VIÊN ===================== */}
          {activePortal === "teacher" && (
            <div className="space-y-4">
              {/* Giới thiệu chức năng Giáo viên */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Khu Vực Quản Trị Dành Cho Giáo Viên & Giảng Dạy</strong>
                  <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                    Giáo viên quản lý toàn bộ học sinh 3 cấp học (Tiểu học, THCS, THPT), giao đề bài lập trình, 
                    tạo câu hỏi trắc nghiệm bằng AI và chấm điểm bài tập theo thang điểm Rubric.
                  </p>
                </div>
              </div>

              {/* Google Sign In Button */}
              <div>
                <button
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:bg-emerald-50/50 text-xs font-bold text-slate-800 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {isGoogleLoading
                      ? "Đang xác thực Google..."
                      : "Đăng nhập bằng tài khoản Google Giáo viên"}
                  </span>
                </button>
              </div>

              {/* Form giáo viên */}
              <form onSubmit={handleTeacherLogin} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Hoặc đăng nhập bằng tài khoản Giáo viên:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên Giáo viên:</label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="Nhập họ và tên giáo viên"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Giáo viên:</label>
                    <input
                      type="email"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      placeholder="Nhập địa chỉ email"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã xác thực sư phạm / Mật khẩu:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={teacherPin}
                      onChange={(e) => setTeacherPin(e.target.value)}
                      placeholder="Nhập mã xác thực giáo viên"
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Đăng Nhập Cổng Giáo Viên</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer with Guest Explore Option */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 text-center sm:text-left">
            Chưa có tài khoản học sinh? Hãy nhấn <strong className="text-blue-600">Đăng ký học sinh mới</strong> ở trên.
          </div>
          <button
            type="button"
            onClick={onExploreAsGuest}
            className="text-slate-700 hover:text-blue-600 font-bold flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-200/60"
          >
            <Compass className="w-4 h-4 text-blue-500" />
            <span>Trải nghiệm trước (Chế độ Khách) →</span>
          </button>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="text-center text-[11px] text-slate-500 pt-6 pb-2">
        <span>© 2026 Hệ Thống LMS Tin Học & STEM GDPT 2018 • Hỗ trợ đa cấp học K-12</span>
      </footer>
    </div>
  );
};
