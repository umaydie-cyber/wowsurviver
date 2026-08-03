import { getBasicSkillDefinition, type BasicSkillId, type ClassId } from '../classes';

export const SKILL_RANK_MAX = 4;
export const SKILL_SLOT_COUNT = 6;
export type SkillRank = 1 | 2 | 3 | 4;
export type SkillSlot = { skillId: BasicSkillId; rank: SkillRank } | null;
export type SkillRankEffects = { damageMultiplier: number; rangeMultiplier: number; cooldownMultiplier: number };

export function getSkillRankEffects(rank: SkillRank): SkillRankEffects {
  return { damageMultiplier: 1 + (rank - 1) * .35, rangeMultiplier: 1 + (rank - 1) * .12, cooldownMultiplier: Math.pow(.9, rank - 1) };
}

export class SkillLoadout {
  readonly slots: SkillSlot[];
  constructor(readonly classId: ClassId, initialSkillId: BasicSkillId) {
    this.slots = [{ skillId: initialSkillId, rank: 1 }, ...Array<SkillSlot>(SKILL_SLOT_COUNT - 1).fill(null)];
  }
  get primary() { return this.slots.find((slot): slot is NonNullable<SkillSlot> => Boolean(slot)); }
  add(skillId: BasicSkillId) {
    if (!getBasicSkillDefinition(this.classId, skillId)) return false;
    const empty = this.slots.indexOf(null); if (empty < 0) return false;
    this.slots[empty] = { skillId, rank: 1 }; return true;
  }
  moveOrMerge(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= this.slots.length || to >= this.slots.length) return false;
    const source = this.slots[from]; if (!source) return false;
    const target = this.slots[to];
    if (!target) { this.slots[to] = source; this.slots[from] = null; return true; }
    if (source.skillId === target.skillId && source.rank === target.rank && target.rank < SKILL_RANK_MAX) {
      this.slots[to] = { ...target, rank: (target.rank + 1) as SkillRank }; this.slots[from] = null; return true;
    }
    [this.slots[from], this.slots[to]] = [target, source]; return true;
  }
}
