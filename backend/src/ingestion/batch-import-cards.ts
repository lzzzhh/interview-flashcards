// backend/src/ingestion/batch-import-cards.ts
// Batch import coverage_gap cards
// Usage: npx tsx src/ingestion/batch-import-cards.ts

import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
(function loadEnv() {
  const p = __dirname + '/../../.env';
  try { for (const l of readFileSync(p,'utf-8').split('\n')) {
    const t = l.trim(); if (!t||t.startsWith('#')) continue;
    const eq = t.indexOf('='); if (eq<0) continue;
    if (!process.env[t.slice(0,eq).trim()]) process.env[t.slice(0,eq).trim()] = t.slice(eq+1).trim();
  }} catch {}
})();

import prisma from '../db/prisma';
import { setLLMProvider, OpenAIChatProvider } from '../services/llm-provider';
import { setEmbeddingProvider, OpenAIEmbeddingProvider } from '../services/embedding-provider';
import { getVectorStore, SqliteVecVectorStore, setVectorStore, initVectorStore } from '../services/vector/vector-store';
import { initFTS5 } from '../services/search/fts5-search';
import { syncCardEmbedding } from '../services/vector/embedding-sync';
import { generateSearchKeywords, checkCardReadiness } from '../services/ingestion/search-readiness';

// ═══════════════════════════
// Card Definitions
// ═══════════════════════════

interface CardDef {
  id: string;
  deckId: string;
  type: string;
  number: number;
  title: string;
  titleCn: string;
  question: string;
  answer: string;
  tags: string[];
  subTopic: string;
  difficulty: string;
}

// ═══ Batch 1: Systems & Data Engineering (18 cards) ═══

