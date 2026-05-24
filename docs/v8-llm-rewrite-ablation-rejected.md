# V8 LLM Rewrite Ablation — Rejected

Date: 2026-05-23
Git: 139e8b6
Status: REJECTED (all LLM rewrite configs degrade vs baseline)

## Baseline (bge-m3, 437 search cases)

| Metric  | Value  |
|---------|--------|
| Top15   | 85.8%  |
| Top50   | 94.5%  |
| Top100  | 96.6%  |
| MRR     | 0.654  |
| P@5     | 0.250  |
| Missing | 44     |
| Buried  | 140    |

## Ablation Results

| Config                 | Top15 | Top50 | MRR   | Missing | Buried | LLM%  | Rescue |
|------------------------|-------|-------|-------|---------|--------|-------|--------|
| baseline-bge-m3        | 85.8% | 94.5% | 0.654 | 44      | 140    | 0%    | 0      |
| rewrite-low-conf       | 82.2% | 90.8% | 0.626 | 71      | 141    | 31.4% | 0      |
| rewrite-all            | 81.2% | 90.2% | 0.617 | 69      | 148    | 35.6% | 0      |
| rewrite-raw-preserved  | 82.8% | 91.1% | 0.635 | 71      | 136    | 31.4% | 0      |
| rewrite-no-raw         | 82.8% | 91.1% | 0.632 | 69      | 138    | 31.4% | 0      |
| rescue-off             | 82.8% | 91.3% | 0.632 | 71      | 137    | 31.4% | 0      |
| rescue-strict          | 82.4% | 91.1% | 0.629 | 69      | 142    | 31.4% | 5      |

## Subset Results

| Config           | Blind | LongNL | Diagnostic | Comparison |
|------------------|-------|--------|------------|------------|
| baseline-bge-m3  | 25.0% | 85.4%  | 79.5%      | 85.5%      |
| rewrite-low-conf | 25.0% | 82.0%  | 74.1%      | 75.8%      |
| rewrite-all      | 25.0% | 82.0%  | 71.4%      | 75.8%      |
| rescue-strict    | 25.0% | 82.0%  | 72.3%      | 77.4%      |

## Conclusion

All LLM rewrite configurations degrade search quality vs the bge-m3 baseline.
The best LLM config (rewrite-raw-preserved) loses 3.0pp Top15.

Root cause: The rewrite second pass discovers additional cards via expanded queries,
but the merge strategy (first-pass cards keep scores, new cards appended at raw
hybridSearch scores) disrupts the reranker's ordering. The reranker's diversity
boosting is optimized for the full candidate pool, not a merged list.

Blind spot subset is unchanged at 25% — LLM rewrite does not help bge-m3 blind spots.

## Key Takeaway

LLM rewrite in the current merge-then-rerank architecture is not viable.
Future LLM approaches should either:
- Rewrite the query itself (not generate secondary queries) for a full rerun through hybridSearch
- Or classify queries as blind spot / not, and only rerun blind spot queries

## Artifacts

- CSVs: /tmp/ablation_baseline-bge-m3.csv, /tmp/ablation_rewrite-low-conf.csv, etc.
- Full log: /tmp/v8_parity_ablation.log
- Runner: src/evaluation/v8-ablation-runner.ts (preserved as experiment infrastructure)
- Modules marked REJECTED: search-router.ts, query-understanding.ts, query-rewriter.ts, lexical-rescue.ts

## Final State (2026-05-23)

The normalized baseline (docs/official-baseline-normalized.md) is the authoritative benchmark:
- Search: 430 cases, Top15 88.6%, MRR 0.674
- Search achieved via hybridSearch (bge-m3 + keyword + field + learning scoring)
- No LLM rewrite. No lexical rescue. No global QE.
- Remaining 22 ✗ cases classified: 5 embedding_blind_spot, 5 coverage_gap, 5 cross_module, 5 label/keyword, 2 ambiguous. None require search algorithm changes.

LLM rewrite is permanently rejected for default search path. Future LLM use in search must pass ablation showing ≥ baseline before being considered.

Additionally, bge-reranker-v2-m3 cross-encoder was tested (2026-05-24) as an alternative ranking improvement and also rejected:
- Cannot fix blind_spot — target cards not in Top50 candidate pool (recall failure, not ranking failure)
- Degraded ranking in some cases (ml-122: #2 → #14)
- Added ~2s latency + 2GB model overhead

Root cause of remaining 22 ✗ cases is bge-m3 embedding recall (vector≈0 for colloquial/abbreviation queries). Neither LLM rewrite nor cross-encoder reranker can address this without fixing the embedding layer itself.
