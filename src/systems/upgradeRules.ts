export type UpgradeRewardType = 'skill' | 'attribute';

export function getUpgradeRewardType(level:number):UpgradeRewardType{
  return level%5===0?'skill':'attribute';
}
