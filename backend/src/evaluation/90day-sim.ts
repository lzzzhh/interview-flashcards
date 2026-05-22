// backend/src/evaluation/90day-sim.ts — 90天学习模拟
// 模拟人类学习行为：前期勤奋 → 后期堆积
import { previewSchedule, createDefaultSM2 } from '../../../src/utils/sm2';
import { leetcodeHot100 } from '../../../src/data/leetcode-hot100';
import { statisticsCards } from '../../../src/data/statistics';
import { machineLearningCards } from '../../../src/data/machine-learning';
import { deepLearningCards } from '../../../src/data/deep-learning';
import { llmCards } from '../../../src/data/llm';
import { agentCards } from '../../../src/data/agent';
import { jargonCards } from '../../../src/data/jargon';
import { workplaceCards } from '../../../src/data/workplace';
import { vibeCodingCards } from '../../../src/data/vibe-coding';
import type { FlashCard, SM2Record } from '../../../src/types';

const MODULES: [string, FlashCard[]][] = [
  ['leetcode', leetcodeHot100 as FlashCard[]],
  ['statistics', statisticsCards as FlashCard[]],
  ['machine-learning', machineLearningCards as FlashCard[]],
  ['deep-learning', deepLearningCards as FlashCard[]],
  ['llm', llmCards as FlashCard[]],
  ['agent', agentCards as FlashCard[]],
  ['jargon', jargonCards as FlashCard[]],
  ['workplace', workplaceCards as FlashCard[]],
  ['vibe-coding', vibeCodingCards as FlashCard[]],
];

const DAILY_LIMITS: Record<string, number> = {
  leetcode: 15, statistics: 15, 'machine-learning': 15, 'deep-learning': 15,
  llm: 10, agent: 10, jargon: 10, workplace: 10, 'vibe-coding': 10,
};

interface SimCard {
  id: string;
  module: string;
  sm2: SM2Record;
  tags: string[];
  difficulty?: string;
}

function cloneCard(c: FlashCard, mod: string): SimCard {
  return {
    id: c.id,
    module: mod,
    sm2: createDefaultSM2(),
    tags: c.tags || [],
    difficulty: 'difficulty' in c ? c.difficulty : undefined,
  };
}

class Sim {
  cards: Map<string, SimCard> = new Map();
  day = 0;

  constructor() {
    for (const [mod, cards] of MODULES) {
      for (const c of cards) {
        const sc = cloneCard(c, mod);
        this.cards.set(c.id, sc);
      }
    }
  }

  getDue(dayTs: number, mod: string): string[] {
    const due: Array<[string, number]> = [];
    for (const [id, c] of this.cards) {
      if (c.module !== mod) continue;
      const s = c.sm2.state;
      if (s === 'new') continue;
      if (c.sm2.nextReview <= dayTs) {
        const order = s === 'relearning' ? 0 : s === 'learning' ? 1 : 2;
        due.push([id, order]);
      }
    }
    due.sort((a, b) => a[1] - b[1]);
    return due.map(d => d[0]);
  }

  getNew(mod: string): string[] {
    const ids: string[] = [];
    for (const [id, c] of this.cards) {
      if (c.module === mod && c.sm2.state === 'new') ids.push(id);
    }
    return ids;
  }

