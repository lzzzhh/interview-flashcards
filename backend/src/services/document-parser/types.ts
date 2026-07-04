export type ParsedBlockType = 'heading' | 'paragraph' | 'list' | 'table' | 'formula' | 'image_text' | 'ocr' | 'code' | 'caption';

export type ParsedBlockSource = 'pdf_text' | 'ocr' | 'table_parser' | 'formula_parser' | 'markdown' | 'txt' | 'docx';

export interface ParsedBlock {
  id: string;
  documentId: string;
  pageNumber?: number;
  sectionPath?: string[];
  type: ParsedBlockType;
  text: string;
  bbox?: { x: number; y: number; width: number; height: number };
  source: ParsedBlockSource;
  confidence?: number;
  orderIndex: number;
}

export interface ParsedDocument {
  id: string;
  filename: string;
  fileType: 'pdf' | 'markdown' | 'txt' | 'docx';
  markdown: string;
  blocks: ParsedBlock[];
  numPages?: number;
}

export interface SourceRef {
  documentId: string;
  filename: string;
  pageNumber?: number;
  blockId?: string;
  bbox?: { x: number; y: number; width: number; height: number };
  quote?: string;
  source: ParsedBlockSource;
  confidence?: number;
}

export const CHUNKING_CONFIG = {
  maxTokens: 1200,
  overlapTokens: 120,
  preferHeadingBoundary: true,
  preferPageBoundary: true,
  keepTablesTogether: true,
  keepFormulasWithExplanation: true,
};

export interface DocumentChunk {
  id: string;
  documentId: string;
  title?: string;
  pageStart?: number;
  pageEnd?: number;
  sectionPath?: string[];
  text: string;
  blockIds: string[];
  tokenCount?: number;
  sourceRefs: SourceRef[];
  orderIndex: number;
}

export type DraftType = 'definition' | 'concept' | 'formula' | 'comparison' | 'application' | 'example' | 'pitfall' | 'procedure';

export type CardDraftStatus = 'draft' | 'needs_review' | 'approved' | 'rejected' | 'duplicate' | 'merged' | 'out_of_scope';

export interface CardDraftData {
  type: DraftType;
  question: string;
  answer: string;
  tags: string[];
  searchKeywords: string[];
  canonicalTopic?: string | null;
  canonicalConcept?: string | null;
  learningObjective?: string | null;
  atomicFacts?: string[];
  answerScope?: string | null;
  confidence: number;
  status: 'draft' | 'needs_review';
  sourceRefs: SourceRef[];
}

export interface ExtractedConceptData {
  documentId?: string;
  conceptName: string;
  definition?: string;
  keyPoints: string[];
  examples?: string[];
  formulas?: string[];
  prerequisites?: string[];
  commonConfusions?: string[];
  candidateTags: string[];
  confidence: number;
  sourceRefs: SourceRef[];
}

export interface GraphMatchResult {
  status: 'matched_graph_node' | 'new_concept_candidate' | 'out_of_scope';
  canonicalTopic?: string;
  graphNodeId?: string;
  score?: number;
  reason?: string;
}
