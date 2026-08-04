export type ClassId = 'berserker' | 'frost-mage' | 'fire-mage' | 'beast-hunter';
export type BasicSkillId = 'whirlwind' | 'mortal-strike' | 'bloodthirst' | 'execute' | 'frostbolt' | 'frozen-orb' | 'ice-lance' | 'blizzard' | 'fireball' | 'flame-storm' | 'pyroblast' | 'kill-command';

export type BasicSkillDefinition = {
  id: BasicSkillId;
  name: string;
  description: string;
  weapon: string;
};

export const SKILL_SLOT_LAYOUT = { passive: 6, movement: 1, burst: 1 } as const;
export const WARRIOR_ACTIVE_SKILLS = {
  heroicLeap: { id: 'heroic-leap', name: '英勇跳跃', key: 'Space', cooldownMs: 15000, durationMs: 2000, speedBonus: .35, description: '向移动方向跳跃，并提高 35% 移动速度，持续 2 秒。' },
  shieldWall: { id: 'shield-wall', name: '盾墙', key: 'Q', cooldownMs: 30000, durationMs: 5000, damageReduction: .6, description: '降低所有受到的伤害 60%，持续 5 秒。' },
} as const;
export const FROST_MAGE_ACTIVE_SKILLS = {
  iceSkating: { id: 'ice-skating', name: '滑冰术', key: 'Space', cooldownMs: 12000, durationMs: 180, speedMultiplier: 10, description: '向当前移动方向以 1000% 速度滑行，结束后获得可抵挡一次伤害的免疫护甲。' },
  icyVeins: { id: 'icy-veins', name: '寒冰血脉', key: 'Q', cooldownMs: 60000, durationMs: 10000, hasteBonus: 30, damageBonus: .2, description: '所有技能释放速度提高 30%、伤害提高 20%，持续 10 秒。' },
} as const;

export type ClassDefinition = {
  id: ClassId;
  name: string;
  skill: string;
  fantasy: string;
  color: number;
  icon?: string;
  basicSkills: BasicSkillDefinition[];
};

export const CLASSES: ClassDefinition[] = [
  { id: 'berserker', name: '狂暴战士', skill: '旋风斩', fantasy: '贴身嗜血，以斩杀终结残血强敌', color: 0xd94a3d, icon: 'assets/player/fury-warrior.svg', basicSkills: [
    { id: 'whirlwind', name: '旋风斩', weapon: '双手战斧', description: '周期性旋转，持续打击身边的敌人。' },
    { id: 'mortal-strike', name: '致死打击', weapon: '重型战刃', description: '重创最近的近战目标，并施加 5 秒禁疗。' },
    { id: 'bloodthirst', name: '嗜血', weapon: '嗜血双斧', description: '快速近战攻击，命中有概率恢复生命。' },
    { id: 'execute', name: '斩杀', weapon: '处决巨斧', description: '攻击近战目标，对低生命敌人造成巨额伤害。' },
  ] },
  { id: 'frost-mage', name: '冰霜法师', skill: '寒冰箭', fantasy: '自动狙击最近敌人，减速并冻结猎物', color: 0x67c8ff, basicSkills: [
    { id: 'frostbolt', name: '寒冰箭', weapon: '霜语法杖', description: '发射寒冰箭攻击并减速最近的敌人。' },
    { id: 'frozen-orb', name: '寒冰宝珠', weapon: '凛冬法球', description: '射出缓慢移动的宝珠，对沿途怪物造成范围伤害并减速。' },
    { id: 'ice-lance', name: '冰枪术', weapon: '碎冰魔杖', description: '快速发射低伤害冰枪，对冻结目标造成 4 倍伤害。' },
    { id: 'blizzard', name: '冰风暴', weapon: '暴雪法典', description: '长冷却范围法术，每秒造成微量伤害并施加寒冰箭减速。' },
  ] },
  { id: 'fire-mage', name: '火焰法师', skill: '火球术', fantasy: '引燃目标，让火球逐步爆裂成火海', color: 0xff7a35, basicSkills: [
    { id: 'fireball', name: '火球术', weapon: '炎心法杖', description: '向最近的敌人发射高伤害火球。' },
    { id: 'flame-storm', name: '烈焰风暴', weapon: '焚天法典', description: '在目标处召唤火焰风暴，持续灼烧范围内敌人。' },
    { id: 'pyroblast', name: '炎爆术', weapon: '炎爆魔杖', description: '长冷却高伤害火球，并留下可以叠加的点燃。' },
  ] },
  { id: 'beast-hunter', name: '兽王猎人', skill: '杀戮命令', fantasy: '命令灵兽扑向最近敌人发动撕咬', color: 0x73c75b, basicSkills: [
    { id: 'kill-command', name: '杀戮命令', weapon: '驯兽号角', description: '命令灵兽扑向最近的敌人进行攻击。' },
  ] },
];

export const getClassDefinition = (id: ClassId) => CLASSES.find(item => item.id === id)!;
export const getBasicSkillDefinition = (classId: ClassId, skillId: BasicSkillId) => getClassDefinition(classId).basicSkills.find(skill => skill.id === skillId);
