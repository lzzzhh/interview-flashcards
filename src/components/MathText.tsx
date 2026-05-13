// ============================================================
// src/components/MathText.tsx — Markdown 渲染（支持数学公式）
// ============================================================

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathTextProps {
  text: string;
}

export default function MathText({ text }: MathTextProps) {
  const content = useMemo(() => preprocess(text), [text]);

  return (
    <div className="math-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: 'ignore' }]]}
        components={{
          pre: ({ children }) => (
            <pre className="rounded-lg bg-gray-100 p-4 text-sm leading-relaxed text-gray-800 dark:bg-[#1e1e2e] dark:text-[#4ade80]">
              {children}
            </pre>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.92em] text-pink-600 dark:bg-gray-800 dark:text-pink-400">
                  {children}
                </code>
              );
            }
            return <code className={className}>{children}</code>;
          },
          p: ({ children }) => <p>{children}</p>,
          table: ({ children }) => (
            <div className="math-table-wrap">
              <table>{children}</table>
            </div>
          ),
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong>{children}</strong>,
          hr: () => <hr />,
          h3: ({ children }) => <h3>{children}</h3>,
          h4: ({ children }) => <h4>{children}</h4>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * 预处理文本：只处理明显公式，避免把普通文字误识别成数学。
 * - 混合行里的明显短公式保留为行内公式
 * - 纯公式行 → $$...$$
 * - 已经是 $...$ 或 $$...$$ 的 → 保持用户标记
 */
function preprocess(text: string): string {
  // 如果文本已经包含 $...$ 数学标记，信任用户的格式，不做预处理
  const hasDollarMath = /\$[^$\n]+\$/.test(text) || /\$\$/.test(text);
  if (hasDollarMath) return text;

  const lines = text.split('\n');
  const result: string[] = [];
  let inFence = false;
  let inDisplayMath = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      result.push(line);
      continue;
    }
    if (trimmed.startsWith('$$')) {
      inDisplayMath = !inDisplayMath;
      result.push(line);
      continue;
    }
    if (inFence || inDisplayMath) {
      result.push(line);
      continue;
    }
    if (!trimmed) {
      result.push('');
      continue;
    }

    if (isPureFormulaLine(trimmed)) {
      if (trimmed.startsWith('$') && trimmed.endsWith('$')) {
        result.push(line);
      } else {
        result.push(`$$\n${toKatexFriendly(trimmed)}\n$$`);
      }
      continue;
    }

    result.push(wrapInlineMath(line));
  }

  return result.join('\n\n');
}

