// backend/src/evaluation/eval-init.ts
// Shared evaluation initialization — both main runner and ablation runner import from here.
// Handles env, LLM provider, embedding provider, vector store, FTS5.

import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider, getEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { dbInfo } from './eval-config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Env Loading ──
export function loadEnvFile() {
  const p = __dirname + '/../../.env';
  try {
    const content = readFileSync(p, 'utf-8');
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch { /* .env not found */ }
}

// ── Embedding Verification ──
export interface EmbeddingInfo {
  provider: string;
  expectedModel: string;
  actualModel: string;
  dimension: number;
  verified: boolean;
}

// ── Provider Init ──
export async function initEvalProviders(options?: {
  llm?: boolean;
  verbose?: boolean;
}): Promise<any> {
  const verbose = options?.verbose !== false;
  const db = dbInfo();

  // LLM provider
  let llmProvider: any = null;
  if (options?.llm !== false && db.LLM_URL && process.env.LLM_API_KEY) {
    try {
      llmProvider = new OpenAIChatProvider(db.LLM_URL, process.env.LLM_API_KEY!);
      (llmProvider as any).defaultModel = db.LLM_MODEL;
      setLLMProvider(llmProvider);
      if (verbose) console.log(`[eval] LLM ready: ${db.LLM_URL} (${db.LLM_MODEL})`);
    } catch (e) {
      if (verbose) console.log('[eval] LLM init failed, continuing without LLM');
    }
  } else if (verbose) {
    console.log('[eval] LLM not configured');
  }

  // Embedding provider — HARDENED: no silent fallback
  const expectedModel = db.EMBEDDING_MODEL;
  const allowFallback = process.env.ALLOW_LOCAL_EMBEDDING_FALLBACK === 'true';

  if (db.EMBEDDING_URL && process.env.EMBEDDING_API_KEY) {
    const ep = new OpenAIEmbeddingProvider(db.EMBEDDING_URL, process.env.EMBEDDING_API_KEY!);
    (ep as any).defaultModel = expectedModel;
    const actualModel = (ep as any).defaultModel;

    // Verify: smoke test the embedding
    try {
      const smoke = await ep.embed({ model: actualModel, texts: ['smoke test'] });
      if (verbose) {
        console.log(`[eval] Embedding verified: ${db.EMBEDDING_URL} (model=${actualModel}, dim=${smoke.dimension})`);
      }

      // Guard: model mismatch is fatal
      if (expectedModel && actualModel !== expectedModel) {
        console.error(`[eval] FATAL: Embedding model mismatch! Expected "${expectedModel}" but provider returned "${actualModel}"`);
        console.error('[eval]   Check EMBEDDING_MODEL in .env and that the provider supports this model.');
        console.error('[eval]   The previous ablation used a broken fallback (n-gram) because of this exact bug.');
        process.exit(3);
      }

      setEmbeddingProvider(ep);
    } catch (smokeErr: any) {
      const msg = smokeErr?.message || String(smokeErr);
      if (msg.includes('not found') || msg.includes('not_found')) {
        console.error(`[eval] FATAL: Embedding model "${actualModel}" not found on ${db.EMBEDDING_URL}`);
        console.error(`[eval]   Ollama returned 404 for model "${actualModel}". Pull it with: ollama pull ${actualModel}`);
        console.error('[eval]   The previous ablation silently fell back to local n-gram vectors because of this bug.');
        console.error('[eval]   Set ALLOW_LOCAL_EMBEDDING_FALLBACK=true to bypass this check.');
        process.exit(3);
      }
      if (allowFallback) {
        if (verbose) console.log(`[eval] Embedding smoke test failed (${msg.slice(0, 100)}) — falling back to local n-gram (explicitly allowed)`);
      } else {
        console.error(`[eval] FATAL: Embedding smoke test failed: ${msg.slice(0, 200)}`);
        console.error('[eval]   Set ALLOW_LOCAL_EMBEDDING_FALLBACK=true if you want to proceed with local n-gram.');
        process.exit(3);
      }
    }
  } else if (allowFallback) {
    if (verbose) console.log('[eval] Embedding not configured — using local n-gram (explicitly allowed)');
  } else {
    console.error('[eval] FATAL: No embedding provider configured.');
    console.error('[eval]   Set EMBEDDING_BASE_URL and EMBEDDING_API_KEY in .env, or ALLOW_LOCAL_EMBEDDING_FALLBACK=true.');
    process.exit(3);
  }

  // Vector store
  if (getVectorStore().name === 'noop') {
    setVectorStore(new SqliteVecVectorStore());
  }
  await initVectorStore();
  if (verbose) console.log(`[eval] Vector store: ${getVectorStore().name}`);

  // FTS5
  await initFTS5();
  if (verbose) console.log('[eval] FTS5 initialized');

  return llmProvider;
}

export function getEmbeddingInfo(): EmbeddingInfo {
  const db = dbInfo();
  const provider = getEmbeddingProvider();
  return {
    provider: db.EMBEDDING_URL || 'local',
    expectedModel: db.EMBEDDING_MODEL,
    actualModel: provider ? (provider as any).defaultModel || 'unknown' : 'none',
    dimension: 0, // determined at runtime
    verified: provider !== null,
  };
}
