# 基于 Home Credit 2024 的稳定性驱动信贷风控项目文档

## 1. 项目定位

项目名称建议：

**基于 Home Credit 2024 的稳定性驱动信贷风控评分与策略决策系统**

这个项目的目的不是单纯刷 Kaggle leaderboard，而是把竞赛高分方案改造成更适合求职展示的风控建模闭环：

- 复现 Kaggle Top 1% / 1st place 方案中的核心机器学习做法：多表聚合、GBDT、CatBoost、DNN、ensemble、Gini stability。
- 弱化竞赛型 metric hack，把它改造成业务可解释的时间稳定性建模、漂移监控和策略仿真。
- 结合你的内部反欺诈实习经历，展示更泛化的风控能力：风险识别、模型排序、策略分层、误伤控制、人工审核、模型监控。

一句话项目主线：

> 复现 Home Credit 2024 高分信贷风控方案，并将竞赛型模型改造成包含 OOT 验证、稳定性约束、深度表征、SHAP reason code、approve/review/reject 策略仿真和线上监控的通用风控建模系统。

## 2. 数据集是什么

数据集：**Kaggle - Home Credit - Credit Risk Model Stability**

官方链接：

- Competition: https://www.kaggle.com/competitions/home-credit-credit-risk-model-stability
- Data: https://www.kaggle.com/competitions/home-credit-credit-risk-model-stability/data

竞赛目标：

- 预测贷款申请客户是否更可能违约。
- 评估指标不仅看预测能力，也强调模型在时间维度上的稳定性。

核心字段：

| 字段 | 含义 | 用途 |
|---|---|---|
| `case_id` | 每笔贷款申请的唯一 ID | 多表 join 主键 |
| `target` | 是否违约的二分类标签 | 建模目标 |
| `date_decision` | 贷款审批决策日期 | 时间切分、OOT（Out-of-Time）验证 |
| `WEEK_NUM` | 周编号 | 稳定性评估、按周 Gini |
| `MONTH` | 月份 | 月度监控、cohort 分析 |

数据结构：

- 数据提供 `.csv` 和 `.parquet` 两种格式。
- `train_base.parquet` 是主表，包含 `case_id`、`target`、时间字段等基础信息。
- 其他表是特征表，来自内部信息和外部征信/历史贷款/申请行为等多源数据。
- 表分为不同 depth：
  - depth 0：一行对应一个 `case_id`，可直接 join。
  - depth 1 / depth 2：一对多历史记录，需要按 `case_id` 聚合。

适合做风控项目的原因：

- 是 2024 年 Kaggle 正式风控比赛，足够新。
- 场景是信贷风险，比交易欺诈更泛化。
- 有时间字段和稳定性指标，适合讲 OOT、PSI、Vintage、MOB、模型漂移。
- 多表结构复杂，能展示真实风控特征工程能力。
- 既能做评分卡/LightGBM/CatBoost，也能加入 MLP、AutoEncoder、FT-Transformer 等深度学习模块。

### 2.1 术语口径与面试注意点

| 文档术语 | 面试口径 | 说明 |
|---|---|---|
| OOT 验证 | OOT（Out-of-Time）验证 | OOT 指训练集之后的另一段时间样本，不等于真正未知的“未来数据”。项目中用后期 `WEEK_NUM` 作为 OOT，模拟上线后的时间外泛化。 |
| bad rate | 逾期率 / 坏账率 | 文档和代码表可以保留 `bad_rate` 字段名；口头表达建议说“逾期率”或“坏账率”，更贴近风控场景。 |
| Vintage / MOB | Vintage 分析 + MOB（Month-on-Book） | 概念正确，但要受标签表现期约束。若 Kaggle 标签窗口不足以形成 6-12 个月完整表现期，则只做 cohort / MOB 视角的稳定性分析，并在报告中说明局限。 |

## 3. 为什么选它，而不是 IEEE-CIS

你之前实习偏内部反欺诈，已经能证明你接触过风险业务。如果主项目继续做 IEEE-CIS 交易欺诈，会让你的画像偏窄：反欺诈、黑产识别、交易异常。

Home Credit 2024 更适合作为唯一主项目：

