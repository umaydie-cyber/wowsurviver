import type { EnemyKind } from '../entities/Enemy';

export function pickEnemyKindForWave(waveIndex:number,roll:number):EnemyKind{
  if(waveIndex>=5&&roll<0.18)return 'fireFistOgre';
  if(waveIndex>=3&&roll<(waveIndex>=5?0.38:0.2))return 'murlocShaman';
  return waveIndex>=1&&roll<(waveIndex>=5?0.7:0.55)?'swiftClaw':'wolf';
}
