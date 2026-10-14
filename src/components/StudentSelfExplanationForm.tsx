import React from "react";
import { StudentReflection, DebugRunItem } from "../types";
import {
  PenLine,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  Loader2,
  GitCommit,
  Check,
  X,
  Clock,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

export interface StudentSelfExplanationFormProps {
  reflection: StudentReflection;
  onChangeReflection: (updated: StudentReflection) => void;
  debugRuns: DebugRunItem[];
  serverSaveStatus: "idle" | "unsaved" | "saving" | "saved" | "error";
  lastSavedTime: string | null;
  saveErrorMessage?: string | null;
  onSaveManual: () => void;
  onSubmitAssignment?: () => void;
  canSubmit?: boolean;
  isSubmitting?: boolean;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const StudentSelfExplanationForm: React.FC<StudentSelfExplanationFormProps> = ({
  reflection,
  onChangeReflection,
  debugRuns,
  serverSaveStatus,
  lastSavedTime,
  saveErrorMessage,
  onSaveManual,
  onSubmitAssignment,
  canSubmit = false,
  isSubmitting = false,
  isModal = false,
  onCloseModal,
}) => {
  const currentMode = reflection.mode || "error_and_fixed";

  const updateField = (field: keyof StudentReflection, value: any) => {
    onChangeReflection({
      ...reflection,
      [field]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const selectedBeforeRun = debugRuns.find((r) => r.id === reflection.selectedBeforeRunId);
  const selectedAfterRun = debugRuns.find((r) => r.id === reflection.selectedAfterRunId);

  // Check how many questions answered
  const answeredCount = [
    reflection.errorEncountered?.trim(),
    reflection.errorReason?.trim(),
    reflection.howFixed?.trim(),
    reflection.verifiedWith?.trim(),
  ].filter(Boolean).length;

  return (
    <div className={`space-y-4 font-sans text-xs text-slate-200 select-text ${isModal ? "p-4 sm:p-6" : "p-3"}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <PenLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Học Sinh Tự Giải Thích Quá Trình Làm Bài & Sửa Lỗi
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-950 text-amber-300 border border-amber-800/80">
                  {answeredCount}/4 câu hỏi
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Em hãy tự phân tích lỗi và giải trình cách kiểm tra theo tư duy của mình. Lời giải thích này là minh chứng bài làm gửi tới thầy cô.
              </p>
            </div>
          </div>
        </div>

        {/* Server Save Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {serverSaveStatus === "saved" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đã lưu máy chủ {lastSavedTime ? `(${lastSavedTime})` : ""}</span>
            </span>
          )}
          {serverSaveStatus === "saving" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-950/70 border border-blue-800/80 text-blue-300 text-[11px] font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>Đang lưu...</span>
            </span>
          )}
          {serverSaveStatus === "unsaved" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/70 border border-amber-800/80 text-amber-300 text-[11px] font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Chưa lưu</span>
            </span>
          )}
          {serverSaveStatus === "error" && (
            <button
              type="button"
              onClick={onSaveManual}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] font-medium hover:bg-rose-900 cursor-pointer"
              title="Bấm để thử lưu lại lên máy chủ"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Lưu thất bại (Thử lại)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSaveManual}
            disabled={serverSaveStatus === "saving"}
            className="h-7 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
            title="Lưu bản nháp giải thích lên máy chủ"
          >
            <Save className="w-3 h-3" />
            <span>Lưu nháp</span>
          </button>

          {isModal && onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
          Chọn tình huống làm bài của em: <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label
            className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
              currentMode === "error_and_fixed"
                ? "bg-amber-950/30 border-amber-600 text-white shadow-xs"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <input
              type="radio"
              name="reflection_mode"
              checked={currentMode === "error_and_fixed"}
              onChange={() => updateField("mode", "error_and_fixed")}
              className="mt-0.5 text-amber-500 focus:ring-amber-500"
            />
            <div>
              <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                <span>🛠️ Em đã gặp lỗi và sửa lại</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                Trong quá trình chạy thử em phát hiện lỗi (cú pháp, logic hoặc ngoại lệ) và đã tự tìm cách chỉnh sửa lại mã nguồn.
              </p>
            </div>
          </label>

          <label
            className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
              currentMode === "correct_first_try"
                ? "bg-emerald-950/30 border-emerald-600 text-white shadow-xs"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <input
              type="radio"
              name="reflection_mode"
              checked={currentMode === "correct_first_try"}
              onChange={() => updateField("mode", "correct_first_try")}
              className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
            />
            <div>
              <div className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                <span>🎯 Em làm đúng ngay và trình bày cách kiểm tra</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                Chương trình thực thi đúng ngay từ đầu; em giải trình yêu cầu đề bài và dữ liệu kiểm thử để chứng minh tính đúng đắn.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 4 Core Questions */}
      <div className="space-y-3.5">
        {/* Question 1 */}
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 font-black flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Em phát hiện lỗi hoặc vấn đề gì?</span>
              <span className="text-rose-400">*</span>
            </label>
            <span className="text-[10px] text-slate-500">
              {reflection.errorEncountered?.length || 0} ký tự
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            {currentMode === "error_and_fixed"
              ? "Tên lỗi thông báo trên màn hình hoặc vấn đề logic em phát hiện (VD: IndentationError, IndexError, kết quả tính sai...)"
              : "Yêu cầu cốt lõi của bài toán mà em đã xác định và giải pháp chương trình cần đạt được."}
          </p>
          <textarea
            rows={2}
            value={reflection.errorEncountered || ""}
            onChange={(e) => updateField("errorEncountered", e.target.value)}
            placeholder={
              currentMode === "error_and_fixed"
                ? "Ví dụ: Khi nhấn chạy, chương trình báo lỗi IndexError: list index out of range ở dòng số 6 khi duyệt danh sách..."
                : "Ví dụ: Bài toán yêu cầu tính tổng các số chẵn từ 1 đến N; em cần dùng vòng lặp và câu lệnh rẽ nhánh if i % 2 == 0..."
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        {/* Question 2 */}
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Theo em, nguyên nhân là gì?</span>
              <span className="text-rose-400">*</span>
            </label>
            <span className="text-[10px] text-slate-500">
              {reflection.errorReason?.length || 0} ký tự
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            {currentMode === "error_and_fixed"
              ? "Lý do vì sao dòng lệnh đó bị lỗi theo suy nghĩ của em (VD: quên thụt lề, nhầm chỉ số bắt đầu từ 0, chưa ép kiểu int...)"
              : "Giải thích nguyên lý hoạt động của cấu trúc hoặc hàm Python mà em đã chọn."}
          </p>
          <textarea
            rows={2}
            value={reflection.errorReason || ""}
            onChange={(e) => updateField("errorReason", e.target.value)}
            placeholder={
              currentMode === "error_and_fixed"
                ? "Ví dụ: Do trong Python chỉ số danh sách đánh từ 0 đến len - 1, nhưng em lại duyệt range(1, len + 1) nên vượt quá chỉ số..."
                : "Ví dụ: Vì hàm input() trả về xâu ký tự nên em phải dùng hàm int(input()) để chuyển đổi sang số nguyên trước khi tính toán..."
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        {/* Question 3 */}
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 font-black flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Em đã sửa như thế nào?</span>
              <span className="text-rose-400">*</span>
            </label>
            <span className="text-[10px] text-slate-500">
              {reflection.howFixed?.length || 0} ký tự
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            {currentMode === "error_and_fixed"
              ? "Các thao tác hoặc dòng code em đã thay đổi để sửa hết lỗi."
              : "Cách em triển khai các bước trong chương trình để đảm bảo không bị sai sót."}
          </p>
          <textarea
            rows={2}
            value={reflection.howFixed || ""}
            onChange={(e) => updateField("howFixed", e.target.value)}
            placeholder={
              currentMode === "error_and_fixed"
                ? "Ví dụ: Em đã sửa lại điều kiện vòng lặp thành for i in range(len(a)): và thụt lề câu lệnh tiếp theo 4 dấu cách..."
                : "Ví dụ: Em khai báo biến tổng ban đầu tong = 0, sau đó dùng vòng lặp duyệt từng số và cộng dồn tong += i..."
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        {/* Question 4 */}
        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-[10px]">
                4
              </span>
              <span>Em đã kiểm tra lại bằng dữ liệu nào và kết quả ra sao?</span>
              <span className="text-rose-400">*</span>
            </label>
            <span className="text-[10px] text-slate-500">
              {reflection.verifiedWith?.length || 0} ký tự
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Bộ dữ liệu đầu vào (input) em dùng để chạy thử và kết quả quan sát được trên màn hình Console sau khi chạy.
          </p>
          <textarea
            rows={2}
            value={reflection.verifiedWith || ""}
            onChange={(e) => updateField("verifiedWith", e.target.value)}
            placeholder="Ví dụ: Em nhập vào input N = 6, kết quả in ra là 12 (2+4+6); thử tiếp với N = 1 kết quả in ra là 0, đúng với quy luật."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Linked Execution Runs */}
      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold text-slate-200">
              Liên kết với mốc nhật ký chạy mã ({debugRuns.length} lượt đã ghi)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            {debugRuns.length === 0 ? "Chưa có lượt chạy nào" : "Tùy chọn đối chiếu"}
          </span>
        </div>

        {debugRuns.length === 0 ? (
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            💡 Em chưa thực hiện lần chạy thử nào trong phiên này. Sau khi nhấn nút <strong>"Chạy"</strong>, hệ thống sẽ tự động lưu các lần chạy vào nhật ký để em chọn làm mốc đối chiếu trước/sau khi sửa. Hiện tại em vẫn có thể viết và lưu lời giải thích bình thường!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Before Fix */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
              <label className="text-[11px] font-bold text-rose-300 block">
                Mốc trước khi sửa (Lỗi gặp phải):
              </label>
              <select
                value={reflection.selectedBeforeRunId || ""}
                onChange={(e) => updateField("selectedBeforeRunId", e.target.value || undefined)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-1.5 text-[11px] text-slate-200 focus:outline-hidden focus:border-rose-500"
              >
                <option value="">-- Chưa có mốc đối chiếu (hoặc làm đúng ngay) --</option>
                {debugRuns.map((run, idx) => (
                  <option key={run.id} value={run.id}>
                    Lần {idx + 1} ({run.timestamp}) - {run.passed ? "Thành công" : `Có lỗi: ${(run.error || "").slice(0, 30)}`}
                  </option>
                ))}
              </select>

              {selectedBeforeRun && (
                <div className="p-2 rounded-md bg-slate-900 border border-rose-900/40 text-[10px] space-y-1 font-mono">
                  <div className="text-slate-400 font-sans flex justify-between">
                    <span>Thời gian: {selectedBeforeRun.timestamp}</span>
                    <span className={selectedBeforeRun.passed ? "text-emerald-400" : "text-rose-400"}>
                      {selectedBeforeRun.passed ? "✓ Không lỗi" : "✗ Báo lỗi"}
                    </span>
                  </div>
                  {selectedBeforeRun.error ? (
                    <div className="text-rose-400 truncate">{selectedBeforeRun.error}</div>
                  ) : (
                    <div className="text-slate-400 truncate">{selectedBeforeRun.output || "(Không in ra gì)"}</div>
                  )}
                </div>
              )}
            </div>

            {/* After Fix */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
              <label className="text-[11px] font-bold text-emerald-300 block">
                Mốc sau khi sửa (Đã khắc phục):
              </label>
              <select
                value={reflection.selectedAfterRunId || ""}
                onChange={(e) => updateField("selectedAfterRunId", e.target.value || undefined)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-1.5 text-[11px] text-slate-200 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="">-- Chưa có mốc đối chiếu --</option>
                {debugRuns.map((run, idx) => (
                  <option key={run.id} value={run.id}>
                    Lần {idx + 1} ({run.timestamp}) - {run.passed ? "Thành công" : `Có lỗi: ${(run.error || "").slice(0, 30)}`}
                  </option>
                ))}
              </select>

              {selectedAfterRun && (
                <div className="p-2 rounded-md bg-slate-900 border border-emerald-900/40 text-[10px] space-y-1 font-mono">
                  <div className="text-slate-400 font-sans flex justify-between">
                    <span>Thời gian: {selectedAfterRun.timestamp}</span>
                    <span className={selectedAfterRun.passed ? "text-emerald-400" : "text-rose-400"}>
                      {selectedAfterRun.passed ? "✓ Hoàn thành" : "✗ Báo lỗi"}
                    </span>
                  </div>
                  <div className="text-emerald-300 truncate">{selectedAfterRun.output || "(Không in ra gì)"}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
        <div className="text-[11px] text-slate-400">
          {answeredCount === 4 ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Đã hoàn thành đầy đủ 4 câu hỏi tự giải thích.
            </span>
          ) : (
            <span className="text-amber-400 font-medium">
              Vui lòng điền đủ 4 câu hỏi để có minh chứng bài làm hoàn thiện nhất.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSaveManual}
            disabled={serverSaveStatus === "saving"}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            <Save className="w-3.5 h-3.5 text-blue-400" />
            <span>Lưu nháp máy chủ</span>
          </button>

          {canSubmit && onSubmitAssignment && (
            <button
              type="button"
              onClick={onSubmitAssignment}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-600/30 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Nộp bài kèm lời giải thích</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
