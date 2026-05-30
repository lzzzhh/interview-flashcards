import type { ParsedBlock } from './types';

export function parseTxt(content: string, documentId: string): { markdown: string; blocks: ParsedBlock[] } {
  const cleaned = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();

  const lines = cleaned.split('\n');
  const blocks: ParsedBlock[] = [];
  const mdLines: string[] = [];
  let blockIndex = 0;
  let currentParagraph: string[] = [];

  function flushParagraph() {
    if (currentParagraph.length === 0) return;
    const text = currentParagraph.join(' ').trim();
    if (!text) { currentParagraph = []; return; }

    let type: ParsedBlock['type'] = 'paragraph';
    const firstLine = currentParagraph[0];
    if (/^[A-Z][^.]{3,50}$/.test(firstLine) || /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(firstLine)) {
      type = 'heading';
      mdLines.push(`\n## ${text}\n`);
    } else {
      mdLines.push(text);
    }

    blocks.push({
      id: `${documentId}_b${blockIndex++}`,
      documentId,
      type,
      text,
      source: 'txt',
      confidence: 0.9,
      orderIndex: blocks.length,
    });
    currentParagraph = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushParagraph(); continue; }
    if (/^[-*+]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) {
      flushParagraph();
      blocks.push({
        id: `${documentId}_b${blockIndex++}`,
        documentId,
        type: 'list',
        text: trimmed,
        source: 'txt',
        confidence: 0.9,
        orderIndex: blocks.length,
      });
      mdLines.push(trimmed);
      continue;
    }
    currentParagraph.push(trimmed);
  }
  flushParagraph();

  return { markdown: mdLines.join('\n\n'), blocks };
}
