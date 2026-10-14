export type UserRole = "teacher" | "student";

export type GradeLevel = "elementary" | "middle" | "high" | "robotics";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatar?: string;
  photoURL?: string;
  school?: string;
  classId?: string;
  classGrade?: string;
  gradeLevel?: GradeLevel;
  studentCode?: string;
  password?: string;
  passwordHash?: string;
  isGoogleLinked?: boolean;
  googleEmail?: string;
  mustChangePassword?: boolean;
  createdAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex?: number; // Chỉ có trên phiên giáo viên hoặc máy chủ bảo vệ (bảo mật tuyệt đối)
  explanation?: string;  // Chỉ trả về khi bài nộp đã được chấm và chính sách bài cho phép
  image?: string;
  level?: "nhan_biet" | "thong_hieu" | "van_dung" | "van_dung_cao";
  points?: number;
  topic?: string;
}

export interface LessonKeyItem {
  id: string;
  correctIndex: number;
  explanation: string;
}

export interface LessonSolutionKey {
  lessonId: string;
  quizKeys?: LessonKeyItem[];
  hiddenTestcases?: TestCase[];
  updatedAt: string;
}

export interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface TestResult {
  id: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  error?: string;
  passed: boolean;
  time?: number;
}

export interface RubricCriteria {
  idea: number;        // Thang điểm 1-10: Ý tưởng sáng tạo
  technique: number;   // Thang điểm 1-10: Kỹ thuật & Độ hoàn thiện
  presentation: number;// Thang điểm 1-10: Trình bày & Thuyết trình
  feedback?: string;
}

export interface AssignmentAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  level: GradeLevel;
  moduleType: "scratch" | "quiz" | "coding" | "robotics" | "html";
  language?: "python" | "cpp" | "html";
  starterCode?: string;
  htmlStarter?: string;
  cssStarter?: string;
  jsStarter?: string;
  scratchProjectId?: string;
  questions?: QuizQuestion[];
  testcases?: TestCase[];
  rubricTemplate?: {
    maxIdea: number;
    maxTechnique: number;
    maxPresentation: number;
  };
  durationMinutes: number;
  createdAt: string;

  // Assignment creation form attributes (Tạo bài tập mới)
  gradeName?: string;
  subject?: string;
  purpose?: string;
  startDate?: string;
  dueDate?: string;
  targetClasses?: string[];
  attachments?: AssignmentAttachment[];
  richContent?: string;
  submissionType?: "online_text" | "file_upload" | "code_editor" | "quiz";
  maxScore?: number;
  allowReviewAfterDue?: boolean;
}

export interface Submission {
  id: string;
  lessonId: string;
  lessonTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  moduleType: "scratch" | "quiz" | "coding" | "robotics" | "html";
  content: {
    code?: string;
    language?: string;
    stdin?: string;
    consoleOutput?: string;
    templateKey?: string;
    htmlCode?: string;
    cssCode?: string;
    jsCode?: string;
    testResults?: TestResult[];
    passedCount?: number;
    totalCount?: number;
    quizAnswers?: number[];
    videoUrl?: string;
    codeFileName?: string;
    codeFileContent?: string;
    projectDescription?: string;
    debugSession?: DebugSession;
  };
  score: number | null;
  maxScore: number;
  rubric?: RubricCriteria;
  status: "submitted" | "graded";
  teacherFeedback?: string;
  submittedAt: string;
  gradedAt?: string;
  evaluation?: TeacherDebugEvaluation;
}

export interface DebugRunItem {
  id: string;
  timestamp: string;
  code: string;
  stdin: string;
  output: string;
  error?: string;
  timeMs?: number;
  passed?: boolean;
}

export interface AiHintItem {
  id: string;
  timestamp: string;
  level: 1 | 2 | 3;
  prompt: string;
  response: string;
  source: "ai" | "fallback";
}

