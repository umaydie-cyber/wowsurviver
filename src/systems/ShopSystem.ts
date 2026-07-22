import { Player } from '../entities/Player';
import { Weapon, type SkillTalent } from '../combat/Weapon';

export type ShopItem = {
  id: string;
  title: string;
  tag: '技能' | '属性' | '生存';
  description: string;
  cost: number;
  apply: () => void;
};

const SKILL_ITEMS: Omit<ShopItem, 'apply'>[] = [
  { id: 'skill-damage', title: '技能强化：锋刃校准', tag: '技能', description: '当前自动技能伤害 +25%。同名强化不占用技能栏。', cost: 18 },
  { id: 'skill-speed', title: '技能强化：急速符文', tag: '技能', description: '当前自动技能冷却缩短，并小幅提高投射物速度。', cost: 20 },
  { id: 'skill-multishot', title: '技能：副手协同', tag: '技能', description: '远程职业额外发射 1 枚弹体；近战职业获得额外怒气效率。', cost: 24 },
  { id: 'skill-control', title: '技能：寒能牵引', tag: '技能', description: '提高控制或范围表现，让清怪更稳定。', cost: 22 },
];

const UTILITY_ITEMS: Omit<ShopItem, 'apply'>[] = [
  { id: 'stat-attack', title: '磨利武器', tag: '属性', description: '攻击强度 +8。', cost: 14 },
  { id: 'stat-spell', title: '聚能水晶', tag: '属性', description: '法术强度 +8。', cost: 14 },
  { id: 'stat-haste', title: '加速齿轮', tag: '属性', description: '急速 +8%。', cost: 16 },
  { id: 'stat-speed', title: '轻羽靴', tag: '属性', description: '速度 +8。', cost: 12 },
  { id: 'survive-maxhp', title: '耐久护符', tag: '生存', description: '最大生命 +18，并立即恢复 18 点生命。', cost: 16 },
  { id: 'survive-armor', title: '硬化护甲片', tag: '生存', description: '护甲 +10。', cost: 15 },
];

export class ShopSystem {
  constructor(private player: Player, private weapon: Weapon) {}

  roll(wave: number): ShopItem[] {
    const skill = this.toItem(SKILL_ITEMS[wave % SKILL_ITEMS.length]);
    const pool = [...SKILL_ITEMS, ...UTILITY_ITEMS].filter(item => item.id !== skill.id);
    const items = [skill];
    while (items.length < 5 && pool.length) {
      const index = Math.floor(Math.random() * pool.length);
      items.push(this.toItem(pool.splice(index, 1)[0]));
    }
    return items;
  }

  private toItem(definition: Omit<ShopItem, 'apply'>): ShopItem {
    return { ...definition, apply: () => this.apply(definition.id) };
  }

  private apply(id: string) {
    const talentMap: Record<string, SkillTalent> = {
      'skill-damage': 'damage',
      'skill-speed': 'speed',
      'skill-multishot': 'multishot',
      'skill-control': 'control',
    };
    if (talentMap[id]) {
      this.weapon.applyTalent(talentMap[id]);
      return;
    }
    if (id === 'stat-attack') this.player.attackPower += 8;
    if (id === 'stat-spell') this.player.spellPower += 8;
    if (id === 'stat-haste') this.player.haste += 8;
    if (id === 'stat-speed') this.player.speed += 8;
    if (id === 'survive-maxhp') { this.player.maxHp += 18; this.player.heal(18); }
    if (id === 'survive-armor') this.player.armor += 10;
  }
}
