// backend/src/services/job-prep/orchestrator.ts — 岗位备战状态机（v2）

import prisma from '../../db/prisma';
import { hybridSearch } from '../search/hybrid-search';
import { getLLMProvider } from '../llm-provider';

const USER_ID = 'demo-user';

/** 生成 SM-2 感知的学习计划 */
async function generateStudyPlan(cardMatches: any[]): Promise<any> {
  if (cardMatches.length === 0) {
    return { totalCards: 0, suggestedDaily: 0, estimatedDays: 0 };
  }

  const cardIds = cardMatches.map((m: any) => m.cardId);

  // 查询 SM-2 进度
  const progresses = await prisma.cardProgress.findMany({
    where: { userId: USER_ID, cardId: { in: cardIds } },
    select: { cardId: true, state: true, nextReview: true, lapses: true, easeFactor: true },
  });

  const now = new Date();
  const progressMap = new Map(progresses.map(p => [p.cardId, p]));

  let dueCount = 0;
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;

  for (const m of cardMatches) {
    const p = progressMap.get(m.cardId);
    if (!p || p.state === 'new') {
      newCount++;
    } else if (p.state === 'learning') {
      learningCount++;
    } else if (p.state === 'review' || p.state === 'relearning') {
      if (p.nextReview <= now) {
        dueCount++;
      } else {
        reviewCount++;
      }
    }
  }

  const total = cardMatches.length;

  // 分区学习计划：先清零到期卡，每天新学 + 复习
  const daysForDue = Math.max(1, Math.ceil(dueCount / 20));
  const daysForNew = Math.max(1, Math.ceil(newCount / 15));
  const estimatedDays = daysForDue + daysForNew;

  return {
    totalCards: total,
    breakdown: { due: dueCount, new: newCount, learning: learningCount, review: reviewCount },
    suggestedDaily: Math.min(20, Math.ceil(total / Math.max(1, estimatedDays))),
    estimatedDays,
    phases: [
      { phase: '清零到期卡', cards: dueCount, days: daysForDue, dailyTarget: Math.min(20, dueCount) },
      { phase: '学习新卡', cards: newCount, days: daysForNew, dailyTarget: Math.min(15, Math.max(5, newCount)) },
    ],
  };
}

export type JobPrepState =
  | 'awaiting_company' | 'awaiting_role' | 'collecting_jd'
  | 'analyzing_jd' | 'matching_cards' | 'generating_plan' | 'ready' | 'failed';

export interface JobPrepInput {
  sessionId?: string;
  message?: string;
  jdText?: string;
  jdUrl?: string;
}

/** 检测字符串是否为 URL */
function isURL(s: string): boolean {
  return /^https?:\/\/\S+/i.test(s.trim());
}

/** 从 URL 抓取页面文本（简易实现） */
async function fetchURLText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // 简单 HTML 文本提取：移除 script/style 标签，提取 body 文本
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000);

    if (!cleaned || cleaned.length < 50) throw new Error('未提取到有效文本');
    return cleaned;
  } catch (err) {
    throw new Error(`URL 抓取失败: ${(err as Error).message}`);
  }
}

/** LLM 分析 JD，提取技能画像 */
async function analyzeJD(jdText: string, company?: string, role?: string): Promise<string> {
  const provider = getLLMProvider();
  if (!provider) {
    // 无 LLM 时返回原文摘要
    const words = jdText.trim().split(/\s+/);
    return `岗位: ${role || '未知'}\n公司: ${company || '未知'}\n描述长度: ${jdText.length} 字符`;
  }

  const prompt = `你是一位资深技术面试官。请分析以下 JD（职位描述），提取关键的技术要求和技能画像。

请用 JSON 格式输出：
{
  "role": "岗位名称",
  "skills": ["技能1", "技能2", ...],
  "level": "初级/中级/高级",
  "focusAreas": ["重点领域1", ...],
  "summary": "一句话总结"
}

JD 内容：
${jdText.slice(0, 4000)}`;

  const res = await provider.chat({
    model: (provider as any).defaultModel || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    maxTokens: 1024,
  });

  // 尝试提取 JSON
  const jsonMatch = res.text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return JSON.stringify(parsed, null, 2);
    } catch { /* fall through */ }
  }
  return res.text;
}

