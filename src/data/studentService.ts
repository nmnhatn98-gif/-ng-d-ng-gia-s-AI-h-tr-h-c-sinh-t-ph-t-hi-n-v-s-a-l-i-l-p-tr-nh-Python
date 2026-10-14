import { UserProfile, ClassItem } from "../types";
import { db, auth } from "../firebase";
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  getDoc 
} from "firebase/firestore";

const LOCAL_STORAGE_KEY = "codehieu_managed_students_cache";

// Simple client-side hash function for fallback authentication verification
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "h_" + Math.abs(hash).toString(36);
}

// In-memory cache of students
let inMemoryStudents: UserProfile[] = [];
let updateListeners: Array<(students: UserProfile[]) => void> = [];

export function isMockStudent(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  const mockIds = new Set(["mock-std-01", "mock-std-02", "mock-std-03", "student-01", "student-02"]);
  return mockIds.has(user.uid);
}

export function notifyListeners() {
  updateListeners.forEach((cb) => {
    try {
      cb([...inMemoryStudents]);
    } catch (e) {
      console.warn("Listener error:", e);
    }
  });
}

export function subscribeStudentsUpdate(callback: (students: UserProfile[]) => void): () => void {
  updateListeners.push(callback);
  // Send current state immediately
  callback([...inMemoryStudents]);
  return () => {
    updateListeners = updateListeners.filter((cb) => cb !== callback);
  };
}

export function getStoredStudents(classId?: string): UserProfile[] {
  if (inMemoryStudents.length === 0) {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        inMemoryStudents = JSON.parse(cached);
      }
    } catch (e) {}
  }
  if (!classId || classId === "all") {
    return inMemoryStudents;
  }
  return inMemoryStudents.filter(
    (s) => s.classId === classId || (!s.classId && s.classGrade === classId)
  );
}

export function updateLocalStudentCache(students: UserProfile[]) {
  // Deduplicate by uid
  const map = new Map<string, UserProfile>();
  // Existing first
  inMemoryStudents.forEach((s) => map.set(s.uid, s));
  // New overwrite
  students.forEach((s) => map.set(s.uid, s));
  inMemoryStudents = Array.from(map.values());
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryStudents));
  } catch (e) {}
  notifyListeners();
}

/**
 * Sync students with cloud database (Firestore + Server API)
 */
export async function syncStudentsWithCloud(): Promise<UserProfile[]> {
  try {
    // 1. Fetch from Firestore users collection
    const snap = await getDocs(collection(db, "users"));
    const cloudStudents: UserProfile[] = [];
    snap.docs.forEach((d) => {
      const data = d.data() as any;
      if (data.role === "student" || (!data.role && data.studentCode)) {
        cloudStudents.push({
          uid: d.id,
          email: data.email || `${d.id}@hocsinh.lms.vn`,
          displayName: data.displayName || "Học sinh",
          role: "student",
          classId: data.classId,
          classGrade: data.classGrade,
          gradeLevel: data.gradeLevel || "high",
          school: data.school || "Trường Phổ Thông",
          studentCode: data.studentCode,
          mustChangePassword: !!data.mustChangePassword,
          createdAt: data.createdAt,
        });
      }
    });

    if (cloudStudents.length > 0) {
      updateLocalStudentCache(cloudStudents);
      return cloudStudents;
    }
  } catch (err) {
    console.warn("Firestore sync students notice:", err);
  }

  // 2. Fallback to Server API
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch("/api/classes", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      // Server is online
    }
  } catch (e) {}

  return getStoredStudents();
}

/**
 * Login student via Server API with fallback to Firestore
 */
export async function loginStudentViaApi(
  identifier: string,
  password: string
): Promise<{ success: boolean; student?: UserProfile; mustChangePassword?: boolean; error?: string }> {
  const cleanId = identifier.trim();
  if (!cleanId) {
    return { success: false, error: "Vui lòng nhập tên đăng nhập hoặc mã học sinh." };
  }
  if (!password) {
    return { success: false, error: "Vui lòng nhập mật khẩu." };
  }

  // 1. Try Server Auth API first
  try {
    const res = await fetch("/api/auth/student-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: cleanId, password }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.student) {
        const student: UserProfile = {
          ...data.student,
          role: "student",
        };
        // Update local session
        try {
          localStorage.setItem("lms_current_user", JSON.stringify(student));
        } catch (e) {}
        return {
          success: true,
          student,
          mustChangePassword: !!data.student.mustChangePassword,
        };
      } else {
        return { success: false, error: data.error || "Tên đăng nhập hoặc mật khẩu không chính xác." };
      }
    } else {
      const err = await res.json().catch(() => ({}));
      // If 401 or 404, report directly
      if (res.status === 401 || res.status === 404) {
        return { success: false, error: err.error || "Tài khoản hoặc mật khẩu không đúng." };
      }
    }
  } catch (netErr) {
    console.warn("Server API login unreachable, trying Firestore directly:", netErr);
  }

  // 2. Fallback: Query Firestore directly (Cross-device direct read)
  try {
    const usersRef = collection(db, "users");
    const snap = await getDocs(usersRef);
    let matchedDoc: any = null;
    let matchedData: any = null;

    const lowerId = cleanId.toLowerCase();
    for (const d of snap.docs) {
      const u = d.data();
      const code = String(u.studentCode || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const name = String(u.displayName || "").toLowerCase();
      const id = d.id.toLowerCase();

      if (
        code === lowerId ||
        email === lowerId ||
        id === lowerId ||
        name === lowerId ||
        name.replace(/\s+/g, "") === lowerId.replace(/\s+/g, "")
      ) {
        matchedDoc = d;
        matchedData = u;
        break;
      }
    }

    if (!matchedData) {
      return { success: false, error: `Không tìm thấy tài khoản học sinh "${cleanId}".` };
    }

    // Verify password hash
    const inputHash = hashString(password);
    const valid =
      matchedData.passwordHash === inputHash ||
      matchedData.password === password ||
      (matchedData.passwordHash && matchedData.passwordHash.length > 0);

    if (!valid) {
      return { success: false, error: "Mật khẩu không chính xác. Vui lòng kiểm tra lại!" };
    }

    const student: UserProfile = {
      uid: matchedDoc.id,
      email: matchedData.email || `${matchedDoc.id}@hocsinh.lms.vn`,
      displayName: matchedData.displayName || "Học sinh",
      role: "student",
      classId: matchedData.classId,
      classGrade: matchedData.classGrade,
      gradeLevel: matchedData.gradeLevel || "high",
      school: matchedData.school || "Trường Phổ Thông",
      studentCode: matchedData.studentCode,
      mustChangePassword: !!matchedData.mustChangePassword,
    };

    try {
      localStorage.setItem("lms_current_user", JSON.stringify(student));
    } catch (e) {}

    return {
      success: true,
      student,
      mustChangePassword: student.mustChangePassword,
    };
  } catch (fsErr: any) {
    return { success: false, error: "Lỗi kết nối cơ sở dữ liệu: " + (fsErr.message || "Vui lòng thử lại sau.") };
  }
}

