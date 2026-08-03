import { describe, expect, it } from 'vitest';
import { CLASSES, FROST_MAGE_ACTIVE_SKILLS, getBasicSkillDefinition, getClassDefinition, SKILL_SLOT_LAYOUT, WARRIOR_ACTIVE_SKILLS } from './classes';

describe('基础输出技能配置', () => {
  it('每个职业都至少提供一个可选初始武器', () => {
    expect(CLASSES.every(definition => definition.basicSkills.length > 0)).toBe(true);
  });

  it('狂暴战士列出四个已实现的基础输出技能', () => {
    expect(getClassDefinition('berserker').basicSkills.map(skill => skill.id)).toEqual([
      'whirlwind', 'mortal-strike', 'bloodthirst', 'execute',
    ]);
    expect(getBasicSkillDefinition('berserker', 'bloodthirst')?.weapon).toBe('嗜血双斧');
  });

  it('不会从错误职业解析基础技能', () => {
    expect(getBasicSkillDefinition('fire-mage', 'frostbolt')).toBeUndefined();
  });

  it('冰霜法师列出寒冰箭、寒冰宝珠、冰枪术和冰风暴', () => {
    expect(getClassDefinition('frost-mage').basicSkills.map(skill => skill.id)).toEqual([
      'frostbolt', 'frozen-orb', 'ice-lance', 'blizzard',
    ]);
  });
});

describe('技能槽与战士主动技能配置', () => {
  it('使用 4 被动释放、1 位移和 1 爆发技能槽', () => {
    expect(SKILL_SLOT_LAYOUT).toEqual({ passive: 4, movement: 1, burst: 1 });
  });
  it('英勇跳跃与盾墙使用指定按键和冷却', () => {
    expect(WARRIOR_ACTIVE_SKILLS.heroicLeap).toMatchObject({ key: 'Space', cooldownMs: 15000, durationMs: 2000 });
    expect(WARRIOR_ACTIVE_SKILLS.shieldWall).toMatchObject({ key: 'Q', cooldownMs: 30000, durationMs: 5000, damageReduction: .6 });
  });
  it('滑冰术提供十倍滑行速度，寒冰血脉强化急速与伤害 10 秒', () => {
    expect(FROST_MAGE_ACTIVE_SKILLS.iceSkating).toMatchObject({ key: 'Space', speedMultiplier: 10 });
    expect(FROST_MAGE_ACTIVE_SKILLS.icyVeins).toMatchObject({ key: 'Q', durationMs: 10000, hasteBonus: 30, damageBonus: .2 });
  });
});
