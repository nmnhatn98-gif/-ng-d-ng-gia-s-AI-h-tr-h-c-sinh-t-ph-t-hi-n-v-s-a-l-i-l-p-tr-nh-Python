import React, { useState, useEffect, useMemo } from "react";
import { UserProfile, ClassItem } from "../types";
import {
  getStoredStudents,
  subscribeStudentsUpdate,
  syncStudentsWithCloud,
  downloadSystemBackup,
  batchCreateStudentsViaApi,
  exportToGoogleSheetsCSV,
} from "../data/studentService";
import {
  Users,
  Plus,
  Search,
  Download,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  School,
  CheckCircle2,
  Printer,
  X,
  Loader2,
  Lock,
  KeyRound,
  ShieldCheck,
  RefreshCw,
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
  const [singleCustomPassword, setSingleCustomPassword] = useState(true);
  const [singlePassword, setSinglePassword] = useState("");
  const [singleConfirmPassword, setSingleConfirmPassword] = useState("");
  const [showSinglePassword, setShowSinglePassword] = useState(false);
  const [showSingleConfirmPassword, setShowSingleConfirmPassword] = useState(false);
  const [singleMustChangePassword, setSingleMustChangePassword] = useState(true);

  // Batch paste state
  const [batchRawText, setBatchRawText] = useState("");
  const [batchPasswordMode, setBatchPasswordMode] = useState<"shared" | "individual" | "auto">("shared");
  const [batchSharedPassword, setBatchSharedPassword] = useState("");
  const [batchConfirmSharedPassword, setBatchConfirmSharedPassword] = useState("");
  const [showBatchSharedPassword, setShowBatchSharedPassword] = useState(false);
  const [showBatchConfirmSharedPassword, setShowBatchConfirmSharedPassword] = useState(false);
  const [batchMustChangePassword, setBatchMustChangePassword] = useState(true);

  // Editable preview data
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewRows, setPreviewRows] = useState<
    Array<{
      displayName: string;
      studentCode?: string;
      password?: string;
      error?: string;
      isDuplicate?: boolean;
    }>
  >([]);
  const [previewStats, setPreviewStats] = useState<{
    total: number;
    validCount: number;
    errorCount: number;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  // Created Accounts result state (shows initial passwords once temporarily)
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

  // Parse lines into preview items
  const parseBatchLines = () => {
    if (!batchRawText.trim()) return [];

    const lines = batchRawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const existingCodes = new Set(
      students.map((s) => String(s.studentCode || "").toUpperCase()).filter(Boolean)
    );
    const seenBatchCodes = new Set<string>();

    return lines.map((line) => {
      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t").map((p) => p.trim());
      } else if (line.includes(",")) {
        parts = line.split(",").map((p) => p.trim());
      } else if (line.includes(";")) {
        parts = line.split(";").map((p) => p.trim());
      } else {
        parts = [line];
      }

      let name = "";
      let code = "";
      let pass = "";

      if (parts.length >= 3) {
        // Col 0: Name or Code, Col 1: Code or Name, Col 2: Password
        const isP0Code = /^[a-zA-Z0-9_\-\.]+$/.test(parts[0]) && parts[0].length <= 20;
        code = isP0Code ? parts[0] : parts[1];
        name = isP0Code ? parts[1] : parts[0];
        pass = parts[2];
      } else if (parts.length === 2) {
        const isP0Code = /^[a-zA-Z0-9_\-\.]+$/.test(parts[0]) && parts[0].length <= 20;
        code = isP0Code ? parts[0] : parts[1];
        name = isP0Code ? parts[1] : parts[0];
      } else {
        name = parts[0];
      }

      let error = "";
      if (!name || name.length < 2) {
        error = "Họ tên quá ngắn (< 2 ký tự)";
      } else if (name.length > 60) {
        error = "Họ tên quá dài (> 60 ký tự)";
      } else if (code) {
        const upper = code.toUpperCase();
        if (existingCodes.has(upper) || seenBatchCodes.has(upper)) {
          error = `Mã học sinh "${code}" đã tồn tại`;
        } else {
          seenBatchCodes.add(upper);
        }
      }

      if (batchPasswordMode === "individual" && pass) {
        if (pass.length < 6) {
          error = (error ? error + "; " : "") + "Mật khẩu phải có ít nhất 6 ký tự";
        }
      }

      return {
        displayName: name,
        studentCode: code || undefined,
        password: pass || undefined,
        error: error || undefined,
        isDuplicate: error.includes("đã tồn tại"),
      };
    });
  };

  // Handle Preview Batch
  const handlePreviewBatch = () => {
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

    const parsed = parseBatchLines();
    const valid = parsed.filter((r) => !r.error);
    const error = parsed.filter((r) => r.error);

    setPreviewRows(parsed);
    setPreviewStats({
      total: parsed.length,
      validCount: valid.length,
      errorCount: error.length,
    });
    setIsPreviewing(false);
  };

  // Update password for a specific row in the preview table
  const handleUpdateRowPassword = (index: number, newPass: string) => {
    setPreviewRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        password: newPass,
        error: newPass.length > 0 && newPass.length < 6 ? "Mật khẩu phải có ít nhất 6 ký tự" : undefined,
      };
      return copy;
    });
  };

  // Handle Submit Account Creation
  const handleExecuteCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetClass) {
      setCreationError("Vui lòng chọn một lớp học còn hoạt động.");
      return;
    }

    setCreationError(null);

    // Validate single student passwords if custom password is set
    if (creationMode === "single") {
      if (!singleName.trim()) {
        setCreationError("Vui lòng nhập họ và tên của học sinh.");
        return;
      }
      if (singleCustomPassword) {
        if (!singlePassword || singlePassword.length < 6) {
          setCreationError("Mật khẩu ban đầu phải có tối thiểu 6 ký tự.");
          return;
        }
        if (singlePassword !== singleConfirmPassword) {
          setCreationError("Xác nhận lại mật khẩu không trùng khớp.");
          return;
        }
      }
    } else {
      // Validate batch password settings
      if (batchPasswordMode === "shared") {
        if (!batchSharedPassword || batchSharedPassword.length < 6) {
          setCreationError("Mật khẩu ban đầu chung phải có tối thiểu 6 ký tự.");
          return;
        }
        if (batchSharedPassword !== batchConfirmSharedPassword) {
          setCreationError("Xác nhận mật khẩu chung không trùng khớp.");
          return;
        }
      }

      if (!batchRawText.trim() && previewRows.length === 0) {
        setCreationError("Vui lòng dán danh sách học sinh.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let payload: any = {};

      if (creationMode === "single") {
        payload = {
          passwordMode: singleCustomPassword ? "individual" : "auto",
          mustChangePassword: singleMustChangePassword,
          students: [
            {
              displayName: singleName.trim(),
              studentCode: singleCode.trim() || undefined,
              password: singleCustomPassword ? singlePassword : undefined,
            },
          ],
        };
      } else {
        // Use previewRows if available, or parse text
        const rowsToSend = previewRows.length > 0 ? previewRows : parseBatchLines();
        const validRows = rowsToSend.filter((r) => !r.error);

        if (validRows.length === 0) {
          setCreationError("Không có học sinh nào hợp lệ để tạo tài khoản.");
          setIsSubmitting(false);
          return;
        }

        payload = {
          passwordMode: batchPasswordMode,
          sharedPassword: batchPasswordMode === "shared" ? batchSharedPassword : undefined,
          mustChangePassword: batchMustChangePassword,
          students: validRows.map((r) => ({
            displayName: r.displayName,
            studentCode: r.studentCode,
            password: r.password,
          })),
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
          const failedText = res.failedRows.map((r: any) => r.rawLine || r.displayName).join("\n");
          setBatchRawText(failedText);
          setPreviewRows([]);
          setPreviewStats(null);
          triggerToast(
            `⚠️ Đã tạo thành công ${res.createdCount} tài khoản! ${res.failedRows.length} dòng lỗi được giữ lại để sửa.`
          );
        } else {
          setBatchRawText("");
          setSingleName("");
          setSingleCode("");
          setSinglePassword("");
          setSingleConfirmPassword("");
          setPreviewRows([]);
          setPreviewStats(null);
          triggerToast(`🎉 Đã tạo thành công ${res.createdCount} tài khoản học sinh!`);
        }

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

  const handlePrintCards = () => {
    if (!createdResults || createdResults.results.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      triggerToast("Vui lòng cho phép mở cửa sổ popup để in thẻ tài khoản.");
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Phiếu Tài Khoản Học Sinh - ${createdResults.className}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .card { border: 1.5px dashed #94a3b8; border-radius: 12px; padding: 14px; background: #f8fafc; }
          .brand { font-size: 11px; font-weight: bold; color: #2563eb; text-transform: uppercase; margin-bottom: 4px; }
          .name { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
          .row { font-size: 13px; margin: 4px 0; }
          .label { color: #64748b; font-size: 11px; }
          .val { font-family: monospace; font-weight: bold; color: #0f172a; }
          .pass { color: #b45309; background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>CodeHiểu: Danh Sách Thẻ Tài Khoản Học Sinh</h2>
          <p>Lớp: <strong>${createdResults.className}</strong> — Ngày cấp: ${new Date().toLocaleDateString("vi-VN")}</p>
          <button class="no-print" onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Bấm vào đây để In (Ctrl+P)</button>
        </div>
        <div class="grid">
          ${createdResults.results
            .map(
              (r) => `
            <div class="card">
              <div class="brand">CodeHiểu • Học Python cùng gia sư AI</div>
              <div class="name">${r.displayName}</div>
              <div class="row"><span class="label">Lớp:</span> <span>${createdResults.className}</span></div>
              <div class="row"><span class="label">Tên đăng nhập / Mã:</span> <span class="val">${r.studentCode}</span></div>
              <div class="row"><span class="label">Mật khẩu ban đầu:</span> <span class="val pass">${r.initialPassword}</span></div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 8px;">Đăng nhập tại địa chỉ website CodeHiểu và đổi mật khẩu khi có yêu cầu.</div>
            </div>
          `
            )
            .join("")}
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleCloseModalInternal = () => {
    setIsCreatorOpen(false);
    setCreatedResults(null);
    setPreviewRows([]);
    setPreviewStats(null);
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
                Tạo danh tính đăng nhập an toàn, giáo viên tự đặt mật khẩu và xuất thông tin đăng nhập ban đầu.
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
                    Hệ thống cấp tài khoản xác thực thật, giáo viên chủ động đặt mật khẩu hoặc để hệ thống tự tạo an toàn.
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
                    setPreviewRows([]);
                    setPreviewStats(null);
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
                    ⚠️ <strong>Lưu ý bảo mật:</strong> Mật khẩu ban đầu dưới đây chỉ hiển thị tạm thời trong phiên làm việc này để giáo viên tải/in phiếu bàn giao cho học sinh. Sau khi đóng cửa sổ này, mật khẩu sẽ không thể xem lại.
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
                          <td className="py-2 px-3 font-bold text-amber-700 bg-amber-50/60 font-mono">{r.initialPassword}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Download / Copy Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadCreatedCSV}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải file Excel / CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCreatedTSV}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Sao chép</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintCards}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      <span>In phiếu tài khoản</span>
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
                      setPreviewRows([]);
                      setPreviewStats(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      creationMode === "batch"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Tạo hàng loạt theo danh sách (Khuyên dùng)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode("single");
                      setPreviewRows([]);
                      setPreviewStats(null);
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
                  <div className="space-y-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
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
                        Mã học sinh / Tên đăng nhập (Tùy chọn - nếu để trống hệ thống tự sinh):
                      </label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={singleCode}
                        onChange={(e) => setSingleCode(e.target.value)}
                        placeholder="VD: HS10A3-01 (để trống hệ thống tự cấp theo tên lớp)"
                        className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    {/* Password settings for single */}
                    <div className="pt-2 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-blue-600" />
                          <span>Thiết lập mật khẩu ban đầu</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={singleCustomPassword}
                            onChange={(e) => setSingleCustomPassword(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>Giáo viên tự đặt mật khẩu</span>
                        </label>
                      </div>

                      {singleCustomPassword ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Mật khẩu ban đầu: <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showSinglePassword ? "text" : "password"}
                                required={singleCustomPassword}
                                disabled={isSubmitting}
                                value={singlePassword}
                                onChange={(e) => setSinglePassword(e.target.value)}
                                placeholder="Tối thiểu 6 ký tự"
                                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg pr-8 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSinglePassword(!showSinglePassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                {showSinglePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Nhập lại mật khẩu: <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showSingleConfirmPassword ? "text" : "password"}
                                required={singleCustomPassword}
                                disabled={isSubmitting}
                                value={singleConfirmPassword}
                                onChange={(e) => setSingleConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu"
                                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg pr-8 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSingleConfirmPassword(!showSingleConfirmPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                {showSingleConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id="singleMustChange"
                              checked={singleMustChangePassword}
                              onChange={(e) => setSingleMustChangePassword(e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="singleMustChange" className="text-xs text-slate-600 font-medium cursor-pointer">
                              Yêu cầu học sinh đổi mật khẩu trong lần đăng nhập đầu tiên
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-blue-800 text-xs">
                          Hệ thống sẽ tự động tạo mật khẩu ngẫu nhiên an toàn (chữ hoa, số, ký tự) và hiển thị sau khi tạo để giáo viên lưu lại.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* BATCH MODE */
                  <div className="space-y-4">
                    {/* BATCH PASSWORD SETTING - 3 CHOICES */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-900">Thiết lập mật khẩu ban đầu:</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setBatchPasswordMode("shared")}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            batchPasswordMode === "shared"
                              ? "bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="font-bold text-xs mb-0.5">1. Mật khẩu chung</div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            Nhập 1 mật khẩu áp dụng cho cả đợt tạo
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBatchPasswordMode("individual")}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            batchPasswordMode === "individual"
                              ? "bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="font-bold text-xs mb-0.5">2. Mật khẩu riêng</div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            Nhập trong bảng hoặc nhận từ cột dán
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBatchPasswordMode("auto")}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            batchPasswordMode === "auto"
                              ? "bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="font-bold text-xs mb-0.5">3. Tự sinh ngẫu nhiên</div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            Hệ thống tự tạo mật khẩu an toàn
                          </div>
                        </button>
                      </div>

                      {/* Detail inputs for shared password */}
                      {batchPasswordMode === "shared" && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 animate-fade-in">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Mật khẩu ban đầu chung: <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showBatchSharedPassword ? "text" : "password"}
                                required={batchPasswordMode === "shared"}
                                disabled={isSubmitting}
                                value={batchSharedPassword}
                                onChange={(e) => setBatchSharedPassword(e.target.value)}
                                placeholder="Tối thiểu 6 ký tự"
                                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg pr-8 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowBatchSharedPassword(!showBatchSharedPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                {showBatchSharedPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Xác nhận mật khẩu chung: <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showBatchConfirmSharedPassword ? "text" : "password"}
                                required={batchPasswordMode === "shared"}
                                disabled={isSubmitting}
                                value={batchConfirmSharedPassword}
                                onChange={(e) => setBatchConfirmSharedPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu chung"
                                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg pr-8 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowBatchConfirmSharedPassword(!showBatchConfirmSharedPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                {showBatchConfirmSharedPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="sm:col-span-2 flex items-center gap-2 pt-1 text-slate-600 text-xs">
                            <input
                              type="checkbox"
                              id="batchMustChange"
                              checked={batchMustChangePassword}
                              onChange={(e) => setBatchMustChangePassword(e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="batchMustChange" className="cursor-pointer font-medium">
                              Bắt buộc học sinh đổi mật khẩu trong lần đăng nhập đầu tiên (Bảo mật tối đa)
                            </label>
                          </div>
                        </div>
                      )}

                      {batchPasswordMode === "individual" && (
                        <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl text-blue-900 text-xs leading-relaxed animate-fade-in">
                          💡 <strong>Mẹo dán:</strong> Bạn có thể dán 3 cột từ Excel: <code>[Họ và tên] \t [Mã HS] \t [Mật khẩu]</code> hoặc dán họ tên rồi nhập/sửa trực tiếp mật khẩu trong bảng xem trước bên dưới.
                        </div>
                      )}
                    </div>

                    {/* DÁN DANH SÁCH TEXTAREA */}
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
                        rows={5}
                        disabled={isSubmitting}
                        value={batchRawText}
                        onChange={(e) => {
                          setBatchRawText(e.target.value);
                          setPreviewRows([]);
                          setPreviewStats(null);
                        }}
                        placeholder={`Dán danh sách tại đây (từ Excel/Sheets):\nNguyễn Văn An\tHS10A1-01\tMatKhau123\nTrần Thị Bình\tHS10A1-02\tBinh@2026\nLê Hoàng Nam\t\t`}
                        className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono leading-relaxed"
                      />
                      <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                        <span>Hỗ trợ Tab (\t), dấu phẩy (,) hoặc chấm phẩy (;).</span>
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
                    {previewRows.length > 0 && previewStats && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              Hợp lệ: {previewStats.validCount} dòng
                            </span>
                            {previewStats.errorCount > 0 && (
                              <span className="text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                                Lỗi: {previewStats.errorCount} dòng
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 font-normal">
                            Tổng phát hiện: {previewStats.total} dòng
                          </span>
                        </div>

                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold">
                              <tr>
                                <th className="py-1.5 px-2.5">STT</th>
                                <th className="py-1.5 px-2.5">Họ và tên</th>
                                <th className="py-1.5 px-2.5">Mã học sinh</th>
                                {batchPasswordMode === "individual" && (
                                  <th className="py-1.5 px-2.5">Mật khẩu riêng</th>
                                )}
                                <th className="py-1.5 px-2.5 text-right">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              {previewRows.map((p, idx) => (
                                <tr key={idx} className={p.error ? "bg-rose-50/50" : ""}>
                                  <td className="py-1.5 px-2.5 font-sans text-slate-400">{idx + 1}</td>
                                  <td className="py-1.5 px-2.5 font-sans font-semibold text-slate-800">
                                    {p.displayName || "(Trống)"}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-slate-600">
                                    {p.studentCode || "(Tự sinh theo lớp)"}
                                  </td>
                                  {batchPasswordMode === "individual" && (
                                    <td className="py-1 px-2.5">
                                      <input
                                        type="text"
                                        placeholder=">= 6 ký tự"
                                        value={p.password || ""}
                                        onChange={(e) => handleUpdateRowPassword(idx, e.target.value)}
                                        className="px-2 py-0.5 text-[11px] border border-slate-300 rounded font-mono w-28 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </td>
                                  )}
                                  <td className="py-1.5 px-2.5 text-right font-sans">
                                    {p.error ? (
                                      <span className="text-rose-600 font-bold">{p.error}</span>
                                    ) : (
                                      <span className="text-emerald-600 font-bold">✓ Hợp lệ</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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
