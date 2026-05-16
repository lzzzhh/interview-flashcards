// ============================================================
// src/components/NotesEditor.tsx — 用户自定义笔记组件
// ============================================================

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  notes: string;
  onSave: (notes: string) => void;
}

export default function NotesEditor({ notes, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(notes || '');

  const handleSave = () => {
    onSave(text);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <span>📝 笔记</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          placeholder="输入你的面试心得..."
          className="w-full h-24 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>
    </div>
  );
}
