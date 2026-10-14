# HƯỚNG DẪN CẦU NỐI PYTHON ROBOT UGOT TRÊN WINDOWS
*(Dành cho Giáo viên và Học sinh - Hệ thống CodeHiểu: Học Python cùng gia sư AI)*

---

## 1. Giới thiệu & Nguyên lý hoạt động

Cầu nối **UGOT Bridge** là chương trình Python chạy trực tiếp trên laptop Windows của giáo viên hoặc các nhóm học sinh trong phòng Lab. 

```
[Trình duyệt LMS (Học sinh/Giáo viên)]
                 │  (WSS qua Internet)
                 ▼
     [Máy chủ LMS Relay]
                 ▲
                 │  (WSS kết nối ra, không cần mở cổng)
      [Cầu nối trên Laptop Windows]
                 │  (Thư viện ugot Python)
                 ▼  (WiFi nội bộ / Cáp mạng)
          [Robot UGOT]
```

### Các ưu điểm kỹ thuật:
- **Không mở cổng (Port Forwarding)**: Cầu nối chủ động tạo kết nối ra ngoài qua WebSocket bảo mật (WSS). Không yêu cầu đổi cấu hình Router trường học hay tắt Firewall.
- **Hỗ trợ mọi bản Python**: Tự động nhận diện Thonny IDE, Python 3.8 - 3.12, Anaconda hoặc đường dẫn tùy chỉnh.
- **Dừng an toàn đa tầng**: Khi bấm "Dừng khẩn cấp" trên LMS hoặc tại laptop, cầu nối vừa ngắt tiến trình vừa gọi lệnh `rb.transform_stop()` riêng biệt để triệt tiêu chuyển động cơ học.
- **Bảo mật phân quyền**: Học sinh chỉ thấy robot thuộc lớp của mình. Mã chạy phải được Giáo viên duyệt trước khi truyền xuống robot vật lý.

---

## 2. Chuẩn bị trước khi sử dụng

1. **Laptop chạy Windows 10/11** có kết nối chung mạng WiFi với Robot UGOT.
2. **Đã cài đặt Python hoặc Thonny IDE**.
3. **Thư viện UGOT**: Nếu chưa cài, mở Command Prompt và chạy:
   ```cmd
   python -m pip install ugot
   ```
   *(Nếu dùng Thonny: Thonny > Tools > Manage packages > gõ `ugot` > Install).*
4. **Robot UGOT**: Đã bật nguồn, kết nối WiFi và biết địa chỉ IP của robot (VD: `192.168.7.88`).

---

## 3. Thiết lập lần đầu (Chỉ làm 1 lần trên mỗi laptop)

1. Nhấp đúp vào tệp **`start_bridge.bat`** trong thư mục này.
2. Chương trình sẽ tự động mở màn hình hướng dẫn từng bước:
   - **Bước 1**: Đặt tên nhận diện máy (VD: `Laptop Nhóm 1 - Bàn A`).
   - **Bước 2**: Chọn bản Python muốn sử dụng (chọn số thứ tự của Thonny hoặc Python mong muốn).
   - **Bước 3**: Nhập địa chỉ máy chủ LMS (nhấn Enter để dùng mặc định).
   - **Bước 4**: Nhập **Mã ghép nối (Pairing Code)**:
     - Giáo viên đăng nhập vào website LMS > vào mục **Quản lý Robot UGOT** > bấm **"Tạo mã ghép nối laptop"** (mã gồm 6 chữ số có hiệu lực 15 phút).
     - Nhập mã vào cửa sổ laptop.
   - **Bước 5**: Nhập địa chỉ IP của robot UGOT (VD: `192.168.7.88`).
3. Cầu nối tự động lưu cấu hình bảo mật vào tệp `config.json` và kết nối trực tuyến ngay lập tức!

---

## 4. Hướng dẫn sử dụng hằng ngày

### Dành cho Giáo viên:
1. Mở laptop và bật `start_bridge.bat`.
2. Đăng nhập LMS trên trình duyệt, mở tab **Robot UGOT**.
3. Bảng điều khiển sẽ hiện chấm xanh **"🟢 Cầu nối trực tuyến"**.
4. Thực hiện theo 3 giai đoạn chuẩn:
   - **Giai đoạn 1**: Bấm nút **"Kiểm tra Python trên Laptop"** để xác nhận laptop giao tiếp tốt và import được thư viện `ugot`.
   - **Giai đoạn 2**: Bấm nút **"Kết nối Robot"** để kiểm tra robot tại IP đã cấu hình có phản hồi hay không.
   - **Giai đoạn 3 (Thực hành)**: Bật chế độ nhận bài. Khi học sinh gửi bài, giáo viên xem trước mã, bấm **"Duyệt & Cho chạy"** hoặc trực tiếp gửi chạy mã giáo viên.

### Dành cho Học sinh:
1. Đăng nhập tài khoản học sinh trên LMS (trên máy tính hoặc máy tính bảng/điện thoại).
2. Vào **Phòng thực hành** > chọn mục **Robot UGOT**.
3. Chọn laptop/robot được phân công cho nhóm của mình.
4. Viết mã điều khiển robot (sử dụng các hàm như `transform_set_chassis_height`, `transform_move_speed`, `transform_turn_speed`, `transform_stop`).
5. Bấm **"Gửi bài chờ Giáo viên duyệt"**.
6. Theo dõi kết quả in ra màn hình (stdout/stderr) theo thời gian thực khi robot hoạt động.

---

## 5. Cơ chế Dừng Khẩn Cấp & An Toàn Vật Lý

Khi robot có hành vi di chuyển ngoài tầm kiểm soát:
1. **Nút Dừng Khẩn Cấp trên Website**: Bấm nút màu đỏ to **"⏹ DỪNG KHẨN CẤP"** trên thanh công cụ LMS.
2. **Nút Dừng trên Cửa sổ Laptop**: Nhấn tổ hợp phím **`Ctrl + C`** trên cửa sổ đen của cầu nối `bridge.py`.
3. **Dừng Vật Lý (Physical Emergency Stop)**:
   - Gạt công tắc nguồn trên thân robot UGOT sang vị trí **OFF**, hoặc:
   - Nhấc bổng robot lên khỏi mặt sàn để bánh xe không chạm đất.

---

## 6. Thêm nhiều Laptop & Đổi cấu hình IP

- **Thêm laptop mới**: Sao chép thư mục `ugot-bridge` sang laptop khác, xóa tệp `config.json` (nếu có), chạy `start_bridge.bat` và nhập mã ghép nối mới do Giáo viên tạo trên LMS.
- **Đổi IP robot**: Có thể đổi trực tiếp trên giao diện website LMS (Giáo viên > Cài đặt thiết bị > Sửa IP) hoặc chỉnh sửa trong tệp `config.json`.
- **Thu hồi thiết bị (Revoke)**: Giáo viên bấm "Thu hồi thiết bị" trên LMS để hủy quyền của laptop cũ.