| 维度 | IEEE-CIS | Home Credit 2024 |
|---|---|---|
| 场景 | 支付/交易欺诈 | 信贷违约风险 |
| 泛化性 | 偏反欺诈 | 泛风控、信贷、金融科技 |
| 岗位关键词 | 交易欺诈、设备图、黑产 | 信贷风控、评分卡、模型稳定性、审批策略 |
| 可解释性 | 字段高度脱敏，解释偏弱 | 可讲客户、申请、历史贷款、征信、审批策略 |
| 稳定性 | 可自行构造 | 竞赛本身强调时间稳定 |
| 简历价值 | 补充图风控很好 | 更适合唯一主项目 |

最终选择：

> 主项目选择 Home Credit 2024，IEEE-CIS 可以只作为图风控补充材料，不放在简历主项目里抢叙事空间。

## 4. 如何复现 Top 1% / 1st Place 方法

公开资料中，1st place 方案可概括为两阶段：

1. **Phase 1 - Machine Learning**
   - 多表聚合特征。
   - StratifiedGroupKFold 类交叉验证。
   - LightGBM、CatBoost、DNN / LightAutoML。
   - Ensemble。

2. **Phase 2 - Metric Hack**
   - 利用与 `WEEK_NUM` 高相关的日期差异推测隐藏测试集时间位置。
   - 对预测分数做修正，以适配竞赛指标。

项目里应该复现 Phase 1，分析 Phase 2，但不把 metric hack 作为业务主线。

### 4.1 数据下载

```bash
pip install kaggle
kaggle competitions download -c home-credit-credit-risk-model-stability
unzip home-credit-credit-risk-model-stability.zip -d data/raw/home-credit-2024
```

注意：

- 需要 Kaggle 账号。
- 需要先在网页上加入比赛并同意规则。
- `kaggle.json` 放在 `~/.kaggle/kaggle.json`。

建议项目默认使用 parquet：

```text
data/raw/home-credit-2024/parquet_files/train/
data/raw/home-credit-2024/parquet_files/test/
```

### 4.2 数据读取与多表聚合

目标：把多表数据聚合成一张以 `case_id` 为粒度的建模宽表。

实现路线：

1. 读取 `train_base.parquet`。
2. 扫描所有 depth 0 / depth 1 / depth 2 表。
3. depth 0 表直接按 `case_id` left join。
4. depth 1 / depth 2 表按 `case_id` 聚合。
5. 对不同字段后缀做类型识别。

字段后缀处理：

| 后缀 | 可能含义 | 处理方式 |
|---|---|---|
| `P` | DPD / 逾期相关 | 数值 |
| `A` | 金额 | 数值 |
| `D` | 日期 | 转为距 `date_decision` 的天数 |
| `M` | 类别 mask | 类别 |
| `L` | 类别/离散变量 | 类别或数值，按取值判断 |
| `T` | 文本/类别 | 类别 |

基础聚合函数：

```python
AGGS_NUM = ["mean", "max", "min", "std", "sum", "last", "first"]
AGGS_CAT = ["last", "first", "nunique", "mode"]
AGGS_DATE = ["max", "min", "last", "first"]
```

Top 1% 复现时需要加入的高分常见聚合：

- `max`
- `min`
- `avg / mean`
- `var`
- `first`
- `last`
- `max - min`
- 最近一次历史记录特征
- 历史记录条数
- 过去 N 次申请/贷款/查询的统计

### 4.3 特征工程

基础特征：

- 贷款申请金额、年金、历史贷款金额。
- 外部征信查询次数。
- 还款逾期 DPD。
- 历史申请状态。
- 客户年龄、就业、教育、婚姻等静态信息。
- 历史贷款/申请次数、拒绝次数、取消次数。

时间特征：

- `date_decision` 的 month / week / weekday。
- 日期字段与 `date_decision` 的差值。
- 最近一次历史贷款距当前申请的天数。
- 历史记录时间跨度。

风控衍生特征：

- 历史逾期最大值。
- 最近 3/6/12 个月申请次数。
- 历史拒绝率。
- 历史未结清贷款数。
- 征信查询密度。
- 当前申请金额 / 历史收入或历史贷款金额。
- 申请金额与历史贷款均值、最大值的偏离程度。

稳定性特征：

- 特征按 `WEEK_NUM` 的缺失率变化。
- 特征按 `WEEK_NUM` 的均值/分位数变化。
- 特征 PSI。
- 高漂移特征标记。

### 4.4 验证集设计

不要使用随机切分作为主验证方式。

建议同时做三套验证：

| 验证方式 | 用途 |
|---|---|
| StratifiedGroupKFold | 复现竞赛高分方案 |
| 按 `WEEK_NUM` 时间切分 | 模拟真实上线后的 OOT |
| 最近若干周 holdout | 验证模型对时间漂移的鲁棒性 |