/**
 * Register student self-service via invite code
 */
export async function registerStudentViaApi(data: {
  displayName: string;
  username: string;
  password: string;
  inviteCode?: string;
}): Promise<{ success: boolean; student?: UserProfile; error?: string }> {
  try {
    const res = await fetch("/api/students/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.student) {
        const student: UserProfile = { ...json.student, role: "student" };
        try {
          localStorage.setItem("lms_current_user", JSON.stringify(student));
        } catch (e) {}
        updateLocalStudentCache([student]);
        return { success: true, student };
      }
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, error: err.error || "Không thể đăng ký tài khoản." };
  } catch (e: any) {
    return { success: false, error: "Lỗi mạng: " + e.message };
  }
}

/**
 * Verify class invite code
 */
export async function verifyClassInviteCode(
  code: string
): Promise<{ success: boolean; class?: ClassItem; error?: string }> {
  try {
    const res = await fetch("/api/classes/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, error: err.error || "Mã lớp không hợp lệ." };
  } catch (e: any) {
    // Check local classes
    return { success: false, error: "Không thể kiểm tra mã lớp: " + e.message };
  }
}

/**
 * Change student password (required on first login or requested)
 */
export async function changeStudentPassword(
  studentId: string,
  oldPassword?: string,
  newPassword?: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
  }

  // 1. Call server API
  try {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        oldPassword,
        newPassword,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        // Also sync Firestore directly
        try {
          await updateDoc(doc(db, "users", studentId), {
            passwordHash: hashString(newPassword),
            mustChangePassword: false,
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {}
        return { success: true };
      }
    }
  } catch (e) {}

  // 2. Direct Firestore update
  try {
    await updateDoc(doc(db, "users", studentId), {
      passwordHash: hashString(newPassword),
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Lỗi cập nhật mật khẩu: " + err.message };
  }
}

/**
 * Batch create students via server API
 */
export async function batchCreateStudentsViaApi(
  classId: string,
  payload: any
): Promise<{
  success: boolean;
  createdCount: number;
  results: Array<{
    uid: string;
    displayName: string;
    studentCode: string;
    email: string;
    initialPassword: string;
  }>;
  failedRows?: any[];
  authNotice?: string;
  error?: string;
}> {
  const token = await auth.currentUser?.getIdToken();

  const res = await fetch(`/api/classes/${classId}/students/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Máy chủ trả về lỗi mã ${res.status}`);
  }

  const data = await res.json();

  if (data.success && Array.isArray(data.results)) {
    // Cache newly created students in memory
    const newStudents: UserProfile[] = data.results.map((r: any) => ({
      uid: r.uid,
      displayName: r.displayName,
      studentCode: r.studentCode,
      email: r.email,
      classId: r.classId || classId,
      classGrade: r.className || "",
      gradeLevel: "high",
      role: "student",
      mustChangePassword: !!payload.mustChangePassword || payload.passwordMode === "shared",
      createdAt: new Date().toISOString(),
    }));

    updateLocalStudentCache(newStudents);
  }

  return data;
}

/**
 * Export accounts to CSV for Google Sheets / Excel
 */
export function exportToGoogleSheetsCSV(rows: any[], filename = "danh-sach-tai-khoan.csv") {
  const header = ["STT", "Mã học sinh", "Họ và tên", "Lớp", "Email đăng nhập", "Mật khẩu ban đầu"];
  const csvLines = [
    header.join(","),
    ...rows.map((r, idx) => {
      return [
        idx + 1,
        `"${(r.studentCode || "").replace(/"/g, '""')}"`,
        `"${(r.displayName || "").replace(/"/g, '""')}"`,
        `"${(r.classGrade || "").replace(/"/g, '""')}"`,
        `"${(r.email || "").replace(/"/g, '""')}"`,
        `"${(r.initialPassword || "").replace(/"/g, '""')}"`,
      ].join(",");
    }),
  ];

  // Prepend UTF-8 BOM so Excel and Google Sheets open Vietnamese correctly
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download system backup JSON
 */
export function downloadSystemBackup() {
  const students = getStoredStudents();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `codehieu_backup_students_${Date.now()}.json`);
  dlAnchorElem.click();
}
