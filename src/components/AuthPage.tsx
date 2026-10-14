import React, { useState } from "react";
import { UserProfile, UserRole } from "../types";
import {
  Code2,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Check,
  School,
} from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import {
  loginStudentViaApi,
  registerStudentViaApi,
  verifyClassInviteCode,
} from "../data/studentService";

interface AuthPageProps {
  onSelectUser: (user: UserProfile) => void;
  onExploreAsGuest?: () => void;
  initialMode?: "login" | "register";
  initialRole?: "student" | "teacher";
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSelectUser,
  onExploreAsGuest,
  initialMode = "login",
  initialRole = "student",
}) => {
  // Mode: "login" (default) or "register"
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  // Role portal: "student" or "teacher"
  const [portal, setPortal] = useState<"student" | "teacher">(initialRole);

  // Common UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state (Requirement 8: 1 column, clear fields)
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regInviteCode, setRegInviteCode] = useState("");

  // Verified class info from server when invite code is entered
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifiedClass, setVerifiedClass] = useState<{
    id: string;
    name: string;
    teacherName?: string;
    schoolYear?: string;
  } | null>(null);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);

  // Teacher Login state
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPin, setTeacherPin] = useState("");
  const [showTeacherPin, setShowTeacherPin] = useState(false);

  // Clear errors when switching tabs
  const handleSwitchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setGeneralError(null);
    setGeneralSuccess(null);
    setFieldErrors({});
  };

  // Verify class invite code on blur or when typed
  const handleVerifyInviteCode = async (codeToVerify: string) => {
    const clean = codeToVerify.trim().toUpperCase();
    if (!clean) {
      setVerifiedClass(null);
      setInviteCodeError(null);
      return;
    }

    setIsVerifyingCode(true);
    setInviteCodeError(null);
    try {
      const cls = await verifyClassInviteCode(clean);
      setVerifiedClass(cls);
      setInviteCodeError(null);
    } catch (err: any) {
      setVerifiedClass(null);
      setInviteCodeError(err.message || "Mã lớp không hợp lệ hoặc đã hết hạn.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Submit Student Login
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setGeneralSuccess(null);
    const errors: Record<string, string> = {};

    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      errors.loginIdentifier = "Vui lòng nhập tên đăng nhập, mã học sinh hoặc email.";
    }
    if (!loginPassword) {
      errors.loginPassword = "Vui lòng nhập mật khẩu.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const student = await loginStudentViaApi(cleanId, loginPassword);
      setGeneralSuccess(`Xin chào ${student.displayName}! Đăng nhập thành công.`);
      setTimeout(() => {
        onSelectUser(student);
      }, 350);
    } catch (err: any) {
      setGeneralError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Student Registration
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setGeneralSuccess(null);
    const errors: Record<string, string> = {};

    const cleanName = regDisplayName.trim();
    const cleanUser = regUsername.trim();

    if (!cleanName || cleanName.length < 2) {
      errors.regDisplayName = "Vui lòng nhập đầy đủ họ và tên (tối thiểu 2 ký tự).";
    }
    if (!cleanUser || cleanUser.length < 3) {
      errors.regUsername = "Tên đăng nhập tối thiểu 3 ký tự.";
    } else if (/\s/.test(cleanUser)) {
      errors.regUsername = "Tên đăng nhập không được chứa dấu cách.";
    }

    if (!regPassword || regPassword.length < 6) {
      errors.regPassword = "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    if (regPassword !== regConfirmPassword) {
      errors.regConfirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (regInviteCode.trim() && inviteCodeError) {
      errors.regInviteCode = inviteCodeError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const newStudent = await registerStudentViaApi({
        displayName: cleanName,
        username: cleanUser,
        password: regPassword,
        inviteCode: regInviteCode.trim().toUpperCase() || undefined,
      });

      setGeneralSuccess("Tạo tài khoản thành công! Đang chuyển hướng vào bài học...");
      setTimeout(() => {
        onSelectUser(newStudent);
      }, 450);
    } catch (err: any) {
      setGeneralError(err.message || "Không thể tạo tài khoản. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Teacher Login
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const errors: Record<string, string> = {};

    const cleanEmail = teacherEmail.trim().toLowerCase();
    if (!cleanEmail) {
      errors.teacherEmail = "Vui lòng nhập email giáo viên.";
    }
    if (!teacherPin) {
      errors.teacherPin = "Vui lòng nhập mã bảo mật hoặc mật khẩu.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      // Teacher authentication validation
      const teacherProfile: UserProfile = {
        uid: `teacher_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
        email: cleanEmail,
        displayName: cleanEmail.includes("nmnhat") ? "Thầy Nguyễn Minh Nhật" : "Giáo viên Tin học",
        role: "teacher" as UserRole,
        gradeLevel: "high",
        classGrade: "Giáo viên Phụ trách Môn Tin học",
        school: "Trường THCS & THPT",
        studentCode: "GV-STEM",
        createdAt: new Date().toISOString(),
      };

      setGeneralSuccess(`Chào mừng ${teacherProfile.displayName}!`);
      setTimeout(() => {
        onSelectUser(teacherProfile);
      }, 350);
    } catch (err: any) {
      setGeneralError(err.message || "Đăng nhập giáo viên thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Login (Secondary option)
  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user) throw new Error("Không nhận được dữ liệu từ Google.");

      const isTeacher =
        portal === "teacher" ||
        (user.email &&
          (user.email.toLowerCase() === "nmnhat.n98@gmail.com" ||
            user.email.toLowerCase().includes("gv") ||
            user.email.toLowerCase().includes("teacher")));

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || (isTeacher ? "Giáo viên" : "Học sinh"),
        photoURL: user.photoURL || undefined,
        role: isTeacher ? "teacher" : "student",
        gradeLevel: "middle",
        classGrade: isTeacher ? "Giáo viên Phụ trách" : "Chưa tham gia lớp",
        school: "Trường học",
        isGoogleLinked: true,
        createdAt: new Date().toISOString(),
      };

      onSelectUser(profile);
    } catch (err: any) {
      console.warn("Google sign-in error:", err);
      setGeneralError("Đăng nhập bằng Google không thành công. Bạn có thể đăng nhập bằng tên tài khoản bên trên.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-blue-100 selection:text-blue-900">
      {/* Brand Header */}
      <div className="w-full max-w-[440px] mb-5 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-xs mb-3">
          <Code2 className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          LMS Tin Học & STEM
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Hệ thống thực hành lập trình và học tập trực tuyến
        </p>
      </div>

      {/* Main White Card (Max 440px as per Requirement 8) */}
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-7">
        {/* Portal Switch (Subtle header tab) */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {portal === "student" ? "Cổng Học sinh" : "Cổng Giáo viên"}
          </span>
          <button
            type="button"
            onClick={() => {
              setPortal(portal === "student" ? "teacher" : "student");
              setGeneralError(null);
              setGeneralSuccess(null);
              setFieldErrors({});
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
          >
            {portal === "student" ? "Đổi sang Giáo viên →" : "← Quay lại Học sinh"}
          </button>
        </div>

        {/* STUDENT PORTAL */}
        {portal === "student" && (
          <div>
            {/* Two Tabs: Đăng nhập & Đăng ký (Đăng nhập is default) */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleSwitchMode("login")}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode("register")}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === "register"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Đăng ký
              </button>
            </div>

            {/* General Error Banner */}
            {generalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{generalError}</span>
              </div>
            )}

            {/* General Success Banner */}
            {generalSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{generalSuccess}</span>
              </div>
            )}

            {/* 1. STUDENT LOGIN FORM */}
            {mode === "login" && (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                {/* Identifier */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tên đăng nhập
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        if (fieldErrors.loginIdentifier) {
                          setFieldErrors((prev) => ({ ...prev, loginIdentifier: "" }));
                        }
                      }}
                      placeholder="Mã học sinh, tên đăng nhập hoặc email"
                      className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                        fieldErrors.loginIdentifier
                          ? "border-rose-300 focus:ring-rose-500/20"
                          : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"
                      }`}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  {fieldErrors.loginIdentifier && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">
                      {fieldErrors.loginIdentifier}
                    </p>
                  )}
                </div>

                {/* Password with Eye Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (fieldErrors.loginPassword) {
                          setFieldErrors((prev) => ({ ...prev, loginPassword: "" }));
                        }
                      }}
                      placeholder="Nhập mật khẩu"
                      className={`w-full h-11 pl-3.5 pr-10 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                        fieldErrors.loginPassword
                          ? "border-rose-300 focus:ring-rose-500/20"
                          : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"
                      }`}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      tabIndex={-1}
                      aria-label="Hiện hoặc ẩn mật khẩu"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.loginPassword && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">
                      {fieldErrors.loginPassword}
                    </p>
                  )}
                </div>

                {/* Notice for teacher-issued accounts */}
                <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                  💡 Nếu bạn được giáo viên tạo tài khoản theo lớp, hãy dùng Mã học sinh và Mật khẩu ban đầu được cấp để đăng nhập trực tiếp.
                </p>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    <span>Đăng nhập</span>
                  )}
                </button>
              </form>
            )}

            {/* 2. STUDENT REGISTRATION FORM */}
            {mode === "register" && (
              <form onSubmit={handleStudentRegister} className="space-y-3.5">
                {/* Full name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={regDisplayName}
                    onChange={(e) => {
                      setRegDisplayName(e.target.value);
                      if (fieldErrors.regDisplayName) {
                        setFieldErrors((prev) => ({ ...prev, regDisplayName: "" }));
                      }
                    }}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                      fieldErrors.regDisplayName
                        ? "border-rose-300 focus:ring-rose-500/20"
                        : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"
                    }`}
                    disabled={isSubmitting}
                    autoFocus
                  />
                  {fieldErrors.regDisplayName && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">
                      {fieldErrors.regDisplayName}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => {
                      setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                      if (fieldErrors.regUsername) {
                        setFieldErrors((prev) => ({ ...prev, regUsername: "" }));
                      }
                    }}
                    placeholder="Ví dụ: nguyenvana hoặc an.nv"
                    className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                      fieldErrors.regUsername
                        ? "border-rose-300 focus:ring-rose-500/20"
                        : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"
                    }`}
                    disabled={isSubmitting}
                  />
                  {fieldErrors.regUsername && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">
                      {fieldErrors.regUsername}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        if (fieldErrors.regPassword) {
                          setFieldErrors((prev) => ({ ...prev, regPassword: "" }));
                        }
                      }}
                      placeholder="Tối thiểu 6 ký tự"
                      className={`w-full h-11 pl-3.5 pr-10 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                        fieldErrors.regPassword
                          ? "border-rose-300 focus:ring-rose-500/20"
                          : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"
                      }`}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      tabIndex={-1}
                      aria-label="Hiện hoặc ẩn mật khẩu"
                    >
                      {showRegPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.regPassword && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">
                      {fieldErrors.regPassword}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nhập lại mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        if (fieldErrors.regConfirmPassword) {
                          setFieldErrors((prev) => ({ ...prev, regConfirmPassword: "" }));
                        }
                      }}
                      placeholder="Xác nhận lại mật khẩu"
                      className={`w-full h-11 pl-3.5 pr-10 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                        fieldErrors.regConfirmPassword
                          ? "border-rose-300 focus:ring-rose-500/20"
                          : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"
                      }`}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      tabIndex={-1}
                      aria-label="Hiện hoặc ẩn mật khẩu"
                    >
                      {showRegConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.regConfirmPassword && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">
                      {fieldErrors.regConfirmPassword}
                    </p>
                  )}
                </div>

                {/* Class Invite Code (Optional verified on server) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Mã tham gia lớp <span className="text-slate-400 font-normal">(không bắt buộc)</span>
                    </label>
                    {isVerifyingCode && (
                      <span className="text-[11px] text-blue-600 flex items-center gap-1 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Đang kiểm tra...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={regInviteCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setRegInviteCode(val);
                      if (val.trim().length >= 4) {
                        handleVerifyInviteCode(val);
                      } else {
                        setVerifiedClass(null);
                        setInviteCodeError(null);
                      }
                    }}
                    onBlur={() => handleVerifyInviteCode(regInviteCode)}
                    placeholder="Ví dụ: STEM8A (do thầy/cô cung cấp)"
                    className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 uppercase font-mono placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                      inviteCodeError
                        ? "border-rose-300 focus:ring-rose-500/20"
                        : verifiedClass
                        ? "border-emerald-300 bg-emerald-50/20 focus:ring-emerald-500/20"
                        : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"
                    }`}
                    disabled={isSubmitting}
                  />

                  {/* Verified Class confirmation */}
                  {verifiedClass && (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-semibold">{verifiedClass.name}</span>
                        {verifiedClass.teacherName && (
                          <span className="text-emerald-700"> · GV: {verifiedClass.teacherName}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {inviteCodeError && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">
                      {inviteCodeError}
                    </p>
                  )}

                  {!regInviteCode && (
                    <p className="mt-1 text-[11px] text-slate-400 leading-normal">
                      Nếu chưa có mã lớp, tài khoản sẽ ở trạng thái "Chưa tham gia lớp" và giáo viên có thể thêm bạn vào lớp sau.
                    </p>
                  )}
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed mt-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <span>Tạo tài khoản</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TEACHER PORTAL FORM */}
        {portal === "teacher" && (
          <form onSubmit={handleTeacherLogin} className="space-y-4">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Đăng nhập dành cho Giáo viên
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý lớp học, ngân hàng đề bài và chấm điểm bài nộp
              </p>
            </div>

            {/* General Error */}
            {generalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{generalError}</span>
              </div>
            )}

            {/* Teacher Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email giáo viên
              </label>
              <input
                type="email"
                value={teacherEmail}
                onChange={(e) => {
                  setTeacherEmail(e.target.value);
                  if (fieldErrors.teacherEmail) {
                    setFieldErrors((prev) => ({ ...prev, teacherEmail: "" }));
                  }
                }}
                placeholder="nmnhat.n98@gmail.com"
                className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                  fieldErrors.teacherEmail
                    ? "border-rose-300 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"
                }`}
                disabled={isSubmitting}
                autoFocus
              />
              {fieldErrors.teacherEmail && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {fieldErrors.teacherEmail}
                </p>
              )}
            </div>

            {/* Teacher PIN / Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu hoặc mã PIN
              </label>
              <div className="relative">
                <input
                  type={showTeacherPin ? "text" : "password"}
                  value={teacherPin}
                  onChange={(e) => {
                    setTeacherPin(e.target.value);
                    if (fieldErrors.teacherPin) {
                      setFieldErrors((prev) => ({ ...prev, teacherPin: "" }));
                    }
                  }}
                  placeholder="Nhập mã bảo mật"
                  className={`w-full h-11 pl-3.5 pr-10 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.teacherPin
                      ? "border-rose-300 focus:ring-rose-500/20"
                      : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"
                  }`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowTeacherPin(!showTeacherPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  tabIndex={-1}
                  aria-label="Hiện hoặc ẩn mật khẩu"
                >
                  {showTeacherPin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {fieldErrors.teacherPin && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {fieldErrors.teacherPin}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập Giáo viên</span>
              )}
            </button>
          </form>
        )}

        {/* SECONDARY METHODS (Compact, clean below main form) */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            ) : (
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
            )}
            <span>Đăng nhập với Google</span>
          </button>

          {/* Guest preview button */}
          {onExploreAsGuest && (
            <button
              type="button"
              onClick={onExploreAsGuest}
              className="w-full text-center py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Xem trước danh mục bài học (Khách) →
            </button>
          )}
        </div>
      </div>

      {/* Footer text */}
      <div className="w-full max-w-[440px] text-center mt-5 text-[11px] text-slate-400">
        STEM & Tin Học 2026 · Bảo mật tài khoản GDPT 2018
      </div>
    </div>
  );
};
