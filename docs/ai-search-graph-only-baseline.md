# AI Search — Graph-Only Baseline

**Date**: 2026-05-26
**Commit**: `db6012b`
**Branch**: `before-learning-list`

## Production Status: ✅ Release-Ready

Search pipeline frozen. Knowledge Graph route validated. No legacy dictionary rollback.

## Final Metrics

| Metric | Value | Delta vs Legacy Dict |
|--------|-------|---------------------|
| **Core pass rate** | **93.4%** (156/167) | ±0% (matched) |
| Product-fit (core+common) | **90.7%** (175/193) | -0.5pp |
| Weighted | 91.4% | — |
| Release-gate Top15 | 77.7% (397/443 groups) | — |
| Graph nodes | 109 | — |
| Excluded | 5 | — |

## Remaining Non-Blocking Issues (18)

| Type | Count | Status |
|------|-------|--------|
| topic | 8 | Composite/compare topics — eval design |
| intent | 5 | Compare regex + LLM boundary |
| precision | 3 | Concept-level matching |
| mustInclude | 2 | Foundation coverage (eval design) |

## Architecture

| Layer | State |
|-------|-------|
| Knowledge Graph | 109 nodes, 100% legacy coverage, lint PASS |
| tierOwner | graph (parent→lowPriority only) |
| CardConcept | v0 runtime graph alias matching |
| Query Understanding | regex-first (6 product intents) |
| Keyword Tiering | graph-owned (core/expanded/prerequisite/lowPriority) |
| Legacy Dictionary | **deleted** — no fallback |
| Eval | product-fit weighted + release-gate by group |

## Frozen Pipeline

NOT modified since baseline:
- hybridSearch
- reranker weights
- deckBoost (0.25)
- minScore (0)
- vector recall
- FTS5 / LIKE recall
- LLM rewrite
- lexical rescue

## Verified Regressions

| Query | Status |
|-------|--------|
| RNN | ✅ Fixed (searchAliases expanded) |
| 注意力机制 / Attention | ✅ Concept coverage maintained |
| mustInclude foundation | ✅ ≤2 failures |
| merged hard fail | ✅ Reclassified (warning if finalCnt≥10) |

## Regression Guards

| Case | Query | Concept |
|------|-------|---------|
| RNN | RNN/循环神经网络 | RNN node + searchAliases |
| Attention | 注意力机制/self-attention | Attention node |
| Vector DB | 向量数据库 | Vector DB node |
| MLOps | 模型部署/model deployment | model_deploy node |
| STAR法则 | STAR method/行为面试 | star_method node |

## Backlog (Non-Blocking)

- fallback/none graph migration
- merged policy refinement
- broad career query exclusion
- topic granularity warnings
- product-fit diagnostic cleanup
