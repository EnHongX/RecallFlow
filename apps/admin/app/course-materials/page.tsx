"use client";

import Link from "next/link";
import AdminLayout from "../components/AdminLayout";
import "../styles.css";

const materialLayers = [
  {
    title: "课程",
    body: "例如一年级语文上册、数学同步练习、英语自然拼读。",
  },
  {
    title: "课时",
    body: "例如第 3 课 江南、20 以内进位加法、Unit 2 Words。",
  },
  {
    title: "资料",
    body: "例如课文、生字、词语、口算范围、单词表和背诵内容。",
  },
  {
    title: "题目",
    body: "资料下沉为可练习的题目，后续可以加入学习任务。",
  },
];

export default function CourseMaterialsPage() {
  return (
    <AdminLayout title="课程资料">
      <div className="page-header">
        <h1 className="page-title">课程资料</h1>
        <p className="page-subtitle">先把学校课程内容整理成可复用素材，再用来布置学习任务。</p>
      </div>

      <div className="workflow-strip">
        {materialLayers.map((item, index) => (
          <div key={item.title} className="workflow-step">
            <span className="workflow-index">{index + 1}</span>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">资料库框架</h3>
          <button className="add-button" disabled>
            新增资料
          </button>
        </div>
        <div className="empty-table">
          <p className="empty-table-text">课程资料功能待接入</p>
          <p style={{ marginTop: "8px", fontSize: "13px", color: "#777" }}>
            这里后续承载课程、课时、学习资料和题目归档。旧题库页面暂时保留为底层能力。
          </p>
          <Link href="/questions" className="action-button-link secondary" style={{ marginTop: "16px" }}>
            查看旧题库
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
