import React from "react";
import { Code2, X, Sparkles, CheckCircle2, BookOpen, Bot, School, ShieldCheck } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-slate-50 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">CodeHiểu</h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                  Gia sư AI
                </span>
              </div>
              <p className="text-xs text-blue-600 font-semibold mt-0.5">
                Học Python cùng gia sư AI
              </p>
              <p className="text-xs text-slate-500 italic mt-1 font-serif">
                “Hiểu từng dòng mã – Tự tin sửa từng lỗi”
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600">
          {/* Tên đầy đủ */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Tên đầy đủ ứng dụng
            </span>
            <p className="text-slate-900 font-semibold text-sm leading-snug">
              CodeHiểu: Ứng dụng gia sư AI hỗ trợ học sinh tự phát hiện và sửa lỗi lập trình Python
            </p>
          </div>

          {/* Giới thiệu ngắn */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Giới thiệu tổng quan</span>
            </h3>
            <p className="text-slate-700 leading-relaxed text-sm bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/60">
              CodeHiểu hỗ trợ học sinh học Python thông qua thực hành, gợi ý từng bước và tự giải thích cách sửa lỗi. Giáo viên giao bài, theo dõi tiến độ và phản hồi kết quả học tập.
            </p>
          </div>

          {/* Chức năng chính */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Tính năng cốt lõi đang hoạt động</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white space-y-1.5">
                <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs">
                  <Bot className="w-4 h-4" />
                  <span>Gia sư AI sư phạm</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Phân tích mã nguồn và đưa gợi ý định hướng từng bước (Mức 1 đến Mức 3), khuyến khích tư duy phản biện thay vì đưa mã mẫu có sẵn.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs">
                  <Code2 className="w-4 h-4" />
                  <span>Phòng thực hành Python</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trình thông dịch trực tiếp trên trình duyệt, kiểm tra cú pháp, hiển thị lỗi rõ ràng và hỗ trợ lưu bản nháp tự động.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
                  <BookOpen className="w-4 h-4" />
                  <span>Cổng Học sinh</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đăng ký/đăng nhập theo lớp học, tiếp nhận bài tập được giáo viên giao, nộp bài lập trình và theo dõi điểm cùng nhận xét.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white space-y-1.5">
                <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs">
                  <School className="w-4 h-4" />
                  <span>Cổng Giáo viên</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Quản lý danh sách lớp học sinh, biên soạn bài tập Python & trắc nghiệm, theo dõi nộp bài theo thời gian thực và chấm bài.
                </p>
              </div>
            </div>
          </div>

          {/* Quy chuẩn bảo mật & dữ liệu */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dữ liệu học tập được bảo vệ, đồng bộ đa tầng và đảm bảo môi trường học tập an toàn.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            CodeHiểu · Học Python cùng gia sư AI
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
