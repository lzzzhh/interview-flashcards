// Neo4j graph search — concept lookup, query expansion, and graph scoring
// Used by the Neo4j hybrid search pipeline for evaluating Neo4j vs static graph

import { getNeo4jSession, isNeo4jAvailable } from '../neo4j/neo4j-client';
import type { KeywordTiers } from './concept-graph';

export interface Neo4jGraphContext {
  matchedConcepts: string[];
  expandedConcepts: string[];
  deckHints: string[];
  paths: Array<{ from: string; to: string; relType: string }>;
  keywordTiers: {
    coreKeywords: string[];
    expandedKeywords: string[];
    prerequisiteKeywords: string[];
    lowPriorityKeywords: string[];
  };
  graphScore: number;
  graphScoreBreakdown: Record<string, number>;
}

interface MatchedConcept {
  id: string;
  canonical: string;
  matchedField: string;
}

/** Look up concepts matching the query via canonical/aliases/coreKeywords/searchAliases */
export async function neo4jConceptLookup(query: string): Promise<MatchedConcept[]> {
  const session = getNeo4jSession();
  if (!session) return [];

  try {
    const result = await session.run(
      `MATCH (c:Concept)
       WHERE toLower(c.canonical) CONTAINS toLower($query)
          OR any(a IN c.aliases WHERE toLower(a) CONTAINS toLower($query))
          OR any(k IN c.coreKeywords WHERE toLower(k) CONTAINS toLower($query))
          OR any(s IN c.searchAliases WHERE toLower(s) CONTAINS toLower($query))
       RETURN c.id AS id, c.canonical AS canonical,
              CASE WHEN toLower(c.canonical) = toLower($query) THEN 'canonical'
                   WHEN any(a IN c.aliases WHERE toLower(a) = toLower($query)) THEN 'alias'
                   ELSE 'keyword' END AS matchedField
       ORDER BY CASE WHEN toLower(c.canonical) = toLower($query) THEN 0
                     WHEN any(a IN c.aliases WHERE toLower(a) = toLower($query)) THEN 1
                     ELSE 2 END
       LIMIT 20`,
      { query }
    );
    return result.records.map(r => ({
      id: r.get('id'),
      canonical: r.get('canonical'),
      matchedField: r.get('matchedField'),
    }));
  } catch (e: any) {
    console.warn(`[neo4j-graph] Concept lookup failed: ${e.message}`);
    return [];
  } finally {
    await session.close();
  }
}

/** Expand query — find concepts via one-hop and two-hop relationships */
export async function neo4jExpandQuery(query: string): Promise<MatchedConcept[]> {
  const session = getNeo4jSession();
  if (!session) return [];

  try {
    const result = await session.run(
      `MATCH (c:Concept)
       WHERE toLower(c.canonical) CONTAINS toLower($query)
          OR any(a IN c.aliases WHERE toLower(a) CONTAINS toLower($query))
       MATCH (c)-[r]->(related:Concept)
       WHERE type(r) IN ['CHILD', 'PARENT', 'PREREQUISITE', 'FOUNDATION', 'RELATED', 'IMPLEMENTATION', 'CONTRAST', 'ADVANCED']
       RETURN DISTINCT related.id AS id, related.canonical AS canonical, type(r) AS relType
       LIMIT 30`,
      { query }
    );
    return result.records.map(r => ({
      id: r.get('id'),
      canonical: r.get('canonical'),
      matchedField: r.get('relType'),
    }));
  } catch (e: any) {
    console.warn(`[neo4j-graph] Query expansion failed: ${e.message}`);
    return [];
  } finally {
    await session.close();
  }
}

// ── Phase 1 Enhanced: Multi-hop + Bilingual ──

