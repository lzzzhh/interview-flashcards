import prisma from '../db/prisma';
import { parseFile } from './document-parser/parser';
import { chunkDocument as chunkBlocks } from './document-chunker';
import { extractConcepts } from './document-concept-extractor';
import { generateDrafts } from './document-draft-generator';
import { matchConceptToGraph } from './document-graph-matcher';
import { checkDuplicate, intraDocumentDedup } from './document-dedup';
import { translateDrafts } from './document-translator';
import type { ParsedDocument, DocumentChunk, ExtractedConceptData, CardDraftData, SourceRef } from './document-parser/types';

// In-memory progress tracking (keyed by documentId)
export interface PipelineProgress {
  stage: string;    // parsing | chunking | extracting | generating | dedup | done | failed
  step: number;     // current step
  total: number;    // total steps
  message: string;  // human-readable message
}

const progressMap = new Map<string, PipelineProgress>();

export function getPipelineProgress(documentId: string): PipelineProgress | null {
  return progressMap.get(documentId) || null;
}

export function setProgress(documentId: string, stage: string, step: number, total: number, message: string) {
  progressMap.set(documentId, { stage, step, total, message });
}

// Admin/logistics content patterns — skip or mark out_of_scope
const ADMIN_PATTERNS = [
  /exam\s*(date|time|location|schedule|duration|cover|venue)/i,
  /考试\s*(时间|地点|安排|日期|考场)/,
  /workshop\s*contribution/i,
  /consultation\s*hours?/i,
  /survey\s*(link|url|feedback)/i,
  /问卷调查/i,
  /office\s*hours/i,
  /tutorial\s*(time|room|location)/i,
  /辅导\s*(时间|地点|教室)/,
  /due\s*date/i,
  /提交\s*日期|截止\s*时间/,
  /class\s*(cancelled|canceled)/i,
  /课程\s*(取消|停课)/,
];

export async function uploadDocument(
  docId: string,
  filename: string,
  fileType: 'pdf' | 'markdown' | 'txt',
  fileSize: number,
  filePath: string,
): Promise<string> {
  const now = new Date().toISOString();
  const doc = await prisma.documentSource.create({
    data: { id: docId, filename, fileType, fileSize, filePath, status: 'uploaded', createdAt: now, updatedAt: now },
  });
  return doc.id;
}

export async function parseDocument(documentId: string): Promise<void> {
  setProgress(documentId, 'parsing', 1, 5, '正在解析文档...');
  const doc = await prisma.documentSource.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error('Document not found');

  await prisma.documentSource.update({ where: { id: documentId }, data: { status: 'parsing' } });

  try {
    const parsed = await parseFile(doc.filePath, doc.filename, doc.fileType as any, documentId);

    // Save blocks
    for (const block of parsed.blocks) {
      await prisma.documentBlock.create({
        data: {
          id: block.id,
          documentId: block.documentId,
          pageNumber: block.pageNumber,
          sectionPath: block.sectionPath ? JSON.stringify(block.sectionPath) : null,
          type: block.type,
          text: block.text,
          bboxJson: block.bbox ? JSON.stringify(block.bbox) : null,
          source: block.source,
          confidence: block.confidence ?? null,
          orderIndex: block.orderIndex,
        },
      });
    }

    await prisma.documentSource.update({
      where: { id: documentId },
      data: { status: 'parsed' },
    });
  } catch (e: any) {
    await prisma.documentSource.update({
      where: { id: documentId },
      data: { status: 'failed', parseError: e.message },
    });
    throw e;
  }
}

export async function chunkDocument(documentId: string): Promise<void> {
  setProgress(documentId, 'chunking', 2, 5, '正在切分文档段落...');
  const doc = await prisma.documentSource.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error('Document not found');

  await prisma.documentSource.update({ where: { id: documentId }, data: { status: 'chunking' } });

  const dbBlocks = await prisma.documentBlock.findMany({
    where: { documentId },
    orderBy: { orderIndex: 'asc' },
  });

  const parsedDoc: ParsedDocument = {
    id: documentId,
    filename: doc.filename,
    fileType: doc.fileType as any,
    markdown: '',
    blocks: dbBlocks.map(b => ({
      id: b.id,
      documentId: b.documentId,
      pageNumber: b.pageNumber ?? undefined,
      sectionPath: b.sectionPath ? JSON.parse(b.sectionPath) : undefined,
      type: b.type as any,
      text: b.text,
      bbox: b.bboxJson ? JSON.parse(b.bboxJson) : undefined,
      source: b.source as any,
      confidence: b.confidence ?? undefined,
      orderIndex: b.orderIndex,
    })),
  };

  const chunks = chunkBlocks(parsedDoc);

  await prisma.documentChunk.deleteMany({ where: { documentId } });

  let i = 0;
  for (const chunk of chunks) {
    await prisma.documentChunk.create({
      data: {
        id: chunk.id,
        documentId: chunk.documentId,
        title: chunk.title ?? null,
        text: chunk.text,
        blockIdsJson: JSON.stringify(chunk.blockIds),
        sourceRefsJson: JSON.stringify(chunk.sourceRefs),
        tokenCount: chunk.tokenCount ?? null,
        orderIndex: chunk.orderIndex,
      },
    });
  }

  await prisma.documentSource.update({
    where: { id: documentId },
    data: { status: 'parsed' },
  });
}

