#!/usr/bin/env npx tsx
// backend/src/evaluation/compare-runner-outputs.ts
// Compare main runner CSV vs ablation runner CSV, report discrepancies.

import { readFileSync } from 'fs';

const mainFile = process.argv[2] || '/tmp/runner_main.csv';
const ablationFile = process.argv[3] || '/tmp/runner_ablation.csv';

function parseCsv(path: string): Map<string, Record<string, string>> {
  const content = readFileSync(path, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
  const map = new Map<string, Record<string, string>>();
  for (let i = 1; i < lines.length; i++) {
    // Parse CSV with quoted fields
    const row: string[] = [];
    let current = '';
    let inQuote = false;
    for (const ch of lines[i]) {
      if (inQuote) {
        if (ch === '"') {
          if (lines[i][row.length] === '"') { current += '"'; }
          inQuote = false;
        } else { current += ch; }
      } else {
        if (ch === '"') { inQuote = true; }
        else if (ch === ',') { row.push(current); current = ''; }
        else { current += ch; }
      }
    }
    row.push(current);
    
    const record: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = row[j] || '';
    }
    map.set(record.query, record);
  }
  return map;
}

const main = parseCsv(mainFile);
const ablation = parseCsv(ablationFile);

console.log('═'.repeat(80));
console.log('RUNNER OUTPUT COMPARISON');
console.log('═'.repeat(80));
console.log(`  main:     ${mainFile} (${main.size} rows)`);
console.log(`  ablation: ${ablationFile} (${ablation.size} rows)`);
console.log('');

// Find differences
const mainOnly: string[] = [];
const ablationOnly: string[] = [];
const hitMismatches: string[] = [];
const rankDiffs: string[] = [];
const top15OverlapLt5: string[] = [];
const mismatchCount = { main_hit_ab_miss: 0, ab_hit_main_miss: 0, rank10: 0, overlap5: 0 };

for (const [query, mr] of main) {
  const ar = ablation.get(query);
  if (!ar) {
    mainOnly.push(query);
    continue;
  }

  // Hit mismatch
  if (mr.hit !== ar.hit) {
    if (mr.hit === '1') {
      mismatchCount.main_hit_ab_miss++;
      hitMismatches.push(`MAIN↗AB✗ "${query.slice(0, 50)}"  group=${mr.group}  top15 main=${mr.top15Ids} ab=${ar.top15Ids}`);
    } else {
      mismatchCount.ab_hit_main_miss++;
      hitMismatches.push(`AB↗MAIN✗ "${query.slice(0, 50)}"  group=${mr.group}  top15 main=${mr.top15Ids} ab=${ar.top15Ids}`);
    }
  }

  // Rank difference
  const mRanks = mr.primaryRanks.split('|').map(Number).filter(n => n > 0);
  const aRanks = ar.primaryRanks.split('|').map(Number).filter(n => n > 0);
  if (mRanks.length === aRanks.length) {
    for (let i = 0; i < mRanks.length; i++) {
      if (Math.abs(mRanks[i] - aRanks[i]) > 10) {
        mismatchCount.rank10++;
        rankDiffs.push(`RANK>10 "${query.slice(0, 50)}"  main=[${mr.primaryRanks}] ab=[${ar.primaryRanks}]`);
        break;
      }
    }
  }

  // Top15 overlap < 5
  const mTop15 = mr.top15Ids.split('|').filter(Boolean);
  const aTop15 = ar.top15Ids.split('|').filter(Boolean);
  const intersection = mTop15.filter(id => aTop15.includes(id)).length;
  if (intersection < 5) {
    mismatchCount.overlap5++;
    top15OverlapLt5.push(`OVERLAP<5 "${query.slice(0, 50)}"  overlap=${intersection}/${Math.max(mTop15.length, aTop15.length)}`);
  }
}

for (const [query] of ablation) {
  if (!main.has(query)) ablationOnly.push(query);
}

// Report
console.log('── Summary ──');
console.log(`  main hit, ablation miss: ${mismatchCount.main_hit_ab_miss}`);
console.log(`  ablation hit, main miss: ${mismatchCount.ab_hit_main_miss}`);
console.log(`  rank diff > 10:          ${mismatchCount.rank10}`);
console.log(`  top15 overlap < 5:       ${mismatchCount.overlap5}`);
console.log(`  main only rows:          ${mainOnly.length}`);
console.log(`  ablation only rows:      ${ablationOnly.length}`);
console.log('');

if (hitMismatches.length > 0) {
  console.log('── Hit Mismatches ──');
  for (const m of hitMismatches.slice(0, 20)) console.log('  ' + m);
  if (hitMismatches.length > 20) console.log(`  ... and ${hitMismatches.length - 20} more`);
  console.log('');
}

if (rankDiffs.length > 0) {
  console.log('── Rank Diffs > 10 ──');
  for (const d of rankDiffs.slice(0, 10)) console.log('  ' + d);
  if (rankDiffs.length > 10) console.log(`  ... and ${rankDiffs.length - 10} more`);
  console.log('');
}

if (top15OverlapLt5.length > 0) {
  console.log('── Top15 Overlap < 5 ──');
  for (const o of top15OverlapLt5.slice(0, 10)) console.log('  ' + o);
  if (top15OverlapLt5.length > 10) console.log(`  ... and ${top15OverlapLt5.length - 10} more`);
  console.log('');
}

const totalMismatches = mismatchCount.main_hit_ab_miss + mismatchCount.ab_hit_main_miss +
  mismatchCount.rank10 + mainOnly.length + ablationOnly.length;
console.log('═══');
if (totalMismatches === 0) {
  console.log('✓ PARITY ACHIEVED — zero mismatches');
} else {
  console.log(`✗ ${totalMismatches} total discrepancies — parity NOT achieved`);
}
console.log('═══');
process.exit(totalMismatches > 0 ? 1 : 0);
