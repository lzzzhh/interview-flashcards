// JD Page Fetcher — fetches web page content
// Uses Node.js native fetch (18+) for simplicity and redirect support

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 InterviewFlashcards/1.0';
const TIMEOUT_MS = 10000;
const MAX_BODY_BYTES = 1 * 1024 * 1024; // 1 MB

export interface FetchedPage {
  url: string;
  finalUrl: string;
  title: string;
  html: string;
  statusCode: number;
}

export async function fetchPage(url: string): Promise<FetchedPage | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    const html = (await response.text()).slice(0, MAX_BODY_BYTES);

    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    return {
      url,
      finalUrl: response.url || url,
      title,
      html,
      statusCode: response.status,
    };
  } catch (e: any) {
    clearTimeout(timer);
    if (e.name !== 'AbortError') {
      console.warn(`[jd-fetcher] Failed to fetch ${url}: ${e.message}`);
    }
    return null;
  }
}

/** Search URLs for Chinese recruitment sites */
export function buildSearchUrls(company: string, role: string): string[] {
  const c = encodeURIComponent(company);
  const r = encodeURIComponent(role);
  const q = encodeURIComponent(`${company} ${role}`);

  return [
    // 前程无忧
    `https://we.51job.com/pc/search?keyword=${r}&searchType=2`,
    // 智联招聘搜索
    `https://sou.zhaopin.com/?kw=${r}&cityId=530`,
    // 猎聘
    `https://www.liepin.com/zhaopin/?key=${r}`,
    // 拉勾
    `https://www.lagou.com/jobs/list_${r}`,
    // 百度搜索
    `https://www.baidu.com/s?wd=${q}+岗位+JD`,
    // Bing 搜索
    `https://www.bing.com/search?q=${q}+岗位+JD`,
  ];
}
