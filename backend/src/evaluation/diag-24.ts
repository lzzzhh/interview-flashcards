// Quick diagnostic: Top15/Top50 for 24 failing queries
import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
(function loadEnv() {
  const p = __dirname + '/../../.env';
  try { for (const l of readFileSync(p,'utf-8').split('\n')) { const t=l.trim(); if(!t||t.startsWith('#'))continue; const eq=t.indexOf('='); if(eq<0)continue; if(!process.env[t.slice(0,eq).trim()])process.env[t.slice(0,eq).trim()]=t.slice(eq+1).trim(); }} catch {}
})();

import prisma from '../db/prisma';
import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';

const NEW_IDS = new Set(['ml-190','ml-191','ml-192','dl-33','dl-34','dl-35','ml-193','ml-194','ml-195','ml-196','ml-197','ml-198','wp-77','wp-78','wp-79','ml-199','ml-200','ml-201','dl-36','dl-37','dl-38','dl-39','dl-40','dl-41','agent-27','agent-28','agent-29','stats-200','stats-201','stats-202','wp-80','wp-81','wp-82','ml-202','ml-203','ml-204','ml-205','ml-206','ml-207']);

const QUERIES = [
  '迭代','ML里如何处理缺失值','为什么要shuffle数据','参数太多模型太复杂怎么办',
  '数据太少训练不好怎么办','生成模型和判别模型区别','风控建模一般用什么算法',
  '什么时候用图数据库','数据和直觉不一致听谁的','时间序列季节性怎么处理',
  'CLIP多模态对比学习','Mini Batch vs Full Batch训练','离线评估和在线实验的差异',
  'ONNX TensorRT哪个快','ETL ELT数据集成区别','LangChain和LlamaIndex对比',
  'Chain-of-Thought在GPT4中','few-shot为什么给例子就能学','Momentum为什么能加速收敛',
  '传统ML还有没有必要学','噪声标签怎么训练模型','协方差和相关系数公式老搞混',
  '新功能是否对留存有正向影响','时间序列节假日效应怎么处理',
];

async function main() {
  const llm = new OpenAIChatProvider(process.env.LLM_BASE_URL!, process.env.LLM_API_KEY!);
  (llm as any).defaultModel = 'deepseek-chat'; setLLMProvider(llm);
  const ep = new OpenAIEmbeddingProvider(process.env.EMBEDDING_BASE_URL!, process.env.EMBEDDING_API_KEY!);
  (ep as any).defaultModel = 'bge-m3'; setEmbeddingProvider(ep);
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore(); await initFTS5();

  for (const q of QUERIES) {
    const hits = await hybridSearch({ query: q, maxResults: 20, minScore: 0, candidateLimit: 500 });
    const top5 = hits.slice(0,5).map((h: any) => h.cardId + '(' + (h.score||0).toFixed(2) + ')');
    const newInTop20 = hits.filter((h: any) => NEW_IDS.has(h.cardId));
    
    console.log('── ' + q.slice(0,50) + ' ──');
    console.log('  Top5: ' + top5.join(' '));
    if (newInTop20.length > 0) {
      const ni = newInTop20.map((h: any) => {
        const r = hits.indexOf(h) + 1;
        return h.cardId + '@' + r;
      }).join(' ');
      console.log('  New cards in top20: ' + ni);
    }
    
    // Check target card searchKeywords for blind spot queries
    if (['为什么要shuffle数据','CLIP多模态对比学习','Chain-of-Thought在GPT4中','few-shot为什么给例子就能学','Momentum为什么能加速收敛'].includes(q)) {
      // Find related cards by keyword search
      const keywords = q.includes('shuffle') ? 'shuffle' : q.includes('CLIP') ? 'CLIP' : q.includes('Chain') ? 'Chain-of-Thought' : q.includes('few-shot') ? 'few-shot' : 'Momentum';
      const cards = await prisma.card.findMany({ where: { OR: [{ titleCn: { contains: keywords } }, { title: { contains: keywords } }, { searchKeywords: { contains: keywords } }] }, select: { id: true, titleCn: true, searchKeywords: true }, take: 3 });
      for (const c of cards) {
        console.log('  Card ' + c.id + ': ' + (c.titleCn||'').slice(0,40) + ' kw=' + (c.searchKeywords||'').slice(0,60));
      }
    }
    console.log('');
  }
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
