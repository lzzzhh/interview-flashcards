// backend/src/evaluation/report.ts — 评测报告输出（v2: 阈值评测）

import type { CaseResult, GroupMetrics, GlobalMetrics, ThresholdMetrics } from './types';

function pct(v: number): string { return (v * 100).toFixed(1) + '%'; }
function fixed(v: number, d = 3): string { return v.toFixed(d); }
function ms(v: number): string { return v < 1000 ? Math.round(v) + 'ms' : (v / 1000).toFixed(2) + 's'; }
function pad(s: string, w: number, a: 'left'|'right'='left'): string { return a === 'right' ? s.padStart(w) : s.padEnd(w); }

const COL_W = [18, 7, 8, 8, 8, 7, 7, 8, 9, 8, 8];
function sep(c: string, w: number[]): string { return w.map(x => c.repeat(x)).join('\u2500\u253c\u2500'); }
function topLine(): string { return '\u250c' + sep('\u2500', COL_W) + '\u2510'; }
function bottomLine(): string { return '\u2514' + sep('\u2500', COL_W) + '\u2518'; }
function divider(): string { return '\u251c' + sep('\u2500', COL_W) + '\u2524'; }
function headerDivider(): string { return '\u251d' + sep('\u2501', COL_W) + '\u2525'; }

const R = '\x1b[31m', G = '\x1b[32m', Y = '\x1b[33m', D = '\x1b[90m', B = '\x1b[1m', N = '\x1b[0m';

export function printGroupTable(global: GlobalMetrics): void {
  const rows = [...global.groups, global];
  console.log('\n' + topLine());
  console.log('\u2502 ' + pad('分组', COL_W[0]) + ' \u2502 ' + pad('用例数', COL_W[1], 'right') + ' \u2502 ' + pad('Top15', COL_W[2], 'right') + ' \u2502 ' + pad('Top50', COL_W[3], 'right') + ' \u2502 ' + pad('Top100', COL_W[4], 'right') + ' \u2502 ' + pad('P@5', COL_W[5], 'right') + ' \u2502 ' + pad('MRR', COL_W[6], 'right') + ' \u2502 ' + pad('Deck%', COL_W[7], 'right') + ' \u2502 ' + pad('耗时', COL_W[8], 'right') + ' \u2502 ' + pad('Missing', COL_W[9], 'right') + ' \u2502 ' + pad('Buried', COL_W[10], 'right') + ' \u2502');
  for (let i = 0; i < rows.length; i++) {
    if (i > 0) console.log(i === rows.length - 1 && rows.length > 1 ? headerDivider() : divider());
    const r = rows[i], s = i === rows.length - 1 ? B : '', e = i === rows.length - 1 ? N : '';
    console.log('\u2502 ' + s + pad(r.group, COL_W[0]) + e + ' \u2502 ' + pad(String(r.caseCount), COL_W[1], 'right') + ' \u2502 ' + pad(pct(r.hitRateTop15), COL_W[2], 'right') + ' \u2502 ' + pad(pct(r.hitRateTop50), COL_W[3], 'right') + ' \u2502 ' + pad(pct(r.hitRateTop100), COL_W[4], 'right') + ' \u2502 ' + pad(fixed(r.avgPrecisionAt5), COL_W[5], 'right') + ' \u2502 ' + pad(fixed(r.avgMRR), COL_W[6], 'right') + ' \u2502 ' + pad(pct(r.avgDeckHitRateTop15), COL_W[7], 'right') + ' \u2502 ' + pad(ms(r.avgResponseTimeMs), COL_W[8], 'right') + ' \u2502 ' + pad(String(r.totalMissing), COL_W[9], 'right') + ' \u2502 ' + pad(String(r.totalBuried), COL_W[10], 'right') + ' \u2502');
  }
  console.log(bottomLine() + '\n');
}

export function printCaseDetails(results: CaseResult[]): void {
  console.log('\u2500\u2500 \u7528\u4f8b\u660e\u7ec6 \u2500\u2500\n');
  for (const r of results) {
    const status = r.allPrimaryFound ? (r.primaryMissing.length === 0 ? G + '\u2713' + N : Y + '\u25d0' + N) : R + '\u2717' + N;
    console.log(status + ' [' + r.group + '] "' + r.query + '"  (' + ms(r.responseTimeMs) + ', ' + r.totalResults + ' \u6761\u7ed3\u679c)');
    if (r.primaryRanks.length > 0) {
      const parts = r.primaryRanks.map((rk) => rk === -1 ? R + '#? missing' + N : rk <= 15 ? G + '#' + rk + N : rk <= 50 ? Y + '#' + rk + N : D + '#' + rk + N);
      console.log('   primary \u6392\u540d: ' + parts.join(', '));
    }
    if (r.secondaryRanks.length > 0 && r.secondaryRanks.some(x => x > 0)) {
      const parts = r.secondaryRanks.filter(x => x > 0).map(rk => rk <= 15 ? G + '#' + rk + N : rk <= 50 ? Y + '#' + rk + N : D + '#' + rk + N);
      console.log('   secondary \u6392\u540d: ' + parts.join(', '));
    }
    console.log('   Deck \u547d\u4e2d(Top15): ' + r.acceptableDeckHitsTop15 + '/' + Math.min(15, r.totalResults));
    if (r.primaryMissing.length > 0) console.log('   ' + R + 'Missing:' + N + ' ' + r.primaryMissing.join(', '));
    if (r.primaryBuried.length > 0) console.log('   ' + Y + 'Buried:' + N + ' ' + r.primaryBuried.join(', '));
    console.log('');
  }
}

