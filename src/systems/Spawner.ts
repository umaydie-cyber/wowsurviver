import Phaser from 'phaser'; import { Enemy } from '../entities/Enemy'; import { Player } from '../entities/Player';
export class Spawner {
  private wave=0; bossSpawned=false;
  constructor(private scene:Phaser.Scene,private enemies:Phaser.Physics.Arcade.Group,private player:Player) {}
  start(){ this.spawnWave(10); this.scene.time.addEvent({delay:30000,loop:true,callback:()=>this.spawnWave(10+(++this.wave*3))}); }
  update(elapsed:number){ if(elapsed>=300 && !this.bossSpawned){this.bossSpawned=true;this.spawn(true);} }
  private spawnWave(n:number){for(let i=0;i<n;i++)this.spawn(false);}
  private spawn(boss:boolean){const angle=Math.random()*Math.PI*2, distance=Phaser.Math.Between(430,650); const e=new Enemy(this.scene,this.player.x+Math.cos(angle)*distance,this.player.y+Math.sin(angle)*distance,boss); this.enemies.add(e);}
}
