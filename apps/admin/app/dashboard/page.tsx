"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  logout,
  getStudents,
  createStudent,
  updateStudent,
  setCurrentStudent as setCurrentStudentApi,
  type User,
  type Student,
  type ApiError,
} from "@/lib/api";
import "../styles.css";

const GRADE_OPTIONS = [
  "一年级",
  "二年级",
  "三年级",
  "四年级",
  "五年级",
  "六年级",
  "七年级",
  "八年级",
  "九年级",
  "高一",
  "高二",
  "高三",
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudentState] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [switchingStudentId, setSwitchingStudentId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formName, setFormName] = useState("");
  const [formGrade, setFormGrade] = useState("一年级");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        const studentsData = await getStudents();
        setStudents(studentsData);
        const current = studentsData.find((s) => s.is_current) || null;
        setCurrentStudentState(current);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || "获取信息失败");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "退出登录失败");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleAddStudent = () => {
    setFormName("");
    setFormGrade("一年级");
    setShowAddModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormGrade(student.grade);
    setShowEditModal(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("请输入孩子姓名");
      return;
    }
    setFormLoading(true);
    setError("");
    try {
      const newStudent = await createStudent(formName.trim(), formGrade);
      setStudents([...students, newStudent]);
      if (students.length === 0) {
        setCurrentStudentState(newStudent);
      }
      setShowAddModal(false);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "添加失败");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !editingStudent) {
      setError("请输入孩子姓名");
      return;
    }
    setFormLoading(true);
    setError("");
    try {
      const updated = await updateStudent(editingStudent.id, {
        name: formName.trim(),
        grade: formGrade,
      });
      const newStudents = students.map((s) =>
        s.id === updated.id ? updated : s
      );
      setStudents(newStudents);
      if (currentStudent?.id === updated.id) {
        setCurrentStudentState(updated);
      }
      setShowEditModal(false);
      setEditingStudent(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "更新失败");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetCurrent = async (studentId: number) => {
    setSwitchingStudentId(studentId);
    setError("");
    try {
      await setCurrentStudentApi(studentId);
      const newStudents = students.map((s) => ({
        ...s,
        is_current: s.id === studentId,
      }));
      setStudents(newStudents);
      const current = newStudents.find((s) => s.is_current) || null;
      setCurrentStudentState(current);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "切换失败");
    } finally {
      setSwitchingStudentId(null);
    }
  };

  const getInitial = (name?: string) => {
    const normalizedName = name?.trim();
    return normalizedName ? normalizedName.charAt(0) : "?";
  };

  const currentStudentName = currentStudent?.name?.trim() || "未选择";
  const currentStudentGrade = currentStudent?.grade?.trim() || "请先设为当前孩子";

  if (loading) {
    return (
      <main className="shell">
        <div className="loading-container">
          <p>加载中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="dashboard-title">欢迎回来！</h1>
            <p className="dashboard-subtitle">
              {user?.display_name || user?.phone}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="logout-button"
          >
            {loggingOut ? "退出中..." : "退出登录"}
          </button>
        </div>
      </section>

      {error && (
        <div className="error-alert" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <section className="dashboard-grid" aria-label="孩子管理概览">
        <div className="panel">
          <span>孩子数量</span>
          <strong>{students.length}</strong>
        </div>
        <div className="panel">
          <span>当前孩子</span>
          <strong>{currentStudentName}</strong>
        </div>
        <div className="panel">
          <span>当前状态</span>
          <strong className={currentStudent ? "status-active" : ""}>
            {currentStudent ? "可开始管理" : "待选择"}
          </strong>
        </div>
      </section>

      {currentStudent && (
        <div className="current-student-badge">
          <div className="current-student-info">
            <div className="current-student-icon">
              {getInitial(currentStudent.name)}
            </div>
            <div className="current-student-text">
              <span className="current-student-label">当前孩子</span>
              <span className="current-student-name">
                {currentStudent.name}
              </span>
              <span className="current-student-grade">
                {currentStudentGrade}
              </span>
            </div>
          </div>
        </div>
      )}

      {!currentStudent && students.length > 0 && (
        <div className="empty-current-student">
          <strong>还没有当前孩子</strong>
          <span>请在下方列表里选择一个孩子作为当前孩子。</span>
        </div>
      )}

      <section className="students-section">
        <div className="students-header">
          <h2 className="students-title">我的孩子</h2>
          <button onClick={handleAddStudent} className="add-button">
            + 添加孩子
          </button>
        </div>

        {students.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">
              您还没有添加孩子，请点击上方按钮添加
            </p>
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
                    {getInitial(student.name)}
                  </div>
                  <div className="student-details">
                    <div>
                      <span className="student-name">{student.name}</span>
                      {student.is_current && (
                        <span className="current-badge">当前</span>
                      )}
                    </div>
                    <span className="student-grade">{student.grade}</span>
                  </div>
                </div>
                <div className="student-actions">
                  {!student.is_current && (
                    <button
                      onClick={() => handleSetCurrent(student.id)}
                      disabled={switchingStudentId !== null}
                      className="action-button success"
                    >
                      {switchingStudentId === student.id ? "切换中..." : "设为当前"}
                    </button>
                  )}
                  <button
                    onClick={() => handleEditStudent(student)}
                    className="action-button secondary"
                  >
                    编辑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">添加孩子</h2>
            <form onSubmit={handleSubmitAdd} className="modal-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  姓名
                </label>
                <input
                  id="name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入孩子姓名"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="grade" className="form-label">
                  年级
                </label>
                <select
                  id="grade"
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  className="select-input"
                >
                  {GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cancel-button"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="submit-button"
                >
                  {formLoading ? "添加中..." : "添加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingStudent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">编辑孩子信息</h2>
            <form onSubmit={handleSubmitEdit} className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-name" className="form-label">
                  姓名
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="请输入孩子姓名"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-grade" className="form-label">
                  年级
                </label>
                <select
                  id="edit-grade"
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  className="select-input"
                >
                  {GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="cancel-button"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="submit-button"
                >
                  {formLoading ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