/** 2-hop subgraph expansion — traverse 2 hops from matched concepts to find broader related concepts */
export async function neo4jMultiHopExpand(conceptIds: string[], depth: number = 2): Promise<Array<{ id: string; canonical: string; distance: number; relTypes: string[] }>> {
  const session = getNeo4jSession();
  if (!session || conceptIds.length === 0) return [];

  try {
    const result = await session.run(
      `MATCH path = (start:Concept)-[*1..${depth}]-(related:Concept)
       WHERE start.id IN $conceptIds AND related.id <> start.id
       WITH related, relationships(path) AS rels, length(path) AS distance
       WHERE distance <= ${depth}
       RETURN DISTINCT related.id AS id, related.canonical AS canonical, 
              min(distance) AS distance, 
              [r IN rels | type(r)] AS relTypes
       ORDER BY distance
       LIMIT 50`,
      { conceptIds }
    );
    return result.records.map(r => ({
      id: r.get('id'),
      canonical: r.get('canonical'),
      distance: r.get('distance').toNumber(),
      relTypes: r.get('relTypes'),
    }));
  } catch (e: any) {
    console.warn(`[neo4j-graph] Multi-hop expand failed: ${e.message}`);
    return [];
  } finally {
    await session.close();
  }
}

/** Bilingual concept matching — match individual query tokens against Chinese AND English fields */
export async function neo4jBilingualMatch(query: string): Promise<MatchedConcept[]> {
  const session = getNeo4jSession();
  if (!session) return [];

  // Split query into tokens for granular matching
  const tokens = query
    .replace(/[，,、。！？\s]+/g, ' ')
    .split(' ')
    .filter(t => t.length >= 2 && t.length <= 20);

  if (tokens.length === 0) return [];

  try {
    // Match any token against any field
    const tokenParams: Record<string, string> = {};
    const conditions = tokens.map((t, i) => {
      const key = `t${i}`;
      tokenParams[key] = t.toLowerCase();
      return `toLower(c.canonical) CONTAINS $${key}
           OR any(a IN c.aliases WHERE toLower(a) CONTAINS $${key})
           OR any(k IN c.coreKeywords WHERE toLower(k) CONTAINS $${key})
           OR any(s IN c.searchAliases WHERE toLower(s) CONTAINS $${key})`;
    });

    const result = await session.run(
      `MATCH (c:Concept)
       WHERE ${conditions.join('\n           OR ')}
       RETURN c.id AS id, c.canonical AS canonical, c.aliases AS aliases, c.coreKeywords AS coreKeywords
       LIMIT 30`,
      tokenParams
    );
    return result.records.map(r => ({
      id: r.get('id'),
      canonical: r.get('canonical'),
      matchedField: 'token',
    }));
  } catch (e: any) {
    console.warn(`[neo4j-graph] Bilingual match failed: ${e.message}`);
    return [];
  } finally {
    await session.close();
  }
}

/** V4 Enhanced keyword tiers: combines 1-hop + 2-hop + bilingual token matching */
export async function neo4jBuildKeywordTiersV4(query: string): Promise<{
  tiers: { coreKeywords: string[]; expandedKeywords: string[]; prerequisiteKeywords: string[]; lowPriorityKeywords: string[] };
  context: {
    matchedConcepts: string[];
    expandedConcepts: string[];
    twoHopConcepts: string[];
    deckHints: string[];
    paths: Array<{ from: string; to: string; relType: string }>;
  };
}> {
  if (!isNeo4jAvailable()) {
    return {
      tiers: { coreKeywords: [], expandedKeywords: [], prerequisiteKeywords: [], lowPriorityKeywords: [] },
      context: { matchedConcepts: [], expandedConcepts: [], twoHopConcepts: [], deckHints: [], paths: [] },
    };
  }

  // Run all expansions in parallel
  const [matched, expanded, bilingual] = await Promise.all([
    neo4jConceptLookup(query),
    neo4jExpandQuery(query),
    neo4jBilingualMatch(query),
  ]);

  const matchedIds = [...new Set([...matched.map(m => m.id), ...bilingual.map(b => b.id)])];
  const expandedIds = expanded.map(e => e.id);

  // 2-hop from matched concepts
  const twoHop = await neo4jMultiHopExpand(matchedIds.slice(0, 5), 2);
  const twoHopIds = twoHop.map(t => t.id);

  // Deck hints
  const session = getNeo4jSession();
  const deckHints: string[] = [];
  const paths: Array<{ from: string; to: string; relType: string }> = [];
  let prerequisiteCanonicals: string[] = [];

  if (session) {
    try {
      const deckResult = await session.run(
        `MATCH (c:Concept)-[:BELONGS_TO]->(d:Deck)
         WHERE c.id IN $conceptIds
         RETURN DISTINCT d.id AS deckId`,
        { conceptIds: [...matchedIds, ...expandedIds, ...twoHopIds] }
      );
      deckHints.push(...deckResult.records.map(r => r.get('deckId')));

      // Prerequisite expansion
      const prereqResult = await session.run(
        `MATCH (c:Concept)-[:PREREQUISITE|FOUNDATION*1..2]->(prereq:Concept)
         WHERE c.id IN $conceptIds
         RETURN DISTINCT prereq.canonical AS canonical`,
        { conceptIds: matchedIds }
      );
      prerequisiteCanonicals = prereqResult.records.map(r => r.get('canonical'));

      for (const exp of expanded) {
        if (exp.matchedField) {
          paths.push({ from: matchedIds[0] || query, to: exp.id, relType: exp.matchedField });
        }
      }
    } catch (e: any) {
      console.warn(`[neo4j-graph] V4 context failed: ${e.message}`);
    } finally {
      await session.close();
    }
  }

  return {
    tiers: {
      coreKeywords: [...new Set([...matched.map(m => m.canonical), ...bilingual.map(b => b.canonical)])].slice(0, 12),
      expandedKeywords: [...new Set(expanded.map(e => e.canonical))].slice(0, 25),
      prerequisiteKeywords: [...new Set(prerequisiteCanonicals)].slice(0, 12),
      lowPriorityKeywords: [...new Set(twoHop.map(t => t.canonical))].slice(0, 20),
    },
    context: {
      matchedConcepts: matchedIds,
      expandedConcepts: expandedIds,
      twoHopConcepts: twoHopIds,
      deckHints,
      paths,
    },
  };
}

