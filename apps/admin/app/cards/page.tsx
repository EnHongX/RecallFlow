"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import { useApp } from "../contexts/AppContext";
import {
  getCards,
  getCard,
  deleteCard,
  type Card,
  type CardFilter,
  type Student,
  type ApiError,
} from "@/lib/api";
import "../styles.css";

type ViewMode = "list" | "detail";

const STATUS_OPTIONS = [
  { value: "new", label: "新卡片" },
  { value: "learning", label: "学习中" },
  { value: "review", label: "复习中" },
  { value: "mastered", label: "已掌握" },
  { value: "", label: "全部" },
];

function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return "-";
  const normalized = text.trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.substring(0, maxLength) + "...";
}

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

export default function CardsPage() {
  const { students, currentStudent, setError } = useApp();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CardFilter>({});
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCards(filters);
      setCards(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "获取练习卡片列表失败");
    } finally {
      setLoading(false);
    }
  }, [filters, setError]);

  useEffect(() => {
    if (viewMode === "list") {
      fetchCards();
    }
  }, [viewMode, fetchCards]);

  const handleViewCard = async (card: Card) => {
    try {
      const data = await getCard(card.id);
      setDetailCard(data);
      setViewMode("detail");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "获取卡片详情失败");
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setDetailCard(null);
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm("确定要删除这个练习卡片吗？删除后无法恢复。")) return;
    setProcessingId(cardId);
    try {
      await deleteCard(cardId);
      await fetchCards();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "删除失败");
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const renderList = () => {
    if (viewMode === "detail") {
      return renderDetail();
    }
    return renderListTable();
  };

  const renderListTable = () => (
    <>
      <div className="filter-bar">
        <div className="filter-row">
          <div className="filter-item">
            <span className="filter-label">孩子：</span>
            <select
              className="filter-select"
              value={filters.student_id ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  student_id: e.target.value ? Number(e.target.value) : undefined,
                })
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
              value={filters.status ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value || undefined })
              }
            >
              <option value="">全部</option>
              {STATUS_OPTIONS.filter((o) => o.value).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">练习卡片列表 ({cards.length} 条)</h3>
        </div>

        {loading ? (
          <div className="loading-container" style={{ minHeight: "300px" }}>
            <p>加载中...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="empty-table">
            <p className="empty-table-text">暂无练习卡片数据</p>
            <p style={{ marginTop: "8px", fontSize: "13px", color: "#999" }}>
              您可以在题库管理中，从题目生成练习卡片
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>孩子</th>
                <th>正面（题干）</th>
                <th>背面（答案）</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id}>
                  <td>{card.student_name || "-"}</td>
                  <td>
                    <div className="table-cell-ellipsis" title={card.front}>
                      {truncateText(card.front, 40)}
                    </div>
                  </td>
                  <td>
                    <div className="table-cell-ellipsis" title={card.back}>
                      {truncateText(card.back, 30)}
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(card.status)}>
                      {getStatusLabel(card.status)}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions-cell">
                      <button
                        onClick={() => handleViewCard(card)}
                        className="table-action-button view"
                      >
                        详情
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        disabled={processingId === card.id}
                        className="table-action-button delete"
                      >
                        {processingId === card.id ? "处理中..." : "删除"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderDetail = () => {
    if (!detailCard) return null;

    return (
      <div className="form-container">
        <div className="form-header">
          <h2 className="form-title">练习卡片详情</h2>
          <button onClick={handleBackToList} className="form-back-button">
            ← 返回列表
          </button>
        </div>

        <div className="question-detail-meta">
          <div className="question-detail-meta-item">
            <div className="question-detail-meta-label">孩子</div>
            <div className="question-detail-meta-value">
              {detailCard.student_name || "-"}
            </div>
          </div>
          <div className="question-detail-meta-item">
            <div className="question-detail-meta-label">状态</div>
            <div className="question-detail-meta-value">
              <span className={getStatusBadgeClass(detailCard.status)}>
                {getStatusLabel(detailCard.status)}
              </span>
            </div>
          </div>
          <div className="question-detail-meta-item">
            <div className="question-detail-meta-label">卡片类型</div>
            <div className="question-detail-meta-value">
              {detailCard.card_type === "practice" ? "练习卡片" : detailCard.card_type}
            </div>
          </div>
          <div className="question-detail-meta-item">
            <div className="question-detail-meta-label">判分方式</div>
            <div className="question-detail-meta-value">
              {detailCard.grading_method === "manual"
                ? "手动判分"
                : detailCard.grading_method === "auto"
                ? "自动判分"
                : detailCard.grading_method === "ai"
                ? "AI判分"
                : detailCard.grading_method}
            </div>
          </div>
        </div>

        <div className="question-detail-section">
          <div className="question-detail-label">正面（题干）</div>
          <div className="question-detail-content">
            {detailCard.front}
          </div>
        </div>

        <div className="question-detail-section">
          <div className="question-detail-label">背面（答案）</div>
          <div className="question-detail-content">
            {detailCard.back}
          </div>
        </div>

        {detailCard.child_explanation && (
          <div className="question-detail-section">
            <div className="question-detail-label">孩子易懂版解析</div>
            <div className="question-detail-content">
              {detailCard.child_explanation}
            </div>
          </div>
        )}

        {detailCard.fun_hint && (
          <div className="question-detail-section">
            <div className="question-detail-label">趣味提示</div>
            <div className="question-detail-content">
              {detailCard.fun_hint}
            </div>
          </div>
        )}

        {detailCard.next_review_at && (
          <div className="question-detail-section">
            <div className="question-detail-label">下次复习时间</div>
            <div className="question-detail-content">
              {new Date(detailCard.next_review_at).toLocaleString("zh-CN")}
            </div>
          </div>
        )}

        <div className="form-footer">
          <button
            onClick={() => handleDeleteCard(detailCard.id)}
            disabled={processingId === detailCard.id}
            className="cancel-button"
            style={{ color: "#dc2626", borderColor: "#fecaca" }}
          >
            {processingId === detailCard.id ? "处理中..." : "删除此卡片"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="练习卡片">
      <div className="page-header">
        <h1 className="page-title">练习卡片</h1>
        <p className="page-subtitle">管理练习卡片，支持按孩子和状态筛选</p>
      </div>

      {renderList()}
    </AdminLayout>
  );
}
