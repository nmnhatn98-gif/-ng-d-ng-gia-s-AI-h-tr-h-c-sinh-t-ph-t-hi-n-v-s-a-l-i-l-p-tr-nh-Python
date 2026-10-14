import React, { useState, useEffect, useMemo } from "react";
import { UserProfile, ClassItem } from "../types";
import {
  getStoredStudents,
  subscribeStudentsUpdate,
  syncStudentsWithCloud,
  downloadSystemBackup,
  restoreSystemBackupFromFile,
  restoreFromStudentVault,
  batchCreateStudentsViaApi,
  exportToGoogleSheetsCSV,
} from "../data/studentService";
import {
  Users,
  Plus,
  Search,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  KeyRound,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  School,
  CheckCircle2,
  Printer,
  CloudUpload,
  RefreshCw,
  FolderSync,
  X,
  Loader2,
  Lock,
} from "lucide-react";

interface StudentAccountManagerProps {
  classes: ClassItem[];
  currentUser?: UserProfile;
  initialClassId?: string;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
  onSuccessCreated?: () => void;
}

export const StudentAccountManager: React.FC<StudentAccountManagerProps> = ({
  classes,
  currentUser,
  initialClassId,
  isOpenModal,
  onCloseModal,
  onSuccessCreated,
}) => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(initialClassId || "all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active classes only (exclude soft-deleted classes)
  const activeClasses = useMemo(() => {
    return classes.filter((c) => c.status !== "deleted");
  }, [classes]);

  // Account Creator Form State
  const [isCreatorOpen, setIsCreatorOpen] = useState(isOpenModal || false);
  const [targetClassId, setTargetClassId] = useState<string>(
    initialClassId || activeClasses[0]?.id || ""
  );
  const [creationMode, setCreationMode] = useState<"batch" | "single">("batch");

  // Single Student State
  const [singleName, setSingleName] = useState("");
  const [singleCode, setSingleCode] = useState("");

  // Batch paste state
  const [batchRawText, setBatchRawText] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<{
    total: number;
    validCount: number;
    errorCount: number;
    duplicateCount: number;
    preview: Array<{ displayName: string; studentCode?: string; error?: string; isDuplicate?: boolean }>;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  // Created Accounts result state (shows initial passwords once)
  const [createdResults, setCreatedResults] = useState<{
    className: string;
    results: Array<{
      uid: string;
      displayName: string;
      studentCode: string;
      email: string;
      initialPassword: string;
    }>;
    authNotice?: string;
  } | null>(null);

  // Print cards modal
  const [isPrintCardsOpen, setIsPrintCardsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (initialClassId) {
      setTargetClassId(initialClassId);
      setSelectedClassFilter(initialClassId);
      if (isOpenModal) setIsCreatorOpen(true);
    }
  }, [initialClassId, isOpenModal]);

  useEffect(() => {
    setStudents(getStoredStudents());
    const unsub = subscribeStudentsUpdate((updated) => {
      setStudents(updated);
    });
    syncStudentsWithCloud().then((synced) => {
      if (synced && synced.length > 0) {
        setStudents(synced);
      }
    });
    return () => unsub();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedTargetClass = useMemo(() => {
    return activeClasses.find((c) => c.id === targetClassId) || activeClasses[0];
  }, [activeClasses, targetClassId]);

  // Handle Preview
  const handlePreviewBatch = async () => {
    if (!selectedTargetClass) {
      setCreationError("Vui lòng chọn một lớp học còn hoạt động trước khi tạo học sinh.");
      return;
    }
    if (!batchRawText.trim()) {
      setCreationError("Vui lòng nhập hoặc dán danh sách học sinh vào ô văn bản.");
      return;
    }

    setCreationError(null);
    setIsPreviewing(true);
    try {
      const data = await batchCreateStudentsViaApi(selectedTargetClass.id, {
        rawText: batchRawText,
        previewOnly: true,
      });
      setPreviewData(data);
    } catch (err: any) {
      console.error("Preview error:", err);
      setCreationError(err.message || "Lỗi khi kiểm tra danh sách học sinh.");
    } finally {
      setIsPreviewing(false);
    }
  };

  // Handle Submit Account Creation
  const handleExecuteCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetClass) {
      setCreationError("Vui lòng chọn một lớp học còn hoạt động.");
      return;
    }

    setCreationError(null);
    setIsSubmitting(true);

    try {
      let payload: any = {};
      if (creationMode === "single") {
        if (!singleName.trim()) {
          setCreationError("Vui lòng nhập họ và tên của học sinh.");
          setIsSubmitting(false);
          return;
        }
        payload = {
          students: [
            {
              displayName: singleName.trim(),
              studentCode: singleCode.trim() || undefined,
            },
          ],
        };
      } else {
        if (!batchRawText.trim()) {
          setCreationError("Vui lòng dán danh sách học sinh.");
          setIsSubmitting(false);
          return;
        }
        payload = {
          rawText: batchRawText,
        };
      }

      const res = await batchCreateStudentsViaApi(selectedTargetClass.id, payload);

      if (res.success && Array.isArray(res.results)) {
        setCreatedResults({
          className: selectedTargetClass.name,
          results: res.results,
          authNotice: res.authNotice,
        });

        // If there were failed rows, keep ONLY failed rows in textarea for retry
        if (Array.isArray(res.failedRows) && res.failedRows.length > 0) {
          const failedText = res.failedRows.map((r: any) => r.rawLine).join("\n");
          setBatchRawText(failedText);
          triggerToast(
            `⚠️ Đã tạo thành công ${res.createdCount} tài khoản! ${res.failedRows.length} dòng lỗi được giữ lại để sửa.`
          );
        } else {
          setBatchRawText("");
          setSingleName("");
          setSingleCode("");
          triggerToast(`🎉 Đã tạo thành công ${res.createdCount} tài khoản học sinh!`);
        }

        setPreviewData(null);
        setStudents(getStoredStudents());
        onSuccessCreated?.();
      }
    } catch (err: any) {
      console.error("Create account error:", err);
      setCreationError(err.message || "Lỗi trong quá trình tạo tài khoản trên máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter students in view
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass =
        selectedClassFilter === "all" ||
        s.classId === selectedClassFilter ||
        (!s.classId &&
          s.classGrade === activeClasses.find((c) => c.id === selectedClassFilter)?.name);

      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        s.displayName.toLowerCase().includes(query) ||
        s.studentCode?.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query);

      return matchClass && matchSearch;
    });
  }, [students, selectedClassFilter, searchQuery, activeClasses]);

  // Export newly created accounts CSV
  const handleDownloadCreatedCSV = () => {
    if (!createdResults || createdResults.results.length === 0) return;
    exportToGoogleSheetsCSV(
      createdResults.results.map((r) => ({
        studentCode: r.studentCode,
        displayName: r.displayName,
        classGrade: createdResults.className,
        email: r.email,
        initialPassword: r.initialPassword,
      })),
      `tai-khoan-lop-${createdResults.className.replace(/\s+/g, "-")}.csv`
    );
    triggerToast("📥 Đã tải file tài khoản (.csv) có mật khẩu ban đầu về máy!");
  };

  // Copy TSV of created accounts
  const handleCopyCreatedTSV = () => {
    if (!createdResults || createdResults.results.length === 0) return;
    const header = "STT\tMã học sinh\tHọ và tên\tLớp\tEmail đăng nhập\tMật khẩu ban đầu";
    const rows = createdResults.results.map((r, idx) => {
      return `${idx + 1}\t${r.studentCode}\t${r.displayName}\t${createdResults.className}\t${r.email}\t${r.initialPassword}`;
    });
    navigator.clipboard.writeText([header, ...rows].join("\n"));
    triggerToast("📋 Đã sao chép danh sách tài khoản! Dán (Ctrl+V) vào Google Sheets hoặc Excel.");
  };

  const handleCloseModalInternal = () => {
    setIsCreatorOpen(false);
    setCreatedResults(null);
    setPreviewData(null);
    setCreationError(null);
    onCloseModal?.();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Quản Lý Tài Khoản Học Sinh Theo Lớp
              </h2>
              <p className="text-xs text-slate-500">
                Tạo danh tính đăng nhập an toàn, cấp mã học sinh và xuất thông tin đăng nhập ban đầu.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCreatedResults(null);
              setIsCreatorOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo tài khoản học sinh</span>
          </button>

          <button
            type="button"
            onClick={downloadSystemBackup}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Tải bản sao lưu danh sách học sinh"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Sao lưu</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <School className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">Tất cả lớp học ({students.length} học sinh)</option>
              {activeClasses.map((cls) => {
                const count = students.filter(
                  (s) => s.classId === cls.id || (!s.classId && s.classGrade === cls.name)
                ).length;
                return (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({count} em)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã HS hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium self-center">
          Hiển thị: <strong className="text-slate-900">{filteredStudents.length}</strong> học sinh
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Mã học sinh</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Lớp phụ trách</th>
                <th className="py-3 px-4">Tài khoản đăng nhập (Email)</th>
                <th className="py-3 px-4 text-right">Trạng thái bảo mật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <p className="text-sm font-medium">Chưa có học sinh nào trong bộ lọc này.</p>
                    <p className="text-xs mt-1">Bấm "Tạo tài khoản học sinh" ở trên để thêm học sinh vào lớp.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.uid} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {st.studentCode || st.uid}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {st.displayName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                        {st.classGrade || "Chưa phân lớp"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {st.email}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        <Lock className="w-3 h-3" />
                        <span>Mật khẩu đã mã hóa</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: TẠO TÀI KHOẢN HỌC SINH THEO LỚP */}
      {/* ============================================================== */}
      {isCreatorOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 leading-tight">
                    Tạo Tài Khoản Học Sinh Theo Lớp
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống tự động cấp tài khoản đăng nhập, tạo mật khẩu an toàn và liên kết lớp học.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModalInternal}
                disabled={isSubmitting}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {creationError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{creationError}</span>
              </div>
            )}

            {/* STEP 1: SELECT CLASS */}
            <div className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <School className="w-4 h-4 text-blue-600" />
                <span>Lớp học tiếp nhận: <span className="text-rose-500">*</span></span>
              </label>

              {activeClasses.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  Bạn chưa có lớp học nào đang hoạt động. Vui lòng tạo lớp học trước khi tạo tài khoản học sinh.
                </div>
              ) : (
                <select
                  disabled={isSubmitting || !!createdResults}
                  value={targetClassId}
                  onChange={(e) => {
                    setTargetClassId(e.target.value);
                    setPreviewData(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {activeClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.gradeNumber ? `(Khối ${cls.gradeNumber})` : ""} — Hiện có {cls.studentCount || 0} học sinh
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* IF ACCOUNTS WERE JUST CREATED: DISPLAY CREDENTIALS TABLE */}
            {createdResults ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Đã tạo thành công {createdResults.results.length} tài khoản cho {createdResults.className}!</span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">
                    ⚠️ <strong>Lưu ý bảo mật quan trọng:</strong> Mật khẩu ban đầu dưới đây chỉ được trả về một lần duy nhất qua phiên làm việc này.
                    Mật khẩu đã được mã hóa an toàn trên hệ thống. Giáo viên vui lòng tải bảng danh sách hoặc in danh thiếp để giữ riêng bàn giao cho học sinh.
                  </p>
                </div>

                {/* Table of created accounts */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">STT</th>
                        <th className="py-2.5 px-3">Mã học sinh</th>
                        <th className="py-2.5 px-3">Họ và tên</th>
                        <th className="py-2.5 px-3">Email đăng nhập</th>
                        <th className="py-2.5 px-3">Mật khẩu ban đầu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {createdResults.results.map((r, i) => (
                        <tr key={r.uid} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-sans text-slate-500">{i + 1}</td>
                          <td className="py-2 px-3 font-bold text-blue-700">{r.studentCode}</td>
                          <td className="py-2 px-3 font-sans font-semibold text-slate-900">{r.displayName}</td>
                          <td className="py-2 px-3 text-slate-600">{r.email}</td>
                          <td className="py-2 px-3 font-bold text-amber-700 bg-amber-50/50">{r.initialPassword}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Download / Copy Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadCreatedCSV}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải bảng tài khoản (.csv)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCreatedTSV}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Sao chép danh sách</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseModalInternal}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Đóng & Hoàn tất
                  </button>
                </div>
              </div>
            ) : (
              /* CREATION FORM */
              <form onSubmit={handleExecuteCreate} className="space-y-4">
                {/* Tabs: Batch or Single */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode("batch");
                      setPreviewData(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      creationMode === "batch"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Dán danh sách hàng loạt (Khuyên dùng)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode("single");
                      setPreviewData(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      creationMode === "single"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Tạo từng học sinh
                  </button>
                </div>

                {creationMode === "single" ? (
                  /* SINGLE MODE */
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Họ và tên học sinh: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        value={singleName}
                        onChange={(e) => setSingleName(e.target.value)}
                        placeholder="VD: Nguyễn Văn An"
                        className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Mã học sinh (Tùy chọn - nếu để trống hệ thống tự sinh):
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={singleCode}
                        onChange={(e) => setSingleCode(e.target.value)}
                        placeholder="VD: HS10A3-01 (tự động nếu để trống)"
                        className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  /* BATCH MODE */
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-800">
                          Dán danh sách học sinh: <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Mỗi học sinh một dòng
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        disabled={isSubmitting}
                        value={batchRawText}
                        onChange={(e) => {
                          setBatchRawText(e.target.value);
                          setPreviewData(null);
                        }}
                        placeholder={`Dán danh sách tại đây. Hỗ trợ 2 định dạng:\n1. Mỗi dòng một họ tên: Nguyễn Văn An\n2. Hai cột (Mã và Tên): HS10A1-01\\tNguyễn Văn An`}
                        className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono leading-relaxed"
                      />
                      <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                        <span>Hỗ trợ sao chép trực tiếp từ cột Excel hoặc Google Sheets.</span>
                        <button
                          type="button"
                          disabled={isPreviewing || !batchRawText.trim()}
                          onClick={handlePreviewBatch}
                          className="text-blue-600 font-bold hover:underline disabled:opacity-50"
                        >
                          {isPreviewing ? "Đang kiểm tra..." : "Kiểm tra & Xem trước danh sách →"}
                        </button>
                      </div>
                    </div>

                    {/* PREVIEW BOX */}
                    {previewData && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-3 text-xs font-bold">
                          <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            Hợp lệ: {previewData.validCount} dòng
                          </span>
                          {previewData.errorCount > 0 && (
                            <span className="text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                              Lỗi / Trùng: {previewData.errorCount} dòng
                            </span>
                          )}
                          <span className="text-slate-500 font-normal">
                            Tổng phát hiện: {previewData.total} dòng
                          </span>
                        </div>

                        {previewData.preview.length > 0 && (
                          <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-slate-100 text-slate-500 sticky top-0 font-semibold">
                                <tr>
                                  <th className="py-1.5 px-2">Họ và tên</th>
                                  <th className="py-1.5 px-2">Mã học sinh</th>
                                  <th className="py-1.5 px-2 text-right">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono">
                                {previewData.preview.map((p, idx) => (
                                  <tr key={idx} className={p.error ? "bg-rose-50/50" : ""}>
                                    <td className="py-1.5 px-2 font-sans font-medium text-slate-800">
                                      {p.displayName || "(Trống)"}
                                    </td>
                                    <td className="py-1.5 px-2 text-slate-600">
                                      {p.studentCode || "(Tự sinh)"}
                                    </td>
                                    <td className="py-1.5 px-2 text-right">
                                      {p.error ? (
                                        <span className="text-rose-600 font-semibold">{p.error}</span>
                                      ) : (
                                        <span className="text-emerald-600 font-semibold">Sẵn sàng tạo</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCloseModalInternal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || activeClasses.length === 0}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tạo danh tính tài khoản...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Xác nhận tạo tài khoản học sinh</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