  countDue(dayTs: number): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const c of this.cards.values()) {
      if (c.sm2.state !== 'new' && c.sm2.nextReview <= dayTs) {
        counts[c.module] = (counts[c.module] || 0) + 1;
      }
    }
    return counts;
  }

  countNewPerModule(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const c of this.cards.values()) {
      if (c.sm2.state === 'new') counts[c.module] = (counts[c.module] || 0) + 1;
    }
    return counts;
  }

  countLearning(): number {
    let n = 0;
    for (const c of this.cards.values()) {
      if (c.sm2.state === 'learning' || c.sm2.state === 'relearning') n++;
    }
    return n;
  }

  countMastered(): number {
    let n = 0;
    for (const c of this.cards.values()) {
      if (c.sm2.state !== 'new') n++;
    }
    return n;
  }

  rate(id: string, rating: number) {
    const c = this.cards.get(id)!;
    c.sm2 = previewSchedule(c.sm2, rating);
  }

  runDay(): any {
    this.day++;
    const dayTs = Date.now() + this.day * 86400000;

    // Compliance curve: 100% days 1-30, linear drop to ~20% by day 90
    let compliance = this.day <= 30 ? 1.0 : Math.max(0.2, 1.0 - (this.day - 30) / 60 * 0.8);
    compliance = Math.max(0.1, compliance + (Math.random() - 0.5) * 0.2);

    let reviewsDone = 0, newLearned = 0;
    const reviewAvailable = 0, newAvailable = 0;

    // Pick modules: early phase = rotate through all, late phase = prioritize due cards
    const dueCounts = this.countDue(dayTs);
    let modules = [...MODULES.map(m => m[0])];
    
    if (this.day <= 15) {
      // Phase 1: study every module a little
      // shuffle to avoid always same order
      modules.sort(() => Math.random() - 0.5);
    } else if (this.day <= 45) {
      // Phase 2: prioritize modules with due cards, but still touch others occasionally
      const withDue = modules.filter(m => (dueCounts[m] || 0) > 0);
      const withoutDue = modules.filter(m => !withDue.includes(m));
      modules = [...withDue, ...withoutDue.slice(0, 2)];
    } else {
      // Phase 3: only modules with due cards
      modules = modules.filter(m => (dueCounts[m] || 0) > 0);
    }
    modules = modules.slice(0, Math.min(modules.length, 4 + Math.floor(Math.random() * 3)));

    for (const mod of modules) {
      const limit = Math.max(1, Math.round(DAILY_LIMITS[mod] * compliance));

      // Reviews
      const due = this.getDue(dayTs, mod);
      for (let i = 0; i < Math.min(due.length, limit * 3) && Math.random() < compliance * 0.9; i++) {
        // Human-like rating distribution
        const r = Math.random();
        let rating = r < 0.05 ? 1 : r < 0.15 ? 2 : r < 0.35 ? 3 : r < 0.60 ? 4 : 5;
        const card = this.cards.get(due[i])!;
        if (card.sm2.repetitions < 2 && rating > 3) rating = Math.max(3, rating - 1);
        this.rate(due[i], rating);
        reviewsDone++;
      }

      // New cards
      const newCards = this.getNew(mod);
      for (let i = 0; i < Math.min(newCards.length, limit) && Math.random() < compliance; i++) {
        const rating = [2, 3, 3, 4, 4, 4, 5, 5][Math.floor(Math.random() * 8)];
        this.rate(newCards[i], rating);
        newLearned++;
      }
    }

    const dueAfter = this.countDue(dayTs + 86400000);
    const dueAfterTotal = Object.values(dueAfter).reduce((a, b) => a + b, 0);
    const newRemaining = this.countNewPerModule();
    const newRemainingTotal = Object.values(newRemaining).reduce((a, b) => a + b, 0);

    return {
      day: this.day, reviewsDone, newLearned, compliance: +compliance.toFixed(2),
      dueAfterTotal, newRemainingTotal, learning: this.countLearning(),
      mastered: this.countMastered(), totalCards: this.cards.size,
      dueAfterByMod: dueAfter, newRemainingByMod: newRemaining,
    };
  }
}