function wrapInlineMath(line: string): string {
  const protectedLine = line
    .replace(/`([^`]+)`/g, (_, code: string) => `\uE000${code}\uE001`)
    .replace(/(^|[^\\])\$([^$\n]+)\$/g, (_, prefix: string, math: string) => {
      return `${prefix}\uE004${math}\uE005`;
    });
  const converted = protectInlineFormulaSegments(protectedLine);
  return converted
    .replace(/\uE004([^]+?)\uE005/g, '$$$1$$')
    .replace(/\uE000([^]+?)\uE001/g, '`$1`');
}

function protectInlineFormulaSegments(line: string): string {
  const formulas: string[] = [];
  const markFormula = (formula: string) => {
    const index = formulas.push(formula) - 1;
    return `\uE002${index}\uE003`;
  };

  let converted = line
    .replace(/(公式为[:：]?|数学上[:：])([^。\n]+)/g, (full: string, cue: string, formula: string) => {
      const trimmed = trimFormulaBoundary(formula);
      if (!isSafeInlineFormula(trimmed)) return full;
      return `${cue}${markFormula(toKatexFriendly(trimmed))}`;
    })
    .replace(/([A-Za-z][A-Za-z0-9_']*)\s*∈\s*R\^\{([^}]+)\}/g, (_, variable: string, shape: string) => {
      return markFormula(`${variable} \\in \\mathbb{R}^{${shape.replace(/×/g, '\\times ')}}`);
    });

  converted = wrapDetectedFormulaRuns(converted, markFormula);

  return converted.replace(/\uE002(\d+)\uE003/g, (_, index: string) => `$${formulas[Number(index)]}$`);
}

function wrapDetectedFormulaRuns(line: string, markFormula: (formula: string) => string): string {
  let result = '';
  let index = 0;

  while (index < line.length) {
    if (line[index] === '\uE002') {
      const end = line.indexOf('\uE003', index);
      if (end !== -1) {
        result += line.slice(index, end + 1);
        index = end + 1;
        continue;
      }
    }

    if (!isFormulaRunChar(line[index])) {
      result += line[index];
      index += 1;
      continue;
    }

    const start = index;
    while (index < line.length && isFormulaRunChar(line[index])) {
      index += 1;
    }

    const raw = line.slice(start, index);
    const leading = raw.match(/^\s*/)?.[0] ?? '';
    const trailing = raw.match(/\s*$/)?.[0] ?? '';
    const trimmed = trimFormulaBoundary(raw);

    if (isSafeInlineFormula(trimmed)) {
      result += `${leading}${markFormula(toKatexFriendly(trimmed))}${trailing}`;
    } else {
      result += raw;
    }
  }

  return result;
}

function isFormulaRunChar(char: string): boolean {
  return /[A-Za-z0-9_{}[\]()^+\-*/=<>|,.:'%!\\\s√∑Σ∏Π∫∞∂∆Δ∇∈∉⊂∪∩∧∨¬⇒⇔∀∃≈≠≤≥±×÷→←↔↑↓·∘⊕⊗⊙‖⁽⁾⁰¹²³⁴⁵⁶⁷⁸⁹ⁱ⁻⁺ⁿᵀᵗᵢᵧᵏᵐᵈᵃᵇᶜ₀₁₂₃₄₅₆₇₈₉ᵢⱼₖₗₘₙₜα-ωΑ-Ωŷȳỹ]/u.test(char);
}

function trimFormulaBoundary(text: string): string {
  let trimmed = text
    .trim()
    .replace(/^[-–—•\d.、：:，,。.；;\s]+/, '')
    .replace(/[，,。.；;：:\s]+$/, '');
  const colonMatch = trimmed.match(/^([^:：]{1,36})[:：]\s*(.+)$/);
  if (colonMatch && mathScore(colonMatch[1]) === 0 && mathScore(colonMatch[2]) > 0) {
    trimmed = colonMatch[2].trim();
  }
  return trimmed;
}

function isSafeInlineFormula(text: string): boolean {
  if (text.length > 120) return false;
  if (/[\u4e00-\u9fff]/.test(text)) return false;
  if (/\$|`|\uE000|\uE001|\uE002|\uE003|\uE004|\uE005/.test(text)) return false;
  return hasFormulaStructure(text) && mathScore(text) >= 1;
}

function hasFormulaStructure(text: string): boolean {
  return /[=<>∈∉≈≠≤≥→←↔⇒⇔∑Σ∏Π∫√∞∂∆Δ∇±×÷·⊙^_⁽⁾⁰¹²³⁴⁵⁶⁷⁸⁹ⁱ⁻⁺ⁿᵀᵗᵢᵧᵏᵐᵈᵃᵇᶜ₀₁₂₃₄₅₆₇₈₉]/.test(text)
    || /\b[A-Za-z][A-Za-z0-9_]*\s*\(/.test(text)
    || /[A-Za-z]\s*[+\-*/]\s*[A-Za-z0-9]/.test(text);
}

/** 判断是否为纯公式行 */
function isPureFormulaLine(line: string): boolean {
  if (line.length > 400) return false;
  // 中文超过 8 个字 → 不是纯公式
  const chCount = (line.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chCount > 8) return false;
  // 有中文标点 → 不是纯公式
  if (/[。，；：！？、【】「」]/.test(line) && chCount > 2) return false;
  return mathScore(line) >= 2;
}

function toKatexFriendly(text: string): string {
  return normalizeUnicodeScript(text)
    .replace(/√\s*([A-Za-z0-9_{}]+)/g, '\\sqrt{$1}')
    .replace(/→/g, '\\to ')
    .replace(/∞/g, '\\infty ')
    .replace(/∑/g, '\\sum ')
    .replace(/∏/g, '\\prod ')
    .replace(/∫/g, '\\int ')
    .replace(/≈/g, '\\approx ')
    .replace(/≠/g, '\\ne ')
    .replace(/≤/g, '\\le ')
    .replace(/≥/g, '\\ge ')
    .replace(/×/g, '\\times ')
    .replace(/÷/g, '\\div ')
    .replace(/·/g, '\\cdot ')
    .replace(/⊙/g, '\\odot ')
    .replace(/∈/g, '\\in ')
    .replace(/∝/g, '\\propto ')
    .replace(/‖([^‖]+)‖/g, '\\left\\lVert $1 \\right\\rVert ')
    .replace(/\bR\^\{/g, '\\mathbb{R}^{')
    .replace(/\bAttention\b/g, '\\operatorname{Attention}')
    .replace(/\bsoftmax\b/g, '\\operatorname{softmax}')
    .replace(/\bsigmoid\b/g, '\\operatorname{sigmoid}')
    .replace(/\bargmax\b/g, '\\operatorname*{argmax}')
    .replace(/\blog\b/g, '\\log')
    .replace(/\bexp\b/g, '\\exp')
    .replace(/\bsin\b/g, '\\sin')
    .replace(/\bcos\b/g, '\\cos');
}

function normalizeUnicodeScript(text: string): string {
  return text
    .replace(/ŷ/g, '\\hat{y}')
    .replace(/ȳ/g, '\\bar{y}')
    .replace(/ỹ/g, '\\tilde{y}')
    .replace(/x̂/g, '\\hat{x}')
    .replace(/m̂/g, '\\hat{m}')
    .replace(/v̂/g, '\\hat{v}')
    .replace(/([A-Za-zα-ωΑ-Ω])([₀₁₂₃₄₅₆₇₈₉ᵢⱼₖₗₘₙₜ]+)/g, (_, base: string, subscript: string) => {
      return `${base}_{${convertSubscript(subscript)}}`;
    })
    .replace(/([A-Za-z0-9)\]}])([⁽⁾⁰¹²³⁴⁵⁶⁷⁸⁹ⁱ⁻⁺ⁿᵀᵗᵢᵧᵏᵐᵈᵃᵇᶜ]+)/g, (_, base: string, superscript: string) => {
      return `${base}^{${convertSuperscript(superscript)}}`;
    });
}

