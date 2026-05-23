#!/usr/bin/env python3
"""Evaluation dataset cleanup — P0/P1/P2 in one pass."""
import json, re
from collections import defaultdict

with open('src/evaluation/test-cases.ts') as f:
    content = f.read()

fix_count = 0

# ════════════════════ P0-1: Remove duplicate secondaryIds ════════════════════

fixes_p01 = [
    # L180: secondaryIds: ["lc-056"], secondaryIds: [] → secondaryIds: ["lc-056"]
    ('secondaryIds: [\"lc-056\"], secondaryIds: []', 'secondaryIds: [\"lc-056\"]'),
    # L182: secondaryIds: [], secondaryIds: [] → secondaryIds: []
    # Need to find exact match — two empty arrays
    ('secondaryIds: [], secondaryIds: []', 'secondaryIds: []'),
    # L236: same as L180
    # (already handled by first rule since it's identical)
    # L238: same as L182
    # (already handled)
    # L261: secondaryIds: [\"agent-19\"], secondaryIds: [] → secondaryIds: [\"agent-19\"]
    ('secondaryIds: [\"agent-19\"], secondaryIds: []', 'secondaryIds: [\"agent-19\"]'),
]

for old, new in fixes_p01:
    n = content.count(old)
    if n > 0:
        content = content.replace(old, new)
        fix_count += n
        print(f'P0-1: Fixed {n}x duplicate secondaryIds')

# ════════════════════ P0-2: Fix dl-4 overlap ════════════════════

# L247: primaryIds: ["dl-4"], secondaryIds: ["dl-4"]
old = 'primaryIds: [\"dl-4\"], secondaryIds: [\"dl-4\"]'
new = 'primaryIds: [\"dl-4\"], secondaryIds: []'
n = content.count(old)
if n > 0:
    content = content.replace(old, new)
    fix_count += n
    print(f'P0-2: Fixed {n}x dl-4 overlap')

# ════════════════════ P0-3: Fix deck mismatches ════════════════════

deck_fixes = [
    # 余弦相似度 L261 — ml-59 (ML), agent-19 (agent) → decks should be ML+agent, not statistics
    ('余弦相似度\", group: \"关键词-统计学\", primaryIds: [\"ml-59\"], secondaryIds: [\"agent-19\"], acceptableDecks: [\"statistics\"]',
     '余弦相似度\", group: \"关键词-统计学\", primaryIds: [\"ml-59\"], secondaryIds: [\"agent-19\"], acceptableDecks: [\"machine-learning\",\"agent\"]'),
    
    # 大模型为什么胡编乱造 — agent-10,agent-11 (agent) → add agent to decks
    ('大模型为什么胡编乱造\", group: \"概念-大模型\", primaryIds: [\"agent-10\",\"agent-11\"], secondaryIds: [], acceptableDecks: [\"llm\"]',
     '大模型为什么胡编乱造\", group: \"概念-大模型\", primaryIds: [\"agent-10\",\"agent-11\"], secondaryIds: [], acceptableDecks: [\"llm\",\"agent\"]'),
    
    # 怎么判断两个变量之间有没有关系 — ml-1 secondary is ML → add ML
    ('怎么判断两个变量之间有没有关系\", group: \"概念-统计学\", primaryIds: [\"stats-115\",\"stats-138\"], secondaryIds: [\"stats-140\",\"ml-1\"], acceptableDecks: [\"statistics\"]',
     '怎么判断两个变量之间有没有关系\", group: \"概念-统计学\", primaryIds: [\"stats-115\",\"stats-138\"], secondaryIds: [\"stats-140\",\"ml-1\"], acceptableDecks: [\"statistics\",\"machine-learning\"]'),
    
    # 为什么Transformer比RNN快 — dl-9 secondary is DL → add DL
    ('为什么Transformer比RNN快\", group: \"概念-大模型\", primaryIds: [\"llm-1\",\"llm-2\"], secondaryIds: [\"llm-38\",\"dl-9\"], acceptableDecks: [\"llm\"]',
     '为什么Transformer比RNN快\", group: \"概念-大模型\", primaryIds: [\"llm-1\",\"llm-2\"], secondaryIds: [\"llm-38\",\"dl-9\"], acceptableDecks: [\"llm\",\"deep-learning\"]'),
    
    # Agent和LLM到底什么关系 — llm-16 secondary is LLM → add LLM
    ('Agent和LLM到底什么关系\", group: \"概念-Agent\", primaryIds: [\"agent-1\",\"agent-2\"], secondaryIds: [\"agent-21\",\"llm-16\"], acceptableDecks: [\"agent\"]',
     'Agent和LLM到底什么关系\", group: \"概念-Agent\", primaryIds: [\"agent-1\",\"agent-2\"], secondaryIds: [\"agent-21\",\"llm-16\"], acceptableDecks: [\"agent\",\"llm\"]'),
    
    # BatchNorm和LayerNorm — llm-38 secondary is LLM → add LLM
    ('BatchNorm和LayerNorm什么时候用哪个\", group: \"跨模块-深度vs大模型\", primaryIds: [\"dl-21\",\"dl-22\"], secondaryIds: [\"dl-3\",\"llm-38\"], acceptableDecks: [\"deep-learning\"]',
     'BatchNorm和LayerNorm什么时候用哪个\", group: \"跨模块-深度vs大模型\", primaryIds: [\"dl-21\",\"dl-22\"], secondaryIds: [\"dl-3\",\"llm-38\"], acceptableDecks: [\"deep-learning\",\"llm\"]'),
    
    # RNN和Transformer大不同 — llm-38 secondary is LLM → add LLM
    ('RNN和Transformer大不同\", group: \"跨模块-深度vs大模型\", primaryIds: [\"dl-24\",\"dl-7\"], secondaryIds: [\"dl-9\",\"llm-38\"], acceptableDecks: [\"deep-learning\"]',
     'RNN和Transformer大不同\", group: \"跨模块-深度vs大模型\", primaryIds: [\"dl-24\",\"dl-7\"], secondaryIds: [\"dl-9\",\"llm-38\"], acceptableDecks: [\"deep-learning\",\"llm\"]'),
    
    # 怎么搞懂反向传播 — ml-1,ml-106 secondary are ML → add ML
    ('怎么搞懂反向传播\", group: \"回归-对抗\", primaryIds: [\"dl-2\",\"dl-5\"], secondaryIds: [\"ml-1\",\"ml-106\"], acceptableDecks: [\"deep-learning\"]',
     '怎么搞懂反向传播\", group: \"回归-对抗\", primaryIds: [\"dl-2\",\"dl-5\"], secondaryIds: [\"ml-1\",\"ml-106\"], acceptableDecks: [\"deep-learning\",\"machine-learning\"]'),
]

