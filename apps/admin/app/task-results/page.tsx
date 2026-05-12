"use client";

import Link from "next/link";
import AdminLayout from "../components/AdminLayout";
import "../styles.css";

const resultCards = [
  {
    label: "今日完成",
    value: "-",
    note: "完成任务数",
  },
  {
    label: "待完成",
    value: "-",
    note: "孩子还没做的任务",
  },
  {
    label: "需复习",
    value: "-",
    note: "错题和不会的内容",
  },
];

export default function TaskResultsPage() {
  return (
    <AdminLayout title="完成情况">
      <div className="page-header">
        <h1 className="page-title">完成情况</h1>
        <p className="page-subtitle">家长重点看任务是否完成、错在哪里、明天要复习什么。</p>
      </div>

      <div className="stats-grid">
        {resultCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-content">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">任务完成记录框架</h3>
        </div>
        <div className="empty-table">
          <p className="empty-table-text">完成情况功能待接入</p>
          <p style={{ marginTop: "8px", fontSize: "13px", color: "#777" }}>
            后续这里按孩子、任务、课程和日期查看完成记录。
          </p>
          <Link href="/daily-progress" className="action-button-link secondary" style={{ marginTop: "16px" }}>
            查看旧每日进度
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
