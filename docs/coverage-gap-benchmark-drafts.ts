// docs/coverage-gap-benchmark-drafts.ts
// Draft test cases for 13 resolved coverage_gap topics.
// Review primaryIds/secondaryIds, then merge into src/evaluation/test-cases.ts.

export const COVERAGE_GAP_DRAFTS = [
  // ── CAP 理论 ──
  {
    query: "CAP理论为什么不能三者兼得",
    group: "长句-分布式",
    primaryIds: ["ml-190", "ml-191"],
    secondaryIds: ["ml-192"],
    acceptableDecks: ["machine-learning"],
    acceptableConcepts: ["CAP", "一致性", "可用性|分区容错", "分布式"],
  },

  // ── 图数据库 ──
  {
    query: "什么时候用图数据库",
    group: "概念-数据工程",
    primaryIds: ["dl-33", "dl-34"],
    secondaryIds: ["dl-35"],
    acceptableDecks: ["deep-learning"],
    acceptableConcepts: ["图数据库", "Neo4j|Cypher", "关系型.*对比|选型", "社交网络|知识图谱"],
  },

  // ── 分布式锁 ──
  {
    query: "分布式锁怎么实现",
    group: "概念-分布式",
    primaryIds: ["ml-193", "ml-194"],
    secondaryIds: ["ml-195"],
    acceptableDecks: ["machine-learning"],
    acceptableConcepts: ["分布式锁", "Redis.*SETNX|ZooKeeper|etcd", "互斥|死锁"],
  },

  // ── ETL / ELT / Pipeline ──
  {
    query: "ETL ELT数据集成区别",
    group: "概念-数据工程",
    primaryIds: ["ml-196"],
    secondaryIds: ["ml-197", "ml-198"],
    acceptableDecks: ["machine-learning"],
    acceptableConcepts: ["ETL|ELT", "数据管道|Pipeline", "dbt|Airbyte|Fivetran"],
  },
  {
    query: "ETL流程pipeline最佳实践",
    group: "长句-数据工程",
    primaryIds: ["ml-197"],
    secondaryIds: ["ml-196", "ml-198"],
    acceptableDecks: ["machine-learning"],
    acceptableConcepts: ["Pipeline|管道", "幂等|回填|监控", "Airflow|dbt", "数据质量"],
  },

  // ── 北极星指标 ──
  {
    query: "什么是指标体系北极星",
    group: "概念-产品",
    primaryIds: ["wp-77", "wp-78"],
    secondaryIds: ["wp-79"],
    acceptableDecks: ["workplace"],
    acceptableConcepts: ["北极星指标|NSM", "KPI|OKR", "产品指标"],
  },

  // ── 风控建模 ──
  {
    query: "风控建模一般用什么算法",
    group: "长句-应用",
    primaryIds: ["ml-199"],
    secondaryIds: ["ml-200", "ml-201"],
    acceptableDecks: ["machine-learning"],
    acceptableConcepts: ["风控|欺诈检测|信用评分", "XGBoost|逻辑回归", "反欺诈|异常检测"],
  },

  // ── 图像分割手机端部署 ──
  {
    query: "图像分割手机端部署选什么模型",
    group: "长句-部署",
    primaryIds: ["dl-36", "dl-37"],
    secondaryIds: ["dl-38"],
    acceptableDecks: ["deep-learning"],
    acceptableConcepts: ["移动端|手机端", "图像分割|语义分割", "MobileNet|TFLite|CoreML", "轻量化|量化"],
  },

  // ── ONNX / TensorRT 部署 ──
  {
    query: "ONNX TensorRT哪个快",
    group: "混合-部署",
    primaryIds: ["dl-39", "dl-40"],
    secondaryIds: ["dl-41"],
    acceptableDecks: ["deep-learning"],
    acceptableConcepts: ["ONNX", "TensorRT", "推理加速|量化", "部署优化"],
  },

  // ── AI 客服邮件隐私 ──
  {
    query: "用AI回复客户邮件隐私怎么保证",
    group: "长句-安全",
    primaryIds: ["agent-27", "agent-28"],
    secondaryIds: ["agent-29"],
    acceptableDecks: ["agent"],
    acceptableConcepts: ["隐私|PII|脱敏", "AI客服|邮件", "本地推理|云端推理", "GDPR|合规"],
  },

  // ── 时间序列节假日效应 ──
  {
    query: "时间序列节假日效应怎么处理",
    group: "长句-统计学",
    primaryIds: ["stats-200", "stats-201"],
    secondaryIds: ["stats-202"],
    acceptableDecks: ["statistics"],
    acceptableConcepts: ["时间序列", "节假日|季节效应", "Prophet|STL", "预测"],
  },

  // ── 改简历 / 大厂技术面 ──
  {
    query: "改简历准备大厂技术面",
    group: "长句-职场",
    primaryIds: ["wp-80", "wp-81"],
    secondaryIds: ["wp-82"],
    acceptableDecks: ["workplace"],
    acceptableConcepts: ["简历|面试", "STAR|量化", "技术面|行为面试", "大厂|求职"],
  },

  // ── ML 面试记了又忘 ──
  {
    query: "机器学习面试记了又忘怎么办",
    group: "长句-学习",
    primaryIds: ["ml-202", "ml-203"],
    secondaryIds: ["ml-204"],
    acceptableDecks: ["machine-learning"],
    acceptableConcepts: ["面试|记忆", "间隔重复|闪卡", "ML.*知识体系|费曼", "复习|学习方法"],
  },

  // ── 传统 ML 还有没有必要学 ──
  {
    query: "传统ML还有没有必要学",
    group: "长句-学习",
    primaryIds: ["ml-205", "ml-206"],
    secondaryIds: ["ml-207"],
    acceptableDecks: ["machine-learning"],
    acceptableConcepts: ["传统ML|经典机器学习", "XGBoost|SVM|决策树", "深度学习.*对比|选型", "学习路线|入行"],
  },
];
