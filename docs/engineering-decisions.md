# RecallFlow 工程决策

> 用途：记录 Phase 1 的工程约束、目录结构、技术选型、接口规范和验收标准。产品方向看 `README.md`，任务勾选看 `docs/phase-plan.md`。

## 仓库结构

Phase 1 采用单仓多应用结构：

```text
apps/
  web/      # 用户端，孩子/家庭练习使用
  admin/    # 独立家长后台
  api/      # FastAPI 后端
docs/
  phase-plan.md
  engineering-decisions.md
docker-compose.yml
README.md
```

## 技术栈

### 用户端

- `Next.js`
- `TypeScript`
- `pnpm`

### 后台端

- 独立 `Next.js`
- `TypeScript`
- `pnpm`

### 后端

- `FastAPI`
- `SQLAlchemy 2.x`
- `Alembic`
- `pytest`
- Python 虚拟环境使用 `.venv`

### 数据库

- `PostgreSQL`
- 本地开发通过 `Docker Compose` 启动

## API 规范

### 风格

- 使用 REST API。
- 首轮不做 GraphQL。
- 路径统一使用 `/api/v1/...`。

### 命名建议

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/me

GET    /api/v1/students
POST   /api/v1/students
PATCH  /api/v1/students/{student_id}
POST   /api/v1/students/{student_id}/select

GET    /api/v1/questions
POST   /api/v1/questions
PATCH  /api/v1/questions/{question_id}
POST   /api/v1/questions/{question_id}/archive

GET    /api/v1/practice/today
POST   /api/v1/practice/sessions
POST   /api/v1/practice/results
```

### 错误格式

统一返回：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "手机号格式不正确",
    "details": {}
  }
}
```

## 登录与安全

### 登录方式

- 手机号 + 密码。
- 手机号必须唯一。
- 密码最少 8 位。
- Phase 1 不做短信验证码。
- Phase 1 不做找回密码。

### 密码

- 使用 `bcrypt` 存储密码哈希。
- 不保存明文密码。

### 认证

- 后端签发 `JWT`。
- 前端通过 `HttpOnly Cookie` 保存登录态。
- Cookie 属性：
  - `HttpOnly`
  - `Secure`，本地开发可通过 `COOKIE_SECURE=false` 关闭
  - `SameSite=Lax`
- 登录态默认 7 天过期。

### CORS

- 只允许配置中的前端域名访问 API。
- 本地开发允许用户端和后台端本地地址。

### CSRF

- Phase 1 使用 `SameSite=Lax` 降低风险。
- 若后续出现跨站表单或第三方嵌入场景，再补 CSRF token。

## 多孩子数据隔离

所有核心数据查询必须校验归属关系：

- 当前登录用户只能访问自己的 `Student`。
- `student_id` 必须属于当前登录家长。
- 练习、目标、奖励、错题按孩子独立统计。
- 题目归家长题库，可选绑定孩子。
- 卡片和练习记录归孩子。

实现要求：

- 后端不能只信任前端传入的 `student_id`。
- 涉及孩子数据的接口必须做 `user_id + student_id` 校验。
- 多孩子切换不能读到上一个孩子的数据。

## 数据库与迁移

### 迁移

- 使用 `Alembic` 管理 schema。
- 所有表结构变更必须生成迁移。
- 不直接手改生产数据库。

### 时间

- 数据库存储统一使用 UTC。
- 前端展示时再按用户本地时区格式化。

### 初始化数据

Phase 1 需要基础种子数据：

- 学科：语文、数学、英语
- 题型枚举：
  - `chinese_word`
  - `pinyin`
  - `word_group`
  - `recitation`
  - `math_arithmetic`
  - `english_word`
  - `english_oral`
- 默认每日目标：
  - 题数：`20`
  - 时长：`15` 分钟
- 默认奖励类型：
  - 小奖牌
  - 贴纸
  - 小星星
  - 积分

## 环境变量

建议至少包含：

```text
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_DAYS=7
COOKIE_SECURE=false
CORS_ORIGINS=
WEB_ORIGIN=
ADMIN_ORIGIN=
```

