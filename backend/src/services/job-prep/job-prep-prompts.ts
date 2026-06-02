// Job Prep LLM prompts

export const JD_PARSE_PROMPT = `You are a job description parser. Extract structured job requirements from the JD text.

Output a JSON object with a "requirements" array. Each requirement has:
- type: "skill" | "tool" | "experience" | "project" | "domain" | "soft_skill" | "education"
- name: the skill/requirement as stated in the JD
- normalizedName: normalized version (e.g. "SQL", "A/B Testing", "Machine Learning")
- importance: "must_have" | "nice_to_have" | "unknown"
- evidenceText: the sentence or phrase from the JD that mentions this requirement

Return ONLY the JSON object, no other text.`;

export const PLAN_GENERATE_PROMPT = `You are a study plan generator for technical interview preparation.
Generate a phased study plan based on the job requirements, retrieved cards, and concept graph.

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
      "cards": [
        {
          "cardId": "from retrieved cards",
          "deckId": "card's deck",
          "reason": "why this card is in this stage"
        }
      ]
    }
  ]
}

Rules:
- 3-5 stages total
- Each stage 3-8 cards
- First stage: foundational / prerequisite knowledge
- Middle stages: core job requirements
- Last stage: interview readiness / project expression
- Prefer cards with higher scores
- Reason must reference specific job requirements or concepts

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

roleFamily should be one of: data-analysis, algorithm, backend, frontend, machine-learning, llm, devops, product, other

Return ONLY the JSON object.`;
