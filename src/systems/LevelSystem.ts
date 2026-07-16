import Phaser from 'phaser'; import { Player } from '../entities/Player'; import { Weapon } from '../combat/Weapon'; import { GameUI } from '../ui/UI';
export type Upgrade={title:string;description:string;apply:()=>void};
export class LevelSystem {
 constructor(private scene:Phaser.Scene,private player:Player,private weapon:Weapon,private ui:GameUI){}
 show(){this.scene.physics.pause(); const all:Upgrade[]=[{title:'猛虎之力',description:'+20% 攻击力',apply:()=>this.player.attack*=1.2},{title:'疾风连击',description:'-15% 攻击间隔',apply:()=>this.weapon.cooldown*=.85},{title:'踏风步法',description:'+15% 移动速度',apply:()=>this.player.speed*=1.15}]; this.ui.showUpgrades(Phaser.Utils.Array.Shuffle(all).slice(0,3),u=>{u.apply();this.ui.hideUpgrades();this.scene.physics.resume();});}
}
