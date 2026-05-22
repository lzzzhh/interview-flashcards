// src/utils/learningPlans.ts — 学习清单持久化
// Only stores cardId+deckId to avoid localStorage QuotaExceededError.
// Full card details are looked up from AppContext at render time.

export interface LearningPlanItem {
  cardId: string;
  deckId: string;
}

export interface LearningPlan {
  id: string;
  title: string;
  query: string;
  items: LearningPlanItem[];
  createdAt: number;
}

const STORAGE_KEY = 'fc-learning-plans';

export function loadPlans(): LearningPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function savePlan(plan: LearningPlan): void {
  try {
    const plans = loadPlans();
    plans.unshift(plan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error('Failed to save learning plan:', e);
  }
}

export function deletePlan(id: string): void {
  const plans = loadPlans().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function getPlan(id: string): LearningPlan | undefined {
  return loadPlans().find(p => p.id === id);
}
