// JD Text Cleaner — extracts clean text from raw HTML using cheerio
// Strips scripts, styles, nav elements, whitespace

import * as cheerio from 'cheerio';

export interface CleanedJD {
  text: string;
  wordCount: number;
  hasJDKeywords: boolean;
}

const JD_KEYWORDS = [
  '岗位职责', '任职要求', '职位描述', '工作内容',
  'responsibilities', 'requirements', 'qualifications', 'job description',
  '加分项', '优先考虑', '我们希望你',
];

export function cleanHTML(html: string): CleanedJD {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $('script, style, nav, footer, header, aside, iframe, noscript, svg, [role="navigation"]').remove();

  // Extract main content areas
  const contentSelectors = [
    'article', 'main', '[class*="content"]', '[class*="detail"]',
    '[class*="description"]', '[class*="job"]', '[id*="job"]',
    '.job-detail', '.job-description', '.job-requirement',
  ];

  let text = '';
  for (const sel of contentSelectors) {
    const el = $(sel);
    if (el.length > 0) {
      text += el.text() + '\n';
    }
  }

  // Fallback: take all body text
  if (!text.trim()) {
    text = $('body').text();
  }

  // Clean whitespace
  text = text
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();

  const wordCount = text.length;

  // Check for JD-specific keywords
  const hasJDKeywords = JD_KEYWORDS.some(kw => text.includes(kw));

  return { text, wordCount, hasJDKeywords };
}

/** Quick confidence check — does this page look like a JD? */
export function looksLikeJD(cleaned: CleanedJD): boolean {
  return cleaned.wordCount > 200 && cleaned.hasJDKeywords;
}
