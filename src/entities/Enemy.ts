import Phaser from 'phaser';
import { Player } from './Player';
import type { DifficultyDefinition } from '../systems/difficulty';

export type EnemyKind = 'wolf' | 'swiftClaw' | 'murlocShaman' | 'fireFistOgre' | 'onyxia' | 'onyxiaWhelp' | 'jaina' | 'waterElemental' | 'thalnos' | 'thalnosSoul';

const ENEMY_STATS: Record<EnemyKind, { texture: string; hp: number; damage: number; speed: number; radius: number }> = {
  wolf: { texture: 'wolf', hp: 50, damage: 5, speed: 80, radius: 18 },
  swiftClaw: { texture: 'swift-claw', hp: 35, damage: 7, speed: 128, radius: 16 },
  murlocShaman: { texture: 'murloc-shaman', hp: 200, damage: 5, speed: 64, radius: 18 },
  fireFistOgre: { texture: 'fire-fist-ogre', hp: 500, damage: 12, speed: 55, radius: 25 },
  onyxia: { texture: 'onyxia', hp: 9000, damage: 45, speed: 42, radius: 48 },
  onyxiaWhelp: { texture: 'onyxia-whelp', hp: 180, damage: 8, speed: 72, radius: 16 },
  jaina: { texture: 'jaina', hp: 9000, damage: 35, speed: 38, radius: 32 },
  waterElemental: { texture: 'water-elemental', hp: 650, damage: 8, speed: 46, radius: 22 },
  thalnos: { texture: 'thalnos', hp: 9000, damage: 38, speed: 45, radius: 34 },
  thalnosSoul: { texture: 'thalnos-soul', hp: 360, damage: 0, speed: 0, radius: 18 },
};

const SHAMAN_CAST_INTERVAL_MS = 5000;
const OGRE_CAST_INTERVAL_MS = 4000;
const WHELP_CAST_INTERVAL_MS = 2800;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number; maxHp: number; damage: number; speed: number; boss: boolean; kind: EnemyKind;
  private nextCastAt = 0;
  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind = 'wolf', difficulty?: DifficultyDefinition) {
    const stats = ENEMY_STATS[kind];
    super(scene, x, y, stats.texture); scene.add.existing(this); scene.physics.add.existing(this);
    const healthMultiplier = difficulty?.enemyHealthMultiplier ?? 1;
    const damageMultiplier = difficulty?.enemyDamageMultiplier ?? 1;
    this.kind = kind; this.boss = kind === 'onyxia' || kind === 'jaina' || kind === 'thalnos'; this.hp = Math.round(stats.hp * healthMultiplier); this.maxHp = this.hp; this.damage = stats.damage * damageMultiplier; this.speed = stats.speed;
    this.setCircle(stats.radius).setDepth(3);
    if (kind === 'murlocShaman' || kind === 'fireFistOgre' || kind === 'onyxiaWhelp') this.nextCastAt = scene.time.now + Phaser.Math.Between(1200, 2400);
  }
  updateBehavior(player: Player, time: number) {
    if (this.kind === 'thalnosSoul') { this.setVelocity(0, 0); return; }
    this.scene.physics.moveToObject(this, player, this.speed); this.setFlipX(this.body!.velocity.x < 0);
    if (time < this.nextCastAt) return;
    if (this.kind === 'murlocShaman') {
      this.nextCastAt = time + SHAMAN_CAST_INTERVAL_MS;
      this.scene.events.emit('shaman-lightning', player.x, player.y);
    } else if (this.kind === 'fireFistOgre') {
      this.nextCastAt = time + OGRE_CAST_INTERVAL_MS;
      this.scene.events.emit('ogre-fire-fists', this.x, this.y, player.x, player.y);
    } else if (this.kind === 'onyxiaWhelp') {
      this.nextCastAt = time + WHELP_CAST_INTERVAL_MS;
      this.scene.events.emit('whelp-fireburst', this.x, this.y);
    }
  }
}
