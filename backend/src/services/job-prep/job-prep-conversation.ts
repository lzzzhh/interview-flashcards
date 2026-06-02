// Job Prep Conversation Turn Handler — unified multi-turn entry point
// Classifies intent → routes to appropriate handler → returns assistant response

import prisma from '../../db/prisma';
import { getLLMProvider } from '../llm-provider';
import { JD_PARSE_PROMPT, PLAN_GENERATE_PROMPT, PLAN_REVISE_PROMPT } from './job-prep-prompts';
import { searchPublicJD } from './tools/public-jd-search-tool';
import { neo4jBuildKeywordTiers } from '../search/neo4j-graph-search';
import { fts5Search } from '../search/fts5-search';

// ── Intent types ──

export type JobPrepIntent =
  | 'provide_jd' | 'confirm_jd' | 'search_jd_again'
  | 'revise_plan' | 'shorten_plan' | 'strengthen_skill' | 'reduce_topic'
  | 'replace_cards' | 'explain_plan' | 'regenerate_plan'
  | 'start_learning' | 'general_question';

// ── Helpers ──

function safeParseJson(text: string): any {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) { try { return JSON.parse(m[1]); } catch {} }
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch {} }
  return null;
}

async function llm(prompt: string, userContent: string): Promise<string> {
  const p = getLLMProvider(); if (!p) throw new Error('LLM not configured');
  const r = await p.chat({ model: p.defaultModel, messages: [{ role: 'system', content: prompt }, { role: 'user', content: userContent }], temperature: 0.3, maxTokens: 4096 });
  return r.text;
}

async function loadSession(sessionId: string) {
  return prisma.jobPrepSession.findUnique({ where: { id: sessionId } });
}

async function loadActivePlan(planId: string | null | undefined) {
  if (!planId) return null;
  return prisma.jobPrepPlan.findUnique({ where: { id: planId }, include: { stages: { orderBy: { order: 'asc' }, include: { cards: { orderBy: { order: 'asc' } } } } } });
}

// ── Intent Classifier ──

function classifyIntent(content: string, hasPlan: boolean): JobPrepIntent {
  const c = content.toLowerCase();
  const ch = content;

  // JD-related
  if (ch.length > 100 && (ch.includes('岗位') || ch.includes('职责') || ch.includes('要求') || ch.includes('任职'))) return 'provide_jd';
  if (ch.includes('搜索') && (ch.includes('JD') || ch.includes('岗位') || ch.includes('公开'))) return 'search_jd_again';

  if (!hasPlan) return 'general_question';

  // Plan revisions
  if (/\d+\s*天/.test(c) && (c.includes('只有') || c.includes('缩短') || c.includes('压缩'))) return 'shorten_plan';
  if (c.includes('加强') || c.includes('增加') || c.includes('更多')) return 'strengthen_skill';
  if (c.includes('减少') || c.includes('去掉') || c.includes('删除') || c.includes('不要')) return 'reduce_topic';
  if (c.includes('为什么') || c.includes('解释') || c.includes('安排') || c.includes('推荐')) return 'explain_plan';
  if (c.includes('换') || c.includes('替换') || c.includes('不相关') || c.includes('不想学')) return 'replace_cards';
  if (c.includes('重新') && (c.includes('生成') || c.includes('计划'))) return 'regenerate_plan';
  if (c.includes('开始') && (c.includes('学习') || c.includes('学'))) return 'start_learning';

  return 'general_question';
}

// ── Main Handler ──

