// ============================================================
// src/components/DarkModeToggle.tsx
// ============================================================

import { Moon, Sun } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function DarkModeToggle() {
  const { state, dispatch } = useAppContext();

  return (
    <button
      onClick={() => dispatch({ type: 'TOGGLE_DARK' })}
      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={state.isDark ? '切换亮色模式' : '切换深色模式'}
    >
      {state.isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600" />
      )}
    </button>
  );
}
