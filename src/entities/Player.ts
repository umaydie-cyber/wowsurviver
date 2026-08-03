import Phaser from 'phaser';
import { nextXpRequirement } from '../systems/progression';
import { FROST_MAGE_ACTIVE_SKILLS, SKILL_SLOT_LAYOUT, WARRIOR_ACTIVE_SKILLS, type ClassId } from '../classes';

const BASE_MOVE_VELOCITY = 205;
const FOCUS_TIMEOUT_MS = 3000;

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp = 120; maxHp = 120; level = 1; xp = 0; xpNeeded = 40; rage = 0; maxRage = 100; azerite = 0;
  readonly skillSlots = SKILL_SLOT_LAYOUT;
  heroicLeapUnlocked = false; shieldWallUnlocked = false; iceSkatingUnlocked = false; icyVeinsUnlocked = false;
  attackPower = 34; spellPower = 34; speed = 100; armor = 0; magicResistance = 0; versatility = 0; haste = 0; mastery = 25; xpRate = 0; pickupRange = 0;
  private keys: Record<'W'|'A'|'S'|'D', Phaser.Input.Keyboard.Key>;
  private movement = new Phaser.Math.Vector2();
  private focusStartedAt = 0;
  private lastDamageAt = -Infinity;
  private reversedUntil = 0;
  private frozenUntil = 0;
  private slowedUntil = 0;
  private silencedUntil = 0;
  private speedBoostUntil = 0; private shieldWallUntil = 0; private heroicLeapReadyAt = 0; private shieldWallReadyAt = 0;
  private skatingUntil = 0; private iceSkatingReadyAt = 0; private skatingDirection = new Phaser.Math.Vector2(); private immunityArmor = 0;
  private icyVeinsUntil = 0; private icyVeinsReadyAt = 0;
  private spaceKey: Phaser.Input.Keyboard.Key; private qKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, x: number, y: number, public readonly classId: ClassId) {
    super(scene, x, y, classId === 'berserker' ? 'fury-warrior' : 'player'); scene.add.existing(this); scene.physics.add.existing(this);
    if (classId === 'berserker') this.setDisplaySize(48, 48).setCircle(20, 4, 4);
    else this.setCircle(20);
    this.setDepth(5).setCollideWorldBounds(true);
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D') as typeof this.keys;
    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.qKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
  }
  update(time = this.scene.time.now) {
    this.updateCombatFocus(time);
    const direction = time < this.reversedUntil ? -1 : 1;
    const x = (Number(this.keys.D.isDown)-Number(this.keys.A.isDown)) * direction;
    const y = (Number(this.keys.S.isDown)-Number(this.keys.W.isDown)) * direction;
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.classId === 'frost-mage' ? this.useIceSkating(x, y, time) : this.useHeroicLeap(x, y, time);
    if (Phaser.Input.Keyboard.JustDown(this.qKey)) this.classId === 'frost-mage' ? this.useIcyVeins(time) : this.useShieldWall(time);
    if (time < this.skatingUntil) {
      this.setVelocity(this.skatingDirection.x * this.moveVelocity * FROST_MAGE_ACTIVE_SKILLS.iceSkating.speedMultiplier, this.skatingDirection.y * this.moveVelocity * FROST_MAGE_ACTIVE_SKILLS.iceSkating.speedMultiplier);
      return;
    }
    const boost = time < this.speedBoostUntil ? 1 + WARRIOR_ACTIVE_SKILLS.heroicLeap.speedBonus : 1;
    this.movement.set(x, y).normalize().scale(time < this.frozenUntil ? 0 : this.moveVelocity * (time < this.slowedUntil ? .55 : 1) * boost);
    this.setVelocity(this.movement.x, this.movement.y);
    if (x) this.setFlipX(x < 0);
  }
  get moveVelocity() { return BASE_MOVE_VELOCITY * this.speed / 100; }
  get combatFocusActive() { return this.scene.time.now - this.lastDamageAt <= FOCUS_TIMEOUT_MS; }
  get combatFocusHasteBonus() {
    if (!this.combatFocusActive) return 0;
    return Math.floor((this.scene.time.now - this.focusStartedAt) / 1000) * (this.mastery / 5);
  }
  get totalHaste() { return this.haste + this.combatFocusHasteBonus + (this.icyVeinsActive ? FROST_MAGE_ACTIVE_SKILLS.icyVeins.hasteBonus : 0); }
  private get activeDamageMultiplier() { return this.icyVeinsActive ? 1 + FROST_MAGE_ACTIVE_SKILLS.icyVeins.damageBonus : 1; }
  calculateAttackDamage(multiplier = 1) { return this.attackPower * multiplier * (1 + this.versatility / 100) * this.activeDamageMultiplier; }
  calculateSpellDamage(multiplier = 1) { return this.spellPower * multiplier * (1 + this.versatility / 100) * this.activeDamageMultiplier; }
  reduceAttackDamage(value: number) { return value * (100 / (100 + Math.max(0, this.armor))); }
  reduceSpellDamage(value: number) { return value * (100 / (100 + Math.max(0, this.magicResistance))); }
  reduceAllDamage(value: number) { if(value>0&&this.immunityArmor){this.immunityArmor--;this.showImmunityArmor(false);return 0;}return value * (this.shieldWallActive ? 1 - WARRIOR_ACTIVE_SKILLS.shieldWall.damageReduction : 1); }
  unlockHeroicLeap() { this.heroicLeapUnlocked = true; }
  unlockShieldWall() { this.shieldWallUnlocked = true; }
  unlockIceSkating() { this.iceSkatingUnlocked = true; }
  unlockIcyVeins() { this.icyVeinsUnlocked = true; }
  get shieldWallActive() { return this.scene.time.now < this.shieldWallUntil; }
  get immunityArmorActive() { return this.immunityArmor > 0; }
  get icyVeinsActive() { return this.scene.time.now < this.icyVeinsUntil; }
  private useHeroicLeap(x: number, y: number, time: number) {
    if (!this.heroicLeapUnlocked || this.silenced || time < this.heroicLeapReadyAt || (!x && !y)) return;
    const leap = new Phaser.Math.Vector2(x, y).normalize().scale(150);
    this.setPosition(Phaser.Math.Clamp(this.x + leap.x, 20, 3180), Phaser.Math.Clamp(this.y + leap.y, 20, 3180));
    this.speedBoostUntil = time + WARRIOR_ACTIVE_SKILLS.heroicLeap.durationMs;
    this.heroicLeapReadyAt = time + WARRIOR_ACTIVE_SKILLS.heroicLeap.cooldownMs;
  }
  private useShieldWall(time: number) {
    if (!this.shieldWallUnlocked || this.silenced || time < this.shieldWallReadyAt) return;
    this.shieldWallUntil = time + WARRIOR_ACTIVE_SKILLS.shieldWall.durationMs;
    this.shieldWallReadyAt = time + WARRIOR_ACTIVE_SKILLS.shieldWall.cooldownMs;
  }
  private useIceSkating(x:number,y:number,time:number) {
    if(!this.iceSkatingUnlocked||this.silenced||time<this.iceSkatingReadyAt||(!x&&!y))return;
    this.skatingDirection.set(x,y).normalize();this.skatingUntil=time+FROST_MAGE_ACTIVE_SKILLS.iceSkating.durationMs;this.iceSkatingReadyAt=time+FROST_MAGE_ACTIVE_SKILLS.iceSkating.cooldownMs;
    this.scene.time.delayedCall(FROST_MAGE_ACTIVE_SKILLS.iceSkating.durationMs,()=>{this.immunityArmor=1;this.showImmunityArmor(true);});
  }
  private useIcyVeins(time:number) {
    if(!this.icyVeinsUnlocked||this.silenced||time<this.icyVeinsReadyAt)return;
    this.icyVeinsUntil=time+FROST_MAGE_ACTIVE_SKILLS.icyVeins.durationMs;this.icyVeinsReadyAt=time+FROST_MAGE_ACTIVE_SKILLS.icyVeins.cooldownMs;
    const aura=this.scene.add.circle(this.x,this.y,30,0x8eeaff,.2).setStrokeStyle(3,0xd8f8ff,.9).setDepth(4);this.scene.tweens.add({targets:aura,scale:1.35,alpha:.05,duration:650,yoyo:true,repeat:7,onUpdate:()=>aura.setPosition(this.x,this.y),onComplete:()=>aura.destroy()});
  }
  private showImmunityArmor(active:boolean) {this.setData('immunity-armor',active);if(active)this.setTint(0xbfefff);else if(!this.icyVeinsActive)this.clearTint();}
  dealtDamage(time = this.scene.time.now) { if (!this.combatFocusActive) this.focusStartedAt = time; this.lastDamageAt = time; }
  gainAzerite(value: number) { this.azerite += value; }
  spendAzerite(value: number) { if (this.azerite < value) return false; this.azerite -= value; return true; }
  gainXp(value: number) { this.xp += value * (1 + this.xpRate / 100); if (this.xp >= this.xpNeeded) { this.xp -= this.xpNeeded; this.level++; this.xpNeeded = nextXpRequirement(this.xpNeeded); return true; } return false; }
  gainRage(value: number) { this.rage = Math.min(this.maxRage, this.rage + value); }
  spendRage(value: number) { if (this.rage < value) return false; this.rage -= value; return true; }
  heal(value: number) { this.hp = Math.min(this.maxHp, this.hp + value); }
  reverseControls(durationMs: number, time = this.scene.time.now) { this.reversedUntil = Math.max(this.reversedUntil, time + durationMs); }
  freeze(durationMs: number, time = this.scene.time.now) { this.frozenUntil = Math.max(this.frozenUntil, time + durationMs); }
  slow(durationMs: number, time = this.scene.time.now) { this.slowedUntil = Math.max(this.slowedUntil, time + durationMs); }
  silence(durationMs: number, time = this.scene.time.now) { this.silencedUntil = Math.max(this.silencedUntil, time + durationMs); }
  get silenced() { return this.scene.time.now < this.silencedUntil; }
  get controlsReversed() { return this.scene.time.now < this.reversedUntil; }
  private updateCombatFocus(time: number) { if (time - this.lastDamageAt > FOCUS_TIMEOUT_MS) this.focusStartedAt = 0; }
}
