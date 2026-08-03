import Phaser from 'phaser';
import { Player } from './Player';
import type { DifficultyDefinition } from '../systems/difficulty';
import { HealingBlock } from '../combat/HealingBlock';

export type EnemyKind = 'wolf' | 'swiftClaw' | 'murlocShaman' | 'fireFistOgre' | 'zhevraCharger' | 'sunscaleScytheclaw' | 'windfuryHarpy' | 'kolkarWarcaller' | 'razormaneGeomancer' | 'thunderLizard' | 'onyxia' | 'onyxiaWhelp' | 'jaina' | 'waterElemental' | 'thalnos' | 'thalnosSoul';

const ENEMY_STATS: Record<EnemyKind, { texture: string; hp: number; damage: number; speed: number; radius: number }> = {
  wolf: { texture: 'wolf', hp: 50, damage: 5, speed: 80, radius: 18 },
  swiftClaw: { texture: 'swift-claw', hp: 35, damage: 7, speed: 128, radius: 16 },
  murlocShaman: { texture: 'murloc-shaman', hp: 200, damage: 5, speed: 64, radius: 18 },
  fireFistOgre: { texture: 'fire-fist-ogre', hp: 500, damage: 12, speed: 55, radius: 25 },
  zhevraCharger: { texture: 'zhevra-charger', hp: 260, damage: 14, speed: 82, radius: 20 },
  sunscaleScytheclaw: { texture: 'sunscale-scytheclaw', hp: 330, damage: 16, speed: 76, radius: 21 },
  windfuryHarpy: { texture: 'windfury-harpy', hp: 290, damage: 11, speed: 68, radius: 20 },
  kolkarWarcaller: { texture: 'kolkar-warcaller', hp: 440, damage: 18, speed: 66, radius: 22 },
  razormaneGeomancer: { texture: 'razormane-geomancer', hp: 520, damage: 15, speed: 54, radius: 23 },
  thunderLizard: { texture: 'thunder-lizard', hp: 900, damage: 24, speed: 43, radius: 29 },
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
  private frozenUntil = 0;
  private enraged = false;
  private healingBlock = new HealingBlock();
  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind = 'wolf', difficulty?: DifficultyDefinition) {
    const stats = ENEMY_STATS[kind];
    super(scene, x, y, stats.texture); scene.add.existing(this); scene.physics.add.existing(this);
    const healthMultiplier = difficulty?.enemyHealthMultiplier ?? 1;
    const damageMultiplier = difficulty?.enemyDamageMultiplier ?? 1;
    this.kind = kind; this.boss = kind === 'onyxia' || kind === 'jaina' || kind === 'thalnos'; this.hp = Math.round(stats.hp * healthMultiplier); this.maxHp = this.hp; this.damage = stats.damage * damageMultiplier; this.speed = stats.speed;
    this.setCircle(stats.radius).setDepth(3);
    if (kind === 'murlocShaman' || kind === 'fireFistOgre' || kind === 'onyxiaWhelp' || kind === 'zhevraCharger' || kind === 'windfuryHarpy' || kind === 'kolkarWarcaller' || kind === 'razormaneGeomancer' || kind === 'thunderLizard') this.nextCastAt = scene.time.now + Phaser.Math.Between(1200, 2400);
  }
  updateBehavior(player: Player, time: number) {
    if (this.kind === 'thalnosSoul') { this.setVelocity(0, 0); return; }
    if (this.isFrozen(time)) { this.setVelocity(0, 0); return; }
    if(this.kind==='sunscaleScytheclaw'&&!this.enraged&&this.hp<=this.maxHp*.5){this.enraged=true;this.speed*=1.45;this.damage*=1.35;this.setTint(0xffb347);}
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
    } else if(this.kind==='zhevraCharger'){
      this.nextCastAt=time+6000;this.scene.events.emit('zhevra-charge',this,player.x,player.y);
    } else if(this.kind==='windfuryHarpy'){
      this.nextCastAt=time+5200;this.scene.events.emit('harpy-gust',this.x,this.y,player.x,player.y);
    } else if(this.kind==='kolkarWarcaller'){
      this.nextCastAt=time+8000;this.scene.events.emit('kolkar-warcry',this.x,this.y);
    } else if(this.kind==='razormaneGeomancer'){
      this.nextCastAt=time+6500;this.scene.events.emit('geomancer-spikes',player.x,player.y);
    } else if(this.kind==='thunderLizard'){
      this.nextCastAt=time+7000;this.scene.events.emit('thunder-stomp',this.x,this.y);
    }
  }
  applyWarcry(){if(this.boss)return;this.speed=Math.min(this.speed*1.18,180);this.damage=Math.min(this.damage*1.18,55);this.setTint(0xff7652);}
  blockHealing(until: number) { this.healingBlock.block(until); }
  heal(amount: number, time: number) {
    if (this.healingBlock.isBlocked(time)) return 0;
    const restored = Math.min(Math.max(0, amount), this.maxHp - this.hp);
    this.hp += restored;
    return restored;
  }
  isHealingBlocked(time: number) { return this.healingBlock.isBlocked(time); }
  freeze(until: number) { this.frozenUntil = Math.max(this.frozenUntil, until); this.setTint(0xc8f7ff); }
  isFrozen(time: number) { return time < this.frozenUntil; }
}
