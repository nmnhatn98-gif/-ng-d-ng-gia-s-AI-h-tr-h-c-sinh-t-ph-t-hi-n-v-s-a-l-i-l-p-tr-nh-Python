import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { StudentDashboard } from "./components/StudentDashboard";
import { StudentResultsView } from "./components/StudentResultsView";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { Leaderboard } from "./components/Leaderboard";
import { ElementaryModule } from "./components/ElementaryModule";
import { CodingModule } from "./components/CodingModule";
import { RoboticsModule } from "./components/RoboticsModule";
import { QuizModule } from "./components/QuizModule";
import { HtmlEditorModule } from "./components/HtmlEditorModule";
import { PythonLabModule } from "./components/PythonLabModule";
import { UgotPracticePanel } from "./components/UgotPracticePanel";
import { LoginModal } from "./components/LoginModal";
import { AuthPage } from "./components/AuthPage";
import { AboutModal } from "./components/AboutModal";
import { Footer } from "./components/Footer";
import { 
  Lesson, 
  Submission, 
  ClassItem, 
  UserProfile, 
  GradeLevel, 
  RubricCriteria,
  UserRole 
} from "./types";
import { 
  INITIAL_LESSONS, 
  INITIAL_CLASSES, 
  INITIAL_SUBMISSIONS 
} from "./data/mockData";
import { db, auth } from "./firebase";
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { syncStudentsWithCloud, isMockStudent } from "./data/studentService";
import { ChangePasswordModal } from "./components/ChangePasswordModal";

const MOCK_CLASS_IDS = new Set([
  "cls-th-01",
  "cls-thcs-01",
  "cls-thpt-10",
  "cls-thpt-01",
  "cls-stem-01",
]);

function isMockClass(cls: ClassItem | null | undefined): boolean {
  if (!cls || !cls.id) return false;
  if (MOCK_CLASS_IDS.has(cls.id)) return true;
  return false;
}

