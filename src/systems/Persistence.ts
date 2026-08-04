import type { BasicSkillId, ClassId } from '../classes';
import type { DifficultyId } from './difficulty';
import type { MapId } from '../maps';
import type { SkillSlot } from './SkillLoadout';

const COOKIE_NAME = 'azeroth_survivor_save';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type PlayerSnapshot = Record<string, number | boolean>;
export type WeaponSnapshot = { values: Record<string, number | boolean>; slots: SkillSlot[] };
export type ShopCheckpoint = {
  version: 1;
  savedAt: number;
  completedWave: number;
  mapId: MapId;
  difficultyId: DifficultyId;
  classId: ClassId;
  basicSkillId: BasicSkillId;
  player: PlayerSnapshot;
  weapon: WeaponSnapshot;
  talents: Record<string, number>;
};
export type GameProfile = {
  lastSelection?: Pick<ShopCheckpoint, 'mapId' | 'difficultyId' | 'classId' | 'basicSkillId'>;
  completedMaps: MapId[];
  highestWave: number;
  achievements: string[];
};
export type GameSave = { version: 1; profile: GameProfile; checkpoint?: ShopCheckpoint };

export const emptySave = (): GameSave => ({ version: 1, profile: { completedMaps: [], highestWave: 0, achievements: [] } });

export function parseSave(value: string | undefined): GameSave {
  if (!value) return emptySave();
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as GameSave;
    if (parsed.version !== 1 || !parsed.profile || !Array.isArray(parsed.profile.completedMaps) || !Array.isArray(parsed.profile.achievements)) return emptySave();
    return parsed;
  } catch { return emptySave(); }
}

export function readGameSave(cookie = document.cookie): GameSave {
  const value = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  return parseSave(value);
}

export function writeGameSave(save: GameSave) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(save))}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}

export function updateProgress(save: GameSave, completedWave: number, mapId: MapId, rewardEligible = true) {
  save.profile.highestWave = Math.max(save.profile.highestWave, completedWave);
  if (!save.profile.achievements.includes('first-wave')) save.profile.achievements.push('first-wave');
  if (completedWave === 8 && rewardEligible) {
    if (!save.profile.completedMaps.includes(mapId)) save.profile.completedMaps.push(mapId);
    if (!save.profile.achievements.includes('boss-slayer')) save.profile.achievements.push('boss-slayer');
  }
  if (completedWave >= 10 && !save.profile.achievements.includes('wave-10')) save.profile.achievements.push('wave-10');
}
