import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { exec, spawn } from "child_process";
import fs from "fs";
import os from "os";

dotenv.config();

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "10mb" }));

// ==========================================
// PERSISTENT DATA STORAGE SYSTEM
// Bảo đảm dữ liệu học sinh & bài làm không bao giờ bị mất khi cập nhật code / server
// ==========================================
const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn("Could not create DATA_DIR:", e);
    }
  }
}

function readJsonData<T>(fileName: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
    } catch (e) {
      console.warn(`Could not create initial ${fileName}:`, e);
    }
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(content);
    return parsed as T;
  } catch (err) {
    console.warn(`Error reading ${fileName}:`, err);
    return defaultValue;
  }
}

function writeJsonData<T>(fileName: string, data: T): boolean {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const tempPath = `${filePath}.tmp-${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      return true;
    } catch (e2) {
      console.error(`Failed to write ${fileName}:`, e2);
      return false;
    }
  }
}

const DEFAULT_SEED_STUDENTS: any[] = [];

// Initialize storage files if not yet created
ensureDataDir();

// Helper: Append or update student in permanent vault (never cleared)
function saveToStudentVault(studentsList: any[]) {
  try {
    const vault = readJsonData<any[]>("students_vault.json", []);
    const vaultMap = new Map<string, any>();
    vault.forEach((s) => {
      if (s.uid) vaultMap.set(s.uid, s);
      if (s.studentCode) vaultMap.set(`code:${String(s.studentCode).toUpperCase()}`, s);
    });

    studentsList.forEach((s) => {
      const codeKey = s.studentCode ? `code:${String(s.studentCode).toUpperCase()}` : null;
      const existing = (s.uid && vaultMap.get(s.uid)) || (codeKey && vaultMap.get(codeKey));
      if (existing) {
        Object.assign(existing, s);
        existing.vaultUpdatedAt = new Date().toISOString();
      } else {
        const item = { ...s, vaultCreatedAt: new Date().toISOString() };
        vault.push(item);
        if (item.uid) vaultMap.set(item.uid, item);
        if (codeKey) vaultMap.set(codeKey, item);
      }
    });

    writeJsonData("students_vault.json", vault);
  } catch (err) {
    console.warn("Could not save to student vault:", err);
  }
}

// --- 1. Students APIs ---
app.get("/api/students", (req, res) => {
  try {
    let students = readJsonData<any[]>("students.json", DEFAULT_SEED_STUDENTS);
    // If students.json is empty, attempt auto-recovery from vault
    if (!students || students.length === 0) {
      const vault = readJsonData<any[]>("students_vault.json", []);
      if (vault.length > 0) {
        students = vault;
        writeJsonData("students.json", students);
      }
    }
    res.json({ success: true, students, total: students.length });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi đọc danh sách học sinh: " + err.message });
  }
});

// Lookup student by username, studentCode, or displayName (checks both current and vault)
app.get("/api/students/lookup", (req, res) => {
  try {
    const query = String(req.query.q || "").trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ error: "Thiếu thông tin tìm kiếm." });
    }

    const current = readJsonData<any[]>("students.json", []);
    const vault = readJsonData<any[]>("students_vault.json", []);
    const combined = [...current, ...vault];

    const matched = combined.find((s) => {
      const sCode = String(s.studentCode || "").toLowerCase();
      const sEmail = String(s.email || "").toLowerCase();
      const sName = String(s.displayName || "").toLowerCase();
      const sUid = String(s.uid || "").toLowerCase();
      return (
        sCode === query ||
        sEmail === query ||
        sName === query ||
        sUid === query ||
        sName.replace(/\s+/g, "") === query.replace(/\s+/g, "")
      );
    });

    if (matched) {
      // Ensure it is in students.json
      if (!current.some((s) => s.uid === matched.uid)) {
        current.unshift(matched);
        writeJsonData("students.json", current);
      }
      return res.json({ success: true, student: matched });
    }

    res.status(404).json({ success: false, message: "Không tìm thấy tài khoản học sinh." });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi tra cứu tài khoản: " + err.message });
  }
});

// Direct registration endpoint
app.post("/api/students/register", (req, res) => {
  try {
    const student = req.body.student || req.body;
    if (!student || !student.displayName) {
      return res.status(400).json({ error: "Thiếu thông tin học sinh đăng ký." });
    }

    const current = readJsonData<any[]>("students.json", []);
    const uid = student.uid || `std-reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const studentCode = student.studentCode || `HS-${Date.now().toString().slice(-4)}`;

    const newRecord = {
      ...student,
      uid,
      studentCode,
      createdAt: student.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check duplicate by code or uid
    const existingIndex = current.findIndex(
      (s) => s.uid === uid || (s.studentCode && String(s.studentCode).toLowerCase() === String(studentCode).toLowerCase())
    );

    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...newRecord };
    } else {
      current.unshift(newRecord);
    }

    writeJsonData("students.json", current);
    saveToStudentVault([newRecord]);

    res.json({ success: true, student: newRecord, count: current.length });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi đăng ký học sinh: " + err.message });
  }
});

// Restore from vault endpoint
app.post("/api/students/restore-vault", (req, res) => {
  try {
    const vault = readJsonData<any[]>("students_vault.json", []);
    const current = readJsonData<any[]>("students.json", []);
    const map = new Map<string, any>();

    current.forEach((s) => {
      if (s.uid) map.set(s.uid, s);
    });
    vault.forEach((s) => {
      if (s.uid && !map.has(s.uid)) {
        map.set(s.uid, s);
      }
    });

    const merged = Array.from(map.values());
    writeJsonData("students.json", merged);
    res.json({ success: true, count: merged.length, students: merged });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi khôi phục tài khoản từ bộ nhớ: " + err.message });
  }
});

