// backend/src/services/ingestion/coverage-gap-detector.ts
// Coverage Gap Detector — identifies benchmark queries with recall failure
//
// For each failing query in the benchmark, checks:
// 1. Is the expected primaryId card in the DB?
// 2. Is the card in candidate pool (recall)?
// 3. Why didn't it rank well (keyword/vector/score)?

import prisma from '../../db/prisma';
import { hybridSearch } from '../search/hybrid-search';
import { TEST_CASES } from '../../evaluation/test-cases';
import { computeCaseResult } from '../../evaluation/metrics';
import { BASELINE_SEARCH_CONFIG } from '../../evaluation/eval-config';

export interface GapReport {
  query: string;
  group: string;
  primaryIds: string[];
  missingIds: string[];
  buriedIds: string[];
  top15Found: string[];
  // Per-missing-card analysis
  cardAnalysis: {
    cardId: string;
    exists: boolean;
    hasSearchKeywords: boolean;
    inCandidatePool: boolean;
    poolRank: number;
    poolScore: number;
    vectorScore: number;
    keywordScore: number;
    reason: 'no_card' | 'no_keywords' | 'not_in_pool' | 'low_rank' | 'found';
  }[];
  classification: 'coverage_gap' | 'keyword_gap' | 'ranking_issue' | 'ok';
}

async function analyzeCard(cardId: string, hits: any[]): Promise<GapReport['cardAnalysis'][0]> {
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) {
    return { cardId, exists: false, hasSearchKeywords: false, inCandidatePool: false, poolRank: -1, poolScore: 0, vectorScore: 0, keywordScore: 0, reason: 'no_card' };
  }

  const hasKw = (card.searchKeywords || '').trim().length > 0;
  const poolIdx = hits.findIndex((h: any) => h.cardId === cardId);
  const inPool = poolIdx >= 0;
  const poolRank = inPool ? poolIdx + 1 : -1;
  const poolScore = inPool ? hits[poolIdx].score : 0;

  const sb = inPool ? hits[poolIdx].scoreBreakdown : null;
  const vectorScore = sb?.vectorScore ?? 0;
  const keywordScore = sb?.keywordScore ?? 0;

  let reason: GapReport['cardAnalysis'][0]['reason'];
  if (!hasKw) reason = 'no_keywords';
  else if (!inPool) reason = 'not_in_pool';
  else if (poolRank > 15) reason = 'low_rank';
  else reason = 'found';

  return { cardId, exists: true, hasSearchKeywords: hasKw, inCandidatePool: inPool, poolRank, poolScore, vectorScore, keywordScore, reason };
}

function classify(primaryIds: string[], analysis: GapReport['cardAnalysis']): GapReport['classification'] {
  if (analysis.some(a => a.reason === 'no_card')) return 'coverage_gap';
  if (analysis.some(a => a.reason === 'no_keywords')) return 'keyword_gap';
  if (analysis.some(a => a.reason === 'low_rank' || a.reason === 'not_in_pool')) return 'ranking_issue';
  return 'ok';
}

export async function detectCoverageGaps(): Promise<GapReport[]> {
  const gaps: GapReport[] = [];

  for (const tc of TEST_CASES) {
    // Skip learning-path queries
    if (tc.group === 'learning-path' || tc.group?.startsWith('学习路径')) continue;

    const hits = await hybridSearch({
      query: tc.query,
      maxResults: BASELINE_SEARCH_CONFIG.maxResults,
      minScore: BASELINE_SEARCH_CONFIG.minScore,
      candidateLimit: BASELINE_SEARCH_CONFIG.candidateLimit,
    });

    const cr = computeCaseResult(tc, hits, 0);
    if (cr.primaryMissing.length === 0 && cr.primaryBuried.length === 0) continue;

    const cardAnalysis: GapReport['cardAnalysis'] = [];
    for (const cid of cr.primaryMissing) {
      cardAnalysis.push(await analyzeCard(cid, hits));
    }
    for (const cid of cr.primaryBuried) {
      cardAnalysis.push(await analyzeCard(cid, hits));
    }

    gaps.push({
      query: tc.query,
      group: tc.group || 'unknown',
      primaryIds: tc.primaryIds || [],
      missingIds: cr.primaryMissing,
      buriedIds: cr.primaryBuried,
      top15Found: cr.primaryHitTop15,
      cardAnalysis,
      classification: classify(tc.primaryIds || [], cardAnalysis),
    });
  }

  return gaps;
}

export function printGapReport(gaps: GapReport[]): void {
  console.log('═'.repeat(70));
  console.log('COVERAGE GAP DETECTOR');
  console.log('═'.repeat(70));

  const byCategory = {
    coverage_gap: gaps.filter(g => g.classification === 'coverage_gap'),
    keyword_gap: gaps.filter(g => g.classification === 'keyword_gap'),
    ranking_issue: gaps.filter(g => g.classification === 'ranking_issue'),
    ok: gaps.filter(g => g.classification === 'ok'),
  };

  console.log(`\n  Total gaps: ${gaps.length}`);
  console.log(`  coverage_gap:   ${byCategory.coverage_gap.length}`);
  console.log(`  keyword_gap:    ${byCategory.keyword_gap.length}`);
  console.log(`  ranking_issue:  ${byCategory.ranking_issue.length}`);
  console.log('');

  if (byCategory.coverage_gap.length > 0) {
    console.log('── coverage_gap (card does not exist) ──');
    for (const g of byCategory.coverage_gap) {
      console.log(`  "${g.query.slice(0, 60)}"`);
      console.log(`    missing cards: [${g.missingIds.join(', ')}]`);
    }
    console.log('');
  }

  if (byCategory.keyword_gap.length > 0) {
    console.log('── keyword_gap (card exists but no searchKeywords) ──');
    for (const g of byCategory.keyword_gap) {
      const noKwIds = g.cardAnalysis.filter(a => a.reason === 'no_keywords').map(a => a.cardId);
      console.log(`  "${g.query.slice(0, 60)}" → cards without keywords: [${noKwIds.join(', ')}]`);
    }
    console.log('');
  }

  if (byCategory.ranking_issue.length > 0) {
    console.log('── ranking_issue (card exists but not ranking) ──');
    for (const g of byCategory.ranking_issue.slice(0, 10)) {
      console.log(`  "${g.query.slice(0, 60)}"`);
      for (const a of g.cardAnalysis) {
        console.log(`    ${a.cardId}: rank=${a.poolRank} vec=${a.vectorScore.toFixed(3)} kw=${a.keywordScore.toFixed(3)}`);
      }
    }
    if (byCategory.ranking_issue.length > 10) {
      console.log(`  ... and ${byCategory.ranking_issue.length - 10} more`);
    }
    console.log('');
  }
}
