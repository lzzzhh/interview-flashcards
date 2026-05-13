// ============================================================
// src/components/FilterBar.tsx
// ============================================================

import { useAppContext } from '../context/AppContext';
import { DIFFICULTY_OPTIONS, SUBTOPIC_OPTIONS } from '../constants';

export default function FilterBar() {
  const { state, dispatch } = useAppContext();
  const subtopicOptions = SUBTOPIC_OPTIONS[state.category] ?? [];

  return (
    <div className="flex gap-2 flex-shrink-0">
      {/* Difficulty filter — only meaningful for leetcode */}
      {state.category === 'leetcode' && (
        <select
          value={state.filterDifficulty}
          onChange={(e) =>
            dispatch({
              type: 'SET_FILTER_DIFFICULTY',
              payload: e.target.value as typeof state.filterDifficulty,
            })
          }
          className="px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {DIFFICULTY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Subtopic filter */}
      {subtopicOptions.length > 0 && (
        <select
          value={state.filterSubTopic}
          onChange={(e) =>
            dispatch({
              type: 'SET_FILTER_SUBTOPIC',
              payload: e.target.value,
            })
          }
          className="px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {subtopicOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
