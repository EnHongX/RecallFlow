"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminLayout from "../components/AdminLayout";
import { useApp } from "../contexts/AppContext";
import { getQuestions, type ApiError } from "@/lib/api";
import "../styles.css";

export default function HomePage() {
  const { currentStudent, students, setError } = useApp();
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentStudentQuestions, setCurrentStudentQuestions] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const allResponse = await getQuestions(undefined, 1, 1);
        setTotalQuestions(allResponse.total);

        if (currentStudent) {
          const studentResponse = await getQuestions(
            { student_id: currentStudent.id },
            1,
            1
          );
          setCurrentStudentQuestions(studentResponse.total);
        } else {
          setCurrentStudentQuestions(0);
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || "获取题目信息失败");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentStudent, setError]);

  const stats = [
    {
      label: "孩子总数",
      value: students.length,
      icon: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "blue",
    },
    {
      label: "题目总数",
      value: totalQuestions,
      icon: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "green",
    },
    {
      label: "当前孩子题目",
      value: currentStudentQuestions,
      icon: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: "purple",
    },
    {
      label: "当前孩子状态",
      value: currentStudent ? "已选择" : "待选择",
      icon: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "orange",
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="首页">
        <div className="loading-container">
          <p>加载中...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="首页">
      <div className="page-header">
        <h1 className="page-title">总览</h1>
        <p className="page-subtitle">查看您的家庭学习管理数据概览</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {currentStudent && (
        <div className="current-student-badge">
          <div className="current-student-info">
            <div className="current-student-icon">
              {currentStudent.name?.charAt(0) || "?"}
            </div>
            <div className="current-student-text">
              <span className="current-student-label">当前孩子</span>
              <span className="current-student-name">{currentStudent.name}</span>
              <span className="current-student-grade">{currentStudent.grade}</span>
            </div>
          </div>
          <Link href="/students" className="action-button secondary">
            管理孩子
          </Link>
        </div>
      )}

      {!currentStudent && students.length > 0 && (
        <div className="empty-current-student">
          <strong>还没有选择当前孩子</strong>
          <span>请在孩子管理页面选择一个孩子作为当前孩子。</span>
          <Link href="/students" className="action-button primary" style={{ marginTop: "12px", width: "fit-content" }}>
            前往孩子管理
          </Link>
        </div>
      )}

      {students.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-text">
            您还没有添加孩子，请先添加孩子。
          </p>
          <Link href="/students" className="action-button primary" style={{ marginTop: "16px" }}>
            添加孩子
          </Link>
        </div>
      )}

      <div className="action-buttons">
        <Link href="/students" className="action-button-link secondary">
          管理孩子
        </Link>
        <Link href="/questions" className="action-button-link primary">
          管理题库
        </Link>
      </div>
    </AdminLayout>
  );
}
