import React, { useState, useEffect } from "react";
import { UserProfile, GradeLevel, UserRole } from "../types";
import { 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  Code2, 
  X, 
  Check, 
  LogIn, 
  Lock, 
  User, 
  School,
  ArrowRight,
  AlertCircle,
  BookOpen,
  UserPlus,
  Compass,
  Eye,
  EyeOff,
  AtSign,
  KeyRound
} from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { registerNewStudent, getStoredStudents, syncStudentsWithCloud, lookupStudentOnline } from "../data/studentService";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
  initialRole?: UserRole;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  initialRole = "student",
}) => {
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const [studentMode, setStudentMode] = useState<"register" | "login">("register");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Student Registration Form states matching User Request:
  // [họ và tên]; [Tiểu học; THCS; THPT]; [các khối lớp từ 1 - 12 theo cấp]; [Tài khoản]; [Mật khẩu]; [Nhập lại mật khẩu]
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
  const [studentEmail, setStudentEmail] = useState("");

  // Student Login states
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Teacher Form states
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPin, setTeacherPin] = useState("");

  // Helper sinh gợi ý tài khoản từ Họ tên và Lớp
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

  // Helper lấy danh sách gợi ý lớp theo từng khối từ 1 đến 12
  const getSuggestedClassesForGrade = (grade: number): string[] => {
    if (grade >= 1 && grade <= 5) {
      return [`Lớp ${grade}A`, `Lớp ${grade}B`, `Lớp ${grade}C`];
    }
    if (grade >= 6 && grade <= 9) {
      return [`Lớp ${grade}A1`, `Lớp ${grade}A2`, `Lớp ${grade}B`];
    }
    if (grade === 10) {
      return ["Lớp 10A1 (Python 10)", "Lớp 10A2", "Lớp 10 Tin"];
    }
    if (grade === 11) {
      return ["Lớp 11 Tin (C++)", "Lớp 11A1", "Lớp 11A2"];
    }
    if (grade === 12) {
      return ["Lớp 12 Chuyên Tin", "Lớp 12A1", "Lớp 12A2"];
    }
    return [`Lớp ${grade}A`];
  };

  // Đồng bộ danh sách tài khoản học sinh khi mở cửa sổ đăng nhập
  useEffect(() => {
    if (isOpen) {
      syncStudentsWithCloud().catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Grade level change handler with sensible defaults
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

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;

      const isTeacherRole =
        gUser.email === "nmnhat.n98@gmail.com" || activeRole === "teacher";

      const newUser: UserProfile = {
        uid: gUser.uid,
        email: gUser.email || "user@gmail.com",
        displayName: gUser.displayName || (isTeacherRole ? "Giáo viên" : "Học sinh"),
        role: isTeacherRole ? "teacher" : "student",
        gradeLevel: isTeacherRole ? "high" : selectedGradeLevel,
        classGrade: isTeacherRole ? "Cán bộ Giảng dạy" : selectedClass || (selectedGradeLevel === "elementary" ? "Lớp 4A" : selectedGradeLevel === "high" ? "Lớp 11 Tin" : "Lớp 7A1"),
        school: isTeacherRole ? "Tổ chuyên môn Tin học & STEM" : studentSchool,
        avatar: gUser.photoURL || undefined,
        isGoogleLinked: true,
        googleEmail: gUser.email || undefined,
      };

      onSelectUser(newUser);
      onClose();
    } catch (err: any) {
      console.warn("Google Sign-In note:", err);
      setAuthError(
        err.code === "auth/popup-closed-by-user"
          ? "Cửa sổ đăng nhập đã đóng trước khi hoàn tất."
          : `Đăng nhập Google: ${err.message || "Vui lòng đăng ký hoặc đăng nhập bên dưới."}`
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Student Registration
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

    if (studentPassword.length < 4) {
      setAuthError("Mật khẩu phải có độ dài tối thiểu từ 4 ký tự!");
      return;
    }

    if (studentPassword !== studentConfirmPassword) {
      setAuthError("Mật khẩu và Nhập lại mật khẩu không khớp nhau! Vui lòng kiểm tra lại.");
      return;
    }

    // Kiểm tra tài khoản đã tồn tại chưa
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
      onClose();
    } catch (err: any) {
      console.error("Student registration error:", err);
      setAuthError("Không thể hoàn tất đăng ký học sinh. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Student Login (Existing Account)
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = loginIdentifier.trim();
    if (!query) {
      setAuthError("Vui lòng nhập Tài khoản (Mã học sinh, Tên đăng nhập hoặc Họ tên)!");
      return;
    }

    // Search existing registered students
    const stored = getStoredStudents();
    const lowerQuery = query.toLowerCase();
    let matched = stored.find(
      (s) =>
        s.studentCode?.toLowerCase() === lowerQuery ||
        s.email.toLowerCase() === lowerQuery ||
        s.displayName.toLowerCase() === lowerQuery ||
        s.displayName.toLowerCase().replace(/\s+/g, "") === lowerQuery.replace(/\s+/g, "") ||
        s.googleEmail?.toLowerCase() === lowerQuery
    );

    if (!matched) {
      const onlineFound = await lookupStudentOnline(query);
      if (onlineFound) {
        matched = onlineFound;
      }
    }

    if (matched) {
      if (loginPassword && matched.password && matched.password !== loginPassword) {
        setAuthError("Mật khẩu không chính xác! Vui lòng thử lại.");
        return;
      }
      onSelectUser(matched);
      onClose();
      return;
    }

    // If not found in previous records, create and persist a new student profile
    const studentUser: UserProfile = {
      uid: `std-log-${Date.now()}`,
      displayName: query,
      email: query.includes("@") ? query : `${query.toLowerCase().replace(/\s+/g, "")}@hocsinh.lms.vn`,
      role: "student",
      gradeLevel: selectedGradeLevel,
      classGrade: selectedClass || (selectedGradeLevel === "elementary" ? "Lớp 4A" : selectedGradeLevel === "high" ? "Lớp 11 Tin" : "Lớp 7A1"),
      school: studentSchool,
      studentCode: query.startsWith("HS-") ? query : `HS-${Date.now().toString().slice(-4)}`,
      password: loginPassword || "123456",
    };

    registerNewStudent({
      displayName: studentUser.displayName,
      classGrade: studentUser.classGrade,
      gradeLevel: studentUser.gradeLevel,
      studentCode: studentUser.studentCode,
      school: studentUser.school,
      email: studentUser.email,
      password: studentUser.password,
    }).then((created) => {
      onSelectUser(created);
    }).catch(() => {
      onSelectUser(studentUser);
    });

    onClose();
  };

  // Handle Teacher Login
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
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with Role Selector */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="font-black text-slate-900 text-lg tracking-tight flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-600" />
              <span>Cổng Đăng Nhập & Phân Quyền LMS</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn cấp học và khối học phù hợp để trải nghiệm nội dung bài học tương ứng
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Toggle Switcher */}
        <div className="p-4 bg-slate-100 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveRole("student");
                setAuthError(null);
              }}
              className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 ${
                activeRole === "student"
                  ? "bg-white text-blue-700 shadow-md shadow-blue-500/10 border border-blue-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  activeRole === "student"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-black text-sm">Cổng Học Sinh</div>
                <div className="text-[10px] text-slate-400 font-normal">Chọn cấp học & xem bài giảng tương ứng</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole("teacher");
                setAuthError(null);
              }}
              className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 ${
                activeRole === "teacher"
                  ? "bg-white text-emerald-800 shadow-md shadow-emerald-500/10 border border-emerald-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                  activeRole === "teacher"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-black text-sm">Cổng Giáo Viên</div>
                <div className="text-[10px] text-slate-400 font-normal">Quản trị toàn bộ cấp học & học sinh</div>
              </div>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {authError && (
            <div className="p-3 bg-amber-50 text-amber-900 rounded-2xl border border-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* ===================== STUDENT PORTAL ===================== */}
          {activeRole === "student" && (
            <div className="space-y-5">
              {/* Student Mode Switcher: Register vs Login */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setStudentMode("register");
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
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
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    studentMode === "login"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập đã có tài khoản</span>
                </button>
              </div>

              {/* STUDENT REGISTRATION FORM - 6 REQUESTED FIELDS:
                  [họ và tên]; [Tiểu học; THCS; THPT]; [các khối lớp từ 1 - 12 theo cấp]; [Tài khoản]; [Mật khẩu]; [Nhập lại mật khẩu] */}
              {studentMode === "register" && (
                <form onSubmit={handleStudentRegister} className="space-y-4.5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900">
                        Đăng Ký Tài Khoản Học Sinh Mới
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Vui lòng nhập đầy đủ 6 thông tin theo quy chuẩn bên dưới để khởi tạo tài khoản học tập:
                    </p>
                  </div>

                  {/* 1. [HỌ VÀ TÊN] */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span>1. Họ và tên học sinh <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-slate-400 font-normal">Ghi đúng họ tên có dấu</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentName(val);
                          if (!studentUsername || studentUsername.startsWith("hs-") || studentUsername.includes(".")) {
                            setStudentUsername(generateSuggestedUsername(val, selectedClass));
                          }
                        }}
                        placeholder="Ví dụ: Nguyễn Minh Khang"
                        className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* 2. [TIỂU HỌC; THCS; THPT] */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>2. Cấp học <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-blue-600 font-medium">Tiểu học • THCS • THPT</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* TIỂU HỌC */}
                      <button
                        type="button"
                        onClick={() => handleGradeLevelChange("elementary")}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between relative ${
                          selectedGradeLevel === "elementary"
                            ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs"
                            : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {selectedGradeLevel === "elementary" && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs font-black text-slate-900">Tiểu học</span>
                        </div>
                        <span className="text-[10px] text-amber-700 font-semibold">Khối 1 - Khối 5</span>
                      </button>

                      {/* THCS */}
                      <button
                        type="button"
                        onClick={() => handleGradeLevelChange("middle")}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between relative ${
                          selectedGradeLevel === "middle"
                            ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                            : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {selectedGradeLevel === "middle" && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-xs font-black text-slate-900">THCS</span>
                        </div>
                        <span className="text-[10px] text-indigo-700 font-semibold">Khối 6 - Khối 9</span>
                      </button>

                      {/* THPT */}
                      <button
                        type="button"
                        onClick={() => handleGradeLevelChange("high")}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between relative ${
                          selectedGradeLevel === "high"
                            ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                            : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {selectedGradeLevel === "high" && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-xs font-black text-slate-900">THPT</span>
                        </div>
                        <span className="text-[10px] text-blue-700 font-semibold">Khối 10 - Khối 12</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. [CÁC KHỐI LỚP TỪ 1 - 12 THEO CẤP] */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>3. Các khối lớp từ 1 - 12 theo cấp <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-slate-500">
                        {selectedGradeLevel === "elementary"
                          ? "Tiểu học: Khối 1 đến 5"
                          : selectedGradeLevel === "middle"
                          ? "THCS: Khối 6 đến 9"
                          : "THPT: Khối 10 đến 12"}
                      </span>
                    </label>

                    {/* Khối lớp badges */}
                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {(selectedGradeLevel === "elementary"
                        ? [1, 2, 3, 4, 5]
                        : selectedGradeLevel === "middle"
                        ? [6, 7, 8, 9]
                        : [10, 11, 12]
                      ).map((g) => {
                        const isCurrent = selectedGradeNumber === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setSelectedGradeNumber(g);
                              const defaultClass = g === 7 ? "Lớp 7A1" : g === 10 ? "Lớp 10A1" : `Lớp ${g}A`;
                              setSelectedClass(defaultClass);
                              if (studentName) {
                                setStudentUsername(generateSuggestedUsername(studentName, defaultClass));
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              isCurrent
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            Khối {g}
                          </button>
                        );
                      })}
                    </div>

                    {/* Gợi ý lớp và ô nhập lớp chi tiết */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold">Gợi ý lớp:</span>
                        {getSuggestedClassesForGrade(selectedGradeNumber).map((cls) => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => {
                              setSelectedClass(cls);
                              if (studentName) {
                                setStudentUsername(generateSuggestedUsername(studentName, cls));
                              }
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[11px] border transition-all ${
                              selectedClass === cls
                                ? "bg-slate-900 text-white border-slate-900 font-bold"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <School className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          placeholder="Tên lớp học sinh (VD: 4A, 7A1, 10A2, 11 Tin...)"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. [TÀI KHOẢN] */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span>4. Tài khoản (Tên đăng nhập / Mã học sinh) <span className="text-red-500">*</span></span>
                      <button
                        type="button"
                        onClick={() => {
                          if (studentName) {
                            setStudentUsername(generateSuggestedUsername(studentName, selectedClass));
                          }
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                      >
                        <span>Tự sinh từ tên & lớp</span>
                      </button>
                    </label>
                    <div className="relative">
                      <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={studentUsername}
                        onChange={(e) => setStudentUsername(e.target.value)}
                        placeholder="VD: minhkhang.7a1 hoặc HS-7A1-05"
                        className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Học sinh dùng tài khoản này để đăng nhập vào làm bài.
                    </p>
                  </div>

                  {/* 5. [MẬT KHẨU] & 6. [NHẬP LẠI MẬT KHẨU] */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 5. MẬT KHẨU */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        5. Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          placeholder="Tối thiểu 4 ký tự"
                          className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 6. NHẬP LẠI MẬT KHẨU */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>6. Nhập lại mật khẩu <span className="text-red-500">*</span></span>
                        {studentConfirmPassword && (
                          <span
                            className={`text-[10px] font-bold ${
                              studentPassword === studentConfirmPassword
                                ? "text-emerald-600"
                                : "text-rose-500"
                            }`}
                          >
                            {studentPassword === studentConfirmPassword ? "✓ Mật khẩu khớp" : "✗ Chưa khớp"}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={studentConfirmPassword}
                          onChange={(e) => setStudentConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          className={`w-full pl-9 pr-9 py-2.5 text-xs border rounded-xl bg-white focus:outline-none focus:ring-2 ${
                            studentConfirmPassword
                              ? studentPassword === studentConfirmPassword
                                ? "border-emerald-500 focus:ring-emerald-500"
                                : "border-rose-400 focus:ring-rose-400"
                              : "border-slate-300 focus:ring-blue-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div className="text-[11px] text-slate-500">
                      Khối lớp: <strong className="text-blue-700 font-bold">{selectedClass}</strong> •{" "}
                      {selectedGradeLevel === "elementary"
                        ? "Tiểu học"
                        : selectedGradeLevel === "middle"
                        ? "THCS"
                        : "THPT"}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span>{isSubmitting ? "Đang tạo tài khoản..." : "Đăng Ký & Vào Học Ngay"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* STUDENT LOGIN FORM (EXISTING) */}
              {studentMode === "login" && (
                <form onSubmit={handleStudentLogin} className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Tài khoản (Mã học sinh, Tên đăng nhập hoặc Họ tên): <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Nhập tài khoản (VD: minhkhang.7a1 hoặc HS-7A1-01)"
                        className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Mật khẩu:</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Nhập mật khẩu học sinh"
                        className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-slate-200">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Đăng Nhập Cổng Học Sinh</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
                  Hoặc
                </span>
              </div>

              {/* Google SSO Button */}
              <div>
                <button
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
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
                      : `Đăng nhập Google (Gán vào ${selectedGradeLevel === "elementary" ? "Tiểu học" : selectedGradeLevel === "high" ? "THPT" : "THCS"})`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ===================== TEACHER PORTAL ===================== */}
          {activeRole === "teacher" && (
            <div className="space-y-5">
              {/* Security Banner */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Khu Vực Quản Trị Dành Riêng Cho Giáo Viên</strong>
                  <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                    Giáo viên có quyền tạo ngân hàng đề thi trắc nghiệm bằng AI, tạo bài tập lập trình, quản lý toàn bộ các cấp học (Tiểu học, THCS, THPT) và chấm bài theo thang điểm Rubric.
                  </p>
                </div>
              </div>

              {/* Google SSO Button for Teacher */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 hover:bg-emerald-50/30 text-xs font-bold text-slate-800 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
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

              {/* Custom Teacher Login Form */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2.5">
                  Hoặc đăng nhập bằng tài khoản Giáo viên:
                </span>
                <form onSubmit={handleTeacherLogin} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Họ và tên Giáo viên:
                      </label>
                      <input
                        type="text"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="Nhập họ và tên giáo viên"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Giáo viên:
                      </label>
                      <input
                        type="email"
                        value={teacherEmail}
                        onChange={(e) => setTeacherEmail(e.target.value)}
                        placeholder="Nhập email giáo viên"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mã xác thực sư phạm / Mật khẩu:</span>
                      </span>
                    </label>
                    <input
                      type="password"
                      value={teacherPin}
                      onChange={(e) => setTeacherPin(e.target.value)}
                      placeholder="Nhập mã xác thực giáo viên"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Đăng Nhập Cổng Giáo Viên</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
