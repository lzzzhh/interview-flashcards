import { z } from 'zod';

export const RoleFamilySchema = z.enum([
  'data-analysis',
  'data-science',
  'algorithm',
  'machine-learning',
  'llm',
  'llm-application',
  'backend',
  'frontend',
  'other',
]);

export const TargetParseSchema = z.object({
  company: z.string().nullable().optional(),
  role: z.string().min(1).optional(),
  roleFamily: RoleFamilySchema.nullable().optional(),
});

export const JobRequirementSchema = z.object({
  type: z.enum(['skill', 'tool', 'experience', 'domain', 'soft_skill', 'education', 'eligibility', 'bonus']).catch('skill'),
  name: z.string().min(1),
  normalizedName: z.string().nullable().optional(),
  importance: z.enum(['must_have', 'nice_to_have', 'unknown']).catch('unknown'),
  evidenceText: z.string().nullable().optional(),
});

export const JdParseSchema = z.object({
  requirements: z.array(JobRequirementSchema).default([]),
});

export const PlanCardSchema = z.object({
  cardId: z.string().optional(),
  deckId: z.string().optional(),
  reason: z.string().default(''),
  matchedRequirements: z.array(z.string()).optional(),
  matchedConcepts: z.array(z.string()).optional(),
  source: z.string().optional(),
});

export const PlanStageSchema = z.object({
  name: z.string().min(1),
  goal: z.string().default(''),
  estimatedMinutes: z.number().int().positive().optional(),
  topic: z.string().optional(),
  cards: z.array(PlanCardSchema).default([]),
});

export const JobPrepPlanSchema = z.object({
  title: z.string().min(1).default('备战计划'),
  summary: z.string().optional(),
  estimatedDays: z.number().int().positive().optional(),
  stages: z.array(PlanStageSchema).default([]),
});

export const AgentActionSchema = z.object({
  action: z.string(),
  rationale: z.string().optional(),
  args: z.record(z.any()).optional(),
});

export function parseJobPrepJson(text: string): unknown {
  try { return JSON.parse(text); } catch {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  return null;
}

export function parseWithSchema<TSchema extends z.ZodTypeAny>(schema: TSchema, text: string): z.infer<TSchema> | null {
  const parsed = schema.safeParse(parseJobPrepJson(text));
  return parsed.success ? parsed.data : null;
}

export type JobPrepPlanOutput = z.infer<typeof JobPrepPlanSchema>;
