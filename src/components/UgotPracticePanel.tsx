import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { UserProfile, UgotDevice, UgotTask } from "../types";
import { auth } from "../firebase";
import {
  Cpu,
  Play,
  Square,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Terminal,
  FileCode,
  Sparkles,
  Bot,
  Copy,
  Check,
  Send,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

interface UgotPracticePanelProps {
  currentUser: UserProfile;
  initialCode?: string;
  onCodeChange?: (newCode: string) => void;
}

// Starter templates for UGOT Robot practice
const UGOT_STARTER_CODES: Record<string, { title: string; desc: string; code: string }> = {
  stage1: {
    title: "1. Kiểm tra Python & Thư viện (Giai đoạn 1)",
    desc: "Chạy tác vụ kiểm tra Python trên laptop và thư viện ugot (Không điều khiển robot).",
    code: `# Giai đoạn 1: Kiểm tra môi trường Python trên laptop
import sys

print("Kết nối Python trên laptop thành công")
print(f"Phiên bản Python: {sys.version.split()[0]}")

try:
    from ugot import ugot
    print("✅ Đã import thư viện ugot thành công!")
except ImportError as e:
    print(f"❌ Chưa có thư viện ugot: {e}")
`,
  },
  stage2: {
    title: "2. Bắt tay & Kiểm tra Robot (Giai đoạn 2)",
    desc: "Khởi tạo kết nối rb.initialize(IP) và đối chiếu phản hồi từ robot vật lý (Không chuyển động).",
    code: `# Giai đoạn 2: Kết nối robot UGOT (Không gọi lệnh chuyển động)
import sys
import time

try:
    from ugot import ugot
    rb = ugot.UGOT()
    
    # Địa chỉ IP của robot trong mạng LAN phòng thực hành
    robot_ip = "192.168.7.88"
    print(f"Đang gửi yêu cầu bắt tay tới Robot UGOT tại IP: {robot_ip}...")
    
    # Đối chiếu SDK: initialize trả về kết quả hoặc phản hồi kết nối
    result = rb.initialize(robot_ip)
    print(f"Phản hồi từ rb.initialize: {result}")
    
    time.sleep(1)
    print("✅ Robot phản hồi thành công và sẵn sàng!")
except Exception as e:
    print(f"❌ Lỗi khởi tạo kết nối: {e}")
`,
  },
  stage3_chassis: {
    title: "3. Hạ & Nâng khung gầm (Giai đoạn 3)",
    desc: "Mẫu điều khiển thay đổi chiều cao gầm xe transform_set_chassis_height.",
    code: `# Giai đoạn 3: Thực hành điều khiển khung gầm UGOT
# Lưu ý: Cần giáo viên duyệt mã trước khi gửi xuống robot thật!
import time
from ugot import ugot

rb = ugot.UGOT()
rb.initialize("192.168.7.88")

print("1. Điều chỉnh hạ gầm (chiều cao 1)...")
if hasattr(rb, "transform_set_chassis_height"):
    rb.transform_set_chassis_height(1)
    time.sleep(2)
    
    print("2. Nâng gầm lên mức cao nhất (chiều cao 3)...")
    rb.transform_set_chassis_height(3)
    time.sleep(2)

print("3. Đưa gầm về vị trí chuẩn...")
if hasattr(rb, "transform_set_chassis_height"):
    rb.transform_set_chassis_height(2)

print("Hoàn thành bài tập khung gầm!")
`,
  },
  stage3_movement: {
    title: "4. Chuyển động tiến, lùi và dừng (Giai đoạn 3)",
    desc: "Mẫu di chuyển tốc độ an toàn có gọi rb.transform_stop() khi kết thúc.",
    code: `# Giai đoạn 3: Thực hành chuyển động và dừng an toàn
import time
from ugot import ugot

rb = ugot.UGOT()
rb.initialize("192.168.7.88")

try:
    print("1. Tiến về phía trước tốc độ 20 trong 2 giây...")
    if hasattr(rb, "transform_move_speed"):
        rb.transform_move_speed(20, 0) # speed, direction
        time.sleep(2)

    print("2. Xoay tại chỗ sang phải tốc độ 30 trong 1.5 giây...")
    if hasattr(rb, "transform_turn_speed"):
        rb.transform_turn_speed(30, 0)
        time.sleep(1.5)

finally:
    print("3. Kích hoạt dừng an toàn transform_stop()...")
    if hasattr(rb, "transform_stop"):
        rb.transform_stop()
    print("Đã dừng mọi chuyển động cơ học!")
`,
  },
};

export const UgotPracticePanel: React.FC<UgotPracticePanelProps> = ({
  currentUser,
  initialCode,
  onCodeChange,
}) => {
  const [devices, setDevices] = useState<UgotDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isLoadingDevices, setIsLoadingDevices] = useState<boolean>(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Active Code
  const [code, setCode] = useState<string>(
    initialCode || UGOT_STARTER_CODES.stage1.code
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>("stage1");

  // Running & Task State
  const [currentTask, setCurrentTask] = useState<UgotTask | null>(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState<boolean>(false);
  const [isStopping, setIsStopping] = useState<boolean>(false);
  const [liveStdout, setLiveStdout] = useState<string>("");
  const [liveStderr, setLiveStderr] = useState<string>("");
  const [taskHistory, setTaskHistory] = useState<UgotTask[]>([]);
  const [reflectionText, setReflectionText] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Mobile / Tablet Tab switch
  const [activeTab, setActiveTab] = useState<"code" | "console" | "history" | "devices">("code");

  const socketRef = useRef<WebSocket | null>(null);
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch available devices
  const fetchDevices = async () => {
    setIsLoadingDevices(true);
    setDeviceError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ugot/devices", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        throw new Error("Không thể tải danh sách thiết bị");
      }
      const data = await res.json();
      setDevices(data.devices || []);
      if (data.devices && data.devices.length > 0 && !selectedDeviceId) {
        // Prefer online device
        const onlineDev = data.devices.find((d: UgotDevice) => d.isOnline) || data.devices[0];
        setSelectedDeviceId(onlineDev.deviceId);
      }
    } catch (e: any) {
      setDeviceError(e.message || "Lỗi tải thiết bị");
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [currentUser]);

  // Selected device object
  const selectedDevice = devices.find((d) => d.deviceId === selectedDeviceId);

  // 2. Setup WebSocket live listener for selected device
  useEffect(() => {
    if (!selectedDeviceId) return;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${proto}//${host}/ws/ugot-relay?type=web&deviceId=${selectedDeviceId}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "bridge:online") {
          setDevices((prev) =>
            prev.map((d) => (d.deviceId === selectedDeviceId ? { ...d, isOnline: true } : d))
          );
        } else if (data.type === "bridge:offline") {
          setDevices((prev) =>
            prev.map((d) =>
              d.deviceId === selectedDeviceId
                ? { ...d, isOnline: false, robotConnected: false }
                : d
            )
          );
        } else if (data.type === "bridge:info") {
          setDevices((prev) =>
            prev.map((d) =>
              d.deviceId === selectedDeviceId
                ? {
                    ...d,
                    pythonPath: data.data.pythonPath,
                    pythonVersion: data.data.pythonVersion,
                    ugotVersion: data.data.hasUgot ? "Đã cài đặt" : "Chưa cài",
                    robotIp: data.data.robotIp,
                    isOnline: true,
                  }
                : d
            )
          );
        } else if (data.type === "task:update") {
          if (data.stream === "stdout") {
            setLiveStdout((prev) => prev + data.chunk);
          } else if (data.stream === "stderr") {
            setLiveStderr((prev) => prev + data.chunk);
          }
          setTimeout(() => {
            terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 50);
        } else if (data.type === "task:status") {
          setCurrentTask((prev) => (prev ? { ...prev, status: data.status } : null));
        } else if (data.type === "task:completed") {
          setCurrentTask((prev) =>
            prev
              ? {
                  ...prev,
                  status: data.status,
                  exitCode: data.exitCode,
                  robotStopped: data.robotStopped,
                  stopConfirmed: data.stopConfirmed,
                  stopMessage: data.stopMessage,
                }
              : null
          );
          setIsSubmittingTask(false);
          setIsStopping(false);
          fetchDevices();
          fetchTaskHistory();
        } else if (data.type === "task:stopped") {
          setCurrentTask((prev) =>
            prev
              ? {
                  ...prev,
                  status: "cancelled",
                  stopConfirmed: data.stopConfirmed,
                  stopMessage: data.stopMessage,
                }
              : null
          );
          setIsStopping(false);
        }
      } catch (err) {}
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [selectedDeviceId]);

  // 3. Fetch Task History
  const fetchTaskHistory = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const url = selectedDeviceId
        ? `/api/ugot/tasks?deviceId=${selectedDeviceId}`
        : "/api/ugot/tasks";
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTaskHistory(data.tasks || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchTaskHistory();
  }, [selectedDeviceId]);

  // 4. Send Task Execution (Stage 1, Stage 2, Stage 3)
  const handleExecuteTask = async (
    type: "stage1_test" | "stage2_connect" | "stage3_run"
  ) => {
    if (!selectedDeviceId) {
      alert("Vui lòng chọn hoặc ghép nối một Laptop Cầu Nối trước khi chạy!");
      return;
    }
    if (!selectedDevice?.isOnline) {
      alert(
        "Laptop Cầu Nối này hiện đang NGOẠI TUYẾN. Hãy đảm bảo laptop đã bật và đang chạy tệp 'start_bridge.bat'."
      );
      return;
    }

    setIsSubmittingTask(true);
    setLiveStdout("");
    setLiveStderr("");

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ugot/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          type,
          code: type === "stage3_run" ? code : "",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gửi tác vụ thất bại");
      }

      setCurrentTask(data.task);

      if (data.requiresApproval) {
        alert(
          "⏳ Yêu cầu chạy robot đã gửi tới Giáo viên và đang Chờ Duyệt để đảm bảo an toàn vật lý!"
        );
      }
    } catch (e: any) {
      alert(`Lỗi thực thi: ${e.message}`);
      setIsSubmittingTask(false);
    }
  };

  // 5. Emergency Stop
  const handleEmergencyStop = async () => {
    if (!currentTask && !selectedDeviceId) return;
    setIsStopping(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const taskId = currentTask?.id || "emergency";
      const res = await fetch(`/api/ugot/tasks/${taskId}/stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể dừng");
      }
    } catch (e: any) {
      alert(`Lỗi dừng: ${e.message}`);
    } finally {
      setIsStopping(false);
    }
  };

  // Select starter code
  const handleSelectTemplate = (key: string) => {
    setSelectedTemplate(key);
    const item = UGOT_STARTER_CODES[key];
    if (item) {
      setCode(item.code);
      if (onCodeChange) onCodeChange(item.code);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* ================= HEADER & DEVICE STATUS BAR ================= */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Device selector & Status */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Robot UGOT Windows Bridge</span>
                {selectedDevice?.isOnline ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Trực tuyến
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Ngoại tuyến
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Thực hành robot thật qua Python trên laptop Windows
              </p>
            </div>
          </div>

          {/* Select Laptop */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Laptop:</span>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="bg-slate-800 text-xs font-semibold text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 max-w-[200px]"
            >
              {devices.length === 0 && (
                <option value="">Chưa ghép nối laptop nào</option>
              )}
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.name} {d.isOnline ? "🟢" : "⚪"}
                </option>
              ))}
            </select>
            <button
              onClick={fetchDevices}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Làm mới trạng thái"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDevices ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Robot IP & Lease Badge */}
        {selectedDevice && (
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-2">
              <span className="text-slate-400">Robot:</span>
              <span className="font-semibold text-amber-300">{selectedDevice.robotName}</span>
              <span className="font-mono text-slate-300">({selectedDevice.robotIp})</span>
            </div>

            {selectedDevice.currentLease && selectedDevice.currentLease.expiresAt > Date.now() ? (
              <div className="bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] font-semibold">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>Đang cấp quyền cho: {selectedDevice.currentLease.holderName}</span>
              </div>
            ) : (
              <div className="bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                Robot đang sẵn sàng
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= THREE STAGE ACTION BAR ================= */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Template and 3 Stage Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <select
            value={selectedTemplate}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            className="bg-slate-800 text-xs font-semibold text-amber-400 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            {Object.entries(UGOT_STARTER_CODES).map(([k, item]) => (
              <option key={k} value={k}>
                {item.title}
              </option>
            ))}
          </select>

          {/* Giai đoạn 1 Button */}
          <button
            onClick={() => handleExecuteTask("stage1_test")}
            disabled={isSubmittingTask || !selectedDevice?.isOnline}
            className="min-h-[38px] px-3 py-1.5 bg-blue-600/90 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Giai đoạn 1: Bắt tay cầu nối & kiểm tra import ugot (Không điều khiển robot)"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Giai đoạn 1 (Kiểm tra Python)</span>
          </button>

          {/* Giai đoạn 2 Button */}
          <button
            onClick={() => handleExecuteTask("stage2_connect")}
            disabled={isSubmittingTask || !selectedDevice?.isOnline}
            className="min-h-[38px] px-3 py-1.5 bg-amber-600/90 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Giai đoạn 2: Kết nối robot với IP chỉ định (Không gọi lệnh chuyển động)"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Giai đoạn 2 (Kết nối Robot)</span>
          </button>

          {/* Giai đoạn 3 Button (Chạy bài) */}
          <button
            onClick={() => handleExecuteTask("stage3_run")}
            disabled={isSubmittingTask || !selectedDevice?.isOnline}
            className="min-h-[38px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Giai đoạn 3: Gửi chạy bài (Yêu cầu giáo viên duyệt nếu là học sinh)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Giai đoạn 3 (Gửi Chạy Bài)</span>
          </button>
        </div>

        {/* Right: Emergency Stop Button (Always visible & prominent) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEmergencyStop}
            disabled={isStopping}
            className="min-h-[38px] px-4 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer animate-pulse"
            title="Dừng khẩn cấp: Ngắt tiến trình và gọi rb.transform_stop() để triệt tiêu chuyển động"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>DỪNG KHẨN CẤP</span>
          </button>
        </div>
      </div>

      {/* ================= MOBILE TAB SELECTOR (Phone/Tablet) ================= */}
      <div className="md:hidden flex border-b border-slate-800 bg-slate-900/90 shrink-0">
        <button
          onClick={() => setActiveTab("code")}
          className={`flex-1 min-h-[44px] py-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === "code"
              ? "border-indigo-500 text-indigo-400 bg-indigo-950/20"
              : "border-transparent text-slate-400"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Mã Nguồn</span>
        </button>
        <button
          onClick={() => setActiveTab("console")}
          className={`flex-1 min-h-[44px] py-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 relative ${
            activeTab === "console"
              ? "border-indigo-500 text-indigo-400 bg-indigo-950/20"
              : "border-transparent text-slate-400"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Kết Quả & Log</span>
          {(liveStdout || liveStderr) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 min-h-[44px] py-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === "history"
              ? "border-indigo-500 text-indigo-400 bg-indigo-950/20"
              : "border-transparent text-slate-400"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Lịch Sử</span>
        </button>
      </div>

      {/* ================= MAIN WORKSPACE (Code Left, Console Right) ================= */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT PANE: Monaco Code Editor */}
        <div
          className={`flex-1 min-h-0 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 ${
            activeTab !== "code" ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="bg-slate-900/70 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between shrink-0 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Trình soạn thảo Python (UGOT SDK)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                title="Sao chép mã"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(val) => {
                const newCode = val || "";
                setCode(newCode);
                if (onCodeChange) onCodeChange(newCode);
              }}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 4,
                suggestOnTriggerCharacters: true,
              }}
            />
          </div>

          {/* Safety & Physical stop advice note */}
          <div className="p-2 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 shrink-0">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Lưu ý an toàn:</strong> Khi thử nghiệm chuyển động cơ học, hãy chuẩn bị tay trên công tắc vật lý của Robot UGOT để ngắt nguồn kịp thời nếu xảy ra chướng ngại vật.
            </span>
          </div>
        </div>

        {/* RIGHT PANE: Console stdout/stderr & Task Status */}
        <div
          className={`w-full md:w-[420px] lg:w-[480px] shrink-0 min-h-0 flex flex-col bg-slate-950 ${
            activeTab === "code" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header of Console */}
          <div className="bg-slate-900/70 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between shrink-0 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đầu ra Thực Tế (stdout / stderr)</span>
            </span>

            {currentTask && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  currentTask.status === "running"
                    ? "bg-amber-950 text-amber-300 border border-amber-700/50 animate-pulse"
                    : currentTask.status === "completed"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
                    : currentTask.status === "cancelled"
                    ? "bg-purple-950 text-purple-300 border border-purple-700/50"
                    : currentTask.status === "pending_approval"
                    ? "bg-blue-950 text-blue-300 border border-blue-700/50"
                    : "bg-rose-950 text-rose-300 border border-rose-700/50"
                }`}
              >
                {currentTask.status === "running"
                  ? "Đang chạy..."
                  : currentTask.status === "completed"
                  ? "Hoàn thành"
                  : currentTask.status === "cancelled"
                  ? "Đã hủy/Dừng"
                  : currentTask.status === "pending_approval"
                  ? "Chờ duyệt"
                  : "Lỗi"}
              </span>
            )}
          </div>

          {/* Terminal Console Stream */}
          <div className="flex-1 min-h-0 p-3 bg-black font-mono text-xs overflow-y-auto space-y-1">
            {!liveStdout && !liveStderr && !currentTask && (
              <div className="text-slate-500 italic p-2">
                Chưa có tác vụ nào đang chạy. Nhấn một trong các nút phía trên để kiểm tra kết nối hoặc gửi chạy bài.
              </div>
            )}

            {currentTask && (
              <div className="text-[11px] text-slate-400 border-b border-slate-800 pb-1 mb-2">
                [Tác vụ: {currentTask.type}] ID: {currentTask.id.slice(0, 12)}
                {currentTask.approvedByTeacher === false && (
                  <div className="text-amber-400 mt-1">
                    ⚠️ Tác vụ chưa được giáo viên duyệt.
                  </div>
                )}
              </div>
            )}

            {liveStdout && (
              <div className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {liveStdout}
              </div>
            )}

            {liveStderr && (
              <div className="text-rose-400 whitespace-pre-wrap leading-relaxed">
                {liveStderr}
              </div>
            )}

            {currentTask?.stopMessage && (
              <div className="text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-800/40 text-[11px] mt-2">
                {currentTask.stopMessage}
              </div>
            )}

            <div ref={terminalBottomRef} />
          </div>

          {/* Student Self-Explanation / Reflection Note */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Học sinh tự giải thích nhật ký & cách xử lý lỗi:
            </label>
            <textarea
              rows={2}
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="VD: Em đã hạ gầm xe thành công, ban đầu báo lỗi do quên bật robot..."
              className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
