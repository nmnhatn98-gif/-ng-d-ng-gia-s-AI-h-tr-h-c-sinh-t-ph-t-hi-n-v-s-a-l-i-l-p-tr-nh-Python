import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  RotateCcw,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Maximize2,
  Minimize2,
  Paperclip,
  Code2,
  List,
  ListOrdered,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ChevronDown
} from "lucide-react";
import { Lesson, GradeLevel, ClassItem, AssignmentAttachment } from "../types";

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAssignment: (assignment: Partial<Lesson>) => Promise<void> | void;
  classes?: ClassItem[];
  initialGrade?: string;
  initialSubject?: string;
}

const GRADE_OPTIONS = [
  { label: "Khối 10", value: "Khối 10", level: "high" as GradeLevel },
  { label: "Khối 11", value: "Khối 11", level: "high" as GradeLevel },
  { label: "Khối 12", value: "Khối 12", level: "high" as GradeLevel },
  { label: "Khối 6", value: "Khối 6", level: "middle" as GradeLevel },
  { label: "Khối 7", value: "Khối 7", level: "middle" as GradeLevel },
  { label: "Khối 8", value: "Khối 8", level: "middle" as GradeLevel },
  { label: "Khối 9", value: "Khối 9", level: "middle" as GradeLevel },
  { label: "Khối 3", value: "Khối 3", level: "elementary" as GradeLevel },
  { label: "Khối 4", value: "Khối 4", level: "elementary" as GradeLevel },
  { label: "Khối 5", value: "Khối 5", level: "elementary" as GradeLevel },
  { label: "Khối Chuyên / Đội tuyển Tin", value: "Khối Chuyên", level: "high" as GradeLevel },
];

const SUBJECT_OPTIONS = [
  "Tin học",
  "Lập trình & Thuật toán",
  "STEM & Robotics",
  "Thiết kế Web & Đồ họa",
  "Khoa học Tự nhiên",
  "Công nghệ & Kỹ thuật",
];

