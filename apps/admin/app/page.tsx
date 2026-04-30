"use client";

import Link from "next/link";
import "./styles.css";

export default function AdminHomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">RecallFlow 家长平台</p>
        <h1>家庭学习管理中心</h1>
        <p className="summary">
          管理您的孩子信息，为家庭学习提供支持。请登录或注册账号开始使用。
        </p>
      </section>

      <section className="action-buttons">
        <Link href="/login" className="action-button-link primary">
          登录账号
        </Link>
        <Link href="/register" className="action-button-link secondary">
          注册新账号
        </Link>
      </section>
    </main>
  );
}
