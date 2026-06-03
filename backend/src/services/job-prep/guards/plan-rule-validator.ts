// Plan Rule Validator — synchronous code rules, no LLM call
// Checks cardId existence, coverage gaps, source confusion

import prisma from '../../../db/prisma';
import type { RoleProfile } from '../role-profiles/types';

export interface GuardError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface GuardContext {
  hasCards: boolean;
  roleFamily?: string;
  profile?: RoleProfile;
  jdReqText: string;
  ragEvidence: string;
}

export function ruleValidate(
  plan: any,
  context: GuardContext,
): { passed: boolean; errors: GuardError[]; repairInstructions: string[] } {
  const errors: GuardError[] = [];
  const repair: string[] = [];

  if (!plan) {
    errors.push({ code: 'NO_PLAN', message: 'Plan is null or undefined', severity: 'error' });
    return { passed: false, errors, repairInstructions: ['Regenerate plan from scratch.'] };
  }

  const stages = plan.stages || [];
  const allCards = stages.flatMap((s: any) => s.cards || []);
  const allReasons = allCards.map((c: any) => c.reason || '').join(' ');

  // 1. Validate all cardIds exist in DB (batch query)
  const cardIds = allCards.map((c: any) => c.cardId).filter(Boolean);
  if (cardIds.length > 0) {
    // This is async — caller must batch-validate
    // Store cardIds for async validation
    (plan as any)._cardIdsToValidate = cardIds;
  }

  // 2. Cards must be empty if no cards available
  if (!context.hasCards && allCards.length > 0) {
    errors.push({
      code: 'EMPTY_FILL',
      message: `Plan has ${allCards.length} cards but no cards available in database.`,
      severity: 'error',
    });
    repair.push('Set all stages[].cards to empty arrays []. Use topic field instead.');
  }
  if (context.hasCards && allCards.length === 0) {
    errors.push({
      code: 'MISSING_AVAILABLE_CARDS',
      message: 'Cards are available in the database, but the plan did not include any cardId.',
      severity: 'error',
    });
    repair.push('Use cardId values from the provided available cards list.');
  }

  // 3. MustCoverInPlan coverage
  if (context.profile?.mustCoverInPlan) {
    const planText = JSON.stringify(plan).toLowerCase();
    let covered = 0;
    const missing: string[] = [];
    for (const skill of context.profile.mustCoverInPlan) {
      if (planText.includes(skill.toLowerCase())) { covered++; }
      else { missing.push(skill); }
    }
    const coverage = covered / context.profile.mustCoverInPlan.length;
    // Topic-based plans (no cards): relax threshold to 30%
    const minCoverage = context.hasCards ? 0.5 : 0.3;
    if (coverage < minCoverage) {
      errors.push({
        code: 'COVERAGE_GAP',
        message: `Must-cover skills covered: ${covered}/${context.profile.mustCoverInPlan.length} (${Math.round(coverage*100)}%). Missing: ${missing.join(', ')}`,
        severity: context.hasCards ? 'error' : 'warning',
      });
      repair.push(`Add stages covering: ${missing.join(', ')}`);
    }
  }

  // 4. AvoidOverweight check
  if (context.profile?.avoidOverweight) {
    const planText = JSON.stringify(plan).toLowerCase();
    let overweightCount = 0;
    for (const topic of context.profile.avoidOverweight) {
      if (planText.includes(topic.toLowerCase())) overweightCount++;
    }
    if (overweightCount > 2) {
      errors.push({
        code: 'OVERWEIGHT',
        message: `${overweightCount} avoid-overweight topics appear in plan. Reduce focus on: ${context.profile.avoidOverweight.filter((t: string) => planText.includes(t.toLowerCase())).join(', ')}`,
        severity: 'warning',
      });
      repair.push('Reduce or remove avoid-overweight topics from plan stages.');
    }
  }

  // 5. JD/checklist confusion — simplified: if plan says "JD要求" but no jdReqText exists
  if (context.jdReqText && allReasons) {
    const jdSkills = new Set(
      context.jdReqText.match(/\[JD\]\s*\w+:\s*([^\n(]+)/g)
        ?.map((m: string) => m.replace(/\[JD\]\s*\w+:\s*/, '').trim().toLowerCase()) || []
    );
    if (jdSkills.size > 0) {
      for (const card of allCards) {
        const reason = (card.reason || '').toLowerCase();
        if ((reason.includes('jd要求') || reason.includes('jd requires') || reason.includes('jd mentions')) && !jdSkills.has(reason)) {
          errors.push({
            code: 'SOURCE_CONFUSION',
            message: `Card "${card.reason?.slice(0,60)}" claims JD source but no matching JD requirement found.`,
            severity: 'warning',
          });
        }
      }
    }
  }

  // 6. RAG source references
  if (context.ragEvidence && allReasons) {
    const ragSources = context.ragEvidence.match(/\[(\w+:\w+)\]/g)?.map((m: string) => m.slice(1, -1)) || [];
    const ragSourceSet = new Set(ragSources);
    const referencedSources = allReasons.match(/\[(\w+:\w+)\]/g)?.map((m: string) => m.slice(1, -1)) || [];
    for (const src of referencedSources) {
      if (!ragSourceSet.has(src)) {
        errors.push({
          code: 'RAG_SOURCE_GONE',
          message: `Plan references sourceId "${src}" not found in RAG Evidence.`,
          severity: 'warning',
        });
      }
    }
  }

  // 7. Stage count sanity
  if (stages.length < 2) {
    errors.push({ code: 'TOO_FEW_STAGES', message: `Plan has only ${stages.length} stage(s). Minimum 2 expected.`, severity: 'warning' });
    repair.push('Add at least one more stage.');
  }
  if (stages.length > 8) {
    errors.push({ code: 'TOO_MANY_STAGES', message: `Plan has ${stages.length} stages. Maximum 8 recommended.`, severity: 'warning' });
  }

  const criticalErrors = errors.filter(e => e.severity === 'error');

  return {
    passed: criticalErrors.length === 0,
    errors,
    repairInstructions: repair,
  };
}

/** Async validation: check cardIds against DB */
export async function validateCardIds(plan: any): Promise<GuardError[]> {
  const cardIds = (plan as any)?._cardIdsToValidate as string[] | undefined;
  if (!cardIds || cardIds.length === 0) return [];

  const existing = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    select: { id: true },
  });
  const existingSet = new Set(existing.map(c => c.id));
  const errors: GuardError[] = [];

  for (const cid of cardIds) {
    if (!existingSet.has(cid)) {
      errors.push({
        code: 'FAKE_CARD_ID',
        message: `cardId "${cid}" does not exist in database.`,
        severity: 'error',
      });
    }
  }

  return errors;
}
