import { describe, expect, it } from 'vitest';
import { FROST_MAGE_SKILLS, iceLanceDamageMultiplier } from './FrostMageSkills';

describe('冰霜法师被动释放技能', () => {
  it('冰枪术对冻结目标造成四倍伤害', () => {
    expect(iceLanceDamageMultiplier(true)).toBe(iceLanceDamageMultiplier(false) * 4);
  });

  it('寒冰宝珠采用低到中等伤害并能持续穿行', () => {
    expect(FROST_MAGE_SKILLS.frozenOrb.damageMultiplier).toBeGreaterThan(.5);
    expect(FROST_MAGE_SKILLS.frozenOrb.damageMultiplier).toBeLessThan(1);
    expect(FROST_MAGE_SKILLS.frozenOrb.lifetimeMs).toBeGreaterThan(2000);
  });
});