/** Find concepts related to a given concept at specified depth */
export async function neo4jFindRelatedConcepts(
  conceptId: string,
  depth: number = 2
): Promise<Array<{ id: string; canonical: string; relType: string; distance: number }>> {
  const session = getNeo4jSession();
  if (!session) return [];

  try {
    const result = await session.run(
      `MATCH path = (start:Concept {id: $conceptId})-[*1..${depth}]-(related:Concept)
       WHERE related.id <> start.id
       RETURN related.id AS id, related.canonical AS canonical,
              type(relationships(path)[0]) AS relType,
              length(path) AS distance
       ORDER BY distance, relType
       LIMIT 50`,
      { conceptId }
    );
    return result.records.map(r => ({
      id: r.get('id'),
      canonical: r.get('canonical'),
      relType: r.get('relType'),
      distance: r.get('distance').toNumber(),
    }));
  } catch (e: any) {
    console.warn(`[neo4j-graph] Related concepts failed: ${e.message}`);
    return [];
  } finally {
    await session.close();
  }
}

/** Build keyword tiers from Neo4j graph traversal */
export async function neo4jBuildKeywordTiers(query: string): Promise<{
  tiers: KeywordTiers;
  context: {
    matchedConcepts: string[];
    expandedConcepts: string[];
    deckHints: string[];
    paths: Array<{ from: string; to: string; relType: string }>;
  };
}> {
  if (!isNeo4jAvailable()) {
    return {
      tiers: { coreKeywords: [], expandedKeywords: [], prerequisiteKeywords: [], lowPriorityKeywords: [] },
      context: { matchedConcepts: [], expandedConcepts: [], deckHints: [], paths: [] },
    };
  }

  const matched = await neo4jConceptLookup(query);
  const expanded = await neo4jExpandQuery(query);

  const matchedIds = matched.map(m => m.id);
  const expandedIds = expanded.map(e => e.id);

  // Collect deck hints from matched + expanded
  const session = getNeo4jSession();
  const deckHints: string[] = [];
  const paths: Array<{ from: string; to: string; relType: string }> = [];
  let prerequisiteInfo: Array<{ id: string; canonical: string }> = [];

  if (session) {
    try {
      // Get deck hints
      const deckResult = await session.run(
        `MATCH (c:Concept)-[:BELONGS_TO]->(d:Deck)
         WHERE c.id IN $conceptIds
         RETURN DISTINCT d.id AS deckId`,
        { conceptIds: [...matchedIds, ...expandedIds] }
      );
      deckHints.push(...deckResult.records.map(r => r.get('deckId')));

      // Get prerequisite concepts (2-hop PREREQUISITE + FOUNDATION traversal)
      const prereqResult = await session.run(
        `MATCH (c:Concept)-[:PREREQUISITE|FOUNDATION*1..2]->(prereq:Concept)
         WHERE c.id IN $conceptIds
         RETURN DISTINCT prereq.id AS id, prereq.canonical AS canonical`,
        { conceptIds: matchedIds }
      );
      prerequisiteInfo = prereqResult.records.map(r => ({
        id: r.get('id'),
        canonical: r.get('canonical'),
      }));

      // Collect paths for tracing
      for (const exp of expanded) {
        if (exp.matchedField) {
          paths.push({ from: matchedIds[0] || query, to: exp.id, relType: exp.matchedField });
        }
      }
    } catch (e: any) {
      console.warn(`[neo4j-graph] Build keyword tiers failed: ${e.message}`);
    } finally {
      await session.close();
    }
  }

  // Build keyword tiers
  const coreKeywords = new Set<string>();
  const expandedKeywords = new Set<string>();
  const prerequisiteKeywords = new Set<string>();

  for (const m of matched) coreKeywords.add(m.canonical);
  for (const e of expanded) expandedKeywords.add(e.canonical);
  for (const p of prerequisiteInfo) prerequisiteKeywords.add(p.canonical);

  return {
    tiers: {
      coreKeywords: [...coreKeywords].slice(0, 10),
      expandedKeywords: [...expandedKeywords].slice(0, 20),
      prerequisiteKeywords: [...prerequisiteKeywords].slice(0, 10),
      lowPriorityKeywords: [],
    },
    context: {
      matchedConcepts: matchedIds,
      expandedConcepts: expandedIds,
      deckHints,
      paths,
    },
  };
}