export async function extractConceptsFromDocument(documentId: string): Promise<void> {
  setProgress(documentId, 'extracting', 3, 5, `正在通过 LLM 提取知识点...`);
  const doc = await prisma.documentSource.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error('Document not found');

  await prisma.documentSource.update({ where: { id: documentId }, data: { status: 'extracting' } });

  const dbChunks = await prisma.documentChunk.findMany({
    where: { documentId },
    orderBy: { orderIndex: 'asc' },
  });

  const totalChunks = dbChunks.length;
  for (let chunkIdx = 0; chunkIdx < dbChunks.length; chunkIdx++) {
    const dbChunk = dbChunks[chunkIdx];
    const chunk: DocumentChunk = {
      id: dbChunk.id,
      documentId: dbChunk.documentId,
      title: dbChunk.title ?? undefined,
      text: dbChunk.text,
      blockIds: JSON.parse(dbChunk.blockIdsJson),
      sourceRefs: JSON.parse(dbChunk.sourceRefsJson),
      tokenCount: dbChunk.tokenCount ?? undefined,
      orderIndex: dbChunk.orderIndex,
    };

    // Skip admin/logistics chunks
    if (ADMIN_PATTERNS.some(p => p.test(chunk.text))) {
      continue;
    }

    const concepts = await extractConcepts(chunk).catch((e) => {
      console.warn(`[document-pipeline] concept extraction skipped for chunk ${chunk.id}: ${e.message || e}`);
      return [] as ExtractedConceptData[];
    });

    setProgress(documentId, 'extracting', chunkIdx, totalChunks, `提取知识点 (${chunkIdx}/${totalChunks})`);

    for (const c of concepts) {
      const graphMatch = matchConceptToGraph(c.conceptName);
      await prisma.extractedConcept.create({
        data: {
          documentId,
          chunkId: chunk.id,
          conceptName: c.conceptName,
          normalizedName: c.conceptName.toLowerCase().replace(/[\s-]+/g, ''),
          definition: c.definition ?? null,
          keyPointsJson: JSON.stringify(c.keyPoints),
          examplesJson: c.examples ? JSON.stringify(c.examples) : null,
          formulasJson: c.formulas ? JSON.stringify(c.formulas) : null,
          prerequisitesJson: c.prerequisites ? JSON.stringify(c.prerequisites) : null,
          commonConfusionsJson: c.commonConfusions ? JSON.stringify(c.commonConfusions) : null,
          candidateTagsJson: JSON.stringify(c.candidateTags),
          graphMatchJson: JSON.stringify(graphMatch),
          confidence: c.confidence,
          sourceRefsJson: JSON.stringify(c.sourceRefs),
        },
      });
    }
  }

  await prisma.documentSource.update({
    where: { id: documentId },
    data: { status: 'parsed' },
  });
}

