import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

export type WhirlwindTalent = 'range' | 'duration' | 'cooldown' | 'eternal' | 'twin' | 'blood' | 'fury';

/** Automated Berserker ability: target detection, hits, rage and visuals. */
export class Weapon {
  cooldown = 3000; range = 92; duration = 650; damageMultiplier = 1;
  hitCooldownReduction = 0; permanent = false; twinStrike = false; lifeSteal = false; rageOnHit = 2;
  private lastCast = -3000; private activeUntil = 0; private hitEnemies = new Set<Enemy>(); private castDamage = 1; private nextPermanentTick = 0;
  private effect: Phaser.GameObjects.Arc; private blades: Phaser.GameObjects.Graphics; private castCount = 0;
  constructor(private scene: Phaser.Scene, private player: Player, private enemies: Phaser.Physics.Arcade.Group) {
    this.effect = scene.add.circle(player.x, player.y, this.range, 0xf08a24, .11).setStrokeStyle(4, 0xffc247, .8).setDepth(4).setVisible(false);
    this.blades = scene.add.graphics().setDepth(6).setVisible(false);
  }
  update(time: number) {
    if (!this.permanent && time >= this.activeUntil && time - this.lastCast >= this.cooldown) this.cast(time);
    const active = this.permanent || time < this.activeUntil;
    if (this.permanent && time >= this.nextPermanentTick) { this.hitEnemies.clear(); this.nextPermanentTick = time + 650; }
    this.draw(time, active);
    if (!active) return;
    for (const enemy of this.enemies.getChildren() as Enemy[]) {
      if (!enemy.active || this.hitEnemies.has(enemy) || Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) > this.range) continue;
      this.hitEnemies.add(enemy);
      enemy.hp -= this.player.attack * this.damageMultiplier * this.castDamage * (this.twinStrike ? 1.55 : 1);
      this.player.gainRage(this.rageOnHit);
      if (this.lifeSteal && enemy.hp <= 0) this.player.heal(this.player.maxHp * .01);
      if (this.hitCooldownReduction && this.hitEnemies.size % 10 === 0) this.activeUntil += this.hitCooldownReduction;
      this.scene.events.emit('whirlwind-hit', enemy);
    }
  }
  applyTalent(talent: WhirlwindTalent) {
    if (talent === 'range') this.range *= 1.2;
    if (talent === 'duration') this.duration += 1000;
    if (talent === 'cooldown') this.hitCooldownReduction += 250;
    if (talent === 'eternal') this.permanent = true;
    if (talent === 'twin') this.twinStrike = true;
    if (talent === 'blood') this.lifeSteal = true;
    if (talent === 'fury') this.rageOnHit += 2;
  }
  private cast(time: number) { this.lastCast = time; this.activeUntil = time + this.duration; this.hitEnemies.clear(); this.castDamage = this.player.spendRage(50) ? 1.5 : 1; this.castCount++; this.scene.cameras.main.shake(55, .002); }
  private draw(time: number, active: boolean) {
    this.effect.setPosition(this.player.x, this.player.y).setRadius(this.range).setVisible(active); this.blades.clear().setVisible(active);
    if (!active) return;
    const count = this.twinStrike ? 4 : 2, rotation = time * .012 * (this.castCount % 2 ? 1 : -1);
    this.blades.lineStyle(8, 0xe7edf4, .9);
    for (let i = 0; i < count; i++) { const angle = rotation + i * Math.PI * 2 / count; this.blades.lineBetween(this.player.x + Math.cos(angle) * this.range * .25, this.player.y + Math.sin(angle) * this.range * .25, this.player.x + Math.cos(angle) * this.range * .88, this.player.y + Math.sin(angle) * this.range * .88); }
  }
}
