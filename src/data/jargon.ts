import type { QACard } from '../types';

export const jargonCards: QACard[] = [
  // ── 01 ──────────────────────────────────────────────
  {
    id: 'jargon-1',
    category: 'jargon',
    question: '对齐颗粒度（Align Granularity）',
    answer:
      '「对齐颗粒度」指在团队协作中统一信息的分辨率或抽象层次，确保大家对同一件事理解的精细程度一致。比如产品经理和工程师讨论需求时，一方在说"用户流程"，一方在说"数据库字段"，就是颗粒度没对齐。实际使用中常用于会议开场："我们先对齐一下颗粒度，今天讨论的是PRD里用户故事层级的细节，还是接口协议层级？"好的对齐能避免鸡同鸭讲，减少返工。',
    tags: ['开会', '协作', '沟通'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 02 ──────────────────────────────────────────────
  {
    id: 'jargon-2',
    category: 'jargon',
    question: '赋能（Empower / Enable）',
    answer:
      '「赋能」原意是赋予他人能力和资源，使其能够独立成事。在互联网行业被大规模使用，甚至有些泛化——"用AI赋能传统行业""用数据赋能增长团队"。核心含义是通过技术、工具或方法论，让某个主体获得原本不具备的能力。例如："我们搭建的算法平台赋能了运营团队，他们现在不用写SQL也能做用户分层。"注意：过度使用会被吐槽"赋能怪"，使用时最好有具体抓手。',
    tags: ['能力建设', '平台化', '增长'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 03 ──────────────────────────────────────────────
  {
    id: 'jargon-3',
    category: 'jargon',
    question: '闭环（Closed Loop）',
    answer:
      '「闭环」指一个完整的、自运转的流程，从起点到终点形成反馈回路。互联网产品语境下，常指从用户产生需求→使用产品→得到结果→反馈数据→驱动优化这一整套循环。例如电商场景：曝光→点击→加购→下单→支付→收货→评价→复购，每个节点之间数据打通就是"形成闭环"。高频搭配："这个功能还没形成商业闭环""我们要把数据闭环跑通"。闭环思维强调可度量、可追溯、可迭代。',
    tags: ['流程', '数据', '产品设计'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 04 ──────────────────────────────────────────────
  {
    id: 'jargon-4',
    category: 'jargon',
    question: '抓手（Leverage Point）',
    answer:
      '「抓手」源自管理学中的"杠杆点"概念，指执行一件复杂事情时，能起到"牵一发动全身"作用的关键切入点或落地手段。没有抓手意味着战略宏大但无从下手。例如："我们第四季度的增长目标有了，但具体抓手是什么？""内容营销就是我们触达Z世代的抓手。"好的抓手要具备可操作性、可量化、有杠杆效应三个特征。',
    tags: ['战略', '执行', '管理'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 05 ──────────────────────────────────────────────
  {
    id: 'jargon-5',
    category: 'jargon',
    question: '底层逻辑（Fundamental Logic）',
    answer:
      '「底层逻辑」指事物运行的根本规律和核心驱动力，区别于表层现象。常说"回归到商业的底层逻辑"——意思是抛开技巧、套路、热点，想清楚这门生意到底靠什么赚钱、用户为什么买单。例如社交产品的底层逻辑是"连接人与关系"，电商的底层逻辑是"供需匹配的效率"。面试中常被问到："你对XX行业的底层逻辑怎么看？"回答要点在于抓住本质矛盾而非描述现象。',
    tags: ['思维模型', '商业分析', '面试'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 06 ──────────────────────────────────────────────
  {
    id: 'jargon-6',
    category: 'jargon',
    question: '复盘（Retrospective / Review）',
    answer:
      '「复盘」原为围棋术语，指对局结束后重新推演每一步的得失。在互联网公司，复盘的典型流程是：回顾目标→评估结果→分析原因→总结规律→制定改进措施。一般发生在项目结束或关键节点后，强调"对事不对人"和"输出可复用的经验"。例如上完一个大促活动后："明天下午我们针对这次双十一活动做全链路复盘，运营、产品、技术都参加。"好的复盘文化是成长型团队的标志。',
    tags: ['方法论', '项目管理', '团队'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 07 ──────────────────────────────────────────────
  {
    id: 'jargon-7',
    category: 'jargon',
    question: '降本增效（Cost Reduction & Efficiency Improvement）',
    answer:
      '「降本增效」是企业经营的核心命题：降低运营/生产/获客等各环节成本，同时提升效率或产出。在经济下行期尤为高频。常见手段包括：自动化替代人工（降本）、精细化运营提高转化（增效）、组织架构扁平化减少管理层级等。例如："今年增长的北极星是降本增效，ROI不到1的渠道全部砍掉。"需要注意的是，过度降本可能伤害用户体验和长期竞争力，需要平衡。',
    tags: ['经营', '优化', 'ROI'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 08 ──────────────────────────────────────────────
  {
    id: 'jargon-8',
    category: 'jargon',
    question: '组合拳（Combination Punch）',
    answer:
      '「组合拳」借用了拳击术语，指将多种策略、手段或产品功能系统性地组合在一起，形成协同效应，达到 1+1>2 的效果。单一手段往往威力有限，组合才能打出节奏。例如运营场景："我们这次拉新不是靠单一渠道，而是一套组合拳：KOL种草+信息流投放+裂变活动+地推。"产品场景："这个功能不能孤立上线，要和签到体系和会员权益形成组合拳。"',
    tags: ['策略', '运营', '打法'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 09 ──────────────────────────────────────────────
  {
    id: 'jargon-9',
    category: 'jargon',
    question: '飞轮效应（Flywheel Effect）',
    answer:
      '「飞轮效应」来自吉姆·柯林斯的《从优秀到卓越》，指一个系统的各个组成部分相互加强，像推动一个巨大的飞轮——刚开始很费力，每一圈都很慢，但随着持续推动，飞轮自身的惯性会让它越转越快。亚马逊是经典案例：低价吸引更多用户→更多用户吸引更多第三方卖家→规模化降低运营成本→支撑更低价格。创业者常被问："你的业务飞轮是什么？"意味着你的增长模型是否能自我循环加速。',
    tags: ['增长', '商业模式', '战略'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 10 ──────────────────────────────────────────────
  {
    id: 'jargon-10',
    category: 'jargon',
    question: '高频触达（High-Frequency Reach）',
    answer:
      '「高频触达」指通过推送、短信、弹窗、红点等手段，以较高频率将信息/功能/活动传达给用户，抢占用户注意力和使用时长。适用于有天然高频场景的产品（如社交、资讯、短视频）。例如："我们可以利用Push和消息中心做高频触达，把DAU再拉升10%。"但需要警惕：过度触达会导致用户反感甚至卸载，精细化分人群、控制频次是核心。',
    tags: ['运营', '用户增长', '推送'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 11 ──────────────────────────────────────────────
  {
    id: 'jargon-11',
    category: 'jargon',
    question: '护城河（Moat）',
    answer:
      '「护城河」来自巴菲特的价值投资理念，指企业相对于竞争对手的持久竞争优势，能保护市场份额和利润率。常见的护城河类型：品牌（苹果）、网络效应（微信/Facebook）、规模效应（亚马逊的物流基建）、专利技术（高通）、转换成本（企业SaaS的数据迁移成本）。在互联网面试中，"你们的护城河是什么"几乎是必问问题。没有护城河的业务容易被复制和价格战拖垮。',
    tags: ['竞争', '商业模式', '战略'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 12 ──────────────────────────────────────────────
  {
    id: 'jargon-12',
    category: 'jargon',
    question: '痛点（Pain Point）',
    answer:
      '「痛点」指用户在某个场景下真实存在、迫切希望解决但尚未被很好满足的需求或困扰。"痒点"是锦上添花的需求，"爽点"是即时满足的需求，而"痛点"才是产品存在的根本理由。例如网约车没出现前，打车难、等车久、拒载多就是痛点。做产品第一问："这个需求是真实痛点还是伪需求？"验证方式：用户是否已经在用笨办法（Excel、微信群）在自行解决这个问题。',
    tags: ['用户研究', '产品设计', '需求分析'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 13 ──────────────────────────────────────────────
  {
    id: 'jargon-13',
    category: 'jargon',
    question: '漏斗（Funnel）',
    answer:
      '「漏斗」是用户从接触到最终转化过程中每一步的流失模型，通常是一个层层递减的倒三角。经典AARRR模型中的"Activation→Retention→Revenue→Referral"各环节串联就是漏斗。分析漏斗的意义在于找到"最漏"的环节，优先优化。例如电商转化漏斗：首页UV→商品详情页UV→加购→下单→支付，如果详情页到加购掉得厉害，可能说明商品信息或价格有问题。漏斗思维的核心是量化和聚焦。',
    tags: ['数据分析', '增长', '转化'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 14 ──────────────────────────────────────────────
  {
    id: 'jargon-14',
    category: 'jargon',
    question: '生命周期（Lifecycle）',
    answer:
      '「生命周期」指一个用户、产品、企业或其他主体从诞生到消亡的全过程。常见的分层：导入期、成长期、成熟期、衰退期。在产品运营中，用户生命周期价值（LTV）是核心指标，通常五阶段：拉新→激活→留存→变现→传播。不同阶段的用户需要不同策略——新用户要引导和教育，老用户要防流失和召回。"全生命周期运营"意味着不只看单点指标，而是看用户从第一天到最后一天的总贡献。',
    tags: ['运营', '增长', '数据分析'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 15 ──────────────────────────────────────────────
  {
    id: 'jargon-15',
    category: 'jargon',
    question: '赛道（Track / Lane）',
    answer:
      '「赛道」是从投资圈传入互联网行业的热词，指一个细分市场或行业领域。比如"电商是大赛道，但社区团购是子赛道"。"换赛道"指公司转型或切换业务方向。投资人视角："这个赛道天花板有多高？市场规模多大？增速如何？"用"赛道"而非"行业"体现的是竞赛隐喻——很多玩家在同一条路上跑，看谁先跑到终点。但也有人批评这种表述过于强调零和竞争。',
    tags: ['商业模式', '市场', '投资'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 16 ──────────────────────────────────────────────
  {
    id: 'jargon-16',
    category: 'jargon',
    question: '垂直领域（Vertical Domain）',
    answer:
      '「垂直领域」指专注于某个特定行业、场景或人群的细分市场，对应"平台型/通用型"。垂直领域的优势在于深度理解行业Know-How、用户需求精准、容易建立壁垒。例如：面向律师的SaaS、面向医美行业的CRM、面向中小学生的在线编程教育。大厂往往覆盖水平/通用场景，垂直领域则留给创业公司深耕。常见搭配："垂直领域的龙头""做深做透垂直场景"。',
    tags: ['市场', '产品定位', '创业'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 17 ──────────────────────────────────────────────
  {
    id: 'jargon-17',
    category: 'jargon',
    question: '打法（Playbook / Strategy）',
    answer:
      '「打法」指一套系统性的策略和战术组合，用于达成某个特定目标。和"战略"相比，"打法"更偏可操作、可落地。常见："抖音的打法是什么？先用算法推荐打造沉浸式体验，然后引入创作者激励计划，最后通过直播电商变现。"面试中"你对我们业务的打法有什么想法"考察的是策略拆解能力和行业认知。好的打法是目标、资源、时机、执行四位一体的产物。',
    tags: ['策略', '运营', '竞争'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 18 ──────────────────────────────────────────────
  {
    id: 'jargon-18',
    category: 'jargon',
    question: '拉通（Align / Connect）',
    answer:
      '「拉通」是字节系/阿里系非常高频的术语，指在跨团队、跨部门之间把信息、资源、流程、目标对齐并打通，消除信息孤岛。不同于简单的"对齐"，"拉通"暗含主动性——要主动去推动协调。例如："这个需求涉及中台、业务两个部门，明天你把两边拉通一下。""产研拉通会"就是产品经理和工程师之间的协调会。大厂组织复杂，"拉通能力"几乎是高绩效员工的必备技能。',
    tags: ['协作', '组织', '大厂'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 19 ──────────────────────────────────────────────
  {
    id: 'jargon-19',
    category: 'jargon',
    question: '输出（Deliver / Output）',
    answer:
      '「输出」在互联网语境下特指将思考、方案、文档、代码等从头脑中"具象化"出来，变成可交付的成果。区别于日常英语中output的模糊含义，互联网黑话强调：没有输出等于没做。常见："你把这个思路整理一下，明天在会上输出成文档""本周最重要的输出是把PRD定稿"。与"输出"对应的是"沉淀"——不仅输出，还要形成可复用的知识资产。',
    tags: ['执行', '交付', '职场'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 20 ──────────────────────────────────────────────
  {
    id: 'jargon-20',
    category: 'jargon',
    question: '心智（Mindshare）',
    answer:
      '「心智」全称"用户心智"或"品牌心智"，指用户在某一品类/场景中首先想到某个品牌的认知占有程度。抢占用户心智是品牌营销的终极目标——比如"咖啡=瑞幸""安全=沃尔沃"。互联网语境下常说"心智建设""心智卡位"，意思是通过内容、产品体验、品牌传播，让用户在特定场景下第一反应就是你的产品。例如："短视频赛道已被抖音和视频号占据了用户心智，后来者很难突围。"',
    tags: ['品牌', '营销', '用户认知'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 21 ──────────────────────────────────────────────
  {
    id: 'jargon-21',
    category: 'jargon',
    question: '场景（Scenario / Use Case）',
    answer:
      '「场景」是一个用户+时间+空间+动机的组合体，回答的问题是"谁在什么情况下要用这个功能/产品来做什么"。产品设计中的场景思维强调：脱离场景谈功能等于耍流氓。例如同样是"搜索"功能，在电商场景是搜商品，在社交场景是搜人，在知识产品是搜内容——场景不同，设计逻辑完全不同。面试常被问"你会怎么设计XX功能"，好的回答一定是从具体场景出发。',
    tags: ['产品设计', '用户研究', 'UX'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 22 ──────────────────────────────────────────────
  {
    id: 'jargon-22',
    category: 'jargon',
    question: '感知（Perception / Awareness）',
    answer:
      '「感知」在互联网产品语境下有双重含义：一是用户对产品/功能/品牌的认知程度（品牌感知），二是产品帮助用户感知到信息变化的能力（功能感知）。例如："用户对这次改版感知不强"意味着改了但用户没注意到；"建立用户对品牌的品质感知"意味着让用户觉得这是一个高品质产品。常和"触达""建设"组合——"感知建设"是品牌推广的基础阶段。',
    tags: ['品牌', '用户体验', '传播'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 23 ──────────────────────────────────────────────
  {
    id: 'jargon-23',
    category: 'jargon',
    question: '水位（Water Level / Baseline）',
    answer:
      '「水位」用水的概念类比数据或指标的当前状态。常见用法："DAU水位""大盘水位""这个时期的需求水位/流量水位"。比如"受节假日影响，本周流量水位整体偏低"——意思是流量比正常水平低，但不是产品本身出问题了，而是外部环境因素。关注水位的意义在于区分"周期性波动"和"趋势性变化"，避免错误归因。数据分析师的核心能力之一就是判断水位变化的原因。',
    tags: ['数据分析', '指标', '运营'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 24 ──────────────────────────────────────────────
  {
    id: 'jargon-24',
    category: 'jargon',
    question: '击穿（Break Through）',
    answer:
      '「击穿」指通过集中优势资源在某个单点上做到极致，突破阈值，形成质变。不同于"突破"偏重宏观，"击穿"更强调"压强式"聚焦——把所有的力量集中在针尖上。例如："我们要用补贴把上海市场的价格心智击穿""这个品类的供应链还不够深，需要击穿上游"。使用场景多为竞争白热化阶段，需要不计成本攻下关键阵地。注意：击穿往往意味着短期亏损，需要有清晰的投资回报路径。',
    tags: ['竞争', '战略', '市场'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 25 ──────────────────────────────────────────────
  {
    id: 'jargon-25',
    category: 'jargon',
    question: '破局（Breakthrough / Game Changer）',
    answer:
      '「破局」指在僵持或落后的竞争局面中找到一个"改变游戏规则"的突破口，从而扭转局势。局，可以理解为市场格局、竞争僵局、增长瓶颈。"破局点"通常出现在技术创新、模式创新或某个被忽视的细分场景。例如拼多多通过社交裂变在淘宝京东二分天下的格局中破局，抖音通过短视频+算法推荐在社交领域破局。面试中"你觉得我们业务怎么破局"考察的是差异化思考能力。',
    tags: ['竞争', '创新', '战略'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 26 ──────────────────────────────────────────────
  {
    id: 'jargon-26',
    category: 'jargon',
    question: '冷启动（Cold Start）',
    answer:
      '「冷启动」原指发动机在低温下启动困难的现象，互联网中借指一个新产品/新功能在没有初始用户、没有数据和内容积累的情况下从零启动的过程。冷启动是产品最难的阶段——网络效应类产品需要"先有鸡还是先有蛋"。常见解法：邀请制（知乎早期）、名人效应、补贴拉新、从细分场景切入（Facebook最早只在哈佛）、内容预填充（运营手动生成内容）。典型面试题："给你一款社交产品，你怎么做冷启动？"',
    tags: ['增长', '产品', '创业'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 27 ──────────────────────────────────────────────
  {
    id: 'jargon-27',
    category: 'jargon',
    question: '马太效应（Matthew Effect）',
    answer:
      '「马太效应」源于《圣经·马太福音》"凡有的还要加给他"，经济学中指"富者越富、贫者越贫"的累积优势现象。在互联网行业体现为：头部产品一旦建立领先优势，会虹吸更多用户、资本、人才，进一步拉大差距。网络效应、规模效应、数据飞轮都是马太效应的放大器。例如搜索引擎：用户越多数据越丰富→搜索结果越好→吸引更多用户。理解马太效应就会明白为什么早入场、抢窗口期如此重要。',
    tags: ['商业模式', '竞争', '经济学'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 28 ──────────────────────────────────────────────
  {
    id: 'jargon-28',
    category: 'jargon',
    question: '长尾理论（Long Tail）',
    answer:
      '「长尾理论」由克里斯·安德森提出，指在数字时代，由于存储和分销成本极低，大量小众/冷门产品的销售额总和可以和少数热门产品相匹敌甚至超越。亚马逊图书、Netflix影视库、Spotify音乐都是长尾理论的典型。互联网产品利用长尾：内容平台通过推荐算法让冷门内容也能找到受众；电商平台SKU足够丰富满足所有细分需求。与二八法则不同，二八强调聚焦头部，长尾强调覆盖尾部，两者并不矛盾，需要结合使用。',
    tags: ['商业模式', '经济学', '推荐'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 29 ──────────────────────────────────────────────
  {
    id: 'jargon-29',
    category: 'jargon',
    question: '二八法则（Pareto Principle）',
    answer:
      '「二八法则」又称帕累托法则，粗略表述为"80%的结果来自20%的原因"。互联网行业的典型应用：80%的收入来自20%的大客户、80%的流量来自20%的内容、80%的bug来自20%的代码模块。实操意义在于"聚焦"——资源永远有限，要把80%精力花在最能产生结果的20%事情上。数据分析中识别头部用户/头部功能/头部渠道，通常就用二八法则指导优先级排序。',
    tags: ['数据分析', '优先级', '管理'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 30 ──────────────────────────────────────────────
  {
    id: 'jargon-30',
    category: 'jargon',
    question: '用户画像（User Persona）',
    answer:
      '「用户画像」是通过数据分析和用户研究，对目标用户群体进行标签化和抽象化描述，形成典型用户模型。一个完整的画像通常包含：人口属性（年龄/性别/城市）、行为特征（使用频率/偏好功能）、消费能力、心理特征等。例如"职场新人小王，23岁，一线城市，每天通勤2小时，喜欢用碎片时间学习，付费意愿中等"。画像的作用：指导产品设计、运营策略、广告定向投放。区别"用户画像（Persona）"和"用户标签（Tag）"：画像是有故事感的典型角色，标签是离散的特征点。',
    tags: ['用户研究', '数据分析', '产品设计'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 31 ──────────────────────────────────────────────
  {
    id: 'jargon-31',
    category: 'jargon',
    question: '敏捷开发（Agile Development）',
    answer:
      '「敏捷开发」是一种以人为核心、迭代、循序渐进的软件开发方法。区别于传统的瀑布模型（需求→设计→开发→测试→上线一次性交付），敏捷强调：快速交付可工作的小版本→收集反馈→调整方向→继续迭代。常见框架：Scrum（Sprint冲刺、每日站会）、Kanban（看板管理）。核心原则来自《敏捷宣言》：个体和互动高于流程和工具、工作的软件高于详尽的文档、客户合作高于合同谈判、响应变化高于遵循计划。现代互联网公司基本都采用某种形式的敏捷。',
    tags: ['开发', '项目管理', '方法论'],
    subTopic: '职场术语',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 32 ──────────────────────────────────────────────
  {
    id: 'jargon-32',
    category: 'jargon',
    question: '最小可行产品 MVP（Minimum Viable Product）',
    answer:
      '「MVP」是精益创业的核心概念，指用最少的资源做出一个具备核心功能、可以面向早期用户验证关键假设的产品版本。目的不是"做一个简化版产品"，而是"用最快的速度跑通 构建→测量→学习 循环"。MVP的经典案例：Dropbox早期只做了一个视频演示来验证用户需求（没有真实产品），获得了大量注册。MVP常见误区：把MVP做成"粗糙的半成品"，忽略了"Viable（可行）"——必须是可用的、能验证假设的。MVP后根据数据决定是"坚持"还是"转型"（Pivot）。',
    tags: ['产品设计', '创业', '方法论'],
    subTopic: '职场术语',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 33 ──────────────────────────────────────────────
  {
    id: 'jargon-33',
    category: 'jargon',
    question: '北极星指标（North Star Metric）',
    answer:
      '「北极星指标」是一个团队或产品最核心的唯一关键指标，像北极星一样指引所有人的方向，所有决策和动作都围绕提升这个指标展开。好的北极星指标应：①反映用户真实价值（而非虚荣指标）、②能被团队直接驱动、③可量化可追踪。经典案例：Spotify的"总收听时长"、Airbnb的"预订过夜数"、知乎的"被回答的问题数"。与此相对的是"虚荣指标"如总注册用户数——人多但没人用。北极星指标帮助避免"指标过载"，让大团队力出一孔。',
    tags: ['增长', '产品', 'KPI'],
    subTopic: '职场术语',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 34 ──────────────────────────────────────────────
  {
    id: 'jargon-34',
    category: 'jargon',
    question: 'AARRR模型（Pirate Metrics / 海盗指标）',
    answer:
      '「AARRR」是用户增长分析的经典漏斗模型，由Dave McClure提出，五个字母分别代表：Acquisition（获取：用户怎么找到你的？）、Activation（激活：用户第一次体验是否满意？）、Retention（留存：用户会回来吗？）、Revenue（收入：如何变现？）、Referral（传播：用户会推荐给他人吗？）。这五个环节串联成一个完整的用户价值链条。实操中每个环节有对应的具体指标：获取看CAC、激活看注册转化率、留存看Day 7/30留存率、收入看LTV/ARPU、传播看K因子。模型优势是完整且可操作，局限是对已有产品的优化偏强，早期验证阶段参考意义有限。',
    tags: ['增长', '数据分析', '运营'],
    subTopic: '职场术语',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 35 ──────────────────────────────────────────────
  {
    id: 'jargon-35',
    category: 'jargon',
    question: 'OKR vs KPI（目标与关键结果 vs 关键绩效指标）',
    answer:
      'OKR（Objectives & Key Results）和KPI（Key Performance Indicators）是两种不同的目标管理工具，常被混淆。核心区别：OKR是"我要去哪里+怎么知道到了"（目标+可量化的关键结果），强调方向对齐和挑战性；KPI是"做得好不好"的衡量指标，强调达标和评估。实操中：OKR适合创新业务和季度目标，定3-5个Objective，每个配2-4个可量化KR，评分0-1（0.7即优秀）；KPI适合成熟业务和过程考核，通常与绩效薪酬挂钩。误区：把OKR当KPI考核导致员工不敢设高目标。好的公司两者结合——OKR驱动进步，KPI守住底线。',
    tags: ['管理', '绩效', '方法论'],
    subTopic: '职场术语',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 36 ──────────────────────────────────────────────
  {
    id: 'jargon-36',
    category: 'jargon',
    question: '数据驱动（Data-Driven）',
    answer:
      '「数据驱动」指以数据分析而非直觉、经验或层级权力的高低来做决策。典型实践：产品功能上线做A/B测试而不是靠老板拍板、运营策略基于用户分群数据而非"我觉得"、招聘优化看渠道转化率而非HR的印象。数据驱动的三个层次：①有数（埋点/采集基础设施完善）、②懂数（能把数据变成洞察，而非看凑热闹）、③用数（决策流程中数据真正起决定性作用）。误区："数据驱动"不是"唯数据论"——乔布斯做iPhone时也不是靠数据分析出来的。数据和直觉需要平衡。',
    tags: ['数据分析', '决策', '方法论'],
    subTopic: '职场术语',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 37 ──────────────────────────────────────────────
  {
    id: 'jargon-37',
    category: 'jargon',
    question: '增长黑客（Growth Hacking）',
    answer:
      '「增长黑客」是Sean Ellis提出的概念，指通过创意、数据分析和技术手段，以低成本实现用户和收入快速增长的方法论。传统营销依赖大预算、大渠道，增长黑客则依赖产品本身——让产品自带传播力。经典案例：Hotmail每封邮件底部自动添加"Get your free email at Hotmail"签名；Dropbox邀请好友送空间。增长黑客的核心循环：数据洞察→提出假设→快速实验→分析结果→放大策略。角色上，增长黑客通常是集产品、数据、营销于一体的复合型人才（T型）。',
    tags: ['增长', '营销', '数据分析'],
    subTopic: '职场术语',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 38 ──────────────────────────────────────────────
  {
    id: 'jargon-38',
    category: 'jargon',
    question: 'A/B测试（A/B Testing）',
    answer:
      '「A/B测试」是一种随机对照实验，将用户随机分为A组（对照组）和B组（实验组），只改变一个变量，通过比较两组的核心指标差异来判断该变量是否有效。典型的A/B测试流程：提出假设→设计实验（确定样本量/周期）→分流上线→收集数据→统计显著性检验→得出结论→全量上线或放弃。关键点：必须"一次只测一个变量"，否则无法归因；必须有足够的样本量和时间（注意辛普森悖论和新颖效应）。数据驱动文化的核心工具——字节跳动甚至被形容为"A/B测试公司"。',
    tags: ['数据分析', '实验', '产品'],
    subTopic: '职场术语',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 39 ──────────────────────────────────────────────
  {
    id: 'jargon-39',
    category: 'jargon',
    question: '私域流量（Private Domain Traffic）',
    answer:
      '「私域流量」指品牌/商家自有的、可以免费且反复触达的用户流量池，不依赖平台付费分发。典型载体：微信群、企业微信好友、公众号粉丝、品牌App、自营小程序。私域的核心价值在于：①降低获客成本（不需要每次都向平台买流量）、②提高用户LTV（反复触达、深度运营）、③掌握用户数据。例如某美妆品牌把抖音公域粉丝引导到微信群，通过社群运营+小程序商城完成复购闭环。私域运营的三板斧：内容+社群+直播。',
    tags: ['运营', '营销', '电商'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 40 ──────────────────────────────────────────────
  {
    id: 'jargon-40',
    category: 'jargon',
    question: '公域流量（Public Domain Traffic）',
    answer:
      '「公域流量」指归属于平台而非商家的流量，商家需要付费或以内容换取曝光才能触达用户。典型公域平台：抖音的信息流、淘宝的搜索排名、百度的竞价广告、小红书的推荐流。公域的规则由平台制定，商家处于被动地位——流量越来越贵且不可控。所以才有"公域引流，私域沉淀"的打法：在公域大规模曝光获客，然后导入私域做深度转化和留存。理解公域私域的关系是做好全域营销的基础。',
    tags: ['运营', '营销', '平台'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 41 ──────────────────────────────────────────────
  {
    id: 'jargon-41',
    category: 'jargon',
    question: '转化率（Conversion Rate / CVR）',
    answer:
      '「转化率」指完成某个目标动作的用户占进入该流程总用户的比例。广义的"转化"可以是任何目标行为：注册转化、下单转化、充值转化等。公式：CVR = 完成目标用户数 / 进入漏斗用户数 × 100%。例如某活动页面UV 10000，最终下单数500，下单转化率就是5%。提升转化率是运营和产品优化的永恒主题——优化落地页、减少表单字段、增加信任背书（评价/认证）、限时优惠等都是常见手段。CVR每提升0.1%可能意味着百万级营收增长。',
    tags: ['数据分析', '增长', '电商'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 42 ──────────────────────────────────────────────
  {
    id: 'jargon-42',
    category: 'jargon',
    question: '留存率（Retention Rate）',
    answer:
      '「留存率」指在某个时间点获取的用户，经过一段时间后仍在活跃使用的比例，是衡量产品价值和用户粘性的核心指标。常见的有次日留存、第7日留存、第30日留存（通常说的"次留"和"七留"）。行业基准：工具类次日留存30%以上算及格，社交/内容类次日留存50%以上算不错。留存率低通常意味着产品没有满足用户核心需求（PMF没到位）。提升留存的三条路：①提升新用户首次体验（Aha Moment前置）、②建立使用习惯（签到/通知）、③让产品有累积价值（社交关系/数据/内容）。"增长不能靠烧钱，最终要靠留存"。',
    tags: ['增长', '数据分析', '产品'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 43 ──────────────────────────────────────────────
  {
    id: 'jargon-43',
    category: 'jargon',
    question: '用户粘性（User Stickiness）',
    answer:
      '「用户粘性」指用户对产品的依赖程度和主动回访意愿，通常用DAU/MAU（日活跃/月活跃）的比值来衡量。DAU/MAU越高说明用户"来得越勤"，例如微信几乎能做到90%+。但粘性不只是频次——还包括使用时长、互动深度、切换成本等。提升粘性的手段：社交关系链沉淀、内容个性化推荐、建立用户资产（积分/等级/数据）、增加沉没成本（上传的相册/写的笔记）。"我们产品的用户粘性不够，需要找到让用户上瘾的机制"是常见的产品诊断用语。',
    tags: ['产品', '增长', '用户体验'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 44 ──────────────────────────────────────────────
  {
    id: 'jargon-44',
    category: 'jargon',
    question: '病毒式传播（Viral Marketing）',
    answer:
      '「病毒式传播」指通过用户自发的分享和推荐，让产品/内容像病毒一样在社交网络中快速扩散的营销方式。核心指标是K因子（每人平均带来的新增用户数），K>1表示指数增长。常见病毒机制：拼多多的"砍一刀"、微信红包、抖音挑战赛。设计病毒传播的三个要素：①分享动机（利益/炫耀/情感）、②低分享门槛（一键转发）、③目标用户容易接收并转化。注意：K因子天然随用户基数增大而衰减（核心圈的人最先接受，边缘圈的人接受意愿下降）。',
    tags: ['营销', '增长', '社交'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
  // ── 45 ──────────────────────────────────────────────
  {
    id: 'jargon-45',
    category: 'jargon',
    question: '品效合一（Brand & Performance Integration）',
    answer:
      '「品效合一」指品牌推广（Branding）和效果转化（Performance）同时发生、相互促进的营销模式。传统广告天然分裂：品牌广告负责"让用户知道/喜欢"，效果广告负责"让用户点击/购买"。但在数字化渠道中，品效的界限在模糊——一条好的抖音短视频既能在评论区引发品牌讨论（品），又能挂小黄车直接转化（效）。品效合一的挑战在于：品牌建设需要长期投入，效果考核倾向短期——怎么衡量品牌广告的转化？实操中通常看"品效协同"而非绝对合一，即品牌投放带动效率指标提升（搜索指数、品牌词点击率等）。',
    tags: ['营销', '品牌', '增长'],
    subTopic: '互联网黑话',
    sm2: { easeFactor: 2.5, interval: 0, repetitions: 0, nextReview: Date.now() },
    favorited: false,
  },
];
