#!/usr/bin/env python3
"""Migrate LeetCode solution file keys from lc-NNN to lc-{leetcode#}"""
import re, os, shutil

SOL_DIR = os.path.expanduser("~/Desktop/interview-flashcards/src/data/leetcode/solutions")

# Build mapping from leetcode-hot100.ts
with open(os.path.expanduser("~/Desktop/interview-flashcards/src/data/leetcode-hot100.ts")) as f:
    ts = f.read()
numbers = re.findall(r"number:\s*(\d+)", ts)
old_format = [f"lc-{i:03d}" for i in range(1, 101)]
new_format = [f"lc-{n}" for n in numbers]
mapping = dict(zip(old_format, new_format))

files = ["python.ts", "java.ts", "cpp.ts", "go.ts", "javascript.ts"]

for fname in files:
    path = os.path.join(SOL_DIR, fname)
    shutil.copy2(path, path + ".backup.lc-id")
    with open(path) as f:
        content = f.read()

    count = 0
    for old, new in mapping.items():
        # Match exact key in quotes: 'lc-XXX'
        pattern = f"'{old}'"
        if pattern in content:
            content = content.replace(pattern, f"'{new}'")
            count += 1

    with open(path, "w") as f:
        f.write(content)
    print(f"✓ {fname}: {count} keys migrated")
