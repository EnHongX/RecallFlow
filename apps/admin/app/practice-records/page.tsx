"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import { useApp } from "../contexts/AppContext";
import {
  getPracticeRecords,
  type PracticeRecord,
  type Student,
  type ApiError,
} from "@/lib/api";
import "../styles.css";

function getResultLabel(result: string): string {
  switch (result) {
    case "gotit":
      return "掌握了";
    case "again":
      return "还要再练";
    default:
      return result;
  }
}

function getResultBadgeClass(result: string): string {
  switch (result) {
    case "gotit":
      return "status-badge active";
    case "again":
      return "status-badge archived";
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

export default function PracticeRecordsPage() {
  const { students, setError } = useApp();
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentFilter, setStudentFilter] = useState<number | undefined>(undefined);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPracticeRecords(studentFilter, 200);
      setRecords(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "获取练习记录失败");
    } finally {
      setLoading(false);
    }
  }, [studentFilter, setError]);

  const fetchRecordsRef = useRef(fetchRecords);

  useEffect(() => {
    fetchRecordsRef.current = fetchRecords;
  }, [fetchRecords]);

  useEffect(() => {
    fetchRecordsRef.current();
  }, [studentFilter]);

  const handleResetFilters = () => {
    setStudentFilter(undefined);
  };

  return (
    <AdminLayout title="练习记录">
      <div className="page-header">
        <h1 className="page-title">练习记录</h1>
        <p className="page-subtitle">查看孩子的练习提交记录</p>
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
            <button onClick={handleResetFilters} className="filter-button secondary">
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">练习记录列表 ({records.length} 条)</h3>
        </div>

        {loading ? (
          <div className="loading-container" style={{ minHeight: "300px" }}>
            <p>加载中...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="empty-table">
            <p className="empty-table-text">暂无练习记录</p>
            <p style={{ marginTop: "8px", fontSize: "13px", color: "#999" }}>
              孩子完成练习后，这里会显示练习记录
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>孩子</th>
                <th>题目</th>
                <th>结果</th>
                <th>提交时间</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.student_name || "-"}</td>
                  <td>
                    <div className="table-cell-ellipsis" title={record.card_front || ""}>
                      {truncateText(record.card_front || "-", 50)}
                    </div>
                  </td>
                  <td>
                    <span className={getResultBadgeClass(record.result)}>
                      {getResultLabel(record.result)}
                    </span>
                  </td>
                  <td>
                    {record.submitted_at
                      ? new Date(record.submitted_at).toLocaleString("zh-CN")
                      : "-"}
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
