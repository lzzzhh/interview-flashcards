# AI Search Benchmark — Product Intent Normalized Official Baseline

Date: 2026-05-23
Status: AUTHORITATIVE (current benchmark)
Embedding: bge-m3 via Ollama (dim=1024)
Git: 139e8b6 (latest: 52483a9)
DB: 748 cards, 748 searchKeywords, 748 embeddings, 748 FTS5

## Search Benchmark (430 cases)

Evaluates: card lookup, concept card search, card collection search

| Metric   | Value  |
|----------|--------|
| Cases    | 430    |
| Top15    | 88.6%  |
| Top50    | 97.2%  |
| Top100   | 98.6%  |
| MRR      | 0.674  |
| P@5      | 0.608  |
| Missing  | 25     |
| Buried   | 140    |

## Learning Plan Benchmark (41 cases)

Evaluates: learning path generation (concept coverage, deck accuracy, plan coverage)

| Metric             | Value |
|--------------------|-------|
| Cases              | 41    |
| ConceptCoverage@20 | 41.9% |
| DeckAccuracy@20    | 64.1% |
| PlanCoverage       | 64.9% |

## Excluded (7 cases)

Not evaluated — not card search intents.

| Reason            | Count |
|-------------------|-------|
| career_advice     | 3     |
| business_decision | 2     |
| open_qa           | 1     |
| too_ambiguous     | 1     |

## Threshold @0.30

| Metric    | Value |
|-----------|-------|
| Recall(S) | 76.2% |
| Recall(A) | 76.2% |
| Empty     | 9.0%  |

## Search Parameters

- candidateLimit: 500
- maxResults: 100
- minScore: 0
- deckBoost: 0.25
- hit policy: primaryIds only
- reranker: default (wVector=0.40, wKeyword=0.15, wField=0.35, wLearning=0.10)

## Frozen Settings

- reranker weights — frozen
- deckBoost — frozen
- minScore — frozen
- LLM rewrite — rejected (v8 ablation: −3.0pp)
- lexical rescue — rejected
- global QE rules — frozen

## Release Gate

| Metric | Baseline | Gate | CLI |
|--------|----------|------|-----|
| Top15 | 88.6% | ≥ 88.3% | npm run evaluate:gate |
| MRR | 0.674 | ≥ 0.669 | |
| Missing | 25 | ≤ 27 | |
| DB readiness | 100% | all green | |
| validate | pass | must pass | npm run evaluate:validate |

## Pipeline Commands

| Command | Purpose |
|---------|---------|
| npm run evaluate | Run normalized benchmark |
| npm run evaluate:validate | Validate test case integrity |
| npm run evaluate:gate | Check release gate pass/fail |
| npm run evaluate:smoke-new-cards | Smoke test recently added cards |
| npm run readiness:audit | Audit DB readiness + generate report |
| npm run readiness:fix-all | Auto-fix all readiness issues |
| npm run readiness:gaps | Detect coverage gaps |

## Historical Reference

| Benchmark | Cases | Top15 | MRR | Notes |
|-----------|-------|-------|-----|-------|
| Normalized (current) | 430 | 88.6% | 0.674 | Authoritative |
| Legacy 437-case | 437 | 87.4% | 0.660 | Pre-normalization, kept for history |
| Frozen v7 | 437 | 85.8% | 0.654 | Before coverage gap fill |

## Key Principle

The Search Benchmark evaluates one thing: does the search return the right cards for a given user query? Excluded cases are queries that are not card search intents (career advice, business decisions, open-ended QA, ambiguous short queries). They are not evaluated because they test capabilities the product does not claim to have.
