// backend/src/services/search/search-trace.ts
// Search trace collector — records each pipeline stage for debugging.

export interface ChannelDebug {
  count: number;
  top: Array<{ cardId: string; title?: string; score?: number; matched?: string[] }>;
}

export interface CandidateDebug {
  cardId: string;
  title?: string;
  score?: number;
  sources?: string[];
  keywordScore?: number;
  vectorScore?: number;
  matchedKeywords?: string[];
}

export interface RerankBreakdown {
  cardId: string;
  title?: string;
  finalScore: number;
  vectorScore: number;
  keywordScore: number;
  fieldBoost: number;
  learningBoost: number;
  deckBoost: number;
  lexicalBoost: number;
  matchedFields?: { tags?: string[]; approach?: string[]; titleCn?: string[]; question?: string[] };
}

export interface SearchDebugTrace {
  traceId: string;
  timingMs: Record<string, number>;

  request: {
    rawQuery: string;
    maxResults: number;
    minScore: number;
    deckIds?: string[];
  };

  understanding: {
    intent: string;
    source: 'regex' | 'llm' | 'fallback';
    confidence: number;
    topic: string;
    deckHint?: string;
    subtopics: string[];
    constraints: Record<string, unknown>;
    validation: { before: { topic: string; rewrittenQuery: string }; after: { topic: string; rewrittenQuery: string }; warnings: string[] };
  };

  rewrite: {
    rewrittenQuery: string;
    keywords: string[];
    expandedKeywords: string[];
    canonicalTopic?: string;
    dictionaryHit: boolean;
    rewriteSource: 'llm' | 'dict' | 'fallback';
  };

  retrievalText: {
    recallText: string;
    rerankText: string;
    rawQueryUsed: boolean;
  };

  retrieval: {
    fts5: ChannelDebug;
    like: ChannelDebug;
    tag: ChannelDebug;
    searchKeywords: ChannelDebug;
    vector: ChannelDebug;
  };

  merge: {
    beforeDedup: number;
    afterDedup: number;
    topCandidates: CandidateDebug[];
  };

  hydration: {
    requested: number;
    hydrated: number;
    missing: string[];
  };

  filters: {
    before: number;
    after: number;
    removed: Array<{ cardId: string; reason: string }>;
  };

  rerank: {
    profile: string;
    top: RerankBreakdown[];
  };

  threshold: {
    minScore: number;
    before: number;
    after: number;
    removed: Array<{ cardId: string; title?: string; score: number }>;
  };

  final: {
    returned: number;
    top: Array<{ cardId: string; title: string; score: number; explanation: string }>;
  };
}

export class TraceCollector {
  trace: Partial<SearchDebugTrace> = {};
  private timers: Record<string, number> = {};
  traceId: string;

  constructor(rawQuery: string, maxResults: number, minScore: number, deckIds?: string[]) {
    this.traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.trace.request = { rawQuery, maxResults, minScore, deckIds };
    this.trace.timingMs = {};
    this.trace.retrieval = {
      fts5: { count: 0, top: [] },
      like: { count: 0, top: [] },
      tag: { count: 0, top: [] },
      searchKeywords: { count: 0, top: [] },
      vector: { count: 0, top: [] },
    };
  }

  start(name: string) { this.timers[name] = Date.now(); }
  end(name: string) { if (this.timers[name]) { this.trace.timingMs![name] = Date.now() - this.timers[name]; } }

  build(): SearchDebugTrace {
    return this.trace as SearchDebugTrace;
  }
}
