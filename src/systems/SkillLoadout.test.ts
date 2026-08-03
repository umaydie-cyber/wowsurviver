import { describe, expect, it } from 'vitest';
import { getSkillRankEffects, SkillLoadout } from './SkillLoadout';
describe('SkillLoadout', () => {
  it('provides six slots and merges equal skills of equal rank', () => {
    const loadout = new SkillLoadout('frost-mage', 'frostbolt');
    expect(loadout.slots).toHaveLength(6); expect(loadout.add('frostbolt')).toBe(true); expect(loadout.moveOrMerge(1, 0)).toBe(true);
    expect(loadout.slots[0]).toEqual({ skillId: 'frostbolt', rank: 2 }); expect(loadout.slots[1]).toBeNull();
  });
  it('swaps instead of merging at rank four', () => {
    const loadout = new SkillLoadout('berserker', 'whirlwind'); loadout.slots[0] = { skillId: 'whirlwind', rank: 4 }; loadout.add('whirlwind'); loadout.moveOrMerge(1, 0);
    expect(loadout.slots[0]?.rank).toBe(1); expect(loadout.slots[1]?.rank).toBe(4);
  });
  it('improves damage, range and frequency', () => { const rank4 = getSkillRankEffects(4); expect(rank4.damageMultiplier).toBeCloseTo(2.05); expect(rank4.rangeMultiplier).toBeCloseTo(1.36); expect(rank4.cooldownMultiplier).toBeCloseTo(.729); });
});
