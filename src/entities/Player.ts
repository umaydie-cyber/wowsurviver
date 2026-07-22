import Phaser from 'phaser';
import { nextXpRequirement } from '../systems/progression';

const BASE_MOVE_VELOCITY = 205;
const FOCUS_TIMEOUT_MS = 3000;

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp = 120; maxHp = 120; level = 1; xp = 0; xpNeeded = 40; rage = 0; maxRage = 100; azerite = 0; skillSlots = 6;
  attackPower = 34; spellPower = 34; speed = 100; armor = 0; magicResistance = 0; versatility = 0; haste = 0; mastery = 25; xpRate = 0; pickupRange = 0;
  private keys: Record<'W'|'A'|'S'|'D', Phaser.Input.Keyboard.Key>;
  private movement = new Phaser.Math.Vector2();
  private focusStartedAt = 0;
  private lastDamageAt = -Infinity;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player'); scene.add.existing(this); scene.physics.add.existing(this);
    this.setCircle(20).setDepth(5).setCollideWorldBounds(true);
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D') as typeof this.keys;
  }
  update(time = this.scene.time.now) {
    this.updateCombatFocus(time);
    const x = Number(this.keys.D.isDown)-Number(this.keys.A.isDown);
    const y = Number(this.keys.S.isDown)-Number(this.keys.W.isDown);
    this.movement.set(x, y).normalize().scale(this.moveVelocity);
    this.setVelocity(this.movement.x, this.movement.y);
    if (x) this.setFlipX(x < 0);
  }
  get moveVelocity() { return BASE_MOVE_VELOCITY * this.speed / 100; }
  get combatFocusActive() { return this.scene.time.now - this.lastDamageAt <= FOCUS_TIMEOUT_MS; }
  get combatFocusHasteBonus() {
    if (!this.combatFocusActive) return 0;
    return Math.floor((this.scene.time.now - this.focusStartedAt) / 1000) * (this.mastery / 5);
  }
  get totalHaste() { return this.haste + this.combatFocusHasteBonus; }
  calculateAttackDamage(multiplier = 1) { return this.attackPower * multiplier * (1 + this.versatility / 100); }
  calculateSpellDamage(multiplier = 1) { return this.spellPower * multiplier * (1 + this.versatility / 100); }
  reduceAttackDamage(value: number) { return value * (100 / (100 + Math.max(0, this.armor))); }
  reduceSpellDamage(value: number) { return value * (100 / (100 + Math.max(0, this.magicResistance))); }
  dealtDamage(time = this.scene.time.now) { if (!this.combatFocusActive) this.focusStartedAt = time; this.lastDamageAt = time; }
  gainAzerite(value: number) { this.azerite += value; }
  spendAzerite(value: number) { if (this.azerite < value) return false; this.azerite -= value; return true; }
  gainXp(value: number) { this.xp += value * (1 + this.xpRate / 100); if (this.xp >= this.xpNeeded) { this.xp -= this.xpNeeded; this.level++; this.xpNeeded = nextXpRequirement(this.xpNeeded); return true; } return false; }
  gainRage(value: number) { this.rage = Math.min(this.maxRage, this.rage + value); }
  spendRage(value: number) { if (this.rage < value) return false; this.rage -= value; return true; }
  heal(value: number) { this.hp = Math.min(this.maxHp, this.hp + value); }
  private updateCombatFocus(time: number) { if (time - this.lastDamageAt > FOCUS_TIMEOUT_MS) this.focusStartedAt = 0; }
}
