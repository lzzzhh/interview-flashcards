# Multi-Field Embedding Ablation — Design Doc

Date: 2026-05-23
Status: P3 — experimental only, not in default search path

Note: bge-reranker-v2-m3 was tested as an alternative to this design and rejected
(can't fix blind_spot recall, degrades ranking). Root cause of remaining ✗ is
embedding recall (vector≈0), not re-ranking quality.

## Start Conditions

Do NOT start unless at least one is true:

1. Normalized Search Top15 stuck at 88-89% with real user low-click queries
2. Missing cases primarily from embedding blind spot
3. Top50/Top100 has target cards but Top15 doesn't rank them
4. searchKeywords are high quality but semantic recall still insufficient
5. Telemetry shows many users fail to find cards with natural language

## Experimental Path

Must be isolated from default search:

```
src/search/multi-field-vector-search.ts  — new module
src/evaluation/multi-field-ablation-runner.ts — ablation runner
```

Do NOT wire into `/api/search/hybrid`.

## Multi-Field Embeddings

Per card, generate separate embeddings:

| Field | Description |
|-------|-------------|
| title embedding | Title + titleCn |
| question embedding | Full question text |
| answer embedding | First 500 chars of answer |
| searchKeywords embedding | Concatenated searchKeywords |
| tags/subTopic embedding | Tags + subTopic |
| userQueryExamples embedding | (Optional) user-provided example queries |

## Fusion Methods (ablation)

| Method | Description |
|--------|-------------|
| field-level max score | Per query, take max cosine sim across all fields |
| RRF (k=60) | Reciprocal Rank Fusion across field-specific result lists |
| Weighted RRF | RRF with field weights (title > question > keywords > tags) |
| Lexical + field vector hybrid | Current hybridSearch + field-level vector max score |

## Ablation Metrics

Compare against current normalized official baseline:

- Top15, Top50, Top100
- MRR, P@5
- Missing, Buried
- embedding_blind_spot subset Top15
- Latency (avg, p95)
- bad_new_card_noise count

## Acceptance Gate (to graduate from experimental)

ALL must be met:

| Metric | Requirement |
|--------|-------------|
| Search Top15 | ≥ baseline + 1.0pp |
| MRR | ≥ baseline + 0.010 |
| Missing | Significant decrease |
| Blind spot Top15 | Significant improvement |
| Latency | Acceptable (no order-of-magnitude increase) |
| Noise | No significant bad_new_card_noise |
| Release gate | Passes normalized release gate |

If any fails, keep experimental. Do NOT merge into default search path.
