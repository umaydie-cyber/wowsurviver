import { describe, expect, it } from 'vitest';
import { HealingBlock } from './HealingBlock';

describe('healing prevention', () => {
  it('blocks healing until Mortal Strike expires', () => {
    const effect = new HealingBlock();
    effect.block(6_000);

    expect(effect.isBlocked(5_999)).toBe(true);
    expect(effect.isBlocked(6_000)).toBe(false);
  });

  it('keeps the longest active healing block', () => {
    const effect = new HealingBlock();
    effect.block(8_000);
    effect.block(7_000);

    expect(effect.isBlocked(7_500)).toBe(true);
    expect(effect.isBlocked(8_000)).toBe(false);
  });
});
