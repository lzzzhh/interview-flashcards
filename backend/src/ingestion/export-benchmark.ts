// Generate complete benchmark dataset
import { writeFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
import { TEST_CASES } from '../evaluation/test-cases';
import { getMeta } from '../evaluation/benchmark-classification';

interface FullCase {
  query: string;
  normalizedQuery?: string;
  group: string;
  benchmarkScope: string;
  intentType: string;
  excludeReason?: string;
  primaryIds?: string[];
  secondaryIds?: string[];
  acceptableDecks?: string[];
  acceptableConcepts?: string[];
  labelQuality?: string;
  source?: string;
}

const all: FullCase[] = [];
for (const tc of TEST_CASES) {
  if (!tc) continue;
  const meta = getMeta(tc.query);
  all.push({
    query: tc.query,
    normalizedQuery: tc.normalizedQuery || meta.normalizedQuery || undefined,
    group: tc.group,
    benchmarkScope: meta.benchmarkScope || tc.benchmarkScope || 'search',
    intentType: meta.intentType || tc.intentType || 'concept_card_search',
    excludeReason: meta.excludeReason || tc.excludeReason || undefined,
    primaryIds: tc.primaryIds?.length ? tc.primaryIds : undefined,
    secondaryIds: tc.secondaryIds?.length ? tc.secondaryIds : undefined,
    acceptableDecks: tc.acceptableDecks?.length ? tc.acceptableDecks : undefined,
    acceptableConcepts: tc.acceptableConcepts?.length ? tc.acceptableConcepts : undefined,
    labelQuality: tc.labelQuality || meta.labelQuality || undefined,
    source: tc.source || meta.source || undefined,
  });
}

const output = `// Complete Benchmark Dataset — all ${all.length} cases with all fields
// Generated: ${new Date().toISOString()}
// 
// benchmarkScope: search (430) | learning_plan (41) | excluded (7)
// intentType: card_lookup | concept_card_search | card_collection_search | learning_plan
// excludeReason: open_qa | career_advice | business_decision | too_ambiguous

export const ALL_CASES = ${JSON.stringify(all, null, 2)};
`;

writeFileSync('/Users/zhanhuilin/Desktop/interview-flashcards/docs/benchmark-dataset.ts', output);
console.log(`Wrote ${all.length} cases to docs/benchmark-dataset.ts`);
const se = all.filter(c => c.benchmarkScope === 'search');
const lp = all.filter(c => c.benchmarkScope === 'learning_plan');
const ex = all.filter(c => c.benchmarkScope === 'excluded');
console.log(`  search: ${se.length}, learning_plan: ${lp.length}, excluded: ${ex.length}`);
