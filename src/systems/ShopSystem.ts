import { Player } from '../entities/Player';
import { Weapon, type SkillTalent } from '../combat/Weapon';
import { FROST_MAGE_ACTIVE_SKILLS, WARRIOR_ACTIVE_SKILLS, getBasicSkillDefinition } from '../classes';

export type ShopItem = {
  id: string;
  title: string;
  tag: '技能' | '属性' | '生存';
  description: string;
  cost: number;
  apply: () => boolean;
};

const SKILL_ITEMS: Omit<ShopItem, 'apply'>[] = [
  { id: 'heroic-leap', title: `位移技能：${WARRIOR_ACTIVE_SKILLS.heroicLeap.name}`, tag: '技能', description: `${WARRIOR_ACTIVE_SKILLS.heroicLeap.description}按空格使用，冷却 15 秒。`, cost: 48 },
  { id: 'shield-wall', title: `爆发技能：${WARRIOR_ACTIVE_SKILLS.shieldWall.name}`, tag: '技能', description: `${WARRIOR_ACTIVE_SKILLS.shieldWall.description}按 Q 使用，冷却 30 秒。`, cost: 52 },
  { id: 'ice-skating', title: `位移技能：${FROST_MAGE_ACTIVE_SKILLS.iceSkating.name}`, tag: '技能', description: `${FROST_MAGE_ACTIVE_SKILLS.iceSkating.description}按空格使用，冷却 12 秒。`, cost: 48 },
  { id: 'icy-veins', title: `爆发技能：${FROST_MAGE_ACTIVE_SKILLS.icyVeins.name}`, tag: '技能', description: `${FROST_MAGE_ACTIVE_SKILLS.icyVeins.description}按 Q 使用，冷却 60 秒。`, cost: 52 },
  { id: 'skill-damage', title: '技能强化：锋刃校准', tag: '技能', description: '当前自动技能伤害 +25%。同名强化不占用技能栏。', cost: 40 },
  { id: 'skill-speed', title: '技能强化：急速符文', tag: '技能', description: '当前自动技能冷却缩短，并小幅提高投射物速度。', cost: 44 },
  { id: 'skill-multishot', title: '技能：副手协同', tag: '技能', description: '远程职业额外发射 1 枚弹体；近战职业获得额外怒气效率。', cost: 52 },
  { id: 'skill-control', title: '技能：寒能牵引', tag: '技能', description: '提高控制或范围表现，让清怪更稳定。', cost: 48 },
];

const UTILITY_ITEMS: Omit<ShopItem, 'apply'>[] = [
  { id: 'stat-attack', title: '磨利武器', tag: '属性', description: '攻击强度 +8。', cost: 32 },
  { id: 'stat-spell', title: '聚能水晶', tag: '属性', description: '法术强度 +8。', cost: 32 },
  { id: 'stat-haste', title: '加速齿轮', tag: '属性', description: '急速 +8%。', cost: 36 },
  { id: 'stat-speed', title: '轻羽靴', tag: '属性', description: '速度 +8。', cost: 28 },
  { id: 'survive-maxhp', title: '耐久护符', tag: '生存', description: '最大生命 +18，并立即恢复 18 点生命。', cost: 36 },
  { id: 'survive-armor', title: '硬化护甲片', tag: '生存', description: '护甲 +10。', cost: 34 },
  { id: 'pickup-magnet', title: '微型磁石', tag: '属性', description: '拾取范围 +18，让材料无需完全贴身也能收入囊中。', cost: 28 },
  { id: 'pickup-net', title: '回收网', tag: '属性', description: '拾取范围 +28，并获得 3 艾泽里特返利。', cost: 40 },
  { id: 'pickup-lens', title: '探矿透镜', tag: '属性', description: '拾取范围 +16，经验获取 +5%。', cost: 44 },
];

export class ShopSystem {
  constructor(private player: Player, private weapon: Weapon) {}

  roll(wave: number): ShopItem[] {
    const skillPool = this.availableSkillItems;
    const skill = this.toItem(skillPool[wave % skillPool.length]);
    const pool = [...skillPool, ...UTILITY_ITEMS].filter(item => item.id !== skill.id);
    const items = [skill];
    while (items.length < 5 && pool.length) {
      const index = Math.floor(Math.random() * pool.length);
      items.push(this.toItem(pool.splice(index, 1)[0]));
    }
    return items;
  }

  rollReplacement(excludedIds: string[]): ShopItem {
    const available = [...this.availableSkillItems, ...UTILITY_ITEMS];
    const pool = available.filter(item => !excludedIds.includes(item.id));
    const candidates = pool.length ? pool : available;
    return this.toItem(candidates[Math.floor(Math.random() * candidates.length)]);
  }

  private get availableSkillItems() {
    const currentSkill = getBasicSkillDefinition(this.player.classId, this.weapon.basicSkillId)!;
    const skillCopy: Omit<ShopItem, 'apply'> = { id: `skill-copy-${currentSkill.id}`, title: `技能核心：${currentSkill.name}`, tag: '技能', description: `获得 1 个 1 级${currentSkill.name}。拖动两个同技能同等级核心可合成为高一级（最高 4 级）。`, cost: 38 };
    return [skillCopy, ...SKILL_ITEMS.filter(item => {
      if (item.id === 'heroic-leap') return this.player.classId === 'berserker' && !this.player.heroicLeapUnlocked;
      if (item.id === 'shield-wall') return this.player.classId === 'berserker' && !this.player.shieldWallUnlocked;
      if (item.id === 'ice-skating') return this.player.classId === 'frost-mage' && !this.player.iceSkatingUnlocked;
      if (item.id === 'icy-veins') return this.player.classId === 'frost-mage' && !this.player.icyVeinsUnlocked;
      return true;
    })];
  }

  private toItem(definition: Omit<ShopItem, 'apply'>): ShopItem {
    return { ...definition, apply: () => this.apply(definition.id) };
  }

  private apply(id: string) {
    if (id.startsWith('skill-copy-')) return this.weapon.addSkillCopy(this.weapon.basicSkillId);
    if (id === 'heroic-leap') { this.player.unlockHeroicLeap(); return true; }
    if (id === 'shield-wall') { this.player.unlockShieldWall(); return true; }
    if (id === 'ice-skating') { this.player.unlockIceSkating(); return true; }
    if (id === 'icy-veins') { this.player.unlockIcyVeins(); return true; }
    const talentMap: Record<string, SkillTalent> = {
      'skill-damage': 'damage',
      'skill-speed': 'speed',
      'skill-multishot': 'multishot',
      'skill-control': 'control',
    };
    if (talentMap[id]) {
      this.weapon.applyTalent(talentMap[id]);
      return true;
    }
    if (id === 'stat-attack') this.player.attackPower += 8;
    if (id === 'stat-spell') this.player.spellPower += 8;
    if (id === 'stat-haste') this.player.haste += 8;
    if (id === 'stat-speed') this.player.speed += 8;
    if (id === 'survive-maxhp') { this.player.maxHp += 18; this.player.heal(18); }
    if (id === 'survive-armor') this.player.armor += 10;
    if (id === 'pickup-magnet') this.player.pickupRange += 18;
    if (id === 'pickup-net') { this.player.pickupRange += 28; this.player.gainAzerite(3); }
    if (id === 'pickup-lens') { this.player.pickupRange += 16; this.player.xpRate += 5; }
    return true;
  }
}
