// Job Prep Workflow TypeScript state machine

import prisma from '../../db/prisma';
import type { JobPrepStep } from './job-prep-types';
import { getLLMProvider } from '../llm-provider';
import { TARGET_PARSE_PROMPT, JD_PARSE_PROMPT, PLAN_GENERATE_PROMPT, PLAN_REVISE_PROMPT } from './job-prep-prompts';
import { searchPublicJD } from './tools/public-jd-search-tool';
import { neo4jBuildKeywordTiers } from '../search/neo4j-graph-search';
import { ragSearch } from '../rag/rag-search';
import { fts5Search } from '../search/fts5-search';

function safeParseJson(text: string): any {
  try { return JSON.parse(text); } catch {}
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) { try { return JSON.parse(match[1]); } catch {} }
  const start = text.indexOf('{'); const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch {} }
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
    temperature: 0.3, maxTokens: 4096,
  });
  return resp.text;
}

export async function runWorkflowStep(
  sessionId: string,
  userInput?: string,
): Promise<{ assistantMessage?: string; nextAction?: string; data?: any }> {
  const dbSession = await prisma.jobPrepSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } }, postings: true, requirements: true },
  });
  if (!dbSession) throw new Error('Session not found');

  const status = dbSession.status;
  let assistantMessage = '';
  let nextAction = '';

  // Save user message
  if (userInput) {
    await prisma.jobPrepMessage.create({ data: { sessionId, role: 'user', content: userInput } });
  }

  // ── Step: collect_target ──
  if (status === 'collecting') {
    if (!userInput) {
      assistantMessage = '你想准备什么公司和岗位的面试？例如：「我要面试阿里的数据分析实习」。';
      nextAction = 'collect_target';
    } else {
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
          assistantMessage = `好的，我会为你准备「${parsed.company || ''} ${parsed.role || userInput}」的面试复习计划。\n\n你现在有 JD（岗位描述）吗？可以直接粘贴文字，或让我搜索公开岗位信息。`;
          nextAction = 'ask_for_jd';
        } else {
          assistantMessage = '收到！你想面试什么公司和岗位？';
          nextAction = 'collect_target';
        }
      } catch {
        assistantMessage = '你准备面试什么公司和岗位？';
        nextAction = 'collect_target';
      }
    }
  }

  // ── Step: ask_for_jd / search_public_jd ──
  else if (status === 'searching_jd') {
    // User pasted JD text
    if (userInput && userInput.length > 100 && (
      userInput.includes('岗位') || userInput.includes('职责') || userInput.includes('要求') ||
      userInput.includes('responsibilities') || userInput.includes('requirements')
    )) {
      await prisma.jobPostingSnapshot.create({
        data: { sessionId, sourceType: 'user_pasted', rawText: userInput, selected: true, cleanedText: userInput },
      });
      await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'planning' } });

      // Parse JD requirements
      try {
        const raw = await callLLM(JD_PARSE_PROMPT, `Parse this JD:\n${userInput.slice(0, 3000)}`);
        const parsed = safeParseJson(raw);
        if (parsed?.requirements) {
          for (const req of parsed.requirements) {
            await prisma.jobRequirement.create({
              data: { sessionId, type: req.type || 'skill', name: req.name || '',
                normalizedName: req.normalizedName || null, importance: req.importance || 'unknown',
                evidenceText: req.evidenceText || null },
            });
          }
        }
      } catch { /* non-critical */ }

      // Generate plan with full pipeline
      const result = await generatePlanWithPipeline(sessionId, dbSession.company, dbSession.role);
      assistantMessage = result.message;
      nextAction = 'execute_plan';
    }

    // User wants public JD search
    else if (userInput && (userInput.includes('搜索') || userInput.includes('公开') || userInput.includes('没有'))) {
      if (userInput.includes('搜索') || userInput.includes('公开')) {
        assistantMessage = '正在搜索公开岗位信息...';
        await sendMessage(sessionId, 'assistant', assistantMessage);

        const company = dbSession.company || '';
        const role = dbSession.role || '';
        const result = await searchPublicJD(company, role);

        if (result.candidates.length > 0) {
          // Save candidates to DB
          for (const c of result.candidates) {
            await prisma.jobPostingSnapshot.create({
              data: {
                sessionId, sourceType: c.sourceType, sourceUrl: c.sourceUrl,
                title: c.title, company: c.company, role: c.role,
                rawText: c.rawText, cleanedText: c.cleanedText, confidence: c.confidence,
              },
            });
          }
          await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'confirming_jd' } });

          const list = result.candidates.map((c, i) =>
            `${i + 1}. ${c.title}\n   来源: ${c.sourceUrl}\n   匹配度: ${Math.round(c.confidence * 100)}%\n   ${c.cleanedText.slice(0, 200)}...`
          ).join('\n\n');
          assistantMessage = `找到 ${result.candidates.length} 个相关岗位：\n\n${list}\n\n请回复编号确认使用哪个 JD。`;
          nextAction = 'confirm_jd';
        } else {
          // No real JD found
          await prisma.jobPostingSnapshot.create({
            data: { sessionId, sourceType: 'fallback_profile', rawText: `通用${role}岗位画像`, selected: true },
          });
          await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'planning' } });

          assistantMessage = '未找到可靠的公开 JD。已使用通用岗位画像为你生成计划...';
          const planResult = await generatePlanWithPipeline(sessionId, company, role);
          assistantMessage += '\n' + planResult.message;
          nextAction = 'execute_plan';
        }
      } else {
        // No JD — use fallback
        await prisma.jobPostingSnapshot.create({
          data: { sessionId, sourceType: 'fallback_profile', rawText: `通用${dbSession.role || '岗位'}画像`, selected: true },
        });
        await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'planning' } });

        const company = dbSession.company || '';
        const role = dbSession.role || '';
        assistantMessage = '好的，使用通用岗位画像生成计划...';
        const planResult = await generatePlanWithPipeline(sessionId, company, role);
        assistantMessage += '\n' + planResult.message;
        nextAction = 'execute_plan';
      }
    }

    // Prompt for JD
    else {
      assistantMessage = '你现在有 JD 吗？可以：\n1. 直接粘贴 JD 文本\n2. 输入「搜索公开岗位」让我去网上找\n3. 输入「没有 JD」使用通用画像';
      nextAction = 'ask_for_jd';
    }
  }

  // ── Step: confirm_jd ──
  else if (status === 'confirming_jd') {
    const candidates = await prisma.jobPostingSnapshot.findMany({
      where: { sessionId, sourceType: { in: ['public_web', 'official_site'] } },
    });

    if (userInput && candidates.length > 0) {
      const idx = parseInt(userInput) - 1;
      if (idx >= 0 && idx < candidates.length) {
        // Confirm this JD
        await prisma.jobPostingSnapshot.updateMany({ where: { sessionId }, data: { selected: false } });
        await prisma.jobPostingSnapshot.update({ where: { id: candidates[idx].id }, data: { selected: true } });
        await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'planning' } });

        // Parse JD
        try {
          const raw = await callLLM(JD_PARSE_PROMPT, `Parse this JD:\n${candidates[idx].cleanedText || candidates[idx].rawText}`);
          const parsed = safeParseJson(raw);
          if (parsed?.requirements) {
            for (const req of parsed.requirements) {
              await prisma.jobRequirement.create({
                data: { sessionId, type: req.type || 'skill', name: req.name || '',
                  normalizedName: req.normalizedName || null, importance: req.importance || 'unknown',
                  evidenceText: req.evidenceText || null },
              });
            }
          }
        } catch { /* non-critical */ }

        const company = dbSession.company || '';
        const role = dbSession.role || '';
        const planResult = await generatePlanWithPipeline(sessionId, company, role);
        assistantMessage = planResult.message;
        nextAction = 'execute_plan';
      } else {
        assistantMessage = `请输入 1-${candidates.length} 之间的编号。`;
        nextAction = 'confirm_jd';
      }
    } else {
      assistantMessage = '请回复编号确认 JD，或输入「没有」跳过。';
      nextAction = 'confirm_jd';
    }
  }

  // ── Step: planning → generate plan with full pipeline ──
  else if (status === 'planning') {
    const company = dbSession.company || '';
    const role = dbSession.role || '';
    const result = await generatePlanWithPipeline(sessionId, company, role);
    assistantMessage = result.message;
    nextAction = 'execute_plan';
  }

  // ── Step: active ──
  else if (status === 'active') {
    if (userInput) {
      if (userInput.includes('加强') || userInput.includes('减少') || userInput.includes('重新') || userInput.includes('只有')) {
        await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'planning' } });

        // Re-generate with feedback
        const company = dbSession.company || '';
        const role = dbSession.role || '';
        const cards = await prisma.card.findMany({ take: 50, include: { deck: true } });
        const cardList = cards.map(c => `- ${c.id}: [${c.deckId}] ${c.question || c.title || ''}`).join('\n');
        const prompt = `Job: ${company} ${role}\nUser feedback: ${userInput}\n\nAvailable cards:\n${cardList}`;

        try {
          const raw = await callLLM(PLAN_REVISE_PROMPT, prompt);
          const plan = safeParseJson(raw);
          if (plan) {
            await savePlan(sessionId, plan);
            assistantMessage = `已根据「${userInput}」调整计划。`;
          } else {
            assistantMessage = '计划调整遇到问题，请重试。';
          }
        } catch {
          assistantMessage = '调整失败，请稍后重试。';
        }
        nextAction = 'execute_plan';
      } else {
        assistantMessage = '你可以点击上方计划中的「开始学习」进入学习。或告诉我需要调整什么。';
        nextAction = 'execute_plan';
      }
    } else {
      assistantMessage = '有什么我可以帮你的？';
      nextAction = 'execute_plan';
    }
  }

  else {
    assistantMessage = '有什么我可以帮你的？';
    nextAction = 'ask_for_jd';
  }

  // Save assistant message
  if (assistantMessage) {
    await sendMessage(sessionId, 'assistant', assistantMessage);
  }

  return { assistantMessage, nextAction };
}

