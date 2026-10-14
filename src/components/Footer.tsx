import React from "react";
import { Code2, Info, Heart } from "lucide-react";

interface FooterProps {
  onOpenAbout: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAbout }) => {
  return (
    <footer className="w-full bg-white border-t border-slate-200/80 py-6 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Slogan */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Code2 className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight">CodeHiểu</span>
              <span className="hidden md:inline text-[11px] text-blue-600 font-medium">· Học Python cùng gia sư AI</span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-1">
              Hiểu từng dòng mã – Tự tin sửa từng lỗi
            </p>
          </div>
        </div>

        {/* Action & Info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAbout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200/60"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Giới thiệu về CodeHiểu</span>
          </button>
          <span className="text-xs text-slate-400 hidden sm:inline">|</span>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} CodeHiểu
          </p>
        </div>
      </div>
    </footer>
  );
};
