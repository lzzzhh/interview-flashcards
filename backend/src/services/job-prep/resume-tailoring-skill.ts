import { z } from 'zod';
import prisma from '../../db/prisma';
import { getLLMProvider } from '../llm-provider';
import { parseDocument, renderTailoredResume } from '../document/parser-gateway';
import { getProfile } from './role-profiles';
import { parseWithSchema } from './job-prep-schemas';

export const ResumeTailoringSchema = z.object({
  summary: z.string().default(''),
  jdRequirements: z.array(z.object({
    name: z.string(),
    importance: z.string().default('unknown'),
    evidenceText: z.string().optional(),
  })).default([]),
  matchedEvidence: z.array(z.object({
    requirement: z.string(),
    resumeEvidence: z.string(),
    strength: z.enum(['strong', 'medium', 'weak']).default('medium'),
  })).default([]),
  gaps: z.array(z.object({
    requirement: z.string(),
    gap: z.string(),
    suggestion: z.string(),
    canWriteDirectly: z.boolean().default(false),
  })).default([]),
  rewrites: z.array(z.object({
    section: z.string().default('experience'),
    beforeText: z.string(),
    afterText: z.string(),
    evidenceQuote: z.string(),
    rationale: z.string(),
  })).default([]),
  riskFlags: z.array(z.object({
    text: z.string(),
    reason: z.string(),
    severity: z.enum(['warning', 'blocker']).default('warning'),
  })).default([]),
  suggestedOrder: z.array(z.string()).default([]),
  nextActions: z.array(z.string()).default([]),
});

type ResumeTailoringResult = z.infer<typeof ResumeTailoringSchema>;

export interface ResumeDocumentTailoringInput {
  sessionId: string;
  sourcePath: string;
  sourceType: 'pdf' | 'docx';
  outputDir: string;
  artifactId: string;
  jdText?: string;
}

export interface ResumeDocumentTailoringResult extends ResumeTailoringResult {
  artifactId: string;
  sourceType: 'pdf' | 'docx';
  parsedTextLength: number;
  appliedRewriteCount: number;
  downloadUrls: {
    docx: string;
    pdf: string;
  };
  renderWarnings: string[];
}

function uniqueStrings(values: Array<string | null | undefined>, limit = 60) {
  return [...new Set(values.map(v => String(v || '').trim()).filter(Boolean))].slice(0, limit);
}

function tokenizeRequirement(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}+#/.\s-]/gu, ' ').split(/\s+/).filter(Boolean);
}

function extractResumeLines(resumeText: string) {
  return resumeText
    .split(/\r?\n/)
    .map(line => line.replace(/^[-*•]\s*/, '').trim())
    .filter(line => line.length >= 8)
    .slice(0, 80);
}

function lineMatchesRequirement(line: string, requirement: string) {
  const lower = line.toLowerCase();
  const tokens = tokenizeRequirement(requirement);
  return tokens.some(token => token.length >= 2 && lower.includes(token));
}

function buildFallbackTailoring(resumeText: string, requirements: string[], roleLabel: string): ResumeTailoringResult {
  const lines = extractResumeLines(resumeText);
  const matchedEvidence = requirements.flatMap(requirement => {
    const hit = lines.find(line => lineMatchesRequirement(line, requirement));
    return hit ? [{ requirement, resumeEvidence: hit, strength: 'medium' as const }] : [];
  }).slice(0, 12);
  const matchedSet = new Set(matchedEvidence.map(item => item.requirement));
  const gaps = requirements
    .filter(requirement => !matchedSet.has(requirement))
    .slice(0, 10)
    .map(requirement => ({
      requirement,
      gap: `简历中没有找到能直接支撑「${requirement}」的表述。`,
      suggestion: `如果你确实有相关经历，请补充项目场景、你的动作和结果；否则只作为面试准备点，不写入简历。`,
      canWriteDirectly: false,
    }));
  const rewrites = matchedEvidence.slice(0, 5).map(item => ({
    section: 'experience',
    beforeText: item.resumeEvidence,
    afterText: item.resumeEvidence,
    evidenceQuote: item.resumeEvidence,
    rationale: `该条已经能支撑「${item.requirement}」。未调用模型时保持原事实不扩写，避免凭空添加指标或职责。`,
  }));
  return {
    summary: `已按「${roleLabel || '目标岗位'}」对简历做保守匹配；当前结果只基于简历原文和 JD 要求，不编造新经历。`,
    jdRequirements: requirements.map(name => ({ name, importance: 'unknown' })),
    matchedEvidence,
    gaps,
    rewrites,
    riskFlags: gaps.length > 0 ? [{
      text: gaps.map(gap => gap.requirement).join('、'),
      reason: '这些要求缺少简历原文证据，不能直接写成已有经验。',
      severity: 'warning',
    }] : [],
    suggestedOrder: matchedEvidence.map(item => item.requirement),
    nextActions: [
      '补充每段经历的可量化结果，例如规模、性能、准确率、转化率或节省时间。',
      '把最贴近 JD 的项目放到经历区靠前位置。',
      '对缺口要求只写真实做过的内容；没有证据的要求放入面试准备清单。',
    ],
  };
}

