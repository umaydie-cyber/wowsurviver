import { describe, expect, it } from 'vitest';
import { bloodthirstHealing, executeDamageMultiplier, EXECUTE } from './BerserkerSkills';

describe('Bloodthirst', () => {
  it('heals a small amount only when its 30% roll succeeds', () => {
    expect(bloodthirstHealing(120, .29)).toBe(2.4);
    expect(bloodthirstHealing(120, .3)).toBe(0);
  });
});

describe('Execute', () => {
  it('uses only its base damage above 30% health', () => {
    expect(executeDamageMultiplier(31, 100)).toBe(EXECUTE.baseDamageMultiplier);
  });

  it('adds damage based on missing health at and below 30%', () => {
    expect(executeDamageMultiplier(30, 100)).toBeCloseTo(3.53);
    expect(executeDamageMultiplier(10, 100)).toBeCloseTo(4.21);
  });
});
