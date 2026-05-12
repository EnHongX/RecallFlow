"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import "../../styles.css";

const steps = [
  "阅读任务说明",
  "完成资料学习",
  "完成题目练习",
  "提交任务结果",
];

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = String(params.taskId || "");

  return (
    <main className="shell">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <p className="eyebrow">学习任务</p>
            <h1 className="dashboard-title">任务学习页</h1>
            <p className="dashboard-subtitle">任务编号：{taskId}</p>
          </div>
          <Link href="/tasks" className="action-button secondary">
            返回今日任务
          </Link>
        </div>
      </div>

      <div className="study-frame">
        <section className="study-main">
          <span className="task-status">待接入内容</span>
          <h2>这里展示当前任务项</h2>
          <p>后续根据任务类型展示课文、生字、口算题、英语单词、背诵提示或错题。</p>
          <div className="answer-placeholder">答题 / 背诵 / 标记掌握区域</div>
        </section>

        <aside className="study-side">
          <h2>任务步骤</h2>
          <ol>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <button className="action-button primary" disabled>
            提交结果
          </button>
        </aside>
      </div>
    </main>
  );
}
