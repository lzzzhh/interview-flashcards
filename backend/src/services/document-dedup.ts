import prisma from '../db/prisma';
import { getLLMProvider } from './llm-provider';

export type DedupStatus = 'exact_duplicate' | 'semantic_duplicate' | 'complementary_card' | 'related_existing_card' | 'new_card';

export interface DedupResult {
  status: DedupStatus;
  matchedCardIds: string[];
  reason?: string;
  duplicateGroupId?: string;
}

const JUDGE_PROMPT = `你是 flashcard 去重判断器。

任务：
判断两张卡片之间是否有语义重复。

比较维度：
1. canonicalConcept（核心概念）是否相同
2. learningObjective（学习目标）是否相同
3. atomicFacts（原子事实）是否高度重叠
4. answerScope（回答角度）是否接近

判断标准：
- semantic_duplicate: 相同概念 + 相同学习目标 + 事实高度重叠 → 重复
- complementary_card: 相同概念 + 不同学习目标 → 互补，可以共存
- related_existing_card: 概念相关但不同，或概念同但覆盖角度明显不同
- new_card: 概念不同或学习目标完全不同

输出 JSON（只输出一个对象，不要数组）：
{"status":"semantic_duplicate|complementary_card|related_existing_card|new_card","reason":"简要原因"}`;

interface CardMeta {
  cardId: string;
  question: string;
  answer: string;
  canonicalConcept?: string | null;
  learningObjective?: string | null;
  atomicFacts?: string[];
  answerScope?: string | null;
  searchKeywords?: string[];
  tags?: string[];
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.split(/\s+/).filter(t => t.length > 2));
  const tb = new Set(b.split(/\s+/).filter(t => t.length > 2));
  if (ta.size === 0 || tb.size === 0) return 0;
  const intersection = [...ta].filter(t => tb.has(t));
  return intersection.length / Math.min(ta.size, tb.size);
}

function arrayOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const norm = (s: string) => s.toLowerCase().trim();
  const sa = new Set(a.map(norm));
  const sb = new Set(b.map(norm));
  const intersection = [...sa].filter(s => [...sb].some(t => s.includes(t) || t.includes(s)));
  return intersection.length / Math.min(sa.size, sb.size);
}

async function llmJudge(card: CardMeta, existing: CardMeta): Promise<DedupStatus | null> {
  const llm = getLLMProvider();
  if (!llm) return null;

  try {
    const resp = await llm.chat({
      model: process.env.LLM_MODEL || 'deepseek-chat',
      messages: [
        { role: 'system', content: JUDGE_PROMPT },
        {
          role: 'user',
          content: `New card:
  question: ${card.question}
  answer: ${card.answer?.slice(0, 200)}
  concept: ${card.canonicalConcept || '-'}
  objective: ${card.learningObjective || '-'}
  atomicFacts: ${(card.atomicFacts || []).join('; ')}
  scope: ${card.answerScope || '-'}

Existing card:
  question: ${existing.question}
  answer: ${existing.answer?.slice(0, 200)}
  concept: ${existing.canonicalConcept || '-'}
  objective: ${existing.learningObjective || '-'
  }
  atomicFacts: ${(existing.atomicFacts || []).join('; ')}
  scope: ${existing.answerScope || '-'}`,
        },
      ],
      temperature: 0.2,
      responseFormat: 'json_object',
    });

    const parsed = JSON.parse(resp.text);
    if (['semantic_duplicate', 'complementary_card', 'related_existing_card', 'new_card'].includes(parsed.status)) {
      return parsed.status;
    }
  } catch {}
  return null;
}

