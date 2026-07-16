import Phaser from 'phaser';
import { nextXpRequirement } from '../systems/progression';

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp = 100; maxHp = 100; speed = 200; attack = 10; level = 1; xp = 0; xpNeeded = 40;
  private keys: Record<'W'|'A'|'S'|'D', Phaser.Input.Keyboard.Key>;
  private movement = new Phaser.Math.Vector2();
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player'); scene.add.existing(this); scene.physics.add.existing(this);
    this.setCircle(20).setDepth(5).setCollideWorldBounds(true);
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D') as typeof this.keys;
  }
  update() {
    const x = Number(this.keys.D.isDown)-Number(this.keys.A.isDown);
    const y = Number(this.keys.S.isDown)-Number(this.keys.W.isDown);
    this.movement.set(x, y).normalize().scale(this.speed);
    this.setVelocity(this.movement.x, this.movement.y);
    if (x) this.setFlipX(x < 0);
  }
  gainXp(value: number) { this.xp += value; if (this.xp >= this.xpNeeded) { this.xp -= this.xpNeeded; this.level++; this.xpNeeded = nextXpRequirement(this.xpNeeded); return true; } return false; }
}
