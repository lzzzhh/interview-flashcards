// Role Profile — defines the skill/task/concept checklist for a job role family
// Used to supplement JD requirements and ensure coverage of role-common skills

export interface RoleProfile {
  roleFamily: string;
  displayName: string;
  coreSkills: string[];
  tools: string[];
  concepts: string[];
  commonTasks: string[];
  interviewTopics: string[];
  projectSignals: string[];
  niceToHave: string[];
  mustCoverInPlan: string[];
  avoidOverweight: string[];
}
