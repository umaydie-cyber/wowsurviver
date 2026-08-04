import { describe, expect, it, vi } from 'vitest';
import { BOSS_CANDIDATES, BOSS_WAVE_TIME_LIMIT_SECONDS, isBossWave, pickEnemyKindForWave, waveDurationSeconds } from './spawnRules';
import { Spawner } from './Spawner';

vi.mock('phaser', () => ({ default: { Math: { Between: () => 500 } } }));
vi.mock('../entities/Enemy', () => ({ Enemy: class {} }));
vi.mock('../entities/Player', () => ({ Player: class {} }));

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
  it('caps the boss wave at two minutes while normal waves keep scaling', () => {
    expect(BOSS_WAVE_TIME_LIMIT_SECONDS).toBe(120);
    expect([1, 2, 7, 8, 20].map(waveDurationSeconds)).toEqual([20, 25, 50, 120, 115]);
  });
});

describe('Spawner shop transition', () => {
  it('spawns the next wave opening group immediately after leaving the shop', () => {
    const emit = vi.fn();
    const scene = { time: { now: 12_000 }, events: { emit } } as never;
    const spawner = new Spawner(scene, {} as never, {} as never);
    const spawn = vi.spyOn(spawner, 'spawn').mockReturnValue({} as never);

    spawner.resumeFromBreak(1);
    spawner.continue();

    expect(spawner.currentWave).toBe(2);
    expect(spawn).toHaveBeenCalledTimes(13);
    expect(emit).toHaveBeenCalledWith('wave-start', 2, 25);
  });

  it('clears a surviving boss and marks the shop transition as unrewarded', () => {
    const emit = vi.fn();
    const boss = { boss: true, active: true, destroy: vi.fn() };
    const scene = { time: { now: 120_000 }, events: { emit } } as never;
    const spawner = new Spawner(scene, { getChildren: () => [boss] } as never, {} as never);

    Object.assign(spawner, { wave: 7 });
    (spawner as unknown as { endWave: () => void }).endWave();

    expect(boss.destroy).toHaveBeenCalledOnce();
    expect(emit).toHaveBeenCalledWith('wave-break', 8, expect.any(Function), {
      rewardEligible: false,
      bossTimedOut: true,
    });
  });
});
