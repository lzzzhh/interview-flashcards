// JD Page Fetcher — fetches web page content via undici
// Returns raw HTML, title, and final URL. No LLM involved.

import { request } from 'undici';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) InterviewFlashcards/1.0';
const TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB

export interface FetchedPage {
  url: string;
  finalUrl: string;
  title: string;
  html: string;
  statusCode: number;
}

export async function fetchPage(url: string): Promise<FetchedPage | null> {
  try {
    const response = await request(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      maxRedirections: 3,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (response.statusCode >= 400) return null;

    const body = await response.body.text();
    const html = body.slice(0, MAX_BODY_BYTES);

    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    return {
      url,
      finalUrl: response.context?.origin || url,
      title,
      html,
      statusCode: response.statusCode,
    };
  } catch (e: any) {
    console.warn(`[jd-fetcher] Failed to fetch ${url}: ${e.message}`);
    return null;
  }
}

/** Search URLs for a given company + role query */
export function buildSearchUrls(company: string, role: string): string[] {
  const query = encodeURIComponent(`${company} ${role} 岗位要求 JD`);
  return [
    `https://www.zhipin.com/web/geek/job?query=${encodeURIComponent(role)}&city=100010000`,
    `https://www.lagou.com/wn/jobs?kd=${encodeURIComponent(role)}`,
    `https://www.google.com/search?q=${query}`,
  ];
}
