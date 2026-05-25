// backend/src/services/search/scripts/legacy-to-graph-draft.ts
// Reads legacy concept dictionary and generates ConceptNode drafts for graph migration.
// Run: npx tsx src/services/search/scripts/legacy-to-graph-draft.ts

import { getAllTopics } from '../concept-dictionary';
import { conceptLookup } from '../concept-dictionary';
import type { ConceptEntry } from '../concept-dictionary';

// Known domain mappings from deckHint
function domainFromDeckHint(hint?: string): string {
  const map: Record<string, string> = {
    'leetcode': 'leetcode',
    'machine-learning': 'machine-learning',
    'deep-learning': 'deep-learning',
    'llm': 'llm-agent-rag',
    'agent': 'llm-agent-rag',
    'statistics': 'data-science-statistics',
    'workplace': 'workplace-vibecoding',
    'vibe-coding': 'workplace-vibecoding',
  };
  return hint ? (map[hint] || 'unknown') : 'unknown';
}

interface NodeDraft {
  id: string;
  canonical: string;
  aliases: string[];
  domain: string;
  deckHint?: string;
  parentCategory?: string;
  coreKeywords: string[];
  searchAliases: string[];
  migrationStatus: 'generated' | 'manual' | 'reviewed' | 'deprecatedLegacy';
  // Generated relations — need human review for child/implementation/prerequisite
  suggestedRelations: Array<{ type: string; target: string; note: string }>;
  // Legacy data for reference
  legacyExpandedKeywords: string[];
  legacyLowPriorityKeywords: string[];
  legacyPrerequisiteKeywords: string[];
}

async function main() {
  console.log('=== Legacy Concept Dictionary → Graph Node Drafts ===\n');
  
  const topics = await getAllTopics();
  const drafts: NodeDraft[] = [];

  for (const t of topics) {
    const concept = await conceptLookup(t);
    if (!concept) continue;
    
    const domain = domainFromDeckHint(concept.deckHint);
    
    // Generate safe id from canonical topic
    const canonical = concept.canonicalTopic || concept.topic || t;
    const id = canonical.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Parent category → parent relation suggestion
    const suggestedRelations: NodeDraft['suggestedRelations'] = [];
    if (concept.parentCategory && concept.parentCategory !== canonical) {
      suggestedRelations.push({
        type: 'parent',
        target: concept.parentCategory,
        note: 'legacy parentCategory',
      });
    }
    
    // Expanded keywords → related relations
    for (const kw of (concept.expandedKeywords || []).slice(0, 8)) {
      suggestedRelations.push({
        type: 'related',
        target: kw,
        note: 'from legacy expandedKeywords',
      });
    }
    
    // Prerequisite → prerequisite relations
    for (const kw of (concept.prerequisiteKeywords || [])) {
      suggestedRelations.push({
        type: 'prerequisite',
        target: kw,
        note: 'from legacy prerequisiteKeywords',
      });
    }
    
    const draft: NodeDraft = {
      id,
      canonical,
      aliases: [canonical, ...(concept.topic !== canonical ? [concept.topic!] : [])],
      domain,
      deckHint: concept.deckHint,
      parentCategory: concept.parentCategory,
      coreKeywords: concept.coreKeywords || [canonical],
      searchAliases: concept.coreKeywords?.slice(0, 3) || [],
      migrationStatus: 'generated',
      suggestedRelations,
      legacyExpandedKeywords: concept.expandedKeywords || [],
      legacyLowPriorityKeywords: concept.lowPriorityKeywords || [],
      legacyPrerequisiteKeywords: concept.prerequisiteKeywords || [],
    };
    
    drafts.push(draft);
  }

  // Group by domain
  const byDomain = new Map<string, NodeDraft[]>();
  for (const d of drafts) {
    const arr = byDomain.get(d.domain) || [];
    arr.push(d);
    byDomain.set(d.domain, arr);
  }
  
  console.log(`Total drafts: ${drafts.length}`);
  console.log('');
  for (const [domain, nodes] of byDomain) {
    console.log(`  ${domain}: ${nodes.length} nodes`);
    for (const n of nodes.slice(0, 3)) {
      console.log(`    - ${n.canonical} (id: ${n.id})`);
    }
    if (nodes.length > 3) console.log(`    ... and ${nodes.length - 3} more`);
  }

  // Output JSON
  const output = JSON.stringify(drafts, null, 2);
  const outPath = '/Users/zhanhuilin/Desktop/interview-flashcards/backend/src/services/search/scripts/draft-nodes.json';
  require('fs').writeFileSync(outPath, output);
  console.log(`\nDrafts written to: ${outPath}`);
}

main().catch(console.error);
