// Job Prep LLM prompts

export const JD_PARSE_PROMPT = `You are a job description parser. Extract ALL requirements from BOTH the job description AND job requirements sections.

For data science / data analyst roles, you MUST check for these in the text:
- A/B experiment, A/B testing, experiment design
- Causal inference, causal analysis
- Metrics construction, KPI, indicator system
- User behavior analysis, user data analysis
- Recommendation system evaluation, model effect evaluation
- Business growth, opportunity discovery, growth hacking
- Data-driven decision making
- SQL, Python, R, SAS
- Statistics, machine learning, statistical modeling
- Content consumption, short video recommendation (if mentioned)
- Competition ranking, paper publication
- Graduation year requirements (e.g. "2027届")

Output a JSON object with a "requirements" array. Each requirement has:
- type: "skill" | "tool" | "experience" | "domain" | "soft_skill" | "education" | "eligibility" | "bonus"
- name: the requirement as stated in the JD
- normalizedName: normalized version (e.g. "SQL", "A/B Testing", "Causal Inference")
- importance: "must_have" | "nice_to_have"
- evidenceText: exact sentence from the JD

Service description items like "opportunity discovery", "metrics construction", "experiment design" should be extracted as domain/skill types.
Graduation year requirements should be type "eligibility".
Competition/paper requirements should be type "bonus".

Return ONLY the JSON object, no other text.`;

export const PLAN_GENERATE_PROMPT = `You are a study plan generator for technical interview preparation.
Generate a phased study plan based on the job requirements and available cards.

If available cards list is empty or marked as "(no cards available)", generate a TOPIC-BASED plan WITHOUT cardId fields.
In topic-based mode:
- cards array in each stage must be EMPTY: []
- topic fields describe what to study
- goal fields describe what to learn in each stage

If cards are available, include cardId from the actual card list.

Output a JSON object:
{
  "title": "plan title",
  "summary": "1-2 sentence plan summary",
  "estimatedDays": N,
  "stages": [
    {
      "name": "stage name",
      "goal": "what this stage aims to accomplish",
      "estimatedMinutes": N,
      "topic": "what to study (only in topic-based mode)",
      "cards": [
        {
          "cardId": "from available cards (omit if topic-based)",
          "deckId": "card's deck (omit if topic-based)",
          "reason": "why this card is in this stage"
        }
      ]
    }
  ]
}

Rules:
- 3-6 stages total
- Each stage 1-3 topic focuses
- First stage: foundational / prerequisite knowledge
- Middle stages: core job requirements
- Last stage: interview readiness
- If cards available: 3-8 cards per stage from the provided list
- If NO cards: empty cards array, use topic field instead
- Reason must reference specific job requirements

Return ONLY the JSON object.`;

export const PLAN_REVISE_PROMPT = `You are a study plan editor. The user wants to modify their existing plan.
Update the plan based on their feedback while keeping the same JSON structure.

The user's feedback may include:
- Time constraints ("I only have 3 days")
- Skill emphasis ("focus more on SQL")
- Removing topics ("skip algorithms")
- Adding topics ("add system design")

Return the revised plan as a JSON object with the same structure.`;

export const TARGET_PARSE_PROMPT = `Parse the user's job target from their input.
Extract company and role. If ambiguous, make your best guess.

Output JSON: { "company": "...", "role": "...", "roleFamily": "..." }

roleFamily must be one of:
  data-analysis  — SQL/BI/报表/指标体系/A/B测试
  data-science   — AB实验/因果推断/推荐系统/机器学习/用户分析
  algorithm      — 数据结构/算法/动态规划/图论
  machine-learning — 模型训练/特征工程/深度学习/CV/NLP
  llm            — Transformer/RAG/微调/Agent开发/大模型
  llm-application — RAG/Agent搭建/向量数据库/LLM API
  backend        — 系统设计/数据库/分布式/API
  frontend       — React/Vue/CSS/性能优化/工程化
  other          — 以上都不匹配

Return ONLY the JSON object.`;
