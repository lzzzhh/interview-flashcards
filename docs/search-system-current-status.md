# AI Search System — Current Status

**Date**: 2026-05-25
**Commit**: `e48aca5`
**Status**: ✅ Production-Ready

## Quick Summary

AI Search module is production-ready. Core product queries pass at **93.4%**. 
Search main pipeline is frozen. Next work should focus on telemetry, learning plan generation, and concept alias cleanup.

## Key Metrics

| Metric | Value |
|--------|-------|
| Core queries | 93.4% (156/167) |
| Product-fit (core+common) | 91.2% (176/193) |
| Weighted | 91.7% |
| Excluded from benchmark | 5 cases |

## Architecture Components

| Component | Status | Notes |
|-----------|--------|-------|
| Concept Graph v1 | ✅ Stable | 79 nodes, 100% legacy coverage, lint PASS |
| tierOwner | ✅ Graph | parent → lowPriority only |
| CardConcept v0 | ✅ Runtime | Graph alias matching on card fields |
| Query Understanding | ✅ Stable | Product-aligned intents, compare/strength detection |
| Keyword Tiering | ✅ Stable | core/expanded/prerequisite/lowPriority from graph |
| Eval Framework | ✅ 200-case | Product-fit weighted, realism classification |
| FTS5/LIKE recall | ✅ Stable | 9-field likeSearch, bigram Chinese |
| Reranker | ✅ Stable | deckBoost 0.25, minScore 0 |
| Merge cap | ✅ 200 | topicGranularity-aware |

## Non-Blocking Issues (17)

- 7 merged cap (topic granularity)
- 4 mustInclude (foundation concept coverage)
- 3 intent (English concept compare alias)
- 2 precision (concept-level matching in eval)
- 1 topic (composite topic acceptable)

## Frozen Pipeline

Do NOT modify without baseline comparison:
- hybridSearch
- learningPlanSearch
- reranker weights
- deckBoost (0.25)
- minScore (0)
- vector recall
- FTS5/LIKE recall
- LLM rewrite
- lexical rescue

## Next Priorities

1. Telemetry / analytics on search usage
2. Learning plan generation from search results
3. Concept alias cleanup (remove duplicates, normalize)
4. CardConcept persistence (inferred → verified)
5. UI: search explainability panel