/** Compute graph score for a card given the Neo4j graph context */
export function neo4jGraphScore(
  card: { canonicalTopic?: string; canonicalConcept?: string; tags?: string[]; searchKeywords?: string[] },
  context: Neo4jGraphContext
): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let score = 0;

  const matchFields = [
    card.canonicalTopic || '',
    card.canonicalConcept || '',
    ...(card.tags || []),
    ...(card.searchKeywords || []),
  ].map(f => f.toLowerCase());

  // Concept match scoring
  let conceptMatch = 0;
  for (const conceptId of context.matchedConcepts) {
    if (matchFields.some(f => f.includes(conceptId.toLowerCase()))) {
      conceptMatch += 0.30;
    }
  }
  conceptMatch = Math.min(conceptMatch, 1.0);
  breakdown.conceptMatch = conceptMatch;
  score += conceptMatch * 0.30;

  // Expanded concept scoring
  let expandedMatch = 0;
  for (const conceptId of context.expandedConcepts) {
    if (matchFields.some(f => f.includes(conceptId.toLowerCase()))) {
      expandedMatch += 0.15;
    }
  }
  expandedMatch = Math.min(expandedMatch, 0.6);
  breakdown.expandedMatch = expandedMatch;
  score += expandedMatch * 0.20;

  // Keyword tier match
  let keywordTierMatch = 0;
  const allKeywords = [
    ...context.keywordTiers.coreKeywords,
    ...context.keywordTiers.expandedKeywords,
    ...context.keywordTiers.prerequisiteKeywords,
  ];
  for (const kw of allKeywords) {
    if (matchFields.some(f => f.includes(kw.toLowerCase()))) {
      keywordTierMatch += 0.10;
    }
  }
  keywordTierMatch = Math.min(keywordTierMatch, 0.5);
  breakdown.keywordTierMatch = keywordTierMatch;
  score += keywordTierMatch * 0.15;

  // Deck match
  let deckMatch = 0;
  if (card.tags) {
    for (const deckHint of context.deckHints) {
      if (card.tags.some(t => t.toLowerCase() === deckHint.toLowerCase())) {
        deckMatch += 0.20;
      }
    }
  }
  deckMatch = Math.min(deckMatch, 0.5);
  breakdown.deckMatch = deckMatch;
  score += deckMatch * 0.15;

  // Prerequisite match (for learning path value)
  let prereqMatch = 0;
  for (const kw of context.keywordTiers.prerequisiteKeywords) {
    if (matchFields.some(f => f.includes(kw.toLowerCase()))) {
      prereqMatch += 0.15;
    }
  }
  prereqMatch = Math.min(prereqMatch, 0.4);
  breakdown.prereqMatch = prereqMatch;
  score += prereqMatch * 0.20;

  return { score: Math.min(score, 1.0), breakdown };
}

