import type { ParsedBlock, DocumentChunk, SourceRef, ParsedDocument } from './document-parser/types';

const CHUNKING_CONFIG = {
  maxTokens: 1200,
  preferHeadingBoundary: true,
  preferPageBoundary: true,
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkDocument(doc: ParsedDocument): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let currentBlocks: ParsedBlock[] = [];
  let currentTokens = 0;
  let chunkIndex = 0;
  let currentTitle: string | undefined;
  let currentSection: string[] | undefined;
  let currentPage: number | undefined;

  function makeSourceRef(block: ParsedBlock): SourceRef {
    return {
      documentId: doc.id,
      filename: doc.filename,
      pageNumber: block.pageNumber,
      blockId: block.id,
      bbox: block.bbox,
      quote: block.text.slice(0, 200),
      source: block.source,
      confidence: block.confidence,
    };
  }

  function flush() {
    if (currentBlocks.length === 0) return;
    const text = currentBlocks.map(b => b.text).join('\n\n');
    chunks.push({
      id: `${doc.id}_chunk_${chunkIndex}`,
      documentId: doc.id,
      title: currentTitle,
      pageStart: currentPage,
      pageEnd: currentBlocks[currentBlocks.length - 1]?.pageNumber,
      sectionPath: currentSection,
      text,
      blockIds: currentBlocks.map(b => b.id),
      tokenCount: estimateTokens(text),
      sourceRefs: currentBlocks.map(makeSourceRef),
      orderIndex: chunkIndex,
    });
    chunkIndex++;
    currentBlocks = [];
    currentTokens = 0;
  }

  for (const block of doc.blocks) {
    const blockTokens = estimateTokens(block.text);
    const isHeading = block.type === 'heading';

    if (isHeading) {
      flush();
      currentTitle = block.text.replace(/^#{1,6}\s*/, '').trim();
      currentSection = block.sectionPath;
      currentPage = block.pageNumber;
      currentBlocks.push(block);
      currentTokens = blockTokens;
      continue;
    }

    if (CHUNKING_CONFIG.preferPageBoundary && block.pageNumber && currentPage && block.pageNumber !== currentPage) {
      flush();
      currentPage = block.pageNumber;
    }

    if (currentTokens + blockTokens > CHUNKING_CONFIG.maxTokens && currentBlocks.length > 0) {
      flush();
      currentPage = block.pageNumber;
    }

    currentBlocks.push(block);
    currentTokens += blockTokens;
  }

  flush();
  return chunks;
}
