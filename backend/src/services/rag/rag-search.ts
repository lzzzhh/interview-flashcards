// RAG Search — Qdrant vector search with optional filters

import { getQdrantClient, getQdrantCollection } from './qdrant-client';
import { embedText } from './embedding-service';

export interface RagSearchParams {
  query: string;
  sourceTypes?: string[];
  filters?: {
    deckIds?: string[];
    company?: string;
    roleFamily?: string;
  };
  topK?: number;
}

export interface RagSearchResult {
  sourceType: string;
  sourceId: string;
  cardId?: string;
  deckId?: string;
  jobPostingId?: string;
  documentId?: string;
  projectId?: string;
  title?: string;
  text: string;
  score: number;
  payload: Record<string, any>;
}

export async function ragSearch(params: RagSearchParams): Promise<RagSearchResult[]> {
  const client = getQdrantClient();
  const collection = getQdrantCollection();
  const topK = params.topK || 50;

  const queryVec = await embedText(params.query);

  // Build filter
  const must: any[] = [];
  if (params.sourceTypes?.length) {
    must.push({ key: 'sourceType', match: { any: params.sourceTypes } });
  }
  if (params.filters?.deckIds?.length) {
    must.push({ key: 'deckId', match: { any: params.filters.deckIds } });
  }
  if (params.filters?.company) {
    must.push({ key: 'company', match: { text: params.filters.company } });
  }

  try {
    const results = await client.search(collection, {
      vector: queryVec,
      limit: topK,
      filter: must.length > 0 ? { must } : undefined,
      with_payload: true,
    });

    return results.map(r => ({
      sourceType: (r.payload as any)?.sourceType || 'unknown',
      sourceId: (r.payload as any)?.sourceId || '',
      cardId: (r.payload as any)?.cardId,
      deckId: (r.payload as any)?.deckId,
      jobPostingId: (r.payload as any)?.jobPostingId,
      documentId: (r.payload as any)?.documentId,
      projectId: (r.payload as any)?.projectId,
      title: (r.payload as any)?.title,
      text: (r.payload as any)?.text || '',
      score: r.score,
      payload: r.payload as any,
    }));
  } catch (e: any) {
    console.warn(`[rag-search] Failed: ${e.message}`);
    return [];
  }
}
