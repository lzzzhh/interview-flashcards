// Plan LLM Guard — cheap Flash model semantic quality check
// Validates: role relevance, unsupported claims, JD/checklist confusion, stage coherence

import { getLLMProvider } from '../../llm-provider';
import type { GuardError, GuardContext } from './plan-rule-validator';

const GUARD_PROMPT = `You are a plan quality inspector. Check the generated study plan against the provided context.
Output a JSON object: { "passed": true/false, "errors": [{"code":"...","message":"...","severity":"error|warning"}] }

Checks:
1. role_relevance — Does this plan match the target job (company + role)?
2. unsupported_claim — Any claims not backed by JD, CHECKLIST, or RAG evidence?
3. jd_checklist_confusion — Are [CHECKLIST] items incorrectly presented as JD requirements?
4. stage_coherence — Are stages ordered from foundational to advanced? Is the progression logical?
5. missing_core_skill — Any must-cover skill clearly missing from all stages?
6. overweight_topic — Are avoid-overweight topics dominating the plan?

[CHECKLIST] items are role-common requirements, NOT from the JD. The plan must not claim they come from the JD.

Return ONLY the JSON object. Do NOT include markdown fences or extra text.`;

export async function llmGuard(
  plan: any,
  context: GuardContext,
): Promise<{ passed: boolean; errors: GuardError[] }> {
  try {
    const provider = getLLMProvider();
    if (!provider) return { passed: true, errors: [] };
    const guardModel = process.env.LLM_GUARD_MODEL || provider.defaultModel;

    const planSummary = JSON.stringify({
      title: plan?.title,
      stages: plan?.stages?.map((s: any) => ({
        name: s.name,
        goal: s.goal,
        cardCount: (s.cards || []).length,
        sampleReasons: (s.cards || []).slice(0, 2).map((c: any) => c.reason),
      })),
    }).slice(0, 3000);

    const guardInput = [
      `Target: ${context.roleFamily || 'unknown'} role`,
      `JD Requirements:\n${context.jdReqText.slice(0, 500)}`,
      context.profile?.mustCoverInPlan ? `\nMust Cover: ${context.profile.mustCoverInPlan.join(', ')}` : '',
      context.profile?.avoidOverweight ? `\nAvoid Overweight: ${context.profile.avoidOverweight.join(', ')}` : '',
      `\nPlan Summary:\n${planSummary}`,
    ].join('\n');

    const resp = await provider.chat({
      model: guardModel,
      messages: [
        { role: 'system', content: GUARD_PROMPT },
        { role: 'user', content: guardInput },
      ],
      temperature: 0,
      maxTokens: 1024,
    });

    const text = resp.text.trim();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch {} }
    }

    if (parsed?.passed !== undefined) {
      return {
        passed: !!parsed.passed,
        errors: (parsed.errors || []).map((e: any) => ({
          code: e.code || 'guard_unknown',
          message: e.message || 'Unknown guard error',
          severity: e.severity === 'warning' ? 'warning' : 'error',
        })),
      };
    }
    return { passed: true, errors: [] };
  } catch (e: any) {
    console.warn(`[llm-guard] Guard failed: ${e.message}`);
    return { passed: true, errors: [] };
  }
}
