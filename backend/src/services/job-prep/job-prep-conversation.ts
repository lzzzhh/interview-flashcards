// Job Prep Conversation Turn Handler — unified multi-turn entry point
// Classifies intent → routes to appropriate handler → returns assistant response

import prisma from '../../db/prisma';
import { getLLMProvider } from '../llm-provider';
import { JD_PARSE_PROMPT, PLAN_GENERATE_PROMPT, PLAN_REVISE_PROMPT } from './job-prep-prompts';
import { searchPublicJD } from './tools/public-jd-search-tool';
import { neo4jBuildKeywordTiers } from '../search/neo4j-graph-search';
import { fts5Search } from '../search/fts5-search';
import { ragSearch } from '../rag/rag-search';
import { indexJobPosting } from '../rag/rag-indexer';
import { getProfile, type RoleProfile } from './role-profiles';
import { ruleValidate, validateCardIds, type GuardContext } from './guards/plan-rule-validator';
import { llmGuard } from './guards/plan-llm-guard';

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
  if (ch.length > 80 && (ch.includes('岗位') || ch.includes('职责') || ch.includes('要求') || ch.includes('任职'))) return 'provide_jd';
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

  // Fix #2: confirm_jd by session status + digit input
  if (session.status === 'confirming_jd' && /^\d+$/.test(content.trim())) {
    return handleConfirmJD(session, content);
  }

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
  const posting = await prisma.jobPostingSnapshot.create({ data: { sessionId: session.id, sourceType: 'user_pasted', rawText: content, cleanedText: content, company: session.company, role: session.role, selected: true } });
  await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'planning' } });

  // Parse requirements
  try {
    const raw = await llm(JD_PARSE_PROMPT, `Parse this JD:\n${content.slice(0, 3000)}`);
    const parsed = safeParseJson(raw);
    if (parsed?.requirements) for (const r of parsed.requirements) {
      await prisma.jobRequirement.create({ data: { sessionId: session.id, type: r.type || 'skill', name: r.name, normalizedName: r.normalizedName, importance: r.importance || 'unknown', evidenceText: r.evidenceText } });
    }
  } catch { /* non-critical */ }

  // Index JD into Qdrant for RAG retrieval (fire-and-forget, don't block response)
  indexJobPosting(posting.id).catch(e => console.warn(`[job-prep] JD index failed: ${e.message}`));

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
    const candidate = candidates[idx];
    await prisma.jobPostingSnapshot.updateMany({ where: { sessionId: session.id }, data: { selected: false } });
    await prisma.jobPostingSnapshot.update({ where: { id: candidate.id }, data: { selected: true } });
    await prisma.jobPrepSession.update({ where: { id: session.id }, data: { status: 'planning' } });

    // Parse requirements from confirmed JD
    try {
      const raw = await llm(JD_PARSE_PROMPT, `Parse this JD:\n${candidate.cleanedText || candidate.rawText}`);
      const parsed = safeParseJson(raw);
      if (parsed?.requirements) for (const r of parsed.requirements) {
        await prisma.jobRequirement.create({ data: { sessionId: session.id, type: r.type || 'skill', name: r.name, normalizedName: r.normalizedName, importance: r.importance || 'unknown', evidenceText: r.evidenceText } });
      }
    } catch { /* non-critical */ }

    // Index confirmed JD into Qdrant (fire-and-forget)
    indexJobPosting(candidate.id).catch(e => console.warn(`[job-prep] JD index failed: ${e.message}`));

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
  const profile: RoleProfile | undefined = getProfile(session.roleFamily || '');

  // Profile keywords for graph expansion — supplement JD requirements
  const profileKeywords = profile
    ? [...profile.mustCoverInPlan, ...profile.concepts, ...profile.interviewTopics]
    : [];

  // Graph expansion — use profile keywords as additional queries
  let graphKw: string[] = [];
  try {
    for (const kw of [role, company, ...profileKeywords].filter(Boolean).slice(0, 8)) {
      try {
        const result = await Promise.race([
          neo4jBuildKeywordTiers(String(kw)),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ]);
        graphKw.push(...result.tiers.coreKeywords, ...result.tiers.expandedKeywords);
      } catch {}
    }
    graphKw = [...new Set(graphKw)].slice(0, 20);
  } catch {}

  // FTS5 card search
  let ids: string[] = [];
  try {
    const result = await Promise.race([
      fts5Search([company, role, ...graphKw].filter(Boolean).join(' '), 50),
      new Promise<{ cardId: string }[]>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);
    ids = result.map((x: any) => x.cardId);
  } catch {}

  // Fetch cards
  const cards = ids.length > 0
    ? await prisma.card.findMany({ where: { id: { in: ids } }, include: { deck: true }, take: 50 })
    : [];
  const hasCards = cards.length > 0;
  const cardList = hasCards
    ? cards.map(c => `- ${c.id}: [${c.deckId}] ${(c as any).deck?.name || ''}: ${c.question || c.title || ''}`).join('\n')
    : '(no cards available — generate topic-based plan with empty cards array, use topic fields instead)';

  // Requirements from JD
  const reqs = await prisma.jobRequirement.findMany({ where: { sessionId: session.id } });
  const jdReqText = reqs.length > 0
    ? reqs.map(r => `- [JD] ${r.type}: ${r.name} (${r.importance})`).join('\n')
    : '(no JD requirements extracted)';

  // Role checklist requirements — supplement gaps
  let checklistText = '';
  if (profile) {
    checklistText = [
      `以下为${profile.displayName}岗位常见准备项（来自岗位画像，非JD原文）：`,
      ...profile.mustCoverInPlan.map(s => `- [CHECKLIST] skill: ${s} (must_have — role common)`),
    ].join('\n');
  }

  // RAG context — fire-and-forget, don't block plan generation if slow
  const ragPromise = ragSearch({ query: [company, role, ...reqs.map(r => r.name)].filter(Boolean).join(' '), sourceTypes: ['job_posting', 'document', 'project', 'interview_qa'], topK: 15 })
    .then(results => results.length > 0 ? results.map(r => `[${r.sourceType}:${r.sourceId}] ${r.title || ''}: ${r.text.slice(0, 300)}`).join('\n---\n') : '')
    .catch(() => '');
  
  // Wait up to 5 seconds for RAG, then proceed
  const ragEvidence = await Promise.race([ragPromise, new Promise<string>(r => setTimeout(() => r(''), 5000))]);

  // Build the base prompt
  const basePrompt = [
    `Job: ${company} ${role}${profile ? ` (${profile.displayName})` : ''}`,
    jdReqText ? `\nJD Requirements (extracted from job posting):\n${jdReqText}` : '',
    checklistText ? `\nRole Checklist (role-common requirements, supplement gaps):\n${checklistText}` : '',
    ragEvidence ? `\nRAG Evidence:\n${ragEvidence}` : '',
    `\nConcepts from knowledge graph: ${graphKw.join(', ')}`,
    `\nCards:\n${cardList}`,
  ].join('\n');

  const topicNote = !hasCards ? ' （当前为主题型计划，暂无绑定卡片）' : '';

  // Guard context — passed to both validators
  const guardContext: GuardContext = {
    hasCards: cards.length > 0,
    roleFamily: session.roleFamily,
    profile,
    jdReqText,
    ragEvidence,
  };

  try {
    let guardErrors: Array<{ code: string; message: string; severity: 'error' | 'warning' }> = [];
    let repairCount = 0;
    const MAX_REPAIRS = 2;

    for (let attempt = 0; attempt <= MAX_REPAIRS; attempt++) {
      // Build prompt — append repair instructions on retry
      let currentPrompt = basePrompt;
      if (attempt > 0 && guardErrors.filter(e => e.severity === 'error').length > 0) {
        const fixNotes = guardErrors.filter(e => e.severity === 'error').map(e => `FIX: ${e.message}`).join('\n');
        if (fixNotes) {
          currentPrompt = `PREVIOUS PLAN FAILED QUALITY CHECK. Fix these issues:\n${fixNotes}\n\n---\n${basePrompt}`;
        }
      }

      // Generate draft plan (safe — don't crash on LLM failure)
      let draftPlan: any = null;
      try {
        const raw = await llm(PLAN_GENERATE_PROMPT, currentPrompt);
        draftPlan = safeParseJson(raw);
      } catch (e: any) {
        guardErrors.push({ code: 'LLM_FAIL', message: `LLM call failed: ${e.message}`, severity: 'error' });
        if (attempt < MAX_REPAIRS) { repairCount++; continue; }
        break;
      }
      if (!draftPlan) {
        guardErrors.push({ code: 'JSON_PARSE', message: 'Plan JSON could not be parsed', severity: 'error' });
        if (attempt < MAX_REPAIRS) { repairCount++; continue; }
        break;
      }

      // Rule validation
      let ruleResult = { passed: true, errors: [] as any[], repairInstructions: [] as string[] };
      try { ruleResult = ruleValidate(draftPlan, guardContext); } catch {}
      let dbCardErrors: any[] = [];
      try { dbCardErrors = await validateCardIds(draftPlan); } catch {}
      const allRuleErrors = [...ruleResult.errors, ...dbCardErrors];

      // LLM guard (Flash model — graceful, skip on failure)
      let llmErrors: any[] = [];
      try { const lr = await llmGuard(draftPlan, guardContext); llmErrors = lr.errors || []; } catch {}

      guardErrors = [...allRuleErrors, ...llmErrors];
      const criticalErrors = guardErrors.filter(e => e.severity === 'error');

      if (criticalErrors.length === 0) {
        // Passed! Save and return
        const saved = await savePlanToDB(session.id, draftPlan);
        const stageCount = draftPlan.stages?.length || 0;
        const cardTotal = draftPlan.stages?.reduce((s: number, st: any) => s + (st.cards?.length || 0), 0) || 0;
        return {
          assistantMessage: `计划「${draftPlan.title}」已生成！共 ${stageCount} 个阶段、${cardTotal} 张卡片。${topicNote}\n\n你可以说「加强 SQL」「只有 3 天」「为什么这样安排」来调整计划。`,
          nextAction: 'await_user',
          data: { planId: saved.id },
          _guardDetails: { guardPassed: true, repairCount: attempt, errors: guardErrors },
        };
      }

      if (attempt < MAX_REPAIRS) repairCount++;
    }

    // All attempts exhausted — don't save bad plan
    return {
      assistantMessage: `计划生成遇到问题，无法通过质量检查。${guardErrors.filter(e => e.severity === 'error').map(e => e.message).join('；')}`,
      nextAction: 'await_user',
      data: {},
      _guardDetails: { guardPassed: false, repairCount, errors: guardErrors },
    };
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
