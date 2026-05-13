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
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        // 代码块样式适配暗色模式
        pre: ({ children }) => (
          <pre className="bg-gray-100 dark:bg-[#1e1e2e] text-gray-800 dark:text-[#4ade80] rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed my-3">
            {children}
          </pre>
        ),
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            );
          }
          return <code className={className}>{children}</code>;
        },
        // 段落间距
        p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
        // 表格
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700 text-sm">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 font-medium text-left">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
            {children}
          </td>
        ),
        // 列表
        ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        // 加粗
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        // 分割线
        hr: () => <hr className="my-4 border-gray-200 dark:border-gray-700" />,
        // 标题
        h3: ({ children }) => <h3 className="text-base font-bold mt-4 mb-2">{children}</h3>,
        h4: ({ children }) => <h4 className="text-sm font-semibold mt-3 mb-1">{children}</h4>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/**
 * 预处理文本：中文和公式分离
 * - 检测混合行，抽出数学公式独占一行（$$ 包裹）
 * - 纯公式行 → $$...$$
 * - 纯中文/英文行 → 保持原样
 * - 已经是 $...$ 或 $$...$$ 的 → 保持
 */
function preprocess(text: string): string {
  if (/\$\$/.test(text)) return text; // 已手动标记，信任用户

  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push('');
      continue;
    }

    // 纯公式行 → $$ 包裹
    if (isPureFormulaLine(trimmed)) {
      if (trimmed.startsWith('$') && trimmed.endsWith('$')) {
        result.push(line);
      } else {
        result.push(`$$\n${trimmed}\n$$`);
      }
      continue;
    }

    // 混合行：中文 + 公式 → 拆分
    result.push(...separateMathFromChinese(trimmed));
  }

  return result.join('\n\n');
}

/** 将混合行拆分为中文段落和公式行 */
function separateMathFromChinese(line: string): string[] {
  const parts: string[] = [];
  let remaining = line;

  // 寻找公式片段并拆分
  while (remaining.length > 0) {
    const match = findNextMathSegment(remaining);
    if (!match) {
      // 剩余全是中文/普通文本
      const rest = remaining.trim();
      if (rest) parts.push(rest);
      break;
    }

    // 公式前面的中文
    const before = remaining.slice(0, match.start).trim();
    if (before) parts.push(before);

    // 公式自身 → 单独一行
    const formula = match.text.trim();
    if (formula.startsWith('$') && formula.endsWith('$')) {
      parts.push(formula);
    } else {
      parts.push(`$$\n${formula}\n$$`);
    }

    // 继续处理剩余部分
    remaining = remaining.slice(match.end);
  }

  return parts;
}

/** 在文本中找到下一个数学公式片段 */
function findNextMathSegment(text: string): { start: number; end: number; text: string } | null {
  // 策略：找到不含中文的连续片段，检查是否有数学特征
  // 匹配"非中文 + 非中文标点"的连续片段（至少 3 个字符）
  const nonChineseBlock = /[^\u4e00-\u9fff\u3000-\u303f\uff00-\uffef。，；：！？、\n]{3,}/g;
  let m: RegExpExecArray | null;
  while ((m = nonChineseBlock.exec(text)) !== null) {
    const block = m[0].trim();
    // 跳过纯英文单词（没有数学符号）
    if (mathScore(block) >= 1 && block.length >= 3) {
      return { start: m.index, end: m.index + m[0].length, text: m[0] };
    }
  }
  return null;
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

function mathScore(text: string): number {
  let s = 0;
  if (/[α-ωΑ-Ωβγδεζηθικλμνξπρστυφχψω]/.test(text)) s++;
  if (/[∑∏∫√∞∂∇∈∉⊂∪∩∧∨¬⇒⇔∀∃≈≠≤≥±×÷→←↔↑↓·∘⊕⊗]/.test(text)) s++;
  if (/\^\{[^}]+\}/.test(text)) s += 2;
  if (/_\{[^}]+\}/.test(text)) s += 2;
  if (/[⁰¹²³⁴⁵⁶⁷⁸⁹ⁱ⁻⁺ⁿ₀₁₂₃₄₅₆₇₈₉]/.test(text)) s++;
  if (/\b(softmax|sigmoid|tanh|ReLU|log|exp|sin|cos|max|min|argmax|Var|Cov|E\[|Pr\()/.test(text)) s++;
  if (/[+\-×÷·]=/.test(text.replace(/\s/g, '')) && /[a-zA-Zα-ω]/.test(text)) s++;
  return s;
}