export function printReport(results: CaseResult[], global: GlobalMetrics): void {
  console.log('\n\u2550'.repeat(27));
  console.log('       AI \u641c\u7d22\u8bc4\u6d4b\u62a5\u544a');
  console.log('\u2550'.repeat(27));
  console.log('  \u6d4b\u8bd5\u7528\u4f8b: ' + global.caseCount + '  |  \u603b Primary: ' + global.totalPrimaries + '  |  Missing: ' + global.totalMissing + '  |  Buried: ' + global.totalBuried);
  printGroupTable(global);
  printCaseDetails(results);
  console.log('\u2550'.repeat(27));
  console.log('  Top15 \u547d\u4e2d\u7387: ' + pct(global.hitRateTop15) + '  |  MRR: ' + fixed(global.avgMRR) + '  |  \u5e73\u5747\u8017\u65f6: ' + ms(global.avgResponseTimeMs));
  console.log('\u2550'.repeat(27) + '\n');
}

// ════════════════════ 阈值评测报告 ════════════════════

export function printThresholdReport(results: ThresholdMetrics[]): void {
  const cols = [10, 9, 9, 9, 9, 8, 8, 7, 7, 7, 7, 7];
  const tc = (w: number[]) => w.map(x => '\u2500'.repeat(x)).join('\u2500\u252c\u2500');

  console.log('\n\u250c' + tc(cols) + '\u2510');
  console.log('\u2502 ' + pad('\u9608\u503c', cols[0], 'right') + ' \u2502 ' + pad('Precision', cols[1], 'right') + ' \u2502 ' + pad('Recall(S)', cols[2], 'right') + ' \u2502 ' + pad('Recall(A)', cols[3], 'right') + ' \u2502 ' + pad('Empty%', cols[4], 'right') + ' \u2502 ' + pad('Low%', cols[5], 'right') + ' \u2502 ' + pad('MRR', cols[6], 'right') + ' \u2502 ' + pad('avg', cols[7], 'right') + ' \u2502 ' + pad('p50', cols[8], 'right') + ' \u2502 ' + pad('p90', cols[9], 'right') + ' \u2502 ' + pad('p95', cols[10], 'right') + ' \u2502 ' + pad('max', cols[11], 'right') + ' \u2502');
  console.log('\u251d' + cols.map(w => '\u2501'.repeat(w)).join('\u2501\u253f\u2501') + '\u2525');

  for (const r of results) {
    const h = r.threshold === 0.30 ? '\x1b[1;33m' : '';
    const e = r.threshold === 0.30 ? N : '';
    console.log('\u2502 ' + h + pad(r.threshold.toFixed(2), cols[0], 'right') + e + ' \u2502 ' + pad(pct(r.precision), cols[1], 'right') + ' \u2502 ' + pad(pct(r.recallStrong), cols[2], 'right') + ' \u2502 ' + pad(pct(r.recallAll), cols[3], 'right') + ' \u2502 ' + pad(pct(r.emptyRate), cols[4], 'right') + ' \u2502 ' + pad(pct(r.lowRate), cols[5], 'right') + ' \u2502 ' + pad(fixed(r.mrr), cols[6], 'right') + ' \u2502 ' + pad(String(r.resultCount.avg), cols[7], 'right') + ' \u2502 ' + pad(String(r.resultCount.p50), cols[8], 'right') + ' \u2502 ' + pad(String(r.resultCount.p90), cols[9], 'right') + ' \u2502 ' + pad(String(r.resultCount.p95), cols[10], 'right') + ' \u2502 ' + pad(String(r.resultCount.max), cols[11], 'right') + ' \u2502');
  }

  console.log('\u2514' + cols.map(w => '\u2500'.repeat(w)).join('\u2500\u2534\u2500') + '\u2518\n');

  const best = results.filter(r => r.emptyRate <= 0.10 && r.lowRate <= 0.25).sort((a, b) => b.precision - a.precision)[0];
  if (best) {
    console.log(G + B + '\u63a8\u8350\u9ed8\u8ba4\u9608\u503c: ' + best.threshold.toFixed(2) + N + ' (Precision=' + pct(best.precision) + ', Recall(S)=' + pct(best.recallStrong) + ', Empty=' + pct(best.emptyRate) + ')');
  } else {
    const fb = results.sort((a, b) => a.emptyRate !== b.emptyRate ? a.emptyRate - b.emptyRate : b.precision - a.precision)[0];
    console.log(Y + B + '\u5907\u9009\u9608\u503c: ' + fb.threshold.toFixed(2) + N + ' (Precision=' + pct(fb.precision) + ', Recall(S)=' + pct(fb.recallStrong) + ', Empty=' + pct(fb.emptyRate) + ')');
  }
  console.log('');
}
