"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import "../../styles.css";
import {
  getStudents,
  getCards,
  getCard,
  submitCardPractice,
  type Student,
  type Card,
  type ApiError,
} from "@/lib/api";

type ViewMode = "list" | "practice";

const STATUS_OPTIONS = [
  { value: "new", label: "新卡片" },
  { value: "learning", label: "学习中" },
  { value: "review", label: "复习中" },
  { value: "", label: "全部" },
];

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

export default function StudentPracticePage() {
  const router = useRouter();
  const params = useParams();
  const studentId = Number(params.studentId);

  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showFunHint, setShowFunHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cardStartTime, setCardStartTime] = useState<number | null>(null);
  const [studentAnswer, setStudentAnswer] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const studentsData = await getStudents();
      setStudents(studentsData);

      const student = studentsData.find((s) => s.id === studentId);
      if (!student) {
        setError("找不到该孩子");
        return;
      }
      setCurrentStudent(student);

      const filter: { student_id: number; status?: string } = { student_id: studentId };
      if (statusFilter) {
        filter.status = statusFilter;
      }
      const response = await getCards(filter, 1, 10000);
      setCards(response.items);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === "HTTP_401") {
        router.push("http://localhost:5002/login");
        return;
      }
      setError(apiError.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [studentId, statusFilter, router]);

  const fetchDataRef = useRef(fetchData);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    if (isNaN(studentId)) {
      router.push("/practice");
      return;
    }
    fetchDataRef.current();
  }, [studentId, router]);

  const handleStartPractice = (index: number) => {
    if (cards.length === 0) return;
    setCurrentCardIndex(index);
    setCurrentCard(cards[index]);
    setShowAnswer(false);
    setShowExplanation(false);
    setShowFunHint(false);
    setStudentAnswer("");
    // eslint-disable-next-line react-hooks/purity
    setCardStartTime(Date.now());
    setViewMode("practice");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setCurrentCard(null);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setShowExplanation(false);
    setShowFunHint(false);
    fetchData();
  };

  const handleBackToSelectStudent = () => {
    router.push("/practice");
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleShowExplanation = () => {
    setShowExplanation(true);
  };

  const handleShowFunHint = () => {
    setShowFunHint(true);
  };

  const handleSubmit = async (result: "gotit" | "again") => {
    if (!currentCard || submitting) return;

    setSubmitting(true);
    try {
      const timeSpentSeconds = cardStartTime
        ? Math.floor((Date.now() - cardStartTime) / 1000)
        : undefined;

      await submitCardPractice(
        currentCard.id,
        result,
        timeSpentSeconds,
        studentAnswer || undefined
      );

      const nextIndex = currentCardIndex + 1;
      if (nextIndex < cards.length) {
        setCurrentCardIndex(nextIndex);
        setCurrentCard(cards[nextIndex]);
        setShowAnswer(false);
        setShowExplanation(false);
        setShowFunHint(false);
        setStudentAnswer("");
        setCardStartTime(Date.now());
      } else {
        handleBackToList();
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "提交失败");
    } finally {
      setSubmitting(false);
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

  if (error) {
    return (
      <main className="shell">
        <div className="error-alert">{error}</div>
        <button onClick={handleBackToSelectStudent} className="action-button secondary" style={{ marginTop: "16px" }}>
          返回选择孩子
        </button>
      </main>
    );
  }

  const renderList = () => (
    <>
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <p className="eyebrow">RecallFlow 练习</p>
            <h1 className="dashboard-title">
              {currentStudent?.name} 的练习卡片
            </h1>
            <p className="dashboard-subtitle">
              共 {cards.length} 张卡片待练习
            </p>
          </div>
          <button onClick={handleBackToSelectStudent} className="action-button secondary">
            ← 切换孩子
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-row">
          <div className="filter-item">
            <span className="filter-label">状态：</span>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">暂无待练习的卡片</p>
          <p style={{ marginTop: "8px", fontSize: "14px", color: "#667789" }}>
            请先在家长管理平台创建练习卡片
          </p>
        </div>
      ) : (
        <div className="students-list">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className="student-card"
              style={{ cursor: "pointer" }}
              onClick={() => handleStartPractice(index)}
            >
              <div className="student-info" style={{ flex: 1 }}>
                <div
                  className="student-avatar"
                  style={{
                    width: "40px",
                    height: "40px",
                    fontSize: "14px",
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>
                <div className="student-details" style={{ flex: 1, minWidth: 0 }}>
                  <span
                    className="student-name"
                    style={{
                      fontSize: "15px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {card.front}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                    <span className={getStatusBadgeClass(card.status)}>
                      {getStatusLabel(card.status)}
                    </span>
                    {card.fun_hint && (
                      <span style={{ fontSize: "12px", color: "#f59e0b" }}>
                        💡 有趣味提示
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartPractice(index);
                }}
                className="action-button primary"
              >
                开始练习
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderPractice = () => {
    if (!currentCard) return null;

    const progress = ((currentCardIndex + 1) / cards.length) * 100;

    return (
      <>
        <div className="dashboard-header">
          <div className="header-content">
            <div>
              <p className="eyebrow">RecallFlow 练习</p>
              <h1 className="dashboard-title">
                第 {currentCardIndex + 1} 题 / 共 {cards.length} 题
              </h1>
              <p className="dashboard-subtitle">
                {currentStudent?.name} 正在练习
              </p>
            </div>
            <button onClick={handleBackToList} className="action-button secondary">
              ← 返回列表
            </button>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: "8px",
            background: "#e0dbcf",
            borderRadius: "4px",
            marginBottom: "24px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#2f6f73",
              borderRadius: "4px",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div className="info-card" style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px" }}>📝 题目</h2>
            <span className={getStatusBadgeClass(currentCard.status)}>
              {getStatusLabel(currentCard.status)}
            </span>
          </div>
          <div
            style={{
              fontSize: "18px",
              lineHeight: "1.8",
              color: "#18212b",
              whiteSpace: "pre-wrap",
              padding: "16px",
              background: "#f6f6f3",
              borderRadius: "8px",
            }}
          >
            {currentCard.front}
          </div>
        </div>

        {!showAnswer ? (
          <>
            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", marginBottom: "16px" }}>
                ✍️ 我的答案
              </h2>
              <textarea
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="请输入你的答案..."
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "12px",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  border: "2px solid #e0dbcf",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  resize: "vertical",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2f6f73";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e0dbcf";
                }}
              />
            </div>

            {showFunHint && currentCard.fun_hint && (
              <div className="info-card" style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", marginBottom: "16px" }}>
                  💡 趣味提示
                </h2>
                <div
                  style={{
                    fontSize: "15px",
                    lineHeight: "1.8",
                    color: "#92400e",
                    whiteSpace: "pre-wrap",
                    padding: "16px",
                    background: "#fffbeb",
                    borderRadius: "8px",
                    border: "1px solid #fde68a",
                  }}
                >
                  {currentCard.fun_hint}
                </div>
              </div>
            )}
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <button
                onClick={handleShowAnswer}
                className="action-button primary"
                style={{ height: "56px", fontSize: "18px", padding: "0 48px" }}
              >
                👀 查看答案
              </button>
              {currentCard.fun_hint && !showFunHint && (
                <button
                  onClick={handleShowFunHint}
                  className="action-button secondary"
                  style={{ marginLeft: "16px" }}
                >
                  💡 看个提示
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {studentAnswer && (
              <div className="info-card" style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", marginBottom: "16px" }}>
                  ✍️ 我的答案
                </h2>
                <div
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.8",
                    color: "#18212b",
                    whiteSpace: "pre-wrap",
                    padding: "16px",
                    background: "#fef3c7",
                    borderRadius: "8px",
                    border: "1px solid #fcd34d",
                  }}
                >
                  {studentAnswer}
                </div>
              </div>
            )}

            <div className="info-card" style={{ marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", marginBottom: "16px" }}>
                ✅ 正确答案
              </h2>
              <div
                style={{
                  fontSize: "16px",
                  lineHeight: "1.8",
                  color: "#18212b",
                  whiteSpace: "pre-wrap",
                  padding: "16px",
                  background: "#f0fdf4",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                }}
              >
                {currentCard.back}
              </div>
            </div>

            {currentCard.child_explanation && (
              <div className="info-card" style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: "18px" }}>
                    🧒 孩子易懂版解析
                  </h2>
                </div>
                {showExplanation ? (
                  <div
                    style={{
                      fontSize: "15px",
                      lineHeight: "1.8",
                      color: "#18212b",
                      whiteSpace: "pre-wrap",
                      padding: "16px",
                      background: "#fefce8",
                      borderRadius: "8px",
                      border: "1px solid #fde68a",
                    }}
                  >
                    {currentCard.child_explanation}
                  </div>
                ) : (
                  <button
                    onClick={handleShowExplanation}
                    className="action-button secondary"
                  >
                    查看解析
                  </button>
                )}
              </div>
            )}

            {currentCard.fun_hint && (
              <div className="info-card" style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", marginBottom: "16px" }}>
                  💡 趣味提示
                </h2>
                {showFunHint ? (
                  <div
                    style={{
                      fontSize: "15px",
                      lineHeight: "1.8",
                      color: "#92400e",
                      whiteSpace: "pre-wrap",
                      padding: "16px",
                      background: "#fffbeb",
                      borderRadius: "8px",
                      border: "1px solid #fde68a",
                    }}
                  >
                    {currentCard.fun_hint}
                  </div>
                ) : (
                  <button
                    onClick={handleShowFunHint}
                    className="action-button secondary"
                  >
                    看看提示
                  </button>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "24px",
                marginTop: "32px",
              }}
            >
              <button
                onClick={() => handleSubmit("again")}
                disabled={submitting}
                style={{
                  padding: "16px 40px",
                  fontSize: "18px",
                  fontWeight: "600",
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "2px solid #fecaca",
                  borderRadius: "12px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = "#fee2e2";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = "#fef2f2";
                  }
                }}
              >
                😅 还要再练
              </button>
              <button
                onClick={() => handleSubmit("gotit")}
                disabled={submitting}
                style={{
                  padding: "16px 40px",
                  fontSize: "18px",
                  fontWeight: "600",
                  background: "#2f6f73",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = "#265c5f";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = "#2f6f73";
                  }
                }}
              >
                {currentCardIndex + 1 < cards.length ? "✅ 掌握了，下一题" : "✅ 完成练习"}
              </button>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <main className="shell">
      {viewMode === "list" ? renderList() : renderPractice()}
    </main>
  );
}
