"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../styles.css";
import {
  getStudents,
  getCurrentStudent,
  setCurrentStudent,
  type Student,
  type ApiError,
} from "@/lib/api";

export default function PracticePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudentState] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingStudentId, setSelectingStudentId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsData, currentStudentData] = await Promise.all([
          getStudents(),
          getCurrentStudent().catch(() => null),
        ]);
        setStudents(studentsData);
        setCurrentStudentState(currentStudentData);
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.code === "HTTP_401") {
          router.push("http://localhost:5002/login");
          return;
        }
        setError(apiError.message || "加载失败");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSelectStudent = async (student: Student) => {
    if (student.is_current) {
      router.push(`/practice/${student.id}`);
      return;
    }

    setSelectingStudentId(student.id);
    try {
      await setCurrentStudent(student.id);
      setCurrentStudentState(student);
      router.push(`/practice/${student.id}`);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "切换孩子失败");
    } finally {
      setSelectingStudentId(null);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <main className="shell">
        <div className="loading-container">
          <p>加载中...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="shell">
        <div className="error-alert">{error}</div>
        <button onClick={handleBack} className="action-button secondary" style={{ marginTop: "16px" }}>
          返回
        </button>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <p className="eyebrow">RecallFlow 练习</p>
            <h1 className="dashboard-title">选择孩子</h1>
            <p className="dashboard-subtitle">选择要开始练习的孩子</p>
          </div>
          <button onClick={handleBack} className="action-button secondary">
            ← 返回首页
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">还没有添加孩子</p>
          <p style={{ marginTop: "8px", fontSize: "14px", color: "#667789" }}>
            请先在家长管理平台添加孩子
          </p>
          <button
            onClick={() => window.open("http://localhost:5002/students", "_blank")}
            className="action-button primary"
            style={{ marginTop: "24px" }}
          >
            前往管理平台添加
          </button>
        </div>
      ) : (
        <div className="students-list">
          {students.map((student) => (
            <div
              key={student.id}
              className={`student-card ${student.is_current ? "current" : ""}`}
            >
              <div className="student-info">
                <div className="student-avatar">
                  {student.name.charAt(0)}
                </div>
                <div className="student-details">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span className="student-name">{student.name}</span>
                    {student.is_current && (
                      <span className="current-badge">当前</span>
                    )}
                  </div>
                  <span className="student-grade">{student.grade}</span>
                </div>
              </div>
              <div className="student-actions">
                <button
                  onClick={() => handleSelectStudent(student)}
                  disabled={selectingStudentId === student.id}
                  className="action-button primary"
                >
                  {selectingStudentId === student.id
                    ? "切换中..."
                    : student.is_current
                    ? "开始练习"
                    : "切换并练习"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