// ── Helpers ──

async function sendMessage(sessionId: string, role: string, content: string) {
  await prisma.jobPrepMessage.create({ data: { sessionId, role, content } });
}

async function generatePlanWithPipeline(
  sessionId: string,
  company: string | null,
  role: string,
): Promise<{ message: string; planSaved: boolean }> {
  // 1. Neo4j graph expansion
  let graphKeywords: string[] = [];
  try {
    const { tiers } = await neo4jBuildKeywordTiers(`${company || ''} ${role}`);
    graphKeywords = [...tiers.coreKeywords, ...tiers.expandedKeywords].slice(0, 20);
  } catch { /* Neo4j unavailable */ }

  // 2. Qdrant RAG retrieval
  let ragCards: any[] = [];
  try {
    const ragResults = await ragSearch({ query: role, sourceTypes: ['card'], topK: 30 });
    ragCards = ragResults.filter(r => r.cardId).map(r => ({ cardId: r.cardId, reason: `RAG match: ${r.title}` }));
  } catch { /* Qdrant unavailable */ }

  // 3. FTS5 keyword search
  let fts5Cards: string[] = [];
  try {
    const searchQuery = [company, role, ...graphKeywords].filter(Boolean).join(' ');
    const fts5Results = await fts5Search(searchQuery, 30);
    fts5Cards = fts5Results.map(r => r.cardId);
  } catch { /* FTS5 unavailable */ }

  // 4. Get requirements
  const requirements = await prisma.jobRequirement.findMany({ where: { sessionId } });
  const reqText = requirements.map(r => `- ${r.type}: ${r.name} (${r.importance})`).join('\n');

  // 5. Get available cards
  const allCardIds = [...new Set([...ragCards.map((c: any) => c.cardId), ...fts5Cards])];
  const dbCards = allCardIds.length > 0
    ? await prisma.card.findMany({ where: { id: { in: allCardIds } }, include: { deck: true }, take: 50 })
    : await prisma.card.findMany({ include: { deck: true }, take: 50 });

  const cardList = dbCards.map(c =>
    `- ${c.id}: [${c.deckId}] ${(c as any).deck?.name || ''}: ${c.question || c.title || ''}`
  ).join('\n');

  // 6. LLM generate plan
  const prompt = [
    `Job: ${company || ''} ${role}`,
    requirements.length > 0 ? `\nRequirements from JD:\n${reqText}` : '\nNo JD requirements (using general profile).',
    graphKeywords.length > 0 ? `\nGraph expanded concepts: ${graphKeywords.join(', ')}` : '',
    `\nAvailable cards:\n${cardList}`,
  ].join('\n');

  try {
    const raw = await callLLM(PLAN_GENERATE_PROMPT, prompt);
    const plan = safeParseJson(raw);
    if (plan) {
      await savePlan(sessionId, plan);
      return {
        message: `计划「${plan.title}」已生成！共 ${plan.stages?.length || 0} 个阶段，${plan.stages?.reduce((s: number, st: any) => s + (st.cards?.length || 0), 0) || 0} 张卡片。`,
        planSaved: true,
      };
    }
    return { message: '计划已生成，但格式解析失败。请重试。', planSaved: false };
  } catch (e: any) {
    return { message: `计划生成失败：${e.message}`, planSaved: false };
  }
}

