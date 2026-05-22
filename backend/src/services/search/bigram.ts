// backend/src/services/search/bigram.ts — 中文 bigram 分词器
//
// 中文不拆单字。例如：
//   "怎么涨薪" → ["怎么", "么涨", "涨薪"]
//   "Self-Attention QKV" → ["self", "attention", "qkv", "self-attention"]
//
// 拉丁词保留完整 token（缩写 RAG/GAN/VAE 等不过度拆分）。

/**
 * 从文本提取 bigram + 拉丁 token。
 * 用于标签召回通道，对 tags 和 searchKeywords 做 bigram 索引匹配。
 */
export function tokenizeBigrams(text: string): string[] {
  const tokens: string[] = [];
  const t = text.trim().toLowerCase();
  if (!t) return tokens;

  // 1. 提取拉丁/数字 token（保留缩写如 RAG、QKV、CNN、GAN、VAE、PCA）
  const latinTokens = t.match(/[a-z0-9][a-z0-9._-]*[a-z0-9]|[a-z0-9]/gi) || [];
  for (const lt of latinTokens) {
    if (lt.length >= 1) tokens.push(lt.toLowerCase());
  }

  // 2. 提取纯中文连续片段
  const cjkSegments = t.match(/[\u4e00-\u9fff]+/g) || [];

  for (const seg of cjkSegments) {
    // bigram: 滑动窗口宽 2
    for (let i = 0; i < seg.length - 1; i++) {
      tokens.push(seg.slice(i, i + 2));
    }
    // 原段保留（供精确匹配）
    if (seg.length >= 2) {
      tokens.push(seg);
    }
  }

  // 去重
  return [...new Set(tokens)];
}

/**
 * 构建可搜索文本索引：将 tags、searchKeywords 等字段转为 bigram token 集合。
 * 返回 JSON 字符串数组，可直接存入或用于匹配。
 */
export function buildBigramIndex(...fields: (string | null | undefined)[]): string[] {
  const allTokens = new Set<string>();
  for (const f of fields) {
    if (!f) continue;
    for (const tok of tokenizeBigrams(f)) {
      allTokens.add(tok);
    }
  }
  return [...allTokens];
}

/**
 * 检查用户 query 的 bigram 是否命中目标字段的 bigram 索引。
 * @returns 命中的 token 数量
 */
export function bigramMatchCount(queryTokens: string[], fieldTokens: string[]): number {
  const fieldSet = new Set(fieldTokens);
  let hits = 0;
  for (const qt of queryTokens) {
    if (fieldSet.has(qt)) hits++;
  }
  return hits;
}
