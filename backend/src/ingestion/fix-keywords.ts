import prisma from '../db/prisma';

const fixes: { id: string; newKw: string }[] = [
  { id: 'ml-200', newKw: '风控 欺诈检测 信用评分 KS AUC PR曲线 Precision Recall 模型评估 不平衡' },
  { id: 'ml-204', newKw: 'ML面试 翻车 常见错误 AUC=0.5 过拟合诊断 BatchNorm推理 L1 L2 区别 XGBoost GBDT' },
  { id: 'ml-203', newKw: 'ML面试 知识体系 经典算法 SVM XGBoost 深度学习 CNN Transformer 训练技巧 特征工程 系统设计 概率统计' },
  { id: 'ml-192', newKw: 'CAP 定理 面试 分布式 系统设计 CP AP BASE Paxos Raft' },
  { id: 'dl-40', newKw: '模型部署 优化 量化 INT8 FP16 图优化 算子融合 批处理 KV Cache Flash Attention 蒸馏 剪枝 TensorRT' },
  { id: 'ml-198', newKw: '数据Pipeline 面试 晚到数据 幂等 回填 检查点 监控 Great Expectations dbt test SLA 实时 批量' },
  { id: 'ml-197', newKw: '数据Pipeline 最佳实践 幂等 可观测性 增量处理 回填 Schema演进 小文件 Airflow dbt Great Expectations DataHub' },
  { id: 'ml-201', newKw: '反欺诈 系统设计 实时 规则引擎 模型打分 XGBoost 图算法 Flink Kafka 特征存储 Feature Store 熔断 灰度' },
  { id: 'ml-191', newKw: 'CP AP 分布式 选型 Zookeeper etcd Cassandra DynamoDB 一致性 可用性 trade-off' },
];

async function main() {
  for (const f of fixes) {
    const card = await prisma.card.findUnique({ where: { id: f.id } });
    if (!card) { console.log('NOT FOUND:', f.id); continue; }
    const old = card.searchKeywords;
    await prisma.card.update({ where: { id: f.id }, data: { searchKeywords: f.newKw } });
    console.log(f.id + ': OLD=' + (old || '').slice(0, 60) + ' → NEW=' + f.newKw.slice(0, 60));
  }
  await prisma.$disconnect();
  console.log('Done. ' + fixes.length + ' cards.');
}
main();
