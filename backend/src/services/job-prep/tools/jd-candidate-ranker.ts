// JD Candidate Ranker — scores extracted JD candidates against target company/role
// Uses simple keyword matching for confidence. No LLM for ranking.

export interface JDCandidate {
  id: string;
  sourceType: 'public_web' | 'official_site';
  sourceUrl: string;
  title: string;
  company?: string;
  role?: string;
  rawText: string;
  cleanedText: string;
  confidence: number;
}

export function rankCandidates(
  candidates: JDCandidate[],
  target: { company?: string; role: string },
): JDCandidate[] {
  const companyLower = (target.company || '').toLowerCase();
  const roleLower = target.role.toLowerCase();

  for (const c of candidates) {
    let score = 0;
    const textLower = c.cleanedText.toLowerCase();

    // Company match
    if (companyLower && (textLower.includes(companyLower) || c.title.toLowerCase().includes(companyLower))) {
      score += 0.30;
    }

    // Role match
    const roleKeywords = roleLower.split(/[\s/]+/).filter(k => k.length > 1);
    let roleMatches = 0;
    for (const kw of roleKeywords) {
      if (textLower.includes(kw)) roleMatches++;
    }
    if (roleMatches > 0) {
      score += Math.min(0.40, roleMatches * 0.10);
    }

    // JD keyword signals
    const jdSignals = ['岗位职责', '任职要求', 'responsibilities', 'requirements', 'qualifications'];
    let jdSignalCount = 0;
    for (const s of jdSignals) {
      if (c.cleanedText.includes(s)) jdSignalCount++;
    }
    score += Math.min(0.20, jdSignalCount * 0.05);

    // Text length bonus (substantial pages)
    if (c.cleanedText.length > 500) score += 0.05;
    if (c.cleanedText.length > 1000) score += 0.05;

    c.confidence = Math.min(score, 1.0);
  }

  // Sort by confidence descending
  return candidates.sort((a, b) => b.confidence - a.confidence);
}

/** Estimate company from page content */
export function estimateCompany(text: string, title: string): string | undefined {
  const knownCompanies = ['阿里', '腾讯', '字节', '百度', '美团', '京东', '拼多多', '网易',
    '阿里巴巴', 'ByteDance', 'Tencent', 'Baidu', 'Meituan', 'JD.com'];
  const combined = (text + ' ' + title).toLowerCase();
  for (const c of knownCompanies) {
    if (combined.includes(c.toLowerCase())) return c;
  }
  return undefined;
}

/** Estimate role from title */
export function estimateRole(title: string): string | undefined {
  const roleMatch = title.match(/([\u4e00-\u9fa5a-zA-Z]+(?:实习|工程师|经理|专家|负责人|管培生))/);
  return roleMatch ? roleMatch[1] : undefined;
}