// ── V2 Tiered Graph Scoring ──

export interface GraphScoreV2 {
  score: number;
  breakdown: {
    directMatch: number;
    aliasMatch: number;
    oneHop: number;
    prerequisite: number;
    twoHop: number;
    deckHint: number;
    total: number;
  };
  matchType: 'direct' | 'alias' | 'oneHop' | 'prerequisite' | 'twoHop' | 'none';
}

const V2_WEIGHTS = {
  directMatch: 0.30,
  aliasMatch: 0.20,
  oneHop: 0.12,
  prerequisite: 0.08,
  twoHop: 0.04,
  deckHint: 0.06,
};

/** V2: Tiered graph scoring with 4 levels + match type classification */
export function neo4jGraphScoreV2(
  card: { canonicalTopic?: string; canonicalConcept?: string; tags?: string[]; searchKeywords?: string[]; deckId?: string },
  context: Neo4jGraphContext
): GraphScoreV2 {
  const matchFields = [
    card.canonicalTopic || '',
    card.canonicalConcept || '',
    ...(card.tags || []),
    ...(card.searchKeywords || []),
  ].map(f => f.toLowerCase());

  let directMatch = 0;
  let aliasMatch = 0;
  let oneHop = 0;
  let prerequisite = 0;
  let twoHop = 0;
  let deckHintScore = 0;

  // A. Direct concept match — canonical, aliases, core keywords
  for (const conceptId of context.matchedConcepts) {
    if (matchFields.some(f => f === conceptId.toLowerCase() || f.includes(conceptId.toLowerCase()))) {
      directMatch += V2_WEIGHTS.directMatch;
    }
  }
  directMatch = Math.min(directMatch, V2_WEIGHTS.directMatch * 2);

  // Alias match
  for (const conceptId of [...context.matchedConcepts, ...context.expandedConcepts]) {
    if (matchFields.some(f => {
      const alias = conceptId.toLowerCase();
      return f.includes(alias) && f !== alias;
    })) {
      aliasMatch += V2_WEIGHTS.aliasMatch * 0.5;
    }
  }
  aliasMatch = Math.min(aliasMatch, V2_WEIGHTS.aliasMatch);

  // B. One-hop relation match
  for (const conceptId of context.expandedConcepts) {
    if (matchFields.some(f => f.includes(conceptId.toLowerCase()))) {
      oneHop += V2_WEIGHTS.oneHop * 0.25;
    }
  }
  oneHop = Math.min(oneHop, V2_WEIGHTS.oneHop);

  // C. Prerequisite/Foundation match
  for (const kw of context.keywordTiers.prerequisiteKeywords) {
    if (matchFields.some(f => f.includes(kw.toLowerCase()))) {
      prerequisite += V2_WEIGHTS.prerequisite * 0.25;
    }
  }
  prerequisite = Math.min(prerequisite, V2_WEIGHTS.prerequisite);

  // D. Two-hop relation (low signal — only if no stronger match)
  const twoHopConcepts = context.expandedConcepts.filter(
    e => !context.matchedConcepts.includes(e) && !context.keywordTiers.prerequisiteKeywords.includes(e)
  );
  if (directMatch === 0 && oneHop === 0) {
    for (const conceptId of twoHopConcepts) {
      if (matchFields.some(f => f.includes(conceptId.toLowerCase()))) {
        twoHop += V2_WEIGHTS.twoHop * 0.2;
      }
    }
  }
  twoHop = Math.min(twoHop, V2_WEIGHTS.twoHop);

  // Deck hint match
  if (card.deckId && context.deckHints.includes(card.deckId)) {
    deckHintScore = V2_WEIGHTS.deckHint;
  } else if (card.tags) {
    for (const deckHint of context.deckHints) {
      if (card.tags.some(t => t.toLowerCase() === deckHint.toLowerCase())) {
        deckHintScore = V2_WEIGHTS.deckHint * 0.5;
        break;
      }
    }
  }

  const total = Math.min(
    directMatch + aliasMatch + oneHop + prerequisite + twoHop + deckHintScore,
    1.0
  );

  // Determine match type
  let matchType: GraphScoreV2['matchType'] = 'none';
  if (directMatch > 0) matchType = 'direct';
  else if (aliasMatch > 0.05) matchType = 'alias';
  else if (oneHop > 0.03) matchType = 'oneHop';
  else if (prerequisite > 0.02) matchType = 'prerequisite';
  else if (twoHop > 0.01) matchType = 'twoHop';

  return {
    score: total,
    breakdown: { directMatch, aliasMatch, oneHop, prerequisite, twoHop, deckHint: deckHintScore, total },
    matchType,
  };
}

