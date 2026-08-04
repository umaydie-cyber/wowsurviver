import { describe, expect, it } from 'vitest';
import { combustionDamageMultiplier, FIRE_MAGE_SKILLS, isInFlameStorm, pyroblastIgniteDuration } from './FireMageSkills';

describe('火焰法师被动释放技能', () => {
  it('炽燃按等级将下一次火焰法术增伤 100% / 150% / 200%', () => {
    expect([1, 2, 3].map(combustionDamageMultiplier)).toEqual([2, 2.5, 3]);
    expect(FIRE_MAGE_SKILLS.combustion.requiredStacks).toBe(3);
  });

  it('烈焰风暴拥有长冷却、持续伤害和圆形范围', () => {
    expect(FIRE_MAGE_SKILLS.flameStorm.cooldownMs).toBeGreaterThanOrEqual(10000);
    expect(FIRE_MAGE_SKILLS.flameStorm.tickMs).toBe(1000);
    expect(isInFlameStorm(100, 100, 212, 100)).toBe(true);
    expect(isInFlameStorm(100, 100, 213, 100)).toBe(false);
  });

  it('炎爆术伤害高、冷却长，且点燃持续时间随等级提升', () => {
    expect(FIRE_MAGE_SKILLS.pyroblast.damageMultiplier).toBeGreaterThan(3);
    expect(FIRE_MAGE_SKILLS.pyroblast.cooldownMs).toBeGreaterThan(10000);
    expect([1, 2, 3].map(pyroblastIgniteDuration)).toEqual([4000, 6000, 8000]);
  });
});
