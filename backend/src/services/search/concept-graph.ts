// backend/src/services/search/concept-graph.ts
// Lightweight in-memory concept graph for query understanding, keyword tiering,
// learning-path prerequisite expansion, and eval concept-level matching.

export type RelationType = 'parent' | 'child' | 'prerequisite' | 'related' | 'alias' | 'implementation' | 'contrast' | 'foundation' | 'advanced';

export interface Relation { type: RelationType; target: string; weight?: number; }

export interface ConceptNode {
  id: string; canonical: string; aliases: string[];
  deckHint?: string; parentCategory?: string;
  coreKeywords: string[]; searchAliases: string[];
  relations: Relation[];
  migrationStatus: 'manual' | 'generated' | 'reviewed' | 'deprecatedLegacy';
  domain: string;
}

export interface KeywordTiers {
  coreKeywords: string[]; expandedKeywords: string[];
  prerequisiteKeywords: string[]; lowPriorityKeywords: string[];
}

// ── Graph Construction ──

const NODES: ConceptNode[] = [
  // ====== 机器学习概念 ======
  { 
    migrationStatus: 'manual', domain: 'machine-learning',
      { type: 'child', target: 'bagging' }, { type: 'child', target: 'boosting' }, { type: 'child', target: 'stacking' },
      { type: 'implementation', target: 'random_forest' }, { type: 'implementation', target: 'gbdt' }, { type: 'implementation', target: 'xgboost' },
      { type: 'related', target: 'decision_tree' }, { type: 'related', target: 'overfitting' }, { type: 'related', target: 'feature_importance' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'machine-learning', { type: 'parent', target: 'boosting' },
      { type: 'child', target: 'ml' }, { type: 'related', target: 'random_forest' }, { type: 'related', target: 'feature_importance' },
      { type: 'related', target: 'regularization' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'machine-learning', { type: 'child', target: 'decision_tree' },
      { type: 'related', target: 'feature_importance' }, { type: 'contrast', target: 'gbdt' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'machine-learning',
      { type: 'child', target: 'random_forest' },
      { type: 'related', target: 'overfitting' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'machine-learning',
      { type: 'child', target: 'gbdt' },
      { type: 'related', target: 'overfitting' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'machine-learning',
      { type: 'child', target: 'xgboost' },
      { type: 'related', target: 'decision_tree' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'machine-learning', { type: 'foundation', target: 'gbdt' },
      { type: 'related', target: 'overfitting' }, { type: 'related', target: 'regularization' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'machine-learning', { type: 'related', target: 'decision_tree' },
      { type: 'related', target: 'cross_validation' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'machine-learning',
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'machine-learning', { type: 'related', target: 'xgboost' },
    ]},

  // ====== 图算法 ======
  { 
    migrationStatus: 'manual', domain: 'leetcode', { type: 'child', target: 'dfs' },
      { type: 'child', target: 'shortest_path' }, { type: 'child', target: 'topo_sort' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'leetcode', { type: 'contrast', target: 'dfs' },
      { type: 'related', target: 'shortest_path' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'leetcode', { type: 'contrast', target: 'bfs' },
      { type: 'related', target: 'backtracking' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'leetcode',
      { type: 'related', target: 'bfs' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'leetcode',
      { type: 'related', target: 'bfs' }, { type: 'related', target: 'dfs' },
    ]},

  // ====== 数据结构 ======
  { 
    migrationStatus: 'manual', domain: 'leetcode', { type: 'contrast', target: 'two_pointer' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'leetcode',
      { type: 'related', target: 'two_pointer' }, { type: 'related', target: 'sliding_window' },
      { type: 'foundation', target: 'dynamic_programming' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'leetcode', { type: 'contrast', target: 'hash_table' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'leetcode',
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'leetcode',
    ]},

  // ====== LLM/Agent ======
  { 
    migrationStatus: 'manual', domain: 'deep-learning',
      { type: 'foundation', target: 'rag' }, { type: 'foundation', target: 'agent' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'deep-learning',
      { type: 'implementation', target: 'transformer' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'llm-agent-rag', { type: 'related', target: 'vector_db' },
      { type: 'contrast', target: 'agent' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'llm-agent-rag',
      { type: 'related', target: 'rag' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'llm-agent-rag', { type: 'related', target: 'rag' },
],
  migrationStatus: "manual", domain: "unknown",
},
 
    migrationStatus: 'manual', domain: 'llm-agent-rag',
    ]},

  // Parent categories (kept separate, never used as canonicalTopic)
  { 
    migrationStatus: 'manual', domain: 'machine-learning',
],
  migrationStatus: "manual", domain: "unknown",
},
 id: 'backtracking', canonical: '回溯', aliases: ['回溯', '回溯算法', 'backtracking'], deckHint: 'leetcode', parentCategory: '算法',
    coreKeywords: ['回溯', 'backtracking'], searchAliases: ['backtracking', '递归', 'DFS', '剪枝', 'permutation', 'combination'],
    relations: [{ type: 'related', target: 'dfs' }] },
  { id: 'reinforcement_learning', canonical: '强化学习', aliases: ['强化学习', 'reinforcement learning', 'RL'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['强化学习', 'reinforcement learning', 'RL'], searchAliases: ['rl', 'agent', 'environment', 'reward', 'Q-learning', 'policy', 'value', 'Bellman'],
    relations: [{ type: 'related', target: 'ml' }] },
  { 
    migrationStatus: 'manual', domain: 'machine-learning',
  { 
    migrationStatus: 'manual', domain: 'machine-learning',
  { id: 'cross_validation', canonical: '交叉验证', aliases: ['交叉验证', 'cross validation'], deckHint: 'machine-learning', parentCategory: '机器学习',
    coreKeywords: ['交叉验证', 'cross validation'], searchAliases: ['cross val', 'k-fold', 'holdout', 'LOOCV'],
    relations: [{ type: 'related', target: 'overfitting' }] },
  { 
    migrationStatus: 'manual', domain: 'machine-learning',
  { 
    migrationStatus: 'manual', domain: 'machine-learning',
  { 
    migrationStatus: 'manual', domain: 'machine-learning',
  { 
    migrationStatus: 'manual', domain: 'machine-learning',
  { 
    migrationStatus: 'manual', domain: 'machine-learning',
  { 
    migrationStatus: 'manual', domain: 'deep-learning',
  { 
    migrationStatus: 'manual', domain: 'deep-learning',
  { 
    migrationStatus: 'manual', domain: 'deep-learning',
  { id: 'dropout', canonical: 'Dropout', aliases: ['Dropout', 'drop out'], deckHint: 'deep-learning', parentCategory: '深度学习',
    coreKeywords: ['Dropout'], searchAliases: ['dropout', 'inverted'],
    relations: [{ type: 'related', target: 'regularization' }] },
  { 
    migrationStatus: 'manual', domain: 'deep-learning',
  { 
    migrationStatus: 'manual', domain: 'deep-learning',
  { 
    migrationStatus: 'manual', domain: 'deep-learning', { type: 'child', target: 'rnn' }, { type: 'child', target: 'transformer' }] },
  { 
    migrationStatus: 'manual', domain: 'data-science-statistics',
  { 
    migrationStatus: 'manual', domain: 'data-science-statistics',
];

// ── Graph Index ──
const nodeById = new Map<string, ConceptNode>();
const nodeByAlias = new Map<string, string>(); // alias → id

for (const n of NODES) {
  nodeById.set(n.id, n);
  nodeByAlias.set(n.canonical.toLowerCase(), n.id);
  for (const a of n.aliases) nodeByAlias.set(a.toLowerCase(), n.id);
}

// ── Helpers ──

function walkEdges(fromId: string, types: RelationType[], depth: number): Set<string> {
  const visited = new Set<string>();
  const queue: Array<{ id: string; d: number }> = [{ id: fromId, d: 0 }];
  visited.add(fromId);
  while (queue.length > 0) {
    const { id, d } = queue.shift()!;
    if (d >= depth) continue;
    const node = nodeById.get(id);
    if (!node) continue;
    for (const r of node.relations) {
      if (!types.includes(r.type)) continue;
      const next = r.target;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ id: next, d: d + 1 });
      }
    }
  }
  visited.delete(fromId);
  return visited;
}

// ── Public API ──

/** Look up concept node by any alias */
export function conceptGraphLookup(term: string): ConceptNode | undefined {
  const id = nodeByAlias.get(term.toLowerCase());
  return id ? nodeById.get(id) : undefined;
}

/** Check if term matches any concept (for eval concept-level matching) */
export function conceptGraphMatches(term: string, conceptId: string): boolean {
  const id = nodeByAlias.get(term.toLowerCase());
  if (!id) return false;
  if (id === conceptId) return true;
  const root = nodeById.get(conceptId);
  if (!root) return false;
  return root.aliases.some(a => a.toLowerCase() === term.toLowerCase());
}

/** Get all aliases for a concept (for eval concept-level matching) */
export function getConceptAliases(conceptId: string): string[] {
  const node = nodeById.get(conceptId);
  if (!node) return [];
  return [...node.aliases, ...node.searchAliases];
}

/** Build tiered keywords from graph traversal */
export function buildKeywordTiersFromGraph(
  topicId: string,
  mode: 'search' | 'learning_path' = 'search'
): KeywordTiers {
  const node = nodeById.get(topicId);
  if (!node) {
    return { coreKeywords: [], expandedKeywords: [], prerequisiteKeywords: [], lowPriorityKeywords: [] };
  }

  const core = new Set(node.coreKeywords);
  const expanded = new Set<string>();
  const prereq = new Set<string>();
  const lowPrio = new Set<string>();

  const maxDepth = mode === 'learning_path' ? 2 : 1;
  // Parent category → lowPriority only
  const parents = walkEdges(topicId, ['parent'], 1);
  for (const pid of parents) {
    const pn = nodeById.get(pid);
    if (pn) {
      if (pn.parentCategory === pn.canonical) {
        // This is a broad parent category — only low priority
        for (const k of pn.coreKeywords) lowPrio.add(k);
        for (const k of pn.searchAliases) lowPrio.add(k);
      }
    }
  }

  // Children → expanded (search mode) or core (LP mode)
  const children = walkEdges(topicId, ['child'], 2);
  for (const cid of children) {
    const cn = nodeById.get(cid);
    if (cn) {
      for (const k of cn.coreKeywords) { if (!core.has(k)) expanded.add(k); }
    }
  }

  // Learning-path specific
  if (mode === 'learning_path') {
    const foundation = walkEdges(topicId, ['foundation'], 2);
    for (const fid of foundation) {
      const fn = nodeById.get(fid);
      if (fn) { for (const k of fn.coreKeywords) prereq.add(k); for (const k of fn.searchAliases) prereq.add(k); }
    }

    const prerequisites = walkEdges(topicId, ['prerequisite'], 2);
    for (const pid of prerequisites) {
      const pn = nodeById.get(pid);
      if (pn) { for (const k of pn.coreKeywords) prereq.add(k); }
    }
  }

  // Related → expanded (search) or prereq (LP)
  const related = walkEdges(topicId, ['related', 'implementation'], 2);
  for (const rid of related) {
    const rn = nodeById.get(rid);
    if (rn) {
      if (mode === 'learning_path') {
        for (const k of rn.coreKeywords) prereq.add(k);
      } else {
        for (const k of rn.searchAliases) expanded.add(k);
      }
    }
  }

  // Contrast → expanded (informational)
  const contrasts = walkEdges(topicId, ['contrast'], 1);
  for (const cid of contrasts) {
    const cn = nodeById.get(cid);
    if (cn) {
      for (const k of cn.coreKeywords) { if (!core.has(k)) expanded.add(k); }
    }
  }

  return {
    coreKeywords: [...core],
    expandedKeywords: [...expanded],
    prerequisiteKeywords: mode === 'learning_path' ? [...prereq] : [],
    lowPriorityKeywords: [...lowPrio],
  };
}

/** Get graph trace info for debug */
export function getGraphTrace(topicId: string) {
  const node = nodeById.get(topicId);
  if (!node) return { hit: false };
  return {
    hit: true, nodeId: node.id, canonical: node.canonical,
    parentCategory: node.parentCategory,
    relationsUsed: node.relations.map(r => `${r.type}:${r.target}`),
  };
}

// ── Adapter Interfaces ──

export interface GraphResolveResult {
  conceptGraphHit: boolean;
  graphNodeId?: string;
  canonicalTopic: string;
  aliases: string[];
  deckHint?: string;
  parentCategory?: string;
  matchedAlias?: string;
  confidence: number;
}

export interface RelatedConcept {
  id: string;
  canonical: string;
  relationType: RelationType;
  weight: number;
}

/** Resolve a raw topic string through the concept graph */
export function resolveConceptFromGraph(rawTopic: string): GraphResolveResult {
  const id = nodeByAlias.get(rawTopic.toLowerCase());
  if (!id) {
    return { conceptGraphHit: false, canonicalTopic: rawTopic, aliases: [], confidence: 0 };
  }
  const node = nodeById.get(id)!;
  return {
    conceptGraphHit: true,
    graphNodeId: node.id,
    canonicalTopic: node.canonical,
    aliases: [...node.aliases],
    deckHint: node.deckHint,
    parentCategory: node.parentCategory,
    matchedAlias: rawTopic !== node.canonical ? rawTopic : undefined,
    confidence: 0.9,
  };
}

/** Get all equivalent terms (aliases + searchAliases) for a concept */
export function getConceptEquivalents(topicOrId: string): { canonical: string; aliases: string[]; equivalentTerms: string[] } {
  const node = nodeById.get(topicOrId) || nodeById.get(nodeByAlias.get(topicOrId.toLowerCase()) || '');
  if (!node) return { canonical: topicOrId, aliases: [], equivalentTerms: [topicOrId] };
  return {
    canonical: node.canonical,
    aliases: [...node.aliases],
    equivalentTerms: [...node.aliases, ...node.searchAliases],
  };
}

/** Get related concepts by relation type */
export function getRelatedConcepts(
  topicId: string,
  relationTypes: RelationType[] = ['related', 'child', 'implementation'],
  maxDepth: number = 1
): RelatedConcept[] {
  const visited = walkEdges(topicId, relationTypes, maxDepth);
  const result: RelatedConcept[] = [];
  for (const vid of visited) {
    const vnode = nodeById.get(vid);
    if (vnode) {
      const rel = vnode.relations.find(r => r.target === topicId);
      result.push({
        id: vnode.id, canonical: vnode.canonical,
        relationType: rel?.type || 'related',
        weight: rel?.weight || 0.5,
      });
    }
  }
  return result;
}

/** Build tiered keywords with token limits */
export function buildKeywordTiersFromGraphWithLimits(
  topicId: string,
  mode: 'search' | 'learning-path' | 'compare' = 'search'
): KeywordTiers & { graphRelationsUsed: string[] } {
  const node = nodeById.get(topicId);
  if (!node) return { coreKeywords: [], expandedKeywords: [], prerequisiteKeywords: [], lowPriorityKeywords: [], graphRelationsUsed: [] };

  const maxDepth = mode === 'learning-path' ? 2 : 1;
  const core = new Set(node.coreKeywords);
  const expanded = new Set<string>();
  const prereq = new Set<string>();
  const lowPrio = new Set<string>();
  const relUsed: string[] = [];

  // Parent → lowPriority only (never in main recall)
  const parents = walkEdges(topicId, ['parent'], 1);
  for (const pid of parents) {
    const pn = nodeById.get(pid);
    if (pn) {
      if (pn.parentCategory === pn.canonical) {
        for (const k of pn.coreKeywords) lowPrio.add(k);
        for (const k of pn.searchAliases) lowPrio.add(k);
        relUsed.push(`parent:${pid}`);
      }
    }
  }

  // Children → expanded
  const children = walkEdges(topicId, ['child'], maxDepth);
  for (const cid of children) {
    const cn = nodeById.get(cid);
    if (cn) {
      for (const k of cn.coreKeywords) { if (!core.has(k)) expanded.add(k); }
      relUsed.push(`child:${cid}`);
    }
  }

  // Learning-path specific
  if (mode === 'learning-path') {
    const foundation = walkEdges(topicId, ['foundation'], maxDepth);
    for (const fid of foundation) {
      const fn = nodeById.get(fid);
      if (fn) { for (const k of fn.coreKeywords) prereq.add(k); for (const k of fn.searchAliases) prereq.add(k); relUsed.push(`foundation:${fid}`); }
    }
    const prerequisites = walkEdges(topicId, ['prerequisite'], maxDepth);
    for (const pid of prerequisites) {
      const pn = nodeById.get(pid);
      if (pn) { for (const k of pn.coreKeywords) prereq.add(k); relUsed.push(`prerequisite:${pid}`); }
    }
  }

  // Related/implementation → expanded
  const related = walkEdges(topicId, ['related', 'implementation'], maxDepth);
  for (const rid of related) {
    const rn = nodeById.get(rid);
    if (rn) {
      if (mode === 'learning-path') {
        for (const k of rn.coreKeywords) prereq.add(k);
      } else {
        for (const k of rn.searchAliases) expanded.add(k);
      }
      relUsed.push(`${rn.relations.find(r => r.target === topicId)?.type || 'related'}:${rid}`);
    }
  }

  // Contrast → expanded (informational, small)
  if (mode === 'compare') {
    const contrasts = walkEdges(topicId, ['contrast'], 1);
    for (const cid of contrasts) {
      const cn = nodeById.get(cid);
      if (cn) { for (const k of cn.coreKeywords) { if (!core.has(k)) expanded.add(k); } relUsed.push(`contrast:${cid}`); }
    }
  }

  // Apply limits
  const MAX_EXPANDED = 16, MAX_PREREQ = 12, MAX_LOW = 8;
  return {
    coreKeywords: [...core],
    expandedKeywords: [...expanded].slice(0, MAX_EXPANDED),
    prerequisiteKeywords: mode === 'learning-path' ? [...prereq].slice(0, MAX_PREREQ) : [],
    lowPriorityKeywords: [...lowPrio].slice(0, MAX_LOW),
    graphRelationsUsed: relUsed,
  };
}