// ── Job Prep Agent: Graph Expansion Tool ──

export interface JobPrepGraphExpansion {
  query: string;
  matchedConcepts: string[];
  coreKeywords: string[];
  expandedKeywords: string[];
  prerequisiteConcepts: Array<{ id: string; canonical: string; type: string }>;
  relatedConcepts: Array<{ id: string; canonical: string; distance: number }>;
  deckHints: string[];
  graphPaths: Array<{ from: string; to: string; relType: string }>;
}

/**
 * Graph expansion tool for the Job Prep Agent.
 * Returns concept expansion, prerequisite knowledge, and cross-module links.
 * Does NOT perform ranking — only keyword/domain expansion.
 */
export async function graphExpandForJobPrep(query: string): Promise<JobPrepGraphExpansion> {
  const matched = await neo4jConceptLookup(query);
  const expanded = await neo4jExpandQuery(query);

  const matchedIds = matched.map(m => m.id);
  const deckHints: string[] = [];
  const prerequisiteConcepts: Array<{ id: string; canonical: string; type: string }> = [];
  const relatedConcepts: Array<{ id: string; canonical: string; distance: number }> = [];
  const paths: Array<{ from: string; to: string; relType: string }> = [];

  const session = getNeo4jSession();
  if (session) {
    try {
      // Deck hints
      const deckResult = await session.run(
        `MATCH (c:Concept)-[:BELONGS_TO]->(d:Deck)
         WHERE c.id IN $conceptIds
         RETURN DISTINCT d.id AS deckId`,
        { conceptIds: matchedIds }
      );
      deckHints.push(...deckResult.records.map(r => r.get('deckId')));

      // Prerequisite + Foundation
      const prereqResult = await session.run(
        `MATCH (c:Concept)-[:PREREQUISITE|FOUNDATION]->(prereq:Concept)
         WHERE c.id IN $conceptIds
         RETURN DISTINCT prereq.id AS id, prereq.canonical AS canonical, 'prerequisite' AS type`,
        { conceptIds: matchedIds }
      );
      for (const r of prereqResult.records) {
        prerequisiteConcepts.push({ id: r.get('id'), canonical: r.get('canonical'), type: r.get('type') });
      }

      // Related concepts (1-2 hop)
      for (const mid of matchedIds.slice(0, 5)) {
        const related = await neo4jFindRelatedConcepts(mid, 2);
        for (const rel of related) {
          if (!matchedIds.includes(rel.id) && !relatedConcepts.find(x => x.id === rel.id)) {
            relatedConcepts.push(rel);
          }
        }
      }

      // Paths
      for (const exp of expanded) {
        if (exp.matchedField) {
          paths.push({ from: matchedIds[0] || query, to: exp.id, relType: exp.matchedField });
        }
      }
    } catch (e: any) {
      console.warn(`[graphExpandForJobPrep] Neo4j query failed: ${e.message}`);
    } finally {
      await session.close();
    }
  }

  // Fallback: use static graph if Neo4j unavailable
  if (!isNeo4jAvailable()) {
    return {
      query,
      matchedConcepts: [],
      coreKeywords: [query],
      expandedKeywords: [],
      prerequisiteConcepts: [],
      relatedConcepts: [],
      deckHints: [],
      graphPaths: [],
    };
  }

  return {
    query,
    matchedConcepts: matchedIds,
    coreKeywords: matched.map(m => m.canonical),
    expandedKeywords: [...new Set([...matched.map(m => m.canonical), ...expanded.map(e => e.canonical)])],
    prerequisiteConcepts,
    relatedConcepts,
    deckHints: [...new Set(deckHints)],
    graphPaths: paths,
  };
}
