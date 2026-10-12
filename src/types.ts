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
  classGrade?: string;
  gradeLevel?: GradeLevel;
  studentCode?: string;
  password?: string;
  isGoogleLinked?: boolean;
  googleEmail?: string;
  createdAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  image?: string;
  level?: "nhan_biet" | "thong_hieu" | "van_dung" | "van_dung_cao";
  points?: number;
  topic?: string;
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
  };
  score: number;
  maxScore: number;
  rubric?: RubricCriteria;
  status: "submitted" | "graded";
  teacherFeedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  gradeLevel: GradeLevel;
  studentCount: number;
  teacherName: string;
  description: string;
  gradeNumber?: number;
  schoolYear?: string;
  room?: string;
  createdAt?: string;
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
  outcomes: string[];  // Yêu cầu cần đạt
  keywords: string[];
  recommendedLab?: "python" | "html" | "scratch" | "general";
  labActionText?: string;
}
