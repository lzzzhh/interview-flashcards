import prisma from '../db/prisma';
import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { hybridSearch } from '../services/search/hybrid-search';

const NEW_IDS = new Set(['ml-190','ml-191','ml-192','dl-33','dl-34','dl-35','ml-193','ml-194','ml-195','ml-196','ml-197','ml-198','wp-77','wp-78','wp-79','ml-199','ml-200','ml-201','dl-36','dl-37','dl-38','dl-39','dl-40','dl-41','agent-27','agent-28','agent-29','stats-200','stats-201','stats-202','wp-80','wp-81','wp-82','ml-202','ml-203','ml-204','ml-205','ml-206','ml-207']);

const QUERIES = ['怎么设计数据指标体系','Streaming和Batch数据处理','pandas处理大数据内存溢出','softmax输出为什么和为1','面试官问我怎么评估一个分类模型的好坏','离线评估和在线实验的差异','在线推理离线批处理架构区别','噪声标签怎么训练模型','如何设计一个实验评估'];

async function main() {
  const llm = new OpenAIChatProvider(process.env.LLM_BASE_URL!, process.env.LLM_API_KEY!);
  (llm as any).defaultModel = 'deepseek-chat'; setLLMProvider(llm);
  const ep = new OpenAIEmbeddingProvider(process.env.EMBEDDING_BASE_URL!, process.env.EMBEDDING_API_KEY!);
  (ep as any).defaultModel = 'bge-m3'; setEmbeddingProvider(ep);
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore(); await initFTS5();

  for (const q of QUERIES) {
    const hits = await hybridSearch({ query: q, maxResults: 15, minScore: 0, candidateLimit: 500 });
    const newInTop15 = hits.filter((h: any) => NEW_IDS.has(h.cardId));
    if (newInTop15.length > 0) {
      console.log(q.slice(0, 50) + ':');
      for (const h of newInTop15) {
        const card = await prisma.card.findUnique({ where: { id: h.cardId }, select: { titleCn: true, searchKeywords: true } });
        console.log('  ' + h.cardId + ' rank=' + (hits.indexOf(h) + 1) + ' score=' + (h.score?.toFixed(3) || '?') + ' ' + (card?.titleCn || '').slice(0, 40));
      }
    }
  }
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
