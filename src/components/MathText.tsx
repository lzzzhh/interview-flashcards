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
 * 预处理文本：智能添加 Markdown 格式
 * - 把 LaTeX 风格的独立行公式用 $$ 包裹
 * - 确保换行符合 Markdown 规范
 */
function preprocess(text: string): string {
  // 如果文本已包含 $$...$$ 或明显的 $...$，信任用户标记
  if (/\$\$/.test(text)) return text;

  // 按行处理：检测独立公式行，包上 $$
  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空行 → 段落分隔
    if (!trimmed) {
      result.push('');
      continue;
    }

    // 检测纯公式行（无中文标点，有数学特征，短行）
    if (isFormulaLine(trimmed)) {
      // 已经是 $...$ 包裹的跳过
      if (trimmed.startsWith('$') && trimmed.endsWith('$')) {
        result.push(line);
      } else {
        result.push(`$$${trimmed}$$`);
      }
    } else {
      // 非公式行：检查行内公式片段
      result.push(wrapInlineMath(line));
    }
  }

  return result.join('\n');
}

/** 判断是否为纯公式行 */
function isFormulaLine(line: string): boolean {
  if (line.length > 250) return false;
  // 不能有中文标点
  if (/[。，；：！？、【】「」]/.test(line)) return false;
  // 中文超过 5 个字符 → 不是纯公式
  const chineseCount = (line.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseCount > 5) return false;
  // 需要足够的数学特征
  return mathScore(line) >= 2;
}

/** 行内公式自动包裹 */
function wrapInlineMath(line: string): string {
  // 如果已经有 $ 包裹，跳过
  if (/\$[^$]+\$/.test(line)) return line;

  // 对明显的公式片段包上 $
  // 启发式：非中文片段 + 数学符号
  let result = line;
  // 希腊字母 + 数学符号的组合
  result = result.replace(
    /([α-ωΑ-Ωβγδεζηθικλμνξπρστυφχψω][\s\w\d⁰¹²³⁴⁵⁶⁷⁸⁹ⁱ⁻⁺ⁿ₀₁₂₃₄₅₆₇₈₉·×÷±→←↔≤≥≠≈∞∂∇∫∑∏√∧∨∩∪∈∉⊂⊃⊆⊇⊕⊗⊥∥∠△□▯…‥̴̵̶̷̸̡̢̧̨̛̖̗̘̙̜̝̞̟̠̣̤̥̦̩̪̫̬̭̮̯̰̱̲̳̹̺̻̼̂̃̄̅̆̇̈̉̊̋̌̍̎̏̐̑̒̓̔̽̾̿̕̚ᵀᴺ]+)/g,
    '$$$1$',
  );
  return result;
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
