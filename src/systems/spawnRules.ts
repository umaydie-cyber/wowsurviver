import type { EnemyKind } from '../entities/Enemy';

export const BOSS_WAVE = 8;
export const BOSS_WAVE_TIME_LIMIT_SECONDS = 120;
export const BOSS_CANDIDATES = ['奥妮克希亚', '吉安娜', '血法师萨尔诺斯'] as const;

export function isBossWave(wave:number){return wave===BOSS_WAVE;}

export const FIRST_WAVE_SECONDS = 20;
export const WAVE_STEP_SECONDS = 5;

export function waveDurationSeconds(wave:number){
  if(isBossWave(wave))return BOSS_WAVE_TIME_LIMIT_SECONDS;
  return FIRST_WAVE_SECONDS+(wave-1)*WAVE_STEP_SECONDS;
}

export function pickEnemyKindForWave(waveIndex:number,roll:number):EnemyKind{
  const wave=waveIndex+1;
  const barrensKinds:EnemyKind[]=[];
  if(wave>=10)barrensKinds.push('zhevraCharger');
  if(wave>=12)barrensKinds.push('sunscaleScytheclaw');
  if(wave>=14)barrensKinds.push('windfuryHarpy');
  if(wave>=16)barrensKinds.push('kolkarWarcaller');
  if(wave>=18)barrensKinds.push('razormaneGeomancer');
  if(wave>=20)barrensKinds.push('thunderLizard');
  if(barrensKinds.length&&roll<0.48){
    const index=Math.min(barrensKinds.length-1,Math.floor(roll/0.48*barrensKinds.length));
    return barrensKinds[index];
  }
  if(barrensKinds.length)roll=(roll-0.48)/0.52;
  if(waveIndex>=5&&roll<0.18)return 'fireFistOgre';
  if(waveIndex>=3&&roll<(waveIndex>=5?0.38:0.2))return 'murlocShaman';
  return waveIndex>=1&&roll<(waveIndex>=5?0.7:0.55)?'swiftClaw':'wolf';
}
