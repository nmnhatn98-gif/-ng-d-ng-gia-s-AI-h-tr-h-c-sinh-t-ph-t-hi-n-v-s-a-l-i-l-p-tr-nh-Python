import React, { useState } from "react";
import { UserProfile, UserRole } from "../types";
import {
  Code2,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Check,
} from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import {
  loginStudentViaApi,
  registerStudentViaApi,
  verifyClassInviteCode,
} from "../data/studentService";

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
  if (!isOpen) return null;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [portal, setPortal] = useState<"student" | "teacher">(initialRole === "teacher" ? "teacher" : "student");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Login
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regInviteCode, setRegInviteCode] = useState("");

  // Verified class
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifiedClass, setVerifiedClass] = useState<{
    id: string;
    name: string;
    teacherName?: string;
  } | null>(null);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);

  // Teacher
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPin, setTeacherPin] = useState("");
  const [showTeacherPin, setShowTeacherPin] = useState(false);

  const handleSwitchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setGeneralError(null);
    setGeneralSuccess(null);
    setFieldErrors({});
  };

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

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const errors: Record<string, string> = {};

    const cleanId = loginIdentifier.trim();
    if (!cleanId) errors.loginIdentifier = "Vui lòng nhập tên đăng nhập hoặc mã học sinh.";
    if (!loginPassword) errors.loginPassword = "Vui lòng nhập mật khẩu.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const student = await loginStudentViaApi(cleanId, loginPassword);
      setGeneralSuccess(`Xin chào ${student.displayName}!`);
      setTimeout(() => {
        onSelectUser(student);
        onClose();
      }, 300);
    } catch (err: any) {
      setGeneralError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const errors: Record<string, string> = {};

    const cleanName = regDisplayName.trim();
    const cleanUser = regUsername.trim();

    if (!cleanName || cleanName.length < 2) errors.regDisplayName = "Họ và tên tối thiểu 2 ký tự.";
    if (!cleanUser || cleanUser.length < 3) errors.regUsername = "Tên đăng nhập tối thiểu 3 ký tự.";
    else if (/\s/.test(cleanUser)) errors.regUsername = "Tên đăng nhập không được chứa dấu cách.";

    if (!regPassword || regPassword.length < 6) errors.regPassword = "Mật khẩu tối thiểu 6 ký tự.";
    if (regPassword !== regConfirmPassword) errors.regConfirmPassword = "Mật khẩu xác nhận không khớp.";
    if (regInviteCode.trim() && inviteCodeError) errors.regInviteCode = inviteCodeError;

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

      setGeneralSuccess("Tạo tài khoản thành công!");
      setTimeout(() => {
        onSelectUser(newStudent);
        onClose();
      }, 350);
    } catch (err: any) {
      setGeneralError(err.message || "Không thể tạo tài khoản.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const errors: Record<string, string> = {};

    const cleanEmail = teacherEmail.trim().toLowerCase();
    if (!cleanEmail) errors.teacherEmail = "Vui lòng nhập email giáo viên.";
    if (!teacherPin) errors.teacherPin = "Vui lòng nhập mã bảo mật / mật khẩu.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const teacherProfile: UserProfile = {
        uid: `teacher_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
        email: cleanEmail,
        displayName: cleanEmail.includes("nmnhat") ? "Thầy Nguyễn Minh Nhật" : "Giáo viên Tin học",
        role: "teacher",
        gradeLevel: "high",
        classGrade: "Giáo viên Phụ trách Môn Tin học",
        school: "Trường THCS & THPT",
        studentCode: "GV-STEM",
        createdAt: new Date().toISOString(),
      };

      setGeneralSuccess(`Chào mừng ${teacherProfile.displayName}!`);
      setTimeout(() => {
        onSelectUser(teacherProfile);
        onClose();
      }, 300);
    } catch (err: any) {
      setGeneralError(err.message || "Đăng nhập giáo viên thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      onClose();
    } catch (err: any) {
      setGeneralError("Đăng nhập bằng Google không thành công.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight leading-none">
              CodeHiểu
            </h2>
            <p className="text-xs text-blue-600 font-medium mt-0.5">
              Học Python cùng gia sư AI
            </p>
          </div>
        </div>

        {/* Portal Switch */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {portal === "student" ? "Học sinh" : "Giáo viên"}
          </span>
          <button
            type="button"
            onClick={() => {
              setPortal(portal === "student" ? "teacher" : "student");
              setGeneralError(null);
              setGeneralSuccess(null);
              setFieldErrors({});
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            {portal === "student" ? "Chuyển sang Giáo viên →" : "← Cổng Học sinh"}
          </button>
        </div>

        {portal === "student" && (
          <div>
            {/* Tabs: Đăng nhập & Đăng ký */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
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

            {/* Error / Success */}
            {generalError && (
              <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{generalError}</span>
              </div>
            )}
            {generalSuccess && (
              <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{generalSuccess}</span>
              </div>
            )}

            {mode === "login" && (
              <form onSubmit={handleStudentLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      if (fieldErrors.loginIdentifier) {
                        setFieldErrors((prev) => ({ ...prev, loginIdentifier: "" }));
                      }
                    }}
                    placeholder="Mã học sinh hoặc tên đăng nhập"
                    className={`w-full h-10 px-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 ${
                      fieldErrors.loginIdentifier
                        ? "border-rose-300 focus:ring-rose-500/20"
                        : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"
                    }`}
                    disabled={isSubmitting}
                    autoFocus
                  />
                  {fieldErrors.loginIdentifier && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.loginIdentifier}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                      className={`w-full h-10 pl-3 pr-10 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 ${
                        fieldErrors.loginPassword
                          ? "border-rose-300 focus:ring-rose-500/20"
                          : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/20"
                      }`}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.loginPassword && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.loginPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    <span>Đăng nhập</span>
                  )}
                </button>
              </form>
            )}

            {mode === "register" && (
              <form onSubmit={handleStudentRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-hidden"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  {fieldErrors.regDisplayName && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.regDisplayName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    placeholder="nguyenvana"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-hidden"
                    disabled={isSubmitting}
                  />
                  {fieldErrors.regUsername && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.regUsername}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full h-10 pl-3 pr-10 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-hidden"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.regPassword && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.regPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nhập lại mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Xác nhận mật khẩu"
                      className="w-full h-10 pl-3 pr-10 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-hidden"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                      tabIndex={-1}
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.regConfirmPassword && (
                    <p className="mt-1 text-xs text-rose-600">{fieldErrors.regConfirmPassword}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Mã tham gia lớp (không bắt buộc)</label>
                    {isVerifyingCode && <span className="text-[10px] text-blue-600">Đang kiểm tra...</span>}
                  </div>
                  <input
                    type="text"
                    value={regInviteCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setRegInviteCode(val);
                      if (val.trim().length >= 4) handleVerifyInviteCode(val);
                      else {
                        setVerifiedClass(null);
                        setInviteCodeError(null);
                      }
                    }}
                    placeholder="Ví dụ: STEM8A"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm uppercase font-mono focus:border-blue-600 focus:outline-hidden"
                    disabled={isSubmitting}
                  />
                  {verifiedClass && (
                    <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{verifiedClass.name} {verifiedClass.teacherName ? `· GV: ${verifiedClass.teacherName}` : ""}</span>
                    </div>
                  )}
                  {inviteCodeError && <p className="mt-1 text-xs text-rose-600">{inviteCodeError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

        {portal === "teacher" && (
          <form onSubmit={handleTeacherLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email giáo viên</label>
              <input
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="nmnhat.n98@gmail.com"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-hidden"
                disabled={isSubmitting}
                autoFocus
              />
              {fieldErrors.teacherEmail && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.teacherEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu hoặc mã PIN</label>
              <div className="relative">
                <input
                  type={showTeacherPin ? "text" : "password"}
                  value={teacherPin}
                  onChange={(e) => setTeacherPin(e.target.value)}
                  placeholder="Nhập mã bảo mật"
                  className="w-full h-10 pl-3 pr-10 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-hidden"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowTeacherPin(!showTeacherPin)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                  tabIndex={-1}
                >
                  {showTeacherPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.teacherPin && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.teacherPin}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập Giáo viên</span>
              )}
            </button>
          </form>
        )}

        {/* Secondary Google login */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
        </div>
      </div>
    </div>
  );
};