for old, new in deck_fixes:
    if new is None or old is None:
        continue
    n = content.count(old)
    if n > 0:
        content = content.replace(old, new)
        fix_count += n
        try:
            idx_q = old.index('query')
            idx_g = old.index('group')
            print(f'P0-3: Fixed {n}x deck mismatch: {old[idx_q:idx_g-3]}')
        except ValueError:
            print(f'P0-3: Fixed {n}x deck mismatch (query text embedded)')

print(f'\nP0 total fixes: {fix_count}')

# ════════════════════ P1: Deduplicate query+group ════════════════════

# Extract the array content between [ and ];
start = content.index('export const TEST_CASES')
start = content.index('[', start)
end = content.rindex('];')
array_str = content[start:end+1]

# Manually parse each object
entries = []
depth = 0
current = ''
for ch in array_str:
    if ch == '{':
        if depth == 0:
            current = '{'
        else:
            current += ch
        depth += 1
    elif ch == '}':
        depth -= 1
        current += ch
        if depth == 0:
            entries.append(current)
            current = ''
    elif depth > 0:
        current += ch

print(f'\nParsed {len(entries)} entries')

# Parse each entry
parsed = []
for e in entries:
    try:
        # Convert TS object to JSON-compatible
        s = e.strip().rstrip(',').strip()
        # simple extraction with regex
        qm = re.search(r'query:\s*"([^"]*)"', s)
        gm = re.search(r'group:\s*"([^"]*)"', s)
        pm = re.search(r'primaryIds:\s*\[([^\]]*)\]', s)
        sm = re.search(r'secondaryIds:\s*\[([^\]]*)\]', s)
        dm = re.search(r'acceptableDecks:\s*\[([^\]]*)\]', s)
        cm = re.search(r'acceptableConcepts:\s*\[([^\]]*)\]', s)
        if qm and gm:
            parsed.append({
                'query': qm.group(1),
                'group': gm.group(1),
                'primaryIds': [x.strip().strip('"') for x in pm.group(1).split(',') if x.strip()] if pm else [],
                'secondaryIds': [x.strip().strip('"') for x in sm.group(1).split(',') if x.strip()] if sm else [],
                'decks': [x.strip().strip('"') for x in dm.group(1).split(',') if x.strip()] if dm else [],
                'concepts': [x.strip().strip('"') for x in cm.group(1).split(',') if x.strip()] if cm else [],
            })
    except:
        pass

print(f'Parsed {len(parsed)} valid entries')

# Group by (query, group)
by_key = defaultdict(list)
for p in parsed:
    by_key[(p['query'], p['group'])].append(p)

dupes = {k: v for k, v in by_key.items() if len(v) > 1}
print(f'Duplicate (query, group) pairs: {len(dupes)}')

