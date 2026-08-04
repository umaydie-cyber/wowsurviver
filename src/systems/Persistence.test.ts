import { describe, expect, it } from 'vitest';
import { emptySave, parseSave, updateProgress } from './Persistence';

describe('cookie persistence', () => {
  it('falls back safely when a cookie is missing or corrupt', () => {
    expect(parseSave(undefined)).toEqual(emptySave());
    expect(parseSave('%broken')).toEqual(emptySave());
  });

  it('tracks highest wave, map completion and achievements without duplicates', () => {
    const save = emptySave();
    updateProgress(save, 8, 'barrens'); updateProgress(save, 10, 'barrens');
    expect(save.profile.highestWave).toBe(10);
    expect(save.profile.completedMaps).toEqual(['barrens']);
    expect(save.profile.achievements).toEqual(['first-wave', 'boss-slayer', 'wave-10']);
  });

  it('does not grant boss rewards after a timed-out boss wave', () => {
    const save = emptySave();
    updateProgress(save, 8, 'barrens', false);
    updateProgress(save, 9, 'barrens');

    expect(save.profile.highestWave).toBe(9);
    expect(save.profile.completedMaps).toEqual([]);
    expect(save.profile.achievements).toEqual(['first-wave']);
  });
});
