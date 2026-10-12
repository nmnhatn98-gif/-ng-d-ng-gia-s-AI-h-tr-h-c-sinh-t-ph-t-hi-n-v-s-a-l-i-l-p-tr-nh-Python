import React, { useState, useEffect } from "react";
import { UserProfile, GradeLevel, ClassItem } from "../types";
import { 
  getStoredStudents, 
  saveStudents, 
  generateBatchStudentsByClass, 
  parseGoogleSheetsText, 
  generateGoogleSheetsTSV, 
  exportToGoogleSheetsCSV,
  subscribeStudentsUpdate,
  syncStudentsWithCloud,
  downloadSystemBackup,
  restoreSystemBackupFromFile,
  restoreFromStudentVault
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
  Upload, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles, 
  School, 
  CheckCircle2, 
  FileText,
  Printer,
  HardDrive,
  CloudUpload,
  RefreshCw,
  Database,
  Archive,
  FolderSync
} from "lucide-react";
import { GoogleDriveSyncModal } from "./GoogleDriveSyncModal";

interface StudentAccountManagerProps {
  classes: ClassItem[];
  onUpdateClasses?: (classes: ClassItem[]) => void;
}

export const StudentAccountManager: React.FC<StudentAccountManagerProps> = ({
  classes,
  onUpdateClasses,
}) => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showPasswords, setShowPasswords] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);
  const [isPrintCardsOpen, setIsPrintCardsOpen] = useState(false);

  // Batch Creator Form State
  const defaultClass = classes[0]?.name?.split(" - ")[0] || "";
  const [batchClass, setBatchClass] = useState<string>(defaultClass);
  const [batchMode, setBatchMode] = useState<"auto" | "paste-names" | "single">("auto");
  const [batchCount, setBatchCount] = useState<number>(30);
  const [batchPrefix, setBatchPrefix] = useState<string>(defaultClass ? `HS-${defaultClass.replace(/\s+/g, "")}` : "HS");
  const [batchPassword, setBatchPassword] = useState<string>("123456");
  const [batchNamesText, setBatchNamesText] = useState<string>("");
  
  // Single Student State
  const [singleName, setSingleName] = useState("");
  const [singleCode, setSingleCode] = useState("");
  const [singlePassword, setSinglePassword] = useState("123456");
  const [singleEmail, setSingleEmail] = useState("");

  // Google Sheets Import State
  const [sheetsPastedText, setSheetsPastedText] = useState("");
  const [sheetsTargetClass, setSheetsTargetClass] = useState(defaultClass);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load students on mount and subscribe to real-time updates
  useEffect(() => {
    setStudents(getStoredStudents());
    const unsub = subscribeStudentsUpdate((updated) => {
      setStudents(updated);
    });
    // Trigger background sync across Server Disk + Firestore + LocalStorage
    syncStudentsWithCloud().then((synced) => {
      if (synced && synced.length > 0) {
        setStudents(synced);
      }
    });
    return () => unsub();
  }, []);

  const triggerToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3500);
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncStudentsWithCloud();
      setStudents(res);
      triggerToast("🟢 Đã đồng bộ hóa dữ liệu học sinh thành công!");
    } catch (err: any) {
      triggerToast("⚠️ Lỗi đồng bộ: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromVaultAction = async () => {
    setIsSyncing(true);
    try {
      const res = await restoreFromStudentVault();
      setStudents(res);
      triggerToast(`🎉 Đã khôi phục thành công ${res.length} tài khoản từ két máy chủ!`);
    } catch (err: any) {
      triggerToast("⚠️ Lỗi khôi phục từ két máy chủ: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      await downloadSystemBackup();
      triggerToast("📥 Đã tải file sao lưu (.json) về máy tính!");
    } catch (err: any) {
      triggerToast("⚠️ Lỗi tải bản sao lưu: " + err.message);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await restoreSystemBackupFromFile(text);
        if (res.success) {
          setStudents(getStoredStudents());
          triggerToast("🎉 " + res.message);
        } else {
          triggerToast("⚠️ " + res.message);
        }
      } catch (err: any) {
        triggerToast("⚠️ Lỗi đọc file sao lưu: " + err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const matchClass =
      selectedClassFilter === "all" ||
      s.classGrade?.toLowerCase().includes(selectedClassFilter.toLowerCase());

    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      !query ||
      s.displayName.toLowerCase().includes(query) ||
      s.studentCode?.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query);

    return matchClass && matchSearch;
  });

  // Unique list of classes in students
  const classNames = Array.from(
    new Set([
      ...classes.map((c) => c.name.split(" - ")[0]),
      ...students.map((s) => s.classGrade).filter(Boolean) as string[],
    ])
  );

  // 1. BATCH CREATE HANDLER
  const handleExecuteBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (batchMode === "single") {
      if (!singleName.trim()) {
        alert("Vui lòng nhập họ và tên học sinh!");
        return;
      }
      const newStudent: UserProfile = {
        uid: `std-${Date.now()}`,
        displayName: singleName.trim(),
        role: "student",
        studentCode: singleCode.trim() || `HS-${batchClass.replace(/\s+/g, "").toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`,
        classGrade: batchClass,
        gradeLevel: "middle",
        email: singleEmail.trim() || `${singleName.toLowerCase().replace(/\s+/g, "")}@${batchClass.toLowerCase().replace(/\s+/g, "")}.lms.vn`,
        password: singlePassword.trim() || "123456",
        school: "Trường Phổ Thông",
        isGoogleLinked: false,
        createdAt: new Date().toISOString(),
      };
      const updated = [newStudent, ...students];
      await saveStudents(updated);
      setStudents(updated);
      triggerToast(`✅ Đã thêm thành công học sinh ${newStudent.displayName} (${newStudent.studentCode})`);
      setIsBatchModalOpen(false);
      setSingleName("");
      setSingleCode("");
      return;
    }

    let customNames: string[] | undefined = undefined;
    if (batchMode === "paste-names") {
      customNames = batchNamesText
        .split("\n")
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      if (customNames.length === 0) {
        alert("Vui lòng nhập ít nhất 1 tên học sinh!");
        return;
      }
    }

    try {
      const generated = await generateBatchStudentsByClass({
        className: batchClass,
        count: batchCount,
        prefixCode: batchPrefix.trim() || undefined,
        defaultPassword: batchPassword.trim() || "123456",
        customNames,
      });

      const updated = getStoredStudents();
      setStudents(updated);
      setIsBatchModalOpen(false);
      triggerToast(`🎉 Đã tạo thành công ${generated.length} tài khoản cho ${batchClass}!`);
    } catch (err) {
      console.error("Batch creation failed:", err);
      alert("Lỗi khi tạo tài khoản hàng loạt.");
    }
  };

  // 2. GOOGLE SHEETS IMPORT HANDLER
  const handleImportFromGoogleSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetsPastedText.trim()) {
      alert("Vui lòng dán dữ liệu từ Google Sheets!");
      return;
    }

    const { students: parsed, totalParsed } = parseGoogleSheetsText(
      sheetsPastedText,
      sheetsTargetClass
    );

    if (totalParsed === 0) {
      alert("Không tìm thấy dòng học sinh hợp lệ trong văn bản dán. Vui lòng kiểm tra lại định dạng.");
      return;
    }

    const newProfiles: UserProfile[] = parsed.map((item, idx) => {
      const classGrade = item.classGrade || sheetsTargetClass;
      const cleanClass = classGrade.replace(/\s+/g, "").toUpperCase();
      const code = item.code || `HS-${cleanClass}-${String(idx + 1).padStart(2, "0")}`;
      const email = item.email || `${code.toLowerCase()}@${cleanClass.toLowerCase()}.lms.vn`;

      return {
        uid: `std-sheet-${Date.now()}-${idx}`,
        displayName: item.name,
        role: "student",
        studentCode: code,
        classGrade: classGrade,
        gradeLevel: "middle",
        email: email,
        password: item.password || "123456",
        school: "Trường Phổ Thông",
        isGoogleLinked: false,
        createdAt: new Date().toISOString(),
      };
    });

    const merged = [...newProfiles, ...students];
    await saveStudents(merged);
    setStudents(merged);
    setSheetsPastedText("");
    setIsGoogleSheetsModalOpen(false);
    triggerToast(`🎉 Đã nhập thành công ${newProfiles.length} học sinh từ Google Sheets vào ${sheetsTargetClass}!`);
  };

  // 3. COPY TSV TO CLIPBOARD FOR GOOGLE SHEETS (Ctrl + V ready)
  const handleCopyGoogleSheetsTSV = () => {
    const listToExport = filteredStudents.length > 0 ? filteredStudents : students;
    const tsvText = generateGoogleSheetsTSV(listToExport);
    navigator.clipboard.writeText(tsvText);
    triggerToast(`📋 Đã sao chép ${listToExport.length} tài khoản học sinh! Mở Google Sheets và bấm Ctrl + V để dán.`);
  };

  // 4. DOWNLOAD CSV
  const handleDownloadCSV = () => {
    const listToExport = filteredStudents.length > 0 ? filteredStudents : students;
    const filename = `danh-sach-hoc-sinh-${selectedClassFilter === "all" ? "toan-truong" : selectedClassFilter.replace(/\s+/g, "-")}.csv`;
    exportToGoogleSheetsCSV(listToExport, filename);
    triggerToast("📥 File CSV tiếng Việt đã được tải xuống máy tính!");
  };

  // 5. DELETE STUDENT
  const handleDeleteStudent = async (uid: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản của học sinh "${name}"?`)) {
      return;
    }
    const updated = students.filter((s) => s.uid !== uid);
    await saveStudents(updated);
    setStudents(updated);
    triggerToast(`Đã xóa tài khoản học sinh "${name}"`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hidden File Input for Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRestoreFile}
        accept=".json"
        className="hidden"
      />

      {/* Toast Notification */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Data Protection & Persistence Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 border border-indigo-500/20 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Database className="w-4 h-4" />
              </span>
              <span className="text-sm font-black text-emerald-400 uppercase tracking-wide">
                Cơ Chế Lưu Trữ Đa Tầng An Toàn (Multi-Layer Durability)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Không Mất Dữ Liệu Khi Cập Nhật
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Mọi tài khoản học sinh và bài nộp được bảo vệ qua 3 tầng: <strong>Ổ đĩa máy chủ (Server Disk)</strong> + <strong>Đám mây (Cloud Firestore)</strong> + <strong>Bộ nhớ đệm (LocalStorage)</strong>. Mỗi lần nâng cấp phiên bản hệ thống, toàn bộ dữ liệu học sinh vẫn được giữ nguyên vẹn 100%.
            </p>
          </div>

          {/* Durability Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleForceSync}
              disabled={isSyncing}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
              title="Đồng bộ lại tài khoản từ máy chủ và đám mây"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Đang đồng bộ..." : "Đồng Bộ Ngay"}</span>
            </button>

            <button
              type="button"
              onClick={handleRestoreFromVaultAction}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              title="Khôi phục toàn bộ tài khoản từ két lưu trữ vĩnh viễn trên máy chủ"
            >
              <Database className="w-3.5 h-3.5 text-emerald-200" />
              <span>Khôi Phục Từ Két Máy Chủ</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              title="Tải toàn bộ tài khoản và bài tập về lưu trữ dự phòng (.json)"
            >
              <Archive className="w-3.5 h-3.5 text-indigo-200" />
              <span>Sao Lưu Toàn Bộ (.json)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
              title="Khôi phục lại dữ liệu học sinh từ tệp tin sao lưu trước đó"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Khôi Phục Dữ Liệu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header & Main Actions Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-slate-900">
              Quản Lý Tài Khoản Học Sinh & Đồng Bộ Google Sheets
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng số: <strong className="text-blue-600">{students.length} học sinh</strong> trong hệ thống • Giáo viên có thể tạo nhanh theo lớp hoặc xuất/nhập bảng tính
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Creator Button */}
          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Nhanh Theo Lớp</span>
          </button>

          {/* Google Drive Integration Button */}
          <button
            type="button"
            onClick={() => setIsGoogleDriveModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
            title="Lưu trữ và đồng bộ danh sách học sinh vào Google Drive"
          >
            <HardDrive className="w-4 h-4" />
            <span>Lưu Vào Google Drive</span>
          </button>

          {/* Google Sheets Integration Button */}
          <button
            type="button"
            onClick={() => setIsGoogleSheetsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets (Nhập / Xuất)</span>
          </button>

          {/* Print Cards Button */}
          <button
            type="button"
            onClick={() => setIsPrintCardsOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 border border-slate-200"
            title="In thẻ đăng nhập cho học sinh"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">In Thẻ Học Sinh</span>
          </button>
        </div>
      </div>

      {/* Filters & Quick Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Class Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedClassFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedClassFilter === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả lớp ({students.length})
          </button>

          {classNames.map((cls) => {
            const countInClass = students.filter(
              (s) => s.classGrade?.toLowerCase() === cls.toLowerCase()
            ).length;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClassFilter(cls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedClassFilter === cls
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cls} ({countInClass})
              </button>
            );
          })}
        </div>

        {/* Search & Password Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên, Mã HS, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className={`p-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 shrink-0 ${
              showPasswords
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title="Hiện/Ẩn mật khẩu học sinh"
          >
            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden md:inline text-[11px]">
              {showPasswords ? "Ẩn Mật Khẩu" : "Hiện Mật Khẩu"}
            </span>
          </button>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4">Mã Học Sinh</th>
                <th className="py-3.5 px-4">Họ Và Tên</th>
                <th className="py-3.5 px-4">Lớp Học</th>
                <th className="py-3.5 px-4">Tên Đăng Nhập / Email</th>
                <th className="py-3.5 px-4">Mật Khẩu</th>
                <th className="py-3.5 px-4">Liên Kết Google</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Users className="w-10 h-10 text-slate-300 mx-auto" />
                      <div>
                        <p className="font-bold text-slate-700 text-sm">Chưa có học sinh nào trong danh sách</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Nếu bạn vừa đăng ký hoặc cần khôi phục danh sách học sinh từ máy chủ:
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleRestoreFromVaultAction}
                          disabled={isSyncing}
                          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>Khôi Phục Từ Két Máy Chủ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsBatchModalOpen(true)}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tạo Nhanh Theo Lớp</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => (
                  <tr key={std.uid} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">
                        {std.studentCode || `HS-${idx + 1}`}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs">
                          {std.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{std.displayName}</div>
                          <div className="text-[10px] text-slate-400">{std.school || "Trường Phổ Thông"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {std.classGrade || "Chưa gán"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {std.email}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {showPasswords ? (
                        <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                          {std.password || "123456"}
                        </span>
                      ) : (
                        <span className="text-slate-400 tracking-widest">••••••</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {std.isGoogleLinked ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Đã liên kết ({std.googleEmail ? std.googleEmail.split("@")[0] : "Google"})</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Chưa liên kết
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(std.uid, std.displayName)}
                        title="Xóa học sinh này"
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Hiển thị <strong>{filteredStudents.length}</strong> / <strong>{students.length}</strong> học sinh
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyGoogleSheetsTSV}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép bảng cho Google Sheets</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== MODAL 1: BATCH ACCOUNT CREATOR ===================== */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Tạo Nhanh Tài Khoản Học Sinh Theo Lớp</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động sinh mã học sinh, email nội bộ và mật khẩu đăng nhập đồng loạt
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setBatchMode("auto")}
                className={`py-2 rounded-xl transition-all ${
                  batchMode === "auto" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1. Sinh Tự Động
              </button>
              <button
                type="button"
                onClick={() => setBatchMode("paste-names")}
                className={`py-2 rounded-xl transition-all ${
                  batchMode === "paste-names" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                2. Dán Danh Sách Tên
              </button>
              <button
                type="button"
                onClick={() => setBatchMode("single")}
                className={`py-2 rounded-xl transition-all ${
                  batchMode === "single" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                3. Thêm 1 Học Sinh
              </button>
            </div>

            <form onSubmit={handleExecuteBatchCreate} className="space-y-4">
              {/* Target Class Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lớp học chỉ định:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={batchClass}
                    onChange={(e) => {
                      setBatchClass(e.target.value);
                      const clean = e.target.value.replace(/\s+/g, "").toUpperCase();
                      setBatchPrefix(`HS-${clean}`);
                    }}
                    placeholder="VD: Lớp 7A1, Lớp 8B, 10 Tin..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-900"
                  />
                </div>
              </div>

              {/* MODE 1: AUTO GENERATE */}
              {batchMode === "auto" && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số lượng học sinh cần tạo:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={batchCount}
                        onChange={(e) => setBatchCount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tiền tố Mã học sinh:
                      </label>
                      <input
                        type="text"
                        value={batchPrefix}
                        onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold bg-white uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mật khẩu mặc định:
                    </label>
                    <input
                      type="text"
                      value={batchPassword}
                      onChange={(e) => setBatchPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono bg-white"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Hệ thống sẽ tự động gán họ tên mẫu tiếng Việt và tạo danh sách từ{" "}
                    <strong>{batchPrefix}-01</strong> đến <strong>{batchPrefix}-{String(batchCount).padStart(2, "0")}</strong>.
                  </p>
                </div>
              )}

              {/* MODE 2: PASTE NAMES */}
              {batchMode === "paste-names" && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dán danh sách họ tên (Mỗi dòng một học sinh):
                    </label>
                    <textarea
                      rows={6}
                      value={batchNamesText}
                      onChange={(e) => setBatchNamesText(e.target.value)}
                      placeholder="Nguyễn Văn An&#10;Trần Thị Bình&#10;Lê Hoàng Cường"
                      className="w-full p-3 text-xs border border-slate-300 rounded-xl font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tiền tố Mã HS:
                      </label>
                      <input
                        type="text"
                        value={batchPrefix}
                        onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold bg-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mật khẩu mặc định:
                      </label>
                      <input
                        type="text"
                        value={batchPassword}
                        onChange={(e) => setBatchPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 3: SINGLE STUDENT */}
              {batchMode === "single" && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên học sinh: *
                    </label>
                    <input
                      type="text"
                      required
                      value={singleName}
                      onChange={(e) => setSingleName(e.target.value)}
                      placeholder="VD: Trần Bảo An"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mã học sinh (Tùy chọn):
                      </label>
                      <input
                        type="text"
                        value={singleCode}
                        onChange={(e) => setSingleCode(e.target.value.toUpperCase())}
                        placeholder="VD: HS-7A1-99"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono uppercase bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mật khẩu:
                      </label>
                      <input
                        type="text"
                        value={singlePassword}
                        onChange={(e) => setSinglePassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email học sinh / Google (Tùy chọn):
                    </label>
                    <input
                      type="email"
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      placeholder="email@gmail.com"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  {batchMode === "single" ? "Thêm Học Sinh" : "Tạo Hàng Loạt Ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: GOOGLE SHEETS INTEGRATION ===================== */}
      {isGoogleSheetsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Liên Kết & Đồng Bộ Với Google Sheets
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nhập danh sách học sinh từ Google Sheets hoặc xuất bảng tính ra ngoài
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleSheetsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Export Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5 mb-1">
                    <Copy className="w-4 h-4 text-emerald-600" />
                    <span>Sao chép vào Google Sheets</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Định dạng chuẩn TSV. Giáo viên chỉ cần bấm nút, mở một trang tính Google Sheet trống và nhấn <strong>Ctrl + V</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyGoogleSheetsTSV}
                  className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Sao Chép Dữ Liệu Bảng Tính
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-xs text-blue-950 flex items-center gap-1.5 mb-1">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Tải File CSV Chuẩn Tiếng Việt</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Tệp CSV mã hóa UTF-8 BOM, tương thích hoàn toàn khi mở trên Google Sheets và Microsoft Excel mà không bị lỗi font tiếng Việt.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Tải File .CSV Về Máy
                </button>
              </div>
            </div>

            {/* Import from Google Sheets Form */}
            <form onSubmit={handleImportFromGoogleSheets} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Dán dữ liệu sao chép từ Google Sheets vào đây:</span>
                </label>
                <span className="text-[11px] text-slate-400">Tự động nhận diện cột</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Gán vào lớp học mặc định:
                  </label>
                  <input
                    type="text"
                    required
                    value={sheetsTargetClass}
                    onChange={(e) => setSheetsTargetClass(e.target.value)}
                    placeholder="VD: Lớp 7A1"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div className="text-[11px] text-slate-500 flex items-center">
                  Cấu trúc hỗ trợ: [STT] [Mã HS] [Họ và tên] [Lớp] [Email] hoặc chỉ cần cột [Họ và tên].
                </div>
              </div>

              <textarea
                rows={5}
                required
                value={sheetsPastedText}
                onChange={(e) => setSheetsPastedText(e.target.value)}
                placeholder="Ví dụ dán từ Google Sheets:&#10;1	HS-7A1-01	Nguyễn Văn An	Lớp 7A1	an@gmail.com&#10;2	HS-7A1-02	Trần Thị Bình	Lớp 7A1	binh@gmail.com"
                className="w-full p-3 text-xs border border-slate-300 rounded-xl font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoogleSheetsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  Nhập Học Sinh Vào Hệ Thống
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: PRINT LOGIN CARDS ===================== */}
      {isPrintCardsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>Phiếu Cấp Tài Khoản Học Sinh (In & Phát Đầu Năm)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mẫu thẻ tài khoản phát cho từng học sinh để đăng nhập tại phòng thực hành tin học
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintCardsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Print button */}
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>In Toàn Bộ Thẻ (Print)</span>
              </button>
            </div>

            {/* Grid of Student Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredStudents.slice(0, 16).map((std) => (
                <div
                  key={std.uid}
                  className="p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 space-y-2 relative"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black uppercase text-blue-700">
                      LMS TIN HỌC & STEM
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {std.classGrade}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">Học sinh:</div>
                    <div className="text-sm font-black text-slate-900">{std.displayName}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400">Mã Học Sinh:</div>
                      <div className="font-mono font-bold text-blue-700">{std.studentCode}</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400">Mật khẩu:</div>
                      <div className="font-mono font-bold text-slate-800">{std.password || "123456"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Sync Modal */}
      <GoogleDriveSyncModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
        students={students}
        classes={classes}
        currentClassFilter={selectedClassFilter}
        onStudentsImported={async (imported) => {
          const existingCodes = new Set(students.map((s) => s.studentCode));
          const newOnes = imported.filter((s) => !existingCodes.has(s.studentCode));
          const merged = [...newOnes, ...students];
          await saveStudents(merged);
          setStudents(merged);
          triggerToast(`✅ Đã nhập thành công ${newOnes.length} học sinh từ Google Drive!`);
        }}
        onTriggerToast={triggerToast}
      />
    </div>
  );
};
