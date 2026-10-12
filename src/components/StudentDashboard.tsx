import React, { useState } from "react";
import { Lesson, Submission, UserProfile, GradeLevel } from "../types";
import { 
  Sparkles, 
  Code2, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  FileCode, 
  Check, 
  School,
  Lightbulb,
  CheckSquare,
  Tag,
  Compass
} from "lucide-react";
import { 
  extractGradeNumber, 
  getCurriculumTopicsForGrade, 
  getGradeCategory,
  GRADE_CURRICULUM_TOPICS
} from "../data/curriculumData";

interface StudentDashboardProps {
  lessons: Lesson[];
  submissions: Submission[];
  currentUser: UserProfile;
  selectedLevel: GradeLevel | "all";
  onSelectLesson: (lesson: Lesson) => void;
  onOpenHtmlLab?: () => void;
  onOpenPythonLab?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  lessons,
  submissions,
  currentUser,
  selectedLevel,
  onSelectLesson,
  onOpenHtmlLab,
  onOpenPythonLab,
}) => {
  // Trích xuất số khối của học sinh (1 - 12) từ classGrade (VD: "Lớp 7A1" -> 7, "Khối 10" -> 10)
  const studentRegisteredGrade = extractGradeNumber(currentUser.classGrade, currentUser.gradeLevel);

  // Tab khối lớp đang được xem (mặc định chọn đúng khối của học sinh)
  const [selectedGradeTab, setSelectedGradeTab] = useState<number>(studentRegisteredGrade);

  // Lấy đúng 1 - 2 nội dung chuẩn chương trình Tin học GDPT 2018 cho khối đang chọn
  const activeCurriculumTopics = getCurriculumTopicsForGrade(selectedGradeTab);
  const activeGradeCategory = getGradeCategory(selectedGradeTab);

  // Lọc bài tập do Giáo viên tạo thủ công cho học sinh (loại bỏ hoàn toàn các bài tập mẫu mặc định)
  const teacherAssignedLessons = lessons.filter((l) => 
    !l.id.startsWith("les-elem-") && 
    !l.id.startsWith("les-prog-") && 
    !l.id.startsWith("les-py10-") && 
    !l.id.startsWith("les-cpp-") && 
    !l.id.startsWith("les-stem-") && 
    !l.id.startsWith("les-web-")
  );

  // Bài nộp của học sinh
  const mySubmissions = submissions.filter((s) => s.studentId === currentUser.uid);
  const gradedSubs = mySubmissions.filter((s) => s.status === "graded" && typeof s.score === "number");
  const completedCount = gradedSubs.length;
  const totalScore = gradedSubs.reduce((sum, s) => sum + (s.score as number), 0);

  // Nhóm các khối lớp theo 3 cấp học
  const elementaryGrades = [1, 2, 3, 4, 5];
  const middleGrades = [6, 7, 8, 9];
  const highGrades = [10, 11, 12];

  // Helper theme cho khối lớp
  const getGradeTheme = (gradeNum: number) => {
    if (gradeNum <= 5) {
      return {
        badgeBg: "bg-amber-500/20 text-amber-200 border-amber-400/30",
        gradient: "from-amber-600 via-orange-600 to-rose-600",
        levelName: "Cấp Tiểu học",
        icon: Sparkles,
      };
    }
    if (gradeNum <= 9) {
      return {
        badgeBg: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
        gradient: "from-indigo-700 via-blue-700 to-violet-800",
        levelName: "Cấp THCS",
        icon: Code2,
      };
    }
    return {
      badgeBg: "bg-blue-500/20 text-blue-200 border-blue-400/30",
      gradient: "from-blue-700 via-indigo-700 to-slate-800",
      levelName: "Cấp THPT",
      icon: GraduationCap,
    };
  };

  const currentTheme = getGradeTheme(studentRegisteredGrade);
  const ThemeIcon = currentTheme.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Student Welcome & Grade-Tailored Hero Banner */}
      <div className={`bg-gradient-to-r ${currentTheme.gradient} rounded-3xl text-white p-6 sm:p-8 shadow-md shadow-blue-500/10 mb-8 relative overflow-hidden`}>
        <div className="relative z-10 max-w-3xl">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 border backdrop-blur-xs ${currentTheme.badgeBg}`}>
            <ThemeIcon className="w-3.5 h-3.5" />
            <span>{currentTheme.levelName}</span>
            <span className="opacity-40">•</span>
            <span className="font-extrabold">Khối {studentRegisteredGrade}</span>
            {currentUser.classGrade && (
              <>
                <span className="opacity-40">•</span>
                <span>{currentUser.classGrade}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Chào mừng {currentUser.displayName}!
          </h1>

          <p className="text-sm font-semibold text-white/90 mt-1">
            Không Gian Tin Học & Lập Trình Python
          </p>

          <p className="text-xs sm:text-sm text-white/80 mt-2 leading-relaxed max-w-2xl">
            Tài khoản của bạn được thiết lập theo chuyên đề môn Tin học. Hệ thống gợi ý từ 1 đến 2 chuyên đề trọng tâm nhất của khối lớp, cùng phòng thực hành Python có gia sư AI hỗ trợ tự phát hiện và sửa lỗi.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/20">
            <div>
              <div className="text-xs text-white/70">Khối lớp hiện tại</div>
              <div className="text-xl sm:text-2xl font-black">Khối {studentRegisteredGrade}</div>
            </div>
            <div>
              <div className="text-xs text-white/70">Chuyên đề trọng tâm</div>
              <div className="text-xl sm:text-2xl font-black">2 Nội dung / Khối</div>
            </div>
            <div>
              <div className="text-xs text-white/70">Phòng thực hành</div>
              <div className="text-xl sm:text-2xl font-black text-amber-300">Python & HTML</div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-white/80">Lối tắt vào thẳng phòng code:</span>
            {onOpenPythonLab && (
              <button
                type="button"
                onClick={onOpenPythonLab}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-100 border border-emerald-400/40 transition-all shadow-xs backdrop-blur-xs"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>🐍 Khu Lập Trình Python Tự Do →</span>
              </button>
            )}
            {onOpenHtmlLab && (
              <button
                type="button"
                onClick={onOpenHtmlLab}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-orange-500/25 hover:bg-orange-500/40 text-orange-100 border border-orange-400/40 transition-all shadow-xs backdrop-blur-xs"
              >
                <FileCode className="w-3.5 h-3.5 text-orange-300" />
                <span>🌐 Khu Viết Mã HTML & Web Studio →</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background icon */}
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none hidden md:block">
          <ThemeIcon className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* 2. DEDICATED DIRECT-ACCESS CODING STUDIOS (KHÔNG CẦN VÀO BÀI TẬP) */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Phòng Thực Hành Tự Do • Không Cần Đề Bài</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Khu Vực Lập Trình Python & Viết Mã Nguồn HTML
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Học sinh có thể vào trực tiếp để tự do gõ code, chạy thử nghiệm, thiết kế web và nhận hỗ trợ từ Gia sư AI bất cứ lúc nào mà không cần phải vào phần bài tập.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Python Studio */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Code2 className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                  Python 3.10 Sandbox
                </span>
              </div>

              <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                Khu Lập Trình Python (Python Studio)
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Không gian thực hành Python tự do: Viết code, chạy thử nghiệm với input/output Stdin, thử nghiệm giải thuật Tin học GDPT 2018 và trò chuyện cùng Gia sư AI.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Chạy code trực tiếp ~50ms
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Hỗ trợ Stdin tự do
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> 9 mẫu code GDPT 2018
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Gia sư AI sửa lỗi tức thì
                </div>
              </div>
            </div>

            <div className="mt-6 pt-2 relative z-10">
              <button
                type="button"
                onClick={onOpenPythonLab}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <span>Vào Lập Trình Python Ngay</span>
                <span className="text-sm">→</span>
              </button>
            </div>

            <div className="absolute -bottom-6 -right-6 text-emerald-500/5 pointer-events-none group-hover:text-emerald-500/10 transition-colors">
              <Code2 className="w-44 h-44" />
            </div>
          </div>

          {/* Card 2: HTML / Web Studio */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-orange-500/50 transition-all">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                  <FileCode className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-950/80 text-orange-300 border border-orange-700/60">
                  Khung HTML5 Chuẩn Trống
                </span>
              </div>

              <h3 className="text-lg font-black text-white group-hover:text-orange-300 transition-colors">
                Khu Viết Mã Nguồn HTML (Web Studio)
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Mặc định là khung chuẩn HTML5 rỗng. Tự do thiết kế cấu trúc web, phối màu CSS3, thêm tương tác JavaScript và xem trước trực tiếp trang web chạy thật trên màn hình PC hoặc Mobile.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-400">✓</span> Mặc định HTML5 rỗng chuẩn
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-400">✓</span> Xem trước Live Preview
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-400">✓</span> Thao tác HTML, CSS, JS tách biệt
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-orange-400">✓</span> Tải file hoàn chỉnh về máy
                </div>
              </div>
            </div>

            <div className="mt-6 pt-2 relative z-10">
              <button
                type="button"
                onClick={onOpenHtmlLab}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-orange-600 hover:bg-orange-500 active:scale-[0.99] text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 cursor-pointer"
              >
                <span>Vào Viết Mã Nguồn HTML Ngay</span>
                <span className="text-sm">→</span>
              </button>
            </div>

            <div className="absolute -bottom-6 -right-6 text-orange-500/5 pointer-events-none group-hover:text-orange-500/10 transition-colors">
              <FileCode className="w-44 h-44" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. GỢI Ý CHƯƠNG TRÌNH TIN HỌC THEO CÁC KHỐI TỪ 1 - 2 NỘI DUNG (CHUẨN GDPT 2018) */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200 uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chương Trình Tin Học GDPT 2018 • Đúng 1 - 2 Nội Dung Mỗi Khối</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Gợi Ý Nội Dung Trọng Tâm: Khối {selectedGradeTab} ({activeGradeCategory.name})</span>
              {selectedGradeTab === studentRegisteredGrade && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Khối của bạn
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống đã lọc bỏ toàn bộ các bài mẫu không cần thiết, chỉ gợi ý đúng 1 đến 2 chuyên đề cốt lõi theo khung chuẩn chương trình của Bộ Giáo dục & Đào tạo.
            </p>
          </div>

          {/* Nút reset về khối của mình nhanh */}
          {selectedGradeTab !== studentRegisteredGrade && (
            <button
              type="button"
              onClick={() => setSelectedGradeTab(studentRegisteredGrade)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-all self-start md:self-auto cursor-pointer"
            >
              <span>Quay lại Khối {studentRegisteredGrade} của bạn</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* BỘ CHUYỂN ĐỔI KHỐI LỚP (TỪ KHỐI 1 ĐẾN KHỐI 12 THEO 3 CẤP) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6">
          <div className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Chọn khối lớp để xem gợi ý nội dung (Khối 1 - 12):</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Nhóm Tiểu học: Khối 1 - 5 */}
            <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-black text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span>🎒 Cấp Tiểu học (Lớp 1 - 5)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {elementaryGrades.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGradeTab(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedGradeTab === g
                        ? "bg-amber-600 text-white shadow-sm scale-105"
                        : g === studentRegisteredGrade
                        ? "bg-amber-100 text-amber-900 border border-amber-300 font-black hover:bg-amber-200"
                        : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                    }`}
                  >
                    <span>Khối {g}</span>
                    {g === studentRegisteredGrade && <span className="text-[10px]">★</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Nhóm THCS: Khối 6 - 9 */}
            <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-black text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span>💻 Cấp THCS (Lớp 6 - 9)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {middleGrades.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGradeTab(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedGradeTab === g
                        ? "bg-indigo-600 text-white shadow-sm scale-105"
                        : g === studentRegisteredGrade
                        ? "bg-indigo-100 text-indigo-900 border border-indigo-300 font-black hover:bg-indigo-200"
                        : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                    }`}
                  >
                    <span>Khối {g}</span>
                    {g === studentRegisteredGrade && <span className="text-[10px]">★</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Nhóm THPT: Khối 10 - 12 */}
            <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
              <div className="text-[11px] font-black text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span>🎓 Cấp THPT (Lớp 10 - 12)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {highGrades.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGradeTab(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedGradeTab === g
                        ? "bg-blue-600 text-white shadow-sm scale-105"
                        : g === studentRegisteredGrade
                        ? "bg-blue-100 text-blue-900 border border-blue-300 font-black hover:bg-blue-200"
                        : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                    }`}
                  >
                    <span>Khối {g}</span>
                    {g === studentRegisteredGrade && <span className="text-[10px]">★</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DANH SÁCH ĐÚNG 1 - 2 NỘI DUNG GỢI Ý CỦA KHỐI ĐƯỢC CHỌN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeCurriculumTopics.map((topic) => {
            const isPythonTopic = topic.recommendedLab === "python";
            const isHtmlTopic = topic.recommendedLab === "html";
            const isScratchTopic = topic.recommendedLab === "scratch";

            return (
              <div
                key={topic.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-blue-400 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        Chuyên đề {topic.orderIndex} • Khối {topic.gradeNumber}
                      </span>
                      {topic.orderIndex === 1 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Trọng tâm 1
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          Trọng tâm 2
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      GDPT 2018
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-slate-900 mb-2 leading-snug">
                    {topic.title}
                  </h3>

                  {/* GDPT Curriculum Sub-Code */}
                  <div className="text-xs font-semibold text-indigo-600 bg-indigo-50/70 px-3 py-1.5 rounded-xl border border-indigo-100 mb-3.5">
                    {topic.gdptCode}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {topic.description}
                  </p>

                  {/* Yêu cầu cần đạt chuẩn kiến thức & kỹ năng */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
                    <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Yêu cầu cần đạt chuẩn kiến thức & kỹ năng:</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {topic.outcomes.map((outcome, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Từ khóa trọng tâm */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-5">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                      <Tag className="w-3 h-3" />
                      <span>Từ khóa:</span>
                    </span>
                    {topic.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200 transition-colors"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="pt-4 border-t border-slate-100">
                  {isPythonTopic ? (
                    <button
                      type="button"
                      onClick={onOpenPythonLab}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Code2 className="w-4 h-4" />
                      <span>{topic.labActionText || `Vào Lập Trình Python Khối ${topic.gradeNumber} →`}</span>
                    </button>
                  ) : isHtmlTopic ? (
                    <button
                      type="button"
                      onClick={onOpenHtmlLab}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <FileCode className="w-4 h-4" />
                      <span>{topic.labActionText || `Vào Web Studio HTML Khối ${topic.gradeNumber} →`}</span>
                    </button>
                  ) : isScratchTopic ? (
                    <button
                      type="button"
                      onClick={() => {
                        // If there is an elementary scratch lesson, open it, else open python
                        const scratchLesson = lessons.find(l => l.moduleType === "scratch");
                        if (scratchLesson) {
                          onSelectLesson(scratchLesson);
                        } else if (onOpenPythonLab) {
                          onOpenPythonLab();
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{topic.labActionText || "Mở Không Gian Scratch Sáng Tạo →"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        // Open python lab by default for hands-on practice
                        if (onOpenPythonLab) onOpenPythonLab();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{topic.labActionText || `Thực Hành Chuyên Đề Khối ${topic.gradeNumber} →`}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PHẦN BÀI TẬP ĐƯỢC GIÁO VIÊN GIAO RIÊNG (CHỈ HIỂN THỊ KHI THẦY CÔ CÓ TẠO ĐỀ BÀI MỚI) */}
      {teacherAssignedLessons.length > 0 && (
        <div className="pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nhiệm Vụ Học Tập</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Bài Tập & Đề Thi Thầy/Cô Giao Riêng
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              {teacherAssignedLessons.length} bài được giao
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teacherAssignedLessons.map((lesson) => {
              const submission = mySubmissions.find((s) => s.lessonId === lesson.id);
              const isSubmitted = !!submission;
              const isGraded = submission?.status === "graded";

              return (
                <div
                  key={lesson.id}
                  onClick={() => onSelectLesson(lesson)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {lesson.moduleType.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{lesson.durationMinutes} phút</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors mb-1.5">
                      {lesson.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {lesson.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isGraded ? (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Điểm: {submission.score}/{submission.maxScore}</span>
                      </span>
                    ) : isSubmitted ? (
                      <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Chờ chấm</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Chưa làm</span>
                    )}

                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      <span>{isSubmitted ? "Xem lại" : "Làm bài"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
