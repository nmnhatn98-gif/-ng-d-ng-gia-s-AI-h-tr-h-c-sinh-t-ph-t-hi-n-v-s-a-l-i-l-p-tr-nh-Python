import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Lesson, Submission, UserProfile, ChatMessage } from "../types";
import { 
  Play, 
  RotateCcw, 
  Download, 
  Copy, 
  Check, 
  Send, 
  Sparkles, 
  Terminal, 
  Code2, 
  Eye, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Maximize2, 
  Minimize2, 
  Bot, 
  Layers, 
  FileCode, 
  FileText, 
  Palette, 
  Zap, 
  HelpCircle, 
  CheckCircle2, 
  X, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Trash2
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface HtmlEditorModuleProps {
  lesson?: Lesson;
  currentUser: UserProfile;
  onBack?: () => void;
  onSubmitWork?: (submissionData: Partial<Submission>) => Promise<void>;
}

// Built-in starter templates for students
const STARTER_TEMPLATES: Record<string, {
  name: string;
  description: string;
  badge: string;
  html: string;
  css: string;
  js: string;
}> = {
  blank_html5: {
    name: "Khung HTML5 Chuẩn Trống (Mặc định)",
    description: "Cấu trúc chuẩn HTML5 với <!DOCTYPE html>, <html lang='vi'>, <head>, <meta charset='UTF-8'>, <meta name='viewport'>, <title> và phần thân <body> trống để học sinh tự do sáng tạo.",
    badge: "Mặc định",
    html: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trang Web Của Tôi</title>
</head>
<body>
  
</body>
</html>`,
    css: `/* Viết mã CSS để trang trí giao diện tại đây */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
}
`,
    js: `// Viết mã JavaScript để tạo tương tác tại đây
`,
  },
  profile_card: {
    name: "Mẫu 1: Trang Giới Thiệu Bản Thân (Profile Card)",
    description: "Trang hồ sơ cá nhân với ảnh đại diện, danh sách kỹ năng, sở thích và nút kết nối mạng xã hội.",
    badge: "Phổ biến",
    html: `<div class="card">
  <div class="header">
    <div class="avatar">👨‍💻</div>
    <h1>Nguyễn Minh Khang</h1>
    <p class="tagline">Học sinh Lớp 7A1 • Đam mê Tin học & STEM</p>
  </div>

  <div class="bio">
    <h3>Giới thiệu bản thân</h3>
    <p>Xin chào! Mình rất thích tìm hiểu lập trình web và sáng tạo mô hình robot tự hành. Ước mơ của mình là trở thành kỹ sư công nghệ trong tương lai.</p>
  </div>

  <div class="skills">
    <h3>Sở thích & Kỹ năng</h3>
    <div class="badge-list">
      <span class="badge">🌐 HTML5 / CSS3</span>
      <span class="badge">🐍 Python cơ bản</span>
      <span class="badge">🤖 Lắp ráp Robotics</span>
      <span class="badge">⚽ Chơi Bóng đá</span>
    </div>
  </div>

  <div class="interactive-section">
    <p id="counter-text">Số lượt học sinh ghé thăm trang: <span id="visit-count">1</span></p>
    <button id="like-btn">❤️ Thả tim cho trang (<span id="like-count">0</span>)</button>
  </div>
</div>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

body {
  background: linear-gradient(135deg, #e0e7ff 0%, #fae8ff 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.card {
  background: white;
  width: 100%;
  max-width: 440px;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.avatar {
  width: 80px;
  height: 80px;
  background: #eff6ff;
  border: 3px solid #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38px;
  margin: 0 auto 12px;
}

h1 {
  font-size: 22px;
  color: #1e293b;
  margin-bottom: 4px;
}

.tagline {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.bio, .skills {
  margin-top: 18px;
}

h3 {
  font-size: 14px;
  color: #334155;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bio p {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  background: #f1f5f9;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #cbd5e1;
}

.interactive-section {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
}

#counter-text {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 10px;
}

#like-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

#like-btn:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}`,
    js: `// Đếm số lượt thả tim
let likes = 0;
const likeBtn = document.getElementById("like-btn");
const likeCount = document.getElementById("like-count");

likeBtn.addEventListener("click", () => {
  likes++;
  likeCount.textContent = likes;
  console.log("Cảm ơn bạn đã thả tim! Tổng lượt thích hiện tại:", likes);
});

console.log("Trang web cá nhân đã tải thành công!");`,
  },

  stem_greeting: {
    name: "Thiệp Chúc Mừng STEM & Tri Ân Thầy Cô",
    description: "Trang web thiệp điện tử tương tác với hiệu ứng pháo hoa chúc mừng bằng HTML5 Canvas và CSS Animation.",
    badge: "Sáng tạo",
    html: `<div class="card-container">
  <div class="card-box">
    <div class="badge-tag">STEM TIN HỌC K12</div>
    <h2>Chúc Mừng Ngày Nhà Giáo & Tri Ân Thầy Cô</h2>
    <p class="wish">
      Kính chúc quý Thầy Cô luôn dồi dào sức khỏe, luôn tràn đầy nhiệt huyết để dẫn dắt các thế hệ học sinh trên con đường khám phá tri thức và công nghệ! 🌟
    </p>

    <div class="interactive-box">
      <button id="btn-fireworks">🎆 Bắn pháo hoa chúc mừng!</button>
      <button id="btn-bg-toggle">🎨 Đổi màu nền</button>
    </div>

    <div id="greeting-message" class="hidden">
      🎉 Thầy cô là người thắp sáng những ước mơ công nghệ! 🎉
    </div>
  </div>
</div>`,
    css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #0f172a;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  transition: background 0.5s ease;
}

.card-container {
  max-width: 500px;
  width: 100%;
}

.card-box {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid #334155;
  border-radius: 28px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.badge-tag {
  display: inline-block;
  background: #f59e0b;
  color: #0f172a;
  font-weight: 800;
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 1px;
  margin-bottom: 16px;
}

h2 {
  font-size: 22px;
  margin-bottom: 16px;
  background: linear-gradient(to right, #60a5fa, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.wish {
  font-size: 14px;
  line-height: 1.7;
  color: #cbd5e1;
  margin-bottom: 24px;
}

.interactive-box {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

button:hover {
  background: #2563eb;
  transform: scale(1.05);
}

#greeting-message {
  margin-top: 20px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px dashed #60a5fa;
  border-radius: 12px;
  font-weight: bold;
  font-size: 13px;
  color: #93c5fd;
  animation: fadeIn 0.4s ease;
}

.hidden {
  display: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}`,
    js: `const btnFireworks = document.getElementById("btn-fireworks");
const btnBgToggle = document.getElementById("btn-bg-toggle");
const msgBox = document.getElementById("greeting-message");

let isAlternativeBg = false;

btnFireworks.addEventListener("click", () => {
  msgBox.classList.remove("hidden");
  console.log("🎆 Pháo hoa đã được kích hoạt! Chúc mừng ngày hội!");
});

btnBgToggle.addEventListener("click", () => {
  isAlternativeBg = !isAlternativeBg;
  document.body.style.background = isAlternativeBg 
    ? "linear-gradient(135deg, #1e1b4b, #311042)" 
    : "#0f172a";
  console.log("🎨 Đã chuyển đổi bảng màu nền.");
});`,
  },

  club_form: {
    name: "Biểu Mẫu Đăng Ký CLB Tin Học (Form HTML)",
    description: "Học cách dùng các thẻ form: input text, radio, checkbox, select dropdown và nút gửi với xử lý kiểm tra dữ liệu.",
    badge: "Thực hành SGK",
    html: `<div class="form-card">
  <h2>Đăng Ký Tham Gia CLB STEM & Tin Học</h2>
  <p class="subtitle">Năm học 2026 - 2027 • Trường Phổ Thông</p>

  <form id="stem-club-form">
    <div class="form-group">
      <label for="fullname">Họ và tên học sinh:</label>
      <input type="text" id="fullname" placeholder="VD: Trần Bảo Nam" required />
    </div>

    <div class="form-group">
      <label for="grade-select">Khối lớp:</label>
      <select id="grade-select" required>
        <option value="">-- Vui lòng chọn khối lớp --</option>
        <option value="Khối 6">Khối 6</option>
        <option value="Khối 7">Khối 7</option>
        <option value="Khối 8">Khối 8</option>
        <option value="Khối 9">Khối 9</option>
        <option value="Khối THPT">Khối 10, 11, 12 THPT</option>
      </select>
    </div>

    <div class="form-group">
      <label>Phân môn muốn đăng ký:</label>
      <div class="radio-group">
        <label><input type="radio" name="club" value="Lập trình Web HTML/CSS" checked /> Lập trình Web HTML/CSS</label>
        <label><input type="radio" name="club" value="Lập trình Python" /> Lập trình Python</label>
        <label><input type="radio" name="club" value="Robotics & IoT" /> Robotics & IoT</label>
      </div>
    </div>

    <button type="submit" id="submit-btn">Gửi Đơn Đăng Ký</button>
  </form>

  <div id="result-box" class="result-box hidden">
    <h3>✅ Đăng Ký Thành Công!</h3>
    <p id="result-content"></p>
  </div>
</div>`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, sans-serif;
}

body {
  background: #f8fafc;
  padding: 24px 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.form-card {
  background: white;
  width: 100%;
  max-width: 480px;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

h2 {
  font-size: 18px;
  color: #0f172a;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

input[type="text"], select {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-size: 14px;
  outline: none;
}

input[type="text"]:focus, select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 6px;
}

button {
  width: 100%;
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

button:hover {
  background: #1d4ed8;
}

.result-box {
  margin-top: 20px;
  padding: 16px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  color: #065f46;
}

.result-box h3 {
  font-size: 15px;
  margin-bottom: 6px;
}

.result-box p {
  font-size: 13px;
  line-height: 1.5;
}

.hidden {
  display: none;
}`,
    js: `const form = document.getElementById("stem-club-form");
const resultBox = document.getElementById("result-box");
const resultContent = document.getElementById("result-content");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const name = document.getElementById("fullname").value;
  const grade = document.getElementById("grade-select").value;
  const club = document.querySelector('input[name="club"]:checked').value;

  resultContent.innerHTML = \`Học sinh: <strong>\${name}</strong> (\${grade}) đã đăng ký thành công vào CLB <strong>\${club}</strong>.\`;
  resultBox.classList.remove("hidden");

  console.log("Đã tiếp nhận đơn đăng ký mới:", { name, grade, club });
});`,
  },
};

// Useful quick HTML snippets for 1-click insertion
const QUICK_SNIPPETS = [
  { label: "<h1>", desc: "Tiêu đề lớn", snippet: "<h1>Tiêu đề chính</h1>\n" },
  { label: "<p>", desc: "Đoạn văn", snippet: "<p>Nội dung đoạn văn...</p>\n" },
  { label: "<button>", desc: "Nút bấm", snippet: "<button id=\"my-btn\">Bấm vào đây</button>\n" },
  { label: "<input>", desc: "Ô nhập", snippet: "<input type=\"text\" placeholder=\"Nhập văn bản...\" />\n" },
  { label: "<a>", desc: "Liên kết", snippet: "<a href=\"https://google.com\" target=\"_blank\">Truy cập liên kết</a>\n" },
  { label: "<img>", desc: "Hình ảnh", snippet: "<img src=\"https://picsum.photos/400/250\" alt=\"Ảnh minh họa\" style=\"max-width: 100%; border-radius: 12px;\" />\n" },
  { label: "<table>", desc: "Bảng biểu", snippet: `<table border="1" style="width: 100%; border-collapse: collapse;">
  <tr><th>STT</th><th>Họ tên</th><th>Điểm</th></tr>
  <tr><td>1</td><td>Học sinh A</td><td>10</td></tr>
</table>\n` },
  { label: "<form>", desc: "Biểu mẫu", snippet: `<form onsubmit="return false;">
  <label>Tên: <input type="text" required /></label>
  <button type="submit">Gửi</button>
</form>\n` },
  { label: "Flexbox", desc: "Bố cục chia cột", snippet: `<div style="display: flex; gap: 16px; justify-content: center;">
  <div style="flex: 1; padding: 16px; background: #e0f2fe; border-radius: 12px;">Cột 1</div>
  <div style="flex: 1; padding: 16px; background: #fef08a; border-radius: 12px;">Cột 2</div>
</div>\n` },
];

export const HtmlEditorModule: React.FC<HtmlEditorModuleProps> = ({
  lesson,
  currentUser,
  onBack,
  onSubmitWork,
}) => {
  // Code States
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("blank_html5");
  const [htmlCode, setHtmlCode] = useState<string>(
    lesson?.htmlStarter || STARTER_TEMPLATES.blank_html5.html
  );
  const [cssCode, setCssCode] = useState<string>(
    lesson?.cssStarter || STARTER_TEMPLATES.blank_html5.css
  );
  const [jsCode, setJsCode] = useState<string>(
    lesson?.jsStarter || STARTER_TEMPLATES.blank_html5.js
  );

  // Sync when lesson prop changes
  useEffect(() => {
    if (lesson) {
      setSelectedTemplateKey("blank_html5");
      setHtmlCode(lesson.htmlStarter || STARTER_TEMPLATES.blank_html5.html);
      setCssCode(lesson.cssStarter || STARTER_TEMPLATES.blank_html5.css);
      setJsCode(lesson.jsStarter || STARTER_TEMPLATES.blank_html5.js);
    } else {
      setSelectedTemplateKey("blank_html5");
      setHtmlCode(STARTER_TEMPLATES.blank_html5.html);
      setCssCode(STARTER_TEMPLATES.blank_html5.css);
      setJsCode(STARTER_TEMPLATES.blank_html5.js);
    }
  }, [lesson?.id]);

  // Active Editor Tab: HTML, CSS, JS
  const [activeCodeTab, setActiveCodeTab] = useState<"html" | "css" | "js">("html");
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">("vs-dark");

  // Device & Preview states
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [previewSrcDoc, setPreviewSrcDoc] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Console output from iframe
  const [consoleLogs, setConsoleLogs] = useState<{ id: string; type: "log" | "error" | "warn"; text: string; time: string }[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);

  // AI Assistant State
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: "ai-init",
      role: "assistant",
      content: `Xin chào ${currentUser.displayName}! Mình là Trợ lý AI Hướng dẫn Lập trình Web & HTML/CSS. 
      
Bạn có thể hỏi mình về:
- Ý nghĩa các thẻ HTML (như \`<h1>\`, \`<p>\`, \`<div>\`, \`<form>\`, \`<table>\`...)
- Cách phối màu và căn lề bằng CSS (Flexbox, Grid, Margin, Padding)
- Cách xử lý tương tác JavaScript (Sự kiện click, thay đổi màu sắc, tính toán điểm)

Hãy hỏi mình bất cứ lúc nào nhé! ✨`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [aiInput, setAiInput] = useState<string>("");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const aiBottomRef = useRef<HTMLDivElement>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Ref to iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build combined source document for iframe preview
  const compilePreview = (h: string, c: string, j: string) => {
    // If user provided a full HTML document in HTML tab
    const isFullHtml = h.toLowerCase().includes("<!doctype html") || h.toLowerCase().includes("<html");

    let combined = "";
    if (isFullHtml) {
      // Inject console interception and custom CSS/JS
      const consoleScript = `<script>
          (function() {
            function send(type, args) {
              try {
                const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
                window.parent.postMessage({ source: 'html-lab-console', type: type, message: msg }, '*');
              } catch(e) {}
            }
            console.log = function(...a) { send('log', a); };
            console.error = function(...a) { send('error', a); };
            console.warn = function(...a) { send('warn', a); };
            window.onerror = function(msg, src, line) {
              send('error', ['Lỗi dòng ' + line + ': ' + msg]);
            };
          })();
        </script>`;
      const styleBlock = c.trim() ? `<style>\n${c}\n</style>` : "";
      const headInjection = `${styleBlock}\n${consoleScript}`;

      if (/<\/head>/i.test(h)) {
        combined = h.replace(/<\/head>/i, `${headInjection}\n</head>`);
      } else if (/<body/i.test(h)) {
        combined = h.replace(/<body/i, `${headInjection}\n<body`);
      } else {
        combined = headInjection + "\n" + h;
      }

      if (j.trim()) {
        const jsBlock = `<script>try { ${j} } catch(e) { console.error(e); }</script>`;
        if (/<\/body>/i.test(combined)) {
          combined = combined.replace(/<\/body>/i, `${jsBlock}\n</body>`);
        } else {
          combined = combined + "\n" + jsBlock;
        }
      }
    } else {
      // Standard separate HTML/CSS/JS combination
      combined = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
${c}
  </style>
  <script>
    (function() {
      function send(type, args) {
        try {
          const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          window.parent.postMessage({ source: 'html-lab-console', type: type, message: msg }, '*');
        } catch(e) {}
      }
      console.log = function(...a) { send('log', a); };
      console.error = function(...a) { send('error', a); };
      console.warn = function(...a) { send('warn', a); };
      window.onerror = function(msg, src, line) {
        send('error', ['Lỗi dòng ' + line + ': ' + msg]);
      };
    })();
  </script>
</head>
<body>
${h}
  <script>
    try {
${j}
    } catch(err) {
      console.error(err);
    }
  </script>
</body>
</html>`;
    }

    return combined;
  };

  // Update preview when code changes or manual trigger
  useEffect(() => {
    if (isAutoRefresh) {
      const timer = setTimeout(() => {
        setPreviewSrcDoc(compilePreview(htmlCode, cssCode, jsCode));
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [htmlCode, cssCode, jsCode, isAutoRefresh, refreshTrigger]);

  // Initial compile
  useEffect(() => {
    setPreviewSrcDoc(compilePreview(htmlCode, cssCode, jsCode));
  }, []);

  // Listen for iframe console messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === "html-lab-console") {
        const newLog = {
          id: `${Date.now()}-${Math.random()}`,
          type: event.data.type || "log",
          text: event.data.message || "",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        };
        setConsoleLogs((prev) => [...prev.slice(-30), newLog]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Run code & refresh preview
  const handleRunCode = () => {
    setRefreshTrigger((n) => n + 1);
    setPreviewSrcDoc(compilePreview(htmlCode, cssCode, jsCode));
  };

  // Keyboard shortcut Ctrl + Enter to run code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [htmlCode, cssCode, jsCode]);

  // Handle template selection
  const handleSelectTemplate = (key: string) => {
    if (!confirm("Bạn có muốn tải mẫu mới này? Các chỉnh sửa hiện tại sẽ được thay thế.")) return;
    setSelectedTemplateKey(key);
    const tmpl = STARTER_TEMPLATES[key];
    if (tmpl) {
      setHtmlCode(tmpl.html);
      setCssCode(tmpl.css);
      setJsCode(tmpl.js);
      setConsoleLogs([]);
      setRefreshTrigger((n) => n + 1);
    }
  };

  // Insert Quick Snippet into current code
  const handleInsertSnippet = (snippet: string) => {
    if (activeCodeTab === "html") {
      setHtmlCode((prev) => prev + "\n" + snippet);
    } else if (activeCodeTab === "css") {
      setCssCode((prev) => prev + "\n/* Thêm kiểu dáng mới */\n" + snippet);
    } else {
      setJsCode((prev) => prev + "\n// Mã tương tác mới\n" + snippet);
    }
    setRefreshTrigger((n) => n + 1);
  };

  // Download single .html file
  const handleDownloadHtml = () => {
    const fullContent = compilePreview(htmlCode, cssCode, jsCode);
    const blob = new Blob([fullContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bai-lam-web-${currentUser.displayName ? currentUser.displayName.replace(/\s+/g, "_") : "hoc-sinh"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    const fullContent = compilePreview(htmlCode, cssCode, jsCode);
    navigator.clipboard.writeText(fullContent);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Submit Solution / Save Work
  const handleSubmitSolution = async () => {
    if (!onSubmitWork) return;
    setIsSubmitting(true);
    try {
      await onSubmitWork({
        lessonId: lesson?.id || "html-lab-custom",
        lessonTitle: lesson?.title || "Thực hành Thiết Kế Trang Web HTML/CSS",
        studentId: currentUser.uid,
        studentName: currentUser.displayName,
        studentEmail: currentUser.email,
        moduleType: "html",
        content: {
          htmlCode,
          cssCode,
          jsCode,
          codeFileName: "index.html",
          codeFileContent: compilePreview(htmlCode, cssCode, jsCode),
          projectDescription: `Trang web HTML5 thiết kế bởi học sinh ${currentUser.displayName}`,
        },
        score: 10,
        maxScore: 10,
        status: "submitted",
      });
      setSubmittedSuccess(true);
    } catch (e) {
      console.error("Submit error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send message to AI Web Tutor
  const handleSendAiMessage = async (customPrompt?: string) => {
    const query = customPrompt || aiInput.trim();
    if (!query || isAiThinking) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setAiInput("");
    setIsAiThinking(true);

    setTimeout(() => {
      aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const combinedCode = `=== HTML ===\n${htmlCode}\n\n=== CSS ===\n${cssCode}\n\n=== JS ===\n${jsCode}`;
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: aiMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          codeContext: combinedCode,
          language: "HTML / CSS / JavaScript",
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text || "Mình đã nhận được câu hỏi. Bạn thử kiểm tra lại cấu trúc đóng mở thẻ nhé!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setAiMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ Không thể kết nối với Trợ lý AI. Vui lòng thử lại sau.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsAiThinking(false);
      setTimeout(() => {
        aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* ================= TOP TOOLBAR ================= */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Quay lại danh sách bài học"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-black text-xs shadow-xs">
              <Code2 className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-slate-100 tracking-tight">
                  {lesson ? lesson.title : "Khu Viết Mã Nguồn HTML & Thiết Kế Web"}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  HTML5 • CSS3 • JS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Gõ mã nguồn trực tiếp, xem trước trang web thời gian thực và kiểm tra tính tương tác
              </p>
            </div>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2">
          {/* Template Selector Dropdown */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs">
            <span className="text-[11px] text-slate-400">Mẫu:</span>
            <select
              value={selectedTemplateKey}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {Object.entries(STARTER_TEMPLATES).map(([key, item]) => (
                <option key={key} value={key} className="bg-slate-900 text-slate-200">
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh / Run Code Preview Button */}
          <button
            onClick={handleRunCode}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
            title="Chạy thử code ngay lập tức (Phím tắt: Ctrl + Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current text-white" />
            <span>Chạy thử code (Run)</span>
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-xs flex items-center gap-1"
            title="Sao chép toàn bộ mã nguồn HTML"
          >
            {copiedNotification ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden md:inline">{copiedNotification ? "Đã chép!" : "Sao chép"}</span>
          </button>

          {/* Download .html File */}
          <button
            onClick={handleDownloadHtml}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-xs flex items-center gap-1"
            title="Tải về file trang web (.html) để mở trên trình duyệt của bạn"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Tải về .html</span>
          </button>

          {/* Submit Work Button (if lesson or submit available) */}
          {onSubmitWork && (
            <button
              onClick={handleSubmitSolution}
              disabled={isSubmitting || submittedSuccess}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                submittedSuccess
                  ? "bg-emerald-600/50 text-emerald-200 border border-emerald-500/50"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
              }`}
            >
              {submittedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã nộp sản phẩm</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Đang nộp..." : "Nộp bài làm"}</span>
                </>
              )}
            </button>
          )}

          {/* Toggle AI Web Tutor Drawer */}
          <button
            onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              isAiDrawerOpen
                ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
            }`}
            title="Hỏi Trợ lý AI Gia sư Lập trình Web"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Gia sư Web</span>
          </button>
        </div>
      </div>

      {/* ================= MAIN SPLIT WORKSPACE ================= */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* ============ LEFT HALF: CODE EDITORS ============ */}
        <div className="flex-1 flex flex-col bg-slate-950 border-r border-slate-800 overflow-hidden">
          {/* Editor Tabs & Quick Snippets Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* 3 Code Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveCodeTab("html")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCodeTab === "html"
                    ? "bg-orange-500 text-slate-950 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>HTML (index.html)</span>
              </button>

              <button
                onClick={() => setActiveCodeTab("css")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCodeTab === "css"
                    ? "bg-sky-500 text-slate-950 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>CSS (style.css)</span>
              </button>

              <button
                onClick={() => setActiveCodeTab("js")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCodeTab === "js"
                    ? "bg-amber-400 text-slate-950 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>JavaScript (script.js)</span>
              </button>
            </div>

            {/* Editor Theme Switcher & Auto Refresh Toggle */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleRunCode}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1 shadow-xs shadow-emerald-600/30"
                title="Chạy thử code ngay lập tức (Ctrl + Enter)"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Chạy thử (Run)</span>
              </button>

              <label className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAutoRefresh}
                  onChange={(e) => setIsAutoRefresh(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                />
                <span>Tự động chạy</span>
              </label>

              <button
                onClick={() => setEditorTheme(editorTheme === "vs-dark" ? "light" : "vs-dark")}
                className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800 px-2 py-0.5 rounded"
              >
                {editorTheme === "vs-dark" ? "Tối" : "Sáng"}
              </button>
            </div>
          </div>

          {/* Quick HTML Snippet Shortcuts Bar */}
          <div className="bg-slate-900/60 border-b border-slate-800/80 px-3 py-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
            <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Chèn nhanh:</span>
            </span>
            {QUICK_SNIPPETS.map((snip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsertSnippet(snip.snippet)}
                title={`Chèn mẫu ${snip.desc}`}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] whitespace-nowrap border border-slate-700/60 transition-colors"
              >
                {snip.label}
              </button>
            ))}
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden">
            {activeCodeTab === "html" && (
              <Editor
                height="100%"
                language="html"
                value={htmlCode}
                theme={editorTheme}
                onChange={(val) => setHtmlCode(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  automaticLayout: true,
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 12 },
                  suggestOnTriggerCharacters: true,
                }}
              />
            )}

            {activeCodeTab === "css" && (
              <Editor
                height="100%"
                language="css"
                value={cssCode}
                theme={editorTheme}
                onChange={(val) => setCssCode(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  automaticLayout: true,
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 12 },
                }}
              />
            )}

            {activeCodeTab === "js" && (
              <Editor
                height="100%"
                language="javascript"
                value={jsCode}
                theme={editorTheme}
                onChange={(val) => setJsCode(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  automaticLayout: true,
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  padding: { top: 12 },
                }}
              />
            )}
          </div>
        </div>

        {/* ============ RIGHT HALF: INTERACTIVE LIVE PREVIEW ============ */}
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
          {/* Simulated Browser Bar & Device Switcher */}
          <div className="bg-slate-950 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-3 shrink-0">
            {/* Device Switcher (Desktop / Tablet / Mobile) */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setDeviceMode("desktop")}
                className={`p-1.5 rounded transition-colors ${
                  deviceMode === "desktop" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Xem trên Máy tính (100%)"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode("tablet")}
                className={`p-1.5 rounded transition-colors ${
                  deviceMode === "tablet" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Xem trên Máy tính bảng (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode("mobile")}
                className={`p-1.5 rounded transition-colors ${
                  deviceMode === "mobile" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Xem trên Điện thoại (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fake Browser URL Address Bar */}
            <div className="flex-1 max-w-md bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-400 flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate font-mono text-[11px] text-slate-300">
                https://lms-k12.vn/live-preview/index.html
              </span>
            </div>

            {/* Console Drawer Toggle Button */}
            <button
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                isConsoleOpen || consoleLogs.length > 0
                  ? "bg-slate-800 text-amber-300 border-slate-700"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
              title="Mở bảng ghi nhật ký Console"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Console ({consoleLogs.length})</span>
            </button>
          </div>

          {/* Iframe Live Preview Container with Device Framing */}
          <div className="flex-1 bg-slate-950/70 p-3 overflow-auto flex items-center justify-center relative">
            <div
              className={`h-full transition-all duration-300 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col ${
                deviceMode === "desktop"
                  ? "w-full"
                  : deviceMode === "tablet"
                  ? "w-[768px] max-w-full border-4 border-slate-800"
                  : "w-[375px] max-w-full border-8 border-slate-800 rounded-3xl"
              }`}
            >
              <iframe
                ref={iframeRef}
                title="Live HTML Preview"
                srcDoc={previewSrcDoc}
                sandbox="allow-scripts allow-modals allow-same-origin"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>

          {/* Optional Bottom Console Log Panel */}
          {isConsoleOpen && (
            <div className="h-44 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0">
              <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trình ghi nhật ký Console (JavaScript Logs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConsoleLogs([])}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1"
                    title="Xóa nhật ký console"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa</span>
                  </button>
                  <button
                    onClick={() => setIsConsoleOpen(false)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1.5">
                {consoleLogs.length === 0 ? (
                  <div className="text-slate-500 italic py-2">
                    Chưa có nhật ký console. Khi mã JavaScript gọi console.log() hoặc gặp lỗi, thông tin sẽ hiển thị tại đây.
                  </div>
                ) : (
                  consoleLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`py-0.5 flex items-start gap-2 ${
                        log.type === "error"
                          ? "text-rose-400"
                          : log.type === "warn"
                          ? "text-amber-300"
                          : "text-slate-300"
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 shrink-0 font-sans">{log.time}</span>
                      <span className="shrink-0">
                        {log.type === "error" ? "❌" : log.type === "warn" ? "⚠️" : "›"}
                      </span>
                      <span className="whitespace-pre-wrap break-all">{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ============ RIGHT SLIDE-OVER: AI WEB TUTOR DRAWER ============ */}
        {isAiDrawerOpen && (
          <div className="w-full md:w-80 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0 shadow-2xl">
            {/* Drawer Header */}
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-100">Gia Sư AI Lập Trình Web</h3>
                  <p className="text-[10px] text-indigo-400">Gợi ý sửa lỗi HTML/CSS & Tư duy giao diện</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiDrawerOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-200 border border-slate-700"
                    }`}
                  >
                    <div className="prose prose-invert prose-xs max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1.5 text-right font-sans">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex gap-2 items-center text-slate-400 text-xs italic bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span>Trợ lý AI đang phân tích mã nguồn HTML...</span>
                </div>
              )}
              <div ref={aiBottomRef} />
            </div>

            {/* Quick AI Prompts */}
            <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap gap-1.5 text-[11px]">
              <button
                onClick={() => handleSendAiMessage("Làm sao để căn giữa một thẻ div bằng CSS?")}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Căn giữa thẻ div?
              </button>
              <button
                onClick={() => handleSendAiMessage("Giải thích sự khác biệt giữa thẻ <div> và <span>?")}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Khác biệt div & span?
              </button>
              <button
                onClick={() => handleSendAiMessage("Kiểm tra xem mã HTML/CSS của mình có bị lỗi gì không?")}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Kiểm tra lỗi mã hiện tại?
              </button>
            </div>

            {/* Input form */}
            <div className="p-3 bg-slate-950 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Hỏi cách dùng thẻ HTML, thuộc tính CSS..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || isAiThinking}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