export async function handleJobPrepMessage(sessionId: string, content: string) {
  const session = await loadSession(sessionId);
  if (!session) return { assistantMessage: '会话不存在。', nextAction: 'collect_target' };

  await prisma.jobPrepMessage.create({ data: { sessionId, role: 'user', content } });

  const hasPlan = !!session.activePlanId;
  const intent = classifyIntent(content, hasPlan);
  const activePlan = await loadActivePlan(session.activePlanId);

  // ── Route by intent ──
  switch (intent) {
    case 'provide_jd': return handleProvideJD(session, content);
    case 'search_jd_again': return handleSearchJD(session);
    case 'confirm_jd': return handleConfirmJD(session, content);
    case 'shorten_plan': return handleShortenPlan(session, activePlan, content);
    case 'strengthen_skill': return handleStrengthenSkill(session, activePlan, content);
    case 'reduce_topic': return handleReduceTopic(session, activePlan, content);
    case 'explain_plan': return handleExplainPlan(activePlan);
    case 'replace_cards': return handleReplaceCards(session, activePlan);
    case 'regenerate_plan': return handleRegeneratePlan(session, activePlan);
    case 'start_learning': return handleStartLearning(activePlan);
    default: return handleGeneralQuestion(session, activePlan, content);
  }
}

// ── Intent Handlers ──

async function handleProvideJD(session: any, content: string) {
  await prisma.jobPostingSnapshot.create({ data: { sessionId: session.id, sourceType: 'user_pasted', rawText: content, selected: true } });
  await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'planning' } });

  // Parse requirements
  try {
    const raw = await llm(JD_PARSE_PROMPT, `Parse this JD:\n${content.slice(0, 3000)}`);
    const parsed = safeParseJson(raw);
    if (parsed?.requirements) for (const r of parsed.requirements) {
      await prisma.jobRequirement.create({ data: { sessionId: session.id, type: r.type || 'skill', name: r.name, normalizedName: r.normalizedName, importance: r.importance || 'unknown', evidenceText: r.evidenceText } });
    }
  } catch { /* non-critical */ }

  return generateAndSavePlan(session);
}

async function handleSearchJD(session: any) {
  const result = await searchPublicJD(session.company || '', session.role || '');
  if (result.candidates.length > 0) {
    for (const c of result.candidates) {
      await prisma.jobPostingSnapshot.create({ data: { sessionId: session.id, sourceType: c.sourceType, sourceUrl: c.sourceUrl, title: c.title, company: c.company, role: c.role, rawText: c.rawText, cleanedText: c.cleanedText, confidence: c.confidence } });
    }
    await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'confirming_jd' } });
    const list = result.candidates.map((c: any, i: number) => `${i + 1}. ${c.title} (${Math.round(c.confidence * 100)}%)`).join('\n');
    return { assistantMessage: `找到 ${result.candidates.length} 个岗位：\n${list}\n\n回复编号确认。`, nextAction: 'confirm_jd' };
  }
  await prisma.jobPostingSnapshot.create({ data: { sessionId: session.id, sourceType: 'fallback_profile', rawText: `通用${session.role || ''}岗位画像`, selected: true } });
  await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'planning' } });
  return generateAndSavePlan(session);
}

async function handleConfirmJD(session: any, content: string) {
  const candidates = await prisma.jobPostingSnapshot.findMany({ where: { sessionId: session.id, sourceType: { in: ['public_web', 'official_site'] } } });
  const idx = parseInt(content) - 1;
  if (idx >= 0 && idx < candidates.length) {
    await prisma.jobPostingSnapshot.updateMany({ where: { sessionId: session.id }, data: { selected: false } });
    await prisma.jobPostingSnapshot.update({ where: { id: candidates[idx].id }, data: { selected: true } });
    await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'planning' } });
    return generateAndSavePlan(session);
  }
  return { assistantMessage: `请输入 1-${candidates.length} 之间的编号。`, nextAction: 'confirm_jd' };
}

async function handleShortenPlan(session: any, plan: any, content: string) {
  const days = parseInt((content.match(/(\d+)\s*天/) || [])[1]) || 3;
  return revisePlanWithFeedback(session, plan, `将计划压缩到 ${days} 天，保留最重要的卡片。`, days);
}

async function handleStrengthenSkill(session: any, plan: any, content: string) {
  const skill = content.replace(/加强|增加|更多/g, '').trim() || content;
  return revisePlanWithFeedback(session, plan, `加强对「${skill}」的覆盖，增加相关卡片数量。`);
}

