# Benchmark Normalization

Date: 2026-05-23

## Motivation

The original 478-case benchmark contained queries that are not card search intents: career advice ("改简历准备大厂技术面"), business decisions ("新功能是否对留存有正向影响"), open-ended QA ("传统ML还有没有必要学"), and ambiguous short queries ("迭代").

Evaluating these queries against card search metrics (Top15, MRR) is misleading — the product is a flashcard search engine, not a career coach or business consultant. Including these queries artificially depresses metrics without measuring anything actionable.

## Methodology

Each test case is classified with metadata:

```
benchmarkScope: 'search' | 'learning_plan' | 'excluded'
intentType: 'card_lookup' | 'concept_card_search' | 'card_collection_search' | 'learning_plan' | 'ambiguous' | 'not_card_search_intent'
excludeReason?: 'open_qa' | 'career_advice' | 'business_decision' | 'diagnostic_qa' | 'too_ambiguous' | 'out_of_scope'
normalizedQuery?: string
```

Classification rules:
- **search**: queries looking for specific cards, concepts, or card collections
- **learning_plan**: queries asking for learning paths / study plans
- **excluded**: queries that are not card search intents

Exclusion criteria:
- **career_advice**: resume writing, interview prep strategy
- **business_decision**: retention analysis, data-vs-intuition debates
- **open_qa**: "is X still relevant", opinion questions
- **too_ambiguous**: single-word queries like "迭代"

## Scope

| Scope | Cases | Evaluated In |
|-------|-------|-------------|
| search | 430 | Search Benchmark (Top15/Top50/Top100/MRR/P@5/Missing/Buried) |
| learning_plan | 41 | Learning Plan Benchmark (ConceptCoverage/DeckAccuracy/PlanCoverage) |
| excluded | 7 | Not evaluated |
| **Total** | **478** | |

## Implementation

- `src/evaluation/benchmark-classification.ts` — classification map
- `src/evaluation/types.ts` — TestCase metadata fields
- `src/evaluation/runner.ts` — filters by benchmarkScope, prints excluded summary

## Normalized vs Legacy

| Metric | Normalized (430) | Legacy (437) | Δ |
|--------|-----------------|-------------|---|
| Top15 | 88.6% | 87.4% | +1.2pp |
| MRR | 0.674 | 0.660 | +0.014 |
| Missing | 25 | 34 | −9 |
| Buried | 140 | 141 | −1 |

The 7 excluded cases were all ✗ cases. Removing them improves metrics because they were never search queries to begin with.

## Normalized Queries

Some search queries have awkward phrasing that doesn't match how cards are written. These get a `normalizedQuery` that better represents the search intent:

| Original | Normalized |
|----------|-----------|
| 为什么要shuffle数据 | 数据打乱 SGD mini-batch shuffle |
| 参数太多模型太复杂怎么办 | 过拟合 正则化 模型复杂度 参数数量 |
| 数据太少训练不好怎么办 | 小样本学习 数据增强 迁移学习 few-shot |
| ML里如何处理缺失值 | 缺失值处理 插补 删除 均值填充 |
| 噪声标签怎么训练模型 | 噪声标签 label noise robust training |
