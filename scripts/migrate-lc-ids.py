#!/usr/bin/env python3
"""
Migrate LeetCode card IDs from sequential index (lc-001..lc-100)
to actual LeetCode problem numbers (lc-1..lc-1143).

Affected files:
  1. src/data/leetcode-hot100.ts  — source card data
  2. Documents/interview-flashcards/data.json — SM-2 progress
  3. Documents/interview-flashcards/data.backup.*.json — rolling backups
"""

import json
import os
import re
import shutil
import sys

# ── Paths ──────────────────────────────────────────────────────────────────
PROJECT_DIR = os.path.expanduser("~/Desktop/interview-flashcards")
DATA_DIR = os.path.expanduser("~/Documents/interview-flashcards")
TS_FILE = os.path.join(PROJECT_DIR, "src/data/leetcode-hot100.ts")
DATA_FILE = os.path.join(DATA_DIR, "data.json")

# ── Step 1: Build mapping ─────────────────────────────────────────────────

def build_mapping() -> dict[str, str]:
    """Parse leetcode-hot100.ts to build old_id → new_id mapping."""
    with open(TS_FILE) as f:
        content = f.read()

    old_ids = re.findall(r"id:\s*'(lc-\d+)'", content)
    numbers = re.findall(r"number:\s*(\d+)", content)

    if len(old_ids) != len(numbers) or len(old_ids) != 100:
        print(f"ERROR: Found {len(old_ids)} IDs and {len(numbers)} numbers, expected 100 each")
        sys.exit(1)

    mapping = {}
    for old_id, num in zip(old_ids, numbers):
        new_id = f"lc-{num}"
        mapping[old_id] = new_id

    # Validate uniqueness
    new_ids = list(mapping.values())
    if len(new_ids) != len(set(new_ids)):
        from collections import Counter
        dupes = [(k, v) for k, v in Counter(new_ids).items() if v > 1]
        print(f"ERROR: Duplicate new IDs: {dupes}")
        sys.exit(1)

    return mapping


# ── Step 2: Migrate TypeScript file ────────────────────────────────────────

def migrate_ts(mapping: dict[str, str]):
    """Replace all id: 'lc-XXX' lines with the new LeetCode-number-based IDs."""
    with open(TS_FILE) as f:
        content = f.read()

    # Backup
    backup = TS_FILE + ".backup.lc-id"
    shutil.copy2(TS_FILE, backup)
    print(f"✓ Backed up to {backup}")

    count = 0
    for old_id, new_id in mapping.items():
        # Match exactly: id: 'lc-XXX' (only replace the id line, not number line)
        pattern = f"id: '{old_id}'"
        replacement = f"id: '{new_id}'"
        if pattern in content:
            content = content.replace(pattern, replacement, 1)
            count += 1

    with open(TS_FILE, "w") as f:
        f.write(content)

    print(f"✓ {TS_FILE}: {count} IDs migrated")


# ── Step 3: Migrate JSON progress file ─────────────────────────────────────

def migrate_json(filepath: str, mapping: dict[str, str], backup: bool = True):
    """Rename all fc-leetcode-progress keys in a data.json file."""
    with open(filepath) as f:
        data = json.load(f)

    progress = data.get("progress", {})
    leetcode_key = "fc-leetcode-progress"

    if leetcode_key not in progress:
        print(f"  ⚠ No {leetcode_key} found in {filepath}")
        return 0

    sm2 = progress[leetcode_key].get("sm2", {})
    if not sm2:
        print(f"  ⚠ Empty sm2 block in {filepath}")
        return 0

    # Rename keys
    count = 0
    new_sm2 = {}
    for old_id, value in sm2.items():
        if old_id in mapping:
            new_sm2[mapping[old_id]] = value
            count += 1
        else:
            # Already in new format or unrelated — keep as-is
            new_sm2[old_id] = value

    progress[leetcode_key]["sm2"] = new_sm2

    # Backup
    if backup:
        backup_path = filepath + ".backup.lc-id"
        shutil.copy2(filepath, backup_path)
        print(f"  ✓ Backed up to {backup_path}")

    with open(filepath, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    return count


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  LeetCode Card ID Migration")
    print("  lc-NNN (sequential) → lc-{LeetCode#} (actual)")
    print("=" * 60)

    # Build mapping
    print("\n[1/3] Building ID mapping...")
    mapping = build_mapping()
    changed = sum(1 for o, n in mapping.items() if o != n)
    print(f"  100 cards found, {changed} need remapping (99 + lc-001 stays)")
    print(f"  Sample: lc-008 → {mapping['lc-008']} (Trapping Rain Water #42)")

    # Migrate TS source
    print("\n[2/3] Migrating TypeScript source...")
    migrate_ts(mapping)

    # Migrate JSON files
    print("\n[3/3] Migrating JSON progress data...")
    json_files = [DATA_FILE]
    # Also find backup files
    for i in range(1, 11):
        backup_path = os.path.join(DATA_DIR, f"data.backup.{i}.json")
        if os.path.exists(backup_path):
            json_files.append(backup_path)

    for jf in json_files:
        name = os.path.basename(jf)
        count = migrate_json(jf, mapping, backup=(jf == DATA_FILE))
        if count > 0:
            print(f"  ✓ {name}: {count} progress entries migrated")
        else:
            print(f"  - {name}: no entries to migrate")

    print("\n" + "=" * 60)
    print("  Migration complete!")
    print(f"  Backup files: *.backup.lc-id")
    print("  Run the app to verify LeetCode cards display correctly.")
    print("=" * 60)


if __name__ == "__main__":
    main()
