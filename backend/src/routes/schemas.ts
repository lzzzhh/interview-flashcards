// backend/src/routes/schemas.ts — 路由 Zod 校验

import { z } from 'zod';

// ---- Card ----
export const CreateCardSchema = z.object({
  id: z.string().min(1),
  deckId: z.string().min(1),
  type: z.string().optional().default('qa'),
  number: z.number().optional(),
  title: z.string().optional(),
  titleCn: z.string().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  description: z.string().optional(),
  approach: z.string().optional(),
  difficulty: z.string().optional(),
  tags: z.array(z.string()).optional(),
  subTopic: z.string().optional(),
  source: z.string().optional(),
  codes: z.record(z.string(), z.string()).optional(),
});

export const UpdateCardSchema = z.object({
  title: z.string().optional(),
  titleCn: z.string().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  description: z.string().optional(),
  approach: z.string().optional(),
  difficulty: z.string().optional(),
  tags: z.array(z.string()).optional(),
  subTopic: z.string().optional(),
  source: z.string().optional(),
});

// ---- Ingest ----
export const IngestDocumentSchema = z.object({
  filePath: z.string().min(1),
  fileType: z.string().optional(),
  targetDeckId: z.string().optional().default('custom-ingest'),
});

// ---- Card Drafts ----
export const GenerateDraftsSchema = z.object({
  sourceId: z.string().min(1),
  deckId: z.string().min(1),
});

export const ApproveBatchSchema = z.object({
  ids: z.array(z.string()).min(1),
});

// ---- Job Prep ----
export const JobPrepSessionSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().optional(),
  jdText: z.string().optional(),
});

// ---- Search ----
export const HybridSearchSchema = z.object({
  query: z.string().min(1),
  deckIds: z.array(z.string()).optional(),
  topK: z.number().optional().default(20),
  filters: z.object({
    difficulty: z.array(z.string()).optional(),
    onlyDue: z.boolean().optional(),
    includeWeakCards: z.boolean().optional(),
  }).optional(),
});

// ---- Review ----
export const CreateReviewSchema = z.object({
  cardId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
});

// ---- Study ----
export const StudyQueueSchema = z.object({
  deckId: z.string().min(1),
  mode: z.enum(['new', 'review']).optional().default('new'),
  limit: z.number().optional().default(20),
});

/** 通用 Zod 校验辅助 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') };
}
