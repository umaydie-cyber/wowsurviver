import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from './Projectile';
import type { ClassId } from '../classes';
import { BLOODTHIRST, bloodthirstHealing, EXECUTE, executeDamageMultiplier } from './BerserkerSkills';

export type SkillTalent = 'range'|'duration'|'cooldown'|'eternal'|'twin'|'blood'|'fury'|'damage'|'speed'|'control'|'multishot';

export class Weapon {
  cooldown:number; range=92; duration=650; damageMultiplier=1; projectileSpeed=380;
  hitCooldownReduction=0; permanent=false; twinStrike=false; lifeSteal=false; rageOnHit=2; multishot=1; control=0;
  private lastCast=-3000; private lastMortalStrike=-4500; private lastBloodthirst=-BLOODTHIRST.cooldownMs; private lastExecute=-EXECUTE.cooldownMs; private activeUntil=0; private hitEnemies=new Set<Enemy>(); private castDamage=1; private nextPermanentTick=0;
  private effect:Phaser.GameObjects.Arc; private blades:Phaser.GameObjects.Graphics; private projectiles:Phaser.Physics.Arcade.Group;
  constructor(private scene:Phaser.Scene,private player:Player,private enemies:Phaser.Physics.Arcade.Group,readonly classId:ClassId){
    this.cooldown=classId==='berserker'?3000:classId==='beast-hunter'?1800:2000;
    this.effect=scene.add.circle(player.x,player.y,this.range,0xf08a24,.11).setStrokeStyle(4,0xffc247,.8).setDepth(4).setVisible(false);
    this.blades=scene.add.graphics().setDepth(6).setVisible(false);
    this.projectiles=scene.physics.add.group();
    scene.physics.add.overlap(this.projectiles,enemies,(object,target)=>this.projectileHit(object as Projectile,target as Enemy));
  }
  update(time:number){
    if(this.player.silenced){this.drawWhirlwind(time,false);return;}
    if(this.classId!=='berserker'){this.rangedUpdate(time);return;}
    if(!this.permanent&&time>=this.activeUntil&&time-this.lastCast>=this.effectiveCooldown)this.castWhirlwind(time);
    this.updateMortalStrike(time);
    this.updateBloodthirst(time);
    this.updateExecute(time);
    const active=this.permanent||time<this.activeUntil;
    if(this.permanent&&time>=this.nextPermanentTick){this.hitEnemies.clear();this.nextPermanentTick=time+650;}
    this.drawWhirlwind(time,active);if(!active)return;
    for(const enemy of this.enemies.getChildren() as Enemy[]){
      if(!enemy.active||this.hitEnemies.has(enemy)||Phaser.Math.Distance.Between(this.player.x,this.player.y,enemy.x,enemy.y)>this.range)continue;
      this.hitEnemies.add(enemy);enemy.hp-=this.player.calculateAttackDamage(this.damageMultiplier*this.castDamage*(this.twinStrike?1.55:1));this.player.dealtDamage(time);this.player.gainRage(this.rageOnHit);
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
  private rangedUpdate(time:number){if(time-this.lastCast<this.effectiveCooldown)return;const targets=(this.enemies.getChildren() as Enemy[]).filter(e=>e.active).sort((a,b)=>Phaser.Math.Distance.Between(this.player.x,this.player.y,a.x,a.y)-Phaser.Math.Distance.Between(this.player.x,this.player.y,b.x,b.y));if(!targets.length)return;this.lastCast=time;for(let i=0;i<this.multishot;i++)this.fireAt(targets[i%targets.length]);}
  private fireAt(target:Enemy){const texture=this.classId==='frost-mage'?'frost':this.classId==='beast-hunter'?'beast':'flame';const base=this.classId==='beast-hunter'?1.35:1;const shot=new Projectile(this.scene,this.player.x,this.player.y,(this.classId==='fire-mage'||this.classId==='frost-mage'?this.player.calculateSpellDamage(this.damageMultiplier*base):this.player.calculateAttackDamage(this.damageMultiplier*base)),texture);shot.slow=this.classId==='frost-mage'?.25+this.control:0;this.projectiles.add(shot);this.scene.physics.moveToObject(shot,target,this.projectileSpeed);this.scene.time.delayedCall(1800,()=>shot.destroy());}
  private projectileHit(shot:Projectile,enemy:Enemy){if(!shot.active||!enemy.active)return;enemy.hp-=shot.damage;this.player.dealtDamage();if(shot.slow){enemy.speed=Math.max(28,enemy.speed*(1-shot.slow));enemy.setTint(0x8edcff);this.scene.time.delayedCall(1800,()=>enemy.active&&enemy.clearTint());}shot.destroy();this.scene.events.emit('skill-hit',enemy);}
  private get effectiveCooldown(){return this.cooldown/(1+Math.max(0,this.player.totalHaste)/100);}
  private castWhirlwind(time:number){this.lastCast=time;this.activeUntil=time+this.duration;this.hitEnemies.clear();this.castDamage=this.player.spendRage(50)?1.5:1;this.scene.cameras.main.shake(55,.002);}
  private updateMortalStrike(time:number){
    if(time-this.lastMortalStrike<4500/(1+Math.max(0,this.player.totalHaste)/100))return;
    const target=(this.enemies.getChildren() as Enemy[]).filter(enemy=>enemy.active&&enemy.hp>0&&Phaser.Math.Distance.Between(this.player.x,this.player.y,enemy.x,enemy.y)<=145).sort((a,b)=>Phaser.Math.Distance.Between(this.player.x,this.player.y,a.x,a.y)-Phaser.Math.Distance.Between(this.player.x,this.player.y,b.x,b.y))[0];
    if(!target)return;
    this.lastMortalStrike=time;target.hp-=this.player.calculateAttackDamage(2.8*this.damageMultiplier);target.blockHealing(time+5000);this.player.dealtDamage(time);this.player.gainRage(8);
    const angle=Phaser.Math.Angle.Between(this.player.x,this.player.y,target.x,target.y),slash=this.scene.add.graphics().setDepth(7);
    slash.lineStyle(12,0xe8e8e8,.95).lineBetween(this.player.x+Math.cos(angle)*22,this.player.y+Math.sin(angle)*22,target.x,target.y);
    slash.lineStyle(4,0xb51f2e,1).lineBetween(this.player.x+Math.cos(angle)*28,this.player.y+Math.sin(angle)*28,target.x+Math.cos(angle)*8,target.y+Math.sin(angle)*8);
    this.scene.tweens.add({targets:slash,alpha:0,duration:240,onComplete:()=>slash.destroy()});
    const wound=this.scene.add.text(target.x,target.y-30,'禁疗',{fontSize:'13px',fontStyle:'bold',color:'#ff6675',stroke:'#31060b',strokeThickness:3}).setOrigin(.5).setDepth(8);
    this.scene.tweens.add({targets:wound,y:wound.y-18,alpha:0,duration:700,onComplete:()=>wound.destroy()});
    this.scene.cameras.main.shake(90,.004);this.scene.events.emit('skill-hit',target);
  }
  private nearestTargetInRange(range:number){
    return (this.enemies.getChildren() as Enemy[]).filter(enemy=>enemy.active&&enemy.hp>0&&Phaser.Math.Distance.Between(this.player.x,this.player.y,enemy.x,enemy.y)<=range).sort((a,b)=>Phaser.Math.Distance.Between(this.player.x,this.player.y,a.x,a.y)-Phaser.Math.Distance.Between(this.player.x,this.player.y,b.x,b.y))[0];
  }
  private updateBloodthirst(time:number){
    if(time-this.lastBloodthirst<BLOODTHIRST.cooldownMs/(1+Math.max(0,this.player.totalHaste)/100))return;
    const target=this.nearestTargetInRange(BLOODTHIRST.range);if(!target)return;
    this.lastBloodthirst=time;target.hp-=this.player.calculateAttackDamage(BLOODTHIRST.damageMultiplier*this.damageMultiplier);this.player.dealtDamage(time);this.player.gainRage(6);
    const healing=bloodthirstHealing(this.player.maxHp,Math.random());if(healing)this.player.heal(healing);
    this.drawMeleeStrike(target,0xff4055,'嗜血',healing?`恢复 ${Math.ceil(healing)}`:undefined);this.scene.events.emit('skill-hit',target);
  }
  private updateExecute(time:number){
    if(time-this.lastExecute<EXECUTE.cooldownMs/(1+Math.max(0,this.player.totalHaste)/100))return;
    const target=this.nearestTargetInRange(EXECUTE.range);if(!target)return;
    const empowered=target.hp/target.maxHp<=EXECUTE.healthThreshold;
    this.lastExecute=time;target.hp-=this.player.calculateAttackDamage(executeDamageMultiplier(target.hp,target.maxHp)*this.damageMultiplier);this.player.dealtDamage(time);this.player.gainRage(5);
    this.drawMeleeStrike(target,empowered?0xffd24a:0xbcc8d8,empowered?'斩杀！':'斩杀');this.scene.events.emit('skill-hit',target);
  }
  private drawMeleeStrike(target:Enemy,color:number,label:string,subLabel?:string){
    const angle=Phaser.Math.Angle.Between(this.player.x,this.player.y,target.x,target.y),strike=this.scene.add.graphics().setDepth(7);
    strike.lineStyle(10,color,.95).lineBetween(this.player.x+Math.cos(angle)*20,this.player.y+Math.sin(angle)*20,target.x,target.y);
    this.scene.tweens.add({targets:strike,alpha:0,duration:190,onComplete:()=>strike.destroy()});
    const text=this.scene.add.text(target.x,target.y-30,subLabel?`${label} · ${subLabel}`:label,{fontSize:'13px',fontStyle:'bold',color:'#fff3c4',stroke:'#321016',strokeThickness:3}).setOrigin(.5).setDepth(8);
    this.scene.tweens.add({targets:text,y:text.y-18,alpha:0,duration:650,onComplete:()=>text.destroy()});this.scene.cameras.main.shake(75,.003);
  }
  private drawWhirlwind(time:number,active:boolean){this.effect.setPosition(this.player.x,this.player.y).setRadius(this.range).setVisible(active);this.blades.clear().setVisible(active);if(!active)return;const count=this.twinStrike?4:2;this.blades.lineStyle(8,0xe7edf4,.9);for(let i=0;i<count;i++){const angle=time*.012+i*Math.PI*2/count;this.blades.lineBetween(this.player.x+Math.cos(angle)*this.range*.25,this.player.y+Math.sin(angle)*this.range*.25,this.player.x+Math.cos(angle)*this.range*.88,this.player.y+Math.sin(angle)*this.range*.88);}}
}
