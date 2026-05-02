"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import { useApp } from "../contexts/AppContext";
import {
  getDailyProgress,
  type DailyProgress,
  type ApiError,
} from "@/lib/api";
import "../styles.css";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins} 分 ${secs} 秒`;
  }
  return `${secs} 秒`;
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return "#10b981";
  if (progress >= 50) return "#f59e0b";
  return "#ef4444";
}

export default function DailyProgressPage() {
  const { students, setError } = useApp();
  const [progressData, setProgressData] = useState<DailyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentFilter, setStudentFilter] = useState<number | undefined>(undefined);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDailyProgress(studentFilter);
      setProgressData(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "获取每日进度失败");
    } finally {
      setLoading(false);
    }
  }, [studentFilter, setError]);

  const fetchProgressRef = useRef(fetchProgress);

  useEffect(() => {
    fetchProgressRef.current = fetchProgress;
  }, [fetchProgress]);

  useEffect(() => {
    fetchProgressRef.current();
  }, [studentFilter]);

  const handleResetFilters = () => {
    setStudentFilter(undefined);
  };

  const handleRefresh = () => {
    fetchProgressRef.current();
  };

  return (
    <AdminLayout title="每日进度">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="page-title">每日进度</h1>
            <p className="page-subtitle">查看孩子今日学习进度和目标完成情况</p>
          </div>
          <button onClick={handleRefresh} className="action-button secondary">
            刷新数据
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-row">
          <div className="filter-item">
            <span className="filter-label">孩子：</span>
            <select
              className="filter-select"
              value={studentFilter ?? ""}
              onChange={(e) =>
                setStudentFilter(e.target.value ? Number(e.target.value) : undefined)
              }
            >
              <option value="">全部</option>
              {students.map((student: { id: number; name: string }) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <button onClick={handleResetFilters} className="filter-button secondary">
              重置
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container" style={{ minHeight: "300px" }}>
          <p>加载中...</p>
        </div>
      ) : progressData.length === 0 ? (
        <div className="empty-state" style={{ padding: "60px 20px" }}>
          <p className="empty-state-text">暂无进度数据</p>
          <p style={{ marginTop: "8px", fontSize: "14px", color: "#667789" }}>
            孩子完成练习后，这里会显示今日学习进度
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "24px" }}>
          {progressData.map((progress) => (
            <div
              key={progress.student_id}
              className="info-card"
              style={{ padding: "24px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", color: "#18212b" }}>
                    {progress.student_name}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#667789" }}>
                    每日目标：{progress.goal_questions} 题 / {progress.goal_minutes} 分钟
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <div
                  style={{
                    padding: "16px",
                    background: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "13px", color: "#166534", marginBottom: "8px" }}>
                    已完成题数
                  </p>
                  <p style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#15803d" }}>
                    {progress.completed_questions} / {progress.goal_questions}
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#667789" }}>
                    答对 {progress.correct_questions} 题，还要再练 {progress.incorrect_questions} 题
                  </p>
                </div>

                <div
                  style={{
                    padding: "16px",
                    background: "#fefce8",
                    borderRadius: "8px",
                    border: "1px solid #fde68a",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "13px", color: "#854d0e", marginBottom: "8px" }}>
                    学习时长
                  </p>
                  <p style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#a16207" }}>
                    {formatDuration(progress.total_seconds)}
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#667789" }}>
                    目标 {progress.goal_minutes} 分钟
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gap: "20px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#18212b" }}>
                      题数进度
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: getProgressColor(progress.questions_progress),
                      }}
                    >
                      {progress.questions_progress.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "12px",
                      background: "#e0dbcf",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(progress.questions_progress, 100)}%`,
                        background: getProgressColor(progress.questions_progress),
                        borderRadius: "6px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#18212b" }}>
                      时长进度
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: getProgressColor(progress.minutes_progress),
                      }}
                    >
                      {progress.minutes_progress.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "12px",
                      background: "#e0dbcf",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(progress.minutes_progress, 100)}%`,
                        background: getProgressColor(progress.minutes_progress),
                        borderRadius: "6px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              </div>

              {progress.questions_progress >= 100 && progress.minutes_progress >= 100 && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "12px 16px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "#166534", fontWeight: "600" }}>
                    🎉 太棒了！今日目标已全部完成！
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