export async function generateDraftsFromDocument(documentId: string): Promise<void> {
  setProgress(documentId, 'generating', 4, 5, '正在生成卡片草稿...');
  const doc = await prisma.documentSource.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error('Document not found');

  await prisma.documentSource.update({ where: { id: documentId }, data: { status: 'generating' } });

  const dbConcepts = await prisma.extractedConcept.findMany({
    where: { documentId },
  });

  for (const dbConcept of dbConcepts) {
    const concept: ExtractedConceptData = {
      conceptName: dbConcept.conceptName,
      definition: dbConcept.definition ?? undefined,
      keyPoints: JSON.parse(dbConcept.keyPointsJson),
      examples: dbConcept.examplesJson ? JSON.parse(dbConcept.examplesJson) : undefined,
      formulas: dbConcept.formulasJson ? JSON.parse(dbConcept.formulasJson) : undefined,
      prerequisites: dbConcept.prerequisitesJson ? JSON.parse(dbConcept.prerequisitesJson) : undefined,
      commonConfusions: dbConcept.commonConfusionsJson ? JSON.parse(dbConcept.commonConfusionsJson) : undefined,
      candidateTags: JSON.parse(dbConcept.candidateTagsJson),
      confidence: dbConcept.confidence,
      sourceRefs: JSON.parse(dbConcept.sourceRefsJson),
    };

    const graphMatch: any = dbConcept.graphMatchJson ? JSON.parse(dbConcept.graphMatchJson) : null;

    const chunk = await prisma.documentChunk.findUnique({ where: { id: dbConcept.chunkId } });
    const sourceText = chunk?.text || '';
    const chunkRefs: SourceRef[] = chunk?.sourceRefsJson ? JSON.parse(chunk.sourceRefsJson) : [];

    let drafts: CardDraftData[];
    try {
      drafts = await generateDrafts(concept, sourceText, chunkRefs);
    } catch (e: any) {
      console.warn(`[document-pipeline] draft generation skipped for concept ${dbConcept.id}: ${e.message || e}`);
      continue;
    }

    // Translate English-predominant drafts to Chinese (excluding sourceRefs)
    try {
      drafts = await translateDrafts(drafts);
    } catch (e: any) {
      console.warn(`[document-pipeline] draft translation skipped: ${e.message || e}`);
    }

    for (const d of drafts) {
      // Append learningObjective to searchKeywords for future dedup matching
      const enrichedKeywords = [...d.searchKeywords];
      if (d.learningObjective) enrichedKeywords.push(d.learningObjective);
      if (d.canonicalConcept) enrichedKeywords.push(d.canonicalConcept);

      const dedup = await checkDuplicate({
        cardId: dbConcept.id,
        question: d.question,
        answer: d.answer,
        canonicalConcept: d.canonicalConcept || graphMatch?.canonicalTopic || null,
        learningObjective: d.learningObjective || null,
        atomicFacts: d.atomicFacts || [],
        answerScope: d.answerScope || null,
        searchKeywords: enrichedKeywords,
        tags: d.tags,
      });

      const now = new Date().toISOString();
      await prisma.cardDraft.create({
        data: {
          documentId,
          chunkId: dbConcept.chunkId,
          conceptId: dbConcept.id,
          type: d.type,
          question: d.question,
          answer: d.answer,
          tagsJson: JSON.stringify(d.tags),
          searchKeywordsJson: JSON.stringify(enrichedKeywords),
          canonicalTopic: d.canonicalTopic ?? graphMatch?.canonicalTopic ?? null,
          canonicalConcept: d.canonicalConcept || graphMatch?.canonicalTopic || null,
          learningObjective: d.learningObjective || null,
          atomicFactsJson: d.atomicFacts ? JSON.stringify(d.atomicFacts) : null,
          answerScope: d.answerScope || null,
          graphNodeId: graphMatch?.graphNodeId ?? null,
          graphStatus: graphMatch?.status ?? null,
          confidence: (d.confidence + concept.confidence) / 2,
          status: d.status,
          duplicateCheckJson: JSON.stringify(dedup),
          duplicateGroupId: dedup.duplicateGroupId || null,
          sourceRefsJson: JSON.stringify(d.sourceRefs),
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }

  // Intra-document dedup: group drafts by canonicalConcept+learningObjective
  const allDrafts = await prisma.cardDraft.findMany({
    where: { documentId },
    select: { id: true, canonicalConcept: true, learningObjective: true, atomicFactsJson: true },
  });
  const intraDedup = intraDocumentDedup(
    allDrafts.map(d => ({
      id: d.id,
      canonicalConcept: d.canonicalConcept,
      learningObjective: d.learningObjective,
      atomicFacts: d.atomicFactsJson ? JSON.parse(d.atomicFactsJson) : undefined,
    }))
  );
  for (const [draftId, groupId] of intraDedup) {
    const existing = await prisma.cardDraft.findUnique({ where: { id: draftId }, select: { duplicateCheckJson: true } });
    const currentDup = existing?.duplicateCheckJson ? JSON.parse(existing.duplicateCheckJson) : {};
    await prisma.cardDraft.update({
      where: { id: draftId },
      data: {
        duplicateGroupId: groupId,
        duplicateCheckJson: JSON.stringify({
          ...currentDup,
          intraDocumentDuplicate: true,
          status: currentDup.status === 'new_card' ? 'semantic_duplicate' : currentDup.status,
        }),
      },
    });
  }

  await prisma.documentSource.update({
    where: { id: documentId },
    data: { status: 'draft_ready' },
  });
  setProgress(documentId, 'done', 5, 5, '完成！');
}

export async function runFullPipeline(
  docId: string,
  filename: string,
  fileType: 'pdf' | 'markdown' | 'txt',
  fileSize: number,
  filePath: string,
): Promise<string> {
  await uploadDocument(docId, filename, fileType, fileSize, filePath);
  await parseDocument(docId);
  await chunkDocument(docId);
  await extractConceptsFromDocument(docId);
  await generateDraftsFromDocument(docId);
  return docId;
}
