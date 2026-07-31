import { describe, expect, it } from 'vitest';
import { CLASSES, getBasicSkillDefinition, getClassDefinition } from './classes';

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
});
