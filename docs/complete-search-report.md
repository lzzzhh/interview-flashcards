# AI Search — Complete Performance Report

**Date**: 2026-05-28
**Commit**: `ad05235`
**System**: Graph-enhanced lexical search (非 RAG，非向量搜索)

---

## 1. 搜索架构 & 模块职责

| 模块 | 职责 | 关键技术 |
|------|------|----------|
| **Query Understanding** | 意图识别 + 槽位抽取 | Regex-first（6 种产品意图），Graph canonicalTopic 解析，LLM fallback |
| **Knowledge Graph** | 概念知识层 | 105 节点，prerequisite/child/related/contrast 边，searchAliases |
| **FTS5 / likeSearch** | 主召回通道 | SQL LIKE + bigram 分词，match-count 排序 |
| **Tag Recall** | 标签匹配召回 | Card.tags 字段 |
| **searchKeywords Recall** | 关键词匹配召回 | Card.searchKeywords 字段 |
| **Reranker** | 多因素重排序 | wKeyword=0.60, wField=0.20, wVector=0.10, wLearning=0.10 |
| **Learning-path Pipeline** | 阶段化学习计划 | Graph edges → 4-stage plan，per-concept card retrieval |
| **Vector (deferred)** | 语义召回 | bge-m3 dim=1024，Ollama 就绪，card embeddings 未同步 |

## 2. 评测集（3 套）

| 评测集 | 条数 | 测试目标 |
|--------|------|----------|
| **Product-fit** | 193 (core+common, 5 excluded) | 产品级 topic/intent/coverage |
| **Release-gate** | 443 | 固定 cardId Top15 命中率 |
| **Learning-path** | 36 | 阶段化学习计划覆盖 |

## 3. 各模块性能

### 3.1 Product-fit

**Core: 94.6% | Product-fit: 91.2% | Weighted: 92.1%**

按 query realism 分级：

| 级别 | 数量 | Pass |
|------|------|------|
| Core | 167 | **94.6%** |
| Common | 26 | 69.2% |
| Edge | 2 | 100% |
| Excluded | 5 | — |

剩余失败分类：

| 类型 | 数量 |
|------|------|
| topic (composite/compare) | 8 |
| intent (boundary) | 5 |
| mustInclude (foundation) | 3 |
| precision | 1 |

### 3.2 Release-gate（Top15=76.5%）

按 query 类型 Top15：

| 组 | Top15 | Top5 | Missing |
|----|-------|------|---------|
| 关键词-力扣 | **100%** | 95% | 0 ✅ |
| 关键词-机器学习 | **97%** | 80% | 1 |
| 关键词-VibeCoding | 100% | 67% | 0 |
| 混合-机器学习 | 100% | 81% | 0 |
| 关键词-深度学习 | 80% | 80% | 3 |
| 关键词-大模型 | 86% | 71% | 2 |
| 回归-对抗 | 73% | 50% | 7 |
| 长句-大模型 | 75% | 56% | 4 |
| learning-path | 47% | 36% | 19 |
| 跨模块-大模型 | 60% | 30% | 4 |

### 3.3 Learning-path Pipeline（91.7%）

| 指标 | 值 |
|------|------|
| Pass rate | **91.7%** (33/36) |
| avg stages | **2.6** |
| avg cards | **8.7** |
| stage coverage | **86%** |
| foundation coverage | **86%** |

阶段分布：

| 阶段 | 来源边 | 典型卡片数 |
|------|--------|-----------|
| 基础入门 | prerequisite + foundation | 3-8 |
| 核心概念 | topic + child | 3-14 |
| 对比理解 | related + contrast | 3-8 |
| 面试/练习 | topic-wide search | 2-5 |

3 条 out-of-scope（AI产品经理/SnapAR/解释性文章）

### 3.4 Recall 通道性能

| 通道 | 状态 | 平均召回 | 说明 |
|------|------|---------|------|
| FTS5/LIKE | ✅ Primary | 100-200 | match-count 排序 |
| Tag | ✅ Active | 20-50 | Card.tags 匹配 |
| searchKeywords | ✅ Active | 30-70 | Card.searchKeywords 匹配 |
| Vector | ⏸ Deferred | 0 | embedding 未同步 |

## 4. 最有效的优化方法（按影响力排序）

### 🥇 第1位：match-count 重排（+55pp LP, +5pp Top5）
**问题**：FTS5 返回数据库插入顺序，Linked List Cycle 排在哈希表查询前
**修法**：likeSearch 改为按查询词命中数排序，卡片匹配越多关键词排名越高
**效果**：10/12 前端查询变得正确，Precision@5 从 0% 提到有意义的排序

### 🥈 第2位：Knowledge Graph 替代 flat dict（±0, 架构升级）
**问题**：79 条 legacy concept dictionary 没有结构化关系
**修法**：全量迁移到 105 节点 Concept Graph，保留 prerequisite/child/related 边
**效果**：删除 357 行 legacy 代码，概念层统一，为 Learning-path pipeline 铺路

### 🥉 第3位：搜索 SearchKeywords 噪音清理（+1.2pp Core）
**问题**：泛化词（窗口/retrieval/embedding）跨领域污染
**修法**：精准移除 1314 条 enrichment 关键词，保留牌组专属关键词
**效果**：Core 93.4%→94.6%，Product-fit 89.6%→91.2%

### 第4位：Learning-path Graph 节点 + 边补全（+50pp LP）
**问题**：21/36 LP query 缺 graph 节点或 prereq 边
**修法**：+12 节点 + 14 prereq edges + topic alias mapping
**效果**：LP 41.7%→91.7%

### 第5位：minScore 归零（从 0 结果到 50 结果）
**问题**：前端默认 minScore=0.3，reranker 在无向量时分数过低，全过滤
**修法**：frontend minScore 0.3→0，reranker wKeyword 0.15→0.60
**效果**：搜索从 "0 results" 恢复到正常工作

## 5. Frozen Pipeline

以下模块在本轮优化中未修改：

- reranker weights（wKeyword=0.60 外）
- deckBoost（0.25）
- minScore（0）
- LLM rewrite（disabled）
- vector active（deferred）
- global lexical weights

## 6. 导出数据

最新 per-case 评测数据：`~/Downloads/eval-per-case.json`（677 条）
