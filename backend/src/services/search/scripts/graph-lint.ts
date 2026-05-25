// backend/src/services/search/scripts/graph-lint.ts
// Validates Concept Graph nodes for quality guardrails.
// Run: npx tsx src/services/search/scripts/graph-lint.ts

import { conceptGraphLookup, getRelatedConcepts } from '../concept-graph';
import type { ConceptNode } from '../concept-graph';

// Access NODES array (private — use getAllNodes via export)
// We'll use conceptGraphLookup on all known aliases

const fs = require('fs');
const graphSrc = fs.readFileSync('src/services/search/concept-graph.ts', 'utf8');

// Extract all nodes from source
function extractNodes(): ConceptNode[] {
  // Parse node entries from source
  const nodes: ConceptNode[] = [];
  // Find all node ids
  const idRe = /id: '([^']+)'/g;
  let m;
  while ((m = idRe.exec(graphSrc)) !== null) {
    const id = m[1];
    // Use conceptGraphLookup to get the full node
    const canonical = graphSrc.match(new RegExp(`id: '${id}'[^}]*canonical: '([^']+)'`))?.[1] || id;
    const aliasesMatch = graphSrc.match(new RegExp(`id: '${id}'[^\\]]*aliases: \\[([^\\]]+)\\]`));
    const aliases: string[] = aliasesMatch ? aliasesMatch[1].split(',').map(a => a.trim().replace(/'/g, '')) : [];
    const domainMatch = graphSrc.match(new RegExp(`id: '${id}'[^']*domain: '([^']+)'`));
    const domain = domainMatch?.[1] || 'unknown';
    const statusMatch = graphSrc.match(new RegExp(`id: '${id}'[^']*migrationStatus: '([^']+)'`));
    const status = (statusMatch?.[1] || 'manual') as ConceptNode['migrationStatus'];
    const parentMatch = graphSrc.match(new RegExp(`id: '${id}'[^']*parentCategory: '([^']+)'`));
    const parent = parentMatch?.[1] || undefined;
    const deckMatch = graphSrc.match(new RegExp(`id: '${id}'[^']*deckHint: '([^']+)'`));
    const deck = deckMatch?.[1] || undefined;
    const relationsMatch = graphSrc.match(new RegExp(`id: '${id}'[^\\]]*relations: \\[([^\\]]*)\\]`, 's'));
    const rels: any[] = [];
    if (relationsMatch) {
      const relRe = /type: '(\w+)', target: '([^']+)'/g;
      let rm;
      while ((rm = relRe.exec(relationsMatch[1])) !== null) {
        rels.push({ type: rm[1], target: rm[2] });
      }
    }
    
    nodes.push({
      id, canonical, aliases, deckHint: deck, parentCategory: parent,
      coreKeywords: [], searchAliases: [],
      relations: rels,
      migrationStatus: status, domain,
    });
  }
  return nodes;
}

const nodes = extractNodes();
console.log(`Graph lint: ${nodes.length} nodes\n`);

let errors=0, warnings=0;

// 1. Required fields
for (const n of nodes) {
  if (!n.id) { console.log(`ERROR: node "${n.canonical}" missing id`); errors++; }
  if (!n.canonical) { console.log(`ERROR: node "${n.id}" missing canonical`); errors++; }
  if (!n.aliases || n.aliases.length===0) { console.log(`WARN: node "${n.id}" no aliases`); warnings++; }
  if (!n.deckHint && !n.parentCategory) { console.log(`WARN: node "${n.id}" no deckHint or parentCategory`); warnings++; }
  if (!n.domain || n.domain==='unknown') { console.log(`WARN: node "${n.id}" domain unknown`); warnings++; }
}

// 2. Relation target exists
for (const n of nodes) {
  for (const r of n.relations) {
    const target = nodes.find(x => x.id === r.target || x.canonical === r.target);
    // Also check aliases
    const byAlias = nodes.find(x => x.aliases.some(a => a === r.target));
    if (!target && !byAlias) {
      console.log(`WARN: node "${n.id}" relation "${r.type}→${r.target}" targets non-existent node`);
      warnings++;
    }
  }
}

// 3. Parent relation must not be in core/expanded (checked at runtime)

// 4. ParentCategory != canonicalTopic
for (const n of nodes) {
  if (n.parentCategory && n.parentCategory === n.canonical) {
    console.log(`WARN: node "${n.id}" parentCategory = canonicalTopic (self-referencing)`);
    warnings++;
  }
}

// 5. Cycle detection (parent/prerequisite only)
function detectCycle(startId: string, visited: Set<string>, relationTypes: string[]): boolean {
  if (visited.has(startId)) return true;
  visited.add(startId);
  const n = nodes.find(x => x.id === startId);
  if (!n) return false;
  for (const r of n.relations) {
    if (!relationTypes.includes(r.type)) continue;
    if (detectCycle(r.target, new Set(visited), relationTypes)) return true;
  }
  return false;
}
for (const n of nodes) {
  if (detectCycle(n.id, new Set(), ['parent'])) {
    console.log(`ERROR: node "${n.id}" has parent cycle`);
    errors++;
  }
  if (detectCycle(n.id, new Set(), ['prerequisite'])) {
    console.log(`ERROR: node "${n.id}" has prerequisite cycle`);
    errors++;
  }
}

// 6. Orphan nodes with no relations
const orphans = nodes.filter(n => n.relations.length === 0);
if (orphans.length > 0) {
  console.log(`WARN: ${orphans.length} orphan nodes (no relations): ${orphans.slice(0,5).map(n=>n.id).join(', ')}...`);
  warnings++;
}

// 7. Domain distribution
const domains = new Map<string, number>();
for (const n of nodes) domains.set(n.domain, (domains.get(n.domain)||0)+1);
console.log(`\nDomains:`);
for (const [d, c] of domains) console.log(`  ${d}: ${c}`);

console.log(`\nResult: ${errors} errors, ${warnings} warnings`);
if (errors === 0) console.log('LINT: PASS');
else console.log('LINT: FAIL');
