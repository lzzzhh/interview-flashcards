# Official Baseline — Search Benchmark (SUPERSEDED)

Date: 2026-05-23
Status: SUPERSEDED by docs/official-baseline-normalized.md
Embedding: bge-m3 via Ollama (dim=1024)
Git: 139e8b6
DB: 715 cards, 715 vectors, 478 test cases (437 search + 41 learning-path)

## Search Benchmark

| Metric   | Value  |
|----------|--------|
| Cases    | 437    |
| Top15    | 85.8%  |
| Top50    | 94.5%  |
| Top100   | 96.6%  |
| MRR      | 0.654  |
| P@5      | 0.250  |
| Missing  | 44     |
| Buried   | 140    |

## Learning Plan Benchmark

| Metric             | Value |
|--------------------|-------|
| Cases              | 41    |
| ConceptCoverage@20 | 41.3% |
| DeckAccuracy@20    | 64.0% |
| PlanCoverage       | 65.4% |

## Threshold @0.30

| Metric    | Value |
|-----------|-------|
| Recall(S) | 74.8% |
| Recall(A) | 74.8% |
| Empty     | 9.0%  |
| Low (<3)  | 18.6% |
| Avg       | 51.9  |
| p50       | 45    |
| p90       | 100   |

## Failure Classification

- Recall failure (not in candidate pool): 68
- Ranking failure (>Top15): 158
- Threshold failure (score<0.30): 0

## Search Parameters

- candidateLimit: 500
- maxResults: 100
- minScore: 0
- deckBoost: 0.25
- hit policy: primaryIds only
- reranker: default profile (wVector=0.40, wKeyword=0.15, wField=0.35, wLearning=0.10)

## Frozen Settings

The following are FROZEN and will not be tuned:
- reranker weights
- deckBoost
- minScore
- LLM rewrite (rejected — see v8-llm-rewrite-ablation-rejected.md)
- lexical rescue (rejected)
- global QE rules
