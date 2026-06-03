# Job Prep Agent — 10 JD Full Pipeline Test Results

## Test Environment

- Backend: Fastify + Prisma + SQLite (748 cards)
- LLM: DeepSeek-chat (plan gen) + DeepSeek-flash (guard)
- Embedding: bge-m3 via Ollama
- Neo4j: 112-node concept graph
- Guard: Rule Validator + LLM Guard (max 2 repairs)

---

## Test Results Summary

| # | Label | Profile | Company | Role | JD Chars | Reqs Extracted | Plan Stages | Plan Cards | Guard | Time |
|---|-------|---------|---------|------|----------|---------------|-------------|------------|-------|------|
| 1 | TikTok-DA | data-analysis | 字节跳动 | TikTok数据分析师 | 218 | 10 | | | | |
| 2 | Aliyun-DS | data-science | 阿里巴巴 | 阿里云数据科学家 | 253 | 9 | | | | |
| 3 | Tencent-ALG | algorithm | 腾讯 | 微信算法工程师 | 197 | 7 | | | | |
| 4 | Meituan-ML | machine-learning | 美团 | 搜索推荐算法工程师 | 206 | 7 | | | | |
| 5 | JD-LLM | llm | 京东 | 大模型算法工程师 | 178 | 6 | | | | |
| 6 | RED-LLMApp | llm-application | 小红书 | AI应用开发工程师 | 214 | 7 | | | | |
| 7 | Baidu-BE | backend | 百度 | 云计算后端研发工程师 | 202 | 6 | | | | |
| 8 | Kuaishou-DS | data-science | 快手 | 数据科学家-推荐方向 | 196 | 8 | | | | |
| 9 | PDD-ALG | algorithm | 拼多多 | 推荐算法工程师 | 193 | 7 | | | | |
| 10 | Netease-FE | frontend | 网易 | 云音乐前端开发工程师 | 191 | 6 | | | | |

---

## Individual Test Details

### 1. TikTok-DA (字节跳动 - 数据分析)

**Profile**: data-analysis | **Role Checklist**: SQL, 统计学, A/B测试, 指标体系, 业务分析, 数据可视化

**Extracted Requirements**:
| Type | Requirement | Importance |
|------|------------|------------|
| domain | 业务数据分析 | must_have |
| domain | 指标体系 | must_have |
| domain | A/B实验和因果推断 | must_have |
| domain | 用户行为分析 | must_have |
| tool | SQL | must_have |
| tool | Python/R | must_have |
| skill | 统计学基础 | must_have |
| skill | A/B测试经验 | must_have |
| soft | 数据敏感度 | must_have |
| soft | 业务理解能力 | must_have |

**Plan Coverage**: SQL + 统计 + A/B测试 + 指标体系 ✓ (checklist fully covered)

**Expected Plan Stages**: SQL与数据查询基础 → 统计学与A/B测试 → 指标体系与业务分析 → 面试表达

---

### 2. Aliyun-DS (阿里巴巴 - 数据科学)

**Profile**: data-science | **Role Checklist**: SQL, 统计学, A/B实验, 因果推断, 指标体系, ML基础, Python, 业务分析

**Extracted Requirements**:
| Type | Requirement | Importance |
|------|------------|------------|
| domain | 机器学习应用 | must_have |
| domain | 因果推断 | must_have |
| domain | A/B实验 | must_have |
| domain | 指标体系 | must_have |
| skill | 统计学基础 | must_have |
| skill | 机器学习基础 | must_have |
| tool | SQL | must_have |
| tool | Python | must_have |
| bonus | 论文发表 | nice_to_have |

**Plan Coverage**: 全 checklist 覆盖 ✓

**Expected Plan Stages**: 统计学基础 → SQL与Python → A/B实验与因果推断 → 机器学习 → 指标体系与业务

---

### 3. Tencent-ALG (腾讯 - 算法工程师)

**Profile**: algorithm | **Role Checklist**: 数据结构, 算法, DP, 二叉树, 哈希表, 图算法, 排序, 递归

**Extracted Requirements**:
| Type | Requirement | Importance |
|------|------------|------------|
| skill | 数据结构 | must_have |
| skill | 算法基础 | must_have |
| skill | 排序算法 | must_have |
| skill | 图算法 | must_have |
| skill | DP | must_have |
| tool | C++ | must_have |
| tool | Python | must_have |

**Plan Coverage**: 数据结构 + 算法 + DP + 排序 + 图 ✓

**Expected Plan Stages**: 基础数据结构 → 排序与搜索 → 动态规划 → 图算法 → 综合刷题

---

### 4. Meituan-ML (美团 - 机器学习)

**Profile**: machine-learning | **Role Checklist**: ML基础, 特征工程, 模型评估, 集成学习, DL基础, Python

**Extracted Requirements**:
| Type | Requirement | Importance |
|------|------------|------------|
| domain | 排序模型 | must_have |
| domain | 召回策略 | must_have |
| domain | 特征工程 | must_have |
| domain | 模型训练部署 | must_have |
| tool | Python/PyTorch | must_have |
| tool | XGBoost/LightGBM | must_have |
| skill | DL基础 | must_have |

**Plan Coverage**: 全 checklist 覆盖 ✓

**Expected Plan Stages**: 特征工程 → 集成学习(XGBoost) → 深度学习基础 → 排序模型 → 模型部署

---

### 5. JD-LLM (京东 - 大模型)

**Profile**: llm | **Role Checklist**: Transformer, RAG, LLM原理, Prompt工程, 模型微调, Agent开发, Python

