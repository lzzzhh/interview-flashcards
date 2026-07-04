export type JobPrepIntent =
  | 'provide_jd' | 'confirm_jd' | 'search_jd_again'
  | 'revise_plan' | 'shorten_plan' | 'strengthen_skill' | 'reduce_topic'
  | 'replace_cards' | 'explain_plan' | 'regenerate_plan'
  | 'start_learning' | 'general_question';

export interface JobPrepIntentResult {
  intent: JobPrepIntent;
  confidence: number;
  reason: string;
}

export function isJobDescriptionText(content: string) {
  const c = content.trim();
  return c.length > 80 && (
    c.includes('岗位') || c.includes('职位描述') || c.includes('职位要求') ||
    c.includes('职责') || c.includes('要求') || c.includes('任职') || c.includes('负责') ||
    /responsibilities|requirements|job description/i.test(c)
  );
}

export function classifyJobPrepIntent(content: string, hasPlan: boolean): JobPrepIntentResult {
  const c = content.toLowerCase();
  const ch = content;

  if (isJobDescriptionText(ch)) {
    return { intent: 'provide_jd', confidence: 0.95, reason: 'contains JD-like fields and responsibility/requirement terms' };
  }
  if (ch.includes('搜索') && (ch.includes('JD') || ch.includes('岗位') || ch.includes('公开'))) {
    return { intent: 'search_jd_again', confidence: 0.9, reason: 'asks to search public job postings' };
  }
  if (!hasPlan) {
    return { intent: 'general_question', confidence: 0.55, reason: 'no active plan exists yet' };
  }

  if (/\d+\s*天/.test(c) && (c.includes('只有') || c.includes('缩短') || c.includes('压缩'))) {
    return { intent: 'shorten_plan', confidence: 0.9, reason: 'explicit day limit with compression signal' };
  }
  if (c.includes('为什么') || c.includes('解释') || c.includes('安排') || c.includes('推荐') || c.includes('漏掉') || c.includes('覆盖') || /jd.*要求|明确要求/i.test(c)) {
    return { intent: 'explain_plan', confidence: 0.85, reason: 'asks for rationale, coverage, or attribution' };
  }
  if (c.includes('不要删') || c.includes('别删') || c.includes('保留') || c.includes('补上') || c.includes('漏了') || /(不要|别).{0,8}(一上来|开始|第一|前面|最初)/.test(c)) {
    return { intent: 'revise_plan', confidence: 0.8, reason: 'asks to preserve, supplement, or reorder the current plan' };
  }
  if (c.includes('加强') || c.includes('增加') || c.includes('更多')) {
    return { intent: 'strengthen_skill', confidence: 0.85, reason: 'asks for more coverage of a topic' };
  }
  if (c.includes('减少') || c.includes('去掉') || c.includes('删除') || c.includes('不要')) {
    return { intent: 'reduce_topic', confidence: 0.8, reason: 'asks to reduce or remove a topic' };
  }
  if (c.includes('换') || c.includes('替换') || c.includes('不相关') || c.includes('不想学')) {
    return { intent: 'replace_cards', confidence: 0.8, reason: 'asks to replace cards or irrelevant content' };
  }
  if (c.includes('重新') && (c.includes('生成') || c.includes('计划'))) {
    return { intent: 'regenerate_plan', confidence: 0.85, reason: 'asks to regenerate the plan' };
  }
  if (c.includes('开始') && (c.includes('学习') || c.includes('学'))) {
    return { intent: 'start_learning', confidence: 0.9, reason: 'asks to start learning a plan stage' };
  }

  return { intent: 'general_question', confidence: 0.45, reason: 'no specific job-prep action matched' };
}
