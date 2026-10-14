import { auth } from "../firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { UserProfile } from "../types";

export const SCOPES = [
  "https://www.googleapis.com/auth/drive.file"
];

// In-memory token caching (NOT in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedDriveUser: User | null = null;

// Auth state listener: clear in-memory token on logout
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
    cachedDriveUser = null;
  } else {
    cachedDriveUser = user;
  }
});

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

/**
 * Check if we currently have an active in-memory Google Drive token
 */
export function isDriveConnected(): boolean {
  return !!cachedAccessToken;
}

export function getCachedDriveUser(): User | null {
  return cachedDriveUser || auth.currentUser;
}

export function clearDriveSession() {
  cachedAccessToken = null;
}

/**
 * Requests Google Drive access via Firebase GoogleAuthProvider with the drive.file scope
 */
export async function connectGoogleDrive(): Promise<{ user: User; accessToken: string }> {
  try {
    const provider = new GoogleAuthProvider();
    SCOPES.forEach(scope => provider.addScope(scope));
    provider.setCustomParameters({
      prompt: "consent",
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error("Không lấy được mã xác thực Google Drive từ tài khoản Google.");
    }

    cachedAccessToken = credential.accessToken;
    cachedDriveUser = result.user;

    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.error("Google Drive Auth Error:", error);
    throw error;
  }
}

/**
 * Retrieve the current access token, prompting login if missing
 */
export async function getDriveAccessToken(): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  const authRes = await connectGoogleDrive();
  return authRes.accessToken;
}

/**
 * Format student list to standard CSV text
 */
export function formatStudentsToCSV(students: UserProfile[]): string {
  const headers = [
    "STT",
    "Mã Học Sinh",
    "Họ Và Tên",
    "Lớp",
    "Email LMS",
    "Mật Khẩu",
    "Cấp Học",
    "Trường",
    "Đã Liên Kết Google",
    "Email Google",
    "Ngày Tạo",
    "UID"
  ];

  const rows = students.map((s, idx) => [
    idx + 1,
    `"${(s.studentCode || "").replace(/"/g, '""')}"`,
    `"${(s.displayName || "").replace(/"/g, '""')}"`,
    `"${(s.classGrade || "").replace(/"/g, '""')}"`,
    `"${(s.email || "").replace(/"/g, '""')}"`,
    `"${(s.password || "").replace(/"/g, '""')}"`,
    `"${(s.gradeLevel || "middle").replace(/"/g, '""')}"`,
    `"${(s.school || "Trường Phổ Thông").replace(/"/g, '""')}"`,
    s.isGoogleLinked ? "Đã liên kết" : "Chưa",
    `"${(s.googleEmail || "").replace(/"/g, '""')}"`,
    `"${(s.createdAt || new Date().toISOString()).replace(/"/g, '""')}"`,
    `"${(s.uid || "").replace(/"/g, '""')}"`
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
}

/**
 * Save / export student data to Google Drive
 * Supports:
 * - "spreadsheet": Google Drive native Google Sheet (converted automatically)
 * - "csv": Standard CSV file in Google Drive
 * - "json": Full JSON data structure in Google Drive
 */
export async function saveStudentsToGoogleDrive(params: {
  students: UserProfile[];
  className?: string;
  format?: "spreadsheet" | "csv" | "json";
  customFileName?: string;
}): Promise<GoogleDriveFile> {
  const { students, className, format = "spreadsheet", customFileName } = params;
  const token = await getDriveAccessToken();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const classLabel = className && className !== "all" ? className.replace(/\s+/g, "_") : "ToanTruong";
  
  let fileName = customFileName;
  let fileMimeType = "application/vnd.google-apps.spreadsheet";
  let contentBody = "";
  let bodyContentType = "text/csv; charset=UTF-8";

  if (format === "spreadsheet") {
    fileName = fileName || `LMS_K12_DanhSachHocSinh_${classLabel}_${timestamp}`;
    fileMimeType = "application/vnd.google-apps.spreadsheet";
    // Adding UTF-8 BOM so Excel and Google Sheets render Vietnamese diacritics flawlessly
    contentBody = "\uFEFF" + formatStudentsToCSV(students);
    bodyContentType = "text/csv; charset=UTF-8";
  } else if (format === "csv") {
    fileName = fileName || `LMS_K12_DanhSachHocSinh_${classLabel}_${timestamp}.csv`;
    fileMimeType = "text/csv";
    contentBody = "\uFEFF" + formatStudentsToCSV(students);
    bodyContentType = "text/csv; charset=UTF-8";
  } else {
    fileName = fileName || `LMS_K12_BackupHocSinh_${classLabel}_${timestamp}.json`;
    fileMimeType = "application/json";
    contentBody = JSON.stringify({
      appName: "CodeHiểu",
      exportedAt: new Date().toISOString(),
      classGrade: className || "all",
      totalStudents: students.length,
      students: students,
    }, null, 2);
    bodyContentType = "application/json; charset=UTF-8";
  }

  const metadata = {
    name: fileName,
    mimeType: fileMimeType,
    description: `Dữ liệu ${students.length} học sinh hệ thống CodeHiểu (Lớp: ${className || "Tất cả"}) được lưu vào Google Drive lúc ${new Date().toLocaleString("vi-VN")}`,
  };

  const boundary = "-------CODEHIEU_DRIVE_BOUNDARY_" + Date.now();
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelimiter = "\r\n--" + boundary + "--";

  const multipartRequestBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${bodyContentType}\r\n\r\n` +
    contentBody +
    closeDelimiter;

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime,modifiedTime,size", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lỗi Google Drive API (${response.status}): ${errorText}`);
  }

  const createdFile = await response.json();
  return createdFile as GoogleDriveFile;
}

