// backend/src/services/job-prep/orchestrator.ts — 岗位备战状态机

import prisma from '../../db/prisma';
import { hybridSearch } from '../search/hybrid-search';

const USER_ID = 'demo-user';

export type JobPrepState =
  | 'awaiting_company' | 'awaiting_role' | 'collecting_jd'
  | 'analyzing_jd' | 'matching_cards' | 'generating_plan' | 'ready' | 'failed';

export interface JobPrepInput {
  sessionId?: string;
  message?: string;
  jdText?: string;
}

export async function handleJobPrepMessage(input: JobPrepInput) {
  let session: any;

  if (input.sessionId) {
    session = await prisma.jobPrepSession.findUnique({ where: { id: input.sessionId } });
  }

  if (!session) {
    // New session
    session = await prisma.jobPrepSession.create({
      data: { id: `job-${Date.now()}`, state: 'awaiting_company' },
    });
  }

  const state = session.state as JobPrepState;
  const response: string[] = [];

  if (!input.message && !input.jdText) {
    return { sessionId: session.id, state, messages: ['请告诉我你准备面试的公司和岗位。'] };
  }

  if (input.jdText) {
    // User pasted JD
    await prisma.jobPrepSession.update({
      where: { id: session.id },
      data: {
        jdSource: 'manual',
        jdText: input.jdText,
        state: 'analyzing_jd',
      },
    });
    return { sessionId: session.id, state: 'analyzing_jd', messages: ['已收到 JD，正在分析岗位画像...'] };
  }

  const msg = input.message?.trim() || '';

  switch (state) {
    case 'awaiting_company': {
      // Extract company name
      await prisma.jobPrepSession.update({
        where: { id: session.id },
        data: { company: msg, state: 'awaiting_role' },
      });
      response.push(`公司: ${msg}，这个公司的目标岗位是？`);
      break;
    }
    case 'awaiting_role': {
      await prisma.jobPrepSession.update({
        where: { id: session.id },
        data: { role: msg, state: 'collecting_jd' },
      });
      response.push(`岗位: ${msg}。如果有 JD（职位描述），可以直接粘贴，我帮你匹配合适的复习卡片。`);
      response.push('如果没有 JD，回复「没有」，我将使用通用岗位画像。');
      break;
    }
    case 'collecting_jd': {
      if (msg === '没有') {
        await prisma.jobPrepSession.update({
          where: { id: session.id },
          data: { jdSource: 'generic_profile', jdText: `岗位: ${session.role}`, state: 'matching_cards' },
        });
        response.push('使用通用岗位画像，正在匹配题库...');
      } else {
        response.push('请粘贴完整的 JD 文本，或回复「没有」。');
      }
      break;
    }
    case 'matching_cards': {
      const jobText = session.jdText || session.role || '';
      const results = await hybridSearch({
        query: jobText,
        topK: 20,
        filters: { includeWeakCards: true },
      });

      const matched = results.length;
      await prisma.jobPrepSession.update({
        where: { id: session.id },
        data: {
          state: 'ready',
          cardMatches: JSON.stringify(results.slice(0, 10)),
          studyPlan: JSON.stringify({
            totalCards: matched,
            suggestedDaily: Math.min(30, matched),
            estimatedDays: Math.ceil(matched / 15),
          }),
        },
      });

      response.push(`已匹配 ${matched} 张相关卡片。建议每天复习 15-30 张，预计 ${Math.ceil(matched / 15)} 天完成。`);
      break;
    }
    default:
      response.push('会话已完成，可以创建新的岗位备战计划。');
  }

  return { sessionId: session.id, state: session.state, messages: response };
}
