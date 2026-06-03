// Graph Routes — Neo4j graph expansion for job prep

import { FastifyInstance } from 'fastify';
import { neo4jBuildKeywordTiers } from '../services/search/neo4j-graph-search';

export async function graphRoutes(app: FastifyInstance) {
  app.post('/api/graph/job-prep/expand', async (req) => {
    const body = req.body as any;
    // Build individual keywords — don't concatenate into a single string
    const keywords = [
      ...(body.requirements || []),
      body.role || '',
      body.company || '',
    ].filter(Boolean).map((k: string) => k.trim()).filter((k: string) => k.length > 0);

    // Expand each keyword individually and merge results
    const allMatched: string[] = [];
    const allExpanded: string[] = [];
    const allPrereqs: string[] = [];
    const allDecks: string[] = [];
    const allPaths: string[] = [];

    for (const kw of keywords) {
      const { tiers, context } = await neo4jBuildKeywordTiers(kw);
      allMatched.push(...context.matchedConcepts);
      allExpanded.push(...context.expandedConcepts);
      allPrereqs.push(...tiers.prerequisiteKeywords);
      allDecks.push(...context.deckHints);
      allPaths.push(...(context.paths?.map(p => `${kw} -> ${p.relType} -> ${p.to}`) || []));
    }

    return {
      matchedConcepts: [...new Set(allMatched)],
      expandedConcepts: [...new Set(allExpanded)],
      prerequisites: [...new Set(allPrereqs)],
      relatedModules: [...new Set(allDecks)],
      deckHints: [...new Set(allDecks)],
      graphPaths: [...new Set(allPaths)],
      candidateCardIds: [],
    };
  });
}
