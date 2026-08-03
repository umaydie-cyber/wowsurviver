export const FROST_MAGE_SKILLS = {
  frostbolt: { cooldownMs: 2000, damageMultiplier: 1, slow: .25, freezeChance: .2, freezeMs: 1400 },
  frozenOrb: { cooldownMs: 4200, damageMultiplier: .72, speed: 175, radius: 30, lifetimeMs: 2600, slow: .22 },
  iceLance: { cooldownMs: 780, damageMultiplier: .42, frozenDamageMultiplier: 4, speed: 560 },
} as const;

export const iceLanceDamageMultiplier = (frozen: boolean) =>
  FROST_MAGE_SKILLS.iceLance.damageMultiplier * (frozen ? FROST_MAGE_SKILLS.iceLance.frozenDamageMultiplier : 1);
