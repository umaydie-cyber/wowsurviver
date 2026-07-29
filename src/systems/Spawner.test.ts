import { describe, expect, it } from 'vitest';
import { pickEnemyKindForWave } from './spawnRules';

describe('pickEnemyKindForWave', () => {
  it('does not spawn fire-fist ogres before wave 6', () => {
    expect(pickEnemyKindForWave(4, 0)).toBe('murlocShaman');
  });

  it('adds fire-fist ogres to wave 6 at an 18% roll threshold', () => {
    expect(pickEnemyKindForWave(5, 0.179)).toBe('fireFistOgre');
    expect(pickEnemyKindForWave(5, 0.18)).toBe('murlocShaman');
  });
});
