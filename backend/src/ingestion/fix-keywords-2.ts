import prisma from '../db/prisma';

// Second pass: remove generic terms that cause cross-topic noise
const fixes: { id: string; newKw: string }[] = [
  // wp-81: 大厂技术面准备 → remove "系统设计" (matches "设计数据指标")
  { id: 'wp-81', newKw: '技术面试 准备 LeetCode 算法 数据结构 项目 深挖 STAR 模拟面试 Pramp 公司调研' },
  
  // wp-82: 行为面试 → remove generic "沟通", tighten
  { id: 'wp-82', newKw: '行为面试 STAR Amazon Leadership Principles 项目冲突 失败反思 团队合作 领导力' },

  // ml-201: 反欺诈系统 → remove generic "系统" "设计" (matches "设计XX系统" queries)  
  { id: 'ml-201', newKw: '反欺诈 规则引擎 实时打分 XGBoost 图算法 Flink Kafka 特征存储 Feature Store 熔断 灰度 支付风控' },

  // agent-29: AI客服邮件系统 → remove generic "系统" "设计" 
  { id: 'agent-29', newKw: 'AI客服 邮件 意图分类 信息抽取 RAG 知识库 PII 脱敏 人工坐席 自动回复 渐进上线 CSAT' },

  // dl-37: 边缘vs云端推理 → remove generic "推理" (keep compound terms)
  { id: 'dl-37', newKw: '边缘推理 on-device 云端推理 延迟 隐私 离线 零服务端成本 混合方案 Google Lens Siri' },

  // dl-39: ONNX vs TensorRT → already specific, but check
  // dl-40: 模型部署优化 → remove generic "优化" "加速" "推理"
  { id: 'dl-40', newKw: '模型部署 量化 INT8 FP16 算子融合 批处理 Batching KV Cache Flash Attention 蒸馏 剪枝 TensorRT Triton' },
  
  // dl-41: 推理服务架构 → remove generic "架构" "推理"
  { id: 'dl-41', newKw: '推理服务 Triton TorchServe BentoML 动态批处理 模型预热 熔断 GPU显存 容量规划 监控' },

  // ml-197: Pipeline最佳实践 → remove generic "数据"
  { id: 'ml-197', newKw: 'Pipeline 幂等 可观测性 增量处理 回填 Schema演进 小文件 Airflow dbt Great Expectations DataHub' },
  
  // ml-198: Pipeline面试 → remove generic "数据" "监控"
  { id: 'ml-198', newKw: 'Pipeline面试 晚到数据 watermark 幂等 回填 检查点 重放 Kafka offset Airflow retry' },

  // ml-199: 风控算法 → remove generic "训练" "模型" (matches "噪声标签怎么训练模型")
  { id: 'ml-199', newKw: '风控建模 反欺诈 信用评分 逻辑回归 XGBoost 图神经网络 Isolation Forest Autoencoder 设备指纹 交易频率' },

  // ml-202: ML面试记忆 → remove generic "学习" "记忆"
  { id: 'ml-202', newKw: 'ML面试 间隔重复 闪卡 Anki 费曼学习法 公式推导 对比学习 场景绑定 主动回忆' },

  // ml-203: ML知识体系 → too broad, make more specific
  { id: 'ml-203', newKw: 'ML面试 知识图谱 经典算法 逻辑回归 SVM XGBoost CNN Transformer 特征工程 评估指标 概率统计 Level1 Level2 Level3' },

  // wp-78: 北极星指标选型 → fine as is (relevant to 指标体系 queries)
  // wp-79: 北极星面试 → fine as is

  // stats-202: 时间序列评估 → remove generic "回测" "评估"
  { id: 'stats-202', newKw: '时间序列 MAE RMSE MAPE SMAPE Time Series Split 交叉验证 回测 Backtesting 多步预测 季节性 Naive' },
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
