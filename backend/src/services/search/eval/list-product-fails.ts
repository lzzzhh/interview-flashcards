// backend/src/services/search/eval/list-product-fails.ts
// Lists all product-fit (core+common) failures with detail

import { understandQuery } from '../query-understanding';
import { hybridSearch } from '../hybrid-search';
import { getLP200Cases } from './lp200-cases';
import { GENERATED_CASES } from './lp200-generated';

const fs = require('fs');
const classified = JSON.parse(fs.readFileSync('src/services/search/eval/realism-classified.json', 'utf8'));

async function main() {
  const allCases: any[] = [...getLP200Cases(), ...GENERATED_CASES];
  const realismMap = new Map<string, any>();
  for (const r of classified) realismMap.set(r.id, r);

  const fails: any[] = [];

  for (const c of allCases.slice(0, 200)) {
    const r = realismMap.get(c.id) || { realism: 'common' };
    if (r.realism !== 'core' && r.realism !== 'common') continue;

    const exp = c.expectedUnderstanding || { intent: c.expectedIntent, topic: c.expectedTopic };
    const parsed = await understandQuery(c.query);

    // Check all failure types
    const issues: string[] = [];
    
    if (parsed.intent !== exp.intent) issues.push(`intent=${parsed.intent}≠${exp.intent}`);
    if ((parsed.topic||'').toLowerCase() !== (exp.topic||'').toLowerCase()) issues.push(`topic=${parsed.topic}≠${exp.topic}`);
    
    const tieredText = [parsed.canonicalTopic, ...parsed.coreKeywords, ...parsed.expandedKeywords].join(' ').toLowerCase();
    const mustInc = c.rewrite?.mustInclude || [];
    const missing = mustInc.filter((w: string) => !tieredText.includes(w.toLowerCase()));
    if (missing.length > 0) issues.push(`mustInclude missing: ${missing.join(',')}`);

    const results = await hybridSearch({ query: c.query, maxResults: 20, minScore: 0, debug: true });
    const trace = (results as any)._trace || {};
    const merged = trace.merge?.afterDedup || 0;
    const maxMerged = c.retrieval?.maxMergedCandidates || 250;
    if (merged > maxMerged) issues.push(`merged=${merged}>${maxMerged}`);

    const mustMatch = c.ranking?.mustMatchAny || [];
    if (mustMatch.length > 0 && issues.length === 0) {
      const topText = results.slice(0, 10).map((r2: any) => [r2.titleCn, r2.title, r2.reason, r2.snippet, r2.deckName, ...(r2.tags||[])].filter(Boolean).join(' ')).join(' ').toLowerCase();
      const matched = mustMatch.filter((w: string) => topText.includes(w.toLowerCase()));
      const prec = matched.length / Math.min(10, mustMatch.length);
      if (prec < (c.ranking?.minPrecision || 0.3)) issues.push(`precision=${prec.toFixed(2)} (matched ${matched.length}/${mustMatch.length})`);
    }

    if (issues.length > 0) {
      fails.push({
        id: c.id, query: c.query, realism: r.realism, weight: r.weight,
        actualIntent: parsed.intent, expectedIntent: exp.intent,
        actualTopic: parsed.topic, expectedTopic: exp.topic,
        canonicalTopic: parsed.canonicalTopic, merged,
        issues: issues.join(' | '),
        tierOwner: parsed.tierOwner,
        conceptSource: parsed.conceptSource,
      });
    }
  }

  // Sort by realism then id
  fails.sort((a, b) => a.id.localeCompare(b.id));

  console.log(`\n=== Product-fit Failures: ${fails.length} ===\n`);
  console.log('| # | id | query | realism | wt | actual → expected | issues | tierOwner |');
  console.log('|---|-----|-------|---------|-----|-------------------|--------|-----------|');

  let coreFails = 0, commonFails = 0;
  for (const f of fails) {
    const a2e = f.issues.includes('intent') ? `${f.actualIntent}→${f.expectedIntent}` :
                f.issues.includes('topic') ? `${f.actualTopic}→${f.expectedTopic}` :
                f.issues.includes('merged') ? `${f.merged}merged` : '—';
    console.log(`| ${fails.indexOf(f)+1} | ${f.id} | ${f.query.slice(0,30)} | ${f.realism} | ${f.weight} | ${a2e.slice(0,25)} | ${f.issues.slice(0,50)} | ${f.tierOwner} |`);
    if (f.realism === 'core') coreFails++; else commonFails++;
  }

  console.log(`\nCore fails: ${coreFails} | Common fails: ${commonFails}`);

  // Group by issue type
  const byIssue = new Map<string, number>();
  for (const f of fails) {
    for (const issue of f.issues.split(' | ')) {
      const type = issue.split('=')[0].split(' ')[0];
      byIssue.set(type, (byIssue.get(type) || 0) + 1);
    }
  }
  console.log('\nBy issue type:');
  for (const [t, c] of byIssue) console.log(`  ${t}: ${c}`);
}

main();
