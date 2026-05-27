# AI Search — Final Frozen Baseline

**Date**: 2026-05-27
**Commit**: `b136ca8`
**Branch**: `before-learning-list`

## System Positioning

**Graph-enhanced lexical search** —— 知识图谱增强的文本搜索。

Not RAG. Not vector search. Not Hybrid RAG.

## Production Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Core | **94.6%** | ✅ |
| Product-fit | **91.2%** | ✅ |
| Release-gate Top15 | **76.5%** | ✅ |
| 关键词-力扣 | **100%** | ✅ |
| 关键词-机器学习 | **97%** | ✅ |
| Learning-path pipeline | **41.7%** | 🚧 |

## Active Recall Channels

| Channel | Status |
|---------|--------|
| FTS5 / likeSearch (match-count ranked) | ✅ Primary |
| tag | ✅ |
| searchKeywords | ✅ |
| vector (bge-m3) | ⏸ Deferred |

## Architecture

| Layer | State |
|-------|-------|
| Knowledge Graph | 102 nodes, lint PASS |
| Query Understanding | regex-first, 6 product intents |
| CardConcept | v0 runtime graph alias matching |
| Legacy dictionary | DELETED |
| LLM rewrite | DISABLED |
| Reranker weights | wKeyword=0.60, wVector=0.10, wField=0.20, wLearning=0.10 |
| deckBoost | 0.25 (FROZEN) |
| minScore | 0 (FROZEN) |

## Agent Group (36 cases)

- 10/12 failures are benchmark primaryId mismatch (equivalent cards in results)
- 2/12 are card coverage gaps
- Not a search regression

## Learning-Path Pipeline

Isolated from normal search. Uses graph edges for stage-based plan generation:
- Stage 1: Prerequisites + Foundation
- Stage 2: Core concepts
- Stage 3: Related/Comparison
- Stage 4: Practice/Interview

Remaining gaps: 21 graph nodes missing, 12 prerequisite edges missing.

## Frozen Items

- reranker weights
- deckBoost
- minScore
- LLM rewrite
- vector active
- global lexical weights

## Next Work

1. Agent benchmark mapping fix
2. Agent card coverage gap fill (2 cards)
3. Learning-path graph node expansion
4. Learning-path prerequisite edge addition
5. Vector embedding sync (future)
