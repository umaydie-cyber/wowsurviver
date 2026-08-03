export const BLOODTHIRST = {
  cooldownMs: 5200,
  range: 135,
  damageMultiplier: 1.65,
  healChance: .3,
  healMaxHpRatio: .02,
} as const;

export const EXECUTE = {
  cooldownMs: 6200,
  range: 145,
  baseDamageMultiplier: 1.15,
  healthThreshold: .3,
  missingHealthBonusMultiplier: 3.4,
} as const;

export const ROTATIONAL_MOMENTUM_BONUSES = [.05, .07, .09] as const;
export const DEEP_WOUNDS = {
  durationMs: 6000,
  tickMs: 1000,
  attackPowerCoefficients: [.12, .18, .24],
} as const;

export function rotationalMomentumBonus(rank: number, whirlwindHits: number) {
  const coefficient = ROTATIONAL_MOMENTUM_BONUSES[Math.max(0, Math.min(ROTATIONAL_MOMENTUM_BONUSES.length - 1, rank - 1))] ?? 0;
  return Math.max(0, whirlwindHits) * coefficient;
}

/** Deep Wounds ticks once per second; haste increases each tick rather than double-dipping through tick rate. */
export function deepWoundsTickDamage(rank: number, attackPower: number, haste: number) {
  const coefficient = DEEP_WOUNDS.attackPowerCoefficients[Math.max(0, Math.min(DEEP_WOUNDS.attackPowerCoefficients.length - 1, rank - 1))] ?? 0;
  return Math.max(0, attackPower) * coefficient * (1 + Math.max(0, haste) / 100);
}

export function executeDamageMultiplier(currentHp: number, maxHp: number) {
  if (maxHp <= 0 || currentHp / maxHp > EXECUTE.healthThreshold) return EXECUTE.baseDamageMultiplier;
  const missingHealthRatio = 1 - Math.max(0, currentHp) / maxHp;
  return EXECUTE.baseDamageMultiplier + missingHealthRatio * EXECUTE.missingHealthBonusMultiplier;
}

export function bloodthirstHealing(maxHp: number, roll: number) {
  return roll < BLOODTHIRST.healChance ? maxHp * BLOODTHIRST.healMaxHpRatio : 0;
}
