import { understandQuery } from '../query-understanding';

async function main() {
console.log('=== Intent failures ===');
const iq = ['面试动态规划总答不好，补哪些卡','动态规划我看了几遍还是不懂，先学哪些卡比较好','XGBoost的学习路径是什么','面试Agent总答不好，补哪些卡'];
for (const q of iq) { const p = await understandQuery(q); console.log(q,'→ intent:',p.intent,'topic:',p.topic,'source:',p.source,'tierOwner:',p.tierOwner); }
console.log('\n=== Topic failures (compare) ===');
const tq = ['数组和哈希表有什么区别，应该先学哪个','什么时候用双指针什么时候用哈希表','Bagging和Boosting怎么区分'];
for (const q of tq) { const p = await understandQuery(q); console.log(q,'→ intent:',p.intent,'topic:',p.topic,'source:',p.source,'tierOwner:',p.tierOwner); }
}
main();
