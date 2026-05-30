import type { ParsedDocument } from './types';
import { parsePdfTextLayer } from './pdf-parser';
import { parseMarkdown } from './md-parser';
import { parseTxt } from './txt-parser';
import { readFile } from 'fs/promises';

export async function parseFile(
  filePath: string,
  filename: string,
  fileType: 'pdf' | 'markdown' | 'txt',
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
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
