#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UGOT Robot Bridge for Windows
---------------------------------
Cầu nối Python trung gian giữa Hệ thống LMS và Robot UGOT.
Chạy trực tiếp trên laptop của giáo viên hoặc học sinh (Windows).

Luồng hoạt động:
LMS Website <---(WSS)---> Cầu nối này <---(WiFi/LAN)---> Robot UGOT (qua SDK ugot)
"""

import os
import sys
import json
import time
import uuid
import shutil
import asyncio
import tempfile
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List

# Try importing websockets and requests
try:
    import websockets
except ImportError:
    print("=" * 60)
    print("THIẾU THƯ VIỆN: 'websockets'")
    print(f"Vui lòng cài đặt bằng lệnh:")
    print(f'"{sys.executable}" -m pip install websockets requests')
    print("=" * 60)
    input("Nhấn Enter để thoát...")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("=" * 60)
    print("THIẾU THƯ VIỆN: 'requests'")
    print(f"Vui lòng cài đặt bằng lệnh:")
    print(f'"{sys.executable}" -m pip install requests')
    print("=" * 60)
    input("Nhấn Enter để thoát...")
    sys.exit(1)

CONFIG_FILE = Path(__file__).parent / "config.json"
EXAMPLE_CONFIG_FILE = Path(__file__).parent / "config.example.json"

DEFAULT_SERVER_URL = "https://ais-dev-g4kfioxpya7cwymp4ia6p3-286985424202.asia-southeast1.run.app"


def print_banner():
    print("=" * 65)
    print("        🤖 CẦU NỐI ROBOT UGOT - CODEHIỂU (GIA SƯ AI) 🤖")
    print("            Hỗ trợ Thonny / Python 3.8+ trên Windows")
    print("=" * 65)


def detect_python_interpreters() -> List[Dict[str, Any]]:
    """Tự động dò tìm các bản cài đặt Python phổ biến trên Windows."""
    candidates = []
    seen = set()

    def check_candidate(p_path: str, label: str):
        if not p_path or p_path in seen:
            return
        p = Path(p_path)
        if p.is_file() and os.access(str(p), os.X_OK):
            seen.add(str(p.resolve()))
            # Test executable
            try:
                res = subprocess.run(
                    [str(p), "-c", "import sys; print(sys.version.split()[0]); from ugot import ugot; print('UGOT_OK')"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                output = res.stdout.strip().split("\n")
                py_ver = output[0] if len(output) > 0 else "Unknown"
                has_ugot = "UGOT_OK" in output
                candidates.append({
                    "path": str(p.resolve()),
                    "label": label,
                    "version": py_ver,
                    "has_ugot": has_ugot,
                    "works": True
                })
            except Exception as e:
                try:
                    res2 = subprocess.run(
                        [str(p), "-c", "import sys; print(sys.version.split()[0])"],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    candidates.append({
                        "path": str(p.resolve()),
                        "label": label,
                        "version": res2.stdout.strip(),
                        "has_ugot": False,
                        "works": True
                    })
                except Exception:
                    pass

    # 1. Thonny Python (phổ biến trong trường học)
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    if local_app_data:
        check_candidate(os.path.join(local_app_data, "Programs", "Thonny", "python.exe"), "Thonny IDE Python")

    # 2. Current running interpreter
    check_candidate(sys.executable, "Python hiện tại đang chạy cầu nối")

    # 3. Standard Windows AppData Python
    if local_app_data:
        programs_dir = Path(local_app_data) / "Programs" / "Python"
        if programs_dir.is_dir():
            for pdir in programs_dir.glob("Python*"):
                check_candidate(str(pdir / "python.exe"), f"Python chuẩn ({pdir.name})")

    # 4. PATH python
    py_which = shutil.which("python")
    if py_which:
        check_candidate(py_which, "Python từ biến môi trường PATH")

    # 5. C:\Python*
    c_root = Path("C:/")
    for pdir in c_root.glob("Python*"):
        check_candidate(str(pdir / "python.exe"), f"C:/{pdir.name}")

    # 6. Anaconda / Miniconda
    user_home = Path.home()
    check_candidate(str(user_home / "anaconda3" / "python.exe"), "Anaconda 3")
    check_candidate(str(user_home / "miniconda3" / "python.exe"), "Miniconda 3")

    return candidates


def test_python_executable(path_str: str) -> Dict[str, Any]:
    """Kiểm tra đường dẫn Python chỉ định có hợp lệ và có ugot hay không."""
    p = Path(path_str)
    if not p.is_file():
        return {"valid": False, "error": f"Không tìm thấy tệp: {path_str}"}

    try:
        res = subprocess.run(
            [str(p), "-c", "import sys; print(sys.version.split()[0]); from ugot import ugot; print('UGOT_OK')"],
            capture_output=True,
            text=True,
            timeout=6
        )
        lines = res.stdout.strip().split("\n")
        py_ver = lines[0] if len(lines) > 0 else "Unknown"
        has_ugot = "UGOT_OK" in lines
        err_msg = res.stderr.strip() if not has_ugot else ""

        return {
            "valid": True,
            "version": py_ver,
            "has_ugot": has_ugot,
            "error": err_msg
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}


def setup_wizard() -> Dict[str, Any]:
    """Hướng dẫn thiết lập lần đầu cho laptop."""
    print_banner()
    print("\n👉 BẮT ĐẦU THIẾT LẬP LẦN ĐẦU CHO LAPTOP NÀY\n")

    # Bước 1: Tên máy
    default_name = f"Laptop {os.environ.get('USERNAME', 'Nhom')}"
    device_name = input(f"1. Đặt tên nhận diện máy [Mặc định: {default_name}]: ").strip()
    if not device_name:
        device_name = default_name

    # Bước 2: Dò tìm Python
    print("\n2. Đang dò tìm các bản cài đặt Python trên máy...")
    interpreters = detect_python_interpreters()

    chosen_python = ""
    if interpreters:
        print("\nTìm thấy các bản Python sau:")
        for idx, item in enumerate(interpreters, 1):
            ugot_badge = "✅ ĐÃ CÓ ugot" if item["has_ugot"] else "⚠️ CHƯA CÓ ugot"
            print(f"  [{idx}] {item['label']} ({item['version']}) - {ugot_badge}")
            print(f"      Đường dẫn: {item['path']}")

        print(f"  [0] Nhập đường dẫn python.exe thủ công")

        choice = input(f"\nChọn số thứ tự Python muốn dùng [1-{len(interpreters)}]: ").strip()
        try:
            choice_num = int(choice)
            if 1 <= choice_num <= len(interpreters):
                chosen_python = interpreters[choice_num - 1]["path"]
        except ValueError:
            pass

    while not chosen_python:
        manual_path = input("Nhập đường dẫn đầy đủ đến python.exe (hoặc kéo thả tệp vào đây): ").strip().strip('"').strip("'")
        res = test_python_executable(manual_path)
        if res["valid"]:
            chosen_python = manual_path
            print(f"  -> Nhận diện thành công: Python {res.get('version')}")
            if not res["has_ugot"]:
                print("  ⚠️ CHÚ Ý: Python này chưa được cài đặt thư viện 'ugot'.")
                print(f"  Để cài ugot, mở Command Prompt và chạy lệnh:")
                print(f'  "{chosen_python}" -m pip install ugot\n')
        else:
            print(f"  ❌ Lỗi: {res.get('error')}. Vui lòng thử lại!")

    # Kiểm tra lại ugot một lần nữa
    test_res = test_python_executable(chosen_python)
    if not test_res.get("has_ugot"):
        print("\n" + "=" * 60)
        print("CẢNH BÁO: Thư viện 'ugot' chưa được tìm thấy trong Python đã chọn!")
        print("Lệnh cài đặt:")
        print(f'    "{chosen_python}" -m pip install ugot')
        print("Bạn có thể tiếp tục thiết lập, nhưng hãy cài ugot trước khi chạy robot.")
        print("=" * 60)
        input("Nhấn Enter để tiếp tục cấu hình...")

    # Bước 3: Địa chỉ máy chủ LMS
    print("\n3. Địa chỉ máy chủ LMS / Relay:")
    server_url = input(f"Nhập URL máy chủ LMS [Mặc định: {DEFAULT_SERVER_URL}]: ").strip()
    if not server_url:
        server_url = DEFAULT_SERVER_URL
    server_url = server_url.rstrip("/")

    # Bước 4: Mã ghép nối (Pairing code từ giáo viên)
    print("\n4. Ghép nối với tài khoản Giáo viên trên LMS:")
    print("   -> Giáo viên vào LMS > Phòng thực hành Robot UGOT > Bấm 'Tạo mã ghép nối laptop'")
    print("   -> Mã gồm 6 ký tự (VD: UG-849201 hoặc 849201)")

    claimed_device_id = ""
    claimed_token = ""
    robot_ip = "192.168.7.88"
    robot_name = "UGOT-01"

    while True:
        code_input = input("Nhập mã ghép nối: ").strip().upper()
        if not code_input:
            print("Mã ghép nối không được để trống!")
            continue

        print("Đang gửi yêu cầu ghép nối tới máy chủ LMS...")
        try:
            claim_url = f"{server_url}/api/ugot/pair/claim"
            resp = requests.post(
                claim_url,
                json={
                    "code": code_input,
                    "deviceName": device_name,
                    "pythonPath": chosen_python,
                    "pythonVersion": test_res.get("version", "Python 3.x"),
                    "hasUgot": test_res.get("has_ugot", False)
                },
                timeout=15
            )
            data = resp.json()

            if resp.status_code == 200 and data.get("success"):
                claimed_device_id = data.get("deviceId")
                claimed_token = data.get("deviceToken")
                robot_ip = data.get("robotIp", "192.168.7.88")
                robot_name = data.get("robotName", "UGOT-01")
                print(f"🎉 Ghép nối thành công!")
                print(f"   Mã thiết bị: {claimed_device_id}")
                print(f"   Giáo viên quản lý: {data.get('teacherEmail')}")
                print(f"   Lớp được phép: {', '.join(data.get('allowedClasses', ['Tất cả']))}")
                break
            else:
                err = data.get("error", "Mã ghép nối không hợp lệ hoặc đã hết hạn.")
                print(f"❌ Ghép nối thất bại: {err}")
                retry = input("Bạn có muốn nhập lại mã ghép nối không? (y/n): ").strip().lower()
                if retry != "y":
                    print("Hủy thiết lập.")
                    sys.exit(1)
        except Exception as e:
            print(f"❌ Lỗi kết nối tới máy chủ: {e}")
            retry = input("Thử lại kết nối? (y/n): ").strip().lower()
            if retry != "y":
                sys.exit(1)

    # Bước 5: Cấu hình Robot IP
    print("\n5. Cấu hình Robot UGOT:")
    custom_robot_ip = input(f"Nhập IP của Robot UGOT trong mạng WiFi [Mặc định: {robot_ip}]: ").strip()
    if custom_robot_ip:
        robot_ip = custom_robot_ip

    config_data = {
        "server_url": server_url,
        "device_id": claimed_device_id,
        "device_token": claimed_token,
        "device_name": device_name,
        "python_path": chosen_python,
        "robot_ip": robot_ip,
        "robot_name": robot_name
    }

    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Đã lưu cấu hình vào: {CONFIG_FILE.resolve()}")
    print("=" * 65 + "\n")
    return config_data


def load_config() -> Dict[str, Any]:
    """Tải cấu hình hoặc chạy wizard nếu chưa có."""
    if not CONFIG_FILE.is_file():
        return setup_wizard()

    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            if not cfg.get("device_id") or not cfg.get("device_token"):
                print("Cấu hình cũ thiếu thông tin xác thực. Bắt đầu ghép nối lại...")
                return setup_wizard()
            return cfg
    except Exception as e:
        print(f"Lỗi đọc {CONFIG_FILE}: {e}")
        return setup_wizard()


class UgotBridge:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.server_url = config.get("server_url", DEFAULT_SERVER_URL).rstrip("/")
        self.device_id = config.get("device_id")
        self.device_token = config.get("device_token")
        self.device_name = config.get("device_name", "Laptop")
        self.python_path = config.get("python_path", sys.executable)
        self.robot_ip = config.get("robot_ip", "192.168.7.88")
        self.robot_name = config.get("robot_name", "UGOT-01")

        self.current_process: Optional[subprocess.Popen] = None
        self.current_task_id: Optional[str] = None
        self.current_task_type: Optional[str] = None
        self.is_connected = False
        self.stop_requested = False
        self.task_lock = asyncio.Lock()
        self.seen_task_ids: set = set()

    def get_ws_url(self) -> str:
        """Chuyển http(s) thành ws(s) và thêm tham số xác thực."""
        base = self.server_url
        if base.startswith("https://"):
            ws_base = "wss://" + base[8:]
        elif base.startswith("http://"):
            ws_base = "ws://" + base[7:]
        else:
            ws_base = "wss://" + base

        return f"{ws_base}/ws/ugot-relay?type=bridge&deviceId={self.device_id}&token={self.device_token}"

    def send_stop_command(self) -> Dict[str, Any]:
        """Gửi lệnh dừng robot qua rb.transform_stop() mà không đánh dấu stop_requested (dùng cho kết thúc bình thường)."""
        stop_script = f"""
