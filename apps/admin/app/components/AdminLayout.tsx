"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "../contexts/AppContext";
import "../styles.css";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  {
    path: "/home",
    label: "首页",
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: "/students",
    label: "孩子管理",
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    path: "/course-materials",
    label: "课程资料",
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    path: "/learning-tasks",
    label: "学习任务",
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    path: "/task-results",
    label: "完成情况",
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    path: "/wrong-cards",
    label: "错题复习",
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, currentStudent, handleLogout, loading, error, setError } = useApp();

  const getInitial = (name?: string | null) => {
    if (!name) return "?";
    const normalizedName = name.trim();
    return normalizedName ? normalizedName.charAt(0) : "?";
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <div className="loading-container">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">RecallFlow</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-link ${pathname === item.path ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="main-wrapper">
        <header className="top-bar">
          <div className="top-bar-left">
            {title && <h2 className="top-bar-title">{title}</h2>}
          </div>
          <div className="top-bar-right">
            <div className="user-info">
              <div className="user-avatar">{getInitial(user?.display_name || user?.phone)}</div>
              <div className="user-details">
                <span className="user-name">{user?.display_name || user?.phone}</span>
                {currentStudent ? (
                  <span className="current-student-badge-small">
                    当前：{currentStudent.name} ({currentStudent.grade})
                  </span>
                ) : (
                  <span className="current-student-badge-small">未选择孩子</span>
                )}
              </div>
            </div>
            <button onClick={handleLogout} className="logout-button">
              退出登录
            </button>
          </div>
        </header>

        <main className="content-area">
          {error && (
            <div className="error-alert" style={{ marginBottom: "20px" }}>
              {error}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