const PURPOSE_OPTIONS = [
  "Giao bài tập về nhà",
  "Bài thực hành phòng máy / Lab",
  "Kiểm tra 15 phút / Đánh giá thường xuyên",
  "Kiểm tra giữa kỳ / Cuối kỳ",
  "Dự án STEM / Chuyên đề học tập",
  "Bồi dưỡng học sinh giỏi",
  "Ôn tập & Củng cố kiến thức",
];

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSaveAssignment,
  classes = [],
  initialGrade = "Khối 10",
  initialSubject = "Tin học",
}) => {
  // Form State
  const [title, setTitle] = useState("");
  const [gradeName, setGradeName] = useState(initialGrade);
  const [subject, setSubject] = useState(initialSubject);
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([]);

  // Advanced & Pedagogical settings
  const [submissionType, setSubmissionType] = useState<"file_upload" | "code_editor" | "online_text">("file_upload");
  const [maxScore, setMaxScore] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [allowReviewAfterDue, setAllowReviewAfterDue] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Editor Toolbar State
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textColor, setTextColor] = useState("#1e293b");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Validation State
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Validation checks
  const isTitleValid = title.trim().length > 0;
  const isPurposeValid = purpose.trim().length > 0 && purpose !== "---Chọn mục đích---";

  // Handle date reset
  const handleResetDates = () => {
    setStartDate("");
    setDueDate("");
  };

  // Handle Class toggle
  const toggleClass = (className: string) => {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  };

  const handleSelectAllClasses = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(classes.map((c) => c.name));
    }
  };

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: AssignmentAttachment[] = Array.from(files).map((file) => {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      const sizeStr = Number(sizeInMB) < 0.1 ? `${(file.size / 1024).toFixed(0)} KB` : `${sizeInMB} MB`;
      return {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: sizeStr,
        type: file.type || file.name.split(".").pop() || "file",
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Text formatting helpers for the editor
  const applyFormat = (prefix: string, suffix: string = "") => {
    setContent((prev) => {
      if (!prev) return `${prefix}Nội dung${suffix}`;
      return `${prev}\n${prefix}Yêu cầu mới${suffix}`;
    });
  };

  const handleInsertCodeBlock = () => {
    setContent((prev) => `${prev}\n\`\`\`python\n# Nhập mã nguồn ví dụ hoặc starter code tại đây\ndef giai_bai_tap():\n    pass\n\`\`\`\n`);
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!isTitleValid || !isPurposeValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const matchedGrade = GRADE_OPTIONS.find((g) => g.value === gradeName);
      const gradeLevel: GradeLevel = matchedGrade?.level || "high";

      // Map moduleType
      let moduleType: "scratch" | "quiz" | "coding" | "robotics" | "html" = "coding";
      if (submissionType === "code_editor") {
        moduleType = "coding";
      } else if (purpose.includes("Trắc nghiệm") || purpose.includes("Kiểm tra")) {
        moduleType = "coding";
      }

      await onSaveAssignment({
        title: title.trim(),
        description: content.trim() || `Bài tập môn ${subject} - ${gradeName}: ${title.trim()}`,
        level: gradeLevel,
        moduleType,
        gradeName,
        subject,
        purpose,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        targetClasses: selectedClasses.length > 0 ? selectedClasses : undefined,
        attachments,
        richContent: content,
        submissionType,
        maxScore,
        durationMinutes,
        allowReviewAfterDue,
      });

      onClose();
    } catch (err) {
      console.error("Failed to save assignment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fade-in overflow-y-auto">
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200 w-full transition-all my-auto ${
          isFullscreen ? "fixed inset-3 max-w-none max-h-none rounded-2xl" : "max-w-3xl max-h-[92vh]"
        } flex flex-col`}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                TẠO BÀI TẬP MỚI
              </h2>
              <p className="text-[11px] text-slate-500">Soạn thảo đề bài, thiết lập thời hạn nộp và phân công lớp học</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors font-bold text-base"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {/* 1. TÊN BÀI TẬP */}
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1.5">
              Tên bài tập <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Nhập tên ..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                touched && !isTitleValid
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-100 bg-white"
              }`}
            />
            {touched && !isTitleValid && (
              <div className="text-rose-500 text-[11px] font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Vui lòng nhập tên bài tập</span>
              </div>
            )}
          </div>

          {/* 2. KHỐI HỌC & MÔN HỌC (2 COLUMNS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1.5">
                Khối học
              </label>
              <div className="relative">
                <select
                  value={gradeName}
                  onChange={(e) => setGradeName(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1.5">
                Môn học
              </label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                >
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 3. MỤC ĐÍCH TẠO BÀI TẬP */}
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1.5">
              Mục đích tạo bài tập <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                onBlur={() => setTouched(true)}
                className={`w-full appearance-none px-3.5 py-2.5 rounded-xl border text-xs font-medium pr-10 transition-all focus:outline-none focus:ring-2 ${
                  touched && !isPurposeValid
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20 text-slate-700"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-100 bg-white text-slate-800"
                }`}
              >
                <option value="">---Chọn mục đích---</option>
                {PURPOSE_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {touched && !isPurposeValid && (
              <div className="text-rose-500 text-[11px] font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Vui lòng chọn mục đích tạo đề</span>
              </div>
            )}
          </div>

          {/* 4. PHÂN CÔNG LỚP HỌC (NẾU CÓ LỚP) */}
          {classes.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span>Phân công cho lớp học:</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({selectedClasses.length}/{classes.length} lớp đã chọn)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllClasses}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                >
                  {selectedClasses.length === classes.length ? "Bỏ chọn tất cả" : "Chọn tất cả lớp"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {classes.map((cls) => {
                  const isSelected = selectedClasses.includes(cls.name);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClass(cls.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{cls.name}</span>
                      <span className="text-[10px] opacity-75">({cls.studentCount} HS)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. THỜI GIAN NỘP BÀI */}
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1.5">
              Thời gian nộp bài
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-center">
              {/* TỪ */}
              <div className="relative flex items-center">
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              {/* ĐẾN */}
              <div className="relative flex items-center">
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              {/* ĐẶT LẠI */}
              <button
                type="button"
                onClick={handleResetDates}
                className="px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                title="Xóa thời gian bắt đầu và kết thúc"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Đặt lại</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Bỏ trống nếu không muốn giới hạn thời gian.
            </p>
          </div>

          {/* 6. NỘI DUNG BÀI TẬP & TẢI FILE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 text-xs">
                Nội dung
              </label>
              <div className="text-[11px] text-slate-400">
                Hỗ trợ tải tệp đề bài & định dạng trực quan
              </div>
            </div>

            {/* + THÊM FILE BÀI TẬP BUTTON */}
            <div className="mb-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.py,.cpp,.sb3,.zip,.mp3,.mp4"
                onChange={handleFileUpload}
                className="hidden"
                id="assignment-file-input"
              />
              <label
                htmlFor="assignment-file-input"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-bold text-xs rounded-xl cursor-pointer transition-all border border-indigo-200 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ Thêm file bài tập</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-1">
                Chụp ảnh bài tập hoặc chọn file ảnh, pdf, word, excel, audio và video, file code (Python, Scratch, C++)...
              </p>
            </div>

            {/* DANH SÁCH FILE ĐÃ ĐÍNH KÈM */}
            {attachments.length > 0 && (
              <div className="space-y-1.5 mb-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Tệp đính kèm ({attachments.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span className="truncate max-w-[180px]">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({file.size})</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors ml-1"
                        title="Xóa tệp này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RICH TEXT EDITOR CONTAINER */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500">
              {/* TOOLBAR */}
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1 text-slate-700">
                {/* Bold */}
                <button
                  type="button"
                  onClick={() => setIsBold(!isBold)}
                  className={`p-1.5 rounded-lg transition-colors font-bold ${
                    isBold ? "bg-blue-100 text-blue-700" : "hover:bg-slate-200 text-slate-700"
                  }`}
                  title="In đậm (Bold)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onClick={() => setIsItalic(!isItalic)}
                  className={`p-1.5 rounded-lg transition-colors font-bold ${
                    isItalic ? "bg-blue-100 text-blue-700" : "hover:bg-slate-200 text-slate-700"
                  }`}
                  title="In nghiêng (Italic)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>

                {/* Underline */}
                <button
                  type="button"
                  onClick={() => setIsUnderline(!isUnderline)}
                  className={`p-1.5 rounded-lg transition-colors font-bold ${
                    isUnderline ? "bg-blue-100 text-blue-700" : "hover:bg-slate-200 text-slate-700"
                  }`}
                  title="Gạch chân (Underline)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-slate-300 mx-1" />

                {/* Alignment */}
                <button
                  type="button"
                  onClick={() => setTextAlign("left")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    textAlign === "left" ? "bg-blue-100 text-blue-700" : "hover:bg-slate-200 text-slate-700"
                  }`}
                  title="Căn trái"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTextAlign("center")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    textAlign === "center" ? "bg-blue-100 text-blue-700" : "hover:bg-slate-200 text-slate-700"
                  }`}
                  title="Căn giữa"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTextAlign("right")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    textAlign === "right" ? "bg-blue-100 text-blue-700" : "hover:bg-slate-200 text-slate-700"
                  }`}
                  title="Căn phải"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTextAlign("justify")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    textAlign === "justify" ? "bg-blue-100 text-blue-700" : "hover:bg-slate-200 text-slate-700"
                  }`}
                  title="Căn đều"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-slate-300 mx-1" />

                {/* Lists & Code */}
                <button
                  type="button"
                  onClick={() => applyFormat("• ")}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Danh sách dấu chấm"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat("1. ")}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Danh sách số thứ tự"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleInsertCodeBlock}
                  className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-700 transition-colors font-bold flex items-center gap-1"
                  title="Chèn khối mã nguồn lập trình"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono">Code</span>
                </button>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                    title={isFullscreen ? "Thu nhỏ" : "Phóng to khung soạn thảo"}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* EDITOR TEXTAREA */}
              <textarea
                rows={isFullscreen ? 16 : 7}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung đề bài, câu hỏi thực hành, tiêu chí chấm hoặc dán hướng dẫn chi tiết tại đây..."
                style={{
                  textAlign,
                  fontWeight: isBold ? "bold" : "normal",
                  fontStyle: isItalic ? "italic" : "normal",
                  textDecoration: isUnderline ? "underline" : "none",
                }}
                className="w-full p-4 text-xs font-normal text-slate-800 bg-white resize-y focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* 7. TÙY CHỌN BỔ SUNG CHO MÔN TIN HỌC & GDPT 2018 (COLLAPSIBLE) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-bold text-xs text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Cấu hình hình thức nộp & Thang điểm đánh giá</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            </button>

            {showAdvanced && (
              <div className="p-4 space-y-4 border-t border-slate-100 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1">
                      Hình thức học sinh nộp bài:
                    </label>
                    <select
                      value={submissionType}
                      onChange={(e) => setSubmissionType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="file_upload">Tải file lên (Ảnh/Word/PDF/Zip)</option>
                      <option value="code_editor">Lập trình Online (Python / C++ / Web)</option>
                      <option value="online_text">Soạn thảo văn bản trực tiếp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1">
                      Thang điểm tối đa:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={maxScore}
                      onChange={(e) => setMaxScore(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1">
                      Thời lượng ước tính (phút):
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 pt-1">
                  <input
                    type="checkbox"
                    checked={allowReviewAfterDue}
                    onChange={(e) => setAllowReviewAfterDue(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300"
                  />
                  <span>Cho phép học sinh xem đáp án và nhận xét chi tiết sau khi nộp bài hoặc hết hạn</span>
                </label>
              </div>
            )}
          </div>

          {/* MODAL ACTIONS */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu bài tập</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
