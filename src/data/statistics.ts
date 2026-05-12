import type { QACard } from '../types';

export const statisticsCards: QACard[] = [
  // ============================================================
  // 1. 描述统计 (8 questions)
  // ============================================================
  {
    id: 'stats-1',
    category: 'statistics',
    question: '均值、中位数、众数的区别是什么？分别适用于什么场景？',
    answer:
      '均值是所有数值之和除以个数，对异常值非常敏感；中位数是排序后位于中间位置的值，对异常值鲁棒；众数是出现频率最高的值，适用于分类数据。均值适合对称分布（如正态分布）；中位数适合偏态分布（如收入数据）；众数适合描述最典型的类别。当数据严重偏态时，中位数比均值更能反映"中心"趋势。例如，一组薪资数据 [5k, 6k, 7k, 8k, 100k]，均值为 25.2k，严重被高值拉高，而中位数 7k 更能反映普通人的薪资水平。',
    tags: ['central tendency', 'descriptive'],
    subTopic: '描述统计',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-2',
    category: 'statistics',
    question: '方差和标准差的含义是什么？为什么使用 n-1 作为分母？',
    answer:
      '方差衡量数据点相对于均值的离散程度，是各数据点与均值之差的平方和的平均值；标准差是方差的平方根，量纲与原数据一致，更直观。样本方差使用 n-1（贝塞尔校正）是因为样本均值通常比总体均值更接近样本点，直接用 n 会系统性地低估总体方差。n-1 使得样本方差是总体方差的无偏估计量。自由度解释：计算 n 个偏差时，因为偏差之和必为 0，只有 n-1 个自由变化的偏差，故分母为 n-1。',
    tags: ['variance', 'stddev', 'bessel correction'],
    subTopic: '描述统计',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-3',
    category: 'statistics',
    question: '箱线图如何检测异常值？IQR 法的工作原理是什么？',
    answer:
      '箱线图使用四分位数间距（IQR = Q3 - Q1）来检测异常值。下围栏 = Q1 - 1.5×IQR，上围栏 = Q3 + 1.5×IQR，落在此范围之外的数据点被视为潜在异常值。1.5 倍 IQR 对应正态分布中约 ±2.7σ，恰好涵盖约 99.3% 的数据。极端异常值可用 3×IQR 标记。相较于 Z-score 法（假设正态分布），IQR 法是非参数的，对分布形态无假设，因此更稳健。例如，数据集 [1, 2, 3, 4, 5, 100]，Q1=2, Q3=5, IQR=3, 上围栏=5+4.5=9.5，100 被标记为异常值。',
    tags: ['boxplot', 'outlier', 'IQR'],
    subTopic: '描述统计',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-4',
    category: 'statistics',
    question: '百分位数（percentile）如何解释？中位数是第几百分位数？',
    answer:
      '第 p 百分位数是指有 p% 的数据小于或等于该值。例如，第 90 百分位数为 200 分，意味着 90% 的考生分数 ≤ 200 分。中位数就是第 50 百分位数。百分位数常用于标准化测试、性能监控（如 P95/P99 延迟）和成长曲线。计算方式：先将数据排序，位置索引 L = (p/100) × n，若 L 非整数则向上取整，若为整数则取该位置与下一位置的平均值。与分位数相比，百分位数更细粒度，四分位数就是第 25/50/75 百分位数的特例。',
    tags: ['percentile', 'quantile', 'median'],
    subTopic: '描述统计',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-5',
    category: 'statistics',
    question: '偏度（Skewness）和峰度（Kurtosis）分别衡量什么？如何解读？',
    answer:
      '偏度衡量分布的对称性：偏度 > 0 为正偏（右偏，均值 > 中位数，长尾在右侧），偏度 < 0 为负偏（左偏），偏度 = 0 为对称。公式为 E[(X-μ)³]/σ³。峰度衡量分布的"峰态"或尾部厚重程度：通常报告超额峰度（Excess Kurtosis = Kurtosis - 3），正态分布的超额峰度为 0。超额峰度 > 0 表示厚尾（尖峰），极端值概率更大；< 0 表示薄尾（平峰）。金融收益率常呈现尖峰厚尾，意味着极端事件（黑天鹅）比正态分布预测的更频繁。',
    tags: ['skewness', 'kurtosis', 'distribution shape'],
    subTopic: '描述统计',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-6',
    category: 'statistics',
    question: '相关性和因果性的区别是什么？举例说明"相关不代表因果"。',
    answer:
      '相关性衡量两个变量之间的线性关联程度（统计关系），因果性意味着一个变量的变化直接导致另一个变量的变化（物理/逻辑关系）。统计上显著的相关系数 ≠ 因果关系，可能由混淆变量（Confounder）导致。经典案例：冰淇淋销量与溺水死亡人数正相关，但真正的原因是夏季高温（混淆变量）同时导致了两者上升。另一个例子：穿鞋睡觉与头痛相关，实际上是饮酒导致不脱鞋就睡且次日头痛。要确立因果，需要通过随机对照实验（RCT）、工具变量、断点回归或双重差分等方法控制混淆因素。',
    tags: ['correlation', 'causation', 'confounder'],
    subTopic: '描述统计',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-7',
    category: 'statistics',
    question: '什么是标准误差（Standard Error）？与标准差的区别？',
    answer:
      '标准误差衡量样本统计量（如样本均值）的抽样变异性，即多次抽样中统计量的标准差。标准误差 = σ/√n（总体标准差/√样本量），而标准差 σ 衡量单个数据点的离散程度。关键区别：标准差描述数据本身的波动，不随样本量增大而趋近于零；标准误差随 n 增大而减小（√n 的倒数），反映估计精度的提升。在大样本下（n→∞），标准误差趋近于 0，即样本均值越来越接近总体均值。标准误差是构建置信区间和进行假设检验的基础，例如均值的 95% 置信区间 = X̄ ± 1.96 × SE。',
    tags: ['standard error', 'sampling distribution', 'CLT'],
    subTopic: '描述统计',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-8',
    category: 'statistics',
    question: '置信区间的基本概念是什么？95% 置信区间应如何正确解读？',
    answer:
      '置信区间是给定置信水平下对总体参数的一个区间估计。95% 置信区间的正确解读：如果从总体中重复抽取无数个样本，用同样方法为每个样本构建置信区间，那么约 95% 的区间会包含真实总体参数。错误解读："参数有 95% 的概率落在这个区间内"（这是一个贝叶斯可信区间的解读，频率学派中参数是固定常数，不能对其赋予概率）。例如，某调查显示支持率为 60%±3%（95% CI），意味着如果我们重复调查 100 次，约 95 次的区间会包含真实支持率。置信区间的宽度受样本量（越大越窄）、置信水平（越高越宽）和变异程度影响。',
    tags: ['confidence interval', 'frequentist', 'estimation'],
    subTopic: '描述统计',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 2. 概率论 (15 questions)
  // ============================================================
  {
    id: 'stats-9',
    category: 'statistics',
    question: '条件概率与贝叶斯定理是什么？写出公式并举例说明。',
    answer:
      '条件概率 P(A|B) 表示在 B 已发生的条件下 A 发生的概率，公式为 P(A|B) = P(A∩B)/P(B)。贝叶斯定理在此基础上反转条件：P(A|B) = P(B|A)·P(A) / P(B)，其中 P(A) 是先验概率，P(B|A) 是似然，P(B) 是边缘概率（归一化常数）。经典例子——疾病检测：某病患病率 1%（先验），检测准确率 99%（TPR），误报率 2%（FPR）。一个人检测阳性，实际患病的概率 = (0.99×0.01) / (0.99×0.01 + 0.02×0.99) ≈ 33.3%。尽管检测准确率很高，但阳性结果只意味着约 1/3 的概率真正患病，因为基础患病率极低。',
    tags: ['conditional probability', 'bayes theorem', 'prior', 'likelihood'],
    subTopic: '概率论',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-10',
    category: 'statistics',
    question: '大数定律和中心极限定理的区别是什么？分别有什么实际应用？',
    answer:
      '大数定律（LLN）：当样本量 n 增大时，样本均值趋近于总体均值（依概率收敛）。它是蒙特卡洛模拟和保险精算的理论基础——样本足够多时，平均结果逼近真实期望。中心极限定理（CLT）：无论总体分布为何（只要方差有限），样本均值的抽样分布随着 n 增大趋近于正态分布 N(μ, σ²/n)。CLT 是许多统计推断的基础：即使原始数据不服从正态分布，我们仍可用正态近似构造置信区间和做假设检验（n ≥ 30 通常足够）。两者本质区别：LLN 讲的是"值收敛到常数"，CLT 讲的是"分布收敛到正态"。',
    tags: ['LLN', 'CLT', 'convergence'],
    subTopic: '概率论',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-11',
    category: 'statistics',
    question: '正态分布的特点是什么？为什么它在统计中如此重要？',
    answer:
      '正态分布（高斯分布）N(μ, σ²) 是对称钟形曲线，由均值 μ 和方差 σ² 完全确定。特性：68-95-99.7 规则（68% 数据在 ±1σ 内，95% 在 ±2σ 内，99.7% 在 ±3σ 内）；均值=中位数=众数；任意线性变换仍为正态。重要原因：(1) 中心极限定理保证了大量独立随机变量之和近似正态；(2) 许多自然现象（身高、测量误差）近似正态；(3) 许多统计检验（t 检验、ANOVA、回归分析）基于正态假设；(4) 正态分布的数学性质优美，PDF = (1/√(2πσ²))·exp(-(x-μ)²/(2σ²))，推导方便。',
    tags: ['normal distribution', 'gaussian', '68-95-99.7'],
    subTopic: '概率论',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-12',
    category: 'statistics',
    question: '伯努利分布和二项分布的关系是什么？各自的适用场景？',
    answer:
      '伯努利分布是单次 0/1 试验的分布：P(X=1)=p, P(X=0)=1-p，期望 E[X]=p，方差 Var(X)=p(1-p)。二项分布 Binomial(n, p) 是 n 次独立伯努利试验中成功次数的分布：P(X=k) = C(n,k)·pᵏ·(1-p)ⁿ⁻ᵏ，期望 E[X]=np，方差 Var(X)=np(1-p)。关系：二项分布是 n 个独立同分布伯努利变量之和。适用场景：伯努利——单次点击/转化、抛一次硬币；二项分布——n 次广告投放中点击次数、n 次抛硬币正面次数、质检中 n 件产品的次品数。当 n 足够大时，二项分布可用正态分布近似（np ≥ 5 且 n(1-p) ≥ 5）。',
    tags: ['bernoulli', 'binomial', 'discrete distribution'],
    subTopic: '概率论',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-13',
    category: 'statistics',
    question: '泊松分布适用于什么场景？它与二项分布、指数分布的关系？',
    answer:
      '泊松分布 Poisson(λ) 描述单位时间/空间内随机事件发生次数的分布，P(X=k) = λᵏ·e⁻ᵏ / k!，期望和方差均为 λ。适用场景：网站每小时访问量、电话交换机每分钟呼叫数、一页书上的错别字数。关键假设：事件独立、发生率恒定、两个事件不会同时发生。关系：(1) 当 n→∞、p→0 且 np→λ 时，二项分布趋近泊松分布（罕见事件近似）；(2) 两事件间隔时间服从指数分布 Exp(λ)——泊松过程的事件计数与事件间隔的对应关系。例如，如果平均每小时 5 个电话（λ=5），则两次电话间隔时间 ~ Exp(5)，平均等待 1/5 小时。',
    tags: ['poisson', 'exponential', 'rare events'],
    subTopic: '概率论',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-14',
    category: 'statistics',
    question: '指数分布的特点和记忆无性（Memoryless）性质是什么？',
    answer:
      '指数分布 Exp(λ) 是连续分布，PDF = λe⁻ᵏˣ (x ≥ 0)，期望 E[X]=1/λ，方差 Var(X)=1/λ²。它常用于建模等待时间、设备寿命。指数分布是唯一具有无记忆性的连续分布：P(X > s+t | X > s) = P(X > t)，即已经等待了 s 时间后，再等待 t 时间的概率与新开始等待 t 相同。这暗示系统不会"老化"——对电子元器件（在正常工作寿命期内）和陌生来电等待时间是合理的，但对有磨损的设备（机械部件）则不合理，此时需要威布尔分布。该性质来源于 P(X>x) = e⁻ᵏˣ 的指数函数特性。',
    tags: ['exponential', 'memoryless', 'waiting time'],
    subTopic: '概率论',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-15',
    category: 'statistics',
    question: '全概率公式是什么？如何用它推导贝叶斯定理？',
    answer:
      '全概率公式：若事件 B₁, B₂, ..., Bₙ 构成样本空间的一个划分（互斥且完备），则 P(A) = Σ P(A|Bᵢ)·P(Bᵢ)，即将 A 的概率表示为"条件于各分区"的加权和。它用于计算复杂事件的分段概率。推导贝叶斯：以 Bᵢ 为分区，P(Bᵢ|A) = P(A|Bᵢ)·P(Bᵢ) / P(A)，其中分母 P(A) 用全概率公式展开即可。实际应用：工厂有三条生产线产量分别占 30%、30%、40%，次品率分别为 2%、3%、1%，随机抽一件为次品，求出自各生产线的概率，这就是用全概率公式求边缘概率后代入贝叶斯公式。',
    tags: ['law of total probability', 'partition', 'marginal'],
    subTopic: '概率论',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-16',
    category: 'statistics',
    question: '期望和方差的计算公式是什么？线性组合的期望和方差如何计算？',
    answer:
      '离散随机变量：E[X] = Σ x·P(X=x)，Var(X) = E[X²] - (E[X])²。连续：E[X] = ∫ x·f(x)dx。期望的线性性：E[aX + bY + c] = aE[X] + bE[Y] + c，无论 X 和 Y 是否独立。方差：Var(aX + bY) = a²Var(X) + b²Var(Y) + 2ab·Cov(X,Y)，若 X 和 Y 独立则 Cov(X,Y)=0。常见分布：二项 Binomial(n,p) 期望 np 方差 np(1-p)；泊松 Poisson(λ) 期望和方差均为 λ；正态 N(μ,σ²) 期望 μ 方差 σ²；指数 Exp(λ) 期望 1/λ 方差 1/λ²。',
    tags: ['expectation', 'variance', 'linearity'],
    subTopic: '概率论',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-17',
    category: 'statistics',
    question: '协方差和相关系数分别衡量什么？两者有何区别？',
    answer:
      '协方差 Cov(X,Y) = E[(X-E[X])(Y-E[Y])] 衡量两个变量同向或反向变动的趋势，正值表示同向，负值表示反向。但它有量纲且范围无界，无法直接比较不同量纲变量的相关性强度。相关系数 ρ = Cov(X,Y)/(σₓσᵧ) 将协方差标准化为 [-1, 1]，消除了量纲影响。ρ=1 完全正线性相关，ρ=0 无线性相关（但可能非线性相关），ρ=-1 完全负线性相关。注意：协方差为零不意味着独立（除非联合正态分布），相关系数为零也不意味着独立（如 Y=X²，有二次关系但 ρ≈0）。实际应用中，Pearson 相关系数假设线性关系，对异常值敏感，此时可用 Spearman 秩相关系数替代。',
    tags: ['covariance', 'correlation', 'pearson', 'spearman'],
    subTopic: '概率论',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-18',
    category: 'statistics',
    question: '矩生成函数（MGF）是什么？它有什么用途？',
    answer:
      '矩生成函数 M(t) = E[eᵗˣ]，对 t 求 k 阶导数并在 t=0 处求值即得第 k 阶原点矩：E[Xᵏ] = dᵏM(t)/dtᵏ|_{t=0}。主要用途：(1) 计算各阶矩（均值、方差、偏度等）；(2) 唯一确定分布——若两个分布有相同的 MGF（在 t=0 邻域内），则它们同分布；(3) 推导独立随机变量之和的分布：若 X、Y 独立，M_{X+Y}(t) = M_X(t)·M_Y(t)。例如，二项分布的 MGF 为 (1-p+peᵗ)ⁿ，由此可证 n 个伯努利之和是二项分布。注意：MGF 未必处处存在（如柯西分布无 MGF），此时可用特征函数 φ(t)=E[eⁱᵗˣ]（总是存在）。',
    tags: ['MGF', 'moment', 'characteristic function'],
    subTopic: '概率论',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-19',
    category: 'statistics',
    question: '切比雪夫不等式（Chebyshev）的内容和应用是什么？',
    answer:
      '切比雪夫不等式：对任意分布（只要期望 μ 和方差 σ² 存在），P(|X-μ| ≥ kσ) ≤ 1/k²。即数据偏离均值超过 k 个标准差的概率不超过 1/k²。例如 k=3 时，不超过 1/9 ≈ 11.1% 的数据位于 ±3σ 之外。与正态分布的 68-95-99.7 规则相比，切比雪夫界限非常宽松（因为在所有可能分布上取最坏情况），但它不依赖任何分布假设。应用：(1) 在样本量足够时，无论总体分布如何，都能给出概率上界；(2) 证明大数定律——样本均值方差 σ²/n→0，概率收敛到 μ；(3) 质量控制中设定保守的异常检测阈值。',
    tags: ['chebyshev', 'inequality', 'bound'],
    subTopic: '概率论',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-20',
    category: 'statistics',
    question: '马尔可夫链的基本概念是什么？什么是稳态分布？',
    answer:
      '马尔可夫链是一个具有马尔可夫性的随机过程：下一状态仅依赖于当前状态，与历史无关。由状态空间 S 和转移概率矩阵 P（Pᵢⱼ = 从状态 i 到 j 的概率，每行之和为 1）定义。稳态分布（平稳分布）π 满足 π = πP，即从该分布出发，经过一步转移后分布不变。细致平衡条件（πᵢPᵢⱼ = πⱼPⱼᵢ）是稳态的充分条件。应用：PageRank（网页间的随机游走）、MCMC 采样（构建以目标分布为稳态的马尔可夫链）、排队论、隐马尔可夫模型（HMM）中语音识别的状态转移。不可约且非周期的马尔可夫链收敛到唯一稳态分布。',
    tags: ['markov chain', 'stationary distribution', 'transition matrix'],
    subTopic: '概率论',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-21',
    category: 'statistics',
    question: '蒙提霍尔问题（Monty Hall）是什么？正确的策略和数学解释？',
    answer:
      '蒙提霍尔问题：三扇门后有一辆车（两扇是山羊），你选一扇后，主持人（知道车在哪）打开一扇有山羊的门，问你是否换到剩下的那扇门。正确策略是换，获胜概率从 1/3 提高到 2/3。解释：(1) 条件概率法——不换：车在初次选择后 = 1/3；换：若初选是羊（概率 2/3），主持人必须打开另一羊门，最后那扇门必是车。(2) 贝叶斯更新——将三扇门视为对称，主持人有意图地打开一扇羊门提供了信息，更新了后验概率。关键在于：主持人的行为不是随机的，他永远不会打开有车的门，这个约束改变了概率结构。常犯错误是把换门当成两扇门之间 50/50 的选择。',
    tags: ['monty hall', 'conditional probability', 'paradox'],
    subTopic: '概率论',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-22',
    category: 'statistics',
    question: '生日悖论（Birthday Paradox）是什么？数学推导过程？',
    answer:
      '生日悖论：在 23 人中，至少两人生日相同的概率超过 50%（直觉上需要更多人）。推导：考虑互补事件——所有人生日都不同。第一个人的生日任意（365/365），第二个人需不同（364/365），第三个人（363/365），以此类推。P(全不同) = ∏ᵢ₌₀ⁿ⁻¹ (365-i)/365。n=23 时，P(全不同) ≈ 0.4927，故 P(至少一对相同) ≈ 50.7%。n=50 时约 97%，n=70 时达 99.9%。悖论的核心在于人们通常比较特定两人，而实际是比较任意配对——n 个人有 C(n,2) 对组合，随 n 呈 O(n²) 增长。这常用于理解哈希碰撞（如 128 位哈希，约 2⁶⁴ 次尝试即有较高碰撞概率）和区块链的"生日攻击"。',
    tags: ['birthday paradox', 'collision', 'combinatorics'],
    subTopic: '概率论',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-23',
    category: 'statistics',
    question: '什么是联合分布、边缘分布和条件分布？三者关系？',
    answer:
      '联合分布 P(X,Y) 描述两个随机变量的同时分布情况。边缘分布通过"求和/积分消去"另一个变量得到：P(X) = Σᵧ P(X,Y) 或 fₓ(x) = ∫ f(x,y)dy。条件分布 P(Y|X) = P(X,Y)/P(X) 描述已知 X 取值后 Y 的分布。三者关系可概括为：联合 = 边缘 × 条件 = 条件 × 边缘，f(x,y) = fₓ(x)·f(y|x) = fᵧ(y)·f(x|y)。若 X 和 Y 独立，则 f(x,y) = fₓ(x)·fᵧ(y)，此时 f(y|x) = fᵧ(y)，条件分布退化为边缘分布。联合分布在贝叶斯框架中尤其重要，先验和似然的乘积即为联合分布（正比于后验）。',
    tags: ['joint distribution', 'marginal', 'conditional'],
    subTopic: '概率论',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 3. 假设检验 (15 questions)
  // ============================================================
  {
    id: 'stats-24',
    category: 'statistics',
    question: 'P 值的直观理解是什么？常见的误解有哪些？',
    answer:
      'P 值是在原假设 H₀ 为真的前提下，观察到当前统计量或更极端结果的概率。它不是"H₀ 为真的概率"，也不是"效应大小"。常见误解：(1) P > 0.05 意味着 H₀ 为真——错，可能只是样本量不够；(2) P < 0.05 意味着效应很重要——错，大样本下微小效应也能显著；(3) P 值反映了复制概率——错，P 值具有高变异性；(4) P=0.05 和 P=0.01 之间有本质区别——实际上只是连续的证据强度度量。正确理解：P 值是"数据与 H₀ 的兼容程度"，越低表示数据与 H₀ 越不兼容。国际统计学会（ASA）2016 声明建议不要将 P 值二分为"显著/不显著"，应结合效应量和置信区间综合判断。',
    tags: ['p-value', 'hypothesis testing', 'misinterpretation'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-25',
    category: 'statistics',
    question: '第一类错误（Type I）和第二类错误（Type II）是什么？如何权衡？',
    answer:
      '第一类错误（α）：原假设 H₀ 正确但被拒绝，即"假阳性"（无罪判有罪）。第二类错误（β）：H₀ 错误但未能拒绝，即"假阴性"（有罪判无罪）。检验功效 Power = 1-β，即 H₀ 错误时正确拒绝的概率。α 和 β 存在权衡：降低 α（更严的显著性标准）会增大 β（更难检测到真实效应），在固定样本量下无法同时降低两者。增加样本量是同时降低 α 和 β 的唯一方法。实际应用：在医学诊断中，Type II 错误可能错过疾病（代价更高，倾向于降低 β）；在药物审批中，Type I 错误意味着批准无效药物（代价更高，倾向于严格控制 α=0.05 乃至 0.01）。',
    tags: ['type I error', 'type II error', 'power', 'alpha', 'beta'],
    subTopic: '假设检验',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-26',
    category: 'statistics',
    question: 't 检验和 z 检验的区别是什么？分别适用于什么场景？',
    answer:
      'z 检验假设总体标准差 σ 已知（或大样本下用样本标准差近似），检验统计量 Z = (X̄-μ₀)/(σ/√n)，在 H₀ 下服从标准正态分布。t 检验用于 σ 未知（用样本标准差 s 估计），统计量 t = (X̄-μ₀)/(s/√n)，服从自由度为 n-1 的 t 分布。关键区别：t 分布比正态分布有更厚的尾部，反映了估计 σ 带来的额外不确定性；当 n→∞ 时，t 分布趋近正态。使用场景：小样本（n<30）必须用 t 检验（前提：数据近似正态）；大样本（n≥30）两者结果近似，用 z 检验也可；总体已知正态且方差已知时用 z 检验。单样本 t 检验比较样本均值与给定值，双样本 t 检验比较两组均值。',
    tags: ['t-test', 'z-test', 'student t', 'normal'],
    subTopic: '假设检验',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-27',
    category: 'statistics',
    question: '卡方检验（Chi-square test）的应用场景和原理是什么？',
    answer:
      '卡方检验用于分类数据的假设检验，统计量 χ² = Σ (Oᵢ - Eᵢ)²/Eᵢ，其中 Oᵢ 为观测频数，Eᵢ 为 H₀ 下的期望频数。在 H₀ 下该统计量近似服从卡方分布。三大场景：(1) 拟合优度检验——检验分类变量的分布是否符合预期（如骰子是否公平，df = k-1）；(2) 独立性检验——检验两个分类变量是否独立，列联表分析（如性别与投票偏好是否独立，df = (r-1)(c-1)）；(3) 同质性检验——检验不同总体的某一分类变量分布是否相同。前提条件：期望频数均 ≥ 1，且至少 80% 的单元格期望频数 ≥ 5；不满足时使用 Fisher 精确检验。卡方检验本质是一种大样本近似，Pearson 于 1900 年提出。',
    tags: ['chi-square', 'contingency table', 'goodness of fit'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-28',
    category: 'statistics',
    question: '如何根据数据类型和研究目的选择合适的统计检验方法？',
    answer:
      '选择流程：(1) 明确研究问题和数据类型：连续 vs 分类、配对 vs 独立、单组 vs 多组。(2) 连续数据→检验分布假设：正态且方差齐同→t 检验/ANOVA；非正态→Mann-Whitney U/Wilcoxon 符号秩检验；多组非正态→Kruskal-Wallis 检验。(3) 分类数据→卡方检验/Fisher 精确检验。(4) 相关性→Pearson（线性正态连续）或 Spearman（单调/有序）。总结速查表：单组均值 vs 常数→单样本 t；两组独立均值→独立样本 t；两组配对均值→配对 t；多组均值→单因素 ANOVA；两分类变量关联→卡方独立性检验。如果多重假设检验，需要用 Bonferroni 或 FDR 校正。',
    tags: ['test selection', 'parametric', 'non-parametric'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-29',
    category: 'statistics',
    question: '置信区间与假设检验的关系是什么？两者如何转换？',
    answer:
      '置信区间和假设检验是同一硬币的两面，基于相同的抽样分布理论。关系：若 (1-α) 置信区间不包含 H₀ 中的参数值 μ₀，则在显著性水平 α 下拒绝 H₀: μ=μ₀；反之则不能拒绝。例如，μ 的 95% CI 为 [2.1, 5.3]，检验 H₀: μ=0，由于 0 不在区间内，在 α=0.05 水平下拒绝 H₀。置信区间提供的信息比"拒绝/不拒绝"更丰富——它给出了效应大小的可能范围。A/B 测试中，若 95% CI 为 [1.2%, 3.5%]，则效应量在 1.2%~3.5% 之间，不仅回答了"是否有差异"，还回答了"差异有多大"。现代统计实践倾向于报告 CI + 效应量，而非仅报告 P 值。',
    tags: ['confidence interval', 'hypothesis testing', 'duality'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-30',
    category: 'statistics',
    question: '单尾检验和双尾检验的区别？如何选择？',
    answer:
      '双尾检验的 H₁ 为"参数 ≠ 某值"，拒绝域分布在两侧（各 α/2），用于检测任何方向的差异。单尾检验的 H₁ 为"参数 > 某值"或"参数 < 某值"，拒绝域仅在一侧（全部 α），用于有明确方向预期的场景。单尾检验在相同 α 下更容易拒绝 H₀（统计效力更高），但代价是完全放弃检测反方向效应的能力。选择准则：仅当理论上完全不可能出现反方向效应，且研究计划中预先声明确认方向时，才使用单尾检验。不能在看到数据后再"切换"成单尾以获取显著结果（P-hacking 的一种形式）。实践中，双尾检验是更保守和安全的选择，大多数期刊和业界标准默认要求双尾检验。',
    tags: ['one-tailed', 'two-tailed', 'directionality'],
    subTopic: '假设检验',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-31',
    category: 'statistics',
    question: '统计功效（Power）分析是什么？如何计算样本量？',
    answer:
      '统计功效 Power = P(拒绝 H₀ | H₀ 为假) = 1-β，即检测到真实效应的概率。功效分析用于确定所需的样本量，确保研究有能力检测到具有实际意义的效应。四个参数相互决定：效应量 d（如 Cohen d = (μ₁-μ₂)/σ）、显著性水平 α、样本量 n、功效 1-β，固定任意三个即确定第四个。通常做法：设定 α=0.05，期望 Power=0.8，根据预期的效应量计算所需最小样本量。效应量可从前期研究或领域惯例获得（Cohen 标准：小 d=0.2，中 d=0.5，大 d=0.8）。注意：事后功效分析（数据收集后计算 Power）存在逻辑缺陷——它只是 P 值的另一种表达，应避免使用，应报告置信区间。',
    tags: ['power analysis', 'sample size', 'cohen d', 'effect size'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-32',
    category: 'statistics',
    question: '方差分析（ANOVA）的基本原理是什么？F 统计量的含义？',
    answer:
      'ANOVA 用于比较三组及以上均值是否相等，通过比较组间方差与组内方差来判断。总变异 SST 分解为组间变异 SSB + 组内变异 SSW。F 统计量 = (SSB/(k-1)) / (SSW/(N-k)) = MSB/MSW = 组间均方/组内均方。若各组均值相同，MSB 和 MSW 均估计 σ²，F ≈ 1；若均值不同，MSB 会偏大，F > 1。H₀: μ₁=μ₂=...=μₖ，H₁：至少有一组均值不同。假设：(1) 各组独立且随机抽样；(2) 各组正态分布；(3) 各组方差齐同（方差齐性检验用 Levene 或 Bartlett 检验）。显著后需做事后多重比较（Tukey HSD、Bonferroni）找出哪些组之间有差异。若方差齐性不满足，可用 Welch ANOVA 替代。',
    tags: ['ANOVA', 'F-test', 'variance decomposition'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-33',
    category: 'statistics',
    question: '多重比较校正（Bonferroni 校正）的原理和优缺点？',
    answer:
      '当进行 m 次独立的假设检验时，家族错误率（FWER）——至少犯一次第一类错误的概率——会显著增大：P(≥1 次 Type I error) = 1 - (1-α)ᵐ。Bonferroni 校正将每次检验的显著性水平调整为 α/m，保证 FWER ≤ α。例如，做 10 次检验，原 α=0.05，校正后每次需 P < 0.005 才显著。优点：简单、通用、保守地控制 FWER。缺点：过于保守（尤其是检验不独立时），统计功效大幅降低，容易错过真实效应。替代方法：(1) Benjamini-Hochberg 过程控制错误发现率 FDR（更适用于探索性研究，如基因组学）；(2) Tukey HSD（专门为 ANOVA 事后比较设计，功效高于 Bonferroni）。选择取决于研究目的——验证性研究倾向用 FWER，探索性研究可用 FDR。',
    tags: ['multiple comparison', 'bonferroni', 'FWER', 'FDR'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-34',
    category: 'statistics',
    question: 'F 检验的原理和假设是什么？常用于哪些场景？',
    answer:
      'F 检验比较两个总体方差是否相等（方差齐性检验）或在回归/ANOVA 中检验模型整体显著性。统计量 F = s₁²/s₂²（较大方差/较小方差），在 H₀（两总体方差相等）下服从自由度为 (n₁-1, n₂-1) 的 F 分布。F 分布为非对称非负分布，形状由两个自由度参数决定。应用场景：(1) 两独立样本方差齐性检验；(2) 回归分析中检验模型中所有斜率系数是否同时为零（整体 F 检验）；(3) 嵌套模型比较（完全模型 vs 简约模型是否显著更好）；(4) ANOVA 中比较组间和组内变异。F 检验对正态性敏感，若数据非正态可用 Levene 检验或 Brown-Forsythe 检验替代方差齐性检验。',
    tags: ['F-test', 'variance ratio', 'model comparison'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-35',
    category: 'statistics',
    question: 'Mann-Whitney U 检验是什么？与 t 检验的区别和适用条件？',
    answer:
      'Mann-Whitney U 检验（又名 Wilcoxon 秩和检验）是非参数检验，比较两个独立样本是否来自相同分布（主要检测位置参数差异）。它比较两组数据的秩次（排序位置），计算 U 统计量：将两组数据合并排序后，计算每组的秩和，U₁ = R₁ - n₁(n₁+1)/2。与 t 检验的对比：(1) t 检验需要正态性和方差齐性（比较均值），M-W U 检验不假设分布（比较中位数/秩次）；(2) 正态满足时 t 检验功效更高；(3) 数据存在异常值或严重偏态时，M-W U 检验更稳健。M-W U 检验检测的是"一组值是否倾向于大于另一组"（随机优势），并非直接比较中位数。当数据近似正态时优先使用 t 检验，否则选 M-W U 检验（但需注意它仍是独立性和分布形状相似的假设）。',
    tags: ['mann-whitney', 'wilcoxon', 'non-parametric'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-36',
    category: 'statistics',
    question: 'KS 检验（Kolmogorov-Smirnov）的原理和应用场景？',
    answer:
      'KS 检验比较两个分布的一致性（双样本）或检验样本是否来自某已知分布（单样本），基于经验累积分布函数（ECDF）之间的最大垂直距离：D = max|F₁(x) - F₂(x)|。检验统计量 D 越大，两个分布差异越大。优势：(1) 非参数，不对分布做假设；(2) 对任何类型的分布差异（位置、形状、离散度）都敏感；(3) 直观，直接比较 ECDF。局限：(1) 对尾部分布差异不如对中心位置敏感；(2) 只适用于连续分布；(3) 对分布尾部精确形式的偏差检测效率不如 Anderson-Darling 检验。A/B 测试中常用于检测实验组和对照组整体分布是否不同（而非仅均值差异），或在模型校准中检验预测分布的准确性。',
    tags: ['KS test', 'Kolmogorov-Smirnov', 'ECDF', 'goodness of fit'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-37',
    category: 'statistics',
    question: 'Bootstrap 方法的原理是什么？如何用它进行假设检验？',
    answer:
      'Bootstrap（自助法）是通过对原始样本进行有放回重抽样来估计统计量抽样分布的方法。核心思想：将样本视为"小总体"，通过反复抽取（通常 1000~10000 次）获得统计量的经验分布，以此计算标准误差、置信区间，或进行假设检验。Bootstrap 置信区间方法：(1) 百分位法——直接取 Bootstrap 分布的 α/2 和 1-α/2 分位数；(2) BCa 法——修正偏差和偏度，更准确。Bootstrap 假设检验：在 H₀ 下调整数据（如两样本均值差检验，将所有观测中心化去均值差异），然后 Bootstrap 获得 H₀ 下的参考分布，计算原始差异的 P 值。优势：无需正态假设，适用于任何统计量（如中位数、相关系数）。局限：对极值分布或样本量过小（n<10）效果差。',
    tags: ['bootstrap', 'resampling', 'empirical distribution'],
    subTopic: '假设检验',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-38',
    category: 'statistics',
    question: '置换检验（Permutation Test）的原理和优点是什么？',
    answer:
      '置换检验（随机化检验）通过随机打乱数据标签/组别来构建 H₀ 下的零分布。步骤：(1) 计算原始数据的检验统计量（如两组均值差）；(2) 随机重新分配组别标签，计算新统计量；(3) 重复数千次，得到置换分布；(4) P 值 =（置换统计量 ≥ 原始统计量的次数 + 1）/（总置换次数 + 1）。优点：(1) 仅依赖"随机分配"假设而非分布假设——精确控制第一类错误率；(2) 可使用任意自定义统计量；(3) 对于小样本（如临床试验 10 vs 10），精确置换检验可给出精确 P 值。与 Bootstrap 的区别：Bootstrap 重抽样估计的是抽样分布（关注估计精度），置换检验打乱标签估计的是 H₀ 下的零分布（关注假设检验）。在 A/B 测试非正态指标（如 GMV、用户留存）时，置换检验非常有用。',
    tags: ['permutation test', 'randomization', 'exact test'],
    subTopic: '假设检验',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 4. 贝叶斯统计 (10 questions)
  // ============================================================
  {
    id: 'stats-39',
    category: 'statistics',
    question: '先验、后验和似然（Likelihood）的区别是什么？贝叶斯公式如何联系它们？',
    answer:
      '先验 P(θ) 是在看到数据之前对参数 θ 的概率信念（基于领域知识或历史数据）；似然 P(Data|θ) 是在参数 θ 给定下观测到当前数据的概率（抽样模型）；后验 P(θ|Data) 是在观测数据后更新的参数概率分布，贝叶斯公式为后验 ∝ 似然 × 先验，即 P(θ|D) = P(D|θ)P(θ) / P(D)。归一化常数 P(D) = ∫ P(D|θ)P(θ)dθ 为边缘似然（模型证据）。例如，A/B 测试中转化率的先验用 Beta(α,β)，观察到 n 次试验中 k 次转化（似然为二项分布），后验为 Beta(α+k, β+n-k)，实现了从先验信念到数据更新后的自然转变。这是贝叶斯学习的核心机制——不断用新数据更新信念。',
    tags: ['prior', 'posterior', 'likelihood', 'bayesian update'],
    subTopic: '贝叶斯统计',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-40',
    category: 'statistics',
    question: '共轭先验（Conjugate Prior）是什么？举例说明常见的共轭对。',
    answer:
      '共轭先验是当先验分布和似然函数属于同一分布族时，后验分布也属于该分布族的现象，使得贝叶斯更新在数学上极其简洁。常见共轭对：(1) Beta 先验 + 二项似然 → Beta 后验——用于转化率、点击率的贝叶斯推断；(2) Dirichlet 先验 + 多项似然 → Dirichlet 后验——Beta 的多元推广，用于多类别分布；(3) 正态先验（均值未知，方差已知）+ 正态似然 → 正态后验——用于连续参数的估计；(4) Gamma 先验 + 泊松似然 → Gamma 后验——用于计数数据；(5) 逆 Gamma 先验 + 正态似然 → 逆 Gamma 后验——用于方差的贝叶斯推断。共轭结构的便利性使得 A/B 测试后端常直接用 Beta-Binomial 共轭在线更新转化率的后验分布。',
    tags: ['conjugate prior', 'beta-binomial', 'normal-normal'],
    subTopic: '贝叶斯统计',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-41',
    category: 'statistics',
    question: '贝叶斯统计和频率学派统计的核心区别是什么？各自的优缺点？',
    answer:
      '核心哲学差异：(1) 参数观——频率学派视参数为未知固定常数，用点估计+置信区间；贝叶斯视参数为随机变量，用后验分布描述不确定性。(2) 概率解释——频率学派将概率解释为长期频率（无限重复实验）；贝叶斯将概率解释为信念程度（主观概率）。(3) 推断方式——频率学派基于抽样分布（数据随机，参数固定）；贝叶斯基于后验分布（参数随机，数据固定）。优缺点：频率学派客观、不依赖主观先验、计算简便；但 P 值常被误解，置信区间解读绕口，且不自动利用先验信息。贝叶斯提供更直观的概率陈述（"参数落入区间的概率为 95%"）、能自然整合先验知识、支持序列学习；但先验选择可能引起争议，计算复杂（需 MCMC），模型比较选择先验有主观性。实践中二者并非对立，可结合使用。',
    tags: ['bayesian', 'frequentist', 'philosophy', 'comparison'],
    subTopic: '贝叶斯统计',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-42',
    category: 'statistics',
    question: '贝叶斯 A/B 测试与传统频率学派 A/B 测试有何不同？优势在哪里？',
    answer:
      '传统 A/B 测试：固定样本量（由功效分析确定），收集数据后进行 t 检验或卡方检验，得出"是否拒绝 H₀"的二元结论，不能提前终止（P-hacking）。贝叶斯 A/B 测试：(1) 使用共轭先验（如 Beta 分布），随数据实时更新后验分布；(2) 可直接计算 P(A > B | Data) 的概率（"A 比 B 好的概率"），而非模糊的 P 值；(3) 支持可选的提前终止规则（如 P(A > B) > 95% 时停止），减少不必要的流量浪费；(4) 对流量小的测试更友好，因为整合了先验信息。贝叶斯 A/B 的劣势在于先验选择的主观性（但可用非信息先验缓解），且需要 MCMC 或解析计算。业界实践中 Google、Microsoft 等已广泛采用贝叶斯 A/B 框架。',
    tags: ['bayesian AB testing', 'beta-binomial', 'sequential'],
    subTopic: '贝叶斯统计',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-43',
    category: 'statistics',
    question: 'MCMC 方法的基本思想是什么？为什么在贝叶斯统计中如此重要？',
    answer:
      'MCMC（马尔可夫链蒙特卡洛）是用于从复杂概率分布中采样的数值方法。贝叶斯统计中的后验分布 P(θ|D) 除了简单共轭情况外，往往没有封闭形式，尤其在高维空间中解析边缘似然 ∫P(D|θ)P(θ)dθ 极其困难。MCMC 的核心思路：构建一条以目标后验分布为稳态分布的马尔可夫链，通过长时间模拟获得近似于从后验中抽取的样本序列，然后用这些样本的均值/分位数等样本统计量来近似后验期望、可信区间等。MCMC 使得贝叶斯方法能应用于复杂层级模型、非共轭先验、高维参数空间等问题，在 GSS 软件的普及（如 BUGS、JAGS、Stan、PyMC3）极大推动了贝叶斯统计的实用化。',
    tags: ['MCMC', 'sampling', 'posterior approximation'],
    subTopic: '贝叶斯统计',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-44',
    category: 'statistics',
    question: 'Metropolis-Hastings 算法的步骤和原理？如何理解接受概率？',
    answer:
      'MH 算法是最基础的 MCMC 方法，步骤：(1) 从当前状态 θ 出发，从提议分布 q(θ*|θ) 生成候选点 θ*；(2) 计算接受概率 α = min(1, [P(θ*|D)·q(θ|θ*)] / [P(θ|D)·q(θ*|θ)])；(3) 以概率 α 接受 θ*（新状态），否则留在 θ（旧状态被再次计数）。接受概率本质是保证细致平衡条件，使得马尔可夫链以目标后验为稳态分布。当提议分布对称（q(θ*|θ)=q(θ|θ*)），如随机游走提议，接受率简化为后验比率。关键调参：提议分布的步长——太小则混合慢（高接受率但低效），太大则常被拒绝（低接受率）；通常目标接受率为 0.23-0.44（高斯提议）或约 0.234（最优缩放规则）。MH 是后续高级方法（Gibbs、HMC/NUTS）的基础。',
    tags: ['metropolis-hastings', 'MCMC', 'acceptance probability'],
    subTopic: '贝叶斯统计',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-45',
    category: 'statistics',
    question: 'Gibbs 采样的工作原理是什么？与 Metropolis-Hastings 的关系？',
    answer:
      'Gibbs 采样是 MH 算法的特例：当所有条件后验分布 P(θᵢ|θ₋ᵢ, D) 已知且可采样时，逐个维度的条件分布中抽取新值，接受概率恒为 1。步骤：初始化所有参数 θ(0)，迭代依次从 P(θ₁|θ₂,θ₃...,D), P(θ₂|θ₁,θ₃...,D)... 中采样更新每个参数。Gibbs 可视为 MH 中以条件分布为提议分布且接受率=1 的特殊情况（证明：此时 q(θ*|θ)=P(θᵢ*|θ₋ᵢ)，代入 MH 接受概率分子分母抵消）。优点：无需调参、自动接受、实现简单。缺点：各维度需要能直接采样的条件分布；当参数间高度相关时混合极慢（可改用参数扩展或切片采样）；某些条件下分布没有可采样的形式时需结合 MH 步（Metropolis-within-Gibbs）。',
    tags: ['gibbs sampling', 'conditional distribution', 'MCMC'],
    subTopic: '贝叶斯统计',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-46',
    category: 'statistics',
    question: '贝叶斯可信区间（Credible Interval）是什么？与置信区间的区别？',
    answer:
      '可信区间是基于后验分布的区间估计：对于 (1-α) 可信区间，参数 θ 落入区间的后验概率恰为 1-α（如 95% 可信区间可解读为"θ 有 95% 的概率在区间内"）。两种常见形式：(1) 等尾区间——取后验分布的 α/2 和 1-α/2 分位数；(2) 最高后验密度区间（HPDI）——区间内所有点的后验密度均高于区间外任何点，是最窄的 1-α 区间。与置信区间对比：置信区间是频率学派概念——"如果重复实验无限次，95% 的区间会包含真值"（不能对单次实验的概率陈述）；可信区间可直接给出概率陈述，更符合人类直觉。然而，可信区间的准确性依赖于合理的先验选择，客观上不当的先验可能产生具有误导性的区间。',
    tags: ['credible interval', 'HPDI', 'posterior'],
    subTopic: '贝叶斯统计',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-47',
    category: 'statistics',
    question: '贝叶斯线性回归与传统线性回归的核心区别是什么？',
    answer:
      '传统线性回归（OLS）：β 的最小二乘估计是点估计，置信区间基于抽样分布（如 β̂ ~ N(β, σ²(XᵀX)⁻¹)）。贝叶斯线性回归：给参数设定先验——通常 β ~ N(0, τ²I)（正态先验），后验也是正态分布。优势：(1) 自动正则化——先验即正则化（类似 Ridge 回归，β 向 0 收缩），方差 τ² 控制收缩强度；(2) 完整不确定性量化——后验分布给出 β 的完整分布（而不仅是标准误），预测时有完整的预测分布（而非仅均值的点预测 + 置信区间）；(3) 能集成先验知识——如已知某特征的效应应该为正，可设截断先验；(4) 当特征高度相关时，贝叶斯方法通过先验提供额外信息缓解共线性。后验通过正态-逆Gamma 共轭得到解析解（β|σ² ~ 正态，σ² ~ 逆Gamma），也可用 MCMC 处理非共轭先验。',
    tags: ['bayesian linear regression', 'regularization', 'posterior predictive'],
    subTopic: '贝叶斯统计',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-48',
    category: 'statistics',
    question: '层级模型（Hierarchical Model）的概念和应用场景是什么？',
    answer:
      '层级模型（多层模型/混合效应模型）通过在不同层级上建模参数的变异性来处理嵌套或分组数据结构。例如，学生对学校嵌套：第一层（个体）y₍ᵢⱼ  ~ N(αⱼ + βX₍ᵢⱼ, σ²)，第二层（学校）αⱼ ~ N(μₐ, τ²)。核心优势——部分池化/收缩：各组参数估计向总体均值收缩（Between complete pooling and no pooling），根据组内数据量动态调节收缩程度。小样本组更依赖总体信息（更多收缩），大样本组更依赖自身数据。应用：(1) 教育统计——学生嵌套在学校内；(2) 元分析——多个研究的结果汇总；(3) 重复测量数据——同一个体内多次测量；(4) 多臂 Bandit——实验臂间可共享信息。贝叶斯框架天然适合层级模型，以超先验描述高层参数的分布不确定性，通过 MCMC 计算联合后验。',
    tags: ['hierarchical model', 'partial pooling', 'mixed effects'],
    subTopic: '贝叶斯统计',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 5. 回归分析 (12 questions)
  // ============================================================
  {
    id: 'stats-49',
    category: 'statistics',
    question: '线性回归的基本假设有哪些？违反各假设会有什么后果？',
    answer:
      'OLS 线性回归的五大经典假设（Gauss-Markov 假设）：(1) 线性性——因变量与自变量之间关系是线性的（参数线性），可通过残差 vs 拟合值图检验；(2) 独立性——误差项之间不相关，违反（如时间序列自相关、簇数据）导致标准误低估，可用 Durbin-Watson 检验；(3) 同方差性——误差方差恒定，违反（异方差性）导致 OLS 仍无偏但效率降低，标准误有偏，可用 Breusch-Pagan 检验和 White 稳健标准误处理；(4) 外生性——自变量与误差项不相关（E[ε|X]=0），最核心假设，违反（内生性：遗漏变量、测量误差、反向因果）导致估计有偏且不一致，需用 IV/GMM 等方法解决；(5) 正态性——误差项正态分布（非 Gauss-Markov 假设但为小样本推断所需），大样本下由 CLT 可不依赖此假设。',
    tags: ['linear regression', 'assumptions', 'Gauss-Markov'],
    subTopic: '回归分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-50',
    category: 'statistics',
    question: 'R² 和调整 R² 的区别是什么？为什么调整 R² 更可靠？',
    answer:
      'R²（决定系数）= 1 - SS_res/SS_tot（回归平方和/总平方和），衡量模型解释的变异比例，范围 [0,1]。R² 的缺陷：只要新增一个自变量（即使完全无关联），R² 永远不会下降，总会略微增加或持平。因此仅有 R² 高不代表模型好（可能过拟合）。调整 R² = 1 - [(1-R²)(n-1)/(n-k-1)]，其中 n 为样本量，k 为自变量个数，它在 R² 基础上对新增自变量施加惩罚。当新增变量贡献的增量 R² 不足以抵消自由度损失时，调整 R² 会下降，因此能帮助判断新增变量是否真正改善模型。调整 R² ≤ R²（除非 k=0 时相等）。模型选择时，调整 R² 比 R² 更合理（但不如 AIC/BIC 严格，因为这些信息准则有更严谨的统计理论支撑）。',
    tags: ['R-squared', 'adjusted R-squared', 'overfitting'],
    subTopic: '回归分析',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-51',
    category: 'statistics',
    question: '多重共线性（Multicollinearity）是什么？如何用 VIF 检测？',
    answer:
      '多重共线性指自变量之间存在高度线性相关，导致回归系数估计不稳定（方差膨胀）、系数符号可能违反直觉、单个系数的 t 检验不显著但联合 F 检验显著。VIF（方差膨胀因子）是最常用的检测指标：对每个自变量 Xⱼ，用其他自变量对其回归得到 Rⱼ²，VIFⱼ = 1/(1-Rⱼ²)。经验规则：VIF=1 表示无共线性；1<VIF<5 表示中等共线性，可接受；VIF>5（或 >10）表示严重共线性，需处理。逆向：VIF=10 意味着该系数估计方差是无共线性时的 10 倍。处理方案：(1) 去掉高度相关的变量之一；(2) 使用 PCA 降维；(3) 使用 Ridge 回归（有偏但稳定）；(4) 收集更多数据；(5) 组合特征（差值、比率）减轻共线性。注意：共线性不影响模型整体的预测能力，只影响个体系数的解释和推断。',
    tags: ['multicollinearity', 'VIF', 'variance inflation'],
    subTopic: '回归分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-52',
    category: 'statistics',
    question: '异方差性（Heteroscedasticity）是什么？如何检测和处理？',
    answer:
      '异方差性指误差项的方差不是常数（σᵢ² 随 i 变化），违反同方差假设。常见模式：残差随拟合值增大而发散（扇形/漏斗形），常见于横截面数据（如收入 vs 消费）。检测方法：(1) 残差 vs 拟合值图——肉眼判断趋势；(2) Breusch-Pagan 检验——将残差平方对自变量回归，检验 R² 是否显著（LM 检验）；（3）White 检验——更通用但消耗自由度。处理方案：(1) 使用 White/Huber 稳健标准误（HC 系列）——不对方差结构建模，仅修正标准误，简单常用；(2) 加权最小二乘法（WLS）——若知道方差结构（如 σᵢ² ∝ xᵢ²），用加权 OLS；(3) 变量变换（log、Box-Cox）——稳定方差；(4) 广义最小二乘法（GLS）——更通用，但需要对方差结构建模。',
    tags: ['heteroscedasticity', 'breusch-pagan', 'robust standard errors'],
    subTopic: '回归分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-53',
    category: 'statistics',
    question: 'Ridge 回归和 Lasso 回归的核心区别是什么？各自的优缺点？',
    answer:
      '两者都通过在损失函数中添加惩罚项来防止过拟合，解决共线性问题。(1) Ridge（L2 正则化）：损失 = RSS + λ∑βⱼ²，惩罚系数平方和，将系数向 0 收缩但永远不会精确为 0，适合所有特征都有贡献的场景。(2) Lasso（L1 正则化）：损失 = RSS + λ∑|βⱼ|，惩罚系数绝对值之和，可以将部分系数精确压缩为 0（自动特征选择），适合高维稀疏场景。区别几何解释：约束区域——Ridge 约束为球（L2 范数 ≤ t），Lasso 约束为菱形（L1 范数 ≤ t）；RSS 等高线首先碰到菱形角点的概率大，导致稀疏解。选择指南：需要保留所有特征做解释→Ridge；怀疑只有少数特征重要→Lasso；两者折衷→Elastic Net（αλ∑|βⱼ| + (1-α)λ∑βⱼ²，同时做 L1+L2）。λ 通过交叉验证选取（如 RidgeCV、LassoCV）。',
    tags: ['ridge', 'lasso', 'L1', 'L2', 'regularization'],
    subTopic: '回归分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-54',
    category: 'statistics',
    question: '逻辑回归（Logistic Regression）的基本原理？为什么不能直接用线性回归？',
    answer:
      '逻辑回归用于二分类问题，通过 sigmoid 函数 σ(z) = 1/(1+e⁻ᶻ) 将线性组合 Xβ 映射到 (0,1) 概率空间：P(Y=1|X) = 1/(1+exp(-Xβ))。不能直接用线性回归处理分类的原因：(1) 线性回归预测值可能 >1 或 <0，违背概率的合法范围；(2) 线性回归假设误差正态分布，而分类 0/1 数据的误差分布不可能正态（异方差性极严重——边界附近方差小，中间方差大）；(3) 线性回归的线性性假设不适合 0/1 响应。逻辑回归使用 MLE 估计参数（无闭式解，用梯度下降/Newton-Raphson 迭代求解），系数解释为对数几率比 ln(P/(1-P)) = Xβ，exp(βⱼ) 是特征 Xⱼ 每增加 1 单位时的优势比（Odds Ratio）。损失函数为交叉熵/对数损失：L = -[y·log(p) + (1-y)·log(1-p)]。',
    tags: ['logistic regression', 'sigmoid', 'odds ratio', 'cross entropy'],
    subTopic: '回归分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-55',
    category: 'statistics',
    question: '多项式回归是什么？相比线性回归有哪些注意事项？',
    answer:
      '多项式回归是线性回归的扩展，通过在回归模型中添加预测变量的高次项（X², X³, ...）来拟合非线性关系：Y = β₀ + β₁X + β₂X² + ... + βₖXᵏ + ε。注意，虽然模型对特征 X 是非线性的，但对参数 β 是线性的（仍属线性回归范畴，可用 OLS 求解）。关键注意事项：(1) 多项式阶数选择——阶数过低欠拟合，过高过拟合（Runge 现象，在边界剧烈震荡），通常 d=2 或 3 最常用，用交叉验证确定最优阶数；(2) 多重共线性——X 和 X² 之间经常高度相关（如 X 集中在 [0,1] 区间），建议先对 X 做中心化或使用正交多项式；(3) 外推风险——多项式在训练区间之外的行为极不可靠，不应外推；(4) 替代方案——样条回归（Spline）或局部回归（LOESS）常比高阶全局多项式更好，在分段内灵活而不存在全局强假设。',
    tags: ['polynomial regression', 'nonlinear', 'overfitting'],
    subTopic: '回归分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-56',
    category: 'statistics',
    question: '交互项（Interaction Term）在回归中的含义和如何解释？',
    answer:
      '交互项 X₁·X₂ 捕捉两个自变量之间的联动效应——X₁ 对 Y 的影响依赖于 X₂ 的取值（效应修饰）。模型：Y = β₀ + β₁X₁ + β₂X₂ + β₃(X₁·X₂) + ε。X₁ 对 Y 的边际效应 = β₁ + β₃X₂，不再是常数。解释：β₃ 的正负表示交互方向——β₃>0 表示 X₂ 增大时 X₁ 的正效应被放大（协同效应），β₃<0 表示 X₂ 增大时 X₁ 的效应被削弱（拮抗效应）。注意事项：(1) 加入交互项后主效应系数的含义改变——β₁ 变成了 X₂=0 时 X₁ 的效应，因此建议对连续变量先做均值中心化（X\'=X-X̄），使主效应可解读为"在 X₂ 均值处的 X₁ 效应"；(2) 交互项引入后常导致多重共线性（X₁·X₂ 与 X₁、X₂ 相关），中心化可缓解；(3) 三阶及以上交互项很难直观解释，应谨慎使用。',
    tags: ['interaction', 'effect modification', 'centering'],
    subTopic: '回归分析',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-57',
    category: 'statistics',
    question: '逐步回归（Stepwise Regression）存在哪些问题？为什么不推荐使用？',
    answer:
      '逐步回归（前向选择、后向消除、双向）通过反复添加/删除自变量的自动化过程选择模型，但其存在严重问题：(1) 多重比较问题——每步都在做多个假设检验，P 值远远低估了真实的 Type I 错误率；(2) 不稳定性——数据微小扰动可能导致选出的变量集完全不同，模型不稳定；(3) 参数估计有偏——系数估计被夸大（"赢家诅咒"效应），因为入选的变量恰好通过了显著性门槛；(4) R² 偏大——对最终模型的拟合优度过于乐观，交叉验证可暴露此问题；(5) 忽略模型不确定性——最终模型被视为"真理"，忽略了其他可能同样好的替代模型；(6) 假设了全局最优路径，但每步的贪心选择不一定导致全局最优。替代方法：LASSO（自动特征选择+正则化）、基于信息准则的全子集搜索（n 较小时）、领域知识驱动的变量选择。Frank Harrell 指出"逐步回归是现代统计中最被滥用的方法之一"。',
    tags: ['stepwise regression', 'model selection', 'p-hacking'],
    subTopic: '回归分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-58',
    category: 'statistics',
    question: 'L1 和 L2 正则化的数学原理和几何直观是什么？',
    answer:
      '正则化通过向损失函数添加惩罚项抑制模型复杂度，防止过拟合。L2（Ridge）：损失 = MSE + λ∑βⱼ²。梯度：∂L/∂β = -2Xᵀ(y-Xβ) + 2λβ，解析解 β̂ = (XᵀX + λI)⁻¹Xᵀy，λI 确保 XᵀX+λI 可逆（解决奇异阵问题）。L1（Lasso）：损失 = MSE + λ∑|βⱼ|。梯度（次梯度）：∂L/∂βⱼ = -2Xᵀ(y-Xβ) + λ·sign(βⱼ)，解析解不存在，需用坐标下降或 LARS 求解。几何直观：将无约束最优解 β̂_OLS 投影到范数约束区域内——L2 球面产生连续收缩但不产生 0，而 L1 菱形角在坐标轴上，RSS 等高线更容易在角处与菱形相交产生稀疏解（某些 βⱼ 精确为 0）。贝叶斯视角：L2 等价于 β~N(0, σ²/λ) 正态先验的 MAP 估计，L1 等价于 β~Laplace(0, 1/λ) 拉普拉斯先验的 MAP 估计，拉普拉斯先验在 0 处有尖峰，解释了稀疏性。',
    tags: ['L1', 'L2', 'regularization', 'lasso', 'ridge'],
    subTopic: '回归分析',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-59',
    category: 'statistics',
    question: 'AIC 和 BIC 模型选择准则的区别是什么？如何解读？',
    answer:
      'AIC（赤池信息准则）= -2·ln(L̂) + 2k，BIC（贝叶斯信息准则）= -2·ln(L̂) + k·ln(n)，其中 L̂ 为最大似然值，k 为参数个数，n 为样本量。两者都追求"拟合度与复杂度平衡"——第一项衡量拟合（越小越好），第二项惩罚模型复杂度。核心区别：AIC 的复杂度惩罚是常数（每增加一个参数 +2），BIC 的惩罚随 n 增长而加大（n≥8 时 ln(n)>2，BIC 更严苛）。理论目标不同：AIC 最小化预测误差（K-L 散度），旨在选出最佳预测模型（即渐近等价于留一法交叉验证）；BIC 假设存在一个真实模型，旨在选出它的概率最大化，当 n→∞ 时 BIC 相容（选择真实模型的概率→1），而 AIC 可能选过复杂的模型。实用：如果目标是预测，优先 AIC；如果目标是解释和找到"真实模型"，优先 BIC。两者均为相对度量——只能比较模型，低的更好，但不能判断绝对质量。',
    tags: ['AIC', 'BIC', 'model selection', 'information criterion'],
    subTopic: '回归分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-60',
    category: 'statistics',
    question: '残差分析（Residual Analysis）包括哪些内容？如何判断模型是否合适？',
    answer:
      '残差分析是回归诊断的核心，通过检查残差 eᵢ = yᵢ - ŷᵢ 来检验模型假设。标准诊断图：(1) 残差 vs 拟合值图——应无模式地随机散布在 0 附近，若呈漏斗形则为异方差性，若呈曲线形则说明非线性未捕获；(2) Q-Q 图——残差分位数 vs 理论正态分位数，若近似直线则为正态性满足，明显偏离（S 形或重尾）说明非正态；(3) Scale-Location 图——|标准化残差|^(1/2) vs 拟合值，检验同方差性，水平线为佳；(4) 残差 vs 杠杆值图（Cook 距离等高线）——识别高影响点，Cook 距离 > 4/n 或在图中有标记为有影响点。此外：学生化删除残差检验异常值、Durbin-Watson 检验自相关、偏残差图检查单个特征的线性性。若诊断发现问题，可选变换因变量（Box-Cox）、使用稳健回归（Huber/RANSAC）、或改用非线性模型。',
    tags: ['residual', 'diagnostic plot', 'QQ plot', 'cook distance'],
    subTopic: '回归分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ============================================================
  // 6. 假设检验扩展 (5 questions)
  // ============================================================
  {
    id: 'stats-61',
    category: 'statistics',
    question: '什么是功效（Power）？影响功效的因素有哪些？',
    answer:
      '统计功效（Statistical Power）= 1 - β，即当备择假设 H₁ 为真时正确拒绝原假设 H₀ 的概率，本质衡量"检测到真实效应的能力"。影响功效的核心因素有四个：(1) 效应量（Effect Size）——真实差异越大功效越高，如 Cohen d = 0.8（大效应）比 d = 0.2（小效应）更容易检测，效应量由业务含义决定而非统计调整；(2) 样本量（Sample Size n）——n 越大标准误越小，检验统计量越易落入拒绝域，功效随 n 单调递增，这是实践中唯一可完全控制的参数；(3) 显著性水平 α——α 放宽（如 0.01→0.05）扩大拒绝域、提升功效，但代价是 Type I Error 率上升；(4) 数据变异性 σ——方差越小数据越集中，组间差异越容易被区分，可用 CUPED 等方法降低方差以间接提升功效。此外，检验类型也影响功效：参数检验比非参数检验功效高，单尾检验在正确方向下比双尾功效高，配对设计比独立样本功效高（消除个体间变异）。在 AB 实验中行业标准功效设定为 80%，意味着即使存在真实效应，仍有 20% 概率被漏掉。功效分析必须在实验设计阶段完成，事后功效分析（Post-hoc Power）在逻辑上存在循环论证缺陷，建议通过置信区间宽度来判断实验精度。',
    tags: ['power', 'sample size', 'type ii error', 'effect size'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-62',
    category: 'statistics',
    question: '如何确定AB实验的样本量？基于MDE和功效的推导过程。',
    answer:
      'AB 实验样本量的确定基于四个关键参数的权衡：显著性水平 α（通常 0.05）、期望统计功效 1-β（通常 0.8）、最小可检测效应 MDE（用 δ 表示）、以及指标标准差 σ。对于连续指标（如人均消费金额），每组所需样本量公式为：n = 2σ²(Z_{α/2} + Z_β)² / δ²。其中 Z_{α/2} 是正态分布在 α/2 处的分位数（α=0.05 双尾时 Z=1.96），Z_β 是正态分布在 β 处的分位数（β=0.2 时 Z≈0.84）。推导逻辑：(1) 在 H₁ 为真时，组间差异的检验统计量服从非中心正态分布 N(δ/SE, 1)；(2) 拒绝域为 |Z| > Z_{α/2}，求解 P(拒绝|H₁) ≥ 1-β 即得上述公式。对于比例指标（如转化率），方差 Var = p(1-p)，样本量公式为 n = (Z_{α/2}+Z_β)²[p₁(1-p₁)+p₂(1-p₂)]/(p₁-p₂)²。实例：基线转化率 p₀=10%，期望检测 MDE=1 个百分点（p₁=11%），则 δ=0.01，n = (1.96+0.84)²×[0.1×0.9+0.11×0.89]/(0.01)² ≈ 14,700 人/组。样本量估算的最大挑战是合理设定 MDE——MDE 必须兼顾统计可行性（不能太小导致样本量过大）和业务意义（不能太大导致错过有商业价值的改善）。一般做法是回溯最小业务意义（Smallest Effect of Business Interest），结合历史数据方差估算。',
    tags: ['sample size', 'mde', 'power analysis'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-63',
    category: 'statistics',
    question: '什么是多重比较问题（Multiple Comparisons）？Bonferroni、FDR等方法如何选？',
    answer:
      '多重比较问题（Multiple Comparisons Problem）指同时进行多次假设检验时，家族错误率（Family-Wise Error Rate, FWER = P(至少一次 Type I Error)）会急剧膨胀。例如单次检验 Type I 错误率为 0.05，进行 20 次独立检验时，FWER = 1-(0.95)²⁰ ≈ 64%，即即使所有原假设都成立，仍有近 2/3 概率"发现"至少一个假阳性。控制方法分为两类：(1) FWER 控制——Bonferroni 校正将每次检验的 α 调整为 α/m（m 为检验次数），简单但极端保守（尤其检验不独立时）；Holm 逐步法在 Bonferroni 基础上提升功效但仍严格；Tukey HSD 专为 ANOVA 事后两两比较设计，比 Bonferroni 功效高。(2) FDR 控制——Benjamini-Hochberg（BH）过程控制"在所有被拒绝的原假设中，假阳性的期望比例"不超过 q（通常 0.05）；步骤为将 p 值升序排列 p(1)≤...≤p(m)，找到最大 k 满足 p(k) ≤ k×q/m，拒绝前 k 个；BH-FDR 比 FWER 方法宽松得多，更适用于探索性场景。选择指南：验证性场景（一次性关键决策，如药监局审批、AB 实验核心指标）→ FWER 方法（Bonferroni/Holm），因为假阳性代价极高；探索性场景（多指标扫描找信号，如基因表达差异分析、AB 实验的辅助指标分析）→ FDR 方法（BH），容忍一定假阳性以保留统计功效。在 AB 实验中，若仅 1 个核心指标无需多重比较校正；若同时监控多个指标，核心指标可用 FWER 严格保护，辅助指标标记为探索性并用 FDR。',
    tags: ['multiple comparisons', 'bonferroni', 'fdr', 'fwer', 'bh'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-64',
    category: 'statistics',
    question: '单尾检验 vs 双尾检验：什么时候用哪个？举例说明。',
    answer:
      '双尾检验的备择假设 H₁: μ≠μ₀，拒绝域均分在左右两侧各 α/2，用于检测"是否有差异（不论方向）"，是统计推断的默认和保守选择。单尾检验的备择假设为 H₁: μ>μ₀ 或 H₁: μ<μ₀，拒绝域全部集中在指定方向的一侧（全部 α），在相同显著性水平下比双尾检验有更高的统计功效（因为拒绝域更大），但代价是完全放弃检测反方向效应的能力。举例：电商 AB 测试新推荐算法预期提升点击率，理论上有明确方向预期，但实践中仍用双尾检验——因为如果新算法反而显著降低了点击率，产品团队需要知道这一信息以避免上线有害策略，双尾检验能同时检测正向和负向效应。适合单尾检验的场景：(1) 非劣效性检验（Non-Inferiority Trial），只需证明新方案不比标准方案差（如仿制药审批）；(2) 合规场景中仅需检测某一方向的超标；(3) 物理/工程领域有理论保证效应方向不可能反向。关键原则：必须在数据收集前预先声明单尾检验的方向和理由，严禁在看到数据趋势后再切换为单尾（属于 P-hacking 的典型形式）。绝大多数学术期刊和业界标准默认要求双尾检验，因为其对不确定方向的真实场景更稳健。',
    tags: ['one-tailed', 'two-tailed', 'hypothesis testing'],
    subTopic: '假设检验',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-65',
    category: 'statistics',
    question: '什么是P-hacking？如何避免P-hacking？',
    answer:
      'P-hacking（P 值操纵）是指研究者通过有意或无意的灵活数据分析决策，人为将 P 值压低至显著性阈值（如 <0.05）以下的做法，显著增大了假阳性率，是"可重复性危机"（Replication Crisis）的重要推手。常见 P-hacking 手段包括：(1) Peeking——在数据收集过程中反复检查结果，一旦 P<0.05 就停止，由于 P 值在实验过程中剧烈波动，这种做法大幅提高了假阳性概率（如连续 Peeking 可将实际 α 从 0.05 放大至 0.3 以上）；(2) 选择性报告——测量了多个因变量但只报告显著的，或分析了多个子组后只呈现有显著差异的子组；(3) 灵活性分析——尝试多种数据处理方式（剔除异常值、不同协变量组合、不同模型）后选择产生显著结果的；(4) 选择性停止——看到数据达到预期后立即终止数据收集。避免方法：(1) 预注册（Pre-registration）——在数据收集前公开登记研究假设、分析方法、样本量，分析时严格按计划执行，偏差需透明报告；(2) 区分确证性分析和探索性分析——事先声明核心指标（Primary Metric）和确证性检验，其他分析标注为探索性并相应调整解读；(3) 使用序贯检验框架（Sequential Testing / Group Sequential Design）替代随意 Peeking，预先规划期中分析的时间和 α 消耗；(4) 结果全报告——公开所有测量指标和分析尝试，无论显著与否；(5) 独立复制——在独立数据集上验证已发现的效应。在 AB 实验平台中，应当锁定样本量和分析方案，避免实验者因看到结果而提前终止。',
    tags: ['p-hacking', 'reproducibility', 'research ethics', 'preregistration'],
    subTopic: '假设检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 7. AB实验 (15 questions)
  // ============================================================
  {
    id: 'stats-66',
    category: 'statistics',
    question: '什么是AB实验？AB实验的基本流程和核心要素是什么？',
    answer:
      'AB 实验（A/B Testing，也称在线对照实验 Online Controlled Experiment）是将用户通过随机分流（Randomization）分配到对照组（Control）和实验组（Treatment），只改变单一变量（策略），通过比较两组指标差异来科学评估该策略因果效应的黄金标准方法。基本流程分为六步：(1) 定义假设——明确要验证的因果关系和关键指标（如"新的商品排序算法比旧算法提升转化率 2%"）；(2) 实验设计——确定实验单位（用户/设备/会话）、样本量（基于 MDE 和功效分析）、分流比例（通常 50/50）、实验时长（通常 1-2 个业务周期）、成功标准；(3) 随机分流——通过哈希函数（如 MD5(userId+seed)）将用户确定性分配到各组，确保组间除干预外完全可比；(4) 数据收集——实验期间持续采集各组的指标数据，同时监控数据质量（如 SRM 检测）；(5) 统计分析——使用 t 检验/卡方检验或贝叶斯方法比较组间差异，计算 P 值和置信区间；(6) 决策发布——综合统计显著性、实际显著性（效应量是否达到业务阈值）和护栏指标表现决定是否全量上线。核心要素包括：随机化（消除混淆变量，是因果推断的基础）、对照（Control 提供反事实基准）、足够的样本量和实验时长（确保统计功效和结果代表性）。AB 实验的优势在于通过随机化建立了"相关≈因果"的条件，但它也有限制：不适合网络效应强的产品（如社交平台）、难以捕捉长期效应、需要足够流量支撑。',
    tags: ['ab testing', 'experiment design', 'randomization', 'rct'],
    subTopic: 'AB实验',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-67',
    category: 'statistics',
    question: '什么是MDE（Minimum Detectable Effect）？如何在实际业务中设定MDE？',
    answer:
      'MDE（Minimum Detectable Effect，最小可检测效应）是在给定显著性水平 α 和统计功效 1-β 下，实验能够以较高概率检测到的最小真实差异。MDE 是样本量计算的输入参数之一——MDE 越小，所需样本量越大（与 MDE 的平方成反比）。在实际业务中设定 MDE 的步骤：(1) 回溯历史数据——计算指标的均值和标准差，了解其自然波动范围（如"转化率基线 10%，标准差约 2%"）；(2) 确定最小业务意义（Smallest Effect of Business Interest）——与产品和业务团队讨论，多大的提升才值得投入工程资源上线。例如转化率提升 0.1 个百分点可带来年收入增加 500 万，而工程实现成本仅 50 万，那么即使 0.1% 的提升也是"有业务意义的"；(3) 平衡统计可行性和业务意义——若最小业务意义对应的样本量不切实际（如需要数亿用户），则需要调整预期或选择更敏感的指标（如用 CUPED 降方差）；(4) 将业务意义转化为统计 MDE——相对 MDE = 绝对差异 / 标准差 = δ/σ（即 Cohen d），如 d=0.2 为小效应（需要很大样本量），d=0.5 为中等（常规样本量），d=0.8 为大效应（小样本即可）。实践中的经验法则：MDE 不应低于指标自然波动的 2-3%（否则样本量爆炸），也不要高于 10-15%（否则可能错过有价值的改善）。最终，MDE 应在实验设计文档中明确记录，并作为后期解读结果的参照。',
    tags: ['mde', 'minimum detectable effect', 'sample size'],
    subTopic: 'AB实验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-68',
    category: 'statistics',
    question: '什么是第一类错误（Type I Error）和第二类错误（Type II Error）？在AB实验中分别对应什么业务风险？',
    answer:
      '第一类错误（Type I Error, False Positive / 假阳性）是在原假设 H₀（无效应）为真时错误拒绝 H₀ 的概率，记为 α，通常设定为 0.05（5%）。第二类错误（Type II Error, False Negative / 假阴性）是在备择假设 H₁（有效应）为真时未能拒绝 H₀ 的概率，记为 β，通常设定为 0.2（统计功效 1-β = 80%）。在 AB 实验中，Type I Error 对应的业务风险是"误认为新策略有效而上线了一个实际上无效甚至有害的功能"，这会导致：(1) 浪费工程资源开发无效功能；(2) 损害关键指标（如转化率下降、用户流失增加）；(3) 降低后续实验效率（用户对频繁变化失去信任）；(4) 增加技术债务。Type II Error 对应的业务风险是"错过一个真正有效的策略"，这会导致：(1) 失去提升指标的机会成本；(2) 创新速度减慢；(3) 团队士气受挫（好的想法被数据否定）。两类错误的取舍取决于业务场景：在金融风控或医疗领域，Type I Error 的代价极高（批准无效药物会危害患者），因此倾向于设定更严格的 α（如 0.01）；在广告优化或推荐场景，Type I Error 的成本相对较低（推荐效果差可以快速回滚），而 Type II Error（错过有效策略）的机会成本更高，因此可以适当容忍较高的 α 或使用 Multi-Armed Bandit 方法以更快地发现好的策略。在样本量固定时，α 和 β 存在此消彼长的权衡——降低 α 必然增大 β，唯一同时降低两者的是增加样本量。',
    tags: ['type i error', 'type ii error', 'business risk', 'false positive'],
    subTopic: 'AB实验',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-69',
    category: 'statistics',
    question: 'AB实验中的SRM（Sample Ratio Mismatch）是什么？如何检测和处理？',
    answer:
      'SRM（Sample Ratio Mismatch，样本比例不匹配）是指 AB 实验中实际分配到各组用户数比例与预期分配比例显著不一致的现象。例如预期 50/50 分流，但实际观测到对照组 48%、实验组 52%，这种偏离超出了随机误差允许的范围（通过卡方检验判断）。SRM 是 AB 实验数据质量的"金丝雀"——它几乎总能暴露出系统性问题。常见原因包括：(1) 分流代码 bug（如浏览器兼容性问题导致部分用户未正确分桶）；(2) 实验组体验问题导致用户无法进入（如白屏错误、加载失败），这些用户未被计入实验组但计入了对照组；(3) 机器人/爬虫流量被不均匀地分配到各组；(4) 数据管道差异（如对照组和实验组的数据处理延迟不同）；(5) 缓存或 CDN 导致不同组的访问模式差异。检测方法：使用卡方拟合优度检验（Chi-Square Goodness of Fit Test），H₀ 假设观测比例 = 预期比例，若 P < 0.001（更严的阈值以高灵敏度检测）则标记 SRM 告警。处理步骤：(1) 一旦检测到 SRM，立即暂停并调查根因；(2) 检查分流代码和日志，按设备/浏览器/地区等维度拆解看 SRM 是否集中在某个维度；(3) 修复后重启实验，SRM 数据不得用于统计推断（因为组间已不可比，即使 P 值显著也不可信）；(4) 记录 SRM 事件于实验报告中。谷歌和微软等公司将 SRM 检查设为实验平台自动化的第一步质量检验，是可信实验结果的前提条件。',
    tags: ['srm', 'sample ratio mismatch', 'data quality', 'chi-square'],
    subTopic: 'AB实验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-70',
    category: 'statistics',
    question: '什么是辛普森悖论（Simpson\'s Paradox）？在AB实验中如何避免？',
    answer:
      '辛普森悖论（Simpson\'s Paradox）是指数据在总体层面呈现的趋势，在按某个混杂变量分组后，各子组内的趋势可能与总体趋势完全相反的现象。经典案例：UC Berkeley 研究生录取数据中，总体数据显示男性录取率高于女性（性别歧视表象），但按院系分组后发现，在各院系内部女性录取率反而高于男性——真正的原因是女性更多申请了录取率低的院系，院系成为混杂变量。在 AB 实验中，Simpson\'s Paradox 可能表现为：总体指标实验组优于对照组，但按设备类型（iOS vs Android）、用户新旧、时段等维度拆分后，各子组内实验组均劣于对照组，或者反之。这通常由实验组和控制组的用户组成结构发生了变化（如实验组中 iOS 用户比例异常偏高）导致。避免方法：(1) 确保随机分流的正确性——通过 SRM 检查确认各组在协变量上平衡（如设备类型、地区、活跃度等分布应一致）；(2) 预定义细分维度分析——在实验设计阶段就确定需要拆解的关键维度，若发现总体结论与细分维度结论矛盾，优先调查分流质量；(3) 使用 CUPED 或分层随机化来预先平衡关键协变量；(4) 报告加权总体效应——如果各组子类占比不同，应使用标准化的权重计算调整后的总体效应。核心原则：当总体结论与细分分析矛盾时，不要盲目相信总体数字，先排查是否有 SRM 或实验执行偏差。',
    tags: ['simpson paradox', 'confounding', 'segmentation'],
    subTopic: 'AB实验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-71',
    category: 'statistics',
    question: '什么是网络效应/干扰效应（Network Effect/Interference）在AB实验中？如何应对？',
    answer:
      '网络效应/干扰效应（Network Effect / Interference）在 AB 实验中是指，处理组用户的干预可能通过社交网络、共享资源或信息传播间接影响对照组用户，从而违反 SUTVA（Stable Unit Treatment Value Assumption，个体处理值稳定假设）——即每个用户的潜在结果仅取决于自身接受的处理，不受其他用户处理的影响。典型场景：(1) 社交平台——实验组用户看到新的推荐内容后分享给对照组好友，使对照组也间接受到影响；(2) 双边市场（如打车/外卖平台）——实验组降低价格吸引更多用户打车，抢夺了对照组用户的司机供给（供给稀释效应）；(3) 广告竞价——实验组改变出价策略，影响整个竞价市场的价格环境，进而影响对照组的广告效果。网络效应导致的直接后果是：对照组的指标不再是纯净的"基准线"，实验组的效应估计（ATE）出现偏差。应对方案：(1) 集群随机化（Cluster Randomization）——以社交群组/城市/时间段为单位进行随机化，而非以用户个体为单位，确保同一集群内用户接收相同处理，但代价是有效样本量减少、统计功效降低；(2) 两阶段随机化——将用户随机分配到不同"市场"，然后在各市场内部再进行个体随机化，通过比较市场间差异估计直接效应+间接效应；(3) 网络实验分析——利用社交图数据建模 spillover 效应，如使用暴露模型（Exposure Models）将用户按"曝光程度"分层分析；(4) 反事实模拟——用模拟方法估计若无网络效应时的反事实结果。在设计阶段就要判断产品是否存在强网络效应，以决定采用哪种实验设计。',
    tags: ['network effect', 'interference', 'sutva', 'cluster randomization'],
    subTopic: 'AB实验',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-72',
    category: 'statistics',
    question: 'AB实验中的Peeking问题是什么？为什么不能反复看结果？',
    answer:
      'Peeking（窥探/期中分析）是指在 AB 实验尚未达到预设样本量之前，反复查看结果并根据当前的 P 值做出停止或继续的决策。Peeking 的危险在于：P 值在实验过程中是剧烈波动的随机游走过程——即使 H₀ 为真（无效应），P 值也可能在实验早期偶然跌破 0.05，若此时停止实验并将此结果认定为显著，实际 Type I Error 率远高于名义 α=0.05。蒙特卡洛模拟表明，若每天 Peek 一次并在 P<0.05 时停止，实际 α 可能膨胀至 0.20~0.30（名义 α 的 4-6 倍）。Peeking 使实验结果不可靠的根本原因在于，它破坏了固定样本量假设检验的统计保证——传统检验假设样本量是预先固定且唯一的终止条件。正确处理方式：(1) 固定样本量+不 Peeking——预先通过功效分析确定所需样本量，在达到之前不查看结果（最严格的方案，但实践中的诱惑难以抵挡）；(2) 序贯检验（Sequential Testing）——使用序贯概率比检验（SPRT）或 alpha-spending 函数（如 O\'Brien-Fleming、Lan-DeMets 方法），在预先规划的期中分析时间点按规则"消耗"部分 α，使整体 α 仍控制在 0.05；(3) 贝叶斯序贯方法——在贝叶斯框架下使用 P(B > A | Data) 的后验概率作为终止规则，天然支持持续监控；(4) 使用 Always-Valid P-values 或 e-values 进行随时可停止的有效推断。业界最佳实践：实验平台应在实验达到最小样本量/时长前隐藏统计分析结果，或仅显示描述统计，并内置序贯检验框架以防止随意 Peeking。',
    tags: ['peeking', 'sequential testing', 'type i error', 'early stopping'],
    subTopic: 'AB实验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-73',
    category: 'statistics',
    question: 'CUPED（Controlled-experiment Using Pre-Experiment Data）是什么？如何用它降低方差？',
    answer:
      'CUPED（Controlled-experiment Using Pre-Experiment Data，利用实验前数据的对照实验）是一种方差缩减技术，通过将实验前的协变量信息纳入分析模型，减少指标方差从而提升实验灵敏度（以更小样本量检测到同等效应，或同等样本量检测到更小效应）。核心原理与 ANCOVA（协方差分析）相同：构建调整后的指标 Y_cuped = Y - θ(X - X̄)，其中 Y 是实验期指标，X 是同一用户实验前的相同指标（或其他高度相关的协变量），θ = Cov(Y,X)/Var(X) 是最优调整系数。方差缩减比例 = 1 - ρ²，其中 ρ 是 Y 和 X 之间的相关系数——相关系数越高缩减越大。例如实验前 GMV 与实验期 GMV 的相关系数为 0.7，则方差缩减约 49%，相当于样本量需求减半。CUPED 的关键要求：(1) X 必须在实验开始前测量（保证不受实验干预影响），否则会引入偏差（如用实验期数据做协变量会将干预效应部分也"调整掉"）；(2) X 和 Y 之间的相关性须稳定（通过历史数据验证）；(3) 调整在实验层面而非用户层面（使用对照组的总体回归系数 θ，而非各用户单独估计）。CUPED 常见变体：分层 CUPED（在随机化层内做调整）、多协变量 CUPED（使用多个实验前协变量）、非线性 CUPED（通过机器学习模型估计 X 的非线性函数）。微软和 Netflix 等公司的报告显示 CUPED 通常可将实验灵敏度提升 10-50%，极大降低实验所需样本量和时长。实践中需注意：CUPED 应用于连续指标效果好，对二分类指标（转化率）效果较有限。',
    tags: ['cuped', 'variance reduction', 'pre-experiment data', 'ancova'],
    subTopic: 'AB实验',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-74',
    category: 'statistics',
    question: '什么是分流（Randomization）？哈希分流 vs 随机数分流各有什么优劣？',
    answer:
      '分流（Randomization / Traffic Splitting）是 AB 实验的核心机制，通过随机或伪随机方式将用户分配到不同实验组，确保组间在一切已知和未知因素上统计平衡，从而使组间指标差异仅归因于干预本身。两种主流实现方式：(1) 哈希分流——使用确定性哈希函数（如 MD5、SHA256、MurmurHash3）对用户标识符+实验层种子（userId + layerSeed）计算哈希值，然后对 10000（或其他模数）取模，根据余数区间映射到各组。哈希分流的优势是确定性——同一用户在同一实验层多次访问始终分到同一组（保证用户体验一致性），且无需存储状态；劣势是哈希碰撞会导致轻微不均匀（但大样本下可忽略），且不易实现不等比分流（如 20%/80%）；(2) 随机数分流——对每个用户生成随机数（或从随机数表中查找），决定其分组。随机数的优势是实现简单、天然支持任意分流比例；劣势是若没有持久化存储，同一用户在不同请求中可能分到不同组（需要数据库记录），增加系统复杂度。工程实践中哈希分流占主流：(1) 使用稳定的用户标识（UserId 或 DeviceId）；(2) 添加 Salt（实验层种子）实现分层——同一用户在不同实验层中得到不同的独立哈希值，支持正交实验（Google 的 Overlapping Experiments）；(3) 哈希值映射到 0-9999 区间后灵活分配各组的区间段。分流质量通过 SRM 检查持续监控，确保代码无 Bug 且各维度分布平衡。',
    tags: ['randomization', 'hash', 'traffic splitting', 'deterministic'],
    subTopic: 'AB实验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-75',
    category: 'statistics',
    question: '当AB实验无法达到统计显著性时，如何决策？（如：样本量不够、效应太小）',
    answer:
      '当 AB 实验数据收集结束后结果未达到统计显著性（P > 0.05）时，决策不能简单地"不拒绝 H₀ 就接受 H₀（无效应）"，而应结合多方面信息综合判断。分析框架：(1) 检查实验执行质量——是否存在 SRM（样本比例不匹配）、数据管道错误、实验组 bug 等技术问题导致数据不可靠；(2) 查看置信区间而非仅看 P 值——效应量的 95% 置信区间提供了更丰富的信息。例如 95% CI = [-0.5%, +2.0%] 包括 0（不显著），但上限 2.0% 表明真实效应可能高达 2%——此时"不显著"可能是因为样本量不足而非无效，应评估 2% 的业务价值决定是否继续实验；(3) MDE 比对——实际 CI 是否超过了 MDE 上限？如果 95% CI 为 [-0.1%, +0.3%] 且 MDE=1%，意味着数据已足够排除大于 MDE 的效应，可以较有信心地认为"无重要效应"；(4) 结合护栏指标——即使核心指标不显著，若护栏指标也无恶化趋势，可以降低上线风险；(5) 考虑贝叶斯后验概率——计算 P(Effect > 0 | Data) 和 P(Effect > MDE | Data)，作为频率学框架的补充。决策选项：若 CI 足够窄且排除了有业务意义的效应→可放弃该策略；若 CI 宽但效应方向有利且护栏安全→可延长实验时间或扩大样本量；若样本量已巨大但效应仍极小→该策略大概率无实际价值。核心教训：不要用 P > 0.05 简单否定一个策略，应用效应量和精度做科学判断。',
    tags: ['decision making', 'non-significant', 'practical significance', 'confidence interval'],
    subTopic: 'AB实验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-76',
    category: 'statistics',
    question: 'AB实验中如何处理多个指标（如：核心指标 vs 护栏指标）？',
    answer:
      'AB 实验通常同时监控多个指标，这些指标按照角色分为不同层级：(1) 核心指标（Primary/Decision Metrics, 1-2 个）——实验直接旨在改善的指标，如 GMV、转化率、点击率，实验结果是否"成功"主要由核心指标决定；(2) 护栏指标（Guardrail Metrics）——不期望实验对其产生负面影响的关键业务指标（如用户留存率、客诉率、页面加载时间），它们设立了实验的安全底线，即使核心指标显著提升，护栏指标若显著恶化也应否决实验；(3) 诊断指标（Diagnostic Metrics）——帮助理解实验机制和解释结果的辅助指标（如各页面的跳出率、搜索次数），不是决策依据。多指标处理策略：(1) 核心指标层面——因为只有 1-2 个（或使用组合指标 OEC = Overall Evaluation Criterion），一般无需多重比较校正；(2) 护栏指标层面——每个护栏指标单独检验，若统一使用 α=0.05，多个护栏指标会放大整体 Type I Error 的 FWER，建议对护栏指标组使用 Bonferroni 校正或将 α 设为更严的标准（如 0.01），同时可允许"定向宽松"——护栏指标只关注是否"显著恶化"（单尾），而非双向变化；(3) 整体决策矩阵——通常使用 Trustworthy 区域规则：核心指标显著且护栏无明显负面且 SRM 通过→上线；核心指标显著但某护栏显著恶化→暂停并调查；核心指标不显著→原则上不上线，除非有强业务理由。谷歌推荐的实验评估框架中，每实验只设 1 个 OEC（OEC 可以是多个指标的加权组合），并使用分层 FDR 控制探索性指标。',
    tags: ['metrics', 'guardrail metrics', 'oec', 'multiple testing'],
    subTopic: 'AB实验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-77',
    category: 'statistics',
    question: '什么是长期效应（Long-term Effect）？AB实验中如何评估长期效应？',
    answer:
      '长期效应（Long-term Effect）是指在 AB 实验的初期观察到的效应，在经过足够长时间后可能衰减、逆转或产生新效应，使得短期实验结论不能代表长期的真实因果效应。两大典型现象：(1) 新颖效应（Novelty Effect）——用户在实验初期因新界面/新功能的新鲜感而产生较高的参与度，但随着时间推移新鲜感消退，指标回归甚至低于原水平。例如新页面设计上线首周点击率提升 20%，但一个月后回落到仅提升 3%；(2) 学习效应（Learning Effect）——用户需要时间学习和适应新功能，实验初期指标可能下降（困惑期），但长期随着用户熟悉操作后指标逐步提升并超过原水平；(3) 延迟反馈效应——某些指标在短期内无法体现（如用户终身价值 LTV），需要长期跟踪。评估长期效应的方案：(1) 拉长实验周期——将标准 2-4 周的实验延长到 8-12 周（代价是流量和机会成本增加）；(2) 保留回溯队列（Holdout / Long-term Holdout）——在全量上线新策略时，保留一小部分用户（如 1-5%）持续作为对照组（长期对照），定期对比两组指标差异，检测短期实验未能捕捉的长期效应。微软和谷歌都在关键功能上线后维持 Holdout 组以持续验证长期效果；(3) 衰减建模——使用衰减函数（如指数衰减）对短期效应进行建模，外推长期稳态效应；(4) 因果推断方法——当无法做 AB 实验时（如已全量），用 DID、Synthetic Control 等方法辅助评估。核心原则：短期 AB 实验测的是"初始效应"，长期效应评估是持续的产品洞察过程。',
    tags: ['long-term effect', 'novelty effect', 'learning effect', 'holdout'],
    subTopic: 'AB实验',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-78',
    category: 'statistics',
    question: '贝叶斯AB测试 vs 频率学AB测试：各自的优缺点和适用场景？',
    answer:
      '贝叶斯 AB 测试和频率学 AB 测试是两种不同的统计推断哲学，各有优劣。频率学 AB 测试：(1) 基于抽样分布理论，输出 P 值和置信区间，最终决策为"拒绝/不拒绝 H₀"的二元结论；(2) 要求固定样本量（需预先计算），实验期间不能随意 Peeking；(3) 结果解读中 P 值经常被误解（P 值 ≠ H₀ 为真的概率，也 ≠ 效应大小）。优点：客观（不依赖先验）、简单（单次二元决策清晰）、计算成本低、业界和监管认可度高。缺点：不能提前终止、不能直接回答"新策略更好的概率是多少"。贝叶斯 AB 测试：(1) 基于贝叶斯定理，输出后验概率分布（如"实验组优于对照组的概率为 97%"），结果更加直观；(2) 支持在线持续更新后验，允许在证据充分时提前终止（节省流量）；(3) 能自然整合历史数据作为先验（小流量测试更友好）；(4) 多次 Peeking 不改变统计保证（因为后验更新即贝叶斯学习过程本身）。缺点：先验选择可能带有主观性（但可用弱信息先验或非信息先验缓解）、计算成本较高（需 MCMC 或数值积分）、不一致的先验可能产生不同结论。适用场景选择：监管密集型场景（医疗审批）和结论需广泛外部认可的→频率学；内部快速迭代大量实验的互联网公司→贝叶斯（灵活性高、节省流量）；流量稀缺的小型测试→贝叶斯（先验信息弥补样本量不足）；多次序贯决策且机会成本高→贝叶斯或频率学序贯框架。实践中 Google、Microsoft、Netflix 等已广泛采用贝叶斯 AB 框架迭代海量实验。',
    tags: ['bayesian', 'frequentist', 'ab testing', 'comparison'],
    subTopic: 'AB实验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-79',
    category: 'statistics',
    question: '多臂老虎机（Multi-Armed Bandit）与AB实验的区别？什么场景用Bandit？',
    answer:
      '多臂老虎机（Multi-Armed Bandit, MAB）是一种自适应实验方法，来源于强化学习中的"探索-利用"（Exploration-Exploitation）权衡问题：如何在尝试多个策略（探索）与集中资源到当前最佳策略（利用）之间动态分配流量。与 AB 实验的核心区别：(1) 流量分配——AB 实验固定各组流量比例（如 50/50）且全程不变，MAB 根据实时观察到的各臂表现动态调整流量比例，表现越好的臂分到的流量越多；(2) 目标——AB 实验目标是获得可靠的统计推断结论（回答"哪个更好"），而 MAB 的目标是在实验过程中最大化总体回报（Regret Minimization，在"学习"的同时尽量减少损失）；(3) 结果——AB 实验输出 P 值/置信区间/后验概率，MAB 输出最终的最佳臂选择（但不一定给出精确的效应量化）；(4) 时长——AB 实验有预设实验时长和样本量，MAB 可无限运行持续自适应。常见 MAB 算法：Epsilon-Greedy（以 ε 概率随机探索，其余时间利用最优臂）、Thompson Sampling（根据各臂后验分布采样，以各臂为最优臂的概率进行选择）、UCB（Upper Confidence Bound，选择置信区间上限最大的臂，天然平衡探索与利用）。适用 MAB 的场景：(1) 候选策略极多且差异大（如测试 100 种广告创意），AB 实验逐个比较太低效；(2) 机会成本高（每展示一次差广告就损失潜在收入）；(3) 非平稳环境（用户偏好持续变化需持续适应）。不适用 MAB 的场景：(1) 需要严格因果结论和精确效应量化；(2) 策略改变可能有延迟效应需要足够观察期；(3) 需评估对护栏指标（如留存）的长期影响。实践中 Google Analytics 的内容优化、Netflix 的推荐缩略图选择、雅虎新闻推荐常用 MAB 方法。',
    tags: ['multi-armed bandit', 'exploration-exploitation', 'adaptive', 'thompson sampling'],
    subTopic: 'AB实验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-80',
    category: 'statistics',
    question: '如何设计一个分层AB实验（Layered Experiments）？谷歌的overlapping experiments怎么做？',
    answer:
      '分层 AB 实验（Layered Experiments）是指将用户流量同时分配到多个"实验层"中，每个实验层独立运行一套实验（对流量做正交分割），使得同一用户可以同时参与多个实验但互不干扰。核心机制：每个实验层使用不同的哈希种子（seed），确保用户在不同层之间得到独立的哈希值，从而产生独立的分组。例如 Layer 1 使用 seed=1000 做搜索算法 AB 测试，Layer 2 使用 seed=2000 做 UI 颜色 AB 测试，同一用户可能在 Layer 1 分到实验组、在 Layer 2 分到对照组，两个实验在统计上独立（因为哈希值在层间无相关性）。谷歌的 Overlapping Experiments 框架：(1) 流量视野——总流量被分为多个"域"（Domain），每个域代表一个独立的业务维度（如搜索、广告、UI），不同域之间正交；(2) 在每个域内再细分为多个"层"（Layer），每个层内运行一组互斥实验（同一层内用户只能参加一个实验），而不同层之间正交（独立哈希种子），可以同时运行；(3) 设计关键原则——层的独立性要求不同层的哈希种子确保正交（层间相关系数 ≈ 0）；流量稀释控制（每增加一个实验层，各层内分配给单个实验的流量就减少）；层间交互检测（理论上各层独立，但实践中可能发生交互，如搜索算法和 UI 颜色同时改变时的协同效应，当怀疑存在交互时需设计专门的交互层实验验证）；预留 Backfill 流量用于监测平台整体健康度。分层实验使 Google、Microsoft、Netflix 等公司能在同一时间运行数百个并发实验，极大提升实验迭代速度。',
    tags: ['layered experiments', 'overlapping', 'google', 'orthogonalization'],
    subTopic: 'AB实验',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 8. 因果推断 (5 questions)
  // ============================================================
  {
    id: 'stats-81',
    category: 'statistics',
    question: '相关性和因果性的根本区别是什么？为什么"相关不代表因果"？',
    answer:
      '相关性（Correlation）衡量两个变量之间的统计关联方向和强度（如 Pearson r = 0.8 表示强正向线性关联），而因果性（Causality）意味着一个变量的变化直接导致了另一个变量的变化（操纵 X 会引发 Y 的相应改变）。"相关不代表因果"（Correlation does not imply causation）的根本原因在于混淆变量（Confounder）的存在——第三个变量 Z 同时影响了 X 和 Y，导致 X 和 Y 表面相关但实质上没有直接因果关系。三个经典因果通道导致相关≠因果：(1) 混淆偏倚——冰淇淋销量和溺水死亡正相关，真正原因是夏季温度（Z）同时导致了两者上升；(2) 反向因果——X 和 Y 相关，但实际是 Y 导致 X，而非 X 导致 Y（如"读更多书的学生成绩更好"，可能是好成绩激发了阅读兴趣而非反之）；(3) 选择偏倚——样本选择导致虚假相关（如"在医院里，吸烟者比不吸烟者的肺癌治愈率更高"，因为吸烟者更年轻且更早被检测出）。建立因果关系的金标准是随机对照实验（RCT / AB 实验）——通过随机化消除混淆变量的影响。在无法实验时，使用观察性因果推断方法：工具变量（IV）、双重差分（DID）、断点回归（RDD）、倾向性得分匹配（PSM）等。关键区分：相关性是统计手段能自然发现的模式，因果性需要额外的实验设计或不可检验的假设（如无混淆假设）。数据科学家最常犯的错误之一就是将观测数据中显著的相关关系解读为因果关系，从而做出错误的业务决策。',
    tags: ['causality', 'correlation', 'confounding', 'causal inference'],
    subTopic: '因果推断',
    difficulty: 'easy',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-82',
    category: 'statistics',
    question: '什么是DID（Difference-in-Differences）方法？它的核心假设和平行趋势检验是什么？',
    answer:
      'DID（Difference-in-Differences，双重差分法）是准实验因果推断中最常用的方法之一，通过比较处理组和对照组在处理前后变化量的差异来估计因果效应，从而消除时间趋势和其他不随时间变化的混淆因素。模型设定：Yᵢₜ = β₀ + β₁·Treatᵢ + β₂·Postₜ + β₃·(Treatᵢ × Postₜ) + εᵢₜ。其中 Treatᵢ 是处理组虚拟变量（1=处理组），Postₜ 是处理后时间虚拟变量（1=处理后），交互项系数 β₃ 即为 DID 估计量——因果效应的估计值。DID 估计量 = (处理组后 - 处理组前) - (对照组后 - 对照组前) = 消除共同时间趋势后的净效应。核心假设——平行趋势假设（Parallel Trends Assumption）：如果处理组没有接受干预，其指标的变化趋势应该与对照组相同（即处理组和对照组在处理前有相同的趋势）。检验平行趋势的方法：(1) 视觉诊断——绘制两组在多个处理前时间点的指标趋势图，检查两条线是否大致平行；(2) 事件研究法（Event Study）——在处理前多个时点设置虚拟变量与 Treat 的交互项，检验这些系数是否显著不为 0，若均不显著则支持平行趋势；(3) Placebo 检验——虚构一个处理发生的时间点（在实际处理前），用 DID 方法不应得到显著效应。DID 的局限：平行趋势不可检验"处理后"部分（只是假设其持续成立）、对时间序列长度有要求（需要足够的处理前数据点做趋势检验）、若存在随时间变化的混淆变量（与处理时点相关），DID 估计仍可能有偏。扩展方法包括三重差分（DDD）和合成控制法（Synthetic Control）以增强因果识别的可信度。',
    tags: ['did', 'difference-in-differences', 'parallel trends', 'quasi-experiment'],
    subTopic: '因果推断',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-83',
    category: 'statistics',
    question: '什么是工具变量（Instrumental Variable）？在什么场景下使用？',
    answer:
      '工具变量（Instrumental Variable, IV）是解决回归分析中内生性（Endogeneity）问题的经典方法。当自变量 X 与误差项 ε 存在相关性（由遗漏变量、测量误差或反向因果导致）时，OLS 估计有偏且不一致，IV 通过引入一个"工具"来识别因果效应。有效工具变量 Z 需满足两个核心条件：(1) 相关性（Relevance）——Z 与内生变量 X 显著相关（Cov(Z,X) ≠ 0，即第一阶段回归中 Z 是 X 的强预测变量）；(2) 外生性/排他性（Exogeneity / Exclusion Restriction）——Z 仅通过 X 影响 Y，与误差项不相关（Cov(Z,ε) = 0），即 Z 不能通过 X 之外的任何路径影响 Y。IV 估计通常通过两阶段最小二乘法（2SLS）实现：第一阶段——用 Z（及其他外生变量）回归 X，得到 X 的预测值 X̂；第二阶段——用 Y 对 X̂ 回归，系数即为因果效应的 IV 估计。弱工具变量问题（Weak IV）——当 Z 与 X 仅弱相关（第一阶段 F 统计量 < 10），IV 估计将极不稳定且有偏（向 OLS 偏倚方向偏移），检测规则是 Stock-Yogo 检验。经典 IV 案例：(1) 劳动经济学——用"出生季度"作为教育年限的工具变量（Angrist & Krueger, 1991），因为出生季度影响义务教育结束年龄但与先天能力无关，从而识别教育对收入的因果效应；(2) 经济学——用"降雨量"作为农产品价格的工具变量。现实中寻找合格 IV 是极大的挑战——外生性条件不可直接检验，需要经济学理论和领域知识严密论证。',
    tags: ['instrumental variable', 'iv', 'endogeneity', '2sls'],
    subTopic: '因果推断',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-84',
    category: 'statistics',
    question: '什么是RDD（Regression Discontinuity Design）？适合什么场景？',
    answer:
      'RDD（Regression Discontinuity Design，断点回归设计）是一种准实验因果推断方法，适用于存在一个连续运行变量（Running Variable / Forcing Variable）和一个人为设定的阈值（Cutoff），当运行变量超过阈值时个体才接受处理的情境。核心思想：在阈值附近极小的邻域内，刚过阈值和刚未过阈值的个体（在运行变量上几乎相同）可视为"局部随机化"——处理状态近似随机分配，从而通过比较阈值两侧个体的结果差异来识别因果效应。两种类型：(1) 精确 RDD（Sharp RDD）——运行变量超过阈值后处理概率从 0 跃升到 1（确定性的处理分配）；(2) 模糊 RDD（Fuzzy RDD）——超过阈值后处理概率显著增加但不为 1，此时需用 IV 方法（将阈值作为工具变量）。RDD 估计通过局部多项式回归实现：在阈值两侧分别拟合低阶多项式（通常线性或二次），配合局部带宽（Bandwidth）限制分析窗口在阈值附近。关键挑战是带宽选择：带宽太大引入偏倚（远离阈值的个体可比性差），带宽太小方差大（样本少）；常用 IK（Imbens-Kalyanaraman）或 CCT（Calonico-Cattaneo-Titiunik）数据驱动带宽选择法。适合 RDD 的场景：(1) 教育——录取分数线两侧的学生（如大学录取按排名，分数线附近学生能力相似，比较就学率和后续成就差异识别教育的因果效应）；(2) 政策评估——如"年满 65 岁可获 Medicare 保险"，比较刚满和刚未满 65 岁者的健康指标；(3) 推荐系统——是否展示某推荐位依赖于分数是否超过某阈值（如质量分 > 0.7 才展示）。RDD 的主要局限：只能识别阈值附近的局部平均处理效应（LATE），不能推广到远离阈值的个体人群。',
    tags: ['rdd', 'regression discontinuity', 'quasi-experiment', 'cutoff'],
    subTopic: '因果推断',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-85',
    category: 'statistics',
    question: '倾向性得分匹配（Propensity Score Matching）的原理、步骤和局限性？',
    answer:
      '倾向性得分匹配（Propensity Score Matching, PSM）是观测性研究中用于减少选择偏倚、模拟随机对照实验的因果推断方法。核心原理：倾向性得分（Propensity Score）e(X) = P(T=1|X)，即给定协变量 X 下个体接受处理的概率。Rosenbaum & Rubin (1983) 证明：如果"条件独立性假设"（CIA / Unconfoundedness）成立（即控制了 X 后，处理分配与潜在结果独立），那么控制一维的 e(X) 等价于控制全部高维的 X，极大地简化了匹配问题。PSM 标准步骤：(1) 估计倾向性得分——使用逻辑回归（或其他分类模型）将处理变量 T 对可观测协变量 X 回归，计算每个个体的倾向性得分 ê(X)；(2) 匹配——为每个处理组个体在对照组中找一个 ê 最接近的个体，常用方法包括最近邻匹配、卡尺匹配（设定最大距离阈值）、核匹配（加权使用所有对照组个体）；(3) 平衡性检验——匹配后检查处理组和对照组在各协变量上的标准化均值差异（SMD），通常要求 SMD < 0.1；(4) 因果效应估计——计算匹配后两组结果均值的差异（ATT = 处理组的平均处理效应）。PSM 的局限和注意事项：(1) 仅控制可观测的混淆变量——CIA 假设不可检验，若存在未观测的混淆变量（如动机、天赋），PSM 估计仍可能有偏；(2) 共同支撑域（Common Support）——如果处理组和对照组的倾向性得分分布重叠很少，匹配质量差且需谨慎外推；(3) 匹配后的标准误差需要调整（因匹配引入依赖），通常用 Bootstrap 或 Abadie-Imbens 标准误；(4) PSM 不能替代随机实验——PSM 只能在可观测变量上平衡，无法像随机化那样在未知变量上也取得平衡。替代或增强方法包括逆概率加权（IPTW）、双重稳健估计（DR Estimator）、熵平衡等。',
    tags: ['propensity score matching', 'psm', 'observational study', 'selection bias'],
    subTopic: '因果推断',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 9. 时间序列分析 (8 questions)
  // ============================================================
  {
    id: 'stats-86',
    category: 'statistics',
    question: '什么是时间序列的平稳性（Stationarity）？为什么需要平稳性？',
    answer:
      '平稳性（Stationarity）是时间序列分析最核心的前提概念。严格平稳（Strict Stationarity）要求序列的任意有限维联合分布不随时间平移而改变，但实践中更关注弱平稳（Weak Stationarity），需满足三个条件：(1) 均值恒定 E[Y_t] = μ，不随时间变化；(2) 方差恒定 Var(Y_t) = σ²，不随时间变化；(3) 协方差仅依赖于时间间隔 k 而非绝对时间 t，即 Cov(Y_t, Y_{t+k}) = γ_k。平稳性之所以关键，是因为大多数时间序列模型（ARMA/ARIMA/GARCH）都以平稳序列为基础假设——只有平稳序列的统计特性稳定可估计，才能外推预测。非平稳序列（带有趋势、季节性、随机游走）的均值和方差随时间漂移，历史规律无法直接泛化到未来，会导致伪回归（Spurious Regression）问题——两个完全独立但都有趋势的非平稳序列之间也能观察到高相关和显著回归系数，如两个不相关国家的 GDP 都随时间增长，回归可能得出高 R² 的虚假关系。常见非平稳类型包括：趋势非平稳（确定性趋势）、差分非平稳（单位根随机游走，方差随 t 无限增大）、季节非平稳（周期性波动）。检验方法有 ADF 检验（H₀: 存在单位根=非平稳）和 KPSS 检验（H₀: 平稳），两者互补使用。处理非平稳序列的标准手段包括一阶/多阶差分（消除随机趋势）、季节差分（消除季节非平稳）、对数变换（稳定方差）和去趋势（拟合并移除确定性趋势）。在业务中，分析 DAU、GMV、广告消耗等时序指标前，需先检验平稳性并做相应变换，否则预测模型输出的置信区间会随着时间发散而失去可靠性——例如用 ARIMA 预测非平稳的季度销量而不做差分，预测值可能呈爆炸式增长。',
    tags: ['stationarity', 'unit root', 'spurious regression', 'adf'],
    subTopic: '时间序列分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-87',
    category: 'statistics',
    question: 'ADF检验（Augmented Dickey-Fuller）是如何检验平稳性的？原假设是什么？',
    answer:
      'ADF 检验（Augmented Dickey-Fuller Test）是检验时间序列是否存在单位根（Unit Root）的最常用统计方法，因为单位根是导致非平稳性的核心来源。ADF 检验回归模型为：ΔY_t = α + βt + γY_{t-1} + Σ_{i=1}^p δ_i ΔY_{t-i} + ε_t，其中 Δ 是一阶差分算子，t 是时间趋势项（可选），p 个滞后差分项 ΔY_{t-i} 的引入是为了吸收残差自相关，确保 ε_t 为白噪声。原假设 H₀: γ = 0（序列存在单位根，非平稳）；备择假设 H₁: γ < 0（序列无单位根，平稳）。关键要点：ADF 的 t 检验统计量不服从标准 t 分布或正态分布，而是服从 Dickey-Fuller 非对称分布，其临界值比正态分布更负（如 95% 临界值约 -2.86 而非 -1.65），因此直接用 1.96 为阈值会犯大规模的第一类错误。如果 P 值 > 0.05 则不能拒绝 H₀，意味着数据与"存在单位根"兼容，序列可能非平稳——此时进行一阶差分后再次执行 ADF 检验，直到拒绝 H₀ 确认平稳。ADF 检验需指定三个关键配置：(1) 最大滞后阶数 p——通过 AIC/BIC 自动选择或经验规则设为 floor(12×(T/100)^{1/4})；(2) 确定性成分——仅截距（most common）、截距+趋势（有明显趋势时）、None（均值为 0 的序列）；(3) 若滞后项过多会降低检验功效（Power）。ADF 的主要局限是小样本下低效能，容易将平稳序列误判为非平稳（Type II Error 高），建议配合 KPSS 检验互补判断（ADF H₀: 非平稳, KPSS H₀: 平稳），四种组合中只有"ADF 拒绝非平稳 + KPSS 不拒绝平稳"才能比较确信序列平稳。在业务中评估广告投放 ROI 的时序趋势时，需先用 ADF 检验确认序列平稳性，避免将随机短期波动误判为可信的趋势信号而做出错误预算决策。',
    tags: ['adf', 'unit root', 'dickey-fuller', 'stationarity test'],
    subTopic: '时间序列分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-88',
    category: 'statistics',
    question: 'ARIMA模型的三部分（AR、I、MA）分别代表什么？如何确定p、d、q参数？',
    answer:
      'ARIMA(p,d,q) 是时间序列预测的经典框架，全称为 Autoregressive Integrated Moving Average，由三部分构成。AR(p)（自回归）：当前值 Y_t 是其过去 p 个值的线性组合，Y_t = φ_1 Y_{t-1} + φ_2 Y_{t-2} + ... + φ_p Y_{t-p} + ε_t，参数 φ 衡量历史值对当前的影响权重，要求特征根在单位圆外以确保平稳性。I(d)（差分阶数）：将原始序列进行 d 阶差分使其变为平稳序列——Y\'_t = Δ^d Y_t，大多数经济和业务序列 d = 0（已平稳）或 d = 1（一阶差分后平稳），极少需要 d > 2。MA(q)（移动平均）：当前值是过去 q 个随机冲击（白噪声误差项）的加权和，Y_t = ε_t + θ_1 ε_{t-1} + θ_2 ε_{t-2} + ... + θ_q ε_{t-q}，要求参数满足可逆性条件。模型可理解为：AR 捕捉序列自身的"惯性"（过去值→现在），MA 捕捉外部"冲击的余波"（过去的随机扰动→现在）。确定 p、d、q 的标准方法（Box-Jenkins 方法论）：(1) d 的确定——通过 ADF 检验对原始序列检验平稳性，不平稳则差分后再检验，循环直到平稳，差分次数即为 d；(2) p 和 q 的识别——绘制差分后平稳序列的 ACF（自相关函数）和 PACF（偏自相关函数）图：ACF 拖尾 + PACF 在 p 阶后截尾 → AR(p)；PACF 拖尾 + ACF 在 q 阶后截尾 → MA(q)；两者均拖尾 → ARMA(p,q)，此时在候选网格 (p_max, q_max) 内搜索 AIC/BIC 最小组合；(3) 验证——检查残差是否为白噪声（Ljung-Box 检验残差无自相关）。实践中也可直接用 auto.arima（R 中 forecast 包）或 pmdarima.auto_arima（Python）自动搜索最优参数，内置 KPSS 检验确定 d、逐步搜索确定 p 和 q。在业务预测场景中，ARIMA 适合中短期预测（如未来 30 天日活），模型简洁可解释，但当需要捕捉多季节周期和节假日效应时，Prophet 或 SARIMA 可能更合适。',
    tags: ['arima', 'box-jenkins', 'autoregressive', 'moving average'],
    subTopic: '时间序列分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-89',
    category: 'statistics',
    question: '什么是自相关函数（ACF）和偏自相关函数（PACF）？如何用它们识别AR和MA的阶数？',
    answer:
      '自相关函数 ACF（Autocorrelation Function）衡量时间序列在不同滞后阶数 k 下的自相关系数 ρ_k = Corr(Y_t, Y_{t-k})，即 t 时刻值与 t-k 时刻值之间的线性关联强度；偏自相关函数 PACF（Partial Autocorrelation Function）衡量在剔除了中间滞后值（Y_{t-1}, Y_{t-2}, ..., Y_{t-k+1}）的线性影响后，Y_t 与 Y_{t-k} 之间的"净"相关性。两者的核心区别是 ACF 包含了通过中间值间接传递的关联，而 PACF 是直接关联的纯度量。识别 ARMA 模型阶数的经典规则（Box-Jenkins 方法论）：(1) 纯 AR(p) 过程——ACF 呈指数或阻尼正弦衰减收敛向 0（拖尾/Tail-off），PACF 在滞后 p 阶后陡然截尾（Cut-off），即 |PACF(k)| 在 k>p 后全部落入 95% 置信带 ±1.96/√T 内；(2) 纯 MA(q) 过程——ACF 在滞后 q 阶后截尾，PACF 呈指数衰减拖尾；(3) ARMA(p,q) 过程——ACF 和 PACF 均拖尾，此时图形无法直接指向唯一(p,q)，需结合 AIC/BIC 信息准则在候选参数网格中扫描搜索最优组合。实际判读注意事项：(1) ACF 图中蓝色虚线标示 95% 置信区间（±1.96/√T），显著不为 0 的滞后条柱位于虚线之外；(2) ACF 的缓慢线性下降（而非指数衰减）是序列非平稳的强信号——应采用差分将序列平稳化后再分析；(3) 季节性会在 ACF 图中表现为在季节周期整数倍滞后上的显著峰值（如日数据每 7 天出现峰值说明周季节效应），可通过 SARIMA 的季节项部分 (P,D,Q)_s 建模。在业务数据分析中，ACF 和 PACF 不仅用于模型阶数选择，也揭示指标的周期规律——例如视频平台 DAU 的 ACF 图在滞后 7 和 14 天出现显著自相关，确认周末效应的存在和强度。',
    tags: ['acf', 'pacf', 'box-jenkins', 'model identification'],
    subTopic: '时间序列分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-90',
    category: 'statistics',
    question: '什么是季节性分解（Seasonal Decomposition）？加法模型和乘法模型的区别？',
    answer:
      '季节性分解（Seasonal Decomposition）是将时间序列拆解为几个可解释底层成分的统计技术，使分析师能分别审视趋势、季节和随机波动各自的贡献。经典分解模型包含三个（或四个）成分：趋势（Trend, T_t）——序列长期的整体运动方向（持续增长/下降/平稳）；季节成分（Seasonal, S_t）——固定周期内重复的规律性波动（如周末 vs 工作日、月度、季度）；残差/不规则成分（Residual/Remainder, R_t）——剔除趋势和季节后剩余的随机波动。两种核心分解形式：(1) 加法模型 Y_t = T_t + S_t + R_t——假设各成分独立相加，季节波动的绝对幅度不随趋势水平的升降而改变（如气温数据，冬季和夏季的温度季节波动幅度大致恒定，不会随全球变暖趋势而等比例放大）；(2) 乘法模型 Y_t = T_t × S_t × R_t——假设季节波动幅度与趋势水平成比例（如电商 GMV 数据，每年双十一的爆发规模随着平台整体流量基数扩大而逐年放大，绝对增量逐年变大）。如何判断模型类型？观察时序图——若季节波动幅度伴随趋势增大而明显扩张（呈漏斗/扇形），选乘法模型；若波动幅度稳定，选加法模型。实践中可通过对数变换将乘法转为加法：log(Y_t) = log(T_t) + log(S_t) + log(R_t)。主要分解算法：经典分解法（滑动平均计算趋势）；STL 分解（Seasonal-Trend decomposition using Loess）——基于局部加权回归，鲁棒性好，支持季节成分随时间缓慢演变而非假设恒定季节模式，在实际业务数据分析中使用最广泛；X-13ARIMA-SEATS——由美国人口普查局开发，支持工作日效应、节假日效应和异常值自动检测，适用于经济和官方统计数据。业务价值在于分离"真实增长"与"季节性幻觉"——例如某月 DAU 环比增长 10%，经季节性分解后发现季节成分贡献了 7% 而趋势贡献仅 3%，据此判断产品运营的实际带动效果有限。',
    tags: ['seasonal decomposition', 'stl', 'additive', 'multiplicative'],
    subTopic: '时间序列分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-91',
    category: 'statistics',
    question: 'Prophet模型和传统ARIMA的区别是什么？Prophet为什么适合业务预测？',
    answer:
      'Prophet 是 Facebook（Meta）于 2017 年开源的时间序列预测工具，其设计理念与 ARIMA 有本质差异。模型结构为广义加性模型（GAM）：y(t) = g(t) + s(t) + h(t) + ε_t，即趋势成分 g(t) + 季节成分 s(t) + 节假日效应 h(t) + 误差，每个成分都有直观的业务解释。与 ARIMA 的核心区别如下：(1) 趋势建模——ARIMA 通过差分消除趋势，暗含趋势是随机游走，无法显式表达拐点；Prophet 使用分段逻辑增长（Logistic Growth，饱和上限市场场景）或分段线性趋势，自动检测并拟合趋势变化点（Changepoints），适合业务指标因产品改版、政策变化而出现的趋势拐折；(2) 季节建模——ARIMA 的 SARIMA 扩展可建模单一季节周期（需手动设定 s），Prophet 通过傅里叶级数天然支持多重季节周期（如同时存在周季节和年季节），无需手动指定；(3) 缺失值和异常值——ARIMA 对缺失值极度敏感，需预先插值且方法选择不当会引入建模偏差，Prophet 内置对缺失值和异常值的鲁棒处理，对"脏数据"友好；(4) 节假日效应——Prophet 支持自定义节假日窗口（如双十一、春节），能对节前、节中、节后的效应幅度和影响天数分别建模，ARIMA 需外生变量回归才能处理；(5) 使用门槛——ARIMA 需要分析师有扎实的时序统计功底（单位根检验、ACF/PACF 判读、残差诊断），Prophet 为业务分析师设计，交互式调参友好。Prophet 适合业务预测的核心场景：业务团队需要快速为上千条业务线（如各品类 GMV、各渠道 DAU）生成自动化预测，且需要逐个分解预测为趋势+季节+节假日效应以向管理层解释数字的来源，而非仅仅输出一个"黑箱"预测值。然而在严格的预测竞赛（如 M4 竞赛）中，Prophet 的精度不一定优于精心调参的 ARIMA 或神经网络模型，它的核心优势在于"可解释性 + 自动化 + 鲁棒性"三者的平衡。',
    tags: ['prophet', 'arima', 'gam', 'business forecasting'],
    subTopic: '时间序列分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-92',
    category: 'statistics',
    question: '时间序列中的缺失值如何处理？前向填充、插值和模型预测各有什么优劣？',
    answer:
      '时间序列缺失值的处理方法需充分利用数据的时间依赖特性——相邻时间点的值通常高度相关，蕴含可用于填补的信息。主要方法及优劣：(1) 前向填充（Forward Fill / LOCF, Last Observation Carried Forward）——用最近一个非缺失观测值填充后续缺失。优点是极简快、在线系统友好（无需等待后续数据），且保留最近已知状态；缺点是彻底忽略趋势和周期：如果缺失发生在上升趋势的起点，填充值将系统偏低，且当缺失窗口长（如连续一周缺失）时，一个旧值被重复使用多次，完全不反映此期间的任何变化。适合数据实时流场景中偶尔丢失 1-2 个点的情况。(2) 线性/样条插值（Linear/Spline Interpolation）——根据缺失点前后的已知值在局部范围内做线性或平滑曲线推测。优点是捕捉局部趋势，相比前向填充更精确；缺点是仅利用缺失点邻近的极少数点，当缺失窗口长时线性假设过于强（"两点之间就是直线"）、不确定区间巨大。多项式样条插值可产生更平滑的结果但容易在边界过拟合。(3) 季节性填补——对强季节序列（如日活有明显的周周期），用同一周期位置的历史均值填补（如用过去 4 周的同星期几均值填补本周缺失的周二），比前两种方法充分利用了季节性模式，是最适合业务时序数据的首选填补法。(4) 模型预测填补——使用整个序列训练 ARIMA/ETS 模型，预测缺失点的值（Kalman 滤波可在状态空间模型中同时估计参数和填补缺失值）。优点是全局最优——利用了序列的全部前后信息；缺点是建立模型本身成本高、模型选择错误反而引入系统性偏差。(5) 多重插补（Multiple Imputation）——生成多个填补版本并汇总分析以量化填补不确定性，最严谨但计算量大，主要用于学术研究。实践原则：缺失率 < 5% 且缺失随机 → 前向填充或线性插值即可；强季节序列 → 季节性填补；大段连续缺失（如连续 7 天以上数据丢失） → 评估数据管道是否故障，可能整段剔除比填补更安全；无论哪种方法，填充后应标记哪些点为填补值并在分析中做敏感性检验。',
    tags: ['missing values', 'imputation', 'interpolation', 'forward fill'],
    subTopic: '时间序列分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-93',
    category: 'statistics',
    question: '什么是Granger因果检验？它检验的是真正的因果关系吗？',
    answer:
      'Granger 因果检验（Granger Causality Test）由诺贝尔经济学奖得主 Clive Granger 于 1969 年提出，其检验逻辑是：如果加入时间序列 X 的历史值能显著提高对 Y 的预测精度（相比仅使用 Y 自身的历史值），则称"X Granger-导致 Y"（X Granger-causes Y）。检验通过比较两个嵌套回归模型完成——受限模型 Y_t = α + Σ_{i=1}^p β_i Y_{t-i} + ε_t 与全模型 Y_t = α + Σ_{i=1}^p β_i Y_{t-i} + Σ_{j=1}^q γ_j X_{t-j} + ε_t，使用 F 检验判断所有 γ_j 是否联合为 0，H₀ 为"X 不 Granger-导致 Y"。若拒绝 H₀ 且系数方向合理（如更多搜索量 Granger-导致更多 GMV），可认为 X 包含预测 Y 的增量信息。关键澄清：Granger 因果 ≠ 真正的哲学因果关系（Manipulation-based Causality）。Granger 检验仅检验"预测性/时序先行性"——X 发生在 Y 之前且包含预测 Y 的信息。但以下情形均可产生 Granger 显著的假象：(1) 存在第三个变量 Z 同时引起 X 和 Y，但 Z 对 X 的影响先于对 Y 的影响（领先-滞后结构的混淆）；(2) 仅因 X 自身高度可预测（自回归结构强）而 Y 恰好也具有类似时间模式，两者完全独立但各自有强自相关的两个序列也可能 Granger 显著；(3) 抽样偏差或变量遗漏。因此 Granger 检验只是因果推断的第一步线索（"X 可能引领 Y"的初步证据），绝不能独立作为因果结论。应用前提：序列必须为平稳序列（否则 F 检验无效）、需对滞后阶数 p 和 q 敏感（常用 AIC/BIC 选择最优滞后长度）、检验方向可逆（需同时检验"Y 是否 Granger-导致 X"以排除双向反馈）。在业务中，Granger 检验用于发现指标间的先导-滞后关系——如"品牌搜索量是否 Granger-导致 GMV"辅助判断搜索是先行指标，但其结论需通过 AB 实验或外生冲击（如营销活动）做进一步因果验证。Granger 本人一再强调，他之所以将此检验命名为"因果"仅为时序文献中的约定俗成惯例，本质是条件预测性（Conditional Predictability）。',
    tags: ['granger causality', 'predictive causality', 'time series'],
    subTopic: '时间序列分析',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 10. 生存分析 (5 questions)
  // ============================================================
  {
    id: 'stats-94',
    category: 'statistics',
    question: '什么是生存分析？它与普通回归分析的根本区别是什么？（删失数据 Censoring 的概念）',
    answer:
      '生存分析（Survival Analysis）是研究"事件发生时间"（Time-to-Event）的一类统计方法，起源于生物统计学（患者死亡时间）和可靠性工程（设备故障时间），核心研究对象为生存函数 S(t) = P(T > t)（个体在 t 时刻后仍"存活"的概率）和风险函数 h(t) = lim_{Δt→0} P(t ≤ T < t+Δt | T ≥ t)/Δt（在 t 时刻已存活的前提下瞬时发生事件的概率密度）。生存分析与普通回归分析（如线性回归、逻辑回归）最根本的区别在于对删失数据（Censoring）的处理。删失是指无法观测到确切的生存时间，仅知部分信息——最常见形式为右删失（Right Censoring）：在研究/观察期结束时某个体尚未发生目标事件，我们只知道其真实生存时间大于观察到的长度（T > C）。例如在用户流失分析中，观察期结束时部分用户仍活跃，我们只知道其留存时间"至少到了当前"，但不知道他们何时会流失——这部分用户的数据若被简单删除（丢失了"已坚持很久"的信息）或标记为"未流失=0"（忽略其可能即将流失的风险），会产生严重的估计偏差。生存分析通过构造恰当的似然函数自然容纳删失数据：对于已发生事件的个体贡献 f(t_i)，对于删失个体贡献 S(C_i)（在 C_i 时仍存活的概率），从而实现无偏的参数估计。此外生存分析天然支持时变协变量（协变量取值随时间变化而更新）和竞争风险（个体可能面临多种互斥的"死亡"类型），这些在传统回归框架中极难处理。在业务应用中，生存分析可将"用户活跃→流失""注册→首次付费""设备上线→故障"等事件时间作为因变量，充分利用所有用户（包括仍活跃的"未流失"用户）的观测时间信息进行建模，信息利用率远高于以"某月是否流失"为二分类标签的逻辑回归。',
    tags: ['survival analysis', 'censoring', 'time-to-event', 'hazard'],
    subTopic: '生存分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-95',
    category: 'statistics',
    question: 'Kaplan-Meier估计量的原理和局限性是什么？Log-Rank检验用于什么？',
    answer:
      'Kaplan-Meier（KM）估计量是估计生存函数 S(t) 的最常用非参数方法，无需假设生存时间服从任何特定分布。基本原理：将观察时间轴按事件发生时刻排序为 t₁ < t₂ < ... < t_K，在每个事件时刻 t_j 计算条件存活概率并连乘得到累积生存概率：Ŝ(t) = ∏_{t_j ≤ t} [1 - d_j/n_j]，其中 d_j 是 t_j 时刻恰好发生事件的人数，n_j 是 t_j 时刻仍处于风险集中的人数（未发生事件且未被删失）。KM 曲线呈阶梯状（阶梯函数），仅在事件发生时刻下降，而在删失和事件间隔中保持水平，直观展示生存概率如何随时间衰减。KM 的局限：(1) 不能直接建模协变量效应——只能按分类变量分组比较（如性别、实验组 vs 对照组），无法量化多个连续变量对生存的影响，也不能对新个体做生存预测；(2) 假设删失与事件独立（无信息删失）——被删失的个体与仍在追踪的个体之间，其风险没有系统性差异（若病情恶化的患者更可能退出研究导致删失不随机，KM 估计偏高）；(3) 尾部估计极不可靠——观察期末期风险集人数急剧减少（如仅剩几人），KM 的方差非常大，此时曲线的大幅跳跃可能仅反映个别事件而非可靠趋势；(4) 无法处理时变协变量。Log-Rank 检验是与 KM 配套的假设检验，用于比较两组或多组的生存曲线是否存在统计显著差异，H₀: 各组生存函数完全相同。检验统计量基于每个事件时刻的观察事件数 O 与在 H₀ 下各组的期望事件数 E 之差的加权和，在大样本下服从卡方分布。Log-Rank 检验对所有时间点的事件赋予相等权重（因此对早期和晚期的差异同等敏感）——若预期组间差异集中在早期且随后消退，可用加权 Log-Rank 检验（如 Gehan-Breslow 检验，权重为风险集人数 n_j，对早期差异更敏感）。在业务留存分析中，KM 曲线可视化 iOS vs Android 用户的留存衰减路径，Log-Rank 检验判断两组的留存是否存在系统性差异，若差异显著且有必要控制其他协变量（如用户年龄、地域），则进一步使用 Cox 比例风险模型。',
    tags: ['kaplan-meier', 'log-rank', 'survival function', 'non-parametric'],
    subTopic: '生存分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-96',
    category: 'statistics',
    question: 'Cox比例风险模型（Cox Proportional Hazards Model）的假设和解释方法？',
    answer:
      'Cox 比例风险模型（Cox Proportional Hazards Model, Cox PH）由 Sir David Cox 于 1972 年提出，是生存分析中最广泛使用的半参数回归模型，用于量化多个协变量对风险率（Hazard Rate）的影响。模型形式为 h(t|X) = h₀(t) · exp(β₁X₁ + β₂X₂ + ... + β_pX_p)，其中 h₀(t) 是基线风险函数（Baseline Hazard），完全不指定任何参数形式（故称半参数），仅假定其随 t 变化的形状对所有人相同；协变量效应通过相对风险项 exp(βX) 乘性作用于基线风险之上。三大核心假设：(1) 比例风险假设（PH Assumption）——不同个体的风险比率不随时间变化，即对于任意两个协变量取值为 X₁ 和 X₂ 的个体，h(t|X₁)/h(t|X₂) = exp(β(X₁-X₂)) 在整个追踪期内恒为常数。这是 PH 模型最关键的假设，通过 Schoenfeld 残差检验判断——对每个协变量检验残差是否与时间显著相关（P < 0.05 意味着 PH 假设被违反），若违反可用分层 Cox 模型（Strata）或时变系数模型处理。(2) 对数线性假设——log h(t) 与连续型协变量 X 之间为线性关系，违反时可添加多项式项或样条变换。(3) 删失无信息假设——删失机制与事件发生机制独立。系数解释：exp(β_j) 即为风险比（Hazard Ratio, HR），HR > 1 表示协变量增加 1 单位时瞬时风险增大约 (HR-1)×100%（如 HR=1.45 → 流失风险增加 45%）；HR < 1 表示风险降低（保护因子，如 HR=0.7 → 风险降低 30%）；HR=1 无影响。与逻辑回归系数的区别：逻辑回归的 OR（优势比）是静态概率比较，而 Cox 的 HR 是动态风险比较（瞬时速率），更符合"时间到事件"的数据结构。Cox 模型不直接参数化 h₀(t)，因此无法直接预测绝对生存概率（但可通过 Breslow 或 Kalbfleisch-Prentice 方法后估计 h₀(t) 实现），其主要功能是风险排序和协变量效应量化。在用户流失预测中，Cox PH 模型可输出"用户每次投诉流失风险增加 45%（HR=1.45, 95% CI: 1.26-1.67）"这类直观结论，且 PH 假设意味着该风险放大效应在用户生命周期的各个阶段保持恒定，符合"投诉行为的负面效应长期持续"的合理业务假设。',
    tags: ['cox proportional hazards', 'hazard ratio', 'semi-parametric', 'ph assumption'],
    subTopic: '生存分析',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-97',
    category: 'statistics',
    question: '在业务中生存分析有哪些应用？（用户留存、客户流失预测、设备故障预测等）',
    answer:
      '生存分析在互联网和科技行业中有极为丰富的业务应用场景，其统一框架是用"时间到事件"取代"是/否发生"作为预测目标。(1) 用户留存分析——将"用户首次使用产品"记为起点 t=0，"用户永久流失（如 180 天不再回访）"记为目标事件，利用 KM 曲线绘制不同渠道获客用户的留存衰减曲线，Cox 模型分析影响留存的功能因子（如首次体验中完成核心操作与否），HR 量化各因子的留存贡献（如完成新手引导将流失风险降低 60%，HR=0.4）。(2) 客户流失预测（Churn Prediction）——在订阅制 SaaS 或付费会员场景中，对每位用户预测下一个时间窗口的流失概率：P(T ≤ t+Δt | T > t) = 1 - S(t+Δt)/S(t)，客户成功团队依据风险排序对高风险用户优先实施挽留干预（如优惠券、客服回访），相比传统分类模型（逻辑回归以"本月是否流失"为标签），生存分析模型输出的是随时间动态变化的风险概率曲线。(3) 转化时间分析——从注册到首次付费的时间分布建模，识别哪些用户群的付费转化路径更长（HR < 1 的协变量延迟付费），针对性优化新手引导节奏。(4) 设备/基础设施故障预测（Predictive Maintenance）——工业 IoT 场景中预测机器零件的剩余有效寿命 RUL（Remaining Useful Life），航空公司根据发动机传感器时序数据预测最佳维护窗口。(5) 员工离职预测——从入职到离职的 tenure 分析，Cox 模型评估薪资调整、晋升等时变协变量对离职风险的影响。(6) 金融风控——从贷款发放到首次违约的时间建模，构建动态违约概率曲线，优于静态信用评分。生存分析相较传统分类的核心优势：(1) 不仅回答"是否"，更回答"何时"，提供风险时间分布；(2) 充分利用删失数据——至今仍未流失的用户数据不浪费，而是以"生存了 X 天"的形式贡献信息；(3) 天然支持时变协变量——用户行为随时间的动态演进（如近期消费频率的升降）可直接入模更新风险估计。',
    tags: ['churn prediction', 'retention', 'predictive maintenance', 'ltv'],
    subTopic: '生存分析',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-98',
    category: 'statistics',
    question: '什么是时变协变量（Time-Varying Covariates）？在Cox模型中如何处理？',
    answer:
      '时变协变量（Time-Varying Covariates）是指在随访过程中取值随时间变化的自变量，与性别、注册渠道等在基线时就固定不变的协变量相对。在用户生存分析中，典型时变协变量包括：最近 7 天登录次数、累计消费额、当月投诉次数、是否已升级到高级版本（从"否"变为"是"的时间点）等——这些变量在用户生命周期的不同阶段有不同取值，且其当前值直接关联用户的即时流失风险。标准 Cox 模型 h(t|X) = h₀(t)·exp(βX) 假设 X 是基线时测量的固定向量，无法处理此类变量。扩展形式——时变 Cox 模型 h(t|X(t)) = h₀(t)·exp(β·X(t))，允许协变量 X(t) 在时间轴上变化。技术实现方式是将每个用户的数据"纵向展开"为计数过程格式（Counting Process Format）：将用户的完整观察期按照协变量变化的时刻切分成多个区间 (start_i, stop_i]，每个区间有起始时间、结束时间、该区间内的协变量取值以及事件发生标记（是否在 stop_i 时恰好发生事件）。例如一个用户在 Day 0-10 每周活跃 5 次、Day 11-30 因推送策略变化升为每周 15 次，则被拆分为两行——[0, 10, 活跃=5, 事件=0] 和 [10, 30, 活跃=15, 事件=1]，每行的协变量为该区间内的值。这种表示法等价于将每个协变量变化点视为该用户"重新进入风险集"，Cox 的偏似然估计（Partial Likelihood）算法能够在风险集比较中动态评估时变值。关键注意事项：(1) 时变协变量必须满足外生性（Exogeneity）——协变量的变化不能由事件的临近发生所驱动，否则会引入严重的内生性偏倚（如用户预感要离职后开始减少工作量，使"近期活跃度"的下降成为离职的表征而非原因）；(2) 数据行数 = 所有用户的协变量变化总次数之和，计算复杂度远高于固定协变量 Cox；(3) 在 R 中 survival::coxph 的 Surv(start, stop, event) 格式原生支持时变 Cox，Python 的 lifelines 包 CoxTimeVaryingFitter 也提供此功能；(4) 离散型时变解释需注意——如 HR=0.6 的含义为"当用户升级到高级版（协变量从 0 变为 1）时，其当前时刻的流失风险乘以 0.6（下降 40%），此降低效应适用于升级后所有时间"。',
    tags: ['time-varying covariates', 'cox model', 'counting process', 'exogeneity'],
    subTopic: '生存分析',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 11. 抽样方法 (5 questions)
  // ============================================================
  {
    id: 'stats-99',
    category: 'statistics',
    question: '简单随机抽样、分层抽样（Stratified）、整群抽样（Cluster）和系统抽样的区别及适用场景？',
    answer:
      '四种基础概率抽样方法在随机性机制、效率和适用场景上各有定位。(1) 简单随机抽样（Simple Random Sampling, SRS）——从大小为 N 的总体中等概率抽取 n 个个体，每个个体被抽中的概率均为 n/N。优点：无偏性——抽样工作通过随机性自动平衡所有已知和未知特征（总体无偏估计），是所有抽样设计的理论基准。缺点：需要完整抽样框（全部个体名单），当总体庞大且地理分散时操作成本极高；可能抽取到极不具代表性的样本（纯凭运气，如抽到的全是非活跃用户）。(2) 分层抽样（Stratified Sampling）——先将总体按某个重要分层变量（如性别、年龄段、地区）划分为互不重叠的 L 层，然后在各层内独立执行简单随机抽样。优势：确保每个重要子群在样本中均有代表（避免 SRS 的"遗漏层"风险），且当层内同质性高（层内方差小）时，同样总样本量 n 下估计精度显著高于 SRS（方差缩减）。适用场景：已知总体内有高异质性子群且分层变量易获取，或需要对各子群分别推断（各层样本量必须充足）——如全国性调查按省份分层抽样。(3) 整群抽样（Cluster Sampling）——将总体自然划分为互不重叠的群组（Cluster，如学校、居民区、城市），先随机抽取若干群组，然后对选中群组内的所有个体（或再在群内二级随机抽样）进行调查。优势：大幅度降低实地执行成本和名单获取难度（只需选中群的名单而不是总体全名单）；缺点是群内个体通常相似（组内相关 ICC > 0），导致有效样本量低于实际样本个体数（设计效应 Design Effect > 1），精度低于同等 n 的 SRS。适用场景：总体过于分散或缺乏完整名单——如入户调查先抽街道再抽住户。(4) 系统抽样（Systematic Sampling）——将总体按一定顺序排列后，随机确定一个起始点，然后每隔固定间隔 k 抽取一个（如每第 10 个用户取 1 个）。优点：极简实现（尤其数据库/实时流中每隔固定行数取一条），且若排序与关注特征无关则精度等同 SRS。潜在风险（隐性分层偏差）：若排序存在周期性模式且与抽样间隔 k 共振（如按天排序且 k=7），会系统性地只在周末（或工作日）抽样。在 AB 实验中，随机分流等价于 SRS；但为确保关键维度平衡（如设备类型），实践中常采用分层随机化（每层内独立随机分配），既保持 SRS 的无偏性又消除抽样波动造成的组间不平衡。',
    tags: ['sampling', 'stratified', 'cluster', 'systematic', 'srs'],
    subTopic: '抽样方法',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-100',
    category: 'statistics',
    question: '什么是重要性采样（Importance Sampling）？在什么场景下使用？',
    answer:
      '重要性采样（Importance Sampling, IS）是一种方差缩减的蒙特卡洛积分方法，用于从难以直接采样的目标分布 p(x) 中计算函数期望，核心技巧是从另一个容易采样的提议分布 q(x) 中抽取样本，并用重要性权重 w(x) = p(x)/q(x) 进行加权校正。基本公式：E_p[f(X)] = ∫ f(x)p(x)dx = ∫ f(x)·[p(x)/q(x)]·q(x)dx = E_q[f(X)·w(X)] ≈ (1/n) Σ_{i=1}^n f(x_i)·w(x_i)，其中 x_i ~ q(x)。权重 w(x) 纠正了从"错误"分布 q 采样的偏倚——当某区域 q(x) 采样过多而 p(x) 密度低时，权重 < 1 将其贡献压小；反之 p(x) 密度高而 q(x) 采样少时，权重 > 1 放大其贡献。IS 的关键要求是 q 的支持域（support）须完全覆盖 p 的支持域——任何在 p 下非零概率的区域在 q 下也须有采样可能，否则该区域永远未被采样，产生不可消除的系统偏倚。最优提议分布 q*(x) ∝ |f(x)|p(x) 能使估计方差为 0（但实际永远不可行，因为分子恰好是需要计算的目标积分本身），实践中使 q 在 |f(x)|p(x) 大的区域分配更多样本即可显著削减方差。主要应用场景：(1) 贝叶斯推断中计算边缘似然（Marginal Likelihood）用于模型比较——p(D) = ∫ p(D|θ)p(θ)dθ，以先验或简单分布为提议计算加权平均；(2) 强化学习中的 Off-Policy 评估——用行为策略（采样分布 q）产生的历史交互数据，评估新目标策略（分布 p）的期望回报；(3) 稀有事件模拟——金融风险中估计极端损失概率（如 VaR 尾部的概率），通过漂移提议分布的均值或方差使采样集中在尾部区域（IS 的方差缩减幅度可达数个数量级）；(4) 粒子滤波（Particle Filter/Sequential Monte Carlo）——重要性采样是序贯重采样粒子权重的核心步骤。IS 在高维空间中的主要困境是"权重退化"：当 q 与 p 差异大时，所有重要性权重集中在极少数样本上（有效样本量 ESS ≈ (Σ w_i)²/Σ w_i² 急剧下降），极端情况下几乎仅一个有效样本——这在高维概率流形中尤其严重，因为基于简单提议分布的 IS 随维度指数级失效。',
    tags: ['importance sampling', 'monte carlo', 'variance reduction', 'off-policy'],
    subTopic: '抽样方法',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-101',
    category: 'statistics',
    question: 'Bootstrap方法的原理是什么？为什么可以从一个样本中估计统计量的分布？',
    answer:
      'Bootstrap（自助法）由 Bradley Efron 于 1979 年提出，是通过对原始样本进行有放回重抽样（Resampling with Replacement）来估计统计量抽样分布的非参数方法。核心思想：将原始样本 x = (x₁, ..., x_n) 视为"迷你总体"（Plug-in Principle），通过从该样本中反复抽取（通常 B=1000~10000 次）相同大小 n 的 Bootstrap 样本 x*ᵇ（每个 Bootstrap 样本通过有放回抽取生成——一个原始数据点可能在同一个 Bootstrap 样本中出现 0 次、1 次或多次），计算每个 Bootstrap 样本的统计量 θ̂*ᵇ（如均值、中位数、回归系数），最终得到 θ̂* 的经验分布，以此作为真实统计量抽样分布的近似。为什么这能起作用？根据 Glivenko-Cantelli 定理，经验分布函数 F̂_n 一致收敛于真实总体分布 F（即大样本下样本的分布接近总体分布）——而 Bootstrap 样本本质上是从 F̂_n 中抽取的随机样本。接着根据连续映射定理（Continuous Mapping Theorem）和 delta 方法，统计量 θ̂ 作为样本的函数，其 Bootstrap 分布将收敛到真实的抽样分布。Bootstrap 的三类主要应用：(1) 标准误差估计——SE_Boot = 标准差(θ̂*ᵇ)；(2) 置信区间构建——百分位 Bootstrap（直接取 Bootstrap 分布的 α/2 和 1-α/2 分位数）、BCa 方法（Bias-Corrected and Accelerated，修正偏倚和偏度，是更准确的 Bootstrap CI）；(3) 假设检验——在 H₀ 下构造数据的零分布（如两样本比较，将两组数据混合打乱后 Bootstrap），计算检验统计量的经验 P 值。Bootstrap 的最大优势在于其普适性——无需正态或任何参数分布假设，适用于任何平滑统计量（均值、中位数、分位数、回归系数、相关系数），是"万能标准误计算器"。核心局限：(1) 要求样本是独立同分布（i.i.d.）——对时间序列/空间相关数据需要 Block Bootstrap 或 Wild Bootstrap 等变体；(2) 对极端值/重尾分布估计不稳定（因为重尾分布的经验分布收敛慢）；(3) 无法为极大值/极小值统计量（如样本最大值）提供可靠估计（Bootstrap 的渐近理论对非平滑统计量失效）；(4) 计算成本为 O(B×n)。在 AB 实验中，Bootstrap 用于非正态指标（如 GMV 的均值、转化率差值）的置信区间构建，常比基于正态近似的 t 检验更准确。',
    tags: ['bootstrap', 'resampling', 'efron', 'empirical distribution'],
    subTopic: '抽样方法',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-102',
    category: 'statistics',
    question: '什么是抽样偏差（Sampling Bias）？如何在AB实验中避免选择偏差和幸存者偏差？',
    answer:
      '抽样偏差（Sampling Bias）是指样本在系统性上与目标总体存在差异，导致样本统计量不再是无偏估计的现象——某些个体或群体被选入样本的概率与被排除的概率不同，使得样本无法代表总体。常见形式：(1) 选择偏差（Selection Bias）——样本的纳入标准或非随机缺失导致某些类型的个体主观被排除（如电话调查只能覆盖有电话的人群，互联网问卷调查只能触达数字素养较高的群体）；(2) 幸存者偏差（Survivorship Bias）——只关注经过某种筛选后"存活"下来的个体，忽略那些被淘汰的个体。经典案例：二战期间盟军分析返航飞机上的弹孔分布，建议加固中弹最多的机翼部分，而 Abraham Wald 指出应该加固弹孔最少的发动机和油箱部位——因为被击中那些部位的飞机根本没能返航（"幸存者"样本不能代表所有被击中的飞机）；(3) 自愿响应偏差（Voluntary Response Bias）——主动参与调查的个体与沉默个体在态度上存在系统差异（如愤怒的用户更倾向留差评）；(4) 便利抽样偏差（Convenience Sampling Bias）——选取最容易获取的个体（如街头拦截调查只在商业区采访，漏掉郊区居民）。在 AB 实验中避免抽样偏差的核心手段：(1) 严格随机化——通过哈希分流（用户标识+实验层种子哈希取模）确保每个用户分配到各组的过程是随机的且确定性的（同一用户多次访问始终在同一组），通过 SRM（样本比例不匹配）检测持续监控分流质量；(2) 预注册协变量平衡检验——在实验开始后检查实验组与对照组在关键预处理变量上是否统计可比（如设备类型分布、历史消费均值），发现不均衡时使用分层随机化或 CUPED 调整；(3) 防范幸存者偏差——确保分析中纳入所有分配进入实验的用户（Intent-to-Treat, ITT 分析），而非只分析"真正体验了策略"的用户（因为哪些用户"体验了"本身可能就是策略导致的——如实验组更活跃的用户看到新功能更多，若只分析他们则会高估效果）；(4) 全漏斗分析——从分流→触发→体验→转化的每一步都追踪用户量变化，检测各步骤是否有非随机流失。抽样偏差是观测性研究因果推断的最大威胁（无法通过增加样本量消除，大偏差在大 n 下依然是偏差），而 AB 实验通过随机化从根本上切断了选择机制与处理分配的关联，是解决此问题的金标准。',
    tags: ['sampling bias', 'survivorship bias', 'selection bias', 'randomization'],
    subTopic: '抽样方法',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-103',
    category: 'statistics',
    question: '拒绝采样（Rejection Sampling）和MCMC采样的核心区别？什么场景用哪个？',
    answer:
      '拒绝采样（Rejection Sampling）和 MCMC（Markov Chain Monte Carlo）都是从难以直接采样的目标分布 p(x) 中获取随机样本的方法，但工作机制和适用条件截然不同。拒绝采样：选取一个容易采样的提议分布 q(x) 和一个常数 M>1，使得对所有 x 有 M·q(x) ≥ p(x)（M·q 是 p 的"上包络"）。算法为：从 q(x) 抽取候选点 x*，从 Uniform(0, M·q(x*)) 抽取 u，若 u ≤ p(x*) 则接受 x*（概率 = p(x*)/(M·q(x*))），否则拒绝并重新抽取。每个接受的样本之间完全独立（i.i.d.），样本质量好。MCMC：构建一条以目标分布 p(x) 为稳态分布（Stationary Distribution）的马尔可夫链，通过迭代采样（当前值→候选→接受/拒绝→下一状态）产生一条相关序列，经初始的老化期（Burn-in）后，链上的样本（虽然彼此自相关）近似服从 p(x)。核心区别总结：(1) 样本独立性——拒绝采样产生独立样本，MCMC 产生自相关序列（需要更长的链以获得等效于独立样本的有效样本量 ESS）；(2) 维数伸缩性——拒绝采样的接受率随维度指数级下降（维度诅咒），在高维空间中 p 和 q 的匹配极其困难，几乎全部样本被拒绝；MCMC 虽然也面临高维挑战，但通过 Gibbs 切片或 HMC 等智能提议机制可以在高维中维持合理的混合效率；(3) 提议分布要求——拒绝采样需要找到全局上包络 M·q(x) ≥ p(x)∀x（通常不可行，尤其是当 p 是已知形式的未归一化密度时无法确定 M），而 MCMC 无需包络条件（Metropolis-Hastings 等方法的接受率仅依赖于比率 p(x*)/p(x^{(t)})，归一化常数自动抵消）；(4) 实现复杂度——拒绝采样简单直接，MCMC 需要调参（提议步长、老化长度、链数、收敛诊断）且其收敛性需检验（Gelman-Rubin 诊断 R̂ < 1.1 等）。适用场景选择：一维或低二维的简单分布 → 拒绝采样（简单且样本独立）；高维参数空间（如贝叶斯层级模型有数千参数）→ MCMC（拒绝采样完全不可行）；需要无自相关的独立后验样本做统计推断 → 拒绝采样（或以 MCMC 采样后做 Thinning 近似）；分布密度形式复杂（仅有未归一化的核密度）→ MCMC（拒绝采样难以确定 M）。现代贝叶斯统计软件（Stan、PyMC3）几乎全部使用 MCMC 变体（HMC/NUTS）而非拒绝采样。',
    tags: ['rejection sampling', 'mcmc', 'sampling methods', 'curse of dimensionality'],
    subTopic: '抽样方法',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 12. 非参数检验 (5 questions)
  // ============================================================
  {
    id: 'stats-104',
    category: 'statistics',
    question: '参数检验和非参数检验的根本区别是什么？各有什么优缺点？',
    answer:
      '参数检验（Parametric Tests）和非参数检验（Non-Parametric Tests）是统计假设检验的两大框架，核心区别在于对数据总体分布的假设强度。参数检验（如 t 检验、ANOVA、F 检验）假定数据来自已知参数分布族（如正态分布），仅需估计有限个参数（如均值 μ 和方差 σ²）即可完全确定分布形态；检验统计量的精确或渐近零分布基于该参数假设推导而来。非参数检验（如 Mann-Whitney U 检验、Wilcoxon 符号秩检验、Kruskal-Wallis 检验、Kolmogorov-Smirnov 检验）不对总体分布形式做强假设（因此得名"非参数"），通常基于数据的秩次（排序位置）或经验分布进行比较，仅要求数据是独立同分布的连续随机变量。参数检验的优点：(1) 当分布假设满足时，统计功效（Power）高于非参数等价检验——参数检验利用了分布的完整信息（每笔数据的精确值），而非参数检验通常仅利用相对顺序（秩次），信息损失导致功效略微降低；(2) 可估计的参数量化效应大小（如均值差、Cohen d）有明确的物理量纲且便于与其他研究比较；(3) 建模灵活——可扩展为复杂线性模型（回归、ANCOVA、混合效应模型）。参数检验的缺点：(1) 分布假设一旦不满足（尤其是严重偏态或存在异常值），P 值无效（Type I Error 率偏离名义 α），结论不可靠；(2) 方差齐性、正态性等假设需多个前置检验（增加了多重比较负担）。非参数检验的优点：(1) 对分布形式无假设，对异常值和偏态鲁棒——即使数据严重非正态仍保持正确的 Type I Error 率；(2) 适用于有序分类数据（如李克特量表评分），而参数检验要求连续变量；(3) 无需假定方差齐性（某些非参数检验）。非参数检验的缺点：(1) 只能检测位置/分布差异是否显著，不能估计参数的置信区间（或需 Bootstrap 辅助）；(2) 当数据其实满足正态时，功效略低于参数等价检验（相对效率 ARE 通常 > 0.85，损失不大）。选择原则：若数据近似正态且无异常值 → 优先参数检验（功效高、可量化效应量）；若数据偏态 / 异常值多 / 是有序分类变量 / 样本很小（n<10）无法判断分布 → 非参数检验更安全。在实践中还可以做两部分析来双重验证结论的鲁棒性。',
    tags: ['parametric', 'non-parametric', 'distribution-free', 'robust'],
    subTopic: '非参数检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-105',
    category: 'statistics',
    question: 'Mann-Whitney U检验与t检验的区别？什么时候应该用Mann-Whitney U而不是t检验？',
    answer:
      'Mann-Whitney U 检验（也称为 Wilcoxon 秩和检验，Wilcoxon Rank-Sum Test）是比较两个独立样本分布是否相同的非参数检验。与独立样本 t 检验的对比体现在四个方面：(1) 检验目标——t 检验比较两组均值是否相等（H₀: μ₁ = μ₂），而 Mann-Whitney U 检验的原假设更一般——"两组数据来自同一分布"（或更精确地说，"从两组中随机各取一个观测值，X > Y 的概率等于 X < Y 的概率，即 P(X > Y) = 0.5"，这个概率被称为受试者工作特征的概率）。因此 Mann-Whitney U 检验检测的是"随机优势（Stochastic Dominance）"——即一组值是否倾向于大于另一组值，这通常被近似理解为中位数比较，但严格来说在分布形状不同的情况下两组可能有相同的中位数但 U 检验显著。(2) 检验统计量——t 检验基于均值和标准差计算 t = (X̄ - Ȳ)/SE_diff，统计量值由各观测的精确数值决定；Mann-Whitney U 检验将两组数据混合后从小到大排序，计算每组的秩和（Rank Sum），U = n₁n₂ + n₁(n₁+1)/2 - R₁（R₁ 是第一组的秩和），即检验统计量仅依赖于数据的相对顺序而非绝对数值，因此对异常值极度鲁棒。(3) 假设条件——t 检验要求两组数据近似正态、方差齐性（可以用 Welch t 检验放松方差齐性）；Mann-Whitney U 检验仅要求独立性和连续性，不要求正态也不要求方差相等（但严格来说假设两组分布形状相同——只是位置参数不同，若不满足此假设，U 检验实质性"检测到差异"但不一定是纯粹的中位数/均值差异，可能包含分布形状差异）。(4) 当数据满足正态假设时，t 检验的功效略高于 U 检验（相对效率 ARE=0.955），差异很小。应该使用 Mann-Whitney U 而非 t 检验的场景：(a) 数据严重偏态或存在极端异常值（如用户消费金额、停留时长——长尾分布），t 检验的均值和 P 值被异常值"绑架"；(b) 样本量很小（如 n=5~15）无法可靠判断分布形态——此时假设正态是危险的；(c) 数据为有序分类变量（如满意度评分 1-5 分），t 检验将其当作连续变量不严格；(d) 预检验（Shapiro-Wilk）拒绝了正态性。实际建议：在 AB 实验中，连续指标的 TPS（如人均 GMV、用户时长）经常严重偏态，实践中常用 Mann-Whitney U 作为主检验或与 Bootstrap t 相结合使用，而不直接使用 t 检验。',
    tags: ['mann-whitney', 'wilcoxon', 'rank sum', 't-test comparison'],
    subTopic: '非参数检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-106',
    category: 'statistics',
    question: 'Kruskal-Wallis检验与单因素ANOVA的区别？是哪个的非参数替代？',
    answer:
      'Kruskal-Wallis 检验（Kruskal-Wallis H Test，或 Kruskal-Wallis 单因素秩方差分析）是单因素 ANOVA（One-Way ANOVA）的非参数替代，用于比较三组或更多独立样本的总体分布是否相同。两者核心对比：(1) 检验目标——单因素 ANOVA 检验 H₀: μ₁ = μ₂ = ... = μ_k（各组均值相等），Kruskal-Wallis 检验 H₀: 所有 k 组的总体分布完全相同（更一般，不限于均值比较）。(2) 检验统计量——ANOVA 基于 F = MSB/MSW（组间均方/组内均方），依赖各组的样本均值和方差；Kruskal-Wallis 将所有数据混合后从小到大排序得到秩次，计算检验统计量 H = [12/(N(N+1))]·Σ Rⱼ²/nⱼ - 3(N+1)，其中 Rⱼ 是第 j 组的秩和，nⱼ 是第 j 组样本量，N 是总样本量。H 统计量在 H₀ 下近似服从自由度为 k-1 的 χ² 分布（当各 nⱼ ≥ 5 时近似良好）。(3) 假设条件——ANOVA 假设各组数据独立、正态分布、方差齐同（Levene 检验检测方差齐性）；Kruskal-Wallis 仅要求各组独立、数据为连续变量（或有序），完全不对分布形式做假设，极大地放宽了适用条件。但需要注意的是，和 Mann-Whitney U 一样，Kruskal-Wallis 严格来说假设各组分布形状相同（仅位置参数可能不同）——若各组分布形状差异极大，显著结果难以解释为"中位数差异"。(4) 事后多重比较——ANOVA 显著后进行 Tukey HSD 或 Bonferroni 校正的各组两两比较；Kruskal-Wallis 显著后使用 Dunn 检验（基于秩和的两两比较）或 Conover 检验，同样需要多重比较校正。(5) 功效比较——当数据符合 ANOVA 的正态和方差齐性假设时，ANOVA 的 Power 略高（ARE ≈ 0.955）；但数据偏态或存在异常值时，Kruskal-Wallis 远比 F 检验准确可靠。适用场景选择：数据近似正态且方差齐 → ANOVA；数据严重偏态、有异常值、或是有序分类变量 → Kruskal-Wallis；样本量极小（每组 n<5）时 → Kruskal-Wallis 至少不依赖正态假设。业务实例：在比较多个广告创意方案的 CTR（点击率）差异时，若各组的 CTR 数据偏态（少数用户极高点击拉高均值），应优先使用 Kruskal-Wallis 判断是否至少有一组与其他不同，显著后用 Dunn 检验定位差异来源。',
    tags: ['kruskal-wallis', 'anova', 'non-parametric', 'rank'],
    subTopic: '非参数检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-107',
    category: 'statistics',
    question: 'Wilcoxon符号秩检验（Signed-Rank Test）与配对t检验的区别？适用场景？',
    answer:
      'Wilcoxon 符号秩检验（Wilcoxon Signed-Rank Test）是配对 t 检验（Paired t-test）的非参数替代，适用于比较同一组个体在处理前后（或匹配对的条件下）的差异。核心机制：对每对配对观测计算差值 d_i = X_i - Y_i，取差值的绝对值 |d_i| 从小到大排序得秩次 R_i（|d_i| 越小秩越小），然后为每个秩次附加原来差值 d_i 的符号（正或负），检验统计量 W = min(W⁺, W⁻)，其中 W⁺ 是所有正 d_i 的秩和，W⁻ 是所有负 d_i 的秩和。原假设 H₀: 差值的中位数为 0（即处理前后无系统差异），备择假设 H₁: 中位数 ≠ 0。与配对 t 检验的核心区别：配对 t 检验检验差值的均值是否为 0（t = \bar{d}/(s_d/√n)），假设差值的总体服从正态分布；Wilcoxon 符号秩检验检验差值的中位数是否为 0，仅假设差值的分布是对称的（对称性假设是为了保证中位数=0 时正负秩和相等），并不要求正态性。另一个隐含假设是差值之间相互独立。Wilcoxon 符号秩检验的优势：(1) 对异常值鲁棒——一个极端大的差值可能主导配对 t 检验的均值和方差，但在 Wilcoxon 检验中只增加一阶的秩；(2) 对偏态差值分布敏感度较低（只要分布对称）；(3) 适用于差值是有序数据但不精确连续的场景（如"改善程度评分为 -2, -1, 0, +1, +2"）。劣势：若差值分布实际对称且接近正态，Wilcoxon 的功效约为配对 t 的 95%（ARE≈0.955），信息损失极小。适用场景：(1) 同一组用户使用新产品前后"完成任务的时长"差异——时长分布通常严重正偏，配对 t 检验不适用，符号秩检验是首选；(2) 配对设计中的主观评分比较（如用户体验评分）；(3) 小样本配对设计无法判断差值正态性时。注意：当多对差值为 0（即处理完全无变化）时，需在分析中剔除这些对（它们不提供处理效应的方向信息）；差值的绝对值出现平局（ties）时需进行平局校正。若对称性假设不满足，应使用更简单的符号检验（Sign Test，只关注差值的符号而非大小，是最低功效但假设最少的配对检验）。',
    tags: ['wilcoxon signed-rank', 'paired t-test', 'non-parametric', 'matched pairs'],
    subTopic: '非参数检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-108',
    category: 'statistics',
    question: '什么是Kolmogorov-Smirnov检验（KS检验）？它检验的是什么？',
    answer:
      'Kolmogorov-Smirnov 检验（KS 检验）是一种基于经验累积分布函数（Empirical Cumulative Distribution Function, ECDF）的非参数检验，核心统计量为两个分布（单样本：样本分布与理论分布；双样本：两个样本分布）之间 ECDF 的最大垂直距离 D = max_x |F̂₁(x) - F̂₂(x)|。单样本 KS 检验：检验样本是否来自某个指定的连续理论分布（如正态分布 N(μ, σ²)、均匀分布、指数分布等），H₀: 样本来自该理论分布。双样本 KS 检验：检验两个独立样本是否来自同一连续总体分布，H₀: 两个样本的总体分布完全相同。D 统计量越大表示两分布背离越严重，P 值基于 Kolmogorov 分布（或 Smirnov 公式）计算，原假设下 D √(n₁n₂/(n₁+n₂)) 的渐近分布已知。KS 检验的优势：(1) 对任意类型的分布差异都敏感——不仅检测位置差异（均值/中位数），还能检测散度差异（方差不同）、形状差异（偏度、峰度不同），因此比 Mann-Whitney U（仅检测位置/随机优势）的检测范围更广；(2) 非参数——完全不对分布形式做假设；(3) 直观——直接基于 ECDF 的可视化比较（画出两条 ECDF 曲线可直观看到最大差异所在位置）。KS 检验的局限：(1) 对分布中心区域的差异敏感度远高于尾部差异——因为最大距离 D 通常发生在分布的中心位置（密度最高区域），而尾部的差异可能被忽略（相比之下，Anderson-Darling 检验用尾部加权弥补了这一弱点）；(2) 仅适用于连续分布（若有大量平局 ties，P 值精度受影响）；(3) 当分布仅在尾部形状上有本质差异时（如金融数据的一方是正态另一方是厚尾 t 分布），KS 可能不显著，而 Anderson-Darling 检验会检测出尾部差异；(4) 对样本量高敏感——大样本下极易拒绝 H₀（只要两分布有微小差异即显著），此时需结合效应大小（D 值）判断差异是否有实际意义。在 AB 测试中的应用：检测实验组和对照组整体分布是否不同（比仅比较均值更全面）——如收入分布，实验组和对照组均值可能相近，但实验组的高收入用户比例明显更高（分布右侧拉开）。在模型校准中，用 KS 检验预测概率分布与实际标签的"校准度"，或检测训练集和测试集特征分布的漂移（Data Drift Detection）。',
    tags: ['kolmogorov-smirnov', 'ks test', 'ecdf', 'distribution comparison'],
    subTopic: '非参数检验',
    difficulty: 'medium',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 13. 贝叶斯统计 (3 questions)
  // ============================================================
  {
    id: 'stats-109',
    category: 'statistics',
    question: '什么是MCMC（Markov Chain Monte Carlo）？Metropolis-Hastings算法的基本步骤？',
    answer:
      'MCMC（Markov Chain Monte Carlo，马尔可夫链蒙特卡洛）是一类从复杂概率分布中产生样本的数值方法，是现代贝叶斯统计计算的核心基石。其基本思想是：构建一条以目标后验分布 p(θ|D) 为稳态分布（Stationary Distribution）的马尔可夫链，通过在该链上长时间模拟行走，产生一个样本序列 {θ⁽¹⁾, θ⁽²⁾, ..., θ⁽T⁾}，尽管这些样本之间存在自相关（非独立），但链的经验分布收敛到目标后验分布，因此可以用样本均值、分位数等来近似后验期望和后验可信区间。MCMC 的关键属性：不可约、非周期、正递归 —— 满足此三条则可保证链收敛到唯一稳态分布。Metropolis-Hastings（MH）算法是最经典的 MCMC 方法，其基本步骤为：(1) 从当前状态 θ^(t) 出发，从提议分布（Proposal Distribution）q(θ*|θ^(t)) 中抽取一个候选点 θ*（常用的提议分布为以 θ^(t) 为中心的高斯分布 N(θ^(t), σ²)，σ 控制步长）；(2) 计算接受概率 α = min(1, [p(θ*|D)·q(θ^(t)|θ*)] / [p(θ^(t)|D)·q(θ*|θ^(t))])；(3) 以概率 α 接受候选点，令 θ^(t+1) = θ*，否则保留当前状态 θ^(t+1) = θ^(t)（注意：即使候选被拒绝，当前状态也被再次"计数"一次）；(4) 重复步骤 1-3 大量次（如 10000 次）。接受概率 α 的数学本质是保证细致平衡条件（Detailed Balance）成立——即 p(θ_i|D)·P(θ_i→θ_j) = p(θ_j|D)·P(θ_j→θ_i)，这是稳态分布的充分条件。当提议分布对称时（q(θ*|θ)=q(θ|θ*)，如随机游走提议），MH 接受率简化为 α = min(1, p(θ*|D)/p(θ^(t)|D)) —— 即仅比较候选点与当前点的后验密度比值。关键调参——提议分布的步长 σ：太小 → 接受率虽高但链移动极慢（高自相关），太多步才能探索整个后验空间；太大 → 候选经常被拒绝（低接受率），链长期"卡住"。Gelman 建议最优接受率约为 0.234（高维高斯提议下的金标准），实践中通过自适应 MCMC 在 Burn-in 阶段自动调整 σ 以达到目标接受率。MH 算法虽简单通用，但在高维强相关的后验中混合效率极差，现代贝叶斯软件（如 Stan）使用的 HMC/NUTS 算法利用梯度信息大幅提升了高维 MCMC 的采样效率。',
    tags: ['mcmc', 'metropolis-hastings', 'stationary distribution', 'acceptance rate'],
    subTopic: '贝叶斯统计',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-110',
    category: 'statistics',
    question: '什么是Gibbs采样？与Metropolis-Hastings的关系和区别？',
    answer:
      'Gibbs 采样（Gibbs Sampling）是 MCMC 方法族中的一种特殊且广泛使用的算法，由 Geman 和 Geman（1984）在图像恢复研究中提出，核心思路是将多维联合分布的高维采样问题分解为一系列一维条件分布的采样问题——每次仅更新一个维度（或一个参数块），从该维度的完全条件后验分布（Full Conditional）p(θ_i | θ_{-i}, D) 中直接抽取新值，而固定其他所有参数不动。算法流程：初始化所有参数向量 θ^(0) = (θ₁^(0), θ₂^(0), ..., θ_d^(0))，然后依次循环：从 p(θ₁ | θ₂^(t), θ₃^(t), ..., θ_d^(t), D) 抽取 θ₁^(t+1)；从 p(θ₂ | θ₁^(t+1), θ₃^(t), ..., θ_d^(t), D) 抽取 θ₂^(t+1)；... 从 p(θ_d | θ₁^(t+1), θ₂^(t+1), ..., θ_{d-1}^(t+1), D) 抽取 θ_d^(t+1)。一轮更新完所有维度为一个 Gibbs 迭代。Gibbs 与 Metropolis-Hastings（MH）的关系：Gibbs 是 MH 的一个特例——当以当前维度的完全条件分布 p(θ_i* | θ_{-i}) 为提议分布时（即将"恰好正确的条件分布"作为提议），代入 MH 的接受概率公式可得 α = min(1, [p(θ_i*|θ_{-i})·p(θ_i^(t)|θ_{-i})] / [p(θ_i^(t)|θ_{-i})·p(θ_i*|θ_{-i})]) ≡ 1，即接受率恒为 1 —— Gibbs 采样的每个提议都自动被接受，这是它最大优势（无需调参、无拒绝浪费）。两者的关键区别：(1) 提议机制——MH 使用人工选择的提议分布（需要仔细调步长），Gibbs 使用恰好正确的条件分布（完全自动化）；(2) 接受率——MH 需计算 α 并有概率拒绝，Gibbs 接受率恒为 1；(3) 条件分布可采样性——Gibbs 要求每个维度的完全条件分布 p(θ_i | θ_{-i}) 有可从中直接采样的封闭形式（如共轭先验下的正态、Gamma、Beta 等），若不可得则需用 Metropolis-within-Gibbs（即在该维度内嵌入一个 MH 步）；(4) 高相关后验的表现——当参数空间高度相关（如两个参数的后验呈狭窄对角带状），Gibbs 的单维度更新每次仅能沿坐标轴方向小步移动，极度低效（"困在峡谷里"），而 MH 或更现代的 HMC 能沿相关方向跳大步。Gibbs 的适用场景：共轭模型（如贝叶斯混合模型、潜变量模型 LDA、贝叶斯线性回归），尤其在分层模型（Hierarchical Models）中 Gibbs 通过条件独立结构自然实现高效更新，是 BUGS/JAGS 等贝叶斯软件的主力算法。现代替代方案：Stan 的 HMC/NUTS 在大多数场景下全面优于 Gibbs（高相关空间、连续参数），但 Gibbs 在离散潜变量模型和某些条件共轭结构中仍不可替代。',
    tags: ['gibbs sampling', 'mcmc', 'full conditional', 'metropolis-hastings'],
    subTopic: '贝叶斯统计',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-111',
    category: 'statistics',
    question: '什么是后验预测分布（Posterior Predictive Distribution）？它有什么用？',
    answer:
      '后验预测分布（Posterior Predictive Distribution, PPD）是贝叶斯框架中的核心概念，用于对模型下新观测数据的预测。其定义为：在观测到训练数据 D 后，预测新数据点 ỹ（未来观测）的概率分布——P(ỹ | D) = ∫ P(ỹ | θ)·P(θ | D)dθ。公式揭示后验预测是两个部分的加权平均：(1) P(ỹ | θ) 是给定参数 θ 下新数据的抽样分布（似然，如正态、二项）；(2) P(θ | D) 是参数根据已观测数据 D 更新后的后验分布。后验预测并非使用单一的"最佳估计"参数（如 MLE 点估计或后验均值），而是考虑参数的全部不确定性（后验分布涵盖的所有可能的 θ 值），按后验权重进行积分。计算方式：从 MCMC 后验样本中，对每个样本 θ^(s)（s=1,...,S），从似然 P(ỹ | θ^(s)) 中生成一个模拟的新观测 ỹ^(s)，全部 S 个模拟值构成的分布即为后验预测分布的蒙特卡洛近似。后验预测的主要用途：(1) 模型的预测和不确定性量化——不仅给出点预测 ŷ = E[ỹ|D]（后验预测均值），还给出完整的预测区间（Posterior Predictive Interval，如 95% 区间），对决策至关重要。例如在贝叶斯 AB 测试中，PPD 给出"如果全量上线新算法，下一个用户周期的转化率/收入的分布预测"，决策者不仅知道"平均提升 2%"，还可以看到"有 5% 概率提升低于 0.1% 或甚至负增长"的风险。(2) 模型检验和诊断——后验预测检查（Posterior Predictive Check, PPC）：生成模拟数据的分布与真实观察数据比较，若模型对数据的特定特征描述良好，则模拟数据的统计量（如最大值、偏度、"零值占比"）分布应覆盖真实观测值；若真实值落在模拟分布的尾部（Posterior Predictive P-value 很小），则表明模型失配（Model Misfit）——某些数据特征模型无法复制。例如对用户重复购买次数建立泊松模型，PPC 检查发现真实数据的零值占比远高于模拟数据（零膨胀），说明需要升级为零膨胀泊松模型。(3) 模型比较——后验预测的 LOO（Leave-One-Out）交叉验证提供信息准则 WAIC 和 LOOIC，用于比较竞争模型的预测能力。后验预测体现了贝叶斯哲学的核心理念：不确定性贯穿于推断和预测全过程，决不压缩到一个点估计，使决策者能直面风险全貌。',
    tags: ['posterior predictive', 'ppd', 'bayesian prediction', 'posterior predictive check'],
    subTopic: '贝叶斯统计',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },

  // ============================================================
  // 14. 概率论 (4 questions)
  // ============================================================
  {
    id: 'stats-112',
    category: 'statistics',
    question: '什么是特征函数（Characteristic Function）和矩母函数（MGF）？它们之间有什么关系？',
    answer:
      '特征函数（Characteristic Function, CF）和矩母函数（Moment Generating Function, MGF）都是概率分布的"代表函数"，能够完整刻画一个随机变量的分布特性（若存在）。矩母函数定义为 M_X(t) = E[e^{tX}]（t 为实数），其第 k 阶导数在 t=0 处的值给出第 k 阶原点矩：E[X^k] = d^k M(t)/dt^k|_{t=0}。特征函数定义为 φ_X(t) = E[e^{itX}]（i 为虚数单位，t 为实数），本质上就是 MGF 在虚数轴上的取值：φ_X(t) = M_X(it)。两者的数学关系为——当 MGF 存在（即在 t=0 的某个邻域内 E[e^{tX}] 有限），φ(t) 可直接由 M(it) 得到；但反之不成立。核心区别在于存在性：MGF 不一定存在——若 X 的分布尾部过厚（如柯西分布、t 分布），E[e^{tX}] 对任意 t≠0 发散，MGF 不存在；而特征函数 φ_X(t) = E[cos(tX)] + iE[sin(tX)] 始终存在（因为 |e^{itX}| = 1 对任意实数 X 有界，所以期望存在），这是特征函数的天然优势。特征函数的三大性质：(1) 唯一性——两分布的特征函数相等当且仅当分布相同（比 MGF 更普适，因为对所有分布成立）；(2) Lévy 连续性定理——若一列特征函数逐点收敛到 φ(t) 且 φ 在 t=0 处连续，则对应分布序列弱收敛（推导中心极限定理的关键工具）；(3) 独立随机变量之和的特征函数等于各自特征函数的乘积——φ_{X+Y}(t) = φ_X(t)·φ_Y(t)（若 X,Y 独立），这极大地简化了独立随机变量之和的分布推导。实际用法对比：计算矩 → MGF 更方便（实函数直接求导）；推导极限分布和理论证明 → 特征函数更首选（始终存在 + Lévy 定理）；金融领域资产定价和期权定价中使用特征函数在 Fourier 变换框架下计算无套利价格（Carr-Madan 方法）。两者均不适用于所有分布——MGF 可能不存在，特征函数虽永远存在但涉及复数运算不如 MGF 直观。',
    tags: ['characteristic function', 'mgf', 'moment', 'fourier transform'],
    subTopic: '概率论',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-113',
    category: 'statistics',
    question: '什么是Jensen不等式？在机器学习中（如EM算法、变分推断）的应用？',
    answer:
      'Jensen 不等式是凸分析中的基础不等式，也是机器学习多个核心算法推导的关键工具。表述为：若 f 是凸函数（Convex Function，二阶导 ≥ 0，如 x², e^x, -log x），则 f(E[X]) ≤ E[f(X)]，即函数的期望 ≥ 期望的函数（直观理解：凸函数在平均值处取值，低于函数在各个点取值的平均）；若 f 是凹函数（Concave，如 log x, √x），不等号反向。在 EM 算法（Expectation-Maximization）中的应用——EM 算法用于含有隐变量 Z 的模型的最大似然估计。目标对数似然 ℓ(θ) = log p(X|θ) = log Σ_Z p(X,Z|θ)，由于求和号在 log 内部，直接优化困难。EM 在 E 步中引入隐变量的后验分布 q(Z)，利用 Jensen 不等式（log 是凹函数）构造似然的下界（ELBO = Evidence Lower Bound）：log Σ_Z p(X,Z|θ) = log Σ_Z q(Z)·[p(X,Z|θ)/q(Z)] ≥ Σ_Z q(Z)·log[p(X,Z|θ)/q(Z)] = ELBO。M 步最大化这个下界。通过将 q(Z) 选为 p(Z|X, θ^(old))（E 步的最优选择），Jensen 不等式的等号在 θ^(old) 处成立，保证每次迭代似然单调不降。在变分推断（Variational Inference, VI）中的应用——VI 的目标是用简单的变分分布 q(θ) 近似冗难的后验 p(θ|D)，通过最小化 KL(q||p)。推导中同样利用 log p(D) = log ∫ p(D|θ)p(θ)dθ ≥ ∫ q(θ)·log[p(D|θ)p(θ)/q(θ)]dθ = ELBO。最大化 ELBO（等价于最小化 KL 散度）的过程中，Jensen 不等式天然产生了可优化的下界框架。可以说 EM 算法就是变分推断在 q(Z)=p(Z|X,θ^(old)) 这一特定选择下的特例。此外 Jensen 不等式也用于证明 KL 散度的非负性（KL(p||q) ≥ 0，取等当且仅当 p=q）——用 -log(x) 的凸性和 p(x)/q(x) 的期望。在业务中，理解 Jensen 不等式有助于规避常见的错误判断——如"平均转化率"不能通过各渠道转化率的简单算术平均得到，因为转化率是比例（凹函数性质），简单平均会高估真实总体转化率（聚合层面的转化率为分子总和/分母总和才是无偏的）。',
    tags: ['jensen inequality', 'em algorithm', 'variational inference', 'elbo'],
    subTopic: '概率论',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-114',
    category: 'statistics',
    question: '多维正态分布的条件分布和边缘分布各有什么性质？',
    answer:
      '多维正态分布（Multivariate Normal Distribution, MVN）具备一个极其优美的属性——它的所有条件分布和边缘分布也均为正态分布（正态家族的封闭性），这在高斯模型（如高斯过程、Kalman 滤波、高斯混合模型）的计算中具有核心地位。设联合分布为分块结构：\n\n[X₁]   ~ N( [μ₁], [Σ₁₁  Σ₁₂] )\n[X₂]       ( [μ₂], [Σ₂₁  Σ₂₂] )\n\n其中 X₁ 和 X₂ 是维度分别为 p 和 q 的随机向量。边缘分布性质：X₁ 的边缘分布直接取对应维度的均值和协方差子矩阵——X₁ ~ N(μ₁, Σ₁₁)，X₂ ~ N(μ₂, Σ₂₂)。这意味着可以从联合分布中"不看"某些维度，剩余维度的分布仍然精确为正态——任何 MVN 的任何维度的子集都具有正态分布。条件分布性质更为深刻：在给定 X₂ = x₂ 的条件下，X₁ 的条件分布为：\n\nX₁ | X₂=x₂ ~ N( μ₁ + Σ₁₂ Σ₂₂^{-1}(x₂-μ₂),  Σ₁₁ - Σ₁₂ Σ₂₂^{-1} Σ₂₁ )\n\n即：(1) 条件期望 μ_{1|2} = μ₁ + Σ₁₂ Σ₂₂^{-1}(x₂-μ₂)——是 x₂ 的线性函数，斜率矩阵为 Σ₁₂Σ₂₂^{-1}，这与线性回归中的回归系数矩阵完全对应（MVR 的线性性——条件期望是线性函数）；(2) 条件协方差 Σ_{1|2} = Σ₁₁ - Σ₁₂ Σ₂₂^{-1} Σ₂₁——令人瞩目的特点是它不依赖于条件变量 x₂ 的具体取值！即无论已知的 X₂ 取什么值，剩余 X₁ 的条件方差都是相同的常数矩阵。这个性质在实际中极为有用：例如在高斯过程（Gaussian Process）回归中，给定已知训练点的函数值，预测点的条件分布均值和方差的闭式解便是上述公式的直接应用。条件方差的降幅 ΔΣ = Σ₁₂ Σ₂₂^{-1} Σ₂₁ 衡量了"知道 X₂ 后对 X₁ 不确定性的缩减量"，ΔΣ 永远为半正定（不确定性不会因获取信息而增加）。一个实用的特例：若 X₁ 和 X₂ 是一维的情形（双变量正态分布），X₁|X₂=x₂ ~ N(μ₁ + ρ(σ₁/σ₂)(x₂-μ₂), σ₁²(1-ρ²))，条件方差 σ₁²(1-ρ²) 仅依赖于相关系数 ρ 且不依赖于 x₂ 的取值——这就是线性回归残差方差，体现了"相关系数 ρ 为零时知道了 x₂ 也不减少对 x₁ 的不确定性"。在金融风险管理和贝叶斯推断中，MVN 的条件分布性质是许多推导的基础——例如 Kalman 滤波的预测和更新步骤就是反复应用 MVN 条件分布的公式。',
    tags: ['multivariate normal', 'conditional distribution', 'marginal', 'gaussian process'],
    subTopic: '概率论',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  {
    id: 'stats-115',
    category: 'statistics',
    question: '什么是互信息（Mutual Information）？与相关系数相比有什么优势和局限？',
    answer:
      '互信息（Mutual Information, MI）是信息论中衡量两个随机变量之间相互依赖程度的度量，定义为联合分布 P(X,Y) 与如果 X 和 Y 独立时的乘积分布 P(X)P(Y) 之间的 KL 散度：I(X;Y) = KL(P(X,Y) || P(X)P(Y)) = ∬ p(x,y) log[p(x,y)/(p(x)p(y))] dxdy。等价形式：I(X;Y) = H(X) - H(X|Y) = H(Y) - H(Y|X)（熵减公式）——互信息可解释为"知道了 Y 之后，对 X 的不确定性减少了多少"，这一解释赋予它天然的因果直觉。与 Pearson 相关系数 ρ 的对比揭示了 MI 的核心优势和局限。Pearson ρ 的优势：(1) 有界于 [-1, 1]——符号表示关联方向（正/负），绝对值表示线性关联强度，直观可比；(2) 计算简单，是多元正态分布下最优的依赖性度量（在正态分布中 ρ=0 等价于独立）。Pearson ρ 的局限：(1) 仅能捕捉线性关联——若 X 和 Y 存在完美的非线性关系（如 Y = X²），Pearson ρ 可能接近于 0（尽管完全依赖）；(2) 对异常值极度敏感——单笔极端值可显著改变 ρ 的取值。互信息 MI 的优势：(1) 能够检测任意形式的依赖（线性、非线性、周期性、高阶依赖），因为只要变量间有任何统计关联，联合分布就会偏离乘积分布，MI > 0 —— 从信息论角度看 MI=0 当且仅当 X 和 Y 统计独立，是更强的检验；(2) 对异常值和分布类型鲁棒——不依赖分布的线性和正态假设，适用于任意类型变量（连续、离散、混合）；(3) 可用于特征选择——通过 MI 衡量每个特征与目标变量的依赖程度，不限于线性关系。MI 的局限：(1) 非负性——MI ≥ 0 永远非负，无法判断关联的方向（是正相关还是负相关），因为"不确定性减少"是正的无论哪种方向（可以结合其他统计量判断方向）；(2) 计算困难——需要估计复杂的联合分布和边缘分布，在高维或连续场景下对密度估计高度敏感，常用 k-NN 互信息或 Kozachenko-Leonenko 估计器；(3) 不具有标准化范围——MI 没有上界（理论上最大为 min(H(X), H(Y))），不同变量对的 MI 值不可直接比较强度——可用标准化变体 NMI = I(X;Y)/√(H(X)H(Y)) 或 I(X;Y)/min(H(X), H(Y)) 进行归一化；(4) 在小样本下 MI 估计存在显著的正偏差。在特征工程和因果发现中，MI 非常有用：挑选与目标变量有非线性依赖的特征、判断两个协变量之间有冗余信息、或在因果图学习中使用条件独立性检验（条件互信息 CMI）。但需要注意的是，和相关系数一样，MI 高 ≠ 因果——它衡量的仍然是统计依赖性而非操纵效应。',
    tags: ['mutual information', 'correlation', 'entropy', 'non-linear dependency'],
    subTopic: '概率论',
    difficulty: 'hard',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
];
