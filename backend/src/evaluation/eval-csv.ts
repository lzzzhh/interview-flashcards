// backend/src/evaluation/eval-csv.ts
// Per-case CSV output for runner parity comparison

import { writeFileSync } from 'fs';
import type { CaseResult } from './types';

export interface CsvRow {
  query: string;
  group: string;
  primaryIds: string;
  secondaryIds: string;
  top15Ids: string;
  top50Ids: string;
  primaryRanks: string;
  hit: string;          // "1" if at least one primary in top15
  partialHit: string;   // "1" if some but not all primaries in top15
  missing: string;      // comma-separated missing primaryIds
  buried: string;       // comma-separated buried primaryIds (rank 16-100)
  score: string;        // top match score
  totalResults: string;
}

export function toCsvRows(results: CaseResult[]): CsvRow[] {
  return results.map(r => {
    const allPrimaryIds = r.primaryRanks;
    const hitIds = r.primaryHitTop15;
    const allPrimary = allPrimaryIds.map((_, i) => {
      // We need the original primaryIds list. Get it from test case primaryIds length.
      return '';
    });

    const hit = hitIds.length > 0 ? '1' : '0';
    const totalPrimary = r.primaryRanks.length;
    const partialHit = (hitIds.length > 0 && hitIds.length < totalPrimary) ? '1' : '0';

    return {
      query: r.query.replace(/"/g, '""'),
      group: r.group,
      primaryIds: '', // filled by caller since CaseResult doesn't carry this
      secondaryIds: '',
      top15Ids: hitIds.join('|'),
      top50Ids: r.primaryHitTop50.join('|'),
      primaryRanks: r.primaryRanks.join('|'),
      hit,
      partialHit,
      missing: r.primaryMissing.join('|'),
      buried: r.primaryBuried.join('|'),
      score: r.rankedScores[0]?.toFixed(4) || '',
      totalResults: String(r.totalResults),
    };
  });
}

export function writeCsv(filename: string, rows: CsvRow[], primaryIdsMap: Map<string, string>, secondaryIdsMap: Map<string, string>) {
  // Add primaryIds and secondaryIds from map
  const enriched = rows.map(r => ({
    ...r,
    primaryIds: primaryIdsMap.get(r.query) || '',
    secondaryIds: secondaryIdsMap.get(r.query) || '',
  }));

  const header = Object.keys(enriched[0]).join(',');
  const lines = [header];
  for (const r of enriched) {
    const vals = Object.values(r).map(v => `"${v}"`);
    lines.push(vals.join(','));
  }

  writeFileSync(filename, lines.join('\n'), 'utf-8');
  console.error(`[csv] Wrote ${enriched.length} rows to ${filename}`);
}
