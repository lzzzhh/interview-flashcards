// backend/src/services/document/parser-gateway.ts — Node 端调用 Python Worker

const WORKER_URL = process.env.PARSER_WORKER_URL || 'http://localhost:8000';

export interface ParseRequest {
  filePath: string;
  fileType?: string;
  options?: { enableOcr?: boolean };
}

export interface ParsedDocument {
  fileName: string;
  sourceType: string;
  parser: string;
  fullText: string;
  pages?: { pageNumber?: number; text: string; tables?: any[]; extractionMethod: string }[];
  warnings: string[];
  textHash: string;
}

export async function parseDocument(req: ParseRequest): Promise<ParsedDocument> {
  const res = await fetch(`${WORKER_URL}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_path: req.filePath,
      file_type: req.fileType,
      options: req.options || {},
    }),
    signal: AbortSignal.timeout(300000), // 5 min for large files
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Parser error (${res.status}): ${err}`);
  }
  const data = await res.json() as any;
  return {
    fileName: data.file_name,
    sourceType: data.source_type,
    parser: data.parser,
    fullText: data.full_text,
    pages: data.pages,
    warnings: data.warnings,
    textHash: data.text_hash,
  };
}

export async function checkWorkerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${WORKER_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