async function handleReduceTopic(session: any, plan: any, content: string) {
  const topic = content.replace(/减少|去掉|删除|不要/g, '').trim() || content;
  return revisePlanWithFeedback(session, plan, `减少或移除「${topic}」相关卡片。`);
}

async function handleExplainPlan(plan: any) {
  if (!plan) return { assistantMessage: '暂无计划，请先生成。', nextAction: 'ask_for_jd' };
  const stages = plan.stages?.map((s: any, i: number) => `${i + 1}. ${s.name}: ${s.goal}（${s.cards?.length || 0} 张卡片）`).join('\n') || '';
  return { assistantMessage: `「${plan.title}」共 ${plan.totalStages} 个阶段：\n${stages}\n\n需要调整可以告诉我。`, nextAction: 'await_user' };
}

async function handleReplaceCards(session: any, plan: any) {
  if (!plan) return { assistantMessage: '暂无计划。', nextAction: 'ask_for_jd' };
  return revisePlanWithFeedback(session, plan, '替换不相关或低质量的卡片，保留核心阶段结构。');
}

async function handleRegeneratePlan(session: any, plan: any) {
  if (plan) await prisma.jobPrepPlan.update({ where: { id: plan.id }, data: { status: 'archived' } });
  return generateAndSavePlan(session);
}

async function handleStartLearning(plan: any) {
  if (!plan?.stages?.[0]) return { assistantMessage: '暂无阶段可学习。', nextAction: 'await_user' };
  const stage = plan.stages[0];
  const cardIds = stage.cards?.map((c: any) => c.cardId) || [];
  return { assistantMessage: `开始学习「${stage.name}」（${cardIds.length} 张卡片）`, nextAction: 'start_stage', data: { stageId: stage.id, cardIds } };
}

async function handleGeneralQuestion(session: any, plan: any, content: string) {
  if (!session.company && !session.role) {
    // No job target yet — treat as target
    await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'collecting' } });
    return { assistantMessage: '你想准备什么公司和岗位的面试？例如：「我要面试阿里的数据分析实习」。', nextAction: 'collect_target' };
  }
  if (!plan && session.status !== 'planning') {
    // No plan yet — prompt for JD or generate
    return { assistantMessage: '你现在有 JD 吗？可以粘贴文字，或输入「搜索公开岗位」。', nextAction: 'ask_for_jd' };
  }
  // General conversation with context
  return { assistantMessage: '收到。有什么我可以帮你的？\n\n你可以说「加强 SQL」「只有 3 天」「重新生成计划」来调整计划。', nextAction: 'await_user' };
}

// ── Plan Generation & Revision ──

async function generateAndSavePlan(session: any) {
  const company = session.company || '';
  const role = session.role || '';

  // Graph expansion
  let graphKw: string[] = [];
  try { const { tiers } = await neo4jBuildKeywordTiers(`${company} ${role}`); graphKw = [...tiers.coreKeywords, ...tiers.expandedKeywords].slice(0, 15); } catch {}

  // FTS5 card search
  let ids: string[] = [];
  try { const r = await fts5Search([company, role, ...graphKw].filter(Boolean).join(' '), 50); ids = r.map(x => x.cardId); } catch {}

  // Fetch cards
  const cards = ids.length > 0
    ? await prisma.card.findMany({ where: { id: { in: ids } }, include: { deck: true }, take: 50 })
    : await prisma.card.findMany({ include: { deck: true }, take: 50 });

  const cardList = cards.map(c => `- ${c.id}: [${c.deckId}] ${(c as any).deck?.name || ''}: ${c.question || c.title || ''}`).join('\n');

  // Requirements
  const reqs = await prisma.jobRequirement.findMany({ where: { sessionId: session.id } });
  const reqText = reqs.map(r => `- ${r.type}: ${r.name} (${r.importance})`).join('\n');

  // LLM generate
  const prompt = [`Job: ${company} ${role}`, reqText ? `\nRequirements:\n${reqText}` : '', `\nConcepts: ${graphKw.join(', ')}`, `\nCards:\n${cardList}`].join('\n');

  try {
    const raw = await llm(PLAN_GENERATE_PROMPT, prompt);
    const plan = safeParseJson(raw);
    if (plan) {
      const saved = await savePlanToDB(session.id, plan);
      const stages = plan.stages?.length || 0;
      const totalCards = plan.stages?.reduce((s: number, st: any) => s + (st.cards?.length || 0), 0) || 0;
      return { assistantMessage: `计划「${plan.title}」已生成！共 ${stages} 个阶段、${totalCards} 张卡片。\n\n你可以说「加强 SQL」「只有 3 天」「为什么这样安排」来调整计划。`, nextAction: 'await_user', data: { planId: saved.id } };
    }
    return { assistantMessage: '计划生成遇到格式问题，请重试。', nextAction: 'await_user' };
  } catch (e: any) {
    return { assistantMessage: `计划生成失败：${e.message}`, nextAction: 'await_user' };
  }
}

