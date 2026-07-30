import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, getDifficulty } from './difficulty';

describe('difficulty balance', () => {
  it('uses the five requested minimum skill-hit rates', () => {
    expect(DIFFICULTIES.map(item => item.requiredAccuracy)).toEqual([20, 40, 60, 75, 90]);
  });

  it('keeps difficulty 3 as baseline and scales health with hit requirement', () => {
    expect(getDifficulty(3).enemyHealthMultiplier).toBe(1);
    expect(getDifficulty(1).enemyHealthMultiplier).toBeCloseTo(20 / 60);
    expect(getDifficulty(5).enemyHealthMultiplier).toBeCloseTo(90 / 60);
  });
});
