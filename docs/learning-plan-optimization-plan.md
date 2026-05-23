# Learning Plan Optimization Plan

Date: 2026-05-23
Status: P1 — next priority after baseline governance

## Current State

| Metric | Value |
|--------|-------|
| ConceptCoverage@20 | 41.9% |
| DeckAccuracy@20 | 64.1% |
| PlanCoverage | 64.9% |
| Cases | 41 |

## Target Phase 1

| Metric | Current | Target |
|--------|---------|--------|
| ConceptCoverage@20 | 41.9% | ≥ 50% |
| PlanCoverage | 64.9% | ≥ 70% |
| DeckAccuracy@20 | 64.1% | ≥ 63% (no regression) |
| StageCoverage@20 | — | Stable output |
| DuplicateConceptRate | — | Monitored |

## New LP Metrics

| Metric | Description |
|--------|-------------|
| StageCoverage@20 | How many of 5 stages (基础入门/核心方法/对比选择/面试考点/复习练习) have at least 1 card in top 20 |
| RequiredConceptRecall@20 | Required concepts covered / total required |
| OptionalConceptRecall@20 | Optional concepts covered / total optional |
| UsefulCardRate@10 | How many of top 10 are tagged with primary concept |
| DuplicateConceptRate | How many top 20 cards share the same concept |
| PrerequisiteOrderScore | Are prereq concepts ranked before advanced concepts |
| DeckDiversityScore | Distribution of cards across decks |
| DifficultyProgressionScore | Easy→Medium→Hard ordering in top 20 |

## Stages

Learning Plan should cover or balance across:

1. 基础入门 — fundamental concepts, definitions
2. 核心方法 — key methods/techniques
3. 对比选择 — comparisons, trade-offs
4. 面试考点 — interview patterns
5. 复习练习 — review/practice cards

## Concept Graph Enhancements

For each card/concept, add:

| Field | Description |
|-------|-------------|
| concept aliases | Alternative names (中文/英文/缩写) |
| prerequisite concepts | What you need to know first |
| sibling concepts | Related concepts at same level |
| advanced concepts | What comes next |
| interview concepts | Interview-relevant sub-topics |
| practice concepts | Hands-on/practical sub-topics |
| common confusions | Frequently confused with |

## Optimization Levers (allowed)

- study-concept-graph.ts — concept relationships, aliases, prerequisites
- learningPlanSearch — staged plan generation logic
- LP concept matching — which cards match which concepts
- LP stage balancing — distribute cards across stages
- LP duplicate reduction — avoid same-concept cards dominating
- LP prerequisite ordering — prereq cards before advanced cards
- LP difficulty progression — easy→medium→hard within stages

## Optimization Levers (forbidden)

- hybridSearch default sort order
- Search Benchmark evaluation logic
- reranker weights
- deckBoost
- minScore

## LP Debug Report

Each evaluate should output `reports/evaluation/learning-plan-debug.md`:

- query → expected concepts → matched → missing
- overrepresented deck → underrepresented deck
- repeated concepts
- wrong difficulty cards
- missing stages → stage distribution
- recommended fixes

## Implementation Approach

1. Add new LP metrics to runner output
2. Generate LP debug report per evaluate
3. Iterate on study-concept-graph.ts (concept aliases, prerequisites)
4. Iterate on stage balancing logic
5. Re-run LP benchmark after each change
6. Target: CC@20 ≥ 50%, PC ≥ 70%
