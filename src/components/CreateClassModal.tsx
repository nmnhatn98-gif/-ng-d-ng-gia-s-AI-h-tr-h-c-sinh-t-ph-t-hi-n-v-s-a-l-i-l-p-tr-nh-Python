import React, { useState } from "react";
import {
  X,
  Plus,
  BookOpen,
  Users,
  Check,
  Cpu,
  Code2,
  GraduationCap,
  Calendar,
  MapPin,
  UserCheck,
  Laptop,
  Loader2,
} from "lucide-react";
import { ClassItem, GradeLevel, UserProfile } from "../types";

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  onSaveClass: (newClass: ClassItem) => Promise<void> | void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveClass,
}) => {
  // CRITICAL: Hooks MUST always be called before any conditional returns
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>("high");
  const [gradeNumber, setGradeNumber] = useState<number>(10);
  const [className, setClassName] = useState<string>("");
  const [teacherName, setTeacherName] = useState<string>(currentUser?.displayName || "");
  const [expectedStudentCount, setExpectedStudentCount] = useState<string>("");
  const [schoolYear, setSchoolYear] = useState<string>("2025 - 2026");
  const [room, setRoom] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  // Grade/Level changes NEVER overwrite the teacher's custom class name or teacher name
  const handleLevelChange = (lvl: GradeLevel) => {
    setGradeLevel(lvl);
    if (lvl === "elementary") {
      setGradeNumber(4);
    } else if (lvl === "middle") {
      setGradeNumber(7);
    } else if (lvl === "high") {
      setGradeNumber(10);
    } else {
      setGradeNumber(0);
    }
  };

  const handleGradeNumberSelect = (g: number) => {
    setGradeNumber(g);
  };

  const handleClose = () => {
    if (isSaving) return;
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanName = className.trim();
    if (!cleanName) {
      setError("Vui lòng nhập tên lớp học.");
      return;
    }

    if (cleanName.length < 2) {
      setError("Tên lớp học phải có độ dài tối thiểu từ 2 ký tự.");
      return;
    }

    if (cleanName.length > 80) {
      setError("Tên lớp học không được vượt quá 80 ký tự.");
      return;
    }

    const cleanTeacher = (teacherName.trim() || currentUser?.displayName || "").trim();
    if (!cleanTeacher) {
      setError("Vui lòng nhập họ tên giáo viên phụ trách.");
      return;
    }

    const expCount = expectedStudentCount ? parseInt(expectedStudentCount, 10) : undefined;
    if (expCount !== undefined && (isNaN(expCount) || expCount < 1 || expCount > 200)) {
      setError("Sĩ số dự kiến phải là số nguyên hợp lệ từ 1 đến 200.");
      return;
    }

    const uniqueId = `cls-${gradeLevel}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newClass: ClassItem = {
      id: uniqueId,
      name: cleanName,
      gradeLevel,
      gradeNumber: gradeNumber > 0 ? gradeNumber : undefined,
      studentCount: 0, // Real student count starts at 0, computed from actual enrolled accounts
      expectedStudentCount: expCount,
      teacherName: cleanTeacher,
      ownerUid: currentUser?.uid,
      ownerEmail: currentUser?.email,
      description: description.trim() || `Lớp ${cleanName} do ${cleanTeacher} phụ trách.`,
      schoolYear: schoolYear.trim(),
      room: room.trim(),
      createdAt: new Date().toISOString(),
      status: "active",
    };

    setIsSaving(true);
    try {
      await onSaveClass(newClass);
      // Reset form on success
      setClassName("");
      setDescription("");
      setRoom("");
      setExpectedStudentCount("");
      setError("");
      onClose();
    } catch (err: any) {
      console.error("Save class error:", err);
      setError(err?.message || "Không thể lưu lớp học lên máy chủ. Vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-tight">
                Tạo Lớp Học Mới
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập thông tin lớp học theo tên riêng của giáo viên, phân loại cấp học và phân công quản lý.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Chọn Cấp học */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              1. Cấp học & Phân hệ: <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Tiểu học */}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleLevelChange("elementary")}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  gradeLevel === "elementary"
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {gradeLevel === "elementary" && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
                <Laptop className="w-4 h-4 text-emerald-600 mb-1" />
                <div className="text-xs font-black text-slate-900">Tiểu học</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Khối 1 - 5</div>
              </button>

              {/* THCS */}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleLevelChange("middle")}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  gradeLevel === "middle"
                    ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {gradeLevel === "middle" && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
                <Code2 className="w-4 h-4 text-indigo-600 mb-1" />
                <div className="text-xs font-black text-slate-900">THCS</div>
                <div className="text-[10px] text-indigo-700 font-semibold">Khối 6 - 9</div>
              </button>

              {/* THPT */}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleLevelChange("high")}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  gradeLevel === "high"
                    ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {gradeLevel === "high" && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
                <GraduationCap className="w-4 h-4 text-blue-600 mb-1" />
                <div className="text-xs font-black text-slate-900">THPT</div>
                <div className="text-[10px] text-blue-700 font-semibold">Khối 10 - 12</div>
              </button>

              {/* Robotics / STEM */}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleLevelChange("robotics")}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  gradeLevel === "robotics"
                    ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {gradeLevel === "robotics" && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
                <Cpu className="w-4 h-4 text-purple-600 mb-1" />
                <div className="text-xs font-black text-slate-900">Robotics & CLB</div>
                <div className="text-[10px] text-purple-700 font-semibold">Mọi cấp học</div>
              </button>
            </div>
          </div>

          {/* 2. Chọn Khối lớp (độc lập với tên lớp) */}
          {gradeLevel !== "robotics" && (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                2. Khối học:
              </label>
              <div className="flex flex-wrap gap-2">
                {(gradeLevel === "elementary"
                  ? [1, 2, 3, 4, 5]
                  : gradeLevel === "middle"
                  ? [6, 7, 8, 9]
                  : [10, 11, 12]
                ).map((g) => (
                  <button
                    key={g}
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleGradeNumberSelect(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      gradeNumber === g
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    Khối {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Tên lớp học do giáo viên tự quyết định */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                3. Tên lớp học: <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {className.length}/80 ký tự
              </span>
            </div>
            <input
              type="text"
              required
              disabled={isSaving}
              value={className}
              maxLength={80}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="VD: 10A3 hoặc Tin học chiều thứ Ba"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Tự do đặt tên có dấu, khoảng trắng, dấu gạch ngang (VD: “10A3”, “Tin học chiều thứ Ba - Nhóm A”).
            </p>
          </div>

          {/* 4. Giáo viên phụ trách & Sĩ số dự kiến */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Giáo viên phụ trách: <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                disabled={isSaving}
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="VD: Thầy Nguyễn Minh Nhật"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Sĩ số dự kiến (tùy chọn):</span>
              </label>
              <input
                type="number"
                min="1"
                max="200"
                disabled={isSaving}
                value={expectedStudentCount}
                onChange={(e) => setExpectedStudentCount(e.target.value)}
                placeholder="VD: 35 (sĩ số thực tế tính theo tài khoản tạo)"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* 5. Năm học & Phòng học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Năm học:</span>
              </label>
              <input
                type="text"
                disabled={isSaving}
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="2025 - 2026"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Phòng học / Phòng Lab:</span>
              </label>
              <input
                type="text"
                disabled={isSaving}
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="VD: Phòng Lab Tin học 1"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* 6. Mô tả mục tiêu lớp học */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Mô tả nội dung / Mục tiêu lớp học:
            </label>
            <textarea
              rows={2}
              disabled={isSaving}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Chương trình Lập trình Python lớp 10, cấu trúc dữ liệu và giải thuật..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed text-slate-800"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu lớp học...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Lưu Lớp Học</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