// ── Recommendation algorithm (exact port from HomePage recommendations) ──
function computeRecs(sim: Sim, dayTs: number, topN = 10) {
  const scored: Array<[number, string]> = [];
  for (const [id, c] of sim.cards) {
    const sm2 = c.sm2;
    if (sm2.state === 'new') continue;
    const overdue = (dayTs - sm2.nextReview) / 86400000;
    if (overdue < 0) continue;
    const R = Math.pow(2, -overdue / Math.max(sm2.interval, 1));
    const score = (1 - R) * (1 + sm2.lapses) * (2.5 / Math.max(sm2.easeFactor, 0.1));
    scored.push([score, id]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, topN);
}

// ── Main ──
function main() {
  console.log('='.repeat(60));
  console.log('面经闪卡 90天学习模拟');
  console.log('='.repeat(60));

  const sim = new Sim();
  console.log(`\n卡片总数: ${sim.cards.size}`);
  for (const [mod] of MODULES) {
    const cnt = [...sim.cards.values()].filter(c => c.module === mod).length;
    console.log(`  ${mod}: ${cnt}`);
  }

  console.log(`\n开始模拟 90 天...\n`);
  console.log(`${'Day'.padStart(4)} | ${'复习'.padStart(5)} | ${'新学'.padStart(4)} | ${'积压复习'.padStart(8)} | ${'剩余新卡'.padStart(8)} | ${'学习中'.padStart(6)} | ${'掌握率'.padStart(6)} | 服从`);
  console.log('-'.repeat(75));

  const milestones: Record<number, any> = {};
  const allDays: any[] = [];

  for (let d = 1; d <= 90; d++) {
    const stats = sim.runDay();
    allDays.push(stats);
    if ([10, 30, 60, 90].includes(d)) milestones[d] = { ...stats };
    if (d % 10 === 0) {
      console.log(
        `${String(d).padStart(4)} | ${String(stats.reviewsDone).padStart(5)} | ${String(stats.newLearned).padStart(4)} | ${String(stats.dueAfterTotal).padStart(8)} | ${String(stats.newRemainingTotal).padStart(8)} | ${String(stats.learning).padStart(6)} | ${(stats.mastered / stats.totalCards * 100).toFixed(0).padStart(5)}% | ${stats.compliance.toFixed(2)}`
      );
    }
  }

  // ── Milestone analysis ──
  console.log('\n' + '='.repeat(60));
  console.log('里程碑分析');
  console.log('='.repeat(60));

  for (const d of [10, 30, 60, 90]) {
    const m = milestones[d];
    console.log(`\n--- Day ${d} (服从度: ${(m.compliance * 100).toFixed(0)}%) ---`);
    console.log(`  当日复习: ${m.reviewsDone}  当日新学: ${m.newLearned}`);
    console.log(`  积压待复习: ${m.dueAfterTotal}  剩余新卡: ${m.newRemainingTotal}`);
    console.log(`  学习中: ${m.learning}  已掌握: ${m.mastered}/${m.totalCards}`);

    const due = m.dueAfterByMod as Record<string, number>;
    console.log(`  各模块积压:`);
    for (const [mod] of MODULES) {
      const v = due[mod] || 0;
      if (v > 0 || mod === 'leetcode') console.log(`    ${mod}: ${v}`);
    }
  }

  // ── Recommendations ──
  console.log('\n' + '='.repeat(60));
  console.log('Day 90 推荐学习 Top 10 (验证推荐算法)');
  console.log('='.repeat(60));
  const day90Ts = Date.now() + 90 * 86400000;
  const recs = computeRecs(sim, day90Ts, 10);
  for (let i = 0; i < recs.length; i++) {
    const [score, id] = recs[i];
    const c = sim.cards.get(id)!;
    const overdue = (day90Ts - c.sm2.nextReview) / 86400000;
    console.log(`  ${i + 1}. [${c.module}] ${id.padEnd(24)} score=${score.toFixed(4)} overdue=${overdue.toFixed(0)}d lapses=${c.sm2.lapses} state=${c.sm2.state} interval=${c.sm2.interval}d`);
  }

  // ── State distribution ──
  console.log('\n' + '='.repeat(60));
  console.log('Day 90 卡片状态分布');
  console.log('='.repeat(60));
  const states: Record<string, number> = {};
  const intervals: Record<string, number> = {};
  for (const c of sim.cards.values()) {
    states[c.sm2.state] = (states[c.sm2.state] || 0) + 1;
    const iv = c.sm2.interval;
    let bucket: string;
    if (iv === 0) bucket = 'new';
    else if (iv <= 3) bucket = '1-3天';
    else if (iv <= 7) bucket = '4-7天';
    else if (iv <= 30) bucket = '8-30天';
    else if (iv <= 90) bucket = '31-90天';
    else bucket = '>90天';
    intervals[bucket] = (intervals[bucket] || 0) + 1;
  }
  for (const s of ['new', 'learning', 'review', 'relearning']) console.log(`  ${s}: ${states[s] || 0}`);
  console.log('\n  间隔分布:');
  for (const b of ['new', '1-3天', '4-7天', '8-30天', '31-90天', '>90天']) console.log(`    ${b}: ${intervals[b] || 0}`);

  // ── Frontend data validation ──
  console.log('\n' + '='.repeat(60));
  console.log('前端数据验证');
  console.log('='.repeat(60));

  const finalDue = sim.countDue(Date.now() + 91 * 86400000);
  const finalDueTotal = Object.values(finalDue).reduce((a, b) => a + b, 0);
  const finalNew = sim.countNewPerModule();

  console.log(`\n1. 首页「今日待完成」Day 90:`);
  console.log(`   复习数: ${finalDueTotal}  学习中: ${sim.countLearning()}`);

  console.log(`\n2. 首页「我的牌组」各牌组复习数:`);
  for (const [mod] of MODULES) {
    const total = [...sim.cards.values()].filter(c => c.module === mod).length;
    const learned = total - (finalNew[mod] || 0);
    console.log(`   ${mod}: 复习=${finalDue[mod] || 0}, 新卡=${finalNew[mod] || 0}, 已学=${learned}/${total}`);
  }

  const totalReviews = allDays.reduce((s, d) => s + d.reviewsDone, 0);
  const totalNew = allDays.reduce((s, d) => s + d.newLearned, 0);
  console.log(`\n3. 统计页应显示:`);
  console.log(`   累计复习: ${totalReviews} 次  累计新学: ${totalNew} 张`);
  console.log(`   已掌握: ${sim.countMastered()}/${sim.cards.size}`);

  // Module-level due counts for verification
  console.log(`\n4. 最终各模块到期复习数 (用于验证首页牌组显示):`);
  for (const [mod] of MODULES) {
    const d = finalDue[mod] || 0;
    const n = finalNew[mod] || 0;
    const total = [...sim.cards.values()].filter(c => c.module === mod).length;
    console.log(`   ${mod}: 到期=${d}  新卡=${n}  已学=${total - n}/${total}`);
  }

  console.log('\n✅ 模拟完成。所有数据基于完整 SM-2 算法计算。');
}

main();
