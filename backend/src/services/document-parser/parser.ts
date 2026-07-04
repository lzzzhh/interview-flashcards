import type { ParsedDocument } from './types';
import { parsePdfTextLayer } from './pdf-parser';
import { parseMarkdown } from './md-parser';
import { parseTxt } from './txt-parser';
import { readFile } from 'fs/promises';
import { parseDocument as parseWithWorker } from '../document/parser-gateway';

export async function parseFile(
  filePath: string,
  filename: string,
  fileType: 'pdf' | 'markdown' | 'txt' | 'docx',
  documentId: string,
): Promise<ParsedDocument> {
  switch (fileType) {
    case 'pdf': {
      const result = await parsePdfTextLayer(filePath, documentId);
      return { id: documentId, filename, fileType, ...result };
    }
    case 'markdown': {
      const content = await readFile(filePath, 'utf-8');
      const result = parseMarkdown(content, documentId);
      return { id: documentId, filename, fileType, ...result };
    }
    case 'txt': {
      const content = await readFile(filePath, 'utf-8');
      const result = parseTxt(content, documentId);
      return { id: documentId, filename, fileType, ...result };
    }
    case 'docx': {
      const parsed = await parseWithWorker({ filePath, fileType: 'docx' });
      const result = parseTxt(parsed.fullText, documentId);
      return {
        id: documentId,
        filename,
        fileType,
        markdown: result.markdown,
        blocks: result.blocks.map(block => ({ ...block, source: 'docx' })),
      };
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
