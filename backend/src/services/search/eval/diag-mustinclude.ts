import { understandQuery } from '../query-understanding';
import { conceptGraphLookup } from '../concept-graph';
import { getLP200Cases } from './lp200-cases';
import { GENERATED_CASES } from './lp200-generated';

async function main() {
  const all = [...getLP200Cases(), ...GENERATED_CASES];
  let count = 0;
  const gaps: Record<string, string[]> = {};
  for (const c of all.slice(0, 200)) {
    const parsed = await understandQuery(c.query);
    const tieredText = [parsed.canonicalTopic, ...parsed.coreKeywords, ...parsed.expandedKeywords].join(' ').toLowerCase();
    const mustInc = c.rewrite?.mustInclude || [];
    const missing = mustInc.filter((w: string) => !tieredText.includes(w.toLowerCase()));
    if (missing.length > 0) {
      count++;
      const node = conceptGraphLookup(parsed.canonicalTopic);
      const gid = node?.id || 'NONE';
      if (!gaps[gid]) gaps[gid] = [];
      gaps[gid].push(...missing);
      console.log(c.id, c.query.slice(0, 35), '→ canonical:', parsed.canonicalTopic, 'node:', gid, 'missing:', missing.join(','));
    }
  }
  console.log('\n=== Gap Summary ===');
  for (const [gid, words] of Object.entries(gaps)) {
    console.log(`  ${gid}: ${[...new Set(words)].join(', ')}`);
  }
  console.log(`\nTotal mustInclude failures: ${count}`);
}
main();