const BATCH1: CardDef[] = [
  // ── CAP 理论 (machine-learning) ──
  {
    id: 'ml-190', deckId: 'machine-learning', type: 'qa', number: 190,
    title: 'CAP Theorem Explained', titleCn: 'CAP 定理是什么？',
    question: '什么是 CAP 定理？为什么分布式系统不能同时满足一致性、可用性和分区容错性？',
    answer: 'CAP 定理（Brewer\'s Theorem）：分布式系统最多只能同时满足以下三个属性中的两个：\n1. Consistency（一致性）：所有节点在同一时刻看到相同的数据\n2. Availability（可用性）：每个请求都能获得非错误的响应\n3. Partition Tolerance（分区容错性）：系统在网络分区的情况下仍能正常运行\n\n由于网络分区在分布式系统中不可避免，实际选择是 CP（牺牲可用性，如 Zookeeper/etcd）或 AP（牺牲强一致性，如 Cassandra/DynamoDB）。',
    tags: ['分布式', 'CAP', '系统设计', '一致性', '可用性'],
    subTopic: '分布式理论', difficulty: 'medium',
  },
  {
    id: 'ml-191', deckId: 'machine-learning', type: 'qa', number: 191,
    title: 'CP vs AP Systems Comparison', titleCn: 'CP 和 AP 系统怎么选？',
    question: '在分布式系统设计中，CP 和 AP 分别适用于什么场景？举出实际的系统和 trade-off。',
    answer: 'CP 系统（一致性优先）：\n- 适用场景：金融交易、库存管理、配置中心\n- 代表系统：Zookeeper、etcd、HBase\n- Trade-off：网络分区时可能拒绝请求\n\nAP 系统（可用性优先）：\n- 适用场景：社交媒体、内容分发、实时分析\n- 代表系统：Cassandra、DynamoDB、CouchDB\n- Trade-off：可能返回旧数据（最终一致性）\n\n选型关键：能否接受短暂的数据不一致？如果数据一致性错误会导致资金损失，选 CP；如果用户体验比强一致性更重要，选 AP。',
    tags: ['CP', 'AP', '选型', 'Zookeeper', 'Cassandra', 'DynamoDB'],
    subTopic: '分布式理论', difficulty: 'medium',
  },
  {
    id: 'ml-192', deckId: 'machine-learning', type: 'qa', number: 192,
    title: 'CAP Theorem in Practice', titleCn: '面试中怎么回答 CAP 理论？',
    question: '面试官问「你们的系统是如何处理 CAP trade-off 的」，应该怎么回答？',
    answer: '标准回答框架：\n1. 先解释 CAP 定理（一句话 + 三个属性的定义）\n2. 说明实际系统必须在 CP 和 AP 之间选择\n3. 结合具体业务场景分析：\n   - 「我们的支付系统要求强一致性，选择了 CP（基于 etcd 实现分布式锁）」\n   - 「我们的推荐系统允许短暂不一致，选择了 AP（用 Cassandra 存储用户画像）」\n4. 提及 BASE 理论（Basically Available, Soft state, Eventually consistent）作为 AP 的补充\n5. 如果有实际经验，可以补充 Paxos/Raft 共识算法的基本概念',
    tags: ['面试', 'CAP', '系统设计', '分布式', 'BASE'],
    subTopic: '分布式理论', difficulty: 'hard',
  },

  // ── 图数据库 (deep-learning) ──
  {
    id: 'dl-33', deckId: 'deep-learning', type: 'qa', number: 33,
    title: 'Graph Database Overview', titleCn: '什么是图数据库？',
    question: '什么是图数据库？和关系型数据库有什么区别？',
    answer: '图数据库（Graph Database）以节点（Node）和边（Edge）为基本存储单元，天然支持图结构数据的存储和查询。\n\n与关系型数据库的区别：\n1. 数据模型：关系型用表+外键，图数据库用节点+关系\n2. 查询语言：关系型用 SQL，图数据库用 Cypher/SPARQL/Gremlin\n3. 多跳查询：图数据库 O(1) 遍历边，关系型需要多次 JOIN（指数级退化）\n4. 典型场景：社交网络（推荐关注）、知识图谱、欺诈检测、供应链追溯\n\n代表系统：Neo4j（Cypher）、Amazon Neptune、TigerGraph、ArangoDB。',
    tags: ['图数据库', 'Neo4j', '知识图谱', 'Cypher', 'NoSQL'],
    subTopic: '数据存储', difficulty: 'medium',
  },
  {
    id: 'dl-34', deckId: 'deep-learning', type: 'qa', number: 34,
    title: 'When to Use Graph Database', titleCn: '什么时候用图数据库？',
    question: '什么场景下应该选择图数据库而不是关系型数据库？有哪些判断标准？',
    answer: '选择图数据库的判据：\n1. 数据高度互联（社交关系、推荐、知识图谱）—— 关系型 JOIN 性能下降\n2. 需要多跳遍历（3 跳以上）—— 图数据库每条边 O(1)\n3. 查询模式以路径/模式匹配为主（「A 的朋友的朋友买了什么」）\n4. Schema 灵活、数据模型持续演化\n\n不应使用图数据库的场景：\n- 简单的 CRUD 应用（关系型更成熟）\n- 聚合分析为主（列式存储更好）\n- 团队没有图查询经验（学习曲线陡）\n\n现实建议：从 PostgreSQL + 递归 CTE 开始验证需求，确认确实需要图遍历性能再引入 Neo4j。',
    tags: ['选型', '图数据库', 'Neo4j', '社交网络', '知识图谱'],
    subTopic: '数据存储', difficulty: 'medium',
  },
  {
    id: 'dl-35', deckId: 'deep-learning', type: 'qa', number: 35,
    title: 'Graph DB in Fraud Detection', titleCn: '图数据库在反欺诈中的应用',
    question: '图数据库在风控和反欺诈中有什么应用？举一个具体场景。',
    answer: '反欺诈经典场景：识别欺诈团伙\n\n传统方法（关系型）：\n- 用户 A 和用户 B 使用同一设备 → JOIN User-Device 表\n- 用户 B 和用户 C 使用同一 IP → 再 JOIN\n- 用户 C 和用户 D 使用同一信用卡 → 再 JOIN\n- 3 跳之后查询复杂度 O(n³)，几乎不可行\n\n图数据库方法：\n- 用 Cypher 写出「找到所有共享设备/IP/信用卡的用户群」\n- 多跳遍历线性时间\n- 自动发现环形关系（洗钱链路）\n\n真实案例：PayPal 用图数据库检测欺诈交易；银行用 Neo4j 做反洗钱（AML）关联分析。',
    tags: ['反欺诈', '图数据库', '风控', 'Neo4j', '关联分析'],
    subTopic: '数据存储', difficulty: 'hard',
  },

  // ── 分布式锁 (machine-learning) ──
  {
    id: 'ml-193', deckId: 'machine-learning', type: 'qa', number: 193,
    title: 'Distributed Lock Explained', titleCn: '什么是分布式锁？',
    question: '什么是分布式锁？为什么单机锁在分布式环境下不够用？',
    answer: '分布式锁：在分布式系统中，确保同一时刻只有一个服务实例执行某段代码的机制。\n\n单机锁的局限：synchronized/ReentrantLock 只在同一个 JVM 进程内有效，多个服务实例部署在不同机器上时互不可见。\n\n分布式锁的实现方式：\n1. 数据库乐观锁（version 字段 + UPDATE WHERE）\n2. Redis（SETNX + 过期时间，Redlock 算法）\n3. ZooKeeper（临时顺序节点 + Watch 机制）\n4. etcd（Lease + 事务）\n\n关键要求：互斥性、防死锁（超时释放）、容错性（锁服务挂掉不影响业务）、可重入性。',
    tags: ['分布式锁', 'Redis', 'ZooKeeper', 'etcd', '并发'],
    subTopic: '分布式系统', difficulty: 'medium',
  },
  {
    id: 'ml-194', deckId: 'machine-learning', type: 'qa', number: 194,
    title: 'Redis vs ZK Distributed Lock', titleCn: 'Redis 和 ZK 分布式锁对比',
    question: 'Redis 和 ZooKeeper 实现分布式锁各有什么优缺点？生产环境怎么选？',
    answer: 'Redis 分布式锁：\n优点：性能极高（单机 10w+ QPS），部署简单，大部分公司已有 Redis\n缺点：Redlock 算法有争议（Martin Kleppmann 指出时钟跳跃问题），主从切换可能丢锁\n适用：对一致性要求不极端的场景（如防止重复提交、定时任务单实例执行）\n\nZooKeeper 分布式锁：\n优点：强一致性（ZAB 协议），临时节点自动释放（客户端断连锁自动删除）\n缺点：性能较低（~1w QPS），部署和运维复杂\n适用：对一致性要求严格的场景（如金融交易、库存扣减）\n\n选型建议：一般业务用 Redis（简单够用），金融/支付用 ZK/etcd。',
    tags: ['Redis', 'ZooKeeper', '分布式锁', 'Redlock', '选型'],
    subTopic: '分布式系统', difficulty: 'hard',
  },
  {
    id: 'ml-195', deckId: 'machine-learning', type: 'qa', number: 195,
    title: 'Distributed Lock Pitfalls', titleCn: '分布式锁有哪些坑？',
    question: '使用分布式锁时有哪些常见问题和注意事项？',
    answer: '常见坑：\n1. 锁超时 < 业务执行时间：锁提前释放，其他实例获取锁导致并发执行\n  解决：锁续期（Watch Dog 机制），Redisson 已实现\n2. 主从切换丢锁：Redis master 宕机，slave 提升后锁数据丢失\n  解决：Redlock（多节点投票）或换 ZK/etcd\n3. 时钟跳跃：NTP 时间同步导致过期时间计算错误\n  解决：使用单调时钟（monotonic clock）而非系统时间\n4. 锁粒度过大：一把锁锁住整个业务流程\n  解决：按资源 ID 加锁（如 userId、orderId）\n5. 未释放锁：客户端崩溃导致锁永久持有\n  解决：一定要设过期时间 + 客户端 ID 标识（释放时校验）',
    tags: ['分布式锁', '坑', 'Redis', 'Redlock', 'Watch Dog'],
    subTopic: '分布式系统', difficulty: 'hard',
  },

  // ── ETL / ELT / Pipeline (machine-learning) ──
  {
    id: 'ml-196', deckId: 'machine-learning', type: 'qa', number: 196,
    title: 'ETL vs ELT Explained', titleCn: 'ETL 和 ELT 有什么区别？',
    question: 'ETL 和 ELT 的核心区别是什么？各适用于什么场景？',
    answer: 'ETL（Extract-Transform-Load）：\n流程：从源系统抽取数据 → 在 ETL 工具中转换清洗 → 加载到目标数据仓库\n特点：数据在进入仓库前已经处理好，仓库中只有干净数据\n工具：Informatica、Talend、Apache Nifi\n适用：传统数仓（Teradata/Oracle），数据量中等，对数据质量要求高\n\nELT（Extract-Load-Transform）：\n流程：从源系统抽取数据 → 先加载到数据湖/仓库 → 在仓库内用 SQL/Spark 转换\n特点：保留原始数据，灵活性更高，利用现代数仓的 MPP 计算能力\n工具：dbt、Airbyte、Fivetran\n适用：云数仓（Snowflake/BigQuery）、大数据量、需要快速迭代\n\n现代趋势：ELT 为主流（云数仓计算能力强，不需要单独的转换层）。',
    tags: ['ETL', 'ELT', '数据管道', 'dbt', '数仓'],
    subTopic: '数据工程', difficulty: 'medium',
  },
  {
    id: 'ml-197', deckId: 'machine-learning', type: 'qa', number: 197,
    title: 'Data Pipeline Best Practices', titleCn: '数据 Pipeline 最佳实践',
    question: '构建可靠的数据 Pipeline 有哪些最佳实践？',
    answer: '核心原则：\n1. 幂等性：同一批数据多次运行得到相同结果（使用 merge/Upsert 而非 append）\n2. 可观测性：每个阶段记录数据行数、耗时、异常比例（DataHub/Great Expectations）\n3. 增量处理：只处理新增/变更数据（CDC 或 watermark）\n4. 回填能力：能够重新处理历史数据（参数化日期范围）\n5. 延迟告警：SLA 超时通知（Airflow SLA Miss / dbt test）\n6. Schema 演进：处理好上游加字段/改类型（Schema Registry / dbt contracts）\n7. 小文件问题：HDFS/对象存储定期合并小文件\n\n常见架构：Airflow 编排 + dbt 转换 + Great Expectations 数据质量 + DataHub 元数据。',
    tags: ['Pipeline', '最佳实践', '数据工程', 'Airflow', 'dbt', '幂等'],
    subTopic: '数据工程', difficulty: 'hard',
  },
  {
    id: 'ml-198', deckId: 'machine-learning', type: 'qa', number: 198,
    title: 'Data Pipeline Interview Questions', titleCn: '数据 Pipeline 面试题',
    question: '面试中常问的数据 Pipeline 问题有哪些？如何回答？',
    answer: '高频问题：\n1. 「你设计的 Pipeline 如何处理晚到数据？」\n   答：使用 watermark + 迟到数据旁路表 + Lambda 架构（批+流双层）\n2. 「Pipeline 失败了怎么恢复？」\n   答：幂等设计 + 检查点 + 从上次成功位置重放（Kafka offset / Airflow retry）\n3. 「如何监控数据质量？」\n   答：Great Expectations 做声明式检查 + dbt test（not_null/unique/relationships）\n4. 「实时和批量怎么选择？」\n   答：看 SLA 要求：分钟级用 Flink/Kafka Streams，小时级用 Spark/Airflow\n5. 「遇到过最大的数据量是多少？」\n   答：诚实回答 + 描述如何优化（分区裁剪、列式存储 Parquet、谓词下推）',
    tags: ['面试', 'Pipeline', '数据工程', '监控', '数据质量'],
    subTopic: '数据工程', difficulty: 'hard',
  },

  // ── 北极星指标 (workplace) ──
  {
    id: 'wp-77', deckId: 'workplace', type: 'qa', number: 77,
    title: 'North Star Metric Explained', titleCn: '什么是北极星指标？',
    question: '什么是北极星指标（North Star Metric）？它和 KPI、OKR 有什么区别？',
    answer: '北极星指标（North Star Metric）：最能代表产品给用户创造核心价值的单一关键指标。\n\n与 KPI/OKR 的区别：\n- KPI：衡量业务健康状况的多个指标（如 DAU、留存率、收入）\n- OKR：目标（Objective）+ 关键结果（Key Results），对齐团队方向\n- 北极星指标：公司层面的唯一核心指标，所有团队围绕它优化\n\n经典案例：\n- Spotify：总听歌时长（用户听的越久，价值越大）\n- Airbnb：预订过夜数（核心交易行为）\n- Facebook：月活跃用户数（社交网络的价值 = 用户规模）\n- WhatsApp：消息发送量\n\n选择原则：反映用户真实价值（不是收入），可衡量，与长期增长正相关。',
    tags: ['北极星指标', 'NSM', 'KPI', 'OKR', '产品'],
    subTopic: '产品指标', difficulty: 'medium',
  },
  {
    id: 'wp-78', deckId: 'workplace', type: 'qa', number: 78,
    title: 'How to Choose North Star Metric', titleCn: '怎么选北极星指标？',
    question: '如何为你的产品选择一个好的北极星指标？有哪些常见错误？',
    answer: '选择北极星指标的步骤：\n1. 定义产品核心价值：你的产品到底帮用户解决了什么问题？\n2. 找到能衡量这个价值的量化指标\n3. 验证「指标增长 = 用户价值增长 = 商业增长」\n4. 避免虚荣指标（注册量、下载量）——这些不代表用户真的在使用\n\n常见错误：\n- 选收入作为北极星（太滞后，不反映产品价值）\n- 选复合指标（公式太复杂，团队无法直观理解）\n- 多个北极星（失去聚焦，等于没有）\n- 不随时间迭代（产品阶段变了，核心价值可能也变了）\n\n反面案例：\n- 工具类产品选 PV 作为北极星 —— 用户刷新页面不会增加价值\n- SaaS 选注册数 —— 用户注册但不付费 = 无商业价值',
    tags: ['北极星指标', 'NSM', '产品指标', '选型'],
    subTopic: '产品指标', difficulty: 'medium',
  },
  {
    id: 'wp-79', deckId: 'workplace', type: 'qa', number: 79,
    title: 'North Star Metric Interview', titleCn: '北极星指标面试题',
    question: '面试问「如果你是我们的 PM，你会选什么作为北极星指标」，怎么回答？',
    answer: '回答框架：\n1. 先问清楚产品类型（交易平台/内容平台/工具/SaaS）\n2. 列出候选指标（3-5 个），排除所有虚荣指标\n3. 聚焦 1 个，解释为什么这个指标最能代表用户价值\n4. 说明怎么验证（A/B 测试看指标提升是否带动留存/收入）\n\n具体示例（面试电商类）：\n「我建议用『成功下单用户数』而非 GMV：\n- GMV 可能被刷单/大促冲高，不代表真实用户增长\n- 成功下单用户数 = 搜索引擎→商品页→加购→支付的完整链路终点\n- 可以拆解为各环节转化率，驱动具体团队优化」\n\n加分项：提到拆解北极星公式（如 下单用户数 = 访问 × 转化率），方便各团队认领子指标。',
    tags: ['面试', '北极星指标', '产品', 'NSM', 'PM'],
    subTopic: '产品指标', difficulty: 'hard',
  },

  // ── 风控建模 (machine-learning) ──
  {
    id: 'ml-199', deckId: 'machine-learning', type: 'qa', number: 199,
    title: 'Risk Modeling Overview', titleCn: '风控建模用什么算法？',
    question: '风控建模（反欺诈/信用评分）通常使用哪些算法？为什么？',
    answer: '风控建模常用算法：\n1. 逻辑回归（Logistic Regression）：金融风控基准模型，可解释性强，监管合规\n2. XGBoost/LightGBM：实际生产中效果最好的树模型，处理非线性关系\n3. 随机森林：对缺失值和异常值鲁棒\n4. 图神经网络（GNN）：识别欺诈团伙的关联关系\n5. Isolation Forest / Autoencoder：无监督异常检测\n\n选择标准：\n- 银行/保险：可解释性优先（需要告诉客户为什么被拒）→ 逻辑回归 + 规则引擎\n- 互联网/支付：性能优先（毫秒级响应）→ XGBoost + 特征工程\n- 反欺诈团伙：关联关系 → 图算法\n\n特征工程重点：设备指纹、IP 地理位置、交易频率、行为序列、图特征。',
    tags: ['风控', '欺诈检测', '逻辑回归', 'XGBoost', '图算法'],
    subTopic: '风控建模', difficulty: 'medium',
  },
  {
    id: 'ml-200', deckId: 'machine-learning', type: 'qa', number: 200,
    title: 'Fraud Detection Model Evaluation', titleCn: '风控模型怎么评估？',
    question: '风控模型如何评估？AUC 够不够？',
    answer: '风控模型评估的特殊性：\n1. 样本极度不平衡（欺诈率 0.1%~1%）：AUC 可能虚高，需要看 PR 曲线和 Precision@K\n2. 业务成本不对称：误拒一个好用户（False Positive）的损失可能小于放过一个欺诈（False Negative）—— 需要根据业务设定阈值\n3. 时间衰减：欺诈模式快速演化，模型需要频繁重训（周/月级）\n\n关键指标：\n- Recall @ 固定 Precision（在 Precision=90% 时能抓多少）\n- KS 值（区分好坏样本的能力）\n- 线上 AB 测试：坏账率下降多少\n\n模型监控：\n- PSI（Population Stability Index）：特征分布是否偏移\n- 欺诈率趋势：模型是否还在有效拦截',
    tags: ['风控', '评估', 'AUC', 'Precision', 'Recall', 'KS'],
    subTopic: '风控建模', difficulty: 'hard',
  },
  {
    id: 'ml-201', deckId: 'machine-learning', type: 'qa', number: 201,
    title: 'Fraud Detection System Design', titleCn: '设计一个反欺诈系统',
    question: '如果让你从头设计一个支付反欺诈系统，你会怎么设计？',
    answer: '系统架构：\n1. 实时层（毫秒级决策）：\n   - 规则引擎（硬规则：黑名单、单笔金额上限）\n   - 轻量模型（逻辑回归/XGBoost）做实时打分\n   - 超出阈值 → 人工审核 / 拒绝\n2. 近线层（分钟级）：\n   - Flink/Kafka Streams 聚合用户近期行为特征\n   - 检测异常模式（如短时间内多地登录）\n3. 离线层（日/周级）：\n   - 图算法跑全量用户关系 → 发现欺诈团伙\n   - 模型重训和更新\n4. 人工审核中台：\n   - 不确定的 case 推送给审核团队\n   - 审核结果回流到训练数据集\n\n关键设计点：\n- 特征存储（Feature Store）：实时+离线特征统一管理\n- 模型版本管理：多模型 AB 测试 + 灰度发布\n- 熔断机制：模型服务超时自动降级到纯规则',
    tags: ['系统设计', '反欺诈', '风控', '实时', '特征存储'],
    subTopic: '风控建模', difficulty: 'hard',
  },
];

