import Phaser from 'phaser';
import { Player } from '../entities/Player'; import { Enemy } from '../entities/Enemy'; import { Projectile } from './Projectile';
export class Weapon {
  cooldown=2000; private last=0;
  constructor(private scene: Phaser.Scene, private player: Player, private enemies: Phaser.Physics.Arcade.Group, private projectiles: Phaser.Physics.Arcade.Group) {}
  update(time:number) { if(time-this.last<this.cooldown)return; const targets=this.enemies.getChildren().filter(e=>(e as Enemy).active) as Enemy[]; targets.sort((a,b)=>Phaser.Math.Distance.Between(this.player.x,this.player.y,a.x,a.y)-Phaser.Math.Distance.Between(this.player.x,this.player.y,b.x,b.y)); const target=targets[0]; if(!target)return; this.last=time; const shot=new Projectile(this.scene,this.player.x,this.player.y,20*(this.player.attack/10)); this.projectiles.add(shot); this.scene.physics.moveToObject(shot,target,380); this.scene.time.delayedCall(1800,()=>shot.destroy()); }
}