export async function handleJobPrepMessage(input: JobPrepInput) {
  let session: any;

  if (input.sessionId) {
    session = await prisma.jobPrepSession.findUnique({ where: { id: input.sessionId } });
  }

  if (!session) {
    session = await prisma.jobPrepSession.create({
      data: { id: `job-${Date.now()}`, state: 'awaiting_company' },
    });
  }

  const state = session.state as JobPrepState;
  const response: string[] = [];

  if (!input.message && !input.jdText && !input.jdUrl) {
    return { sessionId: session.id, state, messages: ['请告诉我你准备面试的公司和岗位。'] };
  }

  // URL 自动抓取
  if (input.jdUrl || (input.message && isURL(input.message))) {
    const url = input.jdUrl || input.message?.trim() || '';
    try {
      response.push(`正在抓取 JD: ${url}...`);
      const fetchedText = await fetchURLText(url);
      await prisma.jobPrepSession.update({
        where: { id: session.id },
        data: {
          jdSource: 'auto_url',
          jdSourceUrl: url,
          jdText: fetchedText,
          state: 'analyzing_jd',
        },
      });
      session = await prisma.jobPrepSession.findUnique({ where: { id: session.id } });
      response.push(`已抓取 ${fetchedText.length} 字符内容，正在分析...`);
      // 继续执行分析
    } catch (err) {
      response.push((err as Error).message);
      return { sessionId: session.id, state: session.state, messages: response };
    }
    // 不 fall through，继续下面的分析逻辑
  }

  // 直接粘贴 JD 文本
  if (input.jdText) {
    await prisma.jobPrepSession.update({
      where: { id: session.id },
      data: {
        jdSource: 'manual',
        jdText: input.jdText,
        state: 'analyzing_jd',
      },
    });
    session = await prisma.jobPrepSession.findUnique({ where: { id: session.id } });
    response.push('已收到 JD，正在分析岗位画像...');
  }

  const msg = input.message?.trim() || '';

  // 如果当前是 analyzing_jd 状态（由 jdText 或 URL 触发）
  if (session.state === 'analyzing_jd' && session.jdText) {
    const current = await prisma.jobPrepSession.findUnique({ where: { id: session.id } });
    if (current?.state === 'analyzing_jd') {
      try {
        const jobProfile = await analyzeJD(session.jdText, session.company, session.role);
        await prisma.jobPrepSession.update({
          where: { id: session.id },
          data: {
            jobProfile,
            state: 'matching_cards',
          },
        });
        response.push('岗位画像分析完成，正在匹配复习题库...');

        // 继续匹配
        const results = await hybridSearch({
          query: `${session.role || ''} ${session.company || ''} ${session.jdText || ''}`,
          topK: 20,
          filters: { includeWeakCards: true },
        });

        const studyPlan = await generateStudyPlan(results);
        await prisma.jobPrepSession.update({
          where: { id: session.id },
          data: {
            state: 'ready',
            cardMatches: JSON.stringify(results.slice(0, 10)),
            studyPlan: JSON.stringify(studyPlan),
          },
        });

        response.push(`已匹配 ${results.length} 张相关卡片。`);
        response.push(`到期 ${studyPlan.breakdown.due} 张 + 新卡 ${studyPlan.breakdown.new} 张，预计 ${studyPlan.estimatedDays} 天完成。`);
      } catch (err) {
        response.push(`分析失败: ${(err as Error).message}`);
        await prisma.jobPrepSession.update({
          where: { id: session.id },
          data: { state: 'failed' },
        });
      }
      return {
        sessionId: session.id,
        state: (await prisma.jobPrepSession.findUnique({ where: { id: session.id } }))?.state,
        messages: response,
      };
    }
  }

  switch (state) {
    case 'awaiting_company': {
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
      response.push(`岗位: ${msg}。可以直接粘贴 JD（职位描述），或发送 JD 链接，我帮你匹配复习卡片。`);
      response.push('如果没有 JD，回复「没有」，我将使用通用岗位画像。');
      break;
    }
    case 'collecting_jd': {
      if (msg === '没有' || msg === '无') {
        await prisma.jobPrepSession.update({
          where: { id: session.id },
          data: { jdSource: 'generic_profile', jdText: `岗位: ${session.role}`, state: 'matching_cards' },
        });
        response.push('使用通用岗位画像，正在匹配题库...');

        // 直接匹配
        const results = await hybridSearch({
          query: `${session.role || ''} ${session.company || ''}`,
          topK: 20,
          filters: { includeWeakCards: true },
        });
        const studyPlan = await generateStudyPlan(results);
        await prisma.jobPrepSession.update({
          where: { id: session.id },
          data: {
            state: 'ready',
            cardMatches: JSON.stringify(results.slice(0, 10)),
            studyPlan: JSON.stringify(studyPlan),
          },
        });
        response.push(`已匹配 ${results.length} 张相关卡片。到期 ${studyPlan.breakdown.due} 张 + 新卡 ${studyPlan.breakdown.new} 张，预计 ${studyPlan.estimatedDays} 天完成。`);
      } else {
        // 用户发送了文本（可能是 URL 或 JD 文本）
        // 如果是 URL，走上面的 URL 流程；如果是 JD 文本，按 jdText 处理
        // 注意：URL 已在上面处理，这里到达的是过长文本
        await prisma.jobPrepSession.update({
          where: { id: session.id },
          data: {
            jdSource: 'manual',
            jdText: msg,
            state: 'analyzing_jd',
          },
        });
        response.push('已收到 JD 文本，正在分析岗位画像...');

        // 执行分析
        try {
          const jobProfile = await analyzeJD(msg, session.company, session.role);
          await prisma.jobPrepSession.update({
            where: { id: session.id },
            data: {
              jobProfile,
              state: 'matching_cards',
            },
          });
          response.push('岗位画像分析完成，正在匹配复习题库...');

          const results = await hybridSearch({
            query: `${session.role || ''} ${session.company || ''} ${msg}`,
            topK: 20,
            filters: { includeWeakCards: true },
          });
          const studyPlan = await generateStudyPlan(results);
          await prisma.jobPrepSession.update({
            where: { id: session.id },
            data: {
              state: 'ready',
              cardMatches: JSON.stringify(results.slice(0, 10)),
              studyPlan: JSON.stringify(studyPlan),
            },
          });
          response.push(`已匹配 ${results.length} 张相关卡片。到期 ${studyPlan.breakdown.due} 张 + 新卡 ${studyPlan.breakdown.new} 张，预计 ${studyPlan.estimatedDays} 天完成。`);
        } catch (err) {
          response.push(`分析失败: ${(err as Error).message}`);
          await prisma.jobPrepSession.update({
            where: { id: session.id },
            data: { state: 'failed' },
          });
        }
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
      const studyPlan = await generateStudyPlan(results);
      await prisma.jobPrepSession.update({
        where: { id: session.id },
        data: {
          state: 'ready',
          cardMatches: JSON.stringify(results.slice(0, 10)),
          studyPlan: JSON.stringify(studyPlan),
        },
      });
      response.push(`已匹配 ${results.length} 张相关卡片。到期 ${studyPlan.breakdown.due} 张 + 新卡 ${studyPlan.breakdown.new} 张，预计 ${studyPlan.estimatedDays} 天完成。`);
      break;
    }
    default:
      response.push('会话已完成，可以创建新的岗位备战计划。');
  }

  return { sessionId: session.id, state: session.state, messages: response };
}
