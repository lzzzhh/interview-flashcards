// Plan Rule Validator — synchronous code rules, no LLM call
// Checks cardId existence, coverage gaps, source confusion

import prisma from '../../../db/prisma';
import type { RoleProfile } from '../role-profiles';

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
    if (coverage < 0.5) {
      errors.push({
        code: 'COVERAGE_GAP',
        message: `Must-cover skills covered: ${covered}/${context.profile.mustCoverInPlan.length} (${Math.round(coverage*100)}%). Missing: ${missing.join(', ')}`,
        severity: 'error',
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
        message: `${overweightCount} avoid-overweight topics appear in plan. Reduce focus on: ${context.profile.avoidOverweight.filter(t => planText.includes(t.toLowerCase())).join(', ')}`,
        severity: 'warning',
      });
      repair.push('Reduce or remove avoid-overweight topics from plan stages.');
    }
  }

  // 5. JD/checklist confusion: reason says "JD" but no JD requirement matches
  if (context.jdReqText) {
    const jdSkills = new Set(
      context.jdReqText.match(/\[JD\]\s*\w+:\s*([^\n(]+)/g)
        ?.map(m => m.replace(/\[JD\]\s*\w+:\s*/, '').trim().toLowerCase()) || []
    );
    for (const reason of allReasons.match(/JD[要需]求|JD mentions|JD requires/gi) || []) {
      // Check if reason references a skill not in JD
      const claimedSkill = allReasons.split(reason)[1]?.slice(0, 30)?.toLowerCase() || '';
      if (claimedSkill && jdSkills.size > 0 && ![...jdSkills].some(s => claimedSkill.includes(s))) {
        errors.push({
          code: 'SOURCE_CONFUSION',
          message: `Card reason claims JD requirement but no matching JD requirement found: "${reason.slice(0, 60)}"`,
          severity: 'error',
        });
      }
    }
  }

  // 6. RAG source references
  if (context.ragEvidence && allReasons) {
    const ragSources = context.ragEvidence.match(/\[(\w+:\w+)\]/g)?.map(m => m.slice(1, -1)) || [];
    const ragSourceSet = new Set(ragSources);
    const referencedSources = allReasons.match(/\[(\w+:\w+)\]/g)?.map(m => m.slice(1, -1)) || [];
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