export async function checkDuplicate(
  card: CardMeta,
): Promise<DedupResult> {
  const { question, answer, canonicalConcept, learningObjective, atomicFacts, searchKeywords, tags } = card;
  const qNorm = normalize(question);

  // ═══════ Phase 1: Exact match ═══════
  const exactCandidates = await prisma.card.findMany({
    where: { question: { contains: qNorm.slice(0, 40) } },
    select: { id: true, question: true },
    take: 5,
  });
  for (const c of exactCandidates) {
    if (normalize(c.question || '') === qNorm || normalize(c.question || '').slice(0, 60) === qNorm.slice(0, 60)) {
      return { status: 'exact_duplicate', matchedCardIds: [c.id], reason: 'Exact question match' };
    }
  }

  // ═══════ Phase 2: Concept + Objective dedup ═══════
  if (canonicalConcept && learningObjective) {
    const conceptLower = canonicalConcept.toLowerCase();
    const conceptCards = await prisma.card.findMany({
      where: {
        OR: [
          { searchKeywords: { contains: conceptLower } },
          { tags: { contains: conceptLower } },
          { question: { contains: conceptLower } },
        ],
      },
      select: { id: true, question: true, searchKeywords: true, tags: true, answer: true },
      take: 20,
    });

    // Check existing cards for same concept + objective via keyword/tag overlap
    const sameConceptCards = conceptCards.filter(c => {
      const kw = (c.searchKeywords || '').toLowerCase();
      const tg = (c.tags || '').toLowerCase();
      return kw.includes(conceptLower) || tg.includes(conceptLower) || normalize(c.question || '').includes(conceptLower);
    });

    if (sameConceptCards.length > 0) {
      const objTags = learningObjective.toLowerCase();
      const sameObjectiveCards = sameConceptCards.filter(c => {
        const kw = (c.searchKeywords || '').toLowerCase();
        const tg = (c.tags || '').toLowerCase();
        return kw.includes(objTags) || tg.includes(objTags);
      });

      if (sameObjectiveCards.length > 0) {
        // Same concept + same objective → check atomicFacts overlap
        if (atomicFacts && atomicFacts.length > 0) {
          const highOverlap = sameObjectiveCards.some(c => {
            const qOverlap = tokenOverlap(qNorm, normalize(c.question || ''));
            return qOverlap > 0.5;
          });
          if (highOverlap) {
            // Try LLM judge for final decision
            const llmStatus = await llmJudge(card, { ...card, cardId: sameObjectiveCards[0].id, question, answer });
            if (llmStatus === 'semantic_duplicate') {
              return {
                status: 'semantic_duplicate',
                matchedCardIds: [sameObjectiveCards[0].id],
                reason: `Same concept "${canonicalConcept}" + same objective "${learningObjective}" — atomic facts overlap`,
              };
            }
            return {
              status: 'semantic_duplicate',
              matchedCardIds: sameObjectiveCards.slice(0, 3).map(c => c.id),
              reason: `Highly overlapping cards for concept "${canonicalConcept}" objective "${learningObjective}"`,
            };
          }
        }

        // No atomicFacts overlap → complementary or related
        return {
          status: 'complementary_card',
          matchedCardIds: sameObjectiveCards.slice(0, 3).map(c => c.id),
          reason: `Same concept "${canonicalConcept}" existing cards share objective, likely complementary`,
        };
      }

      // Same concept, different objective → complementary
      return {
        status: 'complementary_card',
        matchedCardIds: sameConceptCards.slice(0, 3).map(c => c.id),
        reason: `Same concept "${canonicalConcept}" but different learning objective`,
      };
    }
  }

  // ═══════ Phase 3: Token + tag overlap (fallback) ═══════
  const qTerms = qNorm.split(/\s+/).filter(t => t.length > 2);
  const matchSet = new Set<string>();

  if (qTerms.length > 0) {
    const likeResults = await Promise.all(
      qTerms.slice(0, 5).map(term =>
        prisma.card.findMany({ where: { question: { contains: term } }, select: { id: true }, take: 5 })
      )
    );
    for (const r of likeResults) r.forEach(c => matchSet.add(c.id));
  }

  if (tags && tags.length > 0) {
    const tagResults = await Promise.all(
      tags.slice(0, 5).map(tag =>
        prisma.card.findMany({ where: { tags: { contains: tag } }, select: { id: true }, take: 5 })
      )
    );
    for (const r of tagResults) r.forEach(c => matchSet.add(c.id));
  }

  const uniqueMatches = [...matchSet];

  if (uniqueMatches.length >= 3) {
    return {
      status: 'related_existing_card',
      matchedCardIds: uniqueMatches.slice(0, 5),
      reason: `${uniqueMatches.length} related cards by tag/token overlap`,
    };
  }

  if (uniqueMatches.length > 0) {
    return {
      status: 'related_existing_card',
      matchedCardIds: uniqueMatches.slice(0, 3),
      reason: `${uniqueMatches.length} loosely related cards`,
    };
  }

  return { status: 'new_card', matchedCardIds: [], reason: 'No significant overlap' };
}

// Intra-document dedup: group drafts by canonicalConcept + learningObjective
export function intraDocumentDedup(drafts: { canonicalConcept?: string | null; learningObjective?: string | null; atomicFacts?: string[]; id?: string }[]): Map<string, string> {
  const groupMap = new Map<string, { drafts: typeof drafts; groupId: string }>();
  const result = new Map<string, string>(); // draftId → groupId

  for (const d of drafts) {
    const key = `${d.canonicalConcept || ''}|${d.learningObjective || ''}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, { drafts: [], groupId: `dup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` });
    }
    groupMap.get(key)!.drafts.push(d);
  }

  for (const [, group] of groupMap) {
    if (group.drafts.length <= 1) continue;

    // Within group, check atomicFacts overlap
    for (let i = 0; i < group.drafts.length; i++) {
      for (let j = i + 1; j < group.drafts.length; j++) {
        const a = group.drafts[i];
        const b = group.drafts[j];
        if (a.atomicFacts && b.atomicFacts && arrayOverlap(a.atomicFacts, b.atomicFacts) > 0.6) {
          result.set(a.id || '', group.groupId);
          result.set(b.id || '', group.groupId);
        }
      }
    }
  }

  return result;
}