本地开发可以使用 `.env.example` 记录示例值。

## Docker

Phase 1 至少包含：

- `postgres`

建议端口：

- 用户端：`3000`
- 后台端：`3001`
- API：`8000`
- PostgreSQL：容器内 `5432`，宿主机 `55432`

## JSON 导入

JSON 导入放到 Phase 2。

Phase 2 开始前需要确认：

- JSON 标准结构。
- 导入预览方式。
- 错误行提示格式。
- 成功数量和失败数量展示方式。
- 失败题目不影响成功题目导入的处理方式。
- 导入批次记录字段。

## 文件上传

Phase 1 暂不做文件上传体系。

暂不做：

- JSON 文件上传
- 图片上传
- 音频上传
- 作业拍照识别
- 大文件管理

## UI 原则

- PC 优先。
- 清爽、稳定、易读。
- 儿童友好，但不过度游戏化。
- 不做复杂动画。
- 不做游戏化首页。
- 后台偏管理效率，用户端偏练习体验。

组件库：

- Phase 1 可以使用 `shadcn/ui`。
- 如果初始化时成本过高，可以先用基础组件实现。

## 后台范围

后台是独立管理端，不和孩子端共用同一个前端应用。

Phase 1 后台只面向家长，不做平台管理员后台。

后台包括：

- 孩子管理
- 题库管理
- 练习记录查看
- 错题查看
- 奖励记录查看
- 基础统计查看

暂不做：

- 平台用户管理
- 内容审核
- 付费管理
- 复杂角色权限

## 日志

Phase 1 最小日志策略：

- 后端记录关键错误日志。
- 登录失败、导入失败、练习提交失败需要有可排查日志。
- 不记录明文密码。
- 不记录敏感 Cookie 或完整 JWT。

## 暂不做

Phase 1 明确不做：

- 短信验证码
- 找回密码
- AI 自动出题
- AI 一键导入
- JSON 导入
- 打印
- 导出
- 移动端适配
- 离线可用
- 复杂权限
- 付费系统
- 积分商城
- 平台运营后台
- 文件上传体系
- E2E 测试

## 测试策略

### 后端

使用 `pytest`。

Phase 1 至少覆盖：

- 登录
- 多孩子归属校验
- 题库 CRUD
- 卡片生成
- 简单复习调度
- 练习结果提交
- 错题本
- 奖励发放

### 前端

Phase 1 至少保留：

- `lint`
- `typecheck`

E2E 测试后续补充。

## Phase 1 完成标准

### 项目初始化完成

- 用户端能启动。
- 后台端能启动。
- API 能启动。
- PostgreSQL 能通过 Docker Compose 启动。
- Alembic 能执行迁移。

### 登录完成

- 家长能用手机号 + 密码注册。
- 家长能登录。
- 登录态通过 HttpOnly Cookie 保持。
- 家长能退出登录。

### 多孩子完成

- 家长能新增孩子。
- 家长能编辑孩子。
- 家长能切换孩子。
- 第一个孩子能自动成为当前孩子。
- 后端能阻止访问其他家长的孩子数据。

### 题库完成

- 家长能新建题目。
- 家长能编辑题目。
- 家长能停用或归档题目。
- 家长能筛选题目。

### 练习完成

- 指定孩子能开始今日练习。
- 能提交练习结果。
- 错题能进入错题本。
- 数学单步口算能自动判分。
- 语文、拼音、组词、背诵能手动判定。

### 背诵完成

- 能展示提示。
- 能隐藏和查看参考内容。
- 家长能手动评分。
- 系统能记录背诵结果。

### 奖励完成

- 完成题数目标能发小奖牌。
- 完成时长目标能发贴纸。
- 连续答对 5 题能发小星星。
- 错题再练掌握能发积分。
- 奖励按孩子独立记录。

### 后台完成

- 家长能在后台管理孩子。
- 家长能在后台管理题库。
- 家长能查看导入记录。
- 家长能查看练习记录。
- 家长能查看错题和奖励记录。

### 质量完成

- 后端核心测试通过。
- 前端 `lint` 通过。
- 前端 `typecheck` 通过.
