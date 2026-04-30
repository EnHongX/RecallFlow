const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5005";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">RecallFlow 用户端</p>
        <h1>家庭练习、背诵和复习入口</h1>
        <p className="summary">
          Phase 1 当前只搭建基础页面和服务框架，后续再接入题库、练习、错题和奖励流程。
        </p>
      </section>

      <section className="grid" aria-label="基础信息">
        <div className="panel">
          <span>用户端端口</span>
          <strong>5001</strong>
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