async function savePlan(sessionId: string, plan: any) {
  const planRecord = await prisma.jobPrepPlan.create({
    data: {
      sessionId,
      title: plan.title || '备战计划',
      summary: plan.summary || null,
      estimatedDays: plan.estimatedDays,
      totalStages: (plan.stages || []).length,
      totalCards: (plan.stages || []).reduce((s: number, st: any) => s + (st.cards || []).length, 0),
    },
  });

  for (const [si, stage] of (plan.stages || []).entries()) {
    const dbStage = await prisma.jobPrepStage.create({
      data: {
        planId: planRecord.id, order: si,
        name: stage.name || `Stage ${si + 1}`,
        goal: stage.goal || '',
        estimatedMinutes: stage.estimatedMinutes || 180,
      },
    });

    for (const [ci, card] of (stage.cards || []).entries()) {
      // Validate cardId exists
      const cardExists = await prisma.card.findUnique({ where: { id: card.cardId } });
      if (!cardExists) continue;

      await prisma.jobPrepPlanCard.create({
        data: {
          planId: planRecord.id, stageId: dbStage.id,
          cardId: card.cardId, deckId: card.deckId || cardExists.deckId,
          order: ci, reason: card.reason || '',
          matchedRequirements: [], matchedConcepts: [],
          source: 'hybrid',
        },
      });
    }
  }

  await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'active', activePlanId: planRecord.id } });
}
