import { describe, it, expect, beforeEach } from 'vitest';
import { createLocalBackup, listBackups, restoreBackup } from '../backup';

describe('localStorage backup system', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create a backup snapshot of current localStorage', () => {
    localStorage.setItem('fc-stats-progress', JSON.stringify({ sm2: { 'card-1': { state: 'review', interval: 7 } }, mastered: [], favorited: [] }));
    localStorage.setItem('fc-settings', JSON.stringify({ isDark: true, lastCategory: 'leetcode' }));

    createLocalBackup();

    const backups = listBackups();
    expect(backups.length).toBeGreaterThanOrEqual(1);
    expect(backups[0].timestamp).toBeDefined();
  });

  it('should rotate backups without exceeding max', () => {
    // Create 12 backups (exceed MAX_BACKUPS=10)
    for (let i = 0; i < 12; i++) {
      localStorage.setItem('fc-settings', JSON.stringify({ version: i }));
      createLocalBackup();
    }

    const backups = listBackups();
    // Should have at most MAX_BACKUPS
    expect(backups.length).toBeLessThanOrEqual(10);
  });

  it('should restore data from a backup', () => {
    localStorage.setItem('fc-original', JSON.stringify({ value: 'hello' }));
    createLocalBackup();

    // Modify the data
    localStorage.setItem('fc-original', JSON.stringify({ value: 'corrupted' }));

    const backups = listBackups();
    const result = restoreBackup(backups[0].slot);
    expect(result).toBe(true);

    // After restore, the original value should be back
    const restored = JSON.parse(localStorage.getItem('fc-original') || '{}');
    expect(restored.value).toBe('hello');
  });

  it('should return false when restoring non-existent backup', () => {
    const result = restoreBackup(99);
    expect(result).toBe(false);
  });
});