推荐主评估方式：

```text
训练：早期 WEEK_NUM
验证：中后期 WEEK_NUM
测试：最后若干 WEEK_NUM
```

这样面试时可以说：

> 我没有只做随机切分，因为风控模型上线后面对的是训练集之后的新时间段客群。项目用后期 WEEK_NUM 构造 OOT（Out-of-Time）验证，重点评估时间外泛化和模型稳定性。

### 4.5 模型复现

复现组模型：

| 模型 | 目的 |
|---|---|
| Logistic Regression | 可解释线性基线 |
| WOE Scorecard | 传统信贷评分卡 |
| LightGBM | 强表格模型 |
| CatBoost | 类别变量强基线 |
| XGBoost | GBDT 补充 |
| DNN / MLP | 深度学习 baseline |
| Ensemble | 复现高分方案 |

训练指标：

- AUC
- Gini = `2 * AUC - 1`
- KS
- PR-AUC
- F1
- Lift@5%
- Lift@10%
- Weekly Gini mean
- Weekly Gini std
- Gini stability score

稳定性指标可以实现为项目内版本：

```text
stability_score = mean_weekly_gini
                  - 0.5 * std_weekly_gini
                  - slope_penalty
```

其中 `slope_penalty` 惩罚后期周表现持续下降。

### 4.6 Ensemble 复现

先做简单 ensemble，不一上来复杂 stacking。

推荐顺序：

1. 单模型：
   - LightGBM
   - CatBoost
   - MLP
2. 简单平均：
   - `0.5 * CatBoost + 0.4 * LightGBM + 0.1 * MLP`
3. Rank average：
   - 对每个模型预测分 rank normalize 后平均。
4. OOF stacking：
   - 用 OOF 预测训练二层 Logistic / Ridge。

项目里重点比较：

| 版本 | 预期意义 |
|---|---|
| LightGBM single | 强基线 |
| CatBoost single | 类别变量强基线 |
| MLP single | 深度学习 baseline |
| LGBM + CatBoost | 主 ensemble |
| LGBM + CatBoost + MLP | 加入深度学习补充 |
| Ensemble + stability selection | 最终复现版 |

### 4.7 Metric Hack 如何处理

竞赛 1st place 的 Phase 2 是 metric hack。项目里建议：

- 复现一版作为“竞赛技巧分析”。
- 不把它作为最终业务模型。
- 在报告里明确说明：真实业务不能依赖隐藏测试集时间推断和人为调分。

你的表达应该是：

> 我复现并理解了 1st place 的 metric hack，但在项目魔改中将其替换为业务可落地的时间稳定性建模和漂移监控。

这会显得你既懂竞赛，也懂业务边界。

## 5. 如何魔改成适合你的风控项目

你的魔改目标：

> 从“竞赛高分模型”改造成“可解释、稳定、可运营的信贷风控决策系统”。

### 5.1 魔改一：稳定性驱动模型选择

不要只按 AUC 选模型。

最终模型选择标准不写死为唯一答案，而是设计成可配置的业务权重。默认权重用于主实验，另外至少跑一组 sensitivity 权重，证明模型选择对业务偏好是否敏感。

默认权重：

```text
final_score =
    0.45 * AUC
  + 0.20 * KS
  + 0.20 * stability_score
  + 0.15 * strategy_profit_score
```

备选权重：

| 权重方案 | AUC | KS | stability_score | strategy_profit_score | 适用偏好 |
|---|---:|---:|---:|---:|---|
| ranking_first | 0.45 | 0.20 | 0.20 | 0.15 | 更重视模型排序能力，适合先做模型筛选 |
| stability_first | 0.30 | 0.15 | 0.40 | 0.15 | 更重视 OOT 稳定性，适合客群漂移明显的业务 |
| profit_first | 0.30 | 0.15 | 0.20 | 0.35 | 更重视策略收益，适合已有明确成本收益假设的业务 |

面试回答：

> 权重不是行业固定公式，而是把模型选择从“单一 AUC 最大”改成可解释的多目标选择。项目会跑 ranking_first、stability_first、profit_first 三组 sensitivity，对比最终模型是否变化；如果模型选择对权重极敏感，就说明这个方案上线前需要更谨慎。

输出每个模型：

- 整体 AUC / KS。
- OOT（Out-of-Time）AUC / KS。
- Weekly Gini 均值。
- Weekly Gini 标准差。
- 后期周表现下降斜率。
- PSI。
- 策略收益。

