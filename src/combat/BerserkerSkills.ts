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

export function executeDamageMultiplier(currentHp: number, maxHp: number) {
  if (maxHp <= 0 || currentHp / maxHp > EXECUTE.healthThreshold) return EXECUTE.baseDamageMultiplier;
  const missingHealthRatio = 1 - Math.max(0, currentHp) / maxHp;
  return EXECUTE.baseDamageMultiplier + missingHealthRatio * EXECUTE.missingHealthBonusMultiplier;
}

export function bloodthirstHealing(maxHp: number, roll: number) {
  return roll < BLOODTHIRST.healChance ? maxHp * BLOODTHIRST.healMaxHpRatio : 0;
}
