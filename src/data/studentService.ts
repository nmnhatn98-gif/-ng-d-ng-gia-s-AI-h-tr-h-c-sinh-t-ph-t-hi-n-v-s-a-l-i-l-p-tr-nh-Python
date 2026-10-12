import { UserProfile, GradeLevel } from "../types";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, writeBatch } from "firebase/firestore";

export const INITIAL_SYSTEM_STUDENTS: UserProfile[] = [];

const MOCK_STUDENT_UIDS = new Set([
  "std-sample-001",
  "std-sample-002",
  "std-sample-003",
]);

export function isMockStudent(student: { uid?: string } | null | undefined): boolean {
  if (!student || !student.uid) return false;
  return MOCK_STUDENT_UIDS.has(student.uid);
}

const LOCAL_STORAGE_KEY = "lms_registered_students";
const LOCAL_VAULT_KEY = "lms_registered_students_vault";

/**
 * Lắng nghe sự kiện cập nhật danh sách học sinh theo thời gian thực
 */
export function subscribeStudentsUpdate(callback: (students: UserProfile[]) => void): () => void {
  const handler = () => {
    callback(getStoredStudents());
  };
  window.addEventListener("lms:students-updated", handler);
  return () => {
    window.removeEventListener("lms:students-updated", handler);
  };
}

function notifyStudentsUpdated(students: UserProfile[]) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lms:students-updated", { detail: students }));
  }
}

/**
 * Lấy danh sách học sinh từ localStorage hoặc khôi phục từ Vault
 */
export function getStoredStudents(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Fallback: Kiểm tra két lưu trữ an toàn (Local Vault)
    const vaultRaw = localStorage.getItem(LOCAL_VAULT_KEY);
    if (vaultRaw) {
      const vaultParsed = JSON.parse(vaultRaw);
      if (Array.isArray(vaultParsed) && vaultParsed.length > 0) {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(vaultParsed));
        } catch (e) {}
        return vaultParsed;
      }
    }
  } catch (e) {
    console.warn("Could not read students from localStorage:", e);
  }
  return [];
}

/**
 * Tra cứu học sinh trực tuyến từ Máy chủ & Két dữ liệu vĩnh viễn
 */