这样你能说：

> 模型不是按单点 AUC 选择，而是综合排序能力、时间稳定性、客群漂移和策略收益。

### 5.2 魔改二：PSI + OOT + Vintage / MOB

监控模块必须做。

输出：

- 分周 AUC / KS / Gini。
- 分周逾期率 / 坏账率。
- 训练集 vs OOT 的 score PSI。
- Top 特征 PSI。
- 按申请月份 cohort 的 Vintage 表。
- MOB1 / MOB2 / MOB3 风险表现。

面试解释：

> 信贷风控标签有成熟期，不能直接把不同放款月份的坏账率混在一起比较，所以项目加入 Vintage/MOB 观察 cohort 表现。

数据限制说明：

> Vintage/MOB 需要足够长的贷后表现期。Home Credit 2024 的 `target` 是比赛方已定义好的违约标签，不一定暴露完整还款表现窗口。因此实际实现时先验证 `MONTH`、`WEEK_NUM` 和标签窗口是否支持有意义的 MOB 曲线；如果表现期不足，就把这一部分降级为“按申请 cohort 的逾期率/坏账率稳定性分析”，并在报告中明确局限。

### 5.3 魔改三：深度学习模块

不要堆很多神经网络。建议实现两个必做，一个选做。

#### 必做 1：MLP baseline

输入：

- 数值特征：标准化。
- 类别特征：embedding。
- 缺失值：missing indicator + imputation。

结构：

```text
categorical embeddings
numeric features
concat
MLP: 512 -> 256 -> 128 -> 1
BatchNorm + Dropout
BCEWithLogitsLoss
```

作用：

- 作为深度学习 baseline。
- 对比 GBDT 在 tabular 风控数据上的优势。

#### 必做 2：Denoising AutoEncoder 风险 embedding

训练方式：

- 输入客户多表聚合特征。
- 随机 mask 部分特征。
- 让 AutoEncoder 重建原始特征。
- 取 bottleneck 作为 `customer_risk_embedding`。

落地规格：

| 项目 | 建议设置 |
|---|---|
| 输入特征 | 先使用筛选后的 300-800 个建模特征；数值特征做 robust scaling，类别特征先做 count/frequency encoding 或 target encoding，避免超高维 one-hot 直接进 DAE |
| 缺失处理 | 数值缺失填中位数并加 missing indicator；类别缺失作为 `missing` 类别 |
| mask 策略 | 训练时随机 mask 10%-20% 的输入元素，主实验用 15%；额外可做 feature-group mask，随机遮住一组历史贷款或征信相关特征 |
| 网络结构 | encoder: input -> 512 -> 256 -> bottleneck；decoder: bottleneck -> 256 -> 512 -> input |
| bottleneck 维度 | 跑 32 / 64 / 128 三档，主实验默认 64，用 OOT AUC 和 reconstruction error 分布选 |
| loss | 数值特征用 MSE/Huber，类别编码后的连续输入用 MSE；若后续保留类别 embedding，可拆成数值重建 + 类别交叉熵 |
| 训练方式 | 自监督预训练，只用训练集特征；early stopping 监控验证集 reconstruction loss |
| embedding 使用 | 训练完成后冻结 encoder，生成 `dae_emb_0...dae_emb_k` 拼接到 LightGBM/CatBoost；GBDT 不和 encoder 端到端 fine-tune |
| 异常度使用 | reconstruction error 作为单样本分布外/不确定性信号，进入二维策略矩阵 |

使用方式：

- `LightGBM baseline`
- `LightGBM + DAE embedding`
- `CatBoost baseline`
- `CatBoost + DAE embedding`

项目价值：

> 使用自监督 AutoEncoder 学习客户多源行为的低维风险表征，再与 GBDT 拼接，提升模型对高缺失、多表、稀疏历史记录的鲁棒性。

#### 选做：FT-Transformer

如果时间够，再加 FT-Transformer。

用途：

- 把每个字段当成 token。
- 用 attention 学字段交互。
- 对比其 OOT 稳定性和高风险捕获能力。

注意：

- 不要承诺 FT-Transformer 一定赢。
- 更真实的结论是：树模型仍是主模型，深度学习 embedding 作为辅助特征或 ensemble 成员。

### 5.4 魔改四：Approve / Review / Reject 策略仿真

模型分数必须转成业务动作。

三段策略：

