"use client";

import Link from "next/link";
import "./styles.css";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5005";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">RecallFlow 用户端</p>
        <h1>家庭练习、背诵和复习入口</h1>
        <p className="summary">
          Phase 1 当前只搭建基础页面和服务框架，后续再接入题库、练习、错题和奖励流程。
        </p>
      </section>

      <section className="action-buttons">
        <Link href="/login" className="action-button primary">
          登录账号
        </Link>
        <Link href="/register" className="action-button secondary">
          注册新账号
        </Link>
      </section>

      <section className="grid" aria-label="基础信息">
        <div className="panel">
          <span>用户端端口</span>
          <strong>5001</strong>
        </div>
        <div className="panel">
          <span>API 地址</span>
          <strong>{apiBaseUrl}</strong>
        </div>
        <div className="panel">
          <span>当前阶段</span>
          <strong>框架初始化</strong>
        </div>
      </section>

      <section className="info-section">
        <div className="info-card">
          <h2>安全认证说明</h2>
          <p>RecallFlow 采用 HttpOnly Cookie + JWT 的安全认证方式：</p>
          <ul>
            <li>
              <strong>密码安全</strong>：使用 bcrypt 加盐哈希加密存储，即使数据库泄露也无法还原原始密码
            </li>
            <li>
              <strong>Token 安全</strong>：JWT Token 存储在 HttpOnly Cookie 中，前端 JavaScript 无法访问，有效防止 XSS 攻击
            </li>
            <li>
              <strong>会话有效期</strong>：登录状态默认保持 7 天，可通过环境变量配置
            </li>
            <li>
              <strong>安全退出</strong>：退出登录时立即清除 Cookie，确保账号安全
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