async function revisePlanWithFeedback(session: any, plan: any, feedback: string, estimatedDays?: number) {
  if (!plan) return generateAndSavePlan(session);

  const company = session.company || '';
  const role = session.role || '';

  const cards = await prisma.card.findMany({ include: { deck: true }, take: 60 });
  const cardList = cards.map(c => `- ${c.id}: [${c.deckId}] ${(c as any).deck?.name}: ${c.question || c.title}`).join('\n');

  const stages = plan.stages?.map((s: any) => `- ${s.name}: ${s.goal} (${s.cards?.length} cards)`).join('\n') || '';

  const prompt = `Job: ${company} ${role}\n\nCurrent plan:\n${stages}\n\nFeedback: ${feedback}\n${estimatedDays ? `Target days: ${estimatedDays}` : ''}\n\nAvailable cards:\n${cardList}`;

  try {
    const raw = await llm(PLAN_REVISE_PROMPT, prompt);
    const revised = safeParseJson(raw);
    if (revised) {
      // Archive old plan, save new
      await prisma.jobPrepPlan.update({ where: { id: plan.id }, data: { status: 'archived' } });
      const saved = await savePlanToDB(session.id, revised, plan.version + 1, plan.id);
      return { assistantMessage: `已根据「${feedback}」调整计划。`, nextAction: 'await_user', data: { planId: saved.id } };
    }
    return { assistantMessage: '调整遇到问题，请重试。', nextAction: 'await_user' };
  } catch (e: any) {
    return { assistantMessage: `调整失败：${e.message}`, nextAction: 'await_user' };
  }
}

async function savePlanToDB(sessionId: string, plan: any, version = 1, parentPlanId?: string) {
  const p = await prisma.jobPrepPlan.create({
    data: {
      sessionId, title: plan.title || '备战计划', summary: plan.summary, estimatedDays: plan.estimatedDays,
      version, parentPlanId: parentPlanId || null,
      totalStages: (plan.stages || []).length, totalCards: (plan.stages || []).reduce((s: number, st: any) => s + (st.cards || []).length, 0),
    },
  });
  for (const [si, stage] of (plan.stages || []).entries()) {
    const st = await prisma.jobPrepStage.create({ data: { planId: p.id, order: si, name: stage.name || `Stage ${si + 1}`, goal: stage.goal || '', estimatedMinutes: stage.estimatedMinutes || 180 } });
    for (const [ci, card] of (stage.cards || []).entries()) {
      const exists = await prisma.card.findUnique({ where: { id: card.cardId } });
      if (exists) {
        await prisma.jobPrepPlanCard.create({ data: { planId: p.id, stageId: st.id, cardId: card.cardId, deckId: card.deckId || exists.deckId, order: ci, reason: card.reason || '', matchedRequirements: [], matchedConcepts: [], source: 'hybrid' } });
      }
    }
  }
  await prisma.jobPrepSession.update({ where: { id: sessionId }, data: { status: 'active', activePlanId: p.id } });
  return p;
}
