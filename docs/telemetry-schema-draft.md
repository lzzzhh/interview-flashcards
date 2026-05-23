# Telemetry Schema Draft

Date: 2026-05-23
Status: Draft — not yet implemented

## Prisma Schema Additions

```prisma
model SearchTelemetry {
  id              String   @id @default(cuid())
  query           String
  normalizedQuery String?
  route           String   // hybrid | learning_plan
  resultCount     Int
  top1Score       Float?
  top5AvgScore    Float?
  top15CardIds    String?  // JSON array
  clickedCardId   String?
  clickedRank     Int?
  deckFilter      String?
  emptyResult     Boolean  @default(false)
  lowResult       Boolean  @default(false)
  createdAt       DateTime @default(now())

  interactions SearchInteraction[]
}

model SearchInteraction {
  id            String   @id @default(cuid())
  telemetryId   String
  action        String   // click | start_review | add_to_plan | reformulate | ignore
  cardId        String?
  rank          Int?
  createdAt     DateTime @default(now())

  telemetry SearchTelemetry @relation(fields: [telemetryId], references: [id])
}
```

## Events to Log

### Search Event (per query)
- query
- normalizedQuery (if available)
- route (hybrid / learning_plan)
- resultCount
- top1Score
- top5AvgScore
- top15CardIds
- deckFilter (if any)
- emptyResult (true if 0 results)
- lowResult (true if < 5 results)
- timestamp

### Interaction Events (per user action)
- clickedCardId + clickedRank
- startedReview (user began reviewing a card)
- addedToStudyPlan
- searchedAgainWithin30s (reformulation signal)
- ignoredResults (user scrolled past without clicking)

## Weekly Telemetry Report

CLI: `npm run telemetry:report`

Output: `reports/telemetry/weekly-search-report.md`

### Report Sections

1. Top Empty Queries — queries returning 0 results
2. Top Low-Result Queries — queries with < 5 results
3. Top No-Click Queries — queries where user didn't click anything
4. Top Reformulated Queries — user searched again within 30s
5. Frequent Query Clusters — similar queries grouped
6. Possible Coverage Gaps — frequent empty/low queries → new card candidates
7. Possible Ambiguous Queries — short/vague queries
8. Possible Benchmark Candidates — high-quality queries to add
9. Possible searchKeywords Fixes — cards not matching frequent queries
10. Possible Learning Plan Cases — queries looking for learning paths

## Telemetry Action Recommendations (report only, no auto-modify)

- add searchKeywords to card X
- add new card for topic Y
- add secondaryIds for card Z
- create learning_plan benchmark case
- exclude not_card_search_intent from benchmark
- create benchmark draft for coverage gap