export interface StudentReflection {
  errorEncountered: string; // Em gặp lỗi gì?
  errorReason: string;       // Vì sao xảy ra lỗi?
  howFixed: string;          // Em đã sửa như thế nào?
}

export interface TeacherDebugEvaluation {
  errorIdentification: number; // Tiêu chí 1: Xác định lỗi (0 - 2.5đ)
  reasonExplanation: number;   // Tiêu chí 2: Giải thích nguyên nhân (0 - 2.5đ)
  correctFix: number;          // Tiêu chí 3: Sửa đúng (0 - 2.5đ)
  application: number;         // Tiêu chí 4: Vận dụng (0 - 2.5đ)
  totalScore: number;          // Tổng 10 điểm
  feedback: string;
  approvedByTeacher: boolean;
  gradedAt?: string;
}

export interface DebugSession {
  sessionId: string;
  studentId: string;
  studentCode?: string;
  studentName?: string;
  lessonId: string;
  lessonTitle: string;
  startedAt: string;
  finishedAt?: string;
  initialCode: string;
  finalCode: string;
  runs: DebugRunItem[];
  hints: AiHintItem[];
  reflection?: StudentReflection;
  evaluation?: TeacherDebugEvaluation;
  saveStatus?: "idle" | "saving" | "saved" | "error";
}

export interface ClassItem {
  id: string;
  name: string;
  gradeLevel: GradeLevel;
  studentCount: number;
  expectedStudentCount?: number;
  teacherName: string;
  ownerUid?: string;
  ownerEmail?: string;
  description: string;
  gradeNumber?: number;
  schoolYear?: string;
  room?: string;
  createdAt?: string;
  status: "active" | "deleted";
  deletedAt?: string;
  inviteCode?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface CurriculumTopic {
  id: string;
  gradeNumber: number; // 1 - 12
  orderIndex: number;  // 1 hoặc 2
  title: string;
  gdptCode: string;    // VD: "Chủ đề F: Thuật toán & Lập trình (GDPT 2018)"
  description: string;
  outcomes?: string[];  // Yêu cầu cần đạt
  keywords?: string[];
  recommendedLab?: "python" | "html" | "scratch" | "general";
  labActionText?: string;
}

// ==========================================
// UGOT ROBOT BRIDGE & REAL-TIME TYPES
// ==========================================

export type UgotTaskStatus =
  | "pending_approval"
  | "queued"
  | "running"
  | "completed"
  | "error"
  | "cancelled"
  | "disconnected";

export interface UgotLease {
  holderId: string;
  holderName: string;
  holderRole: "teacher" | "student";
  taskId?: string;
  acquiredAt: number;
  expiresAt: number;
}

export interface UgotDevice {
  deviceId: string;
  name: string;
  ownerEmail: string;
  allowedClasses: string[];
  robotName: string;
  robotIp: string;
  robotModel?: string;
  pythonPath?: string;
  pythonVersion?: string;
  ugotVersion?: string;
  isOnline: boolean;
  robotConnected: boolean;
  stage1Passed: boolean;
  stage2Passed: boolean;
  stage1Output?: string;
  stage2Output?: string;
  acceptingSubmissions: boolean;
  requireTeacherApproval: boolean;
  currentLease?: UgotLease | null;
  lastHeartbeat: number;
  createdAt: string;
}

export interface UgotPairingCode {
  code: string;
  teacherEmail: string;
  teacherUid: string;
  allowedClasses: string[];
  robotIp: string;
  robotName: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  createdAt: string;
}

export interface UgotTask {
  id: string;
  deviceId: string;
  robotIp: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  type: "stage1_test" | "stage2_connect" | "stage3_run" | "stage3_stop";
  code: string;
  status: UgotTaskStatus;
  approvedByTeacher?: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  stdout: string;
  stderr: string;
  exitCode?: number | null;
  robotStopped?: boolean;
  stopConfirmed?: boolean;
  stopMessage?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

