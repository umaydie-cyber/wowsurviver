export type ClassId = 'berserker' | 'frost-mage' | 'fire-mage' | 'beast-hunter';

export type ClassDefinition = {
  id: ClassId;
  name: string;
  skill: string;
  fantasy: string;
  color: number;
};

export const CLASSES: ClassDefinition[] = [
  { id: 'berserker', name: '狂暴战士', skill: '旋风斩', fantasy: '冲入敌群，以怒气强化旋转双斧', color: 0xd94a3d },
  { id: 'frost-mage', name: '冰霜法师', skill: '寒冰箭', fantasy: '自动狙击最近敌人，减速并冻结猎物', color: 0x67c8ff },
  { id: 'fire-mage', name: '火焰法师', skill: '火球术', fantasy: '引燃目标，让火球逐步爆裂成火海', color: 0xff7a35 },
  { id: 'beast-hunter', name: '兽王猎人', skill: '杀戮命令', fantasy: '命令灵兽扑向最近敌人发动撕咬', color: 0x73c75b },
];

export const getClassDefinition = (id: ClassId) => CLASSES.find(item => item.id === id)!;
