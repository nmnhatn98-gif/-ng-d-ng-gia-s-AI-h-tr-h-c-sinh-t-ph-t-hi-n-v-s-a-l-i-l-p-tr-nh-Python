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
  Sparkles,
  Calendar,
  MapPin,
  UserCheck,
  Laptop,
} from "lucide-react";
import { ClassItem, GradeLevel, UserProfile } from "../types";

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
  onSaveClass: (newClass: ClassItem) => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveClass,
}) => {
  if (!isOpen) return null;

  const defaultTeacherName = currentUser?.displayName || "Thầy Nguyễn Minh Nhật";

  // Form states
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>("middle");
  const [gradeNumber, setGradeNumber] = useState<number>(7);
  const [classSection, setClassSection] = useState<string>("7A2");
  const [subjectFocus, setSubjectFocus] = useState<string>("Lập trình Python căn bản & Giải thuật");
  const [className, setClassName] = useState<string>("Lớp 7A2 - Lập trình Python căn bản & Giải thuật");
  const [teacherName, setTeacherName] = useState<string>(defaultTeacherName);
  const [studentCount, setStudentCount] = useState<number>(35);
  const [schoolYear, setSchoolYear] = useState<string>("2025 - 2026");
  const [room, setRoom] = useState<string>("Phòng Lab Tin học 1");
  const [description, setDescription] = useState<string>(
    "Chương trình rèn luyện tư duy thuật toán, cấu trúc dữ liệu cơ bản và bài tập thực hành trên Python."
  );
  const [error, setError] = useState<string>("");

  // Helper auto-update class name when section or focus changes
  const handleLevelChange = (lvl: GradeLevel) => {
    setGradeLevel(lvl);
    if (lvl === "elementary") {
      setGradeNumber(4);
      setClassSection("4B");
      setSubjectFocus("Sáng tạo cùng Scratch & Tin học nhí");
      setClassName("Lớp 4B - Sáng tạo cùng Scratch & Tin học nhí");
      setDescription("Khám phá thế giới công nghệ trực quan, vẽ hoạt hình và lập trình game tương tác với Scratch.");
    } else if (lvl === "middle") {
      setGradeNumber(7);
      setClassSection("7A2");
      setSubjectFocus("Lập trình Python căn bản & Giải thuật");
      setClassName("Lớp 7A2 - Lập trình Python căn bản & Giải thuật");
      setDescription("Làm quen cú pháp Python, cấu trúc điều kiện, vòng lặp và tư duy giải quyết vấn đề toán tin.");
    } else if (lvl === "high") {
      setGradeNumber(10);
      setClassSection("10A2");
      setSubjectFocus("Lập trình Python (Tin học 10 GDPT 2018)");
      setClassName("Lớp 10A2 - Lập trình Python (Tin học 10 GDPT 2018)");
      setDescription("Chương trình Tin học 10 chuẩn GDPT 2018: Biến, hàm, kiểu dữ liệu, danh sách và các thuật toán tìm kiếm, sắp xếp.");
    } else {
      setGradeNumber(0);
      setClassSection("CLB-STEM-02");
      setSubjectFocus("Robotics, IoT & Sáng tạo Kỹ thuật");
      setClassName("CLB Robotics 02 - Sáng tạo Kỹ thuật & IoT");
      setDescription("Chế tạo mô hình xe tự hành, cánh tay robot, kết nối cảm biến IoT và lập trình nhúng vi điều khiển.");
    }
  };

  const handleGradeNumberSelect = (g: number) => {
    setGradeNumber(g);
    const newSection = `${g}A1`;
    setClassSection(newSection);
    setClassName(`Lớp ${newSection} - ${subjectFocus}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!className.trim()) {
      setError("Vui lòng nhập tên lớp học.");
      return;
    }

    if (!teacherName.trim()) {
      setError("Vui lòng nhập họ tên giáo viên phụ trách.");
      return;
    }

    if (studentCount <= 0) {
      setError("Sĩ số học sinh phải lớn hơn 0.");
      return;
    }

    const uniqueId = `cls-${gradeLevel}-${Date.now().toString(36)}`;
    const newClass: ClassItem = {
      id: uniqueId,
      name: className.trim(),
      gradeLevel,
      gradeNumber: gradeNumber > 0 ? gradeNumber : undefined,
      studentCount: Number(studentCount) || 35,
      teacherName: teacherName.trim(),
      description: description.trim() || `Lớp ${className} do ${teacherName} phụ trách.`,
      schoolYear: schoolYear.trim(),
      room: room.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveClass(newClass);
    onClose();
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
                Thiết lập thông tin lớp học, phân loại cấp học và phân công giáo viên quản trị.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Chọn Cấp học */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              1. Cấp học & Phân hệ: <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Tiểu học */}
              <button
                type="button"
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

          {/* 2. Chọn Khối lớp (nếu có) */}
          {gradeLevel !== "robotics" && (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                2. Chọn khối lớp cụ thể:
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

          {/* 3. Tên lớp học */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              3. Tên lớp học & Chủ đề: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="VD: Lớp 7A2 - Lập trình Python căn bản"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
            />
          </div>

          {/* 4. Giáo viên phụ trách & Sĩ số */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Giáo viên phụ trách: <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="VD: Thầy Nguyễn Minh Nhật"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Sĩ số dự kiến (Học sinh): <span className="text-red-500">*</span></span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={studentCount}
                onChange={(e) => setStudentCount(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
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
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="2025 - 2026"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Phòng học / Phòng Lab:</span>
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Phòng Lab Tin học 1"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 6. Mô tả mục tiêu lớp học */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Mô tả nội dung / Mục tiêu đào tạo:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập tóm tắt định hướng chương trình, yêu cầu đạt được..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Lớp Học Ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
