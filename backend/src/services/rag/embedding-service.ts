// Embedding service — calls configured embedding provider for Qdrant vectors

import { getEmbeddingProvider } from '../embedding-provider';

const DEFAULT_EMBEDDING_MODEL = 'bge-m3';
const DEFAULT_EMBEDDING_DIM = 1024;

export async function embedText(text: string): Promise<number[]> {
  const provider = getEmbeddingProvider();
  if (!provider) {
    // Fallback: return zero vector
    return new Array(DEFAULT_EMBEDDING_DIM).fill(0);
  }

  const model = (provider as any).defaultModel || DEFAULT_EMBEDDING_MODEL;
  const result = await provider.embed({ model, texts: [text] });
  if (result.embeddings?.length > 0) return result.embeddings[0];
  return new Array(DEFAULT_EMBEDDING_DIM).fill(0);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const provider = getEmbeddingProvider();
  if (!provider) {
    return texts.map(() => new Array(DEFAULT_EMBEDDING_DIM).fill(0));
  }

  const model = (provider as any).defaultModel || DEFAULT_EMBEDDING_MODEL;
  const result = await provider.embed({ model, texts });
  return result.embeddings || texts.map(() => new Array(DEFAULT_EMBEDDING_DIM).fill(0));
}