import sys
import time

try:
    from ugot import ugot
    rb = ugot.UGOT()
    rb.initialize("{self.robot_ip}")
    if hasattr(rb, "transform_stop"):
        rb.transform_stop()
        print("STOP_OK")
    else:
        print("NO_TRANSFORM_STOP")
except Exception as e:
    print(f"STOP_ERR: {{e}}")
"""
        stop_confirmed = False
        stop_command_sent = True
        msg = ""

        try:
            res = subprocess.run(
                [self.python_path, "-c", stop_script],
                capture_output=True,
                text=True,
                timeout=5
            )
            output = res.stdout.strip() + " " + res.stderr.strip()
            if "STOP_OK" in output:
                stop_confirmed = True
                msg = "Đã xác nhận robot dừng (rb.transform_stop() thành công)."
                print(f"   ✅ {msg}")
            else:
                msg = f"Đã gửi lệnh dừng nhưng chưa xác nhận phản hồi ({output.strip()})."
                print(f"   ⚠️ {msg}")
        except Exception as e:
            stop_command_sent = False
            msg = f"Chưa thể gửi lệnh dừng qua SDK ({e}). Hãy gạt công tắc trên robot!"
            print(f"   ⚠️ {msg}")

        return {
            "stopCommandSent": stop_command_sent,
            "stopConfirmed": stop_confirmed,
            "message": msg
        }

    def emergency_stop_robot(self) -> Dict[str, Any]:
        """Thực thi dừng khẩn cấp: Hủy tiến trình con, đánh dấu stop_requested và gọi lệnh dừng robot."""
        print("\n🚨 [KHẨN CẤP] ĐANG GỬI LỆNH DỪNG ROBOT VÀ TIẾN TRÌNH...")
        self.stop_requested = True

        # 1. Kill tiến trình học sinh nếu đang chạy
        process_terminated = False
        if self.current_process and self.current_process.poll() is None:
            try:
                self.current_process.terminate()
                try:
                    self.current_process.wait(timeout=1.5)
                except subprocess.TimeoutExpired:
                    self.current_process.kill()
                process_terminated = True
                print("   -> Đã dừng tiến trình Python của học sinh.")
            except Exception as e:
                print(f"   -> Lỗi khi dừng tiến trình con: {e}")
        else:
            process_terminated = True

        # 2. Gọi lệnh dừng độc lập
        stop_res = self.send_stop_command()
        stop_res["processTerminated"] = process_terminated
        return stop_res

    async def execute_task(self, ws, task_data: Dict[str, Any]):
        """Thực thi một tác vụ an toàn với khóa đơn nhiệm (Stage 1, Stage 2, hoặc Stage 3)."""
        async with self.task_lock:
            task_id = task_data.get("id")
            task_type = task_data.get("type", "stage3_run")
            code = task_data.get("code", "")
            robot_ip = task_data.get("robotIp", self.robot_ip)

            self.current_task_id = task_id
            self.current_task_type = task_type
            self.stop_requested = False

            print(f"\n▶ Bắt đầu tác vụ [{task_type}] ID: {task_id}")
            await ws.send(json.dumps({
                "type": "task:status",
                "taskId": task_id,
                "status": "running"
            }))

            # Tạo thư mục làm việc riêng biệt (temporary directory)
            temp_dir = tempfile.mkdtemp(prefix=f"ugot_{task_id[:8]}_")
            script_file = os.path.join(temp_dir, "run_task.py")

            try:
                with open(script_file, "w", encoding="utf-8") as f:
                    f.write(code)

                # Môi trường sạch: Không truyền token hay bí mật của LMS vào tiến trình con
                clean_env = os.environ.copy()
                clean_env.pop("DEVICE_TOKEN", None)
                clean_env.pop("FIREBASE_API_KEY", None)
                clean_env.pop("GEMINI_API_KEY", None)
                clean_env["PYTHONUNBUFFERED"] = "1"
                clean_env["UGOT_ROBOT_IP"] = robot_ip

                start_time = time.time()
                self.current_process = subprocess.Popen(
                    [self.python_path, "-u", script_file],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,
                    cwd=temp_dir,
                    env=clean_env
                )

                # Đọc đồng thời stdout và stderr
                async def stream_output(pipe, stream_name):
                    loop = asyncio.get_event_loop()
                    while True:
                        line = await loop.run_in_executor(None, pipe.readline)
                        if not line:
                            break
                        print(f"[{stream_name}] {line}", end="")
                        try:
                            await ws.send(json.dumps({
                                "type": "task:update",
                                "taskId": task_id,
                                "stream": stream_name,
                                "chunk": line,
                                "timestamp": int(time.time() * 1000)
                            }))
                        except Exception:
                            break

                stdout_task = asyncio.create_task(stream_output(self.current_process.stdout, "stdout"))
                stderr_task = asyncio.create_task(stream_output(self.current_process.stderr, "stderr"))

                # Giới hạn thời gian (Timeout 35s cho Stage 3, 10s cho Stage 1/2)
                timeout_limit = 12 if task_type in ("stage1_test", "stage2_connect") else 40

                exit_code = None
                try:
                    while self.current_process.poll() is None:
                        if self.stop_requested:
                            raise KeyboardInterrupt("Stop requested")
                        if time.time() - start_time > timeout_limit:
                            raise TimeoutError(f"Quá thời gian thực thi ({timeout_limit}s)")
                        await asyncio.sleep(0.1)

                    exit_code = self.current_process.poll()
                    await stdout_task
                    await stderr_task
                except TimeoutError as te:
                    print(f"\n⏰ Hết thời gian chờ: {te}")
                    if self.current_process and self.current_process.poll() is None:
                        self.current_process.kill()
                    await ws.send(json.dumps({
                        "type": "task:update",
                        "taskId": task_id,
                        "stream": "stderr",
                        "chunk": f"\n❌ LỖI: Tác vụ vượt quá giới hạn thời gian chạy ({timeout_limit} giây).\n",
                        "timestamp": int(time.time() * 1000)
                    }))
                    exit_code = -1
                except (KeyboardInterrupt, asyncio.CancelledError):
                    print(f"\n🛑 Tác vụ bị hủy theo yêu cầu.")
                    exit_code = -2

                # Xử lý dừng robot an toàn sau tác vụ: dùng send_stop_command() để không kích hoạt stop_requested
                stop_info = {"stopCommandSent": False, "stopConfirmed": False, "message": "Không phải tác vụ điều khiển robot."}
                if task_type == "stage3_run":
                    stop_info = self.send_stop_command()

                final_status = "cancelled" if self.stop_requested else ("completed" if exit_code == 0 else "error")

                is_stop_confirmed = stop_info.get("stopConfirmed", False)
                await ws.send(json.dumps({
                    "type": "task:completed",
                    "taskId": task_id,
                    "exitCode": exit_code,
                    "status": final_status,
                    "processTerminated": True,
                    "stopCommandSent": stop_info.get("stopCommandSent", False),
                    "stopConfirmed": is_stop_confirmed,
                    "robotStopped": is_stop_confirmed,
                    "stopMessage": stop_info.get("message", ""),
                    "elapsed": round(time.time() - start_time, 2)
                }))
                print(f"✔ Hoàn thành tác vụ [{task_id}] với trạng thái: {final_status} (Dừng robot: {is_stop_confirmed})")

            except Exception as e:
                print(f"❌ Lỗi thực thi tác vụ: {e}")
                await ws.send(json.dumps({
                    "type": "task:completed",
                    "taskId": task_id,
                    "exitCode": -1,
                    "status": "error",
                    "error": str(e),
                    "processTerminated": True,
                    "stopCommandSent": False,
                    "stopConfirmed": False,
                    "robotStopped": False,
                    "stopMessage": "Chưa xác nhận dừng sau sự cố lỗi ngoại lệ."
                }))
            finally:
                self.current_process = None
                self.current_task_id = None
                # Dọn dẹp thư mục tạm
                try:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                except Exception:
                    pass

    async def run(self):
        """Vòng lặp chính kết nối WebSocket và nhận lệnh."""
        ws_url = self.get_ws_url()
        print_banner()
        print(f"📍 Tên thiết bị: {self.device_name} ({self.device_id})")
        print(f"🐍 Python thực thi: {self.python_path}")
        print(f"🤖 Robot chỉ định: {self.robot_name} (IP: {self.robot_ip})")
        print(f"🌐 Máy chủ LMS: {self.server_url}")
        print("-" * 65)
        print("Đang kết nối tới máy chủ LMS chuyển tiếp...")

        retry_delay = 2

        while True:
            try:
                async with websockets.connect(
                    ws_url,
                    ping_interval=15,
                    ping_timeout=20,
                    close_timeout=5
                ) as ws:
                    self.is_connected = True
                    retry_delay = 2
                    print("\n🟢 [KẾT NỐI THÀNH CÔNG] Cầu nối đang trực tuyến trên LMS!")
                    print("   Sẵn sàng nhận lệnh thực hành robot từ giáo viên & học sinh.")
                    print("   Nhấn Ctrl + C tại cửa sổ này để dừng khẩn cấp / ngắt cầu nối.\n")

                    # Gửi tin nhắn chào mừng kèm thông tin hệ thống
                    py_test = test_python_executable(self.python_path)
                    await ws.send(json.dumps({
                        "type": "bridge:hello",
                        "deviceId": self.device_id,
                        "deviceName": self.device_name,
                        "pythonPath": self.python_path,
                        "pythonVersion": py_test.get("version", "Python 3.x"),
                        "hasUgot": py_test.get("has_ugot", False),
                        "robotIp": self.robot_ip,
                        "robotName": self.robot_name
                    }))

                    # Lắng nghe thông điệp từ máy chủ LMS
                    async for message in ws:
                        try:
                            data = json.loads(message)
                            msg_type = data.get("type")

                            if msg_type == "ping":
                                await ws.send(json.dumps({"type": "pong"}))

                            elif msg_type == "task:dispatch":
                                # Tác vụ mới được gửi xuống
                                task_data = data.get("task", {})
                                task_id = task_data.get("id")
                                expires_at = task_data.get("expiresAt")

                                # 1. Kiểm tra thời hạn hiệu lực (Prevent stale/expired commands)
                                if expires_at and (time.time() * 1000 > expires_at):
                                    print(f"⚠️ Từ chối tác vụ {task_id}: Đã hết hạn hiệu lực.")
                                    await ws.send(json.dumps({
                                        "type": "task:completed",
                                        "taskId": task_id,
                                        "status": "error",
                                        "exitCode": -1,
                                        "error": "Tác vụ đã quá hạn thời gian hiệu lực.",
                                        "processTerminated": True,
                                        "stopCommandSent": False,
                                        "stopConfirmed": False,
                                        "robotStopped": False
                                    }))
                                    continue

                                # 2. Kiểm tra chống chạy lại (Anti-replay attack/duplicate)
                                if task_id in self.seen_task_ids:
                                    print(f"⚠️ Từ chối tác vụ {task_id}: Tác vụ trùng lặp đã từng thực thi.")
                                    await ws.send(json.dumps({
                                        "type": "task:completed",
                                        "taskId": task_id,
                                        "status": "error",
                                        "exitCode": -1,
                                        "error": "Tác vụ đã được thực thi trước đó (chống chạy trùng).",
                                        "processTerminated": True,
                                        "stopCommandSent": False,
                                        "stopConfirmed": False,
                                        "robotStopped": False
                                    }))
                                    continue

                                # 3. Khóa đơn nhiệm: Không cho phép chạy nhiều execute_task đồng thời
                                if self.task_lock.locked():
                                    print(f"⚠️ Từ chối tác vụ {task_id}: Laptop đang bận tác vụ khác.")
                                    await ws.send(json.dumps({
                                        "type": "task:completed",
                                        "taskId": task_id,
                                        "status": "error",
                                        "exitCode": -1,
                                        "error": "Laptop đang bận thực thi tác vụ khác. Hãy đợi tác vụ trước hoàn tất.",
                                        "processTerminated": True,
                                        "stopCommandSent": False,
                                        "stopConfirmed": False,
                                        "robotStopped": False
                                    }))
                                    continue

                                self.seen_task_ids.add(task_id)
                                asyncio.create_task(self.execute_task(ws, task_data))

                            elif msg_type == "task:stop":
                                # Lệnh dừng khẩn cấp từ LMS
                                stop_res = self.emergency_stop_robot()
                                await ws.send(json.dumps({
                                    "type": "task:stopped",
                                    "taskId": data.get("taskId"),
                                    "stopConfirmed": stop_res.get("stopConfirmed"),
                                    "stopMessage": stop_res.get("message")
                                }))

                            elif msg_type == "device:update_config":
                                # Giáo viên cập nhật IP robot từ xa
                                if data.get("robotIp"):
                                    self.robot_ip = data.get("robotIp")
                                    self.config["robot_ip"] = self.robot_ip
                                    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                                        json.dump(self.config, f, indent=2, ensure_ascii=False)
                                    print(f"ℹ Đã cập nhật IP Robot từ LMS: {self.robot_ip}")

                        except json.JSONDecodeError:
                            pass
                        except Exception as e:
                            print(f"Lỗi xử lý tin nhắn: {e}")

            except (websockets.exceptions.ConnectionClosedError, websockets.exceptions.ConnectionClosedOK) as e:
                print(f"🔴 Mất kết nối tới máy chủ ({e}). Thử lại sau {retry_delay}s...")
            except Exception as e:
                print(f"🔴 Lỗi kết nối: {e}. Đang thử kết nối lại sau {retry_delay}s...")

            self.is_connected = False
            # Nếu đang chạy robot mà mất kết nối, dừng ngay lập tức
            if self.current_process:
                self.emergency_stop_robot()

            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 1.5, 30)


def main():
    config = load_config()
    bridge = UgotBridge(config)

    try:
        asyncio.run(bridge.run())
    except KeyboardInterrupt:
        print("\n\n🛑 ĐANG TẮT CẦU NỐI VÀ DỪNG ROBOT AN TOÀN...")
        bridge.emergency_stop_robot()
        print("Tạm biệt! Cầu nối đã đóng.")


if __name__ == "__main__":
    main()
