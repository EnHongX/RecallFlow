"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import { useApp } from "../contexts/AppContext";
import {
  getWrongCards,
  markWrongCardAsMastered,
  type WrongCard,
  type Student,
  type ApiError,
} from "@/lib/api";
import "../styles.css";

function getStatusLabel(status: string): string {
  switch (status) {
    case "new":
      return "新卡片";
    case "learning":
      return "学习中";
    case "review":
      return "复习中";
    case "mastered":
      return "已掌握";
    default:
      return status;
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "new":
      return "status-badge active";
    case "learning":
      return "status-badge";
    case "review":
      return "status-badge archived";
    case "mastered":
      return "status-badge";
    default:
      return "status-badge";
  }
}

function truncateText(text: string, maxLength: number = 40): string {
  if (!text) return "-";
  const normalized = text.trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.substring(0, maxLength) + "...";
}

export default function WrongCardsPage() {
  const { students, setError } = useApp();
  const [wrongCards, setWrongCards] = useState<WrongCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentFilter, setStudentFilter] = useState<number | undefined>(undefined);
  const [showMastered, setShowMastered] = useState<boolean | undefined>(undefined);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchWrongCards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWrongCards(studentFilter, showMastered);
      setWrongCards(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "获取错题列表失败");
    } finally {
      setLoading(false);
    }
  }, [studentFilter, showMastered, setError]);

  const fetchWrongCardsRef = useRef(fetchWrongCards);

  useEffect(() => {
    fetchWrongCardsRef.current = fetchWrongCards;
  }, [fetchWrongCards]);

  useEffect(() => {
    fetchWrongCardsRef.current();
  }, [studentFilter, showMastered]);

  const handleResetFilters = () => {
    setStudentFilter(undefined);
    setShowMastered(undefined);
  };

  const handleMarkAsMastered = async (wrongCardId: number) => {
    if (!confirm("确定要将这道错题标记为已掌握吗？")) return;
    
    setProcessingId(wrongCardId);
    try {
      await markWrongCardAsMastered(wrongCardId);
      await fetchWrongCards();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "标记失败");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout title="错题列表">
      <div className="page-header">
        <h1 className="page-title">错题列表</h1>
        <p className="page-subtitle">查看孩子需要再练的卡片，可标记为已掌握</p>
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
              {students.map((student: Student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <span className="filter-label">状态：</span>
            <select
              className="filter-select"
              value={showMastered === undefined ? "" : showMastered.toString()}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setShowMastered(undefined);
                } else {
                  setShowMastered(value === "true");
                }
              }}
            >
              <option value="">待复习</option>
              <option value="false">待复习</option>
              <option value="true">已掌握</option>
            </select>
          </div>

          <div className="filter-item">
            <button onClick={handleResetFilters} className="filter-button secondary">
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">错题列表 ({wrongCards.length} 条)</h3>
        </div>

        {loading ? (
          <div className="loading-container" style={{ minHeight: "300px" }}>
            <p>加载中...</p>
          </div>
        ) : wrongCards.length === 0 ? (
          <div className="empty-table">
            <p className="empty-table-text">暂无错题</p>
            <p style={{ marginTop: "8px", fontSize: "13px", color: "#999" }}>
              {showMastered === true
                ? "没有已掌握的错题记录"
                : "孩子练习时答错或不确定的题目会显示在这里"}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>孩子</th>
                <th>题目</th>
                <th>答案</th>
                <th>卡片状态</th>
                <th>掌握状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {wrongCards.map((wc) => (
                <tr key={wc.id}>
                  <td>{wc.student_name || "-"}</td>
                  <td>
                    <div className="table-cell-ellipsis" title={wc.card_front || ""}>
                      {truncateText(wc.card_front || "-", 40)}
                    </div>
                  </td>
                  <td>
                    <div className="table-cell-ellipsis" title={wc.card_back || ""}>
                      {truncateText(wc.card_back || "-", 30)}
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(wc.card_status || "")}>
                      {getStatusLabel(wc.card_status || "")}
                    </span>
                  </td>
                  <td>
                    <span className={wc.is_mastered ? "status-badge active" : "status-badge archived"}>
                      {wc.is_mastered ? "已掌握" : "待复习"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions-cell">
                      {!wc.is_mastered && (
                        <button
                          onClick={() => handleMarkAsMastered(wc.id)}
                          disabled={processingId === wc.id}
                          className="table-action-button view"
                        >
                          {processingId === wc.id ? "处理中..." : "标记已掌握"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
