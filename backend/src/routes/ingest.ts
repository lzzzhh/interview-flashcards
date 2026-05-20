// backend/src/routes/ingest.ts — 资料制卡
import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { parseDocument, checkWorkerHealth } from '../services/document/parser-gateway';
import { chunkText } from '../services/document/chunk-text';
import { IngestDocumentSchema, validate } from './schemas';

export async function ingestRoutes(app: FastifyInstance) {
  // 上传文档 → 解析 → chunk → 入库
  app.post('/api/ingest/documents', async (req, reply) => {
    const v = validate(IngestDocumentSchema, req.body);
    if (!v.success) return reply.status(400).send({ error: v.error });
    const { filePath, fileType, targetDeckId } = v.data;

    const workerAlive = await checkWorkerHealth();
    if (!workerAlive) {
      return reply.status(503).send({ error: '文档解析服务未就绪', hint: '请启动 Python parser-worker' });
    }

    // 1. 解析文档
    const parsed = await parseDocument({ filePath, fileType });

    // 2. 写入 SourceDocument
    const source = await prisma.sourceDocument.create({
      data: {
        id: `src-${Date.now()}`,
        fileName: parsed.fileName,
        sourceType: parsed.sourceType,
        parser: parsed.parser,
        fullText: parsed.fullText,
        metadata: JSON.stringify({ pages: parsed.pages?.length || 1, warnings: parsed.warnings }),
        textHash: parsed.textHash,
      },
    });

    // 3. Chunk + 写入 SourceChunk
    const chunks = chunkText(parsed.fullText, { maxTokens: 1024, minTokens: 512 });
    for (const chunk of chunks) {
      await prisma.sourceChunk.create({
        data: {
          id: `chk-${source.id}-${chunk.chunkIndex}`,
          sourceId: source.id,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          tokenCount: chunk.tokenCount,
          hash: chunk.hash,
        },
      });
    }

    return {
      sourceId: source.id,
      fileName: parsed.fileName,
      sourceType: parsed.sourceType,
      chunkCount: chunks.length,
      fullTextLength: parsed.fullText.length,
      warnings: parsed.warnings,
    };
  });

  // 查询任务
  app.get('/api/ingest/jobs/:id', async (req) => {
    const { id } = req.params as { id: string };
    const src = await prisma.sourceDocument.findUnique({
      where: { id },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
    });
    if (!src) return { id, status: 'not_found' };
    return {
      id: src.id,
      fileName: src.fileName,
      sourceType: src.sourceType,
      status: 'completed',
      chunkCount: src.chunks.length,
      fullTextPreview: src.fullText.slice(0, 200),
    };
  });
}
