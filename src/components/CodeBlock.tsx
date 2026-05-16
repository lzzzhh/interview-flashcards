// ============================================================
// src/components/CodeBlock.tsx — highlight.js 语法高亮代码块
// ============================================================

import { useMemo } from 'react';
import hljs from 'highlight.js';

interface Props {
  code: string;
  language?: string;
  className?: string;
}

export default function CodeBlock({ code, language = 'python', className = '' }: Props) {
  const highlighted = useMemo(() => {
    try {
      const result = hljs.highlight(code, { language: language || 'plaintext' });
      return result.value;
    } catch {
      return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }, [code, language]);

  return (
    <pre className={`text-sm font-mono leading-relaxed bg-gray-100 text-gray-800 dark:bg-[#1e1e2e] dark:text-[#4ade80] rounded-xl p-3 overflow-auto max-h-full ${className}`}>
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}
