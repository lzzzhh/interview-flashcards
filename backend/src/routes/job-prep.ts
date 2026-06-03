// Job Prep Routes — sessions, messages, JD, plans, stages

import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { handleJobPrepMessage } from '../services/job-prep/job-prep-conversation';
import { getLLMProvider } from '../services/llm-provider';

function safeParseJson(text: string): any {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) { try { return JSON.parse(m[1]); } catch {} }
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch {} }
  return null;
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
    let role = input || 'unknown';
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
    return { sessionId: session.id, company: session.company, role: session.role, status: session.status, nextAction: 'ask_for_jd' };
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
    return handleJobPrepMessage(sessionId, content || '');
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
