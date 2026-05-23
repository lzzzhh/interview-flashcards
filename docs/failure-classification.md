# Search Failure Classification (22 remaining ✗, normalized baseline 2026-05-23)

> Reference: docs/official-baseline-normalized.md (430 search cases, Top15 88.6%)
> Pre-normalization: 31 ✗ out of 437 cases. After normalization: 22 ✗ out of 430 cases.
> 7 excluded cases (career_advice, business_decision, open_qa, too_ambiguous) removed from Search Benchmark.
> 2 resolved via primaryId fixes (风控建模, 传统ML — new cards now primaryIds).

## Category Legend

- **coverage_gap** — no card exists for this topic. Needs new card.
- **embedding_blind_spot** — bge-m3 vector≈0. Structural embedding issue, not fixable by tuning.
- **cross_module_expectation** — card exists but primaryId / deck mapping may be off.
- **ambiguous_query** — query too vague, should rewrite benchmark or accept as ambiguous.
- **label_or_keyword_audit** — card exists but searchKeywords / title don't match the query.

---

## Classification

### coverage_gap (13 queries)

| # | Query | Missing Cards | Suggested Card |
|---|-------|---------------|----------------|
| 1 | 什么时候用图数据库 | stats-? | 图数据库使用场景 (Neo4j/JanusGraph) |
| 2 | CAP理论为什么不能三者兼得 | ? | CAP定理 trade-off (distributed systems) |
| 3 | ETL ELT数据集成区别 | stats-154,stats-176 | ETL vs ELT 数据集成对比 |
| 4 | ETL流程pipeline最佳实践 | stats-154,stats-176 | ETL pipeline 最佳实践 |
| 5 | 什么是指标体系北极星 | ? | 北极星指标 / OKR / KPI 体系 |
| 6 | 风控建模一般用什么算法 | ? | 风控建模常用算法 (逻辑回归/XGBoost/图算法) |
| 7 | 图像分割手机端部署选什么模型 | ? | 移动端图像分割模型选型 (MobileNet/DeepLab) |
| 8 | 用AI回复客户邮件隐私怎么保证 | ? | AI 客服隐私保护 (PII redaction/本地推理) |
| 9 | 改简历准备大厂技术面 | ? | 技术面试简历准备 |
| 10 | 机器学习面试记了又忘怎么办 | ? | ML 面试知识巩固 / 间隔重复 |
| 11 | 噪声标签怎么训练模型 | ? | 噪声标签训练方法 (label smoothing/robust loss) |
| 12 | 数据和直觉不一致听谁的 | ? | 数据驱动 vs 直觉决策 |
| 13 | 传统ML还有没有必要学 | ? | ML vs DL 适用场景对比 |

### embedding_blind_spot (5 queries)

| # | Query | Why blind |
|---|-------|-----------|
| 1 | 为什么要shuffle数据 | 口语化 + "shuffle" 向量=0 |
| 2 | CLIP多模态对比学习 | 中英混合 + 专有名词 |
| 3 | Chain-of-Thought在GPT4中 | 缩写 + 中英混合 |
| 4 | few-shot为什么给例子就能学 | 缩写 + 口语化 |
| 5 | Momentum为什么能加速收敛 | 术语向量弱 |

### cross_module_expectation (6 queries)

| # | Query | Issue |
|---|-------|-------|
| 1 | Mini Batch vs Full Batch训练 | primaryIds 可能错配到错误 deck |
| 2 | 离线评估和在线实验的差异 | 跨 A/B testing + ML eval |
| 3 | ONNX TensorRT哪个快 | 跨 deployment + DL inference |
| 4 | LangChain和LlamaIndex对比 | 跨 agent + llm frameworks |
| 5 | 生成模型和判别模型区别 | 跨 GAN + classification theory |
| 6 | 参数太多模型太复杂怎么办 | 跨 regularization + architecture design |

### ambiguous_query (2 queries)

| # | Query | Issue |
|---|-------|-------|
| 1 | 迭代 | 过于简短，可能指迭代开发/ML迭代/数学迭代 |
| 2 | 时间序列季节性怎么处理 | "季节性"可能指seasonal adjustment或特征工程 |

### label_or_keyword_audit (5 queries)

| # | Query | Issue |
|---|-------|-------|
| 1 | ML里如何处理缺失值 | card ml-10 可能关键词不足 |
| 2 | 数据太少训练不好怎么办 | 相关卡片可能缺少 "数据不足/few-shot" 关键词 |
| 3 | 协方差和相关系数公式老搞混 | stats 相关卡片可能缺少 "公式" 关键词 |
| 4 | 时间序列节假日效应怎么处理 | 缺少 "节假日/假期效应" 关键词 |
| 5 | 新功能是否对留存有正向影响 | 缺少 "留存/retention/新功能" 关键词 |

---

## Priority Actions

1. **coverage_gap**: Create 13 new cards. This is the highest-leverage fix — pure recall improvement, no algorithm change.
2. **label_or_keyword_audit**: Audit searchKeywords on existing cards. Verify 5 queries hit the expected cards.
3. **cross_module_expectation**: Review primaryIds on 6 queries. May need secondaryIds expansion.
4. **embedding_blind_spot**: Do NOT fix algorithmically. Wait for multi-field embedding or keyword-field boost.
5. **ambiguous_query**: Accept as-is for 2 queries. Consider rewording benchmark queries.
