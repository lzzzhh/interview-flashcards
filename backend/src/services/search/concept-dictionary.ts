// backend/src/services/search/concept-dictionary.ts
// Data-driven concept dictionary — reads from SearchTopic table (seeded from Card.tags)

import prisma from '../../db/prisma';

export interface ConceptEntry {
  topic: string;
  deckHint?: string;
  subtopics: string[];
  keywords: string[];
}

let cachedTopics: ConceptEntry[] | null = null;
let cacheTime = 0;

/** Load topics from DB (cached for 5 minutes) */
async function loadTopics(): Promise<ConceptEntry[]> {
  if (cachedTopics && Date.now() - cacheTime < 300_000) return cachedTopics;

  const rows = await prisma.searchTopic.findMany({
    where: { enabled: true },
    orderBy: { tagCount: 'desc' },
  });

  cachedTopics = rows.map(r => ({
    topic: r.name,
    deckHint: r.deckHint || undefined,
    subtopics: safeParse(r.subtopics),
    keywords: safeParse(r.keywords),
  }));
  cacheTime = Date.now();
  return cachedTopics;
}

function safeParse(s: string): string[] {
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
}

/** Look up concept by any term (topic or keyword) */
export async function conceptLookup(term: string): Promise<ConceptEntry | undefined> {
  const topics = await loadTopics();

  // Exact match on topic name
  for (const t of topics) {
    if (t.topic === term || t.topic.toLowerCase() === term.toLowerCase()) return t;
  }

  // Match on keywords
  for (const t of topics) {
    if (t.keywords.some(k => k === term || k.toLowerCase() === term.toLowerCase())) return t;
  }

  // Substring match
  for (const t of topics) {
    if (t.topic.includes(term) || term.includes(t.topic)) return t;
    if (t.keywords.some(k => k.includes(term) || term.includes(k))) return t;
  }

  return undefined;
}

export async function getAllTopics(): Promise<string[]> {
  const topics = await loadTopics();
  return topics.map(t => t.topic);
}
