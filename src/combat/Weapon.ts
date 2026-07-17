import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from './Projectile';
import type { ClassId } from '../classes';

export type SkillTalent = 'range'|'duration'|'cooldown'|'eternal'|'twin'|'blood'|'fury'|'damage'|'speed'|'control'|'multishot';

export class Weapon {
  cooldown:number; range=92; duration=650; damageMultiplier=1; projectileSpeed=380;
  hitCooldownReduction=0; permanent=false; twinStrike=false; lifeSteal=false; rageOnHit=2; multishot=1; control=0;
  private lastCast=-3000; private activeUntil=0; private hitEnemies=new Set<Enemy>(); private castDamage=1; private nextPermanentTick=0;
  private effect:Phaser.GameObjects.Arc; private blades:Phaser.GameObjects.Graphics; private projectiles:Phaser.Physics.Arcade.Group;
  constructor(private scene:Phaser.Scene,private player:Player,private enemies:Phaser.Physics.Arcade.Group,readonly classId:ClassId){
    this.cooldown=classId==='berserker'?3000:classId==='beast-hunter'?1800:2000;
    this.effect=scene.add.circle(player.x,player.y,this.range,0xf08a24,.11).setStrokeStyle(4,0xffc247,.8).setDepth(4).setVisible(false);
    this.blades=scene.add.graphics().setDepth(6).setVisible(false);
    this.projectiles=scene.physics.add.group();
    scene.physics.add.overlap(this.projectiles,enemies,(object,target)=>this.projectileHit(object as Projectile,target as Enemy));
  }
  update(time:number){
    if(this.classId!=='berserker'){this.rangedUpdate(time);return;}
    if(!this.permanent&&time>=this.activeUntil&&time-this.lastCast>=this.cooldown)this.castWhirlwind(time);
    const active=this.permanent||time<this.activeUntil;
    if(this.permanent&&time>=this.nextPermanentTick){this.hitEnemies.clear();this.nextPermanentTick=time+650;}
    this.drawWhirlwind(time,active);if(!active)return;
    for(const enemy of this.enemies.getChildren() as Enemy[]){
      if(!enemy.active||this.hitEnemies.has(enemy)||Phaser.Math.Distance.Between(this.player.x,this.player.y,enemy.x,enemy.y)>this.range)continue;
      this.hitEnemies.add(enemy);enemy.hp-=this.player.attack*this.damageMultiplier*this.castDamage*(this.twinStrike?1.55:1);this.player.gainRage(this.rageOnHit);
      if(this.lifeSteal&&enemy.hp<=0)this.player.heal(this.player.maxHp*.01);
      if(this.hitCooldownReduction&&this.hitEnemies.size%10===0)this.activeUntil+=this.hitCooldownReduction;
      this.scene.events.emit('skill-hit',enemy);
    }
  }
  applyTalent(talent:SkillTalent){
    if(talent==='range')this.range*=1.2;if(talent==='duration')this.duration+=1000;if(talent==='cooldown')this.hitCooldownReduction+=250;
    if(talent==='eternal')this.permanent=true;if(talent==='twin')this.twinStrike=true;if(talent==='blood')this.lifeSteal=true;if(talent==='fury')this.rageOnHit+=2;
    if(talent==='damage')this.damageMultiplier*=1.25;if(talent==='speed'){this.cooldown*=.82;this.projectileSpeed*=1.12;}if(talent==='control')this.control+=.18;if(talent==='multishot')this.multishot++;
  }
  private rangedUpdate(time:number){if(time-this.lastCast<this.cooldown)return;const targets=(this.enemies.getChildren() as Enemy[]).filter(e=>e.active).sort((a,b)=>Phaser.Math.Distance.Between(this.player.x,this.player.y,a.x,a.y)-Phaser.Math.Distance.Between(this.player.x,this.player.y,b.x,b.y));if(!targets.length)return;this.lastCast=time;for(let i=0;i<this.multishot;i++)this.fireAt(targets[i%targets.length]);}
  private fireAt(target:Enemy){const texture=this.classId==='frost-mage'?'frost':this.classId==='beast-hunter'?'beast':'flame';const base=this.classId==='beast-hunter'?1.35:1;const shot=new Projectile(this.scene,this.player.x,this.player.y,this.player.attack*this.damageMultiplier*base,texture);shot.slow=this.classId==='frost-mage'?.25+this.control:0;this.projectiles.add(shot);this.scene.physics.moveToObject(shot,target,this.projectileSpeed);this.scene.time.delayedCall(1800,()=>shot.destroy());}
  private projectileHit(shot:Projectile,enemy:Enemy){if(!shot.active||!enemy.active)return;enemy.hp-=shot.damage;if(shot.slow){enemy.speed=Math.max(28,enemy.speed*(1-shot.slow));enemy.setTint(0x8edcff);this.scene.time.delayedCall(1800,()=>enemy.active&&enemy.clearTint());}shot.destroy();this.scene.events.emit('skill-hit',enemy);}
  private castWhirlwind(time:number){this.lastCast=time;this.activeUntil=time+this.duration;this.hitEnemies.clear();this.castDamage=this.player.spendRage(50)?1.5:1;this.scene.cameras.main.shake(55,.002);}
  private drawWhirlwind(time:number,active:boolean){this.effect.setPosition(this.player.x,this.player.y).setRadius(this.range).setVisible(active);this.blades.clear().setVisible(active);if(!active)return;const count=this.twinStrike?4:2;this.blades.lineStyle(8,0xe7edf4,.9);for(let i=0;i<count;i++){const angle=time*.012+i*Math.PI*2/count;this.blades.lineBetween(this.player.x+Math.cos(angle)*this.range*.25,this.player.y+Math.sin(angle)*this.range*.25,this.player.x+Math.cos(angle)*this.range*.88,this.player.y+Math.sin(angle)*this.range*.88);}}
}
