import type { SubModuleMeta } from '../constants';
import { LEETCODE_PRIMARY_SUBMODULE_BY_ID } from '../data/leetcode-hot100.ts';
import type { FlashCard } from '../types';

type LeetCodeSubModule = Pick<SubModuleMeta, 'key' | 'tags'>;

function hasMatchingTag(card: FlashCard, subModule: LeetCodeSubModule): boolean {
  return !!subModule.tags?.length && (card.tags ?? []).some((tag) => subModule.tags!.includes(tag));
}

export function getLeetCodePrimarySubModuleKey(
  card: FlashCard,
  subModules: LeetCodeSubModule[],
): string | null {
  if (card.category !== 'leetcode') return null;

  const activeKeys = new Set(subModules.map((subModule) => subModule.key));
  const mappedKey = LEETCODE_PRIMARY_SUBMODULE_BY_ID[card.id];
  if (mappedKey && activeKeys.has(mappedKey)) return mappedKey;

  const taggedModules = subModules.filter((subModule) => subModule.tags?.length);
  const fallbackOrder = [
    ...taggedModules.filter((subModule) => subModule.key !== 'lc-array'),
    ...taggedModules.filter((subModule) => subModule.key === 'lc-array'),
  ];
  const matched = fallbackOrder.find((subModule) => hasMatchingTag(card, subModule));
  if (matched) return matched.key;

  return subModules.find((subModule) => !subModule.tags?.length)?.key ?? null;
}

export function leetCodeCardMatchesSubModule(
  card: FlashCard,
  subModule: LeetCodeSubModule,
  subModules: LeetCodeSubModule[],
): boolean {
  return getLeetCodePrimarySubModuleKey(card, subModules) === subModule.key;
}
