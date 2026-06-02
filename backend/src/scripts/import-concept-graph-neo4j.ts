// Import concept graph into Neo4j for graph-enhanced search
// Usage: npm run graph:import-neo4j

import { getConceptNodes, type ConceptNode, type Relation, type RelationType } from '../services/search/concept-graph';
import { getNeo4jSession, closeNeo4jDriver } from '../services/neo4j/neo4j-client';

async function main() {
  const session = getNeo4jSession();
  if (!session) {
    console.error('[neo4j-import] Neo4j is not available. Check NEO4J_URI and docker-compose.');
    process.exit(1);
  }

  const nodes = getConceptNodes();
  console.log(`[neo4j-import] Importing ${nodes.length} concept nodes...`);

  let createdNodes = 0;
  let createdRelations = 0;
  let createdDecks = 0;

  try {
    // Clear existing graph
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('[neo4j-import] Cleared existing graph');

    // Create indexes
    await session.run('CREATE INDEX concept_id IF NOT EXISTS FOR (c:Concept) ON (c.id)');
    await session.run('CREATE INDEX concept_canonical IF NOT EXISTS FOR (c:Concept) ON (c.canonical)');
    await session.run('CREATE INDEX deck_id IF NOT EXISTS FOR (d:Deck) ON (d.id)');

    // Import nodes
    for (const node of nodes) {
      await session.run(
        `MERGE (c:Concept {id: $id})
         SET c.canonical = $canonical,
             c.aliases = $aliases,
             c.deckHint = $deckHint,
             c.parentCategory = $parentCategory,
             c.coreKeywords = $coreKeywords,
             c.searchAliases = $searchAliases,
             c.migrationStatus = $migrationStatus,
             c.domain = $domain`,
        {
          id: node.id,
          canonical: node.canonical,
          aliases: node.aliases || [],
          deckHint: node.deckHint || null,
          parentCategory: node.parentCategory || null,
          coreKeywords: node.coreKeywords || [],
          searchAliases: node.searchAliases || [],
          migrationStatus: node.migrationStatus || null,
          domain: node.domain || null,
        }
      );
      createdNodes++;

      // Create Deck node if deckHint exists
      if (node.deckHint) {
        await session.run(
          `MERGE (d:Deck {id: $deckId})
           SET d.name = $deckId`,
          { deckId: node.deckHint }
        );
        await session.run(
          `MATCH (c:Concept {id: $conceptId})
           MATCH (d:Deck {id: $deckId})
           MERGE (c)-[:BELONGS_TO]->(d)`,
          { conceptId: node.id, deckId: node.deckHint }
        );
        createdDecks++;
      }

      // Import relations
      for (const rel of node.relations) {
        const targetNode = nodes.find(n => n.id === rel.target);
        if (!targetNode) continue;

        const relType = relationTypeToNeo4j(rel.type);
        await session.run(
          `MATCH (a:Concept {id: $sourceId})
           MATCH (b:Concept {id: $targetId})
           MERGE (a)-[r:${relType}]->(b)
           SET r.weight = $weight`,
          {
            sourceId: node.id,
            targetId: rel.target,
            weight: rel.weight || 1.0,
          }
        );
        createdRelations++;
      }
    }

    console.log(`[neo4j-import] Done: ${createdNodes} nodes, ${createdRelations} relations, ${createdDecks} decks`);
  } catch (e: any) {
    console.error(`[neo4j-import] Error: ${e.message}`);
    process.exit(1);
  } finally {
    await session.close();
    await closeNeo4jDriver();
  }
}

function relationTypeToNeo4j(type: RelationType): string {
  const map: Record<string, string> = {
    parent: 'PARENT',
    child: 'CHILD',
    prerequisite: 'PREREQUISITE',
    related: 'RELATED',
    alias: 'ALIAS',
    implementation: 'IMPLEMENTATION',
    contrast: 'CONTRAST',
    foundation: 'FOUNDATION',
    advanced: 'ADVANCED',
  };
  return map[type] || 'RELATED';
}

main();