// ═══ Batch 2: Deployment & Privacy (12 cards) ═══

const BATCH2: CardDef[] = [
  // ── 图像分割手机端部署 (deep-learning) ──
  {
    id: 'dl-36', deckId: 'deep-learning', type: 'qa', number: 36,
    title: 'Mobile Image Segmentation', titleCn: '图像分割如何部署到手机端？',
    question: '图像分割模型如何在手机端部署？有哪些轻量化方案？',
    answer: '手机端部署图像分割模型的方案：\n1. 轻量 Backbone：MobileNetV3 / EfficientNet-Lite / ShuffleNet\n2. 轻量分割头：DeepLabV3+ Lite / BiSeNet / SegFormer (tiny)\n3. 模型量化：INT8 量化（TFLite / CoreML），模型大小减少 75%，速度提升 2-4x\n4. 推理框架：\n   - Android：TFLite GPU Delegate / NNAPI / MediaPipe\n   - iOS：CoreML + ANE（Apple Neural Engine）\n5. 模型剪枝 + 蒸馏：用大模型（Teacher）教小模型（Student）\n\n典型效果：MobileNetV3 + DeepLabV3+，INT8 量化后 5-10MB，iPhone 上 15-30ms/帧。',
    tags: ['移动端', '图像分割', 'MobileNet', 'TFLite', 'CoreML', '量化'],
    subTopic: '模型部署', difficulty: 'medium',
  },
  {
    id: 'dl-37', deckId: 'deep-learning', type: 'qa', number: 37,
    title: 'Edge vs Cloud Inference', titleCn: '边缘推理和云端推理怎么选？',
    question: '什么场景应该把模型放在手机上推理，什么场景用云端推理？',
    answer: '边缘推理（On-device）优势：\n- 延迟低（不需要网络往返）\n- 隐私保护（数据不离开设备）\n- 离线可用\n- 零服务端成本\n场景：实时视频处理（美颜/滤镜）、OCR、语音唤醒\n\n云端推理优势：\n- 模型可以更大更准（GPU/TPU 集群）\n- 模型更新即时生效（不需要发版）\n- 可以利用多模态/多模型 ensemble\n场景：医疗影像诊断、复杂 NLP、大模型推理\n\n混合方案：\n- 轻量模型在本地做粗筛，置信度低的送云端\n- Google Lens：手机端检测物体，云端做 OCR/翻译\n- Siri/Alexa：本地做唤醒词检测，云端做语音识别',
    tags: ['边缘推理', '云端推理', '部署', '端侧', 'ONNX'],
    subTopic: '模型部署', difficulty: 'medium',
  },
  {
    id: 'dl-38', deckId: 'deep-learning', type: 'qa', number: 38,
    title: 'Mobile Segmentation Framework Selection', titleCn: '手机端分割模型框架选型',
    question: 'iOS 和 Android 上图像分割框架怎么选？MediaPipe、CoreML、TFLite 的区别？',
    answer: '三大移动推理框架对比：\n\nCoreML（iOS）：\n- Apple 原生，自动利用 ANE（Neural Engine）\n- 模型格式：.mlmodel / .mlpackage\n- 优点：零额外依赖，与 SwiftUI/ARKit 深度集成\n- 缺点：只支持 iOS/macOS\n\nTFLite（跨平台）：\n- Google 出品，Android 首选\n- 支持 GPU Delegate、NNAPI、XNNPack\n- 优点：跨平台，量化工具链成熟\n- 缺点：iOS 上性能略逊于 CoreML\n\nMediaPipe（高级封装）：\n- Google 基于 TFLite 的应用框架\n- 内置人脸检测/手部关键点/姿态估计等预置方案\n- 优点：开箱即用，自定义模型也方便接入\n- 缺点：包体积较大\n\n选型建议：iOS 用 CoreML，Android 用 TFLite+MediaPipe，跨平台需求用 TFLite。',
    tags: ['CoreML', 'TFLite', 'MediaPipe', '移动端', '框架选型'],
    subTopic: '模型部署', difficulty: 'hard',
  },

  // ── ONNX / TensorRT (deep-learning) ──
  {
    id: 'dl-39', deckId: 'deep-learning', type: 'qa', number: 39,
    title: 'ONNX vs TensorRT Explained', titleCn: 'ONNX 和 TensorRT 有什么区别？',
    question: 'ONNX 和 TensorRT 分别是什么？模型部署中怎么配合使用？',
    answer: 'ONNX（Open Neural Network Exchange）：\n- 开放模型格式，不同框架间互转（PyTorch → ONNX → TensorRT/CoreML/TFLite）\n- 工具：torch.onnx.export() / onnxruntime\n- 角色：中间表示（IR），不负责推理加速\n\nTensorRT（NVIDIA）：\n- NVIDIA 的推理优化引擎，专为 GPU 优化\n- 优化手段：层融合（Layer Fusion）、精度校准（FP16/INT8）、Kernel 自动调优（Auto-tuning）\n- 角色：推理加速器\n\n典型流程：\nPyTorch 模型 → export ONNX → TensorRT build engine → TensorRT inference\n加速效果：FP16 2-4x，INT8 4-8x（相对 PyTorch FP32）\n\n对比：ONNX Runtime 也支持 GPU 加速，但 TensorRT 在 NVIDIA GPU 上通常是性能王者。',
    tags: ['ONNX', 'TensorRT', '推理加速', '模型部署', 'GPU'],
    subTopic: '模型部署', difficulty: 'medium',
  },
  {
    id: 'dl-40', deckId: 'deep-learning', type: 'qa', number: 40,
    title: 'Model Deployment Optimization', titleCn: '模型部署优化技巧',
    question: '深度学习模型部署到生产环境有哪些通用的优化手段？',
    answer: '通用优化手段（按优先级排序）：\n1. 模型量化（INT8/FP16）：最有效的优化，2-4x 速度提升\n2. 图优化（算子融合）：合并 Conv+BN+ReLU 为单个 kernel\n3. 批处理（Batching）：合并多个请求为一批做 GPU 推理，吞吐量提升 5-10x\n4. KV Cache（LLM 专用）：缓存已计算的 Key/Value，避免重复计算\n5. Flash Attention：优化 Attention 计算的显存访问模式\n6. 模型蒸馏：用大模型教小模型\n7. 剪枝（Pruning）：去掉不重要的权重\n\n加速比参考（ResNet-50）：\n- FP32 baseline: 1x\n- FP16: 2x\n- INT8: 4x\n- INT8 + TensorRT: 8x\n- INT8 + TensorRT + Batching: 20x+',
    tags: ['量化', '推理加速', 'TensorRT', '部署优化', '批处理'],
    subTopic: '模型部署', difficulty: 'hard',
  },
  {
    id: 'dl-41', deckId: 'deep-learning', type: 'qa', number: 41,
    title: 'Production ML Serving Architecture', titleCn: '生产环境推理服务架构',
    question: '设计一个高可用的模型推理服务，需要考虑哪些方面？',
    answer: '推理服务架构关键设计点：\n1. 服务化：Triton Inference Server / TorchServe / BentoML\n2. 负载均衡：多 GPU 实例 + 请求队列\n3. 模型版本管理：A/B 测试 + 灰度发布 + 一键回滚\n4. 动态批处理（Dynamic Batching）：Triton 自动合并请求\n5. 模型预热（Warmup）：启动时预加载 + 一次 dummy 推理，避免冷启动延迟\n6. 超时 + 熔断：推理超时自动降级到简化模型/缓存结果\n7. 监控：P50/P99 延迟、吞吐量、GPU 利用率、显存\n\n容量规划：\n- 单 GPU 推理延迟 10ms → QPS=100（串行）\n- 加上 Dynamic Batching (batch=8) → QPS=800\n- 4 GPU 集群 → QPS=3200',
    tags: ['推理服务', 'Triton', '架构', '部署', 'GPU'],
    subTopic: '模型部署', difficulty: 'hard',
  },

  // ── AI 客服邮件隐私 (agent) ──
  {
    id: 'agent-27', deckId: 'agent', type: 'qa', number: 27,
    title: 'AI Email Privacy Protection', titleCn: 'AI 客服邮件如何保护隐私？',
    question: '用 AI 自动回复客户邮件时，如何保证用户隐私和数据安全？',
    answer: 'AI 客服邮件的隐私保护层级：\n1. PII 脱敏（输入层）：\n   - 检测并替换姓名、邮箱、电话、身份证号\n   - 工具：Presidio（Microsoft）/ Spacy NER + 正则\n2. 本地推理（推理层）：\n   - 敏感场景使用本地 LLM（Llama/Phi）而非 API\n   - 避免用户数据发送到第三方服务\n3. 数据隔离（存储层）：\n   - 邮件内容不用于模型训练\n   - 日志中 PII 自动脱敏\n4. 输出审计（输出层）：\n   - AI 回复内容审核（不包含原始 PII）\n   - 人工抽检机制\n\n企业合规要点：\n- GDPR：用户有权要求删除对话数据\n- 中国《个人信息保护法》：敏感个人信息需单独同意\n- SOC2 / ISO27001：日志审计 + 访问控制',
    tags: ['隐私', 'PII', 'AI客服', '脱敏', 'GDPR'],
    subTopic: 'AI安全', difficulty: 'medium',
  },
  {
    id: 'agent-28', deckId: 'agent', type: 'qa', number: 28,
    title: 'On-Device vs Cloud AI Privacy', titleCn: '本地推理 vs 云端推理的隐私考量',
    question: 'AI 隐私保护中，本地推理和云端推理有哪些 trade-off？',
    answer: '本地推理（On-device）：\n优点：数据不离开设备，最彻底的隐私保护\n缺点：模型能力受限（参数量<10B），设备算力有限\n适用：手机输入法联想、相册人脸分组、本地文档搜索\n\n云端推理（Cloud API）：\n优点：可以使用最强模型（GPT-4/Claude），能力天花板高\n缺点：数据需传输到第三方，合规风险\n适用：通用客服、内容生成、复杂推理\n\n混合方案：\n- PII 脱敏后送云端（去掉个人信息，保留语义）\n- 本地做分类（这条邮件是否包含敏感信息），敏感的在本地处理\n- Apple Intelligence：本地先跑，复杂的才送云端（加密传输）\n\n生产建议：对外部客户的客服邮件 → 至少脱敏后再送 LLM API；内部工单系统 → 可放宽。',
    tags: ['隐私', '本地推理', '云端推理', 'PII', '脱敏'],
    subTopic: 'AI安全', difficulty: 'hard',
  },
  {
    id: 'agent-29', deckId: 'agent', type: 'qa', number: 29,
    title: 'AI Email Customer Service Design', titleCn: '设计 AI 客服邮件系统',
    question: '设计一个 AI 驱动的客服邮件自动回复系统，架构上要考虑什么？',
    answer: '系统架构：\n1. 邮件接入层：接收邮件 → 意图分类（退款/咨询/投诉/其他）\n2. 信息抽取层：提取订单号、产品名、问题描述\n3. 路由层：\n   - 简单问题（退款进度查询）→ RAG 检索知识库 → LLM 生成回复\n   - 复杂问题（投诉/法律相关）→ 人工坐席\n4. 隐私层：PII 脱敏 → LLM 推理 → 回复审核（自动+人工抽检）\n5. 发送层：去 PII 脱敏标记 → 发送邮件\n\n关键指标：\n- 自动解决率（无需人工介入的比例）\n- 首次响应时间（从 4h → 30s）\n- 客户满意度（CSAT）：AI 回复要听起来像人\n- 误路由率（投诉被当成咨询自动回复 = 灾难）\n\n渐进式上线策略：先做辅助（起草回复→人工确认），再自动发送低风险类别。',
    tags: ['系统设计', 'AI客服', 'RAG', '邮件', '架构'],
    subTopic: 'AI安全', difficulty: 'hard',
  },

  // ── 时间序列节假日效应 (statistics) ──
  {
    id: 'stats-200', deckId: 'statistics', type: 'qa', number: 200,
    title: 'Holiday Effect in Time Series', titleCn: '时间序列节假日效应怎么处理？',
    question: '时间序列预测中如何处理节假日效应（Holiday Effect）？',
    answer: '节假日效应的处理方法：\n1. 虚拟变量（Dummy Variable）：为每个节假日添加 0/1 特征\n   - 春节前后 7 天都标记（除夕+前3+后3）\n2. Prophet 内置节假日：holidays 参数，自动建模\n3. 周期性特征：添加 day_of_week、is_weekend、is_holiday\n4. 滑动窗口偏移：比较去年同期的数据\n\n注意点：\n- 中国特有：春节日期不固定（农历），调休补班影响\n- 大促效应：双11/618 比普通节假日影响更大\n- 多重节假日叠加：国庆+中秋 → 需组合建模\n\nProphet 示例：\n```python\nholidays = pd.DataFrame({\n  \'holiday\': \'spring_festival\',\n  \'ds\': pd.date_range(\'2024-02-10\', periods=7),\n  \'lower_window\': -3, \'upper_window\': 3\n})\nmodel = Prophet(holidays=holidays)\n```',
    tags: ['时间序列', '节假日', 'Prophet', '预测', '季节效应'],
    subTopic: '时间序列', difficulty: 'medium',
  },
  {
    id: 'stats-201', deckId: 'statistics', type: 'qa', number: 201,
    title: 'Time Series Seasonality Decomposition', titleCn: '时间序列季节性分解',
    question: '如何判断时间序列中是否存在季节性？有哪些分解方法？',
    answer: '季节性检测方法：\n1. ACF/PACF 图：观察是否有周期性的自相关峰值\n2. STL 分解（Seasonal-Trend decomposition using LOESS）：\n   - 原始序列 = 趋势（Trend）+ 季节（Seasonal）+ 残差（Residual）\n   - 使用 `statsmodels.tsa.seasonal.STL`\n3. 季节虚拟变量回归：拟合季节性系数并检验显著性\n\n分解方法对比：\n- Classical Decomposition：简单移动平均，不处理边界\n- STL：LOESS 平滑，鲁棒性好，可处理缺失值\n- X13-ARIMA-SEATS：美国人口普查局，支持交易日/节假日调整\n- Prophet：自动检测周/年级别季节性，傅里叶级数建模\n\n季节性诊断：\n- 如果季节性分量方差 << 残差方差 → 季节性不显著\n- 如果季节性分量呈规律变化 → 存在季节性',
    tags: ['时间序列', '季节性', 'STL', 'ACF', 'Prophet'],
    subTopic: '时间序列', difficulty: 'hard',
  },
  {
    id: 'stats-202', deckId: 'statistics', type: 'qa', number: 202,
    title: 'Time Series Forecast Evaluation', titleCn: '时间序列预测怎么评估？',
    question: '时间序列预测模型的评估指标和方法有哪些？',
    answer: '评估指标：\n1. MAE（Mean Absolute Error）：平均绝对误差，业务友好\n2. RMSE（Root Mean Squared Error）：对大误差惩罚更重\n3. MAPE（Mean Absolute Percentage Error）：百分比误差，跨序列可比较\n   - 注意：当真实值接近 0 时 MAPE 爆炸\n4. SMAPE（Symmetric MAPE）：修正 MAPE 的对称性问题\n\n评估方法：\n1. 时间序列交叉验证（Time Series Split）：\n   - 不能随机 shuffle！保持时间顺序\n   - 滚动窗口：train [t-365:t-30] → test [t-30:t]\n2. 回测（Backtesting）：\n   - 模拟真实预测场景，每次预测用截至当前的所有历史数据\n3. 多步预测 vs 单步预测：\n   - 单步 MAE 很小 ≠ 多步准确（误差累积）\n\n模型选择：\n- 简单基线：Naive（用昨天预测今天）、Seasonal Naive（用去年同期）\n- 如果 ML 模型打不过 Seasonal Naive → 数据可能没有可学习的模式',
    tags: ['时间序列', '评估', 'MAE', 'RMSE', 'MAPE', '回测'],
    subTopic: '时间序列', difficulty: 'hard',
  },
];

