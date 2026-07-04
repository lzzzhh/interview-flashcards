import { FastifyInstance } from 'fastify';
import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import prisma from '../db/prisma';
import {
  chunkDocument,
  extractConceptsFromDocument,
  generateDraftsFromDocument,
  isPipelineCancelledError,
  parseDocument,
  setProgress,
  uploadDocument,
} from '../services/document-pipeline';
import { handleJobPrepMessage } from '../services/job-prep/job-prep-conversation';
import { tailorResumeDocumentForJobPrep } from '../services/job-prep/resume-tailoring-skill';
import { parseDocument as parseWithWorker } from '../services/document/parser-gateway';

type AgentIntent = 'make_flashcards' | 'job_prep' | 'resume_tailoring' | 'ask_for_clarification';
type AgentSession = { id: string; jobPrepSessionId?: string };

const sessions = new Map<string, AgentSession>();
const UPLOAD_DIR = join(process.cwd(), 'data', 'agent-uploads');
const RESUME_ARTIFACT_DIR = join(process.cwd(), 'data', 'job-prep-resumes');
mkdirSync(UPLOAD_DIR, { recursive: true });
mkdirSync(RESUME_ARTIFACT_DIR, { recursive: true });

function extToType(path: string): 'pdf' | 'docx' | 'markdown' | 'txt' | null {
  const lower = path.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  if (lower.endsWith('.txt')) return 'txt';
  return null;
}

function filenameFromPath(path: string) {
  return path.split('/').pop() || 'document';
}

function classifyAgentIntent(message: string, filePath?: string): { intent: AgentIntent; reason: string } {
  const text = message.toLowerCase();
  const filename = (filePath ? filenameFromPath(filePath) : '').toLowerCase();
  const combined = `${text}\n${filename}`;

  if (/简历|resume|cv|改简历|优化简历|润色简历/.test(combined)) {
    return { intent: 'resume_tailoring', reason: 'contains resume-tailoring signal' };
  }
  if (/制卡|生成卡片|做卡片|flashcard|资料|课件|lecture|week|notes|笔记/.test(combined)) {
    return { intent: 'make_flashcards', reason: 'contains document-to-card signal' };
  }
  if (/岗位|备战|面试|jd|job description|职位|任职|职责|requirements/.test(combined)) {
    return { intent: 'job_prep', reason: 'contains job-prep or JD signal' };
  }
  if (filePath) {
    return { intent: filename.includes('resume') || filename.includes('cv') ? 'resume_tailoring' : 'make_flashcards', reason: 'default file routing' };
  }
  return { intent: 'ask_for_clarification', reason: 'no strong intent signal' };
}

async function copyLocalFile(filePath: string, id: string, ext: string) {
  if (!existsSync(filePath)) throw new Error('Selected file does not exist');
  const savePath = join(UPLOAD_DIR, `${id}${ext}`);
  await pipeline(createReadStream(filePath), createWriteStream(savePath));
  return savePath;
}

async function runCardPipeline(documentId: string, targetDeckId?: string) {
  try {
    await parseDocument(documentId);
    await chunkDocument(documentId);
    await extractConceptsFromDocument(documentId);
    await generateDraftsFromDocument(documentId);
    if (targetDeckId) {
      await prisma.cardDraft.updateMany({ where: { documentId }, data: { deckId: targetDeckId } });
    }
  } catch (e: any) {
    if (isPipelineCancelledError(e)) {
      setProgress(documentId, 'cancelled', 0, 5, '已取消');
      await prisma.documentSource.update({ where: { id: documentId }, data: { status: 'failed', parseError: '已取消' } }).catch(() => {});
      return;
    }
    const message = e?.message || String(e);
    setProgress(documentId, 'failed', 0, 5, `错误: ${message}`);
    await prisma.documentSource.update({ where: { id: documentId }, data: { status: 'failed', parseError: message } }).catch(() => {});
  }
}

async function ensureJobPrepSession(agentSession: AgentSession, seed: string) {
  if (agentSession.jobPrepSessionId) return agentSession.jobPrepSessionId;
  const jobSession = await prisma.jobPrepSession.create({
    data: {
      role: seed.slice(0, 60) || 'unknown',
      roleFamily: null,
      status: 'collecting',
    },
  });
  agentSession.jobPrepSessionId = jobSession.id;
  return jobSession.id;
}

