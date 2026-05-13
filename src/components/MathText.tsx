// ============================================================
// src/components/MathText.tsx — 自动识别并渲染 LaTeX 公式
// ============================================================

import { useEffect, useRef } from 'react';
import katex from 'katex';

/**
 * 自动检测文本中的数学公式并渲染：
 *   $...$   → 行内公式
 *   $$...$$ → 独立公式块
 * 同时也尝试智能检测未加 $ 的公式片段
 */
export default function MathText({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    // Step 1: 提取所有已标记的公式块 $$...$$ 和 $...$
    const segments = parseSegments(text);

    // Step 2: 对每个片段渲染
    el.innerHTML = '';
    for (const seg of segments) {
      if (seg.type === 'block-math') {
        const span = document.createElement('div');
        span.className = 'my-3 text-center';
        try {
          katex.render(seg.content, span, {
            displayMode: true,
            throwOnError: false,
            strict: false,
            trust: true,
          });
        } catch {
          span.textContent = seg.content;
        }
        el.appendChild(span);
      } else if (seg.type === 'inline-math') {
        const span = document.createElement('span');
        try {
          katex.render(seg.content, span, {
            displayMode: false,
            throwOnError: false,
            strict: false,
            trust: true,
          });
        } catch {
          span.textContent = seg.content;
        }
        el.appendChild(span);
      } else {
        // 对纯文本也试试自动检测行内公式
        const autoSpans = autoDetectMath(seg.content);
        for (const auto of autoSpans) {
          if (auto.type === 'math') {
            const span = document.createElement('span');
            try {
              katex.render(auto.content, span, {
                displayMode: false,
                throwOnError: false,
                strict: false,
                trust: true,
              });
            } catch {
              span.textContent = auto.content;
            }
            el.appendChild(span);
          } else {
            el.appendChild(document.createTextNode(auto.content));
          }
        }
      }
    }
  }, [text]);

  return <div ref={containerRef} className="math-container" />;
}

// ---- 解析 $...$ 和 $$...$$ ----
type Segment =
  | { type: 'text'; content: string }
  | { type: 'inline-math'; content: string }
  | { type: 'block-math'; content: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  // 正则: 优先匹配 $$...$$，然后匹配 $...$
  const regex = /\$\$([\s\S]*?)\$\$|\$([^\$\n]+?)\$/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // 匹配前的纯文本
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      // $$...$$
      segments.push({ type: 'block-math', content: match[1].trim() });
    } else if (match[2] !== undefined) {
      // $...$
      segments.push({ type: 'inline-math', content: match[2].trim() });
    }
    lastIndex = match.index + match[0].length;
  }

  // 尾部剩余文本
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

// ---- 智能检测未加 $ 的公式 ----
function autoDetectMath(text: string): { type: 'text' | 'math'; content: string }[] {
  // 检测公式的启发式规则：
  // 1. 包含 ^{...} 或 _{...} LaTeX 上下标语法
  // 2. 包含 KaTeX 能识别的数学符号组合
  // 3. 明显是数学表达式（= 号两侧都是数学内容）

  const results: { type: 'text' | 'math'; content: string }[] = [];

  // 策略: 按中文标点和换行切分，对每个片段判断是否为数学
  const chunks = text.split(/([。，；：！？、\n])/);

  for (const chunk of chunks) {
    if (!chunk.trim()) {
      results.push({ type: 'text', content: chunk });
      continue;
    }

    const trimmed = chunk.trim();

    // 跳过太长的文本（不太可能是纯公式）
    if (trimmed.length > 250) {
      // 尝试在长文本中找公式片段
      const subResults = findMathInText(trimmed);
      for (const sr of subResults) {
        results.push(sr);
      }
      continue;
    }

    // 检测是否为公式
    if (looksLikeMath(trimmed)) {
      results.push({ type: 'math', content: trimmed });
    } else {
      results.push({ type: 'text', content: chunk });
    }
  }

  return results;
}

/** 判断一段文本是否像数学公式 */
function looksLikeMath(text: string): boolean {
  // 规则 1: 包含 LaTeX 上下标语法 ^{...} 或 _{...}
  if (/\^\{[^}]+\}/.test(text) || /_\{[^}]+\}/.test(text)) return true;

  // 规则 2: 包含明显数学结构
  const mathScore = countMathFeatures(text);
  // 至少需要 2 个数学特征，且非中文字符占比高
  const nonChinese = text.replace(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g, '').length;
  const ratio = nonChinese / Math.max(text.length, 1);
  return mathScore >= 2 && ratio > 0.4;
}

/** 统计数学特征数量 */
function countMathFeatures(text: string): number {
  let score = 0;
  // 希腊字母
  if (/[α-ωΑ-Ωβγδεζηθικλμνξπρστυφχψω]/.test(text)) score++;
  // 数学符号
  if (/[∑∏∫√∞∂∇∈∉⊂∪∩∧∨¬⇒⇔∀∃≈≠≤≥±×÷→←↔↑↓]/.test(text)) score++;
  // 上下标数字
  if (/[⁰¹²³⁴⁵⁶⁷⁸⁹ⁱ⁻⁺ⁿ⁽⁾₀₁₂₃₄₅₆₇₈₉ₐₑₒₓₔₕₖₗₘₙₚₛₜ]/.test(text)) score++;
  // LaTeX 风格的 ^ 和 _（不带花括号的）
  if (/(?<!\$)\^[a-zA-Z0-9\{\[\(]/.test(text)) score++;
  // 数学函数名
  if (/\b(softmax|sigmoid|tanh|ReLU|log|exp|sin|cos|tan|max|min|argmax|argmin|Var|Cov|E\[|P\(|Pr\()\b/.test(text)) score++;
  // 矩阵/向量标记
  if (/\\?mathbb|\\?mathbf|∈|ℝ|ℂ|ℕ|ℤ/.test(text)) score++;
  // 分数模式 (a/b)
  if (/(?<![a-zA-Z])\/[a-zA-Z\(]/.test(text) && text.length < 80) score++;
  // 存在数学运算符
  if (/[+\-×÷·]=/.test(text.replace(/\s/g, '')) && /[a-zA-Zα-ω]/.test(text)) score++;
  // 管道符/范数
  if (/\|\|.*\|\||\\\|/.test(text)) score++;
  return score;
}

/** 在长文本中查找嵌入的公式片段 */
function findMathInText(text: string): { type: 'text' | 'math'; content: string }[] {
  const results: { type: 'text' | 'math'; content: string }[] = [];
  // 按空格和标点更细粒度切分
  const words = text.split(/(\s+)/);
  let buffer = '';
  let bufferIsMath = false;

  for (const word of words) {
    const wm = looksLikeMath(word);
    if (wm === bufferIsMath) {
      buffer += word;
    } else {
      if (buffer) {
        results.push({ type: bufferIsMath ? 'math' : 'text', content: buffer });
      }
      buffer = word;
      bufferIsMath = wm;
    }
  }
  if (buffer) {
    results.push({ type: bufferIsMath ? 'math' : 'text', content: buffer });
  }
  return results.length > 0 ? results : [{ type: 'text', content: text }];
}
