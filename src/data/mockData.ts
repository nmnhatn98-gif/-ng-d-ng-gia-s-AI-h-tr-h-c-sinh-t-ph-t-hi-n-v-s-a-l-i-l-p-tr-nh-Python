import { Lesson, ClassItem, Submission } from "../types";

export const INITIAL_CLASSES: ClassItem[] = [];

export const INITIAL_LESSONS: Lesson[] = [
  // --- TIỂU HỌC: SCRATCH & TRẮC NGHIỆM ---
  {
    id: "les-elem-scratch-01",
    title: "Lập trình Scratch: Mèo đuổi bắt Chuột thông minh",
    description: "Học cách sử dụng khối lệnh Sự kiện (When Flag Clicked), Vòng lặp liên tục (Forever) và Điều khiển nhân vật theo con trỏ chuột.",
    level: "elementary",
    moduleType: "scratch",
    scratchProjectId: "10128407", // Popular Scratch open project ID
    durationMinutes: 45,
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "les-elem-quiz-01",
    title: "Khảo sát kiến thức Máy tính & An toàn số cơ bản",
    description: "Bộ câu hỏi trắc nghiệm trực quan giúp học sinh Tiểu học nhận biết các bộ phận máy tính và văn hóa dùng mạng an toàn.",
    level: "elementary",
    moduleType: "quiz",
    durationMinutes: 30,
    createdAt: "2026-09-02T09:00:00Z",
    questions: [
      {
        id: "q1",
        question: "Thiết bị nào sau đây dùng để đưa thông tin, mệnh lệnh vào máy tính (Thiết bị vào)?",
        options: ["Màn hình máy tính", "Bàn phím và Chuột", "Máy in", "Loa nghe nhạc"],
        correctIndex: 1,
        explanation: "Bàn phím và chuột giúp chúng ta gõ chữ và điều khiển con trỏ, đưa dữ liệu vào máy tính.",
      },
      {
        id: "q2",
        question: "Khi cần lưu trữ bài vẽ hoặc tệp văn bản lâu dài, máy tính sẽ ghi vào đâu?",
        options: ["Bộ nhớ ổ đĩa (Ổ cứng/SSD)", "Màn hình", "Dây nguồn", "Chuột máy tính"],
        correctIndex: 0,
        explanation: "Ổ cứng (HDD/SSD) hoặc thẻ nhớ là nơi lưu trữ dữ liệu lâu dài ngay cả khi tắt máy.",
      },
      {
        id: "q3",
        question: "Hành động nào sau đây là AN TOÀN khi em sử dụng mạng Internet?",
        options: [
          "Cung cấp địa chỉ nhà và số điện thoại cho người lạ trên mạng",
          "Đặt mật khẩu dễ đoán như 123456",
          "Hỏi ý kiến bố mẹ/thầy cô khi gặp thông tin đáng ngờ",
          "Bấm vào mọi đường link quảng cáo lạ xuất hiện",
        ],
        correctIndex: 2,
        explanation: "Luôn chia sẻ và hỏi ý kiến người lớn tin cậy khi tiếp xúc với nội dung lạ trên mạng xã hội.",
      },
      {
        id: "q4",
        question: "Trong phần mềm lập trình Scratch, khối lệnh 'Di chuyển 10 bước' thuộc nhóm lệnh màu nào?",
        options: ["Nhóm lệnh Chuyển động (Xanh lam)", "Nhóm lệnh Âm thanh (Hồng tím)", "Nhóm lệnh Sự kiện (Vàng)", "Nhóm lệnh Cảm biến (Xanh lơ)"],
        correctIndex: 0,
        explanation: "Các khối lệnh điều khiển vị trí, xoay và di chuyển nhân vật nằm trong mục Chuyển động (Motion).",
      },
    ],
  },

  // --- THCS & THPT: PYTHON & C++ VỚI TESTCASES ---
  {
    id: "les-prog-py-01",
    title: "Python: Tính tổng các số chẵn từ 1 đến N",
    description: "Nhập vào một số nguyên dương N. Viết chương trình tính và in ra tổng của tất cả các số chẵn trong phạm vi từ 1 đến N.",
    level: "middle",
    moduleType: "coding",
    language: "python",
    starterCode: `# Nhập vào số nguyên dương N
n = int(input())

# TODO: Tính tổng các số chẵn từ 1 đến n
tong = 0
for i in range(1, n + 1):
    if i % 2 == 0:
        tong += i

# In ra kết quả
print(tong)
`,
    testcases: [
      { id: 1, input: "10", expectedOutput: "30" },
      { id: 2, input: "5", expectedOutput: "6" },
      { id: 3, input: "1", expectedOutput: "0" },
      { id: 4, input: "20", expectedOutput: "110", isHidden: true },
    ],
    durationMinutes: 45,
    createdAt: "2026-09-03T10:00:00Z",
  },
  {
    id: "les-prog-py-02",
    title: "Python: Tìm số lớn thứ hai trong mảng số nguyên",
    description: "Cho dòng đầu tiên là số nguyên N (số lượng phần tử), dòng thứ hai gồm N số nguyên cách nhau bởi dấu cách. Tìm và in ra giá trị lớn thứ hai (Strict Second Maximum).",
    level: "middle",
    moduleType: "coding",
    language: "python",
    starterCode: `# Đọc dữ liệu
n = int(input())
arr = list(map(int, input().split()))

# Lấy các giá trị phân biệt và sắp xếp
unique_arr = sorted(list(set(arr)))

if len(unique_arr) < 2:
    print("NO")
else:
    print(unique_arr[-2])
`,
    testcases: [
      { id: 1, input: "5\n1 5 3 9 7", expectedOutput: "7" },
      { id: 2, input: "4\n4 4 4 4", expectedOutput: "NO" },
      { id: 3, input: "3\n10 20 20", expectedOutput: "10" },
    ],
    durationMinutes: 45,
    createdAt: "2026-09-04T10:00:00Z",
  },
  {
    id: "les-thcs-quiz-01",
    title: "Trắc nghiệm Cú pháp Python & Kiểu dữ liệu cơ bản (Khối THCS)",
    description: "Kiểm tra kiến thức về các kiểu dữ liệu int, float, str, toán tử logic và cấu trúc rẽ nhánh if-elif-else trong Python.",
    level: "middle",
    moduleType: "quiz",
    durationMinutes: 30,
    createdAt: "2026-09-04T14:00:00Z",
    questions: [
      {
        id: "q_py_1",
        question: "Trong Python, kết quả của phép toán 17 // 5 là bao nhiêu?",
        options: ["3.4", "3", "2", "3.0"],
        correctIndex: 1,
        explanation: "Toán tử // là phép chia lấy phần nguyên trong Python: 17 // 5 = 3.",
      },
      {
        id: "q_py_2",
        question: "Để nhập một số nguyên từ bàn phím trong Python, cú pháp nào sau đây là chính xác?",
        options: ["n = readInt()", "n = int(input())", "n = input(int)", "cin >> n;"],
        correctIndex: 1,
        explanation: "Hàm input() trả về chuỗi, ta dùng hàm int() bao ngoài để ép kiểu sang số nguyên: int(input()).",
      },
      {
        id: "q_py_3",
        question: "Vòng lặp for i in range(1, 6) sẽ duyệt qua các giá trị i nào?",
        options: ["1, 2, 3, 4, 5, 6", "1, 2, 3, 4, 5", "0, 1, 2, 3, 4, 5", "2, 3, 4, 5"],
        correctIndex: 1,
        explanation: "range(start, stop) chạy từ start đến stop - 1, tức là 1, 2, 3, 4, 5.",
      },
    ],
  },
  {
    id: "les-web-html-01",
    title: "HTML5: Thiết kế Trang giới thiệu bản thân đầu tiên (Profile Card)",
    description: "Sử dụng các thẻ HTML5 cơ bản (h1, p, img, button) và định dạng CSS Flexbox để xây dựng trang cá nhân sinh động với hiệu ứng nút bấm tương tác.",
    level: "middle",
    moduleType: "html",
    language: "html",
    htmlStarter: `<div class="card">
  <h1>Xin chào, mình là học sinh THCS!</h1>
  <p>Đây là trang web đầu tiên mình tự tay viết bằng mã nguồn HTML.</p>
  <button onclick="alert('Chào mừng bạn đến với trang web của mình!')">Bấm chào mình nhé 👋</button>
</div>`,
    cssStarter: `body {
  font-family: Arial, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0fdf4;
}
.card {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
}
h1 { color: #15803d; }
button {
  margin-top: 15px;
  padding: 10px 20px;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}`,
    jsStarter: `console.log("Trang web HTML đã sẵn sàng!");`,
    durationMinutes: 45,
    createdAt: "2026-09-05T08:00:00Z",
  },
  {
    id: "les-web-html-02",
    title: "HTML5 & Form: Thiết kế Biểu mẫu khảo sát ý kiến học sinh",
    description: "Học cách sử dụng các thẻ <form>, <input>, <select>, <textarea> và viết mã JavaScript kiểm tra dữ liệu hợp lệ trước khi gửi form.",
    level: "high",
    moduleType: "html",
    language: "html",
    htmlStarter: `<div class="survey-box">
  <h2>Phiếu Khảo Sát Định Hướng Nghề Nghiệp STEM</h2>
  <form id="survey-form">
    <label>Họ tên: <input type="text" id="name" required /></label><br/><br/>
    <label>Ngành nghề mong muốn:
      <select id="career">
        <option>Kỹ sư Trí tuệ Nhân tạo (AI)</option>
        <option>Lập trình viên Phát triển Web</option>
        <option>Chuyên gia An ninh mạng</option>
      </select>
    </label><br/><br/>
    <button type="submit">Gửi phản hồi</button>
  </form>
</div>`,
    cssStarter: `body { font-family: sans-serif; padding: 20px; background: #f8fafc; }
.survey-box { max-width: 450px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; }
h2 { color: #1e293b; font-size: 18px; margin-bottom: 16px; }
input, select { width: 100%; padding: 8px 12px; margin-top: 4px; border: 1px solid #cbd5e1; border-radius: 6px; }
button { margin-top: 12px; background: #3b82f6; color: white; padding: 10px 16px; border: none; border-radius: 6px; cursor: pointer; }`,
    jsStarter: `document.getElementById('survey-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  alert('Cảm ơn ' + name + ' đã hoàn thành phiếu khảo sát!');
});`,
    durationMinutes: 45,
    createdAt: "2026-09-06T08:00:00Z",
  },
  // --- KHỐI THPT: LẬP TRÌNH PYTHON LỚP 10 (CHƯƠNG TRÌNH GDPT 2018) ---
  {
    id: "les-py10-01",
    title: "Python 10 - Bài 1: Biến, Kiểu dữ liệu & Các phép toán số học (GDPT 2018)",
    description: "Nhập vào hai số nguyên dương a và b trên cùng một dòng. Hãy viết chương trình Python in ra 5 dòng: dòng 1 là tổng a + b, dòng 2 là hiệu a - b, dòng 3 là tích a * b, dòng 4 là thương nguyên a // b, và dòng 5 là số dư a % b.",
    level: "high",
    moduleType: "coding",
    language: "python",
    starterCode: `# Nhập 2 số nguyên a và b trên cùng một dòng
a, b = map(int, input().split())

# In ra 5 dòng kết quả theo yêu cầu
print(a + b)
print(a - b)
print(a * b)
print(a // b)
print(a % b)
`,
    testcases: [
      { id: 1, input: "15 4", expectedOutput: "19\n11\n60\n3\n3" },
      { id: 2, input: "100 25", expectedOutput: "125\n75\n2500\n4\n0" },
      { id: 3, input: "7 9", expectedOutput: "16\n-2\n63\n0\n7" },
      { id: 4, input: "1000 33", expectedOutput: "1033\n967\n33000\n30\n10", isHidden: true },
    ],
    durationMinutes: 45,
    createdAt: "2026-09-08T08:00:00Z",
  },
  {
    id: "les-py10-02",
    title: "Python 10 - Bài 2: Cấu trúc rẽ nhánh if-elif-else & Kiểm tra tam giác",
    description: "Nhập vào độ dài 3 cạnh a, b, c là 3 số nguyên dương cách nhau bởi dấu cách. Kiểm tra xem 3 cạnh có tạo thành một tam giác hay không. Nếu có, in ra chu vi của tam giác. Nếu không, in ra 'KHONG PHAI TAM GIAC'.",
    level: "high",
    moduleType: "coding",
    language: "python",
    starterCode: `# Đọc 3 cạnh a, b, c
a, b, c = map(int, input().split())

# Kiểm tra bất đẳng thức tam giác
if a + b > c and a + c > b and b + c > a:
    print(a + b + c)
else:
    print("KHONG PHAI TAM GIAC")
`,
    testcases: [
      { id: 1, input: "3 4 5", expectedOutput: "12" },
      { id: 2, input: "1 2 5", expectedOutput: "KHONG PHAI TAM GIAC" },
      { id: 3, input: "6 8 10", expectedOutput: "24" },
      { id: 4, input: "7 10 5", expectedOutput: "22", isHidden: true },
      { id: 5, input: "10 2 2", expectedOutput: "KHONG PHAI TAM GIAC", isHidden: true },
    ],
    durationMinutes: 45,
    createdAt: "2026-09-08T09:00:00Z",
  },
  {
    id: "les-py10-03",
    title: "Python 10 - Bài 3: Vòng lặp for & Tính tổng bội số của 3 hoặc 5",
    description: "Nhập vào một số nguyên dương N (1 <= N <= 100000). Dùng vòng lặp for và hàm range() để tính và in ra tổng tất cả các số nguyên i (1 <= i <= N) sao cho i chia hết cho 3 hoặc chia hết cho 5.",
    level: "high",
    moduleType: "coding",
    language: "python",
    starterCode: `# Nhập số nguyên dương N
n = int(input())

# Tính tổng các số chia hết cho 3 hoặc 5
tong = 0
for i in range(1, n + 1):
    if i % 3 == 0 or i % 5 == 0:
        tong += i

# In ra kết quả
print(tong)
`,
    testcases: [
      { id: 1, input: "10", expectedOutput: "33" },
      { id: 2, input: "15", expectedOutput: "60" },
      { id: 3, input: "1", expectedOutput: "0" },
      { id: 4, input: "30", expectedOutput: "225", isHidden: true },
    ],
    durationMinutes: 45,
    createdAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "les-py10-04",
    title: "Python 10 - Bài 4: Vòng lặp while & Thuật toán Euclid tìm UCLN",
    description: "Nhập vào hai số nguyên dương a và b trên cùng một dòng. Sử dụng vòng lặp while theo thuật toán Euclid để tìm và in ra Ước chung lớn nhất (UCLN) của hai số a và b.",
    level: "high",
    moduleType: "coding",
    language: "python",
    starterCode: `# Đọc 2 số nguyên a và b
a, b = map(int, input().split())

# Thuật toán Euclid với vòng lặp while
while b != 0:
    r = a % b
    a = b
    b = r

# Kết quả UCLN là a
print(a)
`,
    testcases: [
      { id: 1, input: "24 36", expectedOutput: "12" },
      { id: 2, input: "17 19", expectedOutput: "1" },
      { id: 3, input: "100 80", expectedOutput: "20" },
      { id: 4, input: "123456 654321", expectedOutput: "3", isHidden: true },
    ],
    durationMinutes: 45,
    createdAt: "2026-09-08T11:00:00Z",
  },
  {
    id: "les-py10-05",
    title: "Python 10 - Bài 5: Kiểu dữ liệu Danh sách (List) & Tìm giá trị lớn nhất",
    description: "Cho dòng 1 là số nguyên N (1 <= N <= 1000) - số lượng phần tử. Dòng 2 chứa N số nguyên cách nhau bởi dấu cách. Tìm và in ra hai giá trị cách nhau bởi dấu cách: Giá trị lớn nhất (Max) và Chỉ số index đầu tiên xuất hiện của phần tử đó (bắt đầu từ 0).",
    level: "high",
    moduleType: "coding",
    language: "python",
    starterCode: `# Đọc dữ liệu mảng
n = int(input())
arr = list(map(int, input().split()))

# Tìm giá trị lớn nhất và chỉ số đầu tiên
max_val = max(arr)
max_idx = arr.index(max_val)

print(f"{max_val} {max_idx}")
`,
    testcases: [
      { id: 1, input: "5\n3 9 2 9 5", expectedOutput: "9 1" },
      { id: 2, input: "4\n-5 -2 -10 -1", expectedOutput: "-1 3" },
      { id: 3, input: "1\n42", expectedOutput: "42 0" },
      { id: 4, input: "6\n10 20 30 25 15 5", expectedOutput: "30 2", isHidden: true },
    ],
    durationMinutes: 45,
    createdAt: "2026-09-08T14:00:00Z",
  },
  {
    id: "les-py10-06",
    title: "Python 10 - Bài 6: Xử lý Xâu ký tự (String) & Kiểm tra Xâu đối xứng",
    description: "Nhập vào một chuỗi ký tự s. Kiểm tra xem chuỗi s sau khi chuyển hết về chữ thường và loại bỏ các khoảng trắng có phải là một xâu đối xứng (Palindrome) hay không. In ra 'YES' nếu đối xứng, ngược lại in ra 'NO'.",
    level: "high",
    moduleType: "coding",
    language: "python",
    starterCode: `# Đọc xâu ký tự
s = input().strip()

# Chuẩn hóa: chữ thường và bỏ khoảng trắng
cleaned = s.lower().replace(" ", "")

# Kiểm tra tính đối xứng bằng cắt lát [::-1]
if cleaned == cleaned[::-1]:
    print("YES")
else:
    print("NO")
`,
    testcases: [
      { id: 1, input: "madam", expectedOutput: "YES" },
      { id: 2, input: "race car", expectedOutput: "YES" },
      { id: 3, input: "python", expectedOutput: "NO" },
      { id: 4, input: "Aba", expectedOutput: "YES" },
      { id: 5, input: "Tin hoc 10", expectedOutput: "NO", isHidden: true },
    ],
    durationMinutes: 45,
    createdAt: "2026-09-08T15:00:00Z",
  },
  {
    id: "les-py10-07",
    title: "Python 10 - Bài 7: Xây dựng hàm (def) & Thuật toán Sắp xếp danh sách",
    description: "Dòng 1 là số nguyên N. Dòng 2 chứa N số nguyên cách nhau bởi dấu cách. Viết một hàm sap_xep(arr) sắp xếp các phần tử của danh sách theo thứ tự tăng dần bằng thuật toán sắp xếp chọn (Selection Sort). In ra danh sách sau khi sắp xếp trên cùng một dòng cách nhau bởi dấu cách.",
    level: "high",
    moduleType: "coding",
    language: "python",
    starterCode: `n = int(input())
arr = list(map(int, input().split()))

# Viết hàm sắp xếp chọn
def sap_xep_chon(a):
    n = len(a)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if a[j] < a[min_idx]:
                min_idx = j
        a[i], a[min_idx] = a[min_idx], a[i]
    return a

ket_qua = sap_xep_chon(arr)
print(" ".join(map(str, ket_qua)))
`,
    testcases: [
      { id: 1, input: "5\n5 2 9 1 5", expectedOutput: "1 2 5 5 9" },
      { id: 2, input: "4\n4 3 2 1", expectedOutput: "1 2 3 4" },
      { id: 3, input: "1\n7", expectedOutput: "7" },
      { id: 4, input: "6\n-3 10 0 -8 4 2", expectedOutput: "-8 -3 0 2 4 10", isHidden: true },
    ],
    durationMinutes: 45,
    createdAt: "2026-09-08T16:00:00Z",
  },
  {
    id: "les-py10-quiz-01",
    title: "Trắc nghiệm Lập trình Python 10: Cú pháp, Rẽ nhánh & Vòng lặp (GDPT 2018)",
    description: "Bộ câu hỏi trắc nghiệm rèn luyện và củng cố các khái niệm trọng tâm trong chương trình Tin học 10: biến, kiểu dữ liệu, hàm range, toán tử logic, cắt lát xâu và thao tác trên danh sách list.",
    level: "high",
    moduleType: "quiz",
    durationMinutes: 30,
    createdAt: "2026-09-08T17:00:00Z",
    questions: [
      {
        id: "q_py10_1",
        question: "Trong Python, tên biến nào sau đây là HỢP LỆ theo quy tắc đặt tên?",
        options: ["10_tin_hoc", "tong_diem", "class", "diem-so"],
        correctIndex: 1,
        explanation: "tong_diem là tên hợp lệ. Tên biến không được bắt đầu bằng chữ số (10_tin_hoc), không chứa dấu gạch ngang (diem-so) và không được trùng từ khóa của ngôn ngữ (class).",
      },
      {
        id: "q_py10_2",
        question: "Kết quả của biểu thức 19 // 4 và 19 % 4 lần lượt là bao nhiêu?",
        options: ["4 và 3", "4.75 và 3", "4 và 0", "3 và 4"],
        correctIndex: 0,
        explanation: "19 // 4 là phép chia lấy phần nguyên bằng 4. 19 % 4 là phép chia lấy phần dư bằng 3 (vì 19 = 4 * 4 + 3).",
      },
      {
        id: "q_py10_3",
        question: "Vòng lặp for i in range(2, 11, 2) sẽ duyệt qua những giá trị nào của biến i?",
        options: ["2, 4, 6, 8, 10", "2, 4, 6, 8, 10, 11", "1, 3, 5, 7, 9", "2, 3, 4, 5, 6, 7, 8, 9, 10"],
        correctIndex: 0,
        explanation: "Hàm range(start, stop, step) bắt đầu từ 2, bước nhảy là 2 và dừng trước 11. Các giá trị sinh ra là: 2, 4, 6, 8, 10.",
      },
      {
        id: "q_py10_4",
        question: "Cho chuỗi s = 'TIN HOC 10'. Lệnh print(s[0:3]) sẽ in ra kết quả gì?",
        options: ["'TIN'", "'TIN '", "'TI'", "'TIN HOC'"],
        correctIndex: 0,
        explanation: "Cắt lát chuỗi s[0:3] lấy các ký tự tại chỉ số 0, 1, 2, tương ứng là 'T', 'I', 'N'.",
      },
      {
        id: "q_py10_5",
        question: "Phương thức nào sau đây được dùng để thêm một phần tử vào cuối danh sách (list) trong Python?",
        options: ["add()", "push()", "append()", "insert_end()"],
        correctIndex: 2,
        explanation: "Trong Python, cú pháp list.append(x) dùng để bổ sung phần tử x vào cuối danh sách.",
      },
      {
        id: "q_py10_6",
        question: "Để định nghĩa một hàm (chương trình con) trong Python, ta sử dụng từ khóa nào?",
        options: ["function", "def", "procedure", "func"],
        correctIndex: 1,
        explanation: "Từ khóa 'def' được dùng để khai báo hàm trong Python, ví dụ: def tinh_tong(a, b): return a + b.",
      },
    ],
  },
  // --- KHỐI THPT: GIẢI THUẬT C++ & CHUYÊN TIN ---
  {
    id: "les-prog-cpp-01",
    title: "C++: Kiểm tra số nguyên tố và đếm số ước",
    description: "Nhập vào số nguyên dương N. Viết chương trình C++ in ra 'YES' nếu N là số nguyên tố, ngược lại in ra 'NO'.",
    level: "high",
    moduleType: "coding",
    language: "cpp",
    starterCode: `#include <iostream>
#include <cmath>
using namespace std;

bool isPrime(long long n) {
    if (n < 2) return false;
    for (long long i = 2; i <= sqrt(n); i++) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    long long n;
    if (cin >> n) {
        if (isPrime(n)) {
            cout << "YES";
        } else {
            cout << "NO";
        }
    }
    return 0;
}
`,
    testcases: [
      { id: 1, input: "7", expectedOutput: "YES" },
      { id: 2, input: "12", expectedOutput: "NO" },
      { id: 3, input: "1", expectedOutput: "NO" },
      { id: 4, input: "97", expectedOutput: "YES", isHidden: true },
    ],
    durationMinutes: 60,
    createdAt: "2026-09-05T14:00:00Z",
  },
  {
    id: "les-prog-cpp-02",
    title: "C++: Tìm kiếm nhị phân & Tối ưu hóa thời gian O(log N)",
    description: "Cho dãy N số nguyên đã sắp xếp tăng dần và một giá trị X. Dùng thuật toán Tìm kiếm nhị phân (Binary Search) để tìm vị trí (chỉ số 0) của X. Nếu không tìm thấy, in ra -1.",
    level: "high",
    moduleType: "coding",
    language: "cpp",
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int binarySearch(const vector<long long>& a, long long x) {
    int left = 0, right = a.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (a[mid] == x) return mid;
        if (a[mid] < x) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    int n;
    long long x;
    if (cin >> n >> x) {
        vector<long long> a(n);
        for (int i = 0; i < n; ++i) cin >> a[i];
        cout << binarySearch(a, x);
    }
    return 0;
}
`,
    testcases: [
      { id: 1, input: "5 7\n1 3 5 7 9", expectedOutput: "3" },
      { id: 2, input: "4 10\n2 4 6 8", expectedOutput: "-1" },
      { id: 3, input: "1 5\n5", expectedOutput: "0" },
      { id: 4, input: "6 100\n10 20 30 50 70 100", expectedOutput: "5", isHidden: true },
    ],
    durationMinutes: 60,
    createdAt: "2026-09-05T16:00:00Z",
  },
  {
    id: "les-thpt-quiz-01",
    title: "Trắc nghiệm Độ phức tạp thuật toán & Cấu trúc dữ liệu (Khối THPT)",
    description: "Bộ câu hỏi trắc nghiệm rèn luyện tư duy phân tích tiệm cận Big-O, mảng động vector, stack, queue và thuật toán sắp xếp.",
    level: "high",
    moduleType: "quiz",
    durationMinutes: 30,
    createdAt: "2026-09-05T17:00:00Z",
    questions: [
      {
        id: "q_thpt_1",
        question: "Độ phức tạp thời gian trung bình của thuật toán Tìm kiếm nhị phân (Binary Search) là gì?",
        options: ["O(N)", "O(log N)", "O(N log N)", "O(1)"],
        correctIndex: 1,
        explanation: "Mỗi bước so sánh chia đôi không gian tìm kiếm nên độ phức tạp là O(log N).",
      },
      {
        id: "q_thpt_2",
        question: "Cấu trúc dữ liệu Ngăn xếp (Stack) hoạt động theo nguyên lý nào?",
        options: ["FIFO (First In First Out)", "LIFO (Last In First Out)", "Ưu tiên độ dài", "Ngẫu nhiên"],
        correctIndex: 1,
        explanation: "Stack hoạt động theo cơ chế vào sau ra trước (LIFO: Last In First Out).",
      },
      {
        id: "q_thpt_3",
        question: "Trong C++, từ khóa nào dùng để cấp phát động một mảng hoặc đối tượng?",
        options: ["malloc", "new", "create", "alloc"],
        correctIndex: 1,
        explanation: "Trong C++, toán tử new dùng để cấp phát động vùng nhớ trên Heap.",
      },
    ],
  },

  // --- ROBOTICS & DỰ ÁN STEM VỚI RUBRIC ---
  {
    id: "les-stem-robot-01",
    title: "Dự án STEM: Xe tự hành tránh vật cản đa hướng & Điều khiển BLE",
    description: "Học sinh thiết kế phần cứng mạch vi điều khiển (Arduino/ESP32), cảm biến siêu âm Ultrasonic và viết thuật toán điều khiển động cơ PID tránh vật cản. Nộp link video YouTube/Drive chứng minh sản phẩm hoạt động và đính kèm file code (.ino/.cpp).",
    level: "robotics",
    moduleType: "robotics",
    durationMinutes: 120,
    createdAt: "2026-09-06T15:00:00Z",
    rubricTemplate: {
      maxIdea: 10,
      maxTechnique: 10,
      maxPresentation: 10,
    },
  },
  {
    id: "les-stem-robot-02",
    title: "Dự án STEM: Trạm quan trắc chất lượng không khí & Báo động khẩn cấp",
    description: "Chế tạo hệ thống IoT giám sát nồng độ bụi mịn PM2.5, khí CO và nhiệt độ môi trường. Gửi cảnh báo tự động về điện thoại. Nộp video hoạt động thực tế cùng file mã nguồn.",
    level: "robotics",
    moduleType: "robotics",
    durationMinutes: 120,
    createdAt: "2026-09-07T15:00:00Z",
    rubricTemplate: {
      maxIdea: 10,
      maxTechnique: 10,
      maxPresentation: 10,
    },
  },
];

export const INITIAL_SUBMISSIONS: Submission[] = [];