// ═══ Batch 3: Career & Meta-Learning (9 cards) ═══

const BATCH3: CardDef[] = [
  // ── 改简历/大厂技术面 (workplace) ──
  {
    id: 'wp-80', deckId: 'workplace', type: 'qa', number: 80,
    title: 'Tech Resume Writing Guide', titleCn: '大厂技术简历怎么写？',
    question: '应聘大厂技术岗位的简历应该怎么写？有哪些常见错误？',
    answer: '技术简历核心原则（STAR + 量化）：\n1. 项目经历用 STAR 法则：Situation → Task → Action → Result\n2. 量化结果：「优化了数据库查询」→「将 API 响应时间从 2s 降低到 200ms（90% 优化）」\n3. 技术栈具体化：「用过微服务」→「基于 Spring Cloud + K8s 搭建了 12 个微服务的电商系统」\n4. 一页原则：3 年以上经验才用两页\n\n常见错误：\n- 「熟练掌握」太多 → 改成具体的技术深度描述\n- 职责描述式（「负责XX系统开发」）→ 改成贡献式（「通过XX手段将XX提升XX」）\n- 所有项目平铺 → 按相关度排序，最匹配 JD 的放最前面\n- 缺少英文版 → 外企/大厂都需要\n\n大厂偏好：开源贡献 > 个人项目有用户量 > 课程项目。',
    tags: ['简历', '面试', 'STAR', '大厂', '求职'],
    subTopic: '求职面试', difficulty: 'easy',
  },
  {
    id: 'wp-81', deckId: 'workplace', type: 'qa', number: 81,
    title: 'Tech Interview Preparation Strategy', titleCn: '大厂技术面准备策略',
    question: '准备大厂技术面试的系统性策略是什么？时间怎么分配？',
    answer: '准备策略（按时间线）：\n1. 基础巩固（50%时间）：\n   - 算法：LeetCode Hot 100 + 剑指 Offer\n   - 数据结构：数组/链表/树/图/DP\n   - 系统设计：DDIA（Designing Data-Intensive Applications）\n2. 项目深挖（30%时间）：\n   - 每个项目准备 3 分钟电梯演讲\n   - 准备技术难点、trade-off、改进方案\n   - 用 STAR 法则写项目描述\n3. 模拟面试（15%时间）：\n   - 找朋友 / LeetCode Mock / Pramp\n   - 录音回听：语速、逻辑清晰度\n4. 公司调研（5%时间）：\n   - 了解目标团队的业务和技术栈\n   - Glassdoor/牛客看面经\n\n典型错误：\n- 只刷题不准备项目（社招更看重工程能力）\n- 刷了 500 题但每题只看题解（需要独立做出来）\n- 面试时只顾写代码不说话（think out loud 很重要）',
    tags: ['面试', '准备', 'LeetCode', '系统设计', '项目'],
    subTopic: '求职面试', difficulty: 'medium',
  },
  {
    id: 'wp-82', deckId: 'workplace', type: 'qa', number: 82,
    title: 'Behavioral Interview for Tech', titleCn: '技术面行为面试怎么答？',
    question: '大厂面试中的行为面试（Behavioral Interview）怎么准备？',
    answer: '高频行为问题 + 回答模板：\n1. 「介绍你最有挑战的项目」→ STAR：背景→你的角色→技术难点→成果\n2. 「和同事/PM 有冲突怎么办」→ 强调沟通：先理解对方视角→数据说话→找共同目标\n3. 「项目失败的经历」→ 诚实 + 反思：发生了什么→学到了什么→后来的改进\n4. 「为什么选择我们公司」→ 做功课：提具体的业务/技术挑战 + 你的匹配度\n\n回答原则：\n- 每个故事 2-3 分钟，有细节但不过度展开\n- 强调「我做了什么」而非「我们做了什么」\n- 准备 5-7 个通用故事，覆盖不同维度（技术深度/团队合作/领导力/失败反思）\n\nAmazon Leadership Principles 覆盖题：\n- Customer Obsession / Ownership / Dive Deep / Bias for Action\n- 每个 LP 准备 1-2 个故事',
    tags: ['面试', '行为面试', 'STAR', '大厂', '沟通'],
    subTopic: '求职面试', difficulty: 'medium',
  },

  // ── ML 面试记了又忘 (machine-learning) ──
  {
    id: 'ml-202', deckId: 'machine-learning', type: 'qa', number: 202,
    title: 'How to Remember ML Concepts', titleCn: 'ML 面试知识怎么记？',
    question: '机器学习面试知识点太多记不住怎么办？有什么高效的学习和记忆方法？',
    answer: 'ML 知识记忆策略：\n1. 费曼学习法：用自己的话讲给别人听 → 发现理解缺口 → 回头补\n2. 间隔重复（Spaced Repetition）：Anki/闪卡，根据遗忘曲线安排复习\n3. 公式推导：不要背公式，从第一性原理推导（如 Softmax = exp/sum(exp) 来自概率归一化需求）\n4. 对比学习：相似概念放一起对比（Bagging vs Boosting、L1 vs L2、BatchNorm vs LayerNorm）\n5. 场景绑定：每个知识点绑定一个具体场景（「为什么 CNN 用 ReLU？因为在 ImageNet 上梯度消失少」）\n\n每日计划：\n- 30min 刷 2-3 个概念（概念卡 + 手写推导 + 对比表）\n- 周末回顾本周所有概念\n- 面试前两周集中模考\n\n最关键：不是学得更多，而是反复回顾已经学过的。间隔重复 + 主动回忆 > 被动重读。',
    tags: ['学习方法', '间隔重复', '费曼', '面试', '记忆'],
    subTopic: '学习技巧', difficulty: 'easy',
  },
  {
    id: 'ml-203', deckId: 'machine-learning', type: 'qa', number: 203,
    title: 'ML Interview Knowledge Map', titleCn: 'ML 面试知识体系',
    question: '机器学习面试需要掌握哪些核心知识体系？',
    answer: 'ML 面试知识体系（按重要性排序）：\n1. 经典算法原理：线性回归/逻辑回归/SVM/决策树/随机森林/XGBoost\n2. 深度学习基础：CNN/RNN/Transformer/Attention/BN/Dropout\n3. 训练技巧：损失函数/优化器/正则化/学习率调度/过拟合诊断\n4. 评估指标：AUC/PR/F1/cross-validation/bias-variance tradeoff\n5. 特征工程：归一化/编码/特征选择/特征交叉\n6. 模型部署：量化/剪枝/ONNX/TensorRT/serving\n7. 系统设计：推荐系统/搜索/广告/风控 pipeline\n8. 概率统计：贝叶斯/假设检验/分布/最大似然\n\n每个模块的掌握标准：\n- Level 1：能说清楚原理（面试 60%）\n- Level 2：能推导公式（面试 80%）\n- Level 3：能结合实际项目讲 trade-off（面试 95%）',
    tags: ['知识体系', '面试', 'ML', '深度学习', '系统设计'],
    subTopic: '学习技巧', difficulty: 'medium',
  },
  {
    id: 'ml-204', deckId: 'machine-learning', type: 'qa', number: 204,
    title: 'Common ML Interview Pitfalls', titleCn: 'ML 面试常见翻车点',
    question: '机器学习面试中最容易翻车的问题有哪些？怎么避免？',
    answer: '高频翻车题 + 正确回答：\n1. 「AUC 等于 0.5 说明什么？」→ 模型等于随机猜测，不是「模型很差」，可能是 label 反了\n2. 「过拟合怎么办？」→ 不要只说「加正则化」：先看 learning curve 确认是过拟合→增加数据/数据增强→Dropout/Early Stopping → 减小模型容量\n3. 「为什么 XGBoost 比 GBDT 快？」→ 正则化目标函数+二阶泰勒展开+列抽样+预排序→直方图算法\n4. 「L1 和 L2 的区别」→ L1 产生稀疏解（特征选择），L2 产生平滑解；从等高线图 + 约束区域解释\n5. 「BatchNorm 训练和推理的区别」→ 训练用 mini-batch 的 μ/σ，推理用全局 running mean/var\n\n通用翻车原因：只背八股文，不能深入一层。面试官追问「为什么」就卡住了。',
    tags: ['面试', '翻车', 'ML', 'AUC', '过拟合', 'BatchNorm'],
    subTopic: '学习技巧', difficulty: 'hard',
  },

  // ── 传统 ML 有没有必要学 (machine-learning) ──
  {
    id: 'ml-205', deckId: 'machine-learning', type: 'qa', number: 205,
    title: 'Is Traditional ML Still Relevant', titleCn: '传统 ML 还有必要学吗？',
    question: '深度学习/大模型时代，传统的机器学习（SVM、决策树、GBDT）还有必要学吗？',
    answer: '传统 ML 仍然有必要学的理由：\n1. 表格数据：XGBoost/LightGBM 在表格数据上仍然 SOTA，碾压深度学习\n2. 可解释性：金融/医疗要求模型可解释，逻辑回归 + 特征工程无法替代\n3. 数据效率：传统 ML 在几百条样本上就能工作，深度学习需要上千条\n4. 工程成本：训练 XGBoost 只需 CPU + 几秒，LLM fine-tune 需要 GPU + 几小时\n5. 面试要求：80% 的 ML 面试题仍然是传统 ML 基础\n\n何时学深度学习：\n- 你的数据是图像/文本/音频\n- 你需要学习复杂特征表示（端到端）\n- 你的数据量足够大（10w+）\n\n建议：传统 ML 基础 → 深度学习 → 大模型应用。不要跳步。面试官看得出谁只会调 API。',
    tags: ['传统ML', 'XGBoost', '深度学习', '面试', '选型'],
    subTopic: '学习路线', difficulty: 'easy',
  },
  {
    id: 'ml-206', deckId: 'machine-learning', type: 'qa', number: 206,
    title: 'ML vs DL Decision Framework', titleCn: '什么时候用传统 ML，什么时候用深度学习？',
    question: '在工业界实践中，如何判断一个问题应该用传统 ML 还是深度学习？',
    answer: '决策框架（按优先级）：\n1. 数据量：< 1万条 → 传统 ML（XGBoost/逻辑回归）\n2. 数据类型：表格 → 传统 ML；图像/文本/音频 → 深度学习\n3. 可解释性要求：高（金融/医疗）→ 传统 ML\n4. 部署资源：CPU only → 传统 ML；有 GPU → 可选 DL\n5. 研发周期：1 天出 baseline → 传统 ML；有 2 周时间 → 可以试 DL\n\n经验法则：\n- 基线模型：永远从逻辑回归/GBDT 开始（简单且可解释）\n- 如果基线已经满足业务需求 → 不需要 DL\n- 如果基线不够 → 先做特征工程（效果提升通常 > 换模型）\n- 特征工程也到天花板了 → 才考虑 DL\n\n反例：用 BERT 做 100 条样本的文本分类（过拟合 + 成本高），应该用 TF-IDF + 逻辑回归。',
    tags: ['传统ML', '深度学习', '选型', 'XGBoost', '特征工程'],
    subTopic: '学习路线', difficulty: 'medium',
  },
  {
    id: 'ml-207', deckId: 'machine-learning', type: 'qa', number: 207,
    title: 'ML Learning Path for Beginners', titleCn: 'ML 学习路线怎么规划？',
    question: '2024 年入行机器学习，应该按什么顺序学习？有哪些推荐的课程和项目？',
    answer: 'ML 学习路线（6 个月计划）：\n\n第一阶段：基础（月 1-2）\n- 数学：线性代数（矩阵运算）、概率（贝叶斯/分布）、微积分（梯度）\n- 编程：Python/NumPy/Pandas 熟练\n- 课程：Andrew Ng Machine Learning（Coursera）\n\n第二阶段：经典 ML（月 3-4）\n- 算法：线性回归→逻辑回归→SVM→决策树→随机森林→XGBoost→K-Means→PCA\n- 项目：Kaggle Titanic + House Prices\n- 掌握：sklearn + 特征工程 + 交叉验证\n\n第三阶段：深度学习（月 5-6）\n- 框架：PyTorch\n- 模型：CNN→RNN→Transformer\n- 项目：图像分类 + 文本分类\n- 课程：fast.ai 或 CS231n\n\n关键原则：\n- 每个算法手写推导一遍\n- 不要同时学太多框架（PyTorch 一个够用）\n- 项目放在 GitHub 上，写 README\n- 学完一个概念就用自己的话写总结',
    tags: ['学习路线', 'ML', '入门', 'PyTorch', 'sklearn'],
    subTopic: '学习路线', difficulty: 'easy',
  },
];

