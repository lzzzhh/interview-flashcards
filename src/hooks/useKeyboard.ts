// ============================================================
// src/hooks/useKeyboard.ts — 键盘快捷键
// ============================================================

import { useEffect } from 'react';
import type { AppAction } from '../types';

interface KeyboardConfig {
  dispatch: React.Dispatch<AppAction>;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  getCurrentCardId?: () => string | null;
}

export function useKeyboard({ dispatch, searchInputRef, getCurrentCardId }: KeyboardConfig) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in input/textarea
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Arrow keys: always work (even in input, for navigation between fields could be, but we want card nav)
      if (!isInput) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          dispatch({ type: 'PREV' });
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          dispatch({ type: 'NEXT' });
          return;
        }
      }

      // Space to toggle QA answer / LeetCode approach
      if (!isInput && e.key === ' ') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_QA_ANSWER' });
        dispatch({ type: 'TOGGLE_APPROACH' });
        return;
      }

      // S or C to toggle code
      if (!isInput && (e.key === 's' || e.key === 'c' || e.key === 'S' || e.key === 'C')) {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_CODE' });
        return;
      }

      // M to toggle mastered
      if (!isInput && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_MASTERED' });
        return;
      }

      // F to toggle favorite
      if (!isInput && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        const id = getCurrentCardId?.();
        if (id) dispatch({ type: 'TOGGLE_FAVORITE', payload: id });
        return;
      }

      // D to toggle dark mode
      if (!isInput && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_DARK' });
        return;
      }

      // 1-5 for SM-2 rating
      if (!isInput && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        dispatch({ type: 'RATE_CARD', payload: parseInt(e.key) as 1 | 2 | 3 | 4 | 5 });
        return;
      }

      // / to focus search
      if (!isInput && e.key === '/') {
        e.preventDefault();
        searchInputRef?.current?.focus();
        return;
      }

      // Escape to close stats / blur search
      if (e.key === 'Escape') {
        dispatch({ type: 'TOGGLE_STATS' });
        if (isInput && searchInputRef?.current) {
          searchInputRef.current.blur();
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, searchInputRef]);
}
