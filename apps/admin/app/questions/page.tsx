"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import { useApp } from "../contexts/AppContext";
import {
  getSubjects,
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  restoreQuestion,
  createCard,
  type Subject,
  type Question,
  type QuestionCreate,
  type QuestionUpdate,
  type QuestionFilter,
  type Student,
  type ApiError,
} from "@/lib/api";
import "../styles.css";

type ViewMode = "list" | "add" | "edit" | "detail";

const TYPE_OPTIONS = [
  { value: "single_choice", label: "单选题" },
  { value: "multiple_choice", label: "多选题" },
  { value: "fill_blank", label: "填空题" },
  { value: "true_false", label: "判断题" },
  { value: "short_answer", label: "简答题" },
  { value: "essay", label: "论述题" },
];

const GRADING_METHOD_OPTIONS = [
  { value: "manual", label: "手动判分" },
  { value: "auto", label: "自动判分" },
  { value: "ai", label: "AI判分" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "启用" },
  { value: "archived", label: "已归档" },
  { value: "", label: "全部" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "简单" },
  { value: "normal", label: "中等" },
  { value: "hard", label: "困难" },
];

function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return "-";
  const normalized = text.trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.substring(0, maxLength) + "...";
}

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags.split(",").map((t) => t.trim()).filter((t) => t);
}

