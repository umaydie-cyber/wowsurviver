import type { EnemyKind } from '../entities/Enemy';

export const BOSS_WAVE = 8;
export const BOSS_CANDIDATES = ['奥妮克希亚', '吉安娜', '血法师萨尔诺斯'] as const;

export function isBossWave(wave:number){return wave===BOSS_WAVE;}

export function pickEnemyKindForWave(waveIndex:number,roll:number):EnemyKind{
  if(waveIndex>=5&&roll<0.18)return 'fireFistOgre';
  if(waveIndex>=3&&roll<(waveIndex>=5?0.38:0.2))return 'murlocShaman';
  return waveIndex>=1&&roll<(waveIndex>=5?0.7:0.55)?'swiftClaw':'wolf';
}
