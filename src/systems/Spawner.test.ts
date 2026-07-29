import { describe, expect, it } from 'vitest';
import { BOSS_CANDIDATES, isBossWave, pickEnemyKindForWave } from './spawnRules';

describe('pickEnemyKindForWave', () => {
  it('does not spawn fire-fist ogres before wave 6', () => {
    expect(pickEnemyKindForWave(4, 0)).toBe('murlocShaman');
  });

  it('adds fire-fist ogres to wave 6 at an 18% roll threshold', () => {
    expect(pickEnemyKindForWave(5, 0.179)).toBe('fireFistOgre');
    expect(pickEnemyKindForWave(5, 0.18)).toBe('murlocShaman');
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
