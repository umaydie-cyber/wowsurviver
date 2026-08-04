import { describe, expect, it } from 'vitest';
import { BOSS_CANDIDATES, isBossWave, pickEnemyKindForWave, waveDurationSeconds } from './spawnRules';

describe('pickEnemyKindForWave', () => {
  it('does not spawn fire-fist ogres before wave 6', () => {
    expect(pickEnemyKindForWave(4, 0)).toBe('murlocShaman');
  });

  it('adds fire-fist ogres to wave 6 at an 18% roll threshold', () => {
    expect(pickEnemyKindForWave(5, 0.179)).toBe('fireFistOgre');
    expect(pickEnemyKindForWave(5, 0.18)).toBe('murlocShaman');
  });

  it.each([
    [10, 'zhevraCharger'], [12, 'sunscaleScytheclaw'], [14, 'windfuryHarpy'],
    [16, 'kolkarWarcaller'], [18, 'razormaneGeomancer'], [20, 'thunderLizard'],
  ])('introduces a new Barrens enemy at wave %i', (wave, kind) => {
    expect(pickEnemyKindForWave(wave - 1, 0.47)).toBe(kind);
  });

  it('does not introduce the zhevra before wave 10', () => {
    expect(pickEnemyKindForWave(8, 0.47)).not.toBe('zhevraCharger');
  });
});

describe('boss wave rules', () => {
  it('reserves only wave 8 for the boss encounter', () => {
    expect(isBossWave(7)).toBe(false);
    expect(isBossWave(8)).toBe(true);
    expect(isBossWave(9)).toBe(false);
  });

  it('defines the planned three-boss selection pool', () => {
    expect(BOSS_CANDIDATES).toEqual(['奥妮克希亚', '吉安娜', '血法师萨尔诺斯']);
  });
});

describe('wave duration', () => {
  it('adds five seconds to every wave without a duration cap', () => {
    expect([1, 2, 7, 8, 20].map(waveDurationSeconds)).toEqual([20, 25, 50, 55, 115]);
  });
});
