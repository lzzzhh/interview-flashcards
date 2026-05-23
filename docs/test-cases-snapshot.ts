// backend/src/evaluation/test-cases.ts — 478 条 AI 搜索评测测试集
//
// Cleaned: P0-1 duplicate secondaryIds, P0-2 dl-4 overlap, P0-3 deck mismatches,
//         P1 deduplication, P2 learning-path cross-deck coverage
//
// 牌组 ID：leetcode=力扣, statistics=统计学, machine-learning=机器学习
//          deep-learning=深度学习, llm=大模型, agent=Agent
//          vibe-coding=Vibe Coding, jargon=黑话, workplace=职场

import type { TestCase } from './types';

export const TEST_CASES: TestCase[] = [

  // ── learning-path ──

  { query: "AB\u5b9e\u9a8c\u5e73\u53f0\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["stats-102", "stats-116"], secondaryIds: ["stats-118"], acceptableDecks: ["statistics"], acceptableConcepts: ["AB.*\u5b9e\u9a8c|A/B|\u5206\u6d41"] },

  { query: "AI\u4ea7\u54c1\u7ecf\u7406\u8981\u5b66\u4ec0\u4e48", group: "learning-path", primaryIds: ["agent-13", "agent-21"], secondaryIds: ["agent-3"], acceptableDecks: ["agent"], acceptableConcepts: ["Agent|\u4ea7\u54c1|Prompt"] },

  { query: "Agent\u5f00\u53d1\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["agent-21", "agent-3"], secondaryIds: ["agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["Agent|AutoGPT|Planni"] },

  { query: "CICD\u6d41\u6c34\u7ebf\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["stats-154", "stats-176"], secondaryIds: ["stats-177"], acceptableDecks: ["statistics"], acceptableConcepts: ["CI|CD|Jenkins|GitLab"] },

  { query: "CV\u56fe\u50cf\u5206\u7c7b\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["dl-6", "ml-155"], secondaryIds: ["ml-185"], acceptableDecks: ["deep-learning", "machine-learning"], acceptableConcepts: ["CNN|\u56fe\u50cf|\u5206\u7c7b"] },

  { query: "LLM\u5927\u6a21\u578b\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["llm-10", "llm-18"], secondaryIds: ["llm-21", "dl-17"], acceptableDecks: ["deep-learning", "llm"], acceptableConcepts: ["Transformer|GPT|LLM"] },

  { query: "MLOps\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["ml-158", "ml-160"], secondaryIds: ["ml-164"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["MLOps|\u90e8\u7f72|\u76d1\u63a7"] },

  { query: "NLP\u6587\u672c\u5206\u7c7b\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["llm-10", "ml-109"], secondaryIds: ["ml-110"], acceptableDecks: ["llm", "machine-learning"], acceptableConcepts: ["NLP|BERT|\u6587\u672c.*\u5206\u7c7b"] },

  { query: "Prompt Engineering\u600e\u4e48\u5165\u884c", group: "learning-path", primaryIds: ["agent-13"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Prompt|\u63d0\u793a\u8bcd|Pe.*\u5de5\u7a0b"] },

  { query: "RAG\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["agent-10", "agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|\u68c0\u7d22.*\u589e\u5f3a"] },

  { query: "Snap AR\u505a\u6ee4\u955c\u8981\u5b66\u4ec0\u4e48", group: "learning-path", primaryIds: ["vc-11"], secondaryIds: [], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["AR|\u6ee4\u955c|\u7f16\u7a0b"] },

  { query: "\u4e3a\u4ec0\u4e48\u5b66NLP\u5148\u5b66Transformer", group: "learning-path", primaryIds: ["llm-1", "llm-2"], secondaryIds: ["llm-26", "dl-25"], acceptableDecks: ["deep-learning", "llm"], acceptableConcepts: ["Transformer|NLP|Atte"] },

  { query: "\u4ec0\u4e48\u662f\u597d\u7684\u89e3\u91ca\u6027\u6587\u7ae0", group: "learning-path", primaryIds: ["ml-137", "ml-181"], secondaryIds: ["ml-73"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u53ef\u89e3\u91ca|XAI|SHAP|LIME"] },

  { query: "\u4ece\u96f6\u5b66AI\u9700\u8981\u54ea\u4e9b\u6570\u5b66", group: "learning-path", primaryIds: ["stats-15", "stats-44"], secondaryIds: [], acceptableDecks: ["machine-learning", "statistics"], acceptableConcepts: ["\u7ebf\u6027\u4ee3\u6570|\u6982\u7387|\u5fae\u79ef\u5206"] },

  { query: "\u5206\u5e03\u5f0f\u7cfb\u7edf\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["stats-126"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["\u5206\u5e03\u5f0f|CAP|\u4e00\u81f4\u6027"] },

  { query: "\u5230\u5e95\u600e\u4e48\u5feb\u901f\u5165\u95e8ML", group: "learning-path", primaryIds: ["ml-134", "ml-136"], secondaryIds: ["ml-189"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u5165\u95e8|\u673a\u5668\u5b66\u4e60|\u57fa\u7840"] },

  { query: "\u540e\u7aef\u8f6c\u7b97\u6cd5\u8981\u8865\u4ec0\u4e48", group: "learning-path", primaryIds: ["ml-10", "ml-134"], secondaryIds: ["ml-136", "stats-101"], acceptableDecks: ["machine-learning", "statistics"], acceptableConcepts: ["\u673a\u5668\u5b66\u4e60|\u7edf\u8ba1|\u6570\u5b66"] },

  { query: "\u56e0\u679c\u63a8\u65ad\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["stats-136", "stats-145"], secondaryIds: ["stats-6"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u56e0\u679c|Causal|Inference"] },

  { query: "\u56fe\u795e\u7ecf\u7f51\u7edc\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["ml-102", "ml-103"], secondaryIds: [], acceptableDecks: ["deep-learning", "machine-learning"], acceptableConcepts: ["\u56fe.*\u795e\u7ecf|Graph.*Neural"] },

  { query: "\u5927\u6570\u636eSpark\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["stats-149", "stats-152"], secondaryIds: ["stats-153"], acceptableDecks: ["statistics"], acceptableConcepts: ["Spark|Hadoop|\u5927\u6570\u636e"] },

  { query: "\u5927\u6a21\u578b\u5fae\u8c03\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["llm-12", "llm-13"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["\u5fae\u8c03|SFT|LoRA|\u9002\u914d"] },

  { query: "\u5b66AI\u5148\u61c2\u7406\u8bba\u8fd8\u662f\u5148\u4f1a\u8c03\u5305", group: "learning-path", primaryIds: ["ml-99"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7406\u8bba|\u5b9e\u8df5|\u8c03\u5305|\u6846\u67b6"] },

  { query: "\u5c0f\u4f17\u4f46\u5377\u7684AI\u8d5b\u9053\u6709\u54ea\u4e9b", group: "learning-path", primaryIds: ["ml-57"], secondaryIds: [], acceptableDecks: ["llm", "machine-learning"], acceptableConcepts: ["\u8d5b\u9053|\u65b9\u5411|\u8d8b\u52bf"] },

  { query: "\u5e7f\u544aCTR\u9884\u4f30\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["ml-176", "ml-90"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["CTR|\u5e7f\u544a|\u9884\u4f30"] },

  { query: "\u5f3a\u5316\u5b66\u4e60\u4ece\u5165\u95e8\u5230\u5b9e\u8df5", group: "learning-path", primaryIds: ["ml-112", "ml-113"], secondaryIds: ["ml-114"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u5f3a\u5316|RL|DQN|Policy"] },

  { query: "\u60f3\u505a\u7b97\u6cd5\u5de5\u7a0b\u5e08\u8981\u5b66\u4ec0\u4e48", group: "learning-path", primaryIds: ["ml-134", "ml-136"], secondaryIds: ["ml-189", "dl-10"], acceptableDecks: ["deep-learning", "machine-learning"], acceptableConcepts: ["\u673a\u5668\u5b66\u4e60|\u6df1\u5ea6\u5b66\u4e60|\u57fa\u7840"] },

  { query: "\u60f3\u5b66\u63a8\u8350\u7cfb\u7edf\u9700\u8981\u4ec0\u4e48\u6570\u5b66\u57fa\u7840", group: "learning-path", primaryIds: ["ml-103", "ml-11"], secondaryIds: ["ml-117", "stats-124"], acceptableDecks: ["machine-learning", "statistics"], acceptableConcepts: ["\u63a8\u8350|\u77e9\u9635|\u4f18\u5316"] },

  { query: "\u60f3\u8fdbFAANG\u8981\u5b66\u54ea\u4e9b\u6280\u672f", group: "learning-path", primaryIds: ["ml-113", "ml-115"], secondaryIds: [], acceptableDecks: ["leetcode", "machine-learning"], acceptableConcepts: ["\u7b97\u6cd5|\u7cfb\u7edf\u8bbe\u8ba1|FAANG"] },

  { query: "\u63a8\u8350\u7cfb\u7edf\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["ml-103", "ml-117"], secondaryIds: ["ml-133", "stats-124"], acceptableDecks: ["machine-learning", "statistics"], acceptableConcepts: ["\u63a8\u8350|\u534f\u540c\u8fc7\u6ee4"] },

  { query: "\u65f6\u95f4\u5e8f\u5217\u9884\u6d4b\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["stats-86", "stats-88"], secondaryIds: ["stats-91", "ml-148"], acceptableDecks: ["machine-learning", "statistics"], acceptableConcepts: ["\u65f6\u95f4\u5e8f\u5217|ARIMA|Prophet"] },

  { query: "\u672c\u79d1\u751f\u60f3\u505a\u6570\u636e\u79d1\u5b66\u8981\u638c\u63e1\u4ec0\u4e48", group: "learning-path", primaryIds: ["ml-166", "ml-167"], secondaryIds: [], acceptableDecks: ["machine-learning", "statistics"], acceptableConcepts: ["\u6570\u636e\u79d1\u5b66|\u7edf\u8ba1\u5206\u6790|Python"] },

  { query: "\u6a21\u578b\u90e8\u7f72\u4ece\u54ea\u5f00\u59cb\u5b66", group: "learning-path", primaryIds: ["llm-21", "llm-26"], secondaryIds: ["llm-25", "ml-160"], acceptableDecks: ["llm", "machine-learning"], acceptableConcepts: ["\u90e8\u7f72|\u63a8\u7406|ONNX|vLLM"] },

  { query: "\u7edf\u8ba1\u5b66\u4e60\u65b9\u6cd5\u4e66\u7c4d\u63a8\u8350", group: "learning-path", primaryIds: ["ml-126", "ml-17"], secondaryIds: ["ml-19"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7edf\u8ba1\u5b66\u4e60|\u674e\u822a|SVM|\u51b3\u7b56\u6811"] },

  { query: "\u81ea\u5b66CS\u57fa\u7840\u8981\u5b66\u54ea\u4e9b\u8bfe", group: "learning-path", primaryIds: ["ml-113", "ml-115"], secondaryIds: [], acceptableDecks: ["leetcode", "machine-learning"], acceptableConcepts: ["\u6570\u636e\u7ed3\u6784|\u7b97\u6cd5|\u64cd\u4f5c\u7cfb\u7edf"] },

  { query: "\u8f6c\u884cDS\u6280\u672f\u6808\u6e05\u5355", group: "learning-path", primaryIds: ["stats-101", "stats-11"], secondaryIds: ["stats-118"], acceptableDecks: ["statistics"], acceptableConcepts: ["SQL|Python|\u53ef\u89c6\u5316|\u7edf\u8ba1"] },

  { query: "\u98ce\u63a7\u5efa\u6a21\u5b66\u4e60\u8def\u7ebf", group: "learning-path", primaryIds: ["ml-103", "ml-128"], secondaryIds: ["ml-146"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u98ce\u63a7|Fraud|\u5f02\u5e38.*\u68c0\u6d4b"] },

  // ── 关键词-Agent ──

  { query: "Agent\u89c4\u5212", group: "\u5173\u952e\u8bcd-Agent", primaryIds: ["agent-4", "agent-8", "agent-5", "agent-6"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["\u89c4\u5212", "Planning", "Planning|\u89c4\u5212|AutoGPT"] },

  { query: "Agent\u8bb0\u5fc6", group: "\u5173\u952e\u8bcd-Agent", primaryIds: ["agent-21"], secondaryIds: ["agent-5"], acceptableDecks: ["agent"], acceptableConcepts: ["\u8bb0\u5fc6", "Memory"] },

  { query: "FC", group: "\u5173\u952e\u8bcd-Agent", primaryIds: ["agent-2", "agent-3"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["FunctionCalling"] },

  { query: "Function Calling", group: "\u5173\u952e\u8bcd-Agent", primaryIds: ["agent-2", "agent-3"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Function Calling", "Tool-Use"] },

  { query: "RAG", group: "\u5173\u952e\u8bcd-Agent", primaryIds: ["agent-7"], secondaryIds: ["agent-22"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG", "\u68c0\u7d22\u589e\u5f3a\u751f\u6210"] },

  { query: "Reranking", group: "\u5173\u952e\u8bcd-Agent", primaryIds: ["agent-25"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Reranking", "\u91cd\u6392\u5e8f"] },

  { query: "Reranking\u91cd\u6392\u5e8f", group: "\u5173\u952e\u8bcd-Agent", primaryIds: ["agent-25"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Rerank|\u91cd\u6392"] },

  { query: "Tool Use", group: "\u5173\u952e\u8bcd-Agent", primaryIds: ["agent-2", "agent-3"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Tool Use", "Function Calling", "ToolUse"] },

  { query: "\u5411\u91cf\u6570\u636e\u5e93", group: "\u5173\u952e\u8bcd-Agent", primaryIds: ["agent-18"], secondaryIds: ["agent-19"], acceptableDecks: ["agent"], acceptableConcepts: ["\u5411\u91cf\u6570\u636e\u5e93", "Embedding"] },

  // ── 关键词-VibeCoding ──

  { query: "MCP", group: "\u5173\u952e\u8bcd-VibeCoding", primaryIds: ["vc-5"], secondaryIds: ["vc-17"], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["MCP", "\u534f\u8bae"] },

  { query: "MCP\u534f\u8bae", group: "\u5173\u952e\u8bcd-VibeCoding", primaryIds: ["vc-17", "vc-5"], secondaryIds: [], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["MCP"] },

  { query: "Skill", group: "\u5173\u952e\u8bcd-VibeCoding", primaryIds: ["vc-2", "vc-1", "vc-10"], secondaryIds: [], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["Skill", "skill|command"] },

  // ── 关键词-力扣 ──

  { query: "Trie\u5b57\u5178\u6811", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-055"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["Trie|Prefix"] },

  { query: "\u4e24\u6570\u4e4b\u548c", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-001"], secondaryIds: ["lc-016"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u6570\u7ec4", "\u54c8\u5e0c\u8868"] },

  { query: "\u4e8c\u5206\u67e5\u627e", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-023", "lc-024", "lc-026"], secondaryIds: ["lc-040"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u4e8c\u5206\u67e5\u627e", "binary search", "Search|Binary"] },

  { query: "\u4e8c\u53c9\u6811\u7684\u6700\u8fd1\u516c\u5171\u7956\u5148", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-049"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["LCA|Lowest"] },

  { query: "\u52a8\u6001\u89c4\u5212", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-062", "lc-067"], secondaryIds: ["lc-069"], acceptableDecks: ["leetcode"], acceptableConcepts: ["DP", "\u52a8\u6001\u89c4\u5212"] },

  { query: "\u52a8\u6001\u89c4\u5212DP", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-062", "lc-065"], secondaryIds: ["lc-067"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Climbing|Coin|House"] },

  { query: "\u5355\u8c03\u6808", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-035", "lc-036", "lc-030", "lc-008", "lc-029"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u5355\u8c03\u6808", "\u63a5\u96e8\u6c34", "Daily|Trapping|Min S"] },

  { query: "\u53cd\u8f6c\u94fe\u8868", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-033"], secondaryIds: ["lc-039"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u94fe\u8868", "\u53cd\u8f6c"] },

  { query: "\u56de\u6587\u4e32", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-018", "lc-039"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u56de\u6587", "palindrome", "Palindr|\u56de\u6587"] },

  { query: "\u5b57\u5178\u6811", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-055"], secondaryIds: ["lc-056"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Trie", "\u524d\u7f00\u6811"] },

  { query: "\u5b57\u5178\u6811Trie", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-055", "lc-056"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["Trie"] },

  { query: "\u5c9b\u5c7fDFS", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-052"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["Islands|\u5c9b\u5c7f"] },

  { query: "\u5c9b\u5c7f\u95ee\u9898", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-052", "lc-040"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["DFS", "\u7f51\u683c", "\u5c9b\u5c7f"] },

  { query: "\u5e76\u67e5\u96c6", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-083", "lc-084", "lc-053", "lc-052"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u5e76\u67e5\u96c6", "Union Find", "UnionFind"] },

  { query: "\u62d3\u6251\u6392\u5e8f", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-053"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u62d3\u6251\u6392\u5e8f", "BFS"] },

  { query: "\u63a5\u96e8\u6c34", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-008"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u53cc\u6307\u9488", "\u5355\u8c03\u6808"] },

  { query: "\u6ed1\u52a8\u7a97\u53e3", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-019", "lc-022"], secondaryIds: ["lc-015", "lc-016"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u6ed1\u52a8\u7a97\u53e3", "\u53cc\u6307\u9488", "Sliding|\u6ed1\u52a8"] },

  { query: "\u722c\u697c\u68af", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-062"], secondaryIds: ["lc-069"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u52a8\u6001\u89c4\u5212", "\u6590\u6ce2\u90a3\u5951"] },

  { query: "\u80cc\u5305\u95ee\u9898", group: "\u5173\u952e\u8bcd-\u529b\u6263", primaryIds: ["lc-073", "lc-074", "lc-076"], secondaryIds: ["lc-071"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u80cc\u5305", "Partition|Knapsack|B"] },

  // ── 关键词-大模型 ──

  { query: "BERT", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-10"], secondaryIds: ["llm-17", "llm-12"], acceptableDecks: ["llm"], acceptableConcepts: ["BERT", "\u9884\u8bad\u7ec3", "MLM"] },

  { query: "BERT\u9884\u8bad\u7ec3", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-10"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["BERT"] },

  { query: "GPT", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-10", "llm-7", "llm-24"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["GPT", "\u81ea\u56de\u5f52", "decoder"] },

  { query: "GPT\u5927\u6a21\u578b", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-10", "llm-24"], secondaryIds: ["llm-39"], acceptableDecks: ["llm"], acceptableConcepts: ["GPT"] },

  { query: "KV Cache\u63a8\u7406\u52a0\u901f", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-21", "llm-26"], secondaryIds: ["llm-25"], acceptableDecks: ["llm"], acceptableConcepts: ["KV|vLLM|\u63a8\u7406|PagedA"] },

  { query: "RLHF\u5bf9\u9f50", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-11", "llm-14"], secondaryIds: ["llm-15"], acceptableDecks: ["llm"], acceptableConcepts: ["RLHF|DPO|\u5bf9\u9f50"] },

  { query: "Transformer", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-1", "llm-3", "llm-2"], secondaryIds: ["llm-38"], acceptableDecks: ["llm"], acceptableConcepts: ["Transformer", "Self-Attention", "Transformer|Self-Att"] },

  { query: "\u4f4d\u7f6e\u7f16\u7801", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-4"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Positional Encoding", "\u4f4d\u7f6e\u7f16\u7801|Positional"] },

  { query: "\u591a\u5934\u6ce8\u610f\u529b", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-3", "llm-9"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Multi-Head Attention", "Multi-Head"] },

  { query: "\u5fae\u8c03Fine-tuning", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-11", "llm-12"], secondaryIds: ["llm-13"], acceptableDecks: ["llm"], acceptableConcepts: ["\u5fae\u8c03|Finetun|SFT"] },

  { query: "\u6a21\u578b\u91cf\u5316", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-24", "llm-42"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["\u91cf\u5316|Quantiz"] },

  { query: "\u6b8b\u5dee\u8fde\u63a5", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-2", "dl-8"], secondaryIds: [], acceptableDecks: ["llm", "deep-learning"], acceptableConcepts: ["\u6b8b\u5dee\u8fde\u63a5", "ResNet"] },

  { query: "\u6ce8\u610f\u529b\u673a\u5236", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-1"], secondaryIds: ["llm-3"], acceptableDecks: ["llm"], acceptableConcepts: ["Attention", "QKV"] },

  { query: "\u8bcd\u5d4c\u5165", group: "\u5173\u952e\u8bcd-\u5927\u6a21\u578b", primaryIds: ["llm-6"], secondaryIds: ["ml-89"], acceptableDecks: ["llm", "machine-learning"], acceptableConcepts: ["Embedding", "Word2Vec"] },

  // ── 关键词-机器学习 ──

  { query: "Bagging Boosting", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-32", "ml-31"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u96c6\u6210"] },

  { query: "Bagging Boosting Stacking", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-32", "ml-31", "ml-36"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u96c6\u6210\u5b66\u4e60"] },

  { query: "K-Means", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-21"], secondaryIds: ["ml-23"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["KMeans", "\u805a\u7c7b", "\u8098\u90e8\u6cd5\u5219"] },

  { query: "KMeans\u805a\u7c7b", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-124", "ml-125"], secondaryIds: ["ml-21"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["K-Means|\u805a\u7c7b"] },

  { query: "L1 L2", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-10", "ml-20"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u6b63\u5219\u5316"] },

  { query: "L1 L2\u6b63\u5219\u5316", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-10", "ml-20"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["L1", "L2", "\u6b63\u5219\u5316"] },

  { query: "Precision F1", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-49", "ml-51", "ml-184"], secondaryIds: ["ml-56"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["F1", "Precision|F1|\u7cbe\u786e\u7387"] },

  { query: "Precision Recall F1", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-49", "ml-51"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7cbe\u786e\u7387", "\u53ec\u56de\u7387", "F1"] },

  { query: "Q-learning", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-114"], secondaryIds: ["ml-115"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Q-learning", "DQN", "Q-Learning|DQN"] },

  { query: "\u4ea4\u53c9\u9a8c\u8bc1", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-9"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["K\u6298", "\u4ea4\u53c9\u9a8c\u8bc1"] },

  { query: "\u504f\u5dee\u65b9\u5dee", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-8"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u504f\u5dee", "\u65b9\u5dee", "\u6cdb\u5316"] },

  { query: "\u504f\u5dee\u65b9\u5dee\u6743\u8861", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-188", "ml-8"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u504f\u5dee.*\u65b9\u5dee|Bias.*Varianc"] },

  { query: "\u51b3\u7b56\u6811", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-3"], secondaryIds: ["ml-17"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u51b3\u7b56\u6811", "\u4fe1\u606f\u589e\u76ca", "\u526a\u679d"] },

  { query: "\u534a\u76d1\u7763\u5b66\u4e60", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-111", "ml-118", "ml-122"], secondaryIds: ["ml-10", "ml-146"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u534a\u76d1\u7763", "\u6807\u7b7e\u4f20\u64ad", "\u81ea\u76d1\u7763|\u534a\u76d1\u7763"] },

  { query: "\u5f3a\u5316\u5b66\u4e60", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-112"], secondaryIds: ["ml-117"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u5f3a\u5316\u5b66\u4e60", "MDP", "Q-learning", "RL"] },

  { query: "\u5f3a\u5316\u5b66\u4e60RL", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-112", "ml-117"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u5f3a\u5316\u5b66\u4e60|Reinforcement"] },

  { query: "\u635f\u5931\u51fd\u6570", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-1", "ml-5", "ml-142"], secondaryIds: ["ml-144"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u635f\u5931\u51fd\u6570", "\u4ea4\u53c9\u71b5", "MSE", "\u635f\u5931\u51fd\u6570|\u4ea4\u53c9\u71b5"] },

  { query: "\u652f\u6301\u5411\u91cf\u673a", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-2"], secondaryIds: ["ml-19"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM", "\u6838\u51fd\u6570"] },

  { query: "\u6734\u7d20\u8d1d\u53f6\u65af", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-28", "ml-5", "ml-71"], secondaryIds: ["stats-9"], acceptableDecks: ["machine-learning", "statistics"], acceptableConcepts: ["\u6734\u7d20\u8d1d\u53f6\u65af", "\u8d1d\u53f6\u65af"] },

  { query: "\u68af\u5ea6\u4e0b\u964d", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-11", "ml-157", "ml-57"], secondaryIds: ["ml-58"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u68af\u5ea6\u4e0b\u964d", "SGD", "\u4f18\u5316\u5668", "\u68af\u5ea6\u4e0b\u964d|SGD"] },

  { query: "\u6b20\u62df\u5408", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-7"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u6b20\u62df\u5408|underfit"] },

  { query: "\u6b63\u5219\u5316", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-10"], secondaryIds: ["ml-20"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["L1", "L2", "\u6b63\u5219\u5316"] },

  { query: "\u7279\u5f81\u5de5\u7a0b", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-13", "ml-46", "ml-129"], secondaryIds: ["ml-138"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7279\u5f81\u5de5\u7a0b", "\u7279\u5f81\u9009\u62e9", "\u7279\u5f81"] },

  { query: "\u7279\u5f81\u7f29\u653e", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-13", "ml-45"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7279\u5f81\u7f29\u653e", "\u5f52\u4e00\u5316", "\u6807\u51c6\u5316"] },

  { query: "\u805a\u7c7b\u7b97\u6cd5", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-21", "ml-23"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u805a\u7c7b", "KMeans", "DBSCAN"] },

  { query: "\u8fc1\u79fb\u5b66\u4e60", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-149", "ml-147"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u8fc1\u79fb\u5b66\u4e60", "fine-tune"] },

  { query: "\u8fc1\u79fb\u5b66\u4e60Transfer", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-149", "ml-151"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u8fc1\u79fb|Transfer"] },

  { query: "\u8fc7\u62df\u5408", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-7"], secondaryIds: ["ml-8"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u8fc7\u62df\u5408", "\u6b20\u62df\u5408", "\u504f\u5dee\u65b9\u5dee"] },

  { query: "\u903b\u8f91\u56de\u5f52", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-1"], secondaryIds: ["ml-6"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u903b\u8f91\u56de\u5f52", "\u635f\u5931\u51fd\u6570"] },

  { query: "\u964d\u7ef4", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-22", "ml-26"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u964d\u7ef4", "PCA", "t-SNE"] },

  { query: "\u964d\u7ef4PCA", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-141", "ml-22"], secondaryIds: ["ml-26"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["PCA|\u964d\u7ef4"] },

  { query: "\u968f\u673a\u68af\u5ea6\u4e0b\u964d", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-157", "ml-11"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SGD", "\u68af\u5ea6\u4e0b\u964d"] },

  { query: "\u968f\u673a\u68af\u5ea6\u4e0b\u964dSGD", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-11", "ml-57"], secondaryIds: ["ml-58"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SGD|\u68af\u5ea6\u4e0b\u964d"] },

  { query: "\u968f\u673a\u68ee\u6797", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-18"], secondaryIds: ["ml-38"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u968f\u673a\u68ee\u6797", "\u7279\u5f81\u91cd\u8981\u6027"] },

  { query: "\u96c6\u6210\u5b66\u4e60Bagging Boosting", group: "\u5173\u952e\u8bcd-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-189", "ml-32"], secondaryIds: ["ml-36"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Bagging|Boosting|\u96c6\u6210"] },

  // ── 关键词-深度学习 ──

  { query: "Adam\u4f18\u5316\u5668", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-30"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Adam", "\u4f18\u5316\u5668"] },

  { query: "BatchNorm\u5f52\u4e00\u5316", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-21", "dl-22"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["BatchNorm|\u5f52\u4e00\u5316"] },

  { query: "CNN\u5377\u79ef\u795e\u7ecf\u7f51\u7edc", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-6"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["CNN|\u5377\u79ef"] },

  { query: "Dropout", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-4"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Dropout", "\u8fc7\u62df\u5408"] },

  { query: "GAN", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-11", "dl-12"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN"] },

  { query: "GAN\u751f\u6210\u5bf9\u6297", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-11", "dl-12"], secondaryIds: ["dl-14"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN", "\u751f\u6210\u5bf9\u6297"] },

  { query: "GAN\u751f\u6210\u5bf9\u6297\u7f51\u7edc", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-11", "dl-12"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN"] },

  { query: "RNN", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-9", "dl-10"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["RNN", "LSTM", "GRU"] },

  { query: "RNN\u5faa\u73af\u795e\u7ecf\u7f51\u7edc", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-24", "dl-7"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["RNN|LSTM"] },

  { query: "\u5377\u79ef\u795e\u7ecf\u7f51\u7edc", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-14"], secondaryIds: ["dl-6", "dl-18"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["CNN", "\u5377\u79ef"] },

  { query: "\u53cd\u5411\u4f20\u64ad", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-5"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["\u53cd\u5411\u4f20\u64ad", "backpropagation"] },

  { query: "\u5f52\u4e00\u5316", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-3", "dl-22"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["BatchNorm", "LayerNorm"] },

  { query: "\u68af\u5ea6\u6d88\u5931", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-2"], secondaryIds: ["dl-1"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["\u68af\u5ea6\u6d88\u5931", "\u6fc0\u6d3b\u51fd\u6570"] },

  { query: "\u6b8b\u5dee\u7f51\u7edc", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-8"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["ResNet", "\u8df3\u8dc3\u8fde\u63a5"] },

  { query: "\u6fc0\u6d3b\u51fd\u6570", group: "\u5173\u952e\u8bcd-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-1", "dl-31", "dl-24"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["\u6fc0\u6d3b\u51fd\u6570", "ReLU", "sigmoid"] },

  // ── 关键词-统计学 ──

  { query: "MLE", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-100", "stats-109"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["MLE"] },

  { query: "P\u503c\u663e\u8457\u6027", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-134", "stats-162"], secondaryIds: ["stats-170"], acceptableDecks: ["statistics"], acceptableConcepts: ["P.*\u503c|\u663e\u8457\u6027"] },

  { query: "\u4f59\u5f26\u76f8\u4f3c\u5ea6", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-16", "ml-59"], secondaryIds: ["ml-47", "agent-19"], acceptableDecks: ["statistics", "machine-learning", "agent"], acceptableConcepts: ["\u4f59\u5f26\u76f8\u4f3c\u5ea6", "\u4f59\u5f26"] },

  { query: "\u5047\u8bbe\u68c0\u9a8c", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-24", "stats-105", "stats-107"], secondaryIds: ["stats-25", "stats-119"], acceptableDecks: ["statistics"], acceptableConcepts: ["p\u503c", "\u5047\u8bbe\u68c0\u9a8c", "\u5047\u8bbe\u68c0\u9a8c|t.*\u68c0\u9a8c"] },

  { query: "\u5148\u9a8c\u540e\u9a8c", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-9", "stats-15"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["\u8d1d\u53f6\u65af", "\u5148\u9a8c", "\u540e\u9a8c"] },

  { query: "\u534f\u65b9\u5dee", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-17", "stats-146"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["\u534f\u65b9\u5dee", "\u76f8\u5173\u7cfb\u6570"] },

  { query: "\u5361\u65b9\u68c0\u9a8c", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-27", "stats-28"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["\u5361\u65b9\u68c0\u9a8c", "\u72ec\u7acb\u6027\u68c0\u9a8c", "\u5361\u65b9"] },

  { query: "\u5927\u6570\u5b9a\u5f8b", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-10"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["\u5927\u6570\u5b9a\u5f8b", "\u4e2d\u5fc3\u6781\u9650\u5b9a\u7406"] },

  { query: "\u6570\u636e\u503e\u659c", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-187"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["\u6570\u636e\u503e\u659c|\u503e\u659c"] },

  { query: "\u65b9\u5dee\u5206\u6790", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-29"], secondaryIds: ["stats-30"], acceptableDecks: ["statistics"], acceptableConcepts: ["ANOVA", "\u65b9\u5dee\u5206\u6790"] },

  { query: "\u65b9\u5dee\u5206\u6790ANOVA", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-106", "stats-146"], secondaryIds: ["stats-32"], acceptableDecks: ["statistics"], acceptableConcepts: ["ANOVA|\u65b9\u5dee\u5206\u6790"] },

  { query: "\u6700\u5927\u4f3c\u7136\u4f30\u8ba1", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-100", "stats-109"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["MLE", "\u4f3c\u7136\u51fd\u6570"] },

  { query: "\u6700\u5927\u4f3c\u7136\u4f30\u8ba1MLE", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-195", "stats-39"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["MLE|\u4f3c\u7136"] },

  { query: "\u6b63\u6001\u5206\u5e03", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-11", "stats-101", "stats-114"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["\u6b63\u6001\u5206\u5e03", "\u9ad8\u65af"] },

  { query: "\u7ebf\u6027\u56de\u5f52", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-47", "stats-49"], secondaryIds: ["stats-54"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u7ebf\u6027\u56de\u5f52", "OLS"] },

  { query: "\u7f6e\u4fe1\u533a\u95f4", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-8"], secondaryIds: ["stats-7"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u7f6e\u4fe1\u533a\u95f4", "\u6807\u51c6\u8bef\u5dee"] },

  { query: "\u8d1d\u53f6\u65af\u5b9a\u7406", group: "\u5173\u952e\u8bcd-\u7edf\u8ba1\u5b66", primaryIds: ["stats-9", "stats-15", "stats-39"], secondaryIds: ["stats-41"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u8d1d\u53f6\u65af", "\u6761\u4ef6\u6982\u7387", "\u5148\u9a8c", "\u540e\u9a8c"] },

  // ── 关键词-职场 ──

  { query: "STAR\u6cd5\u5219", group: "\u5173\u952e\u8bcd-\u804c\u573a", primaryIds: ["wp-7"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["STAR", "\u9762\u8bd5"] },

  { query: "\u5411\u4e0a\u7ba1\u7406", group: "\u5173\u952e\u8bcd-\u804c\u573a", primaryIds: ["wp-2"], secondaryIds: ["wp-3"], acceptableDecks: ["workplace"], acceptableConcepts: ["\u5411\u4e0a\u7ba1\u7406", "\u6c9f\u901a"] },

  { query: "\u8ff0\u804c", group: "\u5173\u952e\u8bcd-\u804c\u573a", primaryIds: ["wp-3", "wp-8"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["\u8ff0\u804c", "\u6c47\u62a5"] },

  { query: "\u8ff0\u804c\u6c47\u62a5", group: "\u5173\u952e\u8bcd-\u804c\u573a", primaryIds: ["wp-3", "wp-7"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["\u8ff0\u804c|\u6c47\u62a5"] },

  // ── 关键词-黑话 ──

  { query: "\u590d\u76d8", group: "\u5173\u952e\u8bcd-\u9ed1\u8bdd", primaryIds: ["jargon-6"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["\u590d\u76d8", "Review"] },

  { query: "\u5e95\u5c42\u903b\u8f91", group: "\u5173\u952e\u8bcd-\u9ed1\u8bdd", primaryIds: ["jargon-5"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["\u5e95\u5c42\u903b\u8f91", "\u8ba4\u77e5", "\u903b\u8f91"] },

  { query: "\u8d4b\u80fd", group: "\u5173\u952e\u8bcd-\u9ed1\u8bdd", primaryIds: ["jargon-2"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["\u8d4b\u80fd", "Empower"] },

  { query: "\u8fed\u4ee3", group: "\u5173\u952e\u8bcd-\u9ed1\u8bdd", primaryIds: ["jargon-24", "jargon-37"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["\u8fed\u4ee3"] },

  { query: "\u95ed\u73af", group: "\u5173\u952e\u8bcd-\u9ed1\u8bdd", primaryIds: ["jargon-3"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["\u95ed\u73af", "Closed Loop"] },

  { query: "\u9897\u7c92\u5ea6", group: "\u5173\u952e\u8bcd-\u9ed1\u8bdd", primaryIds: ["jargon-1"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["\u9897\u7c92\u5ea6", "\u5bf9\u9f50"] },

  // ── 回归-对抗 ──

  { query: "A Gentle Introduction to Reinforcement Learning", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["ml-112", "ml-113"], secondaryIds: ["ml-117"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u5f3a\u5316|DQN|Reward|RL"] },

  { query: "Agent\u53cd\u590d\u8c03\u7528\u540c\u4e00\u4e2a\u5de5\u5177\u600e\u4e48\u529e", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["agent-21", "agent-3"], secondaryIds: ["agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["\u5de5\u5177.*\u8c03\u7528|\u5faa\u73af|Agent"] },

  { query: "Attention Mask\u662f\u4ec0\u4e48", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["llm-1", "llm-2"], secondaryIds: ["llm-26"], acceptableDecks: ["llm"], acceptableConcepts: ["Mask|Attention|Paddi"] },

  { query: "Convolutional Neural Networks beginners", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["dl-6"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["CNN|convolution|\u5377\u79ef"] },

  { query: "ML\u91cc\u5982\u4f55\u5904\u7406\u7f3a\u5931\u503c", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["ml-141", "ml-15"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7f3a\u5931\u503c|Missing|NaN|Impu"] },

  { query: "ROC\u66f2\u7ebf\u662f\u5e72\u4ec0\u4e48\u7684", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["ml-153", "ml-50"], secondaryIds: ["ml-56"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["ROC|AUC|\u5206\u7c7b.*\u8bc4\u4f30"] },

  { query: "SVM\u6838\u51fd\u6570\u600e\u4e48\u9009", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["ml-19", "ml-2"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM|\u6838\u51fd\u6570|RBF"] },

  { query: "Self-Reflection\u8ba9Agent\u81ea\u7ea0\u9519", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["agent-14"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Self.*Reflect|\u7ea0\u9519|\u53cd\u601d"] },

  { query: "Sparse vs Dense\u5411\u91cf", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["agent-19", "agent-24"], secondaryIds: ["agent-9"], acceptableDecks: ["agent"], acceptableConcepts: ["\u7a00\u758f|\u7a20\u5bc6|Embedding"] },

  { query: "Type I Error \u548c Type II Error", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["stats-120", "stats-134"], secondaryIds: ["stats-25"], acceptableDecks: ["statistics"], acceptableConcepts: ["Type.*Error|\u7b2c\u4e00\u7c7b|\u663e\u8457\u6027"] },

  { query: "What is Backpropagation", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["dl-5"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Backprop|\u53cd\u5411.*\u4f20\u64ad"] },

  { query: "\u4e3a\u4ec0\u4e48\u9700\u8981RAG", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["agent-10", "agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|\u68c0\u7d22|\u5e7b\u89c9"] },

  { query: "\u4ec0\u4e48\u662fConfounder", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["stats-136", "stats-145"], secondaryIds: ["stats-6"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u6df7\u6742|Confound|\u56e0\u679c"] },

  { query: "\u4ec0\u4e48\u662f\u6b63\u6001\u5206\u5e03", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["stats-101", "stats-11"], secondaryIds: ["stats-111"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u6b63\u6001|\u9ad8\u65af|\u5206\u5e03"] },

  { query: "\u4ec0\u4e48\u662f\u81ea\u6ce8\u610f\u529b", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["llm-1", "llm-2"], secondaryIds: ["llm-9"], acceptableDecks: ["llm"], acceptableConcepts: ["Self.*Attention|\u81ea\u6ce8\u610f\u529b"] },

  { query: "\u5411\u91cf\u6570\u636e\u5e93\u9009\u578b", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["agent-18"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["\u5411\u91cf.*\u6570\u636e\u5e93|Pinecone|Mil"] },

  { query: "\u5927\u6a21\u578b\u80fd\u4e0d\u80fd\u7528\u6765\u505a\u641c\u7d22", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["agent-10", "agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|\u641c\u7d22|\u68c0\u7d22"] },

  { query: "\u5bf9\u8bdd\u751f\u6210\u7684\u4e0a\u4e0b\u6587\u7ba1\u7406\u600e\u4e48\u505a", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["agent-10"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["\u4e0a\u4e0b\u6587|\u8bb0\u5fc6|Window"] },

  { query: "\u600e\u4e48\u641e\u61c2\u53cd\u5411\u4f20\u64ad", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["dl-2", "dl-5"], secondaryIds: ["ml-1", "ml-106"], acceptableDecks: ["deep-learning", "machine-learning"], acceptableConcepts: ["\u53cd\u5411.*\u4f20\u64ad|BP|\u68af\u5ea6"] },

  { query: "\u600e\u4e48\u8bc4\u4f30\u4e00\u4e2aAgent\u597d\u4e0d\u597d", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["agent-15", "agent-24"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["\u8bc4\u4f30|Agent.*\u8bc4\u4f30"] },

  { query: "\u6570\u636e\u9690\u79c1\u548c\u6a21\u578b\u8bad\u7ec3\u77db\u76fe", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["ml-188"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u9690\u79c1|Federated|\u5dee\u5206"] },

  { query: "\u6811\u6a21\u578b\u7279\u5f81\u91cd\u8981\u6027\u600e\u4e48\u7b97", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["ml-13", "ml-176"], secondaryIds: ["ml-18"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7279\u5f81.*\u91cd\u8981|Permutation|S"] },

  { query: "\u6a21\u578bServing\u600e\u4e48\u505a", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["llm-26"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Serving|vLLM|Triton|"] },

  { query: "\u7edf\u8ba1\u5b66\u7684\u4e2d\u5fc3\u6781\u9650\u5b9a\u7406", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["stats-10", "stats-11"], secondaryIds: ["stats-114"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u4e2d\u5fc3\u6781\u9650|CLT|\u6b63\u6001"] },

  { query: "\u8bbe\u8ba1\u4e00\u4e2a\u50cfGPT\u90a3\u6837\u7684\u5bf9\u8bddAgent\u9700\u8981\u8003\u8651\u4ec0\u4e48", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["agent-21", "agent-3"], secondaryIds: ["agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["Agent|GPT|\u5bf9\u8bdd|Token"] },

  { query: "\u8fc7\u62df\u5408\u6b20\u62df\u5408\u5982\u4f55\u5224\u65ad", group: "\u56de\u5f52-\u5bf9\u6297", primaryIds: ["ml-188", "ml-7"], secondaryIds: ["ml-77"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u8fc7\u62df\u5408|\u6b20\u62df\u5408|\u504f\u5dee.*\u65b9\u5dee"] },

  // ── 复杂-Agent ──

  { query: "\u600e\u4e48\u5728\u5b9e\u9645\u5de5\u4f5c\u4e2d\u628a\u5927\u6a21\u578b\u7684\u80fd\u529b\u96c6\u6210\u5230\u81ea\u5df1\u7684\u4e1a\u52a1\u7cfb\u7edf\u91cc", group: "\u590d\u6742-Agent", primaryIds: ["agent-7"], secondaryIds: ["agent-21", "agent-2"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG", "Agentic RAG", "Function Calling"] },

  { query: "\u6d77\u91cf\u6570\u636e\u91cc\u627e\u76f8\u4f3c\u5411\u91cf\u6700\u5feb\u7684\u65b9\u6848\u662f\u4ec0\u4e48", group: "\u590d\u6742-Agent", primaryIds: ["agent-18"], secondaryIds: ["agent-26", "agent-9"], acceptableDecks: ["agent"], acceptableConcepts: ["\u5411\u91cf\u6570\u636e\u5e93", "ANN", "\u6df7\u5408\u68c0\u7d22"] },

  // ── 复杂-VibeCoding ──

  { query: "\u4f5c\u4e3a\u4e00\u4e2a\u9762\u8bd5\u5b98\uff0c\u6211\u60f3\u95ee\u51e0\u4e2a\u5173\u4e8e MCP \u534f\u8bae\u7684\u597d\u95ee\u9898", group: "\u590d\u6742-VibeCoding", primaryIds: ["vc-5"], secondaryIds: ["vc-17"], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["MCP", "\u534f\u8bae"] },

  // ── 复杂-力扣 ──

  { query: "\u4e8c\u53c9\u6811\u7684\u56db\u79cd\u904d\u5386\u65b9\u5f0f\u5206\u522b\u662f\u4ec0\u4e48\uff0c\u5404\u81ea\u7684\u5e94\u7528\u573a\u666f", group: "\u590d\u6742-\u529b\u6263", primaryIds: ["lc-043"], secondaryIds: ["lc-040", "lc-041"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u4e8c\u53c9\u6811", "\u904d\u5386", "\u524d\u5e8f", "\u4e2d\u5e8f"] },

  { query: "\u52a8\u6001\u89c4\u5212\u7684\u89e3\u9898\u6846\u67b6\u662f\u4ec0\u4e48\uff0c\u6709\u4ec0\u4e48\u7ecf\u5178\u4f8b\u9898\u53ef\u4ee5\u4e3e\u4f8b\u8bf4\u660e", group: "\u590d\u6742-\u529b\u6263", primaryIds: ["lc-062"], secondaryIds: ["lc-069", "lc-071", "lc-073"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u52a8\u6001\u89c4\u5212", "\u722c\u697c\u68af", "\u7f16\u8f91\u8ddd\u79bb"] },

  // ── 复杂-大模型 ──

  { query: "\u5927\u6a21\u578b\u63a8\u7406\u592a\u6162\u4e86\uff0c\u6709\u54ea\u4e9b\u52a0\u901f\u624b\u6bb5\u53ef\u4ee5\u7528", group: "\u590d\u6742-\u5927\u6a21\u578b", primaryIds: ["llm-21", "llm-24"], secondaryIds: ["llm-25", "llm-26"], acceptableDecks: ["llm"], acceptableConcepts: ["KV Cache", "\u91cf\u5316", "\u63a8\u7406\u52a0\u901f"] },

  { query: "\u600e\u4e48\u7406\u89e3\u5927\u6a21\u578b alignment \u5bf9\u9f50\u8fd9\u56de\u4e8b\uff0c\u4e3a\u4ec0\u4e48\u8981\u505a RLHF", group: "\u590d\u6742-\u5927\u6a21\u578b", primaryIds: ["llm-14"], secondaryIds: ["llm-11", "llm-15"], acceptableDecks: ["llm"], acceptableConcepts: ["RLHF", "\u5bf9\u9f50", "\u9884\u8bad\u7ec3"] },

  { query: "\u7ed9\u6211\u8bb2\u4e00\u4e0b\u4ece word2vec \u5230 BERT \u5230 GPT \u7684\u53d1\u5c55\u8109\u7edc", group: "\u590d\u6742-\u5927\u6a21\u578b", primaryIds: ["llm-10"], secondaryIds: ["llm-8", "llm-7"], acceptableDecks: ["llm"], acceptableConcepts: ["BERT", "GPT", "Transformer"] },

  { query: "\u8bf7\u8be6\u7ec6\u89e3\u91ca\u4e00\u4e0b Transformer \u7684\u81ea\u6ce8\u610f\u529b\u673a\u5236\u662f\u600e\u4e48\u8ba1\u7b97\u7684\uff0cQ K V \u5206\u522b\u4ee3\u8868\u4ec0\u4e48", group: "\u590d\u6742-\u5927\u6a21\u578b", primaryIds: ["llm-1", "llm-3"], secondaryIds: ["llm-2"], acceptableDecks: ["llm"], acceptableConcepts: ["Self-Attention", "QKV", "Multi-Head"] },

  // ── 复杂-机器学习 ──

  { query: "\u6709 100 \u4e07\u6761\u6570\u636e\u4f46\u662f\u6807\u6ce8\u53ea\u6709 1 \u4e07\u6761\uff0c\u8fd9\u79cd\u60c5\u51b5\u8be5\u600e\u4e48\u529e", group: "\u590d\u6742-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-10"], secondaryIds: ["ml-9", "ml-16"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u534a\u76d1\u7763", "\u6b63\u5219\u5316", "\u8fc1\u79fb\u5b66\u4e60"] },

  { query: "\u80fd\u4e0d\u80fd\u5e2e\u6211\u7cfb\u7edf\u68b3\u7406\u4e00\u4e0b\u96c6\u6210\u5b66\u4e60\u4ece bagging \u5230 boosting \u5230 stacking \u7684\u6f14\u53d8", group: "\u590d\u6742-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-32"], secondaryIds: ["ml-31", "ml-36"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Bagging", "Boosting", "Stacking"] },

  { query: "\u9762\u8bd5\u5b98\u95ee\u6211\u600e\u4e48\u8bc4\u4f30\u4e00\u4e2a\u5206\u7c7b\u6a21\u578b\u7684\u597d\u574f\uff0c\u6211\u5e94\u8be5\u4ece\u54ea\u4e9b\u89d2\u5ea6\u56de\u7b54", group: "\u590d\u6742-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-49", "ml-50"], secondaryIds: ["ml-51", "ml-56"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7cbe\u786e\u7387", "\u53ec\u56de\u7387", "ROC", "AUC"] },

  // ── 复杂-深度学习 ──

  { query: "Stable Diffusion \u4e3a\u4ec0\u4e48\u5728 latent space \u6269\u6563\u800c\u4e0d\u662f\u50cf\u7d20\u7a7a\u95f4", group: "\u590d\u6742-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-16"], secondaryIds: ["dl-15"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Stable Diffusion", "Latent Space"] },

  { query: "\u6211\u5728\u8bad\u7ec3\u6df1\u5ea6\u5b66\u4e60\u6a21\u578b\u65f6\u53d1\u73b0\u8bad\u7ec3 loss \u4e00\u76f4\u964d\u4f46\u9a8c\u8bc1 loss \u4e0d\u964d\uff0c\u8fd9\u662f\u4ec0\u4e48\u95ee\u9898\uff0c\u600e\u4e48\u89e3\u51b3", group: "\u590d\u6742-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["ml-7"], secondaryIds: ["dl-4", "ml-9"], acceptableDecks: ["machine-learning", "deep-learning"], acceptableConcepts: ["\u8fc7\u62df\u5408", "Dropout", "\u4ea4\u53c9\u9a8c\u8bc1"] },

  // ── 复杂-统计学 ──

  { query: "AB \u6d4b\u8bd5\u505a\u4e86\u4e4b\u540e\u53d1\u73b0\u5b9e\u9a8c\u7ec4\u548c\u5bf9\u7167\u7ec4\u6ca1\u6709\u663e\u8457\u5dee\u5f02\uff0c\u53ef\u80fd\u7684\u539f\u56e0\u6709\u54ea\u4e9b", group: "\u590d\u6742-\u7edf\u8ba1\u5b66", primaryIds: ["stats-26"], secondaryIds: ["stats-31", "stats-25"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u5047\u8bbe\u68c0\u9a8c", "\u7edf\u8ba1\u529f\u6548", "\u6837\u672c\u91cf"] },

  // ── 学习路径-力扣 ──

  { query: "\u60f3\u5237\u52a8\u6001\u89c4\u5212\uff0c\u63a8\u8350\u51e0\u9053\u9898", group: "\u5b66\u4e60\u8def\u5f84-\u529b\u6263", primaryIds: ["lc-062"], secondaryIds: ["lc-063", "lc-064", "lc-067"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u52a8\u6001\u89c4\u5212", "DP"] },

  // ── 学习路径-大模型 ──

  { query: "\u6211 Transformer \u4e0d\u592a\u61c2\uff0c\u5e2e\u6211\u627e\u76f8\u5173\u5361\u7247", group: "\u5b66\u4e60\u8def\u5f84-\u5927\u6a21\u578b", primaryIds: ["llm-1"], secondaryIds: ["llm-3", "llm-4", "llm-9"], acceptableDecks: ["llm"], acceptableConcepts: ["Transformer", "Attention", "\u4f4d\u7f6e\u7f16\u7801"] },

  // ── 学习路径-机器学习 ──

  { query: "\u5047\u5982\u6211\u60f3\u5b66\u4e60\u51b3\u7b56\u6811\uff0c\u6211\u5e94\u8be5\u5b66\u4e60\u54ea\u4e9b\u5361\u7247", group: "\u5b66\u4e60\u8def\u5f84-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-3"], secondaryIds: ["ml-16", "ml-17"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u51b3\u7b56\u6811", "\u968f\u673a\u68ee\u6797", "\u96c6\u6210\u5b66\u4e60"] },

  // ── 学习路径-深度学习 ──

  { query: "\u73b0\u5728\u60f3\u5165\u95e8\u6df1\u5ea6\u5b66\u4e60\uff0c\u9700\u8981\u770b\u54ea\u4e9b\u57fa\u7840\u5361\u7247", group: "\u5b66\u4e60\u8def\u5f84-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-1"], secondaryIds: ["dl-2", "dl-3", "dl-5"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["\u6df1\u5ea6\u5b66\u4e60", "\u53cd\u5411\u4f20\u64ad", "\u6fc0\u6d3b\u51fd\u6570"] },

  // ── 学习路径-统计学 ──

  { query: "\u5982\u4f55\u7cfb\u7edf\u5730\u5b66\u4e60\u5047\u8bbe\u68c0\u9a8c", group: "\u5b66\u4e60\u8def\u5f84-\u7edf\u8ba1\u5b66", primaryIds: ["stats-24", "stats-25"], secondaryIds: ["stats-26", "stats-27"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u5047\u8bbe\u68c0\u9a8c", "p\u503c", "t\u68c0\u9a8c"] },

  // ── 概念-Agent ──

  { query: "Agent\u548cLLM\u5230\u5e95\u4ec0\u4e48\u5173\u7cfb", group: "\u6982\u5ff5-Agent", primaryIds: ["agent-1", "agent-2"], secondaryIds: ["agent-21", "llm-16"], acceptableDecks: ["agent", "llm"], acceptableConcepts: ["Agent|LLM|\u5173\u7cfb"] },

  { query: "Agent\u957f\u671f\u8bb0\u5fc6\u600e\u4e48\u8bbe\u8ba1", group: "\u6982\u5ff5-Agent", primaryIds: ["agent-21"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["\u8bb0\u5fc6|Memory|Agentic"] },

  { query: "RAG \u7684\u68c0\u7d22\u7ed3\u679c\u8981\u4e0d\u8981\u91cd\u65b0\u6392\u4e2a\u5e8f", group: "\u6982\u5ff5-Agent", primaryIds: ["agent-25"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Reranking", "\u91cd\u6392\u5e8f"] },

  { query: "ReAct\u548c\u666e\u901a\u5bf9\u8bdd\u6a21\u578b\u533a\u522b", group: "\u6982\u5ff5-Agent", primaryIds: ["agent-1", "agent-21"], secondaryIds: ["agent-3"], acceptableDecks: ["agent"], acceptableConcepts: ["ReAct|\u63a8\u7406|Agent"] },

  { query: "\u600e\u4e48\u77e5\u9053 RAG \u641c\u51fa\u6765\u7684\u4e1c\u897f\u9760\u4e0d\u9760\u8c31", group: "\u6982\u5ff5-Agent", primaryIds: ["agent-15"], secondaryIds: ["agent-17"], acceptableDecks: ["agent"], acceptableConcepts: ["\u8bc4\u4f30", "\u5e7b\u89c9"] },

  { query: "\u600e\u4e48\u8ba9Agent\u6267\u884c\u591a\u6b65\u9aa4\u4efb\u52a1", group: "\u6982\u5ff5-Agent", primaryIds: ["agent-5", "agent-6"], secondaryIds: ["agent-8"], acceptableDecks: ["agent"], acceptableConcepts: ["Planning|AutoGPT|\u6b65\u9aa4"] },

  { query: "\u600e\u4e48\u8ba9\u5927\u6a21\u578b\u81ea\u5df1\u53bb\u8c03 API", group: "\u6982\u5ff5-Agent", primaryIds: ["agent-2"], secondaryIds: ["agent-3"], acceptableDecks: ["agent"], acceptableConcepts: ["Function Calling", "Tool-Use"] },

  { query: "\u600e\u4e48\u8bc4\u4f30RAG\u7cfb\u7edf\u597d\u4e0d\u597d", group: "\u6982\u5ff5-Agent", primaryIds: ["agent-15", "agent-24"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["RAG.*\u8bc4\u4f30|\u68c0\u7d22\u8d28\u91cf"] },

  // ── 概念-VibeCoding ──

  { query: "agent \u548c skill \u7684\u6838\u5fc3\u533a\u522b\u5728\u54ea", group: "\u6982\u5ff5-VibeCoding", primaryIds: ["vc-2", "vc-1"], secondaryIds: ["vc-3"], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["Agent", "Skill", "sub-agent"] },

  { query: "\u600e\u4e48\u7ed9 AI \u5199\u9879\u76ee\u89c4\u5219\u6587\u4ef6", group: "\u6982\u5ff5-VibeCoding", primaryIds: ["vc-6"], secondaryIds: [], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["CLAUDE.md", "AGENTS.md"] },

  // ── 概念-力扣 ──

  { query: "\u4e8c\u53c9\u6811\u7684\u6700\u8fd1\u516c\u5171\u7956\u5148", group: "\u6982\u5ff5-\u529b\u6263", primaryIds: ["lc-049"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["LCA", "\u4e8c\u53c9\u6811"] },

  { query: "\u4e8c\u53c9\u6811\u904d\u5386\u9012\u5f52\u548c\u975e\u9012\u5f52\u54ea\u4e2a\u597d", group: "\u6982\u5ff5-\u529b\u6263", primaryIds: ["lc-040", "lc-043"], secondaryIds: ["lc-044"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Binary Tree.*Travers"] },

  { query: "\u5237\u52a8\u6001\u89c4\u5212\u4e00\u76f4\u641e\u4e0d\u61c2\u72b6\u6001\u8f6c\u79fb", group: "\u6982\u5ff5-\u529b\u6263", primaryIds: ["lc-062", "lc-065"], secondaryIds: ["lc-067"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Climbing|Coin|House"] },

  { query: "\u5341\u5b57\u94fe\u8868\u6709\u4ec0\u4e48\u7528", group: "\u6982\u5ff5-\u529b\u6263", primaryIds: ["lc-010", "lc-011"], secondaryIds: ["lc-026"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Matrix|Set Zero|Spir"] },

  { query: "\u5408\u5e76\u6709\u5e8f\u6570\u7ec4", group: "\u6982\u5ff5-\u529b\u6263", primaryIds: ["lc-013"], secondaryIds: ["lc-038"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u5408\u5e76", "\u6709\u5e8f\u6570\u7ec4"] },

  { query: "\u56fe\u7684\u6700\u77ed\u8def\u5f84\u7b97\u6cd5\u6bd4\u8f83", group: "\u6982\u5ff5-\u529b\u6263", primaryIds: ["lc-050", "lc-051"], secondaryIds: ["lc-069"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Path|Dijkstra|\u6700\u77ed"] },

  { query: "\u6570\u7ec4\u9898\u53cc\u6307\u9488\u548c\u524d\u7f00\u548c\u600e\u4e48\u9009", group: "\u6982\u5ff5-\u529b\u6263", primaryIds: ["lc-001", "lc-004"], secondaryIds: ["lc-005"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Two Sum|Subarray|Mov"] },

  { query: "\u6700\u957f\u4e0d\u91cd\u590d\u5b50\u4e32", group: "\u6982\u5ff5-\u529b\u6263", primaryIds: ["lc-019"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u65e0\u91cd\u590d\u5b57\u7b26", "\u6ed1\u52a8\u7a97\u53e3"] },

  { query: "\u9762\u8bd5\u8003\u94fe\u8868\u8001\u5199bug\u600e\u4e48\u529e", group: "\u6982\u5ff5-\u529b\u6263", primaryIds: ["lc-032", "lc-033"], secondaryIds: ["lc-034"], acceptableDecks: ["leetcode"], acceptableConcepts: ["Reverse.*Linked|Cycl"] },

  // ── 概念-大模型 ──

  { query: "Encoder Decoder\u67b6\u6784", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-8"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Encoder.*Decoder|Seq"] },

  { query: "KV cache\u4e3a\u4ec0\u4e48\u8981\u7528", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-21", "llm-26"], secondaryIds: ["llm-25"], acceptableDecks: ["llm"], acceptableConcepts: ["KV|Cache|\u63a8\u7406"] },

  { query: "RLHF\u600e\u4e48\u8ba9\u6a21\u578b\u5bf9\u9f50\u4eba\u7c7b\u504f\u597d", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-14", "llm-15"], secondaryIds: ["llm-20"], acceptableDecks: ["llm"], acceptableConcepts: ["RLHF|DPO|\u5956\u52b1"] },

  { query: "\u4e3a\u4ec0\u4e48 transformer \u6bd4 rnn \u8bad\u7ec3\u5f97\u5feb", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-7"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["\u5e76\u884c\u5316", "Transformer"] },

  { query: "\u4e3a\u4ec0\u4e48Transformer\u6bd4RNN\u5feb", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-1", "llm-2"], secondaryIds: ["llm-38", "dl-9"], acceptableDecks: ["llm", "deep-learning"], acceptableConcepts: ["\u5e76\u884c|Transformer|Self-"] },

  { query: "\u4e3a\u4ec0\u4e48Transformer\u7528\u4f4d\u7f6e\u7f16\u7801", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-4"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["\u4f4d\u7f6e\u7f16\u7801|Positional|RoPE"] },

  { query: "\u4e3a\u4ec0\u4e48\u5927\u6a21\u578b\u90e8\u7f72\u7528KV cache", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-21", "llm-26"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["KV.*Cache|\u63a8\u7406.*\u52a0\u901f|Pag"] },

  { query: "\u591a\u6a21\u6001\u5927\u6a21\u578b\u539f\u7406", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-26"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["\u591a\u6a21\u6001|\u89c6\u89c9|VL"] },

  { query: "\u5927\u6a21\u578b\u4e3a\u4ec0\u4e48\u80e1\u7f16\u4e71\u9020", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["agent-10", "agent-11"], secondaryIds: [], acceptableDecks: ["llm", "agent"], acceptableConcepts: ["\u5e7b\u89c9|\u4e8b\u5b9e\u6027|RAG"] },

  { query: "\u5927\u6a21\u578b\u5fae\u8c03\u707e\u96be\u6027\u9057\u5fd8", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-18"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["\u707e\u96be|Catastrophic|\u9057\u5fd8"] },

  { query: "\u5fae\u8c03\u548c\u4ece\u5934\u8bad\u7ec3\u6709\u4ec0\u4e48\u533a\u522b", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-11", "llm-12"], secondaryIds: ["llm-13"], acceptableDecks: ["llm"], acceptableConcepts: ["\u5fae\u8c03|Pretrain|SFT"] },

  { query: "\u600e\u4e48\u5728\u4e0d\u6539\u5927\u6a21\u578b\u53c2\u6570\u7684\u60c5\u51b5\u4e0b\u8ba9\u5b83\u5b66\u4f1a\u65b0\u4efb\u52a1", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-12"], secondaryIds: ["llm-16", "llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["LoRA", "PEFT", "\u5fae\u8c03"] },

  { query: "\u600e\u4e48\u8ba9\u5927\u6a21\u578b\u56de\u7b54\u66f4\u51c6\u786e", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-14", "llm-16"], secondaryIds: ["llm-20"], acceptableDecks: ["llm"], acceptableConcepts: ["Prompt|COT|RAG|RLHF"] },

  { query: "\u6a21\u578b\u600e\u4e48\u77e5\u9053\u6bcf\u4e2a token \u5728\u53e5\u5b50\u91cc\u7684\u4f4d\u7f6e", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-4"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["\u4f4d\u7f6e\u7f16\u7801", "Transformer"] },

  { query: "\u91cf\u5316\u5bf9\u6a21\u578b\u6027\u80fd\u5f71\u54cd\u591a\u5927", group: "\u6982\u5ff5-\u5927\u6a21\u578b", primaryIds: ["llm-24", "llm-42"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["\u91cf\u5316|AWQ|GPTQ"] },

  // ── 概念-机器学习 ──

  { query: "EM\u7b97\u6cd5\u6838\u5fc3\u601d\u60f3", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-125", "ml-134"], secondaryIds: ["ml-138"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["EM|GMM|\u9ad8\u65af\u6df7\u5408"] },

  { query: "Stacking\u548cBlending\u533a\u522b", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-189", "ml-36"], secondaryIds: ["ml-40"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Stacking|Blending|\u96c6\u6210"] },

  { query: "\u4e0d\u5e73\u8861\u6570\u636e\u600e\u4e48\u5904\u7406", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-143", "ml-16"], secondaryIds: ["ml-72"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u4e0d\u5e73\u8861|Imbalance|SMOTE|"] },

  { query: "\u4e3a\u4ec0\u4e48\u5206\u7c7b\u7528\u4ea4\u53c9\u71b5\u4e0d\u7528MSE", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-53", "ml-54"], secondaryIds: ["ml-60"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u4ea4\u53c9\u71b5|MSE|Log.*Loss"] },

  { query: "\u4e3a\u4ec0\u4e48\u8981shuffle\u6570\u636e", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-109", "ml-122"], secondaryIds: ["ml-155"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["shuffle|epoch|\u8bad\u7ec3"] },

  { query: "\u4ea4\u53c9\u9a8c\u8bc1K\u600e\u4e48\u9009", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-176", "ml-187"], secondaryIds: ["ml-44"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["K.*Fold|\u4ea4\u53c9\u9a8c\u8bc1|Cross"] },

  { query: "\u4ec0\u4e48\u662f\u51b7\u542f\u52a8\u95ee\u9898", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-87"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u51b7\u542f\u52a8|Cold Start"] },

  { query: "\u53c2\u6570\u592a\u591a\u6a21\u578b\u592a\u590d\u6742\u600e\u4e48\u529e", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-10", "ml-139"], secondaryIds: ["ml-7"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u8fc7\u62df\u5408|\u6b63\u5219\u5316|\u590d\u6742\u5ea6"] },

  { query: "\u591a\u4e2a\u6a21\u578b\u7684\u7ed3\u679c\u600e\u4e48\u878d\u5408\u8d77\u6765", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-31"], secondaryIds: ["ml-36", "ml-32"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u96c6\u6210\u5b66\u4e60", "Bagging", "Boosting"] },

  { query: "\u600e\u4e48\u5224\u65ad\u6a21\u578b\u662f\u4e0d\u662f\u5b66\u8fc7\u5934\u4e86", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-7"], secondaryIds: ["ml-9"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u8fc7\u62df\u5408", "\u4ea4\u53c9\u9a8c\u8bc1"] },

  { query: "\u600e\u4e48\u5224\u65ad\u805a\u7c7b\u7ed3\u679c\u597d\u4e0d\u597d", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-21", "ml-23"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u805a\u7c7b.*\u8bc4\u4f30|\u8f6e\u5ed3|Silhouette"] },

  { query: "\u635f\u5931\u51fd\u6570\u4e0d\u4e0b\u964d\u4e86\u600e\u4e48\u529e", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-12", "ml-59"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u5b66\u4e60\u7387|\u6536\u655b|\u5c40\u90e8\u6700\u4f18"] },

  { query: "\u6570\u636e\u592a\u5c11\u8bad\u7ec3\u4e0d\u597d\u600e\u4e48\u529e", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-149", "ml-151"], secondaryIds: ["ml-180"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u6570\u636e\u589e\u5f3a|\u8fc1\u79fb|\u5c11\u6837\u672c"] },

  { query: "\u673a\u5668\u5b66\u4e60\u6a21\u578b\u4e0a\u7ebf\u540e\u8870\u51cf", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-156", "ml-157"], secondaryIds: ["ml-158"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u6f02\u79fb|\u8870\u51cf|Drift|\u76d1\u63a7|MLOps"] },

  { query: "\u6837\u672c\u4e0d\u5747\u8861\u600e\u4e48\u5904\u7406", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-16"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7c7b\u522b\u4e0d\u5747\u8861", "SMOTE"] },

  { query: "\u6a21\u578b\u5728\u8bad\u7ec3\u96c6\u51c6\u4e0a\u7ebf\u5dee\u600e\u4e48\u6392\u67e5", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-158", "ml-7"], secondaryIds: ["ml-77"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u8fc7\u62df\u5408|\u6cdb\u5316|\u5206\u5e03"] },

  { query: "\u7279\u5f81\u592a\u591a\u600e\u4e48\u6311\u9009\u91cd\u8981\u7684", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-138", "ml-181"], secondaryIds: ["ml-41"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7279\u5f81\u9009\u62e9|Permutation|SHA"] },

  { query: "\u7279\u5f81\u5de5\u7a0b\u5b8c\u6574\u6d41\u7a0b", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-13", "ml-138"], secondaryIds: ["ml-41"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7279\u5f81.*\u5de5\u7a0b|\u7279\u5f81.*\u9009\u62e9|\u7279\u5f81.*\u7f29\u653e"] },

  { query: "\u751f\u6210\u6a21\u578b\u548c\u5224\u522b\u6a21\u578b\u533a\u522b", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-110", "ml-111"], secondaryIds: ["ml-169"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u751f\u6210|\u5224\u522b|GAN|\u8d1d\u53f6\u65af"] },

  { query: "\u8bad\u7ec3\u96c6\u8868\u73b0\u5f88\u597d\u4f46\u6d4b\u8bd5\u96c6\u5f88\u5dee\u662f\u600e\u4e48\u56de\u4e8b", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-7"], secondaryIds: ["ml-8", "ml-4"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u8fc7\u62df\u5408", "\u6cdb\u5316", "\u504f\u5dee\u65b9\u5dee"] },

  { query: "\u98ce\u63a7\u5efa\u6a21\u4e00\u822c\u7528\u4ec0\u4e48\u7b97\u6cd5", group: "\u6982\u5ff5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-103", "ml-128"], secondaryIds: ["ml-146"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u98ce\u63a7|\u5f02\u5e38|Fraud|Anomaly"] },

  // ── 概念-深度学习 ──

  { query: "Diffusion\u53bb\u566a\u8fc7\u7a0b", group: "\u6982\u5ff5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-15", "dl-16"], secondaryIds: ["dl-27"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["\u6269\u6563|Diffusion|DDPM"] },

  { query: "LSTM\u600e\u4e48\u89e3\u51b3\u957f\u671f\u8bb0\u5fc6\u95ee\u9898", group: "\u6982\u5ff5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-24", "dl-7"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["LSTM|GRU|\u957f\u671f"] },

  { query: "softmax\u8f93\u51fa\u4e3a\u4ec0\u4e48\u548c\u4e3a1", group: "\u6982\u5ff5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-31", "dl-32"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["softmax"] },

  { query: "\u5377\u79ef\u5c42\u5230\u5e95\u5728\u63d0\u53d6\u4ec0\u4e48\u4fe1\u606f", group: "\u6982\u5ff5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-6"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["CNN|\u5377\u79ef\u6838|\u7279\u5f81\u56fe"] },

  { query: "\u6b8b\u5dee\u7f51\u7edc\u4e3a\u4ec0\u4e48\u8981\u8df3\u8dc3\u8fde\u63a5", group: "\u6982\u5ff5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-8"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["ResNet|\u6b8b\u5dee|Skip.*Conn"] },

  { query: "\u751f\u6210\u5668\u548c\u5224\u522b\u5668\u662f\u600e\u4e48\u4e92\u76f8\u535a\u5f08\u7684", group: "\u6982\u5ff5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-11"], secondaryIds: ["dl-12"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN", "\u751f\u6210\u5bf9\u6297"] },

  { query: "\u795e\u7ecf\u7f51\u7edc\u4e3a\u4ec0\u4e48\u4e0d\u80fd\u592a\u6df1\u4e5f\u4e0d\u80fd\u592a\u6d45", group: "\u6982\u5ff5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-2"], secondaryIds: ["dl-8"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["\u68af\u5ea6\u6d88\u5931", "\u68af\u5ea6\u7206\u70b8", "ResNet"] },

  { query: "\u795e\u7ecf\u7f51\u7edc\u4e3a\u4ec0\u4e48\u8981\u52a0\u6fc0\u6d3b\u51fd\u6570", group: "\u6982\u5ff5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-1", "dl-24"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["\u6fc0\u6d3b\u51fd\u6570|\u975e\u7ebf\u6027"] },

  { query: "\u8bad\u7ec3\u548c\u63a8\u7406\u65f6 dropout \u884c\u4e3a\u4e00\u6837\u5417", group: "\u6982\u5ff5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-4"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Dropout", "\u8bad\u7ec3\u63a8\u7406"] },

  // ── 概念-统计学 ──

  { query: "AB\u6d4b\u8bd5\u600e\u4e48\u5224\u65ad\u663e\u8457", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-102", "stats-116"], secondaryIds: ["stats-118"], acceptableDecks: ["statistics"], acceptableConcepts: ["AB|A/B|\u663e\u8457|P\u503c"] },

  { query: "EDA\u6570\u636e\u63a2\u7d22\u600e\u4e48\u505a", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-52"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["EDA|\u63cf\u8ff0|\u53ef\u89c6\u5316"] },

  { query: "SQL\u600e\u4e48\u4f18\u5316\u6162\u67e5\u8be2", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-180", "stats-183"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["SQL.*\u4f18\u5316|\u7d22\u5f15|\u6162\u67e5\u8be2"] },

  { query: "pandas\u5904\u7406\u5927\u6570\u636e\u5185\u5b58\u6ea2\u51fa", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-180", "stats-187"], secondaryIds: ["stats-153"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u5185\u5b58|\u6ea2\u51fa|\u5927\u6570\u636e"] },

  { query: "\u4e3a\u4ec0\u4e48\u6837\u672c\u65b9\u5dee\u5206\u6bcd\u662f n \u51cf 1", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-2"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["\u65b9\u5dee", "\u81ea\u7531\u5ea6"] },

  { query: "\u4ec0\u4e48\u65f6\u5019\u7528\u56fe\u6570\u636e\u5e93", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-3"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["\u56fe|Graph|Neo4j"] },

  { query: "\u4ec0\u4e48\u662f\u6307\u6807\u4f53\u7cfb\u5317\u6781\u661f", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-116", "stats-163"], secondaryIds: ["stats-164"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u5317\u6781\u661f|North Star|AARRR"] },

  { query: "\u600e\u4e48\u5224\u65ad\u4e24\u4e2a\u53d8\u91cf\u4e4b\u95f4\u6709\u6ca1\u6709\u5173\u7cfb", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-115", "stats-138"], secondaryIds: ["stats-140", "ml-1"], acceptableDecks: ["statistics", "machine-learning"], acceptableConcepts: ["\u76f8\u5173|\u56de\u5f52"] },

  { query: "\u600e\u4e48\u5224\u65ad\u4e24\u7ec4\u6570\u636e\u6709\u6ca1\u6709\u663e\u8457\u5dee\u5f02", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-26"], secondaryIds: ["stats-28"], acceptableDecks: ["statistics"], acceptableConcepts: ["t\u68c0\u9a8c", "\u5047\u8bbe\u68c0\u9a8c"] },

  { query: "\u600e\u4e48\u8bbe\u8ba1\u6570\u636e\u6307\u6807\u4f53\u7cfb", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-116", "stats-130"], secondaryIds: ["stats-159"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u6307\u6807|Metric|North Star"] },

  { query: "\u600e\u6837\u7528\u6570\u636e\u6765\u66f4\u65b0\u6211\u4eec\u7684\u4fe1\u5ff5", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-9"], secondaryIds: ["stats-39"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u8d1d\u53f6\u65af", "\u5148\u9a8c\u540e\u9a8c"] },

  { query: "\u6570\u636e\u548c\u76f4\u89c9\u4e0d\u4e00\u81f4\u542c\u8c01\u7684", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-134", "stats-154"], secondaryIds: ["stats-156"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u6570\u636e\u9a71\u52a8|\u51b3\u7b56"] },

  { query: "\u65f6\u95f4\u5e8f\u5217\u5b63\u8282\u6027\u600e\u4e48\u5904\u7406", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-86", "stats-88"], secondaryIds: ["stats-90"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u5b63\u8282|\u65f6\u95f4\u5e8f\u5217|ARIMA|Prophe"] },

  { query: "\u6837\u672c\u91cf\u8981\u591a\u5927\u624d\u7b97\u591f", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-118", "stats-119"], secondaryIds: ["stats-161"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u6837\u672c\u91cf|\u529f\u6548|Power"] },

  { query: "\u76f8\u5173\u548c\u56e0\u679c\u600e\u4e48\u533a\u5206", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-115", "stats-136"], secondaryIds: ["stats-140"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u56e0\u679c|\u76f8\u5173|\u6df7\u6dc6"] },

  { query: "\u7b2c\u4e00\u7c7b\u9519\u8bef\u548c\u7b2c\u4e8c\u7c7b\u9519\u8bef\u8c01\u66f4\u4e25\u91cd", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-120", "stats-134"], secondaryIds: ["stats-25"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u7b2c\u4e00\u7c7b|Type I|\u663e\u8457\u6027"] },

  { query: "\u9a6c\u5c14\u53ef\u592b\u94fe\u600e\u4e48\u6536\u655b", group: "\u6982\u5ff5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-103", "stats-109"], secondaryIds: ["stats-199"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u9a6c\u5c14\u53ef\u592b|Markov|MCMC"] },

  // ── 概念-职场 ──

  { query: "\u600e\u4e48\u62d2\u7edd\u4e0d\u5408\u7406\u7684\u9700\u6c42", group: "\u6982\u5ff5-\u804c\u573a", primaryIds: ["wp-1", "wp-20"], secondaryIds: ["wp-4"], acceptableDecks: ["workplace"], acceptableConcepts: ["\u62d2\u7edd|\u9700\u6c42|\u4e0d\u5408\u7406"] },

  { query: "\u600e\u4e48\u7ed9\u9886\u5bfc\u6c47\u62a5\u8fdb\u5ea6", group: "\u6982\u5ff5-\u804c\u573a", primaryIds: ["wp-3", "wp-7"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["\u6c47\u62a5|\u5ef6\u671f|\u8fdb\u5ea6"] },

  { query: "\u600e\u4e48\u8ddf\u9886\u5bfc\u6c47\u62a5\u5de5\u4f5c\u8fdb\u5c55", group: "\u6982\u5ff5-\u804c\u573a", primaryIds: ["wp-8"], secondaryIds: ["wp-3"], acceptableDecks: ["workplace"], acceptableConcepts: ["\u6c47\u62a5", "\u5411\u4e0a\u6c9f\u901a"] },

  { query: "\u600e\u4e48\u9762\u8bd5\u4e2d\u8c08\u85aa\u8d44", group: "\u6982\u5ff5-\u804c\u573a", primaryIds: ["wp-10", "wp-29"], secondaryIds: ["wp-49"], acceptableDecks: ["workplace"], acceptableConcepts: ["\u85aa\u8d44|\u6da8\u85aa|\u85aa\u916c"] },

  { query: "\u7a7a\u964d\u65b0\u56e2\u961f\u600e\u4e48\u5feb\u901f\u878d\u5165", group: "\u6982\u5ff5-\u804c\u573a", primaryIds: ["wp-21"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["\u65b0\u4eba|\u878d\u5165|\u5165\u804c"] },

  { query: "\u9762\u8bd5\u7684\u65f6\u5019\u600e\u4e48\u4ecb\u7ecd\u81ea\u5df1\u7684\u9879\u76ee\u7ecf\u5386\u6bd4\u8f83\u597d", group: "\u6982\u5ff5-\u804c\u573a", primaryIds: ["wp-7"], secondaryIds: [], acceptableDecks: ["workplace"], acceptableConcepts: ["\u9762\u8bd5", "\u9879\u76ee", "STAR"] },

  // ── 概念-黑话 ──

  { query: "\u4e92\u8054\u7f51\u516c\u53f8\u5e38\u8bf4\u7684\u5e95\u5c42\u80fd\u529b\u6307\u4ec0\u4e48", group: "\u6982\u5ff5-\u9ed1\u8bdd", primaryIds: ["jargon-5"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["\u5e95\u5c42\u903b\u8f91", "\u65b9\u6cd5\u8bba"] },

  { query: "\u9879\u76ee\u505a\u5b8c\u4e4b\u540e\u8981\u603b\u7ed3\u4e00\u4e0b\u7ecf\u9a8c", group: "\u6982\u5ff5-\u9ed1\u8bdd", primaryIds: ["jargon-6"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["\u590d\u76d8", "\u56de\u987e"] },

  // ── 混合-Agent ──

  { query: "Agent ReAct\u63a8\u7406\u6a21\u5f0f", group: "\u6df7\u5408-Agent", primaryIds: ["agent-1", "agent-6"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["ReAct|\u63a8\u7406|Planning"] },

  { query: "Chunking\u7b56\u7565Sentences\u8fd8\u662f\u56fa\u5b9a\u957f\u5ea6", group: "\u6df7\u5408-Agent", primaryIds: ["agent-23", "agent-8"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["\u5206\u5757|Chunk|Sliding"] },

  { query: "Hybrid Search \u6df7\u5408\u68c0\u7d22", group: "\u6df7\u5408-Agent", primaryIds: ["agent-26"], secondaryIds: ["agent-9"], acceptableDecks: ["agent"], acceptableConcepts: ["\u6df7\u5408\u68c0\u7d22", "Hybrid Search"] },

  { query: "RAG Retrieval\u68c0\u7d22\u6d41\u7a0b", group: "\u6df7\u5408-Agent", primaryIds: ["agent-10", "agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|\u68c0\u7d22.*\u7ba1\u9053"] },

  { query: "ReAct \u6846\u67b6 Reasoning Acting", group: "\u6df7\u5408-Agent", primaryIds: ["agent-1"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["ReAct", "\u63a8\u7406\u884c\u52a8"] },

  { query: "Reranker\u91cd\u6392\u5e8f\u6a21\u578b", group: "\u6df7\u5408-Agent", primaryIds: ["agent-25"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Rerank|Cross.*Encode"] },

  // ── 混合-VibeCoding ──

  { query: "CLAUDE.md \u548c AGENTS.md \u4f18\u5148\u7ea7", group: "\u6df7\u5408-VibeCoding", primaryIds: ["vc-6"], secondaryIds: [], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["CLAUDE.md", "AGENTS.md"] },

  { query: "MCP server client \u67b6\u6784", group: "\u6df7\u5408-VibeCoding", primaryIds: ["vc-5"], secondaryIds: ["vc-17"], acceptableDecks: ["vibe-coding"], acceptableConcepts: ["MCP", "server", "client"] },

  // ── 混合-力扣 ──

  { query: "DFS \u548c BFS \u904d\u5386\u4e8c\u53c9\u6811", group: "\u6df7\u5408-\u529b\u6263", primaryIds: ["lc-043"], secondaryIds: ["lc-040", "lc-041"], acceptableDecks: ["leetcode"], acceptableConcepts: ["DFS", "BFS", "\u4e8c\u53c9\u6811"] },

  { query: "LRU Cache \u5b9e\u73b0", group: "\u6df7\u5408-\u529b\u6263", primaryIds: ["lc-087"], secondaryIds: [], acceptableDecks: ["leetcode"], acceptableConcepts: ["LRU", "\u7f13\u5b58"] },

  // ── 混合-大模型 ──

  { query: "Attention\u673a\u5236\u7684Q K V\u5230\u5e95\u662f\u4ec0\u4e48", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-1", "llm-2"], secondaryIds: ["llm-26"], acceptableDecks: ["llm"], acceptableConcepts: ["Attention|Query.*Val"] },

  { query: "BERT fine-tuning\u600e\u4e48\u8c03\u53c2\u6570", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-10", "llm-12"], secondaryIds: ["llm-13"], acceptableDecks: ["llm"], acceptableConcepts: ["BERT|\u5fae\u8c03"] },

  { query: "CLIP\u591a\u6a21\u6001\u5bf9\u6bd4\u5b66\u4e60", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-4", "llm-8"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["CLIP|\u591a\u6a21\u6001|\u5bf9\u6bd4"] },

  { query: "FlashAttention GPU\u663e\u5b58\u4f18\u5316", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-40"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Flash.*Attention|\u663e\u5b58."] },

  { query: "KV Cache \u63a8\u7406\u52a0\u901f", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-21"], secondaryIds: ["llm-26"], acceptableDecks: ["llm"], acceptableConcepts: ["KV Cache", "\u63a8\u7406\u52a0\u901f"] },

  { query: "LoRA \u548c\u5168\u91cf finetune \u5bf9\u6bd4", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-12"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["LoRA", "\u5168\u53c2\u6570\u5fae\u8c03"] },

  { query: "LoRA\u5fae\u8c03\u548cFull Fine-tuning", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-12", "llm-13"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["LoRA|\u5fae\u8c03|Adapter"] },

  { query: "OOM\u6392\u67e5\u8c03batch size\u663e\u5b58", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-38", "llm-40"], secondaryIds: ["llm-47"], acceptableDecks: ["llm"], acceptableConcepts: ["OOM|\u663e\u5b58|Batch"] },

  { query: "Pipeline\u5e76\u884c Gradient Accumulation", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-48", "llm-7"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["\u5e76\u884c|Pipeline|\u68af\u5ea6.*\u7d2f\u79ef"] },

  { query: "Positonal Encoding\u548cRoPE\u533a\u522b", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-4"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["\u4f4d\u7f6e\u7f16\u7801|RoPE|Posit"] },

  { query: "Qwen\u6a21\u578bPrompt\u4f18\u5316", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-16", "llm-40"], secondaryIds: ["llm-46"], acceptableDecks: ["llm"], acceptableConcepts: ["Prompt|\u4f18\u5316"] },

  { query: "RLHF reward model \u8bad\u7ec3", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-14"], secondaryIds: ["llm-15"], acceptableDecks: ["llm"], acceptableConcepts: ["RLHF", "reward model"] },

  { query: "Self-Attention QKV \u8ba1\u7b97", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-1"], secondaryIds: ["llm-2", "llm-9"], acceptableDecks: ["llm"], acceptableConcepts: ["Self-Attention", "QKV"] },

  { query: "Speculative\u89e3\u7801\u6295\u673a\u63a8\u7406", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-25"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Speculat|\u63a8\u6d4b.*\u89e3\u7801|\u6295\u673a"] },

  { query: "Transformer Self-Attention\u673a\u5236", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-1", "llm-2"], secondaryIds: ["llm-38"], acceptableDecks: ["llm"], acceptableConcepts: ["Self.*Attention|Tran"] },

  { query: "vLLM PagedAttention\u52a0\u901f\u539f\u7406", group: "\u6df7\u5408-\u5927\u6a21\u578b", primaryIds: ["llm-26"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["vLLM|PagedAtt"] },

  // ── 混合-机器学习 ──

  { query: "AUC PR-AUC\u533a\u522b\u4ec0\u4e48\u60c5\u51b5\u7528\u54ea\u4e2a", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-109", "ml-126"], secondaryIds: ["ml-133"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["AUC|PR|ROC"] },

  { query: "Adam\u548cSGD\u9009\u54ea\u4e2a", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-58"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Adam|SGD|\u4f18\u5316\u5668"] },

  { query: "Cross Entropy\u4ea4\u53c9\u71b5Loss", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-142", "ml-143"], secondaryIds: ["ml-144"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u4ea4\u53c9\u71b5|Cross.*Entropy|L"] },

  { query: "Data Augmentation\u6570\u636e\u589e\u5f3a", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-180"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u6570\u636e.*\u589e\u5f3a|Augment"] },

  { query: "K-Means \u805a\u7c7b K \u503c\u9009\u62e9", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-21"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["KMeans", "\u8098\u90e8\u6cd5\u5219"] },

  { query: "KMeans\u7684K\u503c\u600e\u4e48\u9009Elbow", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-125", "ml-21"], secondaryIds: ["ml-24"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["K.*Means|Elbow|\u8f6e\u5ed3"] },

  { query: "Label Encoding ordinal", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-108", "ml-120"], secondaryIds: ["ml-121"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7f16\u7801|Label|\u7c7b\u522b"] },

  { query: "LightGBM\u548cXGBoost\u54ea\u4e2a\u597d", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-31", "ml-33"], secondaryIds: ["ml-34"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["LightGBM|XGBoost|GBD"] },

  { query: "One-hot Encoding\u6709\u4ec0\u4e48\u95ee\u9898", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-120", "ml-121"], secondaryIds: ["ml-14"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["One.*Hot|\u7f16\u7801|\u9ad8\u7ef4"] },

  { query: "PCA variance explained\u8ba1\u7b97", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-141", "ml-22"], secondaryIds: ["ml-26"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["PCA|\u65b9\u5dee.*\u89e3\u91ca|SVD"] },

  { query: "PCA \u964d\u7ef4\u539f\u7406", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-22"], secondaryIds: ["ml-26", "ml-48"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["PCA", "\u964d\u7ef4"] },

  { query: "Precision Recall F1\u600e\u4e48\u7b97", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-184", "ml-49"], secondaryIds: ["ml-88"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Precision|Recall|F1"] },

  { query: "ROC AUC \u600e\u4e48\u7406\u89e3", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-50"], secondaryIds: ["ml-56"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["ROC", "AUC"] },

  { query: "ROC AUC\u66f2\u7ebf\u89e3\u91ca", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-109", "ml-126"], secondaryIds: ["ml-133"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["ROC|AUC|PR"] },

  { query: "Random Forest\u8fc7\u62df\u5408\u600e\u4e48\u529e", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-18", "ml-31"], secondaryIds: ["ml-38"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u968f\u673a\u68ee\u6797|\u8fc7\u62df\u5408|n_estim"] },

  { query: "SVM Kernel\u6838\u51fd\u6570\u9009\u62e9", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-19", "ml-2"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM|\u6838\u51fd\u6570|Kernel"] },

  { query: "SVM kernel \u9009\u62e9", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-2"], secondaryIds: ["ml-19"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM", "kernel"] },

  { query: "Self-Supervised\u81ea\u76d1\u7763\u5b66\u4e60", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-118", "ml-119"], secondaryIds: ["ml-122"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u81ea\u76d1\u7763|\u5bf9\u6bd4|SimCLR"] },

  { query: "XGBoost \u548c LightGBM \u5bf9\u6bd4", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-33", "ml-34"], secondaryIds: ["ml-31"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["XGBoost", "LightGBM", "GBDT"] },

  { query: "XGBoost\u8c03\u53c2\u6280\u5de7", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-31", "ml-33"], secondaryIds: ["ml-37"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["XGBoost|\u8c03\u53c2|Hyperpar"] },

  { query: "t-SNE vs PCA \u53ef\u89c6\u5316", group: "\u6df7\u5408-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-26"], secondaryIds: ["ml-22"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["t-SNE", "PCA"] },

  // ── 混合-深度学习 ──

  { query: "Adam \u548c SGD \u9009\u54ea\u4e2a", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-30"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Adam", "SGD", "\u4f18\u5316\u5668"] },

  { query: "Batch Normalization\u516c\u5f0f", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-21", "dl-22"], secondaryIds: ["dl-3"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Batch.*Norm|\u5f52\u4e00\u5316"] },

  { query: "BatchNorm vs LayerNorm", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-3"], secondaryIds: ["dl-22"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["BatchNorm", "LayerNorm"] },

  { query: "Diffusion Model \u524d\u5411\u52a0\u566a\u8fc7\u7a0b", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-15"], secondaryIds: ["dl-27"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["\u6269\u6563\u6a21\u578b", "Diffusion"] },

  { query: "GAN Discriminator\u751f\u6210\u5668\u5224\u522b\u5668", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-11", "dl-12"], secondaryIds: ["dl-14"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN|\u751f\u6210.*\u5bf9\u6297"] },

  { query: "GAN mode collapse \u600e\u4e48\u89e3\u51b3", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-12"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GAN", "\u6a21\u5f0f\u574d\u584c"] },

  { query: "GELU\u6fc0\u6d3b\u51fd\u6570\u516c\u5f0f\u63a8\u5bfc", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-1", "dl-24"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GELU|\u6fc0\u6d3b|Swish|ReLU"] },

  { query: "LSTM GRU\u533a\u522b\u548c\u9009\u62e9", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-24", "dl-7"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["LSTM|GRU|RNN"] },

  { query: "Layer Normalization\u4f4d\u7f6e\u5e94\u7528", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-22", "dl-3"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["Layer.*Norm|Batch.*N"] },

  { query: "ReLU LeakyReLU\u533a\u522b", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-1", "dl-24"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["ReLU|Leaky|\u6fc0\u6d3b"] },

  { query: "ResNet\u6b8b\u5dee\u7f51\u7edcSkip Connection", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-8"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["ResNet|\u6b8b\u5dee|Skip"] },

  { query: "Sigmoid \u548c Softmax \u533a\u522b", group: "\u6df7\u5408-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-31"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["sigmoid", "softmax"] },

  // ── 混合-统计学 ──

  { query: "Bootstrap \u548c Permutation Test", group: "\u6df7\u5408-\u7edf\u8ba1\u5b66", primaryIds: ["stats-37"], secondaryIds: ["stats-38"], acceptableDecks: ["statistics"], acceptableConcepts: ["Bootstrap", "\u7f6e\u6362\u68c0\u9a8c"] },

  { query: "MCMC \u91c7\u6837\u539f\u7406", group: "\u6df7\u5408-\u7edf\u8ba1\u5b66", primaryIds: ["stats-43"], secondaryIds: ["stats-44"], acceptableDecks: ["statistics"], acceptableConcepts: ["MCMC", "\u91c7\u6837"] },

  { query: "Window Function\u7a97\u53e3\u51fd\u6570SQL", group: "\u6df7\u5408-\u7edf\u8ba1\u5b66", primaryIds: ["stats-178", "stats-179"], secondaryIds: ["stats-180"], acceptableDecks: ["statistics"], acceptableConcepts: ["Window|\u7a97\u53e3|SQL"] },

  { query: "p-value \u7684\u8bef\u89e3", group: "\u6df7\u5408-\u7edf\u8ba1\u5b66", primaryIds: ["stats-24"], secondaryIds: ["stats-25"], acceptableDecks: ["statistics"], acceptableConcepts: ["p\u503c", "\u663e\u8457\u6027"] },

  // ── 混合-黑话 ──

  { query: "OKR \u548c KPI \u7684\u533a\u522b", group: "\u6df7\u5408-\u9ed1\u8bdd", primaryIds: ["jargon-35"], secondaryIds: [], acceptableDecks: ["jargon"], acceptableConcepts: ["OKR", "KPI", "\u7ee9\u6548"] },

  // ── 英文-Agent ──

  { query: "how to evaluate retrieval augmented generation", group: "\u82f1\u6587-Agent", primaryIds: ["agent-22", "agent-15"], secondaryIds: ["agent-7"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG", "evaluation"] },

  // ── 英文-力扣 ──

  { query: "binary tree traversal preorder inorder postorder", group: "\u82f1\u6587-\u529b\u6263", primaryIds: ["lc-043", "lc-040"], secondaryIds: ["lc-041"], acceptableDecks: ["leetcode"], acceptableConcepts: ["binary tree", "traversal", "DFS"] },

  // ── 英文-大模型 ──

  { query: "self attention mechanism transformer", group: "\u82f1\u6587-\u5927\u6a21\u578b", primaryIds: ["llm-1", "llm-3"], secondaryIds: ["llm-9"], acceptableDecks: ["llm"], acceptableConcepts: ["self-attention", "Transformer"] },

  // ── 英文-机器学习 ──

  { query: "gradient descent optimization", group: "\u82f1\u6587-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-11", "ml-57"], secondaryIds: ["ml-58"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["gradient descent", "SGD", "optimization"] },

  { query: "overfitting vs underfitting deep learning", group: "\u82f1\u6587-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-7"], secondaryIds: ["ml-8", "dl-4"], acceptableDecks: ["machine-learning", "deep-learning"], acceptableConcepts: ["overfitting", "underfitting"] },

  // ── 跨模块-Agent ──

  { query: "RAG\u548cFine-tuning\u4ec0\u4e48\u65f6\u5019\u7528\u54ea\u4e2a", group: "\u8de8\u6a21\u5757-Agent", primaryIds: ["agent-10", "agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|\u5fae\u8c03|\u5bf9\u6bd4"] },

  { query: "ReAct\u548cPlan-and-Execute\u533a\u522b", group: "\u8de8\u6a21\u5757-Agent", primaryIds: ["agent-1", "agent-6"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["ReAct|Planning|Plan."] },

  { query: "Vibe Coding\u548cAgent\u5f00\u53d1\u533a\u522b", group: "\u8de8\u6a21\u5757-Agent", primaryIds: ["agent-21", "agent-3"], secondaryIds: ["agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["Vibe|Agent|Coding|\u7f16\u7a0b"] },

  { query: "\u51fd\u6570\u8c03\u7528\u548cDSL\u5de5\u5177\u9009\u62e9", group: "\u8de8\u6a21\u5757-Agent", primaryIds: ["agent-2", "agent-3"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["Function Calling|DSL"] },

  { query: "\u7ed3\u6784\u5316\u8f93\u51faJSON Mode\u5bf9\u6bd4", group: "\u8de8\u6a21\u5757-Agent", primaryIds: ["agent-2"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["JSON.*Mode|Structure"] },

  // ── 跨模块-ML ──

  { query: "AUC\u548cF1\u8861\u91cf\u6307\u6807\u7684\u533a\u522b", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-109", "ml-126"], secondaryIds: ["ml-133"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["AUC|F1|PR|ROC"] },

  { query: "Bagging\u548cBoosting\u6838\u5fc3\u5dee\u5f02", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-189", "ml-32"], secondaryIds: ["ml-36"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Bagging|Boosting|\u96c6\u6210"] },

  { query: "GBDT\u548c\u968f\u673a\u68ee\u6797\u672c\u8d28\u533a\u522b", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-126", "ml-17"], secondaryIds: ["ml-18"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["GBDT|\u968f\u673a\u68ee\u6797|\u51b3\u7b56"] },

  { query: "KMeans\u548cDBSCAN\u9009\u62e9", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-123", "ml-124"], secondaryIds: ["ml-125"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["DBSCAN|K.*Means|\u805a\u7c7b"] },

  { query: "L1 L2 Dropout \u6b63\u5219\u5316\u9009\u54ea\u4e2a", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-10"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["L1.*L2|Dropout|\u6b63\u5219\u5316"] },

  { query: "MSE\u548cMAE\u635f\u5931\u51fd\u6570\u5bf9\u6bd4", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-121", "ml-122"], secondaryIds: ["ml-144"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["MSE|MAE|L1.*Loss|L2."] },

  { query: "Mini Batch vs Full Batch\u8bad\u7ec3", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-1", "ml-11"], secondaryIds: ["ml-115"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Batch|SGD|\u68af\u5ea6"] },

  { query: "One-Hot\u548cTarget Encoding", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-120", "ml-121"], secondaryIds: ["ml-129"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["One.*Hot|Target|\u7f16\u7801"] },

  { query: "Precision vs Recall\u4e1a\u52a1\u53d6\u820d", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-49", "ml-88"], secondaryIds: ["ml-90"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Precision|Recall|\u4e1a\u52a1"] },

  { query: "SGD vs AdamW\u4ec0\u4e48\u65f6\u5019\u7528", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-58"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SGD|Adam|\u4f18\u5316\u5668"] },

  { query: "SVM\u548c\u903b\u8f91\u56de\u5f52\u8c01\u66f4\u597d", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-1", "ml-19"], secondaryIds: ["ml-2"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM|\u903b\u8f91\u56de\u5f52"] },

  { query: "\u56de\u5f52\u4efb\u52a1\u548c\u5206\u7c7b\u4efb\u52a1Loss", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-1", "ml-155"], secondaryIds: ["ml-185"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u56de\u5f52|\u5206\u7c7b|MSE|\u4ea4\u53c9\u71b5"] },

  { query: "\u591a\u4efb\u52a1\u5b66\u4e60vs\u5355\u4efb\u52a1\u8bad\u7ec3", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-150"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u591a\u4efb\u52a1|Multi.*task|\u5171\u4eab"] },

  { query: "\u67b6\u6784\u548c\u6570\u636e\u54ea\u4e2a\u66f4\u91cd\u8981", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-104", "ml-110"], secondaryIds: ["ml-135"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u6570\u636e.*\u6a21\u578b|Data-centric|"] },

  { query: "\u68af\u5ea6\u4e0b\u964d\u548c\u725b\u987f\u6cd5\u4f18\u5316\u5bf9\u6bd4", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-11", "ml-57"], secondaryIds: ["ml-58"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u68af\u5ea6\u4e0b\u964d|\u725b\u987f\u6cd5|\u4e8c\u9636"] },

  { query: "\u767d\u76d2\u6a21\u578b\u548c\u9ed1\u76d2\u6a21\u578b\u53ef\u89e3\u91ca", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-137", "ml-181"], secondaryIds: ["ml-73"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u53ef\u89e3\u91ca|SHAP|\u9ed1\u76d2|\u767d\u76d2"] },

  { query: "\u79bb\u7ebf\u5f3a\u5316\u5b66\u4e60\u548c\u5728\u7ebf\u5f3a\u5316\u5b66\u4e60", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-113", "ml-153"], secondaryIds: ["ml-163"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u5728\u7ebf|\u79bb\u7ebf|RL|Batch.*RL"] },

  { query: "\u79bb\u7ebf\u8bc4\u4f30\u548c\u5728\u7ebf\u5b9e\u9a8c\u7684\u5dee\u5f02", group: "\u8de8\u6a21\u5757-ML", primaryIds: ["ml-108", "ml-137"], secondaryIds: ["ml-153"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u79bb\u7ebf.*\u8bc4\u4f30|\u5728\u7ebf.*\u5b9e\u9a8c|AB"] },

  // ── 跨模块-大模型 ──

  { query: "BERT\u548cGPT\u8bad\u7ec3\u76ee\u6807\u4e0d\u540c", group: "\u8de8\u6a21\u5757-\u5927\u6a21\u578b", primaryIds: ["llm-10"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["BERT.*GPT|\u81ea\u7f16\u7801|\u81ea\u56de\u5f52"] },

  { query: "GPT\u548cClaude\u6587\u98ce\u5dee\u5f02", group: "\u8de8\u6a21\u5757-\u5927\u6a21\u578b", primaryIds: ["llm-10", "llm-11"], secondaryIds: ["llm-24"], acceptableDecks: ["llm"], acceptableConcepts: ["GPT|Claude|\u5bf9\u9f50|\u98ce\u683c"] },

  { query: "ONNX TensorRT\u54ea\u4e2a\u5feb", group: "\u8de8\u6a21\u5757-\u5927\u6a21\u578b", primaryIds: ["llm-21", "llm-26"], secondaryIds: ["llm-25"], acceptableDecks: ["llm"], acceptableConcepts: ["ONNX|TensorRT|\u63a8\u7406"] },

  { query: "Prompt\u5de5\u7a0b\u548cFine-tuning\u9009\u54ea\u4e2a", group: "\u8de8\u6a21\u5757-\u5927\u6a21\u578b", primaryIds: ["llm-12", "llm-13"], secondaryIds: ["llm-16"], acceptableDecks: ["llm"], acceptableConcepts: ["Prompt|\u5fae\u8c03|ICL"] },

  { query: "Seq2Seq\u548cTransformer\u67b6\u6784\u5bf9\u6bd4", group: "\u8de8\u6a21\u5757-\u5927\u6a21\u578b", primaryIds: ["llm-38", "llm-4"], secondaryIds: ["llm-5"], acceptableDecks: ["llm"], acceptableConcepts: ["Seq2Seq|Transformer|"] },

  { query: "TPU\u548cGPU\u8bad\u7ec3\u4f18\u52bf\u52a3\u52bf", group: "\u8de8\u6a21\u5757-\u5927\u6a21\u578b", primaryIds: ["llm-11", "llm-40"], secondaryIds: ["llm-48"], acceptableDecks: ["llm"], acceptableConcepts: ["TPU|GPU|\u786c\u4ef6|\u8bad\u7ec3"] },

  { query: "\u5fae\u8c03LoRA\u548c\u5168\u91cf\u5fae\u8c03\u7684\u533a\u522b", group: "\u8de8\u6a21\u5757-\u5927\u6a21\u578b", primaryIds: ["llm-12", "llm-13"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["LoRA|\u5168\u91cf|\u5fae\u8c03"] },

  { query: "\u81ea\u7f16\u7801\u6a21\u578b\u548c\u81ea\u56de\u5f52\u6a21\u578b\u533a\u522b", group: "\u8de8\u6a21\u5757-\u5927\u6a21\u578b", primaryIds: ["llm-10", "llm-24"], secondaryIds: ["llm-39"], acceptableDecks: ["llm"], acceptableConcepts: ["\u81ea\u7f16\u7801|\u81ea\u56de\u5f52|BERT|GPT"] },

  { query: "\u8d2a\u5fc3\u641c\u7d22\u548c\u675f\u641c\u7d22\u5bf9\u6bd4", group: "\u8de8\u6a21\u5757-\u5927\u6a21\u578b", primaryIds: ["llm-22", "llm-25"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["\u8d2a\u5fc3|Beam|\u89e3\u7801"] },

  { query: "\u9884\u8bad\u7ec3\u548c\u5fae\u8c03\u6a21\u578b\u7684\u5dee\u5f02", group: "\u8de8\u6a21\u5757-\u5927\u6a21\u578b", primaryIds: ["llm-11", "llm-12"], secondaryIds: ["llm-13"], acceptableDecks: ["llm"], acceptableConcepts: ["\u9884\u8bad\u7ec3|\u5fae\u8c03|Pretrain"] },

  // ── 跨模块-深度vs大模型 ──

  { query: "BatchNorm\u548cLayerNorm\u4ec0\u4e48\u65f6\u5019\u7528\u54ea\u4e2a", group: "\u8de8\u6a21\u5757-\u6df1\u5ea6vs\u5927\u6a21\u578b", primaryIds: ["dl-21", "dl-22"], secondaryIds: ["dl-3", "llm-38"], acceptableDecks: ["deep-learning", "llm"], acceptableConcepts: ["Batch.*Norm|Layer.*N"] },

  { query: "RNN\u548cTransformer\u5927\u4e0d\u540c", group: "\u8de8\u6a21\u5757-\u6df1\u5ea6vs\u5927\u6a21\u578b", primaryIds: ["dl-24", "dl-7"], secondaryIds: ["dl-9", "llm-38"], acceptableDecks: ["deep-learning", "llm"], acceptableConcepts: ["RNN|LSTM|Transformer"] },

  // ── 跨模块-深度学习 ──

  { query: "ReLU Sigmoid\u4e2d\u95f4\u72b6\u6001\u63a8\u5bfc", group: "\u8de8\u6a21\u5757-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-1", "dl-24"], secondaryIds: ["dl-31"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["ReLU|Sigmoid|Tanh|\u6fc0\u6d3b"] },

  // ── 跨模块-统计 ──

  { query: "ETL ELT\u6570\u636e\u96c6\u6210\u533a\u522b", group: "\u8de8\u6a21\u5757-\u7edf\u8ba1", primaryIds: ["stats-116", "stats-125"], secondaryIds: ["stats-185"], acceptableDecks: ["statistics"], acceptableConcepts: ["ETL|ELT|\u6570\u636e.*\u4ed3\u5e93"] },

  { query: "KL\u6563\u5ea6\u548cJS\u6563\u5ea6\u5bf9\u6bd4", group: "\u8de8\u6a21\u5757-\u7edf\u8ba1", primaryIds: ["stats-194"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["KL.*\u6563\u5ea6|JS|\u76f8\u5bf9\u71b5"] },

  { query: "SQL\u548cNoSQL\u6570\u636e\u5e93\u9009\u578b", group: "\u8de8\u6a21\u5757-\u7edf\u8ba1", primaryIds: ["stats-178", "stats-180"], secondaryIds: ["stats-182"], acceptableDecks: ["statistics"], acceptableConcepts: ["SQL|NoSQL|\u5173\u7cfb\u578b"] },

  { query: "Streaming\u548cBatch\u6570\u636e\u5904\u7406", group: "\u8de8\u6a21\u5757-\u7edf\u8ba1", primaryIds: ["stats-150", "stats-187"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["\u6d41\u5f0f|\u6279\u5904\u7406|Kafka|Spark"] },

  { query: "\u5982\u4f55\u8bbe\u8ba1\u4e00\u4e2a\u5b9e\u9a8c\u8bc4\u4f30", group: "\u8de8\u6a21\u5757-\u7edf\u8ba1", primaryIds: ["stats-102", "stats-116"], secondaryIds: ["stats-118"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u5b9e\u9a8c|AB|\u968f\u673a"] },

  { query: "\u6700\u5927\u4f3c\u7136\u548c\u6700\u5927\u540e\u9a8c\u533a\u522b", group: "\u8de8\u6a21\u5757-\u7edf\u8ba1", primaryIds: ["stats-111", "stats-195"], secondaryIds: ["stats-39"], acceptableDecks: ["statistics"], acceptableConcepts: ["MLE|MAP|\u4f3c\u7136|\u540e\u9a8c"] },

  // ── 长句-Agent ──

  { query: "Agent \u5f00\u53d1\u91cc\u9762 ReAct \u6a21\u5f0f\u548c Function Calling \u5230\u5e95\u6709\u4ec0\u4e48\u533a\u522b\uff0c\u4ec0\u4e48\u65f6\u5019\u7528\u54ea\u4e2a", group: "\u957f\u53e5-Agent", primaryIds: ["agent-2"], secondaryIds: ["agent-3", "agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["ReAct", "Function Calling", "Tool Use"] },

  { query: "AutoGPT\u600e\u4e48\u81ea\u5df1\u89c4\u5212\u6267\u884c\u4efb\u52a1", group: "\u957f\u53e5-Agent", primaryIds: ["agent-21", "agent-3"], secondaryIds: ["agent-4"], acceptableDecks: ["agent"], acceptableConcepts: ["AutoGPT|Planning|Age"] },

  { query: "HNSW\u7d22\u5f15\u5411\u91cf\u6570\u636e\u5e93", group: "\u957f\u53e5-Agent", primaryIds: ["agent-10", "agent-12"], secondaryIds: ["agent-15"], acceptableDecks: ["agent"], acceptableConcepts: ["\u5411\u91cf.*\u6570\u636e\u5e93|HNSW|ANN|\u68c0\u7d22"] },

  { query: "JSON Mode\u548cFunction Calling\u533a\u522b", group: "\u957f\u53e5-Agent", primaryIds: ["agent-2"], secondaryIds: [], acceptableDecks: ["agent"], acceptableConcepts: ["JSON.*Mode|Function "] },

  { query: "LangChain\u548cLlamaIndex\u5bf9\u6bd4", group: "\u957f\u53e5-Agent", primaryIds: ["agent-10", "agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["LangChain|LlamaIndex"] },

  { query: "RAG\u68c0\u7d22\u548c\u751f\u6210\u600e\u4e48\u7ed3\u5408\u7684", group: "\u957f\u53e5-Agent", primaryIds: ["agent-10", "agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|\u68c0\u7d22|\u751f\u6210|Pipeline"] },

  { query: "\u6211\u4eec\u60f3\u5728\u516c\u53f8\u5185\u90e8\u642d\u5efa\u4e00\u4e2a\u57fa\u4e8e RAG \u7684\u77e5\u8bc6\u5e93\u95ee\u7b54\u7cfb\u7edf\uff0c\u4ece\u6280\u672f\u9009\u578b\u5230\u843d\u5730\u6709\u4ec0\u4e48\u9700\u8981\u6ce8\u610f\u7684\u5730\u65b9", group: "\u957f\u53e5-Agent", primaryIds: ["agent-7"], secondaryIds: ["agent-15", "agent-18", "agent-22"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG", "\u68c0\u7d22\u589e\u5f3a\u751f\u6210", "\u77e5\u8bc6\u5e93"] },

  { query: "\u667a\u80fd\u5ba2\u670d\u610f\u56fe\u8bc6\u522b\u600e\u4e48\u505a", group: "\u957f\u53e5-Agent", primaryIds: ["agent-10", "agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|\u5206\u7c7b|\u610f\u56fe"] },

  { query: "\u7528AI\u56de\u590d\u5ba2\u6237\u90ae\u4ef6\u9690\u79c1\u600e\u4e48\u4fdd\u8bc1", group: "\u957f\u53e5-Agent", primaryIds: ["agent-10", "agent-11"], secondaryIds: ["agent-12"], acceptableDecks: ["agent"], acceptableConcepts: ["RAG|\u5b89\u5168|\u5e7b\u89c9"] },

  // ── 长句-力扣 ──

  { query: "\u529b\u6263\u91cc\u9762\u4e8c\u53c9\u6811\u76f8\u5173\u7684\u9898\u76ee\u6211\u505a\u5f97\u4e0d\u592a\u597d\uff0c\u5c24\u5176\u662f\u9012\u5f52\u904d\u5386\u8001\u662f\u5199\u9519\uff0c\u6709\u54ea\u4e9b\u7ecf\u5178\u9898\u53ef\u4ee5\u7ec3\u624b", group: "\u957f\u53e5-\u529b\u6263", primaryIds: ["lc-043"], secondaryIds: ["lc-040", "lc-041", "lc-039"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u4e8c\u53c9\u6811", "\u904d\u5386", "\u9012\u5f52"] },

  { query: "\u6700\u8fd1\u5728\u5237\u6570\u7ec4\u76f8\u5173\u7684\u9898\uff0c\u54c8\u5e0c\u8868\u548c\u53cc\u6307\u9488\u8fd9\u4e24\u7c7b\u7ecf\u5e38\u641e\u6df7\uff0c\u4ec0\u4e48\u65f6\u5019\u7528\u54c8\u5e0c\u4ec0\u4e48\u65f6\u5019\u7528\u53cc\u6307\u9488", group: "\u957f\u53e5-\u529b\u6263", primaryIds: ["lc-001"], secondaryIds: ["lc-002", "lc-005"], acceptableDecks: ["leetcode"], acceptableConcepts: ["\u54c8\u5e0c\u8868", "\u53cc\u6307\u9488", "\u6570\u7ec4"] },

  // ── 长句-大模型 ──

  { query: "8G\u663e\u5b58\u90e8\u7f72\u5927\u6a21\u578b\u6709\u4ec0\u4e48\u8f7b\u91cf\u5316\u65b9\u6848", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-24", "llm-40"], secondaryIds: ["llm-42"], acceptableDecks: ["llm"], acceptableConcepts: ["\u91cf\u5316|\u538b\u7f29|\u90e8\u7f72|\u663e\u5b58"] },

  { query: "Chain-of-Thought\u5728GPT4\u4e2d", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-21", "llm-17"], secondaryIds: ["llm-25"], acceptableDecks: ["llm"], acceptableConcepts: ["COT|\u601d\u7ef4\u94fe|\u63a8\u7406"] },

  { query: "Flash Attention\u600e\u4e48\u52a0\u901f", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-21", "llm-25"], secondaryIds: ["llm-40"], acceptableDecks: ["llm"], acceptableConcepts: ["Flash.*Attention|\u52a0\u901f|"] },

  { query: "OOM\u663e\u5b58\u4e0d\u8db3\u600e\u4e48\u6392\u67e5", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-40", "llm-47"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["OOM|\u663e\u5b58|\u5185\u5b58.*\u4e0d\u8db3"] },

  { query: "PEFT\u65b9\u6cd5LoRA Adapter\u5bf9\u6bd4", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-12", "llm-13"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["LoRA|Adapter|PEFT|\u5fae\u8c03"] },

  { query: "RoPE\u548c\u5176\u4ed6\u4f4d\u7f6e\u7f16\u7801\u51b2\u7a81\u5417", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-4"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["RoPE|\u4f4d\u7f6e\u7f16\u7801|ALiBi"] },

  { query: "Speculative Decoding\u63a8\u7406\u52a0\u901f", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-21", "llm-25"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Speculative|\u63a8\u6d4b.*\u89e3\u7801|\u63a8"] },

  { query: "TPU\u548cGPU\u8bad\u7ec3\u67b6\u6784\u5dee\u5f02", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-11", "llm-40"], secondaryIds: ["llm-48"], acceptableDecks: ["llm"], acceptableConcepts: ["TPU|GPU|\u8bad\u7ec3|\u5e76\u884c"] },

  { query: "Transformer\u4e3a\u4ec0\u4e48\u9664\u4ee5\u6839\u53f7dk", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-2"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["\u7f29\u653e|\u221a|\u65b9\u5dee|\u70b9\u79ef"] },

  { query: "few-shot\u4e3a\u4ec0\u4e48\u7ed9\u4f8b\u5b50\u5c31\u80fd\u5b66", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-16", "llm-46"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["Few.*shot|Prompt|\u4e0a\u4e0b\u6587"] },

  { query: "vLLM PageAttention\u6279\u5904\u7406", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-26"], secondaryIds: [], acceptableDecks: ["llm"], acceptableConcepts: ["vLLM|PagedAttention|"] },

  { query: "\u5927\u6a21\u578b\u8bba\u6587\u770b\u4e0d\u8fc7\u6765\u6709\u4ec0\u4e48\u5fc5\u8bfb", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-10", "llm-24"], secondaryIds: ["llm-42"], acceptableDecks: ["llm"], acceptableConcepts: ["Transformer.*\u67b6\u6784|GPT."] },

  { query: "\u5fae\u8c03\u5e94\u8be5\u51bb\u7ed3\u54ea\u4e9b\u5c42", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-12", "llm-13"], secondaryIds: ["llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["\u5fae\u8c03|LoRA|\u51bb\u7ed3|Adapter"] },

  { query: "\u60f3\u4e86\u89e3\u4e00\u4e0b\u73b0\u5728\u4e3b\u6d41\u7684 prompt engineering \u6280\u5de7\u6709\u54ea\u4e9b\uff0c\u6709\u6ca1\u6709\u4ec0\u4e48\u5957\u8def\u53ef\u4ee5\u53c2\u8003", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-14"], secondaryIds: ["llm-13"], acceptableDecks: ["llm"], acceptableConcepts: ["Prompt", "CoT", "Few-shot"] },

  { query: "\u6211\u4eec\u56e2\u961f\u60f3\u628a\u4e00\u4e2a\u5927\u6a21\u578b\u90e8\u7f72\u5230\u751f\u4ea7\u73af\u5883\uff0c\u4f46\u662f\u63a8\u7406\u901f\u5ea6\u592a\u6162\u4e86\uff0c\u6709\u6ca1\u6709\u4ec0\u4e48\u52a0\u901f\u7684\u65b9\u6848\u53ef\u4ee5\u63a8\u8350\u4e00\u4e0b", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-15"], secondaryIds: ["llm-16", "llm-17"], acceptableDecks: ["llm"], acceptableConcepts: ["\u63a8\u7406\u52a0\u901f", "\u91cf\u5316", "KV Cache"] },

  { query: "\u6570\u636e\u5e76\u884c\u6a21\u578b\u5e76\u884c\u6d41\u6c34\u7ebf\u5e76\u884c", group: "\u957f\u53e5-\u5927\u6a21\u578b", primaryIds: ["llm-47", "llm-48"], secondaryIds: ["llm-7"], acceptableDecks: ["llm"], acceptableConcepts: ["\u5e76\u884c|ZeRO|\u5206\u5e03\u5f0f"] },

  // ── 长句-学习路径 ──

  { query: "\u6539\u7b80\u5386\u51c6\u5907\u5927\u5382\u6280\u672f\u9762", group: "\u957f\u53e5-\u5b66\u4e60\u8def\u5f84", primaryIds: ["ml-134", "ml-136"], secondaryIds: ["ml-189"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u9762\u8bd5|\u7b80\u5386|\u673a\u5668\u5b66\u4e60"] },

  { query: "\u673a\u5668\u5b66\u4e60\u9762\u8bd5\u8bb0\u4e86\u53c8\u5fd8\u600e\u4e48\u529e", group: "\u957f\u53e5-\u5b66\u4e60\u8def\u5f84", primaryIds: ["ml-110", "ml-112"], secondaryIds: ["ml-119"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u9762\u8bd5|\u590d\u4e60|\u6838\u5fc3"] },

  { query: "\u7279\u5f81\u5de5\u7a0b\u96f6\u6563\u600e\u4e48\u7cfb\u7edf\u5b66", group: "\u957f\u53e5-\u5b66\u4e60\u8def\u5f84", primaryIds: ["ml-138", "ml-141"], secondaryIds: ["ml-41"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u7279\u5f81.*\u5de5\u7a0b|\u7279\u5f81.*\u9009\u62e9|\u964d\u7ef4"] },

  // ── 长句-机器学习 ──

  { query: "Batch Size\u5bf9\u6536\u655b\u6709\u4ec0\u4e48\u5f71\u54cd", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-58"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Batch.*Size|SGD|\u6536\u655b"] },

  { query: "Contrastive Learning InfoNCE\u63a8\u5bfc", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-119", "ml-122"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u5bf9\u6bd4.*\u5b66\u4e60|InfoNCE|SimCL"] },

  { query: "DBSCAN\u548cKMeans\u5bf9\u6bd4", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-123", "ml-124"], secondaryIds: ["ml-125"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["DBSCAN|K.*Means|\u805a\u7c7b"] },

  { query: "Early Stopping\u9632\u8fc7\u62df\u5408\u539f\u7406", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-7", "ml-77"], secondaryIds: ["ml-78"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Early.*Stop|\u65e9\u505c|\u8fc7\u62df\u5408"] },

  { query: "Imbalanced Dataset\u91c7\u6837\u7b56\u7565", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-105", "ml-135"], secondaryIds: ["ml-143"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u4e0d\u5e73\u8861|SMOTE|\u91c7\u6837"] },

  { query: "MLflow\u548cWandB\u600e\u4e48\u7ba1\u7406\u5b9e\u9a8c", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-162"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["MLflow|\u5b9e\u9a8c.*\u7ba1\u7406|\u6a21\u578b.*\u7248\u672c"] },

  { query: "Momentum\u4e3a\u4ec0\u4e48\u80fd\u52a0\u901f\u6536\u655b", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-120", "ml-58"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u52a8\u91cf|SGD|\u4f18\u5316\u5668|Adam"] },

  { query: "Precision Recall trade-off\u53ef\u89c6\u5316", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-49", "ml-50"], secondaryIds: ["ml-56"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Precision.*Recall|PR"] },

  { query: "WOE\u7f16\u7801\u548cOneHot\u533a\u522b", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-14", "ml-42"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["WOE|One.*Hot|\u7279\u5f81.*\u7f16\u7801"] },

  { query: "Weight Decay\u548cL2\u7b49\u4ef7\u5417", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-10"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["Weight.*Decay|L1.*L2"] },

  { query: "XGBoost\u8c03\u53c2\u4e0d\u5982\u9ed8\u8ba4\u503c\u600e\u4e48\u529e", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-31", "ml-33"], secondaryIds: ["ml-34"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["XGBoost|LightGBM|\u8c03\u53c2"] },

  { query: "\u4f20\u7edfML\u8fd8\u6709\u6ca1\u6709\u5fc5\u8981\u5b66", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-18", "ml-19"], secondaryIds: ["ml-2"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM|\u968f\u673a\u68ee\u6797|\u5927\u6a21\u578b.*\u5bf9\u6bd4"] },

  { query: "\u51e0\u5341\u4e07\u6761\u6570\u636e\u51b7\u542f\u52a8\u63a8\u8350\u7cfb\u7edf\u600e\u4e48\u505a", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-103", "ml-117"], secondaryIds: ["ml-133"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u51b7\u542f\u52a8|\u77e9\u9635\u5206\u89e3|\u63a8\u8350"] },

  { query: "\u566a\u58f0\u6807\u7b7e\u600e\u4e48\u8bad\u7ec3\u6a21\u578b", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-144"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u566a\u58f0.*\u6807\u7b7e|\u9c81\u68d2|\u6e05\u6d17"] },

  { query: "\u5728\u7ebf\u63a8\u7406\u79bb\u7ebf\u6279\u5904\u7406\u67b6\u6784\u533a\u522b", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-104", "ml-110"], secondaryIds: ["ml-160"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u63a8\u7406|\u6279\u5904\u7406|\u67b6\u6784|\u90e8\u7f72"] },

  { query: "\u5bf9\u6bd4\u5b66\u4e60\u4e3a\u4ec0\u4e48\u4e0d\u9700\u8981\u6807\u6ce8", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-118", "ml-119"], secondaryIds: ["ml-122"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u5bf9\u6bd4\u5b66\u4e60|\u81ea\u76d1\u7763|SimCLR|Info"] },

  { query: "\u6211\u6709\u4e2a\u6570\u636e\u96c6\u6837\u672c\u7279\u522b\u4e0d\u5747\u8861\uff0c\u6b63\u6837\u672c\u53ea\u6709\u767e\u5206\u4e4b\u4e94\uff0c\u8fd9\u79cd\u60c5\u51b5\u4e00\u822c\u600e\u4e48\u5904\u7406\u6bd4\u8f83\u597d", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-16"], secondaryIds: ["ml-17", "ml-50"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u6837\u672c\u4e0d\u5747\u8861", "SMOTE", "\u7c7b\u522b\u6743\u91cd"] },

  { query: "\u6700\u8fd1\u5728\u590d\u4e60\u673a\u5668\u5b66\u4e60\u57fa\u7840\uff0c\u60f3\u95ee\u4e00\u4e0b\u504f\u5dee\u548c\u65b9\u5dee\u5230\u5e95\u600e\u4e48\u7406\u89e3\uff0c\u6709\u4ec0\u4e48\u76f4\u89c2\u7684\u4f8b\u5b50\u5417", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-8"], secondaryIds: ["ml-7"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u504f\u5dee\u65b9\u5dee", "bias-variance", "\u8fc7\u62df\u5408"] },

  { query: "\u6811\u6a21\u578b\u5bb6\u65cf\u600e\u4e48\u9009", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-126", "ml-17"], secondaryIds: ["ml-18"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u51b3\u7b56\u6811|\u968f\u673a\u68ee\u6797|GBDT|XGBoos"] },

  { query: "\u6b63\u6837\u672c\u53ea\u67093%\u76f4\u63a5\u8bad\u7ec3\u4f1a\u4e0d\u4f1a\u6709\u95ee\u9898", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-143", "ml-16"], secondaryIds: ["ml-72"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u4e0d\u5e73\u8861|SMOTE|\u7c7b\u522b.*\u52a0\u6743"] },

  { query: "\u6df1\u5ea6\u5b66\u4e60\u91d1\u878d\u98ce\u63a7\u53ef\u89e3\u91ca\u6027", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-134", "ml-137"], secondaryIds: ["ml-181"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u53ef\u89e3\u91ca|SHAP|LIME|Fairne"] },

  { query: "\u73b0\u573a\u63a8\u5bfc\u903b\u8f91\u56de\u5f52\u68af\u5ea6\u5361\u4f4f\u4e86\u600e\u4e48\u529e", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-1"], secondaryIds: [], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u903b\u8f91\u56de\u5f52.*\u635f\u5931|\u68af\u5ea6.*\u63a8\u5bfc"] },

  { query: "\u8fc7\u62df\u5408\u8bad\u7ec399\u6d4b\u8bd580\u600e\u4e48\u6392\u67e5", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-10", "ml-7"], secondaryIds: ["ml-77"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["\u8fc7\u62df\u5408|Dropout|\u6b63\u5219\u5316"] },

  { query: "\u9762\u8bd5\u5b98\u5982\u679c\u95ee\u6211 SVM \u7684\u539f\u7406\u548c\u6838\u51fd\u6570\u600e\u4e48\u9009\uff0c\u6211\u8be5\u600e\u4e48\u56de\u7b54\u6bd4\u8f83\u597d", group: "\u957f\u53e5-\u673a\u5668\u5b66\u4e60", primaryIds: ["ml-2"], secondaryIds: ["ml-19", "ml-20"], acceptableDecks: ["machine-learning"], acceptableConcepts: ["SVM", "\u6838\u51fd\u6570", "kernel"] },

  // ── 长句-深度学习 ──

  { query: "BPTT\u5728RNN\u4e2d\u600e\u4e48\u5de5\u4f5c", group: "\u957f\u53e5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-5", "dl-7"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["RNN|BPTT|\u53cd\u5411.*\u4f20\u64ad"] },

  { query: "GELU\u6fc0\u6d3b\u51fd\u6570\u6570\u5b66\u516c\u5f0f\u4f18\u52bf", group: "\u957f\u53e5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-1", "dl-24"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["GELU|Swish|\u6fc0\u6d3b"] },

  { query: "LSTM\u548cGRU\u672c\u8d28\u533a\u522b\u662f\u4ec0\u4e48", group: "\u957f\u53e5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-24", "dl-7"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["LSTM|GRU|RNN"] },

  { query: "\u56fe\u50cf\u5206\u5272\u624b\u673a\u7aef\u90e8\u7f72\u9009\u4ec0\u4e48\u6a21\u578b", group: "\u957f\u53e5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-6"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["CNN|\u5206\u5272|\u8f7b\u91cf\u5316|\u6a21\u578b.*\u538b\u7f29"] },

  { query: "\u6211\u5728\u505a\u56fe\u50cf\u5206\u7c7b\u4efb\u52a1\uff0c\u6a21\u578b\u8bad\u7ec3\u4e86\u597d\u51e0\u4e2a\u5c0f\u65f6\u4e00\u76f4\u5728\u9707\u8361\u4e0d\u6536\u655b\uff0c\u53ef\u80fd\u662f\u4ec0\u4e48\u539f\u56e0", group: "\u957f\u53e5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-2"], secondaryIds: ["dl-1", "dl-5"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["\u68af\u5ea6\u6d88\u5931", "\u6fc0\u6d3b\u51fd\u6570", "\u5b66\u4e60\u7387"] },

  { query: "\u68af\u5ea6\u6d88\u5931\u68af\u5ea6\u7206\u70b8\u901a\u4fd7\u89e3\u91ca", group: "\u957f\u53e5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-2"], secondaryIds: [], acceptableDecks: ["deep-learning"], acceptableConcepts: ["\u68af\u5ea6.*\u6d88\u5931|\u68af\u5ea6.*\u7206\u70b8|BatchN"] },

  { query: "\u80fd\u4e0d\u80fd\u7528\u901a\u4fd7\u6613\u61c2\u7684\u65b9\u5f0f\u7ed9\u6211\u89e3\u91ca\u4e00\u4e0b Batch Normalization \u5230\u5e95\u505a\u4e86\u4ec0\u4e48\u4e8b\u60c5", group: "\u957f\u53e5-\u6df1\u5ea6\u5b66\u4e60", primaryIds: ["dl-3"], secondaryIds: ["dl-2"], acceptableDecks: ["deep-learning"], acceptableConcepts: ["BatchNorm", "\u5f52\u4e00\u5316"] },

  // ── 长句-统计学 ──

  { query: "AB\u6d4b\u8bd5\u8f6c\u5316\u7387\u63d0\u5347\u53ea\u67090.5%\u600e\u4e48\u5224\u65ad\u663e\u8457", group: "\u957f\u53e5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-119", "stats-174"], secondaryIds: ["stats-31"], acceptableDecks: ["statistics"], acceptableConcepts: ["AB.*\u6d4b\u8bd5|A/B.*\u663e\u8457|\u6837\u672c\u91cf"] },

  { query: "CAP\u7406\u8bba\u4e3a\u4ec0\u4e48\u4e0d\u80fd\u4e09\u8005\u517c\u5f97", group: "\u957f\u53e5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-126"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["CAP|\u5206\u5e03\u5f0f|\u4e00\u81f4"] },

  { query: "ETL\u6d41\u7a0bpipeline\u6700\u4f73\u5b9e\u8df5", group: "\u957f\u53e5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-149", "stats-152"], secondaryIds: ["stats-153"], acceptableDecks: ["statistics"], acceptableConcepts: ["ETL|pipeline|\u6570\u636e"] },

  { query: "SQL\u5168\u8868\u626b\u63cf\u600e\u4e48\u52a0\u7d22\u5f15", group: "\u957f\u53e5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-180", "stats-183"], secondaryIds: [], acceptableDecks: ["statistics"], acceptableConcepts: ["\u7d22\u5f15|SQL.*\u4f18\u5316|\u5168\u8868"] },

  { query: "Spark join\u64cd\u4f5c\u7279\u522b\u6162\u600e\u4e48\u529e", group: "\u957f\u53e5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-144", "stats-180"], secondaryIds: ["stats-187"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u6570\u636e\u503e\u659c|Spark|\u4f18\u5316"] },

  { query: "pandas\u767e\u4e07\u6570\u636e\u5185\u5b58\u6ea2\u51fa\u600e\u4e48\u529e", group: "\u957f\u53e5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-180", "stats-187"], secondaryIds: ["stats-153"], acceptableDecks: ["statistics"], acceptableConcepts: ["pandas|\u5185\u5b58|\u5927\u6570\u636e"] },

  { query: "\u534f\u65b9\u5dee\u548c\u76f8\u5173\u7cfb\u6570\u516c\u5f0f\u8001\u641e\u6df7", group: "\u957f\u53e5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-115", "stats-146"], secondaryIds: ["stats-17"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u534f\u65b9\u5dee|\u76f8\u5173\u7cfb\u6570|\u6807\u51c6\u5316"] },

  { query: "\u65b0\u529f\u80fd\u662f\u5426\u5bf9\u7559\u5b58\u6709\u6b63\u5411\u5f71\u54cd", group: "\u957f\u53e5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-136", "stats-145"], secondaryIds: ["stats-164"], acceptableDecks: ["statistics"], acceptableConcepts: ["AB.*\u6d4b\u8bd5|\u56e0\u679c|\u7559\u5b58"] },

  { query: "\u65f6\u95f4\u5e8f\u5217\u8282\u5047\u65e5\u6548\u5e94\u600e\u4e48\u5904\u7406", group: "\u957f\u53e5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-88", "stats-90"], secondaryIds: ["stats-91"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u5b63\u8282|\u8282\u5047\u65e5|ARIMA|Prophet"] },

  { query: "\u9762\u8bd5\u88ab\u95ee\u5230\u4e2d\u5fc3\u6781\u9650\u5b9a\u7406\uff0c\u6211\u5176\u5b9e\u4e00\u76f4\u6ca1\u5b8c\u5168\u7406\u89e3\u5b83\u7684\u5b9e\u9645\u5e94\u7528\u573a\u666f\uff0c\u80fd\u5e2e\u6211\u68b3\u7406\u4e00\u4e0b\u5417", group: "\u957f\u53e5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-10"], secondaryIds: ["stats-11"], acceptableDecks: ["statistics"], acceptableConcepts: ["\u4e2d\u5fc3\u6781\u9650\u5b9a\u7406", "\u5927\u6570\u5b9a\u5f8b", "\u62bd\u6837\u5206\u5e03"] },

  { query: "\u9886\u5bfc\u8ba9\u6211\u5206\u6790\u4e00\u4e0b\u65b0\u529f\u80fd\u4e0a\u7ebf\u524d\u540e\u7528\u6237\u7559\u5b58\u6709\u6ca1\u6709\u663e\u8457\u53d8\u5316\uff0c\u6211\u5e94\u8be5\u7528\u4ec0\u4e48\u7edf\u8ba1\u65b9\u6cd5", group: "\u957f\u53e5-\u7edf\u8ba1\u5b66", primaryIds: ["stats-24"], secondaryIds: ["stats-25", "stats-26"], acceptableDecks: ["statistics"], acceptableConcepts: ["AB\u6d4b\u8bd5", "\u5047\u8bbe\u68c0\u9a8c", "\u663e\u8457\u6027"] },

  // ── 长句-职场 ──

  { query: "\u4e0b\u5468\u8981\u8ddf\u9886\u5bfc\u505a\u5b63\u5ea6\u8ff0\u804c\u6c47\u62a5\u4e86\uff0c\u600e\u4e48\u628a\u5de5\u4f5c\u6210\u679c\u8bb2\u5f97\u6709\u6761\u7406\u53c8\u6709\u4eae\u70b9\uff0c\u6709\u4ec0\u4e48\u63a8\u8350\u7684\u6846\u67b6\u5417", group: "\u957f\u53e5-\u804c\u573a", primaryIds: ["wp-3"], secondaryIds: ["wp-8"], acceptableDecks: ["workplace"], acceptableConcepts: ["\u6c47\u62a5", "\u5411\u4e0a\u6c9f\u901a", "\u8ff0\u804c"] },

  { query: "\u6700\u8fd1\u60f3\u8df3\u69fd\u4f46\u662f\u7b80\u5386\u6295\u51fa\u53bb\u90fd\u6ca1\u6709\u56de\u97f3\uff0c\u60f3\u8bf7\u6559\u4e00\u4e0b\u600e\u4e48\u5199\u7b80\u5386\u624d\u80fd\u8ba9 HR \u773c\u524d\u4e00\u4eae", group: "\u957f\u53e5-\u804c\u573a", primaryIds: ["wp-7"], secondaryIds: ["wp-6", "wp-5"], acceptableDecks: ["workplace"], acceptableConcepts: ["\u7b80\u5386", "\u9762\u8bd5", "STAR\u6cd5\u5219"] },

];
