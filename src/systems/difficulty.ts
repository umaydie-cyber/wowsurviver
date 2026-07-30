export type DifficultyId = 1 | 2 | 3 | 4 | 5;

export type DifficultyDefinition = {
  id: DifficultyId;
  name: string;
  requiredAccuracy: number;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  color: string;
};

// Difficulty 3 is the original combat baseline. Health scales in direct
// proportion to the requested skill-hit threshold, while incoming damage has
// a gentler curve so high difficulty still rewards dodging instead of one-shots.
export const DIFFICULTIES: DifficultyDefinition[] = [
  { id: 1, name: '难度 1', requiredAccuracy: 20, enemyHealthMultiplier: 1 / 3, enemyDamageMultiplier: .7, color: '#65d98b' },
  { id: 2, name: '难度 2', requiredAccuracy: 40, enemyHealthMultiplier: 2 / 3, enemyDamageMultiplier: .85, color: '#75c9ff' },
  { id: 3, name: '难度 3', requiredAccuracy: 60, enemyHealthMultiplier: 1, enemyDamageMultiplier: 1, color: '#f4d58a' },
  { id: 4, name: '难度 4', requiredAccuracy: 75, enemyHealthMultiplier: 1.25, enemyDamageMultiplier: 1.15, color: '#f39a55' },
  { id: 5, name: '难度 5', requiredAccuracy: 90, enemyHealthMultiplier: 1.5, enemyDamageMultiplier: 1.3, color: '#ee5b61' },
];

export const getDifficulty = (id: DifficultyId) => DIFFICULTIES.find(item => item.id === id)!;
