// Job Prep types — shared across workflow, tools, and routes

export type JobPrepStep =
  | 'collect_target'
  | 'ask_for_jd'
  | 'search_public_jd'
  | 'confirm_jd'
  | 'parse_jd'
  | 'extract_requirements'
  | 'graph_expand'
  | 'rag_retrieve'
  | 'build_rag_context'
  | 'generate_plan'
  | 'revise_plan'
  | 'save_plan'
  | 'execute_plan';

export interface JobPrepWorkflowState {
  sessionId: string;
  currentStep: JobPrepStep;

  messages: JobPrepMessageDto[];

  company?: string;
  role: string;
  roleFamily?: string;

  hasJD?: boolean;
  pastedJD?: string;
  jdUrl?: string;

  jdCandidates: JobPostingCandidate[];
  selectedJobPostingId?: string;

  requirements: JobRequirementDto[];
  graphContext?: JobPrepGraphExpansion;
  retrievedChunks: RagSearchResultDto[];
  retrievedCards: JobPrepRetrievedCard[];

  ragContext?: JobPrepRagContext;
  plan?: JobPrepPlanDraft;

  errors: JobPrepWorkflowError[];
}

export interface JobPrepMessageDto {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  toolName?: string;
  toolPayload?: any;
  createdAt: string;
}

export interface JobPostingCandidate {
  id: string;
  sourceType: string;
  sourceUrl?: string;
  company?: string;
  role?: string;
  title?: string;
  rawText: string;
  confidence?: number;
  selected: boolean;
}

export interface JobRequirementDto {
  type: string;
  name: string;
  normalizedName?: string;
  importance: 'must_have' | 'nice_to_have' | 'unknown';
  evidenceText?: string;
}

export interface JobPrepGraphExpansion {
  matchedConcepts: string[];
  expandedConcepts: string[];
  prerequisites: string[];
  relatedModules: string[];
  deckHints: string[];
  graphPaths: string[];
  candidateCardIds: string[];
}

export interface RagSearchResultDto {
  sourceType: string;
  sourceId: string;
  cardId?: string;
  deckId?: string;
  title?: string;
  text: string;
  score: number;
  payload: Record<string, any>;
}

export interface JobPrepRetrievedCard {
  cardId: string;
  deckId: string;
  title: string;
  summary: string;
  matchedReason: string;
  score: number;
}

export interface JobPrepRagContext {
  jobProfile: {
    company?: string;
    role: string;
    roleFamily?: string;
    sourceType: 'pasted_jd' | 'public_jd' | 'fallback';
    coreRequirements: string[];
    skills: string[];
  };
  graphContext: {
    matchedConcepts: string[];
    expandedConcepts: string[];
    prerequisites: string[];
    relatedModules: string[];
    deckHints: string[];
    graphPaths: string[];
  };
  retrievedCards: {
    cardId: string;
    deckId: string;
    title: string;
    summary: string;
    matchedReason: string;
    score: number;
  }[];
  retrievedJdEvidence: {
    sourceId: string;
    text: string;
    skills: string[];
  }[];
  userLearningState: {
    weakDecks: string[];
    dueCards: string[];
    newCards: string[];
    masteredCards: string[];
  };
}

export interface JobPrepPlanDraft {
  title: string;
  summary?: string;
  estimatedDays?: number;
  stages: {
    name: string;
    goal: string;
    estimatedMinutes?: number;
    cards: {
      cardId: string;
      deckId: string;
      reason: string;
      matchedRequirements?: string[];
      matchedConcepts?: string[];
    }[];
  }[];
}

export interface JobPrepWorkflowError {
  step: JobPrepStep;
  message: string;
  timestamp: string;
}