| 分数区间 | 动作 | 说明 |
|---|---|---|
| 低风险 | approve | 自动通过 |
| 中风险 | review | 人工审核 / 补充验证 |
| 高风险 | reject | 拒绝 |

三套策略：

| 策略 | 特征 |
|---|---|
| 保守策略 | 拒绝更多，坏账更低，通过率下降 |
| 均衡策略 | 控制坏账和通过率 |
| 激进策略 | 通过更多，收益更高但坏账压力更大 |

输出指标：

- approve_rate
- review_rate
- reject_rate
- approved_bad_rate
- bad_capture_rate
- false_positive_rate
- review_cost
- expected_profit_per_1k

收益函数示例：

```text
profit =
    approved_good * good_profit
  - approved_bad * bad_loss
  - reviewed_cases * review_cost
  - rejected_good * opportunity_cost
```

策略仿真参数说明（标注为行业粗估，非真实业务数据；所有参数均为可调变量）：

| 参数 | 默认值 | 含义 | 粗估依据 |
|---|---|---|---|
| `good_profit` | 2,000 | 每笔好客户预期收益 | 假设贷款本金 5 万、利差约 4%，简化为单笔利润 |
| `bad_loss` | 15,000 | 每笔坏客户预期损失 | 假设平均贷款本金损失 30%，含催收成本 |
| `review_cost` | 50 | 每笔人工审核成本 | 含审核人员工时和系统成本 |
| `opportunity_cost` | 500 | 每笔误拒好客户的间接损失 | 含获客成本 + 潜在 LTV 损失 |

项目输出策略收益时同步给出参数 ±50% 波动区间：

- 保守估计：`good_profit` 减半、`bad_loss` 加倍。
- 乐观估计：`good_profit` 加倍、`bad_loss` 减半。
- 面试时可以说：“这些参数不是从数据里学的，而是业务假设。我把它们做成可调变量，让策略收益可以在不同风险偏好下做敏感性分析。”

### 5.5 魔改五：二维策略矩阵

不要只看模型分。

引入两个维度：

1. 违约风险分。
2. 单样本不确定性 / 漂移风险分。

策略矩阵：

| 违约风险 | 不确定性 / 漂移风险 | 策略 |
|---|---|---|
| 低 | 低 | approve |
| 低 | 高 | review |
| 高 | 低 | reject |
| 高 | 高 | reject + 加强验证 |

这里要区分群体指标和单样本指标。最终二维策略的第二维以单样本不确定性为主，群体漂移只作为辅助标记。

主方案：

- **Ensemble disagreement**：同一客户在 LightGBM、CatBoost、MLP、DAE+GBDT 等模型上的预测方差或最大最小差。这是真正的单样本不确定度。
- **AutoEncoder reconstruction error**：客户样本无法被 DAE 良好重建，说明其特征组合偏离训练分布，可作为单样本异常度。

辅助方案：

- **cohort PSI 标记**：样本所在 `WEEK_NUM` / `MONTH` / 申请 cohort 与训练分布差异较大时，将该群组风险标记映射到个体。
- **高漂移特征命中数**：先在群体层面识别高 PSI 特征，再统计单个样本是否大量命中这些高漂移特征的极端分箱。这个信号可用，但不要作为主方案。

不建议直接落到单样本的指标：

- “模型分在 OOT 周期是否不稳定”本质是模型/时间段层面的评估，不应直接说成单样本稳定性分。可以用于模型选择和监控，不作为单笔申请的第二维主信号。

这一点很适合你：

> 反欺诈实习里的“异常/不确定/人工复核”思路，可以迁移到信贷风控里：不是只看违约概率，还要看模型是否对这个客户足够确定。如果多个模型分歧大，或 AutoEncoder 认为该客户不像训练分布，就进入人工复核。

### 5.6 魔改六：Explainability / Reason Code

输出两类解释：

1. 全局解释：
   - SHAP summary。
   - 特征重要性。
   - 分箱逾期率 / 坏账率。
   - IV / WOE。

2. 单客户解释卡片：
   - `case_id`
   - 模型分数。
   - 策略动作。
   - Top 正向风险因素。
   - Top 负向保护因素。
   - 是否因高漂移进入 review。
   - reason code。

示例：

```text
case_id: 123456
score: 0.82
action: review
top risk reasons:
  1. 近 90 天征信查询次数高
  2. 历史最大逾期天数高
  3. 当前申请金额显著高于历史均值
protective reasons:
  1. 历史还款记录稳定
  2. 收入水平较高
stability warning:
  ensemble disagreement 较高，且 DAE reconstruction error 超过 P95，进入人工复核
```

