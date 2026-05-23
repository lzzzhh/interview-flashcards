# Dataset Migration: 583 raw → 478 clean

## Timeline

| Stage | Date | Cases | Changes |
|-------|------|-------|---------|
| v5 raw | May 2026 | 120 | Initial curated set |
| v6 expand | May 2026 | 583 | Python generator expanded to 583 (380 new) |
| v6.5 clean | May 2026 | 478 | P0/P1/P2 cleanup |

## Issues Found in 583 Raw

### P0: Structural Errors (14 fixes)
1. **Duplicate `secondaryIds` fields** (5 cases): Python merge left stale `secondaryIds: []` after appending new values.
   - Lines 180, 182, 236, 238, 261
2. **Primary/secondary overlap** (1 case): dl-4 appeared in both primaryIds and secondaryIds for "Dropout".
   - Line 247
3. **Deck mismatches** (8 cases): Card's actual DB deck not included in `acceptableDecks`.
   - E.g., "大模型为什么胡编乱造" had agent-10 (agent deck) but acceptableDecks=["llm"].
   - Fixed: "余弦相似度", "大模型为什么胡编乱造", "怎么判断两个变量之间有没有关系", "为什么Transformer比RNN快", "Agent和LLM到底什么关系", "BatchNorm和LayerNorm", "RNN和Transformer大不同", "怎么搞懂反向传播"

### P1: Duplicate (query, group) Entries (105 removed)
Many queries appeared 2-4 times with different primaryIds from separate generator batches. Merged via union:
- PrimaryIds: union, dedup
- SecondaryIds: union, remove any already in primaryIds
- AcceptableDecks: union, dedup
- AcceptableConcepts: union, dedup

Example: "Dropout" appeared 4 times with identical primaryIds. Merged to 1.

### P2: Learning-Path Deck Expansion (41 cases)
Learning-path cases had `acceptableDecks` limited to their primary deck. Cards in secondaryIds from other decks were excluded, undercounting DeckAccuracy@20.
Fixed: all decks of primaryIds + secondaryIds now included in acceptableDecks.

## New Validation

Run `npm run evaluate:validate` to check:
- No duplicate (query, group) pairs
- No primary/secondary ID overlap
- No duplicate card IDs within primaryIds or secondaryIds
- Card actual deck vs acceptableDecks consistency
- Learning-path acceptableConcepts present
- Concept format (no empty pipe segments)

## File Locations

| File | Description |
|------|-------------|
| `backend/src/evaluation/test-cases.ts` | Current 478-case clean set (main) |
| `docs/test-cases-583-raw-snapshot.ts` | Original 583 raw (frozen, git 18b4047) |
| `backend/src/evaluation/cleanup_dataset.py` | One-shot cleanup script (P0/P1/P2) |
| `backend/src/evaluation/validate.ts` | Ongoing integrity check |
