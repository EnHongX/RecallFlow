"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout, type User, type ApiError } from "@/lib/api";
import "../styles.css";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "获取用户信息失败");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="error-alert">
          {error}
        </div>
      )}

      <section className="dashboard-grid">
        <div className="panel">
          <span>手机号</span>
          <strong>{user?.phone}</strong>
        </div>
        <div className="panel">
          <span>用户ID</span>
          <strong>{user?.id}</strong>
        </div>
        <div className="panel">
          <span>登录状态</span>
          <strong className="status-active">已登录</strong>
        </div>
      </section>

      <section className="dashboard-info">
        <div className="info-card">
          <h2>关于您的账号</h2>
          <p>您的 JWT Token 已安全存储在 HttpOnly Cookie 中，有效期为 7 天。</p>
          <p>这意味着：</p>
          <ul>
            <li>Token 无法被前端 JavaScript 访问，提高了安全性</li>
            <li>7 天内无需重新登录</li>
            <li>点击"退出登录"会立即清除 Cookie</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
