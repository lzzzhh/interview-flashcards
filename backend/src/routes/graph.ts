// Graph Routes — Neo4j graph expansion for job prep

import { FastifyInstance } from 'fastify';
import { neo4jBuildKeywordTiers } from '../services/search/neo4j-graph-search';

export async function graphRoutes(app: FastifyInstance) {
  app.post('/api/graph/job-prep/expand', async (req) => {
    const body = req.body as any;
    const query = [body.company, body.role, ...(body.requirements || [])]
      .filter(Boolean)
      .join(' ');

    const { tiers, context } = await neo4jBuildKeywordTiers(query);

    return {
      matchedConcepts: context.matchedConcepts,
      expandedConcepts: context.expandedConcepts,
      prerequisites: tiers.prerequisiteKeywords,
      relatedModules: context.deckHints,
      deckHints: context.deckHints,
      graphPaths: context.paths?.map(p => `${p.from} -> ${p.relType} -> ${p.to}`) || [],
      candidateCardIds: [], // populated by fusing with card search
    };
  });
}