// ═══════════════════════════
// Import Logic
// ═══════════════════════════

async function init() {
  const llm = new OpenAIChatProvider(process.env.LLM_BASE_URL!, process.env.LLM_API_KEY!);
  (llm as any).defaultModel = process.env.LLM_MODEL || 'deepseek-chat';
  setLLMProvider(llm);
  const ep = new OpenAIEmbeddingProvider(process.env.EMBEDDING_BASE_URL!, process.env.EMBEDDING_API_KEY!);
  (ep as any).defaultModel = process.env.EMBEDDING_MODEL || 'bge-m3';
  setEmbeddingProvider(ep);
  if (getVectorStore().name === 'noop') setVectorStore(new SqliteVecVectorStore());
  await initVectorStore();
  await initFTS5();
}

async function importCards(batch: CardDef[], batchName: string) {
  console.log(`\n[import] ${batchName} — ${batch.length} cards`);
  let created = 0, skipped = 0, failed = 0;

  for (const card of batch) {
    try {
      const exists = await prisma.card.findUnique({ where: { id: card.id } });
      if (exists) {
        console.log(`  SKIP ${card.id} — already exists`);
        skipped++;
        continue;
      }

      const searchKeywords = generateSearchKeywords({
        title: card.title, titleCn: card.titleCn,
        question: card.question, answer: card.answer,
        tags: JSON.stringify(card.tags),
        subTopic: card.subTopic, deckId: card.deckId,
      });

      await prisma.card.create({
        data: {
          id: card.id, deckId: card.deckId, type: card.type,
          number: card.number, title: card.title, titleCn: card.titleCn,
          question: card.question, answer: card.answer,
          tags: JSON.stringify(card.tags),
          subTopic: card.subTopic, difficulty: card.difficulty,
          searchKeywords,
        },
      });

      // Sync bge-m3 embedding
      await syncCardEmbedding(card.id);
      console.log(`  OK ${card.id} — "${card.titleCn}"`);
      created++;
    } catch (e: any) {
      console.error(`  FAIL ${card.id}: ${e?.message?.slice(0,100)}`);
      failed++;
    }
  }

  return { created, skipped, failed };
}

async function main() {
  await init();

  let totalCreated = 0, totalSkipped = 0, totalFailed = 0;

  // Batch 1
  const r1 = await importCards(BATCH1, 'Batch 1: Systems & Data Engineering');
  totalCreated += r1.created; totalSkipped += r1.skipped; totalFailed += r1.failed;

  // Batch 2
  const r2 = await importCards(BATCH2, 'Batch 2: Deployment & Privacy');
  totalCreated += r2.created; totalSkipped += r2.skipped; totalFailed += r2.failed;

  // Batch 3
  const r3 = await importCards(BATCH3, 'Batch 3: Career & Meta-Learning');
  totalCreated += r3.created; totalSkipped += r3.skipped; totalFailed += r3.failed;

  console.log(`\n[DONE] Created: ${totalCreated}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`);
  console.log(`Total cards: ${await prisma.card.count()}`);

  await prisma.$disconnect();
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
