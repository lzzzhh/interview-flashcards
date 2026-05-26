// Bulk searchKeywords enrichment for recall coverage
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Topic → additional keywords to append
const ENRICH: Record<string, string[]> = {
  RAG: ['retrieval augmented generation','retriever','reranker','chunking','context window','knowledge retrieval','hybrid search','dense retrieval','sparse retrieval','BM25'],
  'Prompt Engineering': ['prompting','few-shot','zero-shot','chain of thought','COT','instruction tuning','system message','role prompt','prompt template','in-context learning'],
  'Function Calling': ['function call','tool calling','API calling','openai functions','langchain agent','plugin','action','execute'],
  'Tool Use': ['tool use','agent tool','function calling','API integration','plugin system','external API'],
  Transformer: ['self-attention','encoder decoder','GPT','BERT','positional encoding','feed forward','residual connection','layer norm','pre-norm','post-norm'],
  Attention: ['multi-head','scaled dot product','QKV','query key value','cross attention','causal attention','masked attention'],
  '滑动窗口': ['sliding window','双指针','窗口','substring','subarray','two pointer','左右指针','对撞指针','快慢指针'],
  '模型部署': ['model deployment','模型上线','MLOps','inference serving','model serving','ONNX','TensorRT','TorchServe','FastAPI','Docker部署'],
  '假设检验': ['null hypothesis','p-value','t-test','z-test','chi-square','ANOVA','F-test','显著性','拒绝域','第一类错误','第二类错误','confidence interval'],
  '最大似然估计': ['maximum likelihood','MLE','likelihood function','log likelihood','EM algorithm','expectation maximization','parameter estimation'],
  'Cross Entropy': ['cross entropy loss','CE loss','log loss','categorical crossentropy','binary crossentropy','softmax loss','NLL','negative log likelihood'],
  'Batch Normalization': ['batchnorm','BN','internal covariate shift','normalization layer','training stability'],
  'JSON Mode': ['structured output','json schema','json output','constrained generation','grammar','guided decoding'],
  '前缀和': ['prefix sum','cumulative sum','difference array','range sum query','subarray sum','prefix array'],
};

async function main() {
  for (const [topic, keywords] of Object.entries(ENRICH)) {
    const cards = await p.card.findMany({
      where: {
        OR: [
          { titleCn: { contains: topic } },
          { title: { contains: topic.toLowerCase() } },
          { searchKeywords: { contains: topic.toLowerCase() } },
        ],
      },
      select: { id: true, searchKeywords: true, titleCn: true },
    });

    for (const card of cards) {
      const existing = new Set((card.searchKeywords || '').toLowerCase().split(/\s+/));
      const toAdd = keywords.filter(k => !existing.has(k.toLowerCase()));
      if (toAdd.length === 0) continue;

      await p.card.update({
        where: { id: card.id },
        data: { searchKeywords: (card.searchKeywords || '') + ' ' + toAdd.join(' ') },
      });
    }
    console.log(`${topic}: ${cards.length} cards enriched (${keywords.length} keywords)`);
  }
  await p.$disconnect();
  console.log('\nDone — rebuild FTS5 index to pick up changes');
}
main();
