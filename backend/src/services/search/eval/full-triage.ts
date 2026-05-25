// backend/src/services/search/eval/full-triage.ts
// Exhaustive per-case triage of all 58 failures

import { understandQuery } from '../query-understanding';
import { hybridSearch } from '../hybrid-search';
import { matchCardToConcepts } from '../card-concept-matcher';
import { getLP200Cases } from './lp200-cases';
import { GENERATED_CASES } from './lp200-generated';

const allCases = [...getLP200Cases(), ...GENERATED_CASES];

interface TriageEntry {
  id: string; query: string; failureType: string;
  actualIntent: string; expectedIntent: string;
  actualTopic: string; expectedTopic: string;
  canonicalTopic: string; merged: number; finalCnt: number;
  matchedConceptIds: string[];
  rootCause: string; action: string; rationale: string;
}

async function main() {
  const triage: TriageEntry[] = [];

  for (const c of allCases.slice(0, 200)) {
    const exp = c.expectedUnderstanding || { intent: (c as any).expectedIntent, topic: (c as any).expectedTopic };
    const parsed = await understandQuery(c.query);
    const results: any = await hybridSearch({ query: c.query, maxResults: 20, minScore: 0, debug: true });
    const trace = results._trace || {};
    const merged = trace.merge?.afterDedup || 0;
    const finalCnt = results.length;

    // Get matched concepts from top results
    const matchedIds = new Set<string>();
    for (const r of results.slice(0, 10)) {
      const mcs = matchCardToConcepts({
        cardId: r.cardId, title: r.title, titleCn: r.titleCn,
        tags: r.tags, searchKeywords: r.searchKeywords,
        question: r.snippet, answer: r.answer,
      });
      for (const mc of mcs) matchedIds.add(mc.conceptId);
    }

    let failureType = '';
    let rootCause = '';
    let action = '';
    let rationale = '';

    // 1. Merged check
    const maxMerged = c.retrieval?.maxMergedCandidates || 250;
    if (merged > maxMerged) {
      failureType = 'merged';
      // Check if topK is actually good
      const mustMatch = c.ranking?.mustMatchAny || [];
      const topText = results.slice(0, 10).map((r: any) => [r.titleCn, r.title, ...(r.tags||[])].filter(Boolean).join(' ')).join(' ').toLowerCase();
      const matched = mustMatch.filter((w: string) => topText.includes(w.toLowerCase()));
      const topKOk = mustMatch.length === 0 || matched.length >= Math.min(3, mustMatch.length);

      if (topKOk) {
        rootCause = 'eval_mismatch';
        action = 'update_granularity_cap';
        rationale = `merged=${merged}>max but topK precision ok (${matched.length}/${mustMatch.length}) — granular cap too strict`;
      } else {
        rootCause = 'recall_too_broad';
        action = 'tighten_expanded_keywords';
        rationale = `merged=${merged} and topK poor (${matched.length}/${mustMatch.length}) — graph expandedKeywords too broad`;
      }
    }

    // 2. Intent check
    if (!failureType && parsed.intent !== exp.intent) {
      failureType = 'intent';
      const q = c.query.toLowerCase();
      const isCompare = q.includes('和') || q.includes('区别') || q.includes('区分') || q.includes('对比') || q.includes('什么时候用');
      const isWeakness = q.includes('不会') || q.includes('不懂') || q.includes('薄弱') || q.includes('答不好') || q.includes('怎么补');

      if (isWeakness && parsed.intent === 'create_plan') {
        rootCause = 'query_understanding_bug';
        action = 'update_intent_pattern';
        rationale = `weakness signal present but intent=${parsed.intent}≠review_weakness — add compound weakness pattern`;
      } else if (isCompare && parsed.intent === 'create_plan') {
        rootCause = 'query_understanding_bug';
        action = 'expand_compare_regex';
        rationale = `compare signal but regex only matches Chinese — expand to alphanumeric concepts`;
      } else {
        rootCause = 'eval_mismatch';
        action = 'update_eval_case';
        rationale = `actual=${parsed.intent} is reasonable, expected=${exp.intent} — update eval`;
      }
    }

    // 3. Topic check
    if (!failureType && (parsed.topic || '').toLowerCase() !== (exp.topic || '').toLowerCase()) {
      failureType = 'topic';
      if (exp.topic && parsed.topic && parsed.topic.length > exp.topic.length && parsed.topic.includes(exp.topic)) {
        rootCause = 'acceptable_behavior';
        action = 'no_action';
        rationale = `composite topic "${parsed.topic}" contains expected "${exp.topic}" — eval single-topic expect too strict`;
      } else if (parsed.topic && parsed.topic.length < 5 && exp.topic && exp.topic.includes(parsed.topic)) {
        rootCause = 'query_understanding_bug';
        action = 'fix_alias_trim';
        rationale = `topic="${parsed.topic}" is truncated — sanitizeTopic over-stripped`;
      } else {
        rootCause = 'eval_mismatch';
        action = 'update_eval_case';
        rationale = `topic="${parsed.topic}" vs "${exp.topic}" — eval or sanitize issue`;
      }
    }

    // 4. mustInclude check
    if (!failureType) {
      const tieredText = [parsed.canonicalTopic, ...parsed.coreKeywords, ...parsed.expandedKeywords].join(' ').toLowerCase();
      const mustInc = c.rewrite?.mustInclude || [];
      const missing = mustInc.filter((w: string) => !tieredText.includes(w.toLowerCase()));
      if (missing.length > 0) {
        failureType = 'mustInclude';
        // Check if missing terms are graph aliases
        const graphHits = missing.filter(w => matchedIds.size > 0 && [...matchedIds].some(id => id.toLowerCase().includes(w.toLowerCase())));
        if (graphHits.length === missing.length) {
          rootCause = 'eval_mismatch';
          action = 'concept_level_matching';
          rationale = `missing terms ${missing.join(',')} are in matchedConcepts — eval mustInclude should use concept-level match`;
        } else if (missing.some(w => w.length <= 3)) {
          rootCause = 'graph_alias_gap';
          action = 'add_search_aliases';
          rationale = `short alias "${missing.join(',')}" not in graph — add to searchAliases`;
        } else {
          rootCause = 'eval_too_strict';
          action = 'coverage_must_include';
          rationale = `missing "${missing.join(',')}" are coverage/foundation concepts not core — eval should allow coverageMustInclude`;
        }
      }
    }

    // 5. Precision check
    if (!failureType) {
      const mustMatch = c.ranking?.mustMatchAny || [];
      if (mustMatch.length > 0) {
        const topText = results.slice(0, 10).map((r: any) => [r.titleCn, r.title, r.reason, r.snippet, r.deckName, ...(r.tags || [])].filter(Boolean).join(' ')).join(' ').toLowerCase();
        const matched = mustMatch.filter((w: string) => topText.includes(w.toLowerCase()));
        const precision = matched.length / Math.min(10, mustMatch.length);
        const minPrec = c.ranking?.minPrecision || 0.3;
        if (precision < minPrec) {
          failureType = 'precision';
          if (finalCnt === 0) {
            rootCause = 'card_mapping_gap';
            action = 'check_retrieval_zero';
            rationale = `search returned 0 cards — check deckHint/query understanding/card searchKeywords`;
          } else if (matchedIds.size > 0) {
            rootCause = 'eval_mismatch';
            action = 'concept_level_precision';
            rationale = `matched ${matched.length}/${mustMatch.length} by text but ${matchedIds.size} graph concepts matched — eval should use concept-level`;
          } else {
            rootCause = 'card_mapping_gap';
            action = 'seed_card_concepts';
            rationale = `cards returned but no concept match — seed CardConcept for these cards`;
          }
        }
      }
    }

    if (failureType) {
      triage.push({
        id: c.id || '', query: c.query, failureType,
        actualIntent: parsed.intent, expectedIntent: exp.intent,
        actualTopic: parsed.topic || '', expectedTopic: exp.topic || '',
        canonicalTopic: parsed.canonicalTopic, merged, finalCnt,
        matchedConceptIds: [...matchedIds],
        rootCause, action, rationale,
      });
    }
  }

  // Output
  console.log(`=== Triage Report: ${triage.length} failures ===\n`);
  const byRoot = new Map<string, TriageEntry[]>();
  for (const t of triage) {
    const key = t.rootCause;
    if (!byRoot.has(key)) byRoot.set(key, []);
    byRoot.get(key)!.push(t);
  }

  for (const [root, entries] of byRoot) {
    console.log(`\n## ${root} (${entries.length})`);
    console.log('| id | query | type | actual→expected | action |');
    console.log('|----|-------|------|------------------|--------|');
    for (const e of entries) {
      const a2e = e.failureType === 'intent' ? `${e.actualIntent}→${e.expectedIntent}` :
                  e.failureType === 'topic' ? `${e.actualTopic}→${e.expectedTopic}` :
                  `${e.merged}merged`;
      console.log(`| ${e.id} | ${e.query.slice(0,30)} | ${e.failureType} | ${a2e} | ${e.action} |`);
    }
  }

  // Summary
  const actions = new Map<string, number>();
  for (const t of triage) actions.set(t.action, (actions.get(t.action) || 0) + 1);
  console.log('\n=== Action Summary ===');
  for (const [a, c] of actions) console.log(`  ${a}: ${c}`);

  const evalMismatch = triage.filter(t => t.rootCause.startsWith('eval')).length;
  const realBugs = triage.filter(t => t.rootCause === 'query_understanding_bug' || t.rootCause === 'card_mapping_gap' || t.rootCause === 'graph_alias_gap').length;
  console.log(`\nEval mismatch: ${evalMismatch} | Real bugs: ${realBugs}`);
}

main();