### 5.7 魔改七：模型监控 Dashboard

最后输出一个可视化 dashboard 或 HTML 报告。

模块：

- 数据概览。
- 模型效果。
- 稳定性监控。
- 策略仿真。
- 单样本解释。
- 特征漂移。
- Vintage / MOB。

核心图：

- ROC / PR curve。
- KS 曲线。
- Lift chart。
- Weekly AUC / Gini。
- Score distribution by week。
- PSI Top features。
- Strategy action mix。
- Vintage 逾期率 / 坏账率 heatmap。
- SHAP summary。

## 6. 项目目录设计

```text
home-credit-risk-stability/
├── README.md
├── config/
│   └── project_config.yaml
├── data/
│   ├── raw/
│   ├── interim/
│   └── processed/
├── notebooks/
│   ├── 01_eda.ipynb
│   ├── 02_reproduce_top1_features.ipynb
│   └── 03_business_modification_analysis.ipynb
├── scripts/
│   ├── download_data.py
│   ├── build_features.py
│   ├── train_reproduce.py
│   ├── train_deep_models.py
│   ├── run_strategy_simulation.py
│   └── export_report.py
├── src/
│   └── home_credit_risk/
│       ├── data.py
│       ├── features.py
│       ├── validation.py
│       ├── metrics.py
│       ├── models_gbdt.py
│       ├── models_deep.py
│       ├── stability.py
│       ├── strategy.py
│       ├── explain.py
│       └── report.py
├── artifacts/
│   ├── tables/
│   ├── figures/
│   └── models/
└── reports/
    ├── project_report.md
    └── project_report.pdf
```

## 7. 实验矩阵

### 7.1 复现实验

| 实验 | 模型 | 特征 | 目标 |
|---|---|---|---|
| R1 | LightGBM | 基础多表聚合 | 强基线 |
| R2 | CatBoost | 基础多表聚合 | 类别强基线 |
| R3 | MLP | 预处理宽表 | DL baseline |
| R4 | LightGBM + CatBoost | rank average | 复现高分 ensemble |
| R5 | LGBM + CatBoost + MLP | weighted ensemble | 复现 Top 1% ML 部分 |

### 7.2 魔改实验

| 实验 | 改动 | 目标 |
|---|---|---|
| M1 | OOT + weekly stability selection | 替代 metric hack |
| M2 | PSI + feature drift filter | 提升稳定性 |
| M3 | Denoising AutoEncoder embedding | 加入深度表征 |
| M4 | LightGBM + DAE embedding | 验证 embedding 增益 |
| M5 | Ensemble disagreement uncertainty | 不确定性进入 review |
| M6 | approve/review/reject 策略 | 模型到业务动作 |
| M7 | reason code + SHAP card | 单样本解释 |
| M8 | Vintage / MOB dashboard | 信贷风控监控 |

### 7.3 消融实验

消融实验用于回答“哪个魔改模块贡献最大”，不要只做堆叠式实验。

| 实验 | 操作 | 观察指标 |
|---|---|---|
| A0 | GBDT ensemble baseline | AUC、KS、OOT AUC、weekly Gini、策略收益 |
| A1 | 去掉 OOT stability 约束 | 看整体 AUC 是否升高、OOT/weekly stability 是否下降 |
| A2 | 去掉 DAE embedding | 看深度表征对 OOT、Lift、高风险捕获和策略收益的边际贡献 |
| A3 | 去掉 PSI / 漂移过滤 | 看高漂移特征是否导致后期周表现下降 |
| A4 | 去掉单样本不确定性策略，只按违约分 approve/review/reject | 看 review 命中率、放行逾期率/坏账率、误伤成本变化 |
| A5 | Full model：稳定性选择 + DAE embedding + PSI 辅助 + 不确定性二维策略 | 作为最终业务化方案 |

消融表至少输出：

- AUC / KS。
- OOT AUC / OOT KS。
- weekly Gini mean / std。
- score PSI。
- Lift@5% / Lift@10%。
- approve_rate / review_rate / reject_rate。
- 放行逾期率 / 坏账率。
- bad_capture_rate。
- expected_profit_per_1k。

### 7.4 敏感性分析

敏感性分析用于验证模型选择和策略结论是否对参数假设稳健，不放在魔改实验里混淆“改动”和“分析”。

