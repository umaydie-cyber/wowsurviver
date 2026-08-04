export const FIRE_MAGE_SKILLS = {
  flameStorm: { cooldownMs: 11000, damageMultiplier: .32, radius: 112, durationMs: 5000, tickMs: 1000 },
  pyroblast: { cooldownMs: 13500, damageMultiplier: 3.1, projectileSpeed: 300, igniteTickMs: 1000, igniteDamageMultiplier: .16, igniteDurationMs: [0, 4000, 6000, 8000] },
  combustion: { requiredStacks: 3, bonusDamage: [0, 1, 1.5, 2] },
} as const;

export const combustionDamageMultiplier = (rank: number) => 1 + FIRE_MAGE_SKILLS.combustion.bonusDamage[Math.max(0, Math.min(3, rank))];
export const pyroblastIgniteDuration = (rank: number) => FIRE_MAGE_SKILLS.pyroblast.igniteDurationMs[Math.max(0, Math.min(3, rank))];
export const isInFlameStorm = (stormX: number, stormY: number, targetX: number, targetY: number, radius = FIRE_MAGE_SKILLS.flameStorm.radius) =>
  Math.hypot(targetX - stormX, targetY - stormY) <= radius;
