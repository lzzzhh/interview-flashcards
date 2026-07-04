import { describe, expect, it } from 'vitest';
import { SUB_MODULES } from '../../constants';
import { leetcodeHot100 } from '../../data/leetcode-hot100.ts';
import { getLeetCodePrimarySubModuleKey } from '../leetcodeSubModules';

describe('leetcode sub-module assignment', () => {
  it('assigns each Hot 100 card to exactly one visible sub-module', () => {
    const counts = new Map<string, number>();

    for (const card of leetcodeHot100) {
      const key = getLeetCodePrimarySubModuleKey(card, SUB_MODULES.leetcode);
      expect(key).toBeTruthy();
      counts.set(key!, (counts.get(key!) ?? 0) + 1);
    }

    const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(100);
    expect(counts.get('lc-array')).toBe(12);
    expect(counts.get('lc-twopointer')).toBe(11);
    expect(counts.get('lc-binary')).toBe(7);
    expect(counts.get('lc-stack')).toBe(6);
    expect(counts.get('lc-other')).toBe(12);
  });
});
