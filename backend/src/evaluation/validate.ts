// backend/src/evaluation/validate.ts — Dataset integrity validation
//
// Usage: npm run evaluate:validate
// Checks: duplicate query+group, primary/secondary overlap, deck mismatch,
//         missing acceptableConcepts (learning-path), duplicate keys, empty fields
//
// Exit code 0 = clean, 1 = issues found

import prisma from '../db/prisma';
import { TEST_CASES } from './test-cases';

interface ValidationIssue {
  severity: 'error' | 'warning';
  category: string;
  index: number;
  query: string;
  group: string;
  detail: string;
}

async function main() {
  const issues: ValidationIssue[] = [];

  // 1. Null/empty entries
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) {
      issues.push({ severity: 'error', category: 'null_entry', index: i, query: '(null)', group: '(null)', detail: 'Null entry in TEST_CASES array' });
      continue;
    }
    if (!tc.query) {
      issues.push({ severity: 'error', category: 'empty_query', index: i, query: '(empty)', group: tc.group || '(empty)', detail: 'Empty query' });
    }
    if (!tc.group) {
      issues.push({ severity: 'error', category: 'empty_group', index: i, query: tc.query || '(empty)', group: '(empty)', detail: 'Empty group' });
    }
    if (!tc.primaryIds || tc.primaryIds.length === 0) {
      issues.push({ severity: 'warning', category: 'no_primary', index: i, query: tc.query, group: tc.group, detail: 'No primaryIds' });
    }
  }

  // 2. Duplicate (query, group) pairs
  const seen = new Map<string, number>();
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) continue;
    const key = `${tc.query}|||${tc.group}`;
    if (seen.has(key)) {
      issues.push({
        severity: 'error', category: 'duplicate_query_group', index: i,
        query: tc.query, group: tc.group,
        detail: `Duplicate of index ${seen.get(key)}`,
      });
    }
    seen.set(key, i);
  }

  // 3. Primary/secondary ID overlap within same case
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc || !tc.primaryIds || !tc.secondaryIds) continue;
    const overlap = tc.primaryIds.filter(pid => tc.secondaryIds!.includes(pid));
    if (overlap.length > 0) {
      issues.push({
        severity: 'error', category: 'primary_secondary_overlap', index: i,
        query: tc.query, group: tc.group,
        detail: `IDs in both primary and secondary: [${overlap.join(', ')}]`,
      });
    }
  }

  // 4. Duplicate card IDs within primaryIds or secondaryIds
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) continue;
    if (tc.primaryIds) {
      const dupes = tc.primaryIds.filter((id, idx) => tc.primaryIds!.indexOf(id) !== idx);
      if (dupes.length > 0) {
        issues.push({
          severity: 'error', category: 'duplicate_primary_ids', index: i,
          query: tc.query, group: tc.group,
          detail: `Duplicate primaryIds: [${dupes.join(', ')}]`,
        });
      }
    }
    if (tc.secondaryIds) {
      const dupes = tc.secondaryIds.filter((id, idx) => tc.secondaryIds!.indexOf(id) !== idx);
      if (dupes.length > 0) {
        issues.push({
          severity: 'error', category: 'duplicate_secondary_ids', index: i,
          query: tc.query, group: tc.group,
          detail: `Duplicate secondaryIds: [${dupes.join(', ')}]`,
        });
      }
    }
  }

  // 5. Deck mismatch: card actual deck vs acceptableDecks
  const allCardIds = new Set<string>();
  for (const tc of TEST_CASES) {
    if (!tc) continue;
    for (const id of (tc.primaryIds || [])) allCardIds.add(id);
    for (const id of (tc.secondaryIds || [])) allCardIds.add(id);
  }

  const cards = await prisma.card.findMany({
    where: { id: { in: [...allCardIds] } },
    select: { id: true, deckId: true },
  });
  const deckMap = new Map(cards.map(c => [c.id, c.deckId]));

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc || !tc.primaryIds) continue;
    const allIds = [...(tc.primaryIds || []), ...(tc.secondaryIds || [])];
    const actualDecks = new Set(allIds.map(id => deckMap.get(id)).filter(Boolean) as string[]);
    const expectedDecks = new Set(tc.acceptableDecks || []);
    const missing = [...actualDecks].filter(d => !expectedDecks.has(d));

    if (missing.length > 0) {
      issues.push({
        severity: 'warning', category: 'deck_mismatch', index: i,
        query: tc.query, group: tc.group,
        detail: `Card decks [${missing.join(', ')}] not in acceptableDecks [${[...expectedDecks].join(', ')}]`,
      });
    }
  }

  // 6. Learning-path: check acceptableConcepts present
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) continue;
    const isLP = tc.group === 'learning-path' || tc.group.startsWith('学习路径') || tc.group.startsWith('学习路径-');
    if (isLP && (!tc.acceptableConcepts || tc.acceptableConcepts.length === 0)) {
      issues.push({
        severity: 'warning', category: 'lp_no_concepts', index: i,
        query: tc.query, group: tc.group,
        detail: 'Learning-path case has no acceptableConcepts',
      });
    }
  }

  // 7. AcceptableConcepts format: pipe-separated concepts should be parseable
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc || !tc.acceptableConcepts) continue;
    for (const concept of tc.acceptableConcepts) {
      if (concept.includes('|') && concept.split('|').some(s => s.trim().length === 0)) {
        issues.push({
          severity: 'warning', category: 'concept_format', index: i,
          query: tc.query, group: tc.group,
          detail: `Concept "${concept}" has empty pipe segment`,
        });
      }
    }
  }

  // 8. Normalized schema: benchmarkScope required (info only — merged at runtime)
  let missingScope = 0, missingIntent = 0;
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) continue;
    if (!tc.benchmarkScope) missingScope++;
    if (!tc.intentType) missingIntent++;
  }
  if (missingScope > 0) {
    console.log(`  [info] ${missingScope}/${TEST_CASES.length} cases: benchmarkScope merged at runtime from benchmark-classification.ts`);
  }
  if (missingIntent > 0) {
    console.log(`  [info] ${missingIntent}/${TEST_CASES.length} cases: intentType merged at runtime from benchmark-classification.ts`);
  }

  // 9. Excluded cases: excludeReason required
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) continue;
    if (tc.benchmarkScope === 'excluded' && !tc.excludeReason) {
      issues.push({
        severity: 'error', category: 'excluded_no_reason', index: i,
        query: tc.query, group: tc.group,
        detail: 'benchmarkScope=excluded but excludeReason not set',
      });
    }
  }

  // 10. Search cases: intentType must be card search
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) continue;
    if (tc.benchmarkScope === 'search') {
      const validIntents = ['card_lookup', 'concept_card_search', 'card_collection_search'];
      if (tc.intentType && !validIntents.includes(tc.intentType)) {
        issues.push({
          severity: 'error', category: 'search_invalid_intent', index: i,
          query: tc.query, group: tc.group,
          detail: `benchmarkScope=search but intentType=${tc.intentType} (must be card_lookup/concept_card_search/card_collection_search)`,
        });
      }
      const hasPrimary = tc.primaryIds && tc.primaryIds.length > 0;
      const hasConcepts = tc.acceptableConcepts && tc.acceptableConcepts.length > 0;
      if (!hasPrimary && !hasConcepts) {
        issues.push({
          severity: 'error', category: 'search_no_expectation', index: i,
          query: tc.query, group: tc.group,
          detail: 'benchmarkScope=search but no primaryIds or acceptableConcepts',
        });
      }
    }
  }

  // 11. Learning plan cases: intentType and acceptableConcepts required
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) continue;
    if (tc.benchmarkScope === 'learning_plan') {
      if (tc.intentType && tc.intentType !== 'learning_plan') {
        issues.push({
          severity: 'error', category: 'lp_invalid_intent', index: i,
          query: tc.query, group: tc.group,
          detail: `benchmarkScope=learning_plan but intentType=${tc.intentType} (must be learning_plan)`,
        });
      }
      if (!tc.acceptableConcepts || tc.acceptableConcepts.length === 0) {
        issues.push({
          severity: 'error', category: 'lp_no_concepts', index: i,
          query: tc.query, group: tc.group,
          detail: 'benchmarkScope=learning_plan but no acceptableConcepts',
        });
      }
    }
  }

  // 12. Ambiguous queries should not enter search benchmark
  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    if (!tc) continue;
    if (tc.benchmarkScope === 'search' && tc.intentType === 'ambiguous') {
      if (!tc.normalizedQuery || tc.labelQuality !== 'verified') {
        issues.push({
          severity: 'error', category: 'ambiguous_in_search', index: i,
          query: tc.query, group: tc.group,
          detail: 'intentType=ambiguous in search benchmark — must set normalizedQuery + labelQuality=verified, or move to excluded',
        });
      }
    }
  }

  // ── Report ──
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  console.log(`\nDataset Validation: ${TEST_CASES.length} cases`);
  console.log(`  Errors:   ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  console.log('');

  if (errors.length > 0) {
    console.log('── Errors ──');
    for (const e of errors) {
      console.log(`  [${e.category}] #${e.index} "${e.query.slice(0, 40)}" (${e.group})`);
      console.log(`    ${e.detail}`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('── Warnings ──');
    const byCategory = new Map<string, ValidationIssue[]>();
    for (const w of warnings) {
      const list = byCategory.get(w.category) || [];
      list.push(w);
      byCategory.set(w.category, list);
    }
    for (const [cat, list] of byCategory) {
      console.log(`  [${cat}] ${list.length}x`);
      for (const w of list.slice(0, 5)) {
        console.log(`    #${w.index} "${w.query.slice(0, 50)}" — ${w.detail}`);
      }
      if (list.length > 5) console.log(`    ... +${list.length - 5} more`);
    }
    console.log('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('  ✓ All checks passed. Dataset is clean.');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Validation error:', err);
  process.exit(2);
});
