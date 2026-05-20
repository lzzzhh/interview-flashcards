# Interview Flashcards — 未完成事项清单

> 生成日期：2026-05-19
> 基于架构文档 `docs/architecture-optimization.md` 的 Phase 规划逐一核对

## 总览

| Phase | 完成度 | 说明 |
|-------|--------|------|
| Phase 1：后端 Agent 基座 | 60% | 表和路由完整，但 Provider 未 wiring，TaskManager 缺失 |
| Phase 2：向量检索基座 | 40% | FTS5 有但缺 source_chunk_fts、sqlite-vec 未接入 |
| Phase 3：Python 文档解析 Worker | 90% | 代码完整，但运行时依赖和启动脚本缺失 |
| Phase 4：资料制卡 Agent | 50% | 后端管线完整，但前端上传页缺失、LLM 未 wiring |
| Phase 5：Hybrid RAG | 70% | 编排和重排已写好，但向量部分永远是空 |
| Phase 6：岗位备战 Agent | 60% | 状态机完整，但缺 JD 自动抓取和 analyzeJD |
| Phase 7：增强能力 | 0% | 全部未开始 |

---

## Phase 1：后端 Agent 基座改造

### ✅ 已完成
- [x] Prisma 新增表（CardDraft, SourceDocument, SourceChunk, JobPrepSession, StudyQueue, EmbeddingRecord）
- [x] 两次 migration 已生成并应用
- [x] Routes：ingest, cardDrafts, jobPrep, search, cards, decks, reviews, study, dashboard
- [x] 现有前端学习功能完全不动

### ❌ 未完成

#### 🔴 1.1 LLM Provider 未 wiring
**位置：** `backend/src/server.ts`
**问题：** `server.ts` 没有调用 `setLLMProvider()`，只定义了空壳。运行时所有 LLM 调用（制卡、JD 分析）会抛 "LLM provider not configured" 错误。
**需要做的：**
- 启动时从环境变量读取 API Base URL 和 Key
- 调用 `setLLMProvider(new OpenAIChatProvider(baseUrl, apiKey))`
- 调用 `setEmbeddingProvider(new OpenAIEmbeddingProvider(baseUrl, apiKey))`

#### 🔴 1.2 TaskManager 不存在
**位置：** `backend/src/services/` 下无此文件
**问题：** 架构文档 §6.4 和 Phase 1 要求新增 TaskManager 用于异步任务编排（长耗时制卡任务的创建/轮询/取消）。当前不阻塞但不符设计。
**需要做的：**
- 实现 TaskManager 服务类（状态机：pending → running → completed/failed）
- 关联到 ingest route 的异步制卡流程

#### 🟠 1.3 无请求校验
**位置：** 全部 route 文件
**问题：** `req.body as any` 无运行时类型校验，无 Zod/JSON Schema
**需要做的：**
- 对每个 POST/PATCH 端点加上 Zod schema
- 配合 structured logging 输出验证失败信息

#### 🟠 1.4 N+1 查询
**位置：** `dashboard.ts`、`card-drafts.ts`（approve-batch）、`decks.ts`
**问题：** 循环内逐个 await 数据库查询
**需要做的：**
- 合并为 Prisma `in` 子句的批量查询
- 或用 Prisma 原生 JOIN

#### 🟠 1.5 批量审核无事务
**位置：** `card-drafts.ts approve-batch`
**问题：** 串行循环，中途失败不回滚已成功的
**需要做的：**
- 用 Prisma `$transaction` 包装批量操作

