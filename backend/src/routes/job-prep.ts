// Job Prep Routes — sessions, messages, JD, plans, stages

import { FastifyInstance } from 'fastify';
import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { pipeline } from 'stream/promises';
import prisma from '../db/prisma';
import { handleJobPrepMessage } from '../services/job-prep/job-prep-conversation';
import { getLLMProvider } from '../services/llm-provider';
import { tailorResumeDocumentForJobPrep, tailorResumeForJobPrep } from '../services/job-prep/resume-tailoring-skill';

const RESUME_ARTIFACT_DIR = join(process.cwd(), 'data', 'job-prep-resumes');
if (!existsSync(RESUME_ARTIFACT_DIR)) mkdirSync(RESUME_ARTIFACT_DIR, { recursive: true });

function safeParseJson(text: string): any {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) { try { return JSON.parse(m[1]); } catch {} }
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch {} }
  return null;
}

function multipartFieldValue(field: unknown): string | undefined {
  const value = (field as any)?.value;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resumeFileType(filename: string, mimetype?: string): 'pdf' | 'docx' | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf') || mimetype === 'application/pdf') return 'pdf';
  if (lower.endsWith('.docx') || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  return null;
}

function artifactPath(sessionId: string, artifactId: string, ext: 'docx' | 'pdf') {
  const safeSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeArtifact = artifactId.replace(/[^a-zA-Z0-9_-]/g, '');
  const base = resolve(RESUME_ARTIFACT_DIR, safeSession, safeArtifact);
  const filePath = resolve(base, `${safeArtifact}.${ext}`);
  if (!filePath.startsWith(resolve(RESUME_ARTIFACT_DIR))) throw new Error('Invalid artifact path');
  return filePath;
}

export async function jobPrepRoutes(app: FastifyInstance) {
  // Boot check
  app.post('/api/job-prep/boot', async () => {
    const neo4jEnabled = process.env.GRAPH_NEO4J_ENABLED !== 'false';
    return {
      qdrant: { running: true, collectionReady: true, indexReady: true },
      neo4j: { enabled: neo4jEnabled, ready: neo4jEnabled, weightVector: 0.35 },
      ready: true,
    };
  });

  // Create session — parse company/role with LLM
  app.post('/api/job-prep/sessions', async (req) => {
    const { input } = req.body as any;
    let company: string | null = null;
    let role = (input && String(input).length < 80) ? input : 'unknown';
    let roleFamily: string | null = null;
    try {
      const p = getLLMProvider();
      if (p) {
        const resp = await p.chat({
          model: p.defaultModel,
          messages: [
            { role: 'system', content: 'Parse job target. Output JSON: {"company":"...","role":"...","roleFamily":"..."}. roleFamily: data-analysis,data-science,algorithm,machine-learning,llm,llm-application,backend,frontend,other. Return ONLY JSON.' },
            { role: 'user', content: input },
          ], temperature: 0.1, maxTokens: 200,
        });
        const parsed = safeParseJson(resp.text);
        if (parsed?.role) { company = parsed.company || null; role = parsed.role; roleFamily = parsed.roleFamily || null; }
      }
    } catch { /* use raw input */ }
    const session = await prisma.jobPrepSession.create({ data: { company, role, roleFamily, status: 'collecting' } });
    if (input && String(input).trim()) {
      const turn = await handleJobPrepMessage(session.id, String(input));
      const updated = await prisma.jobPrepSession.findUnique({ where: { id: session.id } });
      return {
        sessionId: session.id,
        company: updated?.company,
        role: updated?.role,
        status: updated?.status,
        nextAction: turn.nextAction,
        assistantMessage: turn.assistantMessage,
        data: turn.data,
      };
    }
    return { sessionId: session.id, company: session.company, role: session.role, status: session.status, nextAction: 'collect_target' };
  });

  // Get session
  app.get('/api/job-prep/sessions/:sessionId', async (req) => {
    const { sessionId } = req.params as any;
    const session = await prisma.jobPrepSession.findUnique({
      where: { id: sessionId },
      include: { messages: true, postings: true, requirements: true, plans: { include: { stages: { include: { cards: true } } } } },
    });
    if (!session) return { error: 'Session not found' };
    return session;
  });

  // Send message — unified conversation handler
  app.post('/api/job-prep/sessions/:sessionId/messages', async (req) => {
    const { sessionId } = req.params as any;
    const { content } = req.body as any;
    try {
      return await handleJobPrepMessage(sessionId, content || '');
    } catch (e: any) {
      app.log.error(e, '[job-prep] message failed');
      return {
        assistantMessage: `处理失败：${e?.message || '未知错误'}`,
        nextAction: 'await_user',
      };
    }
  });

  // Tailor resume against the current JD / role requirements.
  app.post('/api/job-prep/sessions/:sessionId/resume-tailoring', async (req) => {
    const { sessionId } = req.params as any;
    const { resumeText, jdText } = req.body as any;
    const text = String(resumeText || '').trim();
    if (text.length < 40) {
      return {
        error: 'resumeText is too short',
        assistantMessage: '请粘贴更完整的简历内容，至少包含一段项目或经历。',
      };
    }
    try {
      const result = await tailorResumeForJobPrep(sessionId, text, jdText ? String(jdText) : undefined);
      await prisma.jobPrepMessage.create({
        data: {
          sessionId,
          role: 'tool',
          content: 'resume_tailoring_completed',
          toolName: 'resume_tailoring_completed',
          toolPayload: {
            summary: result.summary,
            matchedEvidenceCount: result.matchedEvidence.length,
            gapCount: result.gaps.length,
            rewriteCount: result.rewrites.length,
            blockerCount: result.riskFlags.filter(flag => flag.severity === 'blocker').length,
          },
        },
      }).catch(() => {});
      return result;
    } catch (e: any) {
      app.log.error(e, '[job-prep] resume tailoring failed');
      return { error: e?.message || 'resume tailoring failed' };
    }
  });

  app.post('/api/job-prep/sessions/:sessionId/resume/upload', async (req, reply) => {
    const { sessionId } = req.params as any;
    const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
    const data = isMultipart ? await req.file().catch(() => null) : null;
    const body = (!isMultipart ? req.body : {}) as any;
    const localPath = typeof body?.filePath === 'string' ? body.filePath.trim() : '';
    const filename = data?.filename || localPath.split('/').pop() || '';
    const mimetype = data?.mimetype;
    if (!data && !localPath) return reply.status(400).send({ error: 'No file uploaded' });

    const fileType = resumeFileType(filename, mimetype);
    if (!fileType) return reply.status(400).send({ error: 'Only PDF and DOCX resumes are supported' });
    if (localPath && !existsSync(localPath)) return reply.status(400).send({ error: 'Selected file does not exist' });

    const session = await prisma.jobPrepSession.findUnique({ where: { id: sessionId } });
    if (!session) return reply.status(404).send({ error: 'Session not found' });

    const artifactId = `resume_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const outputDir = join(RESUME_ARTIFACT_DIR, sessionId, artifactId);
    mkdirSync(outputDir, { recursive: true });

    const sourcePath = join(outputDir, `source.${fileType}`);
    if (data) {
      await pipeline(data.file, createWriteStream(sourcePath));
    } else {
      await pipeline(createReadStream(localPath), createWriteStream(sourcePath));
    }
    const size = statSync(sourcePath).size;
    const jdText = data ? multipartFieldValue((data as any).fields?.jdText) : (typeof body?.jdText === 'string' ? body.jdText : undefined);

    try {
      const result = await tailorResumeDocumentForJobPrep({
        sessionId,
        sourcePath,
        sourceType: fileType,
        outputDir,
        artifactId,
        jdText,
      });
      await prisma.jobPrepMessage.create({
        data: {
          sessionId,
          role: 'tool',
          content: 'resume_document_tailoring_completed',
          toolName: 'resume_document_tailoring_completed',
          toolPayload: {
            artifactId,
            fileName: filename,
            fileType,
            fileSize: size,
            parsedTextLength: result.parsedTextLength,
            appliedRewriteCount: result.appliedRewriteCount,
            rewriteCount: result.rewrites.length,
            gapCount: result.gaps.length,
            downloadUrls: result.downloadUrls,
          },
        },
      }).catch(() => {});
      return result;
    } catch (e: any) {
      app.log.error(e, '[job-prep] resume document tailoring failed');
      return reply.status(500).send({ error: e?.message || 'resume document tailoring failed' });
    }
  });

  app.get('/api/job-prep/sessions/:sessionId/resume-artifacts/:artifactId/download/:format', async (req, reply) => {
    const { sessionId, artifactId, format } = req.params as any;
    if (format !== 'docx' && format !== 'pdf') return reply.status(400).send({ error: 'Unsupported format' });
    const filePath = artifactPath(sessionId, artifactId, format);
    if (!existsSync(filePath)) return reply.status(404).send({ error: 'Artifact not found' });
    reply.header('Content-Disposition', `attachment; filename="tailored_resume.${format}"`);
    reply.type(format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    return reply.send(createReadStream(filePath));
  });

  // Save JD
  app.post('/api/job-prep/sessions/:sessionId/job-postings', async (req) => {
    const { sessionId } = req.params as any;
    const { sourceType, rawText, sourceUrl } = req.body as any;

    const posting = await prisma.jobPostingSnapshot.create({
      data: {
        sessionId,
        sourceType: sourceType || 'user_pasted',
        sourceUrl: sourceUrl || null,
        rawText: rawText || '',
        selected: true,
      },
    });

    // Unselect other postings
    await prisma.jobPostingSnapshot.updateMany({
      where: { sessionId, id: { not: posting.id } },
      data: { selected: false },
    });

    return { id: posting.id, sourceType: posting.sourceType };
  });

  // Save plan
  app.post('/api/job-prep/sessions/:sessionId/plans', async (req) => {
    const { sessionId } = req.params as any;
    const { title, summary, estimatedDays, stages } = req.body as any;

    const plan = await prisma.jobPrepPlan.create({
      data: {
        sessionId,
        title: title || '备战计划',
        summary: summary || null,
        estimatedDays,
        totalStages: (stages || []).length,
        totalCards: (stages || []).reduce((s: number, st: any) => s + (st.cards || []).length, 0),
      },
    });

    for (const [si, stage] of (stages || []).entries()) {
      const dbStage = await prisma.jobPrepStage.create({
        data: {
          planId: plan.id,
          order: si,
          name: stage.name || `阶段 ${si + 1}`,
          goal: stage.goal || '',
          estimatedMinutes: stage.estimatedMinutes || 180,
        },
      });

      for (const [ci, card] of (stage.cards || []).entries()) {
        await prisma.jobPrepPlanCard.create({
          data: {
            planId: plan.id,
            stageId: dbStage.id,
            cardId: card.cardId,
            deckId: card.deckId || '',
            order: ci,
            reason: card.reason || '',
            matchedRequirements: card.matchedRequirements || [],
            matchedConcepts: card.matchedConcepts || [],
            source: card.source || 'hybrid',
            vectorScore: card.vectorScore,
            graphScore: card.graphScore,
            keywordScore: card.keywordScore,
            finalScore: card.finalScore,
          },
        });
      }
    }

    return { planId: plan.id, title: plan.title, totalStages: plan.totalStages, totalCards: plan.totalCards };
  });

  // Start stage learning
  app.post('/api/job-prep/stages/:stageId/start', async (req) => {
    const { stageId } = req.params as any;
    const stage = await prisma.jobPrepStage.findUnique({
      where: { id: stageId },
      include: { cards: { orderBy: { order: 'asc' } } },
    });
    if (!stage) return { error: 'Stage not found' };
    return {
      mode: 'job-prep',
      stageId: stage.id,
      stageName: stage.name,
      cardIds: stage.cards.map(c => c.cardId),
    };
  });

  // List sessions
  app.get('/api/job-prep/sessions', async () => {
    const sessions = await prisma.jobPrepSession.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    return sessions.map(s => ({
      id: s.id, company: s.company, role: s.role, status: s.status, createdAt: s.createdAt,
    }));
  });

  // List plans for a session
  app.get('/api/job-prep/sessions/:sessionId/plans', async (req) => {
    const { sessionId } = req.params as any;
    return prisma.jobPrepPlan.findMany({
      where: { sessionId },
      include: { stages: { orderBy: { order: 'asc' }, include: { cards: { orderBy: { order: 'asc' } } } } },
      orderBy: { createdAt: 'desc' },
    });
  });
}
