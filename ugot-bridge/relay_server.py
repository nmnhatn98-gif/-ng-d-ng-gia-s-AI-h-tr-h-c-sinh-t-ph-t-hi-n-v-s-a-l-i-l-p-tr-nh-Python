#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Standalone UGOT Relay Server (Bảo mật có xác thực & Phân quyền)
-----------------------------------------------------------------
Dành cho các trường học muốn chạy Relay độc lập trên máy chủ mạng LAN
khi đường truyền Internet trường bị tường lửa chặn WebSocket ra ngoài.

LƯU Ý BẢO MẬT:
Mặc định máy chủ này sẽ TỪ CHỐI hoạt động nếu chưa được cấu hình
khóa bí mật xác thực (RELAY_AUTH_SECRET). Không mở cổng công khai
khi chưa thiết lập mật mã ủy quyền.
"""

import sys
import os
import json
import asyncio
import hmac
import argparse
from typing import Dict, Set

try:
    import websockets
except ImportError:
    print("Vui lòng cài đặt thư viện mạng: pip install websockets")
    sys.exit(1)

PORT = int(os.environ.get("RELAY_PORT", 8765))
AUTH_SECRET = os.environ.get("RELAY_AUTH_SECRET", "")

bridges: Dict[str, websockets.WebSocketServerProtocol] = {}
web_clients: Dict[str, Set[websockets.WebSocketServerProtocol]] = {}


def verify_token(provided_token: str, expected_secret: str) -> bool:
    if not expected_secret or not provided_token:
        return False
    return hmac.compare_digest(provided_token, expected_secret)


async def handler(websocket, path):
    # Parse query params
    query = ""
    if "?" in path:
        query = path.split("?")[1]
    params = dict(qp.split("=", 1) for qp in query.split("&") if "=" in qp)

    client_type = params.get("type", "web")
    device_id = params.get("deviceId", "default")
    token = params.get("token", "")

    # Bắt buộc xác thực bảo mật
    if not AUTH_SECRET:
        print("❌ [TỪ CHỐI KẾT NỐI] Relay độc lập đang bị khóa vì chưa thiết lập RELAY_AUTH_SECRET.")
        await websocket.close(4003, "Relay server is disabled until RELAY_AUTH_SECRET is configured.")
        return

    if not verify_token(token, AUTH_SECRET):
        print(f"❌ [TỪ CHỐI XÁC THỰC] Client từ chối: Token không hợp lệ cho thiết bị {device_id}.")
        await websocket.close(4001, "Unauthorized: Invalid or missing authentication token.")
        return

    if client_type == "bridge":
        bridges[device_id] = websocket
        print(f"🟢 [BRIDGE ĐÃ XÁC THỰC] Thiết bị: {device_id}")

        try:
            async for message in websocket:
                # Chuyển tiếp tới các web clients đang lắng nghe device này
                listeners = web_clients.get(device_id, set())
                dead = set()
                for client in listeners:
                    try:
                        await client.send(message)
                    except Exception:
                        dead.add(client)
                listeners.difference_update(dead)
        finally:
            if bridges.get(device_id) == websocket:
                del bridges[device_id]
            print(f"🔴 [BRIDGE NGẮT] Thiết bị: {device_id}")

    else:
        # Web client (Browser LMS đã có token hợp lệ)
        if device_id not in web_clients:
            web_clients[device_id] = set()
        web_clients[device_id].add(websocket)
        print(f"👤 [CLIENT LMS ĐÃ XÁC THỰC] Đang giám sát thiết bị: {device_id}")

        try:
            async for message in websocket:
                # Kiểm tra cấu trúc tin nhắn để chống injection
                try:
                    payload = json.loads(message)
                    msg_type = payload.get("type")
                    if msg_type not in ("ping", "task:dispatch", "task:stop", "device:update_config"):
                        print(f"⚠️ Từ chối tin nhắn không hợp lệ: {msg_type}")
                        continue
                except Exception:
                    continue

                # Chuyển tiếp lệnh từ web xuống bridge
                bridge_ws = bridges.get(device_id)
                if bridge_ws:
                    await bridge_ws.send(message)
                else:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": "Cầu nối laptop hiện đang ngoại tuyến."
                    }))
        finally:
            web_clients.get(device_id, set()).discard(websocket)
            print(f"👤 [CLIENT LMS RỜI] Thiết bị: {device_id}")


async def main():
    parser = argparse.ArgumentParser(description="Standalone Authenticated UGOT Relay Server")
    parser.add_argument("--port", type=int, default=PORT, help=f"Cổng chạy Relay (mặc định: {PORT})")
    parser.add_argument("--secret", type=str, default="", help="Khóa bí mật dùng để xác thực kết nối")
    args = parser.parse_args()

    global AUTH_SECRET, PORT
    if args.secret:
        AUTH_SECRET = args.secret
    PORT = args.port

    print("=" * 65)
    print("UGOT STANDALONE RELAY SERVER (MẠNG LAN)")
    print("=" * 65)

    if not AUTH_SECRET:
        print("⚠️  CẢNH BÁO AN TOÀN:")
        print("   Máy chủ Relay độc lập ĐANG BỊ KHÓA để bảo vệ an toàn mạng LAN.")
        print("   Mọi kết nối sẽ bị từ chối cho đến khi bạn cung cấp mã xác thực.")
        print()
        print("   Cách khởi chạy có bảo vệ mật mã:")
        print(f"   python relay_server.py --secret <KHOA_BI_MAT_CUA_BAN> --port {PORT}")
        print("   hoặc đặt biến môi trường: export RELAY_AUTH_SECRET=<KHOA_BI_MAT_CUA_BAN>")
        print("=" * 65)
    else:
        print(f"🔒 Chế độ xác thực: BẬT (Đã nạp Shared Secret Token)")
        print(f"🚀 Máy chủ đang lắng nghe trên: ws://0.0.0.0:{PORT}")
        print("=" * 65)

    async with websockets.serve(handler, "0.0.0.0", PORT):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