app.post("/api/students", (req, res) => {
  try {
    const incoming: any[] = Array.isArray(req.body.students)
      ? req.body.students
      : req.body.student
      ? [req.body.student]
      : [];

    const current = readJsonData<any[]>("students.json", DEFAULT_SEED_STUDENTS);

    // Safeguard: Do NOT overwrite with empty unless explicitly forced with flag
    if (incoming.length === 0) {
      if (req.body.forceClearAll === true) {
        // Backup before clearing
        saveToStudentVault(current);
        writeJsonData("students.json", []);
        return res.json({ success: true, count: 0, students: [] });
      }
      return res.json({ success: true, count: current.length, students: current });
    }

    if (req.body.replace === true || req.body.overwrite === true) {
      saveToStudentVault(incoming);
      writeJsonData("students.json", incoming);
      return res.json({ success: true, count: incoming.length, students: incoming });
    }

    const currentMap = new Map<string, any>();
    // Index by uid and studentCode
    current.forEach((s) => {
      if (s.uid) currentMap.set(s.uid, s);
      if (s.studentCode) currentMap.set(`code:${String(s.studentCode).toUpperCase()}`, s);
    });

    incoming.forEach((inStudent) => {
      const codeKey = inStudent.studentCode ? `code:${String(inStudent.studentCode).toUpperCase()}` : null;
      const existing = (inStudent.uid && currentMap.get(inStudent.uid)) || (codeKey && currentMap.get(codeKey));

      if (existing) {
        Object.assign(existing, inStudent);
        existing.updatedAt = new Date().toISOString();
      } else {
        const newRecord = {
          ...inStudent,
          uid: inStudent.uid || `std-srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: inStudent.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        current.unshift(newRecord);
        currentMap.set(newRecord.uid, newRecord);
        if (newRecord.studentCode) {
          currentMap.set(`code:${String(newRecord.studentCode).toUpperCase()}`, newRecord);
        }
      }
    });

    writeJsonData("students.json", current);
    saveToStudentVault(incoming);
    res.json({ success: true, count: current.length, students: current });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi lưu học sinh: " + err.message });
  }
});

app.put("/api/students/:uid", (req, res) => {
  try {
    const current = readJsonData<any[]>("students.json", DEFAULT_SEED_STUDENTS);
    const { uid } = req.params;
    const index = current.findIndex((s) => s.uid === uid);
    if (index === -1) {
      return res.status(404).json({ error: "Không tìm thấy học sinh với ID này." });
    }
    current[index] = { ...current[index], ...req.body, uid, updatedAt: new Date().toISOString() };
    writeJsonData("students.json", current);
    res.json({ success: true, student: current[index] });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi cập nhật học sinh: " + err.message });
  }
});

app.delete("/api/students/:uid", (req, res) => {
  try {
    const current = readJsonData<any[]>("students.json", DEFAULT_SEED_STUDENTS);
    const { uid } = req.params;
    const filtered = current.filter((s) => s.uid !== uid);
    writeJsonData("students.json", filtered);
    res.json({ success: true, remaining: filtered.length });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi xóa học sinh: " + err.message });
  }
});

// --- 2. Submissions APIs ---
app.get("/api/submissions", (req, res) => {
  try {
    const submissions = readJsonData<any[]>("submissions.json", []);
    res.json({ success: true, submissions, total: submissions.length });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi đọc bài nộp: " + err.message });
  }
});

app.post("/api/submissions", (req, res) => {
  try {
    const current = readJsonData<any[]>("submissions.json", []);
    const submission = req.body;
    if (!submission || !submission.id) {
      return res.status(400).json({ error: "Dữ liệu bài nộp không hợp lệ." });
    }
    const index = current.findIndex((s) => s.id === submission.id);
    if (index >= 0) {
      current[index] = { ...current[index], ...submission, updatedAt: new Date().toISOString() };
    } else {
      current.unshift({ ...submission, createdAt: submission.submittedAt || new Date().toISOString() });
    }
    writeJsonData("submissions.json", current);
    res.json({ success: true, submission });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi lưu bài nộp: " + err.message });
  }
});

app.put("/api/submissions/:id/grade", (req, res) => {
  try {
    const current = readJsonData<any[]>("submissions.json", []);
    const { id } = req.params;
    const { score, rubric, teacherFeedback } = req.body;
    const index = current.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Không tìm thấy bài nộp." });
    }
    current[index] = {
      ...current[index],
      score,
      rubric,
      teacherFeedback,
      status: "graded",
      gradedAt: new Date().toISOString(),
    };
    writeJsonData("submissions.json", current);
    res.json({ success: true, submission: current[index] });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi chấm bài: " + err.message });
  }
});

// --- 3. System Backup & Restore APIs ---
app.get("/api/system/backup", (req, res) => {
  try {
    const students = readJsonData<any[]>("students.json", DEFAULT_SEED_STUDENTS);
    const submissions = readJsonData<any[]>("submissions.json", []);
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: "STEM_TINHOC_LMS",
      version: "2.5",
      summary: {
        totalStudents: students.length,
        totalSubmissions: submissions.length,
      },
      data: {
        students,
        submissions,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi tạo bản sao lưu: " + err.message });
  }
});

app.post("/api/system/restore", (req, res) => {
  try {
    const { backupData } = req.body;
    if (!backupData || (!backupData.data && !backupData.students)) {
      return res.status(400).json({ error: "File dữ liệu sao lưu không đúng định dạng." });
    }
    const incomingStudents = backupData.data?.students || backupData.students || [];
    const incomingSubmissions = backupData.data?.submissions || backupData.submissions || [];

    if (Array.isArray(incomingStudents) && incomingStudents.length > 0) {
      writeJsonData("students.json", incomingStudents);
    }
    if (Array.isArray(incomingSubmissions)) {
      writeJsonData("submissions.json", incomingSubmissions);
    }

    res.json({
      success: true,
      message: `Khôi phục thành công ${incomingStudents.length} tài khoản học sinh và ${incomingSubmissions.length} bài tập.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi khôi phục dữ liệu: " + err.message });
  }
});

app.get("/api/system/storage-status", (req, res) => {
  try {
    const students = readJsonData<any[]>("students.json", DEFAULT_SEED_STUDENTS);
    const submissions = readJsonData<any[]>("submissions.json", []);
    res.json({
      status: "healthy",
      storageType: "Multi-Layer Persistent (Server Disk + Firestore + LocalStorage)",
      studentsCount: students.length,
      submissionsCount: submissions.length,
      dataDir: DATA_DIR,
      persistent: true,
      lastCheck: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "LMS Tin Học & STEM" });
});

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// AI Assistant Endpoint
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, codeContext, language, testResults } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.status(200).json({
        text: "💡 [Chế độ mô phỏng AI]: Bạn chưa cấu hình GEMINI_API_KEY trong cài đặt. \n\nGợi ý: Kiểm tra kỹ các điều kiện dừng của vòng lặp, kiểm tra thụt đầu dòng (indentation) trong Python, hoặc định dạng kiểu dữ liệu trong C++ nhé!",
      });
    }

    const systemPrompt = `Bạn là Gia sư Trợ lý AI môn Tin học & STEM từ Tiểu học đến THPT tại Việt Nam.
Nhiệm vụ của bạn:
1. Giải thích lỗi cú pháp, lỗi biên dịch và cảnh báo nếu có.
2. Gợi ý tư duy thuật toán, phương pháp giải quyết theo phương pháp gợi mở (Socratic Method).
3. QUY TẮC BẮT BUỘC: KHÔNG viết hộ toàn bộ code hoàn chỉnh cho học sinh. Hãy chỉ ra vị trí lỗi, đặt câu hỏi dẫn dắt hoặc đưa ra ví dụ nhỏ minh họa để học sinh tự hoàn thành.
4. Trả lời bằng tiếng Việt thân thiện, khích lệ tinh thần học tập.`;

    let prompt = "";
    if (codeContext) {
      prompt += `[Ngôn ngữ: ${language || "Python"}]\n[Mã nguồn hiện tại]:\n\`\`\`\n${codeContext}\n\`\`\`\n\n`;
    }
    if (testResults) {
      prompt += `[Kết quả test case gần nhất]:\n${JSON.stringify(testResults, null, 2)}\n\n`;
    }
    if (history && Array.isArray(history) && history.length > 0) {
      prompt += `[Lịch sử trao đổi]:\n`;
      history.slice(-6).forEach((h: any) => {
        prompt += `${h.role === "user" ? "Học sinh" : "Trợ lý AI"}: ${h.content}\n`;
      });
      prompt += `\n`;
    }
    prompt += `[Câu hỏi của học sinh]: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text || "Mình chưa hiểu rõ câu hỏi, bạn có thể mô tả chi tiết hơn không?" });
  } catch (error: any) {
    console.error("Gemini error:", error);
    res.status(200).json({
      text: `⚠️ Không thể kết nối với Gemini AI (${error?.message || "Lỗi mạng"}). \n\nGợi ý nhanh: Bạn hãy xem lại cú pháp lệnh và kiểu dữ liệu của biến nhé!`,
    });
  }
});

// AI Quiz Generator Endpoint
app.post("/api/gemini/generate-quiz", async (req, res) => {
  try {
    const { topic, level, count = 4, difficulty = "medium", sourceText } = req.body;
    const ai = getAIClient();

    const levelTextMap: Record<string, string> = {
      elementary: "Tiểu học (lớp 3-5): Ngắn gọn, dễ hiểu, trực quan, các bộ phận máy tính và Scratch cơ bản.",
      middle: "THCS (lớp 6-9): Lập trình Python cơ bản, biến số, rẽ nhánh if-else, vòng lặp for/while, tư duy logic thuật toán.",
      high: "THPT (lớp 10-12): Lập trình C++ / Python nâng cao, cấu trúc dữ liệu mảng, xâu, hàm, độ phức tạp thuật toán.",
      robotics: "STEM & Robotics: Cảm biến siêu âm/dò line, động cơ servo/DC, vi điều khiển Arduino/ESP32, mạch điện tử."
    };

    const targetLevelDesc = levelTextMap[level] || "K12 Tin học & STEM";
    const questionNum = Math.min(Math.max(Number(count) || 4, 1), 10);

    if (ai) {
      const prompt = `Bạn là Chuyên gia Khảo thí & Sư phạm Tin học - STEM tại Việt Nam.
Hãy biên soạn một bộ gồm ${questionNum} câu hỏi trắc nghiệm khách quan 4 lựa chọn (A, B, C, D) bằng tiếng Việt chuẩn cho đối tượng: ${targetLevelDesc}.
Chủ đề trọng tâm: "${topic || "Kiến thức Tin học & STEM"}".
Mức độ nhận thức: ${difficulty === "easy" ? "Nhận biết (Dễ)" : difficulty === "hard" ? "Vận dụng cao (Khó)" : "Thông hiểu (Vừa phải)"}.
${sourceText ? `Nội dung tài liệu đính kèm để trích xuất câu hỏi:\n"""\n${sourceText}\n"""\n` : ""}

YÊU CẦU ĐỊNH DẠNG:
Trả về duy nhất chuỗi JSON hợp lệ là mảng JSON đối tượng câu hỏi theo cấu trúc sau:
[
  {
    "question": "Nội dung câu hỏi sư phạm rõ ràng",
    "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
    "correctIndex": 0,
    "explanation": "Giải thích chi tiết vì sao phương án này chính xác"
  }
]`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            temperature: 0.5,
            responseMimeType: "application/json",
          },
        });

        const responseText = response.text?.trim() || "[]";
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated = parsed.slice(0, questionNum).map((item: any, idx: number) => ({
            id: `q-${Date.now()}-${idx + 1}`,
            question: String(item.question || `Câu hỏi ${idx + 1}`),
            options: Array.isArray(item.options) && item.options.length >= 2 
              ? item.options.map(String) 
              : ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
            correctIndex: typeof item.correctIndex === "number" && item.correctIndex >= 0 && item.correctIndex < (item.options?.length || 4) 
              ? item.correctIndex 
              : 0,
            explanation: String(item.explanation || "Đáp án đúng theo chuẩn kiến thức."),
          }));
          return res.json({ success: true, questions: validated, source: "gemini" });
        }
      } catch (aiErr) {
        console.warn("Gemini generation or parse warning, falling back to template bank:", aiErr);
      }
    }

    // High quality pedagogical fallback bank
    const fallbackQuestions = getFallbackQuestions(topic, level, questionNum);
    return res.json({ 
      success: true, 
      questions: fallbackQuestions, 
      source: "fallback",
      message: "Đã tạo bộ câu hỏi khảo nghiệm từ ngân hàng tri thức sư phạm Tin học."
    });
  } catch (error: any) {
    console.error("Generate quiz error:", error);
    res.status(500).json({ error: error?.message || "Lỗi tạo câu hỏi trắc nghiệm" });
  }
});

// Helper for generating high quality pedagogical questions fallback
function getFallbackQuestions(topic: string, level: string, count: number) {
  const safeTopic = topic ? topic.toLowerCase() : "";
  const questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }> = [];

  if (level === "elementary" || safeTopic.includes("máy tính") || safeTopic.includes("scratch")) {
    const bank = [
      {
        question: `Khi học về "${topic || "máy tính"}", bộ phận nào sau đây đóng vai trò là 'bộ não' điều khiển mọi hoạt động của máy tính?`,
        options: ["Bộ xử lý trung tâm (CPU)", "Màn hình (Monitor)", "Bàn phím (Keyboard)", "Chuột máy tính (Mouse)"],
        correctIndex: 0,
        explanation: "CPU (Central Processing Unit) là bộ vi xử lý trung tâm, thực hiện các phép tính và chỉ huy các thiết bị khác hoạt động.",
      },
      {
        question: "Trong phần mềm lập trình Scratch, khối lệnh 'Khi bấm vào lá cờ xanh' có tác dụng gì?",
        options: ["Tắt máy tính", "Bắt đầu chạy kịch bản/chương trình", "Xóa nhân vật trên sân khấu", "Đổi màu nền"],
        correctIndex: 1,
        explanation: "Lá cờ xanh là biểu tượng bắt đầu thực thi các khối lệnh được gắn vào sự kiện 'When green flag clicked'.",
      },
      {
        question: "Hành động nào sau đây là văn minh và an toàn khi sử dụng máy tính trong phòng thực hành?",
        options: ["Vừa ăn uống vừa bấm bàn phím", "Tự ý rút các dây cáp nguồn khi máy đang chạy", "Tắt máy đúng quy trình và xếp ghế gọn gàng sau khi học", "Cài đặt phần mềm lạ không có phép của thầy cô"],
        correctIndex: 2,
        explanation: "Luôn bảo quản thiết bị, tắt máy tính đúng cách qua nút Shut down và giữ gìn vệ sinh phòng máy.",
      },
      {
        question: "Để lưu lại sản phẩm bài làm của mình trên máy tính, em sử dụng tổ hợp phím tắt phổ biến nào?",
        options: ["Ctrl + C", "Ctrl + V", "Ctrl + S", "Ctrl + Z"],
        correctIndex: 2,
        explanation: "Tổ hợp Ctrl + S (Save) là phím tắt tiêu chuẩn để lưu tệp tin trong hầu hết các phần mềm soạn thảo và đồ họa.",
      },
      {
        question: "Thiết bị nào sau đây là THIẾT BỊ XUẤT (đưa dữ liệu từ máy tính ra cho con người xem/nghe)?",
        options: ["Bàn phím", "Chuột", "Microphone", "Màn hình và Loa"],
        correctIndex: 3,
        explanation: "Màn hình hiển thị hình ảnh và loa phát âm thanh là các thiết bị xuất thông tin (Output devices).",
      }
    ];
    bank.slice(0, count).forEach((item, idx) => {
      questions.push({ id: `q-fallback-${Date.now()}-${idx + 1}`, ...item });
    });
  } else if (level === "robotics" || safeTopic.includes("robot") || safeTopic.includes("cảm biến")) {
    const bank = [
      {
        question: `Trong dự án Robot STEM (${topic || "Robotics"}), cảm biến siêu âm (Ultrasonic Sensor) hoạt động theo nguyên lý nào?`,
        options: [
          "Phát sóng siêu âm và đo thời gian sóng phản xạ trở lại để tính khoảng cách",
          "Đo cường độ ánh sáng của vạch kẻ màu đen trên sàn",
          "Đo nhiệt độ môi trường xung quanh mạch điều khiển",
          "Đo lực nhấn vật lý của người dùng vào nút bấm"
        ],
        correctIndex: 0,
        explanation: "Cảm biến siêu âm phát xung âm tần số cao và tính khoảng cách dựa trên vận tốc âm thanh và thời gian phản hồi: Distance = (Time * Speed) / 2.",
      },
      {
        question: "Để điều khiển góc quay chính xác từ 0 đến 180 độ cho cánh tay robot, loại động cơ nào thường được ưu tiên sử dụng?",
        options: ["Động cơ DC bước thường", "Động cơ Servo", "Động cơ rung", "Máy bơm nước mini"],
        correctIndex: 1,
        explanation: "Động cơ Servo có mạch phản hồi vị trí bên trong (closed-loop), cho phép quay và giữ trục ở các góc chính xác theo xung PWM.",
      },
      {
        question: "Khi lập trình vi điều khiển Arduino hoặc ESP32, hàm `loop()` có đặc điểm gì?",
        options: [
          "Chỉ chạy đúng 1 lần khi cấp nguồn khởi động",
          "Chạy lặp đi lặp lại liên tục chừng nào mạch còn được cấp điện",
          "Tự động xóa chương trình trong bộ nhớ flash",
          "Chỉ được gọi khi có lỗi phần cứng"
        ],
        correctIndex: 1,
        explanation: "Trong cấu trúc Arduino tiêu chuẩn, `setup()` chạy 1 lần để cấu hình chân I/O, còn `loop()` lặp vô hạn để thực thi logic điều khiển.",
      },
      {
        question: "Robot dò đường (Line Follower) phân biệt được vạch kẻ đen trên nền trắng chủ yếu nhờ hiện tượng vật lý nào?",
        options: [
          "Vật màu đen hấp thụ tia hồng ngoại nhiều hơn, vật màu trắng phản xạ tia hồng ngoại tốt hơn",
          "Vật màu đen phát ra sóng siêu âm mạnh hơn",
          "Vật màu trắng có nhiệt độ cao hơn",
          "Vật màu đen có từ tính hút nam châm"
        ],
        correctIndex: 0,
        explanation: "Cặp LED phát - thu hồng ngoại (IR sensor) nhận diện được vạch dựa trên sự chênh lệch phản xạ ánh sáng hồng ngoại giữa màu đen và trắng.",
      },
      {
        question: "Lý do vì sao KHÔNG NÊN cấp nguồn trực tiếp cho nhiều động cơ DC/Servo công suất lớn từ chân 5V của bo mạch Arduino?",
        options: [
          "Vì chân 5V của Arduino có điện áp quá lớn làm cháy động cơ",
          "Vì động cơ tiêu thụ dòng điện lớn có thể làm sụt áp bo mạch, gây khởi động lại hoặc cháy IC ổn áp của Arduino",
          "Vì Arduino chỉ chạy được với pin năng lượng mặt trời",
          "Vì động cơ chỉ nhận tín hiệu analog không nhận điện 5V"
        ],
        correctIndex: 1,
        explanation: "Động cơ lúc khởi động hoặc quá tải tiêu thụ dòng lớn (surge current), cần sử dụng nguồn cấp riêng hoặc mạch cầu H (Motor Driver) để bảo vệ vi điều khiển.",
      }
    ];
    bank.slice(0, count).forEach((item, idx) => {
      questions.push({ id: `q-fallback-${Date.now()}-${idx + 1}`, ...item });
    });
  } else {
    // THCS & THPT Programming (Python / C++)
    const bank = [
      {
        question: `Về chủ đề "${topic || "Lập trình"}", cấu trúc điều khiển rẽ nhánh nào sau đây dùng để kiểm tra nhiều điều kiện kế tiếp nhau?`,
        options: ["if - elif - else (hoặc if - else if - else)", "for - in", "while - do", "break - continue"],
        correctIndex: 0,
        explanation: "Cấu trúc `elif` (trong Python) hoặc `else if` (trong C++) cho phép kiểm tra tuần tự nhiều nhánh điều kiện loại trừ lẫn nhau.",
      },
      {
        question: "Đoạn mã Python: `print(list(range(2, 8, 2)))` sẽ xuất ra kết quả nào trên màn hình?",
        options: ["[2, 3, 4, 5, 6, 7, 8]", "[2, 4, 6]", "[2, 4, 6, 8]", "[4, 6, 8]"],
        correctIndex: 1,
        explanation: "Hàm range(start, stop, step) bắt đầu từ 2, bước nhảy 2, và dừng trước 8, nên các giá trị sinh ra là 2, 4, 6.",
      },
      {
        question: "Trong ngôn ngữ lập trình C++, toán tử nào sau đây dùng để lấy phần dư của phép chia hai số nguyên?",
        options: ["/", "%", "//", "**"],
        correctIndex: 1,
        explanation: "Toán tử modulo `%` trong C++ và Python trả về số dư của phép chia nguyên. Ví dụ: 7 % 3 = 1.",
      },
      {
        question: "Để tránh hiện tượng vòng lặp vô tận (Infinite Loop) khi sử dụng vòng lặp `while`, lập trình viên cần lưu ý điều gì?",
        options: [
          "Không bao giờ được đặt lệnh `print()` bên trong vòng lặp",
          "Bắt buộc phải có câu lệnh làm thay đổi biến điều kiện để biểu thức lặp trở thành False",
          "Chỉ được lặp tối đa 10 lần",
          "Phải khai báo mảng tĩnh trước khi lặp"
        ],
        correctIndex: 1,
        explanation: "Vòng lặp `while (điều kiện)` tiếp tục chạy chừng nào điều kiện còn Đúng (True). Nếu thân vòng lặp không làm biến đổi điều kiện về Sai (False), chương trình sẽ rơi vào lặp vô hạn.",
      },
      {
        question: "Thuật toán tìm kiếm nhị phân (Binary Search) đòi hỏi mảng dữ liệu đầu vào bắt buộc phải thỏa mãn tính chất nào?",
        options: [
          "Mảng phải có số lượng phần tử là số chẵn",
          "Các phần tử trong mảng phải là số dương",
          "Mảng đã được sắp xếp theo thứ tự (tăng dần hoặc giảm dần)",
          "Mảng không được chứa các số nguyên tố"
        ],
        correctIndex: 2,
        explanation: "Tìm kiếm nhị phân dựa trên phép chia đôi không gian tìm kiếm, chỉ áp dụng được khi danh sách đã được sắp xếp thứ tự xác định với độ phức tạp O(log n).",
      }
    ];
    bank.slice(0, count).forEach((item, idx) => {
      questions.push({ id: `q-fallback-${Date.now()}-${idx + 1}`, ...item });
    });
  }

  // Ensure count
  return questions.slice(0, count);
}

// Local regex parser for teacher pasting exam text
function parseTextQuestionsLocally(text: string) {
  if (!text || !text.trim()) return [];
  const lines = text.split(/\r?\n/);
  const questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    points: number;
  }> = [];

  let currentQ: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  } | null = null;

  const flushCurrent = () => {
    if (currentQ && currentQ.question.trim()) {
      questions.push({
        id: `q-parsed-${Date.now()}-${questions.length + 1}`,
        question: currentQ.question.trim(),
        options: currentQ.options.length >= 2 ? currentQ.options : ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
        correctIndex: currentQ.correctIndex,
        explanation: currentQ.explanation || "Đáp án đúng theo chuẩn kiến thức.",
        points: 1.0,
      });
    }
    currentQ = null;
  };

  const questionStartRegex = /^(Câu\s*\d+|Bài\s*\d+|Question\s*\d+|Q\d+)\s*[:.]/i;
  const optionRegex = /^[A-D]\s*[:.]\s*(.*)$/i;
  const answerRegex = /^(Đáp án|Đáp án đúng|Answer|Key)\s*[:.]\s*([A-D])/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (questionStartRegex.test(line)) {
      flushCurrent();
      currentQ = {
        question: line,
        options: [],
        correctIndex: 0,
        explanation: "",
      };
      continue;
    }

    if (optionRegex.test(line) && currentQ) {
      const match = line.match(optionRegex);
      if (match) {
        currentQ.options.push(match[1].trim());
      }
      continue;
    }

    if (answerRegex.test(line) && currentQ) {
      const match = line.match(answerRegex);
      if (match) {
        const letter = match[2].toUpperCase();
        const mapIdx: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
        if (mapIdx[letter] !== undefined) {
          currentQ.correctIndex = mapIdx[letter];
        }
      }
      continue;
    }

    if (currentQ) {
      if (currentQ.options.length === 0) {
        currentQ.question += "\n" + line;
      } else {
        currentQ.explanation += (currentQ.explanation ? "\n" : "") + line;
      }
    }
  }

  flushCurrent();
  return questions;
}

// Endpoint: AI Exam File OCR & Intelligent Parsing
app.post("/api/gemini/parse-exam-file", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/png", textContent, fileName } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.json({
        success: true,
        source: "local-parser",
        examTitle: fileName?.replace(/\.[^/.]+$/, "") || "Đề thi mới",
        questions: parseTextQuestionsLocally(textContent || ""),
        message: "Đã phân tách câu hỏi bằng bộ phân tích nội dung thông minh.",
      });
    }

    const prompt = `Bạn là Chuyên gia Khảo thí và Số hóa Đề thi hàng đầu của hệ sinh thái giáo dục trực tuyến (tương tự Azota, K12Online).
Nhiệm vụ của bạn: Phân tích và trích xuất TOÀN BỘ các câu hỏi kiểm tra/trắc nghiệm từ tài liệu đính kèm (ảnh chụp đề viết tay, ảnh in, hoặc nội dung văn bản).
Nhận diện chuẩn xác:
1. Tên đề thi (Ví dụ: "Đề kiểm tra giữa kỳ 1 Tin học 8", "Kiểm tra 15 phút Lập trình Python"...)
2. Danh sách câu hỏi: Tên câu hỏi, các lựa chọn A, B, C, D
3. Đáp án đúng: Nhận diện theo dấu khoanh tròn, tích chọn, gạch chân, hoặc bảng đáp án ở cuối trang. Nếu không có đánh dấu, tự động suy luận đáp án chính xác nhất theo kiến thức chuẩn của Bộ GD&ĐT.
4. Lời giải thích: Giải thích ngắn gọn, xúc tích vì sao chọn đáp án đó.
5. Mức độ nhận thức: "nhan_biet", "thong_hieu", "van_dung", "van_dung_cao".

BẮT BUỘC TRẢ VỀ JSON theo cấu trúc sau:
{
  "examTitle": "Tên đề thi nhận diện được",
  "questions": [
    {
      "question": "Nội dung câu hỏi đầy đủ",
      "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
      "correctIndex": 0,
      "explanation": "Lời giải chi tiết ngắn gọn",
      "level": "nhan_biet"
    }
  ]
}`;

    let contents: any;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/png",
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      };
    } else {
      contents = `${prompt}\n\nNỘI DUNG TÀI LIỆU:\n"""\n${textContent || ""}\n"""`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim() || "{}";
    const parsed = JSON.parse(responseText);
    const questions = (parsed.questions || []).map((q: any, idx: number) => ({
      id: `q-exam-${Date.now()}-${idx + 1}`,
      question: String(q.question || `Câu hỏi ${idx + 1}`),
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options.map(String) : ["A", "B", "C", "D"],
      correctIndex: typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex < (q.options?.length || 4) ? q.correctIndex : 0,
      explanation: String(q.explanation || "Đáp án chuẩn."),
      level: q.level || "thong_hieu",
      points: 1.0,
    }));

    return res.json({
      success: true,
      examTitle: parsed.examTitle || fileName?.replace(/\.[^/.]+$/, "") || "Đề thi số hóa mới",
      questions: questions.length > 0 ? questions : parseTextQuestionsLocally(textContent || ""),
      source: "gemini-ocr",
    });
  } catch (err: any) {
    console.error("Exam parse error:", err);
    return res.json({
      success: true,
      source: "fallback-parser",
      examTitle: req.body.fileName?.replace(/\.[^/.]+$/, "") || "Đề thi số hóa",
      questions: parseTextQuestionsLocally(req.body.textContent || ""),
      message: "Đã phân tách câu hỏi theo định dạng cấu trúc đề.",
    });
  }
});

// Endpoint: AI Matrix Exam Generator (Tạo đề từ Ma trận đề GDPT 2018)
app.post("/api/gemini/generate-matrix-exam", async (req, res) => {
  try {
    const { subject, grade, title, duration = 45, matrix = [] } = req.body;
    const ai = getAIClient();

    const matrixDescription = (matrix as Array<any>)
      .map(
        (m, idx) =>
          `Chuyên đề ${idx + 1}: "${m.topic}" - Nhận biết: ${m.nhanBiet || 0} câu, Thông hiểu: ${m.thongHieu || 0} câu, Vận dụng: ${m.vanDung || 0} câu, Vận dụng cao: ${m.vanDungCao || 0} câu`
      )
      .join("\n");

    const prompt = `Bạn là Chuyên gia Khảo thí và Đo lường Giáo dục tại Việt Nam, am hiểu chương trình GDPT 2018.
Nhiệm vụ: Hãy sinh một đề kiểm tra hoàn chỉnh theo ĐÚNG MA TRẬN ĐỀ THI sau:
- Môn học: ${subject || "Tin học"}
- Khối lớp: ${grade || "THCS"}
- Tiêu đề: ${title || "Đề kiểm tra đánh giá định kỳ"}
- Thời gian làm bài: ${duration} phút
- Ma trận phân bổ câu hỏi:
${matrixDescription}

YÊU CẦU:
1. Đảm bảo đúng số lượng câu và mức độ nhận thức cho từng chuyên đề.
2. Nội dung câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D), có tính phân hóa rõ ràng.
3. Đáp án chính xác và lời giải thích phương pháp giải ngắn gọn.

TRẢ VỀ DUY NHẤT MÃ JSON HỢP LỆ:
{
  "examTitle": "${title || "Đề kiểm tra theo ma trận"}",
  "questions": [
    {
      "topic": "Tên chuyên đề",
      "level": "nhan_biet" | "thong_hieu" | "van_dung" | "van_dung_cao",
      "question": "Nội dung câu hỏi",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Lời giải thích"
    }
  ]
}`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text?.trim() || "{}";
      const parsed = JSON.parse(responseText);
      const questions = (parsed.questions || []).map((q: any, idx: number) => ({
        id: `q-mat-${Date.now()}-${idx + 1}`,
        question: String(q.question || `Câu hỏi ${idx + 1}`),
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options.map(String) : ["A", "B", "C", "D"],
        correctIndex: typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex < (q.options?.length || 4) ? q.correctIndex : 0,
        explanation: String(q.explanation || "Đáp án chuẩn theo ma trận."),
        level: q.level || "thong_hieu",
        topic: q.topic || "Kiến thức chung",
        points: 1.0,
      }));

      return res.json({
        success: true,
        examTitle: parsed.examTitle || title || "Đề kiểm tra theo ma trận đề",
        questions,
        source: "gemini-matrix",
      });
    }

    // Fallback if AI not available
    const fallbackQuestions = getFallbackQuestions(subject || "Tin học", "middle", 10);
    return res.json({
      success: true,
      examTitle: title || "Đề kiểm tra theo ma trận đề",
      questions: fallbackQuestions,
      source: "fallback",
      message: "Đã tạo đề thi từ ngân hàng ma trận đề.",
    });
  } catch (err: any) {
    console.error("Matrix exam error:", err);
    res.status(500).json({ error: err?.message || "Lỗi tạo đề từ ma trận" });
  }
});

// Run single code snippet with input
async function executeCode(language: string, code: string, stdin: string): Promise<{ stdout: string; stderr: string; time?: number }> {
  const startTime = Date.now();
  const normalizedStdin = stdin !== undefined && stdin !== null ? (stdin.endsWith("\n") ? stdin : stdin + "\n") : "";

  // 1. Local Python execution (native python3 with unbuffered output)
  if (language === "python" || language === "python3") {
    return new Promise((resolve) => {
      const tempFile = path.join(os.tmpdir(), `py_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);
      try {
        fs.writeFileSync(tempFile, code, "utf-8");
      } catch (e: any) {
        return resolve({ stdout: "", stderr: `Lỗi ghi file tạm: ${e.message}`, time: Date.now() - startTime });
      }

      const pythonBin = fs.existsSync("/usr/bin/python3") 
        ? "/usr/bin/python3" 
        : (fs.existsSync("/usr/local/bin/python3") ? "/usr/local/bin/python3" : "python3");

      const child = spawn(pythonBin, ["-u", tempFile], {
        timeout: 4000,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (err) => {
        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) {}
        resolve({
          stdout,
          stderr: `Lỗi khởi chạy Python: ${err.message}`,
          time: Date.now() - startTime,
        });
      });

      child.on("close", (codeVal, signal) => {
        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) {}
        if (signal === "SIGTERM" || signal === "SIGKILL") {
          resolve({
            stdout,
            stderr: "Lỗi: Quá thời gian thực thi (Time Limit Exceeded - 4s). Hãy kiểm tra vòng lặp vô hạn hoặc dữ liệu đầu vào input().",
            time: Date.now() - startTime,
          });
        } else {
          resolve({
            stdout,
            stderr,
            time: Date.now() - startTime,
          });
        }
      });

      // Feed standard input if any, then ALWAYS close stdin stream
      if (normalizedStdin && child.stdin) {
        child.stdin.write(normalizedStdin);
      }
      if (child.stdin) {
        child.stdin.end();
      }
    });
  }

  // 2. Local C++ execution (g++ compiler)
  if (language === "cpp" || language === "c++") {
    return new Promise((resolve) => {
      const uniqueId = `cpp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const sourceFile = path.join(os.tmpdir(), `${uniqueId}.cpp`);
      const binaryFile = path.join(os.tmpdir(), `${uniqueId}.out`);

      try {
        fs.writeFileSync(sourceFile, code, "utf-8");
      } catch (e: any) {
        return resolve({ stdout: "", stderr: `Lỗi ghi file mã nguồn C++: ${e.message}`, time: Date.now() - startTime });
      }

      // Compile with g++
      exec(`g++ -O2 -std=c++17 "${sourceFile}" -o "${binaryFile}"`, { timeout: 6000 }, (compileErr, compileStdout, compileStderr) => {
        try { if (fs.existsSync(sourceFile)) fs.unlinkSync(sourceFile); } catch (e) {}

        if (compileErr) {
          try { if (fs.existsSync(binaryFile)) fs.unlinkSync(binaryFile); } catch (e) {}
          return resolve({
            stdout: "",
            stderr: `Lỗi biên dịch C++ (Compile Error):\n${compileStderr || compileErr.message}`,
            time: Date.now() - startTime,
          });
        }

        // Run compiled binary
        const child = spawn(binaryFile, [], { timeout: 4000 });
        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("error", (err) => {
          try { if (fs.existsSync(binaryFile)) fs.unlinkSync(binaryFile); } catch (e) {}
          resolve({
            stdout,
            stderr: `Lỗi thực thi C++: ${err.message}`,
            time: Date.now() - startTime,
          });
        });

        child.on("close", (codeVal, signal) => {
          try { if (fs.existsSync(binaryFile)) fs.unlinkSync(binaryFile); } catch (e) {}
          if (signal === "SIGTERM" || signal === "SIGKILL") {
            resolve({
              stdout,
              stderr: "Lỗi: Quá thời gian thực thi (Time Limit Exceeded - 4s). Hãy kiểm tra vòng lặp vô hạn.",
              time: Date.now() - startTime,
            });
          } else {
            resolve({
              stdout,
              stderr,
              time: Date.now() - startTime,
            });
          }
        });

        // Feed standard input if any, then ALWAYS close stdin stream
        if (normalizedStdin && child.stdin) {
          child.stdin.write(normalizedStdin);
        }
        if (child.stdin) {
          child.stdin.end();
        }
      });
    });
  }

  return {
    stdout: "",
    stderr: `Ngôn ngữ '${language}' chưa được hỗ trợ trên hệ thống biên dịch.`,
    time: Date.now() - startTime,
  };
}

// Run code and auto check against testcases
app.post("/api/run-code", async (req, res) => {
  try {
    const { language, code, stdin, testcases } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code cannot be empty" });
    }

    // If specific testcases are provided, run each and match output
    if (Array.isArray(testcases) && testcases.length > 0) {
      const results = [];
      for (let i = 0; i < testcases.length; i++) {
        const tc = testcases[i];
        const runRes = await executeCode(language, code, tc.input || "");
        const actual = (runRes.stdout || "").trim();
        const expected = (tc.expectedOutput || "").trim();
        const passed = actual === expected && !runRes.stderr;

        results.push({
          id: i + 1,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: runRes.stdout,
          error: runRes.stderr,
          passed,
          time: runRes.time,
        });
      }

      const passedCount = results.filter((r) => r.passed).length;
      return res.json({
        type: "testcases",
        results,
        passedCount,
        totalCount: testcases.length,
        allPassed: passedCount === testcases.length,
      });
    }

    // Single run with manual stdin
    const singleRun = await executeCode(language, code, stdin || "");
    return res.json({
      type: "single",
      output: singleRun.stdout,
      error: singleRun.stderr,
      time: singleRun.time,
    });
  } catch (error: any) {
    console.error("Execution error:", error);
    res.status(500).json({ error: "Lỗi thực thi mã nguồn: " + error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