function validateNoFabrication(result: ResumeTailoringResult, resumeText: string): ResumeTailoringResult {
  const riskFlags = [...result.riskFlags];
  for (const rewrite of result.rewrites) {
    const evidence = rewrite.evidenceQuote.trim();
    const before = rewrite.beforeText.trim();
    if (evidence && !resumeText.includes(evidence)) {
      riskFlags.push({
        text: rewrite.afterText,
        reason: 'evidenceQuote 不在原始简历中，不能作为已验证事实直接写入。',
        severity: 'blocker',
      });
    }
    if (before && !resumeText.includes(before)) {
      riskFlags.push({
        text: rewrite.afterText,
        reason: 'beforeText 不在原始简历中，改写缺少可追溯原文。',
        severity: 'warning',
      });
    }
  }
  return { ...result, riskFlags };
}

export async function tailorResumeForJobPrep(sessionId: string, resumeText: string, jdText?: string): Promise<ResumeTailoringResult> {
  const session = await prisma.jobPrepSession.findUnique({
    where: { id: sessionId },
    include: {
      requirements: true,
      postings: { where: { selected: true }, orderBy: { updatedAt: 'desc' }, take: 1 },
    },
  });
  if (!session) throw new Error('Session not found');

  const profile = getProfile(session.roleFamily || '');
  const dbRequirements = session.requirements.map(req => req.normalizedName || req.name);
  const roleRequirements = profile?.mustCoverInPlan || [];
  const requirements = uniqueStrings([...dbRequirements, ...roleRequirements], 30);
  const roleLabel = [session.company, session.role].filter(Boolean).join(' ');
  const selectedJD = session.postings[0]?.cleanedText || session.postings[0]?.rawText || '';
  const jdContext = jdText || selectedJD || requirements.join('\n');

  const fallback = buildFallbackTailoring(resumeText, requirements, roleLabel);
  const provider = getLLMProvider();
  if (!provider) return fallback;

  const systemPrompt = `You are a resume tailoring skill for job interview preparation.
Rules:
- Never fabricate companies, projects, metrics, tools, dates, awards, or responsibilities.
- Every rewritten bullet must cite an evidenceQuote copied verbatim from the original resume.
- If the JD asks for something not present in the resume, put it in gaps with canWriteDirectly=false.
- Prefer concise Chinese resume bullets unless the original resume is English.
- Return ONLY JSON matching this shape: summary, jdRequirements, matchedEvidence, gaps, rewrites, riskFlags, suggestedOrder, nextActions.`;

  const userPrompt = [
    `Target: ${roleLabel || session.role}`,
    `Role family: ${session.roleFamily || 'unknown'}`,
    `JD / requirements:\n${jdContext.slice(0, 5000)}`,
    `Known structured requirements:\n${requirements.map(item => `- ${item}`).join('\n')}`,
    `Original resume:\n${resumeText.slice(0, 9000)}`,
  ].join('\n\n');

  try {
    const response = await provider.chat({
      model: provider.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      maxTokens: 4096,
      responseFormat: 'json_object',
    });
    const parsed = parseWithSchema(ResumeTailoringSchema, response.text);
    return parsed ? validateNoFabrication(parsed, resumeText) : fallback;
  } catch {
    return fallback;
  }
}

function safeRewriteForDocument(rewrite: ResumeTailoringResult['rewrites'][number], resumeText: string) {
  const before = rewrite.beforeText.trim();
  const after = rewrite.afterText.trim();
  const evidence = rewrite.evidenceQuote.trim();
  if (!before || !after || before === after) return null;
  if (!resumeText.includes(before)) return null;
  if (evidence && !resumeText.includes(evidence)) return null;
  return { beforeText: before, afterText: after };
}

export async function tailorResumeDocumentForJobPrep(input: ResumeDocumentTailoringInput): Promise<ResumeDocumentTailoringResult> {
  const parsed = await parseDocument({
    filePath: input.sourcePath,
    fileType: input.sourceType,
  });
  const resumeText = parsed.fullText.trim();
  if (resumeText.length < 40) throw new Error('Parsed resume text is too short');

  const tailoring = await tailorResumeForJobPrep(input.sessionId, resumeText, input.jdText);
  const blockerTexts = new Set(tailoring.riskFlags.filter(flag => flag.severity === 'blocker').map(flag => flag.text));
  const safeRewrites = tailoring.rewrites
    .filter(rewrite => !blockerTexts.has(rewrite.afterText))
    .map(rewrite => safeRewriteForDocument(rewrite, resumeText))
    .filter((rewrite): rewrite is { beforeText: string; afterText: string } => Boolean(rewrite));

  const render = await renderTailoredResume({
    sourcePath: input.sourcePath,
    sourceType: input.sourceType,
    outputDir: input.outputDir,
    baseName: input.artifactId,
    rewrites: safeRewrites,
    fallbackText: resumeText,
  });

  return {
    ...tailoring,
    artifactId: input.artifactId,
    sourceType: input.sourceType,
    parsedTextLength: resumeText.length,
    appliedRewriteCount: render.appliedCount,
    downloadUrls: {
      docx: `/api/job-prep/sessions/${input.sessionId}/resume-artifacts/${input.artifactId}/download/docx`,
      pdf: `/api/job-prep/sessions/${input.sessionId}/resume-artifacts/${input.artifactId}/download/pdf`,
    },
    renderWarnings: render.warnings,
  };
}
