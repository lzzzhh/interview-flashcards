import { understandQuery } from '../query-understanding';
import { hybridSearch } from '../hybrid-search';
import { getLP200Cases } from './lp200-cases';
import { GENERATED_CASES } from './lp200-generated';

const allCases = [...getLP200Cases(), ...GENERATED_CASES];

async function main() {
  const allFails: Record<string, { query: string; topic: string; expectedTopic: string; merged: number; reason: string }[]> = {
    merged: [], mustInclude: [], precision: [], intent: [], topic: [],
  };

  for (const c of allCases.slice(0, 200)) {
    const exp = c.expectedUnderstanding || { intent: c.expectedIntent, topic: c.expectedTopic };
    const parsed = await understandQuery(c.query);
    const results = await hybridSearch({ query: c.query, maxResults: 20, minScore: 0, debug: true });
    const merged = (results as any)._trace?.merge?.afterDedup || 0;

    // Check each failure type
    if (c.retrieval?.maxMergedCandidates && merged > c.retrieval.maxMergedCandidates) {
      allFails.merged.push({ query: c.query, topic: parsed.topic, expectedTopic: exp.topic, merged, reason: `merged=${merged}>max=${c.retrieval.maxMergedCandidates}` });
      continue;
    }

    if (parsed.intent !== exp.intent) {
      allFails.intent.push({ query: c.query, topic: parsed.topic, expectedTopic: exp.topic, merged, reason: `intent: ${parsed.intent}≠${exp.intent}` });
      continue;
    }

    if ((parsed.topic||'').toLowerCase() !== (exp.topic||'').toLowerCase()) {
      allFails.topic.push({ query: c.query, topic: parsed.topic, expectedTopic: exp.topic, merged, reason: `topic: ${parsed.topic}≠${exp.topic}` });
      continue;
    }

    const tieredText = [parsed.canonicalTopic, ...parsed.coreKeywords, ...parsed.expandedKeywords].join(' ').toLowerCase();
    const mustInc = c.rewrite?.mustInclude || [];
    if (mustInc.some((w: string) => !tieredText.includes(w.toLowerCase()))) {
      const missing = mustInc.filter((w: string) => !tieredText.includes(w.toLowerCase()));
      allFails.mustInclude.push({ query: c.query, topic: parsed.topic, expectedTopic: exp.topic, merged, reason: `missing: ${missing.join(',')}` });
      continue;
    }

    const mustMatch = c.ranking?.mustMatchAny || [];
    if (mustMatch.length > 0) {
      const top10 = results.slice(0, 10);
      const topText = top10.map((r: any) => [r.titleCn, r.title, r.reason, r.snippet, r.deckName, ...(r.tags||[])].filter(Boolean).join(' ')).join(' ').toLowerCase();
      const matched = mustMatch.filter((w: string) => topText.includes(w.toLowerCase()));
      if (matched.length < Math.min(10, mustMatch.length) * 0.3) {
        allFails.precision.push({ query: c.query, topic: parsed.topic, expectedTopic: exp.topic, merged, reason: `matched only ${matched.length}/${mustMatch.length}: ${matched.join(',')}` });
      }
    }
  }

  console.log(`Total failures: ${Object.values(allFails).reduce((s, a) => s + a.length, 0)}\n`);
  for (const [type, fails] of Object.entries(allFails)) {
    console.log(`=== ${type} (${fails.length}) ===`);
    for (const f of fails) {
      console.log(`  q="${f.query.slice(0,40)}" topic=${f.topic} expected=${f.expectedTopic} merged=${f.merged} — ${f.reason}`);
    }
  }
}

main();