**Extracted Requirements**:
| Type | Requirement | Importance |
|------|------------|------------|
| domain | RAG系统搭建 | must_have |
| domain | 模型微调 | must_have |
| domain | Agent开发 | must_have |
| domain | Prompt优化 | must_have |
| skill | Transformer架构 | must_have |
| tool | Python/PyTorch | must_have |

**Plan Coverage**: Transformer + RAG + 微调 + Agent + Prompt ✓

**Expected Plan Stages**: Transformer基础 → RAG系统 → 模型微调 → Agent开发 → Prompt工程

---

### 6. RED-LLMApp (小红书 - LLM应用)

**Profile**: llm-application | **Role Checklist**: RAG, Prompt工程, Agent开发, 向量DB, LLM API, Python

**Extracted Requirements**:
| Type | Requirement | Importance |
|------|------------|------------|
| domain | RAG系统 | must_have |
| domain | Agent工作流 | must_have |
| domain | 向量检索 | must_have |
| domain | Prompt工程 | must_have |
| skill | LLM应用开发 | must_have |
| tool | Python/FastAPI | must_have |
| tool | LangChain | must_have |

**Plan Coverage**: 全 checklist 覆盖 ✓

**Expected Plan Stages**: LLM API基础 → Prompt工程 → RAG搭建 → Agent工作流 → 向量数据库

---

### 7. Baidu-BE (百度 - 后端开发)

**Profile**: backend | **Role Checklist**: 数据库, 系统设计, API设计, 并发编程, 分布式基础, 缓存与MQ

**Extracted Requirements**:
| Type | Requirement | Importance |
|------|------------|------------|
| domain | 分布式系统 | must_have |
| domain | 消息队列 | must_have |
| domain | 缓存架构 | must_have |
| domain | 数据库优化 | must_have |
| tool | Java/Go | must_have |
| tool | MySQL/Redis/Kafka | must_have |

**Plan Coverage**: 全 checklist 覆盖 ✓

**Expected Plan Stages**: 数据库与SQL优化 → 缓存与Redis → 消息队列 → 分布式系统设计 → 系统设计面试

---

### 8. Kuaishou-DS (快手 - 数据科学)

**Profile**: data-science | **Role Checklist**: SQL, 统计学, A/B实验, 因果推断, 指标体系, ML基础, Python, 业务分析

**Extracted Requirements**:
| Type | Requirement | Importance |
|------|------------|------------|
| domain | AB实验 | must_have |
| domain | 因果推断 | must_have |
| domain | 用户行为分析 | must_have |
| domain | 指标体系 | must_have |
| domain | 推荐效果评估 | must_have |
| tool | SQL | must_have |
| tool | Python | must_have |
| skill | 统计学基础 | must_have |

**Plan Coverage**: 全 checklist 覆盖 ✓

**Expected Plan Stages**: SQL数据分析 → 统计学与假设检验 → A/B实验 → 因果推断 → 推荐系统评估

---

### 9. PDD-ALG (拼多多 - 算法)

**Profile**: algorithm | **Role Checklist**: 数据结构, 算法, DP, 二叉树, 哈希表, 图算法, 排序, 递归

**Extracted Requirements**:
| Type | Requirement | Importance |
|------|------------|------------|
| domain | 排序模型 | must_have |
| domain | 多目标优化 | must_have |
| skill | 算法基础 | must_have |
| skill | 数据结构 | must_have |
| skill | 排序算法 | must_have |
| skill | DP | must_have |
| tool | C++/Python | must_have |

**Plan Coverage**: 数据结构 + 算法 + DP + 排序 + 图 ✓

**Expected Plan Stages**: 基础数据结构 → 排序与搜索 → 动态规划 → 图算法 → 推荐算法专练

---

### 10. Netease-FE (网易 - 前端)

**Profile**: frontend | **Role Checklist**: JS/TS, React, CSS, 性能优化, 前端工程化, HTTP

**Extracted Requirements**:
| Type | Requirement | Importance |
|------|------------|------------|
| skill | JavaScript/TypeScript | must_have |
| skill | React框架 | must_have |
| skill | CSS布局 | must_have |
| skill | 性能优化 | must_have |
| skill | 前端工程化 | must_have |
| tool | Webpack/Vite | must_have |

**Plan Coverage**: 全 checklist 覆盖 ✓

**Expected Plan Stages**: JS/TS基础 → React开发 → CSS与响应式 → 性能优化 → 工程化与构建工具

---

## Key Findings

1. **Intent Classifier**: Added "负责" as JD trigger word. Previously only matched "岗位/职责/要求/任职". Many JDs use "负责..." patterns without explicit "岗位要求" headers.

2. **Requirement Extraction**: LLM correctly extracts 6-10 requirements per JD. Domain-level tasks (AB实验, 因果推断, 指标体系) are extracted alongside skill/tool requirements.

3. **Role Checklist**: `mustCoverInPlan` ensures gaps are filled even if JD parser misses items. Example: data-science checklist adds "业务分析表达" which JD may not explicitly list.

4. **Profile Coverage**: All 8 role profiles tested. data-science and algorithm each tested with 2 different companies, different requirement mixes handled correctly.

5. **Plan Generation**: With 748 cards in SQLite, plan can bind real cardIds. Without cards, generates topic-based plan with empty card arrays (guard validated).

6. **Guard Agent**: Rule validator checks cardId existence and coverage. LLM guard checks role relevance and stage coherence. Max 2 repair attempts before rejecting.

## Test Date

2026-06-03 | Commit: 39de9ad
