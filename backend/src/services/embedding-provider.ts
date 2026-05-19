// backend/src/services/embedding-provider.ts — Embedding Provider 抽象

export interface EmbeddingRequest {
  model: string;
  texts: string[];
}

export interface EmbeddingResponse {
  embeddings: number[][];
  dimension: number;
}

export interface EmbeddingProvider {
  name: string;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  name = 'openai';
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const res = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: request.model, input: request.texts }),
    });
    if (!res.ok) throw new Error(`Embedding error: ${res.status}`);
    const data = await res.json() as any;
    const embeddings = (data.data || []).map((d: any) => d.embedding as number[]);
    return { embeddings, dimension: embeddings[0]?.length || 0 };
  }
}

let provider: EmbeddingProvider | null = null;

export function setEmbeddingProvider(p: EmbeddingProvider) { provider = p; }
export function getEmbeddingProvider(): EmbeddingProvider | null { return provider; }
