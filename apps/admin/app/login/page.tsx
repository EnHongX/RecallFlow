"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, type ApiError } from "@/lib/api";
import "../styles.css";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const success = searchParams.get("registered") === "1" ? "注册成功，请登录" : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone || !password) {
      setError("请输入手机号和密码");
      return;
    }

    setLoading(true);

    try {
      await login(phone, password);
      router.push("/home");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">家长登录</h1>
        <p className="auth-subtitle">欢迎回到 RecallFlow</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {success && (
            <div className="success-alert">
              {success}
            </div>
          )}

          {error && (
            <div className="error-alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              手机号
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <p className="auth-footer">
          还没有账号？
          <Link href="/register" className="auth-link">
            立即注册
          </Link>
        </p>
      </div>
    </main>
  );
}
