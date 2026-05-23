import prisma from '../db/prisma';

// Third pass: last 0.1pp — remove remaining generic terms
const fixes: { id: string; newKw: string }[] = [
  // dl-41: still "架构" and "部署" in original auto-generated keywords leaking through
  { id: 'dl-41', newKw: 'Triton TorchServe BentoML Dynamic Batching 模型预热 Warmup 熔断 GPU 显存 容量规划 QPS' },
  
  // ml-196: ETL vs ELT — remove generic "数据" (leaking into "数据指标体系")
  { id: 'ml-196', newKw: 'ETL ELT Extract Transform Load dbt Airbyte Fivetran 数仓 Snowflake BigQuery Informatica Talend' },

  // dl-38: 手机端框架选型 — remove generic "移动端" (leaking into unrelated)
  { id: 'dl-38', newKw: 'CoreML TFLite MediaPipe 图像分割 iOS Android 移动端部署 ANE NNAPI GPU Delegate' },

  // ml-191: CP vs AP — remove generic "分布式" (leaking into "在线推理离线批处理")
  { id: 'ml-191', newKw: 'CP AP Zookeeper etcd Cassandra DynamoDB 强一致性 最终一致性 网络分区 选型比较' },
];

async function main() {
  for (const f of fixes) {
    const card = await prisma.card.findUnique({ where: { id: f.id } });
    if (!card) { console.log('NOT FOUND:', f.id); continue; }
    await prisma.card.update({ where: { id: f.id }, data: { searchKeywords: f.newKw } });
    console.log(f.id + ': ' + f.newKw.slice(0, 60));
  }
  await prisma.$disconnect();
  console.log('Done. ' + fixes.length + ' cards.');
}
main();