| 实验 | 操作 | 目标 |
|---|---|---|
| S1 | 模型选择权重 sensitivity（ranking_first / stability_first / profit_first 三组权重对比） | 验证最佳模型在不同业务偏好下是否一致；若结果对权重极敏感，说明方案上线前需更谨慎 |
| S2 | 策略成本参数 sensitivity（good_profit / bad_loss / review_cost ±50% 波动） | 回答“策略收益结论是否依赖特定的成本假设” |

## 8. 最终交付物

| 文件 | 在报告中的用途 |
|---|---|
| `model_metrics.csv` | 复现模型 vs 魔改模型的完整指标对比 |
| `model_selection_sensitivity.csv` | 证明模型选择在合理权重范围内稳健 |
| `ablation_results.csv` | 回答“哪个改动贡献最大” |
| `weekly_stability_metrics.csv` | 证明模型在时间维度上不崩 |
| `psi_table.csv` | 特征漂移和分数漂移量化，用于监控和特征筛选 |
| `vintage_mob_table.csv` | cohort 维度稳定性分析（受标签窗口限制时降级为逾期率/坏账率稳定性） |
| `strategy_simulation.csv` | 三套策略（保守/均衡/激进）+ 参数敏感性波动区间的动作分布和收益 |
| `reason_code_samples.csv` | 单客户解释示例，展示可解释性闭环 |
| `shap_summary.png` | 全局特征重要性，支撑特征工程叙事 |
| `weekly_gini_trend.png` | 可视化模型在时间维度上的排序能力变化 |
| `strategy_action_mix.png` | 策略动作分布可视化 |
| `vintage_heatmap.png` | cohort × MOB 风险表现热力图 |
| 中文项目报告 PDF | 完整叙事载体，覆盖数据、复现、魔改、业务价值、上线监控 |

报告必须回答：

1. 数据集是什么，为什么适合泛风控。
2. Top 1% 方法复现了哪些部分。
3. Metric hack 为什么不作为业务主线。
4. 你如何把竞赛模型改造成业务风控系统。
5. 深度学习模型带来了什么，没带来什么。
6. 最终为什么选择某个模型/策略。
7. 如果上线，怎么监控。

## 9. 简历写法

项目标题：

**稳定性驱动的信贷风控评分与策略决策系统｜Home Credit 2024 Kaggle**

简历 bullet：

```text
- 复现 Kaggle Home Credit 2024 Top 1% 信贷风控方案，完成多表聚合特征、LightGBM/CatBoost/MLP ensemble 与 Gini stability 评估；基于后期 WEEK_NUM 构造 OOT（Out-of-Time）验证，避免随机切分导致的时间穿越。
- 将竞赛型 metric hack 改造为业务可落地的稳定性建模框架，引入 weekly AUC/KS/Gini、PSI、Vintage/MOB 候选分析和特征漂移监控，综合模型排序能力、稳定性和策略收益选择最终模型，并补充模型选择权重敏感性实验。
- 引入 Denoising AutoEncoder 学习客户风险 embedding，并与 LightGBM/CatBoost 融合；对比 baseline、GBDT ensemble、MLP、GBDT+DL embedding 在 AUC、KS、OOT、Lift 和每千笔预期收益上的表现。
- 构建 approve/review/reject 三段策略和保守/均衡/激进三套阈值方案，输出通过率、审核率、拒绝率、放行逾期率/坏账率、坏样本捕获率和每千笔预期收益，实现从模型分数到风控决策的闭环。
- 基于 SHAP 和 reason code 生成单客户风险解释卡片，覆盖 Top 风险因素、保护因素、漂移告警和策略动作，提升信贷审批场景下的可解释性。
```

## 10. 面试讲法

### 10.1 项目动机

> 我之前实习做的是内部反欺诈，偏异常行为识别和策略拦截。但我希望把风险识别能力泛化到更通用的金融风控，所以选择了 Home Credit 2024 这个信贷风险稳定性比赛。这个项目不是只追求 AUC，而是把模型排序、时间外验证、稳定性监控、解释性和策略仿真串成完整闭环。

### 10.2 为什么不用 metric hack 作为核心

> 1st place 方案里有 metric hack，这是竞赛环境下针对隐藏测试集和评价指标的技巧。我复现并分析了它，但没有把它作为业务主线。真实风控不能依赖隐藏测试集推断和人为调分，所以我把它替换成 OOT、PSI、weekly stability 和策略收益驱动的模型选择。

