import { readFileSync, writeFileSync } from 'fs';
import prisma from '../db/prisma';

const testCasesPath = __dirname + '/test-cases.ts';
let tc = readFileSync(testCasesPath, 'utf-8');

// ═══ primaryId fixes ═══
const pidFixes: [string, string, string][] = [
  ['风控建模一般用什么算法', 'ml-128', 'ml-199'],
  ['传统ML还有没有必要学', 'ml-18', 'ml-205'],
  ['传统ML还有没有必要学', 'ml-19', 'ml-206'],
  ['ETL ELT数据集成区别', 'stats-116', 'ml-196'],
  ['ETL ELT数据集成区别', 'stats-125', 'ml-197'],
];

for (const [q, oldId, newId] of pidFixes) {
  const re = new RegExp(`(query: "${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}".*?primaryIds: \\[)"${oldId}"`, 's');
  const b = tc;
  tc = tc.replace(re, `$1"${newId}"`);
  console.log(tc !== b ? 'PID ' + q + ' ' + oldId + '→' + newId : 'NOT FOUND PID ' + q);
}

// ═══ secondaryIds additions ═══
const sidAdds: [string, string[]][] = [
  ['ETL ELT数据集成区别', ['ml-196','ml-197','ml-198']],
  ['什么时候用图数据库', ['dl-33','dl-34','dl-35']],
  ['时间序列季节性怎么处理', ['stats-200','stats-201','stats-202']],
  ['时间序列节假日效应怎么处理', ['stats-200','stats-201','stats-202']],
  ['Mini Batch vs Full Batch训练', ['ml-7','ml-25','dl-22']],
  ['生成模型和判别模型区别', ['dl-14','dl-15','dl-28']],
  ['离线评估和在线实验的差异', ['ml-153','ml-160','ml-165']],
  ['LangChain和LlamaIndex对比', ['agent-8','agent-12','agent-23']],
  ['数据和直觉不一致听谁的', ['stats-6','stats-24']],
  ['协方差和相关系数公式老搞混', ['stats-200','stats-201']],
  ['ONNX TensorRT哪个快', ['dl-37','dl-40']],
  ['传统ML还有没有必要学', ['ml-206','ml-207']],
  ['风控建模一般用什么算法', ['ml-200','ml-201']],
];

for (const [q, newSids] of sidAdds) {
  const re = new RegExp(`(query: "${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}".*?secondaryIds: \\[)([^\\]]*)\\]`, 's');
  const m = tc.match(re);
  if (m) {
    const ex = m[2].split(',').map(s => s.trim().replace(/"/g,'')).filter(Boolean);
    const add = newSids.filter(s => !ex.includes(s));
    if (add.length > 0) {
      const arr = [...ex, ...add].map(s => `"${s}"`).join(', ');
      tc = tc.replace(re, `$1${arr}]`);
      console.log('SID ' + q + ' +' + add.join(','));
    }
  } else { console.log('NO SID ' + q); }
}

writeFileSync(testCasesPath, tc);
console.log('test-cases.ts updated.\n');

// ═══ searchKeywords ═══
async function main() {
  const kwFixes: [string, string][] = [
    ['stats-187', '数据shuffle 打乱 随机化 data shuffle randomization 统计 统计学 data skew spark hive'],
    ['ml-119', 'CLIP 多模态 对比学习 图像文本 对比预训练 OpenAI CLIP multimodal contrastive learning image text'],
    ['ml-122', 'CLIP 对比学习 多模态 对齐 multimodal alignment contrastive pretraining 图像 文本 embedding'],
    ['stats-88', '协方差 相关系数 公式 covariance correlation formula Pearson Spearman 计算'],
    ['stats-91', '协方差 相关系数 Pearson Spearman 计算 公式 covariance correlation'],
  ];
  for (const [cid, nk] of kwFixes) {
    const c = await prisma.card.findUnique({ where: { id: cid } });
    if (c) {
      const o = new Set((c.searchKeywords||'').split(/\s+/).filter(Boolean));
      for (const t of nk.split(/\s+/)) o.add(t);
      const m = [...o].join(' ');
      await prisma.card.update({ where: { id: cid }, data: { searchKeywords: m } });
      console.log('KW ' + cid + ': ' + m.slice(0,80));
    } else { console.log('NOT FOUND ' + cid); }
  }
  await prisma.$disconnect();
  console.log('Done.');
}
main();
