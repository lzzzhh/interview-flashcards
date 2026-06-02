// Public JD Search Tool — orchestrates real HTTP fetch → clean → rank pipeline
// No LLM used for searching or generating JD content.

import { fetchPage, buildSearchUrls } from './jd-page-fetcher';
import { cleanHTML, looksLikeJD } from './jd-text-cleaner';
import { rankCandidates, estimateCompany, estimateRole, type JDCandidate } from './jd-candidate-ranker';

export interface PublicJDSearchResult {
  candidates: JDCandidate[];
  sourceCount: number;
  searched: boolean;
}

/** Main entry: search for real JD candidates given company + role */
export async function searchPublicJD(
  company: string,
  role: string,
): Promise<PublicJDSearchResult> {
  const urls = buildSearchUrls(company, role);
  const candidates: JDCandidate[] = [];

  for (const url of urls) {
    const page = await fetchPage(url);
    if (!page) continue;

    const cleaned = cleanHTML(page.html);
    if (!looksLikeJD(cleaned)) continue;

    candidates.push({
      id: `jd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceType: 'public_web',
      sourceUrl: url,
      title: page.title || `${company} - ${role}`,
      company: estimateCompany(cleaned.text, page.title) || company,
      role: estimateRole(page.title) || role,
      rawText: page.html.slice(0, 5000),
      cleanedText: cleaned.text.slice(0, 5000),
      confidence: 0,
    });

    // Stop after finding 3 candidates
    if (candidates.length >= 3) break;
  }

  const ranked = rankCandidates(candidates, { company, role });

  return {
    candidates: ranked.filter(c => c.confidence >= 0.15),
    sourceCount: ranked.length,
    searched: true,
  };
}
