import React, { useState } from "react";
import { Lesson, Submission, UserProfile, RubricCriteria } from "../types";
import { 
  Cpu, 
  Video, 
  FileCode, 
  Send, 
  Award, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  ExternalLink, 
  MessageSquare,
  Sparkles,
  Upload,
  Layers
} from "lucide-react";

interface RoboticsModuleProps {
  lesson: Lesson;
  currentUser: UserProfile;
  submissions: Submission[];
  onBack: () => void;
  onSubmitWork: (submissionData: Partial<Submission>) => Promise<void>;
  onGradeSubmission: (submissionId: string, rubric: RubricCriteria, score: number, feedback: string) => Promise<void>;
}

export const RoboticsModule: React.FC<RoboticsModuleProps> = ({
  lesson,
  currentUser,
  submissions,
  onBack,
  onSubmitWork,
  onGradeSubmission,
}) => {
  // Student submission form state
  const [videoUrl, setVideoUrl] = useState("");
  const [codeFileName, setCodeFileName] = useState("controller_firmware.ino");
  const [codeFileContent, setCodeFileContent] = useState(`// Mã nguồn điều khiển Robot Arduino/ESP32
#include <Servo.h>

Servo myServo;
const int trigPin = 9;
const int echoPin = 10;

void setup() {
  Serial.begin(9600);
  myServo.attach(11);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
}

void loop() {
  // Thuật toán điều khiển cảm biến và động cơ
  delay(50);
}`);
  const [projectDescription, setProjectDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Teacher grading state
  const [selectedSubForGrading, setSelectedSubForGrading] = useState<Submission | null>(null);
  const [rubricIdea, setRubricIdea] = useState<number>(8);
  const [rubricTechnique, setRubricTechnique] = useState<number>(8);
  const [rubricPresentation, setRubricPresentation] = useState<number>(8);
  const [rubricFeedback, setRubricFeedback] = useState<string>("");
  const [isGrading, setIsGrading] = useState(false);

  // Filter submissions for this lesson
  const lessonSubmissions = submissions.filter((s) => s.lessonId === lesson.id);
  const mySubmission = lessonSubmissions.find((s) => s.studentId === currentUser.uid);

  // YouTube embed helper
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      if (url.includes("youtube.com/watch?v=")) {
        const videoId = url.split("watch?v=")[1].split("&")[0];
        return `https://www.youtube.com/embed/${videoId}`;
      } else if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (e) {}
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCodeFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCodeFileContent((event.target?.result as string) || "");
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;

    setIsSubmitting(true);
    try {
      await onSubmitWork({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        studentId: currentUser.uid,
        studentName: currentUser.displayName,
        studentEmail: currentUser.email,
        moduleType: "robotics",
        content: {
          videoUrl,
          codeFileName,
          codeFileContent,
          projectDescription,
        },
        score: 0,
        maxScore: 30, // 10 Idea + 10 Technique + 10 Presentation
        status: "submitted",
      });
      setSubmittedSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedSubForGrading) return;
    setIsGrading(true);
    const totalScore = rubricIdea + rubricTechnique + rubricPresentation;

    try {
      await onGradeSubmission(
        selectedSubForGrading.id,
        {
          idea: rubricIdea,
          technique: rubricTechnique,
          presentation: rubricPresentation,
          feedback: rubricFeedback,
        },
        totalScore,
        rubricFeedback
      );
      setSelectedSubForGrading(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGrading(false);
    }
  };

  const openGradingModal = (sub: Submission) => {
    setSelectedSubForGrading(sub);
    setRubricIdea(sub.rubric?.idea ?? 8);
    setRubricTechnique(sub.rubric?.technique ?? 8);
    setRubricPresentation(sub.rubric?.presentation ?? 8);
    setRubricFeedback(sub.rubric?.feedback || sub.teacherFeedback || "");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-3xl border border-emerald-700/40 shadow-md mb-6">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-emerald-300 hover:text-white mb-2 flex items-center gap-1 transition-colors"
        >
          ← Quay lại danh sách bài học
        </button>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400 text-slate-950">
            Robotics & STEM Sáng tạo
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-800/60 text-emerald-200 border border-emerald-600/40">
            Chấm theo Thang Rubric 30đ
          </span>
        </div>
        <h1 className="text-2xl font-black mt-2 tracking-tight">
          {lesson.title}
        </h1>
        <p className="text-sm text-emerald-100/80 mt-1 max-w-3xl">
          {lesson.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Student Submission or Video Viewer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission Form (for Student) */}
          {currentUser.role === "student" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-600" />
                <span>Nộp Báo Cáo Sản Phẩm & Mã Điều Khiển</span>
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Cung cấp đường dẫn video chạy thử nghiệm và đính kèm file code vi điều khiển để nhận đánh giá Rubric từ giáo viên.
              </p>

              {mySubmission ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Bạn đã nộp bài thành công!</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-white text-emerald-800 border border-emerald-200">
                      {mySubmission.status === "graded" ? `Điểm: ${mySubmission.score}/30` : "Chờ giáo viên chấm"}
                    </span>
                  </div>

                  {mySubmission.rubric && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white/80 p-2 rounded-xl">
                        <div className="text-slate-500 text-[10px]">1. Ý tưởng</div>
                        <div className="font-bold text-slate-900">{mySubmission.rubric.idea}/10</div>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl">
                        <div className="text-slate-500 text-[10px]">2. Kỹ thuật</div>
                        <div className="font-bold text-slate-900">{mySubmission.rubric.technique}/10</div>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl">
                        <div className="text-slate-500 text-[10px]">3. Trình bày</div>
                        <div className="font-bold text-slate-900">{mySubmission.rubric.presentation}/10</div>
                      </div>
                    </div>
                  )}

                  {mySubmission.teacherFeedback && (
                    <p className="mt-3 text-xs text-emerald-950 italic bg-white/60 p-2.5 rounded-xl">
                      💬 Nhận xét của giáo viên: "{mySubmission.teacherFeedback}"
                    </p>
                  )}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Video Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Link video chạy thử nghiệm thực tế (YouTube / Google Drive / MP4): *
                  </label>
                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  {getYouTubeEmbedUrl(videoUrl) && (
                    <div className="mt-3 rounded-2xl overflow-hidden aspect-video border border-slate-200 shadow-xs">
                      <iframe
                        src={getYouTubeEmbedUrl(videoUrl)!}
                        className="w-full h-full"
                        allowFullScreen
                        title="Video Preview"
                      />
                    </div>
                  )}
                </div>

                {/* Code Upload & Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      2. Mã nguồn điều khiển (.ino, .py, .cpp): *
                    </label>
                    <label className="cursor-pointer text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Tải file lên từ máy tính</span>
                      <input
                        type="file"
                        accept=".ino,.py,.cpp,.c,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1 font-mono">
                    Tên file: <span className="font-semibold text-slate-800">{codeFileName}</span>
                  </div>
                  <textarea
                    rows={8}
                    value={codeFileContent}
                    onChange={(e) => setCodeFileContent(e.target.value)}
                    className="w-full p-3 font-mono text-xs bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Project Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. Mô tả tóm tắt giải pháp & danh sách linh kiện:
                  </label>
                  <textarea
                    rows={3}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Mô tả linh kiện (vi điều khiển, cảm biến, motor driver), nguyên lý hoạt động và điểm sáng tạo..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Đang gửi bài nộp..." : "Nộp bài dự án Robotics"}</span>
                </button>
              </form>
            </div>
          )}

          {/* Submissions List for Review / Grading */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>Danh Sách Sản Phẩm Nộp ({lessonSubmissions.length})</span>
              </h2>
              {currentUser.role === "teacher" && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-800">
                  Chế độ Giáo viên: Có quyền chấm Rubric
                </span>
              )}
            </div>

            <div className="space-y-4">
              {lessonSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all bg-slate-50/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="font-bold text-sm text-slate-900">{sub.studentName}</span>
                      <span className="text-xs text-slate-500 ml-2">({sub.studentEmail})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        sub.status === "graded"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                        {sub.status === "graded" ? `Điểm: ${sub.score}/30` : "Chờ chấm điểm"}
                      </span>

                      {currentUser.role === "teacher" && (
                        <button
                          onClick={() => openGradingModal(sub)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Chấm Rubric</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {sub.content.projectDescription && (
                    <p className="text-xs text-slate-600 mb-3 bg-white p-2.5 rounded-xl border border-slate-200">
                      {sub.content.projectDescription}
                    </p>
                  )}

                  {/* Video & Code preview links */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {sub.content.videoUrl && (
                      <a
                        href={sub.content.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Xem video sản phẩm</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {sub.content.codeFileName && (
                      <span className="inline-flex items-center gap-1 text-slate-700 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        <FileCode className="w-3.5 h-3.5 text-blue-600" />
                        <span>{sub.content.codeFileName}</span>
                      </span>
                    )}
                  </div>

                  {/* Rubric Breakdown details */}
                  {sub.rubric && (
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500 text-[10px] block">1. Ý tưởng</span>
                        <span className="font-bold text-slate-800">{sub.rubric.idea}/10</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500 text-[10px] block">2. Kỹ thuật</span>
                        <span className="font-bold text-slate-800">{sub.rubric.technique}/10</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500 text-[10px] block">3. Trình bày</span>
                        <span className="font-bold text-slate-800">{sub.rubric.presentation}/10</span>
                      </div>
                    </div>
                  )}

                  {sub.teacherFeedback && (
                    <p className="mt-2 text-xs text-slate-700 italic">
                      💬 Nhận xét: {sub.teacherFeedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Rubric Standard Guide & Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-3">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Tiêu Chí Chấm Điểm Rubric (30đ)</span>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              {/* Criteria 1: Idea */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-900 text-sm">1. Ý TƯỞNG (10đ)</span>
                  <span className="font-mono text-amber-700 font-bold">Max: 10</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Tính sáng tạo, độc đáo của bài toán STEM, khả năng ứng dụng thực tế vào đời sống (tránh vật cản, hỗ trợ người khuyết tật, nông nghiệp thông minh).
                </p>
              </div>

              {/* Criteria 2: Technique */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sky-900 text-sm">2. KỸ THUẬT (10đ)</span>
                  <span className="font-mono text-sky-700 font-bold">Max: 10</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Chất lượng mã nguồn điều khiển (.ino/.py), giải thuật xử lý tín hiệu cảm biến mượt mà, kết cấu phần cứng cơ khí chắc chắn và an toàn điện.
                </p>
              </div>

              {/* Criteria 3: Presentation */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-900 text-sm">3. TRÌNH BÀY (10đ)</span>
                  <span className="font-mono text-emerald-700 font-bold">Max: 10</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Chất lượng video minh chứng (rõ nét, thấy rõ robot vận hành), thuyết minh mạch lạc, sơ đồ khối logic rõ ràng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TEACHER RUBRIC GRADING MODAL */}
      {selectedSubForGrading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Chấm Điểm Rubric Cho: {selectedSubForGrading.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Bài: {selectedSubForGrading.lessonTitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubForGrading(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Sliders for the 3 Rubric components */}
            <div className="space-y-5 mb-6">
              {/* 1. Idea */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>1. Tiêu chí Ý Tưởng & Tính Sáng Tạo (0 - 10đ):</span>
                  <span className="text-amber-600 font-mono text-sm">{rubricIdea} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={rubricIdea}
                  onChange={(e) => setRubricIdea(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 2. Technique */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>2. Tiêu chí Kỹ Thuật & Vận Hành (0 - 10đ):</span>
                  <span className="text-sky-600 font-mono text-sm">{rubricTechnique} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={rubricTechnique}
                  onChange={(e) => setRubricTechnique(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* 3. Presentation */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>3. Tiêu chí Trình Bày & Báo Cáo Video (0 - 10đ):</span>
                  <span className="text-emerald-600 font-mono text-sm">{rubricPresentation} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={rubricPresentation}
                  onChange={(e) => setRubricPresentation(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Total Score Badge */}
              <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold">Tổng Điểm Thang Rubric:</span>
                <span className="text-xl font-black text-amber-400">
                  {rubricIdea + rubricTechnique + rubricPresentation} / 30 điểm
                </span>
              </div>

              {/* Teacher Feedback Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhận xét & Lời khuyên của Giáo viên:
                </label>
                <textarea
                  rows={3}
                  value={rubricFeedback}
                  onChange={(e) => setRubricFeedback(e.target.value)}
                  placeholder="Khen ngợi điểm mạnh của sản phẩm và gợi ý hướng cải tiến phần cứng/phần mềm..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedSubForGrading(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveGrade}
                disabled={isGrading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
              >
                {isGrading ? "Đang lưu điểm..." : "Lưu Điểm & Đăng Tải"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
