import { resolveConceptFromGraph, getConceptEquivalents, getAllCanonicalTopics } from './search/concept-graph';
import type { GraphMatchResult } from './document-parser/types';

export function matchConceptToGraph(conceptName: string): GraphMatchResult {
  const trimmed = conceptName.trim();
  if (!trimmed) return { status: 'new_concept_candidate', reason: 'Empty concept name' };

  // 1. Try exact canonical match via resolveConceptFromGraph
  const resolved = resolveConceptFromGraph(trimmed);
  if (resolved.conceptGraphHit) {
    return {
      status: 'matched_graph_node',
      canonicalTopic: resolved.canonicalTopic,
      graphNodeId: resolved.graphNodeId,
      score: resolved.confidence,
      reason: `Matched graph node "${resolved.canonicalTopic}" via alias "${resolved.matchedAlias || 'exact'}"`,
    };
  }

  // 2. Try getConceptEquivalents for alias matching
  const equivs = getConceptEquivalents(trimmed);
  if (equivs.aliases.length > 0) {
    return {
      status: 'matched_graph_node',
      canonicalTopic: equivs.canonical,
      graphNodeId: equivs.canonical,
      score: 0.8,
      reason: `Matched via concept equivalents: ${equivs.aliases.slice(0, 3).join(', ')}`,
    };
  }

  // 3. Space/hyphen normalized match against all canonical topics
  const normalized = trimmed.replace(/[\s-]+/g, '').toLowerCase();
  const allTopics = getAllCanonicalTopics();
  const fuzzyMatch = allTopics.find(t => {
    const tn = t.replace(/[\s-]+/g, '').toLowerCase();
    return tn === normalized || tn.includes(normalized) || normalized.includes(tn);
  });
  if (fuzzyMatch) {
    const fm = resolveConceptFromGraph(fuzzyMatch);
    if (fm.conceptGraphHit) {
      return {
        status: 'matched_graph_node',
        canonicalTopic: fm.canonicalTopic,
        graphNodeId: fm.graphNodeId,
        score: 0.7,
        reason: `Fuzzy matched "${fuzzyMatch}" via normalized="${normalized}"`,
      };
    }
  }

  // 4. No match — mark as new concept candidate
  return {
    status: 'new_concept_candidate',
    reason: `No existing graph node for "${trimmed}"`,
  };
}
