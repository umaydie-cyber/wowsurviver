import Phaser from 'phaser';
import { Player } from './Player';

export type EnemyKind = 'wolf' | 'swiftClaw' | 'boss';

const ENEMY_STATS: Record<EnemyKind, { texture: string; hp: number; damage: number; speed: number; radius: number }> = {
  wolf: { texture: 'wolf', hp: 50, damage: 5, speed: 80, radius: 18 },
  swiftClaw: { texture: 'swift-claw', hp: 35, damage: 7, speed: 128, radius: 16 },
  boss: { texture: 'boss', hp: 5000, damage: 50, speed: 48, radius: 43 },
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number; damage: number; speed: number; boss: boolean; kind: EnemyKind;
  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind = 'wolf') {
    const stats = ENEMY_STATS[kind];
    super(scene, x, y, stats.texture); scene.add.existing(this); scene.physics.add.existing(this);
    this.kind = kind; this.boss = kind === 'boss'; this.hp = stats.hp; this.damage = stats.damage; this.speed = stats.speed;
    this.setCircle(stats.radius).setDepth(3);
  }
  chase(player: Player) { this.scene.physics.moveToObject(this, player, this.speed); this.setFlipX(this.body!.velocity.x < 0); }
}
