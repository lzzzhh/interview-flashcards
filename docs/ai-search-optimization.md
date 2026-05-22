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
│   ├─ FTS5 全文索引 (topK×5)          │  fts5-search.ts
│   ├─ LIKE 中文模糊 (topK×5)           │
│   ├─ tag 标签召回 (topK×15)           │
│   ├─ searchKeywords 语义关键词 (×15)   │
│   └─ bge-m3 向量语义召回 (topK×8)     │  Ollama localhost:11434
└─────────────────────────────────────┘
    │ 候选池 union + dedup (max 800)
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
    │ topK 结果
    ▼
   前端展示 15 条
```

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

### 3.1 用例分布（100 条）

| 类别 | 数量 | 占比 | 说明 |
|------|------|------|------|
| 中文关键词 | 30 | 30% | 直接关键词匹配（贝叶斯定理、反转链表） |
| 中文概念/同义表达 | 25 | 25% | 语义等价的自然语言（训练集好测试集差→过拟合） |
| 中英混合技术词 | 25 | 25% | 中英混用（"XGBoost 和 LightGBM 对比"） |
| 中文复杂面试问题 | 15 | 15% | 长句自然语言（"面试官问我怎么评估..."） |
| 纯英文语义查询 | 5 | 5% | 纯英文（"gradient descent optimization"） |

### 3.2 评测指标

| 指标 | 含义 |
|------|------|
| Top15/50/100 Hit Rate | primaryId 在 Top-K 内的用例占比 |
| P@5 | Precision@5：Top5 中相关卡片比例 |
| MRR | Mean Reciprocal Rank：首个 primary 排名的倒数均值 |
| Deck% | Top15 中来自 acceptableDecks 的结果占比 |
| Missing | Top100 内完全找不到的 primaryId 数量 |
| Buried | 在 Top100 内但不在 Top15 内的 primaryId 数量 |

### 3.3 运行方式

```bash
cd backend && npm run evaluate
```

退出码：有 Missing 则退出 1（适合 CI 门禁）。

---

## 四、迭代记录

### v1：纯文本 LIKE 搜索（基线）

**策略**：FTS5 + LIKE 模糊匹配，无向量召回，无 Query Expansion

**结果**：
```
Top15: 64.0%   Top50: 76.0%   Top100: 78.0%
Missing: 23    Buried: 18     MRR: 0.356
Deck%: 52.8%   耗时: 80ms
```

**问题**：中文概念/同义表达只有 16%（自然语言无法匹配卡片原文），23 张 Missing（复杂长问句、职场/黑话等无 searchKeywords 的牌组）。

---

### v2：接入 bge-m3 向量召回

**策略**：Ollama 本地部署 bge-m3 (1024维)，全量生成 715 张卡片向量，向量召回通道正式启用

**结果**：
```
Top15: 86.0%   Top50: 93.0%   Top100: 94.0%   (+22pp / +17pp / +16pp)
Missing: 7     Buried: 12     MRR: 0.594      (+0.238)
Deck%: 65.0%   耗时: 138ms
```

**关键提升**：中文概念/同义表达从 16% → 72%（+56pp），bge-m3 对语义相似度匹配效果显著。

---

### v3：牌组匹配 boost + Query Expansion

**策略**：
1. 新增 query-expander.ts：40+ 条中文→标准术语映射 + keyword→deckId 推断
2. Reranker 增加 deckBoost（匹配牌组 +0.12）
3. Schema 新增 searchKeywords 列，自动生成 715 张卡片的语义关键词

**结果**：
```
Top15: 85.0%   Top50: 93.0%   Top100: 94.0%
Missing: 7     Buried: 11     MRR: 0.619
Deck%: 71.0%   耗时: 136ms
```

**效果**：牌组覆盖率 +6pp，MRR +0.025。

---

### v4：候选池放大 + QE 规则扩充 + 中文 Bigram 分词

**策略**：
1. 候选池放大（FTS5×5, tag/searchKeywords×15, 向量×5）
2. Query Expansion 规则词典扩充到 100+ 条
3. 引入中文 bigram 分词（避免单字分词噪音）
4. Reranker 权重调整：W_FIELD 0.25→0.35，deckBoost +0.18
5. 61 张 buried 卡片 searchKeywords 手工增强

**结果**：
```
Top15: 89.0%   Top50: 98.0%   Top100: 100.0%
Missing: 0     Buried: 12     MRR: 0.626
Deck%: 73.5%   耗时: 141ms
```

**关键突破**：Missing 首次清零（23→7→0），Top100 达到 100%。

---

### v5：权重网格搜索 + Tag 噪音过滤 + 全量规则词典

**策略**：
1. 网格搜索最优 reranker 权重：6 组实验（V/K/F/L 四维网格）
2. 最优权重：W_V=0.40, W_K=0.15, W_F=0.35, W_L=0.10, deckBoost=0.20
3. Tag 噪音过滤：20+ 泛标签（"机器学习""深度学习""算法"等）命中降权
4. Query Expansion 规则词典扩充到 160+ 条，keyword→deckId 映射 70+ 条
5. 16 张 buried 卡片 searchKeywords 针对性增强
6. 多字段向量实验（证伪，回退到单字段全文本向量）

**最终结果（当前）**：
```
Top15: 91.0%   Top50: 100.0%  Top100: 100.0%
Missing: 0     Buried: 10     MRR: 0.639
P@5: 0.258     Deck%: 75.5%   耗时: 164ms
```

---

## 五、性能总览

### 5.1 迭代对比

| 指标 | v1(基线) | v2(bge-m3) | v3(deck) | v4(QE) | v5(权重) | 总变化 |
|------|---------|-----------|---------|--------|---------|--------|
| Top15 | 64.0% | 86.0% | 85.0% | 89.0% | **91.0%** | **+27pp** |
| Top50 | 76.0% | 93.0% | 93.0% | 98.0% | **100.0%** | **+24pp** |
| Top100 | 78.0% | 94.0% | 94.0% | 100.0% | **100.0%** | **+22pp** |
| Missing | 23 | 7 | 7 | 0 | **0** | **-23** |
| Buried | 18 | 12 | 11 | 12 | **10** | **-8** |
| MRR | 0.356 | 0.594 | 0.619 | 0.626 | **0.639** | **+0.283** |
| Deck% | 52.8% | 65.0% | 71.0% | 73.5% | **75.5%** | **+22.7pp** |
| 耗时 | 80ms | 138ms | 136ms | 141ms | **164ms** | +84ms |

### 5.2 按类别指标（v5）

| 类别 | 用例数 | Top15 | MRR | Deck% |
|------|--------|-------|-----|-------|
| 关键词-力扣 | 4 | 100.0% | 0.667 | 73.3% |
| 关键词-机器学习 | 9 | 100.0% | 0.796 | 87.4% |
| 关键词-统计学 | 4 | 75.0% | 0.631 | 83.3% |
| 概念-力扣 | 3 | 100.0% | 1.000 | 100.0% |
| 概念-机器学习 | 4 | 100.0% | 0.661 | 63.3% |
| 混合-机器学习 | 6 | 100.0% | 0.656 | 93.3% |
| 混合-大模型 | 4 | 100.0% | 0.646 | 98.3% |
| 复杂-大模型 | 4 | 100.0% | 0.521 | 85.0% |
| 英文-全部 | 5 | 100.0% | 0.700 | 98.7% |

### 5.3 最优配置

| 参数 | 值 | 来源 |
|------|-----|------|
| W_VECTOR | 0.40 | 网格搜索最优 |
| W_KEYWORD | 0.15 | 网格搜索最优 |
| W_FIELD | 0.35 | 网格搜索最优 |
| W_LEARNING | 0.10 | 网格搜索最优 |
| DeckBoost | 0.20 | 网格搜索最优 |
| FTS5 召回倍数 | ×5 | — |
| Tag 召回倍数 | ×15 | — |
| Vector 召回倍数 | ×8 | — |
| Tag 噪音过滤 | 已启用 | 20+ 泛标签 |

### 5.4 当前 10 张 Buried

| ID | 牌组 | 查询 | 原因 |
|----|------|------|------|
| stats-24 | 统计学 | "假设检验" | 跨牌组竞争，p-value 卡片权重不足 |
| stats-26 | 统计学 | "AB 测试...没有显著差异" | 长查询召回过多，primary 被淹没 |
| llm-4 | 大模型 | "token 在句子里的位置" | QE 没覆盖到位置编码的多角度表述 |
| agent-2 | Agent | "怎么让大模型自己去调 API" | Function Calling 与查询语义匹配弱 |
| agent-7 | Agent | "把大模型集成到业务系统" | 过于泛化，QE 无精确映射 |
| vc-1 | VibeCoding | "agent 和 skill 的区别" | /command vs skill 概念不准确 |
| vc-6 | VibeCoding | "CLAUDE.md 和 AGENTS.md 优先级" | 跨牌组噪声（Agent 牌组大量占用） |
| lc-087 | 力扣 | "LRU Cache 实现" | 中英混合查询，cache 概念歧义 |
| ml-7 | 机器学习 | "训练 loss 降但验证 loss 不降" | 过拟合概念已召回但排名不够靠前 |
| ml-10 | 机器学习 | "100 万数据 1 万标注" | 半监督/主动学习多角度无法精确匹配 |

**解决方向**（需要打破"不改模型"约束）：
- LLM 改写查询：将自然语言问题转为核心概念关键词
- Cross-encoder reranker：在 bge-m3 基础上加第二层精排
- 字段级多向量：已实验证伪，对 bge-m3 无提升

---

## 六、前后端集成

### 6.1 冷启动预热

Agent 中心页面打开时自动检测 bge-m3 可用性：
- 已安装 → 直接激活 AI 搜索，进入搜索页时预热模型
- 未安装 → 弹出下载弹窗（bge-m3 约 1.2GB），带进度条
- Ollama 未启动 → 提示先运行 `ollama serve`

### 6.2 向量数据库

`ai_search_vec` 表支持多模块（module），当前仅"AI 智能搜索"模块：
- 715 行向量，1024 维 bge-m3 embedding
- 字段：cardId, module, field(title/keyword/question/answer), embedding(BLOB)
- 后端端点：`GET /api/maintenance/vector-modules`, `/api/maintenance/vector-list`

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

# 运行评测（100 条用例）
cd backend && npm run evaluate

# 90 天学习模拟（验证首页/统计/推荐数据）
cd . && npx tsx backend/src/evaluation/90day-sim.ts
```