export async function lookupStudentOnline(query: string): Promise<UserProfile | null> {
  const cleanQ = query.trim();
  if (!cleanQ) return null;

  // 1. Kiểm tra bộ nhớ cục bộ trước
  const localList = getStoredStudents();
  const lowerQ = cleanQ.toLowerCase();
  const localMatch = localList.find(
    (s) =>
      s.studentCode?.toLowerCase() === lowerQ ||
      s.email?.toLowerCase() === lowerQ ||
      s.displayName.toLowerCase() === lowerQ ||
      s.displayName.toLowerCase().replace(/\s+/g, "") === lowerQ.replace(/\s+/g, "")
  );
  if (localMatch) return localMatch;

  // 2. Tra cứu trực tiếp trên Server API
  try {
    const res = await fetch(`/api/students/lookup?q=${encodeURIComponent(cleanQ)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.student) {
        const found = data.student as UserProfile;
        // Tự động khôi phục vào local storage
        const current = getStoredStudents();
        if (!current.some((s) => s.uid === found.uid)) {
          const merged = [found, ...current];
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(merged));
          } catch (e) {}
          notifyStudentsUpdated(merged);
        }
        return found;
      }
    }
  } catch (err) {
    console.warn("Lookup student online notice:", err);
  }

  return null;
}

/**
 * Khôi phục toàn bộ học sinh từ Két máy chủ (Server Vault)
 */
export async function restoreFromStudentVault(): Promise<UserProfile[]> {
  try {
    const res = await fetch("/api/students/restore-vault", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.students)) {
        await saveStudents(data.students);
        return data.students;
      }
    }
  } catch (err) {
    console.warn("Restore from vault notice:", err);
  }
  return getStoredStudents();
}

/**
 * Đồng bộ hóa hai chiều danh sách học sinh từ Máy chủ (Server Disk) & Đám mây (Firestore)
 * Đảm bảo tài khoản học sinh KHÔNG BAO GIỜ bị mất khi cập nhật code hay tải lại trang
 */
export async function syncStudentsWithCloud(): Promise<UserProfile[]> {
  const localList = getStoredStudents();
  const mergedMap = new Map<string, UserProfile>();

  // 1. Đưa localList vào bản đồ
  localList.forEach((s) => {
    if (s.uid) mergedMap.set(s.uid, s);
    if (s.studentCode) mergedMap.set(`code:${s.studentCode.toUpperCase()}`, s);
  });

  // 2. Tải từ Server Persistent Storage (/api/students)
  try {
    const res = await fetch("/api/students");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.students)) {
        data.students.forEach((s: UserProfile) => {
          const codeKey = s.studentCode ? `code:${s.studentCode.toUpperCase()}` : null;
          const existing = mergedMap.get(s.uid) || (codeKey && mergedMap.get(codeKey));
          if (existing) {
            Object.assign(existing, s);
          } else {
            mergedMap.set(s.uid, s);
            if (codeKey) mergedMap.set(codeKey, s);
          }
        });
      }
    }
  } catch (err) {
    console.warn("Server /api/students sync notice:", err);
  }

  // 3. Tải từ Cloud Firestore (users collection)
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    if (!usersSnap.empty) {
      usersSnap.docs.forEach((d) => {
        const data = d.data() as UserProfile;
        const codeKey = data.studentCode ? `code:${data.studentCode.toUpperCase()}` : null;
        const existing = mergedMap.get(d.id) || (codeKey && mergedMap.get(codeKey));
        if (existing) {
          Object.assign(existing, data);
        } else {
          mergedMap.set(d.id, { ...data, uid: d.id });
          if (codeKey) mergedMap.set(codeKey, data);
        }
      });
    }
  } catch (err) {
    console.warn("Firestore users sync notice:", err);
  }

  // Thu hoạch danh sách duy nhất theo uid
  const uniqueStudents: UserProfile[] = [];
  const seenUids = new Set<string>();
  for (const item of mergedMap.values()) {
    if (item.uid && !seenUids.has(item.uid)) {
      seenUids.add(item.uid);
      uniqueStudents.push(item);
    }
  }

  // Nếu có học sinh, bảo đảm lưu cả 2 tầng: Storage & Vault
  if (uniqueStudents.length > 0) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(uniqueStudents));
      localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(uniqueStudents));
    } catch (e) {
      console.warn("Could not save synced students to localStorage:", e);
    }
    notifyStudentsUpdated(uniqueStudents);

    // Đồng bộ ngược lại lên server nếu server đang thiếu
    try {
      fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: uniqueStudents }),
      }).catch(() => {});
    } catch (e) {}
  }

  return uniqueStudents.length > 0 ? uniqueStudents : localList;
}

/**
 * Lưu danh sách học sinh ĐA TẦNG:
 * Tầng 1: LocalStorage & Local Vault (trên trình duyệt)
 * Tầng 2: Server Disk Database & Server Vault (/api/students)
 * Tầng 3: Cloud Firestore (bộ sưu tập users)
 */
export async function saveStudents(students: UserProfile[]): Promise<void> {
  // 1. Cập nhật ngay lập tức vào LocalStorage & Local Vault
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students));
    if (students.length > 0) {
      localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(students));
    }
  } catch (e) {
    console.warn("Could not write students to localStorage:", e);
  }
  notifyStudentsUpdated(students);

  // 2. Lưu bền vững vào Server Disk Storage & Vault
  try {
    await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students }),
    });
  } catch (srvErr) {
    console.warn("Could not persist students to server storage:", srvErr);
  }

  // 3. Đồng bộ hóa lên Cloud Firestore
  try {
    const batch = writeBatch(db);
    students.slice(0, 50).forEach((student) => {
      const studentRef = doc(db, "users", student.uid);
      batch.set(
        studentRef,
        {
          uid: student.uid,
          displayName: student.displayName,
          email: student.email,
          role: "student",
          studentCode: student.studentCode || "",
          classGrade: student.classGrade || "",
          gradeLevel: student.gradeLevel || "middle",
          school: student.school || "Trường Phổ Thông",
          password: student.password || "123",
          isGoogleLinked: !!student.isGoogleLinked,
          googleEmail: student.googleEmail || "",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });
    await batch.commit();
  } catch (err) {
    console.warn("Firestore sync students notice:", err);
  }
}

/**
 * Tải toàn bộ bản sao lưu hệ thống (Backup JSON) để lưu trữ an toàn trên máy giáo viên
 */
export async function downloadSystemBackup(): Promise<void> {
  try {
    const res = await fetch("/api/system/backup");
    let backupObj: any;
    if (res.ok) {
      backupObj = await res.json();
    } else {
      // Fallback lấy từ local storage
      const localStudents = getStoredStudents();
      backupObj = {
        timestamp: new Date().toISOString(),
        system: "STEM_TINHOC_LMS_LOCAL_FALLBACK",
        data: {
          students: localStudents,
          submissions: [],
        },
      };
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sao-luu-lms-stem-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error("Backup download error:", err);
    throw err;
  }
}

/**
 * Khôi phục hệ thống từ tệp tin sao lưu JSON
 */
export async function restoreSystemBackupFromFile(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    const res = await fetch("/api/system/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ backupData: parsed }),
    });

    if (res.ok) {
      const result = await res.json();
      await syncStudentsWithCloud();
      return { success: true, message: result.message || "Khôi phục dữ liệu thành công!" };
    } else {
      // Khôi phục thủ công vào local
      const students = parsed.data?.students || parsed.students || [];
      if (Array.isArray(students) && students.length > 0) {
        await saveStudents(students);
        return { success: true, message: `Đã khôi phục thành công ${students.length} tài khoản vào hệ thống!` };
      }
      return { success: false, message: "Tệp tin không chứa dữ liệu học sinh hợp lệ." };
    }
  } catch (err: any) {
    return { success: false, message: "Lỗi giải mã tệp tin sao lưu: " + err.message };
  }
}

/**
 * Tạo tự động một tài khoản học sinh mới
 */
export async function registerNewStudent(params: {
  displayName: string;
  classGrade: string;
  gradeLevel?: GradeLevel;
  studentCode?: string;
  password?: string;
  email?: string;
  school?: string;
  googleEmail?: string;
  isGoogleLinked?: boolean;
}): Promise<UserProfile> {
  const currentList = getStoredStudents();
  const safeClass = params.classGrade.trim() || "Chưa phân lớp";
  const cleanName = params.displayName.trim();
  
  // Tự sinh mã học sinh nếu chưa có
  let code = params.studentCode?.trim();
  if (!code) {
    const classTag = safeClass.replace(/\s+/g, "").toUpperCase();
    const existingInClass = currentList.filter(s => s.classGrade?.toLowerCase() === safeClass.toLowerCase());
    const seq = String(existingInClass.length + 1).padStart(2, "0");
    code = `HS-${classTag}-${seq}`;
  }

  // Xác định cấp học tương ứng: dùng params.gradeLevel nếu có
  let gradeLevel: GradeLevel = params.gradeLevel || "middle";
  if (!params.gradeLevel) {
    const lowerClass = safeClass.toLowerCase();
    if (lowerClass.includes("1") || lowerClass.includes("2") || lowerClass.includes("3") || lowerClass.includes("4") || lowerClass.includes("5") || lowerClass.includes("tiểu học") || lowerClass.includes("th")) {
      gradeLevel = "elementary";
    } else if (lowerClass.includes("10") || lowerClass.includes("11") || lowerClass.includes("12") || lowerClass.includes("thpt") || lowerClass.includes("chuyên")) {
      gradeLevel = "high";
    } else if (lowerClass.includes("robot") || lowerClass.includes("stem") || lowerClass.includes("iot")) {
      gradeLevel = "robotics";
    }
  }

  const uid = `std-reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const email = params.email?.trim() || `${code.toLowerCase().replace(/[^a-z0-9]/g, "")}@hocsinh.lms.vn`;

  const newStudent: UserProfile = {
    uid,
    displayName: cleanName,
    role: "student",
    studentCode: code,
    classGrade: safeClass,
    gradeLevel,
    email,
    school: params.school?.trim() || "Trường Phổ Thông",
    password: params.password?.trim() || "123456",
    isGoogleLinked: !!params.isGoogleLinked,
    googleEmail: params.googleEmail?.trim() || (params.isGoogleLinked ? email : undefined),
    createdAt: new Date().toISOString(),
  };

  // Ghi trực tiếp tức thì lên API máy chủ & Két vĩnh viễn
  try {
    fetch("/api/students/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student: newStudent }),
    }).catch((err) => console.warn("Atomic server register note:", err));
  } catch (e) {}

  const updated = [newStudent, ...currentList];
  await saveStudents(updated);
  return newStudent;
}

/**
 * Giáo viên tạo nhanh hàng loạt học sinh theo Lớp
 */
export async function generateBatchStudentsByClass(params: {
  className: string;
  count: number;
  prefixCode?: string;
  defaultPassword?: string;
  schoolName?: string;
  gradeLevel?: GradeLevel;
  customNames?: string[];
}): Promise<UserProfile[]> {
  const currentList = getStoredStudents();
  const safeClass = params.className.trim();
  const prefix = params.prefixCode?.trim() || `HS-${safeClass.replace(/\s+/g, "").toUpperCase()}`;
  const defPassword = params.defaultPassword?.trim() || "123456";
  const school = params.schoolName?.trim() || "Trường Phổ Thông";

  const newStudents: UserProfile[] = [];

  // Tên mẫu tiếng Việt nếu không có danh sách custom
  const SAMPLE_FIRST_NAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
  const SAMPLE_MIDDLE_NAMES = ["Văn", "Thị", "Hải", "Minh", "Đức", "Quang", "Anh", "Thu", "Ngọc", "Gia", "Thanh", "Bảo", "Khánh"];
  const SAMPLE_LAST_NAMES = ["An", "Bình", "Cường", "Dũng", "Em", "Giang", "Hà", "Huy", "Khoa", "Linh", "Mai", "Nam", "Phúc", "Quân", "Sơn", "Tâm", "Uyên", "Vinh"];

  const count = params.customNames && params.customNames.length > 0 ? params.customNames.length : params.count;

  for (let i = 1; i <= count; i++) {
    const seq = String(i).padStart(2, "0");
    const code = `${prefix}-${seq}`;
    
    let displayName = "";
    if (params.customNames && params.customNames[i - 1]) {
      displayName = params.customNames[i - 1].trim();
    } else {
      const f = SAMPLE_FIRST_NAMES[(i * 3) % SAMPLE_FIRST_NAMES.length];
      const m = SAMPLE_MIDDLE_NAMES[(i * 2) % SAMPLE_MIDDLE_NAMES.length];
      const l = SAMPLE_LAST_NAMES[i % SAMPLE_LAST_NAMES.length];
      displayName = `${f} ${m} ${l}`;
    }

    const uid = `std-batch-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`;
    const email = `${code.toLowerCase().replace(/[^a-z0-9]/g, "")}@${safeClass.toLowerCase().replace(/[^a-z0-9]/g, "")}.lms.vn`;

    newStudents.push({
      uid,
      studentCode: code,
      displayName,
      role: "student",
      classGrade: safeClass,
      gradeLevel: params.gradeLevel || "middle",
      email,
      school,
      password: defPassword,
      isGoogleLinked: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Lọc bỏ trùng mã nếu đã tồn tại
  const existingCodes = new Set(currentList.map(s => s.studentCode));
  const filteredNew = newStudents.filter(s => !existingCodes.has(s.studentCode));

  const merged = [...filteredNew, ...currentList];
  await saveStudents(merged);
  return filteredNew;
}

/**
 * Phân tích dữ liệu sao chép trực tiếp từ Google Sheets / Bảng tính Excel
 * Hỗ trợ định dạng phân cách bởi Tab (\t) hoặc Phẩy (,)
 */
export function parseGoogleSheetsText(
  pastedText: string,
  defaultClass: string = ""
): {
  students: Array<{
    name: string;
    code?: string;
    classGrade?: string;
    email?: string;
    password?: string;
  }>;
  totalParsed: number;
} {
  const lines = pastedText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const results: Array<{
    name: string;
    code?: string;
    classGrade?: string;
    email?: string;
    password?: string;
  }> = [];

  for (const line of lines) {
    // Bỏ qua dòng tiêu đề nếu có
    const lower = line.toLowerCase();
    if (
      lower.includes("họ và tên") || 
      lower.includes("họ tên") || 
      lower.includes("mã học sinh") || 
      lower.includes("mã hs") || 
      lower.startsWith("stt\t")
    ) {
      continue;
    }

    // Tách theo Tab (chuẩn khi copy từ Google Sheets/Excel) hoặc dấu phẩy/chấm phẩy
    const separator = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
    const parts = line.split(separator).map(p => p.trim().replace(/^["']|["']$/g, ""));

    if (parts.length === 1 && parts[0].length > 1) {
      // Chỉ có tên học sinh
      results.push({
        name: parts[0],
        classGrade: defaultClass,
      });
    } else if (parts.length >= 2) {
      // Trường hợp có 2 hoặc nhiều cột:
      // Phổ biến: [STT, Họ tên] hoặc [Mã HS, Họ tên] hoặc [Họ tên, Lớp] hoặc [Họ tên, Mã HS, Lớp, Email]
      let name = "";
      let code = "";
      let classGrade = defaultClass;
      let email = "";
      let password = "";

      // Kiểm tra xem cột 0 có phải là số thứ tự (STT) không
      const isFirstColNumber = /^\d+$/.test(parts[0]);

      if (isFirstColNumber) {
        // [STT, Họ tên, ...] hoặc [STT, Mã HS, Họ tên, ...]
        if (parts.length >= 3 && /^HS|^\d{4,}/i.test(parts[1])) {
          code = parts[1];
          name = parts[2];
          if (parts[3]) classGrade = parts[3];
          if (parts[4]) email = parts[4];
          if (parts[5]) password = parts[5];
        } else {
          name = parts[1] || "";
          if (parts[2]) {
            if (parts[2].includes("@")) email = parts[2];
            else if (/^HS/i.test(parts[2])) code = parts[2];
            else classGrade = parts[2];
          }
          if (parts[3]) {
            if (parts[3].includes("@")) email = parts[3];
            else password = parts[3];
          }
        }
      } else {
        // Cột 0 không phải là số: có thể là Mã HS hoặc Họ tên
        if (/^HS|^\d{5,}/i.test(parts[0])) {
          code = parts[0];
          name = parts[1] || "";
          if (parts[2]) classGrade = parts[2];
          if (parts[3]) email = parts[3];
          if (parts[4]) password = parts[4];
        } else {
          name = parts[0];
          if (parts[1]) {
            if (parts[1].includes("@")) email = parts[1];
            else if (/^HS/i.test(parts[1])) code = parts[1];
            else classGrade = parts[1];
          }
          if (parts[2]) {
            if (parts[2].includes("@")) email = parts[2];
            else password = parts[2];
          }
        }
      }

      if (name) {
        results.push({
          name,
          code: code || undefined,
          classGrade: classGrade || defaultClass,
          email: email || undefined,
          password: password || undefined,
        });
      }
    }
  }

  return {
    students: results,
    totalParsed: results.length,
  };
}

/**
 * Định dạng danh sách học sinh thành bảng dữ liệu TSV (Tab Separated Values)
 * để giáo viên có thể dán trực tiếp (Ctrl + V) vào Google Sheets
 */
export function generateGoogleSheetsTSV(students: UserProfile[]): string {
  const headers = [
    "STT",
    "Mã Học Sinh",
    "Họ Và Tên",
    "Lớp Học",
    "Tên Đăng Nhập / Email",
    "Mật Khẩu Mặc Định",
    "Liên Kết Google",
    "Email Google",
    "Trường Học"
  ];

  const rows = students.map((s, idx) => [
    idx + 1,
    s.studentCode || `HS-${idx + 1}`,
    s.displayName,
    s.classGrade || "",
    s.email,
    s.password || "123456",
    s.isGoogleLinked ? "Đã liên kết" : "Chưa liên kết",
    s.googleEmail || "",
    s.school || "Trường Phổ Thông"
  ]);

  return [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
}

/**
 * Xuất file CSV có BOM (Byte Order Mark) chuẩn UTF-8 để mở trong Google Sheets / Excel
 * không bao giờ bị lỗi font tiếng Việt
 */
export function exportToGoogleSheetsCSV(students: UserProfile[], filename: string = "danh-sach-hoc-sinh-stem.csv"): void {
  const headers = [
    "STT",
    "Mã Học Sinh",
    "Họ Và Tên",
    "Lớp",
    "Tài Khoản / Email",
    "Mật Khẩu Ban Đầu",
    "Trạng Thái Google",
    "Email Google",
    "Trường Học"
  ];

  const rows = students.map((s, idx) => [
    `"${idx + 1}"`,
    `"${s.studentCode || `HS-${idx + 1}`}"`,
    `"${s.displayName.replace(/"/g, '""')}"`,
    `"${(s.classGrade || "").replace(/"/g, '""')}"`,
    `"${s.email}"`,
    `"${s.password || "123456"}"`,
    `"${s.isGoogleLinked ? "Đã liên kết Google" : "Chưa liên kết"}"`,
    `"${s.googleEmail || ""}"`,
    `"${(s.school || "").replace(/"/g, '""')}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