export function App() {
  // Current user state (Học sinh or Giáo viên) - Load from localStorage if present
  // Mặc định null: Khi truy cập link lần đầu, trang đầu tiên luôn là trang Đăng ký / Đăng nhập
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("lms_current_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role === "student" && isMockStudent(parsed)) {
          localStorage.removeItem("lms_current_user");
          return null;
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Could not read saved user:", e);
    }
    return null;
  });

  // Guest exploration mode
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);

  // Login Modal State
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [loginInitialRole, setLoginInitialRole] = useState<UserRole>("student");
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  useEffect(() => {
    document.title = "CodeHiểu: Học Python cùng gia sư AI";
  }, []);

  const [activeTab, setActiveTab] = useState<string>("lessons");
  const [selectedLevel, setSelectedLevel] = useState<GradeLevel | "all">("all");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // App Data State
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    try {
      const saved = localStorage.getItem("lms_lessons");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load lessons from localStorage:", e);
    }
    return INITIAL_LESSONS;
  });
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const saved = localStorage.getItem("lms_submissions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load submissions from localStorage:", e);
    }
    return INITIAL_SUBMISSIONS;
  });
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    try {
      const saved = localStorage.getItem("lms_classes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((c: ClassItem) => !isMockClass(c));
          if (cleaned.length !== parsed.length) {
            try {
              localStorage.setItem("lms_classes", JSON.stringify(cleaned));
            } catch (e) {}
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.warn("Could not load classes from localStorage:", e);
    }
    return INITIAL_CLASSES;
  });
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Show Toast
  const showToast = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Open Login with pre-selected role portal
  const handleOpenLogin = (role: UserRole = "student") => {
    setLoginInitialRole(role);
    setIsLoginOpen(true);
  };

  // User Selection / Login completion handler
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    setIsGuestMode(false);
    setIsLoginOpen(false);
    try {
      localStorage.setItem("lms_current_user", JSON.stringify(user));
    } catch (e) {
      console.warn("Could not persist user session:", e);
    }

    if (user.role === "teacher") {
      setActiveTab("teacher-admin");
      showToast(`👨‍🏫 Đã đăng nhập Cổng Giáo Viên: ${user.displayName}`);
    } else {
      setActiveTab("lessons");
      if (user.gradeLevel) {
        setSelectedLevel(user.gradeLevel);
      }
      showToast(`👨‍🎓 Đã đăng nhập Cổng Học Sinh: ${user.displayName}`);
    }
  };

  // Effective active user (guaranteed non-null for downstream components)
  const activeUser: UserProfile = currentUser || {
    uid: "guest-explorer",
    displayName: "Khách Tham Quan",
    email: "guest@lms.edu.vn",
    role: "student",
    gradeLevel: "middle",
    classGrade: "Khách Trải Nghiệm",
    school: "Trường Phổ Thông",
    studentCode: "GUEST",
    isGoogleLinked: false,
    createdAt: new Date().toISOString(),
  };

  // Logout Handler - Clears user and returns to Login/Register Page
  const handleLogout = () => {
    try {
      localStorage.removeItem("lms_current_user");
    } catch (e) {
      console.warn("Logout note:", e);
    }
    setCurrentUser(null);
    setIsGuestMode(false);
    setSelectedLesson(null);
    setIsLoginOpen(false);
    showToast("Đã đăng xuất tài khoản. Bạn đã quay lại trang Đăng ký / Đăng nhập.");
  };

  // Sync data from Server Disk & Firestore on mount
  useEffect(() => {
    const loadPersistentData = async () => {
      // 1. Đồng bộ tài khoản học sinh hai chiều (Server Disk + Firestore + LocalStorage)
      try {
        await syncStudentsWithCloud();
      } catch (err) {
        console.warn("Student multi-layer sync notice:", err);
      }

      // 2. Đồng bộ bài nộp của học sinh từ Server Disk
      try {
        const srvRes = await fetch("/api/submissions");
        if (srvRes.ok) {
          const srvData = await srvRes.json();
          if (Array.isArray(srvData.submissions) && srvData.submissions.length > 0) {
            setSubmissions(srvData.submissions);
          }
        }
      } catch (srvErr) {
        console.warn("Server submissions fetch notice:", srvErr);
      }

      // 2B. Đồng bộ bài học từ API máy chủ bảo mật
      try {
        const token = await auth.currentUser?.getIdToken();
        const lRes = await fetch("/api/lessons", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (lRes.ok) {
          const lData = await lRes.json();
          if (Array.isArray(lData.lessons) && lData.lessons.length > 0) {
            setLessons(lData.lessons);
          }
        }
      } catch (lErr) {
        console.warn("API lessons fetch notice:", lErr);
      }

      // 3. Đồng bộ từ Cloud Firestore (nếu có bản ghi mới hơn)
      try {
        // Load lessons if present in firestore
        const lessonsSnap = await getDocs(collection(db, "lessons"));
        if (!lessonsSnap.empty) {
          const loadedLessons = lessonsSnap.docs.map((d) => {
            const data = d.data() as Lesson;
            // Bảo vệ tuyệt đối: Nếu không phải giáo viên, loại bỏ hoàn toàn đáp án khỏi bộ nhớ trình duyệt
            if (activeUser.role !== "teacher" && Array.isArray(data.questions)) {
              data.questions = data.questions.map(({ correctIndex, explanation, ...rest }) => rest as any);
            }
            return { id: d.id, ...data };
          });
          const loadedMap = new Map(loadedLessons.map((l) => [l.id, l]));
          const mergedLessons = [
            ...INITIAL_LESSONS.map((initL) => loadedMap.get(initL.id) || initL),
            ...loadedLessons.filter((l) => !INITIAL_LESSONS.some((initL) => initL.id === l.id)),
          ];
          setLessons(mergedLessons);
        }

        // Load submissions if present in firestore
        const subSnap = await getDocs(collection(db, "submissions"));
        if (!subSnap.empty) {
          const loadedSubs = subSnap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Submission));
          setSubmissions((prev) => {
            const map = new Map(prev.map((s) => [s.id, s]));
            loadedSubs.forEach((sub) => map.set(sub.id, sub));
            return Array.from(map.values());
          });
        }

        // Load classes from primary Firestore first (works across laptop, tablet, phone)
        try {
          const classesSnap = await getDocs(collection(db, "classes"));
          if (!classesSnap.empty) {
            const loadedClasses = classesSnap.docs
              .map((d) => ({ id: d.id, ...d.data() } as ClassItem))
              .filter((c) => !isMockClass(c));
            if (loadedClasses.length > 0) {
              setClasses(loadedClasses);
              try {
                localStorage.setItem("lms_classes", JSON.stringify(loadedClasses));
              } catch (e) {}
            }
          }
        } catch (fsClsErr) {
          console.warn("Firestore classes load notice:", fsClsErr);
        }

        // Also sync classes from server API
        try {
          const token = await auth.currentUser?.getIdToken();
          const clsRes = await fetch("/api/classes?includeDeleted=true", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (clsRes.ok) {
            const clsData = await clsRes.json();
            if (Array.isArray(clsData.classes) && clsData.classes.length > 0) {
              const loaded = clsData.classes.filter((c: any) => !isMockClass(c));
              setClasses((prev) => {
                const map = new Map(prev.map((c) => [c.id, c]));
                loaded.forEach((c: any) => map.set(c.id, c));
                const merged = Array.from(map.values());
                try {
                  localStorage.setItem("lms_classes", JSON.stringify(merged));
                } catch (e) {}
                return merged;
              });
            }
          }
        } catch (apiErr) {
          console.warn("Server classes sync notice:", apiErr);
        }
      } catch (err) {
        console.warn("Firestore sync fallback:", err);
      }
    };

    loadPersistentData();

    // Listen to Auth State Changes
    const unsubAuth = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        loadPersistentData();
        // If teacher, ensure any local classes not yet in Firestore are uploaded safely
        try {
          const saved = localStorage.getItem("lms_classes");
          if (saved) {
            const localCls: ClassItem[] = JSON.parse(saved);
            const classesSnap = await getDocs(collection(db, "classes"));
            const cloudIds = new Set(classesSnap.docs.map((d) => d.id));
            for (const cls of localCls) {
              if (cls.id && !cloudIds.has(cls.id) && !isMockClass(cls)) {
                await setDoc(doc(db, "classes", cls.id), {
                  ...cls,
                  ownerUid: cls.ownerUid || fbUser.uid,
                  ownerEmail: cls.ownerEmail || fbUser.email,
                });
              }
            }
          }
        } catch (e) {
          console.warn("Local migration notice:", e);
        }
      }
    });

    return () => unsubAuth();
  }, []);

  // Role Toggle
  const handleRoleChange = (role: "teacher" | "student") => {
    if (role === "teacher") {
      handleSelectUser({
        uid: "teacher-main-01",
        email: "nmnhat.n98@gmail.com",
        displayName: "Thầy Nguyễn Minh Nhật",
        role: "teacher",
        gradeLevel: "high",
        classGrade: "Tổ trưởng Chuyên môn Tin học & STEM",
        school: "Phòng Giáo Dục & Đào Tạo",
        studentCode: "GV-STEM-01",
        isGoogleLinked: true,
        googleEmail: "nmnhat.n98@gmail.com",
      });
      setActiveTab("teacher-admin");
      showToast("Đã chuyển sang Cổng Giáo Viên");
    } else {
      handleSelectUser({
        uid: "student-main-01",
        email: "hocsinh@stem.edu.vn",
        displayName: "Học sinh STEM",
        role: "student",
        gradeLevel: "middle",
        classGrade: "Lớp 7A1",
        school: "Trường THCS Lê Quý Đôn",
        studentCode: "HS-7A1-01",
      });
      setActiveTab("lessons");
      showToast("Đã chuyển sang Cổng Học Sinh");
    }
  };

  // Submit Work Handler (Primary Server Disk Verification + No Duplicate on Retry + Score Null for Ungraded)
  const handleSubmitWork = async (submissionData: Partial<Submission>): Promise<void> => {
    // Preserve existing submission ID if retrying, otherwise create a new one
    const subId = submissionData.id || `sub-${Date.now()}`;
    const newSubmission: Submission = {
      id: subId,
      lessonId: submissionData.lessonId || "",
      lessonTitle: submissionData.lessonTitle || "",
      studentId: activeUser.uid,
      studentName: activeUser.displayName,
      studentEmail: activeUser.email,
      moduleType: submissionData.moduleType || "coding",
      content: submissionData.content || {},
      // Ungraded submissions must have score: null (Never 0 or 10)
      score: submissionData.status === "graded" && typeof submissionData.score === "number" ? submissionData.score : null,
      maxScore: submissionData.maxScore ?? 10,
      rubric: submissionData.rubric,
      status: submissionData.status || "submitted",
      teacherFeedback: submissionData.teacherFeedback || "",
      submittedAt: submissionData.submittedAt || new Date().toISOString(),
      evaluation: submissionData.evaluation,
    };

    // Primary Storage: Verify server API persistence first
    try {
      const token = await auth.currentUser?.getIdToken();
      const srvRes = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newSubmission),
      });

      if (!srvRes.ok) {
        const errData = await srvRes.json().catch(() => ({}));
        throw new Error(errData.error || `Máy chủ lưu bài trả về lỗi (${srvRes.status})`);
      }
    } catch (srvErr: any) {
      console.error("Primary server save submission failed:", srvErr);
      // Re-throw so caller (PythonLabModule) can display error and preserve student code for retry
      throw new Error(srvErr.message || "Không thể lưu bài nộp lên máy chủ. Vui lòng bấm thử lại.");
    }

    // Secondary Storage: Firestore & Local State
    try {
      await setDoc(doc(db, "submissions", subId), newSubmission);
    } catch (e) {
      console.warn("Firestore sync notice (offline or rules):", e);
    }

    setSubmissions((prev) => {
      const existsIndex = prev.findIndex((s) => s.id === subId);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = newSubmission;
        return updated;
      }
      return [newSubmission, ...prev];
    });

    showToast("🎉 Nộp bài thành công! Bài làm đang chờ giáo viên đánh giá");
  };

  // Grade Submission Handler
  const handleGradeSubmission = async (
    submissionId: string,
    rubric: RubricCriteria,
    score: number,
    feedback: string
  ) => {
    const gradedAt = new Date().toISOString();

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ score, rubric, teacherFeedback: feedback }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi lưu điểm (${res.status})`);
      }
    } catch (srvErr: any) {
      console.error("Server update grade notice:", srvErr);
      showToast(srvErr.message || "Lỗi lưu điểm lên máy chủ", "info");
    }

    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === submissionId
          ? {
              ...sub,
              rubric,
              score,
              status: "graded",
              teacherFeedback: feedback,
              gradedAt,
            }
          : sub
      )
    );

    // Persist to Firestore
    try {
      await updateDoc(doc(db, "submissions", submissionId), {
        rubric,
        score,
        status: "graded",
        teacherFeedback: feedback,
        gradedAt,
      });
      showToast("✅ Đã lưu kết quả chấm điểm và nhận xét!");
    } catch (e) {
      console.warn("Firestore update fallback:", e);
      showToast("Đã lưu điểm bài nộp!");
    }
  };

  // Add Lesson / Assignment Handler
  const handleAddLesson = async (newLessonData: Partial<Lesson>) => {
    const newId = `les-${Date.now()}`;
    const newLesson: Lesson = {
      id: newId,
      title: newLessonData.title || "Bài tập mới",
      description: newLessonData.description || "",
      level: newLessonData.level || "middle",
      moduleType: newLessonData.moduleType || "coding",
      language: newLessonData.language || "python",
      starterCode: newLessonData.starterCode,
      htmlStarter: newLessonData.htmlStarter,
      cssStarter: newLessonData.cssStarter,
      jsStarter: newLessonData.jsStarter,
      scratchProjectId: newLessonData.scratchProjectId,
      testcases: newLessonData.testcases,
      rubricTemplate: newLessonData.rubricTemplate,
      durationMinutes: newLessonData.durationMinutes || 45,
      questions: newLessonData.questions,
      gradeName: newLessonData.gradeName,
      subject: newLessonData.subject || "Tin học",
      purpose: newLessonData.purpose,
      startDate: newLessonData.startDate,
      dueDate: newLessonData.dueDate,
      targetClasses: newLessonData.targetClasses,
      attachments: newLessonData.attachments,
      richContent: newLessonData.richContent,
      submissionType: newLessonData.submissionType || "file_upload",
      maxScore: newLessonData.maxScore ?? 10,
      allowReviewAfterDue: newLessonData.allowReviewAfterDue ?? true,
      createdAt: new Date().toISOString(),
    };

    setLessons((prev) => {
      const updated = [newLesson, ...prev];
      try {
        localStorage.setItem("lms_lessons", JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage save error:", e);
      }
      return updated;
    });

    try {
      await setDoc(doc(db, "lessons", newId), newLesson);
      showToast("🎉 Đã tạo và giao bài tập mới thành công!");
    } catch (e) {
      console.warn("Firestore save fallback:", e);
      showToast("Đã thêm bài tập vào danh sách!");
    }
  };

  // Delete Lesson Handler
  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài học này khỏi ngân hàng đề?")) return;
    setLessons((prev) => {
      const updated = prev.filter((l) => l.id !== lessonId);
      try {
        localStorage.setItem("lms_lessons", JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage save error:", e);
      }
      return updated;
    });

    try {
      await deleteDoc(doc(db, "lessons", lessonId));
      showToast("Đã xóa bài học.");
    } catch (e) {
      console.warn("Firestore delete fallback:", e);
    }
  };

  // Add Class Handler: Server API verification first, no swallowing error
  const handleAddClass = async (newClass: ClassItem) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const srvRes = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newClass),
      });

      if (!srvRes.ok) {
        const errData = await srvRes.json().catch(() => ({}));
        throw new Error(errData.error || `Máy chủ tạo lớp trả về lỗi (${srvRes.status})`);
      }

      const data = await srvRes.json();
      const savedClass: ClassItem = data.class || newClass;

      // Update state only after server confirmation
      setClasses((prev) => {
        const updated = [savedClass, ...prev.filter((c) => c.id !== savedClass.id)];
        try {
          localStorage.setItem("lms_classes", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // Secondary Firestore sync
      try {
        await setDoc(doc(db, "classes", savedClass.id), savedClass);
      } catch (e) {
        console.warn("Firestore save class notice:", e);
      }

      showToast(`🎉 Đã tạo lớp mới thành công: ${savedClass.name}`);
    } catch (err: any) {
      console.error("handleAddClass failed:", err);
      throw err;
    }
  };

  // Delete Class Handler: Soft Delete with server confirmation
  const handleDeleteClass = async (classId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const srvRes = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!srvRes.ok) {
        const errData = await srvRes.json().catch(() => ({}));
        throw new Error(errData.error || `Máy chủ xóa lớp trả về lỗi (${srvRes.status})`);
      }

      const data = await srvRes.json();

      setClasses((prev) => {
        const updated = prev.map((c) =>
          c.id === classId
            ? { ...c, status: "deleted" as const, deletedAt: new Date().toISOString() }
            : c
        );
        try {
          localStorage.setItem("lms_classes", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        await updateDoc(doc(db, "classes", classId), {
          status: "deleted",
          deletedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Firestore soft delete notice:", e);
      }

      showToast(data.message || "Đã chuyển lớp học vào mục Lớp đã xóa.");
    } catch (err: any) {
      console.error("handleDeleteClass failed:", err);
      throw err;
    }
  };

  // Restore Class Handler
  const handleRestoreClass = async (classId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const srvRes = await fetch(`/api/classes/${classId}/restore`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!srvRes.ok) {
        const errData = await srvRes.json().catch(() => ({}));
        throw new Error(errData.error || `Máy chủ khôi phục lớp trả về lỗi (${srvRes.status})`);
      }

      const data = await srvRes.json();
      const restored = data.class;

      setClasses((prev) => {
        const updated = prev.map((c) =>
          c.id === classId
            ? (restored ? restored : { ...c, status: "active" as const, deletedAt: undefined })
            : c
        );
        try {
          localStorage.setItem("lms_classes", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      try {
        await updateDoc(doc(db, "classes", classId), {
          status: "active",
          deletedAt: null,
        });
      } catch (e) {
        console.warn("Firestore restore notice:", e);
      }

      showToast(`✅ Đã khôi phục lớp học thành công!`);
    } catch (err: any) {
      console.error("handleRestoreClass failed:", err);
      throw err;
    }
  };

  // Khi người dùng bấm vào link lần đầu hoặc chưa đăng nhập: Trang đầu tiên hiển thị luôn là Trang Đăng Ký / Đăng Nhập
  if (!currentUser && !isGuestMode) {
    return (
      <div className="min-h-screen bg-slate-900 font-sans">
        {notification && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <span>{notification.message}</span>
          </div>
        )}
        <AuthPage
          onSelectUser={handleSelectUser}
          onExploreAsGuest={() => {
            setIsGuestMode(true);
            showToast("Đang ở Chế độ Khách (Xem trước danh mục bài giảng)", "info");
          }}
        />
      </div>
    );
  }

  // Render Module View if lesson selected
  if (selectedLesson) {
    if (selectedLesson.moduleType === "quiz") {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          {isGuestMode && !currentUser && (
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Chế độ Khách</span>
                <span>Bạn đang xem trước bài học. Đăng nhập để ghi nhận điểm số chính thức.</span>
              </span>
              <button
                onClick={() => {
                  setIsGuestMode(false);
                  handleOpenLogin("student");
                }}
                className="bg-white text-indigo-800 hover:bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Đăng Nhập / Đăng Ký →
              </button>
            </div>
          )}
          <Navbar
            currentUser={activeUser}
            onRoleChange={handleRoleChange}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            onOpenLogin={handleOpenLogin}
            onLogout={handleLogout}
            submissions={submissions}
            onSelectLessonById={(id) => {
              const target = lessons.find((l) => l.id === id);
              if (target) setSelectedLesson(target);
            }}
          />
          <QuizModule
            lesson={selectedLesson}
            currentUser={activeUser}
            onBack={() => setSelectedLesson(null)}
            onSubmitWork={handleSubmitWork}
          />
          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            onSelectUser={handleSelectUser}
            initialRole={loginInitialRole}
          />
        </div>
      );
    }

    if (selectedLesson.moduleType === "scratch") {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          {isGuestMode && !currentUser && (
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Chế độ Khách</span>
                <span>Bạn đang xem trước bài học. Đăng nhập để nộp dự án Scratch!</span>
              </span>
              <button
                onClick={() => {
                  setIsGuestMode(false);
                  handleOpenLogin("student");
                }}
                className="bg-white text-indigo-800 hover:bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Đăng Nhập / Đăng Ký →
              </button>
            </div>
          )}
          <Navbar
            currentUser={activeUser}
            onRoleChange={handleRoleChange}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            onOpenLogin={handleOpenLogin}
            onLogout={handleLogout}
            submissions={submissions}
            onSelectLessonById={(id) => {
              const target = lessons.find((l) => l.id === id);
              if (target) setSelectedLesson(target);
            }}
          />
          <ElementaryModule
            lesson={selectedLesson}
            currentUser={activeUser}
            onBack={() => setSelectedLesson(null)}
            onSubmitWork={handleSubmitWork}
          />
          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            onSelectUser={handleSelectUser}
            initialRole={loginInitialRole}
          />
        </div>
      );
    }

    if (selectedLesson.moduleType === "coding") {
      return (
        <div className="h-screen h-[100dvh] flex flex-col bg-slate-950 font-sans overflow-hidden">
          {isGuestMode && !currentUser && (
            <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs shrink-0">
              <span className="flex items-center gap-2">
                <span className="bg-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold">Chế độ Khách</span>
                <span>Bạn đang xem trước bài lập trình. Đăng nhập để lưu mã nguồn và chấm điểm!</span>
              </span>
              <button
                onClick={() => {
                  setIsGuestMode(false);
                  handleOpenLogin("student");
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Đăng Nhập / Đăng Ký →
              </button>
            </div>
          )}
          <div className="flex-1 min-h-0 flex flex-col">
            <PythonLabModule
              currentUser={activeUser}
              initialLesson={selectedLesson}
              availableLessons={lessons.filter(
                (l) => l.moduleType === "coding" || l.language === "python" || l.subject?.toLowerCase().includes("python")
              )}
              submissions={submissions}
              onBack={() => setSelectedLesson(null)}
              onSubmitWork={handleSubmitWork}
              onSelectLesson={(lesson) => setSelectedLesson(lesson)}
            />
          </div>
          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            onSelectUser={handleSelectUser}
            initialRole={loginInitialRole}
          />
        </div>
      );
    }

    if (selectedLesson.moduleType === "html") {
      return (
        <div className="h-screen h-[100dvh] flex flex-col bg-slate-950 font-sans overflow-hidden">
          {isGuestMode && !currentUser && (
            <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs shrink-0">
              <span className="flex items-center gap-2">
                <span className="bg-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold">Chế độ Khách</span>
                <span>Bạn đang xem trước bài viết mã HTML. Đăng nhập để lưu dự án và gửi giáo viên chấm!</span>
              </span>
              <button
                onClick={() => {
                  setIsGuestMode(false);
                  handleOpenLogin("student");
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Đăng Nhập / Đăng Ký →
              </button>
            </div>
          )}
          <div className="flex-1 min-h-0 flex flex-col">
            <HtmlEditorModule
              lesson={selectedLesson}
              currentUser={activeUser}
              onBack={() => setSelectedLesson(null)}
              onSubmitWork={handleSubmitWork}
            />
          </div>
          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            onSelectUser={handleSelectUser}
            initialRole={loginInitialRole}
          />
        </div>
      );
    }

    if (selectedLesson.moduleType === "robotics") {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          {isGuestMode && !currentUser && (
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Chế độ Khách</span>
                <span>Bạn đang xem trước dự án Robotics STEM. Đăng nhập để nộp video và nhật ký!</span>
              </span>
              <button
                onClick={() => {
                  setIsGuestMode(false);
                  handleOpenLogin("student");
                }}
                className="bg-white text-indigo-800 hover:bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Đăng Nhập / Đăng Ký →
              </button>
            </div>
          )}
          <Navbar
            currentUser={activeUser}
            onRoleChange={handleRoleChange}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            onOpenLogin={handleOpenLogin}
            onLogout={handleLogout}
            submissions={submissions}
            onSelectLessonById={(id) => {
              const target = lessons.find((l) => l.id === id);
              if (target) setSelectedLesson(target);
            }}
          />
          <RoboticsModule
            lesson={selectedLesson}
            currentUser={activeUser}
            submissions={submissions}
            onBack={() => setSelectedLesson(null)}
            onSubmitWork={handleSubmitWork}
            onGradeSubmission={handleGradeSubmission}
          />
          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            onSelectUser={handleSelectUser}
            initialRole={loginInitialRole}
          />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{notification.message}</span>
        </div>
      )}

      {/* Guest Mode Banner */}
      {isGuestMode && !currentUser && (
        <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-xs font-medium flex flex-wrap items-center justify-between gap-2 shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider">
              Chế độ Khách (Xem trước)
            </span>
            <span className="text-slate-300">
              Trải nghiệm CodeHiểu: Học Python cùng gia sư AI. Đăng nhập để nộp bài và lưu điểm.
            </span>
          </div>
          <button
            onClick={() => {
              setIsGuestMode(false);
              handleOpenLogin("student");
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            Đăng nhập / Đăng ký
          </button>
        </div>
      )}

      {/* Main Navbar (shown for student/learner views; teacher dashboard has its own workspace layout) */}
      {activeTab !== "teacher-admin" && (
        <Navbar
          currentUser={activeUser}
          onRoleChange={handleRoleChange}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          onOpenLogin={handleOpenLogin}
          onLogout={handleLogout}
          submissions={submissions}
          onSelectLessonById={(id) => {
            const target = lessons.find((l) => l.id === id);
            if (target) setSelectedLesson(target);
          }}
          onOpenAbout={() => setIsAboutOpen(true)}
        />
      )}

      {/* Body Views */}
      <main
        className={`flex-1 min-h-0 flex flex-col ${
          activeTab === "html-lab" || activeTab === "python-lab" || activeTab === "teacher-admin"
            ? "overflow-hidden"
            : "pb-16 overflow-y-auto"
        }`}
      >
        {activeTab === "lessons" && (
          <StudentDashboard
            lessons={lessons}
            submissions={submissions}
            currentUser={activeUser}
            selectedLevel={selectedLevel}
            onSelectLesson={(lesson) => setSelectedLesson(lesson)}
            onOpenHtmlLab={() => setActiveTab("html-lab")}
            onOpenPythonLab={() => setActiveTab("python-lab")}
          />
        )}

        {activeTab === "python-lab" && (
          <div className="flex-1 min-h-0 w-full flex flex-col bg-slate-950 overflow-hidden">
            <PythonLabModule
              currentUser={activeUser}
              initialLesson={selectedLesson}
              availableLessons={lessons.filter(
                (l) => l.moduleType === "coding" || l.language === "python" || l.subject?.toLowerCase().includes("python")
              )}
              submissions={submissions}
              onBack={() => {
                setSelectedLesson(null);
                setActiveTab(activeUser.role === "teacher" ? "teacher-admin" : "lessons");
              }}
              onSubmitWork={handleSubmitWork}
              onSelectLesson={(lesson) => setSelectedLesson(lesson)}
            />
          </div>
        )}

        {activeTab === "html-lab" && (
          <div className="flex-1 min-h-0 w-full flex flex-col bg-slate-950 overflow-hidden">
            <HtmlEditorModule
              currentUser={activeUser}
              onBack={() => setActiveTab(activeUser.role === "teacher" ? "teacher-admin" : "lessons")}
              onSubmitWork={handleSubmitWork}
            />
          </div>
        )}

        {activeTab === "ugot-lab" && (
          <div className="flex-1 min-h-0 w-full flex flex-col bg-slate-950 overflow-hidden">
            <div className="h-11 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab(activeUser.role === "teacher" ? "teacher-admin" : "lessons")}
                  className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 cursor-pointer font-medium"
                >
                  ← Quay lại
                </button>
                <span className="font-bold text-white text-xs sm:text-sm">Thực Hành Robot UGOT Laptop (Cầu nối Windows WSS)</span>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <UgotPracticePanel currentUser={activeUser} />
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <StudentResultsView
            submissions={submissions}
            lessons={lessons}
            currentUser={activeUser}
            onSelectLesson={(lesson) => setSelectedLesson(lesson)}
            onBackToLessons={() => setActiveTab("lessons")}
          />
        )}

        {activeTab === "leaderboard" && (
          <Leaderboard
            submissions={submissions}
            currentUser={activeUser}
          />
        )}

        {activeTab === "teacher-admin" && (
          <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
            <TeacherDashboard
              lessons={lessons}
              submissions={submissions}
              classes={classes}
              currentUser={activeUser}
              onAddLesson={handleAddLesson}
              onDeleteLesson={handleDeleteLesson}
              onGradeSubmission={handleGradeSubmission}
              onAddClass={handleAddClass}
              onDeleteClass={handleDeleteClass}
              onRestoreClass={handleRestoreClass}
              onSwitchToStudent={() => setActiveTab("lessons")}
              onOpenPythonLab={() => setActiveTab("python-lab")}
              onOpenHtmlLab={() => setActiveTab("html-lab")}
              onLogout={handleLogout}
              onOpenLogin={handleOpenLogin}
            />
          </div>
        )}
        {activeTab !== "python-lab" && activeTab !== "html-lab" && activeTab !== "ugot-lab" && activeTab !== "teacher-admin" && (
          <Footer onOpenAbout={() => setIsAboutOpen(true)} />
        )}
      </main>

      {/* Login & Portal Switcher Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSelectUser={handleSelectUser}
        initialRole={loginInitialRole}
      />

      {/* About CodeHiểu Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Mandatory First-Time Password Change Modal */}
      {currentUser && currentUser.mustChangePassword && (
        <ChangePasswordModal
          user={currentUser}
          isOpen={true}
          onSuccess={(updated) => {
            setCurrentUser(updated);
            showToast("🎉 Đổi mật khẩu thành công! Chào mừng em đến với CodeHiểu.");
          }}
        />
      )}
    </div>
  );
}
export default App;
