import { readFile } from 'fs/promises';
import type { ParsedBlock } from './types';

function classifyBlock(text: string): ParsedBlock['type'] {
  const t = text.trim();
  if (!t) return 'paragraph';
  if (t.length < 80 && /^[A-Z][A-Za-z\s]{2,50}$/.test(t)) return 'heading';
  if (/^#{1,6}\s/.test(t)) return 'heading';
  if (/^[-*+]\s/.test(t) || /^\d+[.)]\s/.test(t)) return 'list';
  if (/\|.+\|/.test(t)) return 'table';
  if (/(?:公式|equation|formula|sum|int_|displaystyle)/i.test(t)) return 'formula';
  if (t.length < 120 && /^(fig|图|table|表)/i.test(t)) return 'caption';
  return 'paragraph';
}

export async function parsePdfTextLayer(
  pdfPath: string,
  documentId: string,
): Promise<{ markdown: string; blocks: ParsedBlock[] }> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  const dataBuffer = await readFile(pdfPath);
  const doc = await pdfjsLib.getDocument({ data: dataBuffer.buffer }).promise;
  const blocks: ParsedBlock[] = [];
  const mdLines: string[] = [];
  let blockIndex = 0;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items = tc.items as any[];

    let currentBlock = '';
    let prevY = -1;

    for (const item of items) {
      const text = (item.str || '').trim();
      if (!text) continue;

      const y = Math.round(item.transform?.[5] || 0);
      const isNewLine = prevY >= 0 && Math.abs(y - prevY) > 8;

      if (isNewLine && currentBlock) {
        const type = classifyBlock(currentBlock);
        blocks.push({
          id: `${documentId}_b${blockIndex++}`,
          documentId,
          pageNumber: p,
          type,
          text: currentBlock.trim(),
          source: 'pdf_text',
          confidence: 1.0,
          orderIndex: blocks.length,
        });
        if (type === 'heading') mdLines.push(`\n## ${currentBlock.trim()}\n`);
        else mdLines.push(currentBlock.trim());
        currentBlock = '';
      }

      currentBlock += (currentBlock ? ' ' : '') + text;
      prevY = y;
    }

    if (currentBlock.trim()) {
      const type = classifyBlock(currentBlock);
      blocks.push({
        id: `${documentId}_b${blockIndex++}`,
        documentId,
        pageNumber: p,
        type,
        text: currentBlock.trim(),
        source: 'pdf_text',
        confidence: 1.0,
        orderIndex: blocks.length,
      });
      mdLines.push(currentBlock.trim());
    }

    mdLines.push(`\n--- page ${p} ---\n`);
  }

  return { markdown: mdLines.join('\n\n'), blocks };
}
