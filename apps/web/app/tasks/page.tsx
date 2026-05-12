"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "../styles.css";
import {
  getStudents,
  getCurrentStudent,
  setCurrentStudent,
  type Student,
  type ApiError,
} from "@/lib/api";

const taskFrames = [
  {
    id: "chinese-review",
    title: "语文：课文和生字复习",
    meta: "背诵 / 生字 / 组词",
    status: "待开始",
  },
  {
    id: "math-arithmetic",
    title: "数学：口算练习",
    meta: "20 题 / 自动判分",
    status: "待开始",
  },
  {
    id: "wrong-review",
    title: "错题再练",
    meta: "系统根据错题生成",
    status: "待接入",
  },
];

export default function TasksPage() {
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
      setCurrentStudentState(student);
      return;
    }

    setSelectingStudentId(student.id);
    try {
      await setCurrentStudent(student.id);
      setCurrentStudentState({ ...student, is_current: true });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "切换孩子失败");
    } finally {
      setSelectingStudentId(null);
    }
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
            <p className="eyebrow">RecallFlow 今日任务</p>
            <h1 className="dashboard-title">今天要完成什么</h1>
            <p className="dashboard-subtitle">选好孩子后，按任务一项一项完成。</p>
          </div>
          <Link href="/" className="action-button secondary">
            返回首页
          </Link>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">还没有添加孩子</p>
          <p style={{ marginTop: "8px", fontSize: "14px", color: "#667789" }}>
            请先在家长管理平台添加孩子。
          </p>
        </div>
      ) : (
        <div className="student-switcher">
          {students.map((student) => (
            <button
              key={student.id}
              className={`student-chip ${currentStudent?.id === student.id ? "active" : ""}`}
              disabled={selectingStudentId === student.id}
              onClick={() => handleSelectStudent(student)}
            >
              <span>{student.name}</span>
              <small>{student.grade}</small>
            </button>
          ))}
        </div>
      )}

      {currentStudent ? (
        <div className="task-list">
          {taskFrames.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="task-card">
              <div>
                <span className="task-status">{task.status}</span>
                <h2>{task.title}</h2>
                <p>{task.meta}</p>
              </div>
              <span className="task-action">开始</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-current-student">
          <strong>请选择孩子</strong>
          <span>选择后会显示这个孩子今天要完成的任务。</span>
        </div>
      )}

      <div className="info-card">
        <h2>任务页面框架</h2>
        <p>这里后续会接入家长端发布的学习任务。旧练习卡片入口暂时保留，方便后续迁移。</p>
        <div className="action-buttons" style={{ marginTop: "20px" }}>
          <Link href="/practice" className="action-button secondary">
            查看旧练习入口
          </Link>
        </div>
      </div>
    </main>
  );
}
