// Neo4j driver singleton — lazy init, fails gracefully if Neo4j is unavailable

import neo4j, { type Driver, type Session } from 'neo4j-driver';

let driver: Driver | null = null;
let initError: string | null = null;

export function getNeo4jDriver(): Driver | null {
  if (initError) return null;
  if (driver) return driver;

  const enabled = process.env.GRAPH_NEO4J_ENABLED !== 'false';
  if (!enabled) {
    initError = 'Neo4j disabled via GRAPH_NEO4J_ENABLED';
    return null;
  }

  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';

  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionLifetime: 30 * 60 * 1000,
      maxConnectionPoolSize: 10,
      connectionAcquisitionTimeout: 5000,
    });
    console.log('[neo4j] Driver initialized');
    return driver;
  } catch (e: any) {
    initError = e.message || 'Unknown error';
    console.warn(`[neo4j] Failed to initialize driver: ${initError}`);
    return null;
  }
}

export function getNeo4jSession(database?: string): Session | null {
  const d = getNeo4jDriver();
  if (!d) return null;
  try {
    return d.session({ database: database || process.env.NEO4J_DATABASE || 'neo4j' });
  } catch (e: any) {
    console.warn(`[neo4j] Failed to create session: ${e.message}`);
    return null;
  }
}

export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('[neo4j] Driver closed');
  }
}

export function isNeo4jAvailable(): boolean {
  return getNeo4jDriver() !== null;
}

export function getNeo4jStatus(): { available: boolean; error?: string } {
  const d = getNeo4jDriver();
  return d ? { available: true } : { available: false, error: initError || 'Not initialized' };
}
