// ============================================================
// src/components/MathText.tsx — 自动识别并渲染 LaTeX 公式
//   - $$...$$ 或整行纯公式 → 居中块公式
//   - $...$ 或行内嵌入 → 行内公式
// ============================================================

import { useEffect, useRef } from 'react';
import katex from 'katex';

export default function MathText({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    el.innerHTML = '';

    // 先按 $$...$$ 拆分为块级 + 文本
    const blocks = splitBlockMath(text);

    for (const block of blocks) {
      if (block.type === 'block-math') {
        el.appendChild(renderBlockMath(block.content));
      } else {
        // 文本块：按行处理
        renderTextBlock(el, block.content);
      }
    }
  }, [text]);

  return <div ref={containerRef} className="math-container" />;
}

// ---- 拆分 $$...$$ ----
function splitBlockMath(text: string): { type: 'text' | 'block-math'; content: string }[] {
  const result: { type: 'text' | 'block-math'; content: string }[] = [];
  const regex = /\$\$([\s\S]*?)\$\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) result.push({ type: 'text', content: text.slice(last, m.index) });
    result.push({ type: 'block-math', content: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) result.push({ type: 'text', content: text.slice(last) });
  return result;
}

// ---- 渲染文本块（按行） ----
function renderTextBlock(parent: HTMLElement, text: string) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i > 0) parent.appendChild(document.createElement('br'));

    // 空行保留
    if (!line.trim()) {
      parent.appendChild(document.createTextNode(line));
      continue;
    }

    // 检查整行是否为纯公式（无中文，有数学特征）
    if (isStandaloneFormulaLine(line)) {
      parent.appendChild(renderBlockMath(line.trim()));
    } else {
      // 行内渲染（处理 $...$ 和自动检测）
      renderInlineLine(parent, line);
    }
  }
}

// ---- 渲染行内（处理 $...$ + 自动检测） ----
function renderInlineLine(parent: HTMLElement, text: string) {
  // 正则：优先 $...$（不跨行）
  const regex = /\$([^\$\n]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let hasMatch = false;

  while ((m = regex.exec(text)) !== null) {
    hasMatch = true;
    if (m.index > last) {
      // 前面的纯文本也需要自动检测
      appendAutoMath(parent, text.slice(last, m.index));
    }
    parent.appendChild(renderInlineMath(m[1].trim()));
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    if (hasMatch) {
      appendAutoMath(parent, text.slice(last));
    } else {
      // 没有 $...$，整段做自动检测
      appendAutoMath(parent, text);
    }
  }
}

// ---- 自动检测并渲染 ----
function appendAutoMath(parent: HTMLElement, text: string) {
  const chunks = splitByMath(text);
  for (const c of chunks) {
    if (c.type === 'math') {
      parent.appendChild(renderInlineMath(c.content));
    } else {
      parent.appendChild(document.createTextNode(c.content));
    }
  }
}

// ---- KaTeX 渲染器 ----
function renderBlockMath(latex: string): HTMLElement {
  const div = document.createElement('div');
  div.className = 'my-4 flex justify-center';
  try {
    katex.render(latex, div, {
      displayMode: true,
      throwOnError: false,
      strict: false,
      trust: true,
    });
  } catch {
    div.textContent = latex;
    div.className = 'my-2 font-mono text-sm text-center text-gray-500';
  }
  return div;
}

function renderInlineMath(latex: string): HTMLElement {
  const span = document.createElement('span');
  try {
    katex.render(latex, span, {
      displayMode: false,
      throwOnError: false,
      strict: false,
      trust: true,
    });
  } catch {
    span.textContent = latex;
    span.className = 'font-mono text-xs text-gray-400';
  }
  return span;
}

// ============================================================
// 公式检测
// ============================================================

/** 判断一整行是否应该作为独立公式居中 */
function isStandaloneFormulaLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length > 200) return false;
  // 无中文标点
  if (/[。，；：！？、【】「」]/.test(trimmed)) return false;
  // 中文占比高 → 不是纯公式
  const chineseCount = (trimmed.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseCount > 5) return false;
  // 需要有数学特征
  return mathScore(trimmed) >= 2;
}

/** 将文本拆分为 text/math 交替片段 */
function splitByMath(text: string): { type: 'text' | 'math'; content: string }[] {
  const results: { type: 'text' | 'math'; content: string }[] = [];

  // 按中文标点切分（保留分隔符）
  const parts = text.split(/([。，；：！？、\n])/);

  for (const part of parts) {
    if (!part.trim()) {
      results.push({ type: 'text', content: part });
      continue;
    }
    const trimmed = part.trim();
    // 太短的不检测
    if (trimmed.length < 3) {
      results.push({ type: 'text', content: part });
      continue;
    }
    // 纯中文 → 不检测
    const chineseOnly = /^[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\s]+$/.test(trimmed);
    if (chineseOnly) {
      results.push({ type: 'text', content: part });
      continue;
    }
    // 检测数学特征
    if (looksLikeFormula(trimmed)) {
      results.push({ type: 'math', content: trimmed });
    } else {
      results.push({ type: 'text', content: part });
    }
  }
  return results;
}

function looksLikeFormula(text: string): boolean {
  if (text.length > 200) return false;
  const score = mathScore(text);
  const nonChinese = text.replace(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\s]/g, '');
  const ratio = nonChinese.length / Math.max(text.length, 1);
  return score >= 2 && ratio > 0.3;
}

function mathScore(text: string): number {
  let s = 0;
  // 希腊字母
  if (/[α-ωΑ-Ωβγδεζηθικλμνξπρστυφχψω]/.test(text)) s++;
  // 数学运算符
  if (/[∑∏∫√∞∂∇∈∉⊂∪∩∧∨¬⇒⇔∀∃≈≠≤≥±×÷→←↔↑↓·∘⊕⊗]/.test(text)) s++;
  // LaTeX 上下标
  if (/\^\{[^}]+\}/.test(text)) s += 2;
  if (/_\{[^}]+\}/.test(text)) s += 2;
  // Unicode 上下标
  if (/[⁰¹²³⁴⁵⁶⁷⁸⁹ⁱ⁻⁺ⁿ₀₁₂₃₄₅₆₇₈₉]/.test(text)) s++;
  // 数学函数
  if (/\b(softmax|sigmoid|tanh|ReLU|log|exp|sin|cos|max|min|argmax|Var|Cov|E\[|Pr\()/.test(text)) s++;
  // 等式模式
  if (/[+\-×÷·]=/.test(text.replace(/\s/g, '')) && /[a-zA-Zα-ω]/.test(text)) s++;
  // 矩阵/向量符号
  if (/\\?mathbb|\\?mathbf|ℝ|ℂ|ℕ|ℤ|∈|→/.test(text)) s++;
  return s;
}