export default function QuestionsPage() {
  const { students, currentStudent, setError } = useApp();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<QuestionFilter>({});
  const [searchKeyword, setSearchKeyword] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [detailQuestion, setDetailQuestion] = useState<Question | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [formSubjectId, setFormSubjectId] = useState<number>(0);
  const [formType, setFormType] = useState("single_choice");
  const [formPrompt, setFormPrompt] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formExplanation, setFormExplanation] = useState("");
  const [formChildExplanation, setFormChildExplanation] = useState("");
  const [formFunHint, setFormFunHint] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("normal");
  const [formTags, setFormTags] = useState("");
  const [formGradingMethod, setFormGradingMethod] = useState("manual");
  const [formStudentId, setFormStudentId] = useState<number | null>(null);

  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [selectedQuestionForCard, setSelectedQuestionForCard] = useState<Question | null>(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<number | null>(null);
  const [creatingCard, setCreatingCard] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await getSubjects();
      setSubjects(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "获取学科列表失败");
    }
  }, [setError]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const filterParams: QuestionFilter = { ...filters };
      if (searchKeyword) {
        filterParams.keyword = searchKeyword;
      }
      const data = await getQuestions(filterParams);
      setQuestions(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "获取题目列表失败");
    } finally {
      setLoading(false);
    }
  }, [filters, searchKeyword, setError]);

  const fetchSubjectsRef = useRef(fetchSubjects);
  const fetchQuestionsRef = useRef(fetchQuestions);

  useEffect(() => {
    fetchSubjectsRef.current = fetchSubjects;
  }, [fetchSubjects]);

  useEffect(() => {
    fetchQuestionsRef.current = fetchQuestions;
  }, [fetchQuestions]);

  useEffect(() => {
    fetchSubjectsRef.current();
  }, []);

  useEffect(() => {
    if (viewMode === "list") {
      fetchQuestionsRef.current();
    }
  }, [viewMode]);

  const resetForm = () => {
    setFormSubjectId(subjects[0]?.id || 0);
    setFormType("single_choice");
    setFormPrompt("");
    setFormAnswer("");
    setFormExplanation("");
    setFormChildExplanation("");
    setFormFunHint("");
    setFormDifficulty("normal");
    setFormTags("");
    setFormGradingMethod("manual");
    setFormStudentId(currentStudent?.id || null);
  };

  const handleAddQuestion = () => {
    resetForm();
    setViewMode("add");
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setFormSubjectId(question.subject_id);
    setFormType(question.type);
    setFormPrompt(question.prompt);
    setFormAnswer(question.answer);
    setFormExplanation(question.explanation || "");
    setFormChildExplanation(question.child_explanation || "");
    setFormFunHint(question.fun_hint || "");
    setFormDifficulty(question.difficulty);
    setFormTags(question.tags || "");
    setFormGradingMethod(question.grading_method);
    setFormStudentId(question.student_id);
    setViewMode("edit");
  };

  const handleViewQuestion = async (question: Question) => {
    try {
      const data = await getQuestion(question.id);
      setDetailQuestion(data);
      setViewMode("detail");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "获取题目详情失败");
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setEditingQuestion(null);
    setDetailQuestion(null);
    resetForm();
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrompt.trim() || !formAnswer.trim()) {
      setError("请填写题干和答案");
      return;
    }
    if (!formSubjectId) {
      setError("请选择学科");
      return;
    }
    setFormLoading(true);
    setError("");
    try {
      const data: QuestionCreate = {
        subject_id: formSubjectId,
        type: formType,
        prompt: formPrompt.trim(),
        answer: formAnswer.trim(),
        explanation: formExplanation.trim() || null,
        child_explanation: formChildExplanation.trim() || null,
        fun_hint: formFunHint.trim() || null,
        difficulty: formDifficulty,
        tags: formTags.trim() || null,
        grading_method: formGradingMethod,
        student_id: formStudentId,
      };
      await createQuestion(data);
      handleBackToList();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "添加失败");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    if (!formPrompt.trim() || !formAnswer.trim()) {
      setError("请填写题干和答案");
      return;
    }
    setFormLoading(true);
    setError("");
    try {
      const data: QuestionUpdate = {
        subject_id: formSubjectId,
        type: formType,
        prompt: formPrompt.trim(),
        answer: formAnswer.trim(),
        explanation: formExplanation.trim() || null,
        child_explanation: formChildExplanation.trim() || null,
        fun_hint: formFunHint.trim() || null,
        difficulty: formDifficulty,
        tags: formTags.trim() || null,
        grading_method: formGradingMethod,
        student_id: formStudentId,
      };
      await updateQuestion(editingQuestion.id, data);
      handleBackToList();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "更新失败");
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchiveQuestion = async (questionId: number) => {
    if (!confirm("确定要归档这个题目吗？归档后可以通过筛选查看和恢复。")) return;
    setProcessingId(questionId);
    try {
      await deleteQuestion(questionId);
      await fetchQuestions();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "归档失败");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestoreQuestion = async (questionId: number) => {
    if (!confirm("确定要恢复这个题目吗？")) return;
    setProcessingId(questionId);
    try {
      await restoreQuestion(questionId);
      await fetchQuestions();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "恢复失败");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateCard = (question: Question) => {
    setSelectedQuestionForCard(question);
    setSelectedStudentForCard(currentStudent?.id || null);
    setShowCreateCardModal(true);
  };

  const handleSubmitCreateCard = async () => {
    if (!selectedQuestionForCard || !selectedStudentForCard) {
      setError("请选择要绑定的孩子");
      return;
    }
    setCreatingCard(true);
    setError("");
    try {
      await createCard({
        question_id: selectedQuestionForCard.id,
        student_id: selectedStudentForCard,
      });
      setShowCreateCardModal(false);
      setSelectedQuestionForCard(null);
      setSelectedStudentForCard(null);
      alert("练习卡片生成成功！");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "生成卡片失败");
    } finally {
      setCreatingCard(false);
    }
  };

  const handleCancelCreateCard = () => {
    setShowCreateCardModal(false);
    setSelectedQuestionForCard(null);
    setSelectedStudentForCard(null);
    setError("");
  };

  const handleSearch = () => {
    fetchQuestions();
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchKeyword("");
  };

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.name || "-";
  };

  const getTypeLabel = (type: string) => {
    const option = TYPE_OPTIONS.find((o) => o.value === type);
    return option?.label || type;
  };

  const getGradingMethodLabel = (method: string) => {
    const option = GRADING_METHOD_OPTIONS.find((o) => o.value === method);
    return option?.label || method;
  };

  const getDifficultyLabel = (difficulty: string) => {
    const option = DIFFICULTY_OPTIONS.find((o) => o.value === difficulty);
    return option?.label || difficulty;
  };

  const getStatusLabel = (status: string) => {
    return status === "active" ? "启用" : "已归档";
  };

  const renderList = () => {
    if (viewMode === "add" || viewMode === "edit") {
      return renderForm();
    }
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
            <span className="filter-label">学科：</span>
            <select
              className="filter-select"
              value={filters.subject_id ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  subject_id: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">全部</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <span className="filter-label">题型：</span>
            <select
              className="filter-select"
              value={filters.type ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, type: e.target.value || undefined })
              }
            >
              <option value="">全部</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <span className="filter-label">判分方式：</span>
            <select
              className="filter-select"
              value={filters.grading_method ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  grading_method: e.target.value || undefined,
                })
              }
            >
              <option value="">全部</option>
              {GRADING_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
            <span className="filter-label">绑定孩子：</span>
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
        </div>

        <div className="filter-row" style={{ marginTop: "12px" }}>
          <div className="filter-item" style={{ flex: 1 }}>
            <span className="filter-label">关键词搜索：</span>
            <input
              type="text"
              className="filter-input"
              style={{ flex: 1, maxWidth: "400px" }}
              placeholder="搜索题干、答案、标签..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="filter-item">
            <button onClick={handleSearch} className="filter-button primary">
              搜索
            </button>
            <button onClick={handleResetFilters} className="filter-button secondary">
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">题目列表 ({questions.length} 条)</h3>
          <div className="table-actions">
            <button onClick={handleAddQuestion} className="add-button">
              + 新增题目
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container" style={{ minHeight: "300px" }}>
            <p>加载中...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="empty-table">
            <p className="empty-table-text">暂无题目数据</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>学科</th>
                <th>题型</th>
                <th>题干</th>
                <th>答案</th>
                <th>标签</th>
                <th>绑定孩子</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id}>
                  <td>{getSubjectName(question.subject_id)}</td>
                  <td>{getTypeLabel(question.type)}</td>
                  <td>
                    <div className="table-cell-ellipsis" title={question.prompt}>
                      {truncateText(question.prompt, 40)}
                    </div>
                  </td>
                  <td>
                    <div className="table-cell-ellipsis" title={question.answer}>
                      {truncateText(question.answer, 30)}
                    </div>
                  </td>
                  <td>
                    {parseTags(question.tags).map((tag, index) => (
                      <span key={index} className="tag-badge">
                        {tag}
                      </span>
                    ))}
                    {!question.tags && "-"}
                  </td>
                  <td>{question.student_name || "-"}</td>
                  <td>
                    <span className={`status-badge ${question.status}`}>
                      {getStatusLabel(question.status)}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions-cell">
                      <button
                        onClick={() => handleViewQuestion(question)}
                        className="table-action-button view"
                      >
                        详情
                      </button>
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="table-action-button edit"
                      >
                        编辑
                      </button>
                      {question.status === "active" && (
                        <button
                          onClick={() => handleCreateCard(question)}
                          className="table-action-button"
                          style={{ backgroundColor: "#4CAF50", color: "white" }}
                        >
                          生成卡片
                        </button>
                      )}
                      {question.status === "active" ? (
                        <button
                          onClick={() => handleArchiveQuestion(question.id)}
                          disabled={processingId === question.id}
                          className="table-action-button archive"
                        >
                          {processingId === question.id ? "处理中..." : "归档"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestoreQuestion(question.id)}
                          disabled={processingId === question.id}
                          className="table-action-button restore"
                        >
                          {processingId === question.id ? "处理中..." : "恢复"}
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

      {showCreateCardModal && selectedQuestionForCard && (
        <div className="modal-overlay" onClick={handleCancelCreateCard}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">生成练习卡片</h3>
              <button
                type="button"
                onClick={handleCancelCreateCard}
                className="modal-close-button"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">题目</label>
                <div
                  className="form-textarea"
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: "12px",
                    borderRadius: "4px",
                    minHeight: "60px",
                  }}
                >
                  {truncateText(selectedQuestionForCard.prompt, 200)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">绑定到孩子 *</label>
                <select
                  className="select-input"
                  value={selectedStudentForCard ?? ""}
                  onChange={(e) =>
                    setSelectedStudentForCard(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  required
                >
                  <option value="">请选择孩子</option>
                  {students.map((student: Student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">卡片内容预览</label>
                <div style={{ marginBottom: "12px" }}>
                  <strong>正面（题干）：</strong>
                  <p style={{ marginTop: "4px", color: "#666" }}>
                    {selectedQuestionForCard.prompt}
                  </p>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <strong>背面（答案）：</strong>
                  <p style={{ marginTop: "4px", color: "#666" }}>
                    {selectedQuestionForCard.answer}
                  </p>
                </div>
                {selectedQuestionForCard.child_explanation && (
                  <div style={{ marginBottom: "12px" }}>
                    <strong>孩子易懂版解析：</strong>
                    <p style={{ marginTop: "4px", color: "#666" }}>
                      {selectedQuestionForCard.child_explanation}
                    </p>
                  </div>
                )}
                {selectedQuestionForCard.fun_hint && (
                  <div>
                    <strong>趣味提示：</strong>
                    <p style={{ marginTop: "4px", color: "#666" }}>
                      {selectedQuestionForCard.fun_hint}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={handleCancelCreateCard}
                className="cancel-button"
                disabled={creatingCard}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmitCreateCard}
                className="submit-button"
                disabled={creatingCard || !selectedStudentForCard}
              >
                {creatingCard ? "生成中..." : "生成卡片"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderForm = () => (
    <div className="form-container">
      <div className="form-header">
        <h2 className="form-title">
          {viewMode === "add" ? "新增题目" : "编辑题目"}
        </h2>
        <button onClick={handleBackToList} className="form-back-button">
          ← 返回列表
        </button>
      </div>

      <form onSubmit={viewMode === "add" ? handleSubmitAdd : handleSubmitEdit} className="modal-form">
        <div className="form-section">
          <h3 className="form-section-title">基本信息</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">学科 *</label>
              <select
                className="select-input"
                value={formSubjectId}
                onChange={(e) => setFormSubjectId(Number(e.target.value))}
                required
              >
                <option value={0}>请选择学科</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">题型 *</label>
              <select
                className="select-input"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                required
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">难度</label>
              <select
                className="select-input"
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(e.target.value)}
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">判分方式</label>
              <select
                className="select-input"
                value={formGradingMethod}
                onChange={(e) => setFormGradingMethod(e.target.value)}
              >
                {GRADING_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">绑定孩子</label>
            <select
              className="select-input"
              value={formStudentId ?? ""}
              onChange={(e) =>
                setFormStudentId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">不绑定（通用题目）</option>
              {students.map((student: Student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.grade})
                </option>
              ))}
            </select>
            <p className="form-help-text">
              绑定到特定孩子的题目，只有该孩子可以看到。不绑定则所有孩子都能使用
            </p>
          </div>

          {viewMode === "edit" && editingQuestion && (
            <div className="form-group">
              <label className="form-label">当前状态</label>
              <select
                className="select-input"
                value={editingQuestion.status}
                disabled
              >
                <option value="active">启用</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-section">
          <h3 className="form-section-title">题目内容</h3>
          <div className="form-group">
            <label className="form-label">题干 *</label>
            <textarea
              className="form-textarea"
              value={formPrompt}
              onChange={(e) => setFormPrompt(e.target.value)}
              placeholder="请输入题目内容，例如：2 + 3 = ?"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">答案 *</label>
            <textarea
              className="form-textarea"
              value={formAnswer}
              onChange={(e) => setFormAnswer(e.target.value)}
              placeholder="请输入参考答案"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">解析（家长视角）</label>
            <textarea
              className="form-textarea"
              value={formExplanation}
              onChange={(e) => setFormExplanation(e.target.value)}
              placeholder="请输入题目解析，用家长能够理解的详细解释"
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">孩子专属内容</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">孩子易懂版解析</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: "100px" }}
                value={formChildExplanation}
                onChange={(e) => setFormChildExplanation(e.target.value)}
                placeholder="用孩子能听懂的话来解释这道题"
              />
              <p className="form-help-text">
                用简单、有趣的语言解释给孩子听的解析，帮助孩子更容易理解
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">趣味提示</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: "100px" }}
                value={formFunHint}
                onChange={(e) => setFormFunHint(e.target.value)}
                placeholder="帮助记忆的趣味提示、口诀或小故事"
              />
              <p className="form-help-text">
                有趣的记忆技巧、提示或小故事，帮助孩子记住解题方法
              </p>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">其他信息</h3>
          <div className="form-group">
            <label className="form-label">标签</label>
            <input
              type="text"
              className="form-input"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="多个标签用逗号分隔，如：数学,代数,一元一次方程"
            />
            <p className="form-help-text">
              标签用于分类和搜索题目，方便后续查找
            </p>
          </div>
        </div>

        <div className="form-footer">
          <button
            type="button"
            onClick={handleBackToList}
            className="cancel-button"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={formLoading}
            className="submit-button"
          >
            {formLoading
              ? (viewMode === "add" ? "添加中..." : "保存中...")
              : (viewMode === "add" ? "添加题目" : "保存修改")}
          </button>
        </div>
      </form>
    </div>
  );

  const renderDetail = () => {
    if (!detailQuestion) return null;

    return (
      <div className="form-container">
        <div className="form-header">
          <h2 className="form-title">题目详情</h2>
          <button onClick={handleBackToList} className="form-back-button">
            ← 返回列表
          </button>
        </div>

        <div className="question-detail-meta">
          <div className="question-detail-meta-item">
            <div className="question-detail-meta-label">学科</div>
            <div className="question-detail-meta-value">
              {getSubjectName(detailQuestion.subject_id)}
            </div>
          </div>
          <div className="question-detail-meta-item">
            <div className="question-detail-meta-label">题型</div>
            <div className="question-detail-meta-value">
              {getTypeLabel(detailQuestion.type)}
            </div>
          </div>
          <div className="question-detail-meta-item">
            <div className="question-detail-meta-label">难度</div>
            <div className="question-detail-meta-value">
              {getDifficultyLabel(detailQuestion.difficulty)}
            </div>
          </div>
          <div className="question-detail-meta-item">
            <div className="question-detail-meta-label">判分方式</div>
            <div className="question-detail-meta-value">
              {getGradingMethodLabel(detailQuestion.grading_method)}
            </div>
          </div>
          <div className="question-detail-meta-item">
            <div className="question-detail-meta-label">绑定孩子</div>
            <div className="question-detail-meta-value">
              {detailQuestion.student_name || "未绑定（通用题目）"}
            </div>
          </div>
          <div className="question-detail-meta-item">
            <div className="question-detail-meta-label">状态</div>
            <div className="question-detail-meta-value">
              <span className={`status-badge ${detailQuestion.status}`}>
                {getStatusLabel(detailQuestion.status)}
              </span>
            </div>
          </div>
        </div>

        {detailQuestion.tags && (
          <div className="question-detail-section">
            <div className="question-detail-label">标签</div>
            <div>
              {parseTags(detailQuestion.tags).map((tag, index) => (
                <span key={index} className="tag-badge">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="question-detail-section">
          <div className="question-detail-label">题干</div>
          <div className="question-detail-content">
            {detailQuestion.prompt}
          </div>
        </div>

        <div className="question-detail-section">
          <div className="question-detail-label">答案</div>
          <div className="question-detail-content">
            {detailQuestion.answer}
          </div>
        </div>

        {detailQuestion.explanation && (
          <div className="question-detail-section">
            <div className="question-detail-label">解析（家长视角）</div>
            <div className="question-detail-content">
              {detailQuestion.explanation}
            </div>
          </div>
        )}

        {detailQuestion.child_explanation && (
          <div className="question-detail-section">
            <div className="question-detail-label">孩子易懂版解析</div>
            <div className="question-detail-content">
              {detailQuestion.child_explanation}
            </div>
          </div>
        )}

        {detailQuestion.fun_hint && (
          <div className="question-detail-section">
            <div className="question-detail-label">趣味提示</div>
            <div className="question-detail-content">
              {detailQuestion.fun_hint}
            </div>
          </div>
        )}

        <div className="form-footer">
          <button
            onClick={() => handleEditQuestion(detailQuestion)}
            className="submit-button"
          >
            编辑此题目
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="题库管理">
      <div className="page-header">
        <h1 className="page-title">题库管理</h1>
        <p className="page-subtitle">管理题目库，支持按条件筛选和关键词搜索</p>
      </div>

      {renderList()}
    </AdminLayout>
  );
}
