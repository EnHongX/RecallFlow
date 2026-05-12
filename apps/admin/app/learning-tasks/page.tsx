"use client";

import Link from "next/link";
import AdminLayout from "../components/AdminLayout";
import { useApp } from "../contexts/AppContext";
import "../styles.css";

const taskTypes = [
  "课文背诵",
  "生字词复习",
  "数学口算",
  "英语单词",
  "错题再练",
];

export default function LearningTasksPage() {
  const { currentStudent } = useApp();

  return (
    <AdminLayout title="学习任务">
      <div className="page-header">
        <h1 className="page-title">学习任务</h1>
        <p className="page-subtitle">家长把课程资料组合成孩子今天要完成的任务。</p>
      </div>

      {currentStudent ? (
        <div className="current-student-badge">
          <div className="current-student-info">
            <div className="current-student-icon">{currentStudent.name.charAt(0)}</div>
            <div className="current-student-text">
              <span className="current-student-label">当前布置对象</span>
              <span className="current-student-name">{currentStudent.name}</span>
              <span className="current-student-grade">{currentStudent.grade}</span>
            </div>
          </div>
          <Link href="/students" className="action-button secondary">
            切换孩子
          </Link>
        </div>
      ) : (
        <div className="empty-current-student">
          <strong>还没有选择当前孩子</strong>
          <span>先选择孩子，再为孩子布置学习任务。</span>
        </div>
      )}

      <div className="task-shell">
        <section className="task-panel">
          <div className="task-panel-header">
            <span className="section-kicker">创建任务</span>
            <button className="add-button" disabled>
              新建任务
            </button>
          </div>
          <h2>任务表单框架</h2>
          <div className="form-preview-grid">
            <div className="form-preview-field">任务名称</div>
            <div className="form-preview-field">选择孩子</div>
            <div className="form-preview-field">截止日期</div>
            <div className="form-preview-field">任务类型</div>
            <div className="form-preview-field wide">选择资料 / 题目 / 错题</div>
          </div>
        </section>

        <section className="task-panel">
          <span className="section-kicker">任务类型</span>
          <h2>第一版先覆盖这些任务</h2>
          <div className="tag-list">
            {taskTypes.map((type) => (
              <span key={type} className="tag-pill">{type}</span>
            ))}
          </div>
        </section>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">任务列表框架</h3>
        </div>
        <div className="empty-table">
          <p className="empty-table-text">学习任务功能待接入</p>
          <p style={{ marginTop: "8px", fontSize: "13px", color: "#777" }}>
            后续这里展示待发布、进行中、已完成和需要复习的任务。
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
