// src/utils/learningPlans.ts — 学习计划持久化（后端 API）
const API = 'http://localhost:3001/api/learning-plans';

export interface LearningPlanItem {
  cardId: string;
  deckId: string;
  title: string;
  completed?: boolean;
  completedAt?: number;
}

export interface LearningPlan {
  id: string;
  title: string;
  query: string;
  items: LearningPlanItem[];
  studyPlan?: string;
  createdAt: number;
}

export async function loadPlans(): Promise<LearningPlan[]> {
  try {
    const res = await fetch(API);
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((p: any) => ({
      id: p.id,
      title: p.title,
      query: p.query,
      items: p.items || [],
      studyPlan: p.studyPlan || undefined,
      createdAt: new Date(p.createdAt).getTime(),
    }));
  } catch { return []; }
}

export async function savePlan(plan: LearningPlan): Promise<void> {
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: plan.title,
        query: plan.query,
        items: plan.items,
      }),
    });
  } catch (e) { console.error('Failed to save plan:', e); }
}

export async function getPlan(id: string): Promise<LearningPlan | undefined> {
  try {
    const res = await fetch(`${API}/${id}`);
    const data = await res.json();
    if (data.error) return undefined;
    return {
      id: data.id,
      title: data.title,
      query: data.query,
      items: data.items || [],
      studyPlan: data.studyPlan || undefined,
      createdAt: new Date(data.createdAt).getTime(),
    };
  } catch { return undefined; }
}

export async function deletePlan(id: string): Promise<void> {
  try { await fetch(`${API}/${id}`, { method: 'DELETE' }); } catch {}
}

export async function generateStudyPlan(id: string): Promise<string> {
  const res = await fetch(`${API}/${id}/generate`, { method: 'POST' });
  const data = await res.json();
  return data.studyPlan || '';
}
