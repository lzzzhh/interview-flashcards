import { FastifyInstance } from 'fastify';
import { pipeline } from 'stream/promises';
import { createWriteStream, mkdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import prisma from '../db/prisma';
import { z } from 'zod';
import { validate } from './schemas';
import {
  uploadDocument,
  parseDocument,
  chunkDocument,
  extractConceptsFromDocument,
  generateDraftsFromDocument,
} from '../services/document-pipeline';
import { getPipelineProgress, setProgress, cancelPipeline } from '../services/document-pipeline';

const UPLOAD_DIR = join(process.cwd(), 'data', 'uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const allowedMime: Record<string, string> = {
  'application/pdf': 'pdf',
  'text/markdown': 'markdown',
  'text/plain': 'txt',
  'text/x-markdown': 'markdown',
};

function extToType(ext: string): string | null {
  const m: Record<string, string> = { '.pdf': 'pdf', '.md': 'markdown', '.markdown': 'markdown', '.txt': 'txt' };
  return m[ext.toLowerCase()] || null;
}

function multipartFieldValue(field: unknown): string | undefined {
  const value = (field as any)?.value;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function summarizeGeneratedDocument(documentId: string, targetDeckId?: string) {
  if (targetDeckId) {
    await prisma.cardDraft.updateMany({
      where: { documentId },
      data: { deckId: targetDeckId },
    });
  }

  const [chunks, draftCount, textAgg] = await Promise.all([
    prisma.documentChunk.count({ where: { documentId } }),
    prisma.cardDraft.count({ where: { documentId } }),
    prisma.documentChunk.aggregate({
      where: { documentId },
      _sum: { tokenCount: true },
    }),
  ]);

  return {
    chunkCount: chunks,
    draftCount,
    fullTextLength: (textAgg._sum.tokenCount || 0) * 4,
  };
}

async function runDocumentPipeline(documentId: string, targetDeckId?: string) {
  try {
    await parseDocument(documentId);
    await chunkDocument(documentId);
    await extractConceptsFromDocument(documentId);
    await generateDraftsFromDocument(documentId);
    if (targetDeckId) {
      await prisma.cardDraft.updateMany({
        where: { documentId },
        data: { deckId: targetDeckId },
      });
    }
  } catch (e: any) {
    const message = e?.message || String(e);
    setProgress(documentId, 'failed', 0, 5, `错误: ${message}`);
    await prisma.documentSource.update({
      where: { id: documentId },
      data: { status: 'failed', parseError: message },
    }).catch(() => {});
  }
}

// Legacy redirect: /api/ingest/documents → documentRoutes (multipart only)
export async function ingestRedirectRoutes(app: FastifyInstance) {
  app.post('/api/ingest/documents', async (req, reply) => {
    // Only accept multipart file upload (not JSON path-based for security)
    const data = await req.file().catch(() => null);
    if (!data) return reply.status(400).send({ error: 'Only multipart file upload is supported. Use the Tauri file picker.' });
    const filename = data.filename;
    const ext = filename.includes('.') ? '.' + filename.split('.').pop()!.toLowerCase() : '';
    const typeMap: Record<string, string> = { '.pdf': 'pdf', '.md': 'markdown', '.markdown': 'markdown', '.txt': 'txt' };
    const fileTypeNorm = typeMap[ext] || 'pdf';
    const targetDeckId = multipartFieldValue((data as any).fields?.targetDeckId);

    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const savePath = join(UPLOAD_DIR, `${docId}${ext}`);
    const ws = createWriteStream(savePath);
    const { pipeline: pipeline2 } = await import('stream/promises');
    await pipeline2(data.file, ws);
    const size = statSync(savePath).size;

    await uploadDocument(docId, filename, fileTypeNorm as any, size, savePath);
    Promise.resolve().then(() => runDocumentPipeline(docId, targetDeckId));
    return { sourceId: docId, fileName: filename, sourceType: fileTypeNorm, status: 'processing' };
  });
}

export async function documentRoutes(app: FastifyInstance) {
  // POST /api/documents/upload — upload file
  app.post('/api/documents/upload', async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    const filename = data.filename;
    const ext = filename.includes('.') ? '.' + filename.split('.').pop()!.toLowerCase() : '';
    const fileType = extToType(ext) || allowedMime[data.mimetype] || null;
    if (!fileType) return reply.status(400).send({ error: `Unsupported file type: ${ext || data.mimetype}` });

    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const savePath = join(UPLOAD_DIR, `${docId}${ext}`);

    const ws = createWriteStream(savePath);
    await pipeline(data.file, ws);
    const size = statSync(savePath).size;

    await uploadDocument(docId, filename, fileType as any, size, savePath);

    return { id: docId, filename, fileType, fileSize: size, status: 'uploaded' };
  });

  // POST /api/documents/:id/parse
  app.post('/api/documents/:id/parse', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await parseDocument(id);
      return { id, status: 'parsed' };
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });

  // POST /api/documents/:id/chunk
  app.post('/api/documents/:id/chunk', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await chunkDocument(id);
      return { id, status: 'chunked' };
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });

  // POST /api/documents/:id/extract-concepts
  app.post('/api/documents/:id/extract-concepts', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await extractConceptsFromDocument(id);
      return { id, status: 'concepts_extracted' };
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });

  // POST /api/documents/:id/generate-drafts
  app.post('/api/documents/:id/generate-drafts', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await generateDraftsFromDocument(id);
      return { id, status: 'draft_ready' };
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });

  // POST /api/documents/process — async: returns immediately, poll for progress/results
  app.post('/api/documents/process', async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.status(400).send({ error: 'No file uploaded' });

    const filename = data.filename;
    const ext = filename.includes('.') ? '.' + filename.split('.').pop()!.toLowerCase() : '';
    const fileType = extToType(ext) || allowedMime[data.mimetype] || null;
    if (!fileType) return reply.status(400).send({ error: `Unsupported file type: ${ext || data.mimetype}` });
    const targetDeckId = multipartFieldValue((data as any).fields?.targetDeckId);

    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const savePath = join(UPLOAD_DIR, `${docId}${ext}`);

    const ws = createWriteStream(savePath);
    await pipeline(data.file, ws);
    const size = statSync(savePath).size;

    await uploadDocument(docId, filename, fileType as any, size, savePath);

    Promise.resolve().then(() => runDocumentPipeline(docId, targetDeckId));

    return { id: docId, filename, fileType, status: 'processing', message: '文档已上传，正在后台处理...' };
  });

  // GET /api/documents — list
  app.get('/api/documents', async () => {
    const docs = await prisma.documentSource.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return docs.map(d => ({
      id: d.id,
      filename: d.filename,
      fileType: d.fileType,
      fileSize: d.fileSize,
      status: d.status,
      parseError: d.parseError,
      createdAt: d.createdAt,
    }));
  });

  // GET /api/documents/:id/drafts
  app.get('/api/documents/:id/drafts', async (req) => {
    const { id } = req.params as { id: string };
    const drafts = await prisma.cardDraft.findMany({
      where: { documentId: id },
      orderBy: { createdAt: 'desc' },
    });
    return drafts.map(formatDraft);
  });

  // GET /api/documents/:id
  app.get('/api/documents/:id', async (req) => {
    const { id } = req.params as { id: string };
    const doc = await prisma.documentSource.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { orderIndex: 'asc' },
          take: 20,
        },
      },
    });
    if (!doc) return { error: 'Not found' };
    return doc;
  });

  // GET /api/card-drafts — list all drafts
  app.get('/api/card-drafts', async (req) => {
    const url = new URL(req.url, 'http://x');
    const status = url.searchParams.get('status');
    const where: any = {};
    if (status) where.status = status;

    const drafts = await prisma.cardDraft.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return drafts.map(formatDraft);
  });

  // PATCH /api/card-drafts/:id — edit draft
  app.patch('/api/card-drafts/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const UpdateDraftSchema = z.object({
      question: z.string().optional(),
      answer: z.string().optional(),
      tags: z.array(z.string()).optional(),
      searchKeywords: z.array(z.string()).optional(),
      canonicalTopic: z.string().nullable().optional(),
      deckId: z.string().optional(),
      reviewNote: z.string().optional(),
    });
    const v = validate(UpdateDraftSchema, req.body);
    if (!v.success) return reply.status(400).send({ error: v.error });

    const updateData: any = {};
    const body = v.data;
    if (body.question !== undefined) updateData.question = body.question;
    if (body.answer !== undefined) updateData.answer = body.answer;
    if (body.tags !== undefined) updateData.tagsJson = JSON.stringify(body.tags);
    if (body.searchKeywords !== undefined) updateData.searchKeywordsJson = JSON.stringify(body.searchKeywords);
    if (body.canonicalTopic !== undefined) updateData.canonicalTopic = body.canonicalTopic;
    if (body.deckId !== undefined) updateData.deckId = body.deckId;
    if (body.reviewNote !== undefined) updateData.reviewNote = body.reviewNote;

    const updated = await prisma.cardDraft.update({
      where: { id },
      data: updateData,
    });
    return formatDraft(updated);
  });

  async function ensureDeckExists(deckId: string, deckName?: string) {
  const existing = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!existing) {
    const maxOrder = await prisma.deck.aggregate({ _max: { sortOrder: true } });
    await prisma.deck.create({
      data: {
        id: deckId,
        name: deckName || deckId,
        type: 'custom',
        icon: 'FileText',
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    console.log(`[documentRoutes] Created deck "${deckId}"`);
  }
}

// POST /api/card-drafts/:id/approve — approve for import
  app.post('/api/card-drafts/:id/approve', async (req, reply) => {
    const { id } = req.params as { id: string };
    const draft = await prisma.cardDraft.findUnique({ where: { id } });
    if (!draft) return reply.status(404).send({ error: 'Draft not found' });

    const body = req.body as any || {};
    const deckId = body.deckId || draft.deckId;
    if (!deckId) return reply.status(400).send({ error: 'deckId required before approve' });

    // Final validation
    const tags: string[] = JSON.parse(draft.tagsJson || '[]');
    const searchKeywords: string[] = JSON.parse(draft.searchKeywordsJson || '[]');
    if (!draft.question || !draft.answer) return reply.status(400).send({ error: 'question and answer required' });
    if (tags.length === 0) return reply.status(400).send({ error: 'at least one tag required' });

    // Check duplicate status
    const dupCheck = draft.duplicateCheckJson ? JSON.parse(draft.duplicateCheckJson) : null;
    if (['possible_duplicate', 'exact_duplicate', 'semantic_duplicate'].includes(dupCheck?.status)) {
      return reply.status(400).send({
        error: `Duplicate status "${dupCheck?.status}" — resolve before approve.`,
        matchedCardIds: dupCheck?.matchedCardIds,
      });
    }

    // Check unresolved duplicate group
    if (draft.duplicateGroupId) {
      const groupDrafts = await prisma.cardDraft.findMany({
        where: { duplicateGroupId: draft.duplicateGroupId, status: { notIn: ['rejected', 'out_of_scope'] } },
        select: { id: true, status: true },
      });
      const unresolved = groupDrafts.filter(g => g.status !== 'approved');
      if (unresolved.length > 1) {
        return reply.status(400).send({
          error: `Duplicate group ${draft.duplicateGroupId} has ${unresolved.length} unresolved drafts. Resolve via merge/reject/keep_both before approve.`,
          groupDraftIds: unresolved.map(g => g.id),
        });
      }
    }

    await ensureDeckExists(deckId);

    const cardId = `draft_${id}`;
    await prisma.card.create({
      data: {
        id: cardId,
        deckId,
        type: 'qa',
        question: draft.question,
        answer: draft.answer,
        tags: JSON.stringify(tags),
        searchKeywords: JSON.stringify(searchKeywords),
        source: `document:${draft.documentId}`,
      },
    });

    await prisma.cardDraft.update({
      where: { id },
      data: { status: 'approved', importedCardId: cardId, deckId },
    });

    await prisma.cardDraftReview.create({
      data: {
        draftId: id,
        action: 'approve',
        afterJson: JSON.stringify({ importedCardId: cardId }),
        createdAt: new Date().toISOString(),
      },
    });

    return { id, status: 'approved', cardId };
  });

  // POST /api/card-drafts/:id/reject
  app.post('/api/card-drafts/:id/reject', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any || {};

    await prisma.cardDraft.update({
      where: { id },
      data: { status: 'rejected', reviewNote: body.note || null },
    });

    await prisma.cardDraftReview.create({
      data: { draftId: id, action: 'reject', note: body.note || null, createdAt: new Date().toISOString() },
    });

    return { id, status: 'rejected' };
  });

  // POST /api/card-drafts/:id/mark-duplicate
  app.post('/api/card-drafts/:id/mark-duplicate', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any || {};

    const dupCheck = { status: 'possible_duplicate', matchedCardIds: body.matchedCardIds || [], reason: body.note || '' };
    await prisma.cardDraft.update({
      where: { id },
      data: { status: 'duplicate', duplicateCheckJson: JSON.stringify(dupCheck), reviewNote: body.note || null },
    });

    await prisma.cardDraftReview.create({
      data: { draftId: id, action: 'mark_duplicate', note: body.note || null, createdAt: new Date().toISOString() },
    });

    return { id, status: 'duplicate' };
  });

  // POST /api/card-drafts/:id/mark-out-of-scope
  app.post('/api/card-drafts/:id/mark-out-of-scope', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any || {};

    await prisma.cardDraft.update({
      where: { id },
      data: { status: 'out_of_scope', reviewNote: body.note || null },
    });

    await prisma.cardDraftReview.create({
      data: { draftId: id, action: 'mark_out_of_scope', note: body.note || null, createdAt: new Date().toISOString() },
    });

    return { id, status: 'out_of_scope' };
  });

  // POST /api/card-drafts/import-dry-run — validate drafts before import
  app.post('/api/card-drafts/import-dry-run', async (req, reply) => {
    const { draftIds, deckId } = req.body as { draftIds?: string[]; deckId?: string };
    const where: any = draftIds?.length ? { id: { in: draftIds } } : { status: 'draft' };
    const drafts = await prisma.cardDraft.findMany({ where, take: 50 });

    const result = {
      totalChecked: drafts.length,
      willCreateCards: 0,
      blockedDrafts: [] as string[],
      unresolvedDuplicates: [] as string[],
      missingDeckId: [] as string[],
      missingTags: [] as string[],
      missingSearchKeywords: [] as string[],
      graphPending: [] as string[],
    };

    for (const d of drafts) {
      const dupCheck = d.duplicateCheckJson ? JSON.parse(d.duplicateCheckJson) : {};
      const tags = JSON.parse(d.tagsJson || '[]');
      const kw = JSON.parse(d.searchKeywordsJson || '[]');
      const blocked: string[] = [];

      if (['exact_duplicate', 'semantic_duplicate', 'possible_duplicate'].includes(dupCheck.status)) {
        result.unresolvedDuplicates.push(d.id); blocked.push('dup');
      }
      if (d.duplicateGroupId) {
        const gp = await prisma.cardDraft.findMany({ where: { duplicateGroupId: d.duplicateGroupId, status: { notIn: ['rejected', 'out_of_scope'] } }, select: { id: true } });
        if (gp.length > 1) { result.unresolvedDuplicates.push(d.id); blocked.push('dup-group'); }
      }
      if (!deckId && !d.deckId) { result.missingDeckId.push(d.id); blocked.push('deck'); }
      if (tags.length === 0) { result.missingTags.push(d.id); blocked.push('tags'); }
      if (kw.length === 0) { result.missingSearchKeywords.push(d.id); blocked.push('kw'); }
      if (d.graphStatus === 'graph_pending') result.graphPending.push(d.id);

      if (blocked.length > 0) result.blockedDrafts.push(d.id);
      else result.willCreateCards++;
    }

    return result;
  });

  // POST /api/card-drafts/batch-import — small batch import (max 20)
  app.post('/api/card-drafts/batch-import', async (req, reply) => {
    const v = validate(z.object({
      draftIds: z.array(z.string()).min(1).max(20),
      deckId: z.string().min(1),
    }), req.body);
    if (!v.success) return reply.status(400).send({ error: v.error });

    const { draftIds, deckId } = v.data;
    const results: { id: string; status: string; cardId?: string; error?: string }[] = [];

    for (const id of draftIds) {
      try {
        const draft = await prisma.cardDraft.findUnique({ where: { id } });
        if (!draft) { results.push({ id, status: 'error', error: 'Not found' }); continue; }

        const tags = JSON.parse(draft.tagsJson || '[]');
        const kw = JSON.parse(draft.searchKeywordsJson || '[]');
        const dupCheck = draft.duplicateCheckJson ? JSON.parse(draft.duplicateCheckJson) : {};

        if (!draft.question || !draft.answer) { results.push({ id, status: 'error', error: 'q/a empty' }); continue; }
        if (tags.length === 0) { results.push({ id, status: 'error', error: 'no tags' }); continue; }
        if (['exact_duplicate', 'semantic_duplicate', 'possible_duplicate'].includes(dupCheck.status)) {
          results.push({ id, status: 'error', error: `dup: ${dupCheck.status}` }); continue;
        }
        if (draft.duplicateGroupId) {
          const gp = await prisma.cardDraft.findMany({ where: { duplicateGroupId: draft.duplicateGroupId, status: { notIn: ['rejected', 'out_of_scope'] } }, select: { id: true } });
          if (gp.length > 1) { results.push({ id, status: 'error', error: 'dup group unresolved' }); continue; }
        }

        await ensureDeckExists(deckId);

        const cardId = `draft_${id}`;
        await prisma.card.create({
          data: {
            id: cardId, deckId, type: 'qa',
            question: draft.question, answer: draft.answer,
            tags: JSON.stringify(tags), searchKeywords: JSON.stringify(kw),
            source: `document:${draft.documentId}`,
          },
        });
        await prisma.cardDraft.update({ where: { id }, data: { status: 'approved', importedCardId: cardId, deckId } });
        await prisma.cardDraftReview.create({ data: { draftId: id, action: 'approve', afterJson: JSON.stringify({ importedCardId: cardId }), createdAt: new Date().toISOString() } });
        results.push({ id, status: 'approved', cardId });
      } catch (e: any) {
        results.push({ id, status: 'error', error: e.message });
      }
    }

    return { results, imported: results.filter(r => r.status === 'approved').length };
  });

  // POST /api/card-drafts/batch-review — batch review action
  app.post('/api/card-drafts/batch-review', async (req, reply) => {
    const BatchReviewSchema = z.object({
      draftIds: z.array(z.string()).min(1).max(500),
      action: z.enum(['approve', 'edit', 'reject', 'mark_duplicate', 'mark_out_of_scope', 'merge', 'keep_both', 'keep_best', 'restore_status']),
      deckId: z.string().optional(),
      note: z.string().optional(),
      restoreStatus: z.enum(['draft', 'needs_review', 'approved', 'rejected', 'duplicate', 'merged', 'out_of_scope']).optional(),
      edits: z.record(z.object({
        question: z.string().optional(),
        answer: z.string().optional(),
        tags: z.array(z.string()).optional(),
        searchKeywords: z.array(z.string()).optional(),
        canonicalTopic: z.string().nullable().optional(),
      })).optional(),
    });
    const v = validate(BatchReviewSchema, req.body);
    if (!v.success) return reply.status(400).send({ error: v.error });
    const { draftIds, action, deckId, note, restoreStatus, edits } = v.data;

    const results: { id: string; status: string; error?: string; cardId?: string }[] = [];

    for (const id of draftIds) {
      try {
        switch (action) {
          case 'approve': {
            const draft = await prisma.cardDraft.findUnique({ where: { id } });
            if (!draft) { results.push({ id, status: 'error', error: 'Not found' }); continue; }
            // Use draft's own deckId if already set
            const targetDeck = deckId || draft.deckId;
            if (!targetDeck) { results.push({ id, status: 'error', error: 'deckId required' }); continue; }

            const tags = JSON.parse(draft.tagsJson || '[]');
            const kw = JSON.parse(draft.searchKeywordsJson || '[]');
            if (!draft.question || !draft.answer) { results.push({ id, status: 'error', error: 'question/answer required' }); continue; }
            if (tags.length === 0) { results.push({ id, status: 'error', error: 'at least one tag required' }); continue; }

            const dupCheck = draft.duplicateCheckJson ? JSON.parse(draft.duplicateCheckJson) : null;
            if (['possible_duplicate', 'exact_duplicate', 'semantic_duplicate'].includes(dupCheck?.status)) {
              results.push({ id, status: 'error', error: `Duplicate unresolved: ${dupCheck?.status}` }); continue;
            }

            await ensureDeckExists(targetDeck);

            const cardId = `draft_${id}`;
            await prisma.card.create({
              data: {
                id: cardId, deckId: targetDeck, type: 'qa',
                question: draft.question, answer: draft.answer,
                tags: JSON.stringify(tags), searchKeywords: JSON.stringify(kw),
                source: `document:${draft.documentId}`,
              },
            });
            await prisma.cardDraft.update({ where: { id }, data: { status: 'approved', importedCardId: cardId, deckId: targetDeck } });
            await prisma.cardDraftReview.create({ data: { draftId: id, action: 'approve', afterJson: JSON.stringify({ importedCardId: cardId }), createdAt: new Date().toISOString() } });
            results.push({ id, status: 'approved', cardId });
            break;
          }
          case 'reject': {
            await prisma.cardDraft.update({ where: { id }, data: { status: 'rejected', reviewNote: note || null } });
            await prisma.cardDraftReview.create({ data: { draftId: id, action: 'reject', note: note || null, createdAt: new Date().toISOString() } });
            results.push({ id, status: 'rejected' });
            break;
          }
          case 'mark_duplicate': {
            await prisma.cardDraft.update({
              where: { id },
              data: { status: 'duplicate', duplicateCheckJson: JSON.stringify({ status: 'possible_duplicate' }), reviewNote: note || null },
            });
            await prisma.cardDraftReview.create({ data: { draftId: id, action: 'mark_duplicate', note: note || null, createdAt: new Date().toISOString() } });
            results.push({ id, status: 'duplicate' });
            break;
          }
          case 'mark_out_of_scope': {
            await prisma.cardDraft.update({ where: { id }, data: { status: 'out_of_scope', reviewNote: note || null } });
            await prisma.cardDraftReview.create({ data: { draftId: id, action: 'mark_out_of_scope', note: note || null, createdAt: new Date().toISOString() } });
            results.push({ id, status: 'out_of_scope' });
            break;
          }
          case 'edit': {
            const edit = edits?.[id];
            if (!edit) { results.push({ id, status: 'error', error: 'No edits provided' }); continue; }
            const updateData: any = {};
            if (edit.question !== undefined) updateData.question = edit.question;
            if (edit.answer !== undefined) updateData.answer = edit.answer;
            if (edit.tags !== undefined) updateData.tagsJson = JSON.stringify(edit.tags);
            if (edit.searchKeywords !== undefined) updateData.searchKeywordsJson = JSON.stringify(edit.searchKeywords);
            if (edit.canonicalTopic !== undefined) updateData.canonicalTopic = edit.canonicalTopic;
            await prisma.cardDraft.update({ where: { id }, data: updateData });
            results.push({ id, status: 'edited' });
            break;
          }
          case 'merge': {
            // Group action: execute once, not per-ID
            if (id !== draftIds[0]) continue;
            // Merge: keep first draft's content, mark rest as merged
            const primaryId = draftIds[0];
            for (const did of draftIds) {
              if (did === primaryId) continue;
              await prisma.cardDraft.update({ where: { id: did }, data: { status: 'merged', duplicateGroupId: null, reviewNote: `Merged into ${primaryId}` } });
              await prisma.cardDraftReview.create({ data: { draftId: did, action: 'merge', note: `Merged into ${primaryId}`, createdAt: new Date().toISOString() } });
            }
            // Update primary: clear group, set note
            await prisma.cardDraft.update({ where: { id: primaryId }, data: { duplicateGroupId: null, reviewNote: note || 'Merged from group' } });
            results.push({ id: primaryId, status: 'merged_primary' });
            for (const did of draftIds) {
              if (did !== primaryId) results.push({ id: did, status: 'merged' });
            }
            break;
          }
          case 'keep_both': {
            // Group action: execute once, not per-ID
            if (id !== draftIds[0]) continue;
            for (const did of draftIds) {
              await prisma.cardDraft.update({ where: { id: did }, data: { duplicateGroupId: null, reviewNote: note || 'Keep both — reviewed' } });
              await prisma.cardDraftReview.create({ data: { draftId: did, action: 'keep_both', note: note || null, createdAt: new Date().toISOString() } });
              results.push({ id: did, status: 'keep_both' });
            }
            break;
          }
          case 'keep_best': {
            // Group action: execute once, not per-ID
            if (id !== draftIds[0]) continue;
            const bestId = draftIds[0];
            for (const did of draftIds) {
              if (did === bestId) continue;
              await prisma.cardDraft.update({ where: { id: did }, data: { status: 'rejected', duplicateGroupId: null, reviewNote: `Dup of ${bestId}` } });
              await prisma.cardDraftReview.create({ data: { draftId: did, action: 'reject', note: `Keep best: ${bestId}`, createdAt: new Date().toISOString() } });
              results.push({ id: did, status: 'rejected_as_dup' });
            }
            await prisma.cardDraft.update({ where: { id: bestId }, data: { duplicateGroupId: null, reviewNote: note || 'Kept as best' } });
            results.push({ id: bestId, status: 'keep_best' });
            break;
          }
          case 'restore_status': {
            if (!restoreStatus) { results.push({ id, status: 'error', error: 'restoreStatus required' }); continue; }
            const draft = await prisma.cardDraft.findUnique({ where: { id } });
            if (!draft) { results.push({ id, status: 'error', error: 'Not found' }); continue; }
            if (draft.importedCardId) {
              await prisma.reviewLog.deleteMany({ where: { cardId: draft.importedCardId } });
              await prisma.cardProgress.deleteMany({ where: { cardId: draft.importedCardId } });
              await prisma.$executeRawUnsafe('DELETE FROM card_fts WHERE cardId = ?', draft.importedCardId).catch(() => {});
              await prisma.card.delete({ where: { id: draft.importedCardId } }).catch(() => {});
            }
            await prisma.cardDraft.update({
              where: { id },
              data: { status: restoreStatus, importedCardId: null, reviewNote: note || null },
            });
            await prisma.cardDraftReview.create({
              data: { draftId: id, action: 'restore_status', note: note || null, createdAt: new Date().toISOString() },
            });
            results.push({ id, status: restoreStatus });
            break;
          }
        }
      } catch (e: any) {
        results.push({ id, status: 'error', error: e.message });
      }
    }

    return { results };
  });

  // GET /api/documents/:id/progress — pipeline progress
  app.get('/api/documents/:id/progress', async (req) => {
    const { id } = req.params as { id: string };
    const progress = getPipelineProgress(id);
    if (!progress) {
      const doc = await prisma.documentSource.findUnique({ where: { id }, select: { status: true } });
      if (!doc) return { stage: 'not_found', step: 0, total: 5, message: '文档未找到' };
      if (doc.status === 'uploaded') return { stage: 'waiting', step: 0, total: 5, message: '等待处理...' };
      if (doc.status === 'draft_ready') return { stage: 'done', step: 5, total: 5, message: '完成！' };
      if (doc.status === 'failed') return { stage: 'failed', step: 0, total: 5, message: '处理失败' };
      return { stage: doc.status, step: 1, total: 5, message: `状态: ${doc.status}` };
    }
    return progress;
  });

  // DELETE /api/documents/:id
  app.delete('/api/documents/:id', async (req) => {
    const { id } = req.params as { id: string };
    const doc = await prisma.documentSource.findUnique({ where: { id } });
    if (doc?.filePath) {
      try { await import('fs/promises').then(fs => fs.unlink(doc.filePath)); } catch {}
    }
    await prisma.documentBlock.deleteMany({ where: { documentId: id } });
    await prisma.documentChunk.deleteMany({ where: { documentId: id } });
    await prisma.extractedConcept.deleteMany({ where: { documentId: id } });
    await prisma.cardDraft.deleteMany({ where: { documentId: id } });
    await prisma.documentSource.delete({ where: { id } });
    return { deleted: true };
  });
}

function formatDraft(d: any) {
  return {
    id: d.id,
    documentId: d.documentId,
    chunkId: d.chunkId,
    conceptId: d.conceptId,
    type: d.type,
    question: d.question,
    answer: d.answer,
    tags: safeJsonParse(d.tagsJson),
    searchKeywords: safeJsonParse(d.searchKeywordsJson),
    canonicalTopic: d.canonicalTopic,
    canonicalConcept: d.canonicalConcept,
    learningObjective: d.learningObjective,
    atomicFacts: safeJsonParse(d.atomicFactsJson),
    answerScope: d.answerScope,
    graphNodeId: d.graphNodeId,
    graphStatus: d.graphStatus,
    confidence: d.confidence,
    status: d.status,
    duplicateCheck: safeJsonParse(d.duplicateCheckJson),
    duplicateGroupId: d.duplicateGroupId,
    sourceRefs: safeJsonParse(d.sourceRefsJson),
    reviewNote: d.reviewNote,
    importedCardId: d.importedCardId,
    deckId: d.deckId,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function safeJsonParse(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
