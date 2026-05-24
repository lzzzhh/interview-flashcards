# Interview Flashcards — Search System Current Status

Date: 2026-05-24

## DB State

| Metric | Value |
|--------|-------|
| Total cards | 748 |
| searchKeywords | 748 (100%) |
| bge-m3 embeddings | 748 (100%) |
| FTS5 entries | 748 (100%) |
| Coverage gaps | 0 |
| DB readiness | All green |

## Authoritative Baseline

**docs/official-baseline-normalized.md** — current authoritative benchmark.

| Scope | Cases | Top15 | MRR | Missing | Buried |
|-------|-------|-------|-----|---------|--------|
| Search | 430 | 88.6% | 0.674 | 25 | 140 |
| Learning Plan | 41 | CC 41.9% | DA 64.1% | PC 64.9% | |
| Excluded | 7 | — | — | — | — |

## Remaining ✗ Cases (22)

| Category | Count | Cause |
|----------|-------|-------|
| embedding_blind_spot | 5 | bge-m3 vector≈0 for colloquial/abbreviation queries |
| coverage_gap | 5 | No dedicated card; needs new card import |
| cross_module | 5 | Test case primaryIds need review |
| label/keyword | 5 | searchKeywords or metadata audit needed |
| ambiguous | 2 | Accept as-is or mark excluded |

## Historical Baselines

| Name | Cases | Top15 | MRR | Status |
|------|-------|-------|-----|--------|
| Normalized (current) | 430 | 88.6% | 0.674 | Authoritative |
| Legacy 437-case | 437 | 87.4% | 0.660 | Historical |
| Frozen v7 | 437 | 85.8% | 0.654 | Historical |

## Frozen Components

These are permanently frozen and must NOT be modified:

- reranker weights (wVector=0.40, wKeyword=0.15, wField=0.35, wLearning=0.10)
- deckBoost (0.25)
- minScore (0)
- LLM rewrite — REJECTED (v8 ablation: −3.0pp vs baseline)
- lexical rescue — REJECTED
- bge-reranker-v2-m3 — REJECTED (can't fix blind_spot recall, degrades ranking)
- global QE rules
- hybridSearch default sort order
- bge-m3 embedding config

## Release Gate

| Metric | Baseline | Gate |
|--------|----------|------|
| Top15 | 88.6% | ≥ 88.3% (−0.3pp tolerance) |
| MRR | 0.674 | ≥ 0.669 (−0.005 tolerance) |
| Missing | 25 | ≤ 27 (+2 tolerance) |
| DB readiness | 100% | Must be all green |
| evaluate:validate | pass | Must pass |

## Infrastructure

| Component | Status | CLI |
|-----------|--------|-----|
| Card import readiness | Active | npm run readiness:* |
| Coverage gap detector | Active | npm run readiness:gaps |
| Benchmark normalization | Active | — |
| Regression review | Active | src/evaluation/regression-review.ts |
| Release gate | Active | npm run evaluate:gate |
| Smoke test (new cards) | Active | npm run evaluate:smoke-new-cards |
| Import readiness report | Active | npm run readiness:audit → reports/readiness/ |
| Card quality audit | Active | src/ingestion/card-audit.ts |
| FTS5 rebuild | Active | src/ingestion/rebuild-fts5.ts |

## Rejected Experiments

| Experiment | Result | Doc |
|-----------|--------|-----|
| V8 LLM Rewrite | −3.0pp vs baseline | docs/v8-llm-rewrite-ablation-rejected.md |
| bge-reranker-v2-m3 | Can't fix blind_spot (recall issue, not ranking); degrades ranking | this doc |

## Why Reranker Was Rejected

bge-reranker-v2-m3 cross-encoder re-ranks top 50 candidates, but:
- Blind spot queries have target cards missing from top 50 entirely (recall failure, not ranking failure)
- For queries where cards ARE in top 50, the reranker sometimes degrades ranking (ml-122: #2 → #14)
- Adds ~2s latency + requires 2GB model
- Root cause is bge-m3 embedding blind spots, not re-ranking quality

## Next Priorities

P0 (done): Baseline governance, release gate, card import readiness gate
P1 (now): Learning Plan optimization (CC@20 41.9% → ≥50%)
P2 (later): Coverage gap workflow, telemetry
P3 (experimental only): Multi-field embedding (must pass ablation gate before merge)

## Key Principle

The Search Benchmark evaluates one thing: does the search return the right cards for a given user query? Excluded cases are queries that are not card search intents. They are not evaluated because they test capabilities the product does not claim to have.
