import { describe, expect, it } from 'vitest';
import { getUpgradeRewardType } from './upgradeRules';

describe('getUpgradeRewardType', () => {
  it.each([5, 10, 15, 20])('returns skill rewards at level %i', level => {
    expect(getUpgradeRewardType(level)).toBe('skill');
  });

  it.each([2, 3, 4, 6, 9, 11])('returns attribute rewards at level %i', level => {
    expect(getUpgradeRewardType(level)).toBe('attribute');
  });
});
