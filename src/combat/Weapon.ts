import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from './Projectile';
import type { BasicSkillId, ClassId } from '../classes';
import { BLOODTHIRST, bloodthirstHealing, DEEP_WOUNDS, deepWoundsTickDamage, EXECUTE, executeDamageMultiplier, rotationalMomentumBonus } from './BerserkerSkills';
import { FROST_MAGE_SKILLS, iceLanceDamageMultiplier } from './FrostMageSkills';
import { getSkillRankEffects, SkillLoadout } from '../systems/SkillLoadout';

export type SkillTalent = 'range'|'duration'|'cooldown'|'eternal'|'twin'|'blood'|'fury'|'damage'|'speed'|'control'|'multishot'|'rotational-momentum'|'deep-wounds';
type Blizzard = { x:number; y:number; radius:number; expiresAt:number; nextTick:number; effect:Phaser.GameObjects.Graphics; slowedEnemies:Set<Enemy> };
type DeepWound = { expiresAt:number; nextTick:number };

export class Weapon {
  readonly loadout: SkillLoadout;
  cooldown:number; range=92; duration=650; damageMultiplier=1; projectileSpeed=380;
  hitCooldownReduction=0; permanent=false; twinStrike=false; lifeSteal=false; rageOnHit=2; multishot=1; control=0;
  rotationalMomentumRank=0; deepWoundsRank=0; private pendingWhirlwindHits=0;
  private lastCast=-3000; private lastMortalStrike=-4500; private lastBloodthirst=-BLOODTHIRST.cooldownMs; private lastExecute=-EXECUTE.cooldownMs; private activeUntil=0; private hitEnemies=new Set<Enemy>(); private castDamage=1; private nextPermanentTick=0;
  private blizzards=new Set<Blizzard>();
  private deepWounds=new Map<Enemy,DeepWound>();
  private effect:Phaser.GameObjects.Arc; private blades:Phaser.GameObjects.Graphics; private projectiles:Phaser.Physics.Arcade.Group;
  constructor(private scene:Phaser.Scene,private player:Player,private enemies:Phaser.Physics.Arcade.Group,readonly classId:ClassId,readonly basicSkillId:BasicSkillId){
    this.loadout=new SkillLoadout(classId,basicSkillId);
    this.cooldown=classId==='berserker'?3000:classId==='beast-hunter'?1800:basicSkillId==='frozen-orb'?FROST_MAGE_SKILLS.frozenOrb.cooldownMs:basicSkillId==='ice-lance'?FROST_MAGE_SKILLS.iceLance.cooldownMs:basicSkillId==='blizzard'?FROST_MAGE_SKILLS.blizzard.cooldownMs:2000;
    this.effect=scene.add.circle(player.x,player.y,this.range,0xf08a24,.11).setStrokeStyle(4,0xffc247,.8).setDepth(4).setVisible(false);
    this.blades=scene.add.graphics().setDepth(6).setVisible(false);
    this.projectiles=scene.physics.add.group();
    scene.physics.add.overlap(this.projectiles,enemies,(object,target)=>this.projectileHit(object as Projectile,target as Enemy));
  }
  addSkillCopy(skillId:BasicSkillId){return this.loadout.add(skillId);}
  private rankEffects(skillId:BasicSkillId){return getSkillRankEffects(this.loadout.slots.find(slot=>slot?.skillId===skillId)?.rank??1);}
  private hasSkill(skillId:BasicSkillId){return this.loadout.slots.some(slot=>slot?.skillId===skillId);}
  update(time:number){
    this.updateBlizzards(time);
    this.updateDeepWounds(time);
    if(this.player.silenced){this.drawWhirlwind(time,false);return;}
    if(this.classId!=='berserker'){this.rangedUpdate(time);return;}
    if(this.hasSkill('whirlwind')&&!this.permanent&&time>=this.activeUntil&&time-this.lastCast>=this.effectiveCooldown('whirlwind'))this.castWhirlwind(time);
    if(this.hasSkill('mortal-strike'))this.updateMortalStrike(time);
    if(this.hasSkill('bloodthirst'))this.updateBloodthirst(time);
    if(this.hasSkill('execute'))this.updateExecute(time);
    if(!this.hasSkill('whirlwind')){this.drawWhirlwind(time,false);return;}
    const active=this.permanent||time<this.activeUntil;
    if(this.permanent&&time>=this.nextPermanentTick){this.hitEnemies.clear();this.nextPermanentTick=time+650;}
    this.drawWhirlwind(time,active);if(!active)return;
    for(const enemy of this.enemies.getChildren() as Enemy[]){
      const rank=this.rankEffects('whirlwind');
      if(!enemy.active||this.hitEnemies.has(enemy)||Phaser.Math.Distance.Between(this.player.x,this.player.y,enemy.x,enemy.y)>this.range*rank.rangeMultiplier)continue;
      this.hitEnemies.add(enemy);this.dealSkillDamage(enemy,this.player.calculateAttackDamage(this.damageMultiplier*rank.damageMultiplier*this.castDamage*(this.twinStrike?1.55:1)),time);this.pendingWhirlwindHits++;this.player.gainRage(this.rageOnHit);
      if(this.lifeSteal&&enemy.hp<=0)this.player.heal(this.player.maxHp*.01);
      if(this.hitCooldownReduction&&this.hitEnemies.size%10===0)this.activeUntil+=this.hitCooldownReduction;
      this.scene.events.emit('skill-hit',enemy);
    }
  }
  applyTalent(talent:SkillTalent){
    if(talent==='range')this.range*=1.2;if(talent==='duration')this.duration+=1000;if(talent==='cooldown')this.hitCooldownReduction+=250;
    if(talent==='eternal')this.permanent=true;if(talent==='twin')this.twinStrike=true;if(talent==='blood')this.lifeSteal=true;if(talent==='fury')this.rageOnHit+=2;
    if(talent==='damage')this.damageMultiplier*=1.25;if(talent==='speed'){this.cooldown*=.82;this.projectileSpeed*=1.12;}if(talent==='control')this.control+=.18;if(talent==='multishot')this.multishot++;
    if(talent==='rotational-momentum')this.rotationalMomentumRank=Math.min(3,this.rotationalMomentumRank+1);if(talent==='deep-wounds')this.deepWoundsRank=Math.min(3,this.deepWoundsRank+1);
  }
  private rangedUpdate(time:number){if(time-this.lastCast<this.effectiveCooldown(this.basicSkillId))return;const targets=(this.enemies.getChildren() as Enemy[]).filter(e=>e.active).sort((a,b)=>Phaser.Math.Distance.Between(this.player.x,this.player.y,a.x,a.y)-Phaser.Math.Distance.Between(this.player.x,this.player.y,b.x,b.y));if(!targets.length)return;this.lastCast=time;if(this.basicSkillId==='blizzard'){this.castBlizzard(targets[0],time);return;}for(let i=0;i<this.multishot;i++)this.fireAt(targets[i%targets.length]);}
  private castBlizzard(target:Enemy,time:number){
    const rank=this.rankEffects('blizzard'),{durationMs}=FROST_MAGE_SKILLS.blizzard,radius=FROST_MAGE_SKILLS.blizzard.radius*rank.rangeMultiplier,x=target.x,y=target.y,effect=this.scene.add.graphics().setDepth(2);
    effect.fillStyle(0x65cfff,.16).fillCircle(x,y,radius).lineStyle(3,0xbfefff,.72).strokeCircle(x,y,radius);
    for(let i=0;i<22;i++){const angle=i*2.4,distance=18+(i*37)%(radius-18),flakeX=x+Math.cos(angle)*distance,flakeY=y+Math.sin(angle)*distance;effect.fillStyle(i%3?0xd8f8ff:0x83ddff,.75).fillCircle(flakeX,flakeY,2+i%2);}
    this.scene.tweens.add({targets:effect,alpha:.48,duration:420,yoyo:true,repeat:-1});
    this.blizzards.add({x,y,radius,expiresAt:time+durationMs,nextTick:time,effect,slowedEnemies:new Set()});
  }
  private updateBlizzards(time:number){
    for(const storm of this.blizzards){
      if(time>=storm.expiresAt){this.scene.tweens.killTweensOf(storm.effect);storm.effect.destroy();this.blizzards.delete(storm);continue;}
      if(time<storm.nextTick)continue;storm.nextTick+=FROST_MAGE_SKILLS.blizzard.tickMs;
      for(const enemy of this.enemies.getChildren() as Enemy[]){
        if(!enemy.active||Phaser.Math.Distance.Between(storm.x,storm.y,enemy.x,enemy.y)>storm.radius)continue;
        this.dealSkillDamage(enemy,this.player.calculateSpellDamage(this.damageMultiplier*this.rankEffects('blizzard').damageMultiplier*FROST_MAGE_SKILLS.blizzard.damageMultiplier),time);
        if(!storm.slowedEnemies.has(enemy)){storm.slowedEnemies.add(enemy);enemy.speed=Math.max(28,enemy.speed*(1-FROST_MAGE_SKILLS.blizzard.slow-this.control));enemy.setTint(0x8edcff);this.scene.time.delayedCall(1800,()=>enemy.active&&!enemy.isFrozen(this.scene.time.now)&&enemy.clearTint());}
        this.scene.events.emit('skill-hit',enemy);
      }
    }
  }
  private fireAt(target:Enemy){
    const frost=this.classId==='frost-mage',orb=this.basicSkillId==='frozen-orb',lance=this.basicSkillId==='ice-lance';
    const texture=orb?'frozen-orb':lance?'ice-lance':frost?'frost':this.classId==='beast-hunter'?'beast':'flame';
    const base=this.classId==='beast-hunter'?1.35:orb?FROST_MAGE_SKILLS.frozenOrb.damageMultiplier:lance?iceLanceDamageMultiplier(target.isFrozen(this.scene.time.now)):1;
    const rank=this.rankEffects(this.basicSkillId),shot=new Projectile(this.scene,this.player.x,this.player.y,(this.classId==='fire-mage'||frost?this.player.calculateSpellDamage(this.damageMultiplier*rank.damageMultiplier*base):this.player.calculateAttackDamage(this.damageMultiplier*rank.damageMultiplier*base)),texture);
    shot.skill=orb?'frozen-orb':lance?'ice-lance':frost?'frostbolt':'standard';shot.slow=frost?(orb?FROST_MAGE_SKILLS.frozenOrb.slow:FROST_MAGE_SKILLS.frostbolt.slow)+this.control:0;
    if(orb)shot.setCircle(FROST_MAGE_SKILLS.frozenOrb.radius*rank.rangeMultiplier).setScale(1.35*rank.rangeMultiplier);
    this.projectiles.add(shot);this.scene.physics.moveToObject(shot,target,orb?FROST_MAGE_SKILLS.frozenOrb.speed:lance?FROST_MAGE_SKILLS.iceLance.speed:this.projectileSpeed);
    this.scene.time.delayedCall(orb?FROST_MAGE_SKILLS.frozenOrb.lifetimeMs:1800,()=>shot.active&&shot.destroy());
  }
  private projectileHit(shot:Projectile,enemy:Enemy){
    if(!shot.active||!enemy.active||shot.hitEnemies.has(enemy))return;shot.hitEnemies.add(enemy);this.dealSkillDamage(enemy,shot.damage,this.scene.time.now);
    if(shot.skill==='frostbolt'&&Math.random()<FROST_MAGE_SKILLS.frostbolt.freezeChance){enemy.freeze(this.scene.time.now+FROST_MAGE_SKILLS.frostbolt.freezeMs);this.scene.time.delayedCall(FROST_MAGE_SKILLS.frostbolt.freezeMs,()=>enemy.active&&!enemy.isFrozen(this.scene.time.now)&&enemy.clearTint());}
    else if(shot.slow){enemy.speed=Math.max(28,enemy.speed*(1-shot.slow));enemy.setTint(0x8edcff);this.scene.time.delayedCall(1800,()=>enemy.active&&!enemy.isFrozen(this.scene.time.now)&&enemy.clearTint());}
    if(shot.skill!=='frozen-orb')shot.destroy();this.scene.events.emit('skill-hit',enemy);
  }
  private effectiveCooldown(skillId:BasicSkillId){return this.cooldown*this.rankEffects(skillId).cooldownMultiplier/(1+Math.max(0,this.player.totalHaste)/100);}
  private castWhirlwind(time:number){this.lastCast=time;this.activeUntil=time+this.duration;this.hitEnemies.clear();this.castDamage=this.player.spendRage(50)?1.5:1;this.scene.cameras.main.shake(55,.002);}
  private updateMortalStrike(time:number){
    const rank=this.rankEffects('mortal-strike');if(time-this.lastMortalStrike<4500*rank.cooldownMultiplier/(1+Math.max(0,this.player.totalHaste)/100))return;
    const target=(this.enemies.getChildren() as Enemy[]).filter(enemy=>enemy.active&&enemy.hp>0&&Phaser.Math.Distance.Between(this.player.x,this.player.y,enemy.x,enemy.y)<=145*rank.rangeMultiplier).sort((a,b)=>Phaser.Math.Distance.Between(this.player.x,this.player.y,a.x,a.y)-Phaser.Math.Distance.Between(this.player.x,this.player.y,b.x,b.y))[0];
    if(!target)return;
    const momentum=rotationalMomentumBonus(this.rotationalMomentumRank,this.pendingWhirlwindHits);this.pendingWhirlwindHits=0;
    this.lastMortalStrike=time;this.dealSkillDamage(target,this.player.calculateAttackDamage(2.8*this.damageMultiplier*rank.damageMultiplier*(1+momentum)),time);target.blockHealing(time+5000);this.player.gainRage(8);
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
    const rank=this.rankEffects('bloodthirst');if(time-this.lastBloodthirst<BLOODTHIRST.cooldownMs*rank.cooldownMultiplier/(1+Math.max(0,this.player.totalHaste)/100))return;
    const target=this.nearestTargetInRange(BLOODTHIRST.range*rank.rangeMultiplier);if(!target)return;
    this.lastBloodthirst=time;this.dealSkillDamage(target,this.player.calculateAttackDamage(BLOODTHIRST.damageMultiplier*this.damageMultiplier*rank.damageMultiplier),time);this.player.gainRage(6);
    const healing=bloodthirstHealing(this.player.maxHp,Math.random());if(healing)this.player.heal(healing);
    this.drawMeleeStrike(target,0xff4055,'嗜血',healing?`恢复 ${Math.ceil(healing)}`:undefined);this.scene.events.emit('skill-hit',target);
  }
  private updateExecute(time:number){
    const rank=this.rankEffects('execute');if(time-this.lastExecute<EXECUTE.cooldownMs*rank.cooldownMultiplier/(1+Math.max(0,this.player.totalHaste)/100))return;
    const target=this.nearestTargetInRange(EXECUTE.range*rank.rangeMultiplier);if(!target)return;
    const empowered=target.hp/target.maxHp<=EXECUTE.healthThreshold;
    this.lastExecute=time;this.dealSkillDamage(target,this.player.calculateAttackDamage(executeDamageMultiplier(target.hp,target.maxHp)*this.damageMultiplier*rank.damageMultiplier),time);this.player.gainRage(5);
    this.drawMeleeStrike(target,empowered?0xffd24a:0xbcc8d8,empowered?'斩杀！':'斩杀');this.scene.events.emit('skill-hit',target);
  }
  private drawMeleeStrike(target:Enemy,color:number,label:string,subLabel?:string){
    const angle=Phaser.Math.Angle.Between(this.player.x,this.player.y,target.x,target.y),strike=this.scene.add.graphics().setDepth(7);
    strike.lineStyle(10,color,.95).lineBetween(this.player.x+Math.cos(angle)*20,this.player.y+Math.sin(angle)*20,target.x,target.y);
    this.scene.tweens.add({targets:strike,alpha:0,duration:190,onComplete:()=>strike.destroy()});
    const text=this.scene.add.text(target.x,target.y-30,subLabel?`${label} · ${subLabel}`:label,{fontSize:'13px',fontStyle:'bold',color:'#fff3c4',stroke:'#321016',strokeThickness:3}).setOrigin(.5).setDepth(8);
    this.scene.tweens.add({targets:text,y:text.y-18,alpha:0,duration:650,onComplete:()=>text.destroy()});this.scene.cameras.main.shake(75,.003);
  }
  private dealSkillDamage(enemy:Enemy,damage:number,time:number){const critical=this.player.rollCritical();enemy.hp-=damage*(critical?2:1);this.player.dealtDamage(time);if(critical&&this.deepWoundsRank)this.deepWounds.set(enemy,{expiresAt:time+DEEP_WOUNDS.durationMs,nextTick:time+DEEP_WOUNDS.tickMs});}
  private updateDeepWounds(time:number){for(const [enemy,wound] of this.deepWounds){if(!enemy.active||time>=wound.expiresAt){this.deepWounds.delete(enemy);continue;}if(time<wound.nextTick)continue;wound.nextTick+=DEEP_WOUNDS.tickMs;enemy.hp-=deepWoundsTickDamage(this.deepWoundsRank,this.player.attackPower,this.player.totalHaste)*(1+this.player.versatility/100);this.player.dealtDamage(time);this.scene.events.emit('skill-hit',enemy);}}
  private drawWhirlwind(time:number,active:boolean){const rank=this.rankEffects('whirlwind');this.effect.setPosition(this.player.x,this.player.y).setRadius(this.range*rank.rangeMultiplier).setVisible(active);this.blades.clear().setVisible(active);if(!active)return;const count=this.twinStrike?4:2;this.blades.lineStyle(8,0xe7edf4,.9);for(let i=0;i<count;i++){const angle=time*.012+i*Math.PI*2/count;this.blades.lineBetween(this.player.x+Math.cos(angle)*this.range*rank.rangeMultiplier*.25,this.player.y+Math.sin(angle)*this.range*rank.rangeMultiplier*.25,this.player.x+Math.cos(angle)*this.range*rank.rangeMultiplier*.88,this.player.y+Math.sin(angle)*this.range*rank.rangeMultiplier*.88);}}
}
