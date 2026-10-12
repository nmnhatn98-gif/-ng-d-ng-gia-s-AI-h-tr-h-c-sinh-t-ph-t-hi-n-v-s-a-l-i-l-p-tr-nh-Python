import React, { useState } from "react";
import { Lesson, Submission, UserProfile } from "../types";
import { Leaderboard } from "./Leaderboard";
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  ArrowLeft, 
  FileText, 
  Trophy,
  ChevronRight,
  RotateCcw
} from "lucide-react";

interface StudentResultsViewProps {
  submissions: Submission[];
  lessons: Lesson[];
  currentUser: UserProfile;
  onSelectLesson: (lesson: Lesson) => void;
  onBackToLessons: () => void;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({
  submissions,
  lessons,
  currentUser,
  onSelectLesson,
  onBackToLessons,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"results" | "leaderboard">("results");

  // Filter submissions belonging to this student
  const mySubmissions = submissions.filter((s) => {
    if (s.studentId === currentUser.uid) return true;
    if (currentUser.email && s.studentEmail && s.studentEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (currentUser.displayName && s.studentName && s.studentName.toLowerCase() === currentUser.displayName.toLowerCase()) return true;
    if (currentUser.studentCode && s.studentId === currentUser.studentCode) return true;
    return false;
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const gradedCount = mySubmissions.filter((s) => s.status === "graded").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            type="button"
            onClick={onBackToLessons}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Việc học của em</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kết quả học tập
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Theo dõi điểm số, nhận xét của thầy cô và bảng vinh danh
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("results")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeSubTab === "results"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bài đã nộp ({mySubmissions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("leaderboard")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeSubTab === "leaderboard"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Bảng thành tích</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === "results" ? (
        <div>
          {mySubmissions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900">
                Em chưa có bài nộp nào
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 mb-5">
                Khi em hoàn thành và gửi bài tập, bài làm và kết quả đánh giá của thầy cô sẽ xuất hiện tại đây.
              </p>
              <button
                type="button"
                onClick={onBackToLessons}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors min-h-[40px] cursor-pointer"
              >
                Về trang Việc học của em
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Tổng cộng {mySubmissions.length} bài nộp ({gradedCount} bài đã chấm)</span>
                <span>Sắp xếp: Mới nhất trước</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {mySubmissions.map((sub) => {
                  const relatedLesson = lessons.find((l) => l.id === sub.lessonId);
                  const isGraded = sub.status === "graded";
                  const formattedDate = new Date(sub.submittedAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={sub.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="capitalize">
                            {sub.moduleType === "coding"
                              ? "Lập trình Python"
                              : sub.moduleType === "quiz"
                              ? "Trắc nghiệm"
                              : sub.moduleType === "html"
                              ? "Web HTML"
                              : "Thực hành"}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Nộp lúc {formattedDate}</span>
                          <span aria-hidden="true">·</span>
                          {isGraded ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã chấm điểm</span>
                            </span>
                          ) : (
                            <span className="text-blue-700 font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              <span>Chờ đánh giá</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-semibold text-slate-900">
                          {sub.lessonTitle || "Bài tập"}
                        </h3>

                        {/* Score and Teacher Feedback */}
                        {isGraded ? (
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                Điểm: {sub.score} / {sub.maxScore || 10} đ
                              </span>
                            </div>

                            {sub.teacherFeedback && (
                              <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                                <div className="font-semibold text-slate-800 mb-0.5 flex items-center gap-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Lời phê của giáo viên:</span>
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap">{sub.teacherFeedback}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic">
                            Bài làm đã được lưu an toàn trên hệ thống. Điểm và nhận xét sẽ hiển thị ngay khi giáo viên chấm bài xong.
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="sm:self-center shrink-0">
                        {relatedLesson ? (
                          <button
                            type="button"
                            onClick={() => onSelectLesson(relatedLesson)}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium transition-colors flex items-center justify-center gap-2 min-h-[40px] cursor-pointer"
                          >
                            <span>{isGraded ? "Xem nhận xét & bài làm" : "Xem bài nộp"}</span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Bài tập gốc đã lưu</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Embedded Leaderboard */}
          <Leaderboard submissions={submissions} currentUser={currentUser} />
        </div>
      )}
    </div>
  );
};
