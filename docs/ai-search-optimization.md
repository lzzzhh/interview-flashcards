# AI 搜索优化文档

> 面经闪卡项目 — 后端搜索管线迭代记录
> 最后更新：2026-05-22

---

## 一、架构总览

```
用户 Query
    │
    ▼
┌─────────────────────────────────────┐
│ 1. Query Expansion (规则词典)         │  query-expander.ts
│    160+ 条映射规则 + keyword→deckId   │
│    "训练集好测试集差" → 过拟合/泛化/正则化  │
└─────────────────────────────────────┘
    │ expandedTerms
    ▼
┌─────────────────────────────────────┐
│ 2. 中文 Bigram 分词                   │  bigram.ts
│    "过拟合" → ["过拟","拟合"]          │
│    不拆单字，保留英文缩写                │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 3. 多路召回 (并行)                    │  hybrid-search.ts
│   ├─ FTS5 全文索引                    │  fts5-search.ts
│   ├─ LIKE 中文模糊                    │
│   ├─ tag 标签召回                     │
│   ├─ searchKeywords 语义关键词         │
│   └─ bge-m3 向量语义召回              │  Ollama localhost:11434
│                                      │
│   召回池大小：candidateLimit (默认300)  │
└─────────────────────────────────────┘
    │ 候选池 union + dedup
    ▼
┌─────────────────────────────────────┐
│ 4. Reranker 精排                     │  reranker.ts
│   finalScore =                       │
│     W_V(0.40) × vectorScore         │
│   + W_K(0.15) × keywordScore        │
│   + W_F(0.35) × fieldBoost          │
│   + W_L(0.10) × learningBoost       │
│   + deckBoost (牌组匹配 +0.20)        │
│   + tag 噪音过滤（泛标签降权）          │
└─────────────────────────────────────┘
    │ 全量结果（按 finalScore 降序）
    ▼
┌─────────────────────────────────────┐
│ 5. 阈值 + 上限过滤                    │
│   score >= minScore (默认 0.30)       │
│   → 最多 maxResults 条 (默认 50)     │
└─────────────────────────────────────┘
    │
    ▼
   前端展示（条数随查询质量自然变化）
```

**关键语义变更（v6）**：从「固定返回 topK 条」改为「返回所有 score ≥ minScore 的结果，最多 maxResults 条」。召回池大小由 `candidateLimit`（默认 300）独立控制，不再与返回数量耦合。

---

## 二、关键技术

| 技术 | 作用 | 细节 |
|------|------|------|
| **bge-m3 语义向量** | 捕捉自然语言语义相似度 | 1024 维向量，Ollama 本地部署，~50ms/次 |
| **FTS5 全文索引** | 英文/缩写词精确匹配 | SQLite FTS5，含 title + question + answer + searchKeywords |
| **LIKE 中文模糊** | 中文 bigram 子串匹配 | 逐级截断查询词生成 LIKE 子句，不依赖分词器 |
| **Query Expansion** | 口语→标准术语句子→关键词 | 160+ 条规则词典，含 keyword→deckId 推断（70+ 映射） |
| **字段权重精排** | 差异化字段重要性 | title(1.0) > keyword(0.8) > question(0.6) > answer(0.2) |
| **Tag 噪音过滤** | 抑制泛标签干扰 | "机器学习""深度学习""算法"等 20+ 泛标签命中降权 |
| **DeckBoost 牌组匹配** | 跨牌组搜索精准度 | 通过查询关键词推断目标牌组，匹配结果加分 |

---

## 三、评测体系

### 3.1 用例分布（120 条）

| 类别 | 数量 | 占比 | 说明 |
|------|------|------|------|
| 中文关键词 | 30 | 25% | 直接关键词匹配（贝叶斯定理、反转链表） |
| 中文概念/同义表达 | 25 | 21% | 语义等价的自然语言（训练集好测试集差→过拟合） |
| 中英混合技术词 | 25 | 21% | 中英混用（"XGBoost 和 LightGBM 对比"） |
| 中文复杂面试问题 | 15 | 13% | 长句自然语言（"面试官问我怎么评估..."） |
| 纯英文语义查询 | 5 | 4% | 纯英文（"gradient descent optimization"） |
| 学习路径推荐 | 5 | 4% | 学习意图查询（"想入门深度学习"） |
| 长句自然语言 | 15 | 13% | 超长口语化查询 |