merged_count = 0
for (query, group), entries_list in dupes.items():
    # Merge: union primaryIds, union secondaryIds, union decks, union concepts
    all_primary = []
    all_secondary = []
    all_decks = []
    all_concepts = []
    for e in entries_list:
        all_primary.extend(e['primaryIds'])
        all_secondary.extend(e['secondaryIds'])
        all_decks.extend(e['decks'])
        all_concepts.extend(e['concepts'])
    
    # Deduplicate primaryIds
    unique_primary = list(dict.fromkeys(all_primary))
    # Secondary: remove any that are also in primary
    unique_secondary = [s for s in dict.fromkeys(all_secondary) if s not in unique_primary]
    # Dedup decks & concepts
    unique_decks = list(dict.fromkeys(all_decks))
    unique_concepts = list(dict.fromkeys(all_concepts))
    
    parsed = [p for p in parsed if not (p['query'] == query and p['group'] == group)]
    parsed.append({
        'query': query,
        'group': group,
        'primaryIds': unique_primary,
        'secondaryIds': unique_secondary,
        'decks': unique_decks,
        'concepts': unique_concepts,
    })
    merged_count += len(entries_list) - 1

print(f'Removed {merged_count} duplicate entries')
print(f'After dedup: {len(parsed)} entries')

# ════════════════════ P2: Fix learning-path acceptableDecks ════════════════════

for p in parsed:
    g = p['group']
    if g != 'learning-path' and not g.startswith('学习路径') and not g.startswith('学习路径-'):
        continue
    
    # Get all card decks from primaryIds + secondaryIds
    # We need DB lookup, but for now we can add decks that match primary/secondary card prefixes
    # Actually, just make sure the acceptableDecks includes all plausible decks
    # For learning-path: always include the main deck as acceptable
    # If secondaryIds mention cards from other decks, add those too
    
    # The simplest fix: ensure the primary deck is always included
    # We can't look up card decks without DB, but we know the card ID prefixes:
    # lc- → leetcode, stats- → statistics, ml- → machine-learning
    # dl- → deep-learning, llm- → llm, agent- → agent, vc- → vibe-coding
    # wp- → workplace, jargon- → jargon
    
    prefix_map = {
        'lc-': 'leetcode', 'stats-': 'statistics', 'ml-': 'machine-learning',
        'dl-': 'deep-learning', 'llm-': 'llm', 'agent-': 'agent',
        'vc-': 'vibe-coding', 'wp-': 'workplace', 'jargon-': 'jargon',
    }
    
    decks_needed = set(p['decks'])
    for pid in p['primaryIds'] + p['secondaryIds']:
        for prefix, deck in prefix_map.items():
            if pid.startswith(prefix):
                decks_needed.add(deck)
    
    p['decks'] = sorted(decks_needed)

# Count how many learning-path entries had decks expanded
lp_count = sum(1 for p in parsed if p['group'] == 'learning-path' or p['group'].startswith('学习路径'))
print(f'\nP2: {lp_count} learning-path entries with expanded acceptableDecks')

# ════════════════════ Rebuild file ════════════════════

lines = []
lines.append('// backend/src/evaluation/test-cases.ts — ' + str(len(parsed)) + ' 条 AI 搜索评测测试集')
lines.append('//')
lines.append('// Cleaned: P0-1 duplicate secondaryIds, P0-2 dl-4 overlap, P0-3 deck mismatches,')
lines.append('//         P1 deduplication, P2 learning-path cross-deck coverage')
lines.append('//')
lines.append('// 牌组 ID：leetcode=力扣, statistics=统计学, machine-learning=机器学习')
lines.append('//          deep-learning=深度学习, llm=大模型, agent=Agent')
lines.append('//          vibe-coding=Vibe Coding, jargon=黑话, workplace=职场')
lines.append('')
lines.append("import type { TestCase } from './types';")
lines.append('')
lines.append('export const TEST_CASES: TestCase[] = [')
lines.append('')

# Sort by group then query
parsed.sort(key=lambda x: (x['group'], x['query']))

current_group = None
for p in parsed:
    if p['group'] != current_group:
        current_group = p['group']
        lines.append(f'  // ── {current_group} ──')
        lines.append('')
    
    pid_str = json.dumps(p['primaryIds'])
    sid_str = json.dumps(p['secondaryIds'])
    deck_str = json.dumps(p['decks'])
    concept_str = json.dumps(p['concepts'])
    
    lines.append(f'  {{ query: {json.dumps(p["query"])}, group: {json.dumps(p["group"])}, primaryIds: {pid_str}, secondaryIds: {sid_str}, acceptableDecks: {deck_str}, acceptableConcepts: {concept_str} }},')
    lines.append('')

lines.append('];')
lines.append('')

with open('src/evaluation/test-cases.ts', 'w') as f:
    f.write('\n'.join(lines))

print(f'\nFinal file: {len(parsed)} test cases')
