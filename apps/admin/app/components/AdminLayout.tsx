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
    path: "/questions",
    label: "题库管理",
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    path: "/cards",
    label: "练习卡片",
    icon: (
      <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
