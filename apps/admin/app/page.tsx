const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5005";

export default function AdminHomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">RecallFlow 后台端</p>
        <h1>家长管理台基础框架</h1>
        <p className="summary">
          Phase 1 当前只搭建后台基础页面。孩子管理、题库管理、练习记录和统计后续按计划接入。
        </p>
      </section>

      <section className="grid" aria-label="基础信息">
        <div className="panel">
          <span>后台端端口</span>
          <strong>5002</strong>
        </div>
        <div className="panel">
          <span>API 地址</span>
          <strong>{apiBaseUrl}</strong>
        </div>
        <div className="panel">
          <span>当前阶段</span>
          <strong>框架初始化</strong>
        </div>
      </section>
    </main>
  );
}
