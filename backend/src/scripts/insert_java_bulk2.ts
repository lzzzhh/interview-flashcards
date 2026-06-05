import prisma from "../db/prisma";

async function main() {

const cards: Array<[string, string, string, string, string, string[], string[], string, string]> = [
// ==========================================
// 微服务/分布式 (items 207-218)
// ==========================================
["java-207","java","什么是服务雪崩？如何防止？","服务雪崩: 一个服务不可用→调用方线程阻塞→资源耗尽→级联故障。预防: 熔断(快速失败)→降级(返回 fallback)→限流(控制流量)→隔离(线程池/信号量隔离)→超时(设置合理的超时时间)。Hystrix 线程池隔离, Sentinel 信号量隔离。","服务雪崩预防",["Java","微服务","稳定性"],["服务雪崩","熔断","降级","限流","隔离","Hystrix","Sentinel","级联故障"],"medium","JavaMicroservice"],
["java-208","java","微服务的 API 版本如何管理？","URL 版本: /api/v1/users, /api/v2/users(最常见)。Header 版本: Accept: application/vnd.company.v2+json。参数版本: ?version=2。内容协商: Accept Header。选型: URL 版本最直观，适合大版本变化。向后兼容: 只增不减字段。","API 版本管理",["Java","微服务","API"],["API版本","URL版本","Header版本","向后兼容","v1","v2","内容协商","Accept"],"medium","JavaMicroservice"],
["java-209","java","什么是服务编排和服务编制？区别？","编排(Orchestration): 中央控制器(Conductor) 协调服务调用顺序，如 Camunda/Flowable。编制(Choreography): 事件驱动，服务之间通过事件通信，无中央控制，如 Kafka + 事件总线。编排适合复杂流程(订单流程)，编制适合松耦合(数据同步)。","编排vs编制",["Java","微服务","架构"],["编排","编制","Orchestration","Choreography","Camunda","Flowable","事件驱动","Kafka","SAGA"],"medium","JavaMicroservice"],
["java-210","java","如何实现全链路压测？","流量染色: 压测请求打标记(header透传)。数据隔离: 压测数据写入影子库/影子表，不污染生产数据。中间件改造: MQ、Redis 支持压测流量识别。工具: JMeter、Gatling、阿里 PTS。生产压测: 选择低峰期，逐步加压，监控告警。","全链路压测",["Java","测试","性能"],["全链路压测","流量染色","影子库","JMeter","Gatling","PTS","压测","数据隔离"],"hard","JavaAdvanced"],
["java-211","java","如何保证消息不被重复消费？","消费端幂等: 业务唯一ID(订单号/流水号)去重。方案: Redis SETNX + 过期时间、数据库唯一索引 + INSERT IGNORE、乐观锁(version 字段)。MQ 端: Kafka/RocketMQ 保证至少一次投递，消费端需要自己保证幂等(框架做不到)。","消息去重",["Java","消息队列","幂等"],["消息去重","幂等","SETNX","唯一索引","乐观锁","至少一次","Kafka","RocketMQ"],"medium","JavaAdvanced"],
["java-212","java","什么是最终一致性？有哪些实现方式？","最终一致性: 允许短暂不一致，一定时间后数据一致。实现: 消息队列(异步通知)→本地消息表(保证消息发送成功)→定时对账(补偿不一致数据)→TCC(预留/确认/取消)→SAGA(补偿)。核心: 保证最终一致靠补偿机制。","最终一致性方案",["Java","分布式","事务"],["最终一致性","消息队列","本地消息表","对账","补偿","TCC","SAGA","定时任务"],"medium","JavaDistributed"],
["java-213","java","注册中心的健康检查机制怎么设计？","心跳检测: 客户端定期发心跳(如每 5s)，超时 N 次未收到则摘除。主动探测: 注册中心主动 ping 服务实例(TCP/HTTP)。Nacos: 临时实例用心跳(AP)，持久实例用主动探测(CP)。自我保护: Eureka 短时间内大量实例下线不立即摘除(防网络抖动)。","健康检查设计",["Java","微服务","注册中心"],["健康检查","心跳","主动探测","Nacos","Eureka","自我保护","摘除","AP","CP"],"medium","JavaDistributed"],
["java-214","java","如何设计一个配置中心？","存储: MySQL/etcd。推送: 长轮询/WebSocket/客户端定时拉取。灰度: namespace(租户)+ group 分组。变更通知: 发布订阅。权限: 操作审计。安全: 敏感配置加密。Nacos: HTTP 长轮询 30s + MD5 判断变更。Apollo: ReleaseMessage 表 + 定时扫描。","配置中心设计",["Java","架构","配置中心"],["配置中心","长轮询","Nacos","Apollo","灰度","namespace","加密","监听"],"hard","JavaAdvanced"],
["java-215","java","负载均衡算法有哪些？加权轮询怎么实现？","常见: 轮询(RoundRobin)、加权轮询(WeightedRoundRobin: 按权重分配请求)、最少连接(LeastConnections: 选连接数最少的)、一致性哈希(ConsistentHash: 同用户同节点)、加权随机(WeightedRandom)。加权轮询: 权重越大分配次数越多，Nginx upstream weight。","负载均衡算法",["Java","分布式","Nginx"],["负载均衡","轮询","加权轮询","最少连接","一致性哈希","加权随机","Nginx","upstream"],"medium","JavaDistributed"],
["java-216","java","什么是异地多活架构？如何实现数据同步？","多地部署多个数据中心同时提供服务。数据同步: MySQL 主主复制(冲突难解决)、单元化(用户按 ID hash 路由到固定单元)、GTS(全局事务服务)。流量路由: DNS 智能解析/全局负载均衡。难点: 数据一致性和网络延迟。适合: 金融(两地三中心)、互联网(单元化)。","异地多活",["Java","架构","分布式"],["异地多活","单元化","数据同步","主主复制","GTS","DNS","全局负载","两地三中心"],"hard","JavaAdvanced"],
["java-217","java","什么是服务降级？常见的降级策略有哪些？","降级: 系统负载过高时关闭非核心功能保证核心链路可用。策略: 返回静态默认值/缓存数据、关闭非核心服务(推荐/广告)、写降级(先缓存后异步写DB)、读降级(只读缓存不读DB)、限流降级(超过阈值直接拒绝)。自动化: 根据系统负载自动触发(Sentinel)。","服务降级策略",["Java","微服务","稳定性"],["降级","静态默认值","缓存兜底","写降级","读降级","限流","Sentinel","自动化"],"medium","JavaMicroservice"],
["java-218","java","什么是蓝绿部署、滚动部署、金丝雀部署？","蓝绿: 两套环境(蓝当前/绿新版本)，流量一键切换，回滚快但资源加倍。滚动: 逐个替换实例(新版本逐渐替代旧版本)，无额外资源但回滚慢。金丝雀: 小部分流量先到新版本(5%→20%→100%)，风险最低但部署时间长。K8s: RollingUpdate(默认)/BlueGreen(Istio/Flagger)。","部署策略对比",["Java","DevOps","部署"],["蓝绿部署","滚动部署","金丝雀","RollingUpdate","K8s","Istio","Flagger","回滚"],"medium","JavaAdvanced"],

// ==========================================
// 设计模式/架构 (items 219-226)
// ==========================================
["java-219","java","什么是充血模型和贫血模型？DDD 推荐哪种？","贫血模型: 只有 getter/setter 的数据对象，业务逻辑在 Service 中(传统 MVC)。充血模型: 数据和行为封装在同一对象中(面向对象)。DDD 推荐充血模型: 实体和值对象包含行为，Domain Service 处理跨聚合逻辑。Spring 项目通常是贫血，领域复杂时用充血。","充血vs贫血模型",["Java","设计","DDD"],["充血模型","贫血模型","DDD","实体","值对象","Domain Service","MVC","面向对象"],"medium","JavaAdvanced"],
["java-220","java","责任链模式在项目中的应用有哪些？","Servlet Filter 链(doFilter 调用下一个)、Spring Interceptor(preHandle)、Netty ChannelPipeline(Handler 链)、网关过滤器链、审批流程。优点: 解耦请求发送者和接收者，动态组合处理逻辑。缺点: 链太长影响性能，可能漏处理。","责任链模式应用",["Java","设计模式","责任链"],["责任链","Filter","Interceptor","ChannelPipeline","网关","审批","解耦","链式"],"medium","JavaAdvanced"],
["java-221","java","什么是 CQRS(命令查询职责分离)？什么时候用？","CQRS: 读写分离，Command(写)和 Query(读)用不同的模型甚至不同的数据库。写: 强一致模型(如 MySQL)，读: 宽表/ES/Redis。Event Sourcing: 不存当前状态，存所有变更事件。适用: 读写比悬殊的复杂业务。普通 CRUD 系统不需要 CQRS。","CQRS 模式",["Java","架构","设计模式"],["CQRS","命令查询分离","Command","Query","Event Sourcing","读写分离","ES","宽表"],"hard","JavaAdvanced"],
["java-222","java","什么是 Event Sourcing(事件溯源)？","不存储当前状态，存储所有状态变更事件。重放事件恢复当前状态。优点: 完整审计日志、时间旅行、天然支持 CQRS。缺点: 存储量大、查询当前状态需重放(用快照优化)。框架: Axon Framework。适用: 审计要求高的金融系统。","Event Sourcing",["Java","架构","事件"],["Event Sourcing","事件溯源","CQRS","Axon","重放","快照","审计","时间旅行"],"hard","JavaAdvanced"],
["java-223","java","什么是六边形架构(端口与适配器)？","六边形架构(Ports & Adapters): 业务核心在中心(领域层)，所有外部依赖通过端口(接口/Port)和适配器(Adapter)连接。左端口: 驱动端(HTTP/REST/CLI)。右端口: 被驱动端(DB/MQ/外部API)。核心思想: 依赖反转，业务不依赖框架。","六边形架构",["Java","架构","DDD"],["六边形架构","端口","适配器","Ports","Adapters","DDD","依赖反转","整洁架构"],"hard","JavaAdvanced"],
["java-224","java","什么是 SAGA 分布式事务？编排和编制两种模式？","SAGA: 长事务拆分为多个本地事务(T1,T2,T3...)，每个本地事务有对应的补偿动作(C1,C2,C3...)。编排: 中央 Saga 协调器依次调用服务，失败则逆序执行补偿。编制: 事件驱动，各服务监听事件执行和补偿。Seata SAGA 模式支持编排。","SAGA 分布式事务",["Java","分布式","事务","SAGA"],["SAGA","TCC","补偿","编排","编制","Seata","长事务","事件驱动"],"hard","JavaDistributed"],
["java-225","java","什么是背压(Backpressure)？在响应式编程中怎么处理？","背压: 生产者速度 > 消费者处理速度，消费者反馈信号让生产者降速。Reactor: request(n) 请求 N 个数据。onBackpressureBuffer: 缓冲模式。onBackpressureDrop: 丢弃模式。onBackpressureLatest: 保留最新。RxJava: Flowable 支持背压。","背压机制",["Java","响应式","Reactor"],["背压","Backpressure","Reactor","Flowable","request","onBackpressureBuffer","onBackpressureDrop","RxJava"],"hard","JavaAdvanced"],
["java-226","java","如何设计一个高可用系统？SLA 99.99% 怎么做到？","消除单点: 服务多副本+K8s自动调度。数据库: 主从+自动故障切换(MHA/Orchestrator)。缓存: Redis Cluster/Sentinel。限流熔断: 防止过载。监控告警: 早发现早处理。灰度发布: 减少变更风险。容灾: 两地三中心。SLA 99.99% 意味着年故障 < 53min。","高可用设计",["Java","架构","SLA"],["高可用","SLA","99.99%","多副本","故障切换","主从","容灾","灰度"],"hard","JavaAdvanced"],

// ==========================================
// 线上排查/工具 (items 227-235)
// ==========================================
["java-227","java","线上接口响应慢，如何排查？","网络: ping/traceroute 排查网络延迟。应用: SkyWalking/Zipkin 看链路耗时分布。Arthas trace 跟踪方法调用链耗时。数据库: 慢SQL日志+Druid监控。GC: jstat 查看 GC 频率和耗时。确认瓶颈在哪个环节(网络/应用/DB/GC)再针对性优化。","接口慢排查",["Java","线上排查","性能"],["接口慢","SkyWalking","trace","Arthas","慢SQL","GC","jstat","调用链"],"medium","JavaCore"],
["java-228","java","生产环境怎么动态修改日志级别？","Spring Boot Actuator: POST /actuator/loggers/{name} body: {configuredLevel: DEBUG}。Arthas: logger --name ROOT --level DEBUG。注意: 动态修改后记得还原(INFO)，大量 DEBUG 日志会影响性能。","动态日志级别",["Java","线上排查","工具"],["动态日志","Actuator","loggers","Arthas","DEBUG","INFO","生产","日志级别"],"easy","JavaCore"],
["java-229","java","JProfiler/MAT 怎么看内存泄漏？","MAT: Histogram 看对象数量和大小→Dominator Tree 找最大对象→GC Roots 看谁引用→Leak Suspects 自动分析。JProfiler: Heap Walker 查看对象引用链，Allocation Call Tree 看哪个方法分配了最多对象。实操: 多取几个 dump 对比增长的对象。","MAT/JProfiler",["Java","工具","排查"],["MAT","JProfiler","内存泄漏","Heap Walker","Histogram","Dominator Tree","GC Roots","dump对比"],"medium","JavaCore"],
["java-230","java","如何用 JMH 做微基准测试？","JMH(Java Microbenchmark Harness): @BenchmarkMode(Throughput/AverageTime)、@Warmup(预热迭代)、@Measurement(测量迭代)、@Fork(独立JVM避免干扰)、@State(Scope.Thread/Scope.Benchmark)。注意事项: 避免死代码消除(return 结果或 Blackhole.consume)。","JMH 基准测试",["Java","测试","性能"],["JMH","Benchmark","@Warmup","@Measurement","@Fork","Blackhole","死代码消除","微基准"],"medium","JavaCore"],
["java-231","java","Linux 常用的排查命令有哪些？","CPU: top/htop/mpstat/pidstat。内存: free/vmstat。磁盘: iostat/df/du。网络: netstat/ss/iftop/tcpdump。进程: ps/lsof/strace。Java 专用: jps/jstat/jstack/jmap/jcmd。综合: dstat(vmstat+iostat+netstat合体)。","Linux 排查命令",["Java","Linux","工具"],["Linux","top","free","iostat","netstat","jps","jstat","jstack","dstat","排查"],"easy","JavaCore"],
["java-232","java","Maven 依赖冲突怎么排查和解决？","mvn dependency:tree 查看依赖树。排除: <exclusion> 排除传递依赖。dependencyManagement: 统一版本管理。mvn enforcer:enforce 检查依赖冲突。仲裁原则: 最短路径优先、同路径先声明的优先。IDEA: Maven Helper 插件可视化冲突。","Maven 依赖冲突",["Java","Maven","构建"],["Maven","依赖冲突","dependency:tree","exclusion","dependencyManagement","最短路径","仲裁","Maven Helper"],"medium","JavaSpring"],
["java-233","java","Git 分支管理策略有哪些？Git Flow vs GitHub Flow？","Git Flow: main+develop+feature+release+hotfix，适合版本发布项目。GitHub Flow: main+feature分支→PR→merge→deploy，适合持续部署。Trunk-Based: 直接 main 分支开发，feature flag 控制发布。选型: 团队小用 GitHub Flow，版本多且维护用 Git Flow。","Git 分支策略",["Java","Git","DevOps"],["Git Flow","GitHub Flow","Trunk-Based","分支管理","feature","hotfix","release","PR","feature flag"],"easy","JavaSpring"],
["java-234","java","如何使用 Docker 多阶段构建来减少镜像大小？","多阶段构建: FROM 基础镜像 AS 构建阶段→COPY/编译→FROM 更小的基础镜像→COPY --from=构建阶段 产物。Java: Maven 编译阶段用 openjdk，运行阶段用 eclipse-temurin:17-jre-alpine(只有 JRE 约 100MB)。好处: 只有运行时需要的文件，无编译工具/源码。","Docker 多阶段构建",["Java","Docker","部署"],["Docker","多阶段构建","镜像瘦身","alpine","JRE","COPY --from","无编译工具","openjdk"],"medium","JavaSpring"],
["java-235","java","什么是 IaC(基础设施即代码)？Terraform 怎么用？","IaC: 用代码管理基础设施(服务器/网络/数据库)。Terraform: HCL 语言描述资源→terraform plan 预览变更→terraform apply 执行。state 文件记录当前状态。优点: 版本控制、可重复、自动化。对比: Ansible 偏向配置管理，Terraform 偏向资源编排。","IaC/Terraform",["Java","DevOps","云原生"],["IaC","Terraform","plan","apply","state","HCL","Ansible","资源编排","配置管理"],"medium","JavaSpring"],

// ==========================================
// 简历项目面试题 (items 236-250)
// ==========================================
["java-236","java","请介绍一个你最有挑战的项目？怎么回答？","STAR 法则: Situation(背景: 项目目标、技术栈、团队规模)、Task(你的职责)、Action(具体技术方案、你做的决策、遇到的难点及解决方案)、Result(量化结果: QPS提升X%、响应时间下降Yms)。提前准备 2-3 个项目，用 STAR 反复练习。","项目介绍 STAR",["Java","面试技巧","简历"],["STAR","项目介绍","Situation","Task","Action","Result","量化","面试"],"easy","JavaInterview"],
["java-237","java","项目中遇到的最大技术难点是什么？怎么解决的？","选择一个真实难点: 如数据库死锁→研究加锁顺序→调整业务逻辑→上线监控。性能瓶颈→JProfiler分析→发现慢SQL→加索引+缓存→QPS提升3倍。强调: 你是怎么分析问题的(排查思路)、用了什么工具、最终效果(量化数据)。","项目难点回答",["Java","面试技巧","简历"],["项目难点","技术难点","分析","排查","工具","量化结果","QPS","优化"],"easy","JavaInterview"],
["java-238","java","Java 中如何设计一个连接池？核心参数有哪些？","连接池维护一个可用连接队列。核心: maxTotal(最大连接数)、maxIdle(最大空闲)、minIdle(最小空闲)、maxWaitMillis(获取连接最大等待时间)、testOnBorrow(借出时测试有效性)、testWhileIdle(空闲时测试)。回收: 空闲超过 minEvictableIdleTimeMillis 回收。设计: 生产者消费者模式。","连接池设计",["Java","设计","连接池"],["连接池","maxTotal","maxIdle","minIdle","maxWaitMillis","testOnBorrow","生产者消费者","回收"],"hard","JavaAdvanced"],
["java-239","java","如何设计一个短信发送平台？","接口: 单条/批量发送(异步MQ)、发送状态回调。路由: 根据运营商/地区选择通道(移动/联通/电信)。限流: 每个通道 QPS 限制 + 频率限制(同一手机号 60s 内不发第二次)。监控: 发送成功率、通道耗时、成本统计。降级: 通道故障自动切换备用通道。","短信平台设计",["Java","系统设计","项目经验"],["短信平台","通道","限流","MQ","异步","降级","监控","频率限制"],"hard","JavaAdvanced"],
["java-240","java","Java 中 @Transactional 自调用失效怎么解决？面试怎么说？","原因: Spring AOP 基于代理，同类中直接调用 this.method() 不经过代理对象。解决: 1)AopContext.currentProxy()获取代理后调用(需 exposeProxy=true) 2)注入自身 @Autowired private XxxService self 3)拆到不同的类 4)使用 AspectJ 编译期织入。面试: 先说原因(AOP代理机制)再说解决方案。","@Transactional 自调用",["Java","Spring","事务","面试高频"],["自调用","@Transactional","AopContext","currentProxy","exposeProxy","注入自身","AOP代理","AspectJ"],"medium","JavaSpring"],
["java-241","java","你是怎么保证代码质量的？","1) 单元测试(JUnit5+Mockito)>80%覆盖 2) 代码审查(PR Review，至少一人 approve) 3) 静态检查(SonarQube/Checkstyle/SpotBugs) 4) CI 流水线(自动化测试+检查) 5) 编码规范(阿里规约) 6) 设计评审(复杂功能先出方案再写代码)。","代码质量保证",["Java","面试技巧","工程化"],["代码质量","单元测试","Code Review","SonarQube","CI","阿里规约","设计评审","覆盖率"],"easy","JavaInterview"],
["java-242","java","你最近在学习什么新技术？怎么回答？","选择一个和面试岗位相关的新技术: 如虚拟线程(JDK21 Loom)、Spring AI、LangChain4j。说明: 学了什么、为什么学(项目需要/兴趣)、实践过什么(写Demo/应用到项目中)、有什么收获(性能提升/开发效率)。避免: 只说在看文档没有实践。","新学习技术",["Java","面试技巧","成长"],["新技术","学习","虚拟线程","Spring AI","LangChain4j","实践","Demo","收获"],"easy","JavaInterview"],
["java-243","java","你和同事对技术方案有分歧时怎么处理？","1) 先说事实和数据，不说主观感受 2) 各自调研方案利弊(性能/复杂度/维护成本) 3) 如果双方不能决定，请技术经理或更资深同事裁决 4) 确定方案后不纠结，全力执行 5) 事后复盘。核心: 对事不对人，用数据说话。","技术分歧处理",["Java","面试技巧","软技能"],["技术分歧","数据说话","方案对比","裁决","复盘","对事不对人","软技能","协作"],"easy","JavaInterview"],
["java-244","java","线上出了故障你一般怎么处理？","1) 止血(重启/回滚/限流) 2) 保留现场(保留日志/dump) 3) 通知(同步相关方) 4) 排查(查看监控/日志/链路追踪) 5) 修复(代码修复或配置调整) 6) 复盘(根因分析/改进措施/监控告警)。黄金原则: 第一优先级是恢复服务，不是找原因。","线上故障处理",["Java","面试技巧","故障"],["线上故障","止血","回滚","复盘","根因分析","监控","黄金原则","恢复服务"],"medium","JavaInterview"],
["java-245","java","你的职业规划是什么？","短期(1-2年): 深入当前技术栈(如 Spring Boot/微服务)，成为团队核心开发。中期(3-5年): 扩展广度(系统设计/分布式/云原生)，能独立负责一个系统。长期(5年+): 技术专家或 Team Lead。结合公司和岗位: 表达你做的事和公司方向吻合。","职业规划",["Java","面试技巧","软技能"],["职业规划","短期","中期","长期","技术专家","Team Lead","匹配","成长"],"easy","JavaInterview"],
];

let count = 0;
for (const [id, deckId, question, answer, title, tags, skw, difficulty, sub] of cards) {
  try {
    await prisma.card.create({ data: { id, deckId, type: "qa", question, answer, title, tags: JSON.stringify(tags), searchKeywords: JSON.stringify(skw || []), difficulty, source: "manual", subTopic: sub || null } });
    count++;
  } catch(e: any) { if (!e.message?.includes("Unique")) console.warn("Skip " + id); }
}
console.log("Inserted " + count + " / " + cards.length + " cards");
await prisma.$disconnect();
}
main();
