// Job Prep Workflow — TypeScript native state machine

import prisma from '../../db/prisma';
import type { JobPrepWorkflowState, JobPrepStep, JobPrepMessageDto, JobPrepPlanDraft } from './job-prep-types';
import { getLLMProvider } from '../llm-provider';
import { TARGET_PARSE_PROMPT, JD_PARSE_PROMPT, PLAN_GENERATE_PROMPT } from './job-prep-prompts';

function safeParseJson(text: string): any {
  // Try raw JSON
  try { return JSON.parse(text); } catch {}
  // Try ```json block
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) { try { return JSON.parse(match[1]); } catch {} }
  // Try first { to last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  return null;
}

async function callLLM(systemPrompt: string, userContent: string): Promise<string> {
  const provider = getLLMProvider();
  if (!provider) throw new Error('LLM not configured');
  const resp = await provider.chat({
    model: provider.defaultModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.3,
    maxTokens: 4096,
  });
  return resp.text;
}

function defaultState(sessionId: string, role: string): JobPrepWorkflowState {
  return {
    sessionId, role,
    currentStep: 'collect_target',
    messages: [],
    jdCandidates: [],
    requirements: [],
    retrievedChunks: [],
    retrievedCards: [],
    errors: [],
  };
}

export async function runWorkflowStep(
  sessionId: string,
  userInput?: string,
): Promise<{ state: JobPrepWorkflowState; assistantMessage?: string; nextAction?: JobPrepStep }> {
  // Load existing state from DB
  const dbSession = await prisma.jobPrepSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } }, postings: true, requirements: true },
  });

  if (!dbSession) throw new Error('Session not found');

  const state = defaultState(sessionId, dbSession.role);
  state.company = dbSession.company || undefined;
  state.roleFamily = dbSession.roleFamily || undefined;
  state.messages = dbSession.messages.map(m => ({
    id: m.id, role: m.role as any, content: m.content,
    toolName: m.toolName || undefined, toolPayload: m.toolPayload, createdAt: m.createdAt.toISOString(),
  }));

  // Determine current step
  let step: JobPrepStep = state.currentStep;

  if (dbSession.status === 'collecting') step = 'collect_target';
  else if (dbSession.status === 'searching_jd') step = 'ask_for_jd';
  else if (dbSession.status === 'planning') step = 'generate_plan';
  else if (dbSession.status === 'active') step = 'execute_plan';

  // Save user message
  if (userInput) {
    await prisma.jobPrepMessage.create({
      data: { sessionId, role: 'user', content: userInput },
    });
  }

  // Execute step
  let assistantMessage = '';
  let nextAction: JobPrepStep | undefined;

  switch (step) {
    case 'collect_target': {
      if (!userInput) {
        assistantMessage = '你想准备什么公司和岗位的面试？例如：「我要面试阿里的数据分析实习」。';
        nextAction = 'collect_target';
      } else {
        // Parse target
        try {
          const raw = await callLLM(TARGET_PARSE_PROMPT, userInput);
          const parsed = safeParseJson(raw);
          if (parsed) {
            await prisma.jobPrepSession.update({
              where: { id: sessionId },
              data: {
                company: parsed.company || null,
                role: parsed.role || userInput,
                roleFamily: parsed.roleFamily || null,
                status: 'searching_jd',
              },
            });
            assistantMessage = `好的，我会为你准备「${parsed.company || ''} ${parsed.role || userInput}」的面试复习计划。\n\n你现在有 JD（岗位描述）吗？可以直接粘贴文字，或者让我尝试搜索公开岗位信息。`;
          } else {
            assistantMessage = '收到！你想面试什么岗位？请描述一下。';
            nextAction = 'collect_target';
            break;
          }
        } catch {
          assistantMessage = '你准备面试什么公司和岗位？';
          nextAction = 'collect_target';
          break;
        }
        nextAction = 'ask_for_jd';
      }
      break;
    }

    case 'ask_for_jd': {
      if (!userInput) {
        assistantMessage = '你现在有 JD 吗？可以粘贴文字，或者让我搜索公开岗位。如果没有 JD 也没关系，我会用通用岗位画像为你生成计划。';
        nextAction = 'ask_for_jd';
      } else if (userInput.length > 50) {
        // Probably a pasted JD
        await prisma.jobPostingSnapshot.create({
          data: { sessionId, sourceType: 'user_pasted', rawText: userInput, selected: true },
        });
        await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'planning' } });

        // Parse JD
        try {
          const raw = await callLLM(JD_PARSE_PROMPT, `Parse this JD:\n${userInput.slice(0, 3000)}`);
          const parsed = safeParseJson(raw);
          if (parsed?.requirements) {
            for (const req of parsed.requirements) {
              await prisma.jobRequirement.create({
                data: {
                  sessionId, type: req.type || 'skill', name: req.name || '',
                  normalizedName: req.normalizedName || null,
                  importance: req.importance || 'unknown', evidenceText: req.evidenceText || null,
                },
              });
            }
          }
        } catch { /* JD parse non-critical */ }

        assistantMessage = `已收到 JD。我正在解析岗位要求并为你生成学习计划...`;

        // Generate plan
        const cards = await prisma.card.findMany({ take: 50, include: { deck: true } });
        const cardList = cards.map(c => `- ${c.id}: [${c.deckId}] ${(c as any).deck?.name}: ${c.question || c.title || ''}`).join('\n');
        const prompt = `Job: ${dbSession.company || ''} ${dbSession.role}\nRequirements: ${userInput.slice(0, 500)}\n\nAvailable cards:\n${cardList}`;

        try {
          const raw = await callLLM(PLAN_GENERATE_PROMPT, prompt);
          const plan = safeParseJson(raw);
          if (plan) nextAction = 'save_plan';
          else assistantMessage += '\n计划生成遇到问题，请重试。';
        } catch {
          assistantMessage += '\n计划生成遇到问题，请检查 LLM 配置。';
        }
        nextAction = nextAction || 'ask_for_jd';
      } else {
        // Short response, check for "no JD" or "skip"
        if (userInput.includes('没有') || userInput.includes('跳过') || userInput.includes('不用')) {
          await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'planning' } });
          assistantMessage = '好的，我用通用岗位画像为你生成计划。请稍等...';

          const cards = await prisma.card.findMany({ take: 50, include: { deck: true } });
          const cardList = cards.map(c => `- ${c.id}: [${c.deckId}] ${(c as any).deck?.name}: ${c.question || c.title || ''}`).join('\n');
          const prompt = `Job: ${dbSession.company || ''} ${dbSession.role}\nNo JD available, use general profile.\n\nAvailable cards:\n${cardList}`;

          try {
            const raw = await callLLM(PLAN_GENERATE_PROMPT, prompt);
            const plan = safeParseJson(raw);
            if (plan) nextAction = 'save_plan';
          } catch { /* ignore */ }
          nextAction = nextAction || 'ask_for_jd';
        } else {
          assistantMessage = '你可以直接粘贴 JD 文本，或告诉我"没有 JD"让我用通用画像生成。';
          nextAction = 'ask_for_jd';
        }
      }
      break;
    }

    case 'save_plan': {
      // Plan was generated in ask_for_jd step, save it
      assistantMessage = '计划已生成！你可以在下方查看并调整。';
      nextAction = 'execute_plan';
      await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'active' } });
      break;
    }

    case 'revise_plan': {
      if (!userInput) {
        assistantMessage = '你想怎么调整计划？比如「加强 SQL」「只保留 3 天」「删除算法部分」。';
        nextAction = 'revise_plan';
      } else {
        // Re-generate with user feedback
        assistantMessage = `已收到你的反馈「${userInput}」，正在调整计划...`;

        const cards = await prisma.card.findMany({ take: 50, include: { deck: true } });
        const cardList = cards.map(c => `- ${c.id}: [${c.deckId}] ${c.question || c.title || ''}`).join('\n');
        const prompt = `Job: ${dbSession.company || ''} ${dbSession.role}\nUser feedback: ${userInput}\n\nAvailable cards:\n${cardList}`;

        try {
          const raw = await callLLM(PLAN_GENERATE_PROMPT, prompt);
          const plan = safeParseJson(raw);
          if (plan) nextAction = 'save_plan';
        } catch { /* ignore */ }
        nextAction = nextAction || 'revise_plan';
      }
      break;
    }

    case 'execute_plan': {
      if (userInput) {
        // Quick action buttons
        if (userInput.includes('加强') || userInput.includes('减少') || userInput.includes('重新') || userInput.includes('只有')) {
          nextAction = 'revise_plan';
        }
      }
      assistantMessage = assistantMessage || '有什么我可以帮你的？';
      break;
    }

    default: {
      assistantMessage = '有什么我可以帮你的？';
      nextAction = 'ask_for_jd';
    }
  }

  // Save assistant message
  if (assistantMessage) {
    await prisma.jobPrepMessage.create({
      data: { sessionId, role: 'assistant', content: assistantMessage },
    });
  }

  return { state, assistantMessage, nextAction };
}