### 10.3 深度学习怎么解释

> Tabular 信贷数据上，GBDT 通常仍是最强主模型。我加入 MLP 和 Denoising AutoEncoder，不是为了证明神经网络一定更强，而是为了学习客户多源历史行为的低维风险表征。最终用深度 embedding 辅助 GBDT，并比较它在 OOT 稳定性和高风险捕获上的增益。

### 10.4 和实习经历怎么连接

> 我实习中接触过反欺诈策略和人工审核，知道模型分数不能直接等于业务动作。所以这个项目里我重点做了 approve/review/reject 策略仿真、误伤成本、人工审核成本和坏样本捕获率，把反欺诈里的策略意识迁移到了信贷风控。

## 11. 分阶段实施计划

### 第一阶段：复现竞赛 ML 主线

目标：

- 下载数据。
- 搭好 parquet 多表读取。
- 完成 depth 0/1/2 聚合。
- 训练 LightGBM / CatBoost。
- 输出 AUC、KS、Gini stability。

验收：

- 能生成一张建模宽表。
- 单模型能跑通。
- 每周 Gini 能计算。

### 第二阶段：复现 Top 1% ensemble

目标：

- 加入更多聚合特征。
- 加入 StratifiedGroupKFold。
- 加入 MLP baseline。
- 做 rank average / weighted ensemble。

验收：

- ensemble 优于单模型。
- 复现报告能解释和 Top 1% 方法的对应关系。

### 第三阶段：业务化魔改

目标：

- OOT 验证。
- PSI。
- Weekly stability。
- Vintage / MOB。
- approve/review/reject 策略。

验收：

- 不是只输出模型指标，而是输出风控策略指标。
- 能回答“为什么这个模型适合上线”。

### 第四阶段：深度学习增强

目标：

- MLP baseline。
- Denoising AutoEncoder embedding。
- LightGBM + embedding。
- 可选 FT-Transformer。

验收：

- 有深度学习对照实验。
- 能解释 DL 的收益和局限。

### 第五阶段：解释与报告

目标：

- SHAP。
- reason code。
- 单客户解释卡片。
- 中文 PDF 报告。

验收：

- 报告能讲清楚数据、复现、魔改、业务价值。
- 简历 bullet 能直接使用。

## 12. 风险与取舍

| 风险 | 解决方案 |
|---|---|
| 数据很大，运行慢 | 用 parquet + Polars/DuckDB；先 sample 调试，再全量跑 |
| 多表聚合复杂 | 先实现 depth 通用聚合，再加人工精选特征 |
| DL 不一定赢 | 把 DL 定位为 embedding 和对照，不强行作为主模型 |
| metric hack 不适合业务 | 复现分析即可，最终用稳定性建模替代 |
| 指标太多显得散 | 主线固定为：排序能力 + 稳定性 + 策略收益 |
| 解释性不足 | 加 WOE/IV、SHAP、reason code |

## 13. 推荐最终结论

最终项目结论可以这样写：

> 在 Home Credit 2024 信贷风险数据上，CatBoost/LightGBM ensemble 在整体 AUC 和 Gini stability 上表现最稳；MLP 单模型未稳定超过 GBDT，但 Denoising AutoEncoder embedding 对部分 OOT 周期和高风险客群有补充价值。最终方案采用 GBDT ensemble 作为主评分模型，深度学习 embedding 作为辅助特征，并通过 OOT、PSI、Vintage/MOB 和 approve/review/reject 策略仿真完成从竞赛模型到业务风控决策系统的改造。

## 14. 参考资料

- Kaggle Competition: https://www.kaggle.com/competitions/home-credit-credit-risk-model-stability
- Kaggle Data: https://www.kaggle.com/competitions/home-credit-credit-risk-model-stability/data
- 1st Place Solution - My Betting Strategy: https://www.kaggle.com/competitions/home-credit-credit-risk-model-stability/discussion/508337
- Dentsu Soken 技术博客总结: https://tech.dentsusoken.com/entry/2024/07/01/AITC%E3%81%AE%E6%8C%91%E6%88%A6%EF%BC%9AKaggle_Home_Credit%E3%82%B3%E3%83%B3%E3%83%9A%E3%81%A7%E5%AD%A6%E3%82%93%E3%81%A0%E6%8A%80%E8%A1%93%E3%81%A8%E6%88%90%E6%9E%9C
- IbisML + DuckDB Home Credit 示例: https://ibis-project.org/posts/ibisml/
