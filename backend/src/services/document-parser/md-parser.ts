import type { ParsedBlock } from './types';

export function parseMarkdown(content: string, documentId: string): { markdown: string; blocks: ParsedBlock[] } {
  const lines = content.split('\n');
  const blocks: ParsedBlock[] = [];
  let blockIndex = 0;
  let currentSection: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      currentSection = [headingMatch[2].trim()];
      blocks.push({
        id: `${documentId}_b${blockIndex++}`,
        documentId,
        type: 'heading',
        text: line,
        sectionPath: [...currentSection],
        source: 'markdown',
        confidence: 1.0,
        orderIndex: blocks.length,
      });
      continue;
    }

    if (/^```/.test(line)) {
      const codeLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && !/^```/.test(lines[j])) {
        codeLines.push(lines[j]);
        j++;
      }
      if (j < lines.length) codeLines.push(lines[j]);
      blocks.push({
        id: `${documentId}_b${blockIndex++}`,
        documentId,
        type: 'code',
        text: codeLines.join('\n'),
        sectionPath: currentSection.length > 0 ? [...currentSection] : undefined,
        source: 'markdown',
        confidence: 1.0,
        orderIndex: blocks.length,
      });
      i = j;
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    let type: ParsedBlock['type'] = 'paragraph';
    if (/^[-*+]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) type = 'list';
    else if (/\|.+\|/.test(trimmed)) type = 'table';

    blocks.push({
      id: `${documentId}_b${blockIndex++}`,
      documentId,
      type,
      text: trimmed,
      sectionPath: currentSection.length > 0 ? [...currentSection] : undefined,
      source: 'markdown',
      confidence: 1.0,
      orderIndex: blocks.length,
    });
  }

  return { markdown: content, blocks };
}
