import React, { useState, useEffect } from "react";
import { UserProfile, UgotDevice, UgotPairingCode, UgotTask } from "../types";
import { auth } from "../firebase";
import {
  Cpu,
  Plus,
  RefreshCw,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Clock,
  Wifi,
  ShieldCheck,
  Check,
  X,
  Play,
  Square,
  Copy,
  AlertTriangle,
  Radio,
  Sliders,
  FileCode,
  Terminal
} from "lucide-react";

interface TeacherUgotManagerProps {
  currentUser: UserProfile;
}

export const TeacherUgotManager: React.FC<TeacherUgotManagerProps> = ({ currentUser }) => {
  const [devices, setDevices] = useState<UgotDevice[]>([]);
  const [tasks, setTasks] = useState<UgotTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Pairing Modal State
  const [showPairModal, setShowPairModal] = useState(false);
  const [robotIp, setRobotIp] = useState("192.168.7.88");
  const [robotName, setRobotName] = useState("UGOT-01");
  const [allowedClasses, setAllowedClasses] = useState("all");
  const [createdPairing, setCreatedPairing] = useState<{
    code: string;
    expiresInMinutes: number;
    expiresAt: number;
  } | null>(null);
  const [isCreatingPair, setIsCreatingPair] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Active Tab: Devices vs Pending Approvals
  const [activeTab, setActiveTab] = useState<"devices" | "approvals" | "history">("devices");

  // Fetch devices and tasks
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const headers = { Authorization: token ? `Bearer ${token}` : "" };

      const [devRes, taskRes] = await Promise.all([
        fetch("/api/ugot/devices", { headers }),
        fetch("/api/ugot/tasks", { headers }),
      ]);

      if (devRes.ok) {
        const d = await devRes.json();
        setDevices(d.devices || []);
      }
      if (taskRes.ok) {
        const t = await taskRes.json();
        setTasks(t.tasks || []);
      }
    } catch (e: any) {
      setError(e.message || "Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Generate pairing code
  const handleCreatePairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingPair(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      const classesArr = allowedClasses === "all" ? ["all"] : allowedClasses.split(",").map((s) => s.trim()).filter(Boolean);

      const res = await fetch("/api/ugot/pair/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          robotIp,
          robotName,
          allowedClasses: classesArr,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tạo mã ghép nối");
      }

      setCreatedPairing(data);
    } catch (err: any) {
      setError(err.message || "Lỗi tạo mã");
    } finally {
      setIsCreatingPair(false);
    }
  };

  // Toggle accepting submissions
  const handleToggleAccepting = async (device: UgotDevice) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/ugot/devices/${device.deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          acceptingSubmissions: !device.acceptingSubmissions,
        }),
      });
      fetchData();
    } catch (e) {}
  };

  // Toggle require teacher approval
  const handleToggleApprovalRequired = async (device: UgotDevice) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/ugot/devices/${device.deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          requireTeacherApproval: !device.requireTeacherApproval,
        }),
      });
      fetchData();
    } catch (e) {}
  };

  // Revoke device
  const handleRevokeDevice = async (deviceId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn thu hồi quyền thiết bị này? Cầu nối trên laptop sẽ bị ngắt kết nối.")) {
      return;
    }
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/ugot/devices/${deviceId}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      fetchData();
    } catch (e) {}
  };

  // Approve / Reject student task
  const handleReviewTask = async (taskId: string, approved: boolean) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/ugot/tasks/${taskId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ approved }),
      });
      fetchData();
    } catch (e) {}
  };

  // Pending approval tasks count
  const pendingTasks = tasks.filter((t) => t.status === "pending_approval");

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 bg-slate-900 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Quản Lý Robot UGOT & Cầu Nối Laptop
              </h1>
              <p className="text-xs text-slate-400">
                Phân quyền thiết bị, tạo mã ghép nối và duyệt bài chạy an toàn cho học sinh
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setCreatedPairing(null);
              setShowPairModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Mã Ghép Nối Laptop</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("devices")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "devices"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Danh Sách Laptop & Robot ({devices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("approvals")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 relative ${
            activeTab === "approvals"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Chờ Duyệt Chạy Robot ({pendingTasks.length})</span>
          {pendingTasks.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-1 -right-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Nhật Ký Tác Vụ</span>
        </button>
      </div>

      {/* ================= TAB 1: DEVICES LIST ================= */}
      {activeTab === "devices" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400">
              <Cpu className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-white">Chưa có Laptop nào ghép nối</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Bấm vào nút <strong>"Tạo Mã Ghép Nối Laptop"</strong> ở trên, sau đó khởi động tệp <code>start_bridge.bat</code> trên laptop học sinh/phòng máy để liên kết.
              </p>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.deviceId}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs"
              >
                <div>
                  {/* Top: Name & Online badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">{device.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {device.deviceId}</p>
                    </div>
                    {device.isOnline ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Trực tuyến
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-700">
                        Ngoại tuyến
                      </span>
                    )}
                  </div>

                  {/* Robot & Python Info */}
                  <div className="bg-slate-900/80 rounded-xl p-3 space-y-1.5 text-xs text-slate-300 my-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Robot vật lý:</span>
                      <span className="font-semibold text-amber-300">{device.robotName} ({device.robotIp})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Python:</span>
                      <span className="font-mono text-slate-300 truncate max-w-[160px]" title={device.pythonPath}>
                        {device.pythonVersion || "Python 3.x"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Thư viện UGOT:</span>
                      <span className={device.hasUgot ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                        {device.hasUgot ? "✅ Đã cài đặt" : "⚠️ Chưa cài"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lớp được phép:</span>
                      <span className="font-semibold text-indigo-300">
                        {device.allowedClasses?.join(", ") || "Tất cả"}
                      </span>
                    </div>
                  </div>

                  {/* Current Lease */}
                  {device.currentLease && device.currentLease.expiresAt > Date.now() ? (
                    <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-xs text-indigo-200 mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Đang cấp quyền: <strong>{device.currentLease.holderName}</strong></span>
                      </div>
                      <span className="text-[10px] text-indigo-300 font-mono">
                        {Math.max(0, Math.round((device.currentLease.expiresAt - Date.now()) / 1000))}s
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Controls & Actions */}
                <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleAccepting(device)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        device.acceptingSubmissions
                          ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/50"
                          : "bg-rose-950/40 border-rose-700/50 text-rose-400 hover:bg-rose-900/50"
                      }`}
                      title={device.acceptingSubmissions ? "Đang mở nhận bài. Bấm để khóa" : "Đang khóa nhận bài. Bấm để mở"}
                    >
                      {device.acceptingSubmissions ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleToggleApprovalRequired(device)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        device.requireTeacherApproval
                          ? "bg-blue-950/40 border-blue-700/50 text-blue-400 hover:bg-blue-900/50"
                          : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"
                      }`}
                      title={device.requireTeacherApproval ? "Yêu cầu giáo viên duyệt trước khi chạy robot" : "Tự động chạy bài không cần duyệt"}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRevokeDevice(device.deviceId)}
                    className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-900/50 rounded-lg transition-colors"
                    title="Thu hồi quyền thiết bị"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================= TAB 2: PENDING APPROVALS ================= */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          {pendingTasks.length === 0 ? (
            <div className="py-12 text-center bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
              <p className="font-semibold text-white">Không có bài chờ duyệt nào</p>
              <p className="text-xs text-slate-400 mt-1">
                Tất cả các bài chạy robot của học sinh đã được phê duyệt hoặc chưa có yêu cầu mới.
              </p>
            </div>
          ) : (
            pendingTasks.map((t) => (
              <div
                key={t.id}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-sm">{t.studentName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                      Lớp: {t.studentClass || "Chung"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      (Robot: {t.robotIp})
                    </span>
                  </div>

                  {/* Code snippet preview */}
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-900 font-mono text-xs text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap mt-2">
                    {t.code}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReviewTask(t.id, false)}
                    className="px-3 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Từ chối</span>
                  </button>
                  <button
                    onClick={() => handleReviewTask(t.id, true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Duyệt Cho Chạy Ngay</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================= TAB 3: TASK HISTORY ================= */}
      {activeTab === "history" && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-700">
              <tr>
                <th className="p-3">Học sinh / Người chạy</th>
                <th className="p-3">Loại tác vụ</th>
                <th className="p-3">Robot</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 italic">
                    Chưa có nhật ký tác vụ nào.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-700/30">
                    <td className="p-3 font-medium text-white">{task.studentName}</td>
                    <td className="p-3 font-mono text-indigo-300">{task.type}</td>
                    <td className="p-3 font-mono text-amber-300">{task.robotIp}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.status === "completed"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-700/50"
                            : task.status === "cancelled"
                            ? "bg-purple-950 text-purple-400 border border-purple-700/50"
                            : task.status === "running"
                            ? "bg-amber-950 text-amber-400 border border-amber-700/50 animate-pulse"
                            : "bg-rose-950 text-rose-400 border border-rose-700/50"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(task.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= CREATE PAIRING MODAL ================= */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowPairModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span>Tạo Mã Ghép Nối Laptop Mới</span>
            </h3>

            {!createdPairing ? (
              <form onSubmit={handleCreatePairingCode} className="space-y-4 mt-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tên gán cho Robot:
                  </label>
                  <input
                    type="text"
                    value={robotName}
                    onChange={(e) => setRobotName(e.target.value)}
                    placeholder="VD: UGOT-01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Địa chỉ IP của Robot trong mạng WiFi:
                  </label>
                  <input
                    type="text"
                    value={robotIp}
                    onChange={(e) => setRobotIp(e.target.value)}
                    placeholder="VD: 192.168.7.88"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Cấp quyền cho lớp học:
                  </label>
                  <input
                    type="text"
                    value={allowedClasses}
                    onChange={(e) => setAllowedClasses(e.target.value)}
                    placeholder="all (Tất cả lớp) hoặc 10A1, 10A2"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Nhập "all" hoặc danh sách tên lớp cách nhau bởi dấu phẩy.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isCreatingPair}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-center"
                  >
                    {isCreatingPair ? "Đang tạo mã..." : "Tạo Mã Ghép Nối (15 Phút)"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="p-4 bg-indigo-950/60 border border-indigo-700/60 rounded-2xl">
                  <p className="text-xs text-indigo-300 mb-1 font-semibold uppercase tracking-wider">
                    Mã ghép nối laptop dùng 1 lần:
                  </p>
                  <div className="text-3xl font-black text-amber-300 font-mono tracking-widest my-2 select-all">
                    {createdPairing.code}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mã có hiệu lực trong {createdPairing.expiresInMinutes} phút. Tối đa 5 lần thử.
                  </p>
                </div>

                <div className="text-left bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
                  <p className="font-bold text-white mb-1">Hướng dẫn trên laptop:</p>
                  <p>1. Mở thư mục <code>ugot-bridge</code> trên laptop Windows.</p>
                  <p>2. Nhấp đúp vào <code>start_bridge.bat</code>.</p>
                  <p>3. Khi chương trình hỏi "Nhập mã ghép nối", gõ mã <strong>{createdPairing.code}</strong>.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdPairing.code);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? "Đã sao chép mã" : "Sao chép mã"}</span>
                  </button>
                  <button
                    onClick={() => setShowPairModal(false)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Hoàn tất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