#### 🟢 1.6 缺失 .env 模板
**需要做的：**
- 添加 `.env.example` 包含 `DATABASE_URL`, `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `EMBEDDING_MODEL` 等字段

---

## Phase 2：SQLite 向量与关键词检索基座

### ✅ 已完成
- [x] FTS5 card_fts 虚拟表 + 触发器（Card 插入/删除自动同步）
- [x] fts5Search.ts（关键词搜索 + CJK LIKE fallback）
- [x] VectorStore 接口定义
- [x] EmbeddingRecord 表定义
- [x] Hybrid search 编排层

### ❌ 未完成

#### 🔴 2.1 sqlite-vec 未接入
**位置：** `backend/src/services/vector/`
**问题：** 当前 VectorStore 是 `NoOpVectorStore`，所有向量搜索返回空。
**需要做的：**
- `npm install sqlite-vec` 验证 macOS ARM64 兼容性
- 实现 `SqliteVecVectorStore` 类（对接 vec0 虚拟表 CRUD）
- 初始化 sqlite-vec extension + 创建 vec0 虚拟表
- 在启动时调用 `setVectorStore(new SqliteVecVectorStore(prisma))`

#### 🟠 2.2 缺少 source_chunk_fts
**问题：** FTS5 只有 `card_fts`，没有 `source_chunk_fts`——文档块的关键词搜索不可用。
**需要做的：**
- 在 `initFTS5()` 中增加 `source_chunk_fts` 虚拟表和同步触发器

#### 🟠 2.3 缺少 embedding 自动同步
**问题：** 卡片写入后没有自动生成 embedding 并写入 sqlite-vec。
**需要做的：**
- 实现 Card create/update 后的 embedding 同步钩子（类似 FTS5 trigger 的机制，或者在服务层做）

#### 🟢 2.4 缺少向量索引重建/清理
**需要做的：**
- 实现 `rebuildVectorIndex()` 函数
- 实现 `cleanup()` 删除已标记 `pending_delete` 的向量

#### 🟢 2.5 无单元测试
**需要做的：**
- FTS5 搜索测试（含中文 + 英文）
- 向量搜索测试（插入 → 搜索 → 删除）

---

## Phase 3：Python 文档解析 Worker

### ✅ 已完成
- [x] FastAPI Worker 项目结构（`parser-worker/`）
- [x] PDF 解析（PyMuPDF）
- [x] DOCX 解析（python-docx）
- [x] ParsedDocument JSON schema
- [x] Node 端 Parser Gateway（5 分钟超时 + 健康检查）

### ❌ 未完成

#### 🟠 3.1 Worker 无法直接运行
**问题：** 代码已提交，但：
- Python 依赖未安装（无虚拟环境）
- 无启动脚本
- 无 Tauri 集成（启动应用时自动拉起 Worker）
**需要做的：**
- 创建 `parser-worker/venv/` 或 `requirements.txt install` 指令
- 添加启动/停止脚本
- Tauri 端整合 Worker 生命周期管理

#### 🟠 3.2 缺少 OCR
**架构文档提到但未实现：** Phase 3 不含 OCR（可选，Phase 7 补充）

---

## Phase 4：资料制卡 Agent

### ✅ 已完成
- [x] 后端 ingest route（上传→解析→chunk→入库完整管线）
- [x] chunk-text.ts（句子级分块，含中英文 token 估算 + overlap）
- [x] generate-card-drafts.ts（LLM prompt + 响应解析 + 去重 + 质量评分）
- [x] saveCardDrafts 写入草稿箱
- [x] 草稿审核后端（单条/批量 approve、reject、delete）
- [x] 草稿审核前端（DraftReviewPage）

### ❌ 未完成

#### 🔴 4.1 前端资料上传页（IngestPage）不存在
**位置：** `src/components/`
**问题：** Agent Hub 里"资料制卡"按钮（key='ingest'）点击后无对应页面，App.tsx 只路由了 search/drafts/jobprep。
**需要做的：**
- 创建 `IngestPage.tsx` 组件
  - 文件选择器（PDF/DOCX/TXT/MD）
  - 上传进度条（调用 `/api/ingest/documents`）
  - 解析结果展示 + 跳转草稿审核
- 在 App.tsx 中添加 `agentPage === 'ingest'` 路由

#### 🔴 4.2 LLM Provider 未 wiring 阻塞制卡
**关联 Phase 1.1：** `generate-card-drafts.ts` 依赖 LLM provider，需先完成 wiring 才能使用。

#### 🔴 4.3 审核后无 embedding 自动生成
**关联 Phase 2.3：** 草稿审核通过后，卡片写入表，但不会自动生成 embedding 写入向量库。

#### 🟠 4.4 chunk 失败静默跳过
**位置：** `generate-card-drafts.ts` line 55-57
**问题：** `catch` 块为空，失败的 chunk 完全静默，用户不会知道。

---

## Phase 5：Hybrid RAG + AI 搜索页

### ✅ 已完成
- [x] hybridSearch.ts 三路编排（向量 + FTS5 + 业务重排）
- [x] 业务重排逻辑（到期复习卡片加分、lapses 权重）
- [x] AI 搜索页前端（AISearchPage）

### ❌ 未完成

#### 🔴 5.1 向量搜索永远是空
**关联 Phase 2.1：** NoOpVectorStore 导致 hybridSearch 只有 keyword 分支生效。

#### 🟠 5.2 缺少 source_chunk 搜索
**关联 Phase 2.2：** 当前 hybridSearch 只搜索 Card，不搜索 SourceChunk。

#### 🟢 5.3 搜索页显示优化
**建议：** 当前搜索结果展示 cardId + title，可增加 match 高亮片段预览。

---

## Phase 6：岗位备战 Agent

### ✅ 已完成
- [x] 多轮对话状态机（awaiting_company → awaiting_role → collecting_jd → matching_cards → ready）
- [x] 会话创建/查询/列表后端
- [x] 前端对话 UI（JobPrepPage）
- [x] 基础学习计划生成（simple 公式）

### ❌ 未完成

#### 🟠 6.1 缺少 JD 自动抓取
**问题：** 架构文档说"自动抓 JD / 用户粘贴 JD"，当前只支持手动粘贴。
**需要做的：**
- 检测用户输入是否为 URL
- 用 fetch 抓取页面内容
- 过滤噪音，提取 JD 文本

#### 🟠 6.2 缺少 analyzeJD
**问题：** state 机中有 `analyzing_jd` 状态，但实际没有 LLM 驱动的 JD 分析（提取技能要求、技术栈、经验年限等）。当前直接从 `collecting_jd` 跳 `matching_cards`。
**需要做的：**
- 调用 LLM 分析 JD 文本 → 输出技能列表
- 存储到 `JobPrepSession.jobProfile`

#### 🟠 6.3 matchCards 依赖 Phase 2
**关联 Phase 2.1：** matchCards 调用 hybridSearch，向量搜索结果为空。

#### 🟢 6.4 学习计划可优化
**需要做的：**
- 现有计划基于简单公式 `totalCards / 15`
- 可以按 SM-2 状态（new/due/learning）分区生成复习队列
- 在 `createStudyQueue` 中落地

---

## Phase 7：增强能力（全部未开始）

| 能力 | 状态 | 优先级 |
|------|------|--------|
| OCR（扫描件解析） | ❌ 未开始 | P2 |
| 网页链接制卡 | ❌ 未开始 | P2 |
| 模拟面试 Agent | ❌ 未开始 | P3 |
| 错题诊断 | ❌ 未开始 | P3 |
| MCP Server | ❌ 未开始 | P3 |
| 公司/岗位备战历史 | ❌ 未开始 | P3 |

---

## 代码质量改进（跨 Phase）

| 问题 | 位置 | 严重度 |
|------|------|--------|
| 所有 route 用 `as any` 缺 Zod 校验 | 全部 route 文件 | 🟠 |
| N+1 查询（dashboard, card-drafts, decks） | backend/src/routes/ | 🟠 |
| 批量审核无事务 | card-drafts.ts approve-batch | 🟠 |
| chunk 失败静默跳过 | generate-card-drafts.ts | 🟠 |
| 无单元测试 | 整个项目 | 🟠 |
| 无运行时 LLM 配置界面 | 前端 | 🟠 |
| Agent 部署耦合在同一个进程 | server.ts | 🟢 |

---

## 推荐启动顺序

```
Phase 1 wiring
  └─ 1.1 LLM/Embedding Provider wiring（10min）
  ├─ 1.6 .env.example + 配置读取（5min）
Phase 2 向量库
  ├─ 2.1 sqlite-vec 接入（1-2h）
  ├─ 2.2 source_chunk_fts（10min）
Phase 4 资料制卡收口
  ├─ 4.1 IngestPage 前端（1h）
  ├─ 4.3 审核后 embedding 同步（与 2.1 一起做）
Phase 5/6 自然完成
  └─ 向量搜索可用后，hybridSearch 和 matchCards 自动生效
```

> 说明：标记为 ❌ 的是必须完成才能让功能可用的项，标记为 🟠 的是推荐但功能可用的改进项，标记为 🟢 的是锦上添花。
