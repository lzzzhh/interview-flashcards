# AI Search Optimization History

Date: 2026-05-24

## Final Baseline

Search Benchmark (430 cases): **Top15 88.6% | MRR 0.674 | Missing 25 | Buried 140**
Learning Plan (41 cases): CC@20 41.9% | DA@20 64.1% | PC 64.9%
DB: 748 cards, 100% ready (searchKeywords / bge-m3 embedding / FTS5)
Excluded from Search: 7 (career advice, business decisions, open QA, ambiguous)

## Architecture

```
Query → hybridSearch (bge-m3 vector + keyword FTS5 + field boost + learning state)
     → Reranker (weighted sum: 0.40×vector + 0.15×keyword + 0.35×field + 0.10×learning)
     → deckBoost 0.25 + diversity rerank (concept cluster ≥8 triggers)
     → Top 15 / Top 50 / Top 100
```

## Experiments Timeline

### V7 Frozen Baseline (715 cards)
- **Top15 85.8%, MRR 0.654, Missing 44**
- bge-m3 embedding + keyword FTS5 + field boost
- reranker weights: wVector=0.40, wKeyword=0.15, wField=0.35, wLearning=0.10
- deckBoost=0.25, diversity rerank

### Runner Parity Debug
- **Bug**: Ablation runner failed to set embedding provider defaultModel → Ollama rejected "text-embedding-3-small" → silent n-gram fallback
- **Fix**: Added `defaultModel = 'bge-m3'` with smoke test. Shared eval-config.ts for both runners.
- **Result**: 0 mismatches between main and ablation runner.

### Coverage Gap Fill (715 → 754 cards)
- Added 39 cards across 13 topics (CAP理论, 图数据库, 分布式锁, ETL, 北极星, 风控, etc.)
- **Regression**: Top15 dropped from 85.8% to 84.7% (−1.1pp) due to new card vector density
- **Fix**: 3 passes of keyword tightening (22 cards) + 11 primaryId corrections
- **Result**: Top15 recovered to 87.4%, then 87.0% (+1.2pp from frozen baseline)

### V8 LLM Rewrite — REJECTED
- **Hypothesis**: LLM query understanding + rewrite-assisted recall could help blind spot queries
- **Method**: DeepSeek LLM classifies intent, rewrites query, second-pass hybridSearch with expanded terms
- **Result**: All LLM configs DEGRADE vs baseline
  - baseline: 85.8%
  - rewrite-low-conf: 82.2% (−3.6pp)
  - rewrite-all: 81.2% (−4.6pp)
  - rewrite-raw-preserved: 82.8% (−3.0pp)
  - rescue-strict: 82.4% (−3.4pp)
  - Blind spot unchanged at 25%
- **Root cause**: Rewrite second pass introduces noise that disrupts reranker's optimized ordering
- **Status**: Permanent rejection. All LLM modules marked REJECTED.

### Benchmark Normalization
- **Problem**: 7 queries in test set not about card search (career advice, business decisions, open QA)
- **Fix**: Added benchmarkScope/intentType/excludeReason metadata
- **Result**: 430 search + 41 LP + 7 excluded. Removed noise from metrics.
  - Top15: 87.4% → 88.6% (removing 7 non-search queries)
  - MRR: 0.660 → 0.674
  - Missing: 34 → 25

### bge-reranker-v2-m3 — REJECTED
- **Hypothesis**: Cross-encoder reranker could improve blind spot query ranking
- **Method**: sentence-transformers + BAAI/bge-reranker-v2-m3 re-ranks Top50 candidates
- **Result**: REJECTED
  - Blind spot: cannot fix — target cards NOT in Top50 (recall failure, not ranking failure)
  - Degraded ranking: ml-122 dropped from #2 to #14 for "CLIP多模态对比学习"
  - Latency: +2s per query + 2GB model
- **Root cause**: Remaining 22 ✗ are embedding recall failures, not re-ranking failures

## Remaining ✗ Cases (22)

| Category | Count | Root Cause |
|----------|-------|------------|
| embedding_blind_spot | 5 | bge-m3 vector≈0 for colloquial/abbreviation queries |
| coverage_gap | 5 | No dedicated card exists |
| cross_module | 5 | Test case primaryIds map to wrong deck |
| label/keyword | 5 | searchKeywords or metadata needed |
| ambiguous | 2 | Query too vague; accept or exclude |

## What Worked

- bge-m3 embedding: core recall engine, 88.6% Top15
- Keyword FTS5 + field boost: fills bge-m3 gaps for exact match queries
- Reranker weighted sum: tuned balance of vector/keyword/field/learning
- DeckBoost + diversity rerank: prevents concept cluster dominance
- Coverage gap fill: +1.2pp Top15 from new dedicated cards
- Benchmark normalization: removed noise, honest metrics display

## What Didn't Work

- LLM query rewrite: degrades search (−3.0pp to −4.6pp)
- Lexical rescue: negative even with strict conditions
- Cross-encoder reranker: can't fix recall failures

## What's Frozen

- reranker weights (wVector=0.40, wKeyword=0.15, wField=0.35, wLearning=0.10)
- deckBoost (0.25)
- minScore (0)
- LLM rewrite (permanently rejected)
- Lexical rescue (permanently rejected)
- bge-reranker-v2-m3 (permanently rejected)
- Global QE rules
- hybridSearch default sort order
- bge-m3 embedding config