/**
 * List student files saved in Google Drive by this application
 */
export async function listStudentFilesFromDrive(): Promise<GoogleDriveFile[]> {
  const token = await getDriveAccessToken();
  
  // Search files that are not trashed
  const query = encodeURIComponent("trashed = false and (name contains 'LMS' or name contains 'HocSinh' or mimeType = 'application/vnd.google-apps.spreadsheet')");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webViewLink,createdTime,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=30`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Không thể lấy danh sách tệp từ Google Drive: ${errorText}`);
  }

  const data = await res.json();
  return (data.files || []) as GoogleDriveFile[];
}

/**
 * Delete a file from Google Drive
 * STRICT REQUIREMENT: Callers must display explicit confirmation dialog before invoking this!
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const token = await getDriveAccessToken();

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204 && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Không thể xóa tệp trên Google Drive: ${err}`);
  }
}

/**
 * Read student data from a Google Drive file (Sheets CSV export or JSON file)
 */
export async function loadStudentsFromDriveFile(file: GoogleDriveFile): Promise<UserProfile[]> {
  const token = await getDriveAccessToken();

  let url: string;
  if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
    url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
  } else {
    url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Không thể tải nội dung tệp từ Google Drive (${res.status})`);
  }

  const text = await res.text();

  // If JSON format
  if (file.mimeType === "application/json" || text.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.students)) {
        return parsed.students;
      }
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.warn("Could not parse file as JSON:", e);
    }
  }

  // Parse CSV format
  return parseCSVToStudents(text);
}

/**
 * Parse CSV text into UserProfile records
 */
function parseCSVToStudents(csvText: string): UserProfile[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const students: UserProfile[] = [];
  
  // Try to determine column mapping from header
  const headerLine = lines[0].toLowerCase();
  const isHeaderPresent = headerLine.includes("tên") || headerLine.includes("mã") || headerLine.includes("name") || headerLine.includes("stt");
  const startIndex = isHeaderPresent ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Split by comma taking quoted strings into account
    const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
    const cleanParts = parts.map(p => p.replace(/^"|"$/g, "").trim());

    if (cleanParts.length >= 2) {
      // Best effort mapping based on standard export format:
      // [STT, Mã, Tên, Lớp, Email, Mật khẩu, Cấp, Trường, Liên kết, Google Email, Ngày tạo, UID]
      let code = "";
      let name = "";
      let classGrade = "Chưa phân lớp";
      let email = "";
      let password = "123";
      let uid = `std-drive-${Date.now()}-${i}`;

      if (cleanParts.length >= 4) {
        // If STT is column 0
        if (/^\d+$/.test(cleanParts[0]) && cleanParts.length >= 5) {
          code = cleanParts[1] || "";
          name = cleanParts[2] || "";
          classGrade = cleanParts[3] || "Chưa phân lớp";
          email = cleanParts[4] || "";
          password = cleanParts[5] || "123";
          uid = cleanParts[11] || `std-drive-${Date.now()}-${i}`;
        } else {
          code = cleanParts[0] || "";
          name = cleanParts[1] || "";
          classGrade = cleanParts[2] || "Chưa phân lớp";
          email = cleanParts[3] || "";
        }
      } else {
        name = cleanParts[0] || "";
        code = cleanParts[1] || "";
      }

      if (name) {
        students.push({
          uid,
          displayName: name,
          studentCode: code || `HS-IMP-${i}`,
          classGrade,
          role: "student",
          gradeLevel: "middle",
          email: email || `${(code || name).toLowerCase().replace(/[^a-z0-9]/g, "")}@hocsinh.lms.vn`,
          password,
          school: "Trường Phổ Thông",
          isGoogleLinked: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return students;
}
