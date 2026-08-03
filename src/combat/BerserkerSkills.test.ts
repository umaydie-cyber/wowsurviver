import { describe, expect, it } from 'vitest';
import { bloodthirstHealing, deepWoundsTickDamage, executeDamageMultiplier, EXECUTE, rotationalMomentumBonus } from './BerserkerSkills';

describe('Bloodthirst', () => {
  it('heals a small amount only when its 30% roll succeeds', () => {
    expect(bloodthirstHealing(120, .29)).toBe(2.4);
    expect(bloodthirstHealing(120, .3)).toBe(0);
  });
});

describe('dual-skill talents', () => {
  it('scales the next Mortal Strike from Whirlwind hits at 5/7/9% per hit', () => {
    expect(rotationalMomentumBonus(1, 6)).toBeCloseTo(.3);
    expect(rotationalMomentumBonus(2, 6)).toBeCloseTo(.42);
    expect(rotationalMomentumBonus(3, 6)).toBeCloseTo(.54);
  });

  it('scales Deep Wounds with rank, attack power, and haste', () => {
    expect(deepWoundsTickDamage(1, 100, 25)).toBe(15);
    expect(deepWoundsTickDamage(2, 100, 25)).toBe(22.5);
    expect(deepWoundsTickDamage(3, 100, 25)).toBe(30);
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
