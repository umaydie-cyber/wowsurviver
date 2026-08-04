import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: { Utils: { Array: { Shuffle: <T>(items: T[]) => items } } },
}));

import { LevelSystem, type Upgrade } from './LevelSystem';

describe('LevelSystem upgrade pause', () => {
  it('pauses the whole scene until an upgrade is selected', () => {
    const scene = {
      physics: { pause: vi.fn(), resume: vi.fn() },
      scene: { pause: vi.fn(), resume: vi.fn() },
      time: { delayedCall: vi.fn() },
    };
    const player = { level: 2 };
    const weapon = {};
    let select: ((upgrade: Upgrade) => void) | undefined;
    const ui = {
      showUpgrades: vi.fn((_items, _rewardType, pick) => { select = pick; }),
      hideUpgrades: vi.fn(),
    };
    const levels = new LevelSystem(scene as never, player as never, weapon as never, ui as never, 'berserker');

    levels.show();

    expect(scene.physics.pause).toHaveBeenCalledOnce();
    expect(scene.scene.pause).toHaveBeenCalledOnce();
    expect(scene.scene.resume).not.toHaveBeenCalled();

    const upgrade = (ui.showUpgrades.mock.calls[0][0] as Upgrade[])[0];
    select!(upgrade);

    expect(scene.physics.resume).toHaveBeenCalledOnce();
    expect(scene.scene.resume).toHaveBeenCalledOnce();
    expect(ui.hideUpgrades).toHaveBeenCalledOnce();
  });
});
