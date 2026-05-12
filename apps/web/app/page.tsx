"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./styles.css";
import {
  getCurrentUser,
  getCurrentStudent,
  logout,
  type User,
  type Student,
  type ApiError,
} from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        try {
          const studentData = await getCurrentStudent();
          setCurrentStudent(studentData);
        } catch (err) {
          const apiError = err as ApiError;
          if (apiError.code !== "HTTP_404" && apiError.code !== "COMMON_002") {
            throw err;
          }
          setCurrentStudent(null);
        }
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

  const handleLogout = async () => {
    try {
      await logout();
      router.push("http://localhost:5002/login");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "登出失败");
    }
  };

  const handleStartPractice = () => {
    router.push("/tasks");
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
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <p className="eyebrow">RecallFlow</p>
            <h1 className="dashboard-title">
              欢迎回来，{user?.display_name || user?.phone}
            </h1>
            <p className="dashboard-subtitle">孩子的今日任务入口，简单清楚</p>
          </div>
          <button onClick={handleLogout} className="logout-button">
            退出登录
          </button>
        </div>
      </div>

      {currentStudent ? (
        <div className="current-student-badge">
          <div className="current-student-info">
            <div className="current-student-icon">
              {currentStudent.name.charAt(0)}
            </div>
            <div className="current-student-text">
              <span className="current-student-label">当前孩子</span>
              <span className="current-student-name">{currentStudent.name}</span>
              <span className="current-student-grade">{currentStudent.grade}</span>
            </div>
          </div>
          <button onClick={handleStartPractice} className="action-button primary">
            查看今日任务
          </button>
        </div>
      ) : (
        <div className="empty-current-student">
          <strong>还没有设置孩子</strong>
          <span>请先在家长管理平台添加孩子</span>
        </div>
      )}

      <div className="info-card">
        <h2>今日任务</h2>
        <p>孩子端只保留最直接的学习路径：</p>
        <ul>
          <li>看到今天要完成的任务</li>
          <li>一次进入一个任务</li>
          <li>按步骤完成学习、答题或背诵</li>
          <li>做完后看到结果反馈</li>
        </ul>
        <div className="action-buttons" style={{ marginTop: "24px" }}>
          <button onClick={handleStartPractice} className="action-button primary">
            进入今日任务
          </button>
        </div>
      </div>
    </main>
  );
}