### 3.2 评测指标

**TopK 指标（传统）**

| 指标 | 含义 |
|------|------|
| Top15/50/100 Hit Rate | primaryId 在 Top-K 内的用例占比 |
| P@5 | Precision@5：Top5 中相关卡片比例 |
| MRR | Mean Reciprocal Rank：首个 primary 排名的倒数均值 |
| Deck% | Top15 中来自 acceptableDecks 的结果占比 |
| Missing | Top100 内完全找不到的 primaryId 数量 |
| Buried | 在 Top100 内但不在 Top15 内的 primaryId 数量 |

**阈值指标（v6 新增）**

| 指标 | 含义 |
|------|------|
| Precision@threshold | 返回结果中 grade≥1 的比例 |
| Recall(S)@threshold | grade≥2 的期望卡片被找到的比例 |
| Recall(A)@threshold | grade≥1 的期望卡片被找到的比例 |
| Empty Rate | 返回 0 条结果的 query 比例 |
| Low Rate | 返回 < 3 条结果的 query 比例 |
| Result Count (avg/p50/p90/p95/max) | 返回数量分布 |

### 3.3 运行方式

```bash
cd backend && npm run evaluate
```

退出码：有 Missing 则退出 1（适合 CI 门禁）。评测会先跑一轮传统 TopK 指标，再对 minScore ∈ {0.20, 0.25, 0.30, 0.35, 0.40} 跑五档阈值评测。

---

## 四、迭代记录

### v1–v5：传统 TopK 搜索（历史基线）

> 以下 v1–v5 均为 TopK 固定 15 条语义下的迭代，基于 100 条用例。当前语义已改为阈值+上限，v5 结果作为历史基线保留。

| 版本 | 策略 | Top15 | Missing | Buried | MRR |
|------|------|-------|---------|--------|-----|
| v1 | FTS5+LIKE 基线 | 64.0% | 23 | 18 | 0.356 |
| v2 | +bge-m3 向量召回 | 86.0% | 7 | 12 | 0.594 |
| v3 | +deckBoost + QE | 85.0% | 7 | 11 | 0.619 |
| v4 | +bigram + QE扩充 + 候选池放大 | 89.0% | 0 | 12 | 0.626 |
| v5 | +权重网格搜索 + tag噪音过滤 | 91.0% | 0 | 10 | 0.639 |

v5 最优配置（100 条用例）：
- W_V=0.40, W_K=0.15, W_F=0.35, W_L=0.10, deckBoost=0.20
- FTS5 召回 ×5, tag/searchKeywords ×15, 向量 ×8

### v6：阈值搜索（当前）

**策略**：
1. 取消固定 topK，改为 `minScore` 质量阈值 + `maxResults` 安全上限
2. 召回池大小由 `candidateLimit`（默认 300）独立控制，不再与返回数量耦合
3. 前端扩展至 120 条评测用例
4. 新增阈值评测：Precision/Recall/Empty Rate/数量分布

**默认参数**：
| 参数 | 默认值 | 说明 |
|------|--------|------|
| minScore | 0.30 | 质量阈值，低于此分数不返回 |
| maxResults | 50 | 安全上限 |
| candidateLimit | 300 | 内部召回候选池大小 |

**传统指标（120 条用例，candidateLimit=500）**：
```
Top15: 90.0%   Top50: ~98%   Top100: 99.2%
Missing: 0     Buried: 14    MRR: 0.603
P@5: 0.252     Deck%: ~74%   耗时: ~156ms
```

**阈值评测（120 条用例，candidateLimit=500, maxResults=100 评测口径）**：
> 评测时 maxResults=100 以观察上界；线上普通搜索 maxResults=50。