function convertSubscript(text: string): string {
  const map: Record<string, string> = {
    '₀': '0',
    '₁': '1',
    '₂': '2',
    '₃': '3',
    '₄': '4',
    '₅': '5',
    '₆': '6',
    '₇': '7',
    '₈': '8',
    '₉': '9',
    'ᵢ': 'i',
    'ⱼ': 'j',
    'ₖ': 'k',
    'ₗ': 'l',
    'ₘ': 'm',
    'ₙ': 'n',
    'ₜ': 't',
  };
  return Array.from(text).map((char) => map[char] ?? char).join('');
}

function convertSuperscript(text: string): string {
  const map: Record<string, string> = {
    '⁰': '0',
    '¹': '1',
    '²': '2',
    '³': '3',
    '⁴': '4',
    '⁵': '5',
    '⁶': '6',
    '⁷': '7',
    '⁸': '8',
    '⁹': '9',
    'ⁱ': 'i',
    '⁻': '-',
    '⁺': '+',
    'ⁿ': 'n',
    '⁽': '(',
    '⁾': ')',
    'ᵀ': 'T',
    'ᵗ': 't',
    'ᵢ': 'i',
    'ᵧ': 'y',
    'ᵏ': 'k',
    'ᵐ': 'm',
    'ᵈ': 'd',
    'ᵃ': 'a',
    'ᵇ': 'b',
    'ᶜ': 'c',
  };
  return Array.from(text).map((char) => map[char] ?? char).join('');
}

function mathScore(text: string): number {
  let s = 0;
  if (/[α-ωΑ-Ωβγδεζηθικλμνξπρστυφχψω]/.test(text)) s++;
  if (/[∑∏∫√∞∂∇∈∉⊂∪∩∧∨¬⇒⇔∀∃≈≠≤≥±×÷→←↔↑↓·∘⊕⊗]/.test(text)) s++;
  if (/\^\{[^}]+\}/.test(text)) s += 2;
  if (/_\{[^}]+\}/.test(text)) s += 2;
  if (/[A-Za-z]\^[A-Za-z0-9{]/.test(text)) s++;
  if (/[A-Za-z]_[A-Za-z0-9{]/.test(text)) s++;
  if (/[A-Za-z0-9)]\s*[=<>]\s*[A-Za-z0-9(]/.test(text)) s++;
  if (/[⁰¹²³⁴⁵⁶⁷⁸⁹ⁱ⁻⁺ⁿ₀₁₂₃₄₅₆₇₈₉]/.test(text)) s++;
  if (/\b(softmax|sigmoid|tanh|ReLU|log|exp|sin|cos|max|min|argmax|Var|Cov|E\[|Pr\()/.test(text)) s++;
  if (/[+\-×÷·]=/.test(text.replace(/\s/g, '')) && /[a-zA-Zα-ω]/.test(text)) s++;
  return s;
}
