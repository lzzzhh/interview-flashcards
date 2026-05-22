// backend/src/evaluation/report.ts — 评测报告输出

import type { CaseResult, GroupMetrics, GlobalMetrics } from './types';

// ---- 格式化辅助 ----

function pct(v: number): string {
  return (v * 100).toFixed(1) + '%';
}

function fixed(v: number, d: number = 3): string {
  return v.toFixed(d);
}

function ms(v: number): string {
  return v < 1000 ? Math.round(v) + 'ms' : (v / 1000).toFixed(2) + 's';
}

function pad(s: string, width: number, align: 'left' | 'right' = 'left'): string {
  if (align === 'right') return s.padStart(width);
  return s.padEnd(width);
}

function sep(char: string, widths: number[]): string {
  return widths.map(w => char.repeat(w)).join('─┼─');
}

const COL_W = [18, 7, 8, 8, 8, 7, 7, 8, 9, 8, 8];

function divider(): string {
  return '├' + sep('─', COL_W) + '┤';
}

function headerDivider(): string {
  return '┝' + sep('━', COL_W) + '┥';
}

function topLine(): string {
  return '┌' + sep('─', COL_W) + '┐';
}

function bottomLine(): string {
  return '└' + sep('─', COL_W) + '┘';
}

// ---- 分组聚合表 ----

export function printGroupTable(global: GlobalMetrics): void {
  const rows: GroupMetrics[] = [...global.groups, global];

  console.log('');
  console.log(topLine());
  console.log(
    '│ ' +
    pad('分组', COL_W[0]) + ' │ ' +
    pad('用例数', COL_W[1], 'right') + ' │ ' +
    pad('Top15', COL_W[2], 'right') + ' │ ' +
    pad('Top50', COL_W[3], 'right') + ' │ ' +
    pad('Top100', COL_W[4], 'right') + ' │ ' +
    pad('P@5', COL_W[5], 'right') + ' │ ' +
    pad('MRR', COL_W[6], 'right') + ' │ ' +
    pad('Deck%', COL_W[7], 'right') + ' │ ' +
    pad('耗时', COL_W[8], 'right') + ' │ ' +
    pad('Missing', COL_W[9], 'right') + ' │ ' +
    pad('Buried', COL_W[10], 'right') + ' │'
  );

  for (let i = 0; i < rows.length; i++) {
    const isLast = i === rows.length - 1;
    const isFirst = i === 0;

    if (isLast && rows.length > 1) {
      console.log(headerDivider());
    } else if (!isFirst) {
      console.log(divider());
    }

    const r = rows[i];
    const style = isLast ? '\x1b[1m' : '';
    const reset = isLast ? '\x1b[0m' : '';

    console.log(
      '│ ' +
      style + pad(r.group, COL_W[0]) + reset + ' │ ' +
      pad(String(r.caseCount), COL_W[1], 'right') + ' │ ' +
      pad(pct(r.hitRateTop15), COL_W[2], 'right') + ' │ ' +
      pad(pct(r.hitRateTop50), COL_W[3], 'right') + ' │ ' +
      pad(pct(r.hitRateTop100), COL_W[4], 'right') + ' │ ' +
      pad(fixed(r.avgPrecisionAt5), COL_W[5], 'right') + ' │ ' +
      pad(fixed(r.avgMRR), COL_W[6], 'right') + ' │ ' +
      pad(pct(r.avgDeckHitRateTop15), COL_W[7], 'right') + ' │ ' +
      pad(ms(r.avgResponseTimeMs), COL_W[8], 'right') + ' │ ' +
      pad(String(r.totalMissing), COL_W[9], 'right') + ' │ ' +
      pad(String(r.totalBuried), COL_W[10], 'right') + ' │'
    );
  }

  console.log(bottomLine());
  console.log('');
}

// ---- 逐用例明细 ----

export function printCaseDetails(results: CaseResult[]): void {
  console.log('── 用例明细 ──\n');

  for (const r of results) {
    const status = r.allPrimaryFound
      ? (r.primaryMissing.length === 0 ? '\x1b[32m✓\x1b[0m' : '\x1b[33m◐\x1b[0m')
      : '\x1b[31m✗\x1b[0m';

    console.log(`${status} [${r.group}] "${r.query}"  (${ms(r.responseTimeMs)}, ${r.totalResults} 条结果)`);

    // primary 排名
    if (r.primaryRanks.length > 0) {
      const parts = r.primaryRanks.map((rank, i) => {
        if (rank === -1) return `\x1b[31m#? missing\x1b[0m`;
        if (rank <= 15) return `\x1b[32m#${rank}\x1b[0m`;
        if (rank <= 50) return `\x1b[33m#${rank}\x1b[0m`;
        return `\x1b[90m#${rank}\x1b[0m`;
      });
      console.log(`   primary 排名: ${parts.join(', ')}`);
    }

    // secondary 排名
    if (r.secondaryRanks.length > 0 && r.secondaryRanks.some(x => x > 0)) {
      const parts = r.secondaryRanks.filter(x => x > 0).map(rank => {
        if (rank <= 15) return `\x1b[32m#${rank}\x1b[0m`;
        if (rank <= 50) return `\x1b[33m#${rank}\x1b[0m`;
        return `\x1b[90m#${rank}\x1b[0m`;
      });
      console.log(`   secondary 排名: ${parts.join(', ')}`);
    }

    // Deck 命中
    console.log(`   Deck 命中(Top15): ${r.acceptableDeckHitsTop15}/${Math.min(15, r.totalResults)}`);

    // missing / buried
    if (r.primaryMissing.length > 0) {
      console.log(`   \x1b[31mMissing:\x1b[0m ${r.primaryMissing.join(', ')}`);
    }
    if (r.primaryBuried.length > 0) {
      console.log(`   \x1b[33mBuried:\x1b[0m ${r.primaryBuried.join(', ')}`);
    }

    console.log('');
  }
}

/** 打印完整报告 */
export function printReport(results: CaseResult[], global: GlobalMetrics): void {
  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log('       AI 搜索评测报告');
  console.log('══════════════════════════════════════════════════');
  console.log(`  测试用例: ${global.caseCount}  |  总 Primary: ${global.totalPrimaries}  |  Missing: ${global.totalMissing}  |  Buried: ${global.totalBuried}`);
  console.log('');

  printGroupTable(global);
  printCaseDetails(results);

  // 一句话总结
  console.log('══════════════════════════════════════════════════');
  console.log(`  Top15 命中率: ${pct(global.hitRateTop15)}  |  MRR: ${fixed(global.avgMRR)}  |  平均耗时: ${ms(global.avgResponseTimeMs)}`);
  console.log('══════════════════════════════════════════════════');
  console.log('');
}