| 阈值 | Exp-Hit% | Recall(S) | Recall(A) | Empty% | avg | p50 |
|------|----------|-----------|-----------|--------|-----|-----|
| 0.20 | 2.4% | 96.9% | 96.9% | 0.0% | 88.5 | 100 |
| 0.25 | 2.9% | 95.0% | 95.0% | 0.0% | 71.5 | 100 |
| **0.30** | **3.0%** | **90.0%** | **90.0%** | **3.3%** | **64.3** | **89** |
| 0.35 | 3.3% | 86.2% | 86.2% | 8.3% | 55.7 | 54 |
| 0.40 | 4.1% | 80.8% | 80.8% | 10.8% | 42.2 | 36 |

**结论**：`minScore=0.30` 是当前默认阈值的合理选择。
- 相比 0.20/0.25：结果量从 avg 88→64，减少噪音
- 相比 0.35/0.40：Recall 仅降 4pp，但 Empty 从 8.3% 降到 3.3%
- Exp-Hit%（原 Precision）仅用于跨阈值相对比较，不代表完整人工相关性（期望列表仅标注 1-3 张/query）

---

## 五、前端集成

### 5.1 搜索参数

| 场景 | minScore | maxResults | candidateLimit |
|------|----------|------------|----------------|
| 普通搜索 | 0.30 | 50 | 300 |
| 扩大搜索 | 0.20 | 50 | 300 |
| 学习清单 | 0.30（目标牌组 0.20） | 100 | 500 |

### 5.2 扩大搜索兜底

当普通搜索结果 < 3 条时，前端显示「扩大搜索范围」按钮，点击后以 `minScore=0.20` 重新搜索。

### 5.3 冷启动预热

Agent 中心页面打开时自动检测 bge-m3 可用性：
- 已安装 → 直接激活 AI 搜索，进入搜索页时预热模型
- 未安装 → 弹出下载弹窗（bge-m3 约 1.2GB），带进度条
- Ollama 未启动 → 提示先运行 `ollama serve`

### 5.4 向量数据库

`ai_search_vec` 表支持多模块（module），当前仅"AI 智能搜索"模块：
- 715 行向量，1024 维 bge-m3 embedding
- 字段：cardId, module, field(title/keyword/question/answer), embedding(BLOB)
- 后端端点：`GET /api/maintenance/vector-modules`, `/api/maintenance/vector-list`

---

## 六、学习清单功能

### 意图识别（前端）
查询匹配学习意图正则表达式时，搜索结果顶部显示「AI 为你推荐学习清单」卡片。

### 后端推荐（/api/search/learning-plan）
- 不限返回数，评分过滤（score ≥ 0.3 或目标牌组 ≥ 0.2）
- 最多 100 张，按学习优先级排序（新卡 > 到期 > 即将到期 > 已掌握）
- 复用 hybrid-search 管线（QE → bigram → 多路召回 → reranker）

### 本地持久化
- 存储 key：`fc-learning-plans`（localStorage）
- 仅存 `{cardId, deckId}`（~52 bytes/item），避免 QuotaExceededError
- 查看时通过 AppContext cardsById 实时查询卡片详情

---

## 七、环境依赖

| 组件 | 命令 | 端口 |
|------|------|------|
| Ollama | `ollama serve` | 11434 |
| 后端 | `cd backend && npm run dev` | 3001 |
| 前端 | `npm run dev` | 3000 |
| 桌面 App | `npm run build:desktop` → `/Applications/面经闪卡.app` | — |

### .env 配置

```
EMBEDDING_BASE_URL=http://localhost:11434
EMBEDDING_API_KEY=ollama
EMBEDDING_MODEL=bge-m3
LLM_BASE_URL=https://api.deepseek.com
LLM_API_KEY=sk-xxx
LLM_MODEL=deepseek-chat
```

### 常用命令

```bash
# 生成向量（全量 715 张）
cd backend && npx tsx src/evaluation/generate-embeddings.ts

# 运行评测（120 条用例，含传统+阈值五档）
cd backend && npm run evaluate

# 90 天学习模拟（验证首页/统计/推荐数据）
cd . && npx tsx backend/src/evaluation/90day-sim.ts
```
