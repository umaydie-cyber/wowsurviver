import { describe, expect, it } from 'vitest';
import { formatTime, nextXpRequirement } from './progression';

describe('progression utilities', () => {
  it('increases experience requirements by thirty percent', () => {
    expect(nextXpRequirement(40)).toBe(52);
  });

  it('formats battle time', () => {
    expect(formatTime(305)).toBe('05:05');
  });
});
