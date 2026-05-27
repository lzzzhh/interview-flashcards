// Learning-path dedicated pipeline: graph→concept stages→card retrieval
import { understandQuery } from './query-understanding';
import { conceptGraphLookup, buildKeywordTiersFromGraphWithLimits, walkEdges } from './concept-graph';
import { fts5Search } from './fts5-search';

export interface LearningStage {
  name: string;
  concepts: string[];
  cards: CardResult[];
}

export interface CardResult {
  cardId: string;
  title: string;
  titleCn: string | null;
  conceptMatch: string;
  score: number;
}

export interface LearningPlan {
  topic: string;
  canonicalTopic: string;
  graphNodeId: string;
  stages: LearningStage[];
  metrics: LearningPathMetrics;
  debug: { conceptCount: number; totalCards: number; edgesUsed: string[] };
}

export interface LearningPathMetrics {
  stageCoverage: number;       // stages with ≥1 card
  foundationCoverage: number;  // prerequisite concepts with ≥1 card
  requiredConceptCoverage: number; // core concepts with ≥1 card
  duplicateConceptRate: number;    // duplicate cards across stages
  emptyStageCount: number;
}

export async function buildLearningPlan(query: string): Promise<LearningPlan> {
  // 1. Understand query intent + topic
  const parsed = await understandQuery(query);
  let topic = parsed.canonicalTopic || parsed.topic;
  
  // 2. Try graph lookup
  let graphNode = conceptGraphLookup(topic);
  
  // Fallback: strip learning-path suffixes and retry with alias mapping
  if (!graphNode && topic) {
    let cleanTopic = query.replace(/(学习路线|怎么学|如何学|怎么入门|从零开始学|怎么入行|要学什么|要补什么|怎么快速|快速入门|开发学习|从入门到实践|书籍推荐)$/g, '').trim();
    const ALIAS_MAP: Record<string, string> = {
      'LLM大模型': '大模型', '大模型微调': '大模型', '快速入门ML': '机器学习',
      '从零学AI需要哪些数学': '机器学习', '后端转算法': '算法',
      '从零学AI': '机器学习', '想做算法工程师': '算法',
    };
    cleanTopic = ALIAS_MAP[cleanTopic] || cleanTopic;
    if (cleanTopic !== topic) {
      graphNode = conceptGraphLookup(cleanTopic);
      if (graphNode) topic = cleanTopic;
    }
  }
  
  if (!graphNode) return emptyPlan(query, 'no_graph_node');
  return buildPlanFromNode(graphNode, query, topic);
}

async function buildPlanFromNode(graphNode: any, query: string, topic: string): Promise<LearningPlan> {
  const edgesUsed: string[] = [];

  // Stage 1: Prerequisites + Foundation
  const prereqCons = [...walkEdges(graphNode.id, ['prerequisite', 'foundation'], 2)];
  edgesUsed.push(...prereqCons.map(id => `prereq:${id}`));

  // Stage 2: Core (self + children)
  const childCons = [...walkEdges(graphNode.id, ['child', 'implementation'], 1)];

  // Stage 3: Related (for comparison/contrast)
  const relatedCons = [...walkEdges(graphNode.id, ['related', 'contrast'], 1)];
  edgesUsed.push(...relatedCons.map(id => `related:${id}`));

  // 4. Resolve concept names from graph nodes
  const concepts: Record<string, string[]> = {
    foundation: prereqCons.map(id => conceptGraphLookup(id)?.canonical || id),
    core: [graphNode.canonical, ...childCons.map(id => conceptGraphLookup(id)?.canonical || id)],
    related: relatedCons.map(id => conceptGraphLookup(id)?.canonical || id),
  };

  // 5. Retrieve cards per concept
  const dedupSet = new Set<string>();
  const stages: LearningStage[] = [];

  const stageDefs = [
    { name: '基础入门', conceptList: concepts.foundation },
    { name: '核心概念', conceptList: concepts.core },
    { name: '对比理解', conceptList: concepts.related },
  ];

  for (const stageDef of stageDefs) {
    const cards: CardResult[] = [];
    for (const concept of stageDef.conceptList) {
      if (!concept) continue;
      const results = await fts5Search(concept, 3);
      for (const r of results) {
        if (!dedupSet.has(r.cardId)) {
          cards.push({
            cardId: r.cardId,
            title: r.cardId, // will be hydrated later
            titleCn: null,
            conceptMatch: concept,
            score: 1 / (1 + r.rank * 0.05),
          });
          dedupSet.add(r.cardId);
        }
      }
    }
    if (cards.length > 0) {
      stages.push({ name: stageDef.name, concepts: stageDef.conceptList, cards });
    }
  }

  // 6. Add practice stage (search whole topic)
  const practiceResults = await fts5Search(topic, 5);
  const practiceCards: CardResult[] = [];
  for (const r of practiceResults) {
    if (!dedupSet.has(r.cardId) && practiceCards.length < 8) {
      practiceCards.push({
        cardId: r.cardId, title: r.cardId, titleCn: null,
        conceptMatch: topic, score: 1 / (1 + r.rank * 0.05),
      });
      dedupSet.add(r.cardId);
    }
  }
  if (practiceCards.length > 0) {
    stages.push({ name: '面试/练习', concepts: [topic], cards: practiceCards });
  }

  // 7. Compute metrics
  const emptyStages = stages.filter(s => s.cards.length === 0).length;
  const totalConcepts = concepts.foundation.length + concepts.core.length + concepts.related.length;
  const coveredConcepts = stages.reduce((sum, s) => sum + s.concepts.filter(c => {
    return s.cards.some(card => card.conceptMatch === c);
  }).length, 0);

  // Duplicate check: cards appearing in multiple concept buckets within same stage
  const allCardIds = new Set<string>();
  let dupCount = 0;
  for (const s of stages) {
    for (const c of s.cards) {
      if (allCardIds.has(c.cardId)) dupCount++;
      allCardIds.add(c.cardId);
    }
  }

  const metrics: LearningPathMetrics = {
    stageCoverage: stages.filter(s => s.cards.length > 0).length / Math.max(1, stages.length),
    foundationCoverage: concepts.foundation.length > 0
      ? stages.filter(s => s.name === '基础入门')[0]?.cards.length || 0 > 0 ? 1 : 0
      : 1,
    requiredConceptCoverage: totalConcepts > 0 ? coveredConcepts / totalConcepts : 0,
    duplicateConceptRate: dedupSet.size > 0 ? dupCount / dedupSet.size : 0,
    emptyStageCount: emptyStages,
  };

  return {
    topic, canonicalTopic: graphNode.canonical,
    graphNodeId: graphNode.id, stages, metrics,
    debug: { conceptCount: totalConcepts, totalCards: dedupSet.size, edgesUsed },
  };
}

function emptyPlan(query: string, reason: string): LearningPlan {
  return {
    topic: query, canonicalTopic: '', graphNodeId: '',
    stages: [], metrics: {
      stageCoverage: 0, foundationCoverage: 0,
      requiredConceptCoverage: 0, duplicateConceptRate: 0, emptyStageCount: 4,
    },
    debug: { conceptCount: 0, totalCards: 0, edgesUsed: [reason] },
  };
}
