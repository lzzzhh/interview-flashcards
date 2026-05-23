// backend/src/evaluation/eval-config.ts
// Shared evaluation configuration — both main runner and ablation runner import from here.
// Any change here applies to ALL runners.

import { execSync } from 'child_process';

// ── Git Info ──
let _gitHash = '';
try { _gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim(); } catch {}

export const GIT_COMMIT = _gitHash;

// ── Test Case Source ──
export const BENCHMARK_FILE = 'src/evaluation/test-cases.ts';

// ── Search Configuration ──
export const BASELINE_SEARCH_CONFIG = {
  candidateLimit: 500,
  maxResults: 100,
  minScore: 0,
} as const;

// ── Hit Policy ──
// PrimaryIds are the ground truth for search benchmark.
// SecondaryIds are acceptable alternatives (used in Learning Plan Benchmark only).
// Search Benchmark Top15 uses primaryIds only.
export const HIT_POLICY = {
  /** Use primaryIds for Search Benchmark Top15 */
  usePrimaryIds: true,
  /** Use secondaryIds for Search Benchmark Top15 (must NOT overlap with primary) */
  useSecondaryIds: false,
  /** Use acceptableConcepts for Learning Plan Benchmark */
  useAcceptableConcepts: false,
  /** Use acceptableDecks for Learning Plan Benchmark */
  useAcceptableDecks: false,
} as const;

// ── Group Filtering ──
export function isLearningPath(group: string): boolean {
  return group === 'learning-path' || group.startsWith('学习路径') || group.startsWith('学习路径-');
}

export function isCoverageGap(group: string): boolean {
  return group === 'coverage-gap' || group.startsWith('coverage_gap');
}

export function isSearchBenchmarkEligible(group: string): boolean {
  return !isLearningPath(group) && !isCoverageGap(group);
}

// ── DB Info ──
export function dbInfo() {
  return {
    DATABASE_URL: process.env.DATABASE_URL || '(default)',
    EMBEDDING_URL: process.env.EMBEDDING_BASE_URL || '(not set)',
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'bge-m3',
    LLM_URL: process.env.LLM_BASE_URL || '(not set)',
    LLM_MODEL: process.env.LLM_MODEL || 'deepseek-chat',
  };
}

// ── Benchmark Header ──
export function printBenchmarkHeader(totalCases: number, searchCount: number, lpCount: number, cgCount: number, extra?: Record<string, string>) {
  const db = dbInfo();
  console.log('═'.repeat(70));
  console.log('BENCHMARK HEADER');
  console.log('═'.repeat(70));
  console.log('  benchmark file:', BENCHMARK_FILE);
  console.log('  benchmark version:', 'v8-parity');
  console.log('  git commit:', GIT_COMMIT);
  console.log('  total cases loaded:', totalCases);
  console.log('  search cases:', searchCount);
  console.log('  learning-path cases:', lpCount);
  console.log('  excluded coverage_gap:', cgCount);
  console.log('  DATABASE_URL:', db.DATABASE_URL);
  console.log('  embedding provider:', db.EMBEDDING_URL);
  console.log('  embedding model:', db.EMBEDDING_MODEL);
  console.log('  candidateLimit:', BASELINE_SEARCH_CONFIG.candidateLimit);
  console.log('  maxResults:', BASELINE_SEARCH_CONFIG.maxResults);
  console.log('  minScore:', BASELINE_SEARCH_CONFIG.minScore);
  console.log('  hit policy: primaryIds only (secondaryIds/acceptedConcepts excluded from Search Benchmark)');
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      console.log(`  ${k}: ${v}`);
    }
  }
  console.log('═'.repeat(70));
}
