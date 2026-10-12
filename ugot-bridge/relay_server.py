#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Standalone UGOT Relay Server (Tùy chọn dành cho mạng LAN nội bộ)
-----------------------------------------------------------------
Dành cho các trường học muốn chạy Relay độc lập trên máy chủ mạng LAN
khi đường truyền Internet trường bị tường lửa chặn WebSocket ra ngoài.
"""

import sys
import json
import asyncio
from typing import Dict, Set

try:
    import websockets
except ImportError:
    print("Vui lòng cài đặt: pip install websockets")
    sys.exit(1)

PORT = 8765
bridges: Dict[str, websockets.WebSocketServerProtocol] = {}
web_clients: Dict[str, Set[websockets.WebSocketServerProtocol]] = {}


async def handler(websocket, path):
    # Parse query params
    query = ""
    if "?" in path:
        query = path.split("?")[1]
    params = dict(qp.split("=", 1) for qp in query.split("&") if "=" in qp)

    client_type = params.get("type", "web")
    device_id = params.get("deviceId", "default")

    if client_type == "bridge":
        bridges[device_id] = websocket
        print(f"🟢 [BRIDGE KẾT NỐI] Thiết bị: {device_id}")

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
        # Web client (Browser LMS)
        if device_id not in web_clients:
            web_clients[device_id] = set()
        web_clients[device_id].add(websocket)
        print(f"👤 [CLIENT LMS KẾT NỐI] Đang theo dõi: {device_id}")

        try:
            async for message in websocket:
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
            print(f"👤 [CLIENT LMS RỜI]")


async def main():
    print(f"🚀 Relay Server nội bộ đang chạy trên ws://0.0.0.0:{PORT}")
    async with websockets.serve(handler, "0.0.0.0", PORT):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