export async function agentRoutes(app: FastifyInstance) {
  app.post('/api/agent/sessions', async () => {
    const id = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessions.set(id, { id });
    return { sessionId: id };
  });

  app.post('/api/agent/sessions/:sessionId/messages', async (req, reply) => {
    const { sessionId } = req.params as any;
    const body = req.body as any || {};
    const message = String(body.message || '').trim();
    const filePath = typeof body.filePath === 'string' ? body.filePath.trim() : '';
    const targetDeckId = typeof body.targetDeckId === 'string' ? body.targetDeckId : undefined;
    const session = sessions.get(sessionId) || { id: sessionId };
    sessions.set(sessionId, session);

    const routed = classifyAgentIntent(message, filePath);
    try {
      if (routed.intent === 'make_flashcards') {
        if (!filePath) {
          return { assistantMessage: '可以，我来异步制卡。请先选择或上传一份 PDF、DOCX、TXT 或 Markdown 资料。', intent: routed.intent };
        }
        const fileType = extToType(filePath);
        if (!fileType || !['pdf', 'docx', 'markdown', 'txt'].includes(fileType)) {
          return reply.status(400).send({ error: '资料制卡支持 PDF、DOCX、TXT、MD' });
        }
        const ext = fileType === 'markdown' ? '.md' : `.${fileType}`;
        const documentId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const savePath = await copyLocalFile(filePath, documentId, ext);
        const size = statSync(savePath).size;
        const filename = filenameFromPath(filePath);
        await uploadDocument(documentId, filename, fileType, size, savePath);
        Promise.resolve().then(() => runCardPipeline(documentId, targetDeckId));
        return {
          intent: routed.intent,
          actionType: 'background_task_started',
          taskId: documentId,
          documentId,
          filename,
          assistantMessage: `我已开始异步制卡：${filename}。你可以继续做别的事，完成后到草稿区审核。`,
        };
      }

      if (routed.intent === 'job_prep') {
        const content = filePath ? (await parseWithWorker({ filePath, fileType: extToType(filePath) || undefined })).fullText : message;
        const jobPrepSessionId = await ensureJobPrepSession(session, message || content);
        const result = await handleJobPrepMessage(jobPrepSessionId, content || message);
        return {
          intent: routed.intent,
          actionType: result.data?.planId ? 'plan_created' : 'job_prep_turn',
          jobPrepSessionId,
          ...result,
        };
      }

      if (routed.intent === 'resume_tailoring') {
        if (!filePath) {
          return { intent: routed.intent, assistantMessage: '可以优化简历。请上传或选择 PDF/DOCX 简历，并尽量同时提供 JD。' };
        }
        const fileType = extToType(filePath);
        if (fileType !== 'pdf' && fileType !== 'docx') {
          return reply.status(400).send({ error: '简历优化只支持 PDF/DOCX' });
        }
        const jobPrepSessionId = await ensureJobPrepSession(session, message || '简历优化');
        if (message) await handleJobPrepMessage(jobPrepSessionId, message).catch(() => null);
        const artifactId = `resume_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const outputDir = join(RESUME_ARTIFACT_DIR, jobPrepSessionId, artifactId);
        mkdirSync(outputDir, { recursive: true });
        const result = await tailorResumeDocumentForJobPrep({
          sessionId: jobPrepSessionId,
          sourcePath: filePath,
          sourceType: fileType,
          outputDir,
          artifactId,
          jdText: message,
        });
        return {
          intent: routed.intent,
          actionType: 'resume_tailored',
          jobPrepSessionId,
          assistantMessage: result.summary || '已根据 JD 对简历做小幅优化，并生成 Word/PDF。',
          data: result,
        };
      }

      return {
        intent: routed.intent,
        assistantMessage: '你想让我做哪件事？可以说“把这份资料制卡”、“根据这个 JD 做岗位备战”，或者“按 JD 优化这份简历”。',
      };
    } catch (e: any) {
      app.log.error(e, '[agent] message failed');
      return reply.status(500).send({ error: e?.message || 'agent failed' });
    }
  });
}
