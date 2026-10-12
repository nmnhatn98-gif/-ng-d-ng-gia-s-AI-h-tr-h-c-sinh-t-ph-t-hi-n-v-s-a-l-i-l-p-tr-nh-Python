import React from "react";
import { Submission, UserProfile } from "../types";
import { Trophy, Medal, Award, Flame, Star, Code2, Cpu } from "lucide-react";

interface LeaderboardProps {
  submissions: Submission[];
  currentUser: UserProfile;
}

interface RankedStudent {
  studentId: string;
  name: string;
  email: string;
  totalScore: number;
  completedLessons: number;
  badges: string[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ submissions, currentUser }) => {
  // Aggregate submissions by student dynamically
  const studentMap: Record<string, RankedStudent> = {};

  // Aggregate graded submissions
  submissions.forEach((sub) => {
    if (!sub.studentId) return;
    if (!studentMap[sub.studentId]) {
      studentMap[sub.studentId] = {
        studentId: sub.studentId,
        name: sub.studentName || "Học sinh",
        email: sub.studentEmail || "",
        totalScore: 0,
        completedLessons: 0,
        badges: [],
      };
    }
    const student = studentMap[sub.studentId];
    if (sub.status === "graded" && typeof sub.score === "number") {
      student.totalScore += sub.score;
      student.completedLessons += 1;
    }
  });

  // Calculate dynamic badges based on score
  Object.values(studentMap).forEach((st) => {
    const badges: string[] = [];
    if (st.totalScore >= 50) badges.push("Học Viên Xuất Sắc 🌟");
    else if (st.totalScore >= 30) badges.push("Chiến Thần Code ⚡");
    else if (st.totalScore > 0) badges.push("Tân Binh STEM 🚀");
    st.badges = badges;
  });

  // Add current user if student and has at least 1 graded submission
  if (currentUser && currentUser.role === "student" && !studentMap[currentUser.uid]) {
    const userSubs = submissions.filter((s) => s.studentId === currentUser.uid && s.status === "graded" && typeof s.score === "number");
    const scoreSum = userSubs.reduce((acc, curr) => acc + (curr.score || 0), 0);
    if (userSubs.length > 0) {
      studentMap[currentUser.uid] = {
        studentId: currentUser.uid,
        name: currentUser.displayName || "Bạn",
        email: currentUser.email || "",
        totalScore: scoreSum,
        completedLessons: userSubs.length,
        badges: scoreSum >= 20 ? ["Học Viên Xuất Sắc 🌟"] : ["Tân Binh STEM 🚀"],
      };
    }
  }

  const rankedList = Object.values(studentMap).sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-3">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span>Vinh Danh Học Sinh Xuất Sắc Toàn Khóa</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Bảng Vàng Thành Tích STEM & Tin Học
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Điểm số được tổng hợp tự động từ các bài tập Scratch, bài thi code Python/C++ chấm tự động và dự án Robotics chấm theo Rubric.
        </p>
      </div>

      {/* Podium Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 items-end">
        {/* Top 2: Bạc */}
        {rankedList[1] && (
          <div className="bg-gradient-to-b from-slate-50 to-slate-100 p-6 rounded-3xl border border-slate-200 text-center shadow-xs order-2 md:order-1">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-300 text-slate-700 flex items-center justify-center font-black text-xl shadow-inner mb-3">
              🥈 2
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{rankedList[1].name}</h3>
            <div className="text-xs text-slate-500 mb-2">{rankedList[1].completedLessons} bài hoàn thành</div>
            <div className="text-xl font-black text-slate-800">{rankedList[1].totalScore} điểm</div>
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {rankedList[1].badges.map((b, i) => (
                <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top 1: Vàng */}
        {rankedList[0] && (
          <div className="bg-gradient-to-b from-amber-500/10 via-amber-50 to-white p-7 rounded-3xl border-2 border-amber-400 text-center shadow-md relative order-1 md:order-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs">
              Quán Quân Khóa Học
            </div>
            <div className="w-18 h-18 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-amber-500/30 mb-3">
              🥇
            </div>
            <h3 className="font-black text-slate-900 text-base">{rankedList[0].name}</h3>
            <div className="text-xs text-amber-700 font-medium mb-2">{rankedList[0].completedLessons} bài hoàn thành</div>
            <div className="text-3xl font-black text-amber-600">{rankedList[0].totalScore} điểm</div>
            <div className="flex flex-wrap gap-1 justify-center mt-3">
              {rankedList[0].badges.map((b, i) => (
                <span key={i} className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top 3: Đồng */}
        {rankedList[2] && (
          <div className="bg-gradient-to-b from-amber-50/50 to-orange-50/50 p-6 rounded-3xl border border-orange-200 text-center shadow-xs order-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-700/20 text-amber-800 flex items-center justify-center font-black text-xl shadow-inner mb-3">
              🥉 3
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{rankedList[2].name}</h3>
            <div className="text-xs text-slate-500 mb-2">{rankedList[2].completedLessons} bài hoàn thành</div>
            <div className="text-xl font-black text-slate-800">{rankedList[2].totalScore} điểm</div>
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {rankedList[2].badges.map((b, i) => (
                <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-orange-200">
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Leaderboard List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Hạng & Học sinh</span>
          <div className="flex items-center gap-6">
            <span>Bài đã nộp</span>
            <span>Tổng điểm tích lũy</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {rankedList.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-700">Chưa có dữ liệu bài nộp nào</p>
              <p className="text-xs text-slate-400 mt-1">Khi học sinh nộp bài tập và được chấm điểm, bảng xếp hạng sẽ tự động cập nhật tại đây.</p>
            </div>
          ) : (
            rankedList.map((st, idx) => {
              const isMe = st.studentId === currentUser.uid;
              return (
                <div
                  key={st.studentId}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    isMe ? "bg-blue-50/80 font-medium" : "hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? "bg-amber-100 text-amber-800 font-black"
                        : idx === 1
                        ? "bg-slate-200 text-slate-800 font-black"
                        : idx === 2
                        ? "bg-orange-100 text-orange-800 font-black"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{st.name}</span>
                        {isMe && (
                          <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                            Tôi
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {st.badges.map((b, i) => (
                          <span key={i} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-10 text-xs">
                    <span className="text-slate-500">{st.completedLessons} bài</span>
                    <span className="font-black text-sm text-slate-900 w-16 text-right">
                      {st.totalScore} đ
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
