// backend/src/routes/job-prep.ts — 岗位备战路由
import { FastifyInstance } from 'fastify';
import prisma from '../db/prisma';
import { handleJobPrepMessage } from '../services/job-prep/orchestrator';

export async function jobPrepRoutes(app: FastifyInstance) {
  // 创建/继续会话
  app.post('/api/job-prep/session', async (req) => {
    const body = req.body as any;
    const result = await handleJobPrepMessage({
      sessionId: body.sessionId,
      message: body.message,
      jdText: body.jdText,
    });
    return result;
  });

  // 查看会话详情
  app.get('/api/job-prep/session/:id', async (req) => {
    const { id } = req.params as { id: string };
    const session = await prisma.jobPrepSession.findUnique({ where: { id } });
    if (!session) return { error: 'Not found' };
    return {
      id: session.id,
      state: session.state,
      company: session.company,
      role: session.role,
      jdSource: session.jdSource,
      studyPlan: session.studyPlan ? JSON.parse(session.studyPlan) : null,
      cardMatches: session.cardMatches ? JSON.parse(session.cardMatches) : [],
    };
  });

  // 列出所有会话
  app.get('/api/job-prep/sessions', async () => {
    const sessions = await prisma.jobPrepSession.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    return { sessions: sessions.map(s => ({ id: s.id, state: s.state, company: s.company, role: s.role, createdAt: s.createdAt })) };
  });
}
