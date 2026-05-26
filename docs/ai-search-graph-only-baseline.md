# AI Search — Graph-Only Lexical Baseline

**Date**: 2026-05-27
**Commit**: `e88e47f`
**Branch**: `before-learning-list`

## Production Status: ✅ Release-Ready

Knowledge Graph migration complete. Legacy dictionary deleted. Search pipeline frozen.

## Final Metrics

| Metric | Value |
|--------|-------|
| **Core pass rate** | **93.4%** (156/167) |
| Product-fit (core+common) | **90.7%** (175/193) |
| Weighted | 91.4% |
| Release-gate Top15 | **77.7%** (443 cases) |
| Graph nodes | **109** |
| Search pipeline | FROZEN |
| Legacy dictionary | DELETED |

## Active Recall Channels (77.7% Top15)

| Channel | Status | Description |
|---------|--------|-------------|
| FTS5 / likeSearch | ✅ Active | Primary: Chinese bigram + English token matching |
| tag | ✅ Active | Card tag matching |
| searchKeywords | ✅ Active | Card searchKeywords matching |
| vector | ⏸ Deferred | Card embedding data missing |

## Vector Recall — Deferred

| Check | Status |
|-------|--------|
| Ollama bge-m3 | ✅ Running (dim=1024) |
| sqlite-vec library | ✅ Initialized |
| Card embedding data | ❌ Not populated |
| 748 cards synced | ❌ Pending |
| Embedding coverage | 0% |

**Enablement plan (backlog):**
1. Run full card embedding sync (748 cards × bge-m3)
2. Verify vector count = card count
3. Run readiness:check / readiness:audit
4. Run vector shadow mode (record-only)
5. Run gated vector active A/B
6. Only enable if Core ≥93% and Product-fit ≥90%

## Architecture

| Layer | State |
|-------|-------|
| Knowledge Graph | 109 nodes, lint PASS |
| tierOwner | graph (parent→lowPriority only) |
| CardConcept | v0 runtime graph alias matching |
| Query Understanding | regex-first (6 product intents) |
| LLM rewrite | DISABLED |
| Reranker weights | FROZEN |
| deckBoost | 0.25 (FROZEN) |
| minScore | 0 (FROZEN) |

## Remaining Non-Blocking Issues (18)

- topic: 8 (composite/compare topics)
- intent: 5 (compare regex + LLM boundary)
- precision: 3 (concept-level matching)
- mustInclude: 2 (foundation coverage)
