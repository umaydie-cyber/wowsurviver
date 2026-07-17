import Phaser from 'phaser'; import { Player } from '../entities/Player'; import { Weapon, type WhirlwindTalent } from '../combat/Weapon'; import { GameUI } from '../ui/UI';
export type Upgrade = { id:string; title:string; tag:string; description:string; apply:()=>void };
export class LevelSystem {
 private owned=new Set<string>();
 constructor(private scene:Phaser.Scene,private player:Player,private weapon:Weapon,private ui:GameUI){}
 show(){this.scene.physics.pause();const talents:Array<Omit<Upgrade,'apply'>&{talent?:WhirlwindTalent;requires?:string;repeat?:boolean}>=[
  {id:'range',title:'扩张利刃',tag:'旋风斩强化',description:'范围 +20%',talent:'range',repeat:true},{id:'duration',title:'延长风暴',tag:'旋风斩强化',description:'持续时间 +1 秒',talent:'duration',repeat:true},{id:'fury',title:'沸腾怒火',tag:'狂怒天赋',description:'命中产生的怒气翻倍',talent:'fury'},{id:'twin',title:'双斧',tag:'狂怒天赋',description:'追加一次 55% 反向斩击',talent:'twin'},{id:'cooldown',title:'越战越勇',tag:'狂怒天赋',description:'每命中 10 个敌人，延长旋转 0.25 秒',talent:'cooldown',requires:'fury'},{id:'blood',title:'血路',tag:'生存天赋',description:'旋风斩击杀恢复 1% 生命',talent:'blood'},{id:'eternal',title:'永恒刀阵',tag:'顶点天赋',description:'旋风斩变为永久旋转',talent:'eternal',requires:'cooldown'},{id:'power',title:'残酷武器',tag:'通用强化',description:'武器伤害 +18%',repeat:true},{id:'stride',title:'狂乱步伐',tag:'通用强化',description:'移动速度 +12%',repeat:true},{id:'vitality',title:'战痕累累',tag:'通用强化',description:'最大生命 +20，并立即回复',repeat:true}];
 const items=Phaser.Utils.Array.Shuffle(talents.filter(t=>(!t.requires||this.owned.has(t.requires))&&(t.repeat||!this.owned.has(t.id)))).slice(0,4).map(t=>({...t,apply:()=>{if(!t.repeat)this.owned.add(t.id);if(t.talent)this.weapon.applyTalent(t.talent);if(t.id==='power')this.player.attack*=1.18;if(t.id==='stride')this.player.speed*=1.12;if(t.id==='vitality'){this.player.maxHp+=20;this.player.heal(20);}}}));
 this.ui.showUpgrades(items,u=>{u.apply();this.ui.hideUpgrades();this.scene.physics.resume();});}
}
