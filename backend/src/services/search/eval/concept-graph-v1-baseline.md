# Concept Graph v1 Baseline
**Commit**: `8ecfbfc` (before-learning-list)
**Date**: 2026-05-25
**Eval**: `npx tsx --no-cache src/services/search/eval/run-lp200.ts` (200 cases)

## Metrics
| Metric | Value |
|--------|-------|
| Pass rate | 73.5% (147/200) |
| Graph coverage | 100% (79/79 legacy concepts) |
| tierOwner | graph |
| Graph lint | PASS (0 errors, 0 parent cycles) |
| parentCategory overwrite | 0 |
| AvgMerged | 82 |
| P95Merged | 200 |
| Avg Final | 30 |
| Avg Top10 | 9.5 |

## Failure Breakdown
| Type | Count | Root Cause |
|------|-------|------------|
| precision | 15 | Card text lacks expected keywords; card-level content gap |
| mustInclude | 13 | Eval keyword expectations beyond tiered tokens |
| merged | 10 | Broad topics naturally produce ~200 candidates |
| topic | 8 | Compare queries produce compound topic; eval expects single |
| intent | 7 | "学习路径是什么" → plan; eval expects study |

## Eval Config
- candidateLimit: 500, maxResults: 100, minScore: 0
- Merge cap: 200 (specificTopicMode)
- Supplemental max: 6
- Concept-level matching: graph aliases via getConceptEquivalents
- EVAL_SUPPRESS_DEBUG=1 (quickParse with concept dict fallback)

## Architectural Decisions
1. Graph provides canonicalTopic, deckHint, keyword tiers
2. Legacy dict always loaded for keyword supplementation (max 6)
3. Parent relations → lowPriorityKeywords only (never in recallText)
4. Concept-level eval matching uses graph aliases
5. CardConcept v0: runtime graph alias matching on card fields
