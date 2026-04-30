# RecallFlow 开发指南

> 用途：记录本地开发、常用命令、协作流程和任务勾选规则。

## 文档分工

- `README.md`：产品共识、范围边界、技术路线。
- `docs/phase-plan.md`：开发计划和任务勾选。
- `docs/engineering-decisions.md`：工程约束和实现决策。
- `docs/development-guide.md`：本地开发和协作流程。

## 本地开发目标

Phase 1 需要能在本地启动：

- 用户端：`apps/web`
- 后台端：`apps/admin`
- 后端 API：`apps/api`
- 数据库：`PostgreSQL`

## 目录约定

```text
apps/
  web/
  admin/
  api/
docs/
docker-compose.yml
README.md
```

## 环境变量

项目初始化后需要维护：

- `.env.example`
- 用户端环境变量
- 后台端环境变量
- API 环境变量

敏感值不要提交到仓库。

## 常用命令

以下命令默认在仓库根目录执行。

### 安装依赖

```bash
pnpm install
.venv/bin/pip install -r apps/api/requirements.txt
```

### 启动数据库

```bash
docker compose up -d postgres
```

### 启动后端

```bash
pnpm dev:api
```

### 启动用户端

```bash
pnpm dev:web
```

### 启动后台端

```bash
pnpm dev:admin
```

### 数据库迁移

```bash
cd apps/api
../../.venv/bin/alembic upgrade head
../../.venv/bin/alembic revision --autogenerate -m "describe change"
```

### 后端测试

```bash
cd apps/api
../../.venv/bin/pytest
```

### 前端检查

```bash
pnpm lint
pnpm typecheck
```

### API 健康检查

```bash
curl http://localhost:5005/api/v1/health
curl http://localhost:5005/api/v1/db/health
```

### 停止本地数据库

```bash
docker compose down
```

## 协作流程

1. 开发前先看 `README.md` 确认产品边界。
2. 再看 `docs/engineering-decisions.md` 确认工程约束。
3. 从 `docs/phase-plan.md` 选择一小组任务。
4. 实现完成后运行对应检查。
5. 将完成项从 `- [ ]` 改成 `- [x]`。
6. 如果发现新需求，先放入合适 Phase，不直接塞进当前任务。

## 勾选规则

- 只有功能可运行、检查通过，才勾选。
- 文档任务完成后也要勾选。
- 发现任务拆太大时，先拆小，不直接勾选大项。
- Phase 2 项不要提前混入 Phase 1。

## Phase 2 提醒规则

进入 Phase 2 前必须重新确认：

- JSON 导入标准结构
- 短信验证码
- 找回密码
- 打印
- 导出
- AI 一键导入
- 移动端适配

## 当前注意事项

- Phase 1 已经偏大，不继续扩范围。
- 后台是独立管理端，不和孩子端共用前端。
- 手机号 + 密码登录首轮不接短信验证码。
- JSON 导入整体放到 Phase 2，标准结构后续确认。
- E2E 测试后续补，Phase 1 保留后端 `pytest` 和前端 `lint/typecheck`。
