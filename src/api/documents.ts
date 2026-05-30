import { apiGet, apiPost, apiPatch } from './client';

export interface CardDraftDTO {
  id: string;
  documentId: string;
  type: string;
  question: string;
  answer: string;
  tags: string[];
  searchKeywords: string[];
  canonicalTopic?: string;
  canonicalConcept?: string;
  learningObjective?: string;
  atomicFacts?: string[];
  answerScope?: string;
  graphNodeId?: string;
  graphStatus?: string;
  confidence: number;
  status: string;
  duplicateCheck?: { status: string; matchedCardIds?: string[]; reason?: string };
  duplicateGroupId?: string;
  sourceRefs: { documentId: string; pageNumber?: number; blockId?: string; quote: string; source: string; confidence?: number }[];
  reviewNote?: string;
  importedCardId?: string;
  deckId?: string;
  createdAt: string;
  updatedAt: string;
}

export function getDocuments() {
  return apiGet<{ id: string; filename: string; fileType: string; status: string; createdAt: string }[]>('/documents');
}

export function getDocumentDrafts(documentId: string) {
  return apiGet<CardDraftDTO[]>(`/documents/${documentId}/drafts`);
}

export function getDrafts(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return apiGet<CardDraftDTO[]>(`/card-drafts${qs}`);
}

export function patchDraft(id: string, data: Record<string, any>) {
  return apiPatch<CardDraftDTO>(`/card-drafts/${id}`, data);
}

export function batchReview(draftIds: string[], action: string, options?: { deckId?: string; note?: string; edits?: Record<string, any> }) {
  return apiPost<{ results: { id: string; status: string; cardId?: string; error?: string }[] }>('/card-drafts/batch-review', { draftIds, action, ...options });
}

export function importDryRun(draftIds: string[]) {
  return apiPost<{
    totalChecked: number; willCreateCards: number; blockedDrafts: string[];
    unresolvedDuplicates: string[]; missingDeckId: string[]; missingTags: string[];
    missingSearchKeywords: string[]; graphPending: string[];
  }>('/card-drafts/import-dry-run', { draftIds });
}

export function batchImport(draftIds: string[], deckId: string) {
  return apiPost<{ results: { id: string; status: string; cardId?: string; error?: string }[]; imported: number }>('/card-drafts/batch-import', { draftIds, deckId });
}

export function approveDraft(id: string, deckId: string) {
  return apiPost<{ id: string; status: string; cardId: string }>(`/card-drafts/${id}/approve`, { deckId });
}

export function rejectDraft(id: string, note?: string) {
  return apiPost<{ id: string; status: string }>(`/card-drafts/${id}/reject`, { note });
}

export function getDecks() {
  return apiGet<{ id: string; name: string; type: string }[]>('/decks');
}
