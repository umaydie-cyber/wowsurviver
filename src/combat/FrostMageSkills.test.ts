import { describe, expect, it } from 'vitest';
import { FROST_MAGE_SKILLS, iceLanceDamageMultiplier, isInBlizzard } from './FrostMageSkills';

describe('冰霜法师被动释放技能', () => {
  it('冰枪术对冻结目标造成四倍伤害', () => {
    expect(iceLanceDamageMultiplier(true)).toBe(iceLanceDamageMultiplier(false) * 4);
  });

  it('寒冰宝珠采用低到中等伤害并能持续穿行', () => {
    expect(FROST_MAGE_SKILLS.frozenOrb.damageMultiplier).toBeGreaterThan(.5);
    expect(FROST_MAGE_SKILLS.frozenOrb.damageMultiplier).toBeLessThan(1);
    expect(FROST_MAGE_SKILLS.frozenOrb.lifetimeMs).toBeGreaterThan(2000);
  });

  it('冰风暴采用长冷却，每秒造成微量伤害并继承寒冰箭减速', () => {
    expect(FROST_MAGE_SKILLS.blizzard.cooldownMs).toBeGreaterThanOrEqual(10000);
    expect(FROST_MAGE_SKILLS.blizzard.tickMs).toBe(1000);
    expect(FROST_MAGE_SKILLS.blizzard.damageMultiplier).toBeLessThan(.25);
    expect(FROST_MAGE_SKILLS.blizzard.slow).toBe(FROST_MAGE_SKILLS.frostbolt.slow);
  });

  it('冰风暴只命中目标圆形范围内的单位', () => {
    expect(isInBlizzard(100, 100, 100 + FROST_MAGE_SKILLS.blizzard.radius, 100)).toBe(true);
    expect(isInBlizzard(100, 100, 100 + FROST_MAGE_SKILLS.blizzard.radius + 1, 100)).toBe(false);
  });
});
