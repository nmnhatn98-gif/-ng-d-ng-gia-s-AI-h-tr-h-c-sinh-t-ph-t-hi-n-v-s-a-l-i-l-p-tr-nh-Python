import React, { useState, useEffect } from "react";
import { UserProfile, ClassItem } from "../types";
import {
  saveStudentsToGoogleDrive,
  listStudentFilesFromDrive,
  deleteFileFromDrive,
  loadStudentsFromDriveFile,
  connectGoogleDrive,
  isDriveConnected,
  getCachedDriveUser,
  GoogleDriveFile,
} from "../services/googleDriveService";
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  HardDrive,
  FileSpreadsheet,
  ExternalLink,
  Check,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  FileText,
  X,
  ShieldCheck,
  FolderCheck,
  Lock,
  Copy,
  Users,
  Database
} from "lucide-react";

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: UserProfile[];
  classes: ClassItem[];
  currentClassFilter?: string;
  onStudentsImported?: (importedStudents: UserProfile[]) => void;
  onTriggerToast?: (message: string) => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  currentClassFilter = "all",
  onStudentsImported,
  onTriggerToast,
}) => {
  const [activeTab, setActiveTab] = useState<"save" | "browse">("save");
  
  // Save Settings State
  const [targetClass, setTargetClass] = useState<string>(
    currentClassFilter !== "all" ? currentClassFilter : "all"
  );
  const [saveFormat, setSaveFormat] = useState<"spreadsheet" | "csv" | "json">("spreadsheet");
  const [customFileName, setCustomFileName] = useState<string>("");
  
  // Status states
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [savedResult, setSavedResult] = useState<GoogleDriveFile | null>(null);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Deletion Confirmation Dialog State (MANDATORY per Workspace Skill)
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Unique list of classes
  const classNames = Array.from(
    new Set([
      "Lớp 4A",
      "Lớp 4B",
      "Lớp 7A1",
      "Lớp 8B",
      "Lớp 11 Tin",
      "CLB Robotics",
      ...classes.map(c => c.name.split(" - ")[0]),
      ...students.map(s => s.classGrade).filter(Boolean) as string[]
    ])
  );

  // Filter students based on targetClass
  const studentsToSave = targetClass === "all"
    ? students
    : students.filter(s => s.classGrade?.toLowerCase().trim() === targetClass.toLowerCase().trim());

  // Connect & Auth Handler
  const handleAuthorizeDrive = async () => {
    setIsConnecting(true);
    try {
      await connectGoogleDrive();
      onTriggerToast?.("✅ Đã kết nối Google Drive thành công!");
    } catch (err: any) {
      console.error(err);
      alert(`Không thể kết nối Google Drive: ${err.message || "Vui lòng thử lại"}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Save to Google Drive
  const handleSaveToDrive = async () => {
    if (studentsToSave.length === 0) {
      alert("Không có học sinh nào trong phạm vi đã chọn để lưu!");
      return;
    }

    setIsSaving(true);
    setSavedResult(null);

    try {
      const result = await saveStudentsToGoogleDrive({
        students: studentsToSave,
        className: targetClass,
        format: saveFormat,
        customFileName: customFileName.trim() || undefined,
      });

      setSavedResult(result);
      onTriggerToast?.(`✅ Đã lưu thành công dữ liệu ${studentsToSave.length} học sinh vào Google Drive!`);
      // Refresh browse list if possible
      loadDriveFiles();
    } catch (err: any) {
      console.error("Save to Drive error:", err);
      alert(`Lỗi khi lưu vào Google Drive: ${err.message || "Kiểm tra kết nối mạng hoặc thử lại"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Load drive files
  const loadDriveFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const files = await listStudentFilesFromDrive();
      setDriveFiles(files);
    } catch (err: any) {
      console.warn("Could not list drive files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "browse") {
      loadDriveFiles();
    }
  }, [isOpen, activeTab]);

  // Import from Drive file
  const handleImportFile = async (file: GoogleDriveFile) => {
    const confirmImport = window.confirm(
      `Bạn có muốn nhập dữ liệu từ tệp "${file.name}" trên Google Drive vào hệ thống LMS không? Các học sinh sẽ được bổ sung vào danh sách lớp.`
    );
    if (!confirmImport) return;

    setIsImporting(true);
    try {
      const imported = await loadStudentsFromDriveFile(file);
      if (imported.length === 0) {
        alert("Tệp trên Google Drive không chứa dữ liệu học sinh hợp lệ hoặc bị trống.");
        return;
      }
      onStudentsImported?.(imported);
      onTriggerToast?.(`✅ Đã nhập thành công ${imported.length} học sinh từ Google Drive!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi khi đọc tệp từ Google Drive: ${err.message || "Vui lòng thử lại"}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Delete file confirmation & execute
  const handleExecuteDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFileFromDrive(fileToDelete.id);
      setDriveFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      onTriggerToast?.(`🗑️ Đã xóa tệp "${fileToDelete.name}" khỏi Google Drive`);
      setFileToDelete(null);
    } catch (err: any) {
      console.error("Delete file error:", err);
      alert(`Không thể xóa tệp: ${err.message || "Vui lòng thử lại"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const driveUser = getCachedDriveUser();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-inner">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <span>Lưu Trữ Dữ Liệu Học Sinh Vào Google Drive</span>
              </h2>
              <p className="text-xs text-emerald-100 mt-1">
                Sao lưu, đồng bộ danh sách học sinh và mở trực tiếp dưới dạng Bảng tính Google Sheets
              </p>
            </div>
          </div>

          {/* Account Status Badge */}
          <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                {driveUser ? (
                  <>Tài khoản Google: <strong>{driveUser.email || driveUser.displayName}</strong></>
                ) : (
                  <>Kết nối Google Drive (Quyền <code>drive.file</code> bảo mật)</>
                )}
              </span>
            </div>
            {!isDriveConnected() && (
              <button
                type="button"
                onClick={handleAuthorizeDrive}
                disabled={isConnecting}
                className="bg-white text-emerald-800 hover:bg-emerald-50 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                {isConnecting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Ủy Quyền Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("save")}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "save"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>Lưu Vào Google Drive</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("browse");
              loadDriveFiles();
            }}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "browse"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FolderCheck className="w-4 h-4" />
            <span>Tệp Học Sinh Đã Lưu ({driveFiles.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {activeTab === "save" ? (
            <div className="space-y-5">
              {/* Scope Selection: Which students to save */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Chọn phạm vi học sinh cần lưu:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetClass("all")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      targetClass === "all"
                        ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                      <span>Toàn Trường / Tất Cả Học Sinh</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                        {students.length} HS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Lưu toàn bộ cơ sở dữ liệu học sinh tất cả các khối lớp
                    </p>
                  </button>

                  <div className="p-3 rounded-2xl border border-slate-200 bg-white">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Hoặc lưu theo từng lớp cụ thể:
                    </label>
                    <select
                      value={targetClass}
                      onChange={(e) => setTargetClass(e.target.value)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-emerald-500"
                    >
                      <option value="all">-- Chọn lớp học --</option>
                      {classNames.map((cls) => {
                        const count = students.filter(
                          (s) => s.classGrade?.toLowerCase().trim() === cls.toLowerCase().trim()
                        ).length;
                        return (
                          <option key={cls} value={cls}>
                            {cls} ({count} học sinh)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Định dạng lưu trữ trên Google Drive:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSaveFormat("spreadsheet")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      saveFormat === "spreadsheet"
                        ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs text-slate-900">Google Sheet</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Mở và chỉnh sửa trực tiếp trên Google Sheets
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSaveFormat("csv")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      saveFormat === "csv"
                        ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-xs text-slate-900">Tệp CSV</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Tệp bảng tính chuẩn hóa UTF-8 cho Excel & Sheets
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSaveFormat("json")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      saveFormat === "json"
                        ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-xs text-slate-900">Sao Lưu JSON</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Cấu trúc đầy đủ phục hồi tài khoản học sinh
                    </p>
                  </button>
                </div>
              </div>

              {/* Custom File Name (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên tệp trên Google Drive (để trống sẽ tự động tạo):
                </label>
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder={`Ví dụ: DanhSachHocSinh_${targetClass !== "all" ? targetClass : "ToanTruong"}_2026`}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-emerald-500 font-mono"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveToDrive}
                  disabled={isSaving}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tạo và lưu tệp vào Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      <span>Lưu Dữ Liệu {studentsToSave.length} Học Sinh Vào Google Drive</span>
                    </>
                  )}
                </button>
              </div>

              {/* Success Result Card */}
              {savedResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-emerald-900 flex items-center gap-2">
                        <span>Đã lưu thành công vào Google Drive!</span>
                      </h4>
                      <p className="text-xs text-emerald-800 font-medium truncate mt-0.5">
                        Tệp: <strong>{savedResult.name}</strong>
                      </p>
                      
                      {/* Action Links */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {savedResult.webViewLink && (
                          <a
                            href={savedResult.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Mở Trên Google Drive / Sheets</span>
                          </a>
                        )}

                        {savedResult.webViewLink && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(savedResult.webViewLink || "");
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2500);
                            }}
                            className="bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition-all"
                          >
                            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLink ? "Đã sao chép link!" : "Sao chép Link Drive"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Browse Existing Drive Files Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Danh sách tệp dữ liệu học sinh trên Google Drive
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chỉ hiển thị các tệp do ứng dụng tạo và quản lý trên Drive của bạn
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadDriveFiles}
                  disabled={isLoadingFiles}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? "animate-spin" : ""}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {isLoadingFiles ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                  <span>Đang tải danh sách tệp từ Google Drive...</span>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
                  <HardDrive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Chưa có tệp dữ liệu học sinh nào trên Google Drive</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    Chuyển sang tab "Lưu Vào Google Drive" để tạo tệp bảng tính đầu tiên của bạn.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("save")}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all inline-flex items-center gap-1.5"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Lưu tệp học sinh ngay</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                  {driveFiles.map((file) => {
                    const isSheet = file.mimeType.includes("spreadsheet");
                    const isJson = file.mimeType.includes("json");

                    return (
                      <div
                        key={file.id}
                        className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            isSheet
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : isJson
                              ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                              : "bg-blue-50 text-blue-600 border border-blue-200"
                          }`}>
                            {isSheet ? (
                              <FileSpreadsheet className="w-5 h-5" />
                            ) : isJson ? (
                              <Database className="w-5 h-5" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString("vi-VN") : "Gần đây"} •{" "}
                              {isSheet ? "Google Sheet" : isJson ? "JSON Backup" : "CSV"}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors"
                              title="Mở trên Google Drive"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleImportFile(file)}
                            disabled={isImporting}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition-colors"
                            title="Khôi phục/Nhập học sinh vào LMS"
                          >
                            <CloudDownload className="w-3.5 h-3.5" />
                            <span>Nhập</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-200 transition-colors"
                            title="Xóa tệp khỏi Google Drive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Phạm vi quyền: <code>drive.file</code> (Chỉ truy cập tệp do LMS tạo)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-all text-xs"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* MANDATORY USER CONFIRMATION DIALOG FOR DELETION */}
      {fileToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 rounded-full bg-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Xác nhận xóa tệp trên Google Drive
                </h3>
                <p className="text-xs text-slate-500">Thao tác này sẽ xóa tệp vĩnh viễn khỏi Google Drive của bạn.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 my-4 text-xs">
              <p className="text-slate-700">Tệp sẽ xóa:</p>
              <p className="font-bold text-slate-900 truncate mt-1">{fileToDelete.name}</p>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác Nhận Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
